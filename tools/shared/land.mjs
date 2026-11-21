#!/usr/bin/env node
/*
 * Landing: the one way work reaches main. A session commits on its own branch (a worktree per piece of work,
 * worktree.mjs) and runs bin/land; the branch joins a queue, and whoever holds the measuring lock lands every queued
 * branch together: their new commits replayed onto origin/main in an integration worktree, one full check of the
 * result, and a push from there. N sessions landing at once cost one check, not N (the bors model: test main with the
 * change applied, then move main; github.com/bors-ng/bors-ng). A branch whose commits do not apply, or that is red
 * when tried alone, is dropped from the batch and told; the others still land.
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
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hold, release } from './lock.mjs';
import { run as check } from './check-cache.mjs';
import { mainOf, link } from './worktree.mjs';

const git = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tryGit = (dir, ...a) => { try { return { ok: true, out: git(dir, ...a) }; } catch (e) { return { ok: false, out: String(e.stderr || e.message).trim() }; } };
const say = (l) => console.log(`land: ${l}`);

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

async function landBatch(main, me) {
  const dir = integration(main);
  sweep(main);
  let alone = null; // a batch red together though each is green alone: one branch at a time
  for (let attempt = 0; attempt < 4; attempt++) {
    tryGit(main, 'fetch', '-q', 'origin');
    const done = settled(main, me);
    if (done) return done;
    let batch = queued(main);
    if (alone) batch = batch.filter((b) => b.branch === alone).concat(batch.some((b) => b.branch === alone) ? [] : batch.slice(0, 1)).slice(0, 1);
    const base = tryGit(dir, 'rev-parse', 'origin/main').out;
    const { applied, conflicted } = replay(dir, 'origin/main', batch);
    for (const c of conflicted) { say(c.gone ? `${c.branch}: commit ${c.sha.slice(0, 8)} no longer exists: dropped` : `${c.branch} does not apply on main (${c.files.join(', ') || 'conflict'}): rebase it on origin/main, then land again`); unqueue(main, c, 'conflict'); }
    if (conflicted.length) continue;
    if (!applied.length) return 'landed';
    const code = applied.some((a) => a.commits) ? await check(dir, ['--no-fix']) : 0;
    if (code !== 0) {
      if (applied.length === 1) { say(`${applied[0].branch} is red on main: fix it, then land again`); unqueue(main, applied[0], 'red'); continue; }
      // one red branch must not hold the others: each alone; the green ones land together on the next attempt
      say(`the batch of ${applied.length} is red: trying each alone`);
      let dropped = 0;
      for (const a of applied) {
        replay(dir, 'origin/main', [a]);
        if (await check(dir, ['--no-fix']) !== 0) { say(`${a.branch} is red on main: fix it, then land again`); unqueue(main, a, 'red'); dropped++; }
      }
      if (!dropped) { alone = applied[0].branch; say('each is green alone, red together: landing one at a time'); }
      continue;
    }
    const sha = git(dir, 'rev-parse', 'HEAD');
    const push = tryGit(dir, 'push', '-q', 'origin', 'HEAD:refs/heads/main');
    if (!push.ok) {
      // only a main that moved is worth another attempt; a push refused with main where it was (a hook: a commit naming
      // a project) is said whole and fails each branch, never four "main moved" retries that hide the reason (2026-11-21)
      // (a fetch that fails cannot say main is unmoved: tried again, as before)
      if (!tryGit(dir, 'fetch', '-q', 'origin').ok || tryGit(dir, 'rev-parse', 'origin/main').out !== base) { say(`main moved during the check, or could not be asked (${push.out.split('\n').pop()}): again`); continue; }
      say(`the push was refused, main where it was:\n${push.out.split('\n').map((l) => `  ${l}`).join('\n')}`);
      // a batch: each alone, so the refusal falls on the branch that carries it and the rest still land
      if (applied.length > 1) { alone = applied[0].branch; say('landing one at a time'); continue; }
      say(`${applied[0].branch}: not landed (the push was refused, above): fix it, then land again`); unqueue(main, applied[0], 'refused');
      alone = null;
      continue;
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
    tryGit(main, 'fetch', '-q', 'origin');
    if (tryGit(main, 'symbolic-ref', '-q', 'HEAD').out === 'refs/heads/main') {
      const ff = tryGit(main, 'merge', '-q', '--ff-only', 'origin/main');
      if (!ff.ok) say(`the main checkout stays where it was (${ff.out.split('\n')[0]}); main itself is landed`);
    }
    alone = null;
  }
  const end = settled(main, me);
  if (end) return end;
  say('main kept moving, or other branches kept failing, through four attempts: run bin/land again');
  return 'busy';
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
  fs.mkdirSync(queueDir(main), { recursive: true });
  writeJSON(qfile(main, branch), { branch, sha, at: Date.now() });
  say(`${branch} queued at ${sha.slice(0, 8)}`);
  // a run inside a holder (a test, a nested call) holds nothing new
  await hold(`bin/land ${branch}`);
  try { return (await landBatch(main, { branch, sha })) === 'landed' ? 0 : 1; } finally { release(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  if (process.argv[2] === '--queue') { for (const q of queued(mainOf(process.cwd()))) console.log(`${q.branch} ${q.sha.slice(0, 8)} queued ${new Date(q.at).toTimeString().slice(0, 5)}`); }
  else process.exitCode = await land(process.cwd(), process.argv[2]);
}
