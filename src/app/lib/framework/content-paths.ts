/**
 * Which paths are public content.
 *
 * One declaration, because "advertised in the sitemap" and "allowed in the index"
 * are the same question, asked by three callers that would otherwise drift apart
 * silently: `src/app/lib/framework/sitemap.ts` asks it to decide what to advertise,
 * `src/middleware.ts` asks it to decide what to mark `noindex`, and
 * `src/layouts/BaseLayout.astro` asks it for the prerendered pages middleware
 * never runs for.
 *
 * A path advertised in the sitemap but marked `noindex`,
 * or indexable but never advertised, is the kind of bug nobody notices for months.
 *
 * Despite sitting under `src/app`, it governs the whole site rather than only the
 * TanStack router under `/app` — the Astro layout and the middleware read it too.
 * Deliberately free of `node:*` and generator imports, unlike its `sitemap.ts`
 * neighbour: this one runs per request inside the server bundle, not only at
 * config time.
 *
 * Which of the three callers can act on a given rule depends on that route's
 * `prerender` flag, and the rules are written for both settings on purpose. The
 * node adapter serves a prerendered route as a static file, ahead of middleware,
 * so only the build-time meta tag reaches it; an on-demand route is the reverse,
 * and a non-HTML one has no head to hold a tag at all. Flipping a `prerender`
 * should change which mechanism marks a page, never whether it gets marked.
 */
export function isContentPath(pathname: string): boolean {
  // The callers disagree about the trailing slash: a request arrives with
  // whatever was typed, Astro's sitemap emits one, and a prerendering page reads
  // its own path as `/404/`. Every rule below matches whole segments, so the
  // slash is never information — strip it once here rather than writing each rule
  // twice and finding out which spelling was missed only from the built output.
  const path = pathname === "/" ? pathname : pathname.replace(/\/$/, "");

  // Astro internals: `/_image`, `/_actions`, `/_server-islands`.
  if (path.startsWith("/_")) return false;

  // Instructions for crawlers rather than something to show a reader.
  if (path === "/robots.txt") return false;

  // Covers a direct hit on `/404`, and a prerendered 404 page, which renders at
  // build time under its own pathname. It does not cover a 404 served for some
  // other URL — an unmatched request keeps the pathname it asked for, so no path
  // predicate can recognise it. `src/middleware.ts` catches that case by response
  // status instead, and the two together cover it whichever way `prerender` is set.
  if (path === "/404") return false;

  // Server endpoints. Nothing to read and nothing to preview.
  if (path === "/app/api" || path.startsWith("/app/api/")) return false;

  // Starter scaffolding. Deleting `src/app/routes/demo` leaves this rule matching
  // nothing, which is the intended end state for a real project.
  if (path === "/app/demo" || path.startsWith("/app/demo/")) return false;

  // The Astro-side half of the same scaffolding, under `src/pages/demo`. Separate
  // rule rather than a `/demo` suffix match, because the two trees are mounted at
  // unrelated prefixes and either can be deleted without the other.
  if (path === "/demo" || path.startsWith("/demo/")) return false;

  return true;
}
