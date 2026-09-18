# 提示词 1 — 实现 Trace 瀑布页

## 先读
`design-system/MASTER.md`（权威值）· `design-tokens.css`（只引用 semantic/component）· `screens/01-trace-waterfall.md` · `states-copy.md` · `icon-semantics.md`

## 任务
实现 `/app/runs/:runId`，AetherOS 的首屏。**首屏就是正在跑的真实 trace，没有居中 Hero，没有口号。**

## 布局
三栏 Grid：
```css
display: grid;
grid-template-columns: var(--aos-layout-rail-width) minmax(0,1fr) var(--aos-layout-evidence-width);
```
中央列纵向 Flex：`RunHeader`（固定 48px）→ 瀑布（`flex:1; overflow:auto`）→ `DetailDock`（`--aos-trace-dock-height`，上沿可拖拽，下限 `--aos-trace-dock-min-height`）。
**瀑布是唯一滚动容器。** 不要让整页滚动。

## 关键实现点

**SpanRow**：行高 `--aos-trace-row-height`（28px）。层级缩进 `padding-inline-start: calc(level * var(--aos-trace-indent-step))` + 1px 竖向导引线（`--aos-trace-guide-width`）。
**禁止用彩色左边框表示层级。** 左侧 16px 放 `span.*` 语义槽图标，右侧放名称（mono 13px）。

**SpanBar**：
```css
left: calc(var(--start-pct) * 1%);
width: max(calc(var(--dur-pct) * 1%), var(--aos-trace-bar-min-width));
height: var(--aos-trace-bar-height);
background: var(--aos-span-llm);           /* 按 kind 换 token */
border-top: 1px solid var(--aos-span-stroke);
```
失败 span 用 `--aos-span-failed` + `--aos-span-stroke-failed`。
`--aos-trace-bar-min-width: 2px` 是必需的——没有它亚毫秒 span 会不可见。

**时长列**：右对齐，`class="aos-duration"`。**所有时长 / 计数 / token 数必须 mono + tabular-nums**，否则直播时列会横向抖动。

**直播**：新 span 从底部追加。**整行无动画插入**，只对新行做一次 180ms 背景淡出。逐个施加进入动画会掉帧。
用户上滚后**中断自动滚动**，浮出胶囊 `12 new · Jump to latest`（`--aos-elev-overlay`）。

**键盘**：`↑/↓` 移动行 · `←/→` 折叠展开 · `Enter` 打开详情 · `/` 聚焦过滤 · `Esc` 关浮层 · `⌘/Ctrl+K` 命令面板。全部走 `:focus-visible` + `--aos-focus-ring`。

**运行头操作**：`run.start` / `run.stop` / `run.replay` / `run.export` 用 `.aos-btn-trace`（青底 + `--aos-accent-on` 深色字）。**白字压青只有 2.2:1，禁止。**

## 必须实现的常驻模式标记（MASTER §10）
`RunHeader` 内与 run id 同行，**始终渲染，不依赖 hover / 展开**：
- strict：`gate.strict` 槽 + `--aos-muted` + `STRICT`
- lenient：`gate.lenient` 槽 + `--aos-unverified` 描边 + `LENIENT · evidence gate relaxed`，**视觉明显可辨**

## 五态
按 `screens/01-trace-waterfall.md` §五态 逐条实现，**文案照抄 `states-copy.md`**。
Error 四类（模型 / 工具 / 权限 / 超时）**就近显示在 RunHeader**，不要在页顶插横幅。原始 stderr 用 `--aos-surface-inset` + mono。

## 响应式
`<1280px` 证据面板转底部抽屉（Tab 切换）；`<1024px` 左栏收 56px 图标条；`<768px` 单列 + 底部 TabBar ≤5 项 + dock 全屏化。

## 交付前自检
- [ ] 组件里无 `#xxxxxx`（除 `#fff`/`#000`）、无 `Icon[A-Z]`、无 `agent-os`
- [ ] 首屏无居中口号；无彩色左边框
- [ ] 模式标记常驻且 lenient 视觉可辨
- [ ] selected 态带文字标签，不靠 filled 单独表达
- [ ] 直播追加不掉帧
- [ ] 9 态矩阵覆盖；`prefers-reduced-motion` 与 `forced-colors` 验证过
