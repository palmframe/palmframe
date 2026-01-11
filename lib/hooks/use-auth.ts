'use client'

import { useState, useEffect } from 'react'

type Session = {
  user: {
    id: string
    email: string
    name?: string
  }
  access_token?: string
}

type UserTeam = {
  email: string
  id: string
  name: string
  tier: string
}

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: any) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [userTeam, setUserTeam] = useState<UserTeam | undefined>(undefined)

  useEffect(() => {
    // For now, return a demo session for development
    // TODO: Implement proper Better Auth session management
    setSession({
      user: {
        id: 'demo-user',
        email: 'demo@palmframe.dev'
      }
    })
  }, [])

  return {
    session,
    userTeam,
  }
}
