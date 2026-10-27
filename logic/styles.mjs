/**
 * README style presets.
 *
 * Each preset copies a real, publicly readable README tradition: what the first
 * screen shows, how many badges it keeps, whether it leads with a banner, a
 * logo or plain type, which sections it expects, and what the prose sounds
 * like. They are layout + tone presets, not content: the facts come from the
 * repository being audited.
 */

/** @typedef {'resolver'|'dsh-tui'|'dsh-go'|'bubbletea'|'sniffnet'|'1panel'|'doomemacs'} StyleId */

/**
 * @typedef {{
 *   id: string,
 *   label: { zh: string, en: string },
 *   source: string,
 *   sourceUrl: string,
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

const BILINGUAL = 'bilingual'

/** @type {StylePreset[]} */
export const STYLES = [
  {
    id: 'resolver',
    label: { zh: '证据优先 · 双语', en: 'Evidence-first · bilingual' },
    source: 'dsh-plugin-resolver',
    sourceUrl: 'https://github.com/sakikoTGW/dsh-plugin-resolver',
    essence: {
      zh: '先给结论和数字，再给机制；中英双份对等；每个数字都能指到基准或测试。',
      en: 'Lead with the result and the number, then the mechanism; equal Chinese/English pages; every number points at a benchmark or a test.',
    },
    language: BILINGUAL,
    tone: {
      zh: '工程口吻：短句、具体、写限制，不写形容词。',
      en: 'Engineering voice: short sentences, concrete claims, explicit limits, no adjectives.',
    },
    hero: 'banner',
    demo: 'gif',
    mark: 'check-dots',
    palette: { brand: '#4D6BFE', deep: '#2A3FD0', ink: '#0B1020', green: '#2FBF71', bg: '#0D1220', border: '#22305C' },
    badgeSet: ['npm', 'license', 'dsh', 'node', 'ci', 'checks'],
    sections: ['hero', 'language', 'badges', 'title', 'tagline', 'demo', 'toc', 'why', 'how', 'install', 'features', 'evidence', 'structure', 'tests', 'limitations', 'feedback', 'license'],
    labels: {
      why: { zh: '为什么需要它', en: 'Why it exists' },
      how: { zh: '怎么工作', en: 'How it works' },
      install: { zh: '快速开始', en: 'Quickstart' },
      features: { zh: '功能', en: 'What you get' },
      evidence: { zh: '效果与证据', en: 'Results and evidence' },
      structure: { zh: '结构', en: 'Layout' },
      tests: { zh: '测试与 CI', en: 'Tests and CI' },
      limitations: { zh: '已知限制', en: 'Known limitations' },
      feedback: { zh: '反馈与安全', en: 'Feedback and security' },
    },
    notes: {
      zh: '适合有基准、有测试、有明确取舍的工程型仓库：数字放前面，限制写清楚。',
      en: 'For engineering repos with benchmarks, tests and explicit trade-offs: numbers first, limits stated.',
    },
    requiredFacts: ['readme', 'demo'],
  },
  {
    id: 'dsh-tui',
    label: { zh: '居中 Logo · 双语', en: 'Centered logo · bilingual' },
    source: 'ccch1mneyyy/dsh-TUI',
    sourceUrl: 'https://github.com/ccch1mneyyy/dsh-TUI',
    essence: {
      zh: '居中 Logo + 语言切换 + 一排 flat-square 徽章；英文为主、中文对等；首屏一支 GIF。',
      en: 'Centered logo, language switch, one flat-square badge row; English-first with an equal Chinese page; one GIF above the fold.',
    },
    language: BILINGUAL,
    tone: {
      zh: '产品说明会：先说它像什么、怎么用，再补细节。',
      en: 'Product briefing: what it feels like and how to use it first, details second.',
    },
    hero: 'logo',
    demo: 'gif',
    mark: 'brackets',
    palette: { brand: '#4B6FFF', deep: '#2C4BE0', ink: '#0B1020', green: '#2FBF71', bg: '#0D1220', border: '#22305C' },
    badgeSet: ['npm', 'license', 'dsh', 'ci', 'checks'],
    sections: ['language', 'hero', 'badges', 'title', 'tagline', 'demo', 'toc', 'why', 'features', 'install', 'screenshots', 'evidence', 'compatibility', 'community', 'license'],
    labels: {
      why: { zh: '为什么是它', en: 'Why this one' },
      features: { zh: '亮点', en: 'Highlights' },
      install: { zh: '安装', en: 'Install' },
      screenshots: { zh: '截图', en: 'Screenshots' },
      evidence: { zh: '证据', en: 'Proof' },
      compatibility: { zh: '兼容性', en: 'Compatibility' },
      community: { zh: '社区', en: 'Community' },
    },
    notes: {
      zh: '适合有品牌 Logo、愿意维护双语页面的项目：视觉锚点在上，文字更短。',
      en: 'For projects with a real logo and a bilingual audience: visual anchor first, shorter prose.',
    },
    requiredFacts: ['readme', 'logo', 'demo'],
  },
  {
    id: 'dsh-go',
    label: { zh: '移动端 · 社群驱动', en: 'Mobile · community-driven' },
    source: 'ccch1mneyyy/dsh-go',
    sourceUrl: 'https://github.com/ccch1mneyyy/dsh-go',
    essence: {
      zh: 'Hero 图 + 中文优先 + 社群入口（群/论坛/二维码）+ 小宠物 GIF 组；最后才是安装和 FAQ。',
      en: 'Hero image, Chinese-first voice, community entry points (groups/forum/QR), pet-GIF gallery, then install and FAQ.',
    },
    language: 'zh-first',
    tone: {
      zh: '对用户说话：亲切、具体、承认内测与限制。',
      en: 'Talking to users: warm, concrete, honest about beta status and limits.',
    },
    hero: 'banner',
    demo: 'screenshot',
    mark: 'orbit',
    palette: { brand: '#4B67B4', deep: '#2B3245', ink: '#10131C', green: '#3FBF7F', bg: '#0E1118', border: '#2B3245' },
    badgeSet: ['version', 'platform', 'license', 'forum'],
    sections: ['language', 'hero', 'badges', 'title', 'tagline', 'screenshots', 'why', 'features', 'install', 'remote', 'faq', 'community', 'credits', 'license'],
    labels: {
      why: { zh: '为什么做它', en: 'Why it exists' },
      features: { zh: '能做什么', en: 'What it does' },
      install: { zh: '安装与下载', en: 'Install and download' },
      screenshots: { zh: '截图', en: 'Screenshots' },
      remote: { zh: '遥控电脑', en: 'Remote control' },
      faq: { zh: '常见问题', en: 'FAQ' },
      community: { zh: '社区', en: 'Community' },
      credits: { zh: '致谢', en: 'Credits' },
    },
    notes: {
      zh: '适合 App / 移动端 / 有社群的项目：先让人看到它长什么样、怎么进群，再谈安装。',
      en: 'For apps, mobile builds and community products: show what it looks like and how to join first, install second.',
    },
    requiredFacts: ['readme', 'screenshots'],
  },
  {
    id: 'bubbletea',
    label: { zh: 'GIF 开场 · 教程感', en: 'GIF-first · tutorial' },
    source: 'charmbracelet/bubbletea',
    sourceUrl: 'https://github.com/charmbracelet/bubbletea',
    essence: {
      zh: 'Logo、三枚徽章、一支全宽 GIF，然后直接进教程；语气轻松，有 "In the wild"。',
      en: 'Logo, three badges, one full-width GIF, then straight into the tutorial; playful voice and an "In the wild" section.',
    },
    language: 'en-first',
    tone: {
      zh: '轻松、短句、带一点幽默，但不牺牲信息。',
      en: 'Light, short sentences, a little humour, no information sacrificed.',
    },
    hero: 'logo',
    demo: 'gif',
    mark: 'bubble',
    palette: { brand: '#FF75B7', deep: '#B83D8A', ink: '#0B1020', green: '#04B575', bg: '#120D18', border: '#3A2440' },
    badgeSet: ['version', 'license', 'stars'],
    sections: ['hero', 'badges', 'title', 'tagline', 'demo', 'install', 'features', 'tutorial', 'in-the-wild', 'feedback', 'license'],
    labels: {
      install: { zh: '安装', en: 'Install' },
      features: { zh: '特性', en: 'Features' },
      tutorial: { zh: '教程', en: 'Tutorial' },
      'in-the-wild': { zh: '谁在用', en: 'In the wild' },
      feedback: { zh: '反馈', en: 'Feedback' },
    },
    notes: {
      zh: '适合开发者工具 / TUI：用 GIF 证明手感，用教程降低第一步门槛。',
      en: 'For developer tools and TUIs: prove the feel with a GIF, lower the first step with a tutorial.',
    },
    requiredFacts: ['readme', 'logo', 'demo'],
  },
  {
    id: 'sniffnet',
    label: { zh: '品牌横幅 · 产品页', en: 'Brand banner · product page' },
    source: 'GyulyVGC/sniffnet',
    sourceUrl: 'https://github.com/GyulyVGC/sniffnet',
    essence: {
      zh: '深色横幅 + 下载按钮 + 功能表格 + 截图；像产品落地页，先给下载入口。',
      en: 'Dark banner, download buttons, feature table, screenshots; a product landing page whose first job is download.',
    },
    language: 'en-first',
    tone: {
      zh: '产品页口吻：利益点、平台、下载，一句话一个动作。',
      en: 'Landing-page voice: benefit, platform, download — one action per sentence.',
    },
    hero: 'banner',
    demo: 'screenshot',
    mark: 'radar',
    palette: { brand: '#2F9BFF', deep: '#1565C0', ink: '#071018', green: '#21C77A', bg: '#08111C', border: '#17324D' },
    badgeSet: ['version', 'license', 'platform', 'stars'],
    sections: ['hero', 'badges', 'title', 'tagline', 'screenshots', 'features', 'install', 'download', 'evidence', 'community', 'license'],
    labels: {
      features: { zh: '功能', en: 'Features' },
      screenshots: { zh: '界面', en: 'Gallery' },
      install: { zh: '下载', en: 'Download' },
      download: { zh: '安装方式', en: 'Install options' },
      evidence: { zh: '性能', en: 'Performance' },
      community: { zh: '社区', en: 'Community' },
    },
    notes: {
      zh: '适合面向普通用户的产品：首屏给下载入口，功能用表格扫读。',
      en: 'For end-user products: download above the fold, features scannable as a table.',
    },
    requiredFacts: ['readme', 'banner', 'screenshots'],
  },
  {
    id: '1panel',
    label: { zh: '居中品牌 · 国际化', en: 'Centered brand · i18n' },
    source: '1Panel-dev/1Panel',
    sourceUrl: 'https://github.com/1Panel-dev/1Panel',
    essence: {
      zh: '居中 Logo + 一句话定位 + 语言切换 + 少量徽章；截图和功能并排，中文优先但英文对等。',
      en: 'Centered logo, one-line positioning, language switch, few badges; screenshots next to features, Chinese-first with an equal English page.',
    },
    language: BILINGUAL,
    tone: {
      zh: '官网简介口吻：定位清楚、句子短、不堆术语。',
      en: 'Homepage intro voice: clear positioning, short sentences, no jargon pile-up.',
    },
    hero: 'logo',
    demo: 'gif',
    mark: 'hex-bar',
    palette: { brand: '#2B6DE5', deep: '#1748A8', ink: '#0A1220', green: '#23B26D', bg: '#0D1522', border: '#213451' },
    badgeSet: ['version', 'license', 'stars'],
    sections: ['language', 'hero', 'badges', 'title', 'tagline', 'demo', 'features', 'screenshots', 'install', 'quickstart', 'community', 'license'],
    labels: {
      features: { zh: '功能', en: 'Features' },
      screenshots: { zh: '界面', en: 'Screenshots' },
      install: { zh: '开始使用', en: 'Get started' },
      quickstart: { zh: '快速开始', en: 'Quickstart' },
      community: { zh: '社区', en: 'Community' },
    },
    notes: {
      zh: '适合面板 / 平台类产品：品牌居中，定位一句话，截图比文字多。',
      en: 'For panels and platforms: brand centered, one-line positioning, screenshots over prose.',
    },
    requiredFacts: ['readme', 'logo', 'screenshots'],
  },
  {
    id: 'doomemacs',
    label: { zh: '极简排版 · 无图', en: 'Minimal type · no images' },
    source: 'doomemacs/doomemacs',
    sourceUrl: 'https://github.com/doomemacs/doomemacs',
    essence: {
      zh: '居中标题 + 一行横向导航 + 极少量徽章 + 水平线分节；不靠图，靠排版和链接密度。',
      en: 'Centered title, one inline nav row, very few badges, horizontal rules between sections; no images, typography and link density carry it.',
    },
    language: 'en-first',
    tone: {
      zh: '手册口吻：陈述句、短、克制，不推销。',
      en: 'Manual voice: declarative, short, restrained, never selling.',
    },
    hero: 'none',
    demo: 'none',
    mark: 'serif-letter',
    palette: { brand: '#7C5CFF', deep: '#4B3AA8', ink: '#0B1020', green: '#2FBF71', bg: '#0D0F17', border: '#262B3D' },
    badgeSet: ['version', 'license'],
    sections: ['title', 'nav', 'tagline', 'install', 'features', 'usage', 'docs', 'limitations', 'license'],
    labels: {
      install: { zh: '安装', en: 'Install' },
      features: { zh: '特性', en: 'Features' },
      usage: { zh: '用法', en: 'Usage' },
      docs: { zh: '文档', en: 'Documentation' },
      limitations: { zh: '说明', en: 'Notes' },
    },
    notes: {
      zh: '适合成熟工具 / 框架：不靠视觉，靠结构和文风；很适合已有大量文档的仓库。',
      en: 'For mature tools and frameworks: structure and voice instead of visuals; ideal when documentation already exists.',
    },
    requiredFacts: ['readme'],
  },
]

/** @type {Map<string, StylePreset>} */
const STYLE_MAP = new Map(STYLES.map((style) => [style.id, style]))

/**
 * @param {string} id
 * @returns {StylePreset}
 */
export function getStyle(id) {
  const style = STYLE_MAP.get(id)
  if (!style) {
    throw new Error(`unknown style "${id}" (available: ${STYLES.map((item) => item.id).join(', ')})`)
  }
  return style
}

/** @returns {string[]} */
export function styleIds() {
  return STYLES.map((style) => style.id)
}

/**
 * What a style needs that this repository does not have yet.
 *
 * @param {StylePreset} style
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
