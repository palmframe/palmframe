export interface ChatSession {
  id: string
  projectId: string
  name: string
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date | null
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: string
  content: string // JSON stringified
  createdAt: Date
}

export interface Fragment {
  id: string
  messageId: string
  sessionId: string
  fragmentData: string // JSON stringified
  resultData: string | null // JSON stringified
  createdAt: Date
}
