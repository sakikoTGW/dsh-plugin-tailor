# CONTRIBUTING

Thanks for taking a look. This repository is small on purpose: one plugin, six tools, no runtime dependencies.

## Before you open an Issue

- Run `npm test` — if it fails, include the failing test name and output.
- Run `node bin/tailor.mjs audit <path>` on the repository you are talking about; paste the score and the relevant gaps.
- For generated-README problems, include the style id (`evidence`, `terminal`, `mobile`, `playful`, `product`, `platform`, `minimal`) and the `repo_readme` diff.

## What is easy to contribute

- **A new style preset**: add an object to `logic/styles.mjs`, reuse existing section ids, add one fixture case in `test/tailor.test.mjs`.
- **A new section renderer**: add the id to `logic/readme.mjs` (`renderBodySection`) and to `DEFAULT_H2`.
- **More rubric checks**: add a check to a dimension in `logic/rubric.mjs`; every check needs a concrete `fix` string.
- **Docs**: `docs/STYLES.md` and `docs/SPEC.md` are the two places that explain intent.

## Rules

1. **No invented facts.** A generated README may contain TODO markers; it must not contain numbers the repository cannot back up.
2. **Writes stay inside the repository root** and require `apply: true`.
3. **New behavior needs a test.** `npm test` must stay green; do not lower the test count in docs without updating BENCHMARK/EVIDENCE.
4. **Keep the tool surface at six** unless there is a real user-facing need; prefer extending an existing tool's arguments.
5. **English and Chinese READMEs stay structurally equal.** If you add a section to one, add it to the other.

## Local loop

```sh
git clone https://github.com/sakikoTGW/dsh-plugin-tailor
cd dsh-plugin-tailor
npm test
node bin/tailor.mjs styles
node bin/tailor.mjs audit . --style=evidence
node bin/tailor.mjs readme . --style=evidence --lang=both
node bin/tailor.mjs verify . --style=evidence
```

No install step: no dependencies. Node >= 20.

## PR

- Keep the PR focused; one concern per PR.
- Include the commands you ran and their output (or a screenshot for CLI output).
- Fill `.github/PULL_REQUEST_TEMPLATE.md`.
- Breaking changes: version bump + CHANGELOG entry + a note in the PR body.

## Response promise

Best effort: first response within 7 days, review within 3 days for small PRs. Security issues go through [SECURITY.md](SECURITY.md), not the public issue tracker.
