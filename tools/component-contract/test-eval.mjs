#!/usr/bin/env node
// eval.mjs: its field key, its counts, and the ratchet that holds them. Run: node tools/component-contract/test-eval.mjs
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fieldOf, counts, worse, measure } from './eval.mjs';

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
  fs.rmSync(home, { recursive: true, force: true });
}
console.log(`${n} passed`);
