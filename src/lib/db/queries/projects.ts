import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 16)

export type { Project } from '@/lib/db/types'
import type { Project } from '@/lib/db/types'

export async function createProject(
  userId: string,
  name: string,
  description?: string,
  isDefault = false
): Promise<Project> {
  const [project] = await db
    .insert(projects)
    .values({
      id: nanoid(),
      userId,
      name,
      description: description || null,
      isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return project as Project
}

export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  return (await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt))) as Project[]
}

export async function getProjectById(projectId: string, userId: string): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  return (project as Project) || null
}

export async function updateProject(
  projectId: string,
  userId: string,
  updates: { name?: string; description?: string }
): Promise<Project | null> {
  const [project] = await db
    .update(projects)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning()

  return (project as Project) || null
}

export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  return true
}

export async function getDefaultProject(userId: string): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.isDefault, true)))

  return (project as Project) || null
}

export async function ensureDefaultProject(userId: string): Promise<Project> {
  let defaultProject = await getDefaultProject(userId)

  if (!defaultProject) {
    defaultProject = await createProject(userId, 'Default Project', 'Your default workspace', true)
  }

  return defaultProject
}
