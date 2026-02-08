import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ label, value, change, changeType = 'neutral', icon: Icon, iconColor = 'text-cyan-500' }: StatCardProps) {
  return (
    <div className="gradient-border p-px rounded-xl">
      <div className="bg-card rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {change && (
              <p className={cn(
                'text-xs font-medium',
                changeType === 'positive' && 'text-green-500',
                changeType === 'negative' && 'text-red-500',
                changeType === 'neutral' && 'text-muted-foreground'
              )}>
                {change}
              </p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-lg bg-muted/50', iconColor)}>
            <Icon className="size-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
