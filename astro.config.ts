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
import { registerConfigEnv } from "./src/app/lib/framework/config-env";
import { getUnifiedSitemapOptions } from "./src/app/lib/framework/sitemap";
import { composeAstroTanStackBuild } from "./src/integrations/compose-astro-tanstack-build";
import { instrumentation } from "./src/integrations/instrumentation/astro-integration";
import { defaultDatabaseUrl } from "./src/db/database-url";
import type { AstroIntegration } from "astro";

const configEnv = registerConfigEnv();

const defaultAppEnv = "local";
const appEnv = process.env.APP_ENV ?? configEnv.APP_ENV ?? defaultAppEnv;
const isProduction = appEnv === "production";

const defaultPort = "4321";
const configuredPort = process.env.PORT ?? configEnv.PORT ?? defaultPort;
const port = configuredPort ? Number(configuredPort) : undefined;
const defaultBindHost = "localhost";
const bindHost = process.env.SERVER_BIND_HOST ?? configEnv.SERVER_BIND_HOST ?? defaultBindHost;
const appOrigin = process.env.APP_ORIGIN ?? configEnv.APP_ORIGIN ?? `http://${bindHost}:${port}`;

const sitemapOptions = await getUnifiedSitemapOptions(appOrigin);

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

  server: { host: bindHost, port },

  image: {
    // Nothing sets `layout` on an `<Image />` right now — this is here so that the
    // first one that does is not silently broken. Astro's default is `false`, and with
    // it the layout props render their sizing attributes but no CSS to act on them,
    // which fails without an error anywhere. Scoped to elements Astro marks with
    // `data-astro-image`, so it cannot reach what `<ResponsiveImage>` renders.
    responsiveStyles: true,
  },

  vite: {
    resolve: {
      tsconfigPaths: true,
      // Left external, the SSR bundle keeps `@responsive-image/react`'s stylesheet as
      // a runtime `import "…css"` and Node throws `ERR_UNKNOWN_FILE_EXTENSION` on the first render.
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
       * Build-time resizing for imports whose query ends in `responsive`, behind
       * `src/app/components/ResponsiveImage.tsx` — which is also where the usage rules
       * and the comparison against `astro:assets` are written down. Anything imported
       * without that query falls through to Astro's own pipeline, so the two never
       * contend for the same module.
       *
       * Outside `composeAstroTanStackBuild` on purpose: the Astro environments and the
       * TanStack Start ones both have to resolve these imports.
       */
      responsiveImage({
        // No `w` on purpose: the plugin's own list runs up to 3840, and the right
        // ceiling follows the source image, not this layout — capping it here would
        // put the top of the range out of reach of a genuinely large asset that could
        // fill it. Each import narrows `w` to what its own source can deliver, which
        // it has to do regardless, since the plugin reports the width that was
        // requested rather than the one it produced. See
        // `src/app/components/ResponsiveImage.tsx`.
        format: ["original", "webp", "avif"],
        // Per-image LQIP rules as a style object instead of the default generated `.css` import
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
      // Dev/server bind address. Defaults to localhost; set SERVER_BIND_HOST to a
      // wildcard when a reverse proxy needs to reach the process from another network namespace.
      SERVER_BIND_HOST: envField.string({
        context: "server",
        access: "public",
        optional: false,
        default: defaultBindHost,
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
      // Local/test mail preview behavior. Mails outside production are never delivered, they are captured instead.
      // "files"    (default) writes an .html/.json pair to data/mail-preview/ in the workspace, where Omnis lists them.
      // "browser"  opens the preview in a local browser window and writes nothing.
      // "both"     does both.
      // "disabled" drops the preview entirely.
      MAIL_PREVIEW_MODE: envField.enum({
        context: "server",
        access: "secret",
        values: ["files", "browser", "both", "disabled"],
        default: "files",
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
