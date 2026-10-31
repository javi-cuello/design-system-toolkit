#!/usr/bin/env node
// node tools/parity/test-adapt.mjs — from the toolkit root.
//
// Every translation rule, pinned: a minimal Figma tree in, the expectations
// out. Each fixture names the old behaviour it rules out where one of the two
// adapters this replaced did otherwise (engine-design A1–A22).
import assert from 'node:assert/strict';
import { adapt, plan, carriers, SLACK_CAP, SPEC_KEYS } from './adapt.mjs';
import { diff, BAD } from './diff.mjs';
import { KINDS } from './schema.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const SNAPSHOT = {
  collections: {
    c: { modes: ['Dark', 'Light'], values: {
      Dark: { 'Spacing/12': 12, 'Colour/Text/inverse': '#121212', 'Colour/Stroke/soft': 'rgb(22 22 22 / 0.116)', 'State/Loading/opacity': 0, 'Stroke/2': 2, 'Radius/full': 999, 'Viewport/height': 900 },
      Light: { 'Spacing/12': 12, 'Colour/Text/inverse': '#fdfdfd', 'Colour/Stroke/soft': 'rgb(22 22 22 / 0.116)', 'State/Loading/opacity': 0, 'Stroke/2': 2, 'Radius/full': 999, 'Viewport/height': 900 },
    } },
    type: { modes: ['Desktop', 'Mobile'], values: { Desktop: { 'Body/md/size': 16 }, Mobile: { 'Body/md/size': 14 } } },
  },
  textStyles: [
    { name: 'Label/md-medium', family: 'Inter', weight: 'Medium', size: 16, lineHeight: 1, letterSpacing: 0 },
    { name: 'Heading/lg', family: 'Inter Display', weight: 'SemiBold', size: 48, lineHeight: 1.15, letterSpacing: -0.02 },
    { name: 'Body/md', family: 'Inter', weight: 'Regular', size: 16, lineHeight: 1.5, letterSpacing: 0, bound: { fontSize: { name: 'Body/md/size' } } },
  ],
  effects: [
    { name: 'Button/primary', layers: [{ type: 'DROP_SHADOW', x: 0, y: 0, blur: 0, spread: 3, color: 'rgb(22 22 22 / 0.116)' }] },
    { name: 'Elevation/raised', layers: [
      { type: 'INNER_SHADOW', x: 0, y: 0, blur: 0, spread: 1, color: 'rgb(22 22 22 / 0.116)' },
      { type: 'DROP_SHADOW', x: 0, y: 2, blur: 8, spread: 0, color: 'rgb(22 22 22 / 0.03)', bound: { color: { name: 'Colour/Text/inverse' } } },
    ] },
  ],
  paintStyles: [{ name: 'Background/brand', paints: [{ type: 'GRADIENT_LINEAR', angle: 90, stops: [{ position: 0, color: 'Colour/Text/inverse' }, { position: 1, color: '#ffffff' }] }] }],
  _meta: { components: ['Button', 'Tag', 'Icon'] },
};
const CTX = { snapshot: SNAPSHOT, tier: 'Dark' };
const docs = (tree, layers, ctx = {}) => adapt(tree, { layers: { $root: '.root', ...layers } }, { ...CTX, ...ctx });
const doc = (tree, layer = '$root', layers = {}, ctx) => docs(tree, layers, ctx).find((d) => d.layer === layer);
// prop → expected for one layer (the last assertion for a prop wins)
const of = (node, ctx, layer, layers) => Object.fromEntries((doc(node, layer, layers, ctx) || { assertions: [] }).assertions.map((a) => [a.prop, a.kind === 'unresolved' ? `unresolved: ${a.from}` : a.expected]));
const kindOf = (node, prop, ctx) => (doc(node, '$root', {}, ctx).assertions.find((a) => a.prop === prop) || {}).kind;
const F = (o) => ({ name: 'F', type: 'FRAME', w: 1, h: 1, sizing: 'HUG/HUG', ...o });
const two = [{ name: 'A', type: 'FRAME', x: 0, y: 0, w: 4, h: 4, sizing: 'FIXED/FIXED' }, { name: 'B', type: 'FRAME', x: 6, y: 0, w: 4, h: 6, sizing: 'FIXED/FIXED' }];

// ---- text -----------------------------------------------------------------------
ok('a text style becomes family, size, weight and line height; 0 letter spacing says nothing', (() => {
  const g = of({ name: 'L', type: 'TEXT', w: 42, h: 16, sizing: 'HUG/HUG', textStyle: 'Label/md-medium' });
  return g['font-family'] === 'Inter' && g['font-size'] === '16px' && g['font-weight'] === '500' && g['line-height'] === '16px' && g['letter-spacing'] === undefined;
})());
// Review 2026-10-02 item 9: the plugin stores a style's letter spacing in em
// (a ratio of its size), and the adapter emitted it as px: -2% on a 48px
// heading expected -0.02px where Chrome computes -0.96px.
ok('a style\'s letter spacing is a ratio of its size, a layer\'s % is too, and a layer\'s px stays px; a fractional line height resolves',
  of({ name: 'H', type: 'TEXT', w: 100, h: 55, sizing: 'HUG/HUG', textStyle: 'Heading/lg' })['letter-spacing'] === '-0.96px'
  && of({ name: 'H', type: 'TEXT', w: 100, h: 55, sizing: 'HUG/HUG', textStyle: 'Heading/lg', letterSpacing: '5%' })['letter-spacing'] === '2.4px'
  && of({ name: 'H', type: 'TEXT', w: 100, h: 55, sizing: 'HUG/HUG', textStyle: 'Heading/lg', letterSpacing: 0.5 })['letter-spacing'] === '0.5px'
  && of({ name: 'H', type: 'TEXT', w: 100, h: 55, sizing: 'HUG/HUG', textStyle: 'Heading/lg' })['line-height'] === '55.2px');
// Project C's old adapter took the style's line height whatever the layer said
ok('a layer\'s own line height overrides the style\'s', of({ name: 'L', type: 'TEXT', w: 42, h: 16, sizing: 'HUG/HUG', textStyle: 'Label/md-medium', lineHeight: '150%' })['line-height'] === '24px');
ok('the type scale resolves in the type tier\'s mode, through the variable the style binds',
  of({ name: 'B', type: 'TEXT', w: 1, h: 1, sizing: 'HUG/HUG', textStyle: 'Body/md' }, { typeTier: 'mobile' })['font-size'] === '14px'
  && of({ name: 'B', type: 'TEXT', w: 1, h: 1, sizing: 'HUG/HUG', textStyle: 'Body/md' }, { typeTier: 'desktop' })['line-height'] === '24px');
ok('a text style the snapshot does not hold is a finding, not a skipped layer',
  of({ name: 'L', type: 'TEXT', w: 42, h: 16, sizing: 'HUG/HUG', textStyle: 'Label/gone' })['font-family'] === 'unresolved: text style Label/gone');
// Project C's old adapter asserted LEFT/CENTER only on FILL text (A17)
ok('text align needs room: a FIXED or FILL box aligns, a hugging one does not',
  of({ name: 'T', type: 'TEXT', w: 10, h: 10, sizing: 'FIXED/HUG', textAlign: 'CENTER' })['text-align'] === 'center'
  && of({ name: 'T', type: 'TEXT', w: 10, h: 10, sizing: 'HUG/HUG', textAlign: 'LEFT' })['text-align'] === undefined);
// A22: one row each, and the design's own cut exempts it
ok('text owes a fits check unless the design cuts it',
  of({ name: 'T', type: 'TEXT', w: 10, h: 10, sizing: 'HUG/HUG' })['-clipped'] === 'no'
  && of({ name: 'T', type: 'TEXT', w: 10, h: 10, sizing: 'HUG/HUG', truncate: true })['-clipped'] === undefined
  && of({ name: 'T', type: 'TEXT', w: 10, h: 10, sizing: 'HUG/HUG', maxLines: 2 })['-max-lines'] === '2');

// ---- tokens (A12) -------------------------------------------------------------------
// both old adapters dropped a token they could not resolve, which read as agreement
ok('an unresolvable token is a finding, excused only by a waiver that names it', (() => {
  const d = doc(F({ fills: ['Colour/Nowhere'] }));
  const rows = diff([d], { $root: { 'background-color': 'rgb(0, 0, 0)' } });
  const waived = diff([d], { $root: {} }, { waivers: { '$root.background-color': 'the variable is renamed in the next release' } });
  const bg = (rs) => rs.find((r) => r.prop === 'background-color').kind;
  return bg(rows) === 'unresolved' && BAD.includes('unresolved') && bg(waived) === 'waived'
    && /^unresolved: a mixed/.test(of({ name: 'L', type: 'TEXT', w: 1, h: 1, sizing: 'HUG/HUG', textStyle: 'mixed' })['font-family']);
})());

// ---- fills (A13, A14, A15) ------------------------------------------------------------
ok('a fill is color on text, background-color on a frame, and the tier decides the value',
  of({ name: 'L', type: 'TEXT', w: 1, h: 1, sizing: 'HUG/HUG', fills: ['Colour/Text/inverse'] }).color === 'rgba(18, 18, 18, 1)'
  && of(F({ fills: ['Colour/Text/inverse'] }), { tier: 'Light' })['background-color'] === 'rgba(253, 253, 253, 1)');
// Project C's old adapter asserted background-color on a path (A14)
ok('a VECTOR has no CSS box and its paint is `fill`', (() => {
  const g = of({ name: 'Icon', type: 'VECTOR', w: 14, h: 14, sizing: 'FIXED/FIXED', fills: ['Colour/Text/inverse'] });
  return g.width === undefined && g.fill === 'rgba(18, 18, 18, 1)' && g['background-color'] === undefined;
})());
// Project C's old adapter skipped a literal (A13)
ok('a literal fill is still drawn, so it is still judged', of(F({ fills: ['#ff0000'] }))['background-color'] === 'rgba(255, 0, 0, 1)');
ok('an image above the bottom paint is content; another stack is said, not guessed (A15)',
  of(F({ fills: ['Colour/Text/inverse', 'IMAGE:FILL'] }))['background-color'] === 'rgba(18, 18, 18, 1)'
  && /^unresolved: a stack/.test(of(F({ fills: ['Colour/Text/inverse', '#ffffff'] }))['background-color']));
ok('a colour style is its gradient; one the snapshot lacks is a finding',
  of(F({ fillStyle: 'Background/brand', fills: [] }))['background-image'].angle === 90
  && /^unresolved: colour style/.test(of(F({ fillStyle: 'Background/gone' }))['background-color']));
// A16: Project C compared stops only; the first engine derived a diagonal's
// CSS angle from the handles' 135° and the box, as atan2(h·sin, w·cos). Figma's
// own frame export refutes it on Project C's Screens file: two gradients
// recorded at 135° render at CSS 110.9° (the header, 1728×660) and at CSS 135°
// (the newsletter block, 912×142) — every unoccluded sample within 5 of 765 in
// RGB under those angles, 29–74 off under the old formula. The direction is
// the transform's first row on the box; these transforms are the ones those
// two renders imply.
const grad = (transform, stops = [{ position: 0, color: '#ff0000' }, { position: 1, color: '#0000ff' }]) => of(F({ fills: [{ type: 'GRADIENT_LINEAR', angle: 135, ...(transform ? { transform } : {}), stops }] }))['background-image'];
const paints = (e, image, w, h) => KINDS.gradient.compare(e, { image, w, h }, {}, {});
const RB = (head, a = 0, b = 100) => `linear-gradient(${head}, rgb(255, 0, 0) ${a}%, rgb(0, 0, 255) ${b}%)`;
ok('a gradient\'s direction is its transform\'s on the box, as two real renders show', (() => {
  const [W, H] = [1728, 660], header = grad([[W * W / (W * W + H * H), H * H / (W * W + H * H), 0], [0, 1, 0]]);
  const [w, h] = [912, 142], block = grad([[w / (w + h), h / (w + h), 0], [0, 1, 0]]);
  return paints(header, RB('110.9deg'), W, H) && !paints(header, RB('135deg'), W, H) && !paints(header, RB('159.1deg'), W, H)
    && paints(block, RB('135deg'), w, h) && !paints(block, RB('to right bottom'), w, h) && !paints(block, RB('98.85deg'), w, h);
})());
ok('a corner keyword is resolved on the box, as CSS resolves it', (() => {
  const [w, h] = [1000, 100];
  const e = grad([[w * w / (w * w + h * h), h * h / (w * w + h * h), 0], [0, 1, 0]]);   // perpendicular on the box
  const corner = grad([[0.5, 0.5, 0], [0, 1, 0]]);                                        // perpendicular in the unit square
  return !paints(e, RB('to right bottom'), w, h) && paints(corner, RB('to right bottom'), w, h) && paints(corner, RB('to right bottom'), 100, 100) && paints(corner, RB('135deg'), 100, 100);
})());
ok('stops fall where the transform puts them on CSS\'s corner-to-corner line', (() => {
  const e = grad([[0.5, 0, 0.25], [0, 1, 0]], [{ position: 0.25, color: '#ff0000' }, { position: 0.75, color: '#0000ff' }]);
  return paints(e, RB('90deg', 0, 100), 400, 100) && !paints(e, RB('90deg', 25, 75), 400, 100);
})());
ok('without a transform an axis-aligned angle is judged and a diagonal is said, not guessed', (() => {
  const flat = of(F({ fills: [{ type: 'GRADIENT_LINEAR', angle: 90, stops: [{ position: 0, color: '#ff0000' }, { position: 1, color: '#0000ff' }] }] }))['background-image'];
  return paints(flat, RB('90deg'), 900, 100) && paints(flat, RB('to right'), 900, 100) && !paints(flat, RB('270deg'), 900, 100)
    && /^unresolved: a 135° gradient recorded without its transform/.test(grad(null));
})());

// ---- layout ---------------------------------------------------------------------------------
ok('padding is four properties, each preferring its bound token',
  of(F({ pad: [12, 4, 12, 4], bindings: { pad: ['Spacing/12', null, 'Spacing/12', null] } }))['padding-top'] === '12px'
  && of(F({ pad: [12, 4, 12, 4] }))['padding-right'] === '4px');
// A5: Project D's adapter asserted row-gap whatever the axis, with one child,
// and never a gap of 0; Project C's read column-gap unless it was unset
ok('a gap is the primary axis\'s, between two in-flow children, 0 included',
  of(F({ w: 40, h: 8, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'MIN/MIN', gap: 12, children: two }))['column-gap'] === '12px'
  && of(F({ w: 8, h: 40, sizing: 'FIXED/FIXED', layout: 'VERTICAL', align: 'MIN/MIN', gap: 0, children: two }))['row-gap'] === '0px'
  && of(F({ w: 8, h: 40, sizing: 'FIXED/FIXED', layout: 'VERTICAL', align: 'MIN/MIN', gap: 12, children: [two[0]] }))['row-gap'] === undefined
  && of(F({ w: 40, h: 40, sizing: 'FIXED/FIXED', layout: 'GRID', gap: 8, children: two }))['row-gap'] === undefined);
// A6: Project C asserted space-between with no space to distribute
// Review 2026-10-02 item 40: the leftover itemSpacing of a SPACE_BETWEEN frame
// was taken as space its children use, so 2px between two boxes read as none.
ok('SPACE_BETWEEN distributes where there is free space, and never gaps; its leftover spacing takes none', (() => {
  const roomy = of(F({ w: 40, h: 8, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'SPACE_BETWEEN/CENTER', gap: 16, children: two }));
  const leftover = of(F({ w: 10, h: 8, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'SPACE_BETWEEN/CENTER', gap: 16, children: two }));
  const flush = of(F({ w: 8, h: 8, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'SPACE_BETWEEN/CENTER', gap: 16, children: two }));
  return roomy['justify-content'] === 'space-between' && roomy['column-gap'] === undefined && leftover['justify-content'] === 'space-between' && flush['justify-content'] === undefined;
})());
ok('auto layout states a direction and an alignment on each axis', (() => {
  const col = of(F({ w: 1416, h: 109, sizing: 'FILL/FIXED', layout: 'VERTICAL', align: 'MIN/CENTER', children: two }));
  const row = of(F({ w: 40, h: 10, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'MAX/BASELINE', wrap: false, children: two }));
  return col['-stacking'] === 'column' && col['align-items'] === 'center' && row['justify-content'] === 'flex-end' && row['align-items'] === 'baseline';
})());
// the first engine asserted flex-wrap on every frame: 240 rows on children that
// fit on one line, where `wrap` and `nowrap` draw the same line
ok('wrapping is asserted only where the children do not fit on one line', (() => {
  const fits = of(F({ w: 40, h: 10, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', wrap: false, children: two }));
  const tight = of(F({ w: 8, h: 10, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', gap: 2, wrap: true, children: two }));
  return fits['flex-wrap'] === undefined && tight['flex-wrap'] === 'wrap';
})());
ok('SPACE_BETWEEN with one child is the start, as Figma and CSS both place it',
  of(F({ w: 200, h: 20, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'SPACE_BETWEEN/MIN', children: [two[0]] }))['justify-content'] === 'flex-start');
ok('alignment is asserted only where there is free space', (() => {
  const snug = of(F({ w: 16, h: 16, sizing: 'FIXED/FIXED', layout: 'VERTICAL', align: 'CENTER/CENTER', children: [{ name: 'T', type: 'VECTOR', x: 0, y: 0, w: 16, h: 16, sizing: 'FIXED/FIXED' }] }));
  const padded = of(F({ w: 200, h: 40, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'CENTER/CENTER', pad: [12, 68, 12, 68], children: [{ name: 'B', type: 'FRAME', x: 68, y: 12, w: 64, h: 16, sizing: 'FIXED/FIXED' }] }));
  return snug['justify-content'] === undefined && padded['align-items'] === undefined;
})());
ok('a clip is asserted only where a child leaves the frame',
  of(F({ w: 100, h: 20, sizing: 'FIXED/FIXED', clips: true, children: [{ name: 'L', type: 'TEXT', x: 0, y: 0, w: 80, h: 20, sizing: 'HUG/HUG' }] })).overflow === undefined
  && of(F({ w: 100, h: 20, sizing: 'FIXED/FIXED', clips: true, children: [{ name: 'L', type: 'TEXT', x: 0, y: 0, w: 140, h: 20, sizing: 'HUG/HUG' }] })).overflow === 'hidden');

// ---- size (A7, A8) ----------------------------------------------------------------------------
// Project C asserted no hug width and no text height
// The first engine counted every text run below a box on both axes, so a page
// hugging 200 runs had 200px of slack on its height. Figma sizes a hugging text
// box to a whole pixel (all 10,620 such widths and heights in two projects'
// snapshots are integers; fill widths are not), so the slack is a pixel per
// text box in series along the axis: summed along a row's width or a column's
// height, the biggest child's across it, none through a fixed size.
const T = (o) => ({ name: 'T', type: 'TEXT', w: 30, h: 16, sizing: 'HUG/HUG', ...o });
const within = (node, prop, layer = '$root', layers = {}) => (doc(node, layer, layers).assertions.find((a) => a.prop === prop) || {}).within;
ok('a FIXED axis is exact, and a hugging one is within a pixel per text box in series on that axis', (() => {
  const row = F({ w: 66, h: 16, layout: 'HORIZONTAL', children: [T(), T({ name: 'U' })] });
  const col = F({ w: 30, h: 32, layout: 'VERTICAL', children: [T(), T({ name: 'U' }), F({ name: 'Fixed', w: 30, h: 40, sizing: 'FIXED/FIXED', children: [T({ name: 'In' })] })] });
  return kindOf(row, 'width') === 'hugLength' && within(row, 'width') === 2 && within(row, 'height') === 1
    && within(col, 'height') === 2 && within(col, 'width') === 1
    && kindOf(F({ w: 66, h: 44, sizing: 'HUG/FIXED' }), 'height') === 'length'
    && within(F({ w: 24, h: 24, layout: 'HORIZONTAL', children: [{ name: 'I', type: 'VECTOR', w: 24, h: 24, sizing: 'FIXED/FIXED' }] }), 'width') === 0
    // a text box the design fixed is a snapped one frozen: 21 for an 18px line at 115%, where a browser sets 20.7
    && within(F({ w: 400, h: 21, layout: 'HORIZONTAL', children: [T({ h: 21, sizing: 'FILL/FIXED' })] }), 'height') === 1;
})());
// The first engine asserted a filled text box's width, and failed five
// components whose words sit exactly where Figma draws them in a box that hugs.
ok('a text box filling its row is asked its width only where its words are aligned in it', (() => {
  const row = (align) => F({ w: 300, h: 16, sizing: 'FIXED/HUG', layout: 'HORIZONTAL', children: [T({ name: 'L', w: 300, sizing: 'FILL/HUG', textAlign: align })] });
  return of(row('LEFT'), {}, 'L', { L: '.l' }).width === undefined && of(row('CENTER'), {}, 'L', { L: '.l' }).width === '300px'
    && of(row('LEFT'), {}, 'L', { L: '.l' }).height === '16px';
})());
ok('a filling box takes its parent\'s slack, and its siblings\' along the parent\'s run', (() => {
  const page = F({ w: 400, h: 100, sizing: 'FIXED/HUG', layout: 'HORIZONTAL', children: [T(), F({ name: 'Fill', w: 370, h: 16, sizing: 'FILL/HUG', layout: 'VERTICAL', children: [T({ name: 'A' }), T({ name: 'B' })] })] });
  return within(page, 'width', 'Fill', { Fill: '.fill' }) === 1 && within(page, 'height', 'Fill', { Fill: '.fill' }) === 2;
})());
// Project C asserted width == minWidth, wrong as soon as content grows
ok('min-width is its own property, never the width', (() => {
  const g = of(F({ w: 120, h: 40, sizing: 'HUG/FIXED', minWidth: 40 }));
  return g['min-width'] === '40px' && g.width === '120px';
})());
ok('a token naming the window a frame was drawn in is the project\'s canvas, not a value',
  of(F({ maxHeight: 900, bindings: { maxHeight: 'Viewport/height' } }), { parity: { canvas: ['Viewport/'] } })['max-height'] === undefined
  && of(F({ maxHeight: 900, bindings: { maxHeight: 'Viewport/height' } }))['max-height'] === '900px');
ok('a layer on its ancestor\'s element has that ancestor\'s box', (() => {
  const tree = F({ w: 79, h: 44, sizing: 'HUG/FIXED', children: [{ name: 'Label', type: 'TEXT', w: 47, h: 18, sizing: 'HUG/HUG' }] });
  const label = doc(tree, 'Label', { Label: '.root' });
  return !label.assertions.some((a) => a.prop === 'width' || a.prop === 'height') && doc(tree, 'Label', { Label: '.label' }).assertions.some((a) => a.prop === 'width');
})());
// A9: Project D's adapter compared the string, so 999px against a drawn 22px pill differed
ok('a radius is compared as CSS draws it, scaled to fit the box',
  KINDS.radius.compare('999px', { r: '22px', w: 80, h: 44 }, {}, {}) && KINDS.radius.compare('50%', { r: '999px', w: 40, h: 40 }, {}, {})
  && !KINDS.radius.compare('8px', { r: '4px', w: 80, h: 44 }, {}, {}) && of(F({ radius: 999, bindings: { radius: 'Radius/full' } }))['border-radius'] === '999px');
// A10 lives in the schema: an opacity of 0.4 against 1 differs whatever lengths allow
ok('an opacity bound to a token resolves through the token', of(F({ opacity: 0, bindings: { opacity: 'State/Loading/opacity' } })).opacity === '0');

// ---- strokes (A1–A4) ------------------------------------------------------------------------
const S = (o) => F({ strokes: ['Colour/Text/inverse'], strokeAlign: 'INSIDE', ...o });
// A1: Project D's adapter read strokeSides as flags and asserted 1px
ok('a side\'s stroke width is its weight, or its bound token', of(S({ strokeSides: [0, 0, 3, 0], strokesInLayout: true }))['border-bottom-width'] === '3px'
  && of(S({ strokeSides: [2, 2, 2, 2], strokesInLayout: true, bindings: { strokeWeight: ['Stroke/2', 'Stroke/2', 'Stroke/2', 'Stroke/2'] } }))['border-left-width'] === '2px');
// A3: Project C never compared a border's colour
ok('a border is asked its colour per side, where the side has a stroke', (() => {
  const g = of(S({ strokeSides: [1, 0, 1, 0], strokesInLayout: true }));
  return g['border-top-color'] === 'rgba(18, 18, 18, 1)' && g['border-right-width'] === '0px' && g['border-right-color'] === undefined;
})());
ok('a stroke width is exact where lengths are not', !KINDS.strokeWidth.compare('1px', '0px', {}, { length: 1 }) && KINDS.length.compare('1px', '0px', {}, { length: 1 }));
// A2: Project C accepted a border or any ring whatever the flag said
ok('an inside stroke is a border when Figma includes it in the layout', of(S({ strokeSides: [1, 1, 1, 1], strokesInLayout: true }))['box-shadow'] === undefined);
// The first engine demanded an inset shadow for a four-sided ring, and failed an
// avatar whose ring is an outline drawn 1px inward: the same ring, and the one
// that paints over an image child as Figma paints a frame's stroke over its
// content. A ring is asserted as the ring the probe reads, outline or shadow.
ok('and drawn over the content when it is not — a ring on four sides, an inset edge on one', (() => {
  const ring = of(S({ strokeSides: [1, 1, 1, 1], strokesInLayout: false }));
  return ring['-inner-ring-width'] === '1px' && ring['-inner-ring-color'] === 'rgba(18, 18, 18, 1)' && ring['-ring-width'] === undefined
    && ring['box-shadow'] === undefined && ring['border-top-width'] === undefined
    && of(S({ strokeSides: [0, 0, 2, 0], strokesInLayout: false }))['box-shadow'] === 'inset 0px -2px 0px 0px rgba(18, 18, 18, 1)';
})());
ok('a stroke ring and an effect style share the one box-shadow property',
  of(S({ strokeSides: [1, 1, 1, 1], strokesInLayout: false, effect: 'Button/primary' }))['box-shadow']
    === 'inset 0px 0px 0px 1px rgba(18, 18, 18, 1), 0px 0px 0px 3px rgba(22, 22, 22, 0.116)');
// Item 40 of the 2026-10-02 review: an OUTSIDE ring beside an effect was
// held to an outline, one spelling of two that paint the same.
ok('an OUTSIDE ring beside an effect style is one of box-shadow\'s layers, as an INSIDE ring is; a CENTER one stays an outline', (() => {
  const g = of(S({ strokeAlign: 'OUTSIDE', strokeSides: [1, 1, 1, 1], effect: 'Button/primary' }));
  const c = of(S({ strokeAlign: 'CENTER', strokeSides: [2, 2, 2, 2], effect: 'Button/primary' }));
  return g['box-shadow'] === '0px 0px 0px 1px rgba(18, 18, 18, 1), 0px 0px 0px 3px rgba(22, 22, 22, 0.116)' && g['-ring-width'] === undefined && c['-ring-offset'] === '-1px';
})());
// Item 40: the plugin listed counterAxisSpacing as recorded under `gap`, and never recorded it.
ok('a wrapping frame\'s line spacing is the cross-axis gap where the snapshot records one, and nothing where it does not', (() => {
  // 4 + 8 + 4 in 12 overruns, so the two lines and the 24 between them are drawn
  const wrapped = of(F({ w: 12, h: 40, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'MIN/MIN', wrap: true, gap: 8, crossGap: 24, children: two }));
  const plain = of(F({ w: 12, h: 40, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'MIN/MIN', wrap: true, gap: 8, children: two }));
  // S8 (round 3): 4 + 8 + 4 in 200 is one line, and no row-gap draws anything
  const oneLine = of(F({ w: 200, h: 40, sizing: 'FIXED/FIXED', layout: 'HORIZONTAL', align: 'MIN/MIN', wrap: true, gap: 8, crossGap: 24, children: two }));
  return wrapped['column-gap'] === '8px' && wrapped['row-gap'] === '24px' && plain['row-gap'] === undefined && SPEC_KEYS.crossGap
    && oneLine['row-gap'] === undefined && oneLine['column-gap'] === '8px';
})());
ok('a line is a border on its leading edge whatever its alignment; any other path has a stroke', (() => {
  const line = of(S({ type: 'VECTOR', w: 378, h: 0, sizing: 'FILL/FIXED', strokeSides: [1, 1, 1, 1], strokeAlign: 'CENTER' }));
  const upright = of(S({ type: 'VECTOR', w: 0, h: 40, sizing: 'FIXED/FILL', strokeSides: [1, 1, 1, 1] }));
  const path = of(S({ type: 'VECTOR', w: 10, h: 10, sizing: 'FIXED/FIXED', strokeSides: [2, 2, 2, 2], strokeAlign: 'CENTER' }));
  return line['border-top-width'] === '1px' && line['border-right-width'] === '0px' && upright['border-left-width'] === '1px'
    && path.stroke === 'rgba(18, 18, 18, 1)' && path['stroke-width'] === '2px' && path['border-left-width'] === undefined;
})());
// A4: Project D's adapter asserted nothing for OUTSIDE; Project C an inset edge
ok('an OUTSIDE edge is an outer shadow, a four-sided one a ring, CENTER a ring half in', (() => {
  const edge = of(S({ strokeAlign: 'OUTSIDE', strokeSides: [0, 0, 1, 0] }));
  const ring = of(S({ strokeAlign: 'OUTSIDE', strokeSides: [2, 2, 2, 2] }));
  const centre = of(S({ strokeAlign: 'CENTER', strokeSides: [2, 2, 2, 2] }));
  return edge['box-shadow'] === '0px 1px 0px 0px rgba(18, 18, 18, 1)' && ring['-ring-width'] === '2px' && ring['-ring-offset'] === '0px' && centre['-ring-offset'] === '-1px';
})());
ok('an OUTSIDE stroke on an edge flush with a clipping ancestor is not drawn', (() => {
  const content = { name: 'Content', type: 'FRAME', x: 0, y: 0, w: 422, h: 40, sizing: 'FIXED/FIXED', strokes: ['Colour/Text/inverse'], strokeAlign: 'OUTSIDE', strokeSides: [0, 0, 1, 0] };
  const list = (clips, y) => F({ name: 'List', clips, w: 422, h: 120, sizing: 'FIXED/FIXED', children: [{ name: 'Row', type: 'FRAME', x: 0, y, w: 422, h: 40, sizing: 'FIXED/FIXED', children: [content] }] });
  const last = of(list(true, 80), {}, 'Row > Content', { 'Row > Content': '.c' });
  const mid = of(list(true, 0), {}, 'Row > Content', { 'Row > Content': '.c' });
  return last['border-bottom-width'] === '0px' && last['box-shadow'] === undefined && mid['box-shadow'] === '0px 1px 0px 0px rgba(18, 18, 18, 1)'
    && of(list(false, 80), {}, 'Row > Content', { 'Row > Content': '.c' })['border-bottom-width'] === undefined;
})());

// ---- effects (A19, A20) ------------------------------------------------------------------------
ok('an effect style becomes a box-shadow, top layer first, a bound colour in the tier', (() => {
  const g = of(F({ effect: 'Elevation/raised', effects: ['INNER_SHADOW', 'DROP_SHADOW'] }), { tier: 'Light' });
  return g['box-shadow'] === '0px 2px 8px 0px rgba(253, 253, 253, 1), inset 0px 0px 0px 1px rgba(22, 22, 22, 0.116)'
    && of(F({ effects: ['DROP_SHADOW'] }))['box-shadow'] === undefined && /^unresolved/.test(of(F({ effect: 'Gone' }))['box-shadow']);
})());
// A20: Project D's adapter asserted nothing where the design has no effect
ok('an effect or stroke a sibling variant draws, dropped here, is an absence to hold', (() => {
  const carried = { effect: new Set(['$root']), stroke: new Set(['$root']) };
  const bare = of(F(), { carried });
  return bare['box-shadow'] === 'none' && bare['-stroke'] === 'none' && of(F(), { carried, state: 'focus' })['box-shadow'] === undefined
    && of(S({ strokeSides: [1, 1, 1, 1], strokesInLayout: true }), { carried })['box-shadow'] === undefined
    && carriers([F({ effect: 'X' }), F()], ['$root']).effect.has('$root');
})());

// ---- review 2026-10-02 -------------------------------------------------------------------------
// item 13: an INSIDE stroke in layout is inside the box, so 1px of "free" space
// beside a 1px stroke is no choice to observe
ok('an INSIDE stroke that takes room leaves no free space to align in; one drawn over the content does', (() => {
  const kid = [{ name: 'A', type: 'FRAME', x: 1, y: 1, w: 8, h: 8, sizing: 'FIXED/FIXED' }];
  const box = (inLayout) => of(F({ w: 10, h: 10, sizing: 'HUG/HUG', layout: 'HORIZONTAL', align: 'CENTER/CENTER', strokes: ['Colour/Text/inverse'], strokeSides: [1, 1, 1, 1], strokeAlign: 'INSIDE', strokesInLayout: inLayout, children: kid }));
  return box(true)['justify-content'] === undefined && box(true)['align-items'] === undefined && box(false)['justify-content'] === 'center';
})());
// item 2: the slack reached 28 and 33 and absorbed defects that had been bounded waivers
ok('the hug slack is capped, however many text boxes run in series', (() => {
  const T = (i) => ({ name: `T${i}`, type: 'TEXT', w: 20, h: 16, sizing: 'HUG/HUG' });
  const row = F({ w: 400, h: 16, layout: 'HORIZONTAL', children: Array.from({ length: 30 }, (_, i) => T(i)) });
  return (doc(row).assertions.find((a) => a.prop === 'width') || {}).within === SLACK_CAP && SLACK_CAP < 30;
})());
// Review 2026-10-02 round 3, S7: every childless instance counted as a text
// box, so a row of hugging icons took a pixel of slack per glyph.
ok('an instance whose insides were not recorded is a text box only if a text prop gives it words', (() => {
  const I = (i, props) => ({ name: `I${i}`, type: 'INSTANCE', instanceOf: 'Icon', w: 20, h: 20, sizing: 'HUG/HUG', props });
  const row = (props) => F({ w: 400, h: 20, layout: 'HORIZONTAL', children: [I(1, props), I(2, props)] });
  const w = (props) => (doc(row(props)).assertions.find((a) => a.prop === 'width') || {});
  return w({}).within === 0 && w({ 'Label text': 'Go' }).within === 2;
})());
// 13 Oct: a library renamed `Label text` to `Label`; the type is read from the
// component's spec, so the house naming keeps its text slack.
ok('a text prop is known by its type in the library, not by " text" in its name', (() => {
  const I = (i) => ({ name: `B${i}`, type: 'INSTANCE', instanceOf: 'Button / lg', w: 60, h: 20, sizing: 'HUG/HUG', props: { Label: 'Go', Size: 'lg' } });
  const row = F({ w: 400, h: 20, layout: 'HORIZONTAL', children: [I(1), I(2)] });
  const w = (ctx) => (adapt(row, { layers: { $root: '.root' } }, { ...CTX, ...ctx })[0].assertions.find((a) => a.prop === 'width') || {});
  return w({}).within === 0 && w({ propTypes: new Map([['Button', { Label: 'TEXT', Size: ['lg'] }]]) }).within === 2;
})());
// item 40: silent skips are findings, and every CSS asserted is CSS
ok('a mixed radius, a blur and LINEAR_BURN are unresolved; small caps are font-variant-caps; LINEAR_DODGE is plus-lighter; dashed is on the side drawn', (() => {
  const snap = { ...SNAPSHOT, effects: [...SNAPSHOT.effects, { name: 'Blur/soft', layers: [{ type: 'LAYER_BLUR', radius: 8 }] }] };
  const blur = of(F({ effect: 'Blur/soft' }), { snapshot: snap });
  return /^unresolved: a mixed corner/.test(of(F({ radius: 'mixed' }))['border-radius']) && /^unresolved: a LAYER_BLUR/.test(blur.filter)
    && /^unresolved: LINEAR_BURN/.test(of(F({ blendMode: 'LINEAR_BURN' }))['mix-blend-mode']) && of(F({ blendMode: 'LINEAR_DODGE' }))['mix-blend-mode'] === 'plus-lighter'
    && of(F({ blendMode: 'COLOR_BURN' }))['mix-blend-mode'] === 'color-burn'
    && of({ name: 'L', type: 'TEXT', w: 1, h: 1, sizing: 'HUG/HUG', textCase: 'SMALL_CAPS' })['font-variant-caps'] === 'small-caps'
    && of({ name: 'L', type: 'TEXT', w: 1, h: 1, sizing: 'HUG/HUG', textCase: 'SMALL_CAPS' })['text-transform'] === undefined
    && of(F({ dashed: true, strokes: ['Colour/Text/inverse'], strokeSides: [0, 0, 1, 0], strokeAlign: 'INSIDE' }))['border-bottom-style'] === 'dashed';
})());

// ---- focus ring (A21) ----------------------------------------------------------------------------
// Project C took the ring as INSIDE and against the variant root
ok('a focus ring is the ring the browser draws: width, offset from the box it rings, colour', (() => {
  const ring = (strokeAlign, w) => ({ name: 'Focus ring', type: 'RECTANGLE', w, h: 52, x: -4, y: -4, strokes: ['Colour/Text/inverse'], strokeSides: [2, 2, 2, 2], strokeAlign });
  const P = { parity: { variants: { focusRing: 'focus ring' } } };
  const at = (r) => of(F({ w: 66, h: 44, sizing: 'FIXED/FIXED', children: [r] }), P, 'Focus ring', { 'Focus ring': '.root' });
  return at(ring('INSIDE', 74))['-ring-offset'] === '2px' && at(ring('OUTSIDE', 74))['-ring-offset'] === '4px' && at(ring('CENTER', 74))['-ring-offset'] === '3px'
    && at(ring('INSIDE', 74))['-ring-color'] === 'rgba(18, 18, 18, 1)' && at(ring('INSIDE', 66))['-ring-offset'] === '-2px';
})());
// 2026-10-25: one project wrote the ring layer's radius on the box, and every
// offset ring drew 4px rounder than Figma; nothing measured a ring's corners.
ok('a focus ring asserts its outer corners as the ring layer draws them, a pill capped at half its side', (() => {
  const ring = (radius) => ({ name: 'Focus ring', type: 'RECTANGLE', w: 74, h: 52, x: -4, y: -4, radius, strokes: ['Colour/Text/inverse'], strokeSides: [2, 2, 2, 2], strokeAlign: 'INSIDE' });
  const P = { parity: { variants: { focusRing: 'focus ring' } } };
  const at = (r) => of(F({ w: 66, h: 44, sizing: 'FIXED/FIXED', children: [r] }), P, 'Focus ring', { 'Focus ring': '.root' });
  return at(ring(16))['-ring-radius'] === '16px' && at(ring(9999))['-ring-radius'] === '26px' && at(ring(undefined))['-ring-radius'] === undefined;
})());
// Review 2026-10-02 item 24: the adapter matched /focus ring/ while the gate
// that maps the layer honoured the project's own name for it.
ok('a focus ring is the layer the project names as one (parity.variants.focusRing), and no other', (() => {
  const ring = { name: 'Ring', type: 'RECTANGLE', w: 74, h: 52, x: -4, y: -4, strokes: ['Colour/Text/inverse'], strokeSides: [2, 2, 2, 2], strokeAlign: 'INSIDE' };
  const at = (ctx) => of(F({ w: 66, h: 44, sizing: 'FIXED/FIXED', children: [ring] }), ctx, 'Ring', { Ring: '.root' });
  return at({ parity: { variants: { focusRing: 'ring' } } })['-ring-offset'] === '2px' && at({ parity: { variants: { focusRing: 'focus ring' } } })['-ring-offset'] === undefined;
})());

// code-standard 66: a placed part ringing itself inside a ringed holder passed every assertion
ok('a focus variant draws at most as many outlines in the ring\'s colour as Figma draws rings, counted on the root; no other variant counts', (() => {
  const ring = { name: 'Focus ring', type: 'RECTANGLE', w: 74, h: 52, x: -4, y: -4, strokes: ['Colour/Text/inverse'], strokeSides: [2, 2, 2, 2], strokeAlign: 'INSIDE' };
  const tree = F({ w: 66, h: 44, sizing: 'FIXED/FIXED', children: [ring] });
  const P = { parity: { variants: { focusRing: 'focus ring' } } };
  const rings = (state) => (doc(tree, '$root', { 'Focus ring': '.root' }, { ...P, state }).assertions.find((a) => a.prop === '-rings') || {});
  const r = rings('focus-visible');
  return r.kind === 'rings' && r.expected.count === 1 && r.expected.colours[0] === 'rgba(18, 18, 18, 1)' && rings('hover').prop === undefined
    && !doc(F({ w: 66, h: 44, sizing: 'FIXED/FIXED' }), '$root', {}, { state: 'focus' }).assertions.some((a) => a.prop === '-rings');
})());

// ---- presence (A18) ----------------------------------------------------------------------------
// Project D's adapter mapped an absent layer to no selector, so it could never be seen drawn
ok('a layer this variant lacks is absent, and still measured unless another layer is drawn as its element or it sits in an instance whose insides were not recorded', (() => {
  const d = docs(F({ children: [{ name: 'Chevron', type: 'INSTANCE', w: 1, h: 1, sizing: 'FIXED/FIXED' }] }), { Check: '.check', Ring: '.root', 'Chevron > Icon': '.chevron path' });
  const check = d.find((x) => x.layer === 'Check'), ring = d.find((x) => x.layer === 'Ring');
  return check.status === 'absent' && check.selector === '.check' && plan(d).layers.Check.props.includes('-rendered') && ring.selector === null
    && d.find((x) => x.layer === 'Chevron > Icon').selector === null
    && diff([check], { Check: { '-rendered': 'yes' } })[0].kind === 'present' && diff([check], { Check: { '-rendered': 'no', width: '24px' } })[0].kind === 'absent';
})());
ok('a null selector is structural; a path that skips a level resolves to nothing', (() => {
  const tree = F({ children: [{ name: 'Between', type: 'FRAME', w: 1, h: 1, sizing: 'HUG/HUG', children: [{ name: 'Leaf', type: 'FRAME', w: 1, h: 1, sizing: 'HUG/HUG' }] }] });
  const d = docs(tree, { Leaf: '.l', Between: null });
  return d.find((x) => x.layer === 'Leaf').status === 'absent' && d.find((x) => x.layer === 'Between').status === 'structural';
})());

// ---- what a project opts into: position, instance props, children, copy ----------------------------
const P = { parity: { position: true, props: { rename: { Role: 'variant' }, skip: ['State', 'Disabled', 'Breakpoint'], swap: 'icon' } } };
ok('position is judged against the nearest measured ancestor, on the axis its layout leaves free', (() => {
  const leaf = { name: 'Leaf', type: 'FRAME', x: 5, y: 6, w: 10, h: 10, sizing: 'FIXED/FIXED' };
  const tree = F({ w: 500, h: 500, layout: 'VERTICAL', children: [{ name: 'Between', type: 'FRAME', x: 100, y: 200, w: 50, h: 50, layout: 'NONE', children: [leaf] }] });
  const d = docs(tree, { 'Between > Leaf': '.l' }, P);
  const rows = diff(d, { $root: { self: 0, left: 0, top: 0 }, 'Between > Leaf': { self: 1, left: 105, top: 300 } }, { tolerances: { position: 4 } }).filter((r) => r.layer === 'Between > Leaf' && r.prop.startsWith('-'));
  return rows.map((r) => `${r.prop}:${r.kind}`).join() === '-x:match' && docs(tree, { 'Between > Leaf': '.l' }).find((x) => x.layer !== '$root').assertions.every((a) => a.prop !== '-x');
})());
ok('a rotated layer answers with the box the eye sees, and its turn with the fill\'s', (() => {
  const g = of(F({ w: 500, h: 500, children: [{ name: 'Art', type: 'RECTANGLE', x: 10, y: 20, w: 100, h: 40, sizing: 'FIXED/FIXED', rotation: 180, fillRotation: 180, visual: { x: 60, y: 70, w: 40, h: 100 } }] }), P, 'Art', { Art: '.a' });
  return g.width === '40px' && g.height === '100px' && g['-x'] === 60 && g.rotate === 360 && KINDS.rotation.compare(360, 'none');
})());
ok('an instance prop is an attribute, off ones included; text, State, Disabled and Breakpoint are not', (() => {
  const inst = { name: 'Nav', type: 'INSTANCE', instanceOf: 'Button / lg', w: 10, h: 10, sizing: 'HUG/HUG', props: { 'Label text': 'Go', State: 'Rest', Disabled: 'False', Breakpoint: 'md', Role: 'Primary', Scroll: 'True', Menu: false, Big: true, 'Icon swap': 'House' } };
  const a = doc(F({ children: [inst] }), 'Nav', { Nav: '.n' }, P).assertions.filter((x) => /^-attr|^-swap/.test(x.prop));
  const read = (prop, record) => KINDS[a.find((x) => x.prop === prop).kind].read({ record, assertion: a.find((x) => x.prop === prop) });
  return a.map((x) => x.prop).join() === '-attr:variant,-attr:scroll,-attr:menu,-swap:icon-swap'
    && a.find((x) => x.prop === '-attr:menu').expected.mode === 'off-only' && read('-attr:scroll', { attrs: { scroll: '' } }) === 'set'
    && read('-swap:icon-swap', { children: [{ tag: 'icon', icon: 'house' }] }) === 'house' && typeof read('-swap:icon-swap', { children: [] }) === 'symbol';
})());
// 14 Oct 2026: once a prop's type came from the library, an empty state's
// `Graphic` swap was judged too, and the page's ds-graphic read as none
ok('a swap may place any of several elements: an icon or a graphic', (() => {
  const inst = { name: 'Empty', type: 'INSTANCE', instanceOf: 'Empty', w: 10, h: 10, sizing: 'HUG/HUG', props: { 'Icon swap': 'Folder' } };
  const Q = { parity: { props: { swap: ['icon', 'graphic'] } } };
  const a = doc(F({ children: [inst] }), 'Empty', { Empty: '.e' }, Q).assertions.find((x) => x.prop === '-swap:icon-swap');
  return KINDS.swap.read({ record: { children: [{ tag: 'graphic', icon: 'folder' }] }, assertion: a }) === 'folder';
})());
// Review 2026-10-02 round 3, S7: a page that dropped a glyph the design draws
// was skipped as if the boolean that shows it were off.
ok('a swap the design draws and the page leaves out is a difference; one the design hides is not judged', (() => {
  const inst = (kids) => ({ name: 'Nav', type: 'INSTANCE', instanceOf: 'Button / lg', w: 10, h: 10, sizing: 'HUG/HUG', props: { 'Icon swap': 'House' }, children: kids });
  const swapOf = (tree) => doc(F({ children: [tree] }), 'Nav', { Nav: '.n' }, P).assertions.find((x) => x.prop === '-swap:icon-swap');
  const shown = swapOf(inst([{ name: 'Icon', type: 'INSTANCE', instanceOf: 'house / Size=20', w: 1, h: 1 }])), hidden = swapOf(inst([]));
  const read = (a) => KINDS.swap.read({ record: { children: [] }, assertion: a });
  return read(shown) === 'none' && !KINDS.swap.compare('house', read(shown)) && typeof read(hidden) === 'symbol';
})());
ok('the library instances a layer holds, outermost and in order, are its children', (() => {
  const tree = F({ children: [{ name: 'Row', type: 'FRAME', w: 1, h: 1, sizing: 'HUG/HUG', children: [
    { name: 'Tag', type: 'INSTANCE', instanceOf: 'Tag', w: 1, h: 1, props: { 'Label text': 'New' } },
    { name: 'Button', type: 'INSTANCE', instanceOf: 'Button / sm', w: 1, h: 1, props: { 'Label text': 'Label' }, children: [{ name: 'Icon', type: 'INSTANCE', instanceOf: 'Icon', w: 1, h: 1 }] }] }] });
  const label = { parity: { props: { label: { prop: 'Label text', placeholder: 'Label' } } } };
  const want = doc(tree, 'Row', { Row: '.r' }, { children: true, ...label }).assertions.find((a) => a.prop === '-children').expected;
  // item 24 of the 2026-10-02 review: the label prop's name was the engine's; now the project's, and none asserts no labels
  const unnamed = doc(tree, 'Row', { Row: '.r' }, { children: true }).assertions.find((a) => a.prop === '-children').expected;
  return JSON.stringify(want) === '[{"tag":"tag","label":"New"},{"tag":"button","label":""}]' && JSON.stringify(unnamed) === '[{"tag":"tag","label":""},{"tag":"button","label":""}]';
})());
ok('a runtime layer keeps its box and loses its state-dependent paint', (() => {
  const g = of(F({ name: 'Bar', type: 'INSTANCE', fills: ['Colour/Text/inverse'], strokes: ['Colour/Text/inverse'], strokeSides: [1, 1, 1, 1], strokeAlign: 'INSIDE', effect: 'Button/primary' }), { runtime: ['$root'] });
  return Object.keys(g).sort().join() === 'height,width';
})());

console.log(`\n${n} passed`);
