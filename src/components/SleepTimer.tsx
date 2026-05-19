import { useState, useEffect } from 'react';
import { Moon, Timer, X } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { SLEEP_TIMER_OPTIONS } from '@/types/music';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

export function SleepTimer() {
  const { sleepTimerEnd, setSleepTimer, clearSleepTimer } = useMusic();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!sleepTimerEnd) { setRemaining(null); return; }
    const tick = () => {
      const left = Math.max(0, Math.ceil((sleepTimerEnd - Date.now()) / 1000));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sleepTimerEnd]);

  const formatRemaining = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isActive = sleepTimerEnd !== null && remaining !== null && remaining > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-full btn-press relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Moon className="w-4 h-4" />
          {isActive && (
            <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {Math.ceil((remaining || 0) / 60)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 bg-popover/95 backdrop-blur-xl border-border/50 rounded-xl" align="end">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Sleep Timer</span>
          </div>
          {isActive && (
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={clearSleepTimer}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {isActive && remaining !== null && (
          <div className="text-center py-3 mb-2 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-2xl font-bold text-primary tabular-nums">{formatRemaining(remaining)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">remaining</p>
          </div>
        )}

        <div className="space-y-1">
          {SLEEP_TIMER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSleepTimer(opt.value)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-card transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
