/**
 * Maturity rubric: eight dimensions, explicit checks, no hidden scoring.
 *
 * The score is only a navigation aid. Every failed check carries the concrete
 * fix and the file it refers to, and `repo_plan` turns those into tasks.
 */

import { STYLES, getStyle } from './styles.mjs'

/**
 * @typedef {{ id: string, label: { zh: string, en: string }, weight: number, checks: Array<{ id: string, pass: (facts: any) => boolean, detail: (facts: any) => string, fix: string }> }} Dimension
 */

/** @type {Dimension[]} */
export const DIMENSIONS = [
  {
    id: 'identity',
    label: { zh: '身份', en: 'Identity' },
    weight: 10,
    checks: [
      { id: 'name', pass: (facts) => Boolean(facts.name), detail: (facts) => `name=${facts.name}`, fix: '在 package.json（或等价清单）里写明项目名。' },
      { id: 'description', pass: (facts) => facts.description.length >= 20, detail: (facts) => `description 长度 ${facts.description.length}`, fix: '写一句 20 字以上的定位句：给谁、解决什么、和替代品的差别。' },
      { id: 'license', pass: (facts) => Boolean(facts.license), detail: (facts) => `license=${facts.license ?? 'missing'}`, fix: '加 LICENSE 文件并在清单里声明 license。' },
      { id: 'repo', pass: (facts) => Boolean(facts.repo || facts.homepage), detail: (facts) => `repo=${facts.repo ?? facts.homepage ?? 'missing'}`, fix: '在清单里补 repository / homepage，让 README 和包页能互相跳转。' },
    ],
  },
  {
    id: 'first-screen',
    label: { zh: '首屏', en: 'First screen' },
    weight: 15,
    checks: [
      { id: 'readme', pass: (facts) => Boolean(facts.readme.path), detail: (facts) => (facts.readme.path ? facts.readme.path : 'README missing'), fix: '先有 README：一句定位 + 一张图/徽章 + 安装命令。' },
      { id: 'visual', pass: (facts) => facts.readme.images > 0 || facts.readme.badges > 0, detail: (facts) => `images=${facts.readme.images}, badges=${facts.readme.badges}`, fix: '首屏至少给一个视觉锚点：logo、banner、demo GIF 或一排徽章。' },
      { id: 'tagline', pass: (facts) => facts.readme.firstParagraph.length >= 20 || facts.description.length >= 20, detail: (facts) => `first paragraph ${facts.readme.firstParagraph.length} chars`, fix: '把定位句放在 H1 下面第一段，不要藏在徽章或图片后面。' },
      { id: 'install-up-front', pass: (facts) => facts.hasInstallDocs || facts.sections.install, detail: (facts) => `install docs=${facts.hasInstallDocs}`, fix: '安装命令要在首屏或第一屏内可见，不要只写在 docs/ 里。' },
    ],
  },
  {
    id: 'install',
    label: { zh: '安装与上手', en: 'Install' },
    weight: 15,
    checks: [
      { id: 'manifest', pass: (facts) => Boolean(facts.packageJson), detail: (facts) => (facts.packagePath ? facts.packagePath : 'no package.json'), fix: '补 package.json（或对应语言的清单），声明入口、版本和 engines。' },
      { id: 'install-docs', pass: (facts) => facts.hasInstallDocs, detail: (facts) => `install docs=${facts.hasInstallDocs}`, fix: '写一条可复制的安装命令：npm/dsh plugin/其他包管理器。' },
      { id: 'engines', pass: (facts) => Boolean(facts.engines.node || facts.engines.dsh), detail: (facts) => `engines=${JSON.stringify(facts.engines)}`, fix: '声明运行环境（Node / DSH / 平台），别让用户猜。' },
      { id: 'entry', pass: (facts) => facts.bins.length > 0 || Boolean(facts.scripts.test), detail: (facts) => `bins=${facts.bins.join(',') || 'none'}`, fix: '给出一个可执行入口（bin）或至少 test 脚本，让"装完能跑"可验证。' },
    ],
  },
  {
    id: 'docs',
    label: { zh: '文档', en: 'Documentation' },
    weight: 15,
    checks: [
      { id: 'headings', pass: (facts) => facts.readme.headings.length >= 5, detail: (facts) => `${facts.readme.headings.length} headings`, fix: 'README 至少 5 个二级标题：安装、用法、配置、限制、反馈。' },
      { id: 'features', pass: (facts) => facts.sections.features, detail: (facts) => `features section=${facts.sections.features}`, fix: '加「功能 / Highlights」小节，用可扫读的列表。' },
      { id: 'usage', pass: (facts) => facts.sections.usage, detail: (facts) => `usage section=${facts.sections.usage}`, fix: '加「用法 / Usage」小节：最小可运行示例。' },
      { id: 'changelog', pass: (facts) => Boolean(facts.files.changelog), detail: (facts) => `changelog=${facts.files.changelog ?? 'missing'}`, fix: '加 CHANGELOG.md，版本变化有地方可查。' },
      { id: 'docs-dir', pass: (facts) => Boolean(facts.docs.dir) || facts.docs.files.length > 0, detail: (facts) => `docs dir=${facts.docs.dir ?? 'missing'}`, fix: '长文档放 docs/，README 只留入口和最短路径。' },
    ],
  },
  {
    id: 'evidence',
    label: { zh: '证据', en: 'Evidence' },
    weight: 20,
    checks: [
      { id: 'tests', pass: (facts) => Boolean(facts.tests.dir) || Boolean(facts.scripts.test), detail: (facts) => `tests=${facts.tests.dir ?? 'missing'}, test script=${facts.scripts.test ?? 'missing'}`, fix: '加测试：判断变测试，效果变基准。' },
      { id: 'benchmark', pass: (facts) => Boolean(facts.files.benchmark) || facts.numbers.length >= 2, detail: (facts) => `benchmark=${facts.files.benchmark ?? 'missing'}, numbers=${facts.numbers.length}`, fix: '加 BENCHMARK.md 或引用真实测量数字（并写清口径）。' },
      { id: 'limitations', pass: (facts) => facts.sections.limitations, detail: (facts) => `limitations=${facts.sections.limitations}`, fix: '写「已知限制」：做不到什么、什么情况下不适用。' },
      { id: 'ci', pass: (facts) => facts.workflows.length > 0, detail: (facts) => `workflows=${facts.workflows.length}`, fix: '加 CI：每次 push 跑测试，README 用 workflow badge 展示。' },
      { id: 'test-count', pass: (facts) => Boolean(facts.testCount), detail: (facts) => `test count=${facts.testCount ?? 'unknown'}`, fix: '在 README/BENCHMARK 里写清测试数量，并保证与实际一致。' },
    ],
  },
  {
    id: 'release',
    label: { zh: '发布', en: 'Release' },
    weight: 10,
    checks: [
      { id: 'version', pass: (facts) => Boolean(facts.version), detail: (facts) => `version=${facts.version ?? 'missing'}`, fix: '声明版本号，遵循 SemVer。' },
      { id: 'tags', pass: (facts) => facts.git.tags.length > 0 || Boolean(facts.files.changelog), detail: (facts) => `tags=${facts.git.tags.length}, changelog=${Boolean(facts.files.changelog)}`, fix: '发布要有 tag（vX.Y.Z）或 CHANGELOG 记录。' },
      { id: 'files-field', pass: (facts) => Array.isArray(facts.packageJson?.files) && facts.packageJson.files.length > 0, detail: (facts) => `files=${Array.isArray(facts.packageJson?.files) ? facts.packageJson.files.length : 'missing'}`, fix: '在清单里写 files，控制发布包内容，避免把测试/截图塞进包。' },
      { id: 'publishing-doc', pass: (facts) => Boolean(facts.files.publishing), detail: (facts) => `publishing doc=${facts.files.publishing ?? 'missing'}`, fix: '加 PUBLISHING.md：发布步骤、registry、tag 规则、回滚方式。' },
    ],
  },
  {
    id: 'community',
    label: { zh: '社区与安全', en: 'Community' },
    weight: 10,
    checks: [
      { id: 'contributing', pass: (facts) => Boolean(facts.files.contributing), detail: (facts) => `contributing=${facts.files.contributing ?? 'missing'}`, fix: '加 CONTRIBUTING.md：怎么提 Issue、怎么跑测试、PR 规则。' },
      { id: 'security', pass: (facts) => Boolean(facts.files.security) || Boolean(facts.files.codeOfConduct), detail: (facts) => `security=${facts.files.security ?? 'missing'}`, fix: '加 SECURITY.md（私密报告渠道）或 CODE_OF_CONDUCT.md。' },
      { id: 'feedback', pass: (facts) => Boolean(facts.repo) || Boolean(facts.packageJson?.bugs), detail: (facts) => `feedback=${facts.repo ?? 'missing'}`, fix: '给出反馈入口：Issues 链接或讨论区。' },
      { id: 'templates', pass: (facts) => facts.templates.issue.length > 0 || Boolean(facts.templates.pr), detail: (facts) => `issue templates=${facts.templates.issue.length}, pr=${Boolean(facts.templates.pr)}`, fix: '加 Issue / PR 模板，减少来回问。' },
    ],
  },
  {
    id: 'brand',
    label: { zh: '品牌与素材', en: 'Brand' },
    weight: 5,
    checks: [
      { id: 'logo', pass: (facts) => facts.assets.some((asset) => /logo\.(svg|png)$/i.test(asset.path)), detail: (facts) => `logo=${facts.assets.some((asset) => /logo\.(svg|png)$/i.test(asset.path))}`, fix: '加 logo.svg，README 首屏与社交头像共用。' },
      { id: 'banner', pass: (facts) => facts.assets.some((asset) => /banner\.(svg|png)$/i.test(asset.path)), detail: (facts) => `banner=${facts.assets.some((asset) => /banner\.(svg|png)$/i.test(asset.path))}`, fix: '加 banner（1280×400 左右），发布帖和社交预览复用。' },
      { id: 'demo', pass: (facts) => facts.assets.some((asset) => ['.gif', '.webp', '.png'].includes(asset.ext)), detail: (facts) => `demo assets=${facts.assets.filter((asset) => ['.gif', '.webp', '.png'].includes(asset.ext)).length}`, fix: '录一支真实输出的 demo GIF 或准备真实截图。' },
      { id: 'readme-assets', pass: (facts) => facts.readme.images >= 3, detail: (facts) => `readme images=${facts.readme.images}`, fix: 'README 至少用 3 处图：首屏、证据、市场/截图。' },
    ],
  },
]

/** @param {string} dimensionId */
export function dimensionLabel(dimensionId) {
  const dimension = DIMENSIONS.find((item) => item.id === dimensionId)
  return dimension ? dimension.label : { zh: dimensionId, en: dimensionId }
}

/**
 * Audit a repository's facts.
 *
 * @param {import('./facts.mjs').RepoFacts} facts
 * @param {string} styleId
 * @returns {{
 *   score: number,
 *   grade: string,
 *   dimensions: Array<{ id: string, label: { zh: string, en: string }, weight: number, score: number, passed: number, total: number }>,
 *   gaps: Array<{ dimension: string, dimensionLabel: { zh: string, en: string }, check: string, detail: string, fix: string, impact: number }>,
 *   style: string,
 *   styleWarnings: string[]
 * }}
 */
export function auditFacts(facts, styleId = 'resolver') {
  const style = getStyle(styleId)
  /** @type {any[]} */
  const dimensions = []
  /** @type {any[]} */
  const gaps = []

  for (const dimension of DIMENSIONS) {
    let passed = 0
    for (const check of dimension.checks) {
      let ok = false
      let detail = ''
      try {
        ok = check.pass(facts)
        detail = check.detail(facts)
      } catch (error) {
        ok = false
        detail = `check failed: ${error?.message ?? String(error)}`
      }
      if (ok) {
        passed += 1
      } else {
        gaps.push({
          dimension: dimension.id,
          dimensionLabel: dimension.label,
          check: check.id,
          detail,
          fix: check.fix,
          impact: dimension.weight,
        })
      }
    }
    dimensions.push({
      id: dimension.id,
      label: dimension.label,
      weight: dimension.weight,
      passed,
      total: dimension.checks.length,
      score: Math.round((passed / dimension.checks.length) * 100),
    })
  }

  const totalWeight = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0)
  const score = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0) / totalWeight)
  gaps.sort((a, b) => b.impact - a.impact || a.dimension.localeCompare(b.dimension))

  return {
    score,
    grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D',
    dimensions,
    gaps,
    style: style.id,
    styleWarnings: styleWarningsFor(style.id, facts),
  }
}

/**
 * @param {string} styleId
 * @param {any} facts
 * @returns {string[]}
 */
function styleWarningsFor(styleId, facts) {
  try {
    const style = STYLES.find((item) => item.id === styleId)
    if (!style) return []
    const warnings = []
    const has = (pattern) => facts.assets.some((asset) => pattern.test(asset.path))
    if (style.hero !== 'none' && !has(/logo\.(svg|png)$/i) && !has(/banner\.(svg|png)$/i)) warnings.push('style needs a logo or banner; repo_brand can generate one')
    if (style.demo === 'gif' && !facts.assets.some((asset) => asset.ext === '.gif')) warnings.push('style leads with a GIF; record one from real output')
    if (style.demo === 'screenshot' && !facts.assets.some((asset) => ['.png', '.webp', '.jpg', '.jpeg'].includes(asset.ext))) warnings.push('style needs screenshots')
    if (style.language === 'bilingual' && !facts.readmeEn.path) warnings.push('bilingual style needs README.en.md')
    return warnings
  } catch {
    return []
  }
}
