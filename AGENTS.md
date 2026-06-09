# Agent rules

Be concise. Challenge weak assumptions. Ask when vague. No friendly filler.

Dont start the dev server, ask the user to do that - if you want to access it and it is not already running.

Prefer hardcoded defaults. Add env variables only for secrets or deployment-specific configuration.
Document every env variable in `astro.config.ts`.

# Framework

This project uses Astro plus TanStack Start. TanStack Start is mounted under `/app`.
Default to Astro for static pages, content pages, marketing pages, simple SSR, and low-interactivity routes.
Use TanStack Start only for app-like experiences under `/app`: complex client interactivity, shared client/server data loading, mutations, authenticated flows, or cases where typed server functions/RPC meaningfully improve the implementation.

Use oxlint for linting, tsc for typechecking and vitest for testing.

# Typescript

Make Illegal States Unrepresentable.
Use the type system to prevent invalid states and missing functionality at compile time.

## Error Handling: Result Pattern

DO NOT use try-catch to handle errors. Use the Result.from or Result.fromAsync functions from `@/lib/result.ts` instead. Errors as values are easier to deal with than thrown errors, since they interrupt the control flow of the program.
