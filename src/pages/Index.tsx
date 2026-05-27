import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Album,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Clock3,
  Disc3,
  Flame,
  Headphones,
  Heart,
  Library,
  MapPin,
  Mic2,
  Music2,
  Play,
  Plus,
  Quote,
  RefreshCcw,
  Shuffle,
  Sparkles,
  TrendingUp,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonCard, SkeletonHero, SkeletonQuickPick } from '@/components/SkeletonCards';
import { Equalizer } from '@/components/Equalizer';
import { DeveloperDialog } from '@/components/DeveloperDialog';
import { SongContextMenu } from '@/components/SongContextMenu';
import { SongCover } from '@/components/SongCover';
import { SEO } from '@/components/SEO';
import { TypingText } from '@/components/TypingText';
import { useHomeAmbient } from '@/hooks/useHomeAmbient';
import { useHorizontalDragScroll } from '@/hooks/useHorizontalDragScroll';
import { MOOD_META, MOOD_ORDER, groupSongsByMood } from '@/lib/moods';
import { resolveSongCoverPath } from '@/lib/songMetadata';
import type { Song, SongMood } from '@/types/music';

const MOOD_ICONS: Record<SongMood, LucideIcon> = {
  melodies: Music2,
  mass: Flame,
  romantic: Heart,
  emotional: CloudRain,
  uplifting: Sparkles,
};

function getWeatherIcon(mood: 'clear' | 'clouds' | 'rain' | 'storm' | 'mist' | 'snow' | 'unknown', isDay: boolean) {
  if (mood === 'storm') return CloudLightning;
  if (mood === 'rain' || mood === 'snow') return CloudRain;
  if (mood === 'clear' && !isDay) return CloudMoon;
  return CloudSun;
}

function getMoodTags(ambientMode: string, weatherMood?: string) {
  if (weatherMood === 'storm') return ['revenge', 'soundtrack', 'indie', 'mavandaa'];
  if (weatherMood === 'rain') return ['malli', 'indie', 'raaga', 'pavazha'];
  if (ambientMode === 'dawn') return ['aasa', 'ada', 'bhel', 'acoustic'];
  if (ambientMode === 'sunset') return ['kacheri', 'naari', 'malli', 'love'];
  if (ambientMode === 'night') return ['revenge', 'oru', 'pavazha', 'soundtrack'];
  return ['kacheri', 'poor', 'naari', 'tamil'];
}

function scoreSongForMoment(song: Song, ambientMode: string, weatherMood?: string) {
  const haystack = `${song.title} ${song.artist} ${song.album} ${song.genre ?? ''} ${song.mood ?? ''}`.toLowerCase();
  const tags = getMoodTags(ambientMode, weatherMood);
  let score = 0;

  tags.forEach((tag, index) => {
    if (haystack.includes(tag)) score += 7 - index;
  });

  if (weatherMood === 'storm' && song.genre?.toLowerCase().includes('soundtrack')) score += 4;
  if (weatherMood === 'rain' && song.genre?.toLowerCase().includes('indie')) score += 4;
  if (ambientMode === 'day' && song.duration < 240) score += 2;
  if (ambientMode === 'night' && song.duration > 230) score += 2;

  return score;
}

function getMomentTitle(ambientMode: string, weatherLabel?: string) {
  if (ambientMode === 'storm') return 'Storm-ready picks';
  if (ambientMode === 'dawn') return 'Morning reset';
  if (ambientMode === 'sunset') return 'Sunset rotation';
  if (ambientMode === 'night') return 'After-hours queue';
  return weatherLabel ? `Built for ${weatherLabel}` : 'For this moment';
}

function stableHash(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 9973;
  }
  return hash;
}

function uniqueSongs(...collections: Song[][]) {
  const merged = new Map<string, Song>();
  collections.flat().forEach((song) => {
    if (!merged.has(song.id)) merged.set(song.id, song);
  });
  return Array.from(merged.values());
}

function formatDuration(duration: number) {
  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const minutes = Math.floor(safeDuration / 60);
  const seconds = Math.floor(safeDuration % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const HomePage = () => {
  const navigate = useNavigate();
  const {
    allSongs,
    recentlyPlayed,
    playlists,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    loading,
    playCounts,
    playHistory,
    likedSongIds,
  } = useMusic();
  const { now, weather, quote, ambientMode, greeting, subtitle, loadingWeather, refreshQuote } = useHomeAmbient();
  const deferredSongs = useDeferredValue(allSongs);
  const [featureCycle, setFeatureCycle] = useState(0);

  const recentSongs = useMemo(
    () => recentlyPlayed.map((id) => deferredSongs.find((song) => song.id === id)).filter(Boolean) as Song[],
    [recentlyPlayed, deferredSongs],
  );

  const albums = useMemo(() => {
    const map = new Map<string, { name: string; artist: string; cover: string; songs: Song[] }>();
    deferredSongs.forEach((song) => {
      if (!map.has(song.album)) {
        map.set(song.album, { name: song.album, artist: song.artist, cover: resolveSongCoverPath(song.cover), songs: [] });
      }
      map.get(song.album)?.songs.push(song);
    });
    return Array.from(map.values());
  }, [deferredSongs]);

  const recommendationPool = useMemo(() => {
    return [...deferredSongs]
      .map((song, index) => {
        const playScore = playCounts[song.id] || 0;
        const recentIndex = recentlyPlayed.indexOf(song.id);
        const likedBoost = likedSongIds.includes(song.id) ? 18 : 0;
        const recentBoost = recentIndex >= 0 ? Math.max(0, 24 - recentIndex * 4) : 0;
        const trendingBoost = Math.max(0, 12 - index);
        const ambientScore = scoreSongForMoment(song, ambientMode, weather?.mood) * 2;
        const varietyBoost = stableHash(`${song.id}-${ambientMode}`) % 13;

        return {
          song,
          score: playScore * 6 + likedBoost + recentBoost + trendingBoost + ambientScore + varietyBoost,
        };
      })
      .sort((left, right) => right.score - left.score)
      .map((entry) => entry.song);
  }, [ambientMode, deferredSongs, likedSongIds, playCounts, recentlyPlayed, weather?.mood]);

  const featuredPool = useMemo(
    () => recommendationPool.slice(0, Math.min(12, Math.max(4, recommendationPool.length))),
    [recommendationPool],
  );
  const featured = featuredPool.length > 0 ? featuredPool[featureCycle % featuredPool.length] : null;

  const quickPicks = useMemo(() => {
    const featuredAlbum = featured?.album;
    return albums
      .filter((album) => album.name !== featuredAlbum)
      .sort((left, right) => {
        const leftScore = recommendationPool.findIndex((song) => song.album === left.name);
        const rightScore = recommendationPool.findIndex((song) => song.album === right.name);
        return (leftScore === -1 ? Number.MAX_SAFE_INTEGER : leftScore) - (rightScore === -1 ? Number.MAX_SAFE_INTEGER : rightScore);
      })
      .slice(0, 3);
  }, [albums, featured?.album, recommendationPool]);

  const albumShelf = useMemo(() => {
    const merged = new Map<string, { name: string; artist: string; cover: string; songs: Song[] }>();
    [...quickPicks, ...albums].forEach((album) => {
      if (!merged.has(album.name)) merged.set(album.name, album);
    });
    return Array.from(merged.values()).slice(0, 8);
  }, [albums, quickPicks]);

  useEffect(() => {
    if (featuredPool.length < 2) return;
    const timer = window.setInterval(() => {
      setFeatureCycle((value) => (value + 1) % featuredPool.length);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [featuredPool.length]);

  const weatherIcon = useMemo(
    () => getWeatherIcon(weather?.mood ?? 'unknown', weather?.isDay ?? true),
    [weather?.isDay, weather?.mood],
  );

  const weatherDrivenSongs = useMemo(() => {
    return [...deferredSongs]
      .sort((a, b) => scoreSongForMoment(b, ambientMode, weather?.mood) - scoreSongForMoment(a, ambientMode, weather?.mood))
      .slice(0, 6);
  }, [ambientMode, deferredSongs, weather?.mood]);

  const moodGroups = useMemo(() => groupSongsByMood(deferredSongs), [deferredSongs]);
  const {
    ref: homeMoodRailRef,
    dragHandlers: homeMoodRailDragHandlers,
  } = useHorizontalDragScroll<HTMLDivElement>();

  const mostPlayedSongs = useMemo(() => {
    const sorted = [...deferredSongs]
      .sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0));
    const withRealPlays = sorted.filter((song) => (playCounts[song.id] || 0) > 0);
    return (withRealPlays.length > 0 ? withRealPlays : sorted).slice(0, 6);
  }, [deferredSongs, playCounts]);

  const worldLineup = useMemo(() => {
    return uniqueSongs(
      featured ? [featured] : [],
      weatherDrivenSongs,
      mostPlayedSongs,
      recentSongs,
      recommendationPool,
    ).slice(0, 7);
  }, [featured, mostPlayedSongs, recentSongs, recommendationPool, weatherDrivenSongs]);

  const listeningInsights = useMemo(() => {
    const totalPlays = Object.values(playCounts).reduce((sum, count) => sum + count, 0);
    const artistCounts = new Map<string, number>();
    deferredSongs.forEach((song) => {
      artistCounts.set(song.artist, (artistCounts.get(song.artist) || 0) + (playCounts[song.id] || 0));
    });
    const topArtist = Array.from(artistCounts.entries()).sort((a, b) => b[1] - a[1])[0];

    const hourCounts = new Map<number, number>();
    playHistory.forEach((entry) => {
      const hour = new Date(entry.playedAt).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    const peakHour = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      totalPlays,
      topArtist: topArtist?.[0] ?? 'Still warming up',
      topArtistPlays: topArtist?.[1] ?? 0,
      peakHour: typeof peakHour?.[0] === 'number' ? `${String(peakHour[0]).padStart(2, '0')}:00` : 'Anytime',
      activeDays: new Set(playHistory.map((entry) => new Date(entry.playedAt).toDateString())).size,
    };
  }, [deferredSongs, playCounts, playHistory]);

  const dateLabel = useMemo(
    () => now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    [now],
  );
  const timeLabel = useMemo(
    () => now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    [now],
  );
  const momentTitle = useMemo(() => getMomentTitle(ambientMode, weather?.label), [ambientMode, weather?.label]);
  const WeatherIcon = weatherIcon;
  const featuredCover = featured ? resolveSongCoverPath(featured.cover) : '/image-1.jpeg';
  const momentSongs = useMemo(
    () => uniqueSongs(weatherDrivenSongs, recommendationPool, deferredSongs).slice(0, 4),
    [deferredSongs, recommendationPool, weatherDrivenSongs],
  );
  const sessionSongs = recentSongs.length > 0 ? recentSongs.slice(0, 3) : momentSongs.slice(0, 3);

  if (loading) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 pb-8 md:p-12 md:pb-10">
          <SkeletonHero />
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <SkeletonQuickPick key={index} delay={index * 60} />)}
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} delay={index * 80} />)}
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <SEO
        title="Home"
        description="Welcome to GT Music - weather-aware playlists, premium playback, and your library in one place."
        path="/"
      />

      <div className="relative min-h-full w-full max-w-full overflow-x-hidden">
        <div className="pointer-events-none absolute -left-32 -top-28 h-[28rem] w-[28rem] rounded-full ambient-blob-amber opacity-80" />
        <div className="pointer-events-none absolute right-[-16rem] top-24 h-[34rem] w-[34rem] rounded-full ambient-blob-violet opacity-70" />
        <div className="pointer-events-none absolute bottom-8 left-[18%] h-[30rem] w-[30rem] rounded-full ambient-blob-rose opacity-60" />
        <div className="pointer-events-none absolute inset-0 grain-overlay opacity-[0.045]" />
        <div className="pointer-events-none absolute inset-x-[8%] top-0 h-56 rounded-full hero-spotlight opacity-75" />

        <main className="relative z-10 mx-auto box-border flex w-full max-w-[1500px] min-w-0 flex-col gap-4 overflow-hidden px-3 pb-8 pt-4 min-[390px]:px-4 md:gap-5 md:px-6 md:pb-10 md:pt-6 xl:px-8">
          <section className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)]">
            <div className="relative min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/60 p-4 shadow-[0_26px_90px_-58px_hsl(var(--primary)/0.75)] glass-strong animate-fade-in-scale md:rounded-[2.15rem] md:p-6">
              <div className={`pointer-events-none absolute inset-0 premium-hero-${ambientMode}`} />
              <div className="pointer-events-none absolute -right-16 top-4 h-48 w-48 rounded-full bg-primary/20 blur-3xl float-slow" />
              <div className="pointer-events-none absolute -left-14 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl float-slower" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[1.9rem] border border-white/10 md:rounded-[2.5rem]" />

              <div className="relative">
                <div className="mb-4 flex flex-wrap items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-primary md:text-xs">
                  <span className="h-px w-8 bg-primary md:w-12" />
                  <span>{greeting}</span>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary/90">
                    {dateLabel}
                  </span>
                  <span className="w-full sm:w-auto">
                    <DeveloperDialog variant="gtk" />
                  </span>
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-end">
                  <div className="min-w-0">
                    <TypingText
                    phrases={[
                      'Welcome to GT Music',
                      'Your private cloud player',
                      weather ? `Tuned for ${weather.label.toLowerCase()}` : 'Built for your favorite songs',
                    ]}
                      className="block min-h-[5.5rem] max-w-[11ch] whitespace-normal break-words font-serif text-[clamp(2.05rem,8.2vw,4.9rem)] leading-[0.95] tracking-tight text-foreground sm:max-w-4xl md:min-h-[5.9rem]"
                    />
                    <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-muted-foreground sm:text-base">
                      {subtitle} GT Music keeps the focus on your library, your mood, and the songs you actually came here to hear.
                    </p>
                  </div>

                  <div className="hidden rounded-[1.7rem] border border-white/10 bg-background/40 p-4 backdrop-blur-xl lg:block">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-xl">
                        <img
                          src={featuredCover}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(event) => { (event.target as HTMLImageElement).src = '/image-1.jpeg'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Signal</p>
                        <p className="truncate text-sm font-bold text-foreground">{featured?.title ?? 'Ready'}</p>
                        <p className="truncate text-xs text-muted-foreground">{featured?.artist ?? 'GT Music'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    onClick={() => {
                      const shuffled = [...deferredSongs].sort(() => Math.random() - 0.5);
                      if (shuffled[0]) playSong(shuffled[0], shuffled);
                    }}
                    className="h-11 w-full max-w-full gap-3 rounded-full border-0 bg-primary px-7 font-bold text-primary-foreground shadow-[0_0_50px_-10px_hsl(var(--primary)/0.6)] btn-press hover:bg-primary/90 sm:w-auto md:h-12 md:px-8"
                  >
                    <Shuffle className="h-4 w-4 md:h-5 md:w-5" />
                    Shuffle Play
                  </Button>
                  <button
                    onClick={() => navigate('/mood/melodies')}
                    className="flex h-11 w-full max-w-full items-center justify-center gap-2 rounded-full border border-border/50 bg-background/30 px-5 font-bold text-foreground backdrop-blur-xl transition-colors btn-press hover:bg-card/70 sm:w-auto md:h-12 md:px-6"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    Your Mood
                  </button>
                  <button
                    onClick={() => navigate('/library')}
                    className="flex h-11 w-full max-w-full items-center justify-center gap-2 rounded-full border border-border/50 px-5 font-bold transition-colors btn-press hover:bg-card/70 sm:w-auto md:h-12 md:px-6"
                    aria-label="Open library"
                  >
                    <Plus className="h-5 w-5" />
                    Library
                  </button>
                </div>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                  <HomeSignal icon={Clock3} label="Live clock" value={timeLabel} detail="Local listening hour" />
                  <HomeSignal
                    icon={WeatherIcon}
                    label="Weather"
                    value={loadingWeather ? 'Syncing' : `${weather?.temperature ?? '--'} deg`}
                    detail={weather?.locationLabel ?? weather?.label ?? 'Local forecast'}
                  />
                  <HomeSignal icon={Wind} label="Mode" value={ambientMode} detail={`${momentTitle} active`} />
                </div>

                <div className="mt-3 grid gap-2.5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="min-w-0 rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-3 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                      <MapPin className="h-4 w-4 shrink-0" />
                      Local blend
                    </div>
                    <p className="truncate text-base font-black text-foreground">{weather?.locationLabel ?? 'Your listening zone'}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {weather?.label ? `${weather.label} mood shaping today's suggestions.` : 'Weather-aware recommendations return when location is available.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={refreshQuote}
                    className="group min-w-0 rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-3 text-left backdrop-blur-xl transition-colors hover:bg-white/[0.085]"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                      <span className="inline-flex items-center gap-2">
                        <Quote className="h-4 w-4 shrink-0" />
                        Quote
                      </span>
                      <RefreshCcw className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:rotate-180" />
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">"{quote.text}"</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{quote.author}</p>
                  </button>
                </div>
              </div>
            </div>

            <FeaturedPanel
              featured={featured}
              featuredCover={featuredCover}
              lineup={worldLineup}
              ambientMode={ambientMode}
              weatherLabel={weather?.label ?? 'Local'}
              totalPlays={listeningInsights.totalPlays}
              isActive={currentSong?.id === featured?.id}
              isPlaying={isPlaying}
              onPlay={() => {
                if (!featured) return;
                if (currentSong?.id === featured.id) togglePlay();
                else playSong(featured, recommendationPool);
              }}
            />
          </section>

          <section className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(310px,0.9fr)]">
            <div className="relative min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/50 p-4 glass md:rounded-[2rem] md:p-5">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Your Mood</p>
                  <h2 className="text-xl font-black tracking-tight text-foreground md:text-2xl">Pick a lane, not a long page</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/mood')}
                  className="hidden shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="-mx-5 max-w-[100vw] px-5 md:-mx-6 md:px-6">
                <div ref={homeMoodRailRef} className="mood-scroll-rail home-mood-rail" {...homeMoodRailDragHandlers}>
                  {MOOD_ORDER.map((mood) => {
                    const group = moodGroups.find((entry) => entry.mood === mood);
                    return (
                      <HomeMoodCard
                        key={mood}
                        mood={mood}
                        songs={group?.songs ?? []}
                        onClick={() => navigate(`/mood/${mood}`)}
                      />
                    );
                  })}
                </div>
              </div>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground md:hidden">
                Swipe sideways to switch moods
              </p>
            </div>

            <MomentQueue
              title={momentTitle}
              songs={momentSongs}
              context={momentSongs}
              currentSongId={currentSong?.id}
              isPlaying={isPlaying}
              onPlay={(song) => {
                if (currentSong?.id === song.id) togglePlay();
                else playSong(song, momentSongs);
              }}
            />
          </section>

          <section className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(330px,0.72fr)]">
            <HomeShelf
              eyebrow="Repeat radar"
              title="Most Played"
              songs={mostPlayedSongs}
              context={mostPlayedSongs}
              currentSongId={currentSong?.id}
              isPlaying={isPlaying}
              playCounts={playCounts}
              onPlay={(song) => {
                if (currentSong?.id === song.id) togglePlay();
                else playSong(song, mostPlayedSongs);
              }}
            />

            <SessionPanel
              songs={sessionSongs}
              context={sessionSongs}
              dateLabel={dateLabel}
              timeLabel={timeLabel}
              currentSongId={currentSong?.id}
              isPlaying={isPlaying}
              onPlay={(song) => {
                if (currentSong?.id === song.id) togglePlay();
                else playSong(song, sessionSongs);
              }}
            />
          </section>

          <section className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(330px,0.96fr)]">
            <AlbumDock
              albums={albumShelf}
              onOpen={(albumName) => navigate(`/album/${encodeURIComponent(albumName)}`)}
              onPlay={(songs) => {
                if (songs[0]) playSong(songs[0], songs);
              }}
            />

            <div className="min-w-0 max-w-full rounded-[1.75rem] border border-border/40 bg-card/50 p-4 glass md:rounded-[2rem] md:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Listening DNA</p>
                  <h2 className="text-xl font-black tracking-tight text-foreground md:text-2xl">Your library, learning quietly</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                    GT Music shapes the home feed from real usage: recent sessions, favorites, peak hours, and repeat plays.
                  </p>
                </div>
                <button
                  onClick={refreshQuote}
                  className="tap-target touch-manipulation inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/50 transition-colors hover:bg-card/80"
                  aria-label="Refresh quote"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InsightTile label="Top artist" value={listeningInsights.topArtist} detail={`${listeningInsights.topArtistPlays} plays`} />
                <InsightTile label="Peak hour" value={listeningInsights.peakHour} detail="When you return most often" />
                <InsightTile label="Active days" value={listeningInsights.activeDays} detail="Tracked listening days" />
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                  <Quote className="h-4 w-4" />
                  Studio note
                </div>
                <p className="line-clamp-3 text-sm leading-6 text-foreground">"{quote.text}"</p>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{quote.author}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatChip icon={Library} label={`${allSongs.length} songs`} />
                <StatChip icon={Album} label={`${albums.length} albums`} />
                <StatChip icon={Heart} label={`${likedSongIds.length} liked`} />
                <StatChip icon={Headphones} label={`${playlists.length} playlists`} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </ScrollArea>
  );
};

function HomeSignal({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-3 shadow-[inset_0_1px_0_hsla(0,0%,100%,0.08)] backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="truncate text-base font-black capitalize text-foreground md:text-lg">{value}</div>
      <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function FeaturedPanel({
  featured,
  featuredCover,
  lineup,
  ambientMode,
  weatherLabel,
  totalPlays,
  isActive,
  isPlaying,
  onPlay,
}: {
  featured: Song | null;
  featuredCover: string;
  lineup: Song[];
  ambientMode: string;
  weatherLabel: string;
  totalPlays: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <div className="relative min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/60 p-4 shadow-[0_30px_100px_-70px_hsl(var(--primary)/0.85)] glass md:rounded-[2.15rem] md:p-5">
      <img
        src={featuredCover}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.18] blur-2xl"
        onError={(event) => { (event.target as HTMLImageElement).src = '/image-1.jpeg'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/75 to-background/40" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative flex h-full min-h-[21rem] flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Now selected</p>
            <h2 className="mt-2 line-clamp-2 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {featured?.title ?? 'Your music is ready'}
            </h2>
            <p className="mt-2 truncate text-sm text-muted-foreground">
              {featured ? `${featured.artist} / ${featured.album}` : 'Load your library and start playing'}
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            {weatherLabel}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end xl:grid-cols-1">
          <div className="relative mx-auto aspect-square w-full max-w-[13.5rem] md:max-w-[15rem]">
            <div className="absolute inset-0 rounded-full border border-white/10 bg-black/30 vinyl-grooves shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]" />
            <div className="absolute inset-5 rounded-full border border-primary/20 bg-primary/10 blur-md" />
            <div className="absolute inset-[17%] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/10">
              {featured ? (
                <SongCover song={featured} alt={featured.title} className="h-full w-full object-cover" />
              ) : (
                <img src="/image-1.jpeg" alt="" className="h-full w-full object-cover" />
              )}
            </div>
            {isActive && (
              <div className="absolute inset-x-12 bottom-6 flex items-center justify-center rounded-full bg-background/70 py-2 backdrop-blur-xl">
                <Equalizer playing={isPlaying} size="sm" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <MiniMetric label="Mode" value={ambientMode} />
              <MiniMetric label="Plays" value={`${totalPlays}`} />
              <MiniMetric label="Stack" value={`${lineup.length}`} />
            </div>
            <button
              type="button"
              onClick={onPlay}
              disabled={!featured}
              className="sonic-play-button touch-manipulation flex h-12 w-full items-center justify-center gap-3 rounded-full bg-primary px-5 font-black text-primary-foreground shadow-[0_18px_40px_-20px_hsl(var(--primary)/0.9)] transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              aria-label="Play featured signal"
            >
              {isActive && isPlaying ? <Equalizer playing size="sm" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
              {isActive && isPlaying ? 'Playing' : 'Play Signal'}
            </button>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          {lineup.slice(0, 7).map((song, index) => (
            <div
              key={song.id}
              className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-card shadow-lg"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <SongCover song={song} alt={song.title} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeMoodCard({
  mood,
  songs,
  onClick,
}: {
  mood: SongMood;
  songs: Song[];
  onClick: () => void;
}) {
  const meta = MOOD_META[mood];
  const Icon = MOOD_ICONS[mood];
  const samples = songs.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      data-mood-card={mood}
      className="group relative h-[176px] snap-start overflow-hidden rounded-[1.45rem] border border-white/10 bg-card/70 p-3.5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_26px_80px_-54px_hsl(var(--primary)/0.9)]"
      aria-label={`Open ${meta.label} songs`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`} />
      <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/[0.12] blur-2xl transition-transform duration-700 group-hover:scale-125" />
      <div className="relative flex h-full min-w-0 flex-col">
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background/70 text-primary shadow-sm backdrop-blur">
            <Icon className="h-4 w-4" />
          </div>
          <span className="max-w-[7.5rem] shrink-0 truncate rounded-full border border-white/10 bg-background/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            {songs.length} songs
          </span>
        </div>

        <div className="min-h-[4.6rem] min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-primary">{meta.signal}</p>
          <h3 className="mt-1 truncate text-[1.35rem] font-black leading-7 tracking-tight text-foreground">{meta.label}</h3>
          <p className="mt-1 line-clamp-2 break-words text-[12px] leading-5 text-muted-foreground">{meta.description}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex min-w-0 items-center">
            {samples.length > 0 ? (
              samples.map((song, index) => (
                <div
                  key={song.id}
                  className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-background/60 bg-muted shadow-lg"
                  style={{ marginLeft: index === 0 ? 0 : -10 }}
                >
                  <SongCover song={song} alt={song.title} className="h-full w-full object-cover" />
                </div>
              ))
            ) : (
              <span className="truncate rounded-full border border-white/10 bg-background/50 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                Add songs
              </span>
            )}
          </div>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-background/40 text-primary transition-transform group-hover:translate-x-0.5">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}

function MomentQueue({
  title,
  songs,
  context,
  currentSongId,
  isPlaying,
  onPlay,
}: {
  title: string;
  songs: Song[];
  context: Song[];
  currentSongId?: string;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
}) {
  return (
    <div className="min-w-0 max-w-full rounded-[1.75rem] border border-border/40 bg-card/50 p-4 glass md:rounded-[2rem] md:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Smart queue</p>
          <h2 className="text-xl font-black tracking-tight text-foreground md:text-2xl">{title}</h2>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
          {songs.length} picks
        </span>
      </div>

      <div className="space-y-2">
        {songs.map((song, index) => {
          const isActive = currentSongId === song.id;
          return (
            <SongContextMenu key={song.id} song={song}>
              <button
                onClick={() => onPlay(song)}
                className="group grid w-full grid-cols-[1.7rem_3.1rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[1.15rem] border border-white/10 bg-white/[0.045] p-2 text-left transition-colors hover:bg-white/[0.08]"
              >
                <span className="text-center font-mono text-sm text-muted-foreground">{index + 1}</span>
                <div className="relative h-12 w-12 overflow-hidden rounded-[1rem]">
                  <SongCover song={song} alt={song.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  {isActive && (
                    <div className="absolute inset-x-2 bottom-1.5 flex items-center justify-center rounded-full bg-background/70 py-1 backdrop-blur">
                      <Equalizer playing={isPlaying} size="sm" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{song.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                </div>
                <span className="hidden rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:inline-flex">
                  {formatDuration(song.duration)}
                </span>
              </button>
            </SongContextMenu>
          );
        })}
        {songs.length === 0 && (
          <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] px-4 py-8 text-center text-sm text-muted-foreground">
            Add songs to your library and this queue will wake up.
          </div>
        )}
      </div>
      <div className="sr-only">{context.length} songs in this context</div>
    </div>
  );
}

function HomeShelf({
  eyebrow,
  title,
  songs,
  context,
  currentSongId,
  isPlaying,
  playCounts,
  onPlay,
}: {
  eyebrow: string;
  title: string;
  songs: Song[];
  context: Song[];
  currentSongId?: string;
  isPlaying: boolean;
  playCounts: Record<string, number>;
  onPlay: (song: Song) => void;
}) {
  return (
    <div className="min-w-0 max-w-full rounded-[1.75rem] border border-border/40 bg-card/50 p-4 glass md:rounded-[2rem] md:p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <h2 className="text-xl font-black tracking-tight text-foreground md:text-2xl">{title}</h2>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
          {songs.length} tracks
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {songs.map((song, index) => {
          const isActive = currentSongId === song.id;
          return (
            <SongContextMenu key={song.id} song={song}>
              <button
                onClick={() => onPlay(song)}
                className="group min-w-0 animate-fade-in-scale text-left"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="relative mb-2.5 aspect-square overflow-hidden rounded-[1.15rem] border border-white/10 bg-card shadow-xl">
                  <SongCover song={song} alt={song.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl">
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute left-2 top-2 flex items-center rounded-full bg-background/70 px-2 py-1 backdrop-blur">
                      <Equalizer playing={isPlaying} size="sm" />
                    </div>
                  )}
                </div>
                <h3 className="truncate text-sm font-black text-foreground transition-colors group-hover:text-primary">{song.title}</h3>
                <p className="truncate text-xs font-medium text-muted-foreground">{song.artist}</p>
                <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.15em] text-primary/80">
                  {playCounts[song.id] || 0} plays
                </p>
              </button>
            </SongContextMenu>
          );
        })}
        {songs.length === 0 && (
          <div className="col-span-full rounded-[1.4rem] border border-white/10 bg-white/[0.045] px-4 py-8 text-center text-sm text-muted-foreground">
            Play a few songs and this shelf becomes yours.
          </div>
        )}
      </div>
      <div className="sr-only">{context.length} songs in this shelf</div>
    </div>
  );
}

function SessionPanel({
  songs,
  context,
  dateLabel,
  timeLabel,
  currentSongId,
  isPlaying,
  onPlay,
}: {
  songs: Song[];
  context: Song[];
  dateLabel: string;
  timeLabel: string;
  currentSongId?: string;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
}) {
  return (
    <div className="min-w-0 max-w-full rounded-[1.75rem] border border-border/40 bg-card/50 p-4 glass md:rounded-[2rem] md:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            <CalendarDays className="h-4 w-4" />
            Session pulse
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground">{dateLabel}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Fast re-entry into songs that match your last listening trail.</p>
        </div>
        <span className="shrink-0 rounded-full border border-border/50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {timeLabel}
        </span>
      </div>

      <div className="space-y-2">
        {songs.map((song, index) => {
          const isActive = currentSongId === song.id;
          return (
            <SongContextMenu key={song.id} song={song}>
              <button
                onClick={() => onPlay(song)}
                className="flex w-full items-center gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.045] p-2.5 text-left transition-colors hover:bg-white/[0.08]"
              >
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl">
                  <SongCover song={song} alt={song.title} className="h-full w-full object-cover" />
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Equalizer playing={isPlaying} size="sm" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{song.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {index === 0 ? 'Next' : 'Queue'}
                </span>
              </button>
            </SongContextMenu>
          );
        })}
        {songs.length === 0 && (
          <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] px-4 py-8 text-center text-sm text-muted-foreground">
            Your recent trail will appear here after playback.
          </div>
        )}
      </div>
      <div className="sr-only">{context.length} songs in this session</div>
    </div>
  );
}

function AlbumDock({
  albums,
  onOpen,
  onPlay,
}: {
  albums: { name: string; artist: string; cover: string; songs: Song[] }[];
  onOpen: (albumName: string) => void;
  onPlay: (songs: Song[]) => void;
}) {
  return (
    <div className="min-w-0 max-w-full rounded-[1.75rem] border border-border/40 bg-card/50 p-4 glass md:rounded-[2rem] md:p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Album dock</p>
          <h2 className="text-xl font-black tracking-tight text-foreground md:text-2xl">Records ready to open</h2>
        </div>
        <Disc3 className="h-5 w-5 shrink-0 text-primary animate-spin-slow" />
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-1 no-scrollbar md:-mx-6 md:px-6">
        <div className="flex min-w-max gap-3">
          {albums.map((album) => (
            <div
              key={album.name}
              className="group w-[10.75rem] shrink-0 rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-2.5 text-left transition-all hover:-translate-y-0.5 hover:bg-white/[0.08] md:w-[11.75rem]"
            >
              <div className="relative mb-2.5 aspect-square overflow-hidden rounded-[1.1rem] bg-card">
                <button type="button" onClick={() => onOpen(album.name)} className="block h-full w-full">
                  <img
                    src={album.cover}
                    alt={album.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onPlay(album.songs)}
                  className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100"
                  aria-label={`Play ${album.name}`}
                >
                  <Play className="ml-0.5 h-4 w-4 fill-current" />
                </button>
              </div>
              <button type="button" onClick={() => onOpen(album.name)} className="block w-full text-left">
                <h3 className="truncate text-sm font-black text-foreground">{album.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{album.artist}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary/80">{album.songs.length} tracks</p>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-primary">{label}</p>
      <p className="mt-2 line-clamp-2 break-words text-base font-black leading-tight text-foreground">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.055] px-2 py-2 text-center">
      <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xs font-black capitalize text-foreground">{value}</p>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/25 px-3 py-1.5 font-semibold">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {label}
    </span>
  );
}

export default HomePage;
