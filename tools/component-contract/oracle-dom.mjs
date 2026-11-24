#!/usr/bin/env node
/*
 * The round trip's phase 2 (contract → code) held to an outside oracle: the generated code (to-markup's web component
 * and to-code's sheet, on site.mjs's own page) rendered in headless Chrome at every combination the contract expands
 * to, read by a reader of this file's own and held to expand(contract, props). It never calls from-code, and the
 * reader is given no design input: it reads the DOM's boxes and computed styles, and the contract side is resolved
 * from the snapshot's tokens, never from the generator's CSS names.
 *
 *   node tools/component-contract/oracle-dom.mjs --project <label> [--panel] [components…] [--max <n>] [--pixels [--pixels-max <n>] [--images <dir>]] [--out <file>]
 *
 * Parts are found by the generator's own part attribute (`data-part`, to-code's partSeg; inside a placed component,
 * that component's own), never by a design id. Per part and combination it reads the box (x, y, w, h from the root's),
 * padding, gap, direction, radius, fills, strokes (a border, an inset shadow or an outline), text style and colour,
 * opacity and whether it is drawn, and compares each with what the contract says there, a number within geometry.mjs's
 * TOLERANCE by parity's `near`, a colour per channel (0..1) within the same. Rows are
 * `{ at: '<combination>/<part>.<field>', contract, drawn, kind }`. A component "matches the contract" only with no row,
 * nothing unread, no part skipped (one with no element to find) and every combination read (`matches`).
 * What this reader does not compare (a gradient, several fills, a shadow, a paint style, a fill or hug size) is
 * counted per component as `unread`, never a row. `--pixels` also renders each stored variant and compares it with
 * Figma's own PNG of that variant (REST /v1/images, the token as tools/snapshot/version.cjs finds it) by looks.mjs's
 * comparison; reported apart, never a row.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { expand, variantDefaults, camel } from './layers.mjs';
import { selfSiteFiles, serveSite } from './site.mjs';
import { partSeg, entryOf } from './to-code.mjs';
import { propsOf } from './to-markup.mjs';
import { TOLERANCE } from './geometry.mjs';
import { near } from '../parity/schema.mjs';
import { launch, newPage, attach, navigate, call, waitFor, media, forceState, screenshot } from '../shared/cdp.mjs';

const req = createRequire(import.meta.url);

/* ---------- the contract's side ---------- */

const WEIGHTS = { thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400, normal: 400, book: 400, roman: 400, medium: 500, semibold: 600, demibold: 600, bold: 700, extrabold: 800, ultrabold: 800, heavy: 800, black: 900 };
const weightOf = (w) => (typeof w === 'number' ? w : /^\d+$/.test(String(w)) ? +w : WEIGHTS[String(w || '').toLowerCase().replace(/[\s_-]|italic/g, '')] ?? null);
const SIDES = ['top', 'end', 'bottom', 'start'];
const COLOUR = /^(#|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color\(|transparent$)/i;

/* Each prop a layer is chosen by (a variant's or a conditional part's), across its values, less the invalid. */
export function combosOf(c) {
  const keys = [...new Set([...(c.variants || []).flatMap((v) => Object.keys(v.when || {})), ...Object.values(c.when || {}).flatMap((w) => Object.keys(w))])].filter((k) => c.props && c.props[k]);
  const values = (k) => { const p = c.props[k]; return p.type === 'boolean' ? [false, true] : p.values || [p.default]; };
  const bad = (m) => (c.invalid || []).some((w) => Object.entries(w).every(([k, v]) => m[k] === v));
  return keys.reduce((acc, k) => acc.flatMap((m) => values(k).map((v) => ({ ...m, [k]: v }))), [{}]).filter((m) => !bad(m));
}

/* A token's value under the modes a part sits in: per collection, the mode its axis is set to, else its first. */
export function resolver(tokens) {
  const { axesOf } = req('../tokens/modes.cjs');
  const { pathFor } = req('../tokens/dtcg.js');
  const slug = (s) => pathFor(String(s), '')[0];
  const cols = Object.entries((tokens && tokens.collections) || {}).map(([name, e]) => ({ name, modes: e.modes || [], values: e.values || {} }));
  let axes = [];
  try { axes = axesOf(cols.map(({ name, modes }) => ({ name, modes }))); } catch { /* no axes */ }
  const value = (name, modes = {}) => {
    for (const col of cols) {
      const axis = axes.find((a) => (a.names || []).includes(col.name));
      const want = axis && modes[axis.key];
      const m = (want && col.modes.find((x) => slug(x) === want)) || col.modes[0];
      const vals = col.values[m] || {};
      if (Object.hasOwn(vals, name)) return vals[name];
    }
    return undefined;
  };
  // (the same token in each of its collection's modes, by mode: a row whose drawn value is one of these is the page's
  // base mode, not the part's)
  value.modes = (name) => { for (const col of cols) if (col.modes.some((m) => Object.hasOwn(col.values[m] || {}, name))) return Object.fromEntries(col.modes.map((m) => [m, (col.values[m] || {})[name]])); return {}; };
  return value;
}

/* A text style as CSS reads it: size, line height and letter spacing in px, weight as a number, the first family. */
export function textStyleOf(tokens, name, value = null, modes = {}) {
  const lit = /^literal (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?|normal) (\d+)(?: italic)? (.+)$/.exec(name || '');
  if (lit) return { size: +lit[1], lineHeight: lit[2] === 'normal' ? null : +lit[2], weight: +lit[3], family: lit[4].replace(/^["']|["']$/g, ''), letterSpacing: null };
  const s = ((tokens && tokens.textStyles) || []).find((x) => x.name === name);
  if (!s) return null;
  const a = s.authored || {};
  const lh = a.lineHeight ? (a.lineHeight.unit === 'PIXELS' ? a.lineHeight.value : a.lineHeight.unit === 'PERCENT' ? (s.size * a.lineHeight.value) / 100 : null)
    : typeof s.lineHeight === 'number' ? (s.lineHeight < 4 ? s.lineHeight * s.size : s.lineHeight) : null;
  const ls = a.letterSpacing ? (a.letterSpacing.unit === 'PIXELS' ? a.letterSpacing.value : (s.size * a.letterSpacing.value) / 100) : typeof s.letterSpacing === 'number' ? s.letterSpacing * s.size : null;
  // (a field a variable is bound to draws that variable's value at the part's modes, as Figma draws it)
  const bound = (f) => { const b = s.bound && s.bound[f]; return b && value ? value(b.name, modes) : undefined; };
  const bw = bound('fontWeight'), bf = bound('fontFamily'), bs = bound('fontSize'), bl = bound('lineHeight'), bls = bound('letterSpacing');
  return { size: typeof bs === 'number' ? bs : s.size, lineHeight: typeof bl === 'number' ? bl : lh, weight: bw !== undefined ? weightOf(bw) : weightOf(s.weight), family: typeof bf === 'string' ? bf : s.family, letterSpacing: typeof bls === 'number' ? bls : ls, bound: Object.fromEntries(['fontWeight', 'fontFamily', 'fontSize', 'lineHeight', 'letterSpacing'].filter((f) => s.bound && s.bound[f]).map((f) => [f, s.bound[f].name])) };
}

/* What the contract says of each part at one combination, resolved to numbers and colour strings: { id: { field: value } },
   and what it says that this oracle does not compare, by field (`unread`). */
export function expected(c, combo, { value, tokens }) {
  const drawn = expand(c, { ...variantDefaults(c), ...combo });
  const out = {}, unread = {};
  const skip = (f) => { unread[f] = (unread[f] || 0) + 1; };
  const modesAt = (id) => { const chain = []; for (let x = id; x && drawn[x]; x = drawn[x].parent) chain.unshift(drawn[x].modes || {}); return Object.assign({}, ...chain); };
  for (const [id, e] of Object.entries(drawn)) {
    const modes = modesAt(id);
    const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' ? (typeof value(v, modes) === 'number' ? value(v, modes) : undefined) : undefined);
    const col = (v) => (typeof v !== 'string' ? undefined : COLOUR.test(v) ? v : typeof value(v, modes) === 'string' ? value(v, modes) : undefined);
    const x = { kind: e.kind, parent: e.parent || null, tokens: {}, modes };
    const tok = (f, v) => { if (typeof v === 'string' && !COLOUR.test(v)) x.tokens[f] = v; };
    if (e.layout && e.kind !== 'text') {
      x.direction = e.layout.direction === 'column' ? 'column' : 'row';
      const g = num(e.layout.gap);
      if (e.layout.align !== 'space-between' && g !== undefined && g >= 0) x.gap = g; else if (e.layout.gap !== undefined) skip('gap');
      const p = e.layout.padding || {};
      for (const s of SIDES) { const v = num(p[s] ?? 0); if (v !== undefined) x[`padding.${s}`] = v; else skip('padding'); }
    }
    // (a size the contract says as hug or fill is what it resolves to in Figma: held to the stored figma.json box)
    for (const f of ['width', 'height']) { if (typeof e[f] === 'number') x[f] = e[f]; else if (e[f] === 'hug' || e[f] === 'fill') x[f === 'width' ? 'storedW' : 'storedH'] = true; else if (typeof e[f] === 'string') { const v = num(e[f]); if (v !== undefined) x[f] = v; else skip(f); } }
    // a point out of the flow, held as its constraint holds it (Figma's): from the start (min), from the end (max), its
    // centre's offset (center), both edges (stretch); one that scales with its parent is a share this reader leaves
    if (e.absolute) {
      const a = e.absolute, con = e.constraints || {};
      for (const [axis, from, to, mid] of [['horizontal', 'x', 'end', 'cx'], ['vertical', 'y', 'bottom', 'cy']]) {
        const k = con[axis] || 'min', near0 = typeof a[from] === 'number', far = typeof a[to] === 'number';
        // (a place that scales with its parent is held to where Figma's stored box puts it)
        if (k === 'scale') { x.storedPlace = true; continue; }
        if ((k === 'min' || k === 'stretch') && near0) x[from] = a[from];
        if ((k === 'max' || k === 'stretch') && far) x[to] = a[to];
        if (k === 'center' && near0 && far) x[mid] = (a[from] - a[to]) / 2;
        if ((k === 'max' || k === 'center') && !far) skip(`place ${k} with no far edge`);
      }
    }
    if (e.radius !== undefined) {
      const r = Array.isArray(e.radius) ? e.radius.map(num) : [num(e.radius), num(e.radius), num(e.radius), num(e.radius)];
      if (r.every((v) => v !== undefined)) x.radius = r; else skip('radius');
    }
    tok('background', e.background); if (e.border) tok('strokeColour', e.border.color); tok('color', e.color);
    if (e.background !== undefined) { const v = col(e.background); if (v !== undefined) x.background = v; else skip(typeof e.background === 'object' ? (Array.isArray(e.background) ? 'background list' : 'background gradient') : 'background'); }
    if (e.border && e.border.color !== undefined) {
      const b = e.border, raw = Array.isArray(b.width) ? b.width : SIDES.map((s) => b.width ?? (b.sides && typeof b.sides[s] === 'number' ? b.sides[s] : 1));
      const widths = raw.map((w, i) => { const n = num(w); return n !== undefined ? n : b.sides && typeof b.sides[SIDES[i]] === 'number' ? b.sides[SIDES[i]] : undefined; });
      const on = SIDES.map((s, i) => (b.sides ? !!b.sides[s] : widths[i] !== 0) && widths[i] !== 0);
      const colour = col(b.color);
      if (colour === undefined || widths.some((w) => w === undefined)) skip('border');
      else { x.stroke = SIDES.map((_, i) => (on[i] ? widths[i] : 0)); x.strokeColour = colour; if (b.dash) skip('border dash'); }
    } else if (e.kind !== 'text' && e.kind !== 'instance') x.stroke = [0, 0, 0, 0];
    // (a line, no wide or no tall, stroked all round draws one line: a border on any one edge draws the same)
    if (x.stroke && (e.height === 0 || e.width === 0)) x.line = true;
    if (e.kind === 'text') {
      if (e.color !== undefined) { const v = col(e.color); if (v !== undefined) x.color = v; else skip('color'); }
      if (e.typography) {
        const t = textStyleOf(tokens, e.typography, value, modes);
        if (!t) skip('typography: no record'); else {
          x.fontSize = t.size; if (t.lineHeight != null) x.lineHeight = t.lineHeight; if (t.weight != null) x.fontWeight = t.weight;
          x.fontFamily = t.family; x.tokens = { ...(x.tokens || {}), ...t.bound }; const ls = typeof e.letterSpacing === 'number' ? e.letterSpacing : t.letterSpacing; if (ls != null) x.letterSpacing = ls;
        }
      }
    }
    // a paint style by its value, through the snapshot's styles: a text's colour, a box's fill, where nothing else says it
    if (e.fillStyle !== undefined) {
      const st = ((tokens && tokens.paintStyles) || []).find((y) => y.name === e.fillStyle);
      const paints = st && (st.paints || []).filter((q) => q.visible !== false);
      const v = paints && paints.length === 1 && paints[0].type === 'SOLID' ? col(paints[0].color) : undefined;
      if (!st) skip('paint style: no record');
      else if (v === undefined) skip('paint style not one solid colour');
      else if (e.kind === 'text') { if (x.color === undefined) { x.color = v; if (!COLOUR.test(paints[0].color)) x.tokens.color = paints[0].color; } }
      else if (x.background === undefined) { x.background = v; if (!COLOUR.test(paints[0].color)) x.tokens.background = paints[0].color; }
    }
    if (typeof e.opacity === 'number') x.opacity = e.opacity;
    if (e.shadow !== undefined) skip('shadow');
    out[id] = x;
  }
  return { parts: out, unread };
}

/* Each part's place in the markup: the `data-part` of every part above it and its own, as the generator names them
   (to-code's partSeg); below a placed component, by that component's own contract. A layer no element stands for
   (inside a placed component the library holds no contract for) is null. */
export function chainsOf(c, drawn, mainOf) {
  const memo = new Map();
  const chain = (id) => {
    if (memo.has(id)) return memo.get(id);
    let out = null;
    const segs = id.split('/');
    // the nearest placed component above it, among the drawn parts
    let at = null;
    for (let i = segs.length - 1; i > 0; i--) { const up = segs.slice(0, i).join('/'); if (drawn[up] && drawn[up].kind === 'instance') { at = up; break; } }
    if (!at) {
      const up = drawn[id] && drawn[id].parent && drawn[id].parent !== 'root' ? chain(drawn[id].parent) : [];
      out = up ? [...up, partSeg(c, id)] : null;
    } else {
      const main = mainOf(drawn[at].component, drawn[at].key), rel = id.slice(at.length + 1), base = chain(at);
      if (main && base) {
        // within the placed component, each of its own parts down to this one, as it names them
        const ids = rel.split('/').map((_, i, s) => s.slice(0, i + 1).join('/')).filter((k) => (main.anatomy || {})[k] || (main.variants || []).some((v) => (v.add || {})[k]));
        out = ids.length && ids[ids.length - 1] === rel ? [...base, ...ids.map((k) => partSeg(main, k))] : null;
      }
    }
    memo.set(id, out);
    return out;
  };
  return Object.fromEntries(Object.keys(drawn).filter((id) => id !== 'root').map((id) => [id, chain(id)]));
}

/* A stored variant's layers by contract id (derive's idOf: each name camel-cased, a repeat among its siblings
   numbered `_2`), each box from the variant's own origin. A layer a boolean shows carries its prop in its id and is
   not found here: its fields are unread, `no stored box`. */
export function boxesOf(variant) {
  const out = { root: { x: 0, y: 0, w: variant.w, h: variant.h } };
  const walk = (node, id, ox, oy) => {
    const seen = {};
    for (const k of node.children || []) {
      seen[k.name] = (seen[k.name] || 0) + 1;
      const seg = camel(k.name) + (seen[k.name] > 1 ? `_${seen[k.name]}` : ''), kid = id ? `${id}/${seg}` : seg;
      const x = ox + (k.x || 0), y = oy + (k.y || 0);
      if (!(kid in out)) out[kid] = { x, y, w: k.w, h: k.h };
      walk(k, kid, x, y);
    }
  };
  walk(variant, '', 0, 0);
  return out;
}

/* The stored variant a combination is: its axes as the variant's name says them, every other prop at its default;
   none where a prop no variant is chosen by is off its default (a boolean property flipped). */
export function variantOf(c, variants, combo) {
  const full = { ...variantDefaults(c), ...combo };
  for (const v of variants || []) {
    const named = comboOfVariant(c, v.name);
    if (Object.entries(full).every(([k, val]) => (k in named ? named[k] === val : val === (c.props[k] || {}).default))) return v;
  }
  return null;
}

/* ---------- the page's side: the reader, given nothing but the host's tag ---------- */

/* Runs in the page. Every element under the host that carries `data-part`, by its chain of `data-part`s, with its box
   from the root box's and its computed styles; colours normalised through a canvas, as are `colours`. */
export function readPage(tag, colours) {
  const host = document.querySelector(`#stage ${tag}`);
  if (!host) return { error: `no ${tag} on the page` };
  const cv = document.createElement('canvas').getContext('2d');
  const rgba = (s) => {
    if (!s || s === 'none') return null;
    cv.fillStyle = '#010203'; cv.fillStyle = s; const v = cv.fillStyle;
    if (v === '#010203' && !/^#010203$/i.test(s)) return null;
    if (v[0] === '#') return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).concat(1);
    const m = /rgba?\(([^)]+)\)/.exec(v); if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return [p[0] / 255, p[1] / 255, p[2] / 255, p[3] ?? 1];
  };
  // whether a family is on the machine: a sample set in it, falling back to two different generic families, measures alike
  const known = {};
  const fontHere = (list) => {
    const f = list.split(',')[0].trim();
    if (f in known) return known[f];
    if (/^(serif|sans-serif|monospace|system-ui|cursive|fantasy)$/i.test(f)) return (known[f] = true);
    const probe = (fb) => { cv.font = `40px ${f}, ${fb}`; return cv.measureText('mmmmmmmmmlli WQ@#').width; };
    return (known[f] = probe('monospace') === probe('serif'));
  };
  const hs = getComputedStyle(host);
  const rootEl = hs.display === 'contents' ? host.firstElementChild || host : host;
  const R = rootEl.getBoundingClientRect();
  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const shadows = (s) => {
    if (!s || s === 'none') return [];
    return s.split(/,(?![^(]*\))/).map((one) => {
      const colour = (/(rgba?\([^)]*\)|#[0-9a-f]+)/i.exec(one) || [])[1];
      const nums = one.replace(/(rgba?\([^)]*\)|#[0-9a-f]+)/i, '').replace('inset', '').trim().split(/\s+/).map(px);
      return { inset: /inset/.test(one), x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, spread: nums[3] || 0, colour: rgba(colour) };
    });
  };
  const read = (el) => {
    const s = getComputedStyle(el), b = el.getBoundingClientRect();
    const sides = ['top', 'right', 'bottom', 'left'];
    const border = sides.map((k) => (s[`border-${k}-style`] !== 'none' && s[`border-${k}-style`] !== 'hidden' ? px(s[`border-${k}-width`]) : 0));
    const borderColour = sides.map((k) => rgba(s[`border-${k}-color`]));
    let bg = rgba(s.backgroundColor);
    if ((!bg || bg[3] === 0) && s.backgroundImage && s.backgroundImage !== 'none') {
      const cs = [...s.backgroundImage.matchAll(/rgba?\([^)]*\)/g)].map((m) => m[0]);
      bg = cs.length && cs.every((x) => x === cs[0]) && /^linear-gradient/.test(s.backgroundImage) && !/url\(/.test(s.backgroundImage) ? rgba(cs[0]) : { image: s.backgroundImage.slice(0, 80) };
    }
    let up = el.parentElement;
    while (up && up !== host && !up.hasAttribute('data-part') && up !== rootEl) up = up.parentElement;
    const P = (up && up !== host ? up : rootEl).getBoundingClientRect();
    return {
      box: { x: b.left - R.left, y: b.top - R.top, w: b.width, h: b.height },
      inParent: { x: b.left - P.left, y: b.top - P.top, end: P.right - b.right, bottom: P.bottom - b.bottom, cx: ((b.left - P.left) - (P.right - b.right)) / 2, cy: ((b.top - P.top) - (P.bottom - b.bottom)) / 2 },
      shown: s.display !== 'none' && s.visibility !== 'hidden' && !el.closest('[hidden]') && (b.width > 0 || b.height > 0 || el.getClientRects().length > 0),
      display: s.display, direction: s.flexDirection,
      gap: { row: s.rowGap === 'normal' ? 0 : px(s.rowGap), column: s.columnGap === 'normal' ? 0 : px(s.columnGap) },
      padding: { top: px(s.paddingTop), end: px(s.paddingRight), bottom: px(s.paddingBottom), start: px(s.paddingLeft) },
      radius: ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'].map((k) => px(s[k])),
      background: bg, border, borderColour,
      shadows: shadows(s.boxShadow), outline: s.outlineStyle !== 'none' ? { width: px(s.outlineWidth), offset: px(s.outlineOffset), colour: rgba(s.outlineColor), auto: s.outlineStyle === 'auto' } : null,
      icon: el.hasAttribute('data-icon'), fontLoaded: fontHere(s.fontFamily),
      color: rgba(s.color), fontSize: px(s.fontSize), lineHeight: s.lineHeight === 'normal' ? null : px(s.lineHeight), fontWeight: +s.fontWeight,
      fontFamily: s.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, ''), letterSpacing: s.letterSpacing === 'normal' ? 0 : px(s.letterSpacing), opacity: +s.opacity,
    };
  };
  const parts = [];
  for (const el of host.querySelectorAll('[data-part]')) {
    const chain = [], inside = [];
    for (let n = el; n && n !== host; n = n.parentElement) { if (n.hasAttribute('data-part')) chain.unshift(n.getAttribute('data-part')); if (n !== el && /^ds-/i.test(n.tagName)) inside.push(n.tagName); }
    // (a placed control's host is `display: contents`: its box is the native control inside, as the root's is)
    const box = getComputedStyle(el).display === 'contents' && el.firstElementChild ? el.firstElementChild : el;
    parts.push({ chain: chain.join(' > '), own: !inside.length, ...read(box) });
  }
  return { root: read(rootEl), parts, colours: Object.fromEntries(colours.map((c) => [c, rgba(c)])) };
}

/* ---------- held to each other ---------- */

const sameN = (a, b) => typeof a === 'number' && typeof b === 'number' && near(a, b, TOLERANCE + 1e-9);
const sameC = (a, b) => !!a && !!b && Array.isArray(a) && Array.isArray(b) && a.every((v, i) => Math.abs(v - b[i]) <= TOLERANCE + 1e-9);
const r2 = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : Array.isArray(v) ? v.map(r2) : v);

/* The stroke each side draws, whichever way CSS draws it: a border, an inset shadow of no blur, or an outline. */
function strokeOf(m) {
  const w = [m.border[0], m.border[1], m.border[2], m.border[3]], col = [...m.borderColour];
  for (const s of m.shadows || []) {
    if (s.blur || !s.colour) continue;
    // a side's inset line (0 0 0 1px all round, or 0 -1px 0 0 on one side)
    const add = (i, n) => { if (n > 0) { w[i] += n; col[i] = col[i] && w[i] !== n ? col[i] : s.colour; } };
    if (s.x === 0 && s.y === 0) [0, 1, 2, 3].forEach((i) => add(i, s.spread));
    else if (!s.spread) { if (s.y < 0) add(2, -s.y); if (s.y > 0) add(0, s.y); if (s.x < 0) add(1, -s.x); if (s.x > 0) add(3, s.x); }
  }
  const auto = !!(m.outline && m.outline.auto && w.every((x) => x === 0));
  if (m.outline && m.outline.width && w.every((x) => x === 0) && m.outline.colour) for (let i = 0; i < 4; i++) { w[i] = m.outline.width; col[i] = m.outline.colour; }
  // to the contract's sides: top, end, bottom, start (left to right)
  return { widths: [w[0], w[1], w[2], w[3]], colour: col.find((c, i) => w[i] > 0 && c) || null, auto };
}

/* Rows for one combination: what the contract says of each part against what the page drew. `ctx`: `at`, the
   combination's name; `value`, the resolver (its `modes`, a token in every mode); `focus`, whether a focus is forced.
   A row's kind names the mechanism where this reader can tell it: a value the token has in another of its modes (the
   page's base mode is not Figma's default), a part to-markup drew as an icon's placeholder (`data-icon`, a gap it names
   for frontend-build), the root's own size, and the rest by field. */
export function compareOne(exp, page, chains, colours, { at = '', value = null, focus = false, unread = {}, skipped = [], stored = null } = {}) {
  const rows = [];
  // what is not compared is said: a field by name (`unread`), a part with no element to find by its id (`skipped`)
  const leave = (f) => { unread[f] = (unread[f] || 0) + 1; };
  const row = (id, field, contract, drawn, kind) => rows.push({ at: `${at}/${id}${field ? `.${field}` : ''}`, contract: r2(contract), drawn: r2(drawn), kind });
  const byChain = new Map();
  for (const p of page.parts) if (!byChain.has(p.chain) || (!byChain.get(p.chain).shown && p.shown)) byChain.set(p.chain, p);
  // a drawn value the same token takes in another mode: the mode it was drawn in, else null
  const otherMode = (x, field, got, isColour) => {
    const t = x.tokens && x.tokens[field];
    if (!t || !value || !value.modes) return null;
    for (const [m, v] of Object.entries(value.modes(t))) {
      if (v === undefined) continue;
      if (isColour ? sameC(colours[v], got) : (typeof v === 'number' && sameN(v, got)) || (typeof v === 'string' && String(v).toLowerCase() === String(got).toLowerCase()) || weightOf(v) === got) return m;
    }
    return null;
  };
  const under = (id) => { for (let k = id; k && k !== 'root'; k = (exp[k] || {}).parent) { const m = chains[k] && byChain.get(chains[k].join(' > ')); if (m && m.icon) return true; } return false; };
  // a box apart by no more than Chrome's layout unit, 1/64 px, which is coarser than the tolerance: named, still a row
  const unit = (a, b, k) => (Math.abs(a - b) <= 1 / 64 + 1e-9 ? 'within Chrome\'s 1/64 px' : k);
  const wanted = new Set();
  const elementOf = (id) => (id === 'root' || !id ? page.root : chains[id] ? byChain.get(chains[id].join(' > ')) : undefined);
  const outlined = (m) => !!(m && m.shown && m.outline && m.outline.width > 0);
  for (const [id, x] of Object.entries(exp)) {
    const m = id === 'root' ? page.root : chains[id] ? byChain.get(chains[id].join(' > ')) : undefined;
    if (id !== 'root' && !chains[id]) { skipped.push(`${at}/${id}`); continue; }
    if (id !== 'root') wanted.add(chains[id].join(' > '));
    const icon = id !== 'root' && under(id);
    const kindOf = (k) => (icon ? `icon placeholder: ${k}` : id === 'root' && k === 'size' ? 'root size' : k);
    const ring = focus && x.stroke && x.stroke.some((v) => v > 0);
    if (!m || !m.shown) {
      // (a focus ring drawn as a layer is the ringed element's outline in code: figma-handoff, Focus rings)
      // (only where the element it rings, its parent, draws that outline)
      if (ring && outlined(elementOf(x.parent))) continue;
      row(id, '', 'drawn', m ? 'hidden' : 'absent', kindOf(ring ? 'focus ring missing' : 'part missing'));
      continue;
    }
    if (x.direction && /flex/.test(m.display)) { if (m.direction.replace('-reverse', '') !== x.direction) row(id, 'direction', x.direction, m.direction, kindOf('direction')); }
    else if (x.direction && Object.values(exp).some((y) => y.parent === id)) row(id, 'direction', x.direction, m.display, kindOf('not laid out'));
    if (x.gap !== undefined && /flex/.test(m.display)) { const g = x.direction === 'column' ? m.gap.row : m.gap.column; if (!sameN(x.gap, g)) row(id, 'gap', x.gap, g, kindOf('gap')); }
    else if (x.gap !== undefined) leave('gap on a box not laid out');
    for (const s of SIDES) if (x[`padding.${s}`] !== undefined && !sameN(x[`padding.${s}`], m.padding[s])) row(id, `padding.${s}`, x[`padding.${s}`], m.padding[s], kindOf('padding'));
    // (a line's no-size side is its stroke's in CSS, which has no zero-size box that paints)
    const lineSide = (want, got) => x.line && want === 0 && sameN(got, Math.max(...x.stroke));
    if (x.width !== undefined && !sameN(x.width, m.box.w) && !lineSide(x.width, m.box.w)) row(id, 'width', x.width, m.box.w, kindOf(unit(x.width, m.box.w, 'size')));
    if (x.height !== undefined && !sameN(x.height, m.box.h) && !lineSide(x.height, m.box.h)) row(id, 'height', x.height, m.box.h, kindOf(unit(x.height, m.box.h, 'size')));
    // hug, fill and a scaling place against Figma's stored box at this combination; a size off where a text under it
    // is set in a font this machine lacks is told apart as font metrics
    if (x.storedW || x.storedH || x.storedPlace) {
      const sb = stored && stored[id];
      const n = (x.storedW ? 1 : 0) + (x.storedH ? 1 : 0) + (x.storedPlace ? 2 : 0);
      if (!sb) for (let i = 0; i < n; i++) leave(stored ? 'no stored box' : 'no stored variant');
      else {
        const scope = x.storedPlace ? (x.parent || 'root') : id;
        const fontless = Object.entries(exp).some(([k, y]) => y.kind === 'text' && (k === scope || scope === 'root' || k.startsWith(`${scope}/`)) && ((elementOf(k) || {}).fontLoaded === false));
        const kind = (k, a, b) => kindOf(fontless && Math.abs(a - b) > 1 / 64 + 1e-9 ? 'font metrics' : unit(a, b, k));
        if (x.storedW && !sameN(sb.w, m.box.w)) row(id, 'width', sb.w, m.box.w, kind('size', sb.w, m.box.w));
        if (x.storedH && !sameN(sb.h, m.box.h)) row(id, 'height', sb.h, m.box.h, kind('size', sb.h, m.box.h));
        if (x.storedPlace && !sameN(sb.x, m.box.x)) row(id, 'x', sb.x, m.box.x, kind('place', sb.x, m.box.x));
        if (x.storedPlace && !sameN(sb.y, m.box.y)) row(id, 'y', sb.y, m.box.y, kind('place', sb.y, m.box.y));
      }
    }
    for (const f of ['x', 'y', 'end', 'bottom', 'cx', 'cy']) if (x[f] !== undefined && !sameN(x[f], m.inParent[f])) row(id, f, x[f], m.inParent[f], kindOf(unit(x[f], m.inParent[f], 'place')));
    // (a radius past half the box draws as half, in CSS and in Figma alike)
    if (x.radius) { const cap = Math.min(m.box.w, m.box.h) / 2, e = x.radius.map((v) => Math.min(v, cap)), d = m.radius.map((v) => Math.min(v, cap)); if (!e.every((v, i) => sameN(v, d[i]))) row(id, 'radius', x.radius, m.radius, kindOf('radius')); }
    if (x.background !== undefined) {
      const want = colours[x.background], got = m.background;
      if (got && !Array.isArray(got)) row(id, 'background', want, got.image, kindOf('fill drawn otherwise'));
      else if (!sameC(want, got || [0, 0, 0, 0])) row(id, 'background', want, got, kindOf(otherMode(x, 'background', got || [0, 0, 0, 0], true) ? 'token in another mode' : 'fill'));
    } else if (Array.isArray(m.background) && m.background[3] > 0 && x.kind !== 'instance') row(id, 'background', null, m.background, kindOf('fill not in contract'));
    if (x.stroke) {
      const st = strokeOf(m), none = x.stroke.every((v) => v === 0);
      // (a line, no wide or no tall, stroked all round draws one line: a border on any one edge draws the same)
      const widthsSame = x.line ? sameN(Math.max(...x.stroke), Math.max(...st.widths)) : x.stroke.every((v, i) => sameN(v, st.widths[i]));
      if (!widthsSame) row(id, 'stroke.width', x.stroke, st.widths, kindOf(none ? (st.auto ? 'browser focus ring' : 'stroke not in contract') : 'stroke width'));
      else if (x.strokeColour !== undefined && !none && !sameC(colours[x.strokeColour], st.colour)) row(id, 'stroke.color', colours[x.strokeColour], st.colour, kindOf(otherMode(x, 'strokeColour', st.colour, true) ? 'token in another mode' : 'stroke colour'));
    }
    if (x.color !== undefined && !sameC(colours[x.color], m.color)) row(id, 'color', colours[x.color], m.color, kindOf(otherMode(x, 'color', m.color, true) ? 'token in another mode' : 'text colour'));
    if (x.fontSize !== undefined && !sameN(x.fontSize, m.fontSize)) row(id, 'fontSize', x.fontSize, m.fontSize, kindOf(otherMode(x, 'fontSize', m.fontSize) ? 'token in another mode' : 'text size'));
    if (x.lineHeight !== undefined && !sameN(x.lineHeight, m.lineHeight)) row(id, 'lineHeight', x.lineHeight, m.lineHeight, kindOf(otherMode(x, 'lineHeight', m.lineHeight) ? 'token in another mode' : 'line height'));
    if (x.fontWeight !== undefined && x.fontWeight !== m.fontWeight) row(id, 'fontWeight', x.fontWeight, m.fontWeight, kindOf(otherMode(x, 'fontWeight', m.fontWeight) ? 'token in another mode' : 'text weight'));
    if (x.fontFamily !== undefined && String(x.fontFamily).toLowerCase() !== String(m.fontFamily).toLowerCase()) row(id, 'fontFamily', x.fontFamily, m.fontFamily, kindOf(otherMode(x, 'fontFamily', m.fontFamily) ? 'token in another mode' : 'text family'));
    if (x.letterSpacing !== undefined && !sameN(x.letterSpacing, m.letterSpacing)) row(id, 'letterSpacing', x.letterSpacing, m.letterSpacing, kindOf('letter spacing'));
    if (x.opacity !== undefined && !sameN(x.opacity, m.opacity)) row(id, 'opacity', x.opacity, m.opacity, kindOf('opacity'));
  }
  // a part of this component's own the page draws where the contract draws none
  for (const p of page.parts) if (p.own && p.shown && !wanted.has(p.chain)) rows.push({ at: `${at}/[${p.chain}]`, contract: null, drawn: 'drawn', kind: 'part not in contract' });
  return rows;
}

/* ---------- one component ---------- */

/* The render function's arguments for a combination, through to-markup's own API (propsOf): a pointer state is
   forced on the page, not passed. */
export function argsFor(c, library, combo) {
  const api = propsOf(c, library), entry = entryOf(c), args = {}, pseudo = [];
  for (const [k, v] of Object.entries(combo)) {
    const p = c.props[k] || {};
    if (p.role === 'interaction' && (p.pointer || []).includes(v)) { pseudo.push(v === 'press' ? 'active' : v === 'focus' ? 'focus' : v); continue; }
    if (entry && k === entry.flag) {
      const val = api.find((x) => x.type === 'value');
      if (val && v === entry.on) args[val.name] = (c.props[Object.keys(c.props).find((q) => (c.props[q].sets || []).includes(entry.value))] || {}).default || 'Value';
      continue;
    }
    const x = api.find((y) => y.key === k);
    if (x) args[x.name] = v;
  }
  return { args, pseudo };
}

/* Opens one page per component and measures every combination; returns { rows, combinations, unread, ms, error? }. */
export async function measureComponent({ library, folder, tokensCss, settingsOf, tokens, browserEndpoint, max = Infinity, pixels = null, specOf = () => null }) {
  const t0 = Date.now();
  const c = Object.values(library).find((x) => x.folder === folder);
  if (!c) return { error: 'no contract', rows: [], combinations: 0, unread: {}, ms: 0 };
  const { byComponentName } = req('./derive.cjs');
  const mainOf = byComponentName(Object.values(library));
  const value = resolver(tokens);
  const spec = specOf(folder);
  let combos = combosOf(c);
  const total = combos.length;
  if (combos.length > max) { const step = combos.length / max; combos = Array.from({ length: max }, (_, i) => combos[Math.floor(i * step)]); }
  const site = await serveSite(selfSiteFiles(library, folder, { tokensCss, settingsOf }));
  const tab = await attach(await newPage(browserEndpoint));
  const rows = [], unread = {}, skipped = [], looks = [];
  try {
    await media(tab, { 'prefers-color-scheme': 'light' });
    await navigate(tab, `${site.url}index.html`);
    await waitFor(tab, '!!window.ready', { timeout: 15000 });
    const tag = `ds-${folder}`;
    for (const combo of combos) {
      const at = Object.entries(combo).map(([k, v]) => `${k}=${v}`).join(',') || 'default';
      const { parts, unread: u } = expected(c, combo, { value, tokens });
      for (const [k, n] of Object.entries(u)) unread[k] = (unread[k] || 0) + n;
      const chains = chainsOf(c, expand(c, { ...variantDefaults(c), ...combo }), mainOf);
      const sv = variantOf(c, (spec || {}).variants, combo), stored = sv ? boxesOf(sv) : null;
      const { args, pseudo } = argsFor(c, library, combo);
      await tab.send('DOM.getDocument', { depth: 0 });
      const ok = await call(tab, ([f, a]) => {
        const s = document.createElement('section'); s.style.cssText = 'display:flow-root;inline-size:max-content;padding:24px';
        try { s.append(window.R[f](a)); } catch (e) { return String(e && e.message || e); }
        document.getElementById('stage').replaceChildren(s);
        return true;
      }, [folder, args]);
      if (ok !== true) { rows.push({ at: `${at}/root`, contract: 'drawn', drawn: `render threw: ${ok}`, kind: 'render failed' }); continue; }
      if (pseudo.length) {
        const sel = `#stage ${tag}`;
        const box = await call(tab, (s) => { const h = document.querySelector(s); return h && getComputedStyle(h).display === 'contents'; }, sel);
        await forceState(tab, pseudo.map((p) => ({ selector: box ? `${sel} > *:first-child` : sel, pseudo: p })));
      }
      const colours = [...new Set(Object.values(parts).flatMap((x) => [x.background, x.strokeColour, x.color, ...['background', 'strokeColour', 'color'].flatMap((f) => (x.tokens[f] ? Object.values(value.modes(x.tokens[f])) : []))]).filter((v) => typeof v === 'string'))];
      const page = await call(tab, readPage, tag, colours);
      if (page.error) { rows.push({ at: `${at}/root`, contract: 'drawn', drawn: page.error, kind: 'render failed' }); continue; }
      rows.push(...compareOne(parts, page, chains, page.colours, { at, value, focus: pseudo.includes('focus'), unread, skipped, stored }));
    }
    // (a pixel step that fails is said for this component, its rows kept)
    if (pixels) { try { looks.push(...(await pixelsOf({ c, tab, tag: `ds-${folder}`, library, pixels }))); } catch (e) { looks.push({ variant: null, error: `pixels failed: ${e.message}` }); } }
  } finally {
    await tab.close(); await site.close();
  }
  return { rows, combinations: combos.length, of: total, unread, skipped, ms: Date.now() - t0, ...(pixels && { looks }) };
}

/* "Matches the contract" only where nothing was left: no row, no field unread, no part skipped, and every combination
   read (none sampled out by --max). */
export function matches(r) {
  return !!r && !r.error && r.rows.length === 0 && Object.values(r.unread || {}).every((n) => !n) && !(r.skipped || []).length && r.combinations > 0 && r.combinations === (r.of ?? r.combinations);
}

/* ---------- pixels against Figma's own export ---------- */

/* The combination a stored variant is: its name's axis values by each prop's Figma name and spelling. */
export function comboOfVariant(c, name) {
  const pairs = Object.fromEntries(String(name).split(',').map((s) => s.split('=').map((x) => x.trim())).filter((p) => p.length === 2));
  const combo = {};
  for (const [k, p] of Object.entries(c.props || {})) {
    if (!(p.figma in pairs)) continue;
    const v = pairs[p.figma];
    if (p.type === 'boolean') combo[k] = (p.figmaValues ? p.figmaValues.indexOf(v) === p.figmaValues.findIndex((x) => /^true$/i.test(x)) : /^true$/i.test(v));
    else if (p.values) { const i = (p.figmaValues || []).indexOf(v); combo[k] = i >= 0 ? p.values[i] : p.values.find((x) => x.toLowerCase() === v.toLowerCase().replace(/\s+/g, '-')); }
  }
  return combo;
}

async function pixelsOf({ c, tab, tag, library, pixels }) {
  const { decodePng, compare } = await import('./looks.mjs');
  const spec = pixels.specOf(c.folder);
  if (!spec || !spec.id) return [{ variant: null, error: 'no stored spec id' }];
  // (the stored spec keeps the set's id, not its variants': their ids are the set's children, by name)
  const variants = (await pixels.children(spec.id)).slice(0, pixels.max || 8);
  if (!variants.length) return [{ variant: null, error: 'Figma returned no variants' }];
  const r = await pixels.images(variants.map((v) => v.id));
  const out = [];
  for (const v of variants) {
    const url = r[v.id];
    if (!url) { out.push({ variant: v.name, error: 'Figma rendered no image' }); continue; }
    const png = Buffer.from(await (await fetch(url)).arrayBuffer()), theirs = decodePng(png);
    const { args, pseudo } = argsFor(c, library, comboOfVariant(c, v.name));
    await tab.send('DOM.getDocument', { depth: 0 });
    // (in a box as wide as Figma's image, as the variant's frame is: a root that fills its container fills that)
    await call(tab, ([f, a, w]) => { const s = document.createElement('section'); s.style.cssText = `display:flow-root;inline-size:${w}px;padding:0;background:transparent`; s.append(window.R[f](a)); document.getElementById('stage').replaceChildren(s); document.documentElement.style.background = document.body.style.background = 'transparent'; document.body.style.margin = '0'; return true; }, [c.folder, args, theirs.w]);
    if (pseudo.length) await forceState(tab, pseudo.map((p) => ({ selector: `#stage ${tag}`, pseudo: p })));
    const box = await call(tab, (t) => { const h = document.querySelector(`#stage ${t}`); const el = getComputedStyle(h).display === 'contents' ? h.firstElementChild : h; const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height }; }, tag);
    if (!(box.width >= 1 && box.height >= 1)) { out.push({ variant: v.name, error: `drawn ${box.width}×${box.height}` }); continue; }
    await tab.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const shot = Buffer.from(await screenshot(tab, box), 'base64'), ours = decodePng(shot);
    const { share, sizes } = compare(theirs, ours);
    if (pixels.out) { fs.mkdirSync(pixels.out, { recursive: true }); const n = `${c.folder}--${v.name.replace(/[^\w=,-]+/g, '_')}`; fs.writeFileSync(path.join(pixels.out, `${n}.figma.png`), png); fs.writeFileSync(path.join(pixels.out, `${n}.code.png`), shot); }
    out.push({ variant: v.name, share: Math.round(share * 1000) / 1000, sizes });
  }
  return out;
}

/* ---------- the command ---------- */

async function main(argv) {
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const flag = (k) => { const i = argv.indexOf(k); if (i >= 0) argv.splice(i, 1); return i >= 0; };
  const images = opt('--images'), pixelsMax = +(opt('--pixels-max') || 4), label = opt('--project'), max = +(opt('--max') || Infinity), out = opt('--out'), panel = flag('--panel'), withPixels = flag('--pixels');
  if (!label) { console.error('usage: oracle-dom.mjs --project <label> [--panel] [components…] [--max <n>] [--pixels [--pixels-max <n>] [--images <dir>]] [--out <file>]'); return 2; }
  const P = req('../snapshot/projects.cjs');
  const where = P.layout(null, label);
  if (where.error) { console.error(where.error); return 2; }
  const { contracts } = await import('./official.mjs');
  const library = Object.fromEntries(contracts(where).filter((x) => x.contract).map(({ folder, contract }) => [contract.component, { ...contract, folder }]));
  let names = argv.filter((a) => !a.startsWith('--'));
  if (panel) names = [...names, ...JSON.parse(fs.readFileSync(path.join(where.projectDir, 'round-trip', 'panel.json'), 'utf8')).components];
  if (!names.length) names = Object.values(library).map((c) => c.folder).sort();
  const tokens = JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8'));
  const tokensCss = fs.readFileSync(path.join(where.paths.styles, '_tokens.scss'), 'utf8');
  const settingsOf = P.librarySettingsFor(where.paths.components);
  let pixels = null;
  if (withPixels) {
    const store = req('../snapshot/store.cjs');
    const { tokenFor } = req('../snapshot/version.cjs');
    const repoDir = where.repo || path.dirname(where.projectDir);
    let config = null; try { config = JSON.parse(fs.readFileSync(path.join(repoDir, 'snapshot.config.json'), 'utf8')); } catch { /* none */ }
    const token = tokenFor(repoDir, config), fileKey = tokens._meta && tokens._meta.fileKey;
    if (!token || !fileKey) { console.error(`--pixels: ${!token ? 'no Figma token found' : 'no file key in the tokens file'}`); return 2; }
    pixels = {
      out: images, max: pixelsMax,
      specOf: (f) => { try { return store.readSpec(where.paths.components, f, { compact: true }); } catch { return null; } },
      children: async (id) => {
        const r = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(id)}&depth=1`, { headers: { 'X-Figma-Token': token } });
        if (!r.ok) throw new Error(`Figma nodes: ${r.status}`);
        const doc = (((await r.json()).nodes || {})[id] || {}).document;
        return !doc ? [] : doc.type === 'COMPONENT_SET' ? (doc.children || []).map((n) => ({ id: n.id, name: n.name })) : [{ id: doc.id, name: doc.name }];
      },
      images: async (ids) => {
        const r = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids.join(','))}&format=png&scale=1`, { headers: { 'X-Figma-Token': token } });
        if (!r.ok) throw new Error(`Figma images: ${r.status}`);
        return (await r.json()).images || {};
      },
    };
  }
  const store = req('../snapshot/store.cjs');
  // (the full stored spec: its variants' trees hold every layer's box)
  const fullSpec = (f) => { try { return store.readSpec(where.paths.components, f); } catch { return null; } };
  const browser = await launch({});
  const report = {};
  try {
    for (const folder of names) {
      let r;
      try { r = await measureComponent({ library, folder, tokensCss, settingsOf, tokens, browserEndpoint: browser.endpoint, max, pixels, specOf: fullSpec }); } catch (e) { r = { error: e.message, rows: [], combinations: 0, unread: {}, ms: 0 }; }
      report[folder] = r;
      const kinds = {}; for (const x of r.rows) kinds[x.kind] = (kinds[x.kind] || 0) + 1;
      const left = Object.values(r.unread || {}).reduce((a, b) => a + b, 0), skippedN = (r.skipped || []).length;
      console.log(`${folder}: ${r.error ? `error: ${r.error}` : matches(r) ? 'matches the contract' : `${r.rows.length} rows${r.rows.length ? ` (${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')})` : ''}, ${left} unread, ${skippedN} parts skipped`} — ${r.combinations}${r.of > r.combinations ? ` of ${r.of}` : ''} combinations, ${(r.ms / 1000).toFixed(1)} s${r.looks ? `; pixels: ${r.looks.map((l) => (l.error ? l.error : `${l.share}`)).join(' ')}` : ''}`);
    }
  } finally { await browser.close(); }
  const done = Object.values(report).filter((r) => !r.error);
  const rowless = done.filter((r) => !r.rows.length).length;
  console.log(`${label}: ${done.filter(matches).length} of ${names.length} match the contract (no row, nothing unread or skipped, every combination); ${rowless} with no row; ${Object.values(report).filter((r) => r.error).length} errors`);
  if (out) fs.writeFileSync(out, JSON.stringify({ project: label, made: new Date().toISOString(), components: report }, null, 1));
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) process.exit(await main(process.argv.slice(2)));
