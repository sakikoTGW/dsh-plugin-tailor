/**
 * Turn audit gaps into an ordered, verifiable task list.
 *
 * Ordering: P0 (identity / first screen / install) → P1 (docs / evidence /
 * release) → P2 (community / brand), then by weight. Every task ends with the
 * command that proves it is done.
 */

import { auditFacts, dimensionLabel } from './rubric.mjs'
import { getStyle } from './styles.mjs'

const PRIORITY_BY_DIMENSION = {
  identity: 'P0',
  'first-screen': 'P0',
  install: 'P0',
  docs: 'P1',
  evidence: 'P1',
  release: 'P1',
  community: 'P2',
  brand: 'P2',
}

const VERIFY_COMMAND = (styleId) => `node bin/tailor.mjs verify . --style=${styleId}`

/**
 * @typedef {{ id: string, priority: 'P0'|'P1'|'P2', title: { zh: string, en: string }, why: string, steps: string[], acceptance: string, verify: string, dimension: string }} Task
 */

/**
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {string} styleId
 * @returns {{ style: string, tasks: Task[], styleWarnings: string[], audit: ReturnType<typeof auditFacts> }}
 */
export function planWork(facts, styleId = 'resolver') {
  const style = getStyle(styleId)
  const audit = auditFacts(facts, styleId)
  /** @type {Task[]} */
  const tasks = []

  for (const gap of audit.gaps) {
    const priority = PRIORITY_BY_DIMENSION[gap.dimension] ?? 'P2'
    const label = gap.dimensionLabel
    tasks.push({
      id: `fix-${gap.dimension}-${gap.check}`,
      priority,
      dimension: gap.dimension,
      title: {
        zh: `${label.zh} · ${gap.check}：${gap.fix.replace(/。$/, '')}`,
        en: `${label.en} · ${gap.check}: ${gap.fix}`,
      },
      why: `${gap.detail}（${label.zh} ${audit.dimensions.find((dimension) => dimension.id === gap.dimension)?.score ?? 0}/100）`,
      steps: [
        `检查现状：${gap.detail}`,
        `执行修改：${gap.fix}`,
        `重跑审计，确认 ${gap.dimension}/${gap.check} 变为通过`,
      ],
      acceptance: gap.fix,
      verify: VERIFY_COMMAND(styleId),
    })
  }

  // Style-specific preparation, independent of the rubric.
  const warnings = audit.styleWarnings
  if (warnings.some((warning) => warning.includes('repo_brand'))) {
    tasks.push({
      id: 'brand-assets',
      priority: 'P2',
      dimension: 'brand',
      title: { zh: '生成品牌素材（logo / banner / social）', en: 'Generate brand assets (logo / banner / social)' },
      why: `选中的 ${style.label.zh} 风格以视觉锚点开场，但仓库里还没有 logo/banner。`,
      steps: ['运行 repo_brand（先 dry-run 看文件清单）', '检查 SVG 在浅色/深色背景下都可读', '确认后再 apply，提交 assets/'],
      acceptance: 'assets/ 下出现 logo.svg、icon.svg、banner.svg、social-preview.svg，README 首屏引用成功。',
      verify: `${VERIFY_COMMAND(styleId)}`,
    })
  }
  if (warnings.some((warning) => warning.includes('GIF'))) {
    tasks.push({
      id: 'demo-gif',
      priority: 'P1',
      dimension: 'brand',
      title: { zh: '录一支真实输出的 demo GIF', en: 'Record a demo GIF from real output' },
      why: `${style.label.zh} 的首屏是一支 GIF：它证明"能跑"，比截图更难伪造。`,
      steps: ['跑一条最短的真实命令并保存日志', '用 VHS tape（或脚本）从日志渲染终端 GIF', '放进 assets/demo.gif，图注写宿主版本与日期'],
      acceptance: 'assets/demo.gif 存在，README 引用它，图注写明捕获时间和版本。',
      verify: `${VERIFY_COMMAND(styleId)}`,
    })
  }
  if (warnings.some((warning) => warning.includes('screenshots'))) {
    tasks.push({
      id: 'screenshots',
      priority: 'P1',
      dimension: 'brand',
      title: { zh: '补真实截图（界面 / 输出 / 市场页）', en: 'Capture real screenshots (UI / output / listing)' },
      why: `${style.label.zh} 已规划截图区，但没有可用图片。`,
      steps: ['启动真实环境截取界面或工具输出', '裁掉无关桌面内容，保留可读的文字', '放进 assets/ 并在 README 图注写日期'],
      acceptance: 'README 截图区至少有 2 张真实图片，不是占位图。',
      verify: `${VERIFY_COMMAND(styleId)}`,
    })
  }
  if (warnings.some((warning) => warning.includes('README.en.md'))) {
    tasks.push({
      id: 'bilingual',
      priority: 'P1',
      dimension: 'docs',
      title: { zh: '补一份对等的英文 README', en: 'Add an equal English README' },
      why: `${style.label.zh} 是双语结构，但只有一份 README。`,
      steps: ['用 repo_readme --lang=en 生成英文草稿', '人工校对术语与数字', '两页顶部互相链接'],
      acceptance: 'README.md 与 README.en.md 章节结构对等、数字一致、互相链接。',
      verify: `${VERIFY_COMMAND(styleId)}`,
    })
  }

  tasks.push({
    id: 'adopt-style',
    priority: 'P1',
    dimension: 'first-screen',
    title: { zh: `按 ${style.label.zh} 风格重排 README`, en: `Reformat the README in the ${style.label.en} style` },
    why: `${style.essence.zh}`,
    steps: ['repo_readme --dry-run 看 diff', '确认数字与限制没有被改写成宣传语', 'apply 后本地渲染检查首屏与锚点'],
    acceptance: `README 结构符合 ${style.id} 预设，链接/锚点检查全过。`,
    verify: `${VERIFY_COMMAND(styleId)}`,
  })

  const priorityRank = { P0: 0, P1: 1, P2: 2 }
  tasks.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.dimension.localeCompare(b.dimension))

  return { style: style.id, tasks, styleWarnings: warnings, audit }
}

/**
 * Human-readable task list.
 *
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {string} styleId
 * @returns {string}
 */
export function formatPlan(facts, styleId = 'resolver') {
  const { tasks, audit } = planWork(facts, styleId)
  const lines = []
  lines.push(`repo_plan · ${facts.name} · style=${styleId} · score=${audit.score} (${audit.grade})`)
  lines.push(`gaps=${audit.gaps.length} · tasks=${tasks.length}`)
  lines.push('')
  for (const task of tasks) {
    lines.push(`[${task.priority}] ${task.id}`)
    lines.push(`  ${task.title.zh}`)
    lines.push(`  why: ${task.why}`)
    lines.push(`  acceptance: ${task.acceptance}`)
    lines.push(`  verify: ${task.verify}`)
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}
