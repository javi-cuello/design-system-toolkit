#!/usr/bin/env node
// node tools/parity/test-measurements.mjs — from the toolkit root.
import assert from 'node:assert/strict';
import { unstable } from './measurements.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const a = { Label: { w: 40, color: 'rgb(0, 0, 0)' }, Icon: { w: 16 }, __theme: 'light' };
ok('two passes that agree say nothing', unstable(a, JSON.parse(JSON.stringify(a))).length === 0);
ok('a moved property is named with both values, not just its layer',
  unstable(a, { ...a, Label: { w: 41, color: 'rgb(0, 0, 0)' } }).join() === 'Label › w: 40 vs 41');
// A re-render replaces the element the second pass looks for: the layer is
// named once, whole, rather than once per property it took with it.
ok('a layer the second pass lost is named once, with what it held',
  unstable(a, { Icon: { w: 16 }, __theme: 'light' }).join() === 'Label: {"w":40,"color":"rgb(0, 0, 0)"} vs undefined');
ok('a stamp compared whole, and skipped where the caller says so',
  unstable(a, { ...a, __theme: 'dark' }).join() === '__theme: "light" vs "dark"'
  && unstable(a, { ...a, __theme: 'dark' }, { skip: ['__theme'] }).length === 0);
console.log(`${n}/${n} passed`);
