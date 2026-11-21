#!/usr/bin/env node
// lock.mjs: one measuring run at a time; a waiter says who holds it; a holder that dies lets go at once.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
process.env.TOOLKIT_LOCK_DIR = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'test-lock-')));
delete process.env.TOOLKIT_LOCK_HELD;
process.env.TOOLKIT_LOCK_SLOTS = '1';
const { holder } = await import('./lock.mjs');
const LOCK = path.join(HERE, 'lock.mjs');
const env = { ...process.env };
const until = async (f) => { for (let i = 0; i < 200 && !f(); i++) await new Promise((r) => setTimeout(r, 50)); };

assert.equal(holder(), null, 'free to begin with');

// two runs: the second waits for the first, says who it waits for, and both finish in turn
const a = spawn('node', [LOCK, '--run', 'first run', '--', 'sh', '-c', 'echo start-a; sleep 2; echo end-a'], { env });
let aOut = ''; a.stdout.on('data', (d) => { aOut += d; });
await until(() => aOut.includes('start-a'));
assert.equal(holder().what, 'first run', 'the holder is named');
const t0 = Date.now();
const b = spawnSync('node', [LOCK, '--run', 'second run', '--', 'sh', '-c', 'echo b; ps -o nice= -p $$'], { env, encoding: 'utf8' });
assert.ok(Date.now() - t0 > 1000, 'the second run waited for the first');
assert.match(b.stderr, /waiting for first run \(pid \d+/, 'and said who held the lock');
assert.equal(b.stdout.split('\n')[1].trim(), '10', 'the run is niced');
await new Promise((r) => a.on('close', r));
assert.match(aOut, /start-a\nend-a/);
assert.equal(holder(), null, 'both released');

// a holder killed outright (no cleanup of its own) lets go: the system frees the lock, nothing is left to take over
const k = spawn('node', [LOCK, '--run', 'killed', '--', 'sleep', '30'], { env, detached: true });
await until(() => holder() !== null);
assert.equal(holder().what, 'killed');
process.kill(k.pid, 'SIGKILL'); // the node holder alone: its lock child sees the pipe close and lets go
await until(() => holder() === null);
assert.equal(holder(), null, 'a killed holder holds nothing');
try { process.kill(-k.pid, 'SIGKILL'); } catch { /* the sleep it left, if any */ }
const after = spawnSync('node', [LOCK, '--run', 'after', '--', 'echo', 'ran'], { env, encoding: 'utf8', timeout: 10000 });
assert.equal(after.stdout.trim(), 'ran', 'and the next run goes straight through');

// a child of a holder never waits
const c = spawnSync('node', [LOCK, '--run', 'outer', '--', 'node', LOCK, '--run', 'inner', '--', 'echo', 'nested'], { env, encoding: 'utf8', timeout: 10000 });
assert.equal(c.stdout.trim(), 'nested', 'a run inside a held run goes straight through');
assert.equal(spawnSync('node', [LOCK, '--run', 'x', '--', 'sh', '-c', 'exit 3'], { env }).status, 3, "the command's exit code is the lock's");

// a lock that cannot be opened: the run goes ahead, said
const ro = spawnSync('node', [LOCK, '--run', 'x', '--', 'echo', 'unlocked'], { env: { ...env, TOOLKIT_LOCK_DIR: '/dev/null/nope' }, encoding: 'utf8', timeout: 10000 });
assert.equal(ro.stdout.trim(), 'unlocked', 'it runs');
assert.match(ro.stderr, /running without it/, 'and says it ran unlocked');
// two slots: two runs go side by side, a third waits for one of them
const env2 = { ...env, TOOLKIT_LOCK_SLOTS: '2' };
const t2 = Date.now();
const s1 = spawn('node', [LOCK, '--run', 'slot one', '--', 'sleep', '3'], { env: env2 });
const s2 = spawn('node', [LOCK, '--run', 'slot two', '--', 'sleep', '3'], { env: env2 });
await until(() => spawnSync('node', [LOCK, '--who'], { env: env2, encoding: 'utf8' }).stdout.startsWith('2 of 2 slots held'));
const t1 = Date.now();
const s3 = spawnSync('node', [LOCK, '--run', 'third', '--', 'echo', 'third'], { env: env2, encoding: 'utf8', timeout: 20000 });
assert.ok(Date.now() - t1 > 1000, 'a third run waits while both slots are held');
assert.match(s3.stderr, /waiting for slot (one|two)/, 'and names a holder');
await Promise.all([s1, s2].map((s) => new Promise((r) => (s.exitCode !== null ? r() : s.on('close', r)))));
assert.ok(Date.now() - t2 < 5500, 'the two ran side by side, not in turn');
// checks and lands take slot 0 alone: a second waits for the first even with a slot free
const { hold, release } = await import('./lock.mjs');
const l1 = spawn('node', [LOCK, '--run', 'a measure', '--', 'sleep', '3'], { env: env2 });
await until(() => spawnSync('node', [LOCK, '--who'], { env: env2, encoding: 'utf8' }).stdout.startsWith('1 of 2 slots held'));
process.env.TOOLKIT_LOCK_SLOTS = '2';
assert.equal(holder({ first: true }), null, 'a measure leaves slot 0 to checks and lands while another slot is free');
process.env.TOOLKIT_LOCK_SLOTS = '1';
const firstScript = `const { hold, release } = await import(${JSON.stringify(path.join(HERE, 'lock.mjs'))}); await hold('land one', { first: true }); await new Promise((r) => setTimeout(r, 2500)); release();`;
const lands = [0, 1].map(() => spawn('node', ['--input-type=module', '-e', firstScript], { env: env2 }));
const t3 = Date.now();
await Promise.all(lands.map((s) => new Promise((r) => s.on('close', r))));
assert.ok(Date.now() - t3 > 4500, 'two lands run in turn, though a measure holds only one of two slots');
await new Promise((r) => (l1.exitCode !== null ? r() : l1.on('close', r)));
// a long holder gives its slot to a waiter between pieces of work, and gets it back: no run keeps a slot for hours
{ const { yieldIfWanted, wanted, holder: who } = await import('./lock.mjs');
  assert.equal(await hold('long run'), true, 'the long run holds the one slot');
  assert.equal(wanted(), null, 'no one waits yet');
  const w = spawn('node', [LOCK, '--run', 'short run', '--', 'sh', '-c', 'echo ran; sleep 1'], { env });
  let wOut = ''; w.stdout.on('data', (d) => { wOut += d; });
  await until(() => wanted());
  assert.match(wanted().what, /short run/, 'the waiter is seen');
  const said = []; const t4 = Date.now();
  assert.equal(await yieldIfWanted('long run', { say: (l) => said.push(l) }), true, 'the holder yields');
  assert.ok(wOut.includes('ran'), 'the waiter ran in between');
  assert.match(said.join('\n'), /giving the slot to short run/, 'and the yield is said');
  assert.equal(who()?.what, 'long run', 'the holder has the slot again');
  assert.ok(Date.now() - t4 < 15000, 'promptly');
  assert.equal(await yieldIfWanted('long run'), false, 'with no one waiting it keeps the slot');
  release(); await new Promise((r) => (w.exitCode !== null ? r() : w.on('close', r)));
  assert.equal(fs.readdirSync(process.env.TOOLKIT_LOCK_DIR).filter((f) => f.startsWith('want-')).length, 0, 'no waiter note is left behind'); }
console.log('test-lock: 30 assertions passed');
