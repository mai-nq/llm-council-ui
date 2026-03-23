// LLM Council Type Definitions

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  color: string;
  icon: string;
}

export const COUNCIL_MODELS: LLMModel[] = [
  {
    id: "openai/gpt-5.1",
    name: "GPT-5.1",
    provider: "OpenAI",
    color: "#10b981", // emerald-500
    icon: "O",
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    color: "#f97316", // orange-500
    icon: "A",
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "Google",
    color: "#3b82f6", // blue-500
    icon: "G",
  },
  {
    id: "x-ai/grok-4",
    name: "Grok 4",
    provider: "xAI",
    color: "#ef4444", // red-500
    icon: "X",
  },
];

export const CHAIRMAN_MODEL: LLMModel = {
  id: "chairman",
  name: "Chairman",
  provider: "Council",
  color: "#8b5cf6", // violet-500
  icon: "C",
};

// Keep AVAILABLE_MODELS for backward compatibility
export const AVAILABLE_MODELS = COUNCIL_MODELS;

// Model color mapping for Tailwind classes
export const MODEL_COLORS: Record<string, string> = {
  openai: "bg-emerald-500",
  anthropic: "bg-orange-500",
  google: "bg-blue-500",
  "x-ai": "bg-red-500",
  "meta-llama": "bg-purple-500",
  mistralai: "bg-cyan-500",
  deepseek: "bg-indigo-500",
  cohere: "bg-pink-500",
  perplexity: "bg-teal-500",
};

// Provider hex colors for inline styles
export const PROVIDER_HEX_COLORS: Record<string, string> = {
  openai: "#10b981",
  anthropic: "#f97316",
  google: "#3b82f6",
  "x-ai": "#ef4444",
  "meta-llama": "#8b5cf6",
  mistralai: "#06b6d4",
  deepseek: "#6366f1",
  cohere: "#ec4899",
  perplexity: "#14b8a6",
};

export function getModelColor(modelId: string): string {
  const provider = modelId.split("/")[0];
  return MODEL_COLORS[provider] || "bg-gray-500";
}

export function getModelDisplayName(modelId: string): string {
  const model = COUNCIL_MODELS.find((m) => m.id === modelId);
  return model?.name || modelId.split("/").pop() || modelId;
}

// Display info for any model_id (not just hardcoded ones)
export interface ModelDisplayInfo {
  name: string;
  provider: string;
  color: string;
  icon: string;
}

export function getModelDisplayInfo(modelId: string): ModelDisplayInfo {
  const provider = modelId.split("/")[0] || "unknown";
  const modelName = modelId.split("/")[1] || modelId;

  return {
    name: modelName,
    provider: provider,
    color: PROVIDER_HEX_COLORS[provider] || "#6b7280",
    icon: provider[0]?.toUpperCase() || "?",
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Stage1Response {
  model: string;
  content: string;
  label: string; // A, B, C, D for anonymization
}

export interface ModelRanking {
  model: string;
  rankings: string[]; // Array of labels in order, e.g., ["B", "A", "D", "C"]
  rawText: string;
}

export interface AggregateRanking {
  model: string;
  label: string;
  avgRank: number;
  votes: number;
}

export interface Stage2Result {
  modelRankings: ModelRanking[];
  aggregateRankings: AggregateRanking[];
  labelToModel: Record<string, string>;
}

export interface CouncilResponse {
  stage1: Stage1Response[];
  stage2: Stage2Result;
  stage3: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  councilResponse?: CouncilResponse;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface ConversationMetadata {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ModelConfig {
  modelId: string;
  active: boolean;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface Settings {
  models: ModelConfig[];
  chairmanModel: string;
}

export const DEFAULT_MODEL_CONFIG: Omit<ModelConfig, "modelId"> = {
  active: true,
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "",
};

export const DEFAULT_SETTINGS: Settings = {
  models: [
    {
      modelId: "openai/gpt-5.1",
      active: true,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt:
        "You are a thoughtful AI assistant providing reasoned analysis.",
    },
    {
      modelId: "anthropic/claude-sonnet-4.6",
      active: true,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt:
        "You are Claude, an AI assistant made by Anthropic. Provide thoughtful and detailed responses.",
    },
    {
      modelId: "google/gemini-3-pro-preview",
      active: true,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt:
        "You are a helpful AI assistant. Provide comprehensive and accurate responses.",
    },
    {
      modelId: "x-ai/grok-4",
      active: true,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: "You are Grok, a witty and knowledgeable AI assistant.",
    },
  ],
  chairmanModel: "anthropic/claude-sonnet-4.6",
};

// Helper to get active models from settings
export function getActiveModels(settings: Settings): string[] {
  return settings.models.filter((m) => m.active).map((m) => m.modelId);
}

// SSE Event types
export type SSEEventType =
  | "stage1_complete"
  | "stage2_complete"
  | "stage3_complete"
  | "complete"
  | "error";

export interface SSEEvent {
  type: SSEEventType;
  data: Stage1Response[] | Stage2Result | string;
}
