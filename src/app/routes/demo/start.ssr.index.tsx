import { createFileRoute, Link } from "@tanstack/react-router";

import { brandPageBackground } from "../../lib/brand-theme";

/** Served at `/app/demo/start/ssr/`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/ssr/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground"
      style={brandPageBackground}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
        <h1 className="bg-linear-to-r from-brand-primary-600 to-brand-secondary-600 bg-clip-text text-center text-4xl font-black tracking-tight text-transparent">
          SSR Demos
        </h1>
        <p className="mx-auto mt-3 mb-8 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
          The same punk-songs list, rendered three ways. Each route picks a
          different point on the server-vs-client spectrum — open them and watch
          where the work happens.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            to="/demo/start/ssr/spa-mode"
            className="group rounded-xl border border-brand-primary-500/30 bg-card/60 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary-500/60 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xl font-bold text-foreground">SPA Mode</span>
              <code className="rounded bg-brand-primary-500/10 px-2 py-1 text-xs font-semibold text-brand-primary-700">
                ssr: false
              </code>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Nothing for this route renders on the server. The browser receives
              an empty shell, then fetches the data and renders the whole list on
              the client — fastest shell, slowest data.
            </p>
          </Link>

          <Link
            to="/demo/start/ssr/full-ssr"
            className="group rounded-xl border border-brand-secondary-500/30 bg-card/60 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-secondary-500/60 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xl font-bold text-foreground">Full SSR</span>
              <code className="rounded bg-brand-secondary-500/10 px-2 py-1 text-xs font-semibold text-brand-secondary-700">
                ssr: true
              </code>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The default. The loader runs on the server and the component is
              rendered to HTML there, then hydrated in the browser. Best for SEO
              and first paint — the list is in the initial response.
            </p>
          </Link>

          <Link
            to="/demo/start/ssr/data-only"
            className="group rounded-xl border border-foreground/10 bg-card/60 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xl font-bold text-foreground">Data Only</span>
              <code className="rounded bg-foreground/5 px-2 py-1 text-xs font-semibold text-foreground/70">
                ssr: "data-only"
              </code>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The loader runs on the server and its data is serialized into the
              page, but the component renders only on the client. You skip the
              client-side data waterfall without paying to render the markup on
              the server.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
