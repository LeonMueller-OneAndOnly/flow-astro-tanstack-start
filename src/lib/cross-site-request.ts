const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Content types a browser can send cross-origin without a CORS preflight, which
 * makes them the only ones a CSRF attack can actually use. Everything else —
 * `application/json` in particular — is already covered by the preflight, so
 * rejecting it here would block nothing but non-browser callers: webhooks,
 * server-to-server requests, native clients.
 */
const formContentTypes = new Set([
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain",
]);

/**
 * Mirrors Astro's built-in `security.checkOrigin`, which is disabled in
 * astro.config.ts because Traefik terminates TLS: Astro would compare against
 * the internal `http://` request URL rather than the public origin.
 *
 * Re-enabling the built-in check by populating `security.allowedDomains` would
 * fix that comparison but also make Astro trust `x-forwarded-for`, which would
 * make `clientAddress` spoofable — and src/pages/instrumentation.ts depends on
 * it being the real socket address.
 */
export function isCrossSiteFormRequest(request: Request, appOrigin: string): boolean {
  if (safeMethods.has(request.method)) return false;
  if (request.headers.get("origin") === appOrigin) return false;

  const mediaType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();

  // A missing content type counts as form-like: a browser form post can omit it,
  // so treating it as safe would reopen the hole this guard closes.
  return !mediaType || formContentTypes.has(mediaType);
}
