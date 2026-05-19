import { X, Trash2, GripVertical } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { Equalizer } from '@/components/Equalizer';
import { SongCover } from '@/components/SongCover';
import { formatTime } from '@/lib/formatTime';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Song } from '@/types/music';

export function QueuePanel() {
  const { isQueueOpen, setIsQueueOpen, queue, queueIndex, currentSong, isPlaying, playSong, clearQueue, removeFromQueue } = useMusic();

  if (!isQueueOpen) return null;

  const upcoming = queue.slice(queueIndex + 1);

  return (
    <>
      <div className="fixed inset-0 z-[120] flex flex-col bg-background/95 backdrop-blur-xl animate-slide-up md:hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-5 pb-4 pt-5 pt-safe">
          <h3 className="font-bold text-foreground">Queue</h3>
          <div className="flex items-center gap-2">
            {upcoming.length > 0 && (
              <Button variant="ghost" size="icon" className="tap-target touch-manipulation h-8 w-8 rounded-full btn-press text-muted-foreground" onClick={clearQueue}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="tap-target touch-manipulation h-8 w-8 rounded-full btn-press" onClick={() => setIsQueueOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <QueueContent
            currentSong={currentSong}
            isPlaying={isPlaying}
            upcoming={upcoming}
            queue={queue}
            queueIndex={queueIndex}
            playSong={playSong}
            removeFromQueue={removeFromQueue}
          />
        </ScrollArea>
      </div>

      <div className="fixed bottom-[100px] right-4 top-4 z-[120] hidden w-[340px] flex-col overflow-hidden rounded-2xl glass-strong shadow-2xl animate-slide-in-right md:flex">
        <div className="flex items-center justify-between border-b border-border/50 p-5">
          <h3 className="text-sm font-bold text-foreground">Queue</h3>
          <div className="flex items-center gap-1">
            {upcoming.length > 0 && (
              <Button variant="ghost" size="icon" className="tap-target touch-manipulation h-7 w-7 rounded-full btn-press text-muted-foreground" onClick={clearQueue}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="tap-target touch-manipulation h-7 w-7 rounded-full btn-press" onClick={() => setIsQueueOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <QueueContent
            currentSong={currentSong}
            isPlaying={isPlaying}
            upcoming={upcoming}
            queue={queue}
            queueIndex={queueIndex}
            playSong={playSong}
            removeFromQueue={removeFromQueue}
          />
        </ScrollArea>
      </div>
    </>
  );
}

interface QueueContentProps {
  currentSong: Song | null;
  isPlaying: boolean;
  upcoming: Song[];
  queue: Song[];
  queueIndex: number;
  playSong: (song: Song, context?: Song[]) => void;
  removeFromQueue: (index: number) => void;
}

function QueueContent({ currentSong, isPlaying, upcoming, queue, queueIndex, playSong, removeFromQueue }: QueueContentProps) {
  return (
    <>
      {currentSong && (
        <div className="p-4 animate-fade-in">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Now Playing</p>
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-2.5">
            <SongCover
              song={currentSong}
              alt={currentSong.title}
              className="h-10 w-10 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{currentSong.title}</p>
              <p className="truncate text-xs text-muted-foreground">{currentSong.artist}</p>
            </div>
            <Equalizer playing={isPlaying} size="sm" />
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="px-4 pb-4">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {`Next Up · ${upcoming.length} ${upcoming.length === 1 ? 'song' : 'songs'}`}
          </p>
          <div className="space-y-0.5">
            {upcoming.map((song, i) => {
              const queuePosition = queueIndex + 1 + i;

              return (
                <div
                  key={`${song.id}-${queuePosition}`}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-card animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <GripVertical className="h-3.5 w-3.5 flex-shrink-0 cursor-grab text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  <SongCover
                    song={song}
                    alt={song.title}
                    className="h-10 w-10 cursor-pointer rounded-lg object-cover"
                    onClick={() => playSong(song, queue)}
                  />
                  <div className="min-w-0 flex-1" onClick={() => playSong(song, queue)}>
                    <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                  </div>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{formatTime(song.duration)}</span>
                  <button
                    onClick={() => removeFromQueue(queuePosition)}
                  className="touch-manipulation opacity-0 transition-opacity group-hover:opacity-100"
                >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {upcoming.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground animate-fade-in">
          Queue is empty
        </div>
      )}
    </>
  );
}
