import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'
import {
  Plus,
  FolderOpen,
  Sparkles,
  Activity,
  Key,
  ArrowRight,
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
  const [stats, setStats] = useState({ totalProjects: 0, recentActivity: 0 })
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const navigate = useNavigate()
  const { getToken } = useAuth()

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadStats = async () => {
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
      setRecentProjects(sorted.slice(0, 5))
      setStats({
        totalProjects: projects.length,
        recentActivity: projects.filter((p: Project) => {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return new Date(p.created_at) > weekAgo
        }).length,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
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

  return (
    <>
      <Helmet>
        <title>Dashboard - Lumnicode</title>
        <meta
          name="description"
          content="Your AI-powered development dashboard."
        />
      </Helmet>

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-800 flex-shrink-0">
        <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
        <UserButton
          afterSignOutUrl="/"
          appearance={{ elements: { avatarBox: 'h-8 w-8' } }}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/10 flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-100">
                  {stats.totalProjects}
                </p>
                <p className="text-xs text-zinc-500">Total Projects</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-100">
                  {stats.recentActivity}
                </p>
                <p className="text-xs text-zinc-500">This Week</p>
              </div>
            </div>
          </div>
          <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-600/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    Create with AI
                  </p>
                  <p className="text-xs text-zinc-500">
                    Describe a project and let AI build it
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/create-project')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Start
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3">
            Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                icon: Plus,
                title: 'New Project',
                desc: 'Create with AI assistance',
                path: '/create-project',
              },
              {
                icon: FolderOpen,
                title: 'Browse Projects',
                desc: 'View all your projects',
                path: '/projects',
              },
              {
                icon: Key,
                title: 'API Keys',
                desc: 'Configure AI providers',
                path: '/api-keys',
              },
            ].map(action => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800/80 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <action.icon className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">
                    {action.title}
                  </p>
                  <p className="text-xs text-zinc-500">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-400">
              Recent Activity
            </h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all
            </button>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            {recentProjects.length > 0 ? (
              recentProjects.map(project => {
                const isNew =
                  !project.updated_at ||
                  new Date(project.updated_at).getTime() ===
                    new Date(project.created_at).getTime()
                return (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      {isNew ? (
                        <Plus className="h-3.5 w-3.5 text-zinc-500" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200">
                        {isNew ? 'Created' : 'Updated'}{' '}
                        <span className="font-medium">{project.name}</span>
                      </p>
                    </div>
                    <span className="text-xs text-zinc-600 flex-shrink-0">
                      {formatRelativeTime(
                        project.updated_at || project.created_at
                      )}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="px-4 py-10 text-center">
                <FolderOpen className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 mb-1">No projects yet</p>
                <p className="text-xs text-zinc-600 mb-4">
                  Create your first project to get started.
                </p>
                <button
                  onClick={() => navigate('/create-project')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
