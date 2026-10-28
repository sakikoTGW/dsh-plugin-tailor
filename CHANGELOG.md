# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-10-29

Style presets now speak only in styles, not in repository names. Plus real CLI screenshots.

### Changed

- Style ids are now neutral: `evidence`, `terminal`, `mobile`, `playful`, `product`, `platform`, `minimal`.
- `repo_styles` no longer prints a `source` column or a source URL; it shows language, hero, demo and the style essence only.
- The README styles table and `docs/STYLES.md` drop all repository names and links; the guide describes what each style does and when to pick it.
- Short-lived legacy ids from 0.1–0.2 are accepted silently as aliases, so existing commands keep working without surfacing old names.
- README gains a "Tool output" / "工具输出" section with real CLI screenshots (styles, brand dry-run, verify).

### Fixed

- Regenerated demo GIF and screenshots with the new `evidence` style id.

## [0.2.0] - 2026-10-29

Brand engine v2: real concept library instead of one crude mark per style.

### Added

- 12 hand-built vector concepts: `needle`, `stitch`, `quill`, `arcs`, `orbit`, `prompt`, `bubble`, `radar`, `hexstack`, `monogram`, `spark`, `layers`.
- Brand kit grows from 4 to 8 files: `icon.svg`, `logo.svg` (light), `logo-dark.svg`, `banner.svg` (dark), `banner-light.svg`, `social-preview.svg`, `brand-sheet.svg`, `assets/README.md`.
- `repo_brand` accepts `concept` and `tagline`; the dry-run lists all concepts, and `brand-sheet.svg` shows them side by side with the current default highlighted.
- CLI: `node bin/tailor.mjs brand . --concept=needle --tagline="From it runs to ship it." --apply`.

### Changed

- Banner/social layouts: cleaner rings instead of clipped watermark marks; repo URL moves to the top-right; social hook can be overridden by `tagline`.
- Every style now maps to a designed concept (`evidence`→arcs, `terminal`→prompt, `mobile`→orbit, `playful`→bubble, `product`→radar, `platform`→hexstack, `minimal`→monogram).
- `assets/README.md` documents the 8-file kit and how to switch concepts.

### Fixed

- `repo_brand` no longer renders a mark that gets clipped at the canvas edge; all decorative geometry stays inside the frame.

## [0.1.0] - 2026-10-28

First release: audit → plan → brand → readme → verify, with seven style presets.

### Added

- `repo_styles`, `repo_audit`, `repo_plan`, `repo_readme`, `repo_brand`, `repo_verify` — six host-only DSH tools.
- Seven README style presets: `evidence`, `terminal`, `mobile`, `playful`, `product`, `platform`, `minimal`.
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
