// @ts-check
import { defineConfig, envField } from "astro/config";
import path from "node:path";
import node from "@astrojs/node";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import typesafeRoutes from "astro-typesafe-routes";
import { astroGrab } from "astro-grab";
import { loadConfigEnv } from "./src/app/lib/config-env";
import { getUnifiedSitemapOptions } from "./src/app/lib/sitemap";
import { composeAstroTanStackBuild } from "./src/integrations/compose-astro-tanstack-build";
import { instrumentation } from "./src/integrations/instrumentation/astro-integration";

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

  vite: {
    resolve: {
      tsconfigPaths: true,
    },
    server: { allowedHosts: [new URL(appOrigin).hostname] },
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
      tailwindcss(),
    ],
  },

  integrations: [
    react(),
    sitemap(sitemapOptions.astro),
    typesafeRoutes(),
    astroGrab({ key: "c", holdDuration: 500 }),
    instrumentation(),
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
