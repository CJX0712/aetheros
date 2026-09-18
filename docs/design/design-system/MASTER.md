# AetherOS — 设计系统 MASTER（唯一事实来源）

> **本文件是全项目设计的最高权威。** 与 `DESIGN.md`、`tabler-icon-manifest.md`、任何组件代码冲突时，**以本文件为准**。
> 机器可读优先：前端/CI 应解析本文件与 `design-tokens.json`，不解析散文性文档。
> `DESIGN.md` 定位为**人类可读的设计契约（叙事、理由、对标）**；本文件定位为**值权威**。理由写在 DESIGN.md，值写在这里。

```
docs/design/
├── design-system/
│   ├── MASTER.md            ← 本文件（全局源，权威值）
│   └── pages/               ← 页面级 Override（仅写差异，不复制本文件）
├── screens/                 ← 5 个页面规格（= pages/ 的人类可读形态）
├── prompts/                 ← 给前端 Agent 的实现提示词
├── icon-semantics.md        ← 图标语义槽清单（不写死图标名）
├── states-copy.md           ← 五态文案 + 术语表
├── demo-engine-spec.md      ← 零依赖单文件引擎规格
├── landing-spec.md          ← GitHub README / 落地页规格
├── design-tokens.json       ← DTCG 三层源
└── design-tokens.css        ← 生成物，UI 只引用它
```

## 检索规则（设计或实现任一页面时执行）

1. 读本文件取全局值。
2. 检查 `design-system/pages/<page>.md`（人类可读版在 `screens/`）是否存在。存在 → 该文件的字段覆盖本文件对应字段，其余用本文件。
3. 页面 Override **只写差异**，不复制全局内容。

## 写入规则（反上下文坍缩）

- 本文件已存在时**禁止整篇重写**，只追加 / 修正具体条目。
- 每次变更必须在 §12 变更记录追加一行（日期 + 变更 + 原因 + 影响范围）。
- **token 重命名必须附带下游同步清单**，否则视为破坏性变更（历史上发生过两轮重命名，导致三份下游规格全量重扫）。

---

## 1. 身份

| 项 | 值 |
|---|---|
| 产品 | aetheros（仓库 `CJX0712/aetheros`） |
| CLI 可执行名 | `agentos`（**不是** `agent-os`） |
| 配置目录 | `~/.aetheros/`（**不是** `~/.agent-os/`） |
| 寄存器 | Product（主表面 `/app`）；README 与单文件 Demo 为 Product 为主 + 有限品牌表达 |
| 平台 | web |
| 三轴 | Variance 5 / Motion 3 / **Density 7（驾驶舱）** |
| 默认主题 | dark（`<html data-theme="light">` 切换） |
| CSS 前缀 | `--aos-` |
| 图标库 | **Tabler Icons 3.46.0（MIT）**，24×24 网格，**全项目唯一，禁止第二套** |
| UI 主语言 | 英文（面向国际开发者）；中文通过 zh-CN 语言包替换 |
| 文案源 | `states-copy.md`（禁止前端自行编造 Empty / Error 文案） |

## 2. 五条原则（冲突时按序号裁决）

- **P1 可审计优先于好看。** 任何回答必须可追溯到具体 span / chunk / 字符区间。界面上不允许出现无法解释的结果。
- **P2 密度是尊重。** 行高 28px、表格行 32px、1px 分隔线。不为留白感牺牲一屏信息量。
- **P3 本地优先 = 离线可用。** 字体是可选增强（fallback 栈必须完整可渲染），不引 CDN、不引运行时图标库、不 vendored 全量 CJK。零云端依赖是信任基础，视觉资产不得先破它。
- **P4 状态永远带文字。** 每个状态必须同时具备**图标 + 文字标签 + 颜色**三通道。颜色只是加速识别的辅助通道。**filled 图标永不替代文字标签。**
- **P5 装饰即噪音。** 无渐变主视觉、无发光边框、无装饰性毛玻璃、无空状态插画。唯一"愉悦时刻"是功能性的：证据双向绑定高亮、span 直播追加、谱系 Δ 数值。

## 3. 禁止清单（违反即退回）

| # | 禁止 | 备注 |
|---|---|---|
| 1 | emoji 作为功能图标 | 全部由 Tabler 承担 |
| 2 | 紫 / Indigo → 粉渐变主视觉 | — |
| 3 | 硬编码颜色值 | 唯一例外 `#fff` `#000` |
| 4 | "Welcome to" / "Lorem ipsum" / "Sign up today" | — |
| 5 | 居中「大标题 + 副标题 + CTA + 抽象图形」Hero | 首屏必须是真实 trace |
| 6 | 弹跳缓动 `cubic-bezier(0.68,-0.55,0.265,1.55)` | — |
| 7 | 侧边彩色条纹边框（`border-left` > 1px 作强调） | 层级用 1px 导引线 |
| 8 | 渐变文字（`background-clip: text`） | — |
| 9 | 圆角 > 8px | 全站硬天花板 |
| 10 | 虚构指标（"10,000+ users"、"99.9%"） | 数字必须来自真实计数器 |
| 11 | `brain` / `sparkles` 图标 | AI 模板味。本地推理用 CPU 图标，提示响应用消息图标 |
| 12 | 第二套图标库混入 | 品牌 logo 例外，走 simple-icons |

## 4. 两条色彩硬规则

**规则一 · The Trace Is Cyan（青色只属于 trace）**
`--aos-accent` 只允许出现在 **trace 面、证据面、来源面** 与 `running` 状态：瀑布条、span 光标、证据双向绑定高亮、来源深链、运行中状态点。
**禁止**：营销 CTA、安装按钮、落地页主按钮、品牌推广位使用青色 → 一律用 `.aos-btn-cta`（反相中性）。
理由：青色被营销挪用后，它在 trace 里的"测量信号"含义被稀释。

**规则二 · Amber Means Unverified（琥珀 = 证据不完整）**
`--aos-signal-amber` **只**标注「证据链不完整的断言」。磁盘余量、延迟阈值、资源占用、表单校验**一律不得使用琥珀** → 资源计用 `--aos-meter-fill-critical` 并强制附文字百分比。
理由：琥珀是唯一承载"可验证性"语义的颜色。它若同时表示"磁盘快满了"，用户就无法分辨「这句话没依据」与「机器快满了」这两类完全不同的风险。

## 5. 配色（深色默认）

| Token | 值 | 角色 | 对比度 vs bg |
|---|---|---|---|
| `--aos-bg` | `#0A0D0E` | 页面背景（冷石墨） | — |
| `--aos-surface` | `#121618` | 面板 / 卡片 | — |
| `--aos-surface-raised` | `#181C1E` | 表头、粘性行、抬升证据卡 | — |
| `--aos-surface-inset` | `#07090A` | 终端块、代码、Raw JSON | — |
| `--aos-fg` | `#E6EBEC` | 主文本 | 16.2:1 |
| `--aos-fg-secondary` | `#B4BDC0` | 正文、表格单元 | 9.9:1 |
| `--aos-muted` | `#8A9498` | 次级标签 | 6.3:1 |
| `--aos-meta` | `#7A8488` | 时间戳、哈希、偏移 | 5.1:1 |
| `--aos-border` | `#2A3134` | 默认 1px 发丝线 | — |
| `--aos-border-soft` | `rgba(255,255,255,.06)` | 行分隔线 | — |
| `--aos-border-strong` | `rgba(255,255,255,.16)` | 表头、激活面板边 | — |
| `--aos-accent` | `#3CCFC1` | 迹青（规则一） | 10.2:1 |
| `--aos-accent-hover` | `#4FDCD0` | | |
| `--aos-accent-on` | `#04201D` | 压在青上的前景色 | 8.9:1 |
| `--aos-accent-soft` | `rgba(60,207,193,.12)` | 激活态清洗 | — |
| `--aos-signal-amber` | `#E8A33D` | 证据不完整（规则二） | 9.1:1 |
| `--aos-unverified` | `= --aos-signal-amber` | 证据链不完整 | 9.1:1 |
| `--aos-verified` | `#57B87A` | 已落地 | 7.9:1 |
| `--aos-failed` | `#E5544B` | 失败 / 回滚 / 无据 | 5.3:1 |
| `--aos-running` | `#3CCFC1` | 运行中 | 10.2:1 |
| `--aos-idle` | `#7A8488` | 空闲 / 未开始 | 5.1:1 |
| `--aos-meter-fill` | `#B4BDC0` | 资源计常态 | — |
| `--aos-meter-fill-critical` | `#E5544B` | >0.8 阈值，须附文字百分比 | — |
| `--aos-meter-track` | `#07090A` | 资源计轨道 | — |

**硬约束**：白字压 `#3CCFC1` 仅约 2.2:1 → 青底上的文字**必须**是 `--aos-accent-on`。写进 lint。

**浅色主题**：`bg #F7F9F9` / `surface #FFFFFF` / `surface-raised #F1F4F4` / `surface-inset #E9EDEE` / `border #D5DBDD` / `fg #0F1416` / `fg-secondary #3C464A` / `muted #5F6A6E` / `meta #767F82` / `accent #0E7F75` / `accent-on #FFFFFF` / `signal-amber #C4842A` / `verified #2F7A4A` / `failed #A8352E`。

**Span 分类：单色相 + 密度分级**（不引入竞争色相，配图标 + 文字标签）

| kind | token | 不透明度 |
|---|---|---|
| agent | `--aos-span-agent` | 46% |
| llm | `--aos-span-llm` | 38% |
| retrieval | `--aos-span-retrieval` | 30% |
| tool | `--aos-span-tool` | 22% |
| think | `--aos-span-think` | 14% |
| failed | `--aos-span-failed` | 26%（红） |

1px 上边线 `--aos-span-stroke`（`#4FDCD0`），失败用 `--aos-span-stroke-failed`。

**配额**：`--aos-accent` 每屏最多 2 处可见使用。

## 6. 字体

```css
--aos-font-sans: "Geist", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
--aos-font-mono: "Commit Mono", "Sarasa Mono SC", "Cascadia Mono", Consolas, monospace;
--aos-font-cjk-optional: "Sarasa Gothic SC", "Sarasa Mono SC", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC";
```

- Geist（SIL OFL 1.1）：UI 与正文。**Commit Mono**（SIL OFL 1.1）：所有数字、代码、trace 内容。
- CJK 走系统栈，**不 vendored 全量 CJK**（10–20MB）。可选 `agentos fonts install-cjk` 装更纱黑体——增强，不是依赖。
- 字阶 `11/12/13/14/16/18/20/24/30/38` → `--aos-text-{2xs,xs,sm,base,md,lg,xl,2xl,3xl,4xl}`
- 字重三级：`400 read` / `510 emphasize` / `590 announce`
- 行高：正文 1.55 / 标题 1.25 / 密集 1.45 / tight 1.15
- 字距：正文 0 / 11–13px `+0.02em` / ALL CAPS `+0.08em`（强制）/ ≥30px `-0.018em`
- **所有时间、计数、字节、分数、偏移、Δ 一律 mono + `tabular-nums`**。工具类 `.aos-mono` `.aos-duration` `.aos-metric` `.aos-delta` `.aos-id`。

## 7. 间距 / 圆角 / 层级

- 间距（4px 网格）：`4/8/12/16/20/24/32/40/48/64`。禁止 5/7/13/15/22/30。
- 圆角：`sm 4` / `md 6` / `lg 8`（**全站最大值**）/ `pill 9999px`。
- 层级用亮度递进 + 1px 发丝线，**不用模糊阴影**：`--aos-elev-flat none` / `--aos-elev-ring inset 0 0 0 1px border` / `--aos-elev-raised`（ring + `0 1px 2px scrim-soft`）/ `--aos-elev-overlay`（唯一允许 `backdrop-filter: blur(8px)` 处，功能性非装饰）。
- z-index 六档：`base 0 / sticky 10 / panel 20 / overlay 100 / modal 200 / toast 300`。
- 焦点环 `--aos-focus-ring` 3px，**永不移除**。必须保留 `outline: 2px solid transparent` 作 forced-colors 降级（Windows 高对比会剥离 box-shadow）。

## 8. 动效（Motion 3）

| Token | 时长 | 场景 |
|---|---|---|
| `--aos-motion-instant` | 80ms | 按下、激活、开关 |
| `--aos-motion-fast` | 120ms | hover、状态确认 |
| `--aos-motion-base` | 180ms | 面板展开、下拉、证据绑定脉冲 |
| `--aos-motion-slow` | 260ms | 抽屉、模态 |

缓动 `--aos-ease-standard cubic-bezier(0.2,0,0,1)` / `--aos-ease-emphasized cubic-bezier(0.4,0,0.2,1)`。
**只动 `transform` / `opacity`**；不对 >3 个元素同时施加动画；直播 span 整行无动画插入（仅新行背景 180ms 淡出）；无逐 token 打字机动画。
`prefers-reduced-motion: reduce` → 全部降 0.01ms，`scroll-behavior: auto`。

## 9. 图标系统

- **Tabler Icons 3.46.0**，全项目唯一。尺寸仅 **16 / 20 / 24**。
- **`ICON_STROKE = 2`（24 网格用户单位）单一常量。禁止按尺寸预计算描边宽度**——viewBox 会二次缩放，预计算值会被再乘一次，导致 16px 图标变粗。
  > 本条**取代** `DESIGN.md §5.2` 与 `tabler-icon-manifest.md §1` 中的「描边 = size / 12」（16→1.33 / 20→1.67）。那两处已作废。
- 颜色一律 `currentColor`，由 `var(--aos-*)` 控制，禁止 inline 色值。
- active / selected：优先 filled 变体；filled 集不存在的（`tool` / `cpu` 等）用「outline + `--aos-accent` 描边 + 加粗」。**filled 永不替代文字标签（P4）。**
- **组件只引用语义槽，不引用图标名。** 槽 → 图标名的绑定见 `icon-semantics.md`，由构建脚本解析 + CI 门禁校验。
- 纯图标按钮必须 `aria-label` + tooltip。零 emoji。

## 10. Evidence Gate 模式常驻标记（强制）

依据 PRD R-2：默认 **strict**（未落地断言一律拦截），lenient 需显式开启（`agentos config set evidence.mode lenient`）。
**lenient 是「降级运行」不是「正常模式」，用户必须随时能看见自己在哪种模式里。**

三条硬约束：

1. **当前模式标记同时出现在三处**：trace 头、证据面板、**每条 span**。
2. **不依赖 hover / 点击 / 展开**才可见——必须常驻渲染。
3. **lenient 下视觉必须明显区别于 strict**，不能只是换个措辞。建议：lenient 时三处标记加 `--aos-unverified` 描边 + 语义槽 `gate.lenient` + 文案 `LENIENT · evidence gate relaxed`。

理由：用户若不知道当前跑在 lenient，会把「没被拦截」误读成「有证据支撑」。这类误解一旦发生就摧毁整个产品的可信度。成本是一行常驻文字，收益是避免它。

## 11. 组件状态矩阵（每个交互组件必覆盖 9 态）

| 态 | 要求 |
|---|---|
| Default | `--aos-surface` + `--aos-elev-ring` |
| Hover | bg → `--aos-surface-raised`，120ms |
| Focus | `:focus-visible` + `--aos-focus-ring`，永不移除 |
| Active | filled 变体 或 `--aos-accent` 描边，**仍带文字**；80ms |
| Disabled | `--aos-meta` 文字 + 降 opacity + `cursor: not-allowed` |
| Loading | 骨架 / spinner + 预计时间；禁止整页遮罩 |
| Error | 具体分类 + 重试，就近字段显示 |
| Empty | 说清触发条件 + 具体操作按钮 |
| Success | 短暂 toast / inline，不阻塞 |

**按钮三族**（按色彩规则划分，不是按尺寸）

| 类 | 用在哪 | 底色 / 字色 |
|---|---|---|
| `.aos-btn-trace` | trace / span / 证据面操作 | `--aos-accent` / `--aos-accent-on` |
| `.aos-btn-cta` | 营销、安装、文档推广位 | `--aos-fg` / `--aos-bg`（反相中性 16:1） |
| `.aos-btn-secondary` | 其余默认操作 | transparent + 1px border / `--aos-fg-secondary` |
| `.aos-btn-danger` | 回滚、删除、中止 | transparent + 1px `--aos-failed` / `--aos-failed` |

**Δ 标记约定**：方向与好坏正交。`data-sign="up|down"` 决定箭头，`data-tone="good|bad|flat"` 决定颜色。缺 `data-tone` 回退 `--aos-muted`。**绝不由 sign 推导颜色**——「Δ latency −180ms」是 down 却是好事。

## 12. 变更记录

| 日期 | 变更 | 原因 | 影响范围 |
|---|---|---|---|
| 2026-09-19 | 建立 MASTER.md 作为唯一事实来源 | 此前 DESIGN.md / manifest / 各规格文件多头权威，且 token 名经历两轮重命名导致下游反复返工 | 全部设计消费方 |
| 2026-09-19 | 图标库终裁 **Tabler 3.46.0**，Lucide 全部作废 | Lucide 无 filled 变体，active/selected 态会逼出第二套库，违反 P0「只锁一套」 | 全部图标引用 |
| 2026-09-19 | `ICON_STROKE = 2` 单一常量，禁止按尺寸预计算 | 预计算值被 viewBox 二次缩放，16px 图标会变粗；取代原 size/12 规则 | DESIGN.md §5.2、manifest §1 作废 |
| 2026-09-19 | 新增 §10 Evidence Gate 模式常驻标记（三处、非 hover、lenient 视觉可辨） | lenient 是降级运行，用户必须随时可见自己在哪种模式 | trace 头 / 证据面板 / 每条 span |
| 2026-09-19 | 状态表达升级为强制三通道，**filled 永不替代文字标签** | 填充图形是单通道，弱于「底纹 + 描边 + 文字」三通道，且与 P4 冲突 | 全部 active/selected 态 |
