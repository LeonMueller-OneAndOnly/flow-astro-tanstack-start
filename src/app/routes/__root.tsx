import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useEffect, type ReactNode } from "react";

import Header from "../components/Header";

import StoreDevtools from "../lib/demo/demo-store-devtools";
import { $astroPath } from "../lib/typesafe-paths";
import { brandPageBackground, brandPrimaryButtonClass } from "../lib/brand-theme";

import appCss from "../../styles/globals.css?url";

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

function NotFound() {
  return (
    <main
      className="flex min-h-[calc(100dvh-60px)] items-center px-4 py-12 sm:px-8"
      style={brandPageBackground}
    >
      <section className="mx-auto w-full max-w-3xl text-center">
        <p className="mb-4 text-sm font-black tracking-[0.18em] text-brand-secondary-700 uppercase">
          Error 404
        </p>
        <h1 className="m-0 text-6xl leading-[0.92] font-black tracking-[-0.06em] sm:text-8xl">
          This page has wandered off.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-foreground/68 sm:text-xl">
          The address does not point to anything in this app. Head back to the start and try again.
        </p>
        <a
          href={$astroPath({ to: "/" })}
          className={`${brandPrimaryButtonClass} mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-6 no-underline`}
        >
          Return home
        </a>
      </section>
    </main>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
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
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            StoreDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
