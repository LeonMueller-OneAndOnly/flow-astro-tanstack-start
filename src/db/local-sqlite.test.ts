import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql/node";
import { sql } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";

import { configureLocalSqlite, isLocalSqliteFileUrl } from "./local-sqlite";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("configureLocalSqlite", () => {
  test("enables WAL concurrency settings for a real local database used through Drizzle", async () => {
    const directory = await mkdtemp(join(tmpdir(), "omnis-local-sqlite-"));
    directories.push(directory);
    const client = createClient({ url: `file:${join(directory, "db.sqlite3")}` });

    await configureLocalSqlite(client);

    const journalMode = await client.execute("PRAGMA journal_mode");
    const synchronous = await client.execute("PRAGMA synchronous");
    const busyTimeout = await client.execute("PRAGMA busy_timeout");
    const foreignKeys = await client.execute("PRAGMA foreign_keys");

    expect(journalMode.rows).toEqual([{ journal_mode: "wal" }]);
    expect(synchronous.rows).toEqual([{ synchronous: 1 }]);
    expect(busyTimeout.rows).toEqual([{ timeout: 5000 }]);
    expect(foreignKeys.rows).toEqual([{ foreign_keys: 1 }]);

    const db = drizzle(client);
    await db.run(sql`CREATE TABLE queue_test (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`);
    await db.run(sql`INSERT INTO queue_test (name) VALUES ('ready')`);

    expect(
      (await db.all<{ name: string }>(sql`SELECT name FROM queue_test`)).map((row) => row.name),
    ).toEqual(["ready"]);

    client.close();
  });

  test("only configures persistent local SQLite files", () => {
    expect(isLocalSqliteFileUrl("file:./data/db.sqlite3")).toBe(true);
    expect(isLocalSqliteFileUrl("file::memory:?cache=shared")).toBe(false);
    expect(isLocalSqliteFileUrl("libsql://database.turso.io")).toBe(false);
  });
});
