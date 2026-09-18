# 页面级 Override

本目录存放**页面级设计覆盖**，只写与 `../MASTER.md` 不同的字段。

## 规则

1. **只写差异**，不复制 MASTER 内容。
2. 每条 Override 必须写明**原因**，否则无法判断何时可以撤销。
3. 命名与 `../../screens/` 一一对应：`01-trace-waterfall.md`、`02-evidence-panel.md`、`03-skills-evolution.md`、`04-models-resources.md`、`05-demo-landing.md`。
4. 检索顺序：读 `MASTER.md` → 检查本目录同名文件 → 存在则覆盖对应字段。

## 当前覆盖清单

| 页面 | 覆盖项 | 原因 |
|---|---|---|
| `05-demo-landing.md` | 三轴刻度改为 Variance **8** / Motion **2** / Density **5**（MASTER 为 5 / 3 / 7） | 该页是全项目唯一 Brand 表面，需要非对称与更低密度；其余页面保持 Product 刻度 |
| `05-demo-landing.md` | 允许**一处**编排动效（首屏控制台点亮） | Brand 寄存器允许一次精心编排，Product 寄存器不允许。仅此一页、仅此一处 |

## 尚未覆盖的页面

`01`–`04` 目前完全继承 MASTER，无需 Override 文件。

> 人类可读的完整页面规格在 `../../screens/`；本目录只负责"哪些字段被页面级改写了"这一件事。
