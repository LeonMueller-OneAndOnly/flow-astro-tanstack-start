import { ClientOnly, createFileRoute } from "@tanstack/react-router";
// `@responsive-image/react` publishes two builds of this component: the package root
// carries `import './responsive-image.css'`, this entry does not. Taking the one
// without leaves `src/styles/globals.css` as the single source of those rules — see
// the note there. Via the root the stylesheet arrives twice on an Astro page, and the
// second copy is unlayered, so it outranks both the `layer(base)` copy and every
// Tailwind utility on the same element.
import { ResponsiveImage } from "@responsive-image/react/responsive-image.js";
import type { ReactNode } from "react";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Badge } from "@/components/ui/badge";

/*
 * Every import below points at the same three JPEGs, and each one is a *different*
 * module to Vite because the query string differs. That is the whole mechanism:
 * `@responsive-image/vite-plugin` (registered in `astro.config.ts`) intercepts any
 * import whose query ends in `responsive`, runs sharp over the file at build time,
 * emits one asset per width × format, and hands back an `ImageData` descriptor
 * instead of a URL string. The component picks a candidate from that descriptor.
 *
 * The `?responsive` part has to come last — see the note in `src/env.d.ts`.
 */

/*
 * Every import narrows `w` instead of inheriting the global list from
 * `astro.config.ts`, and none of them asks for more than 1120 — the intrinsic width
 * of these three files. That is not tidiness. The plugin does not enlarge an image,
 * but it also does not correct the number it reports: `generateResizedImage` records
 * the width that was *requested*, and that number becomes the `w` descriptor in the
 * `srcset`. Ask for 1920 from a 1120px source and the markup promises a 1920px
 * candidate that is 1120px wide, which is the one input the browser's selection is
 * not allowed to be wrong about — it will pick that file for a 2x display and get
 * fewer pixels than it sized for.
 *
 * So the rule for every `?responsive` import: no width above the source's own.
 * Astro's `<Image />` needs no such care because it clamps to the intrinsic width
 * itself — compare the `srcset` values on `/demo/responsive-image`.
 */

// Full content width (max-w-4xl) at 2x would want ~1790px; 1120 is all there is.
import racing from "../../../assets/demo/example-guitar-racing.jpg?w=640;828;1120&responsive";

// A third of the content width, so ~290 CSS px, ~580 at 2x. LQIP variants: `color`
// bakes a hex code into the markup and `inline` a ~600 byte data-URL, so both render
// on the server. `blurhash` ships a 34 byte hash plus a 2 KB decoder, and cannot —
// see the `ClientOnly` note further down.
import travelingColor from "../../../assets/demo/example-guitar-traveling.jpg?w=320;640;960&lqip=color&responsive";
import travelingInline from "../../../assets/demo/example-guitar-traveling.jpg?w=320;640;960&lqip=inline&responsive";
import videoGamesBlurhash from "../../../assets/demo/example-guitar-video-games.jpg?w=320;640;960&lqip=blurhash&responsive";

// Fixed layout needs only the widths it will actually render at: 1x and 2x of 240.
import racingFixed from "../../../assets/demo/example-guitar-racing.jpg?w=240;480&format=original;webp&responsive";

/**
 * What a `?responsive` import evaluates to. Derived from one rather than imported as
 * `ImageData` from `@responsive-image/core`, only to avoid shadowing the DOM global of
 * that name — the package is a direct dependency either way, because the module the
 * plugin generates for each image import resolves `@responsive-image/core` from the
 * project root, not from its own tree.
 */
type ResponsiveImageData = typeof racing;

/** Served at `/app/demo/responsive-image`; the TanStack Start half of the image comparison. */
export const Route = createFileRoute("/demo/responsive-image")({
  component: DemoResponsiveImage,
});

function DemoResponsiveImage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-10 pb-24">
      <BackLink to="/demo" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Responsive images</h1>

      <DemoExplainer feature="@responsive-image/react + Vite plugin" className="mt-6">
        Images are imported with a <code>?responsive</code> query, resized and re-encoded at build
        time, and rendered as a <code>&lt;picture&gt;</code> with one <code>&lt;source&gt;</code>{" "}
        per format. The same three files are rendered with Astro&apos;s own{" "}
        <code>&lt;Image /&gt;</code> on <code>/demo/responsive-image</code> — open both and compare
        the emitted markup.
      </DemoExplainer>

      <Section
        title="Responsive layout"
        note="size={100} declares the image occupies 100vw, which becomes the sizes attribute. The browser then picks a width from srcset for its own viewport and DPR — which is why no import here asks for a width above 1120, the intrinsic width of these files. The plugin would report the requested width regardless, and a srcset that overstates a candidate misleads exactly the calculation it exists to feed."
      >
        <ResponsiveImage
          src={racing}
          size={100}
          alt="A guitar finished in a racing livery"
          className="w-full rounded-xl"
        />
        <ImageDataTable label="racing.jpg?responsive" data={racing} />
      </Section>

      <Section
        title="Fixed layout"
        note="width without size switches to the fixed strategy: a 240px box, with the 480px candidate reserved for 2x displays. Height is derived from the aspect ratio, so the box never shifts while loading."
      >
        <ResponsiveImage
          src={racingFixed}
          width={240}
          alt="The same guitar at a fixed 240px"
          className="rounded-xl"
        />
        <ImageDataTable label="racing.jpg?w=240;480&format=original;webp" data={racingFixed} />
      </Section>

      <Section
        title="Placeholders (LQIP)"
        note="Throttle the network in devtools and reload — each tile shows a different placeholder while the full image streams in. The cost is paid in the HTML, not in an extra request."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <Lqip kind="color" data={travelingColor}>
            <ResponsiveImage
              src={travelingColor}
              size={33}
              alt="Guitar with travel stickers, dominant-colour placeholder"
              className="w-full rounded-xl"
            />
          </Lqip>
          <Lqip kind="inline" data={travelingInline}>
            <ResponsiveImage
              src={travelingInline}
              size={33}
              alt="Guitar with travel stickers, inline blurred placeholder"
              className="w-full rounded-xl"
            />
          </Lqip>
          <Lqip kind="blurhash" data={videoGamesBlurhash}>
            {/*
             * Client-only, and not by preference. The plugin compiles a BlurHash
             * placeholder into a `background-image` callback that decodes the hash
             * through a `<canvas>`, and `<ResponsiveImage>` evaluates that callback
             * during render — so rendering this on the server throws
             * `ReferenceError: document is not defined` and takes the whole route
             * with it. `color` and `inline` have no decode step and render fine
             * on the server.
             *
             * The cost is a blank box until hydration, which is the opposite of what
             * a placeholder is for. On an SSR route, prefer `inline`.
             */}
            <ClientOnly fallback={<div className="aspect-square w-full rounded-xl bg-muted" />}>
              <ResponsiveImage
                src={videoGamesBlurhash}
                size={33}
                alt="Guitar in a video game finish, BlurHash placeholder"
                className="w-full rounded-xl"
              />
            </ClientOnly>
          </Lqip>
        </div>
      </Section>
    </main>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">{note}</p>
      <div className="shadow-soft mt-5 space-y-4 rounded-xl border border-border bg-card p-6">
        {children}
      </div>
    </section>
  );
}

function Lqip({
  kind,
  data,
  children,
}: {
  kind: string;
  data: ResponsiveImageData;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {children}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{kind}</Badge>
        {/* Proof the placeholder actually made it into the descriptor rather than
            silently falling back to nothing when a query param is misspelled. */}
        <span className="text-xs text-muted-foreground">
          {data.lqip ? "placeholder present" : "no placeholder"}
        </span>
      </div>
    </div>
  );
}

/**
 * The build output, read back off the descriptor the plugin generated. Without this
 * the only way to check what was emitted is to read the network panel — and a
 * misconfigured `w` or `format` looks identical to a correct one on screen.
 */
function ImageDataTable({ label, data }: { label: string; data: ResponsiveImageData }) {
  const widths = data.availableWidths ?? [];
  const types = Array.isArray(data.imageTypes) ? data.imageTypes : [data.imageTypes];

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-border pt-4 text-sm">
      <dt className="text-muted-foreground">import</dt>
      <dd className="font-mono text-xs break-all">{label}</dd>
      <dt className="text-muted-foreground">formats</dt>
      <dd className="font-mono text-xs">{types.join(", ")}</dd>
      <dt className="text-muted-foreground">widths</dt>
      <dd className="font-mono text-xs">{widths.join(", ") || "—"}</dd>
      <dt className="text-muted-foreground">aspect ratio</dt>
      <dd className="font-mono text-xs">{data.aspectRatio?.toFixed(3) ?? "—"}</dd>
      <dt className="text-muted-foreground">largest candidate</dt>
      <dd className="font-mono text-xs break-all">
        {widths.length > 0 ? (data.imageUrlFor(widths[widths.length - 1]) ?? "—") : "—"}
      </dd>
    </dl>
  );
}
