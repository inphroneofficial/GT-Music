import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Shuffle } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { SongRow } from '@/components/SongRow';
import { AlbumCard } from '@/components/MusicCards';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { resolveSongCoverPath } from '@/lib/songMetadata';

const ArtistPage = () => {
  const { name } = useParams<{ name: string }>();
  const artistName = decodeURIComponent(name || '');
  const navigate = useNavigate();
  const { allSongs, playSong } = useMusic();

  const songs = useMemo(
    () => allSongs.filter((song) => song.artist === artistName),
    [allSongs, artistName]
  );

  const albums = useMemo(() => {
    const map = new Map<string, { name: string; artist: string; cover: string }>();
    songs.forEach((song) => {
      if (!map.has(song.album)) {
        map.set(song.album, { name: song.album, artist: song.artist, cover: resolveSongCoverPath(song.cover) });
      }
    });
    return Array.from(map.values());
  }, [songs]);

  const cover = songs[0] ? resolveSongCoverPath(songs[0].cover) : '/placeholder.svg';

  return (
    <ScrollArea className="h-full">
      <div className="pb-8 md:pb-10">
        <div className="relative flex items-end gap-6 p-6 pb-8 animate-fade-in">
          <div className="absolute inset-0 overflow-hidden">
            <img src={cover} alt="" className="h-full w-full scale-150 object-cover opacity-20 blur-[60px]" onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </div>
          <div className="relative z-10 flex items-end gap-6">
            <div className="h-[180px] w-[180px] overflow-hidden rounded-full shadow-2xl ring-2 ring-primary/20 transition-transform duration-500 hover:scale-105 animate-fade-in-scale md:h-[200px] md:w-[200px]">
              <img
                src={cover}
                alt={artistName}
                className="h-full w-full object-cover"
                onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary animate-fade-in" style={{ animationDelay: '100ms' }}>Artist</p>
              <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-foreground animate-fade-in md:text-5xl" style={{ animationDelay: '150ms' }}>{artistName}</h1>
              <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>{songs.length} songs</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <button
            onClick={() => songs[0] && playSong(songs[0], songs)}
            className="flex h-13 w-13 items-center justify-center rounded-full btn-gradient shadow-lg transition-transform glow-amber animate-glow-pulse btn-press hover:scale-110 active:scale-95"
          >
            <Play className="ml-0.5 h-6 w-6 text-primary-foreground" />
          </button>
          <Button
            variant="ghost"
            className="rounded-full btn-press"
            onClick={() => {
              const shuffled = [...songs].sort(() => Math.random() - 0.5);
              if (shuffled[0]) playSong(shuffled[0], shuffled);
            }}
          >
            <Shuffle className="mr-2 h-4 w-4" /> Shuffle
          </Button>
        </div>

        <section className="mb-8 px-2">
          <h2 className="mb-3 px-4 text-lg font-bold text-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>Popular</h2>
          {songs.slice(0, 5).map((song, index) => (
            <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${(index * 50) + 350}ms` }}>
              <SongRow song={song} index={index} context={songs} />
            </div>
          ))}
        </section>

        {albums.length > 0 && (
          <section className="px-6">
            <h2 className="mb-4 text-lg font-bold text-foreground animate-fade-in">Albums</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {albums.map((album, index) => (
                <div key={album.name} className="animate-fade-in-scale" style={{ animationDelay: `${index * 60}ms` }}>
                  <AlbumCard
                    name={album.name}
                    artist={album.artist}
                    cover={album.cover}
                    onClick={() => navigate(`/album/${encodeURIComponent(album.name)}`)}
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
