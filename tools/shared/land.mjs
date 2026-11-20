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
export const queued = (main) => { try { return fs.readdirSync(queueDir(main)).map((f) => JSON.parse(fs.readFileSync(path.join(queueDir(main), f), 'utf8'))).sort((a, b) => a.at - b.at); } catch { return []; } };
const unqueue = (main, branch) => fs.rmSync(qfile(main, branch), { force: true });

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
  return git(dir, 'cherry', 'origin/main', sha).split('\n').filter((l) => l.startsWith('+ ')).map((l) => l.slice(2))
    .filter((c) => git(dir, 'rev-list', '--parents', '-n', '1', c).split(' ').length === 2);
}

/* The integration worktree: detached and clean, under the main checkout's .claude/worktrees. */
function integration(main) {
  const dir = path.join(main, '.claude', 'worktrees', '.land');
  if (!fs.existsSync(path.join(dir, '.git'))) { git(main, 'worktree', 'add', '-q', '--detach', dir, 'origin/main'); link(main, dir); }
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
    if (!commits.length) { applied.push({ ...b, commits: 0 }); continue; }
    const r = tryGit(dir, 'cherry-pick', '--allow-empty', '--keep-redundant-commits', ...commits);
    if (r.ok) { applied.push({ ...b, commits: commits.length }); continue; }
    const files = tryGit(dir, 'diff', '--name-only', '--diff-filter=U').out.split('\n').filter(Boolean);
    reset(dir, before);
    conflicted.push({ ...b, files });
  }
  return { applied, conflicted };
}

async function landBatch(main, mine) {
  const dir = integration(main);
  for (let attempt = 0; attempt < 3; attempt++) {
    tryGit(main, 'fetch', '-q', 'origin');
    const batch = queued(main);
    if (!batch.some((b) => b.branch === mine)) return 'landed'; // a holder before this one landed it
    const { applied, conflicted } = replay(dir, 'origin/main', batch);
    for (const c of conflicted) { say(`${c.branch} does not apply on main (${c.files.join(', ') || 'conflict'}): rebase it on origin/main, then land again`); unqueue(main, c.branch); }
    if (conflicted.some((c) => c.branch === mine)) return 'conflict';
    if (!applied.length) return 'landed';
    const code = applied.some((a) => a.commits) ? await check(dir, ['--no-fix']) : 0;
    if (code !== 0) {
      if (applied.length === 1) { say(`${applied[0].branch} is red on main: fix it, then land again`); unqueue(main, applied[0].branch); return applied[0].branch === mine ? 'red' : 'landed'; }
      // one red branch must not hold the others: each alone; the green ones land together on the next attempt
      say(`the batch of ${applied.length} is red: trying each alone`);
      for (const a of applied) {
        replay(dir, 'origin/main', [a]);
        if (await check(dir, ['--no-fix']) !== 0) { say(`${a.branch} is red on main: fix it, then land again`); unqueue(main, a.branch); if (a.branch === mine) return 'red'; }
      }
      continue;
    }
    const sha = git(dir, 'rev-parse', 'HEAD');
    const push = tryGit(dir, 'push', '-q', 'origin', 'HEAD:refs/heads/main');
    if (!push.ok) { say(`main moved during the check (${push.out.split('\n').pop()}): again`); continue; }
    for (const a of applied) {
      unqueue(main, a.branch);
      say(`landed ${a.branch} (${a.commits} commit${a.commits === 1 ? '' : 's'}) at ${sha.slice(0, 8)}`);
      const wt = worktreeOf(main, a.branch);
      // a branch not moved since it was queued now is main; one committed on since keeps its work for the next landing
      if (wt && tryGit(wt, 'rev-parse', 'HEAD').out === a.sha) {
        const r = tryGit(wt, 'reset', '-q', '--keep', sha);
        if (!r.ok) say(`${a.branch}: left where it was (${r.out.split('\n')[0]})`);
      }
    }
    tryGit(main, 'fetch', '-q', 'origin');
    const ff = tryGit(main, 'merge', '-q', '--ff-only', 'origin/main');
    if (!ff.ok) say(`the main checkout stays where it was (${ff.out.split('\n')[0]}); main itself is landed`);
    return 'landed';
  }
  say('main kept moving through three attempts: run bin/land again');
  return 'busy';
}

export async function land(from, target) {
  const main = mainOf(from);
  const asDir = target && fs.existsSync(target) ? path.resolve(target) : null;
  const branch = target && !asDir ? target : git(asDir || from, 'rev-parse', '--abbrev-ref', 'HEAD');
  if (branch === 'HEAD') { say('nothing to land: no branch is checked out here'); return 2; }
  const wt = worktreeOf(main, branch);
  // only commits land: what is uncommitted stays where it is, said so nobody thinks it went
  if (wt && git(wt, 'status', '--porcelain', '--untracked-files=no')) say(`${branch} has uncommitted changes in ${wt}: they stay there; only its commits land`);
  const sha = git(main, 'rev-parse', `refs/heads/${branch}`);
  fs.mkdirSync(queueDir(main), { recursive: true });
  fs.writeFileSync(qfile(main, branch), JSON.stringify({ branch, sha, at: Date.now() }));
  say(`${branch} queued at ${sha.slice(0, 8)}`);
  // a run inside a holder (a test, a nested call) holds nothing new
  await hold(`bin/land ${branch}`);
  try { return (await landBatch(main, branch)) === 'landed' ? 0 : 1; } finally { release(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  if (process.argv[2] === '--queue') { for (const q of queued(mainOf(process.cwd()))) console.log(`${q.branch} ${q.sha.slice(0, 8)} queued ${new Date(q.at).toTimeString().slice(0, 5)}`); }
  else process.exitCode = await land(process.cwd(), process.argv[2]);
}
