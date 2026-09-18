# OPEN-DECISIONS - aetheros

> 只追加 + 就地关闭。每次 Phase 开始时未决项自动复现到工作上下文最前面。
> 已关闭项可升格为 ADR。

## 汇总

已决 7 项 · 未决 1 项

---

## 已关闭（RESOLVED）

| Date | Source | Open Item | Current Leaning | Resolution | Status |
|------|--------|-----------|-----------------|------------|--------|
| 2026-09-19 | Phase 0 | 项目命名 | Agent OS 语义贴切 | **aetheros**。机械验证：`CJX0712/aetheros` GitHub 404 未占用；npm 裸名 `aetheros` 已被占 (v1.0.6)，改走 scoped `@aetheros/core` / `@aetheros/cli` / `@aetheros/runtime` / `@aetheros/sdk`，CLI 可执行名 `agentos` | RESOLVED |
| 2026-09-19 | Phase 1 | Evidence Gate 默认模式 | 默认严格 | **strict 硬拒答**。未落地断言一律拦截并标注证据缺口。宽容模式 `agentos config set evidence.mode lenient` 显式开启，且在 UI 与 trace 中永久标记当前模式 | RESOLVED |
| 2026-09-19 | Phase 1 | 单文件 HTML Demo 是否进 MVP 门禁 | 不进 | **同期交付但不进验收门禁**。与 v1.0 同版发布（用户明确要求双形态），QA P0 门禁只作用于 core + cli | RESOLVED |
| 2026-09-19 | Phase 1 | 图标库选型（两度改判） | Lucide → Tabler | **Tabler 3.46.0**。首次裁 Lucide（架构师锁定 + 零依赖可内联），终裁 Tabler：Lucide 无 filled 变体，active/selected 态缺它必然引入第二套图标，违反 P0「只锁一套」。MIT，6184 枚（outline 5130 + filled 1054），24×24 / 2px stroke | RESOLVED |
| 2026-09-19 | Phase 1 | 正文字体授权合规 | Switzer → Geist | **Geist（SIL OFL 1.1）**。Switzer 实为 ITF Free Font License（Closed Source），禁修改与再分发，vendored + 子集化即违规。等宽 = Commit Mono（OFL 1.1）。CJK 走系统栈不 vendored | RESOLVED |
| 2026-09-19 | Phase 1 | 图标 stroke 分档 | 按尺寸分档 | **驳回分档**。`ICON_STROKE = 2` 单一常量三档共用。Tabler stroke 是 24 网格用户单位，实际像素 = stroke × size/24；16px 下 2px 渲染 1.33px，降到 1.75 只会更糊 | RESOLVED |
| 2026-09-19 | Phase 2 | 无 filled 孪生图标的 active 态表达规则 | 无 filled 时改用主色或 stroke 表达 active | **兜底规则落地且经 CI 校验通过**（ADR-018）。规则写入 `icons.manifest.ts` 头部；`filled: true` 只标注实测确有孪生的条目（`stateVerified` / `storage`），`cpu` 等无孪生图标据实去掉标记。`check-icons.mjs` 改为按 filled 族同名条目判定孪生后，62 个图标名 0 告警 | RESOLVED |

---

## 未决（OPEN）

| Date | Source | Open Item | Related Constraints | Current Leaning | Blocked By | Resolves When | Status |
|------|--------|-----------|---------------------|-----------------|------------|---------------|--------|
| 2026-09-19 | Phase 2 | `states-copy.md` 的状态图标与 manifest 锁定五态不一致 | 文档原用 `check` / `circle-dashed` / `alert-triangle`；manifest 锁定 `shield-check` / `shield-question` / `info-circle` / `x` / `shield-x`。文档的五态（Grounded / Unverified / No source / Running / Idle）还混入了 run 态（Running / Idle），与 manifest 的证据态五态（verified / unverified / refused / failed / error）不是同一套分类 | 以 manifest 为锁定源，文档侧改用 manifest 的图标名；两套分类是否合并由设计师定 | 设计师确认两套五态分类的归属 | 设计师回填对齐后的文档并经一致性检查 | OPEN |

---

## 已识别风险（非决策，仅登记）

| 风险 | 影响 | 缓解 |
|------|------|------|
| 图标名凭记忆翻译 | 编译过、运行时渲染空白，验收才发现 | **已命中并已被拦下**：首轮 `check:icons` 报出 26 处（25 个 unique）Tabler 3.46.0 中不存在的图标名（`shield-alert` / `hard-drive` / `ellipsis` / `trash-2` / `undo-2` …），全部为 2.x 旧名或凭记忆拼写。构建脚本读 `@tabler/icons` 原始 SVG 元数据解析 + CI 门禁解析失败即红灯（ADR-014 / ADR-018）证明有效 |
| DTCG `shadow` vs `boxShadow` | 前端工具链可能要求字面量 | 维持 DTCG 规范名 `shadow`，`$extensions.aos.meta.typeAliases` 做映射 |
| 青底按钮对比度 | 白字压 `#3CCFC1` 仅约 2.2:1，不达标 | 青底按钮文字强制 `--aos-accent-on` `#04201D`，写进 lint 规则 |
| 字体 CDN 依赖 | 破坏「零云端依赖」产品定位 | 禁止 CDN，必须子集化自托管，CI 校验 `assets/fonts/` 每个字体文件都有对应 LICENSE |
