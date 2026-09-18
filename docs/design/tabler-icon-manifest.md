# Tabler Icons 内联清单（AetherOS）

> 版本：**Tabler Icons 3.46.0** · 许可：**MIT** · 数量：**6184**（outline 5130 + filled 1054）
> 栅格：**24 × 24** · 默认描边：**2px** · 端点是 round cap / round join
> 路径来源：Iconify `tabler` 集合（与上游 SVG 一致，已去除外层 `<svg>`，仅保留 `body`）

## 1. 使用规范

| 项 | 规则 |
|---|---|
| 唯一图标库 | Tabler Icons。**全项目不得出现第二套图标库** |
| 尺寸 | 仅 16 / 20 / 24px |
| 描边宽度 | **`ICON_STROKE = 2` 单一常量（24 网格用户单位）。禁止按尺寸预计算** → 见下方「描边宽度（已更正）」 |
| 颜色 | 一律 `currentColor`，由 `var(--aos-*)` 控制。禁止 inline 色值 |
| active / selected 态 | 优先用 **filled 变体**；filled 集里没有的，用「outline + `--aos-accent` 描边」。**filled 永不替代文字标签（P4）** |
| 组件引用方式 | **组件只引用语义槽，禁止引用图标名** → 见 `icon-semantics.md` |
| 纯图标按钮 | 必须带 `aria-label` + tooltip |
| emoji | **零容忍**。功能图标、状态图标、空状态图标全部由 Tabler 承担 |

### 描边宽度（已更正）

**本表曾写作「= size / 12」→ 16px 用 1.33、20px 用 1.67。该规则已作废**（终裁见 `design-system/MASTER.md` §9）。

原因：SVG 的 `viewBox` 会把用户单位二次缩放。按尺寸预计算出的 `1.33` 被 viewBox 再乘一次，16px 图标实际**变粗**，与意图相反。
正确做法：单一常量 `ICON_STROKE = 2`，无论渲染成 16 / 20 / 24px 都保持正确光学重量。

```css
/* 更正后的实现。注意不要再写 --ic-sw 的尺寸分支 */
.aos-ic { width: 20px; height: 20px; fill: none; stroke: none; }
.aos-ic * { stroke-width: 2; }          /* ICON_STROKE，单一常量 */
.aos-ic-16 { width: 16px; height: 16px; }
.aos-ic-20 { width: 20px; height: 20px; }
.aos-ic-24 { width: 24px; height: 24px; }
```

### CSS 覆盖描边（关键实现细节）

Tabler 的 path 上带 `stroke-width="2"` 表现属性。CSS **类选择器优先级高于表现属性**，所以必须这样覆盖：

```css
.aos-ic { width: 20px; height: 20px; fill: none; stroke: none; }
.aos-ic * { stroke-width: var(--ic-sw, 2); }
.aos-ic-16 { width: 16px; height: 16px; --ic-sw: 1.33; }
.aos-ic-20 { width: 20px; height: 20px; --ic-sw: 1.67; }
.aos-ic-24 { width: 24px; height: 24px; --ic-sw: 2; }
```

根元素写 `fill: none; stroke: none` 是安全的：filled 变体的 path 自带 `fill="currentColor"` 表现属性，不会被继承覆盖。

## 2. 语义映射

| 语义 | outline | filled | sprite id | 说明 |
|---|---|---|---|---|
| 运行 / 执行 | `IconPlayerPlay` | `IconPlayerPlayFilled` | `i-player-play` / `i-player-play-filled` | filled 用于 active |
| 停止 / 中止 | `IconPlayerStop` | `IconPlayerStopFilled` | `i-player-stop` / `i-player-stop-filled` | |
| 重放 | `IconRestore` | — | `i-restore` | 无 filled → accent 描边 |
| 检索 | `IconSearch` | — | `i-search` | |
| 工具调用 | `IconTool` | **无** | `i-tool` | filled 集中不存在 → 回退规则 |
| 推理 / LLM | `IconCpu` | **无** | `i-cpu` | **原 `IconBrain` 已拉黑**（AI 模板味）。语义槽 `model.local` |
| 提示与响应 | `IconMessage` | — | `i-message` | 语义槽 `model.prompt`。**不得用 `IconBrain`** |
| 证据 / 引用 | `IconQuote` | `IconQuoteFilled` | `i-quote` / `i-quote-filled` | |
| 已核验 | `IconCircleCheck` | `IconCircleCheckFilled` | `i-circle-check` / `i-circle-check-filled` | |
| 待核验 / 证据不完整 | `IconCircleDashed` | — | `i-circle-dashed` | 配 `--aos-unverified` |
| 未落地 / 无据 | `IconAlertTriangle` | `IconAlertTriangleFilled` | `i-alert-triangle` / `i-alert-triangle-filled` | |
| 失败 | `IconCircleX` | `IconCircleXFilled` | `i-circle-x` / `i-circle-x-filled` | |
| 技能 / 自进化谱系 | `IconBinaryTree2` | — | `i-binary-tree-2` | |
| 本地 / 离线运行 | `IconServer` | — | `i-server` | 顶栏信任锚 |
| 模型 / CPU | `IconCpu` | **无** | `i-cpu` | filled 集中不存在 → 回退规则 |
| 时间线 / trace | `IconTimeline` | — | `i-timeline` | |
| 终端 | `IconTerminal2` | — | `i-terminal-2` | |
| 复制 | `IconCopy` | — | `i-copy` | |
| 导出 | `IconDownload` | — | `i-download` | |
| 过滤 | `IconFilter` | — | `i-filter` | |
| 折叠 / 展开 | `IconChevronRight` / `IconChevronDown` | — | `i-chevron-right` / `i-chevron-down` | |
| 回滚 / 恢复 | `IconRestore` | — | `i-restore` | |
| 设置 | `IconSettings` | — | `i-settings` | |
| 关闭 | `IconX` | — | `i-x` | |
| diff / 对比 | `IconFileDiff` | — | `i-file-diff` | |
| 历史 | `IconHistory` | — | `i-history` | |
| 包 / 模块 | `IconPackage` | — | `i-package` | |
| 可验证性校验 | `IconShieldCheck` | — | `i-shield-check` | |
| 上升 / 下降 | `IconArrowUp` / `IconArrowDown` | — | `i-arrow-up` / `i-arrow-down` | Δ 值辅助符号 |
| 刷新 | `IconRefresh` | — | `i-refresh` | |
| 时钟 / 耗时 | `IconClock` | `IconClockFilled` | `i-clock` / `i-clock-filled` | |

## 3. 路径清单（可直接粘贴进 `<symbol>`）

> 已按 Iconify `body` 原样保留。**单文件 Demo 中这些已内联为 SVG sprite**（`aetheros/demo/index.html` 顶部）。
> TS 工程建议从 `@tabler/icons-react` 按需引入；只有零依赖单文件场景才内联。

```html
<symbol id="i-player-play" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16l13-8z"/></symbol>
<symbol id="i-player-play-filled" viewBox="0 0 24 24"><path fill="currentColor" d="M6 4v16a1 1 0 0 0 1.524.852l13-8a1 1 0 0 0 0-1.704l-13-8A1 1 0 0 0 6 4"/></symbol>
<symbol id="i-player-stop" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/></symbol>
<symbol id="i-player-stop-filled" viewBox="0 0 24 24"><path fill="currentColor" d="M17 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0-14 0m18 11l-6-6"/></symbol>
<symbol id="i-tool" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 10h3V7L6.5 3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1-3 3l-6-6a6 6 0 0 1-8-8z"/></symbol>
<!-- i-brain 已移除：AI 模板味图标，永不使用。本地推理走 i-cpu，提示响应走 i-message -->
<symbol id="i-quote" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6q0 4-4 5m13-7h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6q0 4-4 5"/></symbol>
<symbol id="i-quote-filled" viewBox="0 0 24 24"><path fill="currentColor" d="M9 5a2 2 0 0 1 2 2v6c0 3.13-1.65 5.193-4.757 5.97a1 1 0 1 1-.486-1.94C7.984 16.473 9 15.203 9 13v-1H6a2 2 0 0 1-1.995-1.85L4 10V7a2 2 0 0 1 2-2zm9 0a2 2 0 0 1 2 2v6c0 3.13-1.65 5.193-4.757 5.97a1 1 0 1 1-.486-1.94C16.984 16.473 18 15.203 18 13v-1h-3a2 2 0 0 1-1.995-1.85L13 10V7a2 2 0 0 1 2-2z"/></symbol>
<symbol id="i-circle-check" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0"/><path d="m9 12l2 2l4-4"/></g></symbol>
<symbol id="i-circle-check-filled" viewBox="0 0 24 24"><path fill="currentColor" d="M17 3.34a10 10 0 1 1-14.995 8.984L2 12l.005-.324A10 10 0 0 1 17 3.34m-1.293 5.953a1 1 0 0 0-1.32-.083l-.094.083L11 12.585l-1.293-1.292l-.094-.083a1 1 0 0 0-1.403 1.403l.083.094l2 2l.094.083a1 1 0 0 0 1.226 0l.094-.083l4-4l.083-.094a1 1 0 0 0-.083-1.32"/></symbol>
<symbol id="i-circle-dashed" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.56 3.69a9 9 0 0 0-2.92 1.95M3.69 8.56A9 9 0 0 0 3 12m.69 3.44a9 9 0 0 0 1.95 2.92m2.92 1.95A9 9 0 0 0 12 21m3.44-.69a9 9 0 0 0 2.92-1.95m1.95-2.92A9 9 0 0 0 21 12m-.69-3.44a9 9 0 0 0-1.95-2.92m-2.92-1.95A9 9 0 0 0 12 3"/></symbol>
<symbol id="i-alert-triangle" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m-1.637-9.409L2.257 17.125a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636-2.87L13.637 3.59a1.914 1.914 0 0 0-3.274 0M12 16h.01"/></symbol>
<symbol id="i-alert-triangle-filled" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.67c.955 0 1.845.467 2.39 1.247l.105.16l8.114 13.548a2.914 2.914 0 0 1-2.307 4.363l-.195.008H3.882a2.914 2.914 0 0 1-2.582-4.2l.099-.185l8.11-13.538A2.91 2.91 0 0 1 12 1.67M12.01 15l-.127.007a1 1 0 0 0 0 1.986L12 17l.127-.007a1 1 0 0 0 0-1.986zM12 8a1 1 0 0 0-.993.883L11 9v4l.007.117a1 1 0 0 0 1.986 0L13 13V9l-.007-.117A1 1 0 0 0 12 8"/></symbol>
<symbol id="i-circle-x" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0m7-2l4 4m0-4l-4 4"/></symbol>
<symbol id="i-circle-x-filled" viewBox="0 0 24 24"><path fill="currentColor" d="M17 3.34a10 10 0 1 1-14.995 8.984L2 12l.005-.324A10 10 0 0 1 17 3.34m-6.489 5.8a1 1 0 0 0-1.218 1.567L10.585 12l-1.292 1.293l-.083.094a1 1 0 0 0 1.497 1.32L12 13.415l1.293 1.292l.094.083a1 1 0 0 0 1.32-1.497L13.415 12l1.292-1.293l.083-.094a1 1 0 0 0-1.497-1.32L12 10.585l-1.293-1.292l-.094-.083z"/></symbol>
<symbol id="i-binary-tree-2" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 6a2 2 0 1 0-4 0a2 2 0 0 0 4 0m-7 8a2 2 0 1 0-4 0a2 2 0 0 0 4 0m14 0a2 2 0 1 0-4 0a2 2 0 0 0 4 0m-7 4a2 2 0 1 0-4 0a2 2 0 0 0 4 0M12 8v8m-5.684-3.504l4.368-4.992m7 4.992l-4.366-4.99"/></symbol>
<symbol id="i-server" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zm0 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zm4-7v.01M7 16v.01"/></symbol>
<symbol id="i-cloud-off" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.58 5.548q.361-.166.752-.286c1.88-.572 3.956-.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 .957-.383 1.824-1.003 2.454M18 18.004H6.657C4.085 18 2 15.993 2 13.517s2.085-4.482 4.657-4.482c.13-.582.37-1.128.7-1.62M3 3l18 18"/></symbol>
<symbol id="i-cpu" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M9 9h6v6H9zm-6 1h2m-2 4h2m5-11v2m4-2v2m7 5h-2m2 4h-2m-5 7v-2m-4 2v-2"/></g></symbol>
<symbol id="i-timeline" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m4 16l6-7l5 5l5-6"/><path d="M14 14a1 1 0 1 0 2 0a1 1 0 1 0-2 0M9 9a1 1 0 1 0 2 0a1 1 0 1 0-2 0m-6 7a1 1 0 1 0 2 0a1 1 0 1 0-2 0m16-8a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/></g></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0"/><path d="M12 7v5l3 3"/></g></symbol>
<symbol id="i-list-tree" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 6h11m-8 6h8m-5 6h5M5 6v.01M8 12v.01M11 18v.01"/></symbol>
<symbol id="i-terminal-2" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m8 9l3 3l-3 3m5 0h3"/><path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></g></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333z"/><path d="M4.012 16.737A2 2 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1"/></g></symbol>
<symbol id="i-download" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5l5-5m-5-7v12"/></symbol>
<symbol id="i-filter" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16v2.172a2 2 0 0 1-.586 1.414L15 12v7l-6 2v-8.5L4.52 7.572A2 2 0 0 1 4 6.227z"/></symbol>
<symbol id="i-chevron-right" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 6l6 6l-6 6"/></symbol>
<symbol id="i-chevron-down" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9l6 6l6-6"/></symbol>
<symbol id="i-restore" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3.06 13a9 9 0 1 0 .49-4.087"/><path d="M3 4.001v5h5M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/></g></symbol>
<symbol id="i-settings" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37c1 .608 2.296.07 2.572-1.065"/><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/></g></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></symbol>
<symbol id="i-file-diff" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2m-5-11v4m-2-2h4m-4 5h4"/></g></symbol>
<symbol id="i-history" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 8v4l2 2"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></g></symbol>
<symbol id="i-package" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 3l8 4.5v9L12 21l-8-4.5v-9zm0 9l8-4.5M12 12v9m0-9L4 7.5m12-2.25l-8 4.5"/></symbol>
<symbol id="i-shield-check" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.46 20.846A12 12 0 0 1 3.5 6A12 12 0 0 0 12 3a12 12 0 0 0 8.5 3a12 12 0 0 1-.09 7.06M15 19l2 2l4-4"/></symbol>
<symbol id="i-arrow-up" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m6-8l-6-6m-6 6l6-6"/></symbol>
<symbol id="i-arrow-down" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m6-6l-6 6m-6-6l6 6"/></symbol>
<symbol id="i-refresh" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4m-4 4a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/></symbol>
```

## 4. 扩充方式

需要更多图标时，用 Iconify 的 JSON 接口取 `body`（不要手抄，也不要另装图标库）：

```
https://api.iconify.design/tabler.json?icons=<kebab-name-1>,<kebab-name-2>
```

返回 `icons.<name>.body` 即为可直接放入 `<symbol>` 的内容；`not_found` 数组列出该名称不存在（多为 filled 变体缺失，走回退规则）。

## 5. 已确认不存在的 filled 变体

`tool-filled`、`cpu-filled`、`list-tree-filled`。这三个在 active / selected 态统一使用回退规则：outline + `--aos-accent` 描边，**不引入第二套图标库**。

> 原列出的 `brain-filled` 条目随 `i-brain` 一并作废——`IconBrain` 已拉黑，不再参与任何态。见 `icon-semantics.md` §5。
