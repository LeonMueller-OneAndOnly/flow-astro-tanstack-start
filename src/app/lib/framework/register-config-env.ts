/**
 * THIS FILE NEEDS TO STAY AT src/app/lib/framework/register-config-env.ts
 * It is used as a import by the package.json start script
 */

import { loadConfigEnv } from "./config-env.ts";

for (const [key, value] of Object.entries(loadConfigEnv())) {
  process.env[key] ??= value;
}
