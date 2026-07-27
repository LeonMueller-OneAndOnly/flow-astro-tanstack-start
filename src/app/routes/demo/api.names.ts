import { createFileRoute } from "@tanstack/react-router";

/** Served at `/app/demo/api/names`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/api/names")({
  server: {
    handlers: {
      GET: () => Response.json(["Alice", "Bob", "Charlie"]),
    },
  },
});
