export type { ResponsiveImageProps } from "@responsive-image/react/responsive-image.js";
import type { ResponsiveImageProps } from "@responsive-image/react/responsive-image.js";
/**
 * What a `?responsive` import evaluates to. The package calls it `ImageData`, which
 * collides with the DOM global of that name, so it is re-derived rather than re-exported.
 */
export type ResponsiveImageData = ResponsiveImageProps["src"];

/**
 * The image component for everything React renders — the whole app under `/app`, and
 * any Astro island. `.astro` templates use Astro's own `<Image />` instead; see
 * "Which pipeline" below.
 *
 * ## Why this file exists rather than importing the package directly
 *
 * `@responsive-image/react` ships two builds of the same component. The package root
 * carries `import './responsive-image.css'`; the deep entry re-exported here does not.
 * The stylesheet is pulled in once, from `src/styles/globals.css`, so that those three
 * layout classes have exactly one origin.
 *
 * Import the package root instead and the sheet arrives a second time on Astro pages —
 * `"sideEffects": false` gets it tree-shaken out of the TanStack Start build but not
 * out of the island build, where it is inlined into a `<style>` tag. That copy is
 * unlayered, and unlayered CSS outranks everything in `@layer`: it would beat both the
 * `layer(base)` copy and every Tailwind utility on the same element. Nothing looks
 * wrong today only because the values happen to agree — `.ri-responsive { width:100% }`
 * against `w-full`. A `bg-contain` next to `.ri-img { background-size: cover }` would
 * not agree.
 *
 * The specifier keeps the `.js` extension because that is the literal export key in the
 * package's `exports` map; it is not a file path and must not be "corrected".
 *
 * ## Usage
 *
 *   import racing from "…/racing.jpg?w=640;828;1120&responsive";
 *   <ResponsiveImage src={racing} size={100} alt="…" />
 *
 * `?responsive` has to be the last query — the plugin's ambient module declarations use
 * a single wildcard and cannot match a query in the middle (see `src/env.d.ts`).
 * `size` is a vw number and selects the responsive layout; passing `width` instead
 * selects the fixed layout, which emits 1x and 2x candidates only.
 *
 * **Never request a width above the source's own.** The plugin does not enlarge an
 * image, but it does report the width that was *requested*: `generateResizedImage`
 * records `parseInt(w)`, and that number becomes the `w` descriptor in the `srcset`.
 * Ask a 1120px file for 1920 and the markup advertises a 1920w candidate that is
 * 1120px wide — and `srcset` selection has no way to find out. Astro's `<Image />`
 * clamps to the intrinsic width itself and needs no such care.
 *
 * ## Which pipeline, and why both exist
 *
 * Astro's is *conditional*, this one is not. Measured on one page by flipping a single
 * line, same components, same imports:
 *
 *   prerender = true   → 0 `/_image?` URLs, 48 files on disk
 *   prerender = false  → 48 `/_image?` URLs, 0 files
 *
 * So `astro:assets` processes at build time only for prerendered routes. On an
 * on-demand route it emits `/_image?href=…&w=640&f=webp` and encodes per request.
 * `@responsive-image` has no runtime path at all: every variant is a file, always.
 *
 * And `/_image` does not cache server-side. Not a slow cache — none:
 *
 *   - `astro/dist/assets/services/sharp.js` calls `sharpImport.cache(false)`,
 *     switching off the cache sharp brings by default.
 *   - The only cache in `astro/dist/assets/` lives in `build/generate.js` (that is
 *     where the build log's `reused cache entry` comes from). It is not in the server
 *     bundle.
 *   - Five identical requests: 0.208 / 0.173 / 0.177 / 0.179 / 0.180 s — no drop after
 *     the first. Five distinct variants wrote 0 files anywhere on disk.
 *   - The `ETag` is computed from the finished image and sent, but incoming
 *     `If-None-Match` is never read: a revalidating client pays the full re-encode
 *     *and* gets the whole body back, 200.
 *
 * The same bytes as a static build artifact: 0.0017 s. `Cache-Control: max-age=31536000`
 * is the only defence and it works exclusively beyond the server, in a browser or a
 * proxy.
 *
 * None of that bites on a prerendered Astro page, where only files exist. It starts the
 * moment a page turns on-demand — a `<Picture>` with two formats over five breakpoints
 * is then up to ten encodes per cold client.
 *
 * Rule of thumb: `.astro` page → Astro's `<Image />`, which also handles sources known
 * only at request time (CMS, database) that a build-time plugin cannot reach by
 * definition. React → this component. Nothing needs to change about the split unless a
 * page goes on-demand, and then it is worth checking what sits in front of the server.
 *
 * ## SSR limit
 *
 * `lqip=color` and `lqip=inline` bake their placeholder into the markup and render on
 * the server. `lqip=blurhash` and `lqip=thumbhash` do not: the plugin compiles a
 * `background-image` callback that decodes the hash through a `<canvas>`, the component
 * evaluates it during render, and the server throws `ReferenceError: document is not
 * defined` — taking the whole route down, not just the image. Wrap those in
 * `<ClientOnly>` or, on an SSR route, prefer `inline`.
 */
export { ResponsiveImage } from "@responsive-image/react/responsive-image.js";
