import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Image, 
  Upload, 
  X, 
  Loader2, 
  Sparkles,
  FileImage,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageToCodeProps {
  onConvert: (imageData: string, description: string) => void;
  isConverting?: boolean;
}

export function ImageToCode({ onConvert, isConverting }: ImageToCodeProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please drop an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setIsOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleConvert = () => {
    if (imagePreview) {
      onConvert(imagePreview, description || 'Convert this design to a working React component');
      setIsOpen(false);
      setImagePreview(null);
      setDescription('');
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processImage(file);
          }
        }
      }
    }
  }, []);

  // Listen for paste events
  useState(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  });

  return (
    <>
      {/* Drop Zone Overlay - Shows when dragging files */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity pointer-events-none',
          dragActive ? 'opacity-100' : 'opacity-0'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-8 rounded-2xl border-2 border-dashed border-primary bg-primary/5">
          <div className="text-center">
            <FileImage className="size-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Drop to Convert</h3>
            <p className="text-muted-foreground">Release to convert image to code</p>
          </div>
        </div>
      </div>

      {/* Global drag listener */}
      <div
        className="fixed inset-0 z-40 pointer-events-none"
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        style={{ pointerEvents: dragActive ? 'auto' : 'none' }}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => fileInputRef.current?.click()}
      >
        <Image className="size-4" />
        Image to Code
      </Button>

      {/* Conversion Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="size-5" />
              Convert Image to Code
            </DialogTitle>
            <DialogDescription>
              Upload a screenshot, wireframe, or design and AI will convert it to working React code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative rounded-lg border overflow-hidden bg-muted/50">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-[300px] object-contain"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 size-8 bg-background/80"
                  onClick={() => setImagePreview(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}

            {/* Or upload new */}
            {!imagePreview && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
                  'hover:border-primary hover:bg-primary/5'
                )}
              >
                <Upload className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-1">Drop an image or click to upload</h3>
                <p className="text-sm text-muted-foreground">
                  Screenshots, wireframes, mockups, or even napkin sketches
                </p>
              </div>
            )}

            {/* Description input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional instructions (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., 'Use a dark theme', 'Make it responsive', 'Add hover animations'"
                className="w-full min-h-[80px] px-3 py-2 rounded-lg border bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Convert button */}
            <Button
              className="w-full gap-2"
              onClick={handleConvert}
              disabled={!imagePreview || isConverting}
            >
              {isConverting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Convert to Code
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Works best with UI screenshots, wireframes, and design mockups
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
