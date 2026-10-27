<!-- generated-by: dsh-plugin-tailor style=resolver lang=en (draft scaffold, hand-polished) -->

<p align="center">
  <img src="assets/banner.svg" alt="dsh-plugin-tailor: from 'it runs' to 'ship it'" width="100%">
</p>

<p align="center">
  <a href="README.md">简体中文</a> · <b>English</b>
</p>

<p align="center">
  <img alt="version" src="https://img.shields.io/badge/version-0.1.0-4D6BFE?style=flat-square">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-263146?style=flat-square">
  <img alt="DSH" src="https://img.shields.io/badge/DSH-%3E%3D0.2.0--rc.2%20%3C0.3.0-4D6BFE?style=flat-square">
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white">
  <a href="https://github.com/sakikoTGW/dsh-plugin-tailor/actions/workflows/test.yml"><img alt="test" src="https://img.shields.io/badge/test-11%2F11-2FBF71?style=flat-square"></a>
  <img alt="checks" src="https://img.shields.io/badge/rubric-34%20checks-2FBF71?style=flat-square">
</p>

# dsh-plugin-tailor

> From “it runs” to “ship it”: audit → pick a style → brand assets → bilingual README → pre-release verification.

<p align="center"><sub>MIT · Node &gt;=20 · DSH &gt;=0.2.0-rc.2 &lt;0.3.0 · v0.1.0</sub></p>

<p align="center">
  <img src="assets/demo.gif" alt="Real terminal: repo_audit scores dsh-plugin-resolver 84/100, repo_verify returns PASS" width="760">
</p>
<p align="center"><sub>Real output: <code>tailor audit ../dsh-plugin-resolver</code> and <code>tailor verify …</code> (<a href="demo/demo.tape">VHS tape</a> to re-record)</sub></p>

## Contents

- [Why it exists](#why-it-exists)
- [How it works](#how-it-works)
- [Features](#features)
- [Quickstart](#quickstart)
- [Six tools](#six-tools)
- [Seven styles](#seven-styles)
- [Results and evidence](#results-and-evidence)
- [Layout](#layout)
- [Tests and CI](#tests-and-ci)
- [Known limitations](#known-limitations)
- [Feedback and security](#feedback-and-security)
- [License](#license)

## Why it exists

- **READMEs stop at “it runs”**: install commands hidden in docs, a random screenshot as the demo, no limitations section. The better the project, the more it loses on presentation.
- **Every repository means redoing the same work**: first screen, badges, TOC, assets, release checks — and no reusable style.
- **Nobody checks before release**: broken relative links, anchors, images, leftover TODOs, stale test counts — readers find them first.
- **“Beautiful” has no standard**: instead of copying one template, this plugin distils what good repositories share into selectable style presets plus executable checks.

What it does: **8 dimensions / 34 checks** for maturity, **7 style presets** for the README, **deterministic SVG** for brand assets, and one `repo_verify` before you publish.

## How it works

<p align="center">
  <img src="assets/pipeline.svg" alt="repo_audit → repo_plan → repo_brand → repo_readme → repo_verify" width="100%">
</p>

1. **`repo_audit`** reads `package.json`, README, assets, CI and git state, scores 8 dimensions / 34 checks, and returns gaps sorted by impact.
2. **`repo_plan`** turns gaps into P0/P1/P2 tasks with acceptance criteria and the exact `repo_verify` command; style gaps (no GIF, no screenshots, no English page) become tasks too.
3. **`repo_brand`** generates `icon.svg` / `logo.svg` / `banner.svg` / `social-preview.svg` from the style palette and mark — deterministic, no image model, never overwrites existing files.
4. **`repo_readme`** assembles zh/en drafts from repository facts only; missing facts become `TODO(tailor)` markers; dry-run prints a diff, `apply` writes.
5. **`repo_verify`** re-runs the audit plus relative-link, image, anchor, badge, required-section and leftover-TODO checks, and reports PASS/FAIL with the baseline score delta.

## Features

- **8 dimensions / 34 checks**: identity, first screen, install, docs, evidence, release, community, brand — every gap comes with a concrete fix, not just a score.
- **7 styles + bilingual drafts**: from the resolver evidence flow to doomemacs' pure typography; dry-run diff first, write second.
- **Deterministic brand assets**: icon / logo / banner / social preview as SVG; re-running on an unchanged repository is byte-identical.
- **Write protection**: hand-written READMEs, existing assets and dirty worktrees are refused unless `force` is explicit.
- **Pre-release verification**: relative links, images, anchors, badges, required sections and leftover TODOs in one PASS/FAIL command.
- **CLI and DSH tools share one logic layer**: `bin/tailor.mjs` calls the same code as the six tools, so the terminal reproduces the agent.

## Quickstart

> **Not on npm yet. v0.1.0 ships as a [GitHub Release](https://github.com/sakikoTGW/dsh-plugin-tailor/releases/tag/v0.1.0) with a `.tgz`. Either path works:**

```sh
# from source
git clone https://github.com/sakikoTGW/dsh-plugin-tailor
dsh plugin --profile <profile> add /path/to/dsh-plugin-tailor

# or the release tarball
dsh plugin --profile <profile> add /path/to/dsh-plugin-tailor-0.1.0.tgz
```

Restart the engine once and the six `repo_*` tools are live. After that, edits under `logic/` apply on the next call; edits to `host/register.js` or `index.js` need an engine restart.

The CLI uses the same logic and needs no DSH host:

```sh
node bin/tailor.mjs styles                    # list the 7 styles
node bin/tailor.mjs audit . --style=dsh-tui   # score + gaps
node bin/tailor.mjs plan . --style=dsh-tui    # task list
node bin/tailor.mjs brand . --style=bubbletea --apply
node bin/tailor.mjs readme . --style=resolver --lang=both
node bin/tailor.mjs verify . --style=resolver
```

From DSH:

```text
repo_audit  { path: ".", style: "dsh-tui" }
repo_plan   { path: ".", style: "dsh-tui" }
repo_readme { path: ".", style: "dsh-tui", lang: "both" }
repo_brand  { path: ".", style: "dsh-tui", apply: true }
repo_verify { path: ".", style: "dsh-tui" }
```

## Six tools

| Tool | R/W | Arguments | Returns |
|---|---|---|---|
| `repo_styles` | read | — | id, language, hero, demo, source and essence for the 7 presets |
| `repo_audit` | read | `path`, `style?` | 0-100 score, 8-dimension breakdown, impact-sorted gaps, style gaps |
| `repo_plan` | read | `path`, `style?`, `limit?` | P0/P1/P2 tasks with acceptance criteria and verify command |
| `repo_readme` | dry-run / write | `path`, `style?`, `lang?`, `apply?`, `force?` | diff, TODO list, style gaps |
| `repo_brand` | dry-run / write | `path`, `style?`, `apply?`, `force?` | 4 SVGs + `assets/README.md` |
| `repo_verify` | read | `path`, `style?` | PASS/FAIL, per-check detail, leftover TODOs, score delta |

Writes are dry-run by default; hand-written READMEs and existing assets are refused/skipped unless `force`; a dirty worktree is refused without `force`.

## Seven styles

<p align="center">
  <img src="assets/styles.svg" alt="Seven README style presets: resolver, dsh-tui, dsh-go, bubbletea, sniffnet, 1panel, doomemacs" width="100%">
</p>

| id | Source | Language | Hero | Demo | Best for |
|---|---|---|---|---|---|
| `resolver` | [dsh-plugin-resolver](https://github.com/sakikoTGW/dsh-plugin-resolver) | bilingual | banner | GIF | engineering repos with benchmarks/tests |
| `dsh-tui` | [dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | bilingual | centered logo | GIF | tools with a real logo |
| `dsh-go` | [dsh-go](https://github.com/ccch1mneyyy/dsh-go) | zh-first | banner | screenshots | apps / mobile / community products |
| `bubbletea` | [bubbletea](https://github.com/charmbracelet/bubbletea) | en-first | logo | GIF | TUIs and developer tools |
| `sniffnet` | [sniffnet](https://github.com/GyulyVGC/sniffnet) | en-first | brand banner | screenshots | end-user products |
| `1panel` | [1Panel](https://github.com/1Panel-dev/1Panel) | bilingual | centered logo | GIF | panels and platforms |
| `doomemacs` | [doomemacs](https://github.com/doomemacs/doomemacs) | en-first | none | none | mature tools / frameworks |

How to choose, each preset's section order, and the “12 things good repositories share” live in [docs/STYLES.md](docs/STYLES.md).

## Results and evidence

<p align="center">
  <img src="assets/audit-resolver.png" alt="Real repo_audit output for dsh-plugin-resolver: 84/100, grade B, 6 gaps" width="100%">
</p>

- **Self-audit**: this repository used itself to add docs, brand assets and README — score **37 → 100** (D → A). `dsh-plugin-resolver` audits at **84/100 (B)** and `repo_verify` returns `PASS`.
- **Tests**: 11 offline tests (`npm test`, pass 11 / fail 0); CI runs on Node 20/22/24.
- **Pure logic**: `auditFacts` **0.01 ms**, `renderReadme` **0.03 ms**, `verifyFacts` **0.03 ms**; `collectFacts` is **109–794 ms** because it spawns 4 `git` processes (depends on repository size).
- **CLI end-to-end**: `tailor audit .` median **248 ms**, of which ~200 ms is Node startup.
- **Method**: environment, procedure and output sizes are in [BENCHMARK.md](BENCHMARK.md); before/after and test output are in [docs/EVIDENCE.md](docs/EVIDENCE.md).

## Layout

```text
index.js            host half: tool registration + hot-loaded logic
host/register.js    tool schemas (stable; restart to change)
logic/
  api.js            six tool entry points
  facts.mjs         read-only repository facts
  rubric.mjs        8 dimensions / 34 checks
  plan.mjs          gaps → P0/P1/P2 tasks
  styles.mjs        seven style presets (pure data)
  readme.mjs        bilingual drafts, diff, apply safety
  brand.mjs         deterministic SVG
  verify.mjs        links / anchors / images / sections / TODOs
  util.mjs          diff, slug, path boundary
bin/tailor.mjs      CLI (same logic as the tools)
bench/micro.mjs     pure-logic microbenchmark
docs/               SPEC / STYLES / ACCEPTANCE / EVIDENCE
test/tailor.test.mjs 11 offline tests
```

## Tests and CI

```sh
npm test                # 11 offline tests
node bench/micro.mjs .  # pure-logic microbenchmark
node bin/tailor.mjs verify . --style=resolver
```

- Coverage: style registry, facts, audit ordering, plan, README rendering/write safety, deterministic brand, broken links/images/anchors, host registration, CLI.
- CI: `.github/workflows/test.yml`, Node 20/22/24 matrix, runs `npm test`, a CLI smoke test and `npm pack --dry-run`.

## Known limitations

- **The score measures structure and evidence presence, not prose quality**: 100 does not mean the README is pleasant to read; a human still decides.
- **Drafts must be reviewed**: `TODO(tailor)` markers are for you to fill; `repo_verify` reports leftover TODOs as a warning.
- **zh / en only**, no auto style selection, no auto commit / push / publish.
- **No real screenshots or images**: `repo_brand` only generates SVG geometry; the demo GIF must be recorded from a real run.
- **`collectFacts` dominates runtime** (git subprocesses + directory walk); the judgement logic itself is effectively free.
- **SVG text metrics depend on system fonts** (Inter / Segoe UI / Microsoft YaHei), so widths vary slightly across machines.
- Not on npm yet: install from source; release steps are in [PUBLISHING.md](PUBLISHING.md).

## Feedback and security

- Issues and ideas: <https://github.com/sakikoTGW/dsh-plugin-tailor/issues>
- Security: use **Security → Advisories → Report a vulnerability** (private, see [SECURITY.md](SECURITY.md))
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md) · Release process: [PUBLISHING.md](PUBLISHING.md)

## License

[MIT](LICENSE)
