import { useMemo, useState } from 'react';
import { SongRow } from '@/components/SongRow';
import type { Song } from '@/types/music';

interface VirtualizedSongListProps {
  songs: Song[];
  context?: Song[];
  showAlbum?: boolean;
  itemHeight?: number;
  maxHeightClassName?: string;
}

export function VirtualizedSongList({
  songs,
  context,
  showAlbum = true,
  itemHeight = 76,
  maxHeightClassName = 'max-h-[62vh]',
}: VirtualizedSongListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const overscan = 6;
  const viewportHeight = 620;
  const activeContext = context ?? songs;
  const totalHeight = songs.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    songs.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan,
  );

  const visibleSongs = useMemo(
    () => songs.slice(startIndex, endIndex),
    [endIndex, songs, startIndex],
  );

  return (
    <div
      className={`virtual-list-surface overflow-auto rounded-[1.75rem] border border-border/30 bg-card/40 ${maxHeightClassName}`}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleSongs.map((song, offset) => {
          const index = startIndex + offset;
          return (
            <div
              key={song.id}
              style={{
                position: 'absolute',
                top: index * itemHeight,
                left: 0,
                right: 0,
              }}
            >
              <SongRow song={song} index={index} context={activeContext} showAlbum={showAlbum} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
