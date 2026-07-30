import { Result } from "../../app/lib/result";

let started = false;

/**
 * Idempotent worker startup, reached from src/pages/instrumentation.ts.
 *
 * The boot-time callers — the dev integration and server/prod.ts — both run
 * outside Vite's module graph, so a loopback request to that endpoint is the
 * only way in. Importing this module from plain Node instead would require the
 * whole job-queue graph to resolve without Vite's extension resolution, path
 * aliases, `astro:env/server` and `import.meta.env`.
 */
export async function startJobQueueWorkerOnce(): Promise<Result<void>> {
  if (started) return Result.ok(undefined);
  started = true;

  // Imported dynamically, not statically: the worker module constructs the
  // queue and loads the job registry at module scope, which opens the database.
  // Keeping it behind a dynamic import means nothing touches the database until
  // startup is actually requested.
  const result = await Result.fromAsync(() => import("./worker"));

  if (!result.success) {
    started = false;
    return result;
  }

  result.data.startJobQueueWorker();

  return Result.ok(undefined);
}
