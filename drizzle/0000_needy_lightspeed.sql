CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `demo_todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `demo_todos_created_at_idx` ON `demo_todos` (`created_at`);--> statement-breakpoint
CREATE TABLE `demo_user_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`storage_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`disk` text(32) DEFAULT 'local' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `demo_user_uploads_storage_key_unique` ON `demo_user_uploads` (`storage_key`);--> statement-breakpoint
CREATE INDEX `demo_user_uploads_created_at_idx` ON `demo_user_uploads` (`created_at`);--> statement-breakpoint
CREATE TABLE `job_queue_cron_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(255),
	`name` text(255) NOT NULL,
	`payload` blob NOT NULL,
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
CREATE INDEX `job_queue_cron_schedules_due_idx` ON `job_queue_cron_schedules` (`status`,`next_run_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `job_queue_cron_schedules_key_idx` ON `job_queue_cron_schedules` (`key`);--> statement-breakpoint
CREATE INDEX `job_queue_cron_schedules_name_idx` ON `job_queue_cron_schedules` (`name`);--> statement-breakpoint
CREATE TABLE `job_queue_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`payload` blob NOT NULL,
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
	`result` blob,
	`last_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `job_queue_jobs_claim_idx` ON `job_queue_jobs` (`status`,`locked_at`,"priority" desc,`available_at`,`id`);--> statement-breakpoint
CREATE INDEX `job_queue_jobs_cron_schedule_idx` ON `job_queue_jobs` (`cron_schedule_id`);--> statement-breakpoint
CREATE INDEX `job_queue_jobs_locked_idx` ON `job_queue_jobs` (`status`,`locked_at`);--> statement-breakpoint
CREATE INDEX `job_queue_jobs_name_idx` ON `job_queue_jobs` (`name`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`username` text,
	`display_username` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
