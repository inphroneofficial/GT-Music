# GT Music

GT Music is a Vite + React music player for a personal local library.

## Where to keep songs

Put your audio files inside `public/songs/`.

Examples:
- `public/songs/My Song.mp3`
- `public/songs/Another Track.m4a`

If you want custom cover images, keep them inside `public/songs/covers/`.

Examples:
- `public/songs/covers/default.jpg`
- `public/songs/covers/album-1.jpg`

## How playback works

This app loads songs from `public/songs/manifest.json`.

Each song entry uses:
- `file`: the exact filename inside `public/songs/`
- `cover`: the image path relative to `public/songs/`
- `title`, `artist`, `album`, `genre`, `duration`: the metadata shown in the UI

Example:

```json
{
  "id": "song-1",
  "title": "My Song",
  "artist": "My Artist",
  "album": "My Album",
  "duration": 240,
  "file": "My Song.mp3",
  "cover": "covers/default.jpg",
  "genre": "Pop"
}
```

If the cover image is missing, GT Music falls back to `public/placeholder.svg`. If a track has embedded artwork, the app can also try to read it from the audio file.
