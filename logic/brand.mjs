/**
 * Brand engine v2.
 *
 * Twelve hand-built vector concepts (not clip-art), two themes, and a contact
 * sheet. Everything is deterministic SVG: no image model, no binary deps.
 *
 * File set:
 *   icon.svg, logo.svg (light), logo-dark.svg, banner.svg (dark),
 *   banner-light.svg, social-preview.svg, brand-sheet.svg, README.md
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { collectFacts } from './facts.mjs'
import { getStyle } from './styles.mjs'
import { resolveInside } from './util.mjs'

const FONT = `Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`
const FONT_SERIF = `Georgia, 'Times New Roman', 'Songti SC', serif`
const ACCENT = '#8CE3B8'

/**
 * @typedef {{ id: string, label: { zh: string, en: string }, fit: string, glyph: (palette: any, name: string) => string }} Concept
 */

/** @type {Concept[]} */
export const CONCEPTS = [
  { id: 'needle', label: { zh: '针线', en: 'Needle & thread' }, fit: '裁缝 / 定制 / 精修', glyph: needleGlyph },
  { id: 'stitch', label: { zh: '缝线勾', en: 'Stitched check' }, fit: '完成 / 校验 / 交付', glyph: stitchGlyph },
  { id: 'quill', label: { zh: '羽毛笔', en: 'Quill' }, fit: '写作 / 文档 / 叙事', glyph: quillGlyph },
  { id: 'arcs', label: { zh: '上升弧', en: 'Rising arcs' }, fit: '增长 / 指标 / 证据', glyph: arcsGlyph },
  { id: 'orbit', label: { zh: '轨道', en: 'Orbit' }, fit: '网络 / 远端 / 连接', glyph: orbitGlyph },
  { id: 'prompt', label: { zh: '提示符', en: 'Prompt' }, fit: 'CLI / 终端 / 工具', glyph: promptGlyph },
  { id: 'bubble', label: { zh: '对话泡', en: 'Bubble' }, fit: '产品 / 交互 / 轻松', glyph: bubbleGlyph },
  { id: 'radar', label: { zh: '雷达', en: 'Radar' }, fit: '监控 / 扫描 / 安全', glyph: radarGlyph },
  { id: 'hexstack', label: { zh: '面板栈', en: 'Panel stack' }, fit: '平台 / 面板 / 分层', glyph: hexstackGlyph },
  { id: 'monogram', label: { zh: '字母环', en: 'Monogram' }, fit: '成熟工具 / 极简', glyph: monogramGlyph },
  { id: 'spark', label: { zh: '四角星', en: 'Spark' }, fit: '通用 / 品牌 / 高光', glyph: sparkGlyph },
  { id: 'layers', label: { zh: '叠层', en: 'Layers' }, fit: '架构 / 模块 / 复用', glyph: layersGlyph },
]

/** @type {Map<string, Concept>} */
const CONCEPT_MAP = new Map(CONCEPTS.map((concept) => [concept.id, concept]))

/** @returns {string[]} */
export function conceptIds() {
  return CONCEPTS.map((concept) => concept.id)
}

/**
 * @param {string} id
 * @returns {Concept}
 */
export function getConcept(id) {
  const concept = CONCEPT_MAP.get(id)
  if (!concept) throw new Error(`unknown concept "${id}" (available: ${conceptIds().join(', ')})`)
  return concept
}

/* ------------------------------------------------------------------ */
/* concepts: 512×512, strokes are white, accent is pale green           */
/* ------------------------------------------------------------------ */

/** @param {any} palette @param {string} name */
function needleGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
    <path d="M158 358 L348 162" stroke-width="15"/>
    <ellipse cx="326" cy="184" rx="12" ry="21" transform="rotate(-43 326 184)" stroke-width="8"/>
    <path d="M318 202 C276 244 232 240 224 292 C217 338 262 358 296 336" stroke-width="9" opacity="0.86"/>
    <circle cx="296" cy="336" r="6" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function stitchGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
    <path d="M128 268 L218 358 L392 148" stroke-width="32" stroke-dasharray="56 30"/>
    <circle cx="392" cy="148" r="10" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function quillGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
    <path d="M372 120 C280 150 206 232 178 348" stroke-width="12"/>
    <path d="M372 120 C376 216 316 300 244 352 C180 338 158 278 166 226 C236 252 322 214 372 120 Z" fill="#FFFFFF" fill-opacity="0.16" stroke-width="7"/>
    <path d="M244 320 L306 250 M214 288 L272 218 M198 348 L240 306" stroke-width="7" opacity="0.75"/>
    <circle cx="178" cy="348" r="9" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function arcsGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round">
    <path d="M120 380 A 240 240 0 0 1 360 140" stroke-width="26"/>
    <path d="M168 400 A 190 190 0 0 1 358 210" stroke-width="20" opacity="0.6"/>
    <path d="M216 416 A 140 140 0 0 1 356 276" stroke-width="16" opacity="0.34"/>
    <circle cx="392" cy="128" r="24" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function orbitGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round">
    <circle cx="256" cy="256" r="104" stroke-width="22"/>
    <ellipse cx="256" cy="256" rx="190" ry="62" transform="rotate(-28 256 256)" stroke-width="9" opacity="0.65"/>
    <ellipse cx="256" cy="256" rx="150" ry="150" stroke-width="4" opacity="0.18" stroke-dasharray="2 14"/>
    <circle cx="378" cy="176" r="17" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function promptGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
    <path d="M196 156 L118 256 L196 356" stroke-width="27"/>
    <path d="M306 156 L384 256 L306 356" stroke-width="27" opacity="0.5"/>
    <rect x="286" y="300" width="52" height="28" rx="10" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function bubbleGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
    <path d="M120 184 Q120 128 184 128 H328 Q392 128 392 192 V284 Q392 348 328 348 H248 L188 404 V348 H184 Q120 348 120 284 Z" stroke-width="21"/>
    <circle cx="200" cy="238" r="13" fill="#FFFFFF" stroke="none"/>
    <circle cx="256" cy="238" r="13" fill="#FFFFFF" stroke="none" opacity="0.78"/>
    <circle cx="312" cy="238" r="13" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function radarGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round">
    <circle cx="256" cy="256" r="58" stroke-width="16"/>
    <circle cx="256" cy="256" r="126" stroke-width="8" opacity="0.55"/>
    <circle cx="256" cy="256" r="194" stroke-width="6" opacity="0.26"/>
    <path d="M256 256 L386 164" stroke-width="9" opacity="0.9"/>
    <circle cx="386" cy="164" r="10" fill="${ACCENT}" stroke="none"/>
    <circle cx="196" cy="316" r="7" fill="#FFFFFF" stroke="none" opacity="0.5"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function hexstackGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
    <path d="M256 112 L382 188 V324 L256 400 L130 324 V188 Z" stroke-width="18"/>
    <path d="M188 228 H324" stroke-width="22"/>
    <path d="M188 284 H292" stroke-width="16" opacity="0.7"/>
    <path d="M188 340 H244" stroke-width="16" opacity="0.45"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function monogramGlyph(palette, name) {
  const letter = firstLetter(name)
  return `<g fill="none" stroke="#FFFFFF">
    <circle cx="256" cy="256" r="148" stroke-width="13" opacity="0.9"/>
    <circle cx="256" cy="256" r="168" stroke-width="3" opacity="0.28" stroke-dasharray="2 12"/>
    <text x="256" y="330" text-anchor="middle" font-family="${FONT_SERIF}" font-size="228" font-weight="700" fill="#FFFFFF" stroke="none">${escapeXml(letter)}</text>
    <circle cx="392" cy="120" r="12" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function sparkGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round">
    <path d="M256 100 C270 208 300 238 408 256 C300 274 270 304 256 412 C242 304 212 274 104 256 C212 238 242 208 256 100 Z" fill="#FFFFFF" stroke="none"/>
    <ellipse cx="256" cy="256" rx="178" ry="64" transform="rotate(-24 256 256)" stroke-width="7" opacity="0.32"/>
    <circle cx="360" cy="170" r="12" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/** @param {any} palette @param {string} name */
function layersGlyph(palette, name) {
  return `<g fill="none" stroke="#FFFFFF" stroke-linecap="round">
    <rect x="130" y="196" width="236" height="236" rx="52" stroke-width="15" opacity="0.32"/>
    <rect x="158" y="166" width="236" height="236" rx="52" stroke-width="15" opacity="0.62"/>
    <rect x="186" y="136" width="236" height="236" rx="52" stroke-width="15"/>
    <circle cx="392" cy="120" r="11" fill="${ACCENT}" stroke="none"/>
  </g>`
}

/* ------------------------------------------------------------------ */
/* tiles, lockups, banners, sheet                                       */
/* ------------------------------------------------------------------ */

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {import('./styles.mjs').StylePreset} style
 * @param {string} [conceptId]
 * @returns {Record<string, string>}
 */
export function buildBrand(facts, style, conceptId, options = {}) {
  const concept = getConcept(conceptId ?? style.mark)
  const name = facts.name || facts.dirName
  const tagline = options.tagline || facts.description || (facts.readme.generated ? '' : facts.readme.firstParagraph) || ''
  const palette = style.palette
  return {
    'assets/icon.svg': iconSvg(concept, palette, name),
    'assets/logo.svg': logoSvg(facts, concept, palette, name, tagline, 'light'),
    'assets/logo-dark.svg': logoSvg(facts, concept, palette, name, tagline, 'dark'),
    'assets/banner.svg': bannerSvg(facts, concept, palette, name, tagline, 'dark', options.tagline),
    'assets/banner-light.svg': bannerSvg(facts, concept, palette, name, tagline, 'light', options.tagline),
    'assets/social-preview.svg': socialSvg(facts, concept, palette, name, tagline, options.tagline),
    'assets/brand-sheet.svg': sheetSvg(concept, palette, name, style),
    'assets/README.md': assetsReadme(facts, style, concept, name),
  }
}

/**
 * @param {any} palette
 * @returns {string}
 */
function tileDefs(palette) {
  return `<defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.brand}"/>
      <stop offset="1" stop-color="${palette.deep}"/>
    </linearGradient>
    <radialGradient id="tileGlow" cx="0.22" cy="0.12" r="0.9">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.34"/>
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <pattern id="tileGrid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="#FFFFFF" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>`
}

/**
 * @param {Concept} concept
 * @param {any} palette
 * @param {string} name
 * @param {number} radius
 * @returns {string}
 */
function tileSvg(concept, palette, name, radius = 112) {
  return `<g>
    ${tileDefs(palette)}
    <rect width="512" height="512" rx="${radius}" fill="url(#tile)"/>
    <rect width="512" height="512" rx="${radius}" fill="url(#tileGlow)"/>
    <rect width="512" height="512" rx="${radius}" fill="url(#tileGrid)"/>
    <rect x="5" y="5" width="502" height="502" rx="${radius - 4}" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="2"/>
    ${concept.glyph(palette, name)}
  </g>`
}

/**
 * @param {Concept} concept
 * @param {any} palette
 * @param {string} name
 * @returns {string}
 */
function iconSvg(concept, palette, name) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="${escapeXml(name)}">
  ${tileSvg(concept, palette, name)}
</svg>
`
}

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {Concept} concept
 * @param {any} palette
 * @param {string} name
 * @param {string} tagline
 * @param {'light'|'dark'} mode
 * @returns {string}
 */
function logoSvg(facts, concept, palette, name, tagline, mode) {
  const text = mode === 'light' ? '#0B1020' : '#F4F7FF'
  const sub = mode === 'light' ? '#5B6B8C' : '#9FB2D4'
  const fontSize = fitSize(name, 64, 532, 0.56)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 176" width="760" height="176" role="img" aria-label="${escapeXml(name)} logo">
  <g transform="translate(8 8) scale(0.3125)">${tileSvg(concept, palette, name)}</g>
  <text x="204" y="92" font-family="${FONT}" font-size="${fontSize}" font-weight="800" letter-spacing="-1" fill="${text}">${escapeXml(name)}</text>
  <text x="206" y="130" font-family="${FONT}" font-size="19" fill="${sub}">${escapeXml(truncate(tagline, 50))}</text>
</svg>
`
}

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {Concept} concept
 * @param {any} palette
 * @param {string} name
 * @param {string} tagline
 * @param {'dark'|'light'} mode
 * @param {string} [headline]
 * @returns {string}
 */
function bannerSvg(facts, concept, palette, name, tagline, mode, headline) {
  const dark = mode === 'dark'
  const ink = dark ? '#FFFFFF' : '#0B1020'
  const chipText = dark ? '#C9D6F0' : '#33456B'
  const bgTop = dark ? palette.ink : '#F7F9FF'
  const bgBottom = dark ? palette.bg : '#EAF0FF'
  const lines = wrapText(headline || briefTagline(tagline, 96), 54).slice(0, 2)
  const chips = []
  if (facts.version) chips.push(`v${facts.version}`)
  if (facts.license) chips.push(facts.license)
  if (facts.engines?.dsh) chips.push(`DSH ${facts.engines.dsh}`)
  if (facts.engines?.node) chips.push(`Node ${facts.engines.node}`)
  if (chips.length === 0) chips.push('README')
  const chipSvg = chips.slice(0, 4).map((chip, index) => {
    const x = 72 + index * 246
    return `<g transform="translate(${x} 314)">
      <rect width="226" height="44" rx="22" fill="#FFFFFF" fill-opacity="${dark ? 0.06 : 0.75}" stroke="${dark ? '#2A3F6E' : '#D7E0F5'}"/>
      <text x="113" y="29" text-anchor="middle" font-family="${FONT}" font-size="18" fill="${chipText}">${escapeXml(truncate(chip, 26))}</text>
    </g>`
  }).join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 400" width="1280" height="400" role="img" aria-label="${escapeXml(name)} banner">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgTop}"/>
      <stop offset="0.55" stop-color="${dark ? palette.bg : '#F2F6FF'}"/>
      <stop offset="1" stop-color="${bgBottom}"/>
    </linearGradient>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.brand}"/>
      <stop offset="1" stop-color="${palette.deep}"/>
    </linearGradient>
    <radialGradient id="tileGlow" cx="0.22" cy="0.12" r="0.9">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="${dark ? '#FFFFFF' : '#0B1020'}" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1280" height="400" fill="url(#bg)"/>
  <rect width="1280" height="400" fill="url(#grid)"/>
  <text x="1216" y="60" text-anchor="end" font-family="${FONT}" font-size="14" fill="${dark ? '#6F86B8' : '#7B8CAE'}">${escapeXml(truncate(facts.repo ?? facts.homepage ?? '', 52))}</text>
  <g fill="none" stroke="${dark ? '#FFFFFF' : '#0B1020'}" stroke-opacity="${dark ? 0.06 : 0.05}">
    <circle cx="1112" cy="206" r="86" stroke-width="1.5"/>
    <circle cx="1112" cy="206" r="148" stroke-width="1.5"/>
    <circle cx="1112" cy="206" r="216" stroke-width="1.5"/>
  </g>
  <circle cx="1198" cy="154" r="5" fill="${palette.brand}" opacity="0.75"/>
  <g transform="translate(64 58) scale(0.234375)">
    <rect width="512" height="512" rx="112" fill="url(#tile)"/>
    <rect width="512" height="512" rx="112" fill="url(#tileGlow)"/>
    <rect x="5" y="5" width="502" height="502" rx="108" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="2"/>
    ${concept.glyph(palette, name)}
  </g>
  <text x="204" y="118" font-family="${FONT}" font-size="${fitSize(name, 52, 560, 0.56)}" font-weight="800" letter-spacing="-1" fill="${ink}">${escapeXml(name)}</text>
  <text x="206" y="150" font-family="${FONT}" font-size="17" fill="${dark ? '#8FA3C8' : '#6B7DA3'}">${escapeXml(styleLabel(facts))}</text>
  ${lines.map((line, index) => `<text x="72" y="${214 + index * 36}" font-family="${FONT}" font-size="26" fill="${dark ? '#DCE6FA' : '#1B2742'}">${escapeXml(line)}</text>`).join('\n  ')}
  ${chipSvg}
</svg>
`
}

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {Concept} concept
 * @param {any} palette
 * @param {string} name
 * @param {string} tagline
 * @param {string} [headline]
 * @returns {string}
 */
function socialSvg(facts, concept, palette, name, tagline, headline) {
  const lines = wrapText(headline || briefTagline(tagline, 132), 42).slice(0, 3)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 640" width="1280" height="640" role="img" aria-label="${escapeXml(name)} social preview">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.ink}"/>
      <stop offset="0.55" stop-color="${palette.bg}"/>
      <stop offset="1" stop-color="${palette.deep}"/>
    </linearGradient>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.brand}"/>
      <stop offset="1" stop-color="${palette.deep}"/>
    </linearGradient>
    <radialGradient id="tileGlow" cx="0.22" cy="0.12" r="0.9">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#FFFFFF" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1280" height="640" fill="url(#bg)"/>
  <rect width="1280" height="640" fill="url(#grid)"/>
  <g fill="none" stroke="#FFFFFF" stroke-opacity="0.07">
    <circle cx="1116" cy="300" r="96" stroke-width="1.5"/>
    <circle cx="1116" cy="300" r="176" stroke-width="1.5"/>
    <circle cx="1116" cy="300" r="264" stroke-width="1.5"/>
  </g>
  <circle cx="1194" cy="214" r="5" fill="${palette.brand}" opacity="0.8"/>
  <g transform="translate(88 92) scale(0.3125)">
    <rect width="512" height="512" rx="112" fill="url(#tile)"/>
    <rect width="512" height="512" rx="112" fill="url(#tileGlow)"/>
    <rect x="5" y="5" width="502" height="502" rx="108" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="2"/>
    ${concept.glyph(palette, name)}
  </g>
  <text x="272" y="200" font-family="${FONT}" font-size="${fitSize(name, 58, 880, 0.55)}" font-weight="800" letter-spacing="-1.2" fill="#FFFFFF">${escapeXml(name)}</text>
  ${lines.map((line, index) => `<text x="274" y="${268 + index * 42}" font-family="${FONT}" font-size="27" fill="${index === 0 ? '#DCE6FA' : '#9FB2D4'}">${escapeXml(line)}</text>`).join('\n  ')}
  <text x="90" y="566" font-family="${FONT}" font-size="21" fill="${palette.brand === '#FF75B7' ? '#FF9BC9' : '#7FA2FF'}">${escapeXml(truncate(facts.repo ?? facts.homepage ?? name, 52))}</text>
  <rect x="0" y="636" width="1280" height="4" fill="${palette.brand}" opacity="0.85"/>
</svg>
`
}

/**
 * @param {Concept} selected
 * @param {any} palette
 * @param {string} name
 * @param {import('./styles.mjs').StylePreset} style
 * @returns {string}
 */
function sheetSvg(selected, palette, name, style) {
  const cols = 4
  const tileW = 268
  const tileH = 214
  const gap = 24
  const startX = 48
  const startY = 158
  const cards = CONCEPTS.map((concept, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = startX + col * (tileW + gap)
    const y = startY + row * (tileH + gap)
    const active = concept.id === selected.id
    return `<g transform="translate(${x} ${y})">
      <rect width="${tileW}" height="${tileH}" rx="20" fill="#111A33" stroke="${active ? palette.brand : '#22305C'}" stroke-width="${active ? 2 : 1}"/>
      <g transform="translate(${(tileW - 84) / 2} 22) scale(0.164)">${tileSvg(concept, palette, name)}</g>
      <text x="${tileW / 2}" y="132" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="700" fill="${active ? '#FFFFFF' : '#DCE6FA'}">${concept.id}</text>
      <text x="${tileW / 2}" y="156" text-anchor="middle" font-family="${FONT}" font-size="13" fill="#8FA3C8">${escapeXml(concept.label.zh)}</text>
      <text x="${tileW / 2}" y="180" text-anchor="middle" font-family="${FONT}" font-size="12" fill="#5F739E">${escapeXml(concept.fit)}</text>
      ${active ? `<g transform="translate(${tileW - 58} 10)"><rect width="48" height="20" rx="10" fill="${palette.brand}"/><text x="24" y="14" text-anchor="middle" font-family="${FONT}" font-size="11" fill="#FFFFFF">默认</text></g>` : ''}
    </g>`
  }).join('\n')
  const rows = Math.ceil(CONCEPTS.length / cols)
  const height = startY + rows * (tileH + gap) + 70
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 ${height}" width="1280" height="${height}" role="img" aria-label="Brand concept sheet">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1020"/>
      <stop offset="1" stop-color="#121A33"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#FFFFFF" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1280" height="${height}" fill="url(#bg)"/>
  <rect width="1280" height="${height}" fill="url(#grid)"/>
  <text x="48" y="64" font-family="${FONT}" font-size="30" font-weight="800" fill="#FFFFFF">12 个原创图形概念</text>
  <text x="48" y="96" font-family="${FONT}" font-size="15" fill="#8FA3C8">为 ${escapeXml(name)} 的 ${escapeXml(style.label.zh)} 风格生成。默认：${selected.id}。切换：<tspan font-family="Consolas, monospace" fill="#A9BBDA">repo_brand { concept }</tspan></text>
  <text x="48" y="124" font-family="${FONT}" font-size="13" fill="#5F739E">同一仓库、同一概念重复生成字节一致；全部为手写 SVG 几何，无图片模型。</text>
  ${cards}
  <text x="48" y="${height - 28}" font-family="${FONT}" font-size="13" fill="#5F739E">dsh-plugin-tailor · style=${style.id} · concept=${selected.id} · 明暗两套 lockup + banner + social</text>
</svg>
`
}

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {import('./styles.mjs').StylePreset} style
 * @param {Concept} concept
 * @param {string} name
 * @returns {string}
 */
function assetsReadme(facts, style, concept, name) {
  return `# Brand assets

Generated by [dsh-plugin-tailor](https://github.com/sakikoTGW/dsh-plugin-tailor) for \`${name}\`
in the \`${style.id}\` style, concept \`${concept.id}\` (${concept.label.zh}).
Re-running with the same inputs is byte-identical.

| File | What it is | Where it is used |
|---|---|---|
| \`icon.svg\` | 512×512 rounded app icon | plugin icon / avatar |
| \`logo.svg\` | icon + wordmark, light theme | README (light) / docs |
| \`logo-dark.svg\` | icon + wordmark, dark theme | dark README / releases |
| \`banner.svg\` | 1280×400 dark banner with facts chips | README hero / release post |
| \`banner-light.svg\` | 1280×400 light banner | light docs / slides |
| \`social-preview.svg\` | 1280×640 social card | GitHub Settings → Social preview |
| \`brand-sheet.svg\` | all ${CONCEPTS.length} concepts side by side | choose a concept |

Concept: \`${concept.id}\` — ${concept.label.zh} / ${concept.label.en}. ${concept.fit}.
Palette: brand \`${style.palette.brand}\` · deep \`${style.palette.deep}\` · ink \`${style.palette.ink}\`.
Style source: [${style.source}](${style.sourceUrl}).

Switch concept or regenerate:

\`\`\`sh
node bin/tailor.mjs brand . --style=${style.id} --concept=needle --apply --force
\`\`\`

Available concepts: ${CONCEPTS.map((item) => `\`${item.id}\``).join(', ')}.
`
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * @param {string} name
 * @param {number} base
 * @param {number} maxWidth
 * @param {number} factor
 * @returns {number}
 */
function fitSize(name, base, maxWidth, factor) {
  const width = name.length * factor * base
  if (width <= maxWidth) return base
  return Math.max(28, Math.floor((maxWidth / width) * base))
}

/** @param {string} name */
function firstLetter(name) {
  const match = String(name).match(/[\p{L}\p{N}]/u)
  return match ? match[0].toUpperCase() : 'T'
}

/** @param {string} text @param {number} max */
function truncate(text, max) {
  const value = String(text ?? '')
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`
}

/** @param {string} text @param {number} maxWidth */
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
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function briefTagline(text, max) {
  const clean = String(text ?? '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
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

/** @param {import('./facts.mjs').RepoFacts} facts */
function styleLabel(facts) {
  return facts.engines.dsh ? 'DSH PLUGIN' : facts.packageJson?.private ? 'PRIVATE REPOSITORY' : 'OPEN SOURCE'
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
 * @param {string} root
 * @param {string} styleId
 * @param {{ force?: boolean, concept?: string, tagline?: string }} [options]
 * @returns {{ written: string[], skipped: string[], files: Record<string, string>, concept: string }}
 */
export function applyBrand(root, styleId = 'resolver', options = {}) {
  const facts = collectFacts(root)
  const style = getStyle(styleId)
  const concept = options.concept ? getConcept(options.concept).id : style.mark
  const files = buildBrand(facts, style, concept, { tagline: options.tagline })
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
  return { written, skipped, files, concept }
}
