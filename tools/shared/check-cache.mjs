#!/usr/bin/env node
/*
 * bin/check's front door: the measuring lock (lock.mjs), plus one reuse. A run on a clean tree records its result
 * against that tree; a later run on the same clean tree, with the same options, prints that result instead of
 * running again. Sessions queued behind one another's runs mostly check the same commit, and each waited 8 to 60
 * minutes for an answer the first run already had (2026-11-20). The record is asked twice: before waiting for the
 * lock, and again once the lock is held, so a run queued behind the same tree's run takes its answer.
 *
 *   node tools/shared/check-cache.mjs <repo> [--quick] [--no-fix]   bin/check's own entry
 *   node tools/shared/check-cache.mjs --commit <repo> <commit>       the pre-push check: that commit, as committed
 *
 * Reused only when the tree is clean (nothing modified, staged or untracked), its git tree id and the run's kind
 * (quick or full) match, and the result is under MAX_AGE old. --no-fix and a --fix run that left the tree unchanged
 * read the same tree the same way, so they share a record. --commit checks the commit itself in a clean temporary
 * worktree, never a working tree, so another session's uncommitted files cannot decide a push. --quick takes no
 * lock. A run is recorded only when the tree was clean before it and unchanged after, and only a green that ran to
 * its end: a red may be a flake a re-run should retry. TOOLKIT_CHECK_FRESH=1 always runs. Ignored files
 * (node_modules) are not in the key. What it cannot see: state outside the repo (another project's files, a running
 * dashboard).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hold, release, lockDir } from './lock.mjs';
import { temp } from './worktree.mjs';

export const MAX_AGE = 6 * 3600 * 1000;
const KEEP = 40; // lines of the run's output kept: the closing summary and what it names
const cacheFile = () => path.join(lockDir(), 'toolkit-check-cache.json');

/* The clean tree's id, or null when the tree is not clean or git cannot say. */
export function treeKey(repo) {
  try {
    const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return git('status', '--porcelain').trim() ? null : git('rev-parse', 'HEAD^{tree}').trim();
  } catch { return null; }
}
// A run is quick or full: --no-fix and a --fix run that left the tree as it was read the same tree the same way.
const mode = (args) => (args.includes('--quick') ? 'quick' : 'full');
const reusable = (args) => !process.env.TOOLKIT_CHECK_FRESH && args.every((a) => a === '--quick' || a === '--no-fix');
const read = () => { try { const a = JSON.parse(fs.readFileSync(cacheFile(), 'utf8')); return Array.isArray(a) ? a : []; } catch { return []; } };
export function lookup(tree, args, now = Date.now()) {
  if (!tree) return null;
  return read().find((e) => e.tree === tree && e.mode === mode(args) && now - e.at < MAX_AGE) || null;
}
function store(entry) {
  const all = [entry, ...read().filter((e) => e.mode && !(e.tree === entry.tree && e.mode === entry.mode))].slice(0, 20);
  const tmp = cacheFile() + '.' + process.pid;
  try { fs.writeFileSync(tmp, JSON.stringify(all)); fs.renameSync(tmp, cacheFile()); } catch { /* unrecorded: the next run runs */ }
}
function replay(e) {
  const at = new Date(e.at).toTimeString().slice(0, 5);
  console.error(`bin/check: this clean tree (${e.tree.slice(0, 8)}) was checked at ${at}; that run's result follows (TOOLKIT_CHECK_FRESH=1 runs it again)`);
  process.stdout.write(e.tail.endsWith('\n') ? e.tail : e.tail + '\n');
  return e.status;
}

export async function run(repo, args) {
  const can = reusable(args);
  let hit = can && lookup(treeKey(repo), args);
  if (hit) return replay(hit);
  // --quick (under a minute, no suites) takes no lock: it was waiting behind six-minute runs for nothing. Unlocked
  // (no python3) a run is still marked held, or the child bin/check would come back here without end.
  if (mode(args) === 'quick' || !(await hold(`bin/check${args.length ? ' ' + args.join(' ') : ''}`))) process.env.TOOLKIT_LOCK_HELD = String(process.pid);
  const before = can ? treeKey(repo) : null;
  hit = before && lookup(before, args);
  if (hit) { release(); return replay(hit); }
  const result = await new Promise((resolve) => {
    let tail = '';
    const c = spawn(path.join(repo, 'bin', 'check'), args, { stdio: ['inherit', 'pipe', 'inherit'], env: process.env });
    c.stdout.setEncoding('utf8');
    c.stdout.on('data', (d) => { process.stdout.write(d); tail = (tail + d).split('\n').slice(-KEEP - 1).join('\n'); });
    c.on('error', () => resolve({ code: 1, tail }));
    c.on('close', (code, signal) => resolve({ code: code ?? 1, signal, tail }));
  });
  // only a green that ran to its end: a red may be a flake that a plain re-run should retry, and a killed run proves nothing
  if (before && result.code === 0 && !result.signal && treeKey(repo) === before) store({ tree: before, mode: mode(args), status: result.code, tail: result.tail, at: Date.now() });
  release();
  return result.code;
}

/* One commit, read as committed: its recorded full green, else a full --no-fix check in a clean temporary worktree
   of it, so nothing uncommitted in any checkout (another session's half-written file) can turn it red or green. */
export async function atCommit(repo, rev) {
  let tree;
  try { tree = execFileSync('git', ['-C', repo, 'rev-parse', `${rev}^{tree}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { console.error(`check-cache: no commit ${rev}`); return 2; }
  const hit = !process.env.TOOLKIT_CHECK_FRESH && lookup(tree, []);
  if (hit) return replay(hit);
  const t = temp(repo, rev);
  try { return await run(t.dir, ['--no-fix']); } finally { t.remove(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  if (process.argv[2] === '--commit') {
    const [, , , repo, rev] = process.argv;
    if (!repo || !rev) { console.error('usage: check-cache.mjs --commit <repo> <commit>'); process.exit(2); }
    process.exitCode = await atCommit(path.resolve(repo), rev);
  } else {
  const [repo, ...args] = process.argv.slice(2);
  if (!repo) { console.error('usage: check-cache.mjs <repo> [--quick] [other bin/check options…]'); process.exit(2); }
  process.exitCode = await run(path.resolve(repo), args); // exitCode, not exit(): piped output still queued is written first
  }
}
