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
import { resolveSongCoverPath } from '@/lib/songMetadata';
import type { Song } from '@/types/music';

type Filter = 'all' | 'songs' | 'artists' | 'albums';

type ArtistResult = {
  name: string;
  songs: Song[];
  score: number;
};

type AlbumResult = {
  name: string;
  artist: string;
  cover: string;
  songs: Song[];
  score: number;
};

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

const normalizeSearchText = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/%20/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const compactSearchText = (value: string) => value.replace(/\s+/g, '');

function scoreField(value: string | undefined, query: string, tokens: string[], boost: number) {
  const field = normalizeSearchText(value);
  if (!field || !query) return 0;

  const compactField = compactSearchText(field);
  const compactQuery = compactSearchText(query);
  let score = 0;

  if (field === query) score += boost + 40;
  if (field.startsWith(query)) score += boost + 22;
  if (field.includes(query)) score += boost;
  if (compactQuery.length > 2 && compactField.includes(compactQuery)) score += Math.round(boost * 0.65);

  tokens.forEach((token) => {
    if (field === token) score += 12;
    else if (field.startsWith(token)) score += 9;
    else if (field.includes(token)) score += 6;
    else if (compactField.includes(token)) score += 3;
  });

  return score;
}

function scoreSong(song: Song, query: string, tokens: string[]) {
  return (
    scoreField(song.title, query, tokens, 42) +
    scoreField(song.artist, query, tokens, 32) +
    scoreField(song.album, query, tokens, 28) +
    scoreField(song.mood, query, tokens, 24) +
    scoreField(song.genre, query, tokens, 18) +
    scoreField(song.file, query, tokens, 16)
  );
}

const SearchPage = () => {
  const navigate = useNavigate();
  const { allSongs, playSong } = useMusic();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const deferredQuery = useDeferredValue(query);
  const rawQ = normalizeSearchText(query);
  const deferredQ = normalizeSearchText(deferredQuery);
  const q = rawQ ? deferredQ : '';
  const isSearchSettling = rawQ !== deferredQ;
  const queryTokens = useMemo(() => q.split(' ').filter(Boolean), [q]);

  const filteredSongs = useMemo(() => {
    if (!q) return [];

    return allSongs
      .map((song) => ({ song, score: scoreSong(song, q, queryTokens) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title))
      .map((result) => result.song);
  }, [allSongs, q, queryTokens]);

  const artists = useMemo<ArtistResult[]>(() => {
    if (!q) return [];

    const map = new Map<string, ArtistResult>();

    allSongs.forEach((song) => {
      const name = song.artist || 'Unknown Artist';
      const songScore = scoreSong(song, q, queryTokens);
      const artistScore = scoreField(name, q, queryTokens, 36) + Math.round(songScore * 0.45);
      if (artistScore <= 0) return;

      const existing = map.get(name);
      if (existing) {
        existing.songs.push(song);
        existing.score = Math.max(existing.score, artistScore);
      } else {
        map.set(name, { name, songs: [song], score: artistScore });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [allSongs, q, queryTokens]);

  const albums = useMemo<AlbumResult[]>(() => {
    if (!q) return [];

    const map = new Map<string, AlbumResult>();

    allSongs.forEach((song) => {
      const name = song.album || 'Unknown Album';
      const songScore = scoreSong(song, q, queryTokens);
      const albumScore =
        scoreField(name, q, queryTokens, 36) +
        scoreField(song.artist, q, queryTokens, 18) +
        Math.round(songScore * 0.35);
      if (albumScore <= 0) return;

      const existing = map.get(name);
      if (existing) {
        existing.songs.push(song);
        existing.score = Math.max(existing.score, albumScore);
      } else {
        map.set(name, {
          name,
          artist: song.artist,
          cover: resolveSongCoverPath(song.cover),
          songs: [song],
          score: albumScore,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [allSongs, q, queryTokens]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    allSongs.forEach((song) => {
      if (song.genre) set.add(song.genre.toLowerCase());
    });
    return Array.from(set).sort();
  }, [allSongs]);

  const totalResults = filteredSongs.length + artists.length + albums.length;
  const bestSong = filteredSongs[0];

  const filters: { label: string; value: Filter; count: number }[] = [
    { label: 'All', value: 'all', count: totalResults },
    { label: 'Songs', value: 'songs', count: filteredSongs.length },
    { label: 'Artists', value: 'artists', count: artists.length },
    { label: 'Albums', value: 'albums', count: albums.length },
  ];

  return (
    <ScrollArea className="h-full">
      <SEO title="Search" description="Search your GT Music library by song, mood, album, artist, or genre." path="/search" />
      <div className="p-4 pb-8 md:p-6 md:pb-10">
        <div className="mb-5 animate-fade-in md:mb-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Library Intelligence</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">Search</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Search understands song titles, moods, artists, albums, genres, and file names from your local GT Music catalog.
          </p>
        </div>

        {/* Search input - sticky on mobile */}
        <div className="sticky top-0 z-20 -mx-4 bg-background/86 px-4 pb-3 backdrop-blur-xl md:relative md:mx-0 md:bg-transparent md:px-0 md:pb-0 md:backdrop-blur-none">
          <div className="relative mb-4 max-w-2xl animate-fade-in md:mb-6" style={{ animationDelay: '100ms' }}>
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try song, movie, singer, genre, or file name..."
              className="h-12 rounded-2xl border-border/50 bg-card pl-12 text-base text-foreground shadow-sm transition-all duration-300 placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-[0_0_26px_hsla(var(--primary)/0.16)] md:h-14"
            />
          </div>
        </div>

        {q && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 animate-fade-in md:mb-6">
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
            className="group mb-7 grid w-full max-w-3xl grid-cols-[72px_1fr_auto] items-center gap-4 rounded-[1.8rem] border border-primary/20 bg-primary/10 p-3 text-left shadow-[0_20px_70px_-50px_hsl(var(--primary)/0.85)] transition-all hover:border-primary/35 hover:bg-primary/15 md:grid-cols-[86px_1fr_auto] md:p-4"
          >
            <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl bg-card shadow-lg md:h-[86px] md:w-[86px]">
              <SongCover
                song={bestSong}
                alt={bestSong.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Best match
              </div>
              <h2 className="truncate text-lg font-extrabold text-foreground md:text-2xl">{bestSong.title}</h2>
              <p className="truncate text-sm text-muted-foreground">
                {bestSong.artist} / {bestSong.album}
              </p>
            </div>
            <span className="hidden rounded-full border border-primary/25 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground md:inline-flex">
              Play
            </span>
          </button>
        )}

        {!rawQ && genres.length > 0 && (
          <section className="mb-8 animate-fade-in">
            <h2 className="mb-4 text-lg font-bold text-foreground">Browse by Genre</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {genres.map((genre, index) => {
                const gradient = GENRE_GRADIENTS[genre] || 'from-primary to-primary/60';
                return (
                  <button
                    key={genre}
                    onClick={() => navigate(`/genre/${encodeURIComponent(genre)}`)}
                    className={`btn-press relative h-24 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} transition-all hover:scale-105 animate-fade-in-scale md:h-28`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="absolute bottom-3 left-4 text-base font-bold capitalize text-white drop-shadow-lg md:text-lg">
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

        {q && !isSearchSettling && (filter === 'all' || filter === 'songs') && filteredSongs.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-foreground animate-fade-in">Songs</h2>
            <div className="space-y-0.5">
              {filteredSongs.map((song, index) => (
                <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${index * 28}ms` }}>
                  <SongRow song={song} index={index} context={filteredSongs} />
                </div>
              ))}
            </div>
          </section>
        )}

        {q && !isSearchSettling && (filter === 'all' || filter === 'artists') && artists.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-foreground animate-fade-in">Artists</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {artists.map((artist, index) => (
                <button
                  key={artist.name}
                  type="button"
                  className="hover-card-lift rounded-2xl bg-card/50 p-3 text-left transition-all hover:bg-card animate-fade-in-scale"
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {albums.map((album, index) => (
                <div key={album.name} className="animate-fade-in-scale" style={{ animationDelay: `${index * 50}ms` }}>
                  <AlbumCard
                    name={album.name}
                    artist={`${album.artist} / ${album.songs.length} songs`}
                    cover={album.cover}
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

export default SearchPage;
