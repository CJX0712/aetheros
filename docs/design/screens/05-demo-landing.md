# 页面 5 — 单文件 Demo / README 首屏

> 双形态交付里的 F5。**零依赖单文件 HTML**，`file://` 直接打开，Network 面板 0 请求。
> 这是全项目唯一的 Brand 表面：允许一次精心编排，且**只允许一次**。
> 权威值见 `design-system/MASTER.md`；实现细节见 `demo-engine-spec.md`；README 约束见 `landing-spec.md`。

## 页面：单文件 Demo / README 首屏
- **路由**：`aetheros/demo/index.html`（本地文件）+ GitHub 仓库 README 首屏
- **寄存器**：**Brand（唯一）** ｜ **Variance 8**（非对称）｜ Motion 2 ｜ Density 5
- **色彩归属**：本页**含 trace 面板** → 面板内部青色合规；但**页面级 CTA 必须用 `.aos-btn-cta`（反相中性）**，不得用青色（规则一）

## 布局（非对称 40 / 60，左对齐）

```
┌───────────────────────┬──────────────────────────────────┐
│ 左 40%                │ 右 60%                            │
│ 产品名                │ 真实可交互 trace 控制台           │
│ 一行定位句（左对齐）   │  · span 瀑布（可点开）            │
│ 安装命令块（可复制）   │  · 证据链面板（真实 sha256）      │
│ 是什么 / 不是什么      │  · 模式标记常驻                   │
└───────────────────────┴──────────────────────────────────┘
```

定位句（具体动词 + 具体对象，不用空洞修饰）：
`Run agents on your own machine, and show the evidence for every claim they make.`
**不是**：`A next-generation seamless agent operating system.`

## 核心组件

| 组件 | 规格 | 备注 |
|---|---|---|
| `HeroAsym` | Grid `40% 60%`，左列左对齐，**无居中** | Variance 8 |
| `InstallBlock` | 命令块 + 复制按钮（`action.copy` 槽），`--aos-surface-inset` 底 + mono | **`.aos-btn-cta` 反相中性** |
| `LiveTraceConsole` | 内联 sprite + 原生 JS 渲染的真实 trace（见 `demo-engine-spec.md` §3–§5） | 可点开 span、看证据链 |
| `WhatItIs / WhatItIsNot` | 各一行，具体而非形容词 | `是什么`：本地优先运行时 + 证据闸门 + 自进化。`不是什么`：不是云服务、不需要 API key、不需要 GPU |
| `RealArtifactTrio` | 三栏：真实 trace 片段 / 真实证据链 JSON / 真实自进化 diff | 三个都带真实文件与真实数字 |
| `EvidenceSample` | 三条证据，**第三条故意是低分且 Unverified** | 诚实性检查点 |

## README 硬约束（GitHub 会清洗 HTML）
GitHub 会剥离 `<style>`、`class` 与大部分 CSS，只留少量内联 `style` 与 `<img>` / `<kbd>` / `<details>` / `<table>`。
**结论：README 不能靠 CSS 好看，必须靠资产好看。**

- 视觉重量由自绘 SVG / 截图 / 录屏 GIF 承担。
- **所有图片必须不透明底**（`--aos-bg` 或 `--aos-surface`）——GitHub 有明暗两套主题，透明底 PNG 必翻车。
- 徽章只用 shields.io 静态徽章（build / coverage / npm version / license）。**不放 stars / downloads / contributors 虚荣徽章。**
- 不用大量 `<img align="right">` 拼布局（移动端会塌）。

## 允许的唯一编排动效
首屏控制台**点亮一次**（例如 span 条依次淡入，总计 ≤500ms，一次性，不循环，不随滚动重复）。
其余全部静态。`prefers-reduced-motion` 下取消。**禁止**每节 fade-on-scroll。

## 五态（Demo 内嵌面板同样要覆盖）

| 态 | 呈现 |
|---|---|
| Loading | 静默光标 + 6 行骨架；>3s 补加载文案 |
| Empty | `No runs yet` + `agentos run "your task"` 可复制 |
| Error | 四类分类错误，就近显示 |
| Populated | 真实运行数据 `run-8f3c1a · 12.4s · 3,412 tok` |
| Edge | 低置信证据明示 `Treat this answer as ungrounded.` |

## 响应式
- `<1024px`：40/60 变 50/50，控制台缩略。
- `<768px`：**回退单列**（Variance 8 的移动端覆盖规则）；控制台降为静态截图或可横向滚动的窄版。

## 验收
- [ ] `file://` 打开，Network 面板 **0 请求**
- [ ] 首屏非居中口号 Hero；右侧是真实运行数据
- [ ] 页面级 CTA 用 `.aos-btn-cta`，**不是青色**
- [ ] 无虚构指标（无 "Trusted by"、无 "10,000+ users"、无 "99.9%"）
- [ ] 无 "Welcome to" / "seamless" / "next-generation" / "empower"
- [ ] 至少一处展示 Unverified / 低置信证据
- [ ] README 所有图片不透明底，明暗主题下均可读
- [ ] 无 `01 · 02 · 03` 编号脚手架
- [ ] 仅一处编排动效，`prefers-reduced-motion` 下取消
- [ ] 零 emoji；图标全部来自内联 sprite；无第二套图标库
