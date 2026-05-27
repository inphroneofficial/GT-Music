import type { LucideIcon } from 'lucide-react';
import { CloudRain, Flame, Heart, Music2, Sparkles } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { MOOD_META } from '@/lib/moods';
import { cn } from '@/lib/utils';
import type { Song, SongMood } from '@/types/music';
import { SongCover } from '@/components/SongCover';

const MOOD_ICONS: Record<SongMood, LucideIcon> = {
  melodies: Music2,
  mass: Flame,
  romantic: Heart,
  emotional: CloudRain,
  uplifting: Sparkles,
};

export function MoodCard({
  mood,
  songs,
  onClick,
  className,
  compact = false,
  ...buttonProps
}: {
  mood: SongMood;
  songs: Song[];
  onClick: () => void;
  className?: string;
  compact?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick'>) {
  const meta = MOOD_META[mood];
  const Icon = MOOD_ICONS[mood];
  const samples = songs.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative snap-start overflow-hidden rounded-[1.5rem] border border-white/10 bg-card/70 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_24px_70px_-48px_hsl(var(--primary)/0.9)]',
        compact
          ? 'h-[154px] min-w-[152px] max-w-[152px] shrink-0 p-3 sm:h-[166px] sm:min-w-[176px] sm:max-w-[176px] md:h-[218px] md:min-w-0 md:max-w-none md:p-0'
          : 'h-[224px] min-w-[230px] p-4 md:min-w-0',
        className,
      )}
      aria-label={`Open ${meta.label} songs`}
      {...buttonProps}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`} />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-125" />

      <div className={cn('relative h-full min-w-0', compact ? 'md:hidden' : 'flex flex-col')}>
        <div className="flex h-full min-w-0 flex-col">
          <div className="mb-2.5 flex items-start justify-between gap-2">
            <div className={cn('flex shrink-0 items-center justify-center rounded-2xl bg-background/70 text-primary shadow-sm backdrop-blur', compact ? 'h-9 w-9' : 'h-11 w-11')}>
              <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
            </div>
            <span className="max-w-[76px] shrink-0 truncate rounded-full border border-white/10 bg-background/45 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:max-w-[90px]">
              {songs.length} songs
            </span>
          </div>

          <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-primary">{meta.signal}</p>
          <h3 className={cn('mt-1 truncate font-extrabold tracking-tight text-foreground', compact ? 'text-lg' : 'text-xl')}>
            {meta.label}
          </h3>
          <p className={cn('mt-1.5 text-muted-foreground', compact ? 'hidden text-[11px] leading-4 sm:line-clamp-2 sm:block' : 'line-clamp-3 text-xs leading-5')}>
            {meta.description}
          </p>

          <div className="mt-auto flex items-center pt-2.5">
            {samples.length > 0 ? (
              samples.map((song, index) => (
                <div
                  key={song.id}
                  className={cn('shrink-0 overflow-hidden rounded-xl border border-background/60 bg-muted shadow-lg', compact ? 'h-8 w-8' : 'h-10 w-10')}
                  style={{ marginLeft: index === 0 ? 0 : compact ? -8 : -10 }}
                >
                  <SongCover song={song} alt={song.title} className="h-full w-full object-cover" />
                </div>
              ))
            ) : (
              <div className="flex h-8 min-w-0 items-center rounded-xl border border-white/10 bg-background/45 px-2 text-[10px] text-muted-foreground">
                Add songs with mood: {mood}
              </div>
            )}
          </div>
        </div>
      </div>

      {compact && (
        <div className="relative hidden h-full min-w-0 flex-col p-5 md:flex">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-background/72 text-primary shadow-sm backdrop-blur">
              <Icon className="h-5 w-5" />
            </div>
            <span className="max-w-[118px] shrink-0 truncate rounded-full border border-white/10 bg-background/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              {songs.length} songs
            </span>
          </div>

          <div className="mt-4 min-w-0">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-primary">{meta.signal}</p>
            <h3 className="mt-1 truncate text-xl font-black tracking-tight text-foreground xl:text-2xl">{meta.label}</h3>
            <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-muted-foreground xl:text-sm xl:leading-6">{meta.description}</p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <div className="flex min-w-0 items-center">
              {samples.length > 0 ? (
                samples.map((song, index) => (
                  <div
                    key={song.id}
                    className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-background/60 bg-muted shadow-lg"
                    style={{ marginLeft: index === 0 ? 0 : -10 }}
                  >
                    <SongCover song={song} alt={song.title} className="h-full w-full object-cover" />
                  </div>
                ))
              ) : (
                <span className="truncate rounded-full border border-white/10 bg-background/45 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                  Add songs with mood: {mood}
                </span>
              )}
            </div>
            <span className="shrink-0 rounded-full border border-white/10 bg-background/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              Open
            </span>
          </div>
        </div>
      )}
    </button>
  );
}
