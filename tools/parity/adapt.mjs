/*
 * tools/parity/adapt.mjs — Figma, translated once into expectations, part of
 * the design-to-code parity engine (README.md here; the method is
 * skills/design-code-parity §5).
 *
 *   adapt(tree, mapping, ctx) → Doc[]
 *   tree     a variant, or a screen frame, from the stored snapshot
 *   mapping  { root?: selector, layers: { [exact path | '$root']: selector | null } }
 *   ctx      { snapshot, tier, typeTier?, parity?, carried?, state?, children?, copy?, runtime? }
 *   Doc      { layer, selector, status: 'measure'|'structural'|'absent', assertions }
 *
 * This is the only code that knows a Figma term. Every expected value comes
 * out resolved for the tier (`12px`, `rgba(…)`, never a token name), so the
 * differ (diff.mjs) judges plain CSS against plain CSS. A token, style or
 * paint that cannot be resolved is an `unresolved` assertion, which the
 * differ reports as a finding: an expectation nobody can state must not read
 * as agreement. Two projects each wrote one of these and each skipped such a
 * name in silence (engine-design A12).
 *
 * Every rule is pinned by a fixture in test-adapt.mjs. The two adapters this
 * replaces disagreed on 22 points; where a rule below settles one, its comment
 * says which and why, in Figma's and CSS's own terms.
 *
 * What a project supplies comes in through `ctx.parity` (its parity block in
 * snapshot.config.json): `props` (instance props as attributes: `rename`,
 * `skip`, `swap`), `position` (where a layer sits against its nearest
 * measured ancestor), `canvas` (token prefixes that name the window a frame
 * was drawn in). Nothing here names a project.
 */
import { createRequire } from 'node:module';
import { layerIndex } from './layers.mjs';
import { parseColour, figmaWeight } from './values.mjs';
import { cssName } from '../tokens/names.mjs';
import { css, KINDS } from './schema.mjs';

const require = createRequire(import.meta.url);
const { nameOf } = require("../snapshot/graph.cjs");
const { valueOf } = require('../snapshot/tokens.cjs');
const { slug } = require('../snapshot/spec.cjs');

const SIDES = ['top', 'right', 'bottom', 'left'];
const kebab = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// The custom property a token becomes, named by the token build (tools/tokens/names.mjs), for a builder's hint.
const cssVar = (name) => `var(${cssName('', name)})`;

/** A token name where the design bound one (per side, for a list), else undefined. */
const bound = (node, key, i) => {
  const b = node.bindings && node.bindings[key];
  if (Array.isArray(b)) return b[i];
  return typeof i === 'number' ? undefined : b;
};

/*
 * How far a hugged size may be from the browser's, in pixels: one per text
 * box laid end to end along that axis. Figma sizes a text box that hugs its
 * words to a whole pixel — every one of the 10,620 hugged text widths and
 * heights in two projects' snapshots is an integer, where fill widths and
 * paths are not — and a browser lays the same words out to a 64th of a pixel,
 * so each such box is up to a pixel off ("Label" is 37 in the file, 36.28 in
 * Chrome). Those pixels add up only where the boxes are in series: along a
 * row's width or a column's height. Across the axis a frame is as big as its
 * biggest child, so it carries that child's count, not the sum; a size the
 * design fixes carries none; and a frame that wraps is counted in series both
 * ways, its upper bound. An instance whose insides the snapshot did not record
 * counts as one box when a text prop gives it words, else none. Counting every text run below a frame on both axes let a
 * page's height pass 52 waivers' worth of real differences.
 */
/*
 * A property's type, read from the library component the instance places
 * (its spec's `props`: TEXT, BOOLEAN, INSTANCE_SWAP or a variant's values),
 * set for the run by adapt() from ctx.propTypes. The name is the fallback, for
 * an instance of a component the project does not store: " text" and " swap"
 * were how a library said it until one renamed every property to house
 * standards (13 Oct: `Label text` became `Label`, `Icon swap (20)` became
 * `Icon (20)`), and a hugging button lost its text slack to the guess.
 */
let PROP_TYPES = null;
/** `types`: component name → its spec's `props`. Exported for the gates. */
export function propTypeIn(types, n, key) {
  if (types && n.instanceOf) {
    const props = types.get(nameOf(n.instanceOf, (x) => types.has(x)));
    if (props && key in props) return props[key];
  }
  return / text( \(\d+\))?$/i.test(key) ? 'TEXT' : / swap( \(\d+\))?$/i.test(key) ? 'INSTANCE_SWAP' : null;
}
const propType = (n, key) => propTypeIn(PROP_TYPES, n, key);
const inFlow = (n) => (n.children || []).filter((c) => c.hidden !== true && c.absolute !== true);
const sizingOn = (n, axis) => String(n.sizing || '/').split('/')[axis === 'w' ? 0 : 1];
function textBoxes(n, axis) {
  if (n.type === 'TEXT') return 1;
  // an instance whose insides were not recorded sets words only if a text
  // prop says so: an icon or a bare checkbox has none, and a hugging one took
  // a pixel of slack per glyph (review 2026-10-02 round 3, S7)
  if (n.type === 'INSTANCE' && !(n.children || []).length) return Object.keys(n.props || {}).some((k) => propType(n, k) === 'TEXT') ? 1 : 0;
  // a text box counts even where the design fixed it: a fixed text box is a
  // snapped one frozen (textAutoResize NONE), and the browser still sets the
  // words in its own line boxes
  const each = inFlow(n).map((c) => (c.type === 'TEXT' ? 1 : sizingOn(c, axis) === 'FIXED' ? 0 : textBoxes(c, axis)));
  const series = n.wrap === true || n.layout === (axis === 'w' ? 'HORIZONTAL' : 'VERTICAL');
  return series ? each.reduce((a, b) => a + b, 0) : Math.max(0, ...each);
}
/* The slack on one axis of a layer's size: none where the design fixes it;
   its own text boxes where it hugs; where it fills, its parent's slack plus,
   along the parent's run, what its siblings hug. `chain` is its ancestors,
   outermost first.

   Capped at SLACK_CAP. A pixel a box is an upper bound, and the boxes in a
   long run do not all round the same way. Measured uncapped across both
   projects on 2026-10-02: 302 rows the slack excused by a pixel or more, 260
   of them by under 3; the bound itself reached 25 and 33. Of the rows past
   3, two the rule genuinely explains (four tags, 3.36; six tab labels, 5.08)
   and the rest are defects it was absorbing — a dialog 4.00 short where its
   frame's text area is, a phone page 22.94 short. A difference past the cap
   is a waiver with its own `within` and owner, or a finding. A row the slack
   excuses by a pixel or more is reported as waived, never as a match
   (diff.mjs), so the slack is read, not trusted. */
export const SLACK_CAP = 3;
export function sizeSlack(n, axis, chain) {
  const s = sizingOn(n, axis);
  if (s === 'FIXED') return 0;
  if (s !== 'FILL' || !chain.length) return Math.min(SLACK_CAP, textBoxes(n, axis));
  const p = chain[chain.length - 1];
  const along = p.wrap === true || p.layout === (axis === 'w' ? 'HORIZONTAL' : 'VERTICAL');
  const siblings = along ? inFlow(p).filter((c) => c !== n && sizingOn(c, axis) !== 'FIXED').reduce((t, c) => t + textBoxes(c, axis), 0) : 0;
  return Math.min(SLACK_CAP, sizeSlack(p, axis, chain.slice(0, -1)) + siblings);
}

/* A Figma line height as a multiplier of the size, or `{ px }`. The style
   carries a ratio; a layer states its own as `150%` or `24px`. */
const lineHeightOf = (raw, fallback) => {
  if (typeof raw === 'number') return raw;
  const pct = /^([\d.]+)%$/.exec(String(raw || ''));
  if (pct) return Number(pct[1]) / 100;
  const px = /^([\d.]+)px$/.exec(String(raw || ''));
  if (px) return { px: Number(px[1]) };
  return fallback;
};

/*
 * Token values for one tier: `{ value }` or `{ unresolved: name }`. A colour
 * may be written literally (`#121212`, `rgb(255 255 255 / 0)`), which is a
 * value, not a name (A13: a literal is still drawn, so it is still judged).
 */
function resolver(snapshot, tier, typeTier) {
  const raw = (name, mode = tier) => valueOf(snapshot, name, mode);
  const colour = (name) => {
    const literal = parseColour(name);
    if (literal) return { value: css(literal) };
    const v = raw(name);
    const c = typeof v === 'string' ? parseColour(v) : null;
    return c ? { value: css(c) } : { unresolved: String(name) };
  };
  const length = (name) => {
    const v = raw(name);
    return typeof v === 'number' ? { value: `${v}px` } : { unresolved: String(name) };
  };
  /* A number bound to a layer's opacity is a percentage: Figma reads it so,
     whatever the library (in both projects' snapshots, 198 layers bind
     State/Disabled/opacity = 50 and record their own opacity as 0.5). A
     0-1 token bound there draws a near-transparent layer in Figma too, so
     0.005 is what the design says, not a misreading. CSS states a ratio. */
  const ratio = (name) => {
    const v = raw(name);
    return typeof v === 'number' ? { value: String(+(v / 100).toFixed(4)) } : { unresolved: String(name) };
  };
  return { raw, colour, length, ratio, typeTier };
}

/** Which mapped layers draw an effect, or a stroke, in ANY of these variants. */
export function carriers(variants, paths) {
  const effect = new Set(), stroke = new Set();
  for (const v of variants) {
    const index = layerIndex(v);
    for (const p of paths) {
      const n = (index.get(p) || {}).node;
      if (!n) continue;
      if (n.effect) effect.add(p);
      if (n.strokes && n.strokes.length) stroke.add(p);
    }
  }
  return { effect, stroke };
}

/*
 * One node → its assertions. `at` is `{ node, parent, ancestors, layer }`
 * from layers.mjs; `ctx` as adapt's, with `values` (resolver) and `mapped`
 * (path → selector) and `index` filled in.
 */
export function assertionsFor(at, ctx) {
  const { node, parent, ancestors = [], layer = '$root' } = at;
  const V = ctx.values;
  const out = [];
  const add = (kind, prop, expected, from, extra) => {
    if (expected === undefined || expected === null) return;
    out.push({ kind, prop, expected, ...(from === undefined ? null : { from }), ...extra });
  };
  // A resolved `{ value }` becomes an assertion; `{ unresolved }` a finding.
  const put = (kind, prop, r, from, extra) => {
    if (r.unresolved !== undefined) out.push({ kind: 'unresolved', prop, expected: null, from: r.unresolved });
    else add(kind, prop, r.value, from, extra);
  };
  const hint = (prop, name, literal) => ({ hint: `${prop}: ${name ? cssVar(name) : literal}` });
  const runtime = (ctx.runtime || []).includes(layer);

  // ---- auto layout ----------------------------------------------------------
  // In-flow children only: an absolutely positioned layer — a focus ring — is
  // out of the flow, so it neither makes a direction observable nor spaces.
  const kids = (node.children || []).filter((c) => c.hidden !== true && c.absolute !== true);
  const [hSizing, vSizing] = String(node.sizing || '/').split('/');
  const vertical = node.layout === 'VERTICAL';
  const auto = node.layout === 'HORIZONTAL' || vertical;

  // Padding: four properties, each preferring its bound token.
  if (Array.isArray(node.pad)) {
    node.pad.forEach((literal, i) => {
      const name = bound(node, 'pad', i);
      put('length', `padding-${SIDES[i]}`, name ? V.length(name) : { value: `${literal}px` }, name || literal, hint(`padding-${SIDES[i]}`, name, `${literal}px`));
    });
  }

  /*
   * An alignment is a choice about free space, so where there is none there
   * is no choice to observe (A6): what the frame is, less its padding, less
   * what its children and gaps take.
   */
  /* An INSIDE stroke that takes room is inside the box too, as a border is
     in CSS: 186 hugging frames in two snapshots have exactly 1px of "free"
     space and a 1px stroke, and asserting an alignment there judged a choice
     nobody can see (item 13 of the 2026-10-02 review). */
  const stroked = Array.isArray(node.strokes) && node.strokes.length && node.strokeAlign === 'INSIDE' && node.strokesInLayout !== false
    ? (Array.isArray(node.strokeSides) ? node.strokeSides : [1, 1, 1, 1].map(() => node.strokeWeight || 1)) : [0, 0, 0, 0];
  const pad = (Array.isArray(node.pad) ? node.pad : [0, 0, 0, 0]).map((p, i) => p + (stroked[i] || 0));
  const extent = (c, axis) => (axis === 'v' ? c.h : c.w);
  const inner = (axis) => (axis === 'v' ? node.h - pad[0] - pad[2] : node.w - pad[3] - pad[1]);
  const known = (axis) => node.w !== undefined && node.h !== undefined && kids.every((c) => extent(c, axis) !== undefined);
  const primaryAxis = vertical ? 'v' : 'h', counterAxis = vertical ? 'h' : 'v';
  const gapN = typeof node.gap === 'number' ? node.gap : 0;
  // a SPACE_BETWEEN frame's itemSpacing is a leftover, not space it takes
  const spacing = String(node.align || '').startsWith('SPACE_BETWEEN') ? 0 : gapN;
  const freeOnPrimary = known(primaryAxis)
    ? inner(primaryAxis) - kids.reduce((t, c) => t + extent(c, primaryAxis), 0) - spacing * (kids.length - 1) > 0.5
    : (vertical ? vSizing : hSizing) !== 'HUG';
  const freeOnCounter = known(counterAxis)
    ? kids.some((c) => inner(counterAxis) - extent(c, counterAxis) > 0.5)
    : (vertical ? hSizing : vSizing) !== 'HUG' || new Set(kids.map((c) => extent(c, counterAxis))).size > 1;
  const PRIMARY = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between' };
  const COUNTER = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', BASELINE: 'baseline' };
  // One child sits in the same place either way round; none, more so.
  if (auto && kids.length > 1) add('text', '-stacking', vertical ? 'column' : 'row', node.layout);
  const [primary, counter] = String(node.align || '/').split('/');
  // SPACE_BETWEEN with one child puts it at the start, in Figma as in CSS
  const run = primary === 'SPACE_BETWEEN' && kids.length < 2 ? 'MIN' : primary;
  if (PRIMARY[run] && kids.length && freeOnPrimary) add('alignment', 'justify-content', PRIMARY[run], node.align, { axis: primaryAxis });
  if (COUNTER[counter] && kids.length && freeOnCounter) add('alignment', 'align-items', COUNTER[counter], node.align, { axis: counterAxis });
  /* Wrapping is a choice about children that do not fit on one line, so it
     is observable only where they do not: where the in-flow children and
     their gaps run past the frame's inner extent. Where they fit, `wrap` and
     `nowrap` draw the same line (design-code-parity gate 14), as an alignment with no free space
     does. Geometry the snapshot does not record leaves it asserted. */
  const overruns = known(primaryAxis)
    ? kids.reduce((t, c) => t + extent(c, primaryAxis), 0) + spacing * (kids.length - 1) - inner(primaryAxis) > 0.5
    : true;
  if (node.wrap !== undefined && auto && kids.length > 1 && overruns) add('text', 'flex-wrap', node.wrap ? 'wrap' : 'nowrap', node.wrap);

  /*
   * Gap (A5). Figma's itemSpacing is the primary axis's spacing: between the
   * columns of a row, between the rows of a column. It is observable only
   * between two in-flow children, and a SPACE_BETWEEN frame distributes
   * rather than gaps: the spacing it still records is a leftover. A gap of 0
   * is a gap: the probe reads an unset one as 0px. A grid spaces its tracks
   * with gaps of its own, which the snapshot does not record: its itemSpacing
   * is a leftover too (one grid records 0 and draws 16).
   */
  const distributes = String(node.align || '').startsWith('SPACE_BETWEEN');
  if (auto && !distributes && typeof node.gap === 'number' && kids.length > 1) {
    const name = bound(node, 'gap');
    const prop = vertical ? 'row-gap' : 'column-gap';
    put('length', prop, name ? V.length(name) : { value: `${node.gap}px` }, name || node.gap, hint('gap', name, `${node.gap}px`));
  }
  /* And between the lines a wrapping frame breaks into, where Figma sets that
     apart from itemSpacing (`crossGap`, the plugin's record of
     counterAxisSpacing since 0.49.0; absent, the lines are spaced as the items).
     Only where a second line forms: children that fit on one line have no
     space between lines, and the gap a page sets there draws nothing (review
     2026-10-02 round 3, S8). */
  if (auto && node.wrap === true && typeof node.crossGap === 'number' && kids.length > 1 && overruns) {
    const name = bound(node, 'crossGap');
    put('length', vertical ? 'column-gap' : 'row-gap', name ? V.length(name) : { value: `${node.crossGap}px` }, name || node.crossGap, hint(vertical ? 'column-gap' : 'row-gap', name, `${node.crossGap}px`));
  }

  /*
   * A clip, only where something is clipped: a child that leaves the frame,
   * or a rounded frame a child paints into the corner of (a square coloured
   * header at the top of a rounded column). Figma turns clipping on for
   * nearly every frame; asserting it everywhere put 554 differences on a
   * library that renders correctly.
   */
  const overflows = kids.some((c) =>
    (c.x !== undefined && c.w !== undefined && node.w !== undefined && (c.x < 0 || c.x + c.w > node.w)) ||
    (c.y !== undefined && c.h !== undefined && node.h !== undefined && (c.y < 0 || c.y + c.h > node.h)));
  const paintsIntoCorner = (c) => {
    if (!Array.isArray(c.fills) || c.fills.length === 0) return false;
    if (typeof c.radius === 'number' && c.radius >= node.radius) return false;
    if (c.w === undefined || c.h === undefined || node.w === undefined || node.h === undefined) return false;
    const x = c.x ?? 0, y = c.y ?? 0;
    return x <= 0 || y <= 0 || x + c.w >= node.w || y + c.h >= node.h;
  };
  const rounded = typeof node.radius === 'number' && node.radius > 0 && kids.some(paintsIntoCorner);
  if (node.clips === true && (overflows || rounded)) add('overflow', 'overflow', 'hidden', node.clips);

  // ---- size (A7) --------------------------------------------------------------
  /*
   * Every axis. FIXED is exact; HUG and FILL are within the pixel each
   * whole-pixel text box in series along that axis may add (sizeSlack). Declining
   * hug axes is how a 44-high button measured 68, in green. A VECTOR's box is
   * its path geometry, not a CSS box, so it is asserted on what holds it. A
   * rotated layer answers with the box the eye sees (`visual`). A layer the
   * mapping puts on the same element as a mapped ancestor (a label that is
   * the button's own text) has that ancestor's box: one element, one width.
   */
  if (node.type !== 'VECTOR' && !at.sharesBox) {
    const box = node.visual || node;
    /* A text box that fills its row and sets its words from the left draws
       them where a box hugging them would: a text layer paints no box of its
       own, so its filled width shows only through an alignment (asserted as
       text-align) or a sibling placed after it (asserted on that sibling).
       It is the one width with nothing to observe. */
    const unseen = node.type === 'TEXT' && hSizing === 'FILL' && (!node.textAlign || node.textAlign === 'LEFT' || node.textAlign === 'JUSTIFIED');
    if (!unseen) add(hSizing === 'FIXED' ? 'length' : 'hugLength', 'width', `${box.w}px`, node.sizing, hSizing === 'FIXED' ? undefined : { within: sizeSlack(node, 'w', ancestors) });
    add(vSizing === 'FIXED' ? 'length' : 'hugLength', 'height', `${box.h}px`, node.sizing, vSizing === 'FIXED' ? undefined : { within: sizeSlack(node, 'h', ancestors) });
  }
  // min/max are CSS properties of their own (A7: never `width == minWidth`).
  // A token that names the canvas a frame was drawn in (`parity.canvas`) is
  // the window the run sets, not a value the page carries.
  const canvas = (ctx.parity && ctx.parity.canvas) || [];
  for (const [key, prop] of [['minWidth', 'min-width'], ['minHeight', 'min-height'], ['maxWidth', 'max-width'], ['maxHeight', 'max-height']]) {
    if (typeof node[key] !== 'number') continue;
    const name = bound(node, key);
    if (name && canvas.some((c) => name.startsWith(c))) continue;
    put('length', prop, name ? V.length(name) : { value: `${node[key]}px` }, name || node[key], hint(prop, name, `${node[key]}px`));
  }

  // ---- radius (A9) --------------------------------------------------------------
  // Both sides are scaled down as CSS scales overlapping corners (Backgrounds
  // 3 §5.5), against the box the browser drew: 999px on a 44-high pill is 22.
  if (node.radius === 'mixed') out.push({ kind: 'unresolved', prop: 'border-radius', expected: null, from: 'a mixed corner radius, whose corners the snapshot does not record' });
  else if (node.radius !== undefined) {
    const name = bound(node, 'radius');
    const literal = Array.isArray(node.radius) ? node.radius.map((r) => `${r}px`).join(' ') : `${node.radius}px`;
    put('radius', 'border-radius', name ? V.length(name) : { value: literal }, name || node.radius, hint('border-radius', name, literal));
  }

  if (node.opacity !== undefined && node.opacity < 1) {
    const name = bound(node, 'opacity');
    put('ratio', 'opacity', name ? V.ratio(name) : { value: String(node.opacity) }, name || node.opacity, hint('opacity', name, node.opacity));
  }

  // ---- fills (A13, A14, A15) ----------------------------------------------------
  /*
   * Figma lists paints bottom up. The bottom one is what CSS calls the
   * background (or a text's colour, or a path's `fill` — a path has no
   * background, A14); an image above it is content. Any other stack is not
   * one colour CSS can be asked about, so it is said rather than guessed.
   * A colour style the snapshot does not hold is a broken reference.
   */
  const paintProp = node.type === 'TEXT' ? 'color' : node.type === 'VECTOR' ? 'fill' : 'background-color';
  /*
   * A linear gradient (A16). The colour at a point of the layer is the first
   * row of the paint's transform applied to the point in the layer's unit
   * square, so on a w×h box the gradient runs along (a/w, b/h): the CSS angle
   * and where each stop falls on CSS's corner-to-corner line follow from the
   * transform and the box the browser drew (schema.mjs `gradient`). The angle
   * of the handles alone fixes that only when it is axis-aligned: two 135°
   * gradients in one Figma file render at CSS 135° and 110.9° on their boxes.
   * A diagonal recorded without its transform is said, not guessed.
   */
  const gradient = (g, from) => {
    const stops = g.stops.map((st) => ({ r: V.colour(st.color), position: +(st.position * 100).toFixed(2) }));
    const missing = stops.find((s) => s.r.unresolved !== undefined);
    if (missing) return put('gradient', 'background-image', missing.r, from);
    const resolved = stops.map((s) => ({ colour: s.r.value, position: s.position }));
    if (Array.isArray(g.transform)) return add('gradient', 'background-image', { transform: g.transform, stops: resolved }, from);
    if (g.angle % 90 !== 0) return out.push({ kind: 'unresolved', prop: 'background-image', expected: null, from: `a ${g.angle}° gradient recorded without its transform, which alone fixes a diagonal's direction on this box: snapshot again with design-system-snapshot 0.48.0` });
    add('gradient', 'background-image', { angle: g.angle, stops: resolved }, from);
  };
  if (!runtime) {
    const style = node.fillStyle && (ctx.snapshot.paintStyles || []).find((p) => p.name === node.fillStyle);
    const paints = (node.fills || []).filter((p) => !(typeof p === 'string' && p.startsWith('IMAGE')));
    if (node.fillStyle && !style) out.push({ kind: 'unresolved', prop: paintProp, expected: null, from: `colour style ${node.fillStyle}` });
    else if (style && style.paints && style.paints.length === 1 && style.paints[0].type === 'GRADIENT_LINEAR') gradient(style.paints[0], node.fillStyle);
    else if (paints.length > 1 || (paints.length === 1 && node.fills[0] !== paints[0])) {
      out.push({ kind: 'unresolved', prop: paintProp, expected: null, from: `a stack of paints CSS has no one property for: ${JSON.stringify(node.fills)}` });
    } else if (paints.length === 1) {
      const p = paints[0];
      if (p && typeof p === 'object' && p.type === 'GRADIENT_LINEAR') gradient(p, 'gradient fill');
      else if (typeof p === 'string') put('colour', paintProp, V.colour(p), p, hint(paintProp, parseColour(p) ? null : p, p));
      else out.push({ kind: 'unresolved', prop: paintProp, expected: null, from: `a ${p && p.type} paint` });
    }
  }

  // ---- strokes (A1, A2, A3, A4) ---------------------------------------------------
  /*
   * `strokeSides` are per-side WEIGHTS (the plugin writes strokeTopWeight
   * and the rest), so a side's width is its bound token or its weight (A1).
   * Which CSS channel draws it follows Figma's own semantics:
   *   INSIDE, in layout     the stroke takes room from the box: a border, per
   *                         side, width and colour (A2, A3)
   *   INSIDE, not in layout drawn over the content, taking no room: a ring
   *                         (an outline offset inward, or an inset spread
   *                         shadow) when all four sides are one width, an
   *                         offset inset layer per side for an edge (A2)
   *   OUTSIDE               takes no room and paints outside the box: a ring
   *                         (outline or spread shadow) when all four sides
   *                         are one width, else an offset shadow per side;
   *                         a side flush with a clipping ancestor's edge is
   *                         cut off and not drawn at all (A4)
   *   CENTER                straddles the edge: a ring offset by half its
   *                         width (A4)
   * A line (a VECTOR with no extent on one axis) has no inside or outside: a
   * border on its leading edge. Any other VECTOR is a path: `stroke`.
   */
  const shadowLayers = [];
  let shadowUnresolved = null;
  const strokes = !runtime && Array.isArray(node.strokes) && node.strokes.length ? node.strokes : null;
  if (strokes) {
    const colour = V.colour(strokes[0]);
    const weights = Array.isArray(node.strokeSides) ? node.strokeSides : [1, 1, 1, 1];
    const width = (i) => {
      const name = bound(node, 'strokeWeight', i);
      return name ? V.length(name) : { value: `${weights[i] || node.strokeWeight || 1}px` };
    };
    const isLine = node.type === 'VECTOR' && (node.w === 0 || node.h === 0);
    const align = isLine ? 'INSIDE' : node.strokeAlign;
    if (node.type === 'VECTOR' && !isLine) {
      put('colour', 'stroke', colour, strokes[0]);
      put('strokeWidth', 'stroke-width', width(0), bound(node, 'strokeWeight', 0) || weights[0]);
    } else {
      let on = weights.map((w) => w > 0);
      if (isLine) on = node.h === 0 ? [true, false, false, false] : [false, false, false, true];
      if (align === 'OUTSIDE' && ancestors.length) {
        // cut off at a clipping ancestor's edge, whichever generation it is
        let x = node.x || 0, y = node.y || 0;
        for (let k = ancestors.length - 1; k >= 0; k--) {
          const a = ancestors[k];
          if (a.clips === true && typeof a.w === 'number' && typeof a.h === 'number') {
            const flush = [y <= 0.5, x + node.w >= a.w - 0.5, y + node.h >= a.h - 0.5, x <= 0.5];
            on = on.map((drawn, i) => {
              if (drawn && flush[i]) { add('strokeWidth', `border-${SIDES[i]}-width`, '0px', 'an OUTSIDE stroke past the edge of a frame that clips is not drawn'); return false; }
              return drawn;
            });
          }
          x += a.x || 0; y += a.y || 0;
        }
      }
      const widths = on.map((d, i) => (d ? width(i) : { value: '0px' }));
      const bad = [colour, ...widths].find((r) => r.unresolved !== undefined);
      const w = widths.map((r) => r.value);
      const ring = on.every(Boolean) && w.every((x) => x === w[0]);
      if (bad && (align !== 'INSIDE' || node.strokesInLayout === false)) shadowUnresolved = bad;
      else if (align === 'INSIDE' && node.strokesInLayout !== false) {
        on.forEach((drawn, i) => {
          if (!drawn) { add('strokeWidth', `border-${SIDES[i]}-width`, '0px', 'no stroke on this side'); return; }
          put('strokeWidth', `border-${SIDES[i]}-width`, widths[i], bound(node, 'strokeWeight', i) || weights[i]);
          put('colour', `border-${SIDES[i]}-color`, colour, strokes[0]);
        });
      } else if (align === 'INSIDE') {
        /* A ring drawn over the content: Figma paints a frame's stroke above
           its children, so an outline offset inward by its width is the same
           ring as an inset spread shadow (which paints under an image child)
           and the ring is asserted as drawn, either way (`-inner-ring-*`,
           read apart from a focus ring outside the same element). Where an effect
           style shares box-shadow, the ring stays one of its layers. */
        if (ring && !(node.effect && !runtime)) {
          put('innerRingWidth', '-inner-ring-width', widths[0], bound(node, 'strokeWeight', 0) || weights[0]);
          put('colour', '-inner-ring-color', colour, strokes[0]);
        } else if (ring) shadowLayers.push(`inset 0px 0px 0px ${w[0]} ${colour.value}`);
        else {
          const into = [[0, 1], [-1, 0], [0, -1], [1, 0]];   // top, right, bottom, left
          on.forEach((drawn, i) => { if (drawn) { const n = parseFloat(w[i]); shadowLayers.push(`inset ${into[i][0] * n}px ${into[i][1] * n}px 0px 0px ${colour.value}`); } });
        }
      } else if (align === 'OUTSIDE' && ring && node.effect && !runtime) {
        /* Beside an effect style the ring is one of box-shadow's layers, as an
           INSIDE ring is: asserting an outline here held the code to one
           spelling of two that paint the same (item 40 of the 2026-10-02
           review). A CENTER ring straddles the edge, which a spread alone
           cannot draw, so it stays an outline. */
        shadowLayers.push(`0px 0px 0px ${w[0]} ${colour.value}`);
      } else if ((align === 'OUTSIDE' || align === 'CENTER') && ring) {
        put('ringWidth', '-ring-width', widths[0], bound(node, 'strokeWeight', 0) || weights[0]);
        add('length', '-ring-offset', align === 'CENTER' ? `${-parseFloat(w[0]) / 2}px` : '0px', `an ${align} stroke`);
        put('colour', '-ring-color', colour, strokes[0]);
      } else if (align === 'OUTSIDE') {
        const away = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        on.forEach((drawn, i) => { if (drawn) { const n = parseFloat(w[i]); shadowLayers.push(`${away[i][0] * n}px ${away[i][1] * n}px 0px 0px ${colour.value}`); } });
      } else if (on.some(Boolean)) {
        out.push({ kind: 'unresolved', prop: 'box-shadow', expected: null, from: `a ${align} stroke on some sides only, which no CSS property draws` });
      }
    }
  }

  // ---- effects (A19) ------------------------------------------------------------------
  /*
   * An effect style → box-shadow, the exact list in CSS paint order: CSS
   * paints its first shadow on top, Figma lists the bottom layer first. A
   * bound colour resolves in the tier being measured; the snapshot keeps an
   * effect style's colours in the default mode only. Blur layers are not
   * box-shadow. An unbound effect ('literal') has kinds recorded and no
   * values, so it cannot be stated.
   */
  const effect = node.effect && !runtime ? node.effect : null;
  if (effect) {
    const style = (ctx.snapshot.effects || []).find((e) => e.name === effect);
    if (!style) shadowUnresolved = shadowUnresolved || { unresolved: effect === 'literal' ? 'an unbound effect, whose values the snapshot does not record' : `effect style ${effect}` };
    else {
      // a blur is a filter, not a shadow: said, not dropped
      for (const l of style.layers.filter((x) => !/SHADOW/.test(x.type))) out.push({ kind: 'unresolved', prop: l.type === 'BACKGROUND_BLUR' ? 'backdrop-filter' : 'filter', expected: null, from: `a ${l.type} in effect style ${effect}, which no rule translates` });
      for (const l of style.layers.filter((x) => /SHADOW/.test(x.type)).reverse()) {
        const c = l.bound && l.bound.color ? V.colour(l.bound.color.name) : V.colour(l.color);
        if (c.unresolved !== undefined) { shadowUnresolved = shadowUnresolved || c; continue; }
        shadowLayers.push(`${l.type === 'INNER_SHADOW' ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${c.value}`);
      }
    }
  }
  // One property, one assertion: a stroke drawn as shadow and an effect
  // style share box-shadow, strokes first (they sit on the box's edge).
  if (shadowUnresolved) put('shadow', 'box-shadow', shadowUnresolved);
  else if (shadowLayers.length) add('shadow', 'box-shadow', shadowLayers.join(', '), effect || 'a stroke drawn as a shadow');

  /*
   * An absence (A20). A layer a sibling variant draws an effect or a stroke
   * on, drawn here with neither, owes an explicit none: a modal's header lost
   * its hairline in the library and the code kept drawing one, green,
   * because nothing asserts what a spec no longer carries. A variant held in
   * a pseudo-state is excused: its focus ring may land on the element as a
   * shadow or a ring, which the ring's own assertions judge.
   */
  const carried = ctx.carried || {};
  if (!runtime && !ctx.state && !effect && !strokes && carried.effect && carried.effect.has(layer)) add('shadow', 'box-shadow', 'none', 'a sibling variant draws an effect here');
  if (!runtime && !ctx.state && !strokes && carried.stroke && carried.stroke.has(layer)) add('text', '-stroke', 'none', 'a sibling variant draws a stroke here');

  // ---- text -----------------------------------------------------------------------------
  /*
   * The text style: family, size, weight, line height, letter spacing, each
   * resolved through the variable the style binds where it binds one — in
   * the type tier's mode, for a type scale that changes with the window —
   * else the style's own value. A layer may state its own line height.
   */
  // A layer of several styles ('mixed') or none ('literal') has no one style
  // the snapshot records: said, not skipped.
  if (node.textStyle === 'mixed' || node.textStyle === 'literal') out.push({ kind: 'unresolved', prop: 'font-family', expected: null, from: `a ${node.textStyle} text style, which the snapshot records no values for` });
  else if (node.textStyle) {
    const style = (ctx.snapshot.textStyles || []).find((s) => s.name === node.textStyle);
    if (!style) out.push({ kind: 'unresolved', prop: 'font-family', expected: null, from: `text style ${node.textStyle}` });
    else {
      const via = (key, fallback) => {
        const b = style.bound && style.bound[key];
        if (!b) return { value: fallback };
        const v = V.raw(b.name, V.typeTier);
        return v === undefined ? { unresolved: b.name } : { value: v };
      };
      const family = via('fontFamily', style.family);
      const size = via('fontSize', style.size);
      const weightRaw = via('fontWeight', style.weight);
      const weight = weightRaw.unresolved !== undefined ? weightRaw
        : typeof weightRaw.value === 'number' ? { value: String(weightRaw.value) }
          : figmaWeight(weightRaw.value) ? { value: String(figmaWeight(weightRaw.value)) } : { unresolved: `font weight ${weightRaw.value}` };
      const sty = { hint: 'the text style, not a value: set font to the token this layer names' };
      put('family', 'font-family', family, node.textStyle);
      put('fontSize', 'font-size', size.unresolved !== undefined ? size : { value: `${size.value}px` }, node.textStyle, sty);
      put('text', 'font-weight', weight, node.textStyle, sty);
      if (size.unresolved === undefined) {
        // Chrome reports a resolved line height in px, and `normal` when the
        // font decides it, which is not a number the design ever stated.
        const lh = lineHeightOf(node.lineHeight, style.lineHeight);
        if (typeof lh === 'number') add('length', 'line-height', `${+(size.value * lh).toFixed(4)}px`, node.lineHeight || style.name, sty);
        else if (lh && lh.px) add('length', 'line-height', `${lh.px}px`, node.lineHeight, sty);
      }
      /* A layer's own letter spacing, else the style's; 0 is the browser's
         `normal`, not `0px`, so it says nothing. The plugin records a style's
         as a ratio of its font size (em), and a layer's as px or `<n>%` of
         its size, so both are multiplied out by the resolved size: -2% on a
         48px heading is -0.96px, which Chrome computes, not -0.02px (item 9
         of the 2026-10-02 review). */
      if (size.unresolved === undefined) {
        const raw = node.letterSpacing;
        const pct = raw !== undefined && /%$/.test(String(raw));
        const own = raw === undefined ? undefined : pct ? (parseFloat(raw) / 100) * size.value : +String(raw).replace(/px$/, '');
        const ls = own !== undefined ? own : (style.letterSpacing || 0) * size.value;
        if (ls) add('length', 'letter-spacing', `${+ls.toFixed(4)}px`, own !== undefined ? 'the layer' : node.textStyle);
      }
    }
  }
  // Text hugging its own width has no room to align in (A17): Figma records
  // LEFT on every such run.
  const TEXT_ALIGN = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };
  if (TEXT_ALIGN[node.textAlign] && hSizing !== 'HUG') add('textAlign', 'text-align', TEXT_ALIGN[node.textAlign], node.textAlign, { hint: `text-align: ${TEXT_ALIGN[node.textAlign]}` });
  // In a box taller than its words, where they sit is a choice.
  if (node.textAlignVertical && vSizing === 'FIXED') add('alignment', 'align-items', { CENTER: 'center', BOTTOM: 'flex-end' }[node.textAlignVertical] || 'flex-start', node.textAlignVertical, { axis: 'v' });
  // A line limit and an ellipsis are what a design says when a box must hold
  // its words; the browser says it with line-clamp or text-overflow.
  if (node.maxLines) add('text', '-max-lines', String(node.maxLines), 'maxLines');
  if (node.truncate) add('text', '-truncate', 'ellipsis', 'truncate');
  // Text the box cuts is a defect, unless the design cuts it on purpose (A22).
  if (node.type === 'TEXT' && !node.truncate && !node.maxLines) add('text', '-clipped', 'no', 'text fits its box');
  // small caps are a variant of the face, not a transform: `text-transform:
  // small-caps` is not CSS, and the browser drops it
  const CAPS = { SMALL_CAPS: 'small-caps', SMALL_CAPS_FORCED: 'all-small-caps' };
  if (CAPS[node.textCase]) add('text', 'font-variant-caps', CAPS[node.textCase], node.textCase, { hint: `font-variant-caps: ${CAPS[node.textCase]}` });
  else if (node.textCase) {
    const v = { UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize' }[node.textCase] || node.textCase.toLowerCase();
    add('text', 'text-transform', v, node.textCase, { hint: `text-transform: ${v}` });
  }
  if (node.textDecoration) {
    const v = { UNDERLINE: 'underline', STRIKETHROUGH: 'line-through' }[node.textDecoration] || node.textDecoration.toLowerCase();
    add('text', 'text-decoration-line', v, node.textDecoration, { hint: `text-decoration: ${v}` });
  }
  /* Figma's blend modes are CSS's by name, but two: LINEAR_DODGE is
     `plus-lighter`, and LINEAR_BURN has no mix-blend-mode at all
     (`linear-burn` is not CSS, so the browser drops it and reports normal). */
  if (node.blendMode === 'LINEAR_BURN') out.push({ kind: 'unresolved', prop: 'mix-blend-mode', expected: null, from: 'LINEAR_BURN, which CSS has no mix-blend-mode for' });
  else if (node.blendMode) add('text', 'mix-blend-mode', node.blendMode === 'LINEAR_DODGE' ? 'plus-lighter' : node.blendMode.toLowerCase().replace(/_/g, '-'), node.blendMode);
  // dashed on the edge the stroke draws, the first side with a weight
  if (node.dashed) {
    const side = SIDES[Math.max(0, (Array.isArray(node.strokeSides) ? node.strokeSides : [1]).findIndex((w) => w > 0))];
    add('text', `border-${side}-style`, 'dashed', 'dashed', { hint: 'border-style: dashed' });
  }
  if (node.type === 'TEXT' && (ctx.copy || []).includes(layer)) add('text', '-text', node.text, 'the copy the design decides');

  // ---- where it sits, and how it turns ------------------------------------------------
  /*
   * Against the nearest mapped ancestor that measures, on the axis that
   * ancestor's layout leaves free: a column positions its children down the
   * page by their heights, so x is the alignment and y the layout's own
   * arithmetic. The chain lists every mapped ancestor, nearest first, with
   * the offsets of the unmapped layers between already summed in.
   */
  if (ctx.parity && ctx.parity.position && node.x !== undefined && layer !== '$root') {
    const box = node.visual || node;
    const chain = [];
    let acc = { x: 0, y: 0 };
    for (let k = ancestors.length - 1; k >= 0; k--) {
      const p = ancestors[k];
      const name = ctx.pathOf.get(p);
      if (name !== undefined) chain.push({ layer: name, off: { ...acc }, layout: p.layout });
      const pb = p.visual || p;
      acc = { x: acc.x + (pb.x || 0), y: acc.y + (pb.y || 0) };
    }
    if (chain.length) {
      add('position', '-x', box.x, 'x', { chain, absolute: !!node.absolute });
      add('position', '-y', box.y, 'y', { chain, absolute: !!node.absolute });
    }
  }
  if (node.rotation !== undefined || node.fillRotation !== undefined) {
    add('rotation', 'rotate', (node.rotation || 0) + (node.fillRotation || 0), 'rotation and the image fill\'s own turn');
  }

  // ---- what an instance says ----------------------------------------------------------
  /*
   * An instance's variant props, where the project asserts them
   * (`parity.props`): a swap is which glyph, a True/False axis an attribute
   * both ways, a boolean that is off an attribute that must be absent (a
   * true one only shows a layer, measured as content), any other value the
   * attribute's value. Text props are content; `skip` names the axes the
   * control answers some other way (a pseudo-class, a media query).
   */
  const P = ctx.parity && ctx.parity.props;
  if (P && node.type === 'INSTANCE' && node.props && !runtime) {
    for (const [key, value] of Object.entries(node.props)) {
      if (propType(node, key) === 'INSTANCE_SWAP' && typeof value === 'string') {
        /* whether the design draws the glyph at all (a boolean can hide it):
           only a swap it does not draw is left unjudged when the page has
           none, where every missing glyph was (review 2026-10-02 round 3, S7) */
        const glyph = kebab(value);
        const drawn = (function has(n) { return (n.children || []).some((c) => (c.type === 'INSTANCE' && c.instanceOf && kebab(nameOf(c.instanceOf, (x) => kebab(x) === glyph)) === glyph) || has(c)); })(node);
        if (P.swap) add('swap', `-swap:${kebab(key)}`, glyph, key, { tag: P.swap, drawn });
        continue;
      }
      if (propType(node, key) === 'TEXT' || (P.skip || []).includes(key)) continue;
      const attr = (P.rename || {})[key] || kebab(key);
      if (typeof value === 'boolean') { if (!value) add('attr', `-attr:${attr}`, { mode: 'off-only', want: 'unset' }, key); }
      else if (value === 'True' || value === 'False') add('attr', `-attr:${attr}`, { mode: 'flag', want: value === 'True' ? 'set' : 'unset' }, key);
      else if (typeof value === 'string') add('attr', `-attr:${attr}`, { mode: 'value', want: value.toLowerCase() }, key);
    }
  }
  /*
   * The library instances a layer holds, outermost only and in order, with
   * the label the design gives each ("Label" is Figma's placeholder and
   * constrains nothing). An instance inside another mapped layer is that
   * layer's to report.
   */
  if (ctx.children === true || (Array.isArray(ctx.children) && ctx.children.includes(layer))) {
    /* The words an instance's label prop gives it, where the project names
       that prop and its placeholder (`parity.props.label`: one library calls
       it "Label text" and leaves "Label" as Figma's stand-in, which
       constrains nothing); a project that names none asserts no labels. The
       name was the engine's until 2 Oct (item 24 of that day's review). */
    const L = (ctx.parity && ctx.parity.props && ctx.parity.props.label) || null;
    const labelOf = (n) => { const v = L && n.props && n.props[L.prop]; return v && v !== L.placeholder ? v : ''; };
    const library = new Set(((ctx.snapshot._meta || {}).components || []).map(slug));
    const others = new Set([...ctx.mappedNodes].filter((n) => n !== node));
    const want = [];
    const visit = (n) => {
      const of = n.type === 'INSTANCE' && n.instanceOf ? slug(nameOf(n.instanceOf, (x) => library.has(slug(x)))) : null;
      if (others.has(n) && !(of && library.has(of))) return;
      if (of && library.has(of)) { want.push({ tag: of, label: labelOf(n) }); return; }
      (n.children || []).forEach(visit);
    };
    (node.children || []).forEach(visit);
    if (want.length) add('children', '-children', want, 'the library instances this layer holds', { library: [...library] });
  }
  return out;
}

/*
 * A focus ring. Figma draws it as a rectangle around the thing it rings; CSS
 * as that thing's outline or a spread shadow, so it is asserted as the ring
 * the probe reads (`-ring-*`) on the element the mapping names. The offset is
 * where the stroke starts outside the ringed box (its parent): the overhang on
 * each side, less the stroke where Figma draws it INSIDE the rectangle, less
 * half of it for CENTER (A21). The width is the side's weight or its token (A1).
 */
function ringAssertions({ node, parent }, ctx) {
  const V = ctx.values;
  const name = bound(node, 'strokeWeight', 0);
  const width = name ? V.length(name) : { value: `${(node.strokeSides || [])[0] || node.strokeWeight || 1}px` };
  const colour = V.colour((node.strokes || [])[0]);
  const out = [];
  const put = (kind, prop, r, from) => out.push(r.unresolved !== undefined ? { kind: 'unresolved', prop, expected: null, from: r.unresolved } : { kind, prop, expected: r.value, from });
  put('ringWidth', '-ring-width', width, name || 'strokeSides');
  if (width.unresolved === undefined) {
    const over = (node.w - parent.w) / 2, w = parseFloat(width.value);
    const offset = node.strokeAlign === 'OUTSIDE' ? over : node.strokeAlign === 'CENTER' ? over - w / 2 : over - w;
    out.push({ kind: 'length', prop: '-ring-offset', expected: `${offset}px`, from: `a ${node.strokeAlign} stroke on a ${node.w}-wide ring around ${parent.w}` });
  }
  put('colour', '-ring-color', colour, (node.strokes || [])[0]);
  // The ring's outer corners, as the ring layer draws them: the box under it
  // takes this radius less how far the ring reaches past it, and writing the
  // layer's radius on the box rounded one project's rings 4px too much.
  if (typeof node.radius === 'number')
    out.push({ kind: 'length', prop: '-ring-radius', expected: `${Math.min(node.radius, Math.min(node.w, node.h) / 2)}px`, from: `the ring layer's corner radius ${node.radius} on a ${node.w}×${node.h} ring` });
  return out;
}

/** Walk a mapping of exact layer path → selector into expectation documents. */
export function adapt(tree, mapping, ctx) {
  PROP_TYPES = ctx.propTypes || null;
  const index = layerIndex(tree);
  const layers = { ...(mapping.layers || {}) };
  if (mapping.root !== undefined && !('$root' in layers)) layers.$root = mapping.root;
  const pathOf = new Map();
  for (const path of Object.keys(layers)) { const e = index.get(path); if (e) pathOf.set(e.node, path); }
  const measured = new Set([...pathOf].filter(([, p]) => layers[p]).map(([n]) => n));
  const full = { ...ctx, values: resolver(ctx.snapshot, ctx.tier, ctx.typeTier), pathOf, mappedNodes: measured };
  const docs = [];
  for (const [layer, selector] of Object.entries(layers)) {
    const found = index.get(layer);
    // A layer this variant does not draw: `absent`, and still measured, so a
    // code that draws it anyway is reported (A18). A mapping naming a layer
    // no variant draws is the stale-mapping gate's, not this.
    // An element another mapped layer is drawn as — a focus ring drawn as the
    // control's outline — is there either way, so it cannot tell an absence;
    // nor can a layer inside an instance whose insides the snapshot did not
    // record, which is unknown rather than absent.
    if (!found) {
      const shared = selector && Object.entries(layers).some(([p, sel]) => p !== layer && sel === selector && index.get(p));
      const parts = layer.split(' > ');
      let holder = null;
      for (let k = parts.length - 1; k > 0 && !holder; k--) holder = (index.get(parts.slice(0, k).join(' > ')) || {}).node || null;
      const unrecorded = holder && holder.type === 'INSTANCE' && !(holder.children || []).length;
      docs.push({ layer, selector: shared || unrecorded ? null : selector || null, status: 'absent', assertions: [] });
      continue;
    }
    // Mapped to null on purpose: it exists, and no element answers for it.
    if (selector === null) { docs.push({ layer, selector: null, status: 'structural', assertions: [] }); continue; }
    // the nearest mapped ancestor that has an element: the same one is one box
    const owner = [...found.ancestors].reverse().map((n) => pathOf.get(n)).find((p) => p !== undefined && layers[p]);
    const at = { ...found, layer, sharesBox: owner !== undefined && layers[owner] === selector };
    // the layer Figma draws a focus ring as, by the project's name for it
    // (`parity.variants.focusRing`, the same name gates.mjs maps it by)
    const ringName = ((ctx.parity || {}).variants || {}).focusRing;
    const ring = ringName && layer !== '$root' && new RegExp(`^${ringName}$`, 'i').test(layer.split(' > ').pop().replace(/#\d+$/, '')) && found.parent;
    docs.push({ layer, selector, status: 'measure', assertions: ring ? ringAssertions(at, full) : assertionsFor(at, full) });
  }
  // A focused component draws as many outlines as Figma draws rings, at most:
  // a placed part ringing itself beside its holder is a second ring, and its
  // insides are left to its own audit, where it is never focused inside a holder
  const root = docs.find((d) => d.layer === '$root' && d.status === 'measure');
  if (root && /focus/i.test(ctx.state || '')) {
    const rings = docs.filter((d) => d.assertions.some((a) => a.kind === 'ringWidth' && parseFloat(a.expected) > 0));
    const colours = [...new Set(rings.flatMap((d) => d.assertions.filter((a) => a.prop === '-ring-color' && a.kind === 'colour').map((a) => a.expected)))];
    const count = new Set(rings.map((d) => d.selector)).size;
    if (colours.length) root.assertions.push({ kind: 'rings', prop: '-rings', expected: { count, colours }, from: `the ${count} ring(s) this focus variant draws (code-standard 66)` });
  }
  return docs;
}

/*
 * What the probe must read for these documents: per layer, its selector and
 * the props its assertions name (or a kind reads instead), and whether any
 * kind reads the probe's fixed record (`core`). A layer this variant does not
 * draw is asked whether it renders a box, which is how its presence is told.
 */
export function plan(docs) {
  const layers = {};
  let core = false;
  for (const d of docs) {
    if (!d.selector) continue;
    const props = new Set(d.status === 'absent' ? ['-rendered'] : []);
    for (const a of d.assertions) {
      const k = KINDS[a.kind] || {};
      if (k.core) core = true;
      for (const p of k.reads || [a.prop]) props.add(p);
    }
    layers[d.layer] = { selector: d.selector, props: [...props] };
  }
  return { layers, core };
}

/*
 * Every key a spec node can carry, and what consumes it: the rule above, or a
 * reason from the closed list (spec-keys.mjs REASONS). Gate 10 holds every
 * project's corpus to it (`checkContract`): a key a new plugin release
 * records fails until someone decides which it is.
 */
const rule = (r) => ({ rule: r });
const why = (because, note) => ({ why: { because, note } });
export const SPEC_KEYS = {
  name: why('identity', 'the name the mapping addresses this layer by'),
  type: why('identity', 'which kind of node the designer drew; decides the property a fill lands on'),
  w: rule('width (every axis: exact when FIXED, within a pixel per text box in series otherwise)'),
  h: rule('height, as w'),
  x: rule('-x against the nearest measured ancestor (parity.position); and an OUTSIDE stroke flush with a clipping edge'),
  y: rule('-y, as x'),
  visual: rule('the box the eye sees of a rotated layer: size and position'),
  rotation: rule('rotate, with the image fill\'s own turn'),
  fillRotation: rule('rotate, with the layer\'s'),
  pad: rule('padding-* per side'),
  gap: rule('column-gap in a row, row-gap in a column, between two in-flow children'),
  crossGap: rule('row-gap in a wrapping row, column-gap in a wrapping column: the space between its lines'),
  layout: rule('-stacking, and which axis a gap and a position are on'),
  align: rule('justify-content and align-items where there is free space; SPACE_BETWEEN suppresses the gap'),
  wrap: rule('flex-wrap, where the children do not fit on one line'),
  sizing: rule('which axes are exact and which within slack'),
  clips: rule('overflow, where a child leaves the frame or paints into its rounded corner'),
  fills: rule('background-color, color on text, fill on a path; a gradient is background-image'),
  fillStyle: rule('a colour style: its gradient where it is one, a finding where the snapshot lacks it'),
  stops: rule('a gradient\'s stops, in order'),
  color: rule('a gradient stop\'s colour, resolved per tier'),
  position: rule('a gradient stop\'s place along the gradient'),
  angle: rule('a gradient\'s angle, where it is axis-aligned and no transform is recorded'),
  transform: rule('a gradient\'s direction and stop positions on the box it fills'),
  strokes: rule('border-*-color, the inset or outer shadow, the ring, or a path\'s stroke'),
  strokeAlign: rule('which CSS channel draws a stroke: border, inset shadow, ring or outer shadow'),
  strokesInLayout: rule('an INSIDE stroke that takes room (a border) or is drawn over the content (an inset shadow)'),
  strokeSides: rule('per-side stroke weights: which sides draw, and how wide'),
  radius: rule('border-radius, scaled as CSS scales overlapping corners'),
  minWidth: rule('min-width'),
  minHeight: rule('min-height'),
  maxWidth: rule('max-width'),
  maxHeight: rule('max-height'),
  opacity: rule('opacity'),
  effect: rule('box-shadow from the effect style, in CSS paint order'),
  effects: why('carried', 'the kinds of layer behind `effect`, whose style layers the effect rule compares'),
  textStyle: rule('font-family, font-size, font-weight, line-height and letter-spacing'),
  textAlign: rule('text-align, where the box is wider than its words'),
  textAlignVertical: rule('align-items in a fixed-height text box'),
  lineHeight: rule('line-height: the layer\'s own, over the style\'s'),
  letterSpacing: rule('letter-spacing: the layer\'s own, over the style\'s'),
  textCase: rule('text-transform, or font-variant-caps for small caps'),
  textDecoration: rule('text-decoration-line'),
  truncate: rule('-truncate, and exempts the text from -clipped'),
  maxLines: rule('-max-lines, and exempts the text from -clipped'),
  blendMode: rule('mix-blend-mode'),
  dashed: rule('border-*-style on the first side the stroke draws'),
  text: rule('-text, where the mapping lists the layer\'s copy as the design\'s'),
  props: rule('-attr:* and -swap:* where the project asserts instance props (parity.props)'),
  instanceOf: rule('-children: which library component an instance places'),
  children: rule('recursed; and -children'),
  bindings: rule('every rule above prefers the token name here over the literal'),
  absolute: rule('out of the flow: no part of a direction, a gap or an alignment; positioned on both axes'),
  hidden: rule('out of the flow, as absolute'),
  overrides: why('carried', 'names which fields an instance overrode; the overridden values themselves are compared'),
  instanceOfKey: why('identity', 'the published key of the component an instance places'),
  instanceOfId: why('identity', 'the node id of the component an instance places'),
  textAutoResize: why('carried', 'how a text box grows; sizing says the same per axis, and the size rule reads that'),
  smoothing: why('unobservable', 'Figma corner smoothing; CSS draws a circular corner and has no property for it'),
  paragraphSpacing: why('carried', 'carried on the text style\'s token and applied by the stylesheet to p + p; the block\'s height absorbs it'),
  listSpacing: why('carried', 'carried on the text style\'s token and applied to li + li, as paragraphSpacing is'),
  notes: why('carried', 'a designer\'s Dev Mode annotations (snapshot-standard rule 25): behaviour to build, listed by the store, never measured'),
  category: why('carried', 'a note\'s category (Development, Interaction, Accessibility, Content), inside notes'),
  // recorded since snapshot 0.62.0 for the component contract (148df440); parity reads none of them yet
  arc: why('carried', 'an ellipse drawn as an arc (a spinner\'s track): its start, end and inner radius, for the component contract; the arc\'s box is measured by w and h'),
  start: why('carried', 'an arc\'s starting angle, inside arc'),
  end: why('carried', 'an arc\'s ending angle, inside arc'),
  inner: why('carried', 'an arc\'s inner radius, inside arc'),
  constraints: why('carried', 'how an absolutely placed layer resizes with its parent, for the component contract; where it lands is measured by x and y'),
  firstOnTop: why('carried', 'which way an auto-layout stacks its overlapping children, for the component contract; paint order is not a measured property'),
};

/*
 * Gate 10's other half: a rule that is declared is a rule that runs. For
 * every key the corpus carries and SPEC_KEYS gives a rule, some layer that
 * carries it must assert something different without it — asked with every
 * capability on (every layer mapped, positions, instance props, children,
 * copy), because the question is whether the adapter reads the key, not
 * whether one project turns the rule on. A declaration is prose and agrees
 * with whatever it sits beside; this asks the code. `absolute` and `hidden`
 * are read by the parent's flow rules, so a layer's own assertions cannot
 * show them. Returns one line per declared rule nothing reads.
 */
export function unreadRules(trees, snapshot) {
  const THROUGH_PARENT = new Set(['absolute', 'hidden', 'instanceOf']);
  const carriers = new Map();
  const contexts = [];
  for (const tree of trees) {
    const index = layerIndex(tree);
    const pathOf = new Map([...index].map(([p, e]) => [e.node, p]));
    const ctx = { snapshot, parity: { position: true, props: { swap: 'glyph' } }, children: true, pathOf, mappedNodes: new Set(pathOf.keys()), values: resolver(snapshot) };
    contexts.push(ctx);
    for (const [layer, e] of index) for (const k of Object.keys(e.node)) {
      if (!carriers.has(k)) carriers.set(k, []);
      carriers.get(k).push({ at: { ...e, layer }, ctx });
    }
  }
  const show = (at, ctx) => JSON.stringify(assertionsFor(at, { ...ctx, copy: [at.layer] }));
  const unread = [];
  for (const [key, d] of Object.entries(SPEC_KEYS)) {
    if (!d.rule || THROUGH_PARENT.has(key) || !carriers.has(key)) continue;
    const nodes = carriers.get(key);
    const read = nodes.some(({ at, ctx }) => {
      const { [key]: _dropped, ...without } = at.node;
      return show(at, ctx) !== show({ ...at, node: without }, ctx);
    });
    if (!read) unread.push(`${key} — "${d.rule}" — removing it from any of the ${nodes.length} layers that carry it changes nothing`);
  }
  return unread;
}
