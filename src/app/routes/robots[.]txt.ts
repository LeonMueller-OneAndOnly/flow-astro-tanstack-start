import { createFileRoute } from "@tanstack/react-router";

import { APP_ORIGIN } from "../lib/env";

/**
 * Replaces src/pages/robots.txt.ts. The `[.]` in the filename escapes the dot so
 * the route path is `/robots.txt` rather than `/robots/txt`.
 *
 * Listed in `getSitemapPages()` and allowlisted in `staticPaths`, so the
 * prerender pass writes it out as a static file at build time. APP_ORIGIN is
 * therefore baked in at build — the same tradeoff the Astro version made once its
 * sitemap started doing this, and fine because images are built per environment.
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            "User-agent: *",
            "Disallow:",
            `Sitemap: ${new URL("sitemap.xml", APP_ORIGIN).href}`,
            "",
          ].join("\n"),
          { headers: { "Content-Type": "text/plain; charset=utf-8" } },
        ),
    },
  },
});
