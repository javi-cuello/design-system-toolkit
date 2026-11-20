#!/usr/bin/env node
// tools/component-contract/from-code.mjs: the pure parts of reading a contract from code.
import assert from 'node:assert/strict';
import { unplacedIn, designTokenFor, tokenTable, writtenAs, styleFor, usageIn, delta, asFigma, offerFor, governedReading, controlsApi, cornerOf, isSlot, slotMark, wordsOf, zeroTokens, carries, axisValueOf, asDesignSwaps, glyphSwaps, asShape, boundText, keepsName, modeKeysOf, shownRead, stackLikeDesign } from './from-code.mjs';
import { cssName } from '../tokens/names.mjs';
import { createRequire } from 'node:module';
const { expand } = createRequire(import.meta.url)('./derive.cjs');
import { drawn as toCodeDrawn } from './to-code.mjs';
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
ok('the token the code wrote wins over the field\'s guess, where it holds the value: a dot painted with an icon token is not given the palette colour the background field offers',
  (() => { const t = [['Palette/Red/10', '#c00', ['ALL_SCOPES'], 'Primitives'], ['Colour/Icon/Feedback/Danger/strong', '#c00', ['SHAPE_FILL'], 'Semantic']];
    const off = offerFor([['Palette/Red/10', '#c00', ['FRAME_FILL']]]);
    return designTokenFor('background', '#c00', t, {}, null, null, null, ['--colour-icon-feedback-danger-strong']).token === 'Colour/Icon/Feedback/Danger/strong'
      && designTokenFor('background', '#c00', t, {}, null, null, null, ['--some-other-thing']).token !== undefined
      && designTokenFor('background', '#0c0', t, {}, null, null, null, ['--colour-icon-feedback-danger-strong']).token === undefined; })());
{ const raw = [{ id: 'root', kind: 'container' }, { id: 'pin', kind: 'instance', parent: 'root' }, { id: 'mark', kind: 'graphic', parent: 'pin' },
    { id: 'box', kind: 'container', parent: 'pin', layout: { direction: 'row' } }, { id: 'dot', kind: 'graphic', parent: 'box' }, { id: 'free', kind: 'graphic', parent: 'root' }];
  ok('a part inside a placed component, in a box with no auto layout, has no place read (the design writes none); in flow or outside one, it does',
    unplacedIn(raw, raw[2]) && !unplacedIn(raw, raw[4]) && !unplacedIn(raw, raw[5]) && !unplacedIn(raw, raw[0]));
  ok('a part placed absolutely in a placed component whose main has auto layout keeps its place (a button\'s focus ring)',
    !unplacedIn(raw, raw[2], (u) => (u.kind === 'instance' ? { direction: 'row' } : u.layout))); }
ok('a placed component\'s arg is read under the attribute markup spells it (isChecked as is-checked or data-is-checked)',
  axisValueOf({ False: {}, True: { isChecked: true } }, { 'is-checked': 'true' }) === 'True' && axisValueOf({ False: {}, True: { isChecked: true } }, { 'data-is-checked': 'false' }) === 'False');
ok('the token the code wrote holds its value in any of its modes: a contextual field token drawn on a layer, not the base mode, is still the one written',
  (() => { const t = tokenTable({ collections: { Layer: { name: 'Layer', modes: ['Background', 'Layer 01'], values: { Background: { 'field (contextual)': '#f4f4f4' }, 'Layer 01': { 'field (contextual)': '#ffffff' } } },
    Base: { name: 'Base', modes: ['Value'], values: { Value: { 'Default/Neutral/White': '#ffffff' } } } } }, 'Background');
    return designTokenFor('background', '#ffffff', t, {}, null, null, null, ['--field-contextual']).token === 'field (contextual)'; })());
ok('of two names a property ends in, the longer: Background/Primary before Primary',
  designTokenFor('background', '#fff', [['Primary', '#fff', null, 'A'], ['Colour/Background/Primary', '#fff', null, 'B']], {}, null, null, null, ['--ds-colour-background-primary']).token === 'Colour/Background/Primary');
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
ok('a field the default has and a render lacks is set to null, so it survives JSON and the drawing drops it',
  JSON.stringify(delta({ content: { background: 'A', shadow: 'S' } }, { content: {} })) === '{"set":{"content.background":null,"content.shadow":null}}');
ok('a focus outline is the design\'s focus ring layer, and the corner rounded only to shape it stays the box\'s own',
  JSON.stringify(delta({ root: { radius: 'R0', background: 'A' } }, { root: { radius: 'R12', background: 'B' }, focusRing: { kind: 'graphic', parent: 'root', radius: 'R16' } }))
    === '{"set":{"root.background":"B"},"add":{"focusRing":{"kind":"graphic","parent":"root","radius":"R16"}}}'
  && JSON.stringify(delta({ root: { radius: 'R0' }, focusRing: { parent: 'root' } }, { root: { radius: 'R12', width: 9 }, focusRing: { parent: 'root' } }, { root: { radius: 'R0' } })) === '{"set":{"root.width":9}}'
  // an outline the default render has too is the box's own: its corners change as the box's do
  && JSON.stringify(delta({ root: { radius: 'R0' }, focusRing: { parent: 'root' } }, { root: { radius: 'R12' }, focusRing: { parent: 'root' } })) === '{"set":{"root.radius":"R12"}}');

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
ok('a swap the design does not name stays a swap prop, not an instance one', shaped.contract.props.iconSwap.type === 'swap');
const both = asFigma({ ...code, props: { ...code.props, iconName: { ...code.props.iconName, showName: 'Icon', swapName: 'Icon' } } }, ORDER);
ok('a design swap name that equals the boolean\'s key is not taken: the two props stay apart', both.contract.props.icon.type === 'boolean' && both.contract.props.iconSwap && both.contract.props.iconSwap.type === 'swap');
const twinNames = asFigma({ ...code, props: { size: { type: 'enum', values: ['sm', 'lg'], default: 'sm', figma: 'Size' }, iconSize: { type: 'enum', values: ['sm', 'lg'], default: 'sm', figma: 'Size' } }, variants: [] }, ORDER);
ok('two enums under one design name do not overwrite each other', Object.values(twinNames.contract.props).filter((p) => p.type === 'enum').length === 2);
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
  { const sp = governedReading({ ...t, mapping: { ...t.mapping, layers: { 'Frame > 96': '.frame' } } }, { ...b, ids: { 'Frame  > 96': ['frame/96'] } }, { container: '#root' }).elements();
    ok('a layer whose name ends in a space (the store\'s "Frame  > 96") is the mapping\'s trimmed path', !!sp['frame/96']); }
  ok('a Figma prop\'s code prop is the arg that moves when it alone moves', JSON.stringify(G.joins(figma, { selected: false, state: 'rest' }).props) === '{"selected":{"arg":"selected","values":{"true":true}}}');
  {
    const unset = governedReading({ ...t, variants: new Map([['Selected=False, State=Rest', { args: { tone: 'plain' } }], ['Selected=True, State=Rest', { args: {} }]]) }, b, {});
    const j = unset.joins(figma, { selected: false, state: 'rest' }).props.selected;
    ok('an option that leaves its arg unset is joined as unset, so it draws at the code\'s own default', j.arg === 'tone' && 'true' in j.values && j.values.true === undefined);
    const two = governedReading({ ...t, variants: new Map([['Selected=False, State=Rest', { args: {} }], ['Selected=True, State=Rest', { args: { selected: true, tone: 'bold' } }]]) }, b, {}).joins(figma, { selected: false, state: 'rest' });
    ok('a prop whose variants move two args is joined to the first and the second is said, never dropped in silence', two.props.selected.arg === 'selected' && two.twice.selected.join() === 'selected,tone');
  }
  {
    // a boolean property no variant name carries: the mapping's own table joins it
    const prop = { ...figma, props: { ...figma.props, showChevron: { type: 'boolean', default: false, figma: 'Show chevron' } } };
    const j = governedReading({ ...t, mapping: { ...t.mapping, axes: { 'Show chevron': { True: { chevron: true } } } } }, b, {}).joins(prop, { selected: false, state: 'rest' }).props.showChevron;
    ok('a boolean property no variant\'s name carries is joined by the mapping\'s own table for it', j && j.arg === 'chevron' && j.values.true === true);
  }
  ok('each pointer state is forced where its option says, else where the mapping\'s state says, inside the host\'s container',
    G.pseudoOf.hover.on === '#root .chip' && G.pseudoOf.focus.on === '#root .chip__action' && G.pseudoOf.focus.pseudo === 'focus-visible');
  ok('each mapped layer is the contract element its stored path is, with the root; a layer mapped to nothing is left out',
    JSON.stringify(G.elements()) === '{"content":{"selector":"#root .chip__content"},"content/label":{"selector":"#root .chip__label"},"root":{"selector":"#root .chip"}}');
  const refused = (layers) => { try { governedReading({ ...t, mapping: { ...t.mapping, layers } }, b, {}).elements(); return null; } catch (e) { return e.message; } };
  ok('a ruling, or a layer that is not exactly one element, is refused, never dropped', /carries a ruling/.test(refused({ Content: { selector: '.x', why: 'w' } })) && /several elements/.test(refused({ Twice: '.x' })) && /no layer of the design/.test(refused({ Elsewhere: '.x' })));
  {
    const read = (layers) => governedReading({ ...t, mapping: { ...t.mapping, layers } }, b, {}).elements();
    const two = read({ Twice: '.x > :nth-child(1)', 'Twice#2': '.x > :nth-child(2)' });
    ok('a repeated layer and its #2 each take their own element, in order', two.a.selector.endsWith('.x > :nth-child(1)') && two.b.selector.endsWith('.x > :nth-child(2)'));
    const kept = governedReading({ ...t, mapping: { ...t.mapping, layers: { Pair: '.p1', 'Pair#2': '.p2' } } }, { ...b, ids: { ...b.ids, Pair: ['p'], 'Pair#2': ['p_2'] } }, {}).elements();
    ok('a #2 the store keeps under its own path is that element, not the first one again', kept.p.selector.endsWith('.p1') && kept.p_2.selector.endsWith('.p2'));
    const inside = read({ Content: '.c', 'Content > Icon': '.c .i' });
    ok('a layer inside a layer that is one element (another component\'s instance) is passed over and said, not refused', !Object.values(inside).some((e) => e.selector.endsWith('.c .i')) && inside.skipped.length === 1 && inside.skipped[0].path === 'Content > Icon' && inside.skipped[0].up === 'content');
  }
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

// another component's instance: its words are the props that put words in its texts, a word one for one
{
  const badge = { props: { label: { type: 'string', figma: 'Label' }, tone: { type: 'enum', figma: 'Tone' } }, anatomy: { root: { kind: 'container' }, label: { kind: 'text', content: '{label}' }, dot: { kind: 'graphic' } } };
  ok('an instance\'s word is the prop its text shows', JSON.stringify(wordsOf(badge, ['New'])) === '{"Label":"New"}');
  ok('a word this component passes down from its own prop is that prop', JSON.stringify(wordsOf(badge, [slotMark('status')], { badge: { code: 'status' } })) === '{"Label":"{badge}"}');
  ok('words that do not count out one for one are not guessed', JSON.stringify(wordsOf(badge, ['New', 'Extra'])) === '{}' && JSON.stringify(wordsOf(badge, [])) === '{}');
}

{
  const value = (t) => ({ 'S/0': 0, 'S/4': 4 })[t];
  const e = zeroTokens({ layout: { direction: 'row' } }, { layout: { padding: { top: 'S/0', end: 'S/0', bottom: 'S/0', start: 'S/4' } } }, value);
  ok('a padding the code leaves unset takes the design\'s zero tokens; a side the design pads stays the code\'s 0', JSON.stringify(e.layout.padding) === '{"top":"S/0","end":"S/0","bottom":"S/0","start":0}');
}
// a placed component's flag, as markup that writes every flag as a string carries it
ok('a flag written "false" is off, and one written "true", bare or empty is on', !carries({ selected: 'false' }, 'selected', true) && carries({ selected: 'false' }, 'selected', false) && carries({ selected: 'true' }, 'selected', true) && carries({ selected: '' }, 'selected', true) && carries({ 'data-selected': 'true' }, 'selected', true) && carries({}, 'selected', false) && !carries({}, 'selected', true));
ok('an arg by its own attribute, else by a data attribute holding its value, never the walk\'s own marks', carries({ size: 'sm' }, 'size', 'sm') && !carries({ size: 'md' }, 'size', 'sm') && carries({ 'data-hierarchy': 'primary' }, 'variant', 'primary') && !carries({ 'data-figma-id': 'primary' }, 'variant', 'primary'));
// a placed component's layer mapped to its root inside its host: the host takes the id; a layer inside it stays
{
  const { elementOfLayer } = await import('./from-code.mjs');
  const el = (tag, cls = [], attrs = {}) => ({ tagName: tag.toUpperCase(), classList: cls, attrs, parentElement: null, firstElementChild: null, getAttribute(k) { return this.attrs[k] ?? null; } });
  const host = el('ds-button'), inner = el('button'); inner.parentElement = host; host.firstElementChild = inner;
  const box = el('div'), first = el('span'); first.parentElement = box; box.firstElementChild = first;
  const others = { button: true };
  const R = '^ds-(.+)$';
  ok('a placed component\'s layer mapped to its root names the host that places it', elementOfLayer(inner, 'footer/buttons/button_2', 'instance', R, others)[0] === host);
  ok('an element that is no other component\'s root names itself', elementOfLayer(first, 'footer/x', 'instance', R, others)[0] === first);
  ok('a layer inside a placed component the mapping names alone (not the instance) stays on that root', elementOfLayer(inner, 'footer/chip/label', 'text', R, others)[0] === inner && !elementOfLayer(inner, 'footer/chip/label', 'text', R, others)[1]);
  host.attrs['data-figma-id'] = 'footer/button';
  ok('a layer inside a placed component, mapped to its root, stays on that root', elementOfLayer(inner, 'footer/button/container', 'container', R, others)[0] === inner);
  ok('a text inside a placed component, mapped to its root, is that root\'s words', elementOfLayer(inner, 'footer/button/label', 'text', R, others)[1] === true);
}
// a placed instance the mapping names is opened at any depth of placing: an override two deep (a slider's stop's dot,
// inside its Stops) is read, not left to the inner component's own value (Material 3's standard slider)
{
  const { opensPlaced } = await import('./from-code.mjs');
  const inPage = new Function(`return ${opensPlaced.toString()}`)();
  ok('a placed instance the mapping names is opened at the top, and inside another the mapping names it under',
    inPage(false, 'showStopsStops', true) && inPage('showStopsStops', 'showStopsStops/trackStop1', true));
  ok('one the mapping does not name, or named under another instance, is not opened',
    !inPage(false, 'stops', false) && !inPage('showStopsStops', 'showStopsStops/trackStop1', false) && !inPage('other', 'showStopsStops/trackStop1', true));
}

// a layer the mapping places inside a placed component takes the design's name there, never the placed component's own
// name for the element it lands on (Atlassian's date picker: Select's chevron, <ChevronDownIcon>, carries the design's
// <SelectClearIcon>; read under Select's name, the second trip's mapping named a layer the design has not)
{
  const { nameInside } = await import('./from-code.mjs');
  const inPage = new Function(`return ${nameInside.toString()}`)();
  const names = { 'select/textField': null, 'select/textField/selectClearIcon': '<SelectClearIcon>' };
  ok('inside a placed component: the design\'s name, not the markup\'s', inPage('select', 'select/textField/selectClearIcon', '<ChevronDownIcon>', names) === '<SelectClearIcon>');
  ok('inside a placed component, a layer whose id spells its name: none', inPage('select', 'select/textField', 'Text field', names) === null);
  ok('outside one, or with no design to name it, the markup\'s', inPage(false, 'select', '<Select>', names) === '<Select>' && inPage('select', 'select/textField/selectClearIcon', '<ChevronDownIcon>', null) === '<ChevronDownIcon>');
}
// an outline on a part inside a placed component's insides is that part's own stroke, even in a focused render: no
// focus ring of this component's (Atlassian's loading button: the spinner's ellipse read a focusRing at state focus)
{
  const { insidePlaced } = await import('./from-code.mjs');
  const raw = [{ id: 'root', kind: 'container' }, { id: 'spinner', kind: 'instance', parent: 'root' }, { id: 'spinner/anim', kind: 'instance', parent: 'spinner' }, { id: 'spinner/anim/ellipse1', kind: 'graphic', parent: 'spinner/anim' }, { id: 'label', kind: 'text', parent: 'root' }];
  ok('a part under a placed instance is inside it, at any depth', insidePlaced(raw, 'spinner/anim/ellipse1') && insidePlaced(raw, 'spinner/anim'));
  ok('the component\'s own boxes are not', !insidePlaced(raw, 'root') && !insidePlaced(raw, 'label') && !insidePlaced(raw, 'spinner'));
}

// the names nameInside takes come from the contract the markup was drawn from: on --second the first reading, so a
// name the first trip changed is not put back to the design's, and a layer only that reading has is named
{
  const { layerNames } = await import('./from-code.mjs');
  const design = { anatomy: { a: { name: '<A>' } }, variants: [{ add: { b: { name: '<B>' } } }] };
  const first = { anatomy: { a: { name: '<Renamed>' }, c: { name: '<Only first>' } } };
  ok('names from the design, its variants\' layers included; none where it keeps none', JSON.stringify(layerNames(['a', 'b', 'x'], design)) === '{"a":"<A>","b":"<B>","x":null}');
  ok('on --second, the first reading\'s names, not the design\'s', JSON.stringify(layerNames(['a', 'c'], design, first)) === '{"a":"<Renamed>","c":"<Only first>"}');
  ok('no contract: no names', layerNames(['a'], null) === null);
}
// a ring read from a focused outline is the design's own ring layer where it draws one (Carbon's focusBorder)
{
  const { ringKeyOf } = await import('./from-code.mjs');
  const ring = { kind: 'graphic', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'Focus/focus', width: 2 }, shape: 'rectangle' };
  const props = { state: { type: 'enum', values: ['enabled', 'focus'], default: 'enabled', role: 'interaction' } };
  const carbon = { props, anatomy: { root: { kind: 'container' }, input: { kind: 'container', parent: 'root' } },
    variants: [{ when: { state: 'focus' }, add: { focusBorder: { ...ring, parent: 'root' }, 'input/focusBorder': { ...ring, parent: 'input' } } }] };
  ok('the design\'s ring layer is the ring\'s key, at the root and under a part', ringKeyOf(carbon, 'root').key === 'focusBorder' && ringKeyOf(carbon, 'input').key === 'input/focusBorder');
  ok('a design layer the reading already holds is not taken twice: a ring of its own then', ringKeyOf(carbon, 'root', { focusBorder: {} }).key === 'focusRing');
  ok('no ring in the design, or no design: a synthesised focusRing', ringKeyOf({ props, anatomy: carbon.anatomy, variants: [] }, 'input').key === 'input/focusRing' && ringKeyOf(null, 'root').key === 'focusRing');
  ok('a stroke drawn at rest is no ring', ringKeyOf({ props, anatomy: carbon.anatomy, variants: [{ when: { state: 'enabled' }, add: { line: { ...ring, parent: 'root' } } }] }, 'root').key === 'focusRing');
  ok('the corner rounded to shape a ring under the design\'s name stays the box\'s own',
    (() => { const got = { root: { radius: 'R12' }, focusBorder: { ...ring, parent: 'root' } }; Object.defineProperty(got, 'rings', { value: ['focusBorder'] });
      return JSON.stringify(delta({ root: { radius: 'R0' } }, got)) === JSON.stringify({ add: { focusBorder: { ...ring, parent: 'root' } } })
        // (a stroke box the code draws of its own, an error border, is no ring: the box's corners change as it does)
        && JSON.stringify(delta({ root: { radius: 'R0' } }, { root: { radius: 'R12' }, errorBorder: { ...ring, parent: 'root' } })) === JSON.stringify({ set: { 'root.radius': 'R12' }, add: { errorBorder: { ...ring, parent: 'root' } } }); })());
}
// a render's ring is the layer whose outline to-code draws at its combination (the last ringOf takes in expand's
// anatomy); with no combination, the one most focus variants add, then the broadest variant's
{
  const { ringKeyOf, keepsRing, placeRings } = await import('./from-code.mjs');
  const ring = { kind: 'graphic', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'Focus/focus', width: 2 }, shape: 'rectangle' };
  const props = { state: { type: 'enum', values: ['enabled', 'focus'], default: 'enabled', role: 'interaction' }, invalid: { type: 'boolean', default: false }, type: { type: 'enum', values: ['a', 'b'], default: 'a' } };
  const anatomy = { root: { kind: 'container' }, input: { kind: 'container', parent: 'root' } };
  // (the focus error variant first: a first-found pick takes its error stroke for the ring)
  const errored = { props, anatomy, variants: [{ when: { state: 'focus', invalid: true }, add: { 'input/errorBorder': { ...ring, parent: 'input', border: { color: 'Support/error', width: 2 } } } },
    { when: { state: 'focus' }, add: { 'input/focusBorder': { ...ring, parent: 'input' } } }, { when: { state: 'focus', type: 'b' }, add: { 'input/focusBorder': { ...ring, parent: 'input' } } }] };
  ok('a focus error stroke is not the ring in a plain focus render, nor with no render named',
    ringKeyOf(errored, 'input', {}, { state: 'focus', invalid: false }).key === 'input/focusBorder'
    && ringKeyOf(errored, 'input').key === 'input/focusBorder');
  // (two variants only, the error one first: a tie on how many focus variants add each)
  const pair = { props, anatomy, variants: errored.variants.slice(0, 2) };
  ok('of a ring and an error stroke added as often, the broadest variant\'s is the ring where no render says otherwise',
    ringKeyOf(pair, 'input', {}, { state: 'focus', invalid: false, type: 'a' }).key === 'input/focusBorder' && ringKeyOf(pair, 'input').key === 'input/focusBorder');
  // (the outline to-code draws: of the rings expand's anatomy holds for a box, the last, its outline written over the
  // others'. expand applies variants in the contract's order, so the order decides: to-code's drawing is asked)
  const err = { 'input/errorBorder': { ...ring, parent: 'input', border: { color: 'Support/error', width: 2 } } }, foc = { 'input/focusBorder': { ...ring, parent: 'input' } };
  // (to-code's own drawing says which: the outline's colour is the error stroke's or the ring's)
  const drawsLast = (c, when) => (/support-error/.test(toCodeDrawn(c, when).input.decls.get('outline').v) ? 'input/errorBorder' : 'input/focusBorder');
  const focusFirst = { props, anatomy, variants: [{ when: { state: 'focus' }, add: foc }, { when: { state: 'focus', invalid: true }, add: err }] };
  const errorFirst = { props, anatomy, variants: [{ when: { state: 'focus', invalid: true }, add: err }, { when: { state: 'focus' }, add: foc }] };
  ok('a render\'s ring is the layer whose outline to-code draws there, in either order: the error stroke where it is written last, the ring in a plain focus render',
    [focusFirst, errorFirst].every((c) => [{ state: 'focus', invalid: true }, { state: 'focus' }].every((w) => ringKeyOf(c, 'input', {}, w).key === drawsLast(c, w)))
    && ringKeyOf(focusFirst, 'input', {}, { state: 'focus', invalid: true }).key === 'input/errorBorder' && ringKeyOf(focusFirst, 'input', {}, { state: 'focus' }).key === 'input/focusBorder');
  const twoRings = { props, anatomy, variants: [{ when: { type: 'a', state: 'focus' }, add: { focusBorder: { ...ring, parent: 'root' } } }, { when: { type: 'b', state: 'focus' }, add: { outerRing: { ...ring, parent: 'root', name: 'Outer ring' } } }] };
  ok('a prop the render leaves unset is at its default, never a match for another value\'s variant',
    (() => { const d = { props, anatomy, variants: [{ when: { state: 'focus', type: 'b', invalid: false }, add: { bRing: { ...ring, parent: 'root' } } }, { when: { state: 'focus', type: 'b', invalid: true }, add: { bRing: { ...ring, parent: 'root' } } }, { when: { state: 'focus', type: 'a' }, add: { aRing: { ...ring, parent: 'root' } } }] };
      return placeRings({ root: {} }, [['root', { ...ring, parent: 'root' }]], d, { state: 'focus' }).rings.join() === 'aRing'; })());
  ok('two candidate rings in one box, each in only some variants: each render takes its own variant\'s',
    ringKeyOf(twoRings, 'root', {}, { type: 'a', state: 'focus' }).key === 'focusBorder' && JSON.stringify(ringKeyOf(twoRings, 'root', {}, { type: 'b', state: 'focus' })) === '{"key":"outerRing","name":"Outer ring"}');
  ok('a ring kept in the base anatomy and shown by a set is not found (as ringOf finds none): a focusRing',
    ringKeyOf({ props, anatomy: { ...anatomy, focusBorder: { ...ring, parent: 'root', visible: false } }, variants: [{ when: { state: 'focus' }, set: { 'focusBorder.visible': true } }] }, 'root', {}, { state: 'focus' }).key === 'focusRing');
  ok('a design keeps a ring on a box by its focusRing or a ring layer of its own name, and on no other box',
    keepsRing(errored, 'input') && keepsRing({ props, anatomy, variants: [{ when: { state: 'focus' }, add: { 'input/focusRing': { parent: 'input' } } }] }, 'input') && !keepsRing(errored, 'root') && !keepsRing(null, 'input'));
  ok('the rings a render reads reach delta by the design\'s name: the corner shaped for the ring stays the box\'s own',
    (() => { const got = placeRings({ root: { radius: 'R12' } }, [['root', { ...ring, parent: 'root' }]], twoRings, { type: 'a', state: 'focus' });
      return got.rings.join() === 'focusBorder' && JSON.stringify(Object.keys(got)) === '["root","focusBorder"]' && got.focusBorder.order === 0
        && JSON.stringify(delta({ root: { radius: 'R0' } }, got)) === JSON.stringify({ add: { focusBorder: { ...ring, parent: 'root', order: 0 } } }); })());
}
// a render's args as the design's props: its state as the design's interaction prop, whatever it is called
{
  const { designCombo, placeRings, openSource, keepsRing } = await import('./from-code.mjs');
  const code = { state: { type: 'enum', values: ['rest', 'focus'], role: 'interaction', code: '__state' }, invalid: { type: 'boolean', code: 'invalid' } };
  const design = { props: { interaction: { type: 'enum', values: ['default', 'focus'], default: 'default', role: 'interaction' }, invalid: { type: 'boolean', default: false } } };
  ok('the render\'s state is the design\'s interaction prop, by its word or by the pseudo-class both force',
    JSON.stringify(designCombo(design, code, {}, { __state: 'Focus', invalid: true })) === '{"interaction":"focus","invalid":true}'
    && JSON.stringify(designCombo(design, code, {}, { __state: 'keyboard' }, { keyboard: { pseudo: 'focus-visible' } })) === '{"interaction":"focus"}'
    && JSON.stringify(designCombo(design, code, {}, { __state: 'keyboard' }, {})) === '{}');
  ok('a design value of several words is matched to the pseudo-class its kebab-cased key forces',
    JSON.stringify(designCombo({ props: { interaction: { type: 'enum', values: ['Default', 'Focus visible'], default: 'Default', role: 'interaction' } } }, code, {}, { __state: 'keyboard' }, { keyboard: { pseudo: ':focus-visible' } }, { pseudoClasses: { 'Focus visible': ':focus-visible' } }))
      === '{"interaction":"Focus visible"}');
  ok('--code-only beside --self or --second is refused as a usage error: those legs read against a design',
    await Promise.all([{ codeOnly: true, self: true }, { codeOnly: true, second: true, self: true }].map((o) => openSource('any', 'x', o).then(() => false, (e) => !!e.usage && /--code-only/.test(e.message)))).then((r) => r.every(Boolean)));
  // (a design whose ring prop is not `state`: a focus error render takes the error stroke to-code draws last)
  const ring = { kind: 'graphic', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'F', width: 2 }, shape: 'rectangle' };
  const d2 = { props: { interaction: { type: 'enum', values: ['default', 'focus'], default: 'default', role: 'interaction' }, invalid: design.props.invalid }, anatomy: { root: { kind: 'container' } },
    variants: [{ when: { interaction: 'focus' }, add: { focusBorder: { ...ring, parent: 'root' } } }, { when: { interaction: 'focus', invalid: true }, add: { errorBorder: { ...ring, parent: 'root' } } }] };
  // (a library whose focus state is two words: its own settings say which pseudo-class draws it, the house's do not)
  { const own = { pseudoClasses: { Rest: ':not(:hover)', 'Focus visible': ':focus-visible' } };
    const d3 = { props: { interaction: { type: 'enum', values: ['rest', 'focus-visible'], default: 'rest', role: 'interaction' } }, anatomy: { root: { kind: 'container' } },
      variants: [{ when: { interaction: 'focus-visible' }, add: { focusBorder: { ...ring, parent: 'root' } } }] };
    const combo = designCombo(d3, code, {}, { __state: 'keyboard' }, { keyboard: { pseudo: ':focus-visible' } }, own);
    ok('under the library\'s own settings a two-word focus state is the render\'s, and its ring the design\'s layer',
      JSON.stringify(combo) === '{"interaction":"focus-visible"}' && placeRings({ root: {} }, [['root', { ...ring, parent: 'root' }]], d3, combo, own).rings.join() === 'focusBorder'
      && keepsRing(d3, 'root', own) && !keepsRing(d3, 'root')); }
  // (the self leg end to end in its functions: site.mjs writes the sheet and markup, to-markup the mapping, the reading
  // reads them back, all under the library's own settings, where its focus state is two words)
  { const { siteFiles, ELEMENT } = await import('./site.mjs'), { toParity } = await import('./to-markup.mjs');
    const own = { pseudoClasses: { 'Focus visible': ':focus-visible' } };
    const tile = { contract: 1, component: 'Tile', folder: 'tile', props: { state: { type: 'enum', values: ['rest', 'focus-visible'], default: 'rest', role: 'interaction', pointer: ['focus-visible'] } },
      anatomy: { root: { kind: 'container', background: 'Bg/x' } }, variants: [{ when: { state: 'focus-visible' }, add: { focusBorder: { ...ring, parent: 'root' } } }] };
    const css = siteFiles({ Tile: tile }, { settingsOf: () => own })['all.css'];
    const m = toParity(tile, 'tile', { naming: ELEMENT, library: { Tile: tile }, framework: 'web-components', settings: own });
    const pseudo = m.axes.state['Focus-visible'].pseudo;
    const combo = designCombo(tile, { state: { code: '__state' } }, {}, { __state: 'focus-visible' }, { 'focus-visible': { pseudo } }, own);
    ok('a library with a two-word focus state: the self leg writes its ring as the outline the reading reads back as the design\'s layer',
      /:focus-visible[^{]*\{\s*outline:[^;]*solid/.test(css) && m.layers['Focus border'] === 'ds-tile' && pseudo === 'focus-visible'
      && placeRings({ root: {} }, [['root', { ...ring, parent: 'root' }]], tile, combo, own).rings.join() === 'focusBorder'); }
  ok('so a focus error render\'s ring is the error stroke there, read from the first reading with no design beside it',
    placeRings({ root: {} }, [['root', { ...ring, parent: 'root' }]], d2, designCombo(d2, code, {}, { __state: 'focus', invalid: true })).rings.join() === 'errorBorder');
}
// which outline is a box's own stroke and which a focus ring
{
  const { outlineIsOwn } = await import('./from-code.mjs');
  const o = { outline: { color: 'rgb(0, 0, 0)', width: 1, offset: 0 } };
  ok('at rest an outline is its own stroke; focused, a ring', outlineIsOwn(o, false, false, false) && !outlineIsOwn(o, true, false, false));
  ok('focused, inside a placed component\'s insides: its own stroke, unless the design keeps a ring there', outlineIsOwn(o, true, true, false) && !outlineIsOwn(o, true, true, true));
  ok('a box with a border of its own never takes its outline as its stroke, inside a placed component too', !outlineIsOwn({ ...o, border: { width: 1 } }, false, false, false) && !outlineIsOwn({ ...o, border: { width: 1 } }, true, true, false));
  ok('an ::after outline, or a clear one, is no stroke', !outlineIsOwn({ outline: { ...o.outline, after: true } }, false, false, false) && !outlineIsOwn({ outline: { ...o.outline, color: 'transparent' } }, true, true, false));
}

{
  const state = { default: {}, loading: { loading: true }, disabled: { disabled: true } };
  ok('an axis takes the value whose args the host carries', axisValueOf(state, { loading: '' }) === 'loading');
  ok('an inner control\'s disabled counts only where the host says none: a busy loading button stays loading', axisValueOf(state, { loading: '' }, true) === 'loading' && axisValueOf(state, {}, true) === 'disabled');
  ok('no args carried is the value that asks for none', axisValueOf(state, {}) === 'default');
  const design = { icon16: { type: 'instance', figma: 'Icon (16)', swaps: ['icon'] }, icon20: { type: 'instance', figma: 'Icon (20)', swaps: ['icon'] }, label: { type: 'text', figma: 'Label' }, label2: { type: 'instance', figma: 'Label 2' } };
  const got = asDesignSwaps({ icon: { type: 'string', code: 'icon' }, label: { type: 'string', code: 'label' } }, design);
  ok('a string icon the writer merged reads back as each size\'s swap', got.icon16?.type === 'instance' && got.icon20?.code === 'icon' && !got.icon);
  ok('a string the design holds as text stays text, though an instance shares its name', got.label?.type === 'string' && !got.label2);
}
{
  const btn = { props: { size: { type: 'enum', values: ['sm', 'md'], default: 'md' }, icon16: { type: 'instance', figma: 'Icon (16)', swaps: ['icon16'] }, icon20: { type: 'instance', figma: 'Icon (20)', swaps: ['icon20'] } },
    anatomy: { root: { kind: 'container' }, icon20: { kind: 'instance', parent: 'root' } }, variants: [{ when: { size: 'sm' }, remove: ['icon20'], add: { icon16: { kind: 'instance', parent: 'root' } } }] };
  ok('a glyph goes to the swap drawn at the size it is placed at, never both', JSON.stringify(glyphSwaps(btn, { size: 'sm' })) === '["Icon (16)"]' && JSON.stringify(glyphSwaps(btn, { size: 'md' })) === '["Icon (20)"]');
  const cb = { props: { state: { type: 'enum', values: ['enabled', 'invalid'], figmaValues: ['Enabled', 'Invalid'], default: 'enabled', figma: 'State' }, err: { type: 'boolean', default: true, figma: 'Error message', shows: ['error'] }, label: { type: 'boolean', default: true, figma: 'Label', shows: ['label'] } },
    anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root' } }, variants: [{ when: { state: 'invalid' }, add: { error: { kind: 'container', parent: 'root' } } }] };
  ok('a boolean whose layer the main draws not at the placed props, on or off, is left unread; one it draws there is read from being seen',
    JSON.stringify(shownRead(cb, { State: 'Enabled' }, { 'Error message': false, Label: false })) === '{"Label":false}'
    && JSON.stringify(shownRead(cb, { State: 'Invalid' }, { 'Error message': false })) === '{"Error message":false}');
  ok('a full-round empty box where the design draws an ellipse is the ellipse', asShape({ kind: 'container', full: true, radius: 99 }, { kind: 'graphic', shape: 'ellipse' }, false).shape === 'ellipse');
  ok('an empty box where the design draws a line is the line; one holding parts, or under an icon, stays a box', asShape({ kind: 'container' }, { kind: 'graphic', shape: 'line' }, false).kind === 'graphic' && asShape({ kind: 'container' }, { kind: 'graphic', shape: 'line' }, true).kind === 'container' && asShape({ kind: 'container' }, { kind: 'graphic', icon: true }, false).kind === 'container');
}
{
  const value = (t) => (t === 'Spacing/0' ? 0 : 8);
  const e = zeroTokens({ layout: { direction: 'row', gap: 0 } }, { layout: { gap: 0, padding: { top: 0, end: 0, bottom: 0, start: 0 } } }, value);
  ok('a 0 the design leaves unbound stays 0; the zero padding the code leaves unset is said', e.layout.gap === 0 && e.layout.padding && e.layout.padding.start === 0);
  const w = zeroTokens({ layout: { direction: 'row', gap: 'Spacing/0' } }, { layout: { gap: 0 } }, value);
  ok('a zero token the code wrote stays that token, against a design that leaves it unbound', w.layout.gap === 'Spacing/0');
  const see = (t) => ({ 'C/ghost': 'rgba(0, 0, 0, 0)', 'C/solid': 'rgb(0, 0, 0)', 'C/clear': 'rgb(0 0 0 / 0)', 'C/hex': '#00000000' })[t];
  ok('a fill the browser reads as none, where the component binds a see-through token there, is that token inside a placed component (never on its own parts); never a solid one',
    zeroTokens({}, { background: 'C/ghost' }, see, { fill: true }).background === 'C/ghost' && zeroTokens({}, { background: 'C/ghost' }, see).background === undefined && zeroTokens({}, { background: 'C/solid' }, see, { fill: true }).background === undefined && zeroTokens({ background: 'C/x' }, { background: 'C/ghost' }, see).background === 'C/x'
    && zeroTokens({}, { background: 'C/clear' }, see, { fill: true }).background === 'C/clear' && zeroTokens({}, { background: 'C/hex' }, see, { fill: true }).background === 'C/hex');
  const f = zeroTokens({ layout: { direction: 'row', gap: 'Spacing/8' } }, { layout: { gap: 0 } }, value);
  ok('a gap the code sets above 0 stays what it is', f.layout.gap === 'Spacing/8');
}

{ const props = { selectedDate: { type: 'string', code: 'selectedDate', sample: 'Label' }, unit: { type: 'string', code: 'unit', sample: 'Label' } };
  const design = { props: { value: { figma: 'Value', sets: ['field/value'] }, suffix: { sets: ['field/suffix'] } } };
  const joined = { value: { code: 'selectedDate', fixed: undefined }, suffix: { code: 'unit', fixed: undefined } };
  ok('a text two props share words with binds to the one the design sets that layer with, through the mapping\'s joins where code names differ; one the design sets elsewhere only binds none',
    boundText('Label', 'field/suffix', props, {}, design, joined) === 'unit' && boundText('Label', 'field/value', props, {}, design, joined) === 'selectedDate'
    && boundText('Label', 'field/suffix', { suffix: { type: 'string', code: 'suffix', sample: 'Label' }, value: { type: 'string', code: 'value', sample: 'Label' } }, {}, design) === 'suffix'
    && boundText('Other', 'field/suffix', props, {}, design, joined) === undefined
    && boundText('Label', 'message/label', { label: { type: 'string', code: 'label', sample: 'Label' } }, {}, { props: { label: { sets: ['texts/label'] } } }) === undefined
    && boundText('Label', 'message/label', { label: { type: 'string', code: 'label', sample: 'Label' } }, {}, null) === 'label'); }
ok('a name its id spells back is no name of its own; one it does not (a slash, other words) is kept',
  !keepsName('Action footer', 'footer/menu/actionFooter') && !keepsName('Action footer', 'x/actionFooter_2') && keepsName('Context menu item / Default', 'a/contextMenuItemDefault') && keepsName('Footer', 'x/actionFooter') && keepsName('Item 2', 'list/item2') && keepsName('Icon 24', 'a/icon24'));
{ const c = { anatomy: { root: { modes: { 'color-palette': 'color-palette-1', 'color-palette-1': 'blue' } }, label: {} }, variants: [{ when: {}, set: { 'root.modes': { 'color-palette-2': 'red' } } }] };
  const k = modeKeysOf([{ key: 'theme' }, { key: 'color-palette' }], c);
  ok('the mode keys read are the tokens\' axes and every key the contract sets a mode under, a collection the tokens lack (its own slug) and one a variant sets included',
    ['theme', 'color-palette', 'color-palette-1', 'color-palette-2'].every((x) => k.includes(x)) && k.length === 4 && modeKeysOf([{ key: 'theme' }], null).join() === 'theme'); }
{ // stacking first on top per combination, where the children cannot overlap
  const design = { props: { size: { type: 'enum', values: ['md', 'sm'], default: 'md' }, open: { type: 'boolean', default: false } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0, firstOnTop: true } }, bar: { kind: 'container', parent: 'root', layout: { direction: 'row', firstOnTop: true } },
      tip: { kind: 'container', parent: 'root', layout: { direction: 'row', firstOnTop: true } }, free: { kind: 'container', parent: 'root', layout: { direction: 'row', firstOnTop: true } } },
    variants: [{ when: { size: 'sm' }, set: { 'root.layout': { direction: 'row', gap: 0, firstOnTop: true }, 'bar.layout': { direction: 'column' } } },
      { when: { open: true }, add: { pop: { kind: 'container', parent: 'root', layout: { direction: 'column', firstOnTop: true } } } },
      { when: { size: 'sm', open: true }, set: { 'pop.layout': { direction: 'column' } } }] };
  const code = { props: structuredClone(design.props),
    anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0 } }, bar: { kind: 'container', parent: 'root', layout: { direction: 'row' } },
      free: { kind: 'container', parent: 'root', layout: { direction: 'row' } }, ring: { kind: 'container', parent: 'free', position: 'absolute' } },
    variants: [{ when: { size: 'sm' }, set: { 'root.layout': { direction: 'row', gap: 4 } } },
      { when: { open: true }, add: { pop: { kind: 'container', parent: 'root', layout: { direction: 'column', firstOnTop: true } }, tip: { kind: 'container', parent: 'root', layout: { direction: 'row' } } } }] };
  stackLikeDesign(code, design, (t) => t);
  const combos = ['md', 'sm'].flatMap((size) => [true, false].map((open) => ({ size, open })));
  const fot = (c, w, id) => { const x = expand(c, w)[id]; return x && x.layout ? !!x.layout.firstOnTop : undefined; };
  ok('stacking first on top is the design\'s at every combination where the children cannot overlap: a layout a variant sets whole, a part only a variant adds, and none where the design stacks none there; a part with a loose absolute child keeps its own',
    combos.every((w) => ['root', 'bar', 'tip', 'pop'].every((id) => fot(code, w, id) === undefined || fot(code, w, id) === fot(design, w, id)))
    && fot(code, { size: 'sm', open: false }, 'root') === true && fot(code, { size: 'md', open: true }, 'tip') === true && fot(code, { size: 'sm', open: true }, 'pop') === false
    && combos.every((w) => fot(code, w, 'free') === false)); }
{ // (Atlassian's navigation: a search icon centred in the placed search's frame; the design keeps no constraints there)
  const c = { component: 'N', props: {}, anatomy: { root: { kind: 'container' }, s: { kind: 'instance', parent: 'root', component: 'Search' }, 's/i': { kind: 'container', parent: 's', constraints: { horizontal: 'center', vertical: 'center' } }, 's/g': { kind: 'graphic', parent: 's', constraints: { horizontal: 'scale', vertical: 'scale' } }, 's/a': { kind: 'graphic', parent: 's', position: 'absolute', absolute: { x: 1, y: 1 }, constraints: { horizontal: 'max', vertical: 'min' } }, 's/d': { kind: 'graphic', parent: 's', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'scale', vertical: 'scale' } }, f: { kind: 'container', parent: 'root', constraints: { horizontal: 'center', vertical: 'min' } } }, variants: [{ when: {}, set: { 's/i.constraints': { horizontal: 'max', vertical: 'max' } } }] };
  const a = asFigma(c).contract.anatomy, v = asFigma(c).contract.variants[0].set;
  ok('a layer inside a placed component keeps no constraints, nor a place in its frame; but a glyph\'s scale, one placed absolutely in an auto layout and one outside it keep theirs', !a['s/i'].constraints && a['s/g'].constraints && a['s/a'].constraints && a.f.constraints && !('s/i.constraints' in v) && !a['s/d'].absolute && a['s/d'].constraints && a['s/a'].absolute);
  const w = { component: 'W', props: {}, anatomy: { root: { kind: 'container' }, s: { kind: 'instance', parent: 'root', component: 'S' }, 's/box': { kind: 'container', parent: 's' }, f: { kind: 'container', parent: 'root' } },
    variants: [{ when: {}, add: { 's/box/x': { kind: 'graphic', parent: 's/box', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'center', vertical: 'min' } } }, set: { 's/box.constraints.horizontal': 'max', 'f.constraints': { horizontal: 'max', vertical: 'min' }, 'f/y.parent': 's', 'f/y.position': 'absolute', 'f/y.absolute': { x: 2, y: 2 }, 'f/y.constraints': { horizontal: 'max', vertical: 'min' } } }] };
  const wv = asFigma(w).contract.variants[0];
  ok('a variant\'s own layer under a placed component, and a dotted key, are judged as the design judges them; a layer a variant moves out of the flow keeps its constraints, one outside keeps them',
    !wv.add['s/box/x'].absolute && !wv.add['s/box/x'].constraints && !('s/box.constraints.horizontal' in wv.set) && 'f.constraints' in wv.set && 'f/y.constraints' in wv.set);
}
console.log(`${n}/${n} passed`);
