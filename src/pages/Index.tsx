import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Clock3,
  Headphones,
  Flame,
  MapPin,
  Play,
  Plus,
  Quote,
  RefreshCcw,
  Shuffle,
  Sparkles,
  TrendingUp,
  Wind,
} from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonCard, SkeletonHero, SkeletonQuickPick } from '@/components/SkeletonCards';
import { Equalizer } from '@/components/Equalizer';
import { DeveloperDialog } from '@/components/DeveloperDialog';
import { MoodCard } from '@/components/MoodCard';
import { SongContextMenu } from '@/components/SongContextMenu';
import { SongCover } from '@/components/SongCover';
import { SEO } from '@/components/SEO';
import { TypingText } from '@/components/TypingText';
import { useHomeAmbient } from '@/hooks/useHomeAmbient';
import { useHorizontalDragScroll } from '@/hooks/useHorizontalDragScroll';
import { groupSongsByMood } from '@/lib/moods';
import { resolveSongCoverPath } from '@/lib/songMetadata';
import type { Song } from '@/types/music';

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
  if (ambientMode === 'storm') return 'Storm Mode Picks';
  if (ambientMode === 'dawn') return 'Morning Reset';
  if (ambientMode === 'sunset') return 'Sunset Rotation';
  if (ambientMode === 'night') return 'After-Hours Queue';
  return weatherLabel ? `Built for ${weatherLabel}` : 'Play for This Moment';
}

function stableHash(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 9973;
  }
  return hash;
}

const HomePage = () => {
  const navigate = useNavigate();
  const { allSongs, recentlyPlayed, playlists, playSong, currentSong, isPlaying, togglePlay, loading, playCounts, playHistory, likedSongIds } = useMusic();
  const { now, weather, quote, ambientMode, greeting, subtitle, loadingWeather, refreshQuote } = useHomeAmbient();
  const deferredSongs = useDeferredValue(allSongs);
  const [featureCycle, setFeatureCycle] = useState(0);

  const recentSongs = useMemo(
    () => recentlyPlayed.map((id) => deferredSongs.find((song) => song.id === id)).filter(Boolean) as Song[],
    [recentlyPlayed, deferredSongs]
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

  useEffect(() => {
    if (featuredPool.length < 2) return;
    const timer = window.setInterval(() => {
      setFeatureCycle((value) => (value + 1) % featuredPool.length);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [featuredPool.length]);

  const weatherIcon = useMemo(
    () => getWeatherIcon(weather?.mood ?? 'unknown', weather?.isDay ?? true),
    [weather?.isDay, weather?.mood]
  );

  const weatherDrivenSongs = useMemo(() => {
    return [...deferredSongs]
      .sort((a, b) => scoreSongForMoment(b, ambientMode, weather?.mood) - scoreSongForMoment(a, ambientMode, weather?.mood))
      .slice(0, 4);
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
    return (withRealPlays.length > 0 ? withRealPlays : sorted).slice(0, 5);
  }, [deferredSongs, playCounts]);

  const worldLineup = useMemo(() => {
    const unique = new Map<string, Song>();
    [
      ...(featured ? [featured] : []),
      ...weatherDrivenSongs,
      ...mostPlayedSongs,
      ...recentSongs,
      ...recommendationPool,
    ].forEach((song) => {
      if (!unique.has(song.id)) unique.set(song.id, song);
    });
    return Array.from(unique.values()).slice(0, 6);
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
    [now]
  );
  const timeLabel = useMemo(
    () => now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    [now]
  );
  const momentTitle = useMemo(() => getMomentTitle(ambientMode, weather?.label), [ambientMode, weather?.label]);
  const WeatherIcon = weatherIcon;
  const featuredCover = featured ? resolveSongCoverPath(featured.cover) : '/image-1.jpeg';

  if (loading) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 pb-32 md:p-12">
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

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full ambient-blob-amber" />
        <div className="pointer-events-none absolute top-[40%] -right-48 h-[500px] w-[500px] rounded-full ambient-blob-violet" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full ambient-blob-rose" />
        <div className="pointer-events-none absolute inset-0 grain-overlay opacity-[0.04]" />
        <div className="pointer-events-none absolute inset-x-[10%] top-0 h-48 rounded-full hero-spotlight opacity-80" />

        <div className="relative z-10 mx-auto max-w-7xl space-y-12 px-4 pb-36 pt-4 md:space-y-20 md:px-10 md:pt-10 lg:px-14">
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.28fr_0.92fr] lg:gap-8">
            <div className="relative overflow-hidden rounded-[2.25rem] border border-border/40 bg-card/55 p-5 shadow-2xl glass-strong animate-fade-in-scale md:rounded-[2.75rem] md:p-8 lg:p-10">
              <div className={`pointer-events-none absolute inset-0 premium-hero-${ambientMode}`} />
              <div className="pointer-events-none absolute -right-14 top-6 h-44 w-44 rounded-full bg-primary/20 blur-3xl float-slow" />
              <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl float-slower" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[2.15rem] border border-white/10 md:rounded-[2.65rem]" />

              <div className="relative space-y-5">
                <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary md:text-xs">
                  <span className="h-px w-8 bg-primary md:w-10" />
                  <span>{greeting}</span>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary/90 shadow-[0_10px_30px_-20px_hsl(var(--primary)/0.7)]">
                    {dateLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  <TypingText
                    phrases={[
                      'Welcome to GT Music',
                      'Your soundtrack for right now',
                      weather ? `Now tuned for ${weather.label.toLowerCase()}` : 'Always ready to play',
                    ]}
                    className="block min-h-[3rem] max-w-3xl font-serif text-[2.75rem] leading-[0.96] tracking-tight text-foreground sm:min-h-[4rem] sm:text-5xl md:min-h-[5rem] md:text-6xl lg:text-7xl"
                  />
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
                    {subtitle}
                  </p>
                </div>

                <SonicGateway
                  featured={featured}
                  featuredCover={featuredCover}
                  lineup={worldLineup}
                  timeLabel={timeLabel}
                  weatherLabel={weather?.label ?? 'Local'}
                  ambientMode={ambientMode}
                  totalPlays={listeningInsights.totalPlays}
                  onPlay={() => {
                    if (featured) playSong(featured, recommendationPool);
                  }}
                />

                <section className="space-y-3">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Your Mood</p>
                      <h2 className="text-xl font-extrabold tracking-tight text-foreground">Pick songs by feeling</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/mood/melodies')}
                      className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                    >
                      View all
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="-mx-6 max-w-[100vw] px-6 xl:mx-0 xl:max-w-full xl:px-0">
                    <div ref={homeMoodRailRef} className="mood-scroll-rail xl:grid-cols-5" {...homeMoodRailDragHandlers}>
                      {moodGroups.map((group) => (
                        <MoodCard
                          key={group.mood}
                          mood={group.mood}
                          songs={group.songs}
                          compact
                          onClick={() => navigate(`/mood/${group.mood}`)}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.65rem] border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_hsla(0,0%,100%,0.1)] backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                      <Clock3 className="h-4 w-4" />
                      Time
                    </div>
                    <div className="text-2xl font-semibold text-foreground sm:text-3xl">{timeLabel}</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">In sync with your current listening hour.</p>
                  </div>

                  <div className="rounded-[1.65rem] border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_hsla(0,0%,100%,0.1)] backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                      <WeatherIcon className="h-4 w-4" />
                      Weather
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-2xl font-semibold text-foreground sm:text-3xl">
                        {loadingWeather ? '--' : `${weather?.temperature ?? '--'}°`}
                      </div>
                      <div className="pb-1 text-xs text-muted-foreground">{weather?.label ?? 'Local'}</div>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">{weather?.locationLabel ?? 'Studio Forecast'}</p>
                  </div>

                  <div className="rounded-[1.65rem] border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_hsla(0,0%,100%,0.1)] backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                      <Sparkles className="h-4 w-4" />
                      Mode
                    </div>
                    <div className="text-lg font-semibold capitalize text-foreground sm:text-xl">{ambientMode}</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">The app shifts tone and suggestions around the moment.</p>
                  </div>

                  <button
                    onClick={refreshQuote}
                    className="group rounded-[1.65rem] border border-white/10 bg-white/5 p-4 text-left shadow-[inset_0_1px_0_hsla(0,0%,100%,0.1)] backdrop-blur-xl transition-colors hover:bg-white/10"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                      <span className="inline-flex items-center gap-2">
                        <Quote className="h-4 w-4" />
                        Quote
                      </span>
                      <RefreshCcw className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                    </div>
                    <p className="line-clamp-3 text-sm leading-6 text-foreground">"{quote.text}"</p>
                    <p className="mt-2 text-xs text-muted-foreground">{quote.author}</p>
                  </button>
                </div>

                <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/10 backdrop-blur-xl">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/10 px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Featured Rotation</p>
                      <p className="mt-1 text-sm text-muted-foreground">Shifts through recent plays, favorites, and mood-based picks.</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <Headphones className="h-3.5 w-3.5" />
                      Premium
                    </span>
                  </div>
                  {featured && (
                    <button
                      onClick={() => playSong(featured, deferredSongs)}
                      className="group grid w-full grid-cols-[84px_1fr_auto] items-center gap-3 p-4 text-left transition-colors hover:bg-white/5 sm:grid-cols-[96px_1fr_auto]"
                    >
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-xl sm:h-24 sm:w-24">
                        <SongCover
                          song={featured}
                          alt={featured.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-serif text-2xl italic text-foreground sm:text-3xl">{featured.title}</h3>
                        <p className="truncate text-sm text-muted-foreground">{featured.artist}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{featured.album}</span>
                          {featured.genre && <span>{featured.genre}</span>}
                        </div>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_30px_-14px_hsl(var(--primary)/0.8)] transition-transform group-hover:scale-105">
                        <Play className="ml-0.5 h-5 w-5 fill-current" />
                      </div>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    onClick={() => {
                      const shuffled = [...deferredSongs].sort(() => Math.random() - 0.5);
                      if (shuffled[0]) playSong(shuffled[0], shuffled);
                    }}
                    className="h-12 gap-3 rounded-full border-0 bg-primary px-7 font-bold text-primary-foreground shadow-[0_0_50px_-10px_hsl(var(--primary)/0.6)] btn-press hover:bg-primary/90 md:h-14 md:px-10"
                  >
                    <Shuffle className="h-4 w-4 md:h-5 md:w-5" />
                    Shuffle Play
                  </Button>
                  <button
                    onClick={() => navigate('/library')}
                    className="flex h-12 items-center gap-2 rounded-full border border-border/60 px-5 transition-colors btn-press hover:bg-card/60 md:h-14 md:px-6"
                    aria-label="Open library"
                  >
                    <Plus className="h-5 w-5" />
                    Open Library
                  </button>
                  <DeveloperDialog variant="gtk" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-[2rem] border border-border/40 bg-card/60 p-5 glass animate-fade-in md:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                      <BarChart3 className="h-4 w-4" />
                      Listening Analysis
                    </div>
                    <h3 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">
                      {listeningInsights.totalPlays} tracked plays
                    </h3>
                    <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                      Your app now tracks repeat habits, peak hours, and favorites.
                    </p>
                  </div>
                  <span className="w-fit shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary">
                    Real usage
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-3">
                  <InsightTile
                    label="Top artist"
                    value={listeningInsights.topArtist}
                    detail={`${listeningInsights.topArtistPlays} plays`}
                  />
                  <InsightTile
                    label="Peak hour"
                    value={listeningInsights.peakHour}
                    detail="When you return most often"
                    valueClassName="text-xl sm:text-2xl"
                  />
                  <InsightTile
                    label="Active days"
                    value={listeningInsights.activeDays}
                    detail="Days with tracked listening"
                    valueClassName="text-xl sm:text-2xl"
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-border/40 bg-card/60 p-5 glass animate-fade-in md:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                      <CalendarDays className="h-4 w-4" />
                      Session Pulse
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{dateLabel}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Made for {ambientMode} energy and quick re-entry into your library.</p>
                  </div>
                  <span className="rounded-full border border-border/50 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {timeLabel}
                  </span>
                </div>
                <div className="space-y-3">
                  {(recentSongs.length > 0 ? recentSongs : weatherDrivenSongs).slice(0, 3).map((song, index) => (
                    <button
                      key={song.id}
                      onClick={() => playSong(song, recentSongs.length > 0 ? recentSongs : weatherDrivenSongs)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
                    >
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl">
                        <SongCover song={song} alt={song.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{song.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {index === 0 ? 'Next' : 'Queue'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border/40 bg-card/60 p-5 glass animate-fade-in md:p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                      <TrendingUp className="h-4 w-4" />
                      Library Snapshot
                    </div>
                    <p className="text-base leading-7 text-foreground">"{quote.text}"</p>
                  </div>
                  <button
                    onClick={refreshQuote}
                    className="tap-target touch-manipulation inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/50 transition-colors hover:bg-card/80"
                    aria-label="Refresh quote"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1">
                    <Flame className="h-3.5 w-3.5" />
                    {allSongs.length} songs
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1">
                    <Headphones className="h-3.5 w-3.5" />
                    {albums.length} albums
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {playlists.length} playlists
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{quote.author}</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 md:gap-8">
              <h2 className="font-serif text-3xl italic text-foreground md:text-5xl">{momentTitle}</h2>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {weatherDrivenSongs.map((song, index) => {
                const isActive = currentSong?.id === song.id;
                return (
                  <SongContextMenu key={song.id} song={song}>
                    <button
                      onClick={() => {
                        if (isActive) togglePlay();
                        else playSong(song, weatherDrivenSongs);
                      }}
                      className="group relative overflow-hidden rounded-[2rem] border border-border/40 bg-card/70 p-4 text-left glass transition-all hover:-translate-y-1 hover:bg-card md:p-5"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl">
                          <SongCover
                            song={song}
                            alt={song.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          {isActive && (
                            <div className="absolute inset-x-2 bottom-2 flex items-center justify-center rounded-full glass py-1">
                              <Equalizer playing={isPlaying} size="sm" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                            {weather?.mood === 'rain' ? 'Rain fit' : ambientMode === 'night' ? 'Night fit' : 'Picked for now'}
                          </p>
                          <h3 className="mt-2 truncate text-lg font-semibold text-foreground">{song.title}</h3>
                          <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
                          <p className="mt-3 text-xs text-muted-foreground">
                            {(song.genre ?? 'Local library')} / {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                          </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
                          <Play className="ml-0.5 h-4 w-4 fill-current" />
                        </div>
                      </div>
                    </button>
                  </SongContextMenu>
                );
              })}
            </div>
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
                    <img src={quickPicks[0].cover} alt={quickPicks[0].name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                  </div>
                  <div className="relative z-10 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Recent</span>
                    <h4 className="mt-1 truncate font-serif text-3xl text-foreground md:mb-2 md:text-4xl">{quickPicks[0].name}</h4>
                    <p className="truncate text-sm text-muted-foreground md:text-base">{quickPicks[0].artist}</p>
                  </div>
                </button>
              )}
              {quickPicks.slice(1, 3).map((album, index) => (
                <button
                  key={album.name}
                  onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}
                  className="group relative flex h-56 flex-col justify-between rounded-[2rem] border border-border/40 p-6 text-left transition-all glass hover:bg-card/70 animate-fade-in-scale md:h-64 md:rounded-[2.5rem] md:p-8"
                  style={{ animationDelay: `${(index + 1) * 80}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="h-14 w-14 overflow-hidden rounded-xl border border-border/40 ring-1 ring-white/5 md:h-16 md:w-16">
                      <img src={album.cover} alt={album.name} className="h-full w-full object-cover" onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }} />
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
              <h2 className="font-serif text-3xl italic text-foreground md:text-5xl">Most Played</h2>
              <div className="h-px flex-1 bg-border/60" />
              <button className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground sm:block md:text-xs">
                Based on your history
              </button>
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:gap-8 lg:grid-cols-5">
              {mostPlayedSongs.map((song, index) => {
                const isActive = currentSong?.id === song.id;
                return (
                  <SongContextMenu key={song.id} song={song}>
                    <div
                      onClick={() => { if (isActive) togglePlay(); else playSong(song, mostPlayedSongs); }}
                      className="group cursor-pointer animate-fade-in-scale"
                      style={{ animationDelay: `${index * 70}ms` }}
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
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-primary/80">{playCounts[song.id] || 0} plays</p>
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
                {recentSongs.slice(0, 5).map((song, index) => {
                  const isActive = currentSong?.id === song.id;
                  return (
                    <SongContextMenu key={song.id} song={song}>
                      <div
                        onClick={() => { if (isActive) togglePlay(); else playSong(song, recentSongs); }}
                        className="group cursor-pointer animate-fade-in-scale"
                        style={{ animationDelay: `${index * 70}ms` }}
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
              {albums.map((album, index) => (
                <button
                  key={album.name}
                  onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}
                  className="group grid w-full grid-cols-12 items-center rounded-2xl border border-transparent px-4 py-4 text-left transition-all hover:border-border/50 hover:bg-card/40 animate-fade-in md:rounded-[2rem] md:px-10 md:py-6"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="col-span-1 hidden font-mono text-xs text-muted-foreground/40 transition-colors group-hover:text-primary md:block">
                    {String(index + 1).padStart(2, '0')}/
                  </div>
                  <div className="col-span-9 flex min-w-0 items-center gap-4 md:col-span-6 md:gap-6">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-card ring-1 ring-border/40 md:h-14 md:w-14 md:rounded-2xl">
                      <img src={album.cover} alt={album.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }} />
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
                      onClick={(event) => {
                        event.stopPropagation();
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

function InsightTile({
  label,
  value,
  detail,
  valueClassName = 'text-base',
}: {
  label: string;
  value: string | number;
  detail: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{label}</p>
      <p className={`mt-2 break-words font-semibold leading-tight text-foreground ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function SonicGateway({
  featured,
  featuredCover,
  lineup,
  timeLabel,
  weatherLabel,
  ambientMode,
  totalPlays,
  onPlay,
}: {
  featured: Song | null;
  featuredCover: string;
  lineup: Song[];
  timeLabel: string;
  weatherLabel: string;
  ambientMode: string;
  totalPlays: number;
  onPlay: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-background/55 shadow-[0_24px_80px_-52px_hsl(var(--primary)/0.75)]">
      <img
        src={featuredCover}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-25 blur-xl"
        onError={(event) => { (event.target as HTMLImageElement).src = '/image-1.jpeg'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/84 to-background/55" />

      <div className="relative grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center md:p-5">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/90">
            <span>GT Signal</span>
            <span className="h-1 w-1 rounded-full bg-primary/70" />
            <span>{timeLabel}</span>
            <span className="h-1 w-1 rounded-full bg-primary/70" />
            <span className="capitalize">{ambientMode}</span>
          </div>
          <h3 className="truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {featured?.title ?? 'Your private music world'}
          </h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {featured ? `${featured.artist} / ${featured.album}` : 'Ready when your library is loaded'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {lineup.slice(0, 5).map((song, index) => (
              <div
                key={song.id}
                className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-card shadow-lg"
                style={{ transform: `translateX(${index === 0 ? 0 : -index * 2}px)` }}
              >
                <SongCover song={song} alt={song.title} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-1 sm:justify-items-end">
          <div className="grid grid-cols-3 gap-2 text-center sm:w-48">
            <SignalMetric label="Weather" value={weatherLabel} />
            <SignalMetric label="Plays" value={`${totalPlays}`} />
            <SignalMetric label="Stack" value={`${lineup.length}`} />
          </div>
          <button
            type="button"
            onClick={onPlay}
            disabled={!featured}
            className="sonic-play-button touch-manipulation flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_40px_-20px_hsl(var(--primary)/0.9)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label="Play featured signal"
          >
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SignalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-foreground">{value}</p>
    </div>
  );
}

export default HomePage;
