/*
 * The Figma leg's geometry: the drawn set as the snapshot's walk reads it, held to the library's stored figma.json,
 * per variant and per layer path. The contract compare sees only what derive keeps; a layer moved, doubled, resized or
 * laid out the other way, a variant out of its place and a set of another size are what it drops, so a drawing that
 * looked broken came out "the same" (2026-11-23). Rows are `{ at, library, drawn, why? }` (why: a known reason, such as a vector past the walk's cap drawn as its box), eval's mechanisms() ranks them:
 *
 *   <variant>.<field>             a variant's own field (its size, layout, place in the set)
 *   <variant>/<layer>/….<field>   a layer's field, the path as spec.cjs's layerPaths names it, `/` between layers
 *   <variant>/<layer>/…           a layer only one side has, its side `{ kind: <type> }`
 *   <variant>                     a variant only one side has
 *   <set>.set                     the set's size
 *
 * Variants are matched by their sorted axis values (the drawing names axes in the house's order); every difference is
 * its own row, never deduped. A number is the same within TOLERANCE, parity's comparison (schema.mjs near) at the
 * walk's rounding step; everything else exactly. What a layer paints past its box is not read by the walk, so not here.
 */
import { createRequire } from 'node:module';
import { near } from '../parity/schema.mjs';

const req = createRequire(import.meta.url);
const { resolve, layerPaths } = req('../snapshot/spec.cjs');
const { knownFor } = req('../snapshot/store.cjs');

/* The walk keeps two decimals (code.js round()): one value read twice can land a step apart across a rounding edge. */
export const TOLERANCE = 0.01;
// how the store finds things, as specNotes ignores them, and what a row's place already says
const IDS = new Set(['id', 'key', 'instanceOfId', 'instanceOfKey', 'index', 'name', 'children',
  // an instance's overrides: the fields Figma marks as touched, names only, no values (code.js); a value set equal to
  // the main's still marks one, and every value it could hide is compared on its own field (parity's adapt.mjs agrees)
  'overrides']);
// (a row's place is read by `/` and `.`: a name holding them keeps one segment)
const seg = (s) => String(s).replace(/[/.]/g, '_');
// (a single component's own name leads its flipped variants', `_Badge, Dot=false`, and the drawing's is the contract's:
// only the axes count)
const axes = (name) => String(name).split(',').map((s) => s.trim()).filter((s) => s.includes('=')).sort().join(', ');

const same = (a, b, tol) => {
  if (typeof a === 'number' && typeof b === 'number') return near(a, b, tol + 1e-9);
  if (a && b && typeof a === 'object' && typeof b === 'object') return Array.isArray(a) === Array.isArray(b) && [...new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => same(a[k], b[k], tol));
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
};

/* The fields to compare, as the store's grade picks them (knownFor): every one where the library's snapshot was taken by
   the walk's own release, since the walk leaves a default out and a field no library layer sets is recorded nowhere;
   else only those it records anywhere. tokens: the snapshot's tokens file (its _meta), specs: { folder: spec }. */
export const knownOf = (tokens, specs, walkVersion) => knownFor({ tokens, specs }, { tokens: { _meta: { plugin: walkVersion } } });

/* library, drawn: specs as figma.json holds them (compact or full). known: the fields the library's snapshot recorded
   anywhere (knownOf), so one an older plugin never recorded is not a row; null, every field. */
export function geometry(library, drawn, { known = null, tolerance = TOLERANCE } = {}) {
  const rows = [];
  const row = (at, l, d, why) => rows.push({ at, library: l ?? null, drawn: d ?? null, ...(why && { why }) });
  // (a loose vector the walk recorded an outline for and no paths, past its cap: the drawing had only its box to draw)
  const fields = (x, y, at, loose = false) => {
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (IDS.has(k) || (known && !known.has(k) && x[k] === undefined)) continue;
      if (k === 'bindings') {
        const bx = x.bindings || {}, by = y.bindings || {};
        for (const b of new Set([...Object.keys(bx), ...Object.keys(by)])) if (!(known && !known.has(`bindings.${b}`) && bx[b] === undefined) && !same(bx[b], by[b], tolerance)) row(`${at}.bindings.${b}`, bx[b], by[b]);
      } else if (!same(x[k], y[k], tolerance)) row(`${at}.${k}`, x[k], y[k], (k === 'outline' || k === 'paths') && loose && x.type === 'VECTOR' && x.outline && !x.paths ? 'paths past the walk\'s cap: drawn as its box' : undefined);
    }
  };
  const paths = (v) => { const m = new Map(); layerPaths(v, (node, p) => { m.set(p, node); }); return m; };
  const at = (vk, p) => `${vk}/${p.split(' > ').map(seg).join('/')}`;
  const lv = resolve(library).variants || [], dv = resolve(drawn).variants || [];
  const byAxes = new Map(dv.map((v) => [axes(v.name), v]));
  // (a single component, or a set of one, is its one variant whatever each side names it)
  const one = lv.length === 1 && dv.length === 1;
  const met = new Set();
  for (const a of lv) {
    const vk = seg(axes(a.name) || a.name), b = one ? dv[0] : byAxes.get(axes(a.name));
    if (!b) { row(vk, { kind: 'variant' }, null); continue; }
    met.add(b);
    fields(a, b, vk);
    const pa = paths(a), pb = paths(b);
    // (a layer inside an instance is its component's drawing: no paths recorded there, by design)
    const loose = (p) => !p.split(' > ').slice(0, -1).some((_, i, s) => (pa.get(s.slice(0, i + 1).join(' > ')) || {}).type === 'INSTANCE');
    for (const [p, x] of pa) { const y = pb.get(p); if (!y) row(at(vk, p), { kind: x.type }, null); else fields(x, y, at(vk, p), loose(p)); }
    for (const [p, y] of pb) if (!pa.has(p)) row(at(vk, p), null, { kind: y.type });
  }
  for (const b of dv) if (!met.has(b)) row(seg(axes(b.name) || b.name), null, { kind: 'variant' });
  // (an older snapshot never recorded the set's size: nothing to hold the drawing to)
  if (library.set && !same(library.set, drawn.set, tolerance)) row(`${seg(library.name)}.set`, library.set, drawn.set);
  return rows;
}
