# GT Music Project Report

Last updated: May 29, 2026

## Executive Summary

GT Music is a personal cloud-style music player built to feel like a premium listening product instead of a basic file player. It focuses on a user's own songs, mood-based discovery, local library organization, polished mobile UI, lock-screen playback behavior, and a scanner workflow for adding new music without manually editing every manifest entry.

The app was created because mainstream streaming apps often interrupt listening with ads, hide useful controls behind subscriptions, and push recommendations that do not always match what the listener actually wants. GT Music takes the opposite direction: the library belongs to the listener, the interface adapts around mood, and the player is tuned for fast access to favorite songs.

## Current Project Size

These numbers were measured from the repository before this documentation update:

| Area | Count |
| --- | ---: |
| App, script, and config lines | 15,404 |
| `src` application lines | 14,150 |
| Script lines | 604 |
| Config and root app lines | 650 |
| Source files | 110 |
| Component files | 75 |
| Page files | 11 |
| Hook files | 9 |
| Library/helper files | 6 |
| Runtime dependencies | 51 |
| Dev dependencies | 21 |
| Songs in catalog | 164 |
| Total listening time | About 11.9 hours |
| Git commits measured | 33 |

Mood catalog:

| Mood | Songs |
| --- | ---: |
| Melodies | 38 |
| Mass | 35 |
| Romantic | 36 |
| Emotional | 21 |
| Uplifting | 34 |

## Timeline

Based on git history in this workspace:

- First recorded commit date: May 19, 2026
- Latest recorded commit date: May 29, 2026
- Actual build window visible from git: about 11 calendar days inclusive
- Commit count visible in git: 33 commits

This means the visible project work happened very quickly for the amount of UI, playback logic, metadata handling, scanner tooling, and mobile compatibility work included. The exact number of personal working hours cannot be proven from git alone, but the calendar window is clear from the repository history.

## Tech Stack

Core frontend:

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui and Radix UI
- React Router
- TanStack Query

Music and media:

- HTMLAudioElement playback
- Media Session API support
- `jsmediatags` for MP3 metadata and embedded artwork
- Custom audio engine utilities for equalizer-style DSP controls
- Local manifest-based catalog
- Mood folder scanner with duration extraction

App experience:

- PWA-ready manifest
- Mobile-first responsive layout
- Safe-area-aware UI for modern phones
- Bottom mobile navigation
- Desktop sidebar navigation
- Fullscreen player
- Mini-player
- Queue panel
- Mood browsing
- Library, albums, artists, liked songs, playlists, search, settings

Tooling:

- ESLint
- Vitest
- Vite production build
- Custom `npm run scan:songs` music scanner

## Main Features

- Personal music library playback from `public/songs`
- Mood folders: `melodies`, `mass`, `romantic`, `emotional`, `uplifting`
- Automatic manifest generation from folders
- Duplicate cleanup workflow
- Real duration extraction for MP3 and MP4/AAC-style files renamed as `.mp3`
- Dynamic metadata reading from audio files
- Embedded cover art extraction with fallback image
- Mood-based browsing and recommendations
- Search by song, artist, album, genre, mood, and file name
- Library sections for songs, albums, artists, liked songs, playlists, recent, top played, downloaded
- Listening analytics such as recently played and most played
- Lock-screen media controls using Media Session API
- Theme mode support
- Accent color support
- Equalizer/preset style sound settings
- Crossfade, fade-in, playback speed, sleep timer, queue, shuffle, repeat
- Mobile and desktop responsive UI

## How Complex Is This Application?

GT Music is more complex than a normal portfolio music player because it combines several difficult areas:

- Audio playback state management
- Background and lock-screen control synchronization
- Browser-specific mobile playback behavior
- Dynamic MP3 metadata reading
- Embedded image extraction
- Mood-based library classification
- Custom scanner tooling
- Responsive mobile-first UI
- PWA-like behavior
- Queue, playlists, likes, history, and analytics
- Theme, settings, and sound engine controls

Complexity rating: 8 out of 10 for a frontend-heavy personal media product.

It is not just a UI clone. It has real catalog logic, scanner automation, playback state, metadata processing, and device compatibility work.

## Why GT Music Is Unique

GT Music is different because it is built around personal ownership rather than platform control.

- No ads
- No subscription wall for core listening
- No forced recommendation feed
- Mood folders that match how the owner actually listens
- Local song scanning instead of manual entry
- Private personal catalog
- Album art and metadata pulled from the files themselves
- Fast access to favorite moods and songs
- UI designed like an app, not a plain website

The strongest idea is simple: the listener owns the music experience.

## Build Effort Estimate

If this app were built professionally from scratch, a realistic estimate depends on quality level.

Solo developer estimate:

- Basic MVP: 10 to 15 working days
- Current GT Music level: 25 to 45 working days
- Fully cloud-backed production product: 60 to 120 working days

Small team estimate:

- Product/UI designer: 5 to 10 days
- Frontend React engineer: 20 to 40 days
- Audio/PWA specialist: 7 to 15 days
- QA tester: 5 to 12 days
- Backend/cloud engineer if uploads and accounts are added: 15 to 40 days

The current version was built in about 11 visible calendar days from git history, which is much faster than a normal professional build schedule for this feature set.

## Cost Estimate

These are realistic rough estimates, not a fixed quote.

India freelance or small studio:

- MVP: INR 75,000 to INR 2,00,000
- Current GT Music level: INR 2,50,000 to INR 8,00,000
- Full cloud production platform: INR 8,00,000 to INR 25,00,000+

International freelance or agency:

- MVP: USD 2,000 to USD 6,000
- Current GT Music level: USD 8,000 to USD 25,000
- Full cloud production platform: USD 25,000 to USD 80,000+

The cost rises quickly if the app needs user accounts, cloud uploads, legal music storage, payment systems, native mobile apps, advanced audio processing, and professional QA across many devices.

## Who Would Normally Be Needed To Build This?

Minimum team:

- One strong React/TypeScript frontend engineer with good UI taste
- One product-minded designer, or the same engineer must also handle design

Ideal team:

- Product designer
- React/TypeScript frontend engineer
- Audio/PWA specialist
- QA tester with Android and iOS devices
- Backend/cloud engineer for real cloud uploads and account sync
- DevOps/deployment engineer for production reliability

For the current local-library version, one skilled builder can do it. For a true multi-user cloud music platform, a small team is better.

## Thangella's Role In This Project

Thangella acted as the creator, product owner, AI-assisted developer, QA reviewer, and prompt engineer for GT Music.

The role was not limited to requesting code. The project required continuous decisions about product direction, mobile behavior, UI/UX quality, song organization, scanner workflows, playback expectations, documentation, and production readiness. Thangella guided the application through many iterations by identifying issues from real device screenshots, describing expected behavior clearly, and pushing the app toward a more polished, real-world music-player experience.

Key contributions:

- Defined the product vision: a personal music player without ads, subscription pressure, or unwanted recommendations.
- Directed UI/UX improvements across home, search, library, moods, settings, player, mobile navigation, and developer modal.
- Tested on mobile-style layouts and real device screenshots, then converted visual problems into concrete implementation requests.
- Managed the music catalog structure, mood categories, duplicate cleanup, duration issues, and scanner workflow.
- Guided playback reliability work around lock-screen controls, background behavior, queue logic, and Media Session support.
- Drove the app from a basic music player toward a more complete personal cloud music experience.

## Prompt Engineering And AI-Agent Management Skill

GT Music is also a strong example of practical prompt engineering and AI-agent management.

Thangella demonstrated the ability to work with AI tools as a development partner rather than using them only for one-off code generation. The workflow involved giving detailed requirements, reviewing outputs, spotting incorrect assumptions, reporting device-specific problems, and continuing the iteration until the app behavior matched the expected product experience.

Strong areas shown in this project:

- Breaking a large application vision into small, actionable tasks.
- Giving clear feature requirements with expected results.
- Using screenshots and real UI observations to guide fixes.
- Asking for production-level behavior instead of surface-level UI changes.
- Managing token and context usage by continuing from the current project state instead of repeatedly restarting the task.
- Keeping the AI agent focused on implementation, testing, and verification.
- Avoiding wasted limits by bundling related fixes and asking for complete checks after major changes.
- Understanding when to request app-level improvements, code-level fixes, documentation, scanner tooling, or production validation.

This is valuable because modern AI-assisted development depends heavily on the human operator's clarity. A strong AI tool still needs a strong driver. In this project, Thangella provided the direction, judgment, testing feedback, and persistence needed to turn the app into a working product.

## What This Says About The Builder

This project shows that Thangella is capable of:

- Building real applications with AI-assisted workflows.
- Managing AI agents across long, multi-step development sessions.
- Thinking like a product owner, not only a user.
- Finding UI/UX and mobile compatibility problems through observation.
- Giving precise feedback that leads to better implementation.
- Managing context, tokens, limits, and iteration efficiently.
- Turning a personal problem into a useful software product.

In short, GT Music demonstrates strong practical prompt engineering, AI-powered development management, product thinking, and persistence.

## Current Limitations

- The app is currently static-file based, so deployed browsers cannot write new songs into `public/songs`.
- The in-app Scan Songs button works as a dev-server workflow; production deployments need `npm run scan:songs` and redeploy.
- True cloud upload, account sync, and cross-device library sync are not implemented yet.
- Advanced audio behavior can vary by mobile browser because iOS Safari and Android Chrome enforce different background playback rules.
- Metadata quality depends on the MP3 files themselves.

## What Should Be Added Next?

Highest-impact next improvements:

- Real cloud storage for song uploads
- User accounts and private libraries
- Server-side scanner API for production
- Upload UI with automatic mood selection
- Manual edit screen for title, artist, album, mood, and cover
- Playlist drag-and-drop editor
- Smart duplicate detection before upload
- Offline download/cache mode for selected songs
- Better listening analytics dashboard
- Import/export library backup
- Native Android wrapper for stronger background playback
- More iOS Safari testing
- Accessibility audit
- End-to-end tests for playback, search, scan, mood browsing, and settings

## Production Readiness

Current app status:

- Local personal-library app: strong
- PWA-style personal music player: strong
- Static deployment with pre-scanned songs: good
- Full cloud music platform: not yet, needs backend and storage

The project is already much more advanced than a basic music player. The next major step is turning the local `public/songs` workflow into a real cloud-backed upload and sync system.

## Final Positioning

GT Music can be described as:

> A premium personal music player built for people who want their own songs, their own moods, and a cleaner listening experience without ads, subscriptions, or unwanted platform noise.

It is best positioned as a personal cloud music experience, not a Spotify clone.
