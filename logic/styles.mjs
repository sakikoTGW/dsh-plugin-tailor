/**
 * Style registry.
 *
 * Styles are structured JSON, not code. Built-ins live in `styles/*.json`
 * inside the package; users can add their own as:
 *
 *   <repo>/.tailor/styles/*.json      per repository
 *   ~/.tailor/styles/*.json           per machine (or TAILOR_STYLES_DIR)
 *
 * A custom style may set `extends: "<style-id>"` and override only the fields
 * it wants; the loader merges, validates, and records where it came from.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { mergeStyle, validateStyle } from './style-schema.mjs'

const BUILTIN_DIR = fileURLToPath(new URL('../styles/', import.meta.url))

/** Legacy ids from earlier versions: accepted, never displayed. */
const LEGACY_ALIASES = new Map([
  ['resolver', 'evidence'],
  ['dsh-tui', 'terminal'],
  ['dsh-go', 'mobile'],
  ['bubbletea', 'playful'],
  ['sniffnet', 'product'],
  ['1panel', 'platform'],
  ['doomemacs', 'minimal'],
])

const STYLE_FILE = /^[a-z0-9-]+\.json$/i
const ID = /^[a-z][a-z0-9-]{1,31}$/
const SCHEMA_URL = 'https://raw.githubusercontent.com/sakikoTGW/dsh-plugin-tailor/main/styles/schema.json'

/**
 * Read one style JSON file.
 *
 * @param {string} file
 * @returns {any}
 */
function readStyleFile(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('style file must contain a JSON object')
  return raw
}

/**
 * Load every `*.json` style in one directory into the registry.
 *
 * @param {string} dir
 * @param {'builtin'|'global'|'repo'} origin
 * @param {Map<string, any>} registry
 * @param {Array<{ file: string, errors: string[] }>} errors
 * @param {{ strict?: boolean, builtinIds?: Set<string> }} [options]
 * @returns {any[]}
 */
function loadDir(dir, origin, registry, errors, options = {}) {
  if (!existsSync(dir)) return []
  const loaded = []
  const files = readdirSync(dir)
    .filter((entry) => STYLE_FILE.test(entry) && entry !== 'schema.json')
    .sort()
  for (const entry of files) {
    const file = join(dir, entry)
    let raw
    try {
      raw = readStyleFile(file)
    } catch (error) {
      errors.push({ file, errors: [`invalid JSON: ${error?.message ?? String(error)}`] })
      if (options.strict) throw new Error(`invalid built-in style ${entry}: ${error?.message ?? String(error)}`)
      continue
    }

    let style = raw
    if (typeof raw.extends === 'string' && raw.extends !== '') {
      if (!ID.test(raw.extends)) {
        errors.push({ file, errors: [`extends "${raw.extends}" is not a valid style id`] })
        continue
      }
      const base = registry.get(raw.extends)
      if (!base) {
        errors.push({ file, errors: [`extends "${raw.extends}" not found (load order: built-in → global → repo)`] })
        continue
      }
      style = mergeStyle(base, raw)
    }

    const { errors: validationErrors, warnings } = validateStyle(style, { builtinIds: options.builtinIds })
    for (const warning of warnings) {
      // Warnings are advisory; keep them out of the hard error list.
      errors.push({ file, errors: [], warnings: [warning] })
    }
    if (validationErrors.length > 0) {
      errors.push({ file, errors: validationErrors })
      if (options.strict) throw new Error(`invalid built-in style ${entry}: ${validationErrors.join('; ')}`)
      continue
    }

    Object.defineProperties(style, {
      _origin: { value: origin, enumerable: false },
      _file: { value: file, enumerable: false },
    })
    registry.set(style.id, style)
    loaded.push(style)
  }
  return loaded
}

/** Built-in registry, loaded and validated once at import time. */
const BUILTIN = (() => {
  const registry = new Map()
  const errors = []
  loadDir(BUILTIN_DIR, 'builtin', registry, errors, { strict: true })
  return { registry, errors, styles: [...registry.values()] }
})()

/** Built-in styles only (user styles are loaded by `loadStyles`). */
export const STYLES = BUILTIN.styles

/**
 * Load built-in + global + repository styles.
 *
 * @param {string} [root] repository root for `.tailor/styles`
 * @returns {{ styles: any[], byId: Map<string, any>, errors: Array<{ file: string, errors: string[], warnings?: string[] }>, dirs: { builtin: string, global: string, repo: string | null } }}
 */
export function loadStyles(root) {
  const registry = new Map(BUILTIN.registry)
  const errors = [...BUILTIN.errors]
  const builtinIds = new Set(BUILTIN.registry.keys())
  const globalDir = process.env.TAILOR_STYLES_DIR || join(homedir(), '.tailor', 'styles')
  loadDir(globalDir, 'global', registry, errors, { builtinIds })
  if (root) loadDir(join(resolve(root), '.tailor', 'styles'), 'repo', registry, errors, { builtinIds })
  return {
    styles: [...registry.values()],
    byId: registry,
    errors,
    dirs: { builtin: BUILTIN_DIR, global: globalDir, repo: root ? join(resolve(root), '.tailor', 'styles') : null },
  }
}

/**
 * Resolve a style id (with legacy aliases) against a registry, a repository
 * root, or the default registry.
 *
 * @param {string} id
 * @param {{ byId: Map<string, any> } | string} [registryOrRoot]
 * @returns {any}
 */
export function resolveStyle(id, registryOrRoot) {
  const registry = registryOrRoot && typeof registryOrRoot === 'object' && registryOrRoot.byId
    ? registryOrRoot
    : typeof registryOrRoot === 'string'
      ? loadStyles(registryOrRoot)
      : loadStyles()
  const target = LEGACY_ALIASES.get(id) ?? id
  const style = registry.byId.get(target)
  if (!style) {
    throw new Error(`unknown style "${id}" (available: ${registry.styles.map((item) => item.id).join(', ')})`)
  }
  return style
}

/**
 * Backwards-compatible getter: built-ins, global styles, legacy aliases.
 *
 * @param {string} id
 * @param {{ byId: Map<string, any> } | string} [registryOrRoot]
 * @returns {any}
 */
export function getStyle(id, registryOrRoot) {
  return resolveStyle(id, registryOrRoot)
}

/**
 * @param {{ byId: Map<string, any> } | string} [registryOrRoot]
 * @returns {string[]}
 */
export function styleIds(registryOrRoot) {
  const registry = registryOrRoot && typeof registryOrRoot === 'object' && registryOrRoot.byId
    ? registryOrRoot
    : typeof registryOrRoot === 'string'
      ? loadStyles(registryOrRoot)
      : loadStyles()
  return registry.styles.map((style) => style.id)
}

/**
 * What a style needs that this repository does not have yet.
 *
 * @param {any} style
 * @param {import('./facts.mjs').RepoFacts} facts
 * @returns {string[]}
 */
export function styleWarnings(style, facts) {
  const warnings = []
  const hasAsset = (name) => facts.assets.some((asset) => new RegExp(`${name}\\.(svg|png|gif|webp)$`, 'i').test(asset.path))
  if (style.hero !== 'none' && !hasAsset('logo') && !hasAsset('banner')) warnings.push('hero: no logo/banner asset yet (repo_brand can generate one)')
  if (style.demo === 'gif' && !facts.assets.some((asset) => asset.ext === '.gif')) warnings.push('demo: no GIF asset yet')
  if (style.demo === 'screenshot' && !facts.assets.some((asset) => ['.png', '.webp', '.jpg', '.jpeg'].includes(asset.ext))) warnings.push('demo: no screenshot asset yet')
  if (style.language === 'bilingual' && !facts.readmeEn.path) warnings.push('bilingual: README.en.md is missing')
  if (style.sections.includes('screenshots') && !facts.assets.some((asset) => ['.png', '.webp', '.gif'].includes(asset.ext))) warnings.push('screenshots: no image assets yet')
  return warnings
}

/**
 * Scaffold a custom style from an existing one.
 *
 * @param {string} root repository root
 * @param {{ id: string, extends?: string, force?: boolean, nameZh?: string, nameEn?: string }} options
 * @returns {{ path: string, id: string, base: string }}
 */
export function scaffoldStyle(root, options) {
  const id = String(options?.id ?? '').trim()
  if (!ID.test(id)) throw new Error('style id must match ^[a-z][a-z0-9-]{1,31}$')
  const extendsId = options?.extends ?? 'evidence'
  const registry = loadStyles(root)
  const base = resolveStyle(extendsId, registry)
  if (base.id === id) throw new Error('a style cannot extend itself')
  const targetDir = join(root, '.tailor', 'styles')
  const target = join(targetDir, `${id}.json`)
  if (existsSync(target) && options?.force !== true) throw new Error(`${target} already exists; pass force=true to overwrite`)
  mkdirSync(targetDir, { recursive: true })
  const data = {
    $schema: SCHEMA_URL,
    extends: base.id,
    id,
    label: {
      zh: options?.nameZh ?? `${base.label.zh} · 自定义`,
      en: options?.nameEn ?? `${base.label.en} · custom`,
    },
    essence: {
      zh: `${base.essence.zh}（自定义改版）`,
      en: `A custom variant of ${base.label.en}.`,
    },
    notes: {
      zh: '自定义风格：只写你要覆盖的字段，其余继承 extends。',
      en: 'Custom style: override only the fields you need; everything else is inherited.',
    },
  }
  writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return { path: target, id, base: base.id }
}
