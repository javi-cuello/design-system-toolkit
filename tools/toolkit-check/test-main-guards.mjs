#!/usr/bin/env node
// node tools/toolkit-check/test-main-guards.mjs — main-guards.mjs finds a guard that compares argv[1] as typed.
import assert from 'node:assert/strict';
import { unresolved } from './main-guards.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('a guard comparing argv[1] through path.resolve is found', unresolved("x\nif (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {").join() === '2');
ok('one through a file:// URL is found', unresolved("if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {").length === 1);
ok('one through realpathSync is not', unresolved("if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {").length === 0);
ok('one matching the file name alone is not', unresolved("if (process.argv[1] && process.argv[1].endsWith('x.mjs')) {").length === 0);
ok('argv[1] read for another purpose is not', unresolved("const file = process.argv[1];").length === 0);
console.log(`${n}/${n} passed`);
