// Tests for the rows read from a contract — run: node tools/component-contract/test-contract-rows.mjs
// A fixture contract in contract 1's shape (tools/component-contract/README.md).
import { rowsOf, propsOf, rowsFromWalk } from './contract-rows.mjs';

let pass = 0, fail = 0; const failures = [];
const eq = (a, e, label) => { if (JSON.stringify(a) === JSON.stringify(e)) pass++; else { fail++; failures.push(`${label}\n    expected ${JSON.stringify(e)}\n    actual   ${JSON.stringify(a)}`); } };

const contract = {
  contract: 1, component: 'Button', figma: { name: 'Button', key: 'k1', id: '1:1' },
  props: {
    labelText: { type: 'string', default: 'Label', figma: 'Label text', sets: ['content/label'] },
    leftIcon: { type: 'boolean', default: false, figma: 'Left icon', shows: ['content/leftIcon'] },
    iconSwap: { type: 'instance', figma: 'Icon swap', swaps: ['content/leftIcon'] },
    hint: { type: 'string', figma: 'Hint', sets: ['content/hint'] },
    selected: { type: 'boolean', default: true, axis: true, figma: 'Selected' },
    size: { type: 'enum', values: ['large', 'icon-only'], default: 'large', figmaValues: ['Large', 'Icon only'], figma: 'Size' },
    extra: { type: 'slot', settings: {}, preferred: [], figma: 'Extra' },
    unused: { type: 'boolean', default: true, figma: 'Unused' },
  },
  anatomy: {
    root: { kind: 'container' },
    content: { kind: 'container', parent: 'root', order: 0 },
    'content/label': { kind: 'text', parent: 'content', order: 0, content: '{labelText}' },
    extra: { kind: 'slot', parent: 'root', order: 1, content: '{extra}' },
  },
  variants: [
    { when: { leftIcon: true }, add: { 'content/leftIcon': { kind: 'instance', parent: 'content', order: 0 } }, set: { 'content/label.order': 1 } },
    { when: { size: 'icon-only' }, add: { 'content/hint': { kind: 'text', parent: 'content', order: 2 } } },
  ],
  invalid: [],
  when: { 'content/hint': { size: ['icon-only'] } },
};
// the stored spec, as the snapshot holds it: the False/True axis in Figma's own order
const spec = { name: 'Button', props: { 'Label text': 'TEXT', 'Left icon': 'BOOLEAN', 'Icon swap': 'INSTANCE_SWAP', Hint: 'TEXT', Selected: ['True', 'False'], Size: ['Large', 'Icon only'], Extra: 'SLOT', Unused: 'BOOLEAN' } };

const rows = rowsOf(contract, spec).map((r) => r.values);
eq(rows.map((r) => r[0]), ['Selected', 'Size', 'Left icon', 'Icon swap', 'Label text', 'Hint', 'Extra', 'Unused'],
  'variant axes first in declared order, then the rest in layer order, then those driving no layer');
eq(rows[0], ['Selected', 'Variant', 'True (default)\nFalse', '-'], 'a False/True axis keeps Figma\'s order, read from the stored spec, never reordered');
eq(rows[1], ['Size', 'Variant', 'Large\nIcon only', '-'], 'an enum lists Figma\'s spelling, verbatim order');
eq(rows[2], ['Left icon', 'Boolean', 'False (default)\nTrue', '-'], 'a boolean property is False then True, its default marked');
eq(rows[3], ['Icon swap', 'Component swap', '-', 'Only for left icon=true'], 'a swap inside a boolean\'s shown layer is noted as gated by it');
eq(rows[5], ['Hint', 'Editable string', '-', 'Only for size=icon only'], 'a text whose layer is drawn only under one value is noted with it, as Figma spells it');
eq(rows[6], ['Extra', 'Slot', '-', '-'], 'a slot found through its part\'s content');

const props = propsOf(contract, spec);
eq(props.find((p) => p.name === 'Selected'), { name: 'Selected', type: 'VARIANT', values: ['True', 'False'], default: 'True' }, 'propsOf: a False/True axis as Figma has it');
eq(props.find((p) => p.name === 'Size'), { name: 'Size', type: 'VARIANT', values: ['Large', 'Icon only'], default: 'Large' }, 'propsOf: an enum in Figma\'s spelling, its default too');
eq(props.find((p) => p.name === 'Left icon'), { name: 'Left icon', type: 'BOOLEAN', values: [], default: 'false' }, 'propsOf: a boolean property with its default');
eq(props.find((p) => p.name === 'Icon swap'), { name: 'Icon swap', type: 'INSTANCE_SWAP', values: [], default: undefined }, 'propsOf: a swap has no default in the contract');
eq(props.map((p) => p.name), rows.map((r) => r[0]), 'propsOf lists the props in the Properties table\'s order');

// A live walk's rows are the snapshot's: the same component, walked as the plugin walks it, gives the
// rows read from what the snapshot writes for it (store.cjs writeLibrary's figma.json and contract.json)
{
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const store = require('../snapshot/store.cjs');
  const os = await import('node:os'); const fsm = await import('node:fs'); const pth = await import('node:path');
  const label = { name: 'Label', type: 'TEXT', text: 'Label', textStyle: 'Label/sm', fills: ['Ink'], sizing: 'HUG/HUG' };
  const tag = (size, dis = 'False') => ({ name: `Size=${size}, Disabled=${dis}`, type: 'COMPONENT', layout: 'HORIZONTAL', sizing: 'HUG/HUG', align: 'MIN/MIN',
    children: [...(size === 'Large' ? [{ name: 'Dot', type: 'ELLIPSE', sizing: 'FIXED/FIXED', w: 8, h: 8, fills: ['Ink'] }] : []), label] });
  const raw = { name: 'Tag', id: '2:1', key: 'kt', page: 'Tag', props: { Size: ['Large', 'Small'], Disabled: ['False', 'True'], 'Label text': 'TEXT' },
    links: { 'Label text': { kind: 'characters', layers: [['Label']] } }, variants: [tag('Large'), tag('Small'), tag('Large', 'True'), tag('Small', 'True')] };
  const dir = fsm.mkdtempSync(pth.join(os.tmpdir(), 'rows-walk-'));
  const P = store.paths(dir);
  store.writeLibrary({ components: [raw], icons: [], tokens: { _meta: { file: 'Lib', fileKey: 'f1' }, collections: {}, textStyles: [], paintStyles: [], effects: [] } }, P, { ids: ['f1'], files: [['f1']] });
  const read = (f) => JSON.parse(fsm.readFileSync(pth.join(P.components, 'tag', f), 'utf8'));
  const stored = rowsOf(read('contract.json'), read('figma.json'));
  const live = rowsFromWalk([raw]);
  eq(live.rows.kt && live.rows.kt.rows, stored, 'a live walk\'s rows equal the rows read from what the snapshot stores for it');
  eq(live.rows.kt.rows.map((r) => r.values.slice(0, 3)), [['Size', 'Variant', 'Large\nSmall'], ['Disabled', 'Variant', 'False (default)\nTrue'], ['Label text', 'Editable string', '-']], 'a live walk\'s rows carry the component\'s props, a False/True axis with its default marked');
  eq(rowsFromWalk([{ name: 'Broken', props: {}, variants: 'no' }]).noContract.length, 1, 'a component no contract can be derived for is named, not dropped silently');
  fsm.rmSync(dir, { recursive: true, force: true });
}

// run through a symlink, as an installed toolkit is: it runs, and asks for its folder
{
  const { spawnSync } = await import('node:child_process');
  const os = await import('node:os'); const fsm = await import('node:fs'); const pth = await import('node:path');
  const dir = fsm.mkdtempSync(pth.join(os.tmpdir(), 'rows-link-'));
  const link = pth.join(dir, 'tool');
  fsm.symlinkSync(pth.dirname(new URL(import.meta.url).pathname), link);
  const r = spawnSync(process.execPath, [pth.join(link, 'contract-rows.mjs')], { encoding: 'utf8' });
  eq([r.status, /usage/.test(r.stderr)], [2, true], 'A12: run through a symlink, the script runs');
  fsm.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) { console.log(failures.join('\n')); process.exit(1); }
