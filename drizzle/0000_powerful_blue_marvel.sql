CREATE TABLE IF NOT EXISTS `sidequest_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`queue` text(255) NOT NULL,
	`class` text(255) NOT NULL,
	`script` text(255) NOT NULL,
	`args` text NOT NULL,
	`constructor_args` text NOT NULL,
	`result` text,
	`errors` text,
	`state` text(255) NOT NULL,
	`available_at` numeric,
	`inserted_at` numeric NOT NULL,
	`attempted_at` numeric,
	`completed_at` numeric,
	`failed_at` numeric,
	`canceled_at` numeric,
	`claimed_at` numeric,
	`claimed_by` text(255),
	`attempt` integer NOT NULL,
	`max_attempts` integer NOT NULL,
	`timeout` integer,
	`unique_digest` text(255),
	`uniqueness_config` text,
	`retry_delay` integer,
	`backoff_strategy` text DEFAULT 'exponential' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sidequest_jobs_unique_digest_active_idx` ON `sidequest_jobs` (`unique_digest`) WHERE "sidequest_jobs"."unique_digest" is not null;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sidequest_migrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255),
	`batch` integer,
	`migration_time` numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sidequest_migrations_lock` (
	`index` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`is_locked` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sidequest_queues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`state` text(255) NOT NULL,
	`concurrency` integer NOT NULL,
	`priority` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sidequest_queues_name_unique` ON `sidequest_queues` (`name`);
