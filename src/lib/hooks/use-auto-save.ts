import { useEffect, useRef } from 'react'
import { Message } from '@/lib/messages'

export function useAutoSave(
  sessionId: string | null,
  messages: Message[],
  delay = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const previousMessagesRef = useRef<Message[]>([])

  useEffect(() => {
    // Don't auto-save if no session
    if (!sessionId) return

    // Don't save if messages haven't changed
    if (JSON.stringify(previousMessagesRef.current) === JSON.stringify(messages)) {
      return
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        })
        previousMessagesRef.current = messages
      } catch (error) {
        console.error('Failed to auto-save messages:', error)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [sessionId, messages, delay])
}
