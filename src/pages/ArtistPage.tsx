import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Shuffle } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { SongRow } from '@/components/SongRow';
import { AlbumCard } from '@/components/MusicCards';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const ArtistPage = () => {
  const { name } = useParams<{ name: string }>();
  const artistName = decodeURIComponent(name || '');
  const navigate = useNavigate();
  const { allSongs, playSong } = useMusic();

  const songs = useMemo(
    () => allSongs.filter(s => s.artist === artistName),
    [allSongs, artistName]
  );

  const albums = useMemo(() => {
    const map = new Map<string, { name: string; artist: string; cover: string }>();
    songs.forEach(s => {
      if (!map.has(s.album)) map.set(s.album, { name: s.album, artist: s.artist, cover: `/songs/${s.cover}` });
    });
    return Array.from(map.values());
  }, [songs]);

  const cover = songs[0] ? `/songs/${songs[0].cover}` : '/placeholder.svg';

  return (
    <ScrollArea className="h-full">
      <div className="pb-32">
        {/* Header */}
        <div className="relative p-6 pb-8 flex items-end gap-6 animate-fade-in">
          <div className="absolute inset-0 overflow-hidden">
            <img src={cover} alt="" className="w-full h-full object-cover opacity-20 blur-[60px] scale-150" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </div>
          <div className="relative z-10 flex items-end gap-6">
            <div className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] rounded-full overflow-hidden shadow-2xl ring-2 ring-primary/20 animate-fade-in-scale hover:scale-105 transition-transform duration-500">
              <img
                src={cover}
                alt={artistName}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 animate-fade-in" style={{ animationDelay: '100ms' }}>Artist</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 tracking-tight animate-fade-in" style={{ animationDelay: '150ms' }}>{artistName}</h1>
              <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>{songs.length} songs</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <button
            onClick={() => songs[0] && playSong(songs[0], songs)}
            className="w-13 h-13 rounded-full btn-gradient flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg glow-amber animate-glow-pulse btn-press"
          >
            <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
          </button>
          <Button
            variant="ghost"
            className="rounded-full btn-press"
            onClick={() => {
              const shuffled = [...songs].sort(() => Math.random() - 0.5);
              if (shuffled[0]) playSong(shuffled[0], shuffled);
            }}
          >
            <Shuffle className="w-4 h-4 mr-2" /> Shuffle
          </Button>
        </div>

        {/* Popular songs */}
        <section className="px-2 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-3 px-4 animate-fade-in" style={{ animationDelay: '300ms' }}>Popular</h2>
          {songs.slice(0, 5).map((song, i) => (
            <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${(i * 50) + 350}ms` }}>
              <SongRow song={song} index={i} context={songs} />
            </div>
          ))}
        </section>

        {/* Albums */}
        {albums.length > 0 && (
          <section className="px-6">
            <h2 className="text-lg font-bold text-foreground mb-4 animate-fade-in">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {albums.map((a, i) => (
                <div key={a.name} className="animate-fade-in-scale" style={{ animationDelay: `${i * 60}ms` }}>
                  <AlbumCard
                    name={a.name}
                    artist={a.artist}
                    cover={a.cover}
                    onClick={() => navigate(`/album/${encodeURIComponent(a.name)}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
};

export default ArtistPage;
