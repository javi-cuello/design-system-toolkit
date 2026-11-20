#!/usr/bin/env node
/*
 * bin/check's front door: the measuring lock (lock.mjs), plus one reuse. A run on a clean tree records its result
 * against that tree; a later run on the same clean tree, with the same options, prints that result instead of
 * running again. Sessions queued behind one another's runs mostly check the same commit, and each waited 8 to 60
 * minutes for an answer the first run already had (2026-11-20). The record is asked twice: before waiting for the
 * lock, and again once the lock is held, so a run queued behind the same tree's run takes its answer.
 *
 *   node tools/shared/check-cache.mjs <repo> [bin/check options…]
 *
 * Reused only when the tree is clean (nothing modified, staged or untracked), its git tree id and the options
 * match, the result is under MAX_AGE old, and the run is not --no-fix (the pre-push check, which always runs).
 * A run is recorded only when the tree was clean before it and unchanged after (a --fix heal that rewrote a file
 * is not this tree's result). TOOLKIT_CHECK_FRESH=1 always runs. What it cannot see: state outside the repo
 * (another project's files, a running dashboard); a red from there is reused until the tree changes or MAX_AGE.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hold, release, lockDir } from './lock.mjs';

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
const reusable = (args) => !process.env.TOOLKIT_CHECK_FRESH && args.every((a) => a === '--quick');
const read = () => { try { const a = JSON.parse(fs.readFileSync(cacheFile(), 'utf8')); return Array.isArray(a) ? a : []; } catch { return []; } };
export function lookup(tree, args, now = Date.now()) {
  if (!tree) return null;
  return read().find((e) => e.tree === tree && e.args === args.join(' ') && now - e.at < MAX_AGE) || null;
}
function store(entry) {
  const all = [entry, ...read().filter((e) => !(e.tree === entry.tree && e.args === entry.args))].slice(0, 20);
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
  await hold(`bin/check${args.length ? ' ' + args.join(' ') : ''}`);
  const before = can ? treeKey(repo) : null;
  hit = before && lookup(before, args);
  if (hit) { release(); return replay(hit); }
  const result = await new Promise((resolve) => {
    let tail = '';
    const c = spawn(path.join(repo, 'bin', 'check'), args, { stdio: ['inherit', 'pipe', 'inherit'], env: process.env });
    c.stdout.on('data', (d) => { process.stdout.write(d); tail = (tail + d).split('\n').slice(-KEEP - 1).join('\n'); });
    c.on('error', () => resolve({ code: 1, tail }));
    c.on('close', (code) => resolve({ code: code ?? 1, tail }));
  });
  if (before && treeKey(repo) === before) store({ tree: before, args: args.join(' '), status: result.code, tail: result.tail, at: Date.now() });
  release();
  return result.code;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const [repo, ...args] = process.argv.slice(2);
  if (!repo) { console.error('usage: check-cache.mjs <repo> [bin/check options…]'); process.exit(2); }
  process.exit(await run(path.resolve(repo), args));
}
