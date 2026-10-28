# Styles

README 风格是**结构化 JSON 数据**，不是代码。`styles.mjs` 只负责加载、合并、校验；新增风格不需要改逻辑。

## 目录

| 位置 | 作用 | 覆盖顺序 |
|---|---|---|
| `styles/*.json`（本包） | 7 个内置风格 | 1（最低） |
| `~/.tailor/styles/*.json` | 本机自定义，或 `TAILOR_STYLES_DIR` 指定的目录 | 2 |
| `<repo>/.tailor/styles/*.json` | 单仓库自定义（可提交进仓库） | 3（最高） |

同 id 时后者覆盖前者，`repo_styles` 会标出来源。

## 最小自定义方式

```sh
# 从 evidence 继承，只覆盖要改的字段
node bin/tailor.mjs style:init . --id=acme --extends=evidence
```

生成 `./.tailor/styles/acme.json`：

```json
{
  "$schema": "https://raw.githubusercontent.com/sakikoTGW/dsh-plugin-tailor/main/styles/schema.json",
  "extends": "evidence",
  "id": "acme",
  "label": { "zh": "Acme 证据风", "en": "Acme evidence" },
  "palette": { "brand": "#E4572E", "deep": "#B23A1C" },
  "sections": ["hero", "language", "badges", "title", "tagline", "demo", "install", "features", "limitations", "license"]
}
```

- `extends` 先继承父风格，再按键合并：`label` / `essence` / `tone` / `notes` / `palette` 逐键合并，`labels` 合并，数组（`sections`、`badgeSet`、`requiredFacts`）整体替换。
- 不写 `extends` 就是完全自定义：必须提供 schema 里的全部必填字段。

## 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | `^[a-z][a-z0-9-]{1,31}$`，命令里用 `--style=<id>` |
| `label` | `{zh,en}` | 显示名 |
| `essence` | `{zh,en}` | 一句话核心 |
| `tone` | `{zh,en}` | 语气说明，会进 `repo_styles` |
| `notes` | `{zh,en}` | 适合什么项目 |
| `language` | `bilingual` \| `zh-first` \| `en-first` | 生成哪些语言、首屏给谁 |
| `hero` | `banner` \| `logo` \| `none` | 首屏资产期望 |
| `demo` | `gif` \| `screenshot` \| `none` | demo 形式 |
| `mark` | 12 概念之一 | 默认品牌图形 |
| `palette` | 6 个 `#RRGGBB` | `brand` / `deep` / `ink` / `green` / `bg` / `border` |
| `badgeSet` | string[] | 可选：npm/version/license/dsh/node/ci/checks/stars/platform/forum |
| `sections` | string[] | 章节顺序，必须来自渲染器支持的 section id |
| `labels` | `{section: {zh,en}}` | 覆盖章节标题 |
| `requiredFacts` | string[] | 生成前必须存在的事实（缺失进 TODO） |

完整 schema：`styles/schema.json`（编辑器可直接感知）。

## 校验与错误

- 内置风格在加载时校验，失败直接报错（不会静默用坏数据）。
- 自定义风格校验失败会**跳过该文件**并在 `repo_styles` 中列出文件与原因；其他风格照常可用。
- 机器可读：CLI `tailor styles . --json`（DSH 工具 `repo_styles { json: true }`）输出 `{ builtin, custom, dirs, styles[], errors[] }`。
- `extends` 必须指向已加载的风格（顺序：内置 → 全局 → 仓库）。
- 未知名 key、缺 `install` 章节等只给 warning，不阻断。

## 用自定义风格

```sh
node bin/tailor.mjs styles
node bin/tailor.mjs audit . --style=acme
node bin/tailor.mjs readme . --style=acme --lang=both
node bin/tailor.mjs brand . --style=acme --apply --force
node bin/tailor.mjs verify . --style=acme
```

DSH 工具同理：`repo_readme { path: ".", style: "acme" }`。
