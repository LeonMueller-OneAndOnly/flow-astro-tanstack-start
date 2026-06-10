import { Link, createFileRoute } from "@tanstack/react-router";
import guitars from "../../../lib/demo/data/example-guitars";
import { demoPageBackground } from "../../../lib/demo/demo-theme";

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
      style={demoPageBackground}
    >
      <div className="relative z-10 w-[60%] rounded-2xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-md">
        <Link
          to="/demo/example/guitars"
          className="mb-4 inline-block text-brand-primary-600 hover:text-brand-primary-700"
        >
          &larr; Back to all guitars
        </Link>
        <h1 className="mb-4 text-3xl font-bold tracking-tight">{guitar.name}</h1>
        <p className="mb-6 text-muted-foreground">{guitar.description}</p>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-brand-primary-600">${guitar.price}</div>
          <button className="rounded-lg bg-brand-primary-600 px-6 py-2 text-white transition-colors hover:bg-brand-primary-700">
            Add to Cart
          </button>
        </div>
      </div>

      <div className="absolute right-0 top-0 z-0 h-full w-[55%]">
        <div className="h-full w-full overflow-hidden rounded-2xl border-4 border-foreground/10 shadow-2xl">
          <img
            src={guitar.image}
            alt={guitar.name}
            className="w-full h-full object-cover guitar-image"
          />
        </div>
      </div>
    </div>
  );
}
