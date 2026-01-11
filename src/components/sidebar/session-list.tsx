'use client'

import { useWorkspace } from '@/lib/hooks/use-workspace'
import { SessionItem } from './session-item'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { NewSessionDialog } from './new-session-dialog'

export function SessionList() {
  const { sessions, currentSessionId, currentProjectId } = useWorkspace()
  const [showNewDialog, setShowNewDialog] = useState(false)

  if (!currentProjectId) return null

  return (
    <div className="flex-1 flex flex-col p-2 overflow-hidden">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">
          Sessions
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

      <div className="flex-1 overflow-y-auto space-y-1">
        {sessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={session.id === currentSessionId}
          />
        ))}
      </div>

      {sessions.length === 0 && (
        <p className="text-xs text-muted-foreground px-2 py-4 text-center">
          No sessions yet
        </p>
      )}

      <NewSessionDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </div>
  )
}
