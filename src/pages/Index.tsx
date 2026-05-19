import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, Plus, Play, ChevronRight } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonCard, SkeletonHero, SkeletonQuickPick } from '@/components/SkeletonCards';
import { Equalizer } from '@/components/Equalizer';
import { SongContextMenu } from '@/components/SongContextMenu';
import { SongCover } from '@/components/SongCover';
import { SEO } from '@/components/SEO';
import type { Song } from '@/types/music';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { lead: 'Late night', tail: 'vibes' };
  if (h < 12) return { lead: 'Good', tail: 'morning' };
  if (h < 17) return { lead: 'Good', tail: 'afternoon' };
  if (h < 21) return { lead: 'Good', tail: 'evening' };
  return { lead: 'Night', tail: 'owl' };
}

function getSubtext() {
  const h = new Date().getHours();
  if (h < 6) return 'Slow tempos and ambient textures for the small hours.';
  if (h < 12) return 'Immersive soundscapes to begin your day in motion.';
  if (h < 17) return 'Keep the momentum - handpicked sets for the afternoon.';
  if (h < 21) return 'Wind down with the records you keep coming back to.';
  return 'Let the night unfold one track at a time.';
}

const HomePage = () => {
  const navigate = useNavigate();
  const { allSongs, recentlyPlayed, playSong, currentSong, isPlaying, togglePlay, loading } = useMusic();

  const recentSongs = useMemo(
    () => recentlyPlayed.map((id) => allSongs.find((s) => s.id === id)).filter(Boolean) as Song[],
    [recentlyPlayed, allSongs]
  );

  const albums = useMemo(() => {
    const map = new Map<string, { name: string; artist: string; cover: string; songs: Song[] }>();
    allSongs.forEach((s) => {
      if (!map.has(s.album)) map.set(s.album, { name: s.album, artist: s.artist, cover: `/songs/${s.cover}`, songs: [] });
      map.get(s.album)!.songs.push(s);
    });
    return Array.from(map.values());
  }, [allSongs]);

  const featured = allSongs[0];
  const topSongs = allSongs.slice(0, 5);
  const quickPicks = albums.slice(0, 3);

  const greeting = getGreeting();
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 pb-32 md:p-12">
          <SkeletonHero />
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonQuickPick key={i} delay={i * 60} />)}
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} delay={i * 80} />)}
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <SEO
        title="Home"
        description="Welcome to GT Music - your personal, ad-free music universe. Stream your library anywhere."
        path="/"
      />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full ambient-blob-amber" />
        <div className="pointer-events-none absolute top-[40%] -right-48 h-[500px] w-[500px] rounded-full ambient-blob-violet" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full ambient-blob-rose" />
        <div className="pointer-events-none absolute inset-0 grain-overlay opacity-[0.04]" />

        <div className="relative z-10 mx-auto max-w-7xl space-y-16 px-5 pb-36 pt-6 md:space-y-24 md:px-10 md:pt-10 lg:px-14">
          <section className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:gap-12">
            <div className="flex-1 space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary animate-fade-in">
                <span className="h-px w-12 bg-primary" />
                {dateLabel}
              </div>
              <h1 className="font-serif text-6xl leading-[0.85] tracking-tight text-foreground animate-fade-in sm:text-7xl md:text-[8rem] lg:text-[10rem]" style={{ animationDelay: '80ms' }}>
                {greeting.lead}
                <br />
                <span className="ml-3 italic text-gradient-warm sm:ml-6 md:ml-16">{greeting.tail}</span>
              </h1>
              <p className="max-w-md text-base font-light leading-relaxed text-muted-foreground animate-fade-in md:text-xl" style={{ animationDelay: '160ms' }}>
                {getSubtext()}
              </p>
              <div className="flex flex-wrap items-center gap-3 animate-fade-in md:gap-4" style={{ animationDelay: '240ms' }}>
                <Button
                  onClick={() => {
                    const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
                    if (shuffled[0]) playSong(shuffled[0], shuffled);
                  }}
                  className="h-12 gap-3 rounded-full border-0 bg-primary px-7 font-bold text-primary-foreground shadow-[0_0_50px_-10px_hsl(var(--primary)/0.6)] btn-press hover:bg-primary/90 md:h-14 md:px-10"
                >
                  <Shuffle className="h-4 w-4 md:h-5 md:w-5" />
                  Shuffle Play
                </Button>
                <button
                  onClick={() => navigate('/library')}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 transition-colors btn-press hover:bg-card/60 md:h-14 md:w-14"
                  aria-label="Open library"
                >
                  <Plus className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            </div>

            {featured && (
              <div className="group relative w-full animate-fade-in-scale lg:w-[420px]" style={{ animationDelay: '320ms' }}>
                <div className="absolute -inset-4 rounded-[3rem] bg-primary/15 blur-2xl opacity-60 transition-opacity duration-700 group-hover:opacity-100" />
                <button
                  onClick={() => playSong(featured, allSongs)}
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] border border-border/60 bg-card text-left shadow-2xl btn-press"
                >
                  <SongCover
                    song={featured}
                    alt={featured.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute right-6 top-6 flex h-12 w-12 translate-y-2 items-center justify-center rounded-full glass opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                    <Play className="ml-0.5 h-5 w-5 fill-primary text-primary" />
                  </div>
                  <div className="absolute bottom-7 left-7 right-7">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Featured Release</p>
                    <h3 className="mb-1 font-serif text-3xl italic text-white md:text-4xl">{featured.title}</h3>
                    <p className="text-sm text-zinc-400">{featured.artist}</p>
                  </div>
                </button>
              </div>
            )}
          </section>

          {quickPicks.length > 0 && (
            <section className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
              {quickPicks[0] && (
                <button
                  onClick={() => navigate(`/album/${encodeURIComponent(quickPicks[0].name)}`)}
                  className="group relative flex h-56 items-center gap-5 overflow-hidden rounded-[2rem] border border-border/40 p-6 text-left transition-all glass hover:bg-card/70 animate-fade-in-scale md:col-span-2 md:h-64 md:gap-8 md:rounded-[2.5rem] md:p-8"
                >
                  <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full ambient-blob-violet opacity-60" />
                  <div className="relative z-10 h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 md:h-40 md:w-40">
                    <img src={quickPicks[0].cover} alt={quickPicks[0].name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                  </div>
                  <div className="relative z-10 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Recent</span>
                    <h4 className="mt-1 truncate font-serif text-3xl text-foreground md:mb-2 md:text-4xl">{quickPicks[0].name}</h4>
                    <p className="truncate text-sm text-muted-foreground md:text-base">{quickPicks[0].artist}</p>
                  </div>
                </button>
              )}
              {quickPicks.slice(1, 3).map((album, i) => (
                <button
                  key={album.name}
                  onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}
                  className="group relative flex h-56 flex-col justify-between rounded-[2rem] border border-border/40 p-6 text-left transition-all glass hover:bg-card/70 animate-fade-in-scale md:h-64 md:rounded-[2.5rem] md:p-8"
                  style={{ animationDelay: `${(i + 1) * 80}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="h-14 w-14 overflow-hidden rounded-xl border border-border/40 ring-1 ring-white/5 md:h-16 md:w-16">
                      <img src={album.cover} alt={album.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <div>
                    <h4 className="truncate text-xl font-semibold text-foreground md:text-2xl">{album.name}</h4>
                    <p className="truncate text-sm text-muted-foreground">{album.artist}</p>
                  </div>
                </button>
              ))}
            </section>
          )}

          <section className="space-y-6 md:space-y-8">
            <div className="flex items-center gap-4 md:gap-8">
              <h2 className="font-serif text-3xl italic text-foreground md:text-5xl">Your Top Songs</h2>
              <div className="h-px flex-1 bg-border/60" />
              <button className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground sm:block md:text-xs">
                Discover More
              </button>
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:gap-8 lg:grid-cols-5">
              {topSongs.map((song, i) => {
                const isActive = currentSong?.id === song.id;
                return (
                  <SongContextMenu key={song.id} song={song}>
                    <div
                      onClick={() => { if (isActive) togglePlay(); else playSong(song, topSongs); }}
                      className="group cursor-pointer animate-fade-in-scale"
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xl md:mb-5 md:rounded-3xl">
                        <SongCover
                          song={song}
                          alt={song.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                          <div className="flex h-14 w-14 translate-y-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-all duration-300 glow-amber group-hover:translate-y-0 md:h-16 md:w-16">
                            <Play className="ml-0.5 h-6 w-6 fill-current md:h-7 md:w-7" />
                          </div>
                        </div>
                        {isActive && (
                          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2 py-1 glass">
                            <Equalizer playing={isPlaying} size="sm" />
                          </div>
                        )}
                      </div>
                      <h4 className="mb-0.5 truncate text-sm font-bold transition-colors group-hover:text-primary md:mb-1 md:text-base">{song.title}</h4>
                      <p className="truncate text-xs font-medium text-muted-foreground md:text-sm">{song.artist}</p>
                    </div>
                  </SongContextMenu>
                );
              })}
            </div>
          </section>

          {recentSongs.length > 0 && (
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-8">
                <h2 className="font-serif text-3xl italic text-foreground md:text-5xl">Recently Played</h2>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:gap-8 lg:grid-cols-5">
                {recentSongs.slice(0, 5).map((song, i) => {
                  const isActive = currentSong?.id === song.id;
                  return (
                    <SongContextMenu key={song.id} song={song}>
                      <div
                        onClick={() => { if (isActive) togglePlay(); else playSong(song, recentSongs); }}
                        className="group cursor-pointer animate-fade-in-scale"
                        style={{ animationDelay: `${i * 70}ms` }}
                      >
                        <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xl md:mb-5 md:rounded-3xl">
                          <SongCover song={song} alt={song.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                            <div className="flex h-14 w-14 translate-y-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-all duration-300 group-hover:translate-y-0 md:h-16 md:w-16">
                              <Play className="ml-0.5 h-6 w-6 fill-current" />
                            </div>
                          </div>
                        </div>
                        <h4 className="mb-0.5 truncate text-sm font-bold transition-colors group-hover:text-primary md:text-base">{song.title}</h4>
                        <p className="truncate text-xs font-medium text-muted-foreground md:text-sm">{song.artist}</p>
                      </div>
                    </SongContextMenu>
                  );
                })}
              </div>
            </section>
          )}

          <section className="space-y-8 md:space-y-12">
            <div className="flex flex-wrap items-baseline gap-4">
              <h2 className="font-serif text-3xl text-foreground md:text-5xl">Browse by Album</h2>
              <span className="rounded-full border border-border/40 bg-card/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {albums.length} Records
              </span>
            </div>
            <div className="space-y-1.5">
              {albums.map((album, i) => (
                <button
                  key={album.name}
                  onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}
                  className="group grid w-full grid-cols-12 items-center rounded-2xl border border-transparent px-4 py-4 text-left transition-all hover:border-border/50 hover:bg-card/40 animate-fade-in md:rounded-[2rem] md:px-10 md:py-6"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="col-span-1 hidden font-mono text-xs text-muted-foreground/40 transition-colors group-hover:text-primary md:block">
                    {String(i + 1).padStart(2, '0')}/
                  </div>
                  <div className="col-span-9 flex min-w-0 items-center gap-4 md:col-span-6 md:gap-6">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-card ring-1 ring-border/40 md:h-14 md:w-14 md:rounded-2xl">
                      <img src={album.cover} alt={album.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                    </div>
                    <div className="min-w-0">
                      <h5 className="truncate text-base font-medium tracking-tight md:text-xl">{album.name}</h5>
                      <p className="truncate text-xs text-muted-foreground md:text-sm">{album.songs.length} tracks</p>
                    </div>
                  </div>
                  <div className="col-span-3 hidden truncate font-light text-muted-foreground md:block">{album.artist}</div>
                  <div className="col-span-3 flex items-center justify-end gap-3 md:col-span-2 md:gap-6">
                    <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 lg:inline">Album</span>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const first = album.songs[0];
                        if (first) playSong(first, album.songs);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-card/80 transition-all group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ScrollArea>
  );
};

export default HomePage;
