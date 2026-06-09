import { fileURLToPath } from "node:url";

import { DATABASE_URL } from "astro:env/server";
import {
  Sidequest,
  type JobClassType,
  type SidequestConfig,
  type SidequestEngineConfig,
  type SQLDriverConfig,
} from "sidequest";

export { Job, Sidequest } from "sidequest";
export type { JobData } from "sidequest";

const jobQueueBackendDriver = "@sidequest/sqlite-backend" as const;

let configurePromise: Promise<void> | undefined;
let startPromise: Promise<void> | undefined;
let isConfigured = false;
let isStarted = false;

export function getJobQueueEngineConfig(): SidequestEngineConfig<typeof jobQueueBackendDriver> {
  return {
    backend: {
      driver: jobQueueBackendDriver,
      config: getLibsqlBackendConfig(),
    },
    queues: [{ name: "default", concurrency: 1, priority: 0, state: "active" }],
    maxConcurrentJobs: 1,
    skipMigration: true,
  };
}

export function getJobQueueConfig(): SidequestConfig<typeof jobQueueBackendDriver> {
  return {
    ...getJobQueueEngineConfig(),
    dashboard: { enabled: false },
  };
}

export async function configureJobQueue() {
  if (isConfigured) return;

  configurePromise ??= Sidequest.configure(getJobQueueEngineConfig()).then(() => {
    isConfigured = true;
  });

  await configurePromise;
}

export async function startJobQueue() {
  if (isStarted) return;

  startPromise ??= (async () => {
    if (isConfigured || configurePromise) {
      await configurePromise;
      await Sidequest.start();
    } else {
      await Sidequest.start(getJobQueueConfig());
      isConfigured = true;
    }

    isStarted = true;
  })();

  await startPromise;
}

export async function stopJobQueue() {
  await Sidequest.stop();

  configurePromise = undefined;
  startPromise = undefined;
  isConfigured = false;
  isStarted = false;
}

export async function buildJob<T extends JobClassType>(JobClass: T) {
  await configureJobQueue();

  return Sidequest.build(JobClass);
}

export async function enqueueJob<T extends JobClassType>(
  JobClass: T,
  ...args: Parameters<InstanceType<T>["run"]>
) {
  await configureJobQueue();

  return Sidequest.build(JobClass).enqueue(...args);
}

function getLibsqlBackendConfig(): SQLDriverConfig {
  return {
    client: "better-sqlite3",
    connection: {
      filename: getSqliteFilenameFromDatabaseUrl(),
    },
    useNullAsDefault: true,
  };
}

function getSqliteFilenameFromDatabaseUrl() {
  if (DATABASE_URL === ":memory:") return DATABASE_URL;

  if (!DATABASE_URL.startsWith("file:")) {
    throw new Error(
      "Sidequest's SQLite backend can only share local file: DATABASE_URL values. Remote libSQL URLs need a Sidequest backend that supports @libsql/client.",
    );
  }

  if (DATABASE_URL.startsWith("file://")) return fileURLToPath(DATABASE_URL);

  const filename = DATABASE_URL.slice("file:".length);

  if (!filename) throw new Error("DATABASE_URL must include a database file path");

  return filename;
}
