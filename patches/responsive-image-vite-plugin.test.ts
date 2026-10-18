import { createServer } from "vite";
import { describe, expect, it } from "vitest";

import { responsiveImage } from "@responsive-image/vite-plugin";

/**
 * Guards `@responsive-image__vite-plugin@3.0.1.patch`, which carries two hunks that
 * only take effect in dev:
 *
 * - Vite 8 creates the module entry after the `load` hook, so the `meta` the plugin
 *   hands from `load` to its later hooks is dropped in the client dev pipeline.
 *   Without the fallback the image module comes back empty and importing it fails
 *   with "doesn't provide an export named: 'default'".
 * - The served path used to embed the module id including its import query, which a
 *   proxy in front of the dev server can re-serialise (`;` → `&`). Digested, the URL
 *   has no query left to mangle.
 *
 * Both assertions run through the pipeline the browser actually uses, so a lost patch
 * — or a Vite upgrade that changes the behaviour — fails here instead of silently
 * breaking every `?responsive` import in dev.
 */
describe("@responsive-image/vite-plugin dev serving", () => {
  it("returns a real module for the client and a query-free served path", async () => {
    const server = await createServer({
      root: process.cwd(),
      configFile: false,
      logLevel: "silent",
      server: { middlewareMode: true },
      // Same options as `astro.config.ts`, so the test speaks for the app.
      plugins: [responsiveImage({ format: ["original", "webp", "avif"], styles: "inline" })],
    });

    try {
      // `?import` is the marker Vite adds to asset imports; the rest is the module id
      // the image middleware keys on.
      const result = await server.transformRequest(
        "/src/assets/demo/example-guitar-racing.jpg?import&w=640;828;1120&responsive",
      );
      const code = result?.code ?? "";

      expect(code, "load meta is lost, the dev client module came back empty").toContain(
        "export default",
      );

      const servedPaths = [
        ...new Set(
          [...code.matchAll(/\/@responsive-image\/vite-plugin\/[^"'\\]+/g)].map(
            (match) => match[0],
          ),
        ),
      ];
      expect(servedPaths.length).toBeGreaterThan(0);

      for (const path of servedPaths) {
        expect(path, "served path carries a query a proxy could re-serialise").not.toContain("?");
        expect(path, "served path is not the digested module id").toMatch(/\/[0-9a-f]{32}$/);
      }
    } finally {
      await server.close();
    }
  });
});
