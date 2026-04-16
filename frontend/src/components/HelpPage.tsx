import { useState } from 'react'
import { UserButton } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'
import {
  HelpCircle,
  Search,
  Book,
  Video,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  Code2,
  Sparkles,
  Zap,
  Terminal,
  Settings,
  Key,
  Plus,
  ArrowRight,
  Lightbulb,
  Play,
  ChevronDown,
} from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
}
interface Tutorial {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  type: 'video' | 'article' | 'interactive'
  icon: React.ComponentType<{ className?: string }>
}

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'faq' | 'tutorials' | 'contact' | 'resources'
  >('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How do I create my first project?',
      answer:
        'Click "New Project" on the dashboard or use the AI Assistant to describe what you want to build. Choose from templates or start from scratch.',
      category: 'Getting Started',
      tags: ['project', 'creation'],
    },
    {
      id: '2',
      question: 'How do I add API keys?',
      answer:
        'Go to the API Keys section, click "Add API Key", select your provider (OpenAI, Gemini, etc.), and paste your key. It will be validated automatically.',
      category: 'API Keys',
      tags: ['api', 'keys'],
    },
    {
      id: '3',
      question: 'What tech stacks are supported?',
      answer:
        'React, Vue.js, Angular, Next.js, Node.js, Express, FastAPI, MongoDB, PostgreSQL, and many more.',
      category: 'Tech Stack',
      tags: ['tech', 'frameworks'],
    },
    {
      id: '4',
      question: 'How does the AI Assistant work?',
      answer:
        'The AI uses your API keys to generate code, suggest improvements, and help with development. It can analyze code and create projects from descriptions.',
      category: 'AI Assistant',
      tags: ['ai', 'assistant'],
    },
    {
      id: '5',
      question: 'Can I collaborate with others?',
      answer:
        'Yes. Share projects with team members and invite collaborators. Use the share button on any project to invite others.',
      category: 'Collaboration',
      tags: ['collaboration', 'sharing'],
    },
    {
      id: '6',
      question: 'How do I export my projects?',
      answer:
        'Export projects as ZIP files or clone them locally. Use the project menu and select "Export" or "Download".',
      category: 'Export',
      tags: ['export', 'download'],
    },
  ]

  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Getting Started with Lumnicode',
      description: 'Learn the basics of using Lumnicode',
      duration: '5 min',
      difficulty: 'beginner',
      type: 'video',
      icon: Play,
    },
    {
      id: '2',
      title: 'Setting Up API Keys',
      description: 'Guide to configuring AI service API keys',
      duration: '3 min',
      difficulty: 'beginner',
      type: 'article',
      icon: Key,
    },
    {
      id: '3',
      title: 'Creating Your First Project',
      description: 'Step-by-step project creation tutorial',
      duration: '8 min',
      difficulty: 'beginner',
      type: 'interactive',
      icon: Plus,
    },
    {
      id: '4',
      title: 'Advanced AI Features',
      description: 'Master the AI Assistant for code generation',
      duration: '12 min',
      difficulty: 'intermediate',
      type: 'video',
      icon: Sparkles,
    },
    {
      id: '5',
      title: 'Project Collaboration',
      description: 'Learn to work with team members',
      duration: '6 min',
      difficulty: 'intermediate',
      type: 'article',
      icon: MessageCircle,
    },
    {
      id: '6',
      title: 'Customizing Your Workspace',
      description: 'Personalize your development environment',
      duration: '4 min',
      difficulty: 'beginner',
      type: 'interactive',
      icon: Settings,
    },
  ]

  const categories = [
    'all',
    'Getting Started',
    'API Keys',
    'Tech Stack',
    'AI Assistant',
    'Collaboration',
    'Export',
  ]
  const filteredFAQ = faqItems.filter(item => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    return (
      matchesSearch &&
      (selectedCategory === 'all' || item.category === selectedCategory)
    )
  })

  const difficultyColor = (d: string) =>
    d === 'beginner'
      ? 'text-emerald-400 bg-emerald-400/10'
      : d === 'intermediate'
        ? 'text-amber-400 bg-amber-400/10'
        : 'text-red-400 bg-red-400/10'
  const typeIcon = (t: string) =>
    t === 'video' ? Video : t === 'interactive' ? Zap : Book

  return (
    <>
      <Helmet>
        <title>Help - Lumnicode</title>
        <meta name="description" content="Get help with Lumnicode." />
      </Helmet>

      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-800 flex-shrink-0">
        <h1 className="text-lg font-semibold text-zinc-100">Help & Support</h1>
        <UserButton
          afterSignOutUrl="/"
          appearance={{ elements: { avatarBox: 'h-8 w-8' } }}
        />
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <nav className="lg:w-48 flex-shrink-0 space-y-0.5">
            {[
              { id: 'overview', label: 'Overview', icon: HelpCircle },
              { id: 'faq', label: 'FAQ', icon: MessageCircle },
              { id: 'tutorials', label: 'Tutorials', icon: Book },
              { id: 'contact', label: 'Contact', icon: Mail },
              { id: 'resources', label: 'Resources', icon: ExternalLink },
            ].map(tab => (
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

          <div className="flex-1 max-w-3xl">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                    Welcome to Lumnicode Help
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Find answers, learn through tutorials, and get support.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      tab: 'faq',
                      icon: MessageCircle,
                      title: 'FAQ',
                      desc: 'Quick answers to common questions',
                    },
                    {
                      tab: 'tutorials',
                      icon: Book,
                      title: 'Tutorials',
                      desc: 'Step-by-step guides',
                    },
                    {
                      tab: 'contact',
                      icon: Mail,
                      title: 'Contact',
                      desc: 'Get personal help',
                    },
                  ].map(item => (
                    <button
                      key={item.tab}
                      onClick={() => setActiveTab(item.tab as typeof activeTab)}
                      className="flex items-start gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800/80 transition-colors text-left group"
                    >
                      <item.icon className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {item.title}
                        </p>
                        <p className="text-xs text-zinc-500">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                  <h3 className="text-sm font-medium text-zinc-200 mb-3">
                    Getting Started
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        step: 1,
                        title: 'Set up your API keys',
                        desc: 'Add your AI service API keys',
                        icon: Key,
                      },
                      {
                        step: 2,
                        title: 'Create your first project',
                        desc: 'Use AI or templates to create a project',
                        icon: Plus,
                      },
                      {
                        step: 3,
                        title: 'Start coding with AI',
                        desc: 'Let AI help you build applications',
                        icon: Sparkles,
                      },
                    ].map(item => (
                      <div key={item.step} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[11px] font-semibold text-zinc-400 flex-shrink-0">
                          {item.step}
                        </div>
                        <item.icon className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-zinc-200">{item.title}</p>
                          <p className="text-xs text-zinc-500">{item.desc}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-zinc-100">FAQ</h2>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>
                          {c === 'all' ? 'All Categories' : c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredFAQ.map(item => (
                    <div
                      key={item.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-medium text-zinc-200">
                          {item.question}
                        </h3>
                        <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded flex-shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                        {item.answer}
                      </p>
                      <div className="flex gap-1.5">
                        {item.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-[11px] text-zinc-600 bg-zinc-950 px-1.5 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tutorials' && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-zinc-100">
                  Tutorials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tutorials.map(t => {
                    const TypeIcon = typeIcon(t.type)
                    return (
                      <div
                        key={t.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:bg-zinc-800/80 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <TypeIcon className="h-4 w-4 text-zinc-500" />
                            <div>
                              <h3 className="text-sm font-medium text-zinc-200">
                                {t.title}
                              </h3>
                              <p className="text-xs text-zinc-600">
                                {t.duration}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded ${difficultyColor(t.difficulty)}`}
                          >
                            {t.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">
                          {t.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-600 capitalize">
                            {t.type}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-zinc-100">
                  Contact Support
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
                    <h3 className="text-sm font-medium text-zinc-200">
                      Get in Touch
                    </h3>
                    {[
                      {
                        icon: Mail,
                        title: 'Email',
                        detail: 'support@lumnicode.com',
                        sub: 'Response within 24h',
                      },
                      {
                        icon: MessageCircle,
                        title: 'Live Chat',
                        detail: '9 AM - 6 PM EST',
                        sub: 'Instant responses',
                      },
                      {
                        icon: HelpCircle,
                        title: 'Community',
                        detail: 'community.lumnicode.com',
                        sub: 'Help from other users',
                      },
                    ].map(c => (
                      <div key={c.title} className="flex items-start gap-3">
                        <c.icon className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-zinc-200">
                            {c.title}
                          </p>
                          <p className="text-xs text-zinc-400">{c.detail}</p>
                          <p className="text-xs text-zinc-600">{c.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                    <h3 className="text-sm font-medium text-zinc-200 mb-3">
                      Send a Message
                    </h3>
                    {contactSent ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-emerald-400 mb-1">
                          Message sent
                        </p>
                        <p className="text-xs text-zinc-500">
                          We'll get back to you within 24 hours.
                        </p>
                        <button
                          onClick={() => setContactSent(false)}
                          className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Send another
                        </button>
                      </div>
                    ) : (
                      <form
                        className="space-y-3"
                        onSubmit={e => {
                          e.preventDefault()
                          if (contactSubject.trim() && contactMessage.trim()) {
                            setContactSent(true)
                            setContactSubject('')
                            setContactMessage('')
                          }
                        }}
                      >
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                            Subject
                          </label>
                          <input
                            type="text"
                            value={contactSubject}
                            onChange={e => setContactSubject(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                            placeholder="What can we help with?"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                            Message
                          </label>
                          <textarea
                            rows={5}
                            value={contactMessage}
                            onChange={e => setContactMessage(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                            placeholder="Describe your issue..."
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          disabled={
                            !contactSubject.trim() || !contactMessage.trim()
                          }
                        >
                          Send Message
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-zinc-100">
                  Resources
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      title: 'Documentation',
                      items: [
                        {
                          t: 'API Reference',
                          d: 'Complete API docs',
                          icon: Code2,
                        },
                        {
                          t: 'SDK Guides',
                          d: 'Integration guides',
                          icon: Terminal,
                        },
                        {
                          t: 'Best Practices',
                          d: 'Tips for optimal AI usage',
                          icon: Lightbulb,
                        },
                      ],
                    },
                    {
                      title: 'Community',
                      items: [
                        {
                          t: 'GitHub',
                          d: 'Source code & examples',
                          icon: Code2,
                        },
                        {
                          t: 'Discord',
                          d: 'Developer community',
                          icon: MessageCircle,
                        },
                        { t: 'Blog', d: 'Updates & tutorials', icon: Book },
                      ],
                    },
                  ].map(section => (
                    <div
                      key={section.title}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
                    >
                      <h3 className="text-sm font-medium text-zinc-200 mb-3">
                        {section.title}
                      </h3>
                      <div className="space-y-1">
                        {section.items.map(r => (
                          <div
                            key={r.t}
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group"
                          >
                            <r.icon className="h-4 w-4 text-zinc-500" />
                            <div className="flex-1">
                              <p className="text-sm text-zinc-300">{r.t}</p>
                              <p className="text-xs text-zinc-500">{r.d}</p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-zinc-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
