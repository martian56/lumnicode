import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { websocketService, aiGenerationAPI } from '../lib/websocket'
import type { AIProgressUpdate, AIGenerationSession } from '../lib/websocket'

export interface UseAIGenerationOptions {
  projectId: string
  onProgress?: (update: AIProgressUpdate) => void
  onComplete?: (session: AIGenerationSession) => void
  onError?: (error: string) => void
}

export interface UseAIGenerationReturn {
  // State
  isGenerating: boolean
  isPaused: boolean
  progress: number
  currentTask: string
  session: AIGenerationSession | null
  error: string | null
  
  // Actions
  startGeneration: (prompt: string, techStack: string[]) => Promise<void>
  stopGeneration: () => Promise<void>
  pauseGeneration: () => Promise<void>
  resumeGeneration: () => Promise<void>
  
  // WebSocket connection
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

export function useAIGeneration({
  projectId,
  onProgress,
  onComplete,
  onError
}: UseAIGenerationOptions): UseAIGenerationReturn {
  const { getToken } = useAuth()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState('')
  const [session, setSession] = useState<AIGenerationSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const sessionRef = useRef<string | null>(null)

  // WebSocket event handlers
  const handleProgress = useCallback((update: AIProgressUpdate) => {
    setProgress(update.progress)
    setCurrentTask(update.message)
    
    if (update.type === 'completed') {
      setIsGenerating(false)
      setIsPaused(false)
      if (session) {
        onComplete?.(session)
      }
    } else if (update.type === 'stopped') {
      setIsGenerating(false)
      setIsPaused(false)
    } else if (update.type === 'error') {
      setError(update.message)
      setIsGenerating(false)
      onError?.(update.message)
    }
    
    onProgress?.(update)
  }, [session, onProgress, onComplete, onError])

  const handleFileCreated = useCallback((update: AIProgressUpdate) => {
    // Handle file creation updates
    console.log('File created:', update.currentFile)
  }, [])

  const handleFileUpdated = useCallback((update: AIProgressUpdate) => {
    // Handle file update updates
    console.log('File updated:', update.currentFile)
  }, [])

  // Connect to WebSocket
  const connect = useCallback(async (sessionId?: string) => {
    try {
      await websocketService.connect(projectId, sessionId)
      setIsConnected(true)
      
      // Add event listeners
      websocketService.addListener('progress', handleProgress)
      websocketService.addListener('file_created', handleFileCreated)
      websocketService.addListener('file_updated', handleFileUpdated)
      websocketService.addListener('completed', handleProgress)
      websocketService.addListener('stopped', handleProgress)
      websocketService.addListener('error', handleProgress)
    } catch (err) {
      console.error('Failed to connect WebSocket:', err)
      setError('Failed to connect to AI service')
    }
  }, [projectId, handleProgress, handleFileCreated, handleFileUpdated])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect()
    setIsConnected(false)
  }, [])

  // Start AI generation
  const startGeneration = useCallback(async (prompt: string, techStack: string[]) => {
    try {
      setError(null)
      setIsGenerating(true)
      setIsPaused(false)
      setProgress(0)
      setCurrentTask('Starting AI generation...')
      
      // Get auth token
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication token not available')
      }
      
      const newSession = await aiGenerationAPI.startGeneration(projectId, prompt, techStack, token)
      setSession(newSession)
      sessionRef.current = newSession.id
      
      // Connect WebSocket if not already connected
      if (!isConnected) {
        await connect(newSession.id)
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to start AI generation')
      setIsGenerating(false)
      onError?.(err.message || 'Failed to start AI generation')
    }
  }, [projectId, isConnected, connect, onError, getToken])

  // Stop AI generation
  const stopGeneration = useCallback(async () => {
    if (!session) return
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication token not available')
      }
      
      await aiGenerationAPI.stopGeneration(session.id, token)
      websocketService.stopAI()
      setIsGenerating(false)
      setIsPaused(false)
    } catch (err: any) {
      setError(err.message || 'Failed to stop AI generation')
    }
  }, [session, getToken])

  // Pause AI generation
  const pauseGeneration = useCallback(async () => {
    if (!session) return
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication token not available')
      }
      
      await aiGenerationAPI.pauseGeneration(session.id, token)
      websocketService.pauseAI()
      setIsPaused(true)
    } catch (err: any) {
      setError(err.message || 'Failed to pause AI generation')
    }
  }, [session, getToken])

  // Resume AI generation
  const resumeGeneration = useCallback(async () => {
    if (!session) return
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication token not available')
      }
      
      await aiGenerationAPI.resumeGeneration(session.id, token)
      websocketService.resumeAI()
      setIsPaused(false)
    } catch (err: any) {
      setError(err.message || 'Failed to resume AI generation')
    }
  }, [session, getToken])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    // State
    isGenerating,
    isPaused,
    progress,
    currentTask,
    session,
    error,
    
    // Actions
    startGeneration,
    stopGeneration,
    pauseGeneration,
    resumeGeneration,
    
    // WebSocket connection
    isConnected,
    connect,
    disconnect
  }
}
