# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-10-29

Brand engine v2: real concept library instead of one crude mark per style.

### Added

- 12 hand-built vector concepts: `needle`, `stitch`, `quill`, `arcs`, `orbit`, `prompt`, `bubble`, `radar`, `hexstack`, `monogram`, `spark`, `layers`.
- Brand kit grows from 4 to 8 files: `icon.svg`, `logo.svg` (light), `logo-dark.svg`, `banner.svg` (dark), `banner-light.svg`, `social-preview.svg`, `brand-sheet.svg`, `assets/README.md`.
- `repo_brand` accepts `concept` and `tagline`; the dry-run lists all concepts, and `brand-sheet.svg` shows them side by side with the current default highlighted.
- CLI: `node bin/tailor.mjs brand . --concept=needle --tagline="From it runs to ship it." --apply`.

### Changed

- Banner/social layouts: cleaner rings instead of clipped watermark marks; repo URL moves to the top-right; social hook can be overridden by `tagline`.
- Every style now maps to a designed concept (`resolver`→arcs, `dsh-tui`→prompt, `dsh-go`→orbit, `bubbletea`→bubble, `sniffnet`→radar, `1panel`→hexstack, `doomemacs`→monogram).
- `assets/README.md` documents the 8-file kit and how to switch concepts.

### Fixed

- `repo_brand` no longer renders a mark that gets clipped at the canvas edge; all decorative geometry stays inside the frame.

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
