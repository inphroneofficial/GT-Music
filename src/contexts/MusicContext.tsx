import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useMediaSession } from '@/hooks/useMediaSession';
import {
  applyAudioSettings,
  createAudioEngine,
  fadeAudioEngine,
  rampOutputVolume,
  resumeAudioEngine,
  setImmediateAudioLevel,
} from '@/lib/audioEngine';
import { getSongMood } from '@/lib/moods';
import { hasCustomCover, readSongFileMetadata, resolveSongFilePath, SONG_PLACEHOLDER_COVER } from '@/lib/songMetadata';
import { ACCENT_COLORS, DEFAULT_SETTINGS } from '@/types/music';
import type { AppSettings, Playlist, RepeatMode, Song } from '@/types/music';

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  currentTime: number;
  duration: number;
  preferNativeAudio: boolean;
  allSongs: Song[];
  loading: boolean;
  likedSongIds: string[];
  playlists: Playlist[];
  recentlyPlayed: string[];
  playCounts: Record<string, number>;
  playHistory: Array<{ songId: string; playedAt: number }>;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  sleepTimerEnd: number | null;
  setSleepTimer: (minutes: number) => void;
  clearSleepTimer: () => void;
  playSong: (song: Song, context?: Song[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (from: number, to: number) => void;
  toggleLike: (songId: string) => void;
  isLiked: (songId: string) => boolean;
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, songId: string) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  isFullScreen: boolean;
  setIsFullScreen: (v: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (v: boolean) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function applyAccentColor(color: string) {
  const accent = ACCENT_COLORS[color as keyof typeof ACCENT_COLORS];
  if (!accent) return;
  const root = document.documentElement;
  root.style.setProperty('--primary', accent.hsl);
  root.style.setProperty('--ring', accent.hsl);
  root.style.setProperty('--sidebar-primary', accent.hsl);
  root.style.setProperty('--sidebar-ring', accent.hsl);
  root.style.setProperty('--accent-warm', accent.hsl);
}

function applyTheme(mode: 'dark' | 'light' | 'system') {
  const root = document.documentElement;
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const isLight = mode === 'light' || (mode === 'system' && prefersLight);
  root.classList.toggle('light', isLight);
  root.style.colorScheme = isLight ? 'light' : 'dark';
  document.body.style.backgroundColor = isLight ? '#fafafa' : '#0a0a0f';
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  themeMeta?.setAttribute('content', isLight ? '#fafafa' : '#0a0a0f');
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  colorSchemeMeta?.setAttribute('content', isLight ? 'light' : 'dark');
}

function shouldPreferNativeAudio() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function isIOSSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

function isAndroidChrome() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && /Chrome|Chromium/i.test(ua) && !/EdgA|OPR|SamsungBrowser/i.test(ua);
}

function shouldUseEnhancedAudio(settings: AppSettings, preferNativeAudio: boolean) {
  if (preferNativeAudio) return false;
  if (settings.eqPreset !== 'flat') return true;
  if (settings.eqCustomBands.some((band) => band !== 0)) return true;
  if (settings.bassBoost > 0) return true;
  if (settings.normalization) return true;
  if (settings.monoAudio) return true;
  if (settings.stereoWidening > 0) return true;
  if (settings.spatialAudio) return true;
  if (settings.crossfadeDuration > 0) return true;
  return false;
}

function normalizeLibrarySong(song: Song): Song {
  return {
    ...song,
    mood: getSongMood(song),
  };
}

function applyMetadataToSong(song: Song, metadata: { title?: string; artist?: string; album?: string; coverUrl?: string }): Song {
  const nextSong = {
    ...song,
    title: metadata.title || song.title,
    artist: metadata.artist || song.artist,
    album: metadata.album || song.album,
    cover: metadata.coverUrl && metadata.coverUrl !== SONG_PLACEHOLDER_COVER
      ? metadata.coverUrl
      : hasCustomCover(song.cover)
        ? song.cover
        : SONG_PLACEHOLDER_COVER,
  };

  return normalizeLibrarySong(nextSong);
}

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioEngineRef = useRef<ReturnType<typeof createAudioEngine> | null>(null);
  const currentSongRef = useRef<Song | null>(null);
  const queueRef = useRef<Song[]>([]);
  const queueIndexRef = useRef(0);
  const repeatRef = useRef<RepeatMode>('off');
  const shuffleRef = useRef(false);
  const isPlayingRef = useRef(false);
  const transitionTokenRef = useRef(0);
  const audioStateRef = useRef<'idle' | 'loading' | 'ready' | 'ended' | 'error'>('idle');

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [volume, setVolumeState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [likedSongIds, setLikedSongIds] = useState<string[]>(() => loadFromStorage('gt-liked', []));
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadFromStorage('gt-playlists', []));
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>(() => loadFromStorage('gt-recent', []));
  const [playCounts, setPlayCounts] = useState<Record<string, number>>(() => loadFromStorage('gt-play-counts', {}));
  const [playHistory, setPlayHistory] = useState<Array<{ songId: string; playedAt: number }>>(() => loadFromStorage('gt-play-history', []));
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage('gt-settings', DEFAULT_SETTINGS));
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [preferNativeAudio] = useState(() => shouldPreferNativeAudio());
  const [iosSafari] = useState(() => isIOSSafari());
  const [androidChrome] = useState(() => isAndroidChrome());
  const useEnhancedAudio = useMemo(() => shouldUseEnhancedAudio(settings, preferNativeAudio), [settings, preferNativeAudio]);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    applyAccentColor(settings.accentColor);
  }, [settings.accentColor]);

  useEffect(() => {
    applyTheme(settings.theme);
    if (settings.theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => applyTheme('system');
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false';
  }, [settings.reducedMotion]);

  useEffect(() => {
    Promise.allSettled([
      fetch('/songs/manifest.json').then((response) => response.json()),
      fetch('/Melodies/manifest.json').then((response) => response.ok ? response.json() : { songs: [] }),
    ])
      .then(async ([songsResult, melodiesResult]) => {
        const manifestSongs = songsResult.status === 'fulfilled' ? songsResult.value.songs ?? [] : [];
        const melodiesSongs = melodiesResult.status === 'fulfilled' ? melodiesResult.value.songs ?? [] : [];
        const mergedSongs: Song[] = [...manifestSongs, ...melodiesSongs].map(normalizeLibrarySong);
        setAllSongs(mergedSongs);
        setLoading(false);

        const enrichedSongs = await Promise.all(
          mergedSongs.map(async (song) => {
            const metadata = await readSongFileMetadata(resolveSongFilePath(song.file));
            return applyMetadataToSong(song, metadata);
          }),
        );

        setAllSongs(enrichedSongs);
      })
      .catch(() => setLoading(false));
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.loop = false;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.volume = useEnhancedAudio ? volume : 1;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [useEnhancedAudio, volume]);

  const cleanupAudioEngine = useCallback(() => {
    const engine = audioEngineRef.current;
    if (!engine) return;
    try {
      engine.source.disconnect();
    } catch {
      // The source may already be disconnected during audio-mode switches.
    }
    try {
      engine.ctx.close().catch(() => undefined);
    } catch {
      // Closing an already-closed AudioContext is safe to ignore.
    }
    audioEngineRef.current = null;
  }, []);

  const ensureAudioEngine = useCallback(() => {
    if (!useEnhancedAudio) return null;
    const audio = ensureAudio();
    if (audioEngineRef.current) return audioEngineRef.current;
    const engine = createAudioEngine(audio, settings, volume);
    audioEngineRef.current = engine;
    return engine;
  }, [ensureAudio, settings, useEnhancedAudio, volume]);

  const refreshEngineSettings = useCallback((nextSettings = settings, nextVolume = volume) => {
    const audio = ensureAudio();
    const shouldEnhance = shouldUseEnhancedAudio(nextSettings, preferNativeAudio);
    const engine = audioEngineRef.current;
    if (!shouldEnhance) {
      if (engine) cleanupAudioEngine();
      audio.volume = 1;
      audio.playbackRate = nextSettings.playbackSpeed;
      return;
    }
    if (engine) {
      applyAudioSettings(engine, audio, nextSettings, nextVolume);
    } else {
      audio.volume = nextVolume;
      audio.playbackRate = nextSettings.playbackSpeed;
    }
  }, [cleanupAudioEngine, ensureAudio, preferNativeAudio, settings, volume]);

  const updateSongEverywhere = useCallback((songId: string, metadata: { title?: string; artist?: string; album?: string; coverUrl?: string }) => {
    setCurrentSong((existing) => {
      if (!existing || existing.id !== songId) return existing;
      return applyMetadataToSong(existing, metadata);
    });
    setQueue((existing) => existing.map((song) => song.id === songId ? applyMetadataToSong(song, metadata) : song));
    setAllSongs((existing) => existing.map((song) => song.id === songId ? applyMetadataToSong(song, metadata) : song));
  }, []);

  const addToRecent = useCallback((songId: string) => {
    setRecentlyPlayed((existing) => {
      const filtered = existing.filter((id) => id !== songId);
      return [songId, ...filtered].slice(0, 40);
    });
  }, []);

  const trackPlay = useCallback((songId: string) => {
    setPlayCounts((existing) => ({ ...existing, [songId]: (existing[songId] || 0) + 1 }));
    setPlayHistory((existing) => [{ songId, playedAt: Date.now() }, ...existing].slice(0, 500));
  }, []);

  const buildFallbackQueue = useCallback(() => {
    const currentQueue = queueRef.current;
    if (currentQueue.length > 0) return currentQueue;
    return allSongs;
  }, [allSongs]);

  const getNextTrackCandidate = useCallback((direction: 1 | -1 = 1) => {
    const candidateQueue = buildFallbackQueue();
    if (candidateQueue.length === 0) return null;

    const currentIndex = queueRef.current.length > 0
      ? queueIndexRef.current
      : Math.max(0, candidateQueue.findIndex((song) => song.id === currentSongRef.current?.id));

    if (repeatRef.current === 'one' && currentSongRef.current) {
      return { song: currentSongRef.current, index: currentIndex >= 0 ? currentIndex : 0 };
    }

    if (shuffleRef.current && direction === 1 && candidateQueue.length > 1) {
      let nextIndex = Math.floor(Math.random() * candidateQueue.length);
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * candidateQueue.length);
      }
      return { song: candidateQueue[nextIndex], index: nextIndex };
    }

    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const rawIndex = baseIndex + direction;

    if (rawIndex < 0) {
      if (repeatRef.current === 'off') return { song: candidateQueue[0], index: 0 };
      return { song: candidateQueue[candidateQueue.length - 1], index: candidateQueue.length - 1 };
    }

    if (rawIndex >= candidateQueue.length) {
      if (repeatRef.current === 'off') return null;
      return { song: candidateQueue[0], index: 0 };
    }

    return { song: candidateQueue[rawIndex], index: rawIndex };
  }, [buildFallbackQueue]);

  const startSongPlayback = useCallback(async (song: Song, options?: { restart?: boolean; trackAnalytics?: boolean }) => {
    const audio = ensureAudio();
    const engine = ensureAudioEngine();
    await resumeAudioEngine(engine);

    const nextToken = transitionTokenRef.current + 1;
    transitionTokenRef.current = nextToken;
    audioStateRef.current = 'loading';

    const fileUrl = resolveSongFilePath(song.file);
    const restartCurrent = options?.restart && currentSongRef.current?.id === song.id;

    if (!restartCurrent || audio.src !== fileUrl) {
      audio.src = fileUrl;
      audio.load();
    }

    if (options?.restart) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }

    setCurrentSong(song);
    refreshEngineSettings();

    if (engine && settings.fadeInDuration > 0) {
      setImmediateAudioLevel(engine, 0);
    }

    try {
      await audio.play();
      if (transitionTokenRef.current !== nextToken) return;
      audioStateRef.current = 'ready';
      setIsPlaying(true);

      if (engine && settings.fadeInDuration > 0) {
        await fadeAudioEngine(engine, 1, settings.fadeInDuration * 1000);
      }

      if (options?.trackAnalytics !== false) {
        trackPlay(song.id);
      }

      readSongFileMetadata(fileUrl)
        .then((metadata) => updateSongEverywhere(song.id, metadata))
        .catch(() => {});
    } catch {
      audioStateRef.current = 'error';
      setIsPlaying(false);
    }
  }, [ensureAudio, ensureAudioEngine, refreshEngineSettings, settings.fadeInDuration, trackPlay, updateSongEverywhere]);

  const transitionToSong = useCallback(async (song: Song, options?: { trackAnalytics?: boolean }) => {
    const engine = ensureAudioEngine();
    await resumeAudioEngine(engine);

    const fadeOutMs = Math.min(settings.crossfadeDuration * 180, 1200);
    if (engine && currentSongRef.current && fadeOutMs > 0) {
      await fadeAudioEngine(engine, 0, fadeOutMs);
    }

    await startSongPlayback(song, { trackAnalytics: options?.trackAnalytics });
  }, [ensureAudioEngine, settings.crossfadeDuration, startSongPlayback]);

  const ensureQueueSelection = useCallback((song: Song, context?: Song[]) => {
    if (context && context.length > 0) {
      setQueue(context);
      const nextIndex = Math.max(0, context.findIndex((entry) => entry.id === song.id));
      setQueueIndex(nextIndex);
      return;
    }

    if (queueRef.current.length === 0) {
      setQueue(allSongs);
      const nextIndex = Math.max(0, allSongs.findIndex((entry) => entry.id === song.id));
      setQueueIndex(nextIndex);
      return;
    }

    const queueSongIndex = queueRef.current.findIndex((entry) => entry.id === song.id);
    if (queueSongIndex >= 0) {
      setQueueIndex(queueSongIndex);
    }
  }, [allSongs]);

  const playSong = useCallback((song: Song, context?: Song[]) => {
    ensureQueueSelection(song, context);
    transitionToSong(song, { trackAnalytics: true });
    addToRecent(song.id);
  }, [addToRecent, ensureQueueSelection, transitionToSong]);

  const handleResumeRequest = useCallback(async () => {
    const audio = ensureAudio();
    const engine = ensureAudioEngine();
    await resumeAudioEngine(engine);
    audio.muted = false;
    audio.defaultMuted = false;
    audio.volume = useEnhancedAudio ? volume : 1;
    audio.playbackRate = settings.playbackSpeed;

    if (!currentSongRef.current) {
      const fallbackSong = buildFallbackQueue()[0];
      if (fallbackSong) {
        ensureQueueSelection(fallbackSong, buildFallbackQueue());
        await transitionToSong(fallbackSong, { trackAnalytics: false });
      }
      return;
    }

    const resumePosition = audio.currentTime || 0;
    const currentSongFileUrl = resolveSongFilePath(currentSongRef.current.file);
    const needsReload =
      !audio.src ||
      !audio.src.endsWith(encodeURI(currentSongRef.current.file).replace(/#/g, '%23')) ||
      audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;

    if (needsReload) {
      audio.src = currentSongFileUrl;
      audio.load();
    }

    const ended = audio.ended || audioStateRef.current === 'ended' || (!!audio.duration && audio.currentTime >= audio.duration - 0.35);
    if (ended) {
      const nextCandidate = getNextTrackCandidate(1) ?? { song: currentSongRef.current, index: queueIndexRef.current };
      setQueueIndex(nextCandidate.index);
      addToRecent(nextCandidate.song.id);
      await transitionToSong(nextCandidate.song, { trackAnalytics: false });
      return;
    }

    const hardResumeCurrentTrack = async () => {
      const fallbackSong = currentSongRef.current;
      if (!fallbackSong) return;

      const restoreTime = Number.isFinite(resumePosition) ? resumePosition : 0;
      const sourceUrl = resolveSongFilePath(fallbackSong.file);

      audio.pause();
      audio.muted = false;
      audio.defaultMuted = false;
      audio.volume = useEnhancedAudio ? volume : 1;
      audio.src = sourceUrl;
      audio.load();

      const resumePlayback = () => {
        try {
          if (restoreTime > 0) {
            audio.currentTime = Math.min(restoreTime, audio.duration || restoreTime);
          }
        } catch {
          // Restoring time can fail before metadata is available.
        }

        const attemptPlay = () => audio.play()
          .then(() => {
            setIsPlaying(true);
            audioStateRef.current = 'ready';
          })
          .catch(() => {
            audioStateRef.current = 'ready';
          });

        if (iosSafari) {
          window.setTimeout(() => {
            try {
              audio.pause();
            } catch {
              // iOS can reject pause during quick lock-screen recovery.
            }
            window.setTimeout(() => {
              attemptPlay();
            }, 80);
          }, 40);
          return;
        }

        attemptPlay().then?.(() => {});
      };

      if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resumePlayback();
      } else {
        audio.addEventListener('canplay', resumePlayback, { once: true });
      }
    };

    try {
      await audio.play();
      setIsPlaying(true);
      audioStateRef.current = 'ready';
      if (iosSafari && document.visibilityState !== 'visible') {
        window.setTimeout(() => {
          hardResumeCurrentTrack().catch(() => {});
        }, 120);
      } else if (androidChrome && document.visibilityState !== 'visible') {
        window.setTimeout(() => {
          if (!audio.paused && currentSongRef.current) {
            hardResumeCurrentTrack().catch(() => {});
          }
        }, 180);
      }
    } catch {
      hardResumeCurrentTrack().catch(() => {});
    }
  }, [addToRecent, androidChrome, buildFallbackQueue, ensureAudio, ensureAudioEngine, ensureQueueSelection, getNextTrackCandidate, iosSafari, settings.playbackSpeed, transitionToSong, useEnhancedAudio, volume]);

  const togglePlay = useCallback(() => {
    const audio = ensureAudio();
    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    handleResumeRequest();
  }, [ensureAudio, handleResumeRequest]);

  const nextTrack = useCallback(() => {
    const candidate = getNextTrackCandidate(1);
    if (!candidate) return;
    setQueueIndex(candidate.index);
    addToRecent(candidate.song.id);
    transitionToSong(candidate.song, { trackAnalytics: true });
  }, [addToRecent, getNextTrackCandidate, transitionToSong]);

  const prevTrack = useCallback(() => {
    const audio = ensureAudio();
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const candidate = getNextTrackCandidate(-1);
    if (!candidate) return;
    setQueueIndex(candidate.index);
    addToRecent(candidate.song.id);
    transitionToSong(candidate.song, { trackAnalytics: true });
  }, [addToRecent, ensureAudio, getNextTrackCandidate, transitionToSong]);

  const handleTrackEnd = useCallback(() => {
    audioStateRef.current = 'ended';
    if (repeatRef.current === 'one' && currentSongRef.current) {
      startSongPlayback(currentSongRef.current, { restart: true, trackAnalytics: false });
      return;
    }

    const candidate = getNextTrackCandidate(1);
    if (!candidate) {
      setIsPlaying(false);
      return;
    }

    setQueueIndex(candidate.index);
    addToRecent(candidate.song.id);
    transitionToSong(candidate.song, { trackAnalytics: true });
  }, [addToRecent, getNextTrackCandidate, startSongPlayback, transitionToSong]);

  useEffect(() => {
    const audio = ensureAudio();

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      audioStateRef.current = 'ready';
    };
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onPlay = () => {
      setIsPlaying(true);
      audioStateRef.current = 'ready';
    };
    const onPause = () => {
      setIsPlaying(false);
      if (!audio.ended) audioStateRef.current = 'idle';
    };
    const onEnded = () => handleTrackEnd();
    const onWaiting = () => {
      if (isPlayingRef.current) audioStateRef.current = 'loading';
    };
    const onPlaying = () => {
      audioStateRef.current = 'ready';
      setIsPlaying(true);
    };
    const onError = () => {
      audioStateRef.current = 'error';
      setIsPlaying(false);
    };
    const onCanPlay = () => {
      if (audioStateRef.current === 'loading') {
        audioStateRef.current = 'ready';
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('stalled', onWaiting);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('stalled', onWaiting);
      audio.removeEventListener('error', onError);
    };
  }, [ensureAudio, handleTrackEnd]);

  useEffect(() => {
    const recoverPlayback = () => {
      if (!currentSongRef.current || !isPlayingRef.current) return;
      resumeAudioEngine(audioEngineRef.current).catch(() => {});
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.defaultMuted = false;
        audioRef.current.volume = useEnhancedAudio ? volume : 1;
      }
      if (audioRef.current?.paused && audioStateRef.current !== 'ended') {
        audioRef.current.play().catch(() => {});
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        window.setTimeout(recoverPlayback, 120);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', recoverPlayback);
    window.addEventListener('focus', recoverPlayback);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', recoverPlayback);
      window.removeEventListener('focus', recoverPlayback);
    };
  }, [useEnhancedAudio, volume]);

  useEffect(() => {
    refreshEngineSettings();
  }, [refreshEngineSettings, settings, useEnhancedAudio, volume]);

  useEffect(() => {
    localStorage.setItem('gt-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('gt-liked', JSON.stringify(likedSongIds));
  }, [likedSongIds]);

  useEffect(() => {
    localStorage.setItem('gt-playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('gt-recent', JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  useEffect(() => {
    localStorage.setItem('gt-play-counts', JSON.stringify(playCounts));
  }, [playCounts]);

  useEffect(() => {
    localStorage.setItem('gt-play-history', JSON.stringify(playHistory));
  }, [playHistory]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((existing) => {
      const merged = { ...existing, ...partial };
      window.requestAnimationFrame(() => refreshEngineSettings(merged, volume));
      return merged;
    });
  }, [refreshEngineSettings, volume]);

  const setSleepTimer = useCallback((minutes: number) => {
    const end = Date.now() + minutes * 60 * 1000;
    setSleepTimerEnd(end);
    toast.success(`Sleep timer set for ${minutes} min`);
  }, []);

  const clearSleepTimer = useCallback(() => {
    setSleepTimerEnd(null);
    toast.success('Sleep timer cleared');
  }, []);

  useEffect(() => {
    if (!sleepTimerEnd) return;
    const timer = window.setInterval(() => {
      if (Date.now() >= sleepTimerEnd) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setSleepTimerEnd(null);
        toast.info('Sleep timer - playback paused');
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sleepTimerEnd]);

  const seek = useCallback((time: number) => {
    const audio = ensureAudio();
    audio.currentTime = clamp(time, 0, duration || 0);
    setCurrentTime(audio.currentTime);
  }, [duration, ensureAudio]);

  const setVolume = useCallback((nextVolume: number) => {
    const clamped = clamp(nextVolume, 0, 1);
    setVolumeState(clamped);
    const audio = ensureAudio();
    const engine = audioEngineRef.current;
    if (engine && useEnhancedAudio) {
      applyAudioSettings(engine, audio, settings, clamped);
      rampOutputVolume(engine, clamped);
      if (!audio.paused) {
        resumeAudioEngine(engine).catch(() => {});
      }
    } else {
      audio.volume = clamped;
    }
  }, [ensureAudio, settings, useEnhancedAudio]);

  const toggleShuffle = useCallback(() => setShuffle((existing) => !existing), []);
  const toggleRepeat = useCallback(() => {
    setRepeat((existing) => existing === 'off' ? 'all' : existing === 'all' ? 'one' : 'off');
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue((existing) => [...existing, song]);
  }, []);

  const playNext = useCallback((song: Song) => {
    setQueue((existing) => {
      const nextQueue = [...existing];
      nextQueue.splice(queueIndexRef.current + 1, 0, song);
      return nextQueue;
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((existing) => existing.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue(currentSongRef.current ? [currentSongRef.current] : []);
    setQueueIndex(0);
    toast.success('Queue cleared');
  }, []);

  const reorderQueue = useCallback((from: number, to: number) => {
    setQueue((existing) => {
      const nextQueue = [...existing];
      const [item] = nextQueue.splice(from, 1);
      nextQueue.splice(to, 0, item);
      return nextQueue;
    });
  }, []);

  const toggleLike = useCallback((songId: string) => {
    setLikedSongIds((existing) => (
      existing.includes(songId)
        ? existing.filter((id) => id !== songId)
        : [...existing, songId]
    ));
  }, []);

  const isLiked = useCallback((songId: string) => likedSongIds.includes(songId), [likedSongIds]);

  const createPlaylist = useCallback((name: string) => {
    const playlist: Playlist = { id: `pl-${Date.now()}`, name, songIds: [], createdAt: Date.now() };
    setPlaylists((existing) => [...existing, playlist]);
    return playlist;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((existing) => existing.filter((playlist) => playlist.id !== id));
  }, []);

  const renamePlaylist = useCallback((id: string, name: string) => {
    setPlaylists((existing) => existing.map((playlist) => playlist.id === id ? { ...playlist, name } : playlist));
  }, []);

  const addToPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists((existing) => existing.map((playlist) => (
      playlist.id === playlistId && !playlist.songIds.includes(songId)
        ? { ...playlist, songIds: [...playlist.songIds, songId] }
        : playlist
    )));
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists((existing) => existing.map((playlist) => (
      playlist.id === playlistId
        ? { ...playlist, songIds: playlist.songIds.filter((id) => id !== songId) }
        : playlist
    )));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      }
      if (event.code === 'ArrowRight' && event.shiftKey) nextTrack();
      if (event.code === 'ArrowLeft' && event.shiftKey) prevTrack();
      if (event.code === 'KeyM' && !event.ctrlKey && !event.metaKey) setVolume(volume === 0 ? 0.7 : 0);
      if (event.code === 'KeyL' && !event.ctrlKey && !event.metaKey && currentSongRef.current) toggleLike(currentSongRef.current.id);
      if (event.code === 'KeyF' && !event.ctrlKey && !event.metaKey) setIsFullScreen((existing) => !existing);
      if (event.code === 'KeyQ' && !event.ctrlKey && !event.metaKey) setIsQueueOpen((existing) => !existing);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [nextTrack, prevTrack, setVolume, toggleLike, togglePlay, volume]);

  useMediaSession({
    song: currentSong,
    isPlaying,
    duration,
    currentTime,
    onPlay: handleResumeRequest,
    onPause: () => audioRef.current?.pause(),
    onNext: nextTrack,
    onPrev: prevTrack,
    onSeek: seek,
  });

  useEffect(() => {
    if (!settings.gapless || queue.length === 0 || !duration) return;
    if (currentTime / duration < 0.45) return;
    const nextCandidate = getNextTrackCandidate(1);
    if (!nextCandidate) return;

    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'audio';
    preload.href = resolveSongFilePath(nextCandidate.song.file);
    document.head.appendChild(preload);

    return () => {
      try {
        document.head.removeChild(preload);
      } catch {
        // Preload may already be gone after route/player teardown.
      }
    };
  }, [currentTime, duration, getNextTrackCandidate, queue.length, settings.gapless]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      cleanupAudioEngine();
    };
  }, [cleanupAudioEngine]);

  const value = useMemo<MusicContextType>(() => ({
    currentSong,
    isPlaying,
    queue,
    queueIndex,
    shuffle,
    repeat,
    volume,
    currentTime,
    duration,
    preferNativeAudio,
    allSongs,
    loading,
    likedSongIds,
    playlists,
    recentlyPlayed,
    playCounts,
    playHistory,
    settings,
    updateSettings,
    sleepTimerEnd,
    setSleepTimer,
    clearSleepTimer,
    playSong,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
    playNext,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    toggleLike,
    isLiked,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    isFullScreen,
    setIsFullScreen,
    isQueueOpen,
    setIsQueueOpen,
  }), [
    addToPlaylist,
    addToQueue,
    allSongs,
    clearQueue,
    clearSleepTimer,
    createPlaylist,
    currentSong,
    currentTime,
    deletePlaylist,
    duration,
    isFullScreen,
    isLiked,
    isPlaying,
    isQueueOpen,
    likedSongIds,
    loading,
    nextTrack,
    playCounts,
    playHistory,
    playNext,
    playSong,
    playlists,
    preferNativeAudio,
    prevTrack,
    queue,
    queueIndex,
    recentlyPlayed,
    removeFromPlaylist,
    removeFromQueue,
    renamePlaylist,
    reorderQueue,
    repeat,
    seek,
    setVolume,
    setSleepTimer,
    settings,
    shuffle,
    sleepTimerEnd,
    toggleLike,
    togglePlay,
    toggleRepeat,
    toggleShuffle,
    updateSettings,
    volume,
  ]);

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};
