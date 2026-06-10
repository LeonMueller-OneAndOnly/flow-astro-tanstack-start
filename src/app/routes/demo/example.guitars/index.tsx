import { Link, createFileRoute } from "@tanstack/react-router";
import guitars from "../../../lib/demo/data/example-guitars";
import { brandPageBackground } from "../../../lib/brand-theme";

/** Served at `/app/example/guitars/`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/example/guitars/")({
  component: GuitarsIndex,
});

function GuitarsIndex() {
  return (
    <div className="min-h-screen bg-background p-5 text-foreground" style={brandPageBackground}>
      <h1 className="mb-8 text-center text-3xl font-black tracking-tight">Featured Guitars</h1>
      <div className="flex flex-wrap justify-center gap-12">
        {guitars.map((guitar) => (
          <div
            key={guitar.id}
            className="relative mb-24 w-full md:w-[calc(50%-1.5rem)] xl:w-[calc(33.333%-2rem)]"
          >
            <Link
              to="/demo/example/guitars/$guitarId"
              params={{
                guitarId: guitar.id.toString(),
              }}
            >
              <div className="group relative z-0 mb-8 aspect-square w-full">
                <div className="h-full w-full overflow-hidden rounded-2xl border-4 border-foreground/10 shadow-2xl">
                  <img
                    src={guitar.image}
                    alt={guitar.name}
                    className="guitar-image h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-brand-primary-600/90 px-4 py-2 text-sm font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                  View Details
                </div>
              </div>

              <div className="absolute bottom-0 right-0 z-10 w-[80%] translate-y-[40%] rounded-2xl border border-foreground/10 bg-card/80 p-5 shadow-xl backdrop-blur-md">
                <h2 className="mb-2 text-xl font-bold">{guitar.name}</h2>
                <p className="mb-3 line-clamp-2 text-muted-foreground">{guitar.shortDescription}</p>
                <div className="text-xl font-bold text-brand-primary-600">${guitar.price}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
