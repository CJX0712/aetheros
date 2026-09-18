# aetheros

本地优先（local-first）的智能体运行时内核。默认**拒绝无来源的断言**，并把每一次失败变成下一次技能修订。

> **拒绝无来源的智能。** 每个断言必须能绑定到证据片段；拒绝低置信度"照样输出"的隐式路径。

## 核心特性（F1–F4）

| 功能 | 验收标准 | 说明 |
|------|----------|------|
| **F1** CPU 推理 sane defaults | AC-02 / 03 / 04 | 线程数自动推导并夹到 `[2, 4]`；一次性性能画像写入 `~/.aetheros/profile.json` |
| **F2** RRF 二次融合 + 对抗性不变量 | AC-06 / 07 / 08 | reranker 作为第三路信号以 `w = 0.5` 融合，全倒序注入仍保留首阶段冠军 |
| **F3** 全链路本地 trace | AC-09 / 10 / 13 | append-only + 哈希链防篡改；留存 ≥ 180 天；技能血缘可演进 |
| **F4** 证据闸门 Evidence Gate | AC-05 / 12 | 默认 strict：断言无证据锚点则拦截并暴露缺口；模式全程可见 |

外加 **AC-01 离线底线**：未配置 OTLP 导出端点时，全流程零出站请求（CI 在 offline-guard 下跑测试）。

## 架构

```
packages/core   —— 运行时内核（纯 TypeScript，仅依赖 node: 内置模块）
packages/cli    —— agentos 命令行入口
packages/demo   —— 零依赖单文件 HTML 演示（验证引擎与页面同源）
packages/ui     —— 界面层（Tabler 3.46.0 图标，单一图标源）
```

内核算法（RRF 融合 / 证据切片 / 哈希链）在浏览器与 Node 中**同一份代码**运行：演示页内嵌的 `agentos-engine` 脚本被 `scripts/verify-demo.mjs` 抽进无头沙箱执行，确保线上页面满足 AC-06/07/08/09/10。

## 设计纪律（P0 绝对规则）

- 禁止 emoji 作为功能图标 → 统一使用 Tabler 3.46.0，尺寸 16/20/24px，`stroke-width = 2`
- 禁止紫色→粉色渐变主视觉
- 禁止 AI 模板味图标（brain / sparkles / wand / robot / bot / stars 一律拉黑）
- 禁止硬编码颜色、禁止弹跳缓动、单文件 ≤ 300 行

## 安装与构建

```bash
pnpm install
pnpm build        # 构建 @aetheros/core 与 @aetheros/cli
pnpm verify       # 全门禁：lint + typecheck + build + offline test + demo 自检
```

## 使用

```bash
agentos version
agentos run --task "总结证据锚点" --lexical c3,c1,c5 --semantic c1,c3,c5 --strict
agentos bench      # 写入一次性性能画像
```

打开演示：

```bash
# 直接双击 packages/demo/index.html，或：
pnpm verify:demo   # 无头自检，全绿即通过
```

## 许可

MIT
