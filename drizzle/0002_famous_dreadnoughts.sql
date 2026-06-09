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
CREATE INDEX `demo_user_uploads_created_at_idx` ON `demo_user_uploads` (`created_at`);