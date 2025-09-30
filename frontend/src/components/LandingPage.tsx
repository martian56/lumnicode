import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'

// Simple icon components to replace lucide-react
const Code2Icon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
)

const SparklesIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18l-.813-2.096a3.5 3.5 0 00-1.658-1.658L5 14l2.096-.813a3.5 3.5 0 001.658-1.658L9 10l.813 2.096a3.5 3.5 0 001.658 1.658L13 14l-2.096.813a3.5 3.5 0 00-1.658 1.658zM18 6l-.813-2.096a3.5 3.5 0 00-1.658-1.658L14 2l2.096.813a3.5 3.5 0 001.658 1.658L18 6z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const PlayIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
  </svg>
)

const CpuIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
    <rect x="9" y="9" width="6" height="6" strokeWidth={2} />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" strokeWidth={2} />
  </svg>
)

const ZapIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" strokeWidth={2} />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth={2} />
    <circle cx="9" cy="7" r="4" strokeWidth={2} />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth={2} />
  </svg>
)

const GitBranchIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="6" y1="3" x2="6" y2="15" strokeWidth={2} />
    <circle cx="18" cy="6" r="3" strokeWidth={2} />
    <circle cx="6" cy="18" r="3" strokeWidth={2} />
    <path d="M18 9a9 9 0 0 1-9 9" strokeWidth={2} />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth={2} />
  </svg>
)

const GlobeIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <line x1="2" y1="12" x2="22" y2="12" strokeWidth={2} />
    <path
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      strokeWidth={2}
    />
  </svg>
)

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Lumnicode - Build with AI using your own API keys</title>
        <meta name="description" content="Create projects faster with AI assistance. Use your OpenAI, Gemini, or other API keys. No subscriptions, no limits, no credit card required." />
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
        {/* Navigation */}
        <nav className="px-6 py-3 border-b border-gray-800">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-1">
                <div className="w-5 h-5">
                  <Code2Icon />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Lumnicode
              </span>
            </div>

            <div className="flex items-center space-x-8">
              <div className="hidden md:flex items-center space-x-6">
                <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  Features
                </a>
                <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  Pricing
                </a>
                <a href="#docs" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  Docs
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <SignInButton mode="modal">
                  <button className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200 text-sm">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="px-6 py-24">
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-4 py-2 mb-8">
              <div className="w-4 h-4 mr-2">
                <SparklesIcon />
              </div>
              <span className="text-sm text-green-400 font-medium">100% Free • Bring Your Own API Keys</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Build with AI using
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                your own API keys
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
              Create projects faster with AI assistance. Use your OpenAI, Gemini, or other API keys. 
              No subscriptions, no limits, no credit card required. Build amazing applications for free.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <SignUpButton mode="modal">
                <button className="group bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center space-x-2 w-full sm:w-auto justify-center shadow-lg hover:shadow-green-500/25">
                  <span>Start Building Free</span>
                  <div className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                    <ArrowRightIcon />
                  </div>
                </button>
              </SignUpButton>

              <SignInButton mode="modal">
                <button className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800/50 transition-all duration-300 flex items-center space-x-2 w-full sm:w-auto justify-center">
                  <div className="w-5 h-5">
                    <PlayIcon />
                  </div>
                  <span>Sign In</span>
                </button>
              </SignInButton>
            </div>

            {/* Trust Indicators */}
            <div className="text-center mb-16">
              <p className="text-sm text-gray-400 mb-6">Join developers building the future</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="text-lg font-semibold">Open Source</div>
                <div className="text-lg font-semibold">Community Driven</div>
                <div className="text-lg font-semibold">Privacy First</div>
                <div className="text-lg font-semibold">No Vendor Lock-in</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">100%</div>
                <div className="text-gray-400">Free Forever</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">8+</div>
                <div className="text-gray-400">AI Providers</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">0$</div>
                <div className="text-gray-400">Monthly Cost</div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Preview Section */}
        <div className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm text-gray-400">AI Code Assistant</span>
                </div>
                <div className="text-xs text-gray-400">Generating...</div>
              </div>

              <div className="font-mono text-sm space-y-2">
                <div className="text-gray-500">{"// AI-powered component generation"}</div>
                <div className="text-blue-400">
                  {"import"} <span className="text-white">{"{ useState }"}</span>{" "}
                  <span className="text-blue-400">from</span> <span className="text-green-400">'react'</span>
                </div>
                <div className="text-blue-400">
                  {"import"} <span className="text-white">{"{ Button }"}</span>{" "}
                  <span className="text-blue-400">from</span>{" "}
                  <span className="text-green-400">'@/components/ui/button'</span>
                </div>
                <div className="mt-4">
                  <span className="text-purple-400">export default function</span>{" "}
                  <span className="text-yellow-400">LoginForm</span>
                  <span className="text-white">() {"{"}</span>
                </div>
                <div className="ml-4 text-gray-500">{"// AI suggests optimal state management"}</div>
                <div className="ml-4">
                  <span className="text-blue-400">const</span> <span className="text-white">[email, setEmail] = </span>
                  <span className="text-yellow-400">useState</span>
                  <span className="text-white">('')</span>
                </div>
                <div className="ml-4">
                  <span className="text-blue-400">const</span> <span className="text-white">[password, setPassword] = </span>
                  <span className="text-yellow-400">useState</span>
                  <span className="text-white">('')</span>
                </div>
                <div className="ml-4 mt-4 text-gray-500">{"// AI generates form handling logic"}</div>
                <div className="ml-4">
                  <span className="text-blue-400">const</span> <span className="text-white">handleSubmit = </span>
                  <span className="text-blue-400">async</span> <span className="text-white">(e) =&gt; {"{"}</span>
                </div>
                <div className="ml-8 text-gray-500">{"// Your AI-powered validation here"}</div>
                <div className="ml-8">
                  <span className="text-white">console.log</span>
                  <span className="text-white">('Login attempt:', email)</span>
                </div>
                <div className="ml-4">
                  <span className="text-white">{"}"}</span>
                </div>
                <div className="ml-4 mt-4">
                  <span className="text-blue-400">return</span> <span className="text-white">(</span>
                </div>
                <div className="ml-8 text-gray-500">{"// AI suggests modern form structure"}</div>
                <div className="ml-8">
                  <span className="text-white">&lt;</span><span className="text-red-400">form</span> <span className="text-blue-400">onSubmit</span><span className="text-white">=</span><span className="text-yellow-400">{"{handleSubmit}"}</span><span className="text-white">&gt;</span>
                </div>
                <div className="ml-12">
                  <span className="text-white">&lt;</span><span className="text-red-400">Button</span> <span className="text-blue-400">type</span><span className="text-white">=</span><span className="text-green-400">"submit"</span><span className="text-white">&gt;</span>
                </div>
                <div className="ml-16 text-white">Sign In</div>
                <div className="ml-12">
                  <span className="text-white">&lt;/</span><span className="text-red-400">Button</span><span className="text-white">&gt;</span>
                </div>
                <div className="ml-8">
                  <span className="text-white">&lt;/</span><span className="text-red-400">form</span><span className="text-white">&gt;</span>
                </div>
                <div className="ml-4">
                  <span className="text-white">)</span>
                </div>
                <div className="text-white">{"}"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                See it in action
              </h2>
              <p className="text-xl text-gray-400">
                Create projects with AI assistance using your own API keys
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm text-gray-400">Project Creation Flow</span>
                </div>
                <div className="text-xs text-gray-400">Live Demo</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1: Chat */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span className="text-sm font-medium text-white">AI Chat</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <span className="text-blue-400">User:</span> "Create a todo app with React"
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <span className="text-green-400">AI:</span> "I'll help you create a React todo app with modern features..."
                    </div>
                  </div>
                </div>

                {/* Step 2: Tech Stack */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-sm font-medium text-white">Tech Stack</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">⚛️ React</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">🔷 TypeScript</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">🎨 Tailwind</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">🟢 Node.js</span>
                    </div>
                  </div>
                </div>

                {/* Step 3: Project */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span className="text-sm font-medium text-white">Project Created</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="text-white font-medium">Todo App</div>
                    <div className="text-gray-400 text-xs">React + TypeScript + Tailwind</div>
                    <div className="text-green-400 text-xs">✓ Ready to code</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Everything you need to
                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {" "}
                  build with AI
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                A complete development platform with AI-powered tools, multi-provider support, and your own API keys.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Cards */}
              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-3 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6 text-white">
                    <CpuIcon />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Multi-Provider AI</h3>
                <p className="text-gray-400 leading-relaxed">
                  Use OpenAI, Google Gemini, Anthropic Claude, and more. Switch between providers seamlessly with intelligent routing and fallbacks.
                </p>
              </div>

              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-3 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6 text-white">
                    <ZapIcon />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Your API Keys</h3>
                <p className="text-gray-400 leading-relaxed">
                  Bring your own API keys from any provider. No vendor lock-in, no hidden costs. You control your usage and costs.
                </p>
              </div>

              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-300">
                <div className="bg-gradient-to-br from-cyan-500 to-green-500 rounded-xl p-3 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6 text-white">
                    <UsersIcon />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Project Management</h3>
                <p className="text-gray-400 leading-relaxed">
                  Create, organize, and manage your projects with AI assistance. Choose tech stacks, templates, and get intelligent suggestions.
                </p>
              </div>

              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-300">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-3 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6 text-white">
                    <GitBranchIcon />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Code Editor</h3>
                <p className="text-gray-400 leading-relaxed">
                  Built-in Monaco editor with AI-powered code completion, suggestions, and real-time assistance. Write better code faster.
                </p>
              </div>

              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-300">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-3 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6 text-white">
                    <ShieldIcon />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Privacy First</h3>
                <p className="text-gray-400 leading-relaxed">
                  Your API keys stay secure. We don't store your data, we just route your requests. Complete privacy and control.
                </p>
              </div>

              <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-3 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6 text-white">
                    <GlobeIcon />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">100% Free</h3>
                <p className="text-gray-400 leading-relaxed">
                  No subscriptions, no hidden fees, no credit card required. Use your own API keys and build unlimited projects for free.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Why developers choose Lumnicode</h3>
              <p className="text-gray-400 mb-8">
                Build faster with AI while keeping control of your costs and data.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="text-2xl font-bold text-white">0$</div>
                  <div className="text-sm text-gray-400">Platform Cost</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">8+</div>
                  <div className="text-sm text-gray-400">AI Providers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">100%</div>
                  <div className="text-sm text-gray-400">Your Control</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">∞</div>
                  <div className="text-sm text-gray-400">Projects</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <div className="text-green-400 text-sm font-medium mb-2">"Perfect for startups"</div>
                  <p className="text-gray-300 text-sm">
                    "As a startup founder, I love that I can use my own API keys and not worry about platform costs. 
                    The AI assistance helps me prototype faster."
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <div className="text-blue-400 text-sm font-medium mb-2">"Great for learning"</div>
                  <p className="text-gray-300 text-sm">
                    "The multi-provider support lets me experiment with different AI models. 
                    I can compare OpenAI vs Gemini responses side by side."
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <div className="text-purple-400 text-sm font-medium mb-2">"Privacy focused"</div>
                  <p className="text-gray-300 text-sm">
                    "Finally, a platform that doesn't lock me in. My API keys stay mine, 
                    and I can switch providers anytime without losing my projects."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to build with AI for free?
            </h2>
            <p className="text-xl text-gray-400 mb-8">Start building today. No credit card, no subscriptions, no limits.</p>

            <SignUpButton mode="modal">
              <button className="group bg-gradient-to-r from-green-500 to-emerald-500 text-white px-12 py-5 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-green-500/25">
                <span>Get Started Free</span>
                <div className="w-6 h-6 group-hover:translate-x-1 transition-transform">
                  <ArrowRightIcon />
                </div>
              </button>
            </SignUpButton>
            
            <p className="text-sm text-gray-500 mt-4">
              ✓ No credit card required ✓ Use your own API keys ✓ Build unlimited projects
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-2">
                  <div className="w-6 h-6 text-white">
                    <Code2Icon />
                  </div>
                </div>
                <span className="text-lg font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Lumnicode
                </span>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Support
                </a>
                <div className="text-gray-400">© 2025 Lumnicode. Built for developers, by developers.</div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </>
  )
}
