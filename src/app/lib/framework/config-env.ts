import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";
// .ts ending is required here - register-config-env.ts loads this module - and is itself preloaded during app start. Therefore it has to adhere to node typescript resolution rules
import { Result } from "./result.ts";

type ConfigMode = "local" | "test" | "production";

export function loadConfigEnv() {
  const baseEnv = loadEnvFiles([".env"]);
  const mode = toConfigMode(process.env.APP_ENV ?? baseEnv.APP_ENV ?? getConfigMode());

  return {
    ...baseEnv,
    ...loadEnvFiles(getModeEnvFiles(mode)),
    ...loadOmnisEnv(mode),
  };
}

function loadEnvFiles(envFiles: Array<string>) {
  return envFiles.reduce<Record<string, string>>((env, envFile) => {
    const path = join(process.cwd(), envFile);

    if (!existsSync(path)) {
      return env;
    }

    return { ...env, ...parse(readFileSync(path)) };
  }, {});
}

function loadOmnisEnv(mode: ConfigMode) {
  const result = spawnSync("omnis", ["env", "export", `--${mode}`, "--format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0 || result.error) return {};

  const parsed = parseOmnisEnv(result.stdout);
  return parsed ?? {};
}

function parseOmnisEnv(value: string): Record<string, string> | null {
  const decoded = Result.from(() => JSON.parse(value) as unknown);
  if (
    !decoded.success ||
    !decoded.data ||
    typeof decoded.data !== "object" ||
    Array.isArray(decoded.data)
  ) {
    return null;
  }

  const entries = Object.entries(decoded.data);
  if (
    entries.some(
      ([key, envValue]) => !/^[A-Z_][A-Z0-9_]*$/.test(key) || typeof envValue !== "string",
    )
  ) {
    return null;
  }
  return Object.fromEntries(entries);
}

function getModeEnvFiles(mode: ConfigMode) {
  if (mode === "local") return [".env.local"];

  return [`.env.${mode}`, `.env.${mode}.local`];
}

function toConfigMode(mode: string): ConfigMode {
  if (mode === "test" || mode === "production") return mode;

  return "local";
}

function getConfigMode() {
  const modeFlag = process.argv.find((arg) => arg.startsWith("--mode="));

  if (modeFlag) {
    return modeFlag.slice("--mode=".length);
  }

  const modeFlagIndex = process.argv.indexOf("--mode");

  if (modeFlagIndex !== -1) {
    return process.argv[modeFlagIndex + 1] ?? "development";
  }

  if (process.argv.includes("build") || process.argv.includes("preview")) {
    return "production";
  }

  if (process.argv.includes("dev")) {
    return "development";
  }

  return "development";
}
