import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { loadConfigEnv, registerConfigEnv } from "./config-env";

const originalWorkingDirectory = process.cwd();
const originalPath = process.env.PATH;
const originalAppEnv = process.env.APP_ENV;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalFromOmnis = process.env.FROM_OMNIS;

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  process.env.PATH = originalPath;
  if (originalAppEnv === undefined) {
    Reflect.deleteProperty(process.env, "APP_ENV");
  } else {
    process.env.APP_ENV = originalAppEnv;
  }
  if (originalDatabaseUrl === undefined) {
    Reflect.deleteProperty(process.env, "DATABASE_URL");
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
  if (originalFromOmnis === undefined) {
    Reflect.deleteProperty(process.env, "FROM_OMNIS");
  } else {
    process.env.FROM_OMNIS = originalFromOmnis;
  }
});

describe("loadConfigEnv", () => {
  test("uses the Omnis export for the local purpose when omnis is available", () => {
    const workspace = mkdtempSync(join(tmpdir(), "omnis-config-env-"));
    const binDirectory = join(workspace, "bin");
    mkdirSync(binDirectory);
    writeFileSync(join(workspace, ".env.local"), "DATABASE_URL=file:dotenv.db\n");
    writeFileSync(
      join(binDirectory, "omnis"),
      '#!/bin/sh\n[ "$1 $2 $3 $4 $5" = "env export --local --format json" ] || exit 3\nprintf \'%s\\n\' \'{"DATABASE_URL":"file:omnis.db","FROM_OMNIS":"yes"}\'\n',
    );
    chmodSync(join(binDirectory, "omnis"), 0o755);
    process.chdir(workspace);
    process.env.PATH = `${binDirectory}:${originalPath}`;
    process.env.APP_ENV = "local";

    expect(loadConfigEnv()).toMatchObject({ DATABASE_URL: "file:omnis.db", FROM_OMNIS: "yes" });
    rmSync(workspace, { force: true, recursive: true });
  });

  test("uses the Omnis export for the test purpose when omnis is available", () => {
    const workspace = mkdtempSync(join(tmpdir(), "omnis-config-env-"));
    const binDirectory = join(workspace, "bin");
    mkdirSync(binDirectory);
    writeFileSync(
      join(binDirectory, "omnis"),
      '#!/bin/sh\n[ "$1 $2 $3 $4 $5" = "env export --test --format json" ] || exit 3\nprintf \'%s\\n\' \'{"DATABASE_URL":"file:omnis-test.db"}\'\n',
    );
    chmodSync(join(binDirectory, "omnis"), 0o755);
    process.chdir(workspace);
    process.env.PATH = `${binDirectory}:${originalPath}`;
    process.env.APP_ENV = "test";

    expect(loadConfigEnv()).toMatchObject({ DATABASE_URL: "file:omnis-test.db" });
    rmSync(workspace, { force: true, recursive: true });
  });

  test("falls back to dotenv files when omnis is absent", () => {
    const workspace = mkdtempSync(join(tmpdir(), "omnis-config-env-"));
    writeFileSync(join(workspace, ".env.test"), "DATABASE_URL=file:test.db\n");
    process.chdir(workspace);
    process.env.PATH = "/definitely-not-present";
    process.env.APP_ENV = "test";

    expect(loadConfigEnv()).toMatchObject({ DATABASE_URL: "file:test.db" });
    rmSync(workspace, { force: true, recursive: true });
  });

  test("registers Omnis values without replacing explicit process variables", () => {
    const workspace = mkdtempSync(join(tmpdir(), "omnis-config-env-"));
    const binDirectory = join(workspace, "bin");
    mkdirSync(binDirectory);
    writeFileSync(
      join(binDirectory, "omnis"),
      '#!/bin/sh\n[ "$1 $2 $3 $4 $5" = "env export --local --format json" ] || exit 3\nprintf \'%s\\n\' \'{"DATABASE_URL":"file:omnis.db","FROM_OMNIS":"yes"}\'\n',
    );
    chmodSync(join(binDirectory, "omnis"), 0o755);
    process.chdir(workspace);
    process.env.PATH = `${binDirectory}:${originalPath}`;
    process.env.APP_ENV = "local";
    process.env.DATABASE_URL = "file:shell.db";

    expect(registerConfigEnv()).toMatchObject({ DATABASE_URL: "file:omnis.db" });
    expect(process.env.DATABASE_URL).toBe("file:shell.db");
    expect(process.env.FROM_OMNIS).toBe("yes");
    rmSync(workspace, { force: true, recursive: true });
  });
});
