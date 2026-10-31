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
  return null;
}

/** One `box-shadow` layer as a stroke: an inset layer with no offset and no blur (`0 0 0 1px … inset`) is how code
 *  draws a border without one → `{ width, colour }` (px, the colour as written), else null. The code audit and the
 *  reading of a contract from code each parsed it, twice in one file. Runs in a page too: it travels as its source. */
export function insetStroke(layer) {
  if (!/\binset\b/.test(layer)) return null;
  const colour = (layer.match(/(?:rgba?|oklab|color)\([^)]*\)|#[0-9a-f]{3,8}/i) || [''])[0];
  const len = layer.replace(colour, '').match(/-?[\d.]+px/g) || [];
  return len.length >= 4 && len.slice(0, 3).every((v) => parseFloat(v) === 0) ? { width: parseFloat(len[3]), colour } : null;
}

/** Split on commas outside parentheses — a value list whose values have commas. */
function splitTop(value) {
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

const COLOUR = /rgba?\([^)]*\)|color\([^)]*\)|oklab\([^)]*\)|#[0-9a-fA-F]{3,8}/;

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
