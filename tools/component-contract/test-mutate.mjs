#!/usr/bin/env node
// mutate.mjs: the comparer proven. A known change applied to one side of a leg must turn that leg's compare red; a
// mutation run reads stored contracts and readings, needs no Figma and no browser, and says per kind and per leg what
// it caught and every mutation that passed unseen. Run: node tools/component-contract/test-mutate.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { KINDS, rng, catalogueOf, mutateContract, mutateSpec, compareContract, compareFigma, runMutations, summary, lines, reachesOf, reachesAny } from './mutate.mjs';
import { measure } from './eval.mjs';

const req = createRequire(import.meta.url);
const { byComponentName } = req('./derive.cjs');
let n = 0, failed = 0;
const ok = (what, cond, got) => { n++; if (!cond) { failed++; console.log(`FAIL ${what}${got === undefined ? '' : `: ${JSON.stringify(got).slice(0, 400)}`}`); } else console.log(`ok ${what}`); };
const copy = (x) => JSON.parse(JSON.stringify(x));

const SAMPLE = fileURLToPath(new URL('../contract-editor/sample', import.meta.url));
const tokens = JSON.parse(fs.readFileSync(path.join(SAMPLE, 'tokens.json'), 'utf8'));
const lib = fs.readdirSync(path.join(SAMPLE, 'components')).sort().map((folder) => ({ folder, contract: JSON.parse(fs.readFileSync(path.join(SAMPLE, 'components', folder, 'contract.json'), 'utf8')) }));
const mains = byComponentName(lib.map((x) => x.contract));
const cat = catalogueOf(tokens, lib.map((x) => x.contract));

// (a) the seeded random is a sequence, the same for one seed and another for another
{ const a = rng(7), b = rng(7), c = rng(8); const xs = [a(), a(), a()], ys = [b(), b(), b()]; ok('(a) one seed gives one sequence; another, another', JSON.stringify(xs) === JSON.stringify(ys) && xs[0] !== c() && xs.every((x) => x >= 0 && x < 1)); }

// (b) every kind applies to the sample library, says where it changed, and leaves the contract it was given alone
for (const kind of KINDS) {
  const hits = lib.map(({ folder, contract }) => { const before = JSON.stringify(contract); const m = mutateContract(contract, kind, { rng: rng(1), catalogue: cat }); return { folder, m, untouched: JSON.stringify(contract) === before }; });
  const applied = hits.filter((h) => h.m);
  ok(`(b) ${kind}: applies to a sample component and names its place`, applied.length > 0 && applied.every((h) => typeof h.m.at === 'string' && h.m.at.length), applied.map((h) => h.folder));
  ok(`(b) ${kind}: the contract given is not changed`, hits.every((h) => h.untouched));
  ok(`(b) ${kind}: the mutated copy differs from it`, applied.every((h) => JSON.stringify(h.m.contract) !== JSON.stringify(lib.find((x) => x.folder === h.folder).contract)));
}

// (c) the contract compare catches each kind: the contract against itself is no row; against its mutation, red
for (const kind of KINDS) {
  const caught = [], missed = [];
  for (const { folder, contract } of lib) {
    const m = mutateContract(contract, kind, { rng: rng(3), catalogue: cat });
    if (!m) continue;
    const base = compareContract(contract, contract, { mains });
    const now = compareContract(contract, m.contract, { mains });
    (JSON.stringify(base.rows) !== JSON.stringify(now.rows) ? caught : missed).push(`${folder}: ${m.at}`);
  }
  ok(`(c) ${kind}: the contract compare goes red on its mutation`, caught.length > 0 && !missed.length, { caught, missed });
}
ok('(c) a contract held to itself is no row', lib.every(({ contract }) => compareContract(contract, contract, { mains }).rows.length === 0));

// (d) padding +1 on a token adds one to the token's value: the reading drew a number, not the token
{
  const c = { contract: 1, component: 'Box', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 'Spacing/8', padding: { top: 'Spacing/4', end: 4, bottom: 4, start: 4 } } } }, variants: [] };
  const t = { collections: { D: { modes: ['Default'], values: { Default: { 'Spacing/4': 4, 'Spacing/8': 8, 'Spacing/12': 12 } } } } };
  const cc = catalogueOf(t, [c]);
  const p = mutateContract(c, 'padding', { rng: rng(1), catalogue: cc }), g = mutateContract(c, 'gap', { rng: rng(1), catalogue: cc }), k = mutateContract(c, 'token', { rng: rng(1), catalogue: cc });
  const sides = p && Object.values(p.contract.anatomy.root.layout.padding);
  ok('(d) padding +1: one side one more, a token side its value plus one', p && sides.filter((x) => x === 5).length === 1 && /^root\.layout\.padding\./.test(p.at), p);
  ok('(d) gap +1 on a token: its value plus one', g && g.contract.anatomy.root.layout.gap === 9 && g.at === 'root.layout.gap', g);
  const tokensIn = (x) => (JSON.stringify(x).match(/"Spacing\/\d+"/g) || []).sort().join();
  ok('(d) a token swapped: another of its collection and kind, never a value', k && tokensIn(k.contract) !== tokensIn(c) && (JSON.stringify(k.contract).match(/"Spacing\/\d+"/g) || []).length === 2, k);
  // the change follows the field everywhere it is set: a variant's own value is changed too
  const v = { ...c, props: { size: { type: 'enum', values: ['sm', 'lg'], default: 'sm' } }, variants: [{ when: { size: 'lg' }, set: { 'root.layout': { direction: 'row', gap: 12, padding: { top: 8, end: 8, bottom: 8, start: 8 } } } }] };
  const gv = mutateContract(v, 'gap', { rng: rng(1), catalogue: cc });
  ok('(d) gap +1 is +1 in every variant that sets it', gv && gv.contract.anatomy.root.layout.gap === 9 && gv.contract.variants[0].set['root.layout'].gap === 13, gv);
}

// (e) a kind with nothing to change is said not to apply (null), never a mutation that changes nothing
{
  const bare = { contract: 1, component: 'Dot', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] };
  ok('(e) a lone root has no child to drop, no instance, no text style, no padding', ['child', 'instance', 'textStyle', 'padding', 'gap', 'visibility'].every((k) => mutateContract(bare, k, { rng: rng(1), catalogue: cat }) === null));
}

// (f) the self leg's compare is eval's own: the same rows as measure() for the same reading
{
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mutate-'));
  const where = { projectDir: home, paths: { components: path.join(home, 'components'), tokens: path.join(SAMPLE, 'tokens.json') } };
  fs.mkdirSync(path.join(home, 'round-trip', 'self', 'from-code'), { recursive: true });
  for (const { folder, contract } of lib) { fs.mkdirSync(path.join(home, 'components', folder), { recursive: true }); fs.writeFileSync(path.join(home, 'components', folder, 'contract.json'), JSON.stringify(contract)); }
  const pick = lib.filter(({ contract }) => mutateContract(contract, 'fill', { rng: rng(2), catalogue: cat }));
  for (const { folder, contract } of pick) fs.writeFileSync(path.join(home, 'round-trip', 'self', 'from-code', `${folder}.json`), JSON.stringify({ asFigma: mutateContract(contract, 'fill', { rng: rng(2), catalogue: cat }).contract }));
  const m = measure(where).legs.self;
  const same = pick.every(({ folder, contract }) => { const ours = compareContract(contract, mutateContract(contract, 'fill', { rng: rng(2), catalogue: cat }).contract, { mains: byComponentName(lib.map((x) => x.contract)), settings: req('../snapshot/projects.cjs').librarySettingsFor(where.paths.components)(folder), split: true }); return JSON.stringify(ours.rows) === JSON.stringify(m[folder].rows) && JSON.stringify(ours.left) === JSON.stringify(m[folder].left || []); });
  ok('(f) the self leg compares as measure() does: the same rows and the same left to code', pick.length > 0 && same);

  // and the run over a project: every leg with readings measured, a leg with none said, every miss listed by place
  const r = runMutations(where, { sample: 20, seed: 5, legs: ['browser', 'self', 'figma'] });
  const s = summary(r);
  ok('(f) a leg with no readings is said not measured', s.legs.browser.none && s.legs.figma.none, s.legs);
  ok('(f) the self leg measured each kind it could apply', Object.keys(s.legs.self.kinds).length >= 6 && Object.values(s.legs.self.kinds).every((k) => k.n >= 1), s.legs.self);
  ok('(f) every miss names its component and place', s.missed.every((x) => x.folder && x.at && x.kind && x.leg));
  ok('(f) one seed, one run: the same results again', JSON.stringify(runMutations(where, { sample: 20, seed: 5, legs: ['self'] })) === JSON.stringify(runMutations(where, { sample: 20, seed: 5, legs: ['self'] })));
  const text = lines('sample', s).join('\n');
  ok('(f) the report says the detection rate per leg and kind', /self .*\d+ of \d+ caught/.test(text) && /browser: no readings/.test(text), text);
  fs.rmSync(home, { recursive: true, force: true });
}

// (g) the Figma leg: the drawing as the walk reads it, mutated, is red on its contract compare or its geometry
{
  const variant = (name, x, size) => ({
    name, type: 'COMPONENT', w: 120, h: 40, layout: 'HORIZONTAL', pad: [8, 12, 8, 12], gap: 8, fills: ['Color/Background/primary'], place: { x, y: 0 }, sizing: 'FIXED/FIXED', align: 'MIN/CENTER',
    bindings: { gap: 'Spacing/8' },
    children: [
      { name: 'Icon', type: 'INSTANCE', w: 16, h: 16, x: 12, y: 12, index: 0, instanceOf: 'Icon container', instanceOfKey: 'k1', props: {} },
      { name: 'Label', type: 'TEXT', w: 60, h: 20, x: 36, y: 10, index: 1, text: size, textStyle: 'Label/md', fills: ['Color/Text/default'] },
      { name: 'Badge', type: 'FRAME', w: 12, h: 12, x: 100, y: 14, index: 2, fills: ['#ff0000'] },
    ],
  });
  const spec = { name: 'Chip', key: 'kc', props: { Size: ['sm', 'md'] }, set: { w: 300, h: 40 }, variants: [variant('Size=sm', 0, 'sm'), variant('Size=md', 140, 'md')] };
  const { derive } = req('./derive.cjs');
  const contract = derive(spec, ['Chip', 'Icon container'], {});
  const ctx = { names: ['Chip', 'Icon container'], deriveOptions: {}, mains, known: null };
  ok('(g) the drawing as stored is no row', compareFigma(contract, spec, spec, ctx).rows.length === 0, compareFigma(contract, spec, spec, ctx).rows);
  for (const kind of KINDS) {
    const before = JSON.stringify(spec);
    const m = mutateSpec(spec, kind, { rng: rng(4), catalogue: cat });
    ok(`(g) ${kind}: applies to the drawing and names its place, the stored one untouched`, m && typeof m.at === 'string' && JSON.stringify(spec) === before, m && m.at);
    if (m) ok(`(g) ${kind}: the Figma leg goes red`, compareFigma(contract, spec, m.spec, ctx).rows.length > 0, m.at);
  }
}

// (h) a mutation that changes nothing compared is no test: a part hidden where a boolean off already hides it, or at a
// combination the library does not draw
{
  const c = { contract: 1, component: 'Note', props: { extra: { type: 'boolean', default: true, shows: ['body'] }, size: { type: 'enum', values: ['sm', 'lg'], default: 'sm' } }, invalid: [{ size: 'lg', extra: false }],
    anatomy: { root: { kind: 'container' }, body: { kind: 'text', parent: 'root', content: 'x' } }, variants: [{ when: { extra: false }, set: { 'root.width': 10 } }, { when: { size: 'lg', extra: false }, set: { 'root.width': 20 } }] };
  const reaches = reachesOf(c, c);
  const hid = copy(c); hid.variants[0].remove = ['body'];
  ok('(h) hiding a part where a boolean off hides it changes nothing compared', !reachesAny(c, hid, reaches.combos));
  ok('(h) a variant only at an invalid combination reaches nothing; one at a drawn one does', !reaches({ size: 'lg', extra: false }) && reaches({ extra: false }));
  const moved = copy(c); moved.variants[0].set['root.width'] = 11;
  ok('(h) a change at a drawn combination reaches it', reachesAny(c, moved, reaches.combos));
}

// (i) eval.mjs --mutate refuses a sample that is not a whole number before it reads anything
{
  const r = spawnSync(process.execPath, [fileURLToPath(new URL('./eval.mjs', import.meta.url)), '--mutate', '--sample', '0'], { encoding: 'utf8' });
  ok('(i) eval --mutate --sample 0 is a usage error', r.status === 2 && /--mutate takes --sample N/.test(r.stderr), r.stderr);
}

console.log(`${n - failed} of ${n} passed`);
process.exit(failed ? 1 : 0);
