// scripts/offline-guard.mjs
// AC-01 离线底线执行器 + 出站计数器。
//
// 用法：node --import ./scripts/offline-guard.mjs <runner>
//   - 阻断一切非回环（off-host）的出站行为：net / http / https / tls / fetch / dns
//   - 回环地址放行，AC-14 的端口回退测试（8765 / 8801 / 9000）不受影响
//   - 真实计数：globalThis.__AOS_OUTBOUND__ 为计费器，进程退出时打印，默认必须是 0
//   - 通过 NODE_OPTIONS 自传播，vitest 的 worker 与子进程同样受控
//
// 逃生开关：AOS_OFFLINE_GUARD=0 时整体失效（仅用于排查，CI 禁止设置）。

const DISABLED = process.env.AOS_OFFLINE_GUARD === '0';
const LOCAL_HOSTS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost', '0.0.0.0', '::']);

const state = (globalThis.__AOS_NET__ ??= { outbound: 0, local: 0, blocked: [] });

if (!DISABLED && !globalThis.__AOS_OFFLINE_GUARD__) {
  globalThis.__AOS_OFFLINE_GUARD__ = true;

  // 让子进程 / worker 继承本守卫
  const selfUrl = new URL(import.meta.url).href;
  const inherited = process.env.NODE_OPTIONS ?? '';
  if (!inherited.includes(selfUrl)) {
    process.env.NODE_OPTIONS = `${inherited} --import ${selfUrl}`.trim();
  }

  const isLocal = (host) => host === undefined || host === null || host === '' || LOCAL_HOSTS.has(String(host).toLowerCase());

  const block = (kind, host) => {
    state.outbound += 1;
    const target = `${kind} -> ${host}`;
    if (state.blocked.length < 20) state.blocked.push(target);
    throw new Error(`[offline-guard] 出站请求被拦截：${target}。AC-01 要求未配置 OTLP 导出端点时零出站。`);
  };

  const guardHost = (kind, host) => {
    if (isLocal(host)) {
      state.local += 1;
      return host;
    }
    return block(kind, host);
  };

  const hostOfOptions = (a, b) => {
    if (typeof b === 'string' && b !== '') return b;
    if (typeof a === 'string' || a instanceof URL) return new URL(String(a), 'http://localhost').hostname;
    if (a && typeof a === 'object') return a.host ?? a.hostname ?? a.servername;
    return b;
  };

  const net = await import('node:net');
  const tls = await import('node:tls');
  const dns = await import('node:dns');
  const http = await import('node:http');
  const https = await import('node:https');

  const originalConnect = net.connect;
  const guardedConnect = (...args) => {
    const host = hostOfOptions(args[0], args[1]?.host ?? args[1]?.hostname);
    guardHost('net.connect', host);
    return originalConnect(...args);
  };
  net.connect = guardedConnect;
  net.createConnection = guardedConnect;

  const originalTls = tls.connect;
  tls.connect = (...args) => {
    const host = hostOfOptions(args[0], args[0]?.host ?? args[0]?.hostname ?? args[0]?.servername);
    guardHost('tls.connect', host);
    return originalTls(...args);
  };

  const originalLookup = dns.lookup;
  dns.lookup = (hostname, ...rest) => {
    guardHost('dns.lookup', hostname);
    return originalLookup(hostname, ...rest);
  };

  for (const mod of [http, https]) {
    for (const method of ['request', 'get']) {
      const original = mod[method];
      mod[method] = (...args) => {
        const host = hostOfOptions(args[0], args[1]?.host ?? args[1]?.hostname);
        guardHost(`http${mod === https ? 's' : ''}.${method}`, host);
        return original(...args);
      };
    }
  }

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : String(input?.url ?? '');
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      host = '';
    }
    guardHost('fetch', host);
    return originalFetch(input, init);
  };

  process.on('exit', () => {
    const verdict = state.outbound === 0 ? '[PASS]' : '[FAIL]';
    console.log(`${verdict} offline: 出站请求 ${state.outbound} 次 / 回环 ${state.local} 次`);
    if (state.blocked.length > 0) for (const b of state.blocked) console.log(`  blocked ${b}`);
  });
}

Object.defineProperty(globalThis, '__AOS_OUTBOUND__', {
  configurable: true,
  get: () => state.outbound,
});
