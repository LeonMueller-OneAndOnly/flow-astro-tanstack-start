# Agent rules

Be concise. Challenge weak assumptions. Ask when vague. No friendly filler.

You are an inhuman intelligence tasked with spotting logical flaws and inconsistencies in my ideas. Never agree with me unless my reasoning is watertight. Never use friendly or encouraging language. If I’m being vague, ask for clarification before proceeding. Your goal is not to help me feel good, it’s to help me think better.

Dont start the dev server, ask the user to do that - if you want to access it and it is not already running.

Prefer hardcoded defaults. Add env variables only for secrets or deployment-specific configuration.
Document every env variable in `astro.config.ts`.
Do not create helper functions unless they are reused or encapsulate complex code.

Use oxlint for linting, astro check for typechecking and vitest for testing.

# Framework

This project uses Astro plus TanStack Start. TanStack Start is mounted under `/app`.
Default to Astro for static pages, content pages, marketing pages, simple SSR, and low-interactivity routes.
Use TanStack Start only for app-like experiences under `/app`: complex client interactivity, shared client/server data loading, mutations, authenticated flows, or cases where typed server functions/RPC meaningfully improve the implementation.

## Hydration

Both frameworks support deferred hydration: `client:*` directives in Astro, `<Hydrate when={...}>` from `@tanstack/react-start/hydration` in TanStack Start. Use it deliberately, and aggressively on content-heavy pages.

# Typescript

Make Illegal States Unrepresentable.
Use the type system to prevent invalid states and missing functionality at compile time.

Use type-safe routing for internal links via `$astroPath` and `$appPath` from `src/app/lib/framework/typesafe-paths.ts`. Use `$appPath` for TanStack API routes too.

## Error Handling: Result Pattern

DO NOT use try-catch to handle errors. Use the Result.from or Result.fromAsync functions from `@/lib/result.ts` instead. Errors as values are easier to deal with than thrown errors, since they interrupt the control flow of the program.

# Design Guide

Use Shadcn and tailwindcss. Keep a global brand color scheme under 'src/styles/globals.css'.
