# aetheros — 单文件 HTML 演示引擎 · 视觉规格

> CLI 可执行名为 `agentos`，配置目录 `~/.aetheros/`。示例文案中出现的命令一律用 `agentos`，路径一律用 `~/.aetheros/`；写 `agent-os` 或 `~/.agent-os/` 视为错误。
>
> 约束：**零依赖单文件**。不得引 CDN 字体、不得引运行时图标库、不得引图表库、不得发任何网络请求。
> 视觉源：`design-tokens.css`（唯一真相源）；文案源：`states-copy.md`。
> 本文所有 token 名已于 2026-09-19 按 `design-tokens.css` 复核对齐。
> `packages/demo/index.html` 内联的 `:root` token 块是上游 `docs/design/design-tokens.css` 的**忠实子集**：primitive 层写字面 hex，semantic / component 层全部 `var()` 引用。单文件引擎必须内联 primitive——这是零依赖场景下唯一允许出现字面色值的位置，验收 §9「无硬编码色值」应理解为「primitive 块之外为零」。
> 图标：Tabler Icons 3.46.0，`ICON_STROKE = 2` 常量，尺寸 16 / 20 / 24px。

---

## 1. 零依赖硬约束与实现替代方案

| 常规做法 | 本引擎做法 | 理由 |
|---|---|---|
| Google Fonts / Fontshare CDN | **纯系统字体栈**，Geist 仅在已安装时生效 | 离线可渲染是本产品的信任基础，字体只能是可选增强 |
| 运行时图标库（`@tabler/icons-react` 等） | **内联 `<svg><symbol>` sprite**（Tabler 3.46.0 路径），只内嵌实际用到的图标 | 单文件 + 零请求；tree-shaking 在单文件里没有意义 |
| 图表库（Chart.js / D3） | **瀑布条 = div（left%/width%）**；**折线 / sparkline = 内联 SVG polyline**；**meter = div** | 全是手写 CSS/SVG 能表达的图形，引库是纯负担 |
| CSS 框架 | **手写 CSS，token 全部 `var(--aos-*)`** | 硬编码色值在构建期即视为错误 |
| 状态管理 | 原生 DOM + 一个 `state` 对象 | 无框架依赖 |

体积预算：**单文件 ≤ 200 KB**（内联 sprite 约 12 KB，CSS 约 25 KB，演示数据约 60 KB，逻辑约 30 KB）。

---

## 2. Token 子集（名称以 `design-tokens.css` 为准，照抄勿改）

```css
/* 表面 */ --aos-bg --aos-surface --aos-surface-raised --aos-surface-inset
/* 前景 */ --aos-fg --aos-fg-secondary --aos-muted --aos-meta
/* 边框 */ --aos-border --aos-border-soft --aos-border-strong
/* 强调（Rule 3：trace cyan，仅交互） */
   --aos-accent --aos-accent-hover --aos-accent-on --aos-accent-soft
/* 证据（Rule 4：Amber Means Unverified） */
   --aos-signal-amber --aos-unverified
/* 状态 */ --aos-verified --aos-failed --aos-running --aos-idle
/* 资源计（琥珀被预留，故计条为中性） */
   --aos-meter-fill --aos-meter-fill-critical --aos-meter-track
/* Span（一色 + 密度分级 + 图标 + 文字标签，颜色非唯一信号） */
   --aos-span-stroke --aos-span-stroke-failed
   --aos-span-{agent,llm,retrieval,tool,think,failed}
/* 字体 */ --aos-font-sans --aos-font-mono --aos-font-cjk-optional --aos-font-display
   --aos-text-{2xs,xs,sm,base,md,lg,xl,2xl,3xl,4xl}
   --aos-weight-{read,emphasize,announce}
   --aos-leading-{body,heading,dense,tight} --aos-tracking-{body,small,caps,display}
/* 节奏 */ --aos-space-{1,2,3,4,5,6,8,10,12,16} --aos-radius-{sm,md,lg,pill}
   --aos-elev-{flat,ring,raised,overlay} --aos-focus-ring
   --aos-motion-{instant,fast,base,slow} --aos-ease-standard --aos-ease-emphasized
   --aos-z-{base,sticky,panel,overlay,modal,toast}
/* 组件 */
   --aos-layout-{rail-width,evidence-width,container-max,topbar-height,statstrip-height}
   --aos-trace-{row-height,indent-step,guide-width,bar-height,bar-radius,bar-min-width,dock-height,dock-min-height}
   --aos-evidence-{chip-height,chip-padding-x,chip-radius,relevance-height,relevance-width,card-padding}
   --aos-button-{height-sm,height-md,padding-x,radius,icon-gap}
   --aos-input-{height,padding-x,radius}
   --aos-table-{header-height,row-height,divider-width}
   --aos-meter-{height,track-radius,critical-threshold}
   --aos-sparkline-{bar-width,bar-gap,height}
```

**命名陷阱（照抄即可）**
- 是 `--aos-surface-inset`，**不是** `--aos-surface-sunken`
- 是 `--aos-fg-secondary`，**不是** `--aos-fg-2`
- 是 `--aos-motion-base`，**不是** `--aos-motion-duration-base`
- 是 `--aos-meter-critical-threshold`，**不是** `--aos-meter-warn-threshold`
- **不存在** `--aos-success` / `--aos-warn` / `--aos-danger` / `--aos-pending` / `--aos-accent-active`。对应物是 `--aos-verified` / `--aos-unverified` / `--aos-failed` / `--aos-idle`
- `--aos-span-llm` 本身就是**填充色**（alias 到 `--aos-span-fill-llm`）；1px 上边用 `--aos-span-stroke`

主题切换：`<html data-theme="light">`，**不写第二套暗色覆盖**。默认 dark。

---

## 3. 布局

```
┌─────────────────────────────────────────────────────────┐
│ 顶栏 48px · cloud-off「Local only · 0 outbound requests」│
├─────────┬───────────────────────────────┬───────────────┤
│ 240px   │  flex                          │  360px        │
│ Run 列表│  run 头 + span 瀑布 + 详情 dock │  证据链面板   │
└─────────┴───────────────────────────────┴───────────────┘
```

**响应式（内容驱动，非设备驱动）**
- `<1280px`：证据面板收为可拖拽底部 dock
- `<1024px`：左栏收为 56px 图标条
- `<768px`：单列 + 底部 TabBar ≤5 项；**非对称布局在此断点必须回退单列**

---

## 4. 图标 sprite

内联 `<svg class="aos-sprite" aria-hidden="true" focusable="false">` + `<symbol id="i-{name}" viewBox="0 0 24 24">`，引用 `<svg class="aos-ic aos-ic-20" aria-hidden="true"><use href="#i-cpu"></use></svg>`。
统一属性：`fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"`。

**描边宽度：`ICON_STROKE = 2` 单一常量，三档尺寸共用，禁止按尺寸预计算**（终裁见 `design-system/MASTER.md` §9）。

Tabler 的 `stroke` 是 **24 viewBox 下的用户单位**；CSS `stroke-width` 作用到 SVG 上同样是用户单位，会被 viewBox **再缩放一次**。所以若按「渲染像素」口径预计算（16px 写 1.33），实际渲染 = `1.33 × 16/24 = 0.89px`，**图标会过细、几乎看不见**（不是变粗）。恒为 2 时由 viewBox 独自完成 24 → size 缩放：24px → 2px，16px → 1.33px，正是 Tabler 官方调好的光学比例。反转条件仅一条：1× 屏 16px 实拍截图证明确实糊。

```css
.aos-ic { fill: none; stroke: none; }
.aos-ic * { stroke-width: 2; }   /* ICON_STROKE */
.aos-ic-16 { width: 16px; height: 16px; }
.aos-ic-20 { width: 20px; height: 20px; }
.aos-ic-24 { width: 24px; height: 24px; }
```

**组件侧只写语义槽**（`icon-semantics.md`），槽 → sprite id 的映射只允许出现在一处。

**已拉黑，永不内嵌：** `brain`、`sparkles`、`wand`。它们是 AI 模板味图标，与「测量仪器」定位冲突。本地推理一律 `i-cpu`，提示与响应用 `message` / `text` 语义槽。

### 4.1 已内嵌 sprite id 清单（与 `packages/demo/index.html` 的 `<symbol>` 定义一一对应）

| 类别 | sprite id | 语义槽（`icon-semantics.md` §4） |
|---|---|---|
| 导航 | `i-timeline` | `nav.runs` |
| 导航 | `i-package` | `nav.skills` |
| 导航 | `i-cpu` | `nav.models` |
| 导航 | `i-settings` | `nav.settings` |
| 信任锚 | `i-cloud-off` | `resource.offline` |
| 运行操作 | `i-player-play-filled` | `run.start`（active 用 filled） |
| 运行操作 | `i-restore` | `run.replay` / `skill.rollback` |
| 运行操作 | `i-download` | `run.export` |
| 运行操作 | `i-file-diff` | `run.compare` / `file.diff` |
| span | `i-binary-tree-2` | `span.agent` |
| span | `i-list-tree` | `span.think`（已三方确认，见 §4.2 规则 1） |
| span | `i-cpu` | `span.llm` / `model.local` |
| span | `i-search` | `span.retrieval` |
| span | `i-tool` | `span.tool` |
| span | `i-shield-check` | 接地核验 / `gate.strict` |
| 证据 | `i-quote` | `evidence.quote` |
| 证据 | `i-file-search` | `evidence.locate` |
| 证据 | `i-circle-check-filled` | `evidence.verified` |
| 证据 | `i-circle-dashed` | `evidence.unverified` |
| 证据 | `i-circle-x` | `evidence.failed`（默认态 outline；与 verified / unverified 构成 check · dashed · x 同族） |
| 证据 | `i-alert-triangle` / `i-alert-triangle-filled` | 局部操作 Flag misleading / `gate.lenient`（预置，Demo 未渲染） |
| 操作 | `i-copy` | `action.copy` |

### 4.2 图标规则、剪枝口径与归属（v2 —— 已按图标域 owner 意见修订）

**规则 1 —— `span.think` → `IconListTree`（已三方确认）。**
该槽原绑 `IconClock` / `IconClockFilled`，而同一份 registry 又把 `span.duration`、`span.latency` 也绑到 `IconClock` —— 三槽同图标在密度 7 的瀑布里完全同构、互相淹没。现裁定 `span.think` → `IconListTree` / `—`（无 filled 变体，走「outline + `--aos-accent` 描边」回退规则，**不引入第二套库**）。`span.duration` 与 `span.latency` 继续共用 clock（二者都是时间量）。
**附带规则：同一行右侧同时出现 duration 与 latency 时，latency 去掉图标，只留 mono 数字 + 标签**，否则一行两个 clock 仍是同构噪音。
**待办：`icon-semantics.md` §4 的 `span.think` 行尚未同步**，需该文件 owner 落地（见规则 3）。

**规则 2 —— 「未引用即剪除」的口径是全项目，不是 Demo。**
本节初版结论「sprite 里 22 枚无引用、应全剪」**已被推翻**。`tabler-icon-manifest.md` 是全项目唯一图标源，必须覆盖完整控制台 IA（V1 Ask / V2 Models & Resources / V3 Runs / O1 Run detail / O2 Settings）与 `states-copy.md` 的全部 Empty / Error 态。§1 的「只内嵌实际用到的图标」只约束**单文件 Demo 的 sprite**（它没有 Phase 3，规模必须收窄）；manifest 必须保持完整，否则 Phase 3 会缺图标位、二次返工。
图标域 owner 逐枚核对后给出 3 枚可剪候选；实现方复核后对其中 1 枚提出异议，**暂定 2 枚可剪、20 枚保留**：

| 候选 | 判定 | 依据 |
|---|---|---|
| `i-gauge` | **剪** | 资源条已设计为无图标（纯 mono 标签 + 数字），无任何引用 |
| `i-layout-dashboard` | **剪** | 无任何规划视图引用 |
| `i-circle-check` | **保留（异议）** | 原判「与 `evidence.verified` 锁定名 `i-shield-check` 语义重复」不成立：registry §4 把 `evidence.verified` 绑到 `IconCircleCheck` / `IconCircleCheckFilled`，而 `IconShieldCheck` 绑的是 `gate.strict` 与 `file.verified`（校验通过）—— 两者不是同一槽。剪掉 `i-circle-check`（outline）会破坏 verified 的 **outline → filled 配对**，而「outline + filled 双变体」正是当初弃 Lucide 选 Tabler 的唯一理由 |

**保留集（20 枚）**：`i-activity`←Trace Empty、`i-blocks` / `i-git-branch`←技能库 Empty、`i-clock`←duration / latency、`i-terminal-2`←error 原始日志块、`i-filter`←V3 Runs、`i-chevron-right` / `i-chevron-down`←瀑布展开、`i-x`←关闭 / 移除引用 chip、`i-refresh`←Retry、`i-history`←Runs 历史、`i-circle-check`←verified 默认态、`i-alert-triangle-filled`←`gate.lenient`、`i-server`←`resource.disk`、`i-player-play` / `i-player-stop`(+filled)←Ask 视图运行控制、`i-quote-filled`←证据选中态、`i-arrow-up` / `i-arrow-down`←Δ 箭头。
（`i-server` 无需与 `cloud-off` 二选一：registry 里 `resource.disk` 已绑 `IconServer`，而信任锚用 `cloud-off` 语义更准 —— 建议把 `resource.offline` 改绑 `IconCloudOff`。）
**流程要求：** 每枚 `<symbol>` 标注 `usedBy: [view…]`，CI 校验口径改为「**全项目零引用**」而非「Demo 零引用」。否则两份清单必然各说各话 —— 这与 aetheros 变更记录里「token 重命名未附下游同步清单导致三份规格全量重扫」属同类事故。

**规则 3 —— `icon-semantics.md` 是 team-local 新文件，不是 upstream registry。**
`raw.githubusercontent.com/CJX0712/aetheros/main/docs/design/icon-semantics.md` 现返回 **404**；upstream `main` 里只有已发布的 `tabler-icon-manifest.md`。所以 `icon-semantics.md` 由本团队新建，**不是**已发布的 aetheros registry（`MASTER.md` 对它的引用只是计划）。该文件需明确 owner 并维护图标语义域；`demo-engine-spec.md` §4 与 Demo 的 sprite 由实现方维护；两者以 `tabler-icon-manifest.md` 为共同底座。

**Demo 侧现状（供剪枝时对照）：** Demo 的 sprite 现有 **22 枚**无 `href="#i-*"` / `icon("i-*")` 引用 —— 其中 **20 枚保留**、**2 枚可剪**（同上）。本次未剪，等 team-lead 签字后一次性执行。
另：`evidence.failed` 的 Demo 实现已从 `i-alert-triangle-filled` 改为 `i-circle-x`（registry 的 `IconCircleX`，与 verified / unverified 构成 check · dashed · x 同族）。此改动使 `i-circle-x` 转为「已引用」，同时 `i-alert-triangle-filled` 转为「未引用」—— 但它是 registry 中 `gate.lenient` 的绑定图标，属保留集，故未引用总数仍为 22。

---

## 5. 图形实现

**Span 瀑布条**：容器 `position: relative`；条 `left: calc(startPct * 1%); width: max(durationPct * 1%, var(--aos-trace-bar-min-width)); height: var(--aos-trace-bar-height); background: var(--aos-span-llm); border-top: 1px solid var(--aos-span-stroke)`。失败 span 换 `--aos-span-failed` + `--aos-span-stroke-failed`。
层级缩进用 `padding-inline-start: calc(level * var(--aos-trace-indent-step))` + 1px 竖向导引线（`--aos-trace-guide-width`），**禁止彩色左边框**。

**资源折线**：内联 `<svg viewBox="0 0 100 24" preserveAspectRatio="none"><polyline points="…" fill="none" stroke="var(--aos-accent)" stroke-width="1.5"/></svg>`。**无填充渐变、无发光**。

**Sparkline**：12 根 2px div 条（`--aos-sparkline-bar-width` / `bar-gap`），高度按比例，无坐标轴。

**Meter**：6px 细条，轨道 `--aos-meter-track`，填充 `--aos-meter-fill`；填充比 > `--aos-meter-critical-threshold`（0.8）切 `--aos-meter-fill-critical`。**不得用琥珀**——Amber Means Unverified Rule 把琥珀留给证据不完整。

---

## 6. 动效（MOTION_INTENSITY 3）

| 场景 | 实现 |
|---|---|
| span 行进入 | **整行无动画插入**，仅新行背景做一次 180ms 淡出（逐个施加进入动画会掉帧） |
| 证据绑定 | 目标卡 border → `--aos-accent`、bg → `--aos-surface-raised`，支撑句 180ms 脉冲一次 |
| hover / focus | 120ms（`--aos-motion-fast`） |
| 抽屉 / 模态 | 260ms（`--aos-motion-slow`），`--aos-ease-standard` |

**只动 `transform` / `opacity`**，不动 `width`/`height`/`top`/`left`。直播追加用 `scrollTop`，不做平滑滚动动画。
`prefers-reduced-motion: reduce` → 全部 duration 降为 `0.01ms`，`scroll-behavior: auto`。

---

## 7. 演示数据（真实感规则）

- 数字用**有机的真实值**：`12.4s`、`3,412 tok`、`18.4 tok/s`、`0.81`、`sha256:9f3c1a…`，不用 `10s`、`100`、`0.50`
- 模型名、量化名用真实写法：`qwen2.5-7b-q4_K_M`、`all-MiniLM-L6-v2`
- 文件路径与配置目录：`~/repo/docs/architecture.md`、`~/.aetheros/models`
- 时间戳带日期：`2026-09-18`
- char offset 区间：`1284–1402`
- **零虚构指标**：不出现 "Trusted by"、"99.9% uptime"、"10,000+ users"

---

## 8. 键盘与无障碍

`↑/↓` 移动行 · `←/→` 折叠展开 · `Enter` 打开详情 · `/` 聚焦过滤 · `Esc` 关闭浮层 · `⌘/Ctrl+K` 命令面板。
`:focus-visible` 用 `--aos-focus-ring`，**并保留 `outline: 2px solid transparent` 作为 forced-colors 降级**——Windows 强制高对比模式会剥离 box-shadow，只留 box-shadow 会让焦点指示完全消失。
密集行内 16px 图标按钮用 `.aos-hit::after` 伪元素把命中区扩到 **44×44**，不放大视觉控件。
直播区 `aria-live="polite"`，新 span 只播报 `Span added: retrieve, 0.42s`。
状态播报只靠文字：**`Grounded` / `Unverified` / `No source`** 三个词是屏幕阅读器能听到的全部信息，颜色不是信号。

---

## 9. 验收（P0）

- [ ] 文件可 `file://` 直接打开，Network 面板 **0 请求**
- [ ] 无任何 `#xxxxxx` 硬编码色值（构建期正则拦截）
- [ ] 零 emoji；图标全部来自内联 sprite，无第二套图标库
- [ ] 断网后视觉完整（字体回退系统栈）
- [ ] 首屏是真实 trace 瀑布，非居中 Hero
- [ ] 无弹跳缓动；`prefers-reduced-motion` 生效；forced-colors 下焦点仍可见
- [ ] Lighthouse：CLS < 0.1（所有图形容器预置 `aspect-ratio` 或固定高度）
- [ ] 命令与路径为 `agentos` / `~/.aetheros/`
