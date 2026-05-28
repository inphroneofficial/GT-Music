import { useEffect, useState } from 'react';
import type { Song } from '@/types/music';
import { hasCustomCover, readSongFileMetadata, resolveSongCoverPath, resolveSongFilePath, SONG_PLACEHOLDER_COVER } from '@/lib/songMetadata';

// In-memory cache of resolved cover URLs keyed by song.id
const coverCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const PLACEHOLDER = SONG_PLACEHOLDER_COVER;

function getCoverUrl(song: Song | null | undefined): string | null {
  if (!song?.cover || !hasCustomCover(song.cover)) return null;
  return resolveSongCoverPath(song.cover);
}

async function extractEmbeddedCover(fileUrl: string): Promise<string> {
  const metadata = await readSongFileMetadata(fileUrl);
  return metadata.coverUrl || PLACEHOLDER;
}

export interface CoverResult {
  src: string;
  loading: boolean;
  resolved: boolean;
}

export function useSongCoverState(song: Song | null | undefined): CoverResult {
  const songId = song?.id;
  const songCover = song?.cover;
  const songFile = song?.file;

  const initial = (() => {
    if (!song) return { src: PLACEHOLDER, loading: false, resolved: false };
    if (coverCache.has(song.id)) return { src: coverCache.get(song.id)!, loading: false, resolved: true };
    const explicitCover = getCoverUrl(song);
    if (explicitCover) return { src: explicitCover, loading: false, resolved: true };
    return { src: PLACEHOLDER, loading: true, resolved: false };
  })();

  const [state, setState] = useState<CoverResult>(initial);

  useEffect(() => {
    if (!songId || !songFile) {
      setState({ src: PLACEHOLDER, loading: false, resolved: false });
      return;
    }

    const cached = coverCache.get(songId);
    if (cached) { setState({ src: cached, loading: false, resolved: true }); return; }
    const explicitCover = songCover && hasCustomCover(songCover) ? resolveSongCoverPath(songCover) : null;
    if (explicitCover) {
      const url = explicitCover;
      coverCache.set(songId, url);
      setState({ src: url, loading: false, resolved: true });
      return;
    }

    setState({ src: PLACEHOLDER, loading: true, resolved: false });
    const fileUrl = resolveSongFilePath(songFile);
    let cancelled = false;

    const promise =
      inflight.get(songId) ??
      (() => {
        const p = extractEmbeddedCover(fileUrl)
          .then((url) => { coverCache.set(songId, url); return url; })
          .catch(() => { coverCache.set(songId, PLACEHOLDER); return PLACEHOLDER; })
          .finally(() => inflight.delete(songId));
        inflight.set(songId, p);
        return p;
      })();

    promise.then((url) => {
      if (!cancelled) setState({ src: url, loading: false, resolved: url !== PLACEHOLDER });
    });
    return () => { cancelled = true; };
  }, [songId, songCover, songFile]);

  return state;
}

// Back-compat helper returning only the src
export function useSongCover(song: Song | null | undefined): string {
  return useSongCoverState(song).src;
}
