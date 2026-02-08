import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  MousePointer2, 
  Type, 
  Palette, 
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  X,
  Check,
  Move,
  Maximize2,
  CornerBottomRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedElement {
  selector: string;
  tagName: string;
  text: string;
  rect: DOMRect;
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    textAlign: string;
    padding: string;
    margin: string;
    borderRadius: string;
  };
}

interface VisualEditorProps {
  isActive: boolean;
  onToggle: () => void;
  onEdit: (edit: { type: string; selector: string; property: string; value: string }) => void;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

export function VisualEditor({ isActive, onToggle, onEdit, iframeRef }: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<DOMRect | null>(null);
  const [editingText, setEditingText] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Get element styles
  const getElementStyles = useCallback((element: HTMLElement): SelectedElement['styles'] => {
    const computed = window.getComputedStyle(element);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      textAlign: computed.textAlign,
      padding: computed.padding,
      margin: computed.margin,
      borderRadius: computed.borderRadius,
    };
  }, []);

  // Generate unique selector for element
  const generateSelector = useCallback((element: HTMLElement): string => {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).slice(0, 2).join('.');
      if (classes) return `.${classes}`;
    }
    return element.tagName.toLowerCase();
  }, []);

  // Handle element click in iframe
  const handleIframeClick = useCallback((e: MouseEvent) => {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (!target || target === document.body) return;

    const rect = target.getBoundingClientRect();
    const iframeRect = iframeRef.current?.getBoundingClientRect();
    
    if (!iframeRect) return;

    setSelectedElement({
      selector: generateSelector(target),
      tagName: target.tagName.toLowerCase(),
      text: target.textContent?.slice(0, 100) || '',
      rect: new DOMRect(
        rect.left + iframeRect.left,
        rect.top + iframeRect.top,
        rect.width,
        rect.height
      ),
      styles: getElementStyles(target),
    });
    setEditingText(target.textContent?.slice(0, 100) || '');
  }, [isActive, iframeRef, generateSelector, getElementStyles]);

  // Handle element hover in iframe
  const handleIframeHover = useCallback((e: MouseEvent) => {
    if (!isActive || selectedElement) return;

    const target = e.target as HTMLElement;
    if (!target || target === document.body) return;

    const rect = target.getBoundingClientRect();
    const iframeRect = iframeRef.current?.getBoundingClientRect();
    
    if (!iframeRect) return;

    setHoveredElement(new DOMRect(
      rect.left + iframeRect.left,
      rect.top + iframeRect.top,
      rect.width,
      rect.height
    ));
  }, [isActive, selectedElement, iframeRef]);

  // Attach event listeners to iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isActive) return;

    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) return;

    iframeDoc.addEventListener('click', handleIframeClick, true);
    iframeDoc.addEventListener('mousemove', handleIframeHover, true);

    // Add visual cursor style
    iframeDoc.body.style.cursor = 'crosshair';

    return () => {
      iframeDoc.removeEventListener('click', handleIframeClick, true);
      iframeDoc.removeEventListener('mousemove', handleIframeHover, true);
      iframeDoc.body.style.cursor = '';
    };
  }, [isActive, iframeRef, handleIframeClick, handleIframeHover]);

  // Close selection when clicking outside
  useEffect(() => {
    if (!selectedElement) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setSelectedElement(null);
        setHoveredElement(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedElement]);

  const applyEdit = (property: string, value: string) => {
    if (!selectedElement) return;
    onEdit({
      type: 'style',
      selector: selectedElement.selector,
      property,
      value,
    });
  };

  const applyTextEdit = () => {
    if (!selectedElement) return;
    onEdit({
      type: 'text',
      selector: selectedElement.selector,
      property: 'textContent',
      value: editingText,
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        className="gap-2"
        onClick={onToggle}
      >
        <MousePointer2 className="size-4" />
        {isActive ? 'Exit Edit Mode' : 'Visual Edit'}
      </Button>

      {/* Active Mode Indicator */}
      {isActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg flex items-center gap-2">
          <MousePointer2 className="size-4" />
          Click any element to edit • Press ESC to exit
        </div>
      )}

      {/* Hover Highlight */}
      {isActive && hoveredElement && !selectedElement && (
        <div
          className="fixed pointer-events-none z-40 border-2 border-primary/50 bg-primary/10 transition-all duration-75"
          style={{
            left: hoveredElement.left,
            top: hoveredElement.top,
            width: hoveredElement.width,
            height: hoveredElement.height,
          }}
        />
      )}

      {/* Selection Highlight & Editor */}
      {selectedElement && (
        <>
          {/* Selection outline */}
          <div
            className="fixed pointer-events-none z-40 border-2 border-primary bg-primary/5"
            style={{
              left: selectedElement.rect.left,
              top: selectedElement.rect.top,
              width: selectedElement.rect.width,
              height: selectedElement.rect.height,
            }}
          >
            {/* Resize handles */}
            <div className="absolute -top-1 -left-1 size-2 bg-primary rounded-full" />
            <div className="absolute -top-1 -right-1 size-2 bg-primary rounded-full" />
            <div className="absolute -bottom-1 -left-1 size-2 bg-primary rounded-full" />
            <div className="absolute -bottom-1 -right-1 size-2 bg-primary rounded-full" />
          </div>

          {/* Editor Panel */}
          <div
            ref={overlayRef}
            className="fixed z-50 w-72 bg-popover border rounded-xl shadow-xl overflow-hidden"
            style={{
              left: Math.min(selectedElement.rect.right + 12, window.innerWidth - 300),
              top: Math.max(selectedElement.rect.top, 80),
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <Square className="size-4 text-primary" />
                <span className="text-sm font-medium">&lt;{selectedElement.tagName}&gt;</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="size-6"
                onClick={() => setSelectedElement(null)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="text" className="p-2">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="text" className="text-xs gap-1">
                  <Type className="size-3" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="style" className="text-xs gap-1">
                  <Palette className="size-3" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="layout" className="text-xs gap-1">
                  <Move className="size-3" />
                  Layout
                </TabsTrigger>
              </TabsList>

              {/* Text Tab */}
              <TabsContent value="text" className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Content</label>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full min-h-[60px] px-2 py-1.5 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button size="sm" className="w-full gap-1" onClick={applyTextEdit}>
                    <Check className="size-3" />
                    Apply Text
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => applyEdit('textAlign', 'left')}
                  >
                    <AlignLeft className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => applyEdit('textAlign', 'center')}
                  >
                    <AlignCenter className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => applyEdit('textAlign', 'right')}
                  >
                    <AlignRight className="size-4" />
                  </Button>
                  <div className="flex-1" />
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => applyEdit('fontWeight', 'bold')}
                  >
                    <Bold className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => applyEdit('fontStyle', 'italic')}
                  >
                    <Italic className="size-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Text Color</label>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className="size-6 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => applyEdit('color', color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Background</label>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className="size-6 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => applyEdit('backgroundColor', color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Font Size</label>
                  <div className="flex gap-1">
                    {['12px', '14px', '16px', '18px', '20px', '24px', '32px'].map((size) => (
                      <button
                        key={size}
                        className="flex-1 px-1 py-1 text-xs border rounded hover:bg-muted"
                        onClick={() => applyEdit('fontSize', size)}
                      >
                        {parseInt(size)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Border Radius</label>
                  <div className="flex gap-1">
                    {['0px', '4px', '8px', '12px', '16px', '24px', '9999px'].map((radius) => (
                      <button
                        key={radius}
                        className="flex-1 px-1 py-1 text-xs border rounded hover:bg-muted"
                        onClick={() => applyEdit('borderRadius', radius)}
                      >
                        {radius === '9999px' ? 'Full' : parseInt(radius)}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout" className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Padding</label>
                  <div className="flex gap-1">
                    {['0px', '4px', '8px', '12px', '16px', '24px', '32px'].map((padding) => (
                      <button
                        key={padding}
                        className="flex-1 px-1 py-1 text-xs border rounded hover:bg-muted"
                        onClick={() => applyEdit('padding', padding)}
                      >
                        {parseInt(padding)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Margin</label>
                  <div className="flex gap-1">
                    {['0px', '4px', '8px', '12px', '16px', '24px', '32px'].map((margin) => (
                      <button
                        key={margin}
                        className="flex-1 px-1 py-1 text-xs border rounded hover:bg-muted"
                        onClick={() => applyEdit('margin', margin)}
                      >
                        {parseInt(margin)}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* ESC key handler */}
      {isActive && (
        <div
          style={{ position: 'fixed', opacity: 0, pointerEvents: 'none' }}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              if (selectedElement) {
                setSelectedElement(null);
              } else {
                onToggle();
              }
            }
          }}
          ref={(el) => el?.focus()}
        />
      )}
    </>
  );
}
