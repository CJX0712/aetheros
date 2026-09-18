// packages/core/src/types.ts
// Shared types for the aetheros runtime kernel.
// Pure data contracts — no runtime imports except node: builtins elsewhere.

/** A ranked list of document ids. Index 0 is rank 1 (best). */
export type RankList = readonly string[];

/** A fused retrieval result, sorted by score descending. */
export interface FusionResult {
  id: string;
  score: number;
}

/** Options for the RRF fusion routine. */
export interface FusionOptions {
  lexical: RankList;
  semantic: RankList;
  /** Third signal (reranker). Optional; coverage gaps fall back to neutral 0. */
  rerank?: RankList;
  /** Reranker weight. Must be strictly < 1 so the first-stage champion is protected. */
  w?: number;
}

/** The five mutually-exclusive evidence states. "refused" is NOT an error. */
export type EvidenceState =
  | 'verified'
  | 'unverified'
  | 'refused'
  | 'failed'
  | 'system-error';

/** Evidence gating mode. Strict blocks unanchored claims; lenient marks them. */
export type EvidenceMode = 'strict' | 'lenient';

/** Dual-offset anchor: byte span is canonical on disk, utf16 span is rendered. */
export interface EvidenceAnchor {
  chunkId: string;
  byteStart: number;
  byteEnd: number;
  utf16Start: number;
  utf16End: number;
}

/** A single claim the runtime must be able to ground to evidence. */
export interface Claim {
  id: string;
  text: string;
  anchor?: EvidenceAnchor;
}

/** Outcome of gating a batch of claims. */
export interface GateOutcome {
  mode: EvidenceMode;
  blocked: boolean;
  /** Per-claim verdicts with their resolved state. */
  verdicts: Array<{ claim: Claim; state: EvidenceState; reason?: string }>;
  /** Claims that have no supporting anchor (the evidence gap). */
  gaps: Claim[];
}

/** A single append-only trace link, bound to its predecessor by hash. */
export interface HashLink {
  seq: number;
  prevHash: string | null;
  hash: string;
  record: unknown;
}

/** One span in the local agent trace. */
export interface TraceSpan {
  spanId: string;
  kind: 'retrieve' | 'rerank' | 'generate' | 'gate' | 'tool' | 'agent';
  input?: unknown;
  output?: unknown;
  status: 'ok' | 'refused' | 'failed' | 'system-error';
  startedAt: number;
  endedAt: number;
}
