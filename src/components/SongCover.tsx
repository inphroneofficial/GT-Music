import { useSongCoverState } from '@/hooks/useSongCover';
import type { Song } from '@/types/music';
import { ImgHTMLAttributes, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  song: Song | null | undefined;
}

export function SongCover({ song, alt, loading = 'lazy', decoding = 'async', className, ...rest }: Props) {
  const { src, loading: extracting } = useSongCoverState(song);
  const [imgLoaded, setImgLoaded] = useState(false);
  const showSkeleton = extracting || !imgLoaded;

  useEffect(() => {
    setImgLoaded(false);
  }, [src]);

  return (
    <span className={cn('relative block', className)}>
      {showSkeleton && (
        <span className={cn('absolute inset-0 cover-skeleton', className)} aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt ?? song?.title ?? ''}
        loading={loading}
        decoding={decoding}
        onLoad={() => setImgLoaded(true)}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder.svg';
          setImgLoaded(true);
        }}
        className={cn(
          'block w-full h-full object-cover transition-opacity duration-500',
          imgLoaded && !extracting ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...rest}
      />
    </span>
  );
}
