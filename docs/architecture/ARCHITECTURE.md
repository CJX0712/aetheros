# aetheros 架构文档

> 版本：1.0.0 ｜ 日期：2026-09-19 ｜ 状态：**已锁定**
> 本文件是 `docs/SPEC.md` §4 的展开真源。规格冲突以 `docs/SPEC.md` 为准。
> 所有版本号经联网核实，核实日期 **2026-09-18**，来源见 §10。禁止凭记忆写版本。

---

## 1. 定位与读者

| 项 | 值 |
|---|---|
| 项目名 | `aetheros` |
| CLI | `agentos` |
| npm scope | `@aetheros/*` |
| 一句话 | 默认就会拒绝「没有出处的结论」、并把每次失败变成下次技能的本地智能体运行时 |
| 硬边界 | 不需要 API key，不需要 GPU，默认零出站请求 |

读者：后端（依 §4/§7 建包）、前端（依 §4 目录与 §9 API）、QA（依 §6 可行性边界与 §11 已知坑写用例）。

---

## 2. 分层架构（依赖只向下）

```
┌──────────────────────────────────────────────────────────────┐
│ api/     CLI 命令 · HTTP 路由 · MCP tool handler              │  表现层
│          只做：参数校验(Zod) → 调 service → 组装响应            │
│          禁止：直接操作数据库、写业务规则                        │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ services/  业务编排 · 事务 · 规则 · 跨模块协调                  │  业务层
│            只做：编排 repository 与 domain，抛业务异常           │
│            禁止：import HTTP 对象(req/res)、返回 HTTP 响应       │
└──────────────┬───────────────────────────┬───────────────────┘
               ↓                           ↓
┌──────────────────────────┐  ┌────────────────────────────────┐
│ repositories/ SQLite 读写 │  │ domain/  纯算法，零 IO           │  领域层
│ 只做：SQL 与映射           │  │ RRF · BM25 · 哈希链 · 线程估算   │
│ 禁止：业务逻辑(if 余额>0)  │  │ 单测友好，无副作用               │
└──────────────┬───────────┘  └────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────────────┐
│ infra/   llama 实例 · sqlite 连接 · OTel SDK · net 出口         │  基础设施
└──────────────────────────────────────────────────────────────┘

schemas/   Zod schema，独立成文件，不混进逻辑
index.ts   只做导出装配，无业务
```

**依赖铁律（违反即退回）**

| 允许 | 禁止 |
|---|---|
| `api → services` | `repository → service`（反向） |
| `services → repositories / domain` | `api → repository`（跨层） |
| `repositories / domain → infra` | `services → repository B`（跨模块直连，应调 service B） |
| — | `services` import `req`/`res` |
| — | `domain` 触碰任何 IO |

---

## 3. 包与模块清单

| 包 | 职责 | 血统来源 |
|---|---|---|
| `@aetheros/core` | 事件总线、配置、错误分类、Feature Flag、**`net` 网络出口收口** | aetherflow |
| `@aetheros/runtime` | ReAct 循环、工具注册表、durable 检查点、run 生命周期 | aetherflow |
| `@aetheros/rag` | 索引 / 检索 / BM25+dense+RRF+rerank / 证据锚点 | glassbox |
| `@aetheros/gate` | Evidence Gate（默认 strict）、拒答与缺口标注 | glassbox |
| `@aetheros/evolve` | 技能蒸馏、pitfall、对照组基准、`.skill.json` | evolver |
| `@aetheros/aurora` | 本机推理 provider（node-llama-cpp / Ollama）、线程与画像 | aurora |
| `@aetheros/mcp` | MCP client + server 双向桥、token 预算护栏 | — |
| `@aetheros/telemetry` | OTel setup + SQLite SpanExporter + 哈希链 | — |
| `@aetheros/ui` | `AppIcon` / `icons.manifest` / token 引用层 | — |
| `@aetheros/cli` | `agentos` 命令入口（只装配） | — |

`apps/demo/index.html` —— 零依赖单文件演示引擎（P1 同期发布物，不进 MVP 门禁）。

---

## 4. 目录结构与文件组织约束

```
aetheros/
├─ packages/
│  └─ <pkg>/src/
│     ├─ api/            # 命令 / 路由 / MCP handler，每个资源一个文件
│     ├─ services/       # 每个资源一个 service
│     ├─ repositories/   # 每张主表一个 repository
│     ├─ domain/         # 纯算法，无 IO
│     ├─ schemas/        # Zod，独立文件
│     ├─ infra/          # 原生客户端实例
│     └─ index.ts        # 只装配
├─ apps/demo/index.html
├─ assets/fonts/         # Geist + Commit Mono woff2 + LICENSE（禁 CDN）
├─ docs/
│  ├─ architecture/      # 本文件 + SCHEMA.sql
│  ├─ api/openapi.yaml
│  ├─ decisions/ADR-001..016.md
│  └─ design/
└─ scripts/
```

**文件组织硬规则（出现即不合格）**

| # | 规则 | 不合格表现 |
|---|---|---|
| 1 | 单一职责：一文件一主职责、一主导出 | 路由+逻辑+SQL+工具同文件 |
| 2 | **单文件 ≤ 300 行**（不含空行注释） | `index.ts` 800 行 |
| 3 | 按资源分包 | 所有 controller 堆进一个文件 |
| 4 | **入口只装配**，< 100 行，零业务 | 入口里写业务实现 |
| 5 | 业务逻辑不进路由处理器 | `router.post` 回调里 50 行业务 |
| 6 | `utils/` 只放纯函数 | 把业务流放进 utils |
| 7 | 类型/Schema 独立成文件 | Zod schema 与业务同文件 |

**门禁命令**（脚本内路径一律 `C:/...` 形式，见 §11）

```bash
# 超 300 行即不合格
find packages -name '*.ts' | xargs wc -l | sort -rn | awk '$1>300 && $2!="total"{print "OVER:",$0}'
# 入口行数
wc -l packages/*/src/index.ts
```

---

## 5. 关键流程时序

### 5.1 run（一次智能体运行）
```
cli/api  →  runtime.createRun()                  [span: agentos.run]
         →  telemetry.beginRun() 记录 run_id + net 计数器快照(基线 0)
         →  loop:
              aurora.generate(prompt, threads=autoThreads())   [span: gen_ai]
              ├─ 工具调用意图 → mcp.callTool()                  [span: tool]
              ├─ 检索意图    → rag.retrieve()                   [span: retrieve]
              └─ 终止意图    → gate.evaluate(claims)            [span: gate]
         →  gate 判定：
              strict + 断言无 chunk 绑定 → 拦截 + 标注缺口（AC-05）
              lenient → 输出 + trace 永久标记 lenient（AC-12）
         →  telemetry.endRun() 写入 spans 表 + 哈希链 + outbound_count
```

### 5.2 index（语料入库）
```
document.ingest(path)
  → 读字节 → 计算 document_hash（标识源文件）
  → 切 chunk，对每个 chunk 同时记录：
       byte_start/byte_end    权威地址（抗重新编码）
       utf16_start/utf16_end  渲染用（JS String 索引）
  → 不变式断言：decode(bytes)[utf16_start:utf16_end] === chunk_text
  → chunks_fts（FTS5 trigram）写入；dense 向量 → BLOB Float32Array
  → 成功即返回，失败不静默（哈希不匹配判 failed，见 SPEC §8.1）
```

### 5.3 retrieve（三路信号融合，AC-06/07）
```
query
  ├─ fts5 bm25    → rank_A
  ├─ dense cosine → rank_B
  └─ RRF(rank_A, rank_B) → 首阶段融合冠军  C
  → rerank(C 的候选) → rank_C
  → 二次融合：score = (1-w)*rrf_score + w*rerank_score,  w = 0.5
  → reranker 不可用 → 降级为中性分数，透传首阶段排序，不抛异常（AC-08）
```
对抗性不变量：注入**全倒序** reranker，top-1 仍必须是 C。`w` 必须严格 `< 1`，否则冠亚军差值恒为 0 退化为平局（AC-07）。

### 5.4 verify（证据闸门与状态判定）
```
claim
  → 能否绑定到 chunk span？
      否 → strict: 拦截 + 标注证据缺口（非错误、非低置信度输出）
      是 → 内容哈希与入库时一致？
              否 → failed（"内容哈希与入库时不一致，该来源已变更，证据链不可信"）
              是 → verified
  → 五种状态互斥：verified / unverified / refused / failed / error
  → refused 是产品的正确工作结果，禁止做成红色错误页
```

### 5.5 evolve（技能蒸馏与对照组）
```
run 结束 → 抽取候选 skill → 对照组基准（固定 seed + temperature=0 + 多次投票）
        → 回归通过 → 写 .skill.json（Zod 校验）+ skill_versions 新行
        → 回归劣化 → 丢弃并记 pitfall
```
基线稳定性前提：`temperature=0` + 固定 seed + 多次采样投票，否则回归不可比（ADR-012）。

---

## 6. 技术选型对比矩阵

> 每维度 ≥3 候选。评分 ★ 最高 5。

### 6.1 运行时
| 候选 | 版本 | 结论 |
|---|---|---|
| **Node.js** | **≥ 22.19.0** | ★★★★★ 选定。MCP inspector v2 强制 ≥22.19；pnpm 11 要求 22+ |
| Node.js | 24 LTS（Active，至 2028-04-30） | ★★★★ CI 增测，非主目标 |
| Bun | 1.x | ★★ 原生 addon（better-sqlite3 / llama）兼容性风险，出局 |

> 注：Node 22 已转 Maintenance LTS（EOL 2027-04-30）。README 声明 24 为推荐开发环境，22.19 为最低支持线。

### 6.2 语言
| 候选 | 版本 | 结论 |
|---|---|---|
| **TypeScript** | **6.0.3**（2026-03-23） | ★★★★★ 选定。末个 JS 编译器稳定版，生态最稳 |
| TypeScript | 7.0（Go 原生，2026-07-08 GA） | ★★★ 提速约 10×，但生态未稳 → 观察项，不进 MVP |
| JSDoc + checkJs | — | ★★ 类型表达力不足，出局 |

### 6.3 本地推理后端
| 候选 | 版本 | 结论 |
|---|---|---|
| **node-llama-cpp** | **3.20.0**（2026-08-12） | ★★★★★ 选定。进程内、预编译二进制、原生 embedding + rerank、JSON schema grammar |
| Ollama | 0.34.1（2026-09-14） | ★★★ 需外部守护进程 → 仅作可选 provider，非硬依赖 |
| transformers.js | 4.2.0（2026-04-22） | ★ 不支持 GGUF，CPU 7B 不可行 → 出局 |

### 6.4 存储与检索
| 候选 | 版本 | 结论 |
|---|---|---|
| **SQLite + better-sqlite3** | **3.53.4 / 13.0.3** | ★★★★★ 选定。FTS5 齐备、同步 API 简单、零服务 |
| Node 内建 `node:sqlite` | 22.x 起实验性 | ★★ 稳定性不及 better-sqlite3，自定义函数受限 → 出局 |
| PGlite / libsql | — | ★★ 引入额外运行时体积，FTS5 trigram 支持不确定 → 出局 |

向量：MVP 用 `BLOB` 存 `Float32Array` + 暴力余弦；> 50k chunk 触发迁移评估（ADR-003）。

### 6.5 可观测
| 候选 | 版本 | 结论 |
|---|---|---|
| **OpenTelemetry JS SDK** | **0.219.0 / api 1.9.0** | ★★★★★ 选定。CNCF 2026-05-21 毕业；只 emit，不自研后端 |
| 自研 trace | — | ★ 重造轮子，与 SPEC §3「永不自研可观测后端」冲突 |
| Pino + 自研 span | — | ★★ 无标准 semconv，第三方 collector 无法消费 |

落本地：自研 `SQLiteSpanExporter` 实现 `SpanExporter` 接口，批量异步落盘（512 条 / 5s）。

### 6.6 MCP 集成
| 候选 | 版本 | 结论 |
|---|---|---|
| **官方 v2 拆包** | **2.0.0**（2026-07-27，spec 2026-07-28） | ★★★★★ 选定。同进程可装 server+client |
| v1 monolith `@modelcontextprotocol/sdk` | 1.30.0 | ★★★ 仍受支持但为旧线 → 仅迁移期 |
| 自研 JSON-RPC | — | ★ 重造轮子 |

schema 走 Standard Schema + Zod 4。`stdio` 必须走 `/stdio` 子路径显式 import。

### 6.7 校验 / 测试 / 包管理 / CI / 图标 / 构建
| 维度 | 选定 | 候选与出局理由 |
|---|---|---|
| 校验 | **Zod 4.6.5**（2026-09-13） | ArkType / Valibot：生态与 MCP 默认支持不及 Zod |
| 测试 | **Vitest 5.0.1**（2026-09-15） | `node:test` 缺覆盖率与 UI；Jest ESM 配置成本高 |
| 包管理 | **pnpm 11.22.0**（2026-08-15） | npm 无 workspace 严格性；Bun 同上 addon 风险 |
| CI | **GitHub Actions**（checkout v6 / setup-node v6 / pnpm-action-setup v6） | GitLab CI / CircleCI：与目标发布平台 GitHub 不一致 |
| 图标 | **@tabler/icons 3.46.0**（2026-07-28） | Lucide 1.46.0：**无 filled 变体** → 出局（ADR-006）；Heroicons 数量不足 |
| 构建 | **tsdown**（Rolldown） | tsc 无打包；esbuild 无 d.ts 聚合 |

---

## 7. 可行性结论（逐条）

| # | 能力 | 结论 | 依据与约束 |
|---|---|---|---|
| 1 | 纯 CPU 7B 推理 | **可行，成本中** | Qwen2.5-7B-Instruct Q4_K_M 文件 4.68 GB（bartowski 实测）；CPU ~8–15 tok/s。硬底线 8 GB 空闲内存，推荐 16 GB。约束见 §8 |
| 2 | MCP 双向（client + server） | **可行** | v2 拆包原生支持同进程双向 |
| 3 | 全链路 trace 落本地 SQLite | **可行** | OTel SDK + 自研 exporter；WAL + 批量；哈希链 append-only（AC-10） |
| 4 | 证据可验证 RAG（字符区间溯源） | **可行** | 双区间方案（ADR-011）；中文 BM25 用 FTS5 trigram（ADR-010） |
| 5 | 自进化层（蒸馏 + 对照组回归） | **可行，成本中** | 基线稳定性依赖 temperature=0 + 固定 seed（ADR-012） |
| 6 | 单文件 HTML 演示引擎 | **可行** | 演示 RRF 融合 / 证据锚点高亮 / trace 回放 / ReAct 状态机 / 技能包浏览；**不演示**任何模型推理、不加载 GGUF、不下载权重 |

### 7.1 单文件 HTML 的「演示 / 不演示」边界（锁定）
- **演示**：RRF 融合可视化（k 可调）、证据链字符区间高亮与溯源、trace 火焰图回放、ReAct 状态机、技能包浏览。
- **不演示**：模型推理、GGUF 加载、权重下载、真实检索。全部走内置 fixture。
- **零依赖**：vanilla JS + 内联 CSS + Tabler SVG path 内联（构建期生成，不手抄）。无 CDN、无 WASM、无 fetch。
- **Node 无头自检**：引擎代码置于 `<script id="aos-engine">` 标记块；`scripts/verify-demo.mjs` 用 `node:fs` 读 HTML + `node:vm` 执行该块跑断言。**同一份代码两处运行，零重复实现**（ADR-007）。

---

## 8. 性能与内存预算

### 8.1 内存底线（硬约束）
| 场景 | 占用 | 说明 |
|---|---|---|
| 7B Q4_K_M 权重 | 4.68 GB | bartowski 实测文件尺寸 |
| + 4K KV cache | ≈ 4.9 GB | FP16 KV |
| + 8K KV cache | ≈ 5.1 GB | — |
| 运行时开销与缓冲区 | 0.5–1.0 GB | 待 `agentos bench` 实测校正 |
| **硬底线** | **8 GB 空闲内存** | 低于此不承诺可运行 |
| **推荐** | **16 GB** | — |

**7B 与 embedding 模型不可在 8 GB 机同驻** → 必须做模型生命周期管理（LRU + 显式 load/unload），由 `@aetheros/aurora` 负责。

### 8.2 CPU 线程（AC-02 / AC-03）
- 线程数取 `autoThreads()` 并**夹到 [2, 4]**。
- 根因：小量化模型瓶颈在**内存带宽**不在算力。实测 4 线程 32.5 tok/s vs 16 线程 8.2 tok/s（慢 4 倍）。
- `autoThreads(n)` 返回值越界则测试**具名失败**（防回退）。

### 8.3 吞吐参考（待 bench 校正）
| 场景 | 参考值 |
|---|---|
| 7B Q4_K_M 纯 CPU 生成 | ~8–15 tok/s |
| 4 线程（调优后） | 32.5 tok/s（实测样本） |

### 8.4 检索预算
| 项 | 预算 |
|---|---|
| 暴力余弦适用规模 | ≤ 50k chunk |
| 超规模 | 触发 sqlite-vec 迁移评估（ADR-003） |
| trace 写入 | 批量 512 条 / 5s，禁止逐 span 同步 insert |

### 8.5 端口与降级（AC-14）
回退序列 **8765 / 8801 / 9000**。原因：WinNAT / Hyper-V 保留端口段（常见 8000–8123）。
模型加载器：**仅「文件存在但加载失败」时锁定失败标志**；文件不存在时保持可重试。

---

## 9. 出站请求收口（AC-01 可机检的前提）

**单一 `net` 模块**：`packages/core/src/infra/net.ts` 是全项目**唯一**允许发起 HTTP 的位置。

```
任何业务模块  ──×──  直接 fetch / http.request / undici
                 │
                 └─→  net.request(url, {reason})  ─→  计数 + 明细记录
```

**规则**
1. `fetch` / `node:http` / `node:https` / `undici` 在 ESLint 中全局禁用，`net.ts` 白名单放行。
2. 每次出站写入 `outbound_requests`：`host` / `ts` / `reason` / `run_id` / `span_id`。
3. **计数器写入每一条 trace**：默认 `0`，用户可查看计数值及明细（目标主机 / 时间戳 / 触发原因），随审计包导出。
4. **口径定义**：`出站 = 非回环地址`（非 `127.0.0.0/8`、`::1`、`localhost`）。回环调用单独记为 `loopback_calls`，不计入出站——数据未离开本机。
5. 计数器是「数据未离开本机」信任锚的**机器证据**，不能只是文案宣称。

绕过 `net` 直接发起请求 = 计数器失效 = AC-01 不可机检。此条为 P0。

---

## 10. 版本硬锚清单（开发必需）

> 核实日期 2026-09-18。写入 `package.json` **精确版本**，以下关键件**禁止 `^` 漂移**。

| 依赖 | 版本 | 核实来源 |
|---|---|---|
| Node.js | `>=22.19.0` | MCP inspector v2 engines；pnpm 11 要求 22+ |
| TypeScript | `6.0.3` | npm registry time 2026-03-23 |
| pnpm | `11.22.0` | eol.wiki 2026-08-15 |
| node-llama-cpp | `3.20.0` | socket.dev 2026-08-12 |
| SQLite | `3.53.4` | sqlite.org 2026-07-24 |
| better-sqlite3 | `13.0.3` | snyk / releasealert 2026-08-05 |
| `@opentelemetry/sdk-node` | `0.219.0` | libraries.io |
| `@opentelemetry/api` | `1.9.0` | stable track |
| `@modelcontextprotocol/server` | `2.0.0` | GitHub Release 2026-07-27 |
| `@modelcontextprotocol/client` | `2.0.0` | 同上 |
| zod | `4.6.5` | devcheck.dev 2026-09-13 |
| vitest | `5.0.1` | releasealert 2026-09-15 |
| `@tabler/icons` | `3.46.0` | GitHub Release 2026-07-28 |
| `@tabler/icons-react` | `3.46.0` | 与 icons 共享版本号 |
| Geist（字体） | OFL 1.1 | vendored + 随附 LICENSE |
| Commit Mono（字体） | OFL 1.1 | 同上 |

CI Actions：`actions/checkout@v6`、`actions/setup-node@v6`、`pnpm/action-setup@v6`（Node 20 actions 于 2026-06-02 到期）。

**设计侧锚定**：CSS 前缀 `--aos-`；`ICON_STROKE = 2`（单一常量，24 网格用户单位）；图标尺寸 16/20/24；`brain` / `sparkles` 拉黑。见 ADR-006 / 015 / 016。

---

## 11. 内嵌已知坑（防重蹈覆辙）

> 与 `docs/SPEC.md` §11 同源，此处补架构侧执行细节。

| 坑 | 根因 | 架构侧修法 |
|---|---|---|
| 线程数默认 `cpu_count()-1` | 瓶颈在内存带宽 | `autoThreads()` 夹 [2,4] + AC-03 具名断言 |
| rerank 直接接管排序反而变差 | 单信号无制衡，中文尤甚 | 二次融合 `w=0.5`，`w<1` |
| 对抗器注入后断言抖动 | `w=1` 时差值恒为 0 | AC-07 强制 `w<1` |
| 证据锚点中文静默错位 | JS String 索引是 UTF-16 code unit 非字节 | 双区间 + 不变式测试，中文语料必跑（ADR-011） |
| **FTS5 trigram 短查询不命中** | trigram 以 3 字符为最小单位 | 中文查询词 < 3 字时降级为 `LIKE` 兜底，或显式返回空并提示 |
| OTel 字段名新旧并存 | 部分 collector 读旧字段 | 同时发 `gen_ai.provider.name`（新）与 `gen_ai.system`（旧）；**不存在** `gen_ai.usage.cost` |
| 端口被 Windows 保留 | WinNAT / Hyper-V 保留段 | 回退 8765 / 8801 / 9000 |
| Qwen3 `think:false` 误用 | 不减少思考，只把推理倒进 content | 禁止向 Qwen3 系列发送该参数 |
| 模型加载器一次性置位 | 文件不存在时锁定失败标志 | 仅「存在但加载失败」才锁定 |
| 图标名凭记忆翻译 | 编译期未必报错，运行时空白 | 构建脚本解析 + CI 红灯（ADR-014） |
| 逐 span 同步写 SQLite | IO 打满主线程 | 批量 512 条 / 5s |
| 各模块自行 fetch | 绕过计数 | 单一 `net` 模块 + ESLint 禁用（§9） |
| Windows 沙箱丢弃 `.git/refs/remotes/` 写入 | 沙箱限制 | 用 PowerShell 重建引用文件 |
| 本机 PortableGit bash 无 `/c` 挂载 | `/c/Users/...` 被当 `C:\c\...` | 脚本内路径一律 `C:/...` 形式 |

---

## 12. 端到端验证

```bash
pnpm install && pnpm build
pnpm test                                   # AC-01：断网跑，退出码 0
agentos bench && cat ~/.aetheros/profile.json   # AC-04：threads ∈ [2,4]
agentos ask --evidence-mode strict "无出处问题"  # AC-05：拦截 + 标注缺口
agentos config set evidence.mode lenient        # AC-12：UI 与 trace 永久标记
pnpm test -- retrieval                      # AC-06/07：倒序 reranker 下 top-1 不变
# 手工改一条 trace 后校验 → 抛 tamper-detected   # AC-10
node scripts/verify-demo.mjs                # 单文件 HTML 无头自检全绿
```

---

## 13. 相关文档

- `docs/SPEC.md` —— 唯一规格真源（冲突以它为准）
- `docs/api/openapi.yaml` —— API 契约真源
- `docs/architecture/SCHEMA.sql` —— 数据契约真源
- `docs/decisions/ADR-001..016.md` —— 决策留痕
- `docs/design/design-tokens.json` —— 设计 token 真源
