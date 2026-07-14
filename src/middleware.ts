import { defineMiddleware } from "astro:middleware";
import { APP_ORIGIN } from "astro:env/server";

import { startJobQueueWorker } from "./integrations/job-queue/worker";

startJobQueueWorker();

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const onRequest = defineMiddleware((context, next) => {
  if (!unsafeMethods.has(context.request.method)) return next();

  const origin = context.request.headers.get("origin");

  if (origin !== APP_ORIGIN) {
    return new Response("Cross-site request forbidden", { status: 403 });
  }

  return next();
});
