// packages/ui/src/icons.manifest.ts
//
// P0 唯一图标源：@tabler/icons 3.46.0（MIT，24x24 网格，stroke-width 2）。
// 图标名不许手工翻译 —— 本文件每个 name 都由 scripts/check-icons.mjs 读取
// @tabler/icons 原始 SVG 元数据逐条解析，解析失败 CI 红灯（ADR-014）。
//
// filled?: true 表示该图标存在 filled 孪生，可在 active / selected 态使用。
// Tabler filled 覆盖率约 20% 且用的是同名条目（icons/filled/<name>.svg，
// 不是 <name>-filled）—— 本文件只对确有孪生的条目置 true，无孪生时按兜底规则用主色或 stroke 表达 active。
//
// 拉黑：AI 模板味图标名（脑 / 星 / 魔杖类）一律禁用（scripts/check-policy.mjs 拦截）。
// 本地推理一律使用 cpu 语义图标。
//
// 名称对照（清单基于 Tabler 3.46.0 实测索引，5130 枚描边图标；Tabler 3.x 已改名的不复用 2.x 旧名）：
//   shield-alert→shield-question/shield-x | info→info-circle | hard-drive→server
//   memory-stick→device-sd-card | timer→stopwatch | zap→bolt | play/pause→player-play/player-pause
//   rotate-ccw→rotate-clockwise | arrow-up-down→arrows-up-down | refresh-cw→refresh
//   chevrons-down-up→chevrons-up | ellipsis→dots | trash-2→trash | maximize-2→arrows-maximize
//   undo-2→arrow-back-up | git-commit-horizontal→git-commit | flask-conical→flask
//   shuffle→arrows-shuffle | check-check→checks | wrench→tool | messages-square→messages
//   list-checks→checklist | list-ordered→list-numbers | book-open→book

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
  stateUnverified: { name: 'shield-question' },
  stateRefused: { name: 'info-circle' },
  stateFailed: { name: 'x' },
  stateError: { name: 'shield-x' },

  // 本地运行时
  localOnly: { name: 'cloud-off' },
  localModel: { name: 'cpu' },
  localDisk: { name: 'server' },
  storage: { name: 'database', filled: true },
  memory: { name: 'device-sd-card' },
  thermal: { name: 'thermometer' },
  throughput: { name: 'gauge' },
  latency: { name: 'stopwatch' },
  trend: { name: 'trending-up' },
  zap: { name: 'bolt' },

  // Run 控制
  runPlay: { name: 'player-play' },
  runPause: { name: 'player-pause' },
  runStop: { name: 'square' },
  runReplay: { name: 'rotate-clockwise' },
  runLive: { name: 'loader' },

  // 列表与工具条
  filter: { name: 'filter' },
  search: { name: 'search' },
  sort: { name: 'arrows-up-down' },
  refresh: { name: 'refresh' },
  expand: { name: 'chevron-right' },
  collapse: { name: 'chevron-down' },
  collapseAll: { name: 'chevrons-up' },
  more: { name: 'dots' },
  close: { name: 'x' },
  add: { name: 'plus' },
  trash: { name: 'trash' },
  copy: { name: 'copy' },
  download: { name: 'download' },
  upload: { name: 'upload' },
  expandFull: { name: 'arrows-maximize' },
  undo: { name: 'arrow-back-up' },

  // 技能与血缘
  skillLineage: { name: 'git-fork' },
  skillVersion: { name: 'git-commit' },
  skillExperiment: { name: 'flask' },
  skillShuffle: { name: 'arrows-shuffle' },
  skillVerified: { name: 'checks' },
  toolCall: { name: 'blocks' },
  tool: { name: 'tool' },
  transcript: { name: 'messages' },
  checklist: { name: 'checklist' },
  listOrdered: { name: 'list-numbers' },

  // 杂项
  settings: { name: 'settings-2' },
  docs: { name: 'book' },
  command: { name: 'command' },
  keyboard: { name: 'keyboard' },
  lock: { name: 'lock' },
  external: { name: 'arrow-up-right' },
  empty: { name: 'circle-dashed' },
} as const;

export type IconKey = keyof typeof ICONS;
export type IconName = (typeof ICONS)[IconKey]['name'];
