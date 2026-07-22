import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { loadConfigEnv } from "./config-env";

const originalWorkingDirectory = process.cwd();
const originalPath = process.env.PATH;
const originalAppEnv = process.env.APP_ENV;

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  process.env.PATH = originalPath;
  if (originalAppEnv === undefined) {
    Reflect.deleteProperty(process.env, "APP_ENV");
  } else {
    process.env.APP_ENV = originalAppEnv;
  }
});

describe("loadConfigEnv", () => {
  test("uses the Omnis export for the local purpose when omnisd is available", () => {
    const workspace = mkdtempSync(join(tmpdir(), "omnis-config-env-"));
    const binDirectory = join(workspace, "bin");
    mkdirSync(binDirectory);
    writeFileSync(join(workspace, ".env.local"), "DATABASE_URL=file:dotenv.db\n");
    writeFileSync(
      join(binDirectory, "omnisd"),
      "#!/bin/sh\n[ \"$1 $2 $3 $4 $5 $6\" = \"env export --purpose local --format json\" ] || exit 3\nprintf '%s\\n' '{\"DATABASE_URL\":\"file:omnis.db\",\"FROM_OMNIS\":\"yes\"}'\n",
    );
    chmodSync(join(binDirectory, "omnisd"), 0o755);
    process.chdir(workspace);
    process.env.PATH = `${binDirectory}:${originalPath}`;
    process.env.APP_ENV = "local";

    expect(loadConfigEnv()).toMatchObject({ DATABASE_URL: "file:omnis.db", FROM_OMNIS: "yes" });
    rmSync(workspace, { force: true, recursive: true });
  });

  test("uses the Omnis export for the test purpose when omnisd is available", () => {
    const workspace = mkdtempSync(join(tmpdir(), "omnis-config-env-"));
    const binDirectory = join(workspace, "bin");
    mkdirSync(binDirectory);
    writeFileSync(
      join(binDirectory, "omnisd"),
      "#!/bin/sh\n[ \"$1 $2 $3 $4 $5 $6\" = \"env export --purpose test --format json\" ] || exit 3\nprintf '%s\\n' '{\"DATABASE_URL\":\"file:omnis-test.db\"}'\n",
    );
    chmodSync(join(binDirectory, "omnisd"), 0o755);
    process.chdir(workspace);
    process.env.PATH = `${binDirectory}:${originalPath}`;
    process.env.APP_ENV = "test";

    expect(loadConfigEnv()).toMatchObject({ DATABASE_URL: "file:omnis-test.db" });
    rmSync(workspace, { force: true, recursive: true });
  });

  test("falls back to dotenv files when omnisd is absent", () => {
    const workspace = mkdtempSync(join(tmpdir(), "omnis-config-env-"));
    writeFileSync(join(workspace, ".env.test"), "DATABASE_URL=file:test.db\n");
    process.chdir(workspace);
    process.env.PATH = "/definitely-not-present";
    process.env.APP_ENV = "test";

    expect(loadConfigEnv()).toMatchObject({ DATABASE_URL: "file:test.db" });
    rmSync(workspace, { force: true, recursive: true });
  });
});
