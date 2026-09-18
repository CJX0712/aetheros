// packages/core/src/net.ts
// AC-01 — Offline baseline billing counter.
//
// The hard interception lives in scripts/offline-guard.mjs (blocks non-loopback
// egress at the Node layer). This policy object is the in-process tally that the
// runtime reports: with no OTLP export endpoint configured, outbound MUST be 0.
// Loopback traffic is allowed and counted separately (AC-14 port fallbacks).

const LOCAL_HOSTS = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
  'localhost',
  '0.0.0.0',
  '::',
]);

export class NetPolicy {
  private outbound = 0;
  private local = 0;

  static isLocalHost(host: string | undefined | null): boolean {
    if (host === undefined || host === null || host === '') return true;
    return LOCAL_HOSTS.has(String(host).toLowerCase());
  }

  /** Record a connection attempt. Loopback is permitted; anything else is outbound. */
  count(host: string | undefined | null): void {
    if (NetPolicy.isLocalHost(host)) {
      this.local += 1;
    } else {
      this.outbound += 1;
    }
  }

  getOutbound(): number {
    return this.outbound;
  }

  getLocal(): number {
    return this.local;
  }

  /** AC-01 verdict: a runtime with no export endpoint configured must report 0. */
  isOfflineClean(): boolean {
    return this.outbound === 0;
  }
}
