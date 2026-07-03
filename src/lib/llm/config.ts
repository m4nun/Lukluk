import { ChatOpenAI } from "@langchain/openai";

export interface LLMConfig {
  model: string;
  baseURL: string;
  apiKey: string;
}

export function getLLMConfig(): LLMConfig {
  return {
    model: "deepseek/deepseek-chat",
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
  };
}

export function getChatModel(temperature = 0.7) {
  const config = getLLMConfig();
  return new ChatOpenAI({
    model: config.model,
    temperature,
    configuration: {
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    },
  });
}

export async function callLLM(payload: {
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
}): Promise<string | null> {
  const config = getLLMConfig();
  if (!config.apiKey) return null;

  try {
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: payload.messages,
        max_tokens: payload.max_tokens,
        temperature: payload.temperature,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
