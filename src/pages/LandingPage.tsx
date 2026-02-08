import { Link } from 'react-router-dom';
import heroBackground from '@/assets/hero-bg.jpg';
import { 
  Sparkles, 
  Boxes, 
  Code2, 
  Shield, 
  ArrowRight,
  Zap,
  Scale,
  Brain,
  Terminal,
  Key,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlowCard } from '@/components/features/GlowCard';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="relative size-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center glow-cyan">
                <Sparkles className="size-5 text-background" />
              </div>
              <span className="font-bold text-xl text-gradient">Jostavan AI</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link to="/api-keys" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                API Keys
              </Link>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </nav>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 glow-cyan">
                <Link to="/vibecoder">
                  Start Building
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-radial" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border mb-8">
              <Zap className="size-4 text-cyan-500" />
              <span className="text-sm">Powered by Multi-Agent AI Architecture</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Build with
              <span className="text-gradient block">Agentic Intelligence</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Generate production-ready code with our Master Orchestrator. 
              Three specialized AI agents work together to architect, engineer, 
              and validate your code in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 glow-cyan text-lg px-8">
                <Link to="/vibecoder">
                  <Terminal className="size-5 mr-2" />
                  Launch VibeCoder
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link to="/api-keys">
                  <Key className="size-5 mr-2" />
                  Get API Key
                </Link>
              </Button>
            </div>
          </div>

          {/* Agent cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            {[
              {
                icon: Boxes,
                name: 'The Architect',
                role: 'Logic & Schema Designer',
                description: 'Breaks down your request into a structured manifest of file operations and dependencies.',
                color: 'cyan',
                model: 'Gemini Pro',
              },
              {
                icon: Code2,
                name: 'The Engineer',
                role: 'Code Generator',
                description: 'Writes production-ready, type-safe code for each file with best practices built in.',
                color: 'purple',
                model: 'Claude Sonnet',
              },
              {
                icon: Shield,
                name: 'The QA Specialist',
                role: 'Validation & Testing',
                description: 'Lints, validates, and checks for security vulnerabilities before delivery.',
                color: 'green',
                model: 'Gemini Flash',
              },
            ].map((agent) => (
              <GlowCard key={agent.name} glowColor={agent.color as 'cyan' | 'purple' | 'green'}>
                <div className="p-6">
                  <div className={`size-12 rounded-xl bg-${agent.color}-500/20 flex items-center justify-center mb-4`}>
                    <agent.icon className={`size-6 text-${agent.color}-500`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{agent.name}</h3>
                  <p className="text-sm text-primary mb-3">{agent.role}</p>
                  <p className="text-muted-foreground text-sm mb-4">{agent.description}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {agent.model}
                  </span>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Choose Your Model
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select the perfect balance of speed and quality for your use case.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                name: 'Flash',
                tier: 'Fast',
                description: 'Optimized for speed. Perfect for quick iterations and simple tasks.',
                latency: '~1s',
                color: 'green',
              },
              {
                icon: Scale,
                name: 'Sonnet',
                tier: 'Balanced',
                description: 'The sweet spot. Excellent quality with reasonable response times.',
                latency: '~3s',
                color: 'purple',
                popular: true,
              },
              {
                icon: Brain,
                name: 'Pro',
                tier: 'Reasoning',
                description: 'Maximum reasoning capabilities for complex architecture decisions.',
                latency: '~8s',
                color: 'cyan',
              },
            ].map((model) => (
              <div
                key={model.name}
                className={`relative p-6 rounded-xl border ${
                  model.popular
                    ? 'border-primary bg-gradient-to-b from-primary/10 to-transparent'
                    : 'border-border bg-card'
                }`}
              >
                {model.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                )}
                <div className={`size-12 rounded-xl bg-${model.color}-500/20 flex items-center justify-center mb-4`}>
                  <model.icon className={`size-6 text-${model.color}-500`} />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{model.name}</h3>
                  <span className="text-xs text-muted-foreground">({model.tier})</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{model.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted">
                    Latency: {model.latency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Build with AI Agents?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start generating production-ready code with our agentic platform. 
            Get your API key and launch VibeCoder in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 glow-cyan">
              <Link to="/api-keys">
                Get Started Free
                <ChevronRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/docs">
                Read Documentation
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="size-4 text-background" />
              </div>
              <span className="font-semibold">Jostavan AI</span>
            </div>
            
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
              <Link to="/api-keys" className="hover:text-foreground transition-colors">API Keys</Link>
              <Link to="/usage" className="hover:text-foreground transition-colors">Usage</Link>
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            </nav>
            
            <p className="text-sm text-muted-foreground">
              © 2024 Jostavan AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
