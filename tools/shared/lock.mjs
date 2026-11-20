#!/usr/bin/env node
/*
 * The one measuring lock: a long run (bin/check, eval.mjs --self/--second/--draw, from-code) holds it, niced, so two
 * never share the machine. bin/check took 10+ minutes beside a parallel measure, and 8 beside a second bin/check
 * (2026-11-20). A waiter says who holds it, and keeps waiting.
 *
 *   node tools/shared/lock.mjs --run <what> -- <command…>   wait for the lock, run the command niced, release
 *   node tools/shared/lock.mjs --who                        who holds it, or "free"
 *
 * A kernel file lock (flock, through python3, which bin/check already needs), held by a small child process for as
 * long as the holder lives: the system releases it when the holder exits or dies, so there is no stale lock and no
 * takeover to race (a folder lock with a pid check had three, found by review on 2026-11-20). holder.json beside it
 * only says who holds it; whether anyone does is asked of the lock itself. A child of a holder (TOOLKIT_LOCK_HELD in
 * its environment) never waits: bin/check's suites run from-code. The lock lives in the toolkit's common .git, one
 * path for a sandboxed session, a terminal and a linked worktree; TOOLKIT_LOCK_DIR moves it (the tests). Where it
 * cannot be taken (no python3, a folder it cannot write) the run goes ahead unlocked and says so.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// the common .git, so a run in a linked worktree (.claude/worktrees/agent-*) shares the main checkout's lock
const common = () => { try { return path.resolve(TOOLKIT, execFileSync('git', ['-C', TOOLKIT, 'rev-parse', '--git-common-dir'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch { return os.tmpdir(); } };
export const lockDir = () => process.env.TOOLKIT_LOCK_DIR || common();
const lockFile = () => path.join(lockDir(), 'toolkit-measure.flock');
const infoFile = () => path.join(lockDir(), 'toolkit-measure.holder.json');

// try: exit 0 when free (taken and let go at once), 1 when held, 2 when it cannot be opened
const TRY = 'import fcntl,sys\ntry: f=open(sys.argv[1],"a")\nexcept Exception: sys.exit(2)\ntry: fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)\nexcept OSError: sys.exit(1)\n';
// hold: "busy" when it must wait, "held" once it holds, then keep it until stdin closes (the holder gone)
// the note (argv[2] into argv[3]) is written under the lock, before "held", so a waiter never reads the last holder's
const HOLD = 'import fcntl,sys\ntry: f=open(sys.argv[1],"a")\nexcept Exception:\n  print("nolock",flush=True); sys.exit(0)\ntry: fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)\nexcept OSError:\n  print("busy",flush=True); fcntl.flock(f,fcntl.LOCK_EX)\ntry: open(sys.argv[3],"w").write(sys.argv[2])\nexcept Exception: pass\nprint("held",flush=True)\nsys.stdin.read()\n';

/* The live session's name, from Claude Code's registry (~/.claude/sessions/<pid>.json), else its id. */
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
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

/* Who holds the lock: { pid, what, session, at }, or null when it is free (asked of the lock, not of the note). */
export function holder() {
  const r = spawnSync('python3', ['-c', TRY, lockFile()], { stdio: 'ignore' });
  if (r.status !== 1) return null;
  try { return JSON.parse(fs.readFileSync(infoFile(), 'utf8')); } catch { return { pid: 0, what: 'a run', at: Date.now() }; }
}
export const describe = (h) => `${h.what} (pid ${h.pid}${h.session ? `, ${sessionName(h.session)}` : ''}, since ${new Date(h.at).toTimeString().slice(0, 5)})`;

let child = null;
/* Wait for the lock (saying who holds it, then each minute), lower this process's priority, and hold it until release()
   or this process ends. Resolves false when it could not be taken at all: the run goes ahead unlocked, said. */
export function hold(what, { say = (l) => console.error(l) } = {}) {
  if (process.env.TOOLKIT_LOCK_HELD) return Promise.resolve(true);
  try { fs.mkdirSync(lockDir(), { recursive: true }); } catch { /* the open says it */ }
  return new Promise((resolve) => {
    let timer = null, buf = '', done = false;
    const finish = (ok, why) => { if (done) return; done = true; clearInterval(timer); if (!ok) { say(`measuring lock: ${why}; running without it`); child = null; } resolve(ok); };
    const note = JSON.stringify({ pid: process.pid, what, session: process.env.CLAUDE_CODE_SESSION_ID || '', at: Date.now() });
    child = spawn('python3', ['-c', HOLD, lockFile(), note, infoFile()], { stdio: ['pipe', 'pipe', 'ignore'] });
    child.on('error', (e) => finish(false, `python3 could not run (${e.code || e.message})`));
    child.on('close', () => finish(false, 'the lock holder stopped before taking it')); // after its output is read
    child.stdout.on('data', (d) => {
      buf += d;
      for (let i; (i = buf.indexOf('\n')) >= 0;) {
        const l = buf.slice(0, i); buf = buf.slice(i + 1);
        if (l === 'busy') {
          const tell = () => { const h = holder(); if (h) say(`measuring lock: waiting for ${describe(h)}`); };
          tell(); timer = setInterval(tell, 60000);
        } else if (l === 'nolock') finish(false, `cannot open ${lockFile()}`);
        else if (l === 'held') {
          process.env.TOOLKIT_LOCK_HELD = String(process.pid);
          try { os.setPriority(10); } catch { /* not allowed: run at the priority given */ }
          // the child must not keep this process alive: when this process ends, its pipe closes and the lock goes
          child.removeAllListeners('close'); child.unref(); child.stdin.unref?.(); child.stdout.destroy();
          finish(true);
        }
      }
    });
  });
}
export function release() {
  if (child) { try { child.kill(); } catch { /* already gone */ } child = null; }
  delete process.env.TOOLKIT_LOCK_HELD;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const argv = process.argv.slice(2);
  if (argv[0] === '--who') { const h = holder(); console.log(h ? `held by ${describe(h)}` : 'free'); process.exit(0); }
  const dash = argv.indexOf('--');
  if (argv[0] !== '--run' || dash < 2 || dash === argv.length - 1) { console.error('usage: lock.mjs --run <what> -- <command…> | --who'); process.exit(2); }
  // waits without bound: a waiter that gave up would turn a busy machine into a red check
  await hold(argv[1]);
  // the child inherits the priority hold() lowered, and TOOLKIT_LOCK_HELD
  const r = spawnSync(argv[dash + 1], argv.slice(dash + 2), { stdio: 'inherit', env: process.env });
  release();
  process.exit(r.status ?? 1);
}
