// node tools/shared/test-text-units.mjs — a text style's line height and letter spacing as a fraction of its font
// size, and every copy of it held to it: the snapshot plugin, the token build's dtcg.js and the doc generator.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { perFontSize } from './text-units.js';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };

ok('a percentage is of the font size; pixels are divided by it', perFontSize({ unit: 'PERCENT', value: 150 }, 16) === 1.5 && perFontSize({ unit: 'PIXELS', value: 24 }, 16) === 1.5);
ok('four places, the canonical precision: 133.33% is 1.3333, 16px on 12px is 1.3333', perFontSize({ unit: 'PERCENT', value: 133.33 }, 12) === 1.3333 && perFontSize({ unit: 'PIXELS', value: 16 }, 12) === 1.3333);
ok('letter spacing the same way: -2% is -0.02em, 0.5px on 12px is 0.0417em', perFontSize({ unit: 'PERCENT', value: -2 }, 12) === -0.02 && perFontSize({ unit: 'PIXELS', value: 0.5 }, 12) === 0.0417);
ok('AUTO, nothing, or pixels with no font size is null: the caller says what it does instead',
  perFontSize({ unit: 'AUTO' }, 16) === null && perFontSize(null, 16) === null && perFontSize({ unit: 'PIXELS', value: 24 }) === null);
// what the plugin and the token build wrote before the one rule: the same numbers, so no stored snapshot or token moves
const old = (o, fs) => +(o.unit === 'PERCENT' ? o.value / 100 : o.value / fs).toFixed(4);
const oldRound = (o, fs) => { const v = o.unit === 'PERCENT' ? o.value / 100 : o.value / fs; return Math.round(v * 1e4) / 1e4; };
const samples = [];
for (const fs of [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72])
  for (const v of [-5, -2.5, -1, -0.5, 0, 0.25, 0.5, 1, 2, 12, 16, 20, 24, 28, 32, 100, 110, 115, 120, 125, 130, 133.33, 140, 150, 160])
    for (const unit of ['PERCENT', 'PIXELS']) samples.push([{ unit, value: v }, fs]);
ok(`over ${samples.length} sample styles, the plugin's old expression gives the same numbers`, samples.every(([o, fs]) => perFontSize(o, fs) === old(o, fs)));
// dtcg.js rounded only line heights, which are never negative: on a negative half the two roundings part (-0.15625
// is -0.1563 by toFixed, -0.1562 by Math.round), and toFixed is the snapshot's, so it is the one kept
ok('…and so does dtcg.js\'s old Math.round, for every line height it rounded', samples.filter(([o]) => o.value >= 0).every(([o, fs]) => perFontSize(o, fs) === oldRound(o, fs)));

// The copies: Figma's sandbox imports nothing (toolkit-standard §D 1).
const src = (f) => readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
const decl = `const perFontSize = ${perFontSize.toString()};`;
const COPIES = ['plugins/design-system-snapshot/code.js', 'tools/tokens/dtcg.js', 'skills/figma-doc-generator/scripts/docgen.js'];
for (const f of COPIES) ok(`${f} holds text-units.js perFontSize, character for character`, src(f).includes(decl));
// and none divides a line height or a letter spacing by 100 or the font size beside it
ok('no copy converts a line height or letter spacing outside perFontSize',
  !/lineHeight\.value \/ (100|s\.fontSize)|letterSpacing\.value \/ (100|s\.fontSize)/.test(src(COPIES[0]))
  && !/round\(lh\.value \/ (100|style\.fontSize), 4\)/.test(src(COPIES[1]))
  && !/trimTo\(o\.value \/ (100|fontSize), [34]\)|trimTo\(row\.value \/ 100, 3\)/.test(src(COPIES[2])));
// the token build and the docs page give one answer for one style
const DTCG = createRequire(import.meta.url)('../tokens/dtcg.js');
const style = { name: 'Label', fontName: { family: 'Inter', style: 'Medium' }, fontSize: 12, lineHeight: { unit: 'PIXELS', value: 16 }, letterSpacing: { unit: 'PERCENT', value: -2 } };
const built = DTCG.buildFiles({ collections: [], textStyles: [{ name: 'Label', description: '', fontFamily: 'Inter', fontWeight: 'Medium', fontSize: 12, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, bound: {} }], paintStyles: [], effectStyles: [] }, {});
const tok = JSON.stringify(built.files.map((f) => f.tokens));
const docgen = createRequire(import.meta.url)('../../skills/figma-doc-generator/scripts/docgen.js');
ok('a 16px line on 12px text is 1.3333 in the tokens and on the docs page', /"lineHeight":1\.3333/.test(tok) && docgen.cssLineHeight(style.lineHeight, 12) === '1.3333' && docgen.cssLetterSpacing(style.letterSpacing, 12) === '-0.02em');
console.log(`\n${n} passed`);
