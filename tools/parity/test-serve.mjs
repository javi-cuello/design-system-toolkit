#!/usr/bin/env node
// serve.mjs, the static server a parity run reads a built Storybook through: only this machine's own names are
// served, so a page elsewhere that points its name here (DNS rebinding) reads nothing (review of 2026-11-12, point 12).
// Run: node tools/parity/test-serve.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { serve } from './serve.mjs';

let pass = 0, fail = 0;
const ok = (name, c) => { if (c) pass++; else { fail++; console.log('FAIL ' + name); } };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-serve-'));
fs.writeFileSync(path.join(dir, 'index.html'), '<p>ok</p>');
const s = await serve(dir);
const port = new URL(s.base).port;
const status = (host) => new Promise((done) => http.get({ host: '127.0.0.1', port, path: '/', headers: { host } }, (r) => { r.resume(); done(r.statusCode); }).on('error', () => done(0)));
ok('127.0.0.1 is served', await status(`127.0.0.1:${port}`) === 200);
ok('localhost is served', await status(`localhost:${port}`) === 200);
ok('another name is refused', await status(`evil.example:${port}`) === 421);
await s.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log(`test-serve: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
