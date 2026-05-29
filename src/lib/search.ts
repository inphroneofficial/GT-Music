import { MOOD_META, MOOD_ORDER } from '@/lib/moods';
import type { Song, SongMood } from '@/types/music';

export type SearchRankedSong = {
  song: Song;
  score: number;
  reason: string;
};

export type SearchArtistResult = {
  name: string;
  songs: Song[];
  score: number;
  reason: string;
};

export type SearchAlbumResult = {
  name: string;
  artist: string;
  cover: string;
  songs: Song[];
  score: number;
  reason: string;
};

export type SearchMoodResult = {
  mood: SongMood;
  score: number;
  songs: Song[];
};

export type LibrarySearchResults = {
  query: string;
  tokens: string[];
  songs: SearchRankedSong[];
  artists: SearchArtistResult[];
  albums: SearchAlbumResult[];
  moods: SearchMoodResult[];
};

export const normalizeSearchText = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/%20/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const compactSearchText = (value: string) => value.replace(/\s+/g, '');

const FIELD_REASONS: Record<string, string> = {
  title: 'Song title',
  artist: 'Artist',
  album: 'Album',
  mood: 'Mood',
  genre: 'Genre',
  file: 'File name',
};

function editDistanceWithin(left: string, right: string, maxDistance: number) {
  if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;
  if (left === right) return 0;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1).fill(0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];

    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
      rowMin = Math.min(rowMin, current[j]);
    }

    if (rowMin > maxDistance) return maxDistance + 1;
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }

  return previous[right.length];
}

function acronymOf(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('');
}

function scoreField(value: string | undefined, query: string, tokens: string[], boost: number, reason: string) {
  const field = normalizeSearchText(value);
  if (!field || !query) return { score: 0, reason: '' };

  const compactField = compactSearchText(field);
  const compactQuery = compactSearchText(query);
  const fieldTokens = field.split(/\s+/).filter(Boolean);
  const acronym = acronymOf(field);
  let score = 0;

  if (field === query) score += boost + 48;
  if (field.startsWith(query)) score += boost + 26;
  if (field.includes(query)) score += boost + 10;
  if (compactQuery.length > 2 && compactField.includes(compactQuery)) score += Math.round(boost * 0.7);
  if (compactQuery.length > 1 && acronym.startsWith(compactQuery)) score += Math.round(boost * 0.6);

  let matchedTokens = 0;

  tokens.forEach((token) => {
    if (!token) return;

    if (field === token) {
      score += 14;
      matchedTokens += 1;
      return;
    }

    if (field.startsWith(token)) {
      score += 10;
      matchedTokens += 1;
      return;
    }

    if (field.includes(token) || compactField.includes(token)) {
      score += 7;
      matchedTokens += 1;
      return;
    }

    const allowedDistance = token.length > 6 ? 2 : token.length > 3 ? 1 : 0;
    if (!allowedDistance) return;

    const fuzzyMatch = fieldTokens.some((fieldToken) => {
      const comparable = fieldToken.slice(0, Math.max(token.length + 1, fieldToken.length));
      return editDistanceWithin(token, comparable, allowedDistance) <= allowedDistance;
    });

    if (fuzzyMatch) {
      score += Math.max(3, Math.round(boost * 0.28));
      matchedTokens += 1;
    }
  });

  if (tokens.length > 1 && matchedTokens === tokens.length) score += Math.round(boost * 0.45);

  return { score, reason: score > 0 ? reason : '' };
}

export function scoreSong(song: Song, query: string, tokens: string[]): SearchRankedSong {
  const fields = [
    scoreField(song.title, query, tokens, 46, FIELD_REASONS.title),
    scoreField(song.artist, query, tokens, 34, FIELD_REASONS.artist),
    scoreField(song.album, query, tokens, 30, FIELD_REASONS.album),
    scoreField(song.mood, query, tokens, 26, FIELD_REASONS.mood),
    scoreField(song.genre, query, tokens, 20, FIELD_REASONS.genre),
    scoreField(song.file, query, tokens, 16, FIELD_REASONS.file),
  ];

  const bestField = fields.reduce((best, field) => (field.score > best.score ? field : best), fields[0]);

  return {
    song,
    score: fields.reduce((total, field) => total + field.score, 0),
    reason: bestField.reason || 'Library match',
  };
}

export function searchLibrary(songs: Song[], rawQuery: string): LibrarySearchResults {
  const query = normalizeSearchText(rawQuery);
  const tokens = query.split(' ').filter(Boolean);

  if (!query) {
    return { query, tokens, songs: [], artists: [], albums: [], moods: [] };
  }

  const rankedSongs = songs
    .map((song) => scoreSong(song, query, tokens))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.song.title.localeCompare(right.song.title));

  const artistMap = new Map<string, SearchArtistResult>();
  const albumMap = new Map<string, SearchAlbumResult>();

  songs.forEach((song) => {
    const rankedSong = scoreSong(song, query, tokens);

    const artistName = song.artist || 'Unknown Artist';
    const artistField = scoreField(artistName, query, tokens, 40, FIELD_REASONS.artist);
    const artistScore = artistField.score + Math.round(rankedSong.score * 0.45);
    if (artistScore > 0) {
      const existing = artistMap.get(artistName);
      if (existing) {
        existing.songs.push(song);
        existing.score = Math.max(existing.score, artistScore);
      } else {
        artistMap.set(artistName, {
          name: artistName,
          songs: [song],
          score: artistScore,
          reason: artistField.reason || rankedSong.reason,
        });
      }
    }

    const albumName = song.album || 'Unknown Album';
    const albumField = scoreField(albumName, query, tokens, 40, FIELD_REASONS.album);
    const albumArtistField = scoreField(song.artist, query, tokens, 18, FIELD_REASONS.artist);
    const albumScore = albumField.score + albumArtistField.score + Math.round(rankedSong.score * 0.35);
    if (albumScore > 0) {
      const existing = albumMap.get(albumName);
      if (existing) {
        existing.songs.push(song);
        existing.score = Math.max(existing.score, albumScore);
      } else {
        albumMap.set(albumName, {
          name: albumName,
          artist: song.artist,
          cover: song.cover,
          songs: [song],
          score: albumScore,
          reason: albumField.reason || albumArtistField.reason || rankedSong.reason,
        });
      }
    }
  });

  const moods = MOOD_ORDER.map((mood) => {
    const meta = MOOD_META[mood];
    const moodText = `${meta.label} ${meta.shortLabel} ${meta.signal} ${meta.aliases.join(' ')} ${meta.keywords.join(' ')}`;
    const moodScore = scoreField(moodText, query, tokens, 38, FIELD_REASONS.mood).score;
    const moodSongs = songs.filter((song) => song.mood === mood);
    const songBoost = rankedSongs.filter((entry) => entry.song.mood === mood).length;
    return { mood, score: moodScore + songBoost * 4, songs: moodSongs };
  })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.mood.localeCompare(right.mood));

  return {
    query,
    tokens,
    songs: rankedSongs,
    artists: Array.from(artistMap.values()).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name)),
    albums: Array.from(albumMap.values()).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name)),
    moods,
  };
}

export function getSearchSuggestions(songs: Song[]) {
  const topGenres = Array.from(new Set(songs.map((song) => song.genre).filter(Boolean) as string[])).slice(0, 5);
  const topArtists = Array.from(new Set(songs.map((song) => song.artist).filter(Boolean))).slice(0, 5);
  return ['romantic', 'melodies', 'mass', ...topGenres, ...topArtists].slice(0, 10);
}
