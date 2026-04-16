import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'
import {
  Plus,
  FolderOpen,
  Calendar,
  Search,
  Grid,
  List,
  Clock,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Archive,
  ArrowRight,
  ChevronDown,
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
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'recent' | 'status'>(
    'recent'
  )
  const [filterBy, setFilterBy] = useState<
    'all' | 'active' | 'archived' | 'draft'
  >('all')
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const navigate = useNavigate()
  const { getToken } = useAuth()

  useEffect(() => {
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProjects = async () => {
    try {
      const token = await getToken()
      const response = await apiClient.get('/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalActive = projects.filter(
    p => p.status === 'active' || !p.status
  ).length

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      if (filterBy === 'all') return matchesSearch
      return (
        matchesSearch &&
        (project.status === filterBy ||
          (!project.status && filterBy === 'active'))
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case 'status':
          return (a.status || 'active').localeCompare(b.status || 'active')
        default:
          return (
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
          )
      }
    })

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return formatDate(dateString)
  }

  const deleteProject = async (projectId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this project? This cannot be undone.'
      )
    )
      return
    try {
      const token = await getToken()
      await apiClient.delete(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const archiveProject = async (projectId: string) => {
    try {
      const token = await getToken()
      await apiClient.put(
        `/projects/${projectId}`,
        { status: 'archived' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId ? { ...p, status: 'archived' as const } : p
        )
      )
    } catch (error) {
      console.error('Failed to archive project:', error)
    }
  }

  const duplicateProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    try {
      const token = await getToken()
      const response = await apiClient.post(
        '/projects',
        {
          name: `${project.name} (copy)`,
          description: project.description,
          tech_stack: project.tech_stack,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setProjects(prev => [response.data, ...prev])
    } catch (error) {
      console.error('Failed to duplicate project:', error)
    }
  }

  const handleProjectAction = (action: string, projectId: string) => {
    setShowProjectMenu(null)
    switch (action) {
      case 'edit':
        navigate(`/project/${projectId}`)
        break
      case 'duplicate':
        duplicateProject(projectId)
        break
      case 'share':
        navigator.clipboard.writeText(
          `${window.location.origin}/project/${projectId}`
        )
        break
      case 'archive':
        archiveProject(projectId)
        break
      case 'delete':
        deleteProject(projectId)
        break
    }
  }

  const handleBulkAction = async (action: string) => {
    if (
      action === 'delete' &&
      !confirm(
        `Delete ${selectedProjects.length} project(s)? This cannot be undone.`
      )
    )
      return
    const token = await getToken()
    for (const id of selectedProjects) {
      try {
        if (action === 'delete') {
          await apiClient.delete(`/projects/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        } else if (action === 'archive') {
          await apiClient.put(
            `/projects/${id}`,
            { status: 'archived' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        }
      } catch (error) {
        console.error(`Failed to ${action} project ${id}:`, error)
      }
    }
    setSelectedProjects([])
    loadProjects()
  }

  return (
    <>
      <Helmet>
        <title>Projects - Lumnicode</title>
        <meta name="description" content="Manage your AI-powered projects." />
      </Helmet>

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">Projects</h1>
          <span className="text-xs text-zinc-500">
            {projects.length} total &middot; {totalActive} active
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <UserButton
            afterSignOutUrl="/"
            appearance={{ elements: { avatarBox: 'h-8 w-8' } }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/create-project')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
            {selectedProjects.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Archive</span>
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none pl-3 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="recent">Recent</option>
                <option value="name">Name</option>
                <option value="date">Date</option>
                <option value="status">Status</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterBy}
                onChange={e => setFilterBy(e.target.value as typeof filterBy)}
                className="appearance-none pl-3 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="draft">Draft</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Projects */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="h-6 w-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-base font-medium text-zinc-300 mb-1">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
              {searchTerm
                ? 'Try a different search term.'
                : 'Create your first project to get started.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/create-project')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Project</span>
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
                : 'space-y-1'
            }
          >
            {filteredAndSortedProjects.map(project => (
              <div
                key={project.id}
                className={`group bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'flex items-center gap-4 px-4 py-3'
                    : 'p-4'
                } ${selectedProjects.includes(project.id) ? 'ring-1 ring-indigo-500' : ''}`}
                onClick={() => navigate(`/project/${project.id}`)}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="h-4 w-4 text-zinc-500" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-zinc-200 truncate">
                            {project.name}
                          </h3>
                          <p className="text-xs text-zinc-600">
                            {formatRelativeTime(
                              project.updated_at || project.created_at
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setShowProjectMenu(
                              showProjectMenu === project.id ? null : project.id
                            )
                          }}
                          className="p-1 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {showProjectMenu === project.id && (
                          <div className="absolute right-0 top-7 bg-zinc-900 border border-zinc-800 rounded-lg py-1 shadow-xl z-50 w-36">
                            {[
                              { action: 'edit', icon: Edit3, label: 'Edit' },
                              {
                                action: 'duplicate',
                                icon: Copy,
                                label: 'Duplicate',
                              },
                              { action: 'share', icon: Share2, label: 'Share' },
                            ].map(({ action, icon: Icon, label }) => (
                              <button
                                key={action}
                                onClick={e => {
                                  e.stopPropagation()
                                  handleProjectAction(action, project.id)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                              >
                                <Icon className="h-3.5 w-3.5" />
                                <span>{label}</span>
                              </button>
                            ))}
                            <div className="my-1 border-t border-zinc-800" />
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleProjectAction('archive', project.id)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-amber-400 hover:bg-zinc-800"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              <span>Archive</span>
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleProjectAction('delete', project.id)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-800"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-xs text-zinc-500 leading-relaxed mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tech_stack.slice(0, 3).map(tech => (
                          <span
                            key={tech}
                            className="text-[11px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.tech_stack.length > 3 && (
                          <span className="text-[11px] text-zinc-600">
                            +{project.tech_stack.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${project.status === 'archived' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                        <span className="capitalize">
                          {project.status || 'active'}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-zinc-200 truncate">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-zinc-500 truncate">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 flex-shrink-0">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(
                          project.updated_at || project.created_at
                        )}
                      </span>
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${project.status === 'archived' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
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
