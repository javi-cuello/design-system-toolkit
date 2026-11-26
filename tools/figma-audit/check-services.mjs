#!/usr/bin/env node
/*
 * Does each running dashboard serve the records the projects actually have?
 *
 *   node tools/figma-audit/check-services.mjs           judge (bin/check)
 *   node tools/figma-audit/check-services.mjs --heal    restart stale idle services first, then judge (bin/land)
 *
 * A launch agent holds its arguments until it is reloaded from disk, and
 * `launchctl kickstart` restarts it with the definition launchd already has —
 * so a change to its arguments can sit in the repo and in the plist while every
 * running service keeps the old one. That is not a hypothetical: when the
 * audit records became one per library, all four agents went on serving
 * `audit/audit.json`, the file was simply absent, and the page rendered a
 * project with two audited libraries as never audited, with a green "Figma
 * connected" beside it. Nothing could see it, because an absent record and an
 * unaudited library are the same answer from the page's side.
 *
 * This compares what is RUNNING against what the contract says each project's
 * records are. Services are optional: none running is not a failure. One
 * running against a path no project claims is.
 */
import { statusOf, running, call } from './services.mjs';
import { existsSync, statSync, realpathSync } from 'node:fs';
import { basename, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOLKIT = join(HERE, '..', '..');
const contract = createRequire(import.meta.url)('../snapshot/projects.cjs');


/*
 * IS THE RUNNING SERVICE THE FILE ON DISK? server.mjs is read once, at start,
 * and these services run for days; the scanners and the row writer are
 * re-read per request, this file is not. A service eight commits behind its
 * source passed this check for a whole afternoon — every fix of the day was
 * on disk and not in the process, and nothing said so until a review
 * compared the process's start time with the file's. That is the comparison.
 */
// What is running against what the projects claim: `found` is running()'s list,
// `wanted` each project's audit folder → its label, `newest` the most recently
// changed file server.mjs binds at start ({ f, mtime }). Exported for its test,
// which feeds it a list in place of the process table.
export function judge(found, wanted, newest) {
  const serverChanged = newest ? newest.mtime : null;
  // One line per service: the supervisor and each child both carry a pair.
  found = [...new Map(found.map((r) => [r.data + '|' + r.port, r])).values()];
  const bad = [], stale = [];
  const seen = new Set();
  for (const r of found) {
    const label = wanted.get(r.data);
    if (label && serverChanged && r.started instanceof Date && !isNaN(r.started) && serverChanged > r.started) {
      const msg = `${label} (port ${r.port || '?'}) started ${r.started.toISOString().slice(0, 16).replace('T', ' ')}, and ${basename(newest.f)} changed ${serverChanged.toISOString().slice(0, 16).replace('T', ' ')} — the process runs the old file; kickstart the agent`;
      bad.push(msg); stale.push({ r, label, msg });
      continue;
    }
    if (label) { seen.add(label); continue; }
    // A path inside a project's audit folder but not the folder itself: the old
    // one-record-per-project argument, or a record named for a library, which a
    // service must not be pinned to — the page chooses the library, not the flag.
    const inside = [...wanted.entries()].find(([dir]) => r.data.startsWith(dir + '/'));
    bad.push(inside
      ? `${inside[1]} (port ${r.port || '?'}) serves ${r.data} — point --data at ${inside[0]}, the folder`
      : `port ${r.port || '?'} serves ${r.data}, which no project claims`);
  }
  return { bad, seen, found, stale };
}

/*
 * With --heal (bin/land, before queuing), a stale service is asked to restart before it is judged (its route /restart-when-idle: stale-self's now()), and
 * waited for: a dashboard restarts itself once idle, but looks only once a minute and waits out a docs build (about a
 * minute), and stale dashboards failed a land that had nothing to do with them (2026-11-24). What stays a failure is
 * returned in `left`, each with why: nothing supervising it, a service too old to be asked, or not back on the new
 * files within `timeout`. One with a plugin connected is returned apart, in `held`: it keeps the old code by design
 * until the plugin closes and then restarts itself, so it is a warning, not a failure (2026-11-26: four services
 * holding plugins failed every land that day, two of them nothing to do with the services). `ask`, `list` and the
 * times are its test's to replace.
 */
export async function heal(stale, { ask = (r) => Promise.race([call(r, '/restart-when-idle', {}), new Promise((_, no) => setTimeout(() => no(new Error('no answer in 5 s')), 5000).unref())]), list = () => running().filter((r) => !r.test), newest, timeout = 120000, poll = 1000 } = {}) {
  const left = [], waiting = [], held = [];
  for (const s of stale) {
    if (!s.r.port) { left.push(s.msg); continue; }
    let a;
    try { a = await ask(s.r); } catch (e) { left.push(`${s.msg} (it could not be asked to restart: ${e.message})`); continue; }
    if (a && a.stale === false) continue; // restarted since the process list was read
    if (!a || !a.supervised) left.push(`${s.msg} (nothing supervises it to bring it back)`);
    else if (a.plugin === true) held.push(s);
    else waiting.push(s);
  }
  const back = (s, now) => now.some((x) => x.data === s.r.data && x.port === s.r.port && x.started instanceof Date && x.started > newest.mtime);
  const end = Date.now() + timeout;
  let wait = waiting;
  while (wait.length) {
    const now = list();
    wait = wait.filter((s) => !back(s, now));
    if (!wait.length || Date.now() >= end) break;
    await new Promise((r) => setTimeout(r, poll));
  }
  for (const s of wait) left.push(`${s.msg} (asked to restart, and not back on the new files within ${Math.round(timeout / 1000)} s: a build or a call still in progress)`);
  return { left, held };
}

/* bin/check's judge, which restarts nothing: the stale services a plugin holds and a supervisor will bring back, asked
   of each one's /status. One that cannot answer, or that nothing supervises, is not held, and stays a failure. `status`
   is its test's to replace. */
export async function pluginHeld(stale, { status = (r) => Promise.race([statusOf(r), new Promise((_, no) => setTimeout(() => no(new Error('no answer in 5 s')), 5000).unref())]) } = {}) {
  const held = [];
  for (const s of stale) {
    if (!s.r.port) continue;
    try { const st = await status(s.r); if (st.plugin === true && st.supervised === true) held.push(s); } catch { /* unanswered: a failure, as judged */ }
  }
  return held;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  // Not server.mjs alone: every module it binds once, at start, is as stale as
  // it is — the files its imports reach, walked rather than listed, from the
  // entries bound.mjs names (what it loads by a built path binds its own imports).
  // A dashboard restarts itself on the same files once idle; this names one
  // that has not yet (busy, or started by hand).
  // The services run from the main checkout (the launch agents name its path). From a linked worktree,
  // this folder's files were all stamped at checkout, later than every service's start, and every
  // service read as stale (bin/review's worktree, 2026-11-11): read the main checkout's files instead.
  let SERVED = HERE;
  try {
    const common = execFileSync('git', ['-C', HERE, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const main = join(dirname(common), 'tools', 'figma-audit');
    if (basename(common) === '.git' && existsSync(join(main, 'server.mjs'))) SERVED = main;
  } catch {}
  // the same files the dashboards restart on (bound.mjs): what server.mjs loads by a built path is bound too
  const { importClosure } = await import('../shared/import-closure.mjs');
  const { boundBy } = await import('./bound.mjs');
  const BOUND = importClosure(boundBy(SERVED));
  const newest = BOUND.map((f) => ({ f, mtime: statSync(f).mtime })).sort((a, b) => b.mtime - a.mtime)[0];

  const wanted = new Map();
  for (const { name: label } of contract.homes()) {
    const where = contract.layout(null, label);
    if (!where || where.error || !where.audit) continue;
    wanted.set(resolve(where.audit), label);
  }

  // a test's server (its --data in the temp folder) is not a dashboard, whichever session ran it
  const judged = judge(running().filter((r) => !r.test), wanted, newest);
  const { seen, found } = judged;
  let bad = judged.bad;
  // --heal (bin/land, before queuing, outside the lock) restarts what it can first; bin/check only judges
  let held = [];
  if (judged.stale.length && process.argv.includes('--heal')) {
    const r = await heal(judged.stale, { newest });
    held = r.held;
    const healed = judged.stale.filter((s) => !r.left.some((l) => l.startsWith(s.msg)) && !held.includes(s));
    bad = bad.filter((b) => !judged.stale.some((s) => s.msg === b)).concat(r.left);
    for (const s of healed) seen.add(s.label);
    if (healed.length) console.log(`dashboards: ${healed.length} stale service(s) restarted, idle, on the files on disk: ${healed.map((s) => s.label).join(', ')}`);
  } else if (judged.stale.length) {
    held = await pluginHeld(judged.stale);
    bad = bad.filter((b) => !held.some((s) => s.msg === b));
  }
  // a plugin open keeps a service on the old code until it closes, by design: said, never failed
  for (const s of held) { seen.add(s.label); console.log(`dashboards: warning: ${s.msg.replace(/; kickstart the agent$/, '')}, while a plugin is connected; it restarts itself once the plugin closes`); }
  if (bad.length) {
    console.log(`dashboards: ${bad.length} service(s) serving something the projects do not have`);
    for (const b of bad) console.log('  ' + b);
    console.log('  A stale process: `launchctl kickstart -k gui/$UID/com.toolkit`. A wrong --data: reload the agent from disk — `launchctl bootout` then `bootstrap`; `kickstart` restarts the definition launchd already holds.');
    process.exit(1);
  }
  console.log(found.length
    ? `dashboards: ${seen.size} project(s) served, every --data is that project's audit folder`
    : 'dashboards: none running (not a failure — the service is optional)');
}
