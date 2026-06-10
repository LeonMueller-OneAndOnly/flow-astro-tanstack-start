import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import guitars from "../../../lib/demo/data/example-guitars";
import { brandPageBackground } from "../../../lib/brand-theme";
import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Served at `/app/example/guitars/`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/example/guitars/")({
  component: GuitarsIndex,
});

function GuitarsIndex() {
  return (
    <div className="min-h-screen bg-background p-5 text-foreground" style={brandPageBackground}>
      <div className="mx-auto max-w-6xl">
        <BackLink to="/demo" />
        <h1 className="mb-4 text-center text-4xl font-black tracking-tight md:text-5xl">
          Featured Guitars
        </h1>
        <DemoExplainer feature="Dynamic routes + typed params" className="mx-auto max-w-xl">
          Each card is a typed <code>Link</code> that passes <code>guitarId</code> as a route param —
          the chip on every card is the exact value it sends. On the detail route (
          <code>$guitarId</code>), the <code>loader</code> reads that param and resolves the matching
          guitar before the page renders.
        </DemoExplainer>
        <div className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-28">
          {guitars.map((guitar) => (
            <div
              key={guitar.id}
              className="relative w-full md:w-[calc(50%-1.5rem)] xl:w-[calc(33.333%-2rem)]"
            >
              <Link
                to="/demo/example/guitars/$guitarId"
                params={{
                  guitarId: guitar.id.toString(),
                }}
                className="group block"
              >
                <div className="relative z-0 mb-8 aspect-square w-full">
                  <div className="h-full w-full overflow-hidden rounded-2xl border-4 border-foreground/10 shadow-2xl">
                    <img
                      src={guitar.image}
                      alt={guitar.name}
                      className={cn(
                        // oxlint-disable-next-line better-tailwindcss/no-unknown-classes
                        "guitar-image",
                        "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
                      )}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  </div>

                  <span className="absolute top-4 left-4 rounded-full bg-card/80 px-3 py-1 font-mono text-xs font-medium text-brand-secondary-700 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                    guitarId: &quot;{guitar.id}&quot;
                  </span>

                  <div className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-primary-600/90 px-4 py-2 text-sm font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                    View Details
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="absolute right-0 bottom-0 z-10 w-[80%] translate-y-[40%] rounded-2xl border border-foreground/10 bg-card/80 p-5 shadow-xl backdrop-blur-md transition-colors duration-300 group-hover:border-brand-secondary-500/50">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h2 className="text-xl font-bold">{guitar.name}</h2>
                    <Badge className="shrink-0 bg-brand-primary-600 text-white">
                      ${guitar.price}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground">{guitar.shortDescription}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
