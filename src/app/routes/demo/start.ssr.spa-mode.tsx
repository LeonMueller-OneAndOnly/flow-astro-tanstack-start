import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { getPunkSongs } from "@/lib/demo/data/demo.punk-songs";
import { brandPageBackground } from "@/lib/brand-theme";

/** Served at `/app/demo/start/ssr/spa-mode`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/ssr/spa-mode")({
  ssr: false,
  component: RouteComponent,
});

function RouteComponent() {
  const [punkSongs, setPunkSongs] = useState<Awaited<ReturnType<typeof getPunkSongs>>>([]);

  useEffect(() => {
    getPunkSongs().then(setPunkSongs);
  }, []);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground"
      style={brandPageBackground}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
        <BackLink to="/demo/start/ssr" label="Back to SSR demos" />
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-brand-primary-700">
          SPA Mode - Punk Songs
        </h1>
        <DemoExplainer feature="ssr: false">
          Nothing on this route renders on the server. The browser receives an empty shell, then
          fetches the songs client-side in an effect after hydration — expect a brief blank moment
          before the list appears.
        </DemoExplainer>
        <ul className="space-y-3">
          {punkSongs.map((song) => (
            <li
              key={song.id}
              className="rounded-lg border border-foreground/10 bg-foreground/5 p-4 shadow-sm"
            >
              <span className="text-lg font-medium text-foreground">{song.name}</span>
              <span className="text-muted-foreground"> - {song.artist}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
