import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, type ReactNode } from "react";

import Header from "../components/Header";
import NotFound from "../components/NotFound";

import appCss from "../../styles/globals.css?url";

const Devtools = import.meta.env.DEV
  ? lazy(async () => ({ default: (await import("../components/Devtools")).Devtools }))
  : null;

/**
 * Astro mounts this TanStack Start router under `/app` via `src/pages/app/[...slug].ts`.
 * Child route paths are served as `/app` plus their TanStack route path.
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
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
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
