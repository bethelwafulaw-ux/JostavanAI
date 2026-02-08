import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ListTodo, 
  Check, 
  X,
  Loader2,
  FileCode,
  Database,
  Palette,
  Shield,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlanStep {
  id: string;
  type: 'file' | 'database' | 'style' | 'security' | 'feature';
  title: string;
  description: string;
  files?: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface BuildPlan {
  id: string;
  prompt: string;
  summary: string;
  steps: PlanStep[];
  estimatedTime: string;
  complexity: 'simple' | 'medium' | 'complex';
}

interface PlannerModeProps {
  plan: BuildPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (plan: BuildPlan) => void;
  onReject: () => void;
  onModifyStep: (stepId: string, approved: boolean) => void;
}

const stepIcons = {
  file: FileCode,
  database: Database,
  style: Palette,
  security: Shield,
  feature: Sparkles,
};

const stepColors = {
  file: 'text-blue-500 bg-blue-500/10',
  database: 'text-purple-500 bg-purple-500/10',
  style: 'text-pink-500 bg-pink-500/10',
  security: 'text-amber-500 bg-amber-500/10',
  feature: 'text-green-500 bg-green-500/10',
};

export function PlannerMode({
  plan,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onModifyStep,
}: PlannerModeProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  if (!plan) return null;

  const handleApprove = async () => {
    setIsExecuting(true);
    await onApprove(plan);
    setIsExecuting(false);
    onClose();
  };

  const approvedSteps = plan.steps.filter(s => s.status !== 'rejected').length;
  const totalSteps = plan.steps.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTodo className="size-5" />
            Build Plan
          </DialogTitle>
          <DialogDescription>
            Review the AI's plan before execution. You can approve, modify, or reject individual steps.
          </DialogDescription>
        </DialogHeader>

        {/* Plan Summary */}
        <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{plan.summary}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                "{plan.prompt}"
              </p>
            </div>
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              plan.complexity === 'simple' && 'bg-green-100 text-green-700',
              plan.complexity === 'medium' && 'bg-amber-100 text-amber-700',
              plan.complexity === 'complex' && 'bg-red-100 text-red-700',
            )}>
              {plan.complexity}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>⏱️ Est. {plan.estimatedTime}</span>
            <span>📁 {approvedSteps}/{totalSteps} steps approved</span>
          </div>
        </div>

        {/* Steps */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {plan.steps.map((step, index) => {
              const Icon = stepIcons[step.type];
              const isRejected = step.status === 'rejected';

              return (
                <div
                  key={step.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    isRejected ? 'opacity-50 bg-muted/30' : 'bg-card'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Step number */}
                    <div className={cn(
                      'size-8 rounded-full flex items-center justify-center shrink-0',
                      stepColors[step.type]
                    )}>
                      <Icon className="size-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                        <ChevronRight className="size-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{step.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                      {step.files && step.files.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {step.files.map((file) => (
                            <span
                              key={file}
                              className="px-2 py-0.5 rounded bg-muted text-xs font-mono"
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant={step.status === 'approved' ? 'default' : 'ghost'}
                        className="size-8"
                        onClick={() => onModifyStep(step.id, true)}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={step.status === 'rejected' ? 'destructive' : 'ghost'}
                        className="size-8"
                        onClick={() => onModifyStep(step.id, false)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Warning if steps rejected */}
        {plan.steps.some(s => s.status === 'rejected') && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              {plan.steps.filter(s => s.status === 'rejected').length} step(s) will be skipped.
              This may affect the final result.
            </span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReject} disabled={isExecuting}>
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={isExecuting || approvedSteps === 0}
            className="gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Building...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Build {approvedSteps} Step{approvedSteps !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper to generate a plan from a prompt
export function generateBuildPlan(prompt: string): BuildPlan {
  const lowerPrompt = prompt.toLowerCase();
  const steps: PlanStep[] = [];
  let complexity: BuildPlan['complexity'] = 'simple';
  let estimatedTime = '30 seconds';

  // Analyze prompt and create steps
  if (lowerPrompt.includes('landing') || lowerPrompt.includes('homepage')) {
    steps.push({
      id: '1',
      type: 'feature',
      title: 'Create Landing Page Structure',
      description: 'Generate hero section, features grid, CTA sections, and footer',
      files: ['src/pages/LandingPage.tsx'],
      status: 'pending',
    });
  }

  if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('admin')) {
    steps.push({
      id: '2',
      type: 'feature',
      title: 'Build Dashboard Layout',
      description: 'Create sidebar navigation, stats cards, charts, and activity feed',
      files: ['src/pages/DashboardPage.tsx', 'src/components/layout/DashboardLayout.tsx'],
      status: 'pending',
    });
    complexity = 'medium';
    estimatedTime = '1 minute';
  }

  if (lowerPrompt.includes('auth') || lowerPrompt.includes('login') || lowerPrompt.includes('signup')) {
    steps.push({
      id: '3',
      type: 'security',
      title: 'Implement Authentication',
      description: 'Create login, signup pages with form validation and session handling',
      files: ['src/pages/LoginPage.tsx', 'src/pages/SignupPage.tsx', 'src/lib/auth.ts'],
      status: 'pending',
    });
    steps.push({
      id: '4',
      type: 'database',
      title: 'Create Users Schema',
      description: 'Generate SQL for users table with RLS policies and indexes',
      files: ['schema.sql'],
      status: 'pending',
    });
    complexity = 'medium';
    estimatedTime = '1-2 minutes';
  }

  if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('shop') || lowerPrompt.includes('store')) {
    steps.push({
      id: '5',
      type: 'feature',
      title: 'Create Product Catalog',
      description: 'Build product grid, filters, and product detail pages',
      files: ['src/pages/ProductsPage.tsx', 'src/pages/ProductDetailPage.tsx'],
      status: 'pending',
    });
    steps.push({
      id: '6',
      type: 'feature',
      title: 'Implement Shopping Cart',
      description: 'Create cart context, add-to-cart functionality, and checkout flow',
      files: ['src/stores/cartStore.ts', 'src/pages/CartPage.tsx', 'src/pages/CheckoutPage.tsx'],
      status: 'pending',
    });
    steps.push({
      id: '7',
      type: 'database',
      title: 'Create E-commerce Schema',
      description: 'Generate SQL for products, categories, orders, and order_items tables',
      files: ['schema.sql'],
      status: 'pending',
    });
    complexity = 'complex';
    estimatedTime = '2-3 minutes';
  }

  if (lowerPrompt.includes('blog')) {
    steps.push({
      id: '8',
      type: 'feature',
      title: 'Create Blog System',
      description: 'Build blog listing, post detail, and author pages',
      files: ['src/pages/BlogPage.tsx', 'src/pages/PostPage.tsx'],
      status: 'pending',
    });
    steps.push({
      id: '9',
      type: 'database',
      title: 'Create Posts Schema',
      description: 'Generate SQL for posts, tags, and comments tables',
      files: ['schema.sql'],
      status: 'pending',
    });
  }

  // Style step is always included
  steps.push({
    id: 'style',
    type: 'style',
    title: 'Apply Visual Styling',
    description: 'Configure Tailwind theme, colors, typography, and responsive design',
    files: ['src/index.css', 'tailwind.config.ts'],
    status: 'pending',
  });

  // File structure step
  steps.unshift({
    id: 'files',
    type: 'file',
    title: 'Setup Project Structure',
    description: 'Create base files, components, utilities, and routing configuration',
    files: ['src/App.tsx', 'src/main.tsx', 'src/lib/utils.ts'],
    status: 'pending',
  });

  // Default if no specific features detected
  if (steps.length <= 2) {
    steps.splice(1, 0, {
      id: 'default',
      type: 'feature',
      title: 'Generate Website',
      description: 'Create responsive website with modern UI components',
      files: ['src/pages/HomePage.tsx', 'src/components/ui/Button.tsx'],
      status: 'pending',
    });
  }

  // Mark all as pending (default to approved for better UX)
  steps.forEach(step => step.status = 'pending');

  return {
    id: Date.now().toString(),
    prompt,
    summary: generateSummary(prompt),
    steps,
    estimatedTime,
    complexity,
  };
}

function generateSummary(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('shop')) {
    return 'E-commerce Website with Product Catalog';
  }
  if (lowerPrompt.includes('dashboard')) {
    return 'Admin Dashboard with Analytics';
  }
  if (lowerPrompt.includes('blog')) {
    return 'Blog Platform with Posts System';
  }
  if (lowerPrompt.includes('landing')) {
    return 'Modern Landing Page';
  }
  if (lowerPrompt.includes('saas')) {
    return 'SaaS Application Template';
  }
  
  return 'Custom Website Build';
}
