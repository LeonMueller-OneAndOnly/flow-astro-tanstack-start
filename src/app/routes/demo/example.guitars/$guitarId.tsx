import { createFileRoute } from "@tanstack/react-router";
import { BackLink } from "@/components/BackLink";
import guitars from "../../../lib/demo/data/example-guitars";
import { brandPageBackground, brandPrimaryButtonClass } from "../../../lib/brand-theme";
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

  return (
    <div
      className="relative flex min-h-screen items-center bg-background p-5 text-foreground"
      style={brandPageBackground}
    >
      <div className="relative z-10 w-[60%] rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-md">
        <BackLink to="/demo/example/guitars" label="Back to all guitars" />
        <h1 className="mb-4 text-3xl font-bold tracking-tight">{guitar.name}</h1>
        <p className="mb-6 text-muted-foreground">{guitar.description}</p>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-brand-primary-600">${guitar.price}</div>
          <button className={`rounded-lg px-6 py-2 ${brandPrimaryButtonClass}`}>Add to Cart</button>
        </div>
      </div>

      <div className="absolute right-0 top-0 z-0 h-full w-[55%]">
        <div className="h-full w-full overflow-hidden rounded-2xl border-4 border-foreground/10 shadow-2xl">
          <img
            src={guitar.image}
            alt={guitar.name}
            className={cn(
              // oxlint-disable-next-line better-tailwindcss/no-unknown-classes
              "guitar-image",
              "w-full h-full object-cover",
            )}
          />
        </div>
      </div>
    </div>
  );
}
