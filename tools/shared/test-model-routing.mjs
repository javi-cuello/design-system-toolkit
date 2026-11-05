// node tools/shared/test-model-routing.mjs — the routing table every skill and workflow reads.
// Every skill in skills/ has a row (ds-model-routing, which is consulted rather than run, and
// kirby-cms, which is not design-systems work, excepted); keys are unique; an agent pick is a
// model and effort agent() accepts; routes() and routeFor() return those picks.
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ROWS, routes, routeFor } from './model-routing.mjs';

const MODELS = ['sonnet', 'opus', 'fable', 'haiku'];
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
const UNROUTED = ['ds-model-routing', 'kirby-cms'];

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('keys are unique, and each is a skill of its row or that skill in a mode', () => {
  const keys = ROWS.flatMap((r) => r.keys);
  assert.equal(new Set(keys).size, keys.length);
  for (const r of ROWS) {
    assert.ok(r.keys.length, `${r.task}: keys`);
    const named = r.keys.filter((k) => r.skills.includes(k.split(':')[0]));
    assert.ok(r.skills.length === 0 || named.length, `${r.task}: no key names its skill`);
    for (const k of named) assert.match(k, /^[a-z0-9-]+(:[a-z-]+)?$/, k);
  }
  // a skill with a mode key has no plain key: the mode is asked first
  for (const k of keys.filter((x) => x.includes(':'))) assert.ok(!keys.includes(k.split(':')[0]), `${k} beside a plain key`);
});

t('every row is complete', () => {
  for (const r of ROWS) {
    for (const f of ['task', 'model', 'effort', 'why']) assert.ok(r[f], `${r.keys}: ${f}`);
    assert.ok(Array.isArray(r.skills), `${r.keys}: skills`);
    assert.ok(MODELS.includes(r.agent.model), `${r.keys}: model ${r.agent.model}`);
    if ('effort' in r.agent) assert.ok(EFFORTS.includes(r.agent.effort), `${r.keys}: effort ${r.agent.effort}`);
    assert.deepEqual(Object.keys(r.agent).filter((k) => !['model', 'effort'].includes(k)), [], `${r.keys}: agent keys`);
  }
});

t('every skill has a row', () => {
  const dir = fileURLToPath(new URL('../../skills/', import.meta.url));
  const skills = readdirSync(dir).filter((d) => statSync(dir + d).isDirectory());
  const routed = new Set(ROWS.flatMap((r) => r.skills));
  const missing = skills.filter((s) => !routed.has(s) && !UNROUTED.includes(s));
  assert.deepEqual(missing, []);
  for (const s of routed) assert.ok(skills.includes(s), `a row names ${s}, which is not a skill`);
});

t('routes() and routeFor() return the agent picks', () => {
  const all = routes();
  assert.deepEqual(all['figma-components-audit'], { model: 'sonnet', effort: 'medium' });
  assert.deepEqual(all['oklch-color-scale-system:hue-drift'], { model: 'opus', effort: 'high' });
  assert.equal(all['oklch-color-scale-system'], undefined);
  assert.deepEqual(routeFor('design-system-research', 'deep'), { model: 'opus', effort: 'high' });
  assert.equal(routeFor('no-such-skill'), null);
  routeFor('frontend-build').model = 'x';
  assert.equal(routeFor('frontend-build').model, 'sonnet');
});

console.log(`${n}/4 passed`);
