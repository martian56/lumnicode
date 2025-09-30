import { useState } from 'react'
import { UserButton } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Save, 
  Moon, 
  Sun, 
  Monitor,
  ChevronDown
} from 'lucide-react'

interface UserSettings {
  profile: {
    name: string
    email: string
    bio: string
    avatar: string
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    editor: {
      fontSize: number
      tabSize: number
      wordWrap: boolean
      autoSave: boolean
    }
  }
  notifications: {
    email: boolean
    push: boolean
    projectUpdates: boolean
    aiSuggestions: boolean
    weeklyDigest: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    showEmail: boolean
    showProjects: boolean
    analytics: boolean
  }
  integrations: {
    github: boolean
    gitlab: boolean
    bitbucket: boolean
    slack: boolean
    discord: boolean
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'privacy' | 'integrations' | 'billing' | 'advanced'>('profile')
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Full-stack developer passionate about AI and modern web technologies.',
      avatar: ''
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      editor: {
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        autoSave: true
      }
    },
    notifications: {
      email: true,
      push: true,
      projectUpdates: true,
      aiSuggestions: true,
      weeklyDigest: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showProjects: true,
      analytics: true
    },
    integrations: {
      github: false,
      gitlab: false,
      bitbucket: false,
      slack: false,
      discord: false
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      // Show success message
    }, 1000)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lumnicode-settings.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          setSettings(importedSettings)
        } catch (error) {
          console.error('Failed to import settings:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'billing', label: 'Billing', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: Settings }
  ]

  return (
    <>
      <Helmet>
        <title>Settings - Lumnicode</title>
        <meta name="description" content="Manage your account settings, preferences, and integrations for your AI-powered development environment." />
      </Helmet>
          {/* Header */}
          <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Page Title */}
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Settings
                  </h1>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
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
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Settings Navigation */}
              <div className="lg:w-64 flex-shrink-0">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                        activeTab === tab.id
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <tab.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Settings Content */}
              <div className="flex-1">
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
                      
                      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <div className="space-y-6">
                          <div className="flex items-center space-x-6">
                            <div className="relative">
                              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <User className="h-10 w-10 text-white" />
                              </div>
                              <button className="absolute -bottom-1 -right-1 bg-purple-600 hover:bg-purple-700 rounded-full p-1 transition-colors">
                                <Upload className="h-3 w-3 text-white" />
                              </button>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Profile Picture</h3>
                              <p className="text-gray-400 text-sm">Upload a new profile picture</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={settings.profile.name}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  profile: { ...settings.profile, name: e.target.value }
                                })}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={settings.profile.email}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  profile: { ...settings.profile, email: e.target.value }
                                })}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                              Bio
                            </label>
                            <textarea
                              value={settings.profile.bio}
                              onChange={(e) => setSettings({
                                ...settings,
                                profile: { ...settings.profile, bio: e.target.value }
                              })}
                              rows={4}
                              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200 resize-none"
                              placeholder="Tell us about yourself..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Preferences</h2>
                      
                      <div className="space-y-6">
                        {/* Theme Settings */}
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-300 mb-3">
                                Theme
                              </label>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { id: 'light', label: 'Light', icon: Sun },
                                  { id: 'dark', label: 'Dark', icon: Moon },
                                  { id: 'system', label: 'System', icon: Monitor }
                                ].map((theme) => (
                                  <button
                                    key={theme.id}
                                    onClick={() => setSettings({
                                      ...settings,
                                      preferences: { ...settings.preferences, theme: theme.id as any }
                                    })}
                                    className={`p-4 rounded-xl border transition-all duration-200 ${
                                      settings.preferences.theme === theme.id
                                        ? 'border-purple-500 bg-purple-600/20'
                                        : 'border-gray-700/50 bg-gray-700/30 hover:bg-gray-700/50'
                                    }`}
                                  >
                                    <theme.icon className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                                    <span className="text-sm font-medium text-gray-300">{theme.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Editor Settings */}
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Editor Settings</h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                  Font Size
                                </label>
                                <input
                                  type="range"
                                  min="10"
                                  max="24"
                                  value={settings.preferences.editor.fontSize}
                                  onChange={(e) => setSettings({
                                    ...settings,
                                    preferences: {
                                      ...settings.preferences,
                                      editor: { ...settings.preferences.editor, fontSize: parseInt(e.target.value) }
                                    }
                                  })}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                  <span>10px</span>
                                  <span>{settings.preferences.editor.fontSize}px</span>
                                  <span>24px</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                  Tab Size
                                </label>
                                <div className="relative">
                                  <select
                                    value={settings.preferences.editor.tabSize}
                                    onChange={(e) => setSettings({
                                      ...settings,
                                      preferences: {
                                        ...settings.preferences,
                                        editor: { ...settings.preferences.editor, tabSize: parseInt(e.target.value) }
                                      }
                                    })}
                                    className="appearance-none w-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white transition-all duration-200 hover:bg-gray-800/50 cursor-pointer"
                                  >
                                    <option value={2} className="bg-gray-900 text-white">2 spaces</option>
                                    <option value={4} className="bg-gray-900 text-white">4 spaces</option>
                                    <option value={8} className="bg-gray-900 text-white">8 spaces</option>
                                  </select>
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {[
                                { key: 'wordWrap', label: 'Word Wrap', description: 'Wrap long lines' },
                                { key: 'autoSave', label: 'Auto Save', description: 'Automatically save changes' }
                              ].map((option) => (
                                <div key={option.key} className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-white">{option.label}</div>
                                    <div className="text-sm text-gray-400">{option.description}</div>
                                  </div>
                                  <button
                                    onClick={() => setSettings({
                                      ...settings,
                                      preferences: {
                                        ...settings.preferences,
                                        editor: { ...settings.preferences.editor, [option.key]: !settings.preferences.editor[option.key as keyof typeof settings.preferences.editor] }
                                      }
                                    })}
                                    className={`w-12 h-6 rounded-full transition-colors ${
                                      settings.preferences.editor[option.key as keyof typeof settings.preferences.editor]
                                        ? 'bg-purple-600'
                                        : 'bg-gray-600'
                                    }`}
                                  >
                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                      settings.preferences.editor[option.key as keyof typeof settings.preferences.editor]
                                        ? 'translate-x-6'
                                        : 'translate-x-0.5'
                                    }`}></div>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
                      
                      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <div className="space-y-4">
                          {[
                            { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
                            { key: 'push', label: 'Push Notifications', description: 'Receive browser push notifications' },
                            { key: 'projectUpdates', label: 'Project Updates', description: 'Get notified about project changes' },
                            { key: 'aiSuggestions', label: 'AI Suggestions', description: 'Receive AI-powered suggestions' },
                            { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Weekly summary of your activity' }
                          ].map((notification) => (
                            <div key={notification.key} className="flex items-center justify-between py-3">
                              <div>
                                <div className="font-medium text-white">{notification.label}</div>
                                <div className="text-sm text-gray-400">{notification.description}</div>
                              </div>
                              <button
                                onClick={() => setSettings({
                                  ...settings,
                                  notifications: { ...settings.notifications, [notification.key]: !settings.notifications[notification.key as keyof typeof settings.notifications] }
                                })}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                  settings.notifications[notification.key as keyof typeof settings.notifications]
                                    ? 'bg-purple-600'
                                    : 'bg-gray-600'
                                }`}
                              >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                  settings.notifications[notification.key as keyof typeof settings.notifications]
                                    ? 'translate-x-6'
                                    : 'translate-x-0.5'
                                }`}></div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Privacy & Security</h2>
                      
                      <div className="space-y-6">
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Profile Visibility</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-300 mb-3">
                                Profile Visibility
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { id: 'public', label: 'Public', description: 'Anyone can see your profile' },
                                  { id: 'private', label: 'Private', description: 'Only you can see your profile' }
                                ].map((visibility) => (
                                  <button
                                    key={visibility.id}
                                    onClick={() => setSettings({
                                      ...settings,
                                      privacy: { ...settings.privacy, profileVisibility: visibility.id as any }
                                    })}
                                    className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                                      settings.privacy.profileVisibility === visibility.id
                                        ? 'border-purple-500 bg-purple-600/20'
                                        : 'border-gray-700/50 bg-gray-700/30 hover:bg-gray-700/50'
                                    }`}
                                  >
                                    <div className="font-medium text-white">{visibility.label}</div>
                                    <div className="text-sm text-gray-400">{visibility.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Data & Analytics</h3>
                          <div className="space-y-4">
                            {[
                              { key: 'showEmail', label: 'Show Email', description: 'Display email on public profile' },
                              { key: 'showProjects', label: 'Show Projects', description: 'Display projects on public profile' },
                              { key: 'analytics', label: 'Analytics', description: 'Help improve Lumnicode with usage data' }
                            ].map((option) => (
                              <div key={option.key} className="flex items-center justify-between py-3">
                                <div>
                                  <div className="font-medium text-white">{option.label}</div>
                                  <div className="text-sm text-gray-400">{option.description}</div>
                                </div>
                                <button
                                  onClick={() => setSettings({
                                    ...settings,
                                    privacy: { ...settings.privacy, [option.key]: !settings.privacy[option.key as keyof typeof settings.privacy] }
                                  })}
                                  className={`w-12 h-6 rounded-full transition-colors ${
                                    settings.privacy[option.key as keyof typeof settings.privacy]
                                      ? 'bg-purple-600'
                                      : 'bg-gray-600'
                                  }`}
                                >
                                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                    settings.privacy[option.key as keyof typeof settings.privacy]
                                      ? 'translate-x-6'
                                      : 'translate-x-0.5'
                                  }`}></div>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'integrations' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Integrations</h2>
                      
                      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <div className="space-y-4">
                          {[
                            { key: 'github', label: 'GitHub', description: 'Connect your GitHub repositories', icon: '🐙' },
                            { key: 'gitlab', label: 'GitLab', description: 'Connect your GitLab repositories', icon: '🦊' },
                            { key: 'bitbucket', label: 'Bitbucket', description: 'Connect your Bitbucket repositories', icon: '🪣' },
                            { key: 'slack', label: 'Slack', description: 'Get notifications in Slack', icon: '💬' },
                            { key: 'discord', label: 'Discord', description: 'Get notifications in Discord', icon: '🎮' }
                          ].map((integration) => (
                            <div key={integration.key} className="flex items-center justify-between py-4 border-b border-gray-700/50 last:border-b-0">
                              <div className="flex items-center space-x-4">
                                <span className="text-2xl">{integration.icon}</span>
                                <div>
                                  <div className="font-medium text-white">{integration.label}</div>
                                  <div className="text-sm text-gray-400">{integration.description}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => setSettings({
                                  ...settings,
                                  integrations: { ...settings.integrations, [integration.key]: !settings.integrations[integration.key as keyof typeof settings.integrations] }
                                })}
                                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                                  settings.integrations[integration.key as keyof typeof settings.integrations]
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
                                }`}
                              >
                                {settings.integrations[integration.key as keyof typeof settings.integrations] ? 'Connected' : 'Connect'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Billing & Usage</h2>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Current Plan</h3>
                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-white">Free Plan</h4>
                                <span className="text-sm text-gray-400">$0/month</span>
                              </div>
                              <p className="text-sm text-gray-400 mb-4">Perfect for getting started with AI-powered development</p>
                              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300">
                                Upgrade Plan
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Usage This Month</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Projects Created</span>
                              <span className="text-white font-semibold">12 / Unlimited</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">AI Requests</span>
                              <span className="text-white font-semibold">1,247 / 10,000</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Storage Used</span>
                              <span className="text-white font-semibold">2.3 GB / 10 GB</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Advanced Settings</h2>
                      
                      <div className="space-y-6">
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white">Export Settings</div>
                                <div className="text-sm text-gray-400">Download your settings and data</div>
                              </div>
                              <button
                                onClick={handleExport}
                                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-300 hover:text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
                              >
                                <Download className="h-4 w-4" />
                                <span>Export</span>
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white">Import Settings</div>
                                <div className="text-sm text-gray-400">Import settings from a file</div>
                              </div>
                              <label className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-300 hover:text-white rounded-xl transition-all duration-200 flex items-center space-x-2 cursor-pointer">
                                <Upload className="h-4 w-4" />
                                <span>Import</span>
                                <input
                                  type="file"
                                  accept=".json"
                                  onChange={handleImport}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white">Delete Account</div>
                                <div className="text-sm text-gray-400">Permanently delete your account and all data</div>
                              </div>
                              <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 hover:text-red-200 rounded-xl transition-all duration-200 flex items-center space-x-2">
                                <Trash2 className="h-4 w-4" />
                                <span>Delete Account</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
    </>
  )
}
