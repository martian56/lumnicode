import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '@clerk/clerk-react'
import { apiClient } from '../lib/api'
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Check,
  Code,
  Database,
  Globe,
  Server,
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

const techStacks = [
  {
    category: 'Frontend',
    description: 'Choose your frontend framework',
    technologies: [
      { id: 'react', name: 'React', description: 'JavaScript UI library' },
      { id: 'vue', name: 'Vue.js', description: 'Progressive JS framework' },
      { id: 'angular', name: 'Angular', description: 'Full-featured platform' },
      { id: 'svelte', name: 'Svelte', description: 'Compile-time framework' },
    ],
  },
  {
    category: 'Backend',
    description: 'Choose your backend technology',
    technologies: [
      { id: 'nodejs', name: 'Node.js', description: 'JavaScript runtime' },
      { id: 'python', name: 'Python', description: 'General-purpose language' },
      { id: 'java', name: 'Java', description: 'Enterprise language' },
      { id: 'go', name: 'Go', description: 'Systems language' },
    ],
  },
  {
    category: 'Database',
    description: 'Choose your database',
    technologies: [
      { id: 'mongodb', name: 'MongoDB', description: 'Document database' },
      {
        id: 'postgresql',
        name: 'PostgreSQL',
        description: 'Relational database',
      },
      { id: 'mysql', name: 'MySQL', description: 'Relational DBMS' },
      { id: 'redis', name: 'Redis', description: 'In-memory store' },
    ],
  },
  {
    category: 'Deployment',
    description: 'Choose your deployment platform',
    technologies: [
      { id: 'aws', name: 'AWS', description: 'Cloud platform' },
      { id: 'vercel', name: 'Vercel', description: 'Frontend platform' },
      { id: 'netlify', name: 'Netlify', description: 'Web platform' },
      { id: 'docker', name: 'Docker', description: 'Containerization' },
    ],
  },
]

const categoryIcons: Record<string, React.ReactNode> = {
  Frontend: <Code className="h-4 w-4" />,
  Backend: <Server className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  Deployment: <Globe className="h-4 w-4" />,
}

export default function ProjectCreationPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [currentStep, setCurrentStep] = useState<
    'chat' | 'tech' | 'details' | 'creating'
  >('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content:
        "Tell me about the project you'd like to create. What kind of application are you building?",
      timestamp: new Date(),
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedTechs, setSelectedTechs] = useState<string[]>([])
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date(),
    }
    setChatMessages(prev => [...prev, userMessage])
    const input = chatInput
    setChatInput('')
    setIsTyping(true)

    try {
      const token = await getToken()
      const conversationContext = chatMessages
        .map(m => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')
      const response = await apiClient.post(
        '/assist',
        {
          file_content: conversationContext,
          prompt: `You are a helpful project planning assistant. The user is describing a project they want to build. Respond concisely (2-3 sentences). Ask a follow-up question to help clarify their requirements.\n\nUser: ${input}`,
          language: 'text',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const aiText =
        response.data?.suggestion ||
        "I'd be happy to help with that! Let's move on to selecting your technology stack."
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiText,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error('AI response failed:', error)
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content:
            "Thanks for sharing that! Let's proceed to choosing your tech stack — you can always come back to refine the details.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleTechToggle = (tech: string) => {
    setSelectedTechs(prev => {
      if (prev.includes(tech)) return prev.filter(t => t !== tech)
      const categories: Record<string, string> = {
        react: 'fe',
        vue: 'fe',
        angular: 'fe',
        svelte: 'fe',
        nodejs: 'be',
        python: 'be',
        java: 'be',
        go: 'be',
        mongodb: 'db',
        postgresql: 'db',
        mysql: 'db',
        redis: 'db',
        aws: 'cl',
        vercel: 'cl',
        netlify: 'cl',
        docker: 'cl',
      }
      const cat = categories[tech]
      if (cat) return [...prev.filter(t => categories[t] !== cat), tech]
      return [...prev, tech]
    })
  }

  const handleCreateProject = async () => {
    try {
      const token = await getToken()
      if (!token) return
      const response = await apiClient.post(
        '/projects',
        {
          name: projectName,
          description: projectDescription,
          tech_stack: selectedTechs,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate(`/editor/${response.data.id}`, {
        state: {
          aiPrompt: chatMessages.map(m => m.content).join(' '),
          techStack: selectedTechs,
          autoStartAI: true,
        },
      })
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const steps = ['chat', 'tech', 'details', 'creating'] as const
  const stepIndex = steps.indexOf(currentStep)

  const inputClass =
    'w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'

  return (
    <>
      <Helmet>
        <title>Create Project - Lumnicode</title>
        <meta
          name="description"
          content="Create a new project with AI assistance."
        />
      </Helmet>
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-800 flex-shrink-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <h1 className="text-sm font-semibold text-zinc-100">
            Create Project
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {steps.map((step, i) => (
                <div
                  key={step}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    currentStep === step
                      ? 'bg-indigo-500'
                      : i < stepIndex
                        ? 'bg-emerald-500'
                        : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500">{stepIndex + 1}/4</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-1">
              {currentStep === 'chat' && 'Describe your project'}
              {currentStep === 'tech' && 'Choose your stack'}
              {currentStep === 'details' && 'Project details'}
              {currentStep === 'creating' && 'Setting up'}
            </h2>
            <p className="text-sm text-zinc-500">
              {currentStep === 'chat' &&
                "Tell me about your project and I'll help you build it"}
              {currentStep === 'tech' &&
                'Select the technologies you want to use'}
              {currentStep === 'details' && 'Finalize your project information'}
              {currentStep === 'creating' &&
                'Configuring your project with selected technologies'}
            </p>
          </div>

          {/* Chat Step */}
          {currentStep === 'chat' && (
            <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3.5 py-2.5 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-[10px] opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 text-zinc-200 px-3.5 py-2.5 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                        <div
                          className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-zinc-800 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Describe your project idea..."
                    className={inputClass}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tech Step */}
          {currentStep === 'tech' && (
            <div className="space-y-5">
              {techStacks.map(category => (
                <div
                  key={category.category}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                      {categoryIcons[category.category]}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-zinc-200">
                        {category.category}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {category.technologies.map(tech => (
                      <button
                        key={tech.id}
                        onClick={() => handleTechToggle(tech.id)}
                        className={`relative p-3 rounded-lg border text-left transition-colors ${
                          selectedTechs.includes(tech.id)
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                        }`}
                      >
                        <p className="text-sm font-medium text-zinc-200">
                          {tech.name}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {tech.description}
                        </p>
                        {selectedTechs.includes(tech.id) && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-3.5 w-3.5 text-indigo-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Details Step */}
          {currentStep === 'details' && (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="My Project"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={e => setProjectDescription(e.target.value)}
                    placeholder="Describe your project..."
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
              {selectedTechs.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                  <h3 className="text-xs font-medium text-zinc-400 mb-2">
                    Selected Technologies
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTechs.map(tech => (
                      <span
                        key={tech}
                        className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Creating Step */}
          {currentStep === 'creating' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-5" />
                <h3 className="text-base font-medium text-zinc-200 mb-2">
                  Creating your project
                </h3>
                <p className="text-sm text-zinc-500 mb-6">
                  Setting up with the selected technologies
                </p>
                <div className="space-y-2 text-sm text-zinc-400 text-left max-w-xs mx-auto">
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />{' '}
                    Initializing project
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />{' '}
                    Installing dependencies
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />{' '}
                    Configuring environment
                  </p>
                  <p className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 border border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />{' '}
                    Setting up AI integration
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800">
            <button
              onClick={() => {
                if (stepIndex > 0) setCurrentStep(steps[stepIndex - 1])
              }}
              disabled={currentStep === 'chat'}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => {
                if (currentStep === 'details') handleCreateProject()
                else if (stepIndex < steps.length - 1)
                  setCurrentStep(steps[stepIndex + 1])
              }}
              disabled={
                (currentStep === 'chat' && chatMessages.length <= 1) ||
                (currentStep === 'tech' && selectedTechs.length === 0) ||
                (currentStep === 'details' &&
                  (!projectName.trim() || !projectDescription.trim()))
              }
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>
                {currentStep === 'details' ? 'Create Project' : 'Continue'}
              </span>
              {currentStep !== 'details' && (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
