/**
 * Small, dependency-free helpers shared by every logic module.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

/**
 * Read a JSON file without throwing on malformed input.
 *
 * @param {string} path
 * @param {any} fallback
 * @returns {any}
 */
export function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

/**
 * Read a UTF-8 text file without throwing on a missing file.
 *
 * @param {string} path
 * @param {string} fallback
 * @returns {string}
 */
export function readText(path, fallback = '') {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return fallback
  }
}

/** @param {string} path */
export function exists(path) {
  return existsSync(path)
}

/** @param {string} path */
export function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

/** @param {string} path */
export function isDir(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

/** @param {string} dir */
export function listDir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

/** @param {string} root @param {string} path */
export function toRel(root, path) {
  return relative(root, path).split(sep).join('/')
}

/** @param {string} path */
export function toPosix(path) {
  return path.split(sep).join('/')
}

/**
 * Refuse paths that escape the repository root.
 *
 * @param {string} root
 * @param {string} candidate
 * @returns {string}
 */
export function resolveInside(root, candidate) {
  const base = resolve(root)
  const target = resolve(base, candidate)
  if (target !== base && !target.startsWith(base + sep)) {
    throw new Error(`path escapes the repository root: ${candidate}`)
  }
  return target
}

/** @param {string} text @param {number} max */
export function truncate(text, max = 200) {
  const value = String(text ?? '')
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1))}…`
}

/** @param {string} value */
export function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * GitHub-flavoured heading slug.
 *
 * @param {string} text
 * @returns {string}
 */
export function slugifyHeading(text) {
  return oneLine(text)
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

/**
 * A slugger that mirrors GitHub's duplicate suffixing.
 *
 * @returns {(heading: string) => string}
 */
export function makeSlugger() {
  /** @type {Map<string, number>} */
  const seen = new Map()
  return (heading) => {
    const base = slugifyHeading(heading)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}

/**
 * Extract the body of the first `##` section whose heading matches an alias.
 *
 * @param {string} markdown
 * @param {string[]} aliases
 * @returns {string | null}
 */
export function extractSection(markdown, aliases) {
  const lines = String(markdown ?? '').split(/\r?\n/)
  const wanted = aliases.map((alias) => alias.toLowerCase())
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^##\s+(.+?)\s*$/)
    if (!heading) continue
    const clean = heading[1].replace(/^[^\p{L}\p{N}]+/u, '').trim().toLowerCase()
    if (!wanted.some((alias) => clean.includes(alias))) continue
    const body = []
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (/^##\s+/.test(lines[cursor])) break
      body.push(lines[cursor])
    }
    const text = body.join('\n').trim()
    return text === '' ? null : text
  }
  return null
}

/**
 * First meaningful paragraph of a README: skips HTML, images, badges, lists.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function firstParagraph(markdown) {
  const blocks = String(markdown ?? '').split(/\r?\n\r?\n/)
  for (const raw of blocks) {
    const block = raw.trim()
    if (block === '') continue
    if (/^</.test(block)) continue
    if (/^(!\[|\[!\[|\[!\[|>|#|\||```|-{2,})/.test(block)) continue
    if (/^<p\b/i.test(block)) continue
    if (/^\[!\[/.test(block)) continue
    const plain = block
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_`]/g, '')
      .trim()
    if (plain.length >= 12) return plain
  }
  return ''
}

/**
 * Count markdown image references.
 *
 * @param {string} markdown
 * @returns {number}
 */
export function countImages(markdown) {
  const source = String(markdown ?? '')
  return (source.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length + (source.match(/<img\b[^>]*>/gi) ?? []).length
}

/**
 * Extract numeric comparisons such as `45 → 6`, `20 min -> 3 min`, `34 vs 39`.
 *
 * @param {string} text
 * @returns {Array<{ raw: string, from: string, to: string, line: string }>}
 */
export function parseComparisons(text) {
  /** @type {Array<{ raw: string, from: string, to: string, line: string }>} */
  const found = []
  const seen = new Set()
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const re = /(\d+(?:\.\d+)?)\s*(?:→|->|⇒|vs\.?|对比)\s*(\d+(?:\.\d+)?)/gi
    let match
    while ((match = re.exec(line)) !== null) {
      const raw = oneLine(line).slice(0, 120)
      if (seen.has(raw)) continue
      seen.add(raw)
      found.push({ raw, from: match[1], to: match[2], line: raw })
    }
  }
  return found
}

/**
 * Detect a test count from README / benchmark prose.
 *
 * @param {string[]} texts
 * @returns {number | null}
 */
export function detectTestCount(texts) {
  let best = null
  for (const text of texts) {
    const source = String(text ?? '')
    const patterns = [
      /(\d{1,3})\s*(?:项|个)\s*(?:离线)?\s*(?:测试|单测|用例)/g,
      /(?:用例数|测试数|tests?|checks?)\D{0,6}(\d{1,3})/gi,
      /pass\s+(\d{1,3})\b/gi,
    ]
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(source)) !== null) {
        const value = Number(match[1])
        if (Number.isFinite(value) && value >= 3 && value <= 200) {
          if (best === null || value > best) best = value
        }
      }
    }
  }
  return best
}

/** @param {string[]} values */
export function uniq(values) {
  return [...new Set(values)]
}

/** @param {number} value @param {number} min @param {number} max */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** @param {string} path */
export function dirnameOf(path) {
  const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return index === -1 ? '.' : path.slice(0, index)
}

/**
 * Produce a small unified diff of two texts (line-based, 3 lines of context).
 *
 * @param {string} before
 * @param {string} after
 * @param {string} label
 * @returns {string}
 */
export function unifiedDiff(before, after, label = 'README.md') {
  const a = String(before ?? '').split(/\r?\n/)
  const b = String(after ?? '').split(/\r?\n/)
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1
  let tail = 0
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1
  const removed = a.slice(head, a.length - tail)
  const added = b.slice(head, b.length - tail)
  if (removed.length === 0 && added.length === 0) return 'no changes'
  const lines = [`--- a/${label}`, `+++ b/${label}`, `@@ -${head + 1},${removed.length} +${head + 1},${added.length} @@`]
  for (const line of removed) lines.push(`-${line}`)
  for (const line of added) lines.push(`+${line}`)
  return lines.join('\n')
}

/**
 * Write only inside the repository root.
 *
 * @param {string} root
 * @param {string} relPath
 * @param {string} content
 */
export function writeInside(root, relPath, content) {
  const target = resolveInside(root, relPath)
  const parent = dirnameOf(target)
  return { target, parent, content }
}

/** @param {string} value */
export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** @param {string} p */
export function isAbsolutePath(p) {
  return isAbsolute(p)
}

/** @param {string} root @param {string} path */
export function joinInside(root, path) {
  return join(resolve(root), path)
}
