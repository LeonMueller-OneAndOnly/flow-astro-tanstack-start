import { z } from "zod";

import { cleanupJobQueueJobs } from "src/integrations/job-queue/implementation";
import { jobs } from "src/integrations/job-queue";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_COMPLETED_RETENTION_MS = 7 * DAY_MS;
const DEFAULT_FAILED_RETENTION_MS = 30 * DAY_MS;

const ZJobQueueCleanupPayload = z.object({
  completedRetentionMs: z.number().int().positive().default(DEFAULT_COMPLETED_RETENTION_MS),
  failedRetentionMs: z.number().int().positive().default(DEFAULT_FAILED_RETENTION_MS),
});

export const jobQueueCleanupJob = jobs.defineJob({
  name: "job-queue-cleanup",
  schema: ZJobQueueCleanupPayload,
  async handler({ completedRetentionMs, failedRetentionMs }) {
    return cleanupJobQueueJobs({ completedRetentionMs, failedRetentionMs });
  },
});

jobQueueCleanupJob.defineCron({
  key: "job-queue-cleanup:nightly",
  cron: "0 3 * * *",
  payload: {},
  priority: -100,
});
