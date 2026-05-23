import { useEffect, useMemo, useRef, useState } from 'react';
import { SongRow } from '@/components/SongRow';
import type { Song } from '@/types/music';

interface VirtualizedSongListProps {
  songs: Song[];
  context?: Song[];
  showAlbum?: boolean;
  itemHeight?: number;
  maxHeightClassName?: string;
  containerClassName?: string;
}

export function VirtualizedSongList({
  songs,
  context,
  showAlbum = true,
  itemHeight = 76,
  maxHeightClassName = 'max-h-[62vh]',
  containerClassName = 'rounded-[1.75rem] border border-border/30 bg-card/40',
}: VirtualizedSongListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(620);
  const overscan = 6;
  const activeContext = context ?? songs;
  const shouldVirtualize = songs.length > 160;
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

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateHeight = () => {
      setViewportHeight(element.clientHeight || 620);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  if (!shouldVirtualize) {
    return (
      <div
        ref={containerRef}
        className={containerClassName}
      >
        <div className="space-y-0.5">
          {songs.map((song, index) => (
            <SongRow key={song.id} song={song} index={index} context={activeContext} showAlbum={showAlbum} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`virtual-list-surface overflow-auto ${containerClassName} ${maxHeightClassName}`}
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
