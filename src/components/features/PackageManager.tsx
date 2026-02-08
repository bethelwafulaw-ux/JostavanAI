import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Trash2, 
  Search,
  Loader2,
  Check,
  ExternalLink,
  Star,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface InstalledPackage {
  name: string;
  version: string;
  installedAt: string;
}

interface PackageManagerProps {
  packages: InstalledPackage[];
  onInstall: (packageName: string, version?: string) => Promise<void>;
  onUninstall: (packageName: string) => void;
}

// Popular packages for suggestions
const POPULAR_PACKAGES = [
  { name: 'framer-motion', description: 'Production-ready motion library for React', stars: '22k', category: 'Animation' },
  { name: 'date-fns', description: 'Modern JavaScript date utility library', stars: '33k', category: 'Utilities' },
  { name: 'axios', description: 'Promise based HTTP client', stars: '104k', category: 'HTTP' },
  { name: 'zustand', description: 'Small, fast state-management', stars: '42k', category: 'State' },
  { name: '@tanstack/react-query', description: 'Async state management', stars: '39k', category: 'Data' },
  { name: 'zod', description: 'TypeScript-first schema validation', stars: '30k', category: 'Validation' },
  { name: 'react-hook-form', description: 'Performant forms with easy validation', stars: '39k', category: 'Forms' },
  { name: '@supabase/supabase-js', description: 'Supabase client library', stars: '12k', category: 'Backend' },
  { name: 'recharts', description: 'Composable charting library', stars: '22k', category: 'Charts' },
  { name: 'dayjs', description: 'Fast 2kB date library alternative', stars: '45k', category: 'Utilities' },
  { name: '@radix-ui/react-dialog', description: 'Accessible dialog component', stars: '14k', category: 'UI' },
  { name: 'react-hot-toast', description: 'Smoking hot React notifications', stars: '9k', category: 'UI' },
];

export function PackageManager({ packages, onInstall, onUninstall }: PackageManagerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const [customPackage, setCustomPackage] = useState('');

  const filteredPackages = POPULAR_PACKAGES.filter(pkg =>
    pkg.name.toLowerCase().includes(search.toLowerCase()) ||
    pkg.description.toLowerCase().includes(search.toLowerCase()) ||
    pkg.category.toLowerCase().includes(search.toLowerCase())
  );

  const isInstalled = (name: string) => packages.some(p => p.name === name);

  const handleInstall = async (packageName: string) => {
    if (isInstalled(packageName)) {
      toast({
        title: 'Already installed',
        description: `${packageName} is already in your project`,
      });
      return;
    }

    setInstalling(packageName);
    try {
      await onInstall(packageName);
      toast({
        title: 'Package installed',
        description: `Successfully installed ${packageName}`,
      });
    } catch (error) {
      toast({
        title: 'Installation failed',
        description: `Could not install ${packageName}`,
        variant: 'destructive',
      });
    } finally {
      setInstalling(null);
    }
  };

  const handleInstallCustom = async () => {
    const packageName = customPackage.trim();
    if (!packageName) return;

    await handleInstall(packageName);
    setCustomPackage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="size-4" />
          Packages
          {packages.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary">
              {packages.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Package Manager
          </DialogTitle>
          <DialogDescription>
            Install npm packages for your project. Ask the AI to use specific libraries in your code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="pl-10"
            />
          </div>

          {/* Custom package install */}
          <div className="flex gap-2">
            <Input
              value={customPackage}
              onChange={(e) => setCustomPackage(e.target.value)}
              placeholder="Or enter package name (e.g., lodash)"
              onKeyDown={(e) => e.key === 'Enter' && handleInstallCustom()}
            />
            <Button 
              onClick={handleInstallCustom}
              disabled={!customPackage.trim() || installing !== null}
            >
              <Plus className="size-4 mr-2" />
              Install
            </Button>
          </div>

          {/* Installed packages */}
          {packages.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Installed ({packages.length})</h3>
              <div className="flex flex-wrap gap-2">
                {packages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-sm"
                  >
                    <Check className="size-3 text-green-500" />
                    <span className="font-mono text-xs">{pkg.name}</span>
                    <span className="text-xs text-muted-foreground">@{pkg.version}</span>
                    <button
                      onClick={() => onUninstall(pkg.name)}
                      className="p-0.5 hover:bg-destructive/20 rounded transition-colors"
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular packages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-sm font-medium mb-2">Popular Packages</h3>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {filteredPackages.map((pkg) => {
                  const installed = isInstalled(pkg.name);
                  const isInstalling = installing === pkg.name;

                  return (
                    <div
                      key={pkg.name}
                      className={cn(
                        'p-3 rounded-lg border transition-all',
                        installed ? 'bg-green-500/5 border-green-500/20' : 'hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{pkg.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">
                              {pkg.category}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pkg.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="size-3 fill-yellow-500 text-yellow-500" />
                              {pkg.stars}
                            </span>
                            <a
                              href={`https://www.npmjs.com/package/${pkg.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              npm
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={installed ? 'secondary' : 'default'}
                          disabled={installed || isInstalling}
                          onClick={() => handleInstall(pkg.name)}
                          className="shrink-0"
                        >
                          {isInstalling ? (
                            <>
                              <Loader2 className="size-4 mr-1 animate-spin" />
                              Installing
                            </>
                          ) : installed ? (
                            <>
                              <Check className="size-4 mr-1" />
                              Installed
                            </>
                          ) : (
                            <>
                              <Download className="size-4 mr-1" />
                              Install
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
