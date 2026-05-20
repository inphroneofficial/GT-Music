import { useState, useMemo } from 'react';
import { Search as SearchIcon, Sparkles, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusic } from '@/contexts/MusicContext';
import { SongRow } from '@/components/SongRow';
import { SongCover } from '@/components/SongCover';
import { AlbumCard } from '@/components/MusicCards';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { resolveSongCoverPath } from '@/lib/songMetadata';

type Filter = 'all' | 'songs' | 'artists' | 'albums';

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
  const { allSongs } = useMusic();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const q = query.toLowerCase().trim();

  const filteredSongs = useMemo(() => {
    if (!q) return [];
    return allSongs.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q)
    );
  }, [q, allSongs]);

  const artists = useMemo(() => {
    if (!q) return [];
    const set = new Set<string>();
    allSongs.forEach(s => { if (s.artist.toLowerCase().includes(q)) set.add(s.artist); });
    return Array.from(set);
  }, [q, allSongs]);

  const albums = useMemo(() => {
    if (!q) return [];
    const map = new Map<string, { name: string; artist: string; cover: string }>();
    allSongs.forEach(s => {
      if (s.album.toLowerCase().includes(q) && !map.has(s.album)) {
        map.set(s.album, { name: s.album, artist: s.artist, cover: resolveSongCoverPath(s.cover) });
      }
    });
    return Array.from(map.values());
  }, [q, allSongs]);

  // Genres from songs
  const genres = useMemo(() => {
    const set = new Set<string>();
    allSongs.forEach(s => { if (s.genre) set.add(s.genre.toLowerCase()); });
    return Array.from(set);
  }, [allSongs]);

  const filters: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Songs', value: 'songs' },
    { label: 'Artists', value: 'artists' },
    { label: 'Albums', value: 'albums' },
  ];

  return (
    <ScrollArea className="h-full">
      <SEO title="Search" description="Search your GT Music library by song, album, artist, or genre." path="/search" />
      <div className="p-4 md:p-6 pb-32">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-5 md:mb-6 tracking-tight animate-fade-in">Search</h1>

        {/* Search input — sticky on mobile */}
        <div className="sticky top-0 z-20 md:relative pb-3 md:pb-0 bg-background/80 backdrop-blur-lg md:bg-transparent md:backdrop-blur-none -mx-4 px-4 md:mx-0 md:px-0">
          <div className="relative mb-4 md:mb-6 max-w-lg animate-fade-in" style={{ animationDelay: '100ms' }}>
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="What do you want to listen to?"
              className="pl-12 h-11 md:h-12 bg-card border-border/50 text-foreground placeholder:text-muted-foreground rounded-2xl text-base focus:border-primary/50 transition-all duration-300 focus:shadow-[0_0_20px_hsla(var(--primary)/0.15)]"
            />
          </div>
        </div>

        {/* Filter chips */}
        {q && (
          <div className="flex gap-2 mb-5 md:mb-6 animate-fade-in overflow-x-auto pb-1">
            {filters.map((f, i) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 md:px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 btn-press whitespace-nowrap animate-fade-in-scale ${
                  filter === f.value
                    ? 'btn-gradient text-primary-foreground shadow-md scale-105'
                    : 'bg-card text-foreground hover:bg-accent border border-border/50'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Genre Browse — when no query */}
        {!q && genres.length > 0 && (
          <section className="mb-8 animate-fade-in">
            <h2 className="text-lg font-bold text-foreground mb-4">Browse by Genre</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {genres.map((genre, i) => {
                const gradient = GENRE_GRADIENTS[genre] || 'from-primary to-primary/60';
                return (
                  <button
                    key={genre}
                    onClick={() => navigate(`/genre/${encodeURIComponent(genre)}`)}
                    className={`relative h-24 md:h-28 rounded-2xl bg-gradient-to-br ${gradient} overflow-hidden transition-all hover:scale-105 btn-press animate-fade-in-scale`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className="absolute bottom-3 left-4 text-white font-bold text-base md:text-lg capitalize drop-shadow-lg">{genre}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {!q && genres.length === 0 && (
          <div className="text-center py-20 md:py-24 animate-fade-in">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-card mx-auto mb-5 flex items-center justify-center animate-float">
              <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-base md:text-lg font-medium">Discover your music</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Search by song, artist, or album</p>
          </div>
        )}

        {/* Songs */}
        {q && (filter === 'all' || filter === 'songs') && filteredSongs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3 animate-fade-in">Songs</h2>
            <div className="space-y-0.5">
              {filteredSongs.map((song, i) => (
                <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${i * 40}ms` }}>
                  <SongRow song={song} index={i} context={filteredSongs} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Artists */}
        {q && (filter === 'all' || filter === 'artists') && artists.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3 animate-fade-in">Artists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {artists.map((name, i) => {
                const artistSongs = allSongs.filter(s => s.artist === name);
                return (
                  <div
                    key={name}
                    className="p-3 rounded-2xl bg-card/50 hover:bg-card transition-all cursor-pointer hover-card-lift animate-fade-in-scale"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => navigate(`/artist/${encodeURIComponent(name)}`)}
                  >
                    <div className="w-full aspect-square rounded-full overflow-hidden mb-3 bg-accent">
                      <SongCover
                        song={artistSongs[0]}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">Artist</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Albums */}
        {q && (filter === 'all' || filter === 'albums') && albums.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3 animate-fade-in">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {albums.map((a, i) => (
                <div key={a.name} className="animate-fade-in-scale" style={{ animationDelay: `${i * 60}ms` }}>
                  <AlbumCard name={a.name} artist={a.artist} cover={a.cover} onClick={() => navigate(`/album/${encodeURIComponent(a.name)}`)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {q && filteredSongs.length === 0 && artists.length === 0 && albums.length === 0 && (
          <div className="text-center py-16 md:py-20 animate-fade-in">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center animate-float">
              <Music className="w-6 h-6 md:w-7 md:h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No results for "<span className="text-foreground font-medium">{query}</span>"
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try something else</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default SearchPage;
