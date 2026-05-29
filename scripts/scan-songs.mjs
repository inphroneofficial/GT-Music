import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MOODS = ['melodies', 'mass', 'romantic', 'emotional', 'uplifting'];
const MOOD_SET = new Set(MOODS);

const MOOD_META = {
  melodies: { label: 'Melodies', genre: 'Melody' },
  mass: { label: 'Mass', genre: 'Mass' },
  romantic: { label: 'Romantic', genre: 'Romantic' },
  emotional: { label: 'Emotional', genre: 'Emotional' },
  uplifting: { label: 'Uplifting', genre: 'Uplifting' },
};

const KEYWORDS = {
  melodies: [
    'melody', 'melodies', 'nenante', 'chandamama', 'neeve', 'manase', 'manasulo',
    'chiru', 'poolane', 'enduko', 'ee manchullo', 'inthalo', 'chiguraku', 'ela ela',
    'ye chilipi', 'niharika', 'poovullo', 'kallu moosi', 'nemali', 'uppenantha',
    'ab yevaro', 'akasam', 'dote on', 'are you one', 'kalyani', 'flute',
    'sahana sahana', 'samayama', 'gaali vaaluga', 'idhe idhe', 'soundarya',
  ],
  mass: [
    'mass', 'massa', 'thalapathy', 'kacheri', 'raavana', 'rebel', 'dhurandhar',
    'title track', 'beat it', 'billie jean', 'boom boom', 'sher', 'orochi',
    'revenge', 'varalaaru', 'mutta', 'kalakki', 'bhel', 'run down', 'trance',
    'aaya', 'singam', 'kathi', 'mirai', 'paradise', 'sri rama', 'nache nache',
    'fire storm', 'hungry cheetah', 'guns and roses', 'assalaam', 'hey naayak',
    'harima', 'malaiyur', 'malaiyuru', 'raja saab', 'the rajasaab',
    'welcome kanakam', 'orugalluke', 'veyira cheyyi', 'na b c',
  ],
  romantic: [
    'love', 'prema', 'premalekha', 'priya', 'pyaar', 'ishq', 'saiyaara',
    'aashiq', 'chinnadana', 'diamond', 'naari', 'aasa', 'bommale', 'madhuve',
    'khwaab', 'jhalak', 'dil ', 'dil se', 'teri', 'saat samundar',
    'chuttamalle', 'neelo', 'valapu', 'nuvvu', 'telusaa', 'rubaroo',
    'pileche', 'pillaa', 'haseen', 'gore gore', 'gulabi', 'andaanike',
    'vennela', 'nuvvunte', 'adigaa', 'chaley',
  ],
  emotional: [
    'sad', 'barbaad', 'dhun', 'newyork', 'pareshanayya', 'yadalo', 'karige',
    'rendu', 'nijamena', 'rain', 'seethakaalam', 'manase thadisela', 'fa9la',
    'parano', 'inka edo', 'inumulo', 'gehr', 'flee', 'i know',
    'raga of revenge', 'raga', 'nammavemo', 'dhim thana', 'cheppamma', 'nath nath',
  ],
  uplifting: [
    'happy', 'june', 'saripovu', 'kilimanjaro', 'chuttesai', 'pavazha',
    'travel', 'wish', 'butterfly', 'shanthi', 'hai ra', 'sairat', 'chikiri',
    'ambadhari', 'andham', 'champakamala', 'a vachi', 'banthi', 'bhoogolam',
    'ekkada', 'ez-ez', 'jajikaya', 'kaatuka', 'lutt le gaya', 'minnalvala',
    'muvvala', 'naal nachna', 'papaoutai', 'ramba ho', 'shararat', 'silakaa',
    'singari', 'sir osthara', 'yegire',
  ],
};

const SOURCE_PATTERNS = [
  /\[?isongs\.info\]?/gi,
  /sensongsmp3(?:\.co|\.com)?/gi,
  /sensongsmp3/gi,
  /naasongs/gi,
  /masstamilan(?:\.com|\.dev)?/gi,
  /pendujatt\.com\.se/gi,
  /samadada\.com/gi,
  /soundworldz/gi,
  /t-series(?: bollywood classics| telugu)?/gi,
  /sony music south/gi,
  /saregama music/gi,
  /zee music company/gi,
  /320\s*kbps/gi,
  /official audio/gi,
  /official visualizer/gi,
  /video song/gi,
  /lyrical video/gi,
  /full video/gi,
  /\bhq\b/gi,
];

function normalizeText(value) {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[_\[\](){}.,]+/g, ' ')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(fileName) {
  let title = path.basename(fileName, path.extname(fileName)).normalize('NFKC');
  title = title.replace(/^\s*\[?isongs\.info\]?\s*/i, '');
  title = title.replace(/^\s*\d{1,2}\s*[-.]\s*/i, '');
  title = title.replace(/^\s*\d{1,2}[-_]/i, '');
  title = title.replace(/_/g, ' ');

  for (const pattern of SOURCE_PATTERNS) {
    title = title.replace(pattern, '');
  }

  title = title
    .replace(/\bfrom\s+[_"']?/gi, '')
    .replace(/\b(?:telugu|tamil|hindi)\b/gi, '')
    .replace(/[\[\](){}]+/g, ' ')
    .replace(/\s+-\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s\-:|]+$/g, '')
    .trim();

  const parts = title.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  return (parts[0] || title || path.basename(fileName, path.extname(fileName))).trim();
}

function inferArtist(fileName, previous) {
  if (previous?.artist && !/collection/i.test(previous.artist)) return previous.artist;

  const normalized = path.basename(fileName, path.extname(fileName)).normalize('NFKC');
  const cleaned = normalized
    .replace(/^\s*\[?isongs\.info\]?\s*/i, '')
    .replace(/^\s*\d{1,2}\s*[-.]\s*/i, '')
    .replace(/^\s*\d{1,2}[-_]/i, '')
    .replace(/_/g, ' ');

  const parts = cleaned.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const artist = parts[1]
      .replace(/\([^)]*\)/g, '')
      .replace(/\b(?:NaaSongs|SenSongsMp3|MassTamilan|PenduJatt\.Com\.Se|320 Kbps)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (artist && artist.length <= 60) return artist;
  }

  const knownArtists = [
    'Michael Jackson', 'T-Chenxi', 'Shashwat Sachdev', 'Anirudh Ravichander',
    'Arijit Singh', 'Thaman S', 'Himesh Reshammiya', 'Shreya Ghoshal',
    'A.R. Rahman', 'Faheem Abdullah', 'Talwiinder', 'Flipperachi',
    'Armaan Malik', 'Ajay Atul', 'G.V. Prakash Kumar',
    'S. P. Balasubrahmanyam', 'Vijay Prakash',
  ];

  const lower = normalized.toLowerCase();
  return knownArtists.find((artist) => lower.includes(artist.toLowerCase())) || 'Local Library';
}

function inferMood(fileName) {
  const text = normalizeText(fileName);
  const scores = Object.fromEntries(MOODS.map((mood) => [mood, 0]));

  for (const [mood, keywords] of Object.entries(KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[mood] += keyword.includes(' ') ? 2 : 1;
      }
    }
  }

  if (text.includes('t-chenxi')) scores.uplifting += 1;
  if (text.includes('michael jackson')) scores.mass += 2;
  if (text.includes('saiyaara')) scores.romantic += 2;
  if (text.includes('dhurandhar')) scores.mass += 2;
  if (text.includes('raja saab') || text.includes('rajasaab')) scores.mass += 2;
  if (text.includes('krrish')) scores.romantic += 1;
  if (text.includes('de pyaar de')) scores.romantic += 2;

  const [bestMood, bestScore] = Object.entries(scores).sort((left, right) => right[1] - left[1])[0];
  return bestScore > 0 ? bestMood : 'melodies';
}

function slugify(value) {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'song';
}

function walkMp3Files(dir, root) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (!path.resolve(fullPath).startsWith(root + path.sep) && path.resolve(fullPath) !== root) {
      throw new Error(`Refusing to scan outside songs root: ${fullPath}`);
    }
    if (entry.isDirectory()) {
      if (entry.name !== 'covers') files.push(...walkMp3Files(fullPath, root));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp3')) {
      files.push(fullPath);
    }
  }
  return files;
}

function uniqueTargetPath(folderPath, fileName) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  let candidate = path.join(folderPath, fileName);
  let index = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(folderPath, `${base} (${index})${ext}`);
    index += 1;
  }
  return candidate;
}

export function scanSongsLibrary({ projectRoot = process.cwd() } = {}) {
  const songsRoot = path.resolve(projectRoot, 'public', 'songs');
  if (!fs.existsSync(songsRoot)) {
    throw new Error(`Missing songs directory: ${songsRoot}`);
  }

  const resolvedRoot = fs.realpathSync(songsRoot);
  for (const mood of MOODS) {
    fs.mkdirSync(path.join(resolvedRoot, mood), { recursive: true });
  }

  const manifestPath = path.join(resolvedRoot, 'manifest.json');
  let previousSongs = [];
  try {
    previousSongs = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).songs || [];
  } catch {
    previousSongs = [];
  }

  const previousByBaseName = new Map();
  const previousFiles = new Set();
  for (const song of previousSongs) {
    if (!song?.file) continue;
    previousByBaseName.set(path.basename(song.file).toLowerCase(), song);
    previousFiles.add(String(song.file).replace(/^\/?songs\//, ''));
  }

  const initialFiles = walkMp3Files(resolvedRoot, resolvedRoot);
  const moved = [];

  for (const filePath of initialFiles) {
    const relative = path.relative(resolvedRoot, filePath).replace(/\\/g, '/');
    const segments = relative.split('/');
    const currentMood = MOOD_SET.has(segments[0]) ? segments[0] : null;
    const targetMood = currentMood || inferMood(path.basename(filePath));

    if (currentMood === targetMood && segments.length === 2) continue;

    const target = uniqueTargetPath(path.join(resolvedRoot, targetMood), path.basename(filePath));
    fs.renameSync(filePath, target);
    moved.push({
      from: relative,
      to: path.relative(resolvedRoot, target).replace(/\\/g, '/'),
    });
  }

  const finalFiles = walkMp3Files(resolvedRoot, resolvedRoot)
    .map((filePath) => path.relative(resolvedRoot, filePath).replace(/\\/g, '/'))
    .filter((relative) => MOOD_SET.has(relative.split('/')[0]))
    .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));

  const usedIds = new Set();
  const songs = finalFiles.map((relative, index) => {
    const fileName = path.basename(relative);
    const previous = previousByBaseName.get(fileName.toLowerCase());
    const mood = relative.split('/')[0];
    const title = previous?.title || cleanTitle(fileName);
    let id = previous?.id || `${mood}-${slugify(title)}`;
    if (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);

    return {
      id,
      title,
      artist: inferArtist(fileName, previous),
      album: previous?.album && !/collection/i.test(previous.album)
        ? previous.album
        : `${MOOD_META[mood].label} Collection`,
      duration: previous?.duration || 0,
      file: `songs/${relative}`,
      cover: previous?.cover || 'covers/default.jpg',
      genre: previous?.genre || MOOD_META[mood].genre,
      mood,
    };
  });

  fs.writeFileSync(manifestPath, `${JSON.stringify({ songs }, null, 2)}\n`, 'utf8');

  const currentFiles = new Set(finalFiles);
  const added = finalFiles.filter((file) => !previousFiles.has(file));
  const removed = [...previousFiles].filter((file) => !currentFiles.has(file));
  const counts = songs.reduce((acc, song) => {
    acc[song.mood] = (acc[song.mood] || 0) + 1;
    return acc;
  }, {});

  return {
    ok: true,
    total: songs.length,
    added: added.length,
    removed: removed.length,
    moved: moved.length,
    counts,
    folders: MOODS.map((mood) => `public/songs/${mood}`),
    songs,
  };
}

const isCli = process.argv[1] && pathToFileURL(fileURLToPath(import.meta.url)).href === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const result = scanSongsLibrary();
  console.log(`GT Music scan complete: ${result.total} songs`);
  console.log(`Added: ${result.added}, removed: ${result.removed}, moved: ${result.moved}`);
  console.log(JSON.stringify(result.counts, null, 2));
}
