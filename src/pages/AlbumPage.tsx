import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Shuffle, Clock } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { SongRow } from '@/components/SongRow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/formatTime';
import { SkeletonRow } from '@/components/SkeletonCards';

const AlbumPage = () => {
  const { name } = useParams<{ name: string }>();
  const albumName = decodeURIComponent(name || '');
  const { allSongs, playSong, loading } = useMusic();

  const songs = useMemo(
    () => allSongs.filter(s => s.album === albumName),
    [allSongs, albumName]
  );

  const cover = songs[0] ? `/songs/${songs[0].cover}` : '/placeholder.svg';
  const artist = songs[0]?.artist || 'Unknown';
  const totalDuration = songs.reduce((acc, s) => acc + s.duration, 0);

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
            <img
              src={cover}
              alt={albumName}
              className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] rounded-2xl shadow-2xl object-cover animate-fade-in-scale hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 animate-fade-in" style={{ animationDelay: '100ms' }}>Album</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight animate-fade-in" style={{ animationDelay: '150ms' }}>{albumName}</h1>
              <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>
                <span className="text-foreground font-medium">{artist}</span> · {songs.length} songs · {formatTime(totalDuration)}
              </p>
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

        {/* Song list header */}
        <div className="flex items-center gap-4 px-8 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] border-b border-border/30 mx-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Title</span>
          <Clock className="w-3.5 h-3.5" />
        </div>

        {/* Songs */}
        <div className="px-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} delay={i * 60} />)
          ) : (
            songs.map((song, i) => (
              <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${(i * 50) + 350}ms` }}>
                <SongRow song={song} index={i} context={songs} showAlbum={false} />
              </div>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default AlbumPage;
