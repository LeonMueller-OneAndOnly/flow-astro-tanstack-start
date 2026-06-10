import { defineMiddleware } from "astro:middleware";

import { startJobQueueWorker } from "./jobs/worker";

startJobQueueWorker();

export const onRequest = defineMiddleware((_context, next) => next());
