import { createJobQueueWorker } from "../integrations/job-queue/implementation";
import { jobs } from "../integrations/job-queue";
import "./send-mail";

const globalWithJobQueueWorker = globalThis as typeof globalThis & {
  __jobQueueWorker?: { stop: () => Promise<void> };
};

if (import.meta.hot) void globalWithJobQueueWorker.__jobQueueWorker?.stop();

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

    void worker.stop();
  });
}

export function startJobQueueWorker() {
  void worker.start();
}

export async function stopJobQueueWorker() {
  await worker.stop();
}
