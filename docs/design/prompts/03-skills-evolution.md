# 提示词 3 — 实现技能库与自进化页

## 先读
`design-system/MASTER.md` · `design-tokens.css` · `screens/03-skills-evolution.md` · `states-copy.md` · `icon-semantics.md`

## 任务
实现 `/app/skills`（列表）与 `/app/skills/:skillId`（谱系 + 评估）。
这是产品「越用越好」主张的**唯一证据面**——数字必须真实，且**必须能展示变坏的候选**。

## 布局
```css
display: grid;
grid-template-columns: minmax(0,1fr) 420px;
```
左栏技能表（唯一滚动容器）；右栏上方谱系 DAG，下方评估结果与操作组。

## 关键实现点

**颜色归属**：本页**不是** trace / 证据 / 来源面。
青色**仅**可用于当前选中项与主操作，且每屏 ≤2 处。**谱系节点与边不得用青色**——用 `--aos-border` 与 `--aos-muted`。
**琥珀在本页不得出现**（规则二只允许它标注证据不完整）。

**Sparkline**：12 根 2px 条（`--aos-sparkline-bar-width` / `bar-gap`），16px 高，**无坐标轴、无颜色渐变**。

**LineageDAG**：竖向谱系，父 → 变异点 → 子。节点 8px，边 1px，淘汰节点用虚线 + `--aos-muted`。当前世代用 `--aos-accent` 描边。

**Δ 标记（MASTER §11 强制）**：方向与好坏正交，**两个独立属性**。
```html
<span class="aos-delta" data-sign="down" data-tone="good">▼ 180ms</span>
```
- `data-sign="up|down"` → 箭头（`state.delta_up` / `state.delta_down` 槽）
- `data-tone="good|bad|flat"` → 颜色（`--aos-verified` / `--aos-failed` / `--aos-muted`）
- 缺 `data-tone` 回退 `--aos-muted`
- **绝不要用 `data-sign` 推导颜色。**「Δ latency −180ms」是 down 却是好事，按 sign 上色会把性能优化标成红色。
- 必须同时附**有符号数字 + 文字**，不靠颜色单通道。

**ABDiffPanel**：add / del 行用**从 token 派生的浅底**，不写裸色值：
```css
.aos-diff-add { background: color-mix(in srgb, var(--aos-verified) 10%, transparent); }
.aos-diff-del { background: color-mix(in srgb, var(--aos-failed) 10%, transparent); }
```
**禁止彩色左边框**（`border-left` 任何宽度都不允许做强调）。
**禁止裸 rgba / hex** —— 深色与浅色两套主题下必须同时成立，只有从 token 派生才能做到。

## 危险操作
`.aos-btn-danger`（transparent + 1px `--aos-failed` 描边 / `--aos-failed` 文字）+ **二次确认**。
命名必须带版本号：`Rollback to v0.3.1`、`Discard candidate c-91f`。**不是** "Rollback" / "Discard"。
确认弹窗复述具体后果：`Rollback will revert 142 recorded runs to v0.3.1 behavior.`

## 五态
按 `screens/03-skills-evolution.md` §五态 实现，文案照抄 `states-copy.md`。重点两条：
- **Error（晋升被拒）**：`Candidate did not clear the bar` / `Success rate 61% vs current 68% (−7.0pt)` / `Keep as candidate` + `Discard`。
  **这条必须有**——只展示成功案例的自进化面板是不可信的，产品必须能承认候选变差了。
- **Empty**：说清触发条件 —— `A skill needs 20 recorded runs before candidates are generated.` + `Run evaluation`。

## 响应式
`<1024px`：谱系改为可折叠区块置于表格**上方**（先看结论再看过程）。
`<768px`：单列；diff 改为逐块切换而非并排。

## 交付前自检
- [ ] Δ 由 `data-tone` 决定颜色，不由 `data-sign`
- [ ] Δ 带符号数字 + 文字，非颜色单通道
- [ ] diff 无彩色左边框（用 10% 底色块）
- [ ] 谱系节点与边未使用青色
- [ ] 本页无琥珀
- [ ] 破坏性按钮带版本号 + 二次确认复述后果
- [ ] 晋升被拒态已实现（能展示变坏的候选）
- [ ] 空态说清触发条件（≥20 次调用）
