import type { AstroIntegration } from "astro";

import { instrument } from "./instrument.ts";

/**
 * Runs instrumentation once the dev server is listening.
 *
 * The production counterpart is server/prod.ts. Both boot the server and then
 * call the same loopback endpoint, so dev and production share one startup
 * path — and `astro dev` keeps all of its CLI behaviour, which a custom dev
 * entry built on Astro's experimental JS API would give up.
 */
export function instrumentation(): AstroIntegration {
  return {
    name: "instrumentation",
    hooks: {
      // Not awaited: the hook runs on the dev server's startup path, and
      // instrument() already retries and logs its own failures.
      "astro:server:start": ({ address }) => void instrument(address.address, address.port),
    },
  };
}
