import { useMemo } from 'react';
import { Play, Shuffle, Heart } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { SongRow } from '@/components/SongRow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/formatTime';

const LikedSongsPage = () => {
  const { allSongs, likedSongIds, playSong } = useMusic();

  const songs = useMemo(
    () => allSongs.filter(s => likedSongIds.includes(s.id)),
    [allSongs, likedSongIds]
  );

  const totalDuration = songs.reduce((acc, s) => acc + s.duration, 0);

  return (
    <ScrollArea className="h-full">
      <div className="pb-32">
        <div className="relative p-6 pb-8 flex items-end gap-6 animate-fade-in">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background" />
          </div>
          <div className="relative z-10 flex items-end gap-6">
            <div className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] rounded-2xl btn-gradient shadow-2xl flex items-center justify-center glow-amber animate-fade-in-scale">
              <Heart className="w-14 h-14 text-primary-foreground fill-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 animate-fade-in" style={{ animationDelay: '100ms' }}>Collection</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight animate-fade-in" style={{ animationDelay: '150ms' }}>Liked Songs</h1>
              <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>
                {songs.length} songs{songs.length > 0 && ` · ${formatTime(totalDuration)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
          {songs.length > 0 && (
            <>
              <button
                onClick={() => playSong(songs[0], songs)}
                className="w-13 h-13 rounded-full btn-gradient flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg glow-amber animate-glow-pulse btn-press"
              >
                <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
              </button>
              <Button variant="ghost" className="rounded-full btn-press" onClick={() => {
                const shuffled = [...songs].sort(() => Math.random() - 0.5);
                if (shuffled[0]) playSong(shuffled[0], shuffled);
              }}>
                <Shuffle className="w-4 h-4 mr-2" /> Shuffle
              </Button>
            </>
          )}
        </div>

        {songs.length > 0 ? (
          <div className="px-2">
            {songs.map((song, i) => (
              <div key={song.id} className="animate-slide-in-left" style={{ animationDelay: `${(i * 40) + 300}ms` }}>
                <SongRow song={song} index={i} context={songs} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-7 h-7 text-muted-foreground animate-pulse-glow" />
            </div>
            <p className="text-muted-foreground text-sm">Songs you like will appear here</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap the heart on any song to save it</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default LikedSongsPage;
