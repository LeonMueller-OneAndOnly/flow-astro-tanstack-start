import { hostname } from "node:os";

import { Cron } from "croner";
import { eq, sql } from "drizzle-orm";
import PQueue from "p-queue";
import { z } from "zod";

import { db } from "../../app/db/client";
import { jobQueueCronSchedules, jobQueueJobs } from "../../app/db/schema";

export type JobQueueStatus = "pending" | "running" | "completed" | "failed";

export type EnqueueJobOptions = {
  availableAt?: Date;
  cronScheduleId?: number;
  delayMs?: number;
  maxAttempts?: number;
  priority?: number;
};

export type ScheduleJobOptions = {
  maxAttempts?: number;
  priority?: number;
  timezone?: string;
};

export type JobQueueContext<TPayload> = {
  id: number;
  name: string;
  payload: TPayload;
  attempt: number;
  maxAttempts: number;
};

export type JobHandler<TPayload> = (
  payload: TPayload,
  context: JobQueueContext<TPayload>,
) => unknown;

export type DefinedJob<TName extends string, TSchema extends z.ZodTypeAny> = {
  name: TName;
  schema: TSchema;
  enqueue: (
    payload: z.input<TSchema>,
    options?: EnqueueJobOptions,
  ) => Promise<typeof jobQueueJobs.$inferSelect>;
  schedule: (
    cron: string,
    payload: z.input<TSchema>,
    options?: ScheduleJobOptions,
  ) => Promise<typeof jobQueueCronSchedules.$inferSelect>;
  handle: (handler: JobHandler<z.output<TSchema>>) => RegisteredJob<TName, TSchema>;
};

export type RegisteredJob<
  TName extends string = string,
  TSchema extends z.ZodTypeAny = z.ZodTypeAny,
> = {
  name: TName;
  schema: TSchema;
  handler: JobHandler<z.output<TSchema>>;
};

export type JobQueueWorkerOptions = {
  concurrency?: number;
  pollIntervalMs?: number;
  claimBatchSize?: number;
  retryDelayMs?: number;
  lockTimeoutMs?: number;
  workerId?: string;
};

type ClaimedJobRow = typeof jobQueueJobs.$inferSelect;

const defaultWorkerId = `job-queue@${hostname()}-${process.pid}`;

export function defineJob<TName extends string, TSchema extends z.ZodTypeAny>(options: {
  name: TName;
  schema: TSchema;
}): DefinedJob<TName, TSchema> {
  return {
    ...options,
    enqueue: (payload, enqueueOptions) =>
      enqueueJob(options.name, options.schema, payload, enqueueOptions),
    schedule: (cron, payload, scheduleOptions) =>
      scheduleJob(options.name, options.schema, cron, payload, scheduleOptions),
    handle: (handler) => ({ ...options, handler }),
  };
}

export function createJobQueueWorker(jobs: RegisteredJob[], options: JobQueueWorkerOptions = {}) {
  const concurrency = options.concurrency ?? 1;
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const claimBatchSize = options.claimBatchSize ?? concurrency;
  const retryDelayMs = options.retryDelayMs ?? 30_000;
  const lockTimeoutMs = options.lockTimeoutMs ?? 5 * 60_000;
  const workerId = options.workerId ?? defaultWorkerId;
  const queue = new PQueue({ concurrency });
  const handlers = new Map(jobs.map((job) => [job.name, job]));

  let interval: NodeJS.Timeout | undefined;
  let isTicking = false;

  async function tick() {
    if (isTicking) return;

    const openSlots = concurrency - queue.pending - queue.size;
    if (openSlots <= 0) return;

    isTicking = true;

    try {
      await releaseStaleJobs(lockTimeoutMs);
      await enqueueDueCronSchedules();
      const claimedJobs = await claimJobs(Math.min(openSlots, claimBatchSize), workerId);

      for (const job of claimedJobs) {
        queue.add(() => processJob(job, handlers, retryDelayMs));
      }
    } finally {
      isTicking = false;
    }
  }

  return {
    start() {
      if (interval) return;

      void tick();
      interval = setInterval(() => void tick(), pollIntervalMs);
    },
    async stop() {
      if (interval) clearInterval(interval);
      interval = undefined;

      await queue.onIdle();
    },
    tick,
  };
}

async function enqueueJob<TSchema extends z.ZodTypeAny>(
  name: string,
  schema: TSchema,
  payload: z.input<TSchema>,
  options: EnqueueJobOptions = {},
) {
  const now = Date.now();
  const parsedPayload = schema.parse(payload);
  const availableAt = options.availableAt?.getTime() ?? now + (options.delayMs ?? 0);

  const [job] = await db
    .insert(jobQueueJobs)
    .values({
      name,
      payload: JSON.stringify(parsedPayload),
      status: "pending",
      cronScheduleId: options.cronScheduleId,
      priority: options.priority ?? 0,
      maxAttempts: options.maxAttempts ?? 3,
      availableAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return job;
}

async function scheduleJob<TSchema extends z.ZodTypeAny>(
  name: string,
  schema: TSchema,
  cron: string,
  payload: z.input<TSchema>,
  options: ScheduleJobOptions = {},
) {
  const now = Date.now();
  const parsedPayload = schema.parse(payload);
  const nextRunAt = getNextCronRunAt(cron, options.timezone, new Date(now));

  const [schedule] = await db
    .insert(jobQueueCronSchedules)
    .values({
      name,
      payload: JSON.stringify(parsedPayload),
      cron,
      timezone: options.timezone,
      status: "active",
      priority: options.priority ?? 0,
      maxAttempts: options.maxAttempts ?? 3,
      nextRunAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return schedule;
}

async function enqueueDueCronSchedules() {
  const now = Date.now();

  const dueSchedules = await db.all<typeof jobQueueCronSchedules.$inferSelect>(sql`
    update ${jobQueueCronSchedules}
    set
      last_enqueued_at = ${now},
      updated_at = ${now}
    where id in (
      select id
      from ${jobQueueCronSchedules}
      where status = 'active'
        and next_run_at <= ${now}
      order by next_run_at asc, id asc
      limit 25
    )
    returning *
  `);

  for (const schedule of dueSchedules) {
    const nextRunAt = getNextCronRunAt(schedule.cron, schedule.timezone, new Date(now + 1));

    await db
      .insert(jobQueueJobs)
      .values({
        name: schedule.name,
        payload: schedule.payload,
        status: "pending",
        cronScheduleId: schedule.id,
        priority: schedule.priority,
        maxAttempts: schedule.maxAttempts,
        availableAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db
      .update(jobQueueCronSchedules)
      .set({ nextRunAt, updatedAt: now })
      .where(eq(jobQueueCronSchedules.id, schedule.id));
  }
}

async function claimJobs(limit: number, workerId: string): Promise<ClaimedJobRow[]> {
  if (limit <= 0) return [];

  const now = Date.now();

  return db.all(sql<ClaimedJobRow>`
    update ${jobQueueJobs}
    set
      status = 'running',
      locked_at = ${now},
      locked_by = ${workerId},
      started_at = ${now},
      attempt = attempt + 1,
      updated_at = ${now}
    where id in (
      select id
      from ${jobQueueJobs}
      where status = 'pending'
        and available_at <= ${now}
      order by priority desc, available_at asc, id asc
      limit ${limit}
    )
    returning *
  `);
}

async function processJob(
  job: ClaimedJobRow,
  handlers: Map<string, RegisteredJob>,
  retryDelayMs: number,
) {
  const registeredJob = handlers.get(job.name);

  if (!registeredJob) {
    await failJob(job, new Error(`No handler registered for job "${job.name}"`), retryDelayMs);
    return;
  }

  const payloadResult = parsePayload(job, registeredJob.schema);

  if (!payloadResult.success) {
    await failJob(job, payloadResult.error, retryDelayMs);
    return;
  }

  try {
    const result = await registeredJob.handler(payloadResult.data, {
      id: job.id,
      name: job.name,
      payload: payloadResult.data,
      attempt: job.attempt,
      maxAttempts: job.maxAttempts,
    });

    await completeJob(job.id, result);
  } catch (error) {
    await failJob(job, error, retryDelayMs);
  }
}

function parsePayload<TSchema extends z.ZodTypeAny>(job: ClaimedJobRow, schema: TSchema) {
  try {
    return schema.safeParse(JSON.parse(job.payload));
  } catch (error) {
    return { success: false as const, error };
  }
}

async function completeJob(id: number, result: unknown) {
  const now = Date.now();

  await db
    .update(jobQueueJobs)
    .set({
      status: "completed",
      completedAt: now,
      lockedAt: null,
      lockedBy: null,
      result: JSON.stringify(result ?? null),
      updatedAt: now,
    })
    .where(eq(jobQueueJobs.id, id));
}

async function failJob(job: ClaimedJobRow, error: unknown, retryDelayMs: number) {
  const now = Date.now();
  const shouldRetry = job.attempt < job.maxAttempts;
  const message = serializeError(error);

  await db
    .update(jobQueueJobs)
    .set({
      status: shouldRetry ? "pending" : "failed",
      availableAt: shouldRetry ? now + retryDelayMs : job.availableAt,
      failedAt: shouldRetry ? null : now,
      lockedAt: null,
      lockedBy: null,
      lastError: message,
      updatedAt: now,
    })
    .where(eq(jobQueueJobs.id, job.id));
}

async function releaseStaleJobs(lockTimeoutMs: number) {
  const now = Date.now();
  const staleBefore = now - lockTimeoutMs;

  await db.run(sql`
    update ${jobQueueJobs}
    set
      status = 'pending',
      locked_at = null,
      locked_by = null,
      updated_at = ${now}
    where status = 'running'
      and locked_at is not null
      and locked_at < ${staleBefore}
      and attempt < max_attempts
  `);

  await db.run(sql`
    update ${jobQueueJobs}
    set
      status = 'failed',
      failed_at = ${now},
      locked_at = null,
      locked_by = null,
      updated_at = ${now}
    where status = 'running'
      and locked_at is not null
      and locked_at < ${staleBefore}
      and attempt >= max_attempts
  `);
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return JSON.stringify({ name: error.name, message: error.message, stack: error.stack });
  }

  return JSON.stringify({ message: String(error) });
}

function getNextCronRunAt(cron: string, timezone: string | null | undefined, from: Date) {
  const nextRun = new Cron(cron, { paused: true, timezone: timezone ?? undefined }).nextRun(from);

  if (!nextRun) throw new Error(`Cron expression has no next run: ${cron}`);

  return nextRun.getTime();
}
