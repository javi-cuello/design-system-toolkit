// node tools/shared/test-names.mjs — a component's and a variant's name, read one way.
import assert from 'node:assert/strict';
import { displayName, fullName, variantValues } from './names.js';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
ok('a name without its folder and status marker', displayName('Forms/🚧 Text input') === 'Text input' && fullName('Forms/🚧 Text input') === 'Forms/Text input');
ok('a variant name is its pairs', JSON.stringify(variantValues('Size=Large, Left icon=True')) === '{"Size":"Large","Left icon":"True"}');
ok('a part with no = is no pair, and spaces round either side go', JSON.stringify(variantValues('Default,  State = Hover')) === '{"State":"Hover"}');
ok('nothing is no pairs', JSON.stringify(variantValues(undefined)) === '{}' && JSON.stringify(variantValues('')) === '{}');
// The copies Figma's sandbox needs, since it imports nothing: each is this reader, character for
// character (toolkit-standard §D 1; the components audit kept two parsers of its own until 2026-10-31).
import { readFileSync } from 'node:fs';
const copy = 'const variantValues = ' + variantValues.toString() + ';';
for (const f of ['skills/figma-components-audit/scanner/audit.js', 'skills/figma-components-audit/scripts/probes.js', 'skills/figma-properties-table/scripts/properties-table.js'])
  ok(`${f} holds names.js variantValues, character for character`, readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8').includes(copy));
console.log(`\n${n} passed`);
