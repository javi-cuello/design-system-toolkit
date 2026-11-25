#!/usr/bin/env node
// node tools/snapshot/test-mcp.mjs — the code mcp.mjs serves to use_figma, and how it reads a payload back
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { script, stripped, joined, named, libraryKey, PLUGIN, CAP, CHUNK, PER_NODE, NS, planCode, sized, calls, join, payloadOf, storeCode, tokensCode, partCode, DEAD, LIMIT } from './mcp.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const code = script();
ok(`the code fits use_figma's ${CAP} characters`, code.length <= CAP);
let parses = true; try { new vm.Script(`(async () => {\n${code}\n})`); } catch { parses = false; }
ok('and parses as the body use_figma runs', parses);
ok('the window and the headless entry, dead code there, are cut where the plugin marks them', !/figma\.ui\.onmessage|function __headless|function collectFacts/.test(code) && /function collectLibrary/.test(code));
ok('it runs headless, and collects as the plugin does', /^const HEADLESS = true;$/m.test(code) && /await collectLibrary\(true\)/.test(code));
ok('every page is loaded through the fallback, never loadAllPagesAsync alone', (code.match(/loadAllPagesAsync/g) || []).length === 1 && /const loadPages/.test(code));
ok('no \\u or \\\\ escape in it, since the tool call that carries it decodes them (probed 2026-10-30: a \\u2028 in a regex arrived as a line break)', !/\\u|\\\\/.test(code));
ok('the epilogue escapes as the payload reader expects', code.includes("replace(/[^ -~]/g, (c) => String.fromCharCode(92) + 'u'"));
ok('the plugin holds no multi-line string, whose lines the stripping would trim', stripped(readFileSync(PLUGIN, 'utf8')).split('\n').every((l) => (l.replace(/\\./g, '').match(/`/g) || []).length % 2 === 0));
ok('a trailing comment is dropped where nothing before it can hold a //', stripped('a(b); // why') === 'a(b);');
ok('…and kept where a string or a regex comes first', stripped("x = 'p'; // why") === "x = 'p'; // why" && stripped('r = /a/; // why') === 'r = /a/; // why');
ok('an inline /* */ is dropped on the same guard', stripped('} catch (e) { /* why */ }') === '} catch (e) { }' && stripped("s = '/* k */';") === "s = '/* k */';");
ok('an inline /* */ against a word never joins two words', stripped('let /* c */x = 1;') === 'let x = 1;' && stripped('return/* c */x;') === 'return x;');
ok('an inline type note before a cast is dropped, the cast kept', stripped('const a = /** @type {X[]} */ (b);') === 'const a = (b);');
ok('a comment is dropped, and a // inside a string kept', stripped("// note\nconst a = 'http://x';\n/* one\n two */\nb();") === "const a = 'http://x';\nb();");

// the payload as the epilogue leaves it, read back as REST gives it
const payload = { tokens: { _meta: { fileKey: 'K' } }, components: [{ name: 'Chip ✓', page: '❖ Chip' }], blob: 'x'.repeat(CHUNK * (PER_NODE + 2)) };
const text = JSON.stringify(payload).replace(/[^ -~]/g, (c) => String.fromCharCode(92) + 'u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const entries = []; for (let i = 0; i < text.length; i += CHUNK) entries.push(text.slice(i, i + CHUNK));
const boxes = []; entries.forEach((e, i) => { if (i % PER_NODE === 0) boxes.push({ id: `b${boxes.length}`, sharedPluginData: { [NS]: {} } }); boxes.at(-1).sharedPluginData[NS][`c${i}`] = e; });
const holder = { id: '1:1', sharedPluginData: { [NS]: { n: String(entries.length) } }, children: boxes };
ok('every entry is under 100 kB, as Figma allows', text.length > CHUNK * PER_NODE && /^[\x00-\x7f]*$/.test(text) && entries.every((e) => e.length <= CHUNK));
ok('the payload reads back whole, across frames, its characters as they were', JSON.stringify(joined(holder)) === JSON.stringify(payload));
delete boxes[1].sharedPluginData[NS][`c${PER_NODE}`];
assert.throws(() => joined(holder), /part 40 is missing/); n++; console.log('ok a missing part is refused, never joined short');
assert.throws(() => joined({ id: '2:2' }), /holds no snapshot/); n++; console.log('ok a node with no payload says so');

ok("the file's name is Figma's own, since use_figma calls every file Document", named({ tokens: { _meta: { file: 'Document' } } }, 'UI library').tokens._meta.file === 'UI library');
const routed = [{ key: 'KT', name: 'Tokens' }, { key: 'KC', name: 'Components' }, { id: 'only-an-id' }];
ok('one keyed library file is the one read', libraryKey([{ key: 'KT' }, { id: 'x' }]).key === 'KT');
ok('with several, --file names the one read, never the first by default', libraryKey(routed, 'KC').key === 'KC' && /--file/.test(libraryKey(routed).error));
ok('a --file the project does not route is refused', /no library file with the key KX/.test(libraryKey(routed, 'KX').error));

// ---- a large library in parts
const plan = [
  { index: 1, name: 'Button', sets: [{ id: '1:1', walks: 600 }, { id: '1:2', walks: 600 }] },
  { index: 2, name: 'Table', sets: [{ id: '2:1', walks: 4000 }] },
  { index: 4, name: 'Chip', sets: [{ id: '4:1', walks: 100 }, { id: '4:2', walks: 1000 }, { id: '4:3', walks: 500 }] },
];
const parts = sized(plan);
ok(`parts are sized at ${LIMIT} walks, a set over the limit alone, the plan's order kept; a part names its sets only where it takes part of a page`,
  JSON.stringify(parts.map((p) => [p.pages, p.scope])) === JSON.stringify([[[1], null], [[2], null], [[4], ['4:1', '4:2']], [[4], ['4:3']]]) && parts.map((p) => p.walks).join() === '1200,4000,1100,500');
const made = calls(plan);
ok('the calls are the tokens call, the store call with the first part, then one call a part', made.length === 5 && made[0].call === 'tokens' && /storing the walk/.test(made[1].call) && /^part 4 of 4: 500 walks on page 4$/.test(made[4].call));
const every = [planCode(), ...made.map((c) => c.code)];
ok(`every call fits use_figma's ${CAP} characters, and holds no \\u or \\\\ escape`, every.every((c) => c.length <= CAP && !/\\u|\\\\/.test(c)));
let allParse = true; for (const c of every) { try { new vm.Script(`(async () => {\n${c}\n})`); } catch { allParse = false; } }
ok('…and each parses as the body use_figma runs', allParse);
const store = made[1].code;
ok('the tokens call carries no walk: only the page tests and componentSets of what reads components', !/\b(walk|slotPaths|collectComponents|preferredName|propLinks|detect|RENDERABLE|isGraphicPage)\b/.test(made[0].code) && /const componentSets/.test(made[0].code) && /const isScratchPage/.test(made[0].code));
ok('a call with no icons carries none of what only icons reach, nor the parts the tokens', DEAD.parts().every((name) => !new RegExp(`\\b${name}\\b`).test(store)) && !/withIcons\) \{/.test(store)
  && DEAD.tokens().every((name) => !new RegExp(`\\b${name}\\b`).test(made[0].code)) && /await collectTokens\(\)/.test(made[0].code));
const snap = new Function(store.slice(0, store.indexOf('\nconst __page')) + '\nreturn __snap;')();
ok("the stored walk round-trips: new Function('return ' + its text) gives the same function", typeof snap === 'function' && new Function('return ' + snap.toString())().toString() === snap.toString());

// the calls run against a stand-in figma: the parts walk what one whole walk does, and join in its order
{
  let ids = 100;
  const shared = () => { const d = {}; return { sharedPluginData: { [NS]: d }, setSharedPluginData: (ns, k, v) => { d[k] = v; }, getSharedPluginData: (ns, k) => d[k] || '' }; };
  const frame = (type, name) => ({ id: `9:${ids++}`, type, name, children: [], ...shared(), appendChild(c) { c.parent = this; this.children.push(c); }, findAll(f) { const out = []; const v = (n) => { for (const c of n.children || []) { if (f(c)) out.push(c); v(c); } }; v(this); return out; }, findAllWithCriteria({ types }) { return this.findAll((c) => types.includes(c.type)); }, loadAsync: async () => {} });
  const page = (name, comps) => { const p = frame('PAGE', name); for (const [nm, id, variants = 0] of comps) { const c = Object.assign(frame(variants ? 'COMPONENT_SET' : 'COMPONENT', nm), { id, width: 40, height: 20, componentPropertyDefinitions: {}, boundVariables: {} }); p.appendChild(c); } return p; };
  const pages = [page('Cover', []), page('Button', [['Button', '1:1'], ['Link', '1:2']]), page('Table', [['Table', '2:1']]), page('Icons', [['Arrow', '3:1']]), page('Chip', [['Chip', '4:1'], ['Tag', '4:2'], ['Badge', '4:3']]), page('Button', [['Card', '5:1']])];
  pages[3].children[0].description = 'arrow, direction';
  Object.assign(pages[4].children[1], { paragraphSpacing: 5, listSpacing: 3 });
  globalThis.figma = { root: { name: 'Document', children: pages }, fileKey: 'K', skipInvisibleInstanceChildren: false, variables: { getVariableByIdAsync: async () => null, getLocalVariableCollectionsAsync: async () => [] },
    getLocalTextStylesAsync: async () => [], getLocalEffectStylesAsync: async () => [], getLocalPaintStylesAsync: async () => [], getStyleByIdAsync: async () => null,
    loadAllPagesAsync: async () => {}, createFrame: () => frame('FRAME', ''), createPage() { const p = frame('PAGE', ''); pages.push(p); return p; } };
  const run = (code) => new (Object.getPrototypeOf(async () => {}).constructor)(code)();
  const planned = await run(planCode());
  ok('the plan names each set by page, the icon page left out', JSON.stringify(planned.map((pg) => [pg.index, pg.sets.map((s) => s.id)])) === '[[1,["1:1","1:2"]],[2,["2:1"]],[4,["4:1","4:2","4:3"]],[5,["5:1"]]]' && planned[0].sets[0].walks === 1);
  const steps = sized(planned, 2);
  const rest = steps.slice(1).map(partCode);
  const holders = [];
  // the parts run out of order: collect puts them back
  const tokensAt = (await run(made[0].code)).holder;
  const tmpPage = () => pages.find((p) => p.name === 'Snapshot (temporary)');
  tmpPage().setSharedPluginData(NS, 'unanswered', '2');
  holders.push((await run(storeCode(steps[0]))).holder);
  for (const c of rest.reverse()) holders.push((await run(c)).holder);
  const asRest = (n) => ({ id: n.id, sharedPluginData: n.sharedPluginData, children: n.children.map(asRest) });
  const tmp = pages.find((p) => p.name === 'Snapshot (temporary)');
  const found = holders.map((id) => joined(asRest(tmp.children.find((h) => h.id === id))));
  const top = joined(asRest(tmp.children.find((h) => h.id === tokensAt)));
  ok('the tokens call leaves the tokens, the sets the parts must walk, and the icon names by collectLibrary\'s own expressions', top.tokens && top.sets.join() === '1:1,1:2,2:1,4:1,4:2,4:3,5:1' && top.iconPage === 'Icons' && top.iconSets.join() === 'Arrow' && top.iconDescriptions.Arrow === 'arrow, direction');
  const whole = join([top, ...found]);
  const ref = await vm.runInContext(readFileSync(PLUGIN, 'utf8') + '\n;collectComponents({ withIcons: false, previews: [], darkModes: async () => [] })', vm.createContext({ figma: globalThis.figma, console, setTimeout, clearTimeout }));
  ok('the parts, run in any order, join into what one whole walk gives, in its order, the icons named; two pages of one name each walked once', JSON.stringify(whole.components) === JSON.stringify(ref) && whole.components.length === 7 && steps[0].scope === null && whole.iconSets.join() === 'Arrow' && whole.icons.length === 0);
  ok('a part returns what each node left unrecorded as that node\'s group, which the join keeps as the whole walk does', found.some((f) => JSON.stringify(f.unrecorded) === '[["Tag.paragraphSpacing","Tag.listSpacing"]]') && whole.tokens._meta.unrecorded.join() === 'Tag.paragraphSpacing,Tag.listSpacing' && ref.length === 7);
  ok('each part starts from the count of variables left unanswered so far, leaves its own for the next, and says what it added', found.every((f) => f.unanswered === 0) && tmp.getSharedPluginData(NS, 'unanswered') === '2');
  const head = top;
  assert.throws(() => join([head, ...found.slice(1)]), /no part walked 2 planned sets \(1:1, 1:2\)/); n++; console.log('ok a part not collected is refused, its sets named');
  assert.throws(() => join([head, ...found, found[1]]), /walked more than once/); n++; console.log('ok a part collected twice is refused');
  assert.throws(() => join([{ ...head, sets: head.sets.slice(1) }, ...found]), /not in the file the tokens call read/); n++; console.log('ok a set the tokens call did not find is refused');
  assert.throws(() => join(found), /0 of the holders hold the tokens/); n++; console.log('ok parts with no tokens holder are refused');
  delete globalThis.figma;
}
{
  const head = { tokens: { _meta: {} }, unanswered: 1, sets: ['a', 'b'] };
  const part = (id, more) => ({ sets: [id], components: [], unrecorded: [], unreadable: [], unanswered: 1, ...more });
  const a = part('a', { unrecorded: [...Array.from({ length: 199 }, (_, i) => [`x${i % 3}`]), ['over1', 'over2']], unreadable: [{ name: 'Bad', reason: 'r' }, { name: 'Set', page: 'P', reason: 'r' }], unanswered: 2 });
  const b = part('b', { unrecorded: [['late']], unreadable: [{ name: 'Bad', reason: 'r' }, { name: 'Worse', reason: 'r' }, { name: 'Set', page: 'P', reason: 'r' }], unanswered: 1 });
  const j = join([head, b, a]);
  ok('the unrecorded are kept as the whole walk keeps them: a node\'s all while fewer than 200 are kept, in plan order, then the first 40 kinds', j.tokens._meta.unrecorded.join() === 'x0,x1,x2,over1,over2');
  ok('the run\'s unanswered count is the tokens call\'s plus what each part added, so parts run side by side lose none', j.tokens._meta.variablesUnanswered === 4);
  ok('a variant unreadable in two parts is listed once, as the walk lists it; a set\'s entry, which says its page, each time', j.unreadable.map((x) => x.name).join() === 'Bad,Set,Worse,Set');
  const c = part('a', { unreadable: [{ name: 'Card', page: 'P', reason: 'r' }] }), d = part('b', { unreadable: [{ name: 'Card', reason: 'r' }] });
  ok('a variant\'s entry after a set\'s of the same name, in another part, is dropped, as the walk drops it', join([head, c, d]).unreadable.length === 1);
  const code = storeCode({ pages: [0], scope: null });
  ok('a part stores its unanswered count only once its holder is written, so a part that fails writing it leaves the count as it was', code.indexOf("'unanswered', String(unanswered)") > code.indexOf("__holder.setSharedPluginData"));
  assert.throws(() => payloadOf([head]), /no part walked 2 planned sets/); n++; console.log('ok a tokens holder collected alone is refused, never delivered as a whole run');
  assert.throws(() => payloadOf([a]), /0 of the holders hold the tokens/); n++; console.log('ok a part holder collected alone is refused, never delivered as a whole run');
  ok('one whole run\'s holder is delivered as it is', payloadOf([{ tokens: {}, components: [] }]).components.length === 0);
}
console.log(`${n} passed`);
