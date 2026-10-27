/**
 * Repository facts: the only input the rest of the tailor trusts.
 *
 * Everything here is read-only. Metrics are only reported when a file actually
 * contains them; missing data stays missing instead of being invented.
 */

import { spawnSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

import {
  countImages,
  detectTestCount,
  exists,
  firstParagraph,
  isDir,
  isFile,
  listDir,
  oneLine,
  parseComparisons,
  readJson,
  readText,
  toPosix,
  toRel,
} from './util.mjs'

/** Files whose presence the audit cares about. */
const KNOWN_FILES = {
  readme: ['README.md', 'README.MD', 'README.markdown', 'readme.md'],
  readmeEn: ['README.en.md', 'README-EN.md', 'README.en_US.md'],
  license: ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING'],
  changelog: ['CHANGELOG.md', 'CHANGELOG', 'CHANGES.md', 'HISTORY.md'],
  contributing: ['CONTRIBUTING.md', 'CONTRIBUTING', 'CONTRIBUTE.md'],
  security: ['SECURITY.md', 'SECURITY', '.github/SECURITY.md'],
  codeOfConduct: ['CODE_OF_CONDUCT.md', 'CODE-OF-CONDUCT.md', '.github/CODE_OF_CONDUCT.md'],
  benchmark: ['BENCHMARK.md', 'BENCHMARKS.md', 'docs/BENCHMARK.md', 'PERFORMANCE.md'],
  ablation: ['ABLATION.md', 'docs/ABLATION.md'],
  architecture: ['ARCHITECTURE.md', 'docs/ARCHITECTURE.md'],
  publishing: ['PUBLISHING.md', 'docs/PUBLISHING.md', 'RELEASE.md'],
}

/** Directories that never make it into the structure listing or the scan. */
const IGNORED_DIRS = new Set(['.git', '.tailor', 'node_modules', '.turbo', '.next', 'dist', 'build', 'coverage', '.cache'])

/**
 * @typedef {{
 *   root: string,
 *   name: string,
 *   dirName: string,
 *   packageJson: Record<string, any> | null,
 *   packagePath: string | null,
 *   version: string | null,
 *   description: string,
 *   license: string | null,
 *   repo: string | null,
 *   homepage: string | null,
 *   engines: Record<string, string>,
 *   scripts: Record<string, string>,
 *   bins: string[],
 *   keywords: string[],
 *   private: boolean,
 *   files: Record<string, string | null>,
 *   readme: { path: string | null, text: string, headings: string[], images: number, badges: number, firstParagraph: string },
 *   readmeEn: { path: string | null, text: string },
 *   docs: { dir: string | null, files: string[] },
 *   tests: { dir: string | null, files: string[] },
 *   workflows: string[],
 *   templates: { issue: string[], pr: string | null },
 *   assets: Array<{ path: string, bytes: number, ext: string }>,
 *   topLevel: string[],
 *   git: { present: boolean, clean: boolean | null, remote: string | null, branch: string | null, tags: string[], lastCommit: string | null },
 *   numbers: Array<{ raw: string, from: string, to: string, line: string }>,
 *   testCount: number | null,
 *   hasInstallDocs: boolean,
 *   sections: { why: boolean, features: boolean, limitations: boolean, install: boolean, usage: boolean, comparison: boolean }
 * }} RepoFacts
 */

/**
 * Collect every fact the tailor needs.
 *
 * @param {string} rootInput
 * @returns {RepoFacts}
 */
export function collectFacts(rootInput) {
  const root = resolve(rootInput)
  if (!isDir(root)) throw new Error(`not a directory: ${root}`)

  const packagePath = exists(join(root, 'package.json')) ? join(root, 'package.json') : null
  const packageJson = packagePath ? readJson(packagePath, {}) : null

  /** @type {Record<string, string | null>} */
  const files = {}
  for (const [key, candidates] of Object.entries(KNOWN_FILES)) {
    files[key] = candidates.find((candidate) => isFile(join(root, candidate))) ?? null
  }

  const readmePath = files.readme
  const readmeText = readmePath ? readText(join(root, readmePath)) : ''
  const readmeEnText = files.readmeEn ? readText(join(root, files.readmeEn)) : ''
  const headings = (readmeText.match(/^#{1,3}\s+.+$/gm) ?? []).map((line) => line.replace(/^#+\s+/, '').trim())
  const badges = (readmeText.match(/img\.shields\.io|badge\.fury\.io|badgen\.net/g) ?? []).length

  const docsDir = ['docs', 'doc', 'documentation'].find((candidate) => isDir(join(root, candidate))) ?? null
  const testsDir = ['test', 'tests', '__tests__', 'spec'].find((candidate) => isDir(join(root, candidate))) ?? null

  const workflowsDir = join(root, '.github', 'workflows')
  const workflows = listDir(workflowsDir)
    .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map((entry) => `.github/workflows/${entry.name}`)

  const issueTemplateDir = join(root, '.github', 'ISSUE_TEMPLATE')
  const issue = listDir(issueTemplateDir)
    .filter((entry) => entry.isFile())
    .map((entry) => `.github/ISSUE_TEMPLATE/${entry.name}`)
  const prTemplate = ['.github/PULL_REQUEST_TEMPLATE.md', '.github/pull_request_template.md'].find((candidate) => isFile(join(root, candidate))) ?? null

  const assets = collectAssets(root)
  const topLevel = listDir(root)
    .filter((entry) => !IGNORED_DIRS.has(entry.name))
    .map((entry) => `${entry.name}${entry.isDirectory() ? '/' : ''}`)
    .sort()

  const docsFiles = docsDir
    ? listDir(join(root, docsDir)).filter((entry) => entry.isFile()).map((entry) => `${docsDir}/${entry.name}`).slice(0, 40)
    : []
  const testFiles = testsDir
    ? listDir(join(root, testsDir)).filter((entry) => entry.isFile()).map((entry) => `${testsDir}/${entry.name}`).slice(0, 40)
    : []

  const description = oneLine(packageJson?.description ?? '')
  const engines = packageJson?.engines && typeof packageJson.engines === 'object' ? packageJson.engines : {}
  const scripts = packageJson?.scripts && typeof packageJson.scripts === 'object' ? packageJson.scripts : {}
  const bins = normalizeBins(packageJson?.bin)

  const numbers = [
    ...(files.benchmark ? parseComparisons(readText(join(root, files.benchmark))) : []),
    ...(files.ablation ? parseComparisons(readText(join(root, files.ablation))) : []),
    ...parseComparisons(readmeText),
  ]

  const testCount = detectTestCount([
    readmeText,
    files.benchmark ? readText(join(root, files.benchmark)) : '',
    files.publishing ? readText(join(root, files.publishing)) : '',
  ])

  const lowerReadme = readmeText.toLowerCase()
  const sections = {
    why: /为什么|why|motivation|background|背景/.test(lowerReadme) || headings.some((heading) => /why|为什么/.test(heading.toLowerCase())),
    features: /亮点|功能|features|highlights/.test(lowerReadme),
    limitations: /已知限制|限制|limitations|known issues|非目标/.test(lowerReadme),
    install: /安装|install|quick ?start|快速开始|getting started/.test(lowerReadme),
    usage: /用法|usage|使用|example|示例/.test(lowerReadme),
    comparison: /对比|comparison|alternative|消融|ablation/.test(lowerReadme),
  }

  return {
    root,
    name: oneLine(packageJson?.name ?? basename(root)),
    dirName: basename(root),
    packageJson,
    packagePath: packagePath ? toRel(root, packagePath) : null,
    version: typeof packageJson?.version === 'string' ? packageJson.version : null,
    description,
    license: normalizeLicense(packageJson?.license ?? (files.license ? readText(join(root, files.license)).split(/\r?\n/)[0] : null)),
    repo: normalizeRepo(packageJson?.repository),
    homepage: typeof packageJson?.homepage === 'string' ? packageJson.homepage : null,
    engines,
    scripts,
    bins,
    keywords: Array.isArray(packageJson?.keywords) ? packageJson.keywords.filter((item) => typeof item === 'string') : [],
    private: packageJson?.private === true,
    files,
    readme: {
      path: readmePath,
      text: readmeText,
      generated: /^<!-- generated-by: dsh-plugin-tailor/.test(readmeText),
      headings,
      images: countImages(readmeText),
      badges,
      firstParagraph: firstParagraph(readmeText),
    },
    readmeEn: { path: files.readmeEn, text: readmeEnText, generated: /^<!-- generated-by: dsh-plugin-tailor/.test(readmeEnText) },
    docs: { dir: docsDir, files: docsFiles },
    tests: { dir: testsDir, files: testFiles },
    workflows,
    templates: { issue, pr: prTemplate },
    assets,
    topLevel,
    git: collectGit(root),
    numbers,
    testCount,
    hasInstallDocs: /dsh plugin|npm (?:i|install)|pnpm add|yarn add|npx |go install|cargo install|pip install/.test(readmeText),
    sections,
  }
}

/**
 * @param {string} root
 * @returns {{present: boolean, clean: boolean | null, remote: string | null, branch: string | null, tags: string[], lastCommit: string | null}}
 */
function collectGit(root) {
  const run = (args) => {
    const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 15_000, windowsHide: true })
    if (result.status !== 0) return null
    return String(result.stdout ?? '').trim()
  }

  if (run(['rev-parse', '--is-inside-work-tree']) !== 'true') {
    return { present: false, clean: null, remote: null, branch: null, tags: [], lastCommit: null }
  }
  const status = run(['status', '--porcelain'])
  const tags = (run(['tag', '--list']) ?? '')
    .split(/\r?\n/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .slice(-8)
  return {
    present: true,
    clean: status === '',
    remote: run(['remote', 'get-url', 'origin']),
    branch: run(['branch', '--show-current']),
    tags,
    lastCommit: run(['log', '-1', '--format=%h %ad %s', '--date=short']),
  }
}

/**
 * @param {string} root
 * @returns {Array<{path: string, bytes: number, ext: string}>}
 */
function collectAssets(root) {
  /** @type {Array<{path: string, bytes: number, ext: string}>} */
  const assets = []
  for (const dir of ['assets', 'docs/assets', 'images', 'docs/images', 'static', 'demo']) {
    const full = join(root, dir)
    if (!isDir(full)) continue
    for (const entry of listDir(full)) {
      if (!entry.isFile()) continue
      const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
      if (!['.svg', '.png', '.gif', '.webp', '.jpg', '.jpeg'].includes(ext)) continue
      const rel = toPosix(join(dir, entry.name))
      try {
        assets.push({ path: rel, bytes: statSync(join(root, rel)).size, ext })
      } catch {
        // ignore unreadable files
      }
    }
  }
  return assets
}

/** @param {any} bin */
function normalizeBins(bin) {
  if (typeof bin === 'string') return []
  if (!bin || typeof bin !== 'object') return []
  return Object.keys(bin)
}

/** @param {any} license */
function normalizeLicense(license) {
  if (typeof license === 'string' && license.trim() !== '') return license.trim()
  if (license && typeof license === 'object' && typeof license.type === 'string') return license.type
  return null
}

/** @param {any} repo */
function normalizeRepo(repo) {
  if (typeof repo === 'string' && repo !== '') return normalizeRepoUrl(repo)
  if (repo && typeof repo === 'object' && typeof repo.url === 'string') return normalizeRepoUrl(repo.url)
  return null
}

/** @param {string} url */
function normalizeRepoUrl(url) {
  return url
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '')
}
