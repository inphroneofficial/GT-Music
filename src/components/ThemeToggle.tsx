import { Moon, Sun } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { settings, updateSettings } = useMusic();
  const isLight = settings.theme === 'light';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`rounded-full border border-border/50 bg-card/50 text-foreground transition-all hover:bg-card ${
        compact ? 'h-9 w-9' : 'h-10 w-10'
      }`}
      onClick={() => updateSettings({ theme: isLight ? 'dark' : 'light' })}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
