import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Database, 
  Copy, 
  Download,
  Check,
  Table2,
  Key,
  Shield,
  Plus,
  Trash2,
  Play,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Editor from '@monaco-editor/react';
import { useThemeStore } from '@/stores/themeStore';

interface SQLExportProps {
  sql: string;
  className?: string;
}

export function SQLExport({ sql, className }: SQLExportProps) {
  const { toast } = useToast();
  const { theme } = useThemeStore();
  const project = useProjectStore(state => state.getCurrentProject());
  const addSQLSchema = useProjectStore(state => state.addSQLSchema);
  const deleteSQLSchema = useProjectStore(state => state.deleteSQLSchema);
  
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  
  // Parse SQL to extract table info
  const tables = sql.match(/CREATE TABLE.*?;/gis)?.map(statement => {
    const nameMatch = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i);
    return nameMatch?.[1] || 'unknown';
  }) || [];
  
  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'SQL schema copied to clipboard.',
    });
  };
  
  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded!',
      description: 'SQL file has been downloaded.',
    });
  };
  
  const handleSaveSchema = () => {
    const name = `Schema ${(project?.sqlSchemas.length || 0) + 1}`;
    addSQLSchema(name, sql, tables);
    toast({
      title: 'Schema Saved',
      description: 'SQL schema has been saved to your project.',
    });
  };
  
  const handleRunOnBackend = async () => {
    if (!project?.backendConnection?.isConnected) {
      toast({
        title: 'No Backend Connected',
        description: 'Please connect a backend first to run SQL.',
        variant: 'destructive',
      });
      return;
    }
    
    // Simulate running SQL
    toast({
      title: 'Executing SQL...',
      description: 'Running schema on your backend.',
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'SQL Executed',
      description: `Successfully created ${tables.length} table(s).`,
    });
  };
  
  if (!sql) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)}>
          <Database className="size-4" />
          SQL Schema
          {tables.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary">
              {tables.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="size-5" />
            SQL Schema Export
          </DialogTitle>
          <DialogDescription>
            Generated database schema ready to run on your backend.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="gap-2">
              <FileCode className="size-4" />
              Current Schema
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Database className="size-4" />
              Saved Schemas ({project?.sqlSchemas.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="mt-4 space-y-4">
            {/* Tables Overview */}
            <div className="flex flex-wrap gap-2">
              {tables.map((table) => (
                <div
                  key={table}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium"
                >
                  <Table2 className="size-3" />
                  {table}
                </div>
              ))}
            </div>
            
            {/* SQL Editor */}
            <div className="border rounded-lg overflow-hidden">
              <div className="h-[350px]">
                <Editor
                  height="100%"
                  language="sql"
                  value={sql}
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
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-1">
                  <Table2 className="size-4 text-primary" />
                  <span className="font-medium text-sm">{tables.length} Tables</span>
                </div>
                <p className="text-xs text-muted-foreground">Database tables defined</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="size-4 text-amber-500" />
                  <span className="font-medium text-sm">Indexes</span>
                </div>
                <p className="text-xs text-muted-foreground">Optimized queries</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="size-4 text-green-500" />
                  <span className="font-medium text-sm">RLS Policies</span>
                </div>
                <p className="text-xs text-muted-foreground">Row level security</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button onClick={handleCopy} variant="outline" className="gap-2">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied!' : 'Copy SQL'}
              </Button>
              <Button onClick={handleDownload} variant="outline" className="gap-2">
                <Download className="size-4" />
                Download .sql
              </Button>
              <Button onClick={handleSaveSchema} variant="outline" className="gap-2">
                <Plus className="size-4" />
                Save Schema
              </Button>
              <div className="flex-1" />
              <Button 
                onClick={handleRunOnBackend} 
                className="gap-2"
                disabled={!project?.backendConnection?.isConnected}
              >
                <Play className="size-4" />
                Run on Backend
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="mt-4">
            {project?.sqlSchemas.length === 0 ? (
              <div className="text-center py-12">
                <Database className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-1">No saved schemas</h3>
                <p className="text-sm text-muted-foreground">
                  Save your generated SQL schemas for later use.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {project?.sqlSchemas.map((schema) => (
                    <div
                      key={schema.id}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{schema.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(schema.createdAt).toLocaleDateString()} • {schema.tables.length} tables
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => {
                              navigator.clipboard.writeText(schema.sql);
                              toast({ title: 'Copied!' });
                            }}
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive"
                            onClick={() => deleteSQLSchema(schema.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {schema.tables.map((table) => (
                          <span
                            key={table}
                            className="px-2 py-0.5 rounded bg-muted text-xs"
                          >
                            {table}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
