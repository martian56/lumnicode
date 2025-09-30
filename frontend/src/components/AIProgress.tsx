import { Play, Pause, Square, Loader2, CheckCircle, AlertCircle, FileText, Code } from 'lucide-react'
import type { AIProgressUpdate } from '../lib/websocket'

interface AIProgressProps {
  isGenerating: boolean
  isPaused: boolean
  progress: number
  currentTask: string
  error: string | null
  onStop: () => void
  onPause: () => void
  onResume: () => void
  recentUpdates?: AIProgressUpdate[]
}

export default function AIProgress({
  isGenerating,
  isPaused,
  progress,
  currentTask,
  error,
  onStop,
  onPause,
  onResume,
  recentUpdates = []
}: AIProgressProps) {
  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-5 w-5 text-red-400" />
    if (isPaused) return <Pause className="h-5 w-5 text-yellow-400" />
    if (isGenerating) return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
    return <CheckCircle className="h-5 w-5 text-green-400" />
  }

  const getStatusText = () => {
    if (error) return 'Error'
    if (isPaused) return 'Paused'
    if (isGenerating) return 'Generating'
    return 'Completed'
  }

  const getStatusColor = () => {
    if (error) return 'text-red-400'
    if (isPaused) return 'text-yellow-400'
    if (isGenerating) return 'text-blue-400'
    return 'text-green-400'
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-white">AI Generation</h3>
            <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {isGenerating && !isPaused && (
            <button
              onClick={onPause}
              className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              <Pause className="h-4 w-4" />
              <span className="text-sm">Pause</span>
            </button>
          )}
          
          {isPaused && (
            <button
              onClick={onResume}
              className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              <Play className="h-4 w-4" />
              <span className="text-sm">Resume</span>
            </button>
          )}
          
          {(isGenerating || isPaused) && (
            <button
              onClick={onStop}
              className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <Square className="h-4 w-4" />
              <span className="text-sm">Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              error ? 'bg-red-500' : isPaused ? 'bg-yellow-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Current Task</p>
          <p className="text-white text-sm">{currentTask}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Recent Updates */}
      {recentUpdates.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-3">Recent Activity</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentUpdates.slice(-5).map((update, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className="flex-shrink-0">
                  {update.type === 'file_created' ? (
                    <FileText className="h-4 w-4 text-green-400" />
                  ) : update.type === 'file_updated' ? (
                    <Code className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 truncate">{update.message}</p>
                  {update.currentFile && (
                    <p className="text-gray-500 text-xs truncate">{update.currentFile}</p>
                  )}
                </div>
                <div className="text-gray-500 text-xs">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
