#!/usr/bin/env node
// node tests/test-passes.mjs — from the skill folder. Runs the discovery passes'
// figma_execute bodies (scripts/pass-a-inventory.js, pass-c-libraries.js,
// pass-d-axes.js) against a fake file, the way the bridge runs them: as the
// body of an async function given `figma`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, '../scripts', f), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = (src, figma) => new AsyncFunction('figma', src)(figma);
const withIds = (src, ids) => {
  const out = src.replace(/ids: \[\]/, 'ids: ' + JSON.stringify(ids));
  assert.notEqual(out, src, 'the CONFIG.ids the test fills is still there');
  return out;
};

const node = (props, children = []) => {
  const n = { children, ...props };
  for (const c of children) c.parent = n;
  const all = () => n.children.flatMap((c) => [c, ...(c.findAll ? c.findAll(() => true) : [])]);
  n.findAll = (fn) => all().filter(fn);
  n.findAllWithCriteria = ({ types }) => all().filter((x) => types.includes(x.type));
  return n;
};

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

// ── pass A ───────────────────────────────────────────────────────────────────
const variants = [['Size=S, State=Rest'], ['Size=L, State=Rest'], ['Size=S, State=Hover']].map(([nm], i) => node({ id: '1:' + (i + 2), type: 'COMPONENT', name: nm }));
const button = node({ id: '1:1', type: 'COMPONENT_SET', name: 'Button', description: 'A button.' }, variants);
const icon = node({ id: '2:1', type: 'COMPONENT', name: '_Icon' });
const wrapped = node({ id: '0:1', type: 'PAGE', name: 'Button' }, [node({ id: '1:9', type: 'FRAME', name: 'Wrapper' }, [button, icon])]);
const empty = node({ id: '0:2', type: 'PAGE', name: 'Cover' });
const root = node({ id: '0:0', type: 'DOCUMENT', name: 'Web Components' }, [wrapped, empty]);
const byId = new Map(root.findAll(() => true).map((x) => [x.id, x]));
const figma = { root, fileKey: 'KEY', loadAllPagesAsync: async () => {}, getNodeByIdAsync: async (id) => byId.get(id) || null };
{
  const out = await run(read('pass-a-inventory.js'), figma);
  const p = out.pages[0];
  ok('pass A: a set wrapped in a frame is counted; its variants are not components', p.sets === 1 && p.comps === 1 && JSON.stringify(p.names) === '["Button","_Icon"]');
  ok('pass A: description coverage counts sets and components, not variants', p.described === 1);
  ok('pass A: an empty page carries the same fields as a full one', JSON.stringify(out.pages[1]) === JSON.stringify({ name: 'Cover', sets: 0, comps: 0, described: 0, names: [], setIds: [] }));
  ok('pass A: each component set comes with its id, for pass D; components and variants do not', JSON.stringify(p.setIds) === '[{"name":"Button","id":"1:1"}]');
  ok('pass A: identity comes from the file', out.fileKey === 'KEY' && out.fileName === 'Web Components');
}

// ── pass C ───────────────────────────────────────────────────────────────────
{
  const big = Array.from({ length: 401 }, (_, i) => ({ name: 'Spacing/' + i }));
  const lib = { teamLibrary: {
    getAvailableLibraryVariableCollectionsAsync: async () => [{ key: 'k1', name: 'Spacing', libraryName: 'Foundations' }, { key: 'k2', name: 'Colour', libraryName: 'Foundations' }],
    getVariablesInLibraryCollectionAsync: async (key) => key === 'k1' ? big : [{ name: 'Background/Primary' }]
  }, variables: { getLocalVariableCollectionsAsync: async () => [{ id: 'VariableCollectionId:1', name: 'Collection 1', modes: [{}, {}] }] } };
  const out = await run(read('pass-c-libraries.js'), lib);
  const [spacing, colour] = out.collections;
  ok('pass C: collections are identified by key, with their library', spacing.key === 'k1' && spacing.library === 'Foundations' && colour.key === 'k2');
  ok('pass C: a collection over the name cap says it was truncated, with its full count', spacing.count === 401 && spacing.names.length === 400 && spacing.truncated === true && colour.truncated === false);
  ok('pass C: local collections are listed with their mode count', JSON.stringify(out.localCollections) === JSON.stringify([{ id: 'VariableCollectionId:1', name: 'Collection 1', modes: 2 }]));
}

// ── pass D ───────────────────────────────────────────────────────────────────
{
  button.componentPropertyDefinitions = {
    'Size': { type: 'VARIANT', variantOptions: ['S', 'L'] },
    'State': { type: 'VARIANT', variantOptions: ['Rest', 'Hover'] },
    'Icon#12:0': { type: 'BOOLEAN' }
  };
  const broken = node({ id: '3:1', type: 'COMPONENT_SET', name: 'Broken' }, []);
  Object.defineProperty(broken, 'componentPropertyDefinitions', { get: () => { throw new Error('Component set has existing errors'); }, configurable: true });
  byId.set('3:1', broken);
  const out = await run(withIds(read('pass-d-axes.js'), ['1:1', '2:1', '9:9', '3:1']), figma);
  const [btn, notSet, missing, unreadable] = out;
  ok('pass D: axes in authored order, property ids stripped of their #suffix', JSON.stringify(btn.axes.map((a) => a.name)) === '["Size","State","Icon"]' && btn.axes[2].options === null);
  ok('pass D: a sparse set shows its variant count under the full grid of its variant axes', btn.variantCount === 3 && btn.fullGrid === 4);
  ok('pass D: an id that is not a set, or is gone, is reported rather than dropped', notSet.error === 'not a component set' && missing.error === 'not found');
  ok('pass D: a set Figma refuses to read is reported and the pass goes on', /^unreadable/.test(unreadable.error) && out.length === 4);
  Object.defineProperty(broken, 'componentPropertyDefinitions', { get: () => { throw new TypeError('something else'); } });
  ok('pass D: any other error ends the pass', await run(withIds(read('pass-d-axes.js'), ['3:1']), figma).then(() => false, (e) => e instanceof TypeError));
}

// ── pass S1 ──────────────────────────────────────────────────────────────────
{
  const vars = { a: { hiddenFromPublishing: true }, b: { hiddenFromPublishing: true }, c: { hiddenFromPublishing: false }, d: { hiddenFromPublishing: false } };
  const src = { fileKey: 'SRC', variables: {
    getLocalVariableCollectionsAsync: async () => [
      { key: 'p', name: 'Primitives', hiddenFromPublishing: false, modes: [{ name: 'Value' }], variableIds: ['a', 'b'] },
      { key: 's', name: 'Semantic', hiddenFromPublishing: false, modes: [{ name: 'Light' }, { name: 'Dark' }], variableIds: ['a', 'c', 'gone'] },
      { key: 'h', name: 'Internal', hiddenFromPublishing: true, modes: [{ name: 'Value' }], variableIds: ['c'] },
      { key: 'o', name: 'Open', hiddenFromPublishing: false, modes: [{ name: 'Brand A' }, { name: 'Brand B' }], variableIds: ['c', 'd'] }
    ],
    getVariableByIdAsync: async (id) => vars[id] || null
  } };
  const out = await run(read('pass-s1-collections.js'), src);
  const [prim, sem, internal, open] = out.collections;
  ok('pass S1: mode names in order, not a count', JSON.stringify(sem.modes) === '["Light","Dark"]' && JSON.stringify(open.modes) === '["Brand A","Brand B"]');
  ok('pass S1: hiding on every variable is told apart from hiding on the collection', prim.hidden === 'every variable' && internal.hidden === 'collection' && open.hidden === 'none');
  ok('pass S1: a partly hidden collection says so, with the count', sem.hidden === 'some variables' && sem.hiddenVariables === 1);
  ok('pass S1: a variable that would not read is counted, not dropped', sem.count === 3 && sem.unread === 1);
  ok('pass S1: identity is the file key and each collection key', out.fileKey === 'SRC' && prim.key === 'p');
}

// ── pass S3 ──────────────────────────────────────────────────────────────────
{
  const names = (xs) => xs.map((name) => ({ name }));
  const src = { fileKey: 'SRC',
    getLocalTextStylesAsync: async () => names(['Web app/Headline/lg', 'Web app/Body/md', 'Mobile app/Headline/lg', 'Web app/Label/sm']),
    getLocalEffectStylesAsync: async () => names(Array.from({ length: 401 }, (_, i) => 'Shadow/Base/' + i)),
    getLocalPaintStylesAsync: async () => names(['a', 'b']),
    getLocalGridStylesAsync: async () => []
  };
  const out = await run(read('pass-s3-styles.js'), src);
  ok('pass S3: text-style groups verbatim, in first-seen order', JSON.stringify(out.text.groups) === '["Web app","Mobile app"]');
  ok('pass S3: names in library order, never sorted', out.text.names[1] === 'Web app/Body/md' && out.text.names[3] === 'Web app/Label/sm');
  ok('pass S3: a kind over the name cap says it was truncated, with its full count', out.effect.count === 401 && out.effect.names.length === 400 && out.effect.truncated === true && out.text.truncated === false);
  ok('pass S3: paint and grid styles are counted', out.paint === 2 && out.grid === 0);
}

console.log(`${n}/${n} passed`);
