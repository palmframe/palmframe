import { NextRequest } from 'next/server'

type Session = {
  user: {
    id: string
    email: string
    name?: string
  }
  access_token?: string
}

// Server-side auth helper for API routes
// TODO: Implement proper Better Auth session management
export function getSession(req?: NextRequest): Session {
  // For now, return a demo session for development
  return {
    user: {
      id: 'demo-user',
      email: 'demo@palmframe.dev'
    }
  }
}
