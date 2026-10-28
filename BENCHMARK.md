# BENCHMARK

真实测量，2026-10-28。口径写在这里，数字只覆盖本插件自己的逻辑与 CLI，不包含 DSH 宿主启动时间。

## 环境

| 项 | 值 |
|---|---|
| OS | Windows 11 x64 |
| Node | v24.12.0 |
| package | `dsh-plugin-tailor@0.2.0`（本地工作树） |
| 被测仓库 A | `dsh-plugin-tailor`（本仓库，含 docs/CI/品牌素材） |
| 被测仓库 B | `dsh-plugin-resolver`（已成熟仓库，v0.1.3） |

## 方法

- 纯逻辑：`node bench/micro.mjs <path>`，10 次预热后 100 次迭代；`collectFacts` 单独 10 次迭代（它要起 4 个 `git` 子进程）。
- CLI 端到端：PowerShell `Measure-Command` 跑 5 次取中位数，包含 Node 启动（约 200 ms）。
- 所有命令都在同一台机器、同一时段、无并发任务时执行。

## 纯逻辑耗时

| 操作 | A：tailor | B：resolver | 说明 |
|---|---|---|---|
| `collectFacts`（含 git 子进程） | 109 ms | 794 ms | 主要成本是 4 次 `git` 子进程 + 文件遍历，不是解析 |
| `auditFacts`（8 维、34 项检查） | 0.01 ms | 0.01 ms | 纯内存 |
| `renderReadme`（zh，resolver 风格） | 0.03 ms | 0.12 ms | 纯字符串组装 |
| `verifyFacts`（链接/图片/锚点/章节/TODO） | 0.03 ms | 0.86 ms | resolver 的 README 更长、链接更多 |

> 结论：慢的是 I/O 和子进程，不是判断逻辑。二次运行/CI 里可以把 `collectFacts` 当成主要成本项看待。

## CLI 端到端（中位数，5 次）

| 命令 | 中位数 | 备注 |
|---|---|---|
| `tailor audit .` | 248 ms | 含 Node 启动 + git 子进程 |
| `tailor plan .` | 254 ms | 同上，输出更长（5.9 KB） |
| `tailor readme . --lang=both` | 228 ms | 只渲染、不写盘 |
| `tailor brand .` | 246 ms | 只生成 SVG 字符串 |
| `tailor verify .` | 250 ms | 读 README + 链接检查 |

## 输出体积（模型侧）

| 工具 | 典型输出 | 说明 |
|---|---|---|
| `repo_audit`（tailor） | 1.5 KB | 8 维表 + top gaps |
| `repo_audit`（resolver） | 1.1 KB | 缺口更少，输出更短 |
| `repo_plan`（tailor） | 5.9 KB | 完整任务 + 每步说明 |
| `repo_readme` dry-run | diff 截断到 160 行 | 避免一次灌满上下文 |

## 测试

| 项 | 值 |
|---|---|
| 测试文件 | `test/tailor.test.mjs` |
| 用例数 | 11 |
| 结果 | pass 11 / fail 0 |
| 覆盖 | styles、facts、audit、plan、readme 渲染/落盘安全、brand 确定性、verify 坏链、宿主注册、CLI |

## 自举审计（同一 rubric）

| 仓库 | 分数 | 等级 | 主要缺口 |
|---|---|---|---|
| tailor（补 docs/CI/品牌前） | 37 | D | 首屏、文档、证据、品牌 |
| tailor（补 docs/CI/社区/品牌后） | 63 | C | 仍是首屏（无 README/素材引用）与品牌 |
| tailor（生成双语草稿后） | 96 | A | 有 TODO、缺 demo |
| tailor（手写打磨 + demo + 证据文档） | **100** | **A** | 0 gaps |
| resolver | 84 | B | 文档目录、CONTRIBUTING、docs/ 拆分 |

复现方式与逐项输出见 [docs/EVIDENCE.md](docs/EVIDENCE.md)。

## 复现

```sh
node bench/micro.mjs .
node bin/tailor.mjs audit . --style=resolver
node bin/tailor.mjs audit ../dsh-plugin-resolver --style=resolver
npm test
```
