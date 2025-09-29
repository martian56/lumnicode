import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { Plus, FolderOpen, Calendar, Search, Code2, Sparkles, ArrowRight, Filter, Grid, List } from 'lucide-react'
import { apiClient } from '../lib/api'

interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at?: string
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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

  const createProject = async () => {
    if (!newProject.name.trim()) return

    try {
      const token = await getToken()
      const response = await apiClient.post('/projects', newProject, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProjects([...projects, response.data])
      setNewProject({ name: '', description: '' })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      <div className="relative z-10">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-75"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-xl p-2">
                  <Code2 className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Lumnicode
                </h1>
                <p className="text-xs text-gray-400">AI-Powered Code Editor</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gray-700/50 rounded-xl p-1">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              Your Projects
            </h2>
            <p className="text-gray-400 text-base lg:text-lg">Manage and organize your coding projects with AI assistance</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 lg:px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2 font-medium w-full sm:w-auto justify-center"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>New Project</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 lg:mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200 text-sm sm:text-base"
            />
          </div>
          <button className="bg-gray-800/50 border border-gray-700/50 text-gray-300 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Filter</span>
          </button>
        </div>

        {/* Projects Display */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your projects...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
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
                onClick={() => setShowCreateModal(true)}
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
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }`}>
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className={`group bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center space-x-4 sm:space-x-6' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`flex items-start justify-between ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-2 group-hover:scale-110 transition-transform duration-300">
                        <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                          {project.name}
                        </h3>
                        <div className="flex items-center text-xs sm:text-sm text-gray-400">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          <span>Created {formatDate(project.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Active</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 w-full max-w-md mx-auto border border-gray-700/50 shadow-2xl">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-2 sm:p-3">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Create New Project</h3>
                <p className="text-gray-400 text-sm">Start building something amazing</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200 text-base"
                  placeholder="My Awesome Project"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200 resize-none text-base"
                  rows={3}
                  placeholder="Brief description of your project..."
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-gray-300 border border-gray-600/50 rounded-xl hover:bg-gray-700/50 hover:text-white transition-all duration-200 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProject.name.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 font-medium order-1 sm:order-2"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}