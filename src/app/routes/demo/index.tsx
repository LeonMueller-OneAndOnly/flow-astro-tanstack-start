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

/** Served at `/app/demo`; lists every starter demo. Delete `src/app/routes/demo` to drop them all. */
export const Route = createFileRoute("/demo/")({
  component: DemoIndex,
});

function DemoIndex() {
  const demos = [
    {
      icon: <Server className="w-9 h-9 text-cyan-300" />,
      title: "Server Functions",
      description:
        "A tiny todo example that reads and writes data through a TanStack Start server function.",
      to: "/demo/start/server-funcs",
    },
    {
      icon: <RouteIcon className="w-9 h-9 text-cyan-300" />,
      title: "API Endpoint",
      description: "A client page that fetches data from a colocated TanStack API route.",
      to: "/demo/start/api-request",
    },
    {
      icon: <FileText className="w-9 h-9 text-cyan-300" />,
      title: "SSR Modes",
      description: "Small pages that demonstrate the available rendering modes in this starter.",
      to: "/demo/start/ssr",
    },
    {
      icon: <Database className="w-9 h-9 text-cyan-300" />,
      title: "Client Store",
      description: "A compact TanStack Store example with derived state.",
      to: "/demo/store",
    },
    {
      icon: <CloudUpload className="w-9 h-9 text-cyan-300" />,
      title: "File Uploads",
      description:
        "Reference upload flow using Flydrive with local storage and an S3 migration path.",
      to: "/demo/start/uploads",
    },
    {
      icon: <Mail className="w-9 h-9 text-cyan-300" />,
      title: "Mail Worker",
      description: "Queues a preview email so the background worker can process the job.",
      to: "/demo/start/mail-worker",
    },
    {
      icon: <ShoppingBag className="w-9 h-9 text-cyan-300" />,
      title: "Dynamic Routes",
      description: "A placeholder catalog with list and detail routes using route params.",
      to: "/demo/example/guitars",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden px-6 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.16),transparent_30%)]" />
        <div className="relative max-w-5xl mx-auto">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            TanStack Start demos
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            Starter demo hub
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
            A small set of framework examples for routing, API handlers, server functions, SSR
            modes, state, and dynamic params. Every demo lives under{" "}
            <code className="rounded bg-slate-900 px-2 py-1 text-cyan-300">/app/demo</code>.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-cyan-400 px-7 py-3 font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              TanStack Start docs
            </a>
            <Link
              to="/demo/start/server-funcs"
              className="rounded-full border border-slate-700 px-7 py-3 font-semibold text-slate-100 transition-colors hover:border-cyan-300"
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
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/70 hover:bg-slate-900"
            >
              <div className="mb-5">{demo.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-white">{demo.title}</h3>
              <p className="leading-relaxed text-slate-400">{demo.description}</p>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-slate-500">
          Replace these placeholder demos as the real application takes shape. Routes live in{" "}
          <code className="rounded bg-slate-900 px-2 py-1 text-cyan-300">src/app/routes/demo</code>.
        </p>
      </section>
    </div>
  );
}
