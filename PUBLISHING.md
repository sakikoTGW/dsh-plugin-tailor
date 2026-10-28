# PUBLISHING

How `dsh-plugin-tailor` is versioned, packed, released and listed.

## Requirements

- Node >= 20, npm login as `sakikotgw` (2FA on), `dsh` >= 0.2.0-rc.2 for the smoke test.
- Clean worktree on `main`.

## Release checklist

1. **Tests**: `npm test` → pass 16 / fail 0.
2. **Self-audit**: `node bin/tailor.mjs audit . --style=evidence` → score must not drop below `docs/EVIDENCE.md`.
3. **Package contents**: `npm pack --dry-run` — check that `test/`, `.tmp/`, `.tailor/` are **not** in the tarball and that `docs/`, `assets/`, CLI are.
4. **Version**: `npm version patch|minor|major` (updates `package.json`, commits and tags).
5. **CHANGELOG**: move `[Unreleased]` to the new version with a date.
6. **Publish**: `npm publish --access public` (public, `publishConfig.registry = https://registry.npmjs.org/`).
7. **GitHub Release**: create from the tag, paste the CHANGELOG section, attach nothing (source tarball is enough).
8. **Market catalog**: bump `sakikoTGW/dsh-plugins` `catalog.json` entry to the new version, run `npm run render && npm run verify`, commit/push.
9. **Verify install**: `dsh plugin --profile <profile> add dsh-plugin-tailor@<version>` in a throwaway profile, then `node bin/tailor.mjs audit .` from the installed package.
10. **Smoke from npm**: `npx dsh-plugin-tailor@<version> styles` (or `npm i -g` then `dsh-repo-tailor styles`).

## Versioning rules

- `PATCH`: bug fixes, doc-only changes, style tweaks that keep generated output compatible.
- `MINOR`: new style preset, new section renderer, new rubric checks, new CLI flag.
- `MAJOR`: removing a tool, changing `apply`/`force` semantics, changing the generation marker format.

## Rollback

- `npm unpublish dsh-plugin-tailor@<version>` only if the version is < 72h old and broken; otherwise publish a patch.
- Revert the Git tag/Release and the hub catalog bump together; never leave the catalog pointing at a broken version.

## Post-release checklist

- [ ] `npm view dsh-plugin-tailor version` matches the tag.
- [ ] GitHub Release exists and is not a draft.
- [ ] hub catalog version matches.
- [ ] `docs/EVIDENCE.md` updated with the new test count / score.
