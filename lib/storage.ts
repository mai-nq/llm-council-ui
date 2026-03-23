// Redis Storage for Conversations and Settings (Vercel KV / Upstash)

import { Redis } from "@upstash/redis";
import type {
  Conversation,
  ConversationMetadata,
  Settings,
} from "./types";

// Initialize Redis client lazily to avoid errors when env vars are missing
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    console.log("[storage] Initializing Redis client...");
    console.log("[storage] KV_REST_API_URL exists:", !!url);
    console.log("[storage] KV_REST_API_TOKEN exists:", !!token);

    if (!url || !token) {
      throw new Error(`Redis credentials missing: URL=${!!url}, TOKEN=${!!token}`);
    }

    _redis = new Redis({ url, token });
  }
  return _redis;
}

// Redis key prefixes
const KEYS = {
  settings: "llm-council:settings",
  conversation: (id: string) => `llm-council:conversation:${id}`,
  conversationsList: "llm-council:conversations-list",
};

// Security: UUID validation to prevent injection attacks
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// Settings

export async function loadSettings(): Promise<Settings> {
  try {
    const settings = await getRedis().get<Settings>(KEYS.settings);
    if (settings) {
      return settings;
    }
    // Return default settings if not found
    const { DEFAULT_SETTINGS } = await import("./types");
    return DEFAULT_SETTINGS;
  } catch {
    const { DEFAULT_SETTINGS } = await import("./types");
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await getRedis().set(KEYS.settings, settings);
}

// Conversations

export async function listConversations(): Promise<ConversationMetadata[]> {
  try {
    // Get list of conversation IDs
    const conversationIds = await getRedis().smembers(KEYS.conversationsList);

    if (!conversationIds || conversationIds.length === 0) {
      return [];
    }

    // Fetch all conversations in parallel
    const conversations: ConversationMetadata[] = [];

    const pipeline = getRedis().pipeline();
    for (const id of conversationIds) {
      pipeline.get(KEYS.conversation(id));
    }

    const results = await pipeline.exec<(Conversation | null)[]>();

    for (const conversation of results) {
      if (conversation) {
        conversations.push({
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          messageCount: conversation.messages.length,
        });
      }
    }

    // Sort by updatedAt descending
    conversations.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return conversations;
  } catch {
    return [];
  }
}

export async function loadConversation(id: string): Promise<Conversation | null> {
  // Security: Validate UUID to prevent injection
  if (!isValidUUID(id)) {
    return null;
  }

  try {
    const conversation = await getRedis().get<Conversation>(KEYS.conversation(id));
    return conversation;
  } catch (error) {
    console.error("[storage] loadConversation error:", error);
    return null;
  }
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  // Security: Validate UUID to prevent injection
  if (!isValidUUID(conversation.id)) {
    throw new Error("Invalid conversation ID");
  }

  // Save conversation and add to list atomically
  const pipeline = getRedis().pipeline();
  pipeline.set(KEYS.conversation(conversation.id), conversation);
  pipeline.sadd(KEYS.conversationsList, conversation.id);
  await pipeline.exec();
}

export async function deleteConversation(id: string): Promise<boolean> {
  // Security: Validate UUID to prevent injection
  if (!isValidUUID(id)) {
    return false;
  }

  try {
    const pipeline = getRedis().pipeline();
    pipeline.del(KEYS.conversation(id));
    pipeline.srem(KEYS.conversationsList, id);
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error("[storage] deleteConversation error:", error);
    return false;
  }
}

export function createNewConversation(): Conversation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "New Conversation",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

// Generate title from first user message
export function generateTitle(content: string): string {
  // Take first 50 characters, or first sentence
  const firstSentence = content.split(/[.!?]/)[0];
  const title = firstSentence.length > 50 ? firstSentence.slice(0, 47) + "..." : firstSentence;
  return title.trim() || "New Conversation";
}
