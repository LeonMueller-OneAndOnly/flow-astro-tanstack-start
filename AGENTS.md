# Agent rules

Be concise. Challenge weak assumptions. Ask when vague. No friendly filler.

Dont start the dev server, ask the user to do that - if you want to access it and it is not already running.

# Framework

The framework is astro + tanstack start, the latter is mounted under the basepath "/app".
Prefer usign astro for simple server rendered use-cases and onyl resort to tanstack start for client heavy use cases with a lot of interactivity / where typesafe rpc server functions are sensible.

Use oxlint for linting, tsc for typechecking and vitest for testing.
