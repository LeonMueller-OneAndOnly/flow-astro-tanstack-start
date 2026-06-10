import { randomUUID } from "node:crypto";
import { hostname } from "node:os";

import { Cron } from "croner";
import { eq, sql } from "drizzle-orm";
import PQueue from "p-queue";
import { z } from "zod";

import { db } from "../../db/client";
import { Result } from "../../app/lib/result";
import { jobQueueCronSchedules, jobQueueJobs } from "../../db/schema";

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

export type DefineCronOptions<TSchema extends z.ZodTypeAny> = ScheduleJobOptions & {
  key: string;
  cron: string;
  payload: z.input<TSchema>;
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

export type DefineJobOptions<TName extends string, TSchema extends z.ZodTypeAny> = {
  name: TName;
  schema: TSchema;
  handler: JobHandler<z.output<TSchema>>;
};

export type DefinedJob<TName extends string, TSchema extends z.ZodTypeAny> = {
  name: TName;
  schema: TSchema;
  handler: JobHandler<z.output<TSchema>>;
  enqueue: (
    payload: z.input<TSchema>,
    options?: EnqueueJobOptions,
  ) => Promise<typeof jobQueueJobs.$inferSelect>;
  schedule: (
    cron: string,
    payload: z.input<TSchema>,
    options?: ScheduleJobOptions,
  ) => Promise<typeof jobQueueCronSchedules.$inferSelect>;
  defineCron: (options: DefineCronOptions<TSchema>) => RegisteredCron<TName, TSchema>;
};

export type RegisteredJob<
  TName extends string = string,
  TSchema extends z.ZodTypeAny = z.ZodTypeAny,
> = {
  name: TName;
  schema: TSchema;
  handler: JobHandler<z.output<TSchema>>;
};

export type RegisteredCron<
  TName extends string = string,
  TSchema extends z.ZodTypeAny = z.ZodTypeAny,
> = {
  key: string;
  job: RegisteredJob<TName, TSchema>;
  cron: string;
  payload: z.input<TSchema>;
  options: ScheduleJobOptions;
};

export type JobRegistry = {
  defineJob: <TName extends string, TSchema extends z.ZodTypeAny>(
    options: DefineJobOptions<TName, TSchema>,
  ) => DefinedJob<TName, TSchema>;
  getJobs: () => WorkerJob[];
  getCrons: () => WorkerCron[];
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

type WorkerJob = {
  name: string;
  schema: z.ZodTypeAny;
  handler: JobHandler<unknown>;
};

type WorkerCron = {
  key: string;
  job: WorkerJob;
  cron: string;
  payload: unknown;
  options: ScheduleJobOptions;
};

const defaultWorkerId = `job-queue@${hostname()}-${process.pid}`;

export function createJobRegistry(): JobRegistry {
  const jobs = new Map<string, WorkerJob>();
  const crons = new Map<string, WorkerCron>();

  return {
    defineJob(options) {
      const job = createDefinedJob(options, (cron) => {
        if (crons.has(cron.key)) throw new Error(`Cron job key already registered: ${cron.key}`);
        crons.set(cron.key, { ...cron, job: toWorkerJob(cron.job) });
      });

      if (jobs.has(job.name)) throw new Error(`Job already registered: ${job.name}`);
      jobs.set(job.name, toWorkerJob(job));

      return job;
    },
    getJobs: () => [...jobs.values()],
    getCrons: () => [...crons.values()],
  };
}

export function createJobQueueWorker(registry: JobRegistry, options: JobQueueWorkerOptions = {}) {
  const concurrency = options.concurrency ?? 1;
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const claimBatchSize = options.claimBatchSize ?? concurrency;
  const retryDelayMs = options.retryDelayMs ?? 30_000;
  const lockTimeoutMs = options.lockTimeoutMs ?? 5 * 60_000;
  const workerId = options.workerId ?? defaultWorkerId;
  const queue = new PQueue({ concurrency });
  const registeredJobs = registry.getJobs();
  const registeredCrons = registry.getCrons();
  const handlers = new Map(registeredJobs.map((job) => [job.name, job]));

  let interval: NodeJS.Timeout | undefined;
  let isTicking = false;
  let didSyncCrons = false;

  async function tick() {
    if (isTicking) return;

    const openSlots = concurrency - queue.pending - queue.size;
    if (openSlots <= 0) return;

    isTicking = true;

    try {
      if (!didSyncCrons) {
        await syncRegisteredCronSchedules(registeredCrons);
        didSyncCrons = true;
      }

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
    async start() {
      if (interval) return;

      await tick();
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

function toWorkerJob<TName extends string, TSchema extends z.ZodTypeAny>(
  job: RegisteredJob<TName, TSchema>,
): WorkerJob {
  return {
    name: job.name,
    schema: job.schema,
    handler: job.handler as unknown as JobHandler<unknown>,
  };
}

function createDefinedJob<TName extends string, TSchema extends z.ZodTypeAny>(
  options: DefineJobOptions<TName, TSchema>,
  registerCron: (cron: RegisteredCron<TName, TSchema>) => void,
): DefinedJob<TName, TSchema> {
  return {
    ...options,
    enqueue: (payload, enqueueOptions) =>
      enqueueJob(options.name, options.schema, payload, enqueueOptions),
    schedule: (cron, payload, scheduleOptions) =>
      scheduleJob(undefined, options.name, options.schema, cron, payload, scheduleOptions),
    defineCron: (cronOptions) => {
      const cron = {
        key: cronOptions.key,
        job: options,
        cron: cronOptions.cron,
        payload: cronOptions.payload,
        options: {
          maxAttempts: cronOptions.maxAttempts,
          priority: cronOptions.priority,
          timezone: cronOptions.timezone,
        },
      } satisfies RegisteredCron<TName, TSchema>;

      registerCron(cron);

      return cron;
    },
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
  key: string | undefined,
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
      key: key ?? `${name}:${randomUUID()}`,
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

async function syncRegisteredCronSchedules(crons: WorkerCron[]) {
  for (const cron of crons) {
    const now = Date.now();
    const parsedPayload = cron.job.schema.parse(cron.payload);
    const nextRunAt = getNextCronRunAt(cron.cron, cron.options.timezone, new Date(now));

    await db
      .insert(jobQueueCronSchedules)
      .values({
        key: cron.key,
        name: cron.job.name,
        payload: JSON.stringify(parsedPayload),
        cron: cron.cron,
        timezone: cron.options.timezone,
        status: "active",
        priority: cron.options.priority ?? 0,
        maxAttempts: cron.options.maxAttempts ?? 3,
        nextRunAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: jobQueueCronSchedules.key,
        set: {
          name: cron.job.name,
          payload: JSON.stringify(parsedPayload),
          cron: cron.cron,
          timezone: cron.options.timezone,
          status: "active",
          priority: cron.options.priority ?? 0,
          maxAttempts: cron.options.maxAttempts ?? 3,
          nextRunAt,
          updatedAt: now,
        },
      });
  }
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

    await db.insert(jobQueueJobs).values({
      name: schedule.name,
      payload: schedule.payload,
      status: "pending",
      cronScheduleId: schedule.id,
      priority: schedule.priority,
      maxAttempts: schedule.maxAttempts,
      availableAt: now,
      createdAt: now,
      updatedAt: now,
    });

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
  handlers: Map<string, WorkerJob>,
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

  const handlerResult = await Result.fromAsync(() =>
    Promise.resolve(
      registeredJob.handler(payloadResult.data, {
        id: job.id,
        name: job.name,
        payload: payloadResult.data,
        attempt: job.attempt,
        maxAttempts: job.maxAttempts,
      }),
    ),
  );

  if (!handlerResult.success) {
    await failJob(job, handlerResult.error, retryDelayMs);
    return;
  }

  await completeJob(job.id, handlerResult.data);
}

function parsePayload<TSchema extends z.ZodTypeAny>(job: ClaimedJobRow, schema: TSchema) {
  const jsonResult = Result.from(() => JSON.parse(job.payload));

  if (!jsonResult.success) return jsonResult;

  return schema.safeParse(jsonResult.data);
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
