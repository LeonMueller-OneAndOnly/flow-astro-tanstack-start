import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { serve } from "srvx";

import { HOST, PORT } from "../src/app/lib/env.ts";
// Built by `vite build`. Default export is the `{ fetch }` server entry that
// src/app/server.ts re-exports.
import handler from "../dist/server/server.js";

/**
 * Production server, replacing the @astrojs/node standalone adapter.
 *
 * Written out rather than delegating to @tanstack/nitro-v2-vite-plugin: that
 * plugin sets `ssr.build.write = false` so it can hand Nitro an in-memory bundle,
 * which leaves no dist/server/server.js for Start's prerender pass to preview.
 * The two cannot both run, and prerendering is the more valuable half.
 *
 * Static files win over SSR so the prerendered pages are served as files, which
 * is what makes `prerender` worth anything.
 */
const clientDir = resolve(import.meta.dirname, "..", "dist", "client");

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

serve({
  hostname: HOST,
  port: PORT,
  async fetch(request) {
    const staticResponse = await serveStaticFile(request);

    return staticResponse ?? handler.fetch(request);
  },
});

console.log(`Listening on http://${HOST}:${PORT}`);

// ---

async function serveStaticFile(request: Request): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const { pathname } = new URL(request.url);
  const filePath = resolveWithinClientDir(pathname);

  if (!filePath) return null;

  // Prerendered pages are emitted as <route>/index.html, so a directory-style
  // request has to be redirected to the file before the SSR handler sees it.
  const candidates = extname(filePath) === "" ? [join(filePath, "index.html")] : [filePath];

  for (const candidate of candidates) {
    const stats = await stat(candidate).catch(() => null);

    if (!stats?.isFile()) continue;

    const headers = new Headers({
      "Content-Type": contentTypes[extname(candidate)] ?? "application/octet-stream",
      "Content-Length": String(stats.size),
      // Vite fingerprints everything under /assets, so those are immutable.
      // Prerendered HTML is not, and must be revalidated.
      "Cache-Control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
    });

    if (request.method === "HEAD") return new Response(null, { headers });

    return new Response(Readable.toWeb(createReadStream(candidate)) as ReadableStream, { headers });
  }

  return null;
}

/** Resolves a request path inside dist/client, or null if it escapes the directory. */
function resolveWithinClientDir(pathname: string): string | null {
  const decoded = decodeURIComponent(pathname);

  if (decoded.includes("\0")) return null;

  const candidate = resolve(clientDir, `.${decoded}`);

  return candidate === clientDir || candidate.startsWith(clientDir + sep) ? candidate : null;
}
