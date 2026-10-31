// node tools/tokens/test-names.mjs — a variable's CSS name as the build writes it.
import assert from 'node:assert/strict';
import { cssName, cssFamily } from './names.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
ok('a variable becomes its path less the collection, kebab-cased', cssName('Semantic', 'Color/Text/Neutral/primary') === '--color-text-neutral-primary');
ok('camel case is split as the build splits it, not lowercased first', cssName('Semantic', 'Color/textStrong') === '--color-text-strong');
ok('a leading minus is kept, as the export keeps it', cssName('Primitives', 'Spacing/-1') === '--spacing-minus-1');
ok('the collection never reaches the name', cssName('', 'Spacing/16') === cssName('Anything', 'Spacing/16'));
ok('a family is its first segment as the build writes it', cssFamily('Corner radius/4') === '--corner-radius-' && cssFamily('Spacing') === '--spacing-');
console.log(`\n${n} passed`);
