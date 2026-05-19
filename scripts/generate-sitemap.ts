// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";

// TODO: replace with your project URL once a custom domain is set.
const BASE_URL = "";

interface Entry { path: string; changefreq?: string; priority?: string }

const staticRoutes: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/search", changefreq: "monthly", priority: "0.6" },
  { path: "/library", changefreq: "weekly", priority: "0.8" },
  { path: "/liked", changefreq: "weekly", priority: "0.7" },
  { path: "/settings", changefreq: "yearly", priority: "0.3" },
];

const entries: Entry[] = [...staticRoutes];

try {
  const manifestPath = resolve("public/songs/manifest.json");
  if (existsSync(manifestPath)) {
    const data = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const seenAlbums = new Set<string>();
    const seenArtists = new Set<string>();
    const seenGenres = new Set<string>();
    for (const s of data.songs || []) {
      if (s.album && !seenAlbums.has(s.album)) {
        seenAlbums.add(s.album);
        entries.push({ path: `/album/${encodeURIComponent(s.album)}`, changefreq: "monthly", priority: "0.6" });
      }
      if (s.artist && !seenArtists.has(s.artist)) {
        seenArtists.add(s.artist);
        entries.push({ path: `/artist/${encodeURIComponent(s.artist)}`, changefreq: "monthly", priority: "0.6" });
      }
      if (s.genre && !seenGenres.has(s.genre)) {
        seenGenres.add(s.genre);
        entries.push({ path: `/genre/${encodeURIComponent(s.genre)}`, changefreq: "monthly", priority: "0.5" });
      }
    }
  }
} catch (e) {
  console.warn("sitemap: could not read manifest", e);
}

const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : "",
      e.priority ? `    <priority>${e.priority}</priority>` : "",
      `  </url>`,
    ].filter(Boolean).join("\n"),
  ),
  `</urlset>`,
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${entries.length} entries)`);
