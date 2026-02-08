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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  FileText,
  Palette,
  Type,
  Layout,
  Code2,
  MoreVertical,
  Check,
  Upload,
  Edit3,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface KnowledgeFile {
  id: string;
  name: string;
  type: 'brand' | 'style' | 'content' | 'code' | 'custom';
  content: string;
  isActive: boolean;
  createdAt: string;
}

interface KnowledgeFilesProps {
  files: KnowledgeFile[];
  onAdd: (file: Omit<KnowledgeFile, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<KnowledgeFile>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const fileTypeIcons = {
  brand: Palette,
  style: Layout,
  content: Type,
  code: Code2,
  custom: FileText,
};

const fileTypeColors = {
  brand: 'text-purple-500 bg-purple-500/10',
  style: 'text-pink-500 bg-pink-500/10',
  content: 'text-blue-500 bg-blue-500/10',
  code: 'text-green-500 bg-green-500/10',
  custom: 'text-gray-500 bg-gray-500/10',
};

const TEMPLATES = {
  brand: `# Brand Guidelines

## Colors
- Primary: #3B82F6 (Blue)
- Secondary: #8B5CF6 (Purple)
- Accent: #10B981 (Green)
- Background: #FFFFFF
- Text: #1F2937

## Typography
- Headings: Inter, bold
- Body: Inter, regular
- Code: JetBrains Mono

## Voice & Tone
- Professional but approachable
- Clear and concise
- Friendly, not casual

## Logo Usage
- Minimum size: 32px
- Clear space: Equal to logo height
- Never stretch or distort`,

  style: `# Style Preferences

## Layout
- Use cards with subtle shadows
- Rounded corners (8px default)
- Generous whitespace
- Mobile-first responsive design

## Spacing
- Section padding: 64px vertical
- Content max-width: 1280px
- Card padding: 24px
- Gap between elements: 16px

## Animations
- Use subtle transitions (200-300ms)
- Fade in on scroll
- Hover scale on buttons (1.02)
- No flashy animations

## Components
- Prefer outlined buttons for secondary actions
- Use icons with text labels
- Cards should have hover states
- Forms with floating labels`,

  content: `# Content Guidelines

## Headlines
- Keep under 8 words
- Use action verbs
- Focus on benefits, not features

## Body Text
- Short paragraphs (2-3 sentences max)
- Use bullet points for lists
- Include relevant statistics

## CTAs
- Primary: "Get Started", "Try Free"
- Secondary: "Learn More", "See Demo"
- Avoid: "Click Here", "Submit"

## Imagery
- Use high-quality photos
- Prefer diverse representation
- Avoid stock photo clichés`,

  code: `# Code Standards

## React
- Use functional components
- Prefer hooks over class components
- Keep components under 150 lines
- Extract reusable logic to custom hooks

## TypeScript
- Always define prop interfaces
- Avoid 'any' type
- Use proper generics

## Styling
- Use Tailwind CSS utilities
- Avoid inline styles
- Use cn() for conditional classes

## File Structure
- One component per file
- Group by feature, not type
- Keep related files together`,
};

export function KnowledgeFiles({
  files,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}: KnowledgeFilesProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<KnowledgeFile | null>(null);
  const [newFile, setNewFile] = useState({
    name: '',
    type: 'brand' as KnowledgeFile['type'],
    content: '',
  });

  const activeCount = files.filter(f => f.isActive).length;

  const handleAddFile = () => {
    if (!newFile.name.trim() || !newFile.content.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please provide a name and content',
        variant: 'destructive',
      });
      return;
    }

    onAdd({
      name: newFile.name,
      type: newFile.type,
      content: newFile.content,
      isActive: true,
    });

    setNewFile({ name: '', type: 'brand', content: '' });
    setIsAddOpen(false);
    toast({
      title: 'Knowledge file added',
      description: 'AI will now use this context for all tasks',
    });
  };

  const handleUseTemplate = (type: keyof typeof TEMPLATES) => {
    setNewFile({
      name: type.charAt(0).toUpperCase() + type.slice(1) + ' Guide',
      type: type as KnowledgeFile['type'],
      content: TEMPLATES[type],
    });
  };

  const handleEditSave = () => {
    if (editingFile) {
      onUpdate(editingFile.id, {
        name: editingFile.name,
        content: editingFile.content,
      });
      setEditingFile(null);
      toast({ title: 'File updated' });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="size-4" />
            Knowledge
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary">
                {activeCount}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              Knowledge Files
            </DialogTitle>
            <DialogDescription>
              Upload brand guides, style preferences, or content guidelines. 
              The AI will read these before every task to stay consistent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Add button */}
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="size-4" />
              Add Knowledge File
            </Button>

            {/* Files list */}
            {files.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-1">No knowledge files yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add guidelines to help the AI stay on-brand
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {files.map((file) => {
                    const Icon = fileTypeIcons[file.type];
                    return (
                      <div
                        key={file.id}
                        className={cn(
                          'p-3 rounded-lg border transition-all',
                          file.isActive ? 'bg-card' : 'bg-muted/30 opacity-60'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'size-10 rounded-lg flex items-center justify-center shrink-0',
                            fileTypeColors[file.type]
                          )}>
                            <Icon className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{file.name}</h4>
                              {file.isActive && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px]">
                                  <Check className="size-3" />
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {file.content.slice(0, 100)}...
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onToggle(file.id)}>
                                {file.isActive ? 'Disable' : 'Enable'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingFile(file)}>
                                <Edit3 className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(file.content);
                                toast({ title: 'Copied!' });
                              }}>
                                <Copy className="size-4 mr-2" />
                                Copy Content
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => onDelete(file.id)}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add File Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Knowledge File</DialogTitle>
            <DialogDescription>
              Create a new file with guidelines for the AI to follow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Templates */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start from template</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map((type) => {
                  const Icon = fileTypeIcons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleUseTemplate(type)}
                      className={cn(
                        'p-3 rounded-lg border text-center hover:border-primary transition-colors',
                        newFile.type === type && newFile.content && 'border-primary bg-primary/5'
                      )}
                    >
                      <Icon className="size-5 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs capitalize">{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">File Name</label>
              <Input
                value={newFile.name}
                onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                placeholder="e.g., Brand Guidelines"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-2">
                {(['brand', 'style', 'content', 'code', 'custom'] as const).map((type) => {
                  const Icon = fileTypeIcons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setNewFile({ ...newFile, type })}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                        newFile.type === type 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'hover:bg-muted'
                      )}
                    >
                      <Icon className="size-4" />
                      <span className="capitalize">{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content (Markdown)</label>
              <textarea
                value={newFile.content}
                onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                placeholder="Write your guidelines here using Markdown..."
                className="w-full min-h-[200px] px-3 py-2 rounded-lg border bg-muted/50 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFile} disabled={!newFile.name || !newFile.content}>
              <Plus className="size-4 mr-2" />
              Add File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit File Dialog */}
      <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Knowledge File</DialogTitle>
          </DialogHeader>

          {editingFile && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">File Name</label>
                <Input
                  value={editingFile.name}
                  onChange={(e) => setEditingFile({ ...editingFile, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <textarea
                  value={editingFile.content}
                  onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                  className="w-full min-h-[300px] px-3 py-2 rounded-lg border bg-muted/50 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFile(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
