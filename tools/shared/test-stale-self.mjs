// A service that outlives a change to a file it bound restarts itself, once idle and only when supervised:
// stale-self.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
const { restartWhenStale, hold, held, askIdle } = await import('./stale-self.mjs');
let n = 0;
const ok = (name, cond) => { assert.ok(cond, name); n++; console.log(`ok ${name}`); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stale-self-'));
const entry = path.join(dir, 'server.mjs'), dep = path.join(dir, 'rules.mjs'), late = path.join(dir, 'late.mjs');
fs.writeFileSync(entry, "import { x } from './rules.mjs';\n");
fs.writeFileSync(dep, 'export const x = 1;\n');
fs.writeFileSync(late, 'export const y = 1;\n');
const start = Date.now() - 1000;
const past = new Date(start - 60000);
for (const f of [entry, dep, late]) fs.utimesSync(f, past, past);
const touch = (f, at = new Date()) => fs.utimesSync(f, at, at);
const server = (opts = {}) => {
  const s = new EventEmitter();
  Object.assign(s, { closed: false, idle: false, all: false,
    close(cb) { s.closed = true; if (!opts.stuck) setTimeout(cb, 5); }, closeIdleConnections() { s.idle = true; }, closeAllConnections() { s.all = true; } });
  return s;
};
const run = ({ act, entries = [entry], supervised = true, busy, servers = [server()], wait = 300, onStale, give = 2000 } = {}) => new Promise((done) => {
  const said = [];
  let t;
  const end = (code) => { clearTimeout(t && t.timer); done({ code, servers, said }); };
  t = restartWhenStale(entries, { servers, busy, onStale, supervised, start, every: 10, idleEvery: 10, giveUp: give, log: (m) => said.push(m), exit: end });
  if (act) setTimeout(act, 20);
  setTimeout(() => end(null), wait);
});
ok('nothing bound has changed: it keeps serving', (await run()).code === null);
let r = await run({ act: () => touch(dep) });
ok('a file it imports changed: its servers close, idle connections first, and it exits 0 saying which file', r.code === 0 && r.servers[0].closed && r.servers[0].idle && /rules\.mjs/.test(r.said.join()));
for (const f of [entry, dep]) touch(f, past);
r = await run({ act: () => touch(late), entries: [entry, late] });
ok('a file it loads by a built path is followed when named as an entry', r.code === 0);
touch(late, past);
r = await run({ act: () => touch(dep), supervised: false });
touch(dep, past);
ok('a copy nothing supervises says it is stale and keeps serving: nothing would bring it back', r.code === null && !r.servers[0].closed && /restart it/.test(r.said.join()));
let busy = true;
r = await run({ act: () => { touch(dep); setTimeout(() => { busy = false; }, 100); }, busy: () => busy, wait: 400 });
touch(dep, past);
ok('stale while busy: it waits for the work, then restarts', r.code === 0);
busy = true;
r = await run({ act: () => touch(dep), busy: () => busy, wait: 200 });
touch(dep, past);
ok('stale and never idle: it keeps serving, never cutting the work', r.code === null && !r.servers[0].closed);
const release = hold();
r = await run({ act: () => touch(dep), wait: 150 });
touch(dep, past);
release();
ok('work held by hold() keeps it serving until released', r.code === null);
let finish;
const wrapped = held(() => new Promise((res) => { finish = res; }));
wrapped();
r = await run({ act: () => { touch(dep); setTimeout(() => finish(), 80); }, wait: 400 });
touch(dep, past);
ok('a handler wrapped by held() counts as work until its promise settles', r.code === 0);
touch(dep, new Date(Date.now() + 3600e3));
r = await run({ wait: 120 });
touch(dep, past);
ok('a file dated in the future is not read as changed: no restart every minute', r.code === null);
let told = 0;
r = await run({ act: () => touch(dep), onStale: () => told++ });
touch(dep, past);
ok('onStale is told once, when it first finds the change', r.code === 0 && told === 1);
const stuck = server({ stuck: true });
r = await run({ act: () => touch(dep), servers: [stuck], give: 60, wait: 400 });
touch(dep, past);
ok('a close that never returns, after the work is done, ends every connection and exits rather than stand not listening', r.code === 0 && stuck.all);
const up = server(), sock = new EventEmitter();
sock.destroyed = false; sock.destroy = () => { sock.destroyed = true; };
r = await run({ act: () => { up.emit('upgrade', {}, sock); touch(dep); }, servers: [up] });
touch(dep, past);
ok('an upgraded socket (the plugin\'s, which reconnects itself) is ended so close can return', r.code === 0 && sock.destroyed);
// the parent's busy: every child answers the latest ask idle, or it waits; a child that never answers, or is busy, holds it
const child = (state) => { const c = new EventEmitter(); c.state = state; c.send = (m) => { if (m.idleAsked && c.state !== 'silent') setTimeout(() => c.emit('message', { idleSaid: m.idleAsked, idle: c.state === 'idle' }), 1); }; return c; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
{
  const a = child('idle'), b = child('busy'), kids = new Set([a, b]), busyNow = askIdle(kids);
  busyNow(); await wait(10);
  const one = busyNow(); await wait(10);
  b.state = 'idle'; busyNow(); await wait(10);
  const two = busyNow(); await wait(10);
  const c = child('silent'); kids.add(c);
  const three = busyNow(); await wait(10);
  const four = busyNow();
  ok('a parent is busy while any child is busy or silent, idle once every child said so to the latest ask, and with no child', one && !two && three && four && !askIdle(new Set())());
}
// work begun while the servers close (a build a timer fired) is let finish before the exit
{
  let rel;
  const closing = server();
  closing.close = (cb) => { closing.closed = true; rel = hold(); setTimeout(cb, 5); setTimeout(() => rel(), 60); };
  const t0 = Date.now();
  r = await run({ act: () => touch(dep), servers: [closing], wait: 400 });
  touch(dep, past);
  ok('work that begins while it closes is let finish before it exits', r.code === 0 && Date.now() - t0 >= 60);
}
{
  // a child whose channel has closed is not sent to, and an 'error' from a late send is heard, not thrown
  const gone = child('idle'); gone.connected = false; let sent = 0; gone.send = () => { sent++; };
  askIdle(new Set([gone]))();
  ok('a child whose channel closed is not asked, and its errors are heard', sent === 0 && gone.listenerCount('error') === 1);
  // supervision is asked at the time: a launchd label inherited by a process launchd did not start is no supervisor
  // (the label set, so what refuses it is the parent not being launchd: this test's parent is a shell or a runner)
  const said = [], was = process.env.XPC_SERVICE_NAME;
  process.env.XPC_SERVICE_NAME = 'com.toolkit.test-label';
  const t = restartWhenStale([entry], { label: 'com.toolkit.test-label', start, every: 10, log: (m) => said.push(m), exit: () => said.push('exit') });
  touch(dep); await wait(60); clearTimeout(t.timer); touch(dep, past);
  if (was === undefined) delete process.env.XPC_SERVICE_NAME; else process.env.XPC_SERVICE_NAME = was;
  ok('launchd\'s label inherited by a process launchd did not start supervises nothing', (typeof process.send === 'function' || process.ppid === 1) || (!said.includes('exit') && /restart it/.test(said.join())));
}
// asked from outside (the dashboards check, through the service's route): it looks now, not at its next minute's look
{
  const ask = (opts) => new Promise((done) => {
    let answer, t;
    t = restartWhenStale([entry], { servers: [server()], start, every: 60000, idleEvery: 10, log: () => {}, exit: (c) => { clearTimeout(t.timer); done({ code: c, answer }); }, ...opts });
    answer = t.now();
    setTimeout(() => { clearTimeout(t.timer); done({ code: null, answer }); }, 300);
  });
  r = await ask({ supervised: true });
  ok('asked while nothing changed: not stale, it keeps serving', r.code === null && r.answer.stale === false);
  touch(dep);
  r = await ask({ supervised: true });
  ok('asked while stale and idle: it says so and restarts at once, not a minute later', r.code === 0 && r.answer.stale && r.answer.supervised);
  r = await ask({ supervised: false });
  ok('asked while stale with nothing to bring it back: it says so and keeps serving', r.code === null && r.answer.stale && !r.answer.supervised);
  let b = true;
  r = await ask({ supervised: true, busy: () => b });
  ok('asked while stale and busy: it keeps serving the work', r.code === null && r.answer.stale);
  touch(dep, past);
}
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
