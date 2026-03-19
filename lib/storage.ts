// JSON File Storage for Conversations and Settings

import { promises as fs } from "fs";
import path from "path";
import type {
  Conversation,
  ConversationMetadata,
  Settings,
  DEFAULT_SETTINGS,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONVERSATIONS_DIR = path.join(DATA_DIR, "conversations");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// Ensure directories exist
async function ensureDirectories(): Promise<void> {
  await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
}

// Settings

export async function loadSettings(): Promise<Settings> {
  try {
    await ensureDirectories();
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    return JSON.parse(data) as Settings;
  } catch {
    // Return default settings if file doesn't exist
    const { DEFAULT_SETTINGS } = await import("./types");
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await ensureDirectories();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

// Conversations

export async function listConversations(): Promise<ConversationMetadata[]> {
  await ensureDirectories();

  try {
    const files = await fs.readdir(CONVERSATIONS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const conversations: ConversationMetadata[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(CONVERSATIONS_DIR, file);
        const data = await fs.readFile(filePath, "utf-8");
        const conversation: Conversation = JSON.parse(data);

        conversations.push({
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          messageCount: conversation.messages.length,
        });
      } catch {
        // Skip invalid files
        continue;
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
  await ensureDirectories();

  try {
    const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as Conversation;
  } catch {
    return null;
  }
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  await ensureDirectories();

  const filePath = path.join(CONVERSATIONS_DIR, `${conversation.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), "utf-8");
}

export async function deleteConversation(id: string): Promise<boolean> {
  await ensureDirectories();

  try {
    const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
    await fs.unlink(filePath);
    return true;
  } catch {
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
