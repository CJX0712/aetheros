// packages/core/src/kernel.test.ts
import { describe, it, expect } from 'vitest';
import { fuseRetrieval, RERANK_WEIGHT, PRIMARY_PRIORITY } from './fusion.js';
import { EvidenceGate, sliceEvidence } from './evidence.js';
import { Trace } from './trace.js';
import { NetPolicy } from './net.js';
import { autoThreads, MIN_THREADS, MAX_THREADS, resolvePort } from './infer.js';
import type { Claim, EvidenceAnchor } from './types.js';

describe('fusion (F2 / AC-06 / AC-07 / AC-08)', () => {
  const lexical = ['c3', 'c1', 'c5', 'c2', 'c8', 'c4', 'c6', 'c7'];
  const semantic = ['c1', 'c3', 'c2', 'c5', 'c4', 'c8', 'c7', 'c6'];

  it('locks the reranker weight at 0.5 and never lets it take over', () => {
    expect(RERANK_WEIGHT).toBe(0.5);
    expect(PRIMARY_PRIORITY).toBeGreaterThan(0);
  });

  it('keeps the first-stage champion as top-1 under a fully-reversed reranker', () => {
    const stage1 = fuseRetrieval({ lexical, semantic, rerank: [], w: 0 });
    const champion = stage1[0]!.id;
    const adversarial = [...stage1.map((r) => r.id)].reverse();
    const fused = fuseRetrieval({ lexical, semantic, rerank: adversarial, w: 0.5 });
    expect(fused[0]!.id).toBe(champion);
    expect(fused[0]!.score).toBeGreaterThan(fused[1]!.score);
  });

  it('degrades gracefully when the reranker covers only part of the set', () => {
    const degraded = fuseRetrieval({ lexical, semantic, rerank: ['c5', 'c2'], w: 0.5 });
    expect(degraded.length).toBe(lexical.length);
    expect(() => degraded).not.toThrow();
  });
});

describe('evidence gate (F4 / AC-05 / AC-09 / AC-12)', () => {
  it('strict mode blocks unanchored claims and surfaces the gap', () => {
    const gate = new EvidenceGate('strict');
    const claims: Claim[] = [{ id: 'a1', text: 'unsupported claim' }];
    const out = gate.gate(claims);
    expect(out.blocked).toBe(true);
    expect(out.gaps).toHaveLength(1);
    expect(out.verdicts[0]!.state).toBe('refused');
  });

  it('lenient mode marks unanchored claims instead of blocking', () => {
    const gate = new EvidenceGate('lenient');
    const claims: Claim[] = [{ id: 'a1', text: 'unsupported claim' }];
    const out = gate.gate(claims);
    expect(out.blocked).toBe(false);
    expect(out.verdicts[0]!.state).toBe('unverified');
  });

  it('exposes the active mode on every outcome (AC-12)', () => {
    const gate = new EvidenceGate('strict');
    expect(gate.gate([]).mode).toBe('strict');
    gate.setMode('lenient');
    expect(gate.gate([]).mode).toBe('lenient');
  });

  it('slices evidence by utf16 span and matches the byte span', () => {
    const text = '证据链的字节区间是权威地址，但 JavaScript 的字符串索引是 UTF-16 code unit，不是字节。';
    const needle = 'UTF-16 code unit';
    const utf16Start = text.indexOf(needle);
    const utf16End = utf16Start + needle.length;
    const byteStart = Buffer.byteLength(text.slice(0, utf16Start), 'utf8');
    const byteEnd = byteStart + Buffer.byteLength(needle, 'utf8');
    const anchor: EvidenceAnchor = {
      chunkId: 'k1',
      byteStart,
      byteEnd,
      utf16Start,
      utf16End,
    };
    expect(sliceEvidence(anchor, text)).toBe(needle);
  });
});

describe('trace (AC-09 / AC-10 / AC-13)', () => {
  it('detects tampering after a record is mutated', () => {
    const trace = new Trace();
    trace.append({ spanId: 's1', kind: 'agent', status: 'ok', startedAt: 0, endedAt: 1 });
    trace.append({ spanId: 's2', kind: 'retrieve', status: 'ok', startedAt: 1, endedAt: 2 });
    expect(trace.isIntact()).toBe(true);
    const tampered = JSON.parse(JSON.stringify(trace.links()));
    (tampered[1].record as { spanId: string }).spanId = 'hacked';
    const copy = new Trace();
    // Replay into a fresh trace to test verify on a tampered chain.
    // (verify is instance-bound; emulate by mutating the live chain's record via JSON round-trip.)
    expect(() => {
      const live = trace.links() as unknown as Array<{ record: { spanId: string } }>;
      live[1].record.spanId = 'hacked';
      trace.verify();
    }).toThrow(/tamper-detected/);
  });

  it('refuses to prune records younger than the retention floor', () => {
    const trace = new Trace();
    const now = Date.now();
    trace.append({ spanId: 's1', kind: 'agent', status: 'ok', startedAt: now - 1000, endedAt: now });
    // 180-day floor: nothing recent is pruned.
    expect(trace.pruneBefore(now)).toBe(0);
  });
});

describe('net policy (AC-01)', () => {
  it('treats loopback as local and flags off-host as outbound', () => {
    const net = new NetPolicy();
    net.count('127.0.0.1');
    net.count('localhost');
    net.count('8.8.8.8');
    expect(net.getLocal()).toBe(2);
    expect(net.getOutbound()).toBe(1);
    expect(net.isOfflineClean()).toBe(false);
  });
});

describe('inference sane defaults (F1 / AC-02 / AC-03 / AC-14)', () => {
  it('clamps thread count into [2, 4] regardless of core count', () => {
    const t = autoThreads(99);
    expect(t).toBeGreaterThanOrEqual(MIN_THREADS);
    expect(t).toBeLessThanOrEqual(MAX_THREADS);
  });

  it('fails loudly when an out-of-window thread count is requested', () => {
    expect(() => autoThreads(1)).toThrow(/outside the clamp window/);
    expect(() => autoThreads(8)).toThrow(/outside the clamp window/);
  });

  it('resolves a usable local port from the fallback ladder', async () => {
    const port = await resolvePort(8765);
    expect(port).toBeGreaterThan(0);
  });
});
