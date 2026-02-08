import { MODEL_CONFIGS } from '@/constants/config';
import { ModelType } from '@/types';
import { cn } from '@/lib/utils';
import { Zap, Scale, Brain, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ModelSelectorProps {
  value: ModelType;
  onChange: (model: ModelType) => void;
  disabled?: boolean;
}

const modelIcons = {
  fast: Zap,
  balanced: Scale,
  reasoning: Brain,
};

const modelColors = {
  fast: 'text-green-400',
  balanced: 'text-purple-400',
  reasoning: 'text-cyan-400',
};

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const selectedModel = MODEL_CONFIGS.find((m) => m.id === value)!;
  const Icon = modelIcons[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="gap-2 bg-muted/50 border-border hover:bg-muted"
        >
          <Icon className={cn('size-4', modelColors[value])} />
          <span className="font-medium">{selectedModel.name}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {MODEL_CONFIGS.map((model) => {
          const ModelIcon = modelIcons[model.id];
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onChange(model.id)}
              className={cn(
                'flex items-start gap-3 p-3 cursor-pointer',
                value === model.id && 'bg-muted'
              )}
            >
              <div className={cn('p-1.5 rounded-md bg-muted/50', modelColors[model.id])}>
                <ModelIcon className="size-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.speed}</span>
                </div>
                <p className="text-xs text-muted-foreground">{model.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {model.provider}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {model.quality}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
