#!/usr/bin/env node
/*
 * The comparer proven: a known change applied to one side of a leg must turn that leg's compare red. A count of "the
 * same" is only as good as the compare that found no row, so each leg is shown catching what it must catch.
 *
 *   node tools/component-contract/mutate.mjs --project <label> [--sample N] [--seed S] [--legs self,second,figma,browser] [--check]
 *   node tools/component-contract/eval.mjs --project <label> --mutate [--sample N] [--seed S] [--check]   (the same, beside the headline)
 *
 * No Figma and no browser: it reads what is stored. A sample of components per leg (fixed by the seed), and per
 * component one mutation of each kind (KINDS), applied to the side that came back:
 *
 *   browser, self  the reading from code (asFigma), held to the official contract (eval's roundTrip, then leftToCode)
 *   second         the second reading, held to the first
 *   figma          to-figma --verify's own compare (heldToLibrary) against the library's contract.json and figma.json;
 *                  the walk's reading of a drawing is not stored, so the stored figma.json stands in for it: the
 *                  drawer and the walk are untested, and the report says so
 *
 * A mutation is caught only where a row at the place it was made (`places`) is new against the unmutated compare, or
 * its values moved: a component red elsewhere is no catch. One whose row at the place went only to `left` is said `left
 * to code`, missed all the same. A number moves one step: a raw one by one, a token to its nearest token in value. Each
 * change follows its field everywhere the side sets it (the base and every variant). Prints the rate per leg and kind,
 * what was not measured (components whose compare threw, kinds with nothing to change, changes dropped as reaching no
 * combination compared), and every mutation that passed unseen with its component and place. --check fails (1) where a
 * kind applied FLOOR_MIN times or more on a leg is caught under FLOOR.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { roundTrip, inWordsOf, figmaSide, heldToLibrary } from './to-figma.mjs';
import { leftToCode } from './eval.mjs';
import { expand, camel } from './layers.mjs';
import { contracts } from './official.mjs';
import { knownOf } from './geometry.mjs';

const req = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));

export const KINDS = ['padding', 'gap', 'radius', 'stroke', 'sizing', 'token', 'fill', 'textStyle', 'text', 'effect', 'child', 'order', 'visibility', 'instance', 'instanceProps', 'slot'];
export const LEGS = ['browser', 'self', 'second', 'figma'];
const SAID = { padding: 'padding one step', gap: 'gap one step', radius: 'radius one step', stroke: 'stroke one step', sizing: 'sizing changed', token: 'token swapped', fill: 'fill one step off', textStyle: 'text style swapped', text: 'text changed', effect: 'effect swapped', child: 'child dropped', order: 'children reordered', visibility: 'visibility flipped', instance: 'instance swapped', instanceProps: 'instance prop', slot: 'slot as a frame' };
/* The floor --check holds each kind to, per leg, where it applied at least FLOOR_MIN times: see the README's mutate.mjs. */
export const FLOOR = 0.9, FLOOR_MIN = 5;

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
  const effects = (tokens.effects || []).map((e) => e.name);
  const mains = [...new Map(library.filter(Boolean).map((c) => [c.component, { component: c.component, key: (c.figma || {}).key || null }])).values()];
  return { vars, paints, textStyles, effects, mains };
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
/* One step on a number: a raw number one more; a number token the token of its collection nearest in value (the next
   larger first), so a bound value stays bound and only the value moves. undefined where neither. */
export function numberStep(v, cat) {
  if (typeof v === 'number') return v + 1;
  const t = cat.vars.get(v);
  if (!t || t.type !== 'number') return undefined;
  const others = [...cat.vars].filter(([, x]) => x.collection === t.collection && x.type === 'number' && x.value !== t.value);
  const up = others.filter(([, x]) => x.value > t.value).sort((a, b) => a[1].value - b[1].value)[0];
  const down = others.filter(([, x]) => x.value < t.value).sort((a, b) => b[1].value - a[1].value)[0];
  return (up || down || [])[0];
}
/* A field's one step: a number or number token as numberStep, the first that steps in a list (a border's four widths). */
const stepIn = (v, cat) => {
  if (!Array.isArray(v)) return numberStep(v, cat);
  const j = v.findIndex((x) => x !== 0 && numberStep(x, cat) !== undefined);
  return j < 0 ? undefined : v.map((x, i) => (i === j ? numberStep(x, cat) : x));
};
const flipWord = (v) => (v === true ? false : v === false ? true : v === 'true' ? 'false' : v === 'false' ? 'true' : v === 'True' ? 'False' : v === 'False' ? 'True' : undefined);

/* ---- where a mutation lands, and whether a row is there ---- */

/* A place: { el, field } a field of one element ('' its whole), or { el, subtree: true } the element and all it holds.
   A row is at a place where its element is that one (or, for a subtree, under it) and its field is that field, a part of
   it or what holds it (a row on `layout` for a change of `layout.gap`); an element's whole row is at every field of it. */
export function atPlace(at, places) {
  const dot = at.indexOf('.'), el = dot < 0 ? at : at.slice(0, dot), f = dot < 0 ? '' : at.slice(dot + 1);
  return places.some((p) => (p.subtree ? el === p.el || el.startsWith(`${p.el}/`)
    : el === p.el && (f === '' || f === p.field || f.startsWith(`${p.field}.`) || p.field.startsWith(`${f}.`))));
}
/* Caught: a row at the mutated place that the unmutated compare did not have (a new one, or one whose values moved).
   A component already red elsewhere is no catch: rows that change anywhere else are not counted. */
export function caughtAt(base, now, places) {
  const had = new Set(base.map((x) => JSON.stringify(x)));
  return now.some((x) => !had.has(JSON.stringify(x)) && atPlace(x.at, places));
}
/* A geometry row's place in contract words: its layer path, each layer by its id (layers.mjs camel), the variant dropped. */
export const geometryAt = (at) => { const slash = at.indexOf('/'), dot = at.indexOf('.'); if (slash < 0 || (dot >= 0 && dot < slash)) return `root${dot < 0 ? '' : at.slice(dot)}`; const rest = at.slice(slash + 1), d = rest.indexOf('.'); return `${(d < 0 ? rest : rest.slice(0, d)).split('/').map(camel).join('/')}${d < 0 ? '' : rest.slice(d)}`; };
/* A layer path (`Content > Icon`) as a contract id (`content/icon`): the variant itself is the root. */
// (a repeat keeps its number, `Item#2` → `item2`, as geometryAt says it: the third item is not the second's place)
export const idOfPath = (p) => (p ? p.split(' > ').map(camel).join('/') : 'root');

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
/* Every leaf a contract sets on an element: [id, path, value]; a list is one leaf. */
function leaves(c, reaches = () => true) {
  const out = [];
  const walk = (id, p, v) => { if (v && typeof v === 'object' && !Array.isArray(v)) { for (const [k, x] of Object.entries(v)) walk(id, [...p, k], x); } else if (p.length) out.push([id, p, v]); };
  const skip = new Set(['parent', 'order', 'name']);
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
  let changed = false, was, to;
  for (const s of sites(out, id, p)) { const v = f(s.get()); if (v !== undefined && JSON.stringify(v) !== JSON.stringify(s.get())) { if (!changed) { was = s.get(); to = v; } s.put(v); changed = true; } }
  return changed ? { contract: out, at: `${id}.${p.join('.')}: ${JSON.stringify(was)} → ${JSON.stringify(to)}`, places: [{ el: id, field: p.join('.') }] } : null;
}
/* A field kind: candidates by `test`, from a seeded start the first that `to` changes. */
function fieldIn(c, r, test, to, reaches) {
  const cands = leaves(c, reaches).filter(([id, p, v]) => test(id, p, v));
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

/* One mutation of `kind` on a contract: { contract (a copy), at (said), places (where a catch must show) }, or null
   where the kind has nothing to change. `reaches(when)`: whether a variant applies to a combination the compare holds
   (one that applies to none changes nothing compared, so it is never chosen). */
export function mutateContract(c, kind, { rng: r, catalogue: cat, reaches = () => true }) {
  const els = elementsOf({ ...c, variants: (c.variants || []).filter((v) => reaches(v.when)) });
  const field = (test, to) => fieldIn(c, r, test, to, reaches);
  const isRoot = (id) => !(els.get(id) || {}).parent;
  const pathIs = (...names) => (id, p) => names.includes(p.join('.'));
  if (kind === 'padding') return field((id, p) => p[0] === 'layout' && p[1] === 'padding' && p.length === 3, (v) => numberStep(v, cat));
  if (kind === 'gap') return field(pathIs('layout.gap'), (v) => numberStep(v, cat));
  if (kind === 'radius') return field((id, p) => p[0] === 'radius', (v) => stepIn(v, cat));
  if (kind === 'stroke') return field((id, p) => p[0] === 'border' && (p[1] === 'width' || p[1] === 'sides'), (v) => (v === 0 ? undefined : stepIn(v, cat))) || field(pathIs('border.color'), (v) => fillStep(v, cat));
  if (kind === 'sizing') return field(pathIs('width', 'height'), (v) => (v === 'hug' ? 'fill' : v === 'fill' ? 'hug' : numberStep(v, cat)));
  if (kind === 'token') {
    // a number's token first (a spacing, a radius); a colour's where the component has none
    const tokenAt = (type) => (id, p, v) => p[0] !== 'typography' && cat.vars.has(v) && cat.vars.get(v).type === type;
    return field(tokenAt('number'), (v, rr) => tokenSwap(v, cat, rr)) || field((id, p, v) => tokenAt('colour')(id, p, v) || tokenAt('other')(id, p, v), (v, rr) => tokenSwap(v, cat, rr));
  }
  if (kind === 'textStyle') return field((id, p, v) => p.join('.') === 'typography' && typeof v === 'string', (v, rr) => pick(rr, cat.textStyles.filter((t) => t !== v)));
  if (kind === 'fill') return field((id, p, v) => (p.join('.') === 'background' || p.join('.') === 'fillStyle') && typeof v === 'string', (v) => fillStep(v, cat));
  if (kind === 'text') return field((id, p, v) => p.join('.') === 'content' && typeof v === 'string', (v) => `${v} (mutated)`);
  if (kind === 'effect') return field((id, p, v) => p.join('.') === 'shadow' && cat.effects.includes(v), (v, rr) => pick(rr, cat.effects.filter((e) => e !== v)));
  if (kind === 'instanceProps') {
    // a placed instance's prop: a yes-or-no flipped, else another of its component's values, else other words
    return field((id, p) => p[0] === 'with' && p.length === 2 && (els.get(id) || {}).kind === 'instance', (v) => {
      if (flipWord(v) !== undefined) return flipWord(v);
      return typeof v === 'string' ? `${v} (mutated)` : undefined;
    });
  }
  if (kind === 'slot') {
    const ids = [...els].filter(([, e]) => e && e.kind === 'slot').map(([id]) => id).sort();
    if (!ids.length) return null;
    const id = ids[Math.floor(r() * ids.length)];
    return everywhere(c, id, ['kind'], () => 'container');
  }
  if (kind === 'instance') {
    const ids = [...els].filter(([, e]) => e && e.kind === 'instance' && typeof e.component === 'string').map(([id]) => id).sort();
    if (!ids.length) return null;
    const id = ids[Math.floor(r() * ids.length)], was = els.get(id).component;
    const other = pick(r, cat.mains.filter((m) => m.component.toLowerCase() !== String(was).toLowerCase()));
    if (!other) return null;
    const m = everywhere(c, id, ['component'], () => other.component);
    if (m && other.key) for (const s of sites(m.contract, id, ['key'])) s.put(other.key);
    return m;
  }
  if (kind === 'order') {
    // two neighbours of one box trade places
    const kids = new Map();
    for (const [id, e] of Object.entries(c.anatomy || {})) if (e && e.parent && typeof e.order === 'number') kids.set(e.parent, [...(kids.get(e.parent) || []), id]);
    const pairs = [...kids.values()].flatMap((ids) => { const s = ids.sort((a, b) => c.anatomy[a].order - c.anatomy[b].order); return s.slice(1).map((b, i) => [s[i], b]); }).sort();
    if (!pairs.length) return null;
    const [a, b] = pairs[Math.floor(r() * pairs.length)], oa = c.anatomy[a].order, ob = c.anatomy[b].order, out = copy(c);
    for (const s of sites(out, a, ['order'])) s.put(ob);
    for (const s of sites(out, b, ['order'])) s.put(oa);
    return { contract: out, at: `${a} and ${b} trade places`, places: [{ el: a, field: 'order' }, { el: b, field: 'order' }] };
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
    return { contract: out, at: id, places: [{ el: id, subtree: true }] };
  }
  if (kind === 'visibility') {
    // one variant hides a part the base draws, with what it holds
    const base = new Map(Object.entries(c.anatomy || {}));
    const pairs = (c.variants || []).flatMap((v, i) => (!reaches(v.when) ? [] : [...base.keys()]).filter((id) => !isRoot(id) && !(v.remove || []).includes(id) && !(v.add || {})[id]).map((id) => [i, id]));
    if (!pairs.length) return null;
    const [i, id] = pairs[Math.floor(r() * pairs.length)], out = copy(c), v = out.variants[i];
    v.remove = [...new Set([...(v.remove || []), ...descendants(base, id)])];
    return { contract: out, at: `${id} hidden at ${JSON.stringify(v.when || {})}`, places: [{ el: id, subtree: true }] };
  }
  throw new Error(`no mutation kind ${kind}`);
}

/* ---- a stored figma.json (the drawing as the walk reads it) ---- */

const { layerPaths, resolve } = req('../snapshot/spec.cjs');
const nodesOf = (v) => { const m = new Map([['', v]]); layerPaths(v, (node, p) => { m.set(p, node); }); return m; };
/* Change every node at one layer path (every variant that has it); null where nothing changed. */
function atPath(spec, p, f) {
  const out = { ...copy(spec), variants: copy(spec.variants) };
  let changed = false;
  for (const v of out.variants) { const n = nodesOf(v).get(p); if (n && f(n, v)) changed = true; }
  return changed ? out : null;
}
const parentOf = (v, p) => (p.includes(' > ') ? nodesOf(v).get(p.slice(0, p.lastIndexOf(' > '))) : v);
/* A bound number one step: its token's neighbour in value and that token's value; an unbound one, one more. A bound
   value whose token has no neighbour is left alone (undefined). */
const boundStep = (n, k, j, cat) => {
  const b = n.bindings && n.bindings[k], bound = Array.isArray(b) ? b[j] : j == null ? b : undefined;
  if (bound == null) return { value: (j == null ? n[k] : n[k][j]) + 1 };
  const to = numberStep(bound, cat);
  return to === undefined ? undefined : { value: cat.vars.get(to).value, binding: to };
};
const putStep = (n, k, j, s) => {
  if (j == null) n[k] = s.value; else n[k] = n[k].map((x, i) => (i === j ? s.value : x));
  if (s.binding) n.bindings[k] = j == null ? s.binding : n.bindings[k].map((x, i) => (i === j ? s.binding : x));
  return true;
};

/* One mutation of `kind` on a stored spec (compact or full): { spec (full), at, places }, or null. */
export function mutateSpec(stored, kind, { rng: r, catalogue: cat }) {
  const spec = resolve(copy(stored));
  const paths = [...new Set(spec.variants.flatMap((v) => [...nodesOf(v).keys()]))].sort();
  // a place in contract words, for the contract rows, and in the walk's for geometry's (geometryAt maps those)
  const place = (p, f) => [{ el: idOfPath(p), field: f }];
  const first = (test, change, label, f = label) => {
    const cands = paths.filter((p) => spec.variants.some((v) => { const n = nodesOf(v).get(p); return n && test(n, p); }));
    const start = Math.floor(r() * cands.length);
    for (let i = 0; i < cands.length; i++) {
      const p = cands[(start + i) % cands.length];
      const out = atPath(spec, p, (n) => test(n, p) && change(n));
      if (out) return { spec: out, at: `${p || '(variant)'}.${label}`, places: [...place(p, f), ...place(p, label)] };
    }
    return null;
  };
  const numeric = (k, j = null) => (n) => (j == null ? typeof n[k] === 'number' : Array.isArray(n[k]) && typeof n[k][j] === 'number') && !!boundStep(n, k, j, cat);
  const stepped = (k, j = null) => (n) => putStep(n, k, j, boundStep(n, k, j, cat));
  if (kind === 'padding') return first((n) => numeric('pad', 0)(n) && n.layout && n.layout !== 'NONE', stepped('pad', 0), 'pad', 'layout.padding');
  if (kind === 'gap') return first((n) => numeric('gap')(n) && n.layout && n.layout !== 'NONE', stepped('gap'), 'gap', 'layout.gap');
  if (kind === 'radius') return first(numeric('radius'), stepped('radius'), 'radius');
  if (kind === 'stroke') {
    return first(numeric('strokeWeight'), stepped('strokeWeight'), 'strokeWeight', 'border')
      || first((n) => Array.isArray(n.strokeSides) && n.strokeSides.some((x) => x > 0), (n) => { const j = n.strokeSides.findIndex((x) => x > 0); n.strokeSides = n.strokeSides.map((x, i) => (i === j ? x + 1 : x)); return true; }, 'strokeSides', 'border');
  }
  if (kind === 'sizing') return first((n) => typeof n.w === 'number' && /^FIXED/.test(n.sizing || ''), (n) => { n.w += 1; return true; }, 'w', 'width');
  if (kind === 'token') {
    const swap = (n) => { for (const k of Object.keys(n.bindings || {}).sort()) { const b = n.bindings[k]; if (typeof b === 'string' && tokenSwap(b, cat, r)) { n.bindings[k] = tokenSwap(b, cat, rng(hash(b))); return true; } if (Array.isArray(b)) { const j = b.findIndex((x) => typeof x === 'string' && tokenSwap(x, cat, r)); if (j >= 0) { n.bindings[k] = b.map((x, i) => (i === j ? tokenSwap(x, cat, rng(hash(x))) : x)); return true; } } } return false; };
    const has = (n) => Object.values(n.bindings || {}).some((b) => (Array.isArray(b) ? b : [b]).some((x) => typeof x === 'string' && cat.vars.has(x)));
    return first(has, swap, 'bindings', '')
      || first((n) => (n.fills || []).some((x) => typeof x === 'string' && cat.vars.has(x)), (n) => { const j = n.fills.findIndex((x) => typeof x === 'string' && cat.vars.has(x)); const to = tokenSwap(n.fills[j], cat, rng(hash(n.fills[j]))); if (!to) return false; n.fills = n.fills.map((x, i) => (i === j ? to : x)); return true; }, 'fills', 'background');
  }
  if (kind === 'textStyle') return first((n) => typeof n.textStyle === 'string' && n.textStyle !== 'literal', (n) => { const to = pick(rng(hash(n.textStyle)), cat.textStyles.filter((t) => t !== n.textStyle)); if (!to) return false; n.textStyle = to; return true; }, 'textStyle', 'typography');
  if (kind === 'fill') {
    return first((n) => (n.fills || []).some((x) => fillStep(x, cat)), (n) => { const j = n.fills.findIndex((x) => fillStep(x, cat)); n.fills = n.fills.map((x, i) => (i === j ? fillStep(x, cat) : x)); return true; }, 'fills', 'background')
      || first((n) => typeof n.fillStyle === 'string' && fillStep(n.fillStyle, cat), (n) => { n.fillStyle = fillStep(n.fillStyle, cat); return true; }, 'fillStyle');
  }
  if (kind === 'text') return first((n) => typeof n.text === 'string', (n) => { n.text = `${n.text} (mutated)`; return true; }, 'text', 'content');
  if (kind === 'effect') return first((n) => typeof n.effect === 'string' && cat.effects.includes(n.effect), (n) => { const to = pick(rng(hash(n.effect)), cat.effects.filter((e) => e !== n.effect)); if (!to) return false; n.effect = to; return true; }, 'effect', 'shadow');
  if (kind === 'instanceProps') {
    return first((n) => n.type === 'INSTANCE' && n.props && Object.keys(n.props).length > 0, (n) => {
      const k = Object.keys(n.props).sort()[0], v = n.props[k];
      n.props = { ...n.props, [k]: flipWord(v) ?? (typeof v === 'string' ? `${v} (mutated)` : v) };
      return JSON.stringify(n.props[k]) !== JSON.stringify(v);
    }, 'props', 'with');
  }
  if (kind === 'slot') return first((n) => n.type === 'SLOT', (n) => { n.type = 'FRAME'; return true; }, 'type', 'kind');
  if (kind === 'instance') {
    const set = (s) => String(s).split(' / ')[0].toLowerCase();
    return first((n) => n.type === 'INSTANCE' && typeof n.instanceOf === 'string', (n) => {
      const other = pick(rng(hash(n.instanceOf)), cat.mains.filter((m) => m.component.toLowerCase() !== set(n.instanceOf)));
      if (!other) return false;
      n.instanceOf = other.component; if (other.key) n.instanceOfKey = other.key; return true;
    }, 'instanceOf', 'component');
  }
  if (kind === 'order') {
    // two neighbours trade places: their order in the box and where each is drawn (two of one name trading places is
    // no change the walk could see, so never chosen)
    const pairAt = (n) => (n.children || []).findIndex((x, i, a) => i + 1 < a.length && x.name !== a[i + 1].name);
    const cands = paths.filter((p) => spec.variants.some((v) => pairAt(nodesOf(v).get(p) || {}) >= 0));
    if (!cands.length) return null;
    const p = cands[Math.floor(r() * cands.length)];
    let names = null;
    const out = atPath(spec, p, (n) => {
      const j = pairAt(n);
      if (j < 0) return false;
      const a = n.children[j], b = n.children[j + 1];
      names ||= [a.name, b.name];
      for (const k of ['x', 'y', 'index']) [a[k], b[k]] = [b[k], a[k]];
      n.children = [...n.children.slice(0, j), b, a, ...n.children.slice(j + 2)];
      return true;
    });
    const kid = (name) => `${p ? `${p} > ` : ''}${name}`;
    return out && { spec: out, at: `${p || '(variant)'}: ${names.join(' and ')} trade places`, places: names.flatMap((x) => [{ el: idOfPath(kid(x)), subtree: true }]) };
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
    return { spec: out, at: kind === 'visibility' ? `${p} hidden in ${out.variants[only].name}` : p, places: [{ el: idOfPath(p), subtree: true }] };
  }
  throw new Error(`no mutation kind ${kind}`);
}

/* ---- each leg's compare, as eval.mjs measure() and to-figma --verify run it ---- */

/* The browser, self and second legs: roundTrip, then what is left to code apart (`split`, the self and second legs).
   `held`: the side the reading is held to (the contract; for the second leg the first reading, with the contract's
   invalid combinations), `contract`: the official one, for what is left to code. */
export function compareContract(held, reading, { mains = null, settings, split = false, ownSheet = true, contract = held, pointerFrom = null } = {}) {
  const r = roundTrip(held, reading, { mains, layoutUnit: true, ...(pointerFrom && { pointerFrom }) });
  if (!split) return { rows: r.rows, left: [] };
  const isLeft = leftToCode(contract, mains, settings, { ownSheet });
  return { rows: r.rows.filter((x) => !isLeft(x.at, x)), left: r.rows.filter((x) => isLeft(x.at, x)) };
}
/* The Figma leg: to-figma --verify's own compare (heldToLibrary), its contract rows and its geometry rows, the geometry
   rows' places said in contract words (geometryAt) so one place check reads both. */
export function compareFigma(held, snap, drawn, ctx) {
  const { rt, geo } = heldToLibrary(held, drawn, snap, ctx);
  return { rows: [...rt.rows, ...(geo || []).map((x) => ({ ...x, at: geometryAt(x.at), geometry: x.at }))], left: [] };
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

/* ---- the run ---- */

const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };

/* Every leg's mutations over a sample of a project's components: [{ leg, folder, kind, at?, outcome, why? }], outcome
   caught | missed | left (its row at the place went to what is left to code) | none (the kind has nothing to change
   there) | dropped (each change drawn reached no combination compared) | error (with no kind: the unmutated compare
   threw, the component not measured) | unread (no reading on that leg). Deterministic for a seed. */
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
  const { compact } = req('../snapshot/spec.cjs');
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
    // (the library's own contract.json, as --verify holds the drawing to it, beside its figma.json)
    figma: (folder) => { const s = read(path.join(where.paths.components, folder, 'figma.json')), c = read(path.join(where.paths.components, folder, 'contract.json')); return s && c && { stored: s, held: c }; },
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
        side = resolve(copy(input.stored));
        const ctx = { names, deriveOptions: deriveOptionsFor(folder), mains, known: knownFor(folder, input.stored) };
        compare = (drawn) => compareFigma(input.held, input.stored, drawn, ctx);
        apply = (kind, rr) => { const m = mutateSpec(side, kind, { rng: rr, catalogue: cat }); return m && { side: m.spec, at: m.at, places: m.places }; };
      } else {
        const opts = { mains, settings: settingsOf(folder), split: leg !== 'browser', contract, ...(leg === 'second' && { ownSheet: false, pointerFrom: contract }) };
        const held = leg === 'second' ? { ...input.first, invalid: contract.invalid } : contract;
        compare = (reading) => compareContract(held, reading, opts);
        const reaches = reachesOf(held, input.reading);
        // (a mutation that changes no combination compared is drawn again, up to four times, then said dropped)
        side = input.reading;
        apply = (kind, rr) => {
          let any = false;
          for (let i = 0; i < 4; i++) { const m = mutateContract(side, kind, { rng: rr, catalogue: cat, reaches }); if (!m) break; any = true; if (reachesAny(side, m.contract, reaches.combos)) return { side: m.contract, at: m.at, places: m.places }; }
          return any ? 'dropped' : null;
        };
      }
      let base;
      try { base = compare(side); } catch (e) { out.push({ leg, folder, outcome: 'error', why: `the unmutated compare threw: ${e.message}` }); continue; }
      for (const kind of kinds) {
        let m;
        try { m = apply(kind, rng(seed ^ hash(`${folder}\0${kind}`))); } catch (e) { out.push({ leg, folder, kind, outcome: 'error', why: `the mutation threw: ${e.message}` }); continue; }
        if (!m || m === 'dropped') { out.push({ leg, folder, kind, outcome: m || 'none' }); continue; }
        let now;
        try { now = compare(m.side); } catch (e) { out.push({ leg, folder, kind, at: m.at, outcome: 'error', why: `the compare threw: ${e.message}` }); continue; }
        const outcome = caughtAt(base.rows, now.rows, m.places) ? 'caught' : caughtAt(base.left, now.left, m.places) ? 'left' : 'missed';
        out.push({ leg, folder, kind, at: m.at, outcome });
      }
    }
  }
  return out;
}

/* Per leg and kind, how many applied and how many were caught; every one not caught, with its place; and what was not
   measured: components whose compare threw, kinds with nothing to change, changes dropped as reaching nothing. */
export function summary(results) {
  const legs = {}, missed = [];
  for (const x of results) {
    const l = (legs[x.leg] ||= { kinds: {}, n: 0, caught: 0, errored: 0, none: 0, dropped: 0 });
    if (x.outcome === 'unread') { l.unread = true; continue; }
    if (!x.kind) { l.errored++; continue; }
    if (x.outcome === 'none' || x.outcome === 'dropped') { l[x.outcome]++; continue; }
    const k = (l.kinds[x.kind] ||= { n: 0, caught: 0 });
    k.n++; l.n++;
    if (x.outcome === 'caught') { k.caught++; l.caught++; } else missed.push(x);
  }
  return { legs, missed, errors: results.filter((x) => x.outcome === 'error' && !x.kind) };
}
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '—');
/* The kinds under the floor, per leg: [`<leg> <kind> 7/10`]; a kind applied fewer than FLOOR_MIN times is not held. */
export function belowFloor(s, floor = FLOOR, min = FLOOR_MIN) {
  return Object.entries(s.legs).flatMap(([leg, l]) => Object.entries(l.kinds).filter(([, k]) => k.n >= min && k.caught / k.n < floor).map(([kind, k]) => `${leg} ${SAID[kind]} ${k.caught}/${k.n}`));
}

/* The report: one line per leg, a table of kinds by leg, what was not measured, then every mutation that passed unseen.
   The Figma leg is said for what it is: the stored figma.json stands in for the walk's reading of a drawing. */
export function lines(label, s, { seed, sample } = {}) {
  const legs = LEGS.filter((l) => s.legs[l]);
  const said = (l) => (l === 'figma' ? 'figma (stored only: the drawer and the walk are untested)' : l);
  const out = [`${label} comparer${seed != null ? ` (mutations, seed ${seed}, ${sample} per leg)` : ''}: ${legs.map((l) => (s.legs[l].unread ? `${l}: no readings` : `${said(l)} ${s.legs[l].caught} of ${s.legs[l].n} caught (${pct(s.legs[l].caught, s.legs[l].n)})`)).join(' · ')}`];
  const measured = legs.filter((l) => !s.legs[l].unread);
  if (measured.length) {
    out.push(`  ${'kind'.padEnd(20)}${measured.map((l) => l.padStart(10)).join('')}`);
    for (const k of KINDS) out.push(`  ${SAID[k].padEnd(20)}${measured.map((l) => { const x = s.legs[l].kinds[k]; return (x ? `${x.caught}/${x.n}` : '—').padStart(10); }).join('')}`);
    out.push(`  not measured: ${measured.map((l) => `${l} ${s.legs[l].errored} component(s) errored, ${s.legs[l].none} kind(s) with no target, ${s.legs[l].dropped} dropped as reaching nothing`).join('; ')}`);
  }
  for (const e of s.errors) out.push(`  error: ${e.leg} ${e.folder}: ${e.why}`);
  if (s.missed.length) out.push(`  undetected (${s.missed.length}):`);
  for (const x of s.missed) out.push(`    ${x.leg} ${SAID[x.kind]} ${x.folder}: ${x.at}${x.outcome === 'left' ? ' (left to code)' : x.outcome === 'error' ? ` (${x.why})` : ''}`);
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const check = argv.includes('--check');
  const label = opt('--project'), sample = +(opt('--sample') || 10), seed = +(opt('--seed') || 1), legs = (opt('--legs') || LEGS.join(',')).split(',');
  if (!label || !(sample > 0) || !Number.isInteger(seed) || legs.some((l) => !LEGS.includes(l))) { console.error(`usage: mutate.mjs --project <label> [--sample N] [--seed S] [--legs ${LEGS.join(',')}] [--check]`); process.exit(2); }
  const where = req('../snapshot/projects.cjs').layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  const s = summary(runMutations(where, { sample, seed, legs }));
  for (const l of lines(label, s, { seed, sample })) console.log(l);
  const low = belowFloor(s);
  if (check && low.length) { console.log(`under the floor (${Math.round(FLOOR * 100)}% of a kind caught, where it applied ${FLOOR_MIN} times or more): ${low.join('; ')}`); process.exit(1); }
}
