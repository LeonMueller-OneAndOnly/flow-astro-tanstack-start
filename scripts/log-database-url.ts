/**
 * Names the database before `pnpm db:migrate` runs drizzle-kit against it.
 *
 * A separate step rather than a `console.log` in drizzle.config.ts, because
 * drizzle-kit evaluates that config for every command — `db:generate` writes
 * SQL files without ever opening a connection, and announcing a database there
 * would be a lie.
 *
 * Run by plain Node with type stripping, so imports need explicit extensions.
 */
import { loadConfigEnv } from "../src/app/lib/framework/config-env.ts";
import { defaultDatabaseUrl, redactDatabaseUrl } from "../src/db/database-url.ts";

const databaseUrl = loadConfigEnv().DATABASE_URL ?? defaultDatabaseUrl;

console.log(`[db]: Migrating ${redactDatabaseUrl(databaseUrl)}`);
