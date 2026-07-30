import { z } from "zod";

/**
 * Typed, validated server environment. Replaces Astro's `astro:env/server`.
 *
 * `process.env` is populated before this module is imported:
 * - runtime: `src/app/lib/register-config-env.ts`, preloaded via `node --import` in the `start` script
 * - dev/build: `vite.config.ts`, which calls `loadConfigEnv()` at config time
 * - tests: `vitest.config.ts`
 *
 * All three call `loadConfigEnv()` from `./config-env.ts`, which merges `.env`
 * files with `omnisd env export` output. This module only validates the result.
 *
 * Every environment variable the app reads is declared and documented here.
 */

// Defaults are hardcoded rather than env-provided: only secrets and
// deployment-specific values belong in the environment.
const defaultAppEnv = "local";
const defaultHost = "127.0.0.1";
const defaultPort = 4321;
const defaultDatabaseUrl = "file:./data/db.sqlite3";
const defaultUploadsDir = "data/user-uploads";

const envSchema = z.object({
  /** Runtime environment name. Use "production" for deployed production builds. */
  APP_ENV: z.enum(["local", "test", "production"]).default(defaultAppEnv),

  /**
   * Public canonical origin, used for sitemap URLs, CSRF origin validation and
   * Better Auth-generated links. Defaults to `http://HOST:PORT`.
   */
  APP_ORIGIN: z.url().optional(),

  /** Server bind address. Defaults to the IPv4 loopback rather than `localhost`. */
  HOST: z.string().min(1).default(defaultHost),

  /** Server port. Read by Vite in dev and by the Nitro node server in production. */
  PORT: z.coerce.number().int().positive().default(defaultPort),

  /** SQLite/libSQL connection URL. Defaults to a local SQLite file under ./data. */
  DATABASE_URL: z.string().min(1).default(defaultDatabaseUrl),

  /** Secret for signing/encrypting session and auth data. Required in production. */
  SESSION_SECRET_KEY: z.string().min(1).optional(),

  /**
   * Upload storage root for the Flydrive local filesystem driver. Absolute, or
   * relative to the project root.
   */
  UPLOADS_DIR: z.string().min(1).default(defaultUploadsDir),

  /** SMTP host used when production mail is sent directly. */
  SMTP_HOST: z.string().min(1).optional(),

  /** SMTP username, also used as the outgoing sender address. */
  SMTP_USERNAME: z.string().min(1).optional(),

  /** SMTP password for the configured username. */
  SMTP_PASSWORD: z.string().min(1).optional(),

  /** Display name used in outgoing mail From headers. */
  SMTP_FROM_NAME: z.string().min(1).optional(),

  /**
   * Local/test mail preview behavior. "auto" stores previews through omnisd when
   * available and falls back to browser preview.
   */
  MAIL_PREVIEW_MODE: z.enum(["auto", "omnis", "browser", "disabled"]).default("auto"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const APP_ENV = parsed.data.APP_ENV;
export const HOST = parsed.data.HOST;
export const PORT = parsed.data.PORT;
export const APP_ORIGIN = parsed.data.APP_ORIGIN ?? `http://${HOST}:${PORT}`;
export const DATABASE_URL = parsed.data.DATABASE_URL;
export const UPLOADS_DIR = parsed.data.UPLOADS_DIR;
export const SMTP_HOST = parsed.data.SMTP_HOST;
export const SMTP_USERNAME = parsed.data.SMTP_USERNAME;
export const SMTP_PASSWORD = parsed.data.SMTP_PASSWORD;
export const SMTP_FROM_NAME = parsed.data.SMTP_FROM_NAME;
export const MAIL_PREVIEW_MODE = parsed.data.MAIL_PREVIEW_MODE;

// Astro validated secrets at request time, so a production build never needed
// them present. Start's prerender pass executes app code inside the build, so the
// same rule is kept by skipping this check while prerendering.
const isPrerendering = process.env.TSS_PRERENDERING === "true";

if (!isPrerendering && APP_ENV === "production" && !parsed.data.SESSION_SECRET_KEY) {
  throw new Error("SESSION_SECRET_KEY is required when APP_ENV is \"production\"");
}

export const SESSION_SECRET_KEY = parsed.data.SESSION_SECRET_KEY;

// Hyphenated dev-only mailer flags (`open-preview-for-all-mails_DEV_ONLY`) are
// read with bracket access straight from `process.env` in the mailer. They stay
// undeclared here because they cannot be schema fields and only force local mail
// preview — production ignores them.
