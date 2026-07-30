import { createFileRoute } from "@tanstack/react-router";

/** Served at `/demo/api/names`. */
export const Route = createFileRoute("/demo/api/names")({
  server: {
    handlers: {
      GET: () => Response.json(["Alice", "Bob", "Charlie"]),
    },
  },
});
