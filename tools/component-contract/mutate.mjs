#!/usr/bin/env node
/*
 * The comparer proven: a known change applied to one side of a leg must turn that leg's compare red. A count of "the
 * same" is only as good as the compare that found no row, so each leg is shown catching what it must catch.
 *
 *   node tools/component-contract/mutate.mjs --project <label> [--sample N] [--seed S] [--legs self,second,figma,browser]
 *   node tools/component-contract/eval.mjs --project <label> --mutate [--sample N] [--seed S]   (the same, beside the headline)
 *
 * No Figma and no browser: it reads what is stored. A sample of components per leg (fixed by the seed), and per
 * component one mutation of each kind (KINDS), applied to the side that came back:
 *
 *   browser, self  the reading from code (asFigma), held to the official contract (eval's roundTrip, then leftToCode)
 *   second         the second reading, held to the first
 *   figma          the drawing as the walk reads it, whose reading is not stored, so the stored figma.json stands in
 *                  for it: derive, roundTrip against the contract, and geometry.mjs against the stored figma.json
 *
 * A mutation is caught where the compare's rows (those not left to code) differ from the unmutated reading's; one whose
 * rows only moved to `left` is said `left to code`, missed all the same. Each change follows its field everywhere the
 * side sets it (the base and every variant), so it changes every combination it reaches. Prints the rate per leg and
 * kind, and every mutation that passed unseen with its component and place.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { roundTrip, inWordsOf, figmaSide } from './to-figma.mjs';
import { leftToCode } from './eval.mjs';
import { expand } from './layers.mjs';
import { contracts } from './official.mjs';
import { geometry, knownOf } from './geometry.mjs';

const req = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));

export const KINDS = ['padding', 'gap', 'token', 'child', 'instance', 'textStyle', 'fill', 'visibility'];
export const LEGS = ['browser', 'self', 'second', 'figma'];
const SAID = { padding: 'padding +1', gap: 'gap +1', token: 'token swapped', child: 'child dropped', instance: 'instance swapped', textStyle: 'text style swapped', fill: 'fill one step off', visibility: 'visibility flipped' };

/* mulberry32: a seeded sequence in [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (r, xs) => (xs.length ? xs[Math.floor(r() * xs.length)] : undefined);
const copy = (x) => JSON.parse(JSON.stringify(x));
const isColour = (v) => typeof v === 'string' && /^(#[0-9a-f]{3,8}$|rgba?\(|hsla?\(|oklch\()/i.test(v.trim());
const groupOf = (name) => name.slice(0, name.lastIndexOf('/') + 1);

/* What a mutation may swap to: every variable (its collection, and whether a colour or a number), paint and text style,
   and the library's components by name. tokens: the snapshot's tokens.json; library: its contracts. */
export function catalogueOf(tokens = {}, library = []) {
  const vars = new Map();
  for (const [collection, c] of Object.entries(tokens.collections || {})) for (const mode of Object.values(c.values || {})) for (const [name, value] of Object.entries(mode || {})) {
    if (vars.has(name)) continue;
    const type = typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) ? 'number' : isColour(value) ? 'colour' : 'other';
    vars.set(name, { collection, type, value: type === 'number' ? +value : value });
  }
  const paints = (tokens.paintStyles || []).map((p) => p.name);
  const textStyles = (tokens.textStyles || []).map((t) => t.name);
  const mains = [...new Map(library.filter(Boolean).map((c) => [c.component, { component: c.component, key: (c.figma || {}).key || null }])).values()];
  return { vars, paints, textStyles, mains };
}

/* The next of a list from `name` that is not it (and not of the same value): a step, the previous one at the end. */
const neighbour = (list, name, valueOf = () => null) => {
  const i = list.indexOf(name);
  if (i < 0) return undefined;
  const differs = (x) => x !== name && JSON.stringify(valueOf(x)) !== JSON.stringify(valueOf(name));
  return list.slice(i + 1).find(differs) ?? list.slice(0, i).reverse().find(differs);
};
/* A raw colour one step off: one hex digit on its first channel (16 of 255), down where it would overflow. */
export function colourStep(v) {
  const s = String(v).trim();
  let m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
  if (m) { const r = parseInt(m[1].slice(0, 2), 16), r2 = r + 16 > 255 ? r - 16 : r + 16; return `#${r2.toString(16).padStart(2, '0')}${m[1].slice(2)}${m[2] || ''}`; }
  m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) return colourStep(`#${[...m[1]].map((c) => c + c).join('')}`);
  m = /^(rgba?\(\s*)(\d+)(.*)$/i.exec(s);
  if (m) { const r = +m[2]; return `${m[1]}${r + 16 > 255 ? r - 16 : r + 16}${m[3]}`; }
  return undefined;
}
/* A colour token, paint style or raw colour one step off; undefined where none. */
function fillStep(v, cat) {
  if (typeof v !== 'string') return undefined;
  const t = cat.vars.get(v);
  if (t) {
    const same = [...cat.vars].filter(([, x]) => x.collection === t.collection && x.type === t.type).map(([k]) => k);
    const near = same.filter((k) => groupOf(k) === groupOf(v));
    return neighbour(near, v, (k) => cat.vars.get(k).value) ?? neighbour(same, v, (k) => cat.vars.get(k).value);
  }
  if (cat.paints.includes(v)) return neighbour(cat.paints.filter((k) => groupOf(k) === groupOf(v)), v) ?? neighbour(cat.paints, v);
  return colourStep(v);
}
/* Another variable of the same collection and kind (its group first), whatever its value. */
function tokenSwap(v, cat, r) {
  const t = cat.vars.get(v);
  if (!t) return undefined;
  const same = [...cat.vars].filter(([k, x]) => k !== v && x.collection === t.collection && x.type === t.type).map(([k]) => k);
  return pick(r, same.filter((k) => groupOf(k) === groupOf(v))) ?? pick(r, same);
}
/* A number one more: a number token becomes its value plus one, as a reading that drew the number would say it. */
const plusOne = (v, cat) => (typeof v === 'number' ? v + 1 : cat.vars.get(v) && cat.vars.get(v).type === 'number' ? cat.vars.get(v).value + 1 : undefined);

/* ---- a contract (an official one, or a reading's asFigma) ---- */

/* Every element of a contract: the base anatomy's, then what variants add. */
const elementsOf = (c) => { const out = new Map(Object.entries(c.anatomy || {})); for (const v of c.variants || []) for (const [id, e] of Object.entries(v.add || {})) if (!out.has(id)) out.set(id, e); return out; };
/* Every place a contract sets an element's field: the base, each variant's add, each variant's set at any depth. */
function sites(c, id, p) {
  const out = [];
  const inObj = (o, ks) => {
    let x = o;
    for (const k of ks.slice(0, -1)) { if (!x || typeof x !== 'object') return; x = x[k]; }
    const last = ks[ks.length - 1];
    if (x && typeof x === 'object' && x[last] !== undefined) out.push({ get: () => x[last], put: (v) => { x[last] = v; } });
  };
  inObj((c.anatomy || {})[id], p);
  for (const v of c.variants || []) {
    inObj((v.add || {})[id], p);
    const s = v.set || {};
    for (let i = 1; i <= p.length; i++) {
      const k = `${id}.${p.slice(0, i).join('.')}`;
      if (!(k in s)) continue;
      if (i === p.length) { if (s[k] !== undefined && s[k] !== null) out.push({ get: () => s[k], put: (x) => { s[k] = x; } }); } else inObj(s[k], p.slice(i));
    }
  }
  return out;
}
/* Every leaf a contract sets on an element: [id, path, value]. */
function leaves(c, reaches = () => true) {
  const out = [];
  const walk = (id, p, v) => { if (v && typeof v === 'object' && !Array.isArray(v)) { for (const [k, x] of Object.entries(v)) walk(id, [...p, k], x); } else if (p.length) out.push([id, p, v]); };
  const skip = new Set(['parent', 'order', 'kind', 'name']);
  const own = (id, e) => { for (const [k, x] of Object.entries(e || {})) if (!skip.has(k)) walk(id, [k], x); };
  for (const [id, e] of Object.entries(c.anatomy || {})) own(id, e);
  for (const v of c.variants || []) {
    if (!reaches(v.when)) continue;
    for (const [id, e] of Object.entries(v.add || {})) own(id, e);
    for (const [k, x] of Object.entries(v.set || {})) { const dot = k.indexOf('.'); if (dot > 0) walk(k.slice(0, dot), k.slice(dot + 1).split('.'), x); }
  }
  // one per place, in a fixed order
  const seen = new Map();
  for (const [id, p, v] of out) { const at = `${id}.${p.join('.')}`; if (!seen.has(at)) seen.set(at, [id, p, v]); }
  return [...seen.values()].sort((a, b) => (`${a[0]}.${a[1].join('.')}` < `${b[0]}.${b[1].join('.')}` ? -1 : 1));
}
/* Change one field everywhere it is set; the mutation, or null where nothing changed. */
function everywhere(c, id, p, f) {
  const out = copy(c);
  let changed = false;
  for (const s of sites(out, id, p)) { const v = f(s.get()); if (v !== undefined && JSON.stringify(v) !== JSON.stringify(s.get())) { s.put(v); changed = true; } }
  return changed ? { contract: out, at: `${id}.${p.join('.')}` } : null;
}
/* A field kind: candidates by `test`, the first that changes by `to`. */
function fieldIn(c, r, test, to, reaches) {
  const cands = leaves(c, reaches).filter(([id, p, v]) => test(id, p, v));
  // (from a seeded start, the first candidate that changes anything: a value every variant sets the same is skipped)
  const start = Math.floor(r() * cands.length);
  for (let i = 0; i < cands.length; i++) {
    const [id, p, v] = cands[(start + i) % cands.length];
    const want = to(v, r);
    if (want === undefined) continue;
    const m = everywhere(c, id, p, (x) => (JSON.stringify(x) === JSON.stringify(v) ? want : to(x, r)));
    if (m) return m;
  }
  return null;
}
const descendants = (els, id) => { const out = new Set([id]); let grew = true; while (grew) { grew = false; for (const [k, e] of els) if (!out.has(k) && e && out.has(e.parent)) { out.add(k); grew = true; } } return out; };

/* One mutation of `kind` on a contract: { contract, at } (a copy), or null where the kind has nothing to change. */
// `reaches(when)`: whether a variant applies to a combination the compare holds (one that applies to none, a variant at
// combinations the library does not draw, changes nothing compared, so it is never chosen)
export function mutateContract(c, kind, { rng: r, catalogue: cat, reaches = () => true }) {
  const els = elementsOf({ ...c, variants: (c.variants || []).filter((v) => reaches(v.when)) });
  const fieldMutation = (cc, rr, test, to) => fieldIn(cc, rr, test, to, reaches);
  const isRoot = (id) => !(els.get(id) || {}).parent;
  if (kind === 'padding') return fieldMutation(c, r, (id, p) => p[0] === 'layout' && p[1] === 'padding' && p.length === 3, (v) => plusOne(v, cat));
  if (kind === 'gap') return fieldMutation(c, r, (id, p) => p.join('.') === 'layout.gap', (v) => plusOne(v, cat));
  if (kind === 'token') {
    // a number's token first (a spacing, a radius); a colour's where the component has none
    const tokenAt = (type) => (id, p, v) => p[0] !== 'typography' && cat.vars.has(v) && cat.vars.get(v).type === type;
    return fieldMutation(c, r, tokenAt('number'), (v, rr) => tokenSwap(v, cat, rr)) || fieldMutation(c, r, (id, p, v) => tokenAt('colour')(id, p, v) || tokenAt('other')(id, p, v), (v, rr) => tokenSwap(v, cat, rr));
  }
  if (kind === 'textStyle') return fieldMutation(c, r, (id, p, v) => p.join('.') === 'typography' && typeof v === 'string', (v, rr) => pick(rr, cat.textStyles.filter((t) => t !== v)));
  if (kind === 'fill') return fieldMutation(c, r, (id, p, v) => (p.join('.') === 'background' || p.join('.') === 'fillStyle') && typeof v === 'string', (v) => fillStep(v, cat));
  if (kind === 'instance') {
    const ids = [...els].filter(([, e]) => e && e.kind === 'instance' && typeof e.component === 'string').map(([id]) => id).sort();
    if (!ids.length) return null;
    const id = ids[Math.floor(r() * ids.length)], was = els.get(id).component;
    const other = pick(r, cat.mains.filter((m) => m.component.toLowerCase() !== String(was).toLowerCase()));
    if (!other) return null;
    const m = everywhere(c, id, ['component'], () => other.component);
    if (m && other.key) for (const s of sites(m.contract, id, ['key'])) s.put(other.key);
    return m && { ...m, at: `${id}.component (${was} → ${other.component})` };
  }
  if (kind === 'child') {
    const ids = [...els.keys()].filter((id) => !isRoot(id)).sort();
    if (!ids.length) return null;
    const id = ids[Math.floor(r() * ids.length)], gone = descendants(els, id), out = copy(c);
    for (const g of gone) delete (out.anatomy || {})[g];
    for (const v of out.variants || []) {
      for (const g of gone) if (v.add) delete v.add[g];
      if (v.set) for (const k of Object.keys(v.set)) if (gone.has(k.slice(0, k.indexOf('.')))) delete v.set[k];
      if (v.remove) v.remove = v.remove.filter((x) => !gone.has(x));
    }
    return { contract: out, at: id };
  }
  if (kind === 'visibility') {
    // one variant hides a part the base draws, with what it holds
    const base = new Map(Object.entries(c.anatomy || {}));
    const pairs = (c.variants || []).flatMap((v, i) => (!reaches(v.when) ? [] : [...base.keys()]).filter((id) => !isRoot(id) && !(v.remove || []).includes(id) && !(v.add || {})[id]).map((id) => [i, id]));
    if (!pairs.length) return null;
    const [i, id] = pairs[Math.floor(r() * pairs.length)], out = copy(c), v = out.variants[i];
    v.remove = [...new Set([...(v.remove || []), ...descendants(base, id)])];
    return { contract: out, at: `${id} hidden at ${JSON.stringify(v.when || {})}` };
  }
  throw new Error(`no mutation kind ${kind}`);
}

/* ---- a stored figma.json (the drawing as the walk reads it) ---- */

const nodesOf = (v) => { const m = new Map([['', v]]); layerPaths(v, (node, p) => { m.set(p, node); }); return m; };
let layerPaths, resolve, compact;
{ ({ layerPaths, resolve, compact } = req('../snapshot/spec.cjs')); }
/* Change every node at one layer path (every variant that has it); null where nothing changed. */
function atPath(spec, p, f, onlyVariant = null) {
  const out = { ...copy(spec), variants: copy(spec.variants) };
  let changed = false;
  out.variants.forEach((v, i) => { if (onlyVariant !== null && i !== onlyVariant) return; const n = nodesOf(v).get(p); if (n && f(n, v)) changed = true; });
  return changed ? out : null;
}
const parentOf = (v, p) => (p.includes(' > ') ? nodesOf(v).get(p.slice(0, p.lastIndexOf(' > '))) : v);

/* One mutation of `kind` on a stored spec (compact or full): { spec (full), at }, or null. */
export function mutateSpec(stored, kind, { rng: r, catalogue: cat }) {
  const spec = resolve(copy(stored));
  const paths = [...new Set(spec.variants.flatMap((v) => [...nodesOf(v).keys()]))].sort();
  const first = (test, change, label) => {
    const cands = paths.filter((p) => spec.variants.some((v) => { const n = nodesOf(v).get(p); return n && test(n, p); }));
    const start = Math.floor(r() * cands.length);
    for (let i = 0; i < cands.length; i++) {
      const p = cands[(start + i) % cands.length];
      const out = atPath(spec, p, (n) => test(n, p) && change(n));
      if (out) return { spec: out, at: `${p || '(variant)'}.${label}` };
    }
    return null;
  };
  if (kind === 'padding') return first((n) => Array.isArray(n.pad) && typeof n.pad[0] === 'number', (n) => { n.pad = [n.pad[0] + 1, ...n.pad.slice(1)]; return true; }, 'pad.0');
  if (kind === 'gap') return first((n) => typeof n.gap === 'number' && n.layout && n.layout !== 'NONE', (n) => { n.gap += 1; return true; }, 'gap');
  if (kind === 'token') {
    const swap = (n) => { for (const k of Object.keys(n.bindings || {}).sort()) { const b = n.bindings[k]; if (typeof b === 'string' && tokenSwap(b, cat, r)) { n.bindings[k] = tokenSwap(b, cat, rng(hash(b))); return true; } if (Array.isArray(b)) { const j = b.findIndex((x) => typeof x === 'string' && tokenSwap(x, cat, r)); if (j >= 0) { n.bindings[k] = b.map((x, i) => (i === j ? tokenSwap(x, cat, rng(hash(x))) : x)); return true; } } } return false; };
    const has = (n) => Object.values(n.bindings || {}).some((b) => (Array.isArray(b) ? b : [b]).some((x) => typeof x === 'string' && cat.vars.has(x)));
    return first(has, swap, 'bindings')
      || first((n) => (n.fills || []).some((x) => typeof x === 'string' && cat.vars.has(x)), (n) => { const j = n.fills.findIndex((x) => typeof x === 'string' && cat.vars.has(x)); const to = tokenSwap(n.fills[j], cat, rng(hash(n.fills[j]))); if (!to) return false; n.fills = n.fills.map((x, i) => (i === j ? to : x)); return true; }, 'fills');
  }
  if (kind === 'textStyle') return first((n) => typeof n.textStyle === 'string' && n.textStyle !== 'literal', (n) => { const to = pick(rng(hash(n.textStyle)), cat.textStyles.filter((t) => t !== n.textStyle)); if (!to) return false; n.textStyle = to; return true; }, 'textStyle');
  if (kind === 'fill') {
    return first((n) => (n.fills || []).some((x) => fillStep(x, cat)), (n) => { const j = n.fills.findIndex((x) => fillStep(x, cat)); n.fills = n.fills.map((x, i) => (i === j ? fillStep(x, cat) : x)); return true; }, 'fills')
      || first((n) => typeof n.fillStyle === 'string' && fillStep(n.fillStyle, cat), (n) => { n.fillStyle = fillStep(n.fillStyle, cat); return true; }, 'fillStyle');
  }
  if (kind === 'instance') {
    const set = (s) => String(s).split(' / ')[0].toLowerCase();
    return first((n) => n.type === 'INSTANCE' && typeof n.instanceOf === 'string', (n) => {
      const other = pick(rng(hash(n.instanceOf)), cat.mains.filter((m) => m.component.toLowerCase() !== set(n.instanceOf)));
      if (!other) return false;
      n.instanceOf = other.component; if (other.key) n.instanceOfKey = other.key; return true;
    }, 'instanceOf');
  }
  if (kind === 'child' || kind === 'visibility') {
    const cands = paths.filter((p) => p);
    if (!cands.length) return null;
    const p = cands[Math.floor(r() * cands.length)];
    // a child dropped from every variant; a layer hidden in one (the walk reads visible layers only)
    const has = spec.variants.map((v, i) => (nodesOf(v).has(p) ? i : -1)).filter((i) => i >= 0);
    const only = kind === 'visibility' ? has[Math.floor(r() * has.length)] : null;
    const out = { ...spec, variants: copy(spec.variants) };
    out.variants.forEach((v, i) => {
      if (only !== null && i !== only) return;
      const up = parentOf(v, p), n = nodesOf(v).get(p);
      if (up && n) up.children = up.children.filter((x) => x !== n);
    });
    return { spec: out, at: kind === 'visibility' ? `${p} hidden in ${out.variants[only].name}` : p };
  }
  throw new Error(`no mutation kind ${kind}`);
}

/* ---- each leg's compare, as eval.mjs measure() runs it ---- */

/* The browser, self and second legs: roundTrip, then what is left to code apart (`split`, the self and second legs).
   `held`: the side the reading is held to (the contract; for the second leg the first reading, with the contract's
   invalid combinations), `contract`: the official one, for what is left to code. */
export function compareContract(held, reading, { mains = null, settings, split = false, ownSheet = true, contract = held, pointerFrom = null } = {}) {
  const r = roundTrip(held, reading, { mains, layoutUnit: true, ...(pointerFrom && { pointerFrom }) });
  if (!split) return { rows: r.rows, left: [] };
  const isLeft = leftToCode(contract, mains, settings, { ownSheet });
  return { rows: r.rows.filter((x) => !isLeft(x.at, x)), left: r.rows.filter((x) => isLeft(x.at, x)) };
}
/* Which of a reading's variants the compare reaches: those that apply to a combination roundTrip holds (every one of
   the held side's axes, less its invalid ones), in the reading's words (inWordsOf), as roundTrip pairs them. */
export function reachesOf(held, reading) {
  const h = figmaSide(held), d = figmaSide(reading);
  let combos = [{}];
  for (const [k, q] of Object.entries(h.props || {})) if (q.type === 'enum' || q.type === 'boolean') combos = combos.flatMap((c) => (q.type === 'enum' ? q.values : [true, false]).map((v) => ({ ...c, [k]: v })));
  const notDrawn = (c) => (h.invalid || []).some((w) => Object.entries(w).every(([k, v]) => String(c[k]) === String(v)));
  const theirs = combos.filter((c) => !notDrawn(c)).map(inWordsOf(h, d));
  const reaches = (w) => theirs.some((c) => Object.entries(w || {}).every(([k, v]) => String(c[k]) === String(v)));
  return Object.assign(reaches, { combos: theirs });
}
/* Whether a mutation changes what any of those combinations draws: its anatomy expanded there, less what a boolean
   off hides (its `shows`). A change that reaches none (a part hidden where a boolean already hides it) is no test. */
export function reachesAny(before, after, combos) {
  const drawn = (c, at) => {
    const flat = expand(c, at), off = new Set(Object.entries(c.props || {}).filter(([k, q]) => q.type === 'boolean' && at[k] === false).flatMap(([, q]) => q.shows || []));
    const hidden = (id) => { for (let x = id; x; x = (flat[x] || {}).parent) if (off.has(x)) return true; return false; };
    return JSON.stringify(Object.entries(flat).filter(([id]) => !hidden(id)).sort(([a], [b]) => (a < b ? -1 : 1)));
  };
  return combos.some((c) => drawn(before, c) !== drawn(after, c));
}

/* The Figma leg: the drawing derived and held to the contract (to-figma --verify), and held to the stored figma.json
   layer by layer (geometry.mjs). `stored`, `drawn`: figma.json shapes. */
export function compareFigma(contract, stored, drawn, { names = [], deriveOptions = {}, mains = null, known = null } = {}) {
  const { derive } = req('./derive.cjs');
  const now = derive(compact(resolve(drawn)), names, deriveOptions);
  return { rows: [...roundTrip(contract, now, { mains }).rows, ...geometry(stored, drawn, { known })], left: [] };
}

/* ---- the run ---- */

const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const key = (rows) => JSON.stringify(rows.map((x) => JSON.stringify(x)).sort());

/* Every leg's mutations over a sample of a project's components: [{ leg, folder, kind, at?, outcome, why? }], outcome
   caught | missed | left (moved only to left to code) | none (the kind has nothing to change) | error | unread (no
   reading on that leg). Deterministic for a seed. */
export function runMutations(where, { sample = 10, seed = 1, legs = LEGS, kinds = KINDS } = {}) {
  const home = where.projectDir;
  const all = contracts(where).filter((x) => x.contract);
  const library = all.map((x) => x.contract);
  const { byComponentName } = req('./derive.cjs');
  const mains = byComponentName(library);
  const tokens = (where.paths.tokens && read(where.paths.tokens)) || {};
  const cat = catalogueOf(tokens, library);
  const projects = req('../snapshot/projects.cjs');
  const settingsOf = projects.librarySettingsFor(where.paths.components);
  const index = ((where.paths.index && read(where.paths.index)) || {}).components || {};
  const names = Object.values(index).map((x) => x.name);
  const deriveOptionsFor = (() => { try { return projects.deriveOptionsFor(where.paths.components); } catch { return () => ({}); } })();
  // the store's version gate, as to-figma --verify reads it: the fields the library's snapshot records
  const walk = (() => { try { return fs.readFileSync(path.resolve(HERE, '../../plugins/design-system-snapshot/code.js'), 'utf8'); } catch { return ''; } })();
  const walkVersion = (walk.match(/const VERSION = '([^']+)'/) || [])[1];
  let specs = null;
  const knownFor = (folder, stored) => {
    if (!tokens._meta) return null;
    specs ||= Object.fromEntries(req('../snapshot/store.cjs').readSpecs(where.paths.components, { compact: true }).map((x) => [x.folder, x.spec]));
    return knownOf(tokens, { ...specs, [folder]: compact(stored) }, walkVersion, { file: (index[folder] || {}).file, fileOf: (k) => (index[k] || {}).file });
  };
  const selfDir = path.join(home, 'round-trip', 'self', 'from-code');
  const inputs = {
    browser: (folder) => { const x = read(path.join(home, 'parity', 'from-code', `${folder}.json`)); return x && x.asFigma && { reading: x.asFigma }; },
    self: (folder) => { const x = read(path.join(selfDir, `${folder}.json`)); return x && x.asFigma && { reading: x.asFigma }; },
    second: (folder) => { const a = read(path.join(selfDir, `${folder}.json`)), b = read(path.join(home, 'round-trip', 'self2', 'from-code', `${folder}.json`)); return a && a.asFigma && b && b.asFigma && { first: a.asFigma, reading: b.asFigma }; },
    figma: (folder) => { const s = read(path.join(where.paths.components, folder, 'figma.json')); return s && { stored: s }; },
  };
  const out = [];
  for (const leg of legs) {
    const have = all.filter(({ folder }) => inputs[leg](folder));
    if (!have.length) { out.push({ leg, outcome: 'unread' }); continue; }
    // the sample, fixed by the seed: a shuffle of the folders in name order
    const r = rng(seed ^ hash(leg));
    const order = have.map((x) => x.folder).sort().map((f) => [r(), f]).sort((a, b) => a[0] - b[0]).map(([, f]) => f);
    for (const folder of order.slice(0, sample)) {
      const { contract } = have.find((x) => x.folder === folder);
      const input = inputs[leg](folder);
      let compare, side, apply;
      if (leg === 'figma') {
        const stored = resolve(input.stored);
        const ctx = { names, deriveOptions: deriveOptionsFor(folder), mains, known: knownFor(folder, input.stored) };
        compare = (drawn) => compareFigma(contract, stored, drawn, ctx);
        side = stored; apply = (kind, rr) => { const m = mutateSpec(stored, kind, { rng: rr, catalogue: cat }); return m && { side: m.spec, at: m.at }; };
      } else {
        const opts = { mains, settings: settingsOf(folder), split: leg !== 'browser', contract, ...(leg === 'second' && { ownSheet: false, pointerFrom: contract }) };
        const held = leg === 'second' ? { ...input.first, invalid: contract.invalid } : contract;
        compare = (reading) => compareContract(held, reading, opts);
        const reaches = reachesOf(held, input.reading);
        // (a mutation that changes no combination compared is drawn again, up to four times, then said not to apply)
        side = input.reading; apply = (kind, rr) => { for (let i = 0; i < 4; i++) { const m = mutateContract(side, kind, { rng: rr, catalogue: cat, reaches }); if (!m) return null; if (reachesAny(side, m.contract, reaches.combos)) return { side: m.contract, at: m.at }; } return null; };
      }
      let base;
      try { base = compare(side); } catch (e) { out.push({ leg, folder, outcome: 'error', why: `the unmutated compare threw: ${e.message}` }); continue; }
      for (const kind of kinds) {
        let m;
        try { m = apply(kind, rng(seed ^ hash(`${folder}\0${kind}`))); } catch (e) { out.push({ leg, folder, kind, outcome: 'error', why: `the mutation threw: ${e.message}` }); continue; }
        if (!m) { out.push({ leg, folder, kind, outcome: 'none' }); continue; }
        let now;
        try { now = compare(m.side); } catch (e) { out.push({ leg, folder, kind, at: m.at, outcome: 'error', why: `the compare threw: ${e.message}` }); continue; }
        const outcome = key(now.rows) !== key(base.rows) ? 'caught' : key(now.left) !== key(base.left) ? 'left' : 'missed';
        out.push({ leg, folder, kind, at: m.at, outcome });
      }
    }
  }
  return out;
}

/* Per leg and kind, how many applied and how many were caught; every one not caught, with its place. */
export function summary(results) {
  const legs = {}, missed = [];
  for (const x of results) {
    const l = (legs[x.leg] ||= { kinds: {}, n: 0, caught: 0 });
    if (x.outcome === 'unread') { l.none = true; continue; }
    if (!x.kind || x.outcome === 'none') continue;
    const k = (l.kinds[x.kind] ||= { n: 0, caught: 0 });
    k.n++; l.n++;
    if (x.outcome === 'caught') { k.caught++; l.caught++; } else missed.push(x);
  }
  return { legs, missed, errors: results.filter((x) => x.outcome === 'error' && !x.kind) };
}
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '—');

/* The report: one line per leg, a table of kinds by leg, then every mutation that passed unseen. */
export function lines(label, s, { seed, sample } = {}) {
  const legs = LEGS.filter((l) => s.legs[l]);
  const out = [`${label} comparer${seed != null ? ` (mutations, seed ${seed}, ${sample} per leg)` : ''}: ${legs.map((l) => (s.legs[l].none ? `${l}: no readings` : `${l} ${s.legs[l].caught} of ${s.legs[l].n} caught (${pct(s.legs[l].caught, s.legs[l].n)})`)).join(' · ')}`];
  const measured = legs.filter((l) => !s.legs[l].none);
  if (measured.length) {
    out.push(`  ${'kind'.padEnd(20)}${measured.map((l) => l.padStart(12)).join('')}`);
    for (const k of KINDS) out.push(`  ${SAID[k].padEnd(20)}${measured.map((l) => { const x = s.legs[l].kinds[k]; return (x ? `${x.caught}/${x.n}` : '—').padStart(12); }).join('')}`);
  }
  for (const e of s.errors) out.push(`  error: ${e.leg} ${e.folder}: ${e.why}`);
  if (s.missed.length) out.push(`  undetected (${s.missed.length}):`);
  for (const x of s.missed) out.push(`    ${x.leg} ${SAID[x.kind]} ${x.folder}: ${x.at}${x.outcome === 'left' ? ' (left to code)' : x.outcome === 'error' ? ` (${x.why})` : ''}`);
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const label = opt('--project'), sample = +(opt('--sample') || 10), seed = +(opt('--seed') || 1), legs = (opt('--legs') || LEGS.join(',')).split(',');
  if (!label || !(sample > 0) || !Number.isInteger(seed) || legs.some((l) => !LEGS.includes(l))) { console.error(`usage: mutate.mjs --project <label> [--sample N] [--seed S] [--legs ${LEGS.join(',')}]`); process.exit(2); }
  const where = req('../snapshot/projects.cjs').layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  for (const l of lines(label, summary(runMutations(where, { sample, seed, legs })), { seed, sample })) console.log(l);
}
