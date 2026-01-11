'use client'

import type { ChatSession } from '@/lib/db/types'
import { useWorkspace } from '@/lib/hooks/use-workspace'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SessionItem({
  session,
  isActive,
}: {
  session: ChatSession
  isActive: boolean
}) {
  const { setCurrentSession } = useWorkspace()

  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className="w-full justify-start gap-2 px-2"
      onClick={() => setCurrentSession(session.id)}
    >
      <MessageSquare className="h-4 w-4" />
      <span className="truncate text-sm">{session.name}</span>
    </Button>
  )
}
