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
console.log('test-lock: 14 assertions passed');
