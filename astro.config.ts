// @ts-check
import { defineConfig } from "astro/config";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import typesafeRoutes from "astro-typesafe-routes";
import { astroGrab } from "astro-grab";

const isProduction = process.env.APP_ENV === "production";

// https://astro.build/config
export default defineConfig({
  output: "server",

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

  integrations: [
    react(),
    sitemap(),
    typesafeRoutes(),
    astroGrab({ key: "c", holdDuration: 500 }),
  ],
});
