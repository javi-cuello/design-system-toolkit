#!/usr/bin/env node
// eval.mjs: its field key, its counts, and the ratchet that holds them. Run: node tools/component-contract/test-eval.mjs
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fieldOf, counts, worse, measure, causes, hashOf } from './eval.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('a field is said without its element, so one cause in many elements is one line', fieldOf('content/icon.border.width') === '*.border.width' && fieldOf('props') === 'props' && fieldOf('root.shadow.0.color') === '*.shadow.N.color');
const legs = { browser: { a: { rows: [1, 2] }, b: { rows: [] }, c: { skipped: 'no reading' } }, figma: { a: { rows: [1] } } };
ok('the counts are the rows per component, and a component not measured has none', JSON.stringify(counts(legs)) === '{"browser":{"a":2,"b":0},"figma":{"a":1}}');
const accepted = { browser: { a: 2, b: 0, c: 3 }, figma: { a: 2 } };
const bad = worse({ browser: { a: 3, b: 0 }, figma: { a: 1 } }, accepted);
ok('a count that rose is said, one that fell is not, and a reading that went is said', bad.length === 2 && bad.includes('browser a: 2 → 3') && bad.some((x) => /browser c: accepted at 3, now not measured/.test(x)));
ok('a component measured since the accept is held until accepted; one that came back the same is not', worse({ browser: { z: 9 } }, { browser: {} }).length === 1 && worse({ browser: { z: 0 } }, { browser: {} }).length === 0);

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
console.log(`${n} passed`);
