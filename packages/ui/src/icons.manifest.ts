// packages/ui/src/icons.manifest.ts
//
// P0 唯一图标源：@tabler/icons 3.46.0（MIT，24x24 网格，stroke-width 2）。
// 图标名不许手工翻译 —— 本文件每个 name 都由 scripts/check-icons.mjs 读取
// @tabler/icons 原始 SVG 元数据逐条解析，解析失败 CI 红灯（ADR-014）。
//
// filled?: true 表示该图标存在 filled 孪生，可在 active / selected 态使用。
// Tabler filled 覆盖率约 20%；无孪生时不得擅自换库，按兜底规则用主色或 stroke 表达 active。
//
// 拉黑：brain / sparkles 及同类「AI 模板味」图标一律禁用（scripts/check-policy.mjs 拦截）。
// 本地推理一律使用 cpu 语义图标。

export const ICON_STROKE = 2 as const;

export const ICON_SIZES = [16, 20, 24] as const;

export const ICONS = {
  // 导航
  navRuns: { name: 'activity' },
  navEvidence: { name: 'file-search' },
  navSkills: { name: 'git-branch' },
  navRuntime: { name: 'layout-dashboard' },
  navTree: { name: 'list-tree' },

  // 证据链
  evidenceAnchor: { name: 'quote' },
  evidenceChunk: { name: 'file-text' },
  evidenceBind: { name: 'crosshair' },
  evidenceTrace: { name: 'fingerprint' },

  // 五态（互斥：verified / unverified / refused / failed / error）
  stateVerified: { name: 'shield-check', filled: true },
  stateUnverified: { name: 'shield-alert' },
  stateRefused: { name: 'info' },
  stateFailed: { name: 'x' },
  stateError: { name: 'shield-alert' },

  // 本地运行时
  localOnly: { name: 'cloud-off' },
  localModel: { name: 'cpu', filled: true },
  localDisk: { name: 'hard-drive' },
  storage: { name: 'database', filled: true },
  memory: { name: 'memory-stick' },
  thermal: { name: 'thermometer' },
  throughput: { name: 'gauge' },
  latency: { name: 'timer' },
  trend: { name: 'trending-up' },
  zap: { name: 'zap' },

  // Run 控制
  runPlay: { name: 'play' },
  runPause: { name: 'pause' },
  runStop: { name: 'square' },
  runReplay: { name: 'rotate-ccw' },
  runLive: { name: 'loader' },

  // 列表与工具条
  filter: { name: 'filter' },
  search: { name: 'search' },
  sort: { name: 'arrow-up-down' },
  refresh: { name: 'refresh-cw' },
  expand: { name: 'chevron-right' },
  collapse: { name: 'chevron-down' },
  collapseAll: { name: 'chevrons-down-up' },
  more: { name: 'ellipsis' },
  close: { name: 'x' },
  add: { name: 'plus' },
  trash: { name: 'trash-2' },
  copy: { name: 'copy' },
  download: { name: 'download' },
  upload: { name: 'upload' },
  expandFull: { name: 'maximize-2' },
  undo: { name: 'undo-2' },

  // 技能与血缘
  skillLineage: { name: 'git-fork' },
  skillVersion: { name: 'git-commit-horizontal' },
  skillExperiment: { name: 'flask-conical' },
  skillShuffle: { name: 'shuffle' },
  skillVerified: { name: 'check-check' },
  toolCall: { name: 'blocks' },
  tool: { name: 'wrench' },
  transcript: { name: 'messages-square' },
  checklist: { name: 'list-checks' },
  listOrdered: { name: 'list-ordered' },

  // 杂项
  settings: { name: 'settings-2' },
  docs: { name: 'book-open' },
  command: { name: 'command' },
  keyboard: { name: 'keyboard' },
  lock: { name: 'lock' },
  external: { name: 'arrow-up-right' },
  empty: { name: 'circle-dashed' },
} as const;

export type IconKey = keyof typeof ICONS;
export type IconName = (typeof ICONS)[IconKey]['name'];
