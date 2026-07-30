import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CloudUpload,
  Database,
  FileText,
  Guitar,
  Mail,
  Route as RouteIcon,
  Server,
} from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import type { ComponentType } from "react";

import { buttonVariants } from "@/components/ui/button";

/** Served at `/app/demo`; lists every starter demo. Delete `src/app/routes/demo` to drop them all. */
export const Route = createFileRoute("/demo/")({
  component: DemoIndex,
});

type Demo = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  /** The framework capability the demo exists to show, not a category. */
  tag: string;
  description: string;
  to: LinkProps["to"];
};

const demos: ReadonlyArray<Demo> = [
  {
    icon: Guitar,
    title: "Dynamic routes",
    tag: "Typed params",
    description:
      "A guitar catalog with list and detail routes. Typed route params resolve a loader before the page paints.",
    to: "/demo/example/guitars",
  },
  {
    icon: CloudUpload,
    title: "File uploads",
    tag: "Multipart API",
    description:
      "Bytes stream to Flydrive while metadata lands in the database — one route handler covers both verbs.",
    to: "/demo/start/uploads",
  },
  {
    icon: Mail,
    title: "Mail worker",
    tag: "Server fn → queue",
    description:
      "A typed server function enqueues a background job and returns immediately; a worker drains the queue.",
    to: "/demo/start/mail-worker",
  },
  {
    icon: Server,
    title: "Server functions",
    tag: "RPC",
    description:
      "A todo list that reads and writes through TanStack Start server functions against the database.",
    to: "/demo/start/server-funcs",
  },
  {
    icon: RouteIcon,
    title: "API endpoint",
    tag: "Route handler",
    description: "A client page that fetches JSON from a colocated TanStack API route.",
    to: "/demo/start/api-request",
  },
  {
    icon: FileText,
    title: "SSR modes",
    tag: "Rendering",
    description: "The same list rendered three ways, one per value of the per-route `ssr` option.",
    to: "/demo/start/ssr",
  },
  {
    icon: Database,
    title: "Client store",
    tag: "State",
    description: "A TanStack Store example with per-field subscriptions and derived state.",
    to: "/demo/store",
  },
];

function DemoIndex() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-16 pb-24">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        TanStack Start demos
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Starter demo hub</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Framework examples for routing, API handlers, server functions, SSR modes, state, and
        dynamic params. Every one lives under <code>/app/demo</code>.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/demo/example/guitars" className={buttonVariants({ size: "lg" })}>
          Start with dynamic routes
        </Link>
        <a
          href="https://tanstack.com/start"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          TanStack Start docs
        </a>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((demo) => (
          <li key={demo.title} className="flex">
            <Link
              to={demo.to}
              className="group flex flex-1 flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/25 hover:bg-accent/40"
            >
              <div className="flex items-center justify-between gap-3">
                <demo.icon className="size-5 text-muted-foreground" />
                <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                  {demo.tag}
                </span>
              </div>
              <h2 className="mt-4 font-semibold tracking-tight">{demo.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {demo.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Open
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-12 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Keep these around while building — they are a working reference for how this project wires
        up routing, server functions, uploads, and SSR, so an agent can follow the established
        conventions. Delete <code>src/app/routes/demo</code> and <code>src/app/lib/demo</code>{" "}
        before deploying.
      </p>
    </main>
  );
}
