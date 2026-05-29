# GT Music

GT Music is a premium personal music player built for people who want control over their own listening experience.

It was created as an alternative to ad-heavy streaming apps that keep basic features behind subscriptions, push unwanted recommendations, and make your own library feel secondary. GT Music focuses on your songs, your mood, your playlists, and your way of listening.

## Project snapshot

- Built as a personal cloud-style music player, not a Spotify clone
- Visible git build window: May 19, 2026 to May 29, 2026
- Current catalog: 164 songs and about 11.9 hours of music
- App/script/config size before documentation update: about 15,404 lines
- Source files: 110
- Component files: 75
- Pages: 11
- Runtime dependencies: 51
- Dev dependencies: 21
- Detailed project report: [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md)

## What GT Music includes

- Personal local-library playback with a polished app-style UI
- Dynamic MP3 metadata reading with `jsmediatags`
- Embedded cover-art support with placeholder fallback
- Home screen with ambient mood sections, weather/time context, quotes, and personalized recommendations
- `Your Mood` browsing for `Melodies`, `Mass`, `Romantic`, `Emotional`, and `Uplifting` listening lanes
- Library sections for `All Songs`, `Your Mood`, `Albums`, `Artists`, `Liked Songs`, `Playlists`, `Recently Played`, `Most Played`, and `Downloaded`
- Mobile-friendly player shell with mini-player, fullscreen player, queue, and lock-screen media session support
- Theme switching, accent colors, EQ controls, bass boost, stereo widening, crossfade, fade-in, and playback-speed controls
- Listening analytics such as recent activity and most-played tracking
- PWA-ready install support for a more native feel
- Local song scanner that updates the manifest from mood folders
- Real duration extraction for MP3 and MP4/AAC-style files renamed as `.mp3`

## Why this app exists

GT Music was built out of frustration with typical streaming apps:

- too many ads
- too many locked features unless you subscribe
- too many unwanted suggestions
- not enough focus on the songs you actually love

So this app takes the opposite approach: a personal player that feels cinematic, direct, and fully yours.

## Tech stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI
- React Router
- TanStack Query
- `jsmediatags` for reading song metadata
- Media Session API
- Custom song scanner script

## Documentation

More detailed documentation lives in [docs/](docs/):

- [Project Report](docs/PROJECT_REPORT.md): app complexity, feature depth, line counts, timeline, cost estimate, build team estimate, limitations, and roadmap

## Project scripts

```bash
npm install
npm run dev
```

Other useful scripts:

```bash
npm run build
npm run preview
npm run lint
npm run test
npm run scan:songs
```

## Music library structure

GT Music loads the full catalog from one manifest:

- `public/songs/manifest.json`

Audio files are organized by mood/type inside:

- `public/songs/melodies/`
- `public/songs/mass/`
- `public/songs/romantic/`
- `public/songs/emotional/`
- `public/songs/uplifting/`

Cover images can live in:

- `public/songs/covers/`

Fallback placeholder:

- `public/placeholder.svg`

## How song loading works

Each manifest contains a `songs` array. Every entry can define:

- `id`
- `title`
- `artist`
- `album`
- `duration`
- `file`
- `cover`
- `genre`
- `mood`

Example:

```json
{
  "id": "song-1",
  "title": "My Song",
  "artist": "My Artist",
  "album": "My Album",
  "duration": 240,
  "file": "songs/uplifting/My Song.mp3",
  "cover": "covers/default.jpg",
  "genre": "Pop",
  "mood": "uplifting"
}
```

Supported mood values:

- `melodies`
- `mass`
- `romantic`
- `emotional`
- `uplifting`

If `mood` is not provided, GT Music still tries to infer one from the song title, album, genre, and file name. For the most accurate `Your Mood` sections, add the `mood` field when adding new songs.

The app can also enrich display data directly from MP3 metadata:

- `tags.title`
- `tags.artist`
- `tags.album`
- embedded artwork from `tags.picture`

If embedded art is present, GT Music converts it into a base64 `data:` image URL and uses it in the UI. If no cover is found, it falls back to `public/placeholder.svg`.

## Adding new songs

### Add to the mood folders

1. Put the audio files inside the matching folder under `public/songs/`
2. Use `melodies`, `mass`, `romantic`, `emotional`, or `uplifting`
3. Run `npm run scan:songs`, or open Settings in dev mode and click **Scan Songs**
4. Optionally place custom covers in `public/songs/covers/`

Notes:

- Use the exact folder and filename in the `file` field, for example `songs/romantic/My Song.mp3`
- If you drop MP3s directly inside `public/songs/`, the scanner will infer the mood and move them into a mood folder
- The in-app **Scan Songs** button can update the manifest instantly while running the local Vite dev server
- On a deployed static app, new files in `public/` need `npm run scan:songs` and a redeploy because browsers cannot write to the deployed filesystem
- If your MP3 already contains good metadata and album art, GT Music can read that dynamically
- Manifest values act as a reliable fallback when tags are missing

## UX direction

GT Music is designed to feel closer to a real modern music product than a simple website:

- mobile-first layouts
- safe-area-aware spacing
- smooth page transitions
- premium gradients, glow, and motion
- fast browsing for longer libraries
- personalized home and library organization

## Current focus areas

The app is already in a strong usable state, and the next high-impact improvements would be:

- deeper bundle splitting for faster first load
- more advanced playlist workflows
- richer statistics and listening insights
- more device-level QA across Android Chrome and iPhone Safari

## Author

Designed and developed by Thangella.

Thangella's role in GT Music went beyond giving simple instructions. The project was shaped through product thinking, prompt engineering, AI-agent direction, UI/UX review, mobile testing feedback, catalog decisions, and repeated quality checks. A major part of the development process was knowing how to communicate precise requirements to AI tools, break large work into clear tasks, manage context and token usage carefully, and guide the agent toward production-ready implementation without wasting limits.

This project shows practical AI-assisted application development skill: turning an idea into a working product by combining clear prompting, iterative testing, fast feedback, and strong ownership of the final experience.

Built for a cleaner, more personal way to listen.
