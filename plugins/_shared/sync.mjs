#!/usr/bin/env node
/*
 * Writes plugins/_shared/ui-base.css into every copy of it: each plugin's ui.html, between its ui-base markers, and the
 * plugin creator's template and asset, which a skill must carry as its own (skill-standard §A clause H). The copies
 * are generated, never pasted (toolkit-standard §D 23).
 *
 *   node plugins/_shared/sync.mjs            write
 *   node plugins/_shared/sync.mjs --check    list each copy that differs, exit 1 (run by standards/tests/check.sh)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BLOCK = /\/\* ui-base v\d+ start[\s\S]*?\/\* ui-base v\d+ end \*\//;
const base = fs.readFileSync(path.join(ROOT, 'plugins/_shared/ui-base.css'), 'utf8').trimEnd();
const check = process.argv.includes('--check');

const plugins = fs.readdirSync(path.join(ROOT, 'plugins')).filter((d) => !d.startsWith('_')).map((d) => `plugins/${d}/ui.html`);
const inlined = [...plugins, 'skills/figma-plugin-creator/assets/ui.html.tpl'].filter((f) => fs.existsSync(path.join(ROOT, f)));
const wanted = new Map([['skills/figma-plugin-creator/assets/ui-base.css', base + '\n']]);
const missing = [];
for (const f of inlined) {
  const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (!BLOCK.test(text)) { missing.push(f); continue; }
  wanted.set(f, text.replace(BLOCK, () => base));
}

const stale = [...wanted].filter(([f, text]) => !fs.existsSync(path.join(ROOT, f)) || fs.readFileSync(path.join(ROOT, f), 'utf8') !== text).map(([f]) => f);
for (const f of missing) console.log(`${f}: no ui-base block to write into`);
if (check) {
  for (const f of stale) console.log(`${f}: differs from plugins/_shared/ui-base.css — run node plugins/_shared/sync.mjs`);
  process.exit(stale.length || missing.length ? 1 : 0);
}
for (const f of stale) { fs.writeFileSync(path.join(ROOT, f), wanted.get(f)); console.log(`${f}: written`); }
if (!stale.length) console.log('every copy matches');
process.exit(missing.length ? 1 : 0);
