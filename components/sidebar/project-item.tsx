'use client'

import type { Project } from '@/lib/db/types'
import { useWorkspace } from '@/lib/hooks/use-workspace'
import { Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ProjectItem({
  project,
  isActive,
}: {
  project: Project
  isActive: boolean
}) {
  const { setCurrentProject } = useWorkspace()

  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className="w-full justify-start gap-2 px-2"
      onClick={() => setCurrentProject(project.id)}
    >
      <Folder className="h-4 w-4" />
      <span className="truncate text-sm">{project.name}</span>
    </Button>
  )
}
