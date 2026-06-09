CREATE TABLE `demo_todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `demo_todos_created_at_idx` ON `demo_todos` (`created_at`);