import { describe, expect, test } from "vitest";

import { redactDatabaseUrl } from "./database-url";

describe("redactDatabaseUrl", () => {
  test("keeps a relative local SQLite path exactly as configured", () => {
    expect(redactDatabaseUrl("file:./data/db.sqlite3")).toBe("file:./data/db.sqlite3");
  });

  test("keeps an absolute local SQLite path", () => {
    expect(redactDatabaseUrl("file:/srv/omvin/data/db.sqlite3")).toBe(
      "file:/srv/omvin/data/db.sqlite3",
    );
  });

  test("drops the libSQL auth token but keeps the host", () => {
    expect(redactDatabaseUrl("libsql://omvin-org.turso.io?authToken=ey.super.secret")).toBe(
      "libsql://omvin-org.turso.io?authToken=***",
    );
  });

  test("drops every query value, not only the ones named like a secret", () => {
    expect(redactDatabaseUrl("libsql://host?tls=1&authToken=secret")).toBe(
      "libsql://host?tls=***&authToken=***",
    );
  });

  test("keeps a valueless query flag", () => {
    expect(redactDatabaseUrl("file:memory.db?readonly")).toBe("file:memory.db?readonly");
  });

  test("drops the password but keeps user, host, port and database", () => {
    expect(redactDatabaseUrl("postgres://omvin:hunter2@db.internal:5432/omvin")).toBe(
      "postgres://omvin:***@db.internal:5432/omvin",
    );
  });

  test("leaves a URL without user info untouched", () => {
    expect(redactDatabaseUrl("libsql://db.internal:8080/omvin")).toBe(
      "libsql://db.internal:8080/omvin",
    );
  });

  test("does not mistake a path or query colon for a password separator", () => {
    expect(redactDatabaseUrl("libsql://db.internal/a:b?x=y@z")).toBe(
      "libsql://db.internal/a:b?x=***",
    );
  });
});
