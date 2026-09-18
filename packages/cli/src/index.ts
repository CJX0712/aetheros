#!/usr/bin/env node
// packages/cli/src/index.ts
// agentos — command line entry point for the aetheros local agent runtime.
//
// Commands:
//   agentos run    [--task T] [--lexical a,b,c] [--semantic c,b,a] [--rerank ...]
//                  [--strict | --lenient]   run a local grounded task
//   agentos bench                                    measure a one-shot profile
//   agentos version                                  print version
//
// The CLI is a thin shell over @aetheros/core; it performs NO network calls, so
// it stays within the AC-01 offline baseline.

import {
  AgentRuntime,
  autoThreads,
  writeProfile,
  type Claim,
  type RankList,
  type EvidenceMode,
} from '@aetheros/core';

interface Parsed {
  _: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): Parsed {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i] as string;
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const eq = key.indexOf('=');
      if (eq >= 0) {
        flags[key.slice(0, eq)] = key.slice(eq + 1);
      } else if (i + 1 < argv.length && !(argv[i + 1] as string).startsWith('--')) {
        flags[key] = argv[i + 1] as string;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(tok);
    }
  }
  return { _: positional, flags };
}

function toList(value: unknown): RankList {
  if (typeof value !== 'string' || value.trim() === '') return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function cmdRun(parsed: Parsed): void {
  const task = typeof parsed.flags.task === 'string' ? parsed.flags.task : 'demo task';
  const lexical = toList(parsed.flags.lexical);
  const semantic = toList(parsed.flags.semantic);
  const rerank = toList(parsed.flags.rerank);
  const mode: EvidenceMode = parsed.flags.lenient ? 'lenient' : 'strict';

  const rt = new AgentRuntime(mode);
  // A sample grounded claim so the strict gate has something to accept.
  const claims: Claim[] = [
    { id: 'c1', text: 'local agents refuse unsourced claims by default' },
  ];

  rt.run({ task, lexical, semantic, rerank, claims })
    .then((res) => {
      const out = {
        task: res.task,
        mode: res.mode,
        threads: res.threads,
        fusedTop: res.fused.slice(0, 3),
        gateBlocked: res.gate.blocked,
        traceSpans: res.trace.length,
        traceIntact: res.traceIntact,
        answer: res.answer,
      };
      process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    })
    .catch((err: unknown) => {
      process.stderr.write(`agentos run failed: ${(err as Error).message}\n`);
      process.exit(1);
    });
}

function cmdBench(): void {
  const threads = autoThreads();
  const nBatch = 256;
  const ctx = 4096;
  const tokens = 4096;
  // Synthetic throughput probe: time a deterministic workload (token emulation).
  const start = process.hrtime.bigint();
  let acc = 0;
  for (let i = 0; i < tokens * 1024; i += 1) acc += (i * 31) % 17;
  const end = process.hrtime.bigint();
  const seconds = Number(end - start) / 1e9;
  const tokPerSec = seconds > 0 ? tokens / seconds : 0;
  void acc;

  const path = writeProfile({ threads, nBatch, ctx, tokPerSec, measuredAt: new Date().toISOString() });
  process.stdout.write(
    `bench: threads=${threads} n_batch=${nBatch} ctx=${ctx} -> ${tokPerSec.toFixed(1)} tok/s\nprofile written: ${path}\n`,
  );
}

function cmdVersion(): void {
  process.stdout.write('agentos 0.1.0 (aetheros local agent runtime)\n');
}

function main(): void {
  const [, , cmd = 'version', ...rest] = process.argv;
  const parsed = parseArgs(rest);
  switch (cmd) {
    case 'run':
      cmdRun(parsed);
      break;
    case 'bench':
      cmdBench();
      break;
    case 'version':
    case '--version':
    case '-v':
      cmdVersion();
      break;
    default:
      process.stderr.write(`unknown command: ${cmd}\nusage: agentos <run|bench|version>\n`);
      process.exit(2);
  }
}

main();
