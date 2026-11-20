#!/usr/bin/env node
// lock.mjs: one measuring run at a time; a waiter says who holds it; a dead holder's lock is taken over.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
process.env.TMPDIR = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'test-lock-')));
delete process.env.TOOLKIT_LOCK_HELD;
process.env.TOOLKIT_LOCK_DIR = path.join(process.env.TMPDIR, 'toolkit-measure.lock');
const { tryAcquire, holder, release, lockDir } = await import('./lock.mjs');
const LOCK = path.join(HERE, 'lock.mjs');

assert.equal(tryAcquire('first'), null, 'a free lock is taken');
assert.equal(tryAcquire('second').what, 'first', 'a held lock names its holder');
release();
assert.equal(holder(), null, 'released');

// a holder whose process has gone is taken over
fs.mkdirSync(lockDir());
fs.writeFileSync(path.join(lockDir(), 'holder.json'), JSON.stringify({ pid: 999999, what: 'dead', at: Date.now() }));
assert.equal(tryAcquire('after'), null, "a dead holder's lock is taken over");
release();

// a live pid that is not the holder (its pid reused by a later process) does not hold it
fs.mkdirSync(lockDir());
fs.writeFileSync(path.join(lockDir(), 'holder.json'), JSON.stringify({ pid: process.pid, start: 'Mon Jan  1 00:00:00 2001', what: 'reused', at: Date.now() }));
assert.equal(holder(), null, 'a reused pid is not the holder');
assert.equal(tryAcquire('fresh'), null, 'and its lock is taken over');
release();

// a takeover that died leaves its mutex: after a minute it is cleared and the dead holder's lock is taken over
fs.mkdirSync(lockDir());
fs.writeFileSync(path.join(lockDir(), 'holder.json'), JSON.stringify({ pid: 999999, what: 'dead', at: Date.now() }));
fs.mkdirSync(`${lockDir()}.takeover`);
assert.notEqual(tryAcquire('blocked'), null, 'a taker in progress: not taken now');
const old = new Date(Date.now() - 120000); fs.utimesSync(`${lockDir()}.takeover`, old, old);
assert.equal(tryAcquire('after a minute'), null, 'its stale mutex cleared, the lock is taken');
release();

// ps unreadable cannot be faked here; a holder whose start is unknown is trusted by its pid
fs.mkdirSync(lockDir());
fs.writeFileSync(path.join(lockDir(), 'holder.json'), JSON.stringify({ pid: process.pid, what: 'old style', at: Date.now() }));
assert.equal(holder().what, 'old style', 'a live pid with no start recorded holds it');
fs.rmSync(lockDir(), { recursive: true, force: true });

// two runs: the second waits for the first, says who it waits for, and both finish in turn
const env = { ...process.env };
const a = spawn('node', [LOCK, '--run', 'first run', '--', 'sh', '-c', 'echo start-a; sleep 2; echo end-a'], { env });
let aOut = ''; a.stdout.on('data', (d) => { aOut += d; });
while (!holder()) await new Promise((r) => setTimeout(r, 50));
const t0 = Date.now();
const b = spawnSync('node', [LOCK, '--run', 'second run', '--', 'sh', '-c', 'echo b; ps -o nice= -p $$'], { env, encoding: 'utf8' });
assert.ok(Date.now() - t0 > 1000, 'the second run waited for the first');
assert.match(b.stderr, /waiting for first run \(pid \d+/, 'and said who held the lock');
assert.equal(b.stdout.split('\n')[1].trim(), '10', 'the run is niced');
await new Promise((r) => a.on('close', r));
assert.match(aOut, /start-a\nend-a/);
assert.equal(holder(), null, 'both released');

// a child of a holder never waits
const c = spawnSync('node', [LOCK, '--run', 'outer', '--', 'node', LOCK, '--run', 'inner', '--', 'echo', 'nested'], { env, encoding: 'utf8', timeout: 10000 });
assert.equal(c.stdout.trim(), 'nested', 'a run inside a held run goes straight through');
assert.equal(spawnSync('node', [LOCK, '--run', 'x', '--', 'sh', '-c', 'exit 3'], { env }).status, 3, "the command's exit code is the lock's");
console.log('test-lock: 16 assertions passed');
