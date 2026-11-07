# Release report template

Use this for every GitHub Release. The release body is the report; `CHANGELOG.md` stays the short ledger.

Copy to `docs/releases/vX.Y.Z.md`, fill it, then paste the body into the GitHub Release.

---

# vX.Y.Z — <one-line theme>

Status: draft / released
Compare: https://github.com/sakikoTGW/dsh-plugin-tailor/compare/vPREV...vX.Y.Z

## 一句话

<What this release is for, in one sentence a user can repeat.>

## 改了什么 → 改后效果

| 改了什么 | 之前 | 之后 | 证据 |
|---|---|---|---|
| <change> | <before> | <after> | <command output / screenshot / number> |

## 和上一版的区别

| 维度 | vPREV | vX.Y.Z | 影响 |
|---|---|---|---|
| 工具 |  |  |  |
| 默认行为 |  |  |  |
| 输出文件 |  |  |  |
| 契约 |  |  |  |
| 兼容性 |  |  |  |

谁需要做什么：

- 新用户：
- 已有用户：
- 调用方 / agent：

## 图片对比

| 之前 | 之后 |
|---|---|
| <img src="docs/releases/vX.Y.Z/before.png" alt="vPREV"> | <img src="docs/releases/vX.Y.Z/after.png" alt="vX.Y.Z"> |

图注：<one sentence on what to look at.>

规则：

- 同尺寸、同裁切、同主题。
- 每张图只标一个重点，不画满箭头。
- 布局用 PNG，交互用 GIF/MP4；GIF ≤ 10 MB。
- before 图必须在改动前拍；用 `git worktree add` 检出上一版再截。
- GitHub Release 正文里用绝对 URL 或上传的附件，不用仓库相对路径。

## 素材

| 文件 | 说明 | 来源 |
|---|---|---|
| `docs/releases/vX.Y.Z/before.png` | 上一版截图 | `git worktree` at `vPREV` |
| `docs/releases/vX.Y.Z/after.png` | 这一版截图 | current worktree |
| `docs/releases/vX.Y.Z/agent-before.json` | 上一版契约（没有就写 `none`） | tag |
| `docs/releases/vX.Y.Z/agent-after.json` | 这一版契约 | `repo_agent --apply` |
| `docs/releases/vX.Y.Z/evidence.txt` | 命令输出 | `npm test`, `repo_verify` |

## 升级路径

```sh
npm i -D dsh-plugin-tailor@X.Y.Z
```

从上一版升级：

```sh
node bin/tailor.mjs brief . --style=product
node bin/tailor.mjs agent . --style=product --apply
```

## 破坏性变更

- 无 / <list>

## 已知问题

- <list, with issue links>

## 证据

```text
npm test        → 21 passing
repo_verify     → 97/A PASS
```

## Checklist

- [ ] before/after 图同尺寸、同裁切
- [ ] 每个“改了什么”都有“改后效果”和证据
- [ ] 和上一版的区别写了谁受影响
- [ ] 素材文件已提交或作为 Release 附件上传
- [ ] 升级路径能照着跑
- [ ] CHANGELOG 已更新
