import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAIGeneration } from '../hooks/useAIGeneration'
import AIProgress from '../components/AIProgress'
import { Play, Sparkles } from 'lucide-react'

export default function AIGenerationExample() {
  const { projectId } = useParams<{ projectId: string }>()
  const [prompt, setPrompt] = useState('')
  const [techStack, setTechStack] = useState<string[]>(['react', 'typescript', 'tailwindcss'])
  
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
    isConnected
  } = useAIGeneration({
    projectId: projectId || '',
    onProgress: (update) => {
      console.log('AI Progress:', update)
    },
    onComplete: (session) => {
      console.log('AI Generation Complete:', session)
    },
    onError: (error) => {
      console.error('AI Generation Error:', error)
    }
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
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">AI Project Generation</h1>
          <p className="text-gray-400">Let AI build your project with real-time progress updates</p>
        </div>

        {/* Connection Status */}
        <div className="text-center">
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Project Description</h2>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to build... (e.g., 'Create a todo app with React and TypeScript')"
            className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
            disabled={isGenerating}
          />
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tech Stack
            </label>
            <div className="flex flex-wrap gap-2">
              {['react', 'vue', 'angular', 'typescript', 'javascript', 'tailwindcss', 'css', 'nodejs', 'python'].map((tech) => (
                <button
                  key={tech}
                  onClick={() => {
                    if (techStack.includes(tech)) {
                      setTechStack(techStack.filter(t => t !== tech))
                    } else {
                      setTechStack([...techStack, tech])
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    techStack.includes(tech)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={isGenerating}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleStartGeneration}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Start AI Generation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Progress */}
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

        {/* Instructions */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3">How it works:</h3>
          <ol className="space-y-2 text-gray-300">
            <li>1. <strong>Describe your project</strong> - Tell AI what you want to build</li>
            <li>2. <strong>Select tech stack</strong> - Choose your preferred technologies</li>
            <li>3. <strong>AI generates</strong> - Watch as AI creates files in real-time</li>
            <li>4. <strong>Control the process</strong> - Pause, resume, or stop anytime</li>
            <li>5. <strong>Start coding</strong> - Your project is ready to customize</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
