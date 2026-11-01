#!/usr/bin/env node
// node tools/parity/test-propose.mjs — from the toolkit root. The proposed
// screen map: over a fixture frame and its pieces without a browser, then
// against a fixture page in real Chrome ($CHROME, else the macOS default
// install); the browser half skips, saying so, without one.
import assert from 'node:assert/strict';
import fs, { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { launch, newPage, attach, navigate, viewport as setViewport, findChrome } from '../shared/cdp.mjs';
import { freePort } from '../shared/free-port.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { frameBoxes, wanted, collect, mappedSelectors, selectorFor, propose, merge, targetFor, instanceTagger, pageComponent, indentOf, serialise, codeWord, FAR } from './propose.mjs';
import { resolveBases } from './project.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

/* A frame as the store keeps it: a header holding a title, a main holding a
   card instance (whose insides are its own component's) and a drawing
   primitive, and a footer the page does not build. */
const title = { name: 'Title', type: 'TEXT', x: 16, y: 20, w: 80, h: 20, text: 'Items' };
const card = { name: 'Card', type: 'INSTANCE', instanceOf: 'Card', x: 16, y: 16, w: 200, h: 100, children: [{ name: 'Label', type: 'TEXT', x: 8, y: 8, w: 50, h: 16, text: 'One' }] };
const tree = { name: 'Desktop - List', type: 'FRAME', x: 5000, y: 3000, w: 400, h: 300, children: [
  { name: 'Header', type: 'FRAME', x: 0, y: 0, w: 400, h: 60, children: [title] },
  { name: 'Main', type: 'FRAME', x: 0, y: 60, w: 400, h: 240, children: [card, { name: 'Vector', type: 'VECTOR', x: 300, y: 10, w: 10, h: 10 }] },
  { name: 'Footer', type: 'FRAME', x: 0, y: 1000, w: 400, h: 50 },
] };
const frame = { id: 'desktop--list', name: tree.name, tree };
const project = {
  parity: { instance: 'x-{slug}', tiers: ['light'], mappings: { screens: { json: 'screens.json' } } },
  frames: new Map([[frame.id, frame]]),
  specs: new Map([['card', { name: 'Card' }]]),
  library: new Map([['Card', { name: 'Card' }]]),
  targets: [{ name: 'list', kind: 'screen', folder: frame.id, frame, spec: { variants: [{ ...tree, name: tree.name }] }, mapping: { route: '/list', layers: { Header: 'header' } } }],
};

const boxes = frameBoxes(tree);
ok("a layer's box is in the frame's own coordinates, the frame at 0,0 wherever it sits on the canvas", boxes.get(tree).x === 0 && boxes.get(card).x === 16 && boxes.get(card).y === 76 && boxes.get(title).y === 20);
{
  const shadowed = { name: 'S', x: 0, y: 0, w: 4, h: 4, visual: { x: -2, y: -2, w: 8, h: 8 } };
  const b = frameBoxes({ name: 'F', x: 0, y: 0, w: 10, h: 10, children: [shadowed] }).get(shadowed);
  ok('a node drawn outside its layout box is placed by what it draws, where the store keeps that box', b.x === -2 && b.w === 8);
}

const t = targetFor(project, 'list');
const w = wanted(t);
ok('the layers proposed for are the ones the coverage gate counts and nothing maps: no mapped layer, no primitive, nothing inside an instance',
  JSON.stringify(w.layers.map((l) => l.path)) === JSON.stringify(['Header > Title', 'Main', 'Main > Card', 'Footer']) && w.total === 5);
ok('a screen is found by its map key or its frame id; a frame the map lacks is a target with the route given', targetFor(project, frame.id).name === 'list'
  && targetFor(project, 'list', '/other').mapping.route === '/other' && targetFor(project, 'nope') === null);
{
  const fresh = targetFor({ ...project, targets: [] }, frame.id, '/list');
  ok('…and every one of its layers is proposed for', fresh.mapping.route === '/list' && wanted(fresh).layers.length === 5);
}
ok("the map's own selectors, a ruling's included, are what the page marks taken", JSON.stringify(mappedSelectors({ layers: { a: 'header', b: { selector: 'main', fields: ['x'] }, c: null, d: { skip: 'why' } } })) === '["header","main"]');
ok("an instance prefers the element the project says its component renders as, by the component's folder; a layer named for a component the library holds, that element; a text or a name the library lacks, none",
  instanceTagger(project)(card) === 'x-card' && instanceTagger(project)({ name: 'Card', type: 'FRAME' }) === 'x-card'
  && instanceTagger(project)({ name: 'Card', type: 'TEXT' }) === null && instanceTagger(project)({ name: 'Main', type: 'FRAME' }) === null && instanceTagger(project)(title) === null
  && instanceTagger({ ...project, parity: {} })(card) === null);

const els = [
  { i: 0, tag: 'main', parent: null, attrs: {}, x: 0, y: 60, w: 400, h: 240, text: '' },
  { i: 1, tag: 'section', parent: 0, attrs: { 'aria-label': 'Results' }, x: 0, y: 60, w: 400, h: 240, text: '' },
  { i: 2, tag: 'span', parent: 1, attrs: {}, x: 10, y: 70, w: 30, h: 10, text: 'x' },
];
ok('a selector stops at the nearest ancestor with a hook, and never keys on position', selectorFor(els[2], Object.fromEntries(els.map((e) => [e.i, e]))) === 'section[aria-label="Results"] > span'
  && selectorFor({ tag: 'div', attrs: { id: 'top', 'data-x': '' }, parent: null }, {}) === '#top');
{
  // a wrapper frame named for the instance it holds, drawn in one box: the instance takes the component's element
  const inner = { name: 'Card', type: 'INSTANCE', instanceOf: 'Card' };
  const wrapper = { name: 'Card', type: 'FRAME', children: [inner] };
  const box = { x: 0, y: 0, w: 200, h: 100 };
  const pageEls = [{ i: 0, tag: 'div', parent: null, attrs: { 'data-wrap': '' }, ...box, text: '' }, { i: 1, tag: 'x-card', parent: 0, attrs: {}, ...box, text: '' }];
  const { proposal } = propose([{ path: 'Card', node: wrapper, ...box }, { path: 'Card > Card', node: inner, ...box }], pageEls, { instanceTag: instanceTagger(project) });
  ok('a wrapper named for the instance it holds does not take that instance\'s element: the pair is not swapped', proposal.Card === 'div[data-wrap]' && proposal['Card > Card'] === 'div[data-wrap] > x-card');
}
ok('a carriage return and a form feed in a label are escaped as CSS reads them', selectorFor({ tag: 'nav', attrs: { 'aria-label': 'a\rb\fc' }, parent: null }, {}) === 'nav[aria-label="a\\d b\\c c"]');
ok('an id a framework generates per render is no hook: the selector falls through to the next one, or the tag',
  selectorFor({ tag: 'div', attrs: { id: ':r1:', 'data-x': '' }, parent: null }, {}) === 'div[data-x]' && selectorFor({ tag: 'div', attrs: { id: '«r2»' }, parent: null }, {}) === 'div'
  && selectorFor({ tag: 'section', attrs: { 'aria-labelledby': 'title :r3:' }, parent: null }, {}) === 'section'
  && ['radix-:r1:', 'headlessui-menu-«r4»', '_r_1_'].every((id) => selectorFor({ tag: 'div', attrs: { id }, parent: null }, {}) === 'div')
  && selectorFor({ tag: 'section', attrs: { 'aria-labelledby': 'radix-:r9:-title' }, parent: null }, {}) === 'section'
  && selectorFor({ tag: 'div', attrs: { id: 'r_1' }, parent: null }, {}) === '#r_1'
  && ['radix-_r_1_', '_r_1_-form-item', ':R2a:'].every((id) => selectorFor({ tag: 'div', attrs: { id }, parent: null }, {}) === 'div')
  && selectorFor({ tag: 'div', attrs: { id: 'form:panel:user' }, parent: null }, {}) === '[id="form:panel:user"]'
  && selectorFor({ tag: 'div', attrs: { id: 'my_r_1_x' }, parent: null }, {}) === '#my_r_1_x'
  && ['_R_1_', ':R2aH1:', '«R2aH1»', '_R_2aH1_'].every((id) => selectorFor({ tag: 'div', attrs: { id }, parent: null }, {}) === 'div')
  && ['app:root:main', 'nav:row:1', 'std::r::x'].every((id) => selectorFor({ tag: 'div', attrs: { id }, parent: null }, {}) !== 'div'));
ok('a map that is code says the key it is read through: `nodes` only where `layers` came from it', codeWord({ layers: { A: 'a' }, nodes: { A: 'a', $root: 'r' } }) === 'nodes'
  && codeWord({ layers: { A: 'a' } }) === 'layers' && codeWord({ layers: { A: 'a' }, nodes: { B: 'b' } }) === 'layers');
ok("a Vue scoped-style stamp is no hook; the project's own data attribute beside it is", selectorFor({ tag: 'div', attrs: { 'data-v-7ba5bd90': '' }, parent: null }, {}) === 'div'
  && selectorFor({ tag: 'div', attrs: { 'data-v-7ba5bd90': '', 'data-card': '' }, parent: null }, {}) === 'div[data-card]');
ok('an id or a label CSS cannot read bare is quoted, so the selector parses', selectorFor({ tag: 'div', attrs: { id: '1st' }, parent: null }, {}) === '[id="1st"]'
  && selectorFor({ tag: 'nav', attrs: { 'aria-label': 'Say "hi"' }, parent: null }, {}) === 'nav[aria-label="Say \\"hi\\""]');
{
  // an ancestor with no box (display: contents) still lends its hook
  const all = [{ i: 0, tag: 'div', parent: null, attrs: { 'data-list': '' }, x: 0, y: 0, w: 0, h: 0, text: '' }, { i: 1, tag: 'span', parent: 0, attrs: {}, x: 0, y: 0, w: 40, h: 20, text: '' }];
  ok('a selector climbs through an ancestor the pairing does not see', propose([{ path: 'A', node: { type: 'FRAME' }, x: 0, y: 0, w: 40, h: 20 }], [all[1]], { all }).proposal.A === 'div[data-list] > span');
}
ok('an element the map already names is never proposed again: the next nearest is', propose([{ path: 'Main', node: { type: 'FRAME' }, x: 0, y: 60, w: 400, h: 240 }], els, { taken: [0] }).proposal.Main === 'section[aria-label="Results"]');
ok(`a layer with nothing within ${FAR}px of it is said as unmatched, never guessed`, propose([{ path: 'Far', node: { type: 'FRAME' }, x: 0, y: 2000, w: 10, h: 10 }], els).unmatched[0] === 'Far');

const raw = { list: { route: '/list', nodes: { Header: 'header', Gone: false } }, other: { route: '/o', nodes: {} } };
const m1 = merge(raw, 'list', { route: '/elsewhere' }, { Header: 'body > header', Gone: 'p', Main: 'main' });
ok('--write merges only what the map does not hold, under the word its entry uses; a false it holds is left as it is, and counted apart',
  m1.map.list.nodes.Header === 'header' && m1.map.list.nodes.Main === 'main' && m1.map.list.nodes.Gone === false && !m1.map.list.layers && raw.list.nodes.Main === undefined && m1.added === 1 && m1.skipped === 2);
ok('…and an entry with a route keeps it: the one given is not written', m1.map.list.route === '/list' && m1.route === null);
ok('…a new screen takes the word the file uses, its route and its page component',
  JSON.stringify(merge(raw, 'new', { route: '/n', rootLayer: '_Page' }, { A: 'a' }).map.new) === '{"rootLayer":"_Page","route":"/n","nodes":{"A":"a"}}'
  && JSON.stringify(merge({}, 'new', { route: '/n' }, { A: 'a' }).map.new) === '{"route":"/n","layers":{"A":"a"}}');
{
  // a based entry inherits only `nodes` (project.mjs resolveBases): `layers` written on it would hide what it inherits
  const based = { base: { route: '/b', nodes: { Header: 'header' } }, child: { base: 'base', page: { scroll: 'end' } } };
  const m = merge({ ...based, plain: { route: '/p', layers: {} } }, 'child', { route: '/b' }, { Header: 'x', Main: 'main' });
  ok('a based entry with no map of its own takes `nodes`, and what its base holds is not proposed again', JSON.stringify(m.map.child) === '{"base":"base","page":{"scroll":"end"},"nodes":{"Main":"main"}}' && m.added === 1 && !m.map.child.route);
  const rb = resolveBases(m.map);
  ok('…so the run reads the base\'s layers and the new one together', rb.child.nodes.Header === 'header' && rb.child.nodes.Main === 'main');
  const onLayers = merge({ base: { route: '/b', layers: { Header: 'header' } }, child: { base: 'base' } }, 'child', {}, { Main: 'main' });
  ok('…and a based entry the run reads through `layers` is refused with the rename, never copied (a copy would freeze what it inherits)',
    !onLayers.map && /rename `layers` to `nodes` in base\b/.test(onLayers.refused));
  const mixed = merge({ top: { route: '/t', layers: { Header: 'header' } }, mid: { base: 'top', nodes: { Main: 'main' } }, child: { base: 'mid', nodes: {} } }, 'child', {}, { Footer: 'footer' });
  ok('…and so is a mixed chain, nodes below and layers above, whose nodes the run never reads', !mixed.map && /rename `layers` to `nodes` in top, then/.test(mixed.refused));
  const heirs = merge({ top: { route: '/t', layers: { Header: 'header' } }, kid: { base: 'top', nodes: {} } }, 'top', {}, { Main: 'main' });
  ok('…and a `layers` entry others inherit from, whose new lines would reach none of them', !heirs.map && /kid inherits from top .*rename `layers` to `nodes` in top/.test(heirs.refused));
  const flat = merge({ one: { route: '/1', layers: { Header: 'header', Old: false } } }, 'one', {}, { Old: 'x', Main: 'main' });
  ok('an entry of its own on `layers` takes the new lines there, its false kept', JSON.stringify(flat.map.one.layers) === '{"Header":"header","Old":false,"Main":"main"}' && flat.added === 1 && flat.skipped === 1);
}
{
  // a frame drawn as one unpublished page component: the screen is its contents
  const page = { name: '_Page', type: 'INSTANCE', instanceOf: '_Templates/_Page', x: 0, y: 0, w: 400, h: 300, children: tree.children };
  const pf = { id: 'desktop--page', name: 'Desktop - Page', tree: { name: 'Desktop - Page', type: 'FRAME', w: 400, h: 300, children: [page] } };
  const pt = targetFor({ ...project, frames: new Map([[pf.id, pf]]), targets: [] }, pf.id, '/page');
  ok('a new frame whose one child is an unpublished page component is mapped under it: its layers are proposed for, named under it',
    pageComponent(pf.tree) === '_Page' && pt.mapping.rootLayer === '_Page' && wanted(pt).layers.map((l) => l.path).includes('Header > Title') && wanted(pt).layers.length === 5);
  ok('…a variant instance is read by its set, as the store names it, wherever the set is kept',
    pageComponent({ children: [{ ...page, name: 'Page', instanceOf: '_Page / Device=Desktop' }] }) === 'Page'
    && pageComponent({ children: [{ ...page, name: 'Page', instanceOf: 'Templates/_Page / Device=Desktop' }] }) === 'Page'
    && pageComponent({ children: [{ ...page, name: 'Page', instanceOf: 'Templates/Page / Device=_x' }] }) === null
    && pageComponent({ children: [{ ...page, name: 'Page', instanceOf: 'Pages / _Home / Device=Desktop' }] }) === 'Page'
    && pageComponent({ children: [{ ...page, name: 'Page', instanceOf: '_Pages / Home / Device=Desktop' }] }) === null);
  ok('…an instance of an unpublished component counts, whatever the instance is called; only the component\'s own name is read, not where it is kept',
    pageComponent({ children: [{ ...page, name: 'Page', instanceOf: 'Templates/_Page' }] }) === 'Page' && pageComponent({ children: [{ ...page, name: 'Page', instanceOf: '_Templates/Page' }] }) === null);
  ok('…and a published instance, or one beside others, is not taken for one', pageComponent({ children: [{ ...page, name: 'Page', instanceOf: 'Templates/Page' }] }) === null && pageComponent({ children: [page, page] }) === null && pageComponent(tree) === null);
}

ok('…its line ends, CRLF staying CRLF, and its final newline or none', serialise('{\r\n  "a": 1\r\n}\r\n', { a: 1, b: 2 }) === '{\r\n  "a": 1,\r\n  "b": 2\r\n}\r\n'
  && serialise('{\n\t"a": 1\n}', { a: 1 }) === '{\n\t"a": 1\n}');
ok('the map is written back in its own indent, tabs staying tabs', indentOf('{\n\t"a": 1\n}') === '\t' && indentOf('{\n "a": 1\n}') === ' ' && indentOf('{}') === '  ');

{
  // the command line: refused with its usage, never a stack
  const cli = (args, env = {}) => spawnSync(process.execPath, [fileURLToPath(new URL('./propose.mjs', import.meta.url)), ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
  const r1 = cli(['--repo']), r2 = cli(['--repo', '/nowhere', 'a', 'b']), r3 = cli(['--repo', '/nowhere', 'a'], { CHROME: '/no/chrome' });
  ok('--repo with no value, or a second screen key, is the usage and exit 2', r1.status === 2 && /^usage:/.test(r1.stderr) && r2.status === 2 && /^usage:/.test(r2.stderr));
  ok('no Chrome is one line and exit 2', r3.status === 2 && r3.stderr.trim().split('\n').length === 1 && /no Chrome/.test(r3.stderr));
}

const CHROME = findChrome();
if (!existsSync(CHROME)) {
  console.log(`skip: no Chrome at ${CHROME} — set CHROME to run the browser half of tools/parity/test-propose.mjs`);
  process.exit(77); // a skip: bin/check says "skip", never "ok"
}

/* The page the frame was drawn for: the header the map holds, the title
   beside an empty box of the same size (a text layer is its words), the card
   as the element its component renders as, and no footer. */
const PAGE = `<!doctype html><html><head><style>
  body { margin: 0 } * { box-sizing: border-box; font: 16px/20px sans-serif }
  header { position: absolute; left: 0; top: 0; width: 400px; height: 60px }
  header > * { position: absolute; left: 16px; top: 20px; width: 80px; height: 20px; margin: 0 }
  main { position: absolute; left: 0; top: 60px; width: 400px; height: 240px }
  x-card { position: absolute; left: 16px; top: 16px; width: 200px; height: 100px; display: block }
</style></head><body>
  <header><div class="decoy"></div><h1>Items</h1></header>
  <main><x-card data-card><span>One</span></x-card></main>
</body></html>`;
const server = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(PAGE); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await launch({ chrome: CHROME });
try {
  const tab = await attach(await newPage(browser.endpoint));
  await setViewport(tab, 400, 300);
  await navigate(tab, `http://127.0.0.1:${server.address().port}/list`);
  const read = JSON.parse(await tab.evaluate(collect([...mappedSelectors(t.mapping), 'not a [selector'])));
  ok('the page is read with every element\'s window box, its hooks and its words; a selector the page cannot parse marks nothing',
    read.els.find((e) => e.tag === 'x-card').y === 76 && 'data-card' in read.els.find((e) => e.tag === 'x-card').attrs && read.els.find((e) => e.tag === 'h1').text === 'Items'
    && read.taken.length === 1 && read.els[read.taken[0]].tag === 'header');
  const { proposal, unmatched } = propose(w.layers, read.els, { taken: read.taken, instanceTag: instanceTagger(project) });
  ok('each unmapped layer is paired with the element in its place and shape: a text by its words over an empty box, an instance by its element',
    JSON.stringify(proposal) === JSON.stringify({ 'Header > Title': 'header > h1', Main: 'main', 'Main > Card': 'x-card[data-card]' }));
  ok('the layer the page does not build is said, not paired', JSON.stringify(unmatched) === '["Footer"]');
  ok('a quoted id and label parse in the page', await tab.evaluate(`(() => { try { document.querySelectorAll(${JSON.stringify(selectorFor({ tag: 'div', attrs: { id: '1st.a' }, parent: null }, {}))}); document.querySelectorAll(${JSON.stringify(selectorFor({ tag: 'nav', attrs: { 'aria-label': 'Say "hi" \\ x' }, parent: null }, {}))}); return true; } catch { return false; } })()`));
  // a scrolled state's frame draws the window, its content moved by the scroll: so is the page read
  await tab.evaluate('document.body.style.height = "2000px"; scrollTo(0, 50)');
  const scrolled = JSON.parse(await tab.evaluate(collect([])));
  ok('a scrolled page is read in the window, as its frame draws it', scrolled.els.find((e) => e.tag === 'main').y === 10);

  {
    // the command line with --write, over a project of facts alone: the page served by the app it starts
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'propose-cli-'));
    const port = await freePort();
    const put = (f, body) => { fs.mkdirSync(path.dirname(path.join(repo, f)), { recursive: true }); fs.writeFileSync(path.join(repo, f), body); };
    put('snapshot.config.json', JSON.stringify({ paths: { tokens: 'figma.json', components: 'components', screens: 'screens' },
      parity: { host: { kind: 'app' }, tiers: ['light'], mappings: { screens: { json: 'screens.json' } }, app: { base: 'http://127.0.0.1:{port}', port, start: 'node server.cjs {port}', ready: '/', shell: 'main' } } }));
    put('figma.json', '{"collections":{}}');
    put('server.cjs', `require('http').createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html' }); s.end(${JSON.stringify(PAGE)}); }).listen(+process.argv[2], '127.0.0.1');`);
    for (const id of ['plain', 'child']) put(`screens/${id}/figma.json`, JSON.stringify({ name: tree.name, id: '1:1', tree }));
    const map = '{\n\t"base": {\n\t\t"route": "/list",\n\t\t"layers": {\n\t\t\t"Header": "header"\n\t\t}\n\t},\n\t"child": {\n\t\t"base": "base"\n\t},\n\t"plain": {\n\t\t"route": "/list",\n\t\t"layers": {\n\t\t\t"Header": "header"\n\t\t}\n\t}\n}\n';
    put('screens.json', map);
    const run = (...a) => spawnSync(process.execPath, [fileURLToPath(new URL('./propose.mjs', import.meta.url)), '--repo', repo, ...a], { encoding: 'utf8', timeout: 60_000 });
    const refused = run('child', '--write');
    ok('--write on a based entry the run reads through `layers` writes nothing, says the rename, and exits 2',
      refused.status === 2 && fs.readFileSync(path.join(repo, 'screens.json'), 'utf8') === map && /nothing written: .*rename `layers` to `nodes` in base/.test(refused.stderr));
    const wrote = run('plain', '--write');
    const after = fs.readFileSync(path.join(repo, 'screens.json'), 'utf8');
    ok('--write on an entry of its own merges the proposal, says how many, and keeps the file\'s tabs',
      wrote.status === 0 && /merged 3 into screens\.json/.test(wrote.stdout) && JSON.parse(after).plain.layers['Main > Card'] === 'x-card[data-card]'
      && JSON.parse(after).plain.layers.Header === 'header' && after.includes('\n\t"plain"') && !/\n {2}"/.test(after)
      && fs.readdirSync(repo).every((f) => !f.endsWith('.tmp')));
    // a map not written yet is created; one that is not JSON is said and left
    fs.rmSync(path.join(repo, 'screens.json'));
    const first = run('plain', '/list', '--write');
    ok('--write with a map not written yet creates it', first.status === 0 && JSON.parse(fs.readFileSync(path.join(repo, 'screens.json'), 'utf8')).plain.route === '/list');
    put('screens.json', '{ not json');
    const bad = run('plain', '/list', '--write');
    ok('…and a map that is not JSON is one line naming it, exit 2, left as it was', bad.status === 2 && bad.stderr.trim().split('\n').length === 1 && /screens\.json is not JSON/.test(bad.stderr)
      && fs.readFileSync(path.join(repo, 'screens.json'), 'utf8') === '{ not json');
    // a map that is a link: the file it names is written, its mode kept, the link left a link
    fs.rmSync(path.join(repo, 'screens.json'));
    put('real/screens.json', '{\n  "plain": {\n    "route": "/list",\n    "layers": {}\n  }\n}\n');
    fs.chmodSync(path.join(repo, 'real/screens.json'), 0o640);
    fs.symlinkSync(path.join(repo, 'real/screens.json'), path.join(repo, 'screens.json'));
    const linked = run('plain', '--write');
    ok('--write through a link writes the file it names, keeps its mode and leaves the link',
      linked.status === 0 && fs.lstatSync(path.join(repo, 'screens.json')).isSymbolicLink() && JSON.parse(fs.readFileSync(path.join(repo, 'real/screens.json'), 'utf8')).plain.layers.Main === 'main'
      && (fs.statSync(path.join(repo, 'real/screens.json')).mode & 0o777) === 0o640 && fs.readdirSync(path.join(repo, 'real')).length === 1);
    // a folder it cannot write in: one line, nothing left behind
    put('real/screens.json', '{"plain": {"route": "/list", "layers": {}}}\n');
    fs.chmodSync(path.join(repo, 'real'), 0o555);
    const locked = run('plain', '--write');
    fs.chmodSync(path.join(repo, 'real'), 0o755);
    ok('…and a map that cannot be replaced is one line, exit 2, the map as it was and no temp file left',
      locked.status === 2 && locked.stderr.trim().split('\n').length === 1 && /could not be replaced/.test(locked.stderr)
      && fs.readFileSync(path.join(repo, 'real/screens.json'), 'utf8') === '{"plain": {"route": "/list", "layers": {}}}\n' && fs.readdirSync(path.join(repo, 'real')).length === 1);
    // a map that is code: the lines are said, under the key the entry reads, and nothing is written
    const config = JSON.parse(fs.readFileSync(path.join(repo, 'snapshot.config.json'), 'utf8'));
    put('screens/nodey/figma.json', JSON.stringify({ name: tree.name, id: '1:2', tree }));
    const asCode = '{"nodey": {"route": "/list", "nodes": {"Header": "header"}}}';
    put('screens.code.json', asCode);
    put('snapshot.config.json', JSON.stringify({ ...config, parity: { ...config.parity, mappings: { screens: { command: 'cat screens.code.json' } } } }));
    const said = run('nodey', '--write');
    ok('--write over a map that is code says the lines go under the key the entry reads, and writes nothing',
      said.status === 0 && /add the lines above under `nodes` in nodey's entry/.test(said.stdout) && fs.readFileSync(path.join(repo, 'screens.code.json'), 'utf8') === asCode);
    put('snapshot.config.json', JSON.stringify({ ...config, parity: { ...config.parity, mappings: { components: { json: 'none.json' } } } }));
    const none = run('plain', '/list', '--write');
    ok('--write where the project names no screens map says so', none.status === 0 && /no screens map/.test(none.stdout) && !/undefined/.test(none.stdout));
    fs.rmSync(repo, { recursive: true, force: true });
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${n} passed`);
