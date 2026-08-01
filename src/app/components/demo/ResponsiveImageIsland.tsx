// The CSS-free entry point, for the reason given in
// `src/app/routes/demo/responsive-image.tsx`. It matters most here: this is the island
// whose build inlines a second, unlayered copy of the rules into the page if the
// package root is imported instead.
import { ResponsiveImage } from "@responsive-image/react/responsive-image.js";

// Same file, same plugin as `src/app/routes/demo/responsive-image.tsx` — the point of
// this island is that the import resolves identically outside the TanStack Start
// router, in a React component Astro hydrates on its own page. Half the content width,
// so ~450 CSS px, ~900 at 2x; `w` stays at or below the source's own 1120 for the
// reason spelled out in that file.
import racing from "../../../assets/demo/example-guitar-racing.jpg?w=480;960;1120&lqip=inline&responsive";

/**
 * `<ResponsiveImage>` rendered as an Astro island, so the Astro comparison page can
 * put it next to Astro's own `<Image />` output. It exists as a component file only
 * because that is the unit Astro hydrates — there is no way to mount React inline
 * in a `.astro` template.
 *
 * Worth loading with `client:visible` or lower: the markup is fully rendered during
 * SSR, and hydration only takes over the load/error handling for the placeholder.
 */
export function ResponsiveImageIsland() {
  return (
    <ResponsiveImage
      src={racing}
      size={50}
      alt="A guitar finished in a racing livery"
      className="w-full rounded-xl"
    />
  );
}
