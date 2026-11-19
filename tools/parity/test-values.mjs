#!/usr/bin/env node
// node tools/parity/test-values.mjs — from the toolkit root.
import assert from 'node:assert/strict';
import { figmaWeight, weightName, WEIGHTS, sideStrokes, insetStrokeVars } from './values.mjs';

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

// a stroke on some sides, read back from the rings css.mjs writes for it (Chrome's computed form)
{
  const c = 'rgb(1, 2, 3)';
  const inside = sideStrokes([`${c} 0px 1px 0px 0px inset`, `${c} -2px 0px 0px 0px inset`, `${c} 0px -1px 0px 0px inset`, `${c} 2px 0px 0px 0px inset`]);
  ok('inset rings shifted toward the middle are the inside stroke on each side', JSON.stringify(inside.sides) === '{"top":1,"end":2,"bottom":1,"start":2}' && inside.align === 'inside');
  const outside = sideStrokes([`${c} 0px -1px 0px 0px`, `${c} 3px 0px 0px 0px`]);
  ok('outer rings shifted out are the outside stroke', JSON.stringify(outside.sides) === '{"top":1,"end":3,"bottom":0,"start":0}' && outside.align === 'outside');
  ok('a shadow with blur or a ring all round is no stroke on some sides, and of two colours only the first is taken',
    sideStrokes([`${c} 0px 2px 8px 0px`]) === null && sideStrokes([`${c} 0px 0px 0px 1px inset`]) === null
    && JSON.stringify(sideStrokes([`${c} 0px 1px 0px 0px inset`, `rgb(9, 9, 9) 0px -1px 0px 0px inset`]).used) === '[0]');
  ok('a clear layer is no stroke, and black is not clear', sideStrokes(['rgba(0, 0, 0, 0) 0px 1px 0px 0px']) === null && sideStrokes(['rgb(0, 0, 0) 0px 1px 0px 0px']).sides.bottom === 1);
  ok('a colour Chrome keeps as oklch is read whole, its zeros not taken for lengths', sideStrokes(['oklch(0 0 0) 0px 1px 0px 0px inset']).sides.top === 1 && sideStrokes(['oklch(0 0 0) 0px 1px 0px 0px inset']).colour === 'oklch(0 0 0)');
}

// the tokens an inset stroke was written with: where two hold its value, the one the code meant
{
  const v = insetStrokeVars('inset 0 0 0 var(--stroke-2) var(--colour-stroke-neutral-selected)');
  ok('an inset stroke names the token its width and its colour were written with', v.width[0] === '--stroke-2' && v.colour[0] === '--colour-stroke-neutral-selected');
  { const v = insetStrokeVars('inset 0 calc(-1 * var(--stroke-3)) 0 0 var(--colour-stroke-neutral-selected)'), w = insetStrokeVars('inset var(--stroke-1) 0 0 0 var(--c)');
    ok('a one-side stroke names its width and colour too, on the near or far side', v && v.width[0] === '--stroke-3' && v.colour[0] === '--colour-stroke-neutral-selected' && w && w.width[0] === '--stroke-1' && w.colour[0] === '--c'
      && insetStrokeVars('inset 0 -1px 0 0 var(--divider), inset 0 0 0 var(--stroke-1) var(--c)').colour[0] === '--c'); }
  { const v = insetStrokeVars('0 var(--stroke-1) 0 0 var(--colour-stroke-neutral-soft)', { outside: true }), w = insetStrokeVars('0 4px 8px 0 var(--shadow)', { outside: true }), x = insetStrokeVars('inset 0 0 0 var(--a) var(--b), 0 var(--c) 0 0 var(--d)', { outside: true }), ring = insetStrokeVars('0 0 0 var(--ring-width) var(--ring)');
    ok('an outside stroke (not inset) names its width and colour where the border is outside; an elevation does not; an inset ring is first; an outer ring otherwise (a focus ring) names none', v && v.width[0] === '--stroke-1' && v.colour[0] === '--colour-stroke-neutral-soft' && w === null && x.colour[0] === '--b' && ring === null); }
  ok('a stroke beside another shadow is found among the layers', insetStrokeVars('0 1px 2px var(--shadow), inset 0 0 0 var(--stroke-1) rgb(0, 0, 0)').width[0] === '--stroke-1' && !insetStrokeVars('0 1px 2px var(--shadow), inset 0 0 0 var(--stroke-1) rgb(0, 0, 0)').colour.length);
  ok('a shadow that is no inset stroke names none', insetStrokeVars('0 1px 2px var(--shadow)') === null && insetStrokeVars('inset 0 1px 0 var(--stroke-1) red') === null && insetStrokeVars(null) === null);
}

console.log(`\n${n} passed`);
