#!/usr/bin/env node
/*
 * Does each running dashboard serve the records the projects actually have?
 *
 *   node tools/figma-audit/check-services.mjs
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
import { running } from './services.mjs';
import { existsSync, statSync, realpathSync } from 'node:fs';
import { basename, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

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
  const bad = [];
  const seen = new Set();
  for (const r of found) {
    const label = wanted.get(r.data);
    if (label && serverChanged && r.started instanceof Date && !isNaN(r.started) && serverChanged > r.started) {
      bad.push(`${label} (port ${r.port || '?'}) started ${r.started.toISOString().slice(0, 16).replace('T', ' ')}, and ${basename(newest.f)} changed ${serverChanged.toISOString().slice(0, 16).replace('T', ' ')} — the process runs the old file; kickstart the agent`);
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
  return { bad, seen, found };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  // Not server.mjs alone: every module it binds once, at start, is as stale as
  // it is — the files its static imports reach, walked rather than listed, so a
  // new dependency is covered without anyone remembering to add it. What it
  // loads per request (rows.mjs, the scanners) arrives by dynamic import and is
  // rightly not here.
  const { closure } = await import('../snapshot/unpack.mjs');
  const BOUND = closure(join(HERE, 'server.mjs'));
  const newest = BOUND.map((f) => ({ f, mtime: statSync(f).mtime })).sort((a, b) => b.mtime - a.mtime)[0];

  const wanted = new Map();
  for (const { name: label } of contract.homes()) {
    const where = contract.layout(null, label);
    if (!where || where.error || !where.audit) continue;
    wanted.set(resolve(where.audit), label);
  }

  // a test's server (its --data in the temp folder) is not a dashboard, whichever session ran it
  const { bad, seen, found } = judge(running().filter((r) => !r.test), wanted, newest);
  if (bad.length) {
    console.log(`dashboards: ${bad.length} service(s) serving something the projects do not have`);
    for (const b of bad) console.log('  ' + b);
    console.log('  A stale process: `launchctl kickstart -k gui/$UID/com.toolkit.figma-audit`. A wrong --data: reload the agent from disk — `launchctl bootout` then `bootstrap`; `kickstart` restarts the definition launchd already holds.');
    process.exit(1);
  }
  console.log(found.length
    ? `dashboards: ${seen.size} project(s) served, every --data is that project's audit folder`
    : 'dashboards: none running (not a failure — the service is optional)');
}
