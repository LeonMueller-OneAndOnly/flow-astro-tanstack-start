# Omnis Start

This repository is a framework starter, not a real application.

The current pages are intentionally small placeholder examples that show how TanStack Start fits together. They are not product flows, shipped UI, or domain-specific app features.

## What Is Included

- TanStack Start serves every route from `/`.
- Static routes (`/`, `/robots.txt`) are prerendered at build time; the allowlist is `staticPaths` in `src/app/lib/sitemap.ts`.
- The sample app includes lightweight examples for file-based routes, API endpoints, server functions, SSR modes, client state, and dynamic route params.
- The file upload flow is included as reference code only. It shows local Flydrive storage and the shape of a later S3/R2 migration, not a finished product feature.
- AI/chat/MCP demos are intentionally not included in the active sample app.

## Useful Routes

- `/` - Prerendered placeholder landing page.
- `/demo` - Demo hub.
- `/demo/start/server-funcs` - Small server function todo example.
- `/demo/start/api-request` - Client request to a TanStack API route.
- `/demo/start/uploads` - Reference Flydrive file upload example.
- `/demo/start/ssr` - SSR mode examples.
- `/demo/store` - TanStack Store example.
- `/demo/example/guitars` - Dynamic route example with placeholder catalog data.
- `/api/auth/*` - Better Auth API.

Everything under `src/app` belongs to TanStack Start. See the [TanStack Start docs](https://tanstack.com/start/latest) for how that area is structured and used.

## Auth

Better Auth is configured in `src/app/lib/auth/better-auth.ts` with Drizzle, email/password auth, username support, magic links through `sendMail`, and TanStack Start cookie handling. The shared API base path is defined in `src/app/lib/auth/auth-config.ts` and resolves to `/api/auth`.

The auth API route is `src/app/routes/api/auth/$.ts`. It forwards `GET` and `POST` requests under `/api/auth/*` to `auth.handler(request)`. Server-side session reads use `getSession` from `src/app/lib/auth/auth-server.ts`; client auth helpers come from `src/app/lib/auth/auth-client.ts`.

Set `SESSION_SECRET_KEY` in production. It is the shared server-side secret used for signing/encrypting session and auth data. Set `APP_ORIGIN` to the public origin, for example `https://example.com`, so sitemap URLs, CSRF origin validation and Better Auth magic links use the correct host.

## Reference File Uploads

The upload UI route is `src/app/routes/demo/start.uploads.tsx`, served at `/demo/start/uploads`. It posts a `multipart/form-data` body to the TanStack API route at `/demo/api/uploads`.

The upload API route is `src/app/routes/demo/api.uploads.ts`. `GET` lists uploads, `GET ?key=...` downloads one stored file, and `POST` accepts one `file` field. The example rejects missing files, empty files, and files larger than 5 MB.

Local storage is configured in `src/integrations/storage.ts` using [Flydrive](https://flydrive.dev/docs/introduction) with the local filesystem driver. `UPLOADS_DIR` may be set to an absolute path or a path relative to the project root; when unset, it defaults to `data/user-uploads`. `UPLOADS_DIR` is declared in the env schema in `src/app/lib/env.ts`.

The demo stores metadata in the `demo_user_uploads` table via the `demoUserUploads` schema export in `src/db/schema.ts`. Stored object keys use the `demo-uploads/<uuid>/<safe-name>` shape, and downloads verify both the database record and local file exist. For production, attach ownership/authorization and persist stable storage keys, not generated URLs or local paths. To migrate to S3, R2, or another S3-compatible provider, swap the Flydrive driver in `src/integrations/storage.ts` and keep the route code using storage keys.
