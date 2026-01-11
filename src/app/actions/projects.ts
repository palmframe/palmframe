'use server'

import {
  createProject,
  getProjectsByUserId,
  getProjectById,
  updateProject,
  deleteProject,
  ensureDefaultProject,
} from '@/lib/db/queries/projects'
import { getSession } from '@/lib/server-auth'
import { revalidatePath } from 'next/cache'

export async function getProjects() {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await ensureDefaultProject(session.user.id)
  const projects = await getProjectsByUserId(session.user.id)

  return { projects }
}

export async function createNewProject(name: string, description?: string) {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  if (!name || typeof name !== 'string') {
    throw new Error('Project name is required')
  }

  const project = await createProject(session.user.id, name, description, false)

  revalidatePath('/api/projects')
  return { project }
}

export async function updateProjectAction(projectId: string, name?: string, description?: string) {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const existingProject = await getProjectById(projectId, session.user.id)
  if (!existingProject) {
    throw new Error('Project not found')
  }

  const project = await updateProject(projectId, session.user.id, {
    name,
    description,
  })

  revalidatePath('/api/projects')
  return { project }
}

export async function deleteProjectAction(projectId: string) {
  const session = getSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const existingProject = await getProjectById(projectId, session.user.id)
  if (!existingProject) {
    throw new Error('Project not found')
  }

  // Prevent deleting the default project if it's the only one
  if (existingProject.isDefault) {
    const { projects: allProjects } = await getProjects()
    if (allProjects.length === 1) {
      throw new Error('Cannot delete the only project')
    }
  }

  await deleteProject(projectId, session.user.id)

  revalidatePath('/api/projects')
  return { success: true }
}
