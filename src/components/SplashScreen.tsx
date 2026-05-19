import { useEffect, useState } from 'react';
import { Disc3 } from 'lucide-react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'exiting' | 'done'>('loading');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('exiting'), 1800);
    const timer2 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2400);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background ${
        phase === 'exiting' ? 'animate-splash-fade-out' : ''
      }`}
    >
      {/* Animated gradient rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full border border-primary/10 animate-splash-pulse" />
        <div className="absolute w-48 h-48 rounded-full border border-primary/20 animate-splash-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute w-32 h-32 rounded-full border border-primary/30 animate-splash-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient opacity-60" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-2xl btn-gradient flex items-center justify-center shadow-2xl glow-amber animate-bounce-in">
          <Disc3 className="w-10 h-10 text-primary-foreground animate-spin-slow" />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">GT Music</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Your music, your way</p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
