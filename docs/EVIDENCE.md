# EVIDENCE — dsh-plugin-tailor v0.3.0

> 结案证据。命令、输出、环境都在这里；结论只引用本文件里出现过的数字。

环境：Windows 11 x64 · Node v24.12.0 · 2026-10-29。

## 1. 测试

```text
$ npm test
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

覆盖：风格注册、facts、audit 排序、plan、README 渲染/落盘安全、品牌确定性、坏链/坏图/坏锚点、宿主注册、CLI。

## 2. 自举审计（同一个 rubric）

| 阶段 | 分数 | 等级 | 说明 |
|---|---|---|---|
| 只有代码 + 临时脚本 | 37 | D | 首屏、文档、证据、品牌全缺 |
| 补 docs / CI / 社区 / 品牌素材 | 63 | C | 缺 README、demo、首屏素材引用 |
| 用 `repo_readme` 生成双语草稿 | 96 | A | 结构齐了，但有 TODO、缺 demo |
| 手写打磨 + demo GIF + 证据文档 | **100** | **A** | 0 gaps；`repo_verify` PASS |

```text
$ node bin/tailor.mjs audit . --style=evidence
score=100/100 · grade=A · gaps=0
```

## 3. 对真实仓库的审计

`dsh-plugin-resolver`（v0.1.3，成熟度已经很高）：

```text
$ node bin/tailor.mjs audit ../dsh-plugin-resolver --style=evidence
score=84/100 · grade=B · gaps=6
```

缺口：文档目录、CONTRIBUTING/SECURITY/Issue 模板、README 的「用法」小节。这是真实缺口，不是为演示造出来的。

`repo_verify`：

```text
$ node bin/tailor.mjs verify ../dsh-plugin-resolver --style=evidence
result: PASS
相对链接可解析: 48 relative links checked
图片文件存在: all markdown images exist on disk
本地锚点存在: 26 anchors checked
```

## 4. 性能（见 BENCHMARK.md 的方法）

```text
$ node bench/micro.mjs .
audit_ms: 0.01
readme_ms: 0.03
verify_ms: 0.03
facts_ms: 108.57   // 含 4 次 git 子进程
```

```text
$ node bench/micro.mjs ../dsh-plugin-resolver
facts_ms: 794.23
verify_ms: 0.86
```

CLI（5 次中位数）：`audit` 248 ms、`plan` 254 ms、`readme` 228 ms、`brand` 246 ms、`verify` 250 ms（含 ~200 ms Node 启动）。

## 5. 生成物与包

- `assets/`：品牌引擎生成 8 个文件（icon、明暗 logo、明暗 banner、social、brand-sheet、README），另加手写的 pipeline / styles 两张结构图；`demo.gif`、`audit-resolver.png`、`tools-styles.png`、`tools-brand.png`、`tools-verify.png` 全部由真实 stdout 渲染。
- 品牌概念 12 个：`needle`、`stitch`、`quill`、`arcs`、`orbit`、`prompt`、`bubble`、`radar`、`hexstack`、`monogram`、`spark`、`layers`；本仓库默认 `needle`，`assets/brand-sheet.svg` 是 12 概念对照。
- `npm pack` 包内容：`index.js`、`host/`、`logic/`、`bin/`、`cordis.patch.yml`、双语 README、docs、assets；`test/`、`bench/`、`.tailor/`、`demo/` 不进包（见 `npm pack --dry-run`）。
- 包体积：**498.5 kB**（tarball）/ **718.5 kB**（unpacked），**41 个文件**；GitHub Release 附带同一份 `.tgz`。

## 6. 已知限制（不掩饰）

- 100 分只说明「结构 + 证据 + 品牌 + 社区」都在，不说明文笔好；`repo_verify` 也不检查事实是否正确。
- 草稿的 `TODO(tailor)` 需要人填；填之前 `repo_verify` 会 warn。
- 只有 zh/en；不自动选风格；不自动 push / 发布。
- `collectFacts` 要起 git 子进程，是大仓库的主要耗时。
- SVG 字宽依赖系统字体；不同机器上截图/渲染会有轻微差异。

## 7. 复现

```sh
npm test
node bench/micro.mjs .
node bin/tailor.mjs audit . --style=evidence
node bin/tailor.mjs audit ../dsh-plugin-resolver --style=evidence
node bin/tailor.mjs verify ../dsh-plugin-resolver --style=evidence
node bin/tailor.mjs readme . --style=terminal --lang=both   # dry-run，看另一个风格
```
