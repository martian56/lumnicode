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
  ChevronDown,
} from 'lucide-react'

interface UserSettings {
  profile: { name: string; email: string; bio: string; avatar: string }
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

const SETTINGS_KEY = 'lumnicode_settings'

const defaultSettings: UserSettings = {
  profile: { name: '', email: '', bio: '', avatar: '' },
  preferences: {
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    editor: { fontSize: 14, tabSize: 2, wordWrap: true, autoSave: true },
  },
  notifications: {
    email: true,
    push: true,
    projectUpdates: true,
    aiSuggestions: true,
    weeklyDigest: false,
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showProjects: true,
    analytics: true,
  },
  integrations: {
    github: false,
    gitlab: false,
    bitbucket: false,
    slack: false,
    discord: false,
  },
}

function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) }
  } catch { /* ignore parse errors */ }
  return defaultSettings
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    | 'profile'
    | 'preferences'
    | 'notifications'
    | 'privacy'
    | 'integrations'
    | 'billing'
    | 'advanced'
  >('profile')
  const [settings, setSettings] = useState<UserSettings>(loadSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Failed to save settings:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
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
      reader.onload = e => {
        try {
          setSettings(JSON.parse(e.target?.result as string))
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
    { id: 'advanced', label: 'Advanced', icon: Settings },
  ]

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean
    onChange: () => void
  }) => (
    <button
      onClick={onChange}
      className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-zinc-700'}`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )

  const inputClass =
    'w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'

  return (
    <>
      <Helmet>
        <title>Settings - Lumnicode</title>
        <meta name="description" content="Manage your account settings." />
      </Helmet>

      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-800 flex-shrink-0">
        <h1 className="text-lg font-semibold text-zinc-100">Settings</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Saving...' : saved ? 'Saved' : 'Save'}</span>
          </button>
          <UserButton
            afterSignOutUrl="/"
            appearance={{ elements: { avatarBox: 'h-8 w-8' } }}
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs */}
          <nav className="lg:w-48 flex-shrink-0 space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-zinc-100">
                  Profile
                </h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                      <User className="h-7 w-7 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        Profile Picture
                      </p>
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 mt-0.5 transition-colors">
                        Upload new
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={settings.profile.name}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            profile: {
                              ...settings.profile,
                              name: e.target.value,
                            },
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={settings.profile.email}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            profile: {
                              ...settings.profile,
                              email: e.target.value,
                            },
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={settings.profile.bio}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, bio: e.target.value },
                        })
                      }
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-zinc-100">
                  Preferences
                </h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ['light', Sun],
                          ['dark', Moon],
                          ['system', Monitor],
                        ] as const
                      ).map(([id, Icon]) => (
                        <button
                          key={id}
                          onClick={() =>
                            setSettings({
                              ...settings,
                              preferences: {
                                ...settings.preferences,
                                theme: id,
                              },
                            })
                          }
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                            settings.preferences.theme === id
                              ? 'border-indigo-500 bg-indigo-500/10 text-zinc-200'
                              : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="capitalize">{id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
                  <h3 className="text-sm font-medium text-zinc-200">Editor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Font Size
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="24"
                        value={settings.preferences.editor.fontSize}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            preferences: {
                              ...settings.preferences,
                              editor: {
                                ...settings.preferences.editor,
                                fontSize: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full accent-indigo-500"
                      />
                      <div className="flex justify-between text-[11px] text-zinc-600 mt-0.5">
                        <span>10px</span>
                        <span>{settings.preferences.editor.fontSize}px</span>
                        <span>24px</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Tab Size
                      </label>
                      <div className="relative">
                        <select
                          value={settings.preferences.editor.tabSize}
                          onChange={e =>
                            setSettings({
                              ...settings,
                              preferences: {
                                ...settings.preferences,
                                editor: {
                                  ...settings.preferences.editor,
                                  tabSize: parseInt(e.target.value),
                                },
                              },
                            })
                          }
                          className="appearance-none w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value={2}>2 spaces</option>
                          <option value={4}>4 spaces</option>
                          <option value={8}>8 spaces</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 pt-1">
                    {[
                      {
                        key: 'wordWrap',
                        label: 'Word Wrap',
                        desc: 'Wrap long lines',
                      },
                      {
                        key: 'autoSave',
                        label: 'Auto Save',
                        desc: 'Automatically save changes',
                      },
                    ].map(opt => (
                      <div
                        key={opt.key}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm text-zinc-200">{opt.label}</p>
                          <p className="text-xs text-zinc-500">{opt.desc}</p>
                        </div>
                        <Toggle
                          checked={
                            settings.preferences.editor[
                              opt.key as keyof typeof settings.preferences.editor
                            ] as boolean
                          }
                          onChange={() =>
                            setSettings({
                              ...settings,
                              preferences: {
                                ...settings.preferences,
                                editor: {
                                  ...settings.preferences.editor,
                                  [opt.key]:
                                    !settings.preferences.editor[
                                      opt.key as keyof typeof settings.preferences.editor
                                    ],
                                },
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-zinc-100">
                  Notifications
                </h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 divide-y divide-zinc-800">
                  {[
                    {
                      key: 'email',
                      label: 'Email Notifications',
                      desc: 'Receive notifications via email',
                    },
                    {
                      key: 'push',
                      label: 'Push Notifications',
                      desc: 'Browser push notifications',
                    },
                    {
                      key: 'projectUpdates',
                      label: 'Project Updates',
                      desc: 'Get notified about project changes',
                    },
                    {
                      key: 'aiSuggestions',
                      label: 'AI Suggestions',
                      desc: 'Receive AI-powered suggestions',
                    },
                    {
                      key: 'weeklyDigest',
                      label: 'Weekly Digest',
                      desc: 'Weekly summary of activity',
                    },
                  ].map(n => (
                    <div
                      key={n.key}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm text-zinc-200">{n.label}</p>
                        <p className="text-xs text-zinc-500">{n.desc}</p>
                      </div>
                      <Toggle
                        checked={
                          settings.notifications[
                            n.key as keyof typeof settings.notifications
                          ] as boolean
                        }
                        onChange={() =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              [n.key]:
                                !settings.notifications[
                                  n.key as keyof typeof settings.notifications
                                ],
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-zinc-100">
                  Privacy & Security
                </h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Profile Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'public', desc: 'Anyone can see your profile' },
                        {
                          id: 'private',
                          desc: 'Only you can see your profile',
                        },
                      ].map(v => (
                        <button
                          key={v.id}
                          onClick={() =>
                            setSettings({
                              ...settings,
                              privacy: {
                                ...settings.privacy,
                                profileVisibility: v.id as 'public' | 'private',
                              },
                            })
                          }
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            settings.privacy.profileVisibility === v.id
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-zinc-800 hover:bg-zinc-800'
                          }`}
                        >
                          <p className="text-sm font-medium text-zinc-200 capitalize">
                            {v.id}
                          </p>
                          <p className="text-xs text-zinc-500">{v.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 divide-y divide-zinc-800">
                  {[
                    {
                      key: 'showEmail',
                      label: 'Show Email',
                      desc: 'Display email on public profile',
                    },
                    {
                      key: 'showProjects',
                      label: 'Show Projects',
                      desc: 'Display projects on public profile',
                    },
                    {
                      key: 'analytics',
                      label: 'Analytics',
                      desc: 'Help improve Lumnicode with usage data',
                    },
                  ].map(opt => (
                    <div
                      key={opt.key}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm text-zinc-200">{opt.label}</p>
                        <p className="text-xs text-zinc-500">{opt.desc}</p>
                      </div>
                      <Toggle
                        checked={
                          settings.privacy[
                            opt.key as keyof typeof settings.privacy
                          ] as boolean
                        }
                        onChange={() =>
                          setSettings({
                            ...settings,
                            privacy: {
                              ...settings.privacy,
                              [opt.key]:
                                !settings.privacy[
                                  opt.key as keyof typeof settings.privacy
                                ],
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-zinc-100">
                  Integrations
                </h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
                  {[
                    {
                      key: 'github',
                      label: 'GitHub',
                      desc: 'Connect your GitHub repositories',
                    },
                    {
                      key: 'gitlab',
                      label: 'GitLab',
                      desc: 'Connect your GitLab repositories',
                    },
                    {
                      key: 'bitbucket',
                      label: 'Bitbucket',
                      desc: 'Connect your Bitbucket repositories',
                    },
                    {
                      key: 'slack',
                      label: 'Slack',
                      desc: 'Get notifications in Slack',
                    },
                    {
                      key: 'discord',
                      label: 'Discord',
                      desc: 'Get notifications in Discord',
                    },
                  ].map(int => (
                    <div
                      key={int.key}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {int.label}
                        </p>
                        <p className="text-xs text-zinc-500">{int.desc}</p>
                      </div>
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              [int.key]:
                                !settings.integrations[
                                  int.key as keyof typeof settings.integrations
                                ],
                            },
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          settings.integrations[
                            int.key as keyof typeof settings.integrations
                          ]
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        {settings.integrations[
                          int.key as keyof typeof settings.integrations
                        ]
                          ? 'Connected'
                          : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-zinc-100">
                  Billing & Usage
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                    <h3 className="text-sm font-medium text-zinc-200 mb-3">
                      Current Plan
                    </h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-zinc-200">
                          Free Plan
                        </span>
                        <span className="text-xs text-zinc-500">$0/month</span>
                      </div>
                      <p className="text-xs text-zinc-500 mb-3">
                        Perfect for getting started
                      </p>
                      <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                        Upgrade
                      </button>
                    </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                    <h3 className="text-sm font-medium text-zinc-200 mb-3">
                      Usage
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Projects</span>
                        <span className="text-zinc-200">Unlimited</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Storage</span>
                        <span className="text-zinc-200">2.3 / 10 GB</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: '23%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-zinc-100">
                  Advanced
                </h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-200">Export Settings</p>
                      <p className="text-xs text-zinc-500">
                        Download your settings
                      </p>
                    </div>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-200">Import Settings</p>
                      <p className="text-xs text-zinc-500">
                        Import from a file
                      </p>
                    </div>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer">
                      <Upload className="h-3.5 w-3.5" />
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
                <div className="bg-zinc-900 border border-red-500/20 rounded-lg p-5">
                  <h3 className="text-sm font-medium text-red-400 mb-3">
                    Danger Zone
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-200">Delete Account</p>
                      <p className="text-xs text-zinc-500">
                        Permanently delete your account
                      </p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
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
