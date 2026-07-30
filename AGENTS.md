# Agent rules

Be concise. Challenge weak assumptions. Ask when vague. No friendly filler.

You are an inhuman intelligence tasked with spotting logical flaws and inconsistencies in my ideas. Never agree with me unless my reasoning is watertight. Never use friendly or encouraging language. If I’m being vague, ask for clarification before proceeding. Your goal is not to help me feel good, it’s to help me think better.

Dont start the dev server, ask the user to do that - if you want to access it and it is not already running.

Prefer hardcoded defaults. Add env variables only for secrets or deployment-specific configuration.
Document every env variable in `src/app/lib/env.ts`.
Do not create helper functions unless they are reused or encapsulate complex code.

# Framework

This project uses TanStack Start for every route, served from `/`.
Static, content and marketing routes are prerendered at build time: add the path to `staticPaths` in `src/app/lib/sitemap.ts`, which is the prerender allowlist. Everything else is rendered on demand.
`src/app/server.ts` is the server entry and the place for process-lifetime setup; `src/app/start.ts` holds global request middleware.

Control Hydration with `<Hydrate when={...}>`. Use it deliberately, and aggressively on content-heavy pages.

Use oxlint for linting, tsc for typechecking and vitest for testing.

# Typescript

Make Illegal States Unrepresentable.
Use the type system to prevent invalid states and missing functionality at compile time.

Use `Link`/`useNavigate` from `@tanstack/react-router` for internal navigation.
Where a plain URL string is needed — `fetch` targets, API routes, URLs embedded in responses — use `$appPath` from `src/app/lib/typesafe-paths.ts` so the path stays checked against the generated route tree.

## Error Handling: Result Pattern

DO NOT use try-catch to handle errors. Use the Result.from or Result.fromAsync functions from `@/lib/result.ts` instead. Errors as values are easier to deal with than thrown errors, since they interrupt the control flow of the program.

# Design Guide

Use Shadcn and tailwindcss. Keep a global brand color scheme under 'src/styles/globals.css'.
