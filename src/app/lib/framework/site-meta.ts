/**
 * The head tags every page carries, in one place, because this site renders from
 * two roots: `src/layouts/BaseLayout.astro` for the Astro pages and
 * `src/app/routes/__root.tsx` for the TanStack Start app under `/app`.
 *
 * What stays *out* of here is anything a root can only answer for itself:
 * absolute URLs (Astro has `Astro.site`, the app has the request) and image processing
 * (`getImage` is Astro-only). Callers resolve those and pass the finished strings in.
 */
export const SITE = {
  name: "Omnis Start",
  description: "A shared Astro and TanStack Start application shell.",
  /** The `lang` attribute on `<html>`, and the language half of `og:locale`. */
  lang: "en",
  /** The territory half of `og:locale`, which wants language_TERRITORY. */
  region: "US",
  charset: "utf-8",
  /**
   * MDN's standard boilerplate. `width=device-width` alone behaves the same on
   * current browsers — the orientation-zoom bug `initial-scale` used to work
   * around was fixed in iOS 6 — so this is convention, not a fix.
   */
  viewport: "width=device-width, initial-scale=1",
  /** Matches `theme_color` in `public/manifest.json`; an installed PWA and a
      browser chrome tinting from the tag should not disagree. */
  themeColor: "#111111",
  /** Stand-in for a page with no image of its own. Square — see `imageIsSized`. */
  fallbackImage: "/logo512.png",
  /** The 1.91:1 box Facebook, X, LinkedIn, WhatsApp and Slack all render. */
  ogImageWidth: 1200,
  ogImageHeight: 630,
} as const;

/**
 * A `<meta>` tag in the shape both roots accept. A union rather than one
 * interface with everything optional, so a tag cannot be constructed with a
 * `name` and no `content` (renders as a no-op) or with both `name` and
 * `property` (whichever the consumer reads first wins, silently).
 *
 * `charSet` is React's spelling. Astro passes attributes through verbatim, and
 * HTML attribute names are case-insensitive, so the same key is correct in both
 * roots — this is the one tag with no `content`.
 */
export type MetaTag =
  | { charSet: string; name?: never; property?: never; content?: never }
  | { name: string; content: string; charSet?: never; property?: never }
  | { property: string; content: string; charSet?: never; name?: never };

export interface LinkTag {
  rel: string;
  href: string;
  type?: string;
}

/** Identical on every page, so neither root spells them out. */
export const HEAD_LINKS: LinkTag[] = [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.json" },
];

/**
 * The directive every path outside the sitemap carries, as a meta tag via
 * `buildMetaTags` and as an `X-Robots-Tag` header in `src/middleware.ts`. It
 * lives here rather than next to `isContentPath` because it is a head tag first:
 * the predicate decides *whether* a path is marked, this decides *what is said*.
 *
 * A constant rather than a vocabulary, because `isContentPath` answers yes or no:
 * there is no caller left that could pick between variants, and a free string
 * would let a typo fail silently — the directive is ignored and the page gets
 * indexed.
 *
 * `follow` rather than `nofollow`, so a crawler that lands on a 404 or a demo
 * still walks the links back into the real pages. Nothing this marks is worth
 * sealing link equity off from.
 *
 * Only the negative direction exists, because being indexable is the default and
 * needs no tag at all.
 */
export const NOINDEX = "noindex, follow";

export interface SocialPreview {
  /** Canonical page URL, absolute — a scraper has no document base to resolve a path against. */
  url: string;
  /** Absolute too, and a format every scraper decodes (jpeg/png, not avif or webp). */
  imageUrl: string;
  imageAlt: string;
  type: "website" | "article";
  /**
   * True when `imageUrl` is a crop at `SITE.ogImageWidth`×`SITE.ogImageHeight`.
   * Declaring those dimensions over an image that does not have them makes the
   * card render at the wrong aspect ratio, so the square fallback sets this
   * false and gets the small card layout instead.
   */
  imageIsSized: boolean;
}

export interface PageMeta {
  title: string;
  description: string;
  /**
   * Left out for pages nobody shares — the app shell under `/app`. Cards there
   * would advertise a page that is `noindex` and has no content of its own.
   */
  social?: SocialPreview;
  /** `NOINDEX` for a page outside the sitemap, omitted for one inside it. */
  robots?: typeof NOINDEX;
}

/**
 * Every `<meta>` a page needs, charset and viewport included, so a root never
 * hand-writes one. Charset comes first: a parser only honours it inside the first
 * 1024 bytes of the document, so this list has to be rendered at the top of the
 * head.
 *
 * The `<title>` is the one exception, because it is not a `<meta>` at all: Astro
 * needs a `<title>` element and TanStack needs a `{ title }` entry in its meta
 * array. Both pass the same string in as `title` for the card titles below.
 */
export function buildMetaTags({ title, description, social, robots }: PageMeta): MetaTag[] {
  const tags: MetaTag[] = [
    { charSet: SITE.charset },
    { name: "viewport", content: SITE.viewport },
    { name: "description", content: description },
    { name: "theme-color", content: SITE.themeColor },
  ];

  if (robots) tags.push({ name: "robots", content: robots });
  if (!social) return tags;

  tags.push(
    { property: "og:type", content: social.type },
    { property: "og:site_name", content: SITE.name },
    { property: "og:locale", content: `${SITE.lang}_${SITE.region}` },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: social.url },
    { property: "og:image", content: social.imageUrl },
    { property: "og:image:alt", content: social.imageAlt },
  );

  if (social.imageIsSized) {
    // jpeg is implied by `imageIsSized`: a sized image is one a caller generated
    // for the card, and it re-encodes to jpeg because several scrapers still fail
    // to decode avif and webp.
    tags.push(
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: String(SITE.ogImageWidth) },
      { property: "og:image:height", content: String(SITE.ogImageHeight) },
    );
  }

  // Twitter's tags are still the ones Slack, Discord and X read; the large card
  // only looks right with a wide image behind it.
  tags.push(
    { name: "twitter:card", content: social.imageIsSized ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: social.imageUrl },
    { name: "twitter:image:alt", content: social.imageAlt },
  );

  return tags;
}
