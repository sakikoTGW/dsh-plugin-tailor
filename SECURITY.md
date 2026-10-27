# Security

## What this plugin does

- Reads files inside the repository you point it at (`package.json`, README, assets, `.github/`, tests, git metadata via `git` CLI).
- Writes only when you pass `apply: true`: `README.md`, `README.en.md`, `assets/*.svg`, `assets/README.md`, and `.tailor/baseline.json`.
- Never executes repository scripts, never installs packages, and makes no network requests.

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's private reporting:

<https://github.com/sakikoTGW/dsh-plugin-tailor/security/advisories/new>

Include:

- affected version (`package.json` / `npm view dsh-plugin-tailor version`),
- the repository shape that triggers it (no secrets, no proprietary code),
- the exact tool call / CLI invocation,
- expected vs actual behavior.

You can expect an acknowledgement within 7 days and a fix or mitigation plan within 30 days. Credit is given in the release notes unless you ask otherwise.

## Scope

In scope:

- path traversal outside the audited repository,
- writing files without `apply` / `force`,
- overwriting hand-written READMEs or assets,
- executing untrusted repository content.

Out of scope:

- the quality of generated prose,
- third-party badge services (shields.io) being unavailable,
- issues in DSH itself — report those to the DSH project.
