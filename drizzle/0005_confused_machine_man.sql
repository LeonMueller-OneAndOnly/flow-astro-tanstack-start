DROP INDEX `job_queue_jobs_claim_idx`;--> statement-breakpoint
CREATE INDEX `job_queue_jobs_claim_idx` ON `job_queue_jobs` (`status`,`locked_at`,`priority` DESC,`available_at`,`id`);
