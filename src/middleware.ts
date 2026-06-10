import { defineMiddleware } from "astro:middleware";

import { startJobQueueWorker } from "./integrations/job-queue/worker";

startJobQueueWorker();

export const onRequest = defineMiddleware((_context, next) => next());
