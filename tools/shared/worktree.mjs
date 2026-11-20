#!/usr/bin/env node
/*
 * A session's own worktree of the toolkit, and the temporary ones a check runs in. Every session works in
 * .claude/worktrees/<work> on branch worktree-<work> (Claude Code's own layout, so `claude -w <work>` and the toolkit
 * agree), named for the work, not the session (user, 2026-11-20). A worktree starts from origin/main, never from
 * local commits nobody has landed. Ignored installs (node_modules, built binaries) are linked from the main checkout,
 * so a check in a worktree runs every step the main checkout runs instead of skipping the ones that need them.
 *
 *   node tools/shared/worktree.mjs <work>     create or find the worktree; prints its path
 *
 * The list of what to link is read from the main checkout each time (ignored node_modules folders and ignored
 * executables), so a new install needs no list kept by hand.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const git = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
/* The main checkout: the first worktree git lists (the one holding the common .git). */
export const mainOf = (dir) => git(dir, 'worktree', 'list', '--porcelain').split('\n')[0].replace(/^worktree /, '');
export const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

/* What a worktree lacks that the main checkout has: ignored node_modules folders and ignored executables. */
export function installs(main) {
  const out = git(main, '-c', 'core.quotePath=off', 'status', '--porcelain', '--ignored', '--untracked-files=normal');
  return out.split('\n').filter((l) => l.startsWith('!! ')).map((l) => l.slice(3).replace(/\/$/, ''))
    .filter((p) => !p.startsWith('.claude') && (path.basename(p) === 'node_modules' || (() => {
      try { const s = fs.statSync(path.join(main, p)); return s.isFile() && (s.mode & 0o111) !== 0; } catch { return false; }
    })()));
}
/* .gitignore's `node_modules/` matches a folder, not a link to one: the links are named in the common .git's
   info/exclude, shared by every worktree, or each worktree would show them as untracked and never read as clean. */
function exclude(main, paths) {
  const file = path.join(git(main, 'rev-parse', '--path-format=absolute', '--git-common-dir'), 'info', 'exclude');
  let text = ''; try { text = fs.readFileSync(file, 'utf8'); } catch { /* none yet */ }
  const have = new Set(text.split('\n')), add = paths.map((p) => '/' + p).filter((l) => !have.has(l));
  if (!add.length) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, (text && !text.endsWith('\n') ? '\n' : '') + (have.has('# worktree links (tools/shared/worktree.mjs)') ? '' : '# worktree links (tools/shared/worktree.mjs)\n') + add.join('\n') + '\n');
}
export function link(main, dir) {
  const list = installs(main);
  exclude(main, list);
  for (const p of list) {
    const to = path.join(dir, p);
    if (fs.existsSync(to) || !fs.existsSync(path.dirname(to))) continue; // the branch has no such folder: nothing to serve
    fs.symlinkSync(path.join(main, p), to);
  }
}

/* The worktree for this work: found if it exists, else made from origin/main (fetched first). */
export function ensure(anyDir, work, base = 'origin/main') {
  const main = mainOf(anyDir), name = slug(work);
  if (!name) throw new Error('a worktree needs a short name for the work, e.g. check-cache');
  const dir = path.join(main, '.claude', 'worktrees', name);
  if (fs.existsSync(path.join(dir, '.git'))) return dir;
  // a folder deleted by hand, or parked, leaves git thinking the branch is still checked out there
  try { git(main, 'worktree', 'prune'); } catch { /* nothing to prune */ }
  try { git(main, 'fetch', '-q', 'origin'); } catch { /* offline: the last fetched origin/main */ }
  const branch = `worktree-${name}`;
  const has = (() => { try { git(main, 'rev-parse', '-q', '--verify', `refs/heads/${branch}`); return true; } catch { return false; } })();
  git(main, 'worktree', 'add', '-q', ...(has ? [dir, branch] : ['-b', branch, dir, base]));
  link(main, dir);
  return dir;
}
/* The running sessions, other than `me`, that made or reopened the worktree `name`: two sessions in one folder is the
   shared-tree trouble worktrees are for (2026-11-20). A session no longer running claims nothing. */
export async function claimedBy(main, name, me) {
  const file = path.join(git(main, 'rev-parse', '--path-format=absolute', '--git-common-dir'), 'worktree-sessions.json');
  let all = {}; try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
  const { sessionName } = await import('./lock.mjs');
  return Object.entries(all).filter(([id, names]) => id !== me && names.includes(name)).map(([id]) => sessionName(id, process.env.TOOLKIT_SESSIONS_DIR || undefined)).filter((n) => !n.endsWith('(not running)'));
}
/* Which worktrees a session made, so the gate can name them when the session comes back to the main checkout. */
export function remember(main, session, name) {
  if (!session) return;
  const file = path.join(git(main, 'rev-parse', '--path-format=absolute', '--git-common-dir'), 'worktree-sessions.json');
  let all = {}; try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* first */ }
  all[session] = [...new Set([...(all[session] || []), name])];
  const tmp = `${file}.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(all)); fs.renameSync(tmp, file);
}

/* A clean, detached worktree of one commit, for a check that must read exactly that commit. */
export function temp(anyDir, rev) {
  const main = mainOf(anyDir);
  // under the checkout's own .claude/worktrees, where a full check was proved to run every step (2026-11-20)
  const dir = path.join(main, '.claude', 'worktrees', `.at-${String(rev).slice(0, 8)}-${process.pid}-${Date.now()}`);
  git(main, 'worktree', 'add', '-q', '--detach', dir, rev);
  link(main, dir);
  return { dir, remove: () => { try { git(main, 'worktree', 'remove', '--force', dir); } catch { fs.rmSync(dir, { recursive: true, force: true }); try { git(main, 'worktree', 'prune'); } catch { /* next prune */ } } } };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const work = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!work) { console.error('usage: worktree.mjs <work> [--join]   (a short name for the work, e.g. check-cache; --join shares a worktree a running session holds)'); process.exit(2); }
  try {
    const from = process.cwd().startsWith(TOOLKIT) ? process.cwd() : TOOLKIT, main = mainOf(from), me = process.env.CLAUDE_CODE_SESSION_ID;
    const others = await claimedBy(main, slug(work), me);
    if (others.length && !process.argv.includes('--join')) { console.error(`${slug(work)} is in use by ${others.join(', ')}: pick another name for this work, or ask that session (--join shares the folder anyway)`); process.exit(1); }
    const dir = ensure(from, work); remember(main, me, slug(work)); console.log(dir);
  } catch (e) { console.error(String(e.stderr || e.message).trim()); process.exit(1); }
}
