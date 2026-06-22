---
name: env-variables
description: Use for environment variables and secret handling in Omnis project workspaces.
---

# env-variables

If `omnisd env` is available, use it for project environment variables.

- Do not create `.env`, `.env.local`, `.env.test`, or secret-bearing env files unless the user explicitly asks for a compatibility escape hatch.
- Inspect effective values with `omnisd env list --purpose local` or `omnisd env list --purpose test`.
- Check required missing values with `omnisd env missing --purpose local|test`.
- Explain one value with `omnisd env explain KEY --purpose local|test`.
- Set values with `omnisd env set KEY VALUE --purpose local|test`; for secrets use `omnisd env set KEY --secret --stdin`.
- Never print secret values. Do not use `--reveal` unless explicitly required.

Run scripts that need project env through the helper:

```bash
omnisd env run --purpose local pnpm tsx scripts/example.ts
omnisd env run --purpose test pnpm test
```

If `omnisd env` is not present, ask before adding env-file based fallback behavior.
