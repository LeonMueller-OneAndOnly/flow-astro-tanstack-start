import { loadConfigEnv } from "@/lib/framework/config-env";
import { defaultDatabaseUrl } from "./src/db/database-url.ts";

import { defineConfig } from "drizzle-kit";

const configEnv = loadConfigEnv();

const databaseUrl = configEnv.DATABASE_URL ?? defaultDatabaseUrl;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl,
  },
});
