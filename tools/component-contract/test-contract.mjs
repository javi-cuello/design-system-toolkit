#!/usr/bin/env node
// tools/component-contract: a contract derived from a stored spec says what the
// component means, and rebuilds every variant it was derived from.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { derive, expand, selfCheck, bridge, fold } = require('./derive.cjs');
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

// A Button the way the plugin stores one: two variant axes, Disabled, the
// State axis, and two booleans whose icons share a layer name.
const icon = { name: 'Icon container', type: 'INSTANCE', instanceOf: 'Icon / Size=20', sizing: 'FIXED/FIXED', w: 20, h: 20 };
const label = (style, color = 'Text/inverse') => ({ name: 'Label', type: 'TEXT', text: 'Label', textStyle: style, fills: [color], sizing: 'HUG/HUG' });
const content = (size, extra = [], state = 'Rest', disabled = 'False') => ({
  name: 'Content', type: 'FRAME', layout: 'HORIZONTAL', align: 'CENTER/CENTER', sizing: 'HUG/HUG',
  pad: size === 'Large' ? [12, 12, 12, 12] : [8, 8, 8, 8], bindings: { pad: size === 'Large' ? ['S/12', 'S/12', 'S/12', 'S/12'] : ['S/8', 'S/8', 'S/8', 'S/8'], gap: 'S/4' }, gap: 4,
  fills: [disabled === 'True' ? 'Bg/disabled' : state === 'Hover' ? 'Bg/hover' : 'Bg/primary'],
  children: [...extra.filter((x) => x === 'left').map(() => icon), label(size === 'Large' ? 'Label/md' : 'Label/sm'), ...extra.filter((x) => x === 'right').map(() => icon)],
});
const variant = (size, disabled, state, extra = [], suffix = '') => ({ name: `Size=${size}, Disabled=${disabled}, State=${state}${suffix}`, type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', align: 'MIN/MIN', children: [content(size, extra, state, disabled)] });
const grid = [];
for (const size of ['Large', 'Small']) for (const state of ['Rest', 'Hover', 'Loading']) grid.push(variant(size, 'False', state));
grid.push(variant('Large', 'True', 'Rest'), variant('Small', 'True', 'Rest'));
const spec = {
  name: 'Button', id: '1:1', key: 'k', props: { 'Label text': 'TEXT', 'Left icon': 'BOOLEAN', 'Right icon': 'BOOLEAN', Size: ['Large', 'Small'], Disabled: ['False', 'True'], State: ['Rest', 'Hover', 'Loading'] },
  links: { 'Label text': { kind: 'characters', layers: [['Content', 'Label']] } },
  variants: [...grid, ...grid.map((v) => variant(...v.name.match(/Size=(\w+), Disabled=(\w+), State=(\w+)/).slice(1), ['left'], ', Left icon=True')),
    ...grid.map((v) => variant(...v.name.match(/Size=(\w+), Disabled=(\w+), State=(\w+)/).slice(1), ['right'], ', Right icon=True'))],
};
const c = derive(spec);
const A = c.anatomy;

ok('props in words no platform owns: a False/True axis is a boolean, a boolean\'s default is the side its trees were not flipped to, State is interaction per figma-standard rule 4',
  c.props.disabled.type === 'boolean' && c.props.disabled.default === false
  && c.props.leftIcon.type === 'boolean' && c.props.leftIcon.default === false
  && c.props.size.type === 'enum' && c.props.size.default === 'large' && c.props.size.figma === 'Size'
  && c.props.state.role === 'interaction' && c.props.state.pointer.join() === 'hover');
ok('a False/True axis is said to be one, so a folded invalid list need not name it; a boolean property is not',
  c.props.disabled.axis === true && !('axis' in c.props.leftIcon));

ok('an element\'s id is its address: two booleans whose layers share a name show two elements, each named for its prop',
  'content/label' in A && c.props.leftIcon.shows.join() === 'content/leftIconIconContainer' && c.props.rightIcon.shows.join() === 'content/rightIconIconContainer');

ok('a text property names the layer it sets, from the links the plugin records; the layer\'s content is the prop',
  c.props.labelText.sets.join() === 'content/label' && A['content/label'].content === '{labelText}');
// a tag that draws its dot at the large size only, and an icon inside its large dot's own instance
const tag = (size) => ({ name: `Size=${size}`, type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', align: 'MIN/MIN',
  children: [...(size === 'Large' ? [{ name: 'Dot', type: 'ELLIPSE', sizing: 'FIXED/FIXED', w: 8, h: 8, fills: ['Ink'] }] : []), label('Label/sm')] });
const tc2 = derive({ name: 'Tag', id: '2:1', props: { Size: ['Large', 'Small'] }, variants: [tag('Large'), tag('Small')] });
ok('a part drawn only under some props\' values carries that condition, read off every drawn variant',
  JSON.stringify(tc2.when) === JSON.stringify({ dot: { size: ['large'] } }) && !('when' in derive({ name: 'Tag', id: '2:1', props: { Size: ['Large'] }, variants: [tag('Large')] })));
// a focus ring drawn at focus only, where disabled and focus are never drawn together
const ringed = (state, disabled) => ({ name: `State=${state}, Disabled=${disabled}`, type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', align: 'MIN/MIN',
  children: [label('Label/sm'), ...(state === 'Focus' ? [{ name: 'Focus ring', type: 'ELLIPSE', sizing: 'FIXED/FIXED', w: 8, h: 8, fills: ['Ring'] }] : [])] });
const rc = derive({ name: 'Ringed', id: '3:1', props: { State: ['Rest', 'Focus'], Disabled: ['False', 'True'] }, variants: [ringed('Rest', 'False'), ringed('Focus', 'False'), ringed('Rest', 'True')] });
ok('a condition names only the props it needs: one whose other values the grid never draws with the part is the invalid list\'s to say',
  JSON.stringify(rc.when) === JSON.stringify({ focusRing: { state: ['focus'] } }) && JSON.stringify(rc.invalid) === JSON.stringify([{ state: 'focus', disabled: true }]));
ok('an ellipse is recorded as one, as a box\'s corners alone cannot draw it', tc2.anatomy.dot.shape === 'ellipse');
ok('a text property\'s default is the words its layer holds in the default variant, and never a key a variant is chosen by',
  c.props.labelText.default === 'Label' && !('default' in derive({ ...spec, links: undefined }).props.labelText)
  && [...c.variants, ...c.invalid].every((v) => !('labelText' in (v.when || v))));

ok('values are tokens where the design bound one, and layout is said without Figma\'s words',
  A.content.layout.padding.start === 'S/12' && A.content.layout.direction === 'row'
  && A.content.layout.align === 'center' && A.content.width === 'hug' && !('x' in A.content));

const small = c.variants.find((v) => !v.combination && v.when.size === 'small' && Object.keys(v.when).length === 1);
ok('what one prop value changes is said once, as a layer: Small is its padding and its type style',
  small && small.set['content/label.typography'] === 'Label/sm' && small.set['content.layout'].padding.start === 'S/8'
  && c.variants.filter((v) => JSON.stringify(v).includes('Label/sm')).length === 1);

ok('a left icon moves the label along: order is part of the anatomy',
  A['content/label'].order === 0 && c.variants.find((v) => v.when.leftIcon === true).set['content/label.order'] === 1);

ok('every stored variant rebuilds from the contract', selfCheck(spec, c).length === 0
  && JSON.stringify(expand(c, { size: 'small', state: 'hover' }).content.background) === '"Bg/hover"');

const blind = JSON.parse(JSON.stringify(c));
blind.variants.find((v) => !v.combination && v.when.size === 'small').set['content/label.typography'] = 'Label/md';
ok('…and a contract that says something else is caught: the check is not blind', selfCheck(spec, blind).length > 0);

// a prop none of whose values is drawn with the rest is left out: disabled and hover at every size is one entry
ok('the variant-axis combinations the grid leaves out are listed, a prop that makes no difference left out',
  JSON.stringify(c.invalid.map((x) => JSON.stringify(x)).sort()) === JSON.stringify(['{"disabled":true,"state":"hover"}', '{"disabled":true,"state":"loading"}']));
const domains = [['size', ['small', 'large']], ['disabled', [false, true]], ['state', ['rest', 'hover']]];
// a prop is left out of every entry or none: size matters for small/rest, so it stays in all three
ok('…and a prop kept where it makes a difference to any entry',
  JSON.stringify(fold([{ size: 'large', disabled: true, state: 'hover' }], domains)) === '[{"size":"large","disabled":true,"state":"hover"}]'
  && JSON.stringify(fold([{ size: 'large', disabled: true, state: 'hover' }, { size: 'small', disabled: true, state: 'hover' }, { size: 'small', disabled: true, state: 'rest' }], domains).map((x) => JSON.stringify(x)).sort()) === JSON.stringify(['{"size":"large","disabled":true,"state":"hover"}', '{"size":"small","disabled":true,"state":"hover"}', '{"size":"small","disabled":true,"state":"rest"}'].sort()));

ok('a snapshot from before links says nothing it cannot read, rather than guessing',
  (() => { const old = derive({ ...spec, links: undefined }); return !('sets' in old.props.labelText) && old.anatomy['content/label'].content === 'Label' && old.props.leftIcon.shows.join() === 'content/leftIconIconContainer'; })());

ok('a deterministic derivation: the same spec, the same bytes', JSON.stringify(derive(spec)) === JSON.stringify(c));

// Review round of 2026-10-05: each case below was a defect that passed selfCheck.
const T = (name, kids) => ({ name, type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', align: 'MIN/MIN', children: kids });
const icon2 = (fill) => ({ name: 'Icon', type: 'INSTANCE', instanceOf: 'Icon', sizing: 'FIXED/FIXED', w: 16, h: 16, fills: [fill] });
const text = (t, name = 'Label') => ({ name, type: 'TEXT', text: t, textStyle: 'Body', fills: ['Ink'], sizing: 'HUG/HUG' });

const placed = { name: 'Chip', props: { Placement: ['Start', 'End'] }, variants: [T('Placement=Start', [icon2('Ink'), text('A')]), T('Placement=End', [text('A'), icon2('Ink')])] };
const pc = derive(placed);
const swapped = JSON.parse(JSON.stringify(pc)); swapped.variants = [];
ok('an axis that only moves a layer is a change: Placement=End reorders, and a contract that forgets it is caught',
  pc.variants.length === 1 && pc.variants[0].set['icon.order'] === 1 && selfCheck(placed, pc).length === 0 && selfCheck(placed, swapped).length === 1);

const content2 = (kids) => [{ name: 'Content', type: 'FRAME', layout: 'HORIZONTAL', sizing: 'HUG/HUG', children: kids }];
const onByDefault = { name: 'Button', props: { 'Left icon': 'BOOLEAN', 'Right icon': 'BOOLEAN', Size: ['Large'] }, variants: [
  T('Size=Large', content2([text('Go'), icon2('R')])),
  T('Size=Large, Left icon=True', content2([icon2('L'), text('Go'), icon2('R')])),
  T('Size=Large, Right icon=False', content2([text('Go')])) ] };
const oc = derive(onByDefault);
ok('a boolean is matched to the layer it adds by alignment, not by name: Left icon shows the new first icon, not the right one',
  oc.props.leftIcon.shows.join() === 'content/leftIconIcon' && oc.anatomy['content/icon'].background === 'R' && selfCheck(onByDefault, oc).length === 0);
const nested = { name: 'Button', props: { 'Left icon': 'BOOLEAN', Size: ['L'] }, variants: [T('Size=L', [text('Go')]), T('Size=L, Left icon=True', [{ name: 'Icon container', type: 'FRAME', children: [icon2('L')] }, text('Go')])] };
ok('inside a layer a boolean adds, its children keep their own names, and the boolean shows the layer it added, once',
  (() => { const n = derive(nested); return n.props.leftIcon.shows.join() === 'leftIconIconContainer' && 'leftIconIconContainer/icon' in n.variants[0].add && selfCheck(nested, n).length === 0; })());
ok('a boolean on by default shows the layers its flip hides', oc.props.rightIcon.default === true && oc.props.rightIcon.shows.join() === 'content/icon');

const twoLabels = { name: 'Card', props: { Title: 'TEXT', Subtitle: 'TEXT', Size: ['M'] },
  links: { Title: { kind: 'characters', layers: [['Header', 'Label']] }, Subtitle: { kind: 'characters', layers: [['Header', 'Label[2]']] } },
  variants: [T('Size=M', [{ name: 'Header', type: 'FRAME', children: [text('T'), text('S')] }])] };
const tc = derive(twoLabels);
ok('two text layers with one name are two links, numbered as the anatomy numbers them',
  tc.props.title.sets.join() === 'header/label' && tc.props.subtitle.sets.join() === 'header/label_2'
  && tc.anatomy['header/label'].content === '{title}' && tc.anatomy['header/label_2'].content === '{subtitle}');

const plainCard = { name: 'Card', props: { Size: ['M', 'L'] }, variants: [T('Size=M', content2([text('A')])), T('Size=L', content2([text('A')]))] };
const badged = { ...plainCard, variants: [plainCard.variants[0], T('Size=L', [...content2([text('A')]), { name: 'Badge', type: 'FRAME', children: [text('1')] }])] };
ok('an id depends on its own address only: a Label added elsewhere renames nothing',
  'content/label' in derive(plainCard).anatomy && 'content/label' in derive(badged).anatomy && 'badge/label' in derive(badged).variants[0].add);

const states = { name: 'Form', props: { State: ['Initial', 'Hover', 'Submitted'] }, variants: ['Initial', 'Hover', 'Submitted'].map((v) => T(`State=${v}`, [text(v)])) };
ok('the State axis lists the pointer states it has, not whatever is not Rest or Loading', derive(states).props.state.pointer.join() === 'hover');

ok('the default variant is the one the plugin names, when it names one',
  derive({ ...plainCard, defaultVariant: 'Size=L' }).props.size.default === 'l' && derive(plainCard).props.size.default === 'm');

const wide = { name: 'Wide', props: Object.fromEntries('ABCDEFG'.split('').map((k) => [k, ['1', '2', '3', '4']])), variants: [T('A=1, B=1, C=1, D=1, E=1, F=1, G=1', []), T('A=2, B=1, C=1, D=1, E=1, F=1, G=1', [])] };
// a fill only three props together change, whatever the fourth: a layer of the three, no combination listed whole
const trioSpec = { name: 'Trio', id: '3:1', props: { X: ['A', 'B'], Y: ['C', 'D'], Z: ['E', 'F'], W: ['G', 'H'] }, variants: [] };
for (const x of ['A', 'B']) for (const y of ['C', 'D']) for (const z of ['E', 'F']) for (const w of ['G', 'H'])
  trioSpec.variants.push({ name: `X=${x}, Y=${y}, Z=${z}, W=${w}`, type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', align: 'MIN/MIN', fills: [x === 'B' && y === 'D' && z === 'F' ? 'F/trio' : 'F/base'], radius: w === 'H' ? 8 : 0, children: [] });
const trio = derive(trioSpec);
ok('what three props change together is a layer of the three, and every combination rebuilds from it',
  trio.variants.some((v) => JSON.stringify(v.when) === '{"x":"b","y":"d","z":"f"}' && !v.combination) && !trio.variants.some((v) => v.combination) && selfCheck(trioSpec, trio).length === 0);
ok('combinations too many to list are said to be unlisted, never left to read as all valid', derive(wide).invalid === null);

// A set named with " / " in it: the instance resolves to the stored name, never to the cut at the first " / ".
{
  const host = { name: 'Column', props: {}, variants: [{ name: 'Column', type: 'COMPONENT', children: [{ name: 'Cell', type: 'INSTANCE', instanceOf: 'Table - Cell / Fill / Size=md' }] }] };
  const comp = (c) => c.anatomy.cell.component;
  ok('an instance of a set whose name holds " / " resolves to the stored name', comp(derive(host, ['Table - Cell / Fill', 'Column'])) === 'Table - Cell / Fill');
  ok('and with no names known it falls back to the first segment, as before', comp(derive(host)) === 'Table - Cell');
  ok('selfCheck\'s own contract is derived with the names it checks against', selfCheck(host, undefined, ['Table - Cell / Fill', 'Column']).length === 0);
}

// The state axis and its pointer states are settings, the project's where the
// caller passes them (projects.cjs deriveOptions), never literals in derive.
{
  const { deriveOptions } = require('../snapshot/projects.cjs');
  ok('a project\'s pointer states replace the house ones', derive(states, [], { pointerStates: ['Submitted'] }).props.state.pointer.join() === 'submitted');
  ok('a project\'s state axis is the one marked interaction', derive(states, [], { stateAxis: 'Mode' }).props.state.role === undefined);
  const ctx = { libraries: { K: { tokens: { stateAxis: 'Interaction', pointerStates: ['Hover'] } } } };
  ok('deriveOptions reads a library\'s merged settings, and nothing for a library they do not name',
    JSON.stringify(deriveOptions(ctx, 'K')) === '{"stateAxis":"Interaction","pointerStates":["Hover"]}' && JSON.stringify(deriveOptions(ctx, 'X')) === '{}');
}

// A written contract's states, read by the mark derive left on it (layers.mjs statesOf, the docs site's States table):
// the default left out, each as Figma spells it, a pointer state the browser's and the rest the axis's.
{
  const { statesOf } = await import('./layers.mjs');
  const read = statesOf(derive(states, [], { pointerStates: ['Hover'] }));
  ok('the states are the marked axis\'s, its default left out', read.length > 0 && read.every((s) => s.axis === 'State') && !read.some((s) => /^rest$/i.test(s.name)));
  ok('a pointer state is the browser\'s, another on the axis the product\'s', read.find((s) => s.name === 'Hover').pointer === true && read.filter((s) => s.name !== 'Hover').every((s) => !s.pointer));
  ok('an axis not marked interaction has no states', statesOf(derive(states, [], { stateAxis: 'Mode' })).length === 0);
}

// the bridge: each contract element's stored layer path, read forward from the same nodes
{
  const b = bridge(spec);
  const c = derive(spec);
  ok('every contract element has the stored layer path the parity mappings name it by', Object.keys(c.anatomy).every((id) => (b.paths[id] || []).length > 0)
    && JSON.stringify(b.paths['content/label']) === '["Content > Label"]' && JSON.stringify(b.paths.root) === '["$root"]');
  ok('a boolean\'s own layer keeps the name Figma gives it, which its id, the boolean folded in, cannot say', c.variants.some((v) => v.add && v.add['content/leftIconIconContainer'] && v.add['content/leftIconIconContainer'].name === 'Icon container'));
  ok('a boolean\'s own layer keeps the path its own tree gives it, and the path names it back', b.paths['content/leftIconIconContainer'].includes('Content > Icon container')
    && b.ids['Content > Icon container'].includes('content/leftIconIconContainer'));
  // "Item 2" and the second "Item": a repeat is numbered past a separator, so the two never take one id
  const items = { name: 'Crumbs', id: '2:1', key: 'k2', props: { Size: ['Md'] }, variants: [{ name: 'Size=Md', type: 'COMPONENT', children: [
    { name: 'Item', type: 'TEXT', text: 'a' }, { name: 'Item', type: 'TEXT', text: 'b' }, { name: 'Item 2', type: 'TEXT', text: 'c' }] }] };
  ok('a layer named with a number and a repeated layer take two ids, never one', bridge(items).clashes.length === 0 && bridge(items).ids['Item 2'].join() === 'item2' && bridge(items).ids['Item#2'].join() === 'item_2');
}

// what the drawing compared with its original found lost on the way (a drawing pushed back to Figma, field by field):
// each a field the snapshot records and the contract now carries
{
  const one = derive({ name: 'Panel', id: '9:9', key: 'p', props: { Items: 'SLOT', 'Show search': 'BOOLEAN' }, slots: { Items: { description: 'What it lists', settings: { minChildren: 1 }, preferred: [] } },
    variants: [{ name: 'Panel', type: 'COMPONENT', layout: 'VERTICAL', sizing: 'FIXED/HUG', w: 320, opacity: 0.5, bindings: { radius: 'R/0', opacity: 'O/half' }, children: [
      { name: 'Box', type: 'FRAME', layout: 'HORIZONTAL', firstOnTop: true, wrap: true, gap: 4, crossGap: 8, bindings: { crossGap: 'S/8', strokeWeight: ['S/1', null, 'S/1', null] }, strokes: ['C/line'], strokeSides: [1, 0, 1, 0], strokeAlign: 'CENTER', strokesInLayout: true, children: [
        { name: 'Option', type: 'FRAME', x: 0, y: 0 }, { name: 'Option', type: 'FRAME', x: 0, y: 0 }] },
      { name: 'Free', type: 'FRAME', children: [{ name: 'Dot', type: 'ELLIPSE', x: 6, y: 4, arc: { start: 0, end: 180, inner: 0 } }, { name: 'Line', type: 'VECTOR', x: 0, y: 20, strokes: ['C/line'], strokeCap: 'ROUND' }, { name: 'Ring', type: 'RECTANGLE', x: 0, y: 0, rotation: 45, constraints: 'STRETCH/CENTER', bindings: { strokeWeight: ['S/1', 'S/1', 'S/1', 'S/1'] } }] },
      { name: 'Items', type: 'SLOT', layout: 'VERTICAL' },
      { name: 'Words', type: 'TEXT', text: 'Hi', textAutoResize: 'HEIGHT', textAlignVertical: 'CENTER', letterSpacing: '2%', textCase: 'UPPER' }] }] });
  const A1 = one.anatomy;
  ok('a corner bound to a token is said by it at 0, and an opacity by its token', A1.root.radius === 'R/0' && A1.root.opacity === 'O/half');
  ok('a stroke a side, each bound side by its token and the others by their width, drawn on its centre and taking room', JSON.stringify(A1.box.border.width) === '["S/1",0,"S/1",0]' && A1.box.border.align === 'center' && A1.box.border.inLayout === true);
  ok('a rectangle is one, turned as it is, following its parent as it does, and a weight bound with no stroke painted is kept', A1['free/ring'].constraints.horizontal === 'stretch' && A1['free/ring'].constraints.vertical === 'center' && A1['free/ring'].shape === 'rectangle' && A1['free/ring'].rotation === 45 && JSON.stringify(A1['free/ring'].border) === '{"width":["S/1","S/1","S/1","S/1"]}');
  // a focus ring 4 outside its chip, stretched with it, and a badge pinned 2 in from its end: their far edges, and the
  // ring no size of its own, which would be one label's
  const pinned = derive({ name: 'Chip', id: '1:1', props: {}, variants: [{ name: 'Chip', type: 'COMPONENT', w: 81, h: 36, children: [
    { name: 'Focus ring', type: 'RECTANGLE', x: -4, y: -4, w: 89, h: 44, sizing: 'FIXED/FIXED', absolute: true, constraints: 'STRETCH/STRETCH' },
    { name: 'Badge', type: 'ELLIPSE', x: 71, y: 2, w: 8, h: 8, sizing: 'FIXED/FIXED', absolute: true, constraints: 'MAX/MIN' }] }] }).anatomy;
  ok('a part stretched with its parent is its offsets from both edges, no size; one pinned to the end, its offset from it',
    JSON.stringify(pinned.focusRing.absolute) === '{"x":-4,"y":-4,"end":-4,"bottom":-4}' && pinned.focusRing.width === undefined && pinned.focusRing.height === undefined
    && JSON.stringify(pinned.badge.absolute) === '{"x":71,"y":2,"end":2}' && pinned.badge.width === 8);
  ok('part of a circle keeps its arc, and a line its rounded ends', JSON.stringify(A1['free/dot'].arc) === '{"start":0,"end":180,"inner":0}' && A1['free/line'].border.cap === 'round');
  ok('wrapped rows keep the gap between them, and a box stacked first on top says so', A1.box.layout.firstOnTop === true && A1.box.layout.wrap === true && A1.box.layout.crossGap === 'S/8');
  ok('a repeat takes its name from its id; a part in a box no layout places is at its point there', !A1['box/option_2'].name && JSON.stringify(A1['free/dot'].absolute) === '{"x":6,"y":4}' && !A1['box/option'].absolute);
  ok('a slot is its prop\'s, and the prop keeps its description', A1.items.content === '{items}' && one.props.items.description === 'What it lists');
  ok('words no style sets keep their spacing and case, and how their box follows them', A1.words.autoResize === 'height' && A1.words.verticalAlign === 'center' && A1.words.letterSpacing === '2%' && A1.words.textCase === 'upper');
}

// a set giving each size its own icon swap on the one layer (snapshot 0.61.0): each instance names its own
{
  const names = (size) => spec.variants.filter((v) => v.name.startsWith(`Size=${size}`) && !/icon=/.test(v.name)).map((v) => v.name);
  const sw = derive({ ...spec, props: { ...spec.props, 'Icon (20)': 'INSTANCE_SWAP', 'Icon (16)': 'INSTANCE_SWAP' },
    links: { ...spec.links, 'Icon (20)': { kind: 'mainComponent', layers: [['Content', 'Icon container']], variants: names('Large') }, 'Icon (16)': { kind: 'mainComponent', layers: [['Content', 'Icon container']], variants: names('Small') } } });
  const id = Object.keys(expand(sw, { leftIcon: true })).find((k) => /leftIcon/.test(k));
  const words = derive({ ...spec, links: { 'Label text': { kind: 'characters', layers: [['Content', 'Label']], variants: names('Large') } } });
  ok('a text its property drives in some variants only keeps its own words in the rest', words.anatomy['content/label'].content === '{labelText}' && expand(words, { size: 'small' })['content/label'].content === 'Label');
  ok('an icon swapped by one property per size names its own at each size', expand(sw, { leftIcon: true })[id].swappedBy === 'icon20' && expand(sw, { leftIcon: true, size: 'small' })[id].swappedBy === 'icon16');
}

// a boolean hiding the first of two same-named buttons hides that one: the second, left, is still the primary
{
  const btn = (h) => ({ name: 'Button', type: 'INSTANCE', instanceOf: `Button / Hierarchy=${h}`, props: { Hierarchy: h } });
  const two = derive({ name: 'Footer', id: '1:2', key: 'f', props: { 'Show secondary': 'BOOLEAN' }, links: { 'Show secondary': { kind: 'visible', layers: [['Button']] } },
    variants: [{ name: 'Footer', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'FIXED/HUG', w: 400, children: [btn('Secondary'), btn('Primary')] },
      { name: 'Footer, Show secondary=False', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'FIXED/HUG', w: 420, children: [{ ...btn('Primary'), children: [{ name: 'Content', type: 'FRAME' }] }] }] });
  const off = expand(two, { showSecondary: false });
  ok('a flip changes nothing it shares with its variant: a detached instance\'s own size, or its instances walked whole, are not the boolean\'s', two.variants.every((v) => !v.set || !('root.width' in v.set)) && two.anatomy.root.width === 400 && !JSON.stringify(two).includes('Content'));
  ok('a boolean hiding the first of two same-named layers hides that one, the other unchanged', !off.button && off.button_2 && off.button_2.with.Hierarchy === 'Primary' && two.props.showSecondary.shows.join() === 'button');
}

// a component that fills its set keeps the size the set gives it, a canvas fact
{
  const row = derive({ name: 'Row', id: '1:3', key: 'r', props: {}, variants: [{ name: 'Row', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'FILL/HUG', w: 420, h: 40, children: [] }] });
  ok('a component that fills its set keeps the width the set gives it', row.anatomy.root.width === 'fill' && row.anatomy.root.canvas.width === 420 && !('height' in row.anatomy.root.canvas));
}

// a part one layer adds inside a part another layer removes goes with its parent
{
  const orphan = { contract: 1, component: 'Bar', props: { second: { type: 'boolean', default: true }, title: { type: 'boolean', default: false } },
    anatomy: { root: { kind: 'container' }, b2: { kind: 'instance', parent: 'root', component: 'Button' } },
    variants: [{ when: { second: false }, remove: ['b2'] }, { when: { title: true }, add: { 'b2/label': { kind: 'text', parent: 'b2' } } }] };
  ok('a part goes with its parent: one added inside a removed part is not drawn', !expand(orphan, { second: false, title: true })['b2/label'] && !!expand(orphan, { title: true })['b2/label']);
}

console.log(`${n}/${n} passed`);
