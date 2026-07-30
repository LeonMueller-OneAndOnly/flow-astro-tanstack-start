import { describe, expect, it } from "vitest";

import { getSitemapPages, staticPaths } from "./sitemap";

describe("getSitemapPages", () => {
  it("marks api, demo and underscore routes as sitemap-excluded but still lists them", async () => {
    const pages = await getSitemapPages();

    expect(pages.length).toBeGreaterThan(0);

    for (const page of pages) {
      const shouldExclude =
        page.path.startsWith("/_") ||
        page.path === "/api" ||
        page.path.startsWith("/api/") ||
        page.path === "/demo" ||
        page.path.startsWith("/demo/") ||
        page.path === "/robots.txt";

      expect(page.sitemap?.exclude ?? false).toBe(shouldExclude);
    }
  });

  it("lists robots.txt so the prerender pass emits it, without advertising it", async () => {
    const pages = await getSitemapPages();
    const robots = pages.find((page) => page.path === "/robots.txt");

    expect(robots).toBeDefined();
    expect(robots?.sitemap?.exclude).toBe(true);
  });

  it("omits dynamic segments, which cannot be prerendered or listed", async () => {
    const pages = await getSitemapPages();

    expect(pages.filter((page) => page.path.includes("$"))).toEqual([]);
  });

  it("only allowlists paths for prerendering that are known pages", async () => {
    const pages = await getSitemapPages();
    const paths = new Set(pages.map((page) => page.path));

    for (const staticPath of staticPaths) {
      expect([...paths]).toContain(staticPath);
    }
  });
});
