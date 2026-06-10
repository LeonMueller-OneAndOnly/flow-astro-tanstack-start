import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CloudUpload,
  Database,
  FileText,
  Mail,
  Route as RouteIcon,
  Server,
  ShoppingBag,
} from "lucide-react";

import { demoPageBackground } from "../../lib/demo/demo-theme";

/** Served at `/app/demo`; lists every starter demo. Delete `src/app/routes/demo` to drop them all. */
export const Route = createFileRoute("/demo/")({
  component: DemoIndex,
});

function DemoIndex() {
  const demos = [
    {
      icon: <Server className="w-9 h-9 text-brand-primary-600" />,
      title: "Server Functions",
      description:
        "A tiny todo example that reads and writes data through a TanStack Start server function.",
      to: "/demo/start/server-funcs",
    },
    {
      icon: <RouteIcon className="w-9 h-9 text-brand-primary-600" />,
      title: "API Endpoint",
      description: "A client page that fetches data from a colocated TanStack API route.",
      to: "/demo/start/api-request",
    },
    {
      icon: <FileText className="w-9 h-9 text-brand-primary-600" />,
      title: "SSR Modes",
      description: "Small pages that demonstrate the available rendering modes in this starter.",
      to: "/demo/start/ssr",
    },
    {
      icon: <Database className="w-9 h-9 text-brand-primary-600" />,
      title: "Client Store",
      description: "A compact TanStack Store example with derived state.",
      to: "/demo/store",
    },
    {
      icon: <CloudUpload className="w-9 h-9 text-brand-primary-600" />,
      title: "File Uploads",
      description:
        "Reference upload flow using Flydrive with local storage and an S3 migration path.",
      to: "/demo/start/uploads",
    },
    {
      icon: <Mail className="w-9 h-9 text-brand-primary-600" />,
      title: "Mail Worker",
      description: "Queues a preview email so the background worker can process the job.",
      to: "/demo/start/mail-worker",
    },
    {
      icon: <ShoppingBag className="w-9 h-9 text-brand-primary-600" />,
      title: "Dynamic Routes",
      description: "A placeholder catalog with list and detail routes using route params.",
      to: "/demo/example/guitars",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground" style={demoPageBackground}>
      <section className="relative overflow-hidden px-6 py-20 text-center">
        <div className="relative max-w-5xl mx-auto">
          <p className="mb-5 text-sm font-extrabold uppercase tracking-[0.18em] text-brand-secondary-700">
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
              className="rounded-full bg-foreground px-7 py-3 font-bold text-background shadow-[0_18px_36px_color-mix(in_oklch,var(--foreground)_18%,transparent)] transition-transform hover:-translate-y-0.5"
            >
              TanStack Start docs
            </a>
            <Link
              to="/demo/start/server-funcs"
              className="rounded-full border border-foreground/20 bg-card/70 px-7 py-3 font-bold text-foreground transition-colors hover:border-brand-secondary-600/55"
            >
              Try server functions
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map((demo) => (
            <Link
              key={demo.title}
              to={demo.to}
              className="rounded-2xl border border-foreground/10 bg-card/70 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-brand-secondary-500/60 hover:bg-card"
            >
              <div className="mb-5">{demo.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">{demo.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{demo.description}</p>
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
