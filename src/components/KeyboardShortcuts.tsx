import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const shortcuts = [
  { keys: ['Space'], desc: 'Play / Pause' },
  { keys: ['Shift', '→'], desc: 'Next track' },
  { keys: ['Shift', '←'], desc: 'Previous track' },
  { keys: ['M'], desc: 'Mute / Unmute' },
  { keys: ['L'], desc: 'Like current song' },
  { keys: ['F'], desc: 'Toggle fullscreen player' },
  { keys: ['Q'], desc: 'Toggle queue' },
  { keys: ['?'], desc: 'Show shortcuts' },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
          <Keyboard className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border/50 rounded-2xl max-w-sm animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" /> Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {shortcuts.map(({ keys, desc }) => (
            <div key={desc} className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{desc}</span>
              <div className="flex gap-1">
                {keys.map(k => (
                  <kbd key={k} className="px-2 py-0.5 rounded-md bg-card border border-border/50 text-[11px] font-mono text-foreground">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
