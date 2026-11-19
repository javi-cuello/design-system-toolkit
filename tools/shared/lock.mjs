#!/usr/bin/env node
/*
 * The one measuring lock: a long run (bin/check, eval.mjs --self/--second/--draw, from-code) holds it, niced, so two
 * never share the machine. bin/check took 10+ minutes beside a parallel measure, and 8 beside a second bin/check
 * (2026-11-20). A waiter says who holds it, and keeps waiting; a holder whose process has gone is taken over.
 *
 *   node tools/shared/lock.mjs --run <what> -- <command…>   wait for the lock, run the command niced, release
 *   node tools/shared/lock.mjs --who                        who holds it, or nothing
 *
 * A child of a holder (TOOLKIT_LOCK_HELD in its environment) never waits: bin/check's suites run from-code.
 * The lock is a folder (mkdir is atomic) in the toolkit's own .git folder, holding holder.json: one path for every
 * caller, where $TMPDIR differs between a sandboxed session and a terminal. TOOLKIT_LOCK_DIR moves it (the tests).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// the common .git, so a run in a linked worktree (.claude/worktrees/agent-*) shares the main checkout's lock
const common = () => { try { return path.resolve(TOOLKIT, execFileSync('git', ['-C', TOOLKIT, 'rev-parse', '--git-common-dir'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch { return os.tmpdir(); } };
export const lockDir = () => process.env.TOOLKIT_LOCK_DIR || path.join(common(), 'toolkit-measure.lock');
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
// when a process started, so a pid reused by another process is not taken for the holder
const started = (pid) => { try { return execFileSync('ps', ['-o', 'lstart=', '-p', String(pid)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

/* The live session's name, from Claude Code's registry (~/.claude/sessions/<pid>.json), else its id. */
export function sessionName(id, dir = path.join(os.homedir(), '.claude', 'sessions')) {
  if (!id) return '';
  try {
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      const s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (s.sessionId === id && alive(s.pid)) return `${s.name || 'unnamed'} (session ${id.slice(0, 8)})`;
    }
  } catch { /* no registry: the id alone */ }
  return `session ${id.slice(0, 8)} (not running)`;
}

/* Who holds the lock: { pid, what, session, at } — null when free or its holder has gone. */
export function holder(dir = lockDir()) {
  let h;
  try { h = JSON.parse(fs.readFileSync(path.join(dir, 'holder.json'), 'utf8')); } catch { return fs.existsSync(dir) ? { pid: 0, what: 'unknown', at: 0, starting: true } : null; }
  if (!alive(h.pid)) return null;
  const now = h.start ? started(h.pid) : '';
  return !h.start || !now || now === h.start ? h : null; // ps unreadable here: the pid alone decides
}
export const describe = (h) => `${h.what} (pid ${h.pid}${h.session ? `, ${sessionName(h.session)}` : ''}, since ${new Date(h.at).toTimeString().slice(0, 5)})`;

/* Take the lock for `what`, or return the holder. A folder left by a dead holder, or one half-made for over a
   minute, is taken over. */
export function tryAcquire(what, dir = lockDir(), pid = process.pid) {
  for (let i = 0; i < 2; i++) {
    try {
      fs.mkdirSync(dir);
      fs.writeFileSync(path.join(dir, 'holder.json'), JSON.stringify({ pid, start: started(pid), what, session: process.env.CLAUDE_CODE_SESSION_ID || '', at: Date.now() }));
      return null;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const h = holder(dir);
      const stale = !h || (h.starting && Date.now() - fs.statSync(dir).mtimeMs > 60000);
      if (!stale) return h;
      // moved aside by rename, which one waiter wins, and only if it still holds the holder judged gone: another waiter
      // that took it over in between is left alone
      let seen = '';
      try { seen = fs.readFileSync(path.join(dir, 'holder.json'), 'utf8'); } catch { /* half-made */ }
      const aside = `${dir}.gone-${process.pid}-${Date.now()}`;
      try { fs.renameSync(dir, aside); } catch { continue; }
      let moved = '';
      try { moved = fs.readFileSync(path.join(aside, 'holder.json'), 'utf8'); } catch { /* half-made */ }
      if (moved !== seen) { try { fs.renameSync(aside, dir); } catch { /* a third took it: theirs */ } continue; }
      fs.rmSync(aside, { recursive: true, force: true });
    }
  }
  return holder(dir) || { pid: 0, what: 'unknown', at: Date.now() };
}
export function release(dir = lockDir(), pid = process.pid) {
  try { if (JSON.parse(fs.readFileSync(path.join(dir, 'holder.json'), 'utf8')).pid === pid) fs.rmSync(dir, { recursive: true, force: true }); } catch { /* not ours */ }
}

/* In-process, for a node run: wait (saying who holds it each minute), lower this process's priority, release on exit. */
export function hold(what, { wait = Infinity, say = (l) => console.error(l) } = {}) {
  if (process.env.TOOLKIT_LOCK_HELD) return true;
  const until = Date.now() + wait;
  let told = 0;
  for (let h; (h = tryAcquire(what));) {
    if (Date.now() > until) { say(`measuring lock: still held by ${describe(h)}; gave up waiting`); return false; }
    if (Date.now() - told > 60000) { say(`measuring lock: waiting for ${describe(h)}`); told = Date.now(); }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
  }
  process.env.TOOLKIT_LOCK_HELD = String(process.pid);
  try { os.setPriority(10); } catch { /* not allowed: run at the priority given */ }
  process.on('exit', () => release());
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { release(); process.exit(128 + os.constants.signals[sig]); });
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const argv = process.argv.slice(2);
  if (argv[0] === '--who') { const h = holder(); console.log(h ? `held by ${describe(h)}` : 'free'); process.exit(0); }
  const dash = argv.indexOf('--');
  if (argv[0] !== '--run' || dash < 2 || dash === argv.length - 1) { console.error('usage: lock.mjs --run <what> -- <command…> | --who'); process.exit(2); }
  // waits without bound: a waiter that gave up would turn a busy machine into a red check
  hold(argv[1]);
  // the child inherits the priority hold() lowered
  const r = spawnSync(argv[dash + 1], argv.slice(dash + 2), { stdio: 'inherit', env: process.env });
  release();
  process.exit(r.status ?? 1);
}
