import { APP_ORIGIN } from "astro:env/server";
import { defineMiddleware } from "astro:middleware";

import { isContentPath, NOINDEX } from "./app/lib/content-paths";
import { isCrossSiteRequest } from "./app/lib/cross-site-request";
import type { APIContext } from "astro";

// Astro inlines `access: "public"` env fields at build time, so this is a build constant
const appOrigin = new URL(APP_ORIGIN).origin;

export const onRequest = defineMiddleware(async (context, next) => {
  if (isCrossSiteRequest(context.request, appOrigin)) {
    return new Response("Cross-site request forbidden", { status: 403 });
  }

  const response = await next();

  return middleware_setNoIndex_robotsTag_ifPathIsntInSitemap(context, response);
});

function middleware_setNoIndex_robotsTag_ifPathIsntInSitemap(
  context: APIContext,
  response: Response,
): Response {
  /**
   * Everything the sitemap does not advertise is marked unindexable here via a header,
   * so it  also covers the JSON under `/app/api` and the `robots.txt` body, which have
   * no head to put a tag in.
   *
   * The status check is what catches a 404 served for an arbitrary URL:
   * the request keeps the pathname it asked for, so `isContentPath` sees
   * `/no-such-page` and rightly calls it content. A 404 status already keeps a
   * page out of the index on its own — this makes the two agree rather than
   * relying on one of them.
   *
   * Prerendered routes never reach this: the node adapter serves them as static
   * files, ahead of middleware. `src/layouts/BaseLayout.astro` renders the meta
   * tag from the same predicate to cover them.
   */
  const isSuccessfull = response.status < 400;
  if (isContentPath(context.url.pathname) && isSuccessfull) return response;

  /**
   * The copy is deliberate: a `Headers` object can carry an `immutable` guard,
   * and `set()` on a guarded one throws instead of no-opping. The guard is not
   * observable from the outside, so there is nothing to branch on. Copying is
   * free either way — `new Response(response.body, response)` hands the same
   * `ReadableStream` to the copy rather than reading it, so nothing is buffered
   * and streaming responses stay streaming.
   */
  const marked = new Response(response.body, response);
  marked.headers.set("X-Robots-Tag", NOINDEX);
  return marked;
}
