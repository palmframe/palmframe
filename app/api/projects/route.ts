import { NextRequest, NextResponse } from 'next/server'
import {
  createProject,
  getProjectsByUserId,
  ensureDefaultProject,
} from '@/lib/db/queries/projects'
import { getSession } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user has at least a default project
    await ensureDefaultProject(session.user.id)

    const projects = await getProjectsByUserId(session.user.id)

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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
    const { name, description } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const project = await createProject(
      session.user.id,
      name,
      description,
      false
    )

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
