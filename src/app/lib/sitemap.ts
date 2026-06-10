import path from "node:path";
import { getConfig, physicalGetRouteNodes } from "@tanstack/router-generator";

const APP_SITEMAP_OUTPUT_PATH = "app-sitemap.xml";
const APP_BASE_PATH = "/app";

const shouldIncludeInSitemap: SitemapFilter = (page) => {
  if (page.pathname.startsWith("/_")) return false;
  if (page.pathname === "/app/api" || page.pathname.startsWith("/app/api/")) return false;
  if (page.pathname === "/app/demo" || page.pathname.startsWith("/app/demo/")) return false;

  return true;
};

export async function getUnifiedSitemapOptions(origin: string) {
  const appPages = await getAppSitemapPages(shouldIncludeInSitemap);
  const hasAppPages = appPages.length > 0;

  return {
    astro: {
      customSitemaps: hasAppPages ? [new URL(APP_SITEMAP_OUTPUT_PATH, origin).href] : [],
      filter: (url: string) => shouldIncludeInSitemap(toSitemapPage(url)),
    },
    tanstackStart: {
      pages: appPages,
      sitemap: hasAppPages
        ? {
            host: origin,
            outputPath: APP_SITEMAP_OUTPUT_PATH,
          }
        : undefined,
    },
  };
}

// ---

type SitemapFilter = (page: SitemapFilterPage) => boolean;

type SitemapFilterPage = {
  url: string;
  pathname: string;
};

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

async function getAppSitemapPages(
  filter: SitemapFilter = shouldIncludeInSitemap,
): Promise<Array<AppSitemapPage>> {
  const routesDirectory = path.resolve(process.cwd(), "src/app/routes");
  const config = getConfig({ routesDirectory }, process.cwd());
  const { routeNodes } = await physicalGetRouteNodes(config, process.cwd());

  const pages = routeNodes
    .map(routeNodeToSitemapPage)
    .filter((page): page is AppSitemapPage => page !== null);

  return pages.filter((page) => filter(toSitemapPage(page.path)));
}

function toSitemapPage(urlOrPath: string): SitemapFilterPage {
  return {
    url: urlOrPath,
    pathname: new URL(urlOrPath, "https://example.com").pathname,
  };
}

function routeNodeToSitemapPage(routeNode: {
  filePath?: string;
  routePath?: string;
}): AppSitemapPage | null {
  if (
    !routeNode.routePath ||
    routeNode.routePath === "/__root" ||
    routeNode.routePath.includes("$")
  ) {
    return null;
  }

  const routePath = routeNode.routePath === "/" ? "" : routeNode.routePath.replace(/\/$/, "");
  const path = `${APP_BASE_PATH}${routePath}` as `/${string}`;

  if (!shouldIncludeInSitemap(toSitemapPage(path))) {
    return null;
  }

  return { path };
}
