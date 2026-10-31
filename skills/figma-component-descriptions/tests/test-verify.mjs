#!/usr/bin/env node
// node tests/test-verify.mjs — from the skill folder. Runs scripts/verify.js
// against a fake file holding one instance layer whose name and parent throw,
// the way a broken layer does in Figma ("does not exist"), beside a healthy
// instance. The check must finish, list the broken one's id as brokenInstances
// and nothing else, still check the component beside it, and let any other
// error through: a guard that swallows a fault in the script reports a healthy
// instance as broken and checks nothing.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '../scripts/verify.js'), 'utf8');

const node = (props, children = []) => {
  const n = { children, ...props };
  for (const c of children) if (!Object.getOwnPropertyDescriptor(c, 'parent')) c.parent = n;
  const all = () => children.flatMap((c) => [c, ...(c.findAll ? c.findAll(() => true) : [])]);
  n.findAll = (fn) => all().filter(fn);
  n.findOne = (fn) => all().find(fn) || null;
  n.findAllWithCriteria = ({ types }) => all().filter((x) => { try { return types.includes(x.type); } catch { return false; } });
  return n;
};
const gone = () => { throw new Error('The node with id "I1:2;3:4" does not exist'); };
const broken = { id: 'I1:2;3:4', type: 'INSTANCE', children: [], findAll: () => [], findOne: () => null };
Object.defineProperty(broken, 'parent', { get: gone });
Object.defineProperty(broken, 'name', { get: gone });
broken.getMainComponentAsync = async () => null;

const description = 'A badge shows a count.\n\n## Usage\n\n- Beside a label\n\n## Don\'t\n\n- Use for status';
const badge = node({ id: '1:1', type: 'COMPONENT', name: 'Badge', descriptionMarkdown: description, componentPropertyDefinitions: {} });
const frame = node({ id: '1:3', type: 'FRAME', name: 'Example' }, [broken]);
// A documented page holds loose text beside its component (step 2e reads a bare one as unused).
const notes = node({ id: '1:5', type: 'TEXT', name: 'Notes' });
const page = node({ id: '0:1', type: 'PAGE', name: 'Badge' }, [badge, frame, notes]);
// A healthy instance of Badge inside another page's component: the walk reads
// it in full, past mainOf, where a planted fault would land.
const healthy = node({ id: 'I2:2;1:1', type: 'INSTANCE', name: 'Badge' });
healthy.getMainComponentAsync = async () => badge;
const card = node({ id: '2:1', type: 'COMPONENT', name: 'Card', componentPropertyDefinitions: {},
  descriptionMarkdown: 'A card groups one record.\n\n## Usage\n\n- One record\n\n## Don\'t\n\n- Nest cards' }, [healthy]);
const cardNotes = node({ id: '2:5', type: 'TEXT', name: 'Notes' });
const page2 = node({ id: '0:2', type: 'PAGE', name: 'Card' }, [card, cardNotes]);
const root = node({ id: '0:0', type: 'DOCUMENT' }, [page, page2]);
const figma = { root, loadAllPagesAsync: async () => {} };

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const out = await new AsyncFunction('figma', src)(figma);
ok('a broken instance layer does not end the check: it is listed by id and skipped', JSON.stringify(out.brokenInstances) === '["I1:2;3:4"]');
ok('and the component beside it is still checked', out.ok === 2 && out.missing.length === 0);
// Review S13: a fault planted after mainOf was counted as a broken instance.
const planted = src.replace('const main = await mainOf(inst);', 'const main = await mainOf(inst); notDefined;');
assert.notEqual(planted, src, 'the line the plant follows is still there');
ok('any error other than "does not exist" in the instance walk ends the check', await new AsyncFunction('figma', planted)(figma).then(() => false, (e) => e instanceof ReferenceError));
// The same for the guard over node reads: a type getter failing some other way.
const odd = { id: '1:9', name: 'Odd', parent: frame, children: [] };
Object.defineProperty(odd, 'type', { get: () => { throw new TypeError('something else'); } });
frame.children.push(odd);
ok('and in a read of an arbitrary node', await new AsyncFunction('figma', src)(figma).then(() => false, (e) => e instanceof TypeError));
frame.children.pop();
// The header lookup reads every node's name: the second place a broken layer crashed it.
const withHeader = src.replace('headerName: null,', 'headerName: "Header",').replace('headerBodyLayer: null', 'headerBodyLayer: "Body"');
assert.notEqual(withHeader, src, 'the CONFIG defaults the test rewrites are still there');
const out2 = await new AsyncFunction('figma', withHeader)(figma);
ok('a project with a documentation header also finishes past the broken layer', out2.brokenInstances.length === 1 && out2.ok === 2);
// Round 4 of the 2026-10-02 review: mainOf turned every error from
// getMainComponentAsync into "no main", which skipped the instance in silence.
const main = healthy.getMainComponentAsync;
healthy.getMainComponentAsync = async () => { throw new TypeError('something else'); };
ok('a main that cannot be read for any reason but "does not exist" ends the check', await new AsyncFunction('figma', src)(figma).then(() => false, (e) => e instanceof TypeError));
healthy.getMainComponentAsync = async () => { throw new Error('The node with id "I2:2;1:1" does not exist'); };
const out3 = await new AsyncFunction('figma', src)(figma);
ok('and a main that does not exist lists its instance as broken', JSON.stringify(out3.brokenInstances) === '["I1:2;3:4","I2:2;1:1"]' && out3.ok === 2);
healthy.getMainComponentAsync = main;
// Round 4: `defsOf` caught every error from a set's property definitions as
// "a broken set"; only Figma's own refusal ("existing errors") or a gone layer is.
const sick = node({ id: '3:1', type: 'COMPONENT_SET', name: 'Sick', descriptionMarkdown: description });
let defsError = new TypeError('something else');
Object.defineProperty(sick, 'componentPropertyDefinitions', { get: () => { throw defsError; }, configurable: true });
page.children.push(sick);
ok('a set whose definitions fail to read for any reason but Figma\'s own refusal ends the check', await new AsyncFunction('figma', src)(figma).then(() => false, (e) => e instanceof TypeError));
defsError = new Error('Component set has existing errors');
const out4 = await new AsyncFunction('figma', src)(figma);
ok('and one Figma refuses is listed as unreadable, the check going on', out4.unreadable.some((u) => u.name === 'Sick') && out4.ok >= 2 && out4.missing.length === 0);
page.children.pop();

// D17: a description cites a component without its leading status marker (figma-standard rule 13).
badge.name = '🚧 Badge';
card.descriptionMarkdown = 'A card groups one record beside a `Badge`.\n\n## Usage\n\n- One record\n\n## Don\'t\n\n- Nest cards';
const withMarker = src.replace('statusMarker: null,', 'statusMarker: "🚧",');
assert.notEqual(withMarker, src, 'the CONFIG statusMarker the test rewrites is still there');
const unmarkedRun = await new AsyncFunction('figma', src)(figma);
ok('D17: with no statusMarker in the config, nothing is stripped, so the unmarked citation is reported', unmarkedRun.unknownNames.length === 1);
const marked = await new AsyncFunction('figma', withMarker)(figma);
ok('D17: a name cited without its status marker is known', marked.unknownNames.length === 0);
card.descriptionMarkdown = 'A card groups one record beside a `Badge chip`.\n\n## Usage\n\n- One record\n\n## Don\'t\n\n- Nest cards';
const stale = await new AsyncFunction('figma', withMarker)(figma);
ok('D17: and a name that matches nothing is still reported', stale.unknownNames.length === 1);
badge.name = '_🚧 Badge';
card.descriptionMarkdown = 'A card groups one record beside a `_Badge`.\n\n## Usage\n\n- One record\n\n## Don\'t\n\n- Nest cards';
const privateMarked = await new AsyncFunction('figma', withMarker)(figma);
ok('D17: a private part marked after its _ is cited without the marker', privateMarked.unknownNames.length === 0);
badge.name = 'Badge';

// Step 4: duplicates and false fixity, on a file of their own.
{
  const text = 'A chip filters a list.\n\n## Usage\n\n- Above a list\n\n## Don\'t\n\n- Use for navigation';
  const defs = { 'Size': { type: 'VARIANT', variantOptions: ['S', 'L'] } };
  const chip = node({ id: '5:1', type: 'COMPONENT_SET', name: 'Chip', descriptionMarkdown: text, componentPropertyDefinitions: defs });
  const tag = node({ id: '5:2', type: 'COMPONENT', name: 'Tag', descriptionMarkdown: text.replace('filters', 'filters ') + '\n', componentPropertyDefinitions: {} });
  const shared = 'A top bar sits at the top of a screen. The icon is static per state. It is fixed.\n\n## Usage\n\n- On every screen\n\n## Don\'t\n\n- Stack two';
  const barA = node({ id: '5:3', type: 'COMPONENT', name: 'Top bar / Default', descriptionMarkdown: shared, componentPropertyDefinitions: { 'Back#1:0': { type: 'BOOLEAN' } } });
  const barB = node({ id: '5:4', type: 'COMPONENT', name: 'Top bar / Main', descriptionMarkdown: shared, componentPropertyDefinitions: {} });
  const still = node({ id: '5:5', type: 'COMPONENT', name: 'Divider', descriptionMarkdown: 'A divider is fixed: it has no props.\n\n## Usage\n\n- Between groups', componentPropertyDefinitions: {} });
  const loose = node({ id: '5:6', type: 'TEXT', name: 'Notes' });
  const pg = node({ id: '0:5', type: 'PAGE', name: 'Chips' }, [chip, tag, barA, barB, still, loose]);
  const f5 = { root: node({ id: '0:0', type: 'DOCUMENT' }, [pg]), loadAllPagesAsync: async () => {} };
  const withSep = src.replace('separator: null,', 'separator: " / ",');
  const o = await new AsyncFunction('figma', withSep)(f5);
  ok('step 4: one text on two differently named components is a duplicate, whitespace aside, with each one\'s axes',
    o.duplicates.length === 1 && JSON.stringify(o.duplicates[0].components.map((c) => [c.name, c.axes])) === '[["Chip",["Size"]],["Tag",[]]]');
  ok('step 4: a virtual set\'s members sharing their text are not duplicates', !o.duplicates.some((d) => d.components.some((c) => c.name.startsWith('Top bar'))));
  ok('step 4: a claim of fixity on a component with an interface is false fixity; on one with none it is not',
    o.falseFixity.length === 1 && o.falseFixity[0].name === 'Top bar / Default' && o.falseFixity[0].claim === 'is fixed' && o.falseFixity[0].interface[0] === 'Back (BOOLEAN)');
  const part = node({ id: '5:7', type: 'COMPONENT', name: 'Toast', descriptionMarkdown: 'A toast confirms an action. The icon is fixed per Feedback value and is not swappable.', componentPropertyDefinitions: { 'Label#2:0': { type: 'TEXT' } } });
  const pg7 = node({ id: '0:7', type: 'PAGE', name: 'Toast' }, [part, node({ id: '5:8', type: 'TEXT', name: 'Notes' })]);
  const o7 = await new AsyncFunction('figma', src)({ root: node({ id: '0:0', type: 'DOCUMENT' }, [pg7]), loadAllPagesAsync: async () => {} });
  ok('step 4: a part said to be fixed is no claim about the component', o7.falseFixity.length === 0);
  const says = async (text) => (await new AsyncFunction('figma', src)({ root: node({ id: '0:0', type: 'DOCUMENT' }, [node({ id: '0:8', type: 'PAGE', name: 'Button' }, [node({ id: '5:9', type: 'COMPONENT', name: 'Button', descriptionMarkdown: text, componentPropertyDefinitions: { 'Label#3:0': { type: 'TEXT' } } }), node({ id: '5:10', type: 'TEXT', name: 'Notes' })])]), loadAllPagesAsync: async () => {} })).falseFixity.map((f) => f.claim.toLowerCase());
  ok('step 4: "is not customisable", a plural and a claim after a lead-in clause are claims about the component',
    JSON.stringify([await says('A button submits. It is not customisable.'), await says('A button submits. Buttons are fixed.'), await says('A button submits. When disabled, the button is fixed.')]) === JSON.stringify([['not customisable'], ['are fixed'], ['is fixed']]));
  const noSep = await new AsyncFunction('figma', src)(f5);
  ok('step 4: with no separator setting, the shared text is a duplicate like any other', noSep.duplicates.length === 2);
}
console.log(`${n}/${n} passed`);
