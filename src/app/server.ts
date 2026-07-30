import handler from "@tanstack/react-start/server-entry";

import { Result } from "./lib/result";

/**
 * Custom server entry. Module scope here runs once per server process — in dev
 * and in the built server — which is where process-lifetime work belongs.
 *
 * The build also loads this module: Start's prerender pass boots a preview server
 * over the SSR bundle to fetch the static routes. The job queue must not start
 * there, or a build would open a database connection, register cron timers and
 * run due jobs inside the builder — and never exit.
 *
 * There are two distinct prerender passes and they signal themselves
 * differently, so both are checked:
 *
 * - Nitro's, which this build uses: builds a separate bundle under the
 *   `nitro-prerender` preset and defines `import.meta.prerender`, a compile-time
 *   constant that lets the block below be dropped from that bundle entirely.
 * - Start's own, used when the Nitro plugin is absent: previews the written SSR
 *   bundle and sets `process.env.TSS_PRERENDERING` (see the plugin's
 *   `vite/prerender.js`) just before starting it. A genuine runtime read — it is
 *   not one of the values the plugin statically replaces.
 */
if (!import.meta.prerender && process.env.TSS_PRERENDERING !== "true") {
  void Result.fromAsync(() => import("../integrations/job-queue/worker")).then((result) => {
    if (!result.success) {
      console.error("Failed to load job queue worker", result.error);
      return;
    }

    result.data.startJobQueueWorker();
  });
}

export default handler;
