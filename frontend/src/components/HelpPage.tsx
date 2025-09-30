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
  Globe,
  Terminal,
  Settings,
  Key,
  Plus,
  ArrowRight,
  Lightbulb,
  Play,
  ChevronDown
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
  icon: React.ComponentType<any>
}

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'faq' | 'tutorials' | 'contact' | 'resources'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How do I create my first project?',
      answer: 'To create your first project, click the "New Project" button on the dashboard or use the AI Assistant to describe what you want to build. You can choose from templates or start from scratch with your preferred tech stack.',
      category: 'Getting Started',
      tags: ['project', 'creation', 'templates']
    },
    {
      id: '2',
      question: 'How do I add API keys for AI services?',
      answer: 'Go to the API Keys section in the sidebar, click "Add New Key", select your AI provider (OpenAI, Google Gemini, etc.), and paste your API key. We\'ll validate it automatically.',
      category: 'API Keys',
      tags: ['api', 'keys', 'ai', 'providers']
    },
    {
      id: '3',
      question: 'What tech stacks are supported?',
      answer: 'We support modern web development technologies including React, Vue.js, Angular, Next.js, Node.js, Express, FastAPI, MongoDB, PostgreSQL, and many more. Check the tech stack selection when creating a project.',
      category: 'Tech Stack',
      tags: ['tech', 'stack', 'frameworks', 'libraries']
    },
    {
      id: '4',
      question: 'How does the AI Assistant work?',
      answer: 'Our AI Assistant uses your provided API keys to generate code, provide suggestions, and help with project development. It can analyze your code, suggest improvements, and even create entire projects based on your descriptions.',
      category: 'AI Assistant',
      tags: ['ai', 'assistant', 'code', 'generation']
    },
    {
      id: '5',
      question: 'Can I collaborate with others on projects?',
      answer: 'Yes! You can share projects with team members, invite collaborators, and work together in real-time. Use the share button on any project to invite others.',
      category: 'Collaboration',
      tags: ['collaboration', 'team', 'sharing', 'invite']
    },
    {
      id: '6',
      question: 'How do I export my projects?',
      answer: 'You can export your projects as ZIP files or clone them to your local machine. Use the project menu (three dots) and select "Export" or "Download".',
      category: 'Export',
      tags: ['export', 'download', 'backup']
    }
  ]

  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Getting Started with Lumnicode',
      description: 'Learn the basics of using Lumnicode for AI-powered development',
      duration: '5 min',
      difficulty: 'beginner',
      type: 'video',
      icon: Play
    },
    {
      id: '2',
      title: 'Setting Up API Keys',
      description: 'Complete guide to configuring AI service API keys',
      duration: '3 min',
      difficulty: 'beginner',
      type: 'article',
      icon: Key
    },
    {
      id: '3',
      title: 'Creating Your First Project',
      description: 'Step-by-step tutorial on project creation and tech stack selection',
      duration: '8 min',
      difficulty: 'beginner',
      type: 'interactive',
      icon: Plus
    },
    {
      id: '4',
      title: 'Advanced AI Features',
      description: 'Master the AI Assistant for code generation and optimization',
      duration: '12 min',
      difficulty: 'intermediate',
      type: 'video',
      icon: Sparkles
    },
    {
      id: '5',
      title: 'Project Collaboration',
      description: 'Learn how to work with team members and share projects',
      duration: '6 min',
      difficulty: 'intermediate',
      type: 'article',
      icon: Globe
    },
    {
      id: '6',
      title: 'Customizing Your Workspace',
      description: 'Personalize your development environment and settings',
      duration: '4 min',
      difficulty: 'beginner',
      type: 'interactive',
      icon: Settings
    }
  ]

  const categories = ['all', 'Getting Started', 'API Keys', 'Tech Stack', 'AI Assistant', 'Collaboration', 'Export']

  const filteredFAQ = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/20'
      case 'advanced': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video
      case 'article': return Book
      case 'interactive': return Zap
      default: return Book
    }
  }

  return (
    <>
      <Helmet>
        <title>Help & Support - Lumnicode</title>
        <meta name="description" content="Get help with Lumnicode. Find tutorials, FAQs, and support resources for AI-powered development." />
      </Helmet>
          {/* Header */}
          <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Page Title */}
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Help & Support
                  </h1>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4">
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
              {/* Navigation */}
              <div className="lg:w-64 flex-shrink-0">
                <nav className="space-y-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: HelpCircle },
                    { id: 'faq', label: 'FAQ', icon: MessageCircle },
                    { id: 'tutorials', label: 'Tutorials', icon: Book },
                    { id: 'contact', label: 'Contact', icon: Mail },
                    { id: 'resources', label: 'Resources', icon: ExternalLink }
                  ].map((tab) => (
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

              {/* Content */}
              <div className="flex-1">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-4">Welcome to Lumnicode Help</h2>
                      <p className="text-gray-400 text-lg mb-8">
                        Get help with using Lumnicode's AI-powered development platform. Find answers to common questions, 
                        learn through tutorials, and get support when you need it.
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group"
                           onClick={() => setActiveTab('faq')}>
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3">
                            <MessageCircle className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                              Frequently Asked Questions
                            </h3>
                            <p className="text-sm text-gray-400">Find quick answers</p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Browse our comprehensive FAQ section for answers to the most common questions about using Lumnicode.
                        </p>
                      </div>

                      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group"
                           onClick={() => setActiveTab('tutorials')}>
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3">
                            <Book className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                              Tutorials & Guides
                            </h3>
                            <p className="text-sm text-gray-400">Learn step by step</p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Follow our interactive tutorials and video guides to master Lumnicode's features.
                        </p>
                      </div>

                      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group"
                           onClick={() => setActiveTab('contact')}>
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3">
                            <Mail className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                              Contact Support
                            </h3>
                            <p className="text-sm text-gray-400">Get personal help</p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Can't find what you're looking for? Contact our support team for personalized assistance.
                        </p>
                      </div>
                    </div>

                    {/* Getting Started */}
                    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Getting Started</h3>
                      <div className="space-y-4">
                        {[
                          { step: 1, title: 'Set up your API keys', description: 'Add your AI service API keys to get started', icon: Key },
                          { step: 2, title: 'Create your first project', description: 'Use our AI Assistant or templates to create a project', icon: Plus },
                          { step: 3, title: 'Start coding with AI', description: 'Let AI help you build amazing applications', icon: Sparkles }
                        ].map((item) => (
                          <div key={item.step} className="flex items-center space-x-4">
                            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                              {item.step}
                            </div>
                            <div className="flex items-center space-x-3 flex-1">
                              <item.icon className="h-5 w-5 text-gray-400" />
                              <div>
                                <h4 className="font-medium text-white">{item.title}</h4>
                                <p className="text-sm text-gray-400">{item.description}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'faq' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                      <p className="text-gray-400 text-lg mb-8">
                        Find answers to the most common questions about using Lumnicode.
                      </p>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="Search FAQ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="appearance-none px-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:bg-gray-800/50 cursor-pointer min-w-[160px]"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category} className="bg-gray-900 text-white">
                              {category === 'all' ? 'All Categories' : category}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* FAQ Items */}
                    <div className="space-y-4">
                      {filteredFAQ.map((item) => (
                        <div key={item.id} className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                            <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-gray-300 mb-4">{item.answer}</p>
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <span key={tag} className="text-xs bg-gray-700/50 text-gray-400 px-2 py-1 rounded">
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
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-4">Tutorials & Guides</h2>
                      <p className="text-gray-400 text-lg mb-8">
                        Learn how to use Lumnicode with our comprehensive tutorials and guides.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tutorials.map((tutorial) => {
                        const TypeIcon = getTypeIcon(tutorial.type)
                        return (
                          <div key={tutorial.id} className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-2">
                                  <TypeIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                                    {tutorial.title}
                                  </h3>
                                  <p className="text-sm text-gray-400">{tutorial.duration}</p>
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(tutorial.difficulty)}`}>
                                {tutorial.difficulty}
                              </span>
                            </div>
                            <p className="text-gray-300 mb-4">{tutorial.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <tutorial.icon className="h-4 w-4" />
                                <span className="capitalize">{tutorial.type}</span>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-4">Contact Support</h2>
                      <p className="text-gray-400 text-lg mb-8">
                        Can't find what you're looking for? We're here to help!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <h3 className="text-xl font-semibold text-white mb-4">Get in Touch</h3>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3">
                                <Mail className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">Email Support</h4>
                                <p className="text-gray-400">support@lumnicode.com</p>
                                <p className="text-sm text-gray-500">Response within 24 hours</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3">
                                <MessageCircle className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">Live Chat</h4>
                                <p className="text-gray-400">Available 9 AM - 6 PM EST</p>
                                <p className="text-sm text-gray-500">Instant responses</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3">
                                <HelpCircle className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">Community Forum</h4>
                                <p className="text-gray-400">community.lumnicode.com</p>
                                <p className="text-sm text-gray-500">Get help from other users</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                          <h3 className="text-xl font-semibold text-white mb-4">Send us a Message</h3>
                          <form className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Subject
                              </label>
                              <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200"
                                placeholder="What can we help you with?"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Message
                              </label>
                              <textarea
                                rows={6}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-200 resize-none"
                                placeholder="Describe your issue or question in detail..."
                              />
                            </div>
                            <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 font-medium">
                              Send Message
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-4">Resources</h2>
                      <p className="text-gray-400 text-lg mb-8">
                        Additional resources to help you get the most out of Lumnicode.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Documentation</h3>
                        <div className="space-y-3">
                          {[
                            { title: 'API Reference', description: 'Complete API documentation', icon: Code2 },
                            { title: 'SDK Guides', description: 'Integration guides for popular languages', icon: Terminal },
                            { title: 'Best Practices', description: 'Tips for optimal AI usage', icon: Lightbulb }
                          ].map((resource) => (
                            <div key={resource.title} className="flex items-center space-x-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer group">
                              <resource.icon className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                              <div>
                                <h4 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                                  {resource.title}
                                </h4>
                                <p className="text-sm text-gray-400">{resource.description}</p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-gray-500 ml-auto" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Community</h3>
                        <div className="space-y-3">
                          {[
                            { title: 'GitHub Repository', description: 'Open source components and examples', icon: Code2 },
                            { title: 'Discord Server', description: 'Join our developer community', icon: MessageCircle },
                            { title: 'Blog', description: 'Latest updates and tutorials', icon: Book }
                          ].map((resource) => (
                            <div key={resource.title} className="flex items-center space-x-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer group">
                              <resource.icon className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                              <div>
                                <h4 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                                  {resource.title}
                                </h4>
                                <p className="text-sm text-gray-400">{resource.description}</p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-gray-500 ml-auto" />
                            </div>
                          ))}
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
