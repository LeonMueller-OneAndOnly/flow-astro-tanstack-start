import { useEffect, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { demoPageBackground } from "../../lib/demo/demo-theme";
import { $appPath } from "../../lib/typesafe-paths";

async function getNames() {
  return fetch($appPath({ to: "/demo/api/names" })).then((res) => res.json());
}

/** Served at `/app/demo/start/api-request`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/api-request")({
  component: Home,
});

function Home() {
  const [names, setNames] = useState<Array<string>>([]);

  useEffect(() => {
    getNames().then(setNames);
  }, []);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground"
      style={demoPageBackground}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
        <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-brand-secondary-700">
          API endpoint
        </p>
        <h1 className="mb-5 text-2xl font-bold tracking-tight text-foreground">Names list</h1>
        <ul className="mb-4 space-y-2">
          {names.map((name) => (
            <li
              key={name}
              className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 shadow-sm"
            >
              <span className="text-lg text-foreground">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
