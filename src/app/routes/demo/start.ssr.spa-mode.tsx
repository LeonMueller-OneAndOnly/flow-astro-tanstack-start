import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { getPunkSongs } from "@/lib/demo/data/demo.punk-songs";

/** Served at `/app/demo/start/ssr/spa-mode`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/ssr/spa-mode")({
  ssr: false,
  component: RouteComponent,
});

function RouteComponent() {
  const [punkSongs, setPunkSongs] = useState<
    Array<Awaited<ReturnType<typeof getPunkSongs>>[number]>
  >([]);

  useEffect(() => {
    getPunkSongs().then(setPunkSongs);
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
      <BackLink to="/demo/start/ssr" label="Back to SSR modes" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">SPA mode</h1>
      <DemoExplainer feature="ssr: false" className="mt-6">
        Nothing on this route renders on the server. The browser receives an empty shell, then
        fetches the songs client-side in an effect after hydration — expect a brief blank moment
        before the list appears.
      </DemoExplainer>

      <ul className="mt-8 shadow-soft divide-y divide-border rounded-xl border border-border bg-card">
        {punkSongs.map((song) => (
          <li key={song.id} className="flex flex-wrap gap-x-2 px-5 py-3.5">
            <span className="font-medium">{song.name}</span>
            <span className="text-muted-foreground">{song.artist}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
