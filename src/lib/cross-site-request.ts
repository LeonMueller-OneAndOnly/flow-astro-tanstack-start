const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Decides whether an unsafe request came from another site, checking the
 * strongest available signal first.
 *
 * Astro routes and everything under `/app` both pass through src/middleware.ts,
 * so this is the broadest of the app's CSRF checks.
 *
 * Two library checks sit behind it:
 * - Better Auth validates the origin on `/app/api/auth/*`
 * - TanStack Start applies its own CSRF middleware to server functions by default.
 */
export function isCrossSiteRequest(request: Request, appOrigin: string): boolean {
  if (safeMethods.has(request.method)) return false;

  // Set by the browser and unforgeable from JavaScript, so it beats Origin
  // wherever both are present. It also compares nothing against our own origin,
  // which means TLS termination at Traefik cannot produce a false positive the
  // way Astro's built-in `security.checkOrigin` does.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null) return fetchSite !== "same-origin";

  // Browsers old enough to lack Sec-Fetch-Site still send Origin on unsafe
  // requests.
  const origin = request.headers.get("origin");
  if (origin !== null) return origin !== appOrigin;

  // Neither header means the caller is not a browser: webhooks, server-to-server
  // requests, native clients. CSRF does not apply to them — an attacker has no
  // way to make someone else's backend issue a request carrying their session.
  return false;
}
