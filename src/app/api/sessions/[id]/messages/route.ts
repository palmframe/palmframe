import { NextRequest, NextResponse } from 'next/server'
import { getSessionById } from '@/lib/db/queries/sessions'
import {
  createMessageWithFragment,
  bulkCreateMessages,
} from '@/lib/db/queries/messages'
import { updateSessionLastMessage } from '@/lib/db/queries/sessions'
import { getSession } from '@/lib/server-auth'
import { Message } from '@/lib/messages'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = getSession(req)

    if (!userSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await params

    // Verify session exists
    const chatSession = await getSessionById(sessionId)
    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const body = await req.json()
    const { messages } = body as { messages: Message[] }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      )
    }

    // Save messages with fragments if present
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

    // Update session last message timestamp
    await updateSessionLastMessage(sessionId)

    return NextResponse.json({ messages: savedMessages }, { status: 201 })
  } catch (error) {
    console.error('Error saving messages:', error)
    return NextResponse.json(
      { error: 'Failed to save messages' },
      { status: 500 }
    )
  }
}
