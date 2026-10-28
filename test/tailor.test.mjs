/**
 * Offline tests: fixtures on disk, no network, no host.
 *
 * Run with `npm test` (node --test).
 */

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { applyBrand, buildBrand } from '../logic/brand.mjs'
import { collectFacts } from '../logic/facts.mjs'
import { planWork } from '../logic/plan.mjs'
import { applyReadme, previewReadme, renderReadme, renderBoth } from '../logic/readme.mjs'
import { auditFacts } from '../logic/rubric.mjs'
import { getStyle, STYLES, styleIds } from '../logic/styles.mjs'
import { verifyRepo } from '../logic/verify.mjs'
import { registerTools } from '../host/register.js'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

/**
 * @param {'good'|'bare'|'broken'|'bilingual'} kind
 * @returns {string}
 */
function makeRepo(kind) {
  const dir = mkdtempSync(join(tmpdir(), `tailor-${kind}-`))
  /** @type {Record<string, any>} */
  const manifest = {
    name: kind === 'good' ? 'fixture-good' : `fixture-${kind}`,
    version: '1.2.3',
  }
  if (kind === 'good') {
    manifest.description = 'A fixture repository used to test the dsh-plugin-tailor audit, plan, readme and brand pipeline.'
    manifest.license = 'MIT'
    manifest.repository = { type: 'git', url: 'git+https://github.com/example/fixture.git' }
    manifest.engines = { node: '>=20', dsh: '>=0.2.0-rc.2 <0.3.0' }
    manifest.scripts = { test: 'node test/selftest.mjs' }
    manifest.bin = { fixture: './bin.js' }
    manifest.dsh = { bundle: { patch: './cordis.patch.yml' } }
    manifest.files = ['index.js', 'README.md']
    manifest.keywords = ['fixture', 'audit', 'readme']
  }
  writeJson(join(dir, 'package.json'), manifest)

  if (kind === 'good') {
    write(join(dir, 'README.md'), `# fixture-good

<p align="center">
  <img src="assets/banner.svg" alt="fixture-good" width="100%">
</p>
<p align="center">
  <img alt="npm" src="https://img.shields.io/npm/v/fixture-good?style=flat-square">
  <img alt="MIT" src="https://img.shields.io/badge/license-MIT-263146?style=flat-square">
</p>

A small fixture repository used to test the audit, plan and README pipeline.

<p align="center">
  <img src="assets/demo.gif" alt="demo" width="760">
</p>

## 为什么需要它

Because every README pipeline needs a repository that looks finished.

## 安装

\`\`\`sh
dsh plugin --profile web add fixture-good
\`\`\`

## 功能

- audit
- plan
- readme

## 用法

\`\`\`sh
fixture audit .
\`\`\`

## 已知限制

- This fixture is not a real package.

## 证据

真实数据：45 → 6，20 分钟 → 3 分钟。共 12 项测试。

## 许可证

MIT
`)
    write(join(dir, 'README.en.md'), '# fixture-good\n\nEnglish page for the fixture.\n\n## Install\n\n```sh\ndsh plugin --profile web add fixture-good\n```\n')
    write(join(dir, 'LICENSE'), 'MIT License\n\nCopyright (c) fixture\n')
    write(join(dir, 'CHANGELOG.md'), '# Changelog\n\n## [1.2.3]\n\n- first release\n')
    write(join(dir, 'CONTRIBUTING.md'), '# Contributing\n\nOpen an issue first.\n')
    write(join(dir, 'SECURITY.md'), '# Security\n\nReport privately.\n')
    write(join(dir, 'BENCHMARK.md'), '# Benchmark\n\n| metric | before | after |\n|---|---|---|\n| calls | 45 → 6 | |\n| time | 20 → 3 | |\n\nAll numbers are measured on fixture data.\n')
    write(join(dir, 'docs', 'GUIDE.md'), '# Guide\n\nLong form documentation.\n')
    write(join(dir, 'test', 'selftest.mjs'), 'console.log("ok")\n')
    write(join(dir, '.github', 'workflows', 'test.yml'), 'name: test\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n')
    write(join(dir, '.github', 'ISSUE_TEMPLATE', 'bug.md'), '---\nname: bug\n---\n')
    write(join(dir, '.github', 'PULL_REQUEST_TEMPLATE.md'), '## What changed\n')
    write(join(dir, 'assets', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>\n')
    write(join(dir, 'assets', 'banner.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 400"></svg>\n')
    writeBinary(join(dir, 'assets', 'demo.gif'), Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'))
  }

  if (kind === 'bare') {
    write(join(dir, 'README.md'), '# fixture-bare\n\nhello\n')
  }

  if (kind === 'broken') {
    write(join(dir, 'README.md'), `# fixture-broken

[missing doc](./missing.md)

![missing image](./nope.png)

[bad anchor](#does-not-exist)

## 许可证

MIT
`)
  }

  if (kind === 'bilingual') {
    write(join(dir, 'README.md'), '# fixture-bilingual\n\n中文页。\n')
    write(join(dir, 'README.en.md'), '# fixture-bilingual\n\nEnglish page.\n')
  }

  return dir
}

/** @param {string} path @param {string} content */
function write(path, content) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, content, 'utf8')
}

/** @param {string} path @param {any} value */
function writeJson(path, value) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

/** @param {string} path @param {Buffer} buffer */
function writeBinary(path, buffer) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, buffer)
}

test('styles: seven presets with sections, palette and concept', () => {
  assert.equal(STYLES.length, 7)
  assert.deepEqual(styleIds().sort(), ['evidence', 'minimal', 'mobile', 'platform', 'playful', 'product', 'terminal'])
  for (const style of STYLES) {
    assert.ok(style.sections.includes('install'), `${style.id} must include install`)
    assert.ok(style.palette.brand.startsWith('#'), `${style.id} palette`)
    assert.ok(style.labels && typeof style.essence.zh === 'string')
    assert.ok(style.sections.length > 5)
    assert.equal(getStyle('dsh-tui').id, 'terminal')
  }
  assert.throws(() => getStyle('nope'), /unknown style/)
})

test('facts: detects package, readme, tests, assets and numbers', () => {
  const dir = makeRepo('good')
  try {
    const facts = collectFacts(dir)
    assert.equal(facts.name, 'fixture-good')
    assert.equal(facts.version, '1.2.3')
    assert.equal(facts.license, 'MIT')
    assert.ok(facts.readme.path)
    assert.ok(facts.readme.images >= 2)
    assert.ok(facts.readme.badges >= 2)
    assert.equal(facts.workflows.length, 1)
    assert.equal(facts.docs.dir, 'docs')
    assert.equal(facts.tests.dir, 'test')
    assert.ok(facts.numbers.length >= 2)
    assert.ok(facts.testCount >= 3)
    assert.deepEqual(facts.bins, ['fixture'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('audit: good fixture scores higher than a bare one', () => {
  const good = makeRepo('good')
  const bare = makeRepo('bare')
  try {
    const goodAudit = auditFacts(collectFacts(good), 'evidence')
    const bareAudit = auditFacts(collectFacts(bare), 'evidence')
    assert.ok(goodAudit.score > bareAudit.score, `${goodAudit.score} > ${bareAudit.score}`)
    assert.ok(goodAudit.score >= 70, `good score ${goodAudit.score}`)
    assert.ok(bareAudit.gaps.some((gap) => gap.check === 'license'))
    assert.ok(bareAudit.gaps.some((gap) => gap.dimension === 'evidence'))
    assert.ok(goodAudit.dimensions.length === 8)
  } finally {
    rmSync(good, { recursive: true, force: true })
    rmSync(bare, { recursive: true, force: true })
  }
})

test('plan: gaps become ordered tasks with acceptance and verify', () => {
  const dir = makeRepo('bare')
  try {
    const plan = planWork(collectFacts(dir), 'terminal')
    assert.ok(plan.tasks.length >= 5)
    assert.ok(plan.tasks.some((task) => task.priority === 'P0'))
    assert.ok(plan.tasks.some((task) => task.id === 'brand-assets'))
    for (const task of plan.tasks) {
      assert.ok(task.acceptance.length > 0)
      assert.match(task.verify, /tailor\.mjs verify/)
    }
    const priorities = plan.tasks.map((task) => task.priority)
    const firstP2 = priorities.indexOf('P2')
    const lastP1 = priorities.lastIndexOf('P1')
    if (firstP2 !== -1 && lastP1 !== -1) assert.ok(firstP2 > lastP1, 'P1 tasks must come before P2')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('readme: renders a style-specific bilingual draft without invented numbers', () => {
  const good = makeRepo('good')
  const bare = makeRepo('bare')
  try {
    const goodFacts = collectFacts(good)
    const bareFacts = collectFacts(bare)
    const tui = renderBoth(goodFacts, 'terminal')
    assert.match(tui.zh.text, /generated-by: dsh-plugin-tailor/)
    assert.match(tui.zh.text, /dsh plugin --profile/)
    assert.match(tui.zh.text, /## 亮点/)
    assert.match(tui.en.text, /## Highlights/)
    assert.ok(tui.zh.text.includes('README.en.md'))

    const doom = renderReadme(goodFacts, getStyle('minimal'), 'en')
    assert.doesNotMatch(doom.text, /## Install\n\n```sh\nnpm install -g/) // hero-less style still installs, but no banner
    assert.ok(doom.text.includes('<h1 align="center">'))

    const bareDraft = renderReadme(bareFacts, getStyle('evidence'), 'zh')
    assert.ok(bareDraft.todos.length > 0)
    assert.doesNotMatch(bareDraft.text, /45 → 6/)
    assert.doesNotMatch(bareDraft.text, /undefined|\[object Object\]/)

    for (const style of STYLES) {
      for (const lang of ['zh', 'en']) {
        const draft = renderReadme(goodFacts, style, lang)
        assert.match(draft.text, /generated-by: dsh-plugin-tailor/, `${style.id}/${lang} marker`)
        assert.doesNotMatch(draft.text, /undefined|\[object Object\]/, `${style.id}/${lang} placeholders`)
        assert.ok(draft.headings.length >= 3, `${style.id}/${lang} headings`)
      }
    }
  } finally {
    rmSync(good, { recursive: true, force: true })
    rmSync(bare, { recursive: true, force: true })
  }
})

test('readme apply: refuses hand-written files, then writes and is idempotent', () => {
  const dir = makeRepo('bare')
  try {
    assert.throws(() => applyReadme(dir, 'evidence', 'zh'), /not generated/)
    const first = applyReadme(dir, 'evidence', 'zh', { force: true })
    assert.deepEqual(first.written, ['README.md'])
    const text = readFileSync(join(dir, 'README.md'), 'utf8')
    assert.match(text, /generated-by: dsh-plugin-tailor/)
    const second = applyReadme(dir, 'evidence', 'zh')
    assert.deepEqual(second.written, [])
    assert.deepEqual(second.skipped, ['README.md'])
    assert.ok(previewReadme(dir, 'evidence', 'zh').existing)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('brand: 12 concepts, deterministic SVG kit, apply skips unless forced', () => {
  const dir = makeRepo('bare')
  try {
    const facts = collectFacts(dir)
    const style = getStyle('product')
    const files = buildBrand(facts, style)
    assert.deepEqual(Object.keys(files).sort(), [
      'assets/README.md',
      'assets/banner-light.svg',
      'assets/banner.svg',
      'assets/brand-sheet.svg',
      'assets/icon.svg',
      'assets/logo-dark.svg',
      'assets/logo.svg',
      'assets/social-preview.svg',
    ])
    for (const [path, content] of Object.entries(files)) {
      if (path.endsWith('.svg')) {
        assert.match(content, /<svg /)
        assert.match(content, /viewBox="0 0 \d+ \d+"/)
      }
    }
    assert.equal(buildBrand(facts, style)['assets/icon.svg'], files['assets/icon.svg'])

    const needle = buildBrand(facts, style, 'needle')
    assert.notEqual(needle['assets/icon.svg'], files['assets/icon.svg'])
    assert.equal(buildBrand(facts, style, 'needle')['assets/icon.svg'], needle['assets/icon.svg'])
    assert.throws(() => buildBrand(facts, style, 'nope'), /unknown concept/)

    const first = applyBrand(dir, 'product', { concept: 'radar' })
    assert.equal(first.written.length, 8)
    assert.equal(first.concept, 'radar')
    const second = applyBrand(dir, 'product', { concept: 'radar' })
    assert.equal(second.written.length, 0)
    assert.equal(second.skipped.length, 8)
    const forced = applyBrand(dir, 'product', { force: true, concept: 'spark' })
    assert.equal(forced.written.length, 8)
    assert.equal(forced.concept, 'spark')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('verify: catches broken links, images and anchors', () => {
  const broken = makeRepo('broken')
  const good = makeRepo('good')
  try {
    const brokenResult = verifyRepo(broken, 'evidence')
    assert.equal(brokenResult.pass, false)
    assert.ok(brokenResult.checks.some((check) => check.id === 'links' && !check.ok))
    assert.ok(brokenResult.checks.some((check) => check.id === 'images' && !check.ok))
    assert.ok(brokenResult.checks.some((check) => check.id === 'anchors' && !check.ok))

    const goodResult = verifyRepo(good, 'evidence')
    assert.equal(goodResult.pass, true, JSON.stringify(goodResult.checks.filter((check) => !check.ok)))
    assert.equal(goodResult.todos, 0)
  } finally {
    rmSync(broken, { recursive: true, force: true })
    rmSync(good, { recursive: true, force: true })
  }
})

test('verify: generated draft leaves TODO warnings and a baseline delta', () => {
  const dir = makeRepo('bare')
  try {
    applyReadme(dir, 'evidence', 'zh', { force: true })
    const result = verifyRepo(dir, 'evidence')
    assert.ok(result.todos > 0)
    assert.ok(result.checks.some((check) => check.id === 'todos' && !check.ok))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('host: registers six tools and runs repo_audit', async () => {
  const dir = makeRepo('good')
  try {
    /** @type {any[]} */
    const defs = []
    const ctx = {
      tools: { register: (definition) => { defs.push(definition); return () => {} } },
      get: () => null,
      effect: (fn) => fn(),
    }
    const disposers = registerTools(ctx, { defaultStyle: 'evidence' })
    assert.equal(disposers.length, 6)
    assert.deepEqual(defs.map((definition) => definition.name).sort(), ['repo_audit', 'repo_brand', 'repo_plan', 'repo_readme', 'repo_styles', 'repo_verify'])
    const styles = await defs.find((definition) => definition.name === 'repo_styles').execute({})
    assert.match(styles.text, /7 presets/)
    const audit = await defs.find((definition) => definition.name === 'repo_audit').execute({ path: dir })
    assert.match(audit.text, /repo_audit · fixture-good/)
    assert.doesNotMatch(audit.text, /failed/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('cli: styles command prints all presets', () => {
  const result = spawnSync(process.execPath, [join(ROOT, 'bin', 'tailor.mjs'), 'styles'], { encoding: 'utf8', timeout: 30_000 })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /7 presets/)
  assert.match(result.stdout, /minimal/)
  assert.match(result.stdout, /product/)
})
