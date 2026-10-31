#!/usr/bin/env node
// node tools/toolkit-check/test-sandbox-paste.mjs — every script pasted into Figma's sandbox is accepted by it.
// The sandbox (SES, through the Desktop Bridge) refuses a whole script holding `import` followed by `(`,
// `//` or `/*`, comments included: a comment line ending "…and import" over "// nothing" kept docgen.js
// and properties-table.js out of every bridge run from 2026-10-23 to 2026-10-30 ("possible import
// expression rejected"). Reads skills/*/scripts/*.js, plugins/*/*.js and the js blocks of skills' SKILL.md and
// references; run by bin/check.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// SES's own two rules: an import expression (a spread before it too), and an HTML comment marker anywhere
export const rejected = (text) => [...text.matchAll(/(^|[^.\w]|\.\.\.)import(\s*(\(|\/\/|\/\*))|<!--|-->/g)].map((m) => text.slice(0, m.index).split('\n').length);
// the js blocks a skill's markdown hands an agent to paste
const blocks = (md) => [...md.matchAll(/^```(?:js|javascript)\n([\s\S]*?)^```/gm)].map((m) => [m[1], md.slice(0, m.index).split('\n').length]);

assert.deepEqual(rejected('// run in the sandbox and import\n  // nothing'), [1], 'a comment ending in import over a comment is refused');
assert.deepEqual(rejected('const m = await import("x")'), [1]);
assert.deepEqual(rejected('// where nothing is imported'), [], 'imported is not import');
assert.deepEqual(rejected('figma.variables.importVariableByKeyAsync(k)'), [], 'a method named import… is fine');
assert.deepEqual(rejected('const s = "<!-- x -->"'), [1, 1], 'an HTML comment marker is refused, even in a string');

const files = [];
for (const top of ['skills', 'plugins']) for (const d of readdirSync(join(ROOT, top))) {
  const dir = top === 'skills' ? join(ROOT, top, d, 'scripts') : join(ROOT, top, d);
  if (!existsSync(dir)) continue;
  try { for (const f of readdirSync(dir)) if (f.endsWith('.js')) files.push(join(dir, f)); } catch { /* a file, not a folder */ }
}
const bad = files.flatMap((f) => rejected(readFileSync(f, 'utf8')).map((n) => `${f.slice(ROOT.length + 1)}:${n}`));
let pasted = 0;
for (const d of readdirSync(join(ROOT, 'skills'))) {
  const mds = [join(ROOT, 'skills', d, 'SKILL.md')];
  const ref = join(ROOT, 'skills', d, 'references');
  if (existsSync(ref)) for (const f of readdirSync(ref)) if (f.endsWith('.md')) mds.push(join(ref, f));
  for (const md of mds.filter(existsSync)) for (const [code, at] of blocks(readFileSync(md, 'utf8'))) {
    pasted++;
    for (const n of rejected(code)) bad.push(`${md.slice(ROOT.length + 1)}:${at + n}`);
  }
}
assert.deepEqual(bad, [], `Figma's sandbox refuses these scripts whole: ${bad.join(', ')}`);
console.log(`ok ${files.length} sandbox scripts and ${pasted} js blocks in skills' markdown, none holding what the sandbox refuses`);
