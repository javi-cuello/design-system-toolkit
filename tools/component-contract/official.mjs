#!/usr/bin/env node
/*
 * Which contract is a component's official one. A project's components library takes Figma as its source by default:
 * its official contract is the reading of Figma the snapshot writes beside each spec (contract.json). One that takes the
 * contract as its source (`"source": "contract"` in the library's audit settings) keeps its official contracts in its
 * home, one file per component named by its Figma component key (contracts/<key>.json), written when it switches and
 * when the contract editor saves one, never by a snapshot; so a component renamed in Figma keeps its contract, and
 * Figma's reading, still written on every snapshot, is compared with it: where they differ, Figma is behind.
 *
 * Every tool that reads a component's contract reads it through `officials(where).of(contract.json's contract)`.
 *
 *   node tools/component-contract/official.mjs --project <label>                     which source, and what Figma is behind on
 *   node tools/component-contract/official.mjs --project <label> --switch contract   the contracts as they are become the official ones
 *   node tools/component-contract/official.mjs --project <label> --switch figma      lists what Figma is behind on; with --confirm, drops the official files
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { libraryOf } from '../parity/project.mjs';

import { realpathSync } from 'node:fs';
const require = createRequire(import.meta.url);
const projects = require('../snapshot/projects.cjs');

const sorted = (x) => (Array.isArray(x) ? x.map(sorted) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sorted(x[k])])) : x);
export const same = (a, b) => JSON.stringify(sorted(a ?? null)) === JSON.stringify(sorted(b ?? null));
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

/* The project's components library's source, read from the context document `where` names (a worktree's own, where
   its home is in the repo): 'contract' where the library's audit settings say so, else 'figma'. */
export function sourceOf(where) {
  if (!where || !where.label || !where.doc) return 'figma';
  const { libKey } = libraryOf(where.label);
  const lib = libKey && projects.auditContext(where.doc).libraries[libKey];
  return lib && lib.source === 'contract' ? 'contract' : 'figma';
}

/* A checkout's own project, for its official contracts: the checkout's home where the home is in the repo, so a
   worktree or an eval's copy reads its own; else the registered home. Null for a repo no project names. */
export function homeIn(repo) {
  const at = projects.locate(repo);
  const home = at.error ? null : projects.layout(null, at.project);
  if (!home || home.error) return null;
  const own = path.join(repo, path.basename(home.projectDir));
  return fs.existsSync(path.join(own, 'design-system-context.md'))
    ? { label: at.project, projectDir: own, doc: path.join(own, 'design-system-context.md') }
    : { label: at.project, projectDir: home.projectDir, doc: home.doc };
}

/* `where` is the project's layout (projects.cjs). `of(c)` is the official contract of the component Figma's reading `c`
   is of: its file where the project takes the contract as its source and has one, else `c` itself. */
export function officials(where) {
  const source = sourceOf(where);
  const dir = where && where.projectDir ? path.join(where.projectDir, 'contracts') : null;
  // the one way a key names a file: Figma's hex key, nothing a path could be made of
  const fileOf = (key) => (dir && key && /^[0-9a-f]{20,64}$/.test(key) ? path.join(dir, `${key}.json`) : null);
  const of = (c) => {
    if (source !== 'contract' || !c) return c;
    const f = fileOf(c.figma && c.figma.key);
    return f && fs.existsSync(f) ? readJson(f) : c;
  };
  // every official contract, by its key
  const all = () => (source === 'contract' && dir && fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => readJson(path.join(dir, f))) : []);
  return { source, dir, fileOf, of: (c) => { const o = of(c); return o && c && o !== c ? { ...o, figma: c.figma } : o; }, all };
}

/* Figma's readings, one per component folder that has one. */
export function readings(where) {
  const dir = where.paths && where.paths.components;
  if (!dir || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).sort().map((folder) => ({ folder, file: path.join(dir, folder, 'contract.json') })).filter((x) => fs.existsSync(x.file)).map((x) => ({ folder: x.folder, contract: readJson(x.file) }));
}

/* Every component's official contract, by its folder: what the tools that read a whole library read. */
export function contracts(where) {
  const { of } = officials(where);
  return readings(where).map((r) => ({ folder: r.folder, contract: of(r.contract) }));
}

/* Where Figma is behind the official contracts: a component whose reading differs (`changed`), one Figma has that has no
   official contract yet (`new`), one with an official contract Figma no longer has (`gone`). Empty in figma mode. */
export function behind(where) {
  const o = officials(where);
  if (o.source !== 'contract') return [];
  const read = readings(where);
  const byKey = new Map(read.map((r) => [r.contract.figma && r.contract.figma.key, r]));
  const out = [];
  for (const r of read) {
    const f = o.fileOf(r.contract.figma && r.contract.figma.key);
    if (!f || !fs.existsSync(f)) { out.push({ kind: 'new', component: r.contract.component, folder: r.folder, figma: r.contract, official: null }); continue; }
    const official = readJson(f);
    // where Figma keeps the component (its node, its name there) is Figma's to say, not a difference
    const bare = (c) => ({ ...c, figma: { ...c.figma, id: null, name: null } });
    if (!same(bare(official), bare(r.contract))) out.push({ kind: 'changed', component: official.component, folder: r.folder, figma: r.contract, official });
  }
  for (const official of o.all()) if (!byKey.has(official.figma && official.figma.key)) out.push({ kind: 'gone', component: official.component, folder: null, figma: null, official });
  return out;
}

/* Each value that differs between two contracts, by its path: `props.size.default`, `anatomy.content/label.color`. */
export function differences(official, figma) {
  const out = [];
  const walk = (a, b, at) => {
    if (same(a, b)) return;
    const objs = a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b);
    if (!objs) { out.push({ at: at.join('.'), official: a, figma: b }); return; }
    for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])]) walk(a[k], b[k], [...at, k]);
  };
  walk(official, figma, []);
  return out;
}

/* What the library's designer is asked to change in Figma, said as the code brief is: one line a difference. */
export function figmaBrief(d) {
  const say = (v) => (v === undefined ? 'nothing' : typeof v === 'string' ? v : JSON.stringify(v));
  if (d.kind === 'new') return `${d.component}: in Figma, not in the official contracts. Take it as official in the contract editor, or remove it from the library.`;
  if (d.kind === 'gone') return `${d.component}: in the official contracts, no longer in the library. Draw it (the contract editor's Push to Figma), or drop its official contract.`;
  const lines = differences(d.official, d.figma).filter((x) => x.at !== 'figma.id' && x.at !== 'figma.name');
  return [`${d.component} in Figma, to match the official contract:`, ...lines.map((x) => `- ${x.at}: ${say(x.official)} (Figma has ${say(x.figma)})`)].join('\n');
}

/* The library's audit settings with `source` set, written back into the context document. */
const setSource = (where, libKey, source) => projects.setLibrary(where.doc, libKey, (lib) => { if (source === 'figma') delete lib.source; else lib.source = source; });

/* Into contract mode: each component's contract as it is becomes its official file, and the setting says so. Back to
   figma mode: refused while Figma is behind on anything, unless confirmed, since the official files are then dropped. */
export function switchTo(label, to, { confirm = false } = {}) {
  const where = projects.layout(null, label);
  if (where.error) throw new Error(where.error);
  const { libKey } = libraryOf(label);
  if (!libKey) throw new Error(`${label} has no components library`);
  const o = officials(where);
  if (to === 'contract') {
    if (o.source === 'contract') return { said: `${label} already takes the contract as its source.` };
    fs.mkdirSync(o.dir, { recursive: true });
    let n = 0;
    for (const r of readings(where)) {
      const f = o.fileOf(r.contract.figma && r.contract.figma.key);
      if (!f) continue;
      fs.writeFileSync(f, JSON.stringify(r.contract, null, 2) + '\n');
      n++;
    }
    setSource(where, libKey, 'contract');
    return { said: `${label} takes the contract as its source: ${n} official contracts in ${o.dir}.` };
  }
  if (to !== 'figma') throw new Error(`--switch figma or --switch contract, not ${to}`);
  if (o.source !== 'contract') return { said: `${label} already takes Figma as its source.` };
  const lost = behind(where);
  if (lost.length && !confirm) return { refused: true, said: `Figma is behind on ${lost.length} component(s); switching back drops the official contracts, and with them:\n${lost.map(figmaBrief).join('\n')}\nRun again with --confirm to switch anyway.` };
  fs.rmSync(o.dir, { recursive: true, force: true });
  setSource(where, libKey, 'figma');
  return { said: `${label} takes Figma as its source again${lost.length ? `; ${lost.length} difference(s) dropped` : ''}.` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const argv = process.argv.slice(2);
  const flag = (n) => { const i = argv.indexOf(n); return i < 0 ? null : argv[i + 1]; };
  const label = flag('--project');
  if (!label) { console.error('official: --project <label>'); process.exit(2); }
  try {
    if (flag('--switch')) {
      const r = switchTo(label, flag('--switch'), { confirm: argv.includes('--confirm') });
      console.log(r.said);
      process.exit(r.refused ? 1 : 0);
    }
    const where = projects.layout(null, label);
    if (where.error) throw new Error(where.error);
    const o = officials(where);
    const list = behind(where);
    console.log(`${label}: ${o.source === 'contract' ? `the contract is the source (${o.dir})` : 'Figma is the source'}`);
    for (const d of list) console.log(figmaBrief(d));
    if (o.source === 'contract' && !list.length) console.log('Figma matches every official contract.');
  } catch (e) { console.error(`official: ${e.message}`); process.exit(2); }
}
