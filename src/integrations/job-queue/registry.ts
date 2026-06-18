import type { DefinedJob } from "src/integrations/job-queue/implementation";
import { jobQueueCleanupJob } from "../../jobs/job-queue-cleanup";
import { sendMailJob } from "../../jobs/send-mail";
import type z from "zod";

export const jobQueueNames = ["job-queue-cleanup", "send-mail"] as const;

export type TQueueName = (typeof jobQueueNames)[number];

type TJobRegistryMap = {
  [TName in TQueueName]: DefinedJob<TName, z.ZodSchema<any>>;
};

/**
 * This map ensures all modules that register a job queue also get loaded when starting the job queue.
 * This module is imported in src/integrations/job-queue/worker.ts
 */
export const jobRegistryMap: TJobRegistryMap = {
  [jobQueueCleanupJob.name]: jobQueueCleanupJob,
  [sendMailJob.name]: sendMailJob,
};
