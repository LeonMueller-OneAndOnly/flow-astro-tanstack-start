import { defineMiddleware } from "astro:middleware";

import { instrumentationPath } from "./integrations/instrumentation/instrument";
import { isCrossSiteFormRequest } from "./lib/cross-site-request";

const appOrigin = new URL(import.meta.env.SITE).origin;

export const onRequest = defineMiddleware((context, next) => {
  // The instrumentation endpoint is called by the boot scripts, which have no
  // browser origin to send. It guards itself instead: loopback caller plus a
  // custom header that a cross-origin request cannot set unpreflighted.
  if (context.url.pathname === instrumentationPath) return next();

  if (isCrossSiteFormRequest(context.request, appOrigin)) {
    return new Response("Cross-site request forbidden", { status: 403 });
  }

  return next();
});
