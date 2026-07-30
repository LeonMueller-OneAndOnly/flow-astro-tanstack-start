import type { APIRoute } from "astro";

import { startJobQueueWorkerOnce } from "../integrations/job-queue/start-once";

// Server rendered, so `astro build` never executes it
export const prerender = false;

export const POST: APIRoute = async ({ clientAddress, request }) => {
  const result = await startJobQueueWorkerOnce();

  if (!result.success) {
    console.error("Instrumentation failed", result.error);
    return new Response(null, { status: 503 });
  }

  return new Response(null, { status: 204 });
};
