DROP TABLE IF EXISTS `sidequest_jobs`;--> statement-breakpoint
DROP TABLE IF EXISTS `sidequest_migrations`;--> statement-breakpoint
DROP TABLE IF EXISTS `sidequest_migrations_lock`;--> statement-breakpoint
DROP TABLE IF EXISTS `sidequest_queues`;--> statement-breakpoint
CREATE TABLE `job_queue_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`payload` text NOT NULL,
	`status` text(32) DEFAULT 'pending' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
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
CREATE INDEX `job_queue_jobs_claim_idx` ON `job_queue_jobs` (`status`,`available_at`,`priority`);--> statement-breakpoint
CREATE INDEX `job_queue_jobs_locked_idx` ON `job_queue_jobs` (`status`,`locked_at`);--> statement-breakpoint
CREATE INDEX `job_queue_jobs_name_idx` ON `job_queue_jobs` (`name`);
