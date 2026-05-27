import { useEffect } from 'react';
import type { Song } from '@/types/music';
import { resolveSongCoverPath } from '@/lib/songMetadata';

interface Args {
  song: Song | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (t: number) => void;
}

/**
 * MediaSession + background-playback wiring.
 * - Updates lock-screen, Bluetooth, OS media controls.
 * - Audio keeps playing when the tab is backgrounded / browser closed / screen off
 *   because the Audio element + MediaSession together signal "active media" to the OS.
 */
export function useMediaSession({ song, isPlaying, duration, currentTime, onPlay, onPause, onNext, onPrev, onSeek }: Args) {
  useEffect(() => {
    if (!('mediaSession' in navigator) || !song) return;
    const artworkSrc = resolveSongCoverPath(song.cover);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album,
      artwork: [
        { src: artworkSrc, sizes: '512x512', type: artworkSrc.startsWith('data:image/png') ? 'image/png' : 'image/jpeg' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
    });
  }, [song]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    try {
      ms.setActionHandler('play', () => onPlay());
      ms.setActionHandler('pause', () => onPause());
      ms.setActionHandler('previoustrack', () => onPrev());
      ms.setActionHandler('nexttrack', () => onNext());
      ms.setActionHandler('seekto', (details: MediaSessionActionDetails) => {
        if (typeof details.seekTime === 'number') onSeek(details.seekTime);
      });
      ms.setActionHandler('seekbackward', null);
      ms.setActionHandler('seekforward', null);
    } catch {
      // Some browsers expose Media Session partially; ignore unsupported handlers.
    }
    return () => {
      try {
        ms.setActionHandler('play', null);
        ms.setActionHandler('pause', null);
        ms.setActionHandler('previoustrack', null);
        ms.setActionHandler('nexttrack', null);
        ms.setActionHandler('seekto', null);
        ms.setActionHandler('seekbackward', null);
        ms.setActionHandler('seekforward', null);
      } catch {
        // Ignore cleanup failures from partial Media Session implementations.
      }
    };
  }, [onPlay, onPause, onNext, onPrev, onSeek, currentTime, duration]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(currentTime, duration),
        playbackRate: 1,
      });
    } catch {
      // Safari and older Chromium builds can reject position updates.
    }
  }, [currentTime, duration]);
}
