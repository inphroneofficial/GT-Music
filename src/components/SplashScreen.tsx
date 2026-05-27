import { useEffect, useRef, useState } from 'react';
import { Disc3, Headphones, Sparkles } from 'lucide-react';

const SPLASH_IMAGE = '/image-1.jpeg';
const MIN_SPLASH_MS = 1350;
const MAX_SPLASH_MS = 2600;
const EXIT_MS = 460;

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'exiting' | 'done'>('loading');
  const [imageReady, setImageReady] = useState(false);
  const [minimumReached, setMinimumReached] = useState(false);
  const completeCalledRef = useRef(false);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.src = SPLASH_IMAGE;

    const markReady = () => {
      if (!active) return;
      setImageReady(true);
    };

    image.onload = markReady;
    image.onerror = markReady;

    if (image.complete) {
      markReady();
    } else if ('decode' in image) {
      image.decode().then(markReady).catch(markReady);
    }

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const minimumTimer = window.setTimeout(() => setMinimumReached(true), MIN_SPLASH_MS);
    const maximumTimer = window.setTimeout(() => {
      setImageReady(true);
      setMinimumReached(true);
    }, MAX_SPLASH_MS);

    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(maximumTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'loading') return;
    if (!minimumReached || !imageReady) return;

    setPhase('exiting');
    const finishTimer = window.setTimeout(() => {
      setPhase('done');
      if (!completeCalledRef.current) {
        completeCalledRef.current = true;
        onComplete();
      }
    }, EXIT_MS);

    return () => window.clearTimeout(finishTimer);
  }, [imageReady, minimumReached, onComplete, phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background ${
        phase === 'exiting' ? 'animate-splash-fade-out pointer-events-none' : ''
      }`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsla(var(--primary)/0.16),transparent_34%),linear-gradient(180deg,hsla(0,0%,100%,0.02),transparent_26%)]" />
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/18 blur-3xl splash-orb-float" />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-rose-500/10 blur-3xl splash-orb-float-delayed" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl splash-orb-float" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-72 w-72 rounded-full border border-primary/10 animate-splash-pulse" />
        <div className="absolute h-56 w-56 rounded-full border border-primary/20 animate-splash-pulse" style={{ animationDelay: '0.55s' }} />
        <div className="absolute h-40 w-40 rounded-full border border-primary/30 animate-splash-pulse" style={{ animationDelay: '1.1s' }} />
      </div>

      <div className="absolute inset-0 mesh-gradient opacity-50" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        <div className="splash-photo-frame animate-bounce-in mb-6 h-36 w-36 overflow-hidden rounded-[1.9rem] border border-white/10 bg-card/60 p-2 shadow-[0_22px_60px_-26px_hsl(var(--primary)/0.55)] sm:h-44 sm:w-44">
          <div className="relative h-full w-full overflow-hidden rounded-[1.45rem] border border-white/10 bg-background/85">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsla(var(--primary)/0.16),transparent_68%)]" />
            {imageReady && (
              <>
                <img
                  src={SPLASH_IMAGE}
                  alt="GT Music loading artwork"
                  className="absolute inset-0 h-full w-full scale-105 object-cover opacity-20 blur-xl"
                />
                <img
                  src={SPLASH_IMAGE}
                  alt="GT Music loading artwork"
                  className="absolute inset-0 h-full w-full object-contain p-2"
                />
              </>
            )}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/72 to-transparent" />
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-1.5 rounded-full border border-white/10 bg-background/60 px-3 py-2">
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

        <div className="animate-fade-in" style={{ animationDelay: '0.16s' }}>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">GT Music</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
            Launching your personal listening space with cinematic mood, clean playback, and the songs you actually love.
          </p>
        </div>

        <div className="mt-6 grid w-full grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.28s' }}>
          <div className="rounded-2xl border border-white/10 bg-card/40 px-3 py-3">
            <Disc3 className="mx-auto h-4 w-4 text-primary animate-spin-slow" />
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Playback</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card/40 px-3 py-3">
            <Headphones className="mx-auto h-4 w-4 text-primary" />
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Immersion</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card/40 px-3 py-3">
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
