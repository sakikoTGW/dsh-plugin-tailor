/**
 * Deterministic brand assets: icon, logo, banner and social preview as SVG.
 *
 * No image model, no binary dependencies. The mark is derived from the style id
 * and the project name, the palette comes from the style preset, and the copy
 * comes from package.json facts. Re-running on an unchanged repository produces
 * byte-identical files.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { collectFacts } from './facts.mjs'
import { getStyle } from './styles.mjs'
import { resolveInside } from './util.mjs'

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {import('./styles.mjs').StylePreset} style
 * @returns {Record<string, string>}
 */
export function buildBrand(facts, style) {
  const name = facts.name || facts.dirName
  const tagline = facts.description || facts.readme.firstParagraph || ''
  return {
    'assets/icon.svg': iconSvg(facts, style, name),
    'assets/logo.svg': logoSvg(facts, style, name, tagline),
    'assets/banner.svg': bannerSvg(facts, style, name, tagline),
    'assets/social-preview.svg': socialSvg(facts, style, name, tagline),
    'assets/README.md': assetsReadme(facts, style, name),
  }
}

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {import('./styles.mjs').StylePreset} style
 * @param {string} name
 * @returns {string}
 */
function iconSvg(facts, style, name) {
  const { brand, deep } = style.palette
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="${escapeXml(name)} icon">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${brand}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#bg)"/>
  <rect width="512" height="512" rx="120" fill="url(#grid)"/>
  ${markGlyph(style, name)}
</svg>
`
}

/**
 * @param {import('./styles.mjs').StylePreset} style
 * @param {string} name
 * @returns {string}
 */
function markGlyph(style, name) {
  const stroke = '#FFFFFF'
  switch (style.mark) {
    case 'check-dots':
      return `<g fill="none" stroke="${stroke}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="150" cy="176" r="18" fill="${stroke}" stroke="none" opacity="0.55"/>
    <circle cx="256" cy="140" r="18" fill="${stroke}" stroke="none" opacity="0.8"/>
    <circle cx="362" cy="176" r="18" fill="${stroke}" stroke="none" opacity="0.55"/>
    <path d="M150 176 L256 140 L362 176" opacity="0.35"/>
    <path d="M196 290 L244 338 L342 224"/>
  </g>`
    case 'brackets':
      return `<g fill="none" stroke="${stroke}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
    <path d="M176 150 L136 256 L176 362"/>
    <path d="M336 150 L376 256 L336 362"/>
    <path d="M206 300 L256 210 L306 300"/>
    <path d="M256 300 L256 340"/>
  </g>`
    case 'orbit':
      return `<g fill="none" stroke="${stroke}" stroke-linecap="round">
    <circle cx="256" cy="256" r="96" stroke-width="20"/>
    <ellipse cx="256" cy="256" rx="168" ry="58" stroke-width="10" opacity="0.6" transform="rotate(-24 256 256)"/>
    <ellipse cx="256" cy="256" rx="168" ry="58" stroke-width="10" opacity="0.35" transform="rotate(24 256 256)"/>
    <circle cx="256" cy="256" r="26" fill="${stroke}" stroke="none"/>
  </g>`
    case 'bubble':
      return `<g fill="none" stroke="${stroke}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">
    <path d="M132 168 Q132 128 176 128 H336 Q380 128 380 168 V296 Q380 336 336 336 H232 L176 392 L176 336 H176 Q132 336 132 296 Z"/>
    <circle cx="204" cy="236" r="14" fill="${stroke}" stroke="none"/>
    <circle cx="256" cy="236" r="14" fill="${stroke}" stroke="none"/>
    <circle cx="308" cy="236" r="14" fill="${stroke}" stroke="none"/>
  </g>`
    case 'radar':
      return `<g fill="none" stroke="${stroke}" stroke-linecap="round">
    <circle cx="256" cy="256" r="52" stroke-width="16"/>
    <circle cx="256" cy="256" r="102" stroke-width="10" opacity="0.7"/>
    <circle cx="256" cy="256" r="152" stroke-width="8" opacity="0.4"/>
    <path d="M256 256 L392 152" stroke-width="12"/>
    <circle cx="256" cy="256" r="14" fill="${stroke}" stroke="none"/>
    <circle cx="372" cy="168" r="12" fill="${stroke}" stroke="none"/>
  </g>`
    case 'hex-bar':
      return `<g fill="none" stroke="${stroke}" stroke-width="20" stroke-linejoin="round">
    <path d="M256 108 L386 186 V334 L256 412 L126 334 V186 Z"/>
    <path d="M256 196 V324" stroke-width="26" stroke-linecap="round"/>
    <path d="M196 240 H256 M256 324 L308 208" stroke-width="20" stroke-linecap="round"/>
  </g>`
    case 'serif-letter':
    default:
      return `<text x="256" y="330" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="240" font-weight="700" fill="${stroke}">${escapeXml(firstLetter(name))}</text>`
  }
}

/** @param {string} name */
function firstLetter(name) {
  const match = String(name).match(/[\p{L}\p{N}]/u)
  return match ? match[0].toUpperCase() : 'S'
}

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {import('./styles.mjs').StylePreset} style
 * @param {string} name
 * @param {string} tagline
 * @returns {string}
 */
function logoSvg(facts, style, name, tagline) {
  const { brand, deep } = style.palette
  const maxWidth = 760 - 204 - 28
  const estimated = name.length * 0.58 * 64
  const fontSize = Math.max(34, Math.min(64, Math.floor((maxWidth / estimated) * 64)))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 176" width="760" height="176" role="img" aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${brand}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="160" height="160" rx="40" fill="url(#mark)"/>
  <g transform="translate(8 8) scale(0.3125)">${markGlyph(style, name)}</g>
  <text x="204" y="96" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="${fontSize}" font-weight="700" fill="${brand}">${escapeXml(name)}</text>
  <text x="206" y="132" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="20" fill="#6B7280">${escapeXml(truncateText(tagline, 52))}</text>
</svg>
`
}

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {import('./styles.mjs').StylePreset} style
 * @param {string} name
 * @param {string} tagline
 * @returns {string}
 */
function bannerSvg(facts, style, name, tagline) {
  const { brand, deep, ink, bg, border } = style.palette
  const lines = wrapText(briefTagline(tagline, 96), 54).slice(0, 2)
  const chips = []
  if (facts.version) chips.push(`v${facts.version}`)
  if (facts.license) chips.push(facts.license)
  if (facts.engines?.dsh) chips.push(`DSH ${facts.engines.dsh}`)
  if (facts.engines?.node) chips.push(`Node ${facts.engines.node}`)
  const chipSvg = chips.slice(0, 4).map((chip, index) => {
    const x = 84 + index * 250
    return `<g transform="translate(${x} 318)">
      <rect width="226" height="46" rx="23" fill="#FFFFFF" fill-opacity="0.06" stroke="${border}"/>
      <text x="113" y="30" text-anchor="middle" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="19" fill="#C9D3EA">${escapeXml(truncateText(chip, 26))}</text>
    </g>`
  }).join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 400" width="1280" height="400" role="img" aria-label="${escapeXml(name)} banner">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ink}"/>
      <stop offset="0.55" stop-color="${bg}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${brand}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#FFFFFF" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
    <radialGradient id="glow" cx="0.18" cy="0.2" r="0.7">
      <stop offset="0" stop-color="${brand}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${brand}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="400" fill="url(#bg)"/>
  <rect width="1280" height="400" fill="url(#grid)"/>
  <rect width="1280" height="400" fill="url(#glow)"/>
  <rect x="56" y="64" width="112" height="112" rx="28" fill="url(#mark)"/>
  <g transform="translate(56 64) scale(0.21875)">${markGlyph(style, name)}</g>
  <text x="192" y="112" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="52" font-weight="700" fill="#FFFFFF">${escapeXml(truncateText(name, 30))}</text>
  <text x="194" y="150" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="20" fill="#8FA3C8">${escapeXml(style.label.zh)} · ${escapeXml(style.label.en)}</text>
  ${lines.map((line, index) => `<text x="84" y="${228 + index * 34}" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="26" fill="#DCE6FA">${escapeXml(line)}</text>`).join('\n  ')}
  ${chipSvg}
</svg>
`
}

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {import('./styles.mjs').StylePreset} style
 * @param {string} name
 * @param {string} tagline
 * @returns {string}
 */
function socialSvg(facts, style, name, tagline) {
  const { brand, deep, ink, bg, border } = style.palette
  const lines = wrapText(briefTagline(tagline, 140), 44).slice(0, 3)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 640" width="1280" height="640" role="img" aria-label="${escapeXml(name)} social preview">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ink}"/>
      <stop offset="0.6" stop-color="${bg}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${brand}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#FFFFFF" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1280" height="640" fill="url(#bg)"/>
  <rect width="1280" height="640" fill="url(#grid)"/>
  <rect x="88" y="96" width="152" height="152" rx="38" fill="url(#mark)"/>
  <g transform="translate(88 96) scale(0.296875)">${markGlyph(style, name)}</g>
  <text x="88" y="332" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="64" font-weight="700" fill="#FFFFFF">${escapeXml(truncateText(name, 32))}</text>
  ${lines.map((line, index) => `<text x="90" y="${392 + index * 42}" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="27" fill="${index === 0 ? '#DCE6FA' : '#9FB2D4'}">${escapeXml(line)}</text>`).join('\n  ')}
  <text x="90" y="560" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="22" fill="${brand}">${escapeXml(facts.repo ?? facts.homepage ?? name)}</text>
  <rect x="0" y="636" width="1280" height="4" fill="${brand}" opacity="0.8"/>
  <rect x="0" y="0" width="1280" height="4" fill="${border}" opacity="0.6"/>
</svg>
`
}

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {import('./styles.mjs').StylePreset} style
 * @param {string} name
 * @returns {string}
 */
function assetsReadme(facts, style, name) {
  return `# Brand assets

Generated by [dsh-plugin-tailor](https://github.com/sakikoTGW/dsh-plugin-tailor) for \`${name}\`
in the \`${style.id}\` style. Re-running on an unchanged repository is deterministic.

| File | What it is | Where it is used |
|---|---|---|
| \`icon.svg\` | 512×512 rounded app icon | plugin icon / social avatar |
| \`logo.svg\` | icon + wordmark (theme-agnostic) | README first screen |
| \`banner.svg\` | 1280×400 dark banner with facts chips | README hero / release post |
| \`social-preview.svg\` | 1280×640 social card | GitHub Settings → Social preview |

Palette: brand \`${style.palette.brand}\` · deep \`${style.palette.deep}\` · ink \`${style.palette.ink}\`.
Style source: [${style.source}](${style.sourceUrl}).

Regenerate with \`node bin/tailor.mjs brand . --style=${style.id} --apply\`.
`
}

/**
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
function wrapText(text, maxWidth) {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ')
  const lines = []
  let current = ''
  let width = 0
  for (const word of words) {
    const w = wordWidth(word)
    if (width + w + (current === '' ? 0 : 1) > maxWidth && current !== '') {
      lines.push(current)
      current = word
      width = w
    } else {
      current = current === '' ? word : `${current} ${word}`
      width += w + 1
    }
    if (width >= maxWidth) {
      lines.push(current)
      current = ''
      width = 0
    }
  }
  if (current !== '') lines.push(current)
  return lines.length > 0 ? lines : ['']
}

/** @param {string} word */
function wordWidth(word) {
  let width = 0
  for (const char of String(word)) width += /[\u3000-\u9fff\uff00-\uffef]/.test(char) ? 2 : 1
  return width
}

/**
 * A banner-sized version of a long description: drop parenthetical lists, then
 * keep whole comma-separated clauses until the cap.
 *
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function briefTagline(text, max) {
  const clean = String(text ?? '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (clean === '') return ''
  const clauses = clean.split(', ')
  let result = clauses[0]
  for (const clause of clauses.slice(1)) {
    if (`${result}, ${clause}`.length > max) break
    result += `, ${clause}`
  }
  if (result.length > max) {
    const cut = result.slice(0, max)
    const space = cut.lastIndexOf(' ')
    result = `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`
  }
  return result
}

/** @param {string} text @param {number} max */
function truncateText(text, max) {
  const value = String(text ?? '')
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`
}

/**
 * First sentence, capped at `max` characters on a word boundary.
 *
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function leadSentence(text, max) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim()
  const stop = value.search(/[.!?。！？]\s/)
  const sentence = stop === -1 ? value : value.slice(0, stop + 1)
  if (sentence.length <= max) return sentence
  const cut = sentence.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`
}

/** @param {string} value */
function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Write brand assets, refusing to overwrite hand-made files unless `force`.
 *
 * @param {string} root
 * @param {string} styleId
 * @param {{ force?: boolean }} [options]
 * @returns {{ written: string[], skipped: string[], files: Record<string, string> }}
 */
export function applyBrand(root, styleId = 'resolver', options = {}) {
  const facts = collectFacts(root)
  const style = getStyle(styleId)
  const files = buildBrand(facts, style)
  const force = options.force === true
  const written = []
  const skipped = []
  for (const [relPath, content] of Object.entries(files)) {
    const target = resolveInside(facts.root, relPath)
    if (existsSync(target) && !force) {
      skipped.push(relPath)
      continue
    }
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content, 'utf8')
    written.push(relPath)
  }
  return { written, skipped, files }
}
