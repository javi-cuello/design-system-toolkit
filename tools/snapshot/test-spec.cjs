/*
 * The round-trip: resolve(compact(x)) must equal x, for every shape the
 * library can produce. Run: node --test test-spec.cjs
 *
 * This test is the reason the receiver may write specs at all. A compressed
 * form whose writer and reader disagree does not throw — it produces a
 * plausible wrong tree, and the first thing that corrupts is the diff the
 * whole loop is read through.
 */
const test = require('node:test');
const assert = require('node:assert');
const { compact, resolve, slug, layerPaths, repeatOf } = require('./spec.cjs');

const node = (name, type, props = {}, children) => ({ name, type, ...props, ...(children ? { children } : {}) });
const roundTrip = (spec) => assert.deepStrictEqual(resolve(compact(spec)), spec);

test('a single variant round-trips', () => {
  roundTrip({ name: 'Button', variants: [node('Size=md', 'COMPONENT', { padding: 8 }, [node('Label', 'TEXT', { fill: 'Colour/Text/strong' })])] });
});

test('a variant differing by one property costs one property', () => {
  const spec = { name: 'Button', variants: [
    node('State=Rest', 'COMPONENT', {}, [node('Bg', 'FRAME', { fill: 'a' })]),
    node('State=Hover', 'COMPONENT', {}, [node('Bg', 'FRAME', { fill: 'b' })]),
  ] };
  const c = compact(spec);
  assert.deepStrictEqual(c.variants[0], { name: 'State=Hover', delta: { children: [{ fill: 'b' }] } });
  roundTrip(spec);
});

test('an untouched branch is absent from the delta, not null', () => {
  const spec = { name: 'Card', variants: [
    node('A', 'COMPONENT', {}, [node('Head', 'FRAME', { gap: 4 }), node('Body', 'FRAME', { gap: 8 })]),
    node('B', 'COMPONENT', {}, [node('Head', 'FRAME', { gap: 4 }), node('Body', 'FRAME', { gap: 12 })]),
  ] };
  assert.deepStrictEqual(compact(spec).variants[0].delta.children[0], null);
  roundTrip(spec);
});

test('a property the variant DROPS is recorded as null and really deleted', () => {
  const spec = { name: 'Sheet', variants: [
    node('Desktop', 'COMPONENT', { effect: 'Elevation/Raised' }),
    node('Phone', 'COMPONENT', {}),
  ] };
  assert.deepStrictEqual(compact(spec).variants[0].delta, { effect: null });
  const back = resolve(compact(spec));
  assert.ok(!('effect' in back.variants[1]), 'the dropped property must not reappear');
  roundTrip(spec);
});

test('a different shape is kept in full, and later variants of that shape delta against it', () => {
  const rest = node('State=Rest', 'COMPONENT', {}, [node('Label', 'TEXT', {})]);
  const focusA = node('State=Focus', 'COMPONENT', {}, [node('Label', 'TEXT', {}), node('Focus ring', 'RECTANGLE', { stroke: 2 })]);
  const focusB = node('State=Focus, Size=lg', 'COMPONENT', {}, [node('Label', 'TEXT', {}), node('Focus ring', 'RECTANGLE', { stroke: 3 })]);
  const spec = { name: 'Button', variants: [rest, focusA, focusB] };
  const c = compact(spec);
  assert.ok(c.variants[0].children, 'the first variant of a new shape stays in full');
  assert.strictEqual(c.variants[1].base, 'State=Focus', 'the next one deltas against it, by name');
  roundTrip(spec);
});

test('nested depth round-trips', () => {
  const tree = (fill) => node('R', 'COMPONENT', {}, [node('A', 'FRAME', {}, [node('B', 'FRAME', {}, [node('C', 'TEXT', { fill })])])]);
  roundTrip({ name: 'Deep', variants: [tree('x'), tree('y')] });
});

test('resolve refuses a delta whose base does not precede it', () => {
  assert.throws(() => resolve({ name: 'X', default: node('A', 'COMPONENT'), variants: [{ name: 'B', base: 'Nope', delta: {} }] }),
    /precedes nothing/);
});

test('compact and resolve are idempotent', () => {
  const spec = { name: 'Button', variants: [node('A', 'COMPONENT', { p: 1 }), node('B', 'COMPONENT', { p: 2 })] };
  const c = compact(spec);
  assert.deepStrictEqual(compact(c), c, 'compacting a compact spec changes nothing');
  const r = resolve(c);
  assert.deepStrictEqual(resolve(r), r, 'resolving a resolved spec changes nothing');
});

test('slug names a folder', () => {
  assert.strictEqual(slug('_Modal - dialog'), 'modal-dialog');
  assert.strictEqual(slug('Filter chip'), 'filter-chip');
});

test('a repeated path is numbered from #2, and repeatOf reads it back', () => {
  const tree = { name: 'Size=md', children: [
    { name: 'Icon button', children: [{ name: 'Icon' }] },
    { name: 'Label' },
    { name: 'Icon button', children: [{ name: 'Icon' }] },
  ] };
  const paths = [];
  layerPaths(tree, (node, path) => { paths.push(path); });
  assert.deepStrictEqual(paths, ['Icon button', 'Icon button > Icon', 'Label', 'Icon button#2', 'Icon button#2 > Icon']);
  assert.deepStrictEqual(repeatOf('Icon button#2'), { name: 'Icon button', nth: 2 });
  assert.deepStrictEqual(repeatOf('Label'), { name: 'Label', nth: 1 });
});

test('the store reads a stored spec resolved, as stored on request, and says which one is broken', () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const { readSpec, readSpecs } = require('./store.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'specs-'));
  try {
    const whole = { name: 'Chip', variants: [node('Size=sm', 'COMPONENT', { padding: 4 }), node('Size=lg', 'COMPONENT', { padding: 8 })] };
    for (const [f, t] of [['chip', JSON.stringify(compact(whole))], ['empty', null]]) { fs.mkdirSync(path.join(dir, f)); if (t) fs.writeFileSync(path.join(dir, f, 'figma.json'), t); }
    assert.deepStrictEqual(readSpec(dir, 'chip'), whole);
    assert.deepStrictEqual(readSpec(dir, 'chip', { compact: true }), compact(whole));
    assert.strictEqual(readSpec(dir, 'empty'), null);
    assert.deepStrictEqual(readSpecs(dir).map((x) => x.folder), ['chip']);
    assert.deepStrictEqual(readSpecs(path.join(dir, 'none')), []);
    fs.mkdirSync(path.join(dir, 'broken')); fs.writeFileSync(path.join(dir, 'broken', 'figma.json'), '{"name": "Br');
    assert.throws(() => readSpecs(dir), /broken\/figma\.json does not parse/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
