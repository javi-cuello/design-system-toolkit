#!/usr/bin/env node
// check-cache.mjs: a clean tree already checked with the same options is answered from the record, not run again;
// a dirty tree, --no-fix, TOOLKIT_CHECK_FRESH and a run that changed the tree always run.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(HERE, 'check-cache.mjs');
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'test-check-cache-')));
const repo = path.join(tmp, 'repo'), count = path.join(tmp, 'runs');
fs.mkdirSync(path.join(repo, 'bin'), { recursive: true });
// the fake check counts its runs outside the repo, can heal a tracked file, and can fail
fs.writeFileSync(path.join(repo, 'bin', 'check'), `#!/bin/sh
echo run >> "${count}"
[ -n "\${SLOW:-}" ] && sleep 2
[ -n "\${HEAL:-}" ] && echo healed >> "${repo}/a.txt"
if [ -n "\${FAILME:-}" ]; then echo "== 1 FAILED (detail above each):"; exit 1; fi
echo "green: every check passed"
`, { mode: 0o755 });
fs.writeFileSync(path.join(repo, 'a.txt'), 'a\n');
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { stdio: 'ignore' });
git('init', '-q'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '.'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'one');

const base = { ...process.env, TOOLKIT_LOCK_DIR: path.join(tmp, 'lock') };
delete base.TOOLKIT_LOCK_HELD; delete base.TOOLKIT_CHECK_FRESH;
const runs = () => (fs.existsSync(count) ? fs.readFileSync(count, 'utf8').split('\n').filter(Boolean).length : 0);
const check = (args = [], env = {}) => spawnSync('node', [CACHE, repo, ...args], { env: { ...base, ...env }, encoding: 'utf8' });

let r = check();
assert.equal(runs(), 1, 'the first run on a tree runs');
assert.match(r.stdout, /^green/m);
r = check();
assert.equal(runs(), 1, 'the same clean tree is answered from the record');
assert.match(r.stdout, /^green/m, 'with the closing line, so the gate credits it');
assert.match(r.stderr, /was checked at \d\d:\d\d/, 'and says it is a reused result');
assert.equal(r.status, 0);

check(['--no-fix']);
assert.equal(runs(), 2, '--no-fix, the pre-push check, always runs');
check(['--no-fix']);
assert.equal(runs(), 3, 'and is never recorded');
check([], { TOOLKIT_CHECK_FRESH: '1' });
assert.equal(runs(), 4, 'TOOLKIT_CHECK_FRESH always runs');
check(['--quick']);
assert.equal(runs(), 5, 'other options are another record');

fs.writeFileSync(path.join(repo, 'new.txt'), 'x');
check(); check();
assert.equal(runs(), 7, 'a dirty tree (an untracked file) runs every time');
fs.rmSync(path.join(repo, 'new.txt'));

git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'same tree');
check();
assert.equal(runs(), 7, 'a new commit with the same tree is the same tree');

fs.writeFileSync(path.join(repo, 'a.txt'), 'b\n'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'two');
check();
assert.equal(runs(), 8, 'a changed tree runs');
fs.writeFileSync(path.join(repo, 'a.txt'), 'c\n'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'three');
check([], { HEAL: '1' }); git('checkout', '-q', '--', 'a.txt');
check();
assert.equal(runs(), 10, 'a run that changed the tree (a heal) is not recorded as that tree\'s result');

fs.writeFileSync(path.join(repo, 'a.txt'), 'd\n'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'four');
r = check([], { FAILME: '1' });
assert.equal(r.status, 1);
r = check();
assert.equal(runs(), 11, 'a red is recorded too');
assert.equal(r.status, 1, 'and replayed with its exit status');
assert.match(r.stdout, /^== 1 FAILED/m);

// a run queued behind a run of the same tree takes that run's answer once it holds the lock
fs.writeFileSync(path.join(repo, 'a.txt'), 'e\n'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'five');
const first = spawn('node', [CACHE, repo], { env: { ...base, SLOW: '1' }, stdio: 'ignore' });
for (let i = 0; i < 100 && runs() < 12; i++) await new Promise((res) => setTimeout(res, 50));
r = check();
await new Promise((res) => (first.exitCode !== null ? res() : first.on('close', res)));
assert.equal(runs(), 12, 'a queued run on the same tree is answered by the run it waited for');
assert.match(r.stderr, /waiting for bin\/check/, 'after waiting for it');
assert.match(r.stdout, /^green/m);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('test-check-cache: passed');
