#!/usr/bin/env node
// eval.mjs: its field key, its counts, and the ratchet that holds them. Run: node tools/component-contract/test-eval.mjs
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fieldOf, counts, worse, measure, causes, hashOf, closureHashes, scopedTo, leftToCode } from './eval.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('a field is said without its element, so one cause in many elements is one line', fieldOf('content/icon.border.width') === '*.border.width' && fieldOf('props') === 'props' && fieldOf('root.shadow.0.color') === '*.shadow.N.color');
const legs = { browser: { a: { rows: [1, 2] }, b: { rows: [] }, c: { skipped: 'no reading' } }, figma: { a: { rows: [1] } } };
ok('the counts are the rows per component, and a component not measured has none', JSON.stringify(counts(legs)) === '{"browser":{"a":2,"b":0},"figma":{"a":1}}');
const accepted = { browser: { a: 2, b: 0, c: 3 }, figma: { a: 2 } };
const bad = worse({ browser: { a: 3, b: 0 }, figma: { a: 1 } }, accepted);
ok('a count that rose is said, one that fell is not, and a reading that went is said', bad.length === 2 && bad.includes('browser a: 2 → 3') && bad.some((x) => /browser c: accepted at 3, now not measured/.test(x)));
ok('a component measured since the accept is held until accepted; one that came back the same is not', worse({ browser: { z: 9 } }, { browser: {} }).length === 1 && worse({ browser: { z: 0 } }, { browser: {} }).length === 0);

// the self leg's fingerprint: a change to one component moves it and what places it (through a variant too), nothing else
{
  const lib = { A: { folder: 'a', anatomy: { root: {}, x: { kind: 'instance', component: 'B' } } }, B: { folder: 'b', anatomy: { root: {} }, variants: [{ add: { y: { kind: 'instance', component: 'C' } } }] }, C: { folder: 'c', anatomy: { root: {} } }, D: { folder: 'd', anatomy: { root: {}, z: { kind: 'instance', component: 'Icon/x' } } } };
  const before = closureHashes(lib, { a: '1', b: '1', c: '1', d: '1' }, 's'), after = closureHashes(lib, { a: '1', b: '1', c: '2', d: '1' }, 's');
  ok('a change to a placed component moves it and every component that places it, through a variant too, and nothing else', ['a', 'b', 'c'].every((f) => before[f] !== after[f]) && before.d === after.d);
  ok('a sheet whose every rule names its element is scoped; one rule past it is not', scopedTo('@layer c { ds-tag { color: red } :where(ds-tag[size="s"]) > [data-part="x"], ds-tag:hover { gap: 0 } }', 'ds-tag') && !scopedTo('ds-tag { a: 0 } button { b: 0 }', 'ds-tag') && !scopedTo('ds-tag-item { a: 0 }', 'ds-tag') && scopedTo('ds-tag:where(:disabled, :has(> :disabled)) > b { a: 0 }', 'ds-tag') && !scopedTo('ds-tag { animation: spin 1s } @keyframes spin { from { a: 0 } }', 'ds-tag'));
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
  ok('the rows left to code are counted, as a leg of their own, so a rise there is said', worse(counts({ self: { a: { rows: [], left: [{}, {}] } } }), { self: { a: 0 }, 'self left': { a: 1 } }).some((w) => /self left a: 1 → 2/.test(w))
    && !worse(counts({ self: { a: { rows: [], left: [] } } }), { self: { a: 0 }, 'self left': { a: 1 } }).length); }

console.log(`${n} passed`);
