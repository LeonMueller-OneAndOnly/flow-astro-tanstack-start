import { createJobQueueWorker } from "../integrations/job-queue";
import { jobs } from "./registry";
import "./send-mail";

const worker = createJobQueueWorker(jobs, {
  concurrency: 1,
  retryDelayMs: 30_000,
});

export function startJobQueueWorker() {
  void worker.start();
}

export async function stopJobQueueWorker() {
  await worker.stop();
}
