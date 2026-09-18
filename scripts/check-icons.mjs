// scripts/check-icons.mjs
// ADR-014：图标名不许手工翻译。本脚本读取 @tabler/icons 3.46.0 的原始 SVG 元数据，
// 逐条解析 packages/ui/src/icons.manifest.ts 的图标名。任一名称解析失败即退出码非 0。
//
// 硬约束同时校验：viewBox 必须是 0 0 24 24，stroke-width 必须是 2（ICON_STROKE 单一常量）。
// filled 孪生缺失只告警不失败 —— Tabler filled 覆盖率约 20%，兜底规则尚未关闭（OPEN-DECISION）。

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const MANIFEST = join(ROOT, 'packages/ui/src/icons.manifest.ts');

const CANDIDATE_PKG_DIRS = [
  join(ROOT, 'node_modules/@tabler/icons'),
  join(ROOT, 'packages/ui/node_modules/@tabler/icons'),
];

function fail(message) {
  console.error(`[FAIL] icons: ${message}`);
  process.exit(1);
}

/** 递归索引包内所有 .svg -> 绝对路径。不假设任何目录布局 */
function indexIcons(pkgDir) {
  const index = new Map();
  const stack = [pkgDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') stack.push(full);
      } else if (entry.name.endsWith('.svg')) {
        index.set(basename(entry.name, '.svg'), full);
      }
    }
  }
  return index;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

const pkgDir = CANDIDATE_PKG_DIRS.find((d) => existsSync(d));
if (!pkgDir) fail('找不到 @tabler/icons，先执行 pnpm install（版本锁定 3.46.0）');

if (!existsSync(MANIFEST)) fail(`缺少 ${MANIFEST} —— ADR-014 的解析对象不存在`);

const icons = indexIcons(pkgDir);
if (icons.size === 0) fail(`@tabler/icons 包内未发现任何 .svg（${pkgDir}）`);

const manifest = readFileSync(MANIFEST, 'utf8');
// 只取 `name: '...'` 的值，避免把语义键名误当成图标名
const entries = [...manifest.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map((m) => ({
  icon: m[1],
  line: manifest.slice(0, m.index).split('\n').length,
}));
const filledFlags = [...manifest.matchAll(/name:\s*['"]([^'"]+)['"]\s*,\s*filled:\s*true/g)].map((m) => m[1]);

if (entries.length === 0) fail('icons.manifest.ts 中没有解析到任何 `name:` 图标名');

const unresolved = [];
const geometry = [];
for (const { icon, line } of entries) {
  const file = icons.get(icon);
  if (!file) {
    const near = [...icons.keys()]
      .map((n) => ({ n, d: levenshtein(icon, n) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map((x) => x.n);
    unresolved.push({ icon, line, near });
    continue;
  }
  const svg = readFileSync(file, 'utf8');
  if (!svg.includes('viewBox="0 0 24 24"')) geometry.push(`${icon}: viewBox 不是 0 0 24 24`);
  if (!/stroke-width="2"/.test(svg)) geometry.push(`${icon}: stroke-width 不是 2`);
}

const missingFilled = filledFlags.filter((n) => !icons.has(`${n}-filled`));

if (unresolved.length > 0) {
  console.error(`[FAIL] icons: ${unresolved.length} 个图标名在 @tabler/icons 3.46.0 中不存在`);
  for (const u of unresolved) {
    console.error(`  ${MANIFEST}:${u.line}  '${u.icon}'  你是想写 ${u.near.map((n) => `'${n}'`).join(' / ')} ?`);
  }
  process.exit(1);
}

if (geometry.length > 0) {
  console.error(`[FAIL] icons: 图标几何不符合 24x24 / stroke 2 约束`);
  for (const g of geometry) console.error(`  ${g}`);
  process.exit(1);
}

console.log(`[PASS] icons: ${entries.length} 个图标名全部解析成功（源 ${icons.size} 枚 SVG）`);
if (missingFilled.length > 0) {
  console.log(`[WARN] icons: ${missingFilled.length} 个图标无 filled 孪生，active 态需走兜底规则：${missingFilled.join(', ')}`);
}
process.exit(0);
