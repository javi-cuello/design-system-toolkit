// node tools/toolkit-check/test-owned-check.mjs — a job the toolkit owns is called, never written again.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOLKIT = join(HERE, '..', '..');
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
const run = (repo) => { try { return execFileSync(process.execPath, [join(HERE, 'owned-check.mjs'), '--repo', repo], { encoding: 'utf8' }); } catch (e) { return String(e.stdout) + 'EXIT ' + e.status; } };
const repoWith = (root, files) => { const d = mkdtempSync(join(root, '.owned-test-')); for (const [f, t] of Object.entries(files)) { mkdirSync(dirname(join(d, f)), { recursive: true }); writeFileSync(join(d, f), t); } return d; };

const made = [];
try {
  // a project that writes the colour parser again
  const own = repoWith(tmpdir(), { 'src/colour.mjs': 'export function parseColour(s) { return null; }\n' });
  made.push(own);
  ok('a project that defines an owned name fails, naming what to call', /defines `parseColour`/.test(run(own)) && /EXIT 1/.test(run(own)));
  // a project that takes it from the toolkit
  const uses = repoWith(tmpdir(), { 'src/colour.mjs': "import { parseColour } from '/x/toolkit/tools/parity/values.mjs';\nexport const read = (s) => parseColour(s);\n" });
  made.push(uses);
  ok('a project that imports it from the toolkit passes', !/EXIT/.test(run(uses)));
  // a module inside the toolkit that imports the owner by a relative path and hands its code on (a plugin's code)
  const inside = repoWith(join(TOOLKIT, 'tools'), { 'x/draw.mjs': "import { parseColour } from '../../parity/values.mjs';\nexport const code = () => `const parseColour = ${parseColour.toString()};`;\n" });
  made.push(inside);
  ok('a toolkit module that imports the owner by a relative path is a use, not a copy', !/EXIT/.test(run(inside)));
  // the same relative path from outside the toolkit is the project's own module
  const outside = repoWith(tmpdir(), { 'x/draw.mjs': "import { parseColour } from '../../parity/values.mjs';\nconst parseColour = 1;\n" });
  made.push(outside);
  ok('a relative path that does not reach the toolkit is no use of it', /EXIT 1/.test(run(outside)));
} finally { for (const d of made) rmSync(d, { recursive: true, force: true }); }
console.log(`\n${n} passed`);
