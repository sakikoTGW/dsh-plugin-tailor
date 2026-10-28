# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.4.0] - 2026-10-29

Styles are now structured data, and users can author their own.

### Added

- `styles/`: seven built-in style presets as JSON, plus `schema.json` and a field reference.
- `logic/style-schema.mjs`: allowed sections/badges/concepts, validation and merge rules.
- Custom styles from `<repo>/.tailor/styles/*.json` and `~/.tailor/styles/*.json` (or `TAILOR_STYLES_DIR`), with `extends` inheritance and per-key merge.
- `style:init` CLI command to scaffold a custom style; `repo_styles` accepts `path`, shows origin (builtin/global/repo) and reports invalid style files.
- All tools accept custom style ids; invalid custom files are skipped and reported, built-ins stay validated.
- Four new tests: built-in JSON validation, custom style flow, invalid-style skip, scaffold + CLI.

### Changed

- `logic/styles.mjs` is now a loader (discovery, extends merge, validation) instead of hard-coded preset data.
- `repo_styles` output lists origins and custom style directories; docs (README, STYLES, SPEC, styles/README) updated.
- Package `files` includes `styles/`; `exports` exposes `./styles/*`.

## [0.3.2] - 2026-10-29

Visual density pass: product screenshots and motion instead of text-only sections.

### Added

- `assets/before-after.svg`: manual README vs tailor-generated, side by side.
- `assets/concepts.gif`: the 12 vector concepts animated, one per frame.
- Brand gallery: light/dark logo plus icon and the light banner in the Brand assets section.
- `assets/actions.png`: real GitHub Actions run (Node 20/22/24, 19 s, all green).
- `assets/tools-help.png`: real `tailor --help` output in Quickstart.

### Changed

- Screenshots are placed earlier and larger; CI proof is rendered instead of described.

## [0.3.1] - 2026-10-29

README and repo presentation pass, based on patterns from mature READMEs.

### Added

- Hero CTA row (install / styles / tools / roadmap) and a numbers strip (`assets/stats.svg`).
- `assets/features.svg`: six capability cards for the Features section.
- New sections: Security boundaries, FAQ, Roadmap, Ecosystem and listings.
- Footer with "part of dsh-plugins" and a star CTA; GitHub release badge.
- Fixed commit authorship: all commits are now authored by `sakikoTGW` (history rewritten).

### Changed

- Quickstart release links point at v0.3.1.

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
