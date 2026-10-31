// Tests for the rows read from a contract — run: node tests/test-contract-rows.mjs
// A fixture contract in contract 1's shape (tools/component-contract/README.md).
import { rowsOf, propsOf } from '../scripts/contract-rows.mjs';

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
eq(props.map((p) => p.name), Object.keys(spec.props), 'propsOf keeps the declared order');

// run through a symlink, as the installed skill is: it runs, and asks for its folder
{
  const { spawnSync } = await import('node:child_process');
  const os = await import('node:os'); const fsm = await import('node:fs'); const pth = await import('node:path');
  const dir = fsm.mkdtempSync(pth.join(os.tmpdir(), 'rows-link-'));
  const link = pth.join(dir, 'skill');
  fsm.symlinkSync(pth.resolve(pth.dirname(new URL(import.meta.url).pathname), '..'), link);
  const r = spawnSync(process.execPath, [pth.join(link, 'scripts', 'contract-rows.mjs')], { encoding: 'utf8' });
  eq([r.status, /usage/.test(r.stderr)], [2, true], 'A12: run through a symlink, the script runs');
  fsm.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) { console.log(failures.join('\n')); process.exit(1); }
