#!/usr/bin/env node
// node tools/toolkit-check/test-missing-input.mjs — the command lines the review of 2026-10-31 found dying on a
// missing input with a stack or "Unexpected end of JSON input" say it in one line naming the input, and exit
// non-zero, as tools/figma-audit/scores.mjs does.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'missing-input-'));
const nope = join(tmp, 'nope.json'), bad = join(tmp, 'bad.json');
writeFileSync(bad, '{"rows": [');
writeFileSync(join(tmp, 'pass-c.json'), '{"collections": []}');
writeFileSync(join(tmp, 'sweep.json'), '{"pages": []}');
let n = 0;
const run = (script, args, input = '') => spawnSync(process.execPath, [join(ROOT, script), ...args], { encoding: 'utf8', input });
const oneLine = (name, r, file, said) => {
  n++;
  const err = r.stderr.trim();
  assert.ok(r.status > 0 && !err.includes('\n') && err.includes(file) && said.test(err) && !/at .*\.m?js:\d+/.test(err), `${name}\nexit ${r.status}\n${r.stderr}`);
  console.log('ok  ' + name);
};
try {
  const CASES = [
    ['tools/validator/validate.mjs', (f) => ['--target', 'web', f]],
    ['tools/tokens/from-snapshot.mjs', (f) => [f, join(tmp, 'out')]],
    ['skills/figma-foundations-audit/scripts/from-snapshot.mjs', (f) => ['--input', f]],
    ['skills/figma-component-descriptions/scripts/sections.mjs', (f) => ['--composition', f]],
    ['tools/figma-audit/rows.mjs', (f) => ['--data', join(tmp, 'record.json'), '--payload', f]],
    ['skills/figma-context-capture/scripts/pass-c-scales.mjs', (f) => [f]],
    ['skills/figma-context-capture/scripts/pass-c-scales.mjs', (f) => [join(tmp, 'pass-c.json'), '--tokens', f]],
    ['skills/figma-component-descriptions/scripts/sweep-diff.mjs', (f) => [f, '--against', f]],
    ['skills/figma-component-descriptions/scripts/sweep-diff.mjs', (f) => [join(tmp, 'sweep.json'), '--against', f]],
  ];
  for (const [script, args] of CASES) {
    oneLine(`${script}: a file that is not there is one line naming it`, run(script, args(nope)), nope, /no such file/);
    oneLine(`${script}: a file that is not JSON is one line naming it`, run(script, args(bad)), bad, /not JSON/);
  }
  const rows = (input) => run('tools/figma-audit/rows.mjs', ['--data', join(tmp, 'record.json')], input);
  oneLine('rows.mjs: nothing piped and no --payload says so, never "Unexpected end of JSON input"', rows(''), 'piped payload', /is empty: give --payload/);
  oneLine('rows.mjs: a piped payload that is not JSON names it', rows('{bad'), 'piped payload', /not JSON/);
} finally { rmSync(tmp, { recursive: true, force: true }); }
console.log(`\n${n} passed`);
