#!/usr/bin/env node
/* Checks generated TypeScript modules against the DTCG files they came from.
 *
 *   node verify-ts.mjs <tokens-dir> [ts-dir]     (default ts-dir: <tokens-dir>/dist/ts)
 *
 * Exits non-zero on any failure. Every check here has been shown to fail against
 * a deliberately broken output — a reference pointed at nothing, a ramp step
 * deleted, a value replaced by a literal — because a suite that cannot fail is
 * worse than no suite: it reads as coverage.
 *
 * The modules import each other extensionlessly, which is what a bundler expects
 * and what Node cannot resolve. So this copies them to a temp directory and
 * rewrites the specifiers there; the originals are never touched.
 *
 * Node's standard library only; no install step.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { discover, camel } from './discover.mjs';

const [, , TOKENS_DIR, TS_ARG] = process.argv;
if (!TOKENS_DIR) {
  console.error('usage: verify-ts.mjs <tokens-dir> [ts-dir]');
  process.exit(2);
}
const DIR = path.resolve(TOKENS_DIR);
const TS = path.resolve(TS_ARG ?? path.join(DIR, 'dist', 'ts'));
const load = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));

let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; return true; }
  fail++;
  console.error(`FAIL  ${label}${detail === undefined ? '' : `\n      ${detail}`}`);
  return false;
};

/* ---- discovery, from the same evidence the generator used ---- */
const collections = discover(DIR);

/* ---- make the modules importable ---- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-ts-'));
for (const f of fs.readdirSync(TS).filter(f => f.endsWith('.ts')))
  fs.writeFileSync(path.join(tmp, f), fs.readFileSync(path.join(TS, f), 'utf8')
    .replace(/from '(\.[^']*?)'/g, (m, spec) => `from '${spec}.ts'`));
const mod = await import(path.join(tmp, 'index.ts'));

const leaves = (o, into = []) => {
  for (const v of Object.values(o)) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) leaves(v, into); else into.push(v);
  }
  return into;
};
const jsonLeaves = (node, n = 0) => {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    n += v.$value !== undefined ? 1 : jsonLeaves(v);
  }
  return n;
};
const composite = v => v !== null && typeof v === 'object' && !Array.isArray(v);

/* ---- one module per collection, carrying every token ---- */
ok('a module exists for every collection',
  [...collections.keys()].every(slug => mod[camel(slug)] !== undefined),
  [...collections.keys()].filter(slug => mod[camel(slug)] === undefined).join(', '));

const at = (obj, segs) => segs.reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), obj);
const tokenPaths = (node, pre, into) => {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    const here = [...pre, camel(k)];
    if (v.$value !== undefined) into.push([here, v]); else tokenPaths(v, here, into);
  }
  return into;
};

/* Resolve each token's path in the module rather than counting leaves. Counting
 * leaves and asserting `>=` made this unfalsifiable for any collection holding
 * composites: a typography or shadow token expands into several leaves, so
 * deleting whole tokens still cleared the bar. That is how a real defect shipped
 * under "51/51 passed". */
for (const [slug, { modes, single }] of collections) {
  const m = mod[camel(slug)];
  if (!m) continue;
  for (const [mode, file] of modes) {
    const doc = load(file);
    const root = doc[slug] === undefined ? doc : doc[slug];
    const branch = single ? m : m[camel(mode)];
    const label = `${slug}${single ? '' : `.${camel(mode)}`}`;
    ok(`${label} exists`, branch !== undefined);
    if (branch === undefined) continue;

    const paths = tokenPaths(root, [], []);
    const absent = paths.filter(([segs]) => at(branch, segs) === undefined);
    ok(`${label} carries every token by path (${paths.length})`, absent.length === 0,
      absent.slice(0, 4).map(([segs]) => segs.join('.')).join(', '));

    const undef = leaves(branch).filter(v => v === undefined);
    ok(`${label} has no unresolved references`, undef.length === 0,
      `${undef.length} undefined leaves — a reference points at nothing`);

    /* The check that would have caught the composite-array defect directly: a
     * leaf still holding "{a.b.c}" means the generator emitted the reference as
     * text instead of resolving it to an expression. It compiles, it reads as a
     * token, and the consumer gets brace text where a value belongs. */
    const raw = leaves(branch).filter(v => typeof v === 'string' && /^\{.+\}$/.test(v));
    ok(`${label} has no reference left as a literal string`, raw.length === 0,
      `${raw.length} leaves like ${raw[0]}`);
  }
  if (!single && modes.size > 1) {
    const shapes = [...modes.keys()].map(k => JSON.stringify(m[camel(k)]));
    ok(`${slug}: its modes are genuinely different data`, new Set(shapes).size > 1,
      `${modes.size} modes, ${new Set(shapes).size} distinct`);
  }
}

/* ---- values, resolved through the alias chain and compared ---- */
// One index per mode, not one global index. Every mode file of a collection
// defines the same token paths with different values, so a single index lets the
// last file loaded win and silently resolves half the library to the wrong mode.
const indexes = new Map();          // mode → Map<path, token>
const modeNames = new Set();
for (const { modes, single } of collections.values())
  if (!single) for (const m of modes.keys()) modeNames.add(m);

const indexInto = (map, doc, pre = '') => {
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    const at = pre ? `${pre}.${k}` : k;
    if (v.$value !== undefined) map.set(at, v); else indexInto(map, v, at);
  }
};
for (const mode of modeNames) {
  const map = new Map();
  for (const [slug, { modes, single }] of collections)
    for (const [m, file] of modes)
      if (single || m === mode) indexInto(map, load(file));
  indexes.set(mode, map);
}

const resolveIn = (map, tok, d = 0) => {
  if (d > 8) return null;
  const v = tok.$value;
  if (typeof v === 'string' && v.startsWith('{')) {
    const t = map.get(v.slice(1, -1));
    return t ? resolveIn(map, t, d + 1) : null;
  }
  return v;
};
const hex2 = n => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
const expect = v => {
  if (v && typeof v === 'object' && v.unit !== undefined) return v.value;   // dimension
  if (typeof v !== 'object') return v;
  const a = v.alpha === undefined ? 1 : v.alpha;
  if (a >= 1) return v.hex ?? `#${v.components.map(hex2).join('')}`;
  const [r, g, b] = v.components.map(c => Math.round(c * 255));
  return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(4)})`;
};

let checked = 0; const wrong = [];
for (const [slug, { modes, single }] of collections) {
  const m = mod[camel(slug)];
  if (!m) continue;
  for (const [mode, file] of modes) {
    const branch = single ? m : m[camel(mode)];
    if (branch === undefined) continue;
    const doc = load(file);
    const walk = (node, at) => {
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('$') || !v || typeof v !== 'object') continue;
        const here = [...at, camel(k)];
        if (v.$value === undefined) { walk(v, here); continue; }
        // Every scalar the JSON resolves to is compared, not just colours.
        // Limiting this to `color` meant 1.5.0 could cite this verifier as proof
        // that shadows exported correctly while it compared zero shadow values.
        if (v.$value === undefined) continue;
        const got = here.reduce((o, seg) => (o === undefined ? o : o[seg]), branch);

        // A cross-axis reference expands over the TARGET's modes, so the leaf is
        // an object and each of its keys is checked in that mode's own index.
        if (composite(got)) {
          for (const [targetMode, value] of Object.entries(got)) {
            const map = indexes.get(targetMode) ?? indexes.get(mode);
            const want = map ? resolveIn(map, v) : null;
            if (want === null) continue;
            checked++;
            if (value !== expect(want)) wrong.push(`${slug}.${mode}.${here.join('.')}.${targetMode}: ${value} ≠ ${expect(want)}`);
          }
          continue;
        }
        const map = indexes.get(mode) ?? indexes.get([...modeNames][0]);
        const want = map ? resolveIn(map, v) : null;
        if (want === null || want === undefined) continue;
        if (typeof want === 'object' && want.colorSpace === undefined && want.unit === undefined) continue;  // composite: its parts are checked as tokens
        checked++;
        if (got !== expect(want)) wrong.push(`${slug}.${mode}.${here.join('.')}: ${got} ≠ ${expect(want)}`);
      }
    };
    walk(doc[slug] === undefined ? doc : doc[slug], []);
  }
}
ok(`every colour equals what the JSON resolves to (${checked} compared)`, wrong.length === 0,
  wrong.slice(0, 3).join(' | '));
ok('the value check actually looked at something', checked > 0,
  'nothing was compared — a probe that examines nothing is a finding about the probe');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${fail ? 'FAILED' : 'ok'} — ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
