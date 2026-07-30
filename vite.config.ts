import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { imagetools } from "vite-imagetools";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import { loadConfigEnv } from "./src/app/lib/config-env";
import { getSitemapPages, staticPaths } from "./src/app/lib/sitemap";

// Config-time env loading, previously done in astro.config.ts. Merges .env files
// with `omnisd env export` output, then seeds process.env so the dev server and
// the build see the same values that src/app/lib/env.ts validates at runtime.
const configEnv = loadConfigEnv();

for (const [key, value] of Object.entries(configEnv)) {
  process.env[key] ??= value;
}

// Hardcoded defaults; only secrets and deployment-specific values come from env.
const defaultAppEnv = "local";
const defaultHost = "127.0.0.1";
const defaultPort = "4321";

const appEnv = process.env.APP_ENV ?? defaultAppEnv;
const host = process.env.HOST ?? defaultHost;
const port = Number(process.env.PORT ?? defaultPort);
const appOrigin = process.env.APP_ORIGIN ?? `http://${host}:${port}`;

const pages = await getSitemapPages();

export default defineConfig({
  // Astro's `server: { host, port }`. The built Nitro node server reads HOST and
  // PORT from the environment instead, seeded by the `--import` preload in the
  // `start` script.
  server: {
    host,
    port,
    // Required since Vite 6 for the dev server to answer requests carrying the
    // deployment hostname rather than localhost.
    allowedHosts: [new URL(appOrigin).hostname],
  },

  resolve: {
    // Native in Vite 8; honours the `@/*` and `src/*` aliases from tsconfig.json.
    tsconfigPaths: true,
  },

  define: {
    "import.meta.env.APP_ENV": JSON.stringify(appEnv),
    "import.meta.env.APP_ORIGIN": JSON.stringify(appOrigin),
  },

  plugins: [
    imagetools(),
    tanstackStart({
      srcDirectory: "./src/app",
      pages,
      sitemap: { host: appOrigin },
      prerender: {
        enabled: true,
        failOnError: true,
        // Start prerenders every entry in `pages` by default, so the static
        // routes are allowlisted explicitly — the equivalent of Astro's per-route
        // `export const prerender`. Crawling and discovery are off so the
        // prerendered set stays deterministic and demo/API routes are never
        // captured as static files.
        filter: (page) => staticPaths.has(page.path),
        crawlLinks: false,
        autoStaticPathsDiscovery: false,
      },
    }),
    react(),
    tailwindcss(),
  ],
});
