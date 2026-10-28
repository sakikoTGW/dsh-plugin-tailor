/**
 * Style schema: the contract for built-in and user-authored style files.
 *
 * A style is plain JSON. Built-ins live in `styles/*.json`; users can add
 * `.tailor/styles/*.json` (per repository) or `~/.tailor/styles/*.json`
 * (per machine), optionally with `extends` to start from an existing style.
 */

/** Sections a style may put in `sections` (each has a renderer). */
export const SECTION_IDS = new Set([
  'hero', 'language', 'badges', 'title', 'tagline', 'nav', 'demo', 'toc',
  'why', 'how', 'install', 'quickstart', 'features', 'evidence', 'structure',
  'tests', 'limitations', 'feedback', 'license', 'screenshots', 'compatibility',
  'community', 'faq', 'download', 'tutorial', 'docs', 'usage', 'remote',
  'credits', 'in-the-wild',
])

/** Badge ids the renderer knows how to build. */
export const BADGE_IDS = new Set(['npm', 'version', 'license', 'dsh', 'node', 'ci', 'checks', 'stars', 'platform', 'forum'])

/** Brand concepts a style may point at. Keep in sync with brand.mjs CONCEPTS. */
export const MARK_IDS = new Set(['needle', 'stitch', 'quill', 'arcs', 'orbit', 'prompt', 'bubble', 'radar', 'hexstack', 'monogram', 'spark', 'layers'])

export const LANGUAGES = new Set(['bilingual', 'zh-first', 'en-first'])
export const HEROES = new Set(['banner', 'logo', 'none'])
export const DEMOS = new Set(['gif', 'screenshot', 'none'])

/** Top-level keys allowed in a style file. */
const ALLOWED_KEYS = new Set([
  '$schema', 'extends', 'id', 'label', 'essence', 'language', 'tone', 'hero', 'demo',
  'mark', 'palette', 'badgeSet', 'sections', 'labels', 'notes', 'requiredFacts',
  'description', 'author', 'version',
])

const PALETTE_KEYS = ['brand', 'deep', 'ink', 'green', 'bg', 'border']
const HEX = /^#[0-9a-fA-F]{6}$/
const ID = /^[a-z][a-z0-9-]{1,31}$/

/**
 * @typedef {{
 *   id: string,
 *   label: { zh: string, en: string },
 *   essence: { zh: string, en: string },
 *   language: 'bilingual' | 'zh-first' | 'en-first',
 *   tone: { zh: string, en: string },
 *   hero: 'banner' | 'logo' | 'none',
 *   demo: 'gif' | 'screenshot' | 'none',
 *   mark: string,
 *   palette: { brand: string, deep: string, ink: string, green: string, bg: string, border: string },
 *   badgeSet: string[],
 *   sections: string[],
 *   labels: Record<string, { zh: string, en: string }>,
 *   notes: { zh: string, en: string },
 *   requiredFacts: string[]
 * }} StylePreset
 */

/**
 * Validate one style object (after `extends` has been merged).
 *
 * @param {any} style
 * @param {{ builtinIds?: Set<string> }} [options]
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateStyle(style, options = {}) {
  const errors = []
  const warnings = []
  if (!style || typeof style !== 'object' || Array.isArray(style)) {
    return { errors: ['style must be a JSON object'], warnings }
  }

  for (const key of Object.keys(style)) {
    if (!ALLOWED_KEYS.has(key)) warnings.push(`unknown key "${key}"`)
  }

  if (typeof style.id !== 'string' || !ID.test(style.id)) errors.push('id must match ^[a-z][a-z0-9-]{1,31}$')
  else if (options.builtinIds?.has(style.id)) warnings.push(`style id "${style.id}" overrides a built-in style`)
  if (typeof style.extends === 'string' && style.extends !== '' && !ID.test(style.extends)) errors.push('extends must be a style id')

  for (const field of ['label', 'essence', 'tone', 'notes']) {
    const value = style[field]
    if (!value || typeof value !== 'object') {
      errors.push(`${field} must be an object with zh and en strings`)
      continue
    }
    for (const lang of ['zh', 'en']) {
      if (typeof value[lang] !== 'string' || value[lang].trim() === '') errors.push(`${field}.${lang} must be a non-empty string`)
    }
  }

  if (!LANGUAGES.has(style.language)) errors.push(`language must be one of ${[...LANGUAGES].join(', ')}`)
  if (!HEROES.has(style.hero)) errors.push(`hero must be one of ${[...HEROES].join(', ')}`)
  if (!DEMOS.has(style.demo)) errors.push(`demo must be one of ${[...DEMOS].join(', ')}`)
  if (!MARK_IDS.has(style.mark)) errors.push(`mark must be one of ${[...MARK_IDS].join(', ')}`)

  if (!style.palette || typeof style.palette !== 'object') {
    errors.push('palette must be an object')
  } else {
    for (const key of PALETTE_KEYS) {
      if (typeof style.palette[key] !== 'string' || !HEX.test(style.palette[key])) errors.push(`palette.${key} must be a #RRGGBB color`)
    }
  }

  if (!Array.isArray(style.badgeSet)) errors.push('badgeSet must be an array')
  else for (const badge of style.badgeSet) if (!BADGE_IDS.has(badge)) errors.push(`badgeSet has unknown badge "${badge}"`)

  if (!Array.isArray(style.sections) || style.sections.length === 0) {
    errors.push('sections must be a non-empty array')
  } else {
    for (const section of style.sections) {
      if (!SECTION_IDS.has(section)) errors.push(`sections has unknown section "${section}"`)
    }
    if (!style.sections.includes('install')) warnings.push('sections has no "install" section')
  }

  if (!style.labels || typeof style.labels !== 'object') {
    errors.push('labels must be an object')
  } else {
    for (const [key, value] of Object.entries(style.labels)) {
      if (!SECTION_IDS.has(key)) warnings.push(`labels has unknown section key "${key}"`)
      if (!value || typeof value.zh !== 'string' || typeof value.en !== 'string') errors.push(`labels.${key} must have zh and en strings`)
    }
  }

  if (!Array.isArray(style.requiredFacts)) errors.push('requiredFacts must be an array')
  return { errors, warnings }
}

/**
 * Merge a style on top of the style it extends.
 * Nested copy objects merge key by key; arrays replace; `labels` merges.
 *
 * @param {any} base
 * @param {any} override
 * @returns {any}
 */
export function mergeStyle(base, override) {
  const merged = JSON.parse(JSON.stringify(base))
  for (const [key, value] of Object.entries(override)) {
    if (key === 'extends' || key === '$schema') continue
    if (key === 'palette' || key === 'label' || key === 'essence' || key === 'tone' || key === 'notes') {
      merged[key] = { ...(merged[key] ?? {}), ...(value ?? {}) }
    } else if (key === 'labels') {
      merged.labels = { ...(merged.labels ?? {}), ...(value ?? {}) }
    } else {
      merged[key] = value
    }
  }
  return merged
}
