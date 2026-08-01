export type { ResponsiveImageProps } from "@responsive-image/react/responsive-image.js";
import type { ResponsiveImageProps } from "@responsive-image/react/responsive-image.js";

/**
 * What a `?responsive` import evaluates to. The package calls it `ImageData`, which
 * collides with the DOM global of that name, so it is re-derived rather than re-exported.
 */
export type ResponsiveImageData = ResponsiveImageProps["src"];

/**
 * Build-time processed images, via `@responsive-image/vite-plugin` (see `astro.config.ts`).
 * Usable anywhere React renders: routes under `/app`, and `.astro` templates directly.
 *
 * ## Usage
 *
 *   import racing from "…/racing.jpg?w=640;828;1120&responsive";
 *   <ResponsiveImage src={racing} size={100} alt="…" />
 *
 * - `?responsive` must be the **last** query. The plugin's ambient declarations use a
 *   single wildcard and cannot match a query in the middle (`src/env.d.ts`).
 * - `size` is a vw number → responsive layout. `width` instead → fixed layout, 1x/2x.
 * - **Never request a width above the source's own.** The plugin does not enlarge, but
 *   it reports the *requested* width, and that becomes the `w` descriptor: a 1120px
 *   file asked for 1920 advertises a 1920w candidate it cannot deliver, and `srcset`
 *   selection has no way to detect it. Astro's `<Image />` clamps by itself. There is
 *   no global ceiling to fall back on — `astro.config.ts` leaves the plugin's defaults
 *   alone so large assets can use them, which makes this per-import `w` the only guard.
 * - In `.astro`: `className`, not `class`. `class` is dropped silently — no warning
 *   from Astro, React or the build. Astro's own `<Image />` takes `class`, so the two
 *   differ side by side.
 *
 * ## Versus Astro's `<Image />`
 *
 * Same encoder, same output bytes. The difference is *when*: Astro's pipeline is conditional, this one is not.
 *
 *   prerender = true   → files on disk, like here
 *   prerender = false  → `/_image?href=…&w=640&f=webp`, encoded per request
 *
 * And `/_image` has no server-side cache — sharp's own is switched off explicitly, the
 * only cache in `astro/dist/assets` sits in the build path and is absent from the
 * server bundle, and incoming `If-None-Match` is never read, so a revalidating client
 * pays the full re-encode and still gets a 200. Measured ~0.18 s per variant against
 * 0.0017 s for a static file; `Cache-Control: max-age=31536000` only helps beyond the
 * server.
 *
 * So: `.astro` page → `<Image />`, which also handles sources known only at request
 * time (CMS, database) that a build-time plugin cannot reach at all. React, or anything
 * that must not depend on `prerender` staying `true` → this component.
 *
 * ## SSR limit
 *
 * `lqip=color` and `lqip=inline` bake the placeholder into the markup. `lqip=blurhash`
 * and `lqip=thumbhash` decode through a `<canvas>` during render and throw
 * `ReferenceError: document is not defined` on the server, taking the route with them —
 * wrap those in `<ClientOnly>`, or prefer `inline` on an SSR route.
 *
 * Without hydration the placeholder is never removed (`onLoad` is what drops it), so it
 * stays behind the image: invisible under an opaque photo, visible through transparency.
 *
 * ## Why the odd specifier
 *
 * The package ships two builds of this component; the root carries
 * `import './responsive-image.css'`, the entry re-exported here does not. The
 * stylesheet comes from `src/styles/globals.css` alone, in `layer(base)`.
 *
 * Via the root it arrives twice on Astro pages — tree-shaken out of the TanStack Start
 * build by `"sideEffects": false`, but inlined into a `<style>` tag by the island
 * build. That copy is unlayered and would outrank every Tailwind utility on the same
 * element. The `.js` is the literal key in the package's `exports` map, not a file path. Do not
 * "correct" it.
 */
export { ResponsiveImage } from "@responsive-image/react/responsive-image.js";
