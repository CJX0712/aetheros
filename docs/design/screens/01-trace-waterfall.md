# 页面 1 — Run 时间线 / Trace 瀑布

> 这是全产品的**首屏**。没有居中 Hero、没有口号——首屏就是正在跑的真实 trace。
> 权威值见 `design-system/MASTER.md`；文案见 `states-copy.md`；图标槽见 `icon-semantics.md`。

## 页面：Trace 瀑布
- **路由**：`/app/runs/:runId`（默认落地页；`/app` 重定向到最近一次 run）
- **寄存器**：Product ｜ **Density 7** ｜ **Variance 5**（主区可预测网格，仅右侧证据栏宽度固定构成不对称）
- **寄存器例外**：本页是 trace 面 → `--aos-accent` 青色在此**合规**（规则一）

## 布局
三栏 Grid：`grid-template-columns: var(--aos-layout-rail-width) minmax(0,1fr) var(--aos-layout-evidence-width)`。
中央列内部为**纵向 Flex**：run 头（固定）→ 瀑布（`flex:1`，自身滚动）→ 详情 dock（`--aos-trace-dock-height`，可拖拽拉伸）。

```
┌──────────┬────────────────────────────────────┬──────────────┐
│ 左栏 240 │  run 头 48px                       │ 右栏 360     │
│ 运行列表 │  瀑布（唯一滚动容器）              │ 证据链面板   │
│          │  详情 dock 280（可拉伸）            │              │
└──────────┴────────────────────────────────────┴──────────────┘
```

## 核心组件

| 组件 | 规格 | 状态 |
|---|---|---|
| `RunRailItem` | 状态点 20px + run id（mono）+ 耗时（mono, tabular）+ span 数 | default / hover(`--aos-surface-raised`) / selected(`--aos-accent-soft` 底 + 1px `--aos-accent` 描边 **+ 文字**，P4) |
| `RunHeader` | run id / 状态 / 耗时 / 模型 / token 数 / span 数 + 操作组 + **模式标记** | 见下 |
| `SpanRow` | 行高 28px；缩进 12px/层 + 1px 竖向导引线（**禁止彩色左边框**）；类型图标 16px + 名称（mono）+ 瀑布条 + 时长（右对齐 mono） | default / hover / selected / failed(`--aos-span-failed`) |
| `SpanBar` | `left: start%`；`width: max(duration%, --aos-trace-bar-min-width)`；填充 `--aos-span-*`（青色密度分级）；`border-top: 1px solid var(--aos-span-stroke)` | 见 §3.4 MASTER |
| `TimeRuler` | 吸顶刻度尺，单位自适应 ms/s，grid line 用 `--aos-border-soft` | 随缩放重算 |
| `TraceToolbar` | 缩放 1× / 2× / fit、类型过滤、`trace.filter` 槽、导出 | — |
| `DetailDock` | 4 页签：I/O（mono）/ Prompt / Retrieved / Raw JSON | — |
| `GateModeBadge` | **常驻**模式标记 | strict / lenient |

## 交互
- **键盘**：`↑/↓` 移动行 · `←/→` 折叠展开 · `Enter` 打开详情 · `/` 聚焦过滤 · `Esc` 关闭浮层 · `⌘/Ctrl+K` 命令面板。
- **直播**：新 span 从底部追加并自动滚动；用户上滚后**中断自动滚动**，浮出胶囊 `N new · Jump to latest`（`--aos-elev-overlay`）。
- **整行无动画插入**，仅新行背景做一次 180ms 淡出。逐个施加进入动画会掉帧。
- **选中 span** → 右栏证据面板同步到该 span 的检索结果；反之 hover 证据卡 → 高亮对应 span 条。
- **拖拽 dock 上沿**改高度，范围 `--aos-trace-dock-min-height` … 60vh。

## Evidence Gate 模式常驻标记（MASTER §10 强制）
- 位置：`RunHeader` 内，与 run id 同行，**始终渲染**。
- strict：`gate.strict` 槽 + `--aos-muted` + 文案 `STRICT`。
- lenient：`gate.lenient` 槽 + `--aos-unverified` 描边 + 文案 `LENIENT · evidence gate relaxed`。**视觉必须明显可辨**，不能只换措辞。
- **禁止**只在设置页显示、禁止 hover 才出现。

## 五态

| 态 | 呈现 |
|---|---|
| Loading | 6 行骨架（`--aos-surface-raised`，行高 28px）+ 首个 span 到达前的静默光标。>3s 时补一行 `Model is loading into memory · qwen2.5-7b-q4_K_M (3.2 GB)` + 6px meter |
| Empty | `No runs yet` / `Start a run and every span will stream here.` / `Copy command` → `agentos run "your task"`（`.aos-btn-trace`） |
| Empty（已过滤） | `No runs match this filter` + `Clear filter`（secondary） |
| Error | 四类：模型（`Model failed to load` + 缺失文件名 + `Open models`）/ 工具（`Tool exited with code 1` + stderr 原文，`--aos-surface-inset` mono）/ 权限（`agentos needs read access to ~/repo/docs` + `Grant access`）/ 超时（`Run exceeded 120s limit` + `Raise limit`）。**就近显示在 RunHeader**，不在页顶 |
| Populated | `run-8f3c1a · running · 12.4s · qwen2.5-7b · 3,412 tok · 4 spans` |
| Edge | 超长 span 名 → `ellipsis` + `title`，不换行；>10,000 span → 虚拟化 + `Showing 1,000 of 24,318 spans · Load more` |

## 响应式
- `<1280px`：证据面板收为底部 dock（Tab 切换）。
- `<1024px`：左栏收为 56px 图标条（仅图标 + tooltip + `aria-label`）。
- `<768px`：单列 + 底部 TabBar ≤5 项；详情 dock 全屏化；**非对称布局回退单列**。

## 验收
- [ ] 首屏是真实 trace，不是口号 Hero
- [ ] 无彩色左边框；层级用 1px 导引线 + 缩进
- [ ] 所有时长 / 计数 mono + tabular-nums（否则直播时列会抖）
- [ ] 模式标记常驻且非 hover 依赖；lenient 视觉可辨
- [ ] 键盘可达全部操作；`↑↓←→ Enter / ⌘K` 生效
- [ ] selected 态**带文字标签**，不靠 filled 单独表达
- [ ] 直播追加不掉帧（新行无进入动画）
- [ ] 命令为 `agentos`，路径为 `~/.aetheros/`
