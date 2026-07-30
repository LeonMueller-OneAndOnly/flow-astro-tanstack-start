import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

// Requests that cannot change state are exempt, matching the previous Astro
// middleware. Everything else must carry a same-origin Sec-Fetch-Site, Origin or
// Referer.
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({
      // Traefik terminates TLS, so the server sees an internal HTTP request and
      // the request URL origin never matches the public one. Validating against
      // APP_ORIGIN is why Astro's built-in `checkOrigin` was disabled.
      //
      // Read as a build-time define (see vite.config.ts) rather than imported
      // from `./lib/env`, which is server-only and must not reach this entry's
      // client bundle.
      origin: import.meta.env.APP_ORIGIN,
      filter: ({ request }) => unsafeMethods.has(request.method),
      failureResponse: new Response("Cross-site request forbidden", { status: 403 }),
    }),
  ],
}));
