import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";

const anthropicModelId = process.env.ANTHROPIC_CHAT_MODEL ?? "claude-3-5-haiku-latest";
const openaiModelId = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";

export function getChatLanguageModel(): LanguageModelV1 {
  const llmModel = process.env.LLM_MODEL ?? "openai";

  if (llmModel === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set on the server");
    }
    return createAnthropic({ apiKey })(anthropicModelId);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set on the server");
  }

  return createOpenAI({ apiKey })(openaiModelId);
}