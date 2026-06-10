import { loadConfigEnv } from "@/lib/config-env";

import { defineConfig } from "drizzle-kit";

const configEnv = loadConfigEnv();

const databaseUrl = process.env.DATABASE_URL ?? configEnv.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run Drizzle Kit commands");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl,
  },
});
