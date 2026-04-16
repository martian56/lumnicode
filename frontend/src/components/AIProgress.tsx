import {
  Play,
  Pause,
  Square,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Code,
} from 'lucide-react'
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
  recentUpdates = [],
}: AIProgressProps) {
  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-4 w-4 text-red-400" />
    if (isPaused) return <Pause className="h-4 w-4 text-amber-400" />
    if (isGenerating)
      return <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
    return <CheckCircle className="h-4 w-4 text-emerald-400" />
  }

  const getStatusText = () => {
    if (error) return 'Error'
    if (isPaused) return 'Paused'
    if (isGenerating) return 'Generating'
    return 'Completed'
  }

  const getStatusColor = () => {
    if (error) return 'text-red-400'
    if (isPaused) return 'text-amber-400'
    if (isGenerating) return 'text-indigo-400'
    return 'text-emerald-400'
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {getStatusIcon()}
          <div>
            <h3 className="text-sm font-medium text-zinc-200">AI Generation</h3>
            <p className={`text-xs ${getStatusColor()}`}>{getStatusText()}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isGenerating && !isPaused && (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors text-xs"
            >
              <Pause className="h-3 w-3" />
              <span>Pause</span>
            </button>
          )}
          {isPaused && (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-xs"
            >
              <Play className="h-3 w-3" />
              <span>Resume</span>
            </button>
          )}
          {(isGenerating || isPaused) && (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-xs"
            >
              <Square className="h-3 w-3" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-500">Progress</span>
          <span className="text-xs text-zinc-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              error ? 'bg-red-500' : isPaused ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {currentTask && (
        <div className="mb-3">
          <p className="text-[11px] text-zinc-500 mb-0.5">Current Task</p>
          <p className="text-sm text-zinc-200">{currentTask}</p>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        </div>
      )}

      {recentUpdates.length > 0 && (
        <div>
          <p className="text-[11px] text-zinc-500 mb-2">Recent Activity</p>
          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {recentUpdates.slice(-5).map((update, index) => (
              <div key={index} className="flex items-center gap-2.5 text-xs">
                <div className="flex-shrink-0">
                  {update.type === 'file_created' ? (
                    <FileText className="h-3 w-3 text-emerald-400" />
                  ) : update.type === 'file_updated' ? (
                    <Code className="h-3 w-3 text-indigo-400" />
                  ) : (
                    <Loader2 className="h-3 w-3 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-400 truncate">{update.message}</p>
                  {update.currentFile && (
                    <p className="text-zinc-600 text-[10px] truncate">
                      {update.currentFile}
                    </p>
                  )}
                </div>
                <span className="text-zinc-600 text-[10px] flex-shrink-0">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
