/**
 * dsh-plugin-tailor — host half.
 *
 * Six read-mostly tools that turn "make this repository look and read like a
 * mature project" into an auditable pipeline:
 *
 * - `repo_styles`  list the README style presets and what each one copies
 * - `repo_audit`   score a repository across 8 maturity dimensions
 * - `repo_plan`    turn the gaps into an ordered task list with acceptance
 * - `repo_readme`  draft a bilingual README for the chosen style, preview the diff
 * - `repo_brand`   generate deterministic logo / icon / banner / social SVGs
 * - `repo_verify`  re-run the audit plus link, anchor and image checks
 *
 * The plugin owns no service. Tool schemas live in `host/register.js` (stable);
 * decision logic lives under `logic/` and is re-imported with a cache-busted
 * URL on every call, so logic edits take effect without a host restart.
 *
 * @module dsh-plugin-tailor
 */

import { registerTools } from './host/register.js'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'plugin-tailor'

/** Services required by this plugin. */
export const inject = ['tools']

/**
 * Mount the tailor tools.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {Record<string, unknown> | undefined} config
 * @returns {void}
 */
export function apply(ctx, config) {
  const options = normalizeConfig(config)
  ctx.effect(() => {
    const disposers = registerTools(ctx, options)
    return () => {
      for (const dispose of disposers) dispose()
    }
  }, 'plugin-tailor: tools')
}

/**
 * @param {Record<string, unknown> | undefined} config
 * @returns {{defaultStyle?: string, maxScanFiles?: number}}
 */
function normalizeConfig(config) {
  const value = config ?? {}
  /** @type {{defaultStyle?: string, maxScanFiles?: number}} */
  const options = {}
  if (typeof value.defaultStyle === 'string' && value.defaultStyle !== '') options.defaultStyle = value.defaultStyle
  if (Number.isFinite(value.maxScanFiles) && value.maxScanFiles > 0) options.maxScanFiles = Number(value.maxScanFiles)
  return options
}
