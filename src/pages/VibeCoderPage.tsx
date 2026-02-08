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
import { generateFullWebsite, WebsiteConfig } from '@/lib/website-generator';
import { generatePreviewHTML, createPreviewBlobURL, revokePreviewBlobURL } from '@/lib/preview-renderer';
import { downloadFile, exportProjectAsZip, copyProjectToClipboard } from '@/lib/file-export';
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
  Download,
  Settings,
  FileCode,
  FilePlus,
  FolderPlus,
  Play,
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

// Base project files that are auto-generated
const BASE_PROJECT_FILES = [
  {
    path: 'package.json',
    content: `{
  "name": "my-website",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "lucide-react": "^0.441.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.3",
    "vite": "^5.4.1"
  }
}`,
    language: 'json',
  },
  {
    path: 'vite.config.ts',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});`,
    language: 'typescript',
  },
  {
    path: 'tsconfig.json',
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`,
    language: 'json',
  },
  {
    path: 'tailwind.config.ts',
    content: `import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
      },
    },
  },
  plugins: [],
};

export default config;`,
    language: 'typescript',
  },
  {
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Website</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    language: 'html',
  },
  {
    path: 'src/main.tsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    language: 'typescript',
  },
  {
    path: 'src/index.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}`,
    language: 'css',
  },
  {
    path: 'src/App.tsx',
    content: `import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="text-center p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome</h1>
              <p className="text-gray-600">Your website is ready to be built!</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}`,
    language: 'typescript',
  },
  {
    path: 'src/lib/utils.ts',
    content: `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
    language: 'typescript',
  },
];

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

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const currentProject = getCurrentProject();
  const fileTree = getFileTree();
  const currentFile = currentProject?.files.find((f) => f.path === selectedFilePath);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Initialize project with base files
  const initializeProject = useCallback(async () => {
    if (isInitialized) return;
    
    // Create project if needed
    let projectId = currentProjectId;
    if (!projectId && projects.length === 0) {
      projectId = createProject('My Website', 'AI-generated website project');
    }
    
    // Add base files with animation
    for (const file of BASE_PROJECT_FILES) {
      await new Promise(resolve => setTimeout(resolve, 50));
      addFile(file.path, file.content, file.language);
    }
    
    // Select App.tsx by default
    selectFile('src/App.tsx');
    setIsInitialized(true);
    
    // Add initialization message
    if (!currentSessionId) {
      createSession();
    }
    
    useChatStore.getState().addMessage({
      role: 'assistant',
      content: `🚀 **Project Initialized**

I've set up the base project structure with:
• React 18 + TypeScript + Vite
• Tailwind CSS for styling
• React Router for navigation
• Utility functions

The preview shows a basic welcome page. **Describe what you want to build** and I'll generate the complete website with:
• Frontend components
• SQL database schemas
• Authentication (if needed)
• API integrations

**I can also modify existing code!** Just tell me:
• "Change the button color to blue"
• "Add a new section to the landing page"
• "Fix the navbar styling"

Try: "Build a modern SaaS landing page with pricing and auth"`,
      agent: 'orchestrator',
    });
    
  }, [isInitialized, currentProjectId, projects.length, createProject, addFile, selectFile, currentSessionId, createSession]);

  // Run initialization on mount
  useEffect(() => {
    initializeProject();
  }, [initializeProject]);

  // Update preview when files change
  useEffect(() => {
    const project = getCurrentProject();
    if (!project?.files.length) return;
    
    // Generate preview HTML
    const previewFiles = project.files.map(f => ({
      path: f.path,
      content: f.content,
      language: f.language,
    }));
    
    const html = generatePreviewHTML(previewFiles, projectType);
    
    // Cleanup old blob URL
    if (previewUrl) {
      revokePreviewBlobURL(previewUrl);
    }
    
    // Create new blob URL
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
    
    const lowerPrompt = prompt.toLowerCase();
    const config: WebsiteConfig = {
      name: 'My Website',
      description: prompt.slice(0, 100),
      type: 'landing',
      features: [],
      hasAuth: false,
      hasDatabase: false,
    };
    
    // Detect website type
    if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('admin')) {
      config.type = 'dashboard';
      config.features.push('dashboard');
      setProjectType('dashboard');
    } else if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('shop') || lowerPrompt.includes('store')) {
      config.type = 'ecommerce';
      config.features.push('products', 'cart');
      setProjectType('ecommerce');
    } else if (lowerPrompt.includes('blog')) {
      config.type = 'blog';
      config.features.push('blog');
      setProjectType('blog');
    } else if (lowerPrompt.includes('saas') || lowerPrompt.includes('subscription')) {
      config.type = 'saas';
      config.features.push('dashboard');
      setProjectType('landing');
    } else if (lowerPrompt.includes('portfolio')) {
      config.type = 'portfolio';
      setProjectType('landing');
    } else {
      setProjectType('landing');
    }
    
    // Detect features
    if (lowerPrompt.includes('auth') || lowerPrompt.includes('login') || lowerPrompt.includes('signup') || lowerPrompt.includes('user')) {
      config.hasAuth = true;
      config.hasDatabase = true;
      setProjectType('auth');
    }
    if (lowerPrompt.includes('database') || lowerPrompt.includes('sql') || lowerPrompt.includes('data')) {
      config.hasDatabase = true;
    }
    
    // Generate website
    const { files, sql } = generateFullWebsite(config);
    
    // Add files to project with streaming effect
    for (const file of files) {
      await new Promise(resolve => setTimeout(resolve, 100));
      addFile(file.path, file.content || '', getLanguageFromPath(file.path));
    }
    
    // Set SQL if generated
    if (sql) {
      setCurrentSQL(sql);
    }
    
    // Select first file
    if (files.length > 0) {
      selectFile(files[0].path);
    }
    
    // Switch to preview tab
    setActiveTab('preview');
    
    setIsBuilding(false);
    
    return { files, sql, config };
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
      prompt.toLowerCase().includes('replace');

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

Analyzing your request and preparing the 7-agent pipeline...

• **Blueprinter** → Planning architecture
• **Data Architect** → Designing schemas
• **UI Craftsman** → Building components
• **Guardian** → Security audit
• **Scout** → Checking latest versions
• **Auditor** → Final review

Building your website now...`,
        agent: 'orchestrator',
      });
      
      // Build the website
      const result = await handleBuildWebsite(prompt);
      
      // Add completion message
      useChatStore.getState().addMessage({
        role: 'assistant',
        content: `✅ **Website Build Complete!**

**Generated:**
• ${result.files.length} files created
• ${result.config.type.charAt(0).toUpperCase() + result.config.type.slice(1)} website
${result.config.hasAuth ? '• Authentication system included' : ''}
${result.sql ? `• SQL schema with ${result.sql.match(/CREATE TABLE/gi)?.length || 0} tables` : ''}

**Features:**
${result.config.features.map(f => `• ${f}`).join('\n') || '• Landing page'}

✨ **The preview is now live!** Check the Preview tab to see your website.

You can:
1. Edit files in the code editor
2. Export SQL to run on your backend
3. Push to GitHub
4. **Ask me to modify any code!**

What would you like to modify?`,
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
                      Describe your website and I'll build the complete codebase with SQL schemas
                    </p>
                    
                    <div className="space-y-2 w-full">
                      {[
                        'Build a modern SaaS landing page with auth',
                        'Create an e-commerce store with products',
                        'Make a dashboard with analytics charts',
                        'Change the primary color to purple',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="w-full p-2.5 text-left text-xs rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                          {suggestion.toLowerCase().includes('change') ? (
                            <Edit3 className="size-3 inline mr-2 text-amber-500" />
                          ) : (
                            <Sparkles className="size-3 inline mr-2 text-primary" />
                          )}
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
                      placeholder="Build or modify your website..."
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
                      <Loader2 className="size-8 animate-spin mb-4 text-blue-500" />
                      <h3 className="font-medium text-lg mb-2">Loading Preview...</h3>
                      <p className="text-sm">Generating your website preview</p>
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
                        Select a file from the tree to edit
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="h-full bg-gray-900 p-4 font-mono text-sm text-green-400">
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
                <div className="text-gray-500 border-t border-gray-700 pt-4 mt-4">
                  <p>✓ Preview is running above</p>
                  <p>• Connect your backend to run SQL migrations</p>
                  <p>• Push to GitHub and deploy to production</p>
                  <p>• Or export ZIP and run locally</p>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <span className="animate-pulse">_</span>
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
                  {currentProject?.files.length && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {currentProject.files.length}
                    </span>
                  )}
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
                    <Loader2 className="size-8 text-muted-foreground/50 mb-3 animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Initializing project...
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
