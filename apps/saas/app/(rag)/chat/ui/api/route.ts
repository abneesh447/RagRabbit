import { getChatLanguageModel } from "../../../../../lib/get-chat-model";
import { UserError } from "@repo/core";
import { Source } from "@repo/design/components/chat/source-box";
import { getPrompt } from "@repo/rag/answering/prompt";
import { getRagRetriever } from "@repo/rag/answering/llamaindex";
import { Metadata, MetadataMode, NodeWithScore } from "@repo/rag/llamaindex.mjs";
import { appendClientMessage, createDataStreamResponse, createIdGenerator, generateId, Message, streamText } from "ai";
import { checkLimitsIp, checkLimitsUsage, loadMessages, ResponseMessage, saveMessages } from "./db";

export const maxDuration = 30;

const SOURCES_RAG = 8;

/** Handle new message with rate and usage limits before streaming. */
export async function POST(req: Request, res: Response) {
  const orgId = 1;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip");

  try {
    await checkLimitsIp(orgId, ip);
    await checkLimitsUsage(orgId);
    return handleRequest(ip, orgId, req, res);
  } catch (e) {
    if (e instanceof UserError) {
      return new Response(e.message, { status: e.status });
    }
    console.error("Chat POST failed", e);
    return new Response("Internal server error", { status: 500 });
  }
}

function normalizeMessageContent(content: Message["content"]): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if ("text" in part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("");
  }
  return String(content ?? "");
}

function parseUserChatId(userChatId: string): { userId: string; chatId: string } {
  const separatorIndex = userChatId.indexOf("-");
  if (separatorIndex === -1) {
    return { userId: userChatId, chatId: "default" };
  }
  return {
    userId: userChatId.slice(0, separatorIndex),
    chatId: userChatId.slice(separatorIndex + 1),
  };
}

async function handleRequest(ip: string, orgId: number, req: Request, res: Response) {
  const { message: rawMessage, id, userChatId }: { message: Message; id: string; userChatId: string } =
    await req.json();

  const message: Message = {
    ...rawMessage,
    content: normalizeMessageContent(rawMessage.content).slice(0, 1000),
  };

  const { userId, chatId } = parseUserChatId(userChatId);

  const messagesPromise = loadMessages(userId, chatId);

  return createDataStreamResponse({
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Chat failed";
      console.error("Chat stream error:", error);
      return message;
    },
    execute: async (dataStream) => {
      // Retrieve (embedding models can fail on serverless — still answer without RAG):
      let relevantSources: NodeWithScore<Metadata>[] = [];
      try {
        const retriever = await getRagRetriever();
        relevantSources = await retriever.retrieve({
          query: String(message.content),
        });
      } catch (retrieveError) {
        console.error("RAG retrieve failed", retrieveError);
      }

      // Format sources and context text:
      let { sources, content, suggestedPrompts } = processSources(relevantSources);

      const sourcesAnnotation = {
        type: "sources",
        data: sources,
      };
      dataStream.writeMessageAnnotation(sourcesAnnotation);

      let messages = (await messagesPromise).filter((m) => normalizeMessageContent(m.content).length > 0);
      const contextMessage = "Use the following documentation to answer the question";
      messages = messages.filter((m) => !String(m.content).startsWith(contextMessage));

      const ragContext =
        content.length > 0
          ? `${contextMessage}:\n\n${content.slice(0, SOURCES_RAG).join("\n")}`
          : `${contextMessage}:\n\n(No indexed documentation is available yet. Greet the user briefly and explain that indexing content will improve answers.)`;

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: ragContext,
      };

      messages = appendClientMessage({
        messages,
        message,
      });

      // Save the chat in the background:
      const savePromise = saveMessages(
        chatId,
        userId,
        ip,
        orgId,
        message,
        assistantMessage,
        null,
        {
          sources: sourcesAnnotation,
        },
        null
      );

      const result = streamText({
        model: getChatLanguageModel(),
        system: `${getPrompt()}\n\n${ragContext}`,
        messages,
        // manual format for server-side messages since we allow branching from the frontend:
        experimental_generateMessageId: createIdGenerator({
          prefix: "msgs",
          size: 16,
        }),
        async onFinish({ response, usage }) {
          // Add a few suggested questions:
          const suggestedPromptsAnnotation = {
            type: "suggested-prompts",
            data: Array.from(suggestedPrompts).reverse().slice(0, 3),
          };
          dataStream.writeMessageAnnotation(suggestedPromptsAnnotation);

          // Save the chat:
          await savePromise;
          await saveMessages(
            chatId,
            userId,
            ip,
            orgId,
            null,
            null,
            response.messages as ResponseMessage[],
            {
              sources: sourcesAnnotation,
              suggestedPrompts: suggestedPromptsAnnotation,
            },
            usage
          );
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}

/**
 * Prepare annotations, the text with the sources and extract a few suggested questions:
 */
function processSources(relevantSources: NodeWithScore<Metadata>[]) {
  let content = [];
  let sources = [];
  let suggestedPrompts = new Set<string>();
  for (const source of relevantSources) {
    const metadata: Metadata = source.node.metadata;
    // Skip duplicates:
    if (sources.find((s) => s.url === metadata.pageUrl)) {
      continue;
    }
    sources.push({
      url: metadata.pageUrl,
      title: metadata.pageTitle,
      abstract: metadata.pageDescription?.slice(0, 100),
      score: Number(source.score.toFixed(2)),
    } as Source);

    let text = "--- \n";
    text += "Source: " + metadata.pageTitle + "\n";
    text += "URL: " + metadata.pageUrl + "\n";
    text += "---\n";
    text += source.node.getContent(MetadataMode.NONE) + "\n";
    content.push(text);

    // Pick the first question:
    const question = source.node.metadata.questions?.[0];
    suggestedPrompts.add(question);
  }
  return { sources, content, suggestedPrompts };
}
