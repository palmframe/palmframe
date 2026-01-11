'use client'

import { useWorkspace } from '@/lib/hooks/use-workspace'
import { ProjectItem } from './project-item'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { NewProjectDialog } from './new-project-dialog'

export function ProjectList() {
  const { projects, currentProjectId } = useWorkspace()
  const [showNewDialog, setShowNewDialog] = useState(false)

  return (
    <div className="flex flex-col p-2 border-b">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">
          Projects
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setShowNewDialog(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {projects.map((project) => (
          <ProjectItem
            key={project.id}
            project={project}
            isActive={project.id === currentProjectId}
          />
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-xs text-muted-foreground px-2 py-4 text-center">
          No projects yet
        </p>
      )}

      <NewProjectDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </div>
  )
}
