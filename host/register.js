/**
 * Host shell: tool schemas and one cache-busted import of the reloadable logic
 * entry. Only this file needs a host restart to change; `logic/` is live on the
 * next call.
 *
 * @module dsh-plugin-tailor/host/register
 */

import { statSync } from 'node:fs'

const LOGIC_DIR = new URL('../logic/', import.meta.url)

const LOGIC_FILES = ['api.js', 'facts.mjs', 'rubric.mjs', 'plan.mjs', 'styles.mjs', 'readme.mjs', 'brand.mjs', 'verify.mjs', 'util.mjs']

const TOOL_TIMEOUT_MS = 60_000

/**
 * @returns {string}
 */
export function logicVersion() {
  let newest = 0
  for (const file of LOGIC_FILES) {
    try {
      const stat = statSync(new URL(file, LOGIC_DIR))
      if (stat.mtimeMs > newest) newest = stat.mtimeMs
    } catch {
      // a missing file cannot raise the version
    }
  }
  return String(Math.round(newest))
}

/**
 * @returns {Promise<any>}
 */
export async function loadLogic() {
  const url = new URL('api.js', LOGIC_DIR)
  url.searchParams.set('v', logicVersion())
  return await import(url.href)
}

/**
 * @param {any} ctx Cordis context
 * @param {{ defaultStyle?: string, maxScanFiles?: number }} options
 * @returns {Array<() => void>}
 */
export function registerTools(ctx, options) {
  const disposers = []
  /** @param {any} definition */
  const add = (definition) => {
    const dispose = ctx.tools.register({
      ...definition,
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: { text: { type: 'string' } },
          required: ['text'],
        },
        render: (_args, value) => [{ type: 'text', text: typeof value?.text === 'string' ? value.text : '' }],
      },
    })
    if (typeof dispose === 'function') disposers.push(dispose)
  }

  const run = async (method, args) => {
    try {
      const logic = await loadLogic()
      const fn = logic[method]
      if (typeof fn !== 'function') throw new Error(`logic entry does not export ${method}`)
      return await fn(ctx, ctx.get?.('pluginManager'), options, args ?? {})
    } catch (error) {
      return { text: `${method} failed: ${error?.message ?? String(error)}` }
    }
  }

  add({
    name: 'repo_styles',
    description:
      'List the README style presets repo_readme can render: resolver (evidence-first bilingual), dsh-tui (centered logo bilingual), dsh-go (mobile/community), bubbletea (GIF-first tutorial), sniffnet (product banner), 1panel (centered brand i18n) and doomemacs (minimal type). Read-only.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    execute: (args) => run('repoStyles', args ?? {}),
  })

  add({
    name: 'repo_audit',
    description:
      'Audit a repository across 8 maturity dimensions (identity, first screen, install, docs, evidence, release, community, brand). Returns a 0-100 score, per-dimension breakdown and a prioritized gap list. Read-only.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        path: { type: 'string', description: 'Repository path. Defaults to the current working directory.' },
        style: { type: 'string', description: 'Style preset to judge against (see repo_styles). Defaults to resolver.' },
      },
      required: ['path'],
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    execute: (args) => run('repoAudit', args),
  })

  add({
    name: 'repo_plan',
    description:
      'Turn the audit gaps into an ordered task list (P0/P1/P2) with explicit acceptance criteria, style-specific prep tasks and the verify command for each task. Read-only.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        path: { type: 'string', description: 'Repository path.' },
        style: { type: 'string', description: 'Style preset.' },
        limit: { type: 'number', description: 'Maximum tasks with full steps, 1-50. Defaults to 20.' },
      },
      required: ['path'],
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    execute: (args) => run('repoPlan', args),
  })

  add({
    name: 'repo_readme',
    description:
      'Draft a README for the chosen style from repository facts, or apply it. Dry-run by default and prints the diff; apply refuses to overwrite hand-written READMEs or a dirty worktree unless force=true. Missing facts become visible TODO markers, never invented claims.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        path: { type: 'string', description: 'Repository path.' },
        style: { type: 'string', description: 'Style preset (see repo_styles).' },
        lang: { type: 'string', enum: ['zh', 'en', 'both'], description: 'Which language page(s) to draft. Defaults to zh.' },
        apply: { type: 'boolean', description: 'Write the draft. Defaults to false (dry-run).' },
        force: { type: 'boolean', description: 'Overwrite an existing hand-written README or a dirty worktree.' },
      },
      required: ['path'],
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    execute: (args) => run('repoReadme', args),
  })

  add({
    name: 'repo_brand',
    description:
      'Generate deterministic brand assets for the chosen style: icon, logo, banner and social preview as SVG, plus assets/README.md. Dry-run by default; apply skips existing files unless force=true.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        path: { type: 'string', description: 'Repository path.' },
        style: { type: 'string', description: 'Style preset (palette and mark come from it).' },
        apply: { type: 'boolean', description: 'Write the assets. Defaults to false (dry-run).' },
        force: { type: 'boolean', description: 'Overwrite existing asset files.' },
      },
      required: ['path'],
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    execute: (args) => run('repoBrand', args),
  })

  add({
    name: 'repo_verify',
    description:
      'Re-run the audit plus link, anchor, image, badge and required-section checks. Reports PASS/FAIL, leftover TODO markers and the score delta against the baseline saved by repo_readme --apply. Read-only.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        path: { type: 'string', description: 'Repository path.' },
        style: { type: 'string', description: 'Style preset.' },
      },
      required: ['path'],
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    execute: (args) => run('repoVerify', args),
  })

  return disposers
}
