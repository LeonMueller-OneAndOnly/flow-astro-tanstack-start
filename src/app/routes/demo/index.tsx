import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CloudUpload,
  Database,
  FileText,
  Guitar,
  Mail,
  Route as RouteIcon,
  Server,
  Sparkles,
} from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import type { ComponentType } from "react";

import { brandPageBackground, brandPrimaryButtonClass } from "../../lib/brand-theme";

/** Served at `/app/demo`; lists every starter demo. Delete `src/app/routes/demo` to drop them all. */
export const Route = createFileRoute("/demo/")({
  component: DemoIndex,
});

type Demo = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  tag: string;
  description: string;
  to: LinkProps["to"];
  /** Tailwind classes for the icon tile gradient — only used by featured cards. */
  accent: string;
};

/** The three demos we want to lead with — rendered large at the top of the page. */
const featured: ReadonlyArray<Demo> = [
  {
    icon: Guitar,
    title: "Dynamic Routes",
    tag: "Typed params",
    description:
      "A guitar catalog with list and detail routes. Click through to watch typed route params resolve a loader before the page paints.",
    to: "/demo/example/guitars",
    accent: "from-brand-primary-500 to-brand-secondary-500",
  },
  {
    icon: CloudUpload,
    title: "File Uploads",
    tag: "Multipart API",
    description:
      "Drag, drop, and watch the progress bar fill. Bytes stream to Flydrive while metadata lands in the database — one route handles both verbs.",
    to: "/demo/start/uploads",
    accent: "from-brand-secondary-500 to-brand-primary-500",
  },
  {
    icon: Mail,
    title: "Mail Worker",
    tag: "Server fn → queue",
    description:
      "Compose a message and see the rendered email live as you type. Submitting enqueues a background job through a typed server function.",
    to: "/demo/start/mail-worker",
    accent: "from-brand-primary-600 to-brand-secondary-600",
  },
];

/** The remaining framework references, shown in a compact grid below the featured row. */
const more: ReadonlyArray<Demo> = [
  {
    icon: Server,
    title: "Server Functions",
    tag: "RPC",
    description:
      "A tiny todo example that reads and writes data through a TanStack Start server function.",
    to: "/demo/start/server-funcs",
    accent: "",
  },
  {
    icon: RouteIcon,
    title: "API Endpoint",
    tag: "Route handler",
    description: "A client page that fetches data from a colocated TanStack API route.",
    to: "/demo/start/api-request",
    accent: "",
  },
  {
    icon: FileText,
    title: "SSR Modes",
    tag: "Rendering",
    description: "Small pages that demonstrate the available rendering modes in this starter.",
    to: "/demo/start/ssr",
    accent: "",
  },
  {
    icon: Database,
    title: "Client Store",
    tag: "State",
    description: "A compact TanStack Store example with derived state.",
    to: "/demo/store",
    accent: "",
  },
];

function DemoIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground" style={brandPageBackground}>
      <section className="relative overflow-hidden px-6 pt-20 pb-10 text-center">
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-5 text-sm font-extrabold tracking-[0.18em] text-brand-secondary-700 uppercase">
            TanStack Start demos
          </p>
          <h1 className="mb-6 text-5xl font-black tracking-[-0.04em] text-foreground md:text-7xl">
            Starter demo hub
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
            A small set of framework examples for routing, API handlers, server functions, SSR
            modes, state, and dynamic params. Every demo lives under{" "}
            <code className="rounded bg-foreground/5 px-2 py-1 font-semibold text-brand-secondary-700">
              /app/demo
            </code>
            .
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full px-7 py-3 ${brandPrimaryButtonClass}`}
            >
              TanStack Start docs
            </a>
            <Link
              to="/demo/example/guitars"
              className="rounded-full border border-foreground/20 bg-card/70 px-7 py-3 font-bold text-foreground transition-colors hover:border-brand-secondary-600/55"
            >
              Start with dynamic routes
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-6 flex items-center gap-2 text-sm font-extrabold tracking-[0.18em] text-brand-secondary-700 uppercase">
          <Sparkles className="h-4 w-4" />
          Featured
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {featured.map((demo) => (
            <Link
              key={demo.title}
              to={demo.to}
              className="group relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/70 p-7 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-secondary-500/60 hover:bg-card hover:shadow-2xl"
            >
              <div
                className={`absolute -top-24 -right-24 h-48 w-48 rounded-full bg-linear-to-br ${demo.accent} opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-25`}
              />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${demo.accent} text-white shadow-lg`}
                  >
                    <demo.icon className="h-7 w-7" />
                  </div>
                  <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {demo.tag}
                  </span>
                </div>
                <h3 className="mb-3 flex items-center gap-1.5 text-2xl font-bold text-foreground">
                  {demo.title}
                  <ArrowUpRight className="h-5 w-5 text-brand-secondary-600 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </h3>
                <p className="leading-relaxed text-muted-foreground">{demo.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-6 text-sm font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
          More references
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {more.map((demo) => (
            <Link
              key={demo.title}
              to={demo.to}
              className="group rounded-2xl border border-foreground/10 bg-card/70 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-brand-secondary-500/60 hover:bg-card"
            >
              <div className="mb-5 flex items-center gap-3">
                <demo.icon className="h-8 w-8 text-brand-primary-600" />
                <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {demo.tag}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{demo.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{demo.description}</p>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Replace these placeholder demos as the real application takes shape. Routes live in{" "}
          <code className="rounded bg-foreground/5 px-2 py-1 font-semibold text-brand-secondary-700">
            src/app/routes/demo
          </code>
          .
        </p>
      </section>
    </div>
  );
}
