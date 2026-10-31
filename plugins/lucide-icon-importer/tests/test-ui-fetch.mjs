#!/usr/bin/env node
// ui.html's fetch queue and retry are a copy of figma-plugin-creator's
// assets/fetch-queue.js (toolkit-standard §D 2, a scaffold copy): held to the
// source here, and the copy's queue run against jobs that fail at once.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const ui = fs.readFileSync(path.join(HERE, '../ui.html'), 'utf8');
const asset = fs.readFileSync(path.join(HERE, '../../../skills/figma-plugin-creator/assets/fetch-queue.js'), 'utf8');
const fn = (src, name) => { const a = src.indexOf(`function ${name}(`); let i = src.indexOf('{', a), d = 0; for (; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; } return src.slice(a, i + 1); };
const bare = (s) => s.replace(/\/\/.*$/gm, '').replace(/\s+/g, '');

for (const name of ['createFetchQueue', 'retryOrFail']) ok(`ui.html's ${name} is the house copy`, bare(fn(ui, name)) === bare(fn(asset, name)));

const script = ui.slice(ui.lastIndexOf('<script>') + 8, ui.lastIndexOf('</script>'));
ok('the UI script parses', (() => { try { new vm.Script(script); return true; } catch { return false; } })());

const ctx = {}; vm.createContext(ctx); vm.runInContext(fn(ui, 'createFetchQueue'), ctx);
const queued = ctx.createFetchQueue(2);
const thrown = await Promise.allSettled([1, 2, 3].map(() => queued(() => { throw new Error('at once'); })));
const after = await queued(() => Promise.resolve('still runs'));
ok('jobs that throw at once give their slot back, so the queue keeps running', thrown.every((r) => r.status === 'rejected') && after === 'still runs');
console.log(`${n}/${n} passed`);
