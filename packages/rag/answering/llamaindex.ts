import { ContextChatEngine, QueryEngineTool, VectorStoreIndex } from "llamaindex";
import { getVectorStore } from "../indexing/llamaindex";
import { getPrompt } from "./prompt";
import "../settings";

export { getPrompt, systemPrompt } from "./prompt";

export async function getRagTool() {
  const index = await VectorStoreIndex.fromVectorStore(await getVectorStore());
  const tool = new QueryEngineTool({
    queryEngine: index.asQueryEngine({ similarityTopK: 8 }),
    metadata: {
      name: "rag_tool",
      description: `This tool can answer detailed questions.`,
    },
  });
  return tool;
}

export async function getRagRetriever(organizationId?: number) {
  const index = await VectorStoreIndex.fromVectorStore(await getVectorStore());
  const retriever = index.asRetriever({
    similarityTopK: 8,
    filters: organizationId
      ? {
          filters: [{ key: "metadata.organizationId", value: organizationId, operator: "==" }],
        }
      : undefined,
  });
  return retriever;
}

export async function getRagContextChat(language?: string, organizationId?: number) {
  const retriever = await getRagRetriever(organizationId);
  const chatEngine = new ContextChatEngine({ retriever, systemPrompt: getPrompt(language) });
  return chatEngine;
}
