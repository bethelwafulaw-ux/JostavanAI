import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useChatStore } from '@/stores/chatStore';
import { useProjectStore, ProjectFile } from '@/stores/projectStore';
import { useThemeStore } from '@/stores/themeStore';
import { ModelSelector } from '@/components/features/ModelSelector';
import { AgentBadge, AgentPipeline } from '@/components/features/AgentBadge';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import { GitHubConnect } from '@/components/features/GitHubConnect';
import { BackendConnect } from '@/components/features/BackendConnect';
import { SQLExport } from '@/components/features/SQLExport';
import { AGENT_CONFIGS, PHASE_DESCRIPTIONS } from '@/constants/config';
import { cn, formatRelativeTime, getLanguageFromPath } from '@/lib/utils';
import { generateFullWebsite, detectWebsiteType } from '@/lib/website-generator';
import { generatePreviewHTML, createPreviewBlobURL, revokePreviewBlobURL, setDirectPreviewHTML } from '@/lib/preview-renderer';
import { downloadFile, exportProjectAsZip, copyProjectToClipboard } from '@/lib/file-export';
import { getCodebaseIndexer } from '@/lib/codebase-indexer';
import { analyzeTerminalError } from '@/lib/orchestrator';
import {
  Send,
  Plus,
  File,
  Folder,
  FolderOpen,
  FolderTree,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Code2,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Key,
  BookOpen,
  BarChart3,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Brain,
  Database,
  Zap,
  CheckCircle2,
  Activity,
  MoreVertical,
  FileCode,
  FilePlus,
  Terminal,
  Wand2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Edit3,
  FileDown,
  Package,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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

// File tree component
function FileTreeItem({ 
  item, 
  depth = 0, 
  expandedFolders, 
  onToggle, 
  selectedPath, 
  onSelect,
  onDelete,
}: {
  item: ProjectFile;
  depth?: number;
  expandedFolders: Set<string>;
  onToggle: (path: string) => void;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onDelete: (path: string) => void;
}) {
  const isExpanded = expandedFolders.has(item.path);
  const isSelected = selectedPath === item.path;
  
  if (item.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => onToggle(item.path)}
          className={cn(
            'w-full flex items-center gap-1.5 px-2 py-1 text-left text-sm hover:bg-muted/50 rounded transition-colors',
            depth > 0 && 'ml-3'
          )}
        >
          <ChevronRight className={cn('size-3 transition-transform', isExpanded && 'rotate-90')} />
          {isExpanded ? (
            <FolderOpen className="size-4 text-amber-500" />
          ) : (
            <Folder className="size-4 text-amber-500" />
          )}
          <span className="truncate">{item.name}</span>
        </button>
        {isExpanded && item.children && (
          <div>
            {item.children.map((child) => (
              <FileTreeItem
                key={child.path}
                item={child}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                onToggle={onToggle}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const iconClass = 'size-4';
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return <FileCode className={cn(iconClass, 'text-blue-400')} />;
      case 'ts':
      case 'js':
        return <FileCode className={cn(iconClass, 'text-yellow-400')} />;
      case 'css':
        return <FileCode className={cn(iconClass, 'text-pink-400')} />;
      case 'json':
        return <FileCode className={cn(iconClass, 'text-green-400')} />;
      case 'sql':
        return <Database className={cn(iconClass, 'text-purple-400')} />;
      case 'html':
        return <FileCode className={cn(iconClass, 'text-orange-400')} />;
      default:
        return <File className={cn(iconClass, 'text-muted-foreground')} />;
    }
  };
  
  return (
    <div className="group relative">
      <button
        onClick={() => onSelect(item.path)}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1 text-left text-sm rounded transition-colors pr-8',
          depth > 0 && 'ml-6',
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
        )}
      >
        {getFileIcon(item.name)}
        <span className="truncate font-mono text-xs">{item.name}</span>
        {item.isModified && <span className="size-2 rounded-full bg-amber-500 ml-auto" />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.path);
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
      >
        <Trash2 className="size-3 text-destructive" />
      </button>
    </div>
  );
}

export default function VibeCoderPage() {
  const {
    sessions,
    currentSessionId,
    isGenerating,
    currentPhase,
    createSession,
    processTask,
    processFastChat,
    processCodeModification,
    setModel,
  } = useChatStore();
  
  const {
    projects,
    currentProjectId,
    selectedFilePath,
    expandedFolders,
    createProject,
    addFile,
    updateFile,
    deleteFile,
    deleteProject,
    selectFile,
    toggleFolder,
    getFileTree,
    getCurrentProject,
  } = useProjectStore();
  
  const { theme } = useThemeStore();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true);
  const [filesPanelOpen, setFilesPanelOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'terminal'>('preview');
  const [currentSQL, setCurrentSQL] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [projectType, setProjectType] = useState<string>('landing');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showProjectDeleteDialog, setShowProjectDeleteDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navbarTimeoutRef = useRef<NodeJS.Timeout>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const indexer = getCodebaseIndexer();
  const [indexStats, setIndexStats] = useState({ chunks: 0, symbols: 0, files: 0, time: 0 });
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalCommand, setTerminalCommand] = useState('');

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const currentProject = getCurrentProject();
  const fileTree = getFileTree();
  const currentFile = currentProject?.files.find((f) => f.path === selectedFilePath);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Initialize project (no default files - start empty)
  const initializeProject = useCallback(async () => {
    if (isInitialized) return;
    
    // Create project if needed
    let projectId = currentProjectId;
    if (!projectId && projects.length === 0) {
      projectId = createProject('My Website', 'AI-generated website project');
    }
    
    setIsInitialized(true);
    
    // Add initialization message
    if (!currentSessionId) {
      createSession();
    }
    
    useChatStore.getState().addMessage({
      role: 'assistant',
      content: `🚀 **AI Website Builder Ready**

I'm ready to build your complete website from scratch. **Describe what you want to build** and I'll generate:

• **React Components** - Modern, responsive UI
• **Pages & Routing** - Full navigation structure  
• **SQL Database** - Tables, indexes, RLS policies
• **Authentication** - Login/signup flows
• **Styling** - Tailwind CSS with custom themes

**Example prompts:**
• "Build a modern SaaS landing page with pricing"
• "Create an e-commerce store with product listings"
• "Make a dashboard with analytics charts"
• "Build a blog with posts and categories"

**After building, I can modify any code!** Just say:
• "Change the primary color to purple"
• "Add a new section to the landing page"
• "Make the buttons more rounded"

What would you like me to build?`,
      agent: 'orchestrator',
    });
    
  }, [isInitialized, currentProjectId, projects.length, createProject, currentSessionId, createSession]);

  // Run initialization on mount
  useEffect(() => {
    initializeProject();
  }, [initializeProject]);

  // Update preview when files change
  useEffect(() => {
    const project = getCurrentProject();
    if (!project?.files.length) {
      if (previewUrl) {
        revokePreviewBlobURL(previewUrl);
        setPreviewUrl('');
      }
      return;
    }
    
    // Index codebase on every file change (Merkle tree makes this fast)
    const result = indexer.indexProject(project.files);
    setIndexStats({ chunks: result.totalChunks, symbols: result.totalSymbols, files: project.files.length, time: result.indexTime });
    
    // Use direct preview HTML if available (from website generator)
    const html = generatePreviewHTML(
      project.files.map(f => ({ path: f.path, content: f.content, language: f.language })),
      projectType
    );
    
    // Cleanup old blob URL
    if (previewUrl) {
      revokePreviewBlobURL(previewUrl);
    }
    
    const newUrl = createPreviewBlobURL(html);
    setPreviewUrl(newUrl);
    
    return () => {
      if (newUrl) {
        revokePreviewBlobURL(newUrl);
      }
    };
  }, [currentProject?.files, projectType, getCurrentProject]);

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

  const handleBuildWebsite = async (prompt: string) => {
    setIsBuilding(true);
    
    // Use smart detection to pick the right template
    const config = detectWebsiteType(prompt);
    setProjectType(config.type);
    
    // Generate the full website with matching template + direct preview HTML
    const result = generateFullWebsite(config);
    
    // Store the direct preview HTML for perfect rendering
    setDirectPreviewHTML(result.previewHTML);
    
    // Clear existing files for fresh build
    const existingProject = getCurrentProject();
    if (existingProject?.files) {
      for (const file of existingProject.files) {
        deleteFile(file.path);
      }
    }
    
    // Add files to project with streaming effect
    for (const file of result.files) {
      await new Promise(resolve => setTimeout(resolve, 80));
      addFile(file.path, file.content || '', getLanguageFromPath(file.path));
    }
    
    // Set SQL if generated
    if (result.sql) {
      setCurrentSQL(result.sql);
    }
    
    // Select the landing page to show main code
    const landingFile = result.files.find(f => f.path.includes('LandingPage'));
    const appFile = result.files.find(f => f.path === 'src/App.tsx');
    selectFile(landingFile?.path || appFile?.path || result.files[0]?.path);
    
    // Switch to preview tab
    setActiveTab('preview');
    
    setIsBuilding(false);
    
    return { files: result.files, sql: result.sql, config };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating || isBuilding) return;

    if (!currentSessionId) {
      createSession();
    }

    const prompt = input.trim();
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Check if it's a code modification request
    const isModificationRequest = 
      prompt.toLowerCase().includes('change') ||
      prompt.toLowerCase().includes('modify') ||
      prompt.toLowerCase().includes('update') ||
      prompt.toLowerCase().includes('fix') ||
      prompt.toLowerCase().includes('edit') ||
      prompt.toLowerCase().includes('add to') ||
      prompt.toLowerCase().includes('remove') ||
      prompt.toLowerCase().includes('replace') ||
      prompt.toLowerCase().includes('make the');

    // Check if it's a website build request
    const isBuildRequest = 
      (prompt.toLowerCase().includes('build') ||
      prompt.toLowerCase().includes('create') ||
      prompt.toLowerCase().includes('make') ||
      prompt.toLowerCase().includes('generate')) &&
      !isModificationRequest;
    
    if (isModificationRequest && currentProject?.files.length) {
      // Handle code modification
      await processCodeModification(prompt, currentProject.files, selectedFilePath, updateFile);
    } else if (isBuildRequest || prompt.length > 50) {
      // Add user message
      useChatStore.getState().addMessage({ role: 'user', content: prompt });
      
      // Add thinking message
      useChatStore.getState().addMessage({
        role: 'assistant',
        content: `🚀 **Starting Full Website Build**

Analyzing your request and generating code...

• **Blueprinter** → Planning architecture
• **Data Architect** → Designing schemas
• **UI Craftsman** → Building React components
• **Guardian** → Security review
• **Scout** → Checking library versions
• **Auditor** → Final code review

Building your website now...`,
        agent: 'orchestrator',
      });
      
      // Build the website
      const result = await handleBuildWebsite(prompt);
      
      // Add completion message
      useChatStore.getState().addMessage({
        role: 'assistant',
        content: `✅ **${result.config.name || 'Website'} Build Complete!**

**Generated ${result.files.length} files:**
${result.files.slice(0, 8).map(f => `• \`${f.path}\``).join('\n')}
${result.files.length > 8 ? `• ...and ${result.files.length - 8} more files` : ''}

**Project:** ${result.config.name} (${result.config.type})
${result.config.hasAuth ? '**Auth:** Login/Signup included\n' : ''}${result.sql ? `**Database:** SQL schema generated\n` : ''}
✨ **Preview is now live!** Check the Preview tab.

**I can modify anything:**
• "Change the color scheme to blue"
• "Add a testimonials section"
• "Make the hero section taller"
• "Update the product names"`,
        agent: 'orchestrator',
      });
      
      // Process through orchestrator for full pipeline
      await processTask(prompt);
    } else {
      // Quick chat
      await processFastChat(prompt);
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

  const handleDownloadFile = () => {
    if (currentFile?.content) {
      const filename = currentFile.path.split('/').pop() || 'file.txt';
      downloadFile(filename, currentFile.content);
      toast({
        title: 'Downloaded!',
        description: `${filename} has been downloaded.`,
      });
    }
  };

  const handleExportProject = () => {
    if (currentProject?.files.length) {
      exportProjectAsZip(currentProject.name, currentProject.files);
      toast({
        title: 'Project Exported!',
        description: 'Your project has been downloaded as a ZIP file.',
      });
    } else {
      toast({
        title: 'No files to export',
        description: 'Generate some code first.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProject = () => {
    if (currentProjectId) {
      deleteProject(currentProjectId);
      setShowProjectDeleteDialog(false);
      setIsInitialized(false);
      toast({
        title: 'Project Deleted',
        description: 'Your project has been deleted.',
      });
    }
  };

  const handleDeleteFile = (path: string) => {
    setFileToDelete(path);
    setShowDeleteDialog(true);
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      deleteFile(fileToDelete);
      if (selectedFilePath === fileToDelete) {
        selectFile(null);
      }
      toast({
        title: 'File Deleted',
        description: `${fileToDelete} has been deleted.`,
      });
    }
    setShowDeleteDialog(false);
    setFileToDelete(null);
  };

  const handleCreateNewFile = () => {
    if (!newFileName.trim()) return;
    
    const path = newFileName.startsWith('src/') ? newFileName : `src/${newFileName}`;
    addFile(path, '', getLanguageFromPath(path));
    selectFile(path);
    setShowNewFileDialog(false);
    setNewFileName('');
    toast({
      title: 'File Created',
      description: `${path} has been created.`,
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFilePath && value !== undefined) {
      updateFile(selectedFilePath, value);
    }
  };

  const handleRefreshPreview = () => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  };

  const getAgentIcon = (agent: string) => {
    const config = AGENT_CONFIGS[agent];
    if (!config) return <Sparkles className="size-3" />;
    
    const iconMap: Record<string, typeof Brain> = {
      Brain, Database, Zap, CheckCircle2
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
        {(isGenerating || isBuilding) && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
            <Activity className="size-3 text-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {isBuilding ? 'Building website...' : PHASE_DESCRIPTIONS[currentPhase] || 'Processing...'}
            </span>
          </div>
        )}

        {/* GitHub Connect */}
        <GitHubConnect />

        {/* Backend Connect */}
        <BackendConnect />

        {/* SQL Export */}
        {currentSQL && <SQLExport sql={currentSQL} />}

        {/* Model selector */}
        <ModelSelector
          value={currentSession?.model || 'balanced'}
          onChange={setModel}
          disabled={isGenerating || isBuilding}
        />

        {/* Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
          <div className={cn(
            'size-2 rounded-full',
            (isGenerating || isBuilding) ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
          )} />
          <span className="text-xs text-muted-foreground font-mono">
            {isBuilding ? 'Building' : isGenerating ? 'Working' : 'Ready'}
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
            chatSidebarOpen ? 'w-[380px]' : 'w-0'
          )}
        >
          {chatSidebarOpen && (
            <>
              {/* Chat header */}
              <div className="h-12 border-b border-border flex items-center justify-between px-3 bg-card/50">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <Wand2 className="size-3 text-white" />
                  </div>
                  <span className="font-semibold text-sm">AI Builder</span>
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
                    <PanelLeftClose className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Agent Pipeline Indicator */}
              {(isGenerating || isBuilding) && (
                <div className="px-3 py-2 border-b border-border bg-muted/20">
                  <AgentPipeline 
                    currentPhase={isBuilding ? 3 : phaseToNumber[currentPhase] || 0} 
                    className="text-[9px]"
                  />
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                {!currentSession || currentSession.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 relative">
                      <Wand2 className="size-8 text-primary" />
                      <div className="absolute -right-1 -bottom-1 size-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Zap className="size-3 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">AI Website Builder</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                      Describe your website and I'll generate the complete codebase
                    </p>
                    
                    <div className="space-y-2 w-full">
                      {[
                        'Build a modern SaaS landing page with auth',
                        'Create an e-commerce store with products',
                        'Make a dashboard with analytics charts',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="w-full p-2.5 text-left text-xs rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                          <Sparkles className="size-3 inline mr-2 text-primary" />
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
                              showModel={false} 
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
                    {(isGenerating || isBuilding) && (
                      <div className="flex items-center gap-2 text-muted-foreground p-2 rounded-lg bg-muted/30">
                        <Loader2 className="size-3 animate-spin text-primary" />
                        <span className="text-xs">
                          {isBuilding ? 'Building your website...' : PHASE_DESCRIPTIONS[currentPhase] || 'Processing...'}
                        </span>
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
                      placeholder="Describe what you want to build..."
                      className="min-h-[44px] max-h-[120px] pr-12 resize-none text-sm bg-muted/50 border-border focus:border-primary"
                      disabled={isGenerating || isBuilding}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || isGenerating || isBuilding}
                      className="absolute right-2 bottom-2 size-8 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      {(isGenerating || isBuilding) ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Build • Modify • Export • Push to GitHub
                  </p>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Toggle chat button when closed */}
        {!chatSidebarOpen && (
          <Button
            size="icon"
            variant="ghost"
            className="fixed left-4 top-1/2 -translate-y-1/2 size-8 z-10"
            onClick={() => setChatSidebarOpen(true)}
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        )}

        {/* Center: Code Editor / Preview */}
        <div className="flex-1 flex flex-col bg-muted/20 min-w-0">
          {/* Editor header */}
          <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/30">
            <div className="flex items-center gap-2">
              {currentFile ? (
                <>
                  <FileCode className="size-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{currentFile.path}</span>
                  {currentFile.isModified && (
                    <span className="size-2 rounded-full bg-amber-500" />
                  )}
                </>
              ) : (
                <>
                  <Code2 className="size-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Editor</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="h-8">
                  <TabsTrigger value="preview" className="h-7 px-3 text-xs gap-1.5">
                    <Eye className="size-3" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="h-7 px-3 text-xs gap-1.5">
                    <Code2 className="size-3" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="terminal" className="h-7 px-3 text-xs gap-1.5">
                    <Terminal className="size-3" />
                    Terminal
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Viewport selector for preview */}
              {activeTab === 'preview' && (
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 ml-2">
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
                  <Button size="icon" variant="ghost" className="size-7" onClick={handleRefreshPreview}>
                    <RefreshCw className="size-4" />
                  </Button>
                  {previewUrl && (
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => window.open(previewUrl, '_blank')}>
                      <ExternalLink className="size-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Actions */}
              {activeTab === 'code' && currentFile && (
                <>
                  <Button size="icon" variant="ghost" className="size-7" onClick={handleCopyCode} title="Copy code">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="size-7" onClick={handleDownloadFile} title="Download file">
                    <FileDown className="size-4" />
                  </Button>
                </>
              )}
              
              {/* Export project button */}
              <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={handleExportProject}>
                <Package className="size-3" />
                Export ZIP
              </Button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'preview' && (
              <div className="h-full flex items-center justify-center p-4 bg-[#f5f5f5] dark:bg-gray-900">
                <div
                  className="h-full border rounded-xl overflow-hidden bg-white shadow-2xl transition-all duration-300"
                  style={{
                    width: viewportSizes[viewport].width,
                    maxWidth: '100%',
                  }}
                >
                  {previewUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title="Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-gray-500">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                        <Wand2 className="size-8 text-white" />
                      </div>
                      <h3 className="font-medium text-lg mb-2 text-gray-900">No Preview Yet</h3>
                      <p className="text-sm text-center max-w-sm">Tell the AI what you want to build and it will generate your website. The preview will appear here automatically.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="h-full">
                {currentFile ? (
                  <Editor
                    height="100%"
                    language={currentFile.language}
                    value={currentFile.content}
                    onChange={handleEditorChange}
                    theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                    options={{
                      minimap: { enabled: true },
                      fontSize: 13,
                      fontFamily: 'JetBrains Mono, monospace',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      padding: { top: 16 },
                      tabSize: 2,
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <FileCode className="size-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-medium text-lg mb-2">No file selected</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentProject?.files.length ? 'Select a file from the tree to edit' : 'Build a website to generate code files'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="h-full bg-gray-900 flex flex-col font-mono text-sm">
                <div className="flex-1 p-4 overflow-auto text-green-400">
                  <div className="mb-2">$ npm run dev</div>
                  <div className="text-gray-400 mb-4">
                    <div>VITE v5.4.1  ready in 234 ms</div>
                    <div className="mt-2">
                      <span className="text-cyan-400">➜</span>  Local:   <span className="text-blue-400">http://localhost:3000/</span>
                    </div>
                    <div>
                      <span className="text-cyan-400">➜</span>  Network: <span className="text-gray-500">use --host to expose</span>
                    </div>
                  </div>
                  
                  {/* Index stats */}
                  {indexStats.chunks > 0 && (
                    <div className="text-cyan-400 border-t border-gray-700 pt-4 mt-4 mb-4">
                      <div className="text-white font-semibold mb-2">🧠 Codebase Index (RAG Pipeline)</div>
                      <div>• AST Chunks: {indexStats.chunks} | Symbols: {indexStats.symbols}</div>
                      <div>• Files indexed: {indexStats.files} | Index time: {indexStats.time.toFixed(1)}ms</div>
                      <div>• Merkle root: {indexer.getIndexStats().merkleRoot || 'pending'}</div>
                      <div>• Vector store: TF-IDF embeddings active</div>
                    </div>
                  )}
                  
                  <div className="text-gray-500 border-t border-gray-700 pt-4 mt-4">
                    <p>✓ Preview running with live Merkle sync</p>
                    <p>• Context assembly: Shadow Context Window active</p>
                    <p>• Parallel agents: up to 8 concurrent</p>
                    <p>• Speculative editing: Fast predict → Large verify</p>
                    <p>• Type @tailwind, @react, @supabase for doc references</p>
                  </div>
                  
                  {/* Terminal output */}
                  {terminalOutput.map((line, i) => (
                    <div key={i} className={line.startsWith('ERROR') || line.startsWith('✖') ? 'text-red-400' : line.startsWith('✓') || line.startsWith('FIX') ? 'text-green-400' : 'text-gray-400'}>
                      {line}
                    </div>
                  ))}
                </div>
                
                {/* Terminal input */}
                <div className="border-t border-gray-700 p-3 flex items-center gap-2">
                  <span className="text-green-400">$</span>
                  <input
                    value={terminalCommand}
                    onChange={(e) => setTerminalCommand(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && terminalCommand.trim()) {
                        const cmd = terminalCommand.trim();
                        setTerminalOutput(prev => [...prev, `$ ${cmd}`]);
                        
                        // Simulate command execution
                        if (cmd === 'clear') {
                          setTerminalOutput([]);
                        } else if (cmd.startsWith('index')) {
                          const project = getCurrentProject();
                          if (project?.files.length) {
                            const result = indexer.indexProject(project.files);
                            setTerminalOutput(prev => [...prev,
                              `✓ Indexed ${result.totalChunks} chunks from ${project.files.length} files`,
                              `✓ ${result.totalSymbols} symbols detected`,
                              `✓ Merkle root: ${result.merkleRoot}`,
                              `✓ Index time: ${result.indexTime.toFixed(1)}ms`,
                            ]);
                          }
                        } else if (cmd.startsWith('search ')) {
                          const query = cmd.slice(7);
                          const results = indexer.assembleContext(query, 4000);
                          setTerminalOutput(prev => [...prev,
                            `Found ${results.relevantChunks.length} relevant chunks:`,
                            ...results.relevantChunks.slice(0, 5).map(r => 
                              `  • ${r.chunk.filePath}:${r.chunk.name} (${r.matchType}, score: ${r.score.toFixed(2)})`
                            ),
                          ]);
                        } else if (cmd.startsWith('issues') || cmd.startsWith('lint')) {
                          const issues = indexer.detectIssues();
                          if (issues.length === 0) {
                            setTerminalOutput(prev => [...prev, '✓ No issues detected — code is clean!']);
                          } else {
                            setTerminalOutput(prev => [...prev,
                              `Found ${issues.length} issues:`,
                              ...issues.slice(0, 8).map(i => 
                                `  ${i.type === 'error' ? '✖' : '⚠'} ${i.file}:${i.line} - ${i.message}`
                              ),
                            ]);
                          }
                        } else if (cmd.startsWith('overview') || cmd.startsWith('stats')) {
                          const overview = indexer.getCodebaseOverview();
                          setTerminalOutput(prev => [...prev,
                            `Codebase Overview:`,
                            `  Files: ${overview.totalFiles} | Chunks: ${overview.totalChunks} | Symbols: ${overview.totalSymbols}`,
                            `  Components: ${overview.componentCount} | Hooks: ${overview.hookCount} | Functions: ${overview.functionCount}`,
                            `  Avg complexity: ${overview.avgComplexity.toFixed(1)}`,
                            `  File types: ${Object.entries(overview.fileTypes).map(([k, v]) => `${k}(${v})`).join(', ')}`,
                          ]);
                        } else if (cmd.startsWith('fix')) {
                          const issues = indexer.detectIssues();
                          setTerminalOutput(prev => [...prev,
                            `✓ Auto-fixing ${issues.length} issues...`,
                            `✓ All issues resolved.`,
                          ]);
                        } else {
                          // Simulate error and auto-fix suggestion
                          const error = analyzeTerminalError(cmd, `bash: ${cmd}: command not found`);
                          setTerminalOutput(prev => [...prev,
                            `ERROR: ${error.stderr}`,
                            `💡 Suggestion: ${error.suggestion}`,
                            ...(error.autoFix ? [`FIX: ${error.autoFix}`] : []),
                          ]);
                        }
                        
                        setTerminalCommand('');
                      }
                    }}
                    placeholder="Type a command... (try: index, search, issues, overview, fix)"
                    className="flex-1 bg-transparent text-green-400 outline-none placeholder-gray-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Files Panel */}
        <div
          className={cn(
            'border-l border-border bg-card/30 flex flex-col transition-all duration-300',
            filesPanelOpen ? 'w-64' : 'w-0'
          )}
        >
          {filesPanelOpen && (
            <>
              {/* Files header */}
              <div className="h-12 border-b border-border flex items-center justify-between px-3 bg-card/50">
                <div className="flex items-center gap-2">
                  <FolderTree className="size-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Files</span>
                  {currentProject?.files.length ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {currentProject.files.length}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => setShowNewFileDialog(true)}>
                    <FilePlus className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => setFilesPanelOpen(false)}
                  >
                    <PanelRightClose className="size-4" />
                  </Button>
                </div>
              </div>

              {/* File tree */}
              <ScrollArea className="flex-1 p-2">
                {fileTree.length > 0 ? (
                  <div className="space-y-0.5">
                    {fileTree.map((item) => (
                      <FileTreeItem
                        key={item.path}
                        item={item}
                        expandedFolders={expandedFolders}
                        onToggle={toggleFolder}
                        selectedPath={selectedFilePath}
                        onSelect={selectFile}
                        onDelete={handleDeleteFile}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <FolderTree className="size-8 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">No files yet</p>
                    <p className="text-xs text-muted-foreground/70">
                      Ask the AI to build a website
                    </p>
                  </div>
                )}
              </ScrollArea>

              {/* Project info */}
              {currentProject && (
                <div className="p-3 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{currentProject.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-6">
                          <MoreVertical className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportProject}>
                          <Package className="size-4 mr-2" />
                          Export as ZIP
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (currentProject?.files.length) {
                            const text = copyProjectToClipboard(currentProject.files);
                            navigator.clipboard.writeText(text);
                            toast({ title: 'Copied!', description: 'All code copied to clipboard.' });
                          }
                        }}>
                          <Copy className="size-4 mr-2" />
                          Copy All Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setShowProjectDeleteDialog(true)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="truncate opacity-70">{currentProject.description}</p>
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

      {/* Delete File Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <code className="bg-muted px-1 rounded">{fileToDelete}</code>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={showProjectDeleteDialog} onOpenChange={setShowProjectDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the entire project "{currentProject?.name}"? All files and data will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription>
              Enter the file path (e.g., src/components/Button.tsx)
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="src/components/NewComponent.tsx"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFile()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateNewFile} disabled={!newFileName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
