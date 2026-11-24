/*
 * chromes.mjs — the headless Chromes the toolkit started (cdp.mjs launch()), found and reaped.
 * Lives beside cdp.mjs so a skill taken alone with bin/get carries it without the check's folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const real = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
/* The toolkit's headless Chromes: every process whose --user-data-dir is <tmpdir>/parity-chrome-* (cdp.mjs launch()),
   one entry per profile with its helpers and their children. Never another Chrome: the user's has no such profile, and
   another tool's is named otherwise. Crashpad handlers share the user's database and exit with their client: left. */
const HOUR = 36e5, DAY_OLD = 24 * HOUR;
/* ps's lstart ("Tue Nov 24 10:00:13 2026", local time): a start that stays put, where etime moves every second */
const psList = () => { try { return execFileSync('ps', ['-A', '-o', 'pid=,ppid=,lstart=,command='], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000, env: { ...process.env, LC_ALL: 'C' } }); } catch { return ''; } };
const temps = () => [...new Set([os.tmpdir(), real(os.tmpdir())].map((d) => d.replace(/\/+$/, '')))];
/* A Chrome or Chromium binary, its helpers included (macOS "Google Chrome Helper (Renderer)", Linux chrome --type=…):
   the executable's name, the command up to its first flag. Anything else carrying the profile string is never ours. */
const isChrome = (cmd) => /^(google[ -]chrome|chromium|chrome)([ -].*)?$/i.test(path.basename(cmd.split(' --')[0].trim()));
const parsePs = (ps, now) => ps.split('\n').map((l) => /^\s*(\d+)\s+(\d+)\s+(\w{3} \w{3}\s+\d+ [\d:]{8} \d{4})\s+(.*)$/.exec(l)).filter(Boolean)
  .map(([, pid, ppid, t, cmd]) => ({ pid: +pid, ppid: +ppid, start: new Date(t.replace(/\s+/g, ' ')).getTime() || now, cmd }));
export function toolkitChromes(ps = psList(), tmp = temps(), now = Date.now()) {
  const procs = parsePs(ps, now);
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  const groups = new Map();
  for (const p of procs) {
    if (!isChrome(p.cmd)) continue;
    const dir = (/--user-data-dir=(\S+)/.exec(p.cmd) || [])[1];
    if (!dir || !path.basename(dir).startsWith('parity-chrome-') || !tmp.includes(path.dirname(dir))) continue;
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(p);
  }
  return [...groups].map(([dir, own]) => {
    const pids = new Set(own.map((p) => p.pid));
    for (let grew = true; grew;) { grew = false; for (const p of procs) if (!pids.has(p.pid) && pids.has(p.ppid) && isChrome(p.cmd)) { pids.add(p.pid); grew = true; } }
    // the browsers are those without --type=; with none left, the helpers speak for them. Only every one of them
    // parentless makes it a leftover: a living parent, whatever runs it, is a run someone may still want
    const browsers = own.filter((p) => !/--type=/.test(p.cmd));
    const judged = browsers.length ? browsers : own;
    const parentOf = (p) => (p.ppid > 1 ? byPid.get(p.ppid) : null);
    const main = judged.find(parentOf) || judged.reduce((a, b) => (b.start < a.start ? b : a));
    const parent = parentOf(main);
    return { dir, main: main.pid, pids: [...pids], cmds: Object.fromEntries([...pids].map((pid) => [pid, byPid.get(pid).cmd])),
      start: main.start, age: now - main.start, ppid: main.ppid, parentStart: parent ? parent.start : null, stale: !judged.some(parentOf) };
  });
}

/* Kill each parentless one (SIGKILL, the browser first, then its helpers) and remove its profile; returns what went and
   what stays. Its process group is never signalled: launch() leaves Chrome in its caller's group, a live shell's. */
export function reapChromes({ ps = psList(), tmp = temps(), now = Date.now(), kill = (pid) => process.kill(pid, 'SIGKILL'), again = psList } = {}) {
  const all = toolkitChromes(ps, tmp, now);
  const reaped = [];
  const stale = all.filter((x) => x.stale);
  // looked at again just before the kill: a pid whose command changed since the snapshot was reused, and is left
  const fresh = stale.length ? new Map(parsePs(again(), now).map((p) => [p.pid, p.cmd])) : new Map();
  for (const c of stale) {
    for (const pid of [c.main, ...c.pids.filter((p) => p !== c.main)]) if (fresh.get(pid) === c.cmds[pid]) try { kill(pid); } catch { /* already gone */ }
    try { fs.rmSync(c.dir, { recursive: true, force: true, maxRetries: 3 }); } catch { /* a helper still writing: the OS clears tmp */ }
    reaped.push(`pid ${c.main} (${Math.floor(c.age / HOUR)}h, orphaned) ${path.basename(c.dir)}`);
  }
  return { reaped, left: all.filter((x) => !x.stale) };
}

/* The Stop hook's open items: a toolkit Chrome a living parent has held over a day. The line is its key
   (stop-items.mjs), so it holds the parent's pid and start, never the hours or its command text (a title can change),
   and asks rather than kills. */
const stamp = (ms) => { const d = new Date(ms), z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; };
export const chromeItems = (left) => left.filter((c) => c.age > DAY_OLD).map((c) => `a toolkit Chrome under pid ${c.ppid} (started ${stamp(c.parentStart)}) has run since ${stamp(c.start)}; check whether that run is still wanted`);
