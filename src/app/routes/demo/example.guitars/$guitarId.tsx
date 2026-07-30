import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Badge } from "@/components/ui/badge";
import guitars from "../../../lib/demo/data/example-guitars";
import { brandPageBackground, brandPrimaryButtonClass } from "../../../lib/brand-theme";
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
    <div
      className="relative flex min-h-screen items-center bg-background p-5 text-foreground"
      style={brandPageBackground}
    >
      <div className="relative z-10 w-[60%] rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-md">
        <BackLink to="/demo/example/guitars" label="Back to all guitars" />
        <DemoExplainer feature="Route loader resolved this page">
          The <code>$guitarId</code> from the URL was handed to the route <code>loader</code>, which
          looked up this guitar before the component rendered — so there's no loading state here.
        </DemoExplainer>

        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-1.5 font-mono text-xs text-muted-foreground">
          <span className="text-brand-secondary-700">GET</span>
          {currentPath}
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight">{guitar.name}</h1>
        <p className="mb-6 text-muted-foreground">{guitar.description}</p>
        <div className="mb-8 flex items-center justify-between">
          <Badge className="bg-brand-primary-600 px-3 py-1 text-base text-white">
            ${guitar.price}
          </Badge>
          <button className={`rounded-lg px-6 py-2 ${brandPrimaryButtonClass}`}>Add to Cart</button>
        </div>

        <div className="flex items-stretch justify-between gap-3 border-t border-foreground/10 pt-5">
          <PagerLink direction="prev" guitar={prev} />
          <PagerLink direction="next" guitar={next} />
        </div>
      </div>

      <div className="absolute top-0 right-0 z-0 h-full w-[55%]">
        <div className="h-full w-full overflow-hidden rounded-2xl border-4 border-foreground/10 shadow-2xl">
          <img
            src={guitar.image}
            alt={guitar.name}
            className={cn(
              // oxlint-disable-next-line better-tailwindcss/no-unknown-classes
              "guitar-image",
              "h-full w-full object-cover",
            )}
          />
        </div>
      </div>
    </div>
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
        "group flex flex-1 items-center gap-2 rounded-xl border border-foreground/10 bg-card/60 p-3 transition-colors hover:border-brand-secondary-500/50 hover:bg-card",
        isPrev ? "text-left" : "flex-row-reverse text-right",
      )}
    >
      {isPrev ? (
        <ChevronLeft className="h-5 w-5 shrink-0 text-brand-secondary-600 transition-transform group-hover:-translate-x-0.5" />
      ) : (
        <ChevronRight className="h-5 w-5 shrink-0 text-brand-secondary-600 transition-transform group-hover:translate-x-0.5" />
      )}
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted-foreground uppercase">
          {isPrev ? "Previous" : "Next"}
        </span>
        <span className="block truncate font-semibold">{guitar.name}</span>
      </span>
    </Link>
  );
}
