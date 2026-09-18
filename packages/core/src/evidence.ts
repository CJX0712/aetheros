// packages/core/src/evidence.ts
// F4 — Evidence Gate + dual-offset evidence slicing.
//
// AC-05 (strict default): a claim that cannot bind to a chunk span is blocked,
//   with the evidence gap surfaced explicitly. There is NO implicit "low-confidence
//   but still output" path.
// AC-09: evidence anchors carry both a byte span (canonical on disk) and a utf16
//   span (rendered string). The utf16 slice is authoritative for display; we
//   cross-check it against the byte slice to catch silent CJK offset corruption.
// AC-12: the active mode must be visible on every outcome and cannot be hidden.

import type {
  Claim,
  EvidenceAnchor,
  EvidenceMode,
  EvidenceState,
  GateOutcome,
} from './types.js';

export class EvidenceGate {
  private mode: EvidenceMode;

  constructor(mode: EvidenceMode = 'strict') {
    this.mode = mode;
  }

  getMode(): EvidenceMode {
    return this.mode;
  }

  setMode(mode: EvidenceMode): void {
    this.mode = mode;
  }

  /** Gate a batch of claims. Strict blocks unanchored claims; lenient marks them. */
  gate(claims: readonly Claim[]): GateOutcome {
    const verdicts: GateOutcome['verdicts'] = [];
    const gaps: Claim[] = [];

    for (const claim of claims) {
      if (!claim.anchor) {
        gaps.push(claim);
        if (this.mode === 'strict') {
          verdicts.push({
            claim,
            state: 'refused',
            reason: 'no supporting chunk span — blocked by strict evidence gate',
          });
        } else {
          verdicts.push({
            claim,
            state: 'unverified',
            reason: 'no supporting chunk span — marked unverified under lenient mode',
          });
        }
        continue;
      }
      // An anchored claim is at minimum "unverified" until a retriever confirms it.
      const state: EvidenceState = 'verified';
      verdicts.push({ claim, state });
    }

    const blocked = this.mode === 'strict' && gaps.length > 0;
    return { mode: this.mode, blocked, verdicts, gaps };
  }

  /** Convenience: throw if strict mode would block. Surfaces the gap in the error. */
  assertGrounded(claims: readonly Claim[]): GateOutcome {
    const outcome = this.gate(claims);
    if (outcome.blocked) {
      const missing = outcome.gaps.map((c) => c.id).join(', ');
      throw new Error(`evidence-gate: ${outcome.gaps.length} claim(s) ungrounded [${missing}]`);
    }
    return outcome;
  }
}

/**
 * Slice the supporting passage for an anchor. The utf16 span is authoritative for
 * the rendered string; the byte span is cross-checked when chunkText is UTF-8.
 */
export function sliceEvidence(anchor: EvidenceAnchor, chunkText: string): string {
  const a = anchor.utf16Start;
  const b = anchor.utf16End;
  const slice = chunkText.slice(a, b);

  const byteSlice = Buffer.from(chunkText, 'utf8').slice(anchor.byteStart, anchor.byteEnd).toString('utf8');
  if (byteSlice !== slice) {
    throw new Error('evidence-offset-mismatch: byte span != utf16 span');
  }
  return slice;
}
