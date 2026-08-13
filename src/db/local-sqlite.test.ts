import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql/node";
import { sql } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";

import {
  configureForeignKeys,
  configureLocalSqlite,
  isLocalSqliteFileUrl,
} from "./local-sqlite";

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

    await configureForeignKeys(client);
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

    await db.run(sql`CREATE TABLE fk_parent (id INTEGER PRIMARY KEY)`);
    await db.run(
      sql`CREATE TABLE fk_child (
        id INTEGER PRIMARY KEY,
        parent_id INTEGER NOT NULL REFERENCES fk_parent(id) ON DELETE CASCADE
      )`,
    );
    await db.run(sql`INSERT INTO fk_parent (id) VALUES (1)`);
    await db.run(sql`INSERT INTO fk_child (id, parent_id) VALUES (1, 1)`);

    await expect(
      db.run(sql`INSERT INTO fk_child (id, parent_id) VALUES (2, 999)`),
    ).rejects.toMatchObject({
      cause: { message: expect.stringContaining("FOREIGN KEY constraint failed") },
    });

    await db.run(sql`DELETE FROM fk_parent WHERE id = 1`);
    expect(await db.all(sql`SELECT id FROM fk_child`)).toEqual([]);

    expect(
      (await db.all<{ name: string }>(sql`SELECT name FROM queue_test`)).map((row) => row.name),
    ).toEqual(["ready"]);

    client.close();
  });

  test("enables foreign keys for in-memory SQLite databases", async () => {
    const client = createClient({ url: "file::memory:?cache=shared" });

    await client.execute("PRAGMA foreign_keys = OFF");
    await configureForeignKeys(client);

    expect((await client.execute("PRAGMA foreign_keys")).rows).toEqual([{ foreign_keys: 1 }]);

    client.close();
  });

  test("only configures persistent local SQLite files", () => {
    expect(isLocalSqliteFileUrl("file:./data/db.sqlite3")).toBe(true);
    expect(isLocalSqliteFileUrl("file::memory:?cache=shared")).toBe(false);
    expect(isLocalSqliteFileUrl("libsql://database.turso.io")).toBe(false);
  });
});
