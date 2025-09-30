import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'
import { 
  Plus, 
  FolderOpen, 
  Sparkles, 
  Activity,
  TrendingUp,
  Key
} from 'lucide-react'
import { apiClient } from '../lib/api'

interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at?: string
  tech_stack?: string[]
  status?: string
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    recentActivity: 0,
    aiAssistance: 0,
    productivity: 0
  })
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const navigate = useNavigate()
  const { getToken } = useAuth()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const token = await getToken()
      const response = await apiClient.get('/projects', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const projects = response.data
      
      // Sort projects by most recent activity (updated_at or created_at)
      const sortedProjects = projects.sort((a: Project, b: Project) => {
        const aTime = new Date(a.updated_at || a.created_at).getTime()
        const bTime = new Date(b.updated_at || b.created_at).getTime()
        return bTime - aTime
      })
      
      // Get the 4 most recent projects
      const recent = sortedProjects.slice(0, 4)
      setRecentProjects(recent)
      
      setStats({
        totalProjects: projects.length,
        recentActivity: projects.filter((p: Project) => {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return new Date(p.created_at) > weekAgo
        }).length,
        aiAssistance: Math.floor(Math.random() * 50) + 20, // Mock data
        productivity: Math.floor(Math.random() * 30) + 70 // Mock data
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
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

  const getActivityIcon = (project: Project) => {
    // Determine activity type based on when it was last updated vs created
    const updatedAt = project.updated_at ? new Date(project.updated_at) : null
    const createdAt = new Date(project.created_at)
    
    if (!updatedAt || updatedAt.getTime() === createdAt.getTime()) {
      return Plus // Newly created
    } else {
      return Activity // Recently updated
    }
  }

  const getActivityText = (project: Project) => {
    const updatedAt = project.updated_at ? new Date(project.updated_at) : null
    const createdAt = new Date(project.created_at)
    
    if (!updatedAt || updatedAt.getTime() === createdAt.getTime()) {
      return 'Created project'
    } else {
      return 'Updated project'
    }
  }


  return (
    <>
      <Helmet>
        <title>Dashboard - Lumnicode</title>
        <meta name="description" content="Your AI-powered development dashboard. Manage projects, track activity, and start building with AI assistance." />
      </Helmet>
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Page Title */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>

            {/* User Controls */}
            <div className="flex items-center">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-gray-400 text-base lg:text-lg">
              Ready to build something amazing with AI assistance?
            </p>
          </div>

          {/* AI Assistant Quick Access */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Assistant Ready</h3>
                  <p className="text-gray-300 text-sm">Start a conversation to build your next project</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/create-project')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Start Chat</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-2 lg:p-3">
                  <FolderOpen className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-white">{stats.totalProjects}</p>
                  <p className="text-xs lg:text-sm text-gray-400">Total Projects</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-2 lg:p-3">
                  <Activity className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-white">{stats.recentActivity}</p>
                  <p className="text-xs lg:text-sm text-gray-400">This Week</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl p-2 lg:p-3">
                  <Sparkles className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-white">{stats.aiAssistance}</p>
                  <p className="text-xs lg:text-sm text-gray-400">AI Suggestions</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-2 lg:p-3">
                  <TrendingUp className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-white">{stats.productivity}%</p>
                  <p className="text-xs lg:text-sm text-gray-400">Productivity</p>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Get Started</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => navigate('/create-project')}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-700/50 transition-all duration-200 text-left group"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      Create New Project
                    </h4>
                    <p className="text-sm text-gray-400">Start building with AI</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  Use our AI Assistant to create your next project with the perfect tech stack.
                </p>
              </button>

              <button
                onClick={() => navigate('/projects')}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-700/50 transition-all duration-200 text-left group"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      Browse Projects
                    </h4>
                    <p className="text-sm text-gray-400">View all your projects</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  Manage, organize, and collaborate on your development projects.
                </p>
              </button>

              <button
                onClick={() => navigate('/api-keys')}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-700/50 transition-all duration-200 text-left group"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3">
                    <Key className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      Manage API Keys
                    </h4>
                    <p className="text-sm text-gray-400">Configure AI services</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  Add and manage your AI service API keys for enhanced functionality.
                </p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
              <button 
                onClick={() => navigate('/projects')}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                View All Projects
              </button>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="space-y-4">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project) => {
                    const ActivityIcon = getActivityIcon(project)
                    const activityText = getActivityText(project)
                    const timeString = formatRelativeTime(project.updated_at || project.created_at)
                    
                    return (
                      <div 
                        key={project.id} 
                        className="flex items-center space-x-4 p-3 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-2">
                          <ActivityIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{activityText}</p>
                          <p className="text-gray-400 text-sm">{project.name}</p>
                        </div>
                        <span className="text-gray-500 text-sm">{timeString}</span>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-2xl p-6 w-fit mx-auto mb-4 backdrop-blur-xl border border-gray-700/50">
                      <FolderOpen className="mx-auto h-12 w-12 text-gray-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">No projects yet</h4>
                    <p className="text-gray-400 text-sm mb-4">Create your first project to see recent activity here.</p>
                    <button
                      onClick={() => navigate('/create-project')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-sm font-medium"
                    >
                      Create Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

      </main>
    </>
  )
}