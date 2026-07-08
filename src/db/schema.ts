import { sql } from "drizzle-orm";
import { blob, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ── Better Auth tables ──────────────────────────────────────────────────────
/**
 * Better Auth owns the auth_* tables below. Keep them limited to authentication
 * identity, sessions, linked accounts, and verification tokens.
 *
 * Application/domain user data belongs in app-owned tables that reference
 * authUsers.id. Use `profiles` for generic profile data; create domain-specific
 * tables for billing, organizations, customer records, CRM notes, preferences,
 * product data, etc.
 *
 * Only add Better Auth `additionalFields` for auth-adjacent values that must be
 * available through Better Auth/session APIs. Security-sensitive fields such as
 * role, isAdmin, or isBanned must set `input: false` in Better Auth config.
 */
export const authUsers = sqliteTable("auth_users", {
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

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("auth_sessions_user_id_idx").on(table.userId)],
);

export const authAccounts = sqliteTable(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
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
  (table) => [index("auth_accounts_user_id_idx").on(table.userId)],
);

export const authVerifications = sqliteTable("auth_verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

// Better Auth's logical model names are singular. These aliases let the Drizzle
// adapter resolve those logical names while the database keeps explicit auth_*
// table names. Query app code should prefer the auth* exports above.
export const user = authUsers;
export const session = authSessions;
export const account = authAccounts;
export const verification = authVerifications;

// ── App-owned user data ─────────────────────────────────────────────────────
// Put product/domain user fields here instead of Better Auth's authUsers table.
export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    timezone: text("timezone"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("profiles_user_id_idx").on(table.userId)],
);

// ── Demo tables ─────────────────────────────────────────────────────────────
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

// ── Infrastructure tables ──────────────────────────────────────────────────
export const jobQueueJobs = sqliteTable(
  "job_queue_jobs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    name: text("name", { length: 255 }).notNull(),
    payload: blob("payload", { mode: "buffer" }).notNull(),
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
    result: blob("result", { mode: "buffer" }),
    lastError: text("last_error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("job_queue_jobs_claim_idx").on(
      table.status,
      table.lockedAt,
      sql`${table.priority} desc`,
      table.availableAt,
      table.id,
    ),
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
    payload: blob("payload", { mode: "buffer" }).notNull(),
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
