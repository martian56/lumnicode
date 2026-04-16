import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAIGeneration } from '../hooks/useAIGeneration'
import AIProgress from '../components/AIProgress'
import { Play, Sparkles } from 'lucide-react'

export default function AIGenerationExample() {
  const { projectId } = useParams<{ projectId: string }>()
  const [prompt, setPrompt] = useState('')
  const [techStack, setTechStack] = useState<string[]>([
    'react',
    'typescript',
    'tailwindcss',
  ])

  const {
    isGenerating,
    isPaused,
    progress,
    currentTask,
    error,
    startGeneration,
    stopGeneration,
    pauseGeneration,
    resumeGeneration,
    isConnected,
  } = useAIGeneration({
    projectId: projectId || '',
    onProgress: update => {
      console.log('AI Progress:', update)
    },
    onComplete: session => {
      console.log('AI Generation Complete:', session)
    },
    onError: error => {
      console.error('AI Generation Error:', error)
    },
  })

  const handleStartGeneration = async () => {
    if (!prompt.trim()) return
    try {
      await startGeneration(prompt, techStack)
    } catch (err) {
      console.error('Failed to start generation:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-1">AI Project Generation</h1>
          <p className="text-sm text-zinc-500">
            Let AI build your project with real-time progress
          </p>
        </div>

        <div className="text-center">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
            />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-zinc-200 mb-3">
            Project Description
          </h2>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what you want to build..."
            className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            disabled={isGenerating}
          />

          <div className="mt-3">
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Tech Stack
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'react',
                'vue',
                'angular',
                'typescript',
                'javascript',
                'tailwindcss',
                'css',
                'nodejs',
                'python',
              ].map(tech => (
                <button
                  key={tech}
                  onClick={() =>
                    techStack.includes(tech)
                      ? setTechStack(techStack.filter(t => t !== tech))
                      : setTechStack([...techStack, tech])
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    techStack.includes(tech)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  disabled={isGenerating}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleStartGeneration}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Generation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {(isGenerating || isPaused || error) && (
          <AIProgress
            isGenerating={isGenerating}
            isPaused={isPaused}
            progress={progress}
            currentTask={currentTask}
            error={error}
            onStop={stopGeneration}
            onPause={pauseGeneration}
            onResume={resumeGeneration}
          />
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h3 className="text-sm font-medium text-zinc-200 mb-3">
            How it works
          </h3>
          <ol className="space-y-2 text-sm text-zinc-400">
            <li>
              1. <span className="text-zinc-300">Describe your project</span> -
              Tell AI what to build
            </li>
            <li>
              2. <span className="text-zinc-300">Select tech stack</span> -
              Choose your technologies
            </li>
            <li>
              3. <span className="text-zinc-300">AI generates</span> - Watch
              files created in real-time
            </li>
            <li>
              4. <span className="text-zinc-300">Control the process</span> -
              Pause, resume, or stop
            </li>
            <li>
              5. <span className="text-zinc-300">Start coding</span> - Your
              project is ready
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
