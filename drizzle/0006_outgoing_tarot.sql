DROP INDEX `job_queue_jobs_claim_idx`;--> statement-breakpoint
CREATE INDEX `job_queue_jobs_claim_idx` ON `job_queue_jobs` (`status`,`locked_at`,"priority" desc,`available_at`,`id`);