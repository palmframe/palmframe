import { NextRequest, NextResponse } from 'next/server'
import {
  getProjectById,
  updateProject,
  deleteProject,
} from '@/lib/db/queries/projects'
import { getSession } from '@/lib/server-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const body = await req.json()
    const { name, description } = body

    // Verify ownership
    const existingProject = await getProjectById(projectId, session.user.id)
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = await updateProject(projectId, session.user.id, {
      name,
      description,
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id

    // Verify ownership
    const existingProject = await getProjectById(projectId, session.user.id)
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Prevent deleting the default project if it's the only one
    if (existingProject.isDefault) {
      const allProjects = await require('@/lib/db/queries/projects').getProjectsByUserId(
        session.user.id
      )
      if (allProjects.length === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only project' },
          { status: 400 }
        )
      }
    }

    await deleteProject(projectId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
