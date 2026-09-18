# Spec - aetheros v1.0.0

> 生成日期：2026-09-19
> 基于：PRD v1.0（`docs/prd/PRD.md`）+ 架构文档（`docs/architecture/ARCHITECTURE.md`）+ 设计规范（`docs/design/`）
> 状态：**已锁定**（用户授予全权，项目总监拍板；变更须走 §13 变更流程）
> 本文件是开发、测试、验收的唯一依据。任何与本文件冲突的口头结论一律以本文为准。

---

## 1. 产品定义

- **一句话描述**：唯一一个默认就会拒绝「没有出处的结论」、并且把每次失败变成下次技能的本地智能体运行时 —— 不需要 API key，不需要 GPU。
- **英文名**：aetheros ｜ **CLI**：`agentos` ｜ **npm scope**：`@aetheros/*`
- **目标用户**：
  - A 隐私优先的独立开发者（无独显，7B 纯 CPU）
  - B 需要可审计的技术团队（5–50 人，受 EU AI Act 约束）
  - C Agent 框架研究者（次要）
- **核心问题**：全行业只做到了「可观测」（记录它做了什么），没有一家做到「可验证」（判定它凭什么这么说，并且拦下来）；同时本地 CPU 上真正让用户跑不动的不是模型能力，而是没人负责的工程默认值。
- **血统**：融合 aetherflow（运行时）+ glassbox（可验证 RAG）+ evolver（自进化）+ aurora（本地 CPU 推理）

---

## 2. MVP 范围（锁定 —— 不在此列表的功能一律不做）

| 优先级 | 功能 | 验收标准 | RICE |
|--------|------|----------|------|
| **P0** | **F1** CPU 推理 sane defaults + 一次性自动调优 | AC-02 / AC-03 / AC-04 | 12.00 |
| **P0** | **F2** RRF 二次融合 + 对抗性不变量测试 | AC-06 / AC-07 / AC-08 | 7.00 |
| **P0** | **F3** 全链路本地 trace（append-only + 哈希链） | AC-09 / AC-10 / AC-11 / AC-13 | 6.67 |
| **P0** | **F4** 证据闸门 Evidence Gate（默认 strict） | AC-05 / AC-12 | 5.40 |
| P1（同期发布物） | **F5** 零依赖单文件 HTML 演示引擎 | 不进 MVP 门禁，见 §3 注 | 4.27 |
| P1 | **F6** MCP 原生工具层 + token 预算护栏 | — | 2.80 |
| P1 | **F7** evolver 技能蒸馏 + 对照组基准 + `.skill.json` | — | 2.40 |

**MVP = F1 + F2 + F3 + F4**。放宽到四项是因为四者构成不可分割的闭环：缺 F1 跑不动、缺 F2 检索不准、缺 F3 无法回放、缺 F4 不敢采信。

---

## 3. 明确不做（Out-of-Scope —— 锁定）

| 不做的功能 | 原因 | 何时考虑 |
|------------|------|----------|
| 多智能体 swarm / 角色编排 | Cognition 2025 公开结论：该架构在生产工程中已死；CrewAI / AutoGen / OpenHands 已覆盖 | 除非出现新公开证据推翻该结论，否则永久不做 |
| 自研推理引擎 | 复用 llama.cpp / Ollama / transformers.js，差异在默认值不在 kernel | 永不 |
| 自研向量数据库 | SQLite FTS5 已足够 | 单机语料超百万 chunk 且 FTS5 无法满足召回时延目标时 |
| 自研可观测后端 / 仪表盘 UI | 只 emit OTel GenAI semconv，由 Grafana / Tempo / Datadog 渲染 | 永不 |
| 云端 SaaS / 托管服务 | 与「本地优先 + 数据主权」定位直接冲突 | 仅在出现明确企业托管付费需求且团队扩张后 |
| 模型训练 / RL 微调 | 需 GPU，与纯 CPU 定位冲突；改以 F7 文本化技能包实现自进化 | 永不 |
| IDE 插件（VS Code 扩展） | Cline（5M 安装）/ Continue / Roo Code 已饱和 | 永不 |
| 图形化工作流编排器 | n8n / Dify 已饱和 | 永不 |
| 0.x 阶段 API 稳定承诺 | 过早锁死接口阻碍迭代 | 发布 1.0 时 |

> **注（R-3）**：F5 演示引擎**必须与 v1.0 同期发布**（用户明确要求双形态交付），但**不进 MVP 验收门禁** —— QA 的 P0 门禁只作用于 `@aetheros/core` 与 `@aetheros/cli`。

---

## 4. 技术架构（锁定）

> 版本锚真源：`docs/architecture/ARCHITECTURE.md` 与 `docs/decisions/ADR-*.md`。框架必须写实际版本号，禁止凭记忆写版本。

| 层 | 技术 | 版本 | 锁定原因 |
|----|------|------|----------|
| 运行时 | Node.js | ≥ 22（架构师锚定实际版本） | LTS，MCP SDK 与工具链要求 |
| 语言 | TypeScript | 架构师锚定 | 全栈类型安全 |
| 本地推理 | llama.cpp / Ollama / transformers.js | 架构师锚定 | 禁止自研 kernel |
| 存储 | SQLite（FTS5 + 向量） | 架构师锚定 | 本地优先，零外部服务 |
| 可观测 | OpenTelemetry GenAI semconv | **必须 pin 版本**（规范仍为 Development 状态） | 只 emit，不自研后端 |
| **图标** | **@tabler/icons** | **3.46.0** | P0 唯一图标源。MIT，6184 枚（outline 5130 + filled 1054），24×24 / 2px stroke |
| **正文字体** | **Geist** | OFL 1.1 | SIL OFL 1.1，允许 embed / modify / redistribute，子集化合规 |
| **等宽字体** | **Commit Mono** | OFL 1.1 | SIL OFL 1.1，承担代码 / ID / 哈希 / 时间戳 / 全部数字 |

**分层约束（依赖只向下）**：`api/` → `services/` → `repositories/` → `infra/`，`domain/` 为纯算法无 IO。禁止 repository→service、api→repository。单文件 ≤ 300 行，入口文件 < 100 行且只做装配。

**图标硬约束**：具名导入禁 barrel；禁 webfont 版；filled 变体**仅**用于 active / selected 态；尺寸由 `AppIcon` 收口为 16 / 20 / 24；`ICON_STROKE = 2` 单一常量三档共用（驳回按尺寸分档）；不走 CDN；**图标名不许手工翻译**，由构建脚本读 `@tabler/icons` 元数据解析，CI 解析失败即红灯。

**字体硬约束**：vendored 至 `assets/fonts/`，woff2 子集化（Latin + Latin-Ext，不含 CJK）；每个字体文件必须随附 LICENSE，CI 校验；**禁止 CDN**；CJK 走系统栈（PingFang SC / Microsoft YaHei / Noto Sans CJK SC），另提供 `agentos fonts install-cjk` 离线补更纱黑体。

---

## 5. API 端点清单

> 真源：`docs/api/openapi.yaml`（OpenAPI 3.0）。前端据此生成 TS 类型，后端据此实现。
> 覆盖范围：`runs` / `traces` / `spans` / `evidence` / `skills` / `models` / `mcp` / `config` / `health`。
> 0.x 阶段不提供 API 稳定承诺。

---

## 6. 数据库表清单

> 真源：`docs/architecture/SCHEMA.sql`。
> 核心表：`runs` / `spans` / `evidence` / `documents` / `chunks` / `skills` / `skill_versions` / `skill_runs` / `models` / `settings`，另含 FTS5 虚表与哈希链表。
> **只追加语义**：agent 不得修改自身的审计记录（AC-10）。

---

## 7. 页面清单

| 页面 | 核心区块 | 布局 |
|------|----------|------|
| Run Timeline | 左 run 列表 / 中 trace 瀑布 / 右证据面板 | 240px / flex / 360px 三栏 |
| Evidence Audit | 上：带内联角标的回答；下：证据列表，双向 hover 联动 | 上下双区 |
| Skill Lineage | 左技能列表 / 中版本血缘 / 右 diff | 三栏，diff 优先 |
| Local Runtime | 顶指标网格 / 中模型表 / 下实时曲线 | 驾驶舱，无卡片 |
| Demo (single-file HTML) | 可交互真实 trace 控制台 | 零依赖独立文件 |

**首屏反套路**：禁止居中口号 Hero，必须展示真实运行的 trace 瀑布。禁止虚构指标。

---

## 8. 设计 Token（锁定）

> 真源：`docs/design/design-tokens.json`（W3C DTCG）+ `design-tokens.css`。前缀 `--aos-`，三层 primitive → semantic → component，语义命名不按色相。

| 令牌 | 深色值 | 浅色值 |
|------|--------|--------|
| `--aos-bg` | `#0A0D0E` | — |
| `--aos-surface` | `#121618` | — |
| `--aos-raised` | `#181C1E` | — |
| `--aos-inset` | `#07090A` | — |
| `--aos-border` | `#2A3134` | — |
| `--aos-fg` | `#E6EBEC` | — |
| `--aos-fg-secondary` | `#B4BDC0` | — |
| `--aos-muted` | `#8A9498` | — |
| `--aos-meta` | `#7A8488` | — |
| `--aos-accent`（磷光青） | `#3CCFC1` | `#0E7F75` |
| `--aos-accent-on` | `#04201D` | — |
| `--aos-signal`（信号琥珀） | `#E8A33D` | — |
| `--aos-verified` | `#57B87A` | — |
| `--aos-unverified` | `#E8A33D` | — |
| `--aos-failed` | `#E5544B` | — |

**两条颜色硬规则（全项目强制）**：
1. **The Trace Is Cyan Rule** —— 青色只出现在 trace / 证据 / 来源相关界面，**绝不用于营销按钮与 CTA**。
2. **Amber Means Unverified Rule** —— 琥珀只用于标注「证据链不完整的断言」，不作通用 warning 色。

**对比度硬约束**：青底按钮文字必须使用 `--aos-accent-on`（`#04201D`）。白字压 `#3CCFC1` 仅约 2.2:1，不达标 —— 写入 lint 规则。

**形状与层级**：圆角 sm4 / md6 / **lg8** / pill999（全站 ≤ 8px）；间距 4px 网格；**hairline-first**（`elev-ring 0 0 0 1px border`，`elev-raised` 仅浮层）；**零卡片阴影、零玻璃拟态**（毛玻璃唯一合法位是功能性浮层 `--aos-elev-overlay`）。

**动效**：80 / 150 / 200 / 320ms，`cubic-bezier(0.2, 0, 0, 1)`，只动 transform / opacity，**禁止弹跳缓动**；唯一连续动画为运行中的 span 呼吸线，受 `prefers-reduced-motion` 门控降级为 0ms。

**排版**：`--font-sans` = Geist → system-ui → PingFang SC → Microsoft YaHei → Noto Sans CJK SC；`--font-mono` = Commit Mono → Sarasa Mono SC → Cascadia Mono → Consolas。全部时间 / 数值强制 mono + `tabular-nums`。

**图标单位口径**：所有图标尺寸与描边均以 **24 网格用户单位**表达，`stroke-width` 恒为 **2**，由 SVG `viewBox="0 0 24 24"` 缩放至目标尺寸。数学等价关系为 `2 × size/24`（16px 下即 1.33px，等于 `size/12`）。**禁止在调用侧按尺寸预计算 stroke** —— 预计算值会被 viewBox 二次缩放（16px 传 1.33 将渲染为 0.89px，几乎不可见）。

**图标语义拉黑**：`brain`、`sparkles` 及同类「AI 模板味」图标一律禁用。本地推理一律使用 `cpu` 语义图标。

### 8.1 状态语义术语表（强制，实现不得混用）

| 术语 | 定义 | 视觉表达 |
|------|------|----------|
| **已验证 (verified)** | 断言可绑定到检索 chunk，且内容哈希与入库时一致 | `--aos-verified` 绿 |
| **未验证 (unverified)** | 断言无法绑定证据，或证据链不完整 | `--aos-unverified` 琥珀 |
| **拒答 (refused)** | strict 模式下断言被 Evidence Gate 拦截 | **中性反馈 + amber 证据状态**，**不得**做成红色错误页 |
| **失败 (failed)** | 运行 / 工具调用 / 检索执行出错 | `--aos-failed` 红 |
| **系统级错误 (error)** | 平台级故障（端口、加载器、存储） | `--aos-failed` 红 + 独立错误面 |

五态**互斥**，同一断言不得同时标记两种状态。红色**只**留给「失败 / 系统级错误」；「拒答」是产品的正确工作结果，不是故障。

**哈希不匹配判为错误态**：检索成功但内容哈希与入库时不一致时，判 `failed` 而非 `unverified`，文案为「内容哈希与入库时不一致，该来源已变更，证据链不可信」。理由：「已验证」是本产品的核心承诺，哈希对不上必须定性为不可信，不能降级为警告。

---

## 9. 验收标准（锁定 —— QA 唯一依据）

> 真源：`docs/prd/PRD.md` 第 6 章。**AC 编号体系以 PRD 为准**（AC-01 ~ AC-14），架构师与 QA 不得自建第二套编号。EARS 格式。

| 编号 | 主题 | 摘要 | 优先级 |
|------|------|------|--------|
| AC-01 | 离线底线 | 未配置 OTLP 导出端点时，全流程零出站请求 | P0 |
| AC-02 | CPU 线程自动锁定 | 初始化时线程数取 `autoThreads()` 并夹到 `[2, 4]` | P0 |
| AC-03 | 线程数防回退 | `autoThreads(n)` 返回值越界则测试具名失败 | P0 |
| AC-04 | 一次性性能画像 | `bench` 后写入 `~/.aetheros/profile.json`（threads / n_batch / ctx + 各自 tok/s） | P0 |
| **AC-05** | **证据闸门 strict** | **断言无法绑定到 chunk span 则拦截 + 明确标注证据缺口，无「低置信度仍输出」隐式路径** | **P0** |
| AC-06 | RRF 二次融合 | rerank 作为第三路信号，以 `w = 0.5` 融合，不得直接接管排序 | P0 |
| AC-07 | 对抗性不变量 | 注入全倒序 reranker，仍返回首阶段融合冠军为 top-1（`w` 必须严格 < 1） | P0 |
| AC-08 | 重排器降级 | reranker 不可用时降级为中性分数并透传首阶段排序，不抛异常 | P0 |
| AC-09 | trace 完整性 | 可完整重建输入 / 检索 chunk / 工具调用序列 / LLM 原文 / 最终输出 | P0 |
| AC-10 | trace 防篡改 | 记录被修改则哈希链校验失败并抛 tamper-detected | P0 |
| AC-11 | OTel GenAI 导出 | 配置 OTLP 端点时 emit 符合 GenAI semconv 的 span | P0 |
| **AC-12** | **证据模式可见性** | **`evidence.mode = lenient` 时，UI 与每条 trace 永久标记当前模式，不可关闭不可隐藏** | **P0** |
| AC-13 | 审计留存 | trace 与审计记录 append-only 保留 ≥ 180 天 | P0 |
| AC-14 | 平台与降级韧性 | 端口不可用或模型文件缺失时按序列回退并保持加载器可重试 | P0 |

---

## 10. 边界与约束

- **本地优先**：默认零出站请求。出站请求计数器必须真实计数并可被用户查看（默认值 0），这是「数据未离开本机」信任锚的机器证据，不能只是文案宣称。
- **埋点**：默认不上报，落本地 SQLite，用 `session_id` 而非 `user_id`；核心验证事件 `evidence_gate_rejected` / `evidence_gate_passed`。
- **Evidence Gate 默认 strict**；lenient 只能经 `agentos config set evidence.mode lenient` 显式开启。
- 不支持 IE；响应式断点由设计规范定义。
- 浏览器内**不做** 7B 模型推理（明确 out-of-scope）；单文件 HTML 演示引擎用内置 fixture 演示 RRF 融合、证据链锚点高亮、trace 回放、ReAct 状态机、技能包浏览。
- OTel GenAI / MCP semconv 截至 1.40 仍为 **Development** 状态，实现必须 pin 版本。

---

## 11. 内嵌已知坑（防止重蹈覆辙）

| 坑 | 根因 | 修法 |
|----|------|------|
| 线程数默认 `cpu_count()-1` | 小量化模型瓶颈在内存带宽不在算力 | `autoThreads()` 夹到 `[2, 4]` + AC-03 具名断言防回退。实测 4 线程 32.5 tok/s vs 16 线程 8.2 tok/s（慢 4 倍） |
| rerank 直接接管排序反而变差 | 单信号无制衡，中文查询尤其明显 | 二次融合 `w = 0.5`。实测纯 RRF 11/12 → rerank 接管 10/12 → 融合 12/12 |
| 对抗器注入后断言抖动 | `w = 1` 时冠亚军差值恒为 0，退化为平局 | `w` 必须严格 < 1（AC-07） |
| 证据锚点中文静默错位 | JS String 索引是 UTF-16 code unit，不是字节；UI 拿字节区间切片必错 | 同时存 `byte_start/byte_end`（权威地址）+ `utf16_start/utf16_end`（渲染用），不变式测试：解码后按 utf16 切片必须严格等于 chunk_text，中文语料必跑 |
| OTel 字段名新旧并存 | 部分 collector 仍读旧字段 | 同时发送 `gen_ai.provider.name`（新）与 `gen_ai.system`（旧）；规范中**不存在** `gen_ai.usage.cost`，成本须自行推导 |
| 端口被 Windows 保留 | WinNAT / Hyper-V 保留端口段（常见 8000–8123） | 回退序列 8765 / 8801 / 9000（AC-14） |
| Qwen3 提速参数误用 | `think: false` 不减少思考，只是把推理从 `thinking` 倒进 `content` | 禁止向 Qwen3 系列发送该参数 |
| 模型加载器一次性置位失败 | 文件不存在时锁定失败标志导致永久降级 | 仅「文件存在但加载失败」时锁定，否则保持可重试 |
| 图标名凭记忆翻译 | 编译期未必报错，运行时渲染空白，验收才暴露 | 构建脚本解析 + CI 门禁（ADR-014） |
| **Windows 沙箱静默丢弃 `.git/refs/remotes/` 写入** | 沙箱限制，连 mkdir 都不生效 → `git status -sb` 显示 `[gone]`，但 push / pull 正常 | 用 PowerShell 重建引用文件 |
| **本机 PortableGit bash 无 `/c` 挂载** | 传给 Windows 程序的 `/c/Users/...` 会被当成 `C:\c\...` | 脚本内路径一律用 `C:/...` 形式 |

---

## 12. 端到端验证步骤

```bash
# 1. 安装与构建
pnpm install && pnpm build

# 2. 离线底线（AC-01）：断网运行完整套件，退出码必须为 0
pnpm test

# 3. 性能画像（AC-04）
agentos bench && cat ~/.aetheros/profile.json
# 断言：threads ∈ [2,4]，且各字段带实测 tok/s

# 4. 证据闸门（AC-05，默认 strict）
agentos ask --evidence-mode strict "无出处问题"
# 断言：输出被拦截并明确标注证据缺口，不出现「低置信度仍输出」

# 5. 模式可见性（AC-12）
agentos config set evidence.mode lenient && agentos ask "..."
# 断言：UI 与每条 trace 均永久标记 lenient

# 6. 检索融合（AC-06 / AC-07）
pnpm test -- retrieval
# 断言：注入全倒序 reranker 后 top-1 仍为首阶段融合冠军

# 7. 防篡改（AC-10）
# 手工修改一条 trace 后运行校验
# 断言：抛出 tamper-detected

# 8. 单文件 HTML 演示引擎（同期发布物）
node scripts/verify-demo.mjs
# 断言：无头自检全绿
```

---

## 13. 变更记录

| 日期 | 变更内容 | 原因 | 影响范围 |
|------|----------|------|----------|
| 2026-09-19 | 初版锁定 | 基于 PRD v1.0 + 架构调研 + 设计调研 | 全部 |
| 2026-09-19 | 图标库 Lucide → **Tabler 3.46.0** | Lucide 无 filled 变体，active/selected 态缺它必然引入第二套，违反 P0「只锁一套」 | §4、§11、ADR |
| 2026-09-19 | 正文字体 Switzer → **Geist** | Switzer 实为 ITF Free Font License（Closed Source），禁修改与再分发，vendored + 子集化即违规 | §4、§8 |
| 2026-09-19 | 配色改**冷中性** + 绑定可验证语义 | 规避 2026 两个 dev-tool 默认色；颜色直接编码产品承诺 | §8 |
| 2026-09-19 | 命名 Agent OS → **aetheros** | AgentOS 已被多家占用，且 npm 裸名冲突 | 全部 |

### 变更流程

**小改**（不新增 API 端点、不新增数据库表、不影响超过 2 个已有页面、不改变核心用户流程）→ 更新本表后继续开发。

**大改**（新增 API 端点 ≥ 2 个 / 新增数据库表 / 影响超过 2 个已有页面 / 改变核心用户流程）→ 回到需求澄清，更新 PRD 与本 Spec。
