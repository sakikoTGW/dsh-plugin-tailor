/**
 * Color math for visual assets and contrast QA.
 *
 * Everything is plain sRGB hex; no dependencies, deterministic.
 */

/** @param {string} hex */
export function parseHex(hex) {
  const value = String(hex ?? '').trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`invalid hex color: ${hex}`)
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

/** @param {{ r: number, g: number, b: number }} rgb */
export function toHex(rgb) {
  const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)))
  return `#${[rgb.r, rgb.g, rgb.b].map((value) => clamp(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

/** Relative luminance, WCAG 2.2. @param {string} hex */
export function luminance(hex) {
  const { r, g, b } = parseHex(hex)
  const channel = (value) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Contrast ratio between two colors. @param {string} a @param {string} b */
export function contrastRatio(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

/** Mix two colors; weight is the amount of `a` (0..1). @param {string} a @param {string} b @param {number} weight */
export function mix(a, b, weight = 0.5) {
  const x = parseHex(a)
  const y = parseHex(b)
  const w = Math.max(0, Math.min(1, weight))
  return toHex({
    r: x.r * w + y.r * (1 - w),
    g: x.g * w + y.g * (1 - w),
    b: x.b * w + y.b * (1 - w),
  })
}

/** @param {string} hex @param {number} amount 0..1 toward white */
export function lighten(hex, amount) {
  return mix('#FFFFFF', hex, amount)
}

/** @param {string} hex @param {number} amount 0..1 toward black */
export function darken(hex, amount) {
  return mix('#000000', hex, amount)
}

/**
 * Pick the candidate with the highest contrast against `bg`.
 *
 * @param {string} bg
 * @param {string[]} candidates
 * @returns {string}
 */
export function readableOn(bg, candidates) {
  let best = candidates[0]
  let bestRatio = 0
  for (const candidate of candidates) {
    const ratio = contrastRatio(candidate, bg)
    if (ratio > bestRatio) {
      best = candidate
      bestRatio = ratio
    }
  }
  return best
}

/** @param {number} ratio */
export function wcagGrade(ratio) {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA-large'
  return 'fail'
}

/**
 * Expand a style palette into design tokens for assets and QA.
 *
 * @param {{ brand: string, deep: string, ink: string, green: string, bg: string, border: string }} palette
 */
export function buildPaletteTokens(palette) {
  const onBrand = readableOn(palette.brand, ['#0B1020', '#FFFFFF'])
  const onDeep = readableOn(palette.deep, ['#0B1020', '#FFFFFF'])
  const onLight = readableOn('#F7F9FF', ['#0B1020', '#FFFFFF'])
  const onDark = readableOn(palette.bg, ['#F4F7FF', '#0B1020'])
  return {
    ...palette,
    onBrand,
    onDeep,
    onLight,
    onDark,
    soft: mix(palette.brand, palette.bg, 0.18),
    line: palette.border,
    accent: palette.green,
    glow: mix(palette.brand, '#FFFFFF', 0.25),
  }
}

/**
 * @typedef {{ id: string, label: string, fg: string, bg: string, ratio: number, min: number, grade: string, pass: boolean }} ContrastCheck
 */

/**
 * Contrast checks used by `repo_brand` dry-run and `brand-tokens.json`.
 *
 * @param {ReturnType<typeof buildPaletteTokens>} tokens
 * @returns {{ checks: ContrastCheck[], pass: boolean }}
 */
export function contrastChecks(tokens) {
  const checks = [
    { id: 'ondark-on-bg', label: '正文 onDark / bg', fg: tokens.onDark, bg: tokens.bg, min: 7 },
    { id: 'ondark-on-ink', label: '标题 onDark / ink', fg: tokens.onDark, bg: tokens.ink, min: 7 },
    { id: 'onbrand-on-brand', label: '图标 onBrand / brand', fg: tokens.onBrand, bg: tokens.brand, min: 3 },
    { id: 'brand-on-bg', label: '品牌色 / bg（图形）', fg: tokens.brand, bg: tokens.bg, min: 3 },
    { id: 'green-on-ink', label: '强调色 / ink（图形）', fg: tokens.green, bg: tokens.ink, min: 3 },
    { id: 'onlight-on-light', label: '浅底正文 onLight / #F7F9FF', fg: tokens.onLight, bg: '#F7F9FF', min: 7 },
  ].map((check) => {
    const ratio = contrastRatio(check.fg, check.bg)
    return { ...check, ratio: Number(ratio.toFixed(2)), grade: wcagGrade(ratio), pass: ratio >= check.min }
  })
  return { checks, pass: checks.every((check) => check.pass) }
}
