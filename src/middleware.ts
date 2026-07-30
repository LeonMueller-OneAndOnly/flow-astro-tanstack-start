import { APP_ORIGIN } from "astro:env/server";
import { defineMiddleware } from "astro:middleware";

import { isCrossSiteRequest } from "./lib/cross-site-request";

// Astro inlines `access: "public"` env fields at build time, so this is a build constant
const appOrigin = new URL(APP_ORIGIN).origin;

export const onRequest = defineMiddleware((context, next) => {
  if (isCrossSiteRequest(context.request, appOrigin)) {
    return new Response("Cross-site request forbidden", { status: 403 });
  }

  return next();
});
