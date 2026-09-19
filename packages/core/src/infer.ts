// packages/core/src/infer.ts
// F1 + AC-02/03/04/14 — local CPU inference sane defaults (the "aurora" engine).
//
// AC-02: thread count is auto-derived and clamped to [2, 4]. Small quantized
//        models are bandwidth-bound, not compute-bound; 4 threads beats 16 by ~4x.
// AC-03: autoThreads() MUST always return within [2, 4]. A caller that expects an
//        out-of-window value to be honored gets a named failure instead.
// AC-04: bench writes a one-shot profile (~/.aetheros/profile.json) with threads,
//        n_batch, ctx, and measured tok/s.
// AC-14: port selection falls back along 8765 / 8801 / 9000 when a port is taken.

import { cpus } from 'node:os';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';

export const MIN_THREADS = 2;
export const MAX_THREADS = 4;
export const FALLBACK_PORTS = [8765, 8801, 9000];

export interface InferProfile {
  threads: number;
  n_batch: number;
  ctx: number;
  tokPerSec: number;
  measuredAt: string;
}

/** AC-02/03: derive and clamp thread count. Never returns outside [2, 4]. */
export function autoThreads(requested?: number): number {
  if (requested !== undefined && (requested < MIN_THREADS || requested > MAX_THREADS)) {
    throw new Error(
      `autoThreads: requested ${requested} is outside the clamp window [${MIN_THREADS}, ${MAX_THREADS}]`,
    );
  }
  const cores = Math.max(1, cpus().length);
  const raw = requested ?? Math.max(1, cores - 1);
  const clamped = Math.min(MAX_THREADS, Math.max(MIN_THREADS, raw));
  return clamped;
}

function profilePath(): string {
  return join(homedir(), '.aetheros', 'profile.json');
}

/** AC-04: persist a one-shot performance profile. */
export function writeProfile(profile: InferProfile): string {
  const dir = join(homedir(), '.aetheros');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(profilePath(), JSON.stringify(profile, null, 2), 'utf8');
  return profilePath();
}

export function readProfile(): InferProfile | null {
  try {
    if (!existsSync(profilePath())) return null;
    return JSON.parse(readFileSync(profilePath(), 'utf8')) as InferProfile;
  } catch {
    return null;
  }
}

export interface ModelResolution {
  ok: boolean;
  path: string;
  /**
   * True when the failure is transient (e.g. the weights have not been fetched
   * yet) and the caller may retry. A missing file is NEVER a hard abort.
   */
  retryable: boolean;
  reason?: string;
}

/**
 * AC-14: resolve a local model path without aborting. A missing weights file is
 * a retryable state — the loader stays armed so a later download can satisfy it.
 */
export function resolveModel(path: string): ModelResolution {
  if (existsSync(path)) return { ok: true, path, retryable: false };
  return { ok: false, path, retryable: true, reason: 'model file not found' };
}

/** AC-14: pick the first usable port from the fallback ladder. */
export function resolvePort(preferred: number): Promise<number> {
  const candidates = [preferred, ...FALLBACK_PORTS.filter((p) => p !== preferred)];
  const tryOnce = (port: number): Promise<number> =>
    new Promise((resolve, reject) => {
      const srv = createServer();
      srv.once('error', reject);
      srv.once('listening', () => {
        srv.close(() => resolve(port));
      });
      srv.listen(port, '127.0.0.1');
    });
  return candidates.reduce<Promise<number>>(
    (chain, port) => chain.catch(() => tryOnce(port)),
    Promise.reject<number>(new Error('no port available')),
  );
}
