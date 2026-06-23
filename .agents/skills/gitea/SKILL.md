---
name: gitea
description: Use when working with Gitea pull requests, issues, repositories, or the tea CLI, especially non-interactive pull request workflows.
---

# Gitea

Use Gitea's official CLI, `tea`, for repository and pull request work.

## First Checks

- Check installation with `tea --version`.
- Check authentication with `tea whoami`.
- If outside the target git repository, pass `--repo owner/repo` and usually `--login login-name`.
- Prefer `--output simple` for human-readable command output and `--output json` for parsing.
- Provide all required flags up front. Do not run prompt-driven commands like bare `tea pr create`.

## Authentication

Set up login once using an application token from Gitea user settings:

```bash
tea login add --name work --url https://gitea.example.com --token "$GITEA_TOKEN"
tea login default work
```

Do not print tokens. If login is missing and no token is available, ask the user to configure `tea`.

## Pull Requests

```bash
tea pr --repo owner/repo --state open --output simple
tea pr 123 --repo owner/repo --output json
tea pr create --repo owner/repo --title "Title" --description "Body" --base main --head feature-branch
tea pr checkout 123 --repo owner/repo --branch
tea pr approve 123 --repo owner/repo --output simple
tea pr reject 123 --repo owner/repo --output simple
tea pr merge 123 --repo owner/repo --style squash --title "Merge title" --message "Merge message" --output simple
tea pr close 123 --repo owner/repo --output simple
tea pr reopen 123 --repo owner/repo --output simple
```

Before creating a PR, ensure the source branch is pushed; `tea` assumes local git state is already published.

## Reviews And Comments

Use direct review commands where possible. Avoid `tea pr review` because it is interactive.

```bash
tea comment 123 --repo owner/repo --output simple "Review note or status update"
tea pr approve 123 --repo owner/repo --output simple
tea pr reject 123 --repo owner/repo --output simple
```

## Safety Rules

- Do not use interactive OAuth or prompt-based login from an agent unless the user explicitly asks.
- Do not rely on repository auto-detection when ambiguity matters; pass `--repo`.
- Use `tea pr create --help` or `tea pr merge --help` to verify flags for the installed version before unusual workflows.
- For destructive actions, confirm user intent first unless the user already explicitly requested the action.

Reference: Gitea documents `tea` as the official CLI; the `tea` man page documents `pulls/pull/pr`, `--repo`, `--login`, `--output`, PR create, checkout, approve, reject, merge, close, and reopen commands.
