// @ts-check
import { defineConfig, envField } from "astro/config";
import path from "node:path";
import node from "@astrojs/node";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { responsiveImage } from "@responsive-image/vite-plugin";

import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import typesafeRoutes from "astro-typesafe-routes";
import { astroGrab } from "astro-grab";
import { loadConfigEnv } from "./src/app/lib/framework/config-env";
import { getUnifiedSitemapOptions } from "./src/app/lib/framework/sitemap";
import { composeAstroTanStackBuild } from "./src/integrations/compose-astro-tanstack-build";
import { instrumentation } from "./src/integrations/instrumentation/astro-integration";
import type { AstroIntegration } from "astro";

const configEnv = loadConfigEnv();

const defaultAppEnv = "local";
const appEnv = process.env.APP_ENV ?? configEnv.APP_ENV ?? defaultAppEnv;
const isProduction = appEnv === "production";

const defaultPort = "4321";
const configuredPort = process.env.PORT ?? configEnv.PORT ?? defaultPort;
const port = configuredPort ? Number(configuredPort) : undefined;
const defaultHost = "127.0.0.1";
const host = process.env.HOST ?? defaultHost;
const appOrigin = process.env.APP_ORIGIN ?? configEnv.APP_ORIGIN ?? `http://${host}:${port}`;

const sitemapOptions = await getUnifiedSitemapOptions(appOrigin);

const defaultDatabaseUrl = "file:./data/db.sqlite3";
const defaultUploadsDir = "data/user-uploads";

// https://astro.build/config
export default defineConfig({
  site: appOrigin,
  output: "server",
  security: {
    // Traefik terminates TLS, so Astro sees an internal HTTP request. Origin
    // validation is performed against APP_ORIGIN in src/middleware.ts instead.
    checkOrigin: false,
  },
  adapter: node({
    mode: "standalone",
  }),

  server: { host, port },

  image: {
    // `<Image layout="constrained">` renders the sizing attributes but no CSS of its
    // own, so without this the responsive layouts do not actually constrain anything.
    // Scoped to elements Astro marks with `data-astro-image`, so it cannot reach the
    // images `@responsive-image/react` renders.
    responsiveStyles: true,
  },

  vite: {
    resolve: {
      tsconfigPaths: true,
      // `@responsive-image/react` imports its own stylesheet as a side effect. Left
      // external, the SSR bundle keeps that as a runtime `import "…css"` and Node
      // throws `ERR_UNKNOWN_FILE_EXTENSION` on the first render. Bundling it lets
      // Vite extract the CSS instead. Set on `resolve` rather than `ssr`, which
      // Vite 8 no longer reads for this.
      noExternal: ["@responsive-image/react"],
    },
    server: { allowedHosts: [new URL(appOrigin).hostname] },
    define: {
      "import.meta.env.APP_ENV": JSON.stringify(appEnv),
    },
    plugins: [
      ...composeAstroTanStackBuild({
        clientEntry: path.resolve("src/app/client.tsx"),
        tanstackPlugins: tanstackStart({
          srcDirectory: "./src/app",
          router: {
            basepath: "app",
          },
          pages: sitemapOptions.tanstackStart.pages,
          sitemap: sitemapOptions.tanstackStart.sitemap,
        }),
      }),
      /**
       * Resizes and re-encodes images imported with a `?responsive` query, for the
       * `<ResponsiveImage>` component from `@responsive-image/react`. Anything imported
       * without that query is untouched, so Astro's own `astro:assets` pipeline keeps
       * handling `.astro` pages — the two coexist rather than compete.
       *
       * Registered outside `composeAstroTanStackBuild` on purpose: both the Astro
       * environments and the TanStack Start ones need to resolve the same import.
       */
      responsiveImage({
        // Sensible ceiling for this layout — the widest content column is `max-w-5xl`,
        // so 1920 covers it at 2x. The default list reaches 3840, which no asset here
        // can fill.
        //
        // These are only defaults. Every import must narrow `w` to widths its own
        // source can actually deliver, because the plugin does not enlarge an image
        // but does report the width that was *requested* — asking a 1120px file for
        // 1920 emits a `1920w` descriptor on a 1120px candidate, and the browser
        // picks from those numbers. See the note in
        // `src/app/routes/demo/responsive-image.tsx`.
        w: [640, 828, 1080, 1280, 1920],
        format: ["original", "webp", "avif"],
        // The per-image LQIP rules default to `external`, which makes the image
        // module import a generated `.css` file. A CSS import inside a TanStack
        // Start route chunk is not emitted as an asset by this composed build, so
        // the placeholder would be defined only on the Astro side. `inline` compiles
        // the same rules to a style object the component applies directly, which
        // works in both halves and in SSR.
        styles: "inline",
      }),
      tailwindcss(),
    ],
  },

  integrations: [
    react(),
    sitemap(sitemapOptions.astro),
    typesafeRoutes(),
    astroGrab({ key: "c", holdDuration: 500 }),
    instrumentation(),
    isolateViteDependencyCache_betweenBuildAndDev(),
  ],

  env: {
    // Hyphenated dev-only mailer flags are read with bracket access in code and
    // are not declared here because Astro env keys must be named exports.
    schema: {
      // Runtime environment name. Use "production" for deployed production builds.
      APP_ENV: envField.string({
        context: "server",
        access: "public",
        default: defaultAppEnv,
      }),
      // Public canonical origin for Astro URLs and Better Auth-generated links.
      APP_ORIGIN: envField.string({
        context: "server",
        access: "public",
        optional: false,
        default: appOrigin,
      }),
      // Optional dev server port override.
      PORT: envField.string({
        context: "server",
        access: "public",
        optional: false,
        default: defaultPort,
      }),
      // Dev Server bind address. Defaults to IPv4 loopback rather than Astro's localhost resolution.
      HOST: envField.string({
        context: "server",
        access: "public",
        optional: false,
        default: defaultHost,
      }),
      // SQLite/libSQL database connection URL. Defaults to a local SQLite file under ./data.
      DATABASE_URL: envField.string({
        context: "server",
        access: "secret",
        default: defaultDatabaseUrl,
      }),
      // Shared server-side secret for signing/encrypting session/auth data. Required in production.
      SESSION_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: !isProduction,
      }),
      // Example file upload storage root for the Flydrive local filesystem driver.
      // Use an absolute path or a path relative to the project root. Defaults to data/user-uploads.
      UPLOADS_DIR: envField.string({
        context: "server",
        access: "secret",
        default: defaultUploadsDir,
      }),
      // SMTP configuration used when production mail is sent directly.
      SMTP_HOST: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // SMTP username, also used as the outgoing sender address.
      SMTP_USERNAME: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // SMTP password for the configured username.
      SMTP_PASSWORD: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Display name used in outgoing mail From headers.
      SMTP_FROM_NAME: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      // Local/test mail preview behavior. "auto" stores previews through omnisd when available and falls back to browser preview.
      MAIL_PREVIEW_MODE: envField.enum({
        context: "server",
        access: "secret",
        values: ["auto", "omnis", "browser", "disabled"],
        default: "auto",
      }),
    },
  },
});

function isolateViteDependencyCache_betweenBuildAndDev(): AstroIntegration {
  // Every Astro command otherwise shares Vite's dependency cache at node_modules/.vite. `astro build` re-runs the optimizer from its own
  //  static scan and rewrites that directory, dropping every dependency a running dev server had discovered on demand — which is everything
  // reachable only through the TanStack route tree, because the scan starts from Astro's pages and never enters it.
  //
  // The dev server then answers those requests with `504 Outdated Optimize Dep`, the dynamic import in
  // `src/app/client.tsx` rejects, `hydrateRoot` never runs, and nothing under /app is interactive until the dev server is restarted.
  // Nothing is logged, because a rejected import inside an async module is swallowed.
  return {
    name: "isolate-build-dep-cache",
    hooks: {
      "astro:config:setup": ({ command, updateConfig }) => {
        if (command === "dev") return;
        updateConfig({ vite: { cacheDir: "node_modules/.vite-build" } });
      },
    },
  };
}
