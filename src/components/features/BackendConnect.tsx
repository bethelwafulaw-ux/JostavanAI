import { useState } from 'react';
import { useProjectStore, BackendConnection } from '@/stores/projectStore';
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
  Database, 
  Check, 
  Loader2, 
  Server,
  Unplug,
  Settings,
  Copy,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const BACKEND_TYPES = [
  {
    id: 'supabase',
    name: 'Supabase',
    icon: '⚡',
    description: 'Open source Firebase alternative',
    fields: ['url', 'apiKey'],
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    icon: '🐘',
    description: 'Direct PostgreSQL connection',
    fields: ['url'],
  },
  {
    id: 'mysql',
    name: 'MySQL',
    icon: '🐬',
    description: 'MySQL database connection',
    fields: ['url'],
  },
  {
    id: 'firebase',
    name: 'Firebase',
    icon: '🔥',
    description: 'Google Firebase backend',
    fields: ['url', 'apiKey'],
  },
] as const;

interface BackendConnectProps {
  className?: string;
}

export function BackendConnect({ className }: BackendConnectProps) {
  const { toast } = useToast();
  const project = useProjectStore(state => state.getCurrentProject());
  const setBackendConnection = useProjectStore(state => state.setBackendConnection);
  const disconnectBackend = useProjectStore(state => state.disconnectBackend);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedType, setSelectedType] = useState<typeof BACKEND_TYPES[number] | null>(null);
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connectionName, setConnectionName] = useState('');
  
  const isConnected = project?.backendConnection?.isConnected;
  
  const handleConnect = async () => {
    if (!selectedType || !url.trim()) return;
    
    setIsConnecting(true);
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const connection: BackendConnection = {
      id: `conn_${Date.now()}`,
      name: connectionName || `${selectedType.name} Connection`,
      type: selectedType.id as BackendConnection['type'],
      url: url.trim(),
      apiKey: apiKey.trim() || undefined,
      isConnected: true,
      connectedAt: new Date().toISOString(),
    };
    
    setBackendConnection(connection);
    
    setIsConnecting(false);
    setIsOpen(false);
    resetForm();
    
    toast({
      title: 'Backend Connected',
      description: `Successfully connected to ${selectedType.name}.`,
    });
  };
  
  const handleDisconnect = () => {
    disconnectBackend();
    toast({
      title: 'Backend Disconnected',
      description: 'Your backend has been disconnected.',
    });
  };
  
  const resetForm = () => {
    setSelectedType(null);
    setUrl('');
    setApiKey('');
    setConnectionName('');
  };
  
  const copyConnectionString = () => {
    if (project?.backendConnection?.url) {
      navigator.clipboard.writeText(project.backendConnection.url);
      toast({
        title: 'Copied',
        description: 'Connection URL copied to clipboard.',
      });
    }
  };
  
  if (!isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className={cn('gap-2', className)}>
            <Database className="size-4" />
            Connect Backend
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="size-5" />
              Connect Your Backend
            </DialogTitle>
            <DialogDescription>
              Connect your database to sync SQL schemas and manage data.
            </DialogDescription>
          </DialogHeader>
          
          {!selectedType ? (
            <div className="grid gap-3 pt-4">
              {BACKEND_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className="flex items-center gap-3 p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all text-left"
                >
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <h4 className="font-medium">{type.name}</h4>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <button
                onClick={() => setSelectedType(null)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back to providers
              </button>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-2xl">{selectedType.icon}</span>
                <div>
                  <h4 className="font-medium">{selectedType.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedType.description}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Connection Name (optional)</label>
                <Input
                  placeholder="My Production DB"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {selectedType.id === 'supabase' ? 'Project URL' : 'Connection URL'}
                </label>
                <Input
                  placeholder={
                    selectedType.id === 'supabase' 
                      ? 'https://xxxx.supabase.co'
                      : 'postgresql://user:pass@host:5432/db'
                  }
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              
              {selectedType.fields.includes('apiKey') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {selectedType.id === 'supabase' ? 'Anon/Public Key' : 'API Key'}
                  </label>
                  <Input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use your public/anon key, never the service role key.
                  </p>
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={handleConnect}
                disabled={!url.trim() || isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 size-4" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }
  
  const backendType = BACKEND_TYPES.find(t => t.id === project?.backendConnection?.type);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)}>
          <span>{backendType?.icon}</span>
          {project?.backendConnection?.name || backendType?.name}
          <Check className="size-3 text-green-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{backendType?.icon}</span>
            <span className="font-medium">{project?.backendConnection?.name}</span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {project?.backendConnection?.url}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-600">Connected</span>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={copyConnectionString}>
          <Copy className="size-4 mr-2" />
          Copy Connection URL
        </DropdownMenuItem>
        
        {project?.backendConnection?.type === 'supabase' && (
          <DropdownMenuItem
            onClick={() => window.open(project?.backendConnection?.url, '_blank')}
          >
            <ExternalLink className="size-4 mr-2" />
            Open Supabase Dashboard
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem>
          <Settings className="size-4 mr-2" />
          Connection Settings
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
          <Unplug className="size-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
