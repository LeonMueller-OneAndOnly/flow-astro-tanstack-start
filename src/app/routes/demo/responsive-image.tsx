import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { ResponsiveImage, type ResponsiveImageData } from "@/components/ResponsiveImage";
import { Badge } from "@/components/ui/badge";

/*
 * Every import below points at the same three JPEGs, and each is a *different* module
 * to Vite because the query differs. That is the whole mechanism: the plugin claims any
 * specifier ending in `responsive`, runs sharp over the file at build time, emits one
 * asset per width x format, and returns a descriptor instead of a URL.
 *
 * None asks for a width above 1120, the intrinsic width of these files — see
 * `src/app/components/ResponsiveImage.tsx` for why that is a rule and not tidiness.
 */

// Full content width (max-w-4xl) at 2x would want ~1790px; 1120 is all there is.
import racing from "../../../assets/demo/example-guitar-racing.jpg?w=640;828;1120&responsive";

// A third of the content width, so ~290 CSS px, ~580 at 2x. `color` and `inline` bake
// their placeholder into the markup; `blurhash` decodes through a canvas and cannot be
// server-rendered, hence the `ClientOnly` below.
import travelingColor from "../../../assets/demo/example-guitar-traveling.jpg?w=320;640;960&lqip=color&responsive";
import travelingInline from "../../../assets/demo/example-guitar-traveling.jpg?w=320;640;960&lqip=inline&responsive";
import videoGamesBlurhash from "../../../assets/demo/example-guitar-video-games.jpg?w=320;640;960&lqip=blurhash&responsive";

// Fixed layout needs only the widths it will actually render at: 1x and 2x of 240.
import racingFixed from "../../../assets/demo/example-guitar-racing.jpg?w=240;480&format=original;webp&responsive";

/** The `lqip=` values the plugin accepts. */
type LqipKind = "color" | "inline" | "blurhash" | "thumbhash";

/** Served at `/app/demo/responsive-image`. */
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
        per format. Nothing here is generated per request — every candidate below is a file that
        already exists, which is what separates this from Astro&apos;s pipeline on an on-demand
        page.
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
        <ImageDataTable label="racing.jpg?w=640;828;1120" data={racing} />
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
          <Lqip
            kind="color"
            src={travelingColor}
            alt="Guitar with travel stickers, dominant-colour placeholder"
          />
          <Lqip
            kind="inline"
            src={travelingInline}
            alt="Guitar with travel stickers, inline blurred placeholder"
          />
          <Lqip
            kind="blurhash"
            src={videoGamesBlurhash}
            alt="Guitar in a video game finish, BlurHash placeholder"
          />
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

/**
 * One placeholder tile: the image, the kind of LQIP it was built with, and whether that
 * placeholder actually reached the descriptor — which is the only way a misspelled query
 * param shows up, since the plugin ignores what it does not recognise.
 *
 * It renders the image itself rather than taking it as `children`, so `src` exists once.
 * The earlier shape passed the descriptor twice, to the tile and to the image inside it,
 * and nothing stopped the two from disagreeing.
 */
function Lqip({ kind, src, alt }: { kind: LqipKind; src: ResponsiveImageData; alt: string }) {
  const image = <ResponsiveImage src={src} size={33} alt={alt} className="w-full rounded-xl" />;

  return (
    <div className="space-y-2">
      {/* Derived from `kind`, not passed in: the hash-based placeholders decode through
          a canvas during render and take the whole route down if they reach the server —
          see the SSR note in `src/app/components/ResponsiveImage.tsx`. Deriving it means
          a tile cannot be given the wrong wrapper. The cost is a blank box until
          hydration, which is the opposite of what a placeholder is for; on an SSR route,
          prefer `inline`. */}
      {kind === "blurhash" || kind === "thumbhash" ? (
        <ClientOnly fallback={<div className="aspect-square w-full rounded-xl bg-muted" />}>
          {image}
        </ClientOnly>
      ) : (
        image
      )}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{kind}</Badge>
        <span className="text-xs text-muted-foreground">
          {src.lqip ? "placeholder present" : "no placeholder"}
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
