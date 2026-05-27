export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  file: string;
  cover: string;
  genre?: string;
  mood?: SongMood;
}

export type SongMood = 'melodies' | 'mass' | 'romantic' | 'emotional' | 'uplifting';

export interface Album {
  name: string;
  artist: string;
  cover: string;
  songs: Song[];
}

export interface Artist {
  name: string;
  cover: string;
  albums: Album[];
  songs: Song[];
}

export interface Playlist {
  id: string;
  name: string;
  cover?: string;
  songIds: string[];
  createdAt: number;
}

export interface MusicManifest {
  songs: Song[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  currentTime: number;
  duration: number;
}

// EQ
export type EQPresetName =
  | 'flat' | 'bass_boost' | 'treble_boost' | 'vocal' | 'rock' | 'pop'
  | 'electronic' | 'acoustic' | 'hiphop' | 'jazz' | 'classical' | 'latenight' | 'custom';

export interface EQBand {
  frequency: number;
  gain: number; // -12 to +12 dB
}

export interface EQPreset {
  name: EQPresetName;
  label: string;
  bands: number[]; // 10 gain values
}

// Settings
export type AccentColor = 'amber' | 'green' | 'blue' | 'purple' | 'red';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppSettings {
  eqPreset: EQPresetName;
  eqCustomBands: number[];
  crossfadeDuration: number; // seconds 0-12
  fadeInDuration: number; // seconds 0-4
  playbackSpeed: number;
  normalization: boolean;
  bassBoost: number; // 0-10
  stereoWidening: number; // 0-10
  monoAudio: boolean;
  spatialAudio: boolean;
  reducedMotion: boolean;
  gapless: boolean;
  sleepTimerMinutes: number | null; // null = off
  accentColor: AccentColor;
  theme: ThemeMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  eqPreset: 'flat',
  eqCustomBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  crossfadeDuration: 0,
  fadeInDuration: 1,
  playbackSpeed: 1,
  normalization: false,
  bassBoost: 0,
  stereoWidening: 0,
  monoAudio: false,
  spatialAudio: false,
  reducedMotion: false,
  gapless: true,
  sleepTimerMinutes: null,
  accentColor: 'amber',
  theme: 'dark',
};

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: EQPreset[] = [
  { name: 'flat',         label: 'Flat',         bands: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'bass_boost',   label: 'Bass Boost',   bands: [ 8, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: 'treble_boost', label: 'Treble Boost', bands: [ 0, 0, 0, 0, 0, 0, 2, 4, 6, 8] },
  { name: 'vocal',        label: 'Vocal',        bands: [-2,-1, 0, 2, 5, 5, 3, 1, 0,-1] },
  { name: 'rock',         label: 'Rock',         bands: [ 5, 4, 2, 0,-1,-1, 1, 3, 5, 6] },
  { name: 'pop',          label: 'Pop',          bands: [-1, 0, 2, 4, 5, 4, 2, 0,-1,-1] },
  { name: 'electronic',   label: 'Electronic',   bands: [ 6, 5, 2, 0,-2,-1, 0, 3, 5, 7] },
  { name: 'acoustic',     label: 'Acoustic',     bands: [ 3, 2, 1, 0, 1, 2, 2, 3, 2, 1] },
  { name: 'hiphop',       label: 'Hip-Hop',      bands: [ 6, 5, 3, 1, 0, 0, 1, 2, 3, 3] },
  { name: 'jazz',         label: 'Jazz',         bands: [ 3, 2, 1, 2, 0, 0, 1, 2, 3, 3] },
  { name: 'classical',    label: 'Classical',    bands: [ 4, 3, 2, 0, 0, 0, 0, 1, 2, 3] },
  { name: 'latenight',    label: 'Late Night',   bands: [ 5, 3, 1, 0, 0, 0, 0,-1,-2,-3] },
  { name: 'custom',       label: 'Custom',       bands: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

export const ACCENT_COLORS: Record<AccentColor, { hsl: string; label: string }> = {
  amber: { hsl: '24 95% 53%', label: 'Amber' },
  green: { hsl: '142 71% 45%', label: 'Green' },
  blue: { hsl: '217 91% 60%', label: 'Blue' },
  purple: { hsl: '270 70% 60%', label: 'Purple' },
  red: { hsl: '0 84% 60%', label: 'Red' },
};

export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const SLEEP_TIMER_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];
