ALTER TABLE `job_queue_cron_schedules` ADD `key` text(255);--> statement-breakpoint
CREATE UNIQUE INDEX `job_queue_cron_schedules_key_idx` ON `job_queue_cron_schedules` (`key`);