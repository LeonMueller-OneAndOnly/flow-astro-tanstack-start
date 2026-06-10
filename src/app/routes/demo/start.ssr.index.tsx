import { createFileRoute, Link } from "@tanstack/react-router";

import { demoPageBackground } from "../../lib/demo/demo-theme";

/** Served at `/app/demo/start/ssr/`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/ssr/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground"
      style={demoPageBackground}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
        <h1 className="mb-8 bg-linear-to-r from-brand-primary-600 to-brand-secondary-600 bg-clip-text text-center text-4xl font-black tracking-tight text-transparent">
          SSR Demos
        </h1>
        <div className="flex flex-col gap-4">
          <Link
            to="/demo/start/ssr/spa-mode"
            className="rounded-xl border border-brand-primary-500/30 bg-brand-primary-600 px-8 py-6 text-center text-2xl font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-primary-700"
          >
            SPA Mode
          </Link>
          <Link
            to="/demo/start/ssr/full-ssr"
            className="rounded-xl border border-brand-secondary-500/30 bg-brand-secondary-600 px-8 py-6 text-center text-2xl font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-secondary-700"
          >
            Full SSR
          </Link>
          <Link
            to="/demo/start/ssr/data-only"
            className="rounded-xl border border-foreground/10 bg-linear-to-r from-brand-primary-600 to-brand-secondary-600 px-8 py-6 text-center text-2xl font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            Data Only
          </Link>
        </div>
      </div>
    </div>
  );
}
