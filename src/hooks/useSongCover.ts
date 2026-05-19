import { useEffect, useState } from 'react';
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
import type { Song } from '@/types/music';

// In-memory cache of resolved cover URLs keyed by song.id
const coverCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const PLACEHOLDER = '/placeholder.svg';

function isExplicitCover(cover?: string): boolean {
  if (!cover) return false;
  const c = cover.toLowerCase();
  if (c.includes('default') || c.includes('placeholder')) return false;
  return true;
}

async function extractEmbeddedCover(fileUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    (jsmediatags as any).read(fileUrl, {
      onSuccess: (tag: any) => {
        const pic = tag?.tags?.picture;
        if (!pic) return reject(new Error('no picture'));
        const { data, format } = pic;
        const byteArray = new Uint8Array(data);
        const blob = new Blob([byteArray], { type: format || 'image/jpeg' });
        resolve(URL.createObjectURL(blob));
      },
      onError: (e: any) => reject(e),
    });
  });
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
    if (isExplicitCover(song.cover)) return { src: `/songs/${song.cover}`, loading: false, resolved: true };
    return { src: PLACEHOLDER, loading: true, resolved: false };
  })();

  const [state, setState] = useState<CoverResult>(initial);

  useEffect(() => {
    if (!song) { setState({ src: PLACEHOLDER, loading: false, resolved: false }); return; }
    const cached = coverCache.get(song.id);
    if (cached) { setState({ src: cached, loading: false, resolved: true }); return; }
    if (isExplicitCover(song.cover)) {
      const url = `/songs/${song.cover}`;
      coverCache.set(song.id, url);
      setState({ src: url, loading: false, resolved: true });
      return;
    }

    setState({ src: PLACEHOLDER, loading: true, resolved: false });
    const fileUrl = `/songs/${song.file}`;
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
