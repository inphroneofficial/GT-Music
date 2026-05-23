import { useEffect, useMemo, useState } from 'react';
import { Instagram } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const DEVELOPER_IMAGES = [
  '/image-1.jpeg',
  '/image-2.jpeg',
  '/image-3.jpeg',
  '/image-4.jpeg',
  '/image-5.jpeg',
];

type DeveloperDialogProps = {
  variant?: 'default' | 'gtk';
};

export function DeveloperDialog({ variant = 'default' }: DeveloperDialogProps) {
  const images = useMemo(() => DEVELOPER_IMAGES, []);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveImageIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [images]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === 'gtk' ? (
          <button
            type="button"
            className="gtk-trigger tap-target touch-manipulation group relative flex h-12 items-center gap-3 overflow-hidden rounded-full border border-primary/25 bg-background/75 px-3.5 pr-4 text-left shadow-[0_16px_40px_-24px_hsl(var(--primary)/0.7)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 md:h-14 md:px-4 md:pr-5"
          >
            <span className="gtk-orb relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/14 text-[11px] font-black tracking-[0.28em] text-primary md:h-10 md:w-10 md:text-sm">
              <span className="relative z-10">GTK</span>
            </span>
            <span className="min-w-0">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.24em] text-primary/80 md:text-[10px]">Creator</span>
              <span className="block truncate text-xs font-semibold text-foreground md:text-sm">Built by Thangella</span>
            </span>
            <span className="gtk-bars pointer-events-none ml-1 flex items-end gap-1">
              <span className="gtk-bar" />
              <span className="gtk-bar gtk-bar-delay-1" />
              <span className="gtk-bar gtk-bar-delay-2" />
            </span>
          </button>
        ) : (
          <button className="tap-target rounded-[2rem] border border-primary/20 bg-primary/10 px-5 py-4 text-left text-sm font-semibold text-primary transition-colors btn-press hover:bg-primary/15">
            Designed and Developed by Thangella
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[84vh] max-w-[90vw] overflow-hidden rounded-[1.75rem] border-border/40 bg-background p-0 shadow-2xl sm:max-w-2xl">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 premium-hero-night opacity-80" />
          <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative max-h-[84vh] overflow-y-auto p-4 sm:p-5">
            <DialogHeader className="mb-4 text-left">
              <DialogTitle className="text-lg font-bold text-foreground sm:text-xl">Designed and Developed by Thangella</DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                A focused music experience built to feel personal, cinematic, and smoother than a typical web player.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-[minmax(0,230px)_1fr] md:items-center">
              <div className="mx-auto w-full max-w-[230px] perspective-card">
                <div className="developer-photo-card relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/60 p-3 shadow-[0_30px_60px_-24px_hsl(var(--primary)/0.55)]">
                  <div className="pointer-events-none absolute inset-x-8 top-3 h-10 rounded-full bg-primary/10 blur-2xl" />
                  <div className="developer-photo-stage relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-white/10 bg-background/70">
                    {images.map((image, index) => (
                      <div
                        key={image}
                        className={`absolute inset-0 transition-all duration-700 ${index === activeImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'}`}
                      >
                        <img
                          src={image}
                          alt={`Thangella portrait ${index + 1}`}
                          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
                          aria-hidden="true"
                          onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                        <img
                          src={image}
                          alt={`Thangella portrait ${index + 1}`}
                          className="absolute inset-0 h-full w-full object-contain p-3"
                          onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                      </div>
                    ))}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
                    <div className="developer-audio-bars pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-end gap-1 rounded-full border border-white/10 bg-background/50 px-3 py-2 backdrop-blur-md">
                      <span className="developer-bar" />
                      <span className="developer-bar developer-bar-delay-1" />
                      <span className="developer-bar developer-bar-delay-2" />
                      <span className="developer-bar developer-bar-delay-3" />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-dot`}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`h-2.5 rounded-full transition-all ${index === activeImageIndex ? 'w-7 bg-primary' : 'w-2.5 bg-white/25 hover:bg-white/40'}`}
                        aria-label={`Show image ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/30 bg-card/50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Creator</p>
                  <p className="mt-2 text-base font-semibold text-foreground">Thangella</p>
                  <a
                    href="https://instagram.com/g_thangella_k"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Instagram className="h-4 w-4 text-primary" />
                    instagram.com/thangella
                  </a>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    title="Why I built this"
                    value="I got fed up with Spotify-style apps always pushing ads, locking basic controls behind subscriptions, and filling the experience with things I did not ask for. So I built my own cloud-style player that feels free, personal, and fully under my control."
                  />
                  <InfoCard
                    title="About this app"
                    value="GT Music is where I keep and enjoy my favorite songs without unwanted recommendations, forced upgrades, or noise. It is built to feel clean, premium, and focused on my music, my vibe, and my way of listening."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/30 bg-card/50 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}
