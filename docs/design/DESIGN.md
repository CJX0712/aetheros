# AetherOS — DESIGN.md

> 生成日期：2026-09-19 | 设计师：颜好看 | 版本：v0.2.0（含 B1–B5 一致性修正）
> 三轴刻度：**Variance = 5 / Motion = 3 / Density = 7**
> 寄存器：**Product**（主表面 `/app`；GitHub README 与单文件 Demo 为 Product 为主 + 有限品牌表达）
> 平台：**web** | 默认主题：**dark** | CSS 前缀：`--aos-`
> 图标库：**Tabler Icons 3.46.0（MIT）** | 字体：**Geist + Commit Mono**
> 源文件：`design-tokens.json`（W3C DTCG）→ `design-tokens.css`（UI 只引用后者）

AetherOS 把四个已有项目——aetherflow（智能体运行时）、glassbox（可验证 RAG 引擎）、evolver（自进化层）、aurora（本地自主智能体，纯 CPU 推理）——融合成一个统一、可直接安装使用的本地优先智能体操作系统。产品气质：**工程师工具、可信、可审计、本地优先、零云端依赖。**

---

## 1. 设计原则

五条原则，冲突时按序号优先级裁决。

**P1 — 可审计优先于好看。** 任何一次回答都必须能追溯到具体 span、具体 chunk、具体字符区间。界面上不允许出现"无法解释的结果"。透明度是功能，不是装饰。

**P2 — 密度是尊重，不是压迫。** 目标用户是每天盯屏六小时的工程师。默认 28px 行高、32px 表格行、1px 分隔线。不为"留白感"牺牲一屏能装下的信息量（VISUAL_DENSITY = 7）。

**P3 — 本地优先意味着离线可用。** 字体是可选增强（fallback 栈完整可渲染），不引 CDN，不引运行时图标库，不 vendored 全量 CJK（10–20MB）。任何视觉资产不允许成为网络依赖。

**P4 — 状态永远带文字。** 颜色只是加速识别的辅助通道。每个状态（verified / unverified / failed / running / idle）都必须同时具备图标 + 文字标签。违反此条即为无障碍事故。

**P5 — 装饰即噪音。** 无渐变主视觉、无发光边框、无装饰性毛玻璃、无空状态插画。唯一的"愉悦时刻"是功能性的：证据双向绑定高亮、span 直播追加、自进化谱系的 Δ 数值。

### 1.1 禁止清单（违反即退回）

- emoji 作为功能图标（全部由 Tabler Icons 承担）
- 紫色 / Indigo → 粉色渐变主视觉
- 硬编码颜色值（唯一例外 `#fff` `#000`）
- "Welcome to" / "Lorem ipsum" / "Sign up today" / "Get started" 等空洞占位
- 居中的「大标题 + 副标题 + CTA + 抽象图形」Hero
- 弹跳缓动 `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- 侧边彩色条纹边框（`border-left` > 1px 作为强调）
- 渐变文字（`background-clip: text`）
- 圆角 > 8px
- 虚构指标（"10,000+ 用户信赖"）

### 1.2 两条色彩硬规则（全项目强制）

**规则一 · The Trace Is Cyan Rule（青色只属于 trace）**
`--aos-accent`（`#3CCFC1`）只允许出现在 **trace 面、证据面、来源面**，以及 `running` 运行状态。具体允许：瀑布条、span 光标、证据双向绑定高亮、来源深链、运行中状态点。
**禁止**：营销 CTA、安装按钮、落地页主按钮、品牌推广位一律不得使用青色。这些位置使用**反相中性**（`--aos-fg` 底 + `--aos-bg` 字，16:1），对应工具类 `.aos-btn-cta`。
理由：青色一旦被营销挪用，它在 trace 里的"测量信号"含义就被稀释——用户会在满是青色的页面里失去对真实运行数据的定位能力。

**规则二 · Amber Means Unverified Rule（琥珀 = 证据不完整）**
`--aos-signal-amber`（`#E8A33D`）**只**用于标注「证据链不完整的断言」。
**禁止**作为通用 warning：磁盘余量、延迟阈值、资源占用、表单校验都不得使用琥珀。资源计（CPU / 内存 / 上下文）超过阈值时改用 `--aos-meter-fill-critical`（红）或维持中性 `--aos-meter-fill`，并强制附文字百分比。
理由：琥珀是本项目里唯一承载"可验证性"语义的颜色。一旦它同时表示"磁盘快满了"，用户就无法一眼分辨「这句话没有依据」和「这台机器快满了」——这是两类完全不同的风险。

---

## 2. 对标分析

| 对标 | 借鉴什么 | 明确不借鉴什么 |
|---|---|---|
| **Linear** | 密度、键盘优先、零装饰、状态语义克制 | 蓝紫调（撞 AI 模板味） |
| **Warp** | **命令块 Block** 概念——每条命令与其输出是一个可复制 / 可书签 / 可分享的实体 | 暖调近黑 + 暖白字；紫色强调色 `#C7AEFF`；生活方式化营销语气 |
| **Arize Phoenix** | OpenInference / OTel 的 span 语义分类，评估分数内联回 span | Python-notebook 的数据科学观感 |
| **Langfuse** | 瀑布 + 嵌套树 + 元数据面板三件套；observation 列表优先的检索路径 | 卡片化的低密度布局 |
| **Raycast** | 4px 网格、克制的单强调色、圆角 ≤12 | 天蓝 `#56c2ff` 主色 |
| **Perplexity / NotebookLM / ChatGPT** | RAG 引用的六态验证阶梯：检索中 → 已落地 → 预览 → 审计 → 质疑 → 已更新 | 消费级圆润卡片与营销化措辞 |

**关键决策：直接采用 OTel span 语义作为 UI 的信息骨架，不自造分类。** 用户已熟悉 span / trace / generation 这套词汇，复用它就是"赢得熟悉感"的最短路径。

对标结论：**Linear 的密度 × Phoenix 的可审计语义 × Warp 的块实体交互。**

---

## 3. 配色系统

### 3.1 为什么是冷中性 + 迹青

- **冷中性石墨（`#0A0D0E`）** 而非暖调近黑：暖近黑（OKLCH  hue 40–100 的低彩度带）在深色 UI 里一律读作奶油 / 沙色 / 纸张色，是被大量 AI 工具默认的色带。冷中性避开这个 monoculture，同时更贴合"仪器 / 控制台"的心智。
- **迹青 `#3CCFC1`** 读作"测量 / 读出 / 信号"，不是"AI 魔法"。它避开两个雷区：既不是 Tailwind 默认 Indigo，也不是紫色系。
- **琥珀 `#E8A33D` 被语义锁定**为"证据不完整"，这是全系统最重要的一条色义约定（见 1.2 规则二）。
- **浅色主题中 accent 加深**（`#0E7F75`）而非提亮，保证白字压青仍有 4.90:1。

### 3.2 深色主题（默认）

| Token | 值 | 角色 | 对比度（vs bg） |
|---|---|---|---|
| `--aos-bg` | `#0A0D0E` | 页面背景，冷石墨 | — |
| `--aos-surface` | `#121618` | 面板 / 卡片 | — |
| `--aos-surface-raised` | `#181C1E` | 表头、粘性行、抬升证据卡 | — |
| `--aos-surface-inset` | `#07090A` | 终端块、代码、Raw JSON | — |
| `--aos-fg` | `#E6EBEC` | 主文本（冷灰白，非纯白） | 16.2:1 |
| `--aos-fg-secondary` | `#B4BDC0` | 正文、表格单元 | 9.9:1 |
| `--aos-muted` | `#8A9498` | 次级标签 | 6.3:1 |
| `--aos-meta` | `#7A8488` | 时间戳、哈希、字符偏移 | 5.1:1 |
| `--aos-border` | `#2A3134` | 默认 1px 发丝线 | — |
| `--aos-border-soft` | `rgba(255,255,255,.06)` | 行分隔线 | — |
| `--aos-border-strong` | `rgba(255,255,255,.16)` | 表头、激活面板边 | — |
| `--aos-accent` | `#3CCFC1` | 迹青（规则一） | 10.2:1 |
| `--aos-accent-hover` | `#4FDCD0` | | |
| `--aos-accent-on` | `#04201D` | 压在青上的前景色 | 8.9:1 |
| `--aos-accent-soft` | `rgba(60,207,193,.12)` | 激活态清洗 | — |
| `--aos-signal-amber` | `#E8A33D` | 证据不完整（规则二） | 9.1:1 |
| `--aos-unverified` | `= --aos-signal-amber` | 证据链不完整 | 9.1:1 |
| `--aos-verified` | `#57B87A` | 证据链完整且落地 | 7.9:1 |
| `--aos-failed` | `#E5544B` | 失败 / 回滚 / 无据 | 5.3:1 |
| `--aos-running` | `#3CCFC1` | 运行中（trace 面，合规） | 10.2:1 |
| `--aos-idle` | `#7A8488` | 未开始 / 空闲 | 5.1:1 |

**硬约束**：白字压 `#3CCFC1` 仅约 2.2:1，不达标。青色按钮上的文字**必须**是 `--aos-accent-on`。建议写进 lint 规则。

### 3.3 资源计专用色（不占用琥珀）

| Token | 值 | 用途 |
|---|---|---|
| `--aos-meter-fill` | `#B4BDC0` | 常态填充 |
| `--aos-meter-fill-critical` | `#E5544B` | 超过 `criticalThreshold = 0.8`，且必须附文字百分比 |
| `--aos-meter-track` | `#07090A` | 轨道 |

### 3.4 Span 分类：单色相 + 密度分级

Span 种类**不引入竞争色相**。全部使用迹青，靠填充密度分级，再配 16px Tabler 图标 + 文字标签承担识别：

| Span kind | 填充 token | 不透明度 |
|---|---|---|
| agent | `--aos-span-agent` | 46% |
| llm | `--aos-span-llm` | 38% |
| retrieval | `--aos-span-retrieval` | 30% |
| tool | `--aos-span-tool` | 22% |
| think | `--aos-span-think` | 14% |
| failed | `--aos-span-failed` | 26%（红） |

1px 上边线：`--aos-span-stroke`（`#4FDCD0`），失败 span 用 `--aos-span-stroke-failed`。
理由：Density 7 的画布上，五个色相会让瀑布图变成彩色噪音；单一色相 + 密度分级 + 图标 + 标签，既保留可扫描性又守住"trace 是青色"的规则。

### 3.5 浅色主题

`--aos-bg #F7F9F9` / `--aos-surface #FFFFFF` / `--aos-surface-raised #F1F4F4` / `--aos-surface-inset #E9EDEE` / `--aos-border #D5DBDD` / `--aos-fg #0F1416` / `--aos-fg-secondary #3C464A` / `--aos-muted #5F6A6E` / `--aos-meta #767F82` / `--aos-accent #0E7F75` / `--aos-accent-on #FFFFFF` / `--aos-signal-amber #C4842A` / `--aos-verified #2F7A4A` / `--aos-failed #A8352E`。

### 3.6 每屏强调色配额

`--aos-accent` 每屏**最多 2 处可见使用**。它绝不作为通用数据语义色——数据语义由 verified / unverified / failed / running / idle 承担。

---

## 4. 字体系统

### 4.1 字体栈

```css
--aos-font-sans: "Geist", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
--aos-font-mono: "Commit Mono", "Sarasa Mono SC", "Cascadia Mono", Consolas, monospace;
--aos-font-cjk-optional: "Sarasa Gothic SC", "Sarasa Mono SC", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC";
```

- **Geist**（SIL OFL 1.1，Vercel × Basement Studio）：UI 与正文。几何无衬线，`tnum` 数位在密集表格中稳定。
- **Commit Mono**（SIL OFL 1.1）：所有数字、代码、trace 内容。选择它而非 JetBrains Mono 的理由是辨识度——等宽字体是本项目出现频率最高的视觉元素（瀑布时长、token 数、哈希、Δ 值），不应该是人人都在用的那一款。
- **CJK 走系统栈，不 vendored 全量 CJK**（10–20MB）。PingFang SC（macOS）/ Microsoft YaHei（Windows）原生可用，离线且零体积。
- **可选离线补更纱黑体**：`agentos fonts install-cjk` 安装 Sarasa Gothic SC。这是增强，不是依赖——不装也能正确渲染。

### 4.2 已否决的方案

- **Switzer**：ITF Free Font License 是闭源许可，**禁止修改与再分发**，与开源产品不兼容。不作为主选，也不作为 fallback。
- **Noto Sans SC 全量自托管**：1MB+ 且需覆盖全 CJK 区间，改为系统栈 + 可选安装。
- **字体走 CDN**：零云端依赖是产品定位，视觉资产不能先破这个约束。必须 `font-display: swap` + 子集化自托管。

### 4.3 字阶（名义 1.18 比，吸附到 px 网格）

`11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 30 / 38` px → `--aos-text-{2xs,xs,sm,base,md,lg,xl,2xl,3xl,4xl}`
其中 12 / 14 是为驾驶舱密度额外插入的 UI chromium 档位。

### 4.4 字重三级

`400 read`（正文）/ `510 emphasize`（小标题、表头、按钮）/ `590 announce`（大标题、CTA）

### 4.5 行高与字距

| 场景 | 行高 | 字距 |
|---|---|---|
| 正文 | 1.55 | 0 |
| 标题 | 1.25 | ≥30px 时 `-0.018em` |
| 密集数据 | 1.45 | 0 |
| 11–13px 小字 | 1.45 | `+0.02em` |
| ALL CAPS 标签 | 1.15 | **`+0.08em`（强制）** |

### 4.6 数字的硬规则

**所有时间、计数、字节、分数、偏移量、Δ 值一律使用 `--aos-font-mono` + `font-variant-numeric: tabular-nums`。** 比例数字会让瀑布列与 metric strip 在直播更新时抖动，在 Density 7 下这会直接摧毁可扫描性。工具类：`.aos-mono` / `.aos-duration` / `.aos-metric` / `.aos-delta` / `.aos-id`。

---

## 5. 图标系统

**唯一图标库：Tabler Icons 3.46.0**（MIT，6184 枚 = outline 5130 + filled 1054，24×24 栅格 / 2px stroke）。

### 5.1 为什么是 Tabler 而不是 Lucide

Lucide 是 outline-only，**没有 filled 变体**。本产品有大量 active / selected 态（当前 span、选中的证据卡、激活的页签、运行中的技能）。缺了 filled 变体，这些状态要么靠描边加粗硬凑，要么被迫引入第二套图标库——后者直接违反 P0「只锁一套、全项目统一不混用」。Tabler 同时提供 outline 与 filled 两套同构图标，一套库即可覆盖全部状态。

其余优势：6184 枚的覆盖面足以支撑 agent OS 的概念面（trace、span、retrieval、skill lineage、模型、资源）；24×24 / 2px 与我们的密度匹配；MIT 许可对开源产品最友好；SVG path 可内联，满足单文件 HTML 零依赖的硬约束。

### 5.2 尺寸与描边规范

| 用途 | 尺寸 |
|---|---|
| 行内 / 表格单元格 | 16px |
| 按钮内 / 导航 | 20px |
| 独立 / 空状态 / 面板标题 | 24px |

**描边宽度：`ICON_STROKE = 2`（24 网格用户单位）单一常量。禁止按尺寸预计算。**

> 本节曾写作「描边 = size / 12」（16px→1.33）。**该规则已作废**（终裁见 `design-system/MASTER.md` §9）。
> 原因：SVG 的 `viewBox` 会把用户单位二次缩放。按尺寸预计算出的 1.33 被 viewBox 再乘一次，16px 图标实际会**变粗**，与意图相反。单一常量 2 在 24 网格下，无论渲染成 16/20/24px 都保持正确光学重量。

### 5.3 语义映射

> **本表仅为人类可读摘录。权威清单是 `icon-semantics.md`（语义槽 → Tabler 绑定）。**
> **组件禁止引用图标名**，只引用语义槽；`Icon[A-Z]` 出现在组件里 = CI fail。
> `IconBrain` 已拉黑（AI 模板味），本地推理用 `model.local` 槽，提示响应用 `model.prompt` 槽。

| 概念 | outline | filled（active / selected 态） |
|---|---|---|
| 运行 / 执行 | `IconPlayerPlay` | `IconPlayerPlayFilled` |
| 停止 / 中止 | `IconPlayerStop` | `IconPlayerStopFilled` |
| 重放 | `IconHistory` | `IconHistoryFilled` |
| 对比 / diff | `IconFileDiff` | `IconFileDiffFilled` |
| 检索 | `IconSearch` | — |
| 工具调用 | `IconTool` | `IconToolFilled` |
| 推理 / LLM | 语义槽 `model.local` | — |
| 证据 / 引用 | `IconQuote` | `IconQuoteFilled` |
| 已核验 | `IconCircleCheck` | `IconCircleCheckFilled` |
| 待核验 / 证据不完整 | `IconCircleDashed` | 无 filled → 见下方回退规则 |
| 未落地 / 无据 | `IconAlertTriangle` | `IconAlertTriangleFilled` |
| 失败 | `IconCircleX` | `IconCircleXFilled` |
| 技能 / 自进化谱系 | `IconBinaryTree2` | 无 filled → 见下方回退规则 |
| 本地 / 离线运行 | `IconServer` | 无 filled → 见下方回退规则 |
| 模型 / CPU | `IconCpu` | `IconCpuFilled` |
| 时间线 / trace | `IconTimeline` | — |
| 终端 | `IconTerminal2` | — |
| 复制 | `IconCopy` | — |
| 导出 | `IconDownload` | — |
| 过滤 | `IconFilter` | `IconFilterFilled` |
| 折叠 / 展开 | `IconChevronRight` / `IconChevronDown` | — |
| 回滚 / 恢复 | `IconRestore` | — |
| 设置 | `IconSettings` | `IconSettingsFilled` |
| 关闭 | `IconX` | — |

**回退规则**：若某个图标在 filled 集（1054 枚）中不存在，active / selected 态改用「outline + `--aos-accent` 描边色 + 描边加粗至 2.5」，**绝不引入第二套图标库**。

### 5.4 无障碍规则

- 纯图标按钮**必须**带 `aria-label`，并配 tooltip。
- 图标颜色一律通过 token 引用（`--aos-fg-secondary` / `--aos-muted` / `--aos-accent`），禁止 inline 色值。
- **零 emoji。** 功能图标、状态图标、空状态图标全部由 Tabler 承担。

---

## 6. 间距、圆角与层级

### 6.1 间距（4px 基准网格）

仅允许：`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`（`--aos-space-1` … `--aos-space-16`）。
禁止 5 / 7 / 13 / 15 / 22 / 30 等非标值出现在布局中。

### 6.2 圆角（硬天花板 8px）

`sm 4px`（徽章、chip、按钮）/ `md 6px`（输入框、面板）/ `lg 8px`（弹窗、抽屉，全站最大值）/ `pill 9999px`。
**任何元素不得超过 8px。** 卡片上限同样是 8px。

### 6.3 层级（亮度递进 + 1px 发丝线，不用模糊阴影）

| Token | 值 | 用途 |
|---|---|---|
| `--aos-elev-flat` | `none` | 默认。所有数据行与面板 |
| `--aos-elev-ring` | `inset 0 0 0 1px var(--aos-border)` | 面板边 |
| `--aos-elev-raised` | ring + `0 1px 2px var(--aos-scrim-soft)` | 表头、抬升证据卡、hover 行 |
| `--aos-elev-overlay` | `0 0 0 1px hairline` + `0 8px 24px -8px scrim` | 浮层 / 下拉 / 命令面板 |

**毛玻璃唯一合法场景**：`--aos-elev-overlay` 之上的 `backdrop-filter: blur(8px)`。理由是功能性（把浮层与内容分离），不是装饰。禁止在卡片、Hero、按钮上使用。

### 6.4 z-index

`base 0 / sticky 10 / panel 20 / overlay 100 / modal 200 / toast 300`。六档之外即为 bug。

---

## 7. 动效

MOTION_INTENSITY = 3：只做功能性动效，无装饰动画，无页面加载编排。

| Token | 时长 | 场景 |
|---|---|---|
| `--aos-motion-instant` | 80ms | 按下、激活、开关 |
| `--aos-motion-fast` | 120ms | hover、状态确认 |
| `--aos-motion-base` | 180ms | 面板展开、下拉、证据绑定脉冲 |
| `--aos-motion-slow` | 260ms | 抽屉、模态 |

缓动：`--aos-ease-standard: cubic-bezier(0.2, 0, 0, 1)`（默认，减速不回弹）/ `--aos-ease-emphasized: cubic-bezier(0.4, 0, 0.2, 1)`（跨屏过渡）。

**禁令**
- 弹跳缓动 `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- 超过 400ms 的动画
- 同时对 3 个以上元素施加动画
- 动画 `width` / `height`（只动 `transform` / `opacity`）
- **逐 token 打字机动画**：直播输出不做逐字动画，只保留一个静默光标。省性能，也避免 reduced-motion 下失控。

**reduced-motion**：`prefers-reduced-motion: reduce` 时四个 duration token 全部降为 `0ms`，并对所有元素强制 `animation-duration: 0.01ms` / `transition-duration: 0.01ms` / `scroll-behavior: auto`。

---

## 8. 组件范式

### 8.1 Run 时间线 / Trace 瀑布（首屏）

首屏**就是**这个界面。没有居中 Hero，没有口号。

```
┌──────────┬────────────────────────────────────┬──────────────┐
│ 左栏 240 │  中央：run 头 + 瀑布               │ 右栏 360     │
│ 运行列表 │                                     │ 证据链面板   │
│          │  ── run 头 ──────────────────────   │              │
│ 今日     │  run-8f3c1a  [IconPlayerPlay]       │ 证据 7       │
│  ▸ 重构… │  qwen2.5-7b · 3,412 tok · 4 span   │ 已落地 5     │
│  ▸ 检索… │  [重放][导出][对比][停止]           │ 待核验 2     │
│ 昨日     │  ── 瀑布 ───────────────────────    │              │
│  ▸ 测试… │  agent.run     ████████████ 12.4s   │ [1] chunk 3  │
│          │   ├ retrieve   ██ 0.42s             │ [2] chunk 7  │
│          │   ├ llm        ██████ 8.10s         │ ...          │
│          │   └ tool:bash  ███ 3.88s            │              │
│          │  ── 详情 dock（默认 280，可拉伸）── │              │
│          │  I/O | Prompt | Retrieved | Raw     │              │
└──────────┴────────────────────────────────────┴──────────────┘
```

- 行高 28px，层级缩进 12px，配 1px 竖向**导引线**。**禁止用彩色左边框**表示层级。
- 瀑布条：左偏移 = start%，宽度 = duration%（`--aos-trace-bar-min-width: 2px` 保证亚毫秒 span 可见）。填充用 `--aos-span-*`（青色密度分级），1px 上边用 `--aos-span-stroke`。这是 trace 面，青色合规。
- 详情 dock 四页签：I/O（mono）/ Prompt / Retrieved / Raw JSON。
- 键盘：`↑/↓` 移动，`←/→` 折叠展开，`Enter` 打开详情，`/` 聚焦过滤。
- **直播态**：新 span 从底部追加并自动滚动；用户上滚后中断自动滚动，浮出「N 条新 · 回到最新」胶囊。
- 五态：Loading（骨架行 + 静默光标）/ Empty（`No runs yet` + `Start a run and every span will stream here.` + `Copy command` → `agentos run "your task"`）/ Error（分类：模型 / 工具 / 权限 / 超时 + 重试）/ Populated / Edge（超长 span 名折叠，超万级 span 虚拟化）。
- **UI 文案以 `states-copy.md` 为准，主文案为英文**（面向国际开发者），本文中文描述仅用于说明意图，不是最终文案。CLI 可执行名一律 `agentos`，配置目录 `~/.aetheros/`。

### 8.2 RAG 证据链面板

```
证据 7 · 已落地 5 · 待核验 2 · 检索 12 片段 · 平均相关度 0.62
─────────────────────────────────────────────
[IconQuote] docs/architecture.md #chunk-3      ▁▄▆█ 0.81
            "…证据链以 char offset 锚定到原文，因此
             任意一句断言都可回溯到具体字符区间…"
            ~/repo/docs/architecture.md · 2026-09-18 · sha256:9f3c… · 1284–1402
            [打开原文] [标记误导] [复制引用]
─────────────────────────────────────────────
```

- 顶部**证据计数行**：证据 7 · 已落地 5 · 待核验 2。这是可审计性的第一入口。
- 引文**只高亮支撑句，不整块染色**。高亮 = `--aos-accent-soft` 背景 + 1px `--aos-accent` 下边线。
- 溯源元信息四件套：路径（mono）+ mtime + `sha256:` 前缀 + char offset 区间。
- **双向绑定高亮**：hover / focus 答案中的 `[3]` chip → 对应证据卡抬升（border → `--aos-accent`，bg → `--aos-surface-raised`）且支撑句脉冲一次（180ms）；click → 滚动入视 + 焦点转移 + 展开上下文。反向：hover 证据卡 → 答案中对应 chip 高亮。
- 六态验证阶梯：检索中 / 已落地 / 预览（sheet 显示标题 + 摘录 + 1/N 分页）/ 审计（来源计数行）/ 质疑（单条来源的「来源有误」反馈）/ 已更新。
- 状态语义：**verified** = `IconCircleCheckFilled` + `--aos-verified`；**unverified** = `IconCircleDashed` + `--aos-unverified`（琥珀，规则二）；**failed** = `IconCircleXFilled` + `--aos-failed`。**三者都带文字标签。**

### 8.3 技能库与自进化面板

- 左：可搜索技能表。列 = 技能名 / 版本（mono `v0.3.2`）/ 成功率 sparkline（12 根 2px 条，无坐标轴）/ 调用次数 / 状态（稳定 / 实验中 / 已弃用）。
- 右：**版本谱系（lineage）**。竖向谱系图：父技能 → 变异点（prompt diff / 新增工具 / 参数调整）→ 子技能。每节点带 Δ：`Δ成功率 +4.2pt`、`Δ耗时 -180ms`，用 `.aos-delta[data-sign]` + `▲`/`▼` 符号 + 有符号数字，**不靠颜色单通道表达**。
- 进化控制：候选生成中（进度 + 中止）、A/B 双栏 diff、晋升 / 回滚（回滚用 `--aos-failed` + 二次确认）。
- 空态：「尚无进化记录——技能累计 ≥20 次调用后才会生成候选」+ 「运行一次评估」按钮。
- Edge：超长 diff 折叠 + 「展开完整 diff」；候选过多时列表虚拟化。

### 8.4 本地模型与资源面板

- 顶栏**常驻信任锚**：`[IconServer] 本地运行 · 出站请求 0`。这是全产品的可信度锚点，放在持久顶栏而不是写进 Hero 口号。
- **单行紧凑 metric strip**：`CPU 62% · 内存 4.1/16 GB · qwen2.5-7b-q4_K_M（已加载 3.2 GB）· 18.4 tok/s`。一行内联，全部 mono + tabular-nums。**拒绝「大数字 + 小标签 + 辅助数据」的 SaaS 指标卡片。**
- 模型表：名称 / 量化 / 大小 / 状态（已加载 / 已驻留 / 未加载，dot + 文字）/ 上下文 / 平均 tok/s / 操作（加载 · 卸载 · 设为默认）。
- 资源计：6px 细条，轨道 `--aos-meter-track`，常态填充 `--aos-meter-fill`；填充比 > 0.8 才切到 `--aos-meter-fill-critical`，且必须显示文字百分比。**不使用琥珀**（规则二）。无圆角胶囊、无发光。
- 线程数旁注：「小模型受内存带宽限制，线程过多反而变慢」——真实工程洞察，放在配置旁而非藏在文档里。

### 8.5 README / 单文件 Demo 首屏

- **非对称**：左 56% 是一个真实运行的 trace 瀑布（可交互），右 44% 是产品陈述 + 安装命令块（可复制）。
- 下方三栏展示真实产物：一段真实 trace 片段 / 一份真实证据链 JSON / 一次真实自进化 diff。
- 无虚构指标，无 3D 抽象图形，无「Trusted by」条。
- **首屏的 CTA（安装 / 复制命令）使用 `.aos-btn-cta`（反相中性），不是青色**——规则一。

### 8.6 组件状态矩阵（每个交互组件必覆盖）

| 状态 | 要求 |
|---|---|
| Default | `--aos-surface` + `--aos-elev-ring` |
| Hover | 背景 → `--aos-surface-raised`，120ms |
| Focus | `:focus-visible` + `--aos-focus-ring`，**永不移除** |
| Active | outline → filled 变体（Tabler），或 `--aos-accent` 描边；80ms |
| Disabled | `--aos-meta` 文字 + `opacity` 降低 + `cursor: not-allowed` |
| Loading | 骨架屏或 spinner，含预计时间；禁止整页 loading 遮罩 |
| Error | 具体错误分类 + 重试按钮，就近字段显示 |
| Empty | 引导文案（说清触发条件）+ 具体操作按钮 |
| Success | 短暂 toast 或 inline 提示，不阻塞 |

### 8.7 按钮三族（按色彩规则划分，不是按尺寸）

| 类 | 用在哪 | 底色 / 字色 |
|---|---|---|
| `.aos-btn-trace` | trace / span / 证据面的操作（运行、重放、停止） | `--aos-accent` / `--aos-accent-on` |
| `.aos-btn-cta` | 营销、安装、文档等推广位 | `--aos-fg` / `--aos-bg`（反相中性，16:1） |
| `.aos-btn-secondary` | 其余全部默认操作 | transparent + 1px border / `--aos-fg-secondary` |
| `.aos-btn-danger` | 回滚、删除、中止 | transparent + 1px `--aos-failed` / `--aos-failed` |

---

## 9. 无障碍与验收清单

### 9.1 无障碍

- 正文对比度 ≥ 4.5:1，大字 ≥ 3:1。已知高危点：青色上的文字必须用 `--aos-accent-on`（深色），白字压青不达标（2.2:1）。
- 全部交互可键盘到达；`--aos-focus-ring` 3px，禁止 `outline: none` 无替代。
- 触摸目标 ≥ 44×44px。密集行内的图标按钮用 `.aos-hit` 伪元素扩展命中区，不放大视觉控件。
- 状态绝不单靠颜色：图标 + 文字 + 颜色三通道。
- 证据 chip 必须键盘可聚焦，popover 在 focus 与 click 时都打开（不只 hover）。
- `prefers-reduced-motion` 全量降级。
- 每个 section 有语义化 heading；表格有 `<th scope>`；直播区域用 `aria-live="polite"`。

### 9.2 响应式

断点 `640 / 768 / 1024 / 1280`。
`< 1024px`：证据面板转为底部抽屉（Tab 切换），左栏收为图标条。
`< 768px`：单列，底部 TabBar ≤ 5 项，详情 dock 全屏化。非对称布局在此断点必须回退为单列。

### 9.3 验收清单

**P0（任一不通过即退回）**
- [ ] 零 emoji 作为功能图标；全部为 Tabler Icons 3.46.0
- [ ] 无紫 / Indigo → 粉渐变主视觉
- [ ] 无 "Welcome to" / "Lorem ipsum" / "Sign up today" 类空洞占位
- [ ] 无硬编码颜色值，全部 `var(--aos-*)` 引用
- [ ] 首屏是真实 trace 流 / 证据链面板，不是居中口号 Hero
- [ ] 无弹跳缓动

**两条色彩硬规则**
- [ ] The Trace Is Cyan：青色仅出现在 trace / 证据 / 来源面与 running 态；营销 CTA 为反相中性
- [ ] Amber Means Unverified：琥珀仅标注证据链不完整；资源计 / 表单校验 / 通用告警均未使用琥珀

**设计系统**
- [ ] 颜色全部经 semantic / component token 引用，未出现 primitive token
- [ ] 间距全为 4/8/12/16/20/24/32/40/48/64
- [ ] 圆角全站 ≤ 8px
- [ ] 字体栈为 Geist + Commit Mono，CJK 走系统栈未 vendored，无 CDN
- [ ] 所有数字使用 mono + tabular-nums
- [ ] 图标尺寸仅 16 / 20 / 24，描边 = size / 12，同一图标的 active 态用 filled 变体
- [ ] 纯图标按钮均带 `aria-label`

**质量**
- [ ] 对比度达标（含青底上的深色文字）
- [ ] 动效 ≤ 400ms，reduced-motion 已降级
- [ ] 覆盖 640 / 768 / 1024 / 1280 四个断点
- [ ] 每个交互组件覆盖 9 态
- [ ] 五个核心界面各有明确的 Empty 与 Error 文案

### 9.4 实现指南（给前端）

1. `import tokens from './design-tokens.json'`；样式层引用 `design-tokens.css`。
2. 主题切换用 `<html data-theme="light">`。不要另写一套暗色覆盖。
3. 组件样式里出现的任何 `#xxxxxx` 都视为构建期错误，应在 lint 阶段拦截。
4. 图标从 `@tabler/icons-react` 按需引入；单文件 HTML 版本内联 path，不引运行时。
5. 所有瀑布列、metric strip、计数器的数字容器必须挂 `.aos-duration` / `.aos-metric` / `.aos-delta` 之一。
6. 已知坑：直播追加 span 时若逐个施加进入动画会掉帧——改为整行无动画插入，仅对新行做一次 180ms 背景淡出。
