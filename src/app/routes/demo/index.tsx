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

/** Served at `/app/demo`; lists every starter demo. Delete `src/app/routes/demo` to drop them all. */
export const Route = createFileRoute("/demo/")({
  component: DemoIndex,
});

type Demo = {
  icon: ComponentType<{ className?: string }>;
  /** Tailwind classes for the pastel icon tile, cycled from the three shared tints. */
  tint: string;
  title: string;
  /** The framework capability the demo exists to show, not a category. */
  tag: string;
  description: string;
  to: LinkProps["to"];
};

const demos: ReadonlyArray<Demo> = [
  {
    icon: Guitar,
    tint: "bg-tint-sky text-tint-sky-ink",
    title: "Dynamic routes",
    tag: "Typed params",
    description:
      "A guitar catalog with list and detail routes. Typed route params resolve a loader before the page paints.",
    to: "/demo/example/guitars",
  },
  {
    icon: CloudUpload,
    tint: "bg-tint-mint text-tint-mint-ink",
    title: "File uploads",
    tag: "Multipart API",
    description:
      "Bytes stream to Flydrive while metadata lands in the database — one route handler covers both verbs.",
    to: "/demo/start/uploads",
  },
  {
    icon: Mail,
    tint: "bg-tint-sun text-tint-sun-ink",
    title: "Mail worker",
    tag: "Server fn → queue",
    description:
      "A typed server function enqueues a background job and returns immediately; a worker drains the queue.",
    to: "/demo/start/mail-worker",
  },
  {
    icon: Server,
    tint: "bg-tint-sky text-tint-sky-ink",
    title: "Server functions",
    tag: "RPC",
    description:
      "A todo list that reads and writes through TanStack Start server functions against the database.",
    to: "/demo/start/server-funcs",
  },
  {
    icon: RouteIcon,
    tint: "bg-tint-mint text-tint-mint-ink",
    title: "API endpoint",
    tag: "Route handler",
    description: "A client page that fetches JSON from a colocated TanStack API route.",
    to: "/demo/start/api-request",
  },
  {
    icon: FileText,
    tint: "bg-tint-sun text-tint-sun-ink",
    title: "SSR modes",
    tag: "Rendering",
    description: "The same list rendered three ways, one per value of the per-route ssr option.",
    to: "/demo/start/ssr",
  },
  {
    icon: Database,
    tint: "bg-tint-sky text-tint-sky-ink",
    title: "Client store",
    tag: "State",
    description: "A TanStack Store example with per-field subscriptions and derived state.",
    to: "/demo/store",
  },
];

function DemoIndex() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-16 pb-28 sm:px-8">
      <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-medium text-brand-ink">
        <span className="size-2 rounded-full bg-brand" />
        Demos
      </p>

      <h1 className="mt-6 max-w-2xl text-4xl leading-[1.12] font-semibold tracking-tight text-balance sm:text-5xl">
        Have a look at <span className="text-brand">how it all fits together.</span>
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        One small, working example per pattern — routing, API handlers, server functions, rendering
        modes, state and dynamic params. Open one, then go and read how it is put together.
      </p>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((demo) => (
          <li key={demo.title} className="flex">
            <Link
              to={demo.to}
              className="shadow-soft hover:shadow-lifted group flex flex-1 flex-col rounded-xl border border-border bg-card p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex size-9 items-center justify-center rounded-lg ${demo.tint}`}
                  aria-hidden="true"
                >
                  <demo.icon className="size-4.5" />
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {demo.tag}
                </span>
              </div>

              <h2 className="mt-4 font-semibold tracking-tight">{demo.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {demo.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                Open
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* The start page already explains why these exist and when to delete them. From
          here — where you are looking at the demos rather than reading about them —
          only the location is worth repeating. */}
      <p className="mt-16 max-w-3xl border-t border-border pt-8 text-sm leading-relaxed text-muted-foreground">
        Every one of these lives in <code>src/app/routes/demo</code>, with its data and helpers in{" "}
        <code>src/app/lib/demo</code>. Nothing outside those two folders depends on them, so
        deleting both is all it takes to clear the lot.
      </p>
    </main>
  );
}
