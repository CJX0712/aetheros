# aetheros PRD

> 产品需求文档 v1.0 · 2026-09-19 · 作者：许清楚（产品经理）
> 仓库：GitHub `CJX0712/aetheros` · npm scope：`@aetheros/*` · CLI 可执行名：`agentos`
> 状态：三项裁决已下达并生效（命名 / Evidence Gate 严格模式 / Demo 引擎同期发布）

---

## 0. 裁决记录（Ruling Log）

| 编号 | 议题 | 裁决 | 生效范围 |
|---|---|---|---|
| R-1 | 命名 | **`aetheros`**。机械验证：GitHub `CJX0712/aetheros` 返回 404（未占用）；npm 裸名 `aetheros` 已被占（v1.0.6）；`@aetheros/core` 未占用 → 走 scoped 包发布。包体系 `@aetheros/core` / `@aetheros/cli` / `@aetheros/runtime` / `@aetheros/sdk`，CLI 可执行名沿用 `agentos` | 全局命名、package.json、README |
| R-2 | Evidence Gate 默认模式 | **默认 strict（硬拒答）**。未落地断言一律拦截，输出明确标注证据缺口。宽容模式须显式开启：`agentos config set evidence.mode lenient`，且在 UI 与 trace 中**永久标记**当前模式 | AC-05、AC-12 |
| R-3 | Demo 引擎交付 | **与 v1.0 同期发布，但不进 MVP 验收门禁**。QA 的 P0 门禁只作用于 core + cli。本功能从 MVP 功能表移出，记为「同期发布物」 | 发布计划、QA 门禁 |

R-2 的裁决理由（存档）：Evidence Gate 是本产品的灵魂，默认宽松等于自毁差异化。竞品普遍只给「置信度分数」，而 IBM/WatsonX 遥测已证明置信度校准本身不可靠；本产品给出的是**拦截**，不是提示。

---

## 1. 产品定义

### 1.1 一句话描述

**aetheros 是一个本地优先（local-first）的智能体运行时：它默认拒绝输出任何没有检索证据支撑的断言，并把每一次失败蒸馏成下次可复用的技能——不需要 API key，不需要 GPU。**

英文：*aetheros is a local-first agent runtime that refuses to answer without evidence, and gets measurably better every run — no API key, no GPU.*

### 1.2 目标用户

详见第 4 节。摘要：隐私优先的独立开发者（主）、需要可审计的中小企业技术团队（主）、Agent 框架研究者与开源贡献者（次）。

### 1.3 核心问题

当前用户让智能体读私有文档、改代码、调工具、产出结论时，撞上三个彼此独立但同样致命的问题：

1. **智能体说的话无法验证。** IBM Research / WatsonX 2025–2026 跨行业遥测指出「引用洗白（citation laundering）」已成系统性问题——引用标签指向的检索块根本不支持该断言。MIT Agency AI Lab 实测：agentic RAG 一旦超过 3 次顺序检索，**至少一处错误引用的概率从 12% 跳升到 31%**。RAGAS IoT 合规研究显示：**超过 40% 的合规陈述没有检索证据支撑**（faithfulness 仅 0.509 向量 / 0.570 图）。
2. **想看清楚就得上云——这是被强加的二选一。** LangSmith / Langfuse / Arize / Helicone 全部云托管。本地方案 Lookspan 方向正确，但只做 trace 不做证据验证。可观测性（observability）回答「它做了什么」，可验证性（verifiability）回答「它凭什么这么说」——后者无人做。
3. **本地 CPU 上跑不动，而原因不是模型能力。** 所有示例代码都写 `n_threads = cpu_count() - 1`，这是错的。0.5B–3B 量化模型的瓶颈是**内存带宽不是算力**。本机实测（AMD Ryzen 7 8C/16T，Qwen2.5-0.5B-Instruct-Q4_K_M）：

   | threads | 2 | 4 | 6 | 8 | 12 | 16 |
   |---|---|---|---|---|---|---|
   | tok/s | 32.3 | **32.5** | 25.6 | 23.6 | 25.1 | **8.2** |

   `cpu_count()-1 = 15` 正好落在最差一格：**慢 4 倍**。Ollama 侧同坑（`num_thread` 16 比 4 慢 1.93×）。r/LocalLLaMA 另有 KV cache 抖动导致 **222 秒重处理 44,016 tokens** 的案例。没有任何 Agent 框架把这当成一等公民。

### 1.4 项目血统

aetheros 融合作者既有四个开源项目：

| 源项目 | 能力 | 在 aetheros 中的角色 |
|---|---|---|
| aetherflow | 智能体运行时，TS / Node 22，MCP 原生，零厂商锁定 | 运行时内核 |
| glassbox | 可验证 RAG 引擎，BM25 + dense + RRF + rerank，全链路证据可见，纯 CPU 无 API key | 检索与证据链 |
| evolver | 智能体自进化层，skill / pitfall 蒸馏 + 对照组基准 + 可移植技能包 | 自进化 |
| aurora | 本地自主智能体系统，llama.cpp + Qwen2.5-7B + nomic-embed，纯本机 CPU 推理，内置 RAG 与 ReAct 循环 | 本地推理栈 |

---

## 2. 竞品分析

### 2.1 直接竞品对比表

| 项目 | 定位 | 核心优势 | **关键差评 / 用户抱怨** |
|---|---|---|---|
| **OpenHands** | 自主 repo 级 agent，Docker 沙箱，SDK + headless runtime | SWE-bench Verified ~72%、GAIA 67.9%；2026-06 完成 1880 万美元 A 轮；100+ LLM 后端；MIT 许可 | **重 MCP 开销**：重型 MCP server 单轮吃掉 10K+ tokens，且需手工管理工具；**Docker 首次配置 1–2 小时**；长任务账单方差最大（$0.94/任务）；终端优先不适合视觉工作流开发者 |
| **Cline** | IDE 侧边栏 agent，Plan/Act 模式，逐步审批 | 5M 安装 / ~61K stars；SWE-bench ~59.8%；30+ provider；支持 on-prem 与 air-gapped | **审计日志与 OpenTelemetry 只在付费企业层**；**MCP 配置 / 停止运行会造成冻结卡死**；完整文件内容每次读取都灌进对话——碰 8 个文件先烧 25K–40K tokens；**不自动提交**，长会话后堆积未提交改动；成本无上限 |
| **Aider** | Git 原生 CLI pair programmer，每次编辑一个 commit | 最便宜（architect mode $0.32/任务，vs Cline $0.87、OpenHands $0.94）；tree-sitter repo map 约 2K tokens；确认可完全离线 | **手工管理上下文**（不感知 IDE 当前状态）；本地模型质量下限在 **≥32B**，7B 不够；自主模式 SWE-bench 仅 31.4%；发布节奏偏慢；学习曲线陡 |
| **Goose** | Rust 编写的通用 agent 运行时，桌面 + CLI + 嵌入式 API | 2026-04-07 归入 Linux Foundation 旗下 Agentic AI Foundation，治理中立；70+ MCP 扩展；子智能体可并行 10 个；Apache-2.0 | Rust 技术栈对 TS 生态开发者贡献门槛高；定位为通用运行时——**不做证据验证，不做自进化** |
| **Lookspan** | **本地优先** agent 调试工具 | `npx` 单命令、零配置、SQLite 落盘、OTel 本地导出、数据主权完整；实测开销 <15% | **只做 trace，不做证据验证**；约 1.2k stars 的早期项目；**无技能沉淀 / 自进化能力**；作者自述高吞吐生产场景可能成问题 |

### 2.2 间接替代方案

| 方案 | 定位 | 为什么不是答案 |
|---|---|---|
| **LangGraph + Qdrant + Langfuse 自建栈** | 当前最主流的自托管组合 | 能力够，但要养一套 Langfuse 运维；LangGraph 不提供证据校验；**三者拼完仍然回答不了「这句结论的原文在哪」** |
| **Microsoft Agent Governance Toolkit / Actra / Lua Governance** | 2026 年新出现的运行时治理层 | MIT 许可，声称 sub-0.1ms 拦截、HMAC 签名审计链、映射 EU AI Act。**威胁最大**。但只做「策略拦截 + 审计签名」，不碰检索证据正确性，也不碰自进化 |
| **EvolveR / SkillRL / Skill-SD / OPID** | 学术自进化方案 | 证明了「从自身轨迹蒸馏技能」有效（Skill-SD：vanilla GRPO +14.0% / +10.9%）。但**全部需要 RL 训练 + GPU**，没有任何一个给出可安装的工程实现 |

### 2.3 竞品差评出处链接

**编码 agent 竞品**
- OpenHands 官方竞品横评（含 MCP 10K+ tokens、Docker 配置耗时等自述短板）：https://www.openhands.dev/blog/open-source-ai-coding-agents
- Cline / Aider / Continue / OpenHands 2026 实测对比（含每任务成本实测表）：https://aicraftguide.com/article/cline-vs-aider-vs-continue-vs-openhands-2026
- Open-Source Coding Agents 2026（含 Aider 31.4%、Cline 59.8%、OpenHands 72% 与本地模型 ≥32B 门槛）：https://dev.to/jovan_chan_9500711396d4e6/open-source-coding-agents-2026-which-one-to-run-5g14
- AI Coding Agents 2026 Benchmarks（含 OpenHands GAIA 67.9%、A 轮融资、企业级治理要求）：https://kiadev.net/news/2026-05-15-ai-coding-agents-2026-benchmarks
- Cline vs Roo Code vs Aider（含单任务 50K–500K tokens 成本现实、本地模型仍落后）：https://www.pkgpulse.com/guides/cline-vs-roo-code-vs-aider-open-source-ai-coding-agents-2026
- 本地编码代理对比（含 Cline 不自动提交、读文件 token 消耗实测）：https://www.promptquorum.com/zh/power-local-llm/continue-dev-vs-cline-vs-aider-local
- Best Open Source AI Coding Agents 2026：https://www.opensourceaireview.com/blog/best-open-source-ai-coding-agents-in-2026-ranked-by-developers

**本地可观测 / 数据主权**
- Lookspan 本地优先调试工具（含开销基准表与「仅 trace」的能力边界）：https://ainews.cool/fr/article/20260605-lookspan-local-ai-debugging
- 本地 AI Agent 运行时治理框架综述（Microsoft Toolkit / Actra / Lua Governance）：https://theagenttimes.com/articles/runtime-governance-frameworks-emerge-as-local-ai-agents-outp-a4d5e6b4

**证据与引用失效（本产品立身之本）**
- 企业 RAG 幻觉五大根因（含 MIT Agency AI Lab：>3 步检索错误引用 12%→31%；律所幽灵引用案例）：https://ragaboutit.com/5-root-causes-lurking-behind-enterprise-rag-hallucinations/
- 七类企业 RAG 失效（含「归因链缺失导致 EU AI Act 审计不通过」真实案例）：https://ragaboutit.com/7-rag-enterprise-failures-costing-4-7m-in-2026/
- 生产环境 RAG 静默失效（IBM/WatsonX 遥测、citation laundering、ECE 校准失准）：https://www.techaimag.com/?p=12534/
- RAGAS IoT 合规 faithfulness 研究（40%+ 合规陈述无证据支撑；向量 0.509 / 图 0.570）：https://thecolony.ai/post/d26d118a-dddb-491b-b1b6-ea22a3029e7a

**合规驱动**
- 智能体决策无记录风险（EU AI Act 2026 年中全面生效、NIST AI RMF、ISO 42001）：https://dev.to/keerat_rashid/the-black-box-in-your-workflow-why-undocumented-ai-agent-decisions-are-a-growing-risk-388f
- 金融报告幻觉实操（agentic 多步误差累积、SEC/PCAOB/FINRA 2026 要求）：https://finrep.ai/blog/ai-hallucination-in-financial-reporting-a-2026-practitioner-walkthrough

**本地 CPU 推理实测（F1 依据）**
- llama.cpp 全核线程陷阱（12-vCPU 上 8 线程最优，全核对半砍；generation 崩至 0.50 tok/s）：https://workloft.ai/ships/llama-cpp-threads-trap-2026-06-25.html
- llama.cpp KV cache 抖动（222,411 ms 重处理 44,016 tokens）：https://openclawradar.com/article/llamacpp-massive-prompt-reprocessing-coding-agents
- llama.cpp CPU backlog 综述（本地推理是「内存搬运」问题）：https://kenashe.ai/blog/2026-08-30-llama-cpps-cpu-backlog-is-a-map-of-local-ais-next-gains

**自进化学术方案（无工程实现）**
- EvolveR：http://arxiv.gg/abs/2510.16079
- SkillRL（GitHub）：https://github.com/aiming-lab/SkillRL
- Skill-SD：http://arxiv.gg/abs/2604.10674
- OPID：https://arxiv.org/abs/2606.26790

**OpenTelemetry GenAI semconv 现状**
- OTel GenAI semconv 落地分析（截至 1.40 仍标 Development，需 pin 版本；无 `cost` 字段）：https://bex.co/blog/2026/07/09/otel-genai-semantic-conventions-agent-ops
- 智能体可观测现状（agent/tool span 均标 Development，非 Stable）：https://www.aurorasre.ai/blog/opentelemetry-ai-agent-observability

---

## 3. 市场空白

从竞品差评中提炼的三条真空，恰好与作者四个源项目一一对应：

**空白一：可验证性（verifiability）无人做，全行业只做到可观测性（observability）。**
LangSmith / Langfuse / Arize / Helicone / Lookspan 以及 2026 年新出的 Microsoft Agent Governance Toolkit / Actra / Lua Governance，全部停留在「记录发生了什么」或「这个动作允不允许」。**没有一个把「这句话有没有出处」做成默认拦截**。业界默认只给置信度分数，而 IBM/WatsonX 遥测已证明置信度校准本身是坏的（ECE 超标）。差别是：警告 vs 拒绝。

**空白二：自进化只活在论文里，没有可安装的工程实现。**
从自身失败轨迹中提炼 skill / pitfall、并用对照组基准证明「确实变好了」——EvolveR、SkillRL、Skill-SD、OPID 都证明了有效性，但全部依赖 RL 训练与 GPU。**没有人做纯 CPU 的人可读文本技能包**（可 diff、可 code review、`cp` 即可移植）。这与「本地优先」是同一条战线。

**空白三：本地 CPU 的工程默认值没有任何框架负责。**
线程数陷阱、KV cache 抖动、rerank 反向损害——这些都是**实测过、能量化、可复现**的坑，而所有框架都把它丢给用户。作者本人已蒸馏其中两个（本地 skill 库中的 `cpu-llm-inference-tuning` 与 `rag-rerank-fusion-tuning`，均带实测数据表）。**这是竞品没有的、带测量数据的资产。**

---

## 4. 用户画像

### 画像 A（主要）：隐私优先的独立开发者

| 维度 | 描述 |
|---|---|
| 画像 | 25–40 岁，中国一线城市前端 / 全栈工程师，1–3 人规模或独立开发 |
| 设备 | 消费级笔记本或迷你主机，无独显或 8GB 显存，跑 Qwen2.5-7B + nomic-embed 纯 CPU |
| 场景 | 让 agent 读自己的私有文档、改自己的代码、产出结论，全程不希望数据离机 |
| 痛点 | 本地 agent 慢到不可用；检索回来的段落不敢直接采信；每个坑都要自己踩一遍 |
| 现有解法 | Ollama 裸跑；Cline / Aider 接本地模型 |
| **不满足处** | 7B 模型在 agentic loop 上质量塌方——业界共识本地模型需 ≥32B 才够；且没有任何工具给出 sane defaults（默认线程数就是错的）；RAG 检索结果无证据链，只能靠人肉核对 |

### 画像 B（主要）：需要可审计的中小企业技术团队

| 维度 | 描述 |
|---|---|
| 画像 | 5–50 人技术团队，金融外包 / 医疗信息化 / 法务科技，或有出海业务受 EU AI Act 约束 |
| 硬约束 | EU AI Act 高风险义务 **2026 年中全面生效**：时间戳日志、模型版本追踪、**≥6 个月日志留存**、可证明的人工复核；NIST AI 600-1（2026-01）对 RAG 系统另有文档化与透明度要求 |
| 痛点 | 出事时回答不了「为什么智能体这么做」；审计拿不出决策链 |
| 现有解法 | Cline 企业版；自托管 OpenHands；自建 Langfuse |
| **不满足处** | Cline 的 RBAC / 审计日志 / OTel **只在付费企业层**，且仍把 trace 送去云端——与数据主权直接冲突；OpenHands 有 Docker 沙箱但**没有证据链**；自建 Langfuse 要养一整套运维。他们买的不是能力，是「能过审」 |

### 画像 C（次要）：Agent 框架研究者与开源贡献者

| 维度 | 描述 |
|---|---|
| 画像 | 高校 / 企业研究院，或活跃的开源贡献者 |
| 痛点 | 想要可复现的 pitfall 数据集与对照组基准，用来发论文或对比方法 |
| 现有解法 | 读 arXiv 论文（EvolveR / SkillRL / Skill-SD / OPID），自行复现 |
| **不满足处** | 学术方案需 RL + GPU，复现门槛高；且**没有公开的、带测量数据的 pitfall 语料库**可供对比 |

---

## 5. MVP 功能清单与 RICE 评分

### 5.1 评分口径

`Score = (Reach × Impact × Confidence) / Effort`

- **Reach**：1–10，每季度受影响用户比例
- **Impact**：0.25 / 0.5 / 1 / 2 / 3，对单个用户的影响
- **Confidence**：50% / 80% / 100%，有实测数据支撑取 100%
- **Effort**：1–10，人月投入

**重要前提**：aetherflow / glassbox / evolver / aurora 四个源项目**已有可运行代码**，故 Effort 按「融合 + 重写 + 补测试」估算，而非从零开发。

### 5.2 RICE 评分表

| 编号 | 功能 | Reach | Impact | Conf | Effort | **Score** | 分级 |
|---|---|---|---|---|---|---|---|
| **F1** | **CPU 推理 sane defaults + 一次性自动调优**（线程 / 批 / 上下文按实测锁定，附 bench 脚本与断言） | 8 | 3 | 100% | 2 | **12.00** | **P0** |
| **F2** | **RRF 二次融合 + 对抗性不变量测试**（rerank 降权为第三路信号，注入全倒序对抗器钉死回归） | 7 | 2 | 100% | 2 | **7.00** | **P0** |
| **F3** | **全链路本地 trace**（SQLite append-only + 哈希链防篡改 + 完整回放；仅 emit OTel GenAI semconv 供外部后端） | 10 | 2 | 100% | 3 | **6.67** | **P0** |
| **F4** | **证据闸门 Evidence Gate**（每个 claim 必须绑定检索 span；默认 strict，未落地断言一律拦截） | 9 | 3 | 80% | 4 | **5.40** | **P0** |
| **F5** | 零依赖单文件 HTML 演示引擎 + Node 无头自检全绿 | 8 | 2 | 80% | 3 | **4.27** | P1（同期发布物，见 R-3） |
| **F6** | MCP 原生工具层 + token 预算护栏（针对 10K+/轮的已知抱怨） | 7 | 2 | 80% | 4 | **2.80** | P1 |
| **F7** | evolver 技能蒸馏（轨迹 → skill/pitfall 文本 + 对照组基准 + `.skill.json` 可移植包） | 6 | 3 | 80% | 6 | **2.40** | P1 |
| **F8** | 多智能体编排 / swarm | 4 | 1 | 50% | 8 | **0.25** | P2（不做） |
| **F9** | 图形化工作流编排器 | 5 | 1 | 50% | 9 | **0.28** | P2（不做） |

### 5.3 评分依据（关键三条）

**F1 为何断崖式第一（12.00）**：Reach 8（所有本地用户都会踩）× Impact 3（**4 倍速度差**，直接决定「能用 / 不能用」）× Confidence 100%（**作者本机已有完整实测数据表**，Ollama 侧亦验证）× Effort 2（本质是一个 `autoThreads()` 函数 + bench 脚本 + 一条断言）。投入产出比远超其他项。

**F4 为何 Confidence 只给 80%**：MIT 数据表明「>3 步检索错误率 31%」，说明**验证器本身也存在误差**；且 strict 模式下拒答率过高会伤可用性。需在 MVP 中实测调阈值，故不给 100%。

**F8 为何仅 0.25**：Cognition 2025 年公开结论——swarm 架构在生产工程中已死，Anthropic 与 OpenAI 的公开指引均收敛到「一个强 agent + 子任务当工具」。做它是主动跳进已验证的反模式。

### 5.4 MVP 范围

**MVP = F1 + F2 + F3 + F4**

正常 MVP 应只保留 1–3 个功能，此处放宽到 4 个，理由有二：

1. 四个源项目代码已存在，Marginal Effort 远低于从零开发；
2. 四者构成**不可分割的闭环**——缺 F1 本地跑不动，缺 F2 检索不准，缺 F3 无法回放，缺 F4 不敢采信。缺任何一个，产品都不成立。

**不在 MVP 验收门禁内**：F5（演示引擎）。依 R-3，F5 与 v1.0 同期发布，但 QA 的 P0 门禁只作用于 `@aetheros/core` 与 `@aetheros/cli`。F5 记为「同期发布物」。

---

## 6. 验收标准（EARS 格式）

EARS（Easy Approach to Requirements Syntax）四种句式：
- **Ubiquitous**：The `<system>` shall `<response>`.
- **Event-driven**：WHEN `<trigger>`, the `<system>` shall `<response>`.
- **State-driven**：WHILE `<state>`, the `<system>` shall `<response>`.
- **Unwanted**：IF `<unwanted condition>`, THEN the `<system>` shall `<response>`.

### AC-01 · 离线底线（Ubiquitous）

The runtime shall complete the full retrieve-verify-answer pipeline with zero outbound network requests while no OTLP export endpoint is configured.

验收方式：断网环境下运行完整 CI 套件，全绿且退出码 0。

### AC-02 · CPU 线程自动锁定（Event-driven）

WHEN the runtime initializes local inference, the runtime shall set the inference thread count to `autoThreads()` and shall clamp the result to the inclusive range `[2, 4]`.

依据：0.5B–3B 量化 GGUF 的推理瓶颈为内存带宽而非算力；实测 4 线程 32.5 tok/s，16 线程 8.2 tok/s。

### AC-03 · 线程数防回退断言（Unwanted）

IF any code change causes `autoThreads(n)` to return a value outside `[2, 4]` for any input `n`, THEN the test suite shall fail with a named assertion error.

说明：此断言用于防止后人以「更多线程更快」为由改回 `cpu_count()-1`。断言必须具名，不得静默通过。

### AC-04 · 一次性性能画像（Event-driven）

WHEN the `bench` subcommand completes, the runtime shall write `~/.aetheros/profile.json` containing the measured optimal `threads`, `n_batch`, and `ctx` values, each accompanied by its measured tok/s figure.

### AC-05 · 证据闸门严格模式（Unwanted）— R-2 核心

IF a generated assertion cannot be bound to a retrieved chunk span, THEN the runtime shall **block that assertion from the output** and shall emit an explicit evidence-gap marker naming the unsupported claim.

严格口径补充：
- 拦截为默认行为，不提供「低置信度但仍输出」的隐式路径；
- 证据缺口必须在输出中明确标注，不得静默丢弃断言；
- 本条在 `evidence.mode = strict`（默认）下恒成立。

### AC-06 · RRF 二次融合（Event-driven）

WHEN `retrieve()` is invoked with reranking enabled, the runtime shall treat the reranked ordering as a third retrieval signal and shall fuse it with the first-stage RRF result at weight `w = 0.5`, rather than adopting the reranked ordering directly.

依据：实测 12 篇中英双语文档 × 12 条中文查询——纯 RRF top-1 为 11/12，重排直接接管降为 10/12，二次融合 w=0.5 升至 12/12。

### AC-07 · 对抗性不变量（Unwanted）

IF an adversarial reranker that scores candidates in fully reversed order is injected, THEN the runtime shall still return the first-stage fusion winner as the final top-1 result.

数学依据：当 `w < 1` 且融合榜长为 `n` 时，恒有
`冠军得分 − 亚军得分 = (1 − w) · [1/(k+1) − 1/(k+n)] > 0`（`n > 1`）。
注意：`w = 1` 时该差值恒为 0，置换型对抗退化为平局并使断言随 tie-break 抖动，故 `w` 必须严格小于 1。

### AC-08 · 重排器降级（Unwanted）

IF the reranker model is unavailable, THEN the runtime shall degrade to neutral scores `[0.0] * len(docs)` and shall pass the first-stage fusion ordering through unchanged, without raising an exception.

### AC-09 · trace 完整性（Event-driven）

WHEN an agent run completes, the runtime shall persist a trace record sufficient to reconstruct: the original input, all retrieved chunks (with chunk id and score), the ordered tool-call sequence, the verbatim text of every LLM completion, and the final output.

### AC-10 · trace 防篡改（Unwanted）

IF any persisted trace record is modified, THEN hash-chain verification shall fail and the runtime shall raise a tamper-detected error.

说明：append-only 语义——agent 不得修改自身的审计记录。

### AC-11 · OTel GenAI semconv 导出（Event-driven）

WHEN an OTLP export endpoint is configured, the runtime shall emit spans conforming to OpenTelemetry GenAI semantic conventions, including `gen_ai.operation.name`, `gen_ai.agent.name`, `gen_ai.tool.name`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, and `mcp.method.name`.

实现备注：截至 OTel Semantic Conventions 1.40（2026 年中），GenAI 与 MCP 段落正式状态仍为 **Development**（非 Stable），实现时必须 **pin 版本**。另需同时发送 `gen_ai.provider.name`（新）与 `gen_ai.system`（旧），因部分 collector 仍读后者。规范中**不存在 `gen_ai.usage.cost` 字段**，成本须自行按 provider + model 价格表推导。

### AC-12 · 证据模式可见性（State-driven）— R-2 核心

WHILE `evidence.mode = lenient`, the runtime shall permanently mark the current evidence mode in both the rendered UI and every emitted trace record.

严格口径补充：
- lenient 模式只能通过显式命令开启：`agentos config set evidence.mode lenient`；
- 模式标记**不可关闭、不可隐藏**——即使在 lenient 下，审计者也必须能看出该条输出是在何种模式下产生的；
- 默认安装的 `evidence.mode` 为 `strict`。

### AC-13 · 审计留存（Event-driven）

WHEN an agent run completes, the runtime shall retain its trace and audit records for a minimum of 180 days under append-only storage.

依据：EU AI Act 高风险系统义务要求 deployer 保留自动生成的日志不少于 6 个月（另有适用法律者从其规定）。

### AC-14 · 平台与降级韧性（Unwanted）

IF the default bind port is unavailable (including rejection caused by Windows WinNAT / Hyper-V reserved port ranges, commonly 8000–8123), OR the model file is not yet present at service start, THEN the runtime shall fall back to the next port in the sequence 8765 / 8801 / 9000 and shall keep the LLM loader retryable until the model file exists.

说明：模型加载器不得因「文件不存在」而一次性置位失败标志导致永久降级——仅在「文件存在但加载失败」时锁定。另：向 Qwen3 系列请求时**不得发送 `think: false`** 作为提速手段（该参数不减少思考，只是把推理从 `thinking` 字段倒进 `content`）。

---

## 7. 不做清单（Out-of-Scope）

| 不做的功能 | 原因 | 何时 reconsider |
|---|---|---|
| **多智能体 swarm / 角色编排** | Cognition 2025 年公开结论：swarm 在生产工程中已死；Anthropic 与 OpenAI 公开指引均收敛到「单强 agent + 子任务当工具」。且 CrewAI / AutoGen / OpenHands 已覆盖。主动跳反模式 | 除非出现新的公开证据推翻 Cognition 结论，否则永久不做 |
| **自研推理引擎** | 直接复用 llama.cpp / Ollama / transformers.js。我们的差异在**默认值与调优**，不在 kernel。重造轮子违反项目前提 | 永不 |
| **自研向量数据库** | SQLite FTS5 + 可选嵌入式向量已足够；Qdrant / Weaviate / Chroma 为成熟现成件 | 单机语料超过百万 chunk 且 FTS5 无法满足召回时延目标时 |
| **自研可观测后端 / 仪表盘 UI** | 只 emit OTel GenAI semconv，由 Grafana / Tempo / Datadog / Honeycomb 渲染。不养第二个 Grafana | 永不 |
| **云端 SaaS / 托管服务** | 与「本地优先 + 数据主权」定位直接冲突；运维成本会吃掉 MVP 全部预算 | 仅在出现明确的企业托管付费需求且团队扩张后 |
| **模型训练 / RL 微调** | SkillRL / OPID 路线需 GPU，与纯 CPU 定位冲突。改为蒸馏**人可读文本技能包**，不碰权重 | 永不（改以 F7 的文本化技能包实现自进化） |
| **IDE 插件（VS Code 扩展）** | Cline（5M 安装）、Continue、Roo Code 已饱和。红海且非差异点 | 永不 |
| **图形化工作流编排器** | n8n / Dify 已饱和，且与 CLI / 运行时定位不符 | 永不 |
| **0.x 阶段的 API 稳定承诺** | 过早锁死接口会阻碍 MVP 迭代 | 发布 1.0 时 |

---

## 8. 差异化定位

### 8.1 一句话

**中文**：唯一一个默认就会拒绝「没有出处的结论」、并且把每次失败变成下次技能的本地智能体运行时——不需要 API key，不需要 GPU。

**英文**：*The local-first agent runtime that refuses to answer without evidence — and gets measurably better every run.*

### 8.2 为什么选我们而不选竞品

| 对比对象 | 我们的差异 |
|---|---|
| OpenHands / Cline / Aider | 它们优化「能不能做完任务」，我们优化「做完了我敢不敢信」 |
| LangSmith / Langfuse / Lookspan | 它们记录发生了什么，我们**判定输出是否被证据支持**，并把判定结果作为硬闸门（AC-05） |
| Microsoft Agent Governance Toolkit / Actra / Lua Governance | 它们管「这个动作允不允许」，我们管「这句话真不真」——互补，且我们这块是空的 |
| EvolveR / SkillRL / Skill-SD / OPID | 它们要 GPU 训练权重，我们蒸馏成人可读 `.skill.json`，`cp` 即可移植 |

---

## 9. 非功能需求

| 类别 | 要求 | 优先级 |
|---|---|---|
| 性能 | 本地首次可用时间 < 3 分钟（含模型加载）；纯 CPU 7B 场景单轮响应 p95 < 30s；trace 写入开销 < 15% | P0 |
| 可用性 | 无外部依赖单点；模型不可用时优雅降级为「仅检索 + 拒答」，核心流程不崩 | P0 |
| 安全 | 全本地存储；trace 哈希链防篡改；工具调用参数默认脱敏后才落 trace；输入校验 + 速率限制 | P0 |
| 兼容性 | Node 22 LTS；Chromium / Safari / Firefox 最新两版；Windows / macOS / Linux x64 | P0 |
| 合规 | append-only 日志默认保留 ≥180 天（对齐 EU AI Act）；可导出审计包（模型版本 + 时间戳 + 决策链 + 证据模式标记） | P1 |
| 可访问性 | WCAG 2.1 AA 基本合规（键盘可达 + 对比度 ≥ 4.5:1） | P2 |
| 国际化 | UI 英文优先；README 中英双语；代码注释与日志英文 | P2 |
| 数据埋点 | 见 9.1，默认本地聚合、不外发 | P1 |
| 图标方案 | 统一 SVG 图标库 —— **Tabler Icons 3.46.0**（终裁，详见 10.1） | P1 |

### 9.1 数据埋点方案（本地优先）

约束：本产品卖点是数据主权，因此**默认不上报任何数据**。埋点落本地 SQLite，仅当用户显式开启「匿名使用统计」才外发。

| 事件类别 | 必埋事件 | 说明 |
|---|---|---|
| 获客 | `page_view`, `package_installed` | 来源、安装版本与平台 |
| 激活 | `first_trace_completed` | 跑通第一条完整链路——唯一的真激活信号 |
| 留存 | `session_start`, `session_duration` | DAU/MAU、使用频次 |
| **核心验证** | `evidence_gate_rejected`, `evidence_gate_passed` | **产品假设验证点**：拒答率过高说明验证器过严，过低说明未起作用 |
| 自进化 | `skill_distilled`, `baseline_completed` | 技能沉淀次数、对照组基准跑通次数 |
| 转化 | `repo_starred`, `skill_pack_exported` | 开源场景的「转化」是 star 与技能包传播，非付费 |
| 异常 | `error_occurred` | 前端错误 + API 错误 + 模型降级事件 |
| **信任锚** | `outbound_request_count` | **出站请求计数器**，见 9.2 |

实现要求：
- 事件命名 `{对象}_{动作}`（如 `evidence_gate_rejected`）
- 每条事件附 `session_id`（**非 user_id**，不采集身份）、`timestamp`、`platform`、`version`
- 不采集：IP、原始输入内容、文档正文、API key
- 本地聚合，用户可一键查看并导出自己的全部埋点数据

### 9.2 出站请求计数器（信任锚）

「数据未离开本机」是本产品的核心承诺，但**文案宣称不构成证据**。因此：

- 运行时必须维护一个**真实计数**的出站请求计数器，不得硬编码为 0；
- 计数器默认值为 0（未配置任何导出端点、未开启匿名统计时，应恒为 0）；
- 用户必须能在 UI 与 CLI 中随时查看当前计数值及其明细（目标主机 / 时间戳 / 触发原因）；
- 该计数值必须写入每一条 trace 记录，作为审计包的一部分导出。

依据：AC-01 要求离线可验证，但「断网后 CI 全绿」只能证明功能不受影响，不能证明无外发。计数器是让该承诺可机检的唯一手段——**用户不该被要求信任我们的文档，应该被允许自己数。**

---

## 10. 设计约束（供设计侧对齐）

| 项 | 取值 | 语义 |
|---|---|---|
| 冷中性底 | `#0A0D0E` | 背景基底 |
| 磷光青 | `#3CCFC1` | **「证据已验证」成功态** —— 产品的正面信号 |
| 信号琥珀 | `#E8A33D` | **「无证据 / 已拒答」警示态** —— 注意：拒答不是错误，不得做成红色错误页 |
| 图标库 | **Tabler Icons 3.46.0** | 禁止 emoji 作功能图标 |

### 10.1 图标硬约束（唯一源）

**图标全项目唯一源为 `@tabler/icons` 3.46.0（MIT，6184 枚 = outline 5130 + filled 1054，24×24 / 2px stroke）；具名导入禁 barrel，禁 webfont 版，filled 变体仅用于 active/selected 态，尺寸由 `AppIcon` 收口为 16 / 20 / 24，不走 CDN。**

改判依据：Lucide 仅有 outline 而无 filled 变体，UI 的 active / selected 态缺了它必然引入第二套图标，反而违反 P0「只锁一套」。

### 10.2 色彩语义

关于琥珀色的语义说明：**拒答是产品能力的高光时刻**（「我们没有让它编造」），应使用琥珀 + 克制陈述语气表达，而非报警语气。

其余设计约束（5 态覆盖、流式渲染、禁止空洞占位文案、禁止紫→粉渐变）见设计侧文档。

---

## 11. 交付形态

1. **工程仓库**：TypeScript / Node 22，pnpm workspace，vitest，GitHub Actions CI（Node 22 × Windows / macOS / Linux），README 含 build / coverage / npm version / license badge，MIT 许可。npm scope 包 `@aetheros/core` / `@aetheros/cli` / `@aetheros/runtime` / `@aetheros/sdk`，CLI 可执行名 `agentos`。
2. **单文件 HTML 演示引擎**（同期发布物，R-3）：零依赖、断网可跑、浏览器内完整演示「检索 → 证据验证 → 拒答 / 放行」链路；附 Node 无头自检脚本，退出码 0 为通过。
3. 发布至 GitHub `CJX0712/aetheros`。
