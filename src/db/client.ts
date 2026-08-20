import { createClient } from "@libsql/client/node";
import { DATABASE_URL } from "astro:env/server";
import { drizzle } from "drizzle-orm/libsql/node";

import { redactDatabaseUrl } from "./database-url";
import { configureForeignKeys, configureLocalSqlite, isLocalSqliteFileUrl } from "./local-sqlite";
import * as schema from "./schema";

// Module scope, so this runs exactly once per server process: the job queue
// reaches this module through the startup instrumentation, which both `astro
// dev` and server/prod.ts trigger right after listen(). Logged before the first
// statement, so a failing PRAGMA still names the database it failed on.
console.log(`[db]: Using ${redactDatabaseUrl(DATABASE_URL)}`);

const libsql = createClient({
  url: DATABASE_URL,
});

await configureForeignKeys(libsql);

if (isLocalSqliteFileUrl(DATABASE_URL)) {
  await configureLocalSqlite(libsql);
}

// Drizzle, Better Auth, and the job queue all use this initialized client.
export const db = drizzle(libsql, { schema });
