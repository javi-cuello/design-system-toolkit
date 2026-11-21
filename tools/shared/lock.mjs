#!/usr/bin/env node
/*
 * The measuring lock, a few slots wide (slots()): a long run (bin/check, eval.mjs --self/--second/--draw, from-code) holds it, niced, so two
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
/* A few slots, not one: a long run takes any free slot, so parallel sessions and agents measure side by side without
   overloading the machine, and none has reason to move the lock aside (agents given their own TOOLKIT_LOCK_DIR ran
   five measures at once and doubled the load, 2026-11-21). One slot per four cores (a measure runs about four jobs);
   TOOLKIT_LOCK_SLOTS sets it (the tests: 1). Slot 0 keeps the old file names. */
/* bin/check and bin/land take slot 0 alone (`first`): land rebases and pushes in one shared worktree, and a queued
   check takes the answer of the same tree's run before it, so both need their kind one at a time; measures take any slot. */
export const slots = () => Math.max(1, +process.env.TOOLKIT_LOCK_SLOTS || Math.floor(os.cpus().length / 4));
const lockFile = (i = 0) => path.join(lockDir(), `toolkit-measure${i ? `.${i}` : ''}.flock`);
const infoFile = (i = 0) => path.join(lockDir(), `toolkit-measure${i ? `.${i}` : ''}.holder.json`);

// try: exit 0 when free (taken and let go at once), 1 when held, 2 when it cannot be opened
const TRY = 'import fcntl,sys\ntry: f=open(sys.argv[1],"a")\nexcept Exception: sys.exit(2)\ntry: fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)\nexcept OSError: sys.exit(1)\n';
// hold: "busy" when it must wait, "held" once it holds, then keep it until stdin closes (the holder gone)
// the note (argv[2] into argv[3]) is written under the lock, before "held", so a waiter never reads the last holder's
// argv: the note, then lock file and note file per slot; the first slot free is taken, else every slot is tried again each second
const HOLD = 'import fcntl,sys,time\nn=sys.argv[1]; p=sys.argv[2:]; fs=[]\nfor i in range(0,len(p),2):\n  try: fs.append((open(p[i],"a"),p[i+1]))\n  except Exception: pass\nif not fs:\n  print("nolock",flush=True); sys.exit(0)\nsaid=False\nwhile True:\n  for f,w in fs:\n    try: fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)\n    except OSError: continue\n    try: open(w,"w").write(n)\n    except Exception: pass\n    print("held",flush=True); sys.stdin.read(); sys.exit(0)\n  if not said: print("busy",flush=True); said=True\n  time.sleep(1)\n';

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

/* Who a new run would wait for: the earliest holder { pid, what, session, at } when every slot is held, or null when one
   is free (asked of the locks, not of the notes). */
export function holder({ first = false } = {}) {
  const held = [];
  for (let i = 0; i < (first ? 1 : slots()); i++) {
    if (spawnSync('python3', ['-c', TRY, lockFile(i)], { stdio: 'ignore' }).status !== 1) return null;
    try { held.push(JSON.parse(fs.readFileSync(infoFile(i), 'utf8'))); } catch { held.push({ pid: 0, what: 'a run', at: Date.now() }); }
  }
  return held.sort((a, b) => a.at - b.at)[0] || null;
}
export const describe = (h) => `${h.what} (pid ${h.pid}${h.session ? `, ${sessionName(h.session)}` : ''}, since ${new Date(h.at).toTimeString().slice(0, 5)})`;

let child = null;
/* Wait for the lock (saying who holds it, then each minute), lower this process's priority, and hold it until release()
   or this process ends. Resolves false when it could not be taken at all: the run goes ahead unlocked, said. */
export function hold(what, { say = (l) => console.error(l), first = false } = {}) {
  if (process.env.TOOLKIT_LOCK_HELD) return Promise.resolve(true);
  try { fs.mkdirSync(lockDir(), { recursive: true }); } catch { /* the open says it */ }
  return new Promise((resolve) => {
    let timer = null, buf = '', done = false;
    const finish = (ok, why) => { if (done) return; done = true; clearInterval(timer); if (!ok) { say(`measuring lock: ${why}; running without it`); child = null; } resolve(ok); };
    const note = JSON.stringify({ pid: process.pid, what, session: process.env.CLAUDE_CODE_SESSION_ID || '', at: Date.now() });
    child = spawn('python3', ['-c', HOLD, note, ...Array.from({ length: first ? 1 : slots() }, (_, i) => [lockFile(i), infoFile(i)]).flat()], { stdio: ['pipe', 'pipe', 'ignore'] });
    child.on('error', (e) => finish(false, `python3 could not run (${e.code || e.message})`));
    child.on('close', () => finish(false, 'the lock holder stopped before taking it')); // after its output is read
    child.stdout.on('data', (d) => {
      buf += d;
      for (let i; (i = buf.indexOf('\n')) >= 0;) {
        const l = buf.slice(0, i); buf = buf.slice(i + 1);
        if (l === 'busy') {
          const tell = () => { const h = holder({ first }); if (h) say(`measuring lock: waiting for ${describe(h)}`); };
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
  if (argv[0] === '--who') { const h = holder(); const c = holder({ first: true }); console.log(h ? `every slot held; next free after ${describe(h)}` : c ? `a slot free; checks and lands wait for ${describe(c)}` : 'free'); process.exit(0); }
  const dash = argv.indexOf('--');
  if (argv[0] !== '--run' || dash < 2 || dash === argv.length - 1) { console.error('usage: lock.mjs --run <what> -- <command…> | --who'); process.exit(2); }
  // waits without bound: a waiter that gave up would turn a busy machine into a red check
  await hold(argv[1]);
  // the child inherits the priority hold() lowered, and TOOLKIT_LOCK_HELD
  const r = spawnSync(argv[dash + 1], argv.slice(dash + 2), { stdio: 'inherit', env: process.env });
  release();
  process.exit(r.status ?? 1);
}
