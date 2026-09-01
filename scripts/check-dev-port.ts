import { spawnSync } from "node:child_process";

import { registerConfigEnv } from "../src/app/lib/framework/config-env.ts";

const configEnv = registerConfigEnv();
const configuredPort = process.env.PORT ?? configEnv.PORT ?? "4321";
const port = Number(configuredPort);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  console.error(`PORT must be an integer from 1 to 65535, got "${configuredPort}".`);
  process.exit(1);
}

const listeners = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fp", "-a"], {
  encoding: "utf8",
});
const pids = [
  ...new Set(
    listeners.stdout
      .split("\n")
      .filter((line) => line.startsWith("p"))
      .map((line) => line.slice(1))
      .filter((pid) => /^\d+$/.test(pid)),
  ),
];

if (pids.length > 0) {
  const noun = pids.length === 1 ? "process" : "processes";
  const pronoun = pids.length === 1 ? "it" : "them";
  console.error(`Port ${port} is already used by ${noun} ${pids.join(", ")}.`);
  console.error(`Stop ${pronoun} with: kill ${pids.join(" ")}`);
  console.error(`If a process does not stop, force it with: kill -9 ${pids.join(" ")}`);
  process.exit(1);
}
