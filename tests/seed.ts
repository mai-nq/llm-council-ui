// Test data seeding helpers
import { promises as fs } from 'fs'
import path from 'path'
import type { Conversation } from '@/lib/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const CONVERSATIONS_DIR = path.join(DATA_DIR, 'conversations')

export async function ensureTestDirectories(): Promise<void> {
  await fs.mkdir(CONVERSATIONS_DIR, { recursive: true })
}

export async function seedConversation(conversation: Conversation): Promise<void> {
  await ensureTestDirectories()
  const filePath = path.join(CONVERSATIONS_DIR, `${conversation.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8')
}

export async function cleanupConversation(id: string): Promise<void> {
  try {
    const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`)
    await fs.unlink(filePath)
  } catch {
    // Ignore if file doesn't exist
  }
}

export async function cleanupAllTestConversations(): Promise<void> {
  try {
    const files = await fs.readdir(CONVERSATIONS_DIR)
    const testFiles = files.filter(f => f.startsWith('test-'))

    for (const file of testFiles) {
      await fs.unlink(path.join(CONVERSATIONS_DIR, file))
    }
  } catch {
    // Ignore if directory doesn't exist
  }
}

export function createTestConversation(overrides?: Partial<Conversation>): Conversation {
  const now = new Date().toISOString()
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Test Conversation',
    createdAt: now,
    updatedAt: now,
    messages: [],
    ...overrides,
  }
}
