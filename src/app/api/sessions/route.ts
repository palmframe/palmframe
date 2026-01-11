import { NextRequest, NextResponse } from 'next/server'
import {
  createSession,
  getSessionsByProjectId,
} from '@/lib/db/queries/sessions'
import { getProjectById } from '@/lib/db/queries/projects'
import { getSession } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    // Verify project ownership
    const project = await getProjectById(projectId, session.user.id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const sessions = await getSessionsByProjectId(projectId)

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, name } = body

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'projectId and name are required' },
        { status: 400 }
      )
    }

    // Verify project ownership
    const project = await getProjectById(projectId, session.user.id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const chatSession = await createSession(projectId, name)

    return NextResponse.json({ session: chatSession }, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
