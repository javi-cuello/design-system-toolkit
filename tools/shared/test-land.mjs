#!/usr/bin/env node
// land.mjs, end to end in a scratch repo with its own remote: sessions in their own worktrees land through one queue,
// one full check per batch, nothing uncommitted anywhere decides anything, a conflict or a red branch holds no one else.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'test-land-')));
process.env.TOOLKIT_LOCK_DIR = path.join(tmp, 'lock');
process.env.TOOLKIT_LOCK_SLOTS = '1'; // one run at a time, what these cases measure
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
// a quick run (bin/land's before queuing) is counted apart, and red when a tracked file says QUICKBAD
fs.writeFileSync(path.join(main, 'bin', 'check'), `#!/bin/sh\ncd "$(dirname "$0")/.."\ncase " $* " in *" --quick "*) echo quick >> "${count}.quick"; if git grep -q QUICKBAD -- ':!bin'; then echo "every README and skill reads plainly   FAIL (0s)"; echo "  t.md: too long"; echo "== 1 FAILED (detail above each):"; echo "  - every README and skill reads plainly"; exit 1; fi; echo "green (quick)"; exit 0;; esac\necho "run $(sed 's/.*"at":\\([0-9]*\\).*/\\1/' "$TOOLKIT_LOCK_DIR/toolkit-measure.holder.json" 2>/dev/null)" >> "${count}"\nif [ -n "$LAND_MOVE" ] && [ -f "$LAND_MOVE" ]; then rm "$LAND_MOVE"; echo moved > moved.txt; git add moved.txt; git commit -qm moved; fi\nif [ -n "$LAND_KILL" ] && [ -f "$LAND_KILL" ]; then rm "$LAND_KILL"; pkill -f "$TOOLKIT_LOCK_DIR/toolkit-measure.flock"; sleep 0.3; fi\nif git grep -q BAD -- ':!bin'; then echo "== 1 FAILED (BAD)"; exit 1; fi\necho "green"\n`, { mode: 0o755 });
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

// (d) a red branch in a batch holds no one: the batch is halved, the green one lands
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

// (j) a push the remote refuses while main has not moved (a hook) is said whole, once, never retried as "main moved"
{ const J = wt('j');
  edit(J, 'e.txt', 'e1\n');
  const hook = path.join(remote, 'hooks', 'pre-receive');
  fs.writeFileSync(hook, '#!/bin/sh\necho "refused: a commit names a project" >&2\necho "second line of why" >&2\nexit 1\n', { mode: 0o755 });
  const before = runs();
  r = await quiet(() => land(J));
  fs.rmSync(hook);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /refused: a commit names a project/, 'the remote\'s reason is said');
  assert.doesNotMatch(r.out, /main moved/, r.out);
  // (case (i)'s newer h is still queued, and this hook refuses every push: h and j are each refused alone)
  assert.equal(runs() - before, 3, `a check for the batch, then one each: ${r.out}`);
  assert.match(r.out, /worktree-j: not landed/, r.out);
  assert.equal(queued(main).some((q) => q.branch === 'worktree-j'), false, 'off the queue'); }
// (k) in a batch of three, the refusal falls on the branch that carries it, queued last; the others land
{ const K = wt('k'), L = wt('l'), M = wt('m');
  edit(K, 'd.txt', 'd-NAMED\n'); edit(L, 'a.txt', 'a-ok\n'); edit(M, 'e.txt', 'e-ok\n');
  fs.writeFileSync(path.join(main, '.git', 'land-queue', 'worktree-m'), JSON.stringify({ branch: 'worktree-m', sha: git(M, 'rev-parse', 'HEAD'), at: Date.now() - 500 }));
  const hook = path.join(remote, 'hooks', 'pre-receive');
  fs.writeFileSync(hook, '#!/bin/sh\nwhile read o n r; do git log --format=%s "$o..$n" 2>/dev/null | grep -q NAMED && { echo "refused: NAMED" >&2; exit 1; }; done; exit 0\n', { mode: 0o755 });
  fs.writeFileSync(path.join(main, '.git', 'land-queue', 'worktree-l'), JSON.stringify({ branch: 'worktree-l', sha: git(L, 'rev-parse', 'HEAD'), at: Date.now() - 1000 }));
  r = await quiet(() => land(K));
  fs.rmSync(hook);
  assert.equal(r.code, 1, r.out);
  assert.equal(remoteHas('a.txt'), 'a-ok', `the other branch landed: ${r.out}`);
  assert.equal(remoteHas('e.txt'), 'e-ok', `the second other branch landed: ${r.out}`);
  assert.match(r.out, /worktree-k: not landed/, r.out);
  assert.equal(queued(main).length, 0, 'the refused branch, last in the queue, is refused, not left queued'); }

// (l) one red branch among six: the batch is halved, not each tried alone (7 checks), and every check is its own hold
{ const dirs = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'].map((x) => wt(x));
  // each adds its own file, so none conflicts; n6's says BAD
  dirs.forEach((d, i) => { fs.writeFileSync(path.join(d, `n${i + 1}.txt`), i === 5 ? 'BAD\n' : `n${i + 1}\n`); git(d, 'add', '.'); git(d, 'commit', '-qm', `n${i + 1}`); });
  const before = runs();
  const t0 = Date.now();
  dirs.slice(1).forEach((d, i) => fs.writeFileSync(path.join(main, '.git', 'land-queue', `worktree-n${i + 2}`), JSON.stringify({ branch: `worktree-n${i + 2}`, sha: git(d, 'rev-parse', 'HEAD'), at: t0 + i + 1 })));
  r = await quiet(() => land(dirs[0]));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /trying it in halves of 3 and 3/, r.out);
  assert.match(r.out, /worktree-n6 is red on main/, r.out);
  const used = runs() - before;
  // red 6, green 3 (lands), the other 3 the red tree again (no check), red 2, green 1, red 1 (always checked), green 1
  assert.equal(used, 6, `halving costs 6 checks here, each alone cost 7, and it grows as log2(n), not n: ${used}\n${r.out}`);
  assert.match(r.out, /the same tree as the red batch before it: red, not checked again/, r.out);
  const holds = fs.readFileSync(count, 'utf8').split('\n').filter(Boolean).slice(-used).map((l) => l.split(' ')[1]);
  assert.equal(new Set(holds).size, used, `each check under its own hold of the lock: ${holds.join(',')}`);
  assert.equal(queued(main).length, 0, 'the queue is empty');
  assert.equal(fs.existsSync(path.join(main, '.git', 'land-queue', '.split')), false, 'and no split is left');
  // (m) the red branch, unchanged, is not queued or checked again
  const n0 = runs();
  r = await quiet(() => land(dirs[5]));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /was red on main at .*: commit a fix/, r.out);
  assert.equal(runs(), n0, 'no check');
  assert.equal(queued(main).length, 0, 'not queued'); }

// (n) a waiter whose branch another holder lands ends then, not when the lock comes free (2026-11-22: an hour after)
{ const D = wt('n7'); fs.writeFileSync(path.join(D, 'n7.txt'), 'n7\n'); git(D, 'add', '.'); git(D, 'commit', '-qm', 'n7');
  const other = spawn(process.execPath, [path.join(HERE, 'lock.mjs'), '--run', 'another land', '--', 'sleep', '60'], { stdio: 'ignore', env: process.env, detached: true });
  // wait on the lock itself (the holder note of earlier cases is still there)
  const held = () => spawnSync(process.execPath, [path.join(HERE, 'lock.mjs'), '--who'], { encoding: 'utf8', env: process.env }).stdout.includes('another land');
  for (let i = 0; i < 100 && !held(); i++) await new Promise((r) => setTimeout(r, 100));
  assert.ok(held(), 'the other holder took the lock');
  const sha = git(D, 'rev-parse', 'HEAD'), t0 = Date.now(), n0 = runs();
  // the other holder lands it: off the queue, outcome kept
  setTimeout(() => { const q = path.join(main, '.git', 'land-queue');
    fs.rmSync(path.join(q, 'worktree-n7'), { force: true });
    fs.writeFileSync(path.join(q, '.outcomes', `worktree-n7@${sha}`), JSON.stringify({ outcome: 'landed', at: Date.now() })); }, 1000);
  r = await quiet(() => land(D));
  const alive = other.exitCode === null; process.kill(-other.pid); // its sleep too
  assert.equal(r.code, 0, r.out);
  assert.ok(alive, 'the other holder still held the lock');
  assert.ok(Date.now() - t0 < 10000, `ended within seconds of being landed: ${Date.now() - t0} ms`);
  assert.equal(runs(), n0, 'no check of its own');
  assert.equal(fs.readdirSync(process.env.TOOLKIT_LOCK_DIR).filter((f) => f.startsWith('want-')).length, 0, 'no waiter note left'); }

// (o) a lock that cannot be taken lands nothing: no check, no push (2026-11-22: a lander run without it pushed another's tree)
{ const E = wt('n8'); fs.writeFileSync(path.join(E, 'n8.txt'), 'n8\n'); git(E, 'add', '.'); git(E, 'commit', '-qm', 'n8');
  const dir = process.env.TOOLKIT_LOCK_DIR, n0 = runs(), head = git(remote, 'rev-parse', 'main');
  process.env.TOOLKIT_LOCK_DIR = path.join(tmp, 'a-file'); fs.writeFileSync(process.env.TOOLKIT_LOCK_DIR, '');
  r = await quiet(() => land(E));
  process.env.TOOLKIT_LOCK_DIR = dir;
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /could not be taken three times: not landed/, r.out);
  assert.equal(runs(), n0, 'no check');
  assert.equal(git(remote, 'rev-parse', 'main'), head, 'nothing pushed'); }

// (p) the integration worktree moved during the check (a second lander in it): that tree is never pushed; checked again
{ const F = wt('n9'); fs.writeFileSync(path.join(F, 'n9.txt'), 'n9\n'); git(F, 'add', '.'); git(F, 'commit', '-qm', 'n9');
  process.env.LAND_MOVE = path.join(tmp, 'move'); fs.writeFileSync(process.env.LAND_MOVE, '');
  const n0 = runs();
  r = await quiet(() => land(F));
  delete process.env.LAND_MOVE;
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /changed during the check: checking again/, r.out);
  assert.equal(runs() - n0, 2, 'checked again');
  assert.equal(remoteHas('n9.txt'), 'n9');
  assert.throws(() => remoteHas('moved.txt'), 'the moved tree was not pushed'); }

// (q) the lock's helper dies during the check (the flock is free for anyone): that check's tree is not pushed; again
{ const G = wt('n10'); fs.writeFileSync(path.join(G, 'n10.txt'), 'n10\n'); git(G, 'add', '.'); git(G, 'commit', '-qm', 'n10');
  process.env.LAND_KILL = path.join(tmp, 'kill'); fs.writeFileSync(process.env.LAND_KILL, '');
  r = await quiet(() => land(G));
  delete process.env.LAND_KILL;
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /lock was lost during the check: not pushed/, r.out);
  assert.equal(remoteHas('n10.txt'), 'n10'); }

// (r) a red quick check refuses to queue, naming what failed, before any wait for the lock or a full check
// (2026-11-24: two lands went red on quick-check steps after 13 minutes each)
{ const H = wt('n11'); fs.writeFileSync(path.join(H, 'n11.txt'), 'QUICKBAD\n'); git(H, 'add', '.'); git(H, 'commit', '-qm', 'n11');
  const n0 = runs(), quick = () => fs.readFileSync(`${count}.quick`, 'utf8').split('\n').filter(Boolean).length, q0 = quick();
  r = await quiet(() => land(H));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /not queued: the quick check is red: every README and skill reads plainly/, r.out);
  assert.match(r.out, /t\.md: too long/, `the failure's detail is shown: ${r.out}`);
  assert.equal(runs(), n0, 'no full check');
  assert.equal(quick() - q0, 1, 'one quick check');
  assert.equal(queued(main).some((q) => q.branch === 'worktree-n11'), false, 'not queued');
  // fixed, it is checked quick again and lands
  fs.writeFileSync(path.join(H, 'n11.txt'), 'n11\n'); git(H, 'commit', '-qam', 'n11 fixed');
  r = await quiet(() => land(H));
  assert.equal(r.code, 0, r.out);
  assert.equal(remoteHas('n11.txt'), 'n11');
  assert.equal(fs.readdirSync(path.join(main, '.claude', 'worktrees')).filter((f) => f.startsWith('.at-')).length, 0, 'no temporary worktree left'); }

// (s) stale dashboards are restarted before queuing, outside the lock, by the main checkout's check-services --heal;
// the full check under the lock only judges them (2026-11-24: stale dashboards failed a land that had nothing to do with them)
{ const fake = path.join(main, 'tools', 'figma-audit', 'check-services.mjs'), said = path.join(tmp, 'healed');
  fs.mkdirSync(path.dirname(fake), { recursive: true });
  fs.writeFileSync(fake, `import fs from 'node:fs'; fs.appendFileSync(${JSON.stringify(said)}, process.argv.slice(2).join(' ') + '\\n'); console.log('dashboards: 1 stale service(s) restarted, idle, on the files on disk: p');`);
  const S = wt('n12'); fs.writeFileSync(path.join(S, 'n12.txt'), 'n12\n'); git(S, 'add', '.'); git(S, 'commit', '-qm', 'n12');
  r = await quiet(() => land(S));
  fs.rmSync(path.join(main, 'tools'), { recursive: true, force: true });
  assert.equal(r.code, 0, r.out);
  assert.equal(fs.readFileSync(said, 'utf8').trim(), '--heal', 'asked once, to heal');
  assert.match(r.out, /1 stale service\(s\) restarted/, r.out); }

// (t) the quick check reads the branch with main merged in: a step red when it branched and fixed on main since
// does not refuse it
{ git(main, 'fetch', '-q', 'origin'); git(main, 'merge', '-q', '--ff-only', 'origin/main');
  fs.writeFileSync(path.join(main, 'q.txt'), 'QUICKBAD\n'); git(main, 'add', 'q.txt'); git(main, 'commit', '-qm', 'q red'); git(main, 'push', '-q', 'origin', 'main');
  const T = wt('n13');
  fs.writeFileSync(path.join(main, 'q.txt'), 'q fixed\n'); git(main, 'commit', '-qam', 'q fixed'); git(main, 'push', '-q', 'origin', 'main');
  fs.writeFileSync(path.join(T, 'n13.txt'), 'n13\n'); git(T, 'add', '.'); git(T, 'commit', '-qm', 'n13');
  r = await quiet(() => land(T));
  assert.equal(r.code, 0, r.out);
  assert.equal(remoteHas('n13.txt'), 'n13'); }

// (u) a merge with main that fails for another reason than a conflict says that reason, never "conflict"
{ const U = wt('n14'); git(U, 'checkout', '-q', '--orphan', 'worktree-orphan'); git(U, 'commit', '-qm', 'orphan');
  r = await quiet(() => land(U));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /unrelated histories/, r.out);
  assert.doesNotMatch(r.out, /\(conflict\)/, r.out); }

fs.rmSync(tmp, { recursive: true, force: true });
console.log('test-land: passed');
