/**
 * Maturity rubric: eight dimensions, explicit checks, no hidden scoring.
 *
 * The score is only a navigation aid. Every failed check carries the concrete
 * fix and the file it refers to, and `repo_plan` turns those into tasks.
 */

import { resolveStyle, styleWarnings } from './styles.mjs'

/**
 * @typedef {{ id: string, label: { zh: string, en: string }, weight: number, checks: Array<{ id: string, pass: (facts: any) => boolean, detail: (facts: any) => string, fix: string }> }} Dimension
 */

/**
 * @param {any} facts
 * @param {RegExp} pattern
 */
function findAsset(facts, pattern) {
  return facts.assets.find((asset) => pattern.test(asset.path)) ?? null
}

/** @param {any} asset */
function assetShape(asset) {
  if (!asset || !asset.width || !asset.height) return 'dimensions unknown'
  return `${asset.width}×${asset.height} (${(asset.width / asset.height).toFixed(2)}:1)`
}

/** @param {any} asset @param {number} min @param {number} max */
function ratioBetween(asset, min, max) {
  if (!asset || !asset.width || !asset.height) return false
  const ratio = asset.width / asset.height
  return ratio >= min && ratio <= max
}

/** @type {Dimension[]} */
export const DIMENSIONS = [
  {
    id: 'identity',
    label: { zh: '身份', en: 'Identity' },
    weight: 8,
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
    weight: 12,
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
    weight: 13,
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
    weight: 17,
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
    weight: 8,
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
    weight: 7,
    checks: [
      { id: 'contributing', pass: (facts) => Boolean(facts.files.contributing), detail: (facts) => `contributing=${facts.files.contributing ?? 'missing'}`, fix: '加 CONTRIBUTING.md：怎么提 Issue、怎么跑测试、PR 规则。' },
      { id: 'security', pass: (facts) => Boolean(facts.files.security) || Boolean(facts.files.codeOfConduct), detail: (facts) => `security=${facts.files.security ?? 'missing'}`, fix: '加 SECURITY.md（私密报告渠道）或 CODE_OF_CONDUCT.md。' },
      { id: 'feedback', pass: (facts) => Boolean(facts.repo) || Boolean(facts.packageJson?.bugs), detail: (facts) => `feedback=${facts.repo ?? 'missing'}`, fix: '给出反馈入口：Issues 链接或讨论区。' },
      { id: 'templates', pass: (facts) => facts.templates.issue.length > 0 || Boolean(facts.templates.pr), detail: (facts) => `issue templates=${facts.templates.issue.length}, pr=${Boolean(facts.templates.pr)}`, fix: '加 Issue / PR 模板，减少来回问。' },
    ],
  },
  {
    id: 'brand',
    label: { zh: '品牌与视觉', en: 'Brand & visual' },
    weight: 20,
    checks: [
      {
        id: 'logo',
        pass: (facts) => {
          const logo = findAsset(facts, /(^|\/)logo\.(svg|png)$/i)
          return Boolean(logo && logo.width >= 128 && ratioBetween(logo, 0.7, 5))
        },
        detail: (facts) => `logo=${assetShape(findAsset(facts, /(^|\/)logo\.(svg|png)$/i))}`,
        fix: '加 logo.svg（≥128px 宽；方形图标或横向 lockup 均可）：首屏、头像和 lockup 共用。',
      },
      {
        id: 'logo-pair',
        pass: (facts) => {
          const light = findAsset(facts, /(^|\/)logo\.(svg|png)$/i)
          const dark = findAsset(facts, /(^|\/)logo-dark\.(svg|png)$/i)
          return Boolean(light && dark)
        },
        detail: (facts) => `logo=${Boolean(findAsset(facts, /(^|\/)logo\.(svg|png)$/i))}, logo-dark=${Boolean(findAsset(facts, /(^|\/)logo-dark\.(svg|png)$/i))}`,
        fix: '明暗两套 logo：GitHub 深色主题下浅色字会消失。',
      },
      {
        id: 'banner',
        pass: (facts) => ratioBetween(findAsset(facts, /(^|\/)banner\.(svg|png)$/i), 2.2, 4.5),
        detail: (facts) => `banner=${assetShape(findAsset(facts, /(^|\/)banner\.(svg|png)$/i))}`,
        fix: '加 banner（1280×400 左右，比例 2.2–4.5:1），首屏和发布帖复用。',
      },
      {
        id: 'banner-pair',
        pass: (facts) => Boolean(findAsset(facts, /(^|\/)banner-light\.(svg|png)$/i)),
        detail: (facts) => `banner-light=${Boolean(findAsset(facts, /(^|\/)banner-light\.(svg|png)$/i))}`,
        fix: '补一张浅色 banner：docs / 幻灯片 / 浅色主题都要用。',
      },
      {
        id: 'social-preview',
        pass: (facts) => ratioBetween(findAsset(facts, /(^|\/)social-preview\.(svg|png)$/i), 1.7, 2.2),
        detail: (facts) => `social-preview=${assetShape(findAsset(facts, /(^|\/)social-preview\.(svg|png)$/i))}`,
        fix: '加 social-preview（1280×640，约 2:1），否则分享链接只有灰底文字。',
      },
      {
        id: 'icon',
        pass: (facts) => {
          const icon = findAsset(facts, /(^|\/)icon\.(svg|png)$/i)
          return Boolean(icon && icon.width >= 128 && ratioBetween(icon, 0.8, 1.25))
        },
        detail: (facts) => `icon=${assetShape(findAsset(facts, /(^|\/)icon\.(svg|png)$/i))}`,
        fix: '加方形 icon.svg（≥128px），插件头像 / PWA 用。',
      },
      {
        id: 'icon-maskable',
        pass: (facts) => Boolean(findAsset(facts, /(^|\/)icon-maskable\.(svg|png)$/i)),
        detail: (facts) => `icon-maskable=${Boolean(findAsset(facts, /(^|\/)icon-maskable\.(svg|png)$/i))}`,
        fix: '加 maskable icon（80% 安全区），Android / PWA 不会被裁掉。',
      },
      {
        id: 'wordmark',
        pass: (facts) => Boolean(findAsset(facts, /(^|\/)wordmark(-dark)?\.(svg|png)$/i)),
        detail: (facts) => `wordmark=${Boolean(findAsset(facts, /(^|\/)wordmark(-dark)?\.(svg|png)$/i))}`,
        fix: '加 text-only wordmark：视频、slides、需要无图标场景时用。',
      },
      {
        id: 'brand-tokens',
        pass: (facts) => Boolean(facts.files.brandTokens),
        detail: (facts) => `brand-tokens.json=${Boolean(facts.files.brandTokens)}`,
        fix: '生成 brand-tokens.json（调色板 + 对比度 + 尺寸），给设计工具和 CI 用。',
      },
      {
        id: 'demo',
        pass: (facts) => facts.assets.some((asset) => ['.gif', '.webp', '.png', '.jpg', '.jpeg'].includes(asset.ext)),
        detail: (facts) => `demo assets=${facts.assets.filter((asset) => ['.gif', '.webp', '.png', '.jpg', '.jpeg'].includes(asset.ext)).length}`,
        fix: '录一支真实输出的 demo GIF 或准备真实截图。',
      },
      {
        id: 'readme-images',
        pass: (facts) => facts.readme.images >= 3,
        detail: (facts) => `readme images=${facts.readme.images}`,
        fix: 'README 至少用 3 处图：首屏、证据、截图/市场。',
      },
      {
        id: 'image-alt',
        pass: (facts) => {
          const total = facts.readme.media.htmlImages + facts.readme.media.markdownImages
          return total === 0 ? false : facts.readme.media.withAlt / total >= 0.8
        },
        detail: (facts) => {
          const media = facts.readme.media
          return `alt ${media.withAlt}/${media.htmlImages + media.markdownImages}`
        },
        fix: '给图片补 alt 文本（≥80%）：无障碍与加载失败时的兜底。',
      },
      {
        id: 'hero-first-screen',
        pass: (facts) => facts.readme.media.firstImageLine >= 0 && facts.readme.media.firstImageLine < 40,
        detail: (facts) => `first image line=${facts.readme.media.firstImageLine}`,
        fix: '把首屏视觉放到前 40 行内：读者不该滚过三段文字才看到图。',
      },
      {
        id: 'width-control',
        pass: (facts) => facts.readme.media.htmlImages === 0 || facts.readme.media.widthAttrs > 0,
        detail: (facts) => `html images=${facts.readme.media.htmlImages}, width attrs=${facts.readme.media.widthAttrs}`,
        fix: '给 HTML 图片加 width，避免大图在窄屏上溢出。',
      },
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
export function auditFacts(facts, styleId = 'evidence', registry) {
  const style = resolveStyle(styleId, registry)
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
    styleWarnings: styleWarnings(style, facts),
  }
}
