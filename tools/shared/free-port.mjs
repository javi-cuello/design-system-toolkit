/*
 * tools/shared/free-port.mjs — the one free-port probe the toolkit's tests use.
 *
 *   await freePort([9223, 9224, …])   the first port of the list free on every interface, or 0
 *   await freePort()                  a port the system picks, free on every interface when it was asked
 *   await onFreePort([…], start)      a server started on the first of the list it can bind, the next tried on a refusal
 *
 * A port is free only when it can be bound on every interface (all of them, then
 * 127.0.0.1 and ::1 each): a probe of 127.0.0.1 alone passed a port that
 * figma-console's bridge held on another one, and `localhost` then reached the
 * bridge instead of the test's own server (2026-11-01). A host this machine
 * does not have (no IPv6) is not counted against the port. Free when asked is
 * not reserved: a caller that starts a server on it still handles a refusal.
 */
import net from 'node:net';

const MISSING = new Set(['EADDRNOTAVAIL', 'EAFNOSUPPORT']);
const bindable = (port, host) => new Promise((done) => {
  const s = net.createServer();
  s.once('error', (e) => done(MISSING.has(e.code) && host !== undefined));
  s.listen(host === undefined ? { port } : { port, host }, () => s.close(() => done(true)));
});

export async function isFree(port) {
  for (const host of [undefined, '127.0.0.1', '::1']) if (!(await bindable(port, host))) return false;
  return true;
}

// the system's pick is made on 127.0.0.1, then held to the same rule as a listed port: one taken on ::1 is passed over
const picked = () => new Promise((done, fail) => { const s = net.createServer(); s.once('error', fail); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => done(p)); }); });
export async function freePort(ports) {
  if (!ports) { for (let i = 0; i < 20; i++) { const p = await picked(); if (await isFree(p)) return p; } throw new Error('no port the system picked was free on every interface, 20 times'); }
  for (const p of ports) if (await isFree(p)) return p;
  return 0;
}

/* A server started on the first free port of the list that takes it: `start(port)` resolves once it is up, and a
   refusal naming the port in use (EADDRINUSE, or the audit service's "already in use") moves to the next, since a
   port free when probed can be taken before the server binds it. Anything else is thrown. `{ port, value }`, or
   null when no port of the list would do. */
export async function onFreePort(ports, start) {
  for (const port of ports) {
    if (!(await isFree(port))) continue;
    try { return { port, value: await start(port) }; } catch (e) { if (!/EADDRINUSE|already in use/.test(String((e && e.message) || e))) throw e; }
  }
  return null;
}
