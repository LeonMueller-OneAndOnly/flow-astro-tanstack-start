/// <reference types="vite/client" />

// Declared as a global script (no imports/exports) so this merges with Vite's
// built-in ImportMetaEnv rather than shadowing it.

interface ImportMeta {
  /**
   * Set by Nitro in the bundle it builds for the prerender pass (preset
   * `nitro-prerender`) and `false` in the runtime server bundle. Nitro builds the
   * two separately, so this folds to a literal and lets side-effectful server
   * setup be tree-shaken out of the prerender build — see `src/app/server.ts`.
   */
  readonly prerender: boolean;
}

interface ImportMetaEnv {
  /** Injected by `vite.config.ts`. Mirrors the APP_ENV the server was configured with. */
  readonly APP_ENV: "local" | "test" | "production";

  /**
   * Injected by `vite.config.ts`. Public canonical origin, inlined at build time
   * so client-reachable entries can use it without importing the server-only
   * `src/app/lib/env.ts`.
   */
  readonly APP_ORIGIN: string;
}
