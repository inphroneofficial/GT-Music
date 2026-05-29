import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { scanSongsLibrary } from "./scripts/scan-songs.mjs";

function songScannerPlugin(): Plugin {
  return {
    name: "gt-music-song-scanner",
    configureServer(server) {
      server.middlewares.use("/api/scan-songs", (req, res) => {
        if (req.method !== "POST" && req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, message: "Use POST or GET to scan songs." }));
          return;
        }

        try {
          const result = scanSongsLibrary({ projectRoot: process.cwd() });
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            ok: false,
            message: error instanceof Error ? error.message : "Unable to scan songs.",
          }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), mode === "development" && songScannerPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          if (!normalizedId.includes("/node_modules/")) return undefined;
          if (normalizedId.includes("/node_modules/@radix-ui/") || normalizedId.includes("/node_modules/cmdk/") || normalizedId.includes("/node_modules/vaul/")) return "vendor-ui";
          if (normalizedId.includes("/node_modules/lucide-react/")) return "vendor-icons";
          if (normalizedId.includes("/node_modules/recharts/")) return "vendor-charts";
          if (normalizedId.includes("/node_modules/jsmediatags/")) return "vendor-media";
          if (
            normalizedId.includes("/node_modules/react/") ||
            normalizedId.includes("/node_modules/react-dom/") ||
            normalizedId.includes("/node_modules/react-router/") ||
            normalizedId.includes("/node_modules/react-router-dom/") ||
            normalizedId.includes("/node_modules/scheduler/")
          ) return "vendor-react";
          return undefined;
        },
      },
    },
  },
}));
