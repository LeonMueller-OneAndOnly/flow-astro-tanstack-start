import { createJobQueueWorker } from "../../job-queue";
import { jobs } from "./registry";
import "./send-mail";

export const mailJobQueueWorker = createJobQueueWorker(jobs, {
  concurrency: 1,
  retryDelayMs: 30_000,
});

export function startMailJobQueue() {
  void mailJobQueueWorker.start();
}

export async function stopMailJobQueue() {
  await mailJobQueueWorker.stop();
}
