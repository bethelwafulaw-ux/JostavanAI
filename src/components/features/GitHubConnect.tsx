import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Github, 
  Check, 
  Loader2, 
  ExternalLink, 
  GitBranch,
  Upload,
  FolderGit2,
  LogOut,
  Plus,
  Lock,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GitHubConnectProps {
  className?: string;
}

export function GitHubConnect({ className }: GitHubConnectProps) {
  const { toast } = useToast();
  const project = useProjectStore(state => state.getCurrentProject());
  const setGitHubConnection = useProjectStore(state => state.setGitHubConnection);
  const disconnectGitHub = useProjectStore(state => state.disconnectGitHub);
  const setCurrentRepo = useProjectStore(state => state.setCurrentRepo);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [token, setToken] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showNewRepoDialog, setShowNewRepoDialog] = useState(false);
  
  const isConnected = project?.githubConnection?.isConnected;
  
  const handleConnect = async () => {
    if (!token.trim()) return;
    
    setIsConnecting(true);
    
    // Simulate GitHub API connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock repos
    const mockRepos = [
      { name: 'my-website', url: 'https://github.com/user/my-website', isPrivate: false },
      { name: 'dashboard-app', url: 'https://github.com/user/dashboard-app', isPrivate: true },
      { name: 'ecommerce-store', url: 'https://github.com/user/ecommerce-store', isPrivate: false },
    ];
    
    setGitHubConnection({
      username: 'developer',
      accessToken: token,
      isConnected: true,
      connectedAt: new Date().toISOString(),
      repos: mockRepos,
    });
    
    setIsConnecting(false);
    setIsOpen(false);
    setToken('');
    
    toast({
      title: 'GitHub Connected',
      description: 'Successfully connected to your GitHub account.',
    });
  };
  
  const handleDisconnect = () => {
    disconnectGitHub();
    toast({
      title: 'GitHub Disconnected',
      description: 'Your GitHub account has been disconnected.',
    });
  };
  
  const handleSelectRepo = (repoName: string) => {
    setCurrentRepo(repoName);
    toast({
      title: 'Repository Selected',
      description: `Now linked to ${repoName}`,
    });
  };
  
  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) return;
    
    setIsPushing(true);
    
    // Simulate repo creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newRepo = {
      name: newRepoName,
      url: `https://github.com/${project?.githubConnection?.username}/${newRepoName}`,
      isPrivate,
    };
    
    if (project?.githubConnection) {
      setGitHubConnection({
        ...project.githubConnection,
        repos: [...(project.githubConnection.repos || []), newRepo],
      });
    }
    
    setCurrentRepo(newRepoName);
    setIsPushing(false);
    setShowNewRepoDialog(false);
    setNewRepoName('');
    
    toast({
      title: 'Repository Created',
      description: `Successfully created and pushed to ${newRepoName}`,
    });
  };
  
  const handlePushToRepo = async () => {
    if (!project?.currentRepo) {
      toast({
        title: 'No Repository Selected',
        description: 'Please select a repository first.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsPushing(true);
    
    // Simulate push
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsPushing(false);
    
    toast({
      title: 'Pushed to GitHub',
      description: `Code pushed to ${project.currentRepo}`,
    });
  };
  
  if (!isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className={cn('gap-2', className)}>
            <Github className="size-4" />
            Connect GitHub
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="size-5" />
              Connect to GitHub
            </DialogTitle>
            <DialogDescription>
              Connect your GitHub account to push and sync your code.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Personal Access Token</label>
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Create a token with <code className="bg-muted px-1 rounded">repo</code> scope at{' '}
                <a 
                  href="https://github.com/settings/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub Settings
                </a>
              </p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleConnect}
              disabled={!token.trim() || isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Github className="mr-2 size-4" />
                  Connect GitHub
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Github className="size-4" />
            {project?.currentRepo || 'Select Repo'}
            <Check className="size-3 text-green-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Connected as @{project?.githubConnection?.username}
          </div>
          <DropdownMenuSeparator />
          
          {project?.githubConnection?.repos?.map((repo) => (
            <DropdownMenuItem
              key={repo.name}
              onClick={() => handleSelectRepo(repo.name)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FolderGit2 className="size-4" />
                <span>{repo.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {repo.isPrivate ? (
                  <Lock className="size-3 text-muted-foreground" />
                ) : (
                  <Globe className="size-3 text-muted-foreground" />
                )}
                {project?.currentRepo === repo.name && (
                  <Check className="size-3 text-green-500" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowNewRepoDialog(true)}>
            <Plus className="size-4 mr-2" />
            Create New Repository
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => window.open(`https://github.com/${project?.githubConnection?.username}`, '_blank')}
          >
            <ExternalLink className="size-4 mr-2" />
            View on GitHub
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
            <LogOut className="size-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button 
        size="sm" 
        onClick={handlePushToRepo}
        disabled={isPushing || !project?.currentRepo}
        className="gap-2"
      >
        {isPushing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Pushing...
          </>
        ) : (
          <>
            <Upload className="size-4" />
            Push
          </>
        )}
      </Button>
      
      {/* New Repo Dialog */}
      <Dialog open={showNewRepoDialog} onOpenChange={setShowNewRepoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="size-5" />
              Create New Repository
            </DialogTitle>
            <DialogDescription>
              Create a new GitHub repository and push your code.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Repository Name</label>
              <Input
                placeholder="my-awesome-project"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value.replace(/\s+/g, '-').toLowerCase())}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="private" className="text-sm flex items-center gap-2">
                <Lock className="size-4" />
                Make repository private
              </label>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleCreateRepo}
              disabled={!newRepoName.trim() || isPushing}
            >
              {isPushing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating & Pushing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Create & Push
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
