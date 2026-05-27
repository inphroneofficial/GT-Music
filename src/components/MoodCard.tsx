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
          ? 'h-[154px] min-w-[152px] max-w-[152px] shrink-0 p-3 sm:h-[166px] sm:min-w-[176px] sm:max-w-[176px] md:h-[232px] md:min-w-0 md:max-w-none md:p-5'
          : 'h-[224px] min-w-[230px] p-4 md:min-w-0',
        className,
      )}
      aria-label={`Open ${meta.label} songs`}
      {...buttonProps}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`} />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-125" />

      <div className="relative flex h-full min-w-0 flex-col">
        <div className={cn('flex items-start justify-between gap-2', compact ? 'mb-2.5 md:mb-4' : 'mb-2.5')}>
          <div className={cn('flex shrink-0 items-center justify-center rounded-2xl bg-background/70 text-primary shadow-sm backdrop-blur', compact ? 'h-9 w-9 md:h-12 md:w-12' : 'h-11 w-11')}>
            <Icon className={cn(compact ? 'h-4 w-4 md:h-5 md:w-5' : 'h-5 w-5')} />
          </div>
          <span className="max-w-[76px] shrink-0 truncate rounded-full border border-white/10 bg-background/45 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:max-w-[90px] md:max-w-[116px] md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.16em]">
            {songs.length} songs
          </span>
        </div>

        <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-primary md:text-[10px] md:tracking-[0.2em]">{meta.signal}</p>
        <h3 className={cn('mt-1 truncate font-extrabold tracking-tight text-foreground', compact ? 'text-lg md:text-2xl' : 'text-xl')}>
          {meta.label}
        </h3>
        <p className={cn('mt-1.5 text-muted-foreground', compact ? 'hidden text-[11px] leading-4 sm:line-clamp-2 sm:block md:text-sm md:leading-6' : 'line-clamp-3 text-xs leading-5')}>
          {meta.description}
        </p>

        <div className={cn('mt-auto flex items-center', compact ? 'pt-2.5 md:pt-4' : 'pt-2.5')}>
          {samples.length > 0 ? (
            samples.map((song, index) => (
              <div
                key={song.id}
                className={cn('shrink-0 overflow-hidden rounded-xl border border-background/60 bg-muted shadow-lg', compact ? 'h-8 w-8 md:h-11 md:w-11' : 'h-10 w-10')}
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
    </button>
  );
}
