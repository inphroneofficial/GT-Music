import { Play, Pause } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { Equalizer } from '@/components/Equalizer';
import { SongContextMenu } from '@/components/SongContextMenu';
import { SongCover } from '@/components/SongCover';
import type { Song } from '@/types/music';

interface SongCardProps {
  song: Song;
  context: Song[];
}

export function SongCard({ song, context }: SongCardProps) {
  const { playSong, currentSong, isPlaying, togglePlay } = useMusic();
  const isActive = currentSong?.id === song.id;

  return (
    <SongContextMenu song={song}>
      <div
        className="group relative p-2.5 md:p-3 rounded-2xl bg-card/50 hover:bg-card transition-all duration-300 cursor-pointer hover-card-lift"
        onClick={() => {
          if (isActive) togglePlay();
          else playSong(song, context);
        }}
      >
        <div className="relative mb-2.5 md:mb-3 rounded-xl overflow-hidden">
          <SongCover
            song={song}
            alt={song.title}
            className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <button className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-10 h-10 md:w-11 md:h-11 rounded-full btn-gradient flex items-center justify-center shadow-xl opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 btn-press active:scale-90">
            {isActive && isPlaying ? (
              <Pause className="w-4 h-4 text-primary-foreground" />
            ) : (
              <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
            )}
          </button>
          {isActive && (
            <div className="absolute top-2 left-2 md:top-3 md:left-3 flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full glass text-[10px] font-semibold text-primary">
              <Equalizer playing={isPlaying} size="sm" />
            </div>
          )}
        </div>
        <p className="text-xs md:text-sm font-semibold text-foreground truncate">{song.title}</p>
        <p className="text-[10px] md:text-xs text-muted-foreground truncate mt-0.5">{song.artist}</p>
      </div>
    </SongContextMenu>
  );
}

interface AlbumCardProps {
  name: string;
  artist: string;
  cover: string;
  onClick: () => void;
}

export function AlbumCard({ name, artist, cover, onClick }: AlbumCardProps) {
  return (
    <div
      className="group relative p-2.5 md:p-3 rounded-2xl bg-card/50 hover:bg-card transition-all duration-300 cursor-pointer hover-card-lift"
      onClick={onClick}
    >
      <div className="relative mb-2.5 md:mb-3 rounded-xl overflow-hidden">
        <img
          src={cover}
          alt={name}
          className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-10 h-10 md:w-11 md:h-11 rounded-full btn-gradient flex items-center justify-center shadow-xl opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 btn-press active:scale-90">
          <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
        </button>
      </div>
      <p className="text-xs md:text-sm font-semibold text-foreground truncate">{name}</p>
      <p className="text-[10px] md:text-xs text-muted-foreground truncate mt-0.5">{artist}</p>
    </div>
  );
}
