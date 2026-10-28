# ACCEPTANCE — dsh-plugin-tailor v0.2.0

> 依据 `vibe-playbook/templates/ACCEPTANCE.md`。结案时逐项附证据。

## 目标

- 问题：每个仓库的 README/品牌/发布检查都要重做一遍，风格无法复用，数字容易过期。
- 用户：维护 DSH 插件或任意开源仓库的开发者 / agent。
- 一句话价值：**8 维审计 → 选风格 → 双语 README → 品牌素材 → 发布前校验，一次流程走完，且不编造任何事实。**

## 验收标准（可执行）

| # | 标准 | 验证方式 |
|---|---|---|
| 1 | 7 个 style 预设均可渲染 zh + en 草稿 | `node bin/tailor.mjs styles`；`npm test`（styles / readme 用例） |
| 2 | 审计对同一 fixture 可复现打分，good > bare | `npm test` 的 `audit: good fixture scores higher than a bare one` |
| 3 | 草稿只使用仓库真实事实；缺失项变成 TODO | `readme: renders ... without invented numbers` 用例；人工看 `TODO(tailor)` |
| 4 | dry-run 不写盘；apply 需显式；手写 README 未 force 拒绝 | `readme apply: refuses hand-written files...` 用例 |
| 5 | 品牌素材：12 概念可选、每次生成 8 个文件、确定性、默认不覆盖 | `brand: 12 concepts...` 用例；`node bin/tailor.mjs brand . --concept=needle` |
| 6 | verify 能抓坏链、坏图、坏锚点 | `verify: catches broken links, images and anchors` 用例 |
| 7 | 宿主注册 6 个工具并可执行 | `host: registers six tools and runs repo_audit` 用例 |
| 8 | CLI 可用 | `cli: styles command prints all presets` 用例 |
| 9 | 离线全绿 | `npm test` 输出 pass 11 / fail 0 |
| 10 | 自举：用插件审计并改造自身仓库 | `docs/EVIDENCE.md` 的 before/after 审计输出 |

## 非目标

- 不自动 commit / push / 发布；
- 不调用图片模型；不做真实截图；
- 不保证生成内容可以直接发布——草稿必须人工校对；
- 不覆盖任意语言的 README（v0.1 只做 zh/en）。

## 已知失败模式与处理

| 失败 | 现象 | 处理 |
|---|---|---|
| 手写 README 被覆盖 | apply 直接写掉人工内容 | 检测 `generated-by` 标记；无标记且无 force → 拒绝 |
| 脏 worktree 被写 | 未提交改动混进生成结果 | `git status --porcelain` 非空且无 force → 拒绝 |
| 生成草稿把旧 README 当事实源 | 二次 apply 不幂等 | 检测 generated 标记，生成时忽略生成内容 |
| 数字过期 | README 的数字与测试不符 | `repo_verify` 检查 TODO / 测试数；人工对 BENCHMARK |
| 风格不匹配 | 选了 dsh-go 却没有截图 | `repo_audit` / `repo_readme` 输出 style gaps 与对应任务 |

## 证据清单（结案时附上）

- [ ] `npm test` 全绿输出（11/11）
- [ ] `node bin/tailor.mjs audit ../dsh-plugin-resolver` 输出（84/100, B）
- [ ] 自举前后分数对比（[EVIDENCE.md](EVIDENCE.md)）
- [ ] BENCHMARK.md 的实测耗时（中位数、环境）
- [ ] `npm pack --dry-run` 包清单
- [ ] 已知限制清单（README「已知限制」+ SPEC 非目标）

## 完成判定

验收标准全部通过 + 证据清单全部附上 = 可结案；缺一项按未完成处理。
