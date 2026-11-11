// scripts/describe-write.js against a fake file: writes only what it may, reads every write back.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fs.readFileSync(fileURLToPath(new URL('../scripts/describe-write.js', import.meta.url)), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const run = (figma, config) => new AsyncFunction('figma', src.replace(/const CONFIG = \{[\s\S]*?\n\};/, `const CONFIG = ${JSON.stringify(config)};`))(figma);

function fakeFile({ drop = [] } = {}) {
  const cols = [{ id: 'c1', name: '04. Semantic' }, { id: 'c2', name: '01. Primitives' }];
  const store = [
    { id: 'v1', name: 'bg/surface', variableCollectionId: 'c1', description: '' },
    { id: 'v2', name: 'text/error', variableCollectionId: 'c1', description: 'Hand-written.' },
    { id: 'v3', name: 'bg/accent', variableCollectionId: 'c1', description: 'Old.' },
    { id: 'v4', name: 'bg/surface', variableCollectionId: 'c2', description: '' },
  ].map((v) => {
    let d = v.description;
    return Object.defineProperty({ ...v }, 'description', { get: () => d, set: (x) => { if (!drop.includes(v.id)) d = x; }, enumerable: true });
  });
  return { store, variables: {
    getLocalVariableCollectionsAsync: async () => cols,
    getLocalVariablesAsync: async () => store,
    getVariableByIdAsync: async (id) => store.find((v) => v.id === id) || null,
  } };
}

let n = 0;
const ok = (what, cond) => { if (!cond) { console.error('FAIL', what); process.exit(1); } n++; console.log('ok', what); };

const f = fakeFile();
const r = await run(f, { collection: '04. Semantic', descriptions: { 'bg/surface': 'Base.', 'text/error': 'New.', 'bg/accent': 'Accent.', 'bg/none': 'X.' }, overwrite: ['bg/accent'] });
ok('an empty description is written and read back', r.written.includes('bg/surface') && f.store[0].description === 'Base.');
ok("an existing one is kept without the person's word", r.kept.join() === 'text/error' && f.store[1].description === 'Hand-written.');
ok('one named in overwrite is replaced', r.written.includes('bg/accent') && f.store[2].description === 'Accent.');
ok('a name the collection lacks is missing', r.missing.join() === 'bg/none');
ok('the same name in another collection is untouched', f.store[3].description === '');
const g = fakeFile({ drop: ['v1'] });
const r2 = await run(g, { collection: '04. Semantic', descriptions: { 'bg/surface': 'Base.' }, overwrite: [] });
ok('a write that did not land is mismatched, not written', r2.mismatched.join() === 'bg/surface' && !r2.written.length);
let threw = false; try { await run(fakeFile(), { collection: 'Nope', descriptions: {}, overwrite: [] }); } catch (e) { threw = /no local collection "Nope"/.test(e.message); }
ok('a collection not in this file throws, naming it', threw);
console.log(`${n}/${n} passed`);
