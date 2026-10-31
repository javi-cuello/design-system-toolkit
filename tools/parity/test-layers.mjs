#!/usr/bin/env node
// node tools/parity/test-layers.mjs — from the toolkit root.
import assert from 'node:assert/strict';
import { layerAt, layerIndex, pathOf } from './layers.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const label = { name: 'Label', type: 'TEXT' };
const deep = { name: 'Label', type: 'TEXT' };
const asideA = { name: 'Aside', type: 'FRAME', children: [] }, asideB = { name: 'Aside', type: 'FRAME', children: [] };
const tree = { name: 'Size=lg, State=Rest', type: 'COMPONENT', children: [
  { name: 'Content', type: 'FRAME', children: [label, { name: 'Inner', type: 'FRAME', children: [deep] }] }, asideA, asideB,
] };

ok('a path names exactly the layer at that path', layerAt(tree, 'Content > Label') === label && layerAt(tree, 'Content > Inner > Label') === deep);
ok('a path that skips a level names nothing — the search that found the shallowest Label rebinds when a designer wraps one', layerAt(tree, 'Label') === null && layerAt(tree, 'Inner > Label') === null);
ok('$root is the variant itself', layerAt(tree, '$root') === tree);
ok('the second of two layers at one path is #2, as the store spells it', layerAt(tree, 'Aside') === asideA && layerAt(tree, 'Aside#2') === asideB);
ok('a node\'s exact path is the one that resolves back to it', pathOf(tree, deep) === 'Content > Inner > Label' && pathOf(tree, asideB) === 'Aside#2' && pathOf(tree, tree) === '$root' && pathOf(tree, {}) === null);
ok('the index carries each layer\'s parent and ancestors', layerIndex(tree).get('Content > Inner > Label').parent.name === 'Inner' && layerIndex(tree).get('Content > Inner > Label').ancestors.length === 3);
console.log(`\n${n} passed`);
