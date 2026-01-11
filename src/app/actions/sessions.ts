'use server'

import {
  createSession,
  getSessionsByProjectId,
  getSessionById,
  updateSession,
  deleteSession,
  updateSessionLastMessage,
} from '@/lib/db/queries/sessions'
import {
  getMessagesBySessionId,
  getFragmentsBySessionId,
  createMessageWithFragment,
} from '@/lib/db/queries/messages'
import { getProjectById } from '@/lib/db/queries/projects'
import { getSession } from '@/lib/server-auth'
import { revalidatePath } from 'next/cache'
import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'

export async function getSessions(projectId: string) {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  if (!projectId) {
    throw new Error('projectId is required')
  }

  const project = await getProjectById(projectId, session.user.id)
  if (!project) {
    throw new Error('Project not found')
  }

  const sessions = await getSessionsByProjectId(projectId)

  return { sessions }
}

export async function getSessionWithMessages(sessionId: string) {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const chatSession = await getSessionById(sessionId)
  if (!chatSession) {
    throw new Error('Session not found')
  }

  const dbMessages = await getMessagesBySessionId(sessionId)
  const dbFragments = await getFragmentsBySessionId(sessionId)

  const messages: Message[] = dbMessages.map((msg) => {
    const parsedContent = JSON.parse(msg.content)
    const fragment = dbFragments.find((f) => f.messageId === msg.id)

    const message: Message = {
      role: msg.role as 'user' | 'assistant',
      content: parsedContent,
    }

    if (fragment) {
      message.object = JSON.parse(fragment.fragmentData) as Partial<FragmentSchema>
      if (fragment.resultData) {
        message.result = JSON.parse(fragment.resultData) as ExecutionResult
      }
    }

    return message
  })

  return {
    session: chatSession,
    messages,
  }
}

export async function createNewSession(projectId: string, name: string) {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  if (!projectId || !name) {
    throw new Error('projectId and name are required')
  }

  const project = await getProjectById(projectId, session.user.id)
  if (!project) {
    throw new Error('Project not found')
  }

  const chatSession = await createSession(projectId, name)

  revalidatePath(`/api/sessions?projectId=${projectId}`)
  return { session: chatSession }
}

export async function updateSessionAction(sessionId: string, name: string) {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const updatedSession = await updateSession(sessionId, { name })

  revalidatePath(`/api/sessions/${sessionId}`)
  return { session: updatedSession }
}

export async function deleteSessionAction(sessionId: string) {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await deleteSession(sessionId)

  revalidatePath(`/api/sessions/${sessionId}`)
  return { success: true }
}

export async function saveMessages(
  sessionId: string,
  messages: Message[]
) {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const chatSession = await getSessionById(sessionId)
  if (!chatSession) {
    throw new Error('Session not found')
  }

  if (!messages || !Array.isArray(messages)) {
    throw new Error('messages array is required')
  }

  const savedMessages = []
  for (const message of messages) {
    const result = await createMessageWithFragment(
      sessionId,
      message.role,
      message.content,
      message.object as any,
      message.result
    )
    savedMessages.push(result)
  }

  await updateSessionLastMessage(sessionId)

  revalidatePath(`/api/sessions/${sessionId}/messages`)
  return { messages: savedMessages }
}
