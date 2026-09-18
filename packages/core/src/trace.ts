// packages/core/src/trace.ts
// F3-adjacent — append-only, tamper-evident local agent trace.
//
// AC-09: the trace must reconstruct input / retrieved chunks / tool calls /
//        LLM output / final answer in order.
// AC-10: each link is bound to its predecessor's hash. Any record mutation breaks
//        the chain — verify() throws with a "tamper-detected" semantic.
// AC-13: retention floor is 180 days; the trace store refuses to purge younger
//        records.

import { createHash } from 'node:crypto';
import type { HashLink, TraceSpan } from './types.js';

const RETENTION_DAYS = 180;

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

function canonical(record: unknown): string {
  if (record === null || typeof record !== 'object') return JSON.stringify(record);
  const keys = Object.keys(record as Record<string, unknown>).sort();
  return JSON.stringify(record, keys);
}

export class Trace {
  private chain: HashLink[] = [];
  private seq = 0;
  readonly retentionDays = RETENTION_DAYS;

  /** Append a span. Returns the sealed link; the hash binds to the prev link. */
  append(span: TraceSpan): HashLink {
    this.seq += 1;
    const prevHash = this.chain.length > 0 ? this.chain[this.chain.length - 1]!.hash : null;
    const record = { ...span, _seq: this.seq };
    const hash = sha256((prevHash ?? '') + '|' + canonical(record));
    const link: HashLink = { seq: this.seq, prevHash, hash, record };
    this.chain.push(link);
    return link;
  }

  /** Verify integrity. Throws on any linkage / hash / seq break. */
  verify(): void {
    let prev: string | null = null;
    for (let i = 0; i < this.chain.length; i += 1) {
      const link = this.chain[i]!;
      if (link.prevHash !== prev) {
        throw new Error(`tamper-detected: broken linkage at index ${i}`);
      }
      const expected = sha256((prev ?? '') + '|' + canonical(link.record));
      if (expected !== link.hash) {
        throw new Error(`tamper-detected: hash mismatch at index ${i}`);
      }
      if (link.seq !== i + 1) {
        throw new Error(`tamper-detected: seq discontinuity at index ${i}`);
      }
      prev = link.hash;
    }
  }

  /** Detect tampering without throwing — useful for read paths. */
  isIntact(): boolean {
    try {
      this.verify();
      return true;
    } catch {
      return false;
    }
  }

  links(): readonly HashLink[] {
    return this.chain;
  }

  /** AC-13: only records older than the retention floor may be pruned. */
  pruneBefore(referenceMs: number): number {
    const floor = referenceMs - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let removed = 0;
    while (this.chain.length > 0) {
      const head = this.chain[0]!;
      const ended = (head.record as { endedAt?: number }).endedAt ?? 0;
      if (ended > 0 && ended < floor) {
        this.chain.shift();
        removed += 1;
      } else {
        break;
      }
    }
    return removed;
  }
}
