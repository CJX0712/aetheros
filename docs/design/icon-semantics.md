# AetherOS — 图标语义槽清单

> **组件禁止引用图标名。** 组件只引用**语义槽**（`slot`），图标名由构建脚本在解析阶段绑定。
> 理由：图标库是可替换实现细节。引用 `IconCpu` 的组件在换库时必须逐个改；引用 `slot="model.local"` 的组件一行都不用动。

## 1. 契约

```tsx
// ✅ 正确：组件只认语义槽
<Icon slot="run.start" size={20} />
<Icon slot="evidence.verified" size={16} tone="verified" />

// ❌ 禁止：组件里出现图标名或 sprite id
<IconPlayerPlay size={20} />
<svg><use href="#i-player-play" /></svg>
```

**CI 门禁（三条，任一不通过即 fail）**
1. `src/**` 里不允许出现 `Icon[A-Z]` 形式的标识符（除 `design/icons/registry.ts` 一个文件）。
2. 不允许出现 `href="#i-` 字面量（除 `design/icons/sprite.ts` 与单文件 Demo 的 sprite 头部）。
3. 不允许出现 `@tabler/*` 的直接 import（除 registry）。
4. 每个 `slot` 必须在本文档 §3 有定义、在 §4 有绑定，且 `aria-label` 缺省值非空。

**尺寸**：只允许 `16 / 20 / 24`。**描边**：`ICON_STROKE = 2` 单一常量（24 网格用户单位），禁止按尺寸预计算。
**颜色**：一律 `currentColor`，由 `var(--aos-*)` 控制，禁止 inline 色值。
**状态态**：`default` / `active`。`active` 优先 filled 变体；filled 不存在的槽用「outline + `--aos-accent` 描边」。**filled 永不替代文字标签（P4）。**

## 2. 槽命名规范

`<域>.<对象>[.<变体>]`，全小写、点分、无缩写。域取值：`shell` `run` `trace` `span` `evidence` `gate` `skill` `model` `resource` `file` `nav` `action` `state`。

## 3. 语义槽定义（组件可见的全部接口）

| slot | 含义 | 需要的态 | 默认 aria-label（英文） | 备注 |
|---|---|---|---|---|
| `nav.overview` | 概览 | default | Overview | |
| `nav.runs` | 运行列表 | default | Runs | |
| `nav.trace` | trace | default | Trace | |
| `nav.evidence` | 证据 | default | Evidence | |
| `nav.skills` | 技能库 | default | Skills | |
| `nav.evolution` | 自进化谱系 | default | Evolution | |
| `nav.models` | 模型与资源 | default | Models and resources | |
| `nav.settings` | 设置 | default | Settings | |
| `nav.docs` | 文档 | default | Docs | |
| `nav.shortcuts` | 键盘快捷键 | default | Keyboard shortcuts | |
| `nav.command` | 命令面板 | default | Command palette | |
| `run.start` | 启动运行 | default, active | Start run | active 用 filled |
| `run.stop` | 中止运行 | default, active | Stop run | 危险操作，配 `--aos-failed` |
| `run.replay` | 重放 | default | Replay run | |
| `run.compare` | 对比两次运行 | default | Compare runs | |
| `run.export` | 导出 | default | Export | |
| `run.import` | 导入 | default | Import | |
| `run.refresh` | 刷新 | default | Refresh | |
| `run.history` | 历史 | default | Run history | |
| `trace.timeline` | 时间线 | default | Timeline | |
| `trace.collapse` | 折叠 | default | Collapse | |
| `trace.expand` | 展开 | default | Expand | |
| `trace.fullscreen` | 全屏 | default | Fullscreen | |
| `trace.filter` | 过滤 | default, active | Filter | |
| `trace.sort` | 排序 | default | Sort | |
| `span.agent` | agent span | default | Agent span | |
| `span.llm` | LLM 生成 span | default | Model span | |
| `span.retrieval` | 检索 span | default | Retrieval span | |
| `span.tool` | 工具调用 span | default | Tool span | filled 不存在 → 回退规则 |
| `span.think` | 推理 span | default | Reasoning span | 分解/规划类（`planner.decompose`）用树形语义，见 §4 |
| `span.failed` | 失败 span | default | Failed span | |
| `span.duration` | 耗时 | default | Duration | |
| `span.latency` | 延迟 | default | Latency | |
| `evidence.quote` | 引用 / 证据 | default, active | Evidence | |
| `evidence.verified` | 已核验（已落地） | default, active | Grounded | 配 `--aos-verified` |
| `evidence.unverified` | 待核验（证据不完整） | default | Unverified | 配 `--aos-unverified`（规则二） |
| `evidence.refused` | 已拒答（闸门拦截） | default, active | Refused — no evidence | strict 模式拦截时使用 |
| `evidence.failed` | 无据 | default, active | No source | 配 `--aos-failed` |
| `evidence.locate` | 定位到原文 | default | Locate in source | |
| `evidence.provenance` | 溯源 / 指纹 | default | Provenance | |
| `evidence.immuatable` | 只追加日志 | default | Append-only log | |
| `gate.strict` | 严格闸门模式 | default, active | Evidence gate: strict | 常驻标记用 |
| `gate.lenient` | 宽容闸门模式 | default, active | Evidence gate: lenient | **降级运行**，须视觉可辨 |
| `skill.library` | 技能库 | default | Skills | |
| `skill.evaluate` | 评估 | default | Evaluate | |
| `skill.mutate` | 变异 | default | Mutate | |
| `skill.promote` | 晋升 / 固化 | default, active | Promote | |
| `skill.rollback` | 回滚 | default | Rollback | 危险操作 |
| `skill.isolate` | 隔离 | default | Quarantine | |
| `skill.lineage` | 版本谱系 | default | Lineage | |
| `model.local` | 本地模型 / 推理 | default | Local model | **替代 brain** |
| `model.prompt` | 提示与响应 | default | Prompt and response | **替代 brain** |
| `model.package` | 包 / 模块 | default | Package | |
| `model.terminal` | 终端 | default | Terminal | |
| `resource.cpu` | CPU | default | CPU | |
| `resource.memory` | 内存 | default | Memory | |
| `resource.throughput` | 吞吐 tok/s | default | Throughput | |
| `resource.disk` | 磁盘 | default | Disk | |
| `resource.power` | 功耗 | default | Power draw | |
| `resource.thermal` | 降频 / 温度 | default | Thermal throttling | |
| `resource.queue` | 队列 | default | Queue | |
| `resource.offline` | 本地 / 离线运行 | default | Runs locally | 顶栏信任锚 |
| `file.document` | 来源文档 | default | Source document | |
| `file.diff` | diff | default | Diff | |
| `file.verified` | 校验通过 | default | Checksum matches | |
| `file.tampered` | 校验失败 | default | Checksum mismatch | 配 `--aos-failed` |
| `action.copy` | 复制 | default | Copy | |
| `action.download` | 下载 | default | Download | |
| `action.upload` | 上传 | default | Upload | |
| `action.create` | 新建 | default | Create | |
| `action.delete` | 删除 | default | Delete | 危险操作 |
| `action.close` | 关闭 | default | Close | |
| `action.more` | 更多 | default | More actions | |
| `action.fullscreen` | 全屏 | default | Fullscreen | |
| `state.running` | 运行中 | default | Running | 配 `--aos-running` |
| `state.idle` | 空闲 / 排队 | default | Idle | 配 `--aos-idle` |
| `state.loading` | 加载中 | default | Loading | |
| `state.info` | 信息 | default | Info | |
| `state.warning` | 警告 | default | Warning | 非证据类通用警告用此槽 |
| `state.clock` | 时钟 / 时间戳 | default | Timestamp | |
| `state.delta_up` | Δ 上升 | default | Increased | Δ 箭头，见 MASTER §11 |
| `state.delta_down` | Δ 下降 | default | Decreased | Δ 箭头 |

> **`state.warning` 与 `evidence.unverified` 必须分开使用。** 通用警告（如磁盘将满）用 `state.warning` + `--aos-failed` / `--aos-muted`；只有「断言证据不完整」才允许 `evidence.unverified` + `--aos-unverified`（规则二）。

## 4. 槽 → Tabler 绑定（构建期数据，非组件接口）

> 本表是构建脚本的输入。**改本表不影响任何组件代码**——这正是引入语义槽的目的。
> 图标名仅供 registry 使用；`filled` 列为 `—` 表示该槽走回退规则（outline + `--aos-accent` 描边）。

| slot | outline | filled |
|---|---|---|
| `nav.overview` | `IconLayoutDashboard` | — |
| `nav.runs` | `IconTimeline` | — |
| `nav.trace` | `IconBinaryTree2` | — |
| `nav.evidence` | `IconQuote` | `IconQuoteFilled` |
| `nav.skills` | `IconPackage` | — |
| `nav.evolution` | `IconBinaryTree2` | — |
| `nav.models` | `IconCpu` | — |
| `nav.settings` | `IconSettings` | — |
| `nav.docs` | `IconFileDiff` | — |
| `nav.shortcuts` | `IconCommand` | — |
| `nav.command` | `IconCommand` | — |
| `run.start` | `IconPlayerPlay` | `IconPlayerPlayFilled` |
| `run.stop` | `IconPlayerStop` | `IconPlayerStopFilled` |
| `run.replay` | `IconRestore` | — |
| `run.compare` | `IconFileDiff` | — |
| `run.export` | `IconDownload` | — |
| `run.import` | `IconUpload` | — |
| `run.refresh` | `IconRefresh` | — |
| `run.history` | `IconHistory` | — |
| `trace.timeline` | `IconTimeline` | — |
| `trace.collapse` | `IconChevronDown` | — |
| `trace.expand` | `IconChevronRight` | — |
| `trace.fullscreen` | `IconArrowsMaximize` | — |
| `trace.filter` | `IconFilter` | — |
| `trace.sort` | `IconArrowsSort` | — |
| `span.agent` | `IconBinaryTree2` | — |
| `span.llm` | `IconCpu` | — |
| `span.retrieval` | `IconSearch` | — |
| `span.tool` | `IconTool` | — |
| `span.think` | `IconListTree` | — |
| `span.failed` | `IconCircleX` | `IconCircleXFilled` |
| `span.duration` | `IconClock` | `IconClockFilled` |
| `span.latency` | `IconClock` | `IconClockFilled` |
| `evidence.quote` | `IconQuote` | `IconQuoteFilled` |
| `evidence.verified` | `IconCircleCheck` | `IconCircleCheckFilled` |
| `evidence.unverified` | `IconCircleDashed` | — |
| `evidence.refused` | `IconShieldCheck` | — |
| `evidence.failed` | `IconCircleX` | `IconCircleXFilled` |
| `evidence.locate` | `IconTarget` | — |
| `evidence.provenance` | `IconFingerprint` | — |
| `evidence.immuatable` | `IconLock` | — |
| `gate.strict` | `IconShieldCheck` | — |
| `gate.lenient` | `IconAlertTriangle` | `IconAlertTriangleFilled` |
| `skill.library` | `IconPackage` | — |
| `skill.evaluate` | `IconFlask` | — |
| `skill.mutate` | `IconShuffle` | — |
| `skill.promote` | `IconCircleCheck` | `IconCircleCheckFilled` |
| `skill.rollback` | `IconRestore` | — |
| `skill.isolate` | `IconLock` | — |
| `skill.lineage` | `IconBinaryTree2` | — |
| `model.local` | `IconCpu` | — |
| `model.prompt` | `IconMessage` | — |
| `model.package` | `IconPackage` | — |
| `model.terminal` | `IconTerminal2` | — |
| `resource.cpu` | `IconCpu` | — |
| `resource.memory` | `IconDeviceDesktop` | — |
| `resource.throughput` | `IconGauge` | — |
| `resource.disk` | `IconServer` | — |
| `resource.power` | `IconBolt` | — |
| `resource.thermal` | `IconTemperature` | — |
| `resource.queue` | `IconListOrdered` | — |
| `resource.offline` | `IconCloudOff` | — |
| `file.document` | `IconFileText` | — |
| `file.diff` | `IconFileDiff` | — |
| `file.verified` | `IconShieldCheck` | — |
| `file.tampered` | `IconAlertTriangle` | `IconAlertTriangleFilled` |
| `action.copy` | `IconCopy` | — |
| `action.download` | `IconDownload` | — |
| `action.upload` | `IconUpload` | — |
| `action.create` | `IconPlus` | — |
| `action.delete` | `IconTrash` | — |
| `action.close` | `IconX` | — |
| `action.more` | `IconDots` | — |
| `action.fullscreen` | `IconArrowsMaximize` | — |
| `state.running` | `IconLoader` | — |
| `state.idle` | `IconCircleDashed` | — |
| `state.loading` | `IconLoader` | — |
| `state.info` | `IconInfoCircle` | — |
| `state.warning` | `IconAlertTriangle` | `IconAlertTriangleFilled` |
| `state.clock` | `IconClock` | `IconClockFilled` |
| `state.delta_up` | `IconArrowUp` | — |
| `state.delta_down` | `IconArrowDown` | — |

> **计时类同屏去重规则（`span.duration` / `span.latency`）**：两者都绑 `IconClock`，但在**同一行右侧同时渲染耗时与延迟**时，`span.latency` **省略图标**，只留 mono 数字 + 文字标签 —— 否则一行两个同构 clock 在密度 7 的瀑布里互相淹没。`span.think` 已改绑 `IconListTree`，与计时类彻底区分（改前 think/duration/latency 三槽同 clock）。

**不在表内的图标名一律不导入。** 新增槽位的流程：本节加一行 + §3 加一行 + `tabler-icon-manifest.md` §3 加 sprite + CI 重跑。

## 5. 已拉黑（永不使用）

| 图标 | 原因 | 替代槽 |
|---|---|---|
| `IconBrain` | AI 模板味，与「测量仪器」定位冲突 | `model.local` / `model.prompt` |
| `IconSparkles` | 同上 | 视语义用 `run.start` 或 `skill.evaluate` |
| `IconWand` | 同上 | `skill.mutate` |

> `tabler-icon-manifest.md` §2 与 `DESIGN.md` §5.3 中残留的 `IconBrain` 条目**作废**，以本表为准。
