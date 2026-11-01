#!/usr/bin/env node
// sweep-diff.mjs - SKILL.md step 8, plain node: the re-run step 1 sweep diffed
// against the run's target list, so a missed subject or a stray write is named
// by a script, never found by eye (toolkit-standard §D 23).
//
//   node scripts/sweep-diff.mjs <enumerate.js result>.json --against <targets>.json
//        [--internal-prefix <prefix>] [--exclude <ids>.json] [--scope <page>]...
//
// <targets>  what the run wrote: an array of ids (or of objects with `id`), the
//            { "<id>": "<descriptionMarkdown>" } map step 8's --check reads, or
//            either wrapped as { "targets": … }. URL-form ids (`1-2`) read as `1:2`.
// --internal-prefix  naming.internalPrefix: an untargeted private component is
//            listed apart, since the compact pass may have been out of the run
// --exclude  ids the run left out on purpose (step 2b's slot fillers, a ruling),
//            in any form <targets> takes: never missed, out of scope if written
// --scope    a page the run covered, once per page; absent, every page. A
//            component on another page is never missed, out of scope if written
//
// Prints JSON; exits 1 when `missed`, `outOfScope` or `unknownScope` holds
// anything, 2 on an input it cannot read or a flag with no value:
//   missed       public components the sweep found and the run did not write
//   missedPrivate  private ones likewise
//   unsure       untargeted components on an `alone` page: step 2e skips them
//                unless something uses them, which the sweep cannot see
//   excluded     untargeted components --exclude names
//   outOfScope   targets the sweep does not list as a component (a variant, a
//                deleted node, another file's id), on a page outside --scope, or
//                named by --exclude, each with its reason
//   onAlonePages targets on an `alone` page: in scope only if something uses
//                them (verify.js's `shouldBeEmpty` says which)
//   unknownScope with --scope, the pages it names that the sweep never saw
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const URL_ID = /^(\d+)-(\d+)$/;

// Throws naming the entry a list cannot use; `label` is the file it came from.
export function idList(list, label = 'targets') {
  if (list && !Array.isArray(list) && typeof list === 'object' && Object.keys(list).length === 1 && 'targets' in list) list = list.targets;
  if (!list || typeof list !== 'object') throw new Error(label + ': not a list of ids or an { id: description } map');
  const raw = Array.isArray(list) ? list.map((t, i) => {
    const id = t && typeof t === 'object' ? t.id : t;
    if (typeof id !== 'string' || !id) throw new Error(label + ': entry ' + i + ' has no id');
    return id;
  }) : Object.keys(list);
  return raw.map((id) => id.replace(URL_ID, '$1:$2'));
}

export function against(sweep, targets, { internalPrefix = null, exclude = [], scope = null } = {}) {
  const want = new Set(idList(targets)), skip = new Set(idList(exclude, 'exclude'));
  const pages = scope && scope.length ? new Set(scope) : null;
  const swept = new Map();
  for (const p of sweep.pages || []) for (const it of p.items || []) swept.set(it.id, { ...it, page: p.page, alone: p.alone });
  const row = (c) => ({ id: c.id, name: c.name, page: c.page });
  const out = { swept: swept.size, targets: want.size, missed: [], missedPrivate: [], unsure: [], excluded: [], outOfScope: [], onAlonePages: [] };
  for (const c of swept.values()) {
    const inScope = !pages || pages.has(c.page);
    if (want.has(c.id)) {
      if (!inScope) out.outOfScope.push({ ...row(c), reason: 'on a page outside --scope' });
      else if (skip.has(c.id)) out.outOfScope.push({ ...row(c), reason: 'named by --exclude' });
      else if (c.alone) out.onAlonePages.push(row(c));
      continue;
    }
    if (!inScope) continue;
    if (skip.has(c.id)) out.excluded.push(row(c));
    else if (internalPrefix && c.name.startsWith(internalPrefix)) out.missedPrivate.push(row(c));
    else if (c.alone) out.unsure.push(row(c));
    else out.missed.push(row(c));
  }
  // a --scope page the sweep never saw is a typo or a renamed page: said, never silently an empty run
  if (pages) { const seen = new Set((sweep.pages || []).map((p) => p.page)); out.unknownScope = [...pages].filter((p) => !seen.has(p)); }
  for (const id of want) if (!swept.has(id)) out.outOfScope.push({ id, reason: "not a component in this sweep: a variant, deleted, or another file's" });
  return out;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const arg = (k) => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1]; };
  const fail = (msg) => { console.error(msg); process.exit(2); };
  const json = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch (e) { fail(`${f}: ${e.code === 'ENOENT' ? 'no such file' : e.code === 'EISDIR' ? 'a folder, not a file' : 'not JSON (' + e.message + ')'}`); } };
  const FLAGS = ['--against', '--internal-prefix', '--exclude', '--scope'];
  const usage = 'usage: sweep-diff.mjs <enumerate.json> --against <targets.json> [--internal-prefix <prefix>] [--exclude <ids.json>] [--scope <page>]...';
  args.forEach((a, i) => {
    if (!a.startsWith('--')) return;
    if (!FLAGS.includes(a)) fail(a + ' is not an option; ' + usage);
    if (args[i + 1] == null || args[i + 1].startsWith('--')) fail(a + ' needs a value; ' + usage);
  });
  const sweepFile = args[0], targetsFile = arg('--against'), excludeFile = arg('--exclude');
  if (!sweepFile || sweepFile.startsWith('--') || !targetsFile) fail(usage);
  const sweep = json(sweepFile);
  if (!sweep || !Array.isArray(sweep.pages)) fail(sweepFile + ' is not enumerate.js\'s output (no pages)');
  const scope = args.flatMap((a, i) => (a === '--scope' && args[i + 1] != null ? [args[i + 1]] : []));
  let out;
  try {
    out = against(sweep, json(targetsFile), { internalPrefix: arg('--internal-prefix'), exclude: excludeFile ? json(excludeFile) : [], scope });
  } catch (e) { fail(e.message.replace(/^targets:/, targetsFile + ':').replace(/^exclude:/, excludeFile + ':')); }
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.missed.length || out.outOfScope.length || (out.unknownScope || []).length ? 1 : 0);
}
