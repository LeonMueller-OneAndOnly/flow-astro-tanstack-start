import { createClient } from "@libsql/client/node";
import { DATABASE_URL } from "astro:env/server";
import { drizzle } from "drizzle-orm/libsql/node";

import { configureLocalSqlite, isLocalSqliteFileUrl } from "./local-sqlite";
import * as schema from "./schema";

export const libsql = createClient({
  url: DATABASE_URL,
});

if (isLocalSqliteFileUrl(DATABASE_URL)) {
  await configureLocalSqlite(libsql);
}

// Drizzle, Better Auth, and the job queue all use this initialized client.
export const db = drizzle(libsql, { schema });
