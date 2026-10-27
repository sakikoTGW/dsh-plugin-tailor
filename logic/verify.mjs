/**
 * Verification: re-audit plus the checks that catch README rot.
 *
 * - relative links and images resolve to real files
 * - local `#anchors` exist in the target document (GitHub slug rules)
 * - the chosen style's required sections are present
 * - no generated TODO markers are left behind
 * - score delta against the baseline saved by `repo_readme --apply`
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { collectFacts } from './facts.mjs'
import { auditFacts } from './rubric.mjs'
import { getStyle } from './styles.mjs'
import { makeSlugger, readText, toPosix } from './util.mjs'

/**
 * @typedef {{ id: string, label: string, ok: boolean, severity: 'error'|'warn', detail: string }} VerifyCheck
 */

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {string} styleId
 * @returns {{ pass: boolean, checks: VerifyCheck[], score: number, grade: string, style: string, todos: number, delta: number | null }}
 */
export function verifyFacts(facts, styleId = 'resolver') {
  const style = getStyle(styleId)
  const audit = auditFacts(facts, styleId)
  /** @type {VerifyCheck[]} */
  const checks = []

  const readmeFiles = [
    facts.readme.path ? { rel: facts.readme.path, text: facts.readme.text } : null,
    facts.readmeEn.path ? { rel: facts.readmeEn.path, text: facts.readmeEn.text } : null,
  ].filter(Boolean)

  // ---- links and images ---------------------------------------------------
  /** @type {Array<{ file: string, target: string, line: string, isImage: boolean }>} */
  const links = []
  for (const file of readmeFiles) {
    for (const line of file.text.split(/\r?\n/)) {
      const matches = line.matchAll(/(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)
      for (const match of matches) {
        links.push({ file: file.rel, target: match[2], line: line.trim().slice(0, 120), isImage: match[1] === '!' })
      }
    }
  }

  let brokenLinks = 0
  let brokenImages = 0
  for (const link of links) {
    const target = link.target.trim()
    if (/^(https?:|mailto:|tel:|data:)/i.test(target)) continue
    if (target.startsWith('#')) continue
    const [pathPart] = target.split('#')
    if (pathPart === '' || pathPart === undefined) continue
    const clean = decodeURIComponentSafe(pathPart)
    if (clean.startsWith('/')) continue
    const absolute = join(facts.root, clean)
    if (!existsSync(absolute)) {
      if (link.isImage) brokenImages += 1
      else brokenLinks += 1
    }
  }
  checks.push({
    id: 'links',
    label: '相对链接可解析',
    ok: brokenLinks === 0,
    severity: brokenLinks === 0 ? 'error' : 'error',
    detail: brokenLinks === 0 ? `${links.length - brokenImages} relative links checked` : `${brokenLinks} broken relative link(s)`,
  })
  checks.push({
    id: 'images',
    label: '图片文件存在',
    ok: brokenImages === 0,
    severity: 'error',
    detail: brokenImages === 0 ? 'all markdown images exist on disk' : `${brokenImages} broken image(s)`,
  })

  // ---- anchors ------------------------------------------------------------
  const anchorMaps = new Map()
  for (const file of readmeFiles) anchorMaps.set(file.rel, headingSlugs(file.text))
  let brokenAnchors = 0
  let anchorCount = 0
  for (const link of links) {
    const hashIndex = link.target.indexOf('#')
    if (hashIndex === -1) continue
    const anchor = decodeURIComponentSafe(link.target.slice(hashIndex + 1))
    if (anchor === '') continue
    anchorCount += 1
    const pathPart = link.target.slice(0, hashIndex)
    const targetFile = pathPart === '' ? link.file : toPosix(pathPart)
    const slugs = anchorMaps.get(targetFile) ?? (existsSync(join(facts.root, targetFile)) ? headingSlugs(readText(join(facts.root, targetFile))) : null)
    if (!slugs || !slugs.has(anchor)) brokenAnchors += 1
  }
  checks.push({
    id: 'anchors',
    label: '本地锚点存在',
    ok: brokenAnchors === 0,
    severity: 'error',
    detail: brokenAnchors === 0 ? `${anchorCount} anchors checked` : `${brokenAnchors} broken anchor(s)`,
  })

  // ---- badges -------------------------------------------------------------
  if (style.badgeSet.length > 0) {
    checks.push({
      id: 'badges',
      label: '徽章数量',
      ok: facts.readme.badges > 0,
      severity: 'warn',
      detail: `${facts.readme.badges} badge image(s) in README`,
    })
  }

  // ---- required sections --------------------------------------------------
  const required = ['install', 'features', 'limitations', 'license'].filter((section) => style.sections.includes(section))
  const missing = []
  for (const section of required) {
    const headings = [style.labels[section]?.zh, style.labels[section]?.en, DEFAULT_H2[section]?.zh, DEFAULT_H2[section]?.en, ...(SECTION_ALIASES[section] ?? [])].filter(Boolean)
    if (headings.length === 0) continue
    if (!headings.some((heading) => facts.readme.text.includes(heading))) missing.push(section)
  }
  checks.push({
    id: 'sections',
    label: '风格要求的章节',
    ok: missing.length === 0,
    severity: 'warn',
    detail: missing.length === 0 ? `required sections present (${required.join(', ')})` : `missing section heading(s): ${missing.join(', ')}`,
  })

  // ---- TODO markers -------------------------------------------------------
  const todoCount = countTodos(facts.readme.text) + countTodos(facts.readmeEn.text)
  checks.push({
    id: 'todos',
    label: '生成草稿已填完',
    ok: todoCount === 0,
    severity: 'warn',
    detail: todoCount === 0 ? 'no TODO markers left' : `${todoCount} TODO marker(s) left in README`,
  })

  // ---- baseline delta -----------------------------------------------------
  const baselinePath = join(facts.root, '.tailor', 'baseline.json')
  let delta = null
  if (existsSync(baselinePath)) {
    try {
      const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
      if (Number.isFinite(baseline.score)) delta = audit.score - baseline.score
    } catch {
      delta = null
    }
  }

  const pass = checks.every((check) => check.ok || check.severity === 'warn')
  return { pass, checks, score: audit.score, grade: audit.grade, style: style.id, todos: todoCount, delta }
}

/** @type {Record<string, { zh: string, en: string }>} */
const DEFAULT_H2 = {
  install: { zh: '安装', en: 'Install' },
  features: { zh: '功能', en: 'Features' },
  limitations: { zh: '已知限制', en: 'Known limitations' },
  license: { zh: '许可证', en: 'License' },
}

/** Headings that also satisfy a required section. */
const SECTION_ALIASES = {
  install: ['安装', '快速开始', 'install', 'quickstart', 'get started'],
  features: ['功能', '特性', '亮点', 'features', 'highlights', 'what you get'],
  limitations: ['已知限制', '限制', 'limitations', 'known issues', 'notes'],
  license: ['许可证', '许可', 'license', 'mit'],
}

/**
 * Count real TODO markers, not prose that mentions them in backticks.
 *
 * @param {string} markdown
 * @returns {number}
 */
function countTodos(markdown) {
  const source = String(markdown ?? '')
  const comments = source.match(/TODO\(tailor\)\s*[:：]/g) ?? []
  const lines = source.split(/\r?\n/).filter((line) => /^\s*(?:[-*]\s+)?TODO\s*[:：]/.test(line))
  return comments.length + lines.length
}

/**
 * Collect heading slugs for one markdown document.
 *
 * @param {string} markdown
 * @returns {Set<string>}
 */
export function headingSlugs(markdown) {
  const slugger = makeSlugger()
  const slugs = new Set()
  for (const line of String(markdown ?? '').split(/\r?\n/)) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*$/)
    if (!match) continue
    slugs.add(slugger(match[1].replace(/<[^>]+>/g, '')))
  }
  return slugs
}

/** @param {string} value */
function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * @param {string} root
 * @param {string} styleId
 * @returns {ReturnType<typeof verifyFacts> & { name: string }}
 */
export function verifyRepo(root, styleId = 'resolver') {
  const facts = collectFacts(root)
  return { ...verifyFacts(facts, styleId), name: facts.name }
}

/**
 * Human-readable verification report.
 *
 * @param {ReturnType<typeof verifyRepo>} result
 * @returns {string}
 */
export function formatVerify(result) {
  const lines = []
  lines.push(`repo_verify · ${result.name} · style=${result.style}`)
  lines.push(`score=${result.score} (${result.grade})${result.delta === null ? '' : ` · delta=${result.delta >= 0 ? '+' : ''}${result.delta}`} · todos=${result.todos}`)
  lines.push(`result: ${result.pass ? 'PASS' : 'FAIL'}`)
  lines.push('')
  for (const check of result.checks) {
    const mark = check.ok ? 'ok  ' : check.severity === 'warn' ? 'warn' : 'FAIL'
    lines.push(`${mark} ${check.label}: ${check.detail}`)
  }
  return lines.join('\n')
}
