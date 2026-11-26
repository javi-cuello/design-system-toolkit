#!/usr/bin/env node
/*
 * Landing: the one way work reaches main. A session commits on its own branch (a worktree per piece of work,
 * worktree.mjs) and runs bin/land; a quick check of the commit merged with main runs first (red, or not merging: not
 * queued), then the branch joins a queue, and whoever holds the measuring lock lands every queued branch together:
 * their new commits replayed onto origin/main in an integration worktree, one full check of the
 * result, and a push from there. N sessions landing at once cost one check, not N (the bors model: test main with the
 * change applied, then move main; github.com/bors-ng/bors-ng). A branch whose commits do not apply is dropped and told;
 * a red batch is split in half until the red branch is alone (step()). The lock is held for one check at a time, with a
 * pause between, never a whole batch's retries, and a branch red at the same commit is not queued again.
 *
 *   bin/land [<branch or worktree folder>]     default: the branch checked out where it is run
 *
 * After a landing, best effort and never a failed landing: the main checkout is fast-forwarded (git refuses when
 * uncommitted files there overlap: said), and each landed worktree whose branch has not moved since it was queued is
 * reset to the landed commit. Which commits are new is asked of git by content (git cherry), so a branch landed
 * before and committed on since brings only its new commits. Merge commits are not replayed: their parents' are.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hold, release, lockLost } from './lock.mjs';
import { run as check } from './check-cache.mjs';
import { mainOf, link, temp } from './worktree.mjs';

const git = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tryGit = (dir, ...a) => { try { return { ok: true, out: git(dir, ...a) }; } catch (e) { return { ok: false, out: [e.stdout, e.stderr].map((s) => String(s || '').trim()).filter(Boolean).join('\n') || e.message }; } };
// a local pre-push hook's reason reaches a piped stdout, not stderr: both are kept, or the push is said refused with no why (2026-11-26)
const say = (l) => console.log(`land: ${l}`);
const PAUSE = +process.env.TOOLKIT_LAND_PAUSE || 2500; // ms between steps, so a waiter gets the lock

const queueDir = (main) => path.join(git(main, 'rev-parse', '--path-format=absolute', '--git-common-dir'), 'land-queue');
const qfile = (main, branch) => path.join(queueDir(main), encodeURIComponent(branch));
const readJSON = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const writeJSON = (f, v) => { const tmp = `${f}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify(v)); fs.renameSync(tmp, f); };
export const queued = (main) => { let names = []; try { names = fs.readdirSync(queueDir(main)); } catch { return []; }
  return names.filter((f) => !f.endsWith('.tmp') && !f.startsWith('.')).map((f) => readJSON(path.join(queueDir(main), f))).filter((q) => q?.branch && q.sha).sort((a, b) => a.at - b.at); };
const outcomes = (main) => path.join(queueDir(main), '.outcomes');
/* Off the queue, only as queued: a branch queued again at a newer commit meanwhile stays. The outcome is kept for the
   bin/land that queued it, which may be another process waiting on the lock. */
function unqueue(main, b, outcome) {
  fs.mkdirSync(outcomes(main), { recursive: true });
  writeJSON(path.join(outcomes(main), `${encodeURIComponent(b.branch)}@${b.sha}`), { outcome, at: Date.now() });
  if (readJSON(qfile(main, b.branch))?.sha === b.sha) fs.rmSync(qfile(main, b.branch), { force: true });
}

/* The worktree a branch is checked out in, or null. */
export function worktreeOf(main, branch) {
  let dir = null;
  for (const l of git(main, 'worktree', 'list', '--porcelain').split('\n')) {
    if (l.startsWith('worktree ')) dir = l.slice(9);
    else if (l === `branch refs/heads/${branch}`) return dir;
  }
  return null;
}
/* The branch's commits origin/main does not hold by content, oldest first; merge commits left out. */
function fresh(dir, sha) {
  const c = tryGit(dir, 'cherry', 'origin/main', sha);
  if (!c.ok) return null; // the commit is gone (branch deleted, gc): nothing to land
  return c.out.split('\n').filter((l) => l.startsWith('+ ')).map((l) => l.slice(2))
    .filter((c) => git(dir, 'rev-list', '--parents', '-n', '1', c).split(' ').length === 2);
}

/* The integration worktree: detached and clean, under the main checkout's .claude/worktrees. */
function integration(main) {
  const dir = path.join(main, '.claude', 'worktrees', '.land');
  if (!fs.existsSync(path.join(dir, '.git'))) { tryGit(main, 'worktree', 'prune'); git(main, 'worktree', 'add', '-q', '--detach', dir, 'origin/main'); }
  link(main, dir); // each time: an install added since is linked too
  return dir;
}
function reset(dir, to) {
  tryGit(dir, 'cherry-pick', '--abort');
  git(dir, 'checkout', '-q', '--detach', '--force', to);
  git(dir, 'clean', '-q', '-fd'); // never -x: the linked installs are ignored files
}

/* Replay each branch's new commits, as queued, onto `base`; a branch that does not apply is left out. */
function replay(dir, base, branches) {
  reset(dir, base);
  const applied = [], conflicted = [];
  for (const b of branches) {
    const before = git(dir, 'rev-parse', 'HEAD');
    const commits = fresh(dir, b.sha);
    if (!commits) { conflicted.push({ ...b, files: [], gone: true }); continue; }
    if (!commits.length) { applied.push({ ...b, commits: 0 }); continue; }
    const r = tryGit(dir, 'cherry-pick', '--allow-empty', '--keep-redundant-commits', ...commits);
    if (r.ok) { applied.push({ ...b, commits: commits.length }); continue; }
    const files = tryGit(dir, 'diff', '--name-only', '--diff-filter=U').out.split('\n').filter(Boolean);
    reset(dir, before);
    conflicted.push({ ...b, files });
  }
  return { applied, conflicted };
}

export const unqueueForTest = unqueue;

/* What became of this bin/land's own branch at its own commit, when a holder before it handled it. */
function settled(main, me) {
  const q = readJSON(qfile(main, me.branch));
  if (q?.sha === me.sha) return null; // still queued: this holder lands it
  const o = readJSON(path.join(outcomes(main), `${encodeURIComponent(me.branch)}@${me.sha}`));
  if (o) { if (o.outcome !== 'landed') say(`${me.branch} at ${me.sha.slice(0, 8)}: ${o.outcome} (told above, in the run that held the lock)`); return o.outcome; }
  if (fresh(main, me.sha)?.length === 0) return 'landed';
  if (q) { say(`${me.branch} was queued again at ${q.sha.slice(0, 8)} by a later bin/land, which lands it`); return 'landed'; }
  say(`${me.branch} left the queue unlanded and no outcome was kept: run bin/land again`); return 'lost';
}

/* Outcomes are for the waiters of the moment; a day on, and a crashed write's .tmp, nobody reads. */
function sweep(main) {
  const old = Date.now() - 24 * 3600 * 1000;
  for (const d of [queueDir(main), outcomes(main)]) {
    let names = []; try { names = fs.readdirSync(d); } catch { continue; }
    for (const f of names) { const p = path.join(d, f); try { const s = fs.statSync(p); if (s.isFile() && (f.endsWith('.tmp') || d === outcomes(main)) && s.mtimeMs < old) fs.rmSync(p, { force: true }); } catch { /* gone */ } }
  }
}

/* A red batch is split in half, recursively, and the halves wait in .split, the first half next: whichever bin/land holds
   the lock next goes on from there, so 1 red branch in n costs about log2(n) checks, not n (2026-11-21: a red batch
   re-checked one branch at a time held the lock five hours). A half landed before the other moves main, so a branch
   red only beside another is found red on main by the same split. The second half keeps the red batch's tree: once
   the first half has landed green, the second half on top of it is that tree again, so it is red without a check
   (bin/check records only greens). A push refused for a batch splits it to one each. */
const splitFile = (main) => path.join(queueDir(main), '.split');
const same = (a, b) => a.branch === b.branch && a.sha === b.sha;
const key = (b) => ({ branch: b.branch, sha: b.sha });
const group = (m, red) => (red ? { m: m.map(key), red } : { m: m.map(key) });
function setGroups(main, g) { if (g.length) writeJSON(splitFile(main), g); else fs.rmSync(splitFile(main), { force: true }); }

/* One step, under the lock: one replay, at most one check, at most one push; then the lock is let go, so a queued land
   or measure is never held behind a whole batch's history. Returns this bin/land's outcome once it is settled, else null. */
async function step(main, me, state) {
  const dir = integration(main);
  sweep(main);
  tryGit(main, 'fetch', '-q', 'origin');
  const done = settled(main, me);
  if (done) return done;
  const q = queued(main);
  const g = (readJSON(splitFile(main)) || []).filter((x) => Array.isArray(x?.m)).map((x) => ({ ...x, m: x.m.filter((e) => q.some((y) => same(y, e))) })).filter((x) => x.m.length);
  const batch = g.length ? q.filter((y) => g[0].m.some((e) => same(y, e))) : q;
  const rest = g.slice(1);
  const base = tryGit(dir, 'rev-parse', 'origin/main').out;
  const { applied, conflicted } = replay(dir, 'origin/main', batch);
  for (const c of conflicted) { say(c.gone ? `${c.branch}: commit ${c.sha.slice(0, 8)} no longer exists: dropped` : `${c.branch} does not apply on main (${c.files.join(', ') || 'conflict'}): rebase it on origin/main, then land again`); unqueue(main, c, 'conflict'); }
  if (conflicted.length) { setGroups(main, g); return null; } // the rest of its group is tried next, without it
  if (!applied.length) return settled(main, me) || 'landed';
  const tree = git(dir, 'rev-parse', 'HEAD^{tree}'), checked = git(dir, 'rev-parse', 'HEAD');
  // a single branch is always checked: an inferred red that rests on a flake must never be blamed on one branch, and
  // then refused at that commit
  const known = applied.length > 1 && g.length && g[0].red === tree;
  if (known) say(`${applied.map((a) => a.branch).join(', ')}: the same tree as the red batch before it: red, not checked again`);
  const code = known ? 1 : applied.some((a) => a.commits) ? await check(dir, ['--no-fix']) : 0;
  if (code !== 0) {
    if (applied.length === 1) { say(`${applied[0].branch} is red on main: fix it, then land again`); unqueue(main, applied[0], 'red'); setGroups(main, rest); return null; }
    const h = Math.ceil(applied.length / 2);
    say(`the batch of ${applied.length} is red: trying it in halves of ${h} and ${applied.length - h}`);
    setGroups(main, [group(applied.slice(0, h)), group(applied.slice(h), tree), ...rest]);
    return null;
  }
  // what is pushed is the tree that was checked, or nothing: a second lander in this worktree moves it under the check
  const sha = git(dir, 'rev-parse', 'HEAD');
  if (sha !== checked || lockLost()) {
    say(lockLost() ? 'the measuring lock was lost during the check: not pushed; again' : 'the integration worktree changed during the check: checking again');
    if (++state.moved >= 4) { say('the integration worktree kept changing: run bin/land again'); return 'busy'; }
    return null;
  }
  const push = tryGit(dir, 'push', '-q', 'origin', `${checked}:refs/heads/main`);
  if (!push.ok) {
    // only a main that moved is worth another attempt; a push refused with main where it was (a hook: a commit naming
    // a project) is said whole and fails each branch, never four "main moved" retries that hide the reason (2026-11-21)
    // (a fetch that fails cannot say main is unmoved: tried again, as before)
    if (!tryGit(dir, 'fetch', '-q', 'origin').ok || tryGit(dir, 'rev-parse', 'origin/main').out !== base) {
      say(`main moved during the check, or could not be asked (${push.out.split('\n').pop()}): again`);
      if (++state.moved >= 4) { say('main kept moving through four attempts: run bin/land again'); return 'busy'; }
      return null;
    }
    say(`the push was refused, main where it was:\n${push.out.split('\n').map((l) => `  ${l}`).join('\n')}`);
    // a batch: one each, so the refusal falls on the branch that carries it and the rest still land
    if (applied.length > 1) { setGroups(main, [...applied.map((a) => group([a])), ...rest]); say('landing one at a time'); return null; }
    say(`${applied[0].branch}: not landed (the push was refused, above): fix it, then land again`); unqueue(main, applied[0], 'refused');
    setGroups(main, rest);
    return null;
  }
  for (const a of applied) {
    unqueue(main, a, 'landed');
    say(`landed ${a.branch} (${a.commits} commit${a.commits === 1 ? '' : 's'}) at ${sha.slice(0, 8)}`);
    const wt = worktreeOf(main, a.branch);
    // a branch not moved since it was queued now is main; one committed on since keeps its work for the next landing
    if (wt && tryGit(wt, 'rev-parse', 'HEAD').out === a.sha) {
      const r = tryGit(wt, 'reset', '-q', '--keep', sha);
      if (!r.ok) say(`${a.branch}: left where it was (${r.out.split('\n')[0]})`);
    }
  }
  setGroups(main, rest);
  tryGit(main, 'fetch', '-q', 'origin');
  if (tryGit(main, 'symbolic-ref', '-q', 'HEAD').out === 'refs/heads/main') {
    const ff = tryGit(main, 'merge', '-q', '--ff-only', 'origin/main');
    if (!ff.ok) say(`the main checkout stays where it was (${ff.out.split('\n')[0]}); main itself is landed`);
  }
  return null;
}

/* bin/check --quick --no-fix on a commit merged with origin/main (a step fixed on main since it branched does not refuse
   it), through check-cache (a tree checked before answers at once): its exit code, its output, and the steps its closing
   summary names as failed. A commit that does not merge is refused here, as the replay would. */
async function quickCheck(main, sha) {
  tryGit(main, 'fetch', '-q', 'origin');
  const t = temp(main, git(main, 'rev-parse', 'origin/main'));
  try {
    const m = tryGit(t.dir, '-c', 'user.name=bin-land', '-c', 'user.email=bin-land@localhost', 'merge', '-q', '--no-edit', sha);
    if (!m.ok) {
      const files = tryGit(t.dir, 'diff', '--name-only', '--diff-filter=U').out.split('\n').filter(Boolean);
      // a merge refused for another reason (unrelated histories) says that reason, never "conflict"
      return files.length ? { code: 1, conflict: files } : { code: 1, out: m.out, failed: [`merging with origin/main: ${m.out.split('\n')[0]}`] };
    }
    return await new Promise((resolve) => {
      let out = '';
      const c = spawn(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-cache.mjs'), t.dir, '--quick', '--no-fix'], { stdio: ['ignore', 'pipe', 'pipe'] });
      c.stdout.setEncoding('utf8'); c.stderr.setEncoding('utf8');
      c.stdout.on('data', (d) => { out += d; }); c.stderr.on('data', (d) => { out += d; });
      c.on('error', (e) => resolve({ code: 1, out: String(e.message), failed: [] }));
      c.on('close', (code) => {
        const sum = out.split('\n'), at = sum.findIndex((l) => /^== \d+ FAILED/.test(l));
        const failed = at < 0 ? [] : sum.slice(at + 1).filter((l) => /^ {2}- /.test(l)).map((l) => l.slice(4));
        resolve({ code: code ?? 1, out, failed });
      });
    });
  } finally { t.remove(); }
}

/* The main checkout's dashboards check, healing: the line saying which stale services it restarted, or null. Its verdict
   is the full check's to give, so nothing else of it is read here. */
function healServices(main) {
  const script = path.join(main, 'tools', 'figma-audit', 'check-services.mjs');
  if (!fs.existsSync(script)) return Promise.resolve(null);
  return new Promise((resolve) => {
    let out = '';
    const c = spawn(process.execPath, [script, '--heal'], { cwd: main, stdio: ['ignore', 'pipe', 'ignore'] });
    c.stdout.setEncoding('utf8'); c.stdout.on('data', (d) => { out += d; });
    c.on('error', () => resolve(null));
    c.on('close', () => resolve(out.split('\n').find((l) => / restarted/.test(l)) || null));
  });
}

export async function land(from, target) {
  const main = mainOf(from);
  const asDir = target && fs.existsSync(target) ? path.resolve(target) : null;
  const branch = target && !asDir ? target : git(asDir || from, 'rev-parse', '--abbrev-ref', 'HEAD');
  if (branch === 'HEAD') { say('nothing to land: no branch is checked out here'); return 2; }
  // main in the main checkout holds whatever any session committed there, landed by nobody's choice
  if (branch === 'main') { say('main itself does not land: commit the work on a worktree branch (bin/worktree <work>) and land that'); return 2; }
  const wt = worktreeOf(main, branch);
  // only commits land: what is uncommitted stays where it is, said so nobody thinks it went
  if (wt && git(wt, 'status', '--porcelain', '--untracked-files=no')) say(`${branch} has uncommitted changes in ${wt}: they stay there; only its commits land`);
  const sha = git(main, 'rev-parse', `refs/heads/${branch}`);
  // red on main at this very commit: another try checks the same tree for the same answer
  const was = readJSON(path.join(outcomes(main), `${encodeURIComponent(branch)}@${sha}`));
  if (was?.outcome === 'red') { say(`${branch} at ${sha.slice(0, 8)} was red on main at ${new Date(was.at).toTimeString().slice(0, 5)}: commit a fix, or rebase on origin/main, then land again`); return 1; }
  // the quick check first, on the commit merged with main (a temporary worktree), with no lock: a branch it finds red
  // never waits for the lock and a full check to be told so (2026-11-24: two lands red on quick steps after 13 minutes each)
  // beside it, stale dashboards are restarted (the main checkout's check-services --heal: those they run from), outside
  // the lock, so the full check under it only judges them (2026-11-24: stale dashboards failed a land unrelated to them)
  const [quick, healed] = await Promise.all([quickCheck(main, sha), healServices(main)]);
  if (healed) say(healed);
  if (quick.conflict) { say(`${branch} does not apply on main (${quick.conflict.join(', ')}): rebase it on origin/main, then land again`); return 1; }
  if (quick.code !== 0) {
    say(`${branch} at ${sha.slice(0, 8)}: the quick check's run:\n${quick.out.trimEnd().split('\n').map((l) => `  ${l}`).join('\n')}`);
    say(`${branch} not queued: the quick check is red: ${quick.failed.join(', ') || 'see its run above'}. Fix it, commit, then land again`);
    return 1;
  }
  fs.mkdirSync(queueDir(main), { recursive: true });
  writeJSON(qfile(main, branch), { branch, sha, at: Date.now() });
  say(`${branch} queued at ${sha.slice(0, 8)}`);
  // a run inside a holder (a test, a nested call) holds nothing new
  // inside a holder (a test, a nested call) the lock is the holder's: never let go of it here
  const outer = !!process.env.TOOLKIT_LOCK_HELD;
  const state = { moved: 0, unheld: 0 }, mine = qfile(main, branch); // the path once: no git call each 2 s
  for (;;) {
    // landed (or dropped) by another holder while this one waits: read it now, not after their checks
    const got = await hold(`bin/land ${branch}`, { first: true, stop: () => readJSON(mine)?.sha !== sha });
    // never without the lock: two landers share one integration worktree, and one pushed the other's tree as its own
    // batch, marking two branches landed that were not (2026-11-22)
    if (got === false && !outer) {
      if (++state.unheld >= 3) { say('the measuring lock could not be taken three times: not landed by this run (still queued: a later holder may land it)'); return 1; }
      say('the measuring lock could not be taken: waiting again, never landing without it');
      await new Promise((r) => setTimeout(r, PAUSE)); continue;
    }
    state.unheld = 0;
    if (got === null) {
      const o = settled(main, { branch, sha });
      if (o) return o === 'landed' ? 0 : 1;
      continue; // queued again at this commit by a second bin/land of it: wait on
    }
    let out;
    try { out = await step(main, { branch, sha }, state); } finally { if (!outer) release(); }
    out ||= settled(main, { branch, sha }); // its own landing is read without another turn of the lock
    if (out) return out === 'landed' ? 0 : 1;
    // a waiter asks the lock once a second (lock.mjs HOLD): without a pause this holder takes it back first, every time
    if (!outer) await new Promise((r) => setTimeout(r, PAUSE));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  if (process.argv[2] === '--queue') { for (const q of queued(mainOf(process.cwd()))) console.log(`${q.branch} ${q.sha.slice(0, 8)} queued ${new Date(q.at).toTimeString().slice(0, 5)}`); }
  else process.exitCode = await land(process.cwd(), process.argv[2]);
}
