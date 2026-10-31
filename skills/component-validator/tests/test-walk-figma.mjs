#!/usr/bin/env node
// node tests/test-walk-figma.mjs — the skill's live reader, run as figma_execute
// runs it (a function body). The engine it feeds is tools/validator/validate.mjs,
// tested beside it (tools/validator/test-validate.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

{
  // The live reader, run as figma_execute runs it (a function body), against a fake page of two sets.
  const src = fs.readFileSync(new URL('../scripts/walk-figma.js', import.meta.url), 'utf8');
  const node = (type, name, extra = {}) => ({ type, name, width: 10, height: 10, visible: true, ...extra });
  const set = (id, name) => {
    const s = node('COMPONENT_SET', name, { id, componentPropertyDefinitions: {} });
    const v = node('COMPONENT', 'State=Rest', { parent: s, children: [node('TEXT', 'Hint', { visible: false, characters: 'x', lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PIXELS', value: 0 }, fontSize: 12 }), node('VECTOR', 'Icon')] });
    s.children = [v];
    return s;
  };
  const sets = [set('1:1', 'Chip'), set('2:2', 'Tag')];
  const figma = { mixed: Symbol('mixed'), currentPage: { findAll: (f) => sets.filter(f) }, getNodeByIdAsync: async (id) => sets.find((s) => s.id === id) || null, getStyleByIdAsync: async () => null };
  const run = (prefix) => new Function('figma', `${prefix}\n${src}`)(figma);
  const all = await run('');
  ok('walk-figma · no SCOPE walks every set on the page', all.map((c) => c.name).join() === 'Chip,Tag');
  ok('walk-figma · a prepended SCOPE walks those sets alone', (await run('const SCOPE = ["2:2"];')).map((c) => c.name).join() === 'Tag');
  const [hint, icon] = all[0].variants[0].children;
  ok('walk-figma · a hidden leaf layer is recorded hidden, a shown one is not', hint.hidden === true && icon.hidden === undefined);
}

console.log(`${n}/${n} passed`);
