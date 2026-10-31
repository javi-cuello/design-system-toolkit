/*
 * tools/docs-site/lock.mjs — the engine's build lock (build.mjs): a folder,
 * made or not in one step, holding its holder's token (pid, its start time and a random part).
 * The holder touches it every `beatMs` for as long as it builds, so a build of
 * any length keeps it; one nobody has touched for `staleMs`, whose holder is
 * no longer running (or whose pid now names a process started at another
 * time: reused), was left by a build that died, and is taken. A holder
 * touches and removes only a lock that still holds its own token: a build that
 * stalled past the limit (a sleeping machine) never removes its successor's.
 * Tested by test-build-lock.mjs.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// when process `pid` started (ms), by ps; null when ps cannot say
const started = (pid) => { try { const t = Date.parse(execFileSync('ps', ['-o', 'lstart=', '-p', String(pid)], { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' } }).trim()); return Number.isNaN(t) ? null : t; } catch { return null; } };
// the holder runs: its pid does, and (when its token says) started when the holder did, so a
// pid reused after the holder died, in this boot or another, is not it. A minute either way: ps
// counts whole seconds, and Linux's start time moves with a clock step.
const running = (pid, born) => {
  try { process.kill(pid, 0); } catch (e) { if (e.code !== 'EPERM') return false; }
  if (!born) return true;
  const t = started(pid);
  return t === null || Math.abs(t - born) < 60000;
};
// where ps cannot say (none installed, an old lock's token), a lock untouched this long is dead anyway
const DEAD = 6 * 3600000;
const holderOf = (dir) => { try { return readFileSync(join(dir, 'holder'), 'utf8'); } catch { return ''; } };
const make = (dir) => { mkdirSync(dir); const token = `${process.pid}:${Math.round(Date.now() - process.uptime() * 1000)}:${randomBytes(6).toString('hex')}`; writeFileSync(join(dir, 'holder'), token); return token; };

// the lock's token when taken, else false
export function take(dir, staleMs = 120000, alive = running) {
  try { return make(dir); } catch {
    // a stale lock is taken over through a claim named for that lock's last touch: of two
    // waiters that both find it stale, one makes the claim and the other is refused
    let claim = null;
    try {
      const at = statSync(dir).mtimeMs;
      if (Date.now() - at <= staleMs) return false;
      // stalled, not dead: still its build (a lock from before this change has no start time
      // and is read by its pid alone)
      const [pid, born, rand] = holderOf(dir).split(':');
      if (Number(pid) && alive(Number(pid), rand ? Number(born) : 0) && Date.now() - at < DEAD) return false;
      claim = `${dir}.${Math.round(at)}`;
      mkdirSync(claim);
    } catch { return false; }
    // the claim stays until this holder releases, so a waiter that read the same stale time late is refused too
    try { rmSync(dir, { recursive: true, force: true }); return make(dir); } catch { return false; }
  }
}

// keeps the lock fresh while the build runs; returns its release. Both act only while the lock is this holder's.
export function hold(dir, token, beatMs = 30000) {
  const mine = () => holderOf(dir) === token;
  const beat = setInterval(() => { try { if (mine()) { const now = new Date(); utimesSync(dir, now, now); } } catch {} }, beatMs);
  beat.unref();
  return () => {
    clearInterval(beat);
    if (!mine()) return;
    // the claims of past takeovers first, then the lock
    for (const f of readdirSync(dirname(dir))) if (f.startsWith(`${basename(dir)}.`)) rmSync(join(dirname(dir), f), { recursive: true, force: true });
    rmSync(dir, { recursive: true, force: true });
  };
}
