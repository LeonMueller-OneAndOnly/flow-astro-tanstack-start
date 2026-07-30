import path from "node:path";
import { getConfig, physicalGetRouteNodes, type Config } from "@tanstack/router-generator";

/**
 * Paths served as static files. Everything else is rendered on demand.
 *
 * TanStack Start prerenders every page in `pages` unless told otherwise, so this
 * is passed to `prerender.filter` in vite.config.ts as an allowlist — the
 * equivalent of Astro's per-route `export const prerender`.
 */
export const staticPaths: ReadonlySet<string> = new Set(["/", "/robots.txt"]);

const shouldIncludeInSitemap = (pathname: string) => {
  if (pathname.startsWith("/_")) return false;
  if (pathname === "/api" || pathname.startsWith("/api/")) return false;
  if (pathname === "/demo" || pathname.startsWith("/demo/")) return false;
  if (pathname === "/robots.txt") return false;

  return true;
};

export type SitemapPage = {
  path: `/${string}`;
  sitemap?: { exclude?: boolean };
};

/**
 * Routes discovered from the file-based route tree, plus the non-route static
 * files. Feeds both the generated sitemap and the prerender allowlist.
 */
export async function getSitemapPages(): Promise<Array<SitemapPage>> {
  const routesDirectory = path.resolve(process.cwd(), "src/app/routes");
  const config = getConfig({ routesDirectory }, process.cwd());
  const { routeNodes } = await physicalGetRouteNodes(config, process.cwd(), {
    indexTokenSegmentRegex: toTokenSegmentRegex(config.indexToken),
    routeTokenSegmentRegex: toTokenSegmentRegex(config.routeToken),
  });

  const routePages = routeNodes
    .map(routeNodeToSitemapPage)
    .filter((page): page is SitemapPage => page !== null);

  // robots.txt is a server route, so it is not a sitemap entry, but it still has
  // to be listed for the prerender pass to emit it as a file.
  return [...routePages, { path: "/robots.txt", sitemap: { exclude: true } }];
}

// ---

function toTokenSegmentRegex(token: Config["indexToken"]): RegExp {
  const source =
    typeof token === "string"
      ? token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      : token instanceof RegExp
        ? token.source
        : token.regex;
  const flags = typeof token === "string" ? undefined : token.flags?.replace(/[gy]/g, "");

  return new RegExp(`^(?:${source})$`, flags);
}

function routeNodeToSitemapPage(routeNode: {
  filePath?: string;
  routePath?: string;
}): SitemapPage | null {
  if (
    !routeNode.routePath ||
    routeNode.routePath === "/__root" ||
    routeNode.routePath.includes("$")
  ) {
    return null;
  }

  const trimmed = routeNode.routePath === "/" ? "/" : routeNode.routePath.replace(/\/$/, "");
  const routePath = (trimmed === "" ? "/" : trimmed) as `/${string}`;

  if (!shouldIncludeInSitemap(routePath)) {
    return { path: routePath, sitemap: { exclude: true } };
  }

  return { path: routePath };
}
