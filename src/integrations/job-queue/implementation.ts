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

type HotImportMeta = ImportMeta & {
  hot?: {
    accept: () => void;
  };
};

export type DefineJobOptions<TName extends string, TSchema extends z.ZodTypeAny> = {
  importMeta?: HotImportMeta;
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
  getVersion: () => number;
};

export type JobQueueWorkerOptions = {
  concurrency?: number;
  pollIntervalMs?: number;
  claimBatchSize?: number;
  cronBatchSize?: number;
  retry?: JobQueueRetryOptions;
  lockTimeoutMs?: number;
  workerId?: string;
};

export type JobQueueRetryOptions =
  | {
      strategy: "exponential";
      baseDelayMs?: number;
      maxDelayMs?: number;
    }
  | {
      strategy: "static";
      delayMs?: number;
    };

export type CleanupJobQueueJobsOptions = {
  completedRetentionMs: number;
  failedRetentionMs: number;
};

export type CleanupJobQueueJobsResult = {
  deleted: number;
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

type JobRetryOptions =
  | {
      strategy: "exponential";
      baseDelayMs: number;
      maxDelayMs: number;
    }
  | {
      strategy: "static";
      delayMs: number;
    };

const defaultWorkerId = `job-queue@${hostname()}-${process.pid}`;
const defaultRetryBaseDelayMs = 30_000;
const defaultRetryMaxDelayMs = 15 * 60_000;

export function createJobRegistry(): JobRegistry {
  const jobs = new Map<string, WorkerJob>();
  const crons = new Map<string, WorkerCron>();
  let version = 0;

  return {
    defineJob(options) {
      options.importMeta?.hot?.accept();

      const job = createDefinedJob(options, (cron) => {
        if (!import.meta.hot && crons.has(cron.key)) {
          throw new Error(`Cron job key already registered: ${cron.key}`);
        }

        crons.set(cron.key, { ...cron, job: toWorkerJob(cron.job) });
        version += 1;
      });

      if (!import.meta.hot && jobs.has(job.name))
        throw new Error(`Job already registered: ${job.name}`);

      jobs.set(job.name, toWorkerJob(job));
      version += 1;

      return job;
    },
    getJobs: () => [...jobs.values()],
    getCrons: () => [...crons.values()],
    getVersion: () => version,
  };
}

export function createJobQueueWorker(registry: JobRegistry, options: JobQueueWorkerOptions = {}) {
  const concurrency = options.concurrency ?? 1;
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const claimBatchSize = options.claimBatchSize ?? Math.max(concurrency, 10);
  const cronBatchSize = options.cronBatchSize ?? 100;
  const retryOptions = resolveJobRetryOptions(options.retry);
  const lockTimeoutMs = options.lockTimeoutMs ?? 5 * 60_000;
  const workerId = options.workerId ?? defaultWorkerId;
  const queue = new PQueue({ concurrency });

  let interval: NodeJS.Timeout | undefined;
  let isTicking = false;
  let registryVersion = -1;
  let handlers = new Map<string, WorkerJob>();
  let isStarted = false;
  let isIdleTickScheduled = false;

  function tickWhenIdle() {
    if (isIdleTickScheduled) return;

    isIdleTickScheduled = true;

    void Result.fromAsync(async () => {
      await queue.onIdle();
      isIdleTickScheduled = false;
      if (isStarted) await tick();
    }).then((result) => {
      if (!result.success) {
        isIdleTickScheduled = false;
        logJobQueueError("Job queue idle tick failed", result.error);
      }
    });
  }

  async function tick() {
    if (isTicking) return;

    if (queue.pending > 0 || queue.size > 0) return;

    isTicking = true;

    const tickResult = await Result.fromAsync(async () => {
      await refreshRegisteredJobs();

      await releaseStaleJobs(lockTimeoutMs);
      await enqueueDueCronSchedules(cronBatchSize, lockTimeoutMs);
      const claimedJobs = await claimJobs(claimBatchSize, workerId);

      for (const job of claimedJobs) {
        void Result.fromAsync(() =>
          queue.add(async () => {
            const jobResult = await Result.fromAsync(() =>
              processJob(job, handlers, retryOptions, workerId),
            );

            if (!jobResult.success) {
              logJobQueueError(
                `Job queue failed to process job ${job.id} (${job.name})`,
                jobResult.error,
              );
            }
          }),
        ).then((queueResult) => {
          if (!queueResult.success) {
            logJobQueueError(
              `Job queue failed to enqueue job ${job.id} (${job.name})`,
              queueResult.error,
            );
          }
        });
      }

      if (claimedJobs.length > 0) tickWhenIdle();
    });

    isTicking = false;

    if (!tickResult.success) {
      logJobQueueError("Job queue tick failed", tickResult.error);
    }
  }

  async function refreshRegisteredJobs() {
    const currentRegistryVersion = registry.getVersion();

    if (currentRegistryVersion === registryVersion) return;

    const registeredJobs = registry.getJobs();
    const registeredCrons = registry.getCrons();

    handlers = new Map(registeredJobs.map((job) => [job.name, job]));
    await syncRegisteredCronSchedules(registeredCrons);
    registryVersion = currentRegistryVersion;
  }

  return {
    async start() {
      if (isStarted) return;

      isStarted = true;
      await tick();
      interval = setInterval(() => void tick(), pollIntervalMs);
    },
    async stop() {
      isStarted = false;
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

async function enqueueDueCronSchedules(limit: number, lockTimeoutMs: number) {
  const now = Date.now();
  const staleBefore = now - lockTimeoutMs;

  await db.run(sql`
    update ${jobQueueCronSchedules}
    set
      status = 'active',
      updated_at = ${now}
    where status = 'enqueuing'
      and updated_at < ${staleBefore}
  `);

  const dueSchedules = await db.all<typeof jobQueueCronSchedules.$inferSelect>(sql`
    update ${jobQueueCronSchedules}
    set
      status = 'enqueuing',
      last_enqueued_at = ${now},
      updated_at = ${now}
    where id in (
      select id
      from ${jobQueueCronSchedules}
      where status = 'active'
        and next_run_at <= ${now}
      order by next_run_at asc, id asc
      limit ${limit}
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
      .set({ status: "active", nextRunAt, updatedAt: now })
      .where(eq(jobQueueCronSchedules.id, schedule.id));
  }
}

async function claimJobs(limit: number, workerId: string): Promise<ClaimedJobRow[]> {
  if (limit <= 0) return [];

  const now = Date.now();

  return db.all(sql<ClaimedJobRow>`
    update ${jobQueueJobs}
    set
      locked_at = ${now},
      locked_by = ${workerId},
      updated_at = ${now}
    where id in (
      select id
      from ${jobQueueJobs}
      where status = 'pending'
        and locked_at is null
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
  retryOptions: JobRetryOptions,
  workerId: string,
) {
  const startedJob = await startJob(job.id, workerId);

  if (!startedJob) return;

  job = startedJob;

  const registeredJob = handlers.get(job.name);

  if (!registeredJob) {
    await recordJobFailure(
      job,
      new Error(`No handler registered for job "${job.name}"`),
      retryOptions,
    );
    return;
  }

  const payloadResult = parsePayload(job, registeredJob.schema);

  if (!payloadResult.success) {
    await recordJobFailure(job, payloadResult.error, retryOptions);
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
    await recordJobFailure(job, handlerResult.error, retryOptions);
    return;
  }

  await completeJob(job.id, handlerResult.data);
}

async function startJob(id: number, workerId: string): Promise<ClaimedJobRow | undefined> {
  const now = Date.now();
  const [job] = await db.all(sql<ClaimedJobRow>`
    update ${jobQueueJobs}
    set
      status = 'running',
      locked_at = ${now},
      locked_by = ${workerId},
      started_at = ${now},
      attempt = attempt + 1,
      updated_at = ${now}
    where id = ${id}
      and status = 'pending'
      and locked_by = ${workerId}
    returning *
  `);

  return job as ClaimedJobRow | undefined;
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

async function failJob(job: ClaimedJobRow, error: unknown, retryOptions: JobRetryOptions) {
  const now = Date.now();
  const shouldRetry = job.attempt < job.maxAttempts;
  const retryDelayMs = getRetryDelayMs(job.attempt, retryOptions);
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

async function recordJobFailure(job: ClaimedJobRow, error: unknown, retryOptions: JobRetryOptions) {
  const shouldRetry = job.attempt < job.maxAttempts;
  const retryDelayMs = getRetryDelayMs(job.attempt, retryOptions);
  const result = await Result.fromAsync(() => failJob(job, error, retryOptions));

  if (!result.success) {
    logJobQueueError(
      `Job queue failed to record failure for job ${job.id} (${job.name})`,
      result.error,
    );
    logJobQueueError(`Job queue original failure for job ${job.id} (${job.name})`, error);
    return;
  }

  logJobQueueError(
    shouldRetry
      ? `Job queue job ${job.id} (${job.name}) failed attempt ${job.attempt}/${job.maxAttempts}; retry scheduled in ${retryDelayMs}ms`
      : `Job queue job ${job.id} (${job.name}) failed permanently after ${job.attempt}/${job.maxAttempts} attempts`,
    error,
  );
}

function getRetryDelayMs(attempt: number, options: JobRetryOptions) {
  if (options.strategy === "static") return options.delayMs;

  return Math.min(options.baseDelayMs * 2 ** Math.max(attempt - 1, 0), options.maxDelayMs);
}

function resolveJobRetryOptions(options: JobQueueRetryOptions | undefined): JobRetryOptions {
  if (!options) {
    return {
      strategy: "exponential",
      baseDelayMs: defaultRetryBaseDelayMs,
      maxDelayMs: defaultRetryMaxDelayMs,
    };
  }

  if (options.strategy === "static") {
    return {
      strategy: "static",
      delayMs: options.delayMs ?? defaultRetryBaseDelayMs,
    };
  }

  const baseDelayMs = options.baseDelayMs ?? defaultRetryBaseDelayMs;

  return {
    strategy: "exponential",
    baseDelayMs,
    maxDelayMs: Math.max(baseDelayMs, options.maxDelayMs ?? defaultRetryMaxDelayMs),
  };
}

async function releaseStaleJobs(lockTimeoutMs: number) {
  const now = Date.now();
  const staleBefore = now - lockTimeoutMs;

  await db.run(sql`
    update ${jobQueueJobs}
    set
      locked_at = null,
      locked_by = null,
      updated_at = ${now}
    where status = 'pending'
      and locked_at is not null
      and locked_at < ${staleBefore}
  `);

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

function logJobQueueError(message: string, error: unknown) {
  console.error(message, error);
}

export async function cleanupJobQueueJobs(
  options: CleanupJobQueueJobsOptions,
): Promise<CleanupJobQueueJobsResult> {
  const now = Date.now();
  const completedBefore = now - options.completedRetentionMs;
  const failedBefore = now - options.failedRetentionMs;

  const deletedJobs = await db.all<{ id: number }>(sql`
    delete from ${jobQueueJobs}
    where (status = 'completed' and completed_at is not null and completed_at < ${completedBefore})
      or (status = 'failed' and failed_at is not null and failed_at < ${failedBefore})
    returning id
  `);

  return { deleted: deletedJobs.length };
}

function getNextCronRunAt(cron: string, timezone: string | null | undefined, from: Date) {
  const nextRun = new Cron(cron, { paused: true, timezone: timezone ?? undefined }).nextRun(from);

  if (!nextRun) throw new Error(`Cron expression has no next run: ${cron}`);

  return nextRun.getTime();
}
