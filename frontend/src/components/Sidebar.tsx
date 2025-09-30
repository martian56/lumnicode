import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { 
  Home, 
  FolderOpen, 
  Key, 
  Settings, 
  HelpCircle, 
  Sparkles, 
  MessageSquare, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Code2,
  Clock,
  Palette,
  X,
  Send
} from 'lucide-react'
import { apiClient } from '../lib/api'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<any>
  path: string
  badge?: string
  isActive?: boolean
}

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: () => void
  color: string
}

interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at?: string
  tech_stack?: string[]
  status?: string
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { getToken } = useAuth()
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])

  useEffect(() => {
    loadRecentProjects()
  }, [])

  const loadRecentProjects = async () => {
    try {
      const token = await getToken()
      const response = await apiClient.get('/projects', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const projects = response.data
      
      // Sort projects by most recent activity and take the first 3
      const sortedProjects = projects.sort((a: Project, b: Project) => {
        const aTime = new Date(a.updated_at || a.created_at).getTime()
        const bTime = new Date(b.updated_at || b.created_at).getTime()
        return bTime - aTime
      })
      
      setRecentProjects(sortedProjects.slice(0, 3))
    } catch (error) {
      console.error('Failed to load recent projects:', error)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    // Less than 10 seconds
    if (diffInSeconds < 10) return 'Just now'
    
    // Less than 1 minute
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    
    // Less than 1 hour
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    // Less than 1 day
    const diffInHours = Math.floor(diffInSeconds / (60 * 60))
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    // Less than 1 week
    const diffInDays = Math.floor(diffInSeconds / (60 * 60 * 24))
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    // More than a week - show formatted date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getTechStackDisplay = (project: Project) => {
    if (project.tech_stack && project.tech_stack.length > 0) {
      return project.tech_stack.slice(0, 2).join(' + ')
    }
    return 'No tech stack'
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/',
      isActive: location.pathname === '/'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderOpen,
      path: '/projects',
      // badge: '12', // Mock data
      isActive: location.pathname === '/projects'
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      icon: Key,
      path: '/api-keys',
      isActive: location.pathname === '/api-keys'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      isActive: location.pathname === '/settings'
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircle,
      path: '/help',
      isActive: location.pathname === '/help'
    }
  ]

  const quickActions: QuickAction[] = [
    {
      id: 'ai-chat',
      label: 'AI Assistant',
      icon: MessageSquare,
      action: () => setShowQuickActions(true),
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'new-project',
      label: 'New Project',
      icon: Plus,
      action: () => navigate('/projects'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: Sparkles,
      action: () => navigate('/projects'),
      color: 'from-green-500 to-emerald-500'
    }
  ]

  const techStacks = [
    { id: 'react', name: 'React', icon: '⚛️', color: 'text-blue-400' },
    { id: 'vue', name: 'Vue.js', icon: '💚', color: 'text-green-400' },
    { id: 'angular', name: 'Angular', icon: '🔴', color: 'text-red-400' },
    { id: 'nextjs', name: 'Next.js', icon: '▲', color: 'text-gray-400' },
    { id: 'nuxt', name: 'Nuxt.js', icon: '💚', color: 'text-green-400' },
    { id: 'svelte', name: 'Svelte', icon: '🧡', color: 'text-orange-400' },
    { id: 'typescript', name: 'TypeScript', icon: '🔷', color: 'text-blue-400' },
    { id: 'tailwind', name: 'Tailwind CSS', icon: '🎨', color: 'text-cyan-400' },
    { id: 'nodejs', name: 'Node.js', icon: '🟢', color: 'text-green-400' },
    { id: 'express', name: 'Express', icon: '⚡', color: 'text-gray-400' },
    { id: 'mongodb', name: 'MongoDB', icon: '🍃', color: 'text-green-400' },
    { id: 'postgresql', name: 'PostgreSQL', icon: '🐘', color: 'text-blue-400' }
  ]

  return (
    <>
      {/* Sidebar */}
      <div className={`bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 relative z-20 min-h-screen ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-75"></div>
                    <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-xl p-2">
                      <Code2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Lumnicode
                    </h1>
                    <p className="text-xs text-gray-400">AI-Powered IDE</p>
                  </div>
                </div>
              )}
              <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-white transition-all duration-200"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-700/50">
            <div className={`${isCollapsed ? 'space-y-2' : 'grid grid-cols-3 gap-2'}`}>
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`group relative overflow-hidden rounded-xl p-3 transition-all duration-300 hover:scale-105 z-10 cursor-pointer ${
                    isCollapsed ? 'w-full' : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
                  <div className="relative flex flex-col items-center space-y-1">
                    <action.icon className="h-5 w-5 text-white" />
                    {!isCollapsed && (
                      <span className="text-xs text-gray-300 font-medium">{action.label}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    console.log('Navigating to:', item.path)
                    navigate(item.path)
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 group relative z-10 cursor-pointer ${
                    item.isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tech Stack Section */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>Popular Tech Stacks</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {techStacks.slice(0, 6).map((tech) => (
                  <button
                    key={tech.id}
                    className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 group"
                  >
                    <span className="text-sm">{tech.icon}</span>
                    <span className={`text-xs font-medium ${tech.color} group-hover:text-white transition-colors`}>
                      {tech.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Recent Projects</span>
              </h3>
              <div className="space-y-2">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 group relative z-10 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                            {project.name}
                          </p>
                          <p className="text-xs text-gray-500">{getTechStackDisplay(project)}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(project.updated_at || project.created_at)}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-3 w-fit mx-auto mb-2 backdrop-blur-xl border border-gray-700/50">
                      <FolderOpen className="mx-auto h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">No projects yet</p>
                    <button
                      onClick={() => navigate('/create-project')}
                      className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-xs font-medium"
                    >
                      Create Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Modal */}
      {showQuickActions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl p-6 w-full max-w-2xl mx-auto border border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-3">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">AI Project Assistant</h3>
                  <p className="text-gray-400">Describe your project and I'll help you create it</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickActions(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Chat Interface */}
              <div className="bg-gray-900/50 rounded-2xl p-4 h-64 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-700/50 rounded-xl p-3 max-w-xs">
                      <p className="text-sm text-gray-200">
                        Hi! I'm your AI assistant. Tell me what kind of project you'd like to build and I'll help you create it with the right tech stack.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Describe your project... (e.g., 'Create a todo app with React and Node.js')"
                  className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>

              {/* Quick Suggestions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Suggestions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'E-commerce website',
                    'Portfolio site',
                    'Blog platform',
                    'API dashboard',
                    'Chat application',
                    'Task manager'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      className="p-3 text-left bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 rounded-lg transition-all duration-200 group"
                    >
                      <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {suggestion}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
