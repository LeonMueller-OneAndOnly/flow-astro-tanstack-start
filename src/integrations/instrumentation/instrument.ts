import { Result } from "../../app/lib/result.ts";

export const instrumentationPath = "/instrumentation";

// A custom header cannot be set by a cross-origin `no-cors` fetch, and any
// request that does set it is preflighted — which the endpoint answers with a
// 404. That keeps a page in a local browser from reaching the endpoint even
// though it would pass the loopback check.
export const instrumentationHeader = "x-instrumentation";

const instrumentationTimeoutMs = 30_000;
const instrumentationRetryDelayMs = 250;

/**
 * Calls the instrumentation endpoint over loopback. Shared by the dev
 * integration and server/prod.ts so both environments start the app the same
 * way: boot the server, then enter the bundle over HTTP.
 *
 * Imported by astro.config.ts (bundled by Astro's config loader) and by
 * server/prod.ts (plain Node, type stripping only), so every import here needs
 * an explicit extension and must avoid Vite-only features.
 */
export async function instrument(host: string, port: number): Promise<void> {
  const url = `http://${toRequestHost(host)}:${port}${instrumentationPath}`;
  const deadline = Date.now() + instrumentationTimeoutMs;

  let lastFailure = "no attempt completed";

  // Retried because callers fire this right after listen(), and because the dev
  // server may still be warming up its module graph.
  while (Date.now() < deadline) {
    const result = await Result.fromAsync(() =>
      fetch(url, { method: "POST", headers: { [instrumentationHeader]: "1" } }),
    );

    if (result.success && result.data.ok) return;

    lastFailure = result.success
      ? `${result.data.status} ${result.data.statusText}`
      : result.error.message;

    await new Promise((resolve) => setTimeout(resolve, instrumentationRetryDelayMs));
  }

  console.error(
    `Instrumentation failed after ${instrumentationTimeoutMs}ms: POST ${url} — ${lastFailure}`,
  );
}

/**
 * Wildcard binds are not connectable addresses, so reach the server on loopback
 * instead. IPv6 literals need brackets to be valid in a URL.
 */
function toRequestHost(host: string): string {
  if (host === "0.0.0.0" || host === "::" || host === "") return "127.0.0.1";

  return host.includes(":") ? `[${host}]` : host;
}
