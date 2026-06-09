# Astro TanStack Start

This repository is a framework starter, not a real application.

The current pages are intentionally small placeholder examples that show how Astro and TanStack Start fit together. They are not product flows, shipped UI, or domain-specific app features.

## What Is Included

- Astro owns the root site entry at `/`.
- TanStack Start is mounted under `/app`.
- The TanStack sample app includes lightweight examples for file-based routes, API endpoints, server functions, SSR modes, client state, and dynamic route params.
- AI/chat/MCP demos are intentionally not included in the active sample app.

## Useful Routes

- `/` - Astro placeholder landing page.
- `/app` - TanStack Start placeholder landing page.
- `/app/demo/start/server-funcs` - Small server function todo example.
- `/app/demo/start/api-request` - Client request to a TanStack API route.
- `/app/demo/start/ssr` - SSR mode examples.
- `/app/demo/store` - TanStack Store example.
- `/app/example/guitars` - Dynamic route example with placeholder catalog data.
- `/app/api/auth/*` - Better Auth API mounted inside the TanStack Start app.

Everything under `src/app` belongs to TanStack Start. See the [TanStack Start docs](https://tanstack.com/start/latest) for how that area is structured and used.

## Auth

Better Auth is configured in `src/app/lib/auth.ts` with Drizzle, username/password auth, and magic links through the existing `sendMail` integration.

Set `BETTER_AUTH_SECRET` in production. Set `BETTER_AUTH_URL` to the public origin, for example `https://example.com`, so magic links use the correct host.
