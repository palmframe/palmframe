import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionById,
  updateSession,
  deleteSession,
} from '@/lib/db/queries/sessions'
import {
  getMessagesBySessionId,
  getFragmentsBySessionId,
} from '@/lib/db/queries/messages'
import { getSession } from '@/lib/server-auth'
import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = getSession(req)

    if (!userSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await params

    const chatSession = await getSessionById(sessionId)
    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get messages and fragments for this session
    const dbMessages = await getMessagesBySessionId(sessionId)
    const dbFragments = await getFragmentsBySessionId(sessionId)

    // Convert DB messages to Message format
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

    return NextResponse.json({
      session: chatSession,
      messages,
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = getSession(req)

    if (!userSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await params
    const body = await req.json()
    const { name } = body

    const session = await updateSession(sessionId, { name })

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = getSession(req)

    if (!userSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await params

    await deleteSession(sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
