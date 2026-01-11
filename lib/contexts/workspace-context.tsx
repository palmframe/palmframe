'use client'

import React, { createContext, useState, useEffect, useCallback } from 'react'
import type { Project, ChatSession } from '@/lib/db/types'

export interface WorkspaceContextType {
  currentProjectId: string | null
  currentSessionId: string | null
  projects: Project[]
  sessions: ChatSession[]
  isLoading: boolean
  setCurrentProject: (projectId: string) => Promise<void>
  setCurrentSession: (sessionId: string) => void
  refreshProjects: () => Promise<void>
  refreshSessions: (projectId: string) => Promise<void>
  createNewProject: (name: string, description?: string) => Promise<Project>
  createNewSession: (projectId: string, name: string) => Promise<ChatSession>
  deleteProject: (projectId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  renameProject: (projectId: string, name: string) => Promise<void>
  renameSession: (sessionId: string, name: string) => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load projects on mount
  const refreshProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data.projects || [])

      // Set current project if not set
      if (!currentProjectId && data.projects.length > 0) {
        const storedProjectId = localStorage.getItem('currentProjectId')
        const projectToUse = data.projects.find((p: Project) => p.id === storedProjectId) || data.projects[0]
        setCurrentProjectId(projectToUse.id)
        localStorage.setItem('currentProjectId', projectToUse.id)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }, [currentProjectId])

  // Load sessions for a project
  const refreshSessions = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/sessions?projectId=${projectId}`)
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }, [])

  // Set current project and load its sessions
  const setCurrentProject = useCallback(async (projectId: string) => {
    setCurrentProjectId(projectId)
    localStorage.setItem('currentProjectId', projectId)
    await refreshSessions(projectId)

    // Load stored session for this project or select first
    const storedSessionId = localStorage.getItem(`currentSessionId_${projectId}`)
    const response = await fetch(`/api/sessions?projectId=${projectId}`)
    const data = await response.json()
    const sessionToUse = data.sessions.find((s: ChatSession) => s.id === storedSessionId) || data.sessions[0]

    if (sessionToUse) {
      setCurrentSessionId(sessionToUse.id)
      localStorage.setItem(`currentSessionId_${projectId}`, sessionToUse.id)
    } else {
      setCurrentSessionId(null)
    }
  }, [refreshSessions])

  // Set current session
  const setCurrentSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
    if (currentProjectId) {
      localStorage.setItem(`currentSessionId_${currentProjectId}`, sessionId)
    }
  }, [currentProjectId])

  // Create new project
  const createNewProject = useCallback(async (name: string, description?: string): Promise<Project> => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    const data = await response.json()
    await refreshProjects()
    return data.project
  }, [refreshProjects])

  // Create new session
  const createNewSession = useCallback(async (projectId: string, name: string): Promise<ChatSession> => {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, name }),
    })
    const data = await response.json()
    await refreshSessions(projectId)
    return data.session
  }, [refreshSessions])

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    await refreshProjects()

    // If deleted project was current, switch to first available
    if (currentProjectId === projectId) {
      const remaining = projects.filter((p) => p.id !== projectId)
      if (remaining.length > 0) {
        await setCurrentProject(remaining[0].id)
      }
    }
  }, [refreshProjects, currentProjectId, projects, setCurrentProject])

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })

    if (currentProjectId) {
      await refreshSessions(currentProjectId)

      // If deleted session was current, switch to first available
      if (currentSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId)
        if (remaining.length > 0) {
          setCurrentSession(remaining[0].id)
        } else {
          setCurrentSessionId(null)
        }
      }
    }
  }, [currentProjectId, currentSessionId, sessions, refreshSessions, setCurrentSession])

  // Rename project
  const renameProject = useCallback(async (projectId: string, name: string) => {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    await refreshProjects()
  }, [refreshProjects])

  // Rename session
  const renameSession = useCallback(async (sessionId: string, name: string) => {
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (currentProjectId) {
      await refreshSessions(currentProjectId)
    }
  }, [currentProjectId, refreshSessions])

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await refreshProjects()
      setIsLoading(false)
    }
    init()
  }, [refreshProjects])

  // Load sessions when project changes
  useEffect(() => {
    if (currentProjectId) {
      refreshSessions(currentProjectId)
    }
  }, [currentProjectId, refreshSessions])

  const value: WorkspaceContextType = {
    currentProjectId,
    currentSessionId,
    projects,
    sessions,
    isLoading,
    setCurrentProject,
    setCurrentSession,
    refreshProjects,
    refreshSessions,
    createNewProject,
    createNewSession,
    deleteProject,
    deleteSession,
    renameProject,
    renameSession,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
