import type { APIRoute } from "astro";

import { instrumentationHeader } from "../integrations/instrumentation/instrument";
import { startJobQueueWorkerOnce } from "../integrations/job-queue/start-once";

// Server rendered, so `astro build` never executes it. That is what keeps the
// job queue worker out of the build: a structural guard rather than a runtime
// check on argv, `import.meta.env` or `context.isPrerendered`.
export const prerender = false;

// Only the local boot callers may trigger this. `clientAddress` is the real
// socket address because `security.allowedDomains` is empty in astro.config.ts
// — Astro only trusts `x-forwarded-for` when that list is non-empty, so adding
// entries there would make this check spoofable.
const loopbackAddresses = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

export const POST: APIRoute = async ({ clientAddress, request }) => {
  const isLocalCaller =
    loopbackAddresses.has(clientAddress) && request.headers.has(instrumentationHeader);

  if (!isLocalCaller) return new Response(null, { status: 404 });

  const result = await startJobQueueWorkerOnce();

  if (!result.success) {
    console.error("Instrumentation failed", result.error);
    return new Response(null, { status: 503 });
  }

  return new Response(null, { status: 204 });
};
