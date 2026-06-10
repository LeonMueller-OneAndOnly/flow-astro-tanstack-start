import { Result } from "../../app/lib/result";
import { createJobQueueWorker } from "./implementation";
import { jobs } from ".";
import "../../jobs/send-mail";

const globalWithJobQueueWorker = globalThis as typeof globalThis & {
  __jobQueueWorker?: { stop: () => Promise<void> };
};

if (import.meta.hot && globalWithJobQueueWorker.__jobQueueWorker) {
  void Result.fromAsync(
    () => globalWithJobQueueWorker.__jobQueueWorker?.stop() ?? Promise.resolve(),
  ).then((result) => {
    if (!result.success) console.error("Failed to stop previous job queue worker", result.error);
  });
}

const worker = createJobQueueWorker(jobs, {
  concurrency: 1,
  retryDelayMs: 30_000,
});

if (import.meta.hot) {
  globalWithJobQueueWorker.__jobQueueWorker = worker;
  import.meta.hot.dispose(() => {
    if (globalWithJobQueueWorker.__jobQueueWorker === worker) {
      globalWithJobQueueWorker.__jobQueueWorker = undefined;
    }

    void Result.fromAsync(() => worker.stop()).then((result) => {
      if (!result.success) console.error("Failed to stop job queue worker", result.error);
    });
  });
}

export function startJobQueueWorker() {
  void Result.fromAsync(() => worker.start()).then((result) => {
    if (!result.success) console.error("Failed to start job queue worker", result.error);
  });
}

export async function stopJobQueueWorker() {
  await worker.stop();
}
