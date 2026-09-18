# aetheros — 单文件 HTML 演示引擎 · 视觉规格

> CLI 可执行名为 `agentos`，配置目录 `~/.aetheros/`。示例文案中出现的命令一律用 `agentos`，路径一律用 `~/.aetheros/`；写 `agent-os` 或 `~/.agent-os/` 视为错误。
>
> 约束：**零依赖单文件**。不得引 CDN 字体、不得引运行时图标库、不得引图表库、不得发任何网络请求。
> 视觉源：`design-tokens.css`（唯一真相源）；文案源：`states-copy.md`。
> 本文所有 token 名已于 2026-09-19 按 `design-tokens.css` 复核对齐。

---

## 1. 零依赖硬约束与实现替代方案

| 常规做法 | 本引擎做法 | 理由 |
|---|---|---|
| Google Fonts / Fontshare CDN | **纯系统字体栈**，Geist 仅在已安装时生效 | 离线可渲染是本产品的信任基础，字体只能是可选增强 |
| 运行时图标库（`lucide-react` 等） | **内联 `<svg><symbol>` sprite**，只内嵌实际用到的图标 | 单文件 + 零请求；tree-shaking 在单文件里没有意义 |
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

内联 `<svg style="display:none">` + `<symbol id="i-{name}" viewBox="0 0 24 24">`，引用 `<svg class="aos-icon"><use href="#i-cpu"/></svg>`。
统一属性：`fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"`，描边宽度按尺寸光学缩放（具体值待图标库裁定后一并定，见 DESIGN.md 待决项）。

> **图标库已裁定：Tabler Icons 3.46.0（MIT，24×24 / stroke 2），见 ADR-006。** 只内嵌 UI 真正引用到的图标，**不内嵌 `brain` / `sparkles`**——它们是 AI 模板味图标，与「测量仪器」定位冲突。本地推理用 `cpu`，提示响应用 `messages`。

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
