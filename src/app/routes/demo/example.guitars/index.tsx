import { Link, createFileRoute } from "@tanstack/react-router";
import guitars from "../../../lib/demo/data/example-guitars";
import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";

/** Served at `/app/example/guitars/`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/example/guitars/")({
  component: GuitarsIndex,
});

function GuitarsIndex() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-10 pb-24">
      <BackLink to="/demo" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Featured guitars</h1>
      <DemoExplainer feature="Dynamic routes + typed params" className="mt-6 max-w-2xl">
        Each card is a typed <code>Link</code> that passes <code>guitarId</code> as a route param —
        the value printed on every card is exactly what it sends. On the detail route (
        <code>$guitarId</code>), the <code>loader</code> reads that param and resolves the matching
        guitar before the page renders.
      </DemoExplainer>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guitars.map((guitar) => (
          <li key={guitar.id} className="flex">
            <Link
              to="/demo/example/guitars/$guitarId"
              params={{ guitarId: guitar.id.toString() }}
              className="group flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/25"
            >
              <img
                src={guitar.image}
                alt={guitar.name}
                className="aspect-4/3 w-full border-b border-border object-cover"
              />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold tracking-tight">{guitar.name}</h2>
                  <span className="shrink-0 text-sm font-medium tabular-nums">${guitar.price}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {guitar.shortDescription}
                </p>
                <code className="mt-4 self-start">guitarId: &quot;{guitar.id}&quot;</code>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
