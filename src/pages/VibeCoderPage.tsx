import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChatStore } from '@/stores/chatStore';
import { useThemeStore } from '@/stores/themeStore';
import { ModelSelector } from '@/components/features/ModelSelector';
import { AgentBadge, AgentPipeline } from '@/components/features/AgentBadge';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import { AGENT_CONFIGS, PHASE_DESCRIPTIONS } from '@/constants/config';
import { cn, formatRelativeTime, getLanguageFromPath } from '@/lib/utils';
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  File,
  FolderTree,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Code2,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  LayoutDashboard,
  Key,
  BookOpen,
  BarChart3,
  ChevronDown,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  Brain,
  Layers,
  Database,
  Palette,
  Shield,
  Globe,
  Zap,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Editor from '@monaco-editor/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/docs', label: 'Documentation', icon: BookOpen },
  { path: '/usage', label: 'Usage', icon: BarChart3 },
];

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportSizes: Record<ViewportSize, { width: string; icon: typeof Monitor }> = {
  desktop: { width: '100%', icon: Monitor },
  tablet: { width: '768px', icon: Tablet },
  mobile: { width: '375px', icon: Smartphone },
};

const phaseToNumber: Record<string, number> = {
  idle: 0,
  blueprinting: 1,
  dataLayer: 2,
  uiDesign: 3,
  security: 4,
  liveIntel: 5,
  fastChat: 6,
  finalCheck: 7,
  complete: 8,
};

export default function VibeCoderPage() {
  const {
    sessions,
    currentSessionId,
    isGenerating,
    currentPhase,
    createSession,
    selectSession,
    deleteSession,
    processTask,
    processFastChat,
    setModel,
  } = useChatStore();
  
  const { theme } = useThemeStore();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true);
  const [filesPanelOpen, setFilesPanelOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [showCode, setShowCode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navbarTimeoutRef = useRef<NodeJS.Timeout>();

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const currentFile = currentSession?.files.find((f) => f.path === selectedFile);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Select first generated file automatically
  useEffect(() => {
    if (currentSession?.files.length && !selectedFile) {
      setSelectedFile(currentSession.files[0].path);
    }
  }, [currentSession?.files, selectedFile]);

  const handleNavbarEnter = () => {
    if (navbarTimeoutRef.current) {
      clearTimeout(navbarTimeoutRef.current);
    }
    setNavbarVisible(true);
  };

  const handleNavbarLeave = () => {
    navbarTimeoutRef.current = setTimeout(() => {
      setNavbarVisible(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    if (!currentSessionId) {
      createSession();
    }

    const prompt = input.trim();
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Check if it's a quick question or a build request
    const isQuickQuestion = prompt.length < 50 && 
      (prompt.includes('?') || 
       prompt.toLowerCase().startsWith('what') ||
       prompt.toLowerCase().startsWith('how') ||
       prompt.toLowerCase().startsWith('why') ||
       prompt.toLowerCase().startsWith('explain'));
    
    if (isQuickQuestion) {
      await processFastChat(prompt);
    } else {
      await processTask(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleNewChat = () => {
    createSession();
    setSelectedFile(null);
  };

  const handleCopyCode = () => {
    if (currentFile?.content) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Code copied to clipboard.',
      });
    }
  };

  const getAgentIcon = (agent: string) => {
    const config = AGENT_CONFIGS[agent];
    if (!config) return <Sparkles className="size-3" />;
    
    const iconMap: Record<string, typeof Brain> = {
      Brain, Layers, Database, Palette, Shield, Globe, Zap, CheckCircle2
    };
    
    const Icon = iconMap[config.icon] || Brain;
    return <Icon className="size-3" />;
  };

  return (
    <div className="vibecoder-fullscreen flex flex-col">
      {/* Navbar hover trigger zone */}
      <div 
        className="navbar-trigger"
        onMouseEnter={handleNavbarEnter}
      />

      {/* Auto-hiding Navbar */}
      <header
        className={cn(
          'vibecoder-navbar h-14 border-b border-border bg-card/95 backdrop-blur-md flex items-center px-4 gap-4',
          navbarVisible && 'visible'
        )}
        onMouseEnter={handleNavbarEnter}
        onMouseLeave={handleNavbarLeave}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-bold text-gradient">Jostavan</span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Pipeline indicator */}
        {isGenerating && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
            <Activity className="size-3 text-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {PHASE_DESCRIPTIONS[currentPhase] || 'Processing...'}
            </span>
          </div>
        )}

        {/* Model selector */}
        <ModelSelector
          value={currentSession?.model || 'balanced'}
          onChange={setModel}
          disabled={isGenerating}
        />

        {/* Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
          <div className={cn(
            'size-2 rounded-full',
            isGenerating ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
          )} />
          <span className="text-xs text-muted-foreground font-mono">
            {isGenerating ? 'Working' : 'Ready'}
          </span>
        </div>

        <ThemeToggle />
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden pt-0">
        {/* Left: AI Chat Panel */}
        <div
          className={cn(
            'border-r border-border bg-card/30 flex flex-col transition-all duration-300',
            chatSidebarOpen ? 'w-[420px]' : 'w-14'
          )}
        >
          {/* Chat header */}
          <div className="h-12 border-b border-border flex items-center justify-between px-3 bg-card/50">
            {chatSidebarOpen ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <Brain className="size-3 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Multi-Agent Pipeline</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={handleNewChat}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => setChatSidebarOpen(false)}
                  >
                    <PanelRightClose className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="size-8 mx-auto"
                onClick={() => setChatSidebarOpen(true)}
              >
                <PanelRightOpen className="size-4" />
              </Button>
            )}
          </div>

          {chatSidebarOpen && (
            <>
              {/* Agent Pipeline Indicator */}
              {isGenerating && (
                <div className="px-3 py-2 border-b border-border bg-muted/20">
                  <AgentPipeline 
                    currentPhase={phaseToNumber[currentPhase] || 0} 
                    className="text-[9px]"
                  />
                </div>
              )}

              {/* Sessions list - collapsible */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full px-3 py-2 flex items-center justify-between text-sm hover:bg-muted/50 border-b border-border">
                    <span className="truncate font-medium">
                      {currentSession?.title || 'Select chat'}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  {sessions.map((session) => (
                    <DropdownMenuItem
                      key={session.id}
                      className="flex items-center justify-between"
                      onClick={() => {
                        selectSession(session.id);
                        setSelectedFile(session.files[0]?.path || null);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{session.title}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                  {sessions.length === 0 && (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No chat sessions yet
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                {!currentSession || currentSession.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 relative">
                      <Brain className="size-8 text-primary" />
                      <div className="absolute -right-1 -bottom-1 size-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Zap className="size-3 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">7-Agent Pipeline</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                      Each AI specialist handles their domain to build production-ready code
                    </p>
                    
                    {/* Agent showcase */}
                    <div className="w-full space-y-2 mb-6">
                      {[
                        { icon: Layers, name: 'Blueprinter', model: 'Gemini 1.5 Pro', color: 'cyan' },
                        { icon: Database, name: 'Data Architect', model: 'Claude 3.5 Sonnet', color: 'purple' },
                        { icon: Palette, name: 'UI Craftsman', model: 'Claude 3.5 Sonnet', color: 'pink' },
                        { icon: Shield, name: 'Guardian', model: 'GPT-4o', color: 'amber' },
                        { icon: Globe, name: 'Scout', model: 'Perplexity', color: 'green' },
                        { icon: CheckCircle2, name: 'Auditor', model: 'OpenAI o1', color: 'emerald' },
                      ].map((agent, i) => (
                        <div 
                          key={agent.name}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs',
                            'opacity-0 animate-fade-in'
                          )}
                          style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                        >
                          <agent.icon className={cn('size-4', `text-${agent.color}-400`)} />
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-muted-foreground ml-auto">{agent.model}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2 w-full">
                      {[
                        'Build a user authentication system',
                        'Create an admin dashboard',
                        'Design an e-commerce product page',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="w-full p-2.5 text-left text-xs rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentSession.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-2',
                          message.role === 'user' && 'flex-row-reverse'
                        )}
                      >
                        <div
                          className={cn(
                            'size-7 rounded-lg flex items-center justify-center shrink-0 text-xs',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : message.agent === 'orchestrator'
                              ? 'bg-gradient-to-br from-cyan-500 to-purple-500'
                              : 'bg-muted'
                          )}
                        >
                          {message.role === 'user' ? 'U' : getAgentIcon(message.agent || 'orchestrator')}
                        </div>
                        <div
                          className={cn(
                            'flex-1 space-y-1.5 max-w-[85%]',
                            message.role === 'user' && 'flex flex-col items-end'
                          )}
                        >
                          {message.agent && (
                            <AgentBadge 
                              agent={message.agent} 
                              showModel={true} 
                              animated={isGenerating && message === currentSession.messages[currentSession.messages.length - 1]}
                            />
                          )}
                          <div
                            className={cn(
                              'p-3 rounded-xl text-sm',
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-xs leading-relaxed">
                              {message.content}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex items-center gap-2 text-muted-foreground p-2 rounded-lg bg-muted/30">
                        <Loader2 className="size-3 animate-spin text-primary" />
                        <span className="text-xs">{PHASE_DESCRIPTIONS[currentPhase] || 'Processing...'}</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input area */}
              <div className="p-3 border-t border-border bg-card/30">
                <form onSubmit={handleSubmit}>
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe your app or ask a question..."
                      className="min-h-[44px] max-h-[120px] pr-12 resize-none text-sm bg-muted/50 border-border focus:border-primary"
                      disabled={isGenerating}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || isGenerating}
                      className="absolute right-2 bottom-2 size-8 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      {isGenerating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Build requests → Full pipeline • Quick questions → Fast Chat (Gemini Flash)
                  </p>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Center: Preview Area */}
        <div className="flex-1 flex flex-col bg-muted/20 min-w-0">
          {/* Preview header */}
          <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/30">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-muted-foreground" />
              <span className="font-medium text-sm">Preview</span>
              {currentSession?.finalCheck?.approved && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                  <CheckCircle2 className="size-3" />
                  Production Ready
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Viewport selector */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => {
                  const Icon = viewportSizes[size].icon;
                  return (
                    <Button
                      key={size}
                      size="icon"
                      variant={viewport === size ? 'secondary' : 'ghost'}
                      className="size-7"
                      onClick={() => setViewport(size)}
                    >
                      <Icon className="size-4" />
                    </Button>
                  );
                })}
              </div>

              {/* Code/Preview toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                <Button
                  size="sm"
                  variant={!showCode ? 'secondary' : 'ghost'}
                  className="h-7 px-3 text-xs"
                  onClick={() => setShowCode(false)}
                >
                  <Eye className="size-3 mr-1.5" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant={showCode ? 'secondary' : 'ghost'}
                  className="h-7 px-3 text-xs"
                  onClick={() => setShowCode(true)}
                >
                  <Code2 className="size-3 mr-1.5" />
                  Code
                </Button>
              </div>

              <Button size="icon" variant="ghost" className="size-7">
                <ExternalLink className="size-4" />
              </Button>
            </div>
          </div>

          {/* Preview content */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            {showCode && currentFile ? (
              <div className="w-full h-full rounded-xl overflow-hidden border border-border bg-[var(--editor-bg)]">
                <Editor
                  height="100%"
                  language={getLanguageFromPath(currentFile.path)}
                  value={currentFile.content}
                  theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, monospace',
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    padding: { top: 16 },
                  }}
                />
              </div>
            ) : (
              <div
                className="preview-frame h-full overflow-hidden border border-border transition-all duration-300"
                style={{
                  width: viewportSizes[viewport].width,
                  maxWidth: '100%',
                }}
              >
                {currentSession?.files.length ? (
                  <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-8">
                    <div className="text-center max-w-md">
                      <div className="size-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                        <CheckCircle2 className="size-10 text-white" />
                      </div>
                      <h3 className="font-semibold text-xl mb-2">
                        {currentSession.files.length} Files Generated
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        Built by {Object.keys(currentSession.manifest?.files || {}).length > 0 ? '7 specialized AI agents' : 'AI agents'} working together
                      </p>
                      
                      {/* Stats */}
                      {currentSession.finalCheck && (
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <div className="p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-primary">
                              {currentSession.finalCheck.overallScore}
                            </div>
                            <div className="text-[10px] text-muted-foreground">Quality Score</div>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-green-400">
                              {currentSession.dataSchema?.tables.length || 0}
                            </div>
                            <div className="text-[10px] text-muted-foreground">DB Tables</div>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-amber-400">
                              {currentSession.securityAudit?.passed ? '✓' : '!'}
                            </div>
                            <div className="text-[10px] text-muted-foreground">Security</div>
                          </div>
                        </div>
                      )}
                      
                      <Button
                        size="lg"
                        onClick={() => setShowCode(true)}
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                      >
                        <Code2 className="size-4 mr-2" />
                        View Generated Code
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8">
                    <div className="size-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                      <Eye className="size-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">Ready to Build</h3>
                    <p className="text-muted-foreground text-sm text-center max-w-xs">
                      Describe what you want to create and our 7-agent pipeline will handle the rest
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Files Panel */}
        <div
          className={cn(
            'border-l border-border bg-card/30 flex flex-col transition-all duration-300',
            filesPanelOpen ? 'w-72' : 'w-0'
          )}
        >
          {filesPanelOpen && (
            <>
              {/* Files header */}
              <div className="h-12 border-b border-border flex items-center justify-between px-3 bg-card/50">
                <div className="flex items-center gap-2">
                  <FolderTree className="size-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Generated Files</span>
                  {currentSession?.files.length && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {currentSession.files.length}
                    </span>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setFilesPanelOpen(false)}
                >
                  <PanelRightClose className="size-4" />
                </Button>
              </div>

              {/* File tree */}
              <ScrollArea className="flex-1 p-2">
                {currentSession?.files.length ? (
                  <div className="space-y-1">
                    {currentSession.files.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => {
                          setSelectedFile(file.path);
                          setShowCode(true);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors',
                          selectedFile === file.path
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        <File className="size-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-xs truncate block">
                            {file.path.split('/').pop()}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block">
                            {file.path.split('/').slice(0, -1).join('/')}
                          </span>
                        </div>
                        {file.status === 'generating' && (
                          <Loader2 className="size-3 animate-spin text-primary" />
                        )}
                        {file.status === 'complete' && (
                          <Check className="size-3 text-green-500" />
                        )}
                        {file.status === 'approved' && (
                          <CheckCircle2 className="size-3 text-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <File className="size-8 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No files generated yet
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Start a conversation to generate code
                    </p>
                  </div>
                )}
              </ScrollArea>

              {/* File actions */}
              {currentFile && (
                <div className="p-3 border-t border-border space-y-2">
                  <div className="text-[10px] text-muted-foreground mb-2">
                    <span className="font-medium">Language:</span> {currentFile.language}
                    <br />
                    <span className="font-medium">Status:</span> {currentFile.status}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={handleCopyCode}
                  >
                    {copied ? (
                      <Check className="size-4 mr-2" />
                    ) : (
                      <Copy className="size-4 mr-2" />
                    )}
                    Copy Code
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Toggle files panel button (when closed) */}
        {!filesPanelOpen && (
          <Button
            size="icon"
            variant="ghost"
            className="fixed right-4 top-1/2 -translate-y-1/2 size-8 z-10"
            onClick={() => setFilesPanelOpen(true)}
          >
            <PanelRightOpen className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
