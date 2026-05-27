import type { Song, SongMood } from '@/types/music';

export const MOOD_ORDER: SongMood[] = ['melodies', 'mass', 'romantic', 'emotional', 'uplifting'];

export const MOOD_META: Record<SongMood, {
  label: string;
  shortLabel: string;
  description: string;
  signal: string;
  gradient: string;
  aliases: string[];
  keywords: string[];
}> = {
  melodies: {
    label: 'Melodies',
    shortLabel: 'Melody',
    description: 'Soft, repeat-friendly songs for calm listening and deep focus.',
    signal: 'Smooth flow',
    gradient: 'from-sky-500/25 via-cyan-400/15 to-emerald-400/10',
    aliases: ['melody', 'melodies', 'melodic', 'soft', 'calm'],
    keywords: ['melody', 'melodies', 'nenante', 'chandamama', 'neeve', 'manase', 'manasulo', 'chiru', 'poolane'],
  },
  mass: {
    label: 'Mass',
    shortLabel: 'Mass',
    description: 'High-energy tracks for hype moments, workouts, and full-volume sessions.',
    signal: 'Power mode',
    gradient: 'from-orange-500/30 via-red-500/18 to-amber-400/10',
    aliases: ['mass', 'hype', 'power', 'energy', 'dance'],
    keywords: ['mass', 'thalapathy', 'kacheri', 'raavana', 'revenge', 'varalaaru', 'mutta', 'kalakki', 'bhel'],
  },
  romantic: {
    label: 'Romantic',
    shortLabel: 'Love',
    description: 'Warm songs for love, late-night messages, and cinematic heart moments.',
    signal: 'Heart blend',
    gradient: 'from-rose-500/28 via-pink-500/16 to-orange-400/10',
    aliases: ['romantic', 'romance', 'love', 'heart'],
    keywords: ['love', 'premalekha', 'naari', 'aasa', 'bommale', 'chinnadana', 'madhuve', 'diamond', 'gore'],
  },
  emotional: {
    label: 'Emotional',
    shortLabel: 'Deep',
    description: 'Intense, reflective songs for rainy moods and story-heavy listening.',
    signal: 'Deep cut',
    gradient: 'from-violet-500/28 via-indigo-500/16 to-slate-400/10',
    aliases: ['emotional', 'sad', 'deep', 'feel', 'pain'],
    keywords: ['emotional', 'newyork', 'pareshanayya', 'yadalo', 'kallu', 'nijamena', 'rendu', 'revenge', 'rain'],
  },
  uplifting: {
    label: 'Uplifting',
    shortLabel: 'Lift',
    description: 'Bright songs for travel, mornings, fresh starts, and instant mood resets.',
    signal: 'Bright run',
    gradient: 'from-lime-400/25 via-yellow-400/16 to-primary/10',
    aliases: ['uplifting', 'happy', 'bright', 'fresh', 'morning'],
    keywords: ['uplifting', 'happy', 'saripovu', 'kilimanjaro', 'chuttesai', 'akasan', 'akasam', 'pavazha', 'june'],
  },
};

export function normalizeSongMood(value?: string | null): SongMood | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (!normalized) return null;

  for (const mood of MOOD_ORDER) {
    if (mood === normalized || MOOD_META[mood].aliases.includes(normalized)) {
      return mood;
    }
  }

  return null;
}

export function getSongMood(song: Pick<Song, 'title' | 'artist' | 'album' | 'file' | 'genre' | 'mood'>): SongMood {
  const explicitMood = normalizeSongMood(song.mood);
  if (explicitMood) return explicitMood;

  const haystack = `${song.title} ${song.artist} ${song.album} ${song.genre ?? ''} ${song.file}`.toLowerCase();

  const scored = MOOD_ORDER.map((mood) => ({
    mood,
    score: MOOD_META[mood].keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0),
  })).sort((left, right) => right.score - left.score);

  if (scored[0]?.score > 0) return scored[0].mood;

  if (haystack.includes('melody') || haystack.includes('melodies')) return 'melodies';
  if (haystack.includes('soundtrack')) return 'emotional';
  if (haystack.includes('tamil')) return 'mass';

  return 'melodies';
}

export function groupSongsByMood(songs: Song[]) {
  return MOOD_ORDER.map((mood) => ({
    mood,
    songs: songs.filter((song) => getSongMood(song) === mood),
  }));
}
