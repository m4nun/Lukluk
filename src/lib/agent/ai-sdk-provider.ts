import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";

export const openrouter: OpenAIProvider = createOpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Lukluk",
  },
});

/** OpenRouter-compatible model via Chat Completions API. */
export function getModel() {
  return openrouter.chat("deepseek/deepseek-v4-flash");
}
