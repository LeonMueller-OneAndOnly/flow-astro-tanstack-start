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

const isProduction = process.env.APP_ENV === "production";

const port = process.env.PORT ? Number(process.env.PORT) : undefined;

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),

  server: { port },

  vite: {
    plugins: [
      tanstackStart({
        srcDirectory: "./src/app",
        router: {
          basepath: "app",
        },
      }),
      viteTsConfigPaths(),
      tailwindcss(),
    ],
  },

  integrations: [react(), sitemap(), typesafeRoutes(), astroGrab({ key: "c", holdDuration: 500 })],

  env: {
    schema: {
      APP_ENV: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "local",
      }),
      DATABASE_URL: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },
});
