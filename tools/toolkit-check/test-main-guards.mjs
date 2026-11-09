#!/usr/bin/env node
// node tools/toolkit-check/test-main-guards.mjs — main-guards.mjs finds a guard that compares argv[1] as typed.
import assert from 'node:assert/strict';
import { unresolved, throwing } from './main-guards.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('a guard comparing argv[1] through path.resolve is found', unresolved("x\nif (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {").join() === '2');
ok('one through a file:// URL is found', unresolved("if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {").length === 1);
ok('one through realpathSync is not', unresolved("if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {").length === 0);
ok('one matching the file name alone is not', unresolved("if (process.argv[1] && process.argv[1].endsWith('x.mjs')) {").length === 0);
ok('argv[1] read for another purpose is not', unresolved("const file = process.argv[1];").length === 0);
ok('a realpathSync of argv[1] outside a try is found; one inside a try is not',
  throwing("if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {").length === 1
  && throwing("if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {").length === 0);
ok('spaced, .native and ?? forms are found, and a try elsewhere on the line does not excuse one',
  throwing("if (realpathSync( process.argv[1] ) === x) {").length === 1 && throwing("if (realpathSync.native(process.argv[1]) === x) {").length === 1
  && throwing("if (realpathSync(process.argv[1] ?? '') === x) {").length === 1 && throwing("try { a() } catch {} if (realpathSync(process.argv[1]) === x) {").length === 1);
ok('a one-line guard that logs is still read; a try around another realpath does not excuse the argv one; the null fed to a call is found',
  throwing("if (realpathSync(process.argv[1]) === x) main().catch((e) => { console.error(e.message); });").length === 1
  && throwing("(() => { try { return realpathSync(fileURLToPath(import.meta.url)); } catch { return null; } })() === realpathSync(process.argv[1])").length === 1
  && throwing("const me = pathToFileURL((() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()).href;").length === 1
  && throwing("if (x === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) main().catch((e) => console.error(e));").length === 0
  && throwing("if (u === (() => { try { return pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return null; } })()) {").length === 0);
console.log(`${n}/${n} passed`);
