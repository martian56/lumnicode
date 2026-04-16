import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  Home,
  FolderOpen,
  Key,
  Settings,
  HelpCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Code2,
} from 'lucide-react'
import { apiClient } from '../lib/api'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
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
  const [recentProjects, setRecentProjects] = useState<Project[]>([])

  useEffect(() => {
    loadRecentProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadRecentProjects = async () => {
    try {
      const token = await getToken()
      const response = await apiClient.get('/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const projects = response.data
      const sorted = projects.sort((a: Project, b: Project) => {
        const aTime = new Date(a.updated_at || a.created_at).getTime()
        const bTime = new Date(b.updated_at || b.created_at).getTime()
        return bTime - aTime
      })
      setRecentProjects(sorted.slice(0, 3))
    } catch (error) {
      console.error('Failed to load recent projects:', error)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInSeconds / 3600)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInSeconds / 86400)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, path: '/projects' },
    { id: 'api-keys', label: 'API Keys', icon: Key, path: '/api-keys' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    { id: 'help', label: 'Help', icon: HelpCircle, path: '/help' },
  ]

  return (
    <>
      <div
        className={`bg-zinc-900 border-r border-zinc-800 transition-all duration-200 flex flex-col min-h-screen ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Code2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-100 tracking-tight">
                Lumnicode
              </span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* New Project Button */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => navigate('/create-project')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>New Project</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          <div className="space-y-0.5">
            {navItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Recent Projects */}
        {!isCollapsed && (
          <div className="px-3 pb-4 border-t border-zinc-800 pt-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-3 mb-2">
              Recent
            </h3>
            <div className="space-y-0.5">
              {recentProjects.length > 0 ? (
                recentProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                  >
                    <p className="text-sm text-zinc-300 group-hover:text-zinc-100 truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {formatRelativeTime(
                        project.updated_at || project.created_at
                      )}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-xs text-zinc-600 px-3">No projects yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
