import { loadConfigEnv } from "./config-env.ts";

for (const [key, value] of Object.entries(loadConfigEnv())) {
  process.env[key] ??= value;
}
