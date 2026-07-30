import { loadConfigEnv } from "@/lib/framework/config-env";

import { defineConfig } from "drizzle-kit";

const configEnv = loadConfigEnv();

const databaseUrl = process.env.DATABASE_URL ?? configEnv.DATABASE_URL ?? "file:./data/db.sqlite3";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl,
  },
});
