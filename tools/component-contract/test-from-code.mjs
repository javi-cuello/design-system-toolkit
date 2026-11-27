#!/usr/bin/env node
// tools/component-contract/from-code.mjs: the pure parts of reading a contract from code.
import assert from 'node:assert/strict';
import { MARK_FIELDS, flowOf, paddingOf, lengthAt, snappedOffset, wordsAsDrawn, designSetsColour, unplacedIn, designTokenFor, boxSelector, tokenTable, writtenAs, styleFor, usageIn, delta, asFigma, offerFor, governedReading, controlsApi, cornerOf, cornersOf, fullestOf, fullCorner, isSlot, slotMark, wordsOf, zeroTokens, carries, axisValueOf, attrsByArg, asDesignSwaps, selfSlotControl, slotProp, dropPlaced, glyphSwaps, asShape, placedHere, layerShown, drawnAtZero, markFill, glyphless, seeThrough, withsOf, wrapGlyph, wholeShadowStyle, joinedNames, boundText, keepsName, dropOwnGlyph, selectorParts, writtenByHolder, INSTANCE_CSS, designKeyOf, swapKeyOf, modeKeysOf, shownRead, stackLikeDesign, textTypeOf, typedText, changedPaths, assistsOf, nameInside, roomTaken, nameBorrowed, colourKept, codeFigma, axisNames, paddingSaid, codeKeys, codeName, keyInstances, readCleared, lineEdge, stateProp, stateHidden, passedSwaps, namedAt, layerNamesOf, alignedOf, swappedMark, renamedJoins, foreignAsInstance } from './from-code.mjs';
import { cssName } from '../tokens/names.mjs';
import { createRequire } from 'node:module';
const { expand, byComponentName } = createRequire(import.meta.url)('./derive.cjs');
import { drawn as toCodeDrawn, toCss } from './to-code.mjs';
import { judge, shadowKey } from '../parity/external.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

// a line's stroke is its one leading edge, and its size across that edge 0 even where the box counts the edge in (a
// line scaled with its parent, sized 0%, read off a box one edge tall)
{ const scaled = lineEdge({ kind: 'graphic', width: 80, height: 1, border: { color: 'c', width: [1, 0, 0, 0], dash: 'dashed' } }, [1, 0, 0, 0], [1, 0, 0, 0]);
  ok('a line read off a box its edge makes tall is no tall: its stroke the edge, its height 0', scaled.height === 0 && scaled.width === 80 && JSON.stringify(scaled.border) === JSON.stringify({ color: 'c', width: 1, dash: 'dashed' }));
  const box = lineEdge({ kind: 'graphic', width: 80, height: 3, border: { color: 'c', width: [1, 0, 0, 0] } }, [1, 0, 0, 0], [1, 0, 0, 0]);
  ok('a box taller than its one edge is no line: its height and stroke stay as read', box.height === 3 && Array.isArray(box.border.width));
  const upright = lineEdge({ kind: 'graphic', width: 1, height: 80, border: { color: 'c', width: [0, 0, 0, 1] } }, [0, 0, 0, 1], [0, 0, 0, 1]);
  ok('…and an upright line read off a box its left edge makes wide is no wide: its stroke the edge, its width 0', upright.width === 0 && upright.height === 80 && upright.border.width === 1); }
// a placed icon's colour the code only inherits (currentColor, no rule of the sheet's) is dropped unless the design sets
// one for it: a library's EpicObject places Epic, an icon the library holds no contract for, whose glyph inside is purple
// in its own drawing; that is Epic's own, not this design's, so the inherited black is no override to compare
{ const epic = { anatomy: { root: { kind: 'container' }, sVG: { kind: 'container', parent: 'root' }, 'sVG/icon': { kind: 'instance', parent: 'sVG', component: 'Epic', key: 'k1' },
    'sVG/icon/icon': { kind: 'container', parent: 'sVG/icon' }, 'sVG/icon/icon/glyph': { kind: 'graphic', parent: 'sVG/icon/icon', background: 'color/icon/accent/purple' } }, variants: [] };
  const held = byComponentName([{ component: 'Epic', figma: { key: 'k1' }, anatomy: { root: { kind: 'container' } } }]);
  ok('a colour inside an icon the library holds no contract for is its own: the design sets none for the placed icon',
    designSetsColour(epic, 'sVG/icon', byComponentName([])) === false);
  ok('inside an icon the library holds, a colour the snapshot kept is the design\'s override; on the instance, or set by a variant, always the design\'s',
    designSetsColour(epic, 'sVG/icon', held) === true
    && designSetsColour({ ...epic, anatomy: { ...epic.anatomy, 'sVG/icon': { ...epic.anatomy['sVG/icon'], background: 'color/icon/x' } } }, 'sVG/icon', byComponentName([])) === true
    && designSetsColour({ anatomy: { i: { kind: 'instance', component: 'Epic' } }, variants: [{ when: {}, set: { 'i.background': 'c' } }] }, 'i', byComponentName([])) === true
    && designSetsColour({ anatomy: { i: { kind: 'instance', component: 'Epic' } }, variants: [] }, 'i', held) === false);
  // a foreign icon's lone glyph straight under it: roundTrip compares its colour as the instance's (to-figma glyph), so
  // a colour there, or a variant's set of it (an error state's red), is the design's (review of the first cut)
  const lone = { anatomy: { icon: { kind: 'instance', component: 'Icons/x' }, 'icon/icon': { kind: 'graphic', parent: 'icon', background: 'C/medium' } }, variants: [{ when: { error: true }, set: { 'icon/icon.background': 'C/red' } }] };
  ok('a foreign icon\'s lone glyph straight under it keeps its colour, and a variant\'s set of it, as the design\'s',
    designSetsColour(lone, 'icon', byComponentName([])) === true
    && designSetsColour({ anatomy: { ...lone.anatomy, 'icon/icon': { kind: 'graphic', parent: 'icon' } }, variants: lone.variants }, 'icon', byComponentName([])) === true
    && designSetsColour({ anatomy: { ...lone.anatomy, 'icon/icon': { ...lone.anatomy['icon/icon'], width: 12 } }, variants: [] }, 'icon', byComponentName([])) === false);
  // 2026-11-23 (review): a glyph painted with a colour style is still a lone glyph (rules.mjs GLYPH_WORDS, one source)
  ok('…and one painted with a colour style, as to-figma folds it', designSetsColour({ anatomy: { ...lone.anatomy, 'icon/icon': { ...lone.anatomy['icon/icon'], fillStyle: 'Sys/medium' } }, variants: [] }, 'icon', byComponentName([])) === true); }

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
{ const gap = [['Link/gap', 4.800000190734863, null, 'Link', [4.199999809265137, 4.800000190734863]], ['Link/gapWide', 4.809999942779541, null, 'Link']];
  const both = [cssName('Link', 'Link/gapWide'), cssName('Link', 'Link/gap')];
  ok('the token the code wrote holds the value read to two decimals: Figma\'s 4.800000190734863 is the 4.8 read back, 4.9 is not; of two the code wrote, 4.8 is the one that holds it, never the 4.81 beside it',
    designTokenFor('space', 4.8, gap, {}, null, null, null, [cssName('Link', 'Link/gap')]).token === 'Link/gap'
    && designTokenFor('space', 4.9, gap, {}, null, null, () => null, [cssName('Link', 'Link/gap')]).token === undefined
    && designTokenFor('space', 4.8, gap, {}, null, null, null, both).token === 'Link/gap' && designTokenFor('space', 4.81, gap, {}, null, null, null, both).token === 'Link/gapWide'); }
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
    !unplacedIn(raw, raw[2], (u) => (u.kind === 'instance' ? { direction: 'row' } : u.layout)));
  // (2026-11-27: one in another library's icon drawn open inside a placed component is placed by the design: a field's
  // open chevron's glyph at its point)
  const open = [...raw, { id: 'chev', kind: 'container', foreign: 'Chevron--up', parent: 'pin' }, { id: 'glyph', kind: 'graphic', parent: 'chev' }];
  ok('…but a part in another library\'s instance drawn open inside it has its place read', !unplacedIn(open, open[7])); }
ok('a placed component\'s arg is read under the attribute markup spells it (isChecked as is-checked or data-is-checked)',
  axisValueOf({ False: {}, True: { isChecked: true } }, { 'is-checked': 'true' }) === 'True' && axisValueOf({ False: {}, True: { isChecked: true } }, { 'data-is-checked': 'false' }) === 'False');
ok('the token the code wrote holds its value in any of its modes: a contextual field token drawn on a layer, not the base mode, is still the one written',
  (() => { const t = tokenTable({ collections: { Layer: { name: 'Layer', modes: ['Background', 'Layer 01'], values: { Background: { 'field (contextual)': '#f4f4f4' }, 'Layer 01': { 'field (contextual)': '#ffffff' } } },
    Base: { name: 'Base', modes: ['Value'], values: { Value: { 'Default/Neutral/White': '#ffffff' } } } } }, 'Background');
    return designTokenFor('background', '#ffffff', t, {}, null, null, null, ['--field-contextual']).token === 'field (contextual)'; })());
ok('of two names a property ends in, the longer: Background/Primary before Primary',
  designTokenFor('background', '#fff', [['Primary', '#fff', null, 'A'], ['Colour/Background/Primary', '#fff', null, 'B']], {}, null, null, null, ['--ds-colour-background-primary']).token === 'Colour/Background/Primary');
ok('a part\'s box in the flow is its host\'s control where the host draws none (display: contents), else the host', boxSelector('end', 'contents') === '[data-contract-id="end"] > :first-child' && boxSelector('end', 'flex') === '[data-contract-id="end"]');
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

{
  // a prop the mapping pairs with a design prop of its kind carries that prop's Figma name as the design spells it, never
  // the code's name in the house convention (a reading named the design's isBold "Is bold", so the round trip saw a prop change)
  const props = { label: { type: 'string', code: 'label' }, isBold: { type: 'boolean', default: false, code: 'isBold' }, extra: { type: 'boolean', default: false, code: 'extra' }, twin: { type: 'string', code: 'twin' } };
  const design = { label: { type: 'string', figma: 'Label text' }, bold: { type: 'boolean', figma: 'isBold' }, tw: { type: 'boolean', figma: 'Twin flag' } };
  const named = asFigma({ ...code, props: joinedNames(props, design, { label: 'label', bold: { arg: 'isBold' }, tw: 'twin' }), variants: [] }).contract.props;
  ok('a prop the mapping pairs with a design prop takes the design\'s own Figma name; an unpaired one, or one paired with another kind, the convention',
    named.label.figma === 'Label text' && named.isBold.figma === 'isBold' && named.extra.figma === 'Extra' && named.twin.figma === 'Twin');
  // never a name another prop is drawn under: an unpaired prop's convention name, or a swap's boolean (review)
  const clash = joinedNames({ children: { type: 'string', code: 'children' }, label: { type: 'string', code: 'label' }, hasIcon: { type: 'boolean', default: false, code: 'hasIcon' }, icon: { type: 'swap', code: 'icon', shows: ['icon'], showName: 'Show icon' } },
    { label: { type: 'string', figma: 'Label' }, show: { type: 'boolean', figma: 'Show icon' } }, { label: 'children', show: 'hasIcon' });
  ok('a design name another prop is drawn under is not taken: an unpaired prop\'s convention, a swap\'s boolean', !clash.children.figma && !clash.hasIcon.figma);
  // and whatever the held names miss, asFigma never draws two props under one name: a joined name another prop is drawn
  // under after all (a swap's own layer name, Icon) goes back to the convention
  const late = joinedNames({ glyph: { type: 'string', code: 'glyph' }, icon: { type: 'swap', code: 'icon', shows: ['icon'], default: 'x' } }, { g: { type: 'string', figma: 'Icon' } }, { g: 'glyph' });
  const lp = asFigma({ ...code, props: late, variants: [] }).contract.props, names = Object.values(lp).map((q) => q.figma);
  ok('asFigma never draws two props under one Figma name', new Set(names).size === names.length && lp.glyph.figma === 'Glyph');
}

ok('a percentage radius is of the box, not pixels: 50% on a 120px avatar is a full round of 60, 10% a corner of 12',
  JSON.stringify(cornerOf('50%', 120, 120)) === '{"radius":60,"full":true}' && JSON.stringify(cornerOf('10%', 120, 120)) === '{"radius":12}'
  && cornerOf('999px', 32, 32).full === true && !cornerOf('8px', 32, 32).full);
{
  // the corners to-code writes one per corner (top-left, top-right, bottom-right, bottom-left: Figma's order and CSS's)
  // read back in that order, a square corner 0, a full one marked; four alike are one radius, as the design says them
  const written = (toCss({ contract: 1, component: 'split', props: {}, anatomy: { root: { kind: 'container', radius: [0, 'Radius/M', 'Radius/M', 0] } }, variants: [] }, 'split').match(/border-radius: ([^;]+);/) || [])[1] || '';
  const px = { 'var(--radius-m)': '8px' }, cs = written.split(' ').map((v) => px[v] || (v === '0' ? '0px' : v));
  ok('a radius per corner is read per corner, in the order to-code writes it; four alike stay one radius',
    written === '0 var(--radius-m) var(--radius-m) 0' && JSON.stringify(cornersOf(cs, 32, 32, cornerOf)) === '{"radius":[0,8,8,0]}'
    && JSON.stringify(cornersOf(['0px', '999px', '999px', '0px'], 32, 32, cornerOf)) === '{"radius":[0,{"radius":999,"full":true},{"radius":999,"full":true},0]}'
    && JSON.stringify(cornersOf(['8px', '8px', '8px', '8px'], 32, 32, cornerOf)) === '{"radius":8}' && JSON.stringify(cornersOf(['0px', '0px', '0px', '0px'], 32, 32, cornerOf)) === '{}');
}
ok('the fullest radius is the largest corner token, never a larger one open to every field (a font weight of 400)',
  fullestOf([{ name: 'Font weight', value: 400, scopes: ['ALL_SCOPES'] }, { name: 'Radius/Full', value: 9999, scopes: ['CORNER_RADIUS'] }, { name: 'Radius/M', value: 8, scopes: ['CORNER_RADIUS'] }].map((t, i) => (i === 1 ? { ...t, value: 200 } : t))) === 'Radius/Full'
  && fullestOf([{ name: 'A', value: 4 }, { name: 'B', value: 12 }]) === 'B' && fullestOf([]) === null);
ok('a corner rounder than its box is the token the code writes there (a small radius on a smaller box), else the fullest',
  fullCorner('Radius/S', 'Radius/Full') === 'Radius/S' && fullCorner(6, 'Radius/Full') === 'Radius/Full' && fullCorner(6, null) === null);

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
  { const cb = { props: { labelText: { type: 'string', default: 'Label', figma: 'Heading' }, valueText: { type: 'string', default: 'Value', figma: 'Detail' }, value: { type: 'boolean', default: true, figma: 'Value', shows: ['box/value'] } },
      anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: '{labelText}' }, box: { kind: 'container', parent: 'root' }, 'box/value': { kind: 'text', parent: 'box', content: '{valueText}' } } };
    ok('a text under a layer the instance is read not to draw shows no word: the words left count out one for one', JSON.stringify(wordsOf(cb, ['Group'], {}, { Value: null })) === '{"Heading":"Group"}'
      && JSON.stringify(wordsOf(cb, ['Group'], {}, { Value: false })) === '{"Heading":"Group"}' && JSON.stringify(wordsOf(cb, ['Group'], {}, { Value: true })) === '{}'); }
  ok('words that do not count out one for one are not guessed', JSON.stringify(wordsOf(badge, ['New', 'Extra'])) === '{}' && JSON.stringify(wordsOf(badge, [])) === '{}');
}

{
  const value = (t) => ({ 'S/0': 0, 'S/4': 4 })[t];
  const e = zeroTokens({ layout: { direction: 'row' } }, { layout: { padding: { top: 'S/0', end: 'S/0', bottom: 'S/0', start: 'S/4' } } }, value);
  ok('a padding the code leaves unset takes the design\'s zero tokens; a side the design pads stays the code\'s 0', JSON.stringify(e.layout.padding) === '{"top":"S/0","end":"S/0","bottom":"S/0","start":0}');
}
{
  // a token at the top of its collection has no group, so no slash in its name: still a token, by its value
  const value = (t) => ({ None: 0, 'S/0': 0 })[t] ?? t;
  const e = zeroTokens({ kind: 'graphic' }, { kind: 'graphic', radius: 'None' }, value);
  const w = zeroTokens({ kind: 'graphic' }, { kind: 'graphic', radius: 'mixed' }, value);
  ok('a zero corner the code leaves unset takes the design\'s token though its name has no group; a word that is no token is not taken', e.radius === 'None' && w.radius === undefined);
}
{
  // one test of what a token is, for every reader of one: a see-through fill and a gap named with no group
  const value = (t) => ({ Clear: 'rgba(0, 0, 0, 0)', Roomy: '8px' })[t] ?? t;
  const e = zeroTokens({ kind: 'instance' }, { kind: 'instance', background: 'Clear' }, value, { fill: true });
  const design = { props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0, firstOnTop: true } } }, variants: [] };
  const code = { props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 'Roomy' } } }, variants: [] };
  stackLikeDesign(code, design, value);
  ok('a see-through fill and a gap bound to tokens with no group are tokens as a slashed one is', e.background === 'Clear' && code.anatomy.root.layout.firstOnTop === true);
}
// a placed component's flag, as markup that writes every flag as a string carries it
ok('a flag written "false" is off, and one written "true", bare or empty is on', !carries({ selected: 'false' }, 'selected', true) && carries({ selected: 'false' }, 'selected', false) && carries({ selected: 'true' }, 'selected', true) && carries({ selected: '' }, 'selected', true) && carries({ 'data-selected': 'true' }, 'selected', true) && carries({}, 'selected', false) && !carries({}, 'selected', true));
ok('an arg by its own attribute, else by a data attribute holding its value, never the walk\'s own marks', carries({ size: 'sm' }, 'size', 'sm') && !carries({ size: 'md' }, 'size', 'sm') && carries({ 'data-hierarchy': 'primary' }, 'variant', 'primary') && !carries({ 'data-figma-id': 'primary' }, 'variant', 'primary'));
ok('an arg renamed off an HTML attribute\'s name (typeOption) is read from that attribute, as its markup writes it', carries({ type: 'revealed' }, 'typeOption', 'revealed') && !carries({ type: 'revealed' }, 'typeOption', 'swipe-action') && carries({ 'type-option': 'x' }, 'typeOption', 'x'));
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
  const day = el('ds-button', [], { 'data-figma-id': 'footer/day' }), words = el('span', [], { 'data-part': 'value' }); words.parentElement = day; day.firstElementChild = words;
  ok('a part first in a placed component that draws no root of its own is that part, never the component\'s words', elementOfLayer(words, 'footer/day/value', 'text', R, others)[0] === words && elementOfLayer(words, 'footer/day/value', 'text', R, others)[1] === false);
}
// a placed instance the mapping names is opened at any depth of placing: an override two deep (a slider's stop's dot,
// inside its Stops) is read, not left to the inner component's own value (a library's standard slider)
{
  const { opensPlaced } = await import('./from-code.mjs');
  const inPage = new Function(`return ${opensPlaced.toString()}`)();
  ok('a placed instance the mapping names is opened at the top, and inside another the mapping names it under',
    inPage(false, 'showStopsStops', true) && inPage('showStopsStops', 'showStopsStops/trackStop1', true));
  ok('one the mapping does not name, or named under another instance, is not opened',
    !inPage(false, 'stops', false) && !inPage('showStopsStops', 'showStopsStops/trackStop1', false) && !inPage('other', 'showStopsStops/trackStop1', true));
}

// a placed component's place is written on the control its host wraps (to-code's `ds-icon-button > button`): its CSS
// order is read there, as the browser lays it out (a library's text field: a trailing icon after the input's box)
{
  const { cssOrderOf } = await import('./from-code.mjs');
  const inPage = new Function(`return ${cssOrderOf.toString()}`)();
  const row = { display: 'flex', getAttribute: () => 'layer' };
  const button = { style: { display: 'inline-flex', order: '2' } };
  const host = { style: { display: 'contents', order: '0' }, firstElementChild: button, parentElement: { ...row, style: row } };
  const style = (n) => n.style || n;
  ok('a host that draws no box takes its control\'s CSS order; a box its own, and none outside a flex or grid parent',
    inPage(host, 'layer', style) === 2 && inPage({ style: { display: 'block', order: '3' }, parentElement: host.parentElement }, 'layer', style) === 3
    && inPage({ style: { display: 'block', order: '3' }, parentElement: { display: 'block', getAttribute: () => 'layer' } }, 'layer', style) === null
    && inPage({ ...host, firstElementChild: { style: { order: '0' } } }, 'layer', style) === null);
}

// a placed instance's own styling is read off the box it draws: a host that draws none (display: contents) draws it
// through its control, where to-code writes this component's override on it (`> [data-part="icon-button"] > button`:
// a split button's corners, padding and sides read nothing off the host)
{
  const { ownBoxOf } = await import('./from-code.mjs');
  const inPage = new Function(`return ${ownBoxOf.toString()}`)();
  const el = (st, attrs = []) => ({ style: st, hasAttribute: (k) => attrs.includes(k) }), style = (n) => n.style;
  const button = el({ display: 'inline-flex' });
  const host = { style: { display: 'contents' }, firstElementChild: button, childElementCount: 1 };
  ok('a contents host whose child is not its one control (another child beside it, or a layer read as its own part) is read off itself',
    inPage({ ...host, childElementCount: 2 }, style) !== button && inPage({ ...host, firstElementChild: el({ display: 'block' }, ['data-contract-id']) }, style).style.display === 'contents');
  ok('a placed instance\'s styling is read off its control where its host draws no box, else off itself',
    inPage(host, style) === button && inPage({ ...host, style: { display: 'flex' } }, style).style.display === 'flex' && inPage({ style: { display: 'contents' }, firstElementChild: null }, style).style.display === 'contents');
}

// a child out of the flow paints where the browser paints it, never where a CSS order would put it: order moves only a
// flex or grid item (CSS Flexbox 4.1, 4.3), and an absolute child paints over the box's unpositioned children, in markup
// order among the positioned, a z-index over all (CSS 2 Appendix E); the children in the flow keep their laid-out order
{
  const { stackOf } = await import('./from-code.mjs'), { siblingOrder, liftsAlone } = await import('./rules.mjs');
  const stack = new Function(`return ${stackOf.toString()}`)(), order = new Function(`return ${siblingOrder.toString()}`)(), lifts = new Function(`return ${liftsAlone.toString()}`)();
  const style = (n) => n.style || n;
  const kid = (st) => ({ style: { display: 'block', position: 'static', zIndex: 'auto', ...st }, parentElement: { style: { display: 'flex' } } });
  const said = (n) => JSON.stringify(stack(n, style, lifts));
  // (an unpositioned child that makes a stacking context of its own paints with the positioned, in markup order: CSS 2
  // Appendix E, css-color's note on opacity, css-transforms)
  ok('a child in the flow that stacks alone (see-through, transformed, filtered, isolated, blended) is lifted; one at its defaults is not',
    ['opacity: 0.5', 'transform: matrix(1, 0, 0, 1, 2, 0)', 'rotate: 45deg', 'translate: 2px', 'scale: -1 1', 'filter: blur(2px)', 'isolation: isolate', 'mixBlendMode: multiply', 'willChange: transform']
      .every((d) => { const [k, v] = d.split(': '); return said(kid({ [k]: v })) === '{"lifted":true}'; })
    && said(kid({ opacity: '1', transform: 'none', rotate: 'none', filter: 'none', isolation: 'auto', mixBlendMode: 'normal', willChange: 'auto' })) === '{}');
  ok('what stacks a child: out of the flow, positioned in it, a z-index where it applies (positioned, or a flex item), none on a block\'s child',
    said(kid({ position: 'absolute' })) === '{"out":true}' && said(kid({ position: 'relative' })) === '{"lifted":true}' && said(kid({})) === '{}'
    && said(kid({ zIndex: '2' })) === '{"z":2}' && said(kid({ position: 'absolute', zIndex: '-1' })) === '{"out":true,"z":-1}'
    && said({ ...kid({ zIndex: '2' }), parentElement: { style: { display: 'block' } } }) === '{}');
  // (a turned part drawn in a wrapper that is a box: the wrapper is what its parent lays out and stacks, to-code turnedParts)
  const turnedKid = (wrap) => ({ style: { display: 'block', position: 'absolute', zIndex: 'auto', rotate: '90deg' }, parentElement: { hasAttribute: (a) => a === 'data-turn', style: { display: 'block', position: 'relative', zIndex: '2', ...wrap }, parentElement: { style: { display: 'flex' } } } });
  ok('a part turned in a wrapper stacks as its wrapper does, in the flow; one whose wrapper draws no box as itself',
    said(turnedKid({})) === '{"lifted":true,"z":2}' && said(turnedKid({ display: 'contents', position: 'static', zIndex: 'auto' })) === '{"out":true}');
  ok('a host that draws no box stacks as its control does',
    said({ style: { display: 'contents', position: 'static', zIndex: 'auto' }, firstElementChild: { style: { display: 'block', position: 'absolute', zIndex: '3' } }, parentElement: { style: { display: 'flex' } } }) === '{"out":true,"z":3}');
  const ids = (xs) => order(xs).map((e) => e.id).join();
  ok('an absolute child written between two others with a CSS order paints over both, its order read from no declaration',
    ids([{ id: 'a' }, { id: 'abs', cssOrder: 1, stack: { out: true } }, { id: 'b', cssOrder: 2 }]) === 'a,b,abs');
  ok('two absolute children paint in markup order; the flow keeps its CSS order',
    ids([{ id: 'x', stack: { out: true } }, { id: 'a', cssOrder: 1 }, { id: 'y', stack: { out: true } }, { id: 'b', cssOrder: 0 }]) === 'b,a,x,y');
  ok('a z-index puts an absolute child between the children it paints over and under, and absolute children in z order',
    ids([{ id: 'a', stack: { z: 1 } }, { id: 'abs', stack: { out: true, z: 2 } }, { id: 'b', stack: { z: 3 } }]) === 'a,abs,b'
    && ids([{ id: 'abs', stack: { out: true, z: 2 } }, { id: 'abs2', stack: { out: true, z: 1 } }, { id: 'a', stack: { z: 3 } }]) === 'abs2,abs,a');
  ok('below 0 it paints under the flow; a child in the flow positioned after it in the markup paints over it',
    ids([{ id: 'a' }, { id: 'abs', stack: { out: true, z: -1 } }]) === 'abs,a'
    && ids([{ id: 'abs', stack: { out: true } }, { id: 'a', stack: { lifted: true } }]) === 'abs,a' && ids([{ id: 'a', stack: { lifted: true } }, { id: 'abs', stack: { out: true } }]) === 'a,abs');
}
// a part turned a quarter sits in a wrapper (to-code turnedParts, [data-turn]): its parent is the wrapper's, and where the
// wrapper is a box (the part turned) the wrapper is what the parent lays out, its order the wrapper's; where it is none
// (display: contents) the part is laid out as if the wrapper were not there
{
  const { cssOrderOf, turnOf } = await import('./from-code.mjs');
  const order = new Function(`return ${cssOrderOf.toString()}`)(), turn = new Function(`return ${turnOf.toString()}`)();
  const style = (n) => n.style || n;
  const row = { display: 'flex', getAttribute: () => 'layer', hasAttribute: () => false };
  const box = (display, o) => ({ style: { display, order: o }, parentElement: row, hasAttribute: (a) => a === 'data-turn', getAttribute: () => null });
  const part = (w, o = '0') => { const n = { style: { display: 'block', order: o }, parentElement: w, hasAttribute: () => false }; w.firstElementChild = n; return n; };
  const shown = box('block', '4'), gone = box('contents', '0'), on = part(shown), off = part(gone, '5');
  ok('a turned part is laid out by its wrapper, and an unturned one as if the wrapper were not there: its parent and its order read so',
    turn(on, style).up === row && turn(on, style).flow === shown && turn(on, style).turned === true && turn(off, style).up === row && turn(off, style).flow === off && turn(off, style).turned === false
    && turn({ style: {}, parentElement: row, hasAttribute: () => false }, style).up === row && order(on, 'layer', style) === 4 && order(off, 'layer', style) === 5);
}

// the box a gap below 0 is pulled back on is the one the parent lays out: a turned part's wrapper, where to-code writes it
{ const { flowSelector } = await import('./from-code.mjs');
  ok('the second child\'s pull back is read on its wrapper where it is turned, else on its own box',
    flowSelector('track', new Set(['track']), 'block') === '[data-contract-turn="track"]' && flowSelector('icon', new Set(['track']), 'block') === '[data-contract-id="icon"]'
    && flowSelector('end', new Set(), 'contents') === '[data-contract-id="end"] > :first-child'); }

// a layer the mapping places inside a placed component takes the design's name there, never the placed component's own
// name for the element it lands on (a library's date picker: Select's chevron, <ChevronDownIcon>, carries the design's
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
// focus ring of this component's (a library's loading button: the spinner's ellipse read a focusRing at state focus)
{
  const { insidePlaced } = await import('./from-code.mjs');
  const raw = [{ id: 'root', kind: 'container' }, { id: 'spinner', kind: 'instance', parent: 'root' }, { id: 'spinner/anim', kind: 'instance', parent: 'spinner' }, { id: 'spinner/anim/ellipse1', kind: 'graphic', parent: 'spinner/anim' }, { id: 'label', kind: 'text', parent: 'root' }];
  ok('a part under a placed instance is inside it, at any depth', insidePlaced(raw, 'spinner/anim/ellipse1') && insidePlaced(raw, 'spinner/anim'));
  ok('the component\'s own boxes are not', !insidePlaced(raw, 'root') && !insidePlaced(raw, 'label') && !insidePlaced(raw, 'spinner'));
  // a placed component drawn as an icon mark (a library's checkbox icon, one the store does not hold) is its own box: its
  // outline at focus is the stroke to-code wrote on the instance, never a focus ring of this component's
  const marked = [...raw, { id: 'check', kind: 'graphic', parent: 'root' }];
  ok('a placed component drawn as an icon mark holds its own outline; a graphic that is no mark does not',
    insidePlaced(marked, 'check', new Set(['check'])) && !insidePlaced(marked, 'check') && !insidePlaced(marked, 'label', new Set(['check'])));
  // so is one drawn open (another library's, the markup's data-component: the walk's `foreign`), and its insides are inside
  // it: the checkbox icon drawn open read its focus stroke as a ring (2026-11-27)
  const opened = [...raw, { id: 'box', kind: 'container', parent: 'root', foreign: 'Check' }, { id: 'box/v', kind: 'graphic', parent: 'box' }];
  ok('an instance drawn open holds its own outline, and its insides are inside it', insidePlaced(opened, 'box') && insidePlaced(opened, 'box/v'));
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
// a ring read from a focused outline is the design's own ring layer where it draws one (a library's focusBorder)
{
  const { ringKeyOf } = await import('./from-code.mjs');
  const ring = { kind: 'graphic', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'Focus/focus', width: 2 }, shape: 'rectangle' };
  const props = { state: { type: 'enum', values: ['enabled', 'focus'], default: 'enabled', role: 'interaction' } };
  const ringed = { props, anatomy: { root: { kind: 'container' }, input: { kind: 'container', parent: 'root' } },
    variants: [{ when: { state: 'focus' }, add: { focusBorder: { ...ring, parent: 'root' }, 'input/focusBorder': { ...ring, parent: 'input' } } }] };
  ok('the design\'s ring layer is the ring\'s key, at the root and under a part', ringKeyOf(ringed, 'root').key === 'focusBorder' && ringKeyOf(ringed, 'input').key === 'input/focusBorder');
  ok('a design layer the reading already holds is not taken twice: a ring of its own then', ringKeyOf(ringed, 'root', { focusBorder: {} }).key === 'focusRing');
  ok('no ring in the design, or no design: a synthesised focusRing', ringKeyOf({ props, anatomy: ringed.anatomy, variants: [] }, 'input').key === 'input/focusRing' && ringKeyOf(null, 'root').key === 'focusRing');
  ok('a stroke drawn at rest is no ring', ringKeyOf({ props, anatomy: ringed.anatomy, variants: [{ when: { state: 'enabled' }, add: { line: { ...ring, parent: 'root' } } }] }, 'root').key === 'focusRing');
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
  ok('a ring read from an outline takes the place the design gives it among the box\'s children, not the last',
    (() => { const d = { props, anatomy: { ...anatomy, icon: { kind: 'graphic', parent: 'root', order: 1 } }, variants: [{ when: { state: 'focus' }, add: { focusBorder: { ...ring, parent: 'root', order: 1 } }, set: { 'icon.order': 2 } }] };
      const got = placeRings({ root: {}, input: { kind: 'container', parent: 'root', order: 0 }, icon: { kind: 'graphic', parent: 'root', order: 1 } }, [['root', { ...ring, parent: 'root' }]], d, { state: 'focus' });
      return got.input.order === 0 && got.focusBorder.order === 1 && got.icon.order === 2; })());
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
  // the second trip draws the first reading's layers against the design's props: a combination layer's rest (a library's
  // Select, a toggletip at no label, inline, small) held nowhere under the design's `enabled`, and the part a hover also
  // adds was hidden at rest by the sheet (log14, second leg +1)
  { const { inDesignStates } = await import('./from-code.mjs');
    const reading = { props: { state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'], code: '__state' }, small: { type: 'boolean', default: false } } };
    const select = { props: { state: { type: 'enum', values: ['enabled', 'hover'], default: 'enabled', role: 'interaction', pointer: ['hover'] }, small: { type: 'boolean', default: false } },
      anatomy: { root: { kind: 'container' } } };
    const tip = { tip: { kind: 'container', parent: 'root' } };
    const layers = [{ when: { small: true, state: 'rest' }, combination: true, add: tip }, { when: { small: true, state: 'hover' }, combination: true, add: tip }, { when: { small: true }, set: {} }];
    const got = inDesignStates(layers, reading, select);
    ok('the second trip says the first reading\'s render state in the design\'s words: its rest the design\'s default, a hover a hover',
      JSON.stringify(got.map((v) => v.when)) === '[{"small":true,"state":"enabled"},{"small":true,"state":"hover"},{"small":true}]'
      && !!expand({ ...select, variants: got }, { small: true, state: 'enabled' }).tip
      && layers[0].when.state === 'rest' && inDesignStates(layers, { props: {} }, select) === layers); }
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
  // (the self leg end to end in its functions: site.mjs writes the sheet, markup and mapping (selfDrawn), the reading
  // reads them back, all under the library's own settings, where its focus state is two words)
  { const { siteFiles, selfDrawn } = await import('./site.mjs');
    const own = { pseudoClasses: { 'Focus visible': ':focus-visible' } };
    const tile = { contract: 1, component: 'Tile', folder: 'tile', props: { state: { type: 'enum', values: ['rest', 'focus-visible'], default: 'rest', role: 'interaction', pointer: ['focus-visible'] } },
      anatomy: { root: { kind: 'container', background: 'Bg/x' } }, variants: [{ when: { state: 'focus-visible' }, add: { focusBorder: { ...ring, parent: 'root' } } }] };
    const css = siteFiles({ Tile: tile }, { settingsOf: () => own })['all.css'];
    const m = selfDrawn(tile, { library: { Tile: tile }, mains: () => null, settings: own }).mapping;
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
  // a prop the markup renames in code (Type as typeOption) is carried on its host under its own name, type="square"
  { const axes = attrsByArg({ Type: { Round: {}, Square: { typeOption: 'square' } } }, [{ key: 'type', name: 'typeOption', renamed: 'type', attr: true }]);
    ok('a renamed prop\'s arg is read by the attribute its host carries it as', axisValueOf(axes.Type, { type: 'square' }) === 'Square' && axisValueOf(axes.Type, {}) === 'Round'); }
  ok('an inner control\'s disabled counts only where the host says none: a busy loading button stays loading', axisValueOf(state, { loading: '' }, true) === 'loading' && axisValueOf(state, {}, true) === 'disabled');
  ok('no args carried is the value that asks for none', axisValueOf(state, {}) === 'default');
  const design = { icon16: { type: 'instance', figma: 'Icon (16)', swaps: ['icon'] }, icon20: { type: 'instance', figma: 'Icon (20)', swaps: ['icon'] }, label: { type: 'text', figma: 'Label' }, label2: { type: 'instance', figma: 'Label 2' } };
  const got = asDesignSwaps({ icon: { type: 'string', code: 'icon' }, label: { type: 'string', code: 'label' } }, design);
  ok('a string icon the writer merged reads back as each size\'s swap', got.icon16?.type === 'instance' && got.icon20?.code === 'icon' && !got.icon);
  ok('a string the design holds as text stays text, though an instance shares its name', got.label?.type === 'string' && !got.label2);
  // content the code draws a library component in by default (to-markup's swap of Button 1): the design's swap, where
  // the reading draws the layer it swaps as an instance; a slot where it does not, or the design has no swap of that key
  const group = { button1: { type: 'instance', figma: '<Button> 1', swaps: ['button'] }, button3: { type: 'instance', figma: '<Button> 3', swaps: ['button_3'] }, extra: { type: 'instance', figma: 'Extra', swaps: ['extra'] } };
  const read = { anatomy: { root: { kind: 'container' }, button: { kind: 'instance', parent: 'root', component: 'Btn' }, extra: { kind: 'slot', parent: 'root' } }, variants: [{ when: { count: '3' }, add: { button_3: { kind: 'instance', parent: 'root', component: 'Btn' } } }] };
  const sw = asDesignSwaps({ button1: { type: 'slot', code: 'button1', placed: true }, button3: { type: 'slot', code: 'button3', placed: true }, extra: { type: 'slot', code: 'extra', placed: true }, other: { type: 'slot', code: 'other', placed: true }, free: { type: 'slot', code: 'free' } }, group, read);
  ok('a slot the code fills with a library component by default reads back as the design\'s swap of that instance, one a variant adds too',
    JSON.stringify(sw.button1) === JSON.stringify({ type: 'instance', figma: '<Button> 1', swaps: ['button'], code: 'button1' }) && sw.button3.type === 'instance');
  // only the toolkit's own story marks a slot read at its default: a real Storybook's docgen default keeps the stand-in
  ok('the self story marks a swap of a library component as placed, and only that mark reads a slot at its default',
    JSON.stringify(selfSlotControl({ type: 'node', placed: { parts: ['button'], component: 'Btn' } })) === '{"control":"slot","placed":"Btn"}' && JSON.stringify(selfSlotControl({ type: 'node' })) === '{"control":"slot"}'
    && slotProp('button1', selfSlotControl({ type: 'node', placed: { parts: ['button'], component: 'Btn' } })).placed === true
    && !('placed' in slotProp('icon', { control: 'slot', default: '<ChevronDown />' })) && !('placed' in slotProp('children', { control: 'slot', default: 'Submit' })));
  // a slot the toolkit's markup draws its design sample in while given nothing: read with no stand-in, by its data-slot name
  ok('the self story marks a slot holding a sample by its contract name, and the reading keeps the mark till it is dropped',
    JSON.stringify(selfSlotControl({ type: 'node', key: 'body', sample: true })) === '{"control":"slot","sample":"body"}'
    && slotProp('content', selfSlotControl({ type: 'node', key: 'body', sample: true })).sample === 'body' && !('sample' in slotProp('icon', { control: 'slot' })));
  { const props = { b: { type: 'slot', code: 'b', sample: 'body' } }; dropPlaced(props); ok('no contract a reading writes keeps the sample mark', !('sample' in props.b)); }
  { // the mark leaves both the shaped contract and the reading the report writes (asFigma copies each prop)
    const raw = { component: 'G', props: { b: { type: 'slot', code: 'b', placed: true } }, anatomy: { root: { kind: 'container' } }, variants: [] };
    const shaped = asFigma(raw, {});
    dropPlaced(shaped.contract.props, raw.props);
    ok('no contract a reading writes keeps the placed mark: neither the shaped one nor the reading itself', !JSON.stringify(shaped.contract.props).includes('placed') && !JSON.stringify(raw.props).includes('placed'));
  }
  ok('a default the reading does not draw as an instance, or a key the design does not swap, stays a slot; a plain slot is untouched',
    JSON.stringify(sw.extra) === '{"type":"slot","code":"extra"}' && JSON.stringify(sw.other) === '{"type":"slot","code":"other"}' && JSON.stringify(sw.free) === '{"type":"slot","code":"free"}');
}
{
  const btn = { props: { size: { type: 'enum', values: ['sm', 'md'], default: 'md' }, icon16: { type: 'instance', figma: 'Icon (16)', swaps: ['icon16'] }, icon20: { type: 'instance', figma: 'Icon (20)', swaps: ['icon20'] } },
    anatomy: { root: { kind: 'container' }, icon20: { kind: 'instance', parent: 'root' } }, variants: [{ when: { size: 'sm' }, remove: ['icon20'], add: { icon16: { kind: 'instance', parent: 'root' } } }] };
  ok('a glyph goes to the swap drawn at the size it is placed at, never both', JSON.stringify(glyphSwaps(btn, { size: 'sm' }, ['Add'])) === '[["Icon (16)","Add"]]' && JSON.stringify(glyphSwaps(btn, { size: 'md' }, ['Add'])) === '[["Icon (20)","Add"]]');
  // a select draws a caret glyph in its field and, at focus, its menu's slot holding the glyph the caller swapped in:
  // the slot's swap takes the glyph drawn in its own layer, never the first the select draws (the caret)
  const sel = { props: { state: { type: 'enum', values: ['default', 'focus'], default: 'default' }, slotOptions: { type: 'instance', figma: 'slot {Options}', swaps: ['menu/slot'] } },
    anatomy: { root: { kind: 'container' } }, variants: [{ when: { state: 'focus' }, add: { caret: { kind: 'instance', parent: 'root' }, menu: { kind: 'container', parent: 'root' }, 'menu/slot': { kind: 'instance', parent: 'menu', swappedBy: 'slotOptions' } } }] };
  ok('a swap takes the glyph drawn in the layer it swaps, not the first the instance draws; one holding none keeps its default',
    JSON.stringify(glyphSwaps(sel, { state: 'focus' }, ['Caret', 'Calendar'], [['menu/slot', ['Calendar']]])) === '[["slot {Options}","Calendar"]]'
    && JSON.stringify(glyphSwaps(sel, { state: 'focus' }, ['Caret'], [['menu/slot', []]])) === '[]'
    && JSON.stringify(glyphSwaps(sel, { state: 'default' }, ['Caret'], [['menu/slot', []]])) === '[]');
  const cb = { props: { state: { type: 'enum', values: ['enabled', 'invalid'], figmaValues: ['Enabled', 'Invalid'], default: 'enabled', figma: 'State' }, err: { type: 'boolean', default: true, figma: 'Error message', shows: ['error'] }, label: { type: 'boolean', default: true, figma: 'Label', shows: ['label'] } },
    anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root' } }, variants: [{ when: { state: 'invalid' }, add: { error: { kind: 'container', parent: 'root' } } }] };
  ok('a boolean whose layer the main draws not at the placed props, on or off, is left unread; one it draws there is read from being seen',
    JSON.stringify(shownRead(cb, { State: 'Enabled' }, { 'Error message': false, Label: false })) === '{"Label":false}'
    && JSON.stringify(shownRead(cb, { State: 'Invalid' }, { 'Error message': false })) === '{"Error message":false}');
  ok('a boolean whose layer is unseen only as a box around it is not drawn (null) is left unread', JSON.stringify(shownRead(cb, { State: 'Enabled' }, { Label: null })) === '{}');
  {
    // two effect styles of one geometry, each recording its colour in one mode: the code names the first, whose
    // variable draws the second's recorded colour under the modes drawn
    const fx = (name, color, x = -1) => ({ name, layers: [{ type: 'INNER_SHADOW', x, y: 0, blur: 0, spread: 0, color }] });
    const effects = [fx('Line one/Right', '#c6c6c6'), fx('Line two/Right', '#e0e0e0')];
    const read = [{ inset: true, x: -1, y: 0, blur: 0, spread: 0, color: 'rgb(224, 224, 224)' }];
    // (each style layer's colour in every mode its variable takes: the first's variable is #e0e0e0 in a second mode)
    const modes = (l) => (l.color === '#c6c6c6' ? ['#c6c6c6', '#e0e0e0'] : [l.color]);
    ok('a whole shadow is the effect style the code names where it draws that style\'s layers, in a colour its variable takes in some mode',
      wholeShadowStyle(read, effects[0], effects, shadowKey, modes) === effects[0]);
    ok('one the code names in a colour its variable takes in no mode (its own custom property overriding it) is matched by value, so the difference shows',
      wholeShadowStyle([{ ...read[0], color: '#ff0000' }], effects[0], effects, shadowKey, modes) === undefined
      && wholeShadowStyle(read, effects[0], effects, shadowKey) === effects[1]);
    ok('one the code names drawing other layers, or none named, is the style that draws the same, colour and all; none, none',
      wholeShadowStyle(read, fx('Wide/Right', '#e0e0e0', -2), effects, shadowKey, modes) === effects[1]
      && wholeShadowStyle(read, null, effects, shadowKey, modes) === effects[1] && wholeShadowStyle([{ ...read[0], x: -3 }], null, effects, shadowKey, modes) === undefined);
  }
  {
    const { paddingOf, paddingCss } = await import('./from-code.mjs');
    // a box rendered right to left (dir="rtl"): its start is its right edge, as the design's start is the reading edge
    const px = (v) => parseFloat(v) || 0, box = { paddingTop: '2px', paddingRight: '12px', paddingBottom: '6px', paddingLeft: '4px' };
    ok('a box\'s padding start and end follow its direction: right to left, the start is the right',
      JSON.stringify(paddingOf({ ...box, direction: 'rtl' }, px)) === '{"top":2,"end":4,"bottom":6,"start":12}'
      && JSON.stringify(paddingOf({ ...box, direction: 'ltr' }, px)) === '{"top":2,"end":12,"bottom":6,"start":4}');
    ok('and the property each side\'s token is read from with it',
      paddingCss(true).start === 'padding-right' && paddingCss(true).end === 'padding-left' && paddingCss(false).start === 'padding-left' && paddingCss(false).top === 'padding-top');
    const { flowOf } = await import('./from-code.mjs');
    const f = (o) => JSON.stringify(flowOf({ rowGap: '8px', columnGap: '4px', flexWrap: 'nowrap', ...o }, px));
    ok('a flex box\'s gap is the one along its flow (a row\'s the column gap), and wrapped, the one between its lines is its crossGap; normal is 0',
      f({ flexDirection: 'row' }) === '{"direction":"row","gap":4}' && f({ flexDirection: 'column' }) === '{"direction":"column","gap":8}'
      && f({ flexDirection: 'row', flexWrap: 'wrap' }) === '{"direction":"row","gap":4,"crossGap":8}' && f({ flexDirection: 'row', flexWrap: 'wrap', rowGap: 'normal' }) === '{"direction":"row","gap":4,"crossGap":0}');
    const z = zeroTokens({ layout: { direction: 'row', wrap: true, gap: 4, crossGap: 0 } }, { layout: { gap: 'S/4', crossGap: 'S/0' } }, (t) => ({ 'S/0': 0, 'S/4': 4 })[t]);
    ok('a zero between the lines takes the design\'s zero token, as a gap does', z.layout.crossGap === 'S/0');
  }
  {
    const { sideWinner } = await import('../parity/values.mjs');
    // one side's cascade group, its rules lowest precedence first as Chrome lists them (a longhand a shorthand with a
    // var() writes listed empty beside it): whichever of the physical longhand, its shorthand, the logical longhand and
    // the logical shorthand wins is the side's value
    const R = (...ds) => ({ cssProperties: ds.map(([name, value, important]) => ({ name, value, ...(important && { important }) })) });
    const chip = R(['padding', 'var(--space-1) var(--space-3)'], ['padding-top', ''], ['padding-right', ''], ['padding-bottom', ''], ['padding-left', '']);
    const lead = R(['padding-inline-start', 'var(--space-2)']);
    ok('a side is read from whichever of its longhands and shorthands wins: a later logical longhand over an earlier shorthand',
      sideWinner([chip, lead], 'padding-left') === 'var(--space-2)' && sideWinner([chip, lead], 'padding-right') === 'var(--space-3)'
      && sideWinner([chip, lead], 'padding-right', true) === 'var(--space-2)' && sideWinner([lead, chip], 'padding-left') === 'var(--space-3)');
    ok('an important declaration over a later one; a raw base, its own value; none written, none',
      sideWinner([R(['padding-left', 'var(--a)', true]), lead], 'padding-left') === 'var(--a)' && sideWinner([R(['padding', '4px 8px']), R(['padding-inline', 'var(--s) var(--e)'])], 'padding-right') === 'var(--e)'
      && sideWinner([R(['padding', '4px 8px'])], 'padding-left') === '8px' && sideWinner([R(['color', 'red'])], 'padding-left') === null && sideWinner([chip], 'color') === null);
    ok('a longhand left empty by a shorthand outside the group (border-left, border) wins as unknown: none, so the reader asks that shorthand next',
      sideWinner([R(['border-left-width', 'var(--stroke-1)']), R(['border-left', 'var(--stroke-2) solid red'], ['border-left-width', ''], ['border-left-style', ''], ['border-left-color', ''])], 'border-left-width') === null
      && sideWinner([R(['border-width', 'var(--a)']), R(['border', 'var(--w) solid'], ['border-top-width', ''], ['border-left-width', ''])], 'border-left-width') === null
      && sideWinner([R(['border', 'var(--w) solid'], ['border-left-width', '']), R(['border-left-width', 'var(--b)'])], 'border-left-width') === 'var(--b)');
    // a border shorthand that wins gives the side its width: the part that is a length, or a var whose value is one
    const len = { '--w': '2px', '--c': 'red', '--x': 'var(--w)' }, resolve = (n) => len[n] ?? null;
    ok('a side\'s width is the width part of the border shorthand that wins: a later border over an earlier border-width, a later border-left in the same rule',
      sideWinner([R(['border-width', 'var(--a)']), R(['border', 'var(--w) solid red'], ['border-top-width', ''], ['border-left-width', ''])], 'border-left-width', false, resolve) === 'var(--w)'
      && sideWinner([R(['border-width', 'var(--a)'], ['border-left', 'var(--w) solid'], ['border-left-width', ''])], 'border-left-width', false, resolve) === 'var(--w)'
      && sideWinner([R(['border-left', 'solid var(--c) var(--x)'], ['border-left-width', ''])], 'border-left-width', false, resolve) === 'var(--x)'
      && sideWinner([R(['border-inline-start', '1px solid var(--c)'])], 'border-left-width', false, resolve) === '1px'
      && sideWinner([R(['border-inline-start', '1px solid var(--c)'])], 'border-right-width', true, resolve) === '1px'
      && sideWinner([R(['border-left', 'var(--w) solid'], ['border-left-width', '']), R(['border-width', 'var(--a)'])], 'border-left-width', false, resolve) === 'var(--a)'
      && sideWinner([R(['border', 'solid var(--c)'], ['border-left-width', ''])], 'border-left-width', false, resolve) === null);
    // a var holding a whole border (its value or its fallback) is the width's where its own parts give one: varChain follows it
    const whole = (n) => ({ '--ds-border': 'var(--stroke-1) solid var(--line)', '--stroke-1': '1px', '--line': 'red', '--bare': 'solid red' })[n] ?? null;
    ok('a var holding a whole border shorthand, set or as its fallback, is the side\'s width word; one with no width part, none',
      sideWinner([R(['border', 'var(--ds-border)'], ['border-left-width', ''])], 'border-left-width', false, whole) === 'var(--ds-border)'
      && sideWinner([R(['border', 'var(--unset, var(--stroke-1) solid var(--line))'], ['border-left-width', ''])], 'border-left-width', false, whole) === 'var(--unset, var(--stroke-1) solid var(--line))'
      && sideWinner([R(['border', 'var(--bare)'], ['border-left-width', ''])], 'border-left-width', false, whole) === null);
  }
  {
    const { shorthandOf, sidePiece, instanceWrites } = await import('./from-code.mjs');
    // a longhand written inside a shorthand with a var() (Chrome reports it empty), or under its logical name (Chrome
    // reports the physical one not at all): where its value is written
    ok('a side\'s longhand names its shorthand and side; one with none, none',
      JSON.stringify(shorthandOf('padding-bottom')) === '{"prop":"padding","side":2}' && shorthandOf('border-top-left-radius').prop === 'border-radius'
      && shorthandOf('column-gap').side === 1 && shorthandOf('top').prop === 'inset' && shorthandOf('border-left-width').side === 3 && shorthandOf('color') === null);
    ok('its logical longhand and shorthand by the element\'s direction: left is the inline start, or the end right to left',
      JSON.stringify(shorthandOf('padding-left', { logical: true })) === '{"longhand":"padding-inline-start","prop":"padding-inline","side":0}'
      && JSON.stringify(shorthandOf('padding-left', { logical: true, rtl: true })) === '{"longhand":"padding-inline-end","prop":"padding-inline","side":1}'
      && JSON.stringify(shorthandOf('top', { logical: true })) === '{"longhand":"inset-block-start","prop":"inset-block","side":0}'
      && JSON.stringify(shorthandOf('margin-bottom', { logical: true })) === '{"longhand":"margin-block-end","prop":"margin-block","side":1}'
      && JSON.stringify(shorthandOf('border-right-width', { logical: true })) === '{"longhand":"border-inline-end-width","prop":"border-inline-width","side":1}'
      && JSON.stringify(shorthandOf('border-top-left-radius', { logical: true, rtl: true })) === '{"longhand":"border-start-end-radius","prop":null}'
      && shorthandOf('row-gap', { logical: true }) === null);
    ok('a side of a shorthand is its own value, by the one to four values the shorthand takes (a logical one\'s or a gap\'s one or two)',
      sidePiece('0 0 var(--space-8) 0', 'padding', 2) === 'var(--space-8)' && sidePiece('var(--a) var(--b, var(--c))', 'padding', 3) === 'var(--b, var(--c))'
      && sidePiece('var(--a)', 'margin', 1) === 'var(--a)' && sidePiece('var(--a) 0 var(--b)', 'padding', 3) === '0'
      && sidePiece('var(--g)', 'gap', 1) === 'var(--g)' && sidePiece('var(--s) var(--e)', 'padding-inline', 1) === 'var(--e)' && sidePiece('var(--s)', 'inset-block', 1) === 'var(--s)'
      && sidePiece('', 'padding', 0) === null && sidePiece(null, 'padding', 0) === null);
    ok('a slash cuts a corner\'s radii only, and only outside a function: a calc() keeps its division',
      sidePiece('calc(var(--space-2) / 2) var(--space-4)', 'padding', 3) === 'var(--space-4)' && sidePiece('calc(var(--space-2) / 2) var(--space-4)', 'padding', 0) === 'calc(var(--space-2) / 2)'
      && sidePiece('var(--r) 0 / 2px', 'border-radius', 2) === 'var(--r)' && sidePiece('calc(var(--a) / 2) 0', 'border-radius', 0) === 'calc(var(--a) / 2)');
    ok('a placed instance\'s field is this component\'s where its rule reaches the instance; an opacity written inline on it too, never another field',
      instanceWrites('background', '.a > .b', true) && !instanceWrites('background', '.b', false) && instanceWrites('opacity', null, false, '0.4')
      && !instanceWrites('opacity', null, false, null) && !instanceWrites('background', null, false, 'red'));
  }
  ok('an empty box takes the shape the design draws at the combination read: none where a variant takes its rectangle away',
    asShape({ kind: 'container' }, { kind: 'graphic', shape: 'rectangle' }, false, { kind: 'graphic' }).shape === undefined
    && asShape({ kind: 'container' }, { kind: 'graphic', shape: 'rectangle' }, false).shape === 'rectangle'
    && asShape({ kind: 'container' }, null, false, { kind: 'graphic', shape: 'rectangle' }).kind === 'container');
  { // a radio's icon placed at focus and checked, listing nothing inside: its dot's box is the checked variant's container
    const icon = { component: 'Icon', props: { checked: { type: 'boolean', default: false, figma: 'checked', axis: true, figmaValues: ['false', 'true'] } },
      anatomy: { root: { kind: 'container' }, box: { kind: 'container', parent: 'root' }, 'box/dot': { kind: 'graphic', parent: 'box', shape: 'rectangle' } },
      variants: [{ when: { checked: true }, set: { 'box/dot.kind': 'container', 'box/dot.shape': null }, add: { 'box/dot/fill': { kind: 'graphic', parent: 'box/dot', shape: 'ellipse' } } }] };
    const mainOf = byComponentName([icon]), A = { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Icon', with: { checked: 'true' } } };
    const here = placedHere(A, 'i/box/dot', mainOf);
    ok('a part inside a placed instance that lists nothing there is that component\'s at the instance\'s props, so an empty box stays a container',
      here && here.kind === 'container' && asShape({ kind: 'container' }, { kind: 'graphic', shape: 'rectangle' }, false, here).kind === 'container'
      && placedHere({ ...A, 'i/box': { kind: 'container', parent: 'i' } }, 'i/box/dot', mainOf) === null
      && placedHere({ ...A, i: { ...A.i, with: { checked: 'false' } } }, 'i/box/dot', mainOf).kind === 'graphic');
  }
  ok('a layer a boolean shows is shown at opacity 0 where its design draws it at 0 (a tooltip drawn until hovered), not where hidden or not laid out',
    layerShown(1, { visibility: 'visible', opacity: '0' }, true) && layerShown(1, { visibility: 'visible', opacity: '1' }) && !layerShown(1, { visibility: 'hidden', opacity: '1' }, true) && !layerShown(0, { visibility: 'visible', opacity: '1' }));
  ok('…and one code draws at 0 for good, where the design paints it, is not shown', !layerShown(1, { visibility: 'visible', opacity: '0' }));
  { const tip = { anatomy: { root: { kind: 'container' }, tip: { kind: 'instance', parent: 'root', opacity: 0 }, dot: { kind: 'graphic', parent: 'root' } }, variants: [{ when: { state: 'hover' }, set: { 'tip.opacity': null } }, { when: { size: 'l' }, add: { badge: { kind: 'graphic', parent: 'root', opacity: 0 } } }] };
    ok('a design draws a layer at 0 in its anatomy, as a variant sets it or adds it; one it paints throughout, never',
      drawnAtZero(tip, 'tip') && drawnAtZero(tip, 'badge') && drawnAtZero({ anatomy: { dot: {} }, variants: [{ set: { 'dot.opacity': 0 } }] }, 'dot') && !drawnAtZero(tip, 'dot') && !drawnAtZero(null, 'tip')); }
  ok('an icon mark painted with a fill of its own keeps it as its fill; a clear one, or one a mask cuts a glyph from, has none',
    markFill({ backgroundColor: 'rgb(255, 255, 255)', maskImage: 'none' }, seeThrough) === 'rgb(255, 255, 255)' && markFill({ backgroundColor: 'rgba(0, 0, 0, 0)' }, seeThrough) === null
    && markFill({ backgroundColor: 'rgb(0, 0, 0)', maskImage: 'url(x.svg)' }, seeThrough) === null
    && ['oklch(0.5 0.1 20 / 0)', 'rgb(0 0 0 / 0)', 'color(srgb 1 1 1 / 0)', 'transparent'].every((c) => markFill({ backgroundColor: c }, seeThrough) === null));
{ // a glyph read as the wrapper the design places, whose own prop names it (a <icon>: Warning)
  const design = { anatomy: { icon: { kind: 'instance', component: 'Wrap', with: { '<icon>': 'Warning', size: 'm' } } },
    variants: [{ when: { tone: 'error' }, set: { 'icon.with': { '<icon>': 'Error', size: 'm' } } }, { when: { tone: 'new' }, add: { icon: { kind: 'instance', with: { '<icon>': 'Sparkle' } } } }] };
  ok('each with a contract gives a layer: its anatomy\'s, a variant\'s set and a variant\'s add', withsOf(design, 'icon').filter(Boolean).map((w) => w['<icon>']).join() === 'Warning,Error,Sparkle');
  const read = () => ({ e: { asset: 'warning' }, vs: [{ when: { tone: 'error' }, set: { 'icon.asset': 'error' } }, { when: { tone: 'info' }, set: {} }] });
  { const { e, vs } = read();
    ok('a glyph drawn is the wrapper at its prop, in the design\'s spelling, each variant\'s glyph too, its asset taken away',
      wrapGlyph('icon', e, vs, ['<icon>'], withsOf(design, 'icon')) && e.with['<icon>'] === 'Warning' && JSON.stringify(vs[0].set) === JSON.stringify({ 'icon.with': { '<icon>': 'Error' } }) && JSON.stringify(vs[1].set) === '{}'); }
  { const { e, vs } = read();
    ok('…the first swap prop whose values cover every glyph drawn, not merely the first', wrapGlyph('icon', e, vs, ['size', '<icon>'], withsOf(design, 'icon')) && e.with['<icon>'] === 'Warning'); }
  { const { e, vs } = read();
    ok('…and where a glyph is one the design gives no prop, nothing changes', !wrapGlyph('icon', e, vs, ['<icon>'], [{ '<icon>': 'Warning' }]) && !e.with && vs[0].set['icon.asset'] === 'error'); }
  { const e = { asset: 'house' }, host = { anatomy: { 'nav/icon': { kind: 'instance', with: { '<icon>': 'House' } } }, variants: [] };
    ok('…a glyph the placed component draws there of its own counts, where the design overrides it (its with read beside the design\'s)',
      !wrapGlyph('icon', { asset: 'house' }, [], ['<icon>'], withsOf(design, 'icon')) && wrapGlyph('icon', e, [], ['<icon>'], [...withsOf(design, 'icon'), ...withsOf(host, 'nav/icon')]) && e.with['<icon>'] === 'House'); } }
  ok('a mark draws no glyph of its own where it has no child, no text and no pseudo-element with content; one with any keeps its glyph\'s colour',
    glyphless(0, '', ['none', 'normal']) && glyphless(0, '  ', ['none', 'none']) && !glyphless(1, '', ['none', 'none']) && !glyphless(0, '', ['"\\e900"', 'none']));
  ok('…nor where it holds text of its own, an icon font\'s ligature', !glyphless(0, 'home', ['none', 'none']));
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
  ok('the mode keys read are the tokens\' axes and every key the contract sets a mode under, a collection the tokens lack (its own slug), one a variant sets and one on a part a variant adds included',
    ['theme', 'color-palette', 'color-palette-1', 'color-palette-2'].every((x) => k.includes(x)) && k.length === 4 && modeKeysOf([{ key: 'theme' }], null).join() === 'theme'
    && modeKeysOf([], { anatomy: {}, variants: [{ when: { x: true }, add: { icon: { kind: 'instance', modes: { 'glyph-colour': 'link' } } } }] }).join() === 'glyph-colour'); }
{ // stacking first on top per combination, where the children cannot overlap
  const design = { props: { size: { type: 'enum', values: ['md', 'sm'], default: 'md' }, open: { type: 'boolean', default: false } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0, firstOnTop: true } }, bar: { kind: 'container', parent: 'root', layout: { direction: 'row', firstOnTop: true } },
      tip: { kind: 'container', parent: 'root', layout: { direction: 'row', firstOnTop: true } }, free: { kind: 'container', parent: 'root', layout: { direction: 'row', firstOnTop: true } } },
    variants: [{ when: { size: 'sm' }, set: { 'root.layout': { direction: 'row', gap: 0, firstOnTop: true }, 'bar.layout': { direction: 'column' } } },
      { when: { open: true }, add: { pop: { kind: 'container', parent: 'root', layout: { direction: 'column', firstOnTop: true } } } },
      { when: { size: 'sm', open: true }, set: { 'pop.layout': { direction: 'column' } } }] };
  const code = { props: structuredClone(design.props),
    anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0 } }, bar: { kind: 'container', parent: 'root', layout: { direction: 'row' } },
      free: { kind: 'container', parent: 'root', layout: { direction: 'row' } }, dot: { kind: 'container', parent: 'free' }, ring: { kind: 'container', parent: 'free', position: 'absolute' } },
    variants: [{ when: { size: 'sm' }, set: { 'root.layout': { direction: 'row', gap: 4 } } },
      { when: { open: true }, add: { pop: { kind: 'container', parent: 'root', layout: { direction: 'column', firstOnTop: true } }, tip: { kind: 'container', parent: 'root', layout: { direction: 'row' } } } }] };
  stackLikeDesign(code, design, (t) => t);
  const combos = ['md', 'sm'].flatMap((size) => [true, false].map((open) => ({ size, open })));
  const fot = (c, w, id) => { const x = expand(c, w)[id]; return x && x.layout ? !!x.layout.firstOnTop : undefined; };
  ok('stacking first on top is the design\'s at every combination where the children cannot overlap: a layout a variant sets whole, a part only a variant adds, and none where the design stacks none there; a part with a loose absolute child keeps its own',
    combos.every((w) => ['root', 'bar', 'tip', 'pop'].every((id) => fot(code, w, id) === undefined || fot(code, w, id) === fot(design, w, id)))
    && fot(code, { size: 'sm', open: false }, 'root') === true && fot(code, { size: 'md', open: true }, 'tip') === true && fot(code, { size: 'sm', open: true }, 'pop') === false
    && combos.every((w) => fot(code, w, 'free') === false)); }
{ // a child placed absolutely can overlap the rest, though the design places it so too: its stacking is the code's as
  // read (by z-index or paint), never the design's copied, so a background painted over its text is a row
  const design = { props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0, firstOnTop: true } }, text: { kind: 'text', parent: 'root', order: 0 }, bg: { kind: 'graphic', parent: 'root', order: 1, position: 'absolute' } }, variants: [] };
  const code = { props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0 } }, text: { kind: 'text', parent: 'root', order: 0 }, bg: { kind: 'graphic', parent: 'root', order: 1, position: 'absolute' } }, variants: [] };
  stackLikeDesign(code, design, (t) => t);
  ok('a box with a child placed absolutely keeps the stacking read off the code, where the design places it so too', !code.anatomy.root.layout.firstOnTop);
  // (so does one whose children the page drew overlapping some other way, a grid cell or a margin: `overlap`)
  const laid = { props: {}, anatomy: { root: { kind: 'container', overlap: true, layout: { direction: 'row', gap: 0 } }, text: { kind: 'text', parent: 'root', order: 0 }, bg: { kind: 'graphic', parent: 'root', order: 1 } }, variants: [] };
  stackLikeDesign(laid, { ...design, anatomy: { ...design.anatomy, bg: { kind: 'graphic', parent: 'root', order: 1 } } }, (t) => t);
  ok('a box whose children were drawn overlapping keeps the stacking read off the code', !laid.anatomy.root.layout.firstOnTop);
  // (a box's own words have a box too, their text nodes' union, so a sibling a margin pulls over them is caught)
  const { wordsRect } = await import('./from-code.mjs');
  const t = (w, l, r) => ({ nodeType: 3, textContent: w, b: { left: l, top: 0, right: r, bottom: 5, width: r - l, height: 5 } });
  const range = { selectNodeContents(c) { this.c = c; }, getBoundingClientRect() { return this.c.b; } };
  ok('a box\'s own words are measured run by run, each text node\'s box its own, so an element between two runs is not covered', JSON.stringify(wordsRect({ childNodes: [t('a', 0, 10), { nodeType: 1 }, t(' ', 40, 44), t('b', 20, 30)] }, range)) === '[[0,0,10,5],[20,0,30,5]]'); }
{ // a reading's rest state is the design's Enabled (a library's slider): its stacking goes on the reading's own rest, never
  // on a layer naming `enabled`, a state the reading has no word for, which held at no combination it draws
  const st = (values, def) => ({ type: 'enum', values, default: def, figma: 'State', role: 'interaction', pointer: ['hover'] });
  const design = { props: { state: st(['enabled', 'hover', 'focus'], 'enabled') }, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0, firstOnTop: true } } },
    variants: [{ when: { state: 'hover' }, set: { 'root.layout': { direction: 'row', gap: 0 } } }, { when: { state: 'focus' }, set: { 'root.layout': { direction: 'row', gap: 0 } } }] };
  const code = { props: { state: st(['rest', 'hover', 'focus'], 'rest') }, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0 } } }, variants: [] };
  stackLikeDesign(code, design, (t) => t);
  ok('stacking at the design\'s default state goes on the reading\'s rest, its own word for it',
    !code.variants.some((v) => v.when.state === 'enabled') && expand(code, { state: 'rest' }).root.layout.firstOnTop === true && !expand(code, { state: 'hover' }).root.layout.firstOnTop); }
{ // an icon coloured with nothing (to-code's transparent, for a glyph Figma paints with nothing) reads with no colour;
  // one drawn in a colour reads that colour's token
  const { iconColour } = await import('./from-code.mjs');
  const tokOf = async (v) => (v === 'rgb(10, 20, 30)' ? 'Icon/strong' : v);
  ok('a transparent icon reads no colour; a coloured one its token', (await iconColour('rgba(0, 0, 0, 0)', tokOf)) === undefined && (await iconColour('transparent', tokOf)) === undefined && (await iconColour('rgb(10, 20, 30)', tokOf)) === 'Icon/strong'); }
{ // a placed component's slot this one fills keeps no binding: the slot prop is that component's own, which derive states
  // only on a component's own slots (a list item's content slot, filled by the component placing it)
  const c = { component: 'S', props: { body: { type: 'slot' } }, anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Item' }, 'i/content': { kind: 'slot', parent: 'i', content: '{content}' }, body: { kind: 'slot', parent: 'root', content: '{body}' } },
    variants: [{ when: {}, set: { 'i/content.content': '{content}', 'body.content': '{body}' } }] };
  const { anatomy: a, variants: [v] } = asFigma(c).contract;
  ok('a placed component\'s slot keeps no binding; the component\'s own slot keeps its', a['i/content'].content === undefined && a['i/content'].kind === 'slot' && a.body.content === '{body}' && !('i/content.content' in v.set) && v.set['body.content'] === '{body}'); }
{ // (a library's navigation: a search icon centred in the placed search's frame; the design keeps no constraints there)
  const c = { component: 'N', props: {}, anatomy: { root: { kind: 'container' }, s: { kind: 'instance', parent: 'root', component: 'Search' }, 's/i': { kind: 'container', parent: 's', constraints: { horizontal: 'center', vertical: 'center' } }, 's/g': { kind: 'graphic', parent: 's', constraints: { horizontal: 'scale', vertical: 'scale' } }, 's/a': { kind: 'graphic', parent: 's', position: 'absolute', absolute: { x: 1, y: 1 }, constraints: { horizontal: 'max', vertical: 'min' } }, 's/d': { kind: 'graphic', parent: 's', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'scale', vertical: 'scale' } }, f: { kind: 'container', parent: 'root', constraints: { horizontal: 'center', vertical: 'min' } } }, variants: [{ when: {}, set: { 's/i.constraints': { horizontal: 'max', vertical: 'max' } } }] };
  const a = asFigma(c).contract.anatomy, v = asFigma(c).contract.variants[0].set;
  ok('a layer inside a placed component keeps no constraints, nor a place in its frame; but a glyph\'s scale, one placed absolutely in an auto layout and one outside it keep theirs', !a['s/i'].constraints && a['s/g'].constraints && a['s/a'].constraints && a.f.constraints && !('s/i.constraints' in v) && !a['s/d'].absolute && a['s/d'].constraints && a['s/a'].absolute);
  const w = { component: 'W', props: {}, anatomy: { root: { kind: 'container' }, s: { kind: 'instance', parent: 'root', component: 'S' }, 's/box': { kind: 'container', parent: 's' }, f: { kind: 'container', parent: 'root' } },
    variants: [{ when: {}, add: { 's/box/x': { kind: 'graphic', parent: 's/box', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'center', vertical: 'min' } } }, set: { 's/box.constraints.horizontal': 'max', 'f.constraints': { horizontal: 'max', vertical: 'min' }, 'f/y.parent': 's', 'f/y.position': 'absolute', 'f/y.absolute': { x: 2, y: 2 }, 'f/y.constraints': { horizontal: 'max', vertical: 'min' } } }] };
  const wv = asFigma(w).contract.variants[0];
  ok('a variant\'s own layer under a placed component, and a dotted key, are judged as the design judges them; a layer a variant moves out of the flow keeps its constraints, one outside keeps them',
    !wv.add['s/box/x'].absolute && !wv.add['s/box/x'].constraints && !('s/box.constraints.horizontal' in wv.set) && 'f.constraints' in wv.set && 'f/y.constraints' in wv.set);
}
{ // an icon named as a component of the library (a library's Checkbox glyph inside the Checkbox set) keeps the design's key,
  // so a second trip resolves it to the icon, never to the set that holds it (which would place itself without end)
  const set = { component: 'Checkbox', figma: { key: 'set' }, anatomy: { root: { kind: 'container' }, glyph: { kind: 'instance', parent: 'root', component: 'Checkbox', key: 'icon' } },
    variants: [{ when: { checked: true }, add: { tick: { kind: 'instance', parent: 'root', component: 'Checkbox checked', key: 'tick' } } }] };
  const mains = byComponentName([set]);
  const k = designKeyOf(set, set.anatomy.glyph, 'Checkbox');
  ok('a read icon takes the design\'s key for its layer, or the one key the design places that glyph under; and with it is never the same-named component',
    k === 'icon' && mains('Checkbox', k) === null && mains('Checkbox', null) === set
    && designKeyOf(set, set.anatomy.glyph, 'Checkbox checked') === 'tick' && designKeyOf(set, null, 'Close') === null);
  // a glyph the design places only by a variant's swap takes that swap's key
  const swapped = { ...set, variants: [{ when: { error: true }, set: { 'glyph.component': 'Warning', 'glyph.key': 'warn' } }] };
  ok('a glyph a variant swaps to takes the key the design swaps it under', designKeyOf(swapped, null, 'Warning') === 'warn');
  ok('a swap to a glyph the design keys nowhere says no key, as null where the base icon has one (else it keeps the base\'s)', swapKeyOf(swapped, 'icon', 'Info') === null && swapKeyOf(swapped, undefined, 'Info') === undefined && swapKeyOf(swapped, 'icon', 'Warning') === 'warn');
}
{ // a colour the placed component draws its glyph in itself is no override (a library's Slot: its magenta placeholder,
  // a full-bleed rectangle, which to-code writes as the slot instance's color and the reader read back as an override)
  const slot = { component: 'Slot', props: {}, variants: [], anatomy: { root: { kind: 'container', width: 204, height: 40 },
    background: { kind: 'graphic', parent: 'root', position: 'absolute', shape: 'rectangle', background: 'color/magenta' } } };
  const host = { component: 'Banner', props: {}, variants: [], anatomy: { root: { kind: 'container' }, slotChildren: { kind: 'instance', parent: 'root', component: 'Slot', width: 'fill' } } };
  const mains = byComponentName([slot]);
  ok('to-code writes the colour the placed component draws its glyph in on the instance', /magenta/.test(toCodeDrawn(host, {}, mains).slotChildren.decls.get('color').v));
  const read = { kind: 'instance', parent: 'root', component: 'Slot', width: 'fill', background: 'color/magenta' }, vs = [{ when: { x: true }, set: { 'slotChildren.background': 'color/magenta' } }];
  dropOwnGlyph('slotChildren', read, vs, mains);
  ok('read back, that colour is the component\'s own: no override, in the base or a variant', read.background === undefined && !('slotChildren.background' in vs[0].set));
  const other = { kind: 'instance', component: 'Slot', background: 'color/blue' };
  dropOwnGlyph('slotChildren', other, [], mains);
  ok('a colour the component does not draw stays an override', other.background === 'color/blue');
  // a variant back at the component's own colour, over a base that overrides it, says so (null), else it keeps the base's;
  // and a variant that swaps the component is held to the one it swaps to (review)
  const back = { kind: 'instance', component: 'Slot', background: 'color/blue' }, bv = [{ when: { hover: true }, set: { 'slotChildren.background': 'color/magenta' } }];
  dropOwnGlyph('slotChildren', back, bv, mains);
  const warn = { component: 'Warn', props: {}, variants: [], anatomy: { root: { kind: 'container' }, g: { kind: 'graphic', parent: 'root', background: 'color/red' } } };
  const sw = { kind: 'instance', component: 'Slot' }, sv = [{ when: { error: true }, set: { 'slotChildren.component': 'Warn', 'slotChildren.background': 'color/magenta' } }, { when: { error: true, x: true }, set: { 'slotChildren.component': 'Warn', 'slotChildren.background': 'color/red' } }];
  dropOwnGlyph('slotChildren', sw, sv, byComponentName([slot, warn]));
  ok('a variant back at the component\'s own colour says null over an overriding base; a swap is held to the component it swaps to',
    back.background === 'color/blue' && bv[0].set['slotChildren.background'] === null
    && sv[0].set['slotChildren.background'] === 'color/magenta' && !('slotChildren.background' in sv[1].set));
}
// a placed instance's own styling is what the component read writes on it: a rule that reaches the instance through the
// component's root (to-code's `.toggle > … > .toggle__item`), never one of the instance's own sheet (`.toggle-item`,
// `.toggle-item:where([data-state="read only"])`), which is that component's drawing (a library's dropdown read a menu
// list's firstOnTop, a tag's pull-back gap, as overrides on every holder)
{
  const parts = selectorParts('.toggle:where([data-state="read only"]) > .a  .b, .c:is(.d, .e)~.f');
  ok('a selector list splits at the top level into selectors and their compounds, never inside brackets or quotes',
    parts.length === 2 && parts[0].compounds.join('|') === '.toggle:where([data-state="read only"])|.a|.b' && parts[1].text === '.c:is(.d, .e)~.f' && parts[1].compounds.length === 2);
  // a stand-in page: the root matches `.toggle` and its state; the instance `.toggle-item` and its part class
  const el = { matches: (q) => ['.toggle-item', '.toggle__item', '.toggle > .toggle__item', '.toggle-item:where([data-state="read only"])', '.toggle:where([data-on]) > .toggle__item'].includes(q) };
  const root = { matches: (q) => ['.toggle', '.toggle:where([data-on])'].includes(q) };
  const was = globalThis.document; globalThis.document = { querySelector: (q) => (q === 'el' ? el : q === 'root' ? root : null) };
  const by = (sel) => writtenByHolder(selectorParts(sel), 'el', 'root');
  ok('a rule reaching the instance through the component read is its override; the instance\'s own sheet\'s is not',
    by('.toggle > .toggle__item') && by('.toggle:where([data-on]) > .toggle__item') && !by('.toggle-item') && !by('.toggle-item:where([data-state="read only"])') && !by('.other > .toggle__item'));
  globalThis.document = was;
  ok('every field a placed instance\'s styling is read into names the CSS it is read from', ['background', 'layout', 'radius', 'border', 'shadow', 'overflow'].every((f) => INSTANCE_CSS[f] && INSTANCE_CSS[f].length));
  // (its opacity too: one this component writes on it is read, one the placed component's own sheet gives it is not)
  ok('a placed instance\'s opacity is read from its opacity, asked whose rule wrote it like the rest', JSON.stringify(INSTANCE_CSS.opacity) === '["opacity"]');
  // (and its outline: css.mjs draws an outside or centred stroke as one, so this component's outline on it is its stroke;
  // one through the ring knob is to-code's focus ring, never a stroke)
  const { ringKnobbed } = await import('./from-code.mjs');
  ok('a placed instance\'s outline is read as its own stroke where this component writes it, never through the ring knob',
    INSTANCE_CSS.ownOutline.includes('outline') && ringKnobbed('var(--ds-ring, 2px solid var(--focus))') && ringKnobbed('var( --ring ,2px)') && !ringKnobbed('1px solid var(--transparent)') && !ringKnobbed('1px solid var(--ring-colour)') && !ringKnobbed(null));
}
{ // a part code centres reads back both edges as measured, as derive.cjs writes a centred part's: (x - end) / 2 its centre's offset
  const { centredEdges } = await import('./from-code.mjs');
  const at = centredEdges({ x: 8.3, y: 9.75 }, { horizontal: 'center', vertical: 'center' }, { x: 8.3, y: 9.75, end: 7.7, bottom: 10.25 });
  const pinnedEnd = centredEdges({ x: 2, y: 0, end: 4 }, { horizontal: 'center', vertical: 'min' }, { x: 2, y: 0, end: 6, bottom: 3 });
  ok('a centred part keeps its far edges as measured; a far edge the CSS says stays; a part pinned to an edge gains none', at.end === 7.7 && at.bottom === 10.25 && pinnedEnd.end === 4 && pinnedEnd.bottom === undefined);
}
// the reading reads every combination of five props or more the design draws, as the round trip compares them all: a library's
// square extra-small icon button needs five props off default, and was only predicted from the layers, wrongly
{ const { combinationsToRead } = await import('./from-code.mjs');
  const keys = ['a', 'b', 'c', 'd', 'e', 'f'], vals = () => [true];
  const all = combinationsToRead(keys, vals, () => true), none = combinationsToRead(keys, vals, () => false), code = combinationsToRead(keys, vals);
  const sizes = (l) => l.map((x) => x.length).sort().join();
  ok('after the pairs and triples: every four-prop combination, and every larger one the design draws; a reading only in code stops at four',
    sizes(all) === [...Array(15).fill(4), ...Array(6).fill(5), 6].join() && sizes(none) === Array(15).fill(4).join() && sizes(code) === sizes(none)
    && combinationsToRead(keys, vals, (l) => !l.some(([k]) => k === 'f')).filter((x) => x.length > 4).map((x) => x.map(([k]) => k).join('')).join() === 'abcde'); }
// every combination of five props or more the design draws is read, none predicted: the round trip counts a predicted
// one as not the same (eval.mjs isSame), and one whose props build no layer together was still a guess (a library's
// checkbox left 1,360 unread)
{ const { readCombinations } = await import('./from-code.mjs');
  const L = (s) => s.split('').map((k) => [k, true]);
  const seen = [];
  const got = await readCombinations([L('cdefg'), L('abdef'), L('abde'), L('abcde')], async (l) => { seen.push(l.map(([x]) => x).join('')); return false; });
  ok('every combination is read, fewest props first, whether or not three of its props build a layer; none is left unread',
    seen.join() === 'abde,cdefg,abdef,abcde' && got.read === 4 && got.skipped === undefined); }
{ // an instance the design keeps whole, its glyph's place and constraints unstated as derive keeps none inside an instance
  // (a library's Status notification in a slider's error state), is kept whole by the reading: the reading's cut drops that
  // glyph as its component's, so it is one that cut drops something from; one the design keeps a different glyph in is not
  const { wholeHosts } = createRequire(import.meta.url)('./derive.cjs');
  const { wholeHosts: viaRoundTrip } = await import('./to-figma.mjs');
  const mains = byComponentName([{ component: 'Status', figma: { key: 'k' }, props: {}, anatomy: { root: { kind: 'container', width: 16, height: 16 },
    fill: { kind: 'graphic', parent: 'root', width: 8, height: 10, absolute: { x: 4, y: 3 }, constraints: { horizontal: 'scale', vertical: 'scale' }, background: 'C/w' } }, variants: [] }]);
  const design = (bg) => ({ props: {}, anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Status', key: 'k', width: 16, height: 16 },
    'i/fill': { kind: 'graphic', parent: 'i', width: 8, height: 10, background: bg } }, variants: [] });
  ok('an instance whose kept glyph is its component\'s but for place and constraints is kept whole; one with a glyph of its own is not',
    wholeHosts(design('C/w'), mains).has('i') && !wholeHosts(design('C/x'), mains).has('i') && !wholeHosts(null, mains).size);
  ok('roundTrip fills by the same instances kept whole as the reading keeps (one source)', viaRoundTrip(design('C/w'), mains).has('i'));
}
{ // the layers a design states a colour for: a background in its base or a variant's add, or a variant's set of one
  const { colouredIn } = await import('./from-code.mjs');
  const c = colouredIn({ anatomy: { a: { background: 'C/1' }, b: {} }, variants: [{ when: {}, add: { c: { background: 'C/2' } }, set: { 'd.background': 'C/3', 'e.background': null, 'b.radius': 4 } }] });
  ok('a design\'s coloured layers: base, add and set, never a set to none', [...c].sort().join() === 'a,c,d' && !colouredIn(null).size);
}
// the reading's set of parts whose background lays a layer over the colour (`layered`) is one name in the reading: a
// second declared later in the same scope (the five-prop pruning's combination keys) threw before its line wherever a
// render lost a layer (a library's horizontal card and mobile gallery, log14) and was asked in place of the first
{
  // a placed component drawing no stroke where its component's root has one reads back as the stroke cleared, `none`
  // (rules.mjs CLEARED, as to-code writes it); one whose component draws none, or one drawing a stroke, reads nothing
  const B = { component: 'Box', props: {}, anatomy: { root: { kind: 'container', border: { color: 'Line/strong', width: 1 } } }, variants: [] };
  const P = { component: 'Plain', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] };
  const mains = (n) => (n === 'Box' ? B : n === 'Plain' ? P : null);
  const a = readCleared({ root: { kind: 'container' }, b: { kind: 'instance', component: 'Box', strokeless: true }, p: { kind: 'instance', component: 'Plain', strokeless: true }, s: { kind: 'instance', component: 'Box', border: { color: 'x', width: 1 } }, g: { kind: 'graphic', strokeless: true } }, mains);
  ok('a placed component drawing no stroke its component draws reads as the stroke cleared; nothing else does, and the mark is gone',
    a.b.border === 'none' && a.p.border === undefined && a.s.border.color === 'x' && !Object.values(a).some((x) => 'strokeless' in x));
  const src = (await import('node:fs')).readFileSync(new URL('./from-code.mjs', import.meta.url), 'utf8');
  ok('…its stroke read as drawn, before its outline is left to its component', src.includes("boxStyling(ie, bx); if (!ie.border && !ie.outline && !ie.ownOutline) ie.strokeless = true;")
    && src.includes('readCleared(anatomy, mainOf, L.value); normalForm(anatomy); colourKept('));
  ok('…and a part Figma says cleared that code draws nothing for is the same: both draw nothing',
    src.includes("if (verdict === 'differs' && f[fid][k] === CLEARED && cv == null && (k === 'background' || k === 'border')) verdict = 'same token';"));
  // its fill likewise, only where the page paints it clear (fillless): a fill merely unread says nothing
  const F = { component: 'Card', props: {}, anatomy: { root: { kind: 'container', background: 'Bg/card' } }, variants: [] };
  const f = readCleared({ root: { kind: 'container' }, c: { kind: 'instance', component: 'Card', fillless: true }, u: { kind: 'instance', component: 'Card', strokeless: true }, k: { kind: 'instance', component: 'Card', fillless: true, background: 'Bg/other' } }, (n) => (n === 'Card' ? F : null));
  const S = { component: 'Pop', props: {}, anatomy: { root: { kind: 'container', shadow: 'Shadows/Menu' } }, variants: [] };
  const sh = readCleared({ root: { kind: 'container' }, a: { kind: 'instance', component: 'Pop', shadowless: true }, b: { kind: 'instance', component: 'Pop' } }, (n) => (n === 'Pop' ? S : null));
  { const { shadowOnlyRings, clearValue } = await import('./from-code.mjs');
    ok('a box-shadow of stroke rings alone is no shadow; a blurred one is',
      shadowOnlyRings('none') && shadowOnlyRings('rgb(0, 0, 0) 0px 0px 0px 1px inset') && shadowOnlyRings('rgb(1, 2, 3) 0px -1px 0px 0px inset, rgb(1, 2, 3) 0px 1px 0px 0px inset')
      && !shadowOnlyRings('rgba(0, 0, 0, 0.3) 0px 2px 6px 0px') && !shadowOnlyRings('rgb(0, 0, 0) 4px 4px 0px 0px') && !shadowOnlyRings('rgb(0, 0, 0) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.3) 0px 2px 6px 0px'));
    ok('a colour value is clear by its alpha only: an opaque rgb with a 0 channel is not',
      ['transparent', '#0000', '#00000000', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.0)', 'rgb(0 0 0 / 0)', 'rgba(0,0,0,0%)', 'oklch(0 0 0 / 0)', 'color(srgb 0 0 0 / 0)'].every(clearValue)
      && !['rgb(255, 0, 0)', 'rgb(10, 20, 0)', '#ff0000', 'rgba(0,0,0,0.5)', 'rgb(0 0 0 / 50%)'].some(clearValue)); }
  ok('a placed component drawing no shadow its component draws reads as the shadow cleared; one unread says nothing',
    sh.a.shadow === 'none' && sh.b.shadow === undefined && !('shadowless' in sh.a) && src.includes('if (shadowOnlyRings(cs.boxShadow)) ie.shadowless = true;'));
  ok('a placed component painting clear where its component has a fill reads as the fill cleared; one unread, or painted, says nothing',
    f.c.background === 'none' && f.u.background === undefined && f.k.background === 'Bg/other' && !Object.values(f).some((x) => 'fillless' in x)
    && readCleared({ c: { kind: 'instance', component: 'Card', fillless: true } }, () => F, (t) => (t === 'Bg/card' ? 'rgba(0, 0, 0, 0)' : undefined)).c.background === undefined
    && src.includes("if (clear(cs.backgroundColor) && cs.backgroundImage === 'none') ie.fillless = true;"));
}
{
  // a placed component computing no clip where its component's root clips reads back as the clip stopped, `visible`
  // (rules.mjs UNCLIPPED, as css.mjs writes it); one whose component does not clip, or one that clips, reads nothing of it
  const C = { component: 'Card', props: {}, anatomy: { root: { kind: 'container', overflow: 'hidden' } }, variants: [] };
  const P = { component: 'Plain', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] };
  const a = readCleared({ root: { kind: 'container' }, c: { kind: 'instance', component: 'Card', clipless: true }, p: { kind: 'instance', component: 'Plain', clipless: true }, h: { kind: 'instance', component: 'Card', overflow: 'hidden' } }, (n) => (n === 'Card' ? C : n === 'Plain' ? P : null));
  const src = (await import('node:fs')).readFileSync(new URL('./from-code.mjs', import.meta.url), 'utf8');
  ok('a placed component computing no clip its component draws reads as the clip stopped; nothing else does, and the mark is gone',
    a.c.overflow === 'visible' && a.p.overflow === undefined && a.h.overflow === 'hidden' && !Object.values(a).some((x) => 'clipless' in x)
    && src.includes("if (cs.overflow === 'visible') ie.clipless = true;"));
}
{
  // a placed component computing no blend where its component's root blends reads back as the blend set back, `normal`
  // (rules.mjs UNBLENDED, as css.mjs writes it); one whose component does not blend reads nothing of it
  const C = { component: 'Item', props: {}, anatomy: { root: { kind: 'container', blend: 'darken' } }, variants: [] };
  const P = { component: 'Plain', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] };
  const a = readCleared({ root: { kind: 'container' }, c: { kind: 'instance', component: 'Item', blendless: true }, p: { kind: 'instance', component: 'Plain', blendless: true }, d: { kind: 'instance', component: 'Item' } }, (n) => (n === 'Item' ? C : n === 'Plain' ? P : null));
  const src = (await import('node:fs')).readFileSync(new URL('./from-code.mjs', import.meta.url), 'utf8');
  ok('a placed component computing no blend its component draws reads as the blend set back; nothing else does, and the mark is gone',
    a.c.blend === 'normal' && a.p.blend === undefined && a.d.blend === undefined && !Object.values(a).some((x) => 'blendless' in x)
    && src.includes("if (cs.mixBlendMode === 'normal') ie.blendless = true;"));
}
{
  // a reading of a page whose Box, placed in a Holder that stops its clip, clips again: said hidden, as derive says it of a
  // drawing; unsaid, it would read as the Holder's visible. One still unclipped is the Holder's own
  const { colourKept } = await import('./from-code.mjs');
  const B = { contract: 1, component: 'Box', props: {}, anatomy: { root: { kind: 'container', overflow: 'hidden' } }, variants: [] };
  const H = { contract: 1, component: 'Holder', props: {}, anatomy: { root: { kind: 'container' }, box: { kind: 'instance', parent: 'root', component: 'Box', overflow: 'visible' } }, variants: [] };
  const mains = byComponentName([B, H]);
  const read = (box) => colourKept({ add() {} }, { root: { kind: 'container' }, holder: { kind: 'instance', parent: 'root', component: 'Holder' }, 'holder/box': { kind: 'instance', parent: 'holder', component: 'Box', ...box } }, mains, { reading: true });
  ok('a reading of a Box its holder stops clipping, clipping again, says hidden; one still unclipped is left to the holder',
    read({ overflow: 'hidden' })['holder/box'].overflow === 'hidden' && !('holder/box' in read({ overflow: 'visible' })));
}
{ const src = (await import('node:fs')).readFileSync(new URL('./from-code.mjs', import.meta.url), 'utf8');
  ok('the reading declares its layered set once', (src.match(/\b(const|let|var)\s+layered\b/g) || []).length === 1); }
// the self page (site.mjs selfSiteFiles, from-code's render): what it serves and when it loads again
{ const { pageReusable } = await import('./from-code.mjs');
  const at = (w, count) => { globalThis.window = w; globalThis.document = { body: { childElementCount: count } }; try { return pageReusable(); } finally { delete globalThis.window; delete globalThis.document; } };
  ok('the self page takes the next render after a forced pointer state without loading again (each reload cost about 1.5 s), and loads again where a read left anything outside its stage or it is not ready',
    at({ ready: true, bodyAt: 1, forced: true }, 1) && !at({ ready: true, bodyAt: 1 }, 2) && !at({ bodyAt: 1 }, 1)); }
{ const { customProperties, reachedTokens } = await import('./site.mjs');
  // several on a line, a string holding `;`, a comment holding `}` and a var(), brackets holding `;`, the last with no `;`
  const css = ':root { --a: 1px; --s: "x;y"; /* } var(--gone) */ --f: fn(a;b) ; color: red; --last: var(--a) }\n@media screen { [data-t="d"] { --a: 2px;--b:var( --c , var(--d));} }';
  const got = customProperties(css).map((d) => `${d.name}=${d.value}`);
  ok('a sheet\'s custom properties are read by a scanner: several on one line, a `;` in a string or brackets, a comment, no `;` before the `}`',
    JSON.stringify(got) === JSON.stringify(['--a=1px', '--s="x;y"', '--f=fn(a;b)', '--last=var(--a)', '--a=2px', '--b=var( --c , var(--d))']));
  const cut = reachedTokens(css, '.x { color: var(--last) } .y { gap: var(--b) }');
  ok('only the tokens the served sheets reach are kept, followed through each kept value\'s own var()s at any depth and in every block that sets them; every other statement as written',
    JSON.stringify(customProperties(cut).map((d) => d.name)) === JSON.stringify(['--a', '--last', '--a', '--b']) && cut.includes('color: red') && cut.includes('/* } var(--gone) */') && cut.includes('@media screen { [data-t="d"] {') && !cut.includes('--s') && !cut.includes('--f'));
  const odd = ':root { --c /* note */ : var(--e); --é: 1px; --q: "open\n--r: 2px; body { font: var(--t) } --t: 3px; --u: 4px; }';
  ok('a comment before the colon, a name past ASCII and a string left open at the line\'s end (it ends there, its declaration running on to the next `;`) are read as CSS reads them',
    JSON.stringify(customProperties(odd).map((d) => d.name)) === JSON.stringify(['--c', '--é', '--q', '--t', '--u']) && customProperties(odd)[2].value.endsWith('--r: 2px'));
  ok('a token the sheet itself names outside a custom property (`font: var(--t)`) is kept, as is one a var() names past ASCII',
    JSON.stringify(customProperties(reachedTokens(odd, 'var(--é)')).map((d) => d.name)) === JSON.stringify(['--é', '--t']));
  ok('a sheet reaching nothing keeps no token, and one reaching all keeps the sheet as it was', customProperties(reachedTokens(css, '')).length === 0 && reachedTokens(css, 'var(--s) var(--f) var(--last) var(--b) var(--c) var(--d)') === css); }
{ const fs = await import('node:fs'), path = await import('node:path');
  const { selfSiteFiles, siteFiles, serveSite } = await import('./site.mjs');
  // (a browser's spare connection, opened and never asked anything: Node 22 waits on it forever, and CI timed out at 30 min)
  { const site = await serveSite({}), net = await import('node:net'), spare = net.connect(+new URL(site.url).port, '127.0.0.1').on('error', () => {});
    await new Promise((r) => spare.on('connect', r)); await new Promise((r) => setTimeout(r, 100));
    const shut = await Promise.race([site.close().then(() => true), new Promise((r) => setTimeout(r, 3000, false))]);
    spare.destroy();
    ok('the self page\'s server closes with a connection still open that sent no request', shut); }
  const { cssName: nameOf } = await import('../tokens/names.mjs');
  const SAMPLE = new URL('../contract-editor/sample/', import.meta.url).pathname, DIR = path.join(SAMPLE, 'components');
  const library = Object.fromEntries(fs.readdirSync(DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map(({ name: f }) => { const c = JSON.parse(fs.readFileSync(path.join(DIR, f, 'contract.json'), 'utf8')); return [c.component, { ...c, folder: f }]; }));
  const files = selfSiteFiles(library, 'contact-card', { tokensCss: ':root { --x: 1px }' });
  ok('the self page serves the component and the components it places, and no other', Object.keys(files).filter((f) => f.startsWith('components/') && f !== 'components/dom.js').sort().join() === 'components/avatar/avatar.js,components/contact-card/contact-card.js' && !/ds-button/.test(files['all.css']));
  // the sample's tokens, every one set through an alias of its own (a var() chain), several declarations on each line, with
  // tokens nothing reads: the reading must be the same on the whole page and on the cut one
  const tokens = JSON.parse(fs.readFileSync(path.join(SAMPLE, 'tokens.json'), 'utf8'));
  const vars = [];
  for (const col of Object.values(tokens.collections)) for (const [name, v] of Object.entries(col.values[col.modes[0]])) { const c = nameOf('', name); vars.push(`${c}: var(${c}-raw);`, `${c}-raw: ${typeof v === 'number' ? (/opacity/i.test(name) ? v : `${v}px`) : v};`, `${c}-unread: var(${c}-raw);`); }
  for (const t of tokens.textStyles) { const b = nameOf('', t.name); vars.push(`${b}-font-family: ${t.family};`, `${b}-font-size: ${t.size}px;`, `${b}-font-weight: ${t.weight};`, `${b}-line-height: ${t.lineHeight}px;`, `${b}-letter-spacing: ${t.letterSpacing}px;`); }
  const lines = []; for (let i = 0; i < vars.length; i += 4) lines.push(vars.slice(i, i + 4).join(' '));
  // (and a rule on an ancestor's pointer state, so a forced state that outlived its render would show in the next)
  const tokensCss = `:root {\n${lines.join('\n')}\n}\n#stage:hover section * { color: rgb(1, 2, 3) }`;
  const { findChrome, launch, newPage, attach, navigate, waitFor, call, forceState } = await import('../shared/cdp.mjs');
  if (!fs.existsSync(findChrome())) ok('Chrome is here to read the self page in (none found: install Chrome, the toolkit\'s one browser)', false);
  else {
    const { authoredVars, authoredValue, authoredSelector, layerVars } = await import('../parity/external.mjs');
    const { propsOf } = await import('./to-markup.mjs');
    const browser = await launch({});
    // what a reading takes of each element: its computed style whole (but the custom properties, which the cut page sets
    // fewer of and no reading enumerates), and for every property its authored value, the custom properties it was
    // written with, its rule's selector and its ::after's, from Chrome's matched styles
    const readNow = async (tab) => {
      const count = await call(tab, () => document.querySelectorAll('#stage *').length);
      const out = [];
      for (let i = 0; i < count; i++) {
        const props = await call(tab, (k) => { document.querySelectorAll('[data-r]').forEach((x) => x.removeAttribute('data-r')); const el = document.querySelectorAll('#stage *')[k]; el.setAttribute('data-r', ''); const s = getComputedStyle(el); return [...s].filter((p) => !p.startsWith('--')).map((p) => [p, s.getPropertyValue(p)]); }, i);
        const styles = new Map(), authored = [];
        for (const [p] of props) authored.push(await authoredValue(tab, '[data-r]', p, styles), await authoredVars(tab, '[data-r]', p, styles), await authoredSelector(tab, '[data-r]', p, styles));
        authored.push(await authoredVars(tab, '[data-r]', 'outline::after', styles), await layerVars(tab, '[data-r]', 'box-shadow', styles));
        out.push([props, authored]);
      }
      return JSON.stringify(out);
    };
    const render = (tab, folder, args) => call(tab, ([f, a]) => { const s = document.createElement('section'); s.append(window.R[f](a)); document.getElementById('stage').replaceChildren(s); return document.fonts.ready.then(() => true); }, [folder, args]);
    const open = async (served) => { const site = await serveSite(served), tab = await attach(await newPage(browser.endpoint)); await navigate(tab, `${site.url}index.html`); await waitFor(tab, '!!window.ready', { timeout: 10000 }); return { tab, close: async () => { tab.close(); await site.close(); } }; };
    // each component at its defaults and at every other value of each of its props, one at a time
    const rendersOf = (c) => [{}, ...propsOf(c, library).flatMap((x) => (x.type === 'enum' ? (x.values || []).filter((v) => v !== x.default).map((v) => ({ [x.name]: v })) : x.type === 'boolean' ? [{ [x.name]: !x.default }] : []))];
    try {
      // a placed select as the walker meets it, its layers found as a reading finds them (the writer's selectors by id): its
      // caret first; then a nested copy's layers; then its own, another swap's among them, its two texts under one stored path
      { const { glyphsDrawn, glyphSwaps, ownLayer, partsById, swappedLayers } = await import('./from-code.mjs');
        const pick = { contract: 1, component: 'Pick', folder: 'pick', props: { o: { type: 'instance', figma: 'Options', swaps: ['late', 'early', 'shared'] }, b: { type: 'instance', figma: 'Badge', swaps: ['shared'] } },
          anatomy: { root: { kind: 'container' }, value: { kind: 'text', parent: 'root', name: 'Value' }, valueTyped: { kind: 'text', parent: 'root', name: 'Value' },
            shared: { kind: 'instance', parent: 'root', swappedBy: 'b' }, early: { kind: 'instance', parent: 'root', swappedBy: 'o' }, late: { kind: 'instance', parent: 'root', swappedBy: 'o' } }, variants: [] };
        const { selfMapping } = await import('./site.mjs'), stored = selfMapping(pick, { library: { ...library, Pick: pick } });
        const parts = partsById(() => stored, '#stage'), sels = swappedLayers(pick, { partsOf: () => null, swapPartsOf: () => parts }, 'pick');
        ok('a placed component\'s swapped layers are found by id where two parts share a stored path, and none for a contract that cannot be drawn', Object.keys(stored.layers).filter((k) => /Value/.test(k)).length === 1 && parts.value !== parts.valueTyped && ['late', 'early', 'shared'].every((l) => sels[l]) && partsById(() => selfMapping(null, { library }), '#stage') === null);
        ok('a governed reading, which has no writer\'s ids, takes no swapped layers: the first glyph drawn stands there',
          Object.keys(swappedLayers(pick, { partsOf: () => parts }, 'pick')).length === 0);
        const p = await open(selfSiteFiles(library, 'contact-card', { tokensCss }));
        try {
          const got = await call(p.tab, ([drawnSrc, ownSrc, sels]) => {
            const el = (id, icon) => { const m = sels[id].match(/\[data-part="?([^"\]]+)"?\]/g).pop(); return `<i ${m.slice(1, -1)} data-icon="${icon}"></i>`; };
            document.getElementById('stage').innerHTML = `<ds-pick><i data-icon="Caret"></i><i><ds-pick>${el('late', 'Dot')}</ds-pick></i>${el('shared', 'Flag')}${el('early', 'Home')}${el('late', 'Away')}</ds-pick>`;
            return new Function(`return ${drawnSrc}`)()(document.querySelector('ds-pick'), { ...sels, absent: '#stage ds-pick > [data-part="none"]' }, null, (n) => n.localName === 'ds-pick', new Function(`return ${ownSrc}`)());
          }, [glyphsDrawn.toString(), ownLayer.toString(), sels]);
          ok('a swap takes the first glyph drawn in the layers it drives: no nested copy\'s, no other swap\'s, not the caret; a layer not found says nothing',
            JSON.stringify(glyphSwaps(pick, {}, got.glyphs, got.layerGlyphs)) === '[["Options","Home"],["Badge","Flag"]]' && got.layerGlyphs.map(([l]) => l).join() === 'shared,early,late');
        } finally { await p.close(); } }
      const differ = [], bled = [];
      let cut = 0, whole = 0, renders = 0;
      for (const c of Object.values(library)) {
        const self = selfSiteFiles(library, c.folder, { tokensCss }), all = siteFiles(library, { tokensCss });
        cut += self['all.css'].length; whole += all['all.css'].length;
        const a = await open(self), b = await open(all);
        try {
          for (const args of rendersOf(c)) {
            renders++;
            await render(a.tab, c.folder, args); await render(b.tab, c.folder, args);
            if ((await readNow(a.tab)) !== (await readNow(b.tab))) differ.push(`${c.folder} ${JSON.stringify(args)}`);
          }
          // a render after one that forced hover and focus on the root and every ancestor, let go as from-code's render
          // lets it go (the document fetched again) with no reload, reads as the same render on a page just loaded
          await render(a.tab, c.folder, {});
          await forceState(a.tab, [{ selector: '#stage section > *', pseudo: 'hover' }, { selector: '#stage section > *', pseudo: 'focus-visible' }]);
          await a.tab.send('DOM.getDocument', { depth: 0 });
          const last = rendersOf(c).at(-1);
          await render(a.tab, c.folder, last);
          const fresh = await open(self);
          try { await render(fresh.tab, c.folder, last); if ((await readNow(a.tab)) !== (await readNow(fresh.tab))) bled.push(c.folder); } finally { await fresh.close(); }
        } finally { await a.close(); await b.close(); }
      }
      if (differ.length) console.error('differ:', differ.join('; '));
      ok(`every sample component reads the same on the cut self page as on the whole library's (cache off), at its defaults and every other value of each prop (${renders} renders), aliased tokens several to a line; ${Math.round(100 * cut / whole)}% of the sheet served`, differ.length === 0 && renders > Object.keys(library).length && cut < whole / 2);
      ok('a render after one that forced hover and focus, let go with no reload, reads as the same render on a page just loaded', bled.length === 0);
      if (bled.length) console.error('bled:', bled.join());
    } finally { await browser.close(); }
  }
}

// 2026-11-22: a same component stays same, and the reading says what code draws: a text in its style says the style
// alone, one in none its spacing, case and decoration, whatever a design says of that layer (held to the design, the
// reading lost what code drew)
{ const t = { size: 12, lineHeight: 16, weight: 'regular', italic: false, family: 'Inter', own: { 'letter-spacing': '1px', 'text-transform': 'uppercase', 'font-variant-caps': 'normal', 'text-decoration-line': 'underline' } };
  const at = (...o) => Object.keys(typedText(t, ...o).fields).join();
  ok('a text drawn in its style stays that style alone; one in none says the spacing, case and decoration code draws, a styled design\'s too',
    at({ styles: [{ name: 'Body/sm', size: 12, lineHeight: 16 / 12, weight: 'Regular', family: 'Inter' }] }) === 'typography'
    && at({ design: { w: { kind: 'text', typography: 'Body/sm' } }, id: 'w' }) === 'typography,letterSpacing,textCase,textDecoration');
}

// 2026-11-26: a stroke across the edge goes round at 1px: Chrome computes its outline offset snapped as a border width
// (calc(1px / -2) reads -1px, as an inside one would), so the reader takes the offset as written, resolved where it is
{ const fs = await import('node:fs');
  const { findChrome, launch, newPage, attach, navigate, call } = await import('../shared/cdp.mjs');
  ok('an outline offset snaps as a border width: under 1px up to 1px, larger down to whole px, the sign kept', snappedOffset(-0.5) === -1 && snappedOffset(-1.5) === -1 && snappedOffset(-2) === -2 && snappedOffset(0) === 0 && snappedOffset(0.4) === 1);
  if (!fs.existsSync(findChrome())) ok('Chrome is here to resolve a written length in (none found: install Chrome, the toolkit\'s one browser)', false);
  else {
    const browser = await launch({});
    try {
      const tab = await attach(await newPage(browser.endpoint));
      await navigate(tab, 'http://round-trip.test/', { html: '<!doctype html><style>i { font-size: 40px }</style><div id="s" style="--w: 1px; font-size: 10px; outline: var(--w) solid red; outline-offset: calc(var(--w) / -2)"></div>' });
      const computed = await call(tab, () => getComputedStyle(document.getElementById('s')).outlineOffset);
      const said = await call(tab, lengthAt, ['#s', 'calc(var(--w) / -2)']), none = await call(tab, lengthAt, ['#s', 'auto']), kw = await call(tab, lengthAt, ['#s', 'inherit']);
      const em = await call(tab, lengthAt, ['#s', '-0.05em']);
      ok('a 1px stroke across the edge computes a snapped offset, and its written one resolves to the half pixel it says', computed === '-1px' && said === -0.5 && snappedOffset(said) === -1 && none === null && kw === null && em === -0.5, `${computed} ${said} ${none} ${kw} ${em}`);
    } finally { await browser.close(); }
  }
}
// 2026-11-22: a text with no style goes round as itself: css.mjs writes its values, spacing, case and decoration, and
// the reader's own two halves (textTypeOf in the page, typedText after it) read them back as the contract said them
{ const fs = await import('node:fs');
  const { findChrome, launch, newPage, attach, navigate, call } = await import('../shared/cdp.mjs');
  const { declarations } = await import('./css.mjs');
  const { weightName } = await import('../parity/values.mjs');
  if (!fs.existsSync(findChrome())) ok('Chrome is here to read a literal text in (none found: install Chrome, the toolkit\'s one browser)', false);
  else {
    const browser = await launch({});
    try {
      const tab = await attach(await newPage(browser.endpoint));
      const WEIGHT = Object.fromEntries([100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((w) => [w, weightName(w)]));
      const cssOf = (c) => declarations({ kind: 'text', ...c }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] }).decls.map(([p, v]) => `${p}: ${v}`).join('; ');
      const cases = [{ typography: 'literal 12/18 semibold italic Inter', letterSpacing: 0.16, textCase: 'upper', textDecoration: 'underline' }, { typography: 'literal 14/0 regular IBM Plex Sans', letterSpacing: 0.28, textCase: 'small_caps' },
        { typography: 'literal 14/20 regular sans-serif' }, { typography: 'literal 16/24 bold "serif"' }];
      // (the second written by code in em, as css.mjs never writes a share whose size it knows: the design's px all the same)
      const written = cases.map((c, i) => (i === 1 ? { ...c, letterSpacing: '2%' } : c));
      const host = 'font-style: italic; letter-spacing: 2px; text-transform: uppercase; font-variant-caps: small-caps';
      const read = async (body) => {
        await navigate(tab, 'http://round-trip.test/', { html: `<!doctype html>${body}` });
        const types = await call(tab, ([src, W]) => { const typeOf = new Function(`return ${src}`)(); return [...document.querySelectorAll('[data-t]')].map((n) => typeOf(n, getComputedStyle(n), W)); }, [textTypeOf.toString(), WEIGHT]);
        return types.map((t) => typedText(t).fields);
      };
      const got = await read(`<style>${written.map((c, i) => `#t${i} { ${cssOf(c)} }`).join(' ')}</style><div style="${host}">${cases.map((_, i) => `<span id="t${i}" data-t>Hi</span>`).join('')}</div>`);
      const deco = await read('<div style="text-decoration: underline">'
        + ['', 'display: block', 'display: inline-block', 'position: absolute', 'float: left', 'display: block; text-decoration: line-through'].map((css) => `<span style="${css}" data-t>Hi</span>`).join('') + '</div>'
        + '<div style="display: flex; text-decoration: underline"><span style="display: inline-block" data-t>Hi</span></div>');
      const lines = deco.map((f) => f.textDecoration || '-').join();
      ok('an ancestor\'s underline is read where CSS draws it on the text (CSS Text Decoration 3 §2): in the flow, a flex item too, never out of it or inside an inline block',
        lines === 'underline,underline,-,-,-,underline,underline', lines);
      ok('a text with no style reads back from Chrome, by the reader itself, as css.mjs wrote it, whatever its host is: its values, spacing, case and decoration', JSON.stringify(got) === JSON.stringify(cases), JSON.stringify(got));
    } finally { await browser.close(); }
  }
}
// 2026-11-27: a text set in a taller box goes round with its vertical alignment: css.mjs writes it (align-content on
// the text's block box), Chrome draws the words there, and the reader (alignedOf, in the page) reads it back; a text cut
// to lines, a box CSS cannot align its words in, stays said as unread; one at the top writes and reads nothing
{ const fs = await import('node:fs');
  const { findChrome, launch, newPage, attach, navigate, call } = await import('../shared/cdp.mjs');
  const { declarations } = await import('./css.mjs');
  const dec = (c) => declarations({ kind: 'text', typography: 'literal 10/10 regular sans-serif', autoResize: 'none', height: 40, ...c }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] });
  const cssOf = (c) => dec(c).decls.map(([p, v]) => `${p}: ${v}`).join('; ');
  ok('a text in a taller box: its vertical alignment written, never said unread; one cut to lines said unread',
    /align-content: center/.test(cssOf({ verticalAlign: 'center' })) && /align-content: end/.test(cssOf({ verticalAlign: 'end' })) && !/align-content/.test(cssOf({ verticalAlign: 'start' }))
    && !dec({ verticalAlign: 'center' }).unread.length && dec({ verticalAlign: 'center', maxLines: 2 }).unread.some((u) => /verticalAlign/.test(u)));
  if (!fs.existsSync(findChrome())) ok('Chrome is here to read a text\'s vertical alignment in (none found: install Chrome, the toolkit\'s one browser)', false);
  else {
    const browser = await launch({});
    try {
      const tab = await attach(await newPage(browser.endpoint));
      const cases = ['center', 'end', 'start'];
      // (then boxes the reader must measure, not echo: align-content said where no spare height shows it, where a flex
      // box ignores it, on an inline box that has no height; and words padded to the middle with nothing said)
      const odd = ['height: 10px; align-content: center', 'display: flex; height: 40px; align-content: center', 'display: inline; height: 40px; align-content: end', 'height: 20px; padding: 10px 0 10px; align-content: end; line-height: 10px; font-size: 10px', 'height: 40px; padding-top: 15px; box-sizing: border-box; line-height: 10px; font-size: 10px'];
      await navigate(tab, 'http://round-trip.test/', { html: `<!doctype html><div style="display: flex; flex-direction: column">${cases.map((v) => `<span data-t style="height: 40px; ${cssOf({ verticalAlign: v })}">Hi</span>`).join('')}${odd.slice(0, 2).map((css) => `<span data-t style="${css}">Hi</span>`).join('')}</div><span data-t style="${odd[2]}">Hi</span><div data-t style="${odd[3]}">Hi</div><div data-t style="${odd[4]}">Hi</div>` });
      const read = () => call(tab, (src) => { const of = new Function(`return ${src}`)(); return [...document.querySelectorAll('[data-t]')].map((n) => of(n, getComputedStyle(n)) ?? null); }, alignedOf.toString());
      const got = await read();
      ok('a text\'s vertical alignment is read where its words are drawn in its content box, never from the property: centre, bottom, top; none where no spare height, a flex box or an inline one shows nothing; within the content box, so padding is not alignment',
        JSON.stringify(got) === '["center","end",null,null,null,null,"end",null]', JSON.stringify(got));
      // (lines a tall line height spaces far past their glyphs, three at 40px over 12px words: counted by the lines drawn,
      // so a box that holds them exactly has no room, and one taller centres them; a box given its height by min-height,
      // and a flex item stretched to its row's height, are measured as any box)
      const three = 'display: block; width: 16px; font-size: 12px; line-height: 40px; align-content: center';
      await navigate(tab, 'http://round-trip.test/', { html: `<!doctype html><div data-t style="${three}; height: 120px">aa bb cc</div><div data-t style="${three}; height: 200px">aa bb cc</div>`
        + '<div data-t style="min-height: 60px; line-height: 10px; font-size: 10px; align-content: center">Hi</div>'
        + '<div style="display: flex; height: 40px"><span data-t style="line-height: 10px; font-size: 10px; align-content: center">Hi</span><span data-t style="line-height: 10px; font-size: 10px">Hi</span></div>' });
      const more = await read();
      // (and lines whose words sit at different tops, a bigger word, a smaller one and a raised one in the first: still two
      // lines, so a box of their height has no room and a taller one centres them)
      const mixed = 'display: block; width: 60px; font-size: 12px; line-height: 40px; align-content: center';
      await navigate(tab, 'http://round-trip.test/', { html: ['80px', '160px'].map((h) => `<div data-t style="${mixed}; height: ${h}">a<strong style="font-size: 16px">b</strong><span style="font-size: 9px">c</span><sup>d</sup> eeeeeeeeeee</div>`).join('') });
      const tops = await read();
      ok('words at different tops on one line are one line: a box of two lines\' height has no room, a taller one centres them',
        JSON.stringify(tops) === '[null,"center"]', JSON.stringify(tops));
      ok('three lines spaced past their glyphs fill a box of their height (no room) and centre in a taller one; min-height and a stretched flex item measured as any box',
        JSON.stringify(more) === '[null,"center","center","center",null]', JSON.stringify(more));
    } finally { await browser.close(); }
  }
}
// a blend an instance sets back goes round: css.mjs (through to-code's held instance) writes mix-blend-mode normal over
// its component's darken, Chrome computes it so, and the reader's mark and readCleared read back `normal` (rules.mjs
// UNBLENDED); the same instance with nothing said computes its component's darken and reads nothing
{ const fs = await import('node:fs');
  const { findChrome, launch, newPage, attach, navigate, call } = await import('../shared/cdp.mjs');
  if (!fs.existsSync(findChrome())) ok('Chrome is here to read a blend in (none found: install Chrome, the toolkit\'s one browser)', false);
  else {
    const browser = await launch({});
    try {
      const tab = await attach(await newPage(browser.endpoint));
      const naming = { kind: 'class', prefix: 'ds-', part: '__' };
      const item = { contract: 1, component: 'Item', props: {}, anatomy: { root: { kind: 'container', blend: 'darken' } }, variants: [] };
      const input = (said) => ({ contract: 1, component: 'Input', props: {}, anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', order: 0, component: 'Item', key: 'i1', ...said } }, variants: [] });
      const mains = (n) => (n === 'Item' ? { ...item, folder: 'item' } : null);
      const back = async (said) => {
        const css = toCss(item, 'item', { naming }) + toCss(input(said), 'input', { naming, mains });
        await navigate(tab, 'http://round-trip.test/', { html: `<!doctype html><style>${css}</style><div class="ds-input"><div class="ds-item ds-input__item">x</div></div>` });
        const mode = await call(tab, () => getComputedStyle(document.querySelector('.ds-input__item')).mixBlendMode);
        // (the reader's own mark, as from-code's page walk sets it on a placed component)
        const ie = { kind: 'instance', component: 'Item' }; if (mode === 'normal') ie.blendless = true;
        return [mode, readCleared({ root: { kind: 'container' }, item: ie }, (n) => (n === 'Item' ? item : null)).item.blend];
      };
      const [setBack, unsaid] = [await back({ blend: 'normal' }), await back({})];
      ok('a blend an instance sets back reads back from Chrome as written, normal; one left unsaid computes its component\'s and reads nothing',
        setBack[0] === 'normal' && setBack[1] === 'normal' && unsaid[0] === 'darken' && unsaid[1] === undefined, JSON.stringify([setBack, unsaid]));
    } finally { await browser.close(); }
  }
}
{ // a design boolean the mapping draws false by a text left empty (a card's status line, False: { status: '' }) is read as that boolean
  const { emptyShows, emptiedArgs, onlyInCode, stateHidden, designCombo, subjectOf } = await import('./from-code.mjs');
  const design = { showStatus: { type: 'boolean', default: true, figma: 'Show status', shows: ['status'] } };
  const code = () => ({ status: { type: 'string', code: 'status', sample: 'Label' }, title: { type: 'string', code: 'title', sample: 'Title' } });
  const joins = { showStatus: { arg: 'status', values: { false: '' } } };
  const p = emptyShows(code(), design, joins, { status: 'Label' });
  ok('a boolean the mapping draws false by an empty text is that boolean, over the same code prop', p.showStatus?.type === 'boolean' && p.showStatus.default === true && p.showStatus.code === 'status' && p.showStatus.figma === 'Show status' && p.status.type === 'string');
  ok('shown it sends nothing, so the story\'s own words draw; hidden, the empty text, every other arg as asked', JSON.stringify(emptiedArgs({ status: true, title: 'T' }, p)) === '{"title":"T"}' && emptiedArgs({ status: false }, p).status === '' && emptiedArgs({ status: 'Sent' }, p).status === 'Sent');
  const none = (d, j, c = code(), start = { status: 'Label' }, twice = {}) => !('showStatus' in emptyShows(c, d, j, start, twice));
  ok('none where false is words, true states its own value, the design hides it by default, it shows no layer, or the story starts it empty',
    none(design, { showStatus: { arg: 'status', values: { false: 'None' } } }) && none(design, { showStatus: { arg: 'status', values: { false: '', true: 'Sent' } } })
    && none({ showStatus: { ...design.showStatus, default: false } }, joins) && none({ showStatus: { ...design.showStatus, shows: undefined } }, joins)
    && none(design, joins, code(), { status: '' }) && none(design, joins, code(), {}) && none(design, {})
    && none(design, joins, code(), { status: 'Label' }, { showStatus: ['status', 'icon'] }));
  {
    const both = { ...design, status: { type: 'string', figma: 'Status' } }, at = (v) => designCombo({ props: both }, p, {}, { status: v });
    ok('a text and its boolean over one code prop are each their own kind in the design\'s combination',
      JSON.stringify(at(false)) === '{"showStatus":false}' && at('').showStatus === false && at('Sent').showStatus === true && at('Sent').status === 'Sent');
    ok('a design text the mapping joins to that code prop, or of its Figma name, stays the design\'s', !onlyInCode(p, { ...design, message: { type: 'string', figma: 'Message' } }, { message: { arg: 'status' } }).has('status')
      && !onlyInCode({ ...p, status: { ...p.status, figma: 'Message' } }, { ...design, message: { type: 'string', figma: 'Message' } }).has('status'));
    ok('brackets, quotes and parentheses are inside a compound', subjectOf('#r .a button[aria-label="Add card"]') === 'button[aria-label="Add card"]' && subjectOf('.a :not(.b .c)') === ':not(.b .c)' && subjectOf('.a li:nth-child(2n + 1)') === 'li:nth-child(2n + 1)');
    ok('a host that draws no words of its own (fragments) is sent the words', emptiedArgs({ status: true }, p, { words: true }).status === 'Label' && emptiedArgs({ status: false }, p, { words: true }).status === '');
    ok('a text no such boolean shares takes a boolean as before', designCombo({ props: { showHelp: { type: 'boolean' } } }, { helper: { type: 'string', code: 'helper' } }, { showHelp: { arg: 'helper' } }, { helper: false }).showHelp === false);
    ok('the element that takes a state is the selector\'s last compound', subjectOf('#root .card__status ~ .card__action') === '.card__action' && subjectOf('#root .card__action') === '.card__action' && subjectOf('.card>button:first-child') === 'button:first-child');
  }
  const gone = new Error('state selector matched no element: #root .card__action');
  ok('only focus has nothing to take it: a card with its button hidden is still hovered',
    !stateHidden(gone, { status: false, __state: 'hover' }, p, { hover: { pseudo: ':hover' } }) && stateHidden(gone, { status: false, __state: 'ring' }, p, { ring: { pseudo: ':focus-visible' } }));
  ok('a state whose target that boolean hid reads at rest; any other missing target still fails',
    stateHidden(gone, { status: false, __state: 'focus' }, p) && !stateHidden(gone, { status: true, __state: 'focus' }, p) && !stateHidden(gone, { status: false, __state: 'rest' }, p) && !stateHidden(new Error('drew nothing'), { status: false, __state: 'focus' }, p) && !stateHidden(gone, { status: false, __state: 'focus' }, {}));
  ok('a text only that boolean speaks for is the code\'s alone; one the design has as a text stays the design\'s', onlyInCode(p, design).has('status') && !onlyInCode(p, { ...design, status: { type: 'string', figma: 'Status' } }).has('status') && !onlyInCode(p, design).has('title'));
}
// an element's words as it draws them, from its text nodes and its computed white space: collapsed white space is one
// space, kept white space (a code block, as Figma keeps a text's newlines and indents) the text as written, kept breaks
// keep only the newlines; the ends trimmed either way (a template's own line breaks around a label), a node of white
// space alone kept where white space is kept, and white-space read where white-space-collapse is not computed
// (`el`: an element whose child nodes are these texts; an object among them is an element child, whose words are its own)
const el = (...xs) => ({ childNodes: xs.map((x) => (typeof x === 'string' ? { nodeType: 3, textContent: x } : { nodeType: 1, textContent: 'inner' })) });
{ const c = { whiteSpaceCollapse: 'collapse' }, k = { whiteSpaceCollapse: 'preserve' };
  ok('words read as drawn: collapsed is a space, preserved keeps newlines and runs, preserve-breaks newlines only',
    wordsAsDrawn(el('1\n2\n  x'), c) === '1 2 x' && wordsAsDrawn(el('1\n2\n  x'), k) === '1\n2\n  x'
    && wordsAsDrawn(el('1\r\n2'), { whiteSpaceCollapse: 'break-spaces' }) === '1\n2' && wordsAsDrawn(el('a  \n  b c'), { whiteSpaceCollapse: 'preserve-breaks' }) === 'a\nb c');
  ok('the ends are trimmed, so a label a template wraps in line breaks is still its words; collapsed, a node of white space alone is dropped',
    wordsAsDrawn(el('\n  Save\n'), { whiteSpaceCollapse: 'preserve-breaks' }) === 'Save' && wordsAsDrawn(el('  Save '), c) === 'Save' && wordsAsDrawn(el(' ', 'a', '\n  '), c) === 'a');
  ok('a node of white space alone between words is one space, as the browser draws it ({first} {last}); runs across nodes collapse to one',
    wordsAsDrawn(el('Ada', ' ', 'Lovelace'), c) === 'Ada Lovelace' && wordsAsDrawn(el('a', '\n  ', 'b'), c) === 'a b' && wordsAsDrawn(el('a ', ' b'), c) === 'a b');
  ok('where white space is kept, a node of white space alone is kept: two lines written as three nodes are two lines',
    wordsAsDrawn(el('line1', '\n', 'line2'), k) === 'line1\nline2');
  ok('with no white-space-collapse computed (an older browser), white-space says it: pre and pre-wrap keep, pre-line keeps breaks',
    wordsAsDrawn(el('a\n  b'), { whiteSpace: 'pre' }) === 'a\n  b' && wordsAsDrawn(el('a\n  b'), { whiteSpace: 'pre-wrap' }) === 'a\n  b'
    && wordsAsDrawn(el('a  \n  b'), { whiteSpace: 'pre-line' }) === 'a\nb' && wordsAsDrawn(el('a\n  b'), { whiteSpace: 'normal' }) === 'a b'); }
ok('kept breaks keep a node of white space alone that holds a newline; an element child\'s words are its own, not this one\'s (a placed instance\'s texts read as the walk reads them)',
  wordsAsDrawn(el('a', '\n', 'b'), { whiteSpaceCollapse: 'preserve-breaks' }) === 'a\nb' && wordsAsDrawn(el('a', '  ', 'b'), { whiteSpaceCollapse: 'preserve-breaks' }) === 'a b'
  && wordsAsDrawn(el('x\n', {}, '  y'), { whiteSpaceCollapse: 'preserve' }) === 'x\n  y');

// every field a reading takes from the design is tagged by the rule that took it: the paths a step changed, none where
// the code already said the same
ok('changedPaths: the leaves that differ, a key added or gone among them', JSON.stringify(changedPaths({ a: { b: 1, c: 2 }, d: [1] }, { a: { b: 1, c: 3, e: 0 }, d: [2] })) === JSON.stringify(['a.c', 'a.e', 'd.0']) && changedPaths({ a: 1 }, { a: 1 }).length === 0);
{ const A = assistsOf(), r = { component: 'board-card', anatomy: { t: { textAlign: 'left' } } };
  A.take('component-name', r, () => { r.component = 'Board card'; });
  A.take('text-align', r, () => { r.anatomy.t.textAlign = 'left'; });
  A.add('slot-sample', 'anatomy.s/x');
  ok('assistsOf: a step that changed a field tags it by its rule; one that changed nothing tags none', JSON.stringify(A.out()) === JSON.stringify({ 'component-name': ['component'], 'slot-sample': ['anatomy.s/x'] })); }

// the borrowings in a render's read: a container the design draws as a graphic takes its shape, a placed instance and
// its insides take their main's tokens for a zero, and a name inside a placed component the markup does not carry is
// the design's; each tagged by its rule, once per field
{ const A = assistsOf(), x = { kind: 'container', full: true };
  A.take('design-shape', { anatomy: { dot: x } }, () => asShape(x, { kind: 'graphic', shape: 'ellipse' }, false));
  const h = { kind: 'instance', layout: { direction: 'row' } }, value = (t) => ({ 'S/0': 0 })[t];
  A.take('placed-main-token', { anatomy: { chip: h } }, () => zeroTokens(h, { layout: { padding: { top: 'S/0', end: 'S/0', bottom: 'S/0', start: 'S/0' } } }, value, { fill: true }));
  const same = { kind: 'instance', layout: { direction: 'row', padding: { top: 'S/0', end: 'S/0', bottom: 'S/0', start: 'S/0' } } };
  A.take('placed-main-token', { anatomy: { kept: same } }, () => zeroTokens(same, { layout: { padding: { top: 'S/0', end: 'S/0', bottom: 'S/0', start: 'S/0' } } }, value, { fill: true }));
  const out = A.out();
  ok('a shape and a main\'s zero tokens taken from the design are tagged; a token already there is not',
    out['design-shape'].includes('anatomy.dot.kind') && out['design-shape'].includes('anatomy.dot.shape') && out['placed-main-token'].some((q) => q.startsWith('anatomy.chip.layout.padding')) && !out['placed-main-token'].some((q) => q.startsWith('anatomy.kept')));
  ok('a name inside a placed component is borrowed where only the design names it; the markup\'s own is not',
    nameInside('chip', 'chip/label', null, { 'chip/label': 'Label' }) !== nameInside('chip', 'chip/label', null, null)
    && nameInside(null, 'label', 'Own', { label: 'Label' }) === nameInside(null, 'label', 'Own', null)); }

// the room the root is read in is the design's width: a root at that width, or filling it, reads the design's number
ok('roomTaken: a root at the room\'s width, or a fill whose canvas is the room, took it from the design; another width did not',
  JSON.stringify(roomTaken({ id: 'root', width: 360 }, 360)) === JSON.stringify(['anatomy.root.width'])
  && JSON.stringify(roomTaken({ id: 'root', width: 'fill', canvas: { width: 360 } }, 360)) === JSON.stringify(['anatomy.root.canvas.width'])
  && !roomTaken({ id: 'root', width: 300 }, 360).length && !roomTaken({ id: 'root', width: 360 }, null).length && !roomTaken({ id: 'x', parent: 'root', width: 360 }, 360).length);
ok('nameBorrowed: a name only the design gives, or a markup name the design drops, is borrowed; the markup\'s own kept is not',
  nameBorrowed('chip', 'chip/label', null, { 'chip/label': 'Label' }) && nameBorrowed('chip', 'chip/label', 'Own', { 'chip/label': null })
  && !nameBorrowed(null, 'label', 'Own', { label: 'Label' }) && !nameBorrowed('chip', 'chip/label', null, { 'chip/label': null }));
{ // (a card kept whole, holding an icon the code colours as the card's main colours its glyph)
  const mains = byComponentName([{ contract: 1, component: 'Card', props: {}, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon' }, 'icon/glyph': { kind: 'graphic', parent: 'icon', background: 'C/a' } }, variants: [] }]);
  const read = () => ({ root: { kind: 'container' }, card: { kind: 'instance', parent: 'root', component: 'Card' }, 'card/icon': { kind: 'instance', parent: 'card', component: 'Icon', background: 'C/a' } });
  const A = assistsOf(), a = read();
  colourKept(A, a, mains, { partial: true, whole: new Set(['card']), coloured: new Set(), reading: true });
  const B = assistsOf(), b = read();
  colourKept(B, b, mains, { partial: true, whole: new Set(['card']), coloured: null, reading: true });
  ok('colourKept: a colour the reading drops because the design states none there is tagged; with no design, nothing is',
    JSON.stringify(Object.keys(A.out())) === JSON.stringify(['design-colour-kept']) && !Object.keys(B.out()).length, A.out()); }
// what the generated module says it draws (to-markup's `export const figma`), read from the code's text: the
// component's name, so the reading names it as the code does; none where the module says nothing
ok('codeFigma: the design component a generated module names, read from its text; null where it names none',
  codeFigma('export function renderX() {}\nexport const figma = {"component":"Button/❖ Button"};\n').component === 'Button/❖ Button'
  && codeFigma('export function renderX() {}') === null && codeFigma(undefined) === null);
// an enum's design name from the code's mapping (to-markup's parity axes, keyed by the design's prop name): the one axis
// that moves that arg alone; none where two do, or where an axis moves another arg too
{ const props = { appearance: { type: 'enum', values: ['default', 'primary'], code: 'appearance' }, state: { type: 'enum', values: ['default', 'hover'], code: 'state' }, size: { type: 'enum', values: ['s', 'm'], code: 'size' }, kept: { type: 'enum', values: ['a', 'b'], code: 'kept', figma: 'Own' } };
  const axes = { appearance: { default: {}, primary: { appearance: 'primary' } }, State: { default: {}, hover: { pseudo: 'hover' }, pressed: { state: 'hover' } }, Size: { s: {}, m: { size: 'm', other: 1 } }, Kept: { a: {}, b: { kept: 'b' } } };
  axisNames(props, axes);
  const one = { arrow: { type: 'enum', values: ['default'], code: 'arrow' } };
  axisNames(one, { Arrow: { Default: {} }, Other: { x: {} } });
  ok('axisNames: a one-value enum takes the axis that moves nothing whose option is its value', one.arrow.figma === 'Arrow');
  ok('axisNames: an enum takes the name of the one mapping axis that moves its arg alone; one moved beside another arg, or already named, keeps its own',
    props.appearance.figma === 'appearance' && props.state.figma === 'State' && props.size.figma === undefined && props.kept.figma === 'Own'); }
// a padding the code writes as 0 (to-code's `padding: 0`, or a zero token) is said, as the code says it; one it leaves
// unset is not, and a padding read already is kept
ok('paddingSaid: a 0 padding the code writes is four sides of 0; one it leaves unset, or one already read, is none',
  JSON.stringify(paddingSaid(undefined, { top: '0', end: null, bottom: null, start: null })) === JSON.stringify({ top: 0, end: 0, bottom: 0, start: 0 })
  && paddingSaid(undefined, { top: null, end: null, bottom: null, start: null }) === null
  && paddingSaid({ top: 4, end: 0, bottom: 0, start: 0 }, { top: '4px', end: '0', bottom: '0', start: '0' }) === null);
// a placed component's key from what the code places: each module's own word for the component it draws, by the name
// the reading gives the instance; none where the module says no key
ok('codeKeys: the key each placed module says it draws, by the instance\'s name; none where it says none',
  JSON.stringify(codeKeys({ 'radio-radio': 'Radio/❖ Radio', 'icon-x': 'Icon' }, (f) => ({ 'radio-radio': { component: 'Radio/❖ Radio', key: 'k9' }, 'icon-x': { component: 'Icon' } })[f])) === JSON.stringify({ 'Radio/❖ Radio': 'k9' }));
ok('codeKeys: two modules saying different keys for one instance name say none',
  JSON.stringify(codeKeys({ a: 'Radio', b: 'Radio' }, (f) => ({ a: { key: 'k1' }, b: { key: 'k2' } })[f])) === '{}');
// a name or key the code declares (its module's label, as Code Connect's) is identity, not a measurement: recorded as
// declared, never as assisted; a module without the label still borrows them from the design, tagged
{ const named = codeName('button-button', (f) => ({ 'button-button': { component: 'Button/❖ Button' } })[f]), bare = codeName('button-button', () => null);
  const A = assistsOf(), r = { component: bare.component };
  A.take('component-name', r, () => { r.component = 'Button/❖ Button'; });
  ok('codeName: the module\'s label names it, declared; without one the folder stays, and the design\'s name is a component-name borrowing',
    named.component === 'Button/❖ Button' && named.declared && bare.component === 'button-button' && !bare.declared && JSON.stringify(A.out()) === JSON.stringify({ 'component-name': ['component'] })); }
{ const read = () => ({ root: { kind: 'container' }, r: { kind: 'instance', parent: 'root', component: 'Radio' } });
  const A = assistsOf(), a = read(), da = keyInstances(a, { Radio: 'k1' }, { Radio: 'k1' }, A);
  const B = assistsOf(), b = read(), db = keyInstances(b, {}, { Radio: 'k1' }, B);
  ok('keyInstances: a key the placed module declares is declared, untagged; without it the library\'s is a placed-key borrowing',
    a.r.key === 'k1' && da && !Object.keys(A.out()).length && b.r.key === 'k1' && !db && JSON.stringify(B.out()) === JSON.stringify({ 'placed-key': ['anatomy.r.key'] })); }
{
  // the comparison leaves a layer inside a placed instance to its component where the design leaves it unsaid
  const { placedOver } = await import('./from-code.mjs');
  const f = { root: { kind: 'container' }, 'root/tag': { kind: 'instance' }, box: { kind: 'container' } };
  ok('a layer under a placed instance the design leaves out is its component\'s; one under a plain layer, or nothing, is not',
    placedOver(f, 'root/tag/content/close') === true && placedOver(f, 'box/inner') === false && placedOver(f, 'gone/inner') === false
    && placedOver({ ...f, 'root/tag/label': { kind: 'text' } }, 'root/tag/icon') === false);
}
// the forced states read back under the design's own name for its axis: a library spelling it `state` compared as `state`
ok('stateProp: the read-back interaction prop takes the design\'s axis name; none without a design',
  stateProp(['hover'], [], { props: { s: { type: 'enum', role: 'interaction', figma: 'state' } } }).figma === 'state' && !('figma' in stateProp(['hover'], [], null)) && stateProp(['hover'], ['loading'], null).values.join() === 'rest,hover,loading');
// a design whose states hold one called `rest` beside its own rest (`default`): that state read back as itself, set as the
// markup's prop, never taken for rest; the house's rest, `rest`, as before
{ const { restOf } = await import('./from-code.mjs');
  const msg = { props: { state: { type: 'enum', values: ['default', 'hover', 'rest'], default: 'default', role: 'interaction', pointer: ['hover'], figma: 'state' } } };
  const house = { props: { state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'], figma: 'State' } } };
  const read = stateProp(['hover'], ['rest'], msg);
  ok('a state called rest that is not the design\'s rest is read as itself',
    restOf(msg) === 'default' && read.default === 'default' && read.values.join() === 'default,hover,rest' && restOf(house) === 'rest' && stateProp(['hover'], [], house).values.join() === 'rest,hover');
}
{ // a placeholder swap given content (a picker's options slot holding a grid): read as the swap's value, by the passed
  // component's name; a placeholder left in place, or a drawing there, gives nothing
  const slot = { component: 'Slot', props: {}, anatomy: { root: { kind: 'container' } } }, grid = { component: 'Cal/Grid', props: {}, anatomy: { root: { kind: 'container' }, cell: { kind: 'text', parent: 'root' } } };
  const pick = { component: 'Pick', props: { opts: { type: 'instance', figma: 'slot {Options}', swaps: ['menu/slot'] } }, anatomy: { root: { kind: 'container' } }, variants: [{ when: { s: 'open' }, add: { menu: { kind: 'container', parent: 'root' }, 'menu/slot': { kind: 'instance', parent: 'menu', component: 'Slot' } } }] };
  const lib = { slot, grid }, byName = (nm) => Object.values(lib).find((y) => y.component === nm);
  const got = (raw) => passedSwaps(pick, 'pick', raw, (sl) => lib[sl], byName);
  ok('passedSwaps: a library component drawn in a placeholder swap\'s place is that swap\'s value; the placeholder itself is not',
    JSON.stringify(got([{ id: 'pick/menu/grid', kind: 'instance', parent: 'pick/menu', slug: 'grid' }])) === '{"slot {Options}":"Grid"}'
    && JSON.stringify(got([{ id: 'pick/menu/slot', kind: 'instance', parent: 'pick/menu', slug: 'slot' }])) === '{}' && JSON.stringify(got([])) === '{}'); }
{ // a swap whose box also holds the component's own parts (an app bar's thumbnail beside its title text): the title is
  // the component's own, never the swap's value; the swap left in place gives nothing
  const thumb = { component: 'Thumb', props: {}, anatomy: { root: { kind: 'container' } } }, title = { component: 'Text Large', props: {}, anatomy: { root: { kind: 'container' }, t: { kind: 'text', parent: 'root' } } };
  const bar = { component: 'Bar', props: { image: { type: 'instance', figma: 'Image', swaps: ['content/thumb'] } },
    anatomy: { root: { kind: 'container' }, content: { kind: 'container', parent: 'root' }, 'content/thumb': { kind: 'instance', parent: 'content', component: 'Thumb', swappedBy: 'image' }, 'content/title': { kind: 'instance', parent: 'content', component: 'Text Large' } }, variants: [] };
  const lib = { thumb, title }, byName = (nm) => Object.values(lib).find((y) => y.component === nm);
  ok('passedSwaps: the component\'s own part beside a swap is never read as the swap\'s value',
    JSON.stringify(passedSwaps(bar, 'bar', [{ id: 'bar/content/thumb', kind: 'instance', parent: 'bar/content', slug: 'thumb' }, { id: 'bar/content/title', kind: 'instance', parent: 'bar/content', slug: 'title' }], (sl) => lib[sl], byName)) === '{}');
  // a holder that does pass the same component as the bar's own part into the swap (Text Large into Image): read, since it
  // stands in the swap's place, not the own part's
  ok('passedSwaps: the same component as an own part, passed into the swap, is the swap\'s value',
    JSON.stringify(passedSwaps(bar, 'bar', [{ id: 'bar/content/textLarge', kind: 'instance', parent: 'bar/content', slug: 'title' }, { id: 'bar/content/title', kind: 'instance', parent: 'bar/content', slug: 'title' }], (sl) => lib[sl], byName)) === '{"Image":"Text Large"}'); }
{ // a part placed absolutely inside a placed component, added at one prop and moved at another (a picker's menu, open at
  // focus, lower at compact): the move is kept, judged by the part as the variant where it is drawn adds it, never by
  // another variant's add of it (one the design rules out, which draws it in flow)
  const code = { contract: 1, component: 'P', props: { state: { type: 'enum', values: ['rest', 'focus', 'hover'], default: 'rest' }, size: { type: 'enum', values: ['md', 'sm'], default: 'md' }, off: { type: 'boolean', default: false } },
    anatomy: { root: { kind: 'container' }, pick: { kind: 'instance', parent: 'root', component: 'Pick' } },
    variants: [{ when: { state: 'focus' }, add: { 'pick/menu': { kind: 'container', parent: 'pick', position: 'absolute', absolute: { x: 0, y: 48 } } } },
      { when: { state: 'focus', size: 'sm' }, set: { 'pick/menu.absolute': { x: 0, y: 40 } } },
      { when: { state: 'hover', off: true }, add: { 'pick/menu': { kind: 'container', parent: 'pick' } } }] };
  const v = asFigma(code).contract.variants.find((x) => x.when.state === 'focus' && x.when.size === 'sm');
  ok('asFigma: a move of a part placed absolutely inside a placed component is kept, judged by the add in force there', JSON.stringify((v.set || {})['pick/menu.absolute']) === '{"x":0,"y":40}', JSON.stringify(v)); }
{ // two layers of the design on one element (a picker's chevron at rest, its clear icon where a value is held): the one
  // the design draws at the combination read takes the element, whatever order the mapping lists them in
  const named = [['a', 'root', null], ['b > i', 'select/field/down', null], ['b > i', 'select/field/clear', null], ['b', 'select/field', null]];
  ok('namedAt: of two layers on one element, the one drawn here takes it, the other left out; shallower ones first; neither drawn, both kept',
    namedAt(named, { 'select/field/clear': {} }).map((x) => x[1]).join() === 'root,select/field,select/field/clear'
    && namedAt(named, { 'select/field/down': {} }).map((x) => x[1]).join() === 'root,select/field,select/field/down'
    && namedAt(named, {}).map((x) => x[1]).join() === 'root,select/field,select/field/down,select/field/clear'); }
{ // and named by what the element draws: a wrong stand-in (the chevron drawn where the clear icon is due) reads as the
  // layer it is, so it differs, never as the layer the design wants there
  const design = { anatomy: { root: { kind: 'container' }, 'f/down': { kind: 'instance', parent: 'root', component: 'Mark', with: { '<icon>': 'Chevron down' } } },
    variants: [{ when: { s: 'rest' }, remove: ['f/down'], add: { 'f/clear': { kind: 'instance', parent: 'root', component: 'Mark', with: { '<icon>': 'Cross circle' } } } }] };
  const named = [['a', 'root', null], ['b', 'f/down', null], ['b', 'f/clear', null]], names = (id) => layerNamesOf(design, id);
  ok('namedAt: a shared element is named by the glyph it draws, drawn here or not; with no glyph that fits, by what is drawn here',
    namedAt(named, { 'f/clear': {} }, { b: 'Chevron down' }, names).map((x) => x[1]).join() === 'root,f/down'
    && namedAt(named, { 'f/clear': {} }, { b: 'Cross circle' }, names).map((x) => x[1]).join() === 'root,f/clear'
    && namedAt(named, { 'f/clear': {} }, { b: 'Star' }, names).map((x) => x[1]).join() === 'root,f/clear'
    && layerNamesOf(design, 'f/down').includes('Chevron down')); }
{ // and a place another variant in force sets (placed absolutely at sm), and, where no add holds, only adds that may hold
  // with the variant: never one it rules out (a menu drawn in flow at disabled hover)
  const base = { contract: 1, component: 'P', props: { state: { type: 'enum', values: ['rest', 'focus', 'hover'], default: 'rest' }, size: { type: 'enum', values: ['md', 'sm'], default: 'md' }, off: { type: 'boolean', default: false } } };
  const setBy = { ...base, anatomy: { root: { kind: 'container' }, pick: { kind: 'instance', parent: 'root', component: 'Pick' }, 'pick/menu': { kind: 'container', parent: 'pick' } },
    variants: [{ when: { size: 'sm' }, set: { 'pick/menu.position': 'absolute' } }, { when: { size: 'sm', state: 'focus' }, set: { 'pick/menu.absolute': { x: 0, y: 40 } } }] };
  const maybe = { ...base, anatomy: { root: { kind: 'container' }, pick: { kind: 'instance', parent: 'root', component: 'Pick' } },
    variants: [{ when: { state: 'focus', size: 'sm' }, add: { 'pick/menu': { kind: 'container', parent: 'pick', position: 'absolute', absolute: { x: 0, y: 40 } } } },
      { when: { state: 'focus' }, set: { 'pick/menu.absolute': { x: 0, y: 48 } } },
      { when: { state: 'hover', off: true }, add: { 'pick/menu': { kind: 'container', parent: 'pick' } } }] };
  const at = (c, w) => (asFigma(c).contract.variants.find((x) => JSON.stringify(x.when) === JSON.stringify(w)).set || {})['pick/menu.absolute'];
  ok('asFigma: a place set by another variant in force counts, and where no add holds only adds that may hold with it do',
    JSON.stringify(at(setBy, { size: 'sm', state: 'focus' })) === '{"x":0,"y":40}' && JSON.stringify(at(maybe, { state: 'focus' })) === '{"x":0,"y":48}'); }
{ // the places of the variants in force taken by specificity, not by the list's order: the pair (placed absolutely at
  // compact focus) over the single prop (back in flow at compact), though listed first
  const code = { contract: 1, component: 'P', props: { state: { type: 'enum', values: ['rest', 'focus'], default: 'rest' }, size: { type: 'enum', values: ['md', 'sm'], default: 'md' }, off: { type: 'boolean', default: false } },
    anatomy: { root: { kind: 'container' }, pick: { kind: 'instance', parent: 'root', component: 'Pick' }, 'pick/menu': { kind: 'container', parent: 'pick' } },
    variants: [{ when: { state: 'focus', size: 'sm' }, set: { 'pick/menu.position': 'absolute' } }, { when: { size: 'sm' }, set: { 'pick/menu.position': null } },
      { when: { state: 'focus', size: 'sm', off: true }, set: { 'pick/menu.absolute': { x: 0, y: 40 } } }] };
  const v = asFigma(code).contract.variants.find((x) => x.when.off === true);
  ok('asFigma: the places of the variants in force are taken by specificity, the pair over the single prop', JSON.stringify((v.set || {})['pick/menu.absolute']) === '{"x":0,"y":40}'); }
{ // a glyph that is the component's own name fits every layer of it: those drawn here take it
  const design = { anatomy: { root: { kind: 'container' }, 'f/down': { kind: 'instance', parent: 'root', component: 'Mark' } },
    variants: [{ when: { s: 'rest' }, add: { 'f/clear': { kind: 'instance', parent: 'root', component: 'Mark' } } }] };
  const named = [['a', 'root', null], ['b', 'f/down', null], ['b', 'f/clear', null]];
  ok('namedAt: of several layers a glyph fits, those drawn here', namedAt(named, { 'f/clear': {} }, { b: 'Mark' }, (id) => layerNamesOf(design, id)).map((x) => x[1]).join() === 'root,f/clear'); }
{ // (and roundTrip, given such a reading against a design whose axis is `state`, raises no props row; review)
  const { roundTrip } = await import('./to-figma.mjs');
  const design = { contract: 1, component: 'L', props: { state: { type: 'enum', values: ['default', 'hover'], default: 'default', role: 'interaction', pointer: ['hover'], figma: 'state' } }, anatomy: { root: { kind: 'container' } }, variants: [] };
  // (unnamed, the house's mapping named it State, as it did before; axisNames leaves a named one alone)
  const reading = (named) => ({ ...design, props: { state: named ? stateProp(['hover'], [], design) : { ...stateProp(['hover'], [], null), figma: 'State' } } });
  const props = (r) => roundTrip(design, r, { layoutUnit: true, pointerFrom: design }).rows.filter((x) => x.at === 'props').length;
  ok('a reading whose state prop takes the design\'s axis name raises no props row; one named the house\'s way would', props(reading(true)) === 0 && props(reading(false)) === 1); }
{ // a placed component the design passes a pointer state of its own at this combination (an icon given State Focus by
  // the instance a focus adds, one the anatomy draws hovered of its own at hover): forced there too, by its own sheet's
  // pseudo-class; where a later variant gives it its rest (focus and on: State Default), at rest, or a prop that is no
  // pointer state, it is not
  const { forwardedAt } = await import('./from-code.mjs');
  const state = (pointer) => ({ type: 'enum', values: ['default', 'hover', 'focus'], default: 'default', figmaValues: ['Default', 'Hover', 'Focus'], role: 'interaction', pointer, figma: 'State' });
  const icon = { component: 'Icon', props: { state: state(['hover', 'focus']) }, anatomy: { root: { kind: 'container' } }, variants: [] };
  const plain = { component: 'Plain', props: { on: { type: 'boolean', default: false, figma: 'on' } }, anatomy: { root: { kind: 'container' } }, variants: [] };
  const c = { component: 'Pick', props: { state: state(['hover', 'focus']), on: { type: 'boolean', default: false, axis: true, figma: 'on' } },
    anatomy: { root: { kind: 'container' }, a: { kind: 'instance', parent: 'root', component: 'Icon', with: { State: 'Hover' } }, p: { kind: 'instance', parent: 'root', component: 'Plain', with: { on: 'true' } } },
    variants: [{ when: { state: 'focus' }, add: { b: { kind: 'instance', parent: 'root', component: 'Icon', with: { State: 'Focus' } } }, remove: ['a'] },
      { when: { state: 'hover' }, set: { 'p.with': { on: 'false' } } }, { when: { state: 'focus', on: true }, set: { 'b.with': { State: 'Default' } } }] };
  const mains = { Icon: icon, Plain: plain }, PS = { hover: ':hover', focus: ':focus-visible' };
  const f = (w) => JSON.stringify(forwardedAt(c, w, (name) => mains[name], (m, v) => PS[v]));
  ok('a placed component given a pointer state of its own at this combination is forced there by its own pseudo-class, nowhere else', f({ state: 'focus' }) === '[{"id":"b","pseudo":"focus-visible"}]'
    && f({ state: 'focus', on: true }) === '[]' && f({ state: 'hover' }) === '[{"id":"a","pseudo":"hover"}]' && f({ state: 'default' }) === '[]', f({ state: 'focus' }) + f({ state: 'focus', on: true }) + f({ state: 'hover' })); }
// a placed instance a variant swaps for a component the library does not hold, marked there by to-markup, read back as that
// swap: the variant's component and key, no graphic fields, its colour as read (eval names it where the design gives
// none); a mark naming another glyph than the design's swap stays the code's graphic
{ const design = { anatomy: { s: { kind: 'instance', component: 'Status' } }, variants: [{ when: { status: 'error' }, set: { 's.component': 'Status/Error', 's.key': 'k-err', 's.with': null } }] };
  const read = (asset) => ({ anatomy: { s: { kind: 'instance', component: 'Status' } }, variants: [{ when: { status: 'error' }, set: { 's.kind': 'graphic', 's.component': null, 's.with': null, 's.key': null, 's.asset': asset, 's.background': 'rgba(0, 0, 0, 1)' } }] });
  const a = swappedMark(read('Status/Error'), design).variants[0].set, b = swappedMark(read('Other'), design).variants[0].set;
  ok('a variant\'s mark of a component the library does not hold reads back as that variant\'s swap; another glyph stays the code\'s',
    JSON.stringify(a) === JSON.stringify({ 's.component': 'Status/Error', 's.with': null, 's.key': 'k-err', 's.background': 'rgba(0, 0, 0, 1)' }) && b['s.kind'] === 'graphic' && b['s.asset'] === 'Other', JSON.stringify(a)); }
// (2026-11-27) and a mark naming the very icon the base reads there (a read-only field's chevron, drawn whole where that
// variant detaches the component that draws it open) is that instance still: no swap, its colour as read
{ const read = { anatomy: { c: { kind: 'instance', component: 'Chevron--down', key: 'k1' }, 'c/v': { kind: 'graphic', parent: 'c' } }, variants: [{ when: { ro: true }, set: { 'c.kind': 'graphic', 'c.asset': 'Chevron--down', 'c.key': null, 'c.background': 'I/disabled' } }] };
  const s = swappedMark(read, { anatomy: { c: { kind: 'instance', component: 'Chevron--down' } }, variants: [] }).variants[0].set;
  ok('a variant\'s mark of the icon the base reads there is that instance still, its colour as read', JSON.stringify(s) === JSON.stringify({ 'c.background': 'I/disabled' }), JSON.stringify(s)); }
// children that say by z-index the first paints on top (to-code's firstOnTop over an overlapping group) read as first on
// top, a child placed absolutely among them too; the last on top, or one with no z-index, does not
{ const { stackedFirst } = await import('./rules.mjs');
  const k = (z, extra = {}) => ({ stack: { z, ...extra } });
  const rev = [k(3), k(2), k(1)], fwd = [k(1), k(2), k(3)];
  ok('children whose z-index paints the first on top read as first on top, one placed absolutely among them too; the last on top, or a child with none, not',
    stackedFirst(rev) && !stackedFirst(fwd) && !stackedFirst([k(3), { stack: {} }, k(1)]) && stackedFirst([k(3), k(2, { out: true }), k(1)]) && stackedFirst([k(3), k(1, { out: true }), k(2)]) && stackedFirst([k(3), k(1, { out: true })]) === null && stackedFirst([k(3), k(2, { out: true }), k(1, { out: true })]) === null && !stackedFirst([k(1), k(3, { out: true })]) && !stackedFirst([k(1)]));
  // (where each child says its place in the design by order, as to-code writes it in a restacked box, that is the
  // reference, a part out of the flow written out of the design's order among them too)
  const o = (z, cssOrder, extra = {}) => ({ cssOrder, stack: { z, ...extra } });
  ok('children that say their design place by order are judged against it, not the markup\'s order',
    stackedFirst([o(2, 2), o(1, 3, { out: true }), o(3, 1, { out: true })]) && !stackedFirst([o(2, 2), o(3, 3, { out: true }), o(1, 1, { out: true })])); }
// a first-on-top box's children numbered the reverse of their paint, a part placed absolutely last though written first
// (a field's background under its text, inside a placed component whose box's layout is not read); else as painted
{ const { childOrder } = await import('./rules.mjs');
  const bg = { id: 'bg', stack: { out: true, z: 1 } }, text = { id: 'text', stack: { z: 3 } }, icons = { id: 'icons', stack: { z: 2 } };
  const ids = (r) => r.ranked.map((e) => e.id).join();
  ok('a first-on-top box\'s children are numbered the reverse of their paint, its absolute part among them; else as painted',
    ids(childOrder([text, bg, icons])) === 'text,icons,bg' && childOrder([text, bg, icons]).first
    && ids(childOrder([{ id: 'a' }, { id: 'b', stack: { out: true } }])) === 'a,b' && !childOrder([{ id: 'a' }, { id: 'b' }]).first);
  // (two at the same z-index paint the later on top, so the later is the first of the two)
  const z = (id, v) => ({ id, stack: { z: v } });
  ok('children at the same z-index are numbered as they paint, the later one on top', ids(childOrder([z('a', 2), z('b', 1), z('c', 1)], undefined, () => true)) === 'a,c,b');
  // (later as laid out: by CSS order before the markup's)
  ok('children at the same z-index are numbered by their laid-out order, CSS order first', ids(childOrder([z('a', 2), { ...z('b', 1), cssOrder: 3 }, { ...z('c', 1), cssOrder: 2 }], undefined, () => true)) === 'a,b,c');
  // (one child in the flow and no CSS order: which way the z-index counts is not known, read as painted)
  const u = childOrder([z('a', 2), { id: 'b', stack: { z: 1, out: true } }]);
  ok('a box whose order the code does not say reads as painted, its first-on-top unknown', u.first === null && ids(u) === 'b,a', JSON.stringify(u)); }
// a design prop the engine's rule joined to no arg, where the toolkit's markup renamed it off an HTML attribute's name,
// joins that arg: a flag's title (titleOption) keeps the design's name, never read back as Title beside it
{ const design = { title: { type: 'string' }, size: { type: 'string' }, label: { type: 'string' }, hidden: { type: 'string' } };
  const p = renamedJoins({ title: { fixed: undefined, missing: true }, size: { fixed: 'm', missing: true }, label: 'label', hidden: { missing: true } },
    { titleOption: { control: 'text' }, sizeOptional: {}, label: {}, hiddenOption: { control: 'boolean', default: false } }, design);
  ok('a design prop renamed off an HTML attribute in the markup joins that arg, of its own kind; another word that begins so, or an arg of another kind, does not',
    p.title.code === 'titleOption' && !p.title.missing && p.size.missing === true && p.label === 'label' && p.hidden.missing === true, JSON.stringify(p)); }
// 2026-11-27: a mark (data-icon, a component the library does not hold) keeps its layout as read, the room about its glyph
// to-code writes on it, so a frame's padding goes round
ok('a mark keeps its layout and its corners, stroke and clipping as read', ['layout', 'radius', 'border', 'overflow'].every((k) => (MARK_FIELDS || []).includes(k)));
// (and in a page: to-code's sheet for a mark padded about its glyph, read off its computed style by the reader's own halves
// (flowOf, paddingOf): its layout as the design says it, its box the design's frame, 16 glyph and 4 room each side, and
// the glyph painted on it kept to its content box)
{ const fs = await import('node:fs');
  const { findChrome, launch, newPage, attach, navigate, call } = await import('../shared/cdp.mjs');
  const { toCss } = await import('./to-code.mjs');
  if (!fs.existsSync(findChrome())) ok('Chrome is here to read a mark in (none found: install Chrome, the toolkit\'s one browser)', false);
  else {
    const c = { contract: 1, component: 'Bar', props: {}, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Glyph', key: 'dd44', layout: { direction: 'row', gap: 0, align: 'center', crossAlign: 'center', padding: { top: 4, end: 4, bottom: 4, start: 4 } } }, 'icon/glyph': { kind: 'instance', parent: 'icon', component: 'Warn', width: 16, height: 16 } }, variants: [] };
    const sheet = toCss(c, 'bar', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: () => null });
    const browser = await launch({});
    try {
      const tab = await attach(await newPage(browser.endpoint));
      await navigate(tab, 'http://round-trip.test/', { html: `<!doctype html><style>${sheet}</style><div class="ds-bar"><span class="ds-bar__icon" data-icon="Warn" aria-hidden="true"></span></div>` });
      const got = await call(tab, ([flowSrc, padSrc]) => {
        const flowOf = new Function(`return ${flowSrc}`)(), paddingOf = new Function(`return ${padSrc}`)(), px = (v) => +parseFloat(v).toFixed(2);
        const n = document.querySelector('[data-icon]'), s = getComputedStyle(n), r = n.getBoundingClientRect();
        return { flex: /flex/.test(s.display), flow: flowOf(s, px), pad: paddingOf(s, px), w: r.width, h: r.height, mask: s.maskOrigin || s.webkitMaskOrigin, bg: s.backgroundOrigin };
      }, [flowOf.toString(), paddingOf.toString()]);
      ok('a mark padded about its glyph reads back its layout from its computed style, is as big as the design\'s frame, and keeps its glyph to its content box',
        got.flex && got.flow.direction === 'row' && Object.values(got.pad).every((v) => v === 4) && got.w === 24 && got.h === 24 && got.mask === 'content-box' && got.bg === 'content-box', JSON.stringify(got));
    } finally { await browser.close(); }
  }
}
{ // another library's instance the markup drew open (data-component, data-with), read back as the instance it is: its
  // component and props on the element and in each variant's set and add of them (2026-11-27)
  const read = { anatomy: { root: { kind: 'container' }, icon: { kind: 'container', parent: 'root', foreign: 'Status', foreignKey: 'k1', foreignWith: { Size: 'small' }, layout: { direction: 'row' } }, 'icon/glyph': { kind: 'container', parent: 'icon' }, box: { kind: 'container', parent: 'root' } },
    variants: [{ when: { tone: 'error' }, set: { 'icon.foreignWith': { Size: 'large' }, 'icon.foreign': 'Status/Error', 'icon.foreignKey': 'k2' } }, { when: { tone: 'none' }, set: { 'icon.foreignWith': null } }, { when: { big: true }, add: { extra: { kind: 'container', parent: 'root', foreign: 'Badge' } } }] };
  const ids = foreignAsInstance(read), a = read.anatomy;
  ok('foreignAsInstance: a frame the markup drew for another library\'s instance is that instance again, its component, key and props as the markup says them (data-key, never a key taken from the design), in every variant; a frame of its own stays one',
    [...ids].sort().join() === 'extra,icon' && a.icon.kind === 'instance' && a.icon.component === 'Status' && JSON.stringify(a.icon.with) === '{"Size":"small"}' && a.icon.key === 'k1' && !('foreign' in a.icon) && !('foreignKey' in a.icon) && !('foreignWith' in a.icon) && a.icon.layout.direction === 'row'
      && JSON.stringify(read.variants[0].set) === '{"icon.with":{"Size":"large"},"icon.component":"Status/Error","icon.key":"k2"}' && read.variants[1].set['icon.with'] === null && read.variants[2].add.extra.kind === 'instance' && read.variants[2].add.extra.component === 'Badge' && !('with' in read.variants[2].add.extra)
      && a['icon/glyph'].kind === 'container' && a.box.kind === 'container');
  // (one a variant opened over a held instance, layers.mjs openForeign: that variant's frame is the instance again, its
  // kind no longer set, its component and key the swap's)
  const held = { anatomy: { root: { kind: 'container' }, st: { kind: 'instance', parent: 'root', component: 'Tag' } }, variants: [{ when: { tone: 'error' }, set: { 'st.kind': 'container', 'st.foreign': 'Err', 'st.foreignKey': 'k7' } }] };
  foreignAsInstance(held);
  ok('…and a variant\'s frame opened over a held instance is that variant\'s swap again, no kind set', JSON.stringify(held.variants[0].set) === '{"st.component":"Err","st.key":"k7"}', JSON.stringify(held.variants[0].set));
  // (review: a narrower variant that reads the held one again, no data-component there, gives no component of its own:
  // a foreign that is no name (false, null) is dropped, never written as the component)
  const back = { anatomy: { root: { kind: 'container' } }, variants: [{ when: { tone: 'error', big: true }, set: { 'st.kind': 'instance', 'st.foreign': false, 'st.foreignKey': null, 'st.component': 'Tag' } }, { when: { tone: 'none' }, set: { 'st.foreign': null } }] };
  foreignAsInstance(back);
  ok('…a foreign that is no name is dropped: the held component stays, never false or null', JSON.stringify(back.variants[0].set) === '{"st.kind":"instance","st.component":"Tag","st.key":null}' && JSON.stringify(back.variants[1].set) === '{}', JSON.stringify(back.variants.map((v) => v.set)));
}
{ // a glyph that scales both ways inside another library's instance the markup drew open keeps its point, as derive keeps
  // it there (ownInsides: a part of an instance it draws open keeps its place); inside a held one it keeps none (2026-11-27)
  const c = () => ({ component: 'C', props: { size: { type: 'enum', values: ['sm', 'lg'], default: 'sm' } }, anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Check' }, 'i/v': { kind: 'graphic', parent: 'i', absolute: { x: 2.5, y: 2.5 }, constraints: { horizontal: 'scale', vertical: 'scale' } }, 'i/b': { kind: 'container', parent: 'i', absolute: { x: 1, y: 1 } } }, variants: [{ when: { size: 'lg' }, set: { 'i/v.absolute': { x: 3.13, y: 3.13 }, 'i/b.absolute': { x: 2, y: 2 } } }] });
  const O = asFigma(c(), { foreign: new Set(['i']) }).contract, H = asFigma(c()).contract, open = O.anatomy, held = H.anatomy;
  ok('a glyph scaling both ways inside an instance drawn open keeps its point; inside a held one, and a part in flow, none',
    JSON.stringify(open['i/v'].absolute) === '{"x":2.5,"y":2.5}' && open['i/v'].constraints && !held['i/v'].absolute && held['i/v'].constraints && !open['i/b'].absolute, JSON.stringify([open['i/v'], held['i/v']]));
  // (and the point a variant sets it at, the icon drawn larger there: the status icon at 20px read 1 for 1.25)
  ok('…and the point a variant sets it at, likewise', JSON.stringify(O.variants[0].set) === '{"i/v.absolute":{"x":3.13,"y":3.13}}' && JSON.stringify(H.variants[0].set) === '{}', JSON.stringify([O.variants[0].set, H.variants[0].set]));
}
console.log(`${n}/${n} passed`);
