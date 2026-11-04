// node tools/shared/test-prop-rows.mjs — the Properties table's rows, one set of rules for contract-rows.mjs rowsOf (the snapshot) and the Figma table (the open file).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { propRows } from './prop-rows.js';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
const rows = propRows([
  { name: 'Show icon', type: 'BOOLEAN', default: false, at: [1] },
  { name: 'Expanded', type: 'VARIANT', options: ['True', 'False'], default: 'True' },
  { name: 'Size', type: 'VARIANT', options: ['Large', 'Icon only'], default: 'Large' },
  { name: 'Icon', type: 'INSTANCE_SWAP', at: [1, 0], gate: 'Show icon' },
  { name: 'Label', type: 'TEXT', at: [0, 2], when: { Size: ['Large'] } },
  { name: 'Unused', type: 'BOOLEAN', default: true, at: null },
]);
const col = (i) => rows.map((r) => r.values[i]);
ok('axes first in declared order, the rest in layer order, a prefix before what extends it, the undriven last', col(0).join() === 'Expanded,Size,Label,Show icon,Icon,Unused');
ok('a False/True axis keeps its order and marks its default; an enum is verbatim, unmarked', col(2)[0] === 'True (default)\nFalse' && col(2)[1] === 'Large\nIcon only');
ok('a boolean is False then True, its default marked', col(2)[3] === 'False (default)\nTrue' && col(2)[5] === 'False\nTrue (default)');
ok('notes from the gate and from the values that draw the layer', col(3)[4] === 'Only for show icon=true' && col(3)[2] === 'Only for size=large' && col(3)[0] === '-');
const more = propRows([
  { name: 'Mode', type: 'VARIANT', options: ['A', 'B'], default: 'A' },
  { name: 'Show x', type: 'BOOLEAN', default: 'true', at: [0] },
  { name: 'T', type: 'TEXT', at: [0, 1], gate: 'Show x', when: { 'Show x': ['True'], Mode: 'Big', Size: ['S', 'M'] } },
  { name: 'Off', type: 'BOOLEAN', default: 'false', at: null },
]);
ok('a gate and a when together: the gate first, the gate dropped from when, a bare value read as one, capped at two', more[2].values[3] === 'Only for show x=true and mode=big');
ok('a boolean default spelled as a string is read', more[1].values[2] === 'False\nTrue (default)' && more[3].values[2] === 'False (default)\nTrue');
ok('types in the table\'s words', col(1).join() === 'Variant,Variant,Editable string,Boolean,Component swap,Boolean');

// Figma's sandbox imports nothing, so the table's script keeps a copy: this function, line for line
// (its indentation inside the script's factory aside). Two copies that drift are two mechanisms.
const lines = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean);
const own = lines('const propRows = ' + propRows.toString() + ';');
const script = lines(readFileSync(new URL('../../skills/figma-properties-table/scripts/properties-table.js', import.meta.url), 'utf8'));
const at = script.indexOf(own[0]);
ok('skills/figma-properties-table/scripts/properties-table.js holds prop-rows.js propRows, line for line', at >= 0 && own.every((l, i) => script[at + i] === l));
console.log(`\n${n} passed`);
