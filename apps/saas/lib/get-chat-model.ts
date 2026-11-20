import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";

export function getChatLanguageModel(): LanguageModelV1 {
  const llmModel = process.env.LLM_MODEL ?? "openai";

  if (llmModel === "anthropic") {
    return anthropic("claude-3-5-haiku-20241022");
  }

  return openai("gpt-4o-mini");
}