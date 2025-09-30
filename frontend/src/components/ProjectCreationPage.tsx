import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '@clerk/clerk-react'
import { apiClient } from '../lib/api'
import {
  ArrowLeft,
  Send,
  Check,
  Code,
  Palette,
  Database,
  Globe,
  Server,
  Rocket
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
    icon: <Palette className="h-5 w-5" />,
    technologies: [
      { id: 'react', name: 'React', description: 'A JavaScript library for building user interfaces', icon: <Code className="h-4 w-4" /> },
      { id: 'vue', name: 'Vue.js', description: 'Progressive JavaScript framework', icon: <Code className="h-4 w-4" /> },
      { id: 'angular', name: 'Angular', description: 'Platform for building mobile and desktop web applications', icon: <Code className="h-4 w-4" /> },
      { id: 'svelte', name: 'Svelte', description: 'Cybernetically enhanced web apps', icon: <Code className="h-4 w-4" /> }
    ]
  },
  {
    category: 'Backend',
    description: 'Choose your backend technology',
    icon: <Server className="h-5 w-5" />,
    technologies: [
      { id: 'nodejs', name: 'Node.js', description: 'JavaScript runtime built on Chrome\'s V8 engine', icon: <Code className="h-4 w-4" /> },
      { id: 'python', name: 'Python', description: 'High-level programming language', icon: <Code className="h-4 w-4" /> },
      { id: 'java', name: 'Java', description: 'Object-oriented programming language', icon: <Code className="h-4 w-4" /> },
      { id: 'go', name: 'Go', description: 'Open source programming language', icon: <Code className="h-4 w-4" /> }
    ]
  },
  {
    category: 'Database',
    description: 'Choose your database solution',
    icon: <Database className="h-5 w-5" />,
    technologies: [
      { id: 'mongodb', name: 'MongoDB', description: 'NoSQL document database', icon: <Database className="h-4 w-4" /> },
      { id: 'postgresql', name: 'PostgreSQL', description: 'Open source relational database', icon: <Database className="h-4 w-4" /> },
      { id: 'mysql', name: 'MySQL', description: 'Open source relational database management system', icon: <Database className="h-4 w-4" /> },
      { id: 'redis', name: 'Redis', description: 'In-memory data structure store', icon: <Database className="h-4 w-4" /> }
    ]
  },
  {
    category: 'Cloud & Deployment',
    description: 'Choose your deployment platform',
    icon: <Globe className="h-5 w-5" />,
    technologies: [
      { id: 'aws', name: 'AWS', description: 'Amazon Web Services cloud platform', icon: <Globe className="h-4 w-4" /> },
      { id: 'vercel', name: 'Vercel', description: 'Platform for frontend developers', icon: <Globe className="h-4 w-4" /> },
      { id: 'netlify', name: 'Netlify', description: 'Web development platform', icon: <Globe className="h-4 w-4" /> },
      { id: 'docker', name: 'Docker', description: 'Containerization platform', icon: <Globe className="h-4 w-4" /> }
    ]
  }
]

export default function ProjectCreationPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [currentStep, setCurrentStep] = useState<'chat' | 'tech' | 'details' | 'creating'>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI assistant. Tell me about the project you'd like to create. What kind of application are you building?",
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedTechs, setSelectedTechs] = useState<string[]>([])
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const generateAIResponse = () => {
    const responses = [
      "That sounds like an interesting project! What specific features are you planning to include?",
      "Great idea! What technology stack are you thinking of using?",
      "I can help you build that! What's your target audience?",
      "Excellent! Do you have any specific design preferences or requirements?",
      "Perfect! Let's move on to selecting your technology stack. What type of application is this?"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsTyping(true)

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(),
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleTechToggle = (tech: string) => {
    setSelectedTechs(prev => {
      if (prev.includes(tech)) {
        return prev.filter(t => t !== tech)
      }
      
      const techCategories = {
        'react': 'frontend',
        'vue': 'frontend',
        'angular': 'frontend',
        'svelte': 'frontend',
        'nodejs': 'backend',
        'python': 'backend',
        'java': 'backend',
        'go': 'backend',
        'mongodb': 'database',
        'postgresql': 'database',
        'mysql': 'database',
        'redis': 'database',
        'aws': 'cloud',
        'vercel': 'cloud',
        'netlify': 'cloud',
        'docker': 'cloud'
      }
      
      const category = techCategories[tech as keyof typeof techCategories]
      if (category) {
        const filtered = prev.filter(t => techCategories[t as keyof typeof techCategories] !== category)
        return [...filtered, tech]
      }
      
      return [...prev, tech]
    })
  }

  const handleCreateProject = async () => {
    try {
      const token = await getToken()
      if (!token) return

      const response = await apiClient.post('/projects', {
        name: projectName,
        description: projectDescription,
        tech_stack: selectedTechs
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      navigate(`/editor/${response.data.id}`, {
        state: {
          aiPrompt: chatMessages.map(m => m.content).join(' '),
          techStack: selectedTechs,
          autoStartAI: true
        }
      })
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'chat': return 'Describe your project idea'
      case 'tech': return 'Choose your technology stack'
      case 'details': return 'Project details'
      case 'creating': return 'Setting up your project'
      default: return ''
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'chat': return 'Tell me about your project and I\'ll help you build it'
      case 'tech': return 'Select the technologies you want to use'
      case 'details': return 'Finalize your project details'
      case 'creating': return 'Setting up your project with the selected technologies'
      default: return ''
    }
  }

  return (
    <>
      <Helmet>
        <title>Create Project - Lumnicode</title>
        <meta name="description" content="Create a new AI-powered project. Chat with AI to describe your idea, choose your tech stack, and start building." />
      </Helmet>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <main className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Dashboard</span>
                </button>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl font-semibold text-white">Create New Project</h1>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {['chat', 'tech', 'details', 'creating'].map((step, index) => (
                      <div
                        key={step}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          currentStep === step
                            ? 'bg-purple-500'
                            : index < ['chat', 'tech', 'details', 'creating'].indexOf(currentStep)
                            ? 'bg-green-500'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    {['chat', 'tech', 'details', 'creating'].indexOf(currentStep) + 1} of 4
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {getStepTitle()}
              </h2>
              <p className="text-gray-400">
                {getStepDescription()}
              </p>
            </div>

            {/* Step Content */}
            {currentStep === 'chat' && (
              <div className="flex-1 flex flex-col bg-gray-900/50 backdrop-blur-lg border border-gray-700/50 rounded-xl overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 text-gray-100 px-4 py-3 rounded-2xl">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="border-t border-gray-700/50 p-4">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Describe your project idea..."
                      className="flex-1 bg-gray-800 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'tech' && (
              <div className="space-y-8">
                {techStacks.map((category) => (
                  <div key={category.category} className="bg-gray-900/50 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{category.category}</h3>
                        <p className="text-gray-400 text-sm">{category.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {category.technologies.map((tech) => (
                        <button
                          key={tech.id}
                          onClick={() => handleTechToggle(tech.id)}
                          className={`relative p-4 rounded-lg border transition-all ${
                            selectedTechs.includes(tech.id)
                              ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                              : 'border-gray-600/50 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                              {tech.icon}
                            </div>
                            <div className="text-left">
                              <p className="font-medium">{tech.name}</p>
                              <p className="text-xs opacity-70">{tech.description}</p>
                            </div>
                          </div>
                          {selectedTechs.includes(tech.id) && (
                            <div className="absolute top-2 right-2">
                              <Check className="h-4 w-4 text-purple-400" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 'details' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Project Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name..."
                        className="w-full bg-gray-800 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Description
                      </label>
                      <textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Describe your project..."
                        rows={4}
                        className="w-full bg-gray-800 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Selected Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTechs.map((tech) => (
                      <span
                        key={tech}
                        className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'creating' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Rocket className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Creating Your Project</h3>
                  <p className="text-gray-400 mb-6">Setting up your project with the selected technologies</p>
                  <div className="space-y-2 text-left max-w-md mx-auto">
                    <p>✓ Initializing project structure</p>
                    <p>✓ Installing dependencies</p>
                    <p>✓ Configuring development environment</p>
                    <p>⏳ Setting up AI integration</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={() => {
                  const steps = ['chat', 'tech', 'details', 'creating']
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1] as any)
                  }
                }}
                disabled={currentStep === 'chat'}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                onClick={() => {
                  if (currentStep === 'details') {
                    handleCreateProject()
                  } else {
                    const steps = ['chat', 'tech', 'details', 'creating']
                    const currentIndex = steps.indexOf(currentStep)
                    if (currentIndex < steps.length - 1) {
                      setCurrentStep(steps[currentIndex + 1] as any)
                    }
                  }
                }}
                disabled={
                  (currentStep === 'chat' && chatMessages.length <= 1) ||
                  (currentStep === 'tech' && selectedTechs.length === 0) ||
                  (currentStep === 'details' && (!projectName.trim() || !projectDescription.trim()))
                }
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <span>
                  {currentStep === 'details' ? 'Create Project' : 'Continue'}
                </span>
                {currentStep !== 'details' && <ArrowLeft className="h-4 w-4 rotate-180" />}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}