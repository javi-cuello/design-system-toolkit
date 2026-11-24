#!/usr/bin/env node
// mutate.mjs: the comparer proven. A known change applied to one side of a leg must show as a row at the place it was
// made; a mutation run reads stored contracts and readings, needs no Figma and no browser, and says per kind and per
// leg what it caught, what it could not measure and every mutation that passed unseen.
// Run: node tools/component-contract/test-mutate.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { KINDS, rng, catalogueOf, mutateContract, mutateSpec, compareContract, compareFigma, runMutations, summary, lines, reachesOf, reachesAny, caughtAt, atPlace, numberStep, belowFloor, FLOOR, geometryAt, idOfPath } from './mutate.mjs';
import { measure } from './eval.mjs';
import { heldToLibrary } from './to-figma.mjs';

const req = createRequire(import.meta.url);
const { byComponentName, derive } = req('./derive.cjs');
let n = 0, failed = 0;
const ok = (what, cond, got) => { n++; if (!cond) { failed++; console.log(`FAIL ${what}${got === undefined ? '' : `: ${JSON.stringify(got).slice(0, 400)}`}`); } else console.log(`ok ${what}`); };
const copy = (x) => JSON.parse(JSON.stringify(x));

const SAMPLE = fileURLToPath(new URL('../contract-editor/sample', import.meta.url));
const tokens = JSON.parse(fs.readFileSync(path.join(SAMPLE, 'tokens.json'), 'utf8'));
// the sample library, and one made-up component with what the sample has none of: a slot, an effect, a raw stroke
const kit = { contract: 1, component: 'Kit', props: {}, anatomy: {
  root: { kind: 'container', layout: { direction: 'row', gap: 4, padding: { top: 2, end: 2, bottom: 2, start: 2 } }, width: 120, height: 'hug', radius: 4, border: { color: 'Color/Border/default', width: 1 }, shadow: 'Shadow/raised' },
  slot: { kind: 'slot', parent: 'root', order: 0, width: 'fill', height: 'hug' },
  label: { kind: 'text', parent: 'root', order: 1, content: 'Hi', typography: 'Label/md', color: 'Color/Text/default' },
}, variants: [] };
const lib = [...fs.readdirSync(path.join(SAMPLE, 'components')).sort().map((folder) => ({ folder, contract: JSON.parse(fs.readFileSync(path.join(SAMPLE, 'components', folder, 'contract.json'), 'utf8')) })), { folder: 'kit', contract: kit }];
const mains = byComponentName(lib.map((x) => x.contract));
const cat = catalogueOf({ ...tokens, effects: [{ name: 'Shadow/raised' }, { name: 'Shadow/overlay' }] }, lib.map((x) => x.contract));

// (a) the seeded random is a sequence, the same for one seed and another for another
{ const a = rng(7), b = rng(7), c = rng(8); const xs = [a(), a(), a()], ys = [b(), b(), b()]; ok('(a) one seed gives one sequence; another, another', JSON.stringify(xs) === JSON.stringify(ys) && xs[0] !== c() && xs.every((x) => x >= 0 && x < 1)); }

// (b) every kind applies to the library, says where it changed, and leaves the contract it was given alone
for (const kind of KINDS) {
  const hits = lib.map(({ folder, contract }) => { const before = JSON.stringify(contract); const m = mutateContract(contract, kind, { rng: rng(1), catalogue: cat }); return { folder, m, untouched: JSON.stringify(contract) === before }; });
  const applied = hits.filter((h) => h.m);
  ok(`(b) ${kind}: applies, names its place and where a catch must show`, applied.length > 0 && applied.every((h) => typeof h.m.at === 'string' && h.m.at.length && Array.isArray(h.m.places) && h.m.places.length), applied.map((h) => h.folder));
  ok(`(b) ${kind}: the contract given is not changed`, hits.every((h) => h.untouched));
}

// (c) the contract compare catches each kind at its place: the contract against itself is no row
for (const kind of KINDS) {
  const caught = [], missed = [];
  for (const { folder, contract } of lib) {
    const m = mutateContract(contract, kind, { rng: rng(3), catalogue: cat });
    if (!m) continue;
    const base = compareContract(contract, contract, { mains }), now = compareContract(contract, m.contract, { mains });
    (caughtAt(base.rows, now.rows, m.places) ? caught : missed).push(`${folder}: ${m.at} ${JSON.stringify(now.rows.map((r) => r.at))}`);
  }
  ok(`(c) ${kind}: the contract compare shows a row at the mutated place`, caught.length > 0 && !missed.length, { caught, missed });
}
ok('(c) a contract held to itself is no row', lib.every(({ contract }) => compareContract(contract, contract, { mains }).rows.length === 0));

// (d) a caught mutation is a new row at its own place: a component already red, or red elsewhere, is no catch
{
  const base = [{ at: 'icon.background', library: 'A', drawn: 'B' }];
  const places = [{ el: 'body', field: 'layout.gap' }];
  ok('(d) a row that changes only elsewhere is no catch', !caughtAt(base, [...base, { at: 'icon.radius', library: 1, drawn: 2 }], places));
  ok('(d) a red component that stays red the same is no catch', !caughtAt(base, base, [{ el: 'icon', field: 'background' }]));
  ok('(d) a new row at the place is a catch, and one on what holds the field', caughtAt(base, [...base, { at: 'body.layout.gap', library: 4, drawn: 5 }], places) && caughtAt(base, [...base, { at: 'body.layout', library: {}, drawn: {} }], places));
  ok('(d) a row already there whose values moved is a catch', caughtAt(base, [{ at: 'icon.background', library: 'A', drawn: 'C' }], [{ el: 'icon', field: 'background' }]));
  ok('(d) a subtree place takes rows under it, not beside it', atPlace('icon/glyph.component', [{ el: 'icon', subtree: true }]) && !atPlace('iconBox.width', [{ el: 'icon', subtree: true }]));
}

// (e) padding and gap move one step: a raw number one more; a token the nearest token in value, never a raw number
{
  const t = { collections: { D: { modes: ['Default'], values: { Default: { 'Spacing/4': 4, 'Spacing/8': 8, 'Spacing/12': 12, 'Radius/8': 8 } } } } };
  const c = { contract: 1, component: 'Box', props: { size: { type: 'enum', values: ['sm', 'lg'], default: 'sm' } }, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 'Spacing/8', padding: { top: 'Spacing/4', end: 'Spacing/4', bottom: 'Spacing/4', start: 'Spacing/4' } } } },
    variants: [{ when: { size: 'lg' }, set: { 'root.layout': { direction: 'row', gap: 12, padding: { top: 8, end: 8, bottom: 8, start: 8 } } } }] };
  const cc = catalogueOf(t, [c]);
  ok('(e) a number token steps to the nearest of its collection by value, the larger first', numberStep('Spacing/8', cc) === 'Spacing/12' && numberStep('Spacing/12', cc) === 'Spacing/8' && numberStep(3, cc) === 4 && numberStep('nope', cc) === undefined);
  const g = mutateContract(c, 'gap', { rng: rng(1), catalogue: cc });
  ok('(e) gap: the token steps to a token, and a variant\'s raw value one more', g && g.contract.anatomy.root.layout.gap === 'Spacing/12' && g.contract.variants[0].set['root.layout'].gap === 13, g);
  const p = mutateContract(c, 'padding', { rng: rng(1), catalogue: cc });
  ok('(e) padding: one side steps, still a token', p && Object.values(p.contract.anatomy.root.layout.padding).filter((x) => x === 'Spacing/8').length === 1 && Object.values(p.contract.anatomy.root.layout.padding).every((x) => typeof x === 'string'), p);
}

// (f) a kind with nothing to change is said not to apply (null), never a mutation that changes nothing
{
  const bare = { contract: 1, component: 'Dot', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] };
  ok('(f) a lone root has no child, order, instance, text, slot or padding to change', ['child', 'order', 'instance', 'instanceProps', 'textStyle', 'text', 'slot', 'padding', 'gap', 'visibility', 'effect'].every((k) => mutateContract(bare, k, { rng: rng(1), catalogue: cat }) === null));
}

// (g) the self leg compares as measure() does; the run reports each leg's rate and what it could not measure
{
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mutate-'));
  try {
    const where = { projectDir: home, paths: { components: path.join(home, 'components'), tokens: path.join(SAMPLE, 'tokens.json') } };
    fs.mkdirSync(path.join(home, 'round-trip', 'self', 'from-code'), { recursive: true });
    for (const { folder, contract } of lib) { fs.mkdirSync(path.join(home, 'components', folder), { recursive: true }); fs.writeFileSync(path.join(home, 'components', folder, 'contract.json'), JSON.stringify(contract)); }
    const pick = lib.filter(({ contract }) => mutateContract(contract, 'fill', { rng: rng(2), catalogue: cat }));
    for (const { folder, contract } of pick) fs.writeFileSync(path.join(home, 'round-trip', 'self', 'from-code', `${folder}.json`), JSON.stringify({ asFigma: mutateContract(contract, 'fill', { rng: rng(2), catalogue: cat }).contract }));
    const m = measure(where).legs.self;
    const same = pick.every(({ folder, contract }) => { const ours = compareContract(contract, mutateContract(contract, 'fill', { rng: rng(2), catalogue: cat }).contract, { mains: byComponentName(lib.map((x) => x.contract)), settings: req('../snapshot/projects.cjs').librarySettingsFor(where.paths.components)(folder), split: true }); return JSON.stringify(ours.rows) === JSON.stringify(m[folder].rows) && JSON.stringify(ours.left) === JSON.stringify(m[folder].left || []); });
    ok('(g) the self leg compares as measure() does: the same rows and the same left to code', pick.length > 0 && same);

    const s = summary(runMutations(where, { sample: 20, seed: 5, legs: ['browser', 'self', 'figma'] }));
    ok('(g) a leg with no readings is said not measured', s.legs.browser.unread && s.legs.figma.unread, s.legs);
    const self = s.legs.self;
    ok('(g) the self leg catches at least 80% of what it applied, over at least 50 mutations', self.n >= 50 && self.caught / self.n >= 0.8, { n: self.n, caught: self.caught });
    ok('(g) the run counts kinds with no target and bases that errored, never silently', typeof self.none === 'number' && self.none > 0 && self.errored === 0, self);
    ok('(g) every miss names its component and place', s.missed.every((x) => x.folder && x.at && x.kind && x.leg));
    ok('(g) one seed, one run: the same results again', JSON.stringify(runMutations(where, { sample: 20, seed: 5, legs: ['self'] })) === JSON.stringify(runMutations(where, { sample: 20, seed: 5, legs: ['self'] })));
    const text = lines('sample', s).join('\n');
    ok('(g) the report says the rate per leg and kind, and what was not measured', /self \d+ of \d+ caught/.test(text) && /browser: no readings/.test(text) && /not measured: self 0 component\(s\) errored, \d+ kind\(s\) with no target, \d+ dropped/.test(text), text);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
}

// (h) the Figma leg: to-figma --verify's own compare, red at the mutated place on its contract rows or its geometry
{
  const variant = (name, x, size) => ({
    name, type: 'COMPONENT', w: 120, h: 40, layout: 'HORIZONTAL', pad: [8, 12, 8, 12], gap: 8, fills: ['Color/Background/primary'], place: { x, y: 0 }, sizing: 'FIXED/FIXED', align: 'MIN/CENTER', radius: 4, strokeWeight: 1, strokes: ['Color/Border/default'], effect: 'Shadow/raised',
    bindings: { gap: 'Spacing/8' },
    children: [
      { name: 'Icon', type: 'INSTANCE', w: 16, h: 16, x: 12, y: 12, index: 0, instanceOf: 'Icon container', instanceOfKey: 'k1', props: { Filled: 'false' } },
      { name: 'Label', type: 'TEXT', w: 60, h: 20, x: 36, y: 10, index: 1, text: size, textStyle: 'Label/md', fills: ['Color/Text/default'] },
      { name: 'Slot', type: 'SLOT', w: 12, h: 12, x: 100, y: 14, index: 2, fills: ['#ff0000'] },
    ],
  });
  const spec = { name: 'Chip', key: 'kc', props: { Size: ['sm', 'md'] }, set: { w: 300, h: 40 }, variants: [variant('Size=sm', 0, 'sm'), variant('Size=md', 140, 'md')] };
  const held = derive(spec, ['Chip', 'Icon container'], {});
  const ctx = { names: ['Chip', 'Icon container'], deriveOptions: {}, mains, known: null };
  ok('(h) the Figma leg is to-figma\'s own compare, its geometry rows beside its contract rows', JSON.stringify(compareFigma(held, spec, copy(spec), ctx).rows.length) === JSON.stringify(heldToLibrary(held, copy(spec), spec, ctx).rt.rows.length + heldToLibrary(held, copy(spec), spec, ctx).geo.length));
  const base = compareFigma(held, spec, copy(spec), ctx).rows;
  ok('(h) the drawing as stored is no row', base.length === 0, base);
  for (const kind of KINDS) {
    const before = JSON.stringify(spec);
    const m = mutateSpec(spec, kind, { rng: rng(4), catalogue: cat });
    ok(`(h) ${kind}: applies to the drawing and names its place, the stored one untouched`, m && typeof m.at === 'string' && m.places.length && JSON.stringify(spec) === before, m && m.at);
    if (m) { const now = compareFigma(held, spec, m.spec, ctx).rows; ok(`(h) ${kind}: the Figma leg shows a row at the mutated place`, caughtAt(base, now, m.places), { at: m.at, places: m.places, rows: now.map((r) => r.at) }); }
  }
  const s = { legs: { figma: { kinds: { gap: { n: 10, caught: 10 } }, n: 10, caught: 10, errored: 0, none: 0, dropped: 0 } }, missed: [], errors: [] };
  ok('(h) the Figma leg is said stored only, never a plain rate', /figma \(stored only: the drawer and the walk are untested\) 10 of 10/.test(lines('x', s).join('\n')));
}

// (h) a repeated layer keeps its number on both sides: a row at the second item is the second item's place, not the first's
ok('(h) a geometry row at a repeat is at that repeat\'s place, and not at the first one\'s', atPlace(geometryAt('Size=sm/Row/Item#2.gap'), [{ el: idOfPath('Row > Item#2'), field: 'gap' }]) && !atPlace(geometryAt('Size=sm/Row/Item#2.gap'), [{ el: idOfPath('Row > Item'), field: 'gap' }]) && geometryAt('Size=sm.gap') === 'root.gap');

{
  const twin = (x) => ({ name: 'Field', type: 'FRAME', w: 10, h: 10, x, y: 0 });
  const v = { name: 'Size=sm', type: 'COMPONENT', w: 40, h: 10, layout: 'HORIZONTAL', children: [twin(0), twin(10), { name: 'Note', type: 'TEXT', w: 10, h: 10, x: 20, y: 0, text: 'n' }] };
  const m = mutateSpec({ name: 'Form', props: { Size: ['sm'] }, variants: [v] }, 'order', { rng: rng(1), catalogue: cat });
  ok('(h) two layers of one name never trade places: a reorder the walk could not see', m && /Field and Note trade places/.test(m.at), m && m.at);
}

// (i) a mutation that changes nothing compared is no test: a part hidden where a boolean off already hides it, or at a
// combination the library does not draw
{
  const c = { contract: 1, component: 'Note', props: { extra: { type: 'boolean', default: true, shows: ['body'] }, size: { type: 'enum', values: ['sm', 'lg'], default: 'sm' } }, invalid: [{ size: 'lg', extra: false }],
    anatomy: { root: { kind: 'container' }, body: { kind: 'text', parent: 'root', content: 'x' } }, variants: [{ when: { extra: false }, set: { 'root.width': 10 } }, { when: { size: 'lg', extra: false }, set: { 'root.width': 20 } }] };
  const reaches = reachesOf(c, c);
  const hid = copy(c); hid.variants[0].remove = ['body'];
  ok('(i) hiding a part where a boolean off hides it changes nothing compared', !reachesAny(c, hid, reaches.combos));
  ok('(i) a variant only at an invalid combination reaches nothing; one at a drawn one does', !reaches({ size: 'lg', extra: false }) && reaches({ extra: false }));
  const moved = copy(c); moved.variants[0].set['root.width'] = 11;
  ok('(i) a change at a drawn combination reaches it', reachesAny(c, moved, reaches.combos));
}

// (j) the floor --check holds: a kind under it where it applied often enough, none where it applied too rarely to say
{
  const s = { legs: { self: { kinds: { gap: { n: 10, caught: 8 }, radius: { n: 3, caught: 0 }, text: { n: 10, caught: 10 } } } } };
  ok(`(j) a kind under ${FLOOR * 100}% over enough mutations is under the floor; one applied three times is not held`, JSON.stringify(belowFloor(s)) === JSON.stringify(['self gap one step 8/10']), belowFloor(s));
}

// (k) eval.mjs --mutate refuses a sample that is not a whole number before it reads anything
{
  const r = spawnSync(process.execPath, [fileURLToPath(new URL('./eval.mjs', import.meta.url)), '--mutate', '--sample', '0'], { encoding: 'utf8' });
  ok('(k) eval --mutate --sample 0 is a usage error', r.status === 2 && /--mutate takes --sample N/.test(r.stderr), r.stderr);
}

console.log(`${n - failed} of ${n} passed`);
process.exit(failed ? 1 : 0);
