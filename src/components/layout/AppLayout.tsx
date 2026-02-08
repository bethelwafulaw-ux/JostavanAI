import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Key, 
  Terminal, 
  BookOpen, 
  BarChart3,
  Menu,
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import { useAppStore } from '@/stores/appStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/vibecoder', label: 'VibeCoder', icon: Terminal },
  { path: '/docs', label: 'Documentation', icon: BookOpen },
  { path: '/usage', label: 'Usage', icon: BarChart3 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, user } = useAppStore();
  
  // Check if we're on VibeCoder page - it has its own layout
  const isVibeCoderPage = location.pathname === '/vibecoder';
  
  if (isVibeCoderPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative z-40 h-full transition-all duration-300 ease-out',
          'bg-card border-r border-border',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative size-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center glow-cyan">
              <Sparkles className="size-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gradient">Jostavan</span>
                <span className="text-[10px] text-muted-foreground -mt-1">AI Platform</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-muted/50 group relative',
                  isActive && 'bg-muted text-primary'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <Icon className={cn(
                  'size-5 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )} />
                {sidebarOpen && (
                  <>
                    <span className={cn(
                      'font-medium',
                      isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <ChevronRight className="size-4 ml-auto text-primary" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        {sidebarOpen && user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="size-9 rounded-full ring-2 ring-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center px-4 lg:px-6 gap-4 bg-card/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0"
          >
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">All systems operational</span>
          </div>
          
          <ThemeToggle />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {children}
        </div>
      </main>
    </div>
  );
}
