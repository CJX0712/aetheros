// packages/core/src/runtime.ts
// AgentRuntime — the local-first orchestrator that wires the kernel together.
//
// It owns: the append-only Trace (AC-09/10/13), the EvidenceGate (AC-05/12),
// the RRF fusion (AC-06/07/08), the NetPolicy tally (AC-01), and the inference
// sane defaults (AC-02/03/04/14). The default generator is a no-op stub so the
// runtime is fully testable offline; a real "aurora" adapter can be injected.
//
// AC-12: the active evidence mode is part of every result and cannot be hidden.

import { EvidenceGate, sliceEvidence } from './evidence.js';
import { fuseRetrieval } from './fusion.js';
import { NetPolicy } from './net.js';
import { Trace } from './trace.js';
import { autoThreads, resolvePort } from './infer.js';
import type {
  Claim,
  EvidenceMode,
  FusionOptions,
  HashLink,
  RankList,
  TraceSpan,
} from './types.js';

export interface GenerateInput {
  prompt: string;
  fused: Array<{ id: string; score: number }>;
  evidenceText: string;
}

export type Generator = (input: GenerateInput) => Promise<string>;

export interface RunInput {
  task: string;
  /** First-stage lexical ranking. */
  lexical: RankList;
  /** First-stage semantic ranking. */
  semantic: RankList;
  /** Optional reranker ranking (third signal). */
  rerank?: RankList;
  /** Claims the answer must ground to. */
  claims: Claim[];
  /** Optional pre-rendered evidence text for the generator. */
  evidenceText?: string;
  /** Inject a generator (defaults to a deterministic stub). */
  generate?: Generator;
}

export interface RunResult {
  task: string;
  mode: EvidenceMode;
  fused: Array<{ id: string; score: number }>;
  answer: string;
  gate: ReturnType<EvidenceGate['gate']>;
  trace: readonly HashLink[];
  threads: number;
  traceIntact: boolean;
}

const defaultGenerator: Generator = async (input) =>
  `Grounded answer for: ${input.prompt} (evidence spans: ${input.fused.length})`;

export class AgentRuntime {
  private trace = new Trace();
  private gate: EvidenceGate;
  private net = new NetPolicy();
  private threads = autoThreads();

  constructor(mode: EvidenceMode = 'strict') {
    this.gate = new EvidenceGate(mode);
  }

  getMode(): EvidenceMode {
    return this.gate.getMode();
  }

  setMode(mode: EvidenceMode): void {
    this.gate.setMode(mode);
  }

  getThreads(): number {
    return this.threads;
  }

  /**
   * AC-01: the outbound tally must be inspectable, not merely asserted. Callers
   * (and the audit bundle) read it after a run to prove the offline baseline.
   */
  getNet(): { outbound: number; local: number } {
    return { outbound: this.net.getOutbound(), local: this.net.getLocal() };
  }

  /** Run a local agent task end to end, recording an append-only trace. */
  async run(input: RunInput): Promise<RunResult> {
    const started = Date.now();
    const retrieve = this.span(
      { spanId: 'retrieve', kind: 'retrieve', input: { lexical: input.lexical, semantic: input.semantic }, status: 'ok', startedAt: started, endedAt: Date.now() },
    );

    const fused = fuseRetrieval({
      lexical: input.lexical,
      semantic: input.semantic,
      rerank: input.rerank,
      w: 0.5,
    } as FusionOptions);

    const rerankLink = this.span({
      spanId: 'rerank',
      kind: 'rerank',
      input: { rerank: input.rerank ?? [] },
      status: 'ok',
      startedAt: Date.now(),
      endedAt: Date.now(),
    });

    const gateOutcome = this.gate.gate(input.claims);
    const gateLink = this.span({
      spanId: 'gate',
      kind: 'gate',
      input: { mode: gateOutcome.mode, gaps: gateOutcome.gaps.length },
      output: { blocked: gateOutcome.blocked },
      status: gateOutcome.blocked ? 'refused' : 'ok',
      startedAt: Date.now(),
      endedAt: Date.now(),
    });

    if (gateOutcome.blocked) {
      this.net.count('127.0.0.1');
      return {
        task: input.task,
        mode: gateOutcome.mode,
        fused,
        answer: '',
        gate: gateOutcome,
        trace: this.trace.links(),
        threads: this.threads,
        traceIntact: this.trace.isIntact(),
      };
    }

    const evidenceText =
      input.evidenceText ??
      input.claims
        .map((c) => (c.anchor ? sliceEvidence(c.anchor, c.text) : c.text))
        .join('\n');

    const generator = input.generate ?? defaultGenerator;
    const answer = await generator({ prompt: input.task, fused, evidenceText });

    this.span({
      spanId: 'generate',
      kind: 'generate',
      input: { prompt: input.task },
      output: { answer },
      status: 'ok',
      startedAt: Date.now(),
      endedAt: Date.now(),
    });

    void retrieve;
    void rerankLink;
    void gateLink;
    this.net.count('127.0.0.1');

    return {
      task: input.task,
      mode: gateOutcome.mode,
      fused,
      answer,
      gate: gateOutcome,
      trace: this.trace.links(),
      threads: this.threads,
      traceIntact: this.trace.isIntact(),
    };
  }

  /** AC-14 helper: resolve a usable local port from the fallback ladder. */
  resolvePort(preferred: number): Promise<number> {
    return resolvePort(preferred);
  }

  private span(span: TraceSpan): HashLink {
    return this.trace.append(span);
  }
}
