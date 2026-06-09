import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const jobQueueJobs = sqliteTable(
  "job_queue_jobs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    name: text("name", { length: 255 }).notNull(),
    payload: text("payload").notNull(),
    status: text("status", { length: 32 }).notNull().default("pending"),
    priority: integer("priority").notNull().default(0),
    attempt: integer("attempt").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    cronScheduleId: integer("cron_schedule_id"),
    availableAt: integer("available_at").notNull(),
    lockedAt: integer("locked_at"),
    lockedBy: text("locked_by", { length: 255 }),
    startedAt: integer("started_at"),
    completedAt: integer("completed_at"),
    failedAt: integer("failed_at"),
    result: text("result"),
    lastError: text("last_error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("job_queue_jobs_claim_idx").on(table.status, table.availableAt, table.priority),
    index("job_queue_jobs_cron_schedule_idx").on(table.cronScheduleId),
    index("job_queue_jobs_locked_idx").on(table.status, table.lockedAt),
    index("job_queue_jobs_name_idx").on(table.name),
  ],
);

export const jobQueueCronSchedules = sqliteTable(
  "job_queue_cron_schedules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    name: text("name", { length: 255 }).notNull(),
    payload: text("payload").notNull(),
    cron: text("cron", { length: 255 }).notNull(),
    timezone: text("timezone", { length: 255 }),
    status: text("status", { length: 32 }).notNull().default("active"),
    priority: integer("priority").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastEnqueuedAt: integer("last_enqueued_at"),
    nextRunAt: integer("next_run_at").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("job_queue_cron_schedules_due_idx").on(table.status, table.nextRunAt),
    index("job_queue_cron_schedules_name_idx").on(table.name),
  ],
);
