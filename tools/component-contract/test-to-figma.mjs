#!/usr/bin/env node
// tools/component-contract/to-figma.mjs: the plan a contract is drawn from.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { plan, pluginCode, verify, writeDrawn, variantKeys, needs, BEFORE, FAILED, PATCH_BEFORE, PATCH_AFTER, PATCH_FAILED } from './to-figma.mjs';

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

console.log(`${n}/${n} passed`);
