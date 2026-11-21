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
[ -n "\${FAILME_IF_STRAY:-}" ] && [ -f stray.txt ] && { echo "== 1 FAILED (stray)"; exit 1; }
if [ -n "\${FAILME:-}" ]; then echo "== 1 FAILED (detail above each):"; exit 1; fi
echo "green: every check passed"
`, { mode: 0o755 });
fs.writeFileSync(path.join(repo, 'a.txt'), 'a\n');
fs.writeFileSync(path.join(repo, '.gitignore'), '.claude/\n');
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { stdio: 'ignore' });
git('init', '-q'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '.'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'one');

const base = { ...process.env, TOOLKIT_LOCK_DIR: path.join(tmp, 'lock'), TOOLKIT_LOCK_SLOTS: '1' };
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
assert.equal(runs(), 1, '--no-fix reads the same tree the same way: the full run\'s record answers it');
check([], { TOOLKIT_CHECK_FRESH: '1' });
assert.equal(runs(), 2, 'TOOLKIT_CHECK_FRESH always runs');
check(['--quick']);
assert.equal(runs(), 3, 'a quick run is another record');
check(['--quick']);
assert.equal(runs(), 3, 'and is reused in turn');
check(['--quick', '--no-fix']);
assert.equal(runs(), 3, 'quick with --no-fix is still quick');
check([], { TOOLKIT_CHECK_FRESH: '1' }); check([], { TOOLKIT_CHECK_FRESH: '1' });
assert.equal(runs(), 5, '(two fresh runs to keep the counts below)');

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
assert.equal(runs(), 12, 'a red is never recorded: a re-run retries it, as for a flake');
assert.equal(r.status, 0);

// a run queued behind a run of the same tree takes that run's answer once it holds the lock
fs.writeFileSync(path.join(repo, 'a.txt'), 'e\n'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'five');
const first = spawn('node', [CACHE, repo], { env: { ...base, SLOW: '1' }, stdio: 'ignore' });
for (let i = 0; i < 100 && runs() < 13; i++) await new Promise((res) => setTimeout(res, 50));
r = check();
await new Promise((res) => (first.exitCode !== null ? res() : first.on('close', res)));
assert.equal(runs(), 13, 'a queued run on the same tree is answered by the run it waited for');
assert.match(r.stderr, /waiting for bin\/check/, 'after waiting for it');
assert.match(r.stdout, /^green/m);

// --commit: the commit as committed, in a clean temporary worktree, whatever any working tree holds
fs.writeFileSync(path.join(repo, 'a.txt'), 'f\n'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'six');
fs.writeFileSync(path.join(repo, 'stray.txt'), 'another session, half-written');
const at = (env = {}) => spawnSync('node', [CACHE, '--commit', repo, 'HEAD'], { env: { ...base, ...env }, encoding: 'utf8' });
r = at({ FAILME_IF_STRAY: '1' });
assert.equal(r.status, 0, 'an uncommitted file in the checkout cannot decide the commit\'s check');
assert.equal(runs(), 14, 'the commit is checked once');
assert.equal(fs.readdirSync(path.join(repo, '.claude', 'worktrees')).length, 0, 'and its temporary worktree is gone');
r = at();
assert.equal(runs(), 14, 'a commit already checked green is answered from the record');
assert.match(r.stdout, /^green/m);
fs.rmSync(path.join(repo, 'stray.txt'));

// --quick takes no lock: it runs while a full run holds it
fs.writeFileSync(path.join(repo, 'a.txt'), 'g\n'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'seven');
const slow = spawn('node', [CACHE, repo], { env: { ...base, SLOW: '1', TOOLKIT_CHECK_FRESH: '1' }, stdio: 'ignore' });
for (let i = 0; i < 100 && runs() < 15; i++) await new Promise((res) => setTimeout(res, 50));
const t0 = Date.now();
r = check(['--quick'], { TOOLKIT_CHECK_FRESH: '1' });
assert.ok(Date.now() - t0 < 1500 && !/waiting for/.test(r.stderr), 'a quick run does not wait for the lock');
await new Promise((res) => (slow.exitCode !== null ? res() : slow.on('close', res)));

fs.rmSync(tmp, { recursive: true, force: true });
console.log('test-check-cache: passed');
