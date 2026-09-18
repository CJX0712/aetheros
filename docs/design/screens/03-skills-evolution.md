# 页面 3 — 技能库与自进化面板

> 这是产品「越用越好」这一主张的**唯一证据面**。数字必须真实，且必须能展示**变坏的候选**。
> 权威值见 `design-system/MASTER.md`；文案见 `states-copy.md`；图标槽见 `icon-semantics.md`。

## 页面：技能库与自进化
- **路由**：`/app/skills`（列表）、`/app/skills/:skillId`（谱系 + 评估）
- **寄存器**：Product ｜ **Density 7** ｜ **Variance 5**
- **色彩归属**：本页是 trace 相邻面但**不是** trace/证据/来源面 → 青色**仅**可用于当前选中项与主操作，且每屏 ≤2 处（MASTER §5 配额）。谱系节点与边**不得**用青色。

## 布局
两栏 Grid：`grid-template-columns: minmax(0,1fr) 420px`。
左栏：技能表（唯一滚动容器）。右栏：上方谱系 DAG，下方评估结果与操作组。

```
┌──────────────────────────────┬──────────────────────────────┐
│ 技能表 420                    │ 版本谱系（DAG）               │
│  名 / 版本 / sparkline / 调用 │  父 → 变异点 → 子（带 Δ）     │
│  次数 / 状态                  ├──────────────────────────────┤
│                              │ 评估：通过 39/42 · 回归 3      │
│                              │ [Promote] [Rollback] [Quarantine]│
└──────────────────────────────┴──────────────────────────────┘
```

## 核心组件

| 组件 | 规格 | 备注 |
|---|---|---|
| `SkillTableRow` | 技能名 / 版本（mono `v0.3.2`）/ 成功率 sparkline / 调用次数（mono）/ 状态标签 | 列可排序（成功率 / 调用数 / 最近使用） |
| `Sparkline` | 12 根 2px 条（`--aos-sparkline-*`），**无坐标轴、无颜色渐变** | 16px 高 |
| `LineageDAG` | 竖向谱系：父技能 → 变异点（prompt diff / 新增工具 / 参数调整）→ 子技能。节点 8px，边 1px `--aos-border`，淘汰节点虚线 `--aos-muted` | **不得用青色** |
| `DeltaBadge` | `Δ success +4.2pt` / `Δ latency −180ms` | 见下方 Δ 约定 |
| `ABDiffPanel` | 双栏 diff：add / del 行用 `color-mix(in srgb, var(--aos-verified\|failed) 10%, transparent)` 派生浅底 | 禁止裸 rgba/hex；**禁止彩色左边框**；深/浅两套主题下都必须成立 |
| `EvalResultCard` | 通过 / 失败计数 + 回归对比（vs 当前版本） | 数字来自真实对比 |
| `PromoteBar` | `Promote` / `Rollback` / `Quarantine` | Rollback / Quarantine 走 `.aos-btn-danger` + 二次确认 |

## Δ 标记约定（MASTER §11）
方向与好坏**正交**：
- `data-sign="up|down"` → 决定箭头（`state.delta_up` / `state.delta_down` 槽）
- `data-tone="good|bad|flat"` → 决定颜色（`--aos-verified` / `--aos-failed` / `--aos-muted`）
- 缺 `data-tone` 回退 `--aos-muted`（fail-safe）
- **绝不由 sign 推导颜色**：「Δ latency −180ms」是 down 却是好事，按 sign 上色会把性能优化标红。
- 同时必须附**有符号数字 + 文字**，不靠颜色单通道（P4）。

## 交互
- 选中技能 → 右栏谱系定位到当前世代（`--aos-accent` 描边标注当前节点）。
- **候选生成中**：进度 + `Abort` 按钮，可中止。
- **晋升 / 回滚二次确认**，确认文案复述具体后果：`Rollback will revert 142 recorded runs to v0.3.1 behavior.`
- 破坏性操作命名带版本号：`Rollback to v0.3.1`、`Discard candidate c-91f`——**不是** "Rollback" / "Discard"。

## 五态

| 态 | 呈现 |
|---|---|
| Loading（候选生成） | `Generating candidate 3 of 8…` + `Abort`，6px meter |
| Loading（评估中） | `Running eval set · 42 cases · 17 done`（计数器 mono） |
| Empty（无进化） | `No evolution yet` / `A skill needs 20 recorded runs before candidates are generated.` / `Run evaluation` |
| Empty（技能库） | `No skills recorded` / `Skills appear here after their first successful run.` |
| Error（评估失败） | `Evaluation failed` / `3 of 42 cases errored: tool timeout (2), OOM (1)` / `View cases` + `Retry`。**分类 + 计数，不笼统** |
| Error（晋升被拒） | `Candidate did not clear the bar` / `Success rate 61% vs current 68% (−7.0pt)` / `Keep as candidate` + `Discard`。数字来自真实对比 |
| Populated | `refactor-imports · v0.3.2 · 68% · 142 calls · stable` |
| Edge（超长 diff） | `+412 −298 lines` + `Expand full diff`，默认折叠 |
| Edge（候选过多） | `38 candidates · Showing 20 · Load more`，虚拟化 |

## 响应式
- `<1024px`：谱系改为可折叠区块置于表格上方（先看结论再看过程）。
- `<768px`：单列；diff 改为逐块切换而非并排。

## 验收
- [ ] Δ 值不靠颜色单通道，且带符号 + 文字
- [ ] Δ 颜色由 `data-tone` 决定，不由 `data-sign` 决定
- [ ] diff 无彩色左边框（用 10% 底色块）
- [ ] 谱系节点与边未使用青色（配额与归属）
- [ ] 破坏性按钮带版本号 + 二次确认复述后果
- [ ] **能展示变坏的候选**（晋升被拒态），不只展示成功案例
- [ ] 空态说清触发条件（≥20 次调用）
