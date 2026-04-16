import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Helmet } from 'react-helmet-async'
import {
  Code2,
  ArrowRight,
  Zap,
  Shield,
  FolderOpen,
  GitBranch,
  Globe,
  Cpu,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Lumnicode - Build with AI using your own API keys</title>
        <meta
          name="description"
          content="Create projects faster with AI assistance. Use your OpenAI, Gemini, or other API keys. No subscriptions, no limits."
        />
      </Helmet>
      <div className="min-h-screen bg-[#09090b] text-zinc-100">
        {/* Navigation */}
        <nav className="h-14 px-6 border-b border-zinc-800/60">
          <div className="flex items-center justify-between max-w-6xl mx-auto h-full">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Code2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight">
                Lumnicode
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-5">
                <a
                  href="#features"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  How it works
                </a>
              </div>
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <button className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="px-6 pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              <span className="text-xs text-emerald-400 font-medium">
                Free forever &middot; Bring your own API keys
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Build with AI using{' '}
              <span className="text-indigo-400">your own API keys</span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              An online code editor with AI assistance. Connect your OpenAI,
              Gemini, or Anthropic keys and start building. No subscriptions, no
              hidden costs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
              <SignUpButton mode="modal">
                <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                  Start Building
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-sm font-medium rounded-lg transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div>
                <p className="text-2xl font-bold text-zinc-100">Free</p>
                <p className="text-xs text-zinc-500 mt-1">No platform cost</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">8+</p>
                <p className="text-xs text-zinc-500 mt-1">AI providers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">BYOK</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Your keys, your data
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Code Preview */}
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                </div>
                <span className="text-xs text-zinc-500 ml-2">
                  LoginForm.tsx
                </span>
              </div>
              <div className="p-5 font-mono text-[13px] leading-relaxed space-y-1">
                <div className="text-zinc-500">
                  {'// AI-generated component'}
                </div>
                <div>
                  <span className="text-indigo-400">import</span>{' '}
                  <span className="text-zinc-300">{'{ useState }'}</span>{' '}
                  <span className="text-indigo-400">from</span>{' '}
                  <span className="text-emerald-400">'react'</span>
                </div>
                <div className="h-3"></div>
                <div>
                  <span className="text-violet-400">
                    export default function
                  </span>{' '}
                  <span className="text-amber-300">LoginForm</span>
                  <span className="text-zinc-300">() {'{'}</span>
                </div>
                <div className="pl-4">
                  <span className="text-indigo-400">const</span>{' '}
                  <span className="text-zinc-300">[email, setEmail] =</span>{' '}
                  <span className="text-amber-300">useState</span>
                  <span className="text-zinc-300">('')</span>
                </div>
                <div className="pl-4">
                  <span className="text-indigo-400">const</span>{' '}
                  <span className="text-zinc-300">
                    [password, setPassword] =
                  </span>{' '}
                  <span className="text-amber-300">useState</span>
                  <span className="text-zinc-300">('')</span>
                </div>
                <div className="h-3"></div>
                <div className="pl-4">
                  <span className="text-indigo-400">return</span>{' '}
                  <span className="text-zinc-300">(</span>
                </div>
                <div className="pl-8">
                  <span className="text-zinc-300">&lt;</span>
                  <span className="text-rose-400">form</span>
                  <span className="text-zinc-300">&gt;</span>
                </div>
                <div className="pl-12">
                  <span className="text-zinc-300">&lt;</span>
                  <span className="text-rose-400">input</span>{' '}
                  <span className="text-indigo-300">value</span>
                  <span className="text-zinc-300">=</span>
                  <span className="text-zinc-300">{'{email}'}</span>{' '}
                  <span className="text-zinc-300">/&gt;</span>
                </div>
                <div className="pl-12">
                  <span className="text-zinc-300">&lt;</span>
                  <span className="text-rose-400">button</span>{' '}
                  <span className="text-indigo-300">type</span>
                  <span className="text-zinc-300">=</span>
                  <span className="text-emerald-400">"submit"</span>
                  <span className="text-zinc-300">&gt;Sign In&lt;/</span>
                  <span className="text-rose-400">button</span>
                  <span className="text-zinc-300">&gt;</span>
                </div>
                <div className="pl-8">
                  <span className="text-zinc-300">&lt;/</span>
                  <span className="text-rose-400">form</span>
                  <span className="text-zinc-300">&gt;</span>
                </div>
                <div className="pl-4">
                  <span className="text-zinc-300">)</span>
                </div>
                <div>
                  <span className="text-zinc-300">{'}'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-6 pb-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-6">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: '1',
                  title: 'Describe your project',
                  desc: 'Tell the AI what you want to build using natural language.',
                },
                {
                  step: '2',
                  title: 'Choose your stack',
                  desc: 'Select technologies or let AI recommend the best fit.',
                },
                {
                  step: '3',
                  title: 'Start coding',
                  desc: 'Edit, refactor, and iterate with AI-powered assistance.',
                },
              ].map(item => (
                <div
                  key={item.step}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
                >
                  <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-400 mb-3">
                    {item.step}
                  </div>
                  <h3 className="text-sm font-medium text-zinc-200 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-zinc-100 mb-3">
                Everything you need to build with AI
              </h2>
              <p className="text-base text-zinc-400 max-w-2xl mx-auto">
                A complete development platform with multi-provider AI support
                and your own API keys.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: Cpu,
                  title: 'Multi-Provider AI',
                  desc: 'Use OpenAI, Gemini, Claude, and more. Switch between providers seamlessly.',
                },
                {
                  icon: Zap,
                  title: 'Your API Keys',
                  desc: 'Bring your own keys. No vendor lock-in, no hidden costs. You control your usage.',
                },
                {
                  icon: FolderOpen,
                  title: 'Project Management',
                  desc: 'Create, organize, and manage projects with AI assistance and templates.',
                },
                {
                  icon: GitBranch,
                  title: 'Code Editor',
                  desc: 'Built-in Monaco editor with AI completions, suggestions, and real-time help.',
                },
                {
                  icon: Shield,
                  title: 'Privacy First',
                  desc: 'Your keys stay secure. We route requests, never store your data.',
                },
                {
                  icon: Globe,
                  title: 'Completely Free',
                  desc: 'No subscriptions, no fees, no credit card. Build unlimited projects.',
                },
              ].map(feature => (
                <div
                  key={feature.title}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:bg-zinc-900/80 transition-colors"
                >
                  <feature.icon className="h-5 w-5 text-zinc-500 mb-3" />
                  <h3 className="text-sm font-medium text-zinc-200 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-24">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-zinc-100 mb-4">
              Ready to start building?
            </h2>
            <p className="text-base text-zinc-400 mb-8">
              No credit card, no subscriptions. Just connect your API keys and
              go.
            </p>
            <SignUpButton mode="modal">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignUpButton>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-zinc-800/60">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                <Code2 className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-300">
                Lumnicode
              </span>
            </div>
            <div className="flex items-center gap-5 text-xs text-zinc-500">
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Support
              </a>
              <span>&copy; 2025 Lumnicode</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
