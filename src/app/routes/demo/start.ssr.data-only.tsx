import { createFileRoute } from "@tanstack/react-router";
import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { getPunkSongs } from "@/lib/demo/data/demo.punk-songs";

/** Served at `/app/demo/start/ssr/data-only`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/ssr/data-only")({
  ssr: "data-only",
  component: RouteComponent,
  loader: async () => await getPunkSongs(),
});

function RouteComponent() {
  const punkSongs = Route.useLoaderData();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
      <BackLink to="/demo/start/ssr" label="Back to SSR modes" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Data only</h1>
      <DemoExplainer feature='ssr: "data-only"' className="mt-6">
        The <code>loader</code> runs on the server and its data is serialized into the page, but the
        component renders only on the client. You skip the client-side data waterfall without paying
        to render the markup on the server.
      </DemoExplainer>

      <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
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
