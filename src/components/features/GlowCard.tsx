import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'green' | 'amber';
  hover?: boolean;
}

const glowColorMap = {
  cyan: 'before:from-cyan-500 before:to-blue-500 hover:shadow-glow',
  purple: 'before:from-purple-500 before:to-pink-500 hover:shadow-glow-purple',
  green: 'before:from-green-500 before:to-emerald-500',
  amber: 'before:from-amber-500 before:to-orange-500',
};

export function GlowCard({ children, className, glowColor = 'cyan', hover = true }: GlowCardProps) {
  return (
    <div
      className={cn(
        'gradient-border p-px rounded-xl transition-all duration-300',
        hover && 'hover:scale-[1.02]',
        glowColorMap[glowColor],
        className
      )}
    >
      <div className="bg-card rounded-xl h-full">
        {children}
      </div>
    </div>
  );
}
