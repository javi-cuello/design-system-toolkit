#!/usr/bin/env node
/*
 * Writes the generated block of plugins/audit-lite/code.js: the components audit's scanner, its judgement prompt, its
 * buckets and universal conventions, the house settings flattened as every other launcher flattens them, and this
 * plugin's own instructions and report template. A plugin's main file cannot load other files, so they are copied in;
 * the copy is generated, never pasted (toolkit-standard §D 23), and --check fails on one that differs.
 *
 *   node plugins/audit-lite/sync.mjs            write
 *   node plugins/audit-lite/sync.mjs --check    exit 1 when the block differs (run by standards/tests/check.sh)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const require = createRequire(import.meta.url);
const { flatSettings } = require(path.join(ROOT, 'tools/snapshot/projects.cjs'));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SKILL = 'skills/figma-components-audit';
const CODE = path.join(HERE, 'code.js');
const BLOCK = /\/\* audit-lite generated start[\s\S]*?\/\* audit-lite generated end \*\//;

const settings = JSON.parse(read('standards/audit-settings.json'));
const house = settings['audit-defaults'];
const tokens = flatSettings(house, {});
// The page filter is derived from the house's page markers, which a library the toolkit never set up does not use:
// kept, it would scan nothing. Absent, the scanner walks every page.
delete tokens.componentPages;

const scanner = read(`${SKILL}/scanner/audit.js`);
// The settings the scanner reads that the house does not set: each one's check is skipped, and the report says which.
// A derived key (the page filter, the excluded sections) is not a check, so it is not listed.
const describe = {};
for (const [name, group] of Object.entries(settings['audit-keys'])) if (name !== 'derived' && group && typeof group === 'object') Object.assign(describe, group);
const derived = settings['audit-keys'].derived || {};
const read_ = new Set([...scanner.matchAll(/TOK\.(\w+)/g), ...scanner.matchAll(/scaleOf\("(\w+)"\)/g)].map((m) => m[1]));
const unset = [...read_].filter((k) => !(k in tokens) && !(k in derived)).sort().map((k) => ({ key: k, means: typeof describe[k] === 'string' ? describe[k] : '' }));

const LITE = {
  tokens,
  scales: house.optionOrder || {},
  unset,
  judge: read(`${SKILL}/scanner/judge.txt`),
  buckets: JSON.parse(read(`${SKILL}/scanner/buckets.json`)),
  conventions: read(`${SKILL}/references/conventions-universal.md`),
  instructions: read('plugins/audit-lite/instructions.md'),
  template: read('plugins/audit-lite/report.html'),
};

const block = `/* audit-lite generated start — written by plugins/audit-lite/sync.mjs from ${SKILL}/scanner, ${SKILL}/references/conventions-universal.md, standards/audit-settings.json, instructions.md and report.html; never edit by hand */
const LITE = ${JSON.stringify(LITE)};
/** The components audit's scanner, unchanged: TARGETS [] scans every set. @returns {Promise<any>} */
async function scan(/** @type {string[]} */ TARGETS, /** @type {any} */ SCALES, /** @type {any} */ TOKENS) {
${scanner}
}
/* audit-lite generated end */`;

const text = fs.readFileSync(CODE, 'utf8');
if (!BLOCK.test(text)) { console.log('plugins/audit-lite/code.js: no generated block to write into'); process.exit(1); }
const wanted = text.replace(BLOCK, () => block);
if (process.argv.includes('--check')) {
  if (wanted !== text) { console.log('plugins/audit-lite/code.js: its generated block differs from the sources — run node plugins/audit-lite/sync.mjs'); process.exit(1); }
  process.exit(0);
}
if (wanted !== text) { fs.writeFileSync(CODE, wanted); console.log('plugins/audit-lite/code.js: written'); } else console.log('plugins/audit-lite/code.js: matches');
