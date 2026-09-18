// packages/core/src/runtime.test.ts
import { describe, it, expect } from 'vitest';
import { AgentRuntime } from './runtime.js';
import { fuseRetrieval } from './fusion.js';
import type { Claim } from './types.js';

function anchorFor(text: string): Claim['anchor'] {
  const needle = 'anchor';
  const u = text.indexOf(needle);
  const b = Buffer.byteLength(text.slice(0, u), 'utf8');
  return {
    chunkId: 'k1',
    byteStart: b,
    byteEnd: b + Buffer.byteLength(needle, 'utf8'),
    utf16Start: u,
    utf16End: u + needle.length,
  };
}

describe('AgentRuntime end-to-end', () => {
  it('produces a grounded answer and an intact trace in strict mode', async () => {
    const rt = new AgentRuntime('strict');
    const claims: Claim[] = [
      { id: 'c1', text: 'this claim has an anchor', anchor: anchorFor('this claim has an anchor') },
    ];
    const res = await rt.run({
      task: 'summarize the anchor',
      lexical: ['c3', 'c1', 'c5'],
      semantic: ['c1', 'c3', 'c5'],
      claims,
    });
    expect(res.mode).toBe('strict');
    expect(res.gate.blocked).toBe(false);
    expect(res.answer).toContain('Grounded answer');
    expect(res.fused.length).toBe(3);
    expect(res.traceIntact).toBe(true);
    // Trace must reconstruct the ordered spans.
    expect(res.trace.length).toBeGreaterThanOrEqual(4);
  });

  it('blocks in strict mode when a claim is ungrounded', async () => {
    const rt = new AgentRuntime('strict');
    const res = await rt.run({
      task: 'x',
      lexical: ['a', 'b'],
      semantic: ['b', 'a'],
      claims: [{ id: 'u1', text: 'no anchor here' }],
    });
    expect(res.gate.blocked).toBe(true);
    expect(res.answer).toBe('');
  });

  it('reports the clamped thread count (AC-02/03)', () => {
    const rt = new AgentRuntime('strict');
    expect(rt.getThreads()).toBeGreaterThanOrEqual(2);
    expect(rt.getThreads()).toBeLessThanOrEqual(4);
  });

  it('fusion still protects the champion when invoked through the kernel', () => {
    const fused = fuseRetrieval({
      lexical: ['c3', 'c1', 'c5'],
      semantic: ['c1', 'c3', 'c5'],
      rerank: ['c5', 'c1', 'c3'],
      w: 0.5,
    });
    expect(fused[0]!.id).toBe('c3');
  });
});
