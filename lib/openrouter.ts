// OpenRouter API Client

import type { ChatMessage } from "./types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return apiKey;
}

export async function callModel(
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const apiKey = getApiKey();

  console.log(`[OpenRouter] Calling model: ${model}`);

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://llm-council.local",
      "X-Title": "LLM Council",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    // Security: Log detailed error server-side only, return generic error to client
    const errorText = await response.text();
    console.error(`[OpenRouter] Error for ${model}: ${response.status} - ${errorText}`);
    // Don't expose internal API details to clients
    throw new Error(`Model request failed (${response.status}). Please try again.`);
  }

  const data: OpenRouterResponse = await response.json();
  console.log(`[OpenRouter] Success for ${model}`);
  return data.choices[0]?.message?.content || "";
}

export interface ParallelCallResult {
  model: string;
  content: string;
  error?: string;
}

export async function callModelsParallel(
  models: string[],
  messages: ChatMessage[]
): Promise<ParallelCallResult[]> {
  const promises = models.map(async (model) => {
    try {
      const content = await callModel(model, messages);
      return { model, content };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { model, content: "", error: errorMessage };
    }
  });

  return Promise.all(promises);
}
