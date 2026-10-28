# SPEC — dsh-plugin-tailor

> 状态：v0.1.0 实现中。验收见 [ACCEPTANCE.md](ACCEPTANCE.md)，风格说明见 [STYLES.md](STYLES.md)，证据见 [EVIDENCE.md](EVIDENCE.md)。

## 目标

把"让一个仓库看起来像成熟项目"从一次性手工活变成可审计的流程：

```text
repo_audit → repo_plan → repo_brand → repo_readme → repo_verify
```

用户要的不是"更漂亮的 README"，而是**能发布**：首屏能看懂、安装能跑、数字有出处、限制写清楚、发布前能检查。

## 工具契约

六个 host-only 工具，全部返回 `{ text }`。写操作默认 dry-run，必须显式 `apply: true`。

| 工具 | 读写 | 输入 | 输出 | 失败语义 |
|---|---|---|---|---|
| `repo_styles` | 读 | — | 7 个预设的 id、语言、hero、demo、来源、essence | 不会失败 |
| `repo_audit` | 读 | `path`, `style?` | 0-100 分、8 维明细、按影响排序的 gaps、风格缺口 | 路径不存在 / 非目录 → 明确错误 |
| `repo_plan` | 读 | `path`, `style?`, `limit?` | P0/P1/P2 任务，含 acceptance 与 verify 命令 | 同上 |
| `repo_readme` | dry-run / 写 | `path`, `style?`, `lang?`, `apply?`, `force?` | diff、TODO 清单、风格缺口；apply 时写入 README(.en).md | 手写 README 且未 `force` → 拒绝；worktree 脏且未 `force` → 拒绝 |
| `repo_brand` | dry-run / 写 | `path`, `style?`, `concept?`, `tagline?`, `apply?`, `force?` | 8 个文件（icon、明暗 logo、明暗 banner、social、brand-sheet、README）；12 个概念可选 | 未知 concept → 列出可用 id；已存在且未 `force` → 跳过（不覆盖） |
| `repo_verify` | 读 | `path`, `style?` | PASS/FAIL、链接/图片/锚点/徽章/章节/TODO 检查、baseline 分数差 | 同上 |

## 错误语义

- **不猜**：未知 style 直接列可用 id；路径逃逸（`../`）拒绝。
- **不覆盖**：手写 README / 已有品牌素材默认拒绝或跳过，`force` 才覆盖。
- **不编造**：缺失事实一律变成 `TODO(tailor)` 标记 + 可见 TODO 列表；数字只从仓库文件里解析。
- **可重入**：同样的仓库状态生成同样字节的草稿；`.tailor/baseline.json` 只用于计算分数差。

## 风格预设

七个预设，分别复刻七种真实 README 传统（layout + tone，不复制内容）：

| id | 风格 | 首屏 | 语言 | demo |
|---|---|---|---|---|
| `evidence` | 证据优先 | banner | 双语 | GIF |
| `terminal` | 终端工具 | 居中 Logo | 双语 | GIF |
| `mobile` | 移动端 · 社群 | banner | 中文优先 | 截图 |
| `playful` | GIF 开场 · 教程 | Logo | 英文优先 | GIF |
| `product` | 品牌产品页 | 品牌 banner | 英文优先 | 截图 |
| `platform` | 面板平台 | 居中 Logo | 双语 | GIF |
| `minimal` | 极简排版 | 无图纯排版 | 英文优先 | 无 |

每个预设定义：`hero`、`demo`、`badgeSet`、`sections` 顺序、章节标题、语气、调色板、默认图形概念（mark）、必需事实。
品牌概念共 12 个：`needle`、`stitch`、`quill`、`arcs`、`orbit`、`prompt`、`bubble`、`radar`、`hexstack`、`monogram`、`spark`、`layers`；`repo_brand` 支持 `concept` 覆盖，并生成明暗两套 lockup/banner 与一张 12 概念对照图。
详见 [STYLES.md](STYLES.md)。

## 非目标

- 不生成虚假的基准、用户、star 数或截图；
- 不自动 push、不自动发布 npm、不创建 GitHub Release；
- 不替代人工判断定位、取舍和限制——它只负责结构、证据和检查；
- v0.1 不做：图片模型生成、多语言 >2、跨仓库批量模式、GUI 半。

## 安全边界

- 所有写入都限制在仓库根目录内（`resolveInside`）；
- 默认 dry-run；`apply` 需要显式参数；
- 不执行仓库里的脚本（不跑 `npm install`、不跑构建）；
- 审计只读文件系统，不访问网络；
- 唯一的状态写入是 `.tailor/baseline.json`，被 `.gitignore` 排除。

## 兼容性

- DSH `>=0.2.0-rc.2 <0.3.0`（`engines.dsh`），Node `>=20`；
- 纯 ESM，无运行时依赖；
- 宿主只要求 `ctx.tools.register`，其余通过 `ctx.get('pluginManager')` 读取（本插件不使用）。
