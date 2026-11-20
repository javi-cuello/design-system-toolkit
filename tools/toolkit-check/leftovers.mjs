#!/usr/bin/env node
/*
 * Worktrees, branches and stashes left behind. On 2026-11-19 the toolkit held nine agent worktrees with their branches,
 * a review branch, two scratch worktrees and two stashes, all weeks old: the Agent tool removes a worktree only when its
 * agent made no commits, and these had commits that reached main under other hashes.
 *
 *   sweep(repo)      bin/closing (the Stop hook): removes, without asking, each linked worktree and its branch, and
 *                    each other local branch, that is clean, over a day old, and merged into main — no commit of its own
 *                    (rev-list main..<it> is empty) or every commit's subject already on main (a rebase or cherry-pick)
 *                    — and parks each worktree of a piece of work (.claude/worktrees/<work>) left unlanded and untouched
 *                    for a week by every session (none running claims it): files left uncommitted are committed on its
 *                    branch first, saying so; its folder goes, its branch stays, and bin/worktree <work> reopens it
 *   leftovers(repo)  bin/check (--warn): what is over a day old and cannot go that way — a worktree or branch with
 *                    unmerged commits or uncommitted files, and every stash — with its age and its session when known
 *
 * Nothing dirty, unmerged or stashed is ever removed: it is said, and a person or its session decides.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DAY = 864e5;
const git = (repo, args) => { try { return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };

/* The branch work lands on: main, else master. */
const mainOf = (repo) => ['main', 'master'].map((b) => `refs/heads/${b}`).find((b) => git(repo, ['rev-parse', '--verify', '-q', b]) !== null) || null;

/* Merged: nothing of its own past main, or merging it into main would change nothing (git merge-tree: the merged tree
   is main's own). That covers a rebase, a cherry-pick and a squash, whatever their hashes, and a commit whose subject
   matches one on main ("wip") but whose content main lacks is unmerged: it changes the tree. The brief's subject test
   is subsumed: every subject on main with its content on main merges to main's tree. */
export function merged(repo, ref, main) {
  if (git(repo, ['rev-list', '--count', `${main}..${ref}`]) === '0') return true;
  const tree = git(repo, ['merge-tree', '--write-tree', main, ref]); // fails (null) on a conflict: not merged
  return !!tree && tree.split('\n')[0] === git(repo, ['rev-parse', `${main}^{tree}`]);
}

const mtime = (f) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } };
const days = (ms) => `${Math.floor(ms / DAY)}d`;

/* Every linked worktree and local branch, and every stash, with what decides its fate. */
function inventory(repo, now) {
  const main = mainOf(repo);
  const items = [];
  const porcelain = (git(repo, ['worktree', 'list', '--porcelain']) || '').split('\n\n').filter(Boolean);
  const held = new Set();
  porcelain.forEach((block, i) => {
    const f = Object.fromEntries(block.split('\n').map((l) => [l.split(' ')[0], l.slice(l.indexOf(' ') + 1)]));
    const branch = f.branch ? f.branch.replace(/^refs\/heads\//, '') : '';
    if (branch) held.add(branch);
    if (i === 0) return; // the main checkout
    if (branch && `refs/heads/${branch}` === main) return; // main checked out in a linked worktree: never removed with it
    const there = fs.existsSync(f.worktree);
    // ignored files count (git worktree remove deletes them: a local .env, notes), aside from what nobody wrote by hand:
    // installed packages, a build cache, and the links bin/worktree makes to the main checkout's installs
    // (tools/shared/worktree.mjs); -unormal whatever status.showUntrackedFiles says
    const admin = there ? git(f.worktree, ['rev-parse', '--absolute-git-dir']) : null;
    const st = there ? git(f.worktree, ['status', '--porcelain', '--ignored=matching', '-unormal']) : '';
    const made = (p) => /(^|\/)(node_modules|\.astro)\/?$/.test(p) || (() => { try { return fs.lstatSync(path.join(f.worktree, p.replace(/\/$/, ''))).isSymbolicLink(); } catch { return false; } })();
    const lines = st === null ? null : st.split('\n').filter(Boolean);
    const dirty = lines === null || lines.some((l) => !(l.startsWith('!! ') && made(l.slice(3))));
    // an ignored file someone wrote (.env, notes): git worktree remove deletes it, and a commit leaves it out
    const ignoredOwn = lines === null || lines.some((l) => l.startsWith('!! ') && !made(l.slice(3)));
    // a merge, cherry-pick, revert or rebase in progress: half-done by someone, never committed or removed by a sweep
    const busy = !!admin && ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'BISECT_LOG'].some((x) => fs.existsSync(path.join(admin, x)));
    const tip = Number(git(repo, ['log', '-1', '--format=%ct', f.HEAD])) * 1000 || 0;
    const age = now - Math.max(tip, admin ? mtime(path.join(admin, 'index')) : 0, there ? mtime(f.worktree) : 0);
    items.push({ kind: 'worktree', path: f.worktree, branch, tip: f.HEAD || '', dirty, ignoredOwn, busy, merged: !!main && merged(repo, f.HEAD, main), age, locked: 'locked' in f });
  });
  for (const l of (git(repo, ['for-each-ref', 'refs/heads', '--format=%(refname:short) %(committerdate:unix) %(objectname)']) || '').split('\n').filter(Boolean)) {
    const [branch, at, tip] = l.split(' ');
    if (`refs/heads/${branch}` === main || held.has(branch)) continue;
    // its age is its last change, its tip's date or its last reflog entry (made today at an old commit is a day old tomorrow)
    const moved = Number(git(repo, ['log', '-g', '-1', '--format=%ct', `refs/heads/${branch}`])) * 1000 || 0;
    items.push({ kind: 'branch', branch, tip, dirty: false, merged: !!main && merged(repo, `refs/heads/${branch}`, main), age: now - Math.max(Number(at) * 1000, moved) });
  }
  for (const l of (git(repo, ['stash', 'list', '--format=%gd %ct %gs']) || '').split('\n').filter(Boolean)) {
    const [ref, at, ...msg] = l.split(' ');
    items.push({ kind: 'stash', ref, msg: msg.join(' '), age: now - Number(at) * 1000 });
  }
  return { main, items };
}

const removable = (x) => x.kind !== 'stash' && !x.dirty && !x.busy && x.merged && !x.locked && x.age > DAY;
/* An abandoned piece of work: a worktree bin/worktree made, every change committed, not landed, a week untouched. Its
   folder is all that goes; the commits stay on its branch. Never another tool's worktree, an agent's, or one with dirt. */
const PARK = 7 * DAY;
/* A running session keeps a worktree: one that made or reopened it (worktree-sessions.json, tools/shared/worktree.mjs),
   or one whose folder is in it (Claude Code's session registry records each session's cwd), which covers `claude -w`
   and a session that only cd'd in. */
function claimed(repo, name, dir) {
  let all = {}; try { all = JSON.parse(fs.readFileSync(path.join(git(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir']) || '', 'worktree-sessions.json'), 'utf8')); } catch { /* no claims: the cwd test alone */ }
  const reg = process.env.TOOLKIT_SESSIONS_DIR || path.join(process.env.HOME || '', '.claude', 'sessions'); // Claude Code's session registry
  let live = []; try { live = fs.readdirSync(reg).filter((f) => f.endsWith('.json')).map((f) => { try { return JSON.parse(fs.readFileSync(path.join(reg, f), 'utf8')); } catch { return null; } }).filter(Boolean); } catch { /* no registry */ }
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
  const running = live.filter((s) => alive(s.pid));
  const inside = (c) => { const a = real(c || ''), b = real(dir || ''); return !!dir && (a === b || a.startsWith(b + path.sep)); };
  return running.some((s) => inside(s.cwd)) || Object.entries(all).some(([id, names]) => names.includes(name) && running.some((s) => s.sessionId === id));
}
const real = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
const parkable = (x, repo) => x.kind === 'worktree' && (x.dirty || !x.merged) && !x.ignoredOwn && !x.busy && !x.locked && x.age > PARK && x.branch
  && real(path.dirname(x.path)) === real(path.join(repo, '.claude', 'worktrees')) && !path.basename(x.path).startsWith('agent-') && !path.basename(x.path).startsWith('.');

/* Remove what is merged, clean and over a day old; returns what went, one name each. */
export function sweep(repo, now = Date.now()) {
  git(repo, ['worktree', 'prune']); // a worktree whose folder is gone first, so its branch is free
  const { main, items } = inventory(repo, now);
  if (!main) return [];
  const gone = [];
  for (const x of items.filter((i) => removable(i) && !(i.kind === 'worktree' && claimed(repo, path.basename(i.path), i.path)))) {
    // git refuses to remove a worktree with changes or untracked files (no --force): the last guard against a race
    if (x.kind === 'worktree' && git(repo, ['worktree', 'remove', x.path]) === null) continue;
    // -D, not -d: a rebased branch's commits are on main under other hashes, which -d does not see; merged() checked
    if (x.branch && git(repo, ['branch', '-D', x.branch]) === null && x.kind === 'branch') continue;
    // the tip is said, so a removal judged by subject alone can be undone (git branch <name> <tip>)
    gone.push(`${x.kind === 'worktree' ? path.relative(repo, x.path) || x.path : x.branch} (was ${x.tip.slice(0, 8)})`);
  }
  for (const x of items.filter((i) => parkable(i, repo) && !claimed(repo, path.basename(i.path), i.path))) {
    // what was never committed goes on its own branch first, never lost and never on main; ignored files stay out
    let saved = '';
    if (x.dirty) {
      if (git(x.path, ['add', '-A']) === null || git(x.path, ['commit', '-q', '--no-verify', '-m', 'Parked by the sweep: files left uncommitted in this worktree for a week, committed as they were']) === null) continue;
      saved = ' (its uncommitted files committed first)';
    }
    if (git(repo, ['worktree', 'remove', x.path]) === null) continue; // changed since it was read: stays
    gone.push(`${path.relative(repo, x.path)} parked${saved}: its work stays on ${x.branch}; bin/worktree ${path.basename(x.path)} reopens it`);
  }
  return gone;
}

/* What is over a day old and stays: one line each, with its owner session when known. */
export async function leftovers(repo, now = Date.now()) {
  const { items } = inventory(repo, now);
  const { worktreeOwner } = await import('../claude-hooks/owners.mjs');
  const out = [];
  for (const x of items.filter((i) => i.age > DAY && !removable(i))) {
    const why = x.kind === 'stash' ? `stash "${x.msg}"` : [x.dirty && 'uncommitted files', !x.merged && 'commits not on main', x.locked && 'locked'].filter(Boolean).join(', ');
    const name = x.kind === 'worktree' ? `${path.relative(repo, x.path) || x.path}${x.branch ? ` (${x.branch})` : ''}` : x.kind === 'stash' ? x.ref : x.branch;
    const owner = x.kind === 'worktree' ? worktreeOwner(x.path) : '';
    out.push(`${days(x.age)}  ${x.kind} ${name}: ${why}${owner ? ` — ${owner}` : ''}`);
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const repo = path.resolve(process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || '.');
  if (process.argv.includes('--sweep')) { const g = sweep(repo); console.log(g.length ? `removed ${g.join(', ')}` : 'nothing to remove'); }
  else for (const l of await leftovers(repo)) console.log(l);
}
