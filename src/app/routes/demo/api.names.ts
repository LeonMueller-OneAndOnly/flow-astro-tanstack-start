import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

/** Served at `/app/demo/api/names`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/api/names")({
  server: {
    handlers: {
      GET: () => json(["Alice", "Bob", "Charlie"]),
    },
  },
});
