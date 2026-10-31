#!/usr/bin/env node
// The builder's WCAG arithmetic is a Python copy of tools/shared/colour.js (the skill's builder is Python, which
// cannot import it), so it cannot be held character for character as the JS copies are: this runs the Python over
// every 8-bit channel and over real ramp pairs, and holds its numbers, and the Pass band each lands in, to colour.js's.
// Run: node skills/figma-contrast-matrix/tests/test-wcag-copy.mjs   (exits 77 without python3)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as C from '../../../tools/shared/colour.js';

const SCRIPT = fileURLToPath(new URL('../scripts/build-matrix-script.py', import.meta.url));
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };

// Two real 12-step ramps (the builder's own usage example) and the two text colours it picks between.
const A = ['#FBFDFE', '#F4F9FF', '#E3F0FF', '#D2E7FF', '#C1DEFF', '#92BFF1', '#6A9FDB', '#3F80C5', '#0061B0', '#005088', '#003F6E', '#002F55'];
const B = ['#F8FFFA', '#EAFEF0', '#DBF7E3', '#CAF0D6', '#B8E9C7', '#8ECBA3', '#63AE7F', '#31925C', '#007348', '#005D39', '#004A2D', '#003820'];
const HEX = [...A, ...B, '#121212', '#FAFAFA', '#000000', '#FFFFFF', '#777777', '#0A0A0A', '#0B0B0B'];
const PAIRS = HEX.flatMap((a) => HEX.map((b) => [a, b]));

const py = `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("bm", sys.argv[1]); bm = importlib.util.module_from_spec(spec); spec.loader.exec_module(bm)
pairs = json.loads(sys.stdin.read())
print(json.dumps({"linear": [bm.srgb_channel_to_linear(v) for v in range(256)],
                  "ratio": [bm.contrast_ratio(a, b) for a, b in pairs],
                  "band": [bm.pass_variant_for_ratio(bm.contrast_ratio(a, b)) for a, b in pairs]}))
`;
const r = spawnSync('python3', ['-I', '-c', py, SCRIPT], { input: JSON.stringify(PAIRS), encoding: 'utf8' });
if (r.error && r.error.code === 'ENOENT') { console.log('skip: python3 is not installed, so the builder\'s WCAG copy is not held'); process.exit(77); }
assert.equal(r.status, 0, r.stderr);
const out = JSON.parse(r.stdout);

const rgb = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const near = (a, b) => Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b));
const band = (x) => (x >= 4.5 ? '4.5' : x >= 3.0 ? '3.1' : 'No');

ok('every 8-bit channel linearises as colour.js srgbToLinear does', out.linear.every((v, i) => near(v, C.srgbToLinear(i / 255))));
ok(`over ${PAIRS.length} pairs of real ramp steps, the contrast ratio is colour.js contrastRatio`, PAIRS.every(([a, b], i) => near(out.ratio[i], C.contrastRatio(rgb(a), rgb(b)))));
ok('so every pair lands in the same Pass band, and shows the same two-place ratio', PAIRS.every(([a, b], i) => {
  const js = C.contrastRatio(rgb(a), rgb(b));
  return out.band[i] === band(js) && out.ratio[i].toFixed(2) === js.toFixed(2);
}));
ok('black on white is 21:1 and #777 on white 4.48:1 in the Python too', near(out.ratio[PAIRS.findIndex(([a, b]) => a === '#000000' && b === '#FFFFFF')], 21)
  && out.ratio[PAIRS.findIndex(([a, b]) => a === '#777777' && b === '#FFFFFF')].toFixed(2) === '4.48');
// the copy has one threshold, colour.js's (the 2026-10-31 review found 0.03928 beside 0.04045 elsewhere)
const src = readFileSync(SCRIPT, 'utf8');
ok('the builder linearises once, at WCAG 2.2\'s 0.04045', (src.match(/<= ?0\.0(4045|3928)/g) || []).join() === '<= 0.04045');
console.log(`\n${n} passed`);
