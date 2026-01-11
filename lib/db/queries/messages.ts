import { db } from '@/lib/db'
import { chatMessages, fragments } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 16)

export type { ChatMessage, Fragment } from '@/lib/db/types'
import type { ChatMessage, Fragment } from '@/lib/db/types'

export async function createMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: Message['content']
): Promise<ChatMessage> {
  const [message] = await db
    .insert(chatMessages)
    .values({
      id: nanoid(),
      sessionId,
      role,
      content: JSON.stringify(content),
      createdAt: new Date(),
    })
    .returning()

  return message as ChatMessage
}

export async function createMessageWithFragment(
  sessionId: string,
  role: 'user' | 'assistant',
  content: Message['content'],
  fragmentData?: Partial<FragmentSchema>,
  resultData?: ExecutionResult
): Promise<{ message: ChatMessage; fragment?: Fragment }> {
  const [message] = await db
    .insert(chatMessages)
    .values({
      id: nanoid(),
      sessionId,
      role,
      content: JSON.stringify(content),
      createdAt: new Date(),
    })
    .returning()

  let fragment: Fragment | undefined

  if (fragmentData) {
    const [createdFragment] = await db
      .insert(fragments)
      .values({
        id: nanoid(),
        messageId: message.id,
        sessionId,
        fragmentData: JSON.stringify(fragmentData),
        resultData: resultData ? JSON.stringify(resultData) : null,
        createdAt: new Date(),
      })
      .returning()

    fragment = createdFragment as Fragment
  }

  return { message: message as ChatMessage, fragment }
}

export async function getMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
  return (await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt))) as ChatMessage[]
}

export async function getFragmentsBySessionId(sessionId: string): Promise<Fragment[]> {
  return (await db
    .select()
    .from(fragments)
    .where(eq(fragments.sessionId, sessionId))
    .orderBy(asc(fragments.createdAt))) as Fragment[]
}

export async function deleteMessagesBySessionId(sessionId: string): Promise<void> {
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId))
}

export async function bulkCreateMessages(
  sessionId: string,
  messages: Array<{ role: 'user' | 'assistant'; content: Message['content'] }>
): Promise<ChatMessage[]> {
  const values = messages.map((msg) => ({
    id: nanoid(),
    sessionId,
    role: msg.role,
    content: JSON.stringify(msg.content),
    createdAt: new Date(),
  }))

  const created = await db.insert(chatMessages).values(values).returning()

  return created as ChatMessage[]
}
