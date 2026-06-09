DROP TABLE IF EXISTS `sidequest_jobs`;--> statement-breakpoint
DROP TABLE IF EXISTS `sidequest_migrations`;--> statement-breakpoint
DROP TABLE IF EXISTS `sidequest_migrations_lock`;--> statement-breakpoint
DROP TABLE IF EXISTS `sidequest_queues`;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `job_queue_cron_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`payload` text NOT NULL,
	`cron` text(255) NOT NULL,
	`timezone` text(255),
	`status` text(32) DEFAULT 'active' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`last_enqueued_at` integer,
	`next_run_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `job_queue_cron_schedules_due_idx` ON `job_queue_cron_schedules` (`status`,`next_run_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `job_queue_cron_schedules_name_idx` ON `job_queue_cron_schedules` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `job_queue_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`payload` text NOT NULL,
	`status` text(32) DEFAULT 'pending' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`cron_schedule_id` integer,
	`available_at` integer NOT NULL,
	`locked_at` integer,
	`locked_by` text(255),
	`started_at` integer,
	`completed_at` integer,
	`failed_at` integer,
	`result` text,
	`last_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `job_queue_jobs_claim_idx` ON `job_queue_jobs` (`status`,`available_at`,`priority`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `job_queue_jobs_cron_schedule_idx` ON `job_queue_jobs` (`cron_schedule_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `job_queue_jobs_locked_idx` ON `job_queue_jobs` (`status`,`locked_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `job_queue_jobs_name_idx` ON `job_queue_jobs` (`name`);
