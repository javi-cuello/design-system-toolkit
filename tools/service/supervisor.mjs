#!/usr/bin/env node
/*
 * The toolkit's one login item (launch agent com.toolkit, written by install.sh): the snapshot router and the
 * figma-audit service as children, each started again when it exits, and with --review bin/review --if-owed daily
 * at 03:00. A child restarts itself onto changed files by exiting (stale-self.mjs: forked, it is supervised over
 * its IPC channel); this file does the same for itself, launchd starting it again.
 *
 *   node tools/service/supervisor.mjs [--review]
 */
import { fork, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { restartWhenStale, askIdle } from '../shared/stale-self.mjs';

// the next `hour`:00 after `d`, local time; a Mac asleep then runs it on waking, as launchd's calendar interval did
export function nextAt(d, hour) {
  const t = today(d, hour);
  if (t <= d) t.setDate(t.getDate() + 1);
  return t;
}
const today = (d, hour) => { const t = new Date(d); t.setHours(hour, 0, 0, 0); return t; };

// `children`: [{ name, script, args }], forked with an IPC channel; output to `logs`/<name>.log and .err.
// A child that dies again within `steady` of its start waits twice as long as last time, up to `most`.
export function supervise({ children, logs, review = null, hour = 3, every = 60000, wait = 1000, most = 60000,
  steady = 60000, now = () => new Date(), log = console.log }) {
  fs.mkdirSync(logs, { recursive: true });
  const kids = new Set();
  let stopping = false, reviewing = null;
  const out = (name) => { const a = fs.openSync(path.join(logs, `${name}.log`), 'a'); try { return [a, fs.openSync(path.join(logs, `${name}.err`), 'a')]; } catch (e) { fs.closeSync(a); throw e; } };
  const start = (c, delay) => {
    const fds = out(c.name);
    const child = fork(c.script, c.args || [], { stdio: ['ignore', ...fds, 'ipc'] });
    for (const fd of fds) fs.closeSync(fd);
    kids.add(child);
    // a fork that cannot start, or a send to a closed channel, is an 'error' event: unheard it ends the supervisor
    child.on('error', (e) => log(`${c.name}: ${e.message}`));
    const began = Date.now();
    child.on('exit', (code, signal) => {
      kids.delete(child);
      if (stopping) return;
      const d = Date.now() - began >= steady ? wait : delay;
      log(`${c.name} exited (${signal || code}); starting it again in ${d / 1000} s`);
      setTimeout(() => { if (!stopping) start(c, Math.min(d * 2, most)); }, d);
    });
  };
  for (const c of children) start(c, wait);

  // today's, if already past, so a supervisor started after 03:00 still runs that day's review; once a day only, by
  // a dated marker: a held review stays owed, and each restart would start another paid run
  let due = today(now(), hour);
  const tried = path.join(logs, 'review.tried');
  const day = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const timer = review && setInterval(() => {
    if (now() < due || reviewing) return;
    due = nextAt(now(), hour);
    let last = null; try { last = fs.readFileSync(tried, 'utf8'); } catch {}
    if (last === day(now())) return;
    // unwritable (disk full, a folder in the way) or unstartable: this run's review is skipped until the next 03:00
    // (a restart may try once more that day, the marker unwritten); a throw here would take both children down and
    // crash-loop under KeepAlive
    let fds = [];
    try { fs.writeFileSync(tried, day(now())); fds = out('review'); reviewing = spawn(review[0], review.slice(1), { stdio: ['ignore', ...fds] }); }
    catch (e) { log(`review: skipped today, ${e.message}`); reviewing = null; return; }
    finally { for (const fd of fds) fs.closeSync(fd); }
    log('review: started');
    reviewing.on('error', (e) => { log(`review: ${e.message}`); reviewing = null; });
    reviewing.on('exit', (code, signal) => { log(`review: exited (${signal || code})`); reviewing = null; });
  }, every);

  const busyKids = askIdle(kids);
  return {
    kids,
    busy: () => !!reviewing || busyKids(),
    stop() { stopping = true; clearInterval(timer); for (const c of kids) c.kill(); if (reviewing) reviewing.kill(); },
  };
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (process.argv[1] && (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url)) {
  const TOOLKIT = path.join(HERE, '..', '..');
  const service = supervise({
    logs: path.join(os.homedir(), 'Library', 'Logs', 'toolkit'),
    children: [
      { name: 'figma-snapshot', script: path.join(TOOLKIT, 'tools', 'snapshot', 'router.mjs') },
      { name: 'figma-audit', script: path.join(TOOLKIT, 'tools', 'figma-audit', 'server.mjs'), args: ['--all'] },
    ],
    review: process.argv.includes('--review') ? [path.join(TOOLKIT, 'bin', 'review'), '--if-owed'] : null,
  });
  const end = (code) => { service.stop(); process.exit(code); };
  for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => end(0));
  restartWhenStale([fileURLToPath(import.meta.url)], { busy: service.busy, label: 'com.toolkit', exit: end });
}
