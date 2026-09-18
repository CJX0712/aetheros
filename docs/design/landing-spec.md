# AetherOS — GitHub 落地页 / README 视觉规格

> 寄存器：**Brand**（这是唯一的设计即产品的表面；`/app` 是 Product 寄存器）。
> 三轴覆盖：Variance **8**（非对称）/ Motion **2** / Density **5**。
> 视觉源 `DESIGN.md`；文案源 `states-copy.md`。**零虚构指标。**

---

## 1. GitHub README 的硬约束（先读，决定一切）

GitHub 会清洗 README 里的 HTML：`<style>` 标签、`class` 属性、大部分 CSS 属性全部被剥离，只剩下有限的内联 `style`（`color`、`font-size`、`text-align`、`width`、`align` 等少数）和 `<img>` / `<kbd>` / `<details>` / `<table>` 等少数标签。

**结论：README 不能靠 CSS 好看，必须靠资产好看。**

- 视觉重量由**自绘 SVG / 截图 / 录屏 GIF** 承担，不由排版 hack 承担。
- 禁止用大量 `<img align="right">` 拼布局——在移动端 GitHub 上会塌。
- 深色为主：GitHub 有明暗两套主题，图片必须**在两种背景下都可读**。规则：所有截图与 SVG 用**不透明背景**（`--aos-bg` 或 `--aos-surface`），不要用透明底 PNG。这是 README 里最常犯的错。
- 徽章：只用 shields.io 静态徽章（体积 / 构建 / 许可），**不放** "stars / downloads / contributors" 这类虚荣徽章。

---

## 2. 版块顺序（README 主文件）

```
1  一行定位 + 一行能力边界      ← 不写口号，写清楚它是什么、不是什么
2  真实终端录屏（GIF / SVG）     ← 首屏必须是真实运行，不是架构图
3  安装（三行命令块）            ← 复制即走
4  四仓库如何合体（一张 SVG 图）  ← aetherflow / glassbox / evolver / aurora
5  可验证 RAG：证据链示例        ← 真实 sha256 + char offset，不是示意图
6  自进化：一次真实 Δ diff       ← 带具体数字
7  本地优先声明                  ← 出站请求 0，可自查
8  快速上手 / 目录结构 / 贡献
9  许可
```

**禁止**：居中的「大标题 + 副标题 + CTA + 抽象 3D 图形」；"Welcome to"；"Trusted by" 条；虚构数字。

---

## 3. 首屏（反千篇一律 Hero）

**非对称 40 / 60，左对齐**（Variance 8）：

- **左 40%**：产品名 + 一行定位句 + 安装命令块（可复制）+ 两行「是什么 / 不是什么」。
- **右 60%**：**真实可交互的 trace 控制台**（不是截图，是能点开 span、能看证据链的实例）。若载体不支持交互（README 场景），退化为一张**真实运行的静态截图**——但必须带真实数据：`run-8f3c1a · 12.4s · qwen2.5-7b · 3,412 tok`。

定位句写法（具体动词 + 具体对象，不用空洞修饰）：
`Run agents on your own machine, and show the evidence for every claim they make.`

**不是**：`A next-generation seamless agent operating system.`

---

## 4. 四仓库合体图（品牌资产，必须手绘 SVG）

一张横向图，四个模块 → 一个内核。要求：

- 用 `--aos-span-*` 五色区分四个来源（aetherflow / glassbox / evolver / aurora），**不是彩虹渐变**。
- 每个模块旁标注它贡献的具体能力，写能力不写形容词：`runtime` / `verifiable retrieval` / `self-improvement` / `local autonomy`。
- **编号禁止**：不出现 `01 · 02 · 03` 这类 AI 脚手架标记。
- 深色底 + 不透明背景，GitHub 明暗主题下都可读。

---

## 5. 可验证 RAG 示例（README 里最能建立信任的一段）

展示真实产物，不是示意图：

```
Answer: 证据链以 char offset 锚定到原文，因此任意一句断言都可回溯。

Evidence 3 · Grounded 2 · Unverified 1 · mean relevance 0.62
[1] docs/architecture.md #chunk-3   0.81   sha256:9f3c1a…   1284–1402
[2] docs/glassbox.md     #chunk-7   0.74   sha256:1d80be…    402–519
[3] docs/notes.md        #chunk-1   0.19   sha256:77aa41…     12–88   ← Unverified
```

要点：**第三个故意是低分且未落地**。能展示「它也会告诉你哪些没根据」，比展示三个全绿更能建立信任。这是可审计产品最诚实的一次自我展示。

---

## 6. 本地优先声明（可自查，不靠口号）

不写「我们重视隐私」，写**可验证的事实 + 自查命令**：

```
Local only
  · 推理、检索、进化全部在本机完成
  · 0 出站请求（唯一例外：显式执行 `agentos pull` 下载模型）
  · 自查：agentos audit --outbound   →   outbound requests (24h): 0
```

---

## 7. 独立落地页（仓库外，不受 GitHub 清洗限制）

若有独立站点（GitHub Pages / 自定义域）：

- 沿用 §3 的非对称首屏，右侧为**完整可交互 demo**（即 `demo-engine-spec.md` 描述的引擎）。
- 下方三栏展示真实产物：真实 trace 片段 / 真实证据链 JSON / 真实自进化 diff。**三个都带真实文件与真实数字。**
- 允许**一处**精心编排的入场动效（首屏控制台点亮），其余全部静态。Brand 寄存器允许一次编排，Product 寄存器不允许——这里是 Brand，可以用一次，只能用一次。
- OG 图 1200×630：不透明 `--aos-bg` 底 + 一行定位句 + 一行真实命令。**不放 logo 墙、不放渐变光晕。**

---

## 8. 验收（P0）

- [ ] 无居中口号 Hero；首屏含真实运行数据
- [ ] 零虚构指标（无 stars 徽章、无 "10,000+ users"、无 "99.9%"）
- [ ] 无 "Welcome to" / "seamless" / "next-generation" / "empower"
- [ ] 所有图片不透明底，GitHub 明/暗主题下均可读
- [ ] 无紫→粉渐变；无 emoji 作图标
- [ ] 无 `01 · 02 · 03` 编号脚手架
- [ ] 至少一处展示「未落地 / 低置信」证据（诚实性检查）
- [ ] 本地优先声明带可自查命令
