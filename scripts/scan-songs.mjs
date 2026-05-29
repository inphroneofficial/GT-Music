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

function readSyncSafeInteger(buffer, offset) {
  return (
    ((buffer[offset] & 0x7f) << 21) |
    ((buffer[offset + 1] & 0x7f) << 14) |
    ((buffer[offset + 2] & 0x7f) << 7) |
    (buffer[offset + 3] & 0x7f)
  );
}

function getId3v2Size(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const header = Buffer.alloc(10);
    const bytesRead = fs.readSync(fd, header, 0, header.length, 0);
    if (bytesRead < 10 || header.toString('latin1', 0, 3) !== 'ID3') return 0;
    const hasFooter = (header[5] & 0x10) !== 0;
    return 10 + readSyncSafeInteger(header, 6) + (hasFooter ? 10 : 0);
  } finally {
    fs.closeSync(fd);
  }
}

function readAudioWindow(filePath, startOffset) {
  const stat = fs.statSync(filePath);
  const length = Math.min(128 * 1024, Math.max(0, stat.size - startOffset));
  const buffer = Buffer.alloc(length);
  const fd = fs.openSync(filePath, 'r');
  try {
    const bytesRead = fs.readSync(fd, buffer, 0, length, startOffset);
    return { buffer: buffer.subarray(0, bytesRead), fileSize: stat.size };
  } finally {
    fs.closeSync(fd);
  }
}

const BITRATE_TABLE = {
  mpeg1: {
    layer1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    layer2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    layer3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  },
  mpeg2: {
    layer1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    layer2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    layer3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  },
};

const SAMPLE_RATE_TABLE = {
  mpeg1: [44100, 48000, 32000],
  mpeg2: [22050, 24000, 16000],
  mpeg25: [11025, 12000, 8000],
};

function parseMp3FrameHeader(buffer, offset) {
  if (offset + 4 > buffer.length) return null;
  const first = buffer[offset];
  const second = buffer[offset + 1];
  const third = buffer[offset + 2];
  const fourth = buffer[offset + 3];

  if (first !== 0xff || (second & 0xe0) !== 0xe0) return null;

  const versionBits = (second >> 3) & 0x03;
  const layerBits = (second >> 1) & 0x03;
  const bitrateIndex = (third >> 4) & 0x0f;
  const sampleRateIndex = (third >> 2) & 0x03;
  const padding = (third >> 1) & 0x01;
  const channelMode = (fourth >> 6) & 0x03;

  if (versionBits === 1 || layerBits === 0 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
    return null;
  }

  const version = versionBits === 3 ? 'mpeg1' : versionBits === 2 ? 'mpeg2' : 'mpeg25';
  const layer = layerBits === 3 ? 'layer1' : layerBits === 2 ? 'layer2' : 'layer3';
  const bitrateVersion = version === 'mpeg1' ? 'mpeg1' : 'mpeg2';
  const bitrate = BITRATE_TABLE[bitrateVersion][layer][bitrateIndex];
  const sampleRate = SAMPLE_RATE_TABLE[version][sampleRateIndex];
  if (!bitrate || !sampleRate) return null;

  const samplesPerFrame = layer === 'layer1'
    ? 384
    : layer === 'layer2'
      ? 1152
      : version === 'mpeg1'
        ? 1152
        : 576;

  const frameSize = layer === 'layer1'
    ? Math.floor(((12 * bitrate * 1000) / sampleRate + padding) * 4)
    : layer === 'layer3' && version !== 'mpeg1'
      ? Math.floor((72 * bitrate * 1000) / sampleRate + padding)
      : Math.floor((144 * bitrate * 1000) / sampleRate + padding);

  return {
    version,
    layer,
    bitrate,
    sampleRate,
    samplesPerFrame,
    frameSize,
    isMono: channelMode === 3,
  };
}

function readUInt32BEAt(buffer, offset) {
  if (offset + 4 > buffer.length) return 0;
  return buffer.readUInt32BE(offset);
}

function getVbrDuration(buffer, frameOffset, header) {
  const sideInfoSize = header.layer === 'layer3'
    ? header.version === 'mpeg1'
      ? header.isMono ? 17 : 32
      : header.isMono ? 9 : 17
    : 0;
  const xingOffset = frameOffset + 4 + sideInfoSize;
  const xing = buffer.toString('latin1', xingOffset, xingOffset + 4);

  if (xing === 'Xing' || xing === 'Info') {
    const flags = readUInt32BEAt(buffer, xingOffset + 4);
    if ((flags & 0x01) !== 0) {
      const frames = readUInt32BEAt(buffer, xingOffset + 8);
      if (frames > 0) return (frames * header.samplesPerFrame) / header.sampleRate;
    }
  }

  const vbriOffset = frameOffset + 4 + 32;
  const vbri = buffer.toString('latin1', vbriOffset, vbriOffset + 4);
  if (vbri === 'VBRI') {
    const frames = readUInt32BEAt(buffer, vbriOffset + 14);
    if (frames > 0) return (frames * header.samplesPerFrame) / header.sampleRate;
  }

  return 0;
}

function estimateMp3Duration(filePath) {
  try {
    const startOffset = getId3v2Size(filePath);
    const { buffer, fileSize } = readAudioWindow(filePath, startOffset);

    for (let offset = 0; offset < buffer.length - 4; offset += 1) {
      const header = parseMp3FrameHeader(buffer, offset);
      if (!header || header.frameSize <= 0) continue;

      const nextHeader = parseMp3FrameHeader(buffer, offset + header.frameSize);
      if (!nextHeader && offset + header.frameSize + 4 < buffer.length) continue;

      const vbrDuration = getVbrDuration(buffer, offset, header);
      if (vbrDuration > 0) return Math.round(vbrDuration);

      const audioBytes = Math.max(0, fileSize - startOffset - offset);
      return Math.round((audioBytes * 8) / (header.bitrate * 1000));
    }
  } catch {
    return 0;
  }

  return 0;
}

function estimateMp4Duration(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length < 12 || buffer.toString('latin1', 4, 8) !== 'ftyp') return 0;

    const findDuration = (start, end) => {
      let offset = start;
      while (offset + 8 <= end) {
        let size = buffer.readUInt32BE(offset);
        const type = buffer.toString('latin1', offset + 4, offset + 8);
        let headerSize = 8;

        if (size === 1) {
          if (offset + 16 > end) return 0;
          const largeSize = buffer.readBigUInt64BE(offset + 8);
          if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) return 0;
          size = Number(largeSize);
          headerSize = 16;
        } else if (size === 0) {
          size = end - offset;
        }

        const boxEnd = offset + size;
        if (size < headerSize || boxEnd > end) return 0;

        if (type === 'mvhd') {
          const version = buffer[offset + headerSize];
          if (version === 1) {
            const timescaleOffset = offset + headerSize + 4 + 16;
            const durationOffset = timescaleOffset + 4;
            if (durationOffset + 8 > boxEnd) return 0;
            const timescale = buffer.readUInt32BE(timescaleOffset);
            const duration = Number(buffer.readBigUInt64BE(durationOffset));
            return timescale > 0 ? duration / timescale : 0;
          }

          const timescaleOffset = offset + headerSize + 4 + 8;
          const durationOffset = timescaleOffset + 4;
          if (durationOffset + 4 > boxEnd) return 0;
          const timescale = buffer.readUInt32BE(timescaleOffset);
          const duration = buffer.readUInt32BE(durationOffset);
          return timescale > 0 ? duration / timescale : 0;
        }

        if (['moov', 'trak', 'mdia', 'minf', 'stbl'].includes(type)) {
          const nestedDuration = findDuration(offset + headerSize, boxEnd);
          if (nestedDuration > 0) return nestedDuration;
        }

        offset = boxEnd;
      }

      return 0;
    };

    return Math.round(findDuration(0, buffer.length));
  } catch {
    return 0;
  }
}

function estimateAudioDuration(filePath) {
  return estimateMp4Duration(filePath) || estimateMp3Duration(filePath);
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
    const filePath = path.join(resolvedRoot, relative);
    const previous = previousByBaseName.get(fileName.toLowerCase());
    const mood = relative.split('/')[0];
    const title = previous?.title || cleanTitle(fileName);
    const duration = estimateAudioDuration(filePath) || previous?.duration || 0;
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
      duration,
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
