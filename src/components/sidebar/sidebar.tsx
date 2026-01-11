'use client'

import { useState } from 'react'
import { useWorkspace } from '@/lib/hooks/use-workspace'
import { SidebarHeader } from './sidebar-header'
import { ProjectList } from './project-list'
import { SessionList } from './session-list'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isLoading } = useWorkspace()

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div
      className={`flex h-full flex-col bg-background border-r transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-[280px]'
      }`}
    >
      <SidebarHeader isCollapsed={isCollapsed} />

      {!isCollapsed && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <ProjectList />
          <SessionList />
        </div>
      )}

      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
