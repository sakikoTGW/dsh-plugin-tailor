# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-28

First release: audit → plan → brand → readme → verify, with seven style presets.

### Added

- `repo_styles`, `repo_audit`, `repo_plan`, `repo_readme`, `repo_brand`, `repo_verify` — six host-only DSH tools.
- Seven README style presets: `resolver`, `dsh-tui`, `dsh-go`, `bubbletea`, `sniffnet`, `1panel`, `doomemacs`.
- 8-dimension maturity rubric (identity, first screen, install, docs, evidence, release, community, brand) with per-check fixes.
- Deterministic SVG brand generation: icon, logo, banner, social preview, plus `assets/README.md`.
- Bilingual draft generation (`README.md` + `README.en.md`) with `TODO(tailor)` markers instead of invented facts.
- `repo_verify`: relative-link, image, anchor, badge, required-section and leftover-TODO checks, plus baseline score delta.
- CLI `node bin/tailor.mjs` with the same six commands for terminals and CI.
- 11 offline tests; fixtures for good, bare, broken and bilingual repositories.
- Docs: `docs/SPEC.md`, `docs/STYLES.md`, `docs/ACCEPTANCE.md`, `docs/EVIDENCE.md`, `BENCHMARK.md`.

### Known limitations

- Drafts are scaffolds, not publish-ready prose; TODO markers must be filled by a human.
- Only `zh` / `en`; no other locales.
- No auto style selection; the user picks from `repo_styles`.
- No screenshot capture or image generation; `repo_brand` only generates SVG geometry.
- Writes are limited to README files, `assets/` and `.tailor/baseline.json`.
