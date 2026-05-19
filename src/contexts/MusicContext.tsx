import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import type { Song, Playlist, RepeatMode, AppSettings, EQPresetName } from '@/types/music';
import { DEFAULT_SETTINGS, EQ_PRESETS, ACCENT_COLORS } from '@/types/music';
import { useMediaSession } from '@/hooks/useMediaSession';
import { toast } from 'sonner';

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

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Sleep timer
  sleepTimerEnd: number | null;
  setSleepTimer: (minutes: number) => void;
  clearSleepTimer: () => void;

  // Player controls
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

  // Library actions
  toggleLike: (songId: string) => void;
  isLiked: (songId: string) => boolean;
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, songId: string) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;

  // Full screen
  isFullScreen: boolean;
  setIsFullScreen: (v: boolean) => void;

  // Queue panel
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
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

// Apply accent color to CSS variables
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

// Apply theme by toggling `.light` class on <html>
function applyTheme(mode: 'dark' | 'light' | 'system') {
  const root = document.documentElement;
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const isLight = mode === 'light' || (mode === 'system' && prefersLight);
  root.classList.toggle('light', isLight);
  root.style.colorScheme = isLight ? 'light' : 'dark';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isLight ? '#fafafa' : '#0a0a0f');
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta) colorSchemeMeta.setAttribute('content', isLight ? 'light' : 'dark');
}

function shouldPreferNativeAudio() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [volume, setVolumeState] = useState(() => shouldPreferNativeAudio() ? 1 : 0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [likedSongIds, setLikedSongIds] = useState<string[]>(() => loadFromStorage('gt-liked', []));
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadFromStorage('gt-playlists', []));
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>(() => loadFromStorage('gt-recent', []));

  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage('gt-settings', DEFAULT_SETTINGS));
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [preferNativeAudio] = useState(() => shouldPreferNativeAudio());

  // Apply accent on mount & change
  useEffect(() => { applyAccentColor(settings.accentColor); }, [settings.accentColor]);

  // Apply theme on mount & change, listen for system preference if 'system'
  useEffect(() => {
    applyTheme(settings.theme);
    if (settings.theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => applyTheme('system');
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [settings.theme]);


  // Fetch manifest
  useEffect(() => {
    fetch('/songs/manifest.json')
      .then(r => r.json())
      .then(data => { setAllSongs(data.songs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Audio element + Web Audio API setup
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = preferNativeAudio ? 1 : 0.7;
      audioRef.current.preload = 'auto';
      audioRef.current.crossOrigin = 'anonymous';
      // Background playback: keep audio active even when tab hidden
      audioRef.current.setAttribute('playsinline', 'true');
      audioRef.current.setAttribute('webkit-playsinline', 'true');
    }
    const audio = audioRef.current;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [preferNativeAudio]);

  // Reduced motion attribute on <html>
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false';
  }, [settings.reducedMotion]);

  // Setup Web Audio nodes
  const ensureWebAudio = useCallback(() => {
    if (preferNativeAudio || audioCtxRef.current || !audioRef.current) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      const filters = EQ_FREQS.map((freq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? 'lowshelf' : i === 9 ? 'highshelf' : 'peaking';
        f.frequency.value = freq;
        f.Q.value = 1.4;
        f.gain.value = 0;
        return f;
      });
      filtersRef.current = filters;

      const gain = ctx.createGain();
      gainRef.current = gain;

      source.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
      filters[filters.length - 1].connect(gain);
      gain.connect(ctx.destination);
    } catch {
      // Fallback
    }
  }, [preferNativeAudio]);

  // Apply EQ settings
  const applyEQSettings = useCallback((s: AppSettings) => {
    if (preferNativeAudio) {
      if (audioRef.current) audioRef.current.playbackRate = s.playbackSpeed;
      return;
    }
    const preset = EQ_PRESETS.find(p => p.name === s.eqPreset);
    const bands = s.eqPreset === 'custom' ? s.eqCustomBands : (preset?.bands || []);
    filtersRef.current.forEach((f, i) => { if (bands[i] !== undefined) f.gain.value = bands[i]; });
    if (gainRef.current) gainRef.current.gain.value = s.normalization ? 0.8 : 1;
    if (audioRef.current) audioRef.current.playbackRate = s.playbackSpeed;
  }, [preferNativeAudio]);

  // Re-apply settings when they change
  useEffect(() => { applyEQSettings(settings); }, [settings, applyEQSettings]);

  // Persist settings
  useEffect(() => { localStorage.setItem('gt-settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('gt-liked', JSON.stringify(likedSongIds)); }, [likedSongIds]);
  useEffect(() => { localStorage.setItem('gt-playlists', JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { localStorage.setItem('gt-recent', JSON.stringify(recentlyPlayed)); }, [recentlyPlayed]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  // Sleep timer
  const setSleepTimer = useCallback((minutes: number) => {
    const end = Date.now() + minutes * 60 * 1000;
    setSleepTimerEnd(end);
    toast.success(`Sleep timer set for ${minutes} min`);
  }, []);

  const clearSleepTimer = useCallback(() => {
    setSleepTimerEnd(null);
    toast.success('Sleep timer cleared');
  }, []);

  // Check sleep timer
  useEffect(() => {
    if (!sleepTimerEnd) return;
    const check = () => {
      if (Date.now() >= sleepTimerEnd) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setSleepTimerEnd(null);
        toast.info('Sleep timer - playback paused');
      }
    };
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [sleepTimerEnd]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const recoverPlayback = () => {
      if (!currentSong || !isPlaying) return;
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        window.setTimeout(recoverPlayback, 120);
      }
    };

    const onForeground = () => {
      window.setTimeout(recoverPlayback, 120);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onForeground);
    window.addEventListener('focus', onForeground);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onForeground);
      window.removeEventListener('focus', onForeground);
    };
  }, [currentSong, isPlaying]);

  const addToRecent = useCallback((songId: string) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(id => id !== songId);
      return [songId, ...filtered].slice(0, 30);
    });
  }, []);

  const playSong = useCallback((song: Song, context?: Song[]) => {
    const audio = audioRef.current!;
    ensureWebAudio();
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    if (context) {
      setQueue(context);
      setQueueIndex(context.findIndex(s => s.id === song.id));
    }
    setCurrentSong(song);
    audio.src = `/songs/${song.file}`;
    audio.playbackRate = settings.playbackSpeed;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    addToRecent(song.id);
  }, [addToRecent, ensureWebAudio, settings.playbackSpeed]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current!;
    if (!currentSong) return;
    ensureWebAudio();
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
  }, [currentSong, isPlaying, ensureWebAudio]);

  const getNextIndex = useCallback(() => {
    if (shuffle) {
      let next = Math.floor(Math.random() * queue.length);
      if (queue.length > 1) while (next === queueIndex) next = Math.floor(Math.random() * queue.length);
      return next;
    }
    return (queueIndex + 1) % queue.length;
  }, [shuffle, queue, queueIndex]);

  const handleTrackEnd = useCallback(() => {
    if (repeat === 'one') {
      audioRef.current!.currentTime = 0;
      audioRef.current!.play();
      return;
    }
    if (repeat === 'off' && queueIndex === queue.length - 1) {
      setIsPlaying(false);
      return;
    }
    const nextIdx = getNextIndex();
    const next = queue[nextIdx];
    if (next) {
      setQueueIndex(nextIdx);
      setCurrentSong(next);
      audioRef.current!.src = `/songs/${next.file}`;
      audioRef.current!.playbackRate = settings.playbackSpeed;
      audioRef.current!.play().then(() => setIsPlaying(true)).catch(() => {});
      addToRecent(next.id);
    }
  }, [repeat, queueIndex, queue, getNextIndex, addToRecent, settings.playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => handleTrackEnd();
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, [handleTrackEnd]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = getNextIndex();
    const next = queue[nextIdx];
    if (next) {
      setQueueIndex(nextIdx);
      setCurrentSong(next);
      audioRef.current!.src = `/songs/${next.file}`;
      audioRef.current!.playbackRate = settings.playbackSpeed;
      audioRef.current!.play().then(() => setIsPlaying(true)).catch(() => {});
      addToRecent(next.id);
    }
  }, [queue, getNextIndex, addToRecent, settings.playbackSpeed]);

  const prevTrack = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prevIdx = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    const prev = queue[prevIdx];
    if (prev) {
      setQueueIndex(prevIdx);
      setCurrentSong(prev);
      audioRef.current.src = `/songs/${prev.file}`;
      audioRef.current.playbackRate = settings.playbackSpeed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      addToRecent(prev.id);
    }
  }, [queue, queueIndex, addToRecent, settings.playbackSpeed]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (preferNativeAudio) {
      setVolumeState(1);
      if (audioRef.current) audioRef.current.volume = 1;
      return;
    }
    setVolumeState(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, [preferNativeAudio]);

  const toggleShuffle = useCallback(() => setShuffle(p => !p), []);
  const toggleRepeat = useCallback(() => {
    setRepeat(p => p === 'off' ? 'all' : p === 'all' ? 'one' : 'off');
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => [...prev, song]);
  }, []);

  const playNext = useCallback((song: Song) => {
    setQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(queueIndex + 1, 0, song);
      return newQueue;
    });
  }, [queueIndex]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue(currentSong ? [currentSong] : []);
    setQueueIndex(0);
    toast.success('Queue cleared');
  }, [currentSong]);

  const reorderQueue = useCallback((from: number, to: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [item] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, item);
      return newQueue;
    });
  }, []);

  const toggleLike = useCallback((songId: string) => {
    setLikedSongIds(prev =>
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  }, []);

  const isLiked = useCallback((songId: string) => likedSongIds.includes(songId), [likedSongIds]);

  const createPlaylist = useCallback((name: string) => {
    const pl: Playlist = { id: `pl-${Date.now()}`, name, songIds: [], createdAt: Date.now() };
    setPlaylists(prev => [...prev, pl]);
    return pl;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  const renamePlaylist = useCallback((id: string, name: string) => {
    setPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }, []);

  const addToPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(p =>
      p.id === playlistId && !p.songIds.includes(songId)
        ? { ...p, songIds: [...p.songIds, songId] }
        : p
    ));
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, songIds: p.songIds.filter(id => id !== songId) } : p
    ));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight' && e.shiftKey) nextTrack();
      if (e.code === 'ArrowLeft' && e.shiftKey) prevTrack();
      if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
        setVolume(volume === 0 ? 0.7 : 0);
      }
      if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey && currentSong) {
        toggleLike(currentSong.id);
      }
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey) {
        setIsFullScreen(prev => !prev);
      }
      if (e.code === 'KeyQ' && !e.ctrlKey && !e.metaKey) {
        setIsQueueOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, nextTrack, prevTrack, volume, currentSong, toggleLike]);

  // MediaSession — lock-screen / Bluetooth / OS media controls + background playback
  const playFn = useCallback(() => {
    if (audioRef.current && currentSong) audioRef.current.play().catch(() => {});
  }, [currentSong]);
  const pauseFn = useCallback(() => { audioRef.current?.pause(); }, []);

  useMediaSession({
    song: currentSong,
    isPlaying,
    duration,
    currentTime,
    onPlay: playFn,
    onPause: pauseFn,
    onNext: nextTrack,
    onPrev: prevTrack,
    onSeek: seek,
  });

  // Preload next track once current is > 50% played (gapless / faster start)
  useEffect(() => {
    if (!settings.gapless || queue.length === 0 || !duration) return;
    if (currentTime / duration < 0.5) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    const next = queue[nextIdx];
    if (!next || next.id === currentSong?.id) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'audio';
    link.href = `/songs/${next.file}`;
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, [currentTime, duration, queue, queueIndex, currentSong, settings.gapless]);

  return (
    <MusicContext.Provider value={{
      currentSong, isPlaying, queue, queueIndex, shuffle, repeat, volume, currentTime, duration, preferNativeAudio,
      allSongs, loading, likedSongIds, playlists, recentlyPlayed,
      settings, updateSettings,
      sleepTimerEnd, setSleepTimer, clearSleepTimer,
      playSong, togglePlay, nextTrack, prevTrack, seek, setVolume, toggleShuffle, toggleRepeat,
      addToQueue, playNext, removeFromQueue, clearQueue, reorderQueue,
      toggleLike, isLiked, createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist, removeFromPlaylist,
      isFullScreen, setIsFullScreen, isQueueOpen, setIsQueueOpen,
    }}>
      {children}
    </MusicContext.Provider>
  );
};
