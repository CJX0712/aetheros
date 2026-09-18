# 提示词 4 — 实现本地模型与资源页

## 先读
`design-system/MASTER.md` · `design-tokens.css` · `screens/04-models-resources.md` · `states-copy.md` · `icon-semantics.md`

## 任务
实现 `/app/models`。这是「本地优先、零云端依赖」主张的**可信度锚点**——它必须说真话，包括说出唯一的例外。

## 布局
单列，三段由 **1px hairline 网格**分隔，**不是卡片**：
`TrustAnchorBar`（28px 常驻）→ `MetricStrip`（28px 单行）→ `ModelTable` → `ResourceChart`。

分隔用 `border-top: 1px solid var(--aos-border-soft)`。**不要用卡片包裹，不要嵌套卡片。**

## 关键实现点

**TrustAnchorBar**：`resource.offline` 槽 + `Local only · 0 outbound requests`，语义 `role="status"`。
可展开显示 24h 出站明细（目标主机 / 时间戳 / 触发原因）。**`0` 就是真实计数器，不写"暂无数据"。**

**MetricStrip**：**单行内联**，全部 mono + tabular-nums：
```
CPU 62% · RAM 4.1 / 16 GB · qwen2.5-7b-q4_K_M (3.2 GB resident) · 18.4 tok/s
```
**拒绝「大数字 + 小标签 + 辅助数据」的 SaaS 指标卡网格。** 这是全页最容易做错的地方——一旦做成 4 个卡片，整个页面就从「仪器面板」退化成「仪表盘模板」。

**ResourceMeter**：
```css
height: var(--aos-meter-height);        /* 6px */
background: var(--aos-meter-track);
/* 填充 */
background: var(--aos-meter-fill);      /* > 0.8 时切 --aos-meter-fill-critical */
```
- **不得用琥珀**（规则二把琥珀留给证据不完整）。超阈值用 `--aos-meter-fill-critical`（红）**且必须显示文字百分比**。
- 填充也**不得用青色**（本页不是 trace 面）。
- 无圆角胶囊、无发光。

**ResourceChart**：内联 SVG polyline，1.5px 描边，两条线（CPU / 内存）。**无填充渐变、无发光。**
容器必须预置 `aspect-ratio` 防 CLS。

**ThreadNote**：线程数输入旁注 —— `Small models are memory-bandwidth bound. More than 4 threads usually makes them slower.`
这是真实的工程结论（小模型受内存带宽限制），放在配置旁而不是藏进文档。**保留它**——工程师用户会立刻验证并因此信任产品。

**操作命名**：`Load` / `Unload`（**不是** Start / Stop，那是 run 的词汇）。

## 常驻模式标记（MASTER §10）
顶栏与 TrustAnchorBar 同行，**始终渲染**，不依赖 hover。lenient 用 `gate.lenient` 槽 + `--aos-unverified` 描边 + 文字。

## 五态
按 `screens/04-models-resources.md` §五态 实现，文案照抄 `states-copy.md`。重点两条：
- **Error（磁盘不足）**：`Not enough disk` / `qwen2.5-7b-q4_K_M needs 3.2 GB, 0.9 GB free` / `Choose smaller quant`。**数字真实**。
- **Error（推理崩溃）**：`Inference stopped` + `llama.cpp exited 2: tensor mismatch for blk.0.attn_norm`，原始错误用 `--aos-surface-inset` + mono。

**「下载模型」是产品唯一的出站动作**，必须显式告知：`Model download requires network access. This is the only outbound action aetheros performs.` 不能静默联网。

## 响应式
`<1024px`：MetricStrip 换两行，保持 mono 对齐。
`<768px`：模型表转纵向键值对列表；曲线降到 80px 高；操作收进 `action.more`。

## 交付前自检
- [ ] MetricStrip 是单行内联，**不是指标卡网格**
- [ ] 资源计无琥珀；超阈值用 `--aos-meter-fill-critical` + 文字百分比
- [ ] 资源计填充不是青色
- [ ] 信任锚常驻顶栏，`0 outbound` 是真实计数器
- [ ] 唯一出站动作被显式告知
- [ ] 线程数旁注存在
- [ ] 曲线无填充渐变、无发光；容器有 `aspect-ratio`
- [ ] 无卡片嵌套；分段用 1px hairline
