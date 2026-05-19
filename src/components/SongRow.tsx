import { useState } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { Equalizer } from '@/components/Equalizer';
import { SongContextMenu } from '@/components/SongContextMenu';
import { SongCover } from '@/components/SongCover';
import { formatTime } from '@/lib/formatTime';
import type { Song } from '@/types/music';

interface SongRowProps {
  song: Song;
  index: number;
  context: Song[];
  showAlbum?: boolean;
}

export function SongRow({ song, index, context, showAlbum = true }: SongRowProps) {
  const { playSong, currentSong, isPlaying, togglePlay, isLiked, toggleLike } = useMusic();
  const isActive = currentSong?.id === song.id;
  const [heartAnim, setHeartAnim] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartAnim(true);
    toggleLike(song.id);
    setTimeout(() => setHeartAnim(false), 500);
  };

  return (
    <SongContextMenu song={song}>
      <div
        className={`group flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 song-row-bar ${
          isActive
            ? 'bg-primary/10 border border-primary/20'
            : 'hover:bg-card/80 border border-transparent hover:translate-x-1'
        }`}
        onClick={() => {
          if (isActive) togglePlay();
          else playSong(song, context);
        }}
      >
        {/* Track number / play / equalizer */}
        <div className="w-6 md:w-8 text-center flex-shrink-0">
          {isActive && isPlaying ? (
            <Equalizer playing={isPlaying} size="sm" />
          ) : (
            <>
              <span className={`text-sm tabular-nums group-hover:hidden ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {index + 1}
              </span>
              <button className="hidden group-hover:flex items-center justify-center w-full btn-press">
                {isActive && isPlaying ? (
                  <Pause className="w-4 h-4 text-primary" />
                ) : (
                  <Play className="w-4 h-4 text-foreground" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Cover + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <SongCover
            song={song}
            alt={song.title}
            className="w-9 h-9 md:w-10 md:h-10 rounded-lg object-cover flex-shrink-0 group-hover:shadow-lg transition-shadow duration-300"
          />
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-primary' : 'text-foreground'}`}>{song.title}</p>
            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
          </div>
        </div>

        {/* Album */}
        {showAlbum && (
          <span className="text-xs text-muted-foreground truncate hidden lg:block w-[180px]">{song.album}</span>
        )}

        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex-shrink-0 transition-all duration-200 ${
            isLiked(song.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${heartAnim ? 'animate-heart-pop' : ''}`}
        >
          <Heart className={`w-4 h-4 transition-colors ${isLiked(song.id) ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`} />
        </button>

        {/* Duration */}
        <span className="text-xs text-muted-foreground w-10 md:w-11 text-right tabular-nums flex-shrink-0">{formatTime(song.duration)}</span>
      </div>
    </SongContextMenu>
  );
}
