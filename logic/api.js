/**
 * Logic entry points. One function per tool, all returning `{ text }` so the
 * host shell only needs to render a string.
 */

import { buildBrand, applyBrand, CONCEPTS } from './brand.mjs'
import { collectFacts } from './facts.mjs'
import { formatPlan, planWork } from './plan.mjs'
import { applyReadme, previewReadme, renderBoth } from './readme.mjs'
import { auditFacts } from './rubric.mjs'
import { getStyle, STYLES, styleIds, styleWarnings } from './styles.mjs'
import { formatVerify, verifyRepo } from './verify.mjs'

/**
 * @param {any} ctx
 * @param {any} manager
 * @param {{ defaultStyle?: string }} options
 * @param {{ path?: string, style?: string }} args
 */
export async function repoStyles(ctx, manager, options, args) {
  const lines = []
  lines.push(`repo_styles · ${STYLES.length} presets`)
  lines.push('')
  lines.push('id          language   hero      demo        first screen')
  lines.push('----------  ---------  --------  ----------  ------------------------------------------')
  for (const style of STYLES) {
    lines.push(`${style.id.padEnd(10)}  ${style.language.padEnd(9)}  ${style.hero.padEnd(8)}  ${style.demo.padEnd(10)}  ${style.notes.zh}`)
  }
  lines.push('')
  for (const style of STYLES) {
    lines.push(`## ${style.id} — ${style.label.zh} / ${style.label.en}`)
    lines.push(`essence: ${style.essence.zh}`)
    lines.push(`tone: ${style.tone.zh}`)
    lines.push(`sections: ${style.sections.join(' → ')}`)
    lines.push(`notes: ${style.notes.zh}`)
    lines.push('')
  }
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
  const styleId = args?.style ?? options.defaultStyle ?? 'resolver'
  const facts = collectFacts(path)
  const style = getStyle(styleId)
  const audit = auditFacts(facts, styleId)
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
  const styleId = args?.style ?? options.defaultStyle ?? 'resolver'
  const facts = collectFacts(path)
  const plan = planWork(facts, styleId)
  const limit = Number.isFinite(args?.limit) ? Math.max(1, Math.min(50, Number(args.limit))) : 20
  const lines = [formatPlan(facts, styleId)]
  lines.push('')
  lines.push('---')
  lines.push('完整步骤：')
  for (const task of plan.tasks.slice(0, limit)) {
    lines.push('')
    lines.push(`[${task.priority}] ${task.title.zh}`)
    for (const step of task.steps) lines.push(`  - ${step}`)
  }
  return { text: lines.join('\n') }
}

/**
 * @param {any} ctx
 * @param {any} manager
 * @param {{ defaultStyle?: string }} options
 * @param {{ path?: string, style?: string, lang?: string, apply?: boolean, force?: boolean }} args
 */
export async function repoReadme(ctx, manager, options, args) {
  const path = args?.path ?? '.'
  const styleId = args?.style ?? options.defaultStyle ?? 'resolver'
  const lang = args?.lang === 'en' || args?.lang === 'both' ? args.lang : 'zh'
  const apply = args?.apply === true
  const force = args?.force === true
  const style = getStyle(styleId)

  if (apply) {
    const result = applyReadme(path, styleId, lang, { force })
    const lines = []
    lines.push(`repo_readme · ${style.id} · lang=${lang} · applied`)
    lines.push(result.written.length > 0 ? `written: ${result.written.join(', ')}` : 'written: (none, already up to date)')
    if (result.skipped.length > 0) lines.push(`unchanged: ${result.skipped.join(', ')}`)
    if (result.warnings.length > 0) {
      lines.push('style gaps:')
      for (const warning of result.warnings) lines.push(`- ${warning}`)
    }
    if (result.todos.length > 0) {
      lines.push(`TODO markers: ${result.todos.length} (see the comment block at the end of the README)`)
    }
    lines.push('')
    lines.push(`next: node bin/tailor.mjs verify . --style=${style.id}`)
    return { text: lines.join('\n') }
  }

  const preview = previewReadme(path, styleId, lang)
  const lines = []
  lines.push(`repo_readme · ${style.id} · lang=${lang} · dry-run (nothing written)`)
  lines.push(`target: ${lang === 'zh' ? 'README.md' : 'README.en.md'} · existing=${preview.existing}`)
  if (preview.warnings.length > 0) {
    lines.push('style gaps:')
    for (const warning of preview.warnings) lines.push(`- ${warning}`)
  }
  lines.push('')
  lines.push('--- diff ---')
  lines.push(preview.diff.split('\n').slice(0, 160).join('\n'))
  if (preview.diff.split('\n').length > 160) lines.push('… (diff truncated)')
  lines.push('')
  if (preview.todos.length > 0) {
    lines.push('TODO markers:')
    for (const todo of preview.todos) lines.push(`- ${todo}`)
  }
  lines.push('')
  lines.push(`apply: node bin/tailor.mjs readme . --style=${style.id} --lang=${lang} --apply`)
  return { text: lines.join('\n') }
}

/**
 * @param {any} ctx
 * @param {any} manager
 * @param {{ defaultStyle?: string }} options
 * @param {{ path?: string, style?: string, concept?: string, tagline?: string, apply?: boolean, force?: boolean }} args
 */
export async function repoBrand(ctx, manager, options, args) {
  const path = args?.path ?? '.'
  const styleId = args?.style ?? options.defaultStyle ?? 'resolver'
  const style = getStyle(styleId)
  const facts = collectFacts(path)
  const concept = args?.concept
  const tagline = typeof args?.tagline === 'string' && args.tagline.trim() !== '' ? args.tagline.trim() : undefined

  if (args?.apply === true) {
    const result = applyBrand(path, styleId, { force: args?.force === true, concept, tagline })
    const lines = []
    lines.push(`repo_brand · ${facts.name} · style=${style.id} · concept=${result.concept} · applied`)
    lines.push(result.written.length > 0 ? `written: ${result.written.join(', ')}` : 'written: (none)')
    if (result.skipped.length > 0) lines.push(`skipped (already exists, use --force to overwrite): ${result.skipped.join(', ')}`)
    return { text: lines.join('\n') }
  }

  const files = buildBrand(facts, style, concept, { tagline })
  const warnings = styleWarnings(style, facts)
  const lines = []
  lines.push(`repo_brand · ${facts.name} · style=${style.id} · dry-run (nothing written)`)
  lines.push(`palette: ${style.palette.brand} / ${style.palette.deep} / ${style.palette.ink}`)
  lines.push(`concept: ${concept ?? style.mark} (default for this style)`)
  lines.push('')
  lines.push('files (8):')
  for (const [relPath, content] of Object.entries(files)) {
    lines.push(`- ${relPath} (${content.length} chars)`)
  }
  lines.push('')
  lines.push('concepts:')
  for (const item of CONCEPTS) {
    lines.push(`- ${item.id} — ${item.label.zh} / ${item.label.en} · ${item.fit}`)
  }
  lines.push('')
  lines.push(`apply: node bin/tailor.mjs brand . --style=${style.id} --concept=<id> --apply`)
  if (warnings.length > 0) {
    lines.push('')
    lines.push('style gaps:')
    for (const warning of warnings) lines.push(`- ${warning}`)
  }
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
  const styleId = args?.style ?? options.defaultStyle ?? 'resolver'
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
  const style = getStyle(styleId)
  const both = renderBoth(facts, style.id)
  return { facts, style, ...both }
}
