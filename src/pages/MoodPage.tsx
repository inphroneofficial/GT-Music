import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Shuffle, Sparkles } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { MoodCard } from '@/components/MoodCard';
import { SEO } from '@/components/SEO';
import { SongRow } from '@/components/SongRow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MOOD_META, MOOD_ORDER, getSongMood, groupSongsByMood, normalizeSongMood } from '@/lib/moods';

const MoodPage = () => {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { allSongs, loading, playSong } = useMusic();
  const moodRailRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const selectedMood = normalizeSongMood(decodeURIComponent(name || ''));
  const selectedMeta = selectedMood ? MOOD_META[selectedMood] : null;

  const moodGroups = useMemo(() => groupSongsByMood(allSongs), [allSongs]);
  const moodSongs = useMemo(
    () => selectedMood ? allSongs.filter((song) => getSongMood(song) === selectedMood) : [],
    [allSongs, selectedMood],
  );

  useEffect(() => {
    if (!selectedMood) return;

    const rail = moodRailRef.current;
    const activeCard = rail?.querySelector<HTMLElement>(`[data-mood-card="${selectedMood}"]`);
    if (!rail || !activeCard) return;

    const targetLeft = activeCard.offsetLeft - (rail.clientWidth - activeCard.clientWidth) / 2;

    window.requestAnimationFrame(() => {
      rail.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      });
    });
  }, [selectedMood]);

  const scrollMoodRail = (direction: 'previous' | 'next') => {
    const rail = moodRailRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction === 'next' ? rail.clientWidth * 0.82 : -rail.clientWidth * 0.82,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return <MoodPageSkeleton />;
  }

  return (
    <ScrollArea className="h-full">
      <SEO
        title={selectedMeta ? `${selectedMeta.label} Songs` : 'Your Mood'}
        description={selectedMeta ? `Play ${selectedMeta.label.toLowerCase()} songs from your GT Music library.` : 'Choose GT Music songs by mood.'}
        path={selectedMood ? `/mood/${selectedMood}` : '/mood'}
      />
      <div className="max-w-full overflow-x-hidden p-4 pb-32 md:p-6">
        <section className={`relative mb-6 overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br ${selectedMeta?.gradient ?? 'from-primary/20 via-orange-400/10 to-sky-400/10'} p-5 md:rounded-[2rem] md:p-8`}>
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/45 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Your Mood
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-6xl">
              {selectedMeta?.label ?? 'Choose Your Mood'}
            </h1>
            <p className="mt-3 max-w-full text-sm leading-6 text-muted-foreground md:max-w-2xl md:text-base md:leading-7">
              {selectedMeta?.description ?? 'Pick a mood first. GT Music will then show only the songs that belong to that feeling, not a long mixed list.'}
            </p>

            {selectedMeta && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  className="h-11 rounded-full border-0 bg-primary px-6 font-bold text-primary-foreground btn-press hover:bg-primary/90"
                  disabled={moodSongs.length === 0}
                  onClick={() => {
                    const shuffled = [...moodSongs].sort(() => Math.random() - 0.5);
                    if (shuffled[0]) playSong(shuffled[0], shuffled);
                  }}
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Shuffle {selectedMeta.shortLabel}
                </Button>
                <span className="rounded-full border border-white/10 bg-background/45 px-4 py-2 text-sm text-muted-foreground">
                  {moodSongs.length} songs ready
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Mood Lanes</p>
              <h2 className="text-xl font-bold text-foreground">
                {selectedMeta ? 'Switch to another mood' : 'Tap one mood to open songs'}
              </h2>
            </div>
            {selectedMeta && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollMoodRail('previous')}
                  className="hidden h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/55 text-muted-foreground transition-colors hover:text-foreground sm:flex md:hidden"
                  aria-label="Scroll moods left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollMoodRail('next')}
                  className="hidden h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/55 text-muted-foreground transition-colors hover:text-foreground sm:flex md:hidden"
                  aria-label="Scroll moods right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/mood')}
                  className="rounded-full border border-border/40 bg-card/55 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  All moods
                </button>
              </div>
            )}
          </div>

          <div className="-mx-4 max-w-[100vw] px-4 md:mx-0 md:max-w-full md:px-0">
            <div
              ref={moodRailRef}
              className="mood-scroll-rail"
              onClickCapture={(event) => {
                if (!dragStateRef.current.moved) return;
                event.preventDefault();
                event.stopPropagation();
                dragStateRef.current.moved = false;
              }}
              onPointerDown={(event) => {
                const rail = moodRailRef.current;
                if (!rail || event.pointerType === 'mouse') return;

                dragStateRef.current = {
                  active: true,
                  moved: false,
                  startX: event.clientX,
                  startScrollLeft: rail.scrollLeft,
                };
                rail.setPointerCapture?.(event.pointerId);
              }}
              onPointerMove={(event) => {
                const rail = moodRailRef.current;
                const dragState = dragStateRef.current;
                if (!rail || !dragState.active) return;

                const deltaX = event.clientX - dragState.startX;
                if (Math.abs(deltaX) > 5) {
                  dragState.moved = true;
                  rail.scrollLeft = dragState.startScrollLeft - deltaX;
                }
              }}
              onPointerUp={(event) => {
                const rail = moodRailRef.current;
                const didMove = dragStateRef.current.moved;
                dragStateRef.current.active = false;
                rail?.releasePointerCapture?.(event.pointerId);
                if (didMove) {
                  window.setTimeout(() => {
                    dragStateRef.current.moved = false;
                  }, 140);
                }
              }}
              onPointerCancel={() => {
                dragStateRef.current.active = false;
              }}
            >
              {MOOD_ORDER.map((item) => {
                const group = moodGroups.find((entry) => entry.mood === item);
                return (
                  <MoodCard
                    key={item}
                    mood={item}
                    songs={group?.songs ?? []}
                    compact
                    data-mood-card={item}
                    onClick={() => navigate(`/mood/${item}`)}
                    className={item === selectedMood ? 'is-selected ring-1 ring-primary/40 md:ring-2' : undefined}
                  />
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground md:hidden">
            Swipe sideways to switch moods
          </p>
        </section>

        {selectedMeta ? (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{selectedMeta.label} Queue</p>
                <h2 className="text-2xl font-extrabold text-foreground">Songs in this mood</h2>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">{moodSongs.length} tracks</span>
            </div>

            {moodSongs.length > 0 ? (
              <div className="space-y-0.5">
                {moodSongs.map((song, index) => (
                  <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${index * 24}ms` }}>
                    <SongRow song={song} index={index} context={moodSongs} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-border/30 bg-card/45 px-6 py-12 text-center">
                <p className="text-sm font-semibold text-foreground">No songs in {selectedMeta.label} yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Add `"mood": "{selectedMood}"` to any song in your manifest and it will appear here automatically.
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-[1.6rem] border border-border/30 bg-card/45 p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ChevronRight className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground">Choose first, then songs appear</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This page now works like a real music app mood hub: it shows mood categories first, and only opens the related song list after you choose one.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
};

const MoodPageSkeleton = () => (
  <ScrollArea className="h-full">
    <SEO title="Your Mood" description="Choose GT Music songs by mood." path="/mood" />
    <div className="max-w-full overflow-hidden p-4 pb-32 md:p-6">
      <section className="mb-6 overflow-hidden rounded-[1.7rem] border border-border/30 bg-card/45 p-5 md:rounded-[2rem] md:p-8">
        <div className="mb-5 h-8 w-36 rounded-full bg-muted/50 shimmer" />
        <div className="mb-4 h-12 w-64 max-w-full rounded-2xl bg-muted/50 shimmer md:h-16" />
        <div className="mb-3 h-4 w-full max-w-xl rounded-full bg-muted/50 shimmer" />
        <div className="h-4 w-4/5 max-w-lg rounded-full bg-muted/50 shimmer" />
      </section>

      <section>
        <div className="mb-4 h-4 w-28 rounded-full bg-muted/50 shimmer" />
        <div className="mb-5 h-8 w-64 max-w-full rounded-2xl bg-muted/50 shimmer" />
        <div className="mood-scroll-rail" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-[154px] min-w-[152px] max-w-[152px] shrink-0 rounded-[1.5rem] bg-muted/50 p-3 shimmer sm:h-[166px] sm:min-w-[176px] sm:max-w-[176px]"
              style={{ animationDelay: `${index * 70}ms` }}
            />
          ))}
        </div>
      </section>
    </div>
  </ScrollArea>
);

export default MoodPage;
