#!/usr/bin/env node
// tools/component-contract: a contract derived from a stored spec says what the
// component means, and rebuilds every variant it was derived from.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { derive, expand, selfCheck, bridge, fold, mainsFrom, ownStyling, normalForm, ownGlyph, byComponentName, ownInsides } = require('./derive.cjs');
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

// a text property whose layer a boolean hides in the default variant takes its words from a variant that shows it
const hiddenWords = { name: 'Item', props: { Caption: 'TEXT', 'Show caption': 'BOOLEAN', Size: ['M'] },
  links: { Caption: { kind: 'characters', layers: [['Caption']] } },
  variants: [T('Size=M', [text('Go')]), T('Size=M, Show caption=True', [text('Go'), text('Hint', 'Caption')])] };
ok('a text property hidden in the default variant takes its default from the variant that shows it', derive(hiddenWords).props.caption.default === 'Hint');

// …and only from a variant where the property drives that layer: elsewhere the layer keeps its own words
const boundIn = { ...hiddenWords, props: { ...hiddenWords.props, Size: ['M', 'S', 'L'] }, links: { Caption: { kind: 'characters', layers: [['Caption']], variants: ['Size=L'] } },
  variants: [T('Size=M', [text('Go')]), T('Size=S', [text('Go'), text('Small', 'Caption')]), T('Size=L', [text('Go'), text('Hint', 'Caption')])] };
ok('a text default skips a variant where its property does not drive the layer', derive(boundIn).props.caption.default === 'Hint');

// …the default variant included: where the property does not drive its layer there, the layer's own words are no default
const unboundAtDefault = { ...boundIn, variants: [T('Size=M', [text('Go'), text('Pick one', 'Caption')]), T('Size=S', [text('Go'), text('Small', 'Caption')]), T('Size=L', [text('Go'), text('Hint', 'Caption')])] };
ok('a text default is not the default variant\'s own words where the property does not drive that layer', derive(unboundAtDefault).props.caption.default === 'Hint');

// two text properties on one layer, each in its own variants: each default from where that property drives it
const shared = { name: 'Search', props: { Placeholder: 'TEXT', Value: 'TEXT', Filled: ['False', 'True'] },
  links: { Placeholder: { kind: 'characters', layers: [['Text']], variants: ['Filled=False'] }, Value: { kind: 'characters', layers: [['Text']], variants: ['Filled=True'] } },
  variants: [T('Filled=False', [text('Search', 'Text')]), T('Filled=True', [text('Typed', 'Text')])] };
ok('two text properties on one layer each take the words of the variants they drive, and each names the layer where it drives it',
  (() => { const d = derive(shared); const set = (d.variants.find((v) => v.when.filled === true) || {}).set || {};
    return d.props.value.default === 'Typed' && d.props.placeholder.default === 'Search' && d.anatomy.text.content === '{placeholder}' && set['text.content'] === '{value}'; })());

// …an older snapshot, whose links say no variants: one property takes the layer, the other none of its words
{ const old = { ...shared, links: { Placeholder: { kind: 'characters', layers: [['Text']] }, Value: { kind: 'characters', layers: [['Text']] } } };
  const d = derive(old); ok('two properties on one layer with no variants said: neither takes the other\'s words', !(d.props.placeholder.default === d.props.value.default && d.props.placeholder.default !== undefined)); }

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
  { const t = (r) => derive({ name: 'T', props: {}, variants: [{ name: 'T', type: 'COMPONENT', layout: 'VERTICAL', children: [{ name: 'W', type: 'TEXT', text: 'Hi', textAutoResize: r, textAlignVertical: 'CENTER' }] }] }).anatomy.w.verticalAlign;
    ok('a text that grows to its words places them nowhere: its vertical alignment is said only where its height is its own', t('HEIGHT') === undefined && t('WIDTH_AND_HEIGHT') === undefined && t('NONE') === 'center'); }
  { const held = derive({ name: 'Held', props: {}, variants: [{ name: 'Held', type: 'COMPONENT', layout: 'VERTICAL', children: [
      { name: 'Skel', type: 'INSTANCE', instanceOf: 'Skeleton', w: 40, h: 8, children: [{ name: 'Bar', type: 'RECTANGLE', x: 0, y: 0, w: 40, h: 8, constraints: 'STRETCH/STRETCH', fills: ['C/x'] }] }] }] }).anatomy;
    ok('a layer inside an instance keeps no constraints, as no position: an instance cannot override them (figma-fact: no-nested-position-override)', !!held['skel/bar'] && held['skel/bar'].constraints === undefined); }
  // a quarter turn: Figma keeps the node's own width and height (169 by 16) and lays out its turned box, 16 by 169, so its
  // sizing words name the parent's axes (FIXED across a column, FILL down it): said in its own axes, its width fills
  { const turned = (rotation, sizing) => derive({ name: 'Q', props: {}, variants: [{ name: 'Q', type: 'COMPONENT', layout: 'VERTICAL', sizing: 'FIXED/FIXED', w: 44, h: 354, children: [
      { name: 'Track', type: 'FRAME', layout: 'HORIZONTAL', w: 169, h: 16, rotation, sizing }] }] }).anatomy.track;
    const q = turned(90, 'FIXED/FILL'), back = turned(-90, 'FIXED/FILL'), slant = turned(45, 'FIXED/FILL'), flat = turned(0, 'FILL/FIXED');
    ok('a part turned a quarter says its own width and height, its sizing words moved off the parent\'s axes onto its own; any other turn as it is',
      q.width === 'fill' && q.height === 16 && q.rotation === 90 && back.width === 'fill' && back.height === 16 && slant.width === 169 && slant.height === 'fill' && flat.width === 'fill' && flat.height === 16); }
  ok('a corner bound to a token is said by it at 0, and an opacity by its token', A1.root.radius === 'R/0' && A1.root.opacity === 'O/half');
  ok('a stroke a side, each bound side by its token and the others by their width, drawn on its centre and taking room', JSON.stringify(A1.box.border.width) === '["S/1",0,"S/1",0]' && A1.box.border.align === 'center' && A1.box.border.inLayout === true);
  ok('a rectangle is one, turned as it is, following its parent as it does, and a weight bound with no stroke painted is no stroke (nothing draws it)', A1['free/ring'].constraints.horizontal === 'stretch' && A1['free/ring'].constraints.vertical === 'center' && A1['free/ring'].shape === 'rectangle' && A1['free/ring'].rotation === 45 && A1['free/ring'].border === undefined);
  // a focus ring 4 outside its chip, stretched with it, and a badge pinned 2 in from its end: their far edges, and the
  // ring no size of its own, which would be one label's
  const pinned = derive({ name: 'Chip', id: '1:1', props: {}, variants: [{ name: 'Chip', type: 'COMPONENT', w: 81, h: 36, children: [
    { name: 'Focus ring', type: 'RECTANGLE', x: -4, y: -4, w: 89, h: 44, sizing: 'FIXED/FIXED', absolute: true, constraints: 'STRETCH/STRETCH' },
    { name: 'Badge', type: 'ELLIPSE', x: 71, y: 2, w: 8, h: 8, sizing: 'FIXED/FIXED', absolute: true, constraints: 'MAX/MIN' }] }] }).anatomy;
  ok('a part stretched with its parent is its offsets from both edges, no size; one pinned to the end, its offset from it',
    JSON.stringify(pinned.focusRing.absolute) === '{"x":-4,"y":-4,"end":-4,"bottom":-4}' && pinned.focusRing.width === undefined && pinned.focusRing.height === undefined
    && JSON.stringify(pinned.badge.absolute) === '{"x":71,"y":2,"end":2}' && pinned.badge.width === 8);
  // an icon centred in a 40 box a fraction off its middle (Material's toggleable icon button, 8.3 and 7.75): its far edges
  // too, so the distance of its centre from the parent's, (x - end) / 2, is said whatever sizes code gives either box
  const centred = derive({ name: 'Toggle', id: '1:1', props: {}, variants: [{ name: 'Toggle', type: 'COMPONENT', w: 40, h: 40, children: [
    { name: 'Icon', type: 'RECTANGLE', x: 8.3, y: 7.75, w: 24, h: 24, sizing: 'FIXED/FIXED', absolute: true, constraints: 'CENTER/CENTER' }] }] }).anatomy;
  ok('a part centred in its parent is its offsets from both edges, and keeps its size', JSON.stringify(centred.icon.absolute) === '{"x":8.3,"y":7.75,"end":7.7,"bottom":8.25}' && centred.icon.width === 24 && centred.icon.height === 24);
  ok('part of a circle keeps its arc, and a line its rounded ends', JSON.stringify(A1['free/dot'].arc) === '{"start":0,"end":180,"inner":0}' && A1['free/line'].border.cap === 'round');
  ok('wrapped rows keep the gap between them, and a box stacked first on top says so', A1.box.layout.firstOnTop === true && A1.box.layout.wrap === true && A1.box.layout.crossGap === 'S/8');
  ok('a repeat takes its name from its id; a part in a box no layout places is at its point there', !A1['box/option_2'].name && JSON.stringify(A1['free/dot'].absolute) === '{"x":6,"y":4}' && !A1['box/option'].absolute);
  ok('a slot is its prop\'s, and the prop keeps its description', A1.items.content === '{items}' && one.props.items.description === 'What it lists');
  ok('words no style sets keep their spacing and case, and how their box follows them', A1.words.autoResize === 'height' && A1.words.verticalAlign === undefined && A1.words.letterSpacing === '2%' && A1.words.textCase === 'upper');
}

// 2026-11-22: the snapshot says a text with no style `literal`, never nothing, so the test above (no textStyle at all)
// passed while every real one lost its spacing, case and decoration. Snapshot 0.82.0 records its size and face, and
// only where it does are they carried: an older snapshot's contract stays as stored, its check with it
{
  const w = (t) => derive({ name: 'T', props: {}, variants: [{ name: 'T', type: 'COMPONENT', layout: 'VERTICAL', children: [{ name: 'W', type: 'TEXT', text: 'Hi', ...t }] }] }).anatomy.w;
  const before = { text: 'Hi\nyou', lineHeight: '16', letterSpacing: '0.16', textCase: 'UPPER', textDecoration: 'UNDERLINE', paragraphSpacing: 8, listSpacing: 8 };
  // (each expected side is what derive wrote at d67ed92d, before the fields, byte for byte)
  ok('a text of a snapshot before 0.82.0 (no size) derives as it did before the fields, whether literal, mixed or of no style said',
    JSON.stringify(w({ ...before, textStyle: 'literal' })) === '{"kind":"text","parent":"root","typography":"literal","content":"Hi\\nyou","order":0}'
    && JSON.stringify(w({ ...before, textStyle: 'mixed' })) === '{"kind":"text","parent":"root","typography":"mixed","content":"Hi\\nyou","order":0}'
    && JSON.stringify(w(before)) === '{"kind":"text","parent":"root","letterSpacing":"0.16","lineHeight":"16","paragraphSpacing":8,"listSpacing":8,"textCase":"upper","textDecoration":"underline","content":"Hi\\nyou","order":0}');
  const now = w({ ...before, text: 'Hi', textStyle: 'literal', fontSize: 12, fontFamily: 'Inter', fontStyle: 'Regular' });
  ok('a literal text whose size is recorded keeps its spacing, case and decoration; its line height is its typography\'s; paragraph spacing in one line of words draws nothing',
    now.typography === 'literal 12/16 regular Inter' && now.letterSpacing === 0.16 && now.textCase === 'upper' && now.textDecoration === 'underline' && now.lineHeight === undefined && now.paragraphSpacing === undefined && now.listSpacing === undefined);
  const sized = w({ textStyle: 'literal', fontSize: 12, fontFamily: 'Inter', fontStyle: 'Semi Bold', lineHeight: '150%', letterSpacing: '2%' });
  ok('…with its size and face recorded, its typography is its values, size/line height weight in px and its family; a share of that size for letter spacing its px', sized.typography === 'literal 12/18 semibold Inter' && sized.letterSpacing === 0.24 && sized.lineHeight === undefined, JSON.stringify(sized));
  ok('…an Auto line height is the font\'s own, 0, as code reads normal; an italic says so', w({ textStyle: 'literal', fontSize: 14, fontFamily: 'Inter', fontStyle: 'Regular', lineHeight: 'auto' }).typography === 'literal 14/0 regular Inter'
    && w({ textStyle: 'literal', fontSize: 14, fontFamily: 'IBM Plex Sans', fontStyle: 'Bold Italic', lineHeight: '20' }).typography === 'literal 14/20 bold italic IBM Plex Sans');
  const styled = w({ textStyle: 'Body/md', fontSize: 14, fontStyle: 'Regular', lineHeight: '20', letterSpacing: '0.16', textCase: 'UPPER' });
  ok('…a styled text says its style alone: its spacing and case are the style\'s', styled.typography === 'Body/md' && styled.letterSpacing === undefined && styled.textCase === undefined);
  ok('…and words over two lines keep the spacing between their paragraphs', w({ textStyle: 'literal', fontSize: 12, text: 'a\nb', paragraphSpacing: 8 }).paragraphSpacing === 8);
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

{
  // an instance's insides are its component's: a copy of them is left out, an override kept, the instance's words its own
  const chip = { name: 'Chip', id: '9:1', props: { Label: 'TEXT' }, links: { Label: { kind: 'characters', layers: [['Text']] } },
    variants: [{ name: 'Chip', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', fills: ['Bg/chip'], children: [{ name: 'Text', type: 'TEXT', text: 'Label', textStyle: 'Label/sm', fills: ['Text/strong'], sizing: 'HUG/HUG' }] }] };
  const holder = (fill, words) => ({ name: 'Bar', id: '9:2', props: {}, variants: [{ name: 'Bar', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', children: [
    { name: 'Chip', type: 'INSTANCE', instanceOf: 'Chip', props: { Label: words }, layout: 'HORIZONTAL', sizing: 'HUG/HUG', fills: ['Bg/chip'], overrides: ['fills'],
      children: [{ name: 'Text', type: 'TEXT', text: words, textStyle: 'Label/sm', fills: [fill], sizing: 'HUG/HUG' }] }] }] });
  const mains = mainsFrom({ Chip: chip });
  const plain = derive(holder('Text/strong', 'Save'), ['Chip'], { mains }), over = derive(holder('Text/danger', 'Save'), ['Chip'], { mains });
  ok('an opened instance keeps only what differs from its own component: its words are its props, an override of a fill stays',
    !('chip/text' in plain.anatomy) && plain.anatomy.chip.with.Label === 'Save' && over.anatomy['chip/text'] && over.anatomy['chip/text'].color === 'Text/danger'
    && 'chip/text' in derive(holder('Text/strong', 'Save'), ['Chip']).anatomy && selfCheck(holder('Text/danger', 'Save'), over, ['Chip'], { mains }).length === 0);
}
{
  // an instance that hides a layer of its component (the walk records what shows) is kept whole: nothing here could say the hiding
  const pill = { name: 'Pill', id: '9:3', props: {}, variants: [{ name: 'Pill', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', children: [
    { name: 'Dot', type: 'FRAME', sizing: 'FIXED/FIXED', w: 6, h: 6 }, { name: 'Text', type: 'TEXT', text: 'Pill', textStyle: 'Label/sm', fills: ['Text/strong'], sizing: 'HUG/HUG' }] }] };
  const bar = { name: 'Row', id: '9:4', props: {}, variants: [{ name: 'Row', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', children: [
    { name: 'Pill', type: 'INSTANCE', instanceOf: 'Pill', layout: 'HORIZONTAL', sizing: 'HUG/HUG', overrides: ['fills'],
      children: [{ name: 'Text', type: 'TEXT', text: 'Pill', textStyle: 'Label/sm', fills: ['Text/strong'], sizing: 'HUG/HUG' }] }] }] };
  ok('an instance hiding a layer of its component keeps all it records', 'pill/text' in derive(bar, ['Pill'], { mains: mainsFrom({ Pill: pill }) }).anatomy);
}
{
  // a layer inside a nested instance the walk did not open (an icon's glyph) is that instance's own, not hidden: the outer
  // instance is not kept whole for it; one the walk opened and found a layer missing in is hidden after all
  // Tag's own Pill draws its dot larger than Pill does, so Tag at its props draws pill/dot; a Row's Tag instance the walk
  // opened (its words recoloured) with its Pill left closed records no pill/dot, which is the Pill's to draw
  const tag = () => ({ name: 'Tag', id: '9:5', props: {}, variants: [{ name: 'Tag', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', children: [
    { name: 'Pill', type: 'INSTANCE', instanceOf: 'Pill', layout: 'HORIZONTAL', sizing: 'HUG/HUG', overrides: ['size'], children: [
      { name: 'Dot', type: 'FRAME', sizing: 'FIXED/FIXED', w: 8, h: 8 }, { name: 'Text', type: 'TEXT', text: 'Pill', textStyle: 'Label/sm', fills: ['Text/strong'], sizing: 'HUG/HUG' }] },
    { name: 'Text', type: 'TEXT', text: 'Tag', textStyle: 'Label/sm', fills: ['Text/strong'], sizing: 'HUG/HUG' }] }] });
  const shell = (open, dot = false, words = 'Text/danger') => ({ name: 'Row', id: '9:6', props: {}, variants: [{ name: 'Row', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', children: [
    { name: 'Tag', type: 'INSTANCE', instanceOf: 'Tag', layout: 'HORIZONTAL', sizing: 'HUG/HUG', overrides: ['fills'], children: [
      { name: 'Pill', type: 'INSTANCE', instanceOf: 'Pill', layout: 'HORIZONTAL', sizing: 'HUG/HUG', ...(open && { overrides: ['fills'], children: [
        ...(dot ? [{ name: 'Dot', type: 'FRAME', sizing: 'FIXED/FIXED', w: 8, h: 8 }] : []), { name: 'Text', type: 'TEXT', text: 'Pill', textStyle: 'Label/sm', fills: ['Text/danger'], sizing: 'HUG/HUG' }] }) },
      { name: 'Text', type: 'TEXT', text: 'Tag', textStyle: 'Label/sm', fills: [words], sizing: 'HUG/HUG' }] }] }] });
  const pill = { name: 'Pill', id: '9:3', props: {}, variants: [{ name: 'Pill', type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', children: [
    { name: 'Dot', type: 'FRAME', sizing: 'FIXED/FIXED', w: 6, h: 6 }, { name: 'Text', type: 'TEXT', text: 'Pill', textStyle: 'Label/sm', fills: ['Text/strong'], sizing: 'HUG/HUG' }] }] };
  const mains = mainsFrom({ Pill: pill, Tag: tag() });
  // opened: its words equal Tag's, so only an instance kept whole keeps them; the Pill's dot missing is hidden, present is not
  const closed = derive(shell(false), ['Tag'], { mains }).anatomy, hidden = derive(shell(true, false, 'Text/strong'), ['Tag'], { mains }).anatomy, shown = derive(shell(true, true, 'Text/strong'), ['Tag'], { mains }).anatomy;
  ok('an outer instance is not kept whole for a layer inside a nested instance left closed; it is for one hidden in a nested instance opened',
    closed['tag/text'] && closed['tag/text'].color === 'Text/danger' && !('tag/pill' in closed) && 'tag/text' in hidden && !('tag/text' in shown));
}

// a placed component's part named for the boolean that shows it (showIconIcon, its layer Icon) or renamed in the
// instance (Glyph) is matched to the layer the instance records: equal, it goes; an override on it stays
{
  const b = { contract: 1, component: 'Button', props: { showIcon: { type: 'boolean', default: false, figma: 'Show icon', shows: ['content/showIconIcon'] } },
    anatomy: { root: { kind: 'container' }, content: { kind: 'container', parent: 'root', background: 'C/bg' }, 'content/label': { kind: 'text', parent: 'content', color: 'C/text', order: 1 } },
    variants: [{ when: { showIcon: true }, add: { 'content/showIconIcon': { kind: 'container', parent: 'content', name: 'Icon', background: 'C/icon', order: 0 } } }] };
  const placed = (icon, label, at = 'icon') => { const x = { root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'Button', with: { 'Show icon': true } }, 'b/content': { kind: 'container', parent: 'b', background: 'C/bg', order: 0 }, [`b/content/${at}`]: { kind: 'container', parent: 'b/content', background: icon, order: 0 }, 'b/content/label': { kind: 'text', parent: 'b/content', color: label, order: 1 } }; ownInsides(x, (n) => (n === 'Button' ? b : null)); return Object.keys(x).filter((k) => k.startsWith('b/')); };
  ok('a boolean-named part matches its layer: equal insides go, an override on it stays alone',
    placed('C/icon', 'C/text').length === 0 && JSON.stringify(placed('C/red', 'C/text')) === JSON.stringify(['b/content', 'b/content/icon']));
  ok('a layer renamed in the instance matches its part by place', placed('C/icon', 'C/text', 'glyph').length === 0 && JSON.stringify(placed('C/red', 'C/text', 'glyph')) === JSON.stringify(['b/content', 'b/content/glyph']));
  // a placed menu filled with its own items: the menu's sample items are not drawn, and that hides nothing
  const menu = { contract: 1, component: 'Menu', props: {}, anatomy: { root: { kind: 'container' }, head: { kind: 'text', parent: 'root', color: 'C/text', order: 0 }, list: { kind: 'slot', parent: 'root', content: '{list}', order: 1 }, 'list/sample': { kind: 'text', parent: 'list', color: 'C/text', order: 0 } }, variants: [] };
  const filled = { root: { kind: 'container' }, m: { kind: 'instance', parent: 'root', component: 'Menu' }, 'm/head': { kind: 'text', parent: 'm', color: 'C/text', order: 0 }, 'm/list': { kind: 'slot', parent: 'm', content: '{list}', order: 1 }, 'm/list/mine': { kind: 'text', parent: 'm/list', color: 'C/red', order: 0 } };
  ownInsides(filled, (n) => (n === 'Menu' ? menu : null));
  ok('a placed component whose slot is filled hides none of the slot\'s samples: what equals its component goes, what fills the slot stays', JSON.stringify(Object.keys(filled).filter((k) => k.startsWith('m/'))) === JSON.stringify(['m/list', 'm/list/mine']));
  const unfilled = { root: { kind: 'container' }, m: { kind: 'instance', parent: 'root', component: 'Menu' }, 'm/head': { kind: 'text', parent: 'm', color: 'C/text', order: 0 }, 'm/list': { kind: 'slot', parent: 'm', content: '{list}', order: 1 } };
  ownInsides(unfilled, (n) => (n === 'Menu' ? menu : null));
  ok('and one whose slot shows none of its samples, filled with nothing, hides them: the instance is kept whole', !!unfilled['m/head']);
  // a footer pinned to the bottom of a dialog the instance makes taller stands lower: its near offset follows from that
  // height, no override; a far offset that moves is one
  const dialog = { contract: 1, component: 'Dialog', props: {}, anatomy: { root: { kind: 'container' }, foot: { kind: 'container', parent: 'root', position: 'absolute', absolute: { x: 0, y: 234, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'max' } } } };
  const tall = (abs) => { const x = { root: { kind: 'container' }, d: { kind: 'instance', parent: 'root', component: 'Dialog', height: 'fill' }, 'd/foot': { kind: 'container', parent: 'd', position: 'absolute', absolute: abs, constraints: { horizontal: 'stretch', vertical: 'max' } } }; ownInsides(x, (n) => (n === 'Dialog' ? dialog : null)); return !!x['d/foot']; };
  ok('a part pinned to the far edge is no override where only its near offset moves with the instance\'s size; its far offset is',
    !tall({ x: 0, y: 794, end: 0, bottom: 0 }) && tall({ x: 0, y: 794, end: 0, bottom: 8 }));
  // an arc Figma ends at 0 and code at 360 (a sweep from 270) is one arc: equal to its component's, no override
  const spin = { contract: 1, component: 'Spin', props: {}, anatomy: { root: { kind: 'container' }, arc: { kind: 'graphic', parent: 'root', width: 16, height: 16, background: 'I/strong', shape: 'ellipse', arc: { start: 270, end: 0, inner: 0.75 } } }, variants: [] };
  const spun = (end) => { const x = { root: { kind: 'container' }, s: { kind: 'instance', parent: 'root', component: 'Spin' }, 's/arc': { kind: 'graphic', parent: 's', width: 16, height: 16, background: 'I/strong', shape: 'ellipse', arc: { start: 270, end, inner: 0.75 } } }; ownInsides(x, (c) => (c === 'Spin' ? spin : null)); return !!x['s/arc']; };
  ok('an arc ended at 360 is the one its component ends at 0: no override; a different sweep is one', !spun(360) && !spun(0) && spun(90));
  const { asPlaced } = require('./derive.cjs');
  const P = asPlaced({ root: { kind: 'container' }, 'content/icon': { kind: 'container', parent: 'root' }, 'content/showIconIcon': { kind: 'container', parent: 'root', name: 'Icon' }, 'content/showIconIcon/glyph': { kind: 'graphic', parent: 'content/showIconIcon' } }).M;
  const Q = asPlaced({ root: { kind: 'container' }, content: { kind: 'container', parent: 'root' }, 'content/showIconIcon': { kind: 'container', parent: 'content', name: 'Icon' }, 'content/showIconIcon/v': { kind: 'graphic', parent: 'content/showIconIcon' } });
  ok('a part named for its boolean is keyed by its layer\'s name, and what is under it follows', Q.M['content/icon'] && Q.M['content/icon/v'] && Q.M['content/icon/v'].parent === 'content/icon' && Q.back['content/icon'] === 'content/showIconIcon');
  ok('two parts that would meet under one name keep their own, and what is under one follows its key', P['content/showIconIcon/glyph'] && P['content/showIconIcon/glyph'].parent === 'content/showIconIcon' && P['content/icon']);
}

// a side of padding no token binds keeps its own number beside the bound ones (a chart's bar offset 40 above, bound
// sides around it), never null
{
  const v = { name: 'Size=Large', id: '9:1', type: 'COMPONENT', w: 100, h: 40, layout: 'HORIZONTAL', pad: [40, 0, 0, 0], gap: 0, align: 'MIN/MIN', sizing: 'FIXED/FIXED', bindings: { pad: [null, 'Spacing/0', 'Spacing/0', 'Spacing/0'] }, children: [] };
  const got = derive({ name: 'Bar', id: '9:0', props: { Size: ['Large'] }, variants: [v] }).anatomy.root.layout.padding;
  ok('an unbound side of padding is its number beside the bound sides', JSON.stringify(got) === JSON.stringify({ top: 40, end: 'Spacing/0', bottom: 'Spacing/0', start: 'Spacing/0' }));
}


{
  // a placed instance's own styling equal to its component's root, at the instance's props, is the component's
  const button = { component: 'Button', props: { size: { type: 'enum', values: ['sm', 'lg'], figmaValues: ['Sm', 'Lg'], default: 'sm', figma: 'Size' } },
    anatomy: { root: { kind: 'container', radius: 'Corner/8', layout: { direction: 'row', gap: 8 } } }, variants: [{ when: { size: 'lg' }, set: { 'root.radius': 'Corner/12' } }] };
  const mains = (n) => (n === 'Button' ? button : null);
  const at = (w, own) => ownStyling({ root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'Button', width: 'hug', with: w, ...own } }, mains).b;
  ok('an instance\'s own styling equal to its component\'s root at its props is left out, its size kept; at other props, or another value, it stays',
    at({ Size: 'Sm' }, { radius: 'Corner/8', layout: { direction: 'row', gap: 8 } }).radius === undefined && at({ Size: 'Sm' }, { radius: 'Corner/8' }).width === 'hug'
    && at({ Size: 'Lg' }, { radius: 'Corner/12' }).radius === undefined && at({ Size: 'Lg' }, { radius: 'Corner/8' }).radius === 'Corner/8'
    && at({ Size: 'Sm' }, { layout: { gap: 8, direction: 'row' } }).layout === undefined);
  { const padded = { ...button, anatomy: { root: { ...button.anatomy.root, layout: { direction: 'row', gap: 8, padding: { top: 0, end: 0, bottom: 0, start: 0 } } } } };
    const read = (l) => ownStyling({ root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'Button', with: { Size: 'Sm' }, layout: l } }, (n) => (n === 'Button' ? padded : null)).b.layout;
    ok('a layout read with no padding is its component\'s with four zeros (a reading from code says none it finds none of); one padded otherwise stays',
      read({ direction: 'row', gap: 8 }) === undefined && read({ direction: 'row', gap: 8, padding: { top: 2, end: 0, bottom: 0, start: 0 } }) !== undefined); }
  { const tinted = { ...button, anatomy: { root: { ...button.anatomy.root, modes: { palette: 'blue' } } } };
    const t = (m) => ownStyling({ root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'Button', with: { Size: 'Sm' }, modes: m } }, (n) => (n === 'Button' ? tinted : null)).b.modes;
    ok('an instance\'s modes equal to its component\'s own are the component\'s; another mode stays', t({ palette: 'blue' }) === undefined && t({ palette: 'red' }).palette === 'red'); }
}


{
  // the one spelling every reader writes: a stroke even on four sides is one weight
  const button = { component: 'Button', props: { size: { type: 'enum', values: ['sm', 'lg'], figmaValues: ['Sm', 'Lg'], default: 'sm', figma: 'Size' }, disabled: { type: 'boolean', default: false, figma: 'Disabled' }, label: { type: 'string', default: 'New', figma: 'Label' } }, anatomy: { root: { kind: 'container' } }, variants: [] };
  const mains = (n) => (n === 'Button' ? button : null);
  const nf = (e) => normalForm({ x: e }).x;
  ok('a stroke of one weight on every side is that weight, bound or not; one on some sides keeps its sides',
    JSON.stringify(nf({ border: { color: 'S/a', width: ['S/1', 'S/1', 'S/1', 'S/1'], sides: { top: 1, end: 1, bottom: 1, start: 1 } } }).border) === '{"color":"S/a","width":"S/1"}'
    && nf({ border: { color: 'S/a', sides: { top: 1, end: 1, bottom: 1, start: 1 } } }).border.width === 1
    && Array.isArray(nf({ border: { color: 'S/a', width: ['S/1', 0, 0, 0], sides: { top: 1, end: 0, bottom: 0, start: 0 } } }).border.width));
  ok('a weight per side in plain numbers that only repeats the sides is the sides alone, as a stroke no variable weights',
    JSON.stringify(nf({ border: { color: 'S/a', width: [0, 0, 1, 0], sides: { top: 0, end: 0, bottom: 1, start: 0 } } }).border) === '{"color":"S/a","sides":{"top":0,"end":0,"bottom":1,"start":0}}'
    && Array.isArray(nf({ border: { color: 'S/a', width: [0, 0, 2, 0], sides: { top: 0, end: 0, bottom: 1, start: 0 } } }).border.width));
  ok('a stroke with a weight and no paint is no stroke', nf({ border: { width: 'S/4' } }).border === undefined);
  // the spelling settled before an instance is held to its component: a stroke recorded by its sides is its component's one weight
  const framed = { component: 'Frame', props: {}, anatomy: { root: { kind: 'container', border: { color: 'c', width: 1 } } }, variants: [] };
  const placed = normalForm({ f: { kind: 'instance', component: 'Frame', border: { color: 'c', sides: { top: 1, end: 1, bottom: 1, start: 1 } } } });
  ok('an instance\'s stroke said by its sides is its component\'s one weight once both are in the one spelling', ownStyling(placed, (n) => (n === 'Frame' ? framed : null)).f.border === undefined);
}

{
  // an icon from a set the library does not hold: its scaled graphic's box is the icon's drawing, its colour the override
  const icon = () => ({ i: { kind: 'instance', component: 'Icon/house', width: 20, height: 20 }, 'i/v': { kind: 'graphic', parent: 'i', width: 16.67, height: 17.5, constraints: { horizontal: 'scale', vertical: 'scale' }, background: 'C/icon' } });
  const a = icon(); ownGlyph(a, 'i');
  const clipped = icon(); clipped.i.overflow = 'hidden'; ownGlyph(clipped, 'i');
  ok('an icon\'s frame clipping its glyph is the icon\'s own, left out', !('overflow' in clipped.i));
  const fixed = icon(); fixed['i/v'].constraints = { horizontal: 'min', vertical: 'min' }; ownGlyph(fixed, 'i');
  { const wrap = derive({ name: 'Wrap', props: {}, variants: [{ name: 'Wrap', type: 'COMPONENT', layout: 'HORIZONTAL', children: [
      { name: 'I', type: 'INSTANCE', instanceOf: 'Icon/house', w: 20, h: 20, sizing: 'FIXED/FIXED', children: [{ name: 'V', type: 'VECTOR', x: 2, y: 1, w: 16.67, h: 17.5, sizing: 'FIXED/FIXED', constraints: 'SCALE/SCALE', fills: ['C/icon'] }] }] }] }, [], { mains: () => null }).anatomy;
    ok('through derive, an outside icon\'s scaled glyph keeps its scale until ownGlyph folds it: no box of its own left', !!wrap['i/v'] && (wrap['i/v'].width === undefined && wrap['i/v'].constraints === undefined)); }
  { // a scale both ways inside an instance (Material's card state layer, Atlassian's spinner): its component's where its part
    // there is constrained alike, left out; one its component constrains otherwise, or with no component to hold it to, kept
    const layer = (c) => ({ name: 'Layer', type: 'FRAME', x: 0, y: 0, w: 360, h: 80, sizing: 'FIXED/FIXED', layout: 'VERTICAL', constraints: c, fills: ['C/layer'] });
    const dot = { name: 'Dot', type: 'ELLIPSE', x: 4, y: 4, w: 8, h: 8, sizing: 'FIXED/FIXED', constraints: 'SCALE/SCALE', fills: ['C/dot'] };
    const main = (c) => derive({ name: 'Card state', props: {}, variants: [{ name: 'Card state', type: 'COMPONENT', w: 360, h: 80, children: [layer(c), dot] }] });
    const card = (mains) => derive({ name: 'Card', props: {}, variants: [{ name: 'Card', type: 'COMPONENT', layout: 'HORIZONTAL', children: [
      { name: 'State', type: 'INSTANCE', instanceOf: 'Card state', w: 360, h: 80, sizing: 'FIXED/FIXED', children: [layer('SCALE/SCALE'), { ...dot, fills: ['C/other'] }] }] }] }, ['Card state'], mains ? { mains } : {}).anatomy;
    const alike = card((n) => (n === 'Card state' ? main('SCALE/SCALE') : null)), other = card((n) => (n === 'Card state' ? main('MIN/MIN') : null)), none = card(null);
    ok('inside an instance, a scale both ways equal to its component\'s part is the component\'s, left out (figma-fact: no-nested-position-override); one the component constrains otherwise, or with no component held, is kept',
      !!alike['state/dot'] && alike['state/dot'].constraints === undefined && (!alike['state/layer'] || alike['state/layer'].constraints === undefined)
      && !!other['state/layer'] && !!other['state/layer'].constraints && !!none['state/layer'] && !!none['state/layer'].constraints); }
  { // two deep (Material's slider: a track stop's dot, recoloured by the track, inside the track placed in the slider): the
    // track's own contract has the dot's scale left out at the stop's turn, so the slider's walk of it, constrained alike,
    // is the track's, not an override
    const dot = (fill) => ({ name: 'Dot', type: 'ELLIPSE', x: 0, y: 0, w: 4, h: 4, sizing: 'FIXED/FIXED', constraints: 'SCALE/SCALE', fills: [fill] });
    const specs = { Stop: { name: 'Stop', props: {}, variants: [{ name: 'Stop', type: 'COMPONENT', w: 4, h: 4, children: [dot('C/a')] }] },
      Track: { name: 'Track', props: {}, variants: [{ name: 'Track', type: 'COMPONENT', layout: 'HORIZONTAL', children: [{ name: 'Stop', type: 'INSTANCE', instanceOf: 'Stop', w: 4, h: 4, sizing: 'FIXED/FIXED', children: [dot('C/b')] }] }] } };
    // (each component's contract as stored, itself derived against the others, as a reading's placed components are)
    const known = ['Stop', 'Track'], mains = mainsFrom(specs, known, () => ({ mains: mainsFrom(specs, known) }));
    const slider = derive({ name: 'Slider', props: {}, variants: [{ name: 'Slider', type: 'COMPONENT', layout: 'HORIZONTAL', children: [{ name: 'Track', type: 'INSTANCE', instanceOf: 'Track', children: [
      { name: 'Stop', type: 'INSTANCE', instanceOf: 'Stop', w: 4, h: 4, sizing: 'FIXED/FIXED', children: [dot('C/b')] }] }] }] }, known, { mains }).anatomy;
    ok('a layer two instances deep, constrained as its own component constrains it, is the outer component\'s and left out',
      mains('Track').anatomy['stop/dot'] && mains('Track').anatomy['stop/dot'].constraints === undefined && !slider['track/stop/dot']); }
  { // a part swapped to another component (its key not the main's) is not the main's part: its constraints, even equal, are kept
    const holder = { contract: 1, component: 'Holder', props: {}, anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Icon', key: 'k1', position: 'absolute', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'scale', vertical: 'scale' } } }, variants: [] };
    const x = { root: { kind: 'container' }, h: { kind: 'instance', parent: 'root', component: 'Holder' }, 'h/i': { kind: 'instance', parent: 'h', component: 'Icon', key: 'k2', constraints: { horizontal: 'scale', vertical: 'scale' } } };
    ownInsides(x, (n) => (n === 'Holder' ? holder : null), { partial: true });
    ok('a part swapped to another component keeps its constraints, though equal to the part it replaced', !!x['h/i'] && !!x['h/i'].constraints); }
  const by = byComponentName([{ component: 'Button' }, { component: 'button' }, { component: 'Chip' }]);
  ok('a component is found by its name in any case; a name two components share finds none', by('CHIP').component === 'Chip' && by('Button') === null);
  // a swap names its target by its own name or by its main's folder: the instance placed there says which
  const ib = { component: 'Icon button', props: { icon: { type: 'instance', figma: 'Icon', swaps: ['content/icon'] } }, anatomy: { root: { kind: 'container' }, content: { kind: 'container', parent: 'root' }, 'content/icon': { kind: 'instance', parent: 'content', component: 'Icon/plus' } }, variants: [] };
  const placedIb = (inner) => { const x = { root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'Icon button', with: { Icon: 'x' } }, 'b/content': { kind: 'container', parent: 'b' }, 'b/content/icon': { kind: 'instance', parent: 'b/content', component: inner } }; ownInsides(x, (n) => (n === 'Icon button' ? ib : null)); return Object.keys(x).length; };
  ok('an instance swapped to x is its component as placed, whether x is named whole or in its folder; another icon is kept', placedIb('x') === 2 && placedIb('Icon/x') === 2 && placedIb('y') === 4);
  // keyed (each instance carries its key): the swap's icon is the placed one's, never the main's default icon's key
  const ibK = structuredClone(ib); ibK.anatomy['content/icon'].key = 'plus';
  const keyed = () => { const x = { root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'Icon button', with: { Icon: 'x' } }, 'b/content': { kind: 'container', parent: 'b' }, 'b/content/icon': { kind: 'instance', parent: 'b/content', component: 'x', key: 'xk' } }; ownInsides(x, (n) => (n === 'Icon button' ? ibK : null)); return Object.keys(x).length; };
  ok('a keyed instance swapped to x is its component as placed (the default icon\'s key is not carried to x)', keyed() === 2);
  // a reading from code holds no key: an unswapped icon equal to the keyed main's is still the main's own
  const unkeyed = () => { const x = { root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'Icon button' }, 'b/content': { kind: 'container', parent: 'b' }, 'b/content/icon': { kind: 'instance', parent: 'b/content', component: 'Icon/plus' } }; ownInsides(x, (n) => (n === 'Icon button' ? ibK : null)); return Object.keys(x).length; };
  ok('an instance\'s key is no look: a reading without one folds into its keyed component', unkeyed() === 2);
  const otherKey = () => { const x = { root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'Icon button' }, 'b/content': { kind: 'container', parent: 'b' }, 'b/content/icon': { kind: 'instance', parent: 'b/content', component: 'Icon/plus', key: 'another' } }; ownInsides(x, (n) => (n === 'Icon button' ? ibK : null)); return Object.keys(x).length; };
  ok('a nested instance of the same name but another key is an override, kept', otherKey() === 4);
  // a reading marks an icon the placed component draws as a glyph naming it (data-icon), not yet its instance: held to
  // that instance, it is the component's own (Carbon's Toggletip's Information, kept in every field's label before)
  { const tip = { component: 'Toggletip', props: {}, anatomy: { root: { kind: 'container' }, information: { kind: 'instance', parent: 'root', component: 'Information', key: 'ik', width: 16, height: 16, order: 0 }, 'information/vector': { kind: 'graphic', parent: 'information', background: 'Icon/secondary', order: 0 } }, variants: [] };
    const read = (g, reading = true) => { const x = { root: { kind: 'container' }, t: { kind: 'instance', parent: 'root', component: 'Toggletip' }, 't/information': { kind: 'graphic', parent: 't', order: 0, width: 16, height: 16, ...g } }; ownInsides(x, (n) => (n === 'Toggletip' ? tip : null), { partial: true, reading }); return !!x['t/information']; };
    ok('a reading\'s glyph naming the icon its placed component draws there is that instance, its own: not kept', !read({ asset: 'Information', background: 'Icon/secondary' }) && !read({ asset: 'Information', iconSize: 16 }));
    ok('a glyph naming another icon, coloured otherwise, or not a reading\'s, stays kept', read({ asset: 'Warning' }) && read({ asset: 'Information', background: 'Icon/disabled' }) && read({ asset: 'Information' }, false) && read({ asset: 'Information', iconSize: 20, width: 20, height: 20 })); }
  // a swap to a component this library holds draws that component's insides: a colour is held to its, not the default's
  const iconC = (name, bg) => ({ component: name, props: {}, anatomy: { root: { kind: 'container' }, v: { kind: 'graphic', parent: 'root', background: bg } }, variants: [] });
  const swapBy = { Button: { component: 'Button', props: { icon: { type: 'instance', figma: 'Icon', swaps: ['i'] } }, anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Icon/check' }, 'i/v': { kind: 'graphic', parent: 'i', background: 'Text/strong' } }, variants: [] }, 'Icon/alert': iconC('Icon/alert', 'Status/danger'), 'Icon/check': iconC('Icon/check', 'Text/strong') };
  const toAlert = (bg) => { const x = { root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'Button', with: { Icon: 'alert' } }, 'b/i': { kind: 'instance', parent: 'b', component: 'Icon/alert' }, 'b/i/v': { kind: 'graphic', parent: 'b/i', background: bg } }; ownInsides(x, (n) => swapBy[n] || null); return Object.keys(x).length; };
  ok('a swapped icon\'s colour equal to the default icon\'s but not its own is an override, kept; its own colour goes', toAlert('Text/strong') === 4 && toAlert('Status/danger') === 2);
  ok('a glyph scaled to its icon keeps only its colour; one placed by fixed constraints keeps its box',
    JSON.stringify(a['i/v']) === '{"kind":"graphic","parent":"i","background":"C/icon"}' && fixed['i/v'].width === 16.67);
}

{
  // a layer read inside a placed instance at its component's look but for the place and constraints the component gives it
  // (Atlassian's Checkbox icon: its box at 1, 1, scaled, read from code with neither) is the component's: an instance
  // cannot override them (figma-fact: no-nested-position-override), so they are no override in a reading; a fill is
  const main = { component: 'Icon', props: {}, anatomy: { root: { kind: 'container' }, box: { kind: 'container', parent: 'root', width: 16, height: 16 },
    'box/check': { kind: 'container', parent: 'box', width: 14, height: 14, absolute: { x: 1, y: 1 }, constraints: { horizontal: 'scale', vertical: 'scale' }, background: 'C/a' } }, variants: [] };
  const read = (bg) => ({ root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Icon' }, 'i/box': { kind: 'container', parent: 'i', width: 16, height: 16 }, 'i/box/check': { kind: 'container', parent: 'i/box', width: 14, height: 14, background: bg } });
  const m = (x) => (x === 'Icon' ? main : null);
  const same = read('C/a'), other = read('C/b'), design = read('C/a');
  ownInsides(same, m, { partial: true, reading: true }); ownInsides(other, m, { partial: true, reading: true }); ownInsides(design, m, { partial: true });
  ok('in a reading, a layer inside an instance that differs from its component\'s only in place and constraints is the component\'s; one of another fill is kept, and a design keeps its rule',
    !same['i/box'] && !same['i/box/check'] && other['i/box/check'].background === 'C/b' && !!other['i/box'] && !!design['i/box/check']);
  // one the reading places elsewhere than its component does is a difference the reading states, kept; at the component's
  // own place, the component's
  const moved = read('C/a'), atOwn = read('C/a');
  moved['i/box/check'] = { ...moved['i/box/check'], absolute: { x: 3, y: 3 } };
  atOwn['i/box/check'] = { ...atOwn['i/box/check'], absolute: { x: 1, y: 1 }, constraints: { horizontal: 'scale', vertical: 'scale' } };
  ownInsides(moved, m, { partial: true, reading: true }); ownInsides(atOwn, m, { partial: true, reading: true });
  ok('in a reading, a part placed elsewhere than its component places it is kept; at its component\'s place it is the component\'s',
    !!moved['i/box/check'] && moved['i/box/check'].absolute.x === 3 && !atOwn['i/box/check']);
}

{
  // an icon coloured on its instance (code's way) at the colour its component gives the glyph inside (Figma's way) is the
  // component's; a colour the component does not give is the instance's own. In an instance the design keeps whole it
  // stays: the design keeps the glyph's colour there too (Carbon's select chevron: Icon/icon-primary, read back as none)
  const main = { component: 'IB', props: {}, anatomy: { root: { kind: 'container' }, content: { kind: 'container', parent: 'root' }, 'content/icon': { kind: 'instance', parent: 'content', component: 'Icon/x', width: 20, height: 20 }, 'content/icon/icon': { kind: 'graphic', parent: 'content/icon', background: 'C/strong' } }, variants: [] };
  const read = (bg, kind = 'graphic') => ({ root: { kind: 'container' }, b: { kind: 'instance', parent: 'root', component: 'IB' }, 'b/content': { kind: 'container', parent: 'b', background: 'C/own' }, 'b/content/icon': { kind, parent: 'b/content', width: 20, height: 20, ...(kind === 'instance' && { component: 'Icon/x' }), background: bg } });
  const m = (x) => (x === 'IB' ? main : null);
  const same = read('C/strong'), other = read('C/danger'), whole = read('C/strong', 'instance');
  ownInsides(same, m, { partial: true, reading: true }); ownInsides(other, m, { partial: true, reading: true }); ownInsides(whole, m, { partial: true, whole: new Set(['b']), reading: true });
  const design = read('C/strong'); ownInsides(design, m, { partial: true });
  // kept whole, but the design states no colour for that icon nor its glyph (Carbon's Status notification's Warning--filled
  // in a slider's error state): the reading's colour at the component's own is the component's there too
  const unstated = read('C/strong', 'instance'), stated = read('C/strong', 'instance');
  ownInsides(unstated, m, { partial: true, whole: new Set(['b']), coloured: new Set(['b/content']), reading: true });
  ownInsides(stated, m, { partial: true, whole: new Set(['b']), coloured: new Set(['b/content/icon/icon']), reading: true });
  ok('in an instance kept whole, a reading keeps the icon\'s colour only where the design states one for the icon or its glyph',
    unstated['b/content/icon'].background === undefined && stated['b/content/icon'].background === 'C/strong');
  ok('in a reading, an icon at its component\'s glyph colour is the component\'s; another colour, or a design\'s, is kept',
    same['b/content/icon'] && same['b/content/icon'].background === undefined && other['b/content/icon'].background === 'C/danger' && design['b/content/icon'].background === 'C/strong');
  ok('in an instance the design keeps whole, a reading keeps the icon\'s colour, as the design keeps its glyph\'s',
    whole['b/content/icon'].background === 'C/strong');
}

{ // a mirrored layer stands where its box does (the snapshot's visual), not at its matrix's origin: CSS's left and code's box
  const box = { name: 'Box', id: '9:1', props: {}, variants: [{ name: 'Default', type: 'COMPONENT', w: 64, h: 64, children: [
    { name: 'Art', type: 'FRAME', w: 176, h: 176, x: 64, y: -56, visual: { x: -112, y: -56, w: 176, h: 176 }, flip: 'x', absolute: true, constraints: 'MAX/MIN' }] }] };
  const a = derive(box).anatomy.art;
  ok('a mirrored layer is flip x at its box\'s near edge, its far offset from there', a && a.flip === 'x' && a.absolute.x === -112 && a.absolute.end === 0);
  const up = JSON.parse(JSON.stringify(box)); Object.assign(up.variants[0].children[0], { flip: 'y', x: 0, y: 120, visual: undefined, constraints: 'MIN/MIN' });
  const b = derive(up).anatomy.art;
  ok('a vertical mirror, which the snapshot gives no visual box, stands at its far edge less its height', b && b.flip === 'y' && b.absolute.y === -56); }
{ // a layer's variable modes are keyed as the token build writes them: a theme under `theme`, another axis under its
  // first collection's name, one the tokens do not hold under its own; a variant that sets another mode sets it
  const MODES = require('../tokens/modes.cjs');
  const axes = MODES.axesOfTokens({ collections: { '2. Primitives - Colour': { modes: ['Light', 'Dark'] }, '3. Semantic': { modes: ['Light', 'Dark'] }, '5. Responsive type': { modes: ['Desktop', 'Mobile'] } } });
  const v = (bp, mode) => ({ name: `Breakpoint=${bp}`, type: 'COMPONENT', w: 64, h: 64, modes: { '5. Responsive type': mode }, children: [
    { name: 'Card', type: 'FRAME', w: 64, h: 64, modes: { '3. Semantic': 'Dark', 'Density': 'Compact' } }] });
  const spec = { name: 'Box', id: '9:2', props: { Breakpoint: ['md', 'sm'] }, variants: [v('md', 'Desktop'), v('sm', 'Mobile')] };
  const k = derive(spec, [], { modeAxes: axes });
  ok('a mode is keyed by its axis\'s attribute, a variant\'s own mode set by the variant',
    k.anatomy.root.modes['5-responsive-type'] === 'desktop' && k.anatomy.card.modes.theme === 'dark' && k.anatomy.card.modes.density === 'compact'
    && k.variants.some((x) => x.when.breakpoint === 'sm' && x.set['root.modes']['5-responsive-type'] === 'mobile'));
  ok('the contract it keys holds every variant\'s modes', selfCheck(spec, k, [], { modeAxes: axes }).length === 0); }
{ // a part a layer removes takes its parts with it: a later layer adding it back brings back only what it adds (a
  // helper hidden, then its margin put back for a warning, without the warning's words)
  const c = { contract: 1, component: 'Field', props: { help: { type: 'boolean', default: true }, state: { type: 'enum', values: ['rest', 'warning'], default: 'rest' } },
    anatomy: { root: { kind: 'container' }, margin: { kind: 'container', parent: 'root' } },
    variants: [{ when: { state: 'warning' }, add: { words: { kind: 'text', parent: 'margin' } } }, { when: { help: false }, remove: ['margin'] },
      { when: { help: false, state: 'warning' }, add: { margin: { kind: 'container', parent: 'root' } } }] };
  const e = expand(c, { help: false, state: 'warning' });
  ok('a part put back comes back without the parts its removal took', 'margin' in e && !('words' in e)); }
{ // two Figma props that camel-case alike (a boolean `title` beside its text `↳ ✏️ title`) stay two props
  const twin = { name: 'Header', id: '9:4', props: { title: 'BOOLEAN', '↳ ✏️ title': 'TEXT' }, links: { title: { kind: 'visible', layers: ['Title'] }, '↳ ✏️ title': { kind: 'characters', layers: ['Title'] } },
    variants: [{ name: 'Default', type: 'COMPONENT', w: 10, h: 10, children: [{ name: 'Title', type: 'TEXT', text: 'Hi', w: 5, h: 5 }] }] };
  const c = derive(twin);
  ok('a boolean and a text named alike are two props, the text keeping the name', c.props.title && c.props.title.type === 'string' && c.props.showTitle && c.props.showTitle.type === 'boolean'); }
{ // a part one layer adds under a parent an earlier layer removed is not drawn, and a later layer putting the parent
  // back does not bring it with it (a keyboard's emoji glyph, landscape, inside a row the alphanumeric layout drops)
  const c = { contract: 1, component: 'Keys', props: { config: { type: 'enum', values: ['base', 'alpha'], default: 'base' }, style: { type: 'enum', values: ['portrait', 'landscape'], default: 'portrait' } },
    anatomy: { root: { kind: 'container' }, row: { kind: 'container', parent: 'root' } },
    variants: [{ when: { config: 'alpha' }, remove: ['row'] }, { when: { style: 'landscape' }, add: { glyph: { kind: 'graphic', parent: 'row' } } },
      { when: { config: 'alpha', style: 'landscape' }, add: { row: { kind: 'container', parent: 'root' } } }] };
  const e = expand(c, { config: 'alpha', style: 'landscape' });
  ok('a part added while its parent was gone stays gone when the parent comes back', 'row' in e && !('glyph' in e)); }
{ // options that kebab alike (a slider's -50 and +50) stay two values, their signs spelled
  const L = await import('./layers.mjs');
  ok('-50, 0 and +50 are three values', JSON.stringify(L.valueIds(['-50', '0', '+50'])) === '["minus-50","0","plus-50"]');
  ok('options that differ only by case still differ', JSON.stringify(L.valueIds(['a', 'A'])) === '["a","a-2"]'); }
{ // a layer name may hold a line separator (U+2028, pasted from text): its id is made all the same
  const sep = { name: 'Box', id: '9:3', props: {}, variants: [{ name: 'Default', type: 'COMPONENT', w: 10, h: 10, children: [{ name: 'Replace\u2028with an image', type: 'TEXT', text: 'x', w: 5, h: 5 }] }] };
  ok('a name with a line separator derives, its id camel-cased across it', Object.keys(derive(sep).anatomy).length === 2); }
{ // an empty auto layout that hugs keeps its last size (a dialog's empty content): that is its least; one a boolean
  // fills in another variant only holds a hidden layer, and keeps nothing
  const frame = (kids, type = 'SLOT') => ({ name: 'Content', type, w: 400, h: 200, layout: 'VERTICAL', pad: [20, 20, 20, 20], gap: 0, align: 'MIN/MIN', sizing: 'FILL/HUG', children: kids });
  const spec = (second) => ({ name: 'D', id: '9:2', props: { Show: 'BOOLEAN', Size: ['md'] }, links: { Show: { kind: 'visible', layers: [['Content', 'Body']] } },
    variants: [{ name: 'Size=md', type: 'COMPONENT', w: 400, h: 200, layout: 'VERTICAL', pad: [0, 0, 0, 0], sizing: 'FIXED/HUG', children: [frame([])] }, ...second] });
  const empty = derive(spec([])).anatomy.content;
  const shown = derive(spec([{ name: 'Size=md, Show=True', type: 'COMPONENT', w: 400, h: 200, layout: 'VERTICAL', pad: [0, 0, 0, 0], sizing: 'FIXED/HUG', children: [frame([{ name: 'Body', type: 'TEXT', w: 360, h: 160 }])] }])).anatomy.content;
  ok('an empty hugging frame keeps its size while it is empty (whileEmpty); one a variant fills does not', empty.minHeight === 200 && JSON.stringify(empty.whileEmpty) === '["minHeight"]' && !('emptyKept' in empty) && shown.minHeight === undefined && !('whileEmpty' in shown) && !('emptyKept' in shown));
  const two = spec([]); two.props.Size = ['md', 'lg']; two.variants.push({ name: 'Size=lg', type: 'COMPONENT', w: 400, h: 200, layout: 'VERTICAL', pad: [0, 0, 0, 0], sizing: 'FIXED/HUG', children: [frame([{ name: 'Body', type: 'TEXT', w: 360, h: 160 }])] });
  ok('another variant filling a part of that name leaves this one\'s kept size', derive(two).anatomy.content.minHeight === 200);
  const plain = spec([]); plain.variants[0].children = [frame([], 'FRAME')];
  ok('a plain frame recorded empty keeps nothing (its layers may be hidden ones the walk skipped)', derive(plain).anatomy.content.minHeight === undefined); }
{ // a placed instance is the component its key says: a name another component carries (an icon named Checkbox beside
  // the Checkbox set) is a fallback only where the key does not contradict it (layers.mjs keyMatches, placedOf)
  const box = { component: 'Checkbox', figma: { key: 'set' } }, chip = { component: 'Chip' };
  const by = byComponentName([box, chip]);
  ok('a key the store holds places that component', by('Anything', 'set') === box);
  ok('a name whose component has another key is not that component', by('Checkbox', 'icon') === null);
  ok('no key, or a component with none, falls back to the name', by('Checkbox') === box && by('Chip', 'x') === chip);
  const { placedOf } = await import('./layers.mjs');
  const lib = { Checkbox: box, Chip: chip };
  ok('placedOf holds the same rule', placedOf(lib, { component: 'Checkbox', key: 'icon' }) === null && placedOf(lib, { component: 'Checkbox', key: 'set' }) === box && placedOf(lib, { component: 'Chip' }) === chip);
  const icon = { name: 'Row', id: '9:4', props: {}, variants: [{ name: 'Default', type: 'COMPONENT', w: 20, h: 20, children: [{ name: 'Checkbox', type: 'INSTANCE', instanceOf: 'Checkbox', instanceOfKey: 'icon', w: 16, h: 16 }] }] };
  const e = Object.values(derive(icon).anatomy).find((x) => x.kind === 'instance');
  ok('derive writes the key the snapshot recorded on the instance', e && e.key === 'icon');
  const local = structuredClone(icon); delete local.variants[0].children[0].instanceOfKey;
  ok('a local component (no key) is written without one', !('key' in Object.values(derive(local).anatomy).find((x) => x.kind === 'instance'))); }

// 2026-11-22: the snapshot router reads derive.cjs fresh and keeps the rules.mjs it first loaded (clearing require.cache
// never reloads an .mjs), and store.cjs deletes a contract whose derive threw: rules without the 0.82.0 helpers are
// the old derive, never a throw
{
  const file = require.resolve('./derive.cjs'), real = createRequire(file), src = (await import('node:fs')).readFileSync(file, 'utf8').replace(/^#!.*/, '');
  const older = (...without) => { const m = { exports: {} }, rules = { ...real('./rules.mjs') }; for (const k of without) delete rules[k];
    new Function('require', 'module', 'exports', src)(Object.assign((id) => (id === './rules.mjs' ? rules : real(id)), { resolve: real.resolve }), m, m.exports); return m.exports.derive; };
  const spec = { name: 'T', props: {}, variants: [{ name: 'T', type: 'COMPONENT', layout: 'VERTICAL', children: [{ name: 'W', type: 'TEXT', text: 'Hi', textStyle: 'literal', fontSize: 12, fontFamily: 'Inter', fontStyle: 'Regular', lineHeight: '16', letterSpacing: '0.16', textCase: 'UPPER', textDecoration: 'UNDERLINE' }] }] };
  const was = '{"kind":"text","parent":"root","typography":"literal","content":"Hi","order":0}';
  for (const without of [['typeFromFigma', 'spacingFromFigma'], ['typeFromFigma'], ['spacingFromFigma']]) {
    let got; try { got = JSON.stringify(older(...without)(spec).anatomy.w); } catch (e) { got = e.message; }
    ok(`rules without ${without.join(' and ')}: a literal text stays as stored, no new field and no throw`, got === was);
  }
  ok('…and with them it carries its values', older()(spec).anatomy.w.typography === 'literal 12/16 regular Inter');
}
// 2026-11-23: a menu item whose top spacer and divider are each shown by a boolean, both hidden by default. Each boolean
// is walked alone, so each layer stood at the same place among the visible ones, and which comes first was a tie the
// markup broke by the order the props are listed in: the divider first, where Figma draws the top spacer first.
// Snapshot 0.83.0 says each layer's place among all its parent's children (`index`); where two booleans' layers would
// tie, that place orders them. Props listed divider first, so the old tie-break is the wrong order.
{
  const { markupOrder, partsOf, childrenOf } = await import('./to-code.mjs');
  const frame = (name, index, extra = {}) => ({ name, type: 'FRAME', sizing: 'FILL/FIXED', w: 200, h: 8, ...(index == null ? {} : { index }), ...extra });
  const row = (index) => frame('Content', index, { layout: 'HORIZONTAL', sizing: 'FILL/HUG', h: 32, children: [{ name: 'Label', type: 'TEXT', text: 'Item', textStyle: 'Body/md', sizing: 'HUG/HUG' }] });
  const item = (name, kids) => ({ name, type: 'COMPONENT', layout: 'VERTICAL', sizing: 'FIXED/HUG', w: 200, h: 40, align: 'MIN/MIN', children: kids });
  const menu = (placed) => {
    const at = (i) => (placed ? i : null);
    return { name: 'Menu item', id: '7:1', props: { Divider: 'BOOLEAN', 'Top spacer': 'BOOLEAN', State: ['Rest'] }, variants: [
      item('State=Rest', [row(at(2))]),
      item('State=Rest, Divider=True', [frame('Divider', at(1), { h: 1, fills: ['Border'] }), row(at(2))]),
      item('State=Rest, Top spacer=True', [frame('Top spacer', at(0)), row(at(2))]),
    ] };
  };
  const firstOf = (c) => markupOrder(c, childrenOf(partsOf(c)).get('root')).order.map((p) => p.id);
  const placed = derive(menu(true)), unplaced = derive(menu(false));
  ok('two layers two booleans show, both hidden by default, are written in the order Figma draws them, by each one\'s place among all its parent\'s children',
    JSON.stringify(firstOf(placed)) === JSON.stringify(['topSpacerTopSpacer', 'dividerDivider', 'content']));
  const both = expand(placed, { divider: true, topSpacer: true, state: 'rest' });
  ok('…and both on, the contract draws them so, the content after them',
    both.topSpacerTopSpacer.order < both.dividerDivider.order && both.dividerDivider.order < both.content.order);
  ok('…and it still rebuilds every variant it was derived from', selfCheck(menu(true), placed).length === 0);
  ok('a snapshot from before the place was recorded derives exactly as it did: both at the one place, a tie',
    unplaced.variants.every((v) => Object.values(v.add || {}).every((e) => e.order === 0)) && JSON.stringify(firstOf(unplaced)) === JSON.stringify(['dividerDivider', 'topSpacerTopSpacer', 'content']));
  // where nothing would tie (one boolean's layer), the place changes nothing: a re-snapshot moves no contract
  const one = (placedIt) => { const m = menu(placedIt); m.props = { Divider: 'BOOLEAN', State: ['Rest'] }; m.variants = m.variants.slice(0, 2); return m; };
  ok('…and where nothing would tie, a snapshot that records the place derives the very contract one before it did',
    JSON.stringify(derive(one(true))) === JSON.stringify(derive(one(false))));
}
console.log(`${n}/${n} passed`);
