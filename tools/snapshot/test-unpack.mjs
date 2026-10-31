#!/usr/bin/env node
// node tools/snapshot/test-unpack.mjs — the downloaded-file path
// with no router: what the package carries, and what it refuses.
import assert from 'node:assert/strict';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closure, unpack } from './unpack.mjs';

const files = closure(fileURLToPath(new URL('./unpack.mjs', import.meta.url))).map((f) => basename(f));
for (const f of ['store.cjs', 'payload.cjs', 'spec.cjs', 'derive.cjs']) assert.ok(files.includes(f), `the package carries ${f}`);
assert.ok(!files.includes('router.mjs') && !files.includes('deliver.cjs'), 'the package carries no router and no project delivery');
assert.throws(() => unpack({ tokens: {} }, '/nonexistent'), /no "kind"/, 'a file without kind is refused before anything is written');
console.log('4/4 passed');
