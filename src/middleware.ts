import { defineMiddleware } from "astro:middleware";

import { instrumentationPath } from "./integrations/instrumentation/instrument";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const appOrigin = new URL(import.meta.env.SITE).origin;

export const onRequest = defineMiddleware((context, next) => {
  // The instrumentation endpoint is called by the boot scripts, which have no
  // browser origin to send. It guards itself instead: loopback caller plus a
  // custom header that a cross-origin request cannot set unpreflighted.
  if (context.url.pathname === instrumentationPath) return next();

  if (!unsafeMethods.has(context.request.method)) return next();

  const origin = context.request.headers.get("origin");

  if (origin !== appOrigin) {
    return new Response("Cross-site request forbidden", { status: 403 });
  }

  return next();
});
