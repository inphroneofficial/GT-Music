import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Shuffle, Clock } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { SongRow } from '@/components/SongRow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/formatTime';
import { SkeletonRow } from '@/components/SkeletonCards';
import { resolveSongCoverPath } from '@/lib/songMetadata';

const AlbumPage = () => {
  const { name } = useParams<{ name: string }>();
  const albumName = decodeURIComponent(name || '');
  const { allSongs, playSong, loading } = useMusic();

  const songs = useMemo(
    () => allSongs.filter((song) => song.album === albumName),
    [allSongs, albumName]
  );

  const cover = songs[0] ? resolveSongCoverPath(songs[0].cover) : '/placeholder.svg';
  const artist = songs[0]?.artist || 'Unknown';
  const totalDuration = songs.reduce((acc, song) => acc + song.duration, 0);

  return (
    <ScrollArea className="h-full">
      <div className="pb-8 md:pb-10">
        <div className="relative flex items-end gap-6 p-6 pb-8 animate-fade-in">
          <div className="absolute inset-0 overflow-hidden">
            <img src={cover} alt="" className="h-full w-full scale-150 object-cover opacity-20 blur-[60px]" onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </div>
          <div className="relative z-10 flex items-end gap-6">
            <img
              src={cover}
              alt={albumName}
              className="h-[180px] w-[180px] rounded-2xl object-cover shadow-2xl transition-transform duration-500 hover:scale-105 animate-fade-in-scale md:h-[220px] md:w-[220px]"
              onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary animate-fade-in" style={{ animationDelay: '100ms' }}>Album</p>
              <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-foreground animate-fade-in md:text-5xl" style={{ animationDelay: '150ms' }}>{albumName}</h1>
              <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>
                <span className="font-medium text-foreground">{artist}</span> · {songs.length} songs · {formatTime(totalDuration)}
              </p>
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

        <div className="mx-6 flex items-center gap-4 border-b border-border/30 px-8 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Title</span>
          <Clock className="h-3.5 w-3.5" />
        </div>

        <div className="px-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} delay={index * 60} />)
          ) : (
            songs.map((song, index) => (
              <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${(index * 50) + 350}ms` }}>
                <SongRow song={song} index={index} context={songs} showAlbum={false} />
              </div>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default AlbumPage;
