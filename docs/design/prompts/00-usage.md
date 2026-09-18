# 设计提示词用法

## 这些文件是什么

给前端 Agent 的**实现提示词**。每个文件可直接整段粘贴给实现方。与 `screens/` 的分工：

- `screens/*.md` = **规格**（要做什么，人类与评审读）
- `prompts/*.md` = **指令**（怎么做，实现方读，含必读文件清单与命令）

## 使用顺序（每个页面都按这个流程）

1. 读 `design-system/MASTER.md` — 取权威值（冲突时以它为准）
2. 读 `design-tokens.css` — **只引用 semantic / component 层，禁止 primitive，禁止裸 hex**
3. 读目标页面的 `screens/<n>-*.md` — 取布局与组件规格
4. 读 `states-copy.md` — **Empty / Error / Loading 文案照抄，禁止自创**
5. 读 `icon-semantics.md` — **只引用语义槽，禁止图标名**
6. 执行对应 `prompts/<n>-*.md`

## 全局禁令（每个提示词都已内置，此处汇总）

| # | 禁止 | 说明 |
|---|---|---|
| 1 | 裸 hex 色值 | 唯一例外 `#fff` / `#000`；一律 `var(--aos-*)`。组件里出现 `#xxxxxx` 视为构建期错误 |
| 2 | primitive token | 组件只引用 semantic / component（`--aos-graphite-*` `--aos-cyan-*` 是内部值） |
| 3 | 图标名 | 只引用语义槽；`Icon[A-Z]` 出现在组件里 = CI fail |
| 4 | emoji | 作功能图标零容忍 |
| 5 | 第二套图标库 | 全项目 Tabler 3.46.0 唯一 |
| 6 | 青色挪用 | 青色只属于 trace / 证据 / 来源面与 running 态；营销 CTA 用反相中性 |
| 7 | 琥珀挪用 | 琥珀**只**标注「证据链不完整」；资源计 / 表单校验 / 通用告警禁用 |
| 8 | `border-left/right` > 1px 作强调 | 层级用 1px 导引线；diff 与否决态用 10% 底色块 |
| 9 | 圆角 > 8px | 全站硬天花板 |
| 10 | 弹跳缓动 | `cubic-bezier(0.68,-0.55,0.265,1.55)` |
| 11 | 状态单通道 | 每个状态必须**图标 + 文字 + 颜色**三通道；filled 永不替代文字 |
| 12 | 自创文案 | Empty / Error / Loading 一律取自 `states-copy.md` |
| 13 | 虚构指标 | 数字必须来自真实计数器 |
| 14 | 居中口号 Hero | 首屏必须是真实 trace |
| 15 | `agent-os` / `~/.agent-os/` | 正确写法是 `agentos` / `~/.aetheros/` |

## 完成前自检

- [ ] 组件里 `grep '#[0-9a-fA-F]\{6\}'` 无命中（除 `#fff`/`#000`）
- [ ] 组件里 `grep 'Icon[A-Z]'` 无命中
- [ ] 组件里 `grep 'agent-os'` 无命中
- [ ] 所有数字容器挂了 `.aos-mono` / `.aos-duration` / `.aos-metric` / `.aos-delta` / `.aos-id` 之一
- [ ] 每个交互组件覆盖 9 态（MASTER §11）
- [ ] `prefers-reduced-motion` 与 `forced-colors` 下都验证过
- [ ] 聚焦态用 `--aos-focus-ring` 且未被移除
