import { useEffect, useState } from 'react';
import { Disc3, Headphones, Sparkles } from 'lucide-react';

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
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsla(var(--primary)/0.16),transparent_34%),linear-gradient(180deg,hsla(0,0%,100%,0.02),transparent_26%)]" />
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl splash-orb-float" />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl splash-orb-float-delayed" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl splash-orb-float" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-72 w-72 rounded-full border border-primary/10 animate-splash-pulse" />
        <div className="absolute h-56 w-56 rounded-full border border-primary/20 animate-splash-pulse" style={{ animationDelay: '0.55s' }} />
        <div className="absolute h-40 w-40 rounded-full border border-primary/30 animate-splash-pulse" style={{ animationDelay: '1.1s' }} />
      </div>

      <div className="absolute inset-0 mesh-gradient opacity-60" />
      <div className="absolute inset-0 grain-overlay opacity-[0.05]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        <div className="splash-photo-frame animate-bounce-in mb-6 h-40 w-40 overflow-hidden rounded-[2rem] border border-white/10 bg-card/60 p-2 shadow-[0_28px_80px_-28px_hsl(var(--primary)/0.55)] backdrop-blur-2xl sm:h-48 sm:w-48">
          <div className="relative h-full w-full overflow-hidden rounded-[1.55rem] border border-white/10 bg-background/80">
            <img
              src="/image-1.jpeg"
              alt="GT Music loading artwork"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
            />
            <img
              src="/image-1.jpeg"
              alt="GT Music loading artwork"
              className="absolute inset-0 h-full w-full object-contain p-2"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/70 to-transparent" />
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-1.5 rounded-full border border-white/10 bg-background/55 px-3 py-2 backdrop-blur-xl">
              {[0, 1, 2, 3, 4].map((index) => (
                <span
                  key={index}
                  className="splash-bar"
                  style={{ animationDelay: `${index * 0.12}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-primary animate-fade-in">
          <Sparkles className="h-3.5 w-3.5" />
          Personal Music Universe
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">GT Music</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
            Launching your personal listening space with cinematic mood, clean playback, and the songs you actually love.
          </p>
        </div>

        <div className="mt-6 grid w-full grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <div className="rounded-2xl border border-white/10 bg-card/45 px-3 py-3 backdrop-blur-xl">
            <Disc3 className="mx-auto h-4 w-4 text-primary animate-spin-slow" />
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Playback</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card/45 px-3 py-3 backdrop-blur-xl">
            <Headphones className="mx-auto h-4 w-4 text-primary" />
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Immersion</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card/45 px-3 py-3 backdrop-blur-xl">
            <Sparkles className="mx-auto h-4 w-4 text-primary" />
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mood</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2.5">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-2 w-2 rounded-full bg-primary animate-pulse-glow"
              style={{ animationDelay: `${index * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
