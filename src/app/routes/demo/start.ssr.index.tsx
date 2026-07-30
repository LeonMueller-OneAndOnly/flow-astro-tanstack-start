import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";

/** Served at `/app/demo/start/ssr/`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/ssr/")({
  component: RouteComponent,
});

const modes = [
  {
    to: "/demo/start/ssr/spa-mode",
    title: "SPA mode",
    option: "ssr: false",
    body: "Nothing for this route renders on the server. The browser receives an empty shell, then fetches the data and renders the whole list on the client — fastest shell, slowest data.",
  },
  {
    to: "/demo/start/ssr/full-ssr",
    title: "Full SSR",
    option: "ssr: true",
    body: "The default. The loader runs on the server and the component is rendered to HTML there, then hydrated in the browser. Best for SEO and first paint — the list is in the initial response.",
  },
  {
    to: "/demo/start/ssr/data-only",
    title: "Data only",
    option: 'ssr: "data-only"',
    body: "The loader runs on the server and its data is serialized into the page, but the component renders only on the client. You skip the client-side data waterfall without paying to render markup on the server.",
  },
] as const;

function RouteComponent() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
      <BackLink to="/demo" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">SSR modes</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        The same punk-songs list, rendered three ways. Each route picks a different point on the
        server-versus-client spectrum — open them and watch where the work happens.
      </p>

      <DemoExplainer feature="Per-route ssr option" className="mt-8">
        One <code>ssr</code> field on each route definition decides where rendering happens. Same
        loader, same component — only the rendering boundary changes.
      </DemoExplainer>

      <ul className="mt-8 space-y-3">
        {modes.map((mode) => (
          <li key={mode.title}>
            <Link
              to={mode.to}
              className="group flex flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/25 hover:bg-accent/40"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold tracking-tight">{mode.title}</span>
                <code>{mode.option}</code>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mode.body}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Open
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
