# GT Music — PWA, Mobile UX, SEO & Branding Upgrade

## Core concept (locked in)

GT Music = a personal, ad-free, subscription-free Spotify-style player. Songs live in `public/songs/` in GitHub, deployed to Vercel, streamed straight from the static origin. Everything below preserves that model — no backend, no auth, no external streaming.

## Gap audit (today vs. what you asked for)


| Requirement                   | Status                              | Action                                                                                                                         |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Premium UI/UX                 | Partial — Editorial Glass home done | Extend style to Search/Library/Album/Playlist/Liked/Artist/Genre/Settings                                                      |
| Mobile-perfect, compact       | Partial — MobileNav exists          | Audit every page at 360/390/414px, fix paddings, tap targets ≥44px, safe-area insets, mini-player above nav                    |
| PWA installable               | Missing — no manifest, no SW        | Add manifest-only PWA (installable, no SW to avoid preview cache issues) + iOS meta + install prompt UI                        |
| Settings + Equalizer          | Exists                              | Polish layout, add presets (Rock/Pop/Bass/Vocal/Flat), output device, gapless toggle, reduced-motion toggle                    |
| Loading screens / Skeletons   | Exists                              | Audit coverage: ensure every page & list shows skeletons, splash only on first load                                            |
| Animations                    | Good base                           | Add page-transition polish, reduced-motion guard                                                                               |
| Sound quality / optimization  | Static MP3s as-is                   | Add `preload` strategy, MediaSession API (lock-screen controls), audio cache hints, AudioContext-based EQ already wired        |
| SEO / GEO                     | Partial — basic meta only           | Add per-route titles (react-helmet-async), JSON-LD (WebApplication), sitemap generator, robots.txt update, canonical, OG image |
| App icon / favicon / web icon | Generic                             | Generate branded GT Music icon set (favicon, 192, 512, maskable, apple-touch, OG image)                                        |


## What will change

### 1. Branding & icons (generated)

- Generate a GT Music logo mark: amber→coral gradient "GT" monogram with subtle vinyl/waveform motif on dark obsidian background.
- Outputs:
  - `public/favicon.ico` (replace), `public/favicon.png` (32, 192, 512)
  - `public/apple-touch-icon.png` (180)
  - `public/icon-maskable-512.png` (with safe-zone padding)
  - `public/og-image.jpg` (1200×630, branded)
- Wire all into `index.html` + manifest.

### 2. PWA installability (manifest-only, no service worker)

- Add `public/manifest.webmanifest` with name, short_name, theme/bg `#0a0a0f`, `display: standalone`, icon set incl. maskable, shortcuts (Home, Search, Liked).
- iOS meta in `index.html` (already partial — extend with apple-touch-icon, splash hint).
- Add an in-app **Install** card on `/settings` and a one-time bottom-sheet prompt using `beforeinstallprompt` (dismissible, remembered in localStorage). No service worker — avoids stale-cache problems in Lovable preview, still gives Add-to-Home-Screen on iOS/Android.

### 3. Mobile UX pass (390×844 baseline)

- Safe-area insets (`env(safe-area-inset-*)`) on top bar, mini-player, mobile nav.
- Tap targets ≥44×44, larger sliders on touch.
- FullScreenPlayer: vertical layout tightened, swipe-down to close already there — add swipe-up on mini-player to open.
- Sidebar collapses to MobileNav under `md`; ensure no horizontal scroll anywhere.
- All grids use `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`.

### 4. UI/UX polish (extend Editorial Glass to all pages)

- Search: glass search bar, recent searches chips, genre tiles bento.
- Library / Liked / Playlist / Album / Artist / Genre: consistent gradient headers, editorial typography, skeleton states.
- Settings: re-organized into sections (Audio, Appearance, Playback, About, Install).
- Smoother page transitions via existing `AnimatedPage`; respect `prefers-reduced-motion`.

### 5. Audio / playback enhancements

- **MediaSession API**: title, artist, album, artwork, play/pause/next/prev on lock screen + Bluetooth controls.
- **EQ presets**: Flat, Bass Boost, Treble Boost, Vocal, Rock, Pop, Electronic, Acoustic.
- **Gapless / preload-next**: preload next track's audio when current is >50% played.
- **Smart shuffle**, **repeat-one/all**, **sleep timer**, **playback speed** — already in; surface them better.
- **Audio normalization** toggle (already wired) + crossfade slider (already wired).
- Keep all songs as-is — bitrate switching not added (no second source exists; can revisit if you upload 320k variants).

### 6. SEO / discoverability

- Install `react-helmet-async`, wrap app, add per-route `<Helmet>` (Home, Search, Library, Liked, Settings, Album/:id, Artist/:id, Playlist/:id, Genre/:id) with titles, descriptions, canonical, OG.
- `index.html`: WebApplication JSON-LD (name, description, applicationCategory: MusicApplication, operatingSystem: Web).
- `public/robots.txt`: allow all, point to sitemap.
- `scripts/generate-sitemap.ts` + `predev`/`prebuild` hooks; entries = static routes + one per song/album/artist/genre/playlist from manifest.
- Branded `og-image.jpg`.

### 7. Performance

- `loading="lazy"` + `decoding="async"` on all cover images.
- `<link rel="preload" as="image">` for hero/featured covers.
- Code-split heavy pages with `React.lazy` (Settings, FullScreenPlayer, QueuePanel).
- Vite: ensure `build.target: 'es2020'`, default minify.
- Audio `<audio preload="metadata">` baseline, upgrade to `auto` for next track only.

## Files affected

**New**

- `public/manifest.webmanifest`
- `public/favicon.png`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/og-image.jpg`
- `scripts/generate-sitemap.ts`
- `src/components/InstallPrompt.tsx`
- `src/components/SEO.tsx` (Helmet wrapper)
- `src/hooks/useMediaSession.ts`
- `src/lib/eqPresets.ts`

**Edited**

- `index.html` (manifest link, icons, iOS meta, JSON-LD, OG)
- `public/robots.txt`
- `package.json` (react-helmet-async, predev/prebuild)
- `src/main.tsx` (HelmetProvider)
- `src/App.tsx` (lazy routes, install prompt mount)
- `src/index.css` (safe-area utilities, tap-target tweaks)
- `src/contexts/MusicContext.tsx` (preload-next, MediaSession hookup)
- `src/components/NowPlayingBar.tsx`, `MobileNav.tsx`, `FullScreenPlayer.tsx`, `AppSidebar.tsx` (safe-area, swipe-up, polish)
- `src/components/AudioEqualizer.tsx` (presets)
- `src/pages/*` (Helmet tags, mobile polish, skeleton coverage, editorial style)

## Out of scope

- Backend / auth / Lovable Cloud (not needed for personal static deploy).
- Service worker / offline cache (deliberately skipped — causes Lovable preview cache issues; manifest alone gives installability).
- Multi-bitrate switching (no second audio source exists in your manifest).  
  
app should play songs when browser is closed came back to jhome and turn off mobile also

Confirm and I'll implement end-to-end.