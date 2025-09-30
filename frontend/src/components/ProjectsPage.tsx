import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Grid, 
  List, 
  Clock,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Activity,
  TrendingUp,
  Archive,
  Users,
  ChevronDown
} from 'lucide-react'
import { apiClient } from '../lib/api'

interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at?: string
  tech_stack?: string[]
  status?: 'active' | 'archived' | 'draft'
  visibility?: 'private' | 'public'
  collaborators?: number
  last_activity?: string
}

interface ProjectStats {
  total: number
  active: number
  archived: number
  thisWeek: number
  thisMonth: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'recent' | 'status'>('recent')
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'archived' | 'draft'>('all')
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const navigate = useNavigate()
  const { getToken } = useAuth()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const token = await getToken()
      const response = await apiClient.get('/projects', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const projectStats: ProjectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active' || !p.status).length,
    archived: projects.filter(p => p.status === 'archived').length,
    thisWeek: projects.filter(p => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(p.created_at) > weekAgo
    }).length,
    thisMonth: projects.filter(p => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(p.created_at) > monthAgo
    }).length
  }

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (filterBy === 'all') return matchesSearch
      return matchesSearch && (project.status === filterBy || (!project.status && filterBy === 'active'))
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'status':
          return (a.status || 'active').localeCompare(b.status || 'active')
        case 'recent':
        default:
          return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      }
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
    return formatDate(dateString)
  }

  const getTechStackIcon = (tech: string) => {
    const techIcons: { [key: string]: string } = {
      'react': '⚛️',
      'vue': '💚',
      'angular': '🔴',
      'nextjs': '▲',
      'nuxt': '💚',
      'svelte': '🧡',
      'typescript': '🔷',
      'tailwind': '🎨',
      'nodejs': '🟢',
      'express': '⚡',
      'mongodb': '🍃',
      'postgresql': '🐘'
    }
    return techIcons[tech] || '🔧'
  }

  const handleProjectAction = (action: string) => {
    setShowProjectMenu(null)
    switch (action) {
      case 'edit':
        // TODO: Implement edit functionality
        break
      case 'duplicate':
        // TODO: Implement duplicate functionality
        break
      case 'share':
        // TODO: Implement share functionality
        break
      case 'archive':
        // TODO: Implement archive functionality
        break
      case 'delete':
        // TODO: Implement delete functionality
        break
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on projects:`, selectedProjects)
    setSelectedProjects([])
  }

  return (
    <>
      <Helmet>
        <title>Projects - Lumnicode</title>
        <meta name="description" content="Manage your AI-powered projects. View, edit, and organize all your development projects in one place." />
      </Helmet>
          {/* Header */}
          <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Page Title */}
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Projects
                  </h1>
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400">
                    <span>{projectStats.total} total</span>
                    <span>•</span>
                    <span>{projectStats.active} active</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-gray-700/50 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 lg:p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-2 lg:p-3">
                    <FolderOpen className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg lg:text-2xl font-bold text-white">{projectStats.total}</p>
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
                    <p className="text-lg lg:text-2xl font-bold text-white">{projectStats.active}</p>
                    <p className="text-xs lg:text-sm text-gray-400">Active</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 lg:p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-2 lg:p-3">
                    <Archive className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg lg:text-2xl font-bold text-white">{projectStats.archived}</p>
                    <p className="text-xs lg:text-sm text-gray-400">Archived</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 lg:p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl p-2 lg:p-3">
                    <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg lg:text-2xl font-bold text-white">{projectStats.thisWeek}</p>
                    <p className="text-xs lg:text-sm text-gray-400">This Week</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 lg:p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-2 lg:p-3">
                    <TrendingUp className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg lg:text-2xl font-bold text-white">{projectStats.thisMonth}</p>
                    <p className="text-xs lg:text-sm text-gray-400">This Month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/create-project')}
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 lg:px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2 font-medium w-full sm:w-auto justify-center"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span>New Project</span>
                </button>
                
                {selectedProjects.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('archive')}
                      className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white text-sm hover:bg-gray-600/50 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Archive className="h-4 w-4" />
                      <span>Archive</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-300 text-sm hover:bg-red-600/30 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="appearance-none bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:bg-gray-800/50 cursor-pointer min-w-[140px]"
                    >
                      <option value="recent" className="bg-gray-900 text-white">Recent</option>
                      <option value="name" className="bg-gray-900 text-white">Name</option>
                      <option value="date" className="bg-gray-900 text-white">Date Created</option>
                      <option value="status" className="bg-gray-900 text-white">Status</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as any)}
                      className="appearance-none bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:bg-gray-800/50 cursor-pointer min-w-[140px]"
                    >
                      <option value="all" className="bg-gray-900 text-white">All Projects</option>
                      <option value="active" className="bg-gray-900 text-white">Active</option>
                      <option value="archived" className="bg-gray-900 text-white">Archived</option>
                      <option value="draft" className="bg-gray-900 text-white">Draft</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Display */}
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your projects...</p>
                </div>
              </div>
            ) : filteredAndSortedProjects.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-3xl p-8 w-fit mx-auto mb-8 backdrop-blur-xl border border-gray-700/50">
                  <FolderOpen className="mx-auto h-16 w-16 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {searchTerm ? 'No projects found' : 'No projects yet'}
                </h3>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                  {searchTerm
                    ? 'Try adjusting your search terms or create a new project to get started.'
                    : 'Create your first project and start building amazing applications with AI assistance.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate('/create-project')}
                    className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2 font-medium mx-auto"
                  >
                    <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
                    <span>Create Your First Project</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            ) : (
              <div className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6'
                  : 'space-y-3 lg:space-y-4'
              }`}>
                {filteredAndSortedProjects.map((project, index) => (
                  <div
                    key={project.id}
                    className={`group bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer ${
                      viewMode === 'list' 
                        ? 'flex items-center space-x-4 p-4 lg:p-6' 
                        : 'p-4 lg:p-6'
                    } ${selectedProjects.includes(project.id) ? 'ring-2 ring-purple-500' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-2 group-hover:scale-110 transition-transform duration-300">
                              <FolderOpen className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                {project.name}
                              </h3>
                              <div className="flex items-center text-xs text-gray-400">
                                <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span>{formatRelativeTime(project.updated_at || project.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowProjectMenu(showProjectMenu === project.id ? null : project.id)
                              }}
                              className="p-1 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {showProjectMenu === project.id && (
                              <div className="absolute right-0 top-8 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-2 shadow-2xl z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleProjectAction('edit')
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50 rounded-lg flex items-center space-x-2"
                                >
                                  <Edit3 className="h-4 w-4" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleProjectAction('duplicate')
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50 rounded-lg flex items-center space-x-2"
                                >
                                  <Copy className="h-4 w-4" />
                                  <span>Duplicate</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleProjectAction('share')
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50 rounded-lg flex items-center space-x-2"
                                >
                                  <Share2 className="h-4 w-4" />
                                  <span>Share</span>
                                </button>
                                <hr className="my-2 border-gray-700/50" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleProjectAction('archive')
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-orange-400 hover:bg-orange-500/20 rounded-lg flex items-center space-x-2"
                                >
                                  <Archive className="h-4 w-4" />
                                  <span>Archive</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleProjectAction('delete')
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 rounded-lg flex items-center space-x-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {project.description && (
                          <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        {/* Tech Stack */}
                        {project.tech_stack && project.tech_stack.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.tech_stack.slice(0, 4).map((tech) => (
                              <span key={tech} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded flex items-center space-x-1">
                                <span>{getTechStackIcon(tech)}</span>
                                <span>{tech}</span>
                              </span>
                            ))}
                            {project.tech_stack.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{project.tech_stack.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <div className={`w-2 h-2 rounded-full ${
                              project.status === 'archived' ? 'bg-orange-500' : 'bg-green-500'
                            }`}></div>
                            <span className="capitalize">{project.status || 'active'}</span>
                            {project.collaborators && project.collaborators > 0 && (
                              <>
                                <span>•</span>
                                <Users className="h-3 w-3" />
                                <span>{project.collaborators}</span>
                              </>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-2 group-hover:scale-110 transition-transform duration-300">
                            <FolderOpen className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="text-gray-300 text-sm truncate">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(project.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatRelativeTime(project.updated_at || project.created_at)}</span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              project.status === 'archived' ? 'bg-orange-500' : 'bg-green-500'
                            }`}></div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
    </>
  )
}
