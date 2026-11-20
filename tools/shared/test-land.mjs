#!/usr/bin/env node
// land.mjs, end to end in a scratch repo with its own remote: sessions in their own worktrees land through one queue,
// one full check per batch, nothing uncommitted anywhere decides anything, a conflict or a red branch holds no one else.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'test-land-')));
process.env.TOOLKIT_LOCK_DIR = path.join(tmp, 'lock');
delete process.env.TOOLKIT_LOCK_HELD; delete process.env.TOOLKIT_CHECK_FRESH;
process.env.GIT_AUTHOR_NAME = process.env.GIT_COMMITTER_NAME = 't';
process.env.GIT_AUTHOR_EMAIL = process.env.GIT_COMMITTER_EMAIL = 't@t';
const { land, queued } = await import('./land.mjs');

const remote = path.join(tmp, 'remote.git'), main = path.join(tmp, 'main'), count = path.join(tmp, 'runs');
const git = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remote]);
execFileSync('git', ['clone', '-q', remote, main], { stdio: 'ignore' });
fs.mkdirSync(path.join(main, 'bin'));
// the fake check counts its runs and is red when any tracked file says BAD
fs.writeFileSync(path.join(main, 'bin', 'check'), `#!/bin/sh\ncd "$(dirname "$0")/.."\necho run >> "${count}"\nif git grep -q BAD -- ':!bin'; then echo "== 1 FAILED (BAD)"; exit 1; fi\necho "green"\n`, { mode: 0o755 });
fs.writeFileSync(path.join(main, '.gitignore'), '.claude/\n');
for (const f of ['a', 'b', 'c', 'd', 'e']) fs.writeFileSync(path.join(main, `${f}.txt`), `${f}\n`);
git(main, 'add', '.'); git(main, 'commit', '-qm', 'base'); git(main, 'push', '-q', 'origin', 'main');
const runs = () => (fs.existsSync(count) ? fs.readFileSync(count, 'utf8').split('\n').filter(Boolean).length : 0);
const wt = (name) => { const d = path.join(main, '.claude', 'worktrees', name); git(main, 'worktree', 'add', '-q', '-b', `worktree-${name}`, d, 'origin/main'); return d; };
const edit = (dir, file, text, msg) => { fs.writeFileSync(path.join(dir, file), text); git(dir, 'commit', '-qam', msg || `${file}: ${text.trim()}`); };
const remoteHas = (file) => git(remote, 'show', `main:${file}`);
const quiet = async (f) => { const log = console.log; const out = []; console.log = (l) => out.push(l); try { return { code: await f(), out: out.join('\n') }; } finally { console.log = log; } };

// (a) A lands while B has an uncommitted file: B's dirt decides nothing, and A's worktree and the main checkout follow
const A = wt('a'), B = wt('b');
edit(A, 'a.txt', 'a1\n');
fs.writeFileSync(path.join(B, 'b.txt'), 'half-written BAD\n');
let r = await quiet(() => land(A));
assert.equal(r.code, 0, r.out);
assert.equal(remoteHas('a.txt'), 'a1', 'A is on the remote main');
assert.equal(runs(), 1, 'one full check');
assert.equal(git(A, 'rev-parse', 'HEAD'), git(remote, 'rev-parse', 'main'), "A's branch now is main");
assert.equal(git(main, 'rev-parse', 'HEAD'), git(remote, 'rev-parse', 'main'), 'the main checkout was fast-forwarded');
fs.writeFileSync(path.join(B, 'b.txt'), 'b\n');

// (b) two sessions queued land in one batch with one check; the waiter finds its branch landed
git(B, 'merge', '-q', '--ff-only', 'origin/main');
const C = wt('c');
edit(B, 'b.txt', 'b1\n'); edit(C, 'c.txt', 'c1\n');
fs.mkdirSync(path.join(main, '.git', 'land-queue'), { recursive: true });
fs.writeFileSync(path.join(main, '.git', 'land-queue', 'worktree-c'), JSON.stringify({ branch: 'worktree-c', sha: git(C, 'rev-parse', 'HEAD'), at: Date.now() }));
r = await quiet(() => land(B));
assert.equal(r.code, 0, r.out);
assert.equal(remoteHas('b.txt') + remoteHas('c.txt'), 'b1c1', 'both landed');
assert.equal(runs(), 2, 'two branches, one check');
assert.equal(queued(main).length, 0, 'the queue is empty');
r = await quiet(() => land(C));
assert.equal(r.code, 0, 'C, landed by B\'s holder, has nothing left');
assert.equal(runs(), 2, 'and costs no check');

// (c) a conflict: the branch is dropped and told; main and the remote stay as they were
const before = git(remote, 'rev-parse', 'main');
const D = wt('d');
git(D, 'reset', '-q', '--hard', git(main, 'rev-list', '--max-parents=0', 'HEAD')); // started before a1 landed
edit(D, 'a.txt', 'a-other\n');
r = await quiet(() => land(D));
assert.equal(r.code, 1);
assert.match(r.out, /does not apply on main \(a\.txt\)/, 'the conflicting file is named');
assert.equal(git(remote, 'rev-parse', 'main'), before, 'the remote did not move');
assert.equal(queued(main).length, 0, 'and the branch left the queue');

// (d) a red branch in a batch holds no one: each alone, the green one lands
const E = wt('e'), F = wt('f');
edit(E, 'e.txt', 'e1\n'); edit(F, 'd.txt', 'BAD\n');
fs.writeFileSync(path.join(main, '.git', 'land-queue', 'worktree-f'), JSON.stringify({ branch: 'worktree-f', sha: git(F, 'rev-parse', 'HEAD'), at: Date.now() }));
r = await quiet(() => land(E));
assert.equal(r.code, 0, r.out);
assert.match(r.out, /worktree-f is red on main/, 'the red branch is told');
assert.equal(remoteHas('e.txt'), 'e1', 'the green one landed');
assert.equal(remoteHas('d.txt'), 'd', 'the red one did not');

// (e) a branch committed on after it was queued keeps its new work; the next landing brings only that
edit(E, 'e.txt', 'e2\n');
r = await quiet(() => land(E));
assert.equal(r.code, 0, r.out);
assert.match(r.out, /landed worktree-e \(1 commit\)/, 'only the new commit');
assert.equal(remoteHas('e.txt'), 'e2');

// (f) a landed tree is recorded: pushing it again checks nothing
const n = runs();
const at = spawnSync('node', [path.join(HERE, 'check-cache.mjs'), '--commit', main, 'origin/main'], { encoding: 'utf8' });
assert.equal(at.status, 0, at.stderr);
assert.equal(runs(), n, 'the pre-push check of a landed commit is answered from the record');

// (g) main itself never lands: it holds whatever anyone committed there
r = await quiet(() => land(main));
assert.equal(r.code, 2); assert.match(r.out, /main itself does not land/);

// (h) a queued commit that no longer exists is dropped and holds no one; a corrupt queue file empties nothing
const G = wt('g');
edit(G, 'c.txt', 'c2\n');
fs.writeFileSync(path.join(main, '.git', 'land-queue', 'worktree-gone'), JSON.stringify({ branch: 'worktree-gone', sha: 'f'.repeat(40), at: 1 }));
fs.writeFileSync(path.join(main, '.git', 'land-queue', 'half'), '{"branch":');
r = await quiet(() => land(G));
assert.equal(r.code, 0, r.out);
assert.match(r.out, /worktree-gone: commit ffffffff no longer exists: dropped/);
assert.equal(remoteHas('c.txt'), 'c2');

// (i) a branch queued again at a newer commit while the holder handles the older one stays queued
const H = wt('h');
edit(H, 'b.txt', 'b2\n');
const old = git(H, 'rev-parse', 'HEAD');
edit(H, 'b.txt', 'b3\n');
fs.writeFileSync(path.join(main, '.git', 'land-queue', 'worktree-h'), JSON.stringify({ branch: 'worktree-h', sha: git(H, 'rev-parse', 'HEAD'), at: Date.now() }));
const { unqueueForTest } = await import('./land.mjs');
unqueueForTest(main, { branch: 'worktree-h', sha: old }, 'landed');
assert.equal(queued(main).find((q) => q.branch === 'worktree-h')?.sha, git(H, 'rev-parse', 'HEAD'), 'the newer entry is kept');

fs.rmSync(tmp, { recursive: true, force: true });
console.log('test-land: passed');
