// @ts-check
import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import typesafeRoutes from "astro-typesafe-routes";
import { astroGrab } from "astro-grab";
import { loadConfigEnv } from "./src/app/lib/config-env";
import {
  APP_SITEMAP_OUTPUT_PATH,
  getAppSitemapPages,
  getAppSitemapUrl,
  shouldIncludeInSitemap,
} from "./src/app/lib/sitemap";

const configEnv = loadConfigEnv();
const appEnv = process.env.APP_ENV ?? configEnv.APP_ENV;
const appOrigin = process.env.APP_ORIGIN ?? configEnv.APP_ORIGIN;

const configuredPort = process.env.PORT ?? configEnv.PORT;
const port = configuredPort ? Number(configuredPort) : undefined;

const isProduction = appEnv === "production";
const appSitemapPages = appOrigin ? await getAppSitemapPages() : [];

// https://astro.build/config
export default defineConfig({
  site: appOrigin,
  output: "server",
  adapter: node({
    mode: "standalone",
  }),

  server: { port },

  vite: {
    define: {
      "import.meta.env.APP_ENV": JSON.stringify(appEnv),
    },
    plugins: [
      tanstackStart({
        srcDirectory: "./src/app",
        router: {
          basepath: "app",
        },
        pages: appSitemapPages,
        sitemap: appOrigin
          ? {
              host: appOrigin,
              outputPath: APP_SITEMAP_OUTPUT_PATH,
            }
          : undefined,
      }),
      viteTsConfigPaths(),
      tailwindcss(),
    ],
  },

  integrations: [
    react(),
    sitemap({
      customSitemaps: appOrigin ? [getAppSitemapUrl(appOrigin)] : [],
      filter: shouldIncludeInSitemap,
    }),
    typesafeRoutes(),
    astroGrab({ key: "c", holdDuration: 500 }),
  ],

  env: {
    // Hyphenated dev-only mailer flags are read with bracket access in code and
    // are not declared here because Astro env keys must be named exports.
    schema: {
      // Runtime environment name. Use "production" for deployed production builds.
      APP_ENV: envField.string({
        context: "server",
        access: "public",
        default: "local",
      }),
      // Public canonical origin for Astro URLs and Better Auth-generated links.
      APP_ORIGIN: envField.string({
        context: "server",
        access: "public",
        optional: false,
      }),
      // Optional dev server port override.
      PORT: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      // SQLite/libSQL database connection URL.
      DATABASE_URL: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      // Shared server-side secret for signing/encrypting session/auth data. Required in production.
      SESSION_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: !isProduction,
      }),
      // Example file upload storage root for the Flydrive local filesystem driver.
      // Use an absolute path or a path relative to the project root.
      UPLOADS_DIR: envField.string({
        context: "server",
        access: "secret",
        default: ".uploads",
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
      MAIL_FROM_NAME: envField.string({
        context: "server",
        access: "public",
        default: "Starter Kit",
      }),
    },
  },
});
