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
const projects = require(path.join(ROOT, 'tools/snapshot/projects.cjs'));
const { flatSettings } = projects;
require(path.join(ROOT, 'skills/figma-components-audit/scripts/probes.js'));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
// each folder named, never the skill's own: bin/get takes a named skill whole, and install.sh then installs it
const SCANNER = 'skills/figma-components-audit/scanner';
const REFERENCES = 'skills/figma-components-audit/references';
const FOUNDATIONS = 'skills/figma-foundations-audit/scripts';
const CODE = path.join(HERE, 'code.js');
const BLOCK = /\/\* audit-lite generated start[\s\S]*?\/\* audit-lite generated end \*\//;

const settings = JSON.parse(read('standards/audit-settings.json'));
const house = settings['audit-defaults'];
const tokens = flatSettings(house, {});
// The page filter is derived from the house's page markers, which a library the toolkit never set up does not use:
// kept, it would scan nothing. Absent, the scanner walks every page.
delete tokens.componentPages;

const scanner = read(`${SCANNER}/audit.js`);
const foundations = read(`${FOUNDATIONS}/foundations.js`);
// The settings the scanner reads that the house does not set: each one's check is skipped, and the report says which.
// A derived key (the page filter, the excluded sections) is not a check, so it is not listed.
const describe = {};
for (const [name, group] of Object.entries(settings['audit-keys'])) if (name !== 'derived' && group && typeof group === 'object') Object.assign(describe, group);
const derived = settings['audit-keys'].derived || {};
const read_ = new Set([...scanner.matchAll(/TOK\.(\w+)/g), ...scanner.matchAll(/scaleOf\("(\w+)"\)/g)].map((m) => m[1]));
// Which of them a run leaves unset depends on that run's settings (the house's, or a context document's), so the list
// is worked out at run time from these.
const reads = [...read_].filter((k) => !(k in derived)).sort().map((k) => ({ key: k, means: typeof describe[k] === 'string' ? describe[k] : '' }));

const LITE = {
  house,
  naming: JSON.parse(read('standards/naming-preferences.json')).preferences || {},
  tokens,
  scales: house.optionOrder || {},
  reads,
  judge: read(`${SCANNER}/judge.txt`),
  buckets: JSON.parse(read(`${SCANNER}/buckets.json`)),
  conventions: read(`${REFERENCES}/conventions-universal.md`),
  instructions: read('plugins/audit-lite/instructions.md'),
  template: read('plugins/audit-lite/report.html'),
  contextTemplate: read('skills/figma-context-capture/assets/context-template.md'),
};

// The full audit's own readers of a context document (tools/snapshot/projects.cjs), copied by their source, so the
// plugin reads a document exactly as the full audit does; housePreferences is the one stand-in, since a plugin reads no
// files: the house naming preferences travel in LITE.
const own = (name, fn) => (/^(async\s+)?function\b/.test(fn.toString()) ? fn.toString() : `const ${name} = ${fn.toString()};`);
const readers = [
  `const SECTIONS = ${JSON.stringify(projects.SECTIONS)};`,
  own('esc', projects.esc),
  'const housePreferences = () => LITE.naming;',
  ...['fenced', 'cells', 'walkRulings', 'rulingKey', 'rulingsOf', 'flatSettings'].map((n) => own(n, projects[n])),
].join('\n');
// The judge's conventions and rulings lines, as the dashboard derives them.
const judgeRules = read('tools/figma-audit/judge-rules.mjs').replace(/^export /gm, '');
// The full audit's discovery and probes (figma-components-audit scripts/probes.js), its factory by source.
const probes = `const FCA_FACTORY = ${globalThis.__FCA_PROBES_FACTORY.toString()};`;

const block = `/* audit-lite generated start — written by plugins/audit-lite/sync.mjs from ${SCANNER}, ${FOUNDATIONS}/foundations.js, skills/figma-components-audit/scripts/probes.js, ${REFERENCES}/conventions-universal.md, tools/snapshot/projects.cjs, tools/figma-audit/judge-rules.mjs, skills/figma-context-capture/assets/context-template.md, standards/audit-settings.json, standards/naming-preferences.json, instructions.md and report.html; never edit by hand */
const LITE = ${JSON.stringify(LITE)};
${readers}
${judgeRules}
${probes}
/** The components audit's scanner, unchanged: TARGETS [] scans every set. @returns {Promise<any>} */
async function scan(/** @type {string[]} */ TARGETS, /** @type {any} */ SCALES, /** @type {any} */ TOKENS) {
${scanner}
}
/** The foundations audit's checks (the file as a whole), unchanged; with no figma in scope it returns checkFacts. @returns {Promise<any>} */
async function foundations(/** @type {any} */ TOKENS) {
${foundations}
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
