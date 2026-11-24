#!/usr/bin/env node
// looks.mjs's pure parts: a PNG written and read back, and the comparison's share and its `within`.
import { decodePng, encodePng, compare, deltaE } from './looks.mjs';

let n = 0, failed = 0;
const ok = (what, cond) => { n++; if (!cond) { failed++; console.log(`FAIL ${what}`); } };

const img = (w, h, f) => { const px = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.set(f(x, y), (y * w + x) * 4); return { w, h, px }; };
const white = img(4, 3, () => [255, 255, 255, 255]);
const dot = img(4, 3, (x, y) => (x === 1 && y === 1 ? [0, 0, 0, 255] : [255, 255, 255, 255]));

const back = decodePng(encodePng(dot));
ok('a PNG written is read back pixel for pixel', back.w === 4 && back.h === 3 && Buffer.compare(back.px, dot.px) === 0);
ok('the same image differs nowhere', compare(white, white).share === 0);
ok('one pixel of twelve differs', Math.abs(compare(white, dot).share - 1 / 12) < 1e-9);
ok('a pixel no eye tells apart (ΔE under the threshold) does not differ', compare(white, img(4, 3, () => [253, 253, 253, 255])).share === 0);
ok('a pale grey on white differs (under the old 40-per-channel tolerance it passed)', compare(white, img(4, 3, () => [230, 230, 230, 255])).share === 1);
// (review 2026-11-24) a one-step grey token change on text, 35 a channel, and any text colour, passed both thresholds:
// a text's pixels are few, and the share is over what shows, the transparent background left out
const words = (g) => img(20, 10, (x, y) => (y === 5 && x < 4 ? [g, g, g, 255] : [0, 0, 0, 0]));
ok('a text one grey step darker differs, over the pixels that show', compare(words(135), words(100)).share === 1, compare(words(135), words(100)).share);
ok('the same text on a transparent background differs nowhere', compare(words(100), words(100)).share === 0);
ok('one of four pixels that show differs, whatever the background around them', Math.abs(compare(words(100), img(20, 10, (x, y) => (y === 5 && x < 4 ? (x === 0 ? [200, 0, 0, 255] : [100, 100, 100, 255]) : [0, 0, 0, 0]))).share - 0.25) < 1e-9);
ok('the colour distance is perceptual: ΔE of black and white is 100', Math.abs(deltaE([0, 0, 0], [255, 255, 255]) - 100) < 0.01);
const taller = img(4, 6, () => [255, 255, 255, 255]);
ok('a drawing taller than the library differs where only it has pixels', Math.abs(compare(white, taller).share - 0.5) < 1e-9, compare(white, taller).share);
ok('a faint edge only one image has (a shadow\'s tail an export trimmed) does not differ', compare(white, { w: 4, h: 6, px: Buffer.concat([white.px, img(4, 3, () => [0, 0, 0, 12]).px]) }).share === 0);
ok('two pixels nothing shows of are the same, whatever their colour', compare(img(1, 1, () => [255, 255, 255, 0]), img(1, 1, () => [0, 0, 0, 0])).share === 0);
ok('within the library\'s area (a set that clips cut it), only that area is compared', compare(white, taller, { within: true }).share === 0);

console.log(failed ? `${failed} of ${n} failed` : `${n}/${n} passed`);
process.exit(failed ? 1 : 0);
