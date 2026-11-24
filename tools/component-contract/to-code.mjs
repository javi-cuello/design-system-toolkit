#!/usr/bin/env node
/*
 * A component contract as CSS: each component's stylesheet, generated from
 * the contract the snapshot derived, as the token build generates the tokens
 * (code-standard rules 23 and 51). The markup is to-markup's for React, web
 * components and Kirby, hand-written elsewhere, and its behaviour frontend-build's
 * (the gaps to-markup names); this writes what the
 * contract says exactly — layout, sizing, fills, strokes, type, and what each
 * prop value changes — and the parity run measures the result.
 *
 *   node tools/component-contract/to-code.mjs --project <label> [component…]           write
 *   node tools/component-contract/to-code.mjs --project <label> --check [component…]   regenerate beside and diff
 *   node tools/component-contract/to-code.mjs --project <label> --out <dir> [component…]
 *   node tools/component-contract/to-code.mjs --repo <dir> [--check] [component…]       a checkout named by path, as a project's bin/component-styles runs it
 *   node tools/component-contract/to-code.mjs --project <label> --contract <file> [--platform <p>]  one contract not stored yet (the contract editor's Push to code), its sheet a draft's: never over another, never removed
 *
 * Where: the repo's snapshot.config.json `paths.componentStyles` (one `<folder>.css` per component), else `--out`.
 * Names: `styles.naming` there — `{ kind: 'class', prefix, part }` gives `.ds-chip` and `.ds-chip__label`,
 * `{ kind: 'element', prefix }` gives `ds-chip` and `[data-part="label"]` — and the token build's for tokens
 * (`tools/tokens/names.mjs`, the text style's fields from build-tokens' `textStyleFields`).
 *
 * A prop value is an attribute on the root (`data-tone="info"` with class naming, `tone="info"` with element naming,
 * `data-size` there too where the name is an HTML attribute's: tools/shared/prop-attr.mjs,
 * the default also the bare element); a State value is its pseudo-class and Disabled the control's own
 * (code-standard rule 9). Each variant layer of the contract is one rule, what it changes from what the rules
 * before it already give; `selfCheck` replays the cascade at every combination the grid draws and names any
 * whose declarations differ, so the stylesheet is proven to rebuild every variant. What CSS cannot say is listed
 * at the top of the file, never dropped.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { officials, homeIn } from './official.mjs';
import { expand, variantDefaults, kebab, camel, placedOf as heldBy } from './layers.mjs';
import { declarations, holds } from './css.mjs';
import { negative, heldOpacity, heldGlyph, siblingOrder, liftsAlone } from './rules.mjs';
const { atProps, asPlaced, placedMatch, placedAs, glyphColour, OWN } = createRequire(import.meta.url)('./derive.cjs');
const { folderOf } = createRequire(import.meta.url)('../snapshot/store.cjs');
import { cssName } from '../tokens/names.mjs';
import { attrWords, propAttr } from '../shared/prop-attr.mjs';
import { textStyleFields } from '../tokens/build-tokens.mjs';

const require = createRequire(import.meta.url);
const BANNER = "Generated from the component's contract by the toolkit's to-code. Do not edit: change Figma, snapshot, and this regenerates.";
// a draft's sheet is not one of the generated set: no check holds it and no write removes it, and once its component
// is in the snapshot the generated sheet is written over it
const DRAFT = "Written by the toolkit's to-code from a draft contract. Once the component is in the snapshot, to-code generates this file over it.";
// a prop's key as its words (showIcon → show-icon) and as its attribute: one rule, parity's -attr check's too
const words = attrWords;
/* The settings a sheet is written under: a CLI passes its library's (librarySettingsFor), a caller that names none
   (a test, the contract editor's draft) gets the house's from audit-settings, never a literal of its own (§C F). */
export const HOUSE = require('../snapshot/projects.cjs').flatSettings(require('../../standards/audit-settings.json')['audit-defaults'], {});
/* What draws each pointer state in CSS, keyed by the contract's value (the state option, kebab-cased): the settings'
   `pseudoClasses`, one owner for the stylesheet and the parity mapping (to-markup). A state with none is a prop's. */
export const pseudoClasses = (t = HOUSE) => Object.fromEntries(Object.entries(t.pseudoClasses || {}).map(([state, ps]) => [kebab(state), ps]));
/* The contract key of the disabled axis, read by its setting (`disabledAxis`), not by the word, in any letter case
   (a library's `dIsabled` is still its disabled axis): null where the settings name none or the contract has no such boolean. */
export const disabledKey = (c, t = HOUSE) => {
  const want = t.disabledAxis && camel(t.disabledAxis).toLowerCase();
  return (want && Object.keys((c && c.props) || {}).find((k) => k.toLowerCase() === want && c.props[k].type === 'boolean')) || null;
};
// what a component placing another says of it: its place and size, nothing of its look
const PLACED = /^(flex|align-self|order|(min-|max-)?(inline|block)-size|position|inset.*|translate|rotate|scale|opacity|z-index|margin.*)$/;

/* How the stylesheet names things: the component, its parts and its props, from the project's naming. */
// a custom element's prefix: lower case, ending in the hyphen its name needs (ds-, my-ds-)
/* What every sheet here assumes and none says: Figma's box is the border box, and a pressable component is a bare frame
   (its root draws no fill, padding, border or face of its own) around what the contract paints, where the browser gives a
   <button> all of them, and a text field its border, padding and background. Layered below the components' sheets, so any value a contract states wins. A project includes it
   once, before the sheets (the toolkit's own rendering of a library does: site.mjs). */
export const BASE = `@layer base, components;
@layer base {
  *, *::before, *::after { box-sizing: border-box; }
  button { appearance: none; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
  input:not([type=checkbox], [type=radio]), textarea { appearance: none; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; }
}
`;

export const PREFIX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*-$/;
// words from the design said in a comment: one line, and never the comment's end, so nothing after it is code
export const said = (x) => String(x).replace(/\*\//g, '* /').replace(/[\r\n\u2028\u2029]+/g, ' ');
export function namer(folder, naming = { kind: 'class', prefix: '', part: '__' }) {
  const block = `${naming.prefix || ''}${folder}`;
  const element = naming.kind === 'element';
  // a custom element's name has a hyphen, and the prefix is what gives it one: with none, `button` would be every button
  if (element && !PREFIX.test(naming.prefix || '')) throw new Error('element naming needs a prefix that ends in a hyphen, such as "ds-": a custom element\'s name has one');
  return {
    element, folder, naming,
    root: element ? block : `.${block}`,
    part: (seg) => (element ? `[data-part="${seg}"]` : `.${block}${naming.part || '__'}${seg}`),
    attr: (key) => propAttr(key, { ...naming, kind: element ? 'element' : 'class' }),
  };
}

/* A token by the custom property the token build writes; a text style by the fields its mixin applies. */
export const tokenNames = {
  token: (name) => `var(${cssName('', name)})`,
  textStyle: (name) => textStyleFields(cssName('', name).slice(2)),
};

/*
 * A text entry: Figma draws its placeholder and its value as two texts in one box, a boolean swapping them; code
 * has one input, whose own text is the value and whose ::placeholder the placeholder, and whether it holds a value
 * is the input's :placeholder-shown, never an attribute. Found by the props that fill the two texts (a
 * Placeholder and a Value). Null where the component has none.
 */
const ENTRY = new WeakMap();
export function entryOf(c) {
  if (ENTRY.has(c)) return ENTRY.get(c);
  const key = (re) => Object.keys(c.props || {}).find((k) => re.test(k) && (c.props[k].sets || []).length);
  const ph = key(/^placeholder$/i), val = key(/^value$/i);
  const placeholder = ph && c.props[ph].sets[0], value = val && c.props[val].sets[0];
  const parentOf = (id) => (c.anatomy[id] || findAdded(c, id) || {}).parent;
  const flag = value && (c.variants || []).find((v) => v.add && v.add[value] && Object.keys(v.when || {}).length === 1 && (v.remove || []).includes(placeholder));
  const flagKey = flag && Object.keys(flag.when)[0];
  const e = placeholder && value && parentOf(placeholder) === parentOf(value) && flagKey && c.props[flagKey].type === 'boolean'
    ? { placeholder, value, box: parentOf(value), flag: flagKey, on: flag.when[flagKey], input: `${parentOf(value)}/input` } : null;
  ENTRY.set(c, e);
  return e;
}

/* The part a numbered copy repeats: `item_2` beside `item`, the same component in the same box, drawn alike (its
   values, words and place in the box aside) and changed by no variant, so one rule says both. One that differs (a
   day drawn disabled, a button of another hierarchy) stays a part of its own. */
const SAME = (e) => JSON.stringify({ ...e, order: undefined, name: undefined, with: undefined, inner: undefined, content: undefined, text: undefined, swappedBy: undefined, figma: undefined });
/* A part as one variant layer draws it: its entry (`base`), what the layer adds for it, and the fields the layer sets on it. */
function partAtVariant(v, id, base) {
  const e = { ...(base || {}), ...((v.add || {})[id] || {}) };
  for (const [k, x] of Object.entries(v.set || {})) if (k.startsWith(`${id}.`) && !k.slice(id.length + 1).includes('.')) e[k.slice(id.length + 1)] = x;
  return e;
}
export function copyOf(c, id) {
  const a = c.anatomy, m = /^(.*)_\d+$/.exec(id);
  const first = m && a[m[1]], e = a[id];
  if (!first || !e || first.kind !== 'instance' || e.kind !== 'instance' || first.parent !== e.parent || first.component !== e.component || SAME(first) !== SAME(e)) return null;
  // (in a box a variant reorders, each child says its place, and a copy says the first's: where another child stands
  // between the two, at the defaults or in a variant, the copy is a part of its own there, or it would be drawn beside
  // the first; copies side by side keep the one rule, tied at one place in the order they are written)
  const lo = Math.min(first.order ?? 0, e.order ?? 0), hi = Math.max(first.order ?? 0, e.order ?? 0);
  // (a part out of the flow between the two, at the defaults or in a variant: the copy may paint over it where the first
  // paints under, so each says its own place by z-index where the box is restacked; a part of its own, never the first's rule)
  // (each part as the layer draws it, a variant's sets on it too: partAtVariant, as restacked reads it)
  const outBetween = (x) => x && x.parent === e.parent && (x.position === 'absolute' || x.absolute) && typeof x.order === 'number' && x.order > lo && x.order < hi;
  const ids = (v) => new Set([...Object.keys(a), ...Object.keys(v.add || {}), ...Object.keys(v.set || {}).map((k) => k.slice(0, k.lastIndexOf('.')))]);
  if ([{}, ...(c.variants || [])].some((v) => [...ids(v)].some((k) => outBetween(partAtVariant(v, k, a[k] || findAdded(c, k)))))) return null;
  if (reordered(c).has(e.parent)) {
    const family = new RegExp(`^${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(_\\d+)?$`);
    const between = (k, o, parent) => parent === e.parent && !family.test(k) && typeof o === 'number' && o > lo && o < hi;
    if (Object.entries(a).some(([k, x]) => between(k, x.order, x.parent))) return null;
    for (const v of c.variants || []) {
      if (Object.entries(v.add || {}).some(([k, x]) => between(k, x.order, x.parent))) return null;
      if (Object.entries(v.set || {}).some(([k, o]) => k.endsWith('.order') && between(k.slice(0, -'.order'.length), o, (a[k.slice(0, -'.order'.length)] || findAdded(c, k.slice(0, -'.order'.length)) || {}).parent))) return null;
    }
  }
  const touched = (k) => (c.variants || []).some((v) => (v.remove || []).includes(k) || k in (v.add || {}) || Object.keys(v.set || {}).some((x) => x.startsWith(`${k}.`)));
  return touched(id) || touched(m[1]) ? null : m[1];
}

/* Each part, base and added, with its parent and the conditions it is drawn under: the variants that add it and those
   that take it away, a pointer state's left to the stylesheet. A part only a pointer state draws is a gap; a focus ring
   drawn as a layer of its own is the ringed element's outline; a part inside a placed component is that component's;
   one inside a slot is a caller's sample. */
export function partsOf(c, t = HOUSE) {
  const props = c.props || {};
  const pointer = (k, v) => (props[k] || {}).role === 'interaction' && ((props[k] || {}).pointer || []).includes(v);
  const parts = new Map();
  const swapsIn = (w, id) => { const k = (/^\{(.+)\}$/.exec(w) || [])[1]; return !!k && (props[k] || {}).type === 'string' && (props[k].sets || []).includes(id); };
  for (const [id, e] of Object.entries(c.anatomy || {})) parts.set(id, { id, e, base: true, adds: [], removes: [], pointerOnly: false, rings: [], words: [] });
  for (const v of c.variants || []) {
    const when = v.when || {};
    const byPointer = Object.entries(when).some(([k, x]) => pointer(k, x));
    for (const [id, e] of Object.entries(v.add || {})) {
      if (!parts.has(id)) parts.set(id, { id, e, base: false, adds: [], removes: [], pointerOnly: true, rings: [], words: [] });
      // (a pointer state's add drawn as a ring is the ringed element's outline there, never an element the markup holds)
      if (byPointer) { const ring = !!ringOf(c, when, id, e, { ...c.anatomy, ...v.add }, t); parts.get(id).rings.push(ring); if (!ring) parts.get(id).pointerAdds = [...(parts.get(id).pointerAdds || []), when]; continue; }
      parts.get(id).pointerOnly = false;
      parts.get(id).adds.push(when);
      const at = parts.get(id);
      if (at.base && typeof e.content === 'string' && !/^\{.*\}$/.test(e.content) && (e.content !== at.e.content || at.words.length)) at.words.push([when, e.content]);
      // (a part only variants draw: each one's words, set out below)
      if (!at.base && typeof e.content === 'string') (at.texts = at.texts || []).push([when, e.content]);
    }
    for (const id of v.remove || []) if (parts.has(id)) { if (byPointer) parts.get(id).pointerGone = true; else parts.get(id).removes.push(when); }
    // words a pointer state sets on a base text (a field's "Search" at focus): marked, for textOf's gap
    if (byPointer) for (const k of Object.keys(v.set || {})) { const m = /^(.+)\.content$/.exec(k); if (m && parts.has(m[1])) parts.get(m[1]).pointerWords = true; }
    // words a variant sets on a base text (a label's * that reads Optional where it is not required)
    if (!byPointer) for (const [k, w] of Object.entries(v.set || {})) {
      const m = /^(.+)\.content$/.exec(k), at = m && parts.get(m[1]);
      // (or another string prop that sets this text, put in its place: a value text where a placeholder was)
      const swap = typeof w === 'string' && (/^\{(.+)\}$/.exec(w) || [])[1], swaps = swap && ((c.props || {})[swap] || {}).type === 'string' && ((c.props[swap].sets || []).includes(m && m[1]));
      if (at && at.base && typeof w === 'string' && (swaps || !/^\{.*\}$/.test(w)) && (w !== at.e.content || at.words.length)) at.words.push([when, w]);
    }
  }
  for (const part of parts.values()) {
    // a part only variants draw, each with its own words (a message at error says the error text, at warning the warning
    // text): in an order no listing changes, the broader variant first and a narrower one over it, so its words are
    // the first's and each other's where it draws them, a prop's that sets this text or words of its own
    if (part.texts && part.texts.length > 1) {
      // (each when said with its props sorted, so the order they are written in changes nothing)
      const said = (w) => JSON.stringify(Object.keys(w).sort().map((k) => [k, w[k]]));
      const ts = [...part.texts].sort(([a], [b]) => Object.keys(a).length - Object.keys(b).length || (said(a) < said(b) ? -1 : said(a) > said(b) ? 1 : 0));
      part.e = { ...part.e, content: ts[0][1] };
      for (const [when, w] of ts.slice(1)) if ((!/^\{.*\}$/.test(w) || swapsIn(w, part.id)) && (w !== part.e.content || part.words.length)) part.words.push([when, w]);
    }
    delete part.texts;
    // a ring where to-code makes it the ringed element's outline at every focus that draws it (to-code's ringOf, the one rule)
    part.ring = !part.base && part.pointerOnly && part.rings.length > 0 && part.rings.every(Boolean);
    // a part the rest of the grid draws that a pointer state also puts in where the rest take it out (a tile's border at
    // hover, a search's clear icon at focus): the markup holds it wherever that state's combination draws it, the
    // pointer value aside, and the sheet hides it where the contract draws none (to-code's pointerShown)
    if (!part.pointerOnly && part.pointerAdds) {
      part.pointerShown = part.pointerAdds.map((w) => Object.fromEntries(Object.entries(w).filter(([k, x]) => !pointer(k, x))));
    }
    for (let up = part.e.parent; up && up !== 'root'; up = ((parts.get(up) || {}).e || {}).parent) {
      const k = ((parts.get(up) || {}).e || {}).kind;
      if (k === 'instance') part.inside = up;
      if (k === 'slot') part.slotted = up;
    }
  }
  return parts;
}

/* partsOf's parts by the box they sit in (`root` for one with no parent), the root aside: the lists to-markup writes
   in markupOrder, and reordered reads. */
export function childrenOf(parts) {
  const kids = new Map();
  for (const part of parts.values()) if (part.id !== 'root') { const up = part.e.parent || 'root'; kids.set(up, [...(kids.get(up) || []), part]); }
  return kids;
}

/* Which of a box's children comes before which, in the defaults and every variant: for each child (`parts`, each
   { id, e, base }: its id, its entry, whether the defaults draw it), the children some variant draws before it. A part a
   variant adds under another box (a part of the defaults among them) is not in this one there. */
function beforeOf(c, parts) {
  const before = new Map(parts.map((p) => [p.id, new Set()]));
  for (const v of [{}, ...(c.variants || [])]) {
    const gone = new Set(v.remove || []), set = v.set || {}, add = v.add || {};
    const away = (p) => p.id in add && (add[p.id].parent ?? p.e.parent) !== p.e.parent;
    const here = parts.filter((p) => !away(p) && ((p.base && !gone.has(p.id)) || p.id in add || (`${p.id}.order` in set && !gone.has(p.id))));
    const at = (p) => set[`${p.id}.order`] ?? (add[p.id] || {}).order ?? p.e.order ?? 0;
    for (const a of here) for (const b of here) if (at(a) < at(b)) before.get(b.id).add(a.id);
  }
  return before;
}

/* A box's children in the one order every variant draws them (to-markup writes them so): a part a variant adds takes
   the place that variant gives it among the rest, not the end; they are put in an order that keeps every variant's
   (beforeOf), the defaults' order breaking ties. `placed` is false where no one order keeps them all (two variants
   disagree, or three or more go round): the defaults' order stands, and a CSS order says the rest (reordered). */
export function markupOrder(c, list) {
  const base = [...list].sort((a, b) => (a.e.order ?? 0) - (b.e.order ?? 0));
  const ids = base.map((p) => p.id), rank = new Map(ids.map((id, i) => [id, i]));
  const before = beforeOf(c, base);
  const out = [], done = new Set();
  while (out.length < ids.length) {
    const next = ids.find((id) => !done.has(id) && [...before.get(id)].every((x) => done.has(x)));
    if (!next) return { order: base, placed: false };
    done.add(next); out.push(next);
  }
  return { order: out.map((id) => base[rank.get(id)]), placed: true };
}

/* The boxes whose children a variant puts in another order: one it sets an order in, or one whose children no one
   markup order draws as every variant does (markupOrder), so each child says its place. */
const REORDERED = new WeakMap();
function reordered(c) {
  if (!REORDERED.has(c)) {
    const ids = (c.variants || []).flatMap((v) => Object.keys(v.set || {}).filter((k) => k.endsWith('.order')).map((k) => k.slice(0, -'.order'.length)));
    const boxes = new Set(ids.map((id) => (c.anatomy[id] || findAdded(c, id) || {}).parent).filter(Boolean));
    // and a box whose children the markup cannot write in one order every variant keeps (markupOrder, the pass to-markup
    // writes them by): a place that only shifts as parts come and go is no reorder
    // (over the very lists the markup orders: partsOf's parts, by box, childrenOf)
    for (const [box, list] of childrenOf(partsOf(c))) if (!boxes.has(box) && list.length > 1 && !markupOrder(c, list).placed) boxes.add(box);
    REORDERED.set(c, boxes);
  }
  return REORDERED.get(c);
}

/* The boxes whose children the browser would paint in another order than the design's, as from-code reads it
   (rules.mjs siblingOrder): a part out of the flow paints over the box's unpositioned children and in markup order
   among the positioned, whatever CSS order says (CSS Flexbox 4.1). A child in the flow paints with the positioned where
   the declarations drawn writes on it say so, by the reader's own rule (rules.mjs liftsAlone): positioned (holding a part
   of its own out of the flow: css.mjs `anchors`; a placed component whose own root does), see-through, transformed,
   isolated (a box restacked itself: so found until no more are). Where some variant's design order is not that, each
   child of the box says its place by z-index (drawn), the box isolated. Compared per variant, as beforeOf; a ring the
   markup holds no element for, and a box inside a placed component or a slot, aside. `mains` as drawn's. */
const RESTACKED = new WeakMap();
function restacked(c, t = HOUSE, mains = NO_MAINS) {
  if (!RESTACKED.has(c)) RESTACKED.set(c, new Map());
  const memo = RESTACKED.get(c);
  if (!memo.has(mains)) {
    const boxes = new Set(), parts = partsOf(c, t), kids = childrenOf(parts);
    const outOf = (e) => e.position === 'absolute' || !!e.absolute;
    // (whether declarations lift a box: true, false, or null where an opacity by a token decides it, its value unknown here)
    const lifts = (decls) => {
      const d = new Map(decls), o = d.get('opacity');
      if (o == null || !/var\(/.test(o)) return liftsAlone((k) => d.get(k));
      const one = liftsAlone((k) => (k === 'opacity' ? '1' : d.get(k))), less = liftsAlone((k) => (k === 'opacity' ? '0' : d.get(k)));
      return one === less ? one : null;
    };
    const either = (...xs) => (xs.includes(true) ? true : xs.includes(null) ? null : false);
    for (let grew = true; grew;) {
    grew = false;
    for (const [box, list] of kids) {
      const B = parts.get(box);
      if (boxes.has(box) || (B && (B.inside || B.slotted || B.e.kind === 'instance' || B.e.kind === 'slot'))) continue;
      const dom = new Map(markupOrder(c, list).order.map((p, i) => [p.id, i]));
      for (const v of [{}, ...(c.variants || [])]) {
        const gone = new Set(v.remove || []), set = v.set || {}, add = v.add || {};
        const asAt = (p) => partAtVariant(v, p.id, p.e);
        const here = list.filter((p) => !p.ring && (asAt(p).parent || 'root') === box && ((p.base && !gone.has(p.id)) || p.id in add || (`${p.id}.order` in set && !gone.has(p.id))));
        if (!here.some((p) => outOf(asAt(p)))) continue;
        const at = (p) => set[`${p.id}.order`] ?? (add[p.id] || {}).order ?? p.e.order ?? 0;
        // (it holds a part out of the flow here, not a ring: positioned, its containing block)
        const anchors = (p) => (kids.get(p.id) || []).some((q) => !q.ring && ((q.base && !gone.has(q.id)) || q.id in add) && (asAt(q).parent || 'root') === p.id && outOf(asAt(q)));
        const lifted = (p) => {
          if (boxes.has(p.id)) return true;
          // (a part turned in a wrapper that is a box: the wrapper is the child, positioned (drawn), so it lifts)
          if (turnedParts(c).has(p.id) && turnBoxed(asAt(p), B ? asAt(B) : c.anatomy[box])) return true;
          const e = asAt(p), m = e.kind === 'instance' && e.component && mains(e.component, e.key);
          // (a placed component this library holds is placed here, its look its own sheet's: what drawn keeps, PLACED)
          const own = lifts(declarations(e, { root: false, holds: holds(e.kind), row: true, anchors: e.kind !== 'instance' && anchors(p), box: null, pull: null }, tokenNames).decls.filter(([k]) => !m || PLACED.test(k)));
          if (!m) return own;
          // (its root as drawn at the props it is placed at, as placedDecls and ownOverride draw it: atProps)
          const A = atProps(m, e.with) || {}, R = A.root || {}, rootAnchors = Object.values(A).some((x) => x && x.parent === 'root' && outOf(x));
          return either(own, lifts(declarations(R, { root: true, holds: holds(R.kind), row: true, anchors: rootAnchors, box: null, pull: null }, tokenNames).decls));
        };
        const lift = new Map(here.map((p) => [p.id, outOf(asAt(p)) ? false : lifted(p)]));
        const want = [...here].sort((x, y) => at(x) - at(y) || dom.get(x.id) - dom.get(y.id)).map((p) => p.id).join();
        // (an unknown one drawn both ways: the box is restacked where either paints out of the design's order)
        const paints = (unknown) => siblingOrder([...here].sort((x, y) => dom.get(x.id) - dom.get(y.id)).map((p) => { const out = outOf(asAt(p)), l = lift.get(p.id) ?? unknown; return { id: p.id, cssOrder: out ? 0 : at(p), stack: { ...(out && { out: true }), ...(l && { lifted: true }) } }; })).map((e) => e.id).join();
        if (paints(true) !== want || paints(false) !== want) { boxes.add(box); grew = true; break; }
      }
    }
    }
    memo.set(mains, boxes);
  }
  return memo.get(mains);
}

/* The native control a component is, by its name: a button's parts are held in a <button>. The contract names no
   element, so its name is the one evidence there is, and it is read narrowly: a radio button is an input, and a group
   of buttons (by its name, or by a button placed in it) is a box; anything else is a box, its element
   frontend-build's to say. `placed` is the components it places, where they are known. */
export function controlOf(name, placed = []) {
  // its words, however written: IconButton, Button_Primary and Icon button alike
  const words = (s) => String(s || '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[^\p{L}\p{N}/]+/gu, ' ').toLowerCase();
  const all = words(name), own = all.split('/').pop().trim();
  if (!/\bbutton\b/.test(own) || /\bradio\b/.test(all) || /\b(buttons|groups?|bar|toolbar|segmented|split)\b/.test(own)) return null;
  return placed.some((x) => /button/i.test(String(x))) ? null : 'button';
}
export const placedIn = (c) => Object.values(c.anatomy || {}).filter((e) => e.kind === 'instance').map((e) => e.component);
// what a placed instance holds: the components its own sheet's controlOf is given, so a holder reaches it as its own
// sheet draws it (its placedIn, where the library holds it: a holder's record may keep none of its insides), else as
// its holder stores it
const heldIn = (c, id, mains = () => null) => {
  const e = (c.anatomy || {})[id] || findAdded(c, id) || {}, m = e.kind === 'instance' && mains(e.component, e.key);
  return m ? placedIn(m) : Object.entries(c.anatomy || {}).filter(([k, x]) => k.startsWith(`${id}/`) && x.kind === 'instance').map(([, x]) => x.component);
};
/* With element naming the host is a custom element wrapping the native control (code-standard rule 8): the host has no
   box of its own (display: contents) and carries the attributes, and the control is the box the contract draws
   (`ds-button > button`). A component placed in another is reached the same way. With class naming the control is the
   root itself, and nothing is added. */
const through = (n, component, placed) => (n.element && controlOf(component, placed) ? ` > ${controlOf(component, placed)}` : '');

/* The controls a component's state is its: the instances whose props its Selected (or Checked) layers set, and a
   field's Value text. */
const CONTROLS = new WeakMap();
function controlsOf(c) {
  if (!CONTROLS.has(c)) {
    const keys = Object.keys(c.props || {}).filter((k) => /^(selected|checked)$/i.test(k) && c.props[k].type === 'boolean');
    const ids = (c.variants || []).filter((v) => keys.some((k) => k in (v.when || {}))).flatMap((v) => Object.keys(v.set || {}).filter((k) => k.endsWith('.with')).map((k) => k.slice(0, -'.with'.length)));
    // a field with no placeholder text of its own (no text entry): the text its Value fills is the input
    const val = !entryOf(c) && Object.keys(c.props || {}).find((k) => /^value$/i.test(k) && c.props[k].type === 'string' && (c.props[k].sets || []).length);
    CONTROLS.set(c, [...[...new Set(ids)].filter((id) => (c.anatomy[id] || findAdded(c, id) || {}).kind === 'instance'), ...(val ? [c.props[val].sets[0]] : [])]);
  }
  return CONTROLS.get(c);
}

/* The selector a prop's value is chosen by, on the root. `mains` and `library` as chain takes them, so a placed control
   is reached as the part rules reach it. */
export function condition(c, n, key, value, t = HOUSE, mains = null, library = {}) {
  const p = c.props[key] || {};
  const entry = entryOf(c);
  // the input's own state, reached down the anatomy by child combinators (code-standard rules 5 and 62)
  const control = entry && `${chain(c, n, entry.input, '', mains, library).slice(n.root.length + 3)}`;
  // where a state reaches: the box itself, a native control directly in it, a text entry's input, and a placed
  // control the contract names (its Selected layer sets that instance's props: a card's checkbox two boxes down),
  // the control or one inside it; never any control at all, so a card's footer button does not dim the card
  const placed = controlsOf(c).map((id) => chain(c, n, id, '', mains, library).slice(n.root.length + 3));
  // a box that names its control is that control's alone: a button beside it in the box is not it
  const reach = (x) => [...(control || placed.length ? [] : [`:has(> ${x})`]), ...(control ? [`:has(> ${control}${x})`] : []), ...placed.flatMap((k) => [`:has(> ${k}${x})`, `:has(> ${k} ${x})`])];
  const dis = disabledKey(c, t);
  // disabled: the control's own, or the attribute where the box has no control to disable (code-standard rule 9)
  const disabled = `:is(${[...(dis ? [`[${n.attr(dis)}]:not([${n.attr(dis)}="false"])`] : []), ':disabled', ...reach(':disabled')].join(', ')})`;
  if (p.role === 'interaction') {
    // a box that names no control is focused when what it holds is (a card's own button or link stands for it)
    const focused = control || placed.length ? reach(':focus-visible') : [':has(:focus-visible)'];
    // each pointer state by the pseudo-class the settings give it: focus reaches what the box holds, a press its control
    const PS = Object.fromEntries(Object.entries(pseudoClasses(t)).map(([v, ps]) => [v, ps === ':focus-visible' ? `:is(:focus-visible, ${focused.join(', ')})`
      : ps === ':active' && control ? `:is(:active, :has(> ${control}:active))` : ps]));
    // a state the contract draws no disabled variant of does not reach a disabled control: there, a disabled box
    // hovered or focused is still drawn at rest
    const notDrawn = (v) => dis && (c.invalid || []).some((w) => w[dis] === true && [].concat(w[key]).includes(v) && Object.keys(w).length === 2);
    const live = (v) => PS[v] + (notDrawn(v) ? `:not(${disabled})` : '');
    if (PS[value]) return live(value);
    // (and where the product sets values of its own too, a disabled or read-only state, the default is not those:
    // its attribute at the default, or none; a rule for the rest state would otherwise reach a disabled box)
    const set = (p.values || []).filter((v) => v !== p.default && !PS[v]);
    if (value === p.default) return Object.keys(PS).map((v) => `:not(${live(v)})`).join('') + (set.length ? `:is([${n.attr(key)}="${value}"], :not([${n.attr(key)}]))` : '');
  }
  if (entry && key === entry.flag) return (value === entry.on) ? `:has(> ${control}:not(:placeholder-shown))` : `:has(> ${control}:placeholder-shown)`;
  if (key === dis) return value ? disabled : `:not(${disabled})`;
  const a = n.attr(key);
  // a box holding a native checkbox or radio, directly or as the control it places, is checked as the control is
  // (code-standard rule 9: the control's own)
  if (p.type === 'boolean' && /^(selected|checked)$/i.test(key)) {
    const placed = controlsOf(c).map((id) => chain(c, n, id, '', mains, library).slice(n.root.length + 3));
    const on = `:is(${[`[${a}]:not([${a}="false"])`, ...(placed.length ? [] : [':has(> :checked)']), ...placed.flatMap((k) => [`:has(> ${k}:checked)`, `:has(> ${k} :checked)`])].join(', ')})`;
    return value ? on : `:not(${on})`;
  }
  // a missing attribute is the default, whichever it is
  if (p.type === 'boolean') return (value === (p.default === true)) ? (value ? `:not([${a}="false"])` : `:not([${a}]:not([${a}="false"]))`) : value ? `[${a}]:not([${a}="false"])` : `[${a}="false"]`;
  return value === p.default ? `:is([${a}="${value}"], :not([${a}]))` : `[${a}="${value}"]`;
}

/*
 * A focus ring drawn as a layer of its own, present only on the focus variant: a box stretched past its parent by
 * the same amount on every side, a stroke and nothing else. In code it is the parent's outline, taking no room,
 * offset by how far its outer edge clears the box less its width (knowledge/code/figma-handoff.md, Focus rings).
 * Null for any other part.
 */
export function ringOf(c, when, id, e, a, t = HOUSE) {
  // the focus state is the one the settings draw with :focus-visible
  const ps = pseudoClasses(t);
  const focus = Object.entries(c.props).some(([k, p]) => p.role === 'interaction' && ps[when[k]] === ':focus-visible');
  const b = e.border, x = e.absolute;
  if (!focus || c.anatomy[id] || !e.parent || e.position !== 'absolute' || !x || e.background || !b || typeof b.color !== 'string') return null;
  if (!e.constraints || e.constraints.horizontal !== 'stretch' || e.constraints.vertical !== 'stretch' || Object.values(a).some((k) => k.parent === id)) return null;
  const out = [x.x, x.y, x.end, x.bottom];
  if (!out.every((v) => typeof v === 'number' && v === out[0])) return null;
  const width = Array.isArray(b.width) ? b.width[0] : b.width ?? 1;
  const w = typeof width === 'string' ? tokenNames.token(width) : `${width}px`;
  // the layer's edge stands `edge` outside the box; its stroke inside that edge, across it or outside it: the outline
  // starts where the stroke does (outline-offset), and its corners follow the box's grown by the edge
  const edge = -out[0], clear = edge;
  const offset = b.align === 'outside' ? `${edge}px` : typeof width === 'number' && b.align !== 'center' ? `${edge - width}px` : `calc(${edge}px - ${b.align === 'center' ? `${w} / 2` : w})`;
  // the outline reads the ring knob first, which a component sets to 0 on a part it rings itself (the scaffold's focus.ring)
  return { parent: e.parent, clear, decls: [['outline', `${w} solid ${tokenNames.token(b.color)}`, undefined, 'ring'], ['outline-offset', offset, clear ? 'no token in the design' : undefined]] };
}

// whether the markup draws a layer as an element of its own: anything but a ring only pointer states add, each a ring
// there (to-markup's partsOf `ring`, read the same way)
function boxedSomewhere(c, id, t) {
  if (c.anatomy[id]) return true;
  const pointer = ([k, v]) => (c.props[k] || {}).role === 'interaction' && (c.props[k].pointer || []).includes(v);
  return (c.variants || []).some((v) => v.add && v.add[id] && (!Object.entries(v.when || {}).some(pointer) || !ringOf(c, v.when || {}, id, v.add[id], { ...c.anatomy, ...v.add }, t)));
}

// where a box out of the flow stands to cover another's border box: an absolute box is placed in its parent's padding
// box, so out past the border css.mjs draws as one (an inside stroke in the layout; any other is a shadow or an
// outline, which takes no room), side by side
const OVER = ['top', 'end', 'bottom', 'start'];
// whether css.mjs draws a box's stroke as its outline: all round, one width, outside (beside no effect style) or centred
function strokeOutline(P) {
  const b = P.border;
  if (!b || b.color === undefined) return false;
  const W = Array.isArray(b.width) ? b.width : OVER.map(() => b.width ?? 1);
  const on = W.map((x, i) => (b.sides ? !!b.sides[OVER[i]] : x !== 0) && x !== 0), align = b.align || 'inside';
  if (!on.every(Boolean) || !W.every((x) => x === W[0])) return false;
  // (a dashed one is an outline whatever its alignment)
  if (b.dash && (!Array.isArray(b.dash) || b.dash.length) && !(align === 'inside' && b.inLayout)) return true;
  if (align === 'inside') return false;
  return !(align === 'outside' && typeof P.shadow === 'string' && P.shadow !== 'literal');
}
function overBorder(P) {
  const b = P.border;
  // (css.mjs's own reading: no paint draws nothing, an unsaid width is 1, a side its weight where no width says it)
  if (!b || b.color === undefined || (b.align || 'inside') !== 'inside' || !b.inLayout) return '0';
  const W = Array.isArray(b.width) ? b.width : OVER.map(() => b.width ?? 1);
  const at = W.map((x, i) => {
    if ((b.sides ? !b.sides[OVER[i]] : x === 0) || x === 0) return '0';
    const v = x ?? (b.sides && typeof b.sides[OVER[i]] === 'number' ? b.sides[OVER[i]] : null);
    return v == null ? '0' : typeof v === 'number' ? `-${v}px` : `calc(-1 * ${tokenNames.token(v)})`;
  });
  return at.every((x) => x === '0') ? '0' : at.join(' ');
}

// whether a box paints (a fill, a stroke, a shadow, a clip, a shape, a mask) in the base or any variant
const PAINTS = ['background', 'border', 'shadow', 'shape', 'mask', 'overflow'];
// whether a box can be ringed by a box of its own in some combination: it paints somewhere, and a ring over it has
// corners somewhere that its own differ from
function ownable(c, id) {
  const vs = c.variants || [], adds = vs.flatMap((v) => Object.entries(v.add || {}));
  // (any part a variant adds under it, or moves there: a set can make one a ring after the add, as ringOf reads it
  // expanded; too many only writes a box that draws nothing)
  const rings = new Set([...adds.filter(([, e]) => e && e.parent === id).map(([k]) => k), ...vs.flatMap((v) => Object.entries(v.set || {}).filter(([k, x]) => k.endsWith('.parent') && x === id).map(([k]) => k.slice(0, -'.parent'.length)))]);
  const sets = (k) => vs.filter((v) => v.set && `${k}.radius` in v.set).map((v) => v.set[`${k}.radius`]);
  const R = [...rings].flatMap((k) => [...adds.filter(([j]) => j === k).map(([, e]) => e.radius), ...sets(k)]).filter((r) => r != null);
  // (the box's own corners in any combination, none among them where its base or an add says none)
  const Q = [(c.anatomy[id] || {}).radius, ...adds.filter(([j]) => j === id).map(([, e]) => e.radius), ...sets(id)];
  // (or where its own stroke can be drawn as its outline, whose ring then takes a box of its own)
  const strokes = [(c.anatomy[id] || {}).border, ...adds.filter(([j]) => j === id).map(([, e]) => e.border), ...vs.map((v) => (v.set || {})[`${id}.border`])].filter(Boolean);
  return paintsAny(c, id) && (R.some((r) => Q.some((q) => q !== r)) || strokes.some((b) => strokeOutline({ border: b })));
}
const paintsAny = (c, id) => PAINTS.some((k) => [c.anatomy[id], ...(c.variants || []).map((v) => (v.add || {})[id])].some((e) => e && !!e[k]) || (c.variants || []).some((v) => v.set && !!v.set[`${id}.${k}`]));

// the boxes whose gap is below 0 in the base or any variant (rules.mjs: CSS says it as pull-backs)
const PULLS = new WeakMap();
function everPulls(c) {
  if (PULLS.has(c)) return PULLS.get(c);
  const ids = new Set();
  const look = (id, l) => { if (l && negative(l.gap)) ids.add(id); };
  const kind = (id) => ((c.anatomy || {})[id] || (c.variants || []).map((v) => (v.add || {})[id]).find(Boolean) || {}).kind;
  for (const [id, e] of Object.entries(c.anatomy || {})) look(id, e.layout);
  for (const v of c.variants || []) {
    for (const [id, e] of Object.entries(v.add || {})) look(id, e.layout);
    // a variant sets a layout whole (layers.mjs applies one level)
    for (const [f, x] of Object.entries(v.set || {})) { const m = /^(.+)\.layout$/.exec(f); if (m) look(m[1], x); }
  }
  // an instance's insides are its own sheet's
  for (const id of [...ids]) if (kind(id) === 'instance') ids.delete(id);
  PULLS.set(c, ids);
  return ids;
}

/* The nearest placed instance a part is inside, where none above it sits in a slot: the component whose own part it is
   (one placed inside another is reached through both: hostIn, chain). */
function hostOf(a, id) {
  let host = null;
  if ((a[(a[id] || {}).parent] || {}).kind === 'slot') return null;
  for (let p = a[id] && a[id].parent; p; p = a[p] && a[p].parent) {
    if (!a[p]) return null;
    if ((a[a[p].parent] || {}).kind === 'slot') return null;
    if (a[p].kind === 'instance' && !host) host = p;
  }
  return host;
}

/* Every layer any combination records, as chain names it: the base's, else the first variant's that adds it (findAdded). */
const allOf = (c) => Object.assign({}, ...[...(c.variants || [])].reverse().map((v) => v.add || {}), c.anatomy);
/* A part turned a quarter, either way, in some combination, in its parent's flow, that this component draws itself (not a
   placed component's inside, a slot's sample, a numbered copy or a field's text): drawn inside a wrapper, `[data-turn]`.
   Figma keeps a turned node's own width and height and lays out its turned box (derive.cjs QUARTER: its sizing words
   said of its own axes); a transform lays out nothing (css-transforms-1 §3), so the wrapper takes the part's place in
   the flow, on the parent's axes, as a size container (css-contain-3 §4.1), and the part inside is drawn at its own
   size (cqw, cqh: css-contain-3 §6), centred and turned. Where a combination does not turn it a quarter, or one of its
   own sizes hugs (a box sized by what it holds cannot be a size container's), the wrapper is display: contents and the
   part turns in place as before. Read back by from-code.mjs (the wrapper's sizes, the part's own box). */
export const quarter = (r) => typeof r === 'number' && Math.abs(Math.abs(r) - 90) < 0.01;
const TURNED = new WeakMap();
/* Whether a turned part's wrapper is a box where the part is `e` in a parent `up` (drawn writes it so; restacked stacks it
   as the child): turned a quarter in the parent's auto layout, neither own size hugging. */
const sizedTurn = (v) => v === 'fill' || typeof v === 'number' || (typeof v === 'string' && v !== 'hug');
export const turnBoxed = (e, up) => quarter(e.rotation) && !!(up && up.layout && up.layout.direction) && sizedTurn(e.width) && sizedTurn(e.height);
export function turnedParts(c) {
  if (TURNED.has(c)) return TURNED.get(c);
  const all = allOf(c), ids = new Set(), out = new Set();
  for (const a of [c.anatomy || {}, ...(c.variants || []).map((v) => v.add || {})]) for (const [id, e] of Object.entries(a)) if (e && quarter(e.rotation)) ids.add(id);
  for (const v of c.variants || []) for (const [k, x] of Object.entries(v.set || {})) { const m = /^(.+)\.rotation$/.exec(k); if (m && quarter(x)) ids.add(m[1]); }
  const placedAt = (id) => [c.anatomy || {}, ...(c.variants || []).map((v) => v.add || {})].some((a) => a[id] && (a[id].position === 'absolute' || a[id].absolute))
    || (c.variants || []).some((v) => (v.set || {})[`${id}.position`] === 'absolute' || (v.set || {})[`${id}.absolute`]);
  const entry = entryOf(c);
  for (const id of ids) {
    if (id === 'root' || !all[id] || placedAt(id) || copyOf(c, id) || Object.keys(all).some((k) => k !== id && copyOf(c, k) === id)) continue;
    if (entry && [entry.value, entry.placeholder, entry.input].includes(id)) continue;
    let held = false;
    for (let p = all[id].parent; p && all[p]; p = all[p].parent) if (all[p].kind === 'instance' || all[p].kind === 'slot') { held = true; break; }
    if (!held) out.add(id);
  }
  TURNED.set(c, out);
  return out;
}

/* What a text bound to a text property of `contract` shows: that property's default (css.mjs `words`, which says its
   white space from it); null for any other layer. */
const wordsOf = (contract, x) => {
  const b = x && x.kind === 'text' && typeof x.content === 'string' && /^\{(.+)\}$/.exec(x.content), d = b && contract && contract.props && contract.props[b[1]] ? contract.props[b[1]].default : null;
  return typeof d === 'string' ? d : null;
};

/* A layer inside a placed instance against its component's own part at the instance's props: the declarations each
   writes, what differs, and what the component draws that the instance takes away; null where no part matches. */
function overrideOf(a, host, rel, m, mains, B = a, c = null) {
  if (!a[host]) return null;
  // the component as placed (swaps applied, as derive compares it); a layer derive dropped here (equal to the
  // component's) is matched by its name at the defaults (B), and draws as the component does
  const { M } = placedAs(a, host, m, mains), e = a[`${host}/${rel}`];
  // placed inside another placed component (a stop's dot in Stops): what that one draws there is the base, its own
  // override where it keeps one, else the inner component's part; never the inner one's alone, or the middle's rule
  // (painted over the inner's) would stand where this one goes back to the inner's value
  let mid = null;
  for (let p = a[host] && a[host].parent; p && !mid; p = a[p] && a[p].parent) if (a[p] && a[p].kind === 'instance') { const om = mains(a[p].component, a[p].key); const r2 = `${host.slice(p.length + 1)}/${rel}`; if (om && om.anatomy && om.anatomy[r2]) mid = { e: om.anatomy[r2], up: om.anatomy, of: om }; }
  const inner = M[placedOf(e ? a : B, host, M)[rel]];
  const own = mid ? { ...inner, ...mid.e } : inner, ownUp = mid ? mid.up : M;
  if (!own || !inner) return null;
  // (a bound text's words from the contract whose property it names: the host's for its own layer, the middle
  // component's where it binds the part, else the placed component's, as for a name the host has no property for; `c`, the host)
  // (the placed part's own words: what it shows at the instance's props, a literal there, else its binding's default)
  const lit = (x) => (x && typeof x.content === 'string' && !/^\{.+\}$/.test(x.content) ? x.content : null);
  const ownWords = lit(own) ?? (mid && mid.e.content !== undefined ? wordsOf(mid.of, own) : wordsOf(m, own)), wordsAt = (x) => (x === own ? ownWords : x === e ? wordsOf(c, e) ?? ownWords : wordsOf(m, x));
  const ctx = (x, par) => ({ root: false, holds: holds(x.kind), row: !par || (par.layout || {}).direction !== 'column', wrap: !!(par && par.layout && par.layout.wrap), anchors: false, box: null, pull: null, words: wordsAt(x) });
  // a nested instance is placed, never restyled here: where it sits and how big (PLACED), as any placed instance
  // (and its own styling over its component's root, drawn whole on both sides: an override set on the nested instance itself)
  const styled = (x, par) => (x.kind === 'instance' ? placedDecls(x, ctx(x, par), mains, e && e.kind === 'instance' ? e : x) : declarations(x, ctx(x, par), tokenNames).decls);
  const theirs = new Map(styled(own, mid ? ownUp[mid.e.parent] : M[own.parent]).map(([p, v]) => [p, v]));
  if (!e) return { mine: [...theirs], theirs, removed: [], changed: [] };
  // the instance lays its insides out as its component's root does, where it states no layout of its own
  // where a layer sits inside a placed component is never the instance's to change (figma-fact:no-nested-position-override; Figma's help, "Apply changes to
  // instances": no override of the position of any layer within the component, its constraints or its order): neither
  // what a record says of it is written, nor what it leaves out (derive keeps no place for a layer two deep) unset
  const fixed = (p) => /^(position|inset.*|top|right|bottom|left|translate|order|z-index)$/.test(p);
  const mine = styled(e, e.parent === host ? { ...M.root, ...a[host], layout: (a[host] || {}).layout || M.root.layout } : a[e.parent]).filter(([p]) => !fixed(p));
  const said = new Set(mine.map(([p]) => p));
  const removed = [...theirs.keys()].filter((p) => !said.has(p) && !fixed(p));
  return { mine, theirs, removed, changed: [...mine.filter(([p, v]) => theirs.get(p) !== v), ...removed.map((p) => [p, 'unset'])] };
}

/* A placed instance's declarations drawn whole: where it sits and how big (PLACED), and its own styling over its
   component's root at its props (derive's ownStyling keeps on an instance only a field that differs from that root: a
   fill, stroke or layout set on the instance itself, an override), said as that root with those fields over it; only
   PLACED where the library does not hold the component. `ctx` is the instance's own (where it sits); `at`, the instance
   whose component and props give the root (the record compared with, so a nested instance's other props, which its own
   sheet draws, never read as an override). */
function placedDecls(x, ctx, mains, at = x) {
  const m = at.component && mains(at.component, at.key), R = m && atProps(m, at.with).root;
  const all = declarations(x, ctx, tokenNames).decls, placed = all.filter(([p]) => PLACED.test(p));
  // (one the store does not hold, an icon of another library, has no sheet to draw its box: all it states is its own)
  if (!m && at.component && mains && mains !== NO_MAINS) return all;
  if (!R) return placed;
  const whole = { ...R, ...Object.fromEntries(OWN.filter((f) => x[f] != null).map((f) => [f, x[f]])) };
  return [...placed, ...declarations(whole, { ...ctx, holds: holds(R.kind), words: wordsOf(m, whole) }, tokenNames).decls.filter(([p]) => !PLACED.test(p))];
}

/* An instance's own styling against its component's root at its props: what it writes that the root does not (or
   unsets), each beside the root's own value (`theirs`), so a combination where the instance no longer overrides a
   property the base rule writes says the component's own value. */
function ownOverride(x, ctx, mains) {
  const m = x.component && mains(x.component, x.key), R = m && atProps(m, x.with).root;
  if (!R) return { changed: [], theirs: new Map() };
  const styled = (y) => new Map(declarations(y, { ...ctx, holds: holds(R.kind), words: wordsOf(m, y) }, tokenNames).decls.filter(([p]) => !PLACED.test(p)));
  const theirs = styled(R), mine = styled({ ...R, ...Object.fromEntries(OWN.filter((f) => x[f] != null).map((f) => [f, x[f]])) });
  return { theirs, changed: [...[...mine].filter(([p, v]) => theirs.get(p) !== v), ...[...theirs.keys()].filter((p) => !mine.has(p)).map((p) => [p, 'unset'])] };
}

/* The properties an instance's own styling overrides at any combination that places it (the defaults', and each
   variant's that adds it or sets a field of it, at the defaults' other values): each combination says every one, its
   override or its component's own value, so no rule of another combination's reaches it, nor an `unset` the cascade
   would write where one drops it (which would undo the component's own value). */
/* The properties any combination overrides on a part inside a placed component (its own differing from the
   component's there): at the defaults and at each variant that adds or sets the part. */
const EVER_IN = new WeakMap();
function everInside(c, id, mains) {
  const byLib = EVER_IN.get(c) || new WeakMap(); EVER_IN.set(c, byLib);
  const memo = byLib.get(mains) || new Map(); byLib.set(mains, memo);
  if (memo.has(id)) return memo.get(id);
  const ps = new Set(), d = variantDefaults(c), B = expand(c, d);
  for (const when of [d, ...(c.variants || []).filter((v) => (v.add || {})[id] || Object.keys(v.set || {}).some((k) => k.startsWith(`${id}.`))).map((v) => ({ ...d, ...v.when }))]) {
    const a = expand(c, when), host = a[id] && hostOf(a, id), m = host && a[host].component && mains(a[host].component, a[host].key);
    const over = m && overrideOf(a, host, id.slice(host.length + 1), m, mains, B, c);
    if (over) for (const [p, v] of over.mine) if (over.theirs.get(p) !== v) ps.add(p);
  }
  memo.set(id, ps);
  return ps;
}
const EVER = new WeakMap();
function everOverrides(c, id, mains, ctx) {
  // (per library too: the same contract read against another set of mains overrides otherwise)
  const byLib = EVER.get(c) || new WeakMap(); EVER.set(c, byLib);
  const memo = byLib.get(mains) || new Map(); byLib.set(mains, memo);
  if (memo.has(id)) return memo.get(id);
  const ps = new Set(), d = variantDefaults(c);
  for (const when of [d, ...(c.variants || []).filter((v) => (v.add || {})[id] || Object.keys(v.set || {}).some((k) => k.startsWith(`${id}.`))).map((v) => ({ ...d, ...v.when }))]) {
    const x = expand(c, when)[id];
    if (x && x.kind === 'instance') for (const [p] of ownOverride(x, ctx, mains).changed) ps.add(p);
  }
  memo.set(id, ps);
  return ps;
}

/* The colour a placed component draws the glyph of an icon it places in (its part at `rel` inside the instance at
   `host`): that part's own glyph's, else the icon's component's own at the props it is given; null for none. */
function placedGlyph(a, host, rel, m, mains) {
  const { M } = placedAs(a, host, m, mains), at = placedOf(a, host, M)[rel], part = at && M[at];
  if (!part || part.kind !== 'instance') return null;
  const g = Object.values(M).find((x) => x && x.parent === at && x.kind === 'graphic');
  if (g) return typeof g.background === 'string' ? g.background : null;
  const im = part.component && mains(part.component, part.key);
  return (im && glyphColour(im, part.with)) || null;
}

/* The layers recorded inside a placed instance, each matched to the part of its component it is (derive's placedMatch). */
const placedOf = (a, host, M) => placedMatch(M, Object.fromEntries(Object.keys(a).filter((k) => k.startsWith(`${host}/`)).map((k) => [k.slice(host.length + 1), a[k]])));

/* Whether a part is inside a placed component this library holds, so named as that component's own: a part of it at
   any props the instance is placed with (a status icon's Warning--filled at Failed, though another variant places it
   at Warning alt, which draws none). */
const hostIn = (c, id, mains) => { const a = allOf(c); const h = hostOf(a, id), m = h && a[h].component && mains(a[h].component, a[h].key);
  if (!m || copyOf(c, h) || Object.keys(a).some((k) => k !== h && copyOf(c, k) === h) || (hostOf(a, h) && !hostIn(c, h, mains))) return false;
  const withs = [a[h].with, ...(c.variants || []).flatMap((v) => [((v.add || {})[h] || {}).with, (v.set || {})[`${h}.with`]])].filter((w, i) => i === 0 || w);
  return withs.some((w) => !!placedOf(a, h, placedAs({ ...a, [h]: { ...a[h], with: w } }, h, m, mains).M)[id.slice(h.length + 1)]); };

/* Each part's declarations at one combination, as a map property → value (with its note). */
// no store given: what a placed component draws is not known, so none is taken to be missing from it
const NO_MAINS = () => null;
export function drawn(c, when, mains = NO_MAINS, t = HOUSE) {
  mains ||= NO_MAINS;
  const a = expand(c, when);
  const out = {}, extra = [], ringNotes = {};
  // the component at its defaults: what the base rule writes, which every other combination inherits
  const B = expand(c, variantDefaults(c));
  // every layer any combination records, as chain names it (the base's, and what variants add)
  const ALL = allOf(c);
  // (inside a placed component: its glyph's colour is that component's, or an override there: recolour, below)
  const insideAny = (id) => { for (let p = a[id].parent; p; p = a[p] && a[p].parent) if (a[p] && a[p].kind === 'instance') return true; return false; };
  const recolour = new Map();
  // an instance whose insides are its component's (derive drops them) draws its glyph in the colour that component
  // gives it at the instance's props: the same colour, said the same way, as an opened instance's recorded glyph
  for (const [id, e] of Object.entries(a)) {
    if (e.kind !== 'instance' || Object.values(a).some((x) => x.parent === id && x.kind === 'graphic') || insideAny(id)) continue;
    const m = e.component && mains(e.component, e.key);
    if (!m) continue;
    const glyph = glyphColour(m, e.with);
    if (glyph) extra.push([id, [['color', tokenNames.token(glyph)]]]);
  }
  // a gap below 0 is said by pull-backs (rules.mjs): each child's start margin on its own rule (an instance's
  // insides are its own sheet's)
  const pulls = (p) => !!(p && p.kind !== 'instance' && p.layout && negative(p.layout.gap) && p.layout.align !== 'space-between');
  // a box that pulls in any combination says its pull-back in every one (0 where it does not), so a variant back to a
  // gap of 0 or more unsets it rather than keeping the base's
  const pulling = everPulls(c);
  const turned = turnedParts(c);
  const firstInFlow = (pid) => Object.entries(a).filter(([, x]) => x.parent === pid && !(x.position === 'absolute' || x.absolute)).sort((x, y) => (x[1].order ?? 0) - (y[1].order ?? 0))[0]?.[0];
  // a placed component's insides are its own stylesheet's (code-standard rule 5): this one stops at the instance
  const inside = (id) => { for (let p = a[id].parent; p; p = a[p] && a[p].parent) if (a[p] && (a[p].kind === 'instance' || (a[a[p].parent] || {}).kind === 'slot')) return true; return false; };
  for (let [id, e] of Object.entries(a)) {
    if (inside(id)) {
      // save the colour the instance's glyph is drawn in, which the placing component sets on it: an icon draws
      // in its element's color (currentColor), so the colour is the instance's
      // (a component this library holds draws it as its own part: an override on that part, below)
      if (a[e.parent] && a[e.parent].kind === 'instance' && e.kind === 'graphic' && typeof e.background === 'string') {
        // (a glyph said as its instance gives it its opacity too, times the instance's own: rules.mjs heldGlyph, heldOpacity)
        const lone = !Object.keys(a).some((k) => k !== id && k.startsWith(`${e.parent}/`)), opacity = heldGlyph(a[e.parent], e, lone) ? heldOpacity(a[e.parent], e) : undefined;
        if (inside(e.parent)) recolour.set(e.parent, e.background); else extra.push([e.parent, [['color', tokenNames.token(e.background)], ...(opacity !== undefined ? [['opacity', String(opacity)]] : [])]]);
      }
      // an override inside a placed component this library holds (derive keeps only a part that differs from that
      // component drawn at the instance's props): what it changes there, on that component's own part, reached through
      // the instance (chain); at any depth of placing (each placed component names its own parts down to the next it holds), a part the placed component no longer has said, not guessed
      const host = hostOf(a, id), m = host && a[host].component && mains(a[host].component, a[host].key);
      // (inside one placed inside another: the inner one is reached as the outer one's own part, or not at all)
      if (!m || (hostOf(a, host) && !hostIn(c, host, mains))) continue;
      const rel = id.slice(host.length + 1);
      // the selector names the part by the component the instance places in its base (chain): a variant that places
      // another there is said, not written under the first one's names
      if ((ALL[host] || {}).component !== a[host].component) { out[id] = { decls: new Map(), unread: [`an override on ${rel}, inside ${a[host].component}, which a variant places where ${(ALL[host] || {}).component} is`] }; continue; }
      // a numbered copy takes its first's class and place (nth-child), and its first's rule styles every copy: an
      // override on one of them is said, not written on all
      if (copyOf(c, host) || Object.keys(a).some((k) => k !== host && copyOf(c, k) === host)) { out[id] = { decls: new Map(), unread: [`an override on ${rel}, inside one of several copies of ${a[host].component}`] }; continue; }
      const over = overrideOf(a, host, rel, m, mains, a, c);
      if (!over) { out[id] = { decls: new Map(), unread: [`an override on ${rel}, a layer ${a[host].component} has under no such name (renamed in the instance, or gone)`] }; continue; }
      // what differs here, and what differs at the defaults (the base rule writes it, so every combination says it: where
      // it no longer differs, the placed component's own value, not the base's override)
      const at = B[id] && overrideOf(B, host, rel, m, mains, B, c), base = new Set(at ? at.changed.map(([p]) => p) : []);
      // what the component declares that the instance does not goes back to what an undeclared property is (unset)
      // (and what the defaults override that neither draws here, a fill the base sets and this combination takes away
      // where the component has none: unset, or the base's override would stand)
      const said = new Set([...over.mine.map(([p]) => p), ...over.removed]);
      // (a value only the defaults' override makes it say, the component's own here, is `given`: said where a rule sets it)
      // (and the component's own value, given, where any combination overrides that property otherwise, a variant's add
      // among them: a rule before this one that does is answered with that value, never left to the cascade's unset,
      // which would undo the component's own; elsewhere nothing is written)
      const ever = everInside(c, id, mains);
      const decls = [...over.mine.filter(([p, v]) => over.theirs.get(p) !== v || base.has(p) || ever.has(p)).map(([p, v, note]) => [p, v, note, over.theirs.get(p) === v]), ...over.removed.map((p) => [p, 'unset']), ...[...base].filter((p) => !said.has(p) && !over.theirs.has(p)).map((p) => [p, 'unset', undefined, true])];
      if (decls.length) out[id] = { decls: new Map(decls.map(([p, v, note, given]) => [p, { v, note, ...(given && { given: true }) }])), unread: [] };
      continue;
    }
    // a slot's children are samples of what a caller puts there: the first says where any child sits, as
    // the slot's every child (`> *`), and none says how it looks
    const slotted = e.parent && a[e.parent] && a[e.parent].kind === 'slot';
    if (slotted && out[`${e.parent}/*`]) continue;
    // a numbered copy of a placed component beside its first (item, item_2, item_3: rows of a list) is one more of
    // it: it takes the first's class and rule, so a list of any length is styled
    if (copyOf(c, id)) continue;
    // the two texts are one input: it takes the value's box and type whichever is drawn, and ::placeholder the
    // placeholder's text alone (its box is the input's)
    const entry = entryOf(c);
    if (entry && (id === entry.value || id === entry.placeholder)) continue;
    const ring = ringOf(c, when, id, e, a, t);
    // (a layer the markup draws as an element of its own, a box at another combination, draws nothing where its outline
    // rings: a rule of that combination would otherwise reach here and draw the layer twice, the box and the outline)
    if (ring && boxedSomewhere(c, id, t)) out[id] = { decls: new Map([['display', { v: 'none' }]]), unread: [] };
    if (ring) {
      // an outline follows its box's corners: a box that paints nothing (a bare frame around what it holds) takes the
      // ring's corners less the ring's clearance while focused, which shows only as the ring; one that paints keeps its own
      // (nor clips what it holds, nor is drawn as a shape or a mask: rounding those would show); a ring rounder by no more
      // than its clearance, or of mixed corners, keeps the note
      const P = a[ring.parent], bare = !P.background && !P.border && !P.shadow && P.overflow !== 'hidden' && !P.shape && !P.mask, clips = P.overflow === 'hidden';
      const corners = e.radius !== undefined && e.radius !== P.radius && bare && (typeof e.radius === 'number' ? (e.radius > ring.clear ? `${e.radius - ring.clear}px` : null) : typeof e.radius === 'string' && e.radius !== 'mixed' ? (ring.clear ? `calc(${tokenNames.token(e.radius)} - ${ring.clear}px)` : tokenNames.token(e.radius)) : null);
      // one that paints or clips keeps its corners, and the ring is drawn by a box of its own over it (::after, the
      // parent's box, its corners the ring's less its clearance, taking no pointer), outlined as the parent would be
      const own = !corners && !bare && !(clips && ring.clear > 0) && e.radius !== undefined && e.radius !== P.radius && (typeof e.radius === 'number' ? (e.radius > ring.clear ? `${e.radius - ring.clear}px` : null) : typeof e.radius === 'string' && e.radius !== 'mixed' ? (ring.clear ? `calc(${tokenNames.token(e.radius)} - ${ring.clear}px)` : tokenNames.token(e.radius)) : null);
      // (a box whose own stroke is drawn as its outline, a dashed one among them, keeps it: the ring takes a box of its own
      // there too, its corners the box's own where no others are said)
      const box = own || (strokeOutline(P) ? corners || 'inherit' : null);
      if (box) {
        // (the box's own outline off, or the browser's focus outline would show beside the ring; unless its own stroke
        // is drawn as its outline, which stays and stands in the browser's stead)
        extra.push([ring.parent, [...(P.position !== 'absolute' && !P.absolute ? [['position', 'relative']] : []), ...(strokeOutline(P) ? [] : [['outline', 'none']])]]);
        out[`${ring.parent}::after`] = { decls: new Map([['content', { v: '""' }], ['position', { v: 'absolute' }], ['inset', { v: overBorder(P) }], ['border-radius', { v: box }], ['pointer-events', { v: 'none' }], ...ring.decls.map(([p, v, note, knob]) => [p, { v, note, knob }])]), unread: [] };
        continue;
      }
      // (where another combination could ring this box by a box of its own, that box draws nothing here: the cascade
      // unsets only what a combination draws, so its rule would otherwise reach this one beside the outline; so one box
      // is never ringed twice, whichever way each combination rings it)
      if (ownable(c, ring.parent)) out[`${ring.parent}::after`] = { decls: new Map([['content', { v: 'none' }]]), unread: [] };
      extra.push([ring.parent, corners ? [...ring.decls, ['border-radius', corners]] : ring.decls]);
      if (e.radius !== undefined && e.radius !== P.radius && !corners) (ringNotes[ring.parent] ||= []).push(`the focus ring's corners (${e.radius}): an outline follows its box's own`);
      continue;
    }
    const parent = e.parent ? a[e.parent] : null;
    // an outer box laid out at a drawn width: the width is the frame's, and the box takes its container's, so a
    // parent that stretches it is obeyed; a component that keeps its own width says so in its own sheet
    const sample = id === 'root' && e.layout && e.layout.direction && typeof e.width === 'number';
    if (sample) e = { ...e, width: 'fill' };
    const anchors = Object.values(a).some((x) => x.parent === id && (x.position === 'absolute' || x.absolute) && !ringOf(c, when, Object.keys(a).find((k) => a[k] === x), x, a, t));
    // the parent's own size, where it is a number: what a part that scales with it is a share of
    // (or one stretched between its own parent's edges, placed out of the flow: that parent's size less both offsets,
    // as a skeleton's shimmer scales inside a fill stretched over its box)
    const sizeOf = (pid, k, depth = 0) => {
      const p = a[pid];
      if (!p || depth > 32) return null;
      if (typeof p[k] === 'number') return p[k];
      const [axis, near, far] = k === 'width' ? ['horizontal', 'x', 'end'] : ['vertical', 'y', 'bottom'];
      const at = p.absolute || {};
      if (p.parent && (p.constraints || {})[axis] === 'stretch' && typeof at[near] === 'number' && typeof at[far] === 'number') {
        const whole = sizeOf(p.parent, k, depth + 1);
        return typeof whole === 'number' ? +(whole - at[near] - at[far]).toFixed(2) : null;
      }
      return null;
    };
    const box = parent ? { width: sizeOf(e.parent, 'width'), height: sizeOf(e.parent, 'height') } : null;
    // in a box whose gap is below 0 in any combination, every child says its pull back in every one: the gap after
    // the first in the flow, 0 for the first and for a placed part, 0 where the gap is not below 0 (a variant's own
    // value, never an unset that would leave the base's)
    const pull = e.parent && pulling.has(e.parent) ? (e.position === 'absolute' || e.absolute || firstInFlow(e.parent) === id || !pulls(parent) ? 0 : parent.layout.gap) : null;
    // a size Figma keeps only while the part is empty (derive's whileEmpty): written under `::empty` (chain: while it holds
    // no element), never as a minimum the filled part keeps
    // (a slot's sample frame says nothing of what a caller puts there: its empty size is the sample's, written nowhere,
    // or every leaf a caller places, a <p> or an <img>, would take it)
    // (and a combination that drops the sample's mark but keeps its size has the defaults' kept size still: dropped too)
    const empty = [...new Set([...(e.whileEmpty || []), ...(slotted && B[id] ? (B[id].whileEmpty || []).filter((f) => e[f] === B[id][f]) : [])])].filter((f) => e[f] !== undefined);
    if (empty.length) { e = { ...e }; for (const f of empty) delete e[f]; delete e.whileEmpty; }
    const { decls, unread, unshared } = declarations(e, { root: id === 'root', holds: holds(e.kind), row: !parent || (parent.layout || {}).direction !== 'column', wrap: !!(parent && parent.layout && parent.layout.wrap), anchors, box, pull, words: wordsOf(c, e) }, tokenNames);
    // a placed component is placed here and looks as its own sheet says (code-standard rule 5): where it sits and
    // how big, never its fill, stroke, corners or type, which a prop changes in code
    // (but an instance of a component the store does not hold, an icon of another library: no sheet of its own draws
    // its box, and derive kept every field it states, so its fill, stroke and corners are written here, as a box's)
    // (known only where the store was given: with none, every placed component is taken to be held)
    const unheld = e.kind === 'instance' && mains !== NO_MAINS && !(e.component && mains(e.component, e.key));
    const kept = (e.kind === 'instance' && !unheld) || slotted ? decls.filter(([p]) => PLACED.test(p)) : decls;
    // save an override set on the instance itself (derive keeps only what differs from its component's root at its
    // props: Carbon's toggle fills its toggle item per state): written on the instance, and where the defaults' override
    // no longer holds, the component's own value, as an override inside one is
    if (e.kind === 'instance' && !unheld && !slotted) {
      const ictx = { root: false, holds: holds(e.kind), row: !parent || (parent.layout || {}).direction !== 'column', wrap: !!(parent && parent.layout && parent.layout.wrap), anchors: false, box: null, pull: null };
      const over = ownOverride(e, ictx, mains), said = new Set(over.changed.map(([p]) => p));
      // (the component's own value said only where a rule before this one sets it otherwise, `given`: elsewhere nothing,
      // so the component's own sheet, its pointer states included, holds there)
      kept.push(...over.changed, ...[...everOverrides(c, id, mains, ictx)].filter((p) => !said.has(p)).map((p) => [p, over.theirs.get(p) ?? 'unset', undefined, true]));
    }
    if (sample) kept.push(['inline-size', '100%']);
    // where a variant reorders a box's children (a Reversed), each child says its place, so the order follows the props
    // (only where an auto layout lays it out, and never on a part out of the flow: order moves neither, CSS Flexbox 4.1)
    if (parent && parent.layout && reordered(c).has(e.parent) && typeof e.order === 'number' && !(e.position === 'absolute' || e.absolute)) kept.push(['order', String(e.order)]);
    // where the browser would paint the box's children in another order than the design (restacked), each says its place
    // by z-index, one over its order (above the box's unpositioned children, which take none); the box is isolated, below
    if (e.parent && restacked(c, t, mains).has(e.parent) && !slotted) kept.push(['z-index', String((e.order ?? 0) + 1)]);
    if (restacked(c, t, mains).has(id)) kept.push(['isolation', 'isolate']);
    out[slotted ? `${e.parent}/*` : id] = { decls: new Map(kept.map(([p, v, note, given]) => [p, { v, note, ...(given && { given: true }) }])), unread: (e.kind === 'instance' && !unheld) || slotted ? [] : unheld ? unread.filter((f) => !/^(key|component|with|swappedBy)\b/.test(f)) : unread,
      // (the axes a scale constraint went unwritten on: eval.mjs leftToCode leaves what code draws there to code)
      ...(unshared.length && !slotted && { unshared }) };
    // a part turned a quarter (turnedParts): its wrapper takes its place in the flow on the parent's axes, its own width
    // the wrapper's height and its own height the wrapper's width, and the part is drawn inside at its own size, centred
    // (its turn, css.mjs's rotate, as it is); where this combination does not turn it so, the wrapper is no box
    if (!slotted && turned.has(id)) {
      const own = out[id].decls;
      if (turnBoxed(e, parent)) {
        const ctx = { root: false, holds: false, row: (parent.layout || {}).direction !== 'column', wrap: !!parent.layout.wrap, anchors: false, box: null, pull, words: null };
        // (its own minimum and maximum too, on the swapped axis: its own width's are the wrapper's height's; said there, so
        // the zero minimum a fill takes is not written over them)
        const swapped = Object.fromEntries([['width', e.height], ['height', e.width], ['minWidth', e.minHeight], ['maxWidth', e.maxHeight], ['minHeight', e.minWidth], ['maxHeight', e.maxWidth]].filter(([, v]) => v !== undefined));
        const flow = declarations(swapped, ctx, tokenNames).decls;
        const length = (v) => declarations({ width: v }, { row: false }, tokenNames).decls.find(([p]) => p === 'inline-size');
        out[`${id}::turn`] = { decls: new Map([['display', { v: 'block' }], ['position', { v: 'relative' }], ['container-type', { v: 'size' }], ...flow.map(([p, v, note]) => [p, { v, note }]), ...['order', 'z-index'].filter((p) => own.has(p)).map((p) => [p, own.get(p)])]), unread: [] };
        // (its place among its siblings, order and z-index, is the wrapper's: the wrapper is what the box lays out and, a size
        // container, its own stacking context (css-contain-3 §3), what it stacks)
        for (const p of [...own.keys()]) if (/^(flex|align-self|order|z-index|(min-|max-)?(inline|block)-size|margin.*)$/.test(p)) own.delete(p);
        const w = e.width === 'fill' ? ['100cqh'] : length(e.width).slice(1), h = e.height === 'fill' ? ['100cqw'] : length(e.height).slice(1);
        for (const [p, v, note] of [['position', 'absolute'], ['inset-inline-start', '50%'], ['inset-block-start', '50%'], ['translate', '-50% -50%'], ['inline-size', ...w], ['block-size', ...h]]) own.set(p, { v, ...(note && { note }) });
      } else out[`${id}::turn`] = { decls: new Map([['display', { v: 'contents' }]]), unread: [] };
    }
    if (slotted) { /* the sample's: above */ } else if (empty.length) {
      const only = declarations(Object.fromEntries(empty.map((f) => [f, a[id][f]])), { root: false, holds: false, row: true, anchors: false, box: null, pull: null }, tokenNames);
      out[`${slotted ? `${e.parent}/*` : id}::empty`] = { decls: new Map(only.decls.map(([p, v, note]) => [p, { v, note }])), unread: [] };
    } else if (B[id] && (B[id].whileEmpty || []).length) {
      // a combination where the design fills it: the defaults' empty size does not hold, whatever the page leaves in it
      // (a size this combination sets itself is its own minimum, empty or not: written again there, never unset)
      const SIZE = { minWidth: 'min-inline-size', minHeight: 'min-block-size', maxWidth: 'max-inline-size', maxHeight: 'max-block-size' };
      const own = declarations(Object.fromEntries(B[id].whileEmpty.filter((f) => SIZE[f] && e[f] !== undefined).map((f) => [f, e[f]])), { root: false, holds: false, row: true, anchors: false, box: null, pull: null }, tokenNames).decls;
      out[`${id}::empty`] = { decls: new Map(B[id].whileEmpty.filter((f) => SIZE[f]).map((f) => { const o = own.find(([p]) => p === SIZE[f]); return o ? [SIZE[f], { v: o[1], note: o[2] }] : [SIZE[f], { v: 'unset' }]; })), unread: [] };
    }
  }
  // an override the defaults write on a layer this combination no longer records (derive dropped it, as it draws as its
  // component does): the component's own value here, so the base rule's override does not hold where it is gone
  // whatever a rule gave it goes back to the component's own value (`given`: written only where a rule set it), the rest
  // to unset (rulesOf); nowhere set, nothing is written, so the component's own sheet, its states included, holds
  for (const id of Object.keys(ALL)) {
    if (id in a || out[id]) continue;
    const host = hostOf(ALL, id), m = host && a[host] && mains(a[host].component, a[host].key);
    if (!m || (hostOf(ALL, host) && !hostIn(c, host, mains)) || copyOf(c, host) || Object.keys(ALL).some((k) => k !== host && copyOf(c, k) === host)) continue;
    // (where a variant places another component there, the part is that one's own drawing: nothing of the base's
    // override holds, as a part it records there says nothing either, above)
    if (ALL[host].component !== a[host].component) { out[id] = { decls: new Map(), unread: [] }; continue; }
    const now = overrideOf(a, host, id.slice(host.length + 1), m, mains, ALL, c);
    if (now) out[id] = { decls: new Map([...now.theirs].map(([p, v]) => [p, { v, given: true }])), unread: [] };
    // (an icon's colour too: back to the one the placed component draws it in, not unset, which would inherit)
    const own = now && ALL[id].kind === 'instance' && placedGlyph({ ...ALL, [host]: a[host] || ALL[host] }, host, id.slice(host.length + 1), m, mains);
    if (own) out[id].decls.set('color', { v: tokenNames.token(own), given: true });
  }
  // copies of one part and a slot's children share one rule, so one pull back cannot be said for all but the first
  for (const id of pulling) if (out[id] && pulls(a[id]) && Object.keys(a).some((k) => a[k].parent === id && (copyOf(c, k) || a[id].kind === 'slot'))) out[id].unread.push('layout.gap below 0 between copies of one part or a slot\'s children (each pulls back on its own rule; theirs is shared)');
  for (const [id, decls] of extra) if (out[id]) for (const [p, v, note, knob] of decls) out[id].decls.set(p, { v, note, knob });
  // an icon inside a placed component this library holds draws its glyph in the colour that component gives it, or in
  // the one this component recolours it to there: the recolour is written (a rule of its own where nothing else differs),
  // the component's own colour only where a rule set another (`given`), so it never falls back to inherit
  for (const [id, e] of Object.entries(a)) {
    if (e.kind !== 'instance' || !inside(id) || !hostIn(c, id, mains)) continue;
    const host = hostOf(a, id), m = mains(a[host].component, a[host].key);
    if ((ALL[host] || {}).component !== a[host].component) continue;
    const own = placedGlyph(a, host, id.slice(host.length + 1), m, mains), mine = recolour.get(id);
    if (mine == null && own == null) continue;
    out[id] ||= { decls: new Map(), unread: [] };
    out[id].decls.set('color', mine != null && mine !== own ? { v: tokenNames.token(mine) } : { v: tokenNames.token(own), given: true });
  }
  for (const [id, notes] of Object.entries(ringNotes)) if (out[id]) out[id].unread.push(...notes);
  const entry = entryOf(c);
  if (entry && out[entry.box]) {
    const at = (on) => expand(c, { ...when, [entry.flag]: on ? entry.on : !entry.on });
    const strip = (e) => ({ ...e, parent: undefined, order: undefined, content: undefined });
    const box = (a[entry.box].layout || {}).direction !== 'column';
    const value = at(true)[entry.value], placeholder = at(false)[entry.placeholder];
    const put = (key, e, keep) => {
      if (!e) return;
      const { decls, unread } = declarations(strip(e), { holds: false, row: box }, tokenNames);
      out[key] = { decls: new Map(decls.filter(([p]) => keep(p)).map(([p, v, note]) => [p, { v, note }])), unread };
    };
    put(entry.input, value, () => true);
    // (in a box a variant reorders, the input stands where its value text does, or the placeholder where that is drawn)
    const own = value || placeholder, P = a[entry.box];
    if (out[entry.input] && own && P && P.layout && reordered(c).has(entry.box) && typeof own.order === 'number') out[entry.input].decls.set('order', { v: String(own.order) });
    // (and its place by z-index where the box's children say theirs so)
    if (out[entry.input] && own && restacked(c, t, mains).has(entry.box)) out[entry.input].decls.set('z-index', { v: String((own.order ?? 0) + 1) });
    put(`${entry.input}::placeholder`, placeholder, (p) => p === 'color' || /^(font|line-height|letter-spacing|text-)/.test(p));
  }
  return out;
}

/* What the rules give one part at one combination: per property, the winner by specificity then order. */
function cascade(rules, full, id) {
  const won = new Map();
  for (const r of rules) {
    if (!Object.entries(r.when).every(([k, v]) => full[k] === v)) continue;
    for (const [p, d] of (r.parts[id] || new Map())) {
      const had = won.get(p);
      if (!had || had.weight <= r.weight) won.set(p, { ...d, weight: r.weight });
    }
  }
  return won;
}

/* The contract's rules: the defaults, then each variant layer, each saying only what it changes. */
// the parts a pointer state takes away at this combination (outermost only): drawn with the state at its default, gone
// at this one
// a part hidden at a pointer state, and, where it is drawn in a turn's wrapper (turnedParts), the wrapper too, so no box
// keeps its room and its share of the gap
const withTurns = (c, ids) => { const T = turnedParts(c); return ids.flatMap((id) => (T.has(id) ? [id, `${id}::turn`] : [id])); };
function pointerGone(c, full, dflt, mains, t = HOUSE) {
  const pk = Object.keys(c.props || {}).find((k) => c.props[k].role === 'interaction');
  if (!pk || full[pk] === dflt[pk] || !(c.props[pk].pointer || []).includes(full[pk])) return [];
  const at = { ...full, [pk]: dflt[pk] }, rest = drawn(c, at, mains, t), restA = expand(c, at), nowA = expand(c, full);
  // (a part inside a placed component is drawn at rest only where it overrides the component: one that says only the
  // component's own values, given, is the component's part, and a pointer state that drops it draws it as the component)
  return Object.keys(rest).filter((id) => [...rest[id].decls.values()].some((d) => !d.given) && restA[id] && !nowA[id] && !id.includes('::') && (!restA[id].parent || restA[id].parent === 'root' || nowA[restA[id].parent]));
}

// the parts a pointer state puts in that the rest of the grid draws too (to-markup's partsOf `pointerShown`): the markup
// holds each wherever a pointer state of that combination draws it, so the sheet hides it at this combination where the
// contract draws none (outermost only, its insides with it). A part only pointer states draw is a gap, not this
const shownMemo = new WeakMap();
function shownParts(c, t = HOUSE) {
  const k = shownMemo.get(c); if (k && k.t === t) return k.ids;
  const ids = shownPartsOf(c, t); shownMemo.set(c, { t, ids }); return ids;
}
function shownPartsOf(c, t) {
  const pointer = ([k, v]) => ((c.props || {})[k] || {}).role === 'interaction' && (c.props[k].pointer || []).includes(v);
  const rest = new Set(Object.keys(c.anatomy || {})), byPointer = new Set();
  // (a pointer state's add drawn as a ring is the ringed element's outline there, which the markup holds no element for)
  for (const v of c.variants || []) for (const [id, e] of Object.entries(v.add || {})) {
    if (!Object.entries(v.when || {}).some(pointer)) rest.add(id);
    else if (!ringOf(c, v.when || {}, id, e, { ...c.anatomy, ...v.add }, t)) byPointer.add(id);
  }
  return [...byPointer].filter((id) => rest.has(id) && !id.includes('::'));
}
function pointerShown(c, full, t = HOUSE) {
  const ids = shownParts(c, t);
  if (!ids.length) return [];
  const nowA = expand(c, full), all = { ...Object.assign({}, ...(c.variants || []).map((v) => v.add || {})), ...c.anatomy };
  return ids.filter((id) => { const p = all[id].parent; return !nowA[id] && (!p || p === 'root' || nowA[p]); });
}

export function rulesOf(c, mains, t = HOUSE) {
  const dflt = variantDefaults(c);
  const layers = [{ when: {} }, ...(c.variants || []).filter((v) => !v.combination), ...(c.variants || []).filter((v) => v.combination)]
    .map((v, i) => ({ v, i })).sort((x, y) => Object.keys(x.v.when || {}).length - Object.keys(y.v.when || {}).length || x.i - y.i).map((x) => x.v);
  // (unshared: the parts each axis's scale constraint went unwritten on at some layer, sharesNeverWritten's)
  const rules = [], unread = new Map(), unshared = new Map();
  for (const v of layers) {
    const when = v.combination ? { ...v.when } : Object.fromEntries(Object.entries(v.when || {}).filter(([k, x]) => x !== dflt[k] || v.combination));
    const full = { ...dflt, ...when };
    const now = drawn(c, full, mains, t);
    // (the parts a pointer state takes away here, hidden below)
    const gone = new Set(withTurns(c, pointerGone(c, full, dflt, mains, t)));
    const parts = {};
    for (const [id, { decls, unread: u, unshared: x }] of Object.entries(now)) {
      for (const f of u) { if (!unread.has(f)) unread.set(f, new Set()); unread.get(f).add(id); }
      for (const axis of x || []) { if (!unshared.has(axis)) unshared.set(axis, new Set()); unshared.get(axis).add(id); }
      const given = cascade(rules, full, id);
      const own = new Map();
      for (const [p, d] of decls) if (d.given ? given.has(p) && given.get(p).v !== d.v : !given.has(p) || given.get(p).v !== d.v) own.set(p, d);
      // a property the rules before it set that this combination does not draw goes back to the element's own
      for (const [p] of given) if (!decls.has(p) && given.get(p).v !== 'unset') own.set(p, { v: 'unset' });
      if (own.size) parts[id] = own;
    }
    // a part a pointer state takes away (a field's chevron at focus, where another stands): the markup holds it at every
    // state, so the sheet hides it there (to-markup names it pointerGone); the outermost part gone, its insides with it
    for (const id of gone) if ((cascade(rules, full, id).get('display') || {}).v !== 'none') (parts[id] ||= new Map()).set('display', { v: 'none' });
    // (one a pointer state puts in, held by the markup beyond where the contract draws it, is hidden by selfCheck's rules
    // alone, each naming its whole combination: a hide on a layer would reach combinations that draw it, and showing it
    // again there would take a display this sheet cannot know, a placed component's own)
    if (Object.keys(parts).length || !rules.length) rules.push({ when, weight: Object.keys(when).length, parts });
  }
  // CSS decides by specificity where the contract applies its layers in order, so a combination the two read
  // differently gets a rule of its own, naming every prop the grid is chosen by, which outranks every layer's
  // (as derive's per-combination entries do)
  for (const [key, miss] of groupBy(selfCheck(c, rules, mains, t), (o) => JSON.stringify(o.when))) {
    const when = JSON.parse(key), parts = {};
    for (const o of miss) (parts[o.part] ||= new Map()).set(o.property, { v: o.want ?? 'unset', ...(o.knob && { knob: o.knob }) });
    rules.push({ when, weight: Object.keys(when).length, parts });
  }
  return { rules, unread, unshared };
}
const groupBy = (list, f) => list.reduce((m, x) => m.set(f(x), [...(m.get(f(x)) || []), x]), new Map());

/* Every combination the grid draws: each prop a layer is chosen by, across its values, less those not drawn. */
export function combinations(c) {
  const keys = [...new Set((c.variants || []).flatMap((v) => Object.keys(v.when || {})))];
  const values = (k) => { const p = c.props[k] || {}; return p.type === 'boolean' ? [false, true] : p.values || [p.default]; };
  const invalid = (m) => (c.invalid || []).some((w) => Object.entries(w).every(([k, v]) => m[k] === v));
  return keys.reduce((acc, k) => acc.flatMap((m) => values(k).map((v) => ({ ...m, [k]: v }))), [{}]).filter((m) => !invalid(m));
}

/* The scale constraints the sheet never writes: `<id>.constraints.<axis>` where some layer drew the part with its share
   unwritten (css.mjs shareable fails: declarations() returns the axis as unshared) and no rule the sheet holds, a
   layer's or a combination's own (selfCheck's), declares a share for that part on that axis: a percentage offset or
   size. Read from rulesOf itself, so it cannot drift from what is written. What code draws there is code's (eval.mjs
   leftToCode). */
export function sharesNeverWritten(c, mains = NO_MAINS, t = HOUSE) {
  const out = new Set();
  if (!JSON.stringify(c).includes('"scale"')) return out;
  const { rules, unshared } = rulesOf(c, mains, t);
  const PROPS = { horizontal: ['inset-inline-start', 'inline-size'], vertical: ['inset-block-start', 'block-size'] };
  for (const [axis, ids] of unshared) for (const id of ids) {
    const shared = rules.some((r) => r.parts[id] && PROPS[axis].some((p) => /%\s*$/.test(String((r.parts[id].get(p) || {}).v || ''))));
    if (!shared) out.add(`${id}.constraints.${axis}`);
  }
  return out;
}

/* The combinations whose drawn declarations the cascade does not rebuild: none, or it is a defect. */
export function selfCheck(c, rules, mains, t = HOUSE) {
  rules ||= rulesOf(c, mains, t).rules;
  const dflt = variantDefaults(c);
  const out = [];
  for (const m of combinations(c)) {
    const full = { ...dflt, ...m };
    const gone = new Set(withTurns(c, pointerGone(c, full, dflt, mains, t)));
    for (const [id, { decls }] of Object.entries(drawn(c, full, mains, t))) {
      const got = cascade(rules, full, id);
      for (const [p, d] of decls) if (d.given ? got.has(p) && got.get(p).v !== d.v : !got.has(p) || got.get(p).v !== d.v) out.push({ when: m, part: id, property: p, want: d.v, got: got.get(p)?.v, ...(d.knob && { knob: d.knob }) });
      // (a pointer state's hide is the check below's, never a declaration this one lacks)
      for (const [p, g] of got) if (!decls.has(p) && g.v !== 'unset' && !(p === 'display' && gone.has(id))) out.push({ when: m, part: id, property: p, want: undefined, got: g.v });
    }
    // and a part a pointer state takes away stays hidden there, whatever a rule of the same weight gives it
    for (const id of withTurns(c, [...pointerGone(c, full, dflt, mains, t), ...pointerShown(c, full, t)])) { const g = cascade(rules, full, id).get('display'); if (!g || g.v !== 'none') out.push({ when: m, part: id, property: 'display', want: 'none', got: g?.v }); }
  }
  return out;
}

// a part's state written after its id (`::after`); `::empty`, the part while it holds no element (Figma's empty frame,
// which keeps its size there: a text alone in it does not count, a limit named in the README)
const pseudoSel = (p) => (!p || p === 'turn' ? '' : p === 'empty' ? ':not(:has(*))' : `::${p}`);
/* A part's selector: the root, then each part on its way down, by child combinators (code-standard rule 5). */
function chain(c, n, id, rootCond, given = null, library = {}) {
  const mains = given || (() => null);
  const [own, pseudo = ''] = id.split('::');
  const entry = entryOf(c);
  const segs = [];
  let at = own;
  if (entry && own === entry.input) { segs.push('input'); at = entry.box; }
  if (own.endsWith('/*')) { segs.push('*'); at = own.slice(0, -2); }
  for (; at && at !== 'root'; at = (c.anatomy[at] || findAdded(c, at) || {}).parent) segs.unshift(at);
  // (an instance of a component the library does not hold is drawn as a mark, to-markup's data-icon: no control inside
  // it to reach, whatever its name says. Held or not is the markup's own question, layers.mjs placedOf of the library
  // the markup is given, never `mains`, a lookup of its own that reads names case-blind and holds none two contracts
  // share; with no library given, none is held, as the markup draws every placed instance then)
  const markOnly = (e) => e.kind === 'instance' && !heldBy(library || {}, e);
  // (a part drawn in a wrapper, turnedParts, is reached through it; `::turn` is the wrapper itself)
  const turned = turnedParts(c), wrapper = (s) => `[data-turn="${partSeg(c, s)}"]`;
  const seg = (s, i) => { const e = c.anatomy[s] || findAdded(c, s) || {};
    if (pseudo === 'turn' && i === segs.length - 1) return wrapper(s);
    return (turned.has(s) ? `${wrapper(s)} > ` : '') + (s === '*' ? '*' : n.part(s === 'input' && entry && own === entry.input ? 'input' : partSeg(c, s)) + (markOnly(e) ? '' : through(n, e.kind === 'instance' && e.component, heldIn(c, s, mains)))); };
  // a part inside a placed component is that component's own: named as its own sheet names it, under the instance
  const hostAt = segs.findIndex((s) => (c.anatomy[s] || findAdded(c, s) || {}).kind === 'instance');
  const host = hostAt >= 0 && hostAt < segs.length - 1 && segs[hostAt], m = host && (() => { const he = c.anatomy[host] || findAdded(c, host); return mains(he.component, he.key); })();
  if (m) {
    // (the placed component as the combination that adds this part draws it: a host each variant adds at its own props
    // names the part by the variant that draws it there, never by whichever variant allOf meets first)
    const adds = (c.variants || []).find((v) => !v.combination && v.add && v.add[own]);
    const all = adds ? { ...allOf(c), ...expand(c, { ...variantDefaults(c), ...adds.when }) } : allOf(c), inner = [];
    // each placed component names its own parts, down to the next one placed in it, which names the rest
    for (let h = host, hm = m, rest = segs.slice(hostAt + 1); rest.length && hm;) {
      const n2 = namer(hm.folder || folderOf(hm.component), n.naming);
      const { M, back } = placedAs(all, h, hm, mains), match = placedOf(all, h, M), own = (s) => back[match[s.slice(h.length + 1)]] || s.slice(h.length + 1);
      const next = rest.slice(0, -1).findIndex((s) => all[s] && all[s].kind === 'instance' && mains(all[s].component, all[s].key));
      const take = next >= 0 ? rest.slice(0, next + 1) : rest;
      inner.push(...take.map((s, i) => n2.part(partSeg(hm, own(s))) + (i === next ? through(n, all[s].component, heldIn(hm, own(s), mains)) : '')));
      rest = rest.slice(take.length);
      if (rest.length) { h = take[take.length - 1]; hm = mains(all[h].component, all[h].key); }
    }
    return [n.root + rootCond + through(n, c.component, placedIn(c)), ...segs.slice(0, hostAt + 1).map(seg), ...inner].join(' > ') + pseudoSel(pseudo);
  }
  return [n.root + rootCond + through(n, c.component, placedIn(c)), ...segs.map(seg)].join(' > ') + pseudoSel(pseudo);
}
// the selector the sheet styles a part by, at no condition: what the markup's parity mapping names it by
/* A part inside a placed component this library holds, by that component's own names under the instance; else null. */
export const nestedSelector = (c, n, id, mains, library = {}) => (hostIn(c, id, mains) ? chain(c, n, id, '', mains, library) : null);
export const selectorOf = (c, n, id, mains = null, library = {}) => (id === 'root' ? n.root + through(n, c.component, placedIn(c)) : chain(c, n, id, '', mains, library));
export const heldOf = (library) => (name, key = null) => heldBy(library, { component: name, key });
const findAdded = (c, id) => (c.variants || []).map((v) => (v.add || {})[id]).find(Boolean);
// a part's name in a selector: its id's last part, the whole id where two parts would share it
export function partSeg(c, id) {
  const all = [...new Set([...Object.keys(c.anatomy), ...(c.variants || []).flatMap((v) => Object.keys(v.add || {}))])].filter((k) => k !== 'root');
  const last = (k) => words(k.split('/').pop());
  return all.filter((k) => last(k) === last(id)).length > 1 ? words(id.replace(/\//g, '-')) : last(id);
}

/* The stylesheet. */
export function toCss(c, folder, { naming, layer = 'components', settings = HOUSE, mains: given, library } = {}) {
  const n = namer(folder, naming);
  // every question of a placed instance (held or a mark, what it draws inside, its own parts' names) is asked of the one
  // library the markup is given, as the markup asks it (layers.mjs placedOf); `mains` only where no library is given
  const mains = library ? heldOf(library) : given;
  library ||= {};
  const { rules, unread } = rulesOf(c, mains, settings);
  const lines = [`/* ${BANNER} */`];
  const keys = [...new Set(rules.flatMap((r) => Object.keys(r.when)))];
  const hooks = keys.map((k) => {
    const p = c.props[k] || {};
    if (p.role === 'interaction') return `${k}: ${Object.entries(pseudoClasses(settings)).filter(([x]) => (p.pointer || []).includes(x)).map(([, ps]) => ps).join(', ')}`;
    if (entryOf(c) && k === entryOf(c).flag) return `${k}: the input's own :placeholder-shown`;
    if (k === disabledKey(c, settings)) return `${k}: the control's disabled`;
    return `${k}: ${n.attr(k)}${p.type === 'boolean' ? '' : `="${(p.values || []).join('|')}" (default ${p.default}, or none)`}`;
  });
  if (hooks.length) lines.push(`/* Chosen by: ${said(hooks.join('; '))}. */`);
  const parts = [...new Set(rules.flatMap((r) => Object.keys(r.parts)))].filter((id) => id.split('::')[0] !== 'root');
  const nested = (id) => chain(c, n, id, '', mains, library).split(' > ').pop();
  const named = (id) => (hostIn(c, id, mains) ? `${nested(id)} (the placed component's own part)` : id.endsWith('/*') ? `${n.part(partSeg(c, id.slice(0, -2)))} > * (any child)` : entryOf(c) && id.startsWith(entryOf(c).input) ? `${n.part('input')} (an <input>; ${entryOf(c).placeholder} is its ::placeholder)` : n.part(partSeg(c, id)));
  if (parts.length) lines.push(`/* Parts: ${said([...new Set(parts.map((id) => id.split('::')[0]))].map((id) => `${id} ${named(id)}`).join(', '))}. */`);
  if (unread.size) lines.push(`/* Not written, as CSS cannot say it: ${said([...unread].map(([f, ids]) => `${f} on ${[...ids].join(', ')}`).join('; '))}. */`);
  lines.push('', `@layer ${layer} {`);
  if (through(n, c.component, placedIn(c))) lines.push(`  ${n.root}:not([hidden]) { display: contents; }`);
  // a knob is read before the value it stands in for: the ring a part gives way to its holder's, and the disabled dim a
  // holder sets to 1 on what it holds so it dims once (code-standard rule 62), named as the scaffold names them
  const knob = (k, v) => `var(--${(naming && naming.prefix) || ''}${k}, ${v})`;
  const dis = disabledKey(c, settings);
  for (const r of rules) {
    // each condition weighs nothing (:where), so rules meet by source order alone, the order selfCheck replays: a
    // condition reaching a control two boxes down would otherwise outweigh an attribute and reorder the cascade
    const rootCond = Object.entries(r.when).map(([k, v]) => `:where(${condition(c, n, k, v, settings, mains, library)})`).join('');
    for (const [id, decls] of Object.entries(r.parts)) {
      lines.push(`  ${id === 'root' ? n.root + rootCond + through(n, c.component, placedIn(c)) : chain(c, n, id, rootCond, mains, library)} {`);
      let dimmed = false, undimmed = false;
      for (const [p, { v, note, knob: k }] of decls) {
        const dims = id === 'root' && p === 'opacity' && dis && r.when[dis] === true && v !== 'unset';
        dimmed ||= dims;
        // only where disabled: elsewhere the knob a holder set is the holder's dim, and its parts keep it
        undimmed ||= id === 'root' && p === 'opacity' && dis && r.when[dis] === true && v === 'unset';
        lines.push(`    ${p}: ${k && v !== 'unset' ? knob(k, v) : dims ? knob('dim', v) : v};${note ? ` /* ${said(note)} */` : ''}`);
      }
      lines.push('  }');
      // and sets it on what it holds, so a dimmed component inside does not dim again (to a quarter)
      // and takes it back where a later rule undoes the dim (initial: the knob unset, so the token stands)
      if (dimmed || undimmed) lines.push(`  ${n.root + rootCond + through(n, c.component, placedIn(c))} > * { --${(naming && naming.prefix) || ''}dim: ${dimmed ? '1' : 'initial'}; }`);
    }
  }
  lines.push('}', '');
  return lines.join('\n');
}

/* ── the command ─────────────────────────────────────────────────────── */

const isMain = (process.argv[1] && (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url));
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (k) => { const i = args.indexOf(`--${k}`); return i < 0 ? null : args.splice(i, 2)[1]; };
  const label = flag('project'), repoFlag = flag('repo'), outFlag = flag('out'), contractFlag = flag('contract'), platform = flag('platform');
  const check = args.includes('--check');
  // a contract not stored yet is its own one component, under the folder name the store would give it
  const draft = contractFlag && JSON.parse(fs.readFileSync(path.resolve(contractFlag), 'utf8'));
  const only = draft ? [require('../snapshot/store.cjs').folderOf(draft.component, platform)] : args.filter((a) => !a.startsWith('--'));
  if (!label && !repoFlag) { console.error('to-code: --project <label> or --repo <dir>'); process.exit(2); }
  // a repo named is read where it is (a second checkout, a worktree); a label, where the registry routes it
  let where;
  if (repoFlag) {
    const repo = path.resolve(repoFlag);
    where = { repo, paths: require('../snapshot/store.cjs').paths(repo, require('../shared/repo-config.cjs').repoConfig(repo, 'to-code').paths || {}) };
    // its project's home, for its official contracts
    Object.assign(where, homeIn(repo));
  } else {
    where = require('../snapshot/projects.cjs').layout(null, label);
    if (where.error) { console.error(`to-code: ${where.error}`); process.exit(2); }
    if (!where.repo) { console.error(`to-code: ${label} has no code repo to write a stylesheet for`); process.exit(2); }
  }
  const config = require('../shared/repo-config.cjs').repoConfig(where.repo, 'to-code');
  const styles = config.styles || {};
  const out = outFlag ? path.resolve(outFlag) : where.paths.componentStyles;
  if (!out) { console.error(`to-code: no paths.componentStyles in ${path.join(where.repo, 'snapshot.config.json')}, and no --out`); process.exit(2); }
  const dir = where.paths.components;
  const folders = draft ? only : fs.readdirSync(dir).filter((f) => fs.existsSync(path.join(dir, f, 'contract.json')) && (!only.length || only.includes(f))).sort();
  const files = new Map();
  let broken = 0;
  // the official contract: Figma's reading, or the project's own where it takes the contract as its source
  const { of } = officials(where);
  // each sheet under its library's settings (its state names, its disabled axis), the house's where none
  const settingsOf = require('../snapshot/projects.cjs').librarySettingsFor(dir);
  // the store by name, in folder order, as to-markup's own run gives it to the markup: every question of a placed
  // instance the sheet asks is the markup's own, of the same library (toCss)
  const library = {};
  for (const d of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    try { const x = of(JSON.parse(fs.readFileSync(path.join(dir, d, 'contract.json'), 'utf8'))); x.folder ||= d; library[x.component] = x; } catch { /* not a component */ }
  }
  const mains = heldOf(library);
  for (const f of folders) {
    const c = draft || of(JSON.parse(fs.readFileSync(path.join(dir, f, 'contract.json'), 'utf8')));
    const { rules } = rulesOf(c, mains, settingsOf(f));
    const off = selfCheck(c, rules, mains, settingsOf(f));
    if (off.length) { broken++; console.error(`to-code: ${f}: ${off.length} declaration(s) the stylesheet does not rebuild, first ${JSON.stringify(off[0])}`); }
    const css = toCss(c, f, { naming: styles.naming, layer: styles.componentsLayer || 'components', settings: settingsOf(f), library });
    files.set(`${f}.css`, draft ? css.replace(BANNER, DRAFT) : css);
  }
  // a write replaces only what it wrote (code-standard rule 58): its own files, known by the banner
  const ours = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((x) => x.endsWith('.css') && fs.readFileSync(path.join(d, x), 'utf8').includes(BANNER)) : []);
  if (check) {
    const stale = [...files].filter(([f, body]) => !fs.existsSync(path.join(out, f)) || fs.readFileSync(path.join(out, f), 'utf8') !== body).map(([f]) => f);
    const gone = only.length ? [] : ours(out).filter((x) => !files.has(x));
    if (stale.length || gone.length) { console.error(`to-code: ${[...stale.map((f) => `${f} differs from what the contract generates`), ...gone.map((f) => `${f} has no contract`)].join('; ')} (code-standard rule 23)`); process.exit(1); }
    console.log(`to-code: ${files.size} stylesheet(s) match their contracts`);
  } else {
    fs.mkdirSync(out, { recursive: true });
    // a draft never replaces a sheet it did not write: one generated, or written by hand
    const taken = draft && [...files.keys()].find((f) => fs.existsSync(path.join(out, f)) && !fs.readFileSync(path.join(out, f), 'utf8').includes(DRAFT));
    if (taken) { console.error(`to-code: ${taken} is there already, and not a draft's: rename the draft, or change the component where it is made`); process.exit(1); }
    if (!only.length) for (const x of ours(out)) if (!files.has(x)) fs.rmSync(path.join(out, x));
    for (const [f, body] of files) fs.writeFileSync(path.join(out, f), body);
    const home = path.relative(os.homedir(), out);
    console.log(`to-code: ${files.size} stylesheet(s) in ${home.startsWith('..') ? out : `~/${home}`}`);
  }
  if (broken) process.exit(1);
}
