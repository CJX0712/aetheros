// scripts/verify-demo.mjs
// 单文件 HTML 演示引擎的无头自检（SPEC 12.8 / demo-engine-spec 9）。
//
// 核心约束：同一份代码在浏览器与 Node 两处运行，**不允许重复实现**。
// 本脚本不实现任何算法，只做三件事：
//   1. 从 packages/demo/index.html 抽出 <script id="agentos-engine"> 标记块
//   2. 用 node:vm 在无头沙箱里执行它（沙箱内置 __AETHEROS_HEADLESS__ = true）
//   3. 驱动断言，命中即退出码非 0
//
// 引擎块契约（演示引擎必须满足，否则自检红灯）：
//   顶层不得触碰 DOM。DOM 装配放进单独的 script 块或 mount()，可用
//   `if (!globalThis.__AETHEROS_HEADLESS__) mount()` 守卫。
//   块末尾必须挂出：
//     globalThis.AetherosEngine = {
//       RRF_K, RERANK_WEIGHT,                                  // RERANK_WEIGHT 必须 === 0.5
//       fuseRetrieval({ lexical, semantic, rerank, w }),        // -> [{ id, score }] 按 score 降序
//       sliceEvidence({ chunkText, byteStart, byteEnd, utf16Start, utf16End }), // -> string
//       hashChainAppend(prevHash, record),                      // -> { seq, prevHash, hash, record }
//       hashChainVerify(chain),                                 // -> true；篡改则抛 tamper-detected 或返回 false
//     }
//   三个 rank 数组均为「按名次排列的 id 数组」，index 0 即第 1 名。

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEMO = resolve(ROOT, 'packages/demo/index.html');

const failures = [];
const check = (name, condition, detail) => {
  if (condition) console.log(`[PASS] ${name}`);
  else {
    failures.push(name);
    console.log(`[FAIL] ${name}${detail ? `  ${detail}` : ''}`);
  }
};

function fail(message) {
  console.error(`[FAIL] verify-demo: ${message}`);
  process.exit(1);
}

// --- 1. 抽取引擎块 ---------------------------------------------------------
let html;
try {
  html = readFileSync(DEMO, 'utf8');
} catch {
  fail(`读不到 ${DEMO}。演示引擎未落地，本门禁保持红灯直到该文件存在。`);
}

const block = /<script[^>]*id=["']agentos-engine["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
if (!block) fail('index.html 中找不到 <script id="agentos-engine"> 标记块，无法复用同一份引擎代码');
const engineSource = block[1];

// --- 2. 无头沙箱 -----------------------------------------------------------
const noop = () => {};
const sandbox = {
  console,
  crypto: webcrypto,
  TextEncoder,
  TextDecoder,
  Buffer,
  URL,
  setTimeout,
  clearTimeout,
  __AETHEROS_HEADLESS__: true,
  document: { addEventListener: noop, removeEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
  window: { addEventListener: noop, removeEventListener: noop },
};
vm.createContext(sandbox);
try {
  vm.runInContext(engineSource, sandbox, { filename: 'packages/demo/index.html#agentos-engine' });
} catch (error) {
  fail(`引擎块在无头环境下抛错：${error.message}\n  引擎块顶层必须 DOM-free，DOM 装配请移出或用 __AETHEROS_HEADLESS__ 守卫`);
}

const engine = sandbox.AetherosEngine;
if (!engine || typeof engine !== 'object') {
  fail('引擎块没有挂出 globalThis.AetherosEngine');
}

const pick = (names) => names.map((n) => engine[n]).find((fn) => typeof fn === 'function');
const call = async (fn, ...args) => await fn(...args);

// --- 3. 断言 ---------------------------------------------------------------
const fuse = pick(['fuseRetrieval', 'fuseRRF', 'fuse']);
const slice = pick(['sliceEvidence', 'sliceEvidenceSpan']);
const append = pick(['hashChainAppend', 'appendHashChain', 'hashLink']);
const verify = pick(['hashChainVerify', 'verifyHashChain']);

check('engine 暴露 fuseRetrieval', Boolean(fuse), '缺失则无法验证 AC-06 / AC-07');
check('engine 暴露 sliceEvidence', Boolean(slice), '缺失则无法验证证据锚点 utf16 不变式');
check('engine 暴露 hashChainAppend', Boolean(append), '缺失则无法验证 AC-10');
check('engine 暴露 hashChainVerify', Boolean(verify), '缺失则无法验证 AC-10');
if (!fuse || !slice || !append || !verify) process.exit(1);

// AC-06 / AC-07：RRF 二次融合，对抗性全倒序注入后 top-1 仍为首阶段冠军
const lexical = ['c3', 'c1', 'c5', 'c2', 'c8', 'c4', 'c6', 'c7'];
const semantic = ['c1', 'c3', 'c2', 'c5', 'c4', 'c8', 'c7', 'c6'];

const stage1 = await call(fuse, { lexical, semantic, rerank: [], w: 0 });
const champion = stage1[0]?.id;
const adversarial = [...stage1.map((r) => r.id)].reverse();
const fused = await call(fuse, { lexical, semantic, rerank: adversarial, w: 0.5 });

check('AC-06 融合权重锁定 0.5', engine.RERANK_WEIGHT === 0.5, `实际 RERANK_WEIGHT=${engine.RERANK_WEIGHT}`);
check(
  'AC-07 全倒序 reranker 注入后 top-1 仍为首阶段冠军',
  fused[0]?.id === champion,
  `champion=${champion} top1=${fused[0]?.id}`
);
check(
  'AC-07 冠亚军分值不相等（w 严格 < 1，未退化为平局）',
  fused[0].score > fused[1].score,
  `top1=${fused[0].score} runnerUp=${fused[1].score}`
);
// AC-08：reranker 覆盖率不全（降级场景）不得抛异常，且不得吞掉任何候选
let degraded = null;
let degradedError = null;
try {
  degraded = await call(fuse, { lexical, semantic, rerank: ['c5', 'c2'], w: 0.5 });
} catch (error) {
  degradedError = error;
}
check('AC-08 reranker 降级不抛异常', degradedError === null, degradedError ? degradedError.message : '');
check(
  'AC-08 reranker 降级后候选不丢失',
  Array.isArray(degraded) && degraded.length === lexical.length,
  `length=${degraded?.length}`
);

// 证据链 utf16 区间切片必须严格等于 chunk_text（中文语料必跑）
const chunkText = '证据链的字节区间是权威地址，但 JavaScript 的字符串索引是 UTF-16 code unit，不是字节。';
const needle = 'UTF-16 code unit';
const utf16Start = chunkText.indexOf(needle);
const utf16End = utf16Start + needle.length;
const byteStart = Buffer.byteLength(chunkText.slice(0, utf16Start), 'utf8');
const byteEnd = byteStart + Buffer.byteLength(needle, 'utf8');

if (Buffer.from(chunkText, 'utf8').slice(byteStart, byteEnd).toString('utf8') !== needle) {
  fail('fixture 自身不成立：byte 区间与 utf16 区间不一致');
}

const whole = await call(slice, {
  chunkText,
  byteStart: 0,
  byteEnd: Buffer.byteLength(chunkText, 'utf8'),
  utf16Start: 0,
  utf16End: chunkText.length,
});
check('utf16 全区间切片严格等于 chunk_text', whole === chunkText, `got=${JSON.stringify(whole)}`);

const part = await call(slice, { chunkText, byteStart, byteEnd, utf16Start, utf16End });
check('utf16 子区间切片严格等于目标支撑句（中文语料）', part === needle, `got=${JSON.stringify(part)}`);

// AC-10：哈希链防篡改
const chain = [];
let prevHash = null;
for (const record of [{ span: 'retrieve' }, { span: 'rerank' }, { span: 'generate' }, { span: 'gate' }]) {
  const link = await call(append, prevHash, record);
  chain.push(link);
  prevHash = link.hash;
}
check('哈希链可顺序追加且首尾相接', chain.every((link, i) => (i === 0 ? true : link.prevHash === chain[i - 1].hash)));

let intact = false;
try {
  intact = Boolean(await call(verify, chain));
} catch {
  intact = false;
}
check('AC-10 原始链校验通过', intact);

const tampered = JSON.parse(JSON.stringify(chain));
tampered[2].record.span = 'generate-tampered';
let tamperAccepted = false;
try {
  tamperAccepted = Boolean(await call(verify, tampered));
} catch (error) {
  tamperAccepted = false;
  if (!/tamper-detected/i.test(String(error?.message))) {
    check('AC-10 篡改错误需带 tamper-detected 语义', false, `实际 message=${error?.message}`);
  }
}
check('AC-10 篡改后的链被拒绝', tamperAccepted === false);

// 零依赖：不得出现任何绝对 URL 外链
const externalRef = /((?:src|href)\s*=\s*["']https?:)/i.test(html);
check('单文件零外链（file:// 打开时 0 请求）', !externalRef);

const sizeKb = Buffer.byteLength(html, 'utf8') / 1024;
if (sizeKb > 200) console.log(`[WARN] 单文件 ${sizeKb.toFixed(1)} KB，超出 200 KB 体积预算`);

if (failures.length > 0) {
  console.log(`\n[FAIL] verify-demo: ${failures.length} 项未通过 -> ${failures.join(' / ')}`);
  process.exit(1);
}
console.log('\n[PASS] verify-demo: 无头自检全绿');
process.exit(0);
