# 页面 4 — 本地模型与资源面板

> 这是「本地优先、零云端依赖」这一主张的**可信度锚点**。它必须说真话，包括说出唯一例外。
> 权威值见 `design-system/MASTER.md`；文案见 `states-copy.md`；图标槽见 `icon-semantics.md`。

## 页面：本地模型与资源
- **路由**：`/app/models`
- **寄存器**：Product ｜ **Density 7（驾驶舱）** ｜ Variance 5
- **色彩归属**：本页**不是** trace / 证据 / 来源面 → 青色**不得**用于资源计填充。**琥珀严禁出现**（规则二）。

## 布局
单列，三段由 **1px hairline 网格**分隔（**不是卡片**）：
`TrustAnchorBar`（顶栏常驻 28px）→ `MetricStrip`（28px 单行）→ `ModelTable` → `ResourceChart`。

```
┌──────────────────────────────────────────────────────────┐
│ [server] Local only · 0 outbound requests      [STRICT]   │ ← 信任锚 + 模式标记
├──────────────────────────────────────────────────────────┤
│ CPU 62% · RAM 4.1/16 GB · qwen2.5-7b-q4_K_M (3.2 GB)· 18.4 tok/s │ ← 单行 metric strip
├──────────────────────────────────────────────────────────┤
│ 名称 / 量化 / 大小 / 状态 / 上下文 / 平均 tok/s / 操作      │
├──────────────────────────────────────────────────────────┤
│ 实时资源曲线（SVG polyline，1.5px 描边）                    │
└──────────────────────────────────────────────────────────┘
```

## 核心组件

| 组件 | 规格 | 备注 |
|---|---|---|
| `TrustAnchorBar` | `resource.offline` 槽 + `Local only · 0 outbound requests`，可展开显示 24h 出站计数 | **全产品可信度锚点**，放持久顶栏而非 Hero 口号 |
| `GateModeBadge` | **常驻** strict / lenient 标记 | MASTER §10 |
| `MetricStrip` | `CPU 62% · RAM 4.1 / 16 GB · <model> (3.2 GB resident) · 18.4 tok/s`，**单行内联**，全部 mono + tabular-nums | **拒绝「大数字 + 小标签 + 辅助数据」的 SaaS 指标卡网格** |
| `ModelTableRow` | 名称 / 量化（mono）/ 大小 / 状态（dot + 文字）/ 上下文 / 平均 tok/s / 操作 | 数字列右对齐 |
| `ResourceMeter` | 6px 细条，轨道 `--aos-meter-track`，填充 `--aos-meter-fill`；> `0.8` 切 `--aos-meter-fill-critical` **且必须显示文字百分比** | 无圆角胶囊、无发光、**不用琥珀** |
| `ResourceChart` | 内联 SVG polyline，1.5px 描边，**无填充渐变、无发光**。两条线：CPU / 内存 | 容器预置 `aspect-ratio` 防 CLS |
| `ThreadNote` | 线程数输入 + 旁注 | 见下 |

## 工程洞察旁注（真实，不藏文档）
线程数旁注：`Small models are memory-bandwidth bound. More than 4 threads usually makes them slower.`
——放在配置旁，而不是藏进文档。这是工程师用户会立刻验证并因此信任产品的那类细节。

## 交互
- 加载 / 卸载模型：`Load` / `Unload`（**不是** Start / Stop），加载中显示真实进度 `Loading qwen2.5-7b-q4_K_M · 2.1 / 3.2 GB`。
- `Unload` 属破坏性但不丢数据 → `.aos-btn-secondary` + inline 确认，不用 modal。
- 出站请求计数可展开，展开后逐条列出（目标主机 / 时间戳 / 触发原因）。**0 就是 0，不写"暂无数据"。**

## 五态

| 态 | 呈现 |
|---|---|
| Loading | `Loading qwen2.5-7b-q4_K_M · 2.1 / 3.2 GB` + 6px meter。**无整页遮罩** |
| Empty | `No models installed` / `aetheros runs locally. Pull a model to make your first run.` / `Copy command` → `agentos pull qwen2.5-7b-q4_K_M` |
| Error（磁盘不足） | `Not enough disk` / `qwen2.5-7b-q4_K_M needs 3.2 GB, 0.9 GB free` / `Choose smaller quant`。**数字真实** |
| Error（推理崩溃） | `Inference stopped` / `llama.cpp exited 2: tensor mismatch for blk.0.attn_norm` / `Show log` + `Reload`。原始错误用 `--aos-surface-inset` + mono |
| Populated | 见 MetricStrip |
| Edge（资源告警） | `RAM at 91% — unload idle models?` / `Unload` + `Dismiss`。meter 切 `--aos-meter-fill-critical` + 文字 `91%`。**不用琥珀** |
| Edge（无外网） | `Model download requires network access. This is the only outbound action aetheros performs.` |

## 响应式
- `<1024px`：MetricStrip 换行为两行，仍保持 mono 对齐。
- `<768px`：模型表转纵向键值对列表；资源曲线降为 80px 高；操作收进 `action.more`。

## 验收
- [ ] MetricStrip 是**单行内联**，不是指标卡网格
- [ ] 资源计**绝对无琥珀**（规则二）；超阈值用 `--aos-meter-fill-critical` + 文字百分比
- [ ] 资源计填充不是青色（本页非 trace 面）
- [ ] 信任锚常驻顶栏，`0 outbound` 是真实计数器而非静态文案
- [ ] 唯一出站动作（模型下载）被显式告知
- [ ] 线程数旁注存在且是真工程结论
- [ ] 曲线无填充渐变、无发光；容器有 `aspect-ratio`
