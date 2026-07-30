// Production entry, run by `pnpm start` in place of dist/server/entry.mjs.
//
// Astro loads src/middleware.ts through a lazy dynamic import, so nothing in
// the bundle runs at boot — the first request is the earliest hook available
// from inside. Owning the entry gives a real boot hook, and @astrojs/node
// supports it directly through ASTRO_NODE_AUTOSTART.
import { instrument } from "../src/integrations/instrumentation/instrument.ts";

// Must be set before entry.mjs is evaluated: @astrojs/node/server.js starts the
// standalone server at module scope unless this is "disabled".
process.env.ASTRO_NODE_AUTOSTART = "disabled";

// Built through a non-literal specifier because dist/ is excluded from
// tsconfig.json, so a literal import would not typecheck before a build.
const entryUrl = new URL("../dist/server/entry.mjs", import.meta.url).href;

const entry = (await import(entryUrl)) as {
  startServer: () => { server: { host: string; port: number } };
};

const { server } = entry.startServer();

await instrument(server.host, server.port);
