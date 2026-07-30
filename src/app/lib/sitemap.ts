import path from "node:path";
import { getConfig, physicalGetRouteNodes, type Config } from "@tanstack/router-generator";

import { isContentPath } from "./content-paths";

const APP_SITEMAP_OUTPUT_PATH = "app-sitemap.xml";
const APP_BASE_PATH = "/app";

export async function getUnifiedSitemapOptions(origin: string) {
  const tanstackPages = await getAppSitemapPages({
    filter: (page) => isContentPath(page.pathname),
  });
  const hasTanstackPages = tanstackPages.length > 0;

  return {
    astro: {
      customSitemaps: hasTanstackPages ? [new URL(APP_SITEMAP_OUTPUT_PATH, origin).href] : [],
      filter: (url: string) => isContentPath(toSitemapPage(url).pathname),
    },
    tanstackStart: {
      pages: tanstackPages,
      sitemap: hasTanstackPages
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

async function getAppSitemapPages({
  filter,
}: {
  filter: SitemapFilter;
}): Promise<Array<AppSitemapPage>> {
  const routesDirectory = path.resolve(process.cwd(), "src/app/routes");
  const config = getConfig({ routesDirectory }, process.cwd());
  const { routeNodes } = await physicalGetRouteNodes(config, process.cwd(), {
    indexTokenSegmentRegex: toTokenSegmentRegex(config.indexToken),
    routeTokenSegmentRegex: toTokenSegmentRegex(config.routeToken),
  });

  const pages = routeNodes
    .map((routeNode) => routeNodeToSitemapPage({ routeNode, filter }))
    .filter((page): page is AppSitemapPage => page !== null);

  return pages.filter((page) => filter(toSitemapPage(page.path)));
}

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

function toSitemapPage(urlOrPath: string): SitemapFilterPage {
  return {
    url: urlOrPath,
    pathname: new URL(urlOrPath, "https://example.com").pathname,
  };
}

function routeNodeToSitemapPage({
  routeNode,
  filter,
}: {
  routeNode: {
    filePath?: string;
    routePath?: string;
  };
  filter: SitemapFilter;
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

  if (!filter(toSitemapPage(path))) {
    return null;
  }

  return { path };
}
