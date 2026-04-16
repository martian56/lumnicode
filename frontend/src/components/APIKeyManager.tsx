import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { UserButton } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'
import {
  Plus,
  Key,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  Calendar,
  BarChart3,
  ChevronDown,
  X,
} from 'lucide-react'
import { apiClient } from '../lib/api'

interface APIKey {
  id: string
  provider: string
  display_name: string
  is_active: boolean
  is_validated: boolean
  last_validated_at?: string
  last_used_at?: string
  usage_count: number
  monthly_limit?: number
  current_month_usage: number
  rate_limit_per_minute: number
  created_at: string
  quota_info?: {
    available_models?: string[]
    total_models?: number
    user?: string
    type?: string
  }
}

interface UsageStats {
  total_keys: number
  active_keys: number
  total_usage: number
  providers: string[]
  keys: Array<Record<string, unknown>>
}

interface Provider {
  id: string
  name: string
  description: string
}

export default function APIKeyManager() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [validating, setValidating] = useState<string | null>(null)
  const [newKey, setNewKey] = useState({
    provider: '',
    api_key: '',
    display_name: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [showKeyValue, setShowKeyValue] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { getToken } = useAuth()

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [keysRes, statsRes, providersRes] = await Promise.all([
        apiClient.get('/api-keys', { headers }),
        apiClient.get('/api-keys/usage', { headers }),
        apiClient.get('/api-keys/providers', { headers }),
      ])
      setApiKeys(keysRes.data)
      setUsageStats(statsRes.data)
      setProviders(providersRes.data.providers)
    } catch (error) {
      console.error('Failed to load API key data:', error)
      setError('Failed to load API key data')
    } finally {
      setLoading(false)
    }
  }

  const addAPIKey = async () => {
    if (!newKey.provider || !newKey.api_key) {
      setError('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const token = await getToken()
      const response = await apiClient.post('/api-keys', newKey, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.data.success) {
        setSuccess(response.data.message)
        setNewKey({ provider: '', api_key: '', display_name: '' })
        setShowAddModal(false)
        loadData()
      } else {
        setError(response.data.error || 'Failed to add API key')
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail || 'Failed to add API key')
    } finally {
      setSubmitting(false)
    }
  }

  const validateKey = async (keyId: string) => {
    setValidating(keyId)
    try {
      const token = await getToken()
      await apiClient.post(
        '/api-keys/validate',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccess('API keys validated')
      loadData()
    } catch {
      setError('Failed to validate')
    } finally {
      setValidating(null)
    }
  }

  const deleteKey = async (keyId: string) => {
    if (!confirm('Delete this API key?')) return
    try {
      const token = await getToken()
      await apiClient.delete(`/api-keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSuccess('API key deleted')
      loadData()
    } catch {
      setError('Failed to delete')
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getUsagePercent = (current: number, limit?: number) =>
    limit ? Math.min((current / limit) * 100, 100) : 0

  const inputClass =
    'w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>API Keys - Lumnicode</title>
        <meta name="description" content="Manage your AI provider API keys." />
      </Helmet>

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">API Keys</h1>
          {usageStats && (
            <span className="text-xs text-zinc-500">
              {usageStats.total_keys} keys &middot;{' '}
              {usageStats.providers.length} providers
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Key</span>
          </button>
          <UserButton
            afterSignOutUrl="/"
            appearance={{ elements: { avatarBox: 'h-8 w-8' } }}
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Stats */}
        {usageStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: Key,
                label: 'Total Keys',
                value: usageStats.total_keys,
                color: 'text-indigo-400 bg-indigo-600/10',
              },
              {
                icon: CheckCircle,
                label: 'Active',
                value: usageStats.active_keys,
                color: 'text-emerald-400 bg-emerald-600/10',
              },
              {
                icon: Activity,
                label: 'Total Usage',
                value: usageStats.total_usage,
                color: 'text-violet-400 bg-violet-600/10',
              },
              {
                icon: BarChart3,
                label: 'Providers',
                value: usageStats.providers.length,
                color: 'text-amber-400 bg-amber-600/10',
              },
            ].map(s => (
              <div
                key={s.label}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}
                  >
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-zinc-100">
                      {s.value}
                    </p>
                    <p className="text-xs text-zinc-500">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Keys List */}
        {apiKeys.length === 0 ? (
          <div className="text-center py-20">
            <Key className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-base font-medium text-zinc-300 mb-1">
              No API keys yet
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
              Add your first API key to start using AI services.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add API Key</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map(key => (
              <div
                key={key.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-3">
                      <h3 className="text-sm font-medium text-zinc-200">
                        {key.display_name}
                      </h3>
                      <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                        {key.provider}
                      </span>
                      {key.is_validated ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          Validated
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          Unvalidated
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                        <p className="text-[11px] text-zinc-500 mb-0.5">
                          Usage
                        </p>
                        <p className="text-sm font-medium text-zinc-200">
                          {key.usage_count}
                        </p>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                        <p className="text-[11px] text-zinc-500 mb-0.5">
                          Monthly
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-medium text-zinc-200">
                            {key.current_month_usage}
                          </span>
                          {key.monthly_limit && (
                            <span className="text-[11px] text-zinc-600">
                              / {key.monthly_limit}
                            </span>
                          )}
                        </div>
                        {key.monthly_limit && (
                          <div className="w-full bg-zinc-800 rounded-full h-1 mt-1.5">
                            <div
                              className={`h-1 rounded-full ${getUsagePercent(key.current_month_usage, key.monthly_limit) > 80 ? 'bg-red-500' : getUsagePercent(key.current_month_usage, key.monthly_limit) > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{
                                width: `${getUsagePercent(key.current_month_usage, key.monthly_limit)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                        <p className="text-[11px] text-zinc-500 mb-0.5">
                          Rate Limit
                        </p>
                        <p className="text-sm font-medium text-zinc-200">
                          {key.rate_limit_per_minute}/min
                        </p>
                      </div>
                    </div>

                    {key.quota_info?.available_models &&
                      key.quota_info.available_models.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[11px] text-zinc-500 mb-1.5">
                            Models
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {key.quota_info.available_models
                              .slice(0, 5)
                              .map((m, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded"
                                >
                                  {m}
                                </span>
                              ))}
                            {key.quota_info.available_models.length > 5 && (
                              <span className="text-[11px] text-zinc-600">
                                +{key.quota_info.available_models.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    <div className="flex items-center gap-3 text-[11px] text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {formatDate(key.created_at)}
                      </span>
                      {key.last_used_at && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Used {formatDate(key.last_used_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-4">
                    <button
                      onClick={() => validateKey(key.id)}
                      disabled={validating === key.id}
                      className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                      title="Validate"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${validating === key.id ? 'animate-spin' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => deleteKey(key.id)}
                      className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">
                  Add API Key
                </h3>
                <p className="text-xs text-zinc-500">Connect an AI provider</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewKey({ provider: '', api_key: '', display_name: '' })
                  setError('')
                  setSuccess('')
                }}
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Provider
                </label>
                <div className="relative">
                  <select
                    value={newKey.provider}
                    onChange={e =>
                      setNewKey({ ...newKey, provider: e.target.value })
                    }
                    className={`appearance-none ${inputClass} pr-8 cursor-pointer`}
                  >
                    <option value="">Select a provider</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newKey.display_name}
                  onChange={e =>
                    setNewKey({ ...newKey, display_name: e.target.value })
                  }
                  className={inputClass}
                  placeholder="My OpenAI Key"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeyValue ? 'text' : 'password'}
                    value={newKey.api_key}
                    onChange={e =>
                      setNewKey({ ...newKey, api_key: e.target.value })
                    }
                    className={`${inputClass} pr-10`}
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyValue(!showKeyValue)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                  {success}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewKey({ provider: '', api_key: '', display_name: '' })
                  setError('')
                  setSuccess('')
                }}
                className="flex-1 py-2.5 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addAPIKey}
                disabled={submitting || !newKey.provider || !newKey.api_key}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
