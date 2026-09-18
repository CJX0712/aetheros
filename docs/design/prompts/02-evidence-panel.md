# 提示词 2 — 实现证据链面板

## 先读
`design-system/MASTER.md` · `design-tokens.css` · `screens/02-evidence-panel.md` · `states-copy.md` · `icon-semantics.md`

## 任务
实现 `EvidencePanel`。**同一个组件，两种容器**：trace 页右栏 360px 常驻，以及独立页 `/app/runs/:runId/evidence`。不要写两份。

## 布局
纵向 Flex：`EvidenceCountBar`（固定 32px，**不可折叠**）→ `AnswerBlock` → `EvidenceList`（唯一滚动容器）。

## 关键实现点

**计数行常驻**：`Evidence 7 · Grounded 5 · Unverified 2 · 12 chunks · mean relevance 0.62`。
这是可审计性的第一入口，永远可见。全部 mono + tabular-nums。

**引文高亮**：只高亮**支撑句**，不整块染色。
```css
background: var(--aos-accent-soft);        /* rgba(60,207,193,.12) */
border-bottom: 1px solid var(--aos-accent);
```
**禁止荧光块。**

**溯源四件套**（缺一不可，全 mono）：来源路径（`ellipsis`）+ mtime + `sha256:` 前 8 位 + char offset 区间（如 `1284–1402`）。

**相似度**：48px × 4px 细刻度条 + 数值（mono）。**不是进度条胶囊**——无圆角、无发光。

**双向绑定高亮**：
- hover / **focus**（不只是 hover）回答中的 `[3]` chip → 对应证据卡抬升（bg `--aos-surface-raised` + 1px `--aos-accent` 描边）+ 支撑句脉冲一次（180ms）
- click → 滚动入视 + 焦点转移 + 展开上下文
- 反向：hover 证据卡 → 回答中对应 chip 高亮
- **chip 必须键盘可聚焦**；popover 在 focus 与 click 时都打开。只靠 hover = 键盘用户拿不到内容。

## 断言四态（全部三通道：图标 + 文字 + 颜色）

| 态 | 语义槽 | 颜色 token | 文字标签 |
|---|---|---|---|
| Grounded | `evidence.verified` | `--aos-verified` | `Grounded` |
| Unverified | `evidence.unverified` | `--aos-unverified` | `Unverified` |
| Refused | `evidence.refused` | `--aos-muted` | `Refused — no evidence` |
| No source | `evidence.failed` | `--aos-failed` | `No source` |

**这四态不得合并**：`Refused` 是 strict 闸门主动拦截，`Unverified` 是证据不完整，`No source` 是无来源。三者风险不同。
**文字标签必须真实存在于 DOM**（不能只在 tooltip 里），否则屏幕阅读器读不到。

**琥珀只归 `Unverified`。** 哈希不匹配用 `file.tampered` + `--aos-failed`（红），**不用琥珀**（MASTER 规则二）。

## 常驻模式标记（MASTER §10）
`EvidenceCountBar` 右侧始终渲染。lenient 时用**整行浅底** + `gate.lenient` 槽 + 文字。
**禁止用 `border-left` / `border-right` 做强调**（>1px 违规）。

## 五态
按 `screens/02-evidence-panel.md` §五态 实现，文案照抄 `states-copy.md`。三个 Error 态都要：
- 索引损坏：`Index is unreadable` + `vector.idx failed checksum at block 1,204` + `Rebuild index`
- 嵌入模型缺失：`all-MiniLM-L6-v2 (90 MB) is not in ~/.aetheros/models` + `Download` / `Cancel`
- **哈希不匹配**：`Source changed since indexing` + `docs/architecture.md differs from sha256:9f3c…` + `Show diff` / `Reindex`

「下载模型」是**产品唯一的出站动作**，必须在 UI 上显式告知，不能静默联网。

## 六态验证阶梯
检索中 → 已落地 → 预览（sheet：标题 + 摘录 + 1/N 分页）→ 审计（来源计数行）→ 质疑（单条来源「来源有误」）→ 已更新。
「来源有误」只上报后端，**不改本地状态**。

## 交付前自检
- [ ] 计数行与模式标记常驻，非 hover 依赖
- [ ] 引文只高亮支撑句；无荧光块
- [ ] 溯源四件套齐全
- [ ] 四态三通道，文字标签在 DOM 里
- [ ] 琥珀只用于 Unverified；哈希不匹配用红色
- [ ] chip 键盘可聚焦，popover 在 focus 时也打开
- [ ] 无一处置用 `border-left` 强调
