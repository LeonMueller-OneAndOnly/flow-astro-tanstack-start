import type { Client } from "@libsql/client/node";

export function isLocalSqliteFileUrl(databaseUrl: string) {
  return (
    databaseUrl.startsWith("file:") &&
    !databaseUrl.startsWith("file::memory:") &&
    !databaseUrl.includes("mode=memory")
  );
}

export async function configureForeignKeys(client: Client) {
  await client.execute("PRAGMA foreign_keys = ON");
}

export async function configureLocalSqlite(client: Client) {
  await client.execute("PRAGMA journal_mode = WAL");
  await client.execute("PRAGMA synchronous = NORMAL");
  await client.execute("PRAGMA busy_timeout = 5000");
}
