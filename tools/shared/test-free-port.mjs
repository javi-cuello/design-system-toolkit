#!/usr/bin/env node
// node tools/shared/test-free-port.mjs — a port held on any one interface is not free, and the list is read in order.
import assert from 'node:assert/strict';
import net from 'node:net';
import { freePort, isFree, onFreePort } from './free-port.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const hold = (port, host) => new Promise((done, fail) => { const s = net.createServer(); s.once('error', fail); s.listen(host ? { port, host } : { port }, () => done(s)); });

const p = await freePort();
ok('with no list, a port the system picks, free', p > 0 && (await isFree(p)));
for (const host of [undefined, '127.0.0.1', '::1']) {
  let s;
  try { s = await hold(p, host); } catch (e) { if (host === '::1') { console.log('skip: no ::1 here, so a port held there only is not tried'); continue; } throw e; }
  ok(`a port held on ${host || 'every interface'} is not free`, !(await isFree(p)));
  await new Promise((r) => s.close(r));
}
const q = await freePort();
const s = await hold(q, '127.0.0.1');
ok('the first free port of the list, held ones passed over', (await freePort([q, p])) === p);
ok('none of the list free: 0', (await freePort([q])) === 0);
await new Promise((r) => s.close(r));

// a port taken between the probe and the bind: the next is tried; any other failure is thrown
const [a, b] = [await freePort(), await freePort()];
const tried = [];
const got = await onFreePort([a, b], async (port) => { tried.push(port); if (port === a) throw new Error(`listen EADDRINUSE: address already in use :::${port}`); return 'up'; });
ok('a refusal for the port in use moves to the next', got && got.port === b && got.value === 'up' && tried.join() === `${a},${b}`);
ok('no port that would do: null', (await onFreePort([a], async () => { throw new Error('Port 1 is already in use'); })) === null);
let thrown = null;
try { await onFreePort([a, b], async () => { throw new Error('the service never started'); }); } catch (e) { thrown = e; }
ok('any other failure is thrown, never retried', thrown && /never started/.test(thrown.message));
console.log(`${n}/${n} passed`);
