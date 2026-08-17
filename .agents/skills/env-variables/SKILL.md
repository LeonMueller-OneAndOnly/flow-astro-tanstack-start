---
name: env-variables
description: Use for environment variables and secret handling in Omnis project workspaces.
---

# env-variables

If `omnisd env` is available, use it for project environment variables.

The application loader uses `omnis env export --local --format json` for local mode and switches to `--test` or `--production` for the other modes.

- Do not create `.env`, `.env.local`, `.env.test`, or secret-bearing env files unless the user explicitly asks for a compatibility escape hatch.
- Inspect effective values with `omnisd env list --local` or `omnisd env list --test`.
- Check required missing values with `omnisd env missing --local` or `omnisd env missing --test`.
- Explain one value with `omnisd env explain KEY --local` or `omnisd env explain KEY --test`.
- Set values with `omnisd env set KEY VALUE --local` or `omnisd env set KEY VALUE --test`; for secrets use `omnisd env set KEY --secret --stdin`.
- Never print secret values. Do not use `--reveal` unless explicitly required.

Run scripts that need project env through the helper:

```bash
omnisd env run --local pnpm tsx scripts/example.ts
omnisd env run --test pnpm test
```

If `omnisd env` is not present, ask before adding env-file based fallback behavior.
