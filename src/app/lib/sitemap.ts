import path from "node:path";
import { getConfig, physicalGetRouteNodes } from "@tanstack/router-generator";

export const APP_SITEMAP_OUTPUT_PATH = "app-sitemap.xml";
const APP_BASE_PATH = "/app";

const SITEMAP_EXCLUDED_PATH_PREFIXES = ["/_", "/app/api", "/app/demo/api"] as const;

type SitemapOptions = {
  exclude?: boolean;
  priority?: number;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  lastmod?: string | Date;
  alternateRefs?: Array<{
    href: string;
    hreflang: string;
  }>;
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
};

export type AppSitemapPage = {
  path: `/${string}`;
  sitemap?: SitemapOptions;
};

export function shouldIncludeInSitemap(urlOrPath: string): boolean {
  const pathname = toPathname(urlOrPath);

  return !SITEMAP_EXCLUDED_PATH_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function getAppSitemapPages(): Promise<Array<AppSitemapPage>> {
  const routesDirectory = path.resolve(process.cwd(), "src/app/routes");
  const config = getConfig({ routesDirectory }, process.cwd());
  const { routeNodes } = await physicalGetRouteNodes(config, process.cwd());

  const pages = routeNodes
    .map(routeNodeToSitemapPage)
    .filter((page): page is AppSitemapPage => page !== null);

  return pages.filter((page) => shouldIncludeInSitemap(page.path));
}

export function getAppSitemapUrl(origin: string): string {
  return new URL(APP_SITEMAP_OUTPUT_PATH, origin).href;
}

function toPathname(urlOrPath: string): string {
  return new URL(urlOrPath, "https://example.com").pathname;
}

function routeNodeToSitemapPage(routeNode: { routePath?: string }): AppSitemapPage | null {
  if (!routeNode.routePath || routeNode.routePath === "/__root" || routeNode.routePath.includes("$")) {
    return null;
  }

  const routePath = routeNode.routePath === "/" ? "" : routeNode.routePath.replace(/\/$/, "");
  const path = `${APP_BASE_PATH}${routePath}` as `/${string}`;

  if (!shouldIncludeInSitemap(path)) {
    return null;
  }

  return { path };
}
