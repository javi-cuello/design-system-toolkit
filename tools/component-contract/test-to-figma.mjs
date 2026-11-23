#!/usr/bin/env node
// tools/component-contract/to-figma.mjs: the plan a contract is drawn from.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { drawingPage, sizingAxes, varNamer, plan, figmaSide, pluginCode, verify, writeDrawn, variantKeys, needs, roundTrip, BEFORE, FAILED, PATCH_BEFORE, PATCH_AFTER, PATCH_FAILED, namedByKey, keyedNames, keptWhole, modeSets } from './to-figma.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const contract = { contract: 1, component: 'chip',
  props: { label: { type: 'string', figma: 'Label' }, icon: { type: 'boolean', default: true, figma: 'Icon', shows: ['icon'] },
    deletable: { type: 'boolean', default: false, figma: 'Deletable' }, feedback: { type: 'enum', values: ['danger', 'neutral'], default: 'neutral', figma: 'Feedback' } },
  anatomy: { root: { kind: 'container', layout: { padding: { end: 'Spacing/8' } }, background: 'B/neutral' }, icon: { kind: 'graphic', parent: 'root', order: 0, width: 16 }, label: { kind: 'text', parent: 'root', order: 1, content: '{label}' } },
  variants: [{ when: { feedback: 'danger' }, set: { 'root.background': 'B/danger' } },
    { when: { icon: false }, remove: ['icon'], set: { 'label.order': 0 } },
    { when: { deletable: true }, add: { close: { kind: 'graphic', parent: 'root', order: 2, width: 16, asset: 'x' } }, set: { 'root.layout': { padding: { end: 'Spacing/4' } } } }] };
const p = plan(contract, { axisOrder: ['Size', 'Role', 'Feedback', 'Disabled', 'State'] });
ok('a boolean that only shows layers stays a boolean; one that also restyles is a True/False axis; axes after booleans, Feedback in figma-standard rule 1\'s place',
  JSON.stringify(p.booleans) === '[{"figma":"Icon","default":true}]' && JSON.stringify(p.axes) === '["Deletable","Feedback"]');
ok('one variant per axis combination, the default first, values as the library writes them',
  p.variants.length === 4 && p.variants[0].name === 'Deletable=False, Feedback=Neutral' && p.variants.some((v) => v.name === 'Deletable=True, Feedback=Danger'));
const dd = p.variants.find((v) => v.name === 'Deletable=True, Feedback=Danger').anatomy;
ok('each variant drawn with every boolean on, the layers a boolean shows marked with it, text bound to its prop',
  dd.root.background === 'B/danger' && dd.close.asset === 'x' && dd.icon.shownBy === 'Icon' && !dd.label.shownBy && dd.label.text === 'Label' && dd.root.layout.padding.end === 'Spacing/4');
// a boolean the editor links to its part (shows) with no variant that removes it: still bound to that part's visibility
const linked = plan({ contract: 1, component: 'tag', props: { showIcon: { type: 'boolean', default: false, figma: 'Show icon', shows: ['icon'] } },
  anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/check' } }, variants: [] }, {});
ok('a part a boolean shows is bound to it, though no variant removes it', linked.variants[0].anatomy.icon.shownBy === 'Show icon' && !linked.variants[0].anatomy.root.shownBy);
// a label's Optional: Indicator takes the layer away when required, and the contract adds it back when not
const optional = plan({ contract: 1, component: 'label', props: { indicator: { type: 'boolean', default: true, figma: 'Indicator', shows: ['mark'] }, required: { type: 'boolean', default: true, axis: true, figma: 'Required' } },
  anatomy: { root: { kind: 'container' }, mark: { kind: 'text', parent: 'root', content: '*' } },
  variants: [{ when: { indicator: false }, remove: ['mark'] }, { when: { indicator: false, required: false }, add: { mark: { kind: 'text', parent: 'root', content: 'Optional' } } }] }, {});
const req = (v) => optional.variants.find((x) => x.name === `Required=${v}`).anatomy.mark;
ok('a boolean is bound only in the variants where turning it off takes its layer away', req('True').shownBy === 'Indicator' && !req('False').shownBy);
const both = plan({ contract: 1, component: 'tag', props: { a: { type: 'boolean', default: true, figma: 'A', shows: ['x'] }, b: { type: 'boolean', default: true, figma: 'B' } },
  anatomy: { root: { kind: 'container' }, x: { kind: 'text', parent: 'root', content: 'x' } }, variants: [{ when: { a: false, b: false }, remove: ['x'] }] }, {});
ok('a remove that also asks another boolean off leaves the layer bound to the one that shows it', both.variants[0].anatomy.x.shownBy === 'A');
const loading = plan({ contract: 1, component: 'button', props: { loading: { type: 'boolean', default: false, figma: 'Loading' } },
  anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: 'Label' } },
  variants: [{ when: { loading: true }, add: { spinner: { kind: 'graphic', parent: 'root' } }, remove: ['label'] }] }, {});
ok('a boolean that hides a layer when on is an axis, so that layer is drawn where it is off', loading.axes.includes('Loading') && !loading.booleans.length && loading.variants.some((v) => v.anatomy.label));
const closed = plan({ contract: 1, component: 'dialog', props: { open: { type: 'boolean', default: true, figma: 'Open' } },
  anatomy: { root: { kind: 'container' }, body: { kind: 'container', parent: 'root' } }, variants: [{ when: { open: false }, remove: ['root', 'body'] }] }, {});
ok('a prop that takes the whole component away is not drawn: Figma cannot hide a component\'s root', !closed.booleans.length && !closed.axes.length && closed.variants.length === 1 && !closed.variants[0].anatomy.root.shownBy && /^Open /.test(closed.notDrawn[0]));
const hidden = plan({ contract: 1, component: 'toast', props: { state: { type: 'enum', values: ['rest', 'hover', 'hidden'], default: 'rest', figma: 'State' } },
  anatomy: { root: { kind: 'container' } }, variants: [{ when: { state: 'hidden' }, remove: ['root'] }] }, {});
ok('an enum keeps its axis and drops only the value that takes the component away', hidden.axes.includes('State') && hidden.variants.length === 2 && hidden.variants.every((v) => !/hidden/.test(v.name)) && hidden.notDrawn[0] === 'State=hidden (takes the whole component away)');
const named = plan({ contract: 1, component: 'tag', props: { showIcon: { type: 'boolean', default: true, figma: 'Show icon', shows: ['showIconIcon', 'showMore'] } },
  anatomy: { root: { kind: 'container' }, showIconIcon: { kind: 'container', parent: 'root' }, showMore: { kind: 'container', parent: 'root' } }, variants: [] }, {});
ok('a shown layer drops its boolean\'s prefix at a word\'s edge only', named.variants[0].anatomy.showIconIcon.name === 'Icon' && named.variants[0].anatomy.showMore.name !== 'More');
// the properties are made in the contract's order, which Figma's panel keeps: Show icon, the Icon it reveals, then Label
const chipContract = { contract: 1, component: 'chip', props: { showIcon: { type: 'boolean', default: false, figma: 'Show icon', shows: ['icon'] }, icon: { type: 'instance', figma: 'Icon', swaps: ['icon'] }, label: { type: 'string', default: 'Label', figma: 'Label' }, state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', figma: 'State' } },
  anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/check' } }, variants: [] };
const chip = plan(chipContract, {});
ok('the properties are made in the contract\'s order', JSON.stringify(chip.order) === '["Show icon","Icon","Label","State"]' && /for \(const name of P\.order/.test(pluginCode(chipContract, {})));

// a button its own boolean shows, in a row another shows: each linked to its own
const rowed = plan({ contract: 1, component: 'bar', props: { showSecond: { type: 'boolean', default: true, figma: 'Show second', shows: ['row/b'] }, showButtons: { type: 'boolean', default: true, figma: 'Show buttons', shows: ['row'] } },
  anatomy: { root: { kind: 'container' }, row: { kind: 'container', parent: 'root' }, 'row/b': { kind: 'instance', parent: 'row', component: 'Button' } },
  variants: [{ when: { showButtons: false }, remove: ['row', 'row/b'] }, { when: { showSecond: false }, remove: ['row/b'] }] }, {});
ok('a layer its own boolean shows is linked to it, not to the one that shows the row it is in', rowed.variants[0].anatomy['row/b'].shownBy === 'Show second' && rowed.variants[0].anatomy.row.shownBy === 'Show buttons');

// what the library drew is drawn back: its own names and spellings, its boolean properties, its swaps
const libC = { contract: 1, component: 'Menu/Item / Default', props: {
  size: { type: 'enum', values: ['lg', 'sm'], figmaValues: ['lg', 'sm'], default: 'lg', figma: 'Size' },
  showIcon: { type: 'boolean', default: false, figma: 'Show icon', shows: ['icon'] },
  i20: { type: 'instance', figma: 'Icon (20)', swaps: ['icon'] }, i16: { type: 'instance', figma: 'Icon (16)', swaps: ['icon'] } },
  anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/x', swappedBy: 'i20' } },
  variants: [{ when: { size: 'sm' }, set: { 'icon.swappedBy': 'i16' } }, { when: { showIcon: true, size: 'sm' }, set: { 'root.width': 40 } }] };
const lib = plan(libC, {});
ok('a name Figma gave is kept, and an option spelt as Figma spells it', lib.name === 'Menu/Item / Default' && lib.variants.map((v) => v.name).join() === 'Size=lg,Size=sm');
ok('a boolean that only shares a layer with an axis stays a property', lib.booleans.some((b) => b.figma === 'Show icon') && !lib.axes.includes('Show icon'));
ok('each swap property is drawn, linked to the instance that is its at each value, or to any that lists it where none is named', lib.swaps.map((x) => x.figma).join() === 'Icon (20),Icon (16)'
  && lib.variants[0].anatomy.icon.swapProps.join() === 'Icon (20)' && lib.variants[1].anatomy.icon.swapProps.join() === 'Icon (16)'
  && plan({ ...libC, anatomy: { ...libC.anatomy, icon: { ...libC.anatomy.icon, swappedBy: undefined } }, variants: [] }, {}).variants[0].anatomy.icon.swapProps.join() === 'Icon (20),Icon (16)');

// the keys an instance records in the snapshot: its set's, by variant name, only for the components asked for
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'to-figma-'));
fs.mkdirSync(path.join(dir, 'chip')); fs.mkdirSync(path.join(dir, 'empty'));
fs.writeFileSync(path.join(dir, 'chip', 'figma.json'), JSON.stringify({ variants: [{ children: [{ type: 'INSTANCE', instanceOf: 'Icon/check / Size=16', instanceOfKey: 'k16', children: [{ type: 'INSTANCE', instanceOf: 'Badge', instanceOfKey: 'kb' }] }, { type: 'INSTANCE', instanceOf: 'Avatar / Size=sm', instanceOfKey: 'ka' }, { type: 'INSTANCE', instanceOf: 'Menu/Item / Default / State=Rest', instanceOfKey: 'km' }] }] }));
const vk = variantKeys(dir, ['Badge', 'Menu/Item / Default'], ['check', 'Label']);
fs.rmSync(dir, { recursive: true, force: true });
ok('the snapshot names each placed component\'s key by its variant, nested ones too, a name holding " / " whole, a swap\'s by its last name, and only those asked for',
  JSON.stringify(vk) === '{"Icon/check":{"Size=16":"k16"},"Badge":{"Badge":"kb"},"Menu/Item / Default":{"State=Rest":"km"}}');

{
  // a focus ring at a point, stretched with its box: constrained only once the box has its final size (constrained
  // before, the box shrinking to hug its contents flipped it, off its box)
  const code = pluginCode(contract, {});
  ok('a part\'s constraints are set after every box has its final size', code.indexOf('n.constraints =') > code.indexOf('toStyle.map'));
}
ok('the plugin code carries each distinct element once', (pluginCode(contract, {}).match(/"kind":"text"/g) || []).length === 1);

// the drawing read back: one variant drawn right, one with a colour bound to the wrong variable, one not drawn
const vp = { variants: [{ name: 'A', anatomy: { root: { kind: 'container' }, label: { kind: 'text', name: 'Label', typography: 'T/sm', color: 'C/text' } } }, { name: 'B', anatomy: { root: { kind: 'container' }, icon: { kind: 'graphic', name: 'Icon', background: 'C/icon' } } }, { name: 'C', anatomy: { root: { kind: 'container' } } }] };
const rows = verify(vp, { variants: [{ variant: 'A', layers: { Label: { textStyle: 'T/sm', fill: 'C/text' } } }, { variant: 'B', layers: { Icon: { inner: 'C/other' } } }] });
ok('a drawing read back is held to its contract: the same, a different binding, nothing bound, a variant not drawn',
  rows.filter((r) => r.verdict === 'same').length === 2 && rows.find((r) => r.what === 'Icon colour').verdict === 'differs' && rows.find((r) => r.variant === 'C').verdict === 'not drawn');

const ip = { variants: [{ name: 'A', anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', name: 'Icon', component: 'Icon/check' }, badge: { kind: 'instance', name: 'Badge', component: 'Badge' } } }] };
ok('an instance is of its component by name or, as a swap names it, by its last name; another name differs',
  verify(ip, { variants: [{ variant: 'A', layers: { '(root)': {}, Icon: { instanceOf: 'check' }, Badge: { instanceOf: 'Tag' } } }] }).map((r) => r.verdict).join() === 'same,differs');

// the set's grid: a row per combination of the axes but the last, a column per value of the last
const gp = plan({ contract: 1, component: 'g', props: { a: { type: 'enum', values: ['p', 'q'], default: 'p', figma: 'A' }, b: { type: 'enum', values: ['r', 's', 't'], default: 'r', figma: 'B' } },
  anatomy: { root: { kind: 'container' } }, variants: [], invalid: [{ a: 'q', b: 's' }] }, {});
ok('each variant has its cell in the set\'s grid; one not drawn leaves its cell empty, the rest of its row in their columns',
  gp.rows === 2 && gp.cols === 3 && JSON.stringify(gp.variants.find((v) => v.name === 'A=Q, B=T').cell) === '[1,2]' && gp.variants.length === 5);
ok('the plugin code carries each variant\'s cell', /"cell":\[1,2\]/.test(pluginCode({ ...gp, contract: 1, component: 'g', props: { a: { type: 'enum', values: ['p', 'q'], default: 'p', figma: 'A' }, b: { type: 'enum', values: ['r', 's', 't'], default: 'r', figma: 'B' } }, anatomy: { root: { kind: 'container' } }, variants: [], invalid: [{ a: 'q', b: 's' }] }, {})));
// a component with no axes is one variant: drawn as a component, read back as one
const one = plan({ contract: 1, component: 'divider', props: {}, anatomy: { root: { kind: 'container', background: 'C/line' } }, variants: [] }, {});
ok('a component with no axes is one variant, at the grid\'s one cell', one.variants.length === 1 && one.rows === 1 && one.cols === 1 && JSON.stringify(one.variants[0].cell) === '[0,0]');
ok('and its drawing, a component of its own name, is held to it', verify(one, { variants: [{ variant: 'Divider', layers: { '(root)': { fill: 'C/line' } } }] }).map((r) => r.verdict).join() === 'same');

// a prop the contract says is code's alone is no axis of the drawing: its other values' variants go
{
  const two = { contract: 1, component: 'tag', props: { size: { type: 'enum', values: ['sm', 'lg'], default: 'sm', figma: 'Size' }, graphic: { type: 'enum', values: ['none', 'cup'], default: 'none', only: 'code' } },
    anatomy: { root: { kind: 'container', background: 'C/a' } },
    variants: [{ when: { size: 'lg' }, set: { 'root.background': 'C/b' } }, { when: { graphic: 'cup' }, set: { 'root.background': 'C/c' } }, { when: { size: 'lg', graphic: 'none' }, set: { 'root.radius': 'R/1' } }] };
  const f = figmaSide(two);
  ok('a code-only prop is no axis of the drawing; a combination at its default stays, one away from it goes',
    !('graphic' in f.props) && f.variants.length === 2 && JSON.stringify(f.variants[1].when) === '{"size":"lg"}' && plan(two).variants.length === 2);
  { const pin = (y) => ({ contract: 1, component: 'P', props: {}, anatomy: { root: { kind: 'container' }, dot: { kind: 'graphic', parent: 'root', absolute: { x: 0, y } } }, variants: [] });
    const n = (a, b, o = { layoutUnit: true }) => roundTrip(pin(a), pin(b), o).rows.filter((r) => r.at.startsWith('dot.absolute')).length;
    ok('a place within a browser\'s layout unit (1/64 px) of the design\'s is the same place where a browser read it; one further is not, nor any difference between Figma\'s own numbers', n(30.78, 30.77) === 0 && n(-15.76, -15.75) === 0 && n(30.78, 30.75) === 1 && n(30.78, 30.76) === 0 && n(30.78, 30.77, {}) === 1);
    // (a size too: a checkbox's mark drawn 8.65 wide lays out at 553/64 px, read back 8.64)
    const box = (w) => ({ contract: 1, component: 'P', props: {}, anatomy: { root: { kind: 'container' }, mark: { kind: 'graphic', parent: 'root', width: w, height: 7.23 } }, variants: [] });
    const m = (a, b, o = { layoutUnit: true }) => roundTrip(box(a), box(b), o).rows.length;
    ok('a size within a browser\'s layout unit of the design\'s is the same size where a browser read it; one further is not, nor between Figma\'s own', m(8.65, 8.64) === 0 && m(8.65, 8.62) === 1 && m(8.65, 8.64, {}) === 1 && m('hug', 8.64) === 1); }
  ok('and the round trip compares no combination of it', roundTrip(two, two).combinations === 2);
  { // a text's own words where the design binds none are a difference from a reading bound to a prop, even where they are
    // that prop's default: Figma's layer there ignores the prop, code's follows it, and a reading at the defaults cannot
    // tell the two apart, so neither side is folded into the other
    const tx = (when, w) => ({ contract: 1, component: 'F', props: { style: { type: 'enum', values: ['a', 'b'], default: 'a', figma: 'Style' }, label: { type: 'string', default: 'Label', figma: 'Label', sets: ['label'] } },
      anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: '{label}' } }, variants: when ? [{ when, set: { 'label.content': w } }] : [] });
    const read = (w) => ({ contract: 1, component: 'F', code: { from: 'code' }, props: { style: { type: 'enum', values: ['a', 'b'], default: 'a', code: 'style', figma: 'Style' }, label: { type: 'string', code: 'label', figma: 'Label' } },
      anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: w } }, variants: [] });
    const rows = (a, b) => roundTrip(a, b, { layoutUnit: true }).rows.map((r) => `${r.at} ${r.library} ${r.drawn}`);
    ok('a literal the design holds stays a difference from a reading bound to the prop whose default it equals; read as the same literal, it is the same',
      rows(tx({ style: 'b' }, 'Label'), read('{label}')).join() === 'label.content Label {label}' && rows(tx(null), read('Label')).join() === 'label.content {label} Label'
      && rows({ ...tx(null), anatomy: { ...tx(null).anatomy, label: { kind: 'text', parent: 'root', content: 'Label' } } }, read('Label')).length === 0); }
  { // a row is a pointer state's (`pointer`) only where, at every combination it was found in, a variant of a pointer state
    // sets that field there: a search's query typed at focus and when filled, read wrong only at focus
    const st = (variants, pointer = ['hover', 'focus']) => ({ contract: 1, component: 'S', props: { state: { type: 'enum', values: ['rest', 'hover', 'focus', 'disabled'], default: 'rest', role: 'interaction', pointer, figma: 'State' }, selected: { type: 'boolean', default: false, figma: 'Selected' }, p: { type: 'string', default: 'Hint', figma: 'P', sets: ['t'] } },
      anatomy: { root: { kind: 'container' }, t: { kind: 'text', parent: 'root', content: '{p}' } }, variants });
    const design = st([{ when: { state: 'focus' }, set: { 't.content': 'Search' } }, { when: { selected: true }, set: { 't.content': 'Search' } }]);
    const o = { layoutUnit: true }, sel = { when: { selected: true }, set: { 't.content': 'Search' } };
    const [r] = roundTrip(design, st([sel]), o).rows, [h] = roundTrip(design, st([sel, { when: { state: 'hover', selected: true }, set: { 't.content': '{p}' } }]), o).rows;
    ok('a row found only where a pointer state sets the words says so; one found where another state sets them (hover and selected) does not, nor any between Figma drawings',
      r && r.pointer === true && r.in === 1 && h && h.in === 2 && h.pointer === undefined && roundTrip(design, st([sel])).rows[0].pointer === undefined);
    // (where a pointer state and another state that applies there both set the words, focus and selected, the markup holds
    // them through the other state: a wrong reading there stays a difference)
    const [fs] = roundTrip(design, st([sel, { when: { state: 'focus', selected: true }, set: { 't.content': '{p}' } }]), o).rows;
    ok('a row found where a pointer state and another state both set the words is no pointer state\'s', fs && fs.in === 2 && fs.pointer === undefined);
    // (held to a reading, the pointer states are the design's: a reading may force disabled as a pseudo state too)
    const reading = st([{ when: { state: 'disabled' }, set: { 't.content': 'Off' } }], ['hover', 'focus', 'disabled']);
    ok('the pointer states are the given design\'s, never the reading\'s own list', roundTrip(reading, st([]), { ...o, pointerFrom: st([]) }).rows[0].pointer === undefined && roundTrip(reading, st([]), o).rows[0].pointer === true); }
  ok('a combination the library does not draw is not compared, and counted', (() => { const r = roundTrip({ ...two, invalid: [{ size: 'lg' }] }, two); return r.combinations === 1 && r.invalid === 1; })());
  { // a placed instance's key is compared only where both sides hold one: a reading from code holds none
    const placed = (key) => ({ ...two, anatomy: { ...two.anatomy, i: { kind: 'instance', parent: 'root', component: 'Button', ...(key && { key }) } } });
    const at = (a, b) => roundTrip(placed(a), placed(b)).rows.filter((r) => r.at === 'i.key').length;
    ok('a key one side lacks is no row; two keys that differ are one', at('web', null) === 0 && at('web', 'mobile') === 1 && at('web', 'web') === 0);
    // where the components already differ (Icons/stars against Icons/stars_filled), their keys differing is that same difference
    const icon = (component, key) => ({ ...two, anatomy: { ...two.anatomy, i: { kind: 'instance', parent: 'root', component, key } } });
    const r = roundTrip(icon('Icons/stars', 'k1'), icon('Icons/stars_filled', 'k2')).rows;
    ok('where the components differ, the key is no second row', r.filter((x) => x.at === 'i.component').length === 1 && r.filter((x) => x.at === 'i.key').length === 0);
  }
  { // a placed instance's boolean axis in the design's spelling (true) and a reading's (True) is one value; a text is its own words
    const placed = (w) => ({ ...two, anatomy: { ...two.anatomy, i: { kind: 'instance', parent: 'root', component: 'Box', with: w } } });
    const rows = (a, b) => roundTrip(placed(a), placed(b)).rows.filter((r) => r.at.startsWith('i.with')).length;
    ok('a boolean word is the boolean in any case; true against False, or a text in another case, still differs',
      rows({ isChecked: 'true' }, { isChecked: 'True' }) === 0 && rows({ on: true }, { on: 'True' }) === 0 && rows({ isChecked: 'true' }, { isChecked: 'False' }) === 1 && rows({ Label: 'Go' }, { Label: 'go' }) === 1);
  }
  ok('every combination is compared unless a caller cuts them, and a cut is said, never silent', roundTrip(two, two).cut === undefined && roundTrip(two, two, { limit: 1 }).cut === 1 && roundTrip(two, two, { limit: 1 }).combinations === 1);
  const g = figmaSide({ ...two, variants: [{ when: { graphic: 'none' }, set: { 'root.radius': 'R/1' } }], invalid: [{ size: 'lg', graphic: 'none' }, { graphic: 'cup' }] });
  ok('a variant naming only its default holds everywhere; a combination not drawn loses it, or goes with its other values',
    g.variants.length === 1 && JSON.stringify(g.variants[0].when) === '{}' && JSON.stringify(g.invalid) === '[{"size":"lg"}]');
  ok('only a contract read from code recolours an instance', plan(two).fromCode === false && plan({ ...two, code: { from: 'code' } }).fromCode === true);
}

{ // a mode is set on every collection of its axis, each reached by one of its variables, its mode by the name Figma gives it
  const m = modeSets({ collections: { '2. Primitives - Colour': { modes: ['Light', 'Dark'], keys: { 'Blue/1': 'k1' } }, '3. Semantic': { modes: ['Light', 'Dark'], keys: { 'Text/strong': 'k2' } },
    '5. Responsive type': { modes: ['Desktop', 'Mobile'], hidden: ['Heading/size'], keys: { 'Heading/size': 'k5', 'Body/size': 'k3' } }, '1. Global': { modes: ['Mode 1'], keys: { 'S/1': 'k4' } } } });
  ok('each axis names its collections, a published variable of each, and its modes by the contract\'s spelling',
    m.theme.map((x) => x.key).join() === 'k1,k2' && m.theme[0].names.dark === 'Dark' && m['5-responsive-type'][0].names.mobile === 'Mobile' && m['5-responsive-type'][0].key === 'k3' && Object.keys(m).length === 2);
}

// a part turned a quarter is sized on the parent's axes in Figma: its own width by the vertical sizing, as derive reads it
ok('a part turned a quarter sets its own width by Figma\'s vertical sizing and its height by the horizontal; any other by its own axes',
  JSON.stringify(sizingAxes({ rotation: 90 }, true)) === '[["width","layoutSizingVertical"],["height","layoutSizingHorizontal"]]' && sizingAxes({ rotation: -90 }, true)[0][1] === 'layoutSizingVertical'
  && sizingAxes({ rotation: 45 }, true)[0][1] === 'layoutSizingHorizontal' && sizingAxes({}, true)[0][1] === 'layoutSizingHorizontal' && /const sizingAxes = function sizingAxes/.test(pluginCode(chipContract, {}))
  // (only a part code draws in a wrapper, to-code turnedParts, carried to the drawing as P.turned)
  && sizingAxes({ rotation: 90 }, false)[0][1] === 'layoutSizingHorizontal' && /"turned":\[\]/.test(pluginCode(chipContract, {})));

// the run's guards, run against a stand-in for Figma's file: its pages, and the plugin data each keeps
const data = () => { const d = {}; return { getPluginData: (k) => d[k] || '', setPluginData: (k, v) => { d[k] = v; } }; };
const page = (name) => ({ name, type: 'PAGE', children: [], ...data() });
const file = (names) => {
  const root = { children: names.map(page), ...data(), insertChild(i, p) { const at = this.children.indexOf(p); if (at >= 0) this.children.splice(at, 1); this.children.splice(i, 0, p); } };
  globalThis.figma = { root, currentPage: root.children[0], loadAllPagesAsync: async () => {}, getNodeByIdAsync: async () => null,
    createPage() { const p = page('Page'); root.children.push(p); return p; }, setCurrentPageAsync: async (p) => { globalThis.figma.currentPage = p; } };
  return root;
};
const Guarded = Object.getPrototypeOf(async () => {}).constructor;
const run = (code) => new Guarded(code)();
let root = file(['Alpha', 'Zeta']);
root.setPluginData('to-figma-running', String(Date.now())); root.setPluginData('to-figma-beat', String(Date.now()));
const refused = await run(BEFORE('Chip') + 'return { ran: true };');
ok('while another drawing runs, a run is refused before it makes a page or shows one',
  /still running/.test(refused.refused) && root.children.map((p) => p.name).join() === 'Alpha,Zeta' && figma.currentPage.name === 'Alpha');
root = file(['Alpha', 'Zeta']);
const ran = await run(BEFORE('Chip') + 'return { token: String(__token) };');
ok('with none running, it takes the file\'s token and draws on a page of its own name, put among the others by name',
  ran.token === root.getPluginData('to-figma-running') && root.children.map((p) => p.name).join() === 'Alpha,Chip,Zeta' && figma.currentPage.name === 'Chip');
root = file(['Alpha']);
const stale = await run(BEFORE('Chip') + `figma.root.setPluginData('to-figma-running', 'newer'); figma.currentPage.setPluginData('drawings', 'theirs'); ${FAILED} return { left: figma.currentPage.getPluginData('drawings'), token: figma.root.getPluginData('to-figma-running') };`);
ok('a run that fails after a newer one took over touches neither that run\'s record nor its token', stale.left === 'theirs' && stale.token === 'newer');
root = file(['Alpha']);
{ const gone = []; figma.getNodeByIdAsync = async (id) => ({ id, removed: false, remove() { gone.push(id); } });
  const quit = await run(BEFORE('Chip') + `__given.push('1:1', '1:2'); figma.root.setPluginData('to-figma-running', ''); try { throw new Error('any failure: its own, or a removed node'); } catch (e) { ${FAILED} return { token: figma.root.getPluginData('to-figma-running') }; }`);
  ok('a run given up on clears the parts it made, which its page\'s record never named, and leaves the token free', gone.join() === '1:1,1:2' && quit.token === ''); }
root = file(['Alpha']);
const given = await run(BEFORE('Chip', 123) + 'return String(__token);');
ok('the runner chooses the run\'s token, so it can take back its own and leave a newer run\'s alone', given === '123' && root.getPluginData('to-figma-running') === '123');
delete globalThis.figma;

// a drawing compared with the component it was derived from, field by field: what it named otherwise or left out
{
  const panel = plan({ contract: 1, component: 'panel', props: {
    items: { type: 'slot', figma: 'Items', settings: { minChildren: 1 }, description: 'What it lists', preferred: [] },
    showSearch: { type: 'boolean', default: false, figma: 'Show search', shows: ['showSearchSearchInput'] } },
  anatomy: { root: { kind: 'container', width: 'Size/panel', opacity: 'O/half', radius: ['R/4', 0, 'R/4', 0] },
    box: { kind: 'slot', parent: 'root', content: '{items}', border: { color: 'C/line', width: ['S/1', 0, 'S/1', 0] } },
    'box/option': { kind: 'container', parent: 'box' }, 'box/option_2': { kind: 'container', parent: 'box' },
    showSearchSearchInput: { kind: 'container', parent: 'root', name: 'Search input' }, 'showSearchSearchInput/field': { kind: 'container', parent: 'showSearchSearchInput' } }, variants: [] }, {});
  const a = panel.variants[0].anatomy;
  ok('a part is named as Figma names it: a repeat as the first, a name its id cannot say from the contract, a slot as its prop', a['box/option_2'].name === 'Option' && a.showSearchSearchInput.name === 'Search input' && a.box.name === 'Items');
  ok('a slot\'s settings and description go with the drawing', JSON.stringify(panel.slots) === '[{"figma":"Items","settings":{"minChildren":1},"description":"What it lists","preferred":[]}]');
  ok('a boolean shows the topmost of what it shows, not each layer inside it', a.showSearchSearchInput.shownBy === 'Show search' && !a['showSearchSearchInput/field'].shownBy);
  const want = needs({ variants: [{ anatomy: { root: { kind: 'container', width: 'Size/panel', opacity: 'O/half', radius: ['R/4', 0, 'R/4', 0], border: { color: 'C/line', width: ['S/1', 0, 'S/1', 0] }, layout: { wrap: true, crossGap: 'S/8' } } } }] }).vars;
  ok('every token a part is drawn with is looked up: a size, an opacity, a corner, a side, the gap between wrapped rows', ['Size/panel', 'O/half', 'R/4', 'S/1', 'S/8', 'C/line'].every((t) => want.includes(t)));
}

{
  // the update in place is one script the plugin runs: it must parse, with the target named and the version saved first
  const AsyncFunction = (async () => {}).constructor;
  const code = pluginCode({ component: 'Chip', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] }, {}, { before: PATCH_BEFORE('1:2'), after: PATCH_AFTER, failed: PATCH_FAILED });
  let parsed = true; try { new AsyncFunction(code); } catch { parsed = false; }
  ok('an update in place is one script that parses, saving a version before it changes anything', parsed && code.indexOf('saveVersionHistoryAsync') < code.indexOf('const P =') && code.includes('"1:2"'));
}

{
  // a drawing made inside the library's own file, which is not published: every import by key is asked of the file's
  // own components, sets, styles and variables first, listed only when the runner says the file is the library's
  const code = pluginCode({ component: 'Chip', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] }, {});
  const at = [...code.matchAll(/figma\.(?:variables\.)?import\w+ByKeyAsync\(/g)].map((m) => m.index);
  const unowned = at.filter((i) => !/own\([^\n]*$/.test(code.slice(Math.max(0, i - 160), i)));
  const block = code.slice(code.indexOf('if (K.ownFile) {'), code.indexOf('const lib = K.vars'));
  ok('a listing of the file that stalls or fails is never a token unbound (it is not under tried, so no patch is refused)', block.length > 0 && !block.includes('tried(') && block.includes('setTimeout'));
  ok('every import by key is asked of the open file first, and the file is listed only when it is the library', at.length > 0 && !unowned.length && /if \(K\.ownFile\) \{/.test(code) && code.includes('getLocalVariablesAsync'));
}

{
  // Review of 30 October 2026: --verify rewrote <report>.drawn.json with a new time on every run, nothing else changed
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drawn-'));
  const out = path.join(dir, 'chip.drawn.json');
  const rows = [{ variant: 'Feedback=neutral', what: 'Label colour', want: 'B/neutral', got: 'B/neutral', verdict: 'same' }];
  const first = writeDrawn(out, rows), was = fs.readFileSync(out, 'utf8');
  const again = writeDrawn(out, JSON.parse(JSON.stringify(rows)));
  ok('verify writes its .drawn.json when the rows are new, and leaves it untouched when they are the same',
    first === true && again === false && fs.readFileSync(out, 'utf8') === was);
  ok('verify rewrites it when a row changed', writeDrawn(out, [{ ...rows[0], got: null, verdict: 'not bound' }]) === true
    && JSON.parse(fs.readFileSync(out, 'utf8')).rows[0].verdict === 'not bound');
  fs.rmSync(dir, { recursive: true, force: true });
}


// roundTrip: a drawing from code held to the library's own component, by what each combination draws
{
  const lib = { contract: 1, component: 'Badge', props: { label: { type: 'string', default: 'Label', figma: 'Label' }, feedback: { type: 'enum', values: ['danger', 'info'], default: 'danger', figma: 'Feedback' } },
    anatomy: { root: { kind: 'container', background: 'Bg/danger' }, label: { kind: 'text', parent: 'root', color: 'Text/danger', content: '{label}' } },
    variants: [{ when: { feedback: 'info' }, set: { 'root.background': 'Bg/info', 'label.color': 'Text/info' } }] };
  // worded the other way round: info the default, its values in another order; it draws the same
  const same = { contract: 1, component: 'Badge', props: { label: { type: 'string', default: 'Label', figma: 'Label' }, feedback: { type: 'enum', values: ['info', 'danger'], default: 'info', figma: 'Feedback' } },
    anatomy: { root: { kind: 'container', background: 'Bg/info' }, label: { kind: 'text', parent: 'root', color: 'Text/info', content: '{label}' } },
    variants: [{ when: { feedback: 'danger' }, set: { 'root.background': 'Bg/danger', 'label.color': 'Text/danger' } }] };
  ok('a drawing worded differently that draws every combination the same has no difference', roundTrip(lib, same).rows.length === 0 && roundTrip(lib, same).combinations === 2);
  // a reading names its rest state `rest` where the design says Enabled (Carbon's button): a layer of the reading at rest
  // holds at the design's default state, as designCombo maps a render's rest to it; another state is still its own word
  {
    const st = (values, def, layers) => ({ contract: 1, component: 'Button', props: { type: { type: 'enum', values: ['text', 'icon'], default: 'text', figma: 'Type' }, state: { type: 'enum', values, default: def, figma: 'State', role: 'interaction', pointer: ['hover'] } },
      anatomy: { root: { kind: 'container' }, icon: { kind: 'container', parent: 'root', position: 'absolute', absolute: { x: 1, y: 1 } } }, variants: layers });
    const design = st(['enabled', 'hover'], 'enabled', [{ when: { type: 'icon' }, set: { 'icon.position': null, 'icon.absolute': null } }]);
    const reading = st(['rest', 'hover'], 'rest', [{ when: { type: 'icon' }, set: { 'icon.absolute': { x: 2, y: 1 } } }, { when: { type: 'icon', state: 'rest' }, set: { 'icon.position': null, 'icon.absolute': null } }, { when: { type: 'icon', state: 'hover' }, set: { 'icon.position': null, 'icon.absolute': null } }]);
    ok('a reading\'s layer at its rest state holds at the design\'s default state', roundTrip(design, reading).rows.length === 0
      && roundTrip(design, { ...reading, variants: reading.variants.slice(0, 2) }).rows.length === 2);
  }
  // the label an empty slot, as from-code drew Badge on 2026-11-12: the bindings check passed it
  const slot = JSON.parse(JSON.stringify(lib));
  slot.props = { children: { type: 'slot', figma: 'Children' }, feedback: lib.props.feedback };
  slot.anatomy.label = { kind: 'slot', parent: 'root', width: 100, height: 100, content: '{children}' };
  const r = roundTrip(lib, slot);
  ok('a text drawn as an empty slot is a difference in every combination, and so are the props', r.rows.some((x) => x.at === 'label.kind' && x.library === 'text' && x.drawn === 'slot' && x.in === 2) && r.rows.some((x) => x.at === 'props'));
  {
    const ic = (anatomy) => ({ contract: 1, component: 'Chip', props: {}, anatomy: { root: { kind: 'container' }, ...anatomy }, variants: [] });
    const figma = (g) => ic({ icon: { kind: 'instance', parent: 'root', component: 'Icon/house' }, 'icon/vector': { kind: 'graphic', parent: 'icon', background: 'Icon/strong', ...g } });
    const code = (c) => ic({ icon: { kind: 'instance', parent: 'root', component: 'Icon/house', background: c } });
    ok('an icon coloured on its glyph (Figma) and on the instance (code) is the same colour; another colour differs',
      roundTrip(figma(), code('Icon/strong')).rows.length === 0 && roundTrip(figma(), code('Icon/soft')).rows.length === 1);
    ok('a glyph that overrides more than its colour (its size) is compared as it is, never folded away',
      roundTrip(figma({ width: 16.67 }), figma({ width: 20 })).rows.length === 1 && roundTrip(figma({ width: 16.67 }), code('Icon/strong')).rows.length > 0);
    // a lone glyph's opacity shows at the instance's times its own (material3's disabled chip: 0.38 on the glyph, and on
    // the instance too where it is elevated), as code says it on the instance it colours
    const held = (e, g) => ic({ icon: { kind: 'instance', parent: 'root', component: 'Icon/house', ...e }, ...(g && { 'icon/vector': { kind: 'graphic', parent: 'icon', background: 'Icon/strong', ...g } }) });
    ok('a lone glyph\'s opacity is the instance\'s, times the instance\'s own; another opacity differs',
      roundTrip(held({}, { opacity: 0.38 }), held({ background: 'Icon/strong', opacity: 0.38 }, null)).rows.length === 0
      && roundTrip(held({ opacity: 0.38 }, { opacity: 0.38 }), held({ background: 'Icon/strong', opacity: 0.144 }, null)).rows.length === 0
      && roundTrip(held({}, { opacity: 0.38 }), code('Icon/strong')).rows.length === 1);
  }
  {
    const at = (e) => ({ contract: 1, component: 'Chip', props: {}, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/x', ...e } }, variants: [] });
    ok('an icon at Size 20 and 20 wide is the icon 20 wide; at Size 16 and 20 wide it is not',
      roundTrip(at({ width: 20, height: 20, with: { Size: '20' } }), at({ width: 20, height: 20 })).rows.length === 0
      && roundTrip(at({ width: 20, height: 20, with: { Size: '16' } }), at({ width: 20, height: 20 })).rows.length === 1);
  }
  ok('another name is a difference', roundTrip(lib, { ...same, component: 'Badge-x' }).rows.some((x) => x.at === 'name'));
  const withIcon = (c) => ({ ...lib, anatomy: { ...lib.anatomy, icon: { kind: 'instance', parent: 'root', component: c } } });
  ok('an icon named by its set alone in the drawing is the library\'s Icon/house; another icon is still a difference',
    roundTrip(withIcon('Icon/house'), withIcon('house')).rows.length === 0 && roundTrip(withIcon('Icon/house'), withIcon('check')).rows.length === 1);
}

{
  // a part of a placed component the library keeps and the reading leaves to the component (Carbon's dropdown chevron's
  // Chevron--down, Material's leading element's icon) is filled from it as the library keeps it: its constraints, equal to
  // the component's and so left out of the library's (derive's inherit), are left out of the fill too
  const chev = { component: 'Chev', props: {}, anatomy: { root: { kind: 'container', width: 16, height: 16 }, down: { kind: 'instance', parent: 'root', component: 'Down', width: 16, height: 16, constraints: { horizontal: 'scale', vertical: 'scale' }, absolute: { x: 0, y: 0 } } }, variants: [] };
  const mains = (n) => (n === 'Chev' ? chev : null);
  const holder = (kept) => ({ component: 'Select', props: {}, anatomy: { root: { kind: 'container' }, c: { kind: 'instance', parent: 'root', component: 'Chev', width: 16, height: 16 }, ...(kept && { 'c/down': { kind: 'instance', parent: 'c', component: 'Down', width: 16, height: 16, overflow: 'hidden' } }) }, variants: [] });
  ok('a part filled from the placed component it is the direct part of keeps no constraints, as the library keeps none for it: only its override differs', JSON.stringify(roundTrip(holder(true), holder(false), { mains }).rows.map((r) => r.at)) === '["c/down.overflow"]');
  // (every row checked: the library's own override, the clipping, is the one row; a constraints row was the defect)
}

{
  // an instance's prop at its own component's default is that prop unstated: the library states it, a reading does not
  const button = { component: 'Button', props: { size: { type: 'enum', values: ['sm', 'lg'], figmaValues: ['Sm', 'Lg'], default: 'sm', figma: 'Size' }, disabled: { type: 'boolean', default: false, figma: 'Disabled' } }, anatomy: { root: { kind: 'container' } }, variants: [] };
  const holder = (w) => ({ component: 'Card', props: {}, anatomy: { root: { kind: 'container' }, action: { kind: 'instance', parent: 'root', component: 'Button', ...(w && { with: w }) } }, variants: [] });
  const mains = (n) => (n === 'Button' ? button : null);
  ok('an instance\'s prop at its component\'s default, in its code word or Figma\'s, is the same as unstated; another value is still a difference',
    roundTrip(holder({ Size: 'Sm', Disabled: 'False' }), holder(null), { mains }).rows.length === 0
    && roundTrip(holder({ Size: 'Lg' }), holder(null), { mains }).rows.length === 1
    && roundTrip(holder({ Size: 'Sm' }), holder(null)).rows.length === 1);
  const tagged = { ...button, props: { ...button.props, label: { type: 'string', default: 'New', figma: 'Label' } } };
  const iconed = { component: 'Button', props: { icon: { type: 'instance', figma: 'Icon', swaps: ['i'] } }, anatomy: { root: { kind: 'container' } }, variants: [{ when: {}, add: { i: { kind: 'instance', parent: 'root', component: 'Icon/house' } } }] };
  ok('a swap at the icon its component draws there is unstated; another icon is stated', roundTrip(holder({ Icon: 'house' }), holder(null), { mains: (n) => (n === 'Button' ? iconed : null) }).rows.length === 0 && roundTrip(holder({ Icon: 'x' }), holder(null), { mains: (n) => (n === 'Button' ? iconed : null) }).rows.length === 1);
  { const inert = { component: 'Button', props: { icon: { type: 'instance', figma: 'Icon' } }, anatomy: { root: { kind: 'container' }, dot: { kind: 'graphic', parent: 'root' } }, variants: [] };
    const driven = { component: 'Button', props: { icon: { type: 'instance', figma: 'Icon' } }, anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Icon/house', swappedBy: 'icon' } }, variants: [] };
    const m = (main) => ({ mains: (n) => (n === 'Button' ? main : null) });
    // (inside the instance: its own dot, which says nothing of a swap; an icon the design draws there, which does)
    const within = (w, part) => { const h = holder(w); h.anatomy['action/in'] = { parent: 'action', ...part }; return h; };
    ok('a swap that drives no layer its component holds draws nothing and is unstated; one a layer names is stated, and so is one where the design draws an instance inside',
      roundTrip(within({ Icon: 'x' }, { kind: 'graphic' }), within(null, { kind: 'graphic' }), m(inert)).rows.length === 0
      && roundTrip(holder({ Icon: 'x' }), holder(null), m(driven)).rows.length === 1
      && roundTrip(within({ Icon: 'x' }, { kind: 'instance', component: 'Icon/x' }), within(null, { kind: 'instance', component: 'Icon/x' }), m(inert)).rows.length === 1); }
  { const pair = { component: 'Button', props: { on: { type: 'boolean', default: false, axis: true, figma: 'On' }, icon: { type: 'instance', figma: 'Icon', swaps: ['a', 'b'] }, iconOn: { type: 'instance', figma: 'Icon (on)', swaps: ['a', 'b'] } },
      anatomy: { root: { kind: 'container' }, a: { kind: 'instance', parent: 'root', component: 'Icon/full' }, b: { kind: 'instance', parent: 'root', component: 'Icon/line' } }, variants: [] };
    const m = { mains: (n) => (n === 'Button' ? pair : null) };
    ok('a swap tied to several layers is at its default where it names the icon any of them draws; another icon is stated',
      roundTrip(holder({ Icon: 'line', 'Icon (on)': 'full' }), holder(null), m).rows.length === 0 && roundTrip(holder({ Icon: 'star' }), holder(null), m).rows.length === 1
      // (but a layer said to be its own is the one it drives: the other's icon is stated)
      && roundTrip(holder({ Icon: 'full' }), holder(null), { mains: (n) => (n === 'Button' ? { ...pair, anatomy: { ...pair.anatomy, b: { ...pair.anatomy.b, swappedBy: 'icon' } } } : null) }).rows.length === 1); }
  { // (review: a layer said to be the swap's own is reached though the first layer is another prop's; a later layer is held
    // only to what it draws at these props; a library whose snapshot recorded no links unstates no swap)
    const turn = { component: 'Button', props: { on: { type: 'boolean', default: false, axis: true, figma: 'On' }, icon: { type: 'instance', figma: 'Icon', swaps: ['a', 'b'] }, iconOn: { type: 'instance', figma: 'Icon (on)', swaps: ['a', 'b'] } },
      anatomy: { root: { kind: 'container' }, a: { kind: 'instance', parent: 'root', component: 'Icon/full' }, b: { kind: 'instance', parent: 'root', component: 'Icon/line' } },
      variants: [{ when: { on: true }, set: { 'a.swappedBy': 'iconOn', 'b.swappedBy': 'icon', 'b.component': 'Icon/star' } }] };
    const m = (main) => ({ mains: (n) => (n === 'Button' ? main : null) });
    ok('a swap whose own layer is not the first is held to that layer: another icon there is stated, its own icon is not',
      roundTrip(holder({ On: 'True', Icon: 'x' }), holder({ On: 'True' }), m(turn)).rows.length === 1 && roundTrip(holder({ On: 'True', Icon: 'star' }), holder({ On: 'True' }), m(turn)).rows.length === 0);
    const late = { component: 'Button', props: { on: { type: 'boolean', default: false, axis: true, figma: 'On' }, icon: { type: 'instance', figma: 'Icon', swaps: ['a', 'b'] } },
      anatomy: { root: { kind: 'container' }, a: { kind: 'instance', parent: 'root', component: 'Icon/line' } }, variants: [{ when: { on: true }, add: { b: { kind: 'instance', parent: 'root', component: 'Icon/full' } } }] };
    ok('a later layer not drawn at the instance\'s props says nothing of its default there', roundTrip(holder({ On: 'False', Icon: 'full' }), holder({ On: 'False' }), m(late)).rows.length === 1);
    const inert = { component: 'Button', props: { icon: { type: 'instance', figma: 'Icon' } }, anatomy: { root: { kind: 'container' } }, variants: [] };
    const old = Object.assign((n) => (n === 'Button' ? inert : null), { linked: false });
    ok('where the snapshot recorded no links, a swap with none is not taken for one driving nothing', roundTrip(holder({ Icon: 'x' }), holder(null), { mains: old }).rows.length === 1); }
  const sized = { component: 'Button', props: { size: { type: 'enum', values: ['lg', 'xs'], figmaValues: ['lg', 'xs'], default: 'lg', figma: 'Size' }, icon: { type: 'instance', figma: 'Icon', swaps: ['i'] } }, anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Icon/house' } }, variants: [{ when: { size: 'xs' }, set: { 'i.component': 'Icon/star' } }] };
  ok('a swap is held to the icon drawn at the instance\'s own props: house at xs, where xs draws star, is stated', roundTrip(holder({ Size: 'xs', Icon: 'house' }), holder({ Size: 'xs' }), { mains: (n) => (n === 'Button' ? sized : null) }).rows.length === 1);
  const twoSwaps = { component: 'Button', props: { size: { type: 'enum', values: ['lg', 'xs'], figmaValues: ['lg', 'xs'], default: 'lg', figma: 'Size' }, icon20: { type: 'instance', figma: 'Icon (20)', swaps: ['i'] }, icon16: { type: 'instance', figma: 'Icon (16)', swaps: ['i'] } },
    anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Icon/plus', swappedBy: 'icon20' } }, variants: [{ when: { size: 'xs' }, set: { 'i.swappedBy': 'icon16' } }] };
  ok('a swap another prop drives the layer for at the instance\'s props draws nothing and is not compared; the one that drives it is', (() => { const m = { mains: (n) => (n === 'Button' ? twoSwaps : null) };
    return roundTrip(holder({ Size: 'xs', 'Icon (20)': 'x', 'Icon (16)': 'x' }), holder({ Size: 'xs', 'Icon (16)': 'x' }), m).rows.length === 0
      && roundTrip(holder({ Size: 'xs', 'Icon (16)': 'x' }), holder({ Size: 'xs', 'Icon (16)': 'house' }), m).rows.length === 1; })());
  { const box = (gap, align, orders) => ({ component: 'Bar', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap, align } }, ...Object.fromEntries(orders.map((o, i) => [`c${i}`, { kind: 'container', parent: 'root', order: o }])) }, variants: [] });
    ok('a gap under space-between is no value: Figma spaces the children itself', roundTrip(box(12, 'space-between', [0, 1]), box('Spacing/0', 'space-between', [0, 1])).rows.length === 0 && roundTrip(box(12, 'start', [0, 1]), box('Spacing/0', 'start', [0, 1])).rows.length === 1);
    ok('a child\'s order is its place among its siblings: ties and gaps are the same places; another place is a difference', roundTrip(box(0, 'start', [0, 0, 2]), box(0, 'start', [0, 1, 2])).rows.length === 0 && roundTrip(box(0, 'start', [1, 0]), box(0, 'start', [0, 1])).rows.length === 2);
    const less = box(0, 'start', [0, 1]); delete less.anatomy.c0;
    ok('a sibling one side lacks is its own row, not a shift of every place after it', roundTrip(box(0, 'start', [0, 1]), less).rows.length === 1); }
  { const placed = (rootW, cons, at) => ({ component: 'Spin', props: {}, anatomy: { root: { kind: 'container', width: rootW, layout: { direction: 'row' } }, dot: { kind: 'container', parent: 'root', order: 0, constraints: cons, absolute: at } }, variants: [] });
    const mid = { horizontal: 'center', vertical: 'center' };
    ok('a part centred in a parent that hugs has no offset to compare', roundTrip(placed('hug', mid, { x: 21, y: 4 }), placed('hug', mid, { x: 20.14, y: 4.5 })).rows.length === 0);
    { const rows = (a, b, o = {}) => roundTrip(placed('fill', mid, a), placed('fill', mid, b), o).rows.map((r) => r.at);
      ok('a part centred in a parent that fills is compared by its centre\'s offset where both sides say both edges, and by the room about it (its parent less itself): another offset at the same room is one row, the same offset in more room another (a 24 icon in a state layer 40 tall in Figma, 44 in code)',
        JSON.stringify(rows({ x: 40, y: 4, end: 40, bottom: 4 }, { x: 40, y: 4, end: 30, bottom: 4 })) === '["dot.absolute.xFromCentre","dot.absolute.xRoom"]'
        && JSON.stringify(rows({ x: 40, y: 4, end: 40, bottom: 4 }, { x: 35, y: 4, end: 45, bottom: 4 })) === '["dot.absolute.xFromCentre"]'
        && JSON.stringify(rows({ x: 8, y: 4, end: 8, bottom: 4 }, { x: 10, y: 4, end: 10, bottom: 4 })) === '["dot.absolute.xRoom"]'
        && rows({ x: 8, y: 4, end: 8, bottom: 4 }, { x: 8.01, y: 4, end: 8, bottom: 4 }, { layoutUnit: true }).length === 0
        && rows({ x: 8, y: 4, end: 8, bottom: 4 }, { x: 8.015, y: 4, end: 8.015, bottom: 4 }, { layoutUnit: true }).length === 0); }
    { const sized = (rootW, w, at) => { const c = placed(rootW, mid, at); c.anatomy.dot.width = w; return c; };
      const rows = (a, b) => roundTrip(a, b).rows.map((r) => r.at).sort();
      ok('a centred part whose own size or whose parent\'s differs is that size\'s row alone, the room about it not a second',
        JSON.stringify(rows(sized('fill', 24, { x: 8, y: 4, end: 8, bottom: 4 }), sized('fill', 28, { x: 6, y: 4, end: 6, bottom: 4 }))) === '["dot.width"]'
        && JSON.stringify(rows(sized(40, 'S/24', { x: 8, y: 4, end: 8, bottom: 4 }), sized(44, 'S/24', { x: 10, y: 4, end: 10, bottom: 4 }))) === '["root.width"]'
        && JSON.stringify(rows(sized(40, 24, { x: 8, y: 4, end: 8, bottom: 4 }), sized(40, 24, { x: 6, y: 4, end: 9, bottom: 4 }))) === '["dot.absolute.xFromCentre"]'); }
    ok('centred in an odd room on the pixel grid (19 and 18) compares as centred; two units of room off the middle does not',
      !roundTrip(placed('fill', mid, { x: 19, y: 4, end: 18, bottom: 4 }), placed('fill', mid, { x: 18.5, y: 4, end: 18.5, bottom: 4 })).rows.length
      && roundTrip(placed('fill', mid, { x: 20, y: 4, end: 17, bottom: 4 }), placed('fill', mid, { x: 18.5, y: 4, end: 18.5, bottom: 4 })).rows.length === 1);
    ok('only the design is on the pixel grid: code that draws the half pixel, or a reading of code it is compared with, keeps it',
      roundTrip(placed('fill', mid, { x: 18.5, y: 4, end: 18.5, bottom: 4 }), placed('fill', mid, { x: 19, y: 4, end: 18, bottom: 4 })).rows.length === 1
      && roundTrip({ ...placed('fill', mid, { x: 19, y: 4, end: 18, bottom: 4 }), code: { from: 'code' } }, placed('fill', mid, { x: 18.5, y: 4, end: 18.5, bottom: 4 })).rows.length === 1
      && roundTrip(placed('fill', mid, { x: 18, y: 4, end: 19, bottom: 4 }), placed('fill', mid, { x: 18.5, y: 4, end: 18.5, bottom: 4 })).rows.length === 1);
    ok('a part centred in a parent of fixed size is one row where it moves, its far edge following from the sizes (not a second)', roundTrip(placed(100, mid, { x: 40, y: 4, end: 40, bottom: 4 }), placed(100, mid, { x: 30, y: 4, end: 50, bottom: 4 })).rows.length === 1);
    ok('a part centred in a parent of fixed size, or one that fills, keeps its offset', roundTrip(placed(100, mid, { x: 40, y: 4 }), placed(100, mid, { x: 30, y: 4 })).rows.length === 1 && roundTrip(placed('fill', mid, { x: 10, y: 4 }), placed('fill', mid, { x: 60, y: 4 })).rows.length === 1);
    const foot = { horizontal: 'min', vertical: 'max' };
    ok('a part pinned to the bottom is compared by its bottom, not the y its parent\'s height gives', roundTrip(placed('hug', foot, { x: 0, y: 300, bottom: 0 }), placed('hug', foot, { x: 0, y: 280, bottom: 0 })).rows.length === 0 && roundTrip(placed('hug', foot, { x: 0, y: 300, bottom: 0 }), placed('hug', foot, { x: 0, y: 300, bottom: 8 })).rows.length === 1);
    ok('an axis pinned differently is one constraints row, its offsets not repeated', roundTrip(placed('hug', foot, { x: 0, y: 300, bottom: 0 }), placed('hug', { horizontal: 'min', vertical: 'min' }, { x: 0, y: 0 })).rows.length === 1); }
  { const sw = (by) => ({ component: 'B', props: {}, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/x', ...(by && { swappedBy: by }) } }, variants: [] });
    ok('which swap drives a layer is the design\'s own tie, no value code reads back', roundTrip(sw('i16'), sw(null)).rows.length === 0 && roundTrip(sw('i16'), sw('i20')).rows.length === 1); }
  ok('a text at its default is unstated only as written: NEW is not the default New', roundTrip(holder({ Label: 'NEW' }), holder(null), { mains: (n) => (n === 'Button' ? tagged : null) }).rows.length === 1 && roundTrip(holder({ Label: 'New' }), holder(null), { mains: (n) => (n === 'Button' ? tagged : null) }).rows.length === 0);
}

{
  // a root that fills its room is that room's width (a ruling): 320 fixed is a fill read in a room 320 wide, not one 724 wide
  const c = (root) => ({ component: 'X', props: {}, anatomy: { root }, variants: [] });
  ok('a root filling a room as wide as the library\'s fixed width comes back the same; a wider room is a difference',
    roundTrip(c({ width: 320, height: 'hug' }), c({ width: 'fill', height: 'hug', canvas: { width: 320 } })).rows.length === 0
    && roundTrip(c({ width: 320, height: 'hug' }), c({ width: 'fill', height: 'hug', canvas: { width: 724 } })).rows.length === 1);
}

{
  // a line's stroke alignment shows nowhere (Figma draws a line's stroke however aligned; code draws one edge): not
  // compared; a box's is
  const c = (part, align) => ({ component: 'L', props: {}, anatomy: { root: { kind: 'container' }, d: { kind: 'graphic', parent: 'root', ...part, border: { color: 'C/s', width: 'S/1', ...(align && { align }) } } }, variants: [] });
  ok('a line\'s stroke alignment is not compared; a box\'s is',
    roundTrip(c({ width: 0, height: 'fill' }, 'center'), c({ width: 0, height: 'fill' })).rows.length === 0
    && roundTrip(c({ width: 'fill', height: 0 }), c({ width: 'fill', height: 0 }, 'center')).rows.length === 0
    && roundTrip(c({ width: 10, height: 10 }, 'center'), c({ width: 10, height: 10 })).rows.length === 1);
  // an outside or centre stroke is out of the layout whatever the frame says (Figma lays it out as an outline): its
  // inLayout is not compared; an inside stroke's is
  const s = (align, inLayout) => ({ component: 'S', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' }, border: { color: 'C/s', width: 'S/1', align, ...(inLayout && { inLayout }) } } }, variants: [] });
  ok('an outside or centre stroke\'s inLayout is not compared; an inside stroke\'s is',
    roundTrip(s('outside', true), s('outside')).rows.length === 0 && roundTrip(s('center', true), s('center')).rows.length === 0
    && roundTrip(s('inside', true), s('inside')).rows.length === 1);
}

{
  // a space at either end of a text shows in neither (HTML collapses it); one inside the words does
  const t = (content) => ({ component: 'T', props: {}, anatomy: { root: { kind: 'container' }, l: { kind: 'text', parent: 'root', content } }, variants: [] });
  ok('a text\'s end spaces are not compared; its inner words are',
    roundTrip(t('Check your inbox. '), t('Check your inbox.')).rows.length === 0 && roundTrip(t('Check  your'), t('Check your')).rows.length === 1);
}

{ const { arcs } = await import('./to-figma.mjs');
  const a = (start, end) => arcs({ p: { arc: { start, end, inner: 0.75 } } }).p.arc;
  ok('an arc is compared by where it starts on the turn and how far it sweeps',
    JSON.stringify(a(270, 0)) === JSON.stringify(a(270, 360)) && JSON.stringify(a(-90, 0)) === JSON.stringify(a(270, 360)) && a(0, 360).end === 360 && a(0, 0).end === 360 && a(270, 90).end === 450); }
{ const { dashes } = await import('./to-figma.mjs');
  ok('a dash is compared as dashed or not: the design\'s pattern and code\'s dashed outline are one',
    JSON.stringify(dashes({ a: { border: { dash: [2, 2] } } })) === JSON.stringify(dashes({ a: { border: { dash: 'dashed' } } })) && !dashes({ a: { border: { color: 'x' } } }).a.border.dash); }
{ const byKey = { k1: 'Graphic/gold cup', k2: 'Button', k3: 'Icons/Icon/arrow' };
  const walk = { children: [{ instanceOf: 'gold cup', instanceOfKey: 'k1' }, { instanceOf: 'Button / Size=md', instanceOfKey: 'k2' }, { instanceOf: 'gold cup', instanceOfKey: 'other' }, { instanceOf: 'Close', instanceOfKey: 'k1' }, { instanceOf: 'Icon/arrow', instanceOfKey: 'k3' }] };
  namedByKey(walk, byKey);
  ok('a remote main the walk names bare is named back by its key, as the library names it with its folder; another key, or another name, stays',
    JSON.stringify(walk.children.map((x) => x.instanceOf)) === JSON.stringify(['Graphic/gold cup', 'Button / Size=md', 'gold cup', 'Close', 'Icons/Icon/arrow'])); }
{ const os = await import('node:os'); const fsm = await import('node:fs'); const pth = await import('node:path');
  const dir = fsm.mkdtempSync(pth.join(os.tmpdir(), 'keyed-')); fsm.mkdirSync(pth.join(dir, 'button'));
  fsm.writeFileSync(pth.join(dir, 'button', 'figma.json'), JSON.stringify({ name: 'Button', key: 'kb', default: { children: [{ type: 'INSTANCE', instanceOf: 'Icon/x / Size=16', instanceOfKey: 'ki' }] } }));
  const k = keyedNames(dir); fsm.rmSync(dir, { recursive: true });
  ok('the library\'s components by key, and each main its specs place (an icon), named as the library names it', k.kb === 'Button' && k.ki === 'Icon/x'); }
{ // an input's label overridden, its field its own: trimmed, so the field is not hidden; the same with the field's
  // own look listed too: kept whole, so a layer it does not list is hidden
  const field = { component: 'Field', props: {}, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', color: 'A' }, input: { kind: 'container', parent: 'root', background: 'B' } }, variants: [] };
  const mains = (n) => (n === 'Field' ? field : null);
  const trimmed = { root: { kind: 'container' }, f: { kind: 'instance', parent: 'root', component: 'Field' }, 'f/label': { kind: 'text', parent: 'f', color: 'Z' } };
  const whole = { ...trimmed, 'f/input': { kind: 'container', parent: 'f', background: 'B' } };
  ok('an instance\'s insides are kept whole only where they list a layer that is its component\'s own', keptWhole(trimmed, mains).length === 0 && JSON.stringify(keptWhole(whole, mains)) === '["f"]'); }
{ // a part the library keeps inside a placed instance (an override there: a flush header's padding) that the reading
  // does not hold, as a reading keeps none equal to its component's: compared as that component's own, field by field
  const head = { component: 'Head', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', padding: { start: 16 } } } }, variants: [] };
  const item = { component: 'Item', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'column' } },
    head: { kind: 'instance', parent: 'root', component: 'Head', order: 0, width: 'fill' },
    box: { kind: 'container', parent: 'root', order: 1 }, 'box/dot': { kind: 'graphic', parent: 'box', order: 0, width: 4, absolute: { x: 2, y: 2 }, constraints: { horizontal: 'min', vertical: 'min' } } }, variants: [] };
  const mains = (n) => ({ Head: head, Item: item }[n] || null);
  const host = (insides) => ({ contract: 1, component: 'Host', props: {}, anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Item', order: 0 }, ...insides }, variants: [] });
  const lib = host({ 'i/head': { kind: 'instance', parent: 'i', component: 'Head', order: 0, width: 'fill', layout: { direction: 'row', padding: { start: 0 } } },
    'i/box': { kind: 'container', parent: 'i', order: 1 }, 'i/box/dot': { kind: 'graphic', parent: 'i/box', order: 0, width: 6 } });
  const rows = roundTrip(lib, host({}), { mains }).rows.map((r) => r.at).sort();
  ok('a part kept inside a placed instance that a reading leaves to its component is compared as that component\'s own, field by field, never the whole part missing; no place inside a box with no auto layout',
    JSON.stringify(rows) === '["i/box/dot.width","i/head.layout"]');
  const other = host({ 'i/head': { kind: 'graphic', parent: 'i', order: 0 } });
  ok('one its component draws as another kind stays missing', roundTrip(other, host({}), { mains }).rows.some((r) => r.at === 'i/head' && r.drawn == null));
  // an instance the library keeps whole (it lists a layer equal to its component's, i/box, so dot is hidden there): the
  // reading keeps it whole too, so a part it lacks there is one code did not draw
  const kept = host({ 'i/head': { kind: 'instance', parent: 'i', component: 'Head', order: 0, width: 'fill', layout: { direction: 'row', padding: { start: 0 } } }, 'i/box': { kind: 'container', parent: 'i', order: 1 } });
  ok('a part inside an instance the library keeps whole stays missing', roundTrip(kept, host({}), { mains }).rows.some((r) => r.at === 'i/head' && r.drawn == null));
  // nested: Item restyles its Head's label; the outermost instance that holds the part says its own there
  const head2 = { component: 'Head', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, label: { kind: 'text', parent: 'root', order: 0, color: 'A' } }, variants: [] };
  const item2 = { component: 'Item', props: { size: { type: 'enum', values: ['large', 'small'], default: 'large', figmaValues: ['Large', 'Small'], figma: 'Size' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'column' } }, head: { kind: 'instance', parent: 'root', component: 'Head', order: 0 }, 'head/label': { kind: 'text', parent: 'head', order: 0, color: 'B' },
      box: { kind: 'container', parent: 'root', order: 1, layout: { direction: 'row' } }, 'box/dot': { kind: 'graphic', parent: 'box', order: 0, width: 4 } },
    variants: [{ when: { size: 'small' }, set: { 'box/dot.width': 2 } }] };
  const mains2 = (n) => ({ Head: head2, Item: item2 }[n] || null);
  const nested = host({ 'i/head': { kind: 'instance', parent: 'i', component: 'Head', order: 0 }, 'i/head/label': { kind: 'text', parent: 'i/head', order: 0, color: 'C' } });
  ok('a part inside a nested instance is held to the outermost override of it (Item\'s label colour), not the inner component\'s own',
    JSON.stringify(roundTrip(nested, host({}), { mains: mains2 }).rows.map((r) => [r.at, r.library, r.drawn])) === '[["i/head/label.color","C","B"]]');
  // the instance's own props pick the variant its component draws there
  const sized = (x) => ({ ...x, anatomy: { ...x.anatomy, i: { ...x.anatomy.i, with: { Size: 'Small' } } } });
  const small = sized(host({ 'i/box': { kind: 'container', parent: 'i', order: 1, layout: { direction: 'row' } }, 'i/box/dot': { kind: 'graphic', parent: 'i/box', order: 0, width: 6 } }));
  ok('the component\'s own is taken at the instance\'s props (its Size picks the variant)',
    JSON.stringify(roundTrip(small, sized(host({})), { mains: mains2 }).rows.map((r) => [r.at, r.library, r.drawn])) === '[["i/box/dot.width",6,2]]');
  // kept whole in one variant only (open adds i/box, equal to its component's, so dot is hidden there): whole over the
  // whole contract, as the reading's wholeIn is, so no combination fills the part
  const one = { ...host({ 'i/head': { kind: 'instance', parent: 'i', component: 'Head', order: 0, width: 'fill', layout: { direction: 'row', padding: { start: 0 } } } }),
    props: { open: { type: 'boolean', default: false, axis: true, figma: 'Open' } }, variants: [{ when: { open: true }, add: { 'i/box': { kind: 'container', parent: 'i', order: 1 } } }] };
  const bare = { ...host({}), props: one.props };
  ok('a host kept whole in one variant is kept whole in every combination: nothing filled in it',
    roundTrip(one, bare, { mains }).rows.filter((r) => r.at === 'i/head' && r.drawn == null).reduce((t, r) => t + r.in, 0) === 2);
  // the reading keeps a host whole in every combination once the design does in any. Where a combination lists nothing
  // inside it (closed) the reading's parts there are that component's own, no difference (box); but not a layer the
  // design hides in another (dot, at open): one listing nothing may hide it by visibility alone, which the snapshot
  // never records, so a dot drawn at closed stays a difference too, as it is at open
  const pane = { component: 'Pane', props: {}, anatomy: { root: { kind: 'container' }, box: { kind: 'container', parent: 'root', order: 0 }, 'box/dot': { kind: 'graphic', parent: 'box', order: 0, width: 4 } }, variants: [] };
  const paneOf = (n) => (n === 'Pane' ? pane : null);
  const holder = (insides, props = {}) => ({ contract: 1, component: 'Holder', props, anatomy: { root: { kind: 'container' }, i: { kind: 'instance', parent: 'root', component: 'Pane', order: 0 }, ...insides }, variants: [] });
  const openP = { open: { type: 'boolean', default: false, axis: true, figma: 'Open' } };
  const plain = { ...holder({}, openP), variants: [{ when: { open: true }, add: { 'i/box': { kind: 'container', parent: 'i', order: 0 } } }] };
  const readWhole = holder({ 'i/box': { kind: 'container', parent: 'i', order: 0 }, 'i/box/dot': { kind: 'graphic', parent: 'i/box', order: 0, width: 4 } }, openP);
  ok('a part the reading keeps in a host a combination lists nothing inside is its component\'s own; still a difference where the combination hides it',
    JSON.stringify(roundTrip(plain, readWhole, { mains: paneOf }).rows.map((r) => [r.at, r.library, r.in])) === '[["i/box/dot",null,2]]');
  // the reviewer's shape: open hides dot by visibility alone (lists nothing, as closed does), big lists box (Pane's own) beside the
  // hidden dot; code drawing dot at open is a difference, never filled away
  const bigP = { open: openP.open, big: { type: 'boolean', default: false, axis: true, figma: 'Big' } };
  const vis = { ...holder({}, bigP), variants: [{ when: { big: true }, add: { 'i/box': { kind: 'container', parent: 'i', order: 0 } } }] };
  const dotAtOpen = { ...holder({}, bigP), variants: [{ when: { open: true }, add: { 'i/box': { kind: 'container', parent: 'i', order: 0 }, 'i/box/dot': { kind: 'graphic', parent: 'i/box', order: 0, width: 4 } } },
    { when: { big: true }, add: { 'i/box': { kind: 'container', parent: 'i', order: 0 } } }] };
  ok('a layer the design hides in one combination is never filled where another lists nothing: drawn there it stays a difference',
    roundTrip(vis, dotAtOpen, { mains: paneOf }).rows.filter((r) => r.at === 'i/box/dot' && r.library == null).reduce((t, r) => t + r.in, 0) === 2);
  // a combination that hides a layer and lists only overrides beside it (open: box at 10 where Pane's is 8, dot hidden)
  // reads like one that left equal parts out; it lists insides, so nothing is filled there, and the hidden dot drawn
  // stays a difference (here in every combination: the others list insides too)
  const pane8 = { ...pane, anatomy: { ...pane.anatomy, box: { ...pane.anatomy.box, width: 8 }, tag: { kind: 'text', parent: 'root', order: 1, content: 'T' } } };
  const big = { open: openP.open, big: { type: 'boolean', default: false, axis: true, figma: 'Big' } };
  const hides = { ...holder({ 'i/box': { kind: 'container', parent: 'i', order: 0, width: 12 } }, big), variants: [
    { when: { open: true }, set: { 'i/box.width': 10 } },
    { when: { big: true }, add: { 'i/tag': { kind: 'text', parent: 'i', order: 1, content: 'T' } } }] };
  const drawsAll = holder({ 'i/box': { kind: 'container', parent: 'i', order: 0, width: 12 }, 'i/box/dot': { kind: 'graphic', parent: 'i/box', order: 0, width: 4 }, 'i/tag': { kind: 'text', parent: 'i', order: 1, content: 'T' } }, big);
  ok('a combination hiding a layer beside overrides only is not taken to hide nothing: the hidden layer drawn stays a difference',
    roundTrip(hides, drawsAll, { mains: (n) => (n === 'Pane' ? pane8 : null) }).rows.filter((r) => r.at === 'i/box/dot' && r.library == null).reduce((t, r) => t + r.in, 0) === 4);
  // an inner instance placed at props other than its defaults (Item places its Head small): a part inside it that no
  // outer instance holds is that inner component's own at those props
  const head3 = { component: 'Head', props: { size: { type: 'enum', values: ['large', 'small'], default: 'large', figmaValues: ['Large', 'Small'], figma: 'Size' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, label: { kind: 'text', parent: 'root', order: 0, color: 'A' } }, variants: [{ when: { size: 'small' }, set: { 'label.color': 'S' } }] };
  const item3 = { component: 'Item', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'column' } }, head: { kind: 'instance', parent: 'root', component: 'Head', order: 0, with: { Size: 'Small' } } }, variants: [] };
  const mains3 = (n) => ({ Head: head3, Item: item3 }[n] || null);
  const inner = host({ 'i/head': { kind: 'instance', parent: 'i', component: 'Head', order: 0, with: { Size: 'Small' } }, 'i/head/label': { kind: 'text', parent: 'i/head', order: 0, color: 'C' } });
  ok('a part inside an inner instance placed at other props is held to that component\'s own at those props',
    JSON.stringify(roundTrip(inner, host({}), { mains: mains3 }).rows.map((r) => [r.at, r.library, r.drawn])) === '[["i/head/label.color","C","S"]]'); }
{ // 2026-11-22: the live walk records the size of a text with no style (0.82.0 on), an older snapshot does not: the same
  // library must not read as changed against one, and only against one is anything of the live read left out. Which it
  // is, the stored figma.json says by what it records, never the contract's text (which drops a text equal to its
  // component's own, says nothing of a face with no weight, and may name a prop textCase)
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  const { derive } = req('./derive.cjs'), { compact } = req('../snapshot/spec.cjs');
  const { walkedAs } = await import('./to-figma.mjs');
  const j = JSON.stringify;
  const one = (name, children, props = {}) => ({ name, props, variants: [{ name, type: 'COMPONENT', layout: 'VERTICAL', children }] });
  const text = (x) => ({ name: 'L', type: 'TEXT', text: 'Hi', textStyle: 'literal', lineHeight: '20', ...x });
  const sizes = (fontStyle = 'Regular') => ({ fontSize: 14, fontFamily: 'Inter', fontStyle });
  const glyph = (fill) => ({ name: 'G', type: 'VECTOR', w: 8, h: 8, sizing: 'FIXED/FIXED', fills: [fill] });
  // Item, and a host that places it with its glyph alone overridden: the text is Item's own, and derive drops it
  const host = (x) => one('Host', [{ name: 'I', type: 'INSTANCE', instanceOf: 'Item', overrides: ['fills'], children: [text(x), glyph('#ff0000')] }]);
  const read = (spec, item) => derive(spec, ['Item', 'Host'], { mains: (name) => (name === 'Item' && item ? derive(item) : null) });
  // refused: the live read, as --patch holds it to the snapshot the contract came from, is not that contract
  const refused = (live, snap, item) => j(read(compact(walkedAs(live, compact(snap))), item)) !== j(read(compact(snap), item));
  const item = (x) => one('Item', [text(x), glyph('#000000')]);
  ok('1: a host whose only text is its component\'s own, dropped from the contract, read live is the same: no refusal, no row',
    !refused(host(sizes()), host(sizes()), item(sizes())) && roundTrip(read(host(sizes()), item(sizes())), read(compact(walkedAs(host(sizes()), compact(host(sizes())))), item(sizes()))).rows.length === 0);
  const bold = sizes('Display Bold');
  ok('2: a case added to a text whose face has no weight is still a change, inside an instance and on its own',
    refused(host({ ...bold, textCase: 'UPPER' }), host(bold), item(bold)) && refused(one('Top', [text({ ...bold, textCase: 'UPPER' })]), one('Top', [text(bold)]))
    && !refused(one('Top', [text(bold)]), one('Top', [text(bold)])));
  ok('3: where the snapshot records sizes, a size that changes is seen, whatever stale rules derived beside it',
    refused(one('Top', [text({ ...sizes(), fontSize: 16 })]), one('Top', [text(sizes())]))
    && j(walkedAs(one('Top', [text(sizes())]), compact(one('Top', [text(sizes())])))).includes('"fontSize":14'));
  const said = { letterSpacing: '0.16', textCase: 'UPPER' }, named = { textCase: 'Upper', letterSpacing: '0' };
  ok('4: the same library read live against an older snapshot is as stored, one with a prop named textCase too',
    !refused(one('Top', [text({ ...said, ...sizes() })]), one('Top', [text(said)])) && !refused(one('Top', [text({ ...said, ...sizes() })], named), one('Top', [text(said)], named))
    && !refused(host(sizes()), host({}), item({})) && refused(one('Top', [text({ ...sizes(), textStyle: 'Body/md' })]), one('Top', [text(said)])));
  // (a variant is kept as what differs from the first: a size in a delta names no textStyle beside it)
  const two = (a, b) => ({ name: 'Two', props: { V: ['A', 'B'] }, variants: [['A', a], ['B', b]].map(([v, x]) => ({ name: `V=${v}`, type: 'COMPONENT', layout: 'VERTICAL', children: [text(x)] })) });
  ok('…a variant kept as a delta is read whole, on both sides',
    !refused(two(sizes(), { ...sizes(), fontSize: 18 }), two({}, {})) && refused(two(sizes(), { ...sizes(), fontSize: 20 }), two(sizes(), { ...sizes(), fontSize: 18 })));
  ok('…with no stored snapshot to ask, nothing of the live read is left out', j(walkedAs(one('Top', [text(sizes())]), null)).includes('"fontSize":14'));
  // 2026-11-23: the live walk says each layer's place among all its parent's children (0.83.0 on), which orders two
  // layers two booleans show where they would tie; against an older snapshot it is left out, so the same library is no
  // change, and against one that records it, it is kept
  const at = (index, x = {}) => ({ name: x.name || 'Spacer', type: 'FRAME', w: 8, h: 8, sizing: 'FILL/FIXED', index, ...x });
  const menu = (placed) => { const i = (n) => (placed ? n : undefined); return { name: 'Menu', props: { Divider: 'BOOLEAN', 'Top spacer': 'BOOLEAN', State: ['Rest'] }, variants: [
    { name: 'State=Rest', type: 'COMPONENT', layout: 'VERTICAL', children: [at(i(2), { name: 'Content' })] },
    { name: 'State=Rest, Divider=True', type: 'COMPONENT', layout: 'VERTICAL', children: [at(i(1), { name: 'Divider' }), at(i(2), { name: 'Content' })] },
    { name: 'State=Rest, Top spacer=True', type: 'COMPONENT', layout: 'VERTICAL', children: [at(i(0), { name: 'Top spacer' }), at(i(2), { name: 'Content' })] }] }; };
  ok('the same library read live against a snapshot from before each layer\'s place was recorded is as stored; against one that records it, the place is kept',
    !refused(menu(true), menu(false)) && !refused(menu(true), menu(true)) && j(walkedAs(menu(true), compact(menu(true)))).includes('"index":1')
    && j(read(compact(menu(true)))) !== j(read(compact(menu(false)))));
}
{ // 2026-11-22: with two platforms an index holds one name twice: --patch read the first's figma.json, so it refused
  // an unchanged library and passed a change
  const to = await import('./to-figma.mjs');
  // (as the lookup was, where there is none yet: the first of that name)
  const entryOf = to.entryOf || ((index, name) => Object.keys(index).find((k) => index[k].name === name));
  const index = { 'web-button': { name: 'Button', file: 'WEB' }, 'ios-button': { name: 'Button', file: 'IOS', platform: 'ios' }, card: { name: 'Card', file: 'WEB' } };
  const keyAt = (k) => ({ 'web-button': 'k-web', 'ios-button': 'k-ios' })[k];
  ok('of two entries of one name, the one in the file patched, else of the component\'s key, is its own; where neither tells, none',
    entryOf(index, 'Button', { file: 'IOS', key: 'k-web', keyAt }) === 'ios-button' && entryOf(index, 'Button', { file: 'SCRATCH', key: 'k-ios', keyAt }) === 'ios-button'
    && entryOf(index, 'Button', { file: 'SCRATCH', keyAt }) === undefined && entryOf(index, 'Card', { file: 'SCRATCH', keyAt }) === 'card' && entryOf(index, 'None', { keyAt }) === undefined);
}
{ // 2026-11-22: --verify with no --folder and two platforms of one name skipped the library round trip and exited 0,
  // --library given or not
  const to = await import('./to-figma.mjs');
  // (as the choice was, where there is none yet: the folder found, else nothing held)
  const heldTo = to.heldTo || ((index, name, { folder, library, key, keyAt, fileOf }) => { const at = folder || to.entryOf(index, name, { key, keyAt }); return at ? { folder: at, file: library || fileOf(at) } : {}; });
  const index = { 'web-button': { name: 'Button', file: 'WEB' }, 'ios-button': { name: 'Button', file: 'IOS' } };
  const o = { keyAt: (k) => ({ 'web-button': 'k-web', 'ios-button': 'k-ios' })[k], fileOf: (k) => `${k}/contract.json` };
  ok('--verify of two entries of one name, neither told apart, is refused asking for --folder, never passed unheld',
    /--folder/.test(heldTo(index, 'Button', o).refused || '') && /--folder/.test(heldTo(index, 'Button', { ...o, library: 'mine.json' }).refused || ''));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  ok('…an explicit --library is the one held to: it chooses the twin by its key, and stands where the index has none of that name',
    same(heldTo(index, 'Button', { ...o, library: 'mine.json', libraryKey: 'k-ios' }), { folder: 'ios-button', file: 'mine.json' })
    && same(heldTo({}, 'Button', { ...o, library: 'mine.json' }), { file: 'mine.json' }) && same(heldTo({}, 'Button', o), {})
    && same(heldTo(index, 'Button', { ...o, folder: 'web-button' }), { folder: 'web-button', file: 'web-button/contract.json' }));
  ok('a folder named or chosen with no contract there is refused, never a round trip skipped',
    /no contract/.test(heldTo(index, 'Button', { ...o, folder: 'ios-buton', exists: () => false }).refused || ''));
}
{
  // the plugin code runs in Figma, where nothing this module imports exists: every imported helper it names (the
  // drawing's and an update's, RUNTIME and PATCH_*) is written out at the script's top level, where all of them see it
  // (a drawing stopped on "bareProp is not defined" the first time a placed instance set its props)
  const src = fs.readFileSync(new URL('./to-figma.mjs', import.meta.url), 'utf8');
  const imported = [...src.matchAll(/^import \{([^}]+)\} from/gm)].flatMap((m) => m[1].split(',').map((x) => x.trim().split(/\s+as\s+/).pop()));
  const code = pluginCode({ component: 'Chip', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] }, {}, { before: PATCH_BEFORE('1:2'), after: PATCH_AFTER, failed: PATCH_FAILED });
  const named = imported.filter((n) => new RegExp(`(^|[^.\\w])${n}\\b`).test(code.replace(/^const \w+ = .*$/gm, '')));
  const free = named.filter((n) => !new RegExp(`^const ${n} = `, 'm').test(code));
  ok(`the plugin code names no helper only this module imports (${free.join(', ') || 'none'}; written out: ${named.join(', ')})`, named.includes('bareProp') && !free.length);
}


{
  // a placed instance's fonts are loaded before it is changed or appended (Figma refuses an unloaded font there)
  const code = pluginCode({ component: 'Chip', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] }, {});
  const at = code.indexOf("if (n.type === 'INSTANCE') await fontsOf(n);"), named = code.indexOf('n.name = e.name', at);
  ok('a placed instance\'s fonts are loaded before it is named, changed or appended', at > 0 && named > at && /const withProps = async \(n, e\) => \{\s*await fontsOf\(n\);/.test(code));
}

{
  // in the library's own file a drawing's page is marked as the round trip's, never the library's own page of that name
  const src = fs.readFileSync(new URL('./to-figma.mjs', import.meta.url), 'utf8');
  ok('in the library\'s own file the keys of what other libraries lent are taken from the copies its own component uses, never a drawing\'s',
    src.includes("await listing('what its own component takes from other libraries'") && src.includes("n.name === P.name && !drawnPage(n)") && src.includes('}, 30000);')
    && src.includes('ownKeys.set(x.key, x); want.delete(x.key);') && src.includes("getStyledTextSegments(['textStyleId'])") && src.includes('if (Date.now() > until) break walk;'));
  ok('a variable at the top of its collection is a variable where the project names it, a literal never',
    (() => { const v = varNamer(['layer-hover (contextual)']); return v('layer-hover (contextual)') && v('Colour/Primary') && !v('#808080') && !v('16px (1rem)') && !varNamer()('layer-hover (contextual)'); })()
    && needs({ variants: [{ anatomy: { root: { background: 'layer-hover (contextual)' } } }] }, varNamer(['layer-hover (contextual)'])).vars.includes('layer-hover (contextual)')
    && src.includes("n in lib)) return null;") && src.includes("(K.vars && t in K.vars))) names.add(t);"));
  ok('a lent text style whose copy withholds its font is drawn in the font of a text that uses it',
    src.includes("typeof st.fontName === 'symbol' ? lentFont.get(st.key)") && src.includes('fonts[JSON.stringify(fontOf(st))]'));
  ok('the walk\'s page-qualified name of a drawing on the round trip page is the component\'s own, that exact prefix only',
    src.includes('if (comp && comp.name === `${pageName}/${p.name}`) comp.name = p.name;'));
  ok('a drawing in the library\'s own file goes on a page of its own, which every reader of the drawing asks for',
    drawingPage('Button', true) === 'Round trip · Button' && drawingPage('Button', false) === 'Button'
    && src.includes('before: BEFORE(pageName, token)') && src.includes('${JSON.stringify(pageName)});')
    && !/children\.find\(\(x\) => x\.name === \$\{JSON\.stringify\(p\.name\)\}\)/.test(src)
    && /DRAWN\(spec\.name, drawingPage\(spec\.name, own\)\)/.test(fs.readFileSync(new URL('./looks.mjs', import.meta.url), 'utf8')));
}

console.log(`${n}/${n} passed`);
