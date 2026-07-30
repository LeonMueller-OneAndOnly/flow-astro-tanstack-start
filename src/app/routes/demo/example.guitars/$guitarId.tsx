import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Button } from "@/components/ui/button";
import guitars from "../../../lib/demo/data/example-guitars";
import { $appPath } from "../../../lib/framework/typesafe-paths";
import { cn } from "@/lib/utils";

/**
 * Served at `/app/example/guitars/:guitarId`.
 * TanStack's `$guitarId` segment is the dynamic URL part after Astro's `/app` mount.
 */
export const Route = createFileRoute("/demo/example/guitars/$guitarId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const guitar = guitars.find((guitar) => guitar.id === +params.guitarId);
    if (!guitar) {
      throw new Error("Guitar not found");
    }
    return guitar;
  },
});

function RouteComponent() {
  const guitar = Route.useLoaderData();

  // Wrap-around neighbours, so prev/next always point at a real guitar — this is
  // the demo's whole point: each link just swaps the `guitarId` route param.
  const index = guitars.findIndex((entry) => entry.id === guitar.id);
  const prev = guitars[(index - 1 + guitars.length) % guitars.length];
  const next = guitars[(index + 1) % guitars.length];

  const currentPath = $appPath({
    to: "/demo/example/guitars/$guitarId",
    params: { guitarId: guitar.id.toString() },
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-10 pb-24">
      <BackLink to="/demo/example/guitars" label="Back to all guitars" />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <img
          src={guitar.image}
          alt={guitar.name}
          className="aspect-4/3 w-full rounded-xl border border-border object-cover"
        />

        <div>
          <code className="inline-block">GET {currentPath}</code>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{guitar.name}</h1>
          <p className="mt-2 text-lg font-medium tabular-nums">${guitar.price}</p>
          <p className="mt-4 leading-relaxed text-muted-foreground">{guitar.description}</p>

          <Button className="mt-6">Add to cart</Button>

          <DemoExplainer feature="Route loader resolved this page" className="mt-8">
            The <code>$guitarId</code> from the URL was handed to the route <code>loader</code>,
            which looked up this guitar before the component rendered — so there is no loading state
            here.
          </DemoExplainer>
        </div>
      </div>

      <nav
        aria-label="Guitar pagination"
        className="mt-12 flex items-stretch justify-between gap-3 border-t border-border pt-6"
      >
        <PagerLink direction="prev" guitar={prev} />
        <PagerLink direction="next" guitar={next} />
      </nav>
    </main>
  );
}

function PagerLink({
  direction,
  guitar,
}: {
  direction: "prev" | "next";
  guitar: (typeof guitars)[number];
}) {
  const isPrev = direction === "prev";
  return (
    <Link
      to="/demo/example/guitars/$guitarId"
      params={{ guitarId: guitar.id.toString() }}
      className={cn(
        "shadow-soft hover:shadow-lifted group flex flex-1 items-center gap-2 rounded-xl border border-border bg-card p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5",
        isPrev ? "text-left" : "flex-row-reverse text-right",
      )}
    >
      {isPrev ? (
        <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
      ) : (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
      <span className="min-w-0">
        <span className="block font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {isPrev ? "Previous" : "Next"}
        </span>
        <span className="mt-0.5 block truncate font-medium">{guitar.name}</span>
      </span>
    </Link>
  );
}
