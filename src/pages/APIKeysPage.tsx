import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { GlowCard } from '@/components/features/GlowCard';
import { formatDate, formatRelativeTime, maskAPIKey } from '@/lib/utils';
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function APIKeysPage() {
  const { apiKeys, createAPIKey, revokeAPIKey, deleteAPIKey } = useAppStore();
  const { toast } = useToast();
  
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter a name for your API key.',
      });
      return;
    }

    const { fullKey } = createAPIKey(newKeyName.trim());
    setCreatedKey(fullKey);
    setNewKeyName('');
    
    toast({
      title: 'API Key Created',
      description: 'Your new API key has been generated. Copy it now!',
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard.',
    });
  };

  const handleRevokeKey = (id: string) => {
    revokeAPIKey(id);
    toast({
      title: 'Key Revoked',
      description: 'The API key has been revoked and can no longer be used.',
    });
  };

  const handleDeleteKey = (id: string) => {
    deleteAPIKey(id);
    toast({
      title: 'Key Deleted',
      description: 'The API key has been permanently deleted.',
    });
  };

  const activeKeys = apiKeys.filter((k) => k.status === 'active');
  const revokedKeys = apiKeys.filter((k) => k.status === 'revoked');

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-radial min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys for accessing the Jostavan Agentic API
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCreatedKey(null);
            setNewKeyName('');
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 glow-cyan">
              <Plus className="size-4 mr-2" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                {createdKey 
                  ? 'Your API key has been created. Copy it now - you won\'t be able to see it again!'
                  : 'Give your API key a name to help you identify it later.'}
              </DialogDescription>
            </DialogHeader>
            
            {!createdKey ? (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., Production Key, Development Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateKey}>
                    Create Key
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="py-4">
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="size-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-500">Save your key now!</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This is the only time you'll see this key. Store it securely.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="p-4 rounded-lg bg-muted font-mono text-sm break-all">
                    {createdKey}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyKey(createdKey)}
                  >
                    {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                
                <DialogFooter className="mt-6">
                  <Button onClick={() => setIsCreateOpen(false)} className="w-full">
                    Done
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Info banner */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-start gap-3">
          <Shield className="size-5 text-cyan-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">API Key Security</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your API keys are stored as secure hashes. We never display the full key after creation.
              Include your key in requests using the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Authorization: Bearer sk-jostavan-...</code> header.
            </p>
          </div>
        </div>
      </div>

      {/* Active keys */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500" />
          Active Keys ({activeKeys.length})
        </h2>
        
        {activeKeys.length === 0 ? (
          <GlowCard>
            <div className="p-12 text-center">
              <Key className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active keys</h3>
              <p className="text-muted-foreground mb-6">
                Create your first API key to start using the Jostavan Agentic API
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="size-4 mr-2" />
                Create API Key
              </Button>
            </div>
          </GlowCard>
        ) : (
          <div className="space-y-3">
            {activeKeys.map((key) => (
              <GlowCard key={key.id} hover={false}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="size-4 text-cyan-500" />
                      <span className="font-semibold">{key.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-muted-foreground font-mono">
                        {showKey === key.id ? key.keyPrefix + '••••••••••••' : maskAPIKey(key.keyPrefix)}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6"
                        onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                      >
                        {showKey === key.id ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Created {formatDate(key.createdAt)}</span>
                      {key.lastUsed && <span>Last used {formatRelativeTime(key.lastUsed)}</span>}
                      <span>{key.usageCount.toLocaleString()} requests</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-amber-500 hover:text-amber-600">
                          Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will immediately disable the key. Any applications using this key will stop working.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevokeKey(key.id)}>
                            Revoke Key
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </div>

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
            <div className="size-2 rounded-full bg-red-500" />
            Revoked Keys ({revokedKeys.length})
          </h2>
          
          <div className="space-y-3">
            {revokedKeys.map((key) => (
              <div
                key={key.id}
                className="p-4 rounded-xl bg-card/50 border border-border opacity-60"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="size-4 text-muted-foreground" />
                      <span className="font-semibold line-through">{key.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                        Revoked
                      </span>
                    </div>
                    <code className="text-sm text-muted-foreground font-mono">
                      {maskAPIKey(key.keyPrefix)}
                    </code>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the key record. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteKey(key.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
