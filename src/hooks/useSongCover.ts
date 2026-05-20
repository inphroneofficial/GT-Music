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
  const initial = (() => {
    if (!song) return { src: PLACEHOLDER, loading: false, resolved: false };
    if (coverCache.has(song.id)) return { src: coverCache.get(song.id)!, loading: false, resolved: true };
    const explicitCover = getCoverUrl(song);
    if (explicitCover) return { src: explicitCover, loading: false, resolved: true };
    return { src: PLACEHOLDER, loading: true, resolved: false };
  })();

  const [state, setState] = useState<CoverResult>(initial);

  useEffect(() => {
    if (!song) { setState({ src: PLACEHOLDER, loading: false, resolved: false }); return; }
    const cached = coverCache.get(song.id);
    if (cached) { setState({ src: cached, loading: false, resolved: true }); return; }
    const explicitCover = getCoverUrl(song);
    if (explicitCover) {
      const url = explicitCover;
      coverCache.set(song.id, url);
      setState({ src: url, loading: false, resolved: true });
      return;
    }

    setState({ src: PLACEHOLDER, loading: true, resolved: false });
    const fileUrl = resolveSongFilePath(song.file);
    let cancelled = false;

    const promise =
      inflight.get(song.id) ??
      (() => {
        const p = extractEmbeddedCover(fileUrl)
          .then((url) => { coverCache.set(song.id, url); return url; })
          .catch(() => { coverCache.set(song.id, PLACEHOLDER); return PLACEHOLDER; })
          .finally(() => inflight.delete(song.id));
        inflight.set(song.id, p);
        return p;
      })();

    promise.then((url) => {
      if (!cancelled) setState({ src: url, loading: false, resolved: url !== PLACEHOLDER });
    });
    return () => { cancelled = true; };
  }, [song?.id, song?.cover, song?.file]);

  return state;
}

// Back-compat helper returning only the src
export function useSongCover(song: Song | null | undefined): string {
  return useSongCoverState(song).src;
}
