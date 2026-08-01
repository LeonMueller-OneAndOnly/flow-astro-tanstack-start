import { ResponsiveImage } from "@/components/ResponsiveImage";

// Half the content width, so ~450 CSS px, ~900 at 2x — and never above the source's
// own 1120.
import racing from "../../../assets/demo/example-guitar-racing.jpg?w=480;960;1120&lqip=inline&responsive";

/**
 * `<ResponsiveImage>` rendered as an Astro island, so the Astro comparison page can put
 * it next to Astro's own `<Image />` output on the same document. It exists as a
 * component file only because that is the unit Astro hydrates — React cannot be mounted
 * inline in a `.astro` template.
 *
 * Also the case that proves the plugin is registered for both build halves rather than
 * only for TanStack Start: if it were not, this import would fail to resolve here.
 *
 * `client:visible` or lower is right: the markup is fully rendered during SSR, and
 * hydration only takes over swapping the placeholder out once the image has loaded.
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
