import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export const demoUserUploads = sqliteTable(
  "demo_user_uploads",
  {
    id: text("id").primaryKey(),
    storageKey: text("storage_key").notNull().unique(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    disk: text("disk", { length: 32 }).notNull().default("local"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("demo_user_uploads_created_at_idx").on(table.createdAt)],
);

/** Framework starter demo data for the todo example. Remove this table when deleting demo routes. */
export const demoTodos = sqliteTable(
  "demo_todos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("demo_todos_created_at_idx").on(table.createdAt)],
);

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
    key: text("key", { length: 255 }),
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
    uniqueIndex("job_queue_cron_schedules_key_idx").on(table.key),
    index("job_queue_cron_schedules_name_idx").on(table.name),
  ],
);
