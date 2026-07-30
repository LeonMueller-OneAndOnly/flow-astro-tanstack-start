import { useEffect, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { brandPageBackground } from "../../lib/brand-theme";
import { $appPath } from "../../lib/framework/typesafe-paths";

async function getNames(): Promise<Array<string>> {
  return fetch($appPath({ to: "/demo/api/names" })).then((res) => res.json());
}

/** Served at `/app/demo/start/api-request`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/api-request")({
  component: Home,
});

function Home() {
  const [names, setNames] = useState<Array<string> | null>(null);

  useEffect(() => {
    getNames().then(setNames);
  }, []);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground"
      style={brandPageBackground}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
        <BackLink to="/demo" />
        <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-brand-secondary-700">
          API endpoint
        </p>
        <div className="mb-5 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Names list</h1>
          {names ? <Badge variant="secondary">{names.length} names</Badge> : null}
        </div>
        <DemoExplainer feature="TanStack API route + client fetch">
          The list is served by a colocated server handler at <code>/app/demo/api/names</code> and
          loaded in the browser with <code>fetch</code> inside an effect — the same pattern you'd
          use to call any JSON endpoint.
        </DemoExplainer>
        {names === null ? (
          <ul className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                <Skeleton className="h-6 w-32" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-2">
            {names.map((name) => (
              <li
                key={name}
                className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 shadow-sm"
              >
                <span className="text-lg text-foreground">{name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
