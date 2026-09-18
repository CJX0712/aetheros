# 页面 2 — RAG 证据链面板

> 这是全产品**最能建立信任**的界面：它必须能诚实地展示「哪些断言没根据」。
> 权威值见 `design-system/MASTER.md`；文案见 `states-copy.md`；图标槽见 `icon-semantics.md`。

## 页面：证据链面板
- **路由**：`/app/runs/:runId/evidence`（独立页）+ 作为 trace 页右栏 360px 常驻（同组件两种容器）
- **寄存器**：Product ｜ **Density 7** ｜ Variance 5
- **色彩归属**：本页是**证据面** → `--aos-accent` 青色在此**合规**（规则一）

## 布局
纵向 Flex：`EvidenceCountBar`（固定 32px）→ `AnswerBlock`（可折叠，含内联引用 chip）→ `EvidenceList`（唯一滚动容器）。
容器为右栏时同构；为独立页时左边界与主区对齐，单一滚动。

```
证据 7 · 已落地 5 · 待核验 2 · 检索 12 片段 · 平均相关度 0.62     ← 计数行（可审计性第一入口）
──────────────────────────────────────────────────────────
[quote] docs/architecture.md #chunk-3            ▁▄▆█ 0.81
        "…证据链以 char offset 锚定到原文，因此任意
         一句断言都可回溯到具体字符区间…"
        ~/repo/docs/architecture.md · 2026-09-18 · sha256:9f3c… · 1284–1402
        [Open source] [Flag misleading] [Copy citation]
──────────────────────────────────────────────────────────
```

## 核心组件

| 组件 | 规格 | 备注 |
|---|---|---|
| `EvidenceCountBar` | 五项计数：证据总数 · 已落地 · 待核验 · 检索片段数 · 平均相关度。全部 mono + tabular-nums | **常驻**，不可折叠 |
| `AnswerBlock` | 回答正文 + 内联引用 chip `[3]`（`--aos-evidence-chip-height` 16px，`--aos-radius-sm`） | chip 键盘可聚焦 |
| `EvidenceCard` | 序号（mono，态色）/ 来源路径（mono `ellipsis`）/ 摘录（支撑句高亮）/ 溯源四件套 / 操作组 | hover → 抬升（`--aos-surface-raised` + `--aos-accent` 1px 描边） |
| `RelevanceMeter` | `--aos-evidence-relevance-width` 48px × 4px 细刻度条 + 数值（mono） | **不是进度条胶囊**，无圆角、无发光 |
| `ProvenanceLine` | 路径 + mtime + `sha256:` 前 8 位 + char offset 区间 | 四件套缺一不可 |
| `GateModeBadge` | **常驻**模式标记 | 与 trace 头同步 |
| `CiteChip` | 内联引用角标 | 见交互 |

## 交互
- **双向绑定高亮**：hover / focus 回答中的 `[3]` → 对应证据卡抬升 + 支撑句脉冲一次（180ms `--aos-motion-base`）；click → 滚动入视 + 焦点转移 + 展开上下文。反向：hover 证据卡 → 回答中对应 chip 高亮。
- **popover 在 focus 与 click 时都打开，不只 hover**（否则键盘用户拿不到）。
- **引文只高亮支撑句，不整块染色**：`--aos-accent-soft` 背景 + 1px `--aos-accent` 下边线。**禁止荧光块**。
- **六态验证阶梯**：检索中 → 已落地 → 预览（sheet：标题 + 摘录 + 1/N 分页）→ 审计（来源计数行）→ 质疑（单条来源「来源有误」）→ 已更新。
- 危险操作 `Flag misleading` 走后端反馈，**不改本地状态**。

## 断言态（四态，全部三通道：图标 + 文字 + 颜色）

| 态 | slot | 颜色 | 文字标签 |
|---|---|---|---|
| 已落地 Grounded | `evidence.verified` | `--aos-verified` | `Grounded` |
| 待核验 Unverified | `evidence.unverified` | `--aos-unverified`（琥珀，规则二） | `Unverified` |
| 已拒答 Refused | `evidence.refused` | `--aos-muted` | `Refused — no evidence` |
| 无据 No source | `evidence.failed` | `--aos-failed` | `No source` |

> `Refused` 用于 strict 模式下闸门**主动拦截**的断言——它与 `Unverified`（证据不完整）和 `No source`（无来源）是三种不同的风险，不得合并。文案源：`states-copy.md`。

## Evidence Gate 模式常驻标记（MASTER §10 强制）
- 位置：`EvidenceCountBar` 右侧，**始终渲染**，不依赖 hover / 展开。
- lenient 时整个计数行加 `--aos-unverified` 左内边框… **不行**（MASTER 禁 `border-left >1px`）→ 改用**整行浅底 + `gate.lenient` 槽 + 文字**。

## 五态

| 态 | 呈现 |
|---|---|
| Loading | 骨架 3 行 + `Searching 4 shards…`（分片数为真实计数） |
| Empty（索引未建） | `No index yet` / `Index a directory and evidence will be traceable to the character.` / `Copy command` → `agentos index ./docs` |
| Empty（检索无果） | `No chunks scored above 0.20` + `Lower the threshold` / `Reindex`（阈值来自真实配置） |
| Error（索引损坏） | `Index is unreadable` / `vector.idx failed checksum at block 1,204` / `Rebuild index` |
| Error（嵌入模型缺失） | `Embedding model not loaded` / `all-MiniLM-L6-v2 (90 MB) is not in ~/.aetheros/models` / `Download` + `Cancel`。**这是唯一允许的出站动作，必须显式告知** |
| Error（哈希不匹配） | `Source changed since indexing` / `docs/architecture.md differs from sha256:9f3c…` / `Show diff` + `Reindex`。用 `file.tampered` 槽 + `--aos-failed` |
| Populated | 见上方 ASCII |
| Edge（低置信） | `Low confidence — all chunks scored below 0.20. Treat this answer as ungrounded.` + `--aos-unverified` + 文字 |
| Edge（超长摘录） | 3 行截断 + `Expand` |

## 响应式
- `<1280px`：转为底部抽屉，Tab 切换，保留计数行与模式标记常驻。
- `<768px`：全屏 sheet；双向绑定高亮改为「点击 chip → 滚动到证据」，取消 hover 联动。

## 验收
- [ ] 计数行与模式标记**常驻**，非 hover 依赖
- [ ] 引文只高亮支撑句，非整块染色
- [ ] 溯源四件套齐全（路径 + mtime + sha256 + char offset）
- [ ] 四种断言态都是三通道，且文字标签真实存在于 DOM（屏幕阅读器可读）
- [ ] 琥珀**只**用于 `Unverified`，哈希不匹配用红色而非琥珀（规则二）
- [ ] chip 可键盘聚焦，popover 在 focus 时也打开
- [ ] 相似度用细刻度条 + 数值，不是进度条胶囊
