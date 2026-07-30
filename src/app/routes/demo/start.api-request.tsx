import { useEffect, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
    <main className="mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
      <BackLink to="/demo" />
      <div className="mt-6 flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Names list</h1>
        {names ? <Badge variant="secondary">{names.length}</Badge> : null}
      </div>
      <DemoExplainer feature="TanStack API route + client fetch" className="mt-6">
        The list is served by a colocated server handler at <code>/app/demo/api/names</code> and
        loaded in the browser with <code>fetch</code> inside an effect — the same pattern you'd use
        to call any JSON endpoint.
      </DemoExplainer>

      {names === null ? (
        <ul
          className="mt-8 divide-y divide-border rounded-lg border border-border bg-card"
          aria-busy="true"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="px-5 py-3.5">
              <Skeleton className="h-5 w-32" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
          {names.map((name) => (
            <li key={name} className="px-5 py-3.5">
              {name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
