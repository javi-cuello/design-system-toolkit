#!/usr/bin/env node
/*
 * tools/component-contract/from-code.mjs — a component's contract read from code: the
 * same shape derive.cjs reads from Figma (contract 1), so a reader of
 * contracts cannot tell, and need not ask, where one came from.
 *
 *   node tools/component-contract/from-code.mjs --project <label> <component> [--rebuild] [--code-only]
 *
 * The component is one the project's parity mappings name, governed or
 * compared (tools/parity loadParity): rendered on its own host (a Storybook,
 * a site's fragments) through the engine's session (openSource, below), and
 *
 *   props     the story's controls: an enum where it lists options, a boolean,
 *             a string or a number where its control or source type is one;
 *             the default the component declares, else the story's own arg;
 *             required where the source says so;
 *             a slot where it takes content (a ReactNode, a snippet, an
 *             element the story starts it with): a stand-in word is put in
 *             it, and the element the word lands in is the slot
 *   anatomy   the rendered tree at the defaults, one element per DOM element
 *             (an svg is one graphic), named by the stored layer it is
 *             (data-figma-id), else the framework's slot class (its profile's
 *             partClass) or by tag, numbered when repeated
 *   values    each computed style matched to the token holding that value,
 *             among the tokens of its kind (a background among Background
 *             colours); where several hold it, the one the library's
 *             contracts use most, and the tie is reported; no token, the value
 *   variants  each prop value rendered with the rest at their defaults, and
 *             what it changes against the default render
 *
 * Self-checked as derive.cjs is: expand() rebuilds every render it saw.
 * Then compared with the contract derived from Figma, element by element
 * through the parity map's selectors: the trial's question is whether the
 * two describe the same component in the same words.
 *
 * Writes <project home>/parity/from-code/<component>.json. The contract editor's
 * Pull from code runs it, on any project the parity engine reads. Not read:
 * pointer states, and sizes a layout resolves (hug, fill).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { forField, usedGroups } from '../contract-editor/anatomy.mjs';
import { parseColour, weightName, insetStroke, sideStrokes, insetStrokeVars, splitTop, shorthandOf, sidePiece } from '../parity/values.mjs';
export { shorthandOf, sidePiece } from '../parity/values.mjs';
import { camel, sentence, partName, kebab } from './layers.mjs';
import { ringOf, pseudoClasses } from './to-code.mjs';
import { inWordsOf } from './to-figma.mjs';
import { layoutFromCss, sizeFromCss, placeFromCss, siblingOrder, liftsAlone, autoResizeOf, growsDown, writtenNowrap, styleFromCss, linesFromCss, LINES_CSS, fillsFromCss, smoothingFromCss, pathsOfBox, blendFromCss, typeValue, firstFamily, spacingFromCss, textFromCss, CASE_ROWS, DECORATION_ROWS, GLYPH_WORDS, CLEARED, UNCLIPPED, UNBLENDED } from './rules.mjs';
import { textStyleFields } from '../tokens/build-tokens.mjs';
import { cssName } from '../tokens/names.mjs';
// what a placement is read from: the element's own position, insets and shift
const PLACE_CSS = ['position', 'inset', 'inset-inline-start', 'inset-inline-end', 'inset-block-start', 'inset-block-end', 'left', 'right', 'top', 'bottom', 'translate', 'transform', 'width', 'height', 'inline-size', 'block-size'];
// what a size and a layout are read from: the element's own declarations and its parent's
const SIZING_CSS = ['display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'justify-self', 'justify-items', 'flex', 'flex-grow', 'flex-basis', 'inline-size', 'width', 'block-size', 'height'];
import { variantValues } from '../shared/names.js';
import { compareNames, writeReport } from '../shared/output.mjs';

import { realpathSync } from 'node:fs';
const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const req = createRequire(import.meta.url);
const { expand, variantDefaults, atProps } = req('./derive.cjs');
import { recorder, pageKey, pageCode, fontsInstalled, localeHere, cacheOff } from './read-cache.mjs';

/* ---- pure parts ---- */

/* A prop that takes content a caller passes: a ReactNode or element, a Svelte snippet, a Vue or Angular template,
   as the docgen says its type, or an element the story starts it with; a host with no docgen states it (controls
   `type: 'slot'`). Its stand-in is a word no
   component draws, so the element it lands in is found by it. */
export const isSlot = (a) => a.control === 'slot' || a.element || /\b(ReactNode|ReactElement|JSX\.Element|Snippet|VNode|TemplateRef|slot)\b/.test(String(a.summary || ''));
// a value that shows nothing: none, empty, or an option the story lists as undefined or null (button's icon)
const NONE = /^(none|undefined|null|)$/i;
export const slotMark = (code) => `slot·${code}·here`;

const sameColour = (a, b) => { const x = parseColour(a), y = parseColour(b); return !!x && !!y && x.slice(0, 3).every((v, i) => Math.abs(v - y[i]) <= 1) && Math.abs(x[3] - y[3]) <= 0.01; };

/* The fields of a part each kind of value fills, as the contract editor names
   them (tools/contract-editor/anatomy.mjs), whose `forField` says which tokens
   a field offers: Figma's own scopes where the snapshot recorded them, else
   the groups the library's contracts use for that field. */
/* A corner as the walk reads it: its radius in pixels, and whether it asks
   for a full round. A percentage is of the box (50% rounds a square fully),
   never pixels; a length rounder than the box's longest side is full too.
   Run in the page, so it names nothing outside itself. */
/* Another component's instance, its words: the props that put words in that component's texts, in its tree's order,
   one for each word it shows (counted alike, else none is guessed); a word this component's own prop put there (its
   stand-in, slotMark) is that prop, as a text's content says it: {prop}. Tested by test-from-code.mjs. */
export function wordsOf(fc, texts, own = {}) {
  const said = Object.values(fc.anatomy).filter((t) => t.kind === 'text' && typeof t.content === 'string').map((t) => /^\{(.+)\}$/.exec(t.content)).filter(Boolean).map((m) => fc.props[m[1]]).filter((q) => q && q.type === 'string');
  if (!texts.length || said.length !== texts.length) return {};
  const ownProp = (t) => { const m = /^slot·(.+)·here$/.exec(t); const k = m && Object.keys(own).find((k) => own[k].code === m[1] || k === m[1]); return k ? `{${k}}` : t; };
  return Object.fromEntries(said.map((q, i) => [q.figma, ownProp(texts[i])]));
}

/* Whether the walk opens a placed instance to read the layers the mapping names inside it: one the mapping names, at
   any depth of placing, where it is itself named inside the instance holding it (`inside`: that one's id), so an
   override two deep (a slider's stop's dot, inside its Stops) is read as the design keeps it and not left to the
   component's own value. Runs in the page (passed as source); tested by test-from-code.mjs. */
export function opensPlaced(inside, id, mapped) {
  return !!mapped && (!inside || String(id).startsWith(`${inside}/`));
}

/* A part's CSS order where the browser lays it out by it, else null: the order of the box it renders at, in its own
   parent box (`parent`: that box's contract id), a flex or grid one. A host that draws no box (display: contents, a
   custom element wrapping its control) renders at its control, where to-code writes a placed component's place
   (`ds-icon-button > button`, its `through`), so the order read is that control's. `style` is getComputedStyle. Runs in
   the page (passed as source); tested by test-from-code.mjs. */
export function cssOrderOf(n, parent, style) {
  // (a part in a turn's wrapper, turnOf: laid out by the wrapper where it is a box, else as if it were not there)
  const w = n.parentElement && n.parentElement.hasAttribute && n.parentElement.hasAttribute('data-turn') ? n.parentElement : null;
  const up = w ? w.parentElement : n.parentElement, flow = w && style(w).display !== 'contents' ? w : n;
  const s = style(flow), box = s.display === 'contents' && flow.firstElementChild ? flow.firstElementChild : flow, o = +style(box).order;
  return o && parent != null && up && up.getAttribute('data-contract-id') === parent && /flex|grid/.test(style(up).display) ? o : null;
}
/* The box a placed instance draws, which its own styling is read off: a host that draws none (display: contents, a
   custom element wrapping its control) draws it through that control, where to-code writes this component's override
   (`> [data-part="icon-button"] > button`); else the instance itself, and so where the host holds more than that one
   child, or its child is a layer read as its own part (`data-contract-id`). `style` is getComputedStyle. Runs in the
   page (passed as source); tested by test-from-code.mjs. */
export function ownBoxOf(n, style) {
  const c = n.firstElementChild;
  return style(n).display === 'contents' && c && n.childElementCount === 1 && !c.hasAttribute('data-contract-id') ? c : n;
}
/* A part turned a quarter is drawn in a wrapper (to-code.mjs turnedParts, `[data-turn]`): its parent is the wrapper's
   (`up`); where the wrapper is a box, the part is turned and the wrapper is what that parent lays out (`flow`, sized on
   the parent's axes), the part placed inside it at its own size; where the wrapper is none (display: contents) the part
   is laid out itself. `style` is getComputedStyle. Runs in the page (passed as source); tested by test-from-code.mjs. */
export function turnOf(n, style) {
  const w = n.parentElement && n.parentElement.hasAttribute && n.parentElement.hasAttribute('data-turn') ? n.parentElement : null;
  const turned = !!w && style(w).display !== 'contents';
  return { wrap: w, up: w ? w.parentElement : n.parentElement, flow: turned ? w : n, turned };
}

/* What decides where a part paints among its siblings, as the browser stacks them (CSS 2 Appendix E): `out` where it is
   out of the flow (absolute or fixed: CSS order moves it nowhere, CSS Flexbox 4.1), `lifted` where it paints with
   the positioned in the flow (rules.mjs liftsAlone, passed in: positioned, or a stacking context of its own), and `z`, its z-index where one applies (a positioned box, or a flex or grid item: CSS
   Flexbox 4.3). Read off the box it renders at, as cssOrderOf. rules.mjs siblingOrder orders by it. Runs in the page
   (passed as source); tested by test-from-code.mjs. */
export function stackOf(n, style, liftsAlone) {
  // (a part turned in a wrapper that is a box, as turnOf reads it: the wrapper is what its parent lays out and stacks)
  const w = n.parentElement && n.parentElement.hasAttribute && n.parentElement.hasAttribute('data-turn') ? n.parentElement : null;
  const turned = !!w && style(w).display !== 'contents', up = w ? w.parentElement : n.parentElement;
  const s = style(n), b = style(turned ? w : s.display === 'contents' && n.firstElementChild ? n.firstElementChild : n);
  const out = b.position === 'absolute' || b.position === 'fixed', lifted = !out && liftsAlone((p) => b[p.replace(/-([a-z])/g, (_, x) => x.toUpperCase())]);
  const laid = !!up && /flex|grid/.test(style(up).display);
  const z = b.zIndex && b.zIndex !== 'auto' && (out || (!!b.position && b.position !== 'static') || laid) ? +b.zIndex : NaN;
  return { ...(out && { out: true }), ...(lifted && { lifted: true }), ...(Number.isFinite(z) && { z }) };
}

/* An element's own words as it draws them, from its text nodes (an element child's words are that child's) and its
   computed style `s`: collapsed, a run of white space is one space (a newline in the source is a space on screen) and a
   node of white space alone between words is one space; preserved (pre, pre-wrap, break-spaces), the text as written, newlines and runs of
   spaces kept, as Figma keeps a text's; preserve-breaks keeps its newlines alone. The ends are trimmed either way (a template's line breaks around a label are not its words).
   white-space-collapse where computed, else white-space (an older browser). Runs in the page (passed as source);
   tested by test-from-code.mjs. */
export function wordsAsDrawn(n, s) {
  const texts = [...n.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent);
  const collapse = s.whiteSpaceCollapse || ({ pre: 'preserve', 'pre-wrap': 'preserve', 'break-spaces': 'break-spaces', 'pre-line': 'preserve-breaks' })[s.whiteSpace] || 'collapse';
  const kept = collapse === 'preserve' || collapse === 'break-spaces';
  // (the nodes joined first, as the browser collapses across them: a node of white space alone between words is a space)
  const x = texts.join('').replace(/\r\n?/g, '\n');
  return (kept ? x : collapse === 'preserve-breaks' ? x.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n') : x.replace(/[ \n\t]+/g, ' ')).replace(/^[ \n\t]+|[ \n\t]+$/g, '');
}

/* Whether `m`, found in the placed instance `n` by its layer's selector `q`, is that instance's own layer, not one of
   another instance nested in it (`isRoot`). A layer that is itself a placed component is reached through its host
   (`[data-part=button] > button`): that host is the layer's own, so a selector that ends in a bare tag under the
   component's root also takes a nested copy's. Runs in the page (passed as source). */
export function ownLayer(m, n, q, isRoot) {
  const host = q.replace(/\s*>\s*[a-z][a-z0-9-]*\s*$/i, '');
  for (let up = m.parentElement; up && up !== n; up = up.parentElement) if (isRoot(up) && !(up === m.parentElement && host !== q && up.matches(host))) return false;
  return true;
}

/* The icons' names drawn in a placed instance, in order (`glyphs`), and those drawn in each of its own layers a swap
   swaps (`layerGlyphs`, [layer id, names] as the page orders the layers; `sels`, their selectors by id, each element
   itself included): only where the layer is found, since a selector that matches nothing says nothing. Runs in the page
   (passed as source). Tested by test-from-code.mjs. */
export function glyphsDrawn(n, sels, iconRe, isRoot, ownLayer) {
  const ICON = 'svg, [data-icon]:empty', all = [...n.querySelectorAll('*')];
  const names = (els) => els.flatMap((g) => [g.getAttribute('data-icon'), ...(iconRe ? [...g.classList].map((c) => (c.match(new RegExp(iconRe)) || [])[1]) : [])].filter(Boolean));
  const found = Object.entries(sels || {}).flatMap(([id, q]) => [...n.querySelectorAll(q)].filter((e) => ownLayer(e, n, q, isRoot)).map((e) => [id, e]));
  found.sort((a, b) => all.indexOf(a[1]) - all.indexOf(b[1]));
  return { glyphs: names([...n.querySelectorAll(ICON)]),
    layerGlyphs: found.map(([id, e]) => [id, names([...(e.matches(ICON) ? [e] : []), ...e.querySelectorAll(ICON)])]) };
}

/* Each layer's selector under `container`, by the writer's own id (`mapping`, the self site's, drawn here), never back through the stored paths: two parts may
   share one (a select's two value texts). None for a contract that cannot be drawn: every reading asks this of the whole
   library, and only those that place it need it. */
export function partsById(mapping, container) {
  try { return Object.fromEntries(Object.entries(mapping().byId).map(([id, sel]) => [id, `${container} ${sel}`])); } catch { return null; }
}

/* The selectors, by id, of the layers a placed component's swaps swap, by the writer's ids, which only the self site
   has: a governed reading finds none, and its first glyph drawn stands. */
export function swappedLayers(fc, L, slug) {
  const parts = fc && L.swapPartsOf?.(slug);
  if (!parts) return {};
  return Object.fromEntries(Object.values(fc.props).filter((q) => q.type === 'instance' || q.type === 'swap').flatMap((q) => q.swaps || []).filter((l) => parts[l]).map((l) => [l, parts[l]]));
}

/* A layer's name where the walk reads it inside a placed component (`inside`: that instance's id): the markup there is
   the placed component's own, so its data-figma-name is that component's name for its layer (Select's
   <ChevronDownIcon>), never this design's for the layer the mapping places on it (a date picker's <SelectClearIcon>):
   the design's own (`names`, by id; none where its id spells it) is taken. Elsewhere the markup's. Runs in the page
   (passed as source); tested by test-from-code.mjs. */
export function nameInside(inside, id, markup, names) {
  return inside && names && String(id).startsWith(`${inside}/`) ? names[id] ?? null : markup;
}

/* Whether a layer of a reading sits inside a placed component's insides: an instance among its ancestors. An outline
   there is that layer's own stroke (a spinner's ellipse), never the focus ring a focused render draws on this
   component's own boxes; so is one on a placed component drawn as an icon mark (`marks`), whose box to-code styles
   as the instance's own. Tested by test-from-code.mjs. */
export function insidePlaced(raw, id, marks = new Set()) {
  // (a placed component drawn as an icon mark is its own box: its outline its own stroke, as to-code writes it there)
  if (marks.has(id)) return true;
  const by = new Map(raw.map((e) => [e.id, e]));
  for (let up = by.get((by.get(id) || {}).parent); up; up = by.get(up.parent)) if (up.kind === 'instance') return true;
  return false;
}

/* A placed part's point with, on an axis code centres it, its far edge as measured (`inset`: its x, y, end and bottom in
   its parent), as derive.cjs writes a centred part's: (x - end) / 2 is its centre's distance from the parent's. A far edge
   already said stays. Tested by test-from-code.mjs. */
export function centredEdges(at, constraints, inset) {
  const out = { ...at };
  if (constraints.horizontal === 'center' && out.end == null && inset.end != null) out.end = inset.end;
  if (constraints.vertical === 'center' && out.bottom == null && inset.bottom != null) out.bottom = inset.bottom;
  return out;
}

/* The design's name for each layer the mapping places (none where its id spells it), for nameInside: from the contract
   the markup was drawn from (`drawnFrom`: on --second, the first reading, so a name the first trip changed shows as the
   drift it is, and a layer only that reading has is named), else the design's. Tested by test-from-code.mjs. */
/* The leaves two values differ at, as dotted paths (a key or an index added or gone is one: a variant's set field is variants.3.set.label.radius). */
export function changedPaths(a, b, at = '', out = []) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  const obj = (x) => x && typeof x === 'object';
  if (obj(a) && obj(b) && Array.isArray(a) === Array.isArray(b)) { for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])]) changedPaths(a[k], b[k], at ? `${at}.${k}` : k, out); return out; }
  out.push(at);
  return out;
}

/* What a reading takes from the design it is compared against, by the rule that takes it: `take(rule, reading, step)`
   tags every field the step changed (none where the code already said the same), `add(rule, path)` one named by hand.
   eval.mjs counts a component holding any as the same only as assisted, never strictly: a field copied was not compared.
   `out()` { rule: [path] }, sorted. */
export function assistsOf() {
  const by = new Map();
  const add = (rule, ...ats) => { for (const at of ats) { if (!by.has(rule)) by.set(rule, new Set()); by.get(rule).add(at); } };
  const take = (rule, reading, step) => { const was = JSON.parse(JSON.stringify(reading)); const r = step(); add(rule, ...changedPaths(was, JSON.parse(JSON.stringify(reading)))); return r; };
  const out = () => Object.fromEntries([...by].sort(([a], [b]) => a.localeCompare(b)).map(([r, s]) => [r, [...s].sort()]));
  return { add, take, out };
}

/* The fields a root read in the design's room (its width, or a fill's canvas) holds at that room's number: the design's,
   so assisted. `e` a read element, `room` the width it was given (none: nothing). */
export function roomTaken(e, room) {
  if (!room || e.parent != null) return [];
  return [e.width === room && `anatomy.${e.id}.width`, e.canvas && e.canvas.width === room && `anatomy.${e.id}.canvas.width`].filter(Boolean);
}

/* Whether a layer's name in the reading is the design's rather than the markup's (nameInside with the design's names
   against without): one only the design gives, or the markup's own the design drops. */
/* A placed component the page draws no stroke on (no border, ring or outline read: `strokeless`) where its component's
   root has one at its props has had it cleared, as to-code writes a contract's `none` (rules.mjs CLEARED): read back so.
   Its fill likewise. The mark goes from every part. (A colour style code has none of: never read.) */
// a colour value that paints nothing (a transparent token: a ghost button's fill)
export const clearValue = (v) => {
  if (typeof v !== 'string') return false;
  const t = v.trim().toLowerCase();
  if (t === 'transparent' || /^#([0-9a-f]{3}0|[0-9a-f]{6}00)$/.test(t)) return true;
  // the alpha, a fourth comma value or one after a slash: rgb(255, 0, 0) has none
  const m = /^(?:rgba?|hsla?)\((?:[^,/)]+,){3}\s*([^,/)]+)\)$/.exec(t) || /^[a-z-]+\([^/)]*\/\s*([^/)]+)\)$/.exec(t);
  return !!m && parseFloat(m[1]) === 0;
};
/* Whether a computed box-shadow draws no shadow: none, or only the rings a stroke is drawn in (each layer unblurred, as
   css.mjs writes a stroke; an effect style's shadow blurs). Run in the page too, as its source. */
export function shadowOnlyRings(bs) {
  if (!bs || bs === 'none') return true;
  // (a ring: unblurred, unmoved and spread all round; a side's edge: unblurred, unspread, moved along one axis only)
  return bs.split(/,(?![^(]*\))/).every((l) => {
    const [x, y, blur, spread] = (l.replace(/[a-z-]+\([^)]*\)/g, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
    if (x === undefined || y === undefined || (blur || 0) !== 0) return false;
    return (spread || 0) !== 0 ? x === 0 && y === 0 : (x === 0) !== (y === 0);
  });
}
export function readCleared(anatomy, mains, valueOf = () => undefined) {
  const { atProps } = req('./derive.cjs');
  for (const e of Object.values(anatomy)) {
    if (!e || (!e.strokeless && !e.fillless && !e.shadowless && !e.clipless && !e.blendless)) continue;
    const stroke = !!e.strokeless, fill = !!e.fillless, shade = !!e.shadowless, clip = !!e.clipless, blend = !!e.blendless;
    delete e.strokeless; delete e.fillless; delete e.shadowless; delete e.clipless; delete e.blendless;
    const m = e.kind === 'instance' && e.component && mains(e.component, e.key), R = m && atProps(m, e.with || {}).root;
    if (stroke && R && R.border && typeof R.border === 'object' && R.border.color != null && e.border === undefined) e.border = CLEARED;
    // (and a fill the page paints clear, `fillless`, where its root has one: cleared too, as to-code writes a contract's
    // background none; never a fill merely left unread)
    if (fill && R && typeof R.background === 'string' && R.background !== CLEARED && !clearValue(valueOf(R.background)) && e.background === undefined) e.background = CLEARED;
    // (and a shadow the page draws none of, `shadowless`, where its root has one)
    if (shade && R && typeof R.shadow === 'string' && R.shadow !== CLEARED && e.shadow === undefined) e.shadow = CLEARED;
    // (and a clip the page draws none of, `clipless` (its computed overflow visible), where its root clips: stopped, UNCLIPPED)
    if (clip && R && R.overflow === 'hidden' && e.overflow === undefined) e.overflow = UNCLIPPED;
    // (and a blend the page draws none of, `blendless` (its computed mix-blend-mode normal), where its root has one: set
    // back, UNBLENDED)
    if (blend && R && R.blend && R.blend !== UNBLENDED && e.blend === undefined) e.blend = UNBLENDED;
  }
  return anatomy;
}

export function nameBorrowed(inside, id, markup, names) {
  return (nameInside(inside, id, markup, names) ?? null) !== (nameInside(inside, id, markup, null) ?? null);
}

/* derive's ownInsides on a reading, tagging what the design's colours decide: a colour on a placed icon kept only where
   the design states one (`coloured`), so one dropped for its silence is the design's, said under design-colour-kept. */
export function colourKept(A, anatomy, mains, opts) {
  const { ownInsides } = req('./derive.cjs');
  const alone = opts.coloured ? JSON.parse(JSON.stringify(anatomy)) : null;
  if (alone) ownInsides(alone, mains, { ...opts, coloured: null });
  ownInsides(anatomy, mains, opts);
  if (alone) A.add('design-colour-kept', ...changedPaths(alone, JSON.parse(JSON.stringify(anatomy))).map((q) => `anatomy.${q}`));
  return anatomy;
}

export function layerNames(ids, design, drawnFrom = null) {
  const c = drawnFrom || design;
  if (!c) return null;
  const at = (id) => (c.anatomy || {})[id] || (c.variants || []).map((v) => (v.add || {})[id]).find(Boolean) || {};
  return Object.fromEntries(ids.map((id) => [id, at(id).name ?? null]));
}

/* The layer a design draws as box `id`'s focus ring, which code draws as that box's outline (to-code's ringOf, the one
   rule): its key and name, so a ring read back from an outline is the design's own layer (Carbon's `focusBorder`),
   and a synthesised `<id>/focusRing` only where the design has none. For a render (`when`, the design's props) it is
   the outline to-code draws there: of the layers its expanded anatomy holds that ringOf takes for this box, the last,
   whose outline to-code writes over the others' (a {focus, invalid} render's error stroke over the ring {focus} adds).
   With no render, or none there, the one most focus variants add, then the broadest of them's (fewest props in its
   `when`). A design layer the reading already holds (code drew it as a box of its own) is not taken twice. Only a layer
   a variant adds is found, as ringOf finds one: a ring kept in the base anatomy and shown by a variant's `set` is not,
   and stays a focusRing. `settings`: the library's, as to-code writes under them (the house's unless given).
   Tested by test-from-code.mjs. */
export function ringKeyOf(design, id, taken = {}, when = null, settings = undefined) {
  const own = `${id === 'root' ? '' : `${id}/`}focusRing`;
  if (!design || !design.props) return { key: own };
  const named = ([k, e]) => ({ key: k, ...(e.name && { name: e.name }) });
  if (when) {
    const w = { ...variantDefaults(design), ...when }, a = expand(design, w);
    const here = Object.entries(a).filter(([k, e]) => e && e.parent === id && !(k in taken) && ringOf(design, w, k, e, a, settings));
    if (here.length) return named(here[here.length - 1]);
  }
  const hits = new Map(); // key → { name, n: focus variants adding it, keys: the fewest props a variant adding it names }
  for (const v of design.variants || []) {
    const a = { ...(design.anatomy || {}), ...(v.add || {}) };
    for (const [k, e] of Object.entries(v.add || {})) {
      if (e.parent !== id || k in taken || !ringOf(design, v.when || {}, k, e, a, settings)) continue;
      const h = hits.get(k) || { ...named([k, e]), n: 0, keys: Infinity };
      h.n++; h.keys = Math.min(h.keys, Object.keys(v.when || {}).length); hits.set(k, h);
    }
  }
  const all = [...hits.values()];
  const best = all.find((h) => h.key === own) || all.sort((x, y) => y.n - x.n || x.keys - y.keys)[0];
  return best ? { key: best.key, ...(best.name && { name: best.name }) } : { key: own };
}

/* A render's args as a design's props: each code prop as the design prop of its key, else the one the mapping's joins
   give it (Carbon's styleOption for Style), its value in the design's spelling. The render's state (the `__state` arg)
   is the design's interaction prop's, whatever that prop is called: the value of the same word, else the one the
   house's pseudo-classes (to-code's pseudoClasses, the stylesheet's; `settings` theirs, the house's unless given) force
   as this state is forced (`pseudoOf`), a value of several words kebab-cased as their keys are.
   Tested by test-from-code.mjs. */
export function designCombo(design, props, joinedProps, args, pseudoOf = {}, settings = undefined) {
  const combo = {};
  if (!design) return combo;
  const low = (x) => String(x).toLowerCase(), bare = (x) => String(x || '').replace(/^:+/, '');
  const joinedTo = (j) => (typeof j === 'string' ? j : j && typeof j === 'object' ? j.code || j.arg : null);
  for (const [k, q] of Object.entries(props)) {
    if (!q.code || args[q.code] === undefined) continue;
    // a text and the boolean its emptiness says share a code prop (emptyShows): each takes its own kind of value
    if (q.emptied !== undefined) { if (design.props[k]) combo[k] = args[q.code] !== false && args[q.code] !== ''; continue; }
    if (q.type === 'string' && typeof args[q.code] === 'boolean' && Object.values(props).some((p) => p.emptied !== undefined && p.code === q.code)) continue;
    const [ik, ip] = q.code === '__state' ? Object.entries(design.props).find(([, p]) => p.role === 'interaction') || [] : [];
    if (ip) {
      const s = args.__state, ps = pseudoClasses(settings), forced = (pseudoOf[s] || {}).pseudo, dk = ik, d = ip;
      const v = (d.values || []).find((w) => low(w) === low(s)) ?? (forced ? (d.values || []).find((w) => ps[kebab(w)] && bare(ps[kebab(w)]) === bare(forced)) : undefined);
      if (v !== undefined) combo[dk] = v;
      continue;
    }
    const named = !design.props[k] && Object.keys(design.props).find((dk2) => joinedTo((joinedProps || {})[dk2]) === q.code);
    const dk = design.props[k] ? k : named || k, d = design.props[dk];
    if (!d) continue;
    combo[dk] = d.type === 'enum' ? (d.values || []).find((w) => low(w) === low(args[q.code])) ?? args[q.code] : args[q.code];
  }
  return combo;
}

/* A reading's layers with its render state said in the design's words (designCombo's own rule: the same word, its rest
   the design's default), for a trip that draws them against the design's props (from-code --second). A combination
   layer names every prop, the rest state too: kept as the reading's `rest` beside Carbon's `enabled`, it held at no
   combination the second trip drew, and a part a pointer state also adds was hidden there.
   Tested by test-from-code.mjs. */
export function inDesignStates(variants, reading, design) {
  const fk = Object.keys(reading.props || {}).find((k) => reading.props[k].role === 'interaction' && reading.props[k].code === '__state');
  const ik = Object.keys(design.props || {}).find((k) => design.props[k].role === 'interaction');
  if (!fk || !ik) return variants;
  const word = (s) => designCombo(design, { [fk]: reading.props[fk] }, {}, { __state: s })[ik] ?? (s === reading.props[fk].default ? design.props[ik].default : s);
  return variants.map((v) => (v.when && fk in v.when ? { ...v, when: Object.fromEntries(Object.entries(v.when).map(([k, s]) => (k === fk ? [ik, word(s)] : [k, s]))) } : v));
}

/* The combinations read after the pairs and the triples, each a list of [prop, value]: every one of four props off their
   defaults, and every one of more that the design draws (`draws(list)`; none given, a reading only in code, stops at
   four, which has no grid to say which it draws). The round trip compares every combination the design draws, so one of
   five props or more left unread was only predicted from the layers, and read back wrong where they do more together
   (Material's square extra-small icon button, five props off default; its vertical slider, five to seven).
   Tested by test-from-code.mjs. */
export function combinationsToRead(keys, valuesOf, draws = null, from = 4) {
  const out = [];
  const go = (i, acc) => {
    if (acc.length >= from && (acc.length === from || draws(acc))) out.push(acc);
    if (acc.length >= from && !draws) return;
    for (let j = i; j < keys.length; j++) for (const v of valuesOf(keys[j])) go(j + 1, [...acc, [keys[j], v]]);
  };
  go(0, []);
  return out;
}

/* A combination's key, its [prop, value] pairs in one order. */
export const comboKey = (list) => list.map(([k, v]) => `${k}=${String(v)}`).sort().join('&');

/* Reads the combinations combinationsToRead gave, fewest props first, every one: the round trip compares every
   combination the design draws, and one left to the layers was a guess it counts as not the same (eval.mjs isSame),
   even where no three of its props build a layer together (Carbon's checkbox left 1,360 so). `readOne(list)` reads it.
   { read }: the count, said in the self-check.
   Tested by test-from-code.mjs. */
export async function readCombinations(lists, readOne) {
  let read = 0;
  for (const list of [...lists].sort((a, b) => a.length - b.length)) { read++; await readOne(list); }
  return { read };
}

/* The layers a design states a colour for, in its base or any variant (an add's background, or a set of one). */
export function colouredIn(design) {
  const out = new Set();
  if (!design) return out;
  for (const a of [design.anatomy || {}, ...(design.variants || []).map((v) => v.add || {})]) for (const [id, e] of Object.entries(a)) if (e && e.background != null) out.add(id);
  for (const v of design.variants || []) for (const k of Object.keys(v.set || {})) if (k.endsWith('.background') && v.set[k] != null) out.add(k.slice(0, -'.background'.length));
  return out;
}

/* A library's settings by component folder (the house's where it keeps none): the one source the self leg writes its
   sheet, markup and mapping under and the reading reads them back under, as to-code and to-markup take them. */
export const librarySettings = (componentsDir) => req('../snapshot/projects.cjs').librarySettingsFor(componentsDir);

/* Whether a design keeps a focus ring on box `id`: its `<id>/focusRing`, or a ring layer of its own name (ringKeyOf).
   Tested by test-from-code.mjs. */
export function keepsRing(c, id, settings = undefined) {
  const own = `${id === 'root' ? '' : `${id}/`}focusRing`;
  return !!c && ([c.anatomy || {}, ...(c.variants || []).map((v) => v.add || {})].some((a) => own in a) || ringKeyOf(c, id, {}, null, settings).key !== own);
}

/* A render's rings read from outlines (`ring`: [box id, layer]) placed in its reading as the design's ring layers
   (ringKeyOf), at the place the design gives that layer at this render among the box's other children (an outline holds
   no place, as it holds no name: both are the design's), after them where the design names none; the keys listed on the
   reading as `rings` (not enumerable), so delta knows them whatever they are called; `combo` the render's design props.
   Tested by test-from-code.mjs. */
export function placeRings(anatomy, ring, design, combo, settings = undefined) {
  // (the render's props, each it leaves unset at its default: an unset prop never matches another value's variant)
  const when = combo && design && design.props ? { ...variantDefaults(design), ...combo } : combo, rings = [];
  const drawn = when && design && design.props ? expand(design, when) : {};
  for (const [id, e] of ring) {
    const { key, name } = ringKeyOf(design, id, anatomy, when, settings); rings.push(key);
    const sibs = Object.values(anatomy).filter((y) => y.parent === id).sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
    // before the first sibling the design draws after the ring here (one the design lacks keeps its place)
    const at = (k) => (drawn[k] && drawn[k].parent === id ? drawn[k].order ?? 0 : null);
    const mine = at(key), ids = new Map(Object.entries(anatomy).map(([k, y]) => [y, k]));
    const place = mine == null ? sibs.length : (((i) => (i < 0 ? sibs.length : i))(sibs.findIndex((y) => at(ids.get(y)) != null && at(ids.get(y)) > mine)));
    sibs.forEach((y, i) => { y.order = i < place ? i : i + 1; });
    anatomy[key] = { ...e, ...(name && { name }), order: place };
  }
  Object.defineProperty(anatomy, 'rings', { value: rings, configurable: true });
  return anatomy;
}

/* Whether an outline a box draws is its own stroke (else, in a focused render, a focus ring layer): not one drawn by an
   ::after, nor on a box with a border of its own, nor clear (a placeholder drawing nothing); and at rest, or inside a
   placed component's insides (insidePlaced) unless the design keeps a ring there (`ringed`: its `<id>/focusRing`, or ringKeyOf's).
   Tested by test-from-code.mjs. */
export function outlineIsOwn(x, focused, inPlaced, ringed) {
  return !!x.outline && !x.outline.after && (!focused || (inPlaced && !ringed)) && !x.border && !/^(rgba\((?:[^,)]*,){3}\s*0\)|transparent)$/.test(String(x.outline.color).trim());
}

/* The element a mapped layer names. A placed component's own layer is mapped to that component's root, inside its host
   (ds-button > button): the host is the instance, so it takes the layer's id and the walk names it by its layer, not by
   the component it places. Only an instance moves: another layer mapped to that root (an override there) stays on it,
   and a text there is the instance's words, as it was when the root held the instance's id. Returns the element and
   whether it is words. Runs in the page (passed as source); tested by test-from-code.mjs. */
export function elementOfLayer(q, id, kind, rootRe, others) {
  const h = q && q.parentElement;
  // (an element that names a part, data-part, is a part of the component it sits in, never that component's root, though
  // it come first in its host: a day's words where it draws no control around them, read as the part they are)
  const isHost = h && rootRe && h.firstElementChild === q && !q.getAttribute('data-part') && [...h.classList, h.tagName.toLowerCase()].some((c) => { const x = (c.match(new RegExp(rootRe)) || [])[1]; return x && others[x]; });
  if (!isHost) return [q, false];
  const its = h.getAttribute('data-figma-id');
  if (kind === 'instance' && !its) return [h, false];
  return [q, kind === 'text' && !!its && id.startsWith(`${its}/`)];
}

/* The selector of a part's box in its parent's flow: the element the walk marks, or, where it is a host that draws no box
   of its own (display: contents, a placed component's custom element around its control), that control, which to-code
   writes the part's sizing and pull back on. */
export const boxSelector = (id, display) => (display === 'contents' ? `[data-contract-id="${id}"] > :first-child` : `[data-contract-id="${id}"]`);
/* The box a part's parent lays out: a part turned a quarter, its wrapper (turnOf, marked data-contract-turn), where to-code
   writes its flow (its size on the parent's axes, its pull back); else its own box (boxSelector). */
export const flowSelector = (id, turned, display) => (turned.has(id) ? `[data-contract-turn="${id}"]` : boxSelector(id, display));

export function cornerOf(css, w, h) {
  const px = (v) => +(+parseFloat(v) || 0).toFixed(2);
  const pct = /%$/.test(css) ? parseFloat(css) : null;
  const radius = pct === null ? px(css) : px((pct / 100) * Math.min(w, h));
  return { radius, ...((pct === null ? radius * 2 > Math.max(w, h) : pct >= 50) && { full: true }) };
}
/* A box's four computed corners (top-left, top-right, bottom-right, bottom-left: Figma's order, and CSS's, which to-code
   writes a radius per corner in) as the contract says them: one radius where all four agree (cornerOf's), none where
   that one is 0; else the four, each in pixels, a full one cornerOf's marked object. `corner`: cornerOf, passed in so
   the page runs the one rule. Tested by test-from-code.mjs. */
export function cornersOf(cs, w, h, corner) {
  if (cs.every((c) => c === cs[0])) return parseFloat(cs[0]) ? corner(cs[0], w, h) : {};
  return { radius: cs.map((c) => { const k = corner(c, w, h); return k.full ? k : k.radius; }) };
}
/* A library's fullest radius: the largest number the radius field offers, of the tokens scoped to corners where any is
   (a token open to every field, Atlassian's Body S font weight at 400, is offered too, and is no corner). Tested by
   test-from-code.mjs. */
export function fullestOf(offered) {
  const ns = (offered || []).filter((t) => typeof t.value === 'number'), scoped = ns.filter((t) => (t.scopes || []).includes('CORNER_RADIUS'));
  const r = (scoped.length ? scoped : ns).sort((a, b) => b.value - a.value)[0];
  return r ? r.name : null;
}

const FIELDS = { background: ['background'], text: ['color'], icon: ['fill'], stroke: ['stroke'], space: ['gap', 'padding'], radius: ['radius'], width: ['strokeWidth'], fontSize: ['fontSize'] };

/* A library's tokens in one mode, each with the fields Figma scopes it to where
   the snapshot recorded them, and its collection: the rows designTokenFor reads. */
export function tokenTable(snapshot, mode) {
  const rows = [];
  for (const c of Object.values((snapshot && snapshot.collections) || {})) {
    const md = (c.modes || []).find((x) => x.toLowerCase() === String(mode || '').toLowerCase()) || (c.modes || [])[0];
    // (and its value in every mode, last: a token the code wrote holds what it draws in whichever mode the element is in)
    for (const [k, v] of Object.entries((c.values || {})[md] || {})) rows.push([k, v, c.scopes && c.scopes[k], c.name, Object.values(c.values || {}).map((m) => m[k])]);
  }
  return rows;
}

/* Which tokens each field offers, for a library: forField over its contracts'
   own groups; null for a field nothing says anything of (no scopes recorded,
   and the library sets it nowhere), so it narrows nothing. */
export function offerFor(contracts) {
  const groups = usedGroups(contracts);
  return (field, list) => (list.some((t) => t.scopes) || (groups[field] || []).length ? forField(list, groups[field], field) : null);
}

/* Which token holds a value: the one the code wrote it with (`vars`, the
   custom properties its value came through, authoredVars) where it holds
   that value, whatever the field offers; else among the tokens the field
   offers (`offered`, offerFor; a field nothing is known of names none; no
   `offered`, every token) the one the library's contracts use most; `tie` lists the rest that hold it too, and `more` says several
   held it, so the code's own words are worth reading. */
export function designTokenFor(kind, value, table, usage, under = null, judge = null, offered = null, vars = null) {
  const colour = ['background', 'text', 'icon', 'stroke'].includes(kind);
  const list = table.map(([name, v, scopes]) => ({ name, value: v, ...(scopes && { scopes }) }));
  // the tokens the kind's fields offer. Where nothing is known of them (no scopes recorded, and the library
  // sets them nowhere) no token is named: a guess among every token of the same number is a wrong name
  // said with confidence (toolkit-standard §D 15). Without `offered` at all, every token is a candidate.
  // the token the code wrote, where it holds this value, whatever the field offers: what the code says beats a
  // guess by scope (a dot the code paints with an icon token is a box in the markup and an ellipse in Figma)
  if (vars && vars.length) for (const v of vars) {
    // (in any of its modes: a contextual field token is one colour on the background and another on a layer)
    const holds = (t) => (t[4] || [t[1]]).some((x) => (colour ? sameColour(x, value) : typeof x === 'number' && +x === +value));
    // the toolkit's own css name for the token first; else the longest name the property ends in
    const said = table.find((t) => v === cssName(t[3] || '', t[0]) && holds(t)) || table.filter((t) => writtenAs(v, t[0], t[3]) && holds(t)).sort((a, b) => b[0].length - a[0].length)[0];
    if (said) return { token: said[0] };
  }
  const known = offered ? (FIELDS[kind] || []).map((f) => offered(f, list)).filter(Boolean) : null;
  if (known && !known.length) return { value };
  const allowed = new Set((known ? known.flat() : list).map((t) => t.name));
  const own = table.filter(([name]) => allowed.has(name));
  let hits = own.filter(([, v]) => (colour ? sameColour(v, value) : typeof v === 'number' && +v === +value));
  // none exact: a translucent token that draws this colour over what is behind it
  if (!hits.length && colour && under && judge) hits = own.filter(([, v]) => typeof v === 'string' && judge({ color: v }, value, under) === 'looks-same');
  if (!hits.length) return { value };
  if (hits.length > 1 && vars && vars.length) {
    // the outermost name first: the token the code wrote, before the primitive it aliases
    for (const v of vars) { const said = hits.find((h) => writtenAs(v, h[0], h[3])); if (said) return { token: said[0] }; }
  }
  hits.sort((a, b) => (usage[b[0]] || 0) - (usage[a[0]] || 0) || compareNames(a[0], b[0]));
  const top = usage[hits[0][0]] || 0;
  const tie = hits.slice(1).filter(([n]) => (usage[n] || 0) === top).map(([n]) => n);
  return { token: hits[0][0], ...(tie.length && { tie }), ...(hits.length > 1 && { more: true }) };
}

/* Whether a custom property is a token's: the name the toolkit's own code
   gives it (tools/tokens/names.mjs cssName), or one that ends in the token's
   words (`--ds-color-background-primary` for Color/Background/Primary). */
const fold = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
export function writtenAs(custom, token, collection = '') {
  if (custom === cssName(collection || '', token)) return true;
  const t = fold(token);
  return t.length > 2 && fold(custom).endsWith(t);
}

export function styleFor(t, styles, usage) {
  const hits = styles.filter((s) => s.size === t.size && Math.abs(s.size * s.lineHeight - t.lineHeight) < 0.6 && String(s.weight).replace(/\s/g, '').toLowerCase() === t.weight);
  if (!hits.length) return { value: typeValue(t) };
  hits.sort((a, b) => (usage[b.name] || 0) - (usage[a.name] || 0) || compareNames(a.name, b.name));
  const top = usage[hits[0].name] || 0;
  const tie = hits.slice(1).filter((s) => (usage[s.name] || 0) === top).map((s) => s.name);
  return { token: hits[0].name, ...(tie.length && { tie }) };
}

/* What the page reads of a text's type: its computed values, and what a text with no style says beside them (spacing,
   case, decoration). A line an ancestor draws is drawn on the text and not in its own computed value (decoration is
   not inherited): propagated to what is in the flow, a flex item too, never to what is out of it or inside an atomic
   inline (CSS Text Decoration 3 §2), so each ancestor's is taken up to the first such box. Runs in the page, so it
   names nothing outside itself. */
export function textTypeOf(n, s, WEIGHT) {
  const px = (v) => +(+parseFloat(v) || 0).toFixed(2);
  const lines = new Set();
  for (let at = n, c = s; ;) {
    for (const l of String(c.textDecorationLine || '').split(' ')) if (l && l !== 'none') lines.add(l);
    // (a flex or grid item's display computes as a block's, so an inline one here is an atomic inline; its float does
    // nothing and is still computed as written, so a floated flex item wrongly stops the walk: known, not handled)
    if (/^(absolute|fixed)$/.test(c.position) || (c.float && c.float !== 'none') || /^inline-/.test(c.display) || !at || !at.parentElement) break;
    at = at.parentElement; c = getComputedStyle(at);
  }
  return { size: px(s.fontSize), lineHeight: px(s.lineHeight), weight: WEIGHT[s.fontWeight] ?? String(s.fontWeight), italic: s.fontStyle !== 'normal', family: s.fontFamily, own: { 'letter-spacing': s.letterSpacing, 'text-transform': s.textTransform, 'font-variant-caps': s.fontVariantCaps, 'text-decoration-line': [...lines].join(' ') || 'none' } };
}

/* A text's type (textTypeOf's) as the contract says it: the style that holds its values, else those values (`raw`: the
   toolkit's own rendering wrote them so) with the spacing, case and decoration beside them (rules.mjs, as css.mjs
   writes them). A text matched to a style by size, line height and weight reads as that style alone; what the design
   says of the layer takes nothing out. `fields` is the element's; `pick` how a style was chosen. */
export function typedText(t, { styles = [], usage = {}, raw = false } = {}) {
  const type = { ...t, family: firstFamily(t.family) }, own = t.own || {};
  const pick = raw ? { value: typeValue(type) } : styleFor(type, styles, usage);
  const fields = { typography: pick.token ?? pick.value };
  if (!pick.token) {
    const ls = spacingFromCss(own['letter-spacing']), tc = textFromCss(CASE_ROWS, own), td = textFromCss(DECORATION_ROWS, own);
    if (ls !== undefined) fields.letterSpacing = ls;
    if (tc) fields.textCase = tc;
    if (td) fields.textDecoration = td;
  }
  return { pick, fields };
}

/* How often each token and text style is named across a library's contracts. */
export function usageIn(contracts) {
  const n = {};
  const visit = (v) => { if (typeof v === 'string') n[v] = (n[v] || 0) + 1; else if (v && typeof v === 'object') Object.values(v).forEach(visit); };
  for (const c of contracts) { visit(c.anatomy); visit(c.variants); }
  return n;
}

/* A value the code draws as the design does, written raw or left unset (a 0 padding, no radius), takes the design's
   token for it: the drawing binds what the design binds. `value` is a token's value by its name. */
/* Whether a placed component's markup carries one arg of its mapping: the arg's own attribute (size, data-size, aria-)
   first; else a data attribute holding the value (data-hierarchy for variant). A flag is on where its attribute is there
   and not "false" (markup that writes every flag as a string: selected="false"), off where it is absent or "false".
   Never class, style or the walk's own marks. */
export function carries(attrs, k, v) {
  // (an arg as markup spells an attribute: isChecked as is-checked, the house's own words for a placed web component)
  const kk = String(k).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const own = attrs[k] ?? attrs[`data-${k}`] ?? attrs[`aria-${k}`] ?? (kk !== k ? attrs[kk] ?? attrs[`data-${kk}`] : undefined);
  if (v === true) return own != null && own !== 'false';
  if (v === false) return own == null || own === 'false';
  if (own != null) return own === String(v);
  return Object.entries(attrs).some(([n, x]) => n.startsWith('data-') && !/^data-(contract-id|figma-)/.test(n) && x === String(v));
}

/* An axis's value from the attributes an element carries: the value whose args it all carries, else the one that asks
   for none. The host's own attributes first; only where they say none, an inner control's disabled (a loading button
   whose <button> is disabled because it is busy stays loading). Tested by test-from-code.mjs. */
export function axisValueOf(vals, attrs, innerDisabled = false) {
  const fits = (h) => Object.entries(vals).find(([, a]) => a && Object.keys(a).length && !('pseudo' in a) && Object.entries(a).every(([k, v]) => h(k, v)));
  const hit = fits((k, v) => carries(attrs, k, v)) || (innerDisabled ? fits((k, v) => carries({ ...attrs, disabled: '' }, k, v)) : undefined);
  const rest = Object.entries(vals).find(([, a]) => a && !Object.keys(a).length);
  return (hit || rest || [])[0];
}

/* A prop the mapping joins to exactly one design prop of its own kind (a boolean to a boolean, a text to a text) takes
   that prop's Figma name, as the design spells it; one already named, an enum (named by its values above), a swap
   (named by the layers it shows) or a name another prop holds is left. Changes props in place. Tested by test-from-code.mjs. */
const JOINED = new WeakSet(); // props joinedNames named, for asFigma's last word on a name two props share
export function joinedNames(props, design, map = {}) {
  const joins = (x, c) => (typeof x === 'string' ? x === c : !!x && (x.code === c || x.arg === c));
  // names taken: one a prop already carries, the names a swap is drawn under (its boolean and its swap), and the
  // convention's name of every other prop, which an unpaired one falls back to in asFigma
  const held = new Set(Object.entries(props).flatMap(([k, p]) => [p.figma, p.showName, p.showName && `${p.showName} swap`, p.swapName, sentence(k)]).filter(Boolean));
  for (const [k, p] of Object.entries(props)) {
    if (p.figma || p.type === 'enum' || p.type === 'swap' || !p.code) continue;
    const hits = Object.entries(design).filter(([dk, q]) => q.type === p.type && joins((map || {})[dk], p.code));
    if (hits.length !== 1) continue;
    const name = hits[0][1].figma || hits[0][0];
    // (its own convention name is no other prop's: it may take a design name spelled so)
    if (held.has(name) && name !== sentence(k)) continue;
    p.figma = name; held.add(name); JOINED.add(p);
  }
  return props;
}

/* A design boolean the mapping draws false by a text left empty (a card's status line, `False: { status: '' }`): the
   code has that boolean, said by whether the text is given. It is read beside the text as a boolean over the same code
   prop: true is the story's words, false the empty text (emptiedArgs), so what it hides is rendered, never taken from
   the mapping. Only one the design shows by default, the story itself starts with words (a docgen's default is not
   drawn) and the mapping says by that one prop (`twice`: false is then more than the empty text). Changes props in place. Tested
   by test-from-code.mjs. */
export function emptyShows(props, design, joins = {}, starts = {}, twice = {}) {
  for (const [k, d] of Object.entries(design || {})) {
    const j = (joins || {})[k];
    if (props[k] || d.type !== 'boolean' || d.default !== true || !(d.shows || []).length || !j || !j.arg || !j.values) continue;
    if (j.values.false !== '' || j.values.true !== undefined) continue;
    const text = Object.values(props).find((p) => p.type === 'string' && p.code === j.arg);
    if (text && !twice[k] && typeof starts[j.arg] === 'string' && starts[j.arg]) props[k] = { type: 'boolean', default: true, code: j.arg, figma: d.figma || k, emptied: starts[j.arg] };
  }
  return props;
}
/* A render's args as the code takes them: emptyShows' booleans as their texts. Shown sends none, so the story's own
   words draw (an address cannot carry every word: 007, a semicolon); `words`: a host with none of its own
   (fragments, drawn from what is sent) is sent them. Tested by test-from-code.mjs. */
export function emptiedArgs(args, props, { words = false } = {}) {
  const out = { ...args };
  for (const p of Object.values(props)) if (p.emptied !== undefined && typeof out[p.code] === 'boolean') { if (!out[p.code]) out[p.code] = ''; else if (words) out[p.code] = p.emptied; else delete out[p.code]; }
  return out;
}
/* Whether a render failed for focus whose own target such a boolean hid (never hover or press, which what is round the
   target takes too; a card focused through its button,
   read with no button): nothing is there to take the state, so it draws as rest. Any other missing target is a wrong
   mapping and still fails. Tested by test-from-code.mjs. */
export function stateHidden(err, asked, props, pseudoOf = {}) {
  return /^state selector matched no element/.test(String(err && err.message)) && !!asked.__state && asked.__state !== 'rest'
    && /focus/.test((pseudoOf[asked.__state] || {}).pseudo || asked.__state)
    && Object.values(props).some((p) => p.emptied !== undefined && asked[p.code] === false);
}
/* The element a state selector names, its last compound. Tested by test-from-code.mjs. */
export function subjectOf(selector) {
  const s = String(selector).trim();
  let depth = 0, quote = null, from = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') i++;
    else if (quote) { if (c === quote) quote = null; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (!depth && /[\s>+~]/.test(c)) from = i + 1;
  }
  return s.slice(from);
}
/* The texts that only such a boolean speaks for, by code prop: the design has the boolean and no text of them, so the
   text is the code's alone. Tested by test-from-code.mjs. */
export function onlyInCode(props, design, joins = {}) {
  const bools = new Set(Object.values(props).filter((p) => p.emptied !== undefined).map((p) => p.code));
  const arg = (j) => (typeof j === 'string' ? j : j && (j.arg || j.code));
  const theirs = ([k, p]) => Object.entries(design || {}).some(([dk, d]) => d.type === 'string' && (dk === k || (p.figma && d.figma === p.figma) || arg((joins || {})[dk]) === p.code));
  return new Set(Object.entries(props).filter((e) => e[1].type === 'string' && bools.has(e[1].code) && !theirs(e)).map(([, p]) => p.code));
}

/* A slot control in the toolkit's own story (the self leg): to-markup's swap of a library component (`placed`) says so,
   with the component it draws where the caller passes nothing. Only this story sets `placed`: a docgen default (a real
   Storybook's `icon = <ChevronDown />`) is no such mark. Tested by test-from-code.mjs. */
export const selfSlotControl = (x) => ({ control: 'slot', ...(x.placed && { placed: x.placed.component }) });
/* A code prop that takes content: a slot, found where a stand-in for it lands; one the self story marks `placed` is read
   at the component it draws by default, with no stand-in (asDesignSwaps then takes the design's swap). Tested by
   test-from-code.mjs. */
/* The reading's own mark taken off every prop of each props map given: no contract written carries `placed`. Tested by
   test-from-code.mjs. */
export function dropPlaced(...maps) { for (const m of maps) for (const p of Object.values(m || {})) delete p.placed; }
export const slotProp = (k, a, must = {}) => ({ type: 'slot', code: k, ...must, ...(a.placed && { placed: true }) });
/* An icon the code takes by name (a string) where the design swaps an instance: the design's swap, one per size where
   the code merged them (to-markup's one `icon` for Icon (16) and Icon (20)); never a key the design holds as another
   kind. So is content the code takes where it draws one of the library's components by default (a slot `placed`),
   where the reading (`read`: its anatomy and variants) draws each layer the design's swap swaps as an instance.
   Returns the props, changed in place. Tested by test-from-code.mjs. */
export function asDesignSwaps(props, design, read = {}) {
  for (const [k, p] of Object.entries(props)) {
    // content the code takes, read at the component it draws by default (`placed`), where the design swaps that layer's
    // instance: the design's swap, only where the reading draws each layer it swaps as an instance (at some combination)
    if (p.type === 'slot' && p.placed) {
      const q = design[k], drawn = (id) => [read.anatomy || {}, ...(read.variants || []).map((v) => v.add || {})].some((a) => (a[id] || {}).kind === 'instance');
      if (q && q.type === 'instance' && (q.swaps || []).length && q.swaps.every(drawn)) props[k] = { type: 'instance', figma: q.figma, swaps: q.swaps, code: p.code };
      else delete p.placed;
      continue;
    }
    if (p.type !== 'string' || (design[k] && design[k].type !== 'instance')) continue;
    const swaps = Object.entries(design).filter(([dk, q]) => q.type === 'instance' && (dk === k || dk.replace(/\d+$/, '') === k));
    if (!swaps.length) continue;
    delete props[k];
    for (const [dk, q] of swaps) props[dk] = { type: 'instance', figma: q.figma, ...(q.swaps && { swaps: q.swaps }), code: p.code };
  }
  return props;
}

/* A placed component's booleans read from whether their layers are drawn in it: only where its main draws that layer
   at the props read so far with the boolean on; where it draws it there at no value (a checkbox's error part, drawn
   only when invalid), being unseen says nothing, and the boolean is left unread. Tested by test-from-code.mjs. */
export function shownRead(fc, w, shown) {
  const out = {};
  for (const [p, v] of Object.entries(shown || {})) {
    const q = fc && Object.values(fc.props || {}).find((x) => x.type === 'boolean' && (x.figma || '') === p);
    if (!q || !q.shows || atProps(fc, { ...w, [p]: true })[q.shows[0]]) out[p] = v;
  }
  return out;
}

/* The swaps a placed component's glyphs go to, by Figma name, each with its glyph: the one that drives a layer drawn at
   these props (a button's Icon (16) or Icon (20), by its size, never both), or one that names no layer; a prop no drawn
   layer of which it drives keeps its default. Its glyph is the first drawn in the layers it drives, where the reading
   found them (`inLayers`, glyphsDrawn's, as the page orders them; one holding none keeps its default: a select's menu slot is not given the
   caret drawn in its field), else the first the instance draws. Tested by test-from-code.mjs. */
export function glyphSwaps(fc, w, glyphs = [], inLayers = []) {
  const M = atProps(fc, w), out = [];
  for (const [k, p] of Object.entries(fc.props)) if (p.type === 'instance' || p.type === 'swap') {
    const driven = (p.swaps || []).filter((l) => M[l] && (M[l].swappedBy ? M[l].swappedBy === k : !Object.entries(fc.props).some(([k2, q]) => k2 !== k && (q.swaps || []).includes(l))));
    const found = inLayers.filter(([l]) => driven.includes(l));
    const g = (found.length ? found.flatMap(([, names]) => names) : glyphs)[0];
    if ((driven.length || !(p.swaps || []).length) && g != null) out.push([p.figma, g]);
  }
  return out;
}

/* A box read back as the shape the design draws there, changed in place: a full-round empty box where the design has
   an ellipse; an empty box with no auto layout where it has another shape, not an icon (a divider, a swatch:
   to-markup writes a shape as an empty element, which draws as a box). Tested by test-from-code.mjs. */
/* The prop a read text binds to: one whose words it holds; of two holding the same words (a value's and a suffix's
   "Label"), the one the design sets this layer with: the design prop the mapping joins to it (`joined`, design key to
   its code prop), else of the same name. Tested by test-from-code.mjs. */
export function boundText(content, id, props, args, design, joined = {}) {
  const hits = Object.entries(props).filter(([, q]) => q.type === 'string' && (args[q.code] ?? q.sample) === content);
  // (effectiveProps' shapes: a drivable prop's code name; a text's { code, fixed }; one no code prop joins, { missing })
  const codeOf = (k) => { const j = joined[k]; return typeof j === 'string' ? j : j && typeof j === 'object' && (j.code || j.arg) ? j.code || j.arg : j && j.missing ? null : k; };
  const sets = (q) => Object.entries((design || {}).props || {}).some(([k, d]) => codeOf(k) === q.code && (d.sets || []).includes(id));
  // (one the design sets on other layers only is not this text's: a placed message's own "Label", beside a card's label)
  const elsewhere = (q) => Object.entries((design || {}).props || {}).some(([k, d]) => codeOf(k) === q.code && (d.sets || []).length && !(d.sets || []).includes(id));
  return (hits.find(([, q]) => sets(q)) || hits.find(([, q]) => !elsewhere(q)) || [])[0];
}

/* Whether a layer's name is its own: not the one its id spells back (layers.mjs partName: Action footer at actionFooter,
   or at actionFooter_2), derive's own test for leaving it unsaid. Tested by test-from-code.mjs. */
/** The mode keys an element may carry as `data-<key>` (tools/tokens/modes.cjs `attribute`): the axes of the project's
 *  tokens, and every key the official contract sets a mode under (its parts' own, and what a variant sets), as
 *  derive keys a collection the tokens lack (modes.cjs `keyed`) and to-markup writes it. */
export function modeKeysOf(axes, contract) {
  const set = new Set((axes || []).map((a) => a.key));
  for (const e of Object.values((contract && contract.anatomy) || {})) for (const k of Object.keys((e && e.modes) || {})) set.add(k);
  for (const v of (contract && contract.variants) || []) for (const [p, m] of Object.entries(v.set || {})) if (/\.modes$/.test(p)) for (const k of Object.keys(m || {})) set.add(k);
  return [...set];
}

export const keepsName = (name, id) => partName(id) !== name;

/* The CSS each field of a placed instance's own styling is read from (from-code's walk, boxStyling), for asking whose
   rule wrote it. */
export const INSTANCE_CSS = {
  background: ['background-color', 'background-image', 'background'], paint: ['background-image', 'background'],
  layout: ['justify-content', 'align-items', 'flex-direction', 'gap', 'row-gap', 'column-gap', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding'],
  radius: ['border-top-left-radius', 'border-radius'], full: ['border-top-left-radius', 'border-radius'], cornerShape: ['corner-top-left-shape', 'corner-shape'],
  border: ['border-top-width', 'border-top-color', 'border-top', 'border', 'border-width', 'border-color', 'box-shadow'],
  shadow: ['box-shadow'], shadowAll: ['box-shadow'], ringsUsed: ['box-shadow'], overflow: ['overflow'], opacity: ['opacity'], mixBlend: ['mix-blend-mode'],
  ownOutline: ['outline-color', 'outline-width', 'outline-style', 'outline'],
};
// (an outline that reads the ring knob first, `var(--<prefix>ring, …)`, is to-code's focus ring (ringOf), never a stroke)
export const ringKnobbed = (v) => /var\(\s*--[\w-]*ring\s*,/.test(String(v || ''));

/* The selectors of a list, each as written and as its compounds in order (`.a > .b:where([x="1 2"]) .c` → .a,
   .b:where([x="1 2"]), .c): split at the top level only, never inside brackets, parentheses or quotes. Self-contained,
   so it runs in the page too (writtenByHolder takes its source). */
export function selectorParts(list) {
  const out = []; let sel = '', cs = [], cur = '', depth = 0, quote = null;
  const word = () => { if (cur.trim()) cs.push(cur.trim()); cur = ''; };
  const done = () => { word(); if (cs.length) out.push({ text: sel.trim(), compounds: cs }); sel = ''; cs = []; };
  for (const ch of list) {
    if (quote) { cur += ch; sel += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; sel += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (depth === 0 && ch === ',') { done(); continue; }
    sel += ch;
    if (depth === 0 && /[\s>+~]/.test(ch)) { word(); continue; }
    cur += ch;
  }
  done();
  return out;
}

/* In the page: whether a rule's selector list reaches the element through the component read (its root matches a
   compound before the last of a selector the element matches): this component's rule on a placed instance, not the
   instance's own. `parts` is selectorParts of the list, worked out beside the page. */
export function writtenByHolder(parts, elSel, rootSel) {
  const el = document.querySelector(elSel), root = document.querySelector(rootSel);
  if (!el || !root) return false;
  const ok = (q, n) => { try { return n.matches(q); } catch { return false; } };
  return parts.some((p) => ok(p.text, el) && p.compounds.slice(0, -1).some((c) => ok(c, root)));
}

/* A glyph read as the instance of a component this library holds (asIcon) keeps no colour that component draws its glyph
   in itself (derive's glyphColour, the colour to-code writes on it): that is the component's own, no override, as an
   instance's styling equal to its component's root is (ownStyling). Atlassian's Slot, placed in a banner's and a top
   nav's slots: its magenta placeholder fill, drawn by Slot itself, read back as the instance's background. At each
   variant's props too. `e` the reading's instance at `id`, `variants` the reading's; `mains` resolves a component. */
export function dropOwnGlyph(id, e, variants, mains) {
  if (!e || e.kind !== 'instance' || !e.component) return;
  const { glyphColour } = req('./derive.cjs');
  // what the component placed draws its glyph in, under the props it is given (`with`, replaced whole by a variant as
  // applyTo does, null for none)
  const own = (component, key, w) => { const m = mains(component, key); return m ? glyphColour(m, w || undefined) : undefined; };
  if (e.background != null && e.background === own(e.component, e.key, e.with)) delete e.background;
  for (const v of variants || []) {
    const s = v.set || {}, b = s[`${id}.background`];
    if (b == null) continue;
    // against the component this variant places there (a swap), with the props it gives it
    const at = (f) => (`${id}.${f}` in s ? s[`${id}.${f}`] : e[f]);
    if (b !== own(at('component'), at('key'), at('with'))) continue;
    // back to the component's own: none where the base says none, else said as null, so it does not keep the base's
    if (e.background == null) delete s[`${id}.background`]; else s[`${id}.background`] = null;
  }
}

/* An enum's design name from the code's mapping (tools/parity/REFERENCE.md, The mapping format: `axes`, keyed by the
   design's prop name; to-markup's toParity writes it): the one axis whose options move that prop's arg alone, a
   pointer state's pseudo-class beside it; a prop already named, or one two axes move, keeps its own. Tested by
   test-from-code.mjs. */
export function axisNames(props, axes) {
  const opts = (t) => (t && typeof t === 'object' ? Object.values(t) : []);
  // (an axis that moves nothing, a one-value enum's, is that prop's where its options are the prop's values, said alike)
  const word = (v) => String(v).toLowerCase().replace(/[^a-z0-9]/g, '');
  const stillAxis = (t, p) => opts(t).every((o) => !Object.keys(o).length) && JSON.stringify(Object.keys(t).map(word).sort()) === JSON.stringify(p.values.map(word).sort());
  for (const p of Object.values(props)) {
    if (p.type !== 'enum' || p.figma || !p.code) continue;
    const hits = Object.entries(axes || {}).filter(([, t]) => opts(t).length && opts(t).every((o) => o && typeof o === 'object' && Object.keys(o).every((k) => k === p.code || k === 'pseudo'))
      && (opts(t).some((o) => p.code in o) || stillAxis(t, p)) && opts(t).every((o) => !(p.code in o) || p.values.map(String).includes(String(o[p.code]))));
    if (hits.length === 1) p.figma = hits[0][0];
  }
  return props;
}

/* A padding the code writes (to-code's `padding: 0`, or a token that holds 0), which the computed style cannot tell from
   one left unset: its four sides of 0 where any side is written (`authored`, each side's value as written, or null) and
   none was read already. Its tokens are then read as the code wrote them. Tested by test-from-code.mjs. */
export function paddingSaid(read, authored) {
  if (read) return null;
  return Object.values(authored || {}).some((v) => v != null && String(v).trim() !== '') ? { top: 0, end: 0, bottom: 0, start: 0 } : null;
}

/* Each placed component's key from what the code places (`others`: the code's name for it, the module's folder, to the
   name the reading gives the instance), as that module says it draws it (`figmaOf`, codeFigma); none where it says no
   key. Tested by test-from-code.mjs. */
export function codeKeys(others, figmaOf) {
  const out = {};
  for (const [code, fig] of Object.entries(others || {})) { const f = figmaOf && figmaOf(code); if (f && f.key) out[fig] = fig in out && out[fig] !== f.key ? null : f.key; }
  return Object.fromEntries(Object.entries(out).filter(([, k]) => k));
}

/* The component's name as the code declares it, its module's label (codeFigma), or the folder where it declares none.
   A declared name is identity the code states, as Code Connect's, not a measurement: `declared`, never assisted. */
export function codeName(folder, figmaOf) {
  const said = figmaOf && (figmaOf(folder) || {}).component;
  return said ? { component: said, declared: true } : { component: folder, declared: false };
}

/* Each placed instance's key: the one its placed module declares (`fromCode`, codeKeys), else the library contract's
   (`fromLibrary`), taken from the design and tagged placed-key in `A`. True where any key was declared. */
export function keyInstances(anatomy, fromCode, fromLibrary, A) {
  let declared = false;
  for (const [hid, h] of Object.entries(anatomy)) {
    if (h.kind !== 'instance' || h.key) continue;
    if (fromCode[h.component]) { h.key = fromCode[h.component]; declared = true; }
    else if (fromLibrary[h.component]) { h.key = fromLibrary[h.component]; A.add('placed-key', `anatomy.${hid}.key`); }
  }
  return declared;
}

/* Whether a layer the expanded design `f` leaves out sits inside an instance it places and lists nothing inside: its
   component draws it (one whose insides the design lists, kept whole, leaves out a layer it hides). */
export const placedOver = (f, id) => { for (let i = id.lastIndexOf('/'); i > 0; i = id.lastIndexOf('/', i - 1)) { const at = id.slice(0, i), up = f[at]; if (up) return up.kind === 'instance' && !Object.keys(f).some((k) => k.startsWith(at + '/')); } return false; };
/* What a generated module says it draws (to-markup's `export const figma = {…}`): the design component's name, read from
   the code's text, or null where it says nothing. Tested by test-from-code.mjs. */
export function codeFigma(js) {
  const m = /^export const figma = (\{.*\});$/m.exec(String(js || ''));
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/* The key a reading's icon instance takes: the design's own, from the instance it places at that layer (or, for another
   glyph of the set, any instance of that name the design places). An instance named without its key resolves by name,
   so an icon that shares a component's name (Carbon's Checkbox glyph inside the Checkbox set) would become that
   component, and a component that places itself recurses without end when drawn again. */
export function designKeyOf(design, fe, name) {
  if (fe && fe.component === name) return fe.key || null;
  const all = [design.anatomy || {}, ...(design.variants || []).map((v) => v.add || {})].flatMap((a) => Object.values(a));
  // (a variant's swap, `<id>.component` with its `<id>.key` beside it, places one too)
  const swaps = (design.variants || []).flatMap((v) => Object.entries(v.set || {}).filter(([k, x]) => k.endsWith('.component') && x === name).map(([k]) => (v.set || {})[`${k.slice(0, -'.component'.length)}.key`]));
  const keys = [...new Set([...all.filter((x) => x.kind === 'instance' && x.component === name && x.key).map((x) => x.key), ...swaps.filter(Boolean)])];
  return keys.length === 1 ? keys[0] : null;
}

/* Whether the design sets the colour of the placed icon at `id`: on the instance itself, or on a layer inside it, in its
   anatomy, a variant's set or a variant's added layers. A layer inside a component the library holds no contract for
   (`mainOf` finds none: an icon set's, Atlassian's Epic) is that component's own drawing, never an override the design
   makes here: eval.mjs leaves those insides to code (inForeign), so its colour sets nothing, but for its lone glyph straight
   under it, whose colour roundTrip compares as the instance's (to-figma glyph). Where the library holds the
   component, the snapshot keeps only what differs from it inside, so a colour there is the design's. */
// (a glyph's own words, as to-figma's glyph() moves its colour up only when it says nothing else: rules.mjs GLYPH_WORDS)
const PLACE = GLYPH_WORDS;
export function designSetsColour(design, id, mainOf = () => null) {
  const all = Object.assign({}, ...[...(design.variants || [])].reverse().map((v) => v.add || {}), design.anatomy || {});
  const foreign = (el) => (all[el] || {}).kind === 'instance' && !mainOf(all[el].component, all[el].key);
  const loneGlyph = (at, k) => { const inside = Object.keys(all).filter((x) => x.startsWith(`${at}/`)); return inside.length === 1 && inside[0] === k && (all[k] || {}).kind === 'graphic' && Object.keys(all[k]).every((f) => PLACE.has(f)); };
  // (k is id or under it; it counts unless an instance from id down to its parent is a foreign one)
  const counts = (k) => {
    if (k !== id && !k.startsWith(`${id}/`)) return false;
    const segs = k.split('/'), from = id.split('/').length;
    for (let i = from; i < segs.length; i++) {
      const at = segs.slice(0, i).join('/');
      // (but a foreign icon's lone glyph straight under it: roundTrip compares its colour as the instance's, to-figma glyph)
      if (foreign(at) && !(i === segs.length - 1 && loneGlyph(at, k))) return false;
    }
    return true;
  };
  return Object.entries(design.anatomy || {}).some(([k, x]) => counts(k) && x.background != null)
    || (design.variants || []).some((v) => Object.keys(v.set || {}).some((k) => /\.background$/.test(k) && counts(k.split('.')[0])) || Object.entries(v.add || {}).some(([k, x]) => counts(k) && x.background != null));
}

/* The key a variant's swap of a read glyph says: the design's (designKeyOf), else null where the base instance has one
   (expand keeps a field no variant sets, so the swapped glyph would carry the base icon's key), else none (undefined). */
export const swapKeyOf = (design, baseKey, name) => designKeyOf(design, null, name) || (baseKey ? null : undefined);

/* A box's padding as the contract's sides, from its computed style: start and end by its direction (right to left, the
   start is the right edge), as the design's start is the reading edge; `px` reads a length. Self-contained: run in the
   page (from-code's walk). With paddingCss, the property each side's token is read from. Tested by test-from-code.mjs. */
export function paddingOf(s, px) {
  const rtl = s.direction === 'rtl';
  return { top: px(s.paddingTop), end: px(rtl ? s.paddingLeft : s.paddingRight), bottom: px(s.paddingBottom), start: px(rtl ? s.paddingRight : s.paddingLeft) };
}
/* A flex box's direction and gaps from its computed style: the gap along the flow (a row's the column gap, a column's
   the row gap; the gap shorthand computes as both, row first) and, wrapped, the one between its lines, the contract's
   crossGap; normal is 0. Self-contained: run in the page (from-code's walk). Tested by test-from-code.mjs. */
export function flowOf(s, px) {
  const col = /column/.test(s.flexDirection), g = (v) => (v === 'normal' ? 0 : px(v));
  return { direction: col ? 'column' : 'row', gap: g(col ? s.rowGap : s.columnGap), ...(/^wrap/.test(s.flexWrap) && { crossGap: g(col ? s.columnGap : s.rowGap) }) };
}
export const paddingCss = (rtl) => ({ top: 'padding-top', end: rtl ? 'padding-left' : 'padding-right', bottom: 'padding-bottom', start: rtl ? 'padding-right' : 'padding-left' });

/* The effect style a whole box-shadow is: the one the code names, where it draws the layers read (their offsets, blur,
   spread and insetness) in colours its layers' variables take in some mode (the style's record holds one mode's only:
   `coloursOf(layer)`, every colour a style layer can take, its own where it binds none), else the first whose layers
   draw the same, colour and all. A named style drawn in a colour none of its modes give (a custom property of the
   code's own over it) is matched by value, so the difference shows. `layers`: the shadow read, as cssShadows gives it;
   `key`: shadowKey. Tested by test-from-code.mjs. */
export function wholeShadowStyle(layers, named, effects, key, coloursOf = (l) => [l.color]) {
  const of = (fx) => (fx.layers || []).filter((l) => /SHADOW/.test(l.type)).map((l) => ({ inset: l.type === 'INNER_SHADOW', x: l.x, y: l.y, blur: l.blur, spread: l.spread, color: l.color, ...(l.bound && { bound: l.bound }) }));
  if (named) {
    const own = of(named);
    const fits = own.length && own.length === layers.length && own.every((l, i) => coloursOf(l).some((c) => key([{ ...l, color: c }]) === key([layers[i]])));
    if (fits) return named;
  }
  return effects.find((fx) => key(of(fx)) === key(layers));
}

/* Whether a placed instance's field is this component's own drawing: a rule of this component's reaching the instance
   (`byHolder`, writtenByHolder over the winning rule's `selector`), or an opacity written inline on it (`inline`, the
   winning declaration's value where no rule's selector won), which no placed component's own sheet writes. */
export function instanceWrites(field, selector, byHolder, inline = null) {
  return !!(selector && byHolder) || (field === 'opacity' && !selector && inline != null);
}

// (`here`: the part as the design draws it at the combination read, where it draws it there: a variant that takes its
// rectangle away leaves a shape of no kind, as derive reads a vector; `fa`, the design's part, still says whether to ask)
export function asShape(x, fa, hasChildren, here = null) {
  if (fa && here) fa = here;
  if (x.kind !== 'container' || !fa || fa.kind !== 'graphic' || hasChildren) return x;
  if (fa.shape === 'ellipse') { if (x.full) { x.kind = 'graphic'; x.shape = 'ellipse'; delete x.radius; delete x.full; delete x.layout; } }
  else if (!fa.icon && !x.layout) { x.kind = 'graphic'; if (fa.shape) x.shape = fa.shape; delete x.layout; }
  return x;
}

// a token whose value paints nothing (rgba(…, 0), rgb(… / 0), #rrggbb00, transparent): the browser reads no fill there
const seeThroughIn = (value, t) => { const v = String(value(t) ?? ''); return /rgba?\((?:[^,)]*,){3}\s*0(\.0+)?%?\s*\)$|\/\s*0(\.0+)?%?\s*\)$|^\s*transparent\s*$/i.test(v) || /^#[0-9a-f]{6}00$/i.test(v) || /^#[0-9a-f]{3}0$/i.test(v); };

/* Whether a name is a token: by its path, or, at the top of its collection (no group, so no slash: a radius named None),
   by having a value, as a word (mixed, hug) has none. `value` a token's value by its name (the name itself, or
   undefined, where it is none). One test for every reader here. */
const isToken = (t, value) => typeof t === 'string' && (t.includes('/') || ![undefined, t].includes(value(t)));

export function zeroTokens(e, fe, value, { fill = false } = {}) {
  const token = (t) => isToken(t, value);
  const val = (t) => (token(t) ? value(t) : t);
  const unbound = (v) => v == null || typeof v === 'number';
  const zeroish = (t) => { const v = val(t); return v === 0 || v === '0'; };
  const at = (o, path) => path.reduce((x, k) => (x == null ? x : x[k]), o);
  const put = (o, path, v) => { let x = o; for (const k of path.slice(0, -1)) x = x[k] = x[k] || {}; x[path.at(-1)] = v; };
  for (const path of [['radius'], ['layout', 'gap'], ['layout', 'crossGap'], ...['top', 'end', 'bottom', 'start'].map((k) => ['layout', 'padding', k])]) {
    const want = at(fe, path), have = at(e, path);
    if (path[0] === 'layout' && !e.layout) continue;
    // a 0 the design leaves unbound, where the code says none: 0 on that side (a slot's padding), as the code renders it
    if (want === 0 && have == null) {
      if (path[1] === 'padding' && !e.layout.padding) e.layout.padding = { top: 0, end: 0, bottom: 0, start: 0 };
      put(e, path, 0); continue;
    }
    if (!token(want) || !unbound(have)) continue;
    // a padding the code leaves unset is 0 on every side: each side said, not only those the design binds
    if (path[1] === 'padding' && !e.layout.padding) e.layout.padding = { top: 0, end: 0, bottom: 0, start: 0 };
    if (have == null ? zeroish(want) : val(want) === have) put(e, path, want);
  }
  // inside a placed component (`fill`), a fill its component binds to a see-through token (a ghost button's rest) the
  // browser reads as none: that token. (Not on this component's own parts, whose design may draw no fill at some props,
  // a drop area's while dragging: the compare rows say those)
  if (fill && e.background == null && token(fe.background) && seeThroughIn(value, fe.background)) e.background = fe.background;
  return e;
}

/* Stacking first on top as the design does, where the code's children cannot overlap (no gap below 0 at any
   combination, read by the number it leads with: 16px, a token written 16px (1rem); none placed absolutely where the
   design places none): then the order they paint in shows nowhere and the code renders the same either way. Held per combination the design draws, on what each combination expands to,
   so a part a variant adds, a layout a variant sets whole and one the design stacks at some props only all take the
   design's there and no other: each layout the contract writes takes what its combinations want, and a combination
   that wants otherwise than the rest of its layout's gets a layer of its own. `code` is changed in place. */
export function stackLikeDesign(code, design, value) {
  const val = (t) => (isToken(t, value) ? value(t) : t);
  // (no more combinations than derive draws, 4096: past that the layouts are left as written, said by the rows)
  const axes = Object.entries(design.props || {}).filter(([, q]) => q.type === 'enum' || q.type === 'boolean').map(([k, q]) => [k, q.type === 'enum' ? q.values : [true, false]]);
  if (axes.reduce((n, [, vs]) => n * vs.length, 1) > 4096) return code;
  let combos = [{}];
  for (const [k, vs] of axes) combos = combos.flatMap((c) => vs.map((v) => ({ ...c, [k]: v })));
  combos = combos.filter((c) => !(design.invalid || []).some((w) => Object.entries(w).every(([k, v]) => String(c[k]) === String(v))));
  const vars = code.variants || (code.variants = []);
  // a child placed absolutely where the design places none (a focus ring the design places too paints as it stacks it)
  const placedToo = (cid) => [design.anatomy || {}, ...(design.variants || []).map((v) => v.add || {})].some((a) => (a[cid] || {}).position === 'absolute');
  const loose = (id) => [code.anatomy, ...vars.map((v) => v.add || {})].some((a) => Object.entries(a).some(([cid, c]) => c.parent === id && c.position === 'absolute' && !placedToo(cid)))
    || vars.some((v) => Object.entries(v.set || {}).some(([f, x]) => /\.position$/.test(f) && x === 'absolute' && ((code.anatomy[f.slice(0, -9)] || {}).parent === id) && !placedToo(f.slice(0, -9))));
  // every layout the contract writes, marked so each combination's expanded layout names the one it came from
  const sources = [];
  const mark = (l) => { if (!l || typeof l !== 'object') return; if (!sources.includes(l)) sources.push(l); Object.defineProperty(l, '__src', { value: sources.indexOf(l), enumerable: true, configurable: true }); };
  for (const e of Object.values(code.anatomy)) mark(e.layout);
  for (const v of vars) { for (const e of Object.values(v.add || {})) mark(e.layout); for (const [k, l] of Object.entries(v.set || {})) if (k.endsWith('.layout')) mark(l); }
  // each combination in the code's words, as the round trip compares them (to-figma's inWordsOf)
  const theirs = combos.map(inWordsOf(design, code));
  const C = theirs.map((c) => expand(code, { ...variantDefaults(code), ...c })), D = combos.map((c) => expand(design, { ...variantDefaults(design), ...c }));
  for (const l of sources) delete l.__src;
  const ids = [...new Set(C.flatMap((x) => Object.keys(x)))];
  const wants = new Map(); // source → [[combo index, id, want]]
  for (const id of ids) {
    if (loose(id) || C.some((x) => x[id] && x[id].layout && x[id].layout.gap != null && !(parseFloat(val(x[id].layout.gap)) >= 0))) continue;
    C.forEach((x, i) => {
      const l = x[id] && x[id].layout, dl = D[i][id] && D[i][id].layout;
      if (!l || !dl || l.__src == null) return;
      wants.set(l.__src, [...(wants.get(l.__src) || []), [i, id, !!dl.firstOnTop]]);
    });
  }
  const set = (l, w) => { if (w) l.firstOnTop = true; else delete l.firstOnTop; };
  const own = new Map(); // combo index → its own layer
  for (const [s, list] of wants) {
    const yes = list.filter((x) => x[2]).length, w = yes * 2 >= list.length;
    set(sources[s], w);
    for (const [i, id, want] of list) {
      if (want === w) continue;
      // (said in the code's props alone: a design prop the code has none for would match no combination)
      if (!own.has(i)) { const layer = { when: Object.fromEntries(Object.entries(theirs[i]).filter(([k]) => k in (code.props || {}))), set: {} }; vars.push(layer); own.set(i, layer); }
      const { __src: _, ...l } = C[i][id].layout;
      set(l, want);
      own.get(i).set[`${id}.layout`] = l;
    }
  }
  return code;
}

/* What a render changes against the default one, as a variant layer's set/add/remove. A field the default has and
   this render lacks (a tertiary button's fill and shadow) is set to null: left undefined, JSON dropped it and the
   drawing kept the default's. */
export function delta(base, other, def = base) {
  const set = {}, add = {}, remove = [];
  for (const [id, e] of Object.entries(other)) {
    if (!base[id]) { add[id] = e; continue; }
    // a corner the code rounds only to shape a focus outline belongs to the ring the design draws, not the box
    // (one the default render lacks: an outline it always has is the box's own, its corners included)
    // (a ring under the design's own name too, ringKeyOf's: the render lists the rings it read from outlines, `rings`)
    const ringed = Object.entries(other).some(([r, y]) => y.parent === id && !def[r] && (/(^|\/)focusRing$/.test(r) || (other.rings || []).includes(r)));
    for (const k of new Set([...Object.keys(base[id]), ...Object.keys(e)])) if (!(ringed && k === 'radius') && (JSON.stringify(base[id][k]) !== JSON.stringify(e[k]))) set[`${id}.${k}`] = e[k] === undefined ? null : e[k];
  }
  for (const id of Object.keys(base)) if (!other[id]) remove.push(id);
  return { ...(Object.keys(set).length && { set }), ...(Object.keys(add).length && { add }), ...(remove.length && { remove }) };
}

/* The code's contract in the house's Figma conventions (figma-standard), so
   that it reads as the one derive.cjs would read from a Figma component:
   - an enum's values and name take the token vocabulary (figma-standard rule 22): where each
     value's tokens share one path segment no other value's do (Danger, Info,
     Neutral), that segment is the value, and the segment the most of them
     share just before it the prop (Feedback). Not where that segment is a
     token's leaf (primary, secondary: an emphasis, never a category), and
     not otherwise: the code's words stay;
   - names in sentence case (figma-standard rule 18): showAvatar → Show avatar;
   - a swap that can show nothing is a boolean that shows the element and,
     beside it, the swap (figma-standard rule 5);
   - props first, then the axes in the order the house settings give (axisOrder, figma-standard rule 1).
   `renamed` lists every change, so a reader can see what the code said. */
export function asFigma(contract, { axisOrder = [] } = {}) {
  const renamed = [];
  const props = {}, valueMap = {}, joined = [];
  const tokensOf = (anatomy) => Object.values(anatomy).flatMap((e) => [e.background, e.color].filter((t) => typeof t === 'string' && t.includes('/')));
  for (const [k, p] of Object.entries(contract.props)) {
    // one that took the design's name (and so its values) keeps them: the token words are the code's guess at them
    if (p.type === 'enum' && p.role !== 'interaction' && !p.figma) {
      // each value's tokens: the default's from the anatomy, the others' from what their layer sets
      const of = (v) => (v === p.default ? tokensOf(contract.anatomy) : contract.variants.filter((x) => Object.keys(x.when).length === 1 && x.when[k] === v).flatMap((x) => Object.values(x.set || {}).filter((t) => typeof t === 'string' && t.includes('/'))));
      const segs = Object.fromEntries(p.values.map((v) => [v, of(v)]));
      const common = Object.fromEntries(p.values.map((v) => [v, segs[v].length ? segs[v].map((t) => new Set(t.split('/'))).reduce((a, b) => new Set([...a].filter((x) => b.has(x)))) : new Set()]));
      const own = Object.fromEntries(p.values.map((v) => [v, [...common[v]].filter((x) => p.values.filter((u) => u !== v).every((u) => !common[u].has(x)))]));
      // a value that is a token's leaf is an emphasis (primary, secondary), not a vocabulary word:
      // Brand/primary against Brand/secondary names no category, and the code's words stay
      const leaf = p.values.some((v) => segs[v].some((t) => t.split('/').at(-1) === own[v][0]));
      if (p.values.every((v) => own[v].length === 1) && !leaf) {
        const before = {};
        for (const v of p.values) for (const t of segs[v]) { const parts = t.split('/'); const i = parts.indexOf(own[v][0]); if (i > 0) before[parts[i - 1]] = (before[parts[i - 1]] || 0) + 1; }
        const name = Object.entries(before).sort((a, b) => b[1] - a[1])[0]?.[0] || sentence(k);
        valueMap[k] = Object.fromEntries(p.values.map((v) => [v, own[v][0].toLowerCase()]));
        for (const v of p.values) if (valueMap[k][v] !== v) renamed.push(`${k} ${v} → ${name} ${valueMap[k][v]}`);
        const key = name[0].toLowerCase() + name.slice(1).replace(/\s+(.)/g, (_, c) => c.toUpperCase());
        if (key !== k) renamed.push(`${k} → ${name}`);
        props[key] = { type: 'enum', values: p.values.map((v) => valueMap[k][v]), default: valueMap[k][p.default], figma: name, code: p.code };
        valueMap[k].__key = key;
        continue;
      }
    }
    if (p.type === 'swap' && p.shows) {
      // the design's names where it shows and swaps the same layer (Show icon, Icon (20)), else the layer's
      // a design name another prop already holds is not taken: two props under one key lose one
      const free = (key) => !props[key] && !(key !== k && contract.props[key]);
      const keyOf = (n) => n[0].toLowerCase() + n.slice(1).replace(/\s+(.)/g, (_, c) => c.toUpperCase());
      const own = sentence(p.shows[0].split('/').pop());
      const shown = p.showName && free(keyOf(p.showName)) ? p.showName : own;
      const bkey = keyOf(shown);
      const adopted = p.swapName && camel(p.swapName.replace(/[()]/g, ' ').trim());
      const named = adopted && adopted !== bkey && free(adopted);
      const swapName = named ? p.swapName : `${shown} swap`;
      const skey = named ? adopted : `${bkey}Swap`;
      props[bkey] = { type: 'boolean', default: !NONE.test(p.default), figma: shown, shows: p.shows, code: p.code };
      // under the design's swap name, as the design states it: an instance property naming the layers it swaps
      props[skey] = named ? { type: 'instance', default: p.glyph || p.default, figma: swapName, swaps: p.shows, code: p.code } : { type: 'swap', default: p.glyph || p.default, figma: swapName, code: p.code };
      renamed.push(`${k} → ${shown} (boolean) + ${swapName}`);
      valueMap[k] = { __key: bkey, __swap: true };
      continue;
    }
    // an enum under the design's name (variant is the design's Hierarchy): keyed by it, its values as they are
    if (p.type === 'enum' && p.figma) {
      const key = p.figma[0].toLowerCase() + p.figma.slice(1).replace(/\s+(.)/g, (_, c) => c.toUpperCase());
      if (props[key] || (key !== k && contract.props[key])) { props[k] = { ...p, figma: sentence(k) }; continue; }
      if (key !== k) renamed.push(`${k} → ${p.figma}`);
      props[key] = { ...p };
      valueMap[k] = { ...Object.fromEntries(p.values.map((v) => [v, v])), __key: key };
      continue;
    }
    // a prop that took the design's own name keeps it; the rest are named by the house's convention
    props[k] = { ...p, figma: p.figma || sentence(k) };
    if (JOINED.has(p)) joined.push(k);
  }
  // a design name joinedNames gave that another prop is drawn under after all goes back to the convention, as before the
  // join: two props under one Figma name lose one when drawn (to-figma keys them by it)
  for (const k of joined) if (Object.entries(props).some(([o, q]) => o !== k && q.figma === props[k].figma)) props[k] = { ...props[k], figma: sentence(k) };
  // figma-standard rule 1's order: props and booleans, then the axes the house orders (audit-settings
  // axisOrder, by the contract's own spelling of them), then the rest of the enums
  const AXES = axisOrder.map(camel);
  const rank = ([k, p]) => (p.type !== 'enum' ? -1 : AXES.includes(k) ? AXES.indexOf(k) : AXES.length);
  const ordered = Object.fromEntries(Object.entries(props).map((e, i) => [e, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([e]) => e));
  const variants = contract.variants.map((x) => {
    const when = {};
    for (const [k, v] of Object.entries(x.when)) {
      const m = valueMap[k];
      if (m && m.__swap) when[m.__key] = !NONE.test(v);
      else if (m) when[m.__key] = m[v];
      else when[k] = v;
    }
    return { ...x, when };
  });
  // a layer inside a placed component keeps no constraints, as derive keeps none in the design's
  // (figma-fact: no-nested-position-override); one placed absolutely, or a glyph's scale both ways, keeps them
  const all = { ...contract.anatomy, ...Object.assign({}, ...variants.map((v) => v.add || {})) };
  const inside = (id) => { for (let up = (all[id] || {}).parent; up; up = (all[up] || {}).parent) if ((all[up] || {}).kind === 'instance') return true; return false; };
  // (nor a place in its frame: the component's too; one placed absolutely in an auto layout, position absolute, keeps it)
  const framed = (e) => e.position !== 'absolute';
  const loose = (e) => (framed(e) || !e.absolute) && !(e.constraints && e.constraints.horizontal === 'scale' && e.constraints.vertical === 'scale');
  const one = (id, e) => { if (!inside(id)) return e; const { absolute, constraints, ...rest } = e; return { ...rest, ...(absolute && !framed(e) && { absolute }), ...(constraints && !loose(e) && { constraints }) }; };
  const strip = (anatomy) => Object.fromEntries(Object.entries(anatomy).map(([id, e]) => [id, one(id, e)]));
  // (a variant's own: what it sets of the element, its parent, position and place, over the element)
  const asIn = (v, id) => { const e = { ...(all[id] || {}), ...((v.add || {})[id] || {}) }; for (const f of ['parent', 'position', 'absolute', 'constraints']) if (`${id}.${f}` in (v.set || {})) e[f] = v.set[`${id}.${f}`]; return e; };
  const insideIn = (v, id) => { for (let up = asIn(v, id).parent; up; up = asIn(v, up).parent) if (asIn(v, up).kind === 'instance') return true; return false; };
  const gone = (v, k) => { const m = /^(.+)\.(constraints|absolute)(\.|$)/.exec(k); if (!m || !insideIn(v, m[1])) return false; const e = asIn(v, m[1]); return m[2] === 'absolute' ? framed(e) : loose(e); };
  const kept = variants.map((v) => ({ ...v, ...(v.add && { add: strip(v.add) }), ...(v.set && { set: Object.fromEntries(Object.entries(v.set).filter(([k]) => !gone(v, k))) }) }));
  return { contract: { ...contract, anatomy: strip(contract.anatomy), props: ordered, variants: kept }, renamed };
}

/* ---- where the code is opened ---- */

/*
 * A component's code, opened the one way for every project (tools/parity:
 * loadParity, then the engine's session and its host), whoever governs it.
 * What the run below asks of it:
 *
 *   render(args, state)  the component on screen with those args, a pointer
 *                        state forced where one is asked; `container` holds it
 *   api()                the code's own props: { args, argTypes } — a story's
 *                        controls, or, where the host declares none, the
 *                        mapping's `controls`
 *   root, pseudoOf       where it starts, and each pointer state: its pseudo class and the element it is forced on
 *   elements(figma)      each Figma element the mapping (or the rule) places, by selector
 *   joins(figma, argTypes)  which code prop does each Figma prop's job
 *   argsOf(when)         the args that draw a combination of Figma's props
 *
 * A library built elsewhere is compared: its mapping is sparse and joined by
 * rule (tools/parity/external.mjs). A repo whose code follows the design is
 * governed: its mapping states every variant's args, so a combination's args
 * are read off it and nothing is guessed.
 */
/* A pointer state forced where the mapping says that state is taken (`on`, a selector in the page), then
   held until its transitions have run: what both kinds of source do after a render. */
async function forceAt(tab, at) {
  // a render at rest releases what the last one forced: fetching the document again drops every forced state
  // (shared/cdp.mjs forceState), which matchedLevels no longer does on each read
  if (!at || !at.on) { await tab.send('DOM.getDocument', { depth: 0 }); return; }
  const { forceState, waitFor } = await import('../shared/cdp.mjs');
  await forceState(tab, [{ selector: at.on, pseudo: at.pseudo }]);
  await waitFor(tab, 'document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity)', { timeout: 3000 }).catch(() => {});
}

/* Whether the self page can take the next render without loading again (run in the page): loaded, and nothing left
   outside its stage. A pointer state the last render forced is no reason (the render lets it go). Tested by
   test-from-code.mjs. */
export const pageReusable = () => !!window.ready && document.body.childElementCount === window.bodyAt;

export async function openSource(label, name, { rebuild, codeOnly, self, second } = {}) {
  // (the round trip's legs read against a design, the one a code-only read has none of)
  if (codeOnly && (self || second)) throw Object.assign(new Error('from-code: --code-only reads a component with no design, and --self and --second read against one: give one of them'), { usage: true });
  const { loadParity } = await import('../parity/project.mjs');
  const project = await loadParity(label, { self: !!self });
  if (self) return selfSource(project, name, { second });
  if (codeOnly && project.mode !== 'compared') throw Object.assign(new Error(`${label}: its code is built from the design (governed), so it has no component of its own to read`), { usage: true });
  if (codeOnly) return codeOnlySource(label, name, rebuild);
  if (project.mode === 'compared') return comparedSource(label, name, rebuild);
  return governedSource(project, name);
}

/* A component the code has and Figma does not: its story found by its name
   in their Storybook, read from its root, with nothing to pair it with. */
async function codeOnlySource(label, name, rebuild) {
  const X = await import('../parity/external.mjs');
  const L = await X.openLibrary(label, { rebuild });
  const story = X.storyIndex(L.out).stories.get(X.storyKey(name));
  if (!story) { L.close(); throw Object.assign(new Error(`${name}: no story for it in ${label}'s Storybook`), { usage: true }); }
  const src = {
    label, tab: L.tab, lib: L.lib, repo: L.repo, out: L.dir, mode: L.map.mode, tokens: L.tokens, value: L.value, textStyle: L.textStyle,
    components: L.where.paths.components, story, container: '#storybook-root', m: { story }, pseudoOf: {}, root: null, codeOnly: true,
    instanceOf: (fw) => (L.map.rootClass ? L.map.rootClass.replace('{Name}', fw) : null),
    instancePattern: L.map.rootClass ? (await import('../parity/pair.mjs')).rootPattern(L.map.rootClass) : null,
    async render(all) { const { __state, ...args } = all; await L.show(story, args, src.m); },
    api: () => L.page.api(L.tab),
    // the story's own first element: what it draws is the component
    elements: async () => ({ root: { selector: '#storybook-root > *' } }),
    close: () => L.close(),
  };
  return src;
}

async function comparedSource(label, name, rebuild) {
  const X = await import('../parity/external.mjs');
  const L = await X.openLibrary(label, { rebuild });
  const m0 = L.map.components[name];
  if (!m0) { L.close(); throw Object.assign(new Error(`${name}: not in ${label}'s parity mappings`), { usage: true }); }
  const src = {
    label, tab: L.tab, lib: L.lib, repo: L.repo, out: L.dir, mode: L.map.mode, tokens: L.tokens, value: L.value, textStyle: L.textStyle,
    components: L.where.paths.components, story: m0.story, container: '#storybook-root', m: m0, pseudoOf: {}, root: null,
    // the framework's own root class for a component, where the library names its framework (audit-defaults frameworks)
    instanceOf: (fw) => (L.map.rootClass ? L.map.rootClass.replace('{Name}', fw) : null),
    instancePattern: L.map.rootClass ? (await import('../parity/pair.mjs')).rootPattern(L.map.rootClass) : null,
    async render(all) {
      const { __state, ...args } = all;
      await L.show(src.story, args, src.m);
      await forceAt(L.tab, src.pseudoOf[__state]);
    },
    api: () => L.page.api(L.tab),
    async elements(figma) { return (await X.pairedElements(L.tab, L.show, figma, src.m, L.value, L.textStyle, false, undefined, undefined, L.lib.frameworkProfile.instance || null)).elements; },
    joins(figma, argTypes) { const side = X.propsSide(L.repo, L.lib, figma, src.m, argTypes); return side; },
    argsOf(all, m) { return X.argsFor(all, m).args; },
    close: () => L.close(),
  };
  return src;
}

/*
 * A governed mapping as from-code reads it, with nothing opened: `t` is the
 * engine's target (tools/parity/project.mjs: its mapping, and each Figma
 * variant's expanded args, pseudo state and the element that takes it), `b`
 * the component's bridge (derive.cjs). Each Figma combination draws the
 * variant the mapping expands for it; a Figma prop's code prop is the arg
 * that moves when that prop alone moves; a mapped layer is the contract
 * element its stored path is; a pointer state is forced where its option
 * says (`on`), else where the mapping's `state` says. Tested by
 * test-from-code.mjs.
 */
export function governedReading(t, b, { stateAxis = null, container = '' } = {}) {
  const at = (sel) => (sel ? `${container} ${sel}`.trim() : null);
  const names = [...t.variants.keys()];
  const optionsOf = variantValues;
  const propOf = Object.fromEntries(Object.entries(b.props).map(([id, p]) => [p.figma, id]));
  const valueIn = (id, option) => { const v = Object.entries(b.props[id].values || {}).find(([, o]) => o === option); return v ? v[0] : String(option).toLowerCase(); };
  const whenOf = (n) => Object.fromEntries(Object.entries(optionsOf(n)).filter(([p]) => propOf[p]).map(([p, o]) => [propOf[p], valueIn(propOf[p], o)]));
  const variantFor = (when) => names.find((n) => { const w = whenOf(n); return Object.keys(w).every((k) => k in when && String(w[k]) === String(when[k])); });
  const stateId = stateAxis && propOf[stateAxis];
  const pseudoOf = {};
  for (const [n, v] of t.variants) if (v.pseudo && stateId) { const w = whenOf(n); if (w[stateId] && !pseudoOf[w[stateId]]) pseudoOf[w[stateId]] = { pseudo: v.pseudo, on: at(v.on || t.mapping.state || t.mapping.root) }; }
  return {
    pseudoOf,
    argsOf(all) { const v = t.variants.get(variantFor(all)); return v ? { ...(t.mapping.sample || {}), ...v.args } : null; },
    joins(figma, defaults) {
      const base = t.variants.get(variantFor(defaults)) || { args: {} };
      const map = { props: {}, twice: {} };
      for (const [k, p] of Object.entries(figma.props)) {
        if (p.role === 'interaction') continue;
        for (const v of p.type === 'enum' ? p.values : p.type === 'boolean' ? [true, false] : []) {
          const r = t.variants.get(variantFor({ ...defaults, [k]: v }));
          if (!r) continue;
          // an arg set, changed or left unset (back to the code's own default) between the two
          for (const arg of new Set([...Object.keys(r.args || {}), ...Object.keys(base.args || {})])) {
            const x = (r.args || {})[arg];
            if (JSON.stringify(x) === JSON.stringify(base.args[arg])) continue;
            const e = (map.props[k] = map.props[k] || { arg, values: {} });
            // left unset is recorded as unset: that option draws at the code's own default
            if (e.arg === arg) e.values[String(v)] = x;
            // a prop is one code prop: a second arg it moves is said, never dropped in silence
            else if (!(map.twice[k] || []).includes(arg)) (map.twice[k] = map.twice[k] || [e.arg]).push(arg);
          }
        }
      }
      // a prop no variant's name carries (a boolean property, Show chevron): the mapping's own table for it says which
      // arg it moves, where the expanded variants cannot, as they are the same with it on or off
      const sq = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [k, p] of Object.entries(figma.props)) {
        if (map.props[k] || p.role === 'interaction' || !(p.type === 'boolean' || p.type === 'enum')) continue;
        const table = (t.mapping.axes || {})[p.figma];
        if (!table || typeof table !== 'object') continue;
        const valueOf = (o) => (p.type === 'boolean' ? (/^true$/i.test(o) ? true : /^false$/i.test(o) ? false : null) : ((p.figmaValues || []).indexOf(o) >= 0 ? p.values[p.figmaValues.indexOf(o)] : p.values.find((v) => sq(v) === sq(o)) ?? null));
        const args = new Set(Object.values(table).flatMap((x) => (x && typeof x === 'object' ? Object.keys(x.args || x).filter((a) => !['pseudo', 'on', 'args'].includes(a)) : [])));
        if (args.size !== 1) continue;
        const [arg] = args;
        const e = { arg, values: {} };
        for (const [o, x] of Object.entries(table)) { const v = valueOf(o); if (v !== null && x && typeof x === 'object') e.values[String(v)] = (x.args || x)[arg]; }
        if (Object.keys(e.values).length) map.props[k] = e;
      }
      return map;
    },
    // each layer the mapping places, as the contract element it is; a ruling or a layer that is not exactly
    // one element is refused, as the compared reader refuses it, never dropped
    elements() {
      const out = {}, skipped = [];
      Object.defineProperty(out, 'skipped', { value: skipped });
      // a layer name with a space at its end ("Frame ", as Figma keeps it) is the store's path with that space ("Frame  > 96"),
      // which a mapping written by hand or by the toolkit spells trimmed: each path also found by its trimmed segments
      const trimmed = (x) => x.split(' > ').map((g) => g.trim()).join(' > ');
      const byTrim = {};
      for (const [k, v] of Object.entries(b.ids)) if (trimmed(k) !== k) (byTrim[trimmed(k)] = byTrim[trimmed(k)] || []).push(...v);
      const idsAt = (x) => b.ids[x] || byTrim[trimmed(x)];
      for (const [path, sel] of Object.entries(t.mapping.layers || {})) {
        if (sel === null) continue;
        if (typeof sel !== 'string') throw new Error(`the layer ${path} carries a ruling (${JSON.stringify(sel)}): a governed mapping rules in its waivers`);
        // the second of two layers at one path is `#2`, as the store spells it, under that path where the store keeps
        // it; where one of them is hidden in some variant the store keeps both under the plain path, in tree order
        // (x, x_2, …), and `#N` takes the N-th
        const nth = /^(.*)#(\d+)$/.exec(path), named = t.mapping.layers || {};
        const order = (xs) => [...xs].sort((a, c) => (+(a.match(/_(\d+)$/) || [0, 1])[1]) - (+(c.match(/_(\d+)$/) || [0, 1])[1]));
        const direct = idsAt(path) || [];
        const all = nth ? order(idsAt(nth[1]) || []) : order(direct);
        const ids = direct.length === 1 ? direct : all.length > 1 && (nth || `${path}#2` in named) ? [all[nth ? +nth[2] - 1 : 0]].filter(Boolean) : nth ? [] : direct;
        // a layer inside another component's instance (Feedback message > Icon) is that component's, compared in its
        // own audit: the contract draws the instance, not its insides. Its nearest stored ancestor is said here, and
        // held to being an instance once the contract is open; any other missing layer is refused
        const ups = path.split(' > ').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join(' > ')).reverse();
        const up = ups.find((u) => (b.ids[u] || []).length === 1);
        if (!ids.length && up) { skipped.push({ path, up: b.ids[up][0] }); continue; }
        if (ids.length !== 1) throw new Error(`the layer ${path} is ${ids.length ? `several elements of the design (${ids.join(', ')})` : 'no layer of the design'}`);
        out[ids[0]] = { selector: at(sel) };
      }
      if (t.mapping.root && !out.root) out.root = { selector: at(t.mapping.root) };
      return out;
    },
  };
}

/* A host that declares no props (a site's fragments): the mapping's `controls`, as a story's controls read. */
export function controlsApi(controls) {
  if (!controls || !Object.keys(controls).length) return null;
  return { declared: true, args: Object.fromEntries(Object.entries(controls).map(([k, x]) => [k, x.default])),
    argTypes: Object.fromEntries(Object.entries(controls).map(([k, x]) => [k, { options: x.options || null, control: x.options ? 'select' : x.type, default: x.default }])) };
}

async function governedSource(project, name) {
  const { bridge } = req('./derive.cjs');
  const X = await import('../parity/external.mjs');
  const { session } = await import('../parity/session.mjs');
  const { valueOf } = req('../snapshot/tokens.cjs');
  const t = project.targets.find((x) => x.kind === 'component' && (x.folder === name || x.name === name));
  if (!t) throw Object.assign(new Error(`${name}: not in ${project.config.project}'s parity mappings`), { usage: true });
  const lib = project.lib;
  // a governed run measures every tier; a contract is read in the first, as the project lists them
  const tier = project.parity.tiers[0];
  const host = project.parity.host.kind;
  const container = host === 'storybook' ? '#storybook-root' : '[data-parity="c"]';
  const b = bridge(req('../snapshot/store.cjs').readSpec(project.paths.components, t.folder, { compact: true }));
  const G = governedReading(t, b, { stateAxis: lib.tokens && lib.tokens.stateAxis, container });
  let elements;
  try { elements = G.elements(); } catch (e) { throw Object.assign(new Error(`${name}'s mapping: ${e.message}`), { usage: true }); }
  if (!Object.keys(elements).length) throw Object.assign(new Error(`${name}'s mapping places no element (no \`root\`, no \`layers\`): nothing to read the code from`), { usage: true });
  const api = host === 'storybook' ? null : controlsApi(t.mapping.controls);
  if (host !== 'storybook' && !api) throw Object.assign(new Error(`${name}: the ${host} host declares no props, and the mapping lists no \`controls\` — add them, so the code's props can be read`), { usage: true });
  const S = await session(project, { app: false });
  const tab = await S.acquire();
  const tokens = project.snapshot;
  let opened = false, forced = false;
  const src = {
    governed: true, label: project.config.project, tab, lib, repo: project.repo, out: project.where.parity, mode: tier, tokens,
    value: (x) => (typeof x === 'string' ? valueOf(tokens, x, tier) ?? x : x),
    textStyle: (n) => (tokens.textStyles || []).find((x) => x.name === n),
    components: project.paths.components, story: t.mapping.storyId || t.name, container,
    m: { story: t.mapping.storyId || t.name, axes: t.mapping.axes }, root: t.mapping.root || null, pseudoOf: G.pseudoOf,
    // another component of the library inside this one, by the project's instance pattern (parity.instance)
    instanceOf: (slug) => (project.parity.instance ? project.parity.instance.replace(/\{(?:slug|Name)\}/, slug) : null),
    instancePattern: project.parity.instance ? (await import('../parity/pair.mjs')).rootPattern(project.parity.instance) : null,
    // another component's layers, by its folder: each contract element's selector, as its own mapping places it
    partsOf: (slug) => {
      const x = project.targets.find((y) => y.kind === 'component' && y.folder === slug);
      if (!x || !x.mapping) return null;
      try { return Object.fromEntries(Object.entries(governedReading(x, bridge(req('../snapshot/store.cjs').readSpec(project.paths.components, slug, { compact: true }))).elements()).map(([id, e]) => [id, e.selector])); } catch { return null; }
    },
    // another component's mapping axes, by its folder: the props an instance of it is drawn at
    axesOf: (slug) => { const x = project.targets.find((y) => y.kind === 'component' && y.folder === slug); return x && x.mapping ? x.mapping.axes || null : null; },
    // its mapping's named combinations (Inverse=True, Feedback=Neutral → { inverse: true }), where it lists them instead of axes
    combosOf: (slug) => { const x = project.targets.find((y) => y.kind === 'component' && y.folder === slug); return x && x.mapping && !x.mapping.axes && x.mapping.variants ? x.mapping.variants : null; },
    async render(all, { reload = false } = {}) {
      const { __state, ...args } = all;
      // the story already on screen takes new args through Storybook's own channel, with no reload of the preview
      // (a reload is most of a read: avatar's 600 reads took 2 minutes); a forced pointer state, before or now, reloads,
      // as a forced state would outlive the args it was forced for; so does a slot's stand-in
      const at = src.pseudoOf[__state];
      if (host === 'storybook' && opened && !forced && !reload && !(at && at.on)) {
        const { call } = await import('../shared/cdp.mjs');
        // an arg left unset (where the component's own default draws) is a word on its way in, as JSON drops undefined
        const UNSET = '\u0000unset';
        const ok = await call(tab, async (a) => {
          const UNSET = '\u0000unset';
          try {
          const p = window.__STORYBOOK_PREVIEW__, r = p && p.currentRender;
          if (!r || !r.story) return false;
          const init = r.story.initialArgs || {};
          const rendered = () => new Promise((res) => { const f = () => { p.channel.off('storyRendered', f); res(true); }; p.channel.on('storyRendered', f); setTimeout(() => res(false), 3000); });
          // this read's args, and the story's own for every other arg now away from it: one render, not a reset and an update
          const now = p.storyStoreValue.args.get(r.id) || {}, same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
          // as the address's args are typed: a contract's value is a word, which Storybook turns into the option it
          // names (24, false) on the way in from the address and not from the channel; one no option names reloads
          const want = {};
          for (const [k, v1] of Object.entries(a)) {
            const v0 = v1 === UNSET ? undefined : v1;
            const t = r.story.argTypes[k] || {}, ty = t.type && t.type.name;
            let v = v0;
            if (typeof v === 'string' && t.options && t.options.length) { const o = t.options.find((x) => String(x) === v); if (o === undefined) return false; v = o; }
            else if (typeof v === 'string' && ty === 'number') v = Number(v);
            else if (typeof v === 'string' && ty === 'boolean') v = v === 'true';
            want[k] = v;
          }
          for (const k of new Set([...Object.keys(now), ...Object.keys(init)])) if (!(k in want) && !same(now[k], init[k])) want[k] = init[k];
          const moved = Object.fromEntries(Object.entries(want).filter(([k, v]) => !same(v, now[k])));
          // Storybook's own word that the story drew, some 100 ms after the DOM first changes: a wait for the DOM to
          // change and hold still read the last args (avatar's teal as cyan) one run in four, whatever it watched
          let done = Promise.resolve(true);
          if (Object.keys(moved).length) { done = rendered(); p.channel.emit('updateStoryArgs', { storyId: r.id, updatedArgs: moved }); }
          const drawn = await done;
          // drawn, not Storybook's error screen (the reload's open refuses that too)
          if (!drawn || !document.body.classList.contains('sb-show-main')) return false;
          // and what the reload's settle waits for: the fonts, and the pictures the browser is loading (a new src)
          await document.fonts.ready;
          await Promise.race([Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((res) => { i.addEventListener('load', res, { once: true }); i.addEventListener('error', res, { once: true }); }))), new Promise((res) => setTimeout(res, 5000))]);
          // a reload draws the new args at rest; a change of args starts the CSS transitions between them
          // (chip's colours read mid-way, as no token), so they are run to their end
          for (const x of document.getAnimations()) if (x instanceof CSSTransition) x.finish();
          // and React keeps the elements, with the ids the walk stamped on them for the last read (chip's
          // label read as its own child), so they go, as a reload would take them
          for (const n of document.querySelectorAll('[data-figma-id], [data-figma-text], [data-contract-id], [data-contract-up], [data-contract-turn]')) for (const k of ['data-figma-id', 'data-figma-text', 'data-contract-id', 'data-contract-up', 'data-contract-turn']) n.removeAttribute(k);
          // and focus goes, as the reload's settle takes it
          if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
          return true;
          } catch { return false; }
        }, Object.fromEntries(Object.entries(args).map(([k, v]) => [k, v === undefined ? UNSET : v]))).catch(() => false);
        if (ok) return;
      }
      forced = !!(at && at.on) || reload;
      opened = host === 'storybook';
      if (host === 'storybook') await S.PAGE.open(tab, { storyId: t.mapping.storyId, args, tier });
      else await S.PAGE.open(tab, [{ key: 'c', html: await S.PAGE.fragment(t.name, Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined))) }], { tier, viewport: [project.limits.viewportWidth, project.limits.componentWindowHeight] });
      await forceAt(tab, src.pseudoOf[__state]);
    },
    api: async () => api || S.PAGE.api(tab),
    elements: async () => elements,
    // the mapping's joins, and the engine's one rule (effectiveProps) for a prop the mapping's variants do not move (a text)
    joins: (figma, argTypes, g = G.joins(figma, variantDefaults(figma))) => ({ twice: g.twice, map: { props: X.effectiveProps(figma, g.props, Object.fromEntries(Object.keys(argTypes).map((k) => [k, {}])), argTypes, lib.codeProfile || {}) }, code: argTypes, framework: null, fw: lib.codeProfile || {} }),
    argsOf: (all) => G.argsOf(all) || {},
    close: () => S.close(),
  };
  return src;
}

/*
 * The library as the toolkit itself renders it (--self): each component's web component and sheet, from its contract,
 * on site.mjs's page, with no project code. Read like a governed mapping (governedReading over to-markup's toParity),
 * so what differs from the contract here is the toolkit's own translation loss; what differs only against the
 * project's code is the project's. Its readings go to <home>/round-trip/self/from-code/, which eval.mjs's self leg reads.
 */
async function selfSource(project, name, { second = false } = {}) {
  // the sheet, the markup and the mapping written under the library's own settings, the ones the reading reads under
  const settingsOf = librarySettings(project.paths.components);
  const { bridge } = req('./derive.cjs');
  const X = await import('../parity/external.mjs');
  const { expand } = await import('../parity/project.mjs');
  const { rootPattern } = await import('../parity/pair.mjs');
  const { contracts } = await import('./official.mjs');
  const { propsOf } = await import('./to-markup.mjs');
  const { selfSiteFiles, serveSite, selfMapping } = await import('./site.mjs');
  const { launch, newPage, attach, navigate, call, waitFor, media } = await import('../shared/cdp.mjs');
  const { schemeOf } = await import('../parity/hosts.mjs');
  const { valueOf } = req('../snapshot/tokens.cjs');
  const store = req('../snapshot/store.cjs');
  const where = project.where;
  const library = Object.fromEntries(contracts(where).map(({ folder, contract }) => [contract.component, { ...contract, folder }]));
  let c = Object.values(library).find((x) => x.folder === name);
  if (!c) throw Object.assign(new Error(`${name}: no contract for it in ${project.config.project}`), { usage: true });
  // --second: the round trip again, from what the first came back as (round-trip/self/from-code), so what a second
  // trip changes is the translation not settling (idempotence); the reader and its design stay the same. Only what the
  // first trip built is taken (its anatomy and variants): its props keep the contract's (their Figma values, which
  // booleans are axes, what is invalid, when a part shows), since the reading's are said in Figma's convention and the
  // render pairs each variant with the spec by them; the props are the self leg's to measure
  if (second) {
    let first = null;
    try { first = JSON.parse(fs.readFileSync(path.join(where.projectDir, 'round-trip', 'self', 'from-code', `${name}.json`), 'utf8')).asFigma; } catch { /* below */ }
    if (!first) throw Object.assign(new Error(`${name}: no first self reading to go round again from (eval.mjs --self)`), { usage: true });
    // (a string with no default draws its layer's words in the design: the reading binds the layer to it, so the words
    // are the design's, kept as its default)
    const props = Object.fromEntries(Object.entries(c.props || {}).map(([k, p]) => { const t = p.type === 'string' && p.default == null && (c.anatomy[(p.sets || [])[0]] || {}).content; return [k, typeof t === 'string' && !/^\{.+\}$/.test(t) ? { ...p, default: t } : p]; }));
    // (an icon's colour, said on the instance as the reading compares it, goes back on the one glyph inside, as the
    // design says it and as the sheet writes it; to-figma's glyph, undone)
    const mainOf = req('./derive.cjs').byComponentName(Object.values(library));
    // (keyed as the main names its one glyph; an icon, which the library holds no contract for, as the snapshot names
    // an icon's vector, `icon`: the sheet writes the colour whatever the key. A main that is anything but its root and
    // that one glyph is left as read: a colour on its instance cannot be told from a fill of its own)
    const glyphOf = (id, e, scope) => {
      // (a part inside it, here or added by a variant: it is open, and its glyph is read as it is)
      if (!e || e.kind !== 'instance' || [...Object.keys(scope), ...opened].some((k) => k.startsWith(`${id}/`))) return null;
      const m = mainOf(e.component, e.key);
      if (!m) return [`${id}/icon`, {}];
      const rest = Object.entries(m.anatomy).filter(([k]) => k !== 'root');
      if (rest.length !== 1 || rest[0][1].kind !== 'graphic' || rest[0][1].parent !== 'root') return null;
      // (the main's glyph whole, its colour too where the instance says none, so the sheet finds nothing of it
      // overridden but the colour)
      const { parent: _, ...g } = rest[0][1];
      return [`${id}/${g.name ? camel(g.name) : rest[0][0]}`, g];
    };
    const anatomy = { ...first.anatomy }, variants = inDesignStates(JSON.parse(JSON.stringify(first.variants || [])), first, c);
    const opened = variants.flatMap((v) => Object.keys(v.add || {}));
    // a glyph for every instance a colour lands on (its own, or a variant's set), so a set has a part to land on
    const coloured = (id) => variants.some((v) => v.set && `${id}.background` in v.set);
    const down = (scope) => {
      const keys = {};
      for (const [id, e] of Object.entries(scope)) {
        const g = glyphOf(id, e, scope);
        if (!g || (e.background == null && !coloured(id))) continue;
        const [key, own] = g;
        keys[id] = key;
        const { background, ...rest } = e;
        scope[id] = rest; scope[key] = { kind: 'graphic', order: 0, ...own, parent: id, ...(background != null && { background }) };
      }
      return keys;
    };
    const keys = down(anatomy);
    for (const v of variants) if (v.add) Object.assign(keys, down(v.add));
    for (const v of variants) if (v.set) for (const [id, key] of Object.entries(keys)) if (`${id}.background` in v.set) { v.set[`${key}.background`] = v.set[`${id}.background`]; delete v.set[`${id}.background`]; }
    c = library[c.component] = { ...c, props, anatomy, variants };
  }
  // the toolkit's page names its parts and instances its own way (data-part, ds-<folder>): none of the project's code
  // settings (its framework's components, part and icon classes, code profile) apply to it
  const lib = { ...project.lib, frameworkComponents: {}, code: {}, frameworkProfile: null, codeProfile: {} };
  const tier = project.parity.tiers[0], container = '[data-parity="c"]';
  // to-markup's mapping, its rulings (a layer another instance draws, a slot's sample, a pointer-only part) left out
  // as a governed mapping keeps them in its waivers: what is not placed is not read
  // (drawn once per contract: a placed component's is asked for its paths and again for its ids)
  const drawnMappings = new Map(), drawnMapping = (x) => { if (!drawnMappings.has(x)) drawnMappings.set(x, selfMapping(x, { library, settings: settingsOf(x.folder) })); return drawnMappings.get(x); };
  const mappingOf = (x) => { const m = drawnMapping(x); return { ...m, layers: Object.fromEntries(Object.entries(m.layers).filter(([, s]) => typeof s === 'string')) }; };
  const targetOf = (x) => { const mapping = mappingOf(x); return { mapping, variants: expand(mapping, store.readSpec(project.paths.components, x.folder, { compact: true }).variants, project.parity.variants) }; };
  const t = targetOf(c);
  const b = bridge(store.readSpec(project.paths.components, name, { compact: true }));
  const G = governedReading(t, b, { stateAxis: lib.tokens && lib.tokens.stateAxis, container });
  let elements;
  try { elements = G.elements(); } catch (e) { throw Object.assign(new Error(`${name}'s mapping from to-markup: ${e.message}`), { usage: true }); }
  // the tokens as the project's token build writes them (plain custom properties); its fonts are not loaded, so text
  // is measured in the fallback font
  const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
  const tokensCss = (where.paths.styles ? read(path.join(where.paths.styles, '_tokens.scss')) : '');
  if (!tokensCss) throw Object.assign(new Error(`${project.config.project}: no _tokens.scss under paths.styles to render the tokens with`), { usage: true });
  // only the component and what it places, with only the tokens their sheets reach (site.mjs selfSiteFiles): every
  // matched-styles answer matched the whole library's sheet and carried the whole tokens rule it inherits, 85 to 93% of
  // a reading's time (a Material text field's 553 KB an answer, 31 ms to 3)
  const files = selfSiteFiles(library, name, { tokensCss, settingsOf });
  // the page served and Chrome launched when a read first needs them: with the read cache, a reading whose every
  // answer is kept needs neither (read-cache.mjs)
  let site = null, browser = null, tab = null;
  const live = async () => {
    if (tab) return tab;
    site = await serveSite(files);
    browser = await launch({});
    tab = await attach(await newPage(browser.endpoint));
    // the tier's colour scheme, as the parity engine opens a page (hosts.mjs schemeOf): headless Chrome takes the
    // system's otherwise, and a Mac that turns dark at night read Atlassian's dark tokens (a spinner's currentcolor as
    // text/subtle), and kept them in the read cache
    const scheme = schemeOf(tier);
    await media(tab, { 'prefers-color-scheme': scheme });
    if (!(await call(tab, (s) => matchMedia(`(prefers-color-scheme: ${s})`).matches, scheme))) throw new Error(`the toolkit's own page did not take the ${scheme} colour scheme`);
    return tab;
  };
  // the code's props as a story's controls say them: to-markup's own, at their defaults
  const own = propsOf(c, library).filter((x) => x.type !== 'event');
  // a text entry's has-value is its input's, no prop of the markup's (to-markup folds it): the story says it as a
  // boolean that fills the value when on, so the reading has it under the design's name
  const entry = (await import('./to-code.mjs')).entryOf(c), valueProp = entry && own.find((x) => x.type === 'value');
  const flag = valueProp && !own.some((x) => x.name === camel(entry.flag)) && { name: camel(entry.flag), on: entry.on, value: valueProp.name, sample: (c.props[Object.keys(c.props).find((k) => (c.props[k].sets || []).includes(entry.value))] || {}).default || 'Value' };
  const api = { args: { ...Object.fromEntries(own.map((x) => [x.name, x.default])), ...(flag && { [flag.name]: !flag.on, [flag.value]: '' }) }, argTypes: { ...(flag && { [flag.name]: { control: 'boolean', type: 'boolean', default: !flag.on } }), ...Object.fromEntries(own.map((x) => [x.name,
    x.type === 'enum' && (x.values || []).length ? { options: x.values, control: 'select', default: x.default }
    : x.type === 'boolean' ? { control: 'boolean', type: 'boolean', default: x.default === true }
    : x.type === 'number' ? { control: 'number', type: 'number', default: x.default }
    : x.type === 'node' ? selfSlotControl(x)
    : { control: 'text', type: 'string', default: x.default ?? '' }])) } };
  const tokens = project.snapshot;
  const src = {
    governed: true, label: project.config.project, tab, lib, repo: project.repo, out: path.join(where.projectDir, 'round-trip', second ? 'self2' : 'self'), mode: tier, tokens,
    // (on --second, the contract the markup was drawn from: the first reading's anatomy, for the names and rings it keeps)
    ...(second && { drawnFrom: c }),
    value: (x) => (typeof x === 'string' ? valueOf(tokens, x, tier) ?? x : x),
    textStyle: (n) => (tokens.textStyles || []).find((x) => x.name === n),
    components: project.paths.components, story: t.mapping.storyId, container, m: { story: t.mapping.storyId, axes: t.mapping.axes }, root: t.mapping.root, pseudoOf: G.pseudoOf,
    // what each served module says it draws (to-markup's export): the code's own word for the component
    figmaOf: (folder) => codeFigma(files[`components/${folder}/${folder}.js`]),
    instanceOf: (slug) => `ds-${slug}`,
    instancePattern: rootPattern('ds-{slug}'),
    partsOf: (slug) => { const x = Object.values(library).find((y) => y.folder === slug); if (!x) return null; try { return Object.fromEntries(Object.entries(governedReading(targetOf(x), bridge(store.readSpec(project.paths.components, slug, { compact: true }))).elements()).map(([id, e]) => [id, e.selector])); } catch { return null; } },
    // (a swap's layers alone by the writer's ids: a boolean keeps the lookup by stored paths, since a layer drawn is not
    // what the boolean says, where its host states it and a variant draws the layer anyway)
    swapPartsOf: (slug) => { const x = Object.values(library).find((y) => y.folder === slug); return x ? partsById(() => drawnMapping(x), container) : null; },
    axesOf: (slug) => { const x = Object.values(library).find((y) => y.folder === slug); return x ? mappingOf(x).axes || null : null; },
    combosOf: () => null,
    // each read on a clean page (render, below): a forced pointer state never outlives the args it was forced for
    statesAsArg: true,
    async render(all) {
      const { __state, ...args } = all;
      // a state no pointer reaches is the markup's own prop (state="loading")
      if (__state !== undefined && __state !== 'rest' && !src.pseudoOf[__state] && src.stateArg) args[src.stateArg] = __state;
      // the has-value flag is the input's: on, it holds its value (the sample where none is given); off, it is left as given,
      // empty unless the mapping's own has-value state gives it one (the story's value starts empty)
      if (flag && flag.name in args) { if (args[flag.name] === flag.on && !args[flag.value]) args[flag.value] = flag.sample; delete args[flag.name]; }
      // a page loaded once serves the next read, unless the last one left anything outside the stage (a popover on the
      // body): then it is loaded again, so nothing a read did reaches the next. A forced pointer state is let go instead
      // of reloading (fetching the document again drops every one, shared/cdp.mjs forceState), before the next render
      // goes in, so no ancestor still held hovered or focused styles it: each reload cost about 1.5 s, the page and the
      // first matched styles after it (a Carbon dropdown read 184 of them, 1566 s to 283 s with the served page cut
      // down below, the same reading, 2026-11-22)
      const tab = await live();
      if (src.forced) { await tab.send('DOM.getDocument', { depth: 0 }); src.forced = false; }
      if (!src.clean || !(await call(tab, pageReusable))) {
        await navigate(tab, `${site.url}index.html`);
        await waitFor(tab, '!!window.ready', { timeout: 10000 }).catch((e) => { throw new Error(`the toolkit's own page did not load: ${(tab.trouble || []).join('; ') || e.message}`); });
        await call(tab, () => { window.bodyAt = document.body.childElementCount; });
        src.clean = true;
      }
      if (src.pseudoOf[__state]) src.forced = true;
      await call(tab, ([folder, a, theme]) => {
        document.documentElement.setAttribute('data-theme', theme);
        const s = document.createElement('section'); s.setAttribute('data-parity', 'c'); s.style.cssText = 'display:flow-root;inline-size:max-content;padding:24px';
        s.append(window.R[folder](Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined))));
        document.getElementById('stage').replaceChildren(s);
        return document.fonts.ready.then(() => true);
      }, [name, args, String(tier).toLowerCase()]);
      await forceAt(tab, src.pseudoOf[__state]);
    },
    api: async () => api,
    elements: async () => elements,
    joins: (figma, argTypes, g = G.joins(figma, variantDefaults(figma))) => ({ twice: g.twice, map: { props: X.effectiveProps(figma, g.props, Object.fromEntries(Object.keys(argTypes).map((k) => [k, {}])), argTypes, lib.codeProfile || {}) }, code: argTypes, framework: null, fw: lib.codeProfile || {} }),
    argsOf: (all) => G.argsOf(all) || {},
    close: async () => { if (browser) await browser.close(); if (site) await site.close(); },
  };
  if (cacheOff()) { src.tab = await live(); return src; }
  // the read cache (read-cache.mjs): the page's key, every render a combination of it, and every question put to the
  // page through a tab that answers from it
  const { chromeVersion } = await import('../shared/cdp.mjs');
  const key = pageKey({ files, chrome: chromeVersion(), fonts: fontsInstalled({ stat: true }), env: localeHere(), system: `${process.platform} ${(await import('node:os')).release()}`,
    code: [pageCode(), serveSite.toString(), forceAt.toString(), pageReusable.toString(), src.render.toString(), live.toString(), JSON.stringify({ name, tier, container, flag })].join('\0') });
  // (an element's matched styles kept once by their content: every element inherits the tokens' :root rule)
  const rec = recorder({ key, live, pool: (o) => Array.isArray(o.cssProperties) });
  const render = src.render, close = src.close;
  // (an arg left undefined said so: the render tells it from one not given only by its value, but the label must not merge them)
  src.render = (all) => rec.reset(JSON.stringify([all, src.pseudoOf[all.__state] || null, src.stateArg || null], (k, v) => (v === undefined ? '\u0000undefined' : v)), () => render(all));
  src.tab = { evaluate: (expr) => rec.step('eval', expr, (t) => t.evaluate(expr)), send: (method, params) => rec.send(method, params) };
  src.cache = rec;
  src.close = async () => { await rec.close(); await close(); };
  return src;
}

/* A part inside a placed component, in a box with no auto layout, sits where its component puts it: the design writes
   no place for it (derive.cjs, inInstance) and an instance cannot move it (Figma's help, "Apply changes to
   instances"), so none is read. A box with auto layout places its children by flow, as the design says it, and one
   placed absolutely inside it keeps its place there (derive keeps it, whatever holds the box). A placed component's own
   entry carries no layout: its main's root says it (`layoutOf`). */
export function unplacedIn(raw, e, layoutOf = (u) => u.layout) {
  const up = raw.find((r) => r.id === e.parent);
  const l = up && layoutOf(up);
  if (!up || (l && l.direction)) return false;
  for (let q = up; q; q = raw.find((r) => r.id === q.parent)) if (q.kind === 'instance') return true;
  return false;
}

/* ---- the run ---- */

/* A part turned (CSS rotate, or a transform that only turns and moves it) is measured as laid out, in its parent's axes as
   Figma measures a rotated layer, never the page's, where a quarter turn swaps x and y: each turn set aside while the
   boxes are measured, then put back. Its degrees are Figma's, counter-clockwise from -180 to 180 (css.mjs writes rotation as rotate: -<n>deg; a
   transform's turn read the same way). Runs in the page (passed as source). */
function unturn(root) {
  const deg = (v) => { const m = /^(?:z\s+|0\s+0\s+1\s+)?(-?[\d.]+(?:e-?\d+)?)(deg|turn|rad|grad)$/.exec(String(v || '').trim()); return m ? +m[1] * { deg: 1, turn: 360, rad: 180 / Math.PI, grad: 0.9 }[m[2]] : 0; };
  const turned = new Map(), back = [];
  for (const n of [root, ...root.querySelectorAll('*')]) {
    const s = getComputedStyle(n), r = deg(s.rotate);
    const m = /^matrix\(([^)]+)\)$/.exec(s.transform || ''), [a, b, c, d, tx, ty] = m ? m[1].split(',').map(Number) : [];
    // (a turn and a move only: a mirror or a scale is mirrored()'s, and left as it is)
    const spun = !!m && Math.abs(a - d) < 1e-6 && Math.abs(b + c) < 1e-6 && Math.abs(a * a + b * b - 1) < 1e-4 && (Math.abs(b) > 1e-6 || a < 0);
    if (!r && !spun) continue;
    back.push([n, n.style.cssText]);
    // (no transition either, or a turn set aside would still be easing out when the boxes are measured)
    n.style.setProperty('transition', 'none', 'important');
    if (r) n.style.setProperty('rotate', 'none', 'important');
    if (spun) n.style.setProperty('transform', `translate(${tx}px, ${ty}px)`, 'important');
    // (clockwise as CSS turns; Figma's turn is the other way, its negative, from -180 to 180)
    const cw = r + (spun ? Math.atan2(b, a) * 180 / Math.PI : 0), fig = ((-cw % 360) + 540) % 360 - 180;
    const all = +(Math.abs(fig + 180) < 1e-9 ? 180 : fig).toFixed(2);
    if (all) turned.set(n, all);
  }
  return { turned, restore: () => { for (const [n, css] of back) n.style.cssText = css; } };
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const label = opt('--project');
  const rebuild = argv.includes('--rebuild'); if (rebuild) argv.splice(argv.indexOf('--rebuild'), 1);
  const codeOnly = argv.includes('--code-only'); if (codeOnly) argv.splice(argv.indexOf('--code-only'), 1);
  const second = argv.includes('--second'); if (second) argv.splice(argv.indexOf('--second'), 1);
  const self = argv.includes('--self') || second; if (argv.includes('--self')) argv.splice(argv.indexOf('--self'), 1);
  const name = argv[0];
  if (!label || !name) { console.error('usage: from-code.mjs --project <label> <component> [--rebuild] [--code-only | --self | --second]'); process.exit(2); }
  // a run by hand, or a loop of them, holds the measuring lock; one eval.mjs started already holds it (tools/shared/lock.mjs)
  await (await import('../shared/lock.mjs')).hold(`from-code.mjs ${process.argv.slice(2).join(' ')}`);
  const { judge, elementIn, authoredWidth, authoredVars, layerVars, authoredValue, authoredSideVars, authoredSelector, compareProps, invisibleBorder, cssShadows, shadowKey, fetchLevels } = await import('../parity/external.mjs');
  const { call } = await import('../shared/cdp.mjs');
  let L;
  try { L = await openSource(label, name, { rebuild, codeOnly, self, second }); } catch (e) { if (!e.usage) throw e; console.error(e.message); process.exit(2); }
  // the library's official contracts (official.mjs): Figma's readings, or the project's own where it takes the contract as its source
  const { contracts: officialContracts } = await import('./official.mjs');
  const official = new Map(officialContracts(req('../snapshot/projects.cjs').layout(null, label)).map((x) => [x.folder, x.contract]));
  // the library's own settings, the ones to-code and to-markup write its sheet under (its pointer states' pseudo-classes:
  // which outline is a focus ring, and which design value a forced state is)
  const settings = librarySettings(req('../snapshot/projects.cjs').layout(null, label).paths.components)(name);
  // a component only in code has no Figma contract: nothing to pair its elements with or compare it to
  const figmaContract = codeOnly ? null : official.get(name);
  if (!codeOnly && !figmaContract) { console.error(`from-code: ${name} has no contract: snapshot the library first`); process.exit(2); }
  const t0 = Date.now();
  // which element is which Figma element: the mapping's, where it states them, else the pairing rule's
  let m = { ...L.m, elements: await L.elements(figmaContract) };

  // the token table, in the mode the code is compared in, and what the library's own contracts use
  const table = tokenTable(L.tokens, L.mode);
  const contracts = [...official.values()];
  const usage = usageIn(contracts);
  const offered = offerFor(contracts);
  // the library's fullest radius: the largest the radius field offers
  const tokenList = table.map(([n, v, sc]) => ({ name: n, value: v, ...(sc && { scopes: sc }) }));
  const fullest = () => fullestOf(offered('radius', tokenList));
  // the ancestor as the design draws it: in the base anatomy, or added at some props (text input's feedback message)
  const kindIn = (c, id) => (c.anatomy[id] || (c.variants || []).map((v) => (v.add || {})[id]).find(Boolean) || {}).kind;
  for (const x of m.elements.skipped || []) if (!figmaContract || kindIn(figmaContract, x.up) !== 'instance') { console.error(`${name}'s mapping: the layer ${x.path} is no layer of the design`); process.exit(2); }
  const layered = new Set(), ownIcon = new Set();
  // every field this reading takes from the design, by the rule that takes it (eval.mjs: the same only as assisted)
  const A = assistsOf();
  const ties = [], notes = (m.elements.skipped || []).map((x) => `${x.path}: inside another component's instance (${x.up}), which is compared in its own audit`);
  // the library's other components, by the name the code's markup gives them (a framework's, or the
  // project's instance pattern), where one name is one component (a framework's TextField is five inputs: none)
  const byName = {};
  for (const [fig, code] of Object.entries(L.lib.frameworkComponents || {})) (byName[code] = byName[code] || []).push(fig);
  if (!Object.keys(byName).length && L.instancePattern) for (const [f, c] of official) (byName[f] = byName[f] || []).push(c.component);
  const ownName = (figmaContract && (L.lib.frameworkComponents || {})[figmaContract.component]) || name;
  const others = Object.fromEntries(Object.entries(byName).filter(([code, figs]) => figs.length === 1 && code !== ownName).map(([code, figs]) => [code, figs[0]]));
  // and the key of each such component, from the library's own contract: a reading names what it places, and that
  // contract says which component that is, so the reading resolves its instances as the design's do (layers.mjs
  // keyMatches; an icon of the same name is not it). A framework's name kept by more than one contract has none.
  const keyOfPlaced = {};
  for (const [code, fig] of Object.entries(others)) {
    const by = L.instancePattern && official.get(code), named = [...official.values()].filter((c) => c.component === fig);
    const c = by && by.component === fig ? by : named.length === 1 ? named[0] : null;
    // (two code names for one Figma name with different keys say none: which one the reading placed is the name's)
    const k = (c && c.figma && c.figma.key) || null;
    keyOfPlaced[fig] = fig in keyOfPlaced && keyOfPlaced[fig] !== k ? null : k;
  }
  const keyFromCode = codeKeys(others, L.figmaOf);
  // what the code declares of itself, its modules' labels (codeName, keyInstances): identity, kept apart from `assisted`
  const declared = new Set();
  // how the markup names a part and an icon: the library's own (code.partClass, code.iconClass), else its framework's (audit-defaults frameworks)
  const partClass = (L.lib.code && L.lib.code.partClass) || L.lib.frameworkProfile?.partClass || null;
  const partModifiers = L.lib.frameworkProfile?.partModifiers || null;
  const iconClass = (L.lib.code && L.lib.code.iconClass) || null;

  try {
    // a contract's values are words: an option the story lists as null (no icon) is "null" in it, and null to the story
    let nullable = new Set();
    // a slot's stand-in: a Storybook will not take a word for content through its address (an object control), so
    // it is set through the preview's own channel once the story has drawn, and waited for on screen
    const slotArgs = {};
    const show = async (all) => {
      const fill = Object.fromEntries(Object.entries(all).filter(([k]) => k in slotArgs));
      const viaChannel = Object.keys(fill).length && await call(L.tab, () => !!window.__STORYBOOK_PREVIEW__);
      await L.render(Object.fromEntries(Object.entries(all).filter(([k]) => !(viaChannel && k in fill)).map(([k, v]) => [k, v === 'null' && nullable.has(k) ? null : v])), { reload: !!viaChannel });
      if (!viaChannel) return;
      const missing = await call(L.tab, async ([args, wait]) => {
        const p = window.__STORYBOOK_PREVIEW__;
        // a slot not drawn before may draw at these props: Storybook's word that it drew is waited for (3 s at most)
        const drew = new Promise((res) => { const f = () => { p.channel.off('storyRendered', f); res(); }; p.channel.on('storyRendered', f); setTimeout(res, 3000); });
        p.channel.emit('updateStoryArgs', { storyId: p.currentRender.id, updatedArgs: args });
        await drew;
        const out = () => Object.keys(args).filter((k) => !document.body.textContent.includes(args[k]));
        for (let i = 0; i < 100; i++) { if (out().every((k) => !wait.includes(k))) return out(); await new Promise((r) => setTimeout(r, 50)); }
        return out();
      }, [fill, Object.keys(fill).filter((k) => !undrawn.has(k))]);
      // a slot the story draws only at some props (date input's error, section marker's description on lg) is placed
      // where it draws, if anywhere; it neither stops the read nor is waited for again
      for (const k of missing) if (!undrawn.has(k)) { undrawn.add(k); notes.push(`${k}: a slot the story does not draw at its starting props (the story may not render it at all); placed where a read draws it`); }
    };
    const undrawn = new Set();
    await show({});
    // the code's own props and their starting values
    const story = await L.api();
    nullable = new Set(Object.entries(story.argTypes).filter(([, a]) => (a.options || []).includes(null)).map(([k]) => k));
    const props = {};
    for (const [k, a] of Object.entries(story.argTypes)) {
      const start = story.args[k];
      // required as the source says it (the docgen's), for the props a contract holds
      const must = a.required ? { required: true } : {};
      if (a.options && a.options.length) props[camel(k)] = { type: 'enum', values: a.options.map(String), default: String(a.default ?? start ?? a.options[0]), code: k, ...must, ...(a.default == null && { undeclared: true }) };
      else if (a.control === 'boolean' || a.type === 'boolean') props[camel(k)] = { type: 'boolean', default: a.default === true || (a.default == null && start === true), code: k, ...must };
      // (its sample, the words that bind a text to it: the story's, else its own default where the story starts it empty)
      else if ((a.control === 'text' || a.type === 'string') && typeof start === 'string') props[camel(k)] = { type: 'string', code: k, sample: start || (typeof a.default === 'string' ? a.default : start), ...must };
      else if (a.control === 'number' || a.type === 'number') props[camel(k)] = { type: 'number', code: k, ...((a.default ?? start) != null && { default: a.default ?? start }), ...must };
      // content a caller passes (a ReactNode, a snippet, a template): a slot, found where a stand-in for it lands
      else if (isSlot(a)) props[camel(k)] = slotProp(k, a, must);
    }
    if (story.declared) notes.push('the props are the ones the mapping declares (`controls`): the host does not say them, so they are taken as stated, not read');
    // the pointer states the mapping says how to force: a State prop of the contract's own kind (role
    // interaction), read like any other prop. A governed mapping states them per variant; a compared one
    // through its joins, where the rules supply a state's pseudo classes when a person gave none
    // (the mapping's joins, design key to code prop: which prop a read text binds to, where names differ)
    const joinedProps = figmaContract ? (((L.joins(figmaContract, story.argTypes) || {}).map || {}).props || {}) : {};
    if (!Object.keys(L.pseudoOf).length && figmaContract) {
      const joined = L.joins(figmaContract, story.argTypes).map;
      const mapState = Object.values(joined.props || {}).find((x) => x && typeof x === 'object' && x.pseudo);
      if (mapState) L.pseudoOf = Object.fromEntries(Object.entries(mapState.pseudo).filter(([v]) => !(mapState.skip || []).includes(v)).map(([v, pseudo]) => [v, { pseudo }]));
    }
    // a state the code sets as a prop (loading) stays one of its values beside the forced ones: the source passes it on
    // (the code prop is the contract's interaction prop, whatever its axis is called; its rest is its default)
    const stateKey = L.statesAsArg && figmaContract && Object.keys(figmaContract.props || {}).find((k) => figmaContract.props[k].role === 'interaction');
    const asArg = stateKey && props[stateKey] && props[stateKey].type === 'enum' ? props[stateKey] : null;
    const setStates = asArg ? asArg.values.filter((v) => v !== asArg.default && v !== 'rest' && !(v in L.pseudoOf)) : [];
    if (asArg && Object.keys(L.pseudoOf).length) { L.stateArg = asArg.code; delete props[stateKey]; }
    if (Object.keys(L.pseudoOf).length) props.state = { type: 'enum', values: ['rest', ...Object.keys(L.pseudoOf), ...setStates], default: 'rest', role: 'interaction', pointer: Object.keys(L.pseudoOf), code: '__state' };
    if (L.governed && figmaContract) A.take('empty-shows', { props }, () => emptyShows(props, figmaContract.props, joinedProps, story.args, (L.joins(figmaContract, story.argTypes) || {}).twice));
    const textsOnlyInCode = onlyInCode(props, figmaContract && figmaContract.props, joinedProps);
    let defaults = Object.fromEntries(Object.entries(props).filter(([, p]) => p.type !== 'string').map(([, p]) => [p.code, p.type === 'slot' && !p.placed ? slotMark(p.code) : p.default]));
    // each slot's stand-in, by the prop it stands in for: the element it lands in is the slot
    const marks = Object.entries(props).filter(([, p]) => p.type === 'slot' && !p.placed).map(([k, p]) => [slotMark(p.code), k]);
    // for another component drawn inside this one: each of its booleans that shows a layer, by that layer's selector in its own mapping
    const shownSel = Object.fromEntries(Object.keys(others).map((slug) => {
      const fc = official.get(slug), parts = L.partsOf ? L.partsOf(slug) : null;
      if (!fc || !parts) return [slug, {}];
      return [slug, Object.fromEntries(Object.values(fc.props).filter((q) => q.type === 'boolean' && q.shows && parts[q.shows[0]]).map((q) => [q.figma, parts[q.shows[0]]]))];
    }));
    // and the layers its swaps swap, so a glyph goes to the swap of the layer it is drawn in (a select's caret is no
    // glyph of its menu's slot), as to-markup draws a swap's icon in its own layer
    const swapSel = Object.fromEntries(Object.keys(others).map((slug) => [slug, swappedLayers(official.get(slug), L, slug)]));
    for (const [k, p] of Object.entries(props)) if (p.type === 'slot' && !p.placed) slotArgs[p.code] = slotMark(p.code);

    // one render, read as anatomy. The walk starts at the component's own root: the mapping's `root`, or
    // the framework's root class for it, which holds every part (the first paired element may be one part
    // of it, a switch's track beside its thumb); none, the first paired element
    const own = !L.root && L.instanceOf(ownName);
    const ownRoot = L.root ? `${L.container} ${L.root}` : own && await call(L.tab, (sel) => !!document.querySelector(sel), `${L.container} .${own}`) ? `${L.container} .${own}` : null;
    const rootSel = ownRoot || Object.values(m.elements)[0].selector;
    // pointer states are forced on the component itself, where the mapping names no element that takes them
    for (const at of Object.values(L.pseudoOf)) if (!at.on) at.on = rootSel;
    // a governed mapping states which element is which Figma layer: those take Figma's ids; a compared
    // library's are paired by rule, a guess, so its parts keep the names their markup gives them
    // (each with its kind in the design, for where a placed component's layer lands: elementOfLayer)
    const named = L.governed ? Object.entries(m.elements).map(([id, e]) => [e.selector, id, figmaContract ? kindIn(figmaContract, id) || null : null]).sort((a, b) => a[1].split('/').length - b[1].split('/').length) : [];
    // and its name there (none where its id spells it), for a layer placed inside another component's markup: nameInside
    // (on --second, the first reading's, which the markup was drawn from: layerNames)
    const designNames = L.governed ? layerNames(named.map(([, id]) => id), figmaContract, L.drawnFrom) : null;
    let remPx = null;
    // the room the component is given: Figma's own, so a root that fills its room fills the width Figma draws it at
    // (a canvas fact, as derive records a root fill's), and a fixed or hugging root is read in the same room. Its
    // fixed width, else the room a root that fills is given; a width a token says is not resolved here, and the story's
    // room stays
    const fr = figmaContract && figmaContract.anatomy && figmaContract.anatomy.root || {};
    const room = typeof fr.width === 'number' ? fr.width : fr.width === 'fill' && fr.canvas && typeof fr.canvas.width === 'number' ? fr.canvas.width : null;
    if (room) notes.push(`read in a room ${room} wide, the width Figma draws the component at`);
    const { ownStyling, ownInsides, normalForm, byComponentName, placedAs, placedMatch, wholeHosts } = req('./derive.cjs');
    const mainOf = byComponentName([...official.values()]);
    // the instances the design keeps whole (one hides a layer no prop shows): there it keeps layers equal to its component's,
    // which a partial cut would drop (derive's wholeHosts, the one roundTrip fills by)
    const wholeIn = wholeHosts(figmaContract, mainOf);
    // (and the layers it states a colour for: inside an instance kept whole, only there is the reading's icon colour kept)
    const colouredOf = figmaContract ? colouredIn(figmaContract) : null;
    // the room at the combination read: a variant that sets the root's width (a small breakpoint's 404) gives its own.
    // Joined by name, as the code's props are the design's on the toolkit's own render; a project's own names that
    // differ fall back to the base room, as before
    const comboOf = (args, design = figmaContract) => designCombo(design, props, joinedProps, args, L.pseudoOf, settings);
    const roomOf = (args) => {
      if (!figmaContract) return room;
      const combo = comboOf(args);
      const r = expand(figmaContract, { ...variantDefaults(figmaContract), ...combo }).root || {};
      return typeof r.width === 'number' ? r.width : r.width === 'fill' && r.canvas && typeof r.canvas.width === 'number' ? r.canvas.width : room;
    };
    const read = async (asked) => {
      // (the code's args; `asked` keeps a boolean said by an empty text a boolean, as the design's combination names it)
      const words = { words: L.container !== '#storybook-root' };
      let args = emptiedArgs(asked, props, words);
      try { await show(args); } catch (e) {
        if (!stateHidden(e, asked, props, L.pseudoOf)) throw e;
        // only where the boolean is what took it away: shown, the state finds it; hidden, no element of its own kind is left
        await show(emptiedArgs({ ...asked, ...Object.fromEntries(Object.values(props).filter((p) => p.emptied !== undefined).map((p) => [p.code, true])) }, props, words));
        await show({ ...args, __state: 'rest' });
        const on = ((L.pseudoOf || {})[asked.__state] || {}).on;
        if (!on || await call(L.tab, ([r, s]) => { const box = document.querySelector(r); return !box || !!box.querySelector(s); }, [L.container, subjectOf(on)])) throw e;
        const said = `${asked.__state}: with what takes it hidden by an empty text, nothing takes that state; read as rest there`;
        if (!notes.includes(said)) notes.push(said);
        args = { ...args, __state: 'rest' };
      }
      // whether this combination is drawn focused (a forced :focus or :focus-visible): only there is an outline a focus
      // ring, as to-code writes one (ringOf) and code shows one; at any other state it is the box's own stroke (css.mjs
      // draws a centred or outside stroke as a solid outline)
      // (or drawn so by an arg: a state the code takes as a prop, focus among its values)
      const focused = /focus/.test(JSON.stringify((L.pseudoOf || {})[args.__state] || '')) || Object.entries(args).some(([k, v]) => typeof v === 'string' && /focus/i.test(v) && !Object.values(props).some((p) => p.emptied !== undefined && p.code === k));
      const room = roomOf(asked);
      // the design at the combination read, expanded once where a part asks it
      let here = null;
      const drawnHere = () => here || (here = figmaContract ? expand(figmaContract, { ...variantDefaults(figmaContract), ...comboOf(asked) }) : {});
      if (room) await call(L.tab, ([sel, container, climb, w]) => {
        let root = document.querySelector(sel); if (!root) return;
        const holder = document.querySelector(container);
        if (climb) while (root.parentElement && root.parentElement !== holder && root.parentElement !== document.body) root = root.parentElement;
        const up = root.parentElement; if (!up) return;
        // (as a block of that width, whatever the story's wrapper lays out)
        Object.assign(up.style, { display: 'block', width: `${w}px`, minWidth: '0', maxWidth: 'none', padding: '0' });
      }, [rootSel, L.container, !L.root, room]);
      // a text entry the design draws as two texts (to-code's entryOf): the <input> is its Placeholder until it holds a
      // value, then its Value; the ids, for the walk
      const entry = figmaContract ? (await import('./to-code.mjs')).entryOf(figmaContract) : null, entryIds = entry ? [entry.placeholder, entry.value] : null;
      // the mode axes of the project's tokens, each an attribute an element may carry (tools/tokens/modes.cjs)
      const P = req('../snapshot/projects.cjs');
      // (the tokens this read already holds, the self leg's included, which has no project paths to load them by)
      const modeKeys = modeKeysOf(req('../tokens/modes.cjs').axesOfTokens(L.tokens || (L.where && L.where.paths ? P.tokensOf(L.where.paths) : null)), figmaContract);
      const raw = await call(L.tab, ([sel, others, rootRe, container, named, partRe, modRe, iconRe, cornerSrc, WEIGHT, strokeSrc, marks, climb, shownSel, swapSel, sidesSrc, elementOfLayerSrc, entryIds, modeKeys, unturnSrc, opensPlacedSrc, nameInsideSrc, designNames, cssOrderSrc, cornersSrc, glyphsDrawnSrc, ownLayerSrc, textTypeSrc, wordsSrc, paddingSrc, stackSrc, siblingOrderSrc, liftsSrc, turnSrc, ringsSrc, ownBoxSrc, flowSrc]) => {
        const corner = new Function(`return ${cornerSrc}`)(), corners = new Function(`return ${cornersSrc}`)();
        const shadowOnlyRings = new Function(`return ${ringsSrc}`)(), ownBox = new Function(`return ${ownBoxSrc}`)();
        const insetStroke = new Function(`return ${strokeSrc}`)();
        const sideStrokes = new Function(`return ${sidesSrc}`)(), paddingOf = new Function(`return ${paddingSrc}`)(), flowOf = new Function(`return ${flowSrc}`)();
        // a colour that paints nothing: fully transparent, whatever its channels
        const clear = (c) => /rgba\(.*,\s*0\)$|transparent/.test(c);
        let root = document.querySelector(sel); if (!root) return null;
        const holder = document.querySelector(container);
        // up to the story's top unless the mapping names the root: that is the root, not a wrapper a story puts around it
        if (climb) while (root.parentElement && root.parentElement !== holder && root.parentElement !== document.body) root = root.parentElement;
        // the shallowest layer an element plays names it; a deeper one on the same element is its own words (a label written straight into its box)
        const elementOfLayer = new Function(`return ${elementOfLayerSrc}`)();
        const opensPlaced = new Function(`return ${opensPlacedSrc}`)();
        const nameInside = new Function(`return ${nameInsideSrc}`)(), glyphsDrawn = new Function(`return ${glyphsDrawnSrc}`)(), ownLayer = new Function(`return ${ownLayerSrc}`)();
        for (const [s, id, kind] of named) { const [n, words] = elementOfLayer(document.querySelector(s), id, kind, rootRe, others); if (!n) continue; if (words) { if (!n.hasAttribute('data-figma-text')) n.setAttribute('data-figma-text', id); continue; } if (!n.hasAttribute('data-figma-id')) n.setAttribute('data-figma-id', id); else if (!n.hasAttribute('data-figma-text')) n.setAttribute('data-figma-text', id); }
        const out = [], seen = {};
        const px = (v) => +(+parseFloat(v) || 0).toFixed(2);
        const wordsAsDrawn = new Function(`return ${wordsSrc}`)(), textType = new Function(`return ${textTypeSrc}`)(), typeOf = (n, s) => textType(n, s, WEIGHT);
        const slot = (n) => { if (partRe) for (const c of n.classList) { const x = c.match(new RegExp(partRe)); if (x && !(modRe && new RegExp(modRe).test(x[1]))) return x[1]; } return n.tagName.toLowerCase() === 'svg' ? 'icon' : n.tagName.toLowerCase(); };
        // where code placed a box over its parent, and, where it sits at its parent's centre on an axis (inset 50% and a
        // translate back, a spinner over a button), that it is centred there, as Figma's constraint says it
        const placed = (n) => {
          const pr = turnOf(n, getComputedStyle).up.getBoundingClientRect(), r = n.getBoundingClientRect();
          // (a box as wide as its parent fills it on that axis, which says nothing of centring)
          const mid = (a, b, c, d) => Math.abs((a + b / 2) - (c + d / 2)) < 0.75 && Math.abs(b - d) >= 0.75;
          const h = mid(r.left, r.width, pr.left, pr.width), v = mid(r.top, r.height, pr.top, pr.height);
          return { absolute: { x: px(r.left - pr.left), y: px(r.top - pr.top) }, ...((h || v) && { constraints: { horizontal: h ? 'center' : 'min', vertical: v ? 'center' : 'min' } }) };
        };
        // a CSS order counts where the browser lays it out: the part's own parent box, a flex or grid one
        // a mirror, said as `scale: -1 1` or a transform's matrix (scaleX(-1)): x horizontal, y vertical
        const mirrored = (s) => {
          const sc = String(s.scale || 'none').trim().split(/\s+/).map(Number);
          if (sc.length && !isNaN(sc[0])) { const [x, y = x] = sc; if (x < 0 && y > 0) return 'x'; if (y < 0 && x > 0) return 'y'; }
          const m = /^matrix\(([^)]+)\)$/.exec(s.transform || ''); if (!m) return null;
          const [a, b, c, d] = m[1].split(',').map(Number);
          return a * d - b * c < 0 && Math.abs(b) < 1e-6 && Math.abs(c) < 1e-6 ? (a < 0 ? 'x' : 'y') : null;
        };
        const turnOf = new Function(`return ${turnSrc}`)();
        const cssOrderOf = new Function(`return ${cssOrderSrc}`)(), stackOf = new Function(`return ${stackSrc}`)(), liftsAlone = new Function(`return ${liftsSrc}`)(), placedBy = (n, parent) => { const o = cssOrderOf(n, parent, getComputedStyle), st = parent != null ? stackOf(n, getComputedStyle, liftsAlone) : {}; return { ...(o != null && { cssOrder: o }), ...(Object.keys(st).length && { stack: st }) }; };
        const walk = (n, parent, order, inside = false) => {
          // a turn's wrapper is no part: what it holds is the part, in its place among its siblings
          if (n.hasAttribute('data-turn')) { if (n.firstElementChild) walk(n.firstElementChild, parent, order, inside); return; }
          const s = getComputedStyle(n), node = n, style = s;
          // not drawn: hidden, or a native control MUI keeps for its behaviour at no opacity (a switch's input); a layer
          // the mapping names at no opacity is drawn and see-through (a loading button's label keeps its width)
          if (s.display === 'none' || s.visibility === 'hidden' || (+s.opacity === 0 && !n.hasAttribute('data-figma-id'))) return;
          // inside a placed component, only a layer the mapping names is this one's (an override the contract keeps there);
          // the rest is that component's own, read in its own audit
          // (`inside`: the placed instance's id) a layer the mapping names under that instance; another component's root
          // there is that one's, never searched (one level deep); a mapped element the mapping places elsewhere is not this one's
          if (inside && !String(n.getAttribute('data-figma-id') || '').startsWith(`${inside}/`)) { if (isRoot(n)) return; let i = 0; for (const c of n.children) walk(c, parent, i++, inside); return; }
          const tag = n.tagName.toLowerCase();
          // an element the mapping states is a Figma layer takes that layer's id; else its place and its part's name
          let id = parent == null ? 'root' : n.getAttribute('data-figma-id') || `${parent === 'root' ? '' : `${parent}/`}${slot(n)}`;
          // a text entry: its words are its value, else its placeholder, and it is the design's text for whichever it shows
          const entryEl = (tag === 'input' && !/^(checkbox|radio|range|file|color|button|submit|reset|hidden|image)$/.test(n.type)) || tag === 'textarea';
          if (entryEl && entryIds && parent != null) id = n.value ? entryIds[1] : entryIds[0];
          const counted = id;
          seen[id] = (seen[id] || 0) + 1; if (seen[id] > 1) id += seen[id];
          // its own words, as drawn: a thin space is a character (MUI's required mark is "\u2009*", two text nodes)
          // (white space as the element draws it: a code block keeps its newlines and indents, from-code wordsAsDrawn)
          const plain = (t) => t.replace(/[ \n\t\r]+/g, ' ');
          const text = entryEl ? plain(n.value || n.placeholder || '').trim() : wordsAsDrawn(n, s);
          // a box whose only content is its words is a text, unless the mapping says its words are a layer of their own
          // the element a slot's stand-in landed in is the slot, what the caller puts there its content, not its parts
          const filled = marks.find(([m]) => text === m);
          // an icon is an svg, or the mark to-markup leaves for the project to draw one in (an empty element naming it, data-icon)
          // a placed component's slot this one fills (to-markup marks its slots, data-slot): a slot, what is put in it read
          const fills = inside && n.getAttribute('data-slot');
          const kind = filled || fills ? 'slot' : tag === 'svg' || (n.hasAttribute('data-icon') && !n.children.length && !n.textContent.trim()) ? 'graphic' : text && !n.children.length && (entryEl || !n.hasAttribute('data-figma-text')) ? 'text' : 'container';
          // the design's own name for a layer whose name its id does not give back, where the markup carries it (to-markup's data-figma-name)
          // (inside a placed component, the design's for the layer the mapping places there: nameInside)
          const figmaName = nameInside(inside, n.getAttribute('data-figma-id'), n.getAttribute('data-figma-name'), designNames);
          // (a name the design gives that the markup does not carry is borrowed: said, so the reading tags it)
          // (as nameBorrowed says it, node side: the page gets nameInside's source only)
          const nameBorrowed = (figmaName ?? null) !== (nameInside(inside, n.getAttribute('data-figma-id'), n.getAttribute('data-figma-name'), null) ?? null);
          // a variable mode it sets, under the attribute the token build writes it as (to-markup writes it so)
          // (the root's, where a custom element hosts the control and carries the root's hooks, its host's: only the host the
          // root's own selector names as its parent (`ds-button > button`), never a wrapper around it, a story's decorator or
          // a component placing this one, nor further up, where a page's own theme attribute is no mode the component sets)
          const hostSel = /^(.*\S)\s*>\s*[^>]+$/.exec(sel || '');
          const host = parent == null && hostSel && n.parentElement && n.parentElement.tagName.includes('-') && (() => { try { return n.parentElement.matches(hostSel[1]); } catch { return false; } })() ? n.parentElement : null;
          const modes = Object.fromEntries(modeKeys.map((k) => [k, n.getAttribute(`data-${k}`) || (host && host.getAttribute(`data-${k}`))]).filter(([, v]) => v));
          const e = { id, kind, ...(parent != null && { parent, order }), ...placedBy(n, parent), ...(figmaName && { name: figmaName }), ...(nameBorrowed && { nameBorrowed }), ...(+s.opacity < 1 && { opacity: +(+s.opacity).toFixed(3) }), ...(mirrored(s) && { flip: mirrored(s) }), ...(turned.get(n) && { rotation: turned.get(n) }), ...(Object.keys(modes).length && { modes }), ...(filled && { content: `{${filled[1]}}` }), ...(fills && { content: `{${fills}}` }), ...(inside && parent === inside && n.parentElement && n.parentElement.getAttribute('data-contract-id') === inside && { keepOrder: true }) };
          // the box it renders at, kept beside the reading (never in it: it moves with content), for sizes the design states
          // (a host that draws no box, display: contents, renders at its control's: the box in the flow)
          { const b = s.display === 'contents' && n.firstElementChild ? n.firstElementChild : n, r = b.getBoundingClientRect(); e.box = [px(r.width), px(r.height)]; }
          // a slot holding only words: its text styles kept aside, for where the design draws a text there
          if (filled && !n.children.length) e.asText = { color: s.color, type: typeOf(n, s), textAlign: s.textAlign === 'left' ? 'start' : s.textAlign === 'right' ? 'end' : s.textAlign };
          n.setAttribute('data-contract-id', id);
          // a part turned a quarter: its wrapper, which its parent lays out, read for its sizes on the parent's axes (turnOf)
          const tn = turnOf(n, getComputedStyle);
          if (tn.turned) { tn.wrap.setAttribute('data-contract-turn', id); }
          // and its box's parent, for its own declarations read beside its parent's (a size is the two together)
          const up = (x) => { const P = turnOf(n, getComputedStyle).up; if (P) P.setAttribute('data-contract-up', `${P.getAttribute('data-contract-up') || ''} ${x}`.trim()); };
          up(id);
          // another component of the library, drawn inside this one (a chip's avatar): an instance of it, its
          // inside the other component's business; named by the library's own class (MuiAvatar-root)
          const other = parent != null && rootRe && [...n.classList, n.tagName.toLowerCase()].map((c) => (c.match(new RegExp(rootRe)) || [])[1]).find((x) => x && others[x]);
          // another component's root, by the same test: a class the instance pattern matches and a component of the library names
          function isRoot(el) { return !!rootRe && [...el.classList, el.tagName.toLowerCase()].some((c) => { const x = (c.match(new RegExp(rootRe)) || [])[1]; return x && others[x]; }); }
          // named by the component it places where the mapping names it not (a layer the mapping states keeps its id: a
          // boolean's part, showMenuContextMenu, is no contextMenu)
          if (other && !n.hasAttribute('data-figma-id')) { seen[counted]--; id = `${parent === 'root' ? '' : `${parent}/`}${other[0].toLowerCase()}${other.slice(1).replace(/-(.)/g, (_, c) => c.toUpperCase())}`; seen[id] = (seen[id] || 0) + 1; if (seen[id] > 1) id += seen[id]; }
          if (other) {
            n.setAttribute('data-contract-id', id); up(id);
            // (its opacity as a box's: kept below only where this component's own rule writes it, INSTANCE_CSS)
            out.push({ id, kind: 'instance', parent, order, ...placedBy(n, parent), ...(+s.opacity < 1 && { opacity: +(+s.opacity).toFixed(3) }), ...(mirrored(s) && { flip: mirrored(s) }), ...(turned.get(n) && { rotation: turned.get(n) }), ...(Object.keys(modes).length && { modes }), ...(inside && parent === inside && n.parentElement && n.parentElement.getAttribute('data-contract-id') === inside && { keepOrder: true }), ...(figmaName && { name: figmaName }), component: others[other], width: px(s.width), height: px(s.height), box: [px(n.getBoundingClientRect().width), px(n.getBoundingClientRect().height)], ...(n.querySelector('img') && { image: true }),
              // placed by code at a point over its parent (a loading button's spinner over the content), as a box is
              ...(s.position === 'absolute' && !tn.turned && placed(n)),
              // what its own markup says of its props (data-size="xs", disabled), and its icons' names, for the props it is drawn at
              // (and a control inside it that is its own, not another instance's, saying it is disabled: an icon button
              // whose host wraps the <button> that carries it)
              slug: other, attrs: Object.fromEntries([...n.attributes].map((a) => [a.name, a.value])),
              innerDisabled: !n.hasAttribute('disabled') && [...n.querySelectorAll('button[disabled], input[disabled], select[disabled], textarea[disabled], fieldset[disabled]')].some((m) => { for (let up = m.parentElement; up && up !== n; up = up.parentElement) if (isRoot(up)) return false; return true; }),
              // its words, in the order it shows them: each element's own text, where it is drawn
              // each boolean that shows a layer: whether that layer is drawn in it, found where its own mapping places it
              // (not one of another instance nested in it, and drawn: seen, not merely present)
              shown: Object.fromEntries(Object.entries(shownSel[other] || {}).map(([p, q]) => {
                const seen = (m) => { const cs = getComputedStyle(m); return m.getClientRects().length && cs.visibility !== 'hidden' && +cs.opacity > 0; };
                return [p, [...n.querySelectorAll(q)].some((m) => ownLayer(m, n, q, isRoot) && seen(m))];
              })),
              // (its own root's included; none hidden, read to screen readers only, or of another instance nested in it)
              texts: [n, ...n.querySelectorAll('*')].filter((t) => {
                if (!t.getClientRects().length || ![...t.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) return false;
                const cs = getComputedStyle(t), r = t.getBoundingClientRect();
                if (cs.visibility === 'hidden' || +cs.opacity === 0 || r.width <= 1 || r.height <= 1 || t.closest('[aria-hidden="true"]')) return false;
                for (let up = t === n ? null : t; up && up !== n; up = up.parentElement) if (isRoot(up)) return false;
                return true;
              }).map((t) => wordsAsDrawn(t, getComputedStyle(t))),
              // its icons' names, all and by the swapped layer each is drawn in
              ...glyphsDrawn(n, swapSel[other], iconRe, isRoot, ownLayer) });
            // its own styling over its component's root (a toggle's fill on its toggle item), folded back where it is that root's
            // (ownStyling); drawn over its parent where it paints, as a box is
            // (no arc: its component's drawing; an outline is its own stroke where this component writes it (css.mjs draws an
            // outside or centred stroke as one), kept below only so, INSTANCE_CSS, never a ring of a box of its own, ::after)
            // (off the box it draws: a host that draws none, display: contents, draws it through its control, where to-code
            // writes this component's override on it, `> button`)
            { const ie = out[out.length - 1], bx = ownBox(n, getComputedStyle); boxStyling(ie, bx); if (!ie.border && !ie.outline && !ie.ownOutline) ie.strokeless = true; { const cs = getComputedStyle(bx); if (clear(cs.backgroundColor) && cs.backgroundImage === 'none') ie.fillless = true; if (shadowOnlyRings(cs.boxShadow)) ie.shadowless = true; if (cs.overflow === 'visible') ie.clipless = true; if (cs.mixBlendMode === 'normal') ie.blendless = true; } delete ie.arc; delete ie.clipBox; delete ie.mixBlend; { const o = ie.ownOutline || (ie.outline && !ie.outline.after ? ie.outline : null); delete ie.outline; delete ie.ownOutline; if (o) ie.ownOutline = o; } if (ie.background) { let a = n.parentElement; while (a && !ie.under) { const bg = getComputedStyle(a).backgroundColor; if (!clear(bg)) ie.under = bg; a = a.parentElement; } } }
            // the layers the mapping names inside it, where the mapping names it too, at any depth of placing (opensPlaced; an
            // unmapped one's code id, avatar2, is not yet the design's, avatar_2, so its overrides could not be told apart)
            // (each at its place among the component's own drawn children, which this reading does not all read)
            if (opensPlaced(inside, id, n.hasAttribute('data-figma-id'))) { let i = 0; for (const c of n.children) { const cs = getComputedStyle(c); if (cs.display === 'none' || cs.visibility === 'hidden') continue; walk(c, id, i++, id); } }
            return; }
          // an icon set's name for it, where its markup says it (data-icon) or its class carries one (lucide-circle-x), as Figma's swap names it
          if (kind === 'graphic') { e.width = px(s.width); e.height = px(s.height); e.icon = s.color; if (tag !== 'svg') e.mark = true; const set = iconRe && [...n.classList].map((c) => c.match(new RegExp(iconRe))).find(Boolean); if (n.getAttribute('data-icon')) e.asset = n.getAttribute('data-icon'); else if (set) e.asset = set[1]; if (n.getAttribute('data-icon-size')) e.iconSize = n.getAttribute('data-icon-size'); }
          else if (kind === 'text') { e.color = entryEl && !n.value ? getComputedStyle(n, '::placeholder').color : s.color; e.type = typeOf(n, s); e.textAlign = s.textAlign === 'left' ? 'start' : s.textAlign === 'right' ? 'end' : s.textAlign; e.content = text; }
          // an icon mark, a placed component drawn as the empty element to-markup leaves for it (one the store does not hold),
          // is a box to-code styles as the instance's own: its stroke, corners and clipping read as a box's, its fill
          // staying the glyph's colour (above)
          if (kind === 'graphic' && e.mark) { const own = {}; boxStyling(own); for (const k of ['radius', 'full', 'cornerShape', 'outline', 'ownOutline', 'border', 'overflow', 'shadow', 'shadowAll', 'ringsUsed']) if (own[k] !== undefined) e[k] = own[k]; }
          if (kind === 'container' || kind === 'text' || kind === 'slot') {
            boxStyling(e);
            // a box no flex lays out, or one with nothing to hug, has a size of its own (a switch's thumb, an avatar's image)
            if (kind === 'container' && (!n.children.length || !/flex/.test(s.display))) { e.width = px(s.width); e.height = px(s.height); }
            // placed by code at a point inside its parent (a thumb over its track): where, so a drawing can place it so
            if (parent != null && s.position === 'absolute' && !tn.turned) Object.assign(e, placed(n));
          }
          // a box's own styling as the contract says it: its layout, fill, corners, stroke, clipping and shadow, read off
          // its computed style (a container's, a text's, a slot's; and a placed instance's own, what it sets over its
          // component's root, which derive's ownStyling folds back where it is that root's)
          // (`at`: the element whose box it is, the walked one's own unless said: a placed instance's control, below)
          function boxStyling(e, at = null) {
            const n = at || node, s = at ? getComputedStyle(at) : style;
            if (/flex/.test(s.display)) {
              const A = { 'flex-start': 'start', 'flow-start': 'start', start: 'start', normal: 'start', center: 'center', 'flex-end': 'end', 'flow-end': 'end', end: 'end', 'space-between': 'space-between', stretch: 'stretch' };
              e.layout = { ...flowOf(s, px), align: A[s.justifyContent] || s.justifyContent, crossAlign: A[s.alignItems] || s.alignItems };
            }
            // (start and end by its direction: right to left, the start is the right, paddingOf)
            const pad = paddingOf(s, px);
            if (Object.values(pad).some(Boolean)) { (e.layout = e.layout || {}).padding = pad; if (s.direction === 'rtl') e.rtl = true; }
            if (!clear(s.backgroundColor)) e.background = s.backgroundColor;
            // its background's layers above the colour (a gradient, a colour laid over another): read back as Figma's fills below
            if (s.backgroundImage && s.backgroundImage !== 'none') { const r = n.getBoundingClientRect(); e.paint = { image: s.backgroundImage, size: s.backgroundSize, repeat: s.backgroundRepeat, w: r.width, h: r.height }; }
            { const r = n.getBoundingClientRect(); Object.assign(e, corners([s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius], r.width, r.height, corner)); }
            // a corner's shape where it is not the plain circle, on whichever corner says one (rules.mjs reads it back as
            // smoothing; to-code writes it on all four, a square corner included)
            { const sh = ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map((c) => s.getPropertyValue(`corner-${c}-shape`)).find((v) => v && v !== 'round'); if (sh) e.cornerShape = sh; }
            // an arc drawn as a mask (css.mjs): a conic sweep from the top, back to Figma's angle from the x axis, and a
            // radial cut's ratio as its inner radius
            { const m = String(s.maskImage || s.webkitMaskImage || '').replace(/rgba?\([^)]*\)/g, 'C');
              const c = m.match(/conic-gradient\((?:from (-?[\d.]+)deg,\s*)?C (-?[\d.]+)deg/);
              if (c) { const turn = (a) => +((((a % 360) + 360) % 360).toFixed(2)), from = +(c[1] || 0), r = m.match(/radial-gradient\([^,]*,\s*C ([\d.]+)%/);
                e.arc = { start: turn(from - 90), end: +(turn(from - 90) + +c[2]).toFixed(2), inner: r ? +(+r[1] / 100).toFixed(4) : 0 }; } }
            // a vector's own outline drawn as the box's clip (css.mjs, rules.mjs pathsToCss), read back below as its paths
            // (where the box is one the markup draws a vector as: empty, hidden from readers; rules.mjs pathsOfBox)
            // (or as a mask of an SVG of its paths, where no one clip says them: rules.mjs pathsToMask)
            if (/^path\(/.test(String(s.clipPath || '')) || /^url\("data:image\/svg\+xml,/.test(String(s.maskImage || ''))) e.clipBox = { clipPath: s.clipPath, maskImage: s.maskImage, ariaHidden: n.getAttribute('aria-hidden') === 'true', children: n.children.length, text: n.textContent, icon: n.hasAttribute('data-icon') };
            // its blend (css.mjs mix-blend-mode), read back below in Figma's spelling
            if (s.mixBlendMode && s.mixBlendMode !== 'normal') e.mixBlend = s.mixBlendMode;
            // a focus ring drawn as the box's outline (taking no room; the browser's own, style auto, is not the design's): read, and drawn below as the layer the design has
            if (!['none', 'auto'].includes(s.outlineStyle) && px(s.outlineWidth) > 0) e[s.outlineStyle === 'dashed' ? 'ownOutline' : 'outline'] = { color: s.outlineColor, width: px(s.outlineWidth), offset: px(s.outlineOffset), ...(s.outlineStyle === 'dashed' && { dashed: true }), ...(() => { const r = n.getBoundingClientRect(), c = corner(s.borderTopLeftRadius, r.width, r.height); return { radius: c.radius, full: !!c.full }; })() };
            // or as the outline of a box of its own over this one (::after, to-code's ring where this box keeps its corners):
            // read the same way, its corners that box's, its offset from this box's edge (that box stands `d` inside it)
            // (beside its own outline too: then that outline is the box's own stroke, as css.mjs draws one outside, centred or dashed)
            { const f = getComputedStyle(n, '::after'); if (f.content && f.content !== 'none' && f.position === 'absolute' && !['none', 'auto'].includes(f.outlineStyle) && px(f.outlineWidth) > 0) { const r = n.getBoundingClientRect(), d = px(s.borderTopWidth) + px(f.top), c = corner(f.borderTopLeftRadius, r.width - 2 * d, r.height - 2 * d); if (e.outline) e.ownOutline = e.outline; e.outline = { color: f.outlineColor, width: px(f.outlineWidth), offset: px(f.outlineOffset) - d, radius: c.radius, full: !!c.full, after: true }; } }
            // a css border takes room, as a Figma stroke in the layout does: each side's width, one where all are alike
            const EDGES = ['Top', 'Right', 'Bottom', 'Left'];
            const bw = EDGES.map((k) => (s[`border${k}Style`] !== 'none' ? px(s[`border${k}Width`]) || 0 : 0));
            const layers = String(s.boxShadow) === 'none' ? [] : String(s.boxShadow).split(/,(?![^(]*\))/);
            // a stroke on some sides drawn as offset rings (css.mjs writes them so: values.mjs sideStrokes reads them back)
            const ss = !bw.some(Boolean) && !layers.some((p) => insetStroke(p) && insetStroke(p).width > 0) ? sideStrokes(layers) : null;
            if (bw.some(Boolean)) {
              const color = s[`border${EDGES[bw.findIndex(Boolean)]}Color`];
              e.border = bw.every((v) => v === bw[0]) ? { color, width: bw[0], inLayout: true } : { color, width: bw, sides: { top: bw[0], end: bw[1], bottom: bw[2], start: bw[3] }, inLayout: true };
              // (dashed, as css.mjs writes a dashed stroke that takes room)
              if (EDGES.some((k, i) => bw[i] && s[`border${k}Style`] === 'dashed')) e.border.dash = 'dashed';
            }
            // a stroke drawn as an inset shadow with no offset and no blur is a border (values.mjs insetStroke, as the code audit reads it)
            else if (ss) e.border = { color: ss.colour, width: ['top', 'end', 'bottom', 'start'].map((k) => px(ss.sides[k])), sides: ss.sides, ...(ss.align === 'outside' && { align: 'outside' }), ...(clear(ss.colour) && { clearRing: true }) };
            else { const st = layers.map(insetStroke).find((x) => x && x.width > 0); if (st) e.border = { color: st.colour, width: px(st.width) }; }
            if (s.overflow === 'hidden') e.overflow = 'hidden';
            // its shadow: drop shadows and inner ones
            // every shadow but the border read above: an inset one with no offset or blur, or a side's ring
            const isBorder = (p, i) => !!insetStroke(p) || !!(ss && ss.used.includes(i));
            const drops = layers.filter((p, i) => !isBorder(p, i));
            if (drops.length) e.shadow = drops.join(',');
            // the side rings taken as a border, with the shadow they came from: a style that draws them itself takes them back (below)
            if (ss) { e.shadowAll = layers.join(','); e.ringsUsed = ss.used.map((i) => layers[i]); }
          }
          // what it is drawn over: the nearest ancestor that paints, for a translucent colour's token
          let a = kind === 'container' && e.background ? n.parentElement : n, under = null;
          while (a && !under) { const bg = getComputedStyle(a).backgroundColor; if (!clear(bg)) under = bg; a = a.parentElement; }
          e.under = under;
          out.push(e);
          // a box's children, and its own words where it has them beside its children (a label written straight
          // into a link beside its icon): a text part of its own, where it sits among them
          if (kind === 'container' || fills) {
            let i = 0, said = false;
            for (const c of n.childNodes) {
              if (c.nodeType === 1) walk(c, id, i++, inside);
              // (inside a placed instance, only words the mapping names: the rest are that component's)
              else if (c.nodeType === 3 && text && !said && (!inside || n.hasAttribute('data-figma-text')) && plain(c.textContent).replace(/ /g, '')) {
                said = true;
                let tid = n.getAttribute('data-figma-text') || `${id === 'root' ? '' : `${id}/`}text`;
                seen[tid] = (seen[tid] || 0) + 1; if (seen[tid] > 1) tid += seen[tid];
                // drawn over this box's own fill where it paints one, else over what this box is drawn over
                const over = clear(s.backgroundColor) ? under : s.backgroundColor;
                out.push({ id: tid, kind: 'text', parent: id, order: i++, color: s.color, type: typeOf(n, s),
                  textAlign: s.textAlign === 'left' ? 'start' : s.textAlign === 'right' ? 'end' : s.textAlign, content: text, under: over });
              }
            }
          }
        };
        // (measured as laid out, each turn kept: unturn)
        const { turned, restore } = new Function(`return ${unturnSrc}`)()(root);
        try { walk(root, null, 0); } finally { restore(); }
        // an order counts only the siblings drawn
        const byParent = {}; for (const e of out) if (e.parent != null) (byParent[e.parent] = byParent[e.parent] || []).push(e);
        // (one inside a placed component keeps its place among that component's own, most of which are not read here)
        // placed as the browser paints them (rules.mjs siblingOrder): the flow by CSS order before the markup's (a variant
        // that reverses its parts, to-code's `order`), ties as written; a part out of the flow where it paints, never by an order
        const siblingOrder = new Function(`return ${siblingOrderSrc}`)();
        for (const xs of Object.values(byParent)) siblingOrder(xs).forEach((e, i) => { if (!e.keepOrder) e.order = i; delete e.keepOrder; delete e.cssOrder; delete e.stack; });
        return out;
      }, [rootSel, others, L.instancePattern, L.container, named, partClass, partModifiers, iconClass, cornerOf.toString(), Object.fromEntries([100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((w) => [w, weightName(w)])), insetStroke.toString(), marks, !L.root, shownSel, swapSel, sideStrokes.toString(), elementOfLayer.toString(), entryIds, modeKeys, unturn.toString(), opensPlaced.toString(), nameInside.toString(), designNames, cssOrderOf.toString(), cornersOf.toString(), glyphsDrawn.toString(), ownLayer.toString(), textTypeOf.toString(), wordsAsDrawn.toString(), paddingOf.toString(), stackOf.toString(), siblingOrder.toString(), liftsAlone.toString(), turnOf.toString(), shadowOnlyRings.toString(), ownBoxOf.toString(), flowOf.toString()]);
      if (!raw) throw new Error(`${rootSel} drew nothing with ${JSON.stringify(args)}`);
      // a name its id here spells back is no name of its own (a placed menu's "Action footer" at actionFooter), by
      // derive's own test, which keeps one the id does not say ("Context menu item / Default", "Item 2" at item2)
      for (const e of raw) if (e.name && (e.parent == null || !keepsName(e.name, e.id))) delete e.name;
      // each element's matched styles fetched once for all the properties this render reads of it
      // (through the read cache, where the reading has one: read-cache.mjs; fetchLevels' source is part of the question)
      const styles = L.cache ? Object.assign(new Map(), { through: (sel, f) => L.cache.step('levels', `${fetchLevels}\0${sel}`, f) }) : new Map();
      // the element each part's own styling is written on: a placed instance whose host draws no box (display: contents),
      // its control (ownBoxOf, where boxStyling read it; to-code writes its override there), else the part itself
      const viaControl = new Set(await call(L.tab, ([ids, src]) => { const own = new Function(`return ${src}`)(); return ids.filter((id) => { const n = document.querySelector(`[data-contract-id="${id}"]`); return !!n && own(n, getComputedStyle) !== n; }); }, [raw.filter((e) => e.kind === 'instance').map((e) => e.id), ownBoxOf.toString()]));
      const styledAt = (id) => boxSelector(id, viaControl.has(id) ? 'contents' : null);
      // a whole computed border may be a floored one (1.5px reads 1px): the cascade's, as the code audit reads it
      for (const e of raw) if (e.border && Number.isInteger(e.border.width)) { const w = await authoredWidth(L.tab, styledAt(e.id), 'border-top-width', { cache: styles }); if (w != null && Math.floor(w) === e.border.width) e.border.width = w; }
      // a box the code sizes itself (height: 24px, a minimum), which a hug would lose: the cascade's own value,
      // as the contract's minHeight/minWidth (Figma's min sizes on an auto layout)
      // written physically or logically (block-size is height in a horizontal writing mode), in px or rem
      if (remPx == null) remPx = await call(L.tab, () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
      // where a text is cut: the declarations of the element that holds its words; white-space as it computes, as a
      // parent's nowrap reaches the words (an inherited property)
      const readCut = async (e, loose) => {
        const sel = `[data-contract-id="${loose ? e.parent : e.id}"]`, cut = {};
        for (const p of LINES_CSS) cut[p] = await authoredWidth(L.tab, sel, p, { raw: true, cache: styles });
        // (a text written never to wrap, and not cut, grows both ways whatever size it states: rules.mjs autoResizeOf)
        const nowrap = e.kind === 'text' && writtenNowrap(cut['white-space'], loose, e.width === 'fill');
        cut['white-space'] = await call(L.tab, (q) => { const n = document.querySelector(q); return n ? getComputedStyle(n).whiteSpace : null; }, sel);
        const lines = linesFromCss(cut, e.content);
        // (and one whose minimum height is its words' own grows down at the height it states: css.mjs)
        const grows = e.kind === 'text' && !loose && !lines && growsDown(await authoredWidth(L.tab, sel, 'min-block-size', { raw: true, cache: styles }) || await authoredWidth(L.tab, sel, 'min-height', { raw: true, cache: styles }));
        if (e.kind === 'text') e.autoResize = autoResizeOf(e.width, e.height, nowrap && !lines, grows);
        // (the overflow a cut needs is the cut's, as css.mjs writes it for one: no clip of the text's own beside it)
        if (lines) { Object.assign(e, lines); if (e.kind === 'text' && e.overflow === 'hidden') delete e.overflow; }
      };
      const lengthOf = (v) => { const m = /^\s*(-?[\d.]+)(px|rem)\s*$/.exec(v || ''); return m ? +(+m[1] * (m[2] === 'rem' ? remPx : 1)).toFixed(2) : null; };
      // a minimum or maximum the code writes (a set size is the size's own, read with the sizing below)
      // (one taken from a var's computed length: kept only where the tokens name it back, never as the length a window gave)
      const viaVar = new Set();
      // the icon marks (the walk's `mark`), kept here and off the reading
      const mark = new Set(raw.filter((e) => e.mark).map((e) => e.id)); for (const e of raw) delete e.mark;
      // (a placed instance's too, on the box in its parent's flow: a host that draws none, display: contents, through its control)
      const boxOf = async (e) => { const q = `[data-contract-id="${e.id}"]`; return e.kind === 'instance' && await call(L.tab, (s) => { const n = document.querySelector(s); return !!n && getComputedStyle(n).display === 'contents' && !!n.firstElementChild; }, q) ? `${q} > :first-child` : q; };
      // the parts turned a quarter (turnOf): laid out by their wrapper, which the parent lays out, never by a place of their
      // own; their minimum and maximum are the wrapper's, on the swapped axis (to-code writes them so)
      const turnedIds = new Set(await call(L.tab, () => [...document.querySelectorAll('[data-contract-turn]')].map((n) => n.getAttribute('data-contract-turn'))));
      const SWAP = { minWidth: 'minHeight', minHeight: 'minWidth', maxWidth: 'maxHeight', maxHeight: 'maxWidth' };
      for (const e of raw) if (['container', 'slot', 'text', 'instance'].includes(e.kind) || mark.has(e.id)) { const turnedHere = turnedIds.has(e.id), q = turnedHere ? flowSelector(e.id, turnedIds) : await boxOf(e); for (const [css, side] of [['min-height', 'minHeight'], ['min-block-size', 'minHeight'], ['min-width', 'minWidth'], ['min-inline-size', 'minWidth'], ['max-height', 'maxHeight'], ['max-block-size', 'maxHeight'], ['max-width', 'maxWidth'], ['max-inline-size', 'maxWidth']]) {
        const field = turnedHere ? SWAP[side] : side;
        const w = await authoredWidth(L.tab, q, css, { raw: true, cache: styles });
        // (one written as a token, var(): the length it computes to, which the tokens below name back as that token)
        const own = lengthOf(w), v = own ?? (/^\s*var\(/.test(w || '') ? lengthOf(await call(L.tab, ([q, prop]) => { const n = document.querySelector(q); return n ? getComputedStyle(n).getPropertyValue(prop) : null; }, [q, css])) : null);
        if (v && !(field in e)) {
          e[field] = v; if (own == null) viaVar.add(`${e.id}.${field}`);
          // written to hold only while the box holds no element (to-code's whileEmpty, `:not(:has(*))`): said so
          if (/:not\(:has\(\*\)\)\s*$/.test(await authoredSelector(L.tab, q, css, styles) || '') && !(e.whileEmpty || []).includes(field)) e.whileEmpty = [...(e.whileEmpty || []), field].sort((x, y) => (x === 'minWidth' ? -1 : y === 'minWidth' ? 1 : 0)); // (derive's order: width, then height)
        }
      } }
      // layout and sizing as the code wrote them, read through the one table (rules.mjs) from the element's and its
      // parent's authored declarations: never a measured box, which keeps no hug or fill (CSSOM gives used pixels).
      // A fixed size keeps the length it renders at, which is the length written; a placed part is phase 5's.
      // where no rule sets display, the box's own (a span is inline, a div block): the computed value, which for
      // display is what was written or the element's default, never a measurement
      const unsized = [], pulledBy = {};
      const shown = await call(L.tab, (src) => { const turnOf = new Function(`return ${src}`)(); return Object.fromEntries([...document.querySelectorAll('[data-contract-id]')].map((n) => { const P = turnOf(n, getComputedStyle).up; return [n.getAttribute('data-contract-id'), [getComputedStyle(n).display, P ? getComputedStyle(P).display : 'block']]; })); }, turnOf.toString());
      // where each part sits in its parent, all four edges measured from the parent's box (as Figma measures x and y),
      // for an offset written as a token and for a point placed() never measured
      const insets = await call(L.tab, ([src, tsrc]) => { const { restore } = new Function(`return ${src}`)()(document.documentElement), turnOf = new Function(`return ${tsrc}`)(); try { return Object.fromEntries([...document.querySelectorAll('[data-contract-id]')].map((n) => { const r = n.getBoundingClientRect(), p = turnOf(n, getComputedStyle).up.getBoundingClientRect(), q = (v) => +v.toFixed(2); return [n.getAttribute('data-contract-id'), { x: q(r.left - p.left), y: q(r.top - p.top), end: q(p.right - r.right), bottom: q(p.bottom - r.bottom) }]; })); } finally { restore(); } }, [unturn.toString(), turnOf.toString()]);
      // (a part with no place of its own inside a placed component, unplacedIn: the walk's place for it is left out too)
      const layoutOf = (u) => (u.kind === 'instance' ? (((mainOf(u.component, u.key) || {}).anatomy || {}).root || {}).layout : u.layout);
      for (const e of raw) if (e.parent != null && unplacedIn(raw, e, layoutOf)) { delete e.absolute; if (e.position === 'absolute') delete e.position; }
      for (const e of raw) {
        if (!['container', 'text', 'slot', 'instance', 'graphic'].includes(e.kind)) continue;
        // placed out of the flow: its constraints and far offsets as written, through the table; its point as Figma
        // records x and y, where it sits
        // (the root is placed by whatever shows it, never by Figma: its size is read below)
        if (e.id in shown && e.parent != null && !turnedIds.has(e.id)) {
          const pos = {};
          for (const p of PLACE_CSS) pos[p] = await authoredWidth(L.tab, `[data-contract-id="${e.id}"]`, p, { raw: true, cache: styles });
          const place = placeFromCss(pos);
          // (fixed is placed against the viewport, not the parent Figma measures from: left to the walk)
          if (place && !/fixed/.test(String(pos.position || ''))) {
            // (in a box of this component's with no auto layout every part is placed so, and the design writes no
            // position there; a placed component's insides keep it, as its entry here carries no layout of its own)
            const up = raw.find((r) => r.id === e.parent);
            // (inside a placed component, a part in a box with no auto layout sits where its component puts it: the
            // design writes no place for it (derive.cjs, inInstance) and an instance cannot move it, so none is read)
            const unplaced = unplacedIn(raw, e, layoutOf);
            if (!unplaced && (!up || up.kind === 'instance' || (up.layout && up.layout.direction))) e.position = 'absolute';
            // where the declarations say an edge (or both) but the box sits centred and sized on its own (a transform
            // the table does not read, auto margins between two insets), the centre the walk measured is the truth
            const measured = (e.constraints || {});
            // (only where the declarations leave room for it: both edges set, or a transform; a box held by its near edge
            // alone that happens to sit centred, a graphic larger than its frame, stays pinned there)
            const moved = ['translate', 'transform'].some((p) => pos[p] && !/^\s*none\s*$/.test(String(pos[p])));
            // (the far edge as declared: placeFromCss leaves it out where a size of its own over-constrains the box)
            // (a value, not auto or a CSS-wide keyword; the inset shorthand's own right and bottom, as placeFromCss reads it)
            const set = (v) => v != null && !/^\s*(auto|unset|initial|inherit|revert|revert-layer)\s*$/.test(String(v));
            const iv = String(pos.inset || '').trim() ? String(pos.inset).trim().split(/\s+(?![^(]*\))/) : [];
            const shR = iv.length ? iv[iv.length === 1 ? 0 : 1] : null, shB = iv.length ? iv[iv.length < 3 ? 0 : 2] : null;
            const far = { horizontal: set(pos['inset-inline-end']) || set(pos.right) || set(shR), vertical: set(pos['inset-block-end']) || set(pos.bottom) || set(shB) };
            for (const k of ['horizontal', 'vertical']) if (measured[k] === 'center' && place.constraints[k] === 'min' && (moved || far[k] || place.offsets[k === 'horizontal' ? 'x' : 'y'] == null)) place.constraints[k] = 'center';
            // said as the snapshot says it: pinned top left is Figma's default, left out
            if (place.constraints.horizontal === 'min' && place.constraints.vertical === 'min') delete e.constraints; else e.constraints = place.constraints;
            const o = place.offsets, at = { x: insets[e.id].x, y: insets[e.id].y, ...(e.absolute || {}) };
            if (o.end != null) at.end = lengthOf(o.end) ?? insets[e.id].end;
            if (o.bottom != null) at.bottom = lengthOf(o.bottom) ?? insets[e.id].bottom;
            Object.assign(at, centredEdges(at, place.constraints, insets[e.id]));
            if (!unplaced) e.absolute = at;
            // pinned to both edges, its size is theirs; on an axis it is not, its own or what it holds
            for (const [axis, to, i] of [['width', place.constraints.horizontal, 0], ['height', place.constraints.vertical, 1]]) {
              if (to === 'stretch') { delete e[axis]; continue; }
              // (an icon mark is a box the sheet sizes, as in the flow below; an svg draws at its own size)
              if (e.kind === 'graphic' && !mark.has(e.id)) continue;
              const v = String(pos[axis === 'width' ? 'inline-size' : 'block-size'] ?? pos[axis] ?? '').trim();
              // an absolutely placed box with no size of its own shrinks to fit what it holds (css2 §10.3.7), which
              // Figma says as hug where it has auto layout; a percentage of its parent, or no auto layout, is the
              // length it renders at
              // (as text shrinks to fit its words, and a placed component its own main, which sizes it, where the design's
              // part hugs on that axis: else the size it renders at, so one drawn at the wrong size still shows)
              const designHugs = (e.kind === 'instance' || mark.has(e.id)) && figmaContract && [figmaContract.anatomy || {}, ...(figmaContract.variants || []).map((w) => w.add || {})].some((a) => a[e.id] && a[e.id][axis] === 'hug');
              e[axis] = (!v || /^(auto|fit-content|max-content|min-content)$/.test(v)) && (e.layout || e.kind === 'text' || designHugs) ? 'hug' : lengthOf(v) ?? (e.box ? e.box[i] : e[axis]);
              if (designHugs && !e.layout && e.kind !== 'text' && e[axis] === 'hug') A.add('design-hug', `anatomy.${e.id}.${axis}`);
            }
            if (e.kind === 'text') await readCut(e, !(e.id in shown));
            continue;
          }
        }
        // (an icon mark, the empty element to-markup leaves for the icon set's component, is a box the sheet sizes: its
        // fill, hug or length read as any box's; an svg draws at its own size)
        if ((e.kind === 'graphic' && !mark.has(e.id)) || e.absolute) continue;
        const own = {}, up = {};
        // words loose in a box (no element of their own) are its anonymous child: the box is their parent
        const loose = e.kind === 'text' && !(e.id in shown);
        // any other part gone from the page between the walk and now (a node a transition replaced) is not guessed at
        if (!loose && !(e.id in shown)) { if (!unsized.includes(e.id)) { unsized.push(e.id); notes.push(`${e.id}: left the page before its sizes were read (a node the page replaced); its size is not read`); } continue; }
        // a host that draws no box of its own (display: contents, a placed button's custom element around its <button>,
        // code-standard rule 8): its size is the control's, the box in its parent's flow, as to-code writes it there
        const contents = !loose && shown[e.id][0] === 'contents';
        // (turned a quarter: its wrapper is the box its parent lays out, its width the part's own height and its height
        // the part's own width, as to-code writes it)
        const turnedHere = turnedIds.has(e.id);
        const ownSel = turnedHere ? `[data-contract-turn="${e.id}"]` : boxSelector(e.id, contents ? 'contents' : null);
        for (const p of SIZING_CSS) {
          own[p] = loose ? null : await authoredWidth(L.tab, ownSel, p, { raw: true, cache: styles });
          up[p] = await authoredWidth(L.tab, loose ? `[data-contract-id="${e.parent}"]` : `[data-contract-up~="${e.id}"]`, p, { raw: true, cache: styles });
        }
        if (own.display == null && turnedHere) own.display = 'block';
        if (own.display == null && !loose) own.display = contents ? await call(L.tab, (q) => { const n = document.querySelector(q); return n ? getComputedStyle(n).display : null; }, ownSel) : shown[e.id][0];
        if (up.display == null) up.display = loose ? (shown[e.parent] || [])[0] : shown[e.id][1];
        // the second child in the flow, whose start margin says a gap below 0 (rules.mjs: CSS has none)
        const second = e.layout && raw.filter((x) => x.parent === e.id && x.id in shown && x.position !== 'absolute' && !x.absolute).sort((x, y) => x.order - y.order)[1];
        // (on the box in the flow: a placed component's host that draws none hands it to its control, as to-code writes it)
        const nextSel = second && flowSelector(second.id, turnedIds, shown[second.id][0]);
        const next = second ? Object.fromEntries(await Promise.all(['margin-inline-start', 'margin-block-start', 'margin-left', 'margin-top'].map(async (p) => [p, await authoredWidth(L.tab, nextSel, p, { raw: true, cache: styles })]))) : null;
        const lay = e.layout && layoutFromCss(own, next);
        if (lay) {
          Object.assign(e.layout, { direction: lay.direction, align: lay.align, crossAlign: lay.crossAlign }); if (lay.wrap) e.layout.wrap = true;
          // a gap below 0, said as the second child's pull back: its length, or, written as a token, the length it
          // renders at (the token named from the margin below)
          // taken only where it renders below 0: a token's or a calc()'s sign is its value's (a positive nudge is no gap)
          const at = lay.pulled && await call(L.tab, ([sel, col]) => { const n = document.querySelector(sel); return n ? parseFloat(getComputedStyle(n)[col ? 'marginBlockStart' : 'marginInlineStart']) : null; }, [nextSel, lay.direction === 'column']);
          if (lay.pulled && at < 0) {
            e.layout.gap = lengthOf(lay.gap) ?? at;
            pulledBy[e.id] = { from: nextSel, props: ['margin-inline-start', 'margin-block-start', 'margin-left', 'margin-top'] };
          }
        }
        for (const [axis, i] of [['width', 0], ['height', 1]]) {
          const v = sizeFromCss(axis, own, up, { root: e.parent == null }).value;
          if (turnedHere) { const k = axis === 'width' ? 'height' : 'width', j = 1 - i; e[k] = v === 'hug' || v === 'fill' ? v : lengthOf(v) ?? (e.box ? e.box[j] : e[k]); continue; }
          e[axis] = v === 'hug' || v === 'fill' ? v : lengthOf(v) ?? (e.box ? e.box[i] : e[axis]);
          // a root sized by the room it is read in (the room's own width, which from-code set): what it renders at, never
          // the room's number, so a max-width, a margin or a min-width of its own still shows
          if (e.parent == null && room && axis === 'width' && v === `${room}px` && e.box) e.width = e.box[0];
          // a box that hugs but holds no part (a native control's own text, an empty slot): what it hugs is nothing
          // Figma can hold, so the size it renders at is its size (Figma draws an empty box at 100)
          // (a slot holding words is a text that hugs them, not an empty box)
          if (v === 'hug' && ['container', 'slot'].includes(e.kind) && !e.asText && !e.layout && e.box && !raw.some((x) => x.parent === e.id)) e[axis] = e.box[i];
          // the outer box filling the room it is given: that room, a canvas fact, as derive records Figma's root fill
          if (e.parent == null && v === 'fill' && e.box) e.canvas = { ...(e.canvas || {}), [axis]: e.box[i] };
        }
        // (the room is the design's width: a root read at it holds the design's number)
        A.add('design-room', ...roomTaken(e, room));
        // how a text resizes is its sizes, said as Figma says it (rules.mjs)
        if (e.kind === 'text') {
          await readCut(e, loose);
        }
      }
      // values to tokens
      const anatomy = {}, drawn = {}, ring = [];
      let under = null;
      const asRgba = (v) => { const c = parseColour(v); return c ? `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})` : v; };
      // where several tokens hold a value, the one the code wrote it with: the custom properties of the css it came from
      // (`guess` false: only a token the code's own var names, never one found by value: a box 320 wide is no token)
      const tok = async (kind, v, at, css = [], from = null, guess = true) => {
        let r = null;
        // (`from`: the part whose css says it, or the selector of its box where that is not the part's own element)
        const el = from || at.slice(0, at.lastIndexOf('.'));
        // (`background:base`: the colour layer at the bottom of a layered background, the last of its layers, written
        // var() there; `box-shadow:width`, `box-shadow:colour`: that part of the inset stroke a border is drawn with, as written). Only a
        // token one of a property's vars names settles it: a guess by value there (a reset's var that holds another value)
        // leaves the next property to say
        // (a side's token from whichever of its longhands and shorthands wins, physical and logical by the element's
        // direction: external.mjs authoredSideVars, values.mjs sideWinner; the direction asked once per element)
        const dirs = new Map();
        const rtlOf = async (at) => { if (!dirs.has(at)) dirs.set(at, await call(L.tab, ([q]) => { const n = document.querySelector(q); return !!n && getComputedStyle(n).direction === 'rtl'; }, [at])); return dirs.get(at); };
        const varsOf = async (at, p) => (shorthandOf(p) ? authoredSideVars(L.tab, at, p, await rtlOf(at), styles) : authoredVars(L.tab, at, p, styles));
        for (const p of css) { const [prop, part] = p.split(':'), at = el.startsWith('[') ? el : styledAt(el); const rawOf = part === 'base' ? await authoredValue(L.tab, at, prop, styles) : null; const vars = part === 'base' ? (() => { const ls = splitTop(String(rawOf || '')), m = ls.length && /^\s*var\(\s*(--[\w-]+)/.exec(ls[ls.length - 1]); return m ? [m[1]] : []; })() : part ? ((insetStrokeVars(await authoredValue(L.tab, at, prop, styles), { outside: /-out$/.test(part) }) || {})[part.replace(/-out$/, '')] || []) : await varsOf(at, p); if (vars.length) { const got = designTokenFor(kind, v, table, usage, under, judge, offered, vars), col = (table.find((t) => t[0] === got.token) || [])[3] || ''; if (got.token && vars.some((x) => x === cssName(col, got.token) || writtenAs(x, got.token, col))) { r = got; break; } } }
        // (the toolkit's own rendering names every token it draws with, var() for var(): a value it wrote raw is the design's
        // raw value, never a token guessed by value, which a project's compiled code may need)
        // (unless nothing was offered to name a var by: a focus ring's corner, which to-code writes as a calc() of one)
        if (!r && (!guess || (self && css.length))) return ['background', 'text', 'icon', 'stroke'].includes(kind) ? asRgba(v) : v;
        // a bare 0 is no token by value (Spacing/0 and a raw 0 look alike): zeroTokens gives it the design's where it binds one
        if (!r && (kind === 'space' || kind === 'radius') && parseFloat(v) === 0) return 0;
        if (!r) r = designTokenFor(kind, v, table, usage, under, judge, offered);
        if (r.tie) ties.push({ at, token: r.token, tie: r.tie });
        return r.token ?? (['background', 'text', 'icon', 'stroke'].includes(kind) ? asRgba(r.value) : r.value);
      };
      // a fully round corner, a box's or its ring's (`after`: the ring is its ::after): the library's fullest radius
      // (fullestOf) where the code names a radius token there, else null, the caller's raw value or reading. One rule for both.
      const fullRadius = async (id, after = false) => {
        for (const p of ['border-top-left-radius', 'border-radius']) if ((await authoredVars(L.tab, styledAt(id), after ? `${p}::after` : p, styles)).length) return fullest();
        return null;
      };
      for (const e of raw) {
        const { id, under: u, nameBorrowed, ...x } = e;
        if (nameBorrowed) A.add('design-name-inside-placed', `anatomy.${id}.name`);
        under = u;
        // where a governed mapping gives the design's layer, a part the code draws the same way is built as the
        // design builds it: content that is only words where the design draws a text, a round empty box where
        // it draws an ellipse
        // (in the base anatomy, or added at some props: a divider an action bar draws only with two actions)
        const fa = L.governed && figmaContract && figmaContract.anatomy && (figmaContract.anatomy[id] || (figmaContract.variants || []).map((v) => (v.add || {})[id]).find(Boolean));
        if (x.kind === 'slot' && x.asText && fa && fa.kind === 'text') { A.add('design-text-kind', `anatomy.${id}.kind`); x.kind = 'text'; x.color = x.asText.color; x.type = x.asText.type; x.textAlign = x.asText.textAlign; x.autoResize = autoResizeOf(x.width, x.height); }
        delete x.asText;
        // another component's instance at the props its markup shows: each axis of that component's mapping at the value
        // whose args the markup carries (an attribute with that value, or one named for a true flag), else the value
        // that sets nothing; a swap at the icon it draws
        if (x.kind === 'instance' && x.attrs) {
          const axes = L.axesOf ? L.axesOf(x.slug) : null;
          const fc = official.get(x.slug);
          const w = {};
          // the arg's own attribute (size, data-size) first; else a data attribute holding the value (data-hierarchy for
          // variant); a flag by its presence. Never class, style or the walk's own marks
          const has = (k, v) => carries(x.attrs, k, v);
          if (axes) for (const [ax, vals] of Object.entries(axes)) {
            const got = axisValueOf(vals, x.attrs, x.innerDisabled);
            if (got != null) w[ax] = got;
          }
          // a mapping that names whole combinations: the one whose args the markup carries, the most of them, by its name
          const combos = !axes && L.combosOf ? L.combosOf(x.slug) : null;
          if (combos) {
            const fit = Object.entries(combos).filter(([, a]) => a && typeof a === 'object' && !('pseudo' in a) && Object.entries(a.args || a).every(([k, v]) => has(k, v)));
            const best = fit.sort((a, b) => Object.keys(b[1].args || b[1]).length - Object.keys(a[1].args || a[1]).length)[0];
            if (best) for (const part of best[0].split(', ')) { const [ax, v] = part.split('='); if (ax && v) w[ax] = v; }
          }
          if (fc && x.texts) Object.assign(w, wordsOf(fc, x.texts, props));
          Object.assign(w, shownRead(fc, w, x.shown));
          const glyphOf = [];
          // the glyph goes to the swap that drives a layer drawn at these props: a button's Icon (16) or Icon (20), by its
          // size, never both; a prop no drawn layer of which it drives is left its default
          if (fc) for (const [f, g] of glyphSwaps(fc, w, x.glyphs, x.layerGlyphs)) { w[f] = g; glyphOf.push(f); }
          if (Object.keys(w).length) x.with = w;
          // which of them name the glyph it draws: content, which the swap test below sets aside
          if (glyphOf.length) Object.defineProperty(x, 'glyphOf', { value: glyphOf });
        }
        delete x.slug; delete x.attrs; delete x.innerDisabled; delete x.glyphs; delete x.layerGlyphs; delete x.texts; delete x.shown;
        // an instance's own styling is what this component writes on it: a field whose CSS wins from a rule of the placed
        // component's own (its sheet, a theme) is that component's drawing, whatever the design's root says, never an override
        if (x.kind === 'instance') for (const [f, css] of Object.entries(INSTANCE_CSS)) {
          if (x[f] === undefined) continue;
          let mine = false;
          for (const p of css) { const at = await boxOf({ id, kind: x.kind }), sel = await authoredSelector(L.tab, at, p, styles); if (instanceWrites(f, sel, sel && await call(L.tab, writtenByHolder, selectorParts(sel), at, '[data-contract-id="root"]'), sel ? null : await authoredValue(L.tab, at, p, styles))) { mine = true; break; } }
          if (mine && f === 'ownOutline' && ringKnobbed(await authoredValue(L.tab, await boxOf({ id, kind: x.kind }), 'outline', styles))) mine = false;
          if (!mine) delete x[f];
        }
        A.take('design-shape', { anatomy: { [id]: x } }, () => asShape(x, fa, raw.some((r) => r.parent === id), fa && drawnHere()[id]));
        drawn[id] = { background: x.background || x.icon || null, color: x.color || null, under: u, border: x.border ? x.border.color : null, box: x.box, layers: !!x.paint };
        delete x.box;
        if (x.layout) {
          // a 0 padding the code writes is said, as it writes it (paddingSaid)
          if (!x.layout.padding) { const sides = {}; for (const [k, p] of Object.entries(paddingCss(x.rtl))) sides[k] = await authoredValue(L.tab, styledAt(id), p, styles); const said = paddingSaid(x.layout.padding, sides); if (said) x.layout.padding = said; }
          // a gap below 0 was written as the second child's pull back: its token is there
          const pulled = pulledBy[id];
          if ('gap' in x.layout) x.layout.gap = pulled ? await tok('space', x.layout.gap, `${id}.gap`, pulled.props, pulled.from) : await tok('space', x.layout.gap, `${id}.gap`, [x.layout.direction === 'column' ? 'row-gap' : 'column-gap', 'gap']);
          if ('crossGap' in x.layout) x.layout.crossGap = await tok('space', x.layout.crossGap, `${id}.crossGap`, [x.layout.direction === 'column' ? 'column-gap' : 'row-gap', 'gap']);
          if (x.layout.padding) for (const k of Object.keys(x.layout.padding)) x.layout.padding[k] = await tok('space', x.layout.padding[k], `${id}.padding`, [paddingCss(x.rtl)[k]]);
        }
        delete x.rtl;
        // its fills bottom up (rules.mjs fillsFromCss): the colour, then each layer over it, every colour named by its token
        if (x.paint) {
          const { fills, unread: lost } = fillsFromCss(x.background, x.paint.image, { w: x.paint.w, h: x.paint.h }, (c) => !c, { size: x.paint.size, repeat: x.paint.repeat });
          const named = [];
          // (a colour layer over the base, a gradient of one colour, takes a token by value only where a gradient layer
          // names one: written raw, it stays raw)
          // (the shorthand or the longhand; the base is fills' first only where a colour was read under the layers)
          const layers = [];
          for (const prop of ['background', 'background-image']) layers.push(...splitTop(String(await authoredValue(L.tab, styledAt(id), prop, styles) || '')));
          const overNamed = layers.some((l) => /gradient\(/.test(l) && /var\(/.test(l)), base = !!x.background;
          for (const [i, f] of fills.entries()) named.push(typeof f === 'string' && /^IMAGE:/.test(f) ? f : typeof f === 'string' ? await tok('background', f, `${id}.background`, ['background-color', 'background', 'background:base', 'background-image'], null, (i === 0 && base) || overNamed)
            : await (async () => {
              // (a token by value only where the gradient names one: written raw, its stops are raw)
              let named = false; for (const p of ['background-image', 'background']) if (/var\(/.test(String(await authoredValue(L.tab, styledAt(id), p, styles) || ''))) named = true;
              return { ...f, stops: await Promise.all(f.stops.map(async (st) => ({ ...st, color: await tok('background', st.color, `${id}.background`, ['background-image', 'background'], null, named) }))) };
            })());
          // (once, however many renders read it)
          for (const why of lost) if (!notes.includes(`${id}: ${why}`)) notes.push(`${id}: ${why}`);
          // a layer over the colour that is not read: what shows is not the colour alone
          if (lost.length) layered.add(id);
          delete x.paint;
          if (named.length) x.background = named.length === 1 ? named[0] : named;
        } else if (x.background) x.background = await tok('background', x.background, `${id}.background`, ['background-color', 'background']);
        if (x.icon) {
          x.background = await tok('icon', x.icon, `${id}.icon`, ['fill', 'color']); delete x.icon;
          // a glyph whose colour the code sets on it, in any render: else it is the colour around it (asIcon)
          const at = `[data-contract-id="${id}"]`;
          // (a reset that hands it on, svg { fill: currentColor } or color: inherit, or a stroke icon's fill: none, sets none of its own)
          const sets = (v) => v != null && !/^\s*(currentcolor|inherit|unset|initial|revert|none|transparent)\s*$/i.test(v);
          if (sets(await authoredValue(L.tab, at, 'color', styles)) || sets(await authoredValue(L.tab, at, 'fill', styles))) ownIcon.add(id);
        }
        if (x.color) x.color = await tok('text', x.color, `${id}.color`, ['color']);
        // a corner rounder than the element's longest side asks for a full round: the library's fullest radius
        // a size the code wrote as a token (a column span, the screen's width): that token
        for (const [axis, css] of [['width', ['inline-size', 'width']], ['height', ['block-size', 'height']]]) if (typeof x[axis] === 'number') x[axis] = await tok('size', x[axis], `${id}.${axis}`, css, null, false);
        // and a minimum or maximum written as a token (a container's max width, the screen's height)
        for (const [f, css] of [['minWidth', ['min-inline-size', 'min-width']], ['minHeight', ['min-block-size', 'min-height']], ['maxWidth', ['max-inline-size', 'max-width']], ['maxHeight', ['max-block-size', 'max-height']]]) if (typeof x[f] === 'number') { x[f] = await tok('size', x[f], `${id}.${f}`, css, null, false); if (typeof x[f] !== 'string' && viaVar.has(`${id}.${f}`)) delete x[f]; }
        // (a fully round corner is the library's fullest radius token only where the code names a token there: a raw
        // 100px the design draws raw stays its number, never a token found for it)
        if (Array.isArray(x.radius)) {
          // a radius per corner (cornersOf), each corner its own token as to-code writes each (css.mjs), a square one 0
          const CORNER = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'];
          x.radius = await Promise.all(x.radius.map(async (c, i) => (typeof c === 'object' ? (await fullRadius(id)) || c.radius : c === 0 ? 0 : await tok('radius', c, `${id}.radius`, [CORNER[i], 'border-radius']))));
        } else if (x.radius) x.radius = x.full ? (await fullRadius(id)) || x.radius : await tok('radius', x.radius, `${id}.radius`, ['border-top-left-radius', 'border-radius']);
        delete x.full;
        if (x.cornerShape) { const sm = smoothingFromCss(x.cornerShape); if (sm) x.smoothing = sm; delete x.cornerShape; }
        if (x.clipBox) { const d = figmaContract && [figmaContract.anatomy || {}, ...(figmaContract.variants || []).map((v) => v.add || {})].map((a) => a[id]).find(Boolean), p = pathsOfBox(x.clipBox, d && d.kind); if (p) x.paths = p; delete x.clipBox; }
        if (x.mixBlend) { if (x.blend === undefined) x.blend = blendFromCss(x.mixBlend); delete x.mixBlend; }
        if (x.border) {
          const clearRing = x.border.clearRing;
          const raw0 = x.border.width;
          // a width per side where the sides differ: each side's token, 0 where it draws none. The token is the one the code
          // wrote, in a border or in the inset shadow to-code draws a stroke inside the box with (Figma's inside stroke); a
          // side's from whichever of its longhands and border shorthands wins the cascade (sideWinner), never one that lost
          const width = Array.isArray(x.border.width) ? await Promise.all(x.border.width.map((v, i) => (v ? tok('width', v, `${id}.border-width`, [`border-${['top', 'right', 'bottom', 'left'][i]}-width`, ...(x.border.align === 'outside' ? ['box-shadow:width-out'] : ['box-shadow:width'])]) : 0))) : await tok('width', x.border.width, `${id}.border-width`, ['border-top-width', ...(x.border.align === 'outside' ? ['box-shadow:width-out'] : ['box-shadow:width'])]);
          x.border = { color: await tok('stroke', x.border.color, `${id}.border`, ['border-top-color', 'border-color', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left', ...(x.border.align === 'outside' ? ['box-shadow:colour-out'] : ['box-shadow:colour'])]), width, ...(x.border.sides && { sides: x.border.sides }), ...(x.border.align && { align: x.border.align }), ...(x.border.inLayout && { inLayout: true }), ...(x.border.dash && { dash: x.border.dash }) };
          // (a clear side ring is a stroke only where the code names its colour, a Transparent token as to-code writes
          // one; a raw transparent ring is a placeholder a transition starts from, drawing nothing: no border)
          if (clearRing && typeof x.border.color === 'string' && /^(rgba?\(|transparent$)/.test(x.border.color)) delete x.border;
          // a line (a shape no wide or no tall): css.mjs draws its stroke as the one edge it has, the leading one, so that
          // edge is the shape's whole stroke
          // (no wide: 0, or the edge's own width where a border-box reset counts it in)
          const raw = Array.isArray(raw0) ? raw0 : [], thin = (n, i) => n === 0 || (typeof n === 'number' && n === raw[i]);
          const lead = thin(x.width, 3) ? 3 : thin(x.height, 0) ? 0 : -1;
          if (x.kind === 'graphic' && lead >= 0 && Array.isArray(width) && width.every((v, i) => (i === lead) === !!v)) x.border = { color: x.border.color, width: width[lead], ...(x.border.dash && { dash: x.border.dash }) };
        }
        // an outline is the design's focus ring: a stroke-only box stretched past this one by how far the outline's outer
        // edge clears it, its corners this box's own grown by as much, as to-code's ringOf writes it the other way
        // the box's own outline beside a ring of a box of its own, or a dashed one: its own stroke (css.mjs), its alignment
        // where the outline stands, no focus ring
        // (a clear outline at rest is a placeholder, high contrast's, drawing nothing; and a box with a border of its own
        // keeps it: there the outline is no stroke of the design's)
        // (inside a placed component's insides, an outline is that part's own stroke at any state: insidePlaced)
        // (a design that keeps a ring there keeps it a ring: outlineIsOwn)
        { const inPlaced = insidePlaced(raw, id, mark), ringed = keepsRing(L.drawnFrom || figmaContract, id, settings), own = outlineIsOwn(x, focused, inPlaced, ringed);
          // (a ring the design keeps decides it: taken from the design)
          if (own !== outlineIsOwn(x, focused, inPlaced, false)) A.add('design-keeps-ring', `anatomy.${id}.outline`);
          if (own) { x.ownOutline = x.outline; delete x.outline; } }
        if (x.ownOutline) {
          const o = x.ownOutline, align = o.offset <= -o.width + 0.01 ? 'inside' : o.offset < -0.01 ? 'center' : 'outside';
          x.border = { color: await tok('stroke', o.color, `${id}.outline`, ['outline-color', 'outline']), width: await tok('width', o.width, `${id}.outline-width`, ['outline-width', 'outline']), ...(align !== 'inside' && { align }), ...(o.dashed && { dash: 'dashed' }) };
          // (a stroke an outline draws, never an effect style's ring: kept below where the shadow is a style)
          delete x.ownOutline; x.ownStroke = true;
        }
        if (x.outline) {
          const o = x.outline, clear = +(o.offset + o.width).toFixed(2);
          ring.push([id, { kind: 'graphic', shape: 'rectangle', parent: id, position: 'absolute', absolute: { x: -clear, y: -clear, end: -clear, bottom: -clear }, constraints: { horizontal: 'stretch', vertical: 'stretch' },
            // (its tokens where the ring was written: the box's own outline, or its ::after's)
            border: { color: await tok('stroke', o.color, `${id}.outline`, (o.after ? ['outline-color::after', 'outline::after'] : ['outline-color', 'outline'])), width: await tok('width', o.width, `${id}.outline-width`, (o.after ? ['outline-width::after', 'outline::after'] : ['outline-width', 'outline'])) },
            ...(o.radius > 0 && { radius: (o.full ? await fullRadius(id, o.after) : null) ?? await tok('radius', o.radius + clear, `${id}.ring-radius`, []) }) }]);
          delete x.outline;
        }
        // a shadow is the library's effect style that draws it (layers matched by what they draw); none, its css
        // the effect style the code wrote (box-shadow: var(--elevation-raised)), else the one that draws the same layers
        if (x.shadow || x.shadowAll) {
          const at = styledAt(id);
          const said = [...await authoredVars(L.tab, at, 'box-shadow', styles, { leading: true }), ...await layerVars(L.tab, at, 'box-shadow', styles)];
          const effects = L.tokens.effects || [];
          const named = said.length && effects.find((fx) => said.some((v) => writtenAs(v, fx.name)));
          // a style layer's colour in every mode its bound variable takes (the token table's), its own where it binds none
          const shadeOf = (l) => { const b = l.bound && l.bound.color, t = b && table.find((r) => r[0] === b.name && (!b.collection || r[3] == null || r[3] === b.collection)); return t ? [l.color, ...(t[4] || [t[1]])].filter((c) => typeof c === 'string') : [l.color]; };
          const keyOf = (fx) => shadowKey((fx.layers || []).filter((l) => /SHADOW/.test(l.type)).map((l) => ({ inset: l.type === 'INNER_SHADOW', x: l.x, y: l.y, blur: l.blur, spread: l.spread, color: l.color })));
          // a sharp offset layer read as a side's stroke may be the style's own (an inset highlight, a 1px drop): where the
          // whole shadow is a style, or every ring taken is a layer the style the code names draws itself, it is the
          // style's, not a border; a ring the style does not draw (a divider beside an elevation) stays the border
          const theirs = (l) => (named.layers || []).some((nl) => /SHADOW/.test(nl.type) && keyOf({ layers: [nl] }) === shadowKey(cssShadows(l)));
          // (but a shadow that is all strokes, every layer read as a side's, the code naming no style: a border that looks
          // like a style, an inside bottom stroke as Carbon's `Border bottom` draws it, is the border it was written as)
          const strokesOnly = !named && (x.ringsUsed || []).length && x.ringsUsed.length === cssShadows(x.shadowAll || '').length;
          const whole = x.shadowAll && !strokesOnly && wholeShadowStyle(cssShadows(x.shadowAll), named, effects, shadowKey, shadeOf);
          if (whole || (x.shadowAll && named && (x.ringsUsed || []).length && x.ringsUsed.every(theirs))) { x.shadow = (whole || named).name; if (!x.ownStroke) delete x.border; }
          else if (x.shadow) {
            const hit = named || effects.find((fx) => keyOf(fx) === shadowKey(cssShadows(x.shadow)));
            x.shadow = hit ? hit.name : x.shadow;
            // a ring all round inside the effect style the code names (an elevation that draws its own stroke) is the
            // style's, not a border, where the code writes no ring of its own beside it: no inset layer of its own, and no
            // other custom property that could hold one
            const ownRing = () => import('../parity/values.mjs').then(({ splitTop: st }) => authoredValue(L.tab, at, 'box-shadow', styles).then((v) => st(v || '').some((p) => (/\binset\b/.test(p) && !/^\s*var\(/.test(p)) || (/var\(/.test(p) && !writtenAs((/var\(\s*(--[\w-]+)/.exec(p) || [])[1] || '', named.name)))));
            if (named && x.border && !x.ownStroke && !x.border.sides && !x.border.inLayout && (named.layers || []).some((l) => l.type === 'INNER_SHADOW' && !l.x && !l.y && !l.blur && l.spread > 0) && !(await ownRing())) delete x.border;
          }
        }
        delete x.shadowAll; delete x.ringsUsed; delete x.ownStroke;
        // a text style named by the declarations that say it (rules.mjs), else by its values
        const said = x.type && x.kind === 'text' ? styleFromCss(Object.fromEntries(await Promise.all(['font-family', 'font-weight', 'font-size', 'line-height', 'letter-spacing'].map(async (p) => [p, await authoredWidth(L.tab, `[data-contract-id="${id in shown ? id : x.parent}"]`, p, { raw: true, cache: styles })]))), (L.tokens.textStyles || []).map((t) => t.name), (n) => textStyleFields(cssName('', n).slice(2))) : null;
        if (said) { x.typography = said; delete x.type; }
        if (x.type) {
          const sel = `[data-contract-id="${id in shown ? id : x.parent}"]`;
          // (the toolkit's own rendering writes a style's fields var() for var(): a size it wrote raw is the design's own
          // values, never a style that happens to share them, as a raw colour is never a token guessed by value)
          const raw = self && /^\s*-?[\d.]+(px|rem)\s*$/.test(String(await authoredWidth(L.tab, sel, 'font-size', { raw: true, cache: styles }) || ''));
          const { pick, fields } = typedText(x.type, { styles: L.tokens.textStyles || [], usage, raw });
          if (pick.tie) ties.push({ at: `${id}.typography`, token: pick.token, tie: pick.tie });
          Object.assign(x, fields); delete x.type;
        }
        // (two props holding the same words, a value's and a suffix's "Label": the one the design has set this layer first)
        if (x.kind === 'text') { const k = boundText(x.content, id, props, args, figmaContract, joinedProps); if (k && figmaContract && k !== boundText(x.content, id, props, args, null, joinedProps)) A.add('design-bound-text', `anatomy.${id}.content`); if (k) x.content = `{${k}}`; }
        anatomy[id] = x;
      }
      // (as the design's own ring layer where it draws one: ringKeyOf)
      // (the rings and the combination both in the contract the markup was drawn from: drawnFrom is set only on --second,
      // which runs beside a design, from-code exiting without one; code-only reads have neither, and no combination)
      // (the ring as the design keys, names and places it, against what the reading alone would place: taken from the design)
      { const alone = ring.length && (L.drawnFrom || figmaContract) ? placeRings(JSON.parse(JSON.stringify(anatomy)), ring, null, null, settings) : null;
        placeRings(anatomy, ring, L.drawnFrom || figmaContract, figmaContract ? comboOf(asked, L.drawnFrom || figmaContract) : null, settings);
        if (alone) A.add('design-ring-layer', ...changedPaths(alone, JSON.parse(JSON.stringify(anatomy))).map((p) => `anatomy.${p}`)); }
      // a placed component not opened (its insides its own audit's) that draws one graphic, coloured by the colour the
      // code writes on the instance (an svg in currentColor): that colour, said as Figma says it, on the glyph inside,
      // named by the token the code wrote (never one guessed by value), keyed as an instance names it (derive asPlaced);
      // one equal to its component's own is folded below
      // (the key the placed module declares first, the code's own; else the library contract's, taken from the design)
      if (keyInstances(anatomy, keyFromCode, keyOfPlaced, A)) declared.add('placed-key');
      for (const [hid, h] of Object.entries(anatomy)) {
        const hm = h.kind === 'instance' && mainOf(h.component, h.key);
        if (!hm || Object.keys(anatomy).some((k) => k.startsWith(`${hid}/`))) continue;
        const M = atProps(hm, h.with || {}), gs = Object.entries(M).filter(([, g]) => g && g.kind === 'graphic');
        if (gs.length !== 1 || gs[0][1].parent !== 'root' || typeof gs[0][1].background !== 'string' || Object.values(M).filter((g) => g && g.kind !== 'container' && g.kind !== 'graphic').length) continue;
        const q = `[data-contract-id="${hid}"]`, written = await authoredWidth(L.tab, q, 'color', { raw: true, cache: styles });
        if (!written || !/var\(/.test(written)) continue;
        const shown = await call(L.tab, (sel) => { const n = document.querySelector(sel); return n ? getComputedStyle(n).color : null; }, q);
        const t = shown && await tok('icon', shown, `${hid}.color`, ['color'], hid, false);
        if (typeof t === 'string' && !/^rgba?\(/.test(t)) { const { parent: _, ...g } = gs[0][1]; anatomy[`${hid}/${g.name ? camel(g.name) : gs[0][0]}`] = { ...g, parent: hid, background: t }; }
      }
      // each combination in the one spelling, and a placed instance's own styling left to its component, as derive does
      // each of its flats before folding them: so base and variants are cut alike
      // and a layer read inside it that equals its component's there (a contract keeps an override only where it differs)
      // (a zero the code leaves unsaid inside it is its component's own token there, as zeroTokens says it of this one's)
      for (const [hid, h] of Object.entries(anatomy)) {
        const hm = h.kind === 'instance' && mainOf(h.component, h.key);
        if (!hm) continue;
        // (and the instance's own styling against its component's root at its props, a zero there that root's token)
        { const R = atProps(hm, h.with || {}).root; if (R) A.take('placed-main-token', { anatomy: { [hid]: h } }, () => zeroTokens(h, R, L.value, { fill: true })); }
        const inner = Object.fromEntries(Object.keys(anatomy).filter((k) => k.startsWith(`${hid}/`)).map((k) => [k.slice(hid.length + 1), anatomy[k]]));
        if (!Object.keys(inner).length) continue;
        const { M } = placedAs(anatomy, hid, hm, mainOf), match = placedMatch(M, inner);
        for (const [rel, e] of Object.entries(inner)) if (match[rel] && M[match[rel]].kind === e.kind) A.take('placed-main-token', { anatomy: { [`${hid}/${rel}`]: e } }, () => zeroTokens(e, M[match[rel]], L.value, { fill: true }));
      }
      readCleared(anatomy, mainOf, L.value); normalForm(anatomy); colourKept(A, anatomy, mainOf, { partial: true, whole: wholeIn, coloured: colouredOf, reading: true });
      Object.defineProperty(anatomy, 'drawn', { value: drawn });
      return anatomy;
    };

    let base, variants, renders;
    const build = async () => {
    base = await read(defaults); variants = []; renders = [[{}, base]];
    for (const [k, p] of Object.entries(props)) {
      if (p.type === 'swap') continue;
      const others = p.type === 'enum' ? p.values.filter((v) => v !== p.default) : p.type === 'boolean' ? [!p.default] : [];
      // a value that draws what the default draws picks content, not style (an icon by name):
      // two such in a row make the prop a swap, as Figma's instance swap is, and none of the rest is rendered
      const absent = p.type === 'enum' ? others.filter((v) => NONE.test(v)) : [];
      let alike = 0;
      // a change only to the glyph drawn (an icon's asset, or a nested icon's swap; avatar's icon by name) is content
      // too: else every glyph of the set was a value, and avatar's pairs and triples ran to some 30 000 reads
      const glyphOnly = (d, got, from = base) => !d.add && !d.remove && !!d.set && Object.keys(d.set).every((sk) => {
        const at = sk.lastIndexOf('.'), id = sk.slice(0, at);
        if (sk.slice(at + 1) === 'asset') return true;
        if (sk.slice(at + 1) !== 'with') return false;
        const a = from[id].with || {}, b = got[id].with || {}, g = got[id].glyphOf || [];
        return [...new Set([...Object.keys(a), ...Object.keys(b)])].every((q) => a[q] === b[q] || g.includes(q));
      });
      // where the default shows nothing (button's icon, unset), each glyph adds the icon: one is alike to the glyph
      // before it, and the first says what the prop shows
      let prev = null, shownBy = null;
      for (const v of [...absent, ...others.filter((x) => !absent.includes(x))]) {
        const got = await read({ ...defaults, [p.code]: v });
        const d = delta(base, got);
        if (p.type === 'enum' && NONE.test(String(p.default)) && !absent.includes(v) && !shownBy && d.add && !d.remove) { shownBy = String(v); props[k].shows = Object.keys(d.add); }
        const dp = prev && delta(prev, got, base);
        // a pointer state that changes nothing here (a checked switch's hover) is still a state, never a swap
        const same = !absent.includes(v) && p.type === 'enum' && p.role !== 'interaction' && (!Object.keys(d).length || glyphOnly(d, got) || (NONE.test(String(p.default)) && !!dp && (!Object.keys(dp).length || glyphOnly(dp, got, prev))));
        if (!absent.includes(v)) prev = got;
        // two in a row, as said: a value between them that draws more (a password field's reveal) keeps it an enum
        alike = same ? alike + 1 : 0;
        if (same && alike === 2) { props[k] = { type: 'swap', default: p.default, code: p.code, ...(p.required && { required: true }), ...(props[k].shows && { shows: props[k].shows }), ...(shownBy && { glyph: shownBy }) }; break; }
        renders.push([{ [k]: p.type === 'boolean' ? v : String(v) }, got]);
        if (absent.includes(v) && d.remove && !d.add) props[k].shows = d.remove;
        if (Object.keys(d).length) variants.push({ when: { [k]: p.type === 'boolean' ? v : String(v) }, ...d });
      }
      // what the first glyph showed is a swap's; a prop that stays an enum (badge's none, dot, count) keeps none of it
      if (shownBy && props[k].type !== 'swap') delete props[k].shows;
      // a swap's renders are the default's: nothing to rebuild beyond it
      if (props[k].type === 'swap') {
        // (but the one that shows it, where the default shows nothing: it is the boolean's true)
        for (let i = renders.length - 1; i > 0; i--) if (k in renders[i][0] && !NONE.test(renders[i][0][k]) && renders[i][0][k] !== shownBy) renders.splice(i, 1);
        // and its layers: a glyph value read before the second showed it a swap (avatar's arrow-down-narrow-wide)
        variants = variants.filter((x) => !(k in x.when && !NONE.test(x.when[k]) && x.when[k] !== shownBy));
      }
    }
    };
    await build();
    // an enum the component declares no default for starts where it draws with the prop unset,
    // not where the story starts it; one at a time, each against renders made with the defaults so far
    for (const [k, p] of Object.entries(props)) {
      if (p.type !== 'enum' || !p.undeclared) continue;
      // a prop the component needs (sidebar menu item's icon) does not draw unset: the story's start stays the default
      const unset = await read({ ...defaults, [p.code]: undefined }).catch((e) => { if (!/sb-show-errordisplay/.test(e.message)) throw e; return null; });
      if (!unset) { notes.push(`${k}: unset, the story does not draw; the default is the story's, ${p.default}`); continue; }
      const hit = renders.find(([w, got]) => (k in w || !Object.keys(w).length) && !Object.keys(delta(unset, got)).length);
      const v = hit && (k in hit[0] ? hit[0][k] : p.default);
      if (!hit) notes.push(`${k}: unset, the component draws none of its values; the default is the story's, ${p.default}`);
      else if (v !== p.default) { p.default = v; defaults = { ...defaults, [p.code]: v }; await build(); }
    }
    for (const p of Object.values(props)) delete p.undeclared;

    // what two props do together that each alone does not explain: read every pair of
    // non-default values, and where expand() mispredicts it, a pair layer (as derive.cjs has)
    const codeNamed = codeName(name, L.figmaOf); if (codeNamed.declared) declared.add('component-name');
    const fromCode = { contract: 1, component: codeNamed.component, code: { story: m.story, from: 'code' }, props: Object.fromEntries(Object.entries(props).map(([k, p]) => { const { sample, emptied, ...rest } = p; return [k, rest]; })), anatomy: base, variants };
    const valuesOf = (p) => (p.type === 'enum' ? p.values.filter((v) => v !== p.default) : p.type === 'boolean' ? [!p.default] : p.type === 'swap' && p.shows ? [p.glyph || 'none'] : []);
    const argOf = (p, v) => (p.type === 'boolean' ? v : String(v));
    const keys = Object.keys(props);
    const combos = (n) => { const out = []; const go = (i, acc) => { if (acc.length === n) { out.push(acc); return; } for (let j = i; j < keys.length; j++) for (const v of valuesOf(props[keys[j]])) go(j + 1, [...acc, [keys[j], v]]); }; go(0, []); return out; };
    for (const pair of combos(2)) {
      const when = Object.fromEntries(pair.map(([k, v]) => [k, argOf(props[k], v)]));
      const got = await read({ ...defaults, ...Object.fromEntries(pair.map(([k, v]) => [props[k].code, v])) });
      const d = delta(expand(fromCode, when), got, base);
      if (Object.keys(d).length) variants.push({ when, ...d });
      renders.push([when, got]);
    }
    // the self-check reads what built nothing: every three-prop combination, which the layers must predict
    const unread = [];
    for (const three of combos(3)) {
      const when = Object.fromEntries(three.map(([k, v]) => [k, argOf(props[k], v)]));
      const got = await read({ ...defaults, ...Object.fromEntries(three.map(([k, v]) => [props[k].code, v])) });
      if (Object.keys(delta(expand(fromCode, when), got, base)).length) unread.push([when, got]);
    }
    // what three props together do beyond their pairs is a layer of its own, read the way a grid is read:
    // it applies wherever those three hold, whatever the rest (a combination layer naming every prop applied
    // at the default of the others alone, and the four-prop check below found it wrong in every feedback)
    const allDefaults = Object.fromEntries(Object.entries(fromCode.props).filter(([, p]) => 'default' in p).map(([k, p]) => [k, p.default]));
    for (const [when, got] of unread) {
      const d = delta(expand(fromCode, when), got, base);
      if (Object.keys(d).length) variants.push({ when, ...d });
    }
    // read once more after: a combination still not rebuilt is a defect of the contract, reported
    const stillUnread = unread.filter(([when, got]) => Object.keys(delta(expand(fromCode, { ...allDefaults, ...when }), got, base)).length).map(([w]) => JSON.stringify(w));
    // and every four-prop combination, which the layers, pairs and three-prop combinations must predict: what four
    // do beyond them is a layer of its own, as three's is (a loading button's icon colour at a size, a hierarchy and
    // a feedback), so the reading rebuilds it; and so every combination of more the design draws (combinationsToRead)
    // (counted and said with the self-check: layers kept from one read each, not a check passed)
    // (a prop the design has no counterpart for is never varied by the comparison, which draws its default alone: a
    // combination that moves one is not compared, and not read)
    const drawsIt = figmaContract && ((list) => {
      const moved = comboOf(Object.fromEntries(list.map(([k, v]) => [props[k].code, v])));
      if (Object.keys(moved).length < list.length || list.some(([k, v]) => !Object.keys(comboOf({ [props[k].code]: v })).length)) return false;
      const c = { ...variantDefaults(figmaContract), ...comboOf(defaults), ...moved };
      return !(figmaContract.invalid || []).some((w) => Object.entries(w).every(([k, v]) => String(c[k]) === String(v)));
    });
    const beyond = combinationsToRead(keys, (k) => valuesOf(props[k]), drawsIt);
    let fourLayers = 0;
    const { read: readBeyond } = await readCombinations(beyond, async (four) => {
      const when = Object.fromEntries(four.map(([k, v]) => [k, argOf(props[k], v)]));
      const got = await read({ ...defaults, ...Object.fromEntries(four.map(([k, v]) => [props[k].code, v])) });
      const d = delta(expand(fromCode, { ...allDefaults, ...when }), got, base);
      // (held only where it was read, every other prop at its default, as derive pins what is left over: an open four-prop
      // layer reached combinations no read saw, a Carbon tag's close button Cyan where its icon draws it Blue)
      if (!Object.keys(d).length) return false;
      variants.push({ when: { ...allDefaults, ...when }, combination: true, ...d }); fourLayers++;
      return true;
    });

    // self-check, as derive.cjs's: every render rebuilt by expand(), and every unread one predicted
    // (by delta, so a corner a focus ring takes off its box counts as rebuilt)
    const bad = [...renders.filter(([when, got]) => Object.keys(delta(expand(fromCode, when), got, base)).length).map(([w]) => JSON.stringify(w)), ...stillUnread];

    // compared with Figma's, element by element where the map pairs them, at each
    // combination Figma's grid reads as a layer (the default, then one prop at a time),
    // the code rendered at the same combination through the map's args; a component only in code, with nothing
    const compare = [], structure = [], whens = [{}];
    let side = { map: {}, code: story.argTypes };
    if (figmaContract) {
      const figma = figmaContract;
      // the map as the code audit uses it: its props joined by rule where a person joined none
      side = L.joins(figma, story.argTypes);
      for (const [k, args] of Object.entries(side.twice || {})) notes.push(`${k}: its variants move ${args.join(' and ')}; joined to ${args[0]}, the first, and the rest are not compared`);
      m = { ...side.map, elements: m.elements };
      // a governed mapping's elements already carry Figma's ids in the walk; a compared library's are found where its selectors land
      const pairs = L.governed ? Object.fromEntries(Object.keys(m.elements).map((k) => [k, k])) : await pairUp(L, m, read, call, defaults);
      // a slot is joined where it is filled: the code's slot that fills the element Figma's slot fills
      for (const [k, p] of Object.entries(figma.props)) {
        const had = (side.map.props || {})[k];
        if (p.type !== 'slot' || typeof had === 'string' || (had && (had.arg || had.code))) continue;
        const fid = Object.keys(figma.anatomy).find((id) => figma.anatomy[id].content === `{${k}}`);
        const filled = fid && pairs[fid] && fromCode.anatomy[pairs[fid]] && String(fromCode.anatomy[pairs[fid]].content || '').match(/^\{(.+)\}$/);
        if (filled && props[filled[1]] && props[filled[1]].type === 'slot') side.map = { ...side.map, props: { ...(side.map.props || {}), [k]: { arg: props[filled[1]].code } } };
      }
      const fDefaults = variantDefaults(figma);
      for (const [k, p] of Object.entries(figma.props)) {
        if (p.role === 'interaction' || !(k in (m.props || {}))) continue;
        for (const v of p.type === 'enum' ? p.values : p.type === 'boolean' ? [true, false] : []) if (v !== p.default) whens.push({ [k]: v });
      }
      const value = (t) => (typeof t === 'string' ? L.value(t) : t);
      for (const when of whens) {
        // a text prop's default is the design's sample copy: the map's fixed sample stands in, as in the code audit
        const all = { ...fDefaults, ...Object.fromEntries(Object.entries(m.props || {}).filter(([, x]) => x && typeof x === 'object' && x.fixed != null).map(([k, x]) => [k, x.fixed])), ...when };
        const f = expand(figma, all);
        // the code's own starting values give way to every prop the map drives, under whichever name it
        // drives it (a switch's `checked` set through `defaultChecked`)
        const driven = new Set(Object.values(m.props || {}).flatMap((x) => (typeof x === 'string' ? [x] : x ? [x.arg, x.code].filter(Boolean) : [])));
        // unset first, so the story's own starting value (checked: true) gives way too
        const sent = { ...Object.fromEntries(Object.entries(defaults).filter(([k]) => !driven.has(k))), ...Object.fromEntries([...driven].map((k) => [k, undefined])), ...L.argsOf(all, m) };
        // except a prop the component requires that the map names no value for: it keeps the story's own (the icon
        // sidebar menu item and context menu item action require; unset, they do not draw)
        for (const p of Object.values(props)) if (p.required && sent[p.code] === undefined && (p.type === 'swap' ? defaults[p.code] : p.type === 'string' ? p.sample : undefined) !== undefined) sent[p.code] = p.type === 'swap' ? defaults[p.code] : p.sample;
        const c = await read(sent);
        for (const [mapped, cid] of Object.entries(pairs).filter(([k]) => !k.includes('@'))) {
          const fid = elementIn(f, mapped) || mapped;
          if (!f[fid] && !c[cid]) continue;
          // (a layer inside a placed instance the design leaves unsaid at these props is its component's own, drawn there)
          if (!f[fid] && c[cid] && placedOver(f, fid)) continue;
          if (!f[fid] || !c[cid]) { compare.push({ when, figma: fid, code: cid, verdict: f[fid] ? 'code draws none' : 'figma draws none' }); continue; }
          for (const k of ['background', 'color', 'typography', 'radius', 'border']) {
            // a shape Figma draws as an ellipse is a fully round box in code: its roundness is the shape's
            if (k === 'radius' && f[fid].kind === 'graphic' && c[cid].radius === fullest()) continue;
            if (!(k in f[fid]) && !(k in c[cid])) continue;
            const fv = k === 'border' && f[fid].border ? { color: f[fid].border.color, width: [].concat(f[fid].border.width)[0] } : f[fid][k] ?? null;
            // a border is compared by its colour and width, as Figma's is read: where it sits (inLayout) is drawing, not paint
            const cv = k === 'border' && c[cid].border ? { color: c[cid].border.color, width: c[cid].border.width } : c[cid][k] ?? null;
            let verdict = JSON.stringify(fv) === JSON.stringify(cv) ? 'same token' : 'differs';
            // (a fill or ring Figma says cleared, `none`, and code draws none of: both draw nothing)
            if (verdict === 'differs' && f[fid][k] === CLEARED && cv == null && (k === 'background' || k === 'border')) verdict = 'same token';
            // another token, or none, that draws the same colour
            // (only a fill read whole: a layer laid over the colour changes what shows, which the colour alone does not say)
            if (verdict === 'differs' && (k === 'background' || k === 'color') && fv && typeof cv === 'string' && !(k === 'background' && layered.has(cid))) {
              // (a part the reading adds that the walk never drew, a focus ring it builds from an outline, has no colour on screen)
              const d = (c.drawn || {})[cid], got = d && (k === 'color' ? d.color : d.background);
              if (got && judge({ color: value(fv) }, got, d.under) !== 'differs') verdict = 'same on screen';
            }
            // a border the design does not draw that code draws in a colour its own fill hides, as the audit judges it
            if (verdict === 'differs' && k === 'border' && !fv && c.drawn[cid].border && !c.drawn[cid].layers && invisibleBorder({ 'border-color': c.drawn[cid].border, background: c.drawn[cid].background, under: c.drawn[cid].under })) verdict = 'same on screen';
            compare.push({ when, figma: fid, code: cid, field: k, figmaValue: fv, codeValue: cv, verdict });
          }
        }
      }
      // built differently: where a paired element is another kind of thing, or sits at another depth,
      // or a size comes from padding on one side and a set size on the other — the visual audit judges
      // whether they come out the same, this says how they are made
      const fBase = expand(figma, { ...fDefaults, ...Object.fromEntries(Object.entries(m.props || {}).filter(([, x]) => x && typeof x === 'object' && x.fixed != null).map(([k, x]) => [k, x.fixed])) });
      for (const [mapped, cid] of Object.entries(pairs).filter(([k]) => !k.includes('@'))) {
        const fid = elementIn(fBase, mapped), f = fid && fBase[fid], c = base[cid];
        if (!f || !c) continue;
        const fDepth = fid.split('/').length, cDepth = cid.split('/').length;
        const wraps = fid.split('/').slice(0, -1).filter((seg, i, a) => fBase[a.slice(0, i + 1).join('/')]?.kind === 'instance');
        if (f.kind !== c.kind || fDepth !== cDepth) structure.push(`${fid}: a ${f.kind} ${fDepth > cDepth ? `inside ${wraps.length ? `the ${wraps.map((w) => fBase[fid.split('/').slice(0, fid.split('/').indexOf(w) + 1).join('/')]?.component || w).join(' and ')} instance` : `${fDepth - cDepth} more layer(s)`}` : ''} in Figma; a ${c.kind} (${cid}) in code`);
        const pad = (e) => e.layout && e.layout.padding ? ['top', 'bottom'].map((k) => value(e.layout.padding[k]) || 0) : [0, 0];
        const [fp, cp] = [pad(f), pad(c)];
        if ((fp[0] !== cp[0] || fp[1] !== cp[1]) && (f.minHeight != null || c.minHeight != null)) structure.push(`${fid}: its height from ${f.minHeight != null ? `a set height of ${value(f.minHeight)}` : `padding (${fp[0]} top, ${fp[1]} bottom)`} in Figma, from ${c.minHeight != null ? `a set height of ${c.minHeight}` : `padding (${cp[0]} top, ${cp[1]} bottom)`} in code`);
      }

    }

    // a part that is another library component is that component's to compare, in its own audit: said
    const nested = Object.assign({}, base, ...variants.map((v) => v.add || {}));
    for (const [id, e] of Object.entries(nested)) if (e.kind === 'instance' && e.component) structure.push(`${id}: the ${e.component} component, drawn as its instance; its own values are compared in ${e.component}'s audit, not here`);

    // where a governed mapping gives the design's layers: a slot the code fills with words where the design draws
    // a text is the design's text prop, under its name and with its sample (a slot has no default of its own);
    // an enum with the design's values lists them in the design's order, its own default kept
    if (L.governed && figmaContract) {
      // the boxes each layer was drawn at, under the ids the layers end with
      let boxesBy = (base && base.drawn) || {};
      // ids the code's markup named, renamed to the design's (a layer and everything under it), wherever an id is said
      const renameIds = (map) => {
        const to = (id) => { if (typeof id !== 'string') return id; for (const [a, b] of Object.entries(map)) if (id === a || id.startsWith(`${a}/`)) return b + id.slice(a.length); return id; };
        const field = (k) => { const i = k.indexOf('.'); return i < 0 ? to(k) : to(k.slice(0, i)) + k.slice(i); };
        const els = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, e]) => [to(k), e && e.parent ? { ...e, parent: to(e.parent) } : e]));
        fromCode.anatomy = els(fromCode.anatomy);
        for (const v of fromCode.variants) {
          if (v.set) v.set = Object.fromEntries(Object.entries(v.set).map(([k, x]) => [field(k), /\.parent$/.test(k) ? to(x) : x]));
          if (v.add) v.add = els(v.add);
          if (v.remove) v.remove = v.remove.map(to);
        }
        for (const p of Object.values(fromCode.props)) for (const l of ['shows', 'sets', 'swaps']) if (Array.isArray(p[l])) p[l] = p[l].map(to);
        boxesBy = els(boxesBy);
      };
      const kids = (o, id) => Object.entries(o).filter(([, e]) => e.parent === id);
      // a code prop the mapping joins to a design prop of another name (checked to Selected, chevron to Show chevron)
      // takes the design's key and name, and its values the design's: the join is the person's, not a guess
      {
      for (const [fk, fp] of Object.entries(figmaContract.props)) {
        const j = ((side.map || {}).props || {})[fk];
        if (fp.role === 'interaction' || !j || typeof j !== 'object' || !j.arg || fromCode.props[fk]) continue;
        const ck = Object.keys(fromCode.props).filter((k) => fromCode.props[k].code === j.arg && !(k in figmaContract.props));
        if (ck.length !== 1) continue;
        const [k] = ck, cp = fromCode.props[k];
        if (cp.type !== fp.type || (fp.type !== 'boolean' && fp.type !== 'enum')) continue;
        // the code's value each design value draws, turned round: a code value two design values share is no join
        const back = {};
        // the design's default the join leaves unsaid draws at the code's own default (an avatar's Icon, graphic unset)
        const named = Object.values(j.values || {}).map((x) => String(x === undefined ? cp.default : x));
        const pairs = { ...(fp.default != null && !(String(fp.default) in (j.values || {})) && !named.includes(String(cp.default)) ? { [String(fp.default)]: undefined } : {}), ...(j.values || {}) };
        for (const [dv, cv] of Object.entries(pairs)) { const key = String(cv === undefined ? cp.default : cv); if (key in back) { back[key] = null; } else back[key] = fp.type === 'boolean' ? dv === 'true' : dv; }
        // a boolean's other value is the other one: a join naming one side names both
        if (fp.type === 'boolean') for (const [cv, dv] of Object.entries({ ...back })) if (typeof dv === 'boolean' && !(String(cv !== 'true') in back)) back[String(cv !== 'true')] = !dv;
        const to = (v) => (String(v) in back && back[String(v)] !== null ? back[String(v)] : undefined);
        if (fp.type === 'boolean' && (to(true) === undefined || to(false) === undefined)) continue;
        // an enum's code values the join names no design value for (an avatar's eight graphics, where the design draws
        // its gold cup) are the code's alone: Figma has no option for them, so they and their variants are not drawn
        if (fp.type === 'enum' && (to(cp.default) === undefined || !cp.values.some((v) => to(v) !== undefined && v !== cp.default))) continue;
        const np = { ...cp, figma: fp.figma };
        const lost = fp.type === 'enum' ? cp.values.filter((v) => to(v) === undefined) : [];
        if (lost.length) { notes.push(`${k}: ${lost.join(', ')} ${lost.length > 1 ? 'are' : 'is'} the code's alone (the design's ${fp.figma} has no one option of its own for ${lost.length > 1 ? 'them' : 'it'}); not drawn`); fromCode.variants = fromCode.variants.filter((v) => !(k in v.when) || to(v.when[k]) !== undefined); }
        if (fp.type === 'enum') { np.values = fp.values.filter((v) => cp.values.some((w) => to(w) === v)); np.default = to(cp.default); }
        else if (to(cp.default) !== undefined) np.default = to(cp.default);
        fromCode.props = Object.fromEntries(Object.entries(fromCode.props).map(([x, q]) => (x === k ? [fk, np] : [x, q])));
        // (a borrowing once per prop joined, however many variants its rename moves)
        A.add('joined-prop', `props.${fk}`);
        for (const v of fromCode.variants) if (k in v.when) { const w = to(v.when[k]); v.when = Object.fromEntries(Object.entries(v.when).map(([x, y]) => (x === k ? [fk, w === undefined ? y : w] : [x, y]))); }
      }
      }
      // a code boolean that is a value of one of the design's enums (a button's Loading, which the design draws as
      // State=Loading): the enum takes the value, and the boolean goes; a combination the design cannot draw (loading
      // while hovered) goes with it. Matched by name, where the code's enum lacks the value and nothing else is named so
      const squash = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, '');
      {
      for (const [bk, bp] of Object.entries(fromCode.props)) {
        if (bp.type !== 'boolean' || figmaContract.props[bk]) continue;
        const hits = Object.entries(figmaContract.props).filter(([, fp]) => fp.type === 'enum' && fp.values.some((v) => squash(v) === squash(bp.figma || bk)));
        if (hits.length !== 1) continue;
        const [dk, dp] = hits[0];
        const value = dp.values.find((v) => squash(v) === squash(bp.figma || bk));
        const ck = Object.keys(fromCode.props).find((k) => fromCode.props[k].type === 'enum' && (k === dk || squash(fromCode.props[k].figma || k) === squash(dp.figma || dk)));
        if (!ck || fromCode.props[ck].values.includes(value) || (bp.shows || []).length) continue;
        const cp = fromCode.props[ck];
        cp.values = dp.values.filter((v) => cp.values.includes(v) || v === value).concat(cp.values.filter((v) => !dp.values.includes(v) && v !== value));
        delete fromCode.props[bk];
        A.add('boolean-as-enum-value', `props.${ck}.values`);
        fromCode.variants = fromCode.variants.flatMap((v) => {
          if (!(bk in v.when)) return [v];
          const { [bk]: on, ...rest } = v.when;
          if (on !== true && on !== 'true') return Object.keys(rest).length ? [{ ...v, when: rest }] : [];
          if (ck in rest && String(rest[ck]) !== String(cp.default)) return [];
          return [{ ...v, when: { ...rest, [ck]: value } }];
        });
      }
      }
      const said = (id) => fromCode.variants.some((v) => Object.keys(v.set || {}).some((k) => k.split('.')[0] === id) || Object.values(v.set || {}).includes(id) || (v.add || {})[id] || Object.values(v.add || {}).some((c) => c && c.parent === id) || (v.remove || []).includes(id));
      // a wrapper the markup needs (a list's li) that the design does not draw, holding one layer at that layer's
      // size and styling nothing: drawn the same without it, so its layer sits where it sits
      {
      for (const [id, e] of Object.entries(fromCode.anatomy)) {
        if (e.kind !== 'container' || figmaContract.anatomy[id] || !e.parent || !figmaContract.anatomy[e.parent] || said(id)) continue;
        if (Object.keys(e).some((k) => !['kind', 'parent', 'order', 'width', 'height', 'name'].includes(k))) continue;
        const c = kids(fromCode.anatomy, id);
        if (c.length !== 1 || ['width', 'height'].some((d) => typeof e[d] === 'number' && e[d] !== c[0][1][d])) continue;
        const [cid, ce] = c[0];
        delete fromCode.anatomy[id];
        fromCode.anatomy[cid] = { ...ce, parent: e.parent, order: e.order };
        A.add('dropped-wrapper', `anatomy.${id}`);
      }
      }
      // another component's instance the markup named by its component (sidebarMenuItem), where the design holds the
      // same number of that component's instances under the same parent: each takes the design's id, in order
      {
      const groups = {};
      // (one already under a design id counts too: button and button2 against the design's button and button_2)
      for (const [id, e] of Object.entries(fromCode.anatomy)) if (e.kind === 'instance' && e.component && e.parent) (groups[`${e.parent}\u0000${e.component}`] = groups[`${e.parent}\u0000${e.component}`] || []).push(id);
      const map = {};
      for (const [g, ids] of Object.entries(groups)) {
        const [parent, component] = g.split('\u0000');
        const theirs = kids(figmaContract.anatomy, parent).filter(([, e]) => e.kind === 'instance' && e.component === component).sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0)).map(([k]) => k);
        const ours = ids.sort((a, b) => (fromCode.anatomy[a].order ?? 0) - (fromCode.anatomy[b].order ?? 0));
        const taken = (k) => fromCode.anatomy[k] || fromCode.variants.some((v) => (v.add || {})[k]);
        if (ours.every((k) => figmaContract.anatomy[k]) || theirs.length !== ours.length || !theirs.every((k) => !taken(k) || ours.includes(k))) continue;
        ours.forEach((k, i) => { if (k !== theirs[i]) map[k] = theirs[i]; });
      }
      if (Object.keys(map).length) renameIds(map);
      // (once per instance renamed, not per field its subtree moves)
      for (const b of Object.values(map)) A.add('instance-ids-in-order', `anatomy.${b}`);
      }
      {
      for (const [k, p] of Object.entries({ ...fromCode.props })) {
        // a slot of words, or a word prop under the code's name (button's children, the design's Label)
        if (p.type !== 'slot' && p.type !== 'string') continue;
        const el = Object.entries(fromCode.anatomy).find(([, e]) => e.content === `{${k}}` && e.kind === 'text');
        const fa = el && figmaContract.anatomy[el[0]];
        const fk = fa && fa.kind === 'text' && (/^\{(.+)\}$/.exec(fa.content || '') || [])[1];
        const fp = fk && figmaContract.props[fk];
        if (!fp || fp.type !== 'string' || (fk === k ? p.type === 'string' : fromCode.props[fk])) {
          // a slot the design draws as a slot of its own name (children, the design's Options slot): that slot, with
          // the design's settings and preferred instances, as a slot's are the design's to state
          const sl = p.type === 'slot' && Object.entries(fromCode.anatomy).find(([, e]) => e.content === `{${k}}` && e.kind === 'slot');
          const sa = sl && figmaContract.anatomy[sl[0]];
          const sk = sa && sa.kind === 'slot' && (/^\{(.+)\}$/.exec(sa.content || '') || [])[1];
          const sp = sk && figmaContract.props[sk];
          if (!sp || sp.type !== 'slot' || (sk !== k && fromCode.props[sk])) continue;
          // (once per prop, not per field its rename moves)
          A.add('design-prop-for-words', `props.${sk}`);
          if (sk === k) { fromCode.props[k] = { ...sp, code: p.code, ...(p.required && { required: true }) }; continue; }
          delete fromCode.props[k];
          fromCode.props[sk] = { ...sp, code: p.code, ...(p.required && { required: true }) };
          const swap = (x) => JSON.parse(JSON.stringify(x).split(`"{${k}}"`).join(`"{${sk}}"`));
          fromCode.anatomy = swap(fromCode.anatomy); fromCode.variants = swap(fromCode.variants);
          continue;
        }
        delete fromCode.props[k];
        fromCode.props[fk] = { type: 'string', code: p.code, default: fp.default };
        A.add('design-prop-for-words', `props.${fk}`);
        const swap = (x) => JSON.parse(JSON.stringify(x).split(`"{${k}}"`).join(`"{${fk}}"`));
        fromCode.anatomy = swap(fromCode.anatomy); fromCode.variants = swap(fromCode.variants);
      }
      }
      // a slot holds the design's sample (its Context menu items), as a text prop holds the design's sample words: the
      // code's slot holds whatever its caller passes, so a reading has nothing of its own to put there
      const under = (o, top) => Object.keys(o).filter((id) => { let x = o[id] && o[id].parent, n = 0; while (x && x !== top && n++ < 50) x = o[x] && o[x].parent; return x === top; });
      A.take('slot-sample', fromCode, () => {
      for (const [id, e] of Object.entries(fromCode.anatomy)) {
        const fe = figmaContract.anatomy[id];
        const sample = fe && under(figmaContract.anatomy, id);
        // all of it or none: an id the code already uses elsewhere would take the sample's children
        if (e.kind !== 'slot' || !fe || fe.kind !== 'slot' || under(fromCode.anatomy, id).length || sample.some((k) => fromCode.anatomy[k])) continue;
        for (const k of sample) {
          const c = JSON.parse(JSON.stringify(figmaContract.anatomy[k]));
          // the sample's words, not a binding to a prop of the design's this component does not have
          const ref = typeof c.content === 'string' && /^\{(.+)\}$/.exec(c.content);
          if (ref && !fromCode.props[ref[1]]) c.content = (figmaContract.props[ref[1]] || {}).default ?? '';
          delete c.shownBy; delete c.text;
          fromCode.anatomy[k] = c;
        }
      }
      });
      // a glyph the code draws where the design draws an icon component's instance (Icon/house): that component at the
      // code's glyph, sized as the code sizes it, so the drawing places the library's icon, not a frame
      const figmaEl = (id) => figmaContract.anatomy[id] || (figmaContract.variants || []).map((v) => (v.add || {})[id]).find(Boolean);
      const mainsOfAll = req('./derive.cjs').byComponentName(contracts);
      const asIcon = (id, e) => {
        const fe = figmaEl(id);
        // (an icon in a folder, Icon/house, or one named bare, as a library that keeps its icons unfoldered names them: Add)
        if (!e || e.kind !== 'graphic' || !e.asset || !fe || fe.kind !== 'instance' || !fe.component) return;
        // a layer a swap shows draws the design's own glyph there (button's house), as the swap's content is a choice
        const swapped = Object.values(fromCode.props).some((p) => p.type === 'swap' && (p.shows || []).includes(id));
        // else only where the design's component is that glyph, or its set holds it elsewhere in the design: an
        // instance of another kind (Avatar/Small) or a glyph outside the set (a logo) stays the code's graphic
        // a glyph named whole (to-markup's mark says Icon/house) is that name; one named alone (house) is in the design's set
        const set = fe.component.split('/').slice(0, -1).join('/'), whole = (g) => (!set || g.startsWith(`${set}/`) ? g : `${set}/${g}`), named = whole(e.asset);
        // (with no folder to scope it, only a component the design places, never any word of it: a layer named Close)
        const placed = () => [figmaContract.anatomy, ...(figmaContract.variants || []).map((v) => v.add || {})].flatMap((a) => Object.values(a).map((x) => x.component))
          .concat((figmaContract.variants || []).flatMap((v) => Object.entries(v.set || {}).filter(([k]) => k.endsWith('.component')).map(([, x]) => x)));
        const held = (n) => fe.component === n || (set ? JSON.stringify(figmaContract).includes(JSON.stringify(n)) : placed().includes(n));
        // and every glyph a variant changes it to, held the same way, or the whole layer stays the code's graphic
        const glyphs = fromCode.variants.map((v) => (v.set || {})[`${id}.asset`]).filter((g) => typeof g === 'string');
        if (!swapped && (!held(named) || !glyphs.every((g) => held(whole(g))))) return;
        e.kind = 'instance'; e.component = swapped ? fe.component : named; delete e.asset;
        // (with the design's key, so it stays that icon and is never a same-named component of the library: designKeyOf)
        { const k = designKeyOf(figmaContract, fe, e.component); if (k) e.key = k; else delete e.key; }
        // the glyph's own size the mark says (to-markup's data-icon-size): its set's variant, as Figma's Size
        if (e.iconSize) { e.with = { ...(e.with || {}), Size: e.iconSize }; delete e.iconSize; }
        // a colour it only takes from around it is no override of the placed icon: the design leaves it the icon's own
        // (where the design sets the icon's colour, on it or inside it, the code's is read as drawn and compared)
        // (a colour inside a component the library holds no contract for is that component's own: designSetsColour)
        if (!ownIcon.has(id) && !designSetsColour(figmaContract, id, mainOf)) { delete e.background; for (const v of fromCode.variants) if (v.set) delete v.set[`${id}.background`]; }
        // a variant that changes the glyph (an alert's error icon) changes the component in the same set, with its key
        if (!swapped) for (const v of fromCode.variants) if (v.set && typeof v.set[`${id}.asset`] === 'string') { v.set[`${id}.component`] = whole(v.set[`${id}.asset`]); delete v.set[`${id}.asset`]; const k = swapKeyOf(figmaContract, e.key, v.set[`${id}.component`]); if (k === undefined) delete v.set[`${id}.key`]; else v.set[`${id}.key`] = k; }
        // a colour the component placed draws its glyph in itself is no override (after the swaps above, so each variant is
        // held to the component it places)
        dropOwnGlyph(id, e, fromCode.variants, mainsOfAll);
      };
      A.take('icon-as-instance', fromCode, () => {
      for (const [id, e] of Object.entries(fromCode.anatomy)) asIcon(id, e);
      for (const v of fromCode.variants) for (const [id, e] of Object.entries(v.add || {})) asIcon(id, e);
      });
      // a swap that shows a layer the design shows and swaps: the design's boolean and swap names
      A.take('swap-names', fromCode, () => {
      for (const p of Object.values(fromCode.props)) {
        if (p.type !== 'swap' || !p.shows) continue;
        // only a design prop that covers this swap alone: one that also shows another of the code's swaps names neither
        const swaps = Object.values(fromCode.props).filter((q) => q.type === 'swap' && q.shows);
        const alone = (list) => swaps.filter((q) => q.shows.some((x) => (list || []).includes(x))).length === 1;
        const fb = Object.values(figmaContract.props).find((q) => q.type === 'boolean' && (q.shows || []).some((x) => p.shows.includes(x)) && alone(q.shows));
        const fs = Object.values(figmaContract.props).find((q) => (q.type === 'instance' || q.type === 'swap') && (q.swaps || []).some((x) => p.shows.includes(x)) && alone(q.swaps));
        if (fb) p.showName = fb.figma;
        if (fs) p.swapName = fs.figma;
        // shown at the design's own glyph, where the code offers it (button's house)
        const at = p.shows.map(figmaEl).find((x) => x && x.component);
        const g = at && at.component.split('/').pop();
        if (g && p.glyph) p.glyph = g;
      }
      });
      // a text that hugs its words aligns them nowhere: it takes the design's alignment, as it renders the same
      A.take('text-align', fromCode, () => {
      for (const [id, e] of Object.entries(fromCode.anatomy)) {
        const fe = figmaContract.anatomy[id];
        if (e.kind === 'text' && fe && fe.kind === 'text' && fe.textAlign && e.textAlign !== fe.textAlign && (e.width == null || e.width === 'hug')) e.textAlign = fe.textAlign;
      }
      });
      // the design's name for the component, not the code folder's (Board card, not Board-card)
      A.take('component-name', fromCode, () => {
      fromCode.component = figmaContract.component;
      });
      // a value the code draws as the design does, written raw or left unset (a 0 padding, no radius), takes the
      // design's token for it: the drawing binds what the design binds. The compare above keeps what the code wrote
      const val = (t) => (isToken(t, L.value) ? L.value(t) : t);
      const unbound = (v) => v == null || typeof v === 'number';
      const zeroish = (t) => { const v = val(t); return v === 0 || v === '0'; };
      // opacity aside: unset is 1, and its tokens hold percentages (taken below, where the code writes one)
      const fields = [['radius'], ['layout', 'gap'], ...['top', 'end', 'bottom', 'start'].map((k) => ['layout', 'padding', k])];
      const at = (o, path) => path.reduce((x, k) => (x == null ? x : x[k]), o);
      const put = (o, path, v) => { let x = o; for (const k of path.slice(0, -1)) x = x[k] = x[k] || {}; x[path.at(-1)] = v; };
      // a size the design states that the code renders the same: hug or fill where the code sets no size of its own
      // (an instance hugs what it holds), a number where the code's box is that number
      const boxes = boxesBy;
      A.take('design-size', fromCode, () => {
      for (const [id, e] of Object.entries(fromCode.anatomy)) {
        const fe = figmaContract.anatomy[id], box = boxes[id] && boxes[id].box;
        if (!fe || fe.kind !== e.kind) continue;
        for (const [dim, i] of [['width', 0], ['height', 1]]) {
          const want = fe[dim], have = e[dim];
          // fill only where the box spans its parent's room (its box less the parent's padding on that axis)
          const pe = e.parent && fromCode.anatomy[e.parent], pb = e.parent && boxes[e.parent] && boxes[e.parent].box;
          const pad = pe && pe.layout && pe.layout.padding ? (i ? ['top', 'bottom'] : ['start', 'end']).reduce((t, k) => t + (+val(pe.layout.padding[k]) || 0), 0) : 0;
          // on the parent's main axis the room is what its other children and gaps leave
          const main = pe && pe.layout && (pe.layout.direction === 'column' ? 1 : 0) === i;
          const sibs = main ? Object.entries(fromCode.anatomy).filter(([k, o]) => k !== id && o.parent === e.parent && boxes[k] && boxes[k].box) : [];
          const taken = sibs.reduce((t, [k]) => t + boxes[k].box[i], 0) + (sibs.length ? sibs.length * (+val(pe.layout.gap) || 0) : 0);
          // and a css border takes room too
          const edge = pe && pe.border && pe.border.inLayout ? 2 * (+val([].concat(pe.border.width)[0]) || 0) : 0;
          const fills = box && pb && box[i] >= pb[i] - pad - edge - taken - 1;
          // hug and fill are the code's own, read from its css above; only a number the box renders at takes the design's
          if (typeof want === 'number' && box && Math.abs(box[i] - want) < 0.5 && (have == null || have === 'hug' || typeof have === 'number')) e[dim] = want;
        }
      }
      });
      const zeroFill = (e, fe) => zeroTokens(e, fe, L.value);
      A.take('design-zero-token', fromCode, () => {
      for (const [id, e] of Object.entries(fromCode.anatomy)) {
        const fe = figmaContract.anatomy[id];
        if (fe && fe.kind === e.kind) zeroFill(e, fe);
      }
      });
      // and what a variant layer adds or sets whole (a layout set in one variant), held to the design's same part
      // the design's same part in its variant of the same props where it has one (its own tokens there), else its base
      const sameWhen = (a, b) => JSON.stringify(Object.entries(a || {}).sort()) === JSON.stringify(Object.entries(b || {}).sort());
      const designOf = (id, when) => {
        const dv = (figmaContract.variants || []).find((x) => sameWhen(x.when, when));
        if (dv && (dv.add || {})[id]) return dv.add[id];
        const base = figmaContract.anatomy[id] || (figmaContract.variants || []).map((x) => (x.add || {})[id]).find(Boolean);
        const layout = dv && (dv.set || {})[`${id}.layout`];
        return base && layout && typeof layout === 'object' ? { ...base, layout } : base;
      };
      A.take('design-zero-token', fromCode, () => {
      for (const v of fromCode.variants || []) {
        for (const [id, e] of Object.entries(v.add || {})) { const fe = designOf(id, v.when); if (fe && fe.kind === e.kind) zeroFill(e, fe); }
        for (const [k, val] of Object.entries(v.set || {})) {
          // a corner a variant takes away (null), where the design binds a zero corner: that token (the one the design's
          // same variant sets there first, a 0 the base does not have)
          if (k.endsWith('.radius') && (val == null || val === 0)) { const dv = (figmaContract.variants || []).find((x) => sameWhen(x.when, v.when)), own = dv && (dv.set || {})[k], fe = own !== undefined ? { ...designOf(k.slice(0, -'.radius'.length), v.when), radius: own } : designOf(k.slice(0, -'.radius'.length), v.when), holder = {}; if (fe) { zeroFill(holder, fe); if (holder.radius !== undefined) v.set[k] = holder.radius; } continue; }
          if (!k.endsWith('.layout') || !val || typeof val !== 'object') continue;
          const id = k.slice(0, -'.layout'.length), fe = designOf(id, v.when), holder = { layout: val };
          if (fe) { zeroFill(holder, fe); v.set[k] = holder.layout; }
        }
      }
      });
      // stacking first on top, as the design does, at each combination, where the children cannot overlap
      A.take('stack-like-design', fromCode, () => {
      stackLikeDesign(fromCode, figmaContract, L.value);
      });
      // an opacity the code writes raw (0.5 when disabled) takes the design's opacity token that holds it, where exactly
      // one the design uses does (its tokens hold percentages: 50 is 0.5, never 0.5%)
      const opacities = new Set();
      const seek = (o) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (/(^|\.)opacity$/.test(k) && typeof v === 'string' && v.includes('/')) opacities.add(v); else seek(v); } };
      seek(figmaContract.anatomy); seek(figmaContract.variants);
      const opacityToken = (n) => { const hit = [...opacities].filter((t) => { const v = Number(val(t)); return v === +(n * 100).toFixed(3); }); return hit.length === 1 ? hit[0] : null; };
      const adopt = (o, key) => { if (typeof o[key] === 'number') { const t = opacityToken(o[key]); if (t) o[key] = t; } };
      A.take('opacity-token', fromCode, () => {
      for (const e of Object.values(fromCode.anatomy)) adopt(e, 'opacity');
      for (const v of fromCode.variants) {
        for (const k of Object.keys(v.set || {})) if (/\.opacity$/.test(k)) adopt(v.set, k);
        for (const e of Object.values(v.add || {})) adopt(e, 'opacity');
      }
      });
      // the name the code's mapping gives each enum (its axis), before the design's is looked for
      axisNames(fromCode.props, L.m && L.m.axes);
      A.take('design-enum-order', fromCode, () => {
      for (const p of Object.values(fromCode.props)) {
        if (p.type !== 'enum') continue;
        const low = (v) => String(v).toLowerCase();
        const same = (q) => q.type === 'enum' && q.values.length === p.values.length && q.values.every((v) => p.values.some((w) => low(w) === low(v)));
        // exactly one design enum with these words, and no other code enum with them: else the name is a guess
        const hits = Object.values(figmaContract.props).filter(same);
        const words = (q) => q.values.map(low).sort().join();
        const twins = Object.values(fromCode.props).filter((q) => q.type === 'enum' && words(q) === words(p));
        // the design's order where any design enum has these words; its name only where that one is certain
        if (hits.length) p.values = hits[0].values.map((v) => p.values.find((w) => low(w) === low(v)));
        const fp = hits.length === 1 && twins.length === 1 ? hits[0] : null;
        // and its name: the design's Hierarchy for the code's variant, where the values are the same words
        if (fp && fp.figma) p.figma = fp.figma;
      }
      });
      // and every other prop the mapping joins to a design prop of its kind: under the design's own name (isBold, ✏️ label),
      // never one made up by convention for the code's
      A.take('joined-names', fromCode, () => {
      joinedNames(fromCode.props, figmaContract.props, (side.map || {}).props);
      });
      // a fill or colour the code draws as nothing where the design binds a token that draws the same (a tertiary
      // button's ghost-rest, which is see-through): the design's token, at that combination and every one that holds it
      A.take('see-through-fill', fromCode, () => {
      for (const r of compare) {
        const seeThrough = (t) => seeThroughIn(L.value, t);
        if (r.codeValue != null || typeof r.figmaValue !== 'string' || !['background', 'color'].includes(r.field)) continue;
        if (r.verdict !== 'same on screen' && !(r.verdict === 'differs' && seeThrough(r.figmaValue))) continue;
        const f = `${r.figma}.${r.field}`, inWhen = (v) => Object.entries(r.when).every(([k, x]) => String(v.when[k]) === String(x));
        if (!Object.keys(r.when).length) {
          const e = fromCode.anatomy[r.figma];
          if (!e || e[r.field] != null) continue;
          e[r.field] = r.figmaValue;
          // and where the design draws no fill there (a drop area's while dragging), none: the code draws nothing at both
          // (never over a fill the code draws there: a layer of the reading that can meet this combination, none of its
          // keys at another value, and sets it, wider or narrower, keeps the null out)
          const meets = (v, dv) => Object.entries(v.when || {}).every(([k, x]) => !(k in dv.when) || String(dv.when[k]) === String(x));
          for (const dv of figmaContract.variants || []) if (dv.set && f in dv.set && dv.set[f] === null && !fromCode.variants.some((v) => meets(v, dv) && v.set && v.set[f] != null)) {
            const same = fromCode.variants.find((v) => JSON.stringify(v.when) === JSON.stringify(dv.when));
            if (same) same.set = { ...(same.set || {}), [f]: null }; else fromCode.variants.push({ when: { ...dv.when }, set: { [f]: null } });
          }
          continue;
        }
        let hit = false;
        for (const v of fromCode.variants) if (inWhen(v) && v.set && f in v.set && v.set[f] === null) { v.set[f] = r.figmaValue; hit = true; }
        if (!hit && !fromCode.variants.some((v) => JSON.stringify(v.when) === JSON.stringify(r.when))) fromCode.variants.push({ when: { ...r.when }, set: { [f]: r.figmaValue } });
      }
      });
    }
    // (a size a mark said that did not become an instance's is no field of a graphic's, with a design or without one;
    // a variant's change of it, none)
    for (const e of [...Object.values(fromCode.anatomy), ...fromCode.variants.flatMap((v) => Object.values(v.add || {}))]) if (e) delete e.iconSize;
    for (const v of fromCode.variants) for (const k of Object.keys(v.set || {})) if (k.endsWith('.iconSize')) delete v.set[k];
    // in the house's Figma conventions; its props against Figma's as the code audit judges them (one comparison, compareProps)
    const shaped = asFigma(fromCode, { axisOrder: (L.lib.tokens && L.lib.tokens.axisOrder) || [] });
    // a prop the design has under no key or name is the code's alone (the contract editor's "Exists in: Code only"):
    // the drawing leaves it out, as Figma has no such property
    // only where the code follows the design (governed): a compared library's props are joined by rule, under the
    // code's own names, and none is the code's alone for having another name. A prop the mapping joins, or one
    // sharing its code prop with one the design has (a swap's half beside its boolean), is the design's too
    if (L.governed && figmaContract) {
      A.take('design-swaps', shaped.contract, () => {
      asDesignSwaps(shaped.contract.props, figmaContract.props, shaped.contract);
      });
    }
    // (a slot read at its placed default that no design swap took is a slot: the mark is the reading's, never the contract's)
    // (from the reading as written too: asFigma copies each prop, so both carry it)
    dropPlaced(shaped.contract.props, fromCode.props);
    if (L.governed && figmaContract) {
      const sq = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, '');
      const theirs = new Set(Object.entries(figmaContract.props).flatMap(([k, p]) => [k, sq(p.figma || k)]));
      const joined = new Set(Object.values((side.map || {}).props || {}).map((x) => (typeof x === 'string' ? x : x && (x.arg || x.code))).filter(Boolean));
      const all = Object.entries(shaped.contract.props);
      const matched = new Set(all.filter(([k, p]) => theirs.has(k) || theirs.has(sq(p.figma || k))).map(([, p]) => p.code).filter(Boolean));
      // (a text a boolean of the design's speaks for by being empty shares its code prop, and is still the code's alone)
      {
      for (const [k, p] of all) if (p.role !== 'interaction' && !theirs.has(k) && !theirs.has(sq(p.figma || k)) && ((!joined.has(p.code) && !matched.has(p.code)) || (p.type === 'string' && textsOnlyInCode.has(p.code)))) p.only = 'code';
      }
    }
    const propsCompare = figmaContract ? compareProps(figmaContract, side.map, side.code, side.framework, side.fw || {}) : [];
    // a check that read nothing the layers were not built from cannot fail: said, not passed
    const heldOut = readBeyond;
    const report = { at: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), ...(figmaContract && { of: (await import('./official.mjs')).hashOf(figmaContract) }), chrome: (await import('../shared/cdp.mjs')).chromeMajor(),
      // (the combinations left unread, as a number: none now, every one the design draws is read; eval.mjs holds any predicted)
      unread: 0, selfCheck: bad.length ? { notRebuilt: bad } : heldOut ? `every render rebuilt, ${heldOut} combination(s) of four props or more among them, each read: ${heldOut - fourLayers} rebuilt by the layers, ${fourLayers} kept as layers of their own, each from one read` : 'every render rebuilt, but fewer than four props vary: nothing was left unread to check the layers against',
      ...(notes.length && { notes }), ties, compare, propsCompare, structure, renamed: shaped.renamed,
      // (every field taken from the design, by rule: eval.mjs counts a component holding one the same only as assisted)
      assisted: A.out(), declared: [...declared].sort(), contract: fromCode, asFigma: shaped.contract };
    const out = path.join(L.out, 'from-code', `${name}.json`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // the same code reads back to the same file: a run that found nothing new leaves it as it was
    writeReport(out, report);
    const n = (v) => compare.filter((x) => x.verdict === v).length;
    console.log(`${name}: ${Object.keys(props).length} props, ${Object.keys(base).length} elements, ${variants.length} variant layers; self-check ${bad.length ? `${bad.length} not rebuilt` : heldOut ? `ok on ${heldOut} unread combination(s)` : 'nothing left unread to check'}; ${ties.length} tie(s); ${figmaContract ? `against Figma at ${whens.length} combinations: ${n('same token')} same token, ${n('same on screen')} same on screen, ${compare.length - n('same token') - n('same on screen')} differ; props ${propsCompare.filter((x) => x.findings.every((f) => f.kind === 'ok')).length} of ${propsCompare.length} without a finding` : 'only in code: nothing in Figma to compare'} — ${path.relative(TOOLKIT, out)}, ${report.seconds}s`);
    // what the run could not read as asked reaches whoever ran it, not only the file
    for (const x of notes) console.log(`  note: ${x}`);
  } finally {
    if (L.cache) { const c = L.cache.stats; console.log(`read cache: ${c.hits} answers kept, ${c.misses} combination(s) asked of the page, ${c.kept} answer(s) newly kept; Chrome ${c.launched ? 'launched' : 'not launched'}${c.pruned ? `; pruned ${c.pruned.files} file(s), ${(c.pruned.bytes / 1e6).toFixed(1)} MB` : ''}`); }
    L.close();
  }
}

const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v);

/* The map's selectors name the DOM element each Figma element landed on; the
   code contract names it by its own walk, so pair them by element. */
async function pairUp(L, m, read, call, defaults) {
  // the walk tags each element it reads with its id: a mapped element is the one its selector finds, or the
  // nearest tagged element holding it, so pairing names elements exactly as the walk does
  await read(defaults);
  return call(L.tab, (els) => Object.fromEntries(Object.entries(els).map(([fid, e]) => {
    const n = document.querySelector(e.selector);
    const tagged = n && n.closest('[data-contract-id]');
    return [fid, tagged ? tagged.getAttribute('data-contract-id') : null];
  })), m.elements);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) main().catch((e) => { if (!e.usage) { console.error(e); process.exit(1); } console.error(e.message); process.exit(2); });
