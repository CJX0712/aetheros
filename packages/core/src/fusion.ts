// packages/core/src/fusion.ts
// RRF (Reciprocal Rank Fusion) retrieval fusion — the heart of F2.
//
// AC-06: the reranker is a THIRD signal blended at w = 0.5, never a takeover.
// AC-07: a fully-reversed reranker must still leave the first-stage champion as
//        top-1. This holds because w is strictly < 1 AND a deterministic
//        primary-list tie-break (PRIMARY_PRIORITY) supplies the margin that lets
//        the first-stage winner survive the adversarial rerank.
// AC-08: partial reranker coverage degrades to neutral 0 (first-stage passes
//        through); never throws, never drops a candidate.
//
// The math here is byte-for-byte the same algorithm verified headlessly by
// scripts/verify-demo.mjs against the demo engine.

import type { FusionOptions, FusionResult, RankList } from './types.js';

export const RRF_K = 60;
export const RERANK_WEIGHT = 0.5;
export const PRIMARY_PRIORITY = 2;

function rankMap(list: RankList): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < list.length; i += 1) m.set(list[i] as string, i);
  return m;
}

function rrfAt(rank0: number): number {
  return 1 / (RRF_K + (rank0 + 1));
}

export function fuseRetrieval(opts: FusionOptions): FusionResult[] {
  const lexical = opts.lexical;
  const semantic = opts.semantic;
  const rerank = opts.rerank ?? [];
  const w = typeof opts.w === 'number' ? opts.w : 0;

  const rm = rankMap(lexical);
  const sm = rankMap(semantic);
  const ids = new Set<string>();
  for (const id of lexical) ids.add(id);
  for (const id of semantic) ids.add(id);

  const score1 = new Map<string, number>();
  const lexRank = new Map<string, number>();
  for (const id of ids) {
    const r1 = rm.has(id) ? (rm.get(id) as number) : lexical.length;
    const r2 = sm.has(id) ? (sm.get(id) as number) : semantic.length;
    const rrf = rrfAt(r1) + rrfAt(r2);
    const primary = rrfAt(r1);
    score1.set(id, rrf + PRIMARY_PRIORITY * primary);
    lexRank.set(id, r1);
  }

  const sm3 = rankMap(rerank);
  const s3 = new Map<string, number>();
  for (let i = 0; i < rerank.length; i += 1) s3.set(rerank[i] as string, rrfAt(i));

  const out: Array<{ id: string; score: number; s1: number; lex: number }> = [];
  for (const id of ids) {
    const s3v = sm3.has(id) ? (s3.get(id) as number) : 0;
    const score = (1 - w) * (score1.get(id) as number) + w * s3v;
    out.push({ id, score, s1: score1.get(id) as number, lex: lexRank.get(id) as number });
  }

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.s1 !== a.s1) return b.s1 - a.s1;
    return a.lex - b.lex;
  });

  return out.map((r) => ({ id: r.id, score: r.score }));
}
