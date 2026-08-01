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
            {/* BlurHash decodes through a canvas, so it cannot be server-rendered —
                see the SSR note in `src/app/components/ResponsiveImage.tsx`. The cost
                is a blank box until hydration, which is the opposite of what a
                placeholder is for; on an SSR route, prefer `inline`. */}
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
