#!/usr/bin/env node
/*
 * Phase 1 of the round trip measured against Figma itself (library → contract): each component set read from Figma's
 * REST API (GET /v1/files/:key/nodes, the set and its variants whole), never through the snapshot plugin's walk, and
 * held field by field to
 *
 *   spec      the stored figma.json (the walk's reading of the same set), variant by variant, layer by layer
 *   contract  expand(contract, props) for each variant the set draws (layers.mjs), part by part
 *
 * Each side is read from Figma's own JSON by this file's mapping (FIELDS, below, the one table of what is compared
 * and how), never by the walk or derive: a value is never held to something computed from itself. Even the address is
 * Figma's own: a contract part is found in the REST tree by its layer's name (addressParts), never through figma.json,
 * and a part two layers could be is `ambiguous`, never the first that fits.
 *
 * A field the REST API does not expose (a variable's name without the file_variables scope, a vector's paths, a
 * Dev Mode note, the plugin's flipped-boolean trees) is listed as not checkable (NOT_CHECKABLE), never counted as
 * passing; a bound value whose token name is not checkable is still held to being bound (`@bound`).
 *
 * Rows: { component, variant, path, figma, ours, kind } where kind is `<against>:<field>` (`spec:fills`,
 * `contract:layout.padding`, `contract:part`, `contract:not stated` for a field Figma has inside an instance that the
 * contract leaves unsaid). Every field compared is counted, and every field skipped (REST silent, mixed text, a swap
 * REST does not name) is counted apart, never as passing. A library's report, per side: the components that match on
 * every field checked, that differ, and that had nothing checked; and the kinds that differ most.
 *
 *   node tools/component-contract/oracle-figma.mjs --project <label>[,<label>…] [--cache <dir>] [--out <file>]
 *        [--version snapshot|latest] [--interval <s>] [--offline] [--top <n>] [components…]
 *
 * The REST token is the person's (version.cjs tokenFor: FIGMA_TOKEN, the project's command, ~/.config/figma/token):
 * sent to api.figma.com only, never printed or written. Requests go one at a time, --interval seconds apart (7 unless
 * said), a 429 waits its Retry-After; four failures in a row stop the run. Responses are cached under --cache
 * (<project home>/round-trip/oracle-figma/cache unless said), keyed by file and version, geometry stripped. The file
 * version read is the first saved at or after the project's last snapshot of that file (changes.json); a snapshot
 * stores no version id, so every result says `read at <version, its date>; unpinned: may include later edits`.
 * --version latest reads the file as it is. --offline reads the cache alone, and the version its fetch recorded.
 * Exits 2 on a usage error, 1 when a fetch fails, else 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { expand, camel } from './layers.mjs';
import { WEIGHTS } from '../parity/values.mjs';

const require = createRequire(import.meta.url);
const { resolve: resolveSpec, layerPaths } = require('../snapshot/spec.cjs');
const { variantValues: valuesOf } = require('../shared/names.js');

/* ---------------------------------------------------------------- the mapping */

// a bound value whose variable's name the token cannot read (the variables endpoints need file_variables:read)
export const BOUND = '@bound';
const API = 'https://api.figma.com';
const r2 = (v) => (typeof v === 'number' ? +v.toFixed(2) : v);
const bare = (k) => String(k).replace(/#\d+:\d+$/, '');
const clear = (a) => a < 0.5 / 255;
const H = { LEFT: 'MIN', RIGHT: 'MAX', CENTER: 'CENTER', LEFT_RIGHT: 'STRETCH', SCALE: 'SCALE' };
const V = { TOP: 'MIN', BOTTOM: 'MAX', CENTER: 'CENTER', TOP_BOTTOM: 'STRETCH', SCALE: 'SCALE' };
const ALIGN = { MIN: 'start', CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between', BASELINE: 'baseline' };
const TEXT_ALIGN = { LEFT: 'start', CENTER: 'center', RIGHT: 'end', JUSTIFIED: 'justify' };
const KIND = { TEXT: 'text', INSTANCE: 'instance', SLOT: 'slot', FRAME: 'container', GROUP: 'container', COMPONENT: 'container', COMPONENT_SET: 'container', SECTION: 'container' };

/*
 * Every field compared, with where Figma's REST JSON says it. `spec` names the stored walk's field, `contract` the
 * contract part's; `how` is what is held: `value` (the same value), `bound` (bound or not, the token's name not
 * checkable), `where-stated` (compared only where the side that has it states it). The test holds this table to
 * the code: a field compared and not listed fails.
 */
export const FIELDS = [
  // set level
  { spec: 'props', contract: 'props.type/default/figmaValues', rest: 'componentPropertyDefinitions', how: 'value' },
  { spec: 'defaultVariant', rest: 'componentPropertyDefinitions[VARIANT].defaultValue', how: 'value' },
  { spec: 'description', rest: 'componentSets[id].description | components[id].description', how: 'value' },
  { spec: 'set', rest: 'size', how: 'value' },
  { spec: 'links', rest: 'componentPropertyReferences (every layer, hidden ones included)', how: 'value' },
  { spec: 'variants', contract: 'invalid', rest: 'children[].name (the variant grid drawn)', how: 'value' },
  { spec: 'place', rest: 'relativeTransform of each variant', how: 'value' },
  // per layer
  { spec: 'type', contract: 'kind', rest: 'type', how: 'value' },
  { spec: 'w, h', contract: 'width, height', rest: 'size; layoutSizingHorizontal/Vertical; boundVariables.width/height', how: 'value' },
  { spec: 'x, y, index', contract: 'order, absolute.x/y', rest: 'relativeTransform; children order', how: 'value' },
  { contract: 'absolute.end/bottom', rest: 'parent size less x + w', how: 'where-stated' },
  { spec: 'rotation, flip, visual', contract: 'rotation, flip', rest: 'relativeTransform; absoluteBoundingBox', how: 'value' },
  { spec: 'layout, pad, gap, wrap, crossGap, align, firstOnTop', contract: 'layout.*', rest: 'layoutMode, padding*, itemSpacing, layoutWrap, counterAxisSpacing, primary/counterAxisAlignItems, itemReverseZIndex', how: 'value' },
  { spec: 'sizing', rest: 'layoutSizingHorizontal/Vertical', how: 'value' },
  { spec: 'absolute', contract: 'position', rest: 'layoutPositioning', how: 'value' },
  { spec: 'constraints', contract: 'constraints', rest: 'constraints', how: 'value' },
  { spec: 'minWidth, maxWidth, minHeight, maxHeight', contract: 'minWidth, maxWidth, minHeight, maxHeight', rest: 'minWidth…', how: 'value' },
  { spec: 'radius, smoothing', contract: 'radius, smoothing', rest: 'cornerRadius, rectangleCornerRadii, cornerSmoothing', how: 'value' },
  { spec: 'mask, opacity, clips, blendMode', contract: 'mask, opacity, overflow, blend', rest: 'isMask, opacity, clipsContent, blendMode', how: 'value' },
  { spec: 'bindings', rest: 'boundVariables (padding, gap, radius, stroke weight, opacity, sizes)', how: 'bound' },
  { spec: 'modes', rest: 'explicitVariableModes', how: 'bound' },
  { spec: 'fills, fillStyle', contract: 'background, color, fillStyle', rest: 'fills (solid, linear gradient, image), styles.fill', how: 'value' },
  { spec: 'strokes, strokeSides, strokeAlign, dashed, strokeCap', contract: 'border.*', rest: 'strokes, strokeWeight, individualStrokeWeights, strokeAlign, strokeDashes, strokeCap', how: 'value' },
  { spec: 'strokesInLayout', contract: 'border.inLayout', rest: 'strokesIncludedInLayout', how: 'where-stated' },
  { spec: 'effect, effects', contract: 'shadow', rest: 'styles.effect, effects', how: 'value' },
  { spec: 'arc', contract: 'arc', rest: 'arcData', how: 'value' },
  { spec: 'text', contract: 'content', rest: 'characters; componentPropertyReferences.characters', how: 'value' },
  { spec: 'textStyle, fontSize, fontFamily, fontStyle, lineHeight, letterSpacing', contract: 'typography, letterSpacing', rest: 'styles.text, style.*', how: 'value' },
  { spec: 'textAlign, textAutoResize, textAlignVertical, truncate, maxLines, textCase, textDecoration', contract: 'textAlign, autoResize, verticalAlign, truncate, maxLines, textCase, textDecoration', rest: 'style.*', how: 'value' },
  { spec: 'instanceOf, instanceOfKey, instanceOfId', contract: 'component, key', rest: 'componentId; components/componentSets maps', how: 'value' },
  { spec: 'props (instance)', contract: 'with', rest: 'componentProperties', how: 'value' },
  { spec: 'overrides', rest: 'overrides', how: 'value' },
  { contract: 'swappedBy', rest: 'componentPropertyReferences.mainComponent', how: 'value' },
  { spec: 'children', contract: 'parts', rest: 'children (visible; an instance\'s only where it has overrides)', how: 'value' },
];

/* What REST does not say, so no row can pass or fail on it, each for a reason from the closed list REASONS. */
export const REASONS = ['scope', 'not in the response', "the walk's own", 'named otherwise', 'inference'];
export const NOT_CHECKABLE = [
  { reason: 'scope', field: 'variable names (bindings, bound fills, strokes, gradient stops, effects; contract token names)', why: 'GET /v1/files/:key/variables needs file_variables:read (Enterprise); a node gives the variable id only, so bound-or-not is held, the name is not' },
  { reason: 'scope', field: 'modes (collection and mode names)', why: 'explicitVariableModes gives ids; their names need the variables endpoint' },
  { reason: 'not in the response', field: 'paths, outline (vector)', why: 'REST gives fillGeometry, the filled outline, not the vector network paths the walk reads' },
  { reason: 'not in the response', field: 'notes', why: 'Dev Mode annotations are not in the nodes response' },
  { reason: "the walk's own", field: 'flipped-boolean trees (`<variant>, Prop=value`)', why: 'the walk detaches an instance with the boolean flipped; Figma stores no such node' },
  { reason: 'not in the response', field: 'instanceOf page prefix', why: 'a remote component\'s page is not in the nodes response; the set and variant names are held' },
  { reason: 'not in the response', field: 'textStyle of mixed text', why: 'REST gives per-range overrides as type styles, not style ids' },
  { reason: 'not in the response', field: 'slots (settings, preferred)', why: 'the plugin\'s slot runtime keys are not in componentPropertyDefinitions' },
  { reason: 'inference', field: 'contract whileEmpty, canvas, when, shows', why: 'inferences across variants (and flipped trees), not a field Figma stores' },
  { reason: 'named otherwise', field: 'overridden style ids (fillStyleId, strokeStyleId…)', why: 'REST names them inherit…StyleId and leaves some out where the plugin API lists them; the other overridden fields are held' },
  { reason: 'not in the response', field: 'smoothing of an instance, radius of an ellipse', why: 'REST leaves them out where the plugin API reads an instance\'s through to its component and gives an ellipse one; held where REST states them' },
  { reason: 'not in the response', field: 'variantProperties', why: 'not in the nodes response; each variant\'s props are read from its name' },
];

const colour = (c, opacity = 1) => {
  const a = ('a' in c ? c.a : 1) * opacity;
  const rgb = [c.r, c.g, c.b].map((v) => Math.round(v * 255));
  if (a >= 0.9995) return '#' + rgb.map((v) => ('0' + v.toString(16)).slice(-2)).join('');
  return `rgb(${rgb.join(' ')} / ${+a.toFixed(3)})`;
};
const gradient = (p) => {
  const [s, e] = p.gradientHandlePositions || [];
  const angle = s && e ? Math.round((Math.atan2(e.y - s.y, e.x - s.x) * 180 / Math.PI + 90 + 360) % 360) : null;
  return { type: 'GRADIENT_LINEAR', angle, stops: (p.gradientStops || []).map((st) => ({ position: +st.position.toFixed(4), color: st.boundVariables && st.boundVariables.color ? BOUND : colour(st.color, p.opacity ?? 1) })) };
};
/* Figma's paints as the walk names them, a bound one as BOUND (a paint at no opacity is none, unless `all`: a style's
   or a stroke's; a bound paint whose resolved colour is clear is taken as clear, the walk's "clear in every mode" being
   the variables' to say) */
export function paintsOf(list, all = false) {
  const out = [];
  for (const p of list || []) {
    if (p.visible === false) continue;
    const op = p.opacity ?? 1;
    if (!all && clear(op)) continue;
    const bound = p.boundVariables && p.boundVariables.color;
    if (bound && !all && p.color && clear((p.color.a ?? 1) * op)) continue;
    if (bound) out.push(BOUND);
    else if (p.type === 'SOLID') out.push(colour(p.color, op));
    else if (p.type === 'GRADIENT_LINEAR') out.push(gradient(p));
    else if (p.type === 'IMAGE') out.push('IMAGE:' + p.scaleMode);
    else out.push(p.type);
  }
  return out;
}
// a value as ours writes it, a token's name as BOUND: a colour literal, an image, a paint type or a gradient stay
const LITERAL = /^(#|rgb\(|IMAGE:|GRADIENT_|SOLID$|VIDEO$|PATTERN$|EMOJI$)/;
export function paintOurs(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return { type: v.type, angle: v.angle ?? null, stops: (v.stops || []).map((s) => ({ position: s.position, color: LITERAL.test(String(s.color)) ? s.color : BOUND })) };
  return typeof v === 'string' && !LITERAL.test(v) ? BOUND : v;
}
const num = (v) => (typeof v === 'number' ? v : v == null ? v : BOUND);

/* Where a layer sits and how it turns, from its matrix, as the walk reads them. */
function placeOf(n) {
  const t = n.relativeTransform;
  if (!t) return {};
  const [[a, c, x], [b, d, y]] = t;
  const out = { x: r2(x), y: r2(y) };
  const turn = Math.atan2(-b, a) * 180 / Math.PI;
  if (a * d - b * c < 0) {
    const deg = r2(Math.atan2(b, -a) * 180 / Math.PI) + 0;
    out.flip = Math.abs(deg) === 180 ? 'y' : 'x';
    if (deg && Math.abs(deg) !== 180) out.rotation = deg;
  } else if (r2(turn)) out.rotation = r2(turn);
  // (a turn under a hundredth of a degree is the matrix's rounding, none)
  out.turned = !!r2(turn);
  return out;
}
const sizeOf = (n) => (n.size ? { w: r2(n.size.x), h: r2(n.size.y) } : n.absoluteBoundingBox ? { w: r2(n.absoluteBoundingBox.width), h: r2(n.absoluteBoundingBox.height) } : {});
const four = (bv, keys) => { const r = keys.map((k) => (bv[k] ? BOUND : null)); return r.some(Boolean) ? r : null; };

/* A node's bound fields under the plugin API's names: REST nests a corner's and a side's under rectangleCornerRadii
   (RECTANGLE_TOP_LEFT_CORNER_RADIUS) and individualStrokeWeights (BORDER_TOP_WEIGHT). */
const NESTED = { RECTANGLE_TOP_LEFT_CORNER_RADIUS: 'topLeftRadius', RECTANGLE_TOP_RIGHT_CORNER_RADIUS: 'topRightRadius', RECTANGLE_BOTTOM_RIGHT_CORNER_RADIUS: 'bottomRightRadius', RECTANGLE_BOTTOM_LEFT_CORNER_RADIUS: 'bottomLeftRadius',
  BORDER_TOP_WEIGHT: 'strokeTopWeight', BORDER_RIGHT_WEIGHT: 'strokeRightWeight', BORDER_BOTTOM_WEIGHT: 'strokeBottomWeight', BORDER_LEFT_WEIGHT: 'strokeLeftWeight' };
export function boundOf(n) {
  const out = { ...(n.boundVariables || {}) };
  for (const k of ['rectangleCornerRadii', 'individualStrokeWeights']) {
    const nest = out[k];
    delete out[k];
    if (nest && typeof nest === 'object') for (const [x, v] of Object.entries(nest)) out[NESTED[x] || x] = v;
  }
  // a size bound as size.x and size.y
  if (out.size && typeof out.size === 'object') { if (out.size.x) out.width = out.size.x; if (out.size.y) out.height = out.size.y; delete out.size; }
  return out;
}
function bindingsOf(n) {
  const bv = boundOf(n), out = {};
  const pad = four(bv, ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']); if (pad) out.pad = pad;
  if (bv.itemSpacing) out.gap = BOUND;
  if (bv.counterAxisSpacing) out.crossGap = BOUND;
  const radius = four(bv, ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius']);
  if (radius) out.radius = radius; else if (bv.cornerRadius) out.radius = [BOUND, BOUND, BOUND, BOUND];
  const stroke = four(bv, ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight']);
  if (stroke || bv.strokeWeight) out.strokeWeight = stroke ? stroke.map((w) => w || (bv.strokeWeight ? BOUND : null)) : [BOUND, BOUND, BOUND, BOUND];
  if (bv.opacity) out.opacity = BOUND;
  for (const k of ['minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'width', 'height']) if (bv[k]) out[k === 'width' ? 'w' : k === 'height' ? 'h' : k] = BOUND;
  return Object.keys(out).length ? out : null;
}
// the stored bindings with each name as BOUND, a radius said once as its four corners
export function bindingsOurs(b) {
  if (!b) return null;
  const out = {};
  for (const [k, v] of Object.entries(b)) {
    if (k === 'radius' && !Array.isArray(v)) out[k] = [BOUND, BOUND, BOUND, BOUND];
    else out[k] = Array.isArray(v) ? v.map((x) => (x ? BOUND : null)) : BOUND;
  }
  return out;
}

const styleName = (ctx, n, k) => { const id = n.styles && (n.styles[k] || n.styles[k + 's']); return id && ctx.styles[id] ? ctx.styles[id].name : null; };
// an instance's component as the walk names it: its set's name and its own (the page prefix is not checkable)
function mainOf(ctx, n) {
  const c = ctx.components[n.componentId];
  if (!c) return null;
  const set = c.componentSetId && ctx.componentSets[c.componentSetId];
  return { name: set ? `${set.name} / ${c.name}` : c.name, owner: set ? set.name : c.name, key: set ? set.key : c.key, id: c.componentSetId || n.componentId };
}
// a swap whose component the response does not name is not checkable
export const UNNAMED = '@unnamed';
const swapName = (ctx, id) => { const c = ctx.components[id]; if (!c) return UNNAMED; const s = c.componentSetId && ctx.componentSets[c.componentSetId]; return s ? s.name : c.name; };
const instanceProps = (ctx, n) => Object.fromEntries(Object.entries(n.componentProperties || {}).map(([k, p]) => [bare(k), p.type === 'INSTANCE_SWAP' && typeof p.value === 'string' ? swapName(ctx, p.value) : p.value && typeof p.value === 'object' ? UNNAMED : p.value]));
// REST's names for an overridden field where the plugin API's differ
const OVERRIDE_NAME = { preserveRatio: 'constrainProportions', transitionNodeID: 'reactions', transitionDuration: 'reactions', transitionEasing: 'reactions' };
const overridesOf = (n) => (n.overrides || []).filter((ov) => ov.overriddenFields.some((f) => !['componentProperties', 'name', 'visible'].includes(f)));

/*
 * One REST node in the stored walk's words (plugins/design-system-snapshot walk()), read from Figma's JSON: the fields
 * the walk writes, under the same conditions, with a bound value as BOUND. `parent` is the REST parent.
 */
// a group's (or boolean's) children are placed in the frame that holds the group by the plugin API, in the group by
// REST: `origin` is that group's place, added back
const GROUPS = new Set(['GROUP', 'BOOLEAN_OPERATION']);
export function restWalk(n, ctx, depth = 0, parent = null, at, inInstance = false, origin = { x: 0, y: 0 }) {
  const { w, h } = sizeOf(n);
  const o = { name: n.name, type: n.type, w, h };
  const p = placeOf(n);
  if (depth > 0) {
    o.x = r2(p.x + origin.x); o.y = r2(p.y + origin.y);
    if (typeof at === 'number') o.index = at;
    const img = (n.fills || []).find((f) => f.type === 'IMAGE' && f.imageTransform);
    if (img) { const [[a, b]] = img.imageTransform; const deg = Math.round(Math.atan2(b, a) * 180 / Math.PI); if (deg) o.fillRotation = deg; }
    if (p.turned && n.absoluteBoundingBox && parent && parent.absoluteBoundingBox) {
      const b = n.absoluteBoundingBox, q = parent.absoluteBoundingBox;
      o.visual = { x: r2(b.x - q.x), y: r2(b.y - q.y), w: r2(b.width), h: r2(b.height) };
    }
  }
  if (n.layoutMode && n.layoutMode !== 'NONE') {
    o.layout = n.layoutMode; o.pad = [n.paddingTop || 0, n.paddingRight || 0, n.paddingBottom || 0, n.paddingLeft || 0];
    o.gap = n.itemSpacing || 0; o.wrap = n.layoutWrap === 'WRAP';
    if (o.wrap) o.crossGap = typeof n.counterAxisSpacing === 'number' ? n.counterAxisSpacing : o.gap;
    if (n.itemReverseZIndex) o.firstOnTop = true;
    o.align = (n.primaryAxisAlignItems || 'MIN') + '/' + (n.counterAxisAlignItems || 'MIN');
  }
  if (n.layoutSizingHorizontal) o.sizing = n.layoutSizingHorizontal + '/' + n.layoutSizingVertical;
  if (n.layoutPositioning === 'ABSOLUTE') o.absolute = true;
  const placed = o.absolute || !(parent && parent.layoutMode && parent.layoutMode !== 'NONE');
  if (placed && n.type !== 'COMPONENT' && n.type !== 'GROUP' && n.constraints) {
    const c = `${H[n.constraints.horizontal] || n.constraints.horizontal}/${V[n.constraints.vertical] || n.constraints.vertical}`;
    if (c !== 'MIN/MIN') o.constraints = c;
  }
  for (const k of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight']) if (n[k]) o[k] = n[k];
  const radii = n.rectangleCornerRadii;
  if (radii && !radii.every((x) => x === radii[0])) o.radius = radii;
  else if (n.cornerRadius) o.radius = n.cornerRadius;
  if (n.cornerSmoothing) o.smoothing = r2(n.cornerSmoothing);
  if (n.isMask) o.mask = true;
  if (typeof n.opacity === 'number' && n.opacity !== 1) o.opacity = r2(n.opacity);
  const bound = bindingsOf(n); if (bound) o.bindings = bound;
  if (n.explicitVariableModes && Object.keys(n.explicitVariableModes).length) o.modes = BOUND;
  if (n.clipsContent) o.clips = true;
  if (n.blendMode && n.blendMode !== 'PASS_THROUGH' && n.blendMode !== 'NORMAL') o.blendMode = n.blendMode;
  if (Array.isArray(n.strokeDashes) && n.strokeDashes.length) o.dashed = n.strokeDashes.map(r2);
  const strokes = (n.strokes || []);
  if (n.strokeCap && n.strokeCap !== 'NONE' && strokes.length) o.strokeCap = n.strokeCap;
  if (n.type === 'ELLIPSE' && n.arcData) {
    const a = n.arcData, deg = (r) => Math.round((r * 180) / Math.PI * 100) / 100;
    if (a.innerRadius || Math.abs(a.endingAngle - a.startingAngle - 2 * Math.PI) > 1e-6) o.arc = { start: deg(a.startingAngle), end: deg(a.endingAngle), inner: Math.round(a.innerRadius * 1000) / 1000 };
  }
  if (p.flip) o.flip = p.flip;
  if (p.rotation != null) o.rotation = p.rotation;
  if (Array.isArray(n.fills) && n.fills.length) { const f = paintsOf(n.fills); if (f.length) o.fills = f; }
  const fs = styleName(ctx, n, 'fill'); if (fs) o.fillStyle = fs;
  if (strokes.length) {
    o.strokes = paintsOf(strokes, true);
    const s = n.individualStrokeWeights;
    o.strokeSides = s ? [s.top, s.right, s.bottom, s.left] : [n.strokeWeight, n.strokeWeight, n.strokeWeight, n.strokeWeight];
    o.strokeAlign = n.strokeAlign;
    if ('strokesIncludedInLayout' in n) o.strokesInLayout = n.strokesIncludedInLayout;
  }
  const es = styleName(ctx, n, 'effect');
  if (es) o.effect = es; else if ((n.effects || []).length) o.effect = 'literal';
  if ((n.effects || []).length) {
    const kinds = n.effects.filter((e) => e.visible !== false).map((e) => e.type + (e.blurType === 'PROGRESSIVE' ? '_PROGRESSIVE' : '') + ((e.type === 'INNER_SHADOW' || e.type === 'DROP_SHADOW') && e.spread ? ':spread' : ''));
    if (kinds.length) o.effects = kinds;
  }
  if (n.type === 'TEXT') {
    const st = n.style || {};
    o.text = String(n.characters || '').slice(0, 400);
    const mixed = (n.characterStyleOverrides || []).some(Boolean);
    o.textStyle = mixed ? 'mixed' : styleName(ctx, n, 'text') || 'literal';
    if (o.textStyle === 'literal') { if (typeof st.fontSize === 'number') o.fontSize = r2(st.fontSize); if (st.fontFamily) { o.fontFamily = st.fontFamily; o.fontStyle = st.fontStyle; } }
    o.textAlign = st.textAlignHorizontal;
    o.textAutoResize = st.textAutoResize || 'NONE';
    if (st.textTruncation && st.textTruncation !== 'DISABLED') o.truncate = st.textTruncation;
    if (st.maxLines > 0) o.maxLines = st.maxLines;
    if (st.paragraphSpacing > 0) o.paragraphSpacing = r2(st.paragraphSpacing);
    if (st.listSpacing > 0) o.listSpacing = r2(st.listSpacing);
    if (st.textCase && st.textCase !== 'ORIGINAL') o.textCase = st.textCase;
    if (st.textDecoration && st.textDecoration !== 'NONE') o.textDecoration = st.textDecoration;
    if (st.textAlignVertical && st.textAlignVertical !== 'TOP') o.textAlignVertical = st.textAlignVertical;
    if (st.letterSpacing) o.letterSpacing = r2(st.letterSpacing);
    o.lineHeight = lineHeightOf(st);
  }
  const inner = GROUPS.has(n.type) && depth > 0 ? { x: o.x, y: o.y } : { x: 0, y: 0 };
  if (n.type === 'INSTANCE') {
    const m = mainOf(ctx, n);
    o.instanceOf = m ? m.name : null;
    if (m && m.key) o.instanceOfKey = m.key;
    if (m) o.instanceOfId = m.id;
    o.props = instanceProps(ctx, n);
    const ov = overridesOf(n);
    if (ov.length && depth < 12) {
      // REST names a style override inheritFillStyleId where the plugin API says fillStyleId
      o.overrides = ov.map((x) => [...new Set(x.overriddenFields.map((f) => (OVERRIDE_NAME[f] || f.replace(/^inherit(\w)(\w*StyleId)$/, (_, a, b) => a.toLowerCase() + b))))].join(','));
      o.children = (n.children || []).filter((c) => c.visible !== false).map((c) => restWalk(c, ctx, depth + 1, n, undefined, true, inner));
    }
    return o;
  }
  if (n.children && depth < 12) {
    o.children = [];
    for (const [i, c] of n.children.entries()) if (c.visible !== false) o.children.push(restWalk(c, ctx, depth + 1, n, inInstance ? undefined : i, inInstance, inner));
  }
  return o;
}
// a line height in px, or 'auto' (REST says px always; a percent of the font's size is said as px too)
function lineHeightOf(st) {
  if (!st.lineHeightUnit || st.lineHeightUnit === 'INTRINSIC_%') return 'auto';
  return r2(st.lineHeightPx);
}

/* The stored node's fields in the same terms: bound names as BOUND, a percent spacing or line height as px. */
export function specOurs(s, figmaNode) {
  const o = { ...s };
  delete o.children; delete o.paths; delete o.outline; delete o.notes; delete o.unrecorded;
  if (o.bindings) o.bindings = bindingsOurs(o.bindings);
  if (o.modes) o.modes = BOUND;
  // a turn the walk rounded to 0 is none, and its visual box the layer's own
  if (o.rotation === 0) { delete o.rotation; delete o.visual; }
  if (o.fills && Array.isArray(o.fills)) o.fills = o.fills.map(paintOurs);
  if (o.strokes && Array.isArray(o.strokes)) o.strokes = o.strokes.map(paintOurs);
  const size = figmaNode && figmaNode.style && figmaNode.style.fontSize;
  const px = (v) => (typeof v === 'string' && v.endsWith('%') && size ? r2((parseFloat(v) * size) / 100) : typeof v === 'string' && v !== 'auto' ? r2(parseFloat(v)) : v);
  if ('letterSpacing' in o) o.letterSpacing = px(o.letterSpacing);
  if ('lineHeight' in o) o.lineHeight = px(o.lineHeight);
  if (Array.isArray(o.overrides)) o.overrides = overrideFields(o.overrides);
  return o;
}
// an override's fields, sorted, a style id's left out (REST lists a fill style's override and not always a stroke's)
const overrideFields = (list) => list.map((x) => x.split(',').filter((f) => !/StyleId$/.test(f)).sort().join(',')).filter(Boolean).sort();
function restOurs(o) {
  const out = { ...o };
  delete out.children;
  if (Array.isArray(out.overrides)) out.overrides = overrideFields(out.overrides);
  return out;
}
const same = (a, b, tol = 0.011) => {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= tol;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => same(x, b[i], tol));
  if (a && b && typeof a === 'object' && typeof b === 'object') { const ks = new Set([...Object.keys(a), ...Object.keys(b)]); return [...ks].every((k) => same(a[k], b[k], tol)); }
  return a === b;
};

/* Each visible node of a REST tree by its store path (spec.cjs layerPaths: `A > B`, a repeat `A#2`). */
function byPath(tree) {
  const m = new Map([['$root', tree]]);
  layerPaths(visible(tree), (node, p) => { m.set(p, node.$n); });
  return m;
}
// the visible layers only, each holding its REST node (`$n`), as the walk sees a variant
const visible = (n) => ({ name: n.name, $n: n, children: (n.children || []).filter((c) => c.visible !== false).map(visible) });

/*
 * What one comparison found: its rows, how many fields it checked, and how many it skipped and why (a field REST does
 * not state, a text of mixed styles, a swap REST does not name). A skipped field is never a checked one, so a
 * component with nothing checked is "not checked", never a match.
 */
function tally(component, against) {
  const t = { rows: [], checked: 0, skipped: {} };
  t.check = (variant, p, field, figma, ours, eq = same) => { t.checked++; if (!eq(figma, ours)) t.rows.push({ component, variant, path: p, figma, ours, kind: `${against}:${field}`, against }); };
  t.differ = (variant, p, field, figma, ours) => { t.checked++; t.rows.push({ component, variant, path: p, figma, ours, kind: `${against}:${field}`, against }); };
  t.skip = (why, n = 1) => { t.skipped[why] = (t.skipped[why] || 0) + n; };
  return t;
}
const result = (t) => ({ rows: t.rows, checked: t.checked, skipped: t.skipped });

/* -------------------------------------------------------- figma vs the spec */

export function compareSpec(component, setNode, spec, ctx) {
  const t = tally(component, 'spec');
  const isSet = setNode.type === 'COMPONENT_SET';
  const variants = isSet ? setNode.children || [] : [setNode];
  // set level
  const defs = setNode.componentPropertyDefinitions || {};
  const props = Object.fromEntries(Object.entries(defs).map(([k, d]) => [bare(k), d.type === 'VARIANT' ? d.variantOptions : d.type]));
  for (const k of new Set([...Object.keys(props), ...Object.keys(spec.props || {})])) t.check(null, `props.${k}`, 'props', props[k], (spec.props || {})[k]);
  if (isSet) {
    const want = Object.fromEntries(Object.entries(defs).filter(([, d]) => d.type === 'VARIANT').map(([k, d]) => [bare(k), d.defaultValue]));
    t.check(null, 'defaultVariant', 'defaultVariant', want, valuesOf(spec.defaultVariant || ''));
  }
  const meta = isSet ? ctx.componentSets[setNode.id] : ctx.components[setNode.id];
  if (meta) t.check(null, 'description', 'description', meta.description || '', spec.description || '', (a, b) => plainText(a) === plainText(b));
  else t.skip('description: the set is not in the response');
  if (isSet && setNode.size) t.check(null, 'set', 'set', { w: r2(setNode.size.x), h: r2(setNode.size.y) }, spec.set);
  const links = linksOf(variants);
  for (const k of new Set([...Object.keys(links), ...Object.keys(spec.links || {})])) t.check(null, `links.${k}`, 'links', links[k], (spec.links || {})[k]);
  // variant by variant
  const stored = new Map((spec.variants || []).map((v) => [v.name, v]));
  const figmaNames = new Set(variants.map((v) => v.name));
  for (const v of variants) {
    const s = stored.get(v.name);
    if (!s) { t.differ(v.name, '$root', 'variant', 'drawn', 'missing'); continue; }
    t.check(v.name, '$root', 'variant', true, true);
    const walked = restWalk(v, ctx);
    if (isSet) { const p = placeOf(v); walked.place = { x: p.x, y: p.y }; }
    diffTree(walked, s, v, t);
  }
  // a stored variant Figma does not draw, other than a flipped boolean's (the walk's own: skipped)
  const booleans = Object.entries(defs).filter(([, d]) => d.type === 'BOOLEAN').map(([k]) => bare(k));
  for (const name of stored.keys()) {
    if (figmaNames.has(name)) continue;
    if (booleans.some((b) => new RegExp(`, ${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=(True|False)$`).test(name))) t.skip('flipped-boolean tree');
    else t.differ(name, '$root', 'variant', 'missing', 'stored');
  }
  return result(t);
}
// a description as words: REST gives it plain, the walk as markdown (a link's text, emphasis, a list's markers)
// (REST also drops the line a bold heading ends, so the words are held with no space between them)
export const plainText = (t) => String(t || '').replace(/^[ \t]*(?:[-*+]|\d+\.)[ \t]+/gm, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(+c)).replace(/(\*\*|__|\*|_|`)(\S(?:.*?\S)?)\1/g, '$2').replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1').replace(/[\s﻿​]+/g, '');

function diffTree(walked, stored, restRoot, t) {
  const variant = walked.name;
  const fig = new Map([['$root', walked]]); layerPaths(walked, (n, p) => { fig.set(p, n); });
  const ours = new Map([['$root', stored]]); layerPaths(stored, (n, p) => { ours.set(p, n); });
  const rest = byPath(restRoot);
  for (const [p, f] of fig) {
    const o = ours.get(p);
    if (!o) { if (ours.has(parentPath(p))) t.differ(variant, p, 'layer', 'present', 'missing'); continue; }
    t.check(variant, p, 'layer', true, true);
    const a = restOurs(f), b = specOurs(o, rest.get(p));
    if (p === '$root') { delete a.name; delete b.name; }
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      // REST silent on a field the walk states: skipped, by name (an instance's corner smoothing, which the plugin API
      // reads through to its component; an ellipse's radius; whether strokes take room; sizing on a vector)
      if (!(k in a) && (k === 'strokesInLayout' || k === 'sizing' || (k === 'smoothing' && f.type === 'INSTANCE') || (k === 'radius' && f.type === 'ELLIPSE'))) { t.skip(`${k}: REST silent`); continue; }
      if (k === 'textStyle' && (a[k] === 'mixed' || b[k] === 'mixed')) { t.skip('textStyle of mixed text'); continue; }
      // how many layers an instance overrides (the walk keeps eight); the fields' names are REST's own, not checkable
      if (k === 'overrides' && Array.isArray(a[k]) && Array.isArray(b[k])) { t.check(variant, p, k, Math.min(8, a[k].length), b[k].length); continue; }
      if (k === 'instanceOf' && typeof a[k] === 'string' && typeof b[k] === 'string') { t.check(variant, p, k, a[k], b[k], (x, y) => y === x || y.endsWith('/' + x)); continue; }
      if (k === 'props') { const n = dropUnnamed(a[k], b[k]); if (n) t.skip('swap REST does not name', n); }
      t.check(variant, p, k, a[k], b[k]);
    }
  }
  for (const p of ours.keys()) if (!fig.has(p) && fig.has(parentPath(p))) t.differ(variant, p, 'layer', 'missing', 'present');
}
const parentPath = (p) => (p.includes(' > ') ? p.slice(0, p.lastIndexOf(' > ')) : '$root');

/* The plugin's propLinks, read off REST: which layers each property drives, hidden ones counted, not into instances. */
export function linksOf(roots) {
  const links = {}, where = {};
  let root = '';
  const walk = (node, at) => {
    const seen = {};
    for (const c of node.children || []) {
      const k = c.visible === false ? (seen[c.name] || 0) + 1 : (seen[c.name] = (seen[c.name] || 0) + 1);
      const here = [...at, c.name + (k > 1 ? `[${k}]` : '')];
      const refs = c.componentPropertyReferences;
      if (refs) for (const kind of ['characters', 'visible', 'mainComponent']) {
        if (!refs[kind]) continue;
        const prop = bare(refs[kind]);
        const l = links[prop] || (links[prop] = { kind, layers: [] });
        if (!l.layers.some((x) => x.join('/') === here.join('/') && x.length === here.length)) l.layers.push(here);
        (where[prop] || (where[prop] = new Set())).add(root);
      }
      if (c.type !== 'INSTANCE') walk(c, here);
    }
  };
  for (const v of roots) { root = v.name; walk(v, []); }
  for (const [prop, l] of Object.entries(links)) if (where[prop].size < roots.length) l.variants = roots.map((v) => v.name).filter((n) => where[prop].has(n));
  return links;
}

/* ---------------------------------------------------- figma vs the contract */

const radiusList = (v) => (v == null ? undefined : Array.isArray(v) ? v.map(num) : [num(v), num(v), num(v), num(v)]);
const one = (list) => (!list || !list.length ? undefined : list.length === 1 ? list[0] : list);

/* One REST node as a contract part says it, the parts ours states where-stated only (absolute.end/bottom). */
export function restPart(n, parent, ctx, propIds, frame = parent) {
  const e = { kind: KIND[n.type] || 'graphic' };
  const bv = boundOf(n);
  const { w, h } = sizeOf(n);
  const p = placeOf(n);
  const word = { FILL: 'fill', HUG: 'hug' };
  // a quarter-turned layer's sizing is said on its parent's axes, its size on its own
  const quarter = p.rotation != null && Math.abs(Math.abs(p.rotation) - 90) < 0.01;
  const [sh, sv] = quarter ? [n.layoutSizingVertical, n.layoutSizingHorizontal] : [n.layoutSizingHorizontal, n.layoutSizingVertical];
  e.width = bv.width ? BOUND : word[sh] || w;
  e.height = bv.height ? BOUND : word[sv] || h;
  if (n.layoutMode && n.layoutMode !== 'NONE') {
    const val = (k) => (bv[k] ? BOUND : n[k] || 0);
    e.layout = { direction: n.layoutMode === 'HORIZONTAL' ? 'row' : 'column', gap: val('itemSpacing'), align: ALIGN[n.primaryAxisAlignItems || 'MIN'], crossAlign: ALIGN[n.counterAxisAlignItems || 'MIN'],
      padding: { top: val('paddingTop'), end: val('paddingRight'), bottom: val('paddingBottom'), start: val('paddingLeft') } };
    if (n.layoutWrap === 'WRAP') { e.layout.wrap = true; e.layout.crossGap = bv.counterAxisSpacing ? BOUND : typeof n.counterAxisSpacing === 'number' ? n.counterAxisSpacing : e.layout.gap; }
    if (n.itemReverseZIndex) e.layout.firstOnTop = true;
  }
  const fills = Array.isArray(n.fills) ? paintsOf(n.fills) : [];
  if (fills.length) e[n.type === 'TEXT' ? 'color' : 'background'] = one(fills);
  const fs = styleName(ctx, n, 'fill'); if (fs) e.fillStyle = fs;
  const strokes = Array.isArray(n.strokes) ? paintsOf(n.strokes, true) : [];
  const sw = bv.strokeWeight || bv.strokeTopWeight || bv.strokeRightWeight || bv.strokeBottomWeight || bv.strokeLeftWeight;
  if (strokes.length || sw) {
    const s = n.individualStrokeWeights;
    const side = (k, x) => (bv[k] || bv.strokeWeight ? BOUND : x);
    const widths = s ? [side('strokeTopWeight', s.top), side('strokeRightWeight', s.right), side('strokeBottomWeight', s.bottom), side('strokeLeftWeight', s.left)] : [side('', n.strokeWeight), side('', n.strokeWeight), side('', n.strokeWeight), side('', n.strokeWeight)];
    e.border = { color: one(strokes), width: widths };
    if (n.strokeAlign === 'CENTER') e.border.align = 'center'; else if (n.strokeAlign === 'OUTSIDE') e.border.align = 'outside';
    if (Array.isArray(n.strokeDashes) && n.strokeDashes.length) e.border.dash = n.strokeDashes.map(r2);
    if (n.strokeCap && n.strokeCap !== 'NONE') e.border.cap = n.strokeCap.toLowerCase();
    if ('strokesIncludedInLayout' in n) e.border.inLayout = n.strokesIncludedInLayout || undefined;
  }
  const radii = n.rectangleCornerRadii;
  const rb = ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'];
  const radius = radii ? radii.map((x, i) => (bv[rb[i]] ? BOUND : x)) : n.cornerRadius ? [0, 1, 2, 3].map((i) => (bv[rb[i]] ? BOUND : n.cornerRadius)) : rb.some((k) => bv[k]) ? rb.map((k) => (bv[k] ? BOUND : 0)) : undefined;
  if (radius && radius.some((x) => x !== 0)) e.radius = radius;
  if (n.cornerSmoothing) e.smoothing = r2(n.cornerSmoothing);
  if (bv.opacity) e.opacity = BOUND; else if (typeof n.opacity === 'number' && n.opacity !== 1) e.opacity = r2(n.opacity);
  if (n.clipsContent) e.overflow = 'hidden';
  if (n.isMask) e.mask = true;
  if (n.blendMode && !['PASS_THROUGH', 'NORMAL'].includes(n.blendMode)) e.blend = n.blendMode.toLowerCase();
  if (n.layoutPositioning === 'ABSOLUTE') e.position = 'absolute';
  const placed = n.layoutPositioning === 'ABSOLUTE' || (parent && !(parent.layoutMode && parent.layoutMode !== 'NONE'));
  if (parent && placed) {
    // the contract's place (REFERENCE, the shape): x and y, except a mirrored layer's on its mirrored axis, its near
    // edge, which is the box the eye sees where it is turned too, else its matrix origin less its size
    const bb = n.absoluteBoundingBox, pb = parent.absoluteBoundingBox;
    const near = (axis, size) => (p.turned && bb && pb ? r2(bb[axis] - pb[axis]) : r2(p[axis] - size));
    const box = { x: p.flip === 'x' ? near('x', w) : p.x, y: p.flip === 'y' ? near('y', h) : p.y, w, h };
    // inside a group, placed in the frame that holds it (as the plugin API places it); `frame` is that frame
    if (frame && frame !== parent && frame.absoluteBoundingBox && pb) { box.x = r2(box.x + pb.x - frame.absoluteBoundingBox.x); box.y = r2(box.y + pb.y - frame.absoluteBoundingBox.y); }
    const ps = sizeOf(parent);
    e.absolute = { x: box.x, y: box.y, end: r2(ps.w - box.x - box.w), bottom: r2(ps.h - box.y - box.h) };
    if (n.constraints && n.type !== 'GROUP') {
      const c = { horizontal: (H[n.constraints.horizontal] || '').toLowerCase(), vertical: (V[n.constraints.vertical] || '').toLowerCase() };
      if (!(c.horizontal === 'min' && c.vertical === 'min')) e.constraints = c;
    }
  }
  for (const k of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight']) if (bv[k]) e[k] = BOUND; else if (n[k]) e[k] = n[k];
  if (p.rotation != null) e.rotation = p.rotation;
  if (p.flip) e.flip = p.flip;
  if (n.type === 'RECTANGLE') e.shape = 'rectangle';
  if (n.type === 'ELLIPSE') e.shape = 'ellipse';
  if (n.type === 'ELLIPSE' && n.arcData) {
    const a = n.arcData, deg = (r) => Math.round((r * 180) / Math.PI * 100) / 100;
    if (a.innerRadius || Math.abs(a.endingAngle - a.startingAngle - 2 * Math.PI) > 1e-6) e.arc = { start: deg(a.startingAngle), end: deg(a.endingAngle), inner: Math.round(a.innerRadius * 1000) / 1000 };
  }
  const es = styleName(ctx, n, 'effect');
  if (es) e.shadow = es; else if ((n.effects || []).some((x) => x.visible !== false)) e.shadow = 'literal';
  // a slot holds what its property gives it
  const slot = n.componentPropertyReferences && n.componentPropertyReferences.slotContentId;
  if (slot && propIds[bare(slot)]) e.content = `{${propIds[bare(slot)]}}`;
  if (n.type === 'TEXT') {
    const st = n.style || {};
    const ref = n.componentPropertyReferences && n.componentPropertyReferences.characters;
    e.content = ref && propIds[bare(ref)] ? `{${propIds[bare(ref)]}}` : String(n.characters || '');
    const mixed = (n.characterStyleOverrides || []).some(Boolean);
    const style = styleName(ctx, n, 'text');
    e.typography = mixed ? 'mixed' : style || { size: st.fontSize, lineHeight: st.lineHeightUnit === 'INTRINSIC_%' || !st.lineHeightUnit ? 0 : r2(st.lineHeightPx), weight: st.fontWeight, italic: !!st.italic, family: st.fontFamily };
    e.textAlign = TEXT_ALIGN[st.textAlignHorizontal] || st.textAlignHorizontal;
    e.autoResize = String(st.textAutoResize || 'NONE').toLowerCase();
    if (st.textAlignVertical === 'CENTER') e.verticalAlign = 'center'; else if (st.textAlignVertical === 'BOTTOM') e.verticalAlign = 'end';
    if (st.textTruncation === 'ENDING') e.truncate = true;
    if (st.maxLines > 0) e.maxLines = st.maxLines;
    if (st.letterSpacing) e.letterSpacing = r2(st.letterSpacing);
    if (st.textCase && st.textCase !== 'ORIGINAL') e.textCase = st.textCase.toLowerCase();
    if (st.textDecoration && st.textDecoration !== 'NONE') e.textDecoration = st.textDecoration.toLowerCase();
  }
  if (n.type === 'INSTANCE') {
    const m = mainOf(ctx, n);
    if (m) { e.component = m.owner; if (m.key) e.key = m.key; }
    const w = instanceProps(ctx, n);
    if (Object.keys(w).length) e.with = w;
    const swap = n.componentPropertyReferences && n.componentPropertyReferences.mainComponent;
    if (swap && propIds[bare(swap)]) e.swappedBy = propIds[bare(swap)];
  }
  return e;
}

// a literal typography as its parts (`literal 14/20 semibold italic IBM Plex Sans`), else the style's name
function typeOurs(v) {
  const m = /^literal (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?) ([a-z]+)( italic)?(?: (.+))?$/.exec(String(v));
  if (!m) return v;
  return { size: +m[1], lineHeight: +m[2], weight: WEIGHTS[m[3]] ?? m[3], italic: !!m[4], family: m[5] ? m[5].replace(/^"(.*)"$/, '$1') : undefined };
}
/* A contract part in the same terms: tokens as BOUND, a radius as its four corners, a border's width as four sides. */
export function partOurs(e) {
  const o = {};
  for (const [k, v] of Object.entries(e)) {
    if (['parent', 'order', 'name', 'paths', 'modes', 'whileEmpty', 'canvas', 'shows'].includes(k)) continue;
    if (k === 'width' || k === 'height') o[k] = v === 'hug' || v === 'fill' ? v : num(v);
    else if (k === 'background' || k === 'color') o[k] = Array.isArray(v) ? v.map(paintOurs) : paintOurs(v);
    else if (k === 'layout') {
      o.layout = { ...v, gap: num(v.gap), padding: v.padding && Object.fromEntries(Object.entries(v.padding).map(([s, x]) => [s, num(x)])) };
      if ('crossGap' in v) o.layout.crossGap = num(v.crossGap);
    } else if (k === 'border') {
      const wd = Array.isArray(v.width) ? v.width.map(num) : v.width == null ? undefined : [num(v.width), num(v.width), num(v.width), num(v.width)];
      o.border = { ...v, color: Array.isArray(v.color) ? v.color.map(paintOurs) : paintOurs(v.color), width: wd };
      // a width per side is said as `sides` where none is bound
      if (v.sides && o.border.width == null) o.border.width = [v.sides.top, v.sides.end, v.sides.bottom, v.sides.start];
      delete o.border.sides;
    } else if (k === 'radius') o.radius = radiusList(v);
    else if (k === 'opacity' || /^(min|max)(Width|Height)$/.test(k)) o[k] = num(v);
    else if (k === 'typography') o.typography = typeOurs(v);
    else o[k] = v;
  }
  return o;
}

/*
 * Which REST layer each contract part is, found in Figma's own tree and never through the stored spec (the walk being
 * judged): parent first, a part is the child of its parent's layer whose name it carries (`name`, Figma's own, where
 * the contract keeps it), or whose name camel-cases to its id's last part (a repeat's `_2` taken off), or a boolean's
 * own layer, named for its prop (layers.mjs). One candidate is the part; several are told apart only by a repeat's
 * number, and only where the contract has as many such parts as Figma has layers; else the part is ambiguous, never
 * the first that fits.
 */
export function addressParts(flat, variant, propIds) {
  const found = new Map([['root', variant]]), ambiguous = new Map(), taken = new Set([variant]);
  const kids = (n) => (n.children || []).filter((c) => c.visible !== false);
  const depth = (id) => { let d = 0; for (let p = flat[id] && flat[id].parent; p; p = flat[p] && flat[p].parent) d++; return d; };
  const ids = Object.keys(flat).filter((id) => id !== 'root').sort((a, b) => depth(a) - depth(b));
  const baseOf = (id) => { const last = id.slice(id.lastIndexOf('/') + 1); const m = /^(.*)_(\d+)$/.exec(last); return m ? { base: m[1], nth: +m[2] } : { base: last, nth: 1 }; };
  const fits = (part, base, c) => {
    if (part.name) return part.name === c.name;
    if (camel(c.name) === base) return true;
    const ref = c.componentPropertyReferences && c.componentPropertyReferences.visible, pid = ref && propIds[bare(ref)];
    return !!pid && base === pid + camel(c.name).replace(/^./, (x) => x.toUpperCase());
  };
  for (const id of ids) {
    const part = flat[id], parent = found.get(part.parent || 'root');
    if (!parent) continue;
    const { base, nth } = baseOf(id);
    const fit = kids(parent).filter((c) => fits(part, base, c));
    if (!fit.length) continue;
    // the parts of this parent that the same layers would fit
    const siblings = ids.filter((x) => (flat[x].parent || 'root') === (part.parent || 'root') && baseOf(x).base === base && (flat[x].name || null) === (part.name || null));
    const c = fit.length === 1 ? fit[0] : siblings.length === fit.length ? fit[nth - 1] : null;
    if (c && !taken.has(c)) { found.set(id, c); taken.add(c); continue; }
    ambiguous.set(id, fit.map((x) => `${x.name} (#${kids(parent).indexOf(x) + 1})`));
  }
  return { found, ambiguous, taken };
}

/* REST layers no part took, by their path in Figma's tree, inside an instance only where the walk goes (an instance
   that overrides something, every one around it too) */
function untaken(variant, taken) {
  const out = [];
  const walk = (n, at, open) => {
    for (const c of (n.children || []).filter((x) => x.visible !== false)) {
      const p = at ? `${at} > ${c.name}` : c.name;
      if (open && !taken.has(c)) out.push({ path: p, node: c });
      walk(c, p, open && (c.type !== 'INSTANCE' || overridesOf(c).length > 0));
    }
  };
  walk(variant, '', true);
  return out;
}

export function compareContract(component, setNode, contract, ctx) {
  const t = tally(component, 'contract');
  const isSet = setNode.type === 'COMPONENT_SET';
  const variants = isSet ? setNode.children || [] : [setNode];
  const defs = setNode.componentPropertyDefinitions || {};
  const cprops = contract.props || {};
  const idOfProp = Object.fromEntries(Object.entries(cprops).map(([id, p]) => [p.figma, id]));
  // props: each Figma property a contract prop of its type, default and options
  const TYPE = { VARIANT: 'enum', BOOLEAN: 'boolean', TEXT: 'string', INSTANCE_SWAP: 'instance', SLOT: 'slot' };
  for (const [k, d] of Object.entries(defs)) {
    const id = idOfProp[bare(k)], p = id && cprops[id];
    if (!p) { t.differ(null, `props.${bare(k)}`, 'props', d.type, 'missing'); continue; }
    const axisBool = d.type === 'VARIANT' && p.type === 'boolean' && p.axis;
    if (!axisBool) t.check(null, `props.${id}.type`, 'props.type', TYPE[d.type], p.type);
    if (d.type === 'VARIANT') {
      const opts = p.figmaValues || (axisBool ? ['False', 'True'] : null);
      if (opts) t.check(null, `props.${id}.figmaValues`, 'props.values', d.variantOptions, opts); else t.skip('props.values: the contract keeps no Figma spelling');
      const def = axisBool ? /^true$/i.test(d.defaultValue) : p.values && p.figmaValues ? p.values[p.figmaValues.indexOf(d.defaultValue)] : d.defaultValue;
      t.check(null, `props.${id}.default`, 'props.default', def, p.default);
    } else if (d.type === 'BOOLEAN') t.check(null, `props.${id}.default`, 'props.default', d.defaultValue, p.default);
  }
  for (const [id, p] of Object.entries(cprops)) if (!Object.keys(defs).some((k) => bare(k) === p.figma)) t.differ(null, `props.${id}`, 'props', 'missing', p.type);
  // each variant's props in the contract's spelling, by the contract's own figmaValues
  const whenOf = (name) => {
    const when = {};
    for (const [fp, fv] of Object.entries(valuesOf(name))) {
      const id = idOfProp[fp]; if (!id) continue;
      const p = cprops[id], i = (p.figmaValues || []).indexOf(fv);
      if (p.type === 'boolean') when[id] = /^true$/i.test(fv);
      else when[id] = p.values && i >= 0 ? p.values[i] : fv;
    }
    return when;
  };
  // the grid: a combination drawn iff no invalid entry names it
  if (isSet && Array.isArray(contract.invalid)) {
    const drawn = new Set(variants.map((v) => JSON.stringify(sortKeys(whenOf(v.name)))));
    const axes = Object.entries(defs).filter(([, d]) => d.type === 'VARIANT').map(([k, d]) => [bare(k), d.variantOptions]);
    const combos = axes.reduce((acc, [k, opts]) => acc.flatMap((c) => opts.map((o) => ({ ...c, [k]: o }))), [{}]);
    if (combos.length <= 4096) for (const c of combos) {
      const name = Object.entries(c).map(([k, v]) => `${k}=${v}`).join(', ');
      const when = whenOf(name), isDrawn = drawn.has(JSON.stringify(sortKeys(when)));
      const invalid = contract.invalid.some((x) => Object.entries(x).every(([k, v]) => same(when[k], v)));
      t.check(null, name, 'invalid', isDrawn ? 'valid' : 'invalid', invalid ? 'invalid' : 'valid');
    } else t.skip('invalid: over 4,096 combinations');
  } else if (isSet) t.skip('invalid: the contract lists none');
  // part by part, each variant Figma draws
  for (const v of variants) {
    const flat = expand(contract, whenOf(v.name));
    const { found, ambiguous, taken } = addressParts(flat, v, idOfProp);
    const fpath = new Map([[v, '$root']]);
    layerPaths(visible(v), (x, p) => { fpath.set(x.$n, p); });
    const parentOf = new Map();
    const index = (n) => { for (const c of n.children || []) { parentOf.set(c, n); index(c); } };
    index(v);
    const inInstance = (n) => { for (let q = parentOf.get(n); q && q !== v; q = parentOf.get(q)) if (q.type === 'INSTANCE') return true; return false; };
    for (const [id, part] of Object.entries(flat)) {
      if (ambiguous.has(id)) { t.differ(v.name, id, 'ambiguous', ambiguous.get(id), 'one part'); continue; }
      const n = found.get(id);
      if (!n) { t.differ(v.name, id, 'part', 'missing', 'present'); continue; }
      t.check(v.name, id, 'part', true, true);
      const parent = parentOf.get(n) || null;
      let frame = parent;
      while (frame && GROUPS.has(frame.type)) frame = parentOf.get(frame);
      const a = restPart(n, n === v ? null : parent, ctx, idOfProp, n === v ? null : frame), b = partOurs(part);
      // an instance, and a layer inside one, says what differs from its component (derive's ownStyling); a field Figma
      // has there that the contract leaves unsaid is a row of its own, `not stated`
      if (n.type === 'INSTANCE' || inInstance(n)) {
        for (const k of Object.keys(a)) if (!(k in b) && !['kind', 'component', 'key', 'with', 'swappedBy'].includes(k)) { t.differ(v.name, `${id}.${k}`, 'not stated', a[k], undefined); delete a[k]; }
      }
      // a layer stretched on an axis is sized by its place where the contract says its end (or bottom); with neither
      // that nor a width, its width is held to Figma's box
      const abs = b.absolute || {};
      if (a.constraints && a.constraints.horizontal === 'stretch' && !('width' in b)) { if ('end' in abs) { delete a.width; t.skip('width: said by the stretched layer\'s end'); } else a.width = sizeOf(n).w; }
      if (a.constraints && a.constraints.vertical === 'stretch' && !('height' in b)) { if ('bottom' in abs) { delete a.height; t.skip('height: said by the stretched layer\'s bottom'); } else a.height = sizeOf(n).h; }
      for (const f of part.whileEmpty || []) if (!(f in a)) { delete b[f]; t.skip(`${f}: an empty frame's minimum (whileEmpty)`); }
      if (n.type === 'INSTANCE' && !('smoothing' in a) && 'smoothing' in b) { delete b.smoothing; t.skip('smoothing: REST silent'); }
      if (n.type === 'ELLIPSE' && !('radius' in a) && 'radius' in b) { delete b.radius; t.skip('radius: REST silent'); }
      if (a.typography === 'mixed') { delete a.typography; delete b.typography; t.skip('textStyle of mixed text'); }
      // a styled text's letter spacing is its style's, said by the contract only where the layer sets its own
      if (typeof a.typography === 'string' && 'letterSpacing' in a && !('letterSpacing' in b)) { delete a.letterSpacing; t.skip('letterSpacing: a styled text\'s, unsaid'); }
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (k === 'absolute') {
          // x and y wherever either side places the layer, end and bottom where the contract states them
          if (!b.absolute) { t.differ(v.name, id, 'absolute', a.absolute, undefined); continue; }
          for (const f of ['x', 'y', 'end', 'bottom']) {
            if ((f === 'end' || f === 'bottom') && !(f in b.absolute)) { if (a.absolute && f in a.absolute) t.skip(`absolute.${f}: unsaid`); continue; }
            t.check(v.name, id, `absolute.${f}`, a.absolute && a.absolute[f], b.absolute[f], (x, y) => same(x, y, 0.51));
          }
          continue;
        }
        if (k === 'border' && a.border && b.border) {
          for (const f of new Set([...Object.keys(a.border), ...Object.keys(b.border)])) {
            if (f === 'inLayout' && !('inLayout' in a.border)) { t.skip('border.inLayout: REST silent'); continue; }
            t.check(v.name, id, `border.${f}`, a.border[f], b.border[f]);
          }
          continue;
        }
        if (k === 'layout' && a.layout && b.layout) {
          for (const f of new Set([...Object.keys(a.layout), ...Object.keys(b.layout)])) t.check(v.name, id, `layout.${f}`, a.layout[f], b.layout[f]);
          continue;
        }
        if (k === 'component' && typeof a[k] === 'string' && typeof b[k] === 'string') { t.check(v.name, id, k, a[k], b[k], (x, y) => y === x || y.endsWith('/' + x) || y.endsWith(' / ' + x)); continue; }
        // a swap the property makes everywhere is the prop's `swaps`; `swappedBy` says one that holds in some variants
        if (k === 'swappedBy' && !b[k]) { const p = cprops[a[k]]; t.check(v.name, id, k, a[k], p && (p.swaps || []).includes(id) ? a[k] : undefined); continue; }
        if (k === 'with') { const n2 = dropUnnamed(a[k], b[k]); if (n2) t.skip('swap REST does not name', n2); }
        t.check(v.name, id, k, a[k], b[k]);
      }
    }
    // a layer Figma draws that no part is
    for (const { path: p } of untaken(v, taken)) t.differ(v.name, p, 'part', 'present', 'missing');
  }
  return result(t);
}
// a swap REST does not name is held by neither side; how many were dropped
function dropUnnamed(a, b) { let n = 0; if (a && typeof a === 'object') for (const [k, v] of Object.entries(a)) if (v === UNNAMED) { n++; delete a[k]; if (b && typeof b === 'object') delete b[k]; } return n; }
const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));

/* ------------------------------------------------------------- reading Figma */

const strip = (n) => { delete n.fillGeometry; delete n.strokeGeometry; delete n.vectorNetwork; delete n.interactions; for (const c of n.children || []) strip(c); return n; };

/* A fetch, polite: one at a time, `interval` ms apart, a 429 waiting its Retry-After, a failure retried, four in a row
   thrown. The token goes in a header to api.figma.com and nowhere else. */
export function client(token, { interval = 7000, fetch = globalThis.fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), log = () => {} } = {}) {
  let last = 0;
  return async function get(p) {
    let fails = 0;
    for (;;) {
      const wait = last + interval - Date.now();
      if (wait > 0) await sleep(wait);
      last = Date.now();
      let r, body;
      try { r = await fetch(API + p, { headers: { 'X-Figma-Token': token }, signal: AbortSignal.timeout(120000) }); body = await r.json(); } catch (e) { r = { status: 0 }; body = { err: e.message }; }
      if (r.status === 200) return body;
      fails++;
      const retry = r.status === 429 ? Math.min(+(r.headers && r.headers.get && r.headers.get('retry-after')) || 60, 600) * 1000 : interval * 2;
      log(`figma: ${p.split('?')[0]} answered ${r.status || 'nothing'} (${(body && (body.err || body.message)) || ''}); waiting ${Math.round(retry / 1000)}s`);
      if (fails >= 4 || (r.status && r.status !== 429 && r.status < 500)) throw new Error(`figma ${p.split('?')[0]}: ${r.status} ${(body && (body.err || body.message)) || ''}`);
      await sleep(retry);
    }
  };
}

/*
 * The version to read: the first saved at or after the snapshot `at` (dates compared as dates: `08:26:13Z` is before
 * `08:26:13.582Z`, which a string comparison denies), else null, the file as it is. Never pinned: a snapshot stores no
 * version id, so the one read may hold edits made between the snapshot and its save.
 */
export async function versionAt(get, fileKey, at) {
  const when = Date.parse(at);
  if (!at || Number.isNaN(when)) return null;
  let page = await get(`/v1/files/${fileKey}/versions?page_size=50`), after = null;
  for (let i = 0; i < 20; i++) {
    for (const v of page.versions || []) { if (Date.parse(v.created_at) >= when) after = v; else return after && { id: after.id, at: after.created_at, pinned: false }; }
    const next = page.pagination && page.pagination.next_page;
    if (!next || !String(next).startsWith(`${API}/`)) break;
    page = await get(String(next).slice(API.length));
  }
  return after && { id: after.id, at: after.created_at, pinned: false };
}
/* What a result says it read. */
export const readAt = (version, snapshotAt) => `read at ${version && version.id ? `${version.id}, ${version.at || 'its date unknown'}` : 'latest'}${version && version.pinned ? '' : `; unpinned: may include later edits than the snapshot of ${snapshotAt || 'an unknown time'}`}`;

/* Every set's REST node, cached per file and version, fetched in batches no bigger than `per` ids or `variants` variants. */
export async function fetchSets(get, fileKey, sets, { version, cache, offline = false, per = 20, variants = 150, log = () => {} }) {
  const dir = path.join(cache, fileKey, version || 'latest');
  fs.mkdirSync(dir, { recursive: true });
  const file = (id) => path.join(dir, id.replace(/[^0-9A-Za-z;-]/g, '_') + '.json');
  const out = {}, want = [];
  for (const s of sets) { try { out[s.id] = JSON.parse(fs.readFileSync(file(s.id), 'utf8')); } catch { want.push(s); } }
  if (offline || !want.length) return out;
  const batches = [];
  let b = [], n = 0;
  for (const s of want) { if (b.length && (b.length >= per || n + s.count > variants)) { batches.push(b); b = []; n = 0; } b.push(s); n += s.count; }
  if (b.length) batches.push(b);
  for (const [i, batch] of batches.entries()) {
    log(`figma ${fileKey}: batch ${i + 1}/${batches.length} (${batch.length} sets)`);
    const body = await get(`/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(batch.map((s) => s.id).join(','))}&geometry=paths${version ? `&version=${version}` : ''}`);
    for (const s of batch) {
      const got = body.nodes && body.nodes[s.id];
      const keep = got ? { version: body.version, document: strip(got.document), components: got.components, componentSets: got.componentSets, styles: got.styles } : { version: body.version, missing: true };
      fs.writeFileSync(file(s.id), JSON.stringify(keep));
      out[s.id] = keep;
    }
  }
  return out;
}

/* ------------------------------------------------------------------- report */

/* Per side: components that match on every field checked (at least one), that differ, and that had nothing checked
   (or are not in Figma); the fields checked and skipped. `both`: matched on both sides. */
export function report(label, results, top = 5) {
  const side = (k) => {
    const out = { matched: 0, differing: 0, notChecked: 0, checked: 0, skipped: 0 };
    for (const r of results) {
      const s = !r.missing && r[k];
      if (!s || !s.checked) { out.notChecked++; if (s) out.skipped += Object.values(s.skipped || {}).reduce((a, b) => a + b, 0); continue; }
      out.checked += s.checked; out.skipped += Object.values(s.skipped || {}).reduce((a, b) => a + b, 0);
      if (s.rows.length) out.differing++; else out.matched++;
    }
    return out;
  };
  const ok = (s) => s && s.checked > 0 && !s.rows.length;
  const kinds = {};
  for (const r of results) for (const x of [...((r.spec || {}).rows || []), ...((r.contract || {}).rows || [])]) { const k = kinds[x.kind] || (kinds[x.kind] = { kind: x.kind, rows: 0, components: new Set(), example: x }); k.rows++; k.components.add(r.component); }
  const ranked = Object.values(kinds).sort((a, b) => b.components.size - a.components.size || b.rows - a.rows).slice(0, top).map((k) => ({ kind: k.kind, components: k.components.size, rows: k.rows, example: k.example }));
  const skippedBy = {};
  for (const r of results) for (const k of ['spec', 'contract']) for (const [why, n] of Object.entries((r[k] || {}).skipped || {})) skippedBy[`${k}: ${why}`] = (skippedBy[`${k}: ${why}`] || 0) + n;
  return { label, components: results.length, unread: results.filter((r) => r.missing).length, spec: side('spec'), contract: side('contract'), both: results.filter((r) => !r.missing && ok(r.spec) && ok(r.contract)).length, skippedBy, top: ranked };
}

/* --------------------------------------------------------------------- run */

async function main(argv) {
  const opt = { projects: [], only: [], version: 'snapshot', interval: 7, top: 5 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project' || a === '--projects') opt.projects.push(...String(argv[++i] || '').split(',').filter(Boolean));
    else if (a === '--cache') opt.cache = argv[++i];
    else if (a === '--out') opt.out = argv[++i];
    else if (a === '--version') opt.version = argv[++i];
    else if (a === '--interval') opt.interval = +argv[++i];
    else if (a === '--top') opt.top = +argv[++i];
    else if (a === '--offline') opt.offline = true;
    else if (a.startsWith('--')) { console.error(`unknown flag ${a}`); return 2; }
    else opt.only.push(a);
  }
  if (!opt.projects.length || !['snapshot', 'latest'].includes(opt.version) || !(opt.interval >= 0)) { console.error('usage: oracle-figma.mjs --project <label>[,<label>…] [--cache <dir>] [--out <file>] [--version snapshot|latest] [--interval <s>] [--offline] [--top <n>] [components…]'); return 2; }
  const projects = require('../snapshot/projects.cjs');
  const { tokenFor } = require('../snapshot/version.cjs');
  const all = [], reports = [];
  for (const label of opt.projects) {
    const w = projects.layout(undefined, label);
    if (!w || w.error || !w.paths) { console.error(w && w.error ? w.error : `no project ${label}`); return 2; }
    let config = null;
    try { config = JSON.parse(fs.readFileSync(path.join(w.repo || w.projectDir, 'snapshot.config.json'), 'utf8')); } catch { /* the token file */ }
    const token = opt.offline ? 'offline' : tokenFor(w.repo, config);
    if (!token) { console.error(`${label}: no Figma token (FIGMA_TOKEN, the project's figmaToken command, or ~/.config/figma/token)`); return 2; }
    const get = client(token, { interval: opt.interval * 1000, log: (s) => console.error(s) });
    const cache = opt.cache ? path.join(opt.cache, label) : path.join(w.projectDir, 'round-trip', 'oracle-figma', 'cache');
    let index = {};
    try { index = JSON.parse(fs.readFileSync(w.paths.index, 'utf8')).components || {}; } catch { /* every folder under its spec's own file below */ }
    let changes = [];
    try { changes = JSON.parse(fs.readFileSync(w.paths.changes, 'utf8')); } catch { /* no snapshot time: the file as it is */ }
    const folders = fs.readdirSync(w.paths.components).filter((f) => fs.existsSync(path.join(w.paths.components, f, 'figma.json')) && (!opt.only.length || opt.only.includes(f)));
    const keys = projects.libraryRoles(w.doc).components;
    const byFile = {};
    for (const f of folders) {
      const stored = JSON.parse(fs.readFileSync(path.join(w.paths.components, f, 'figma.json'), 'utf8'));
      const file = (index[f] || {}).file || keys[0];
      (byFile[file] || (byFile[file] = [])).push({ folder: f, stored, id: stored.id, count: 1 + (stored.variants || []).length });
    }
    const results = [];
    for (const [file, sets] of Object.entries(byFile)) {
      const at = changes.filter((c) => c.file === file && c.at && !Number.isNaN(Date.parse(c.at))).map((c) => c.at).sort((x, y) => Date.parse(x) - Date.parse(y)).pop();
      let version = null;
      if (opt.offline) {
        // the version the cache holds, as its fetch recorded it (version.json)
        const d = path.join(cache, file);
        const vs = fs.existsSync(d) ? fs.readdirSync(d) : [];
        if (vs.length !== 1) { console.error(`${label}: ${file}: ${vs.length ? 'more than one version cached' : 'nothing cached'}; name one with --cache`); return 2; }
        try { version = JSON.parse(fs.readFileSync(path.join(d, vs[0], 'version.json'), 'utf8')); } catch { version = vs[0] === 'latest' ? null : { id: vs[0], pinned: false }; }
      } else if (opt.version === 'snapshot') {
        try { version = await versionAt(get, file, at); } catch (e) { console.error(e.message); return 1; }
      }
      const said = readAt(version, at);
      console.log(`${label}: ${file} ${said}; ${sets.length} components`);
      let got;
      try { got = await fetchSets(get, file, sets, { version: version && version.id, cache, offline: opt.offline, log: (s) => console.error(s) }); } catch (e) { console.error(e.message); return 1; }
      if (!opt.offline) fs.writeFileSync(path.join(cache, file, (version && version.id) || 'latest', 'version.json'), JSON.stringify({ ...(version || { id: null }), pinned: false, snapshotAt: at || null }) + '\n');
      for (const s of sets) {
        const r = got[s.id];
        if (!r || r.missing || !r.document) { results.push({ component: s.folder, missing: true, readAt: said }); continue; }
        const ctx = { styles: r.styles || {}, components: r.components || {}, componentSets: r.componentSets || {} };
        const spec = resolveSpec(s.stored);
        let contract = null;
        try { contract = JSON.parse(fs.readFileSync(path.join(w.paths.components, s.folder, 'contract.json'), 'utf8')); } catch { /* no contract: the spec alone */ }
        results.push({ component: s.folder, readAt: said, spec: compareSpec(s.folder, r.document, spec, ctx), contract: contract ? compareContract(s.folder, r.document, contract, ctx) : null });
      }
    }
    const rep = report(label, results, opt.top);
    reports.push(rep);
    for (const r of results) for (const k of ['spec', 'contract']) if (r[k]) all.push(...r[k].rows.map((x) => ({ library: label, readAt: r.readAt, ...x })));
    const line = (s) => `${s.matched} match, ${s.differing} differ, ${s.notChecked} not checked (${s.checked} fields checked, ${s.skipped} skipped)`;
    console.log(`${label}: ${rep.components} components${rep.unread ? ` (${rep.unread} not in Figma)` : ''}; spec: ${line(rep.spec)}; contract: ${line(rep.contract)}; both match: ${rep.both}`);
    for (const k of rep.top) console.log(`  ${k.kind}: ${k.components} components, ${k.rows} rows — e.g. ${k.example.component} ${k.example.variant || ''} ${k.example.path}: figma ${JSON.stringify(k.example.figma)} ours ${JSON.stringify(k.example.ours)}`);
  }
  if (opt.out) fs.writeFileSync(opt.out, JSON.stringify({ reports, notCheckable: NOT_CHECKABLE, rows: all }, null, 1) + '\n');
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.error(e.stack || e.message); process.exit(1); });
