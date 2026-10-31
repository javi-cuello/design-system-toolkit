#!/usr/bin/env node
// node tests/test-validate.mjs — from the skill folder. Runs every target over one fixture.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validate, targets, silentClasses, fromSnapshot, translations, frameworks, unmappedFor, landsOf } from '../scripts/validate.mjs';

const here = new URL('.', import.meta.url).pathname;
const comps = JSON.parse(fs.readFileSync(here + 'fixtures/components.json', 'utf8'));
// The project's state vocabulary, as its settings would pass it in.
const ST = { axis: 'State', options: ['Rest', 'Focus', 'Hover', 'Press', 'Loading'] };
const R = Object.fromEntries(targets.map(t => [t, validate(comps, t, { states: ST })]));
const has = (t, cls, component, layer) => R[t].some(x => x.class === cls && x.component === component && (!layer || x.layer === layer));
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

// web
ok('W1 · a wrapper below the root that adds nothing', has('web', 'W1', 'Card', 'Wrapper'));
ok('W1 · the variant root is never the wrapper', !R.web.some(x => x.class === 'W1' && x.layer === '$root'));
ok('W2 · an icon before the text inside a search input', has('web', 'W2', 'Search input', 'Input'));
ok('W3 · a text layer leading choice rows', has('web', 'W3', 'Select list', '$root'));
ok('W4 · an outside focus ring under a clipping ancestor', has('web', 'W4', 'Menu', 'Focus ring'));
// The same ring, one level down inside an INSTANCE, is not this component's
// finding. It belongs to the component the instance is of, which is audited
// under its own name — `Select list` places `Select list - item`, and a
// designer opening `Select list` would find no such layer in it.
ok('W4 · a ring inside a nested instance is not the parent\'s finding', !has('web', 'W4', 'Select list'));
ok('W5 · a centre stroke', has('web', 'W5', 'Card', 'Divider'));
ok('W5 · a ring is not an outside-stroke finding', !R.web.some(x => x.class === 'W5' && x.layer === 'Focus ring'));
ok('W6 · a slot at a fixed height', has('web', 'W6', 'Card', 'Content slot'));
ok('W7 · a boolean named like a state', has('web', 'W7', 'Card', 'Checked'));
ok('W7 · a recorded state option (Loading) is not a finding', !R.web.some(x => x.class === 'W7' && x.component === 'Card' && x.layer === 'State'));
ok('W7 · a state value outside the recorded options', validate([{ name: 'Tab', props: { State: ['Rest', 'Hover', 'Selected'] }, variants: [] }], 'web', { states: ST }).some(x => x.class === 'W7' && x.layer === 'State' && /Selected/.test(x.detail)));
ok('W7 · no recorded state axis, no state-axis check', !validate([{ name: 'Tab', props: { State: ['Rest', 'Selected'] }, variants: [] }], 'web').some(x => x.class === 'W7'));
ok('W7 · a renamed state axis is read from the settings', validate([{ name: 'Tab', props: { Interaction: ['Idle', 'Selected'] }, variants: [] }], 'web', { states: { axis: 'Interaction', options: ['Idle'] } }).some(x => x.class === 'W7' && x.layer === 'Interaction' && /Selected/.test(x.detail)));
ok('WT1 · no recorded state axis, no pseudo-class translation', !translations([{ name: 'T', props: { State: ['Rest', 'Hover'] }, variants: [] }], 'web').some((x) => x.id === 'WT1'));
ok('W7 · an Icon boolean is not a state', !R.web.some(x => x.class === 'W7' && x.component === 'Clean button'));
ok('W8 · a max width on a fill child, and not a fixed leaf beside it', has('web', 'W8', 'Card', 'Body') && !has('web', 'W8', 'Card', 'Avatar'));
ok('W9 · Auto line height, and unstyled text', has('web', 'W9', 'Search input', 'Placeholder') && has('web', 'W9', 'Card', 'Title'));
ok('W11 · diamond gradient, plus-lighter blend, progressive blur, literal effect', ['diamond', 'PLUS_LIGHTER', 'progressive', 'no style behind it'].every(s => R.web.some(x => x.class === 'W11' && x.detail.includes(s))));
ok('W12 · five identical instances read as sampled content', has('web', 'W12', 'Feed', '$root'));
ok('W14 · a cropped image fill, W15 · a mask layer', has('web', 'W14', 'Card', 'Cover') && has('web', 'W15', 'Card', 'Cover'));
ok('W13 · corner smoothing on the web', has('web', 'W13', 'Card', '$root'));
{
  const sh = (over) => [{ name: 'Card', variants: [{ name: 'Default', type: 'COMPONENT', w: 160, h: 120, radius: 24, fills: ['VAR'], effects: ['DROP_SHADOW'], ...over }] }];
  const w17 = (over) => validate(sh(over), 'web').filter(x => x.class === 'W17');
  const square = { name: 'Badge', type: 'RECTANGLE', x: 0, y: 60, w: 60, h: 60, fills: ['VAR'] };
  ok('W17 · a square child in a rounded corner of an unclipped shadowed frame', /square/.test((w17({ children: [square] })[0] || {}).detail));
  ok('W17 · the same frame with Clip content on is silent', w17({ clips: true, children: [square] }).length === 0);
  ok('W17 · no fill, so the shadow takes a rounder child\'s shape', /no fill/.test((w17({ radius: 0, fills: undefined, children: [{ name: 'Main', type: 'FRAME', x: 0, y: 0, w: 160, h: 120, radius: 999, fills: ['VAR'] }] })[0] || {}).detail));
  ok('W17 · spread on an unclipped frame is named as ignored', /spread is ignored/.test((w17({ effects: ['DROP_SHADOW:spread'] })[0] || {}).detail));
  ok('W17 · a focus ring outside the frame is not a finding', w17({ children: [{ name: 'Focus ring', type: 'FRAME', x: -4, y: -4, w: 168, h: 128, strokes: ['VAR'], strokeAlign: 'OUTSIDE', absolute: true }] }).length === 0);
  ok('W17 · a child inset from the corners is silent', w17({ children: [{ name: 'Label', type: 'TEXT', x: 24, y: 24, w: 80, h: 20, fills: ['VAR'] }] }).length === 0);
}
ok('web · a clean component produces nothing', !R.web.some(x => x.component === 'Clean button'));

// ios
ok('I1 · a centre stroke, and an outside ring too (no ring exception on iOS)', has('ios', 'I1', 'Card', 'Divider') && has('ios', 'I1', 'Menu', 'Focus ring'));
ok('I2 · 60% smoothing is the iOS preset, not a finding', !has('ios', 'I2', 'Card'));
ok('I3 · a fixed line height', has('ios', 'I3', 'Card', 'Title'));
ok('I4 · non-zero letter spacing', has('ios', 'I4', 'Card', 'Title') && !has('ios', 'I4', 'Clean button'));
ok('I5 · a fixed-height frame around text', has('ios', 'I5', 'Toolbar', '$root'));
ok('I6 · truncation off in a width-constrained parent', has('ios', 'I6', 'Search input', 'Placeholder'));
ok('I7 · two fill siblings in a row', has('ios', 'I7', 'Toolbar', '$root'));
ok('I8 · an absolute child', has('ios', 'I8', 'Card', 'Badge'));
ok('I9 · inner shadow and spread', R.ios.some(x => x.class === 'I9' && /inner/.test(x.detail)) && R.ios.some(x => x.class === 'I9' && /spread/.test(x.detail)));
ok('I10 · a background blur', has('ios', 'I10', 'Card', 'Glow'));
ok('I11 · an unbound solid fill', has('ios', 'I11', 'Card', 'Content slot'));
ok('I12 · a Pressed boolean, and Hover on a touch target', has('ios', 'I12', 'Toolbar', 'Pressed') && has('ios', 'I12', 'Toolbar', 'State'));
ok('I13 · an interactive root under 44 pt', has('ios', 'I13', 'Toolbar', '$root') && !has('ios', 'I13', 'Clean button'));
ok('I15 · an icon with two fills', has('ios', 'I15', 'Toolbar', 'Brand icon'));
ok('ios · the web-clean button still has a percent line height and a Hover state', R.ios.filter(x => x.component === 'Clean button').map(x => x.class).sort().join() === 'I12,I3');

// android
ok('A1 · any stroke not inside', has('android', 'A1', 'Card', 'Divider'));
ok('A2 · fill siblings need weight', has('android', 'A2', 'Toolbar', '$root'));
ok('A4 · Auto line height', has('android', 'A4', 'Search input', 'Placeholder'));
ok('A5 · letter spacing in px', has('android', 'A5', 'Card', 'Title'));
ok('A7 · a fixed-height row around text', has('android', 'A7', 'Toolbar', '$root'));
ok('A8 · inner shadow', R.android.some(x => x.class === 'A8' && /inner/.test(x.detail)));
ok('A10 · a blend mode on a layer', R.android.some(x => x.class === 'A10' && /blend/.test(x.detail)));
ok('A11 · an interactive root under 48 dp', has('android', 'A11', 'Toolbar', '$root') && !has('android', 'A11', 'Clean button'));
ok('A14 · an icon at 18 and with two fills', R.android.filter(x => x.class === 'A14' && x.layer === 'Brand icon').length === 2);
ok('A15 · an absolute child', has('android', 'A15', 'Card', 'Badge'));
ok('android · a clean component produces nothing', !R.android.some(x => x.component === 'Clean button'));

ok('every finding carries a variants list', targets.every(t => R[t].every(x => Array.isArray(x.variants) && !('variant' in x))));
ok('an unknown target throws', (() => { try { validate(comps, 'flutter'); return false; } catch { return true; } })());

// stored-tree shape: variable names and hex literals as paints, line height from a text-styles list
const stored = [{ name: 'Chip', props: {}, variants: [{ name: 'Chip', type: 'COMPONENT', w: 80, h: 32, sizing: 'HUG/HUG', children: [
  { name: 'Box', type: 'FRAME', w: 80, h: 32, sizing: 'HUG/HUG', fills: ['#ff0000'], strokes: ['Border/soft'], strokeAlign: 'CENTER', effect: 'Elevation/1', children: [
    { name: 'Label', type: 'TEXT', w: 40, h: 16, text: 'Chip', textStyle: 'Label/sm' } ] } ] }] }];
const st = validate(stored, 'ios', { textStyles: [{ name: 'Label/sm', lineHeightSource: 'auto' }] });
ok('stored · a hex literal reads as an unbound fill', st.some(x => x.class === 'I11' && x.layer === 'Box'));
ok('stored · a named effect style is not a literal effect', !st.some(x => x.class === 'I9'));
ok('stored · a centre stroke still reads through the stored shape', st.some(x => x.class === 'I1' && x.layer === 'Box'));
ok('stored · line height comes from the text-styles list', validate(stored, 'web', { textStyles: [{ name: 'Label/sm', lineHeightSource: 'auto' }] }).some(x => x.class === 'W9' && x.layer === 'Label'));
ok('stored · a line height the styles list resolved (measured / metric) is still Auto', validate(stored, 'web', { textStyles: [{ name: 'Label/sm', lineHeightSource: 'measured' }] }).some(x => x.class === 'W9' && x.layer === 'Label') && !validate(stored, 'web', { textStyles: [{ name: 'Label/sm', lineHeightSource: 'style' }] }).some(x => x.class === 'W9' && x.layer === 'Label'));
ok('silent · a stored tree without truncation, smoothing, mask or image fields says so', silentClasses(stored, 'web').join() === 'W10,W13,W14,W15,W11,W16,W17');
// A class that RAISED a finding ran, whatever the field census concluded.
// One report named I5 unchecked beside 44 I5 rows, which is the worst answer
// a "can I trust this" question can get.
{
  // I5 has two detectors: one reads `textAutoResize`, one reads `sizing`. A
  // stored tree carries `sizing` and never `textAutoResize`, so the class is
  // half-checkable — it RAISES here, and the field census still calls it
  // silent. Both answers in one report is what this guard removes.
  const half = [{ name: 'Row', props: {}, variants: [{ name: 'Row', type: 'COMPONENT', w: 200, h: 40, sizing: 'FIXED/FIXED', children: [
    { name: 'Label', type: 'TEXT', w: 100, h: 16, text: 'Hello', textStyle: 'Label/sm' }] }] }];
  const found = validate(half, 'ios');
  const bare = silentClasses(half, 'ios');
  const told = silentClasses(half, 'ios', found);
  const raised = new Set(found.map((f) => f.class));
  ok('silent · a half-checkable class is named when it raises nothing', bare.includes('I5') && raised.has('I5'));
  ok('silent · no class is called unchecked while its own rows are listed', !told.some((c) => raised.has(c)));
}
ok('silent · the full fixture leaves nothing silent on the web', silentClasses(comps, 'web').length === 0);
// snapshot shape: the plugin writes `truncate` only when set, blend mode only when not normal
const snap = [{ name: 'Tag', props: {}, variants: [{ name: 'Tag', type: 'COMPONENT', w: 80, h: 24, sizing: 'FIXED/FIXED', children: [
  { name: 'Clipped', type: 'TEXT', w: 60, h: 16, text: 'A long label', textStyle: 'Label/sm', textAutoResize: 'NONE' },
  { name: 'Ellipsis', type: 'TEXT', w: 60, h: 16, text: 'A long label', textStyle: 'Label/sm', textAutoResize: 'NONE', truncate: 'ENDING' } ] }] }];
ok('snapshot · read raw, W10 fires on text that does truncate, and A6 is silent', validate(snap, 'web').some((x) => x.class === 'W10' && x.layer === 'Ellipsis') && silentClasses(snap, 'android').includes('A6'));
const fs1 = fromSnapshot(snap);
ok('snapshot · read as a snapshot, truncation speaks', !silentClasses(fs1, 'android').includes('A6'));
const w10 = validate(fs1, 'web').filter((x) => x.class === 'W10').map((x) => x.layer);
ok('snapshot · absent truncate is off (W10 fires), truncate ENDING is on (no W10)', w10.includes('Clipped') && !w10.includes('Ellipsis'));

// The five fields the live reader saw and the stored snapshot did not, until
// plugin 0.33.0 recorded them: W13, W14, W15 and the blur/shadow classes were
// silent on every snapshot run and fired only when someone pasted the script.
const snap33 = [{ name: 'Card', props: {}, variants: [{ name: 'Card', type: 'COMPONENT', w: 200, h: 120, sizing: 'FIXED/FIXED', smoothing: 0.6, children: [
  { name: 'Photo', type: 'RECTANGLE', w: 200, h: 80, x: 0, y: 0, fills: ['IMAGE:CROP'], mask: true },
  { name: 'Glass', type: 'RECTANGLE', w: 200, h: 40, effect: 'literal', effects: ['BACKGROUND_BLUR_PROGRESSIVE'], blendMode: 'MULTIPLY' },
  // `blendMode` and `lineHeight` are here because the stricter silence rule
  // asks for every field a class needs, not any one of them: without them
  // W11's blend half and W16 could not run, and saying this tree leaves
  // nothing silent would have been the claim that was wrong, not the rule.
  { name: 'Caption', type: 'TEXT', w: 180, h: 16, text: 'A long caption', textStyle: 'Label/sm', textAutoResize: 'NONE', truncate: 'ENDING', lineHeight: '115%' } ] }] }];
const fs33 = fromSnapshot(snap33);
ok('snapshot 0.33.0 · nothing web-silent: smoothing, image fill, mask and effects all speak', silentClasses(fs33, 'web').length === 0);
const r33 = validate(fs33, 'web');
ok('snapshot 0.33.0 · corner smoothing is reported from the stored tree', r33.some((x) => x.class === 'W13' && x.layer === '$root'));
ok('snapshot 0.33.0 · an image fill\'s scale mode is reported from the stored tree', r33.some((x) => x.class === 'W14' && x.layer === 'Photo'));
ok('snapshot 0.33.0 · a mask layer is reported from the stored tree', r33.some((x) => x.class === 'W15' && x.layer === 'Photo'));
ok('snapshot 0.33.0 · a progressive blur behind a literal effect is reported', r33.some((x) => x.class === 'W11' && x.layer === 'Glass' && /blur/i.test(x.detail || '')));
// The other half of that rule, and the one nothing asserted: a PLAIN
// background blur is `backdrop-filter: blur()`, so it is not a finding. The
// rule fired on it for two versions and told the reader there was no CSS
// primitive, which its own reference contradicts in the line above Detect.
// 8 of one library's 14 W11 rows were this, every one wrong.
{
  const plain = [{ name: 'Sheet', props: {}, variants: [{ name: 'Sheet', type: 'COMPONENT', w: 200, h: 100, children: [
    { name: 'Scrim', type: 'RECTANGLE', w: 200, h: 100, effects: ['BACKGROUND_BLUR'], effect: 'style' }] }] }];
  ok('W11 · a plain background blur is backdrop-filter, not a finding', !validate(plain, 'web').some((x) => x.class === 'W11'));
  // The other half of that fix, and the reason it is a per-target pattern
  // rather than one shared regex: iOS and Android BOTH list "a background
  // blur" in their Detect lines, because it is a Material on one and has no
  // modifier at all on the other. Fixing web inside the shared helper took
  // the signal away from both, and nothing said so.
  ok('I10 · a background blur is a Material question on iOS', validate(plain, 'ios').some((x) => x.class === 'I10' && /background blur/.test(x.detail)));
  ok('A9 · and has no modifier at all on Android', validate(plain, 'android').some((x) => x.class === 'A9' && /background blur/.test(x.detail)));
}
// 60% is the one smoothing iOS has (.continuous), so I2 must stay quiet on it
// — the assertion is that the field ARRIVED, which W13 above proves, and that
// the iOS rule reads it rather than firing blind.
ok('snapshot 0.33.0 · iOS reads the same smoothing and passes 60%', !validate(fs33, 'ios').some((x) => x.class === 'I2'));

// translations: what the web builds differently, nothing to decide
const tr = translations(fromSnapshot([{ name: 'Field', props: { Indeterminate: ['False', 'True'], State: ['Rest', 'Hover', 'Focus', 'Loading'], Disabled: ['False', 'True'], 'Role#0:0': ['Primary'], Align: ['Start'], Size: ['sm', 'md'] }, variants: [
  { name: 'State=Rest', type: 'COMPONENT', w: 200, h: 40, strokes: ['Border/soft'], strokeAlign: 'INSIDE', strokesInLayout: false, align: 'SPACE_BETWEEN/CENTER', children: [
    { name: 'Value', type: 'TEXT', w: 120, h: 20, truncate: 'ENDING', maxLines: 1 },
    { name: 'Chevron', type: 'INSTANCE', w: 16, h: 16, rotation: -180 } ] },
  { name: 'State=Focus', type: 'COMPONENT', w: 200, h: 40, strokes: ['Border/soft'], strokeAlign: 'INSIDE', strokesInLayout: false, children: [
    { name: 'Focus ring', type: 'RECTANGLE', w: 208, h: 48, x: -4, y: -4, absolute: true, strokes: ['Focus'], strokeAlign: 'INSIDE' },
    { name: 'Hint', type: 'TEXT', w: 120, h: 40, truncate: 'ENDING', maxLines: 2 } ] } ] }]), 'web', { states: ST });
const row = (x) => [x.figma, x.code, x.why].join(' | ');
const tid = (id, re) => tr.some((x) => x.id === id && (!re || re.test(row(x))));
ok('translations · every row has Figma, code and why', tr.every((x) => x.figma && x.code && x.why && !('note' in x)));
ok('WT1 · State values become pseudo-classes, Loading stays a property', tid('WT1', /`Hover`.*\| .*`:hover`/) && tid('WT1', /`Loading` is not a pointer state/));
ok('WT2 · Disabled is the element\'s own', tid('WT2'));
ok('WT4 · Indeterminate is the checkbox property, not an attribute', tid('WT4', /^`Indeterminate` \| .*`indeterminate` property/));
ok('WT3 · Role becomes variant (suffix stripped), Align is a taken name, Size is plain', tid('WT3', /^`Role` \| `variant`/) && tid('WT3', /`align` is already an HTML attribute/) && !tr.some((x) => /`Size`/.test(row(x))));
ok('WT6 · a focus ring layer, only on Focus, is an outline 4px out; its inside stroke is no WT7', tid('WT6', /\*\*Focus ring\*\*, a layer 4px outside/) && !tr.some((x) => x.id === 'WT7' && x.layers.includes('Focus ring')));
ok('WT7 · the root\'s inside stroke, named once across two variants', tr.filter((x) => x.id === 'WT7').length === 1 && tid('WT7', /^The component, inside stroke/));
ok('WT10 · Auto gap is space-between', tid('WT10', /space-between/));
ok('WT11 · one line is an ellipsis, two lines a clamp', tid('WT11', /\*\*Value\*\*, truncated.*ellipsis/) && tid('WT11', /\*\*Hint\*\*, 2 lines.*line-clamp: 2/));
ok('WT12 · a rotated chevron', tid('WT12', /\*\*Chevron\*\*, rotated -180°.*rotate\(-180deg\)/));
ok('translations · the web-clean button still gets its inside stroke translated, and ios has none yet', translations(comps.filter((c) => c.name === 'Clean button').map((c) => ({ ...c, props: {} })), 'web').map((x) => x.id).join() === 'WT7' && translations(comps, 'ios').length === 0);
// ---- the MUI layer -----------------------------------------------------
// A framework applies on top of a platform target: `web` says what the medium
// can draw, MUI says whether the component's API has anywhere to put it. Read
// against @mui/material v9.4.0.
const muiComps = [
  { name: 'Text input', props: { Variant: ['Outlined', 'Filled', 'Underline'], Size: ['Small', 'Medium'] }, variants: [{ name: 'Variant=Outlined', type: 'COMPONENT', w: 200, h: 40, children: [] }] },
  { name: 'Button', props: { Variant: ['Text', 'Contained', 'Ghost'], Size: ['Small', 'Medium', 'Large'], State: ['Rest', 'Loading'] }, variants: [{ name: 'State=Rest', type: 'COMPONENT', w: 100, h: 40, children: [{ name: 'Focus ring', type: 'RECTANGLE', w: 108, h: 48 }] }] },
  // Loading for the MUI rule (Chip has no `loading` prop), Selected so the web set has a W7 to find underneath now that Loading is the house's own.
  { name: 'Chip', props: { State: ['Rest', 'Loading', 'Selected'] }, variants: [{ name: 'State=Rest', type: 'COMPONENT', w: 80, h: 24, children: [] }] },
  { name: 'Mystery', props: { Variant: ['Nonsense'] }, variants: [{ name: 'Variant=Nonsense', type: 'COMPONENT', w: 10, h: 10, children: [] }] },
];
const map = { 'Text input': 'TextField', Button: 'Button', Chip: 'Chip' };
const mui = validate(muiComps, 'web', { framework: 'mui', frameworkMap: map, states: ST });
const cls = (id) => mui.filter((f) => f.class === id);
ok('mui · a CLOSED enum value is a finding: TextField.variant has no `| string` tail',
  cls('MU1').length === 1 && cls('MU1')[0].component === 'Text input' && /Underline/.test(cls('MU1')[0].layer));
ok('mui · an OPEN enum value is a theme variant to schedule, not a defect',
  cls('MU2').some((f) => f.component === 'Button' && /Ghost/.test(f.layer) && /module augmentation/.test(f.align)));
ok('mui · a Size axis matching the prop raises nothing', !mui.some((f) => /Size/.test(f.layer || '')));
ok('mui · Loading on Chip has no prop; Loading on Button does',
  cls('MU3').length === 1 && cls('MU3')[0].component === 'Chip');
ok('mui · a drawn focus ring is additive to the one MUI renders',
  cls('MU4').length === 1 && cls('MU4')[0].component === 'Button');
ok('mui · a component with no mapping is not checked, and is named instead',
  !mui.some((f) => f.component === 'Mystery') && unmappedFor(muiComps, map).join() === 'Mystery');
ok('mui · the web set still runs underneath', validate(muiComps, 'web', { states: ST }).length > 0);
ok('mui · the framework is refused on a target it does not apply to', (() => {
  try { validate(muiComps, 'ios', { framework: 'mui' }); return false; } catch (e) { return /applies on top of web/.test(e.message); } })());
ok('mui · an unknown framework is refused by name', (() => {
  try { validate(muiComps, 'web', { framework: 'bootstrap' }); return false; } catch (e) { return /unknown framework/.test(e.message); } })());
ok('mui · and with no framework named, nothing MUI fires', !validate(muiComps, 'web').some((f) => /^MU/.test(f.class)));

// The four tree rules: an adornment that is neither start nor end, a Chip
// trailing icon with no delete slot, a Select that takes typing, a non-square
// icon. Each sourced from mui.com and each observable in a layer tree.
const treeComps = [
  { name: 'Text input', props: {}, variants: [{ name: 'v', type: 'COMPONENT', w: 300, h: 40, children: [
    { name: 'Field', type: 'FRAME', w: 300, h: 40, children: [
      { name: 'Prefix', type: 'TEXT', w: 20, h: 16 },
      { name: 'Icon container', type: 'INSTANCE', instanceOf: 'Icon container', w: 20, h: 20 },
      { name: 'Value', type: 'TEXT', w: 200, h: 16 } ] } ] }] },
  // A State layer is an instance in the middle of the field by construction,
  // and the first real run called it an adornment.
  { name: 'Password input', props: {}, variants: [{ name: 'v', type: 'COMPONENT', w: 300, h: 40, children: [
    { name: 'Field', type: 'FRAME', w: 300, h: 40, children: [
      { name: 'Value', type: 'TEXT', w: 260, h: 16 },
      { name: 'State layer', type: 'INSTANCE', instanceOf: 'State layer', w: 300, h: 40 },
      { name: 'Icon container', type: 'INSTANCE', instanceOf: 'Icon container', w: 20, h: 20 },
      { name: 'Focus ring', type: 'RECTANGLE', w: 308, h: 48 } ] } ] }] },
  { name: 'Search input', props: {}, variants: [{ name: 'v', type: 'COMPONENT', w: 300, h: 40, children: [
    { name: 'Field', type: 'FRAME', w: 300, h: 40, children: [
      { name: 'Icon container', type: 'INSTANCE', instanceOf: 'Icon container', w: 20, h: 20 },
      { name: 'Placeholder', type: 'TEXT', w: 260, h: 16 } ] } ] }] },
  { name: 'Chip', props: { Icon: 'BOOLEAN' }, variants: [{ name: 'v', type: 'COMPONENT', w: 80, h: 24, children: [
    { name: 'Label', type: 'TEXT', w: 40, h: 16 },
    { name: 'close', type: 'INSTANCE', instanceOf: 'Icon', w: 16, h: 16 } ] }] },
  { name: 'Dropdown input', props: { 'Value text': 'TEXT' }, variants: [{ name: 'v', type: 'COMPONENT', w: 300, h: 40, children: [] }] },
  { name: 'Badge', props: {}, variants: [{ name: 'v', type: 'COMPONENT', w: 20, h: 20, children: [
    { name: 'Icon', type: 'INSTANCE', instanceOf: 'Icon', w: 24, h: 16 } ] }] },
];
const tmap = { 'Text input': 'TextField', 'Search input': 'TextField', Chip: 'Chip', 'Dropdown input': 'Select', Badge: 'Badge' };
const muiTree = validate(treeComps, 'web', { framework: 'mui', frameworkMap: tmap });
const t1 = (id) => muiTree.filter((f) => f.class === id);
ok('mui · an icon between the prefix and the value has no adornment position',
  t1('MU5').length === 1 && t1('MU5')[0].component === 'Text input');
ok('mui · a leading icon is a start adornment and raises nothing',
  !t1('MU5').some((f) => f.component === 'Search input'));
ok('mui · overlays do not count toward a position: the trailing icon is still last',
  !t1('MU5').some((f) => f.component === 'Password input'));
ok('mui · a Chip trailing icon behind a boolean that is not a delete affordance',
  t1('MU6').length === 1 && /deleteIcon/.test(t1('MU6')[0].detail));
// MU7 was withdrawn: a `Value text` property is how a Select's DISPLAYED
// value is set, not evidence of typing, and it flagged a Dropdown input that
// sits beside its own Autocomplete — the split the rule was looking for.
ok('mui · the withdrawn Select/Autocomplete rule raises nothing', !t1('MU7').length);
ok('mui · a non-square icon is stretched by font-size sizing',
  t1('MU8').length === 1 && /24×16/.test(t1('MU8')[0].detail));
ok('mui · and a square one is not', !t1('MU8').some((f) => f.component === 'Chip'));

// ---- the five classes that were reporting things that were not true -----
// Each one was measured against a real library, and each disagreed with its
// own reference's Detect line. They are grouped because they share a cause:
// a predicate written slightly wider than the sentence it implements.
{
  // W3 · "a group of choice controls" is two or more, and the words are
  // whole: `option` unanchored matched a text layer named "Optional".
  const optional = [{ name: 'Field', props: {}, variants: [{ name: 'Field', type: 'COMPONENT', w: 200, h: 60, layout: 'VERTICAL', children: [
    { name: 'Label', type: 'TEXT', w: 100, h: 16, text: 'Name', textStyle: 'Label/sm' },
    { name: 'Optional', type: 'TEXT', w: 100, h: 16, text: 'Optional', textStyle: 'Label/sm' }] }] }];
  ok('W3 · a layer named "Optional" is not a choice control', !validate(optional, 'web').some((x) => x.class === 'W3'));

  const oneRow = [{ name: 'Dropdown menu', props: {}, variants: [{ name: 'Dropdown menu', type: 'COMPONENT', w: 200, h: 60, layout: 'VERTICAL', children: [
    { name: 'Label', type: 'TEXT', w: 100, h: 16, text: 'Sort', textStyle: 'Label/sm' },
    { name: 'Item', type: 'INSTANCE', instanceOf: 'Menu item', w: 200, h: 32 }] }] }];
  ok('W3 · one row under a label is a menu, not a fieldset', !validate(oneRow, 'web').some((x) => x.class === 'W3'));

  // W2 · the field row, not every row of an input-like component.
  const msg = [{ name: 'Text input', props: {}, variants: [{ name: 'Text input', type: 'COMPONENT', w: 200, h: 80, layout: 'VERTICAL', children: [
    { name: 'Feedback message', type: 'FRAME', w: 200, h: 20, layout: 'HORIZONTAL', children: [
      { name: 'circle-alert', type: 'INSTANCE', instanceOf: 'Icon/circle-alert', w: 16, h: 16 },
      { name: 'Message', type: 'TEXT', w: 160, h: 16, text: 'Required', textStyle: 'Label/sm' }] }] }] }];
  ok('W2 · an icon in a message row under the field is not the input', !validate(msg, 'web').some((x) => x.class === 'W2'));

  // A14 · an "Icon button" is a touch target, not a glyph to resize to 24.
  const btn = [{ name: 'Composer', props: {}, variants: [{ name: 'Composer', type: 'COMPONENT', w: 200, h: 60, children: [
    { name: 'Icon button', type: 'INSTANCE', instanceOf: 'Icon button', w: 44, h: 44 }] }] }];
  ok('A14 · an Icon button is not an icon', !validate(btn, 'android').some((x) => x.class === 'A14'));

  // I7 · two fill siblings holding no text are not the uneven-text case.
  const dividers = [{ name: 'Marker', props: {}, variants: [{ name: 'Marker', type: 'COMPONENT', w: 200, h: 20, layout: 'HORIZONTAL', children: [
    { name: 'Divider', type: 'RECTANGLE', w: 100, h: 1, sizing: 'FILL/FIXED' },
    { name: 'Divider', type: 'RECTANGLE', w: 100, h: 1, sizing: 'FILL/FIXED' }] }] }];
  ok('I7 · two fill dividers carry no text, so no uneven-split finding', !validate(dividers, 'ios').some((x) => x.class === 'I7'));
  ok('A2 · but Android detects them, because its Detect line has no text test', validate(dividers, 'android').some((x) => x.class === 'A2'));

  // A8 · spread is iOS's question; Compose has dropShadow.
  const spread = [{ name: 'Card', props: {}, variants: [{ name: 'Card', type: 'COMPONENT', w: 100, h: 100, effects: ['DROP_SHADOW:spread'], effect: 'style' }] }];
  ok('A8 · a spread shadow is not an Android finding', !validate(spread, 'android').some((x) => x.class === 'A8'));
  ok('I9 · but it is an iOS one, because .shadow has no spread', validate(spread, 'ios').some((x) => x.class === 'I9' && /spread/.test(x.detail)));
}

// ---- one decision per layer per advice ---------------------------------
// A dropdown holds a different sub-component in each of three variants, so
// W12 fired three times on one `Items slot`: three rows, one identical
// recommendation, nothing in their titles to tell them apart. The rule is
// general — the key is the advice, not the particular that triggered it — so
// no rule has to remember to ask for it.
{
  const kids = (of) => Array.from({ length: 6 }, () => ({ name: 'Item', type: 'INSTANCE', instanceOf: of, w: 200, h: 32 }));
  const dropdown = [{ name: 'Dropdown menu', props: {}, variants: [
    { name: 'Selection=Single', type: 'COMPONENT', w: 200, h: 200, children: [
      { name: 'Items slot', type: 'FRAME', w: 200, h: 192, children: kids('Dropdown menu - Single selection / A') }] },
    { name: 'Selection=Multiple', type: 'COMPONENT', w: 200, h: 200, children: [
      { name: 'Items slot', type: 'FRAME', w: 200, h: 192, children: kids('Dropdown menu - Multiple selection / A') }] },
    { name: 'Selection=Contextual', type: 'COMPONENT', w: 200, h: 200, children: [
      { name: 'Items slot', type: 'FRAME', w: 200, h: 192, children: kids('Dropdown menu - Contextual options / A') }] },
  ] }];
  const w12 = validate(dropdown, 'web').filter((f) => f.class === 'W12');
  ok('W12 \u00b7 one slot, one decision, however many samples set it off', w12.length === 1);
  ok('W12 \u00b7 and every particular it covers is kept', w12[0].details && w12[0].details.length === 3);

  // But a layer raising two DIFFERENT questions still gets two rows: two
  // answers are two decisions, and the advice is what tells them apart.
  const two = [{ name: 'Card', props: {}, variants: [{ name: 'Card', type: 'COMPONENT', w: 100, h: 100, children: [
    { name: 'Glow', type: 'RECTANGLE', w: 100, h: 100, fills: ['GRADIENT_DIAMOND'], blendMode: 'PLUS_LIGHTER', effect: 'style' }] }] }];
  const w11 = validate(two, 'web').filter((f) => f.class === 'W11' && f.layer === 'Glow');
  ok('W11 \u00b7 a gradient and a blend on one layer are two decisions, not one', w11.length === 2);
}

// ---- a finding names things the way a person says them ------------------
// Figma records an instance against its whole variant path. Quoted whole, the
// finding read: 6 identical "_File explorer - Section / L2 / Subfolders=True,
// Expanded=False" instances — and nothing in it tells a reader which words
// are the component and whether the property values matter. They do not.
{
  const kids = Array.from({ length: 6 }, () => ({ name: 'Item', type: 'INSTANCE',
    instanceOf: '_File explorer - Section / L2 / Subfolders=True, Expanded=False', w: 200, h: 32 }));
  const listy = [{ name: 'File explorer', props: {}, variants: [{ name: 'File explorer', type: 'COMPONENT', w: 200, h: 200,
    children: [{ name: 'Sub-items slot', type: 'FRAME', w: 200, h: 192, children: kids }] }] }];
  const f = validate(listy, 'web').find((x) => x.class === 'W12');
  ok('W12 \u00b7 names the component, not its whole variant path',
     f && f.detail === 'holds 6 copies of "_File explorer - Section" as sample content, and is not a slot');
  // CV1: a set whose own name holds " / " is named whole, from the names known
  const cells = Array.from({ length: 5 }, () => ({ name: 'Cell', type: 'INSTANCE', instanceOf: 'Table - Cell / Fill / Size=md', w: 200, h: 32 }));
  const table = [{ name: 'Table', props: {}, variants: [{ name: 'Table', type: 'COMPONENT', w: 200, h: 200, children: [{ name: 'Rows', type: 'FRAME', w: 200, h: 160, children: cells }] }] }];
  const g = validate(table, 'web', { known: ['Table', 'Table - Cell', 'Table - Cell / Fill'] }).find((x) => x.class === 'W12');
  ok('W12 · a component whose own name holds a spaced slash is named whole, from the known names (CV1)',
     g && g.detail === 'holds 5 copies of "Table - Cell / Fill" as sample content, and is not a slot');
}

/*
 * A SLOT answers the range question itself.
 *
 * W12 used to count the copies drawn inside any container, which inside a
 * slot asks what the slot's own settings already say — and raised a row
 * against every slot in a library. For a slot the finding is the SETTING.
 */
{
  /*
   * The slot's settings live on the PROPERTY, not the node — a slot is a
   * component property of the set, and its limits and preferred instances
   * are on that definition. Reading the node could only ever see the limits.
   */
  const set = (slots) => [{ name: 'App header', props: { 'Tabs slot': 'SLOT' }, ...(slots ? { slots } : {}),
    variants: [{ name: 'App header', type: 'COMPONENT', w: 400, h: 60, children: [
      { name: 'Tabs slot', type: 'SLOT', w: 400, h: 40, children:
        Array.from({ length: 6 }, () => ({ name: 'Tab', type: 'INSTANCE', instanceOf: 'Tab', w: 60, h: 40 })) }] }] }];
  const w12 = (comps) => validate(comps, 'web').filter((x) => x.class === 'W12');

  const open = w12(set({ 'Tabs slot': { settings: { minChildren: null, maxChildren: null }, preferred: ['Tab'] } }));
  ok('W12 \u00b7 a slot with neither limit set is the finding',
     open.length === 1 && open[0].detail === 'a slot that does not say how many layers may go in it (Minimum and Maximum layers are both None)');
  ok('W12 \u00b7 it is filed against the slot, not the node it drew',
     open[0].layer === 'Tabs slot');
  ok('W12 \u00b7 and it does not count the samples drawn in it', !/copies/.test(open[0].detail));

  const none = w12(set({ 'Tabs slot': { settings: { minChildren: null, maxChildren: null }, preferred: [] } }));
  ok('W12 \u00b7 an unset range and no preferred instance are ONE row, naming both',
     none.length === 1 && none[0].detail ===
     'a slot that does not say how many layers may go in it (Minimum and Maximum layers are both None), nor which components may go in it (no preferred instances)');

  const bare = w12(set({ 'Tabs slot': { settings: { minChildren: 1, maxChildren: 8 }, preferred: [] } }));
  ok('W12 \u00b7 a slot with a range but no preferred instance says only that',
     bare.length === 1 && bare[0].detail === 'a slot that does not say which components may go in it (no preferred instances)');

  ok('W12 \u00b7 a slot with a maximum is settled',
     w12(set({ 'Tabs slot': { settings: { minChildren: null, maxChildren: 8 }, preferred: ['Tab'] } })).length === 0);
  ok('W12 \u00b7 a slot with a minimum is settled',
     w12(set({ 'Tabs slot': { settings: { minChildren: 0, maxChildren: null }, preferred: ['Tab'] } })).length === 0);
  // Absent is not "left open": a snapshot taken before the plugin recorded
  // the definition cannot be told to fix something this reader cannot see.
  ok('W12 \u00b7 a snapshot predating the field is left alone', w12(set(null)).length === 0);

  /*
   * A slot the plugin READ but that carries no settings object is at its
   * defaults, which is no limits — so the question is asked. Figma creates
   * the object only when a setting is touched, and 14 of one library's 29
   * slots have none: requiring `minChildren` to be present asked the limits
   * question of 15 of them and said nothing about the other 14.
   *
   * `fields` is what separates "read, and Figma had none" from "this
   * snapshot cannot see it". Without an assertion here, deleting the guard
   * entirely left the suite green.
   */
  const defaulted = w12(set({ 'Tabs slot': { description: '', preferred: ['Tab'], fields: ['type', 'description', 'preferredValues'] } }));
  ok('W12 \u00b7 a slot read with no settings object is at its defaults, so the limits question IS asked',
     defaulted.length === 1 && /Minimum and Maximum layers are both None/.test(defaulted[0].detail));
  ok('W12 \u00b7 and a slot with neither settings nor fields still says nothing',
     w12(set({ 'Tabs slot': { description: '', preferred: ['Tab'] } })).length === 0);
  /*
   * A layer named after a declared slot is that slot's own container —
   * `Dropdown menu` draws `Items slot` as a frame inside the slot of the
   * same name. Counting its samples repeated the property's row under a
   * second wording: 33 rows on the real library where there are 31.
   */
  const dup = validate([{ name: 'Dropdown menu', props: { 'Items slot': 'SLOT' },
    slots: { 'Items slot': { settings: { minChildren: 1, maxChildren: 8 }, preferred: ['Item'] } },
    variants: [{ name: 'v', type: 'COMPONENT', w: 200, h: 200, children: [
      { name: 'Items slot', type: 'FRAME', w: 200, h: 192, children:
        Array.from({ length: 6 }, () => ({ name: 'Item', type: 'INSTANCE', instanceOf: 'Item', w: 200, h: 32 })) }] }] }],
    'web').filter((x) => x.class === 'W12');
  ok('W12 \u00b7 a frame named after a declared slot is that slot, not a second finding', dup.length === 0);

  /*
   * Each slot's advice carries ITS OWN evidence.
   *
   * Every slot missing its limits looks like one finding repeated, and is
   * not — a dialog's Content slot and a dropdown's Items slot want different
   * numbers. The sample content a designer drew is the input to choosing
   * this slot's own, so the row states it, and states a range where the
   * variants disagree.
   */
  const drawnWith = (counts) => {
    const comps = [{ name: 'X', props: { 'S': 'SLOT' }, slots: { S: { settings: { minChildren: null, maxChildren: null } } },
      variants: counts.map((n, i) => ({ name: 'v' + i, type: 'COMPONENT', w: 100, h: 100, children: [
        { name: 'S', type: 'SLOT', w: 100, h: 90, children: Array.from({ length: n }, () => ({ name: 'I', type: 'INSTANCE', instanceOf: 'I', w: 100, h: 10 })) }] })) }];
    return validate(comps, 'web').filter((x) => x.class === 'W12')[0];
  };
  ok('W12 \u00b7 one count reads as a count', /drawn with 6 items today/.test(drawnWith([6]).align));
  ok('W12 \u00b7 one item is singular', /drawn with 1 item today/.test(drawnWith([1]).align));
  // `plural` here is (n, one, many) and returns the WORD, not the count — a
  // different signature from the docs site's, which made this read "drawn
  // with undefined today" on its first run against a real library.
  ok('W12 \u00b7 and never "undefined"', !/undefined/.test(drawnWith([6]).align));
  ok('W12 \u00b7 an empty slot says so rather than "0 items"',
     /drawn with nothing in it today/.test(drawnWith([0]).align));
  ok('W12 \u00b7 variants that disagree give the range',
     /drawn with 1, 3, 10 items across its variants/.test(drawnWith([10, 1, 3]).align));

  ok('W12 \u00b7 a field the runtime never exposed is not read as empty',
     w12(set({ 'Tabs slot': { settings: { minChildren: null, maxChildren: null } } }))[0].detail ===
     'a slot that does not say how many layers may go in it (Minimum and Maximum layers are both None)');
}

// ---- the names themselves -----------------------------------------------
// The map already holds each component's counterpart, so the difference is
// free to report — and reporting it turns a hand-written list of renames into
// something a run regenerates. One project's alignment study listed about
// forty by hand, true on the day it was written with no way to stay true.
{
  const named = [
    { name: 'Spinner', props: {}, variants: [{ name: 'Spinner', type: 'COMPONENT', w: 24, h: 24 }] },
    { name: 'Button', props: { Role: ['Primary', 'Secondary'] }, variants: [{ name: 'Button', type: 'COMPONENT', w: 80, h: 32 }] },
    { name: 'Chip', props: { variant: ['Filled', 'Outlined'] }, variants: [{ name: 'Chip', type: 'COMPONENT', w: 60, h: 24 }] },
  ];
  const map = { Spinner: 'CircularProgress', Button: 'Button', Chip: 'Chip' };
  const out = validate(named, 'web', { framework: 'mui', frameworkMap: map });
  const of = (cls) => out.filter((f) => f.class === cls);

  ok('MU9 · a component the build calls something else', of('MU9').length === 1 &&
     of('MU9')[0].component === 'Spinner' && /CircularProgress/.test(of('MU9')[0].detail));
  ok('MU9 · and one whose name already matches raises nothing',
     !of('MU9').some((f) => f.component === 'Button' || f.component === 'Chip'));
  ok('MU10 · an axis that means a prop but is not named for it', of('MU10').length === 1 &&
     of('MU10')[0].layer === 'Role' && /variant/.test(of('MU10')[0].detail));
  ok('MU10 · and an axis already named for its prop raises nothing',
     !of('MU10').some((f) => f.component === 'Chip'));
  // Both carry the counterpart, so both rows render as a comparison.
  ok('MU9 and MU10 both state what the build calls it',
     of('MU9')[0].expected === 'CircularProgress' && of('MU10')[0].expected === 'variant');
  // A component with no entry in the map is not renamed by guesswork.
  ok('MU9 · an unmapped component is left alone',
     !validate([{ name: 'Nudger', props: {}, variants: [{ name: 'Nudger', type: 'COMPONENT', w: 40, h: 24 }] }],
               'web', { framework: 'mui', frameworkMap: map }).some((f) => f.class === 'MU9'));
}

// ---- what the map does not name -----------------------------------------
// A component with no entry is checked by no framework rule and reads as
// clean. One library had 18 of 84 public components mapped; the run said so
// in a closing line nobody read. It is a finding now: one row against the
// map, naming every component still to be decided.
{
  const comp = (name) => ({ name, props: {}, variants: [{ name, type: 'COMPONENT', w: 40, h: 24 }] });
  const lib = ['Button', 'Org switcher', 'Spinner', 'Toast', '_Card - Header', 'Table - Cell / _Inner'].map(comp);
  const map = { Button: 'Button', 'Org switcher': null };
  const mu11 = validate(lib, 'web', { framework: 'mui', frameworkMap: map }).filter((f) => f.class === 'MU11');
  ok('MU11 · components the map does not name are one row, filed against the map',
     mu11.length === 1 && mu11[0].component === 'frameworkComponents' && mu11[0].key === 'MU11|frameworkComponents');
  ok('MU11 · the row names each of them', mu11[0].usedBy.join() === 'Spinner,Toast');
  ok('MU11 · null is an answer: a component recorded as having no counterpart is not raised',
     !mu11[0].usedBy.includes('Org switcher') && !unmappedFor(lib, map).includes('Org switcher'));
  ok('MU11 · a private part is left to its parent',
     !mu11[0].usedBy.some((n) => /_/.test(n)));
  ok('MU11 · its fix lands nowhere but the record', mu11[0].lands === 'accept');
  ok('MU11 · a fully named library raises nothing',
     !validate(lib, 'web', { framework: 'mui', frameworkMap: { ...map, Spinner: 'CircularProgress', Toast: 'Snackbar' } }).some((f) => f.class === 'MU11'));
  ok('MU11 · a null entry breaks no other rule',
     validate([comp('Org switcher')], 'web', { framework: 'mui', frameworkMap: map }).every((f) => !/^MU/.test(f.class)));
}

// ---- an instance is a placement, not this component's layers -----------
// The finding that would not go away: `_App header - Accessories` places one
// `Avatar` instance, and the smoothing sits on the INSTANCE node, inherited
// from Avatar. Stopping the descent was not enough — the instance itself was
// still being examined, so the header kept reporting a layer it does not
// contain, already listed under Avatar's own name.
{
  const placed = [{ name: 'Header', props: {}, variants: [{ name: 'Header', type: 'COMPONENT', w: 300, h: 60, children: [
    { name: 'Avatar', type: 'INSTANCE', instanceOf: 'Avatar', w: 48, h: 48, smoothing: 0.6,
      children: [{ name: 'Photo', type: 'RECTANGLE', w: 48, h: 48, mask: true }] },
    { name: 'Badge', type: 'INSTANCE', instanceOf: 'Badge', w: 16, h: 16, absolute: true }] }] }];
  const out = validate(placed, 'web');
  ok('instance · a drawing property inherited from the main component is not the parent\'s',
     !out.some((x) => x.class === 'W13'));
  ok('instance · nor is anything inside it', !out.some((x) => x.class === 'W15'));
  // But where it was PUT is the parent's doing, and those rules opt in.
  ok('instance · but where the parent placed it is', out.some((x) => x.class === 'W11' || x.class === 'W8') ||
     validate(placed, 'ios').some((x) => x.class === 'I8' && x.layer === 'Badge'));
}

// ---- the advice is written for the person who has to act on it ---------
// Two properties, both learned the hard way on a real board.
//
// An `accept` that does not say what the reader will SEE is a shrug: "accept:
// border-radius is circular; corner-shape is not Baseline" told a designer
// nothing about their file, and they said so.
//
// And a rule whose only advice is a code fix still has to explain the
// consequence in plain words, because it lands on a board a designer reads.
{
  const every = [...R.web, ...R.ios, ...R.android, ...mui, ...muiTree];
  const seen = new Map();
  for (const f of every) if (f.align) seen.set(f.align, f.class);
  // The vocabulary is a smell test, not grammar: it asks whether the sentence
  // names an OUTCOME at all. Widen it when a line genuinely says what happens
  // in a word not listed — that is the rule working, not failing.
  const SAYS_WHAT_HAPPENS = /\b(so|will|cannot|can't|does not|never|falls back|differ|grows|clips?|shifts?|fails?|hard to|collapse|disappears?|missing|appear)\b/i;
  const shrugs = [...seen].filter(([a]) => /\baccept\b/i.test(a) && !SAYS_WHAT_HAPPENS.test(a));
  ok(`advice · every "accept" says what the reader will see (${shrugs.length} that do not)`, shrugs.length === 0);
  if (shrugs.length) console.log('   ' + shrugs.map(([a, c]) => c + ': ' + a).join('\n   '));
  const bare = [...seen].filter(([a]) => !/in Figma:/.test(a) && !SAYS_WHAT_HAPPENS.test(a));
  ok(`advice · every code-only line explains its consequence (${bare.length} that do not)`, bare.length === 0);
  if (bare.length) console.log('   ' + bare.map(([a, c]) => c + ': ' + a).join('\n   '));
}

// ---- where a finding lands --------------------------------------------
// The classification itself, and then the guard that matters: EVERY rule of
// every target must produce one. A rule whose advice is written in a shape
// landsOf does not know renders as an unlabelled row on the board, and the
// maintainer's "what do I change in Figma" split silently loses it. This
// fails here instead, on the commit that writes it.
ok('lands · the four shapes read from the rule\'s own advice',
  landsOf('in Figma: collapse the pair') === 'figma' &&
  landsOf('in code: clip-path on the masked element') === 'code' &&
  landsOf('in Figma: the truncation setting; in code: line-clamp') === 'both' &&
  landsOf('accept: border-radius is circular') === 'accept' &&
  landsOf('') === null);

// Every finding this suite produces, across all three targets and every
// fixture, must carry a `lands`. A rule whose advice is written in a shape
// landsOf does not know renders as an unlabelled row and drops out of the
// maintainer's "what do I change in Figma" split.
//
// This asserts on FINDINGS, not on the source text. The first version of it
// scraped the advice strings out of validate.mjs with a regex, and that regex
// was wrong twice within an hour — it stopped at a helper's third argument
// (silently dropping two rules), and it could not survive a `)` inside an
// advice string such as `.blur(radius:)`. A guard that reads source text as
// prose is the thing it is guarding against.
{
  const every = [...R.web, ...R.ios, ...R.android, ...st, ...r33, ...mui, ...muiTree];
  const unlabelled = every.filter((f) => !f.lands);
  ok(`lands · all ${every.length} findings across three targets carry one (${unlabelled.length} that do not)`,
     unlabelled.length === 0);
}

// CLI: `--snapshot` is a flag, not an option with a value. The file after it
// was taken as its value, so a run with no --text-styles found no file and
// printed usage (found 2026-10-05, timing the validator over one library).
{
  const { spawnSync } = await import('node:child_process');
  const os = await import('node:os');
  const fsx = await import('node:fs');
  const pathx = await import('node:path');
  const f = pathx.join(os.tmpdir(), `cli-${process.pid}.json`);
  fsx.writeFileSync(f, JSON.stringify([{ name: 'Tag', props: {}, variants: [{ name: 'Default', type: 'COMPONENT', children: [] }] }]));
  const me = new URL('../scripts/validate.mjs', import.meta.url).pathname;
  const run = (...a) => spawnSync(process.execPath, [me, ...a], { encoding: 'utf8' });
  const after = run('--target', 'web', '--snapshot', f), before = run(f, '--target', 'web', '--snapshot');
  fsx.rmSync(f, { force: true });
  ok('CLI · the file may follow --snapshot, a flag that takes no value', after.status !== 2 && /"findings"/.test(after.stdout) && after.stdout === before.stdout);
}

{
  // The live reader, run as figma_execute runs it (a function body), against a fake page of two sets.
  const src = fs.readFileSync(new URL('../scripts/walk-figma.js', import.meta.url), 'utf8');
  const node = (type, name, extra = {}) => ({ type, name, width: 10, height: 10, visible: true, ...extra });
  const set = (id, name) => {
    const s = node('COMPONENT_SET', name, { id, componentPropertyDefinitions: {} });
    const v = node('COMPONENT', 'State=Rest', { parent: s, children: [node('TEXT', 'Hint', { visible: false, characters: 'x', lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PIXELS', value: 0 }, fontSize: 12 }), node('VECTOR', 'Icon')] });
    s.children = [v];
    return s;
  };
  const sets = [set('1:1', 'Chip'), set('2:2', 'Tag')];
  const figma = { mixed: Symbol('mixed'), currentPage: { findAll: (f) => sets.filter(f) }, getNodeByIdAsync: async (id) => sets.find((s) => s.id === id) || null, getStyleByIdAsync: async () => null };
  const run = (prefix) => new Function('figma', `${prefix}\n${src}`)(figma);
  const all = await run('');
  ok('walk-figma · no SCOPE walks every set on the page', all.map((c) => c.name).join() === 'Chip,Tag');
  ok('walk-figma · a prepended SCOPE walks those sets alone', (await run('const SCOPE = ["2:2"];')).map((c) => c.name).join() === 'Tag');
  const [hint, icon] = all[0].variants[0].children;
  ok('walk-figma · a hidden leaf layer is recorded hidden, a shown one is not', hint.hidden === true && icon.hidden === undefined);
}

console.log(`${n}/${n} passed`);
