#!/usr/bin/env node
// node tools/parity/test-values.mjs — from the toolkit root.
import assert from 'node:assert/strict';
import { figmaWeight, weightName, WEIGHTS } from './values.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('every name either project used maps to its CSS weight',
  [['Thin', 100], ['ExtraLight', 200], ['Light', 300], ['Regular', 400], ['Medium', 500],
    ['SemiBold', 600], ['Bold', 700], ['ExtraBold', 800], ['Black', 900]].every(([s, w]) => figmaWeight(s) === w));
ok('the spaced spelling reads the same as the unspaced one',
  figmaWeight('Semi Bold') === 600 && figmaWeight('Extra Light') === 200 && figmaWeight('Extra Bold') === 800);
// A weight variable may hold the name in lower case: one library's four
// Font/Weight variables are `regular`, `medium`, `semibold`, `bold`.
ok('a weight variable\'s lower-case name reads the same as the style\'s',
  figmaWeight('semibold') === 600 && figmaWeight('regular') === 400 && figmaWeight('extra bold') === 800);
ok('an unknown style is undefined, never a guessed 400',
  [undefined, null, '', 'Roman', 600, 'constructor', 'toString', 'hasOwnProperty'].every((s) => figmaWeight(s) === undefined));
ok('the DTCG format\'s aliases read as it says, hyphenated or not',
  figmaWeight('Book') === 400 && figmaWeight('Demi Bold') === 600 && figmaWeight('ultra-bold') === 800 && figmaWeight('Heavy') === 900 && figmaWeight('Extra Black') === 950);
ok('a weight goes back to its first name', weightName(400) === 'regular' && weightName('600') === 'semibold' && weightName(950) === 'extrablack' && weightName(450) === undefined);
ok('the table cannot be changed by a caller', Object.isFrozen(WEIGHTS));

console.log(`\n${n} passed`);
