// scripts/check-policy.mjs
// 仓库级 P0 门禁。零依赖，只用 node:fs。命中任何一条即退出码非 0。
//
// 拦截清单：
//   1. emoji 作为功能图标（含变体选择符 / ZWJ / tag 序列）
//   2. AI 模板味图标名（brain / sparkles 及同类）
//   3. 紫 -> 粉渐变
//   4. 硬编码颜色值（唯一例外 #fff / #000）
//   5. 弹跳缓动 cubic-bezier
//   6. 单文件超过 300 行
//
// UGC 豁免：路径含 /ugc/ 的文件，或文件前 5 行带 `aos-policy-off: emoji` 标记。

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

// 与团队 P0 规则给定的区间一致（PCRE \x{...} 的 JS 等价写法，必须带 u 标志）
const EMOJI_RE =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;

const BANNED_ICON_NAMES = ['brain', 'sparkles', 'magic-wand', 'wand', 'robot', 'bot', 'stars'];
const BANNED_ICON_RE = new RegExp(`\\b(${BANNED_ICON_NAMES.join('|')})\\b`, 'i');

const HEX_RE = /#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const ALLOWED_HEX = new Set(['fff', 'FFF', 'ffffff', 'FFFFFF', '000', '000000']);

const GRADIENT_RE = /linear-gradient\s*\(([^;}]*)\)/gi;
const BOUNCE_RE = /cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g;

const MAX_LINES = 300;
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', '.aetheros', 'assets', '.workbuddy']);
const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.vue', '.html', '.css', '.md', '.json']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.vue', '.html', '.css']);
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.vue', '.css']);

const findings = [];
const add = (file, line, rule, message) => findings.push({ file, line, rule, message });

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && SCAN_EXT.has(extOf(full))) yield full;
  }
}

const extOf = (p) => p.slice(p.lastIndexOf('.'));
const rel = (p) => relative(ROOT, p).split(sep).join('/');
const underPackages = (r) => r.startsWith('packages/');

function readLines(file) {
  return readFileSync(file, 'utf8').split(/\r?\n/);
}

// 1 + 2: emoji 与 AI 模板味图标名
function scanGlyphs(file, relPath) {
  const ugc = relPath.includes('/ugc/');
  const lines = readLines(file);
  const optOut = lines.slice(0, 5).some((l) => l.includes('aos-policy-off: emoji'));
  const isCode = CODE_EXT.has(extOf(file));
  // 规则定义文件自身不参与拉黑词扫描（本文件即规则源）
  const selfRule = relPath === 'scripts/check-policy.mjs';

  lines.forEach((text, i) => {
    const lineNo = i + 1;
    if (!ugc && !optOut) {
      const hit = EMOJI_RE.exec(text);
      if (hit) {
        add(relPath, lineNo, 'no-emoji', `emoji U+${hit[0].codePointAt(0).toString(16).toUpperCase()} 出现在 UI/文案中`);
      }
    }
    if (isCode && !selfRule && BANNED_ICON_RE.test(text)) {
      add(relPath, lineNo, 'no-ai-template-icon', 'AI 模板味图标名被拉黑，本地推理一律用 cpu 语义图标');
    }
  });
}

// 3 + 4: 渐变与硬编码色
function scanColors(file, relPath) {
  const ext = extOf(file);
  if (!CODE_EXT.has(ext)) return;
  const source = readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);

  lines.forEach((text, i) => {
    const lineNo = i + 1;

    for (const m of text.matchAll(HEX_RE)) {
      const value = m[1];
      if (ALLOWED_HEX.has(value)) continue;
      add(relPath, lineNo, 'no-hardcoded-color', `硬编码颜色 #${value}，必须走 --aos-* token`);
    }

    for (const m of text.matchAll(GRADIENT_RE)) {
      const stops = [...m[1].matchAll(HEX_RE)].map((s) => hueOf(s[1])).filter((h) => h !== null);
      const hasIndigo = stops.some((h) => h >= 235 && h <= 290);
      const hasPink = stops.some((h) => h >= 300 && h <= 345);
      if (hasIndigo && hasPink) {
        add(relPath, lineNo, 'no-purple-pink-gradient', 'Indigo -> Pink 渐变被禁用');
      }
    }

    for (const m of text.matchAll(BOUNCE_RE)) {
      const y1 = Number(m[2]);
      const y2 = Number(m[4]);
      if (y1 < 0 || y2 > 1) {
        add(relPath, lineNo, 'no-bounce-easing', `弹跳缓动 cubic-bezier(${m[1]}, ${m[2]}, ${m[3]}, ${m[4]}) 被禁用`);
      }
    }
  });
}

function hueOf(hex) {
  let h = hex;
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return null;
  let hue;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}

// 6: 单文件行数
function scanLineCount(file, relPath) {
  if (!SOURCE_EXT.has(extOf(file))) return;
  if (!relPath.startsWith('packages/') && !relPath.startsWith('scripts/') && !relPath.startsWith('stylelint/')) return;
  if (relPath.startsWith('packages/demo/')) return; // 单文件 HTML 演示引擎按设计是一个文件
  const count = readLines(file).length;
  if (count > MAX_LINES) {
    add(relPath, count, 'max-file-lines', `单文件 ${count} 行，超过 ${MAX_LINES} 行上限`);
  }
}

for (const file of walk(ROOT)) {
  const relPath = rel(file);
  scanGlyphs(file, relPath);
  if (underPackages(relPath)) scanColors(file, relPath);
  scanLineCount(file, relPath);
}

if (findings.length === 0) {
  console.log(`[PASS] policy: 0 violations (emoji / ai-icon / gradient / color / easing / lines)`);
  process.exit(0);
}

const byRule = new Map();
for (const f of findings) {
  if (!byRule.has(f.rule)) byRule.set(f.rule, []);
  byRule.get(f.rule).push(f);
}
console.log(`[FAIL] policy: ${findings.length} violation(s)`);
for (const [rule, list] of byRule) {
  console.log(`\n  ${rule} (${list.length})`);
  for (const f of list.slice(0, 25)) console.log(`    ${f.file}:${f.line}  ${f.message}`);
  if (list.length > 25) console.log(`    ... ${list.length - 25} more`);
}
process.exit(1);
