import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, type ReactNode } from "react";

import Header from "@/components/Header";
import NotFound from "@/components/NotFound";
import { buildMetaTags, HEAD_LINKS, SITE } from "@/lib/framework/site-meta";

import appCss from "src/styles/globals.css?url";

const Devtools = import.meta.env.DEV
  ? lazy(async () => ({ default: (await import("../components/Devtools")).Devtools }))
  : null;

const APP_TITLE = `App | ${SITE.name}`;

/**
 * Astro mounts this TanStack Start router under `/app` via `src/pages/app/[...slug].ts`.
 * Child route paths are served as `/app` plus their TanStack route path.
 *
 * The base tags come from `src/app/lib/framework/site-meta.ts`, the same module
 * `src/layouts/BaseLayout.astro` renders from, so the app shell and the Astro
 * pages cannot disagree about the brand name, theme color or icon set.
 *
 * Two things are deliberately absent. There is no `social` argument, because a
 * card describes a page and the root is not one — a route with shareable content
 * calls `buildMetaTags` with its own `social` object in its `head()`. And there is
 * no `robots` directive: the demos and the API routes are marked `noindex` by
 * path in `src/middleware.ts`, from the predicate the sitemap also filters on, so
 * a directive here would only add the claim that everything this router will ever
 * serve is unindexable.
 */
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: APP_TITLE },
      ...buildMetaTags({
        title: APP_TITLE,
        description: "The interactive half of the app, mounted under /app.",
      }),
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      ...HEAD_LINKS,
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  useMountReactGrab_duringDev();

  return (
    <html lang={SITE.lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        <Header />
        {/*
         * Page content gets its own stacking context via `isolate`, so route-level
         * z-indices (e.g. the guitar cards' layered z-0/z-10) stay self-contained and
         * never paint over the fixed chrome — the MenuBar (z-20) and the offcanvas
         * Sidebar (z-10) live outside this wrapper and must always sit on top.
         */}
        <div className="isolate">{children}</div>

        {Devtools ? (
          <Suspense fallback={null}>
            <Devtools />
          </Suspense>
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}

function useMountReactGrab_duringDev() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import("react-grab/core").then(({ init }) =>
        init({
          activationKey: (event) =>
            event.code === "KeyC" &&
            (/mac/i.test(navigator.userAgent) ? event.metaKey : event.ctrlKey),
          activationMode: "toggle",
        }),
      );
    }
  }, []);
}
