/* oracle-figma.mjs: Figma's REST JSON mapped to the stored walk's words and to a contract's, every field held, a bound
   value held as bound, a field REST does not say never passing, and the fetch polite, cached and silent about its token. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { BOUND, UNNAMED, plainText, partOurs, FIELDS, NOT_CHECKABLE, REASONS, paintsOf, restWalk, restPart, compareSpec, compareContract, linksOf, client, fetchSets, versionAt, report } from './oracle-figma.mjs';

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
  const g = paintsOf([{ type: 'GRADIENT_LINEAR', gradientHandlePositions: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }, { x: 0, y: 0 }], gradientStops: [{ position: 0, color: white }, { position: 1, color: { r: 0, g: 0, b: 0, a: 1 } }] }])[0];
  assert.equal(g.angle, 180, 'top to bottom is 180°, as CSS says it');
  assert.deepEqual(g.stops.map((s) => s.color), ['#ffffff', '#000000']);
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
  // a quarter-turned layer's sizing words are on its parent's axes
  const line = restPart({ name: 'L', type: 'LINE', size: { x: 0, y: 20 }, relativeTransform: [[0, 1, 0], [-1, 0, 20]], layoutSizingHorizontal: 'FILL', layoutSizingVertical: 'FIXED' }, { type: 'FRAME', layoutMode: 'HORIZONTAL' }, ctx, {});
  assert.deepEqual([line.width, line.height], [0, 'fill']);
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
  const rows = compareSpec('chip', setNode, storedFull(), ctx);
  assert.deepEqual(rows, [], 'a spec that says what Figma says has no row');
  const crows = compareContract('chip', setNode, compact(storedFull()), contract(), ctx);
  assert.deepEqual(crows, [], 'a contract that says what Figma says has no row');
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
    assert.ok(compareSpec('chip', setNode, s, ctx).some((r) => r.kind === kind), `a changed ${kind} is caught`);
  }
  // a token's name is not checkable: another name for the same bound fill is no row, and no row says it passed either
  { const s = storedFull(); s.variants[0].fills = ['Brand/other']; assert.deepEqual(compareSpec('chip', setNode, s, ctx), []); }
  // fields REST does not say are not compared at all
  { const s = storedFull(); s.variants[0].notes = [{ text: 'x' }]; s.variants[0].children[0].paths = [{ data: 'M 0 0' }]; assert.deepEqual(compareSpec('chip', setNode, s, ctx), []); }
  // a boolean's flipped tree is the walk's own, not a variant Figma lacks
  {
    const set = structuredClone(setNode); set.componentPropertyDefinitions['Show#2:0'] = { type: 'BOOLEAN', defaultValue: false };
    const s = storedFull(); s.props.Show = 'BOOLEAN'; s.variants.push({ ...storedTree('Size=Small, Show=True', 0, 60) });
    assert.ok(!compareSpec('chip', set, s, ctx).some((r) => r.kind === 'spec:variant'));
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
    assert.ok(compareContract('chip', setNode, compact(storedFull()), c, ctx).some((r) => r.kind === kind), `a changed ${kind} is caught`);
  }
  const rep = report('lib', [{ component: 'chip', rows: [] }, { component: 'other', rows: [{ kind: 'spec:gap', against: 'spec', component: 'other' }] }, { component: 'gone', missing: true, rows: [] }]);
  assert.deepEqual([rep.components, rep.unread, rep.specMatches, rep.contractMatches, rep.bothMatch], [3, 1, 1, 2, 1], 'a component Figma does not have matches nothing');
  assert.equal(rep.top[0].kind, 'spec:gap');
  assert.ok(resolve(compact(storedFull())).variants.length === 2);
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
  // versionAt: the first version saved at or after the snapshot
  const pages = { versions: [{ id: 'v3', created_at: '2026-11-24T12:00:00Z' }, { id: 'v2', created_at: '2026-11-24T09:00:00Z' }, { id: 'v1', created_at: '2026-11-24T08:00:00Z' }] };
  assert.deepEqual(await versionAt(async () => pages, 'K', '2026-11-24T08:30:00Z'), { id: 'v2', at: '2026-11-24T09:00:00Z' });
  assert.equal(await versionAt(async () => pages, 'K', '2026-11-24T13:00:00Z'), null, 'none since: the file as it is');
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
