import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, type ReactNode } from "react";

import Header from "../components/Header";
import NotFound from "../components/NotFound";

import appCss from "../../styles/globals.css?url";

const Devtools = import.meta.env.DEV
  ? lazy(async () => ({ default: (await import("../components/Devtools")).Devtools }))
  : null;

/**
 * The document shell for every route. Also absorbs what the Astro
 * `src/layouts/BaseLayout.astro` used to provide for the static pages: the head
 * boilerplate, favicon set and web manifest.
 *
 * The iOS `pointerdown` workaround BaseLayout carried is gone with Astro — it
 * existed because Astro wraps each island in a `display: contents` root, which
 * stops WebKit delivering pointer events (facebook/react#29890). React owns the
 * whole document here, so no such root exists.
 */
export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Omnis Start",
      },
      {
        name: "description",
        content: "A TanStack Start application shell.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  useMountReactGrab_duringDev();

  return (
    <html lang="en">
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
