import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
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
  ChevronDown
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
  keys: Array<{
    provider: string
    display_name: string
    usage_count: number
    current_month_usage: number
    monthly_limit?: number
    is_active: boolean
    is_validated: boolean
  }>
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
    display_name: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { getToken } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      
      const [keysResponse, statsResponse, providersResponse] = await Promise.all([
        apiClient.get('/api-keys', { headers }),
        apiClient.get('/api-keys/usage', { headers }),
        apiClient.get('/api-keys/providers', { headers })
      ])
      
      setApiKeys(keysResponse.data)
      setUsageStats(statsResponse.data)
      setProviders(providersResponse.data.providers)
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
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setSuccess(response.data.message)
        setNewKey({ provider: '', api_key: '', display_name: '' })
        setShowAddModal(false)
        loadData()
      } else {
        setError(response.data.error || 'Failed to add API key')
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to add API key')
    } finally {
      setSubmitting(false)
    }
  }

  const validateKey = async (keyId: string) => {
    setValidating(keyId)
    try {
      const token = await getToken()
      await apiClient.post('/api-keys/validate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('API keys validated successfully')
      loadData()
    } catch (error) {
      setError('Failed to validate API keys')
    } finally {
      setValidating(null)
    }
  }

  const deleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return
    
    try {
      const token = await getToken()
      await apiClient.delete(`/api-keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('API key deleted successfully')
      loadData()
    } catch (error) {
      setError('Failed to delete API key')
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return '🤖'
      case 'google': return '🔍'
      case 'anthropic': return '🧠'
      case 'huggingface': return '🤗'
      case 'together': return '🤝'
      case 'fireworks': return '🎆'
      case 'cohere': return '💬'
      case 'groq': return '⚡'
      default: return '🔑'
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return 'from-green-500 to-emerald-500'
      case 'google': return 'from-blue-500 to-cyan-500'
      case 'anthropic': return 'from-purple-500 to-violet-500'
      case 'huggingface': return 'from-yellow-500 to-orange-500'
      case 'together': return 'from-pink-500 to-rose-500'
      case 'fireworks': return 'from-red-500 to-pink-500'
      case 'cohere': return 'from-indigo-500 to-blue-500'
      case 'groq': return 'from-teal-500 to-green-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUsagePercentage = (current: number, limit?: number) => {
    if (!limit) return 0
    return Math.min((current / limit) * 100, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading API keys...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>API Keys - Lumnicode</title>
        <meta name="description" content="Manage your AI provider API keys. Add, edit, and monitor usage for OpenAI, Gemini, Anthropic, and other AI services." />
      </Helmet>
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
        <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-75"></div>
                  <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-xl p-2">
                    <Key className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    API Key Manager
                  </h1>
                  <p className="text-xs text-gray-400">Manage your AI provider API keys</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2 font-medium"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add API Key</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          {usageStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3">
                    <Key className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{usageStats.total_keys}</p>
                    <p className="text-sm text-gray-400">Total Keys</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{usageStats.active_keys}</p>
                    <p className="text-sm text-gray-400">Active Keys</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl p-3">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{usageStats.total_usage}</p>
                    <p className="text-sm text-gray-400">Total Usage</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{usageStats.providers.length}</p>
                    <p className="text-sm text-gray-400">Providers</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className="space-y-6">
            {apiKeys.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-3xl p-8 w-fit mx-auto mb-8 backdrop-blur-xl border border-gray-700/50">
                  <Key className="mx-auto h-16 w-16 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">No API keys yet</h3>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                  Add your first API key to start using AI services. We support multiple providers including OpenAI, Google Gemini, Anthropic Claude, and more.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2 font-medium mx-auto"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Add Your First API Key</span>
                </button>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-700/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`bg-gradient-to-r ${getProviderColor(key.provider)} rounded-xl p-3`}>
                        <span className="text-2xl">{getProviderIcon(key.provider)}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{key.display_name}</h3>
                          <span className="px-3 py-1 bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-200">
                            {key.provider}
                          </span>
                          {key.is_validated ? (
                            <div className="flex items-center space-x-1 text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Validated</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm">Not Validated</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Usage Count</p>
                            <p className="text-lg font-semibold text-white">{key.usage_count}</p>
                          </div>
                          
                          <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Monthly Usage</p>
                            <div className="flex items-center space-x-2">
                              <p className="text-lg font-semibold text-white">{key.current_month_usage}</p>
                              {key.monthly_limit && (
                                <span className="text-sm text-gray-400">/ {key.monthly_limit}</span>
                              )}
                            </div>
                            {key.monthly_limit && (
                              <div className="w-full bg-gray-600/50 rounded-full h-2 mt-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    getUsagePercentage(key.current_month_usage, key.monthly_limit) > 80
                                      ? 'bg-red-500'
                                      : getUsagePercentage(key.current_month_usage, key.monthly_limit) > 60
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{
                                    width: `${getUsagePercentage(key.current_month_usage, key.monthly_limit)}%`
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Rate Limit</p>
                            <p className="text-lg font-semibold text-white">{key.rate_limit_per_minute}/min</p>
                          </div>
                        </div>
                        
                        {key.quota_info && (
                          <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-3 mb-4">
                            <p className="text-xs text-gray-400 mb-2">Available Models</p>
                            <div className="flex flex-wrap gap-2">
                              {key.quota_info.available_models?.slice(0, 5).map((model, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-xs text-gray-200"
                                >
                                  {model}
                                </span>
                              ))}
                              {key.quota_info.available_models && key.quota_info.available_models.length > 5 && (
                                <span className="px-2 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-xs text-gray-200">
                                  +{key.quota_info.available_models.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Created {formatDate(key.created_at)}</span>
                          </div>
                          {key.last_used_at && (
                            <div className="flex items-center space-x-1">
                              <Activity className="h-4 w-4" />
                              <span>Last used {formatDate(key.last_used_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => validateKey(key.id)}
                        disabled={validating === key.id}
                        className="p-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-gray-200 hover:text-white transition-all duration-200 disabled:opacity-50"
                        title="Validate Key"
                      >
                        {validating === key.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => deleteKey(key.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200"
                        title="Delete Key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add API Key Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md mx-auto border border-gray-700/50 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-3">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Add API Key</h3>
                  <p className="text-gray-400">Connect your AI provider</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Provider
                  </label>
                  <div className="relative">
                    <select
                      value={newKey.provider}
                      onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                      className="appearance-none w-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white transition-all duration-200 hover:bg-gray-800/50 cursor-pointer"
                    >
                      <option value="" className="bg-gray-900 text-white">Select a provider</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id} className="bg-gray-900 text-white">
                          {provider.name} - {provider.description}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={newKey.display_name}
                    onChange={(e) => setNewKey({ ...newKey, display_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200"
                    placeholder="My OpenAI Key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newKey.api_key}
                      onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200 pr-12"
                      placeholder="sk-..."
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                  {success}
                </div>
              )}

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewKey({ provider: '', api_key: '', display_name: '' })
                    setError('')
                    setSuccess('')
                  }}
                  className="flex-1 px-6 py-3 text-gray-300 border border-gray-600/50 rounded-xl hover:bg-gray-700/50 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={addAPIKey}
                  disabled={submitting || !newKey.provider || !newKey.api_key}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 font-medium"
                >
                  {submitting ? 'Adding...' : 'Add Key'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
