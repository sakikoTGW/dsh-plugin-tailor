/**
 * Logic entry points. One function per tool, all returning `{ text }` so the
 * host shell only needs to render a string.
 */

import { buildBrand, applyBrand, CONCEPTS } from './brand.mjs'
import { collectFacts } from './facts.mjs'
import { formatPlan, planWork } from './plan.mjs'
import { applyReadme, previewReadme, renderBoth } from './readme.mjs'
import { auditFacts } from './rubric.mjs'
import { loadStyles, resolveStyle, styleWarnings } from './styles.mjs'
import { formatVerify, verifyRepo } from './verify.mjs'

const DEFAULT_STYLE = 'evidence'

/**
 * Style file origin as a short label.
 *
 * @param {any} style
 * @returns {string}
 */
function originOf(style) {
  return style?._origin ?? 'builtin'
}

/**
 * @param {any} style
 * @returns {string}
 */
function sourceOf(style) {
  return style?._origin === 'builtin' ? 'builtin' : `${style?._origin}:${style?._file ?? ''}`
}

/**
 * @param {any} ctx
 * @param {any} manager
 * @param {{ defaultStyle?: string }} options
 * @param {{ path?: string }} args
 */
export async function repoStyles(ctx, manager, options, args) {
  const path = args?.path ?? '.'
  const registry = loadStyles(path)
  const builtinCount = registry.styles.filter((style) => (style._origin ?? 'builtin') === 'builtin').length
  const custom = registry.styles.filter((style) => (style._origin ?? 'builtin') !== 'builtin')
  const lines = []
  lines.push(`repo_styles · ${registry.styles.length} presets (${builtinCount} built-in${custom.length > 0 ? ` + ${custom.length} custom` : ''})`)
  lines.push('')
  lines.push('id          language   hero      demo        origin      first screen')
  lines.push('----------  ---------  --------  ----------  ----------  ------------------------------------------')
  for (const style of registry.styles) {
    lines.push(`${style.id.padEnd(10)}  ${style.language.padEnd(9)}  ${style.hero.padEnd(8)}  ${style.demo.padEnd(10)}  ${originOf(style).padEnd(10)}  ${style.notes.zh}`)
  }
  lines.push('')
  for (const style of registry.styles) {
    lines.push(`## ${style.id} — ${style.label.zh} / ${style.label.en}`)
    lines.push(`essence: ${style.essence.zh}`)
    lines.push(`tone: ${style.tone.zh}`)
    lines.push(`sections: ${style.sections.join(' → ')}`)
    lines.push(`notes: ${style.notes.zh}`)
    lines.push('')
  }
  if (custom.length > 0) {
    lines.push('自定义风格（按仓库 → 全局覆盖内置）：')
    for (const style of custom) lines.push(`- ${style.id}  ${sourceOf(style)}`)
    lines.push('')
  }
  const errors = registry.errors.filter((entry) => entry.errors?.length > 0)
  if (errors.length > 0) {
    lines.push('无效的风格文件（已跳过）：')
    for (const entry of errors) lines.push(`- ${entry.file}: ${entry.errors.join('; ')}`)
    lines.push('')
  }
  lines.push(`仓库风格目录: ${registry.dirs.repo}（不存在时可用 style:init 创建）`)
  lines.push(`全局风格目录: ${registry.dirs.global}`)
  lines.push('新建自定义风格：node bin/tailor.mjs style:init --path=. --id=my-style --extends=evidence')
  lines.push('用法：repo_audit { path, style } → repo_plan → repo_readme --apply → repo_verify。')
  return { text: lines.join('\n').trimEnd() }
}

/**
 * @param {any} ctx
 * @param {any} manager
 * @param {{ defaultStyle?: string }} options
 * @param {{ path?: string, style?: string }} args
 */
export async function repoAudit(ctx, manager, options, args) {
  const path = args?.path ?? '.'
  const styleId = args?.style ?? options.defaultStyle ?? DEFAULT_STYLE
  const facts = collectFacts(path)
  const registry = loadStyles(facts.root)
  const style = resolveStyle(styleId, registry)
  const audit = auditFacts(facts, styleId, registry)
  const lines = []
  lines.push(`repo_audit · ${facts.name}${facts.version ? ` v${facts.version}` : ''} · style=${style.id} (${style.label.zh})`)
  lines.push(`path=${facts.root}`)
  lines.push(`score=${audit.score}/100 · grade=${audit.grade} · gaps=${audit.gaps.length}`)
  lines.push('')
  lines.push('维度                          权重  得分   通过')
  for (const dimension of audit.dimensions) {
    lines.push(`${`${dimension.label.zh} / ${dimension.label.en}`.padEnd(28)}  ${String(dimension.weight).padStart(4)}  ${String(dimension.score).padStart(5)}  ${dimension.passed}/${dimension.total}`)
  }
  lines.push('')
  if (audit.gaps.length > 0) {
    lines.push('优先修这些（按影响排序）：')
    for (const gap of audit.gaps.slice(0, 10)) {
      lines.push(`- [${gap.dimension}/${gap.check}] ${gap.fix}`)
      lines.push(`  现状：${gap.detail}`)
    }
    if (audit.gaps.length > 10) lines.push(`... 另有 ${audit.gaps.length - 10} 项，运行 repo_plan 看完整清单`)
  } else {
    lines.push('没有发现缺口。')
  }
  if (audit.styleWarnings.length > 0) {
    lines.push('')
    lines.push('风格缺口：')
    for (const warning of audit.styleWarnings) lines.push(`- ${warning}`)
  }
  lines.push('')
  lines.push(`下一步：repo_plan { path: "${path}", style: "${style.id}" }`)
  return { text: lines.join('\n') }
}

/**
 * @param {any} ctx
 * @param {any} manager
 * @param {{ defaultStyle?: string }} options
 * @param {{ path?: string, style?: string, limit?: number }} args
 */
export async function repoPlan(ctx, manager, options, args) {
  const path = args?.path ?? '.'
  const styleId = args?.style ?? options.defaultStyle ?? DEFAULT_STYLE
  const facts = collectFacts(path)
  const registry = loadStyles(facts.root)
  const style = resolveStyle(styleId, registry)
  const result = planWork(facts, style.id, registry)
  const lines = [formatPlan(facts, style.id, registry)]
  if (result.styleWarnings.length > 0) {
    lines.push('')
    lines.push('风格缺口：')
    for (const warning of result.styleWarnings) lines.push(`- ${warning}`)
  }
  return { text: lines.join('\n') }
}

/**
 * @param {any} ctx
 * @param {any} manager
 * @param {{ defaultStyle?: string }} options
 * @param {{ path?: string, style?: string, lang?: 'zh'|'en'|'both', apply?: boolean, force?: boolean }} args
 */
export async function repoReadme(ctx, manager, options, args) {
  const path = args?.path ?? '.'
  const styleId = args?.style ?? options.defaultStyle ?? DEFAULT_STYLE
  const lang = args?.lang ?? 'both'
  const facts = collectFacts(path)
  const registry = loadStyles(facts.root)
  const style = resolveStyle(styleId, registry)
  const lines = []
  if (args?.apply === true) {
    const result = applyReadme(facts.root, style.id, lang, { force: args?.force === true })
    lines.push(`repo_readme · ${facts.name} · style=${style.id} · apply=true`)
    lines.push(`written: ${result.written.length > 0 ? result.written.join(', ') : '(none)'}`)
    lines.push(`skipped: ${result.skipped.length > 0 ? result.skipped.join(', ') : '(none)'}`)
    lines.push(`todos: ${result.todos.length}`)
    if (result.diff) {
      lines.push('')
      lines.push(result.diff)
    }
    return { text: lines.join('\n').trimEnd() }
  }
  const langLines = lang === 'both' ? ['zh', 'en'] : [lang]
  for (const current of langLines) {
    const preview = previewReadme(facts.root, style.id, current)
    lines.push(`repo_readme · ${facts.name} · style=${style.id} · lang=${current} · dry-run`)
    lines.push('')
    lines.push(preview.diff)
    if (preview.todos.length > 0) {
      lines.push('')
      lines.push(`TODO(tailor) 有 ${preview.todos.length} 处，缺的事实不会被编造：`)
      for (const todo of preview.todos.slice(0, 10)) lines.push(`- ${todo}`)
    }
    lines.push('')
  }
  if (facts.git.present) lines.push(`git: branch=${facts.git.branch ?? '?'} clean=${facts.git.clean ?? '?'}`)
  lines.push('确认 diff 后加 apply: true 落盘（手写 README 默认拒绝，需 force: true）。')
  return { text: lines.join('\n').trimEnd() }
}

/**
 * @param {any} ctx
 * @param {any} manager
 * @param {{ defaultStyle?: string }} options
 * @param {{ path?: string, style?: string, concept?: string, tagline?: string, apply?: boolean, force?: boolean }} args
 */
export async function repoBrand(ctx, manager, options, args) {
  const path = args?.path ?? '.'
  const styleId = args?.style ?? options.defaultStyle ?? DEFAULT_STYLE
  const facts = collectFacts(path)
  const registry = loadStyles(facts.root)
  const style = resolveStyle(styleId, registry)
  const conceptId = args?.concept ?? style.mark
  const concept = CONCEPTS.find((item) => item.id === conceptId)
  if (!concept) throw new Error(`unknown concept "${conceptId}" (available: ${CONCEPTS.map((item) => item.id).join(', ')})`)
  const lines = []
  if (args?.apply === true) {
    const result = applyBrand(facts.root, style.id, { force: args?.force === true, concept: concept.id, tagline: args?.tagline })
    lines.push(`repo_brand · ${facts.name} · style=${style.id} · concept=${concept.id} · apply=true`)
    lines.push(`written: ${result.written.length > 0 ? result.written.join(', ') : '(none)'}`)
    lines.push(`skipped: ${result.skipped.length > 0 ? result.skipped.join(', ') : '(none)'}`)
    return { text: lines.join('\n') }
  }
  const files = buildBrand(facts, style, concept.id, { tagline: args?.tagline })
  lines.push(`repo_brand · ${facts.name} · style=${style.id} · dry-run (nothing written)`)
  lines.push(`palette: ${style.palette.brand} / ${style.palette.deep} / ${style.palette.ink}`)
  lines.push(`concept: ${concept.id} (${concept.en} · ${concept.zh})${args?.concept ? ' — explicit' : ` — default for ${style.id}`}`)
  lines.push('')
  lines.push(`files (${Object.keys(files).length}):`)
  for (const [file, content] of Object.entries(files)) lines.push(`- ${file} (${content.length} chars)`)
  lines.push('')
  lines.push('concepts:')
  for (const item of CONCEPTS) lines.push(`- ${item.id.padEnd(9)} ${item.zh} · ${item.en} · ${item.fit}`)
  lines.push('')
  lines.push('apply: node bin/tailor.mjs brand . --style=' + style.id + ' --concept=<id> --apply')
  return { text: lines.join('\n') }
}

/**
 * @param {any} ctx
 * @param {any} manager
 * @param {{ defaultStyle?: string }} options
 * @param {{ path?: string, style?: string }} args
 */
export async function repoVerify(ctx, manager, options, args) {
  const path = args?.path ?? '.'
  const styleId = args?.style ?? options.defaultStyle ?? DEFAULT_STYLE
  const result = verifyRepo(path, styleId)
  return { text: formatVerify(result) }
}

/**
 * Render both language drafts without writing (used by tests and the CLI).
 *
 * @param {string} path
 * @param {string} styleId
 */
export function renderPreviews(path, styleId) {
  const facts = collectFacts(path)
  const registry = loadStyles(facts.root)
  const style = resolveStyle(styleId, registry)
  const both = renderBoth(facts, style.id, registry)
  return { facts, style, ...both }
}
