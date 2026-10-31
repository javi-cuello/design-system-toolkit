#!/usr/bin/env node
// tools/component-contract/from-code.mjs: the pure parts of reading a contract from code.
import assert from 'node:assert/strict';
import { designTokenFor, writtenAs, styleFor, usageIn, delta, asFigma, offerFor, governedReading, controlsApi, cornerOf, isSlot, slotMark } from './from-code.mjs';
import { cssName } from '../tokens/names.mjs';
import { createRequire } from 'node:module';
const { expand } = createRequire(import.meta.url)('./derive.cjs');
import { judge } from '../parity/external.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const table = [['Color/Background/Neutral/secondary', '#eeeeee'], ['Color/Background/Neutral/secondary-translucent', 'rgb(22 22 22 / 0.073)'],
  ['Color/Icon/Feedback/Danger/primary', '#5e0007'], ['Color/Icon/Supportive/Red/primary', '#5e0007'], ['Color/Text/Feedback/Danger/primary', '#5e0007'],
  ['Spacing/8', 8], ['Corner radius/8', 8], ['Stroke/1', 1]];
// the groups a library's own contracts use for each field (no token path is assumed: these are the library's)
const offered = offerFor([{ anatomy: { box: { kind: 'container', background: 'Color/Background/Neutral/secondary', radius: 'Corner radius/8', layout: { gap: 'Spacing/8' }, border: { color: 'Color/Stroke/x', width: 'Stroke/1' } },
  label: { kind: 'text', color: 'Color/Text/Feedback/Danger/primary' }, glyph: { kind: 'graphic', background: 'Color/Icon/Feedback/Danger/primary' } } }]);
ok('a value takes the token its field offers that holds it: a background among the library\'s backgrounds, a gap among its spacings, never a radius of the same number',
  designTokenFor('background', 'rgb(238, 238, 238)', table, {}, null, null, offered).token === 'Color/Background/Neutral/secondary'
  && designTokenFor('space', 8, table, {}, null, null, offered).token === 'Spacing/8' && designTokenFor('radius', 8, table, {}, null, null, offered).token === 'Corner radius/8'
  && designTokenFor('text', '#5e0007', table, {}, null, null, offered).token === 'Color/Text/Feedback/Danger/primary' && designTokenFor('space', 7, table, {}, null, null, offered).value === 7);
ok('a field nothing is known of (no scopes, never set by the library) names no token rather than guess among every token of that number',
  designTokenFor('fontSize', 14, [['Spacing/14', 14], ['Font/Size/14', 14]], {}, null, null, offerFor([])).value === 14);
ok('Figma\'s own scopes, where the snapshot recorded them, decide before the library\'s groups',
  designTokenFor('radius', 8, [['Spacing/8', 8, ['GAP']], ['Corner radius/8', 8, ['CORNER_RADIUS']]], {}, null, null, offerFor([])).token === 'Corner radius/8');
ok('several tokens holding it: the one the library uses most; an even count is a tie, reported, never settled silently',
  designTokenFor('icon', 'rgb(94, 0, 7)', table, { 'Color/Icon/Supportive/Red/primary': 3 }, null, null, offered).token === 'Color/Icon/Supportive/Red/primary'
  && JSON.stringify(designTokenFor('icon', 'rgb(94, 0, 7)', table, {}, null, null, offered).tie) === '["Color/Icon/Supportive/Red/primary"]');
ok('a translucent token is found by what it draws over the element\'s backdrop, only when none matches exactly',
  designTokenFor('background', 'rgb(238, 238, 238)', table.slice(1), {}, 'rgb(255, 255, 255)', judge, offered).token === 'Color/Background/Neutral/secondary-translucent'
  && designTokenFor('background', 'rgb(238, 238, 238)', table.slice(1), {}, null, null, offered).value === 'rgb(238, 238, 238)');
const styles = [{ name: 'Web app/Label/Default/sm', size: 14, lineHeight: 1.15, weight: 'Medium' }, { name: 'Mobile app/Label/sm', size: 14, lineHeight: 1.15, weight: 'Medium' }, { name: 'Web app/Body/sm', size: 14, lineHeight: 1.5, weight: 'Regular' }];
ok('a text style by size, line height and weight; the library\'s usage settles equals',
  styleFor({ size: 14, lineHeight: 16.1, weight: 'medium' }, styles, usageIn([{ anatomy: { a: { typography: 'Web app/Label/Default/sm' } }, variants: [] }])).token === 'Web app/Label/Default/sm'
  && styleFor({ size: 14, lineHeight: 21, weight: 'regular' }, styles, {}).token === 'Web app/Body/sm' && styleFor({ size: 13, lineHeight: 20, weight: 'regular' }, styles, {}).value);
ok('what a render changes against the default, as a variant layer: fields set, elements added and removed',
  JSON.stringify(delta({ root: { background: 'A' }, icon: { kind: 'graphic' } }, { root: { background: 'B' }, close: { kind: 'graphic' } }))
    === '{"set":{"root.background":"B"},"add":{"close":{"kind":"graphic"}},"remove":["icon"]}'
  && JSON.stringify(delta({ root: { a: 1 } }, { root: { a: 1 } })) === '{}');

// a chip as read from code: an MUI `variant` in its own words, an icon picked by name
const code = { contract: 1, component: 'chip',
  props: { label: { type: 'string', code: 'label' }, variant: { type: 'enum', values: ['danger', 'positive', 'neutral'], default: 'danger', code: 'variant' }, iconName: { type: 'swap', default: 'circle-x', code: 'iconName', shows: ['icon'] }, showAvatar: { type: 'boolean', default: false, code: 'showAvatar' } },
  anatomy: { root: { kind: 'container', background: 'Color/Background/Feedback/Danger/primary' }, icon: { kind: 'graphic', parent: 'root', order: 0 }, label: { kind: 'text', parent: 'root', order: 1, color: 'Color/Text/Feedback/Danger/primary' } },
  variants: [{ when: { variant: 'positive' }, set: { 'root.background': 'Color/Background/Feedback/Success/primary', 'label.color': 'Color/Text/Feedback/Success/primary' } },
    { when: { variant: 'neutral' }, set: { 'root.background': 'Color/Background/Neutral/secondary', 'label.color': 'Color/Text/Neutral/primary' } },
    { when: { iconName: 'none' }, remove: ['icon'], set: { 'label.order': 0 } }] };
const ORDER = { axisOrder: ['Size', 'Role', 'Feedback', 'Disabled', 'State'] };
const shaped = asFigma(code, ORDER);
ok("in the house's conventions: an enum named and valued by its tokens' words, a swap that can show nothing a boolean beside its swap, sentence case, props before axes",
  JSON.stringify(shaped.contract.props.feedback) === '{"type":"enum","values":["danger","success","neutral"],"default":"danger","figma":"Feedback","code":"variant"}'
  && shaped.contract.props.icon.type === 'boolean' && shaped.contract.props.icon.default === true && shaped.contract.props.iconSwap.figma === 'Icon swap'
  && shaped.contract.props.showAvatar.figma === 'Show avatar' && Object.keys(shaped.contract.props).at(-1) === 'feedback'
  && shaped.renamed.includes('variant positive → Feedback success'));
ok('…and it still rebuilds what the code drew, in the new words',
  expand(shaped.contract, { feedback: 'success' }).root.background === 'Color/Background/Feedback/Success/primary'
  && !expand(shaped.contract, { icon: false }).icon && expand(shaped.contract, {}).icon);
ok('an enum whose tokens share no word of their own keeps the code\'s words',
  asFigma({ ...code, props: { size: { type: 'enum', values: ['large', 'small'], default: 'large', code: 'size' } }, variants: [{ when: { size: 'small' }, set: { 'label.color': 'Color/Text/Feedback/Danger/primary' } }] }).contract.props.size.values.join() === 'large,small');

ok('an emphasis is not a category: values whose own word is the token\'s leaf keep the code\'s names',
  asFigma({ ...code, props: { color: { type: 'enum', values: ['primary', 'secondary'], default: 'primary', code: 'color' } }, anatomy: { root: { background: 'Color/Background/Brand/primary' } },
    variants: [{ when: { color: 'secondary' }, set: { 'root.background': 'Color/Background/Brand/secondary' } }] }).contract.props.color.figma === 'Color');

ok('a percentage radius is of the box, not pixels: 50% on a 120px avatar is a full round of 60, 10% a corner of 12',
  JSON.stringify(cornerOf('50%', 120, 120)) === '{"radius":60,"full":true}' && JSON.stringify(cornerOf('10%', 120, 120)) === '{"radius":12}'
  && cornerOf('999px', 32, 32).full === true && !cornerOf('8px', 32, 32).full);

// a governed mapping, read with nothing opened: the engine's expanded target and the component's bridge
{
  const variants = new Map([
    ['Selected=False, State=Rest', { args: {} }], ['Selected=True, State=Rest', { args: { selected: true } }],
    ['Selected=False, State=Hover', { args: {}, pseudo: 'hover' }], ['Selected=False, State=Focus', { args: {}, pseudo: 'focus-visible', on: '.chip__action' }],
  ]);
  const t = { variants, mapping: { root: '.chip', state: '.chip', sample: { children: 'Label' }, layers: { Content: '.chip__content', 'Content > Label': '.chip__label', Gone: null } } };
  const b = { props: { selected: { figma: 'Selected' }, state: { figma: 'State', values: { rest: 'Rest', hover: 'Hover', focus: 'Focus' } } },
    ids: { Content: ['content'], 'Content > Label': ['content/label'], Twice: ['a', 'b'] } };
  const G = governedReading(t, b, { stateAxis: 'State', container: '#root' });
  const figma = { props: { selected: { type: 'boolean', default: false }, state: { type: 'enum', values: ['rest', 'hover', 'focus'], default: 'rest', role: 'interaction' } }, anatomy: {}, variants: [] };
  ok('a Figma combination draws the variant the mapping expands for it, its sample copy beside', JSON.stringify(G.argsOf({ selected: true, state: 'rest' })) === '{"children":"Label","selected":true}' && G.argsOf({ selected: true, state: 'press' }) === null);
  ok('a Figma prop\'s code prop is the arg that moves when it alone moves', JSON.stringify(G.joins(figma, { selected: false, state: 'rest' }).props) === '{"selected":{"arg":"selected","values":{"true":true}}}');
  {
    const unset = governedReading({ ...t, variants: new Map([['Selected=False, State=Rest', { args: { tone: 'plain' } }], ['Selected=True, State=Rest', { args: {} }]]) }, b, {});
    const j = unset.joins(figma, { selected: false, state: 'rest' }).props.selected;
    ok('an option that leaves its arg unset is joined as unset, so it draws at the code\'s own default', j.arg === 'tone' && 'true' in j.values && j.values.true === undefined);
    const two = governedReading({ ...t, variants: new Map([['Selected=False, State=Rest', { args: {} }], ['Selected=True, State=Rest', { args: { selected: true, tone: 'bold' } }]]) }, b, {}).joins(figma, { selected: false, state: 'rest' });
    ok('a prop whose variants move two args is joined to the first and the second is said, never dropped in silence', two.props.selected.arg === 'selected' && two.twice.selected.join() === 'selected,tone');
  }
  ok('each pointer state is forced where its option says, else where the mapping\'s state says, inside the host\'s container',
    G.pseudoOf.hover.on === '#root .chip' && G.pseudoOf.focus.on === '#root .chip__action' && G.pseudoOf.focus.pseudo === 'focus-visible');
  ok('each mapped layer is the contract element its stored path is, with the root; a layer mapped to nothing is left out',
    JSON.stringify(G.elements()) === '{"content":{"selector":"#root .chip__content"},"content/label":{"selector":"#root .chip__label"},"root":{"selector":"#root .chip"}}');
  const refused = (layers) => { try { governedReading({ ...t, mapping: { ...t.mapping, layers } }, b, {}).elements(); return null; } catch (e) { return e.message; } };
  ok('a ruling, or a layer that is not exactly one element, is refused, never dropped', /carries a ruling/.test(refused({ Content: { selector: '.x', why: 'w' } })) && /several elements/.test(refused({ Twice: '.x' })) && /no layer of the design/.test(refused({ Elsewhere: '.x' })));
  ok('a host that declares no props reads the mapping\'s controls, said as declared; none, nothing to read', controlsApi({ label: { type: 'text', default: 'Hi' }, size: { options: ['sm', 'md'], default: 'md' } }).argTypes.size.control === 'select'
    && controlsApi({ label: { type: 'text', default: 'Hi' } }).declared === true && controlsApi({}) === null);
}

{
  const two = [['Color/Background/Brand', '#0057ff', null, 'Semantic'], ['Color/Border/Focus', '#0057ff', null, 'Semantic']];
  ok('two tokens of one value: the one the code wrote it with (its outermost custom property, not the primitive it aliases), whatever the contracts use most',
    designTokenFor('background', '#0057ff', two, { 'Color/Background/Brand': 5 }, null, null, null, ['--component-bg', '--color-border-focus']).token === 'Color/Border/Focus'
    && designTokenFor('background', '#0057ff', two, { 'Color/Background/Brand': 5 }).token === 'Color/Background/Brand'
    && designTokenFor('background', '#0057ff', two, {}).more === true
    && designTokenFor('background', '#0057ff', [['Palette/Blue/9', '#0057ff', null, 'Primitive'], ...two], {}, null, null, null, ['--color-background-brand', '--palette-blue-9']).token === 'Color/Background/Brand');
  ok('a custom property is a token\'s by the toolkit\'s own css name, or by ending in its words; never by a fragment',
    writtenAs('--ds-color-background-brand', 'Color/Background/Brand') && !writtenAs('--brand', 'Color/Background/Brand') && !writtenAs('--size-8', 'Spacing/8') && writtenAs(cssName('Semantic', 'Color/Border/Focus'), 'Color/Border/Focus', 'Semantic'));
}

// content a caller passes is a slot: a docgen's node type, an element the story starts it with, or a host's stated slot
ok('a prop that takes content is a slot, by its type, its starting element or a stated slot', isSlot({ summary: 'ReactNode' }) && isSlot({ summary: 'Snippet' }) && isSlot({ element: true, control: 'object' }) && isSlot({ control: 'slot' })
  && !isSlot({ control: 'object', summary: null }) && !isSlot({ control: 'text', summary: 'string' }));
ok('a slot\'s stand-in is one word per prop, which no component draws', slotMark('children') !== slotMark('footer') && !/\s/.test(slotMark('children')));

console.log(`${n}/${n} passed`);
