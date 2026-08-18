import { defineConfig } from "vitest/config";
import { registerConfigEnv } from "./src/app/lib/framework/config-env";

process.env.APP_ENV = "test";
registerConfigEnv();

export default defineConfig({
  test: {
    environment: "node",
  },
});
