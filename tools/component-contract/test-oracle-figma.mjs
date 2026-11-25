/* oracle-figma.mjs: Figma's REST JSON mapped to the stored walk's words and to a contract's, every field held, a bound
   value held as bound, a field REST does not say never passing, and the fetch polite, cached and silent about its token. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { recordedOf, readAt, BOUND, UNNAMED, plainText, partOurs, FIELDS, NOT_CHECKABLE, REASONS, paintsOf, paintOurs, restWalk, restPart, compareSpec, compareContract, linksOf, addressParts, client, fetchSets, versionAt, report } from './oracle-figma.mjs';

const require = createRequire(import.meta.url);
const { compact, resolve } = require('../snapshot/spec.cjs');
const ctx = { styles: { 'S:1': { name: 'Body/md' }, 'S:2': { name: 'Brand/fill' } }, components: { 'C:9': { key: 'k-icon', name: 'Size=16', componentSetId: 'CS:9' }, 'C:8': { key: 'k-swap', name: 'Star' } }, componentSets: { 'CS:9': { key: 'kset-icon', name: 'Icon' }, 'SET:1': { key: 'kset', name: 'Chip', description: 'A chip.' } } };
const T = (x, y) => [[1, 0, x], [0, 1, y]];

/* ---- the mapping, field by field, against values written out by hand */
{
  const white = { r: 1, g: 1, b: 1, a: 1 };
  assert.deepEqual(paintsOf([{ type: 'SOLID', color: white }]), ['#ffffff']);
  assert.deepEqual(paintsOf([{ type: 'SOLID', color: white, opacity: 0.5 }]), ['rgb(255 255 255 / 0.5)'], 'a paint\'s opacity is its colour\'s alpha');
  assert.deepEqual(paintsOf([{ type: 'SOLID', color: white, opacity: 0.00001 }]), [], 'a paint at no opacity paints nothing');
  assert.deepEqual(paintsOf([{ type: 'SOLID', color: white, opacity: 0.00001 }], true), ['rgb(255 255 255 / 0)'], 'a stroke\'s is kept');
  assert.deepEqual(paintsOf([{ type: 'SOLID', color: white, visible: false }]), []);
  assert.deepEqual(paintsOf([{ type: 'SOLID', color: white, boundVariables: { color: { id: 'VariableID:1' } } }]), [BOUND], 'a bound paint is bound, its name not checkable');
  assert.deepEqual(paintsOf([{ type: 'IMAGE', scaleMode: 'FILL' }]), ['IMAGE:FILL']);
  assert.deepEqual(paintsOf([{ type: 'IMAGE', scaleMode: 'STRETCH' }]), ['IMAGE:CROP']);
  const g = paintsOf([{ type: 'GRADIENT_LINEAR', gradientHandlePositions: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }, { x: 0, y: 0 }], gradientStops: [{ position: 0, color: white }, { position: 1, color: { r: 0, g: 0, b: 0, a: 1 } }] }])[0];
  assert.equal(g.angle, 180, 'top to bottom is 180°, as CSS says it');
  assert.deepEqual(g.stops.map((s) => s.color), ['#ffffff', '#000000']);
  // a hair short of upright rounds to 0°, never 360°; a contract an older snapshot wrote at 360 reads as 0
  const up = paintsOf([{ type: 'GRADIENT_LINEAR', gradientHandlePositions: [{ x: 0.5, y: 1 }, { x: 0.497, y: 0 }, { x: 0, y: 0 }], gradientStops: [] }])[0];
  assert.equal(up.angle, 0);
  assert.equal(paintOurs({ type: 'GRADIENT_LINEAR', angle: 360, stops: [] }).angle, 0);
  assert.equal(paintOurs({ type: 'GRADIENT_LINEAR', angle: -90, stops: [] }).angle, 270);
  // a part a swap property drives is the layer that property drives, though the swapped-in icon names it otherwise
  { const flat = { root: {}, icon: { kind: 'instance', parent: 'root', component: 'Add', swappedBy: 'swapIcon' } };
    const v = { name: 'V', children: [{ name: 'Close', type: 'INSTANCE', componentPropertyReferences: { mainComponent: 'Swap icon#1:2' } }] };
    assert.equal(addressParts(flat, v, { 'Swap icon': 'swapIcon' }).found.get('icon'), v.children[0]);
    assert.equal(addressParts({ root: {}, icon: { ...flat.icon, swappedBy: 'other' } }, v, { 'Swap icon': 'swapIcon' }).found.get('icon'), undefined, 'another property: no pair'); }
  // a text's weight is its face's name, as the contract says it: Lucida Grande's Regular is 400 though its file says 500
  { const tx = (fontStyle) => restPart({ id: 't', name: 'T', type: 'TEXT', size: { x: 10, y: 10 }, relativeTransform: [[1, 0, 0], [0, 1, 0]], characters: 'A', style: { fontFamily: 'Lucida Grande', fontStyle, fontWeight: 500, fontSize: 14, lineHeightPx: 18, lineHeightUnit: 'PIXELS' } }, null, { styles: {}, components: {}, componentSets: {} }, {}).typography.weight;
    assert.equal(tx('Regular'), 400); assert.equal(tx('Bold'), 700); assert.equal(tx(undefined), 500); }
}
{
  const frame = { id: '1', name: 'Box', type: 'FRAME', size: { x: 100, y: 40 }, relativeTransform: T(4, 6), layoutMode: 'HORIZONTAL', paddingTop: 1, paddingRight: 2, paddingBottom: 3, paddingLeft: 4, itemSpacing: 8, primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER', layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'HUG', cornerRadius: 6, opacity: 0.5, clipsContent: true,
    boundVariables: { itemSpacing: { id: 'v' }, paddingLeft: { id: 'v' } }, strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }], individualStrokeWeights: { top: 0, right: 0, bottom: 1, left: 0 }, strokeAlign: 'OUTSIDE', styles: { fill: 'S:2' }, fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }] };
  const parent = { type: 'FRAME', size: { x: 200, y: 50 }, absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 50 } };
  const w = restWalk(frame, ctx, 1, parent, 2);
  assert.deepEqual([w.x, w.y, w.w, w.h, w.index], [4, 6, 100, 40, 2], 'place from the matrix, size from size, index among all siblings');
  assert.deepEqual(w.pad, [1, 2, 3, 4], 'padding top, right, bottom, left');
  assert.equal(w.align, 'SPACE_BETWEEN/CENTER');
  assert.equal(w.sizing, 'FIXED/HUG');
  assert.deepEqual(w.bindings, { pad: [null, null, null, BOUND], gap: BOUND });
  assert.deepEqual(w.strokeSides, [0, 0, 1, 0]);
  assert.equal(w.fillStyle, 'Brand/fill');
  assert.equal(w.constraints, undefined, 'a layer auto layout places has no constraints said');
  const e = restPart(frame, parent, ctx, {});
  assert.deepEqual(e.layout, { direction: 'row', gap: BOUND, align: 'space-between', crossAlign: 'center', padding: { top: 1, end: 2, bottom: 3, start: BOUND } });
  assert.deepEqual([e.width, e.height], [100, 'hug']);
  assert.deepEqual(e.border, { color: '#000000', width: [0, 0, 1, 0], align: 'outside' });
  assert.deepEqual(e.radius, [6, 6, 6, 6]);
  assert.equal(e.overflow, 'hidden');
  assert.deepEqual(e.absolute, { x: 4, y: 6, end: 96, bottom: 4 }, 'a layer in a frame with no auto layout is placed');
  // a horizontal mirror is a flip, never a turn of 180
  const m = restWalk({ ...frame, relativeTransform: [[-1, 0, 104], [0, 1, 6]] }, ctx, 1, parent, 0);
  assert.equal(m.flip, 'x'); assert.equal(m.rotation, undefined);
  const q = restWalk({ ...frame, relativeTransform: [[0, 1, 0], [-1, 0, 100]], absoluteBoundingBox: { x: 0, y: 0, width: 40, height: 100 } }, ctx, 1, parent, 0);
  assert.equal(q.rotation, 90); assert.deepEqual(q.visual, { x: 0, y: 0, w: 40, h: 100 });
  // a placed layer's constraints in the walk's words
  const placed = restWalk({ ...frame, layoutPositioning: 'ABSOLUTE', constraints: { horizontal: 'LEFT_RIGHT', vertical: 'BOTTOM' } }, ctx, 1, { ...parent, layoutMode: 'VERTICAL' }, 0);
  assert.equal(placed.constraints, 'STRETCH/MAX'); assert.equal(placed.absolute, true);
}
{
  const text = { name: 'Label', type: 'TEXT', size: { x: 30, y: 20 }, relativeTransform: T(0, 0), characters: 'Hi', styles: { text: 'S:1' }, style: { fontFamily: 'Inter', fontStyle: 'Medium', fontWeight: 500, fontSize: 14, textAlignHorizontal: 'CENTER', textAlignVertical: 'TOP', textAutoResize: 'WIDTH_AND_HEIGHT', letterSpacing: 0.28, lineHeightUnit: 'FONT_SIZE_%', lineHeightPx: 21, textCase: 'UPPER' }, componentPropertyReferences: { characters: 'Label text#1:2' }, fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }] };
  const w = restWalk(text, ctx, 1, { type: 'FRAME', layoutMode: 'HORIZONTAL' }, 0);
  assert.equal(w.textStyle, 'Body/md'); assert.equal(w.fontSize, undefined, 'a styled text\'s size is its style\'s');
  assert.equal(w.lineHeight, 21, 'a line height in px'); assert.equal(w.letterSpacing, 0.28); assert.equal(w.textCase, 'UPPER');
  assert.equal(w.textAlignVertical, undefined, 'top is the default, left out as the walk leaves it');
  const e = restPart(text, null, ctx, { 'Label text': 'labelText' });
  assert.equal(e.content, '{labelText}', 'a text its property drives says the property');
  assert.equal(e.color, '#000000'); assert.equal(e.textAlign, 'center'); assert.equal(e.autoResize, 'width_and_height');
  const lit = restPart({ ...text, styles: {} }, null, ctx, {});
  assert.deepEqual(lit.typography, { size: 14, lineHeight: 21, weight: 500, italic: false, family: 'Inter' }, 'a literal text by its values, the weight Figma\'s number');
}
{
  const inst = { name: 'Icon', type: 'INSTANCE', size: { x: 16, y: 16 }, relativeTransform: T(0, 0), componentId: 'C:9', componentProperties: { 'Glyph#3:4': { type: 'INSTANCE_SWAP', value: 'C:8' }, Size: { type: 'VARIANT', value: '16' } }, componentPropertyReferences: { mainComponent: 'Icon swap#5:6' }, overrides: [{ id: 'x', overriddenFields: ['inheritFillStyleId', 'fills', 'preserveRatio'] }], children: [] };
  const w = restWalk(inst, ctx, 1, null, 0);
  assert.equal(w.instanceOf, 'Icon / Size=16'); assert.equal(w.instanceOfKey, 'kset-icon', 'a variant\'s key is its set\'s');
  assert.deepEqual(w.props, { Glyph: 'Star', Size: '16' }, 'a swap by its component\'s name');
  assert.deepEqual(w.overrides, ['fillStyleId,fills,constrainProportions'], 'REST\'s override names in the plugin API\'s');
  const e = restPart(inst, null, ctx, { 'Icon swap': 'iconSwap' });
  assert.deepEqual([e.kind, e.component, e.key, e.swappedBy], ['instance', 'Icon', 'kset-icon', 'iconSwap']);
}

/* ---- where REST and the plugin API word the same fact differently (each met on a real library) */
{
  // a group's child: REST places it in the group, the plugin API in the frame holding the group
  const group = { name: 'G', type: 'GROUP', size: { x: 10, y: 10 }, relativeTransform: T(3, 4), children: [{ name: 'V', type: 'VECTOR', size: { x: 2, y: 2 }, relativeTransform: T(1, 1) }] };
  const w = restWalk({ name: 'F', type: 'FRAME', size: { x: 20, y: 20 }, relativeTransform: T(0, 0), children: [group] }, ctx);
  assert.deepEqual([w.children[0].children[0].x, w.children[0].children[0].y], [4, 5]);
  // a prototype link overridden: REST's transition fields, the plugin API's reactions
  const inst = { name: 'I', type: 'INSTANCE', componentId: 'C:9', size: { x: 1, y: 1 }, relativeTransform: T(0, 0), overrides: [{ id: 'a', overriddenFields: ['transitionNodeID', 'transitionDuration', 'width'] }], children: [] };
  assert.deepEqual(restWalk(inst, ctx).overrides, ['reactions,width']);
  // a swap to a component the response does not name is held by neither side
  const unnamed = restWalk({ ...inst, componentProperties: { 'Icon#1:1': { type: 'INSTANCE_SWAP', value: '99:99' } } }, ctx);
  assert.equal(unnamed.props.Icon, UNNAMED);
  // a quarter-turned layer's sizing words are on its parent's axes: said on its own where the contract draws it turned
  // in a wrapper (to-code turnedParts), else in Figma's order, its own size beside them, as derive says it
  const ln = { name: 'L', type: 'LINE', size: { x: 0, y: 20 }, relativeTransform: [[0, 1, 0], [-1, 0, 20]], layoutSizingHorizontal: 'FILL', layoutSizingVertical: 'FIXED' };
  const line = restPart(ln, { type: 'FRAME', layoutMode: 'HORIZONTAL' }, ctx, {}, undefined, { turned: true });
  assert.deepEqual([line.width, line.height], [0, 'fill']);
  const inPlace = restPart(ln, { type: 'FRAME', layoutMode: 'HORIZONTAL' }, ctx, {});
  assert.deepEqual([inPlace.width, inPlace.height], ['fill', 20]);
  // a description: REST plain, the walk markdown
  assert.equal(plainText('**Size**\nChoose one. [Guide](https://x)'), plainText('SizeChoose one. Guide'));
  assert.equal(plainText('Intro\n\n- Focus on it'), plainText('Intro\n\n\nFocus on it'), 'a list marker is markdown');
  // a bound size is size.x and size.y in REST
  assert.deepEqual(restWalk({ name: 'S', type: 'FRAME', size: { x: 14, y: 14 }, relativeTransform: T(0, 0), boundVariables: { size: { x: { id: 'v' }, y: { id: 'v' } }, rectangleCornerRadii: { RECTANGLE_TOP_LEFT_CORNER_RADIUS: { id: 'v' } } } }, ctx).bindings, { radius: [BOUND, null, null, null], w: BOUND, h: BOUND });
  // a part inside a group is placed in the frame holding the group
  const frame = { type: 'FRAME', size: { x: 50, y: 50 }, absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 50 } };
  const grp = { type: 'GROUP', size: { x: 20, y: 20 }, absoluteBoundingBox: { x: 10, y: 10, width: 20, height: 20 } };
  assert.deepEqual(restPart({ name: 'V', type: 'VECTOR', size: { x: 4, y: 4 }, relativeTransform: T(2, 2) }, grp, ctx, {}, frame).absolute.x, 12);
  // a border's per-side widths said as `sides`
  assert.deepEqual(partOurs({ kind: 'container', border: { color: '#000000', sides: { top: 0, end: 0, bottom: 1, start: 0 } } }).border.width, [0, 0, 1, 0]);
}

/* ---- the table: every field the mapping writes is a row of FIELDS; nothing not checkable is also compared */
{
  const said = FIELDS.map((f) => `${f.spec || ''}, ${f.contract || ''}`).join(', ');
  const words = new Set(said.split(/[^A-Za-z.]+/).filter(Boolean));
  const walkKeys = ['name', 'type', 'w', 'h', 'x', 'y', 'index', 'visual', 'layout', 'pad', 'gap', 'wrap', 'crossGap', 'firstOnTop', 'align', 'sizing', 'absolute', 'constraints', 'minWidth', 'radius', 'smoothing', 'mask', 'opacity', 'bindings', 'modes', 'clips', 'blendMode', 'dashed', 'strokeCap', 'arc', 'flip', 'rotation', 'fills', 'fillStyle', 'strokes', 'strokeSides', 'strokeAlign', 'strokesInLayout', 'effect', 'effects', 'text', 'textStyle', 'fontSize', 'textAlign', 'textAutoResize', 'truncate', 'maxLines', 'textCase', 'textDecoration', 'textAlignVertical', 'letterSpacing', 'lineHeight', 'instanceOf', 'instanceOfKey', 'props', 'overrides'];
  for (const k of walkKeys.filter((x) => x !== 'name')) assert.ok(words.has(k), `FIELDS lists the walk's ${k}`);
  for (const k of ['kind', 'width', 'height', 'background', 'color', 'border', 'radius', 'overflow', 'position', 'content', 'typography', 'autoResize', 'verticalAlign', 'component', 'key', 'with', 'swappedBy', 'shadow', 'blend']) assert.ok(words.has(k) || said.includes(k), `FIELDS lists the contract's ${k}`);
  const nc = NOT_CHECKABLE.map((x) => x.field).join(' ');
  for (const k of ['variable names', 'paths', 'notes', 'flipped-boolean', 'modes']) assert.ok(nc.includes(k), `${k} is listed as not checkable`);
  assert.ok(NOT_CHECKABLE.every((x) => x.why && REASONS.includes(x.reason)), 'each says why, for a reason from the closed list');
  assert.ok(FIELDS.every((f) => ['value', 'bound', 'where-stated'].includes(f.how) && f.rest), 'each field says where REST has it and how it is held');
}

/* ---- a set: the stored spec and the contract held to it, and each difference caught */
const variant = (name, x, size, label) => ({ id: name, name, type: 'COMPONENT', size: { x: size, y: 32 }, relativeTransform: T(x, 0), layoutMode: 'HORIZONTAL', paddingLeft: 8, paddingRight: 8, itemSpacing: 4, counterAxisAlignItems: 'CENTER', layoutSizingHorizontal: 'HUG', layoutSizingVertical: 'FIXED', cornerRadius: 4,
  fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 }, boundVariables: { color: { id: 'VariableID:2' } } }],
  children: [
    { id: name + 't', name: 'Label', type: 'TEXT', size: { x: size - 16, y: 20 }, relativeTransform: T(8, 6), layoutSizingHorizontal: 'HUG', layoutSizingVertical: 'HUG', characters: label, componentPropertyReferences: { characters: 'Label#1:0' }, styles: { text: 'S:1' }, fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }], style: { fontFamily: 'Inter', fontStyle: 'Regular', fontWeight: 400, fontSize: 14, textAlignHorizontal: 'LEFT', textAlignVertical: 'TOP', textAutoResize: 'WIDTH_AND_HEIGHT', lineHeightUnit: 'PIXELS', lineHeightPx: 20 } },
    { id: name + 'h', name: 'Hidden', type: 'FRAME', visible: false, size: { x: 1, y: 1 }, relativeTransform: T(0, 0) },
  ] });
const setNode = { id: 'SET:1', name: 'Chip', type: 'COMPONENT_SET', size: { x: 200, y: 32 }, componentPropertyDefinitions: { Size: { type: 'VARIANT', defaultValue: 'Small', variantOptions: ['Small', 'Large'] }, 'Label#1:0': { type: 'TEXT', defaultValue: 'Chip' } },
  children: [variant('Size=Small', 0, 60, 'Chip'), variant('Size=Large', 100, 90, 'Chip')] };
// what the walk stored for it, written out by hand in its words
const storedTree = (name, x, size) => ({ name, type: 'COMPONENT', w: size, h: 32, layout: 'HORIZONTAL', pad: [0, 8, 0, 8], gap: 4, wrap: false, align: 'MIN/CENTER', sizing: 'HUG/FIXED', radius: 4, fills: ['Brand/red'],
  children: [{ name: 'Label', type: 'TEXT', w: size - 16, h: 20, x: 8, y: 6, index: 0, sizing: 'HUG/HUG', fills: ['#000000'], text: 'Chip', textStyle: 'Body/md', textAlign: 'LEFT', textAutoResize: 'WIDTH_AND_HEIGHT', lineHeight: '20' }], place: { x, y: 0 } });
const storedFull = () => ({ name: 'Chip', id: 'SET:1', description: 'A chip.', props: { Size: ['Small', 'Large'], Label: 'TEXT' }, set: { w: 200, h: 32 }, links: { Label: { kind: 'characters', layers: [['Label']] } }, defaultVariant: 'Size=Small', key: 'kset',
  variants: [storedTree('Size=Small', 0, 60), storedTree('Size=Large', 100, 90)] });
const contract = () => ({ contract: 1, component: 'Chip', props: { size: { type: 'enum', values: ['small', 'large'], default: 'small', figmaValues: ['Small', 'Large'], figma: 'Size' }, label: { type: 'string', default: 'Chip', figma: 'Label', sets: ['label'] } },
  anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 4, align: 'start', crossAlign: 'center', padding: { top: 0, end: 8, bottom: 0, start: 8 } }, width: 'hug', height: 32, background: 'Brand/red', radius: 4 },
    label: { kind: 'text', parent: 'root', order: 0, width: 'hug', height: 'hug', typography: 'Body/md', color: '#000000', content: '{label}', textAlign: 'start', autoResize: 'width_and_height' } },
  variants: [], invalid: [] });
{
  assert.deepEqual(linksOf(setNode.children), { Label: { kind: 'characters', layers: [['Label']] } });
  // walk 0.90.0 on: a set's own key inside a placed instance is the set's, another's is its component's; each layer's own
  // variants where fewer than the property's; before (no keys), not into instances, as that walk read them
  { const inst = (refs) => ({ name: 'Menu', type: 'INSTANCE', children: [{ name: 'Text', type: 'TEXT', componentPropertyReferences: refs }] });
    const v = (name, extra) => ({ name, children: [{ name: 'Label', type: 'TEXT', componentPropertyReferences: { characters: 'Label#1:1' } }, ...extra] });
    const roots = [v('Size=Large', [inst({ characters: 'Label#1:1' })]), v('Size=Small', [inst({ characters: 'Own#9:9' })])];
    assert.deepEqual(linksOf(roots, new Set(['Label#1:1'])), { Label: { kind: 'characters', layers: [['Label'], ['Menu', 'Text']], layerVariants: [['Size=Large', 'Size=Small'], ['Size=Large']] } });
    assert.deepEqual(linksOf(roots), { Label: { kind: 'characters', layers: [['Label']] } }); }
  // 0.90.2 (narrow): inside instances only for a key no outer layer takes
  { const inst = (refs) => ({ name: 'Menu', type: 'INSTANCE', children: [{ name: 'Text', type: 'TEXT', componentPropertyReferences: refs }] });
    const roots = [{ name: 'V', children: [{ name: 'Label', type: 'TEXT', componentPropertyReferences: { characters: 'Title#1:1' } }, inst({ characters: 'Badge#2:2', visible: 'Title#1:1' })] }];
    assert.deepEqual(linksOf(roots, new Set(['Title#1:1', 'Badge#2:2']), true), { Title: { kind: 'characters', layers: [['Label']] }, Badge: { kind: 'characters', layers: [['Menu', 'Text']] } }); }
  const sp = compareSpec('chip', setNode, storedFull(), ctx);
  assert.deepEqual(sp.rows, [], 'a spec that says what Figma says has no row');
  assert.ok(sp.checked > 20, 'and its fields were checked, each counted');
  const cp = compareContract('chip', setNode, contract(), ctx);
  assert.deepEqual(cp.rows, [], 'a contract that says what Figma says has no row');
  assert.ok(cp.checked > 10, 'and its fields were checked, each counted');
  const kinds = (r) => r.rows.map((x) => x.kind);
  // each change to the stored spec is a row of its field
  const cases = [
    [(s) => { s.variants[0].gap = 6; }, 'spec:gap'],
    [(s) => { s.variants[0].pad = [0, 8, 0, 9]; }, 'spec:pad'],
    [(s) => { s.variants[0].fills = ['#ff0000']; }, 'spec:fills'],
    [(s) => { s.variants[0].children[0].text = 'Other'; }, 'spec:text'],
    [(s) => { s.variants[0].children[0].textStyle = 'Body/lg'; }, 'spec:textStyle'],
    [(s) => { s.variants[1].place = { x: 0, y: 0 }; }, 'spec:place'],
    [(s) => { s.variants[0].children.push({ name: 'Extra', type: 'FRAME', w: 1, h: 1 }); }, 'spec:layer'],
    [(s) => { s.props.Size = ['Small']; }, 'spec:props'],
    [(s) => { s.defaultVariant = 'Size=Large'; }, 'spec:defaultVariant'],
    [(s) => { s.links = {}; }, 'spec:links'],
    [(s) => { s.variants.pop(); }, 'spec:variant'],
  ];
  for (const [change, kind] of cases) {
    const s = storedFull(); change(s);
    assert.ok(kinds(compareSpec('chip', setNode, s, ctx)).includes(kind), `a changed ${kind} is caught`);
  }
  // a token's name is not checkable: another name for the same bound fill is no row; the fill is still checked as bound
  { const s = storedFull(); s.variants[0].fills = ['Brand/other']; const r = compareSpec('chip', setNode, s, ctx); assert.deepEqual(r.rows, []); assert.equal(r.checked, sp.checked); }
  // fields REST does not say are neither rows nor checks
  { const s = storedFull(); s.variants[0].notes = [{ text: 'x' }]; s.variants[0].children[0].paths = [{ data: 'M 0 0' }]; const r = compareSpec('chip', setNode, s, ctx); assert.deepEqual(r.rows, []); assert.equal(r.checked, sp.checked); }
  // mixed text and a swap REST does not name are skipped, counted as such, never passing
  {
    const set = structuredClone(setNode); set.children[0].children[0].characterStyleOverrides = [0, 1];
    const r = compareSpec('chip', set, storedFull(), ctx);
    assert.equal(r.skipped['textStyle of mixed text'], 1);
    assert.equal(r.checked, sp.checked - 1, 'a skipped field is not a checked one');
  }
  // a boolean's flipped tree is the walk's own, not a variant Figma lacks, and it is counted as skipped
  {
    const set = structuredClone(setNode); set.componentPropertyDefinitions['Show#2:0'] = { type: 'BOOLEAN', defaultValue: false };
    const s = storedFull(); s.props.Show = 'BOOLEAN'; s.variants.push({ ...storedTree('Size=Small, Show=True', 0, 60) });
    const r = compareSpec('chip', set, s, ctx);
    assert.ok(!kinds(r).includes('spec:variant')); assert.equal(r.skipped['flipped-boolean tree'], 1);
  }
  // and each change to the contract
  const ccases = [
    [(c) => { c.anatomy.root.layout.padding.start = 10; }, 'contract:layout.padding'],
    [(c) => { c.anatomy.root.background = '#ff0000'; }, 'contract:background'],
    [(c) => { c.anatomy.root.width = 60; }, 'contract:width'],
    [(c) => { c.anatomy.label.content = 'Chip'; }, 'contract:content'],
    [(c) => { c.anatomy.label.typography = 'literal 14/20 regular Inter'; }, 'contract:typography'],
    [(c) => { c.anatomy.extra = { kind: 'container', parent: 'root', order: 1, width: 1, height: 1 }; }, 'contract:part'],
    [(c) => { delete c.anatomy.label; }, 'contract:part'],
    [(c) => { c.variants.push({ when: { size: 'large' }, set: { 'root.radius': 8 } }); }, 'contract:radius'],
    [(c) => { c.props.size.default = 'large'; }, 'contract:props.default'],
    [(c) => { c.invalid = [{ size: 'large' }]; }, 'contract:invalid'],
  ];
  for (const [change, kind] of ccases) {
    const c = contract(); change(c);
    assert.ok(kinds(compareContract('chip', setNode, c, ctx)).includes(kind), `a changed ${kind} is caught`);
  }
  // a vector's per-vertex radius (mixed) is the walk's word, which REST never states: a named skip, not a row
  { const c = contract(); c.anatomy.root.radius = 'mixed'; const square = structuredClone(setNode); for (const v of square.children) delete v.cornerRadius;
    const r = compareContract('chip', square, c, ctx); assert.ok(!kinds(r).includes('contract:radius') && Object.keys(r.skipped).some((k) => /mixed/.test(k)), 'mixed: skipped by name'); }
  { const st = storedFull(); for (const v of st.variants) v.radius = 'mixed'; const square = structuredClone(setNode); for (const v of square.children) delete v.cornerRadius;
    assert.ok(!compareSpec('chip', square, st, ctx).rows.some((x) => x.kind === 'spec:radius'), 'and in the spec leg'); }
  // a smoothing on a layer with no radius on either side: REST states cornerSmoothing only beside a radius, a named skip;
  // beside a radius REST leaves it out of, still a row
  { const c = contract(); delete c.anatomy.root.radius; c.anatomy.root.smoothing = 1; const square = structuredClone(setNode); for (const v of square.children) delete v.cornerRadius;
    const r = compareContract('chip', square, c, ctx); assert.ok(!kinds(r).includes('contract:smoothing') && Object.keys(r.skipped).some((k) => /smoothing: no radius/.test(k)), 'no radius: skipped by name');
    const c2 = contract(); c2.anatomy.root.smoothing = 1; assert.ok(kinds(compareContract('chip', setNode, c2, ctx)).includes('contract:smoothing'), 'with a radius: a row');
    const st = storedFull(); for (const v of st.variants) { delete v.radius; v.smoothing = 1; }
    assert.ok(!compareSpec('chip', square, st, ctx).rows.some((x) => x.kind === 'spec:smoothing'), 'and in the spec leg');
    const st2 = storedFull(); for (const v of st2.variants) v.smoothing = 1;
    assert.ok(compareSpec('chip', setNode, st2, ctx).rows.some((x) => x.kind === 'spec:smoothing'), 'the spec leg, with a radius: a row'); }
  // a radius of four zeros (an instance squaring off its component's corners) is what REST says by leaving it out
  { const c = contract(); c.anatomy.root.radius = 0; const square = structuredClone(setNode); for (const v of square.children) delete v.cornerRadius;
    assert.ok(!kinds(compareContract('chip', square, c, ctx)).includes('contract:radius'), 'a 0 radius is REST\'s none');
    assert.ok(kinds(compareContract('chip', setNode, c, ctx)).includes('contract:radius'), 'and a 0 where Figma rounds differs'); }
  // parts are found in Figma's own tree by their names, never through the stored spec; two candidates are ambiguous
  {
    const set = structuredClone(setNode);
    for (const v of set.children) v.children.splice(1, 0, { ...structuredClone(v.children[0]), id: v.id + 't2' });
    const past = contract(); past.anatomy.label_3 = past.anatomy.label; delete past.anatomy.label;
    const r = compareContract('chip', set, past, ctx);
    assert.ok(kinds(r).includes('contract:ambiguous'), 'a third Label where two are drawn: ambiguous, never the first');
    assert.ok(!kinds(compareContract('chip', set, contract(), ctx)).includes('contract:ambiguous'), 'a lone label is the first of its name, as derive names it');
    assert.ok(!r.rows.some((x) => x.kind === 'contract:content'), 'an ambiguous part is not compared as if found');
    // a contract that keeps some of several same-named layers numbers them among the drawn ones (the walk keeps no hidden
    // layer): each is the drawn layer at its number
    { const s4 = structuredClone(setNode); for (const v of s4.children) v.children.splice(1, 0, { ...structuredClone(v.children[0]), id: v.id + 'h1', visible: false }, { ...structuredClone(v.children[0]), id: v.id + 't2' }, { ...structuredClone(v.children[0]), id: v.id + 't3' });
      const c7 = contract(); c7.anatomy.label_3 = { ...c7.anatomy.label, order: 2 }; delete c7.anatomy.label;
      const r7 = compareContract('chip', s4, c7, ctx);
      assert.ok(!kinds(r7).includes('contract:ambiguous') && !r7.rows.some((x) => x.kind === 'contract:part' && /label_3$/.test(x.path)), 'label_3 is the third drawn Label, the hidden one not counted'); }
  }
  // inside an instance: a field Figma has and the contract leaves unsaid is a row, as is a layer no part is
  {
    const inst = (v) => ({ id: v.id + 'i', name: 'Icon', type: 'INSTANCE', componentId: 'C:9', size: { x: 16, y: 16 }, relativeTransform: T(40, 8), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', opacity: 0.5,
      overrides: [{ id: 'x', overriddenFields: ['opacity'] }], children: [{ id: v.id + 'g', name: 'Glyph', type: 'VECTOR', size: { x: 12, y: 12 }, relativeTransform: T(2, 2) }] });
    const set = structuredClone(setNode); for (const v of set.children) v.children.push(inst(v));
    const c = contract(); c.anatomy.icon = { kind: 'instance', parent: 'root', order: 1, component: 'Icon', key: 'kset-icon', width: 16, height: 16 };
    const r = compareContract('chip', set, c, ctx);
    assert.ok(r.rows.some((x) => x.kind === 'contract:not stated' && x.path === 'icon.opacity'), 'the instance\'s own opacity, unsaid');
    assert.ok(r.rows.some((x) => x.kind === 'contract:not stated' && /Glyph/.test(x.path)), 'a layer inside a walked instance that no part is, its main without a contract');
    // another library's main, or one of this library's icons: what is inside is said there, a named skip; the
    // instance's own opacity (not its place) too, unless an instance overrides it
    const remote = { ...ctx, components: { ...ctx.components, 'C:9': { ...ctx.components['C:9'], remote: true } } };
    for (const [cx, why] of [[remote, /another library/], [{ ...ctx, icons: new Set(['Icon']) }, /an icon/]]) {
      const r2 = compareContract('chip', set, c, cx);
      assert.ok(!r2.rows.some((x) => x.kind === 'contract:not stated'), 'nothing left unsaid inside');
      assert.ok(Object.keys(r2.skipped).some((k) => why.test(k)), 'counted as a named skip');
    }
    const c2 = structuredClone(c); delete c2.anatomy.icon.width;
    const r3 = compareContract('chip', set, c2, remote);
    assert.ok(r3.rows.some((x) => x.kind === 'contract:not stated' && x.path === 'icon.width'), 'a placed instance\'s own size is the host\'s, never skipped');
    const set2 = structuredClone(set); for (const v of set2.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); i.overrides = [{ id: v.id + 'g', overriddenFields: ['fills'] }]; }
    assert.ok(compareContract('chip', set2, c, remote).rows.some((x) => x.kind === 'contract:not stated' && /Glyph/.test(x.path)), 'a layer an instance overrides stays a row');
    // only the field overridden stays a row: a colour override on the instance leaves its opacity the main's
    const own = (fields) => { const s = structuredClone(set); for (const v of s.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); i.overrides = [{ id: i.id, overriddenFields: fields }]; } return compareContract('chip', s, c, remote).rows.some((x) => x.kind === 'contract:not stated' && x.path === 'icon.opacity'); };
    assert.ok(!own(['fills']), 'a fill override is not an opacity one');
    assert.ok(own(['opacity']), 'an opacity override is the host\'s, unsaid');
    assert.ok(own(['someNewField']), 'a field no contract field maps keeps every row');
    // an inner layer the contract names: only its overridden field stays a row
    const c3 = structuredClone(c); c3.anatomy['icon/glyph'] = { kind: 'graphic', parent: 'icon', order: 0, name: 'Glyph' };
    const inner = (fields) => { const s = structuredClone(set); for (const v of s.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); i.children[0].opacity = 0.5; i.overrides = fields ? [{ id: v.id + 'g', overriddenFields: fields }] : []; } return compareContract('chip', s, c3, remote).rows.filter((x) => x.kind === 'contract:not stated' && /glyph/i.test(x.path)).map((x) => x.path.split('.').pop()); };
    assert.deepEqual(inner(null), [], 'nothing overridden: the glyph is its library\'s');
    assert.deepEqual(inner(['fills', 'exportSettings']), [], 'a colour override and an ignored one leave its opacity the main\'s');
    assert.ok(inner(['opacity']).includes('opacity'), 'its opacity, overridden here, unsaid: a row');
    // a text inside the instance tied to a property is tied to its component's, though the host has one of that name
    { const s = structuredClone(set); for (const v of s.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); i.children.push({ id: v.id + 'c', name: 'Caption', type: 'TEXT', size: { x: 10, y: 10 }, relativeTransform: T(0, 0), characters: 'Go', componentPropertyReferences: { characters: 'Label#9:9' } }); }
      const c5 = structuredClone(c); c5.anatomy['icon/caption'] = { kind: 'text', parent: 'icon', order: 1, name: 'Caption', content: 'Go' };
      assert.ok(!compareContract('chip', s, c5, ctx).rows.some((x) => x.kind === 'contract:content'), 'its words are what it draws, not the host\'s {label}');
      // by the host's own key it is the host's still (a property exposed deep down)
      const c6 = structuredClone(c5); c6.anatomy['icon/caption'].content = '{label}';
      const s3 = structuredClone(s); for (const v of s3.children) v.children.find((x) => x.type === 'INSTANCE').children.find((x) => x.name === 'Caption').componentPropertyReferences = { characters: 'Label#1:0' };
      assert.ok(!compareContract('chip', s3, c6, ctx).rows.some((x) => x.kind === 'contract:content'), 'the host\'s own key, deep down, is the host\'s {label}'); }
    // a chain with a contract-less main that is neither another library's nor an icon keeps its rows
    const chain = structuredClone(set); for (const v of chain.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); i.children[0] = { id: v.id + 'n', name: 'Nested', type: 'INSTANCE', componentId: 'C:4', size: { x: 12, y: 12 }, relativeTransform: T(2, 2), overrides: [{ id: v.id + 'nv', overriddenFields: ['fills'] }], children: [{ id: v.id + 'nv', name: 'Dot', type: 'VECTOR', size: { x: 4, y: 4 }, relativeTransform: T(0, 0) }] }; }
    const cx4 = { ...remote, components: { ...remote.components, 'C:4': { key: 'k-local', name: 'Local' } } };
    assert.ok(compareContract('chip', chain, c, cx4).rows.some((x) => x.kind === 'contract:not stated' && /Dot/.test(x.path)), 'a local main without a contract in the chain: not stated');
    // an icon's own place stays the host's too
    const c4 = structuredClone(c); delete c4.anatomy.icon.width;
    assert.ok(compareContract('chip', set, c4, { ...ctx, icons: new Set(['Icon']) }).rows.some((x) => x.kind === 'contract:not stated' && x.path === 'icon.width'));
    // a component this project stores, though remote (a sibling file's) or named as an icon: its insides stay unsaid
    for (const cx of [{ ...remote, own: new Set(['Icon']) }, { ...ctx, icons: new Set(['Icon']), own: new Set(['Icon']) }])
      assert.ok(compareContract('chip', set, c, cx).rows.some((x) => x.kind === 'contract:not stated' && /Glyph/.test(x.path)), 'the project\'s own component: not another library\'s');
    // …but a remote one that only shares a stored component's name, under another key, is another library's copy
    assert.ok(!compareContract('chip', set, c, { ...remote, own: new Set(['Icon']), ownKeys: new Map([['Icon', new Set(['k-ours'])]]) }).rows.some((x) => x.kind === 'contract:not stated' && /Glyph/.test(x.path)), 'a namesake: said there');
    assert.ok(compareContract('chip', set, c, { ...remote, own: new Set(['Icon']), ownKeys: new Map([['Icon', new Set([remote.components['C:9'].componentSetId ? remote.componentSets[remote.components['C:9'].componentSetId].key : remote.components['C:9'].key])]]) }).rows.some((x) => x.kind === 'contract:not stated' && /Glyph/.test(x.path)), 'its own key: ours');
    // a layer inside another library's component that an instance shows: the host's to say
    const shown = structuredClone(set); for (const v of shown.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); i.overrides = [{ id: v.id + 'g', overriddenFields: ['visible'] }]; }
    assert.ok(compareContract('chip', shown, c, remote).rows.some((x) => x.kind === 'contract:not stated' && /Glyph/.test(x.path)), 'a visibility override stays a row');
    // another library's instance nested in a main with a contract that does not name it: its presence is that main's gap
    {
      const nest = structuredClone(set);
      for (const v of nest.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); i.componentId = 'C:3'; i.children = [{ id: v.id + 'r', name: 'Remote', type: 'INSTANCE', componentId: 'C:2', size: { x: 4, y: 4 }, relativeTransform: T(0, 0), children: [{ id: v.id + 'rv', name: 'Shape', type: 'VECTOR', size: { x: 4, y: 4 }, relativeTransform: T(0, 0) }] }]; }
      const box = { contract: 1, component: 'Box', figma: { name: 'Box', key: 'k-box3' }, props: {}, anatomy: { root: { kind: 'container', width: 16, height: 16 } }, variants: [] };
      const cx = { ...ctx, components: { ...ctx.components, 'C:3': { key: 'k-box3', name: 'Box' }, 'C:2': { key: 'k-far', name: 'Far', remote: true } }, mains: (key) => (key === 'k-box3' ? box : null) };
      const c5 = structuredClone(c); c5.anatomy.icon = { ...c5.anatomy.icon, component: 'Box', key: 'k-box3' };
      const r5 = compareContract('chip', nest, c5, cx);
      assert.ok(r5.rows.some((x) => /Remote$/.test(x.path) && ['contract:part', 'contract:not stated'].includes(x.kind)), 'the nested instance itself is a row, not skipped');
      // named as a host part with its width unsaid: its place is a row, never skipped as its library's
      const c6 = structuredClone(c5); c6.anatomy['icon/remote'] = { kind: 'instance', parent: 'icon', order: 0, component: 'Far', key: 'k-far', name: 'Remote' };
      assert.ok(compareContract('chip', nest, c6, cx).rows.some((x) => x.kind === 'contract:not stated' && x.path === 'icon/remote.width'), 'a nested instance\'s own width, unsaid: a row');
    }
    // a main with no contract that is neither: still "not stated"
    assert.ok(compareContract('chip', set, c, { ...ctx, icons: new Set(['Other']) }).rows.some((x) => x.kind === 'contract:not stated'));
    // a glyph folded into its icon (derive's ownGlyph): the one graphic a contract-less instance draws, scaled both ways,
    // has its size, place and constraints from the icon's drawing, and the icon's clipping is its own; nothing a host
    // says, though the main is neither another library's nor an icon (and, deeper, inside one that is neither too)
    {
      const glyphed = (s0, f) => { const s = structuredClone(s0); for (const v of s.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); i.clipsContent = true; i.overrides = []; f(i, v); } return s; };
      const scaled = (i) => { i.children[0].constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; };
      const c7 = structuredClone(c); c7.anatomy['icon/glyph'] = { kind: 'graphic', parent: 'icon', order: 0, name: 'Glyph' }; delete c7.anatomy.icon.opacity;
      const unsaid = (s, cx = ctx, cc = c7) => compareContract('chip', s, cc, cx).rows.filter((x) => x.kind === 'contract:not stated' && /glyph\.|icon\.overflow/.test(x.path)).map((x) => x.path).sort();
      const r8 = compareContract('chip', glyphed(set, scaled), c7, ctx);
      assert.deepEqual(unsaid(glyphed(set, scaled)), [], 'the glyph\'s place and the icon\'s clipping: the icon\'s');
      assert.ok(Object.keys(r8.skipped).some((k) => /folded into its icon/.test(k)), 'counted as a named skip');
      assert.ok(unsaid(glyphed(set, () => {})).includes('icon/glyph.width'), 'a glyph not scaled both ways is placed by someone: a row');
      assert.ok(unsaid(glyphed(set, (i, v) => { scaled(i); i.children.push({ id: v.id + 'g2', name: 'Dot', type: 'VECTOR', size: { x: 2, y: 2 }, relativeTransform: T(0, 0) }); })).includes('icon/glyph.width'), 'one of two layers is no glyph folded: a row');
      const c8 = structuredClone(c7); c8.anatomy['icon/glyph'].width = 99;
      assert.ok(compareContract('chip', glyphed(set, scaled), c8, ctx).rows.some((x) => x.kind === 'contract:width' && x.path === 'icon/glyph'), 'a size the contract states is still compared');
      // the icon inside a contract-less, local main the host places: the same
      const deep = structuredClone(set); for (const v of deep.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); v.children[v.children.indexOf(i)] = { id: v.id + 'w', name: 'Wrap', type: 'INSTANCE', componentId: 'C:4', size: { x: 16, y: 16 }, relativeTransform: T(40, 8), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', overrides: [], children: [i] }; }
      const cx9 = { ...ctx, components: { ...ctx.components, 'C:4': { key: 'k-wrap', name: 'Wrap' } } };
      const c9 = structuredClone(c7); c9.anatomy.wrap = { kind: 'instance', parent: 'root', order: 1, component: 'Wrap', key: 'k-wrap', width: 16, height: 16 };
      c9.anatomy['wrap/icon'] = { ...c7.anatomy.icon, parent: 'wrap', order: 0 }; c9.anatomy['wrap/icon/glyph'] = { ...c7.anatomy['icon/glyph'], parent: 'wrap/icon' }; delete c9.anatomy.icon; delete c9.anatomy['icon/glyph'];
      const dr = compareContract('chip', glyphed(deep, (w) => { w.clipsContent = false; const i = w.children[0]; i.clipsContent = true; scaled(i); }), c9, cx9).rows.filter((x) => x.kind === 'contract:not stated');
      assert.ok(!dr.some((x) => /glyph\.|icon\.overflow/.test(x.path)), 'inside a local main: the icon\'s too');
    }
  }
  // inside an instance whose main has a contract: the main's expansion, the host's overrides over it, held to Figma
  {
    const inst = (v) => ({ id: v.id + 'i', name: 'Icon', type: 'INSTANCE', componentId: 'C:9', size: { x: 16, y: 16 }, relativeTransform: T(40, 8), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', opacity: 0.5,
      componentProperties: { Size: { type: 'VARIANT', value: '16' }, 'Tint#7:0': { type: 'TEXT', value: 'Go' }, 'Glyph#3:4': { type: 'INSTANCE_SWAP', value: 'C:8' } },
      overrides: [{ id: 'x', overriddenFields: ['opacity'] }], children: [
        { id: v.id + 'g', name: 'Glyph', type: 'VECTOR', size: { x: 12, y: 12 }, relativeTransform: T(2, 2) },
        { id: v.id + 'b', name: 'Badge', type: 'INSTANCE', componentId: 'C:8', size: { x: 4, y: 4 }, relativeTransform: T(0, 0), componentPropertyReferences: { mainComponent: 'Glyph#3:4' } },
        { id: v.id + 'n', name: 'Note', type: 'TEXT', size: { x: 10, y: 10 }, relativeTransform: T(0, 0), characters: 'Go', componentPropertyReferences: { characters: 'Tint#7:0' }, styles: { text: 'S:1' }, style: { fontSize: 14, textAlignHorizontal: 'LEFT', textAutoResize: 'NONE' } },
      ] });
    const set = structuredClone(setNode); for (const v of set.children) v.children.push(inst(v));
    const host = contract(); host.anatomy.icon = { kind: 'instance', parent: 'root', order: 1, component: 'Icon', key: 'kset-icon', with: { Size: '16', Tint: 'Go', Glyph: 'Star' }, width: 16, height: 16, opacity: 0.5 };
    const icon = () => ({ contract: 1, component: 'Icon', figma: { name: 'Icon', key: 'kset-icon' }, props: { size: { type: 'enum', values: ['s16', 's24'], figmaValues: ['16', '24'], default: 's24', figma: 'Size' }, tint: { type: 'string', default: 'x', figma: 'Tint' }, glyph: { type: 'instance', figma: 'Glyph', swaps: ['badge'] } },
      anatomy: { root: { kind: 'container', width: 24, height: 24 },
        glyph: { kind: 'graphic', parent: 'root', order: 0, width: 20, height: 20, absolute: { x: 2, y: 2 } },
        badge: { kind: 'instance', parent: 'root', order: 1, component: 'Dot', key: 'k-dot', width: 4, height: 4, absolute: { x: 0, y: 0 } },
        note: { kind: 'text', parent: 'root', order: 2, width: 10, height: 10, absolute: { x: 0, y: 0 }, content: '{tint}', typography: 'Body/md', textAlign: 'start', autoResize: 'none' } },
      variants: [{ when: { size: 's16' }, set: { 'root.width': 16, 'root.height': 16, 'glyph.width': 12, 'glyph.height': 12 } }] });
    const mains = (key) => (key === 'kset-icon' ? icon() : null);
    const r = compareContract('chip', set, host, { ...ctx, mains });
    assert.deepEqual(r.rows, [], 'the main\'s own contract, at the instance\'s props, says what Figma draws');
    const plain = compareContract('chip', set, host, ctx);
    assert.ok(r.checked > plain.checked, 'the insides are checked, not skipped');
    // a vector the main's contract says is rounded per vertex (mixed), REST silent: a skip, never a row
    { const mx = icon(); mx.anatomy.glyph.radius = 'mixed';
      assert.ok(!compareContract('chip', set, host, { ...ctx, mains: () => mx }).rows.some((x) => x.kind === 'contract:radius'), 'the main\'s mixed: skipped'); }
    // the main's own swap property on one of its parts is the main's to say: at the host it is no row
    { const sw = icon(); sw.anatomy.badge.swappedBy = 'tint';
      assert.ok(!compareContract('chip', set, host, { ...ctx, mains: () => sw }).rows.some((x) => x.kind === 'contract:swappedBy'), 'the main\'s swap: not the host\'s'); }
    // a slot the main fills from its own slot property: what the instance puts there is the instance's, no row at the host
    { const sl = icon(); sl.props.items = { type: 'slot', figma: 'Items' }; sl.anatomy.items = { kind: 'slot', parent: 'root', order: 3, width: 10, height: 10, absolute: { x: 0, y: 0 }, content: '{items}' };
      const withSlot = structuredClone(set); for (const v of withSlot.children) v.children.find((x) => x.type === 'INSTANCE').children.push({ id: v.id + 's', name: 'Items', type: 'SLOT', size: { x: 10, y: 10 }, relativeTransform: T(0, 0), componentPropertyReferences: { slotContentId: 'Items#1:1' } });
      const rs = compareContract('chip', withSlot, host, { ...ctx, mains: () => sl });
      assert.ok(!rs.rows.some((x) => x.kind === 'contract:content'), 'the main\'s slot property: not the host\'s');
      assert.ok(rs.rows.length === 0, 'and the slot itself is held to the main: ' + JSON.stringify(rs.rows)); }
    // …whatever value the instance gives the slot property, a string one included: never taken as the slot's words
    { const sl = icon(); sl.props.items = { type: 'slot', figma: 'Items' }; sl.anatomy.items = { kind: 'slot', parent: 'root', order: 3, width: 10, height: 10, absolute: { x: 0, y: 0 }, content: '{items}' };
      const withSlot = structuredClone(set); for (const v of withSlot.children) { const i = v.children.find((x) => x.type === 'INSTANCE'); i.componentProperties = { ...i.componentProperties, 'Items#1:1': { type: 'SLOT', value: 'Filled' } };
        i.children.push({ id: v.id + 's', name: 'Items', type: 'SLOT', size: { x: 10, y: 10 }, relativeTransform: T(0, 0), componentPropertyReferences: { slotContentId: 'Items#1:1' } }); }
      const rs = compareContract('chip', withSlot, host, { ...ctx, mains: () => sl });
      assert.ok(!rs.rows.some((x) => x.kind === 'contract:content'), 'a string slot value: no content row ' + JSON.stringify(rs.rows)); }
    // a main that says otherwise is a real row, never "not stated"
    const wrong = icon(); wrong.variants[0].set['glyph.width'] = 14;
    const r2 = compareContract('chip', set, host, { ...ctx, mains: () => wrong });
    assert.ok(r2.rows.some((x) => x.kind === 'contract:width' && /Glyph/.test(x.path)), 'the expansion differs from Figma: a row of the field');
    assert.ok(!r2.rows.some((x) => x.kind === 'contract:not stated'));
    // the host's override, unsaid, is a difference once the main says the field
    const h2 = contract(); h2.anatomy.icon = { ...host.anatomy.icon }; delete h2.anatomy.icon.opacity;
    assert.ok(compareContract('chip', set, h2, { ...ctx, mains }).rows.some((x) => x.kind === 'contract:opacity' && x.path === 'icon'));
    // a layer Figma draws inside it that neither the host nor the main says is a part row
    const set2 = structuredClone(set); for (const v of set2.children) v.children.find((c) => c.type === 'INSTANCE').children.push({ id: v.id + 'x', name: 'Extra', type: 'FRAME', size: { x: 1, y: 1 }, relativeTransform: T(0, 0) });
    assert.ok(compareContract('chip', set2, host, { ...ctx, mains }).rows.some((x) => x.kind === 'contract:part' && /Extra/.test(x.path)));
    // a main enum with no Figma spelling: the instance's value is not guessed and the default never expanded by accident
    const bare = icon(); delete bare.props.size.figmaValues;
    const r4 = compareContract('chip', set, host, { ...ctx, mains: () => bare });
    assert.ok(!r4.rows.some((x) => /Glyph/.test(x.path) && x.kind === 'contract:width'), 'not held to the default (24) variant');
    assert.ok(r4.skipped["an instance's props its main's contract cannot spell"] > 0, 'counted as skipped');
    // no contract for the main: the fields stay "not stated"
    const r3 = compareContract('chip', set, h2, { ...ctx, mains: () => null });
    assert.ok(r3.rows.some((x) => x.kind === 'contract:not stated' && x.path === 'icon.opacity'));
  }
  // a layer stretched with neither width nor end said has its width held to Figma's box
  {
    const set = structuredClone(setNode);
    for (const v of set.children) { delete v.layoutMode; v.children[0].constraints = { horizontal: 'LEFT_RIGHT', vertical: 'TOP' }; }
    const c = contract(); delete c.anatomy.root.layout; delete c.anatomy.label.width; c.anatomy.label.absolute = { x: 8, y: 6 }; c.anatomy.label.constraints = { horizontal: 'stretch', vertical: 'min' };
    assert.ok(compareContract('chip', set, c, ctx).rows.some((x) => x.kind === 'contract:width' && x.path === 'label'));
  }
  // a placed instance's size is its placement's, never its main's root's, and the size an empty main keeps only while
  // empty (whileEmpty) is not the instance's: a ring stretched round its box, its end and bottom said, sized by them
  {
    const ring = (v) => ({ id: v.id + 'r', name: 'Ring', type: 'INSTANCE', componentId: 'C:7', size: { x: v.size.x + 4, y: 36 }, relativeTransform: T(-2, -2), layoutPositioning: 'ABSOLUTE', constraints: { horizontal: 'LEFT_RIGHT', vertical: 'TOP_BOTTOM' }, layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', children: [] });
    const set = structuredClone(setNode); for (const v of set.children) v.children.push(ring(v));
    const c = contract(); c.anatomy.ring = { kind: 'instance', parent: 'root', order: 1, component: 'Ring', key: 'k-ring', position: 'absolute', absolute: { x: -2, y: -2, end: -2, bottom: -2 }, constraints: { horizontal: 'stretch', vertical: 'stretch' } };
    const main = { contract: 1, component: 'Ring', figma: { name: 'Ring', key: 'k-ring' }, props: {}, anatomy: { root: { kind: 'container', width: 'hug', height: 'hug', minWidth: 69, minHeight: 40, whileEmpty: ['minWidth', 'minHeight'] } }, variants: [] };
    const cx = { ...ctx, components: { ...ctx.components, 'C:7': { key: 'k-ring', name: 'Ring' } }, mains: (key) => (key === 'k-ring' ? main : null) };
    const rows = compareContract('chip', set, c, cx).rows.filter((x) => x.path === 'ring');
    assert.deepEqual(rows, [], 'neither the main\'s hug nor its empty minimum is held to the placed ring');
    assert.ok(compareContract('chip', set, c, cx).skipped["minWidth: an empty main's minimum (whileEmpty), an instance's keeps none"] > 0, 'the minimum dropped is counted as skipped');
    // with no contract for its main, its size is still its place's (end and bottom said): no "not stated" size, skipped
    const none = compareContract('chip', set, c, { ...cx, mains: () => null });
    assert.ok(!none.rows.some((x) => x.kind === 'contract:not stated' && /^ring\.(width|height)$/.test(x.path)), 'a stretched size its place says is not unstated ' + JSON.stringify(none.rows));
    assert.ok(none.skipped["width: said by the stretched layer's end"] > 0, 'and counted as skipped');
  }
  // a styled text's decoration and case are its style's: unsaid by a contract that names the style, skipped
  {
    const set = structuredClone(setNode); for (const v of set.children) Object.assign(v.children[0].style, { textDecoration: 'UNDERLINE', textCase: 'UPPER' });
    const r = compareContract('chip', set, contract(), ctx);
    assert.ok(!r.rows.some((x) => /textDecoration|textCase/.test(x.kind)), 'no row for a styled text\'s decoration or case ' + JSON.stringify(r.rows));
    assert.ok(r.skipped["textDecoration: a styled text's, unsaid"] > 0 && r.skipped["textCase: a styled text's, unsaid"] > 0, 'both counted as skipped');
    // one the contract states is compared; a literal text's is held
    const said = contract(); said.anatomy.label.textDecoration = 'strikethrough';
    assert.ok(compareContract('chip', set, said, ctx).rows.some((x) => x.kind === 'contract:textDecoration'), 'a stated decoration is held');
    const lit = structuredClone(set); for (const v of lit.children) delete v.children[0].styles;
    assert.ok(compareContract('chip', lit, contract(), ctx).rows.some((x) => x.kind === 'contract:textDecoration'), 'a literal text\'s decoration is held');
    // and inside an instance whose main has no contract: a styled text's spacing the part leaves to the style it names is
    // no "not stated" row
    const tagged = structuredClone(setNode);
    for (const v of tagged.children) v.children.push({ id: v.id + 'g', name: 'Tag', type: 'INSTANCE', componentId: 'C:7', size: { x: 30, y: 20 }, relativeTransform: T(40, 6), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', children: [
      { id: v.id + 'gt', name: 'Name', type: 'TEXT', size: { x: 30, y: 20 }, relativeTransform: T(0, 0), characters: 'Tag', styles: { text: 'S:1' }, fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }], style: { ...v.children[0].style, letterSpacing: 0.5 } }] });
    const tc = contract(); tc.anatomy.tag = { kind: 'instance', parent: 'root', order: 1, component: 'Tag', key: 'k-tag', width: 30, height: 20 };
    tc.anatomy['tag/name'] = { kind: 'text', parent: 'tag', order: 0, typography: 'Body/md', content: 'Tag' };
    const tr = compareContract('chip', tagged, tc, { ...ctx, components: { ...ctx.components, 'C:7': { key: 'k-tag', name: 'Tag' } }, mains: () => null });
    assert.ok(tr.rows.some((x) => x.path.startsWith('tag/name.')), 'the text\'s other unstated fields stay rows');
    assert.ok(!tr.rows.some((x) => x.path === 'tag/name.letterSpacing'), 'a styled text\'s spacing is not unstated ' + JSON.stringify(tr.rows.filter((x) => /letter/.test(x.path))));
    // inside another library's component: its styled text's decoration is that library's to say, unless the instance
    // overrides it here, when it stays a row (derive never states it, so the row is the override's only signal)
    const remote = (ov) => { const s2 = structuredClone(tagged); for (const v of s2.children) { const g = v.children.find((c) => c.name === 'Tag'); g.children[0].style.textDecoration = 'UNDERLINE'; if (ov) g.overrides = [{ id: g.children[0].id, overriddenFields: ['textDecoration'] }]; } return s2; };
    const rcx = { ...ctx, components: { ...ctx.components, 'C:7': { key: 'k-tag', name: 'Tag', remote: true } }, mains: () => null };
    const deco = (ov) => compareContract('chip', remote(ov), tc, rcx).rows.filter((x) => x.path === 'tag/name.textDecoration');
    assert.equal(deco(false).length, 0, 'not overridden: left to its library');
    assert.ok(deco(true).length > 0, 'overridden here: a row');
  }
  // an instance whose fill the host overrides (its own paint, the style detached) keeps none of its main's fill style
  {
    const red = { r: 1, g: 0, b: 0, a: 1 };
    const box = (v) => ({ id: v.id + 'b', name: 'Box', type: 'INSTANCE', componentId: 'C:6', size: { x: 10, y: 10 }, relativeTransform: T(40, 8), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', fills: [{ type: 'SOLID', color: red }], children: [] });
    const set = structuredClone(setNode); for (const v of set.children) v.children.push(box(v));
    const c = contract(); c.anatomy.box = { kind: 'instance', parent: 'root', order: 1, component: 'Box', key: 'k-box', width: 10, height: 10, background: '#ff0000' };
    const main = { contract: 1, component: 'Box', figma: { name: 'Box', key: 'k-box' }, props: {}, anatomy: { root: { kind: 'container', width: 10, height: 10, background: 'rgb(0 0 0 / 0)', fillStyle: 'Clear/Clear' } }, variants: [] };
    const cx = { ...ctx, components: { ...ctx.components, 'C:6': { key: 'k-box', name: 'Box' } }, mains: (key) => (key === 'k-box' ? main : null) };
    assert.deepEqual(compareContract('chip', set, c, cx).rows.filter((x) => x.path === 'box'), [], 'the host\'s paint is the whole fill');
    // and one the host leaves its main's fill keeps the main's style, held
    const c2 = contract(); c2.anatomy.box = { ...c.anatomy.box }; delete c2.anatomy.box.background;
    assert.ok(compareContract('chip', set, c2, cx).rows.some((x) => x.path === 'box' && x.kind === 'contract:fillStyle'), 'the main\'s style, where Figma has none, a row');
  }
  // a part turned a quarter: its words swapped where the contract draws it in a wrapper, as it stands where it is placed
  {
    const turn = (v, abs) => ({ id: v.id + 'q', name: 'Spacer', type: 'LINE', size: { x: 16, y: 0 }, relativeTransform: [[0, -1, 40], [1, 0, 0]], layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FILL', ...(abs && { layoutPositioning: 'ABSOLUTE' }), children: [] });
    const rowsOf = (abs, width, height) => {
      const set = structuredClone(setNode); for (const v of set.children) v.children.push(turn(v, abs));
      const c = contract(); c.anatomy.spacer = { kind: 'graphic', parent: 'root', order: 1, width, height, rotation: -90, ...(abs && { position: 'absolute', absolute: { x: 40, y: 0 } }) };
      return compareContract('chip', set, c, ctx).rows.filter((x) => x.path === 'spacer' && /width|height/.test(x.kind));
    };
    assert.deepEqual(rowsOf(false, 'fill', 0), [], 'drawn in a wrapper: its own axes');
    assert.deepEqual(rowsOf(true, 16, 'fill'), [], 'placed, turned in place: Figma\'s order, its own size');
  }
  // inside a resized instance, a layer its constraints move with the instance's box is held where they put it: its
  // main's place and size moved as each constraint says (scaled, at the far edge, centred, stretched) by how much its
  // parent grew; where the main's parent size is not known (a root that fills), skipped, counted
  {
    const H2 = { min: 'LEFT', max: 'RIGHT', center: 'CENTER', stretch: 'LEFT_RIGHT', scale: 'SCALE' };
    const anim = (v, w, sizing, bar) => ({ id: v.id + 'a', name: 'Anim', type: 'INSTANCE', componentId: 'C:5', size: { x: w, y: 16 }, relativeTransform: T(40, 8), layoutSizingHorizontal: sizing, layoutSizingVertical: 'FIXED', clipsContent: true,
      overrides: [{ id: v.id + 'a', overriddenFields: ['width'] }],
      children: [{ id: v.id + 'ab', name: 'Bar', type: 'RECTANGLE', size: { x: bar.w, y: 16 }, relativeTransform: T(bar.x, 0), constraints: { horizontal: H2[bar.c], vertical: 'TOP' } }] });
    const mainOf = (rootW, bar) => ({ contract: 1, component: 'Anim', figma: { name: 'Anim', key: 'k-anim' }, props: {}, anatomy: { root: { kind: 'container', width: rootW, height: 16, overflow: 'hidden' },
      bar: { kind: 'graphic', parent: 'root', order: 0, width: bar.w, height: 16, shape: 'rectangle', constraints: { horizontal: bar.c, vertical: 'min' }, absolute: { x: bar.x, y: 0 } } }, variants: [] });
    const run = ({ rootW = 160, w, sizing = 'FIXED', main, drawn }) => {
      const set = structuredClone(setNode); for (const v of set.children) v.children.push(anim(v, w, sizing, drawn));
      const c = contract(); c.anatomy.anim = { kind: 'instance', parent: 'root', order: 1, component: 'Anim', key: 'k-anim', width: sizing === 'HUG' ? 'hug' : w, height: 16 };
      c.anatomy['anim/bar'] = { kind: 'graphic', parent: 'anim', order: 0, shape: 'rectangle' };
      const M = mainOf(rootW, main);
      const r = compareContract('chip', set, c, { ...ctx, components: { ...ctx.components, 'C:5': { key: 'k-anim', name: 'Anim' } }, mains: (key) => (key === 'k-anim' ? M : null) });
      return { rows: r.rows.filter((x) => x.path === 'anim/bar'), skipped: r.skipped["absolute: the main's, moved by its constraints in a resized instance"] || 0 };
    };
    const clean = (r, why) => { assert.deepEqual(r.rows, [], why); assert.equal(r.skipped, 0, why + ': checked, not skipped'); };
    // an instance that stops its main's clip says so (rules.mjs UNCLIPPED): held to Figma's no clip, and a clip there a row;
    // one that says nothing is its main's clip, and Figma's none there a row
    {
      const clipRows = (clips, said) => {
        const set = structuredClone(setNode); for (const v of set.children) { const x = anim(v, 160, 'FIXED', { c: 'min', x: 0, w: 160 }); x.clipsContent = clips; v.children.push(x); }
        const c = contract(); c.anatomy.anim = { kind: 'instance', parent: 'root', order: 1, component: 'Anim', key: 'k-anim', width: 160, height: 16, ...(said && { overflow: said }) };
        const M = mainOf(160, { c: 'min', x: 0, w: 160 });
        return compareContract('chip', set, c, { ...ctx, components: { ...ctx.components, 'C:5': { key: 'k-anim', name: 'Anim' } }, mains: (key) => (key === 'k-anim' ? M : null) }).rows.filter((x) => x.path === 'anim' && x.kind === 'contract:overflow');
      };
      assert.deepEqual(clipRows(false, 'visible'), [], 'a clip said stopped, none in Figma: no row');
      assert.ok(clipRows(true, 'visible').length > 0, 'a clip said stopped, Figma clipping: a row');
      assert.deepEqual(clipRows(true, undefined), [], 'nothing said, its main\'s clip, Figma clipping: no row');
      assert.ok(clipRows(false, undefined).length > 0, 'nothing said, its main\'s clip, none in Figma: a row');
    }
    clean(run({ w: 80, main: { c: 'scale', x: -160, w: 160 }, drawn: { c: 'scale', x: -80, w: 80 } }), 'scaled with the instance');
    assert.ok(run({ w: 80, main: { c: 'scale', x: -160, w: 160 }, drawn: { c: 'scale', x: -60, w: 80 } }).rows.some((x) => x.kind === 'contract:absolute.x'), 'scaled elsewhere than the constraint puts it: a row');
    assert.ok(run({ w: 80, main: { c: 'scale', x: -160, w: 160 }, drawn: { c: 'scale', x: -80, w: 60 } }).rows.some((x) => x.kind === 'contract:width'), 'scaled to another size: a row');
    clean(run({ w: 80, main: { c: 'max', x: 140, w: 20 }, drawn: { c: 'max', x: 60, w: 20 } }), 'at the far edge, moved with it');
    assert.ok(run({ w: 80, main: { c: 'max', x: 140, w: 20 }, drawn: { c: 'max', x: 140, w: 20 } }).rows.some((x) => x.kind === 'contract:absolute.x'), 'not moved with the far edge: a row');
    clean(run({ w: 80, main: { c: 'center', x: 70, w: 20 }, drawn: { c: 'center', x: 30, w: 20 } }), 'centred, moved half as far');
    clean(run({ w: 80, main: { c: 'stretch', x: 10, w: 140 }, drawn: { c: 'stretch', x: 10, w: 60 } }), 'stretched, its size grown with its parent');
    assert.ok(run({ w: 80, main: { c: 'stretch', x: 10, w: 140 }, drawn: { c: 'stretch', x: 20, w: 60 } }).rows.some((x) => x.kind === 'contract:absolute.x'), 'a stretched layer\'s x, held');
    clean(run({ rootW: 'hug', w: 160, sizing: 'HUG', main: { c: 'scale', x: -160, w: 160 }, drawn: { c: 'scale', x: -160, w: 160 } }), 'a main that hugs, placed hugging: not resized');
    const fill = run({ rootW: 'fill', w: 80, main: { c: 'scale', x: -160, w: 160 }, drawn: { c: 'scale', x: -80, w: 80 } });
    assert.ok(fill.rows.length === 0 && fill.skipped > 0, 'a main that fills: its size unknown, skipped, counted');
    // a turned layer's place is its turned box's, which the constraints move about its own axes: not predicted, skipped
    const turned = (() => { const set = structuredClone(setNode); for (const v of set.children) { const x = anim(v, 80, 'FIXED', { c: 'scale', x: -80, w: 80 }); x.children[0].relativeTransform = [[0, 1, -80], [-1, 0, 16]]; v.children.push(x); }
      const c = contract(); c.anatomy.anim = { kind: 'instance', parent: 'root', order: 1, component: 'Anim', key: 'k-anim', width: 80, height: 16 }; c.anatomy['anim/bar'] = { kind: 'graphic', parent: 'anim', order: 0, shape: 'rectangle' };
      const M = mainOf(160, { c: 'scale', x: -160, w: 160 }); M.anatomy.bar.rotation = 90; M.anatomy.bar.absolute.y = 16;
      return compareContract('chip', set, c, { ...ctx, components: { ...ctx.components, 'C:5': { key: 'k-anim', name: 'Anim' } }, mains: (key) => (key === 'k-anim' ? M : null) }); })();
    assert.ok(!turned.rows.some((x) => x.path === "anim/bar" && /absolute/.test(x.kind)) && turned.skipped["absolute: the main's, moved by its constraints in a resized instance"] > 0, 'a turned layer: skipped, counted');
  }
  // the same, on the vertical axis; through a stretched frame whose size its main says by its edges alone; and a size an
  // instance around the layer, an outer one too, lists as overridden: a stated value, held as said, never predicted
  {
    const cx2 = (M, W) => ({ ...ctx, components: { ...ctx.components, 'C:5': { key: 'k-anim', name: 'Anim' }, 'C:7': { key: 'k-wrap', name: 'Wrap' } }, mains: (key) => (key === 'k-anim' ? M : key === 'k-wrap' ? W : null) });
    const W = { contract: 1, component: 'Wrap', figma: { name: 'Wrap', key: 'k-wrap' }, props: {}, anatomy: { root: { kind: 'container', width: 160, height: 16 }, anim: { kind: 'instance', parent: 'root', order: 0, component: 'Anim', key: 'k-anim', width: 160, height: 16 } }, variants: [] };
    const run = ({ M, inst, parts, wrap = null }) => {
      const set = structuredClone(setNode);
      for (const v of set.children) { const a = inst(v); v.children.push(wrap ? { id: v.id + 'w', name: 'Wrap', type: 'INSTANCE', componentId: 'C:7', size: a.size, relativeTransform: T(40, 8), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', overrides: wrap(v), children: [{ ...a, relativeTransform: T(0, 0) }] } : a); }
      const c = contract(); const pre = wrap ? 'wrap/' : '';
      if (wrap) c.anatomy.wrap = { kind: 'instance', parent: 'root', order: 1, component: 'Wrap', key: 'k-wrap', width: inst({ id: 'x' }).size.x, height: inst({ id: 'x' }).size.y };
      for (const [k, e] of Object.entries(parts)) c.anatomy[pre + k] = { ...e, parent: e.parent === 'root' ? (wrap ? 'wrap' : 'root') : pre + e.parent };
      return compareContract('chip', set, c, cx2(M, W)).rows.filter((x) => x.path.startsWith(pre + 'anim/'));
    };
    // vertical: at the bottom edge of a box 16 tall drawn 8 tall, moved up by 8
    const Mv = { contract: 1, component: 'Anim', figma: { name: 'Anim', key: 'k-anim' }, props: {}, anatomy: { root: { kind: 'container', width: 160, height: 16 }, bar: { kind: 'graphic', parent: 'root', order: 0, width: 160, height: 4, shape: 'rectangle', constraints: { horizontal: 'min', vertical: 'max' }, absolute: { x: 0, y: 12 } } }, variants: [] };
    const vInst = (y) => (v) => ({ id: v.id + 'a', name: 'Anim', type: 'INSTANCE', componentId: 'C:5', size: { x: 160, y: 8 }, relativeTransform: T(40, 8), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', overrides: [{ id: v.id + 'a', overriddenFields: ['height'] }],
      children: [{ id: v.id + 'ab', name: 'Bar', type: 'RECTANGLE', size: { x: 160, y: 4 }, relativeTransform: T(0, y), constraints: { horizontal: 'LEFT', vertical: 'BOTTOM' } }] });
    const vParts = { anim: { kind: 'instance', parent: 'root', order: 1, component: 'Anim', key: 'k-anim', width: 160, height: 8 }, 'anim/bar': { kind: 'graphic', parent: 'anim', order: 0, shape: 'rectangle' } };
    assert.deepEqual(run({ M: Mv, inst: vInst(4), parts: vParts }), [], 'vertical: at the bottom edge, moved with it');
    assert.ok(run({ M: Mv, inst: vInst(12), parts: vParts }).some((x) => x.kind === 'contract:absolute.y'), 'vertical: left at the main\'s y, a row');
    // nested: a box stretched 10 in from each side (no width of its own), its bar at its far edge
    const Mn = { contract: 1, component: 'Anim', figma: { name: 'Anim', key: 'k-anim' }, props: {}, anatomy: { root: { kind: 'container', width: 160, height: 16 },
      box: { kind: 'container', parent: 'root', order: 0, height: 16, constraints: { horizontal: 'stretch', vertical: 'min' }, absolute: { x: 10, y: 0, end: 10 } },
      'box/bar': { kind: 'graphic', parent: 'box', order: 0, width: 20, height: 16, shape: 'rectangle', constraints: { horizontal: 'max', vertical: 'min' }, absolute: { x: 120, y: 0 } } }, variants: [] };
    const nInst = (bx) => (v) => ({ id: v.id + 'a', name: 'Anim', type: 'INSTANCE', componentId: 'C:5', size: { x: 80, y: 16 }, relativeTransform: T(40, 8), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', overrides: [{ id: v.id + 'a', overriddenFields: ['width'] }],
      children: [{ id: v.id + 'ab', name: 'Box', type: 'FRAME', size: { x: 60, y: 16 }, relativeTransform: T(10, 0), constraints: { horizontal: 'LEFT_RIGHT', vertical: 'TOP' },
        children: [{ id: v.id + 'abc', name: 'Bar', type: 'RECTANGLE', size: { x: 20, y: 16 }, relativeTransform: T(bx, 0), constraints: { horizontal: 'RIGHT', vertical: 'TOP' } }] }] });
    const nParts = { anim: { kind: 'instance', parent: 'root', order: 1, component: 'Anim', key: 'k-anim', width: 80, height: 16 }, 'anim/box': { kind: 'container', parent: 'anim', order: 0 }, 'anim/box/bar': { kind: 'graphic', parent: 'anim/box', order: 0, shape: 'rectangle' } };
    assert.deepEqual(run({ M: Mn, inst: nInst(40), parts: nParts }).filter((x) => x.path === 'anim/box/bar'), [], 'nested: the box\'s size its main says by its edges, the bar moved with its far edge');
    assert.ok(run({ M: Mn, inst: nInst(120), parts: nParts }).some((x) => x.path === 'anim/box/bar' && x.kind === 'contract:absolute.x'), 'nested: left at the main\'s x, a row');
    // listed: the bar drawn 50 wide where scaling would make it 80, its width listed as overridden (on the instance, or on
    // an instance around it): the main's width compared, never the prediction; the host saying 50 holds it
    const Ms = { contract: 1, component: 'Anim', figma: { name: 'Anim', key: 'k-anim' }, props: {}, anatomy: { root: { kind: 'container', width: 160, height: 16 }, bar: { kind: 'graphic', parent: 'root', order: 0, width: 160, height: 16, shape: 'rectangle', constraints: { horizontal: 'scale', vertical: 'min' }, absolute: { x: 0, y: 0 } } }, variants: [] };
    const sInst = (own) => (v) => ({ id: v.id + 'a', name: 'Anim', type: 'INSTANCE', componentId: 'C:5', size: { x: 80, y: 16 }, relativeTransform: T(40, 8), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', overrides: [{ id: v.id + 'a', overriddenFields: ['width'] }, ...(own ? [{ id: v.id + 'ab', overriddenFields: ['width'] }] : [])],
      children: [{ id: v.id + 'ab', name: 'Bar', type: 'RECTANGLE', size: { x: 50, y: 16 }, relativeTransform: T(0, 0), constraints: { horizontal: 'SCALE', vertical: 'TOP' } }] });
    const sParts = (w) => ({ anim: { kind: 'instance', parent: 'root', order: 1, component: 'Anim', key: 'k-anim', width: 80, height: 16 }, 'anim/bar': { kind: 'graphic', parent: 'anim', order: 0, shape: 'rectangle', ...(w && { width: w }) } });
    const width = (rows) => rows.find((x) => x.kind === 'contract:width');
    assert.equal((width(run({ M: Ms, inst: sInst(false), parts: sParts() })) || {}).ours, 80, 'unlisted: the scaled width predicted');
    assert.equal((width(run({ M: Ms, inst: sInst(true), parts: sParts() })) || {}).ours, 160, 'listed on the instance: the main\'s width, as said');
    assert.equal((width(run({ M: Ms, inst: sInst(false), parts: sParts(), wrap: (v) => [{ id: v.id + 'ab', overriddenFields: ['width'] }] })) || {}).ours, 160, 'listed on an instance around it: the main\'s width, as said');
    assert.equal(width(run({ M: Ms, inst: sInst(true), parts: sParts(50) })), undefined, 'listed and said by the host: held');
  }
  // an instance that clears its main's colour style or stroke says `none`: held to Figma's having neither
  {
    const box = (v, strokes) => ({ id: v.id + 'b', name: 'Box', type: 'INSTANCE', componentId: 'C:6', size: { x: 10, y: 10 }, relativeTransform: T(40, 8), layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', fills: [], strokes, strokeWeight: 1, children: [] });
    const main = { contract: 1, component: 'Box', figma: { name: 'Box', key: 'k-box' }, props: {}, anatomy: { root: { kind: 'container', width: 10, height: 10, fillStyle: 'Clear/Clear', border: { color: '#000000', width: 1 } } }, variants: [] };
    const cx = { ...ctx, components: { ...ctx.components, 'C:6': { key: 'k-box', name: 'Box' } }, mains: (key) => (key === 'k-box' ? main : null) };
    const run = (strokes) => { const set = structuredClone(setNode); for (const v of set.children) v.children.push(box(v, strokes)); const c = contract(); c.anatomy.box = { kind: 'instance', parent: 'root', order: 1, component: 'Box', key: 'k-box', width: 10, height: 10, fillStyle: 'none', border: 'none' }; return compareContract('chip', set, c, cx).rows.filter((x) => x.path === 'box'); };
    assert.deepEqual(run([]), [], 'cleared in Figma, said cleared: no row');
    assert.ok(run([{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }]).some((x) => x.kind === 'contract:border'), 'a stroke Figma draws, said cleared: a row');
  }
  // the walk keeps an instance's first eight overrides, then a style's alone is left out: REST's list is cut the same way
  {
    const fields = [['inheritFillStyleId'], ['fills', 'inheritFillStyleId'], ['inheritFillStyleId'], ['fills'], ['inheritFillStyleId'], ['fills'], ['inheritFillStyleId'], ['inheritFillStyleId'], ['fills'], ['fills']];
    const set = structuredClone(setNode);
    for (const v of set.children) v.children.push({ id: v.id + 'i', name: 'Icon', type: 'INSTANCE', componentId: 'C:9', size: { x: 16, y: 16 }, relativeTransform: T(40, 8), overrides: fields.map((f, i) => ({ id: `${v.id}i;${i}`, overriddenFields: f })), children: [] });
    const s = storedFull();
    for (const v of s.variants) v.children.push({ name: 'Icon', type: 'INSTANCE', overrides: fields.slice(0, 8).map((f) => f.map((x) => x.replace('inheritFillStyleId', 'fillStyleId')).join(',')), children: [] });
    assert.deepEqual(compareSpec('chip', set, s, ctx).rows.filter((x) => x.kind === 'spec:overrides'), [], 'three of the first eight, not four of ten');
    // an effect style's override is REST's `effects` where the plugin API says effectStyleId
    for (const v of set.children) v.children.at(-1).overrides[0].overriddenFields = ['effects', 'inheritFillStyleId'];
    for (const v of s.variants) v.children.at(-1).overrides[0] = 'effectStyleId,fillStyleId';
    assert.deepEqual(compareSpec('chip', set, s, ctx).rows.filter((x) => x.kind === 'spec:overrides'), [], 'one override, named two ways');
    // and a stroke style's, REST's `strokes`
    for (const v of set.children) v.children.at(-1).overrides[2].overriddenFields = ['strokes'];
    for (const v of s.variants) v.children.at(-1).overrides[2] = 'strokeStyleId';
    assert.deepEqual(compareSpec('chip', set, s, ctx).rows.filter((x) => x.kind === 'spec:overrides'), [], 'a stroke style\'s, named two ways');
  }
  // the counts: a component nothing was checked on is not checked, never a match
  const R = (checked, rows = [], skipped = {}) => ({ rows, checked, skipped });
  const rep = report('lib', [
    { component: 'chip', spec: R(10), contract: R(5) },
    { component: 'other', spec: R(10, [{ kind: 'spec:gap', against: 'spec', component: 'other' }]), contract: R(5) },
    { component: 'empty', spec: R(0, [], { 'textStyle of mixed text': 2 }), contract: R(0) },
    { component: 'gone', missing: true },
    { component: 'unsaid', spec: R(4), contract: R(3, [{ kind: 'contract:not stated', against: 'contract', component: 'unsaid' }, { kind: 'contract:not stated', against: 'contract', component: 'unsaid' }]) },
  ]);
  assert.deepEqual(rep.spec, { matched: 2, differing: 1, notStated: 0, notChecked: 2, checked: 24, skipped: 2, differences: 1, unstated: 0 });
  // "not stated" is its own column: a component with only those is neither a match nor a difference
  assert.deepEqual(rep.contract, { matched: 2, differing: 0, notStated: 1, notChecked: 2, checked: 13, skipped: 0, differences: 0, unstated: 2 });
  assert.deepEqual([rep.components, rep.unread, rep.both], [5, 1, 1]);
  assert.equal(rep.top[0].kind, 'spec:gap');
  assert.ok(!rep.top.some((k) => k.kind === 'contract:not stated'), 'the top kinds are differences only');
  assert.ok(resolve(compact(storedFull())).variants.length === 2);
}

/* ---- two readings of REST's that faked differences, each on a real layer's fields as the cache holds them */
{
  // REST leaves individualStrokeWeights out when the four sides are equal; their bindings are still per side
  const ring = { type: 'INSTANCE', name: 'Focus ring', size: { x: 10, y: 10 }, relativeTransform: T(0, 0), strokes: [{ blendMode: 'NORMAL', type: 'SOLID', color: { r: 0.2745, g: 0.5333, b: 0.9255, a: 1 }, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:c' } } }], strokeWeight: 2, strokeAlign: 'OUTSIDE',
    boundVariables: { individualStrokeWeights: { BORDER_TOP_WEIGHT: { type: 'VARIABLE_ALIAS', id: 'VariableID:w' }, BORDER_BOTTOM_WEIGHT: { type: 'VARIABLE_ALIAS', id: 'VariableID:w' }, BORDER_LEFT_WEIGHT: { type: 'VARIABLE_ALIAS', id: 'VariableID:w' }, BORDER_RIGHT_WEIGHT: { type: 'VARIABLE_ALIAS', id: 'VariableID:w' } }, strokes: [{ type: 'VARIABLE_ALIAS', id: 'VariableID:c' }] } };
  assert.deepEqual(restPart(ring, null, ctx, {}).border.width, [BOUND, BOUND, BOUND, BOUND], 'four sides bound, the weights unsaid because equal');
  // a weight with no paint draws no stroke (derive's normalForm says none): bound sides and no paint are no border
  assert.equal(restPart({ ...ring, strokes: [] }, null, ctx, {}).border, undefined, 'no paint, no border');
  // the plugin API's `textStyleId` override is REST's `inheritTextStyleId,text`: an entry still, so the counts agree
  const inst = (overrides) => ({ id: 'i', name: 'Item', type: 'INSTANCE', componentId: 'C:9', size: { x: 10, y: 10 }, relativeTransform: T(0, 0), overrides, children: [] });
  const host = { id: 'h', name: 'Host', type: 'COMPONENT', size: { x: 10, y: 10 }, relativeTransform: T(0, 0), children: [inst([{ id: 'i', overriddenFields: ['height', 'width'] }, { id: 'I;t', overriddenFields: ['inheritTextStyleId', 'text'] }])] };
  const stored = (ov) => ({ name: 'Host', id: 'h', key: 'kh', props: {}, variants: [{ name: 'Host', type: 'COMPONENT', w: 10, h: 10, children: [{ ...restWalk(host.children[0], ctx, 1, host), overrides: ov }] }] });
  const ovRows = (ov) => compareSpec('host', host, stored(ov), ctx).rows.filter((x) => x.kind === 'spec:overrides');
  assert.deepEqual(ovRows(['height,width', 'textStyleId']), [], 'one text-style override each side');
  assert.equal(ovRows(['textStyleId']).length, 1, 'a layer overridden in Figma and not in the walk is still a row');
  // a style-only override the plugin lists and REST does not (a stroke style's) fakes no row
  const host2 = structuredClone(host); host2.children[0].overrides = [{ id: 'i', overriddenFields: ['height', 'width'] }];
  assert.deepEqual(compareSpec('host', host2, stored(['height,width', 'strokeStyleId']), ctx).rows.filter((x) => x.kind === 'spec:overrides'), [], 'a plugin-only strokeStyleId');
  // REST's `text` is always beside inheritTextStyleId: the text style's, wherever the entry has other styles too
  const host3 = structuredClone(host); host3.children[0].overrides[1].overriddenFields = ['inheritFillStyleId', 'inheritTextStyleId', 'text'];
  assert.deepEqual(compareSpec('host', host3, stored(['height,width', 'fillStyleId,textStyleId']), ctx).rows.filter((x) => x.kind === 'spec:overrides'), [], 'a fill and a text style, named two ways');
}

/* ---- one real pair: a small component as Figma's REST and the snapshot gave it (names of its library scrubbed) */
{
  const F = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'oracle-figma');
  const rest = JSON.parse(fs.readFileSync(path.join(F, 'rest.json'), 'utf8'));
  const stored = JSON.parse(fs.readFileSync(path.join(F, 'figma.json'), 'utf8'));
  const con = JSON.parse(fs.readFileSync(path.join(F, 'contract.json'), 'utf8'));
  const rctx = { styles: rest.styles, components: rest.components, componentSets: rest.componentSets };
  const s = compareSpec('real', rest.document, resolve(stored), rctx);
  assert.deepEqual(s.rows, [], 'the walk read this component as Figma says it');
  assert.ok(s.checked > 50, `its fields checked (${s.checked})`);
  const c = compareContract('real', rest.document, con, rctx);
  assert.ok(c.checked > 20, `the contract's fields checked (${c.checked})`);
  assert.deepEqual(c.rows.filter((x) => x.kind === 'contract:part' || x.kind === 'contract:ambiguous'), [], 'every part found in Figma\'s own tree');
  // and a real value changed is a real row
  const changed = structuredClone(rest); changed.document.children[0].paddingLeft = (changed.document.children[0].paddingLeft || 0) + 3;
  assert.ok(compareSpec('real', changed.document, resolve(stored), rctx).rows.some((x) => x.kind === 'spec:pad'));
}

/* ---- the fetch: one at a time, a 429 waits, the token in the header and nowhere else, four failures stop it */
{
  const token = 'figd_secret_token_value';
  const seen = [], logs = [], waits = [];
  let n = 0;
  const fake = async (url, init) => { seen.push([url, init.headers['X-Figma-Token']]); n++; return n === 1 ? { status: 429, headers: { get: (h) => (h === 'retry-after' ? '3' : null) }, json: async () => ({ err: 'Rate limit' }) } : { status: 200, json: async () => ({ ok: true }) }; };
  const get = client(token, { interval: 0, fetch: fake, sleep: async (ms) => { waits.push(ms); }, log: (s) => logs.push(s) });
  assert.deepEqual(await get('/v1/files/K/nodes?ids=1'), { ok: true });
  assert.deepEqual(waits, [3000], 'a 429 waits its Retry-After');
  assert.ok(seen.every(([u, t]) => u.startsWith('https://api.figma.com/') && t === token));
  assert.ok(!logs.join(' ').includes(token), 'the token is never logged');
  const bad = client(token, { interval: 0, fetch: async () => { throw new Error('down'); }, sleep: async () => {}, log: (s) => logs.push(s) });
  await assert.rejects(bad('/v1/x'), (e) => !e.message.includes(token), 'four failures throw, the token unsaid');
  const forbidden = client(token, { interval: 0, fetch: async () => ({ status: 403, json: async () => ({ message: 'Invalid scope' }) }), sleep: async () => {} });
  await assert.rejects(forbidden('/v1/x'), /403/, 'a 403 is not retried');
}
{
  // versionAt: the first version saved at or after the snapshot, compared as dates; never pinned (no version is stored)
  const pages = { versions: [{ id: 'v3', created_at: '2026-11-24T12:00:00Z' }, { id: 'v2', created_at: '2026-11-24T09:00:00Z' }, { id: 'v1', created_at: '2026-11-24T08:00:00Z' }] };
  assert.deepEqual(await versionAt(async () => pages, 'K', '2026-11-24T08:30:00Z'), { id: 'v2', at: '2026-11-24T09:00:00Z', pinned: false });
  assert.equal(await versionAt(async () => pages, 'K', '2026-11-24T13:00:00Z'), null, 'none since: the file as it is');
  assert.equal(await versionAt(async () => pages, 'K', null), null, 'no snapshot time: the file as it is');
  // as dates: a version saved at 08:26:13 is before a snapshot at 08:26:13.582, which a string comparison says it is not
  const close = { versions: [{ id: 'b', created_at: '2026-11-24T09:00:00Z' }, { id: 'a', created_at: '2026-11-24T08:26:13Z' }] };
  assert.equal((await versionAt(async () => close, 'K', '2026-11-24T08:26:13.582Z')).id, 'b');
  // pages followed until a version older than the snapshot is met
  const pagesAsked = [];
  const paged = async (p) => { pagesAsked.push(p); return p.includes('before=') ? { versions: [{ id: 'v1', created_at: '2026-11-24T08:00:00Z' }] } : { versions: [{ id: 'v3', created_at: '2026-11-24T12:00:00Z' }, { id: 'v2', created_at: '2026-11-24T09:00:00Z' }], pagination: { next_page: 'https://api.figma.com/v1/files/K/versions?page_size=50&before=2' } }; };
  assert.equal((await versionAt(paged, 'K', '2026-11-24T08:30:00Z')).id, 'v2');
  assert.equal(pagesAsked.length, 2, 'the second page read');
  // a next page off Figma's host is never followed (the token goes to Figma only)
  const off = async () => ({ versions: [{ id: 'v2', created_at: '2026-11-24T09:00:00Z' }], pagination: { next_page: 'https://elsewhere.example/v' } });
  assert.equal((await versionAt(off, 'K', '2026-11-24T08:30:00Z')).id, 'v2');
  // each result says which version it read and that it is unpinned
  assert.match(readAt({ id: 'v2', at: '2026-11-24T09:00:00Z', pinned: false }, '2026-11-24T08:30:00Z'), /read at v2, 2026-11-24T09:00:00Z.*unpinned: may include later edits/);
  assert.match(readAt(null, '2026-11-24T08:30:00Z'), /read at latest.*unpinned: may include later edits/);
  // the version the router recorded when the snapshot arrived: the snapshot is at or after it, and said so
  const pin = recordedOf({ sources: { K: { at: '2026-11-24', atOrAfter: { id: 'v7', at: '2026-11-24T08:20:00Z' } } } }, 'K');
  assert.deepEqual(pin, { id: 'v7', at: '2026-11-24T08:20:00Z', atOrAfter: true });
  assert.equal(recordedOf({ sources: { K: { at: '2026-11-24' } } }, 'K'), null, 'an older snapshot records none: unpinned');
  assert.equal(recordedOf(undefined, 'K'), null);
  const said = readAt(pin, '2026-11-24T08:30:00Z');
  assert.match(said, /read at v7, 2026-11-24T08:20:00Z; the snapshot is at or after v7$/);
  assert.ok(!/pinned/.test(said), 'never "pinned": the snapshot may hold edits after the version');
  // fetchSets: batched, cached by file and version, read back without a request
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'oracle-figma-'));
  const asked = [];
  const get = async (p) => { asked.push(p); const ids = decodeURIComponent(/ids=([^&]+)/.exec(p)[1]).split(','); return { version: 'v2', nodes: Object.fromEntries(ids.map((id) => [id, { document: { id, type: 'COMPONENT_SET', children: [{ fillGeometry: [1] }] }, components: {}, componentSets: {}, styles: {} }])) }; };
  const sets = [{ id: '1:1', count: 100 }, { id: '1:2', count: 100 }, { id: '1:3', count: 1 }];
  const got = await fetchSets(get, 'K', sets, { version: 'v2', cache });
  assert.equal(asked.length, 2, 'batched under the variants bound');
  assert.ok(asked.every((p) => p.includes('version=v2') && p.includes('geometry=paths')));
  assert.equal(got['1:1'].document.children[0].fillGeometry, undefined, 'geometry stripped before it is kept');
  const again = await fetchSets(async () => { throw new Error('no request'); }, 'K', sets, { version: 'v2', cache });
  assert.deepEqual(Object.keys(again).sort(), ['1:1', '1:2', '1:3']);
  assert.ok(fs.existsSync(path.join(cache, 'K', 'v2')), 'keyed by file and version');
  for (const f of fs.readdirSync(path.join(cache, 'K', 'v2'))) assert.ok(!fs.readFileSync(path.join(cache, 'K', 'v2', f), 'utf8').includes('figd_'), 'no token in the cache');
  fs.rmSync(cache, { recursive: true, force: true });
}
console.log('oracle-figma: ok');
