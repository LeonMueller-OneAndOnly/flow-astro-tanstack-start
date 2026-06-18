import type { DefinedJob } from "src/integrations/job-queue/implementation";
import { jobQueueCleanupJob } from "./job-queue-cleanup";
import { sendMailJob } from "./send-mail";
import type z from "zod";

export const jobQueueNames = ["job-queue-cleanup", "send-mail"] as const;

export type TQueueName = (typeof jobQueueNames)[number];

type TJobRegistryMap = {
  [TName in TQueueName]: DefinedJob<TName, z.ZodSchema<any>>;
};

export const jobRegistryMap: TJobRegistryMap = {
  [jobQueueCleanupJob.name]: jobQueueCleanupJob,
  [sendMailJob.name]: sendMailJob,
};
