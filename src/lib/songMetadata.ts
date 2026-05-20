import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

export const SONG_PLACEHOLDER_COVER = '/placeholder.svg';
export const SONG_DEFAULT_COVER = 'covers/default.jpg';

export interface SongFileMetadata {
  title?: string;
  artist?: string;
  album?: string;
  coverUrl: string;
}

const metadataCache = new Map<string, SongFileMetadata>();
const inflight = new Map<string, Promise<SongFileMetadata>>();

function bytesToBase64(data: number[] | Uint8Array) {
  const chunkSize = 0x8000;
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

function readRawTags(fileUrl: string) {
  return fetch(fileUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch ${fileUrl}`);
      return response.blob();
    })
    .then((blob) => new Promise<any>((resolve, reject) => {
      (jsmediatags as any).read(blob, {
        onSuccess: (tag: any) => resolve(tag),
        onError: (error: any) => reject(error),
      });
    }));
}

function extractCoverUrl(picture: any): string {
  if (!picture?.data?.length) return SONG_PLACEHOLDER_COVER;
  const base64 = bytesToBase64(picture.data);
  const mime = picture.format || 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

export async function readSongFileMetadata(fileUrl: string): Promise<SongFileMetadata> {
  if (metadataCache.has(fileUrl)) return metadataCache.get(fileUrl)!;
  if (inflight.has(fileUrl)) return inflight.get(fileUrl)!;

  const request = readRawTags(fileUrl)
    .then((result) => {
      const tags = result?.tags ?? {};
      const metadata: SongFileMetadata = {
        title: tags.title || undefined,
        artist: tags.artist || undefined,
        album: tags.album || undefined,
        coverUrl: extractCoverUrl(tags.picture),
      };
      metadataCache.set(fileUrl, metadata);
      return metadata;
    })
    .catch(() => {
      const fallback: SongFileMetadata = { coverUrl: SONG_PLACEHOLDER_COVER };
      metadataCache.set(fileUrl, fallback);
      return fallback;
    })
    .finally(() => inflight.delete(fileUrl));

  inflight.set(fileUrl, request);
  return request;
}

export function resolveSongFilePath(file: string): string {
  if (!file) return '';
  if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('/')) return file;
  if (file.includes('/')) return `/${file}`;
  return `/songs/${file}`;
}

export function hasCustomCover(cover: string | undefined): boolean {
  if (!cover) return false;
  return cover !== SONG_DEFAULT_COVER && cover !== SONG_PLACEHOLDER_COVER;
}

export function resolveSongCoverPath(cover: string | undefined): string {
  if (!cover) return SONG_PLACEHOLDER_COVER;
  if (cover.startsWith('data:') || cover.startsWith('blob:') || cover.startsWith('http://') || cover.startsWith('https://') || cover.startsWith('/')) {
    return cover;
  }
  if (cover.startsWith('Melodies/') || cover.startsWith('songs/')) return `/${cover}`;
  return `/songs/${cover}`;
}
