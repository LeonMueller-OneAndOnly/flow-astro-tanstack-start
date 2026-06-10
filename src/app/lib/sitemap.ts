import path from "node:path";
import { getConfig, physicalGetRouteNodes } from "@tanstack/router-generator";

export const APP_SITEMAP_OUTPUT_PATH = "app-sitemap.xml";
const APP_BASE_PATH = "/app";

const shouldIncludeInSitemap = createSitemapFilter({
  excludePathPrefixes: ["/_", "/app/api", "/app/demo/api"],
});

type SitemapRules = {
  excludePathPrefixes: ReadonlyArray<`/${string}`>;
};

type SitemapFilter = (urlOrPath: string) => boolean;

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

type AppSitemapPage = {
  path: `/${string}`;
  sitemap?: SitemapOptions;
};

export async function getUnifiedSitemapOptions(origin: string) {
  const appPages = await getAppSitemapPages(shouldIncludeInSitemap);

  return {
    astro: {
      customSitemaps: origin ? [getAppSitemapUrl(origin)] : [],
      filter: shouldIncludeInSitemap,
    },
    tanstackStart: {
      pages: appPages,
      sitemap: origin
        ? {
            host: origin,
            outputPath: APP_SITEMAP_OUTPUT_PATH,
          }
        : undefined,
    },
  };
}

function createSitemapFilter(rules: SitemapRules): SitemapFilter {
  return (urlOrPath) => {
    const pathname = toPathname(urlOrPath);

    return !rules.excludePathPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  };
}

async function getAppSitemapPages(
  filter: SitemapFilter = shouldIncludeInSitemap,
): Promise<Array<AppSitemapPage>> {
  const routesDirectory = path.resolve(process.cwd(), "src/app/routes");
  const config = getConfig({ routesDirectory }, process.cwd());
  const { routeNodes } = await physicalGetRouteNodes(config, process.cwd());

  const pages = routeNodes
    .map(routeNodeToSitemapPage)
    .filter((page): page is AppSitemapPage => page !== null);

  return pages.filter((page) => filter(page.path));
}

function getAppSitemapUrl(origin: string): string {
  return new URL(APP_SITEMAP_OUTPUT_PATH, origin).href;
}

function toPathname(urlOrPath: string): string {
  return new URL(urlOrPath, "https://example.com").pathname;
}

function routeNodeToSitemapPage(routeNode: { routePath?: string }): AppSitemapPage | null {
  if (
    !routeNode.routePath ||
    routeNode.routePath === "/__root" ||
    routeNode.routePath.includes("$")
  ) {
    return null;
  }

  const routePath = routeNode.routePath === "/" ? "" : routeNode.routePath.replace(/\/$/, "");
  const path = `${APP_BASE_PATH}${routePath}` as `/${string}`;

  if (!shouldIncludeInSitemap(path)) {
    return null;
  }

  return { path };
}
