import "./registry";
import { Result } from "../../app/lib/result";
import { createJobQueueWorker, readHotApi } from "./implementation";
import { jobs } from ".";

const worker = createJobQueueWorker(jobs, {
  concurrency: 1,
});

export function startJobQueueWorker() {
  void Result.fromAsync(() => worker.start()).then((result) => {
    if (result.success) {
      console.log("[job-queue]: Started worker");
    } else {
      console.error("[job-queue]: Failed to worker", result.error);
    }
  });
}

export async function stopJobQueueWorker() {
  await worker.stop();
}

// ---------

readHotApi(import.meta)?.dispose(() => {
  void Result.fromAsync(() => worker.stop()).then((result) => {
    if (!result.success) console.error("Failed to stop job queue worker", result.error);
  });
});
