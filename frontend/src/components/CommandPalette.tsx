import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  Search,
  Sparkles,
  Code,
  Bug,
  FileText,
  Lightbulb,
  X,
} from 'lucide-react'
import { streamAssistResponse } from '../lib/streaming'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  fileContent?: string
  language?: string
  onApplyCode?: (code: string) => void
}

interface Command {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  prompt: string
}

const commands: Command[] = [
  {
    id: 'explain',
    label: 'Explain Code',
    description: 'Get a detailed explanation',
    icon: Lightbulb,
    prompt: 'Explain this code in detail. What does it do and how does it work?',
  },
  {
    id: 'refactor',
    label: 'Refactor',
    description: 'Improve code quality',
    icon: Code,
    prompt: 'Refactor this code to be cleaner, more efficient, and follow best practices.',
  },
  {
    id: 'complete',
    label: 'Complete Code',
    description: 'Continue writing code',
    icon: Sparkles,
    prompt: 'Complete this code. Continue where it left off with logical next steps.',
  },
  {
    id: 'bugs',
    label: 'Find Bugs',
    description: 'Detect issues and bugs',
    icon: Bug,
    prompt: 'Find bugs, potential issues, and security vulnerabilities in this code.',
  },
  {
    id: 'tests',
    label: 'Generate Tests',
    description: 'Create unit tests',
    icon: FileText,
    prompt: 'Generate comprehensive unit tests for this code.',
  },
]

export default function CommandPalette({
  isOpen,
  onClose,
  fileContent,
  language,
  onApplyCode,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [response, setResponse] = useState('')
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const responseRef = useRef<HTMLDivElement>(null)
  const { getToken } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResponse('')
      setSelectedCommand(null)
      setStreaming(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [response])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredCommands = commands.filter(
    c =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase())
  )

  const executeCommand = useCallback(
    async (cmd: Command) => {
      setSelectedCommand(cmd)
      setResponse('')
      setStreaming(true)

      try {
        const token = await getToken()
        if (!token) {
          setResponse('Authentication error')
          setStreaming(false)
          return
        }

        await streamAssistResponse(
          {
            file_content: fileContent,
            prompt: cmd.prompt,
            language: language || 'text',
          },
          token,
          (tk: string) => setResponse(prev => prev + tk),
          () => setStreaming(false),
          (err: string) => {
            setResponse(prev => prev + `\n\nError: ${err}`)
            setStreaming(false)
          }
        )
      } catch {
        setResponse('Failed to connect to AI service')
        setStreaming(false)
      }
    },
    [fileContent, language, getToken]
  )

  const handleCustomPrompt = useCallback(async () => {
    if (!query.trim()) return
    const cmd: Command = {
      id: 'custom',
      label: query,
      description: '',
      icon: Sparkles,
      prompt: query,
    }
    await executeCommand(cmd)
  }, [query, executeCommand])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-800">
          <Search className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && query.trim()) {
                e.preventDefault()
                handleCustomPrompt()
              }
            }}
            placeholder="Ask AI anything or pick a command..."
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands or Response */}
        {selectedCommand ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <selectedCommand.icon className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-medium text-zinc-200">
                  {selectedCommand.label}
                </span>
                {streaming && (
                  <span className="text-[10px] text-indigo-400 animate-pulse">
                    streaming...
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedCommand(null)
                  setResponse('')
                }}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div
              ref={responseRef}
              className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 max-h-64 overflow-y-auto"
            >
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                {response || (streaming ? '' : 'No response')}
              </pre>
            </div>
            {response && !streaming && onApplyCode && (
              <button
                onClick={() => {
                  onApplyCode(response)
                  onClose()
                }}
                className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Apply to editor
              </button>
            )}
          </div>
        ) : (
          <div className="py-1 max-h-64 overflow-y-auto">
            {filteredCommands.map(cmd => (
              <button
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left"
              >
                <cmd.icon className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200">{cmd.label}</p>
                  <p className="text-xs text-zinc-500">{cmd.description}</p>
                </div>
              </button>
            ))}
            {query.trim() && (
              <button
                onClick={handleCustomPrompt}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left border-t border-zinc-800"
              >
                <Sparkles className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200">
                    Ask: "{query}"
                  </p>
                  <p className="text-xs text-zinc-500">Send as custom prompt</p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
