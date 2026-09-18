// scripts/offline-guard.mjs
// AC-01 离线底线执行器 + 出站计数器。
//
// 用法：node --import ./scripts/offline-guard.mjs <runner>
//   - 阻断一切非回环（off-host）的出站行为：net / tls / http / https / dns / fetch
//   - 回环地址放行，AC-14 的端口回退测试（8765 / 8801 / 9000）不受影响
//   - 真实计数：globalThis.__AOS_OUTBOUND__ 为计费器，进程退出时打印，默认必须是 0
//   - 通过 NODE_OPTIONS 自传播，vitest 的 worker 与子进程同样受控
//
// 逃生开关：AOS_OFFLINE_GUARD=0 时整体失效（仅用于排查，CI 禁止设置）。
//
// 拦截点选择依据（node 22 实测，勿凭直觉改动）：
//   1. ESM 的模块命名空间对象是只读的 —— `await import('node:net')` 得到的是冻结命名空间，
//      对其赋值抛 "Cannot assign to read only property"。因此所有 monkey-patch 必须走
//      createRequire 拿到的 CJS 导出对象（实测各属性 writable=true）。
//   2. 只补 CJS 导出对象是不够的：ESM 消费者 `import { connect } from 'node:net'` 在链接期
//      就固化了原函数，改导出对象对它无效（实测 netEsm.connect === 原始 cjs connect）。
//   3. 真正的收敛点是 net.Socket.prototype.connect —— 实测补它能同时拦到
//      net.connect(CJS) / net.connect(ESM) / createConnection / tls.connect / http.get / https.get。
//   4. globalThis.fetch（undici）不走 Socket.prototype，必须单独补。

const DISABLED = process.env.AOS_OFFLINE_GUARD === '0';
const LOCAL_HOSTS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost', '0.0.0.0', '::']);

const state = (globalThis.__AOS_NET__ ??= { outbound: 0, local: 0, blocked: [], patchFailures: [] });

if (!DISABLED && !globalThis.__AOS_OFFLINE_GUARD__) {
  globalThis.__AOS_OFFLINE_GUARD__ = true;

  // 让子进程 / worker 继承本守卫
  const selfUrl = new URL(import.meta.url).href;
  const inherited = process.env.NODE_OPTIONS ?? '';
  if (!inherited.includes(selfUrl)) {
    process.env.NODE_OPTIONS = `${inherited} --import ${selfUrl}`.trim();
  }

  const isLocal = (host) =>
    host === undefined || host === null || host === '' || LOCAL_HOSTS.has(String(host).toLowerCase());

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

  /**
   * 解析 connect 家族的首个 host。
   * 覆盖 Node 的三种调用形态：({host}, cb) / (port, host, cb) / (path, cb)，
   * 以及 net.connect 内部把规范化后的参数数组转交给 socket.connect 的形态。
   */
  const hostFromConnectArgs = (args) => {
    const first = args[0];
    const normalized = Array.isArray(first) ? first : null;
    const a = normalized ? normalized[0] : first;
    const b = normalized ? normalized[1] : args[1];
    // (port, host)
    if (typeof b === 'string' && b !== '') return b;
    // (port) —— host 缺省为 localhost
    if (typeof a === 'number') return undefined;
    // (path) —— IPC / unix socket，无 host
    if (typeof a === 'string') return undefined;
    if (a instanceof URL) return a.hostname;
    if (a && typeof a === 'object') return a.host ?? a.hostname ?? a.servername;
    return undefined;
  };

  const hostFromUrlArg = (a, b) => {
    if (typeof b === 'string' && b !== '') return b;
    if (typeof a === 'string' || a instanceof URL) {
      try {
        return new URL(String(a), 'http://localhost').hostname;
      } catch {
        return undefined;
      }
    }
    if (a && typeof a === 'object') return a.host ?? a.hostname ?? a.servername;
    return undefined;
  };

  // createRequire：ESM 命名空间只读，只能改 CJS 导出对象
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);

  /** 补一个属性；失败则记账（退出时整体判定 FAIL），不静默吞掉 */
  const patch = (obj, key, make) => {
    try {
      const original = obj[key];
      if (typeof original !== 'function') throw new Error(`${key} 不是函数`);
      obj[key] = make(original);
    } catch (err) {
      state.patchFailures.push(`${key}: ${err.message}`);
    }
  };

  const net = require('node:net');
  const tls = require('node:tls');
  const dns = require('node:dns');
  const http = require('node:http');
  const https = require('node:https');

  // 主收敛点：所有 TCP/TLS 连接最终都落到 Socket.prototype.connect
  patch(net.Socket.prototype, 'connect', (original) => function (...args) {
    guardHost('socket.connect', hostFromConnectArgs(args));
    return original.apply(this, args);
  });

  patch(net, 'connect', (original) => function (...args) {
    guardHost('net.connect', hostFromConnectArgs(args));
    return original.apply(this, args);
  });
  patch(net, 'createConnection', (original) => function (...args) {
    guardHost('net.createConnection', hostFromConnectArgs(args));
    return original.apply(this, args);
  });

  patch(tls, 'connect', (original) => function (...args) {
    guardHost('tls.connect', hostFromConnectArgs(args));
    return original.apply(this, args);
  });

  patch(dns, 'lookup', (original) => function (hostname, ...rest) {
    guardHost('dns.lookup', hostname);
    return original.call(this, hostname, ...rest);
  });
  patch(dns.promises, 'lookup', (original) => function (hostname, ...rest) {
    guardHost('dns.promises.lookup', hostname);
    return original.call(this, hostname, ...rest);
  });

  patch(http, 'request', (original) => function (...args) {
    guardHost('http.request', hostFromUrlArg(args[0], args[1]?.host ?? args[1]?.hostname));
    return original.apply(this, args);
  });
  patch(http, 'get', (original) => function (...args) {
    guardHost('http.get', hostFromUrlArg(args[0], args[1]?.host ?? args[1]?.hostname));
    return original.apply(this, args);
  });
  patch(https, 'request', (original) => function (...args) {
    guardHost('https.request', hostFromUrlArg(args[0], args[1]?.host ?? args[1]?.hostname));
    return original.apply(this, args);
  });
  patch(https, 'get', (original) => function (...args) {
    guardHost('https.get', hostFromUrlArg(args[0], args[1]?.host ?? args[1]?.hostname));
    return original.apply(this, args);
  });

  // undici 的 fetch 不经过 Socket.prototype，单独补
  patch(globalThis, 'fetch', (original) => function (input, init) {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url ?? '';
    let host = '';
    try {
      host = new URL(String(raw)).hostname;
    } catch {
      host = '';
    }
    guardHost('fetch', host);
    return original.call(this, input, init);
  });

  process.on('exit', () => {
    const ok = state.outbound === 0 && state.patchFailures.length === 0;
    console.log(`${ok ? '[PASS]' : '[FAIL]'} offline: 出站请求 ${state.outbound} 次 / 回环 ${state.local} 次`);
    if (state.blocked.length > 0) for (const b of state.blocked) console.log(`  blocked ${b}`);
    if (state.patchFailures.length > 0) {
      for (const f of state.patchFailures) console.log(`  patch failed ${f}`);
    }
  });
}

Object.defineProperty(globalThis, '__AOS_OUTBOUND__', {
  configurable: true,
  get: () => state.outbound,
});
