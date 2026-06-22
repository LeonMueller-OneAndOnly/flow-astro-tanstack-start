---
name: omnis-urls
description: Use for FlowOffice/Omnis workspace, browser, preview, production, and reachable URL questions.
---

# omnis-urls

Use `omnisd urls` for FlowOffice/Omnis URLs. Do not guess localhost ports, framework defaults, public domains, access rules, or production targets.

```bash
omnisd urls
omnisd urls --json
omnisd urls --target workspace
omnisd urls --target production
```

For browser testing, open the URL reported by `omnisd urls`.

Check `access.kind` before describing who can view a URL:

- `public`: anyone can view it.
- `team`: team members must log in.
- `share_link`: use the reported sharing URL.
- `private`: local/private only.
- `unknown`: ask before sharing externally.

If `omnisd urls` is unavailable, ask the user for the URL instead of guessing.
