import { defineConfig } from "vitest/config";
import { loadConfigEnv } from "./src/app/lib/framework/config-env";

process.env.APP_ENV ??= "test";
for (const [key, value] of Object.entries(loadConfigEnv())) {
  process.env[key] ??= value;
}

export default defineConfig({
  test: {
    environment: "node",
  },
});
