import { useState } from 'react';
import { documentationSections } from '@/constants/mockData';
import { GlowCard } from '@/components/features/GlowCard';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  ChevronRight, 
  Copy, 
  Check,
  Zap,
  Scale,
  Brain,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function DocsPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('quickstart');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard.',
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-border p-4 overflow-auto scrollbar-thin">
        <div className="space-y-6">
          {documentationSections.map((section) => (
            <div key={section.id}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left',
                      activeSection === item.id
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {activeSection === item.id && (
                      <ChevronRight className="size-3 text-primary" />
                    )}
                    <span className={activeSection !== item.id ? 'ml-5' : ''}>
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto scrollbar-thin p-8 bg-gradient-radial">
        <div className="max-w-3xl mx-auto">
          {/* Quickstart section */}
          {activeSection === 'quickstart' && (
            <article className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Quickstart Guide</h1>
                <p className="text-lg text-muted-foreground">
                  Get started with the Jostavan Agentic API in under 5 minutes.
                </p>
              </div>

              <GlowCard>
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">1. Generate an API Key</h2>
                  <p className="text-muted-foreground">
                    Navigate to the API Keys page and create a new key. Store it securely — 
                    you won't be able to see it again.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/api-keys">
                      Go to API Keys
                      <ArrowRight className="size-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </GlowCard>

              <GlowCard glowColor="purple">
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">2. Make Your First Request</h2>
                  <p className="text-muted-foreground">
                    Use the following code to send your first request to the Agentic API:
                  </p>
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-[#1e1e1e] overflow-x-auto font-mono text-sm">
{`curl -X POST https://api.jostavan.ai/v1/chat/completions \\
  -H "Authorization: Bearer sk-jostavan-your-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "balanced",
    "messages": [
      {
        "role": "user",
        "content": "Create a login form with validation"
      }
    ]
  }'`}
                    </pre>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(`curl -X POST https://api.jostavan.ai/v1/chat/completions ...`, 'curl')}
                    >
                      {copied === 'curl' ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                </div>
              </GlowCard>

              <GlowCard glowColor="green">
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">3. Try VibeCoder IDE</h2>
                  <p className="text-muted-foreground">
                    For an interactive experience, try our built-in VibeCoder IDE with 
                    real-time code generation and streaming.
                  </p>
                  <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                    <a href="/vibecoder">
                      <Terminal className="size-4 mr-2" />
                      Open VibeCoder
                    </a>
                  </Button>
                </div>
              </GlowCard>
            </article>
          )}

          {/* Chat Completions section */}
          {activeSection === 'chat-completions' && (
            <article className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Chat Completions</h1>
                <p className="text-lg text-muted-foreground">
                  The main endpoint for interacting with the Jostavan Agentic system.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border font-mono text-sm">
                <span className="text-green-400">POST</span>{' '}
                <span className="text-cyan-400">/v1/chat/completions</span>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Request Body</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4">Parameter</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-mono text-cyan-400">model</td>
                        <td className="py-3 px-4 text-muted-foreground">string</td>
                        <td className="py-3 px-4">One of: <code className="bg-muted px-1.5 py-0.5 rounded">fast</code>, <code className="bg-muted px-1.5 py-0.5 rounded">balanced</code>, <code className="bg-muted px-1.5 py-0.5 rounded">reasoning</code></td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-mono text-cyan-400">messages</td>
                        <td className="py-3 px-4 text-muted-foreground">array</td>
                        <td className="py-3 px-4">Array of message objects with role and content</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-mono text-cyan-400">stream</td>
                        <td className="py-3 px-4 text-muted-foreground">boolean</td>
                        <td className="py-3 px-4">Enable streaming responses (default: false)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          )}

          {/* Model Selection section */}
          {activeSection === 'model-selection' && (
            <article className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Model Selection</h1>
                <p className="text-lg text-muted-foreground">
                  Choose the right model for your use case.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    id: 'fast',
                    name: 'Flash (Fast)',
                    icon: Zap,
                    color: 'text-green-400',
                    bgColor: 'from-green-500/20 to-emerald-500/20',
                    provider: 'Gemini 1.5 Flash',
                    description: 'Optimized for speed. Best for quick iterations, simple code fixes, and rapid prototyping.',
                    latency: '~1 second',
                    quality: 'Good',
                  },
                  {
                    id: 'balanced',
                    name: 'Sonnet (Balanced)',
                    icon: Scale,
                    color: 'text-purple-400',
                    bgColor: 'from-purple-500/20 to-pink-500/20',
                    provider: 'Claude 3.5 Sonnet',
                    description: 'The sweet spot. Excellent code quality with reasonable response times. Recommended for most use cases.',
                    latency: '~3 seconds',
                    quality: 'Excellent',
                  },
                  {
                    id: 'reasoning',
                    name: 'Pro (Reasoning)',
                    icon: Brain,
                    color: 'text-cyan-400',
                    bgColor: 'from-cyan-500/20 to-blue-500/20',
                    provider: 'Gemini 1.5 Pro',
                    description: 'Maximum reasoning capabilities. Best for complex architecture decisions and intricate logic.',
                    latency: '~8 seconds',
                    quality: 'Superior',
                  },
                ].map((model) => (
                  <div
                    key={model.id}
                    className={`p-6 rounded-xl bg-gradient-to-br ${model.bgColor} border border-border`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-muted/50 ${model.color}`}>
                        <model.icon className="size-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{model.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {model.description}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {model.provider}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            Latency: {model.latency}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            Quality: {model.quality}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* Authentication section */}
          {activeSection === 'authentication' && (
            <article className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Authentication</h1>
                <p className="text-lg text-muted-foreground">
                  Secure your API requests with Bearer token authentication.
                </p>
              </div>

              <GlowCard>
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">API Key Format</h2>
                  <p className="text-muted-foreground">
                    All Jostavan API keys follow the format:
                  </p>
                  <code className="block p-3 rounded-lg bg-[#1e1e1e] font-mono text-cyan-400">
                    sk-jostavan-[32-character-random-string]
                  </code>
                </div>
              </GlowCard>

              <GlowCard glowColor="purple">
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">Making Authenticated Requests</h2>
                  <p className="text-muted-foreground">
                    Include your API key in the Authorization header:
                  </p>
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-[#1e1e1e] overflow-x-auto font-mono text-sm">
{`Authorization: Bearer sk-jostavan-your-api-key`}
                    </pre>
                  </div>
                </div>
              </GlowCard>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <h3 className="font-semibold text-amber-500 mb-2">Security Best Practices</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Never expose API keys in client-side code</li>
                  <li>• Use environment variables to store keys</li>
                  <li>• Rotate keys periodically</li>
                  <li>• Revoke compromised keys immediately</li>
                </ul>
              </div>
            </article>
          )}

          {/* Default content for other sections */}
          {!['quickstart', 'chat-completions', 'model-selection', 'authentication'].includes(activeSection) && (
            <article className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4 capitalize">
                  {activeSection.replace(/-/g, ' ')}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Documentation for this section is coming soon.
                </p>
              </div>
              
              <div className="p-12 rounded-xl border border-dashed border-border text-center">
                <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Under Construction</h3>
                <p className="text-muted-foreground">
                  We're working on this documentation. Check back soon!
                </p>
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
