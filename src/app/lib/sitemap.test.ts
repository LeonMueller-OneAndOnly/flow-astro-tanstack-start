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
});
