#!/usr/bin/env node
/*
 * tools/parity/external.mjs — the code audit: a component library someone
 * else built, rendered in its own Storybook, measured against the design's
 * component contracts (tools/component-contract).
 *
 *   node tools/parity/external.mjs --project <label> [component …] [--draft] [--rebuild]
 *
 * `--draft` adds every other component the library and its Storybook share,
 * with a mapping drafted by rule: a start for a person's map, never a finding.
 *
 * Parity proper holds code we generate from Figma to the snapshot, pixel by
 * pixel, through selectors we put on every layer. Code built elsewhere has
 * none of those and a structure of its own, so what can be compared is
 * intent: for each combination of props the contract allows, the token each
 * mapped element should show against what the rendered story computes.
 *
 * Reads the library from the project's context document (`code.repo`, and
 * `code.parity`: how its Storybook is built, its one tier, its token files)
 * and how the contract lands on that code from the project's parity
 * mappings, in the format every parity mapping is written in (keyed by
 * Figma's names: the story, the args an option sets, a value spelled
 * differently; a layer only where a ruling overrides tools/parity/pair.mjs,
 * which pairs each contract element with the rendered element by rule),
 * read into the contract's ids by contractEntry. Writes `parity/report.json` there, which the docs site's
 * Parity › Properties and Parity › Visual pages show. Nothing fails: a
 * difference is a finding for a person to rule on.
 *
 * Written 2026-10-05 from a scratch run that found three real differences in
 * one library's Button in 31 seconds.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { collect, pairElements, selectorFor, rootPattern } from './pair.mjs';
import { displayName } from '../shared/names.js';
import { writeReport } from '../shared/output.mjs';
import { parseColour, figmaWeight, insetStroke } from './values.mjs';
import { probeSource } from './probe.mjs';
import { pseudoClasses } from '../component-contract/to-code.mjs';

import { realpathSync } from 'node:fs';
const req = createRequire(import.meta.url);

/* ---- the pure parts, tested by test-external.mjs ---- */

const show = (c) => (c ? (c[3] === 1 ? `rgb(${c.slice(0, 3).join(' ')})` : `rgb(${c.slice(0, 3).join(' ')} / ${c[3]})`) : 'none');
/* What a colour looks like over what is behind it: the nearest painted
   ancestor as code draws it, white where there is none. */
const over = (c, under = [255, 255, 255]) => (c ? c.slice(0, 3).map((x, i) => Math.round(x * c[3] + under[i] * (1 - c[3]))) : under);

/* Two values compared: `same`, `looks-same` (a colour written differently
   that draws the same over what is behind it, translucent against opaque) or
   `differs`. A chip's icon at 64% near-black over the chip's grey is the
   opaque grey code paints; over white it would not be. */
export function judge(want, got, under) {
  if (want && typeof want === 'object' && want.color) {
    const a = parseColour(want.color), b = parseColour(got);
    if (!a && !b) return 'same';
    // a colour that cannot be read is not compared by what is behind it: a red read as nothing passed for white
    if (!a || !b) return 'differs';
    const exact = a && b && a.every((x, i) => Math.abs(x - b[i]) <= (i < 3 ? 1 : 0.02));
    if (exact) return 'same';
    // two opaque colours draw as themselves: near is not the same (#fffcfc and #fdfdfd are two tokens)
    if (a[3] > 0.98 && b[3] > 0.98) return 'differs';
    const bg = under ? over(parseColour(under)) : undefined;
    return over(a, bg).every((x, i) => Math.abs(x - over(b, bg)[i]) <= 3) ? 'looks-same' : 'differs';
  }
  // half a pixel for lengths; a ratio, an em or an opacity (either side up to 2) to the third decimal,
  // or a line height of 1.15 passed for 1.6, and 2.05 for 1.6 either way round
  if (typeof want === 'number' && typeof got === 'number') return Math.abs(want - got) <= (Math.min(Math.abs(want), Math.abs(got)) <= 2 ? 0.005 : 0.5) ? 'same' : 'differs';
  return String(want) === String(got) ? 'same' : 'differs';
}

/* What the contract says one mapped element should measure: each field as a
   value code can compute, with the token it came from. */
export function expected(element, fields, value, textStyle, effectOf = () => null) {
  if (!element) return {};
  const out = {};
  const tok = (t) => ({ token: typeof t === 'string' ? t : null, v: value(t) });
  for (const f of fields) {
    if (f === 'background') { const t = tok(element.background); out.background = { want: { color: element.background == null ? 'rgb(0 0 0 / 0)' : t.v }, token: t.token }; }
    if (f === 'color') { const src = element.kind === 'graphic' ? element.background : element.color; const t = tok(src); out.color = { want: { color: t.v }, token: t.token }; }
    if (f === 'radius' && element.radius != null) {
      // four corners (a split button's leading half, 12 4 4 12) as code's four, clockwise from top left; equal, one
      const ts = [].concat(element.radius).map(tok);
      out.radius = ts.every((t) => t.v === ts[0].v) ? { want: ts[0].v, token: ts[0].token } : { want: ts.map((t) => t.v), token: ts.map((t) => t.token || t.v).join(' ') };
    }
    if (f === 'padding' && element.layout?.padding) for (const side of ['top', 'end', 'bottom', 'start']) { const t = tok(element.layout.padding[side]); out[`padding-${side}`] = { want: t.v, token: t.token }; }
    if (f === 'gap' && element.layout?.gap != null) { const t = tok(element.layout.gap); out.gap = { want: t.v, token: t.token }; }
    if (f === 'border') {
      if (!element.border) out['border-width'] = { want: 0, token: null };
      else { const w = [].concat(element.border.width ?? 1)[0]; const tw = tok(w), tc = tok(element.border.color); out['border-width'] = { want: tw.v, token: tw.token }; out['border-color'] = { want: { color: tc.v }, token: tc.token }; }
    }
    if (f === 'typography' && element.typography) {
      const s = textStyle(element.typography);
      if (s) for (const [k, v] of Object.entries({ 'font-size': s.size, 'font-weight': figmaWeight(String(s.weight)) ?? s.weight, 'line-height': +(s.lineHeight * s.size).toFixed(2), 'letter-spacing': +((s.letterSpacing || 0) * s.size).toFixed(2) })) out[k] = { want: v, token: element.typography };
    }
    // a shadow: the effect style's layers, as the key both sides are compared by (what they draw)
    if (f === 'shadow' && element.shadow) { const fx = effectOf(element.shadow); if (fx) out.shadow = { want: shadowKey((fx.layers || []).filter((l) => /SHADOW/.test(l.type)).map((l) => ({ inset: l.type === 'INNER_SHADOW', x: l.x, y: l.y, blur: l.blur, spread: l.spread, color: l.color }))), token: element.shadow }; }
    if (f === 'size') { if (element.minWidth != null) out['min-width'] = { want: value(element.minWidth), token: null }; if (element.minHeight != null) out['min-height'] = { want: value(element.minHeight), token: null }; }
  }
  return out;
}

/* What the code audit reads of each mapped element, asked of the parity engine's one probe (probe.mjs) and derived
   here: it had its own reader in the page, beside the probe and from-code's. */
const SIDES4 = ['top', 'right', 'bottom', 'left'];
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
const ASKED = ['background-color', 'color', ...CORNERS.map((c) => `border-${c}-radius`), ...SIDES4.map((x) => `padding-${x}`), 'row-gap',
  ...SIDES4.flatMap((x) => [`border-${x}-style`, `border-${x}-width`, `border-${x}-color`]), 'box-shadow', 'font-size', 'font-weight',
  'line-height', 'letter-spacing', 'min-width', 'min-height', 'width', 'height', '-under'];
const px = (v) => +(+parseFloat(v)).toFixed(2);
const clearPaint = (c) => /rgba\(.*,\s*0\)$|transparent/.test(c);
export function codeReading(r, before) {
  if (!r) return null;
  const layers = String(r['box-shadow']).split(/,(?![^(]*\))/);
  // a shape drawn with a pseudo-element (a tooltip's arrow) is measured by that paint, as pairing reads it
  const fill = clearPaint(r['background-color']) && before && before.content !== 'none' && !clearPaint(before['background-color']) ? before['background-color'] : r['background-color'];
  // one radius where the four corners agree, else the four, clockwise from top left
  const corners = CORNERS.map((c) => px(r[`border-${c}-radius`]));
  // the side that draws a border: all four for a box, one for a line (a divider's bottom border); else a stroke drawn
  // as an inset shadow
  const side = SIDES4.find((x) => r[`border-${x}-style`] !== 'none' && px(r[`border-${x}-width`]) > 0);
  const inset = !side && layers.map(insetStroke).find((x) => x && x.width > 0);
  const border = side ? { 'border-width': px(r[`border-${side}-width`]), 'border-color': r[`border-${side}-color`] }
    : inset ? { 'border-width': px(inset.width), 'border-color': inset.colour, 'border-as': 'inset shadow' } : { 'border-width': 0, 'border-color': r['border-top-color'] };
  return { background: fill, color: r.color, radius: corners.every((x) => x === corners[0]) ? corners[0] : corners,
    'padding-top': px(r['padding-top']), 'padding-end': px(r['padding-right']), 'padding-bottom': px(r['padding-bottom']), 'padding-start': px(r['padding-left']),
    gap: px(r['row-gap']), ...border,
    'font-size': px(r['font-size']), 'font-weight': +r['font-weight'], 'line-height': r['line-height'] === 'normal' ? 'normal' : px(r['line-height']),
    'letter-spacing': r['letter-spacing'] === 'normal' ? 0 : px(r['letter-spacing']),
    // a minimum the code does not set is met, or not, by the size it renders at
    'min-width': r['min-width'] === 'auto' || r['min-width'] === '0px' ? px(r.width) : px(r['min-width']),
    'min-height': r['min-height'] === 'auto' || r['min-height'] === '0px' ? px(r.height) : px(r['min-height']),
    // its shadows, less an inset one with no offset or blur (its border, read above)
    shadow: String(r['box-shadow']) === 'none' ? '' : layers.filter((l) => !insetStroke(l)).join(','),
    // what the element sits on: its nearest ancestor that paints a background
    under: r['-under'], __size: parseFloat(r.width) * parseFloat(r.height) };
}
async function readElements(tab, elements) {
  const layers = {};
  for (const [id, e] of Object.entries(elements)) {
    layers[id] = { selector: e.selector, props: ASKED };
    layers[`${id}::before`] = { selector: `:is(${e.selector})::before`, props: ['content', 'background-color'] };
  }
  const r = (await tab.evaluate(`${probeSource()}(${JSON.stringify({ r: { scope: null, layers } })}, {})`)).r;
  return Object.fromEntries(Object.keys(elements).map((id) => [id, codeReading(r[id], r[`${id}::before`])]));
}

/* A border no one can see: its colour, over the element's fill over what is
   behind it, draws the fill (Switch's 1.5px track border at 43% over a 91%
   black fill). Drawn and invisible is the same on screen, not a difference. */
export function invisibleBorder(m) {
  const b = parseColour(m['border-color']), fill = parseColour(m.background);
  if (!b || !fill) return false;
  const under = over(parseColour(m.under || 'rgb(255, 255, 255)'));
  const filled = over(fill, under);
  return over(b, filled).every((x, i) => Math.abs(x - filled[i]) <= 3);
}

/* A mapped element in one combination's anatomy. A swap renames the instance
   it swaps (iconContainer/circleAlert/icon → iconContainer/circleX/icon), so
   where the id is gone, the element whose address differs from it in that one
   inner segment and no other (a sibling's, as a left icon's container against
   a loader's, differs in more); none, or more than one, is not drawn. */
export function elementIn(anatomy, id) {
  if (anatomy[id]) return id;
  const seg = id.split('/');
  if (seg.length < 3) return null;
  const hits = Object.keys(anatomy).filter((x) => { const y = x.split('/'); if (y.length !== seg.length) return false; const off = y.map((v, i) => v !== seg[i]); return off.filter(Boolean).length === 1 && !off[0] && !off.at(-1); });
  return hits.length === 1 ? hits[0] : null;
}

/* Whether an element is part of another component the audit measures on its own (a sidebar's search input):
   its values are compared there, and paired here it lands on whatever that component draws. A part of an
   instance whose component has no audit of its own (an input's _Label, an icon) stays this one's to compare. */
export const insideAudited = (id, anatomy, audited) => id.split('/').slice(0, -1).some((_, i, a) => { const e = anatomy[a.slice(0, i + 1).join('/')]; return e && e.kind === 'instance' && audited.has(e.component); });

/* A name as a story is found by: no case, no spaces, no punctuation or marks ("🚧 App header" and the
   story AppHeader are one key). */
export const storyKey = (name) => String(name).replace(/[^A-Za-z0-9]/g, '').toLowerCase();
/* A Figma component's key under that rule: its own name, the `Category/` folder and status marker left out
   (displayName), so `Stepper - Step item / Vertical` is never the story Vertical. */
export const componentKey = (figmaName) => storyKey(displayName(figmaName));

/* Every combination of the props the map varies, the contract's invalid ones
   and the map's skipped values left out; every other prop at its default. */
export function combinations(contract, map, max = Infinity) {
  const varied = Object.entries(map.props || {}).filter(([, m]) => !(m && typeof m === 'object' && 'fixed' in m));
  const valuesOf = ([k, m]) => {
    const p = contract.props[k];
    if (!p) throw new Error(`the map names a prop the contract does not have: ${k}`);
    const all = m && Array.isArray(m.values) ? m.values : p.type === 'boolean' ? [false, true] : p.values;
    return all.filter((v) => !(m && m.skip || []).includes(v));
  };
  const fixed = Object.fromEntries(Object.entries(map.props || {}).filter(([, m]) => m && typeof m === 'object' && 'fixed' in m && !(m.drawn || []).length).map(([k, m]) => [k, m.fixed]));
  // a value the story draws beside the fixed one (pairedElements' `drawn`) is a combination of its own: the same page, other elements
  for (const [k, m] of Object.entries(map.props || {})) if (m && typeof m === 'object' && 'fixed' in m && (m.drawn || []).length) varied.push([k, { values: [m.fixed, ...m.drawn] }]);
  const out = [];
  const go = (i, acc) => {
    if (i === varied.length) {
      const when = { ...fixed, ...acc };
      if (!(contract.invalid || []).some((x) => Object.entries(x).every(([k, v]) => !(k in when) || when[k] === v))) out.push(when);
      return;
    }
    for (const v of valuesOf(varied[i])) go(i + 1, { ...acc, [varied[i][0]]: v });
  };
  go(0, {});
  if (out.length <= max) return out;
  // too many to render: each prop moved alone from its default, which is how a grid is read
  const base = Object.fromEntries(Object.entries(contract.props).filter(([k]) => k in (map.props || {})).map(([k, p]) => [k, 'default' in p ? p.default : undefined]));
  return out.filter((w) => Object.keys(w).filter((k) => k in base && w[k] !== base[k] && !(map.props[k] && typeof map.props[k] === 'object' && 'fixed' in map.props[k])).length <= 1);
}

/*
 * A component's mapping as every parity mapping is written, keyed by
 * Figma's own names (tools/parity/README.md: `storyId`, `axes` — an option's
 * args, its forced `pseudo`, or `skip` with why — `props` for what no option
 * says, `state` and `layers` by stored layer path, `page`), read into the
 * contract's ids, which the code audit works in. `b` is the component's
 * bridge (derive.cjs): its props and options under the contract's spelling,
 * and the contract id of each stored layer path. A name the bridge does not
 * know, or a layer that is not exactly one element, is an error and never
 * dropped: a mapping that silently lost a ruling would measure green.
 */
export function contractEntry(entry, b) {
  const propId = Object.fromEntries(Object.entries(b.props).map(([id, p]) => [p.figma, id]));
  const idOf = (name) => { if (!propId[name]) throw new Error(`the mapping names a prop the design does not have: ${name}`); return propId[name]; };
  const valueOf = (id, option) => {
    const values = b.props[id].values;
    if (!values) { if (/^(true|false)$/i.test(option)) return String(option).toLowerCase(); throw new Error(`${b.props[id].figma} has no option ${option}`); }
    const hit = Object.entries(values).find(([, o]) => o === option);
    if (!hit) throw new Error(`${b.props[id].figma} has no option ${option}`);
    return hit[0];
  };
  const elementOf = (at) => {
    const ids = b.ids[at] || [];
    if (ids.length !== 1) throw new Error(`the layer ${at} is ${ids.length ? `several elements of the design (${ids.join(', ')})` : 'no layer of the design'}`);
    return ids[0];
  };
  const props = {};
  for (const [name, p] of Object.entries(entry.props || {})) props[idOf(name)] = { ...p };
  for (const [name, options] of Object.entries(entry.axes || {})) {
    const id = idOf(name);
    const p = (props[id] = props[id] || {});
    for (const [option, rule] of Object.entries(options)) {
      const v = valueOf(id, option);
      if (rule && rule.pseudo) (p.pseudo = p.pseudo || {})[v] = rule.pseudo;
      else if (rule && 'skip' in rule) (p.skip = p.skip || []).push(v);
      // an option that sets no arg draws at the story's own default: the arg is left unset
      else if (!rule || !Object.keys(rule).length) (p.values = p.values || {})[v] = undefined;
      else {
        const args = Object.entries(rule || {});
        if (args.length !== 1 || (p.arg && p.arg !== args[0][0])) throw new Error(`${name}=${option}: a compared option sets one arg, the one its siblings set`);
        p.arg = args[0][0];
        (p.values = p.values || {})[v] = args[0][1];
      }
    }
  }
  const elements = {};
  for (const [at, rule] of Object.entries(entry.layers || {})) elements[elementOf(at)] = rule;
  return {
    story: entry.storyId,
    ...(Object.keys(props).length && { props }),
    ...(entry.state && { pseudoOn: elementOf(entry.state.layer) }),
    ...(Object.keys(elements).length && { elements }),
    ...(entry.page && { open: entry.page }),
    ...(entry.note && { note: entry.note }),
    ...(entry.code && { code: entry.code }),
  };
}

/* A combination as the story's args and the pointer state to force. */
export function argsFor(when, map) {
  const args = { ...(map.fixed || {}) };
  let pseudo = null;
  for (const [k, m] of Object.entries(map.props || {})) {
    const v = when[k];
    if (typeof m === 'string') args[m] = v;
    else if (m && m.pseudo) pseudo = m.pseudo[v] || pseudo;
    else if (m && m.arg) {
      if (!m.values || !(String(v) in m.values)) args[m.arg] = v;
      // a value the mapping leaves unset draws at the story's own default
      else if (m.values[String(v)] !== undefined) args[m.arg] = m.values[String(v)];
    }
    // `code` names the prop for the property check without setting it
  }
  return { args, pseudo };
}

/* Where a difference shows, in a reader's words: every combination checked,
   or the prop values all of its combinations share ("feedback danger"). */
export function where(whens, all, defaults = {}) {
  if (whens.length === all.length) return { every: true, shared: {} };
  const shared = {};
  for (const k of Object.keys(whens[0] || {})) {
    const v = whens[0][k];
    // shared by these, and not by every combination checked (a prop the map holds fixed says nothing)
    if (whens.every((w) => w[k] === v) && !all.every((w) => w[k] === v)) shared[k] = v;
  }
  // values at their default are noise beside one that is not (role primary is the button, not where
  // it differs), and the whole answer when nothing else is shared (only Large has the wrong line height)
  const moved = Object.fromEntries(Object.entries(shared).filter(([k, v]) => defaults[k] !== v));
  return { every: false, shared: Object.keys(moved).length ? moved : shared };
}

/* The rows, grouped by what differs: each group with every combination it
   shows in (its value in design and code there), and where that is. */
export function group(rows, defaults = {}) {
  const all = [...new Map(rows.map((r) => [JSON.stringify(r.when), r.when])).values()];
  const out = {};
  for (const r of rows) {
    if (r.verdict === 'same') continue;
    const k = `${r.verdict}|${r.element}|${r.field}`;
    (out[k] = out[k] || { verdict: r.verdict, element: r.element, field: r.field, token: r.token, count: 0, of: all.length, seen: [] }).count++;
    out[k].seen.push({ when: r.when, want: r.want, got: r.got, ...(r.token && { token: r.token }) });
  }
  for (const g of Object.values(out)) g.where = where(g.seen.map((s) => s.when), all, defaults);
  return Object.values(out).sort((a, b) => (a.verdict === b.verdict ? b.count - a.count : a.verdict === 'differs' ? -1 : 1));
}

/* A component's own props as its framework declares them, read from the
   framework's type definitions (its profile's `types`, audit-defaults
   frameworks): each prop's values where it is a union of strings, else its
   type. Values a library adds through the framework's override interfaces
   (the profile's `unionWrapper`) are not here, which is the point: what the
   code offers beyond these is its own. */
export function frameworkProps(dts, fw = {}) {
  const out = {};
  // a union of strings named once and used by several props (AlertColor)
  const aliases = Object.fromEntries([...String(dts).matchAll(/^export type (\w+) =\s*((?:\s*\|?\s*'[^']*')+);/gm)].map((m) => [m[1], [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])]));
  for (const [, name, type] of String(dts).matchAll(/^\s+(\w+)\?:\s*([^;]+);/gm)) {
    // values only from a union of strings (or aliases of one): `X['inputProps']` is a type, not a value
    if (!(name in out)) out[name] = valuesOf(type, aliases, fw);
  }
  return out;
}


/* A component's API as its types declare it: the props type named for the
   component (`ButtonProps`), its own fields, and the fields of every type it
   is built from (`extends`, `&`, a union of alternatives), followed by name
   through imports and re-exports into the library's other types and its
   framework's, less what an `Omit<T, 'a' | 'b'>` or one of the framework's
   own wrappers (the profile's `wrappers`) takes away. Only those types: reading every field in a file took a nested
   object's fields (TextField's labels) and the theme's as props. */
export function readApi(file, typeName, read, resolveModule, fw = {}) {
  const out = {}, seen = new Set();
  const balanced = (src, at) => { let d = 0; for (let i = at; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) return src.slice(at + 1, i); } return ''; };
  const fieldsOf = (body) => { let d = 0; const f = []; for (const line of body.split('\n')) { if (d === 0) { const m = line.match(/^\s*(\w+)\??:\s*(.+?);?\s*$/); if (m) f.push([m[1], m[2]]); } d += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length; } return f; };
  // the types a type expression is built from, each with the keys an Omit around it takes away;
  // wrappers nest (Omit<StandardProps<ModalProps, 'x'>, 'y'>), so their arguments are read by bracket depth
  const refsOf = (text, omitted = []) => {
    const refs = []; let rest = '', i = 0;
    const wrap = new RegExp(`\\b(?:${['Omit', 'DistributiveOmit', ...(fw.wrappers || [])].join('|')})<`, 'g');
    for (let m; (m = wrap.exec(text));) {
      let d = 1, j = m.index + m[0].length, comma = -1;
      for (; j < text.length && d; j++) { const ch = text[j]; if (ch === '<' || ch === '(' || ch === '{' || ch === '[') d++; else if (ch === '>' || ch === ')' || ch === '}' || ch === ']') d--; else if (ch === ',' && d === 1 && comma < 0) comma = j; }
      const inner = text.slice(m.index + m[0].length, comma < 0 ? j - 1 : comma);
      const keys = comma < 0 ? [] : [...text.slice(comma, j - 1).matchAll(/'([^']+)'/g)].map((x) => x[1]);
      rest += text.slice(i, m.index); i = j; wrap.lastIndex = j;
      refs.push(...refsOf(inner, [...omitted, ...keys]));
      // a framework's wrapper adds members of its own (className, style, ref) besides omitting
      if ((fw.wrappers || []).includes(m[0].slice(0, -1))) refs.push([m[0].slice(0, -1), omitted]);
    }
    rest += text.slice(i);
    // a slots type's members are the slots' own props, not the component's
    for (const m of rest.matchAll(/\b([A-Z]\w*(?:Props|TypeMap))\b/g)) if (!/Slots?(?:AndSlot)?Props$/.test(m[1])) refs.push([m[1], omitted]);
    return refs;
  };
  // string unions named by an alias, declared here or imported from a file beside it
  const unions = (src) => Object.fromEntries([...src.matchAll(/^export type (\w+) =\s*((?:\s*\|?\s*'[^']*')+);/gm)].map((m) => [m[1], [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])]));
  const aliasesIn = (f, src) => {
    const own = unions(src);
    for (const m of src.matchAll(/import (?:type )?\{([^}]*)\} from ['"](\.[^'"]+)['"]/g)) {
      const there = unions(read(path.resolve(path.dirname(f), m[2].replace(/\.js$/, ''))) || '');
      for (const part of m[1].split(',')) { const [orig, as] = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/); if (there[orig]) own[(as || orig).trim()] = there[orig]; }
    }
    return own;
  };
  const resolve = (f, name, omit) => {
    const key = `${f}|${name}`; if (!f || seen.has(key)) return; seen.add(key);
    const src = read(f); if (src == null) return;
    const aliases = aliasesIn(f, src);
    const take = (fields) => { for (const [k, type] of fields) if (!omit.has(k) && !(k in out)) out[k] = { ...valuesOf(type, aliases, fw), from: fw.modules && f.includes(`node_modules/${fw.modules}`) ? 'framework' : 'own' }; };
    // a type map (a framework's way to type a polymorphic component) carries its props in its `props` member
    if (/TypeMap$/.test(name)) {
      const decl = src.match(new RegExp(`(?:interface\\s+${name}\\b|type\\s+${name}\\b(?:<(?:[^<>]|<[^<>]*>)*>)?\\s*=)[^]*?\\n\\}`));
      if (decl) {
        for (const m of decl[0].matchAll(/\bprops:\s*([^;]+);/g)) for (const [r, om] of refsOf(m[1])) resolve(f, r, new Set([...omit, ...om]));
        // a map built on another (ExtendButtonBaseTypeMap<{ props: … }>) takes that one's props too
        for (const m of decl[0].replace(/\bprops:\s*[^;]+;/g, '').slice(name.length).matchAll(/\b([A-Z]\w*TypeMap)\b/g)) if (m[1] !== name) resolve(f, m[1], omit);
        return;
      }
    }
    const iface = src.match(new RegExp(`(?:export\\s+)?interface\\s+${name}\\b(?:<[^{]*?>)?([^{]*)\\{`));
    if (iface) { take(fieldsOf(balanced(src, iface.index + iface[0].length - 1))); for (const [r, om] of refsOf(iface[1])) resolve(f, r, new Set([...omit, ...om])); return; }
    const alias = src.match(new RegExp(`(?:export\\s+)?type\\s+${name}\\b(?:<(?:[^<>]|<[^<>]*>)*>)?\\s*=`));
    if (alias) {
      let i = alias.index + alias[0].length, d = 0, rhs = '';
      for (; i < src.length; i++) { const ch = src[i]; if (ch === '{') d++; if (ch === '}') d--; if (ch === ';' && d === 0) break; rhs += ch; }
      for (const m of rhs.matchAll(/\{/g)) if (rhs.slice(0, m.index).split('{').length - rhs.slice(0, m.index).split('}').length === 0) take(fieldsOf(balanced(rhs, m.index)));
      for (const [r, om] of refsOf(rhs.replace(/\{[\s\S]*\}/g, ''))) resolve(f, r, new Set([...omit, ...om]));
      return;
    }
    // not declared here: where an import or a re-export says it is
    for (const m of src.matchAll(/import (?:type )?(?:\w+\s*,\s*)?\{([^}]*)\} from ['"]([^'"]+)['"]/g)) {
      for (const part of m[1].split(',')) {
        const [orig, as] = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/);
        if ((as || orig) !== name) continue;
        const spec = m[2].replace(/\.js$/, '');
        resolve(spec.startsWith('.') ? path.resolve(path.dirname(f), spec) : resolveModule(spec), orig.trim(), omit);
      }
    }
    for (const m of src.matchAll(/export (?:type )?\{([^}]*)\} from ['"]([^'"]+)['"]/g)) if (m[1].split(',').some((x) => x.trim().split(/\s+as\s+/).pop() === name)) resolve(path.resolve(path.dirname(f), m[2].replace(/\.js$/, '')), name, omit);
    for (const m of src.matchAll(/export \* from ['"]([^'"]+)['"]/g)) resolve(path.resolve(path.dirname(f), m[1].replace(/\.js$/, '')), name, omit);
  };
  resolve(file, typeName, new Set());
  return out;
}

/* A prop's type as values: a union of strings, or of aliases of one; else its type. */
function valuesOf(type, aliases = {}, fw = {}) {
  const head = fw.unionWrapper ? String(type).replace(new RegExp(`^${fw.unionWrapper}<\\s*`), '').split(/,\s*\w+Overrides>/)[0] : String(type);
  const union = head.replace(/'[^']*'|\b[A-Z]\w+\b|\bundefined\b|[|\s]/g, '') === '' && !/\[/.test(head);
  const values = !union ? [] : [...head.matchAll(/'([^']+)'/g)].map((m) => m[1]).concat(...[...head.matchAll(/\b([A-Z]\w+)\b/g)].map((m) => aliases[m[1]] || []));
  return values.length ? { values } : { type: /^boolean\b/.test(String(type)) ? 'boolean' : String(type).split(/\s*\|\s*undefined/)[0].trim() };
}

/* A design prop joined to the code prop that does its job, by rule: the same
   words; the same less a trailing "text" (Label text, label); the words its
   framework uses for it (the profile's `sameJob`); or the enum whose values
   hold all of the design's. The first that the code's API has is taken. */
export function joinProp(name, p, api, fw = {}) {
  const norm = (s) => tokenWords(s).join('');
  const words = tokenWords(name).join(' ');
  // a text prop joins a prop that takes text, never a flag: Error text is helperText, not error
  const fits = (k) => !(p.type === 'string' && api[k] && api[k].type === 'boolean');
  const has = (k) => k && Object.prototype.hasOwnProperty.call(api, k) && fits(k);
  const byNorm = Object.keys(api).find((k) => norm(k) === norm(name) && fits(k));
  if (byNorm) return byNorm;
  const less = words.replace(/ text$/, '');
  const lessHit = Object.keys(api).find((k) => norm(k) === less.replace(/ /g, '') && fits(k));
  if (lessHit && lessHit !== name) return lessHit;
  for (const k of (fw.sameJob || {})[words] || []) if (has(k)) return k;
  if (p.type === 'enum') return Object.keys(api).find((k) => Array.isArray(api[k].values) && p.values.every((v) => api[k].values.map(String).includes(String(v)))) || null;
  return null;
}

/* The design's props against the code's, as the map joins them. Each prop
   gets the findings a person rules on:
   - `renamed`: the code calls the prop something else (role → variant)
   - `value-renamed`: a value the map has to translate (success → positive)
   - `missing`: a design value the code does not offer
   - `default`: the code starts from another value
   - `only-in-code`: values the code offers and the design does not draw
   - `not-mapped`: no code prop joined to it, or one the story does not
     declare, so nothing was checked
   The State axis's pointer states are the platform's, not props; any other
   value of it (Loading) is expected as a boolean prop of its own name. */
export function compareProps(contract, map, argTypes, framework = null, fw = {}) {
  const inherited = new Set(fw.inherited || []);
  const out = [];
  const code = argTypes || {};
  const named = (k) => k.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  for (const [k, p] of Object.entries(contract.props)) {
    const m = (map.props || {})[k];
    const row = { prop: k, figma: p.figma, type: p.type, values: p.values || null, default: 'default' in p ? p.default : null, code: null, findings: [] };
    if (p.role === 'interaction') {
      row.code = { prop: '(pointer states)' };
      for (const v of (p.values || []).filter((v) => v !== p.default && !(p.pointer || []).includes(v))) {
        const c = code[v];
        row.findings.push(c ? { kind: 'ok', detail: `${v} is a prop of its own in code` } : { kind: 'missing', detail: `${v} is a value of the State axis; code has no ${v} prop` });
      }
      out.push(row); continue;
    }
    // the prop in the code's API (`code`), where the story drives another (`arg`, defaultChecked for checked)
    const arg = typeof m === 'string' ? m : m && (m.code || m.arg);
    if (!arg) { row.findings.push(m && m.missing ? { kind: 'not-in-code', detail: "no prop in the code's API does this job" } : { kind: 'not-mapped', detail: 'no code prop joined to it' }); out.push(row); continue; }
    const c = code[arg];
    row.code = { prop: arg, options: c?.options || null, default: c ? c.default : undefined };
    // what the framework itself calls it: the prop if its component has one, its own values, and so which values are
    // the library's additions; a prop the framework's component does not declare may still be the platform's (fw.inherited)
    if (framework) row.framework = framework[arg] ? { prop: arg, values: framework[arg].values || null } : inherited.has(arg) ? { prop: arg, inherited: true } : { prop: null };
    // a story declares what it shows; one it hides (MUI's startIcon behind a story's own control) it may not
    // declare at all, and absent from the story is not absent from the component
    if (!c) { row.findings.push({ kind: 'not-mapped', detail: `the story does not declare ${arg}, so it could not be checked` }); out.push(row); continue; }
    if (named(arg) !== named(k)) row.findings.push({ kind: 'renamed', detail: `${named(k)} in design, ${arg} in code` });
    // a value the mapping leaves unset is whatever the code draws when nothing is set: its default
    const to = (v) => (m && m.values && String(v) in m.values ? m.values[String(v)] ?? c.default : v);
    if (p.type === 'enum') {
      row.code.values = p.values.map(to);
      row.code.extra = (c.options || []).filter((o) => !row.code.values.map(String).includes(String(o)));
      // an unset value whose default the code does not state is not known, so nothing is said of it
      for (const v of p.values) if (to(v) !== undefined && String(to(v)) !== String(v)) row.findings.push({ kind: 'value-renamed', detail: `${v} in design, ${to(v)} in code` });
      // compared as text: a size the design calls "24" is the code's 24
      const offers = (x) => c.options && c.options.map(String).includes(String(x));
      const missing = p.values.filter((v) => c.options && to(v) !== undefined && !offers(to(v)));
      if (missing.length) row.findings.push({ kind: 'missing', detail: `code does not offer ${missing.join(', ')}` });
      const extra = (c.options || []).filter((o) => !p.values.map(to).map(String).includes(String(o)));
      if (extra.length) row.findings.push({ kind: 'only-in-code', detail: extra.join(', ') });
    }
    // a text prop's default is the words the design shows, sample copy, not a setting the code must match
    if ('default' in p && p.type !== 'string' && c.default !== undefined && String(to(p.default)) !== String(c.default)) row.findings.push({ kind: 'default', detail: `${p.default} in design, ${c.default} in code` });
    out.push(row);
  }
  // a boolean that shows the layer a text prop fills (Value and Value text, figma-standard rule 5's revealer and filler)
  // is one feature in two Figma props; code has one prop for it (value: set, and it shows). Joined to the
  // same code prop, the pair is one row, judged under whichever of the two names the code shares
  for (const b of [...out]) {
    const bp = contract.props[b.prop];
    if (!bp || bp.type !== 'boolean' || !b.code || !b.code.prop) continue;
    const t = out.find((r) => r !== b && r.code && r.code.prop === b.code.prop && contract.props[r.prop]?.type === 'string'
      && (contract.props[r.prop].sets || []).some((id) => (bp.shows || []).some((s) => id === s || id.startsWith(`${s}/`))));
    if (!t) continue;
    t.figma = `${bp.figma || b.prop} + ${t.figma}`;
    t.pair = b.prop;
    if (!b.findings.some((f) => f.kind === 'renamed')) t.findings = t.findings.filter((f) => f.kind !== 'renamed');
    out.splice(out.indexOf(b), 1);
  }
  // the library's own props that no design prop is joined to: its API beyond the design's. What it
  // inherits from its framework is left out (every library on it offers it), and so are the props no
  // design draws, as the framework's profile names them (`notDesign`: handlers, styling escapes, slots).
  const joined = new Set(Object.values(map.props || {}).map((x) => (typeof x === 'string' ? x : x && (x.arg || x.code))).filter(Boolean));
  for (const [k, c] of Object.entries(code)) {
    if (c.from === 'framework' || joined.has(k) || (fw.notDesign && new RegExp(fw.notDesign, 'i').test(k))) continue;
    out.push({ prop: null, figma: null, type: null, values: null, code: { prop: k, options: c.options || null }, findings: [{ kind: 'code-only-prop', detail: `${k} has no design prop joined to it` }],
      ...(framework && { framework: framework[k] ? { prop: k, values: framework[k].values || null } : inherited.has(k) ? { prop: k, inherited: true } : { prop: null } }) });
  }
  return out;
}

/* A map entry drafted by rule, for a component no person has mapped yet:
   its elements are paired by rule (pair.mjs), and a design prop is joined to the
   code prop of its own name, or to the one whose options hold all its
   values; text goes to `children` or `label`. Everything else is held at its
   default and shows as not checked. A draft says so in the report, so a
   reader can tell a measured mapping from a guessed one, and a person who
   corrects it copies it into the map. */
export function draftEntry(contract, argTypes, story) {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const code = argTypes || {};
  const props = {};
  for (const [k, p] of Object.entries(contract.props)) {
    if (p.role === 'interaction') { props[k] = { pseudo: Object.fromEntries((p.pointer || []).map((v) => [v, { hover: 'hover', focus: 'focus-visible', press: 'active' }[v] || v])), skip: p.values.filter((v) => v !== p.default && !(p.pointer || []).includes(v)) }; continue; }
    if (p.type === 'string') { const t = ['children', 'label'].find((x) => x in code); props[k] = t ? { arg: t, fixed: 'Label' } : { fixed: undefined }; continue; }
    const same = Object.keys(code).find((x) => norm(x) === norm(k));
    const holds = p.type === 'enum' && Object.keys(code).find((x) => Array.isArray(code[x].options) && p.values.every((v) => code[x].options.includes(v)));
    const arg = same || holds;
    if (arg && (p.type === 'boolean' || (p.type === 'enum' && Array.isArray(code[arg].options) && p.values.every((v) => code[arg].options.includes(v))))) props[k] = arg;
    else props[k] = { fixed: 'default' in p && p.type !== 'string' ? p.default : undefined };
  }
  // its elements are paired by rule (pair.mjs), as every component's are: a guess here would override it
  return { draft: true, story, props };
}

/* How each design prop is joined, compared and driven, for every component
   alike: a person's entry in the map wins (a value the code spells
   differently, a prop the rule cannot find); otherwise the rule (joinProp)
   finds the code prop in the component's API, and where the story declares
   it with the design's values, the visual check drives it too. A prop the
   API has no counterpart for is marked missing: a finding, not a gap in
   the mapping. */
export function effectiveProps(contract, overrides, api, story, fw = {}) {
  // each pointer state by the pseudo-class the settings give it (to-code's pseudoClasses); focus is forced elsewhere
  const PS = pseudoClasses();
  const out = {};
  for (const [k, p] of Object.entries(contract.props)) {
    if (overrides && k in overrides) { out[k] = overrides[k]; continue; }
    const at = 'default' in p && p.type !== 'string' ? p.default : undefined;
    if (p.role === 'interaction') { out[k] = { pseudo: Object.fromEntries((p.pointer || []).filter((v) => PS[v] && PS[v] !== ':focus-visible').map((v) => [v, PS[v].slice(1)])), skip: p.values.filter((v) => v !== p.default && (v === 'focus' || !(p.pointer || []).includes(v))) }; continue; }
    const arg = joinProp(p.figma || k, p, api, fw);
    if (!arg) { out[k] = { fixed: at, missing: true }; continue; }
    const s = story && story[arg];
    const drivable = s && (p.type === 'boolean' || (p.type === 'enum' && Array.isArray(s.options) && p.values.every((v) => s.options.map(String).includes(String(v)))));
    out[k] = drivable ? arg : { code: arg, fixed: at };
  }
  return out;
}

/* Whether a mapping can be trusted before its findings are: an element whose
   selector matched nothing, or something with no size, or that differs on
   most of the fields it measures never matching in any combination, is more
   likely the wrong element than a component that is wrong everywhere. That
   is how a checkbox's touch area and a switch's wrapper were first measured
   as the box the design draws. A suspect mapping is shown, never counted. */
export function suspectMappings(rows, seen) {
  const out = [];
  for (const [key, s] of Object.entries(seen)) {
    const el = key.replace(/@space$/, ' (its spacing)');
    if (s.missing === s.total) out.push(`${el}: its selector matches nothing in any combination`);
    else if (s.missing) out.push(`${el}: its selector matches nothing in ${s.missing} of ${s.total} combinations`);
    if (s.invisible && s.invisible === s.total - s.missing) out.push(`${el}: it matches an element with no size`);
  }
  const by = {};
  for (const r of rows) ((by[r.element] = by[r.element] || {})[r.field] = by[r.element][r.field] || []).push(r.verdict);
  for (const [el, fields] of Object.entries(by)) {
    const names = Object.keys(fields);
    // most of the fields it measures never match, in any combination: a wrong element still agrees
    // now and then (no border on either side), so "every field" let the checkbox's touch area through
    const never = names.filter((f) => fields[f].every((v) => v === 'differs'));
    if (names.length >= 2 && never.length * 2 > names.length) out.push(`${el}: ${never.length} of the ${names.length} fields it measures never match (${never.join(', ')}): likely the wrong element`);
  }
  return out;
}

/* ---- tokens: the design's variables, text styles and effects against the
   token files the library generates ---- */

/* A token path in words, whatever case or separator it was written in:
   `Color/Background/Neutral/primary-translucent` and
   color.background.neutral.primaryTranslucent are both
   "color background neutral primary translucent". */
export const tokenWords = (path) => [].concat(path).join(' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([a-zA-Z])([0-9])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/* Every leaf of a nested object, as [path, value]. */
export function leaves(obj, at = []) {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...leaves(v, [...at, k]));
    else out.push([[...at, k], v]);
  }
  return out;
}

/* A shadow as one comparable string, from the design's effect layers or from
   CSS: offsets, blur, spread and colour per layer, in paint order. */
export function shadowKey(layers) {
  const one = (l) => [l.inset ? 'inset' : '', Math.round(l.x), Math.round(l.y), Math.round(l.blur), Math.round(l.spread || 0), (parseColour(l.color) || []).map((x, i) => (i < 3 ? x : Math.round(x * 100) / 100)).join(',')].join(' ').trim();
  return layers.map(one).join(' | ');
}
export function cssShadows(css) {
  const parts = []; let depth = 0, cur = '';
  for (const ch of String(css)) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch; }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => {
    const color = (p.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i) || [''])[0];
    const nums = p.replace(color, '').match(/-?[\d.]+(?=px)|\b0\b/g) || [];
    return { inset: /\binset\b/.test(p), x: +nums[0] || 0, y: +nums[1] || 0, blur: +nums[2] || 0, spread: +nums[3] || 0, color };
  });
}

/* The design's tokens against the code's. `ours`: [{ group, name, words?, value }]
   with value a colour or a number (or a text style's numbers); `theirs`: the
   same shape from the code's files. Matched by their words (a typography
   name's in any order); returns rows for what differs, what the code lacks,
   and what only the code has, with counts per group. */
export function compareTokens(ours, theirs) {
  const key = (t) => (t.sorted ? [...t.words].sort() : t.words).join(' ');
  const code = new Map(theirs.map((t) => [`${t.group}|${key(t)}`, t]));
  const used = new Set();
  const groups = {};
  const g = (n) => (groups[n] = groups[n] || { checked: 0, same: 0, differs: 0, missing: 0, onlyInCode: 0, rows: [] });
  for (const t of ours) {
    const c = code.get(`${t.group}|${key(t)}`);
    const G = g(t.group); G.checked++;
    if (!c) { G.missing++; G.rows.push({ verdict: 'missing', name: t.name, design: t.show ?? t.value }); continue; }
    used.add(c);
    const v = typeof t.value === 'object' && t.value ? (Object.keys(t.value).every((k) => judge(t.value[k], c.value[k]) === 'same') ? 'same' : 'differs') : judge(typeof t.value === 'string' && parseColour(t.value) ? { color: t.value } : t.value, c.value);
    if (v === 'same') G.same++; else { G.differs++; G.rows.push({ verdict: v, name: t.name, code: c.name, design: t.show ?? t.value, got: c.show ?? c.value }); }
  }
  for (const c of theirs) if (!used.has(c)) { const G = g(c.group); G.onlyInCode++; G.rows.push({ verdict: 'only-in-code', code: c.name, got: c.show ?? c.value }); }
  return groups;
}

/* The two sides of the token comparison, read: our snapshot's variables,
   text styles and effects; the library's generated token modules, imported
   (Node strips their types). Which files, and which of our names stand for
   which of their groups, is the map's (`tokens`), as everything joining the
   two sides is. */
export async function tokenSides(snapshot, repo, spec, valueOf) {
  const mod = async (f) => import(path.join(repo, f));
  const ours = [], theirs = [];
  // colours, per mode: the Semantic collection against the light and dark trees
  if (spec.colours) {
    const col = snapshot.collections[spec.colours.collection];
    const m = await mod(spec.colours.file);
    const tree = m[spec.colours.export];
    for (const mode of col.modes) {
      // Figma keeps an opacity variable in percent (4); code writes it as a fraction (0.04)
      const asCode = (name, v) => (/opacity/i.test(name) && typeof v === 'number' ? +(v / 100).toFixed(4) : v);
      for (const name of Object.keys(col.values[mode] || {})) ours.push({ group: 'colour', name: `${name} (${mode})`, words: [mode.toLowerCase(), ...tokenWords(name)], value: asCode(name, valueOf(snapshot, name, mode)) });
      for (const [p, v] of leaves(tree[mode.toLowerCase()] || {})) theirs.push({ group: 'colour', name: `${mode.toLowerCase()}.${p.join('.')}`, words: [mode.toLowerCase(), ...tokenWords(p)], value: v });
    }
  }
  // sizes: each of our primitive groups against the module the map pairs it with
  for (const [prefix, { file, export: ex, as }] of Object.entries(spec.sizes || {})) {
    const col = Object.values(snapshot.collections).find((c) => Object.keys(c.values[c.modes[0]] || {}).some((n) => n.startsWith(prefix + '/')));
    for (const n of Object.keys(col ? col.values[col.modes[0]] : {})) if (n.startsWith(prefix + '/')) ours.push({ group: 'size', name: n, words: [as, ...tokenWords(n.slice(prefix.length + 1))], value: valueOf(snapshot, n, col.modes[0]) });
    for (const [p, v] of leaves((await mod(file))[ex])) theirs.push({ group: 'size', name: `${ex}.${p.join('.')}`, words: [as, ...tokenWords(p)], value: v });
  }
  // text styles: the words in any order, the library's own prefix and filler words left out
  if (spec.textStyles) {
    const t = spec.textStyles, drop = new Set(tokenWords(t.drop || []));
    for (const s of snapshot.textStyles || []) {
      if (t.prefix && !s.name.startsWith(t.prefix)) continue;
      ours.push({ group: 'type', name: s.name, sorted: true, words: tokenWords(s.name.slice((t.prefix || '').length)).filter((w) => !drop.has(w)),
        value: { fontSize: s.size, fontWeight: figmaWeight(String(s.weight)) ?? s.weight, lineHeight: +(+s.lineHeight).toFixed(3), letterSpacing: +(+(s.letterSpacing || 0)).toFixed(3) } });
    }
    for (const [k, v] of Object.entries((await mod(t.file))[t.export] || {})) theirs.push({ group: 'type', name: k, sorted: true, words: tokenWords(k),
      value: { fontSize: v.fontSize, fontWeight: v.fontWeight, lineHeight: +(+v.lineHeight).toFixed(3), letterSpacing: +(parseFloat(v.letterSpacing) || 0).toFixed(3) } });
  }
  // effects: matched by what they draw, since the two sides name them differently
  if (spec.effects) {
    for (const e of snapshot.effects || []) { const k = shadowKey(e.layers.filter((l) => /SHADOW/.test(l.type)).map((l) => ({ ...l, inset: l.type === 'INNER_SHADOW' }))); ours.push({ group: 'effect', name: e.name, words: [k], value: k }); }
    for (const [p, v] of leaves((await mod(spec.effects.file))[spec.effects.export])) if (typeof v === 'string' && /px/.test(v) && /rgba?\(|#[0-9a-f]{3}/i.test(v)) { const k = shadowKey(cssShadows(v)); theirs.push({ group: 'effect', name: p.join('.'), words: [k], value: k, show: v }); }
  }
  return { ours, theirs };
}

/* ---- the run ---- */

/* Which kind of token a measured field is named from, in the order tried. */
const TYPE_FIELDS = ['font-size', 'font-weight', 'line-height', 'letter-spacing'];
// a field with no kind of token (line height, letter spacing, weight: text styles hold those) is looked up in none
const FIELD_KIND = { background: ['background'], color: ['text', 'icon'], 'border-color': ['stroke'], radius: ['radius'], 'border-width': ['width'], 'font-size': ['fontSize'], 'line-height': [], 'letter-spacing': [], 'font-weight': [] };

/* The code's side of a props comparison, which the code audit and the
   contract from code (tools/component-contract/from-code.mjs) both compare through
   compareProps, so a prop is judged one way whichever asks: the component's
   API from its own types (readApi), what its story declares beside them, its
   framework's own definition of the component the project names
   (`frameworkComponents`, read where the framework's profile says, `types`),
   and the map with its joins made by rule where a person made none
   (effectiveProps). */
export function propsSide(repo, lib, contract, map, argTypes) {
  const fw = lib.codeProfile || {};
  const fwName = (lib.frameworkComponents || {})[contract.component];
  const pascal = (s) => String(s).replace(/^[^\p{L}]+/u, '').split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  const codeDir = path.join(repo, lib.code.components);
  const own = [map.code, pascal(displayName(contract.component)), fwName].filter(Boolean).find((n) => fs.existsSync(path.join(codeDir, n)));
  const readTs = (f) => { for (const x of [f, `${f}.ts`, `${f}.tsx`, `${f}.d.ts`, path.join(f, 'index.d.ts')]) { try { if (fs.statSync(x).isFile()) return fs.readFileSync(x, 'utf8'); } catch { /* next */ } } return null; };
  const moduleAt = (spec) => (fw.modules && spec.startsWith(fw.modules) ? path.join(repo, 'node_modules', spec, spec.split('/').pop()) : null);
  // the props type named for the component, or one that ends so (ArcDataGridProps)
  const typesFile = own && (fs.existsSync(path.join(codeDir, own, `${own}.types.ts`)) ? path.join(codeDir, own, `${own}.types`) : path.join(codeDir, own, own));
  const propsType = own && ([...(readTs(typesFile) || '').matchAll(new RegExp(`export\\s+(?:type|interface)\\s+(\\w*${own}Props)\\b`, 'g'))].map((x) => x[1]).sort((a, b) => a.length - b.length)[0] || `${own}Props`);
  const api = own ? readApi(typesFile, propsType, readTs, moduleAt, fw) : {};
  const code = { ...Object.fromEntries(Object.entries(api).map(([k, v]) => [k, { options: v.values && v.values.length ? v.values : null, from: v.from }])),
    ...Object.fromEntries(Object.entries(argTypes).map(([k, v]) => [k, { from: api[k] ? api[k].from : 'story', options: v.options || (api[k] && api[k].values && api[k].values.length ? api[k].values : null), default: v.default }])) };
  const dts = fwName && fw.types && path.join(repo, fw.types.replace(/\{Name\}/g, fwName));
  return { own, api, code, framework: dts && fs.existsSync(dts) ? frameworkProps(fs.readFileSync(dts, 'utf8'), fw) : null, fw,
    // joined against everything the component takes: its types, and what its story declares beside them
    // an overlay (tooltip, dialog, drawer, menu) is drawn only open: where the story takes an `open` the design
    // has no prop for, it is set, so the run measures the overlay and not the button that opens it. Only where
    // the story declares it: one it does not declare never reaches it (the host refuses it, rather than measure
    // the overlay shut and call it open)
    map: { ...map, props: effectiveProps(contract, map.props, { ...Object.fromEntries(Object.keys(argTypes).map((k) => [k, {}])), ...api }, argTypes, fw),
      ...(('open' in argTypes) && !('open' in contract.props) && { fixed: { open: true, ...(map.fixed || {}) } }) } };
}

/* A component's story on screen, as every parity run opens one: through the
   Storybook host (hosts.mjs: settled, and refused where an arg did not reach
   the story), driven into the state its mapping opens it in (`page`, read as
   `open`: a pointer over or pressed on what opens an overlay), and measured
   once its transitions have run. `page` is the host openLibrary opened. */
export async function showStory(page, tab, story, args, map, tier) {
  const { waitFor } = await import('../shared/cdp.mjs');
  const { drive } = await import('./hosts.mjs');
  await page.open(tab, { storyId: story, args, tier });
  if (map && map.open) await drive(tab, map.open);
  await waitFor(tab, 'document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity)', { timeout: 3000 }).catch(() => {});
}

/* A measured shadow as the key an effect style's layers are compared by. */
const shadowAsKey = (k, v) => (k === 'shadow' ? (v ? shadowKey(cssShadows(v)) : 'none') : v);

/* Which element each contract element lands on: paired by rule (pair.mjs) at
   the component's defaults, rendered in its story; an element the map names
   keeps the map's (a ruling: another element, other fields, or `skip` with
   why it is not compared). Both the code audit and the contract from code
   (tools/component-contract/from-code.mjs) place elements here. */
export async function pairedElements(tab, show, contract, map, value, textStyle, ignoreRulings = false, effectOf = () => null, audited = new Set(), instance = null) {
  const rootRe = instance ? new RegExp(rootPattern(instance)) : null;
  const { call } = await import('../shared/cdp.mjs');
  const { expand } = req('../component-contract/derive.cjs');
  const { variantDefaults } = req('../component-contract/derive.cjs');
  // a text prop's words are the story's own, or the map's fixed sample: never the design's sample copy
  const defaults = { ...variantDefaults(contract), ...Object.fromEntries(Object.entries(map.props || {}).filter(([, x]) => x && typeof x === 'object' && 'fixed' in x).map(([k, x]) => [k, x.fixed])) };
  const { args } = argsFor(defaults, map);
  await show(map.story, args, map);
  // the whole page: an open overlay is drawn in a portal beside the story's root, not in it
  const nodes = await call(tab, collect, 'body');
  const at = expand(contract, defaults);
  const inInstance = (id) => insideAudited(id, at, audited);
  const own = Object.fromEntries(Object.entries(at).filter(([id]) => !inInstance(id)));
  const found = nodes ? pairElements(own, nodes, (id, f) => expected(at[id], f, value, textStyle, effectOf), judge, shadowAsKey, { value, instance }) : {};
  // an element the defaults do not draw (a value text, an error message) is paired where one prop moved from
  // its default draws it: each prop the map varies, each value, once, for what is still unpaired
  const varied = Object.entries(map.props || {}).filter(([k, x]) => contract.props[k] && contract.props[k].role !== 'interaction' && !(x && typeof x === 'object' && ('fixed' in x || x.pseudo)));
  const tries = varied.flatMap(([k]) => { const p = contract.props[k]; return (p.type === 'enum' ? p.values : p.type === 'boolean' ? [true, false] : []).filter((v) => v !== defaults[k]).map((v) => ({ ...defaults, [k]: v })); });
  // then where each variant that adds an element draws it, its props together (a logo, drawn only from size 32);
  // a value of a prop the map holds fixed is no arg, so it is looked for where the story already draws it
  // beside the default (the initials avatar next to the photo one)
  for (const v of contract.variants || []) if (v.add && v.when) tries.push({ ...defaults, ...v.when });
  const drawn = {};
  // which instance of the component a node is in: its nearest self-or-ancestor with the framework's root class
  // the default's outermost element carries; a value of a fixed prop counts as drawn only in another instance
  const top = Object.entries(found).sort(([a], [b]) => a.split('/').length - b.split('/').length)[0];
  const rootCls = top && rootRe ? top[1].node.classes.filter((c) => rootRe.test(c)) : [];
  const instanceOf = (node, all) => { const by = new Map(all.map((n) => [n.index, n])); const hit = [node, ...node.ancestors.map((i) => by.get(i))].find((n) => n && n.classes.some((c) => rootCls.includes(c))); return hit ? hit.path : null; };
  const home = top ? instanceOf(top[1].node, nodes) : null;
  {
    for (const when of tries) {
      const at2 = expand(contract, when);
      // still unpaired: not found, not the same element under the name a swap gives it (circleAlert, circleX…)
      const known = (id) => id in found || `${id}@space` in found || Object.keys(found).some((k) => elementIn({ [id]: true }, k.split('@')[0]) === id);
      // a part inside an instance is that component's, as everywhere else in the run
      const open = Object.keys(at2).filter((id) => !known(id) && !insideAudited(id, at2, audited) && !(id in at && JSON.stringify(at[id]) === JSON.stringify(at2[id])));
      const fixedMoved = Object.entries(map.props || {}).filter(([k, f]) => f && typeof f === 'object' && 'fixed' in f && when[k] !== f.fixed).map(([k]) => k);
      if (!open.length) continue;
      const { args: a2 } = argsFor(when, map);
      await show(map.story, a2, map);
      const nodes2 = await call(tab, collect, 'body');
      if (!nodes2) continue;
      const sub = Object.fromEntries(Object.entries(at2).filter(([id]) => open.includes(id) || id.split('/').length === 1 || open.some((o) => o.startsWith(`${id}/`))));
      const more = pairElements(sub, nodes2, (id, f) => expected(at2[id], f, value, textStyle, effectOf), judge, shadowAsKey, { value, instance });
      for (const [id, x] of Object.entries(more)) if (open.includes(id.split('@')[0]) && !(id in found)) {
        // away from the defaults only an element that shows its values counts: by shape alone it lands on whatever is near (a logo mask on the next avatar)
        if (x.by && x.by !== 'values') continue;
        if (fixedMoved.length) { const i = instanceOf(x.node, nodes2); if (!i || i === home) continue; }
        found[id] = x; x.nodes = nodes2;
        for (const k of fixedMoved) (drawn[k] = drawn[k] || new Set()).add(when[k]);
      }
    }
  }
  // outermost first: the first element is where a pointer state is forced
  const auto = Object.fromEntries(Object.entries(found).sort(([a], [b]) => a.split('/').length - b.split('/').length).map(([k, x]) => [k, { selector: selectorFor(x.node, x.nodes || nodes, 'body'), fields: x.fields }]));
  const paired = Object.fromEntries(Object.entries(found).map(([k, x]) => [k, x.by || 'values']));
  const rulings = ignoreRulings ? {} : map.elements || {};
  // what a ruling leaves out of the comparison, said: the fields the rule would have compared and the
  // ruling does not, with the ruling's reason; a skipped element, all of them
  const { fieldsFor } = await import('./pair.mjs');
  const notCompared = [];
  for (const [k, r] of Object.entries(rulings)) {
    const ruled = new Set(r.skip ? [] : r.fields || []);
    // what the element itself defines, whether or not the rule found it
    const dropped = fieldsFor(at[k.split('@')[0]], value).filter((f) => !ruled.has(f) && !(f === 'color' && ruled.has('background')));
    if (dropped.length || r.skip) notCompared.push({ element: k.split('@')[0], fields: dropped, why: r.skip || r.why || 'a ruling in the parity map' });
  }
  // and what nothing compares because no element in the story shows half of what it defines
  for (const id of Object.keys(at)) {
    if (rulings[id] || inInstance(id)) continue;
    const covered = new Set([...(auto[id] ? auto[id].fields : []), ...(auto[`${id}@space`] ? auto[`${id}@space`].fields : [])]);
    // a box measured as a shape (its colour read from its fill) covers its colour
    if (covered.has('background')) covered.add('color');
    const left = fieldsFor(at[id], value).filter((f) => !covered.has(f));
    if (left.length) notCompared.push({ element: id, fields: left, why: 'no element in the story shows half of what it defines' });
  }
  // a ruling on an element is on the whole of it: its spacing half placed apart (root@space) goes with it
  for (const k of Object.keys(rulings)) { paired[k] = rulings[k].skip ? 'skipped' : 'map'; if (!k.includes('@')) { delete auto[`${k}@space`]; delete paired[`${k}@space`]; } }
  return { elements: Object.fromEntries(Object.entries({ ...auto, ...rulings }).filter(([, e]) => !e.skip)), paired, notCompared, drawn: Object.fromEntries(Object.entries(drawn).map(([k, x]) => [k, [...x]])) };
}

/* A built Storybook's stories: each id, and the one story a component's name
   finds, keyed without case or punctuation ("App header" is the story
   AppHeader, "Table - Toolbar" TableToolbar), its playground where it has one. */
export function storyIndex(out) {
  const stories = new Map(), storyIds = new Set();
  for (const e of Object.values(JSON.parse(fs.readFileSync(path.join(out, 'index.json'), 'utf8')).entries || {})) {
    if (e.type !== 'story') continue;
    storyIds.add(e.id);
    const t = storyKey(e.title.split('/').pop());
    if (!stories.has(t) || /playground/.test(e.id)) stories.set(t, stories.get(t) && !/playground/.test(e.id) ? stories.get(t) : e.id);
  }
  return { stories, storyIds };
}

/* A property's value as the cascade chose it, from Chrome's matched styles
   (specificity, @media, unlayered over layered, !important and inline as
   Chrome orders them), in px; null where it is not a px length. Not handled:
   !important across @layers, where the cascade reverses layer order. */
export async function authoredWidth(tab, selector, property) {
  const { root } = await tab.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await tab.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) return null;
  const r = await tab.send('CSS.getMatchedStylesForNode', { nodeId });
  return winning([...(r.matchedCSSRules || []).map((x) => x.rule.style), ...(r.inlineStyle ? [r.inlineStyle] : [])], property);
}

/* The custom properties a property's value was written with, outermost first
   (`var(--button-bg)` whose own value is `var(--color-primary)`): what the
   code meant, where two tokens hold the value it computes to. Empty where it
   was written as a value. Read from the element's matched styles and those
   it inherits, nearest first, as a custom property inherits. */
export async function authoredVars(tab, selector, property) {
  const { root } = await tab.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await tab.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) return [];
  const r = await tab.send('CSS.getMatchedStylesForNode', { nodeId });
  const own = [...(r.matchedCSSRules || []).map((x) => x.rule.style), ...(r.inlineStyle ? [r.inlineStyle] : [])];
  const inherited = (r.inherited || []).map((x) => [...(x.matchedCSSRules || []).map((m) => m.rule.style), ...(x.inlineStyle ? [x.inlineStyle] : [])]);
  return varChain([own, ...inherited], property);
}

/* varChain, with nothing opened: `levels` are the styles of the element and
   then of each ancestor, each listed lowest precedence first. Tested by test-external.mjs. */
export function varChain(levels, property) {
  const first = (name) => { for (const styles of levels) { const v = winning(styles, name, { raw: true }); if (v != null) return v; } return null; };
  const names = [];
  let v = winning(levels[0] || [], property, { raw: true });
  for (let hop = 0; v && hop < 8; hop++) {
    const m = /^\s*var\(\s*(--[\w-]+)/.exec(v);
    if (!m || names.includes(m[1])) break;
    names.push(m[1]);
    v = first(m[1]);
  }
  return names;
}

/* The winning declaration of a property among styles listed lowest precedence
   first (as Chrome lists matched rules, inline last): the last !important, else
   the last; in px, or as written with `raw`. */
export function winning(styles, property, { raw = false } = {}) {
  let normal = null, important = null;
  for (const st of styles) for (const p of st.cssProperties || []) {
    if (p.name !== property || p.disabled || p.parsedOk === false || p.value == null) continue;
    const value = String(p.value).replace(/\s*!important\s*$/, '');
    if (p.important || /!important/.test(p.value)) important = value; else normal = value;
  }
  const v = important ?? normal;
  if (raw) return v;
  return v && /^-?[\d.]+px$/.test(v.trim()) ? +parseFloat(v) : null;
}

/* A project's code library, opened: the library built elsewhere that its
   context document's `code.parity` describes (tools/parity/project.mjs
   loadParity), each mapping read into the contract's ids (contractEntry),
   the tokens, and their Storybook built and served by the engine's one
   session (session.mjs: built once per change to its inputs, into the
   project's home, where the docs site serves it as the component pages'
   previews), loaded in a browser tab. The code audit and the contract from
   code (tools/component-contract/from-code.mjs) both start here. */
export async function openLibrary(label, { rebuild = false } = {}) {
  const { valueOf } = req('../snapshot/tokens.cjs');
  const { bridge } = req('../component-contract/derive.cjs');
  const { loadParity } = await import('./project.mjs');
  const { session } = await import('./session.mjs');
  const fail = (m) => { const e = new Error(m); e.usage = true; throw e; };
  let project;
  try { project = await loadParity(label); } catch (e) { fail(e.message); }
  if (project.mode !== 'compared') fail(`${label}: its code follows the design and is governed by tools/parity/run.mjs, not compared`);
  const { where, lib, repo } = project;
  const ctx = req('../snapshot/projects.cjs').auditContext(where.doc);
  const P = project.parity;
  const components = {};
  for (const t of project.targets) {
    try { components[t.folder] = contractEntry(t.mapping, bridge(t.spec)); } catch (e) { fail(`${label}: ${t.folder}'s mapping: ${e.message}`); }
  }
  // the shape the audit reads: the mappings in contract ids, the one tier as Figma's mode, the token
  // files, and the framework's root-class pattern (audit-defaults frameworks), where the library names one
  const map = { components, mode: P.tiers[0], tokens: P.tokens, ...(lib.frameworkProfile.instance && { rootClass: lib.frameworkProfile.instance }) };
  const tokens = project.snapshot;
  const value = (t) => (typeof t === 'string' ? valueOf(tokens, t, map.mode) ?? t : t);
  const textStyle = (name) => (tokens.textStyles || []).find((s) => s.name === name);
  const effectOf = (name) => (tokens.effects || []).find((e) => e.name === name);
  const out = project.storybookOut;
  if (rebuild) fs.rmSync(path.join(out, '.parity-hash'), { force: true });
  let S;
  try { S = await session(project, { app: false }); } catch (e) { fail(`${label}: ${e.message.split('\n')[0]}, so the audit and the docs site keep the last good run`); }
  const tab = await S.acquire();
  // the project's parity folder, beside its audit and site: parity's own, not the design audit's
  const show = (story, args, m) => showStory(S.PAGE, tab, story, args, m, map.mode);
  return { where, ctx, lib, libKey: project.libKey, repo, dir: where.parity, map, tokens, value, textStyle, effectOf, out, page: S.PAGE, show, tab, valueOf, close: () => S.close() };
}

async function main() {
  // stopped (the watcher's close, a Ctrl-C): exit through process.exit, whose 'exit' closes Chrome (cdp.mjs)
  for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => process.exit(130));
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const label = opt('--project');
  const rebuild = argv.includes('--rebuild'); if (rebuild) argv.splice(argv.indexOf('--rebuild'), 1);
  // drafts are a rule's guess at the mapping (draftEntry), to start a person's mapping from, not findings
  const drafting = argv.includes('--draft'); if (drafting) argv.splice(argv.indexOf('--draft'), 1);
  // --auto-pair: every element paired by rule, the map's own ignored (to measure the rule against it)
  const autoPair = argv.includes('--auto-pair'); if (autoPair) argv.splice(argv.indexOf('--auto-pair'), 1);
  if (!label) { console.error('usage: external.mjs --project <label> [component …] [--rebuild]'); process.exit(2); }
  const { expand } = req('../component-contract/derive.cjs');
  const { valueOf } = req('../snapshot/tokens.cjs');
  const { navigate, forceState, call, waitFor } = await import('../shared/cdp.mjs');

  let opened;
  try { opened = await openLibrary(label, { rebuild }); } catch (e) { if (!e.usage) throw e; console.error(e.message); process.exit(2); }
  const { where, ctx, lib, libKey, repo, dir, map, tokens, value, textStyle, effectOf, out, page, show, tab } = opened;
  fs.mkdirSync(dir, { recursive: true });

  // the library's tokens by value, and how often its contracts name each, for naming what code drew
  const { designTokenFor, usageIn, tokenTable: tableOf, offerFor } = await import('../component-contract/from-code.mjs');
  const tokenTable = tableOf(tokens, map.mode);
  // the official contracts (component-contract's official.mjs): Figma's readings, or the project's own
  const { contracts: officialContracts } = await import('../component-contract/official.mjs');
  const official = new Map(officialContracts(where).map((x) => [x.folder, x.contract]));
  const allContracts = [...official.values()];
  const tokenUsage = usageIn(allContracts);
  const offered = offerFor(allContracts);

  // every component of the library that states this code, that its framework names and their Storybook has a
  // story for: mapped by a person where the map has it, drafted by rule (draftEntry) where not
  const index = JSON.parse(fs.readFileSync(where.paths.index, 'utf8'));
  const { stories, storyIds } = storyIndex(out);
  const ours = Object.entries(index.components || {}).filter(([, e]) => e.file === libKey).map(([d]) => d);
  // the story under the component's framework name, else under its own (a library's own component, App header: AppHeader;
  // a set on a page of its own by its last segment, "Accordion/🚧 Accordion": Accordion)
  const storyFor = (d) => { const name = index.components[d].name; const mui = (lib.frameworkComponents || {})[name]; return (mui && stories.get(storyKey(mui))) || stories.get(componentKey(name)) || null; };
  const wanted = argv.length ? argv : [...new Set([...Object.keys(map.components), ...(drafting ? ours.filter(storyFor) : [])])];
  // the components measured on their own, by their Figma name: a part of one of them inside another is left to its own audit
  const lastRun = fs.existsSync(path.join(dir, 'report.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8')) : null;
  const audited = new Set(Object.keys(map.components).filter((k) => index.components[k] && !(lastRun?.components[k]?.error)).map((k) => index.components[k].name));
  // a run of some components replaces theirs and keeps the rest of the last report
  const last = fs.existsSync(path.join(dir, 'report.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8')) : null;
  // the framework the code is built on, by the name a reader knows it (its profile's), for the pages that name it
  const report = { at: new Date().toISOString(), project: label, repo: lib.code.repo, ...(lib.frameworkProfile.name && { framework: lib.frameworkProfile.name }), components: { ...(argv.length && last && last.components) } };
  // what a component's result depends on, hashed: its contract, its map entry, their built Storybook, the
  // tokens and the engine itself; unchanged, the last result stands and nothing is rendered (--rebuild redoes all)
  const { createHash } = await import('node:crypto');
  const sha = (...xs) => createHash('sha1').update(xs.join('\0')).digest('hex').slice(0, 16);
  const engine = sha(...['external.mjs', 'pair.mjs', 'probe.mjs', 'values.mjs', 'project.mjs', 'session.mjs', 'hosts.mjs', '../shared/cdp.mjs', '../shared/names.js', '../shared/colour.js', '../component-contract/derive.cjs', '../component-contract/layers.mjs', '../component-contract/from-code.mjs', '../component-contract/official.mjs', '../snapshot/tokens.cjs', '../snapshot/projects.cjs', '../snapshot/store.cjs'].map((f) => fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), f), 'utf8')));
  // every contract (they name the tokens a code value is matched to), the code's installed packages
  // (a library upgrade moves neither the build stamp nor its sources), the mode, and how the run pairs
  const contracts = sha(...allContracts.map((c) => JSON.stringify(c)));
  const lock = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'].map((f) => path.join(repo, f)).filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f)).join('');
  const shared = sha(engine, fs.readFileSync(path.join(out, '.parity-hash'), 'utf8'), fs.readFileSync(where.paths.tokens, 'utf8'), contracts, sha(lock), map.mode, String(autoPair), JSON.stringify(lib.frameworkComponents || {}), [...audited].sort().join('|'));
  let reused = 0;
  const t0 = Date.now();
  try {
    for (const name of wanted) {
      let m = map.components[name];
      const story = m ? m.story : index.components[name] && storyFor(name);
      if (!story) { report.components[name] = { error: 'not in the map, and no story found for it' }; continue; }
      // a story the code renamed fails its component, not the run: TextField → TextInput stopped every component
      if (!storyIds.has(story)) { report.components[name] = { error: `story ${story} is not in their Storybook: renamed or removed, so the map needs its new id` }; continue; }
      const c = official.get(name);
      if (!c) { report.components[name] = { error: 'no contract: snapshot the library first' }; continue; }
      const inputs = sha(shared, JSON.stringify(c), JSON.stringify(m || null), story, String(drafting));
      if (!rebuild && last && last.components[name] && last.components[name].inputs === inputs) { report.components[name] = last.components[name]; reused++; continue; }
      const rows = [], seen = {};
      // the code's props, as the story declares them: options, and a default only where
      // the component declares one (a story's own starting args are the story's choice)
      let argTypes;
      try { await show(story, {}, null); argTypes = (await page.api(tab)).argTypes; }
      catch (e) { report.components[name] = { story, error: e.message.split('\n')[0] }; continue; }
      if (!m) m = draftEntry(c, argTypes, story);
      const side = propsSide(repo, lib, c, m, argTypes);
      const { own, api } = side;
      m = side.map;
      // a story the host cannot draw as asked fails its component, never the run
      let placed;
      try { placed = await pairedElements(tab, show, c, m, value, textStyle, autoPair, effectOf, audited, lib.frameworkProfile.instance || null); }
      catch (e) { report.components[name] = { story, error: e.message.split('\n')[0] }; continue; }
      const paired = placed.paired, notCompared = placed.notCompared;
      m = { ...m, elements: placed.elements, props: Object.fromEntries(Object.entries(m.props || {}).map(([k, x]) => [k, placed.drawn[k] ? { ...x, drawn: placed.drawn[k] } : x])) };
      if (!Object.keys(m.elements).length) {
        // a contract with nothing to compare is not a pairing that failed: an icon container's one value is its icon's fixed size
        const { fieldsFor } = await import('./pair.mjs');
        const any = Object.values(Object.assign({}, c.anatomy, ...(c.variants || []).map((v) => v.add || {}))).some((e) => fieldsFor(e, value).length);
        report.components[name] = { story, error: any ? 'no element of the contract could be found in the story' : 'the contract defines nothing the audit compares (a fixed size is not compared)' };
        continue;
      }
      const show1 = async (when) => {
        const { args, pseudo } = argsFor(when, m);
        await show(m.story, args, m);
        const first = Object.values(m.elements)[0].selector;
        await waitFor(tab, `!!document.querySelector(${JSON.stringify(first)})`, { timeout: 15000 });
        if (pseudo) await forceState(tab, [{ selector: m.elements[m.pseudoOn || Object.keys(m.elements)[0]].selector, pseudo }]);
        // measured once its transitions have run (a framework's may take 150ms), and a colour read halfway is neither
        await waitFor(tab, 'document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity)', { timeout: 3000 }).catch(() => {});
      };
      const combos = combinations(c, m, 200);
      // the props are compared from the story's declarations, drawn or not: a prop the code renamed is what a refusal is most often
      const props = compareProps(c, m, side.code, side.framework, side.fw);
      try { await show1(combos[0]); } catch (e) { report.components[name] = { draft: !!m.draft, story, error: e.refused ? e.message : `the story did not draw ${Object.values(m.elements)[0].selector}: ${e.message}`, ...(e.refused && !m.draft && { props }) }; continue; }
      const refused = {};
      for (const when of combos) {
        // a combination the story cannot draw (its first element never appears) is every element missing there,
        // which the mapping check reports; the run goes on to the next
        try { await show1(when); } catch (e) {
          if (e.refused) { const why = e.message.split('\n')[0]; refused[why] = (refused[why] || 0) + 1; continue; }
          const anatomy = expand(c, when);
          for (const id of Object.keys(m.elements)) { if (!elementIn(anatomy, id.split('@')[0])) continue; const st = (seen[id] = seen[id] || { total: 0, missing: 0, invisible: 0 }); st.total++; st.missing++; }
          continue;
        }
        // read through the parity engine's one probe, as the governed run reads: what this audit compares is derived from it
        const got = await readElements(tab, m.elements);
        // Chrome floors a computed border to whole pixels at any scale (1.5px reads 1px): where one
        // is whole, the width the cascade chose, as Chrome's own matched styles give it
        for (const [id, e] of Object.entries(m.elements)) {
          const g = got[id];
          if (!g || !g['border-width'] || g['border-as'] || !Number.isInteger(g['border-width'])) continue;
          const w = await authoredWidth(tab, e.selector, 'border-top-width');
          if (w != null && Math.floor(w) === g['border-width']) g['border-width'] = w;
        }
        const anatomy = expand(c, when);
        // only where the design draws the element: Chip's icon is absent with the icon off, on both sides
        // a key may name half of an element (root@space: its spacing, placed apart from its paint by pairElements())
        const base = (k) => k.split('@')[0];
        for (const id of Object.keys(m.elements)) { if (!elementIn(anatomy, base(id))) continue; const s = (seen[id] = seen[id] || { total: 0, missing: 0, invisible: 0 }); s.total++; if (!got[id]) s.missing++; else if (!got[id].__size) s.invisible++; }
        for (const [id, e] of Object.entries(m.elements)) {
          for (const [field, x] of Object.entries(expected(anatomy[elementIn(anatomy, base(id))], e.fields, value, textStyle, effectOf))) {
            // a border code does not draw has no colour to compare: its width already says so
            if (field === 'border-color' && got[id] && got[id]['border-width'] === 0) continue;
            let g = got[id] ? got[id][field] : null;
            if (field === 'shadow') g = g ? shadowKey(cssShadows(g)) : 'none';
            const under = got[id] && (field === 'background' ? got[id].under : got[id].background && parseColour(got[id].background)?.[3] ? got[id].background : got[id].under);
            let verdict = got[id] == null ? 'differs' : judge(x.want, g, under);
            // a border the design does not draw, which code draws in a colour that over its own fill shows as that fill
            if (field === 'border-width' && verdict === 'differs' && x.want === 0 && invisibleBorder(got[id])) verdict = 'looks-same';
            rows.push({ when, element: base(id), field, want: x.want, got: g, token: x.token, verdict });
          }
        }
      }
      // combinations the story refused were never measured: the mapping is not to be trusted until it says how to draw them
      const suspect = [...suspectMappings(rows, seen), ...Object.entries(refused).map(([why, n]) => `${n} of ${combos.length} combinations the story refused: ${why}`)];
      // what no combination the run renders compares: every element the design defines, in any variant,
      // that no measured element covers (a layer shown only by a prop the map holds fixed, Button's icons),
      // and the prop values the map skips (State loading)
      {
        const { fieldsFor } = await import('./pair.mjs');
        const defined = Object.assign({}, c.anatomy, ...(c.variants || []).map((v) => v.add || {}));
        const measured = Object.keys(m.elements).map((k) => k.split('@')[0]);
        const listed = new Set(notCompared.map((x) => x.element));
        // a part inside an instance is that component's, compared in its own audit (a FAB menu's buttons)
        const nested = (id) => insideAudited(id, defined, audited);
        for (const [id, e] of Object.entries(defined)) {
          const fields = fieldsFor(e, value);
          if (!fields.length || nested(id) || listed.has(id) || measured.some((k) => k === id || elementIn({ [id]: true }, k) === id)) continue;
          // say which prop values draw it, so the gap reads as a story to add, not a fault
          const by = (c.variants || []).find((v) => v.add && id in v.add);
          const shows = by && Object.entries(by.when).map(([k, v]) => `${k} ${v}`).join(', ');
          // rendered, and still nothing there shows its values: a pairing gap, not a missing story
          const rendered = by && rows.some((r) => Object.entries(by.when).every(([k, v]) => String(r.when[k]) === String(v)));
          notCompared.push({ element: id, fields, why: rendered ? `no element shows half of what it defines where it is drawn (${shows})` : shows ? `drawn only with ${shows}, which the story does not render` : 'not drawn in any combination the run renders' });
        }
        for (const [k, mp] of Object.entries(m.props || {})) if (mp && typeof mp === 'object' && (mp.skip || []).length) notCompared.push({ element: k, fields: mp.skip, why: 'values the parity map skips' });
      }
      const groups = group(rows, req('../component-contract/derive.cjs').variantDefaults(c));
      // the token that holds what code drew, matched by value as the contract from code matches it: code's
      // own token names are gone by the time it renders, so this is the library token with that value, not
      // necessarily the one the code named; several holding it are all listed
      for (const g of groups) {
        // a graphic's colour is an icon colour (an svg is drawn in the current text colour, so code reads it as color)
        const el = c.anatomy[elementIn(c.anatomy, g.element)] || {};
        const kinds = g.field === 'color' && el.kind === 'graphic' ? ['icon'] : FIELD_KIND[g.field] || (/^padding|^gap$/.test(g.field) ? ['space'] : []);
        // looked up and none found is said (an empty list), never left looking like a value nobody checked;
        // each combination's own too, for the dialog
        const named = (got) => { for (const kind of kinds) { const t = designTokenFor(kind, got, tokenTable, tokenUsage, null, null, offered); if (t.token) return [t.token, ...(t.tie || [])]; } return []; };
        // a width of 0 is no border at all: nothing to name
        g.gotTokens = g.field === 'border-width' && g.seen[0].got === 0 ? undefined : kinds.length ? named(g.seen[0].got) : null;
        if (kinds.length) for (const x of g.seen) { const t = named(x.got); if (t.length) x.gotToken = t[0]; }
        // a text style is several values: where the element's others all match the design's style wherever
        // this one differs, code draws that style with this one value of its own
        if (TYPE_FIELDS.includes(g.field) && g.token) {
          const at = new Set(g.seen.map((x) => JSON.stringify(x.when)));
          const others = rows.filter((r) => r.element === g.element && r.field !== g.field && TYPE_FIELDS.includes(r.field) && at.has(JSON.stringify(r.when)));
          if (others.length && others.every((r) => r.verdict !== 'differs')) g.gotStyle = g.token;
        }
      }
      const differs = rows.filter((r) => r.verdict === 'differs').length;
      // what was checked, element and field, with how many combinations and the tokens the design names
      const checked = Object.values(rows.reduce((acc, r) => { const k = `${r.element}|${r.field}`; const x = (acc[k] = acc[k] || { element: r.element, field: r.field, of: 0, same: 0, tokens: [] }); x.of++; if (r.verdict !== 'differs') x.same++; if (r.token && !x.tokens.includes(r.token)) x.tokens.push(r.token); return acc; }, {}));
      report.components[name] = { inputs, ...(suspect.length && { suspect }), ...(paired && { paired }), ...(notCompared.length && { notCompared }), ...(own && !Object.keys(api).length && { api: `no props type found for ${own}: its props are what its story declares` }), ...(m.draft && { draft: true, map: m }), ...(m.note && { note: m.note }), codeComponent: own || null, figma: c.component, framework: (lib.frameworkComponents || {})[c.component] ?? null, props, story: m.story, combinations: new Set(rows.map((r) => JSON.stringify(r.when))).size, assertions: rows.length, differs, looksSame: rows.filter((r) => r.verdict === 'looks-same').length, groups, checked,
        // each prop's default, so a reader is shown only what a combination changes
        defaults: req('../component-contract/derive.cjs').variantDefaults(c) };
      console.log(`${name}: ${rows.length} assertions, ${differs} differ${groups.filter((g) => g.verdict === 'differs').length ? ` in ${groups.filter((g) => g.verdict === 'differs').length} group(s)` : ''}`);
    }
  } finally {
    opened.close();
  }
  // the tokens, where the map says which files hold them
  if (map.tokens) {
    const { ours, theirs } = await tokenSides(tokens, repo, map.tokens, valueOf);
    report.tokens = compareTokens(ours, theirs);
    console.log(`tokens: ${Object.entries(report.tokens).map(([g, x]) => `${g} ${x.checked} checked, ${x.differs} differ, ${x.missing} missing in code, ${x.onlyInCode} only in code`).join('; ')}`);
  }
  report.seconds = Math.round((Date.now() - t0) / 1000);
  // the same code reads back to the same file: a run that found nothing new leaves it as it was
  writeReport(path.join(dir, 'report.json'), report);
  console.log(`code audit: ${path.join(dir, "report.json")}, ${report.seconds}s${reused ? `, ${reused} unchanged and not re-run` : ""}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) await main();
