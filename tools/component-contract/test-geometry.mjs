#!/usr/bin/env node
// geometry.mjs: the drawn set's reading held to the library's stored one, per variant and per layer path. A made-up
// reading with one change seeded per kind gives exactly its row; identical readings give none; a reading is read the
// same twice; the walk's rounding is no difference, one step past it is.
import { geometry, TOLERANCE, knownOf } from './geometry.mjs';
import { mechanisms } from './eval.mjs';

let n = 0, failed = 0;
const ok = (what, cond, got) => { n++; if (!cond) { failed++; console.log(`FAIL ${what}${got === undefined ? '' : `: ${JSON.stringify(got)}`}`); } };
const copy = (x) => JSON.parse(JSON.stringify(x));

// a two-variant set as the snapshot stores it (full variants; a stored one may be compact, which resolve() reads)
const variant = (name, x) => ({
  name, type: 'COMPONENT', w: 120, h: 40, layout: 'HORIZONTAL', pad: [8, 12, 8, 12], gap: 8, fills: ['Background/brand'], place: { x, y: 0 },
  children: [
    { name: 'Icon', type: 'INSTANCE', w: 16, h: 16, x: 12, y: 12, index: 0, instanceOf: 'Icon/plus / Size=16', instanceOfKey: 'k1' },
    { name: 'Label', type: 'TEXT', w: 60, h: 20, x: 36, y: 10, index: 1, text: 'Add' },
    { name: 'Badge', type: 'FRAME', w: 12, h: 12, x: 100, y: 14, index: 2 },
  ],
});
const library = { name: 'Button', key: 'kb', set: { w: 300, h: 40 }, variants: [variant('Size=md, State=rest', 0), variant('Size=md, State=hover', 140)] };

// (a) the same reading on both sides
ok('(a) identical readings give no row', geometry(library, copy(library)).length === 0, geometry(library, copy(library)));
// the drawing names its axes in the house's order: matched by sorted axis values, not by name as written
const reordered = copy(library); for (const v of reordered.variants) v.name = v.name.split(', ').reverse().join(', ');
ok('(a) variants matched by sorted axis values, whatever order the drawing names them in', geometry(library, reordered).length === 0, geometry(library, reordered));
// ids, keys and a layer's place among hidden siblings are how the store finds things, never a difference
const restamped = copy(library); restamped.key = 'other'; restamped.variants[0].id = '9:9'; restamped.variants[0].children[0].instanceOfKey = 'k2'; restamped.variants[0].children[1].index = 4;
ok('(a) ids, keys and index are no difference', geometry(library, restamped).length === 0, geometry(library, restamped));

// (c) one change seeded per kind, each giving exactly its row
const seeded = (what, change, want) => {
  const drawn = copy(library); change(drawn);
  const rows = geometry(library, drawn);
  ok(`(c) ${what} gives exactly its row`, rows.length === 1 && JSON.stringify(rows[0]) === JSON.stringify(want), rows);
};
seeded('a moved layer', (d) => { d.variants[0].children[1].x = 44; }, { at: 'Size=md, State=rest/Label.x', library: 36, drawn: 44 });
seeded('a doubled text', (d) => { d.variants[0].children.push({ ...d.variants[0].children[1], index: 3 }); }, { at: 'Size=md, State=rest/Label#2', library: null, drawn: { kind: 'TEXT' } });
seeded('a layout mode', (d) => { d.variants[1].layout = 'VERTICAL'; }, { at: 'Size=md, State=hover.layout', library: 'HORIZONTAL', drawn: 'VERTICAL' });
// (the walk records visible layers only: a layer drawn hidden is a layer the drawn reading lacks)
seeded('a hidden layer', (d) => { d.variants[1].children.splice(2, 1); }, { at: 'Size=md, State=hover/Badge', library: { kind: 'FRAME' }, drawn: null });
seeded('a wrong size', (d) => { d.variants[0].children[2].w = 24; }, { at: 'Size=md, State=rest/Badge.w', library: 12, drawn: 24 });
seeded('a variant\'s place in its set', (d) => { d.variants[1].place = { x: 0, y: 60 }; }, { at: 'Size=md, State=hover.place', library: { x: 140, y: 0 }, drawn: { x: 0, y: 60 } });
seeded('the set\'s size', (d) => { d.set = { w: 260, h: 100 }; }, { at: 'Button.set', library: { w: 300, h: 40 }, drawn: { w: 260, h: 100 } });
seeded('a variant the drawing lacks', (d) => { d.variants.pop(); }, { at: 'Size=md, State=hover', library: { kind: 'variant' }, drawn: null });

// rows are counted, not deduped: the same change in both variants is two rows
const both = copy(library); for (const v of both.variants) v.children[1].x = 44;
ok('the same change in two variants is two rows', geometry(library, both).length === 2, geometry(library, both));
// a layer's name holding the separators a row's place is read by (/ and .) does not split it
const dotted = copy(library), dottedDrawn = copy(library);
dotted.variants[0].children[1].name = dottedDrawn.variants[0].children[1].name = 'Label/1.5';
dottedDrawn.variants[0].children[1].x = 40;
ok('a layer named with / and . keeps one segment', geometry(dotted, dottedDrawn)[0].at === 'Size=md, State=rest/Label_1_5.x', geometry(dotted, dottedDrawn));

// a field the stored snapshot recorded nowhere (an older plugin) is left out, as the store's notes leave it out
const old = copy(library); delete old.set; for (const v of old.variants) delete v.place;
ok('a set size and variant places an older snapshot never recorded are no row', geometry(old, copy(library), { known: new Set(['name', 'type', 'w', 'h', 'x', 'y', 'layout', 'pad', 'gap', 'fills', 'text', 'index', 'instanceOf', 'instanceOfKey']) }).length === 0, geometry(old, copy(library), { known: new Set(['w']) }));
// the drawn side losing a field the library has is a row whatever was recorded
const lost = copy(library); delete lost.variants[0].children[1].text;
ok('a field only the library has is a row', geometry(library, lost, { known: new Set() }).length === 1, geometry(library, lost, { known: new Set() }));

// (b) determinism: the same pair read twice gives the same rows, in the same order
const noisy = copy(library); noisy.variants[0].children[1].x = 44; noisy.variants[1].layout = 'VERTICAL'; noisy.variants[1].children.splice(2, 1);
ok('(b) the same reading twice gives the same rows', JSON.stringify(geometry(library, noisy)) === JSON.stringify(geometry(library, copy(noisy))), geometry(library, noisy));

// (e) noise: the walk rounds every number to two decimals, so two readings of one value can differ by one step
ok('(e) the tolerance is one step of the walk\'s rounding', TOLERANCE === 0.01, TOLERANCE);
const jitter = copy(library); jitter.variants[0].w = 120.01; jitter.variants[0].children[0].x = 11.99; jitter.variants[1].place = { x: 140.01, y: 0 }; jitter.set = { w: 299.99, h: 40 }; jitter.variants[0].pad = [8.01, 12, 8, 12];
ok('(e) a difference of one rounding step, in a number, a list or an object, is no row', geometry(library, jitter).length === 0, geometry(library, jitter));
const past = copy(library); past.variants[0].w = 120.02;
ok('(e) two steps is a row', geometry(library, past).length === 1, geometry(library, past));
ok('(e) a tolerance given is used', geometry(library, past, { tolerance: 0.5 }).length === 0);
const text = copy(library); text.variants[0].children[1].text = 'Add ';
ok('(e) words are compared exactly', geometry(library, text).length === 1, geometry(library, text));

// the rows rank as eval's mechanisms() ranks the Figma leg's: by field and each side's shape
const ranked = mechanisms({ Button: geometry(library, noisy) }).map((g) => g.key).sort();
ok('rows rank by field in mechanisms()', JSON.stringify(ranked) === JSON.stringify(['element | el:FRAME → none', 'layout | word → word', 'x | num → num']), ranked);

// (review 2026-11-23) the walk leaves a default out (opacity 1, no rotation, no clipping), so a field no library layer
// sets is recorded nowhere and the absence rule alone hid it: a snapshot taken by the walk's own release counts every field
const plain = { name: 'Tag', variants: [{ name: 'Tag', type: 'COMPONENT', w: 40, h: 20, children: [{ name: 'Label', type: 'TEXT', w: 30, h: 16 }] }] };
const odd = copy(plain); Object.assign(odd.variants[0].children[0], { opacity: 0.5, clips: true, absolute: true, rotation: 90 });
const tokensAt = (v) => ({ _meta: { plugin: v } });
ok('fields no library layer sets are rows when the snapshot is the walk\'s own release', geometry(plain, odd, { known: knownOf(tokensAt('0.84.0'), { tag: plain }, '0.84.0') }).length === 4, geometry(plain, odd, { known: knownOf(tokensAt('0.84.0'), { tag: plain }, '0.84.0') }));
ok('an older release\'s snapshot keeps the absence rule', geometry(plain, odd, { known: knownOf(tokensAt('0.83.0'), { tag: plain }, '0.84.0') }).length === 0);
ok('a snapshot that names no release keeps the absence rule', geometry(plain, odd, { known: knownOf({}, { tag: plain }, '0.84.0') }).length === 0);
// a single component's boolean flips are named after its raw name, the drawing after the contract's: matched by axes
const single = { name: '_Badge', variants: [{ name: '_Badge', type: 'COMPONENT', w: 20, h: 20 }, { name: '_Badge, Dot=false', type: 'COMPONENT', w: 16, h: 20 }] };
const singleDrawn = { name: 'Badge', variants: [{ name: 'Badge', type: 'COMPONENT', w: 20, h: 20 }, { name: 'Badge, Dot=false', type: 'COMPONENT', w: 16, h: 20 }] };
ok('a single component\'s flipped variants match by their axes, whatever it is named', geometry(single, singleDrawn).length === 0, geometry(single, singleDrawn));
const singleOff = copy(singleDrawn); singleOff.variants[1].w = 18;
ok('and are compared', JSON.stringify(geometry(single, singleOff)) === JSON.stringify([{ at: 'Dot=false.w', library: 16, drawn: 18 }]), geometry(single, singleOff));

console.log(failed ? `${failed} of ${n} failed` : `${n}/${n} passed`);
process.exit(failed ? 1 : 0);
