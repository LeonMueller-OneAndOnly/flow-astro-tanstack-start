import { defineMiddleware } from "astro:middleware";

import { Result } from "./app/lib/result";

// Astro builds the server bundle once, then executes that same artifact in the
// build process to prerender static routes — so this module loads during
// `astro build` too, and every `import.meta.env` value (SSR, MODE, PROD) is
// identical there and at runtime. Only the host process differs, which makes
// argv the sole reliable discriminator: the build runs `astro.mjs build`, the
// server runs `dist/server/entry.mjs`, dev runs `astro.mjs dev`. A false
// positive is impossible for the server entry (argv[2] is undefined), so the
// worker can never be skipped in production.
const [, entrypoint = "", subcommand] = process.argv;
const isAstroBuild = /[\\/]astro(\.mjs|\.js)?$/.test(entrypoint) && subcommand === "build";

// Imported dynamically, not statically: the worker module constructs the queue
// and loads the job registry at module scope, which opens the database. A static
// import would do that during every build, before this guard could skip it.
if (!isAstroBuild) {
  void Result.fromAsync(() => import("./integrations/job-queue/worker")).then((result) => {
    if (!result.success) {
      console.error("Failed to load job queue worker", result.error);
      return;
    }

    result.data.startJobQueueWorker();
  });
}

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const appOrigin = new URL(import.meta.env.SITE).origin;

export const onRequest = defineMiddleware((context, next) => {
  if (!unsafeMethods.has(context.request.method)) return next();

  const origin = context.request.headers.get("origin");

  if (origin !== appOrigin) {
    return new Response("Cross-site request forbidden", { status: 403 });
  }

  return next();
});
