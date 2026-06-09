import { sql } from "drizzle-orm";
import { integer, numeric, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const sidequestMigrations = sqliteTable("sidequest_migrations", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  name: text("name", { length: 255 }),
  batch: integer("batch"),
  migrationTime: numeric("migration_time"),
});

export const sidequestMigrationsLock = sqliteTable("sidequest_migrations_lock", {
  index: integer("index").primaryKey({ autoIncrement: true }).notNull(),
  isLocked: integer("is_locked"),
});

export const sidequestQueues = sqliteTable(
  "sidequest_queues",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    name: text("name", { length: 255 }).notNull(),
    state: text("state", { length: 255 }).notNull(),
    concurrency: integer("concurrency").notNull(),
    priority: integer("priority").notNull(),
  },
  (table) => [uniqueIndex("sidequest_queues_name_unique").on(table.name)],
);

export const sidequestJobs = sqliteTable(
  "sidequest_jobs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    queue: text("queue", { length: 255 }).notNull(),
    class: text("class", { length: 255 }).notNull(),
    script: text("script", { length: 255 }).notNull(),
    args: text("args").notNull(),
    constructorArgs: text("constructor_args").notNull(),
    result: text("result"),
    errors: text("errors"),
    state: text("state", { length: 255 }).notNull(),
    availableAt: numeric("available_at"),
    insertedAt: numeric("inserted_at").notNull(),
    attemptedAt: numeric("attempted_at"),
    completedAt: numeric("completed_at"),
    failedAt: numeric("failed_at"),
    canceledAt: numeric("canceled_at"),
    claimedAt: numeric("claimed_at"),
    claimedBy: text("claimed_by", { length: 255 }),
    attempt: integer("attempt").notNull(),
    maxAttempts: integer("max_attempts").notNull(),
    timeout: integer("timeout"),
    uniqueDigest: text("unique_digest", { length: 255 }),
    uniquenessConfig: text("uniqueness_config"),
    retryDelay: integer("retry_delay"),
    backoffStrategy: text("backoff_strategy").default("exponential").notNull(),
  },
  (table) => [
    uniqueIndex("sidequest_jobs_unique_digest_active_idx")
      .on(table.uniqueDigest)
      .where(sql`${table.uniqueDigest} is not null`),
  ],
);
