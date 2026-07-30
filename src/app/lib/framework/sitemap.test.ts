import { describe, expect, it } from "vitest";

import { getUnifiedSitemapOptions } from "./sitemap";

describe("getUnifiedSitemapOptions", () => {
  it("does not advertise an app sitemap when all app routes are excluded", async () => {
    const options = await getUnifiedSitemapOptions("https://example.com");

    expect(options.tanstackStart.pages).toEqual([]);
    expect(options.tanstackStart.sitemap).toBeUndefined();
    expect(options.astro.customSitemaps).toEqual([]);
    expect(options.astro.filter("https://example.com/")).toBe(true);
    expect(options.astro.filter("https://example.com/app/demo")).toBe(false);
    expect(options.astro.filter("https://example.com/app/api/auth/session")).toBe(false);
  });

  // The filter and the `noindex` marking read the same predicate, so this also
  // pins what `src/middleware.ts` and `src/layouts/BaseLayout.astro` will mark.
  it("excludes the paths that are not public content", async () => {
    const options = await getUnifiedSitemapOptions("https://example.com");

    expect(options.astro.filter("https://example.com/404")).toBe(false);
    expect(options.astro.filter("https://example.com/robots.txt")).toBe(false);
    expect(options.astro.filter("https://example.com/_image")).toBe(false);
  });

  // Astro emits sitemap URLs with a trailing slash and a prerendering page reads
  // its own path as `/404/`, so a rule that only matched the bare form would let
  // the built 404 page ship indexable.
  it("ignores a trailing slash", async () => {
    const options = await getUnifiedSitemapOptions("https://example.com");

    expect(options.astro.filter("https://example.com/404/")).toBe(false);
    expect(options.astro.filter("https://example.com/app/demo/")).toBe(false);
    expect(options.astro.filter("https://example.com/")).toBe(true);
  });
});
