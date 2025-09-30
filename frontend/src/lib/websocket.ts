import { apiClient } from './api'

export interface AIProgressUpdate {
  type: 'progress' | 'file_created' | 'file_updated' | 'error' | 'completed' | 'stopped'
  message: string
  progress: number // 0-100
  currentFile?: string
  totalFiles?: number
  completedFiles?: number
  timestamp: string
  data?: any
}

export interface AIGenerationSession {
  id: string
  projectId: string
  status: 'running' | 'paused' | 'stopped' | 'completed' | 'error'
  progress: number
  currentTask?: string
  context: any
  createdAt: string
  updatedAt: string
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, ((data: AIProgressUpdate) => void)[]> = new Map()
  private sessionId: string | null = null

  connect(projectId: string, sessionId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        // Use backend server URL instead of frontend dev server
        const backendHost = import.meta.env.VITE_API_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:8000'
        const wsUrl = `${protocol}//${backendHost}/ws/ai-progress/${projectId}${sessionId ? `?session=${sessionId}` : ''}`
        
        this.ws = new WebSocket(wsUrl)
        this.sessionId = sessionId || null

        this.ws.onopen = () => {
          console.log('WebSocket connected for AI progress')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data: AIProgressUpdate = JSON.parse(event.data)
            this.notifyListeners(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          this.ws = null
          
          // Attempt to reconnect if not intentionally closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => {
              console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
              this.connect(projectId, sessionId).catch(console.error)
            }, this.reconnectDelay * this.reconnectAttempts)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect')
      this.ws = null
    }
    this.listeners.clear()
    this.sessionId = null
  }

  sendMessage(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    }
  }

  stopAI(): void {
    this.sendMessage('stop_ai', {})
  }

  pauseAI(): void {
    this.sendMessage('pause_ai', {})
  }

  resumeAI(): void {
    this.sendMessage('resume_ai', {})
  }

  addListener(eventType: string, callback: (data: AIProgressUpdate) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)!.push(callback)
  }

  removeListener(eventType: string, callback: (data: AIProgressUpdate) => void): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(data: AIProgressUpdate): void {
    // Notify specific event type listeners
    const specificListeners = this.listeners.get(data.type)
    if (specificListeners) {
      specificListeners.forEach(callback => callback(data))
    }

    // Notify general listeners
    const generalListeners = this.listeners.get('*')
    if (generalListeners) {
      generalListeners.forEach(callback => callback(data))
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  getSessionId(): string | null {
    return this.sessionId
  }
}

// Singleton instance
export const websocketService = new WebSocketService()

// API functions for AI generation management
export const aiGenerationAPI = {
  async startGeneration(projectId: string, prompt: string, techStack: string[], token: string): Promise<AIGenerationSession> {
    const response = await apiClient.post(`/ai/generate/${projectId}`, {
      prompt,
      tech_stack: techStack
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  async getSession(sessionId: string, token: string): Promise<AIGenerationSession> {
    const response = await apiClient.get(`/ai/session/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  async stopGeneration(sessionId: string, token: string): Promise<void> {
    await apiClient.post(`/ai/session/${sessionId}/stop`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },

  async pauseGeneration(sessionId: string, token: string): Promise<void> {
    await apiClient.post(`/ai/session/${sessionId}/pause`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },

  async resumeGeneration(sessionId: string, token: string): Promise<void> {
    await apiClient.post(`/ai/session/${sessionId}/resume`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },

  async getGenerationHistory(projectId: string, token: string): Promise<AIGenerationSession[]> {
    const response = await apiClient.get(`/ai/history/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}
