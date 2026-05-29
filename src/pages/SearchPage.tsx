import { useDeferredValue, useMemo, useState } from 'react';
import { Mic2, Music, Search as SearchIcon, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusic } from '@/contexts/MusicContext';
import { SongRow } from '@/components/SongRow';
import { SongCover } from '@/components/SongCover';
import { AlbumCard } from '@/components/MusicCards';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHorizontalDragScroll } from '@/hooks/useHorizontalDragScroll';
import { MOOD_META, MOOD_ORDER } from '@/lib/moods';
import { getSearchSuggestions, normalizeSearchText, searchLibrary } from '@/lib/search';
import { resolveSongCoverPath } from '@/lib/songMetadata';
import type { SongMood } from '@/types/music';

type Filter = 'all' | 'songs' | 'artists' | 'albums' | 'moods';

const GENRE_GRADIENTS: Record<string, string> = {
  pop: 'from-pink-500 to-violet-500',
  rock: 'from-red-500 to-orange-500',
  'hip-hop': 'from-yellow-500 to-amber-600',
  rap: 'from-yellow-600 to-amber-700',
  electronic: 'from-cyan-500 to-blue-600',
  jazz: 'from-amber-400 to-yellow-600',
  classical: 'from-slate-400 to-gray-600',
  'r&b': 'from-purple-500 to-pink-600',
  country: 'from-orange-400 to-yellow-500',
  indie: 'from-teal-400 to-emerald-600',
  metal: 'from-gray-600 to-red-700',
  blues: 'from-blue-600 to-indigo-700',
  soul: 'from-amber-500 to-orange-600',
  folk: 'from-green-500 to-emerald-600',
};

const SearchPage = () => {
  const navigate = useNavigate();
  const { allSongs, playSong } = useMusic();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { ref: suggestionsRailRef, dragHandlers: suggestionsRailDragHandlers } = useHorizontalDragScroll<HTMLDivElement>();
  const { ref: moodRailRef, dragHandlers: moodRailDragHandlers } = useHorizontalDragScroll<HTMLDivElement>();
  const { ref: filtersRailRef, dragHandlers: filtersRailDragHandlers } = useHorizontalDragScroll<HTMLDivElement>();
  const { ref: genreRailRef, dragHandlers: genreRailDragHandlers } = useHorizontalDragScroll<HTMLDivElement>();
  const { ref: moodResultsRailRef, dragHandlers: moodResultsRailDragHandlers } = useHorizontalDragScroll<HTMLDivElement>();
  const { ref: artistsRailRef, dragHandlers: artistsRailDragHandlers } = useHorizontalDragScroll<HTMLDivElement>();
  const { ref: albumsRailRef, dragHandlers: albumsRailDragHandlers } = useHorizontalDragScroll<HTMLDivElement>();

  const deferredQuery = useDeferredValue(query);
  const rawQ = normalizeSearchText(query);
  const deferredQ = normalizeSearchText(deferredQuery);
  const q = rawQ ? deferredQ : '';
  const isSearchSettling = rawQ !== deferredQ;

  const searchResults = useMemo(() => searchLibrary(allSongs, q), [allSongs, q]);
  const searchSuggestions = useMemo(() => getSearchSuggestions(allSongs), [allSongs]);

  const filteredSongEntries = searchResults.songs;
  const filteredSongs = useMemo(() => filteredSongEntries.map((entry) => entry.song), [filteredSongEntries]);
  const artists = searchResults.artists;
  const albums = searchResults.albums;
  const moods = searchResults.moods;

  const genres = useMemo(() => {
    const set = new Set<string>();
    allSongs.forEach((song) => {
      if (song.genre) set.add(song.genre.toLowerCase());
    });
    return Array.from(set).sort();
  }, [allSongs]);

  const moodCounts = useMemo(() => {
    return MOOD_ORDER.reduce<Record<SongMood, number>>((acc, mood) => {
      acc[mood] = allSongs.filter((song) => song.mood === mood).length;
      return acc;
    }, {} as Record<SongMood, number>);
  }, [allSongs]);

  const totalResults = filteredSongs.length + artists.length + albums.length + moods.length;
  const bestSong = filteredSongEntries[0]?.song;
  const bestReason = filteredSongEntries[0]?.reason;

  const filters: { label: string; value: Filter; count: number }[] = [
    { label: 'All', value: 'all', count: totalResults },
    { label: 'Songs', value: 'songs', count: filteredSongs.length },
    { label: 'Artists', value: 'artists', count: artists.length },
    { label: 'Albums', value: 'albums', count: albums.length },
    { label: 'Moods', value: 'moods', count: moods.length },
  ];

  return (
    <ScrollArea className="h-full">
      <SEO title="Search" description="Search your GT Music library by song, mood, album, artist, or genre." path="/search" />
      <div className="search-page-shell w-full px-3 py-3 pb-8 md:p-6 md:pb-10">
        <div className="mb-4 max-w-full animate-fade-in md:mb-6">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary md:text-[11px] md:tracking-[0.24em]">Library Intelligence</p>
          <h1 className="text-[2rem] font-extrabold tracking-tight text-foreground md:text-3xl">Search</h1>
          <p className="mt-1 max-w-full text-[13px] leading-5 text-muted-foreground md:hidden">
            Find songs by title, mood, singer, album, genre, or file.
          </p>
          <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-muted-foreground md:block">
            Search understands song titles, moods, artists, albums, genres, and file names from your local GT Music catalog.
          </p>
        </div>

        {/* Search input - sticky on mobile */}
        <div className="sticky top-0 z-20 w-full min-w-0 overflow-hidden bg-background/88 pb-3 backdrop-blur-xl md:relative md:bg-transparent md:pb-0 md:backdrop-blur-none">
          <div className="search-input-shell relative mb-3 min-w-0 max-w-2xl animate-fade-in md:mb-6 md:w-full" style={{ animationDelay: '100ms' }}>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-muted-foreground md:left-4 md:h-5 md:w-5" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Song, movie, singer, mood..."
              className="h-12 min-w-0 rounded-2xl border-border/50 bg-card pl-11 pr-3 text-[15px] text-foreground shadow-sm transition-all duration-300 placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-[0_0_26px_hsla(var(--primary)/0.16)] md:h-14 md:pl-12 md:text-base"
            />
          </div>
        </div>

        {!rawQ && searchSuggestions.length > 0 && (
          <div ref={suggestionsRailRef} className="mobile-x-rail mb-5 animate-fade-in md:mb-6 md:flex md:gap-2 md:overflow-x-auto md:pb-1" {...suggestionsRailDragHandlers}>
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="btn-press whitespace-nowrap rounded-full border border-border/40 bg-card/70 px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:text-primary"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {!rawQ && (
          <section className="mb-7 animate-fade-in">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Your Mood</p>
                <h2 className="truncate text-lg font-extrabold text-foreground">Search by feeling</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/mood')}
                className="hidden shrink-0 rounded-full border border-border/40 bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground md:inline-flex"
              >
                View all
              </button>
            </div>
            <div ref={moodRailRef} className="mobile-x-rail md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:pb-0" {...moodRailDragHandlers}>
              {MOOD_ORDER.map((mood, index) => (
                <MoodSearchCard
                  key={mood}
                  mood={mood}
                  count={moodCounts[mood] || 0}
                  delay={index * 45}
                  compact
                  onClick={() => navigate(`/mood/${mood}`)}
                />
              ))}
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:hidden">
              Swipe sideways
            </p>
          </section>
        )}

        {q && (
          <div ref={filtersRailRef} className="mobile-x-rail mb-5 animate-fade-in md:mb-6 md:flex md:gap-2 md:overflow-x-auto md:pb-1" {...filtersRailDragHandlers}>
            {filters.map((item, index) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`btn-press flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 animate-fade-in-scale md:px-4 ${
                  filter === item.value
                    ? 'btn-gradient scale-105 text-primary-foreground shadow-md'
                    : 'border border-border/50 bg-card text-foreground hover:bg-accent'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.label}
                <span className="rounded-full bg-background/20 px-2 py-0.5 text-[10px]">{item.count}</span>
              </button>
            ))}
          </div>
        )}

        {isSearchSettling && (
          <div className="mb-5 grid max-w-3xl gap-2 animate-fade-in" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-14 rounded-2xl bg-muted/40 shimmer"
                style={{ animationDelay: `${index * 45}ms` }}
              />
            ))}
          </div>
        )}

        {q && !isSearchSettling && filter === 'all' && bestSong && (
          <button
            type="button"
            onClick={() => playSong(bestSong, filteredSongs)}
            className="group mb-6 grid w-full max-w-3xl grid-cols-[56px_minmax(0,1fr)] items-center gap-3 rounded-[1.35rem] border border-primary/20 bg-primary/10 p-2.5 text-left shadow-[0_20px_70px_-50px_hsl(var(--primary)/0.85)] transition-all hover:border-primary/35 hover:bg-primary/15 md:mb-7 md:grid-cols-[86px_minmax(0,1fr)_auto] md:gap-4 md:rounded-[1.8rem] md:p-4"
          >
            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-card shadow-lg md:h-[86px] md:w-[86px]">
              <SongCover
                song={bestSong}
                alt={bestSong.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-primary md:gap-2 md:text-[10px] md:tracking-[0.2em]">
                <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" />
                Best match
              </div>
              <h2 className="truncate text-base font-extrabold text-foreground md:text-2xl">{bestSong.title}</h2>
              <p className="truncate text-xs text-muted-foreground md:text-sm">
                {bestSong.artist} / {bestSong.album}
              </p>
              {bestReason ? <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-primary md:text-xs md:tracking-[0.14em]">{bestReason} match</p> : null}
            </div>
            <span className="hidden rounded-full border border-primary/25 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground md:inline-flex">
              Play
            </span>
          </button>
        )}

        {!rawQ && genres.length > 0 && (
          <section className="mb-8 animate-fade-in">
            <h2 className="mb-4 text-lg font-bold text-foreground">Browse by Genre</h2>
            <div ref={genreRailRef} className="mobile-x-rail sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0 md:grid-cols-4" {...genreRailDragHandlers}>
              {genres.map((genre, index) => {
                const gradient = GENRE_GRADIENTS[genre] || 'from-primary to-primary/60';
                return (
                  <button
                    key={genre}
                    onClick={() => navigate(`/genre/${encodeURIComponent(genre)}`)}
                    className={`btn-press relative h-20 min-w-[140px] overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} transition-all hover:scale-105 animate-fade-in-scale sm:min-w-0 md:h-28`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="absolute bottom-3 left-4 truncate pr-4 text-sm font-bold capitalize text-white drop-shadow-lg md:text-lg">
                      {genre}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {!rawQ && genres.length === 0 && (
          <div className="py-20 text-center animate-fade-in md:py-24">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-card animate-float md:h-20 md:w-20">
              <Sparkles className="h-7 w-7 text-muted-foreground md:h-8 md:w-8" />
            </div>
            <p className="text-base font-medium text-muted-foreground md:text-lg">Discover your music</p>
            <p className="mt-1 text-sm text-muted-foreground/60">Search by song, artist, album, genre, or file name</p>
          </div>
        )}

        {q && !isSearchSettling && (filter === 'all' || filter === 'moods') && moods.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-foreground animate-fade-in">Mood lanes</h2>
            <div ref={moodResultsRailRef} className="mobile-x-rail md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:pb-0" {...moodResultsRailDragHandlers}>
              {moods.map((entry, index) => (
                <MoodSearchCard
                  key={entry.mood}
                  mood={entry.mood}
                  count={entry.songs.length}
                  delay={index * 55}
                  onClick={() => navigate(`/mood/${entry.mood}`)}
                />
              ))}
            </div>
          </section>
        )}

        {q && !isSearchSettling && (filter === 'all' || filter === 'songs') && filteredSongs.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-foreground animate-fade-in">Songs</h2>
            <div className="space-y-0.5">
              {filteredSongEntries.map((entry, index) => (
                <div key={entry.song.id} className="animate-slide-in-left" style={{ animationDelay: `${index * 28}ms` }}>
                  <SongRow song={entry.song} index={index} context={filteredSongs} />
                </div>
              ))}
            </div>
          </section>
        )}

        {q && !isSearchSettling && (filter === 'all' || filter === 'artists') && artists.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-foreground animate-fade-in">Artists</h2>
            <div ref={artistsRailRef} className="mobile-x-rail sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0 md:grid-cols-4 lg:grid-cols-5" {...artistsRailDragHandlers}>
              {artists.map((artist, index) => (
                <button
                  key={artist.name}
                  type="button"
                  className="hover-card-lift min-w-[132px] rounded-2xl bg-card/50 p-2.5 text-left transition-all hover:bg-card animate-fade-in-scale sm:min-w-0 md:p-3"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
                >
                  <div className="mb-3 aspect-square w-full overflow-hidden rounded-full bg-accent">
                    <SongCover song={artist.songs[0]} alt={artist.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    <Mic2 className="h-3.5 w-3.5" />
                    Artist
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">{artist.name}</p>
                  <p className="text-xs text-muted-foreground">{artist.songs.length} songs matched</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {q && !isSearchSettling && (filter === 'all' || filter === 'albums') && albums.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-foreground animate-fade-in">Albums</h2>
            <div ref={albumsRailRef} className="mobile-x-rail sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0 md:grid-cols-4 lg:grid-cols-5" {...albumsRailDragHandlers}>
              {albums.map((album, index) => (
                <div key={album.name} className="min-w-[132px] animate-fade-in-scale sm:min-w-0" style={{ animationDelay: `${index * 50}ms` }}>
                  <AlbumCard
                    name={album.name}
                    artist={`${album.artist} / ${album.songs.length} songs`}
                    cover={resolveSongCoverPath(album.cover)}
                    onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {q && !isSearchSettling && totalResults === 0 && (
          <div className="py-16 text-center animate-fade-in md:py-20">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-card animate-float md:h-16 md:w-16">
              <Music className="h-6 w-6 text-muted-foreground md:h-7 md:w-7" />
            </div>
            <p className="text-muted-foreground">
              No results for "<span className="font-medium text-foreground">{query}</span>"
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">Try a movie name, singer, genre, or a word from the file name.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

function MoodSearchCard({
  mood,
  count,
  delay,
  compact = false,
  onClick,
}: {
  mood: SongMood;
  count: number;
  delay: number;
  compact?: boolean;
  onClick: () => void;
}) {
  const meta = MOOD_META[mood];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[1.35rem] border border-border/35 bg-gradient-to-br ${meta.gradient} text-left transition-all hover:-translate-y-1 hover:border-primary/35 animate-fade-in-scale md:min-w-0 md:max-w-none ${
        compact ? 'p-3.5 md:p-4' : 'p-4'
      } ${compact ? 'min-w-[216px] max-w-[216px]' : 'min-w-[228px] max-w-[228px]'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-card/35 opacity-70 transition-opacity group-hover:opacity-40" />
      <div className="relative">
        <div className={`${compact ? 'mb-3' : 'mb-4'} flex items-center justify-between gap-2`}>
          <span className="min-w-0 truncate rounded-full border border-primary/20 bg-background/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary md:px-3 md:text-[10px] md:tracking-[0.18em]">
            {meta.signal}
          </span>
          <span className="shrink-0 rounded-full bg-background/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground md:px-3 md:text-[10px] md:tracking-[0.14em]">
            {count} songs
          </span>
        </div>
        <h3 className={`${compact ? 'text-lg' : 'text-xl'} truncate font-extrabold text-foreground`}>{meta.label}</h3>
        <p className={`${compact ? 'mt-1.5 line-clamp-2 text-xs leading-5' : 'mt-2 line-clamp-2 text-sm leading-6'} text-muted-foreground`}>
          {meta.description}
        </p>
      </div>
    </button>
  );
}

export default SearchPage;
