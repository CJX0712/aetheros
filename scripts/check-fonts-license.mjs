// scripts/check-fonts-license.mjs
// 字体硬约束：vendored 到 assets/fonts/ 的字体禁止走 CDN，且每个字体文件必须随附 LICENSE。
// 缺 LICENSE 即退出码非 0。LICENSE 内容未声明 SIL OFL 只告警（Geist / Commit Mono 均为 OFL 1.1）。

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const FONTS_DIR = join(ROOT, 'assets/fonts');
const FONT_EXT = new Set(['.woff2', '.woff', '.ttf', '.otf', '.eot']);
const LICENSE_RE = /^LICENSE/i;
const OFL_RE = /SIL Open Font License|OFL/i;

if (!existsSync(FONTS_DIR)) {
  console.log('[PASS] fonts: assets/fonts/ 尚不存在，无字体需校验');
  process.exit(0);
}

function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else out.push(full);
  }
  return out;
}

const files = collect(FONTS_DIR);
const fonts = files.filter((f) => FONT_EXT.has(parse(f).ext.toLowerCase()));
const licenses = files.filter((f) => LICENSE_RE.test(parse(f).base));

if (fonts.length === 0) {
  console.log('[PASS] fonts: 未 vendored 任何字体文件');
  process.exit(0);
}

const missing = [];
for (const font of fonts) {
  const inSameDir = licenses.some((l) => dirname(l) === dirname(font));
  const inRoot = licenses.some((l) => dirname(l) === FONTS_DIR);
  if (!inSameDir && !inRoot) missing.push(font.slice(ROOT.length + 1));
}

if (missing.length > 0) {
  console.error(`[FAIL] fonts: ${missing.length} 个字体文件缺少随附 LICENSE`);
  for (const m of missing) console.error(`  ${m}`);
  console.error('  修法：在该字体同目录放置 LICENSE（或在 assets/fonts/ 下放统一 LICENSE），并禁止任何 CDN 引用');
  process.exit(1);
}

const notOfl = licenses
  .filter((l) => !OFL_RE.test(readFileSync(l, 'utf8')))
  .map((l) => l.slice(ROOT.length + 1));

console.log(`[PASS] fonts: ${fonts.length} 个字体文件均随附 LICENSE（${licenses.length} 份 LICENSE）`);
if (notOfl.length > 0) {
  console.log(`[WARN] fonts: 以下 LICENSE 未声明 SIL OFL，请人工确认授权：${notOfl.join(', ')}`);
}
process.exit(0);
