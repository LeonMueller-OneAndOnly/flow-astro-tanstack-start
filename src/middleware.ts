import { defineMiddleware } from "astro:middleware";

import { startJobQueueWorker } from "./integrations/job-queue/worker";

startJobQueueWorker();

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
