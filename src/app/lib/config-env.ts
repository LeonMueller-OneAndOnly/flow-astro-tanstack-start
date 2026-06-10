import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "dotenv";

type ConfigMode = "local" | "test" | "production";

export function loadConfigEnv() {
  const baseEnv = loadEnvFiles([".env"]);
  const mode = toConfigMode(process.env.APP_ENV ?? baseEnv.APP_ENV ?? getConfigMode());

  return { ...baseEnv, ...loadEnvFiles(getModeEnvFiles(mode)) };
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

function getModeEnvFiles(mode: ConfigMode) {
  if (mode === "local") return [".env.local"];

  return [`.env.${mode}`, `.env.${mode}.local`];
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

  return "development";
}

function toConfigMode(mode: string): ConfigMode {
  if (mode === "test" || mode === "production") return mode;

  return "local";
}
