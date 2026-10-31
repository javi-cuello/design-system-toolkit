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
 * A prop value is an attribute on the root (`data-size="sm"` with class naming, `size="sm"` with element naming,
 * the default also the bare element); a State value is its pseudo-class and Disabled the control's own
 * (code-standard rule 9). Each variant layer of the contract is one rule, what it changes from what the rules
 * before it already give; `selfCheck` replays the cascade at every combination the grid draws and names any
 * whose declarations differ, so the stylesheet is proven to rebuild every variant. What CSS cannot say is listed
 * at the top of the file, never dropped.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { officials, homeIn } from './official.mjs';
import { expand, variantDefaults, kebab } from './layers.mjs';
import { declarations, holds } from './css.mjs';
import { cssName } from '../tokens/names.mjs';
import { textStyleFields } from '../tokens/build-tokens.mjs';

const require = createRequire(import.meta.url);
const BANNER = "Generated from the component's contract by the toolkit's to-code. Do not edit: change Figma, snapshot, and this regenerates.";
// a draft's sheet is not one of the generated set: no check holds it and no write removes it, and once its component
// is in the snapshot the generated sheet is written over it
const DRAFT = "Written by the toolkit's to-code from a draft contract. Once the component is in the snapshot, to-code generates this file over it.";
// an HTML or ARIA attribute a prop must not be spelt as on a custom element (code-standard rules 9 and 10)
// (HTML's global attributes among them: a `style` prop on the host would be its inline style)
const TAKEN = new Set(['role', 'align', 'valign', 'hidden', 'disabled', 'title', 'lang', 'width', 'height', 'border', 'bgcolor', 'size',
  'style', 'class', 'id', 'slot', 'dir', 'name', 'is', 'part', 'tabindex', 'inert', 'popover', 'draggable', 'translate', 'autofocus', 'nonce', 'accesskey', 'spellcheck', 'contenteditable', 'enterkeyhint', 'inputmode', 'autocapitalize', 'exportparts', 'itemprop']);
// a prop's key as an attribute name: showIcon → show-icon
const words = (key) => kebab(String(key).replace(/([a-z0-9])([A-Z])/g, '$1-$2'));
const PSEUDO = { focus: ':focus-visible', hover: ':hover', press: ':active' };
// what a component placing another says of it: its place and size, nothing of its look
const PLACED = /^(flex|align-self|order|(min-|max-)?(inline|block)-size|position|inset.*|translate|rotate|opacity|z-index|margin.*)$/;

/* How the stylesheet names things: the component, its parts and its props, from the project's naming. */
// a custom element's prefix: lower case, ending in the hyphen its name needs (ds-, my-ds-)
export const PREFIX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*-$/;
// words from the design said in a comment: one line, and never the comment's end, so nothing after it is code
export const said = (x) => String(x).replace(/\*\//g, '* /').replace(/[\r\n\u2028\u2029]+/g, ' ');
export function namer(folder, naming = { kind: 'class', prefix: '', part: '__' }) {
  const block = `${naming.prefix || ''}${folder}`;
  const element = naming.kind === 'element';
  // a custom element's name has a hyphen, and the prefix is what gives it one: with none, `button` would be every button
  if (element && !PREFIX.test(naming.prefix || '')) throw new Error('element naming needs a prefix that ends in a hyphen, such as "ds-": a custom element\'s name has one');
  return {
    element,
    root: element ? block : `.${block}`,
    part: (seg) => (element ? `[data-part="${seg}"]` : `.${block}${naming.part || '__'}${seg}`),
    attr: (key) => (element && !TAKEN.has(words(key)) ? words(key) : `data-${words(key)}`),
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
export function copyOf(c, id) {
  const a = c.anatomy, m = /^(.*)_\d+$/.exec(id);
  const first = m && a[m[1]], e = a[id];
  if (!first || !e || first.kind !== 'instance' || e.kind !== 'instance' || first.parent !== e.parent || first.component !== e.component || SAME(first) !== SAME(e)) return null;
  const touched = (k) => (c.variants || []).some((v) => (v.remove || []).includes(k) || k in (v.add || {}) || Object.keys(v.set || {}).some((x) => x.startsWith(`${k}.`)));
  return touched(id) || touched(m[1]) ? null : m[1];
}

/* The boxes whose children a variant puts in another order. */
const REORDERED = new WeakMap();
function reordered(c) {
  if (!REORDERED.has(c)) {
    const ids = (c.variants || []).flatMap((v) => Object.keys(v.set || {}).filter((k) => k.endsWith('.order')).map((k) => k.slice(0, -'.order'.length)));
    REORDERED.set(c, new Set(ids.map((id) => (c.anatomy[id] || findAdded(c, id) || {}).parent).filter(Boolean)));
  }
  return REORDERED.get(c);
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
// what a placed instance holds, as its holder stores it: the components its own sheet's controlOf is given
const heldIn = (c, id) => Object.entries(c.anatomy || {}).filter(([k, e]) => k.startsWith(`${id}/`) && e.kind === 'instance').map(([, e]) => e.component);
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

/* The selector a prop's value is chosen by, on the root. */
export function condition(c, n, key, value) {
  const p = c.props[key] || {};
  const entry = entryOf(c);
  // the input's own state, reached down the anatomy by child combinators (code-standard rules 5 and 62)
  const control = entry && `${chain(c, n, entry.input, '').slice(n.root.length + 3)}`;
  // where a state reaches: the box itself, a native control directly in it, a text entry's input, and a placed
  // control the contract names (its Selected layer sets that instance's props: a card's checkbox two boxes down),
  // the control or one inside it; never any control at all, so a card's footer button does not dim the card
  const placed = controlsOf(c).map((id) => chain(c, n, id, '').slice(n.root.length + 3));
  // a box that names its control is that control's alone: a button beside it in the box is not it
  const reach = (x) => [...(control || placed.length ? [] : [`:has(> ${x})`]), ...(control ? [`:has(> ${control}${x})`] : []), ...placed.flatMap((k) => [`:has(> ${k}${x})`, `:has(> ${k} ${x})`])];
  const dis = Object.keys(c.props).find((k) => /^disabled$/i.test(k) && c.props[k].type === 'boolean');
  // disabled: the control's own, or the attribute where the box has no control to disable (code-standard rule 9)
  const disabled = `:is(${[...(dis ? [`[${n.attr(dis)}]:not([${n.attr(dis)}="false"])`] : []), ':disabled', ...reach(':disabled')].join(', ')})`;
  if (p.role === 'interaction') {
    // a box that names no control is focused when what it holds is (a card's own button or link stands for it)
    const focused = control || placed.length ? reach(':focus-visible') : [':has(:focus-visible)'];
    const PS = { focus: `:is(:focus-visible, ${focused.join(', ')})`, hover: ':hover', press: control ? `:is(:active, :has(> ${control}:active))` : ':active' };
    // a state the contract draws no disabled variant of does not reach a disabled control: there, a disabled box
    // hovered or focused is still drawn at rest
    const notDrawn = (v) => dis && (c.invalid || []).some((w) => w[dis] === true && [].concat(w[key]).includes(v) && Object.keys(w).length === 2);
    const live = (v) => PS[v] + (notDrawn(v) ? `:not(${disabled})` : '');
    if (PS[value]) return live(value);
    if (value === p.default) return Object.keys(PS).map((v) => `:not(${live(v)})`).join('');
  }
  if (entry && key === entry.flag) return (value === entry.on) ? `:has(> ${control}:not(:placeholder-shown))` : `:has(> ${control}:placeholder-shown)`;
  if (p.type === 'boolean' && /^disabled$/i.test(key)) return value ? disabled : `:not(${disabled})`;
  const a = n.attr(key);
  // a box holding a native checkbox or radio, directly or as the control it places, is checked as the control is
  // (code-standard rule 9: the control's own)
  if (p.type === 'boolean' && /^(selected|checked)$/i.test(key)) {
    const placed = controlsOf(c).map((id) => chain(c, n, id, '').slice(n.root.length + 3));
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
export function ringOf(c, when, id, e, a) {
  const focus = Object.entries(c.props).some(([k, p]) => p.role === 'interaction' && when[k] === 'focus');
  const b = e.border, x = e.absolute;
  if (!focus || c.anatomy[id] || !e.parent || e.position !== 'absolute' || !x || e.background || !b || typeof b.color !== 'string') return null;
  if (!e.constraints || e.constraints.horizontal !== 'stretch' || e.constraints.vertical !== 'stretch' || Object.values(a).some((k) => k.parent === id)) return null;
  const out = [x.x, x.y, x.end, x.bottom];
  if (!out.every((v) => typeof v === 'number' && v === out[0])) return null;
  const width = Array.isArray(b.width) ? b.width[0] : b.width ?? 1;
  const w = typeof width === 'string' ? tokenNames.token(width) : `${width}px`;
  const clear = -out[0] + (b.align === 'outside' ? (typeof width === 'number' ? width : 0) : 0);
  const offset = typeof width === 'number' && b.align !== 'center' ? `${clear - (b.align === 'outside' ? 0 : width)}px` : `calc(${clear}px - ${b.align === 'center' ? `${w} / 2` : w})`;
  // the outline reads the ring knob first, which a component sets to 0 on a part it rings itself (the scaffold's focus.ring)
  return { parent: e.parent, decls: [['outline', `${w} solid ${tokenNames.token(b.color)}`, undefined, 'ring'], ['outline-offset', offset, clear ? 'no token in the design' : undefined]] };
}

/* Each part's declarations at one combination, as a map property → value (with its note). */
export function drawn(c, when) {
  const a = expand(c, when);
  const out = {}, extra = [], ringNotes = {};
  // a placed component's insides are its own stylesheet's (code-standard rule 5): this one stops at the instance
  const inside = (id) => { for (let p = a[id].parent; p; p = a[p] && a[p].parent) if (a[p] && (a[p].kind === 'instance' || (a[a[p].parent] || {}).kind === 'slot')) return true; return false; };
  for (let [id, e] of Object.entries(a)) {
    if (inside(id)) {
      // save the colour the instance's glyph is drawn in, which the placing component sets on it: an icon draws
      // in its element's color (currentColor), so the colour is the instance's
      if (a[e.parent] && a[e.parent].kind === 'instance' && e.kind === 'graphic' && typeof e.background === 'string') extra.push([e.parent, [['color', tokenNames.token(e.background)]]]);
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
    const ring = ringOf(c, when, id, e, a);
    if (ring) {
      extra.push([ring.parent, ring.decls]);
      if (e.radius !== undefined && e.radius !== a[ring.parent].radius) (ringNotes[ring.parent] ||= []).push(`the focus ring's corners (${e.radius}): an outline follows its box's own`);
      continue;
    }
    const parent = e.parent ? a[e.parent] : null;
    // an outer box laid out at a drawn width: the width is the frame's, and the box takes its container's, so a
    // parent that stretches it is obeyed; a component that keeps its own width says so in its own sheet
    const sample = id === 'root' && e.layout && e.layout.direction && typeof e.width === 'number';
    if (sample) e = { ...e, width: 'fill' };
    const anchors = Object.values(a).some((x) => x.parent === id && (x.position === 'absolute' || x.absolute) && !ringOf(c, when, Object.keys(a).find((k) => a[k] === x), x, a));
    const { decls, unread } = declarations(e, { root: id === 'root', holds: holds(e.kind), row: !parent || (parent.layout || {}).direction !== 'column', anchors }, tokenNames);
    // a placed component is placed here and looks as its own sheet says (code-standard rule 5): where it sits and
    // how big, never its fill, stroke, corners or type, which a prop changes in code
    const kept = e.kind === 'instance' || slotted ? decls.filter(([p]) => PLACED.test(p)) : decls;
    if (sample) kept.push(['inline-size', '100%']);
    // where a variant reorders a box's children (a Reversed), each child says its place, so the order follows the props
    if (parent && reordered(c).has(e.parent) && typeof e.order === 'number') kept.push(['order', String(e.order)]);
    out[slotted ? `${e.parent}/*` : id] = { decls: new Map(kept.map(([p, v, note]) => [p, { v, note }])), unread: e.kind === 'instance' || slotted ? [] : unread };
  }
  for (const [id, decls] of extra) if (out[id]) for (const [p, v, note, knob] of decls) out[id].decls.set(p, { v, note, knob });
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
export function rulesOf(c) {
  const dflt = variantDefaults(c);
  const layers = [{ when: {} }, ...(c.variants || []).filter((v) => !v.combination), ...(c.variants || []).filter((v) => v.combination)]
    .map((v, i) => ({ v, i })).sort((x, y) => Object.keys(x.v.when || {}).length - Object.keys(y.v.when || {}).length || x.i - y.i).map((x) => x.v);
  const rules = [], unread = new Map();
  for (const v of layers) {
    const when = v.combination ? { ...v.when } : Object.fromEntries(Object.entries(v.when || {}).filter(([k, x]) => x !== dflt[k] || v.combination));
    const full = { ...dflt, ...when };
    const now = drawn(c, full);
    const parts = {};
    for (const [id, { decls, unread: u }] of Object.entries(now)) {
      for (const f of u) { if (!unread.has(f)) unread.set(f, new Set()); unread.get(f).add(id); }
      const given = cascade(rules, full, id);
      const own = new Map();
      for (const [p, d] of decls) if (!given.has(p) || given.get(p).v !== d.v) own.set(p, d);
      // a property the rules before it set that this combination does not draw goes back to the element's own
      for (const [p] of given) if (!decls.has(p) && given.get(p).v !== 'unset') own.set(p, { v: 'unset' });
      if (own.size) parts[id] = own;
    }
    if (Object.keys(parts).length || !rules.length) rules.push({ when, weight: Object.keys(when).length, parts });
  }
  // CSS decides by specificity where the contract applies its layers in order, so a combination the two read
  // differently gets a rule of its own, naming every prop the grid is chosen by, which outranks every layer's
  // (as derive's per-combination entries do)
  for (const [key, miss] of groupBy(selfCheck(c, rules), (o) => JSON.stringify(o.when))) {
    const when = JSON.parse(key), parts = {};
    for (const o of miss) (parts[o.part] ||= new Map()).set(o.property, { v: o.want ?? 'unset' });
    rules.push({ when, weight: Object.keys(when).length, parts });
  }
  return { rules, unread };
}
const groupBy = (list, f) => list.reduce((m, x) => m.set(f(x), [...(m.get(f(x)) || []), x]), new Map());

/* Every combination the grid draws: each prop a layer is chosen by, across its values, less those not drawn. */
export function combinations(c) {
  const keys = [...new Set((c.variants || []).flatMap((v) => Object.keys(v.when || {})))];
  const values = (k) => { const p = c.props[k] || {}; return p.type === 'boolean' ? [false, true] : p.values || [p.default]; };
  const invalid = (m) => (c.invalid || []).some((w) => Object.entries(w).every(([k, v]) => m[k] === v));
  return keys.reduce((acc, k) => acc.flatMap((m) => values(k).map((v) => ({ ...m, [k]: v }))), [{}]).filter((m) => !invalid(m));
}

/* The combinations whose drawn declarations the cascade does not rebuild: none, or it is a defect. */
export function selfCheck(c, rules = rulesOf(c).rules) {
  const dflt = variantDefaults(c);
  const out = [];
  for (const m of combinations(c)) {
    const full = { ...dflt, ...m };
    for (const [id, { decls }] of Object.entries(drawn(c, full))) {
      const got = cascade(rules, full, id);
      for (const [p, d] of decls) if (!got.has(p) || got.get(p).v !== d.v) out.push({ when: m, part: id, property: p, want: d.v, got: got.get(p)?.v });
      for (const [p, g] of got) if (!decls.has(p) && g.v !== 'unset') out.push({ when: m, part: id, property: p, want: undefined, got: g.v });
    }
  }
  return out;
}

/* A part's selector: the root, then each part on its way down, by child combinators (code-standard rule 5). */
function chain(c, n, id, rootCond) {
  const [own, pseudo = ''] = id.split('::');
  const entry = entryOf(c);
  const segs = [];
  let at = own;
  if (entry && own === entry.input) { segs.push('input'); at = entry.box; }
  if (own.endsWith('/*')) { segs.push('*'); at = own.slice(0, -2); }
  for (; at && at !== 'root'; at = (c.anatomy[at] || findAdded(c, at) || {}).parent) segs.unshift(at);
  const seg = (s) => (s === '*' ? '*' : n.part(s === 'input' && entry && own === entry.input ? 'input' : partSeg(c, s)) + through(n, ((c.anatomy[s] || findAdded(c, s) || {}).kind === 'instance' && (c.anatomy[s] || findAdded(c, s)).component), heldIn(c, s)));
  return [n.root + rootCond + through(n, c.component, placedIn(c)), ...segs.map(seg)].join(' > ') + (pseudo ? `::${pseudo}` : '');
}
// the selector the sheet styles a part by, at no condition: what the markup's parity mapping names it by
export const selectorOf = (c, n, id) => (id === 'root' ? n.root + through(n, c.component, placedIn(c)) : chain(c, n, id, ''));
const findAdded = (c, id) => (c.variants || []).map((v) => (v.add || {})[id]).find(Boolean);
// a part's name in a selector: its id's last part, the whole id where two parts would share it
export function partSeg(c, id) {
  const all = [...new Set([...Object.keys(c.anatomy), ...(c.variants || []).flatMap((v) => Object.keys(v.add || {}))])].filter((k) => k !== 'root');
  const last = (k) => words(k.split('/').pop());
  return all.filter((k) => last(k) === last(id)).length > 1 ? words(id.replace(/\//g, '-')) : last(id);
}

/* The stylesheet. */
export function toCss(c, folder, { naming, layer = 'components' } = {}) {
  const n = namer(folder, naming);
  const { rules, unread } = rulesOf(c);
  const lines = [`/* ${BANNER} */`];
  const keys = [...new Set(rules.flatMap((r) => Object.keys(r.when)))];
  const hooks = keys.map((k) => {
    const p = c.props[k] || {};
    if (p.role === 'interaction') return `${k}: ${Object.keys(PSEUDO).filter((x) => (p.pointer || []).includes(x)).map((x) => PSEUDO[x]).join(', ')}`;
    if (entryOf(c) && k === entryOf(c).flag) return `${k}: the input's own :placeholder-shown`;
    if (p.type === 'boolean' && /^disabled$/i.test(k)) return `${k}: the control's disabled`;
    return `${k}: ${n.attr(k)}${p.type === 'boolean' ? '' : `="${(p.values || []).join('|')}" (default ${p.default}, or none)`}`;
  });
  if (hooks.length) lines.push(`/* Chosen by: ${said(hooks.join('; '))}. */`);
  const parts = [...new Set(rules.flatMap((r) => Object.keys(r.parts)))].filter((id) => id !== 'root');
  const named = (id) => (id.endsWith('/*') ? `${n.part(partSeg(c, id.slice(0, -2)))} > * (any child)` : entryOf(c) && id.startsWith(entryOf(c).input) ? `${n.part('input')} (an <input>; ${entryOf(c).placeholder} is its ::placeholder)` : n.part(partSeg(c, id)));
  if (parts.length) lines.push(`/* Parts: ${said([...new Set(parts.map((id) => id.split('::')[0]))].map((id) => `${id} ${named(id)}`).join(', '))}. */`);
  if (unread.size) lines.push(`/* Not written, as CSS cannot say it: ${said([...unread].map(([f, ids]) => `${f} on ${[...ids].join(', ')}`).join('; '))}. */`);
  lines.push('', `@layer ${layer} {`);
  if (through(n, c.component, placedIn(c))) lines.push(`  ${n.root}:not([hidden]) { display: contents; }`);
  // a knob is read before the value it stands in for: the ring a part gives way to its holder's, and the disabled dim a
  // holder sets to 1 on what it holds so it dims once (code-standard rule 62), named as the scaffold names them
  const knob = (k, v) => `var(--${(naming && naming.prefix) || ''}${k}, ${v})`;
  const dis = Object.keys(c.props).find((k) => /^disabled$/i.test(k) && c.props[k].type === 'boolean');
  for (const r of rules) {
    // each condition weighs nothing (:where), so rules meet by source order alone, the order selfCheck replays: a
    // condition reaching a control two boxes down would otherwise outweigh an attribute and reorder the cascade
    const rootCond = Object.entries(r.when).map(([k, v]) => `:where(${condition(c, n, k, v)})`).join('');
    for (const [id, decls] of Object.entries(r.parts)) {
      lines.push(`  ${id === 'root' ? n.root + rootCond + through(n, c.component, placedIn(c)) : chain(c, n, id, rootCond)} {`);
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

const isMain = (process.argv[1] && fs.realpathSync(process.argv[1]) === new URL(import.meta.url).pathname);
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
    where = { repo, paths: require('../snapshot/store.cjs').paths(repo, JSON.parse(fs.readFileSync(path.join(repo, 'snapshot.config.json'), 'utf8')).paths || {}) };
    // its project's home, for its official contracts
    Object.assign(where, homeIn(repo));
  } else {
    where = require('../snapshot/projects.cjs').layout(null, label);
    if (where.error) { console.error(`to-code: ${where.error}`); process.exit(2); }
    if (!where.repo) { console.error(`to-code: ${label} has no code repo to write a stylesheet for`); process.exit(2); }
  }
  const config = JSON.parse(fs.readFileSync(path.join(where.repo, 'snapshot.config.json'), 'utf8'));
  const styles = config.styles || {};
  const out = outFlag ? path.resolve(outFlag) : where.paths.componentStyles;
  if (!out) { console.error(`to-code: no paths.componentStyles in ${path.join(where.repo, 'snapshot.config.json')}, and no --out`); process.exit(2); }
  const dir = where.paths.components;
  const folders = draft ? only : fs.readdirSync(dir).filter((f) => fs.existsSync(path.join(dir, f, 'contract.json')) && (!only.length || only.includes(f))).sort();
  const files = new Map();
  let broken = 0;
  // the official contract: Figma's reading, or the project's own where it takes the contract as its source
  const { of } = officials(where);
  for (const f of folders) {
    const c = draft || of(JSON.parse(fs.readFileSync(path.join(dir, f, 'contract.json'), 'utf8')));
    const { rules } = rulesOf(c);
    const off = selfCheck(c, rules);
    if (off.length) { broken++; console.error(`to-code: ${f}: ${off.length} declaration(s) the stylesheet does not rebuild, first ${JSON.stringify(off[0])}`); }
    const css = toCss(c, f, { naming: styles.naming, layer: styles.componentsLayer || 'components' });
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
