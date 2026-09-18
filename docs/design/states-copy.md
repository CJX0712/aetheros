# Agent OS — 五态文案表（States & Microcopy）

> 设计侧交付物。每个核心界面的 Loading / Empty / Error / Populated / Edge 五态**具体文案**，前端直接取用，不得自行改写。
> 配套：`DESIGN.md` §8 组件范式、`design-tokens.json`。
> 语言：UI 主文案**英文**（面向国际开发者）；中文仅在 zh-CN 语言包出现。UI 文案禁止占位符、禁止空洞词。

---

## 0. 文案规则（写新文案前先读）

**四句公式**
1. **错误 = 发生了什么 + 为什么 + 怎么修。** 不写 "Something went wrong"。
2. **按钮 = 动词 + 宾语。** "Load model" 不是 "OK"；"Delete 5 runs" 不是 "Delete selected"。
3. **空状态 = 会有什么 + 为什么重要 + 怎么开始。** 空状态是 onboarding 时刻，不是道歉。
4. **加载文案 = 产品特定的具体动作。** 不写 "Loading…"、"Herding pixels"。

**术语表（全项目唯一，不得为变体换词）**

| 用这个 | 不用这个 |
|---|---|
| Run | Session / Execution / Job |
| Span | Step / Node / Event |
| Evidence | Source / Citation / Reference（Citation 仅指角标 `[3]`） |
| Grounded | Verified / Confirmed（已落地证据支撑的断言） |
| Ungrounded | Hallucinated（技术判断，不由 UI 断言） |
| Skill | Tool / Capability / Plugin |
| Candidate | Variant / Mutant |
| Promote | Approve / Merge（技能固化） |
| Load / Unload | Start / Stop（模型常驻） |

**禁用词**：seamless / robust / elevate / empower / unlock / next-gen / powerful（无数字）/ Welcome to / Sign up today。

**状态词三语对照**（UI 默认英文，zh-CN 语言包按下表替换；**三语都必须带文字，颜色永不单独承载状态**）

| EN（UI 默认） | zh-CN | Token | 图标 | 含义 |
|---|---|---|---|---|
| `Grounded` | 已落地 | `--aos-verified` | check | 断言有检索证据支撑 |
| `Unverified` | 待核验 | `--aos-unverified` | circle-dashed | 证据链不完整，尚未核验 |
| `No source` | 未落地 / 无据 | `--aos-failed` | alert-triangle | 无证据支撑，strict 模式下已被拦截 |
| `Running` | 运行中 | `--aos-running` | loader | span 正在执行 |
| `Idle` | 空闲 | `--aos-idle` | circle-dashed | 排队 / 未启动 |

> 依据 PRD R-2：Evidence Gate 默认 **strict**，未落地断言一律拦截。UI 与 trace 中**永久标记当前模式**（`strict` / `lenient`），切换宽容模式的命令为 `agentos config set evidence.mode lenient`。该模式标记必须在证据面板与 trace 头同时可见，不能只写在设置页。
**虚构指标禁令**：任何数字必须来自真实计数器。没有数据就写 "No runs yet"，不写 "0 runs" 之外的任何推断。

---

## 1. Run 时间线 / Trace 瀑布

| 态 | 文案 | 视觉 |
|---|---|---|
| **Loading** | `Waiting for first span…` + 静默光标（无逐字动画） | 骨架 6 行，`--aos-surface-raised` 条，行高 28px |
| **Loading（>3s）** | `Model is loading into memory · qwen2.5-7b-q4_K_M (3.2 GB)` | 细条 meter，无 spinner 遮罩 |
| **Empty** | 标题 `No runs yet` / 正文 `Start a run and every span will stream here.` / 按钮 `Copy command` → `agentos run "your task"` | `activity` 图标 24px `--aos-muted`，文案左对齐，按钮 primary |
| **Empty（有过滤器）** | `No runs match this filter` / `Clear filter` 次级按钮 | 同上，无图标插画 |
| **Error · 模型** | `Model failed to load` / `qwen2.5-7b-q4_K_M not found in ~/.aetheros/models` / 按钮 `Open models` + `Retry` | `alert-triangle` + `--aos-failed`，就近显示在 run 头 |
| **Error · 工具** | `Tool exited with code 1` / `bash: npm: command not found` / 按钮 `Show full output` | 原始 stderr 用 `--aos-surface-inset` + mono |
| **Error · 权限** | `Permission denied` / `agentos needs read access to ~/repo/docs` / 按钮 `Grant access` | — |
| **Error · 超时** | `Run exceeded 120s limit` / 按钮 `Raise limit` + `Retry` | — |
| **Populated** | run 头：`run-8f3c1a · running · 12.4s · qwen2.5-7b · 3,412 tok · 4 spans` | 数字全 mono + tabular-nums |
| **Edge · 超长 span 名** | 名截断 + `title` 属性；不换行 | `text-overflow: ellipsis` |
| **Edge · 万级 span** | `Showing 1,000 of 24,318 spans · Load more` | 虚拟化，分段加载 |
| **Edge · 直播中断** | 浮出胶囊：`12 new · Jump to latest` | `--aos-elev-overlay`，用户上滚后出现 |

---

## 2. RAG 证据链面板

| 态 | 文案 | 视觉 |
|---|---|---|
| **Loading** | `Searching 4 shards…`（分片数真实计数，不写死） | 骨架 3 行 |
| **Empty · 索引未建** | 标题 `No index yet` / 正文 `Index a directory and evidence will be traceable to the character.` / 按钮 `Copy command` → `agentos index ./docs` | `file-search` 24px |
| **Empty · 检索无果** | `No chunks scored above 0.20` / `Lower the threshold` 或 `Reindex` | 阈值数字来自真实配置 |
| **Error · 索引损坏** | `Index is unreadable` / `vector.idx failed checksum at block 1,204` / 按钮 `Rebuild index` | `alert-triangle` |
| **Error · 嵌入模型缺失** | `Embedding model not loaded` / `all-MiniLM-L6-v2 (90 MB) is not in ~/.aetheros/models` / 按钮 `Download` + `Cancel` | 下载按钮明示例外（唯一允许的出站动作，须显式告知） |
| **Error · 哈希不匹配** | `Source changed since indexing` / `docs/architecture.md differs from sha256:9f3c…` / 按钮 `Show diff` + `Reindex` | `shield-x` + `--aos-failed` |
| **Populated** | 计数行：`Evidence 7 · Grounded 5 · Unverified 2 · 12 chunks · mean relevance 0.62` | 计数行常驻，是可审计性第一入口 |
| **Populated · 单条** | `docs/architecture.md #chunk-3` / 摘要句 / `~/repo/docs/architecture.md · 2026-09-18 · sha256:9f3c… · 1284–1402` / `Open source` `Flag misleading` `Copy citation` | 溯源四件套 |
| **Edge · 低置信** | `Low confidence — all chunks scored below 0.20. Treat this answer as ungrounded.` | `--aos-unverified` + `alert-triangle` + 文字 |
| **Edge · 超长摘要** | 3 行截断 + `Expand` | `-webkit-line-clamp: 3` |

**状态语义（三通道，颜色永不是唯一信号）**
> 图标名必须以 `packages/ui/src/icons.manifest.ts`（P0 唯一图标源，ADR-006 / ADR-014）为准。本表文案与语义先行，图标名如有出入以 manifest 为锁定值。

- Grounded → `check-check` 语义位 → manifest 锁定 `shield-check` + `--aos-verified` + 文字 `Grounded`
- Unverified → `circle-dashed` 语义位 → manifest 锁定 `shield-question` + `--aos-unverified` + 文字 `Unverified`
- Ungrounded → `alert-triangle` 语义位 → manifest 锁定 `info-circle` + `--aos-failed` + 文字 `No source`

---

## 3. 技能库与自进化

| 态 | 文案 | 视觉 |
|---|---|---|
| **Loading · 候选生成** | `Generating candidate 3 of 8…` + `Abort` 按钮 | 进度条 meter 6px |
| **Loading · 评估中** | `Running eval set · 42 cases · 17 done` | 计数器 mono |
| **Empty** | 标题 `No evolution yet` / 正文 `A skill needs 20 recorded runs before candidates are generated.` / 按钮 `Run evaluation` | `git-branch` 24px |
| **Empty · 技能库** | `No skills recorded` / `Skills appear here after their first successful run.` | `blocks` 24px |
| **Error · 评估失败** | `Evaluation failed` / `3 of 42 cases errored: tool timeout (2), OOM (1)` / 按钮 `View cases` + `Retry` | 分类+计数，不笼统 |
| **Error · 晋升被拒** | `Candidate did not clear the bar` / `Success rate 61% vs current 68% (−7.0pt)` / 按钮 `Keep as candidate` + `Discard` | 数字来自真实对比 |
| **Populated** | 行：`refactor-imports · v0.3.2 · 68% · 142 calls · stable` | sparkline 12 根 2px 条 |
| **Populated · 谱系** | 节点标签：`gen 7 · Δ success +4.2pt · Δ latency −180ms` | `▲/▼` + 有符号数字 + 文字，**不靠颜色单通道** |
| **Δ 标记约定** | 方向与好坏是两个正交属性：`data-sign="up\|down"` 决定 ▲/▼ 箭头，`data-tone="good\|bad\|flat"` 决定颜色。**绝不能由 sign 推导颜色**——「Δ latency −180ms」是 down 却是好事，按 sign 上色会把性能优化标成红色 | 例：`<span class="aos-delta" data-sign="down" data-tone="good">▼ 180ms</span>`；缺 `data-tone` 时回退 `--aos-muted` |
| **Edge · 超长 diff** | `+412 −298 lines` / `Expand full diff` | 默认折叠 |
| **Edge · 候选过多** | `38 candidates · Showing 20 · Load more` | 虚拟化 |

**危险操作文案**：`Rollback to v0.3.1`（带版本号，不是 "Rollback"）；`Discard candidate c-91f`。破坏性按钮用 destructive 变体 + 二次确认弹窗，确认文案复述后果：`Rollback will revert 142 recorded runs to v0.3.1 behavior.`

---

## 4. 本地模型与资源

| 态 | 文案 | 视觉 |
|---|---|---|
| **Loading · 加载模型** | `Loading qwen2.5-7b-q4_K_M · 2.1 / 3.2 GB` | meter 6px，`--aos-surface-inset` 轨道 |
| **Empty** | 标题 `No models installed` / 正文 `aetheros runs locally. Pull a model to make your first run.` / 按钮 `Copy command` → `agentos pull qwen2.5-7b-q4_K_M` | `cpu` 24px |
| **Error · 磁盘不足** | `Not enough disk` / `qwen2.5-7b-q4_K_M needs 3.2 GB, 0.9 GB free` / 按钮 `Choose smaller quant` | 数字真实 |
| **Error · 推理崩溃** | `Inference stopped` / `llama.cpp exited 2: tensor mismatch for blk.0.attn_norm` / 按钮 `Show log` + `Reload` | mono 原始错误 |
| **Populated · metric strip** | `CPU 62% · RAM 4.1 / 16 GB · qwen2.5-7b-q4_K_M (3.2 GB resident) · 18.4 tok/s` | **单行内联**，全部 mono + tabular-nums。拒绝「大数字+小标签」指标卡 |
| **Populated · 信任锚** | `cloud-off` + `Local only · 0 outbound requests` | 常驻顶栏，可展开显示 24h 计数 |
| **Edge · 资源告警** | `RAM at 91% — unload idle models?` / 按钮 `Unload` + `Dismiss` | meter 填充 > `0.8` 切 `--aos-meter-fill-critical`。**资源计默认中性（`--aos-meter-fill`），琥珀按 Amber Means Unverified Rule 只留给证据不完整，不得用于资源告警** |
| **Edge · 线程提示** | `Threads: 4` / 旁注 `Small models are memory-bandwidth bound. More than 4 threads usually makes them slower.` | 真实工程洞察，放在配置旁而非藏在文档 |

---

## 5. 全局

| 场景 | 文案 |
|---|---|
| 命令面板占位 | `Type a command or search runs…` |
| 复制成功 | `Copied`（1.2s 后消失，不阻塞） |
| 导出 | `Exporting trace…` → `Exported run-8f3c1a.json (412 KB)` |
| 网络请求（唯一例外：下载模型） | `Downloading model · 90 MB · 12.4 MB/s`。**必须显式告知这是唯一出站动作** |
| 权限请求 | `agentos wants read access to ~/repo/docs` / `Allow` `Deny` |
| 破坏性确认 | 复述具体后果 + 具体数量，例：`Delete 5 runs? Their traces cannot be recovered.` |
| 离线声明 | `Runs entirely on this machine. No telemetry.` |

---

## 6. 无障碍文案约束

- 每个纯图标按钮配 `aria-label`，文案与 tooltip 一致。
- 直播区域 `aria-live="polite"`；新 span 追加不朗读全文，只读 `Span added: retrieve, 0.42s`。
- 状态播报用文字标签，不依赖颜色：**`Grounded` / `Unverified` / `No source`** 三个词是屏幕阅读器能听到的全部信息。
- 按钮禁用时保留 `title` 说明原因：`Needs an index. Run agentos index ./docs`
