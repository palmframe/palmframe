import { db } from '@/lib/db'
import { chatSessions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 16)

export type { ChatSession } from '@/lib/db/types'
import type { ChatSession } from '@/lib/db/types'

export async function createSession(
  projectId: string,
  name: string
): Promise<ChatSession> {
  const [session] = await db
    .insert(chatSessions)
    .values({
      id: nanoid(),
      projectId,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: null,
    })
    .returning()

  return session as ChatSession
}

export async function getSessionsByProjectId(projectId: string): Promise<ChatSession[]> {
  return (await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.projectId, projectId))
    .orderBy(desc(chatSessions.lastMessageAt), desc(chatSessions.createdAt))) as ChatSession[]
}

export async function getSessionById(sessionId: string): Promise<ChatSession | null> {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))

  return (session as ChatSession) || null
}

export async function updateSession(
  sessionId: string,
  updates: { name?: string; lastMessageAt?: Date }
): Promise<ChatSession | null> {
  const [session] = await db
    .update(chatSessions)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(chatSessions.id, sessionId))
    .returning()

  return (session as ChatSession) || null
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  await db.delete(chatSessions).where(eq(chatSessions.id, sessionId))
  return true
}

export async function updateSessionLastMessage(sessionId: string): Promise<void> {
  await db
    .update(chatSessions)
    .set({
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(chatSessions.id, sessionId))
}
