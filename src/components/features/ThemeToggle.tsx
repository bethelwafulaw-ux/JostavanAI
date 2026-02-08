import { useThemeStore } from '@/stores/themeStore';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        'relative size-9 rounded-full transition-all duration-300',
        'hover:bg-muted/80',
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun
        className={cn(
          'absolute size-5 transition-all duration-500',
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        )}
      />
      <Moon
        className={cn(
          'absolute size-5 transition-all duration-500',
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        )}
      />
    </Button>
  );
}
