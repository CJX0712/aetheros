# 提示词 5 — 实现单文件 Demo 与 README 首屏

## 先读
`design-system/MASTER.md` · `demo-engine-spec.md`（实现细节权威）· `landing-spec.md`（README 约束权威）· `screens/05-demo-landing.md` · `states-copy.md` · `icon-semantics.md` · `tabler-icon-manifest.md` §3（sprite 路径）

## 任务
实现 `aetheros/demo/index.html` —— **零依赖单文件 HTML**，`file://` 直接打开，Network 面板 **0 请求**。
以及 GitHub 仓库 README 首屏。

## 零依赖硬约束（逐条落实）

| 常规做法 | 必须改为 | 原因 |
|---|---|---|
| CDN 字体 | **纯系统字体栈**（`--aos-font-sans` / `--aos-font-mono` 已含完整回退） | 离线可渲染是产品信任基础 |
| 运行时图标库 | 内联 `<svg style="display:none">` + `<symbol id="i-*">`，引用 `<use href="#i-*">` | 单文件 + 0 请求 |
| 图表库 | 瀑布条 = div（`left%` / `width%`）；折线 = 内联 SVG `polyline`；meter / sparkline = div | 手写完全够，引库是纯负担 |
| CSS 框架 | 手写 CSS，全部 `var(--aos-*)` | 硬编码色值视为错误 |

**体积预算 ≤ 200 KB。**

## 布局（非对称 40 / 60，左对齐）
```css
display: grid;
grid-template-columns: 40% 60%;
```
左列左对齐：产品名 + 一行定位句 + 安装命令块（可复制）+ 「是什么 / 不是什么」两行。
右列：**真实可交互的 trace 控制台**（复用 `prompts/01-trace-waterfall.md` 的 SpanBar 实现，但只读、无 dock）。

定位句固定为：`Run agents on your own machine, and show the evidence for every claim they make.`

## 色彩归属（本页是 Brand 表面，最容易踩）
**页面级 CTA（安装 / 复制命令）必须用 `.aos-btn-cta`（反相中性 `--aos-fg` 底 + `--aos-bg` 字）。**
**不得使用青色** —— 青色只属于 trace / 证据 / 来源面（规则一）。控制台**内部**用青色是合规的，页面 CTA 不是。

## README 硬约束（GitHub 会清洗 HTML）
GitHub 剥离 `<style>` / `class` 与大部分 CSS，只留少量内联 `style` 与 `<img>` / `<kbd>` / `<details>` / `<table>`。
**结论：README 不能靠 CSS 好看，必须靠资产好看。**
- 视觉重量由自绘 SVG / 截图 / 录屏 GIF 承担。
- **所有图片必须不透明底**——GitHub 有明暗两套主题，透明底 PNG 必翻车。
- 徽章只用 shields.io 静态徽章（build / coverage / npm version / license）。**不放 stars / downloads / contributors 虚荣徽章。**
- 不用大量 `<img align="right">` 拼布局（移动端会塌）。
- 版块顺序按 `landing-spec.md` §2。

## 内容硬要求

**必须展示未落地证据。** 三条证据里**第三条故意是低分且 Unverified**：
```
[3] docs/notes.md  #chunk-1  0.19  sha256:77aa41…  12–88   ← Unverified
```
能展示「它也会告诉你哪些没根据」，比三个全绿更能建立信任。这是可审计产品最诚实的自我展示。

**本地优先声明带可自查命令**：
```
Local only
  · 0 outbound requests（唯一例外：显式执行 agentos pull 下载模型）
  · 自查：agentos audit --outbound   →   outbound requests (24h): 0
```

**演示数据真实感**：`12.4s` / `3,412 tok` / `18.4 tok/s` / `0.81` / `~/.aetheros/models` / `2026-09-18` / `1284–1402`。
不用 `10s` / `100` / `0.50`。**零虚构指标。**

## 动效
**只允许一处编排**：首屏控制台点亮一次（span 条依次淡入，总计 ≤500ms，一次性，不循环，不随滚动重复）。
其余全部静态。**禁止**每节 fade-on-scroll。`prefers-reduced-motion` 下取消。

## 响应式
`<1024px` 变 50/50；`<768px` **回退单列**（Variance 8 的移动端覆盖规则），控制台降为可横向滚动的窄版。

## 交付前自检
- [ ] `file://` 打开，Network 面板 **0 请求**
- [ ] 组件里无 `#xxxxxx`（除 `#fff`/`#000`）、无 `Icon[A-Z]`、无 `agent-os`
- [ ] 页面级 CTA 是 `.aos-btn-cta`，**不是青色**
- [ ] 首屏非居中口号 Hero；右侧是真实运行数据
- [ ] 无 "Trusted by" / "10,000+ users" / "99.9%" / "Welcome to" / "seamless"
- [ ] 至少一处 Unverified / 低置信证据
- [ ] README 图片全部不透明底
- [ ] 无 `01 · 02 · 03` 编号脚手架
- [ ] 仅一处编排动效，reduced-motion 下取消
- [ ] 零 emoji；图标全部来自内联 sprite，无第二套图标库
- [ ] CLS < 0.1（图形容器预置 `aspect-ratio` 或固定高度）
