#!/usr/bin/env node
/*
 * tools/component-contract/to-figma.mjs — a component contract drawn as a Figma
 * component set, in the house's conventions. The last step of
 * code → contract (from-code.mjs) → conventions (asFigma) → Figma.
 *
 *   node tools/component-contract/to-figma.mjs <contract> <keys.json>  > plugin.js
 *   node tools/component-contract/to-figma.mjs <contract> --run --project <label> --into <scratch fileKey>
 *   node tools/component-contract/to-figma.mjs <contract> --verify --project <label> --into <scratch fileKey>
 *
 * prints plugin code for the Desktop Bridge, or runs it through the project's
 * docs service (figma-audit services.mjs): the set drawn on a page of the
 * component's own name in the scratch file, one drawing at a time. Keys come
 * from the snapshot (text styles, the components it places); what it lacks
 * is looked up by name in the library file (LOOKUP); `keys.json` names them
 * when the code is only printed. `--verify` reads the drawing back and holds
 * it to the contract.
 *
 *   plan(contract) → { name, axes, booleans, text, variants }
 *
 * A Figma boolean can only show or hide a layer, so a prop whose layer
 * changes anything else (a padding, a colour) is a variant axis, True/False;
 * one that only adds or removes layers (and the order they leave) is a
 * boolean bound to their visibility. Every enum is an axis. Each variant is
 * expand() at its axis values with every boolean on, so every layer exists
 * to be shown or hidden. A graphic is an instance of the library's Icon
 * container at its size, its swap set to the icon the code names (rule:
 * the house's icons are Icon container instances); its exposed props are
 * the component's (Figma's nested instance properties).
 *
 * What is drawn and what still differs from the library it came from is the
 * README's account (held to it on 2026-10-20 over one library's 63 components).
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { partName, figmaWord, camel, sentence, variantDefaults, bareProp, keyMatches } from './layers.mjs';
import { parseColour } from '../parity/values.mjs';
import { ALIGN_DATA, SIZE_ROWS, centreOffset, heldOpacity, heldGlyph, looksLikeValue } from './rules.mjs';
import { variantValues } from '../shared/names.js';
import { turnedParts } from './to-code.mjs';

import { realpathSync } from 'node:fs';
const req = createRequire(import.meta.url);
const { nameOf } = req('../snapshot/graph.cjs');
const { expand } = req('./derive.cjs');

// a slot's layer is named as its prop is in Figma: Figma names the slot property after it
const slotName = (e, props) => { const ref = e.kind === 'slot' && typeof e.content === 'string' && /^\{(.+)\}$/.exec(e.content); return ref ? (props[ref[1]] || {}).figma ?? null : null; };

/* A drawing from code held to the library's own component: each combination the library draws (its enums and booleans,
   every one: 1,440 take 0.1 s; a caller's `limit` cuts them, and the cut is said), expanded from both contracts and compared field by field, so how a contract is worded (its default,
   its order of values) does not count and what a variant draws does; then the props' names and kinds and the
   component's name. Rows: { at, library, drawn, in } where `in` counts the combinations it differs in. */
/* A root that fills the room it is given is, in the room it was drawn or read in, that room's width (a ruling: a
   Figma component's own frame has no parent to fill, so a fixed width is how Figma says what code says as a fill
   of its container, and from-code reads the code in a room as wide as Figma's). Compared as that length. */
function room(x) {
  const r = x && x.root;
  if (!r || !r.canvas) return x;
  const canvas = { ...r.canvas }, root = { ...r };
  for (const k of ['width', 'height']) if (root[k] === 'fill' && typeof canvas[k] === 'number') { root[k] = canvas[k]; delete canvas[k]; }
  if (Object.keys(canvas).length) root.canvas = canvas; else delete root.canvas;
  return { ...x, root };
}

/* A placed part's position by what pins it: Figma stores x, y, end and bottom for every part, but only the pinned
   edge is a value: pinned to the far edge (max), the distance to it, x or y following from the parent's size; to the
   near edge (min), the distance from it. Centred in a parent that hugs, the offset follows from what the parent holds
   (a spinner over a button's words): no value; in a parent of fixed size, or one that fills, its near offset stays (its
   far one, which derive writes so code can centre it, follows from the sizes). Where the sides pin an axis
   differently, the constraints row is the difference and that axis's offsets are not repeated. Tested by
   test-to-figma.mjs. */
// (`design`: x is a design's, on Figma's pixel grid: centreOffset)
function pinned(x, other, design) {
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) {
    if (!e || !e.absolute || !e.constraints) continue;
    const at = { ...e.absolute }, up = x[e.parent] || {}, theirs = ((other[id] || {}).constraints) || {};
    for (const [to, near, far, size, ax] of [[e.constraints.horizontal, 'x', 'end', 'width', 'horizontal'], [e.constraints.vertical, 'y', 'bottom', 'height', 'vertical']]) {
      if (theirs[ax] !== to) { delete at[near]; delete at[far]; }
      else if (to === 'max') delete at[near];
      else if (to === 'min') delete at[far];
      else if (to === 'center' && (up[size] === 'hug' || up[size] === undefined)) { delete at[near]; delete at[far]; }
      // centred, what the constraint keeps is its centre's distance from the parent's, (near - far) / 2, where both sides
      // say both edges (derive writes them, from-code reads them): x alone moves with any width either box renders at;
      // else the near offset, its far one following from it and the sizes (one difference, one row)
      else if (to === 'center') {
        const num = (a) => !!a && typeof a[near] === 'number' && typeof a[far] === 'number';
        if (num(at) && num((other[id] || {}).absolute)) {
          at[`${near}FromCentre`] = design ? centreOffset(at[near], at[far]) : +((at[near] - at[far]) / 2).toFixed(2);
          // and the room about it, near + far (its parent's size less its own), where no other row says that difference:
          // neither its own size nor its parent's differs as written (a 24 icon centred alike in a state layer that fills,
          // 40 tall in Figma, 44 in code); a size that differs is that size's row alone
          const said = (a, b) => a !== undefined && b !== undefined && JSON.stringify(a) !== JSON.stringify(b);
          // (where both sizes are numbers on both sides and the same, they fix the room: nothing it could add)
          const fixed = [e, up, other[id], other[e.parent]].every((x) => typeof (x || {})[size] === 'number');
          if (!fixed && !said(e[size], (other[id] || {})[size]) && !said(up[size], (other[e.parent] || {})[size])) at[`${near}Room`] = +(at[near] + at[far]).toFixed(2);
          delete at[near];
        }
        delete at[far];
      }
    }
    out[id] = { ...e, absolute: at };
  }
  return out;
}

/* An icon's colour, said two ways: Figma colours the one glyph inside an instance (Icon/house's vector), code colours
   the instance (an svg filled with currentColor). Compared as the instance's: the glyph's colour moves up to an
   instance that has none, and the glyph, whose shape is its component's, goes. Only where the instance holds that one
   graphic and nothing else. Its opacity goes up with it, times the instance's own (rules.mjs heldOpacity). */
function glyph(x) {
  if (!x) return x;
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) {
    if (!e || e.kind !== 'instance') continue;
    const inside = Object.keys(x).filter((k) => k.startsWith(`${id}/`));
    const kid = inside.length === 1 && x[inside[0]].parent === id ? x[inside[0]] : null;
    // only a colour (and its opacity) moves up: a glyph that also overrides its size, or an instance with a colour of its own, is compared as it is (rules.mjs heldGlyph)
    if (!heldGlyph(e, kid, !!kid)) continue;
    const opacity = heldOpacity(e, kid);
    out[id] = { ...e, background: kid.background, ...(kid.fillStyle && { fillStyle: kid.fillStyle }), ...(opacity !== undefined && { opacity }) };
    delete out[inside[0]];
  }
  return out;
}


/* A line's stroke (a shape no wide or no tall, a divider): Figma draws it whatever its alignment, and code draws the one
   edge (css.mjs), so the alignment shows nowhere and is said by neither: compared without it. */
function line(x) {
  if (!x) return x;
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) {
    if (!e || e.kind !== 'graphic' || !(e.width === 0 || e.height === 0) || !e.border || e.border.align == null) continue;
    const { align: _, ...border } = e.border;
    out[id] = { ...e, border };
  }
  return out;
}

/* A stroke outside or across its edge: Figma lays it out as an outline, out of the layout, whatever the frame's
   "include stroke in layout" says (help.figma.com, "Use auto layout with CSS Flexbox in mind"; only an inside stroke
   takes room), so its inLayout shows nowhere: compared without it. */
function outer(x) {
  if (!x) return x;
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) {
    if (!e || !e.border || !e.border.inLayout || !['outside', 'center'].includes(e.border.align)) continue;
    const { inLayout: _, ...border } = e.border;
    out[id] = { ...e, border };
  }
  return out;
}

/* A dash said two ways: the design's pattern ([2, 2]), and code's dashed outline, whose length CSS does not state (the
   user's ruling, 2026-11-17): compared as dashed or not. */
// the page a drawing goes on: the component's name, or in the library's own file (where a page of that name is the
// library's own, which a drawing must never touch) that name marked as the round trip's. Every reader of a drawing asks
// this, never the bare name
export const drawingPage = (name, own) => (own ? `Round trip · ${name}` : name);

export function dashes(x) {
  if (!x) return x;
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) if (e && e.border && e.border.dash) out[id] = { ...e, border: { ...e.border, dash: 'dashed' } };
  return out;
}

/* An arc said two ways: Figma keeps its angles as drawn (a ring's track 0 to 360, an arc from -90 or past 360), code
   keeps where it starts on the turn and how far it sweeps: compared as that, its end its start and sweep, a whole
   turn 360. */
const turnOf = (a) => +((((a % 360) + 360) % 360).toFixed(2));
export function arcs(x) {
  if (!x) return x;
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) {
    if (!e || !e.arc) continue;
    const start = turnOf(e.arc.start), sweep = turnOf(e.arc.end - e.arc.start) || 360;
    out[id] = { ...e, arc: { ...e.arc, start, end: +(start + sweep).toFixed(2) } };
  }
  return out;
}

/* A paint said two ways: a raw colour in either notation (rgb(255 255 255 / 0.9), rgba(255, 255, 255, 0.9)) is one
   colour, written one way; a linear gradient that states its angle is that angle, its transform (Figma's matrix,
   scaled by the box it was drawn in) said by it. */
function paint(x) {
  if (!x) return x;
  const one = (v) => {
    if (typeof v === 'string') { if (!/^rgba?\(/i.test(v)) return v; const c = parseColour(v); return c ? `rgb(${c[0]} ${c[1]} ${c[2]} / ${+(+c[3]).toFixed(3)})` : v; }
    if (Array.isArray(v)) return v.map(one);
    if (v && typeof v === 'object') {
      const o = Object.fromEntries(Object.entries(v).map(([k, w]) => [k, one(w)]));
      if (o.type === 'GRADIENT_LINEAR' && o.angle != null) delete o.transform;
      return o;
    }
    return v;
  };
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) if (e && e.background != null) out[id] = { ...e, background: one(e.background) };
  return out;
}

/* A text's words with a space at either end: HTML collapses it (css-text-3 §4.1.1, white-space: normal), so code shows
   the words alone. Compared trimmed, on both sides; a space inside the words still counts. */
function words(x) {
  if (!x) return x;
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) if (e && e.kind === 'text' && typeof e.content === 'string' && e.content !== e.content.trim()) out[id] = { ...e, content: e.content.trim() };
  return out;
}


/* An icon's size, said two ways: Figma takes the variant of its set at that size (with Size "20"), code sets the width
   (20). Compared as the size: a `Size` that is the instance's own width and height goes, so the width says it. */
function iconSize(x) {
  if (!x) return x;
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) {
    if (!e || e.kind !== 'instance' || !e.with || e.with.Size === undefined || String(e.width) !== String(e.with.Size) || String(e.height) !== String(e.with.Size)) continue;
    const { Size, ...rest } = e.with;
    const { with: _, ...bare } = e;
    out[id] = Object.keys(rest).length ? { ...bare, with: rest } : bare;
  }
  return out;
}


/* A part the library keeps inside a placed instance and the drawn side does not hold: a reading keeps a layer inside a
   placed component only where it differs from that component's own there (derive's ownInsides, from-code's alike), so
   to it the part is its component's own at the instance's props, and is compared as that, field by field: an override
   the library states there is a row of that field (a look code leaves to the component's own sheet, eval's leftToCode),
   never the whole part missing. An instance the drawn side places above it, its library held, says what it
   draws there (the outermost that holds it); a part with no such instance above it, one none of them draws (or draws
   as another kind or component), or one inside an instance the library keeps whole, stays missing. Only the
   drawn side is filled: a part the library lacks may be one its instance hides. Tested by test-to-figma.mjs. */
/* The instances a contract keeps whole: derive's wholeHosts, the one source from-code's reading keeps them by. */
export const wholeHosts = (contract, mains) => req('./derive.cjs').wholeHosts(contract, mains);

export function ownInPlaced(library, drawn, mains, whole = new Set()) {
  if (!mains || !library || !drawn) return drawn;
  const { placedAs, atProps } = req('./derive.cjs');
  const out = { ...drawn }, seen = new Map();
  // an instance whose insides the library keeps whole (it hides a layer, in any variant: `whole`, wholeHosts over the
  // whole contract) is one the reading keeps whole too (from-code's wholeIn): a part missing there is one code did
  // not draw, never filled
  const missing = Object.keys(library).filter((id) => id.includes('/') && !(id in drawn)).sort((x, y) => x.split('/').length - y.split('/').length);
  for (const id of missing) {
    const segs = id.split('/'), ups = segs.slice(0, -1).map((_, i) => segs.slice(0, i + 1).join('/'));
    if (ups.some((h) => whole.has(h))) continue;
    // the outermost instance that draws the part wins, as Figma's outermost override does (an Item that restyles its
    // Head's label says that label, not Head's own); an inner one only where no outer one holds the part
    // (an inner one is taken at the props it is placed with, its `with` here, else as the outer one's own places it;
    // a prop neither states is its component's default: the limit, as derive's atProps reads one)
    for (const h of ups) {
      const e = out[h], m = e && e.kind === 'instance' && e.component && mains(e.component, e.key);
      if (!m) continue;
      if (!seen.has(h)) seen.set(h, placedAs(out, h, m, mains).M);
      const M = seen.get(h), x = M[id.slice(h.length + 1)], y = library[id];
      if (!x) continue;
      // (the same part: of its kind, and an instance of the same component; another under that name stays missing)
      if (!(y && x.kind === y.kind && (x.kind !== 'instance' || String(x.component).toLowerCase() === String(y.component).toLowerCase()))) break;
      // and as an instance draws it: in a box with no auto layout it keeps no place nor constraints, which the
      // component's own contract states and no instance can override (figma-fact: no-nested-position-override; derive
      // keeps none there); one placed absolutely in an auto layout, or a glyph scaled both ways, keeps them
      const up = M[x.parent || 'root'] || {}, um = up.kind === 'instance' && mains(up.component, up.key);
      const flow = ((um ? atProps(um, up.with).root : up) || {}).layout;
      const f = { ...x, parent: !x.parent || x.parent === 'root' ? h : `${h}/${x.parent}` };
      if (!(flow && flow.direction)) delete f.absolute;
      // (a glyph's scale both ways kept only below another instance inside this one, left to that one's turn: a part whose
      // nearest instance is this one has its constraints, the component's own, left out as derive's inherit leaves them;
      // Carbon's dropdown chevron's Chevron--down, filled with a scale the library keeps none of)
      const nested = (() => { for (let p = x.parent; p && p !== 'root'; p = (M[p] || {}).parent) if ((M[p] || {}).kind === 'instance') return true; return false; })();
      if (!f.absolute && !(nested && f.constraints && f.constraints.horizontal === 'scale' && f.constraints.vertical === 'scale')) delete f.constraints;
      out[id] = f;
      break;
    }
  }
  return out;
}

/* A placed instance's prop at its own component's default is that prop unstated: the library's contract states every
   prop of an instance, a reading only the ones it reads. `mains` is derive's byComponentName (name → contract, a
   name two components share none, as the pipeline resolves them); a prop is
   dropped from `with` where it equals the main's default (its code word or Figma's), on both sides alike. */
function atDefault(x, mains) {
  if (!x || !mains) return x;
  const low = (v) => String(v).toLowerCase();
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) {
    const main = e && e.kind === 'instance' && e.with && mains(e.component, e.key);
    if (!main) continue;
    const byFigma = Object.fromEntries(Object.values(main.props || {}).map((q) => [low(q.figma || ''), q]));
    // (a swap with no layer it swaps, none swapped by it, at any props; and none drawn inside this instance here, where the
    // design would say what it swapped in, compared as such)
    const layers = [main.anatomy || {}, ...(main.variants || []).map((v) => v.add || {})].flatMap((a) => Object.values(a)).filter(Boolean);
    // (only where the library's snapshot records what its props drive, `mains.linked`: an older one records it for none)
    const swapsNothing = (q, key) => mains.linked !== false && !(q.swaps || []).length && !layers.some((y) => y.swappedBy === key)
      && !(main.variants || []).some((v) => Object.entries(v.set || {}).some(([sk, y]) => sk.endsWith('.swappedBy') && y === key))
      && !Object.entries(x).some(([k, y]) => k.startsWith(`${id}/`) && y && y.kind === 'instance');
    const rest = Object.fromEntries(Object.entries(e.with).filter(([k, v]) => {
      const q = byFigma[low(k)];
      // a swap at the icon its component draws there (Icon (16): house where the part is Icon/house) is its default too
      if (q && q.type === 'instance' && q.default === undefined) {
        // the icon the main draws there at the instance's own props; a part those props hide, the one any variant draws
        const part = (q.swaps || [])[0], M = part && req('./derive.cjs').atProps(main, e.with);
        const key = Object.keys(main.props).find((kk) => main.props[kk] === q);
        // a swap that drives no layer draws nothing, whatever it names: an override on nothing, which no code can say
        if (swapsNothing(q, key)) return false;
        // (a layer said to be its own at these props is the one it drives)
        const mine = (q.swaps || []).filter((sp) => M[sp] && M[sp].swappedBy === key);
        // a swap another prop drives the layer for at these props (Icon (20) on a button drawn at xs, whose icon Icon (16)
        // swaps) draws nothing: Figma keeps its override, which no code can say
        if (!mine.length && part && M[part] && M[part].swappedBy && M[part].swappedBy !== key) return false;
        // (a swap the design ties to several layers, none of them said to be its alone: the icon any of them draws there,
        // as which layer it drives at these props is the design's own tie, no value code reads back; a later layer only
        // as drawn at these props)
        const first = part && ((M[part] || {}).component || ([main.anatomy || {}, ...(main.variants || []).map((w) => w.add || {})].map((a) => a[part]).find((y) => y && y.component) || {}).component);
        const drawn = mine.length ? mine.map((sp) => M[sp].component)
          : [first, ...(q.swaps || []).slice(1).filter((sp) => !(M[sp] && M[sp].swappedBy && M[sp].swappedBy !== key)).map((sp) => (M[sp] || {}).component)];
        return !drawn.filter(Boolean).length || !drawn.filter(Boolean).some((d) => low(d) === low(v) || low(d).endsWith(`/${low(v)}`));
      }
      if (!q || q.default === undefined) return true;
      const words = [q.default, (q.figmaValues || [])[(q.values || []).indexOf(q.default)]].filter((w) => w !== undefined).map(low);
      // a word of an option is one in any case; a text's words are its own
      return q.type === 'enum' || q.type === 'boolean' ? !words.includes(low(v)) : String(v) !== String(q.default);
    }));
    const { with: _, ...bare } = e;
    out[id] = Object.keys(rest).length ? { ...bare, with: rest } : bare;
  }
  return out;
}

/* A combination of the design's in a drawing's words, as the round trip compares them: each prop the drawing's of the
   same Figma name, its value of the same word in any case; the interaction prop's rest is each side's default, whatever
   its word (a reading's `rest` is the design's Enabled: from-code designCombo's own rule). Used by from-code's
   stackLikeDesign too. Tested by test-to-figma.mjs. */
export function inWordsOf(library, drawn) {
  const low = (x) => String(x).toLowerCase();
  const named = Object.fromEntries(Object.entries(drawn.props || {}).map(([k, q]) => [low(q.figma || k), k]));
  return (c) => Object.fromEntries(Object.entries(c).map(([k, v]) => {
    const lq = library.props[k], dk = named[low(lq.figma || k)] || k, dq = (drawn.props || {})[dk];
    const rest = lq.role === 'interaction' && dq && dq.role === 'interaction' && v === lq.default;
    return [dk, dq && dq.type === 'enum' ? dq.values.find((w) => low(w) === low(v)) ?? (rest ? dq.default : v) : v];
  }));
}

export function roundTrip(library, drawn, { limit = Infinity, mains = null, layoutUnit = false, pointerFrom = null } = {}) {
  const design = library.code?.from !== 'code';
  library = figmaSide(library); drawn = figmaSide(drawn);
  const rows = new Map();
  let adds = 0; // every row added, a repeat too (diff reads it to tell whether a component differed)
  // (a row found only where pointer states' variants, a hover's or a focus's, alone set that field says so, `pointer`, where
  // one side is a browser's reading: what such a variant draws no markup holds, eval's leftToCode)
  let byPointer = () => false;
  const add = (at, a, b) => { adds++; const k = JSON.stringify([at, a, b]); const r = rows.get(k) || { at, library: a ?? null, drawn: b ?? null, in: 0, pointer: true }; r.in++; r.pointer = r.pointer && byPointer(at); rows.set(k, r); };
  const diff = (a, b, at) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    // a placed instance's key is which component it is, compared only where both sides hold one (a reading from code
    // may hold none): two that differ are two components of one name
    if (/^[^.]+\.key$/.test(at) && (a == null || b == null)) return;
    // a colour style is Figma's alone: where one side is a browser's reading (`layoutUnit`), it is not held to one
    if (layoutUnit && /^[^.]+\.fillStyle$/.test(at)) return;
    // another library component, named in the drawing's file by its set alone (house): the library's stored name
    // carries the path it sits under in its own file (Icon/house), which no other file can read
    // a placed instance's prop at a boolean word is that boolean in any spelling: the design's variant says true where a
    // reading from code names the axis True (to-markup's word for a boolean axis), or a boolean prop says true itself
    // a place a browser lays out in its own unit, 1/64 px (Blink's LayoutUnit, FixedPoint<6>: chromium
    // third_party/blink/renderer/platform/geometry/layout_unit.h), read back to two decimals: within that unit, the same place
    // (only where one side is a browser's reading, `layoutUnit`: Figma's own numbers are exact)
    // (the room about a centred part sums two such places: within two units)
    // (and so is an element's size the browser lays out: a mark drawn 8.65 wide is 553/64 px, read 8.64)
    if (layoutUnit && /(\.absolute\.(x|y|end|bottom|xFromCentre|yFromCentre|xRoom|yRoom)|^[^.]+\.(width|height))$/.test(at) && typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= (/Room$/.test(at) ? 2 : 1) / 64 + 0.005) return;
    // a size the library holds at 0 is drawn at 0.01, the least the plugin API resizes to (@figma/plugin-typings
    // plugin-api.d.ts, LayoutMixin.resize: "Must be >= 0.01"): the same, on Figma's side only (a browser lays out a 0)
    if (!layoutUnit && /^[^.]+\.(width|height)$/.test(at) && a === 0 && b === 0.01) return;
    // a text the library's snapshot read no single face or size for (its face mixed, or not recorded) says `literal` alone,
    // no style and nothing more: a drawing of it in any values, with no style either, says all it can be held to (Figma's
    // side only: code that read a browser's default there is the very difference the snapshot records sizes to catch)
    if (!layoutUnit && /^[^.]+\.typography$/.test(at) && a === 'literal' && looksLikeValue(b)) return;
    const bool = (v) => (typeof v === 'boolean' ? v : typeof v === 'string' && /^(true|false)$/i.test(v) ? v.toLowerCase() === 'true' : undefined);
    if (/\.with\.[^.]+$/.test(at) && bool(a) !== undefined && bool(a) === bool(b)) return;
    if (/(^|\.)component$/.test(at) && typeof a === 'string' && typeof b === 'string' && !b.includes('/') && a.split('/').pop() === b) return;
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      // (an instance's component before its key: where the components already differ, a key that differs with them is the
      // same difference, counted once)
      const ks = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort((x, y) => (y === 'component') - (x === 'component'));
      let other = false;
      for (const k of ks) {
        if (k === 'key' && other) continue;
        const before = adds;
        diff(a[k], b[k], at ? `${at}.${k}` : k);
        // (an element's own fields only, one with a kind: never a map of parts that names one `component`)
        if (k === 'component' && (a.kind || b.kind)) other = adds > before;
      }
    }
    else add(at, a, b);
  };
  const low = (x) => String(x).toLowerCase();
  const axes = Object.entries(library.props).filter(([, q]) => q.type === 'enum' || q.type === 'boolean').map(([k, q]) => [k, q.type === 'enum' ? q.values : [true, false]]);
  let combos = [{}];
  for (const [k, vs] of axes) combos = combos.flatMap((c) => vs.map((v) => ({ ...c, [k]: v })));
  // a combination the library does not draw (its `invalid`: a disabled button has no hover) has nothing to compare
  const notDrawn = (c) => (library.invalid || []).some((w) => Object.entries(w).every(([k, v]) => String(c[k]) === String(v)));
  const invalid = combos.filter(notDrawn).length; combos = combos.filter((c) => !notDrawn(c));
  // past the limit the rest are not compared, and said: a cut that is not said reads as the same
  const cut = Math.max(0, combos.length - limit); combos = combos.slice(0, limit);
  const whole = wholeHosts(library, mains), inTheirs = inWordsOf(library, drawn);
  // what each combination lists inside a host kept whole: a layer one of them leaves out is one the design hides there
  const listed = new Map([...whole].map((h) => [h, combos.map((c) => Object.keys(expand(library, { ...variantDefaults(library), ...c })).filter((k) => k.startsWith(`${h}/`))).filter((ks) => ks.length).map((ks) => new Set(ks))]));
  const hidden = (h, k) => (listed.get(h) || []).some((ks) => !ks.has(k));
  // (the pointer states are `pointerFrom`'s, the design's, matched by Figma name and word: a reading held as the library on
  // the second leg names a state it forces, disabled among them, a pointer state of its own)
  const P = pointerFrom || library, pq = (k) => { const q = library.props[k] || {}; return P === library ? q : Object.values(P.props || {}).find((d) => low(d.figma || '') === low(q.figma || k)) || {}; };
  const pointerAt = (w) => Object.entries(w || {}).some(([k, v]) => pq(k).role === 'interaction' && (pq(k).pointer || []).some((x) => low(x) === low(v)));
  const applies = (w, c) => Object.entries(w || {}).every(([k, v]) => String(c[k]) === String(v));
  for (const c of combos) {
    const theirs = inTheirs(c);
    // (every variant that sets the field there a pointer state's: where another that applies sets it too, a focus and a
    // selected both saying Search, the markup holds the words through that one)
    const atC = (library.variants || []).filter((v) => applies(v.when, c));
    byPointer = (at) => { const ss = atC.filter((v) => at in (v.set || {})); return ss.length > 0 && ss.every((v) => pointerAt(v.when)); };
    // the named equivalences, each the same on both sides
    const same = (x) => spread(atDefault(iconSize(glyph(line(dashes(arcs(outer(words(paint(room(x))))))))), mains));
    const A = expand(library, { ...variantDefaults(library), ...c }), B = expand(drawn, { ...variantDefaults(drawn), ...theirs });
    // a host kept whole over the whole contract (the reading keeps it so in every combination) that this combination
    // may hide no layer in: derive's own test of a hidden layer (ownInsides `found`: a part of its component not drawn
    // there), the one derive keeps a host whole by. Only a host listing nothing inside passes it (it draws its component
    // as is: a radio's icon box at focus and checked); one that lists insides and lacks a part may hide it, as a
    // contract keeps no difference between a layer hidden and one left out as its component's (beside overrides only,
    // the two read alike), so nothing is filled there and a part drawn there stays a difference. The design left the
    // parts of the first out as its component's, so a part the drawing keeps there is held to that component's own, as
    // the other way round below. Not a layer another combination hides: a combination listing nothing may hide it too, by
    // visibility alone, and the snapshot never says so (the plugin walks an instance's insides only for an override other
    // than visibility, design-system-snapshot code.js): one listing nothing and one hiding every layer it hides read
    // alike, so a layer the design is seen to hide is never filled, and drawn there it stays a difference
    const here = new Set();
    if (mains) req('./derive.cjs').ownInsides(JSON.parse(JSON.stringify(A)), mains, { found: here });
    const loose = [...whole].filter((h) => !here.has(h));
    const theirsIn = Object.fromEntries(Object.entries(B).filter(([k]) => loose.some((h) => k.startsWith(`${h}/`) && !hidden(h, k))));
    const a = same(loose.length ? ownInPlaced(theirsIn, A, mains, here) : A), b = same(ownInPlaced(A, B, mains, whole));
    diff(unswapped(pinned(ranked(a, b), b, design), b), unswapped(pinned(ranked(b, a), a), a), '');
  }
  const kinds = (x) => JSON.stringify(Object.fromEntries(Object.entries(x.props).map(([k, q]) => [q.figma || k, q.type]).sort()));
  byPointer = () => false;
  if (kinds(library) !== kinds(drawn)) add('props', kinds(library), kinds(drawn));
  if (library.component !== drawn.component) add('name', library.component, drawn.component);
  return { combinations: combos.length, ...(invalid && { invalid }), ...(cut && { cut }), rows: [...rows.values()].map(({ pointer, ...r }) => (pointer && layoutUnit ? { ...r, pointer } : r)) };
}

/* A gap Figma does not draw: with space-between it spaces the children itself, its stored item spacing unused (css.mjs
   writes none), so it is no value of either side. Tested by test-to-figma.mjs. */
function spread(x) {
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) if (e && e.layout && e.layout.align === 'space-between' && 'gap' in e.layout) { const { gap: _, ...l } = e.layout; out[id] = { ...e, layout: l }; }
  return out;
}
/* Which swap prop drives a layer (swappedBy) is how the design ties a layer to its prop, used above (atDefault) and
   ignored by derive's own comparison: code has no such tie to read back, so where one side says none it is no value;
   where both say one (a drawing read back from Figma), a different one is a difference. */
function unswapped(x, other) {
  const out = { ...x };
  for (const [id, e] of Object.entries(x)) if (e && e.swappedBy != null && !(other[id] && other[id].swappedBy != null)) { const { swappedBy: _, ...rest } = e; out[id] = rest; }
  return out;
}

/* A child's order as its place among its siblings: Figma's numbers can tie or skip where variants combine (an icon and
   an avatar both 0, the texts 1), a reading's run 0..n; the place is what is drawn. Ties keep their listed order. Only
   the siblings both sides draw are placed: one missing on one side is its own row, not a shift of every place after it. */
function ranked(x, other) {
  const out = { ...x }, by = {};
  Object.entries(x).forEach(([id, e], i) => { if (e && e.parent != null && typeof e.order === 'number' && other[id]) (by[e.parent] ||= []).push([id, e.order, i]); });
  for (const xs of Object.values(by)) xs.sort((a, b) => a[1] - b[1] || a[2] - b[2]).forEach(([id], k) => { out[id] = { ...out[id], order: k }; });
  return out;
}

// a boolean's own layer is named for the prop that shows it in its id (derive.cjs idOf: Show icon's Icon is
// showIconIcon): the layer is the name after it, else reading it back names it twice (showIconShowIconIcon). Only a
// boolean off by default (`off`, its Figma names): derive's alignFlip names a layer for its prop only where the flip adds
// it, and a layer one on by default shows is in the base already, read back by its own name (a button's Icon spacer,
// under Icon, on by default, was drawn Spacer and read back as spacer, not iconSpacer)
const ownId = (id, e, off = null) => {
  if (!e.shownBy || (off && !off.has(e.shownBy))) return id;
  const segs = id.split('/'), last = segs.at(-1), pre = camel(e.shownBy);
  // at a word's edge only (showIconIcon, not showMore under Show)
  return last.startsWith(pre) && /^[A-Z]/.test(last.slice(pre.length)) ? [...segs.slice(0, -1), last[pre.length].toLowerCase() + last.slice(pre.length + 1)].join('/') : id;
};

/* The contract as Figma holds it: a prop the contract says is code's alone (`only: 'code'`, the contract editor's
   "Exists in") is no property or axis of the drawing, so the combinations it moves are drawn at its default and the
   rest of them go. Tested by test-to-figma.mjs. */
export function figmaSide(contract) {
  const gone = Object.entries(contract.props || {}).filter(([, p]) => p && p.only === 'code');
  if (!gone.length) return contract;
  const def = Object.fromEntries(gone.map(([k, p]) => [k, p.default]));
  const props = Object.fromEntries(Object.entries(contract.props).filter(([k]) => !(k in def)));
  const variants = (contract.variants || []).flatMap((v) => {
    const keys = Object.keys(v.when || {}).filter((k) => k in def);
    if (!keys.length) return [v];
    if (keys.some((k) => v.when[k] !== def[k])) return [];
    // one that named only code-only props at their defaults holds for every combination drawn
    return [{ ...v, when: Object.fromEntries(Object.entries(v.when).filter(([k]) => !(k in def))) }];
  });
  // a combination not drawn that names one: as for a variant
  const invalid = Array.isArray(contract.invalid) ? contract.invalid.flatMap((x) => (Object.keys(x).some((k) => k in def && x[k] !== def[k]) ? [] : [Object.fromEntries(Object.entries(x).filter(([k]) => !(k in def)))])).filter((x) => Object.keys(x).length) : contract.invalid;
  return { ...contract, props, variants, ...(invalid !== undefined && { invalid }) };
}

/* Which of Figma's sizing properties each of a part's own sizes is set by: its width the horizontal one, its height the
   vertical; turned a quarter, the other way round, as Figma lays out the turned box and says its sizing on the parent's
   axes (derive.cjs QUARTER reads them so). Run in the drawing (passed as source). */
export function sizingAxes(e, turned) {
  // (as derive swaps them: a part code draws in a wrapper (to-code.mjs, `turned`: P.turned), in the flow, no axis hugging;
  // placed out of it, a fill is not drawn, and a number sizes its own axis)
  const q = turned && typeof e.rotation === 'number' && Math.abs(Math.abs(e.rotation) - 90) < 0.01 && e.width !== 'hug' && e.height !== 'hug' && !e.absolute && e.position !== 'absolute';
  return q ? [['width', 'layoutSizingVertical'], ['height', 'layoutSizingHorizontal']] : [['width', 'layoutSizingHorizontal'], ['height', 'layoutSizingVertical']];
}

export function plan(contract, { axisOrder = [] } = {}) {
  contract = figmaSide(contract);
  const props = contract.props;
  const AXES = axisOrder.map(camel);
  // a boolean is an axis where the contract says so, or where a layer of its own styles beyond adding, removing and
  // ordering, which a boolean property cannot; one that only shares a layer with an axis stays a property
  // nor one that hides a layer when on (button's Loading takes its label away): a boolean shows layers, and every
  // variant is drawn with every boolean on, so that layer was drawn nowhere
  const styles = (k) => props[k].axis === true || contract.variants.some((v) => !v.combination && Object.keys(v.when).join() === k && (Object.keys(v.set || {}).some((f) => !/\.order$/.test(f)) || (v.when[k] === true && (v.remove || []).length > 0)));
  // a prop that takes the whole component away (a dialog's Open, off) draws nothing to show or hide (figma-fact:component-root-not-hidden, believed): Figma cannot hide
  // a component's own root, so the drawing is at its default and the prop is not drawn
  // an enum loses only the values that do (a State's hidden), and keeps its axis
  const gone = (k) => contract.variants.filter((v) => Object.keys(v.when).join() === k && (v.remove || []).includes('root')).map((v) => v.when[k]);
  const whole = (k) => props[k].type !== 'enum' && gone(k).length > 0;
  const booleans = Object.entries(props).filter(([k, p]) => p.type === 'boolean' && !whole(k) && !styles(k)).map(([k, p]) => ({ key: k, figma: p.figma, default: p.default, shows: p.shows || [] }));
  const axes = Object.entries(props).filter(([k, p]) => !whole(k) && (p.type === 'enum' || (p.type === 'boolean' && styles(k))))
    .map(([k, p]) => ({ key: k, figma: p.figma, values: p.type === 'enum' ? [p.default, ...p.values.filter((v) => v !== p.default && !gone(k).includes(v))] : [p.default, !p.default], boolean: p.type === 'boolean' }))
    // figma-standard rule 1: props and booleans first, then the axes in the house's order (audit-settings axisOrder)
    .sort((a, b) => (AXES.includes(a.key) ? AXES.indexOf(a.key) : a.boolean ? -1 : AXES.length) - (AXES.includes(b.key) ? AXES.indexOf(b.key) : b.boolean ? -1 : AXES.length));
  const text = Object.entries(props).filter(([, p]) => p.type === 'string').map(([k, p]) => ({ key: k, figma: p.figma, default: p.default }));
  const swap = Object.values(props).find((p) => p.type === 'swap');
  // an instance swap property and the instances it may swap: the one a part names where several swap it, else each
  // that lists it (the drawing links it to the one whose default is its component)
  const swaps = Object.entries(props).filter(([, p]) => p.type === 'instance' && p.figma).map(([k, p]) => ({ key: k, figma: p.figma, parts: p.swaps || [] }));
  // a value as the library writes it: its own spelling where the contract keeps one, else the house's
  const show = (a, v) => { const q = props[a.key]; return q.figmaValues && q.values ? q.figmaValues[q.values.indexOf(v)] ?? figmaWord(v) : figmaWord(v); };
  // every combination of the axes, less those the contract says are not drawn (its invalid list, a canvas fact)
  const notDrawn = Array.isArray(contract.invalid) ? contract.invalid : [];
  const grid = axes.reduce((acc, a) => acc.flatMap((w) => a.values.map((v) => ({ ...w, [a.key]: v }))), [{}])
    .filter((w) => !notDrawn.some((x) => Object.entries(x).every(([k, v]) => w[k] === v)));
  // where each is placed in the set's grid: a row per combination of the axes but the last, a column per value of
  // the last, so a combination not drawn leaves its cell empty rather than shifting the rest of its row
  const last = axes[axes.length - 1];
  const rowKeys = [...new Set(grid.map((w) => JSON.stringify(axes.slice(0, -1).map((a) => w[a.key]))))];
  const cellOf = (w) => (last ? [rowKeys.indexOf(JSON.stringify(axes.slice(0, -1).map((a) => w[a.key]))), last.values.indexOf(w[last.key])] : [0, 0]);
  // a boolean that takes a layer away somewhere: where it leaves it, the layer is not its
  // (a remove that also asks another boolean is off is one a Figma boolean cannot say: not counted)
  const axisKeys = new Set(axes.map((a) => a.key));
  const hides = (key, id) => (contract.variants || []).some((v) => v.when && v.when[key] === false && Object.keys(v.when).every((k) => k === key || axisKeys.has(k)) && (v.remove || []).includes(id));
  const offByDefault = new Set(booleans.filter((b) => !b.default).map((b) => b.figma));
  const variants = grid.map((w) => {
    const on = Object.fromEntries(booleans.map((b) => [b.key, true]));
    const anatomy = expand(contract, { ...w, ...on });
    // each element a boolean shows: there with it on, gone with it off
    // not where the contract has it stay with the boolean off that elsewhere takes it away (a label's Optional, there
    // whatever its Indicator says, when not required); a layer one boolean names is its; one gone only with its parent goes by that parent's (a button by its own
    // Show secondary button, not the Show buttons of the row it is in)
    for (const b of booleans) { const off = expand(contract, { ...w, ...on, [b.key]: false }); for (const id of Object.keys(anatomy)) if ((b.shows.includes(id) && !(off[id] && hides(b.key, id))) || (!off[id] && !anatomy[id].shownBy)) anatomy[id] = { ...anatomy[id], shownBy: b.figma }; }
    // a boolean shows the topmost of what it shows: the layers inside go with it
    for (const e of Object.values(anatomy)) if (e.shownBy && e.parent && anatomy[e.parent] && anatomy[e.parent].shownBy === e.shownBy) e.under = true;
    for (const e of Object.values(anatomy)) if (e.under) { delete e.shownBy; delete e.under; }
    for (const e of Object.values(anatomy)) if (e.kind === 'graphic' && !e.asset && swap) e.asset = swap.default;
    for (const [id, e] of Object.entries(anatomy)) if (e.kind === 'instance') { const by = e.swappedBy ? swaps.filter((x) => x.key === e.swappedBy) : swaps.filter((x) => x.parts.includes(id)); if (by.length) anatomy[id] = { ...e, swapProps: by.map((x) => x.figma) }; }
    for (const e of Object.values(anatomy)) if (e.kind === 'text') { const t = text.find((x) => e.content === `{${x.key}}`); if (t) e.text = t.figma; }
    return { name: axes.map((a) => `${a.figma}=${show(a, w[a.key])}`).join(', '), cell: cellOf(w), anatomy: Object.fromEntries(Object.entries(anatomy).map(([id, e]) => [id, { ...e, name: slotName(e, contract.props || {}) ?? e.name ?? partName(ownId(id, e, offByDefault)) }])) };
  });
  const slots = Object.values(contract.props || {}).filter((p) => p.type === 'slot' && p.figma).map((p) => ({ figma: p.figma, settings: p.settings || null, description: p.description || '', preferred: p.preferred || [] }));
  return { name: /^[a-z][A-Za-z0-9-]*$/.test(contract.component) ? sentence(contract.component) : contract.component, slots, axes: axes.map((a) => a.figma), booleans: booleans.map((b) => ({ figma: b.figma, default: b.default })), swaps: swaps.map((x) => ({ figma: x.figma })), text: text.map((t) => ({ figma: t.figma, default: t.default })), notDrawn: Object.keys(props).filter((k) => gone(k).length).map((k) => (whole(k) ? `${props[k].figma || k} (it takes the whole component away)` : `${props[k].figma || k}=${gone(k).join(', ')} (takes the whole component away)`)), order: Object.values(props).map((p) => p.figma).filter(Boolean), fromCode: (contract.code || {}).from === 'code', align: ALIGN_DATA.toFigma, size: Object.fromEntries(SIZE_ROWS), rows: Math.max(rowKeys.length, 1), cols: last ? last.values.length : 1, variants };
}

/* What the plugin runs: the plan drawn, every value bound to the variable,
   style or component the contract names; what it could not bind, listed.
   Drawn on `page`, the run's own, whichever page Figma shows meanwhile. */
const RUNTIME = async (P, K, page = figma.currentPage, made = [], started = globalThis.__drawingStarted) => {
  const missing = new Set();
  // what this run made, kept here and not in the page's record alone: a run the runner gave up on records nothing
  // there, and its parts were left on the page for the next drawing to refuse
  // and its recorder passed in, not read from a global a newer run would have replaced
  // each variant it makes asks the token again, so a run given up on mid-build stops at its next variant too
  const gone = () => typeof __token !== 'undefined' && figma.root.getPluginData('to-figma-running') !== String(__token);
  const mine = (id) => { made.push(id); if (started) started(id); if (gone()) throw new Error('this drawing was given up on; it stopped'); };
  // a Figma call that never returns (seen mid-run: one text style call in twenty, while the same call alone
  // took 8 ms) is given 8 s and one retry; still nothing, it is reported as not bound and the drawing goes on
  // a run whose token is gone (the runner gave up on it, or a newer drawing took the file) stops at its next call to
  // Figma: left going, one crawled through its imports for an hour and held the file
  const tried = async (what, f) => { if (gone()) throw new Error('this drawing was given up on; it stopped'); figma.root.setPluginData('to-figma-step', `${new Date().toISOString().slice(11, 19)} ${what}`); figma.root.setPluginData('to-figma-beat', String(Date.now())); for (let i = 0; i < 2; i++) { const r = await Promise.race([Promise.resolve().then(f).then((v) => ({ v }), (e) => ({ failed: String(e && e.message || e) })), new Promise((res) => setTimeout(() => res(null), 8000))]); if (r && 'v' in r) return r.v; if (r) { missing.add(`${what} (${r.failed})`); return null; } } missing.add(`${what} (no answer)`); return null; };
  // a main imported once per key, its answer kept: each instance asking again made a key that would not answer cost
  // sixteen seconds per instance, and a side navigation of many items outran the drawing's time
  const mains = new Map();
  // a drawing made inside the library's own file, which need not be published (K.ownFile, said by the runner when
  // the scratch file is the library file): a key the file holds is taken from the file, as an import by key answers
  // only a published one. Filled below, one kind at a time and each under `tried`, before any import is asked
  const ownKeys = new Map();
  // a lent text style's copy can withhold its font (a symbol where the font is) until its library answers: the font
  // of a text that uses it, by the style's key
  const lentFont = new Map(), fontOf = (st) => (typeof st.fontName === 'symbol' ? lentFont.get(st.key) || null : st.fontName);
  const own = (key, f) => (ownKeys.has(key) ? Promise.resolve(ownKeys.get(key)) : f());
  // a key is a set's or a component's: both asked at once, the first that answers taken (asked one after the other, a
  // set import given a component's key was seen never to answer, neither resolving nor failing, and held the drawing)
  const either = (key) => own(key, () => new Promise((ok, no) => { let failed = 0; for (const f of [() => figma.importComponentSetByKeyAsync(key), () => figma.importComponentByKeyAsync(key)]) f().then(ok, () => { if (++failed === 2) no(new Error('neither a set nor a component by that key')); }); }));
  const importMain = (what, key) => { if (!mains.has(key)) mains.set(key, tried(what, () => either(key))); return mains.get(key); };
  // every call to Figma is made up front, side by side, then the layers are built without waiting on it:
  // with Figma in the background each call waits its turn for a slow tick, and a drawing that made its
  // hundreds of calls one after another took minutes
  // variables by the keys the runner looked up in the library file (listing a library's variables from
  // here hung for a minute at a time)
  if (K.ownFile) {
    // each kind on its own, so one listing that stalls or fails (listing a library's variables has hung) costs only
    // its own keys, which are then imported as before
    const keep = (xs) => { for (const x of xs || []) if (x && x.key) ownKeys.set(x.key, x); };
    // not under `tried`: a listing that stalls or fails is no token unbound (its keys are imported as before), so it
    // never reaches `missing`, which refuses a patch; the beat is kept and a given-up drawing still stops
    const listing = async (what, f, ms = 8000) => { if (gone()) throw new Error('this drawing was given up on; it stopped'); figma.root.setPluginData('to-figma-step', `${new Date().toISOString().slice(11, 19)} ${what}`); figma.root.setPluginData('to-figma-beat', String(Date.now())); keep(await Promise.race([Promise.resolve().then(f).catch(() => null), new Promise((r) => setTimeout(() => r(null), ms))])); };
    await listing("this file's components", () => figma.root.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] }));
    await listing("this file's text styles", () => figma.getLocalTextStylesAsync());
    await listing("this file's effect styles", () => figma.getLocalEffectStylesAsync());
    await listing("this file's colour styles", () => figma.getLocalPaintStylesAsync());
    await listing("this file's variables", () => figma.variables.getLocalVariablesAsync());
    // what the library's own component takes from other libraries (a text style, an icon, a colour published
    // elsewhere): the file holds a copy of each, which an import by key may never reach (a copy of a community file
    // reaches none of the libraries it was made with), so the keys asked for are taken from the copies its own
    // component uses. Its own set only, never a drawing of it (on a page the drawings record)
    await listing('what its own component takes from other libraries', async () => {
      const want = new Set([K.styles, K.fillStyles, K.icons, K.vars, K.effects, K.sets, ...Object.values(K.variants || {})].flatMap((m) => Object.values(m || {})).concat(K.iconContainer || []).filter((k) => k && !ownKeys.has(k)));
      // each found copy kept as it comes (a scan cut short keeps what it found), and the scan stops once every key
      // asked for is found or 25 s have gone, its walk included, which runs before any timer could fire
      const until = Date.now() + 25000, done = () => !want.size || Date.now() > until;
      const take = (x) => { if (x && want.has(x.key)) { ownKeys.set(x.key, x); want.delete(x.key); } };
      // (a set named under its page, Page/Set, is found by its own name)
      const drawnPage = (n) => { while (n && n.type !== 'PAGE') n = n.parent; return !!(n && n.getPluginData('drawings')); };
      const roots = want.size ? figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).filter((n) => (n.name === P.name || P.name.endsWith('/' + n.name)) && !drawnPage(n)) : [];
      const styleIds = new Set(), varIds = new Set(), insts = [], textFont = new Map();
      const alias = (v) => { if (!v) return; if (Array.isArray(v)) v.forEach(alias); else if (typeof v === 'object') { if (v.type === 'VARIABLE_ALIAS' && v.id) varIds.add(v.id); else Object.values(v).forEach(alias); } };
      walk: for (const r of roots) for (const n of [r, ...r.findAll(() => true)]) {
        if (Date.now() > until) break walk;
        try {
          for (const id of styleIdsOf(n)) styleIds.add(id);
          if (n.type === 'TEXT' && typeof n.textStyleId === 'string' && n.textStyleId && typeof n.fontName !== 'symbol' && !textFont.has(n.textStyleId)) textFont.set(n.textStyleId, n.fontName);
          alias(n.boundVariables);
          for (const paint of [].concat(Array.isArray(n.fills) ? n.fills : [], Array.isArray(n.strokes) ? n.strokes : [])) alias(paint.boundVariables);
          if (n.type === 'INSTANCE') insts.push(n);
        } catch { /* a layer inside another library's instance can need Figma's servers to read: skipped */ }
      }
      const settle = async (xs, get) => { for (let k = 0; k < xs.length && !done(); k += 100) { figma.root.setPluginData('to-figma-beat', String(Date.now())); for (const x of await Promise.all(xs.slice(k, k + 100).map((v) => get(v).catch(() => null)))) for (const y of [].concat(x || [])) take(y); } };
      await settle([...styleIds], async (id) => { const st = await figma.getStyleByIdAsync(id); if (st && typeof st.fontName === 'symbol' && textFont.has(id)) lentFont.set(st.key, textFont.get(id)); return st; });
      await settle([...varIds], (id) => figma.variables.getVariableByIdAsync(id));
      await settle(insts, async (n) => { const m = await n.getMainComponentAsync(); return m ? [m, m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : null] : null; });
      return [];
    }, 30000);
  }
  const lib = K.vars || {};
  const els = P.variants.flatMap((v) => Object.values(v.anatomy));
  const names = new Set();
  for (const e of els) for (const t of [...[e.background, e.color, e.border && e.border.color].flat().flatMap((p) => (p && p.stops ? p.stops.map((st) => st.color) : [p])), ...[].concat((e.border && e.border.width) || []), ...[].concat(e.radius ?? []), e.opacity, e.layout && e.layout.gap, e.layout && e.layout.crossGap, ...Object.values((e.layout && e.layout.padding) || {}), e.width, e.height, e.minWidth, e.maxWidth, e.minHeight, e.maxHeight].flat()) if (typeof t === 'string' && (t.includes('/') || (K.vars && t in K.vars))) names.add(t);
  const vars = {};
  // side by side, then once more one at a time for any that went unanswered side by side
  const imp = (n) => own(lib[n], () => figma.variables.importVariableByKeyAsync(lib[n]));
  await Promise.all([...names].map(async (n) => { vars[n] = lib[n] ? await Promise.race([imp(n).catch(() => null), new Promise((r) => setTimeout(() => r(null), 8000))]) : null; }));
  // three in a row with no answer: the library is not answering this file, and each more would cost 16 s (a drawing of
  // thirty variables outran its nine minutes); the rest are said as not bound
  let silent = 0;
  for (const n of names) {
    if (!lib[n] || vars[n]) continue;
    if (silent >= 3) { missing.add(`${n} (no answer: the library answered none of the last three)`); continue; }
    vars[n] = await tried(n, () => imp(n));
    // (one that failed outright is that variable's, not the library's silence)
    silent = vars[n] ? 0 : missing.has(`${n} (no answer)`) ? silent + 1 : 0;
  }
  const V = async (n) => { if (typeof n !== 'string' || !(n.includes('/') || n in lib)) return null; if (!vars[n]) missing.add(n); return vars[n] || null; };
  // a layer's variable modes, set on every collection of its axis (K.modes: { axis: [{ collection, key, names }] },
  // `key` one variable of that collection, imported to reach it; `names` its modes by the contract's spelling)
  const cols = {};
  const modeSets = [...new Set(els.flatMap((e) => Object.keys(e.modes || {})))].flatMap((a) => (K.modes || {})[a] || []);
  await Promise.all(modeSets.filter((m) => m.key).map(async (m) => { const v = await tried(`a variable of ${m.collection}`, () => own(m.key, () => figma.variables.importVariableByKeyAsync(m.key))); cols[m.key] = v ? await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId) : null; }));
  // (each collection on its own, a failure said and the rest still set; a layer that cannot hold a mode, said)
  const setModes = (n, e, id) => {
    if (!('setExplicitVariableModeForCollection' in n)) { missing.add(`${e.name || id} (its modes: a ${n.type} holds none)`); return; }
    for (const [a, val] of Object.entries(e.modes || {})) {
      const sets = (K.modes || {})[a];
      if (!sets || !sets.length) { missing.add(`${e.name || id} (its ${a} mode ${val}: no collection the tokens hold)`); continue; }
      for (const m of sets) {
        // a collection none of whose variables is published cannot be reached from another file
        if (!m.key) { missing.add(`${e.name || id} (its mode ${m.collection}: ${val}; the collection publishes no variable, so another file cannot set it)`); continue; }
        const c = cols[m.key], mode = c && c.modes.find((x) => x.name === m.names[val]); try { if (!mode) throw new Error('not reached'); n.setExplicitVariableModeForCollection(c, mode.modeId); } catch (x) { missing.add(`${e.name || id} (its mode ${m.collection}: ${val}, ${x.message})`); } }
    }
  };
  // unbound, a value is drawn as the token's own value from the snapshot (K.values), never grey or square:
  // the drawing looks right, and the report still says what is not bound
  // read as the parity engine reads a colour (its parseColour, written into the plugin code beside this, as the
  // shared variant-name reader is)
  const colourOf = (c) => { const x = parseColour(c); return x ? { rgb: x.slice(0, 3).map((v) => v / 255), a: x[3] } : null; };
  // a fill or stroke as the contract says it: a token, a gradient whose stops are tokens, or a list of either
  // an image is not in the contract (its picture is the library's asset): said, not painted grey
  // the library's image paints by layer name (its root as 'root'), from its own component imported by key: an image is
  // its asset, so a layer the library holds one on takes that one; another is said, not painted grey
  let images = null;
  const imageOf = async (layer) => {
    if (!K.image) return null;
    if (!images) {
      images = {};
      // (asked apart from the library's imports: a picture the library does not give is that image's row, never a
      // drawing put back for an unanswered import, which would hide every other row of it)
      const m = await Promise.race([either(K.image).catch(() => null), new Promise((res) => setTimeout(() => res(null), 15000))]);
      // every variant, the default first: an image layer one variant alone draws takes its picture too
      const mains = !m ? [] : m.type === 'COMPONENT_SET' ? [m.defaultVariant, ...m.children].filter(Boolean) : [m];
      const take = (n, name) => { const f = 'fills' in n && Array.isArray(n.fills) && n.fills.find((x) => x.type === 'IMAGE'); if (f && !images[name]) images[name] = f; };
      for (const main of mains) { take(main, 'root'); for (const n of main.findAll(() => true)) take(n, n.name); }
    }
    return images[layer] || null;
  };
  const paints = async (x, layer = null) => (await Promise.all([].concat(x).filter((p) => p != null).map(async (p) => {
    if (typeof p === 'string' && /^IMAGE/.test(p)) { const img = await imageOf(layer); if (!img) missing.add(`an image fill (${p})`); return img ? { ...img, scaleMode: p.split(':')[1] || img.scaleMode } : null; }
    if (!p || typeof p !== 'object' || !/^GRADIENT_/.test(p.type || '')) return solid(p);
    const stops = await Promise.all((p.stops || []).map(async (st) => {
      const v = await V(st.color); const c = colourOf((K.values || {})[st.color] ?? st.color);
      return { position: st.position, color: c ? { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2], a: c.a } : { r: 0.5, g: 0.5, b: 0.5, a: 1 }, ...(v ? { boundVariables: { color: figma.variables.createVariableAlias(v) } } : {}) };
    }));
    return { type: p.type, gradientTransform: p.transform || [[1, 0, 0], [0, 1, 0]], gradientStops: stops };
  }))).filter(Boolean);
  const solid = async (n) => { const v = await V(n); const c = colourOf((K.values || {})[n] ?? n); const p = { type: 'SOLID', color: c ? { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] } : { r: 0.5, g: 0.5, b: 0.5 }, opacity: c && !v ? c.a : 1 }; return v ? figma.variables.setBoundVariableForPaint(p, 'color', v) : p; };
  // a size in pixels: a contract also says one as fill, hug or a token, which are set once the part is placed
  const px = (x) => (typeof x === 'number' ? Math.max(x, 0.01) : null);
  // (an opacity variable holds a percent, 50, where a layer's opacity is 0 to 1: a token's value drawn unbound is scaled;
  // a raw number in the contract is already 0 to 1)
  const num = async (node, field, n) => { const v = await V(n); const raw = typeof n === 'number' ? n : (K.values || {})[n]; if (v) node.setBoundVariable(field, v); else if (typeof raw === 'number') node[field] = field === 'opacity' && typeof n === 'string' ? raw / 100 : raw; };
  // alignment and sizing words, from the one table every direction reads (rules.mjs), handed in as data
  const ALIGN = P.align, SIZE = P.size;
  const styles = {}, fonts = {}, icons = {}, sets = {}, effects = {}, toEffect = [], fillStyles = {}, toFill = [];
  const fillNames = [...new Set(els.map((e) => e.fillStyle).filter(Boolean))];
  const typos = [...new Set(els.map((e) => e.typography).filter(Boolean))], assets = [...new Set(els.map((e) => e.asset).filter(Boolean))];
  const [container] = await Promise.all([
    K.iconContainer ? tried('icon container', () => own(K.iconContainer, () => figma.importComponentSetByKeyAsync(K.iconContainer))) : null,
    ...typos.map(async (t) => { const key = K.styles && K.styles[t]; if (key) styles[key] = await tried(t, () => own(key, () => figma.importStyleByKeyAsync(key))); }),
    ...assets.map(async (a) => { if (K.icons && K.icons[a]) icons[a] = await tried(`icon ${a}`, () => own(K.icons[a], () => figma.importComponentByKeyAsync(K.icons[a]))); }),
    tried('Inter', () => figma.loadFontAsync({ family: 'Inter', style: 'Regular' })),
    // a component Figma never publishes (`_`, `.`) has no key that imports: placed from this file's own page instead
    ...Object.entries(K.sets || {}).filter(([name]) => !/^[_.]/.test(name)).map(async ([name, key]) => { sets[name] = await tried(name, () => own(key, () => figma.importComponentSetByKeyAsync(key))); }),
    ...Object.entries(K.effects || {}).map(async ([name, key]) => { effects[name] = await tried(name, () => own(key, () => figma.importStyleByKeyAsync(key))); }),
    ...fillNames.map(async (t) => { const key = K.fillStyles && K.fillStyles[t]; if (key) fillStyles[key] = await tried(t, () => own(key, () => figma.importStyleByKeyAsync(key))); }),
  ]);
  await Promise.all(Object.values(styles).filter(Boolean).map(async (st) => { const f = fontOf(st); fonts[JSON.stringify(f)] = !!f && await tried(`font of ${st.name}`, () => figma.loadFontAsync(f)) !== null; }));
  // a text no style names, by its values (rules.mjs typeValue: `literal 14/20 semibold italic IBM Plex Sans`): its
  // family's face for that weight, the first of the face names fonts use for it that loads (a font names its own faces:
  // SemiBold, Semibold, Semi Bold); none that loads is the text's typography not drawn
  const FACES = { thin: ['Thin', 'Hairline'], extralight: ['ExtraLight', 'Extra Light', 'UltraLight'], light: ['Light'], regular: ['Regular', 'Normal', 'Book', 'Roman'], medium: ['Medium'], semibold: ['SemiBold', 'Semibold', 'Semi Bold', 'DemiBold'], bold: ['Bold'], extrabold: ['ExtraBold', 'Extra Bold', 'UltraBold'], black: ['Black', 'Heavy'], extrablack: ['ExtraBlack', 'Extra Black', 'UltraBlack'] };
  const literals = {}, parsed = new Set();
  for (const t of typos) {
    const m = /^literal (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?) ([a-z]+)( italic)?(?: (.+))?$/.exec(t);
    if (!m || !m[5] || !FACES[m[3]]) continue;
    parsed.add(t);
    const family = m[5].startsWith('"') ? JSON.parse(m[5]) : m[5], italic = !!m[4];
    const faces = FACES[m[3]].flatMap((w) => (italic ? (m[3] === 'regular' ? ['Italic', `${w} Italic`] : [`${w} Italic`, `${w}Italic`]) : [w]));
    for (const style of faces) {
      const fontName = { family, style };
      if (await Promise.resolve().then(() => figma.loadFontAsync(fontName)).then(() => true, () => false)) { literals[t] = { fontName, size: +m[1], lineHeight: +m[2] }; break; }
    }
    if (!literals[t]) missing.add(`${t} (no face of ${family} for ${m[3]}${italic ? ' italic' : ''} loads)`);
  }
  // a text's style is applied at the end, all at once (it is the one call per layer left)
  const toStyle = [];
  // a part centred on its parent, once text styles have given every box its final size
  const toCentre = [];
  // placed at a point and sized, then how it follows its parent's size, once its parent has its own: a constraint
  // set while the parent was still shrinking to hug what it holds stretched the part past nothing, and Figma
  // flipped it (a focus ring mirrored, off its box)
  const toPlace = [];
  // an icon's colour: its strokes where it is drawn in strokes, else its fills
  // an instance's own props as the contract sets them (a feedback message's Danger, a label's words), by Figma's names;
  // a swap is said by the part inside it, which swapTo draws
  // every font a placed instance's words use, loaded before it is changed or appended: Figma refuses either over a
  // font not loaded ("in appendChild: unloaded font"), which a library's own components in its own file meet first
  const fontsLoaded = new Set();
  const fontsOf = async (n) => {
    const texts = n.type === 'TEXT' ? [n] : n.findAllWithCriteria ? n.findAllWithCriteria({ types: ['TEXT'] }) : [];
    for (const t of texts) {
      const names = t.fontName === figma.mixed ? (t.characters ? t.getRangeAllFontNames(0, t.characters.length) : []) : [t.fontName];
      for (const f of names) { const k = JSON.stringify(f); if (fontsLoaded.has(k)) continue; fontsLoaded.add(k); await tried(`font ${f.family} ${f.style}`, () => figma.loadFontAsync(f)); }
    }
  };
  const withProps = async (n, e) => {
    await fontsOf(n);
    const defs = n.componentProperties;
    for (const [k, v] of Object.entries(e.with || {})) {
      const key = Object.keys(defs).find((x) => bareProp(x) === k);
      if (!key) continue;
      // a swap names the component by its last name ("x" for Icon/x): set to that component's variant at the one now in
      // place (a 16 for a 16), even where the variant drawn hides it
      if (defs[key].type === 'INSTANCE_SWAP') {
        const cur = await figma.getNodeByIdAsync(defs[key].value);
        const curName = cur && (cur.parent && cur.parent.type === 'COMPONENT_SET' ? cur.parent.name : cur.name);
        const is = (name) => name === String(v) || String(name).endsWith('/' + v);
        if (is(curName)) continue;
        const cname = Object.keys(K.variants || {}).find(is);
        if (!cname) { missing.add(`${k}=${v} (not found in the library)`); continue; }
        const first = Object.values(K.variants[cname])[0];
        const got = await tried(`${cname}`, () => either(first));
        const same = (c) => cur && cur.variantProperties && c.variantProperties && Object.entries(cur.variantProperties).every(([pk, pv]) => c.variantProperties[pk] === pv);
        const to = got && got.type === 'COMPONENT_SET' ? got.children.find(same) || got.defaultVariant : got;
        if (to) n.setProperties({ [key]: to.id }); else missing.add(`${k}=${v} (its key would not import)`);
        continue;
      }
      // (a boolean word as the axis spells it: a reading says True where the design's axis says true; the same value)
      const opts = defs[key].variantOptions || [], word = opts.includes(String(v)) ? String(v) : opts.find((o) => /^(true|false)$/i.test(o) && o.toLowerCase() === String(v).toLowerCase()) || String(v);
      try { n.setProperties({ [key]: defs[key].type === 'BOOLEAN' ? v === true || v === 'True' || v === 'true' : word }); } catch (err) { missing.add(`${e.component} ${k}=${v} (${err.message})`); }
    }
  };
  // an instance inside another made the component the contract names, at the variant its props choose
  // a component drawn in this file, at the top of the page of its name
  // (never on the page being drawn: that is this component's own last drawing)
  const locals = new Map();
  const localOf = async (name) => {
    if (locals.has(name)) return locals.get(name);
    // on the page of its name, where this tool draws it: one page loaded, not the file's every page
    let hit = null;
    const pg = figma.root.children.find((x) => x.name === name && x !== page);
    if (pg) { await pg.loadAsync(); hit = pg.children.find((c) => (c.type === 'COMPONENT_SET' || c.type === 'COMPONENT') && c.name === name) || null; }
    locals.set(name, hit);
    return hit;
  };
  // a component the library hides from publishing (`_`, `.`) imports nowhere: one drawn here is placed without trying
  const hiddenName = (name) => /^[_.]/.test(name);
  // a placed component's set and variants, as its name finds them, where its key does not say it is another (an icon
  // named Checkbox beside the Checkbox set: layers.mjs keyMatches); a key the snapshot met nowhere else is its own entry
  const setOf = (e) => (sets[e.component] && keyMatches(sets[e.component].key, e.key) ? sets[e.component] : null);
  const variantsOf = (e) => {
    const vs = (K.variants || {})[e.component] || {};
    if (!e.key) return vs;
    const mine = Object.fromEntries(Object.entries(vs).filter(([, k]) => k === e.key));
    return Object.keys(mine).length ? mine : { [e.component]: e.key };
  };
  const swapTo = async (n, e) => {
    const main = await n.getMainComponentAsync();
    const owner = main && (main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : main);
    // the one it should be by key where both say one (two libraries' Buttons share a name), else by name
    if (owner && (e.key && owner.key ? owner.key === e.key : owner.name === e.component)) return;
    const vs = K.variants && K.variants[e.component] && variantsOf(e);
    if (!vs) { missing.add(`${e.component} (not found in the library)`); return; }
    const fit = (name) => Object.entries(variantValues(name)).filter(([k, v]) => String((e.with || {})[k]) === v).length;
    const name = Object.keys(vs).reduce((a, b) => (fit(b) > fit(a) ? b : a));
    // the key is the component set's when the main is a variant, the component's when it stands alone
    const got = await importMain(`${e.component} ${name}`, vs[name]);
    const comp = got && got.type === 'COMPONENT_SET' ? got.children.find((c) => c.name === name) || got.defaultVariant : got;
    if (comp) n.swapComponent(comp); else missing.add(`${e.component} (its key would not import)`);
  };
  // a value the contract gives a layer inside an instance, set only where the instance draws another: a value it
  // already draws is no override
  const boundTo = (paints) => (Array.isArray(paints) && paints[0] && paints[0].boundVariables && paints[0].boundVariables.color ? paints[0].boundVariables.color.id : null);
  // a paint the contract names on a layer inside an instance is set even where the main already has it: the library
  // read it as an override (set there by hand), and one left unset reads back as no override, so as the part gone
  // a layer's colour style, as the library paints it: set once the layer is painted (the style's paints are the colour
  // already drawn), all at once at the end with the text styles; one whose key was not found is said, not dropped
  const styleFill = (n, e, paint) => {
    if (!e.fillStyle || !('fillStyleId' in n)) return;
    const rec = K.fillStyleColours && K.fillStyleColours[e.fillStyle];
    // (an image by its kind alone, as the style records it; a part that holds no colour of its own takes the style alone,
    // derive's: a paint its layer shows at no opacity)
    const said = [].concat(paint ?? []).map((q) => (typeof q === 'string' && /^IMAGE/.test(q) ? 'IMAGE' : q));
    if (rec && said.length && JSON.stringify(rec) !== JSON.stringify(said)) { missing.add(`colour style ${e.fillStyle} (it no longer matches its colour: the colour drawn)`); return; }
    const key = K.fillStyles && K.fillStyles[e.fillStyle], st = key && fillStyles[key]; if (!st) missing.add(`colour style ${e.fillStyle}`); else if (n.fillStyleId !== st.id) toFill.push([n, st, e.fillStyle]); };
  const paintIf = async (n, field, token, force = false) => { if (typeof token !== 'string' || !(field in n)) return; const v = await V(token); if (v && boundTo(n[field]) === v.id) { if (!force) return; n[field] = [{ type: 'SOLID', color: { r: 1, g: 0, b: 1 } }]; } n[field] = [await solid(token)]; };
  // an instance's own layout where the design overrides it there (a pill's content centred in one block): its
  // alignment, gap and padding, on the auto layout its component gives it
  const layoutOver = async (n, e) => {
    if (n.type !== 'INSTANCE' || !e.layout || !n.layoutMode || n.layoutMode === 'NONE') return;
    // only what differs from what the instance already has: a value written again would stand as an override where the
    // design made none, and a raw number over a bound token would lose the token
    const dir = e.layout.direction === 'column' ? 'VERTICAL' : 'HORIZONTAL';
    if (n.layoutMode !== dir) n.layoutMode = dir;
    const pa = ALIGN[e.layout.align] || 'MIN', ca = ALIGN[e.layout.crossAlign] || 'MIN';
    if (n.primaryAxisAlignItems !== pa) n.primaryAxisAlignItems = pa;
    if (n.counterAxisAlignItems !== ca) n.counterAxisAlignItems = ca;
    const differs = async (f, t) => { const v = await V(t); if (v) return !(n.boundVariables && n.boundVariables[f] && n.boundVariables[f].id === v.id); const raw = typeof t === 'number' ? t : K.values && K.values[t]; return raw == null || n[f] !== raw; };
    if (e.layout.gap != null && await differs('itemSpacing', e.layout.gap)) await num(n, 'itemSpacing', e.layout.gap);
    const pad = e.layout.padding || {};
    for (const [side, f] of [['top', 'paddingTop'], ['end', 'paddingRight'], ['bottom', 'paddingBottom'], ['start', 'paddingLeft']]) if (pad[side] != null && await differs(f, pad[side])) await num(n, f, pad[side]);
  };
  // a placed layer's own look where the design overrides it there (a focus ring's stroke on a placed checkbox, a field's
  // bottom border on a menu's inner box): its stroke's weights, side by side, and where it is drawn, its corners, its
  // shadow and whether it clips, each only where it differs from what the layer already has. A stroke's colour alone
  // left the main's weight (a 2 px focus read back 1, one bottom side read back all four)
  const sameNum = async (n, f, t) => { const v = await V(t); if (v) return !!(n.boundVariables && n.boundVariables[f] && n.boundVariables[f].id === v.id); const raw = typeof t === 'number' ? t : K.values && K.values[t]; return raw == null || n[f] === raw; };
  const lookOver = async (n, e) => {
    const b = e.border;
    if (b && typeof b === 'object' && 'strokes' in n) {
      if (b.color) await paintIf(n, 'strokes', b.color);
      const align = (b.align || 'inside').toUpperCase();
      if ('strokeAlign' in n && n.strokeAlign !== align) n.strokeAlign = align;
      const side = (i) => (Array.isArray(b.width) ? b.width[i] : b.width ?? (b.sides || {})[['top', 'end', 'bottom', 'start'][i]] ?? 1);
      const fields = 'strokeTopWeight' in n ? ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight'] : ['strokeWeight'];
      for (const [i, f] of fields.entries()) if (!(await sameNum(n, f, side(i)))) await num(n, f, side(i));
      if (b.dash && 'dashPattern' in n) { const d = Array.isArray(b.dash) ? b.dash : [4, 4]; if (JSON.stringify(n.dashPattern) !== JSON.stringify(d)) n.dashPattern = d; }
    }
    if (e.radius != null && 'topLeftRadius' in n) for (const [i, f] of ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'].entries()) { const t = Array.isArray(e.radius) ? e.radius[i] : e.radius; if (!(await sameNum(n, f, t))) await num(n, f, t); }
    if (e.overflow != null && 'clipsContent' in n && n.clipsContent !== (e.overflow === 'hidden')) n.clipsContent = e.overflow === 'hidden';
    if (e.shadow && 'effectStyleId' in n) { if (!effects[e.shadow]) missing.add(`shadow ${e.shadow}`); else if (n.effectStyleId !== effects[e.shadow].id) toEffect.push([n, effects[e.shadow], e.shadow]); }
  };
  const override = async (n, e) => {
    await layoutOver(n, e);
    if (e.kind === 'instance' && e.component && n.type === 'INSTANCE') { await swapTo(n, e); await withProps(n, e); }
    if (e.kind === 'text' && n.type === 'TEXT') {
      await paintIf(n, 'fills', e.color);
      const words = typeof e.content === 'string' && !/^\{.*\}$/.test(e.content) ? e.content : null;
      if (words !== null && n.characters !== words && n.fontName !== figma.mixed) { await tried(`font of ${n.name}`, () => figma.loadFontAsync(n.fontName)); n.characters = words; }
    } else if (e.kind === 'graphic' && n.type === 'VECTOR') await paintIf(n, n.strokes.length ? 'strokes' : 'fills', e.background, true);
    else if (e.kind !== 'text') await paintIf(n, 'fills', e.background);
    styleFill(n, e, e.kind === 'text' ? e.color : e.background);
    // (a reading from code states what it read, not Figma's defaults: only its stroke's colour, as before)
    if (e.kind !== 'text' && !P.fromCode) await lookOver(n, e); else if (e.border && e.border.color) await paintIf(n, 'strokes', e.border.color);
    // how it is sized where the contract says otherwise than the instance (a label hugging its words in a message)
    const flowing = (x) => x && 'layoutMode' in x && x.layoutMode !== 'NONE';
    // (a layer inside an instance: never drawn in a wrapper by to-code.mjs)
    const sizes = sizingAxes(e, false).map(([k, axis]) => [axis, SIZE[e[k]]])
      .filter(([axis, want]) => want && axis in n && n[axis] !== want && (want === 'FILL' ? flowing(n.parent) : flowing(n) || n.type === 'TEXT'));
    const resize = n.type === 'TEXT' && e.autoResize && n.textAutoResize !== e.autoResize.toUpperCase();
    // a text's font is loaded only where something about it changes: a library's text is a slow load where one fails
    if (n.type === 'TEXT' && (sizes.length || resize) && (n.fontName === figma.mixed || await tried(`font of ${n.name}`, () => figma.loadFontAsync(n.fontName)) === null)) return;
    for (const [axis, want] of sizes) n[axis] = want;
    if (resize) n.textAutoResize = e.autoResize.toUpperCase();
  };
  const recolour = (n, paint) => { for (const v of 'findAll' in n ? n.findAll((x) => x.type === 'VECTOR') : n.type === 'VECTOR' ? [n] : []) { if (v.strokes.length) v.strokes = [paint]; else v.fills = [paint]; } };
  const comps = [];
  for (const variant of P.variants) {
    const nodes = {};
    // the parts that are an instance's own layers, and, by the layer each is in, those of its layers the contract
    // lists: one it does not list was hidden where it was read (a snapshot skips hidden layers inside an instance)
    const inner = new Set(), levels = new Map();
    // an instance's layer as it is now: setting the props of an instance in a slot of another rebuilds its sibling
    // instances there, and a layer found before is gone; found again by its name and number below its parent
    const alive = (n) => { try { return !!n && !n.removed && (!('children' in n) || Array.isArray(n.children)); } catch { return false; } };
    const nthOf = (id) => +((/_(\d+)$/.exec(id.split('/').pop()) || [])[1] || 1) - 1;
    const live = (id) => {
      if (!inner.has(id) || alive(nodes[id])) return nodes[id];
      const e = variant.anatomy[id], up = live(e.parent);
      return (nodes[id] = ('children' in up ? up.children.filter((c) => c.name === e.name) : [])[nthOf(id)] || up);
    };
    // parents first, by the parent chain, not the id's segments: a mapping's ids need not follow the tree
    // (multiselect input's field sits inside div, both one segment deep)
    const depth = (id, n = 0) => { const up = variant.anatomy[id] && variant.anatomy[id].parent; return up && n < 50 ? depth(up, n + 1) : n; };
    const ids = Object.keys(variant.anatomy).sort((a, b) => depth(a) - depth(b) || (variant.anatomy[a].order ?? 0) - (variant.anatomy[b].order ?? 0));
    for (const id of ids) {
      const e = variant.anatomy[id];
      // a part inside another component's instance is that component's own layer, found by its name (a repeat by
      // its number), so what the contract says of it is an override
      if (id !== 'root' && nodes[e.parent] && (inner.has(e.parent) || nodes[e.parent].type === 'INSTANCE')) {
        inner.add(id);
        const up = live(e.parent);
        const nth = nthOf(id);
        const kids = 'children' in up ? up.children : [];
        let at = kids.filter((c) => c.name === e.name)[nth];
        // an instance a swap renamed after its new component ("x" for an Icon): the instance at its place, named back
        const named = (c) => Object.values(variant.anatomy).some((x) => x.parent === e.parent && x.name === c.name);
        if (!at && e.kind === 'instance' && kids[e.order ?? 0] && kids[e.order ?? 0].type === 'INSTANCE' && !named(kids[e.order ?? 0])) { at = kids[e.order ?? 0]; at.name = e.name; }
        // not there (the instance draws another variant than the one read): an icon's colour still goes on its vectors
        if (!at) { if (e.kind === 'graphic' && e.background) recolour(up, await solid(e.background)); else missing.add(`${e.name} inside ${up.name}`); nodes[id] = up; continue; }
        if (!levels.has(e.parent)) levels.set(e.parent, new Set());
        levels.get(e.parent).add(id);
        nodes[id] = at;
        await override(at, e);
        if (e.modes) setModes(at, e, id);
        continue;
      }
      let n;
      // recorded the moment it exists, so a drawing that fails partway is this tool's to clear, not a stranger
      if (id === 'root') { n = figma.createComponent(); page.appendChild(n); n.name = variant.name; mine(n.id); }
      else if (e.kind === 'text') {
        n = figma.createText(); nodes[e.parent].appendChild(n);
        const key = K.styles && K.styles[e.typography];
        const st = key && styles[key];
        const lit = literals[e.typography];
        if (st && fonts[JSON.stringify(fontOf(st))]) toStyle.push([n, st, e.typography]);
        else if (lit) { n.fontName = lit.fontName; n.fontSize = lit.size; n.lineHeight = lit.lineHeight ? { unit: 'PIXELS', value: lit.lineHeight } : { unit: 'AUTO' }; }
        else if (!parsed.has(e.typography)) missing.add(e.typography);
        // the prop's sample where a prop sets it, else the words code drew (a required mark's *)
        n.characters = e.text || (typeof e.content === 'string' && !/^\{.*\}$/.test(e.content) ? e.content : 'Text');
        if (e.textAlign) n.textAlignHorizontal = { center: 'CENTER', end: 'RIGHT', justify: 'JUSTIFIED' }[e.textAlign] || 'LEFT';
        if (e.color) n.fills = await paints(e.color);
        styleFill(n, e, e.color);
        // how the box follows the words and where they sit; spacing and case where no style gives them
        if (e.autoResize) n.textAutoResize = e.autoResize.toUpperCase();
        // a length it is given: its box at that size, the resizing said again after (resize sets it to fixed)
        if (typeof e.width === 'number' || typeof e.height === 'number') { n.resize(typeof e.width === 'number' ? Math.max(e.width, 0.01) : n.width, typeof e.height === 'number' ? Math.max(e.height, 0.01) : n.height); if (e.autoResize) n.textAutoResize = e.autoResize.toUpperCase(); }
        if (e.verticalAlign) n.textAlignVertical = { center: 'CENTER', end: 'BOTTOM' }[e.verticalAlign] || 'TOP';
        if (e.truncate) n.textTruncation = 'ENDING';
        if (e.maxLines) n.maxLines = e.maxLines;
        const unit = (v) => (v === 'auto' ? { unit: 'AUTO' } : /%$/.test(String(v)) ? { value: parseFloat(v), unit: 'PERCENT' } : { value: +v, unit: 'PIXELS' });
        if (e.letterSpacing != null) n.letterSpacing = unit(e.letterSpacing);
        if (e.lineHeight != null) n.lineHeight = unit(e.lineHeight);
        if (e.paragraphSpacing != null) n.paragraphSpacing = e.paragraphSpacing;
        if (e.listSpacing != null) n.listSpacing = e.listSpacing;
        if (e.textCase) n.textCase = e.textCase.toUpperCase();
        if (e.textDecoration) n.textDecoration = e.textDecoration.toUpperCase();
      } else if (e.kind === 'graphic' && container && e.asset) {
        n = (container.children.find((c) => P.sizeAxis && c.name === `${P.sizeAxis}=${e.width}`) || container.defaultVariant).createInstance();
        if (e.asset && K.icons && K.icons[e.asset]) {
          const swapKey = Object.keys(n.componentProperties).find((k) => n.componentProperties[k].type === 'INSTANCE_SWAP');
          if (swapKey && icons[e.asset]) n.setProperties({ [swapKey]: icons[e.asset].id });
        } else if (e.asset) missing.add(`icon ${e.asset}`);
        if (e.background) recolour(n, await solid(e.background));
      } else if (e.kind === 'instance' && e.component) {
        // another component of the library: its instance, at the size nearest the code's (the settings' size axis,
        // valued in pixels), a photo where the code shows an image (a Content axis whose options name one); not in the library, a plain frame
        // the library's, else one drawn in this file (a component the library hides from publishing, `_`, imports
        // nowhere; drawn from its own code on its own page here, it is placed rather than a frame standing in)
        const local = !setOf(e) && (hiddenName(e.component) || !Object.keys(variantsOf(e)).length) ? await localOf(e.component) : null;
        const set = setOf(e) || (local && local.type === 'COMPONENT_SET' ? local : null);
        if (local && local.type === 'COMPONENT') { n = local.createInstance(); await withProps(n, e); }
        else if (set) {
          const opts = set.componentPropertyDefinitions;
          const pick = (v) => Object.entries(opts).filter(([, d]) => d.type === 'VARIANT').every(([k, d]) => {
            const val = v.variantProperties[k];
            // a value the contract sets for it (the props its markup shows) chooses; else by size, then the default
            if (e.with && k in e.with) return val === String(e.with[k]);
            if (P.sizeAxis && k.toLowerCase() === P.sizeAxis.toLowerCase() && d.variantOptions.every((o) => /^\d+$/.test(o)) && typeof e.width === 'number') return val === d.variantOptions.reduce((a, b) => (Math.abs(+b - e.width) < Math.abs(+a - e.width) ? b : a));
            if (/^content$/i.test(k) && d.variantOptions.some((o) => /photo|image/i.test(o))) return /photo|image/i.test(val) === !!e.image;
            return val === d.defaultValue || val === set.defaultVariant.variantProperties[k];
          });
          n = (set.children.find(pick) || set.defaultVariant).createInstance();
          await withProps(n, e);
          if (typeof e.width === 'number' && Math.round(n.width) !== Math.round(e.width)) missing.add(`${e.component} at ${e.width}px (the library's nearest is ${Math.round(n.width)})`);
        } else if (Object.keys(variantsOf(e)).length) {
          // a variant the snapshot met: the one whose pixel size (on the settings' size axis) is nearest the part's, else the first
          const vs = variantsOf(e);
          const sizeOf = (name) => { const m = P.sizeAxis && new RegExp(`(?:^|, )${P.sizeAxis.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=(\\d+)(?:,|$)`).exec(name); return m ? +m[1] : null; };
          const sized = Object.keys(vs).filter((x) => sizeOf(x) !== null);
          const name = px(e.width) && sized.length ? sized.reduce((a, b) => (Math.abs(sizeOf(b) - e.width) < Math.abs(sizeOf(a) - e.width) ? b : a)) : Object.keys(vs)[0];
          // the key is the component set's when the main is a variant, the component's when it stands alone
          const before = new Set(missing);
          const got = await importMain(`${e.component} ${name}`, vs[name]);
          const main = got && got.type === 'COMPONENT_SET' ? got.children.find((c) => c.name === name) || got.defaultVariant : got;
          if (main) n = main.createInstance();
          // its own props as the contract sets them (a feedback message's Danger, a label's words), by Figma's names
          if (main) await withProps(n, e);
          else if (await localOf(e.component)) { for (const m of [...missing]) if (!before.has(m)) missing.delete(m); const l = await localOf(e.component); n = (l.type === 'COMPONENT_SET' ? l.defaultVariant : l).createInstance(); await withProps(n, e); }
          else { n = figma.createFrame(); n.fills = []; n.resize(px(e.width) || 24, px(e.height) || px(e.width) || 24); missing.add(`${e.component} (its key would not import)`); }
        } else { n = figma.createFrame(); n.fills = []; n.resize(px(e.width) || 24, px(e.height) || px(e.width) || 24); missing.add(`${e.component} (not found in the library)`); }
      // a slot: Figma's own, its property made with it and named after it; the variants' slots of one name are one property
      // a slot with no property of this component's (one inside an instance drawn as a stand-in) is a frame
      } else if (e.kind === 'slot' && (P.slots || []).some((sl) => sl.figma === e.name)) { n = nodes.root.createSlot(); n.fills = []; }
      // a shape no icon names: a line (no width or no height, a divider) is Figma's vector, an ellipse its ellipse
      // (a vector is made with a black stroke of its own: taken off, so only the contract's border strokes it; a line a
      // stretch sizes is given its length once placed)
      else if (e.kind === 'graphic' && (e.width === 0 || e.height === 0)) { const len = px(e.width === 0 ? e.height : e.width) || 1; n = figma.createVector(); n.strokes = []; n.vectorPaths = [{ windingRule: 'NONE', data: e.width === 0 ? `M 0 0 L 0 ${len}` : `M 0 0 L ${len} 0` }]; }
      else if (e.kind === 'graphic' && e.shape === 'ellipse') { n = figma.createEllipse(); if (e.arc) n.arcData = { startingAngle: (e.arc.start * Math.PI) / 180, endingAngle: (e.arc.end * Math.PI) / 180, innerRadius: e.arc.inner || 0 }; }
      else if (e.kind === 'graphic' && e.shape === 'rectangle') n = figma.createRectangle();
      // any other graphic that holds no part (a glyph's path, a line a rotation stands up) is a vector too, never a frame,
      // which reads back as a container: its box as its path, or a line where it has a length one way only. A Figma
      // contract's only, with no icon or corners: a code reading's mark or an icon with no container stays a box
      else if (e.kind === 'graphic' && !P.fromCode && !e.asset && e.radius == null && !e.full && !ids.some((x) => variant.anatomy[x].parent === id)) {
        const w = px(e.width), h = px(e.height);
        n = figma.createVector(); n.strokes = [];
        n.vectorPaths = [{ windingRule: w && h ? 'NONZERO' : 'NONE', data: w && h ? `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z` : h ? `M 0 0 L 0 ${h}` : `M 0 0 L ${w || 24} 0` }];
      }
      else { n = figma.createFrame(); n.fills = []; }
      if (n.type === 'INSTANCE') await fontsOf(n);
      if (id !== 'root') n.name = e.name;
      if (e.opacity != null) await num(n, 'opacity', e.opacity);
      if (e.blend) n.blendMode = e.blend.toUpperCase();
      if (e.mask) n.isMask = true;
      // an icon placed as an instance (a button's Icon/house) takes its colour on its paths, as one drawn as a graphic
      // does: the instance itself has no fill, and the code's colour went nowhere
      // read from code only (a Figma contract's instance background is its own fill override); a token, not a gradient;
      // only one with no fill of its own: another component's box fill (an avatar's circle) is its background, not its paths'
      if (P.fromCode && e.kind === 'instance' && typeof e.background === 'string' && n.type === 'INSTANCE' && !(Array.isArray(n.fills) && n.fills.some((f) => f.visible !== false && (f.opacity ?? 1) > 0))) recolour(n, await solid(e.background));
      // a Figma contract's placed instance: its own fill, stroke, corners, shadow and clipping, where the design overrides
      // them (derive keeps on an instance only what differs from its component: ownStyling)
      if (!P.fromCode && e.kind === 'instance' && n.type === 'INSTANCE') { await paintIf(n, 'fills', e.background); styleFill(n, e, e.background); await lookOver(n, e); }
      if (e.rotation) n.rotation = e.rotation;
      // a placed instance's own bounds (a dialog's modal at most 556 wide): a frame drawn here takes them with its layout
      if (n.type === 'INSTANCE') for (const f of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight']) if (e[f] != null) await num(n, f, e[f]);
      await layoutOver(n, e);
      if (['FRAME', 'COMPONENT', 'SLOT', 'VECTOR', 'ELLIPSE', 'RECTANGLE'].includes(n.type)) {
        if (e.layout) {
          n.layoutMode = e.layout.direction === 'column' ? 'VERTICAL' : 'HORIZONTAL';
          n.primaryAxisSizingMode = 'AUTO'; n.counterAxisSizingMode = 'AUTO';
          n.primaryAxisAlignItems = ALIGN[e.layout.align] || 'MIN'; n.counterAxisAlignItems = ALIGN[e.layout.crossAlign] || 'MIN';
          if (e.layout.gap != null) await num(n, 'itemSpacing', e.layout.gap);
          if (e.layout.firstOnTop) n.itemReverseZIndex = true;
          if (e.layout.wrap) { n.layoutWrap = 'WRAP'; if (e.layout.crossGap != null) await num(n, 'counterAxisSpacing', e.layout.crossGap); }
          const pad = e.layout.padding || {};
          for (const [side, f] of [['top', 'paddingTop'], ['end', 'paddingRight'], ['bottom', 'paddingBottom'], ['start', 'paddingLeft']]) if (pad[side] != null) await num(n, f, pad[side]);
          // a box with nothing inside: its measured size, not Figma's 100 for an empty auto layout
          if (px(e.width) && !ids.some((x) => variant.anatomy[x].parent === id)) { n.primaryAxisSizingMode = 'FIXED'; n.counterAxisSizingMode = 'FIXED'; n.resize(px(e.width), px(e.height) || px(e.width)); }
          // a size kept only while empty (derive's whileEmpty) is no minimum: the empty frame is drawn at it and keeps
          // hugging, as the source's empty slot does (a filled one hugs what it holds)
          const onlyEmpty = new Set(e.whileEmpty || []);
          for (const f of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight']) if (e[f] != null && !onlyEmpty.has(f)) await num(n, f, e[f]);
          if (onlyEmpty.size && !ids.some((x) => variant.anatomy[x].parent === id)) {
            const modes = [n.primaryAxisSizingMode, n.counterAxisSizingMode];
            n.resize(onlyEmpty.has('minWidth') ? px(e.minWidth) : n.width, onlyEmpty.has('minHeight') ? px(e.minHeight) : n.height);
            [n.primaryAxisSizingMode, n.counterAxisSizingMode] = modes;
          }
        } else if (n.type !== 'VECTOR' && n.type !== 'ELLIPSE' && ids.some((x) => variant.anatomy[x].parent === id && !variant.anatomy[x].absolute)) {
          // a box no flex lays out that holds parts: they flow side by side, as inline content does (a label and
          // its required mark), never stacked at one point
          n.layoutMode = 'HORIZONTAL'; n.primaryAxisSizingMode = 'AUTO'; n.counterAxisSizingMode = 'AUTO'; n.counterAxisAlignItems = 'CENTER';
        // a line's length is its path's, and it has no width to give
        // (a box that fills one way still takes its length the other: the fill is set with the parent's layout)
        } else if ((px(e.width) || px(e.height)) && n.type !== 'VECTOR') n.resize(px(e.width) || n.width, px(e.height) || px(e.width) || n.height);
        n.fills = e.background ? await paints(e.background, id === 'root' ? 'root' : (e.name || id.slice(id.lastIndexOf('/') + 1))) : [];
        styleFill(n, e, e.background);
        // one radius, or one per corner in Figma's order: top left, top right, bottom right, bottom left
        // an ellipse has no corners: a radius a variant kept from a rectangle is not drawn
        if (e.radius != null && 'topLeftRadius' in n) for (const [i, f] of ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'].entries()) await num(n, f, Array.isArray(e.radius) ? e.radius[i] : e.radius);
        if (e.border) {
          n.strokes = e.border.color ? await paints(e.border.color) : [];
          // where the contract says (a divider's on its centre), else inside; taking room in the layout only where it says
          n.strokeAlign = (e.border.align || 'inside').toUpperCase();
          if ('layoutMode' in n && n.layoutMode !== 'NONE') n.strokesIncludedInLayout = !!e.border.inLayout;
          // (a dash code reads only as dashed, CSS stating no length: drawn at a pattern of its own, compared as dashed)
          if (e.border.dash) n.dashPattern = Array.isArray(e.border.dash) ? e.border.dash : [4, 4];
          if (e.border.cap && 'strokeCap' in n) n.strokeCap = e.border.cap.toUpperCase();
          const side = (i) => (Array.isArray(e.border.width) ? e.border.width[i] : e.border.width ?? (e.border.sides || {})[['top', 'end', 'bottom', 'start'][i]] ?? 1);
          // a vector has one weight, a box one a side
          // (its overall weight set first: a box whose overall weight is 0 draws an outside stroke on one side and leaves it
          // out of what renders, a list item's bottom line gone)
          if ('strokeTopWeight' in n) { n.strokeWeight = 1; for (const [i, f] of ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight'].entries()) await num(n, f, side(i)); } else await num(n, 'strokeWeight', side(0));
        }
        if (e.smoothing && 'cornerSmoothing' in n) n.cornerSmoothing = e.smoothing;
        // Figma's frames clip by default; the contract says which do
        if ('clipsContent' in n) n.clipsContent = e.overflow === 'hidden';
        // its shadow: the library's effect style, bound at the end with the text styles; an unmatched one, said
        if (e.shadow) { if (effects[e.shadow]) toEffect.push([n, effects[e.shadow], e.shadow]); else missing.add(`shadow ${e.shadow}`); }
      }
      if (id !== 'root' && n.parent !== nodes[e.parent]) nodes[e.parent].appendChild(n);
      // a size said as intent, set once the part has its parent: fill the parent's flow, hug what it holds, a fixed
      // number, or a token's value, bound
      const flows = (x) => x && 'layoutMode' in x && x.layoutMode !== 'NONE';
      for (const [k, axis] of sizingAxes(e, P.turned.includes(id))) {
        const sz = e[k];
        if (sz === 'fill') { if (id !== 'root' && flows(nodes[e.parent]) && !e.absolute && e.position !== 'absolute') n[axis] = SIZE.fill; }
        else if (sz === 'hug') { if (flows(n) || n.type === 'TEXT') n[axis] = SIZE.hug; }
        // a number in an auto layout, which would hug what it holds: fixed at that size
        else if (typeof sz === 'number' && flows(n)) { n[axis] = 'FIXED'; n.resize(k === 'width' ? px(sz) : n.width, k === 'height' ? px(sz) : n.height); }
        // an instance at another size than its component's (a 16 icon drawn at 12): resized, its layers following
        else if (typeof sz === 'number' && n.type === 'INSTANCE' && Math.abs(n[k] - sz) > 0.01) n.resize(k === 'width' ? px(sz) : n.width, k === 'height' ? px(sz) : n.height);
        else if (typeof sz === 'string') { const v = await V(sz); const raw = (K.values || {})[sz]; if (v) n.setBoundVariable(k, v); else if (typeof raw === 'number') { n.resize(k === 'width' ? raw : n.width, k === 'height' ? raw : n.height); if (n.type === 'TEXT' && e.autoResize) n.textAutoResize = e.autoResize.toUpperCase(); } }
      }
      // placed at a point in its parent (a thumb over its track): absolute in Figma's auto layout, kept at its order
      // among its siblings, which is what it paints over (a spinner under the content it sits behind)
      if (id !== 'root' && e.absolute && nodes[e.parent].layoutMode && nodes[e.parent].layoutMode !== 'NONE') { n.layoutPositioning = 'ABSOLUTE'; n.x = e.absolute.x; n.y = e.absolute.y; }
      // in a box no layout places, at its point
      else if (id !== 'root' && e.absolute) { n.x = e.absolute.x; n.y = e.absolute.y; }
      // a mirror about the layer's own point, as Figma's matrix keeps it (its x stays where the snapshot read it)
      // (the contract's x and y are the box's near edge, as CSS's; Figma's matrix takes the far one as its origin)
      if (e.flip && !e.rotation && 'relativeTransform' in n) { try { n.relativeTransform = e.flip === 'x' ? [[-1, 0, n.x + n.width], [0, 1, n.y]] : [[1, 0, n.x], [0, -1, n.y + n.height]]; } catch { missing.add(`${e.name || id} (its mirror)`); } }
      if (e.modes) setModes(n, e, id);
      if (id !== 'root' && (e.absolute || e.constraints)) toPlace.push([n, e]);
      nodes[id] = n;
    }
    // a layer the contract does not list is hidden only inside an instance it keeps whole (keptWhole): elsewhere it is
    // the component's own, left as it shows (a text input's field beside its overridden label)
    const wholeAt = (pid) => !variant.whole || variant.whole.some((w) => pid === w || pid.startsWith(w + '/'));
    for (const [pid, kids] of levels) { if (!wholeAt(pid)) continue; const kept = new Set([...kids].map((k) => live(k).id)); for (const c of live(pid).children) if (!kept.has(c.id)) c.visible = false; }
    // placed out of the flow with no point given (a focus ring round its box): centred on its parent, above the rest
    for (const id of ids) {
      const e = variant.anatomy[id], n = nodes[id], up = nodes[e.parent];
      if (id === 'root' || inner.has(id) || e.absolute || e.position !== 'absolute' || n === up || !up.layoutMode || up.layoutMode === 'NONE') continue;
      up.appendChild(n); n.layoutPositioning = 'ABSOLUTE'; toCentre.push([n, up]);
    }
    comps.push({ node: nodes.root, anatomy: variant.anatomy, nodes, inner, cell: variant.cell });
  }
  await Promise.all([...toStyle.map(([n, st, t]) => tried(t, () => n.setTextStyleIdAsync(st.id))), ...toEffect.map(([n, st, t]) => tried(t, () => n.setEffectStyleIdAsync(st.id))), ...toFill.map(([n, st, t]) => tried(t, () => n.setFillStyleIdAsync(st.id)))]);
  // where it stands in its parent: pinned to the end or bottom, from there; centred, as code read it (centred within
  // 0.75 px), at the centre; a Figma contract's layer where it sat. Set again once the set is built: a parent that
  // hugs its words still changes size after (its properties made), and a centre constraint moves the layer with it
  // (a spinner left of its button)
  const at_ = (n, e) => {
    const c = e.constraints || {}, up = n.parent, at = e.absolute;
    const x = c.horizontal === 'center' && P.fromCode ? Math.round((up.width - n.width) / 2) : c.horizontal === 'max' && at.end != null ? up.width - at.end - n.width : at.x;
    const y = c.vertical === 'center' && P.fromCode ? Math.round((up.height - n.height) / 2) : c.vertical === 'max' && at.bottom != null ? up.height - at.bottom - n.height : at.y;
    // a mirrored layer's x (or y) is its matrix's origin, its box's far edge
    n.x = e.flip === 'x' && !e.rotation ? x + n.width : x; n.y = e.flip === 'y' && !e.rotation ? y + n.height : y;
  };
  for (const [n, e] of toPlace) {
    if (e.absolute) {
      // its size: stretched, its parent's less both offsets; else its own
      const c = e.constraints || {}, up = n.parent, at = e.absolute;
      const w = c.horizontal === 'stretch' && at.end != null ? up.width - at.x - at.end : typeof e.width === 'number' ? e.width : n.width;
      const h = c.vertical === 'stretch' && at.bottom != null ? up.height - at.y - at.bottom : typeof e.height === 'number' ? e.height : n.height;
      // (resize sets a text's resizing to fixed: said again after, as where it is first sized)
      if ('resize' in n && n.type !== 'VECTOR' && (Math.abs(w - n.width) > 0.01 || Math.abs(h - n.height) > 0.01)) { n.resize(px(w), px(h)); if (n.type === 'TEXT' && e.autoResize) n.textAutoResize = e.autoResize.toUpperCase(); }
      // a line unturned that stretches along its length: its path that long (a divider across its box, drawn 1 px long
      // and read back 159 px short of its end)
      else if (n.type === 'VECTOR' && !e.rotation && (e.height === 0 || e.width === 0)) {
        const along = e.height === 0 ? (c.horizontal === 'stretch' && at.end != null ? w : null) : (c.vertical === 'stretch' && at.bottom != null ? h : null);
        if (along > 0) n.vectorPaths = [{ windingRule: 'NONE', data: e.height === 0 ? `M 0 0 L ${along} 0` : `M 0 0 L 0 ${along}` }];
      }
      // pinned to its parent's end or bottom: from there; centred, as code read it (centred within 0.75 px): at the centre;
      // a Figma contract's centred layer where it sat, as its centre constraint keeps it
      at_(n, e);
    }
    if (e.constraints && 'constraints' in n) n.constraints = { horizontal: (e.constraints.horizontal || 'min').toUpperCase(), vertical: (e.constraints.vertical || 'min').toUpperCase() };
  }
  for (const [n, up] of toCentre) { n.x = Math.round((up.width - n.width) / 2); n.y = Math.round((up.height - n.height) / 2); }
  // one variant is a component, never a set of one
  const single = comps.length === 1;
  const set = single ? comps[0].node : figma.combineAsVariants(comps.map((c) => c.node), page);
  set.name = P.name;
  mine(set.id);
  // the grid the plan placed each variant in, as Figma's grid auto layout lays it out, 24 apart and 24 in; a Figma
  // without grid layout gets the same grid by hand, and the result says which, and why
  let layout = 'one variant';
  // one variant that fills the room it is given: fixed at that room (its canvas), as a set's track would hold it
  if (single) for (const [k, axis] of [['width', 'layoutSizingHorizontal'], ['height', 'layoutSizingVertical']]) {
    const room = comps[0].anatomy.root[k] === 'fill' && (comps[0].anatomy.root.canvas || {})[k];
    if (!room) continue;
    const other = k === 'width' ? 'layoutSizingVertical' : 'layoutSizingHorizontal', was = set.layoutMode && set.layoutMode !== 'NONE' ? set[other] : null;
    if (was) set[axis] = 'FIXED';
    set.resize(k === 'width' ? room : set.width, k === 'height' ? room : set.height);
    // a resize fixes both axes: the other goes back to what it was (a hug stays a hug)
    if (was) set[other] = was;
  }
  if (!single) {
  try {
    set.layoutMode = 'GRID';
    set.gridRowCount = P.rows; set.gridColumnCount = P.cols;
    set.gridRowGap = 24; set.gridColumnGap = 24;
    set.paddingTop = set.paddingRight = set.paddingBottom = set.paddingLeft = 24;
    set.gridRowSizes = Array.from({ length: P.rows }, () => ({ type: 'HUG' })); set.gridColumnSizes = Array.from({ length: P.cols }, () => ({ type: 'HUG' }));
    set.layoutSizingHorizontal = 'HUG'; set.layoutSizingVertical = 'HUG';
    for (const c of comps) set.appendChildAt(c.node, c.cell[0], c.cell[1]);
    // a variant that fills its set fills its cell, the track fixed at the size the library's set gives it (else the
    // most its variants draw at)
    for (const [k, axis, tracks, at] of [['width', 'layoutSizingHorizontal', 'gridColumnSizes', 1], ['height', 'layoutSizingVertical', 'gridRowSizes', 0]]) {
      if (!comps.some((c) => c.anatomy.root[k] === 'fill')) continue;
      set[tracks] = set[tracks].map((_, j) => ({ type: 'FIXED', value: Math.max(1, ...comps.filter((c) => c.cell[at] === j).map((c) => (c.anatomy.root.canvas || {})[k] ?? c.node[k])) }));
      for (const c of comps) if (c.anatomy.root[k] === 'fill') c.node[axis] = 'FILL';
    }
    layout = 'grid';
  } catch (e) {
    layout = 'by hand: ' + (e && e.message || e);
    set.layoutMode = 'NONE';
    const w = [], h = [];
    for (const c of comps) { w[c.cell[1]] = Math.max(w[c.cell[1]] || 0, c.node.width); h[c.cell[0]] = Math.max(h[c.cell[0]] || 0, c.node.height); }
    const at = (sizes, i) => 24 + sizes.slice(0, i).reduce((t, x) => t + (x || 0) + 24, 0);
    for (const c of comps) { c.node.x = at(w, c.cell[1]); c.node.y = at(h, c.cell[0]); }
    set.resizeWithoutConstraints(Math.max(...comps.map((c) => c.node.x + c.node.width)) + 24, Math.max(...comps.map((c) => c.node.y + c.node.height)) + 24);
  }
  set.fills = []; set.strokes = [{ type: 'SOLID', color: { r: 0.59, g: 0.28, b: 1 } }]; set.dashPattern = [10, 5]; set.cornerRadius = 5;
  }
  // properties in the contract's order, which the panel keeps (figma-standard rules 1 and 5: a boolean, then what it
  // reveals); a variant axis is placed by Figma, and only a drag in its panel moves one
  const refs = {};
  // each instance swap property, its default the component of the first instance it may swap that no property before
  // it has: Figma swaps a linked instance to its property's default, so each size's icon has its own (Icon (16), (20))
  const mainOf = new Map(), defaults = new Map();
  for (const c of comps) for (const [id, e] of Object.entries(c.anatomy)) if (e.swapProps && !c.inner.has(id) && c.nodes[id].type === 'INSTANCE') mainOf.set(c.nodes[id], ((await c.nodes[id].getMainComponentAsync()) || {}).id);
  for (const name of P.order || []) {
    const t = P.text.find((x) => x.figma === name), b = P.booleans.find((x) => x.figma === name), sw = (P.swaps || []).find((x) => x.figma === name);
    if (t) refs[t.figma] = set.addComponentProperty(t.figma, 'TEXT', t.default || t.figma);
    else if (b) refs[b.figma] = set.addComponentProperty(b.figma, 'BOOLEAN', b.default);
    else if (sw) {
      const taken = new Set(defaults.values());
      const first = comps.flatMap((c) => Object.entries(c.anatomy).map(([id, e]) => [c.nodes[id], e])).find(([n, e]) => e.swapProps && e.swapProps.includes(sw.figma) && mainOf.get(n) && !taken.has(mainOf.get(n)));
      if (first) { defaults.set(sw.figma, mainOf.get(first[0])); refs[sw.figma] = set.addComponentProperty(sw.figma, 'INSTANCE_SWAP', mainOf.get(first[0])); } else missing.add(`${sw.figma} (no instance of it drawn)`);
    }
  }
  // each slot's property, made with its layer, given the slot's settings and description
  for (const sl of P.slots || []) {
    const key = Object.keys(set.componentPropertyDefinitions).find((k) => bareProp(k) === sl.figma && set.componentPropertyDefinitions[k].type === 'SLOT');
    if (!key) { missing.add(`slot ${sl.figma} (no layer of it drawn)`); continue; }
    // a preferred instance is the snapshot's key of a component set or a component, which Figma takes with its type
    const preferred = [];
    for (const k of sl.preferred) {
      // given the same time as any import: one that never answers is said, not waited on
      const got = await tried(`${sl.figma}'s preferred instance ${k}`, () => either(k).then((n) => n.type));
      if (got) preferred.push({ type: got, key: k });
    }
    const edit = { ...(sl.settings ? { slotSettings: sl.settings } : {}), ...(sl.description ? { description: sl.description } : {}), ...(preferred.length ? { preferredValues: preferred } : {}) };
    if (Object.keys(edit).length) set.editComponentProperty(key, edit);
  }
  for (const c of comps) for (const [id, e] of Object.entries(c.anatomy)) {
    // a layer inside an instance is the other component's: Figma links none of them to this one's props
    if (c.inner.has(id)) continue;
    const n = c.nodes[id];
    // a link Figma refuses is reported with its layer, as an update in place reports it, and the drawing goes on
    const link = (r) => { try { n.componentPropertyReferences = { ...(n.componentPropertyReferences || {}), ...r }; } catch (err) { missing.add(`${e.name}'s link to ${Object.keys(r)[0]} (${String(err.message || err).split('\n')[0]})`); } };
    if (e.text && refs[e.text]) link({ characters: refs[e.text] });
    if (e.shownBy && refs[e.shownBy]) link({ visible: refs[e.shownBy] });
    const swappedBy = e.swapProps && n.type === 'INSTANCE' && e.swapProps.find((f) => refs[f] && defaults.get(f) === mainOf.get(n));
    if (swappedBy) link({ mainComponent: refs[swappedBy] });
    else if (e.swapProps && n.type === 'INSTANCE') missing.add(`${e.name}'s swap (${e.swapProps.join(' or ')}: no default is its component)`);
    // a slot's default contents are the person's to replace, and Figma exposes none of them
    const inSlot = (x) => { for (let up = x.parent; up && up.type !== 'COMPONENT'; up = up.parent) if (up.type === 'SLOT') return true; return false; };
    // Figma exposes one only where its component's props reference its layers, and has no call that asks: one with
    // props beyond its variants is offered, and one Figma refuses could be exposed in no file
    if (n.type === 'INSTANCE' && !inSlot(n) && Object.values(n.componentProperties).some((x) => x.type !== 'VARIANT')) { try { n.isExposedInstance = true; } catch { /* its props reference none of its layers */ } }
  }
  // the set at the page's origin, where it is looked for
  set.x = 0; set.y = 0;
  page.selection = [set];
  for (const [n, e] of toPlace) if (e.absolute && !n.removed) at_(n, e);
  return { set: set.id, parts: comps.map((c) => c.node.id), variants: comps.length, layout, props: Object.keys(set.componentPropertyDefinitions), missing: [...missing] };
};

/* Each named component's variants, as the snapshot's specs met them: an
   instance records its main component ("Icon/check / Size=20") and its key,
   which imports without the library file open. */
export function variantKeys(dir, names, tails = []) {
  const out = {};
  const wanted = (n) => names.includes(n) || tails.includes(n.split('/').pop());
  const walk = (v) => {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (!v || typeof v !== 'object') return;
    if (typeof v.instanceOf === 'string' && v.instanceOfKey) {
      // the set as every reader of `instanceOf` resolves it (graph.cjs nameOf), asked for by name or by its last
      // name, as a swap names it ("x" for Icon/x); the variant's name is what follows it
      const set = nameOf(v.instanceOf, wanted);
      if (wanted(set)) (out[set] = out[set] || {})[set === v.instanceOf ? set : v.instanceOf.slice(set.length + 3)] = v.instanceOfKey;
    }
    Object.values(v).forEach(walk);
  };
  if (names.length || tails.length) for (const { spec } of req('../snapshot/store.cjs').readSpecs(dir, { compact: true })) walk(spec);
  return out;
}

/* The instances whose insides a contract keeps whole: derive lists an instance's layers that equal its component's
   own only where one of the component's layers is hidden there (a layer not listed is then hidden); elsewhere it keeps
   only the overrides, and a layer not listed is the component's own, showing. Told apart by trimming again: the insides
   lose a layer only where they were kept whole. */
export function keptWhole(anatomy, mains) {
  // derive's wholeIn, the one cut: a drawing draws the design, so the design's own equivalences (no reading's)
  return [...req('./derive.cjs').wholeIn(anatomy, mains)];
}

/* The plan as the plugin gets it: each distinct element once, a variant's anatomy its indices. */
export function pluginCode(contract, keys, { before = '', after = '', failed = '', axisOrder = [], sizeAxis = null, mains = null, whole = null } = {}) {
  const p = plan(contract, { axisOrder }), table = [], at = new Map();
  const norm = (n) => String(n).split(',').map((x) => x.trim()).sort().join(', ');
  const ref = (e) => { const j = JSON.stringify(e); if (!at.has(j)) { at.set(j, table.length); table.push(e); } return at.get(j); };
  // the size axis by the library's settings' name (sizeAxis), carried to the drawing; none named, no variant is picked by size
  const packed = { ...p, sizeAxis, turned: [...turnedParts(contract)], elements: table, variants: p.variants.map((v) => ({ name: v.name, cell: v.cell, ...(whole && whole[norm(v.name)] ? { whole: whole[norm(v.name)] } : mains && { whole: keptWhole(v.anatomy, mains) }), anatomy: Object.fromEntries(Object.entries(v.anatomy).map(([id, e]) => [id, ref(e)])) })) };
  // a layer hidden inside an instance is one to draw and match too: the snapshot's walk, run in the same plugin
  // before (the update's live read, the audit), leaves Figma skipping them
  return `figma.skipInvisibleInstanceChildren = false;\n${before}const P = ${JSON.stringify(packed)}; for (const v of P.variants) for (const id in v.anatomy) v.anatomy[id] = P.elements[v.anatomy[id]];\nconst parseColour = ${parseColour.toString()};
const variantValues = ${variantValues.toString()};
const bareProp = ${bareProp.toString()};
const styleIdsOf = ${styleIdsOf.toString()};
const keyMatches = ${keyMatches.toString()};
const sizingAxes = ${sizingAxes.toString()};
let __res; try { __res = await (${RUNTIME.toString()})(P, ${JSON.stringify(keys)}${before ? ', __page, typeof __given !== \'undefined\' ? __given : [], typeof __started !== \'undefined\' ? __started : globalThis.__drawingStarted' : ''});\n${after}} catch (e) { ${failed} throw e; }\nreturn __res;`;
}

/* The names a plan needs keys for: its text styles and icons. */
/* A value names a variable where it has a group (Colour/Primary) or is one of the project's variables by name (a
   library whose variables sit at the top of their collection: "layer-hover (contextual)"); anything else is a literal. */
export const varNamer = (names = []) => { const known = new Set(names); return (t) => typeof t === 'string' && (t.includes('/') || known.has(t)); };

/* The styles a layer uses, any kind of layer: its text style, effect, fill and stroke styles, a text's per run where
   they are mixed. One reading for both walks that look for them, the drawing's own-file scan (RUNTIME) and the library
   lookup (LOOKUP), written into each one's plugin code. */
export const styleIdsOf = (n) => {
  const out = [];
  for (const f of ['textStyleId', 'effectStyleId', 'fillStyleId', 'strokeStyleId']) {
    if (!(f in n) || (f === 'textStyleId' && n.type !== 'TEXT')) continue;
    if (typeof n[f] === 'string') { if (n[f]) out.push(n[f]); }
    else if (n.type === 'TEXT' && (f === 'textStyleId' || f === 'fillStyleId')) for (const seg of n.getStyledTextSegments([f])) if (seg[f]) out.push(seg[f]);
  }
  return out;
};

/* Each colour style's colour as the snapshot records it, in the contract's words: its paints, a colour clear in every
   mode left out (derive leaves a fill that paints nothing out, the style kept alone). The drawing sets a style only where
   this equals the part's colour: one edited since is drawn as its colour and said, never the style's old colour. */
export function styleColours(tokenFile, names) {
  const clear = (c) => { const x = parseColour(String(c)); return !!x && x[3] < 0.5 / 255; };
  const modes = (n) => { const vs = Object.values((tokenFile && tokenFile.collections) || {}).flatMap((col) => Object.values(col.values || {}).filter((m) => m && Object.hasOwn(m, n)).map((m) => m[n])); return vs.length ? vs : [n]; };
  return Object.fromEntries(((tokenFile && tokenFile.paintStyles) || []).filter((x) => names.includes(x.name))
    .map((x) => [x.name, (x.paints || []).map((q) => (q.type === 'SOLID' ? q.color : q.type === 'IMAGE' ? 'IMAGE' : q)).filter((c) => !(typeof c === 'string' && modes(c).every(clear)))]));
}

export function needs(p, isVar = varNamer()) {
  const els = p.variants.flatMap((v) => Object.values(v.anatomy));
  const vars = new Set();
  for (const e of els) for (const t of [...[e.background, e.color, e.border && e.border.color].flat().flatMap((p) => (p && p.stops ? p.stops.map((st) => st.color) : [p])), ...[].concat((e.border && e.border.width) || []), ...[].concat(e.radius ?? []), e.opacity, e.layout && e.layout.gap, e.layout && e.layout.crossGap, ...Object.values((e.layout && e.layout.padding) || {}), e.width, e.height, e.minWidth, e.maxWidth, e.minHeight, e.maxHeight].flat()) if (isVar(t)) vars.add(t);
  return { styles: [...new Set(els.map((e) => e.typography).filter(Boolean))], icons: [...new Set(els.map((e) => e.asset).filter(Boolean))], vars: [...vars], components: [...new Set(els.filter((e) => e.kind === 'instance' && e.component).map((e) => e.component))], swaps: [...new Set(els.flatMap((e) => Object.values(e.with || {})).filter((v) => typeof v === 'string'))], effects: [...new Set(els.map((e) => e.shadow).filter((x) => x && !/\(/.test(x)))], fillStyles: [...new Set(els.map((e) => e.fillStyle).filter(Boolean))] };
}

/* In the library file: the keys of the text styles, icons and icon container
   named, found where the library uses them (a text node in that style, an
   instance of that icon), since a style or icon another library owns is not
   among this file's own. Passed to the service's /exec. */
/** Each mode axis's collections, as the drawing sets a layer's mode on them: { axis: [{ collection, key, names }] },
 *  `key` one variable of the collection, imported to reach it (one hidden from publishing cannot be), `names` its modes
 *  by the contract's spelling. */
export function modeSets(tokenFile) {
  const MODES = createRequire(import.meta.url)('../tokens/modes.cjs');
  const cols = Object.entries((tokenFile && tokenFile.collections) || {});
  return Object.fromEntries(MODES.axesOfTokens(tokenFile).map((a) => [a.key, cols.filter(([n]) => (a.names || []).includes(n) || a.members.includes(MODES.slug(n)))
    .map(([n, col]) => ({ collection: n, key: (Object.entries(col.keys || {}).find(([v]) => !(col.hidden || []).includes(v)) || [])[1], names: Object.fromEntries((col.modes || []).map((m) => [MODES.slug(m), m])) }))
    ]));
}

const LOOKUP = async (want) => {
  await figma.loadAllPagesAsync();
  const styles = {}, icons = {}, vars = {}, sets = {}, swaps = {}, fillStyles = {};
  let container = null;
  // a variable's key from what the library's own layers are bound to (listing a library's variables hung)
  const ids = new Set();
  const collectIds = (v) => { if (!v) return; if (Array.isArray(v)) v.forEach(collectIds); else if (typeof v === 'object') { if (v.type === 'VARIABLE_ALIAS' && v.id) ids.add(v.id); else Object.values(v).forEach(collectIds); } };
  if (want.vars && want.vars.length) {
    for (const n of figma.root.findAll((x) => x.type === 'COMPONENT' || x.type === 'FRAME' || x.type === 'TEXT' || x.type === 'INSTANCE' || x.type === 'VECTOR')) {
      collectIds(n.boundVariables);
      if (Array.isArray(n.fills)) for (const f of n.fills) collectIds(f.boundVariables);
      if (Array.isArray(n.strokes)) for (const f of n.strokes) collectIds(f.boundVariables);
    }
    for (const v of await Promise.all([...ids].map((id) => figma.variables.getVariableByIdAsync(id)))) if (v && want.vars.includes(v.name) && !vars[v.name]) vars[v.name] = v.key;
  }
  // a colour style's key: the file's own by name, then one lent by another library where a layer here paints with it
  if (want.fillStyles && want.fillStyles.length) {
    for (const ps of await figma.getLocalPaintStylesAsync()) if (want.fillStyles.includes(ps.name) && !fillStyles[ps.name]) fillStyles[ps.name] = ps.key;
    // (every layer of the file, any kind, read as the drawing reads a layer's styles: styleIdsOf)
    const seen = new Set();
    walk: for (const n of want.fillStyles.some((x) => !fillStyles[x]) ? figma.root.findAll(() => true) : []) {
      for (const id of styleIdsOf(n)) {
        if (seen.has(id)) continue;
        seen.add(id);
        const st = await figma.getStyleByIdAsync(id);
        if (st && st.type === 'PAINT' && want.fillStyles.includes(st.name) && !fillStyles[st.name]) fillStyles[st.name] = st.key;
        if (want.fillStyles.every((x) => fillStyles[x])) break walk;
      }
    }
  }
  // a swap's value no instance in the snapshot carries the key of (a toggle's sun, set by its prop alone): its set
  if (want.swaps && want.swaps.length) for (const n of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] })) if (want.swaps.some((t) => n.name === t || n.name.endsWith('/' + t)) && !swaps[n.name]) swaps[n.name] = n.key;
  for (const n of figma.root.findAllWithCriteria({ types: ['TEXT', 'INSTANCE', 'COMPONENT_SET'] })) {
    if (n.type === 'COMPONENT_SET' && n.name === want.container && !container) container = n.key;
    if ((n.type === 'COMPONENT_SET') && (want.components || []).includes(n.name) && !sets[n.name]) sets[n.name] = n.key;
    if (n.type === 'TEXT' && typeof n.textStyleId === 'string' && n.textStyleId) { const st = await figma.getStyleByIdAsync(n.textStyleId); if (st && want.styles.includes(st.name) && !styles[st.name]) styles[st.name] = st.key; }
    if (n.type === 'INSTANCE' && want.icons.length) { const mc = await n.getMainComponentAsync(); if (mc && want.icons.includes(mc.name) && !icons[mc.name]) icons[mc.name] = mc.key; }
    if (container && Object.keys(styles).length === want.styles.length && Object.keys(icons).length === want.icons.length) break;
  }
  return { styles, icons, iconContainer: container, vars, sets, swaps, fillStyles };
};

/* Where a drawing goes: a page of the component's own name in the scratch file,
   made if missing and put in alphabetical order, at 0,0, so nothing on another page is touched. The page records
   the drawings this tool made, by node id (a copy someone makes keeps the
   name, never the id), and anything on it this tool did not draw refuses the
   run. The last drawing of the component is replaced only once the new one
   is drawn; one an instance in this file still uses is kept, renamed as
   superseded (instances in other files are not visible from here; a scratch
   drawing is not published, so has none). */
export const BEFORE = (name, token = null) => `await figma.loadAllPagesAsync();
  // one drawing at a time in the file, asked before any page is made or shown: a run the runner gave up on goes on in
  // Figma, and two at once tangled the record. A run is alive while it beats (each Figma call it makes); one silent
  // for a minute is taken as stalled. The token is taken at once, so no run starts between the asking and the taking
  const __beat = +figma.root.getPluginData('to-figma-beat') || 0;
  const __running = +figma.root.getPluginData('to-figma-running') || 0;
  if (__running && Date.now() - Math.max(__beat, __running) < 60000) return { refused: 'another drawing is still running in this file (last heard ' + Math.round((Date.now() - Math.max(__beat, __running)) / 1000) + ' s ago); wait for it' };
  // this run's token: a stalled run that wakes after a newer one began finds the token changed and records nothing
  const __token = ${token === null ? 'Date.now()' : Number(token)}; figma.root.setPluginData('to-figma-running', String(__token));
  const __release = () => { if (figma.root.getPluginData('to-figma-running') === String(__token)) figma.root.setPluginData('to-figma-running', ''); };
  // each component on a page of its own name, put after the last page whose name comes before it
  let __page = figma.root.children.find((p) => p.name === ${JSON.stringify(name)});
  if (!__page) { __page = figma.createPage(); __page.name = ${JSON.stringify(name)}; const __before = figma.root.children.filter((p) => p !== __page && p.name.localeCompare(${JSON.stringify(name)}, 'en') < 0 /* the locale pinned, as compareNames (tools/shared/output.mjs) pins it: this runs in Figma, which cannot import it */).pop(); figma.root.insertChild(__before ? figma.root.children.indexOf(__before) + 1 : 0, __page); }
  await figma.setCurrentPageAsync(__page);
  const __rec = JSON.parse(__page.getPluginData('drawings') || '{"by":{},"all":[]}');
  // the record holds only drawings that still exist, once each
  const __exists = async (x) => !!(await figma.getNodeByIdAsync(x.replace(/^kept:/, '')));
  __rec.all = [...new Set(__rec.all)]; { const keep = []; for (const x of __rec.all) if (await __exists(x)) keep.push(x); __rec.all = keep; }
  for (const [k, v] of Object.entries(__rec.by)) if (!__rec.all.includes(v)) delete __rec.by[k];
  // a drawing that failed partway: recorded when it began, finished by none, so cleared
  for (const id of __rec.all.filter((x) => !Object.values(__rec.by).includes(x))) { const n = await figma.getNodeByIdAsync(id); if (n) n.remove(); }
  __rec.all = __rec.all.filter((x) => Object.values(__rec.by).includes(x) || x.startsWith('kept:'));
  // an instance of one of this tool's drawings, placed to look at it, is a person's and stays; anything else refuses
  const __mine = (id) => __rec.all.includes(id) || __rec.all.includes('kept:' + id);
  const __other = [];
  for (const n of __page.children) {
    if (__mine(n.id)) continue;
    if (n.type === 'INSTANCE') { const mc = await n.getMainComponentAsync(); let a = mc; while (a && a.parent && a.parent.type !== 'PAGE') a = a.parent; if (a && __mine(a.id)) continue; }
    __other.push(n);
  }
  if (__other.length) { __release(); return { refused: 'the ' + __page.name + ' page holds something this tool did not draw: ' + __other.map((n) => n.name).slice(0, 5).join(', ') }; }
  __page.setPluginData('drawings', JSON.stringify(__rec));
  // each node the drawing makes, recorded as it is made, so a run that fails partway is cleared by the next
  const __given = [];
  const __started = (id) => { if (figma.root.getPluginData('to-figma-running') !== String(__token)) return; __rec.all.push(id); __page.setPluginData('drawings', JSON.stringify(__rec)); };
  // what the page held before this run: a part made but never placed when the run fails is left on the page, so cleared
  const __pre = new Set(__page.children.map((n) => n.id));
`;
/* A run that throws: what it made and never placed is cleared, its record kept, the token given back; a run a newer
   one took over from touches nothing, the page and the record being that run's now. */
export const FAILED = "if (figma.root.getPluginData('to-figma-running') === String(__token)) { __page.setPluginData('drawings', JSON.stringify(__rec)); for (const n of [...__page.children]) if (!__pre.has(n.id) && !__rec.all.includes(n.id)) n.remove(); __release(); } else for (const id of __given) { const n = await figma.getNodeByIdAsync(id); if (n && !n.removed) n.remove(); }";
export const AFTER = (name) => `{
  if (figma.root.getPluginData('to-figma-running') !== String(__token)) { const mine = await figma.getNodeByIdAsync(__res.set); if (mine) mine.remove(); return { refused: 'a newer drawing began while this one was stalled; this one was discarded' }; }
  const old = __rec.by[${JSON.stringify(name)}] && await figma.getNodeByIdAsync(__rec.by[${JSON.stringify(name)}]);
  if (old) {
    let used = false; for (const c of old.type === 'COMPONENT' ? [old] : old.findAll((x) => x.type === 'COMPONENT')) if ((await c.getInstancesAsync()).length) { used = true; break; }
    // kept above everything on the page, so drawings superseded in turn never overlap
    if (used) { old.name += ' (superseded ' + new Date().toISOString().slice(0, 10) + ')'; old.y = Math.min(...__page.children.map((n) => n.y)) - old.height - 200; __rec.all = __rec.all.filter((x) => x !== old.id).concat('kept:' + old.id); }
    else { old.remove(); __rec.all = __rec.all.filter((x) => x !== __rec.by[${JSON.stringify(name)}]); }
  }
  __rec.all = __rec.all.filter((x) => !__res.parts.includes(x)); __rec.by[${JSON.stringify(name)}] = __res.set; if (!__rec.all.includes(__res.set)) __rec.all.push(__res.set);
  __page.setPluginData('drawings', JSON.stringify(__rec)); __release(); }
`;

/* A library component updated in place (the editor's "Update the library component", which it offers, not
   recommends): the contract drawn as for a new one, beside it, then copied onto the existing set node by node and
   the drawing removed. The set and every variant that stays keep their node and key, so each instance in every file
   stays linked and takes the change when the library publishes; a layer that stays keeps its node, so an
   instance's override on it stays too. A variant matches by its values, a layer by its name (and its number among
   those of that name). A variant the contract no longer draws is removed, its instances in this file counted; a
   renamed option is a removed variant and a new one; a renamed, added or removed axis is refused. */
export const PATCH_BEFORE = (target) => `await figma.loadAllPagesAsync();
  const __beat = +figma.root.getPluginData('to-figma-beat') || 0;
  const __running = +figma.root.getPluginData('to-figma-running') || 0;
  if (__running && Date.now() - Math.max(__beat, __running) < 60000) return { refused: 'another drawing is still running in this file; wait for it' };
  const __token = Date.now(); figma.root.setPluginData('to-figma-running', String(__token));
  const __release = () => { if (figma.root.getPluginData('to-figma-running') === String(__token)) figma.root.setPluginData('to-figma-running', ''); };
  const __target = await figma.getNodeByIdAsync(${JSON.stringify(target)});
  if (!__target || (__target.type !== 'COMPONENT_SET' && __target.type !== 'COMPONENT')) { __release(); return { refused: 'no component or component set ' + ${JSON.stringify(target)} + ' in this file' }; }
  // a point in the file's version history to go back to, named, before anything changes: a patch that fails partway
  // leaves the set half changed, and Figma's history is how it is undone
  try { await figma.saveVersionHistoryAsync('Before the contract editor updated ' + __target.name, 'to-figma --patch'); } catch (e) { __release(); return { refused: 'Figma would not save a version to go back to (' + e.message + '); nothing was changed' }; }
  let __page = __target; while (__page.type !== 'PAGE') __page = __page.parent;
  await figma.setCurrentPageAsync(__page);
  // each node the new drawing makes, so a run that fails partway leaves nothing of it behind
  const __made = []; globalThis.__drawingStarted = (id) => __made.push(id);
  // set once the library's set begins to change, so a failure after it says how to go back
  let __patching = false;
`;
// what the drawing made, less what was moved into the library's set: removing that would empty the set, and Figma
// would remove it
export const PATCH_FAILED = "for (const id of __made) { const n = await figma.getNodeByIdAsync(id); let up = n; while (up && up !== __target) up = up.parent; if (n && !n.removed && !up) n.remove(); } __release(); if (__patching) throw new Error('the library set was changed partway, then this failed (' + (e && e.message || e) + '): restore the version named Before the contract editor updated ' + __target.name + ' from the version history');";
export const PATCH_AFTER = `{ __res = await (${(async (res, target, token, patching) => {
  const fresh = await figma.getNodeByIdAsync(res.set);
  // a run a newer one took over from, or a set that would change kind, changes nothing in the library
  if (figma.root.getPluginData('to-figma-running') !== String(token)) { fresh.remove(); return { refused: 'a newer drawing began while this one was stalled; nothing was changed' }; }
  // a run its caller may have given up on (it waits nine minutes, the patch given the last four): it reports a
  // failure, so it changes nothing
  if (Date.now() - token > 300000) { fresh.remove(); return { refused: 'the drawing took too long, and its caller may have stopped waiting; nothing was changed' }; }
  if ((fresh.type === 'COMPONENT_SET') !== (target.type === 'COMPONENT_SET')) { fresh.remove(); return { refused: `the library's ${target.type === 'COMPONENT_SET' ? 'set' : 'component'} would become a ${fresh.type === 'COMPONENT_SET' ? 'set' : 'single component'}: draw it as a new component instead` }; }
  // an axis renamed, added or removed: a variant moved into a set takes the set's axes, so the change would not take
  const axes = (n) => n.type === 'COMPONENT_SET' ? Object.entries(n.componentPropertyDefinitions).filter(([, d]) => d.type === 'VARIANT').map(([k]) => k).sort().join(', ') : '';
  if (axes(fresh) !== axes(target)) { fresh.remove(); return { refused: `the variants' properties would change (${axes(target)} to ${axes(fresh)}), which Figma does not take in place: rename them in Figma first, or draw it as a new component` }; }
  // what the drawing could not draw as the contract says (a value it could not bind, copied raw over the library's
  // bound one; a layer inside an instance it could not find)
  if (res.missing.length) { fresh.remove(); return { refused: `the drawing could not draw ${res.missing.join(', ')}; nothing was changed` }; }
  patching();
  const missing = [], changed = { kept: 0, added: 0, removed: 0, layers: 0 };
  // a property's own name, Figma's id less its #suffix
  const nameOf = (k) => bareProp(k);
  const defsOf = (n) => n.componentPropertyDefinitions;
  // the properties made the drawing's: removed, added and given their defaults; a variant's are its values, set below
  const ids = {};
  // a slot new to the set: made with its layer below, in each variant that draws it, then given the drawing's settings
  const newSlots = [], slotMade = {};
  for (const [k, d] of Object.entries(defsOf(target))) if (d.type !== 'VARIANT' && !Object.keys(defsOf(fresh)).some((x) => nameOf(x) === nameOf(k) && defsOf(fresh)[x].type === d.type)) { if (d.type === 'SLOT') missing.push(`slot ${nameOf(k)} (removing a slot is left to Figma)`); else target.deleteComponentProperty(k); }
  for (const [k, d] of Object.entries(defsOf(fresh))) {
    if (d.type === 'VARIANT') continue;
    const was = Object.keys(defsOf(target)).find((x) => nameOf(x) === nameOf(k) && defsOf(target)[x].type === d.type);
    if (!was) { if (d.type === 'SLOT') { newSlots.push([nameOf(k), d]); continue; } ids[k] = target.addComponentProperty(nameOf(k), d.type, d.defaultValue, d.preferredValues ? { preferredValues: d.preferredValues } : undefined); continue; }
    ids[k] = was;
    if (d.type !== 'SLOT' && JSON.stringify(defsOf(target)[was].defaultValue) !== JSON.stringify(d.defaultValue)) target.editComponentProperty(was, { defaultValue: d.defaultValue });
    if (d.preferredValues && JSON.stringify(defsOf(target)[was].preferredValues) !== JSON.stringify(d.preferredValues)) target.editComponentProperty(was, { preferredValues: d.preferredValues });
  }
  const refs = (r) => (r ? Object.fromEntries(Object.entries(r).filter(([, v]) => ids[v]).map(([f, v]) => [f, ids[v]])) : null);
  // what a layer is, copied: each field Figma lets a node of its type take, in the order layout needs
  const FIELDS = ['visible', 'opacity', 'blendMode', 'isMask', 'layoutMode', 'layoutWrap', 'primaryAxisSizingMode', 'counterAxisSizingMode', 'primaryAxisAlignItems', 'counterAxisAlignItems', 'itemSpacing', 'counterAxisSpacing', 'itemReverseZIndex', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'strokesIncludedInLayout', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'fills', 'strokes', 'strokeWeight', 'strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight', 'strokeAlign', 'dashPattern', 'strokeCap', 'topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius', 'cornerSmoothing', 'clipsContent', 'effects', 'arcData', 'vectorPaths', 'constraints', 'isExposedInstance', 'fontName', 'fontSize', 'textAlignHorizontal', 'textAlignVertical', 'textAutoResize', 'textTruncation', 'maxLines', 'textCase', 'textDecoration', 'letterSpacing', 'lineHeight', 'paragraphSpacing', 'listSpacing'];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const copy = async (from, to) => {
    let n = 0;
    if (from.type === 'TEXT') {
      // a text's font loaded before anything about it changes, its style before its words
      for (const f of [...(from.characters ? from.getRangeAllFontNames(0, from.characters.length) : [from.fontName]), ...(to.characters ? to.getRangeAllFontNames(0, to.characters.length) : [to.fontName])]) if (f !== figma.mixed) await figma.loadFontAsync(f);
      if (from.textStyleId !== to.textStyleId && typeof from.textStyleId === 'string' && from.textStyleId) { await to.setTextStyleIdAsync(from.textStyleId); n++; }
      if (to.characters !== from.characters) { to.characters = from.characters; n++; }
    }
    for (const f of FIELDS) {
      if (!(f in from) || !(f in to) || from[f] === figma.mixed || same(from[f], to[f])) continue;
      try { to[f] = from[f]; n++; } catch (e) { missing.push(`${to.name} ${f} (${e.message})`); }
    }
    // the size on an axis that is fixed (one that hugs or fills is its contents' or its parent's), then how each
    // axis follows its parent and its contents, which a resize had made fixed
    const fixed = (f) => !(f in from) || from[f] === 'FIXED';
    const w = fixed('layoutSizingHorizontal') ? from.width : to.width, h = fixed('layoutSizingVertical') ? from.height : to.height;
    if ((Math.abs(w - to.width) > 0.01 || Math.abs(h - to.height) > 0.01) && 'resize' in to && to.type !== 'COMPONENT_SET') { try { to.resize(w, h); n++; } catch { /* sized by its contents */ } }
    for (const f of ['layoutPositioning', 'layoutSizingHorizontal', 'layoutSizingVertical', 'primaryAxisSizingMode', 'counterAxisSizingMode', 'textAutoResize']) if (f in from && f in to && to.parent && from[f] !== to[f]) { try { to[f] = from[f]; n++; } catch { /* a parent with no auto layout */ } }
    if (to.parent && to.parent.type !== 'COMPONENT_SET' && (!('layoutMode' in to.parent) || to.parent.layoutMode === 'NONE' || to.layoutPositioning === 'ABSOLUTE') && (to.x !== from.x || to.y !== from.y)) { to.x = from.x; to.y = from.y; n++; }
    // what each field is bound to, the bound one's variable, an unbound one let go (a paint carries its own)
    const bound = (x) => Object.fromEntries(Object.entries(x.boundVariables || {}).filter(([f, v]) => !['fills', 'strokes', 'effects', 'componentProperties'].includes(f) && v && v.id));
    const bf = bound(from), bt = bound(to);
    for (const f of new Set([...Object.keys(bf), ...Object.keys(bt)])) {
      if ((bf[f] && bf[f].id) === (bt[f] && bt[f].id)) continue;
      try { to.setBoundVariable(f, bf[f] ? await figma.variables.getVariableByIdAsync(bf[f].id) : null); n++; } catch (e) { missing.push(`${to.name} ${f} (${e.message})`); }
    }
    if ('effectStyleId' in from && from.effectStyleId !== to.effectStyleId && typeof from.effectStyleId === 'string') { await to.setEffectStyleIdAsync(from.effectStyleId); n++; }
    // (a colour style after the paints copied above, which it keeps; a text's mixed one is left as it is)
    if ('fillStyleId' in from && from.fillStyleId !== to.fillStyleId && typeof from.fillStyleId === 'string') { await to.setFillStyleIdAsync(from.fillStyleId); n++; }
    if ('strokeStyleId' in from && from.strokeStyleId !== to.strokeStyleId && typeof from.strokeStyleId === 'string') { await to.setStrokeStyleIdAsync(from.strokeStyleId); n++; }
    return n;
  };
  // a layer brought over whole into the set: Figma drops a layer's links to properties as it leaves the drawing, and
  // lets one be set only inside the set, so they are read before the move and set, as the set's, after it
  const bring = (n, move) => {
    const links = [n, ...('findAll' in n ? n.findAll(() => true) : [])].map((x) => [x, x.componentPropertyReferences]).filter(([, r]) => r && Object.keys(r).length);
    move();
    for (const [x, r] of links) { try { x.componentPropertyReferences = refs(r); } catch (e) { missing.push(`${x.name}'s link (${e.message})`); } }
  };
  // a layer and what it holds made the drawing's, matched by name and number; an instance's layers are overrides,
  // never added or removed
  const patch = async (from, to, inInstance) => {
    changed.layers += await copy(from, to);
    if (to.type === 'INSTANCE') {
      const [fm, tm] = await Promise.all([from.getMainComponentAsync(), to.getMainComponentAsync()]);
      if (fm && (!tm || fm.id !== tm.id)) { to.swapComponent(fm); changed.layers++; }
      const props = Object.fromEntries(Object.entries(from.componentProperties).filter(([k, v]) => k in to.componentProperties && !same(v.value, to.componentProperties[k].value)).map(([k, v]) => [k, v.value]));
      if (Object.keys(props).length) { to.setProperties(props); changed.layers++; }
    }
    if (!inInstance && to.type !== 'COMPONENT' && !same(refs(from.componentPropertyReferences) || {}, to.componentPropertyReferences || {})) { to.componentPropertyReferences = refs(from.componentPropertyReferences) || {}; changed.layers++; }
    if (!('children' in from) || !('children' in to)) return;
    const key = (kids) => { const seen = {}; return kids.map((c) => `${c.name}#${(seen[c.name] = (seen[c.name] || 0) + 1)}`); };
    const fk = key(from.children), tk = key(to.children);
    const fromKids = [...from.children], toKids = [...to.children];
    const kept = [];
    for (const [i, c] of fromKids.entries()) {
      const j = tk.indexOf(fk[i]);
      // a layer of another type (a frame where a text was) is replaced, not reshaped
      const t = j >= 0 && toKids[j].type === c.type ? toKids[j] : null;
      if (t) { await patch(c, t, inInstance || to.type === 'INSTANCE'); kept.push(t); }
      // a new layer moved over, then linked to the set's properties, which Figma lets only a layer inside it name
      // a new slot is made in the variant, as Figma makes a slot's property with its layer; what it holds moved in
      else if (!inInstance && to.type !== 'INSTANCE' && c.type === 'SLOT') {
        let comp = to; while (comp && comp.type !== 'COMPONENT') comp = comp.parent;
        const sl = comp.createSlot(); sl.name = c.name; to.appendChild(sl);
        // each variant's createSlot makes a property of its own: the first one made stands, the others' slots are
        // linked to it and their own properties deleted, so the set has one, as a drawing's combined variants do
        const made = sl.componentPropertyReferences.slotContentId;
        if (slotMade[c.name]) { sl.componentPropertyReferences = { slotContentId: slotMade[c.name] }; target.deleteComponentProperty(made); } else slotMade[c.name] = made;
        await copy(c, sl);
        for (const kid of [...c.children]) bring(kid, () => sl.appendChild(kid));
        kept.push(sl); changed.layers++;
      }
      else if (!inInstance && to.type !== 'INSTANCE') { bring(c, () => to.appendChild(c)); kept.push(c); changed.layers++; }
    }
    if (inInstance || to.type === 'INSTANCE') return;
    for (const c of toKids) if (!kept.includes(c)) { c.remove(); changed.layers++; }
    // in the drawing's order
    for (const [i, c] of kept.entries()) if (to.children[i] !== c) to.insertChild(i, c);
  };
  // one variant each: a set's, matched by its values; a component of one variant, itself
  const vOf = (n) => JSON.stringify(Object.entries(n.variantProperties || {}).sort());
  const freshV = fresh.type === 'COMPONENT_SET' ? [...fresh.children] : [fresh];
  const targetV = target.type === 'COMPONENT_SET' ? [...target.children] : [target];
  // the set keeps the library's own layout: a variant that stays stays where it is; a new one goes in its cell of a
  // grid, after the rest in an auto layout, else in a row under them, the set grown to hold it
  const cells = new Map(freshV.map((f) => [f, [f.gridRowAnchorIndex, f.gridColumnAnchorIndex]]));
  const matched = new Set(), added = [];
  for (const f of freshV) {
    figma.root.setPluginData('to-figma-beat', String(Date.now()));
    const t = targetV.find((x) => !matched.has(x) && vOf(x) === vOf(f));
    if (t) { matched.add(t); await patch(f, t, false); changed.kept++; }
    else { added.push(f); changed.added++; }
  }
  // the new variants in before the old ones go: a set left with none is removed by Figma, and its key with it
  if (target.type === 'COMPONENT_SET') {
    const bottom = Math.max(0, ...[...matched].map((c) => c.y + c.height));
    let x = 24;
    for (const f of added) {
      const [row, col] = cells.get(f);
      const free = () => ![...matched].some((c) => c.gridRowAnchorIndex === row && c.gridColumnAnchorIndex === col);
      bring(f, () => { try { if (target.layoutMode === 'GRID' && free()) { target.appendChildAt(f, row, col); return; } } catch { /* outside the library's grid: after the rest */ } target.appendChild(f); });
      if (target.layoutMode === 'NONE') { f.x = x; f.y = bottom + 24; x += f.width + 24; }
    }
  }
  for (const [name, d] of newSlots) {
    const key = Object.keys(defsOf(target)).find((x) => nameOf(x) === name && defsOf(target)[x].type === 'SLOT');
    if (!key) { missing.push(`slot ${name} (Figma made no property for it)`); continue; }
    const edit = Object.fromEntries(['slotSettings', 'description', 'preferredValues'].filter((f) => d[f] != null && !(Array.isArray(d[f]) && !d[f].length)).map((f) => [f, d[f]]));
    if (Object.keys(edit).length) try { target.editComponentProperty(key, edit); } catch (e) { missing.push(`slot ${name}'s settings (${e.message})`); }
  }
  let orphaned = 0;
  for (const t of targetV) if (!matched.has(t)) { orphaned += (await t.getInstancesAsync()).length; t.remove(); changed.removed++; }
  if (target.type === 'COMPONENT_SET' && target.layoutMode === 'NONE' && (added.length || changed.removed)) target.resizeWithoutConstraints(Math.max(...target.children.map((c) => c.x + c.width)) + 24, Math.max(...target.children.map((c) => c.y + c.height)) + 24);
  // a drawing whose every variant was moved over is gone already, Figma removing an empty set
  if (!fresh.removed) fresh.remove();
  return { set: target.id, variants: target.type === 'COMPONENT_SET' ? target.children.length : 1, changed, orphaned, props: Object.keys(defsOf(target)), missing, layout: res.layout };
}).toString()})(__res, __target, __token, () => { __patching = true; });
  __release(); }
`;

/* In the scratch file: the drawing recorded for a component, read back as
   each variant's layers with what each is bound to (variable names, the text
   style, the component an instance is of), for verify(). */
/* The library's components by published key, each under the name the snapshot gives it in the library (its page's
   folder with it: Graphic/gold cup). */
export function keyedNames(dir) {
  const out = {};
  let folders = [];
  try { folders = fs.readdirSync(dir); } catch { return out; }
  // each component's own key, and each main its specs place (an icon, which has no spec of its own: Icon/x), named as
  // the library's walk names it there, where the main is the library's own and so has its page
  const placed = {};
  const walk = (o) => { if (!o || typeof o !== 'object') return; if (typeof o.instanceOfKey === 'string' && typeof o.instanceOf === 'string') placed[o.instanceOfKey] ||= o.instanceOf.split(' / ')[0]; for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v); };
  for (const f of folders) { try { const s = JSON.parse(fs.readFileSync(path.join(dir, f, 'figma.json'), 'utf8')); if (s.key && s.name) out[s.key] = s.name; walk(s); } catch { /* no spec */ } }
  for (const [k, n] of Object.entries(placed)) if (!out[k]) out[k] = n;
  return out;
}
/* A drawing places the library's components as remote mains, which have no page: the snapshot's walk names one by
   its own name alone (gold cup), where the library names it with its page's folder (Graphic/gold cup), so no reader
   finds its main. Each instance is named back by its key, where the library holds that key and the walk's name is the
   library's less its folder. */
export function namedByKey(node, byKey) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) { for (const x of node) namedByKey(x, byKey); return node; }
  const full = node.instanceOfKey && byKey[node.instanceOfKey];
  if (full && typeof node.instanceOf === 'string' && node.instanceOf !== full) {
    // (its own name may hold a slash: Icon/arrow on a page Icons is the library's Icons/Icon/arrow)
    const base = node.instanceOf.split(' / ')[0];
    if (full.endsWith(`/${base}`)) node.instanceOf = full + node.instanceOf.slice(base.length);
  }
  for (const v of Object.values(node)) if (v && typeof v === 'object') namedByKey(v, byKey);
  return node;
}

const READBACK = async (name, id = null, pageName = name) => {
  await figma.loadAllPagesAsync();
  const page = figma.root.children.find((p) => p.name === pageName);
  const rec = page && JSON.parse(page.getPluginData('drawings') || '{"by":{}}');
  // a set patched in place is read by its own id, wherever it is
  const drawing = id ? await figma.getNodeByIdAsync(id) : rec && rec.by[name] && await figma.getNodeByIdAsync(rec.by[name]);
  if (!drawing) return { missing: `no recorded drawing of ${name}` };
  const ids = new Set(), out = [];
  const varOf = (b) => (b && b.type === 'VARIABLE_ALIAS' ? b.id : null);
  // a component of one variant is its own; a set's are inside it
  for (const comp of drawing.type === 'COMPONENT' ? [drawing] : drawing.findAll((n) => n.type === 'COMPONENT')) {
    const layers = {};
    const mains = [];
    const walk = (n, inInstance) => {
      const fill = Array.isArray(n.fills) && n.fills[0]; const stroke = Array.isArray(n.strokes) && n.strokes[0];
      const e = { type: n.type, visible: n.visible,
        fill: fill ? varOf(fill.boundVariables && fill.boundVariables.color) : null,
        stroke: stroke ? varOf(stroke.boundVariables && stroke.boundVariables.color) : null,
        radius: varOf(n.boundVariables && n.boundVariables.topLeftRadius), gap: varOf(n.boundVariables && n.boundVariables.itemSpacing),
        paddingLeft: varOf(n.boundVariables && n.boundVariables.paddingLeft), textStyleId: n.type === 'TEXT' ? n.textStyleId : null, effectStyleId: typeof n.effectStyleId === 'string' && n.effectStyleId ? n.effectStyleId : null };
      for (const k of ['fill', 'stroke', 'radius', 'gap', 'paddingLeft']) if (e[k]) ids.add(e[k]);
      if (n.type === 'INSTANCE') mains.push([e, n]);
      // an instance's own drawn colour is on its vector, inside it
      if (n.type === 'INSTANCE') { const v = n.findOne((x) => x.type === 'VECTOR'); const p = v && ((v.strokes && v.strokes[0]) || (v.fills && v.fills[0])); e.inner = p ? varOf(p.boundVariables && p.boundVariables.color) : null; if (e.inner) ids.add(e.inner); }
      layers[n === comp ? '(root)' : n.name] = e;
      if (n.type !== 'INSTANCE' && 'children' in n) for (const c of n.children) walk(c, inInstance);
    };
    walk(comp, false);
    // what an instance is of, read after the walk (dynamic-page access: asynchronously)
    for (const [e, n] of mains) { const mc = await n.getMainComponentAsync(); e.instanceOf = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name) : null; }
    out.push({ variant: comp.name, layers });
  }
  const names = {};
  for (const v of await Promise.all([...ids].map((id) => figma.variables.getVariableByIdAsync(id)))) if (v) names[v.id] = v.name;
  const styles = {};
  for (const sid of new Set(out.flatMap((v) => Object.values(v.layers).map((e) => e.textStyleId).filter((x) => typeof x === 'string' && x)))) { const st = await figma.getStyleByIdAsync(sid); if (st) styles[sid] = st.name; }
  for (const sid of new Set(out.flatMap((v) => Object.values(v.layers).map((e) => e.effectStyleId).filter(Boolean)))) { const st = await figma.getStyleByIdAsync(sid); if (st) styles[sid] = st.name; }
  for (const v of out) for (const e of Object.values(v.layers)) { for (const k of ['fill', 'stroke', 'radius', 'gap', 'paddingLeft', 'inner']) if (e[k]) e[k] = names[e[k]] || e[k]; if (e.textStyleId) { e.textStyle = styles[e.textStyleId] || null; delete e.textStyleId; } if (e.effectStyleId) { e.effect = styles[e.effectStyleId] || null; delete e.effectStyleId; } }
  return { variants: out };
};

/* The drawing against the contract it was drawn from, value by value: each
   variant's layers, by name, against what the plan says they carry. The
   third side of contract (Figma's), contract (code's) and drawing. */
export function verify(p, drawn, isVar = varNamer()) {
  // a variant's name, its values in one order: a library may order its axes otherwise
  const byValues = (n) => String(n).split(', ').sort().join(', ');
  const rows = [];
  for (const v of p.variants) {
    // a component of one variant is drawn under the component's name, not a variant's
    const d = (drawn.variants || []).find((x) => byValues(x.variant) === byValues(v.name)) || (p.variants.length === 1 && (drawn.variants || []).length === 1 ? drawn.variants[0] : null);
    if (!d) { rows.push({ variant: v.name, what: 'the variant', verdict: 'not drawn' }); continue; }
    // the instance a part sits inside, if any: such a part is that component's own layer, drawn as an override at most
    const host = (id) => { for (let up = v.anatomy[id].parent; up && v.anatomy[up]; up = v.anatomy[up].parent) if (v.anatomy[up].kind === 'instance') return up; return null; };
    for (const [id, e] of Object.entries(v.anatomy)) {
      const inside = host(id);
      if (inside) {
        const at = d.layers[v.anatomy[inside].name];
        if (e.kind === 'graphic' && e.background && at) rows.push({ variant: v.name, what: `${e.name} colour`, want: e.background, got: at.inner || null, verdict: e.background === at.inner ? 'same' : at.inner ? 'differs' : 'not bound' });
        continue;
      }
      const layer = d.layers[id === 'root' ? '(root)' : e.name];
      if (!layer) { rows.push({ variant: v.name, what: e.name, verdict: 'not drawn' }); continue; }
      const checks = [];
      const tok = (t) => (isVar(t) ? t : null);
      if (e.kind === 'text') checks.push(['text style', e.typography, layer.textStyle], ['colour', e.color, layer.fill]);
      if (e.kind === 'graphic') checks.push(['colour', e.background, layer.inner || layer.fill]);
      if (e.kind === 'instance') checks.push(['component', e.component, layer.instanceOf]);
      if (e.kind === 'container') {
        checks.push(['fill', e.background, layer.fill], ['radius', tok(e.radius), layer.radius], ['border', tok(e.border && e.border.color), layer.stroke], ['shadow', e.shadow && !/\(/.test(e.shadow) ? e.shadow : null, layer.effect]);
        if (e.layout) checks.push(['gap', tok(e.layout.gap), layer.gap], ['padding', tok(e.layout.padding && e.layout.padding.start), layer.paddingLeft]);
      }
      // only what the contract names: a value it does not give is nothing to check
      // a component by its name or, as a swap names it, its last name ("check" for Icon/check)
      const is = (what, want, got) => want === got || (what === 'component' && typeof got === 'string' && want.split('/').pop() === got);
      for (const [what, want, got] of checks) if (want) rows.push({ variant: v.name, what: `${e.name} ${what}`, want, got: got || null, verdict: is(what, want, got) ? 'same' : got ? 'differs' : 'not bound' });
    }
  }
  return rows;
}

/* verify's record, `<report>.drawn.json`: written when its rows changed, else
   left as it is, so a run that found what the last one found changes no file. */
export function writeDrawn(out, rows) {
  try { if (JSON.stringify(JSON.parse(fs.readFileSync(out, 'utf8')).rows) === JSON.stringify(rows)) return false; } catch { /* none yet, or unreadable: write it */ }
  fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), rows }, null, 2) + '\n');
  return true;
}

/* The index's entry for a component of that name. Where two libraries hold one (web and iOS), the one in the file
   asked of, else the one of its published key (`keyAt`: an entry's); none where neither tells, never the first. */
export function entryOf(index, name, { file, key, keyAt = () => null } = {}) {
  const named = Object.keys(index).filter((k) => index[k].name === name);
  if (named.length < 2) return named[0];
  const only = [named.filter((k) => file && index[k].file === file), key ? named.filter((k) => keyAt(k) === key) : []].find((xs) => xs.length === 1);
  return only && only[0];
}

/* The library component --verify holds a drawing to: { folder, file }, nothing where the library has none of that
   name, `refused` where it has several and none is told apart. An explicit --library is always the one held to, and
   chooses among several by its own key. */
export function heldTo(index, name, { folder, library, libraryKey, key, keyAt, fileOf, exists = () => true }) {
  const at = folder || entryOf(index, name, { key: libraryKey || key, keyAt });
  if (at) {
    const file = library || fileOf(at);
    return exists(file) ? { folder: at, file } : { refused: `refused: no contract at ${file}, so the drawing cannot be held to it; check --folder, or snapshot the library again` };
  }
  if (Object.values(index).some((x) => x.name === name)) return { refused: `refused: the library has several components called ${name} and none is told apart, so the drawing cannot be held to one; pass --folder <its folder>` };
  return library ? { file: library } : {};
}

/* The live walk as the stored snapshot recorded a text with no style. The walk records such a text's size and face
   (0.82.0 on), and derive then says its values, spacing and case; a snapshot from before records none, and its
   contract says `literal` alone. Only against such a snapshot are they left out, so the same library is never a
   change. Which it is, the stored figma.json says by its own fields, never the contract's text (which drops a text
   equal to its component's own and has no value for a face with no weight). `comp` is the walk's, its variants whole;
   with no stored snapshot to ask, nothing is left out. The same for each layer's place among all its parent's
   children (`index`, 0.83.0 on), which derive reads to order two layers two booleans show where they would tie. */
const SIZED = ['fontSize', 'fontFamily', 'fontStyle'];
export function walkedAs(comp, stored) {
  if (!stored) return comp;
  const sized = (n) => (n.textStyle === 'literal' && SIZED.some((k) => n[k] != null)) || (n.children || []).some(sized);
  const placed = (n) => typeof n.index === 'number' || (n.children || []).some(placed);
  const trees = req('../snapshot/spec.cjs').resolve(stored).variants || [];
  const keepSizes = trees.some(sized), keepPlaces = trees.some(placed);
  if (keepSizes && keepPlaces) return comp;
  // (a node is a layer by its type: a prop or a link named index is not one)
  return JSON.parse(JSON.stringify(comp), (k, v) => {
    if (v && !keepSizes && v.textStyle === 'literal') for (const f of SIZED) delete v[f];
    if (v && !keepPlaces && typeof v.type === 'string' && typeof v.index === 'number') delete v.index;
    return v;
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  // a refused call (a file to reopen, a service gone) is its message, not a stack trace
  process.on('uncaughtException', (e) => { console.error(e && e.message || e); process.exit(1); });
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  let run = argv.includes('--run'); if (run) argv.splice(argv.indexOf('--run'), 1);
  const check = argv.includes('--verify'); if (check) argv.splice(argv.indexOf('--verify'), 1);
  const label = opt('--project'), into = opt('--into');
  // the component set to update in place, by its node id in the file `into` names (the library's, for the editor)
  const target = opt('--patch');
  // the contract the update was made from: the library's component, read live, must still be it
  const baseFile = opt('--base');
  // the contract to hold the read-back to, and its folder: the official one, where the caller has it (eval.mjs)
  const libraryFile = opt('--library'), libraryFolder = opt('--folder');
  if (target && !check) run = true;
  const [report, keysFile] = argv;
  if (!report || (!run && !check && !keysFile) || ((run || check) && (!label || !into))) { console.error('usage: to-figma.mjs <from-code report> <keys.json>            prints the plugin code\n       to-figma.mjs <from-code report> --run --project <label> --into <scratch fileKey>   draws it through the project\'s docs service\n       to-figma.mjs <contract> --patch <set id> [--base <contract>] --project <label> --into <fileKey>   updates that component set in place, refused where the set is no longer the base\n       to-figma.mjs <contract> --verify --project <label> --into <scratch fileKey> [--patch <set id>] [--library <contract> --folder <component folder>]   reads the drawing back and holds it to the contract, and to the library\'s own (its contract.json, or the one --library names)'); process.exit(2); }
  const r = JSON.parse(fs.readFileSync(report, 'utf8'));
  const c = r.asFigma || r;
  // with no project, the house's own axis order (audit-defaults, derived as for a library)
  const house = () => req('../snapshot/projects.cjs').flatSettings(JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../standards/audit-settings.json'), 'utf8'))['audit-defaults'], {});
  if (!run && !check) { process.stdout.write(pluginCode(c, JSON.parse(fs.readFileSync(keysFile, 'utf8')), { axisOrder: house().axisOrder || [], sizeAxis: house().sizeAxis || null })); process.exit(0); }
  // through the project's own docs service, which holds the Figma bridge
  const contractRouter = req('../snapshot/projects.cjs');
  const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const where = contractRouter.layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  // an entry's published key, as its stored figma.json has it (entryOf)
  const keyAt = (k) => { try { return JSON.parse(fs.readFileSync(path.join(where.paths.components, k, 'figma.json'), 'utf8')).key; } catch { return null; } };
  const { serviceFor, figmaExec } = await import('../figma-audit/services.mjs');
  const svc = serviceFor(where.audit);
  if (!svc) { console.error(`${label}: no docs service running for ${where.audit}`); process.exit(2); }
  const exec = (code, fileKey, timeout) => figmaExec(svc, fileKey, code, timeout);
  // the library the drawing takes its components, styles and variables from, as every tool chooses it (libraryOf)
  const { libraryOf } = await import('../parity/project.mjs');
  const { libKey, lib } = libraryOf(label);
  // the library's Icon container (its `draw`) and the mode its code is compared in (its code.parity's one tier), where
  // its context document says; without them, the lookups below find them, and a value is its collection's first mode's
  const map = { draw: lib.draw, mode: lib.code && lib.code.parity && lib.code.parity.tiers && lib.code.parity.tiers[0] };
  // the house's axis order, as that library's settings derive it (figma-standard rule 1)
  const axisOrder = (lib.tokens || {}).axisOrder || [];
  const sizeAxis = (lib.tokens || {}).sizeAxis || null;
  // every variable the project's tokens name (by key, or by value where a snapshot older than 0.52 kept no keys), so
  // one at the top of its collection is a variable too
  const isVar = varNamer(Object.values(JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8')).collections || {}).flatMap((col) => [...Object.keys(col.keys || {}), ...Object.values(col.values || {}).flatMap((m) => Object.keys(m || {}))]));
  const p = plan(c, { axisOrder }), want = needs(p, isVar);
  const pageName = drawingPage(p.name, !!libKey && into === libKey);
  if (check) {
    // the drawing read back and held to the contract it was drawn from; with the code contract held to
    // Figma's by from-code.mjs, that is all three sides
    const drawn = await exec(`return (${READBACK.toString()})(${JSON.stringify(p.name)}, ${JSON.stringify(target)}, ${JSON.stringify(pageName)});`, into, 60000);
    if (drawn.missing) { console.error(drawn.missing); process.exit(1); }
    const rows = verify(p, drawn, isVar);
    const n = (v) => rows.filter((r) => r.verdict === v).length;
    const out = path.join(path.dirname(report), `${path.basename(report, '.json')}.drawn.json`);
    const wrote = writeDrawn(out, rows);
    console.log(`${p.name} as drawn, against its contract: ${n('same')} the same, ${n('not bound')} not bound, ${n('differs')} differ, ${n('not drawn')} not drawn (${rows.length}) — ${path.relative(process.cwd(), out)}${wrote ? '' : ' (unchanged)'}`);
    // and held to the library's own component of that name, where it has one: the drawing read by the snapshot plugin's
    // own walk and derived as the snapshot derives it, every combination the library draws compared (roundTrip). Bindings
    // alone passed a Badge whose label was an empty 100 px slot (2026-11-12)
    let back = 0;
    let index = {};
    try { index = JSON.parse(fs.readFileSync(where.paths.index, 'utf8')).components || {}; } catch { /* no index: no library component to hold it to */ }
    let lent; try { lent = (JSON.parse(fs.readFileSync(libraryFile, 'utf8')).figma || {}).key; } catch (e) { if (libraryFile && !target) { console.error(`refused: --library ${libraryFile} cannot be read (${e.message})`); process.exit(2); } }
    const { folder, file: libFile, refused } = target ? {} : heldTo(index, p.name, { folder: libraryFolder, library: libraryFile, libraryKey: lent, key: (c.figma || {}).key, keyAt, fileOf: (k) => path.join(where.paths.components, k, 'contract.json'), exists: fs.existsSync });
    if (refused) { console.error(refused); process.exit(2); }
    if (libFile && fs.existsSync(libFile)) {
      const setId = await exec(`await figma.loadAllPagesAsync(); const pg = figma.root.children.find((x) => x.name === ${JSON.stringify(pageName)}); const s = pg && pg.children.find((x) => (x.type === 'COMPONENT_SET' || x.type === 'COMPONENT') && x.name === ${JSON.stringify(p.name)}); return s ? s.id : null;`, into, 60000);
      const walk = fs.readFileSync(path.join(TOOLKIT, 'plugins/design-system-snapshot/code.js'), 'utf8');
      const live = setId && await exec(`const SCOPE = ${JSON.stringify([setId])};\n${walk}\nreturn __headless();`, into, 120000);
      const comp = live && (live.components || []).find((x) => x.id === setId);
      // the snapshot walk names a set after its page where the two differ (Page/Set); in the library's own file the page
      // is the round trip's (drawingPage), never the design's, so only that exact prefix is taken off
      if (comp && comp.name === `${pageName}/${p.name}`) comp.name = p.name;
      if (comp) namedByKey(comp, keyedNames(where.paths.components));
      if (comp) {
        const { compact } = req('../snapshot/spec.cjs');
        const { derive } = req('./derive.cjs');
        const held = JSON.parse(fs.readFileSync(libFile, 'utf8'));
        // (the snapshot it was derived from, beside the library's contract)
        let snap = null; try { snap = JSON.parse(fs.readFileSync(path.join(where.paths.components, folder, 'figma.json'), 'utf8')); } catch { /* none stored: the walk as read */ }
        const now = derive(compact(walkedAs(comp, snap)), Object.values(index).map((x) => x.name), { ...contractRouter.deriveOptions(contractRouter.auditContext(where.doc), into, contractRouter.tokensOf(where.paths)), mains: contractRouter.deriveOptionsFor(where.paths.components)(folder).mains });
        // the library's components by name, as eval.mjs compares with them: the same rules on every leg
        const { contracts } = await import('./official.mjs');
        const rt = roundTrip(held, now, { mains: req('./derive.cjs').byComponentName(contracts(where).map(({ contract }) => contract)) });
        // and the reading itself, before derive drops what it does not keep, held to the stored one layer by layer: the
        // geometry part of the Figma leg (geometry.mjs), against the fields the library's snapshot records anywhere
        const { geometry, knownOf } = await import('./geometry.mjs');
        const specs = Object.fromEntries(req('../snapshot/store.cjs').readSpecs(where.paths.components, { compact: true }).map((x) => [x.folder, x.spec]));
        const geo = snap && geometry(snap, walkedAs(comp, snap), { known: knownOf(JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8')), specs, (walk.match(/const VERSION = '([^']+)'/) || [])[1]) });
        back = rt.rows.length + (geo ? geo.length : 0);
        const rtOut = path.join(path.dirname(report), `${path.basename(report, '.json')}.roundtrip.json`);
        const body = JSON.stringify({ component: p.name, combinations: rt.combinations, ...(rt.invalid && { invalid: rt.invalid }), ...(rt.cut && { cut: rt.cut }), rows: rt.rows, ...(geo && { geometry: geo }) }, null, 2) + '\n';
        if (!fs.existsSync(rtOut) || fs.readFileSync(rtOut, 'utf8') !== body) fs.writeFileSync(rtOut, body);
        console.log(`${p.name} as drawn, against the library's own: ${rt.rows.length ? `${rt.rows.length} difference(s)` : 'the same'} over ${rt.combinations} combination(s), ${!geo ? 'geometry not compared (no stored figma.json)' : geo.length ? `${geo.length} geometry row(s)` : 'geometry the same'} — ${path.relative(process.cwd(), rtOut)}`);
        for (const r of rt.rows.slice(0, 12)) console.log(`  ${r.at}: library ${JSON.stringify(r.library)}, drawn ${JSON.stringify(r.drawn)} (${r.in}/${rt.combinations})`);
        for (const r of (geo || []).slice(0, 12)) console.log(`  geometry ${r.at}: library ${JSON.stringify(r.library)}, drawn ${JSON.stringify(r.drawn)}`);
      } else { back = 1; const stale = path.join(path.dirname(report), `${path.basename(report, '.json')}.roundtrip.json`); if (fs.existsSync(stale)) fs.unlinkSync(stale); console.log(`${p.name}: not found drawn in ${into}, so it could not be held to the library's own: failed`); }
    }
    // not bound is a failure too: a drawing is held to its contract, and a value it could not bind is not held
    process.exit(n('differs') + n('not drawn') + n('not bound') + back ? 1 : 0);
  }
  // a text style's key from the snapshot (plugin 0.51.0 on); the rest looked up where the library uses them
  const stored = JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8')).textStyles || [];
  const keys = { styles: Object.fromEntries(stored.filter((x) => x.key && want.styles.includes(x.name)).map((x) => [x.name, x.key])), icons: {}, iconContainer: null };
  // an image fill is the library's asset, not the contract's: the library's own component of this name, by its key, so
  // the drawing paints each image layer with the picture the library's layer of the same name holds
  if (JSON.stringify(c).includes('"IMAGE:')) { const byKey = keyedNames(where.paths.components); keys.image = Object.keys(byKey).find((k) => byKey[k] === c.component) || null; }
  // a colour style's key, looked up where the library uses it (the snapshot records none); its colour from the snapshot
  keys.fillStyles = {};
  keys.fillStyleColours = styleColours(JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8')), want.fillStyles);
  const missing = { styles: want.styles.filter((n) => !keys.styles[n]), fillStyles: want.fillStyles, icons: want.icons, container: (map.draw && map.draw.iconContainer) || null, vars: want.vars, components: want.components };
  const tl = Date.now();
  // a variable's key from the snapshot (plugin 0.52.0 on); else looked up in the library file below
  keys.vars = {};
  for (const col of Object.values(JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8')).collections || {})) for (const [n, k] of Object.entries(col.keys || {})) if (want.vars.includes(n) && !keys.vars[n]) keys.vars[n] = k;
  missing.vars = want.vars.filter((n) => !keys.vars[n]);
  // each token's own value, drawn where its variable cannot be bound
  const { valueOf } = req('../snapshot/tokens.cjs');
  const tokenFile = JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8'));
  // an effect style's key from the snapshot, which has always recorded it
  keys.effects = Object.fromEntries((tokenFile.effects || []).filter((fx) => fx.key && want.effects.includes(fx.name)).map((fx) => [fx.name, fx.key]));
  keys.values = Object.fromEntries(want.vars.map((n) => [n, valueOf(tokenFile, n, map.mode)]).filter(([, v]) => v != null));
  keys.modes = modeSets(tokenFile);
  // each component's variants as the snapshot met them (an instance's `instanceOfKey`): no library file needs to be open
  keys.variants = variantKeys(where.paths.components, want.components, want.swaps);
  missing.swaps = (want.swaps || []).filter((t) => !Object.keys(keys.variants).some((n) => n === t || n.endsWith('/' + t)));
  // the scratch file is the library's own file: what it holds is taken from it (RUNTIME's ownKeys), published or not
  keys.ownFile = !!libKey && into === libKey;
  const notOpen = [];
  if (libKey) {
    // the rest where the library uses them, in the library file itself, which must be open with the Desktop Bridge
    const found = await exec(`const styleIdsOf = ${styleIdsOf.toString()};\nreturn (${LOOKUP.toString()})(${JSON.stringify(missing)});`, libKey, 60000).catch((e) => { notOpen.push(`the library file (${libKey}) is not open with the Desktop Bridge, so only what the snapshot names was found: ${e.message.split('\n')[0]}`); return null; });
    if (found) { Object.assign(keys.styles, found.styles); Object.assign(keys.fillStyles, found.fillStyles || {}); keys.icons = found.icons; keys.iconContainer = found.iconContainer; Object.assign(keys.vars, found.vars); keys.sets = found.sets; for (const [n, k] of Object.entries(found.swaps || {})) keys.variants[n] ||= { [n]: k }; }
  }
  // a variable the library hides from publishing cannot be imported here: its name, said with why it is not bound
  const hidden = new Set(Object.values(tokenFile.collections || {}).flatMap((col) => col.hidden || []));
  const looked = Math.round((Date.now() - tl) / 1000);
  if (process.env.DEBUG) console.error('keys', JSON.stringify(keys));
  if (target && baseFile) {
    // the library's component as it is now, read by the snapshot's own walk (the shape the snapshot stores) and its
    // contract derived as the snapshot derives it: a draft made before someone changed the component would undo
    // their change. The last snapshot is not enough, being only as new as whoever last took one
    const walk = fs.readFileSync(path.join(TOOLKIT, 'plugins/design-system-snapshot/code.js'), 'utf8');
    const live = await exec(`const SCOPE = ${JSON.stringify([target])};\n${walk}\nreturn __headless();`, into, 120000);
    const comp = live && (live.components || []).find((x) => x.id === target);
    if (!comp) { console.error(`refused: ${target} could not be read from the library; nothing was changed`); process.exit(1); }
    const { compact } = req('../snapshot/spec.cjs');
    const { derive } = req('./derive.cjs');
    let index = {};
    try { index = JSON.parse(fs.readFileSync(where.paths.index, 'utf8')).components || {}; } catch { /* no index: only its own name is known */ }
    const at = entryOf(index, comp.name, { file: into, key: comp.key, keyAt }), entry = index[at] || {};
    let snap = null; try { snap = JSON.parse(fs.readFileSync(path.join(where.paths.components, at, 'figma.json'), 'utf8')); } catch { /* none stored: the walk as read */ }
    const walked = compact(walkedAs(comp, snap)), spec = entry.platform ? { ...walked, platform: entry.platform } : walked;
    const base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
    const now = derive(spec, [...Object.values(index).map((x) => x.name), comp.name], { ...contractRouter.deriveOptions(contractRouter.auditContext(where.doc), into, contractRouter.tokensOf(where.paths)), mains: contractRouter.deriveOptionsFor(where.paths.components)(at).mains });
    if (process.env.DEBUG) console.error('live', JSON.stringify(now));
    const sorted = (x) => (Array.isArray(x) ? x.map(sorted) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sorted(x[k])])) : x);
    if (JSON.stringify(sorted(now)) !== JSON.stringify(sorted(base))) {
      // a snapshot whose contracts an older toolkit derived differs from any read now, changed or not: said so, as
      // opening it again from the library would bring the same old contract back
      const folder = at;
      const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(where.paths.components, folder, f), 'utf8')); } catch { return null; } };
      const stored = folder && read('figma.json'), kept = folder && read('contract.json');
      const older = stored && kept && JSON.stringify(sorted(derive(stored, Object.values(index).map((x) => x.name), { ...contractRouter.deriveOptions(contractRouter.auditContext(where.doc), into, contractRouter.tokensOf(where.paths)), mains: contractRouter.deriveOptionsFor(where.paths.components)(at).mains }))) !== JSON.stringify(sorted(kept));
      console.error(older ? `refused: ${comp.name}'s snapshot is older than the toolkit's contracts, so it cannot be told whether the library changed; take a snapshot, then open it again and make the change; nothing was changed` : `refused: ${comp.name} has changed in the library since this draft was made; nothing was changed`);
      process.exit(1);
    }
  }
  // a scratch file draws one project's components: a private one (_Label) is placed from the file's own page of that
  // name, so a file two projects draw into places one project's part in the other's drawing (2026-11-17). The file is
  // claimed for the first project that draws into it, and refused to another
  if (!target) {
    const owner = await exec(`const p = figma.root.getPluginData('round-trip-project'); if (!p) figma.root.setPluginData('round-trip-project', ${JSON.stringify(label)}); return p || null;`, into, 30000);
    if (owner && owner !== label) { console.error(`refused: ${into} is ${owner}'s scratch file; draw ${label} into a file of its own (a private component is placed from the file's own page by name, so two projects in one file mix their parts)`); process.exit(1); }
  }
  const t0 = Date.now();
  // importing the library's variables and components is most of a drawing's time
  // the plugin runs a long execution only while a message is in flight: with none, it sat at one call
  // for a minute, and advanced only while another call ran. A no-op every 2 s keeps it going
  let drawing = true;
  const awake = (async () => { while (drawing) { await exec('return 1', into, 5000).catch(() => {}); await new Promise((r) => setTimeout(r, 2000)); } })();
  // this run's token, chosen here so the runner can take back its own and no other
  const token = Date.now();
  const mainsOf = req('./derive.cjs').byComponentName((await import('./official.mjs')).contracts(where).map(({ contract }) => contract));
  // the instances the library's own spec keeps whole (a layer hidden in them), as derive found them reading it: where
  // the component has a spec, the drawing hides what the contract does not list there and nowhere else
  const wholeFrom = (() => {
    let index = {}; try { index = JSON.parse(fs.readFileSync(where.paths.index, 'utf8')).components || {}; } catch { /* no index */ }
    const folder = libraryFolder || entryOf(index, p.name, { key: (c.figma || {}).key, keyAt });
    const read = (f) => { try { return folder && JSON.parse(fs.readFileSync(path.join(where.paths.components, folder, f), 'utf8')); } catch { return null; } };
    const stored = read('figma.json'), own = read('contract.json');
    // only for the library's own contract: another (a report from code) names its parts its own way
    if (!stored || !own || JSON.stringify(own) !== JSON.stringify(c)) return null;
    const found = new Map();
    try { req('./derive.cjs').derive(stored, Object.values(index).map((x) => x.name), { ...contractRouter.deriveOptions(contractRouter.auditContext(where.doc), into, contractRouter.tokensOf(where.paths)), mains: contractRouter.deriveOptionsFor(where.paths.components)(folder).mains, found }); } catch { return null; }
    // by the variant's name as the plan gives it (Breakpoint=md, State=Initial)
    return Object.fromEntries([...found].map(([when, ids]) => [Object.entries(JSON.parse(when)).map(([k, v]) => `${k}=${v}`).sort().join(', '), ids]));
  })();
  const code = target ? pluginCode(c, keys, { before: PATCH_BEFORE(target), after: PATCH_AFTER, failed: PATCH_FAILED, axisOrder, sizeAxis, mains: mainsOf, whole: wholeFrom }) : pluginCode(c, keys, { before: BEFORE(pageName, token), after: AFTER(p.name), failed: FAILED, axisOrder, sizeAxis, mains: mainsOf, whole: wholeFrom });
  // nine minutes for either: a drawing of 300 variants that import their graphics outran two in a background Figma, and a
  // run the runner gives up on goes on in Figma, holding the file; one that times out here may still be changing it
  const res = await exec(code, into, 540000).catch(async (e) => {
    // a drawing given up on has its token taken back, so it stops at its next call to Figma and clears what it made
    if (!target) { if (/timed out|plugin_timeout/i.test(e.message)) await exec(`if (figma.root.getPluginData('to-figma-running') === '${token}') figma.root.setPluginData('to-figma-running', ''); return 1;`, into, 10000).catch(() => {}); throw e; }
    console.error(`failed: ${e.message.split('\n')[0]}${/version history|given up on/.test(e.message) ? '' : `; the library set may have been changed partway: restore the version named Before the contract editor updated ${p.name} from the version history`}`);
    process.exit(1);
  }).finally(() => { drawing = false; });
  await awake;
  if (res && res.refused) { console.error(`refused: ${res.refused}`); process.exit(1); }
  for (const x of notOpen) console.log(`note: ${x}`);
  // a prop or value Figma cannot draw: the library's combinations at it stay a difference, said here
  for (const x of p.notDrawn) console.log(`note: not drawn: ${x}`);
  if (target) {
    const ch = res.changed;
    console.log(`${p.name} updated in place (${res.set}): ${ch.kept} variant(s) kept, ${ch.added} added, ${ch.removed} removed${res.orphaned ? ` (${res.orphaned} instance(s) in this file used a removed one)` : ''}, ${ch.layers} change(s) to layers; props ${res.props.map((k) => bareProp(k)).join(', ')}; ${res.missing.length ? `not bound or not changed: ${res.missing.join(', ')}` : 'every value bound'}; in ${Math.round((Date.now() - t0) / 1000)}s`);
    process.exit(0);
  }
  console.log(`${p.name}: ${res.variants} variants into ${into}, laid out ${res.layout}, props ${res.props.join(', ')}; ${res.missing.length ? `not bound: ${res.missing.map((n) => (hidden.has(n) ? `${n} (hidden from publishing in the library: choose a published token)` : n)).join(', ')}` : 'every value bound'}; keys looked up: ${Object.keys(keys.vars || {}).length} variable(s), ${Object.keys(keys.styles).length} style(s), ${Object.keys(keys.icons).length} icon(s)${keys.iconContainer ? ', the icon container' : ''} in ${looked}s; drawn in ${Math.round((Date.now() - t0) / 1000)}s`);
}
