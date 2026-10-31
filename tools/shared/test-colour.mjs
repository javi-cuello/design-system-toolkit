// node tools/shared/test-colour.mjs — the colour arithmetic, and every copy of it held to it.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as C from './colour.js';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

ok('black on white is 21:1, either way round', near(C.contrastRatio({ r: 0, g: 0, b: 0 }, { r: 1, g: 1, b: 1 }), 21) && near(C.contrastRatio({ r: 1, g: 1, b: 1 }, { r: 0, g: 0, b: 0 }), 21));
ok('#777 on white is 4.48:1, the classic just-fails', C.contrastRatio({ r: 0x77 / 255, g: 0x77 / 255, b: 0x77 / 255 }, { r: 1, g: 1, b: 1 }).toFixed(2) === '4.48');
ok('the threshold is WCAG 2.2\'s 0.04045: 0.04 is on the linear segment', near(C.srgbToLinear(0.04), 0.04 / 12.92) && near(C.srgbToLinear(0.0405), Math.pow((0.0405 + 0.055) / 1.055, 2.4)));
ok('the transfer round-trips', [0, 0.003, 0.2, 0.5, 1].every((x) => near(C.linearToSrgb(C.srgbToLinear(x)), x, 1e-12)));
ok('OKLab white and black are sRGB white and black', C.oklabToLinearSrgb(1, 0, 0).every((x) => near(x, 1, 1e-6)) && C.oklabToLinearSrgb(0, 0, 0).every((x) => x === 0));

// The copies: Figma's sandbox imports nothing, and the OKLCH skill ships alone (toolkit-standard §D 1).
// Four copies with two thresholds were found by the 2026-10-31 review.
const src = (f) => readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
const decl = (name) => `const ${name} = ${C[name].toString()};`;
const COPIES = {
  'skills/figma-components-audit/scanner/audit.js': ['srgbToLinear', 'relativeLuminance', 'contrastRatio'],
  'skills/oklch-color-scale-system/scripts/generate.js': ['srgbToLinear', 'linearToSrgb', 'oklabToLinearSrgb'],
};
for (const [f, names] of Object.entries(COPIES)) for (const name of names)
  ok(`${f} holds colour.js ${name}, character for character`, src(f).includes(decl(name)));
// and no other linearisation is written beside them
for (const f of Object.keys(COPIES))
  ok(`${f} linearises only through its copy`, (src(f).match(/<= 0\.04045|<=0\.0392|<= 0\.03928/g) || []).length === 1);
console.log(`\n${n} passed`);
