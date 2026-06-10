import { createFileRoute, Link } from "@tanstack/react-router";
import { getPunkSongs } from "@/lib/demo/data/demo.punk-songs";
import { brandPageBackground } from "@/lib/brand-theme";

/** Served at `/app/demo/start/ssr/full-ssr`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/ssr/full-ssr")({
  component: RouteComponent,
  loader: async () => await getPunkSongs(),
});

function RouteComponent() {
  const punkSongs = Route.useLoaderData();

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground"
      style={brandPageBackground}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
        <Link
          to="/demo/start/ssr"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden>←</span> Back to SSR demos
        </Link>
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-brand-secondary-700">
          Full SSR - Punk Songs
        </h1>
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
