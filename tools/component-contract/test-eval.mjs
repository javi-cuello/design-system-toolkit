#!/usr/bin/env node
// eval.mjs: its field key, its counts, and the ratchet that holds them. Run: node tools/component-contract/test-eval.mjs
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { scoped, merged, pickPanel, importClosure, fieldOf, counts, worse, diff, causesOf, measure, causes, hashOf, closureHashes, scopedTo, leftToCode, staleContracts, runAll, projectsOptions, stepRunner, openLog, closureOf, drawingInputs, todayOf, mechanisms } from './eval.mjs';
import { spawnSync } from 'node:child_process';
import { chromeMajor, chromeVersion } from '../shared/cdp.mjs';
import { selfDrawn, siteFiles, drawnAll, GENERATOR } from './site.mjs';
import { isDeepStrictEqual } from 'node:util';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('a field is said without its element, so one cause in many elements is one line', fieldOf('content/icon.border.width') === '*.border.width' && fieldOf('props') === 'props' && fieldOf('root.shadow.0.color') === '*.shadow.N.color');
const legs = { browser: { a: { rows: [1, 2] }, b: { rows: [] }, c: { skipped: 'no reading' } }, figma: { a: { rows: [1] } } };
ok('the counts are the rows per component, and a component not measured has none', JSON.stringify(counts(legs)) === '{"browser":{"a":2,"b":0},"figma":{"a":1}}');
const accepted = { browser: { a: 2, b: 0, c: 3 }, figma: { a: 2 } };
const bad = worse({ browser: { a: 3, b: 0 }, figma: { a: 1 } }, accepted);
ok('a count that rose is said, one that fell is not, and a reading that went is said', bad.length === 2 && bad.includes('browser a: 2 → 3') && bad.some((x) => /browser c: accepted at 3, now not measured/.test(x)));
{
  const d = diff({ self: { a: 3, b: 9, n: 4 } }, { self: { a: 5, b: 7, g: 1, s: 2 }, figma: {} }, { self: { a: { x: 1, y: 2 }, b: { x: 9 } } }, { self: { a: { x: 3, y: 2 }, b: { x: 6, z: 1 } } });
  ok('diff: the total over components measured both times, what fell and rose, new and gone apart', d[0] === 'self: 12 → 12 (0) over the 2 measured both times; 1 fell, 1 rose; 1 newly measured; 2 not measured now');
  ok('diff: largest move first, each with the causes it moved by', JSON.stringify(d.slice(1, 6)) === JSON.stringify(['  n: newly measured at 4', '  a: 5 → 3 (-2)', '    -2  x', '  b: 7 → 9 (+2)', '    +3  x']));
  ok('diff: a component that did not move is not listed, and an empty leg says nothing', !d.some((l) => /^  s: 2 → 2|^figma/.test(l)) && d.includes('  s: accepted at 2, not measured now'));
  ok('diff: a count that held while its causes moved is listed', diff({ s: { a: 3 } }, { s: { a: 3 } }, { s: { a: { y: 3 } } }, { s: { a: { x: 3 } } }).includes('  a: 3 → 3, its causes changed'));
  ok('causesOf: a component\'s causes per leg, an unmeasured one left out', JSON.stringify(causesOf({ self: { a: { rows: [{ at: 'x.width' }, { at: 'x.width' }], combinations: 1 }, b: { skipped: 'no' } } })) === '{"self":{"a":{"x.width":2}}}');
}
ok('a component measured since the accept is held until accepted; one that came back the same is not', worse({ browser: { z: 9 } }, { browser: {} }).length === 1 && worse({ browser: { z: 0 } }, { browser: {} }).length === 0);

// the self leg's fingerprint: a change to one component moves it and what places it (through a variant too), nothing else
{
  const lib = { A: { folder: 'a', anatomy: { root: {}, x: { kind: 'instance', component: 'B' } } }, B: { folder: 'b', anatomy: { root: {} }, variants: [{ add: { y: { kind: 'instance', component: 'C' } } }] }, C: { folder: 'c', anatomy: { root: {} } }, D: { folder: 'd', anatomy: { root: {}, z: { kind: 'instance', component: 'Icon/x' } } } };
  const before = closureHashes(lib, { a: '1', b: '1', c: '1', d: '1' }, 's'), after = closureHashes(lib, { a: '1', b: '1', c: '2', d: '1' }, 's');
  ok('a change to a placed component moves it and every component that places it, through a variant too, and nothing else', ['a', 'b', 'c'].every((f) => before[f] !== after[f]) && before.d === after.d);
  ok('a sheet whose every rule names its element is scoped; one rule past it is not', scopedTo('@layer c { ds-tag { color: red } :where(ds-tag[size="s"]) > [data-part="x"], ds-tag:hover { gap: 0 } }', 'ds-tag') && !scopedTo('ds-tag { a: 0 } button { b: 0 }', 'ds-tag') && !scopedTo('ds-tag-item { a: 0 }', 'ds-tag') && scopedTo('ds-tag:where(:disabled, :has(> :disabled)) > b { a: 0 }', 'ds-tag') && !scopedTo('ds-tag { animation: spin 1s } @keyframes spin { from { a: 0 } }', 'ds-tag'));
  const part = closureHashes(lib, { a: '1', b: '1', c: '1' }, 's', ['a']);
  ok('closureOf: a component and what it places, transitively; hashes asked for some are theirs, from their closure\'s own only', JSON.stringify([...closureOf(lib, ['a', 'gone'])].sort()) === '["a","b","c"]' && JSON.stringify(part) === JSON.stringify({ a: before.a }));
  // a variant that swaps an instance to another component names it in its set (`icon.component`): placed too
  { const swaps = { A: { folder: 'a', anatomy: { root: {}, icon: { kind: 'instance', component: 'Icon' } }, variants: [{ when: { loading: true }, set: { 'icon.component': 'S' } }] }, S: { folder: 's', anatomy: { root: {} } }, Icon: { folder: 'icon', anatomy: { root: {} } } };
    ok('closureOf: a component a variant swaps in is placed by it', JSON.stringify([...closureOf(swaps, ['a'])].sort()) === '["a","icon","s"]'); }
  // placed by its Figma key under another name, or by its name in another case, as the drawing resolves it
  { const keyed = { A: { folder: 'a', anatomy: { root: {}, g: { kind: 'instance', component: 'chevron-up', key: 'k1' } }, variants: [{ set: { 'g.component': 'other-name', 'g.key': 'k2' } }] }, 'Icons/chevron-up': { component: 'Icons/chevron-up', folder: 'chev', figma: { key: 'k1' }, anatomy: { root: {} } }, 'Icons/x': { component: 'Icons/x', folder: 'x', figma: { key: 'k2' }, anatomy: { root: {} } }, Lower: { component: 'Lower', folder: 'low', anatomy: { root: {} } }, B: { folder: 'b', anatomy: { root: {}, l: { kind: 'instance', component: 'lower' } } } };
    ok('closureOf: a component placed by its key, or by its name in another case, is placed', JSON.stringify([...closureOf(keyed, ['a'])].sort()) === '["a","chev","x"]' && JSON.stringify([...closureOf(keyed, ['b'])].sort()) === '["b","low"]'); }
  { const slow = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-')), 'chrome'); fs.writeFileSync(slow, '#!/bin/sh\nsleep 3; echo Chrome 99.0\n'); fs.chmodSync(slow, 0o755);
    const t0 = Date.now(), v = chromeVersion(slow, 300);
    ok('a Chrome that does not answer its version in time is none, never a hang', v === '' && Date.now() - t0 < 2500);
    fs.rmSync(path.dirname(slow), { recursive: true, force: true }); }
  { const said = [], t = await todayOf('no-such-project', { projectDir: os.tmpdir(), paths: {} }, [], (l) => said.push(l));
    ok('the installed Chrome is read though the self leg\'s inputs cannot be: the browser leg stays checked', Object.hasOwn(t, 'chrome') && !t.inputs && /inputs not checked/.test(said[0] || '')); }
  ok('a Chrome major read from its version line, none from none', chromeMajor('Google Chrome 158.0.8127.37\n') === 158 && chromeMajor('') === null);
  ok('and a change all share moves every one', Object.keys(before).every((f) => closureHashes(lib, { a: '1', b: '1', c: '1', d: '1' }, 't')[f] !== before[f]));
}

// measure: a reading from code compared with the official contract by value; no reading, not measured and said
{
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-'));
  const comps = path.join(home, 'components', 'tag');
  fs.mkdirSync(comps, { recursive: true }); fs.mkdirSync(path.join(home, 'parity', 'from-code'), { recursive: true });
  const c = { contract: 1, component: 'Tag', props: {}, anatomy: { root: { kind: 'container', background: 'C/a' } }, variants: [] };
  fs.writeFileSync(path.join(comps, 'contract.json'), JSON.stringify(c));
  const where = { projectDir: home, paths: { components: path.join(home, 'components') } };
  let m = measure(where);
  ok('no reading from code: not measured, and said why', /no reading from code/.test(m.legs.browser.tag.skipped) && /not drawn/.test(m.legs.figma.tag.skipped));
  fs.writeFileSync(path.join(home, 'parity', 'from-code', 'tag.json'), JSON.stringify({ asFigma: { ...c, anatomy: { root: { kind: 'container', background: 'C/b' } } } }));
  m = measure(where);
  ok('a reading that differs is a row with both values', m.legs.browser.tag.rows.length === 1 && m.legs.browser.tag.rows[0].library === 'C/a' && m.legs.browser.tag.rows[0].drawn === 'C/b');
  ok('a reading from code with no fingerprint is stale', /before readings were fingerprinted/.test(m.legs.browser.tag.stale));
  fs.writeFileSync(path.join(home, 'parity', 'from-code', 'tag.json'), JSON.stringify({ of: hashOf(c), asFigma: c }));
  ok('a reading from code taken against today\'s contract is current', !measure(where).legs.browser.tag.stale);
  ok('a reading from code taken before its Chrome was recorded is stale once the installed one is known', /before its Chrome was recorded/.test(measure(where, [], { chrome: 158 }).legs.browser.tag.stale));
  fs.writeFileSync(path.join(home, 'parity', 'from-code', 'tag.json'), JSON.stringify({ of: hashOf(c), chrome: 158, asFigma: c }));
  ok('a reading from code under the installed Chrome is current; under another major, stale', !measure(where, [], { chrome: 158 }).legs.browser.tag.stale && /taken under Chrome 158, 159 installed now/.test(measure(where, [], { chrome: 159 }).legs.browser.tag.stale));
  // the self leg: a reading with no fingerprint, or of another contract, is measured and said stale; one of today's is not
  const selfDir = path.join(home, 'round-trip', 'self', 'from-code');
  fs.mkdirSync(selfDir, { recursive: true });
  fs.writeFileSync(path.join(selfDir, 'tag.json'), JSON.stringify({ asFigma: c }));
  m = measure(where);
  ok('a reading taken before fingerprints is measured and stale', m.legs.self.tag.rows.length === 0 && /before readings were fingerprinted/.test(m.legs.self.tag.stale));
  fs.writeFileSync(path.join(home, 'round-trip', 'taken.json'), JSON.stringify({ self: { tag: { hash: hashOf(c) } }, figma: { tag: { hash: hashOf(c), kept: true } } }));
  fs.writeFileSync(path.join(home, 'round-trip', 'tag.roundtrip.json'), JSON.stringify({ rows: [], combinations: 1 }));
  m = measure(where);
  ok('a reading of today\'s contract is current; one kept from an earlier drawing is stale', !m.legs.self.tag.stale && /kept from an earlier drawing/.test(m.legs.figma.tag.stale));
  // the Figma leg's geometry rows are its rows too: a drawing the contract compare calls the same is not, with one
  const geo = { at: 'Size=md/Label.x', library: 36, drawn: 44 };
  fs.writeFileSync(path.join(home, 'round-trip', 'tag.roundtrip.json'), JSON.stringify({ rows: [], geometry: [geo], combinations: 1 }));
  ok('a geometry row is a row of the Figma leg', JSON.stringify(measure(where).legs.figma.tag.rows) === JSON.stringify([geo]));
  fs.writeFileSync(path.join(home, 'round-trip', 'tag.roundtrip.json'), JSON.stringify({ rows: [], combinations: 1 }));
  fs.writeFileSync(path.join(home, 'round-trip', 'taken.json'), JSON.stringify({ self: { tag: { hash: hashOf({ ...c, component: 'Old' }) } } }));
  ok('a reading of another contract is stale', /contract changed/.test(measure(where).legs.self.tag.stale));
  // the second trip is held to the first, not to the contract: a change there is the translation not settling
  ok('no second reading: the second leg is not measured, and said why', /not read a second time/.test(measure(where).legs.second.tag.skipped));
  fs.mkdirSync(path.join(home, 'round-trip', 'self2', 'from-code'), { recursive: true });
  fs.writeFileSync(path.join(selfDir, 'tag.json'), JSON.stringify({ asFigma: { ...c, anatomy: { root: { kind: 'container', background: 'C/b' } } } }));
  fs.writeFileSync(path.join(home, 'round-trip', 'self2', 'from-code', 'tag.json'), JSON.stringify({ asFigma: { ...c, anatomy: { root: { kind: 'container', background: 'C/b' } } } }));
  m = measure(where);
  ok('a second trip that comes back as the first is no row, however far both are from the contract', m.legs.second.tag.rows.length === 0 && m.legs.self.tag.rows.length === 1);
  const firstNow = { ...c, anatomy: { root: { kind: 'container', background: 'C/b' } } };
  fs.writeFileSync(path.join(home, 'round-trip', 'taken.json'), JSON.stringify({ self: { tag: { hash: hashOf(c) } }, second: { tag: { hash: hashOf(firstNow) } } }));
  ok('a second trip of the first reading as it stands is current', !measure(where).legs.second.tag.stale);
  fs.writeFileSync(path.join(selfDir, 'tag.json'), JSON.stringify({ asFigma: { ...c, anatomy: { root: { kind: 'container', background: 'C/c' } } } }));
  ok('a first reading taken again since makes the second trip stale', /first reading was taken again/.test(measure(where).legs.second.tag.stale));
  fs.writeFileSync(path.join(selfDir, 'tag.json'), JSON.stringify({ asFigma: firstNow }));
  fs.writeFileSync(path.join(home, 'round-trip', 'taken.json'), JSON.stringify({ self: { tag: { hash: 'old' } }, second: { tag: { hash: hashOf(firstNow) } } }));
  ok('a second trip on a first reading of another contract is stale too', /first reading is stale/.test(measure(where).legs.second.tag.stale));
  // a reading read from other inputs than today's, or under another Chrome major, is stale; one from today's is not
  fs.writeFileSync(path.join(home, 'round-trip', 'taken.json'), JSON.stringify({ self: { tag: { hash: hashOf(c), inputs: 'i1', reader: 'r1', chrome: 158 } } }));
  ok('a reading from today\'s inputs under the installed Chrome is current', !measure(where, [], { inputs: { tag: 'i1' }, reader: 'r1', chrome: 158 }).legs.self.tag.stale);
  ok('a reading whose inputs moved is stale, the reader\'s code named where it moved', /inputs changed since, the reader's code among them/.test(measure(where, [], { inputs: { tag: 'i2' }, reader: 'r2', chrome: 158 }).legs.self.tag.stale)
    && measure(where, [], { inputs: { tag: 'i2' }, reader: 'r1', chrome: 158 }).legs.self.tag.stale === 'its inputs changed since');
  ok('a reading taken under another Chrome major is stale', /taken under Chrome 158, 159 installed now/.test(measure(where, [], { inputs: { tag: 'i1' }, reader: 'r1', chrome: 159 }).legs.self.tag.stale));
  fs.writeFileSync(path.join(home, 'round-trip', 'taken.json'), JSON.stringify({ self: { tag: { hash: hashOf(c) } } }));
  ok('a reading with no inputs recorded is stale once today\'s are known', /before its inputs were recorded/.test(measure(where, [], { inputs: { tag: 'i1' } }).legs.self.tag.stale));
  const firstText = fs.readFileSync(path.join(selfDir, 'tag.json'), 'utf8'), key2 = (i) => createHash('sha1').update(`${i}\0${firstText}`).digest('hex');
  const second = (i) => { fs.writeFileSync(path.join(home, 'round-trip', 'taken.json'), JSON.stringify({ self: { tag: { hash: hashOf(c), inputs: 'i1' } }, second: { tag: { hash: hashOf(firstNow), inputs: key2(i) } } })); return measure(where, [], { inputs: { tag: 'i1' } }).legs; };
  ok('a second trip read from other inputs is stale; from today\'s, current', /inputs changed since/.test(second('i0').second.tag.stale) && !second('i0').self.tag.stale && !second('i1').second.tag.stale);
  fs.rmSync(home, { recursive: true, force: true });
}

// causes: a part missing on one side is one cause with everything inside it; other rows are their own
{
  const rows = [
    { at: 'menu', library: { kind: 'instance' }, drawn: null }, { at: 'menu/item', library: { kind: 'text' }, drawn: null }, { at: 'menu.width', library: 200, drawn: null },
    { at: 'ghost', library: null, drawn: { kind: 'frame' } }, { at: 'root.radius', library: 4, drawn: 0 }, { at: 'props', library: 1, drawn: null },
  ];
  const k = causes(rows);
  ok('a missing subtree is one cause at its root, an extra one too, the rest each their own', k['menu (missing)'] === 3 && k['ghost (extra)'] === 1 && k['root.radius'] === 1 && k.props === 1 && Object.keys(k).length === 4);
  const some = causes([{ at: 'cap', library: { kind: 'text' }, drawn: null, in: 2 }, { at: 'cap.kind', library: 'text', drawn: 'slot', in: 2 }], 4);
  ok('a part missing in only some combinations folds nothing: its field rows from the others are causes of their own', some['cap.kind'] === 1 && some.cap === 1 && causes([{ at: 'cap', library: { kind: 'text' }, drawn: null, in: 4 }, { at: 'cap/x', library: 1, drawn: null, in: 4 }], 4)['cap (missing)'] === 2);
}
// what the markup leaves to its caller is counted apart: a menu drawn only at focus, a slot's sample content; a focus
// ring (an outline in code) and a part every variant draws stay differences
{ const c = { contract: 1, component: 'Pick', props: { state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', role: 'interaction', pointer: ['focus'], figma: 'State' } },
    anatomy: { root: { kind: 'container' }, field: { kind: 'container', parent: 'root' }, slot: { kind: 'slot', parent: 'root' }, 'slot/sample': { kind: 'text', parent: 'slot', content: 'x' } },
    variants: [{ when: { state: 'focus' }, add: { menu: { kind: 'container', parent: 'root' }, 'menu/item': { kind: 'text', parent: 'menu', content: 'A' } } }] };
  const left = leftToCode(c);
  ok('rows of a part drawn only at a pointer state, or inside a slot, are left to code; the rest are differences',
    left('menu') && left('menu/item.content') && left('slot/sample.content') && !left('field.layout') && !left('slot.width') && !left('menuish'));
  const placed = { ...c, anatomy: { ...c.anatomy, picker: { kind: 'instance', parent: 'root', component: 'Menu' }, 'picker/items': { kind: 'slot', parent: 'picker' }, 'picker/items/one': { kind: 'text', parent: 'picker/items', content: 'One' } } };
  ok('what this component puts in a placed component\'s slot is drawn, so stays a difference', !leftToCode(placed)('picker/items/one.content'));
  const sw = { component: 'Switcher', props: { label: { type: 'string', figma: 'Label', sets: ['label'] } }, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: 'Org' }, dot: { kind: 'graphic', parent: 'root', background: 'Icon/strong' } }, variants: [] };
  const holder = { ...c, anatomy: { root: { kind: 'container' }, org: { kind: 'instance', parent: 'root', component: 'Switcher' }, 'org/icon': { kind: 'instance', parent: 'org', component: 'Icon/case' }, 'org/label': { kind: 'text', parent: 'org', content: 'Acme' }, 'org/dot': { kind: 'graphic', parent: 'org', background: 'Icon/inverse' } } };
  const over = leftToCode(holder, (n) => (n === 'Switcher' ? sw : null));
  const swV = { ...sw, props: { ...sw.props, status: { type: 'enum', values: ['off', 'on'], default: 'off', figma: 'Status' } }, variants: [{ when: { status: 'on' }, add: { icon: { kind: 'instance', parent: 'root', component: 'Icon/case' } } }] };
  ok('a part the placed component draws in a variant is passed by that variant\'s prop, so stays a difference', !leftToCode(holder, (n) => (n === 'Switcher' ? swV : null))('org/icon'));
  const swW = { ...sw, anatomy: { ...sw.anatomy, icon: { kind: 'instance', parent: 'root', component: 'Icon/dot' }, 'icon/glyph': { kind: 'graphic', parent: 'icon' }, box: { kind: 'container', parent: 'root' }, 'box/t': { kind: 'text', parent: 'box', content: 'a' }, 'box/t/x': { kind: 'graphic', parent: 'box/t' } }, props: { ...sw.props, deep: { type: 'string', figma: 'Deep', sets: ['icon/glyph'] } } };
  const holderW = { ...holder, anatomy: { ...holder.anatomy, 'org/icon/glyph': { kind: 'graphic', parent: 'org/icon', background: 'x' }, 'org/box': { kind: 'container', parent: 'org' }, 'org/box/t': { kind: 'text', parent: 'org/box', content: 'b' }, 'org/box/t/x': { kind: 'graphic', parent: 'org/box/t', background: 'y' } } };
  const overW = leftToCode(holderW, (n) => (n === 'Switcher' ? swW : null));
  ok('a swap no prop passes is left, its insides with it, even where a deeper prop sets them; words no prop passes are left, the insides\' styles stay differences',
    overW('org/icon.component') && overW('org/icon/glyph.background') && overW('org/box/t.content') && !overW('org/box/t/x.background') && !overW('org/box/t.width'));
  ok('a part whose override is a field, not a swap, keeps its key a difference: two components of one name', !overW('org/box/t.key'));
  ok('an override a placed component has no prop for is left to code, its structure only; one a prop carries, a style the sheet reaches, and a name the reader gives stay differences',
    over('org/icon') && over('org/icon.component') && !over('org/icon.width') && !over('org/icon.name') && !over('org/label.content') && !over('org/dot') && !over('org/dot.background'));
  // (Atlassian's Column / Page: a cell's slot swapped to an icon tile the cell has no prop for, its key, corners, fill
  // and modes that tile's own)
  ok('a swap no prop passes takes its key and its component\'s own look and modes with it; its size stays a difference',
    over('org/icon.key') && over('org/icon.radius') && over('org/icon.background') && over('org/icon.modes.tile-colour') && !over('org/icon.height') && !over('org/icon.minWidth') && !over('org/dot.background'));
  const typed = { ...c, anatomy: { ...c.anatomy, 'field/text': { kind: 'text', parent: 'field', content: '{p}' } }, variants: [...c.variants, { when: { state: 'focus' }, set: { 'field/text.content': 'Search', 'field.width': 10 } }] };
  const item = { component: 'Item', props: { label: { type: 'string', figma: 'Label', sets: ['label'] } }, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: 'A' } }, variants: [] };
  const menu = { component: 'Menu', props: {}, anatomy: { root: { kind: 'container' }, items: { kind: 'slot', parent: 'root' } }, variants: [] };
  const bar = { ...c, anatomy: { root: { kind: 'container' }, menu: { kind: 'instance', parent: 'root', component: 'Menu' }, 'menu/items': { kind: 'slot', parent: 'menu' }, 'menu/items/item': { kind: 'instance', parent: 'menu/items', component: 'Item' }, 'menu/items/item/label': { kind: 'text', parent: 'menu/items/item', content: 'B' }, 'menu/items/item/avatar': { kind: 'instance', parent: 'menu/items/item', component: 'Avatar' } } };
  const inFill = leftToCode(bar, (n) => ({ Item: item, Menu: menu })[n] || null);
  ok('in a slot this component fills, an override the placed item has no prop for is left to code; its words a prop passes, and the item itself, stay differences',
    inFill('menu/items/item/avatar') && !inFill('menu/items/item/label.content') && !inFill('menu/items/item'));
  const deep = { ...bar, anatomy: { ...bar.anatomy, 'menu/items/item/box': { kind: 'container', parent: 'menu/items/item' }, 'menu/items/item/box/avatar': { kind: 'instance', parent: 'menu/items/item/box', component: 'Avatar' } } };
  const itemBox = { ...item, anatomy: { ...item.anatomy, box: { kind: 'container', parent: 'root' } } };
  const inDeep = leftToCode(deep, (n) => ({ Item: itemBox, Menu: menu })[n] || null);
  ok('a part of the item\'s own the design keeps only as the way down to an override goes with it, whole; its fields stay differences',
    inDeep('menu/items/item/box') && !inDeep('menu/items/item/box.layout') && inDeep('menu/items/item/box/avatar'));
  ok('words only a pointer state changes are left to code where the design holds them; a wrong rest text and another field stay differences',
    leftToCode(typed)('field/text.content', { library: 'Search' }) && !leftToCode(typed)('field/text.content', { library: '{p}' }) && !leftToCode(typed)('field.width') && !leftToCode(c)('field/text.content', { library: 'Search' }));
  // (words a pointer state and another state both set, a search's query at focus and when filled: a row found only where
  // a pointer state sets them (roundTrip's `pointer`) is still the markup's gap; one found at the other state too is a difference)
  const shared = { ...typed, props: { state: { ...c.props.state, values: ['rest', 'focus', 'filled'] } }, variants: [...typed.variants, { when: { state: 'filled' }, set: { 'field/text.content': 'Search' } }] };
  ok('words a pointer state sets, where another state sets them too, are left to code only in a row found where a pointer state sets them',
    leftToCode(shared)('field/text.content', { library: 'Search', pointer: true }) && !leftToCode(shared)('field/text.content', { library: 'Search' }) && !leftToCode(shared)('field/text.content', { library: '{p}', pointer: true }));
  // a placed instance's props only a pointer state gives: its own state at a pointer value, or what this one's pointer state
  // alone sets on it; a prop at rest beside it, or one another state sets too, stays a difference
  { const link = { component: 'Link', props: { state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', figmaValues: ['Rest', 'Hover'], role: 'interaction', pointer: ['hover'], figma: 'State' }, on: { type: 'boolean', default: false, axis: true, figma: 'On' } }, anatomy: { root: { kind: 'container' } }, variants: [] };
    const card = (extra = []) => ({ ...c, anatomy: { ...c.anatomy, link: { kind: 'instance', parent: 'root', component: 'Link', with: { On: 'False' } } }, variants: [{ when: { state: 'focus' }, set: { 'link.with': { On: 'True' } } }, ...extra] });
    const L = (k) => leftToCode(k, (n) => (n === 'Link' ? link : null));
    ok('a placed instance\'s props only a pointer state gives are left to code; a prop at rest beside them, or one another state sets too, stays a difference',
      L(card())('link.with', { library: { State: 'Hover' }, drawn: null }) && L(card())('link.with.State', { library: 'Hover', drawn: null })
      && !L(card())('link.with', { library: { State: 'Hover', On: 'True' }, drawn: null })
      && L(card())('link.with.On', { library: 'True', drawn: null }) && !L(card())('link.with.On', { library: 'False', drawn: null })
      && !L({ ...card(), anatomy: { ...card().anatomy, link: { ...card().anatomy.link, with: { On: 'True' } } } })('link.with.On', { library: 'True', drawn: null })
      && !L(card([{ when: { state: 'rest' }, set: { 'link.with': { On: 'True' } } }]))('link.with.On', { library: 'True', drawn: null })
      && L(card([{ when: { state: 'rest' }, set: { 'link.with': { On: 'True' } } }]))('link.with', { library: { On: 'True' }, drawn: null, pointer: true })); }
  { // (review: a variant at another state that adds the instance with the same props makes them no pointer state's alone)
    const link = { component: 'Link', props: { on: { type: 'boolean', default: false, axis: true, figma: 'On' } }, anatomy: { root: { kind: 'container' } }, variants: [] };
    const card = { ...c, props: { ...c.props, size: { type: 'enum', values: ['sm', 'lg'], default: 'sm', figma: 'Size' } }, anatomy: { ...c.anatomy, link: { kind: 'instance', parent: 'root', component: 'Link', with: { On: 'False' } } },
      variants: [{ when: { state: 'focus' }, set: { 'link.with': { On: 'True' } } }, { when: { size: 'lg' }, add: { link: { kind: 'instance', parent: 'root', component: 'Link', with: { On: 'True' } } } }] };
    const L = leftToCode(card, (n) => (n === 'Link' ? link : null));
    ok('props another state adds the instance with are no pointer state\'s: a difference there stays one', !L('link.with.On', { library: 'True', drawn: null }) && !L('link.with', { library: { On: 'True' }, drawn: null, pointer: true })); }
  ok('the rows left to code are counted, as a leg of their own, so a rise there is said', worse(counts({ self: { a: { rows: [], left: [{}, {}] } } }), { self: { a: 0 }, 'self left': { a: 1 } }).some((w) => /self left a: 1 → 2/.test(w))
    && !worse(counts({ self: { a: { rows: [], left: [] } } }), { self: { a: 0 }, 'self left': { a: 1 } }).length); }

{ const t = { contract: 1, component: 'T', props: { selected: { type: 'boolean', default: false, axis: true } }, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/plus' }, 'icon/icon': { kind: 'graphic', parent: 'icon', background: 'C/medium' } },
    variants: [{ when: { selected: true }, remove: ['icon/icon'] }] };
  const left = leftToCode(t, () => null);
  ok('a placed icon left its own colour (its override taken away) is code\'s to say, where no main holds that colour',
    left('icon.background', { library: null, drawn: 'C/black' }) && !left('icon.background', { library: 'C/x', drawn: 'C/black' }) && !leftToCode({ ...t, anatomy: { ...t.anatomy, 'icon/icon': { kind: 'graphic', parent: 'icon', width: 12 } } }, () => null)('icon.background', { library: null, drawn: 'C/black' }) && !leftToCode(t, (n) => (n === 'Icon/plus' ? { contract: 1, component: n, props: {}, anatomy: { root: { kind: 'container' } }, variants: [] } : null))('icon.background', { library: null, drawn: 'C/black' })); }
{ const pill = { contract: 1, component: 'Pill', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'column', align: 'start' } } }, variants: [] };
  const c = { contract: 1, component: 'C', props: {}, anatomy: { root: { kind: 'container' }, p: { kind: 'instance', parent: 'root', component: 'Pill' } }, variants: [] };
  const left = leftToCode(c, (n) => (n === 'Pill' ? pill : null));
  ok('a placed component\'s own layout overridden on the instance is code\'s to say (its own sheet styles it); its size, its fill, and a look the design leaves to the component (its sheet drifting), are not',
    left('p.layout', { library: { align: 'center' } }) && left('p.layout.align', { library: 'center' }) && !left('p.width', { library: 'fill' }) && !left('p.background', { library: 'C/x' })
    && !left('p.layout', { library: null, drawn: { align: 'end' } })); }
{ const item = { contract: 1, component: 'Item', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] };
  const list = { contract: 1, component: 'List', props: { size: { type: 'enum', values: ['l', 's'], default: 'l' } }, anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', component: 'Item', with: { Size: 'L' } } },
    variants: [{ when: { size: 's' }, set: { 'item.with': { Size: 'S' } } }] };
  const holder = { contract: 1, component: 'Drop', props: {}, anatomy: { root: { kind: 'container' }, list: { kind: 'instance', parent: 'root', component: 'List' }, 'list/item': { kind: 'instance', parent: 'list', component: 'Item', with: { Size: 'L', Type: 'Multi' } } }, variants: [] };
  const left = leftToCode(holder, (n) => ({ List: list, Item: item })[n] || null);
  ok('a prop given to an instance nested in a placed component that no variant of it ever sets so is code\'s to say, though another prop of that instance varies; one a variant sets is passed',
    left('list/item.with.Type', { library: 'Multi' }) && left('list/item.with', { library: { Size: 'L', Type: 'Multi' } })
    && !leftToCode({ ...holder, anatomy: { ...holder.anatomy, 'list/item': { ...holder.anatomy['list/item'], with: { Size: 'S' } } } }, (n) => ({ List: list, Item: item })[n] || null)('list/item.with.Size', { library: 'S' })); }
{ const c = { contract: 1, component: 'Tile', props: {}, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Glyph', width: 'fill', with: { size: 'S' } }, 'icon/glyph': { kind: 'graphic', parent: 'icon' } }, variants: [] };
  const left = leftToCode(c, () => null), known = leftToCode(c, (n) => (n === 'Glyph' ? { contract: 1, component: n, props: {}, anatomy: { root: { kind: 'container' } }, variants: [] } : null));
  ok('a placed component the library does not hold (marked, data-icon) leaves its insides, props, layout and clipping to code; its size and place stay measured, and a held one\'s are not left',
    left('icon/glyph', { library: {}, drawn: null }) && left('icon/glyph.width', { library: 12 }) && left('icon.with', { library: { size: 'S' } }) && left('icon.with.size', { library: 'S' }) && left('icon.layout', { library: {} })
    && !left('icon.with.Size', { library: '16' }) && !left('icon.width', { library: 'fill' }) && !left('icon.minWidth', { library: 24 }) && !left('root.layout', { library: {} })
    && !known('icon.with.size', { library: 'S' })); }

{ const box = (h, sized = true) => ({ contract: 1, component: 'Badge', props: { size: { type: 'enum', values: ['s', 'l'], default: 's' }, tone: { type: 'enum', values: ['a', 'b'], default: 'a' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, frame: { kind: 'container', parent: 'root', layout: { direction: 'row' }, width: 12, height: h },
      'frame/mark': { kind: 'graphic', parent: 'frame', width: 12, height: 12, position: 'absolute', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'scale', vertical: 'scale' } } },
    variants: sized ? [{ when: { size: 'l' }, set: { 'frame.height': 20, 'frame.width': 20, 'frame/mark.width': 20, 'frame/mark.height': 20 } }, { when: { tone: 'b' }, set: { 'frame.height': 'hug' } }] : [{ when: { tone: 'b' }, set: { 'frame.width': 'hug' } }] });
  const row = { library: 'scale', drawn: 'min' };
  ok('a scale constraint the sheet writes at no layer (its parent hugs wherever it is drawn) is code\'s to say; one whose share is in the sheet at any layer (the cascade carries it, size l over tone b), the axis that has a size, and a parent sized everywhere, are not',
    leftToCode(box('hug', false))('frame/mark.constraints.vertical', row) && !leftToCode(box('hug'))('frame/mark.constraints.vertical', row)
    && !leftToCode(box('hug', false))('frame/mark.constraints.horizontal', row) && !leftToCode(box('hug', false))('frame/mark.constraints.vertical', { library: 'min', drawn: 'max' })
    && !leftToCode(box(12))('frame/mark.constraints.vertical', row));
  ok('a row held to a reading rather than the contract the sheet was written from (the second leg) is never left by the share',
    !leftToCode(box('hug', false), null, undefined, { ownSheet: false })('frame/mark.constraints.vertical', row)); }
{ // two layers that together make the share writable at their combination: the sheet's own rule for that combination writes it
  const c = { contract: 1, component: 'Badge', props: { size: { type: 'enum', values: ['s', 'l'], default: 's' }, tone: { type: 'enum', values: ['a', 'b'], default: 'a' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, frame: { kind: 'container', parent: 'root', layout: { direction: 'row' }, width: 12, height: 'hug' },
      'frame/mark': { kind: 'graphic', parent: 'frame', width: 12, height: 12, position: 'absolute', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'scale', vertical: 'scale' } } },
    variants: [{ when: { size: 'l' }, set: { 'frame.height': 20, 'frame/mark.height': 'hug' } }, { when: { tone: 'b' }, set: { 'frame/mark.height': 8 } }] };
  ok('a share the sheet writes only at a combination of two layers (its own rule there) keeps the row a difference',
    !leftToCode(c)('frame/mark.constraints.vertical', { library: 'scale', drawn: 'min' })); }
{ // a part the sheet does not write itself (one inside a placed component, which its own sheet places) is never judged by its share
  const c = { contract: 1, component: 'Host', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, chip: { kind: 'instance', parent: 'root', component: 'Chip', height: 'hug', width: 12 },
    'chip/mark': { kind: 'graphic', parent: 'chip', width: 12, height: 12, position: 'absolute', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'scale', vertical: 'scale' } } }, variants: [] };
  const chip = { contract: 1, component: 'Chip', props: {}, anatomy: { root: { kind: 'container', width: 12, height: 'hug' }, mark: { kind: 'graphic', parent: 'root', width: 12, height: 12, position: 'absolute', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'scale', vertical: 'scale' } } }, variants: [] };
  ok('a scale constraint on a part inside a placed component is not left to code by its share',
    !leftToCode(c, (n) => (n === 'Chip' ? chip : null))('chip/mark.constraints.vertical', { library: 'scale', drawn: 'min' })); }
{ const c = { contract: 1, component: 'Pointer', props: {}, anatomy: { root: { kind: 'container' }, tip: { kind: 'graphic', parent: 'root', width: 15, height: 9, radius: 'mixed' }, card: { kind: 'container', parent: 'root', radius: 'mixed' }, bar: { kind: 'graphic', parent: 'root', shape: 'rectangle', radius: 'mixed' }, box: { kind: 'container', parent: 'root', radius: 4 } }, variants: [] };
  const left = leftToCode(c);
  ok('a radius the design holds only as mixed on a path (its corners, which no box\'s four say) is code\'s to say; mixed on a box (an older snapshot\'s), and a radius it holds, are not',
    left('tip.radius', { library: 'mixed', drawn: null }) && !leftToCode({ ...c, variants: [{ when: {}, set: { 'tip.shape': 'rectangle' } }] })('tip.radius', { library: 'mixed', drawn: null }) && !left('card.radius', { library: 'mixed', drawn: 8 }) && !left('bar.radius', { library: 'mixed', drawn: null }) && !left('box.radius', { library: 4, drawn: null })); }
{ const d = fs.mkdtempSync(path.join(os.tmpdir(), 'stale-')), r = createRequire(import.meta.url);
  const { compact } = r('../snapshot/spec.cjs'), { derive } = r('./derive.cjs');
  const spec = compact({ name: 'T', props: {}, variants: [{ name: 'T', type: 'COMPONENT', layout: 'VERTICAL', children: [{ name: 'W', type: 'TEXT', text: 'Hi' }] }] });
  for (const [f, c] of [['fresh', derive(spec, ['T'], {})], ['old', { ...derive(spec, ['T'], {}), anatomy: { root: { kind: 'container' } } }], ['gone', null]]) {
    fs.mkdirSync(path.join(d, f)); fs.writeFileSync(path.join(d, f, 'figma.json'), JSON.stringify(spec)); if (c) fs.writeFileSync(path.join(d, f, 'contract.json'), JSON.stringify(c)); }
  ok('an official contract an older derive.cjs wrote is named, so a measure is never taken against yesterday\'s rules', JSON.stringify(staleContracts(d)) === '["gone","old"]' && staleContracts(path.join(d, 'none')).length === 0);
  fs.rmSync(d, { recursive: true, force: true }); }
{
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'closure-')), w = (f, s) => { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), s); };
  w('a.mjs', "const s = createRequire(import.meta.url)('./h.cjs');\nrequire(`./i`);\nimport { x } from './b.mjs';\nconst c = await import('./sub/c.mjs');\nconst req = createRequire(import.meta.url); req('./d.cjs');\nimport(path.join(HERE, 'e.mjs'));\nimport './skip.mjs';");
  w('b.mjs', "export const x = 1; import '../outside-missing.mjs';"); w('sub/c.mjs', "import y from '../b.mjs';"); w('d.cjs', "require('./f.json');"); w('f.json', '{}'); w('e.mjs', ''); w('skip.mjs', "import './g.mjs';"); w('g.mjs', ''); w('h.cjs', ''); w('i.js', '');
  const got = importClosure([path.join(d, 'a.mjs')], new Set([path.join(d, 'skip.mjs')])).map((f) => path.relative(d, f));
  ok('importClosure: static, literal dynamic and require()d files, transitively; a skipped file and what only it imports left out; a built path not followed', JSON.stringify(got) === JSON.stringify(['a.mjs', 'b.mjs', 'd.cjs', 'f.json', 'h.cjs', 'i.js', 'sub/c.mjs']));
  fs.rmSync(d, { recursive: true, force: true });
}
{
  const all = [['a1', 'A'], ['a2', 'A'], ['a3', 'A'], ['b1', 'B'], ['c1', 'C'], ['c2', 'C'], ['r', 'R']].map(([folder, page]) => ({ folder, page }));
  const p = pickPanel(all, ['r', 'gone'], 5);
  ok('pickPanel: the components already read first, then pages in turn, never twice, at most n', p[0] === 'r' && p.length === 5 && new Set(p).size === 5 && ['A', 'B', 'C'].every((pg) => p.some((f) => f[0] === pg.toLowerCase())));
  ok('pickPanel: the same library gives the same panel, whatever order it comes in', JSON.stringify(pickPanel([...all].reverse(), ['r'], 5)) === JSON.stringify(p));
  ok('pickPanel: every published component before any hidden one, a page of building blocks included', JSON.stringify(pickPanel([{ folder: 'x1', page: 'X', hidden: true }, { folder: 'x2', page: 'X' }, { folder: 'y1', page: 'Y', hidden: true }, { folder: 'z', page: 'Z' }], [], 3).slice(0, 2).sort()) === '["x2","z"]');
  ok('pickPanel: a library smaller than n is taken whole', pickPanel(all, [], 30).length === 7);
}
ok('a panel\'s check and diff hold only its own components', JSON.stringify(scoped({ self: { a: 1, b: 2 }, figma: { b: 3 } }, ['a'])) === '{"self":{"a":1},"figma":{}}');
ok('a panel\'s accept replaces its own components and keeps every other\'s', JSON.stringify(merged({ self: { a: 1, b: 2 } }, { self: { a: 5 }, second: { a: 0 } }, ['a'])) === '{"self":{"b":2,"a":5},"second":{"a":0}}');
// --projects: the steps as child runs, stubbed (a real one measures and takes the lock)
{
  const go = async (projects, legs, rcs = () => 0) => { const ran = [], log = []; const rc = await runAll(projects, legs, { run: (a) => { ran.push(a.join(' ')); return rcs(ran.length); }, say: (l) => log.push(l), now: () => new Date(2026, 10, 20, 9, 5) }); return { ran, log, rc }; };
  const a = await go(['carbon', 'material3'], ['self', 'second']);
  ok('runAll: per project, self then second on the panel, then its diff, project by project', JSON.stringify(a.ran) === JSON.stringify(['--project carbon --self --panel --jobs 4', '--project carbon --second --panel --jobs 4', '--project carbon --panel --diff', '--project material3 --self --panel --jobs 4', '--project material3 --second --panel --jobs 4', '--project material3 --panel --diff']) && a.rc === 0);
  ok('runAll: each step logged before with its time and args, after with its rc, and the end with its time', a.log[0] === '== 09:05 --project carbon --self --panel --jobs 4' && a.log[1] === '== rc 0' && a.log.at(-1) === '== done 09:05' && a.log.length === 13);
  const b = await go(['carbon', 'atlassian', 'material3'], ['self'], (i) => (i === 1 ? 2 : i === 2 ? 1 : 3));
  ok('runAll: three failures in a row (rc 2 or more) stop the run; rc 1 is not a failure and resets the count', b.rc === 1 && b.ran.length === 5 && b.log.at(-1) === '== three failures in a row: stopped' && !b.log.some((l) => /done/.test(l)));
  const c = await go(['carbon', 'atlassian'], ['self'], (i) => (i === 1 ? 2 : 0));
  ok('runAll: a step that failed, short of three in a row, still fails the run, which goes on to the end', c.rc === 1 && c.ran.length === 4 && c.log.at(-1) === '== done 09:05');
  const opts = (o) => projectsOptions(o, { cwd: '/here', labelError: (p) => (p === 'nope' ? `no context document for ${p}` : null) });
  ok('--projects: a misspelled label is refused, named, before any step', opts({ projects: 'carbon,nope' }).error === 'no context document for nope');
  ok('--projects: jobs that are not a whole number, or no project, are refused', /usage/.test(opts({ projects: 'carbon', jobs: 'abc' }).error) && /usage/.test(opts({ projects: ',' }).error) && /usage/.test(opts({ projects: 'carbon', jobs: '0' }).error));
  const good = opts({ projects: 'carbon,atlassian', log: 'l.txt' });
  ok('--projects: the log made absolute against the folder run in, the rest defaulted', good.log === '/here/l.txt' && good.jobs === 4 && good.legs.join() === 'self,second' && good.projects.join() === 'carbon,atlassian' && opts({ projects: 'a', log: '/abs/l' }).log === '/abs/l');
  { const was = process.env.TOOLKIT_LOCK_HELD; process.env.TOOLKIT_LOCK_HELD = '1'; let seen;
    const rc = stepRunner(null, (cmd, args, o) => { seen = { args, o }; return { status: 3 }; })(['--project', 'p', '--panel', '--diff']);
    ok('--projects: a step keeps its caller\'s TOOLKIT_LOCK_HELD, so under a holder it never waits on that holder\'s lock', (seen.o.env === undefined || seen.o.env.TOOLKIT_LOCK_HELD === '1') && rc === 3 && /eval\.mjs$/.test(seen.args[0]) && seen.args.at(-1) === '--diff');
    if (was === undefined) delete process.env.TOOLKIT_LOCK_HELD; else process.env.TOOLKIT_LOCK_HELD = was; }
  ok('--projects: a log it cannot write is said, not thrown', /cannot write the log .*ENOENT/.test(openLog(path.join(os.tmpdir(), 'no-such-dir-eval', 'l.txt')).error || ''));
  const r = spawnSync(process.execPath, [new URL('./eval.mjs', import.meta.url).pathname, '--projects', 'x', '--legs', 'draw'], { encoding: 'utf8' });
  ok('--projects refuses a leg it does not run, before any step', r.status === 2 && /usage: eval.mjs --projects/.test(r.stderr));
}
// a library whose focus state is two words: its ring is compared, not left, and the self leg's inputs are drawn as it writes them
{
  const own = { pseudoClasses: { 'Focus visible': ':focus-visible' } };
  const ring = { kind: 'graphic', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'Focus/focus', width: 2 }, shape: 'rectangle' };
  const tile = { contract: 1, component: 'Tile', folder: 'tile', props: { state: { type: 'enum', values: ['rest', 'focus-visible'], default: 'rest', role: 'interaction', pointer: ['focus-visible'] } },
    anatomy: { root: { kind: 'container', background: 'Bg/x' } }, variants: [{ when: { state: 'focus-visible' }, add: { focusBorder: { ...ring, parent: 'root' } } }] };
  ok('under the library\'s settings its focus ring is compared, not left to the code; under the house\'s it would be left',
    !leftToCode(tile, null, own)('focusBorder.border') && leftToCode(tile, null)('focusBorder.border'));
  const d = selfDrawn(tile, { library: { Tile: tile }, mains: () => null, settings: own });
  ok('the self leg\'s inputs are drawn under the library\'s settings: the ring an outline at its focus, mapped to the box',
    /:focus-visible[^{]*\{\s*outline:/.test(d.sheet) && d.mapping.layers['Focus border'] === 'ds-tile');
  // (one source: the files the site writes are what the hash is taken of, and a change of settings moves both)
  const both = (settings) => { const library = { Tile: tile }, x = selfDrawn(tile, { library, mains: () => null, settings }), f = siteFiles(library, { settingsOf: () => settings });
    return { x, same: f['components/tile/tile.js'] === x.markup && f['all.css'].includes(x.sheet) }; };
  const [a, b] = [both(own), both(undefined)];
  ok('the site writes exactly what the inputs hash is taken of, under any settings, and a change of settings moves both',
    a.same && b.same && a.x.sheet !== b.x.sheet && a.x.markup !== b.x.markup);
  // the drawing kept between runs: what it gives back is what it draws; a change to a placed component draws its holder
  // again, a change elsewhere does not
  { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drawn-')), files = () => fs.readdirSync(dir).length;
    const card = { contract: 1, component: 'Card', folder: 'card', props: {}, anatomy: { root: { kind: 'container' }, tile: { kind: 'instance', component: 'Tile', parent: 'root' } } };
    const lone = { contract: 1, component: 'Lone', folder: 'lone', props: {}, anatomy: { root: { kind: 'container', background: 'Bg/x' } } };
    const lib = (t) => ({ Tile: t, Card: card, Lone: lone }), settingsOf = () => own;
    const fresh = Object.fromEntries(Object.values(lib(tile)).map((c) => [c.folder, selfDrawn(c, { library: lib(tile), mains: () => null, settings: own })]));
    const first = drawnAll(lib(tile), { settingsOf, dir }), kept = files(), again = drawnAll(lib(tile), { settingsOf, dir });
    const tile2 = { ...tile, anatomy: { root: { kind: 'container', background: 'Bg/y' } } };
    drawnAll(lib(tile2), { settingsOf, dir });
    ok('drawnAll: a kept drawing is the one drawn; a placed component\'s change draws it and its holder again, not the rest',
      isDeepStrictEqual(first.card, again.card) && JSON.stringify(again) === JSON.stringify(first) && first.tile.sheet === fresh.tile.sheet && kept === 3 && files() === 5);
    ok('the inputs hash takes the parts\' selectors: one moved moves it',
      !isDeepStrictEqual(drawingInputs(again.tile), drawingInputs({ ...again.tile, parts: { ...again.tile.parts, root: 'elsewhere' } })));
    ok('drawnAll: a kept drawing keeps each part\'s selector by id, which the inputs hash is taken of and no mapping writes',
      Object.keys(again.tile.parts || {}).length > 0 && isDeepStrictEqual(again.tile.parts, fresh.tile.parts) && !JSON.stringify(again.tile.mapping).includes('byId'));
    fs.rmSync(dir, { recursive: true, force: true }); }
  ok('drawnAll: the generator\'s hash is taken as its code loads, never later, when the files may have moved on from the code running', /^[0-9a-f]{40}$/.test(GENERATOR));
}

{ // rows grouped by mechanism across components: one cause in two libraries is one group, ranked first by the
  // components it finishes (every row of theirs in it), then by components
  const g = mechanisms({
    'e:r': [{ at: 'name', library: 'a', drawn: 'b' }],
    'a:x': [{ at: 'icon.absolute.x', library: -2, drawn: 10 }, { at: 'label', library: { kind: 'text' }, drawn: null }],
    'b:y': [{ at: 'box/icon.absolute.x', library: 4, drawn: 5 }],
    'b:z': [],
    'c:p': [{ at: 'props', library: 'a', drawn: 'b' }, { at: 'box.fills.0.color', library: 'x/y', drawn: 'x/z' }] });
  assert.deepStrictEqual(g.map((x) => [x.key, x.finishes, x.components, x.rows]), [['absolute.x | num → num', 1, 2, 2], ['name | word → word', 1, 1, 1], ['element | el:text → none', 0, 1, 1], ['props | word → word', 0, 1, 1], ['fills.N.color | token → token', 0, 1, 1]]);
  assert.match(g[0].examples[0], /^a:x: icon\.absolute\.x -2 \| 10$/); n++;
}


// a name the library lacks refuses the run, unless the panel lists it; thirty names passed as one word drew nothing and ended 0
{ const { unknownNames } = await import('./eval.mjs');
  const one = unknownNames(['button checkbox'], ['button', 'checkbox']);
  ok('names run together as one word refuse the run', one.refused.length === 1 && one.said.length === 0);
  const gone = unknownNames(['button', 'old'], ['button'], ['button', 'old']);
  ok('a panel name the library dropped is said, not refused', gone.refused.length === 0 && gone.said.length === 1);
  ok('names the library has pass', unknownNames(['button'], ['button']).refused.length === 0); }
console.log(`${n} passed`);
