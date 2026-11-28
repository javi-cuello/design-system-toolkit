/*
 * tools/parity/values.mjs — parsing what a browser reports, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 * Reading the values a browser reports, for a loop that compares them with a
 * design's.
 *
 * Parsing only: what counts as equal is schema.mjs, with each project's
 * tolerance per kind from its config. Two projects had written the parsing
 * twice and each handled a spelling the other did not: one read
 * `color(srgb …)` (what a browser returns for `color-mix()` and any
 * wide-gamut value) and `rgb(r g b / a)`, the other read three- and
 * four-digit hex and padded a shadow's missing spread.
 */
import { oklabToLinearSrgb, linearToSrgb } from '../shared/colour.js';

/** `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()` in either
 *  spelling, `color(srgb …)` and `oklab()` → `[r, g, b, a]` (0–255, alpha 0–1
 *  to three places, a percentage read as one), else null. The one reading of a
 *  colour: the code audit kept its own, which alone read `oklab()` (what Chrome
 *  computes for a `color-mix()`) and a percentage alpha. */
export function parseColour(value) {
  const s = String(value == null ? '' : value).trim();
  const alpha = (x) => +(x === undefined ? 1 : x.endsWith('%') ? parseFloat(x) / 100 : +x).toFixed(3);
  const clamp = (x) => Math.round(255 * Math.min(1, Math.max(0, x)));
  let m;
  if ((m = /^#([0-9a-f]{3,8})$/i.exec(s))) {
    const h = m[1];
    const n = h.length <= 4 ? h.split('').map((c) => c + c).join('') : h;
    if (n.length !== 6 && n.length !== 8) return null;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
    return [r, g, b, n.length === 8 ? +(parseInt(n.slice(6, 8), 16) / 255).toFixed(3) : 1];
  }
  // `rgb(0 0 0 / .5)` and `rgba(0, 0, 0, .5)` are the same colour, and a
  // browser uses both spellings depending on what it is reporting.
  if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(s))) {
    return [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3]), alpha(m[4])];
  }
  // srgb channels are 0–1 there, and this comparison works in 0–255: what Chrome reports once a transition settles
  if ((m = /^color\(\s*srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i.exec(s))) {
    return [+m[1], +m[2], +m[3]].map(clamp).concat(alpha(m[4]));
  }
  // what Chrome computes for a colour-mix: OKLab, converted to sRGB
  if ((m = /^oklab\(\s*([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i.exec(s))) {
    return oklabToLinearSrgb(+m[1], +m[2], +m[3]).map((x) => clamp(linearToSrgb(x))).concat(alpha(m[4]));
  }
  // what Chrome keeps when the code writes oklch: its polar form, turned to OKLab's axes
  if ((m = /^oklch\(\s*([-\d.e]+%?)\s+([-\d.e]+)\s+([-\d.e]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/i.exec(s))) {
    const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : +m[1], C = +m[2], h = (+m[3] * Math.PI) / 180;
    return oklabToLinearSrgb(L, C * Math.cos(h), C * Math.sin(h)).map((x) => clamp(linearToSrgb(x))).concat(alpha(m[4]));
  }
  return null;
}

/** One `box-shadow` layer as a stroke: an inset layer with no offset and no blur (`0 0 0 1px … inset`) is how code
 *  draws a border without one → `{ width, colour }` (px, the colour as written), else null. The code audit and the
 *  reading of a contract from code each parsed it, twice in one file. Runs in a page too: it travels as its source. */
export function insetStroke(layer) {
  if (!/\binset\b/.test(layer)) return null;
  const colour = (layer.match(/(?:rgba?|hsla?|oklch|oklab|lch|lab|color)\([^)]*\)|#[0-9a-f]{3,8}/i) || [''])[0];
  const len = layer.replace(colour, '').match(/-?[\d.]+px/g) || [];
  return len.length >= 4 && len.slice(0, 3).every((v) => parseFloat(v) === 0) ? { width: parseFloat(len[3]), colour } : null;
}

/** One `box-shadow` as written, var()s unresolved: the custom properties its inset stroke layer (`inset 0 0 0 <width>
 *  <colour>`, the order css.mjs writes, or one side's `inset 0 calc(-1 * <width>) 0 0 <colour>`; an outside stroke's the same, not inset) names its width and colour with → { width: [name], colour: [name] }, each
 *  empty where that part was written as a value, or null where no layer is such a stroke. What the code meant where
 *  two tokens hold one value (Stroke/2 and the focus ring's width are both 2px). */
export function insetStrokeVars(raw, { outside = false } = {}) {
  if (!raw) return null;
  const top = (str, sep) => { const out = []; let d = 0, cur = ''; for (const ch of str) { if (ch === '(') d++; if (ch === ')') d--; if (d === 0 && sep.test(ch)) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const name = (t) => { const m = t && /^var\(\s*(--[\w-]+)/.exec(t); return m ? [m[1]] : []; };
  const zero = (w) => /^0(px)?$/.test(w);
  // (inset layers first; else, for a border the design draws outside (`outside`), its layers not inset, css.mjs's same
  // shape: never otherwise, where an outer ring is a focus ring's)
  const all = top(raw, /,/).map((layer) => top(layer, /\s/));
  const shaped = (ws) => ws.filter((r) => r.length === 5);
  const inset = shaped(all.filter((w) => w.includes('inset')).map((w) => w.filter((x) => x !== 'inset')));
  const layers = inset.length || !outside ? inset : shaped(all.filter((w) => !w.includes('inset')));
  // a ring all round first, wherever it stands among the layers
  for (const rest of layers) if (rest.slice(0, 3).every(zero)) return { width: name(rest[3]), colour: name(rest[4]) };
  // else a stroke on one side (sideStrokes' shape): shifted by its width along one axis (var(--w), or calc(-1 * var(--w))
  // for the far side), no blur or spread
  for (const rest of layers) {
    const off = rest.slice(0, 2).filter((w) => !zero(w));
    if (off.length === 1 && zero(rest[2]) && zero(rest[3])) { const m = /^calc\(\s*-1\s*\*\s*(var\([^)]*\))\s*\)$/.exec(off[0]); return { width: name(m ? m[1] : off[0]), colour: name(rest[4]) }; }
  }
  return null;
}

/**
 * A stroke on some sides, as css.mjs writes it: one shadow per side, shifted by the side's width and no blur or spread,
 * inset for an inside stroke (shifted toward the middle) and outside otherwise (shifted out). `layers` are box-shadow's
 * layers as strings; → { colour, align, sides: { top, end, bottom, start } (px, 0 where none), used: [layer index] },
 * or null where they are not all one colour's rings. Self-contained: it runs in the page too, as insetStroke does.
 */
export function sideStrokes(layers) {
  const sides = { top: 0, end: 0, bottom: 0, start: 0 }, used = [];
  let colour = null, align = null;
  const read = (layer) => {
    const c = (layer.match(/(?:rgba?|hsla?|oklch|oklab|lch|lab|color)\([^)]*\)|#[0-9a-f]{3,8}/i) || [''])[0];
    const len = (layer.replace(c, '').match(/-?[\d.]+px|(?<![\w.-])0(?![\w.])/g) || []).map((v) => parseFloat(v));
    const ring = len.length === 4 && len[2] === 0 && len[3] === 0 && (len[0] !== 0) !== (len[1] !== 0);
    return { c, len, ring, clear: /transparent|rgba\((?:[^,)]*,){3}\s*0\)|\/\s*0\s*\)/i.test(c || layer) };
  };
  const all = layers.map(read);
  // a clear layer is a stroke only where the shadow is nothing but clear sharp side rings (a stroke whose colour token
  // is transparent, as css.mjs draws one); beside a shadow or a ring that draws, it is a transition's resting
  // placeholder and no stroke
  const clearRingsOnly = all.length > 0 && all.every((l) => l.ring && l.clear);
  layers.forEach((layer, i) => {
    const { c, len, ring } = all[i];
    if (all[i].clear && !clearRingsOnly) return;
    if (!ring) return;
    const inset = /\binset\b/.test(layer), [x, y] = len;
    const side = inset ? (y > 0 ? 'top' : y < 0 ? 'bottom' : x < 0 ? 'end' : 'start') : (y < 0 ? 'top' : y > 0 ? 'bottom' : x > 0 ? 'end' : 'start');
    const a = inset ? 'inside' : 'outside';
    if ((colour && c !== colour) || (align && a !== align) || sides[side]) return;
    colour = c; align = a; sides[side] = Math.abs(x || y); used.push(i);
  });
  return used.length ? { colour, align, sides, used } : null;
}

/** Split on commas outside parentheses — a value list whose values have commas. */
export function splitTop(value) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of String(value)) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

export const COLOUR = /(?:rgba?|hsla?|oklch|oklab|lch|lab|color)\([^)]*\)|#[0-9a-fA-F]{3,8}/;

/**
 * `box-shadow` → one entry per layer: `{ inset, lengths, colour, raw }`.
 * `lengths` is always four (x, y, blur, spread) as written, because a shadow
 * may omit the spread and a browser always reports it; `colour` is parsed, or
 * null where the layer names none.
 */
export function parseShadow(value) {
  if (value === undefined || value === null) return [];
  const s = String(value).trim();
  if (!s || s === 'none') return [];
  return splitTop(s).map((layer) => {
    const inset = /\binset\b/.test(layer);
    const rest = layer.replace(/\binset\b/, '');
    const found = rest.match(COLOUR);
    const lengths = rest.replace(COLOUR, '').trim().split(/\s+/).filter(Boolean);
    while (lengths.length < 4) lengths.push('0px');
    return { inset, lengths, colour: found ? parseColour(found[0]) : null, raw: layer.trim() };
  });
}

/**
 * `linear-gradient(…)` → `{ angle, stops: [{ colour, position, raw }] }`, or
 * null for anything else. A browser drops the angle when it is the default, so
 * an absent one reads as 180deg (top to bottom) and the two become comparable;
 * `position` is a percentage as a number, or null where the stop names none.
 */
/* A radial gradient's ellipse in the layer, as percentages of its box: Figma's gradient space puts the centre at (0.5, 0.5)
   and the ends of the two radii at (1, 0.5) and (0.5, 1), each taken back into the layer's unit square through the
   transform's inverse. → { x, y, rx, ry }
   (two decimals), or null where the radii are not along the box's axes (a turned ellipse, which no CSS radial draws) or
   the transform has no inverse. */
export function radialOf(t) {
  if (!Array.isArray(t) || t.length < 2) return null;
  const [[a, b, c], [d, e, f]] = t, det = a * e - b * d;
  if (!det) return null;
  const inv = (x, y) => [(e * (x - c) - b * (y - f)) / det, (-d * (x - c) + a * (y - f)) / det];
  const C = inv(0.5, 0.5), H1 = inv(1, 0.5), H2 = inv(0.5, 1), r1 = [H1[0] - C[0], H1[1] - C[1]], r2 = [H2[0] - C[0], H2[1] - C[1]];
  const tol = 1e-4, n = (v) => +(v * 100).toFixed(2);
  let rx, ry;
  if (Math.abs(r1[1]) < tol && Math.abs(r2[0]) < tol) [rx, ry] = [Math.abs(r1[0]), Math.abs(r2[1])];
  else if (Math.abs(r1[0]) < tol && Math.abs(r2[1]) < tol) [rx, ry] = [Math.abs(r2[0]), Math.abs(r1[1])];
  else return null;
  return { x: n(C[0]), y: n(C[1]), rx: n(rx), ry: n(ry) };
}
/* A radial-gradient as the browser computes one with an ellipse in percentages (`radial-gradient(50% 40% at 50% 50%,
   rgb(…) 0%, …)`, as the contract's css.mjs writes Figma's): { rx, ry, x, y, stops: [{ colour, position, raw }] }, or null
   for another shape (a circle, a keyword size, a length) or a stop not at one percentage. */
export function parseRadial(value) {
  const inner = String(value == null ? '' : value).match(/^radial-gradient\(([\s\S]*)\)\s*$/);
  if (!inner) return null;
  const parts = splitTop(inner[1]).map((p) => p.trim());
  // (the centre left out where it is the box's middle, as Chrome computes it: `radial-gradient(50% 50%, …)`)
  const m = /^(?:ellipse\s+)?([\d.]+)%\s+([\d.]+)%(?:\s+at\s+(-?[\d.]+)%\s+(-?[\d.]+)%)?$/.exec(parts.shift() || '');
  if (!m) return null;
  const stops = parts.map((t) => { const c = t.match(COLOUR), pct = /^(-?[\d.]+)%$/.exec(t.replace(COLOUR, '').trim()); return c && pct ? { colour: parseColour(c[0]), position: +pct[1], raw: c[0] } : null; });
  if (stops.length < 2 || stops.some((st) => !st)) return null;
  const [rx, ry, x, y] = m.slice(1).map((v, i) => (v === undefined && i > 1 ? 50 : Number(v)));
  return { rx, ry, x, y, stops };
}
/* Shadow layers from one paint order to the other. Figma's effects array paints its last entry on top (its Effects
   panel, whose order is the render order, lists the top first, the reverse of the array the API gives; tokens/dtcg.js
   shadowToken writes effect styles so); CSS box-shadow paints its first on top (CSS Backgrounds 3 §6.1.3: "the first shadow is on
   top and the others are layered behind"). Either way round it is the list reversed, as a copy. The one owner of that
   order: the contract keeps Figma's, and every reader or writer of box-shadow turns it here. */
export const shadowOrder = (layers) => [...(layers || [])].reverse();
export function parseGradient(value) {
  const s = String(value == null ? '' : value);
  const inner = s.match(/linear-gradient\(([\s\S]*)\)\s*$/);
  if (!inner) return null;
  const parts = splitTop(inner[1]).map((p) => p.trim()).filter(Boolean);
  let angle = 180;
  if (/^-?[\d.]+deg$/.test(parts[0] || '')) angle = parseFloat(parts.shift());
  else if (/^to\s/.test(parts[0] || '')) angle = parts.shift();
  const stops = parts.map((t) => {
    const found = t.match(COLOUR);
    const rest = t.replace(COLOUR, '').trim();
    const pct = rest.match(/(-?[\d.]+)%/);
    return { colour: found ? parseColour(found[0]) : null, position: pct ? parseFloat(pct[1]) : null, raw: t };
  });
  return { angle, stops };
}

/*
 * A Figma font style's name → its CSS weight, or undefined for a name not
 * here. Undefined is a finding, not a default: guessing 400 would compare the
 * wrong face and pass. The names are the DTCG format's own font-weight aliases
 * (Design Tokens Format Module, fontWeight), compared without spaces, hyphens
 * or case: Figma spells a style with or without its space (`Semi Bold`,
 * `SemiBold`) depending on the font, and a weight variable may hold it in lower
 * case (`regular`). Each weight's first name is the one a weight is written
 * back as (`weightName`). The one table: the token export and the doc generator
 * run in Figma's sandbox and keep a copy each, which their tests hold to this.
 */
export const WEIGHTS = Object.freeze({
  thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300,
  regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600,
  bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900,
  extrablack: 950, ultrablack: 950,
});
// a CSS weight → its name in the table, for a reading that goes the other way (code → Figma)
export const weightName = (w) => Object.keys(WEIGHTS).find((k) => WEIGHTS[k] === Number(w));
export function figmaWeight(style) {
  if (typeof style !== 'string') return undefined;
  const key = style.replace(/[\s_-]+/g, '').toLowerCase();
  return Object.hasOwn(WEIGHTS, key) ? WEIGHTS[key] : undefined;
}

/* Where a physical longhand's value is written when Chrome cannot report it: { prop, side }, the shorthand whose values
   hold it and its place there (top, right, bottom, left; a corner's from the top left; a gap's row then column), as a
   longhand written in a shorthand with a var() is reported empty; with `logical`, { longhand, prop, side }, the logical
   longhand and shorthand that write it by the element's direction (`rtl`), as a logical one is not reported under the
   physical name at all (a corner's logical longhand has no shorthand: prop null). Else null. Tested by test-from-code.mjs. */
const SIDES = ['top', 'right', 'bottom', 'left'];
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
export function shorthandOf(longhand, { logical = false, rtl = false } = {}) {
  let m;
  // a physical side as a logical axis and edge (block start or end, inline start or end by direction)
  const axis = (side) => (side === 'top' || side === 'bottom' ? ['block', side === 'top' ? 0 : 1] : ['inline', (side === 'left') !== rtl ? 0 : 1]);
  const edge = (i) => (i ? 'end' : 'start');
  if ((m = /^(padding|margin)-(top|right|bottom|left)$/.exec(longhand))) {
    if (!logical) return { prop: m[1], side: SIDES.indexOf(m[2]) };
    const [a, i] = axis(m[2]);
    return { longhand: `${m[1]}-${a}-${edge(i)}`, prop: `${m[1]}-${a}`, side: i };
  }
  if (SIDES.includes(longhand)) {
    if (!logical) return { prop: 'inset', side: SIDES.indexOf(longhand) };
    const [a, i] = axis(longhand);
    return { longhand: `inset-${a}-${edge(i)}`, prop: `inset-${a}`, side: i };
  }
  if ((m = /^border-(top|right|bottom|left)-width$/.exec(longhand))) {
    if (!logical) return { prop: 'border-width', side: SIDES.indexOf(m[1]) };
    const [a, i] = axis(m[1]);
    return { longhand: `border-${a}-${edge(i)}-width`, prop: `border-${a}-width`, side: i };
  }
  if ((m = /^border-(top|bottom)-(left|right)-radius$/.exec(longhand))) {
    if (!logical) return { prop: 'border-radius', side: CORNERS.indexOf(`${m[1]}-${m[2]}`) };
    return { longhand: `border-${edge(axis(m[1])[1])}-${edge(axis(m[2])[1])}-radius`, prop: null };
  }
  if (!logical && (longhand === 'row-gap' || longhand === 'column-gap')) return { prop: 'gap', side: longhand === 'row-gap' ? 0 : 1 };
  return null;
}
/* One side's own value in a shorthand's, its values expanded as CSS does: one to four, or one or two for a logical
   axis's and a gap's; a corner's radii are those before a `/` outside any function. Null where it writes none. */
export function sidePiece(value, prop, side) {
  const words = topWords(value, prop === 'border-radius');
  if (!words.length) return null;
  const two = prop === 'gap' || /-(block|inline)(-width)?$/.test(prop);
  const sides = two ? [words[0], words[1] ?? words[0]] : [words[0], words[1] ?? words[0], words[2] ?? words[0], words[3] ?? words[1] ?? words[0]];
  return sides[side] ?? null;
}

/* One side's value as the cascade gives it (`styles`: an element's matched rules, lowest precedence first, as Chrome
   lists them): whichever of the physical longhand, its shorthand, and the logical longhand and shorthand of the
   element's direction (`rtl`) wins, by importance and then order, as winning() does, read for that side; a longhand
   Chrome lists empty (one a shorthand with a var() writes, listed beside it) is that shorthand's, never a winner of its
   own. A border width's group holds its side's and axis's border shorthands too, whose width part is read (`resolve`:
   a custom property's name to its value, borderWidthOf). Null where none is written, or for a property with no sides. */
const WIDTH = Symbol('border width');
export function sideWinner(styles, longhand, rtl = false, resolve = null) {
  const ph = shorthandOf(longhand), lg = shorthandOf(longhand, { logical: true, rtl });
  if (!ph) return null;
  const group = new Map([[longhand, null], [ph.prop, ph], ...(lg ? [[lg.longhand, null]] : []), ...(lg && lg.prop ? [[lg.prop, lg]] : [])]);
  // a side's border width is also written by the border shorthands of its side and axis (border-left, border,
  // border-inline-start, border-inline): those give their width part (borderWidthOf)
  if (/^border-\w+-width$/.test(longhand)) {
    for (const n of [longhand.replace(/-width$/, ''), 'border']) group.set(n, WIDTH);
    if (lg) for (const n of [lg.longhand.replace(/-width$/, ''), lg.prop.replace(/-width$/, '')]) group.set(n, WIDTH);
  }
  let normal = null, important = null;
  for (const st of styles || []) for (const p of st.cssProperties || []) {
    if (!group.has(p.name) || p.disabled || p.parsedOk === false || p.value == null) continue;
    const value = String(p.value).replace(/\s*!important\s*$/, '');
    // (an empty longhand is a shorthand's in the same rule: one of the group's is read there instead; one outside the
    // group wins unknown, and the reader asks that shorthand itself next)
    const unknown = !value.trim();
    if (unknown && (st.cssProperties || []).some((q) => group.get(q.name) && String(q.value || '').trim())) continue;
    const at = unknown ? { unknown } : { name: p.name, value };
    if (p.important || /!important/.test(p.value)) important = at; else normal = at;
  }
  const w = important || normal;
  if (!w || w.unknown) return null;
  const sh = group.get(w.name);
  return sh === WIDTH ? borderWidthOf(w.value, resolve) : sh ? sidePiece(w.value, w.name, sh.side) : w.value;
}
/* A border shorthand's width part (`var(--w) solid var(--c)`): the part that is a length, or a var whose value, followed
   through `resolve` (a custom property's name to its value), is one, or holds one (a var set to a whole border, or with
   one as its fallback: varChain follows it to the width's own var). Null where it writes none. */
const LENGTH = /^(0|-?[\d.]+[a-z%]+|thin|medium|thick|(calc|min|max|clamp)\(.*\))$/i;
function borderWidthOf(value, resolve = null) {
  const isLength = (v, depth = 0) => {
    const m = /^var\(\s*(--[\w-]+)\s*(?:,([\s\S]*))?\)$/.exec(v.trim());
    const words = topWords(v);
    if (words.length > 1) return words.some((x) => isLength(x, depth + 1));
    if (!m) return LENGTH.test(v.trim());
    const set = depth < 8 && resolve ? resolve(m[1]) : null;
    return set != null ? isLength(String(set), depth + 1) : m[2] != null && isLength(m[2], depth + 1);
  };
  return topWords(value).find((v) => isLength(v)) ?? null;
}
// a value's words, split at spaces outside any function (`toSlash`: up to its first `/` outside one, a corner's radii)
function topWords(value, toSlash = false) {
  const words = []; let depth = 0, cur = '';
  for (const ch of String(value ?? '')) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (!depth && ch === '/' && toSlash) break;
    if (/\s/.test(ch) && !depth) { if (cur) words.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) words.push(cur);
  return words;
}
