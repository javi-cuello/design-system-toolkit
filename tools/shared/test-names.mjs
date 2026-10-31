// node tools/shared/test-names.mjs — a component's and a variant's name, read one way.
import assert from 'node:assert/strict';
import { displayName, fullName, variantValues } from './names.js';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
ok('a name without its folder and status marker', displayName('Forms/🚧 Text input') === 'Text input' && fullName('Forms/🚧 Text input') === 'Forms/Text input');
ok('a variant name is its pairs', JSON.stringify(variantValues('Size=Large, Left icon=True')) === '{"Size":"Large","Left icon":"True"}');
ok('a part with no = is no pair, and spaces round either side go', JSON.stringify(variantValues('Default,  State = Hover')) === '{"State":"Hover"}');
ok('nothing is no pairs', JSON.stringify(variantValues(undefined)) === '{}' && JSON.stringify(variantValues('')) === '{}');
console.log(`\n${n} passed`);
