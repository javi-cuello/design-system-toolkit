#!/usr/bin/env node
/*
 * Writes the shared plugin UI into every copy of it: each plugin's ui.html and the plugin creator's template, which a
 * skill must carry as its own (skill-standard §A clause H), and the creator's assets. Two blocks:
 *   - the ui-base block, in the page's <style>: plugins/_shared/ui-base.css with FigUI3's stylesheet
 *     (plugins/_shared/figui3/fig.css) written where it says `/* figui3 css *\/`;
 *   - the FigUI3 block, in a <script type="module">: plugins/_shared/figui3/fig.js, which registers the fig-* elements.
 * The copies are generated, never pasted (toolkit-standard §D 23).
 *
 *   node plugins/_shared/sync.mjs            write
 *   node plugins/_shared/sync.mjs --check    list each copy that differs, exit 1 (run by standards/tests/check.sh)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
export const BLOCK = /\/\* ui-base v\d+ start[\s\S]*?\/\* ui-base v\d+ end \*\//;
export const JS_BLOCK = /\/\* figui3-js generated start[\s\S]*?\/\* figui3-js generated end \*\//;
const VERSION = '11.11.5';
const css = '/* figui3 generated start — FigUI3 ' + VERSION + ' dist/fig.css (MIT, plugins/_shared/figui3/LICENSE) */\n'
  + read('plugins/_shared/figui3/fig.css').trim() + '\n/* figui3 generated end */';
const raw = read('plugins/_shared/ui-base.css');
if (!raw.includes('/* figui3 css */')) throw new Error('sync: ui-base.css has no /* figui3 css */ line');
const base = raw.replace('/* figui3 css */', () => css).trimEnd();
const js = '/* figui3-js generated start — FigUI3 ' + VERSION + ' dist/fig.js (MIT, plugins/_shared/figui3/LICENSE) */\n'
  + read('plugins/_shared/figui3/fig.js').trim() + '\n/* figui3-js generated end */';
// an inlined copy ends its own tag at the first closing one: a newer FigUI3 holding one must be escaped before it ships
for (const [name, text, bad] of [['fig.css', css, /<\/style/i], ['fig.js', js, /<\/script|<!--/i]])
  if (bad.test(text)) { console.error(`sync: plugins/_shared/figui3/${name} holds ${bad.source}: inlining it would end the tag early`); process.exit(1); }
const check = process.argv.includes('--check');

const plugins = fs.readdirSync(path.join(ROOT, 'plugins')).filter((d) => !d.startsWith('_')).map((d) => `plugins/${d}/ui.html`);
const inlined = [...plugins, 'skills/figma-plugin-creator/assets/ui.html.tpl'].filter((f) => fs.existsSync(path.join(ROOT, f)));
const wanted = new Map([['skills/figma-plugin-creator/assets/ui-base.css', base + '\n'], ['skills/figma-plugin-creator/assets/figui3.js', js + '\n']]);
const missing = [];
for (const f of inlined) {
  const text = read(f);
  if (!BLOCK.test(text)) { missing.push(`${f}: no ui-base block to write into`); continue; }
  if (!JS_BLOCK.test(text)) { missing.push(`${f}: no figui3-js block to write into (a <script type="module"> holding the generated markers)`); continue; }
  wanted.set(f, text.replace(BLOCK, () => base).replace(JS_BLOCK, () => js));
}

const stale = [...wanted].filter(([f, text]) => !fs.existsSync(path.join(ROOT, f)) || read(f) !== text).map(([f]) => f);
for (const m of missing) console.log(m);
if (check) {
  for (const f of stale) console.log(`${f}: differs from plugins/_shared — run node plugins/_shared/sync.mjs`);
  process.exit(stale.length || missing.length ? 1 : 0);
}
for (const f of stale) { fs.writeFileSync(path.join(ROOT, f), wanted.get(f)); console.log(`${f}: written`); }
if (!stale.length) console.log('every copy matches');
process.exit(missing.length ? 1 : 0);
