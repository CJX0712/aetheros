// packages/core/src/index.ts
// Public API for @aetheros/core — the local-first agent runtime kernel.

export * from './types.js';
export { fuseRetrieval, RRF_K, RERANK_WEIGHT, PRIMARY_PRIORITY } from './fusion.js';
export { EvidenceGate, sliceEvidence } from './evidence.js';
export { Trace } from './trace.js';
export { NetPolicy } from './net.js';
export {
  autoThreads,
  writeProfile,
  readProfile,
  resolvePort,
  resolveModel,
  MIN_THREADS,
  MAX_THREADS,
  FALLBACK_PORTS,
} from './infer.js';
export type { InferProfile, ModelResolution } from './infer.js';
export { SkillLineage } from './evolver.js';
export type { SkillVersion, Experiment } from './evolver.js';
export { AgentRuntime } from './runtime.js';
export type { RunInput, RunResult, GenerateInput, Generator } from './runtime.js';
