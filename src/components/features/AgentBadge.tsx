import { AgentType } from '@/types';
import { AGENT_CONFIGS } from '@/constants/config';
import { cn } from '@/lib/utils';
import { 
  Brain, 
  Layers, 
  Database, 
  Palette, 
  Shield, 
  Globe, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';

const iconMap = {
  Brain,
  Layers,
  Database,
  Palette,
  Shield,
  Globe,
  Zap,
  CheckCircle2,
};

const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  gradient: { 
    bg: 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20', 
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400', 
    border: 'border-cyan-500/30',
    glow: 'shadow-[0_0_10px_rgba(0,212,255,0.2)]'
  },
  cyan: { 
    bg: 'bg-cyan-500/10', 
    text: 'text-cyan-400', 
    border: 'border-cyan-500/30',
    glow: 'shadow-[0_0_10px_rgba(0,212,255,0.15)]'
  },
  purple: { 
    bg: 'bg-purple-500/10', 
    text: 'text-purple-400', 
    border: 'border-purple-500/30',
    glow: 'shadow-[0_0_10px_rgba(168,85,247,0.15)]'
  },
  pink: { 
    bg: 'bg-pink-500/10', 
    text: 'text-pink-400', 
    border: 'border-pink-500/30',
    glow: 'shadow-[0_0_10px_rgba(236,72,153,0.15)]'
  },
  amber: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-400', 
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.15)]'
  },
  green: { 
    bg: 'bg-green-500/10', 
    text: 'text-green-400', 
    border: 'border-green-500/30',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]'
  },
  blue: { 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-400', 
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_10px_rgba(59,130,246,0.15)]'
  },
  emerald: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-400', 
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]'
  },
};

// Legacy support for old agent types
const legacyAgentMap: Record<string, AgentType> = {
  architect: 'blueprinter',
  engineer: 'uiDesigner',
  qa: 'finalCheck',
};

interface AgentBadgeProps {
  agent: AgentType | 'architect' | 'engineer' | 'qa';
  showModel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function AgentBadge({ agent, showModel = false, size = 'sm', animated = false }: AgentBadgeProps) {
  // Map legacy agent types to new ones
  const mappedAgent = legacyAgentMap[agent] || agent;
  const config = AGENT_CONFIGS[mappedAgent];
  
  if (!config) return null;
  
  const colorClass = colorClasses[config.color] || colorClasses.cyan;
  const IconComponent = iconMap[config.icon as keyof typeof iconMap] || Brain;
  
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };
  
  const iconSizes = {
    sm: 'size-3',
    md: 'size-3.5',
    lg: 'size-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border transition-all',
        colorClass.bg,
        colorClass.border,
        animated && colorClass.glow,
        sizeClasses[size]
      )}
    >
      <IconComponent className={cn(iconSizes[size], colorClass.text, animated && 'animate-pulse')} />
      <span className={colorClass.text}>{config.name}</span>
      {showModel && (
        <span className="text-muted-foreground ml-1 opacity-70">
          • {config.model}
        </span>
      )}
    </span>
  );
}

interface AgentPipelineProps {
  currentPhase: number;
  className?: string;
}

export function AgentPipeline({ currentPhase, className }: AgentPipelineProps) {
  const agents = [
    { id: 'blueprinter', phase: 1 },
    { id: 'dataLayer', phase: 2 },
    { id: 'uiDesigner', phase: 3 },
    { id: 'security', phase: 4 },
    { id: 'liveIntel', phase: 5 },
    { id: 'finalCheck', phase: 7 },
  ];
  
  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto', className)}>
      {agents.map((agent, index) => {
        const config = AGENT_CONFIGS[agent.id];
        const isActive = currentPhase === agent.phase;
        const isComplete = currentPhase > agent.phase;
        const colorClass = colorClasses[config.color] || colorClasses.cyan;
        const IconComponent = iconMap[config.icon as keyof typeof iconMap] || Brain;
        
        return (
          <div key={agent.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium transition-all',
                isActive && [colorClass.bg, colorClass.border, colorClass.glow, 'border'],
                isComplete && 'bg-green-500/10 border border-green-500/30',
                !isActive && !isComplete && 'bg-muted/30 text-muted-foreground'
              )}
            >
              <IconComponent 
                className={cn(
                  'size-3',
                  isActive && [colorClass.text, 'animate-pulse'],
                  isComplete && 'text-green-400',
                  !isActive && !isComplete && 'text-muted-foreground'
                )} 
              />
              <span className={cn(
                isActive && colorClass.text,
                isComplete && 'text-green-400'
              )}>
                {config.name.replace('The ', '')}
              </span>
              {isComplete && <CheckCircle2 className="size-3 text-green-400" />}
            </div>
            {index < agents.length - 1 && (
              <div className={cn(
                'w-4 h-px mx-1',
                isComplete ? 'bg-green-500/50' : 'bg-muted-foreground/20'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
