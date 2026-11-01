#!/usr/bin/env node
// node tests/test-passes.mjs — from the skill folder. Runs the discovery passes'
// figma_execute bodies (scripts/pass-a-inventory.js, pass-c-libraries.js,
// pass-d-axes.js) against a fake file, the way the bridge runs them: as the
// body of an async function given `figma`.
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
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
const variants = [['Size=S, State=Rest'], ['Size=L, State=Rest'], ['Size=S, State=Hover']].map(([nm], i) => node({ id: '1:' + (i + 2), type: 'COMPONENT', name: nm }, i ? [] : [node({ id: '1:20', type: 'FRAME', name: 'button-container' }, [node({ id: '1:21', type: 'TEXT', name: 'button-label' }), node({ id: '1:22', type: 'INSTANCE', name: 'leading-icon' })])]));
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
  const lib = { root: { name: 'Web Components' }, teamLibrary: {
    getAvailableLibraryVariableCollectionsAsync: async () => [{ key: 'k1', name: 'Spacing', libraryName: 'Foundations' }, { key: 'k2', name: 'Colour', libraryName: 'Foundations' }],
    getVariablesInLibraryCollectionAsync: async (key) => key === 'k1' ? big : [{ name: 'Background/Primary' }]
  }, variables: { getLocalVariableCollectionsAsync: async () => [{ id: 'VariableCollectionId:1', name: 'Collection 1', modes: [{}, {}] }],
    getLocalVariablesAsync: async () => [{ name: 'Spacing/4', variableCollectionId: 'VariableCollectionId:1' }, { name: 'Other/1', variableCollectionId: 'VariableCollectionId:9' }] } };
  const out = await run(read('pass-c-libraries.js'), lib);
  const [spacing, colour] = out.collections;
  ok('pass C: collections are identified by key, with their library', spacing.key === 'k1' && spacing.library === 'Foundations' && colour.key === 'k2');
  ok('pass C: a collection over the name cap says it was truncated, with its full count', spacing.count === 401 && spacing.names.length === 400 && spacing.truncated === true && colour.truncated === false);
  ok('pass C: local collections are listed with their mode count and their own names, and the file is named', JSON.stringify(out.localCollections) === JSON.stringify([{ id: 'VariableCollectionId:1', name: 'Collection 1', modes: 2, count: 1, truncated: false, names: ['Spacing/4'] }]) && out.file === 'Web Components');
}

// ── pass C scales (node, over pass C's output and the source's snapshot tokens) ─
{
  const { scales } = await import('../scripts/pass-c-scales.mjs');
  // 0–64 by 2, unsorted, 28 missing; `Spacing/10` sits last, behind 60 colour names, where an eye reading
  // the list in order would have called 10 a gap
  const steps = Array.from({ length: 33 }, (_, i) => i * 2).filter((v) => v !== 10 && v !== 28).reverse();
  const colours = Array.from({ length: 60 }, (_, i) => ['Background', 'Text', 'Border'][i % 3] + '/' + ['Primary', 'Secondary', 'Danger', 'Success'][i % 4] + '/' + (i % 5 ? 'Rest' : 'Hover'));
  const passC = { collections: [
    { key: 'k1', name: 'Tokens', library: 'Foundations', count: 100, truncated: false, names: [...steps.map((v) => 'Spacing/' + v), ...colours, 'Spacing/0-5', 'Radius/4', 'Radius/8', 'Radius/full', 'Spacing/10'] },
    { key: 'k2', name: 'Colour', library: 'Foundations', count: 900, truncated: true, names: ['Grey/1', 'Grey/2', 'Grey/3', 'Blue/color-1'] }
  ] };
  const out = scales(passC);
  const sp = out.scales.find((s) => s.family === 'Spacing');
  ok('pass C scales: a step named late among many is in the scale, not a gap', sp.nameSteps.includes(10) && !sp.gaps.some((g) => g.missing.includes(10)));
  ok('pass C scales: a missing step is a gap, between the values either side', JSON.stringify(sp.gaps) === '[{"after":26,"before":30,"missing":[28]}]' && sp.nameSteps.length === 32 && sp.nameSteps[0] === 0 && sp.nameSteps[31] === 64);
  ok('pass C scales: a step that is not a plain number is listed, never read as one', JSON.stringify(sp.unparsed) === '["Spacing/0-5"]' && !sp.nameSteps.includes(5));
  const r = out.scales.find((s) => s.family === 'Radius');
  ok('pass C scales: kind is read from the family\'s words, and a named step stays unparsed', sp.kind === 'spacing' && r.kind === 'radius' && JSON.stringify(r.nameSteps) === '[4,8]' && JSON.stringify(r.unparsed) === '["Radius/full"]');
  ok('pass C scales: a scale from a truncated collection says it is not complete', out.scales.find((s) => s.family === 'Grey').complete === false && sp.complete === true);
  ok('pass C scales: a vocabulary family is not a scale', !out.scales.some((s) => /Background|Text/.test(s.family)));
  const g = out.grammar[0];
  ok('pass C scales: the grammar counts names per slot count, and each slot\'s values', g.separator === '/' && g.depths['3'] === 60 && g.depths['2'] === 36 && g.slots[0].values.Background === 20 && g.slots[2].distinct === 2 && /TBD/.test(g.slots[0].label));
  ok('pass C scales: colour and color are both counted, collection names included; a tie is asked', out.spelling.colour === 1 && out.spelling.color === 1 && /TBD/.test(out.spelling.tag));
  const uk = scales({ collections: [{ key: 'k', name: 'Colour', names: ['Colour/Text'] }] });
  ok('pass C scales: one spelling only is confirmed', uk.spelling.tag === '[confirmed] colour');
  ok('pass C scales: without tokens there is no audit block, and the note says names are not px nor ends seen', out.audit === null && !('px' in sp) && /not px/.test(out.note) && /end steps/.test(out.note));

  // index-named steps: `space/100` is 8px. The audit compares px, so only resolved values reach it.
  const src = (collections, owns = Object.keys(collections)) => ({ _meta: { sources: { SRC: { file: 'Foundations', owns: { collections: owns } } } }, collections });
  const one = (values) => ({ modes: ['Value'], values: { Value: values } });
  const lib = { collections: [{ key: 'k3', name: 'Primitives', library: 'Foundations', names: ['space/100', 'space/200'], truncated: true }] };
  const tokens = src({ Primitives: one({ 'space/100': 8, 'space/200': 16, 'Space/300': 24, 'space/400': 32, 'space/600': '1rem', 'space/700': null, 'Radius/sm': 4, 'Radius/md': 8, 'Radius/lg': 16, 'Corner/8': 8, 'Background/1': 1, 'Background/2': 2, 'Workspace/1': 1, 'Workspace/2': 2 }) });
  const v = scales(lib, tokens);
  const space = v.scales.find((s) => s.family.toLowerCase() === 'space');
  ok('pass C scales: a name\'s number is a name step; the px come from the tokens, and only px reach the audit', JSON.stringify(space.nameSteps) === '[100,200,300,400,600,700]' && JSON.stringify(space.px.values) === '[8,16,24,32]' && JSON.stringify(v.audit.spacing) === '[8,16,24,32]');
  ok('pass C scales: with tokens, names come from the snapshot collection, complete, not pass C\'s capped list', space.complete === true && v.scales.filter((s) => s.family.toLowerCase() === 'space').length === 1);
  ok('pass C scales: a value that is no number (a string, null) is listed, never dropped', JSON.stringify(space.notNumeric) === '[{"name":"space/600","mode":"Value","value":"1rem"},{"name":"space/700","mode":"Value","value":null}]');
  ok('pass C scales: with tokens, a word-named radius is a scale by its values', JSON.stringify(v.audit.radius) === '[4,8,16]' && v.scales.find((s) => s.family === 'Radius').nameSteps.length === 0);
  ok('pass C scales: a lone numbered name is skipped, listed with its values, never dropped', JSON.stringify(v.skipped.map((s) => [s.family, s.nameSteps, s.px, s.why])) === '[["Corner",[8],[8],"one numbered name"]]');
  ok('pass C scales: kind matches whole words: Background holds no "round", Workspace no "spac"', v.scales.find((s) => s.family === 'Background').kind === null && v.scales.find((s) => s.family === 'Workspace').kind === null && !v.audit.spacing.includes(1));

  // two collections and two libraries holding the same name: only the matching one's values are read
  const two = { collections: [{ key: 'kc', name: 'Core', library: 'Foundations', names: [] }, { key: 'kb', name: 'Core', library: 'Brand kit', names: ['Spacing/4'] }, { key: 'kx', name: 'Extra', library: 'Foundations', names: [] }] };
  const shared = src({ Primitives: one({ 'Spacing/4': 999, 'Spacing/8': 998 }), Core: one({ 'Spacing/4': 16, 'Spacing/8': 32 }), Extra: one({}) }, ['Primitives', 'Core']);
  const t2 = scales(two, shared);
  ok('pass C scales: a name is looked up only in its own collection of its own library', JSON.stringify(t2.audit.spacing) === '[16,32]' && JSON.stringify(t2.notInSnapshot.map((x) => [x.key, /not of/.test(x.why) ? 'library' : 'collection'])) === '[["kb","library"],["kx","collection"]]');
  ok('pass C scales: a kind with no values is left out of the audit block, never []', !('radius' in t2.audit));

  // a store from before `shared` (no seq, no kept copy): which library's the one copy is is unknowable, so neither is read
  const both = { _meta: { sources: { A: { file: 'Foundations', owns: { collections: ['Core'] } }, B: { file: 'Brand kit', owns: { collections: ['Core'] } } } }, collections: { Core: one({ 'Spacing/4': 4, 'Spacing/8': 8 }) } };
  const t3 = scales({ collections: [{ key: 'kc', name: 'Core', library: 'Foundations', names: [] }] }, both);
  ok('pass C scales: a collection more than one source owns is not read, and says why', t3.scales.length === 0 && /more than one source/.test(t3.notInSnapshot[0].why) && /shared ownership/.test(t3.auditWhy));
  // with `seq` and `shared` (the store from snapshot's shared copies): each library reads its own copy
  const kept = { _meta: { sources: { A: { file: 'Foundations', seq: 1, owns: { collections: ['Core'] } }, B: { file: 'Brand kit', seq: 2, owns: { collections: ['Core'] } } } }, collections: { Core: one({ 'Spacing/4': 40, 'Spacing/8': 80 }) }, shared: { Core: { A: one({ 'Spacing/4': 4, 'Spacing/8': 8 }) } } };
  const read = (library) => scales({ collections: [{ key: 'kc', name: 'Core', library, names: [] }] }, kept).audit;
  ok('pass C scales: a shared name is read from the library\'s own kept copy', JSON.stringify(read('Foundations').spacing) === '[4,8]');
  ok('pass C scales: and from the shown copy when the library wrote it last', JSON.stringify(read('Brand kit').spacing) === '[40,80]');
  // one file name under two entries (a moved file before routing settles): the latest entry's copy, not the older kept one
  const moved = { _meta: { sources: { OLD: { file: 'Lib', seq: 1, owns: { collections: ['Core'] } }, NEW: { file: 'Lib', seq: 2, owns: { collections: ['Core'] } } } }, collections: { Core: one({ 'Spacing/4': 4, 'Spacing/8': 8 }) }, shared: { Core: { OLD: one({ 'Spacing/4': 99, 'Spacing/8': 98 }) } } };
  ok('pass C scales: of two entries for one library, the last writer\'s shown copy wins over an older kept one', JSON.stringify(scales({ collections: [{ key: 'kc', name: 'Core', library: 'Lib', names: [] }] }, moved).audit.spacing) === '[4,8]');
  const split = { _meta: { sources: { A: { file: 'Foundations', owns: { collections: ['Other'] } }, B: { file: 'Foundations', owns: { collections: ['Core'] } } } }, collections: { Core: one({ 'Spacing/4': 4, 'Spacing/8': 8 }), Other: one({}) } };
  ok('pass C scales: every source with the library\'s file name is considered, not the first', JSON.stringify(scales({ collections: [{ key: 'kc', name: 'Core', library: 'Foundations', names: [] }] }, split).audit.spacing) === '[4,8]');
  const wrong = scales({ collections: [{ key: 'kc', name: 'Core', library: 'Renamed library', names: [] }] }, src({ Core: one({ 'Spacing/4': 4 }) }));
  ok('pass C scales: when nothing matches, audit is null with the reason, naming the snapshot\'s source files', wrong.audit === null && /"Foundations"/.test(wrong.auditWhy) && /"Foundations"/.test(wrong.notInSnapshot[0].why));
  // a library that is its own source: no library collection, its scales in its own locals, named by `file`
  const self = scales({ file: 'Foundations', collections: [], localCollections: [{ id: 'L1', name: 'Core', names: ['Spacing/4', 'Spacing/8'] }] }, src({ Core: one({ 'Spacing/4': 4, 'Spacing/8': 8 }) }));
  ok("pass C scales: a library that is its own source reads its local collections as that library's", JSON.stringify(self.audit.spacing) === '[4,8]' && self.scales[0].local === true);
  const none = scales({ collections: [], localCollections: [{ id: 'L1', name: 'Core' }] }, src({ Core: one({ 'Spacing/4': 4 }) }));
  ok('pass C scales: an output that read nothing (an older one, with no `file`) is null with the reason, never an empty block', none.audit === null && /read no collection/.test(none.auditWhy));
  const dir = mkdtempSync(join(tmpdir(), 'pass-c-'));
  writeFileSync(join(dir, 'c.json'), JSON.stringify({ collections: [{ key: 'kc', name: 'Core', library: 'Renamed library', names: [] }] }));
  writeFileSync(join(dir, 't.json'), JSON.stringify(src({ Core: one({ 'Spacing/4': 4 }) })));
  const cli = spawnSync(process.execPath, [join(HERE, '../scripts/pass-c-scales.mjs'), join(dir, 'c.json'), '--tokens', join(dir, 't.json')], { encoding: 'utf8' });
  rmSync(dir, { recursive: true });
  ok('pass C scales: the command says it on stderr and exits non-zero when nothing matched', cli.status === 1 && /no collection of pass C/.test(cli.stderr) && cli.stderr.trim().split('\n').length === 1);

  // modes: a density collection's px are listed per mode and their union is the scale
  const dens = scales({ collections: [{ key: 'kd', name: 'Density', library: 'Foundations', names: [] }] },
    src({ Density: { modes: ['Compact', 'Comfortable'], values: { Compact: { 'Gap/sm': 4, 'Gap/md': 8 }, Comfortable: { 'Gap/sm': 8, 'Gap/md': 12 } } } }));
  ok('pass C scales: every mode is read, px listed per mode and their union in the audit', JSON.stringify(dens.scales[0].pxByMode) === '{"Compact":[4,8],"Comfortable":[8,12]}' && JSON.stringify(dens.audit.spacing) === '[4,8,12]');

  // names a reader would read wrong: a unit, a negative, the kind words' plurals, and a word-named radius with no snapshot
  const odd = scales({ collections: [{ key: 'ko', name: 'Layout', names: ['space/4px', 'space/8px', 'Margin/-4', 'Margin/4', 'Paddings/1', 'Paddings/2', 'Insets/1', 'Insets/2', 'Spacer/1', 'Spacer/2', 'Radiuses/1', 'Radiuses/2', 'Radius/sm', 'Radius/md', 'Radius/lg'] }] });
  const fam = (f) => odd.scales.find((s) => s.family === f);
  ok('pass C scales: `4px` reads 4 and `-4` reads -4', JSON.stringify(fam('space').nameSteps) === '[4,8]' && JSON.stringify(fam('Margin').nameSteps) === '[-4,4]');
  ok('pass C scales: paddings, insets and spacer are spacing; radiuses is radius', ['Paddings', 'Insets', 'Spacer'].every((f) => fam(f).kind === 'spacing') && fam('Radiuses').kind === 'radius');
  ok('pass C scales: a radius family with no numbered name and no snapshot is skipped, never lost', odd.skipped.some((s) => s.family === 'Radius' && s.why === 'no numbered name' && s.unparsed.length === 3));
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
  ok('pass D: the first variant\'s layer names come back, for pass B\'s suffixes', JSON.stringify(btn.layers) === '["button-container","button-label","leading-icon"]');
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

// ── pass B (node, over pass A's and pass D's output) ─────────────────────────
{
  const { naming } = await import('../scripts/pass-b-naming.mjs');
  const passA = { fileKey: 'KEY', fileName: 'Web Components', pages: [
    { name: 'Inputs', sets: 5, comps: 3, names: ['_Label', '_Hint', '_Caret', 'Top bar / Default', 'Top bar / Main', 'Text input', 'Select', 'Lone / Only'] },
    { name: 'Forms', sets: 1, comps: 1, names: ['Label', '.Dot'] }
  ] };
  const passD = [{ name: 'Button', layers: ['button-container', 'button-label', 'leading-icon'] }, { name: 'Input', layers: ['input-label', 'trailing-icon', 'Frame 12'] }, { name: 'Bad', error: 'not found' }];
  const out = naming(passA, passD);
  const us = out.prefixes.find((p) => p.prefix === '_');
  ok('pass B: a leading mark is counted with its pages, recordable at three', us.count === 3 && us.recordable && JSON.stringify(us.pages) === '["Inputs"]');
  ok('pass B: a lone mark is listed but not recordable', out.prefixes.find((p) => p.prefix === '.').recordable === false);
  const slash = out.separators.find((s) => s.separator === ' / ');
  const spaced = naming({ pages: [{ name: 'A', names: ['🔒 Button', '_ Chip'] }, { name: 'B', names: ['Button', 'Chip'] }] });
  ok('pass B: a mark followed by a space still names the bare component it contradicts', JSON.stringify(spaced.contradictions.map((c) => c.name)) === '["Button","Chip"]');
  ok('pass B: a separator needs two siblings on one stem; a lone slash-name is no evidence', slash.groups === 1 && slash.stems[0].stem === 'Top bar' && !slash.stems.some((g) => g.stem === 'Lone'));
  ok('pass B: " / " is not also counted as a bare "/"', !out.separators.some((s) => s.separator === '/'));
  ok('pass B: a name prefixed on one page and bare on another is a contradiction, with both pages', JSON.stringify(out.contradictions) === JSON.stringify([{ name: 'Label', prefixed: '_Label', prefixedOn: 'Inputs', bareOn: ['Forms'] }]));
  ok('pass B: a layer ending in two sampled sets is a suffix; one set\'s is not', JSON.stringify(out.suffixes.map((s) => s.suffix)) === '["-icon","-label"]' && out.suffixes[0].sets.length === 2);
  ok('pass B: with no pass D, it says suffixes are unread rather than finding none', /unread/.test(naming(passA).suffixSample) && naming(passA).suffixes.length === 0);
}

// ── pass E ───────────────────────────────────────────────────────────────────
{
  const md = '## Usage\n- Use it for the main action.\n- Not for links\n\n## Behaviour\nThe colour changes; the color token is `x`.';
  const desc = node({ id: '5:1', type: 'COMPONENT_SET', name: 'Chip', description: 'x', descriptionMarkdown: md }, [node({ id: '5:2', type: 'COMPONENT', name: 'State=Rest', description: 'variant', descriptionMarkdown: 'variant' })]);
  const plain = node({ id: '5:3', type: 'COMPONENT', name: 'Plain' });
  const main = node({ id: '6:1', type: 'COMPONENT', name: 'Doc header' });
  const header = node({ id: '6:2', type: 'INSTANCE', name: 'Doc header', getMainComponentAsync: async () => main }, [node({ id: '6:3', type: 'TEXT', name: 'Title' }), node({ id: '6:4', type: 'TEXT', name: 'Body' })]);
  const inside = node({ id: '6:5', type: 'INSTANCE', name: 'Section header', getMainComponentAsync: async () => main });
  const wrap = node({ id: '6:6', type: 'COMPONENT', name: 'Card' }, [inside]);
  const page = node({ id: '0:5', type: 'PAGE', name: 'Chip' }, [desc, plain, header, wrap]);
  const root2 = node({ id: '0:0', type: 'DOCUMENT', name: 'F' }, [page]);
  const f2 = { root: root2, fileKey: 'E', loadAllPagesAsync: async () => {}, getNodeByIdAsync: async (id) => root2.findAll(() => true).find((x) => x.id === id) || null };
  const out = await run(read('pass-e-descriptions.js'), f2);
  const [chip] = out.samples;
  ok('pass E: the first described components are sampled, never a variant, never an undescribed one', out.samples.length === 1 && chip.name === 'Chip');
  ok('pass E: headings as written, bullets and those ending in a full stop', JSON.stringify(chip.headings) === '["## Usage","## Behaviour"]' && chip.bullets === 2 && chip.bulletsWithStop === 1);
  ok('pass E: spelling pairs are counted, both sides', out.spelling.colour === 1 && out.spelling.color === 1 && out.spelling.behaviour === 1 && out.spelling.behavior === 0);
  ok('pass E: a header instance outside any component is a candidate, with its text layers; one inside a component is not', out.headerCandidates.length === 1 && out.headerCandidates[0].component === 'Doc header' && JSON.stringify(out.headerCandidates[0].textLayers) === '["Title","Body"]' && out.headerPage === 'Chip');
  // ids mode loads no page itself: the header scan must load the page it reads, as dynamic-page requires
  let loaded = false;
  const walk = page.findAllWithCriteria;
  page.loadAsync = async () => { loaded = true; };
  page.findAllWithCriteria = function (c) { if (!loaded) throw new Error('page not loaded'); return walk.call(this, c); };
  const byIds = await run(read('pass-e-descriptions.js').replace(/ids: \[\]/, 'ids: ["5:3", "9:9"]'), f2);
  ok('pass E: given ids are read as given, a missing one reported', byIds.samples[0].name === 'Plain' && byIds.samples[0].headings.length === 0 && byIds.samples[1].error === 'not found');
}

// ── passes F and S4 ──────────────────────────────────────────────────────────
{
  const localTable = node({ id: '7:1', type: 'COMPONENT', name: 'Table - Colour' });
  const remoteSet = { type: 'COMPONENT_SET', name: 'Cell - Swatch', key: 'remoteSetKey' };
  const remoteCell = { type: 'COMPONENT', name: 'Type=Hex', remote: true, key: 'variantKey', parent: remoteSet };
  const ratios = { type: 'COMPONENT', name: '_Ratios grid', remote: true, key: 'r' };
  const inst = (id, main) => node({ id, type: 'INSTANCE', name: 'x', getMainComponentAsync: async () => main });
  const p1 = node({ id: '0:7', type: 'PAGE', name: '1 - Colour - Primitives' }, [inst('7:2', remoteCell), inst('7:3', remoteCell), inst('7:4', ratios), inst('7:5', localTable)]);
  const p2 = node({ id: '0:8', type: 'PAGE', name: 'Components' }, [localTable, inst('7:6', { type: 'COMPONENT', name: 'Button' })]);
  const root3 = node({ id: '0:0', type: 'DOCUMENT', name: 'Docs' }, [p1, p2]);
  const settings = JSON.parse(readFileSync(join(HERE, '../../../standards/audit-settings.json'), 'utf8'));
  const TOKENS = 'const TOKENS = ' + JSON.stringify({ ratiosGrid: settings['audit-defaults'].tokens.ratiosGrid, pageSectionComponent: settings['audit-defaults'].pages.pageSectionComponent }) + ';\n';
  const out = await run(TOKENS + read('pass-f-doc-apparatus.js'), { root: root3, fileKey: 'F', loadAllPagesAsync: async () => {} });
  ok('pass F: with no settings prepended it refuses, never a house name of its own', await run(read('pass-f-doc-apparatus.js'), { root: root3 }).then(() => false, (e) => /prepend the library's settings/.test(e.message)));
  ok('pass F: a contract name is counted local and as instances, and remote furniture keeps its set\'s key', out.furniture['Table - '].local === 1 && out.furniture['Table - '].instances === 1 && out.furniture['Table - '].remote === 0 && out.furniture['Cell - '].instances === 2 && out.furniture['Cell - '].remote === 2 && JSON.stringify(out.furniture['Cell - '].keys) === '["remoteSetKey"]');
  ok('pass S4: _Ratios grid instances per page, and a page with none is absent', JSON.stringify(out.ratiosGrid) === '{"1 - Colour - Primitives":1}');
  ok('pass F: the page names, in order, for the page contract', JSON.stringify(out.pages) === '["1 - Colour - Primitives","Components"]');
}

// ── pass S2 ──────────────────────────────────────────────────────────────────
{
  const vars = {};
  const ids = (prefix, names, hidden = true) => names.map((nm, i) => { const id = prefix + i; vars[id] = { name: nm, hiddenFromPublishing: hidden }; return id; });
  const blue = ids('b', Array.from({ length: 12 }, (_, i) => 'Blue/' + (i === 7 ? '8-anchor' : String(i + 1))));
  const alpha = ids('a', ['Alphas/Blue/A0', 'Alphas/Blue/A1']);
  const sem = ids('s', ['Background/Primary'], false);
  const src = { fileKey: 'SRC', variables: {
    getLocalVariableCollectionsAsync: async () => [
      { key: 'p', name: 'Primitives', hiddenFromPublishing: false, variableIds: [...blue, ...alpha, 'gone'] },
      { key: 's', name: 'Semantic', hiddenFromPublishing: false, variableIds: sem }
    ],
    getVariableByIdAsync: async (id) => vars[id] || null
  } };
  const out = await run(read('pass-s2-primitives.js'), src);
  ok('pass S2: by default only the hidden collections are read', out.collections.length === 1 && out.collections[0].name === 'Primitives');
  const [p] = out.collections;
  const b = p.ramps.find((r) => r.ramp === 'Blue');
  ok('pass S2: a ramp is its parent path, its steps in library order, with a marker found', b.count === 12 && b.steps[0] === '1' && JSON.stringify(b.markers) === '["8-anchor"]' && !b.alpha);
  ok('pass S2: an alpha ramp says so; step lengths are tallied', p.ramps.find((r) => r.ramp === 'Alphas/Blue').alpha === true && JSON.stringify(p.stepCounts) === '{"2":1,"12":1}' && p.variables === 14);
  const named = await run(read('pass-s2-primitives.js').replace(/collections: \[\]/, 'collections: ["Semantic"]'), src);
  ok('pass S2: named collections are read whatever their hiding', named.collections.length === 1 && named.collections[0].ramps[0].ramp === 'Background');
}

// ── registry (node, over pass A and pass C) ──────────────────────────────────
{
  const { registry } = await import('../scripts/registry.mjs');
  const lib = { fileKey: 'LIB', fileName: 'Web | Components', pages: [{ sets: 4, comps: 2 }, { sets: 1, comps: 0 }] };
  const src = { fileKey: 'SRC', fileName: 'Foundations', pages: [{ sets: 0, comps: 0 }] };
  const c = { collections: [{ key: 'k2', library: 'Foundations' }, { key: 'k1', library: 'Foundations' }, { key: 'i1', library: 'Icons' }] };
  const md = registry([{ a: lib, c }, { a: src }]);
  ok('registry: one row per file, roles proposed from the inventory and tagged, audience asked', md.includes('| Web \\| Components | `LIB` | component library `[inferred — 5 sets, 2 components; confirm]` | `[TBD — ask]` |') && md.includes('| Foundations | `SRC` | variable source `[inferred — no components; confirm]`'));
  ok('registry: the dependency line names each library and the collection keys behind the edge', md.includes('Dependency: Foundations → Web | Components (collections `k2`, `k1`); Icons → Web | Components (collections `i1`).'));
  ok('registry: with no pass C, the dependency is TBD, never empty', registry([{ a: src }]).includes('Dependency: `[TBD'));
}

console.log(`${n}/${n} passed`);
