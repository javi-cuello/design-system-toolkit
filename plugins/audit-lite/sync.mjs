#!/usr/bin/env node
/*
 * Writes the generated block of plugins/audit-lite/code.js: the audit's list of stages and its reader, the components
 * audit's scanner with its judgement prompt, buckets and universal conventions, the foundations audit's file and
 * library checks, the snapshot plugin's facts mode, the house settings flattened as every other launcher flattens them, and this
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

// The results page reads as the audit dashboard does: its bucket titles, column labels, severity and area names, and its
// colour tokens, taken from the dashboard's own files so the two cannot drift apart.
const DASHBOARD = 'tools/docs-site/src/dashboard';
const objectAt = (src, name) => { const m = new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\});').exec(src); if (!m) throw new Error('sync: ' + name + ' not found in the dashboard'); return new Function('return ' + m[1])(); };
const queueJs = read(`${DASHBOARD}/queue.js`);
const { OWNER_LABEL } = await import(path.join(ROOT, DASHBOARD, 'labels.js'));
const DASH = {
  buckets: Object.fromEntries([...read(`${DASHBOARD}/Dashboard.astro`).matchAll(/<h2 id="(b\d)H">([^<]+)<\/h2>/g)].map((m) => [m[1], m[2]])),
  columns: objectAt(queueJs, 'COLUMNS'),
  // (checked below: three titles, or the sync fails rather than the page saying "Bucket 1")
  sev: objectAt(queueJs, 'SEV_LABEL'),
  owners: OWNER_LABEL,
};
if (Object.keys(DASH.buckets).length !== 3) throw new Error('sync: the dashboard\'s three bucket titles were not found in Dashboard.astro');
const systemCss = read('stock-ui/stock-ui.css');
const pageSrc = read('plugins/audit-lite/report.html');
const used = [...new Set([...pageSrc.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]))];
const tokens_ = used.map((v) => { const m = new RegExp('^\\s*' + v + ':\\s*([^;]+);', 'm').exec(systemCss); if (!m) throw new Error('sync: ' + v + ' is not in the dashboard\'s stock-ui'); return v + ':' + m[1].trim(); });
const template = pageSrc.replace(':root{--dash-tokens:none}', () => ':root{' + tokens_.join(';') + '}').replace('const DASH = {};', () => 'const DASH = ' + JSON.stringify(DASH) + ';');
if (template === pageSrc) throw new Error('sync: report.html has no token or DASH slot');

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
  template,
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
// The audit's one list of stages and its reader (tools/figma-audit/stages.mjs): Audit lite runs the stages that name it,
// in the list's order, by the rules the dashboard and bin/audit read (figma-project-audit stages.json).
const REGISTRY_FILE = 'skills/figma-project-audit/stages.json';
const registry = JSON.parse(read(REGISTRY_FILE));
const stagesSrc = read('tools/figma-audit/stages.mjs');
const { gatherCode } = await import(path.join(ROOT, 'tools/figma-audit/stages.mjs'));
const strip = (src) => src.replace(/^export /gm, '');
// The tokens and icons checks (figma-foundations-audit scripts/library.mjs), over the store's own owns derivation
// (tools/snapshot/owns.cjs), each in a scope of its own: a plugin's main file imports nothing. iconSetNames is left out:
// it fetches, and Audit lite runs no icon-name check (the project's icon set is a setting only the full audit reads).
const LIBRARY_FILE = 'skills/figma-foundations-audit/scripts/library.mjs';
const OWNS_FILE = 'tools/snapshot/owns.cjs';
const librarySrc = read(LIBRARY_FILE);
const IMPORT = /^import ownsModule from "[^"]*owns\.cjs";\n/m;
if (!IMPORT.test(librarySrc)) throw new Error('sync: ' + LIBRARY_FILE + ' no longer imports owns.cjs as ownsModule');
const cut = librarySrc.indexOf('export async function iconSetNames');
if (cut < 0 || /^export /m.test(librarySrc.slice(cut + 1))) throw new Error('sync: iconSetNames is not the last export of ' + LIBRARY_FILE);
const libraryBody = strip(librarySrc.slice(0, librarySrc.lastIndexOf('/**', cut)).replace(IMPORT, ''));
const library = `const LIBRARY = (() => {
const ownsModule = (() => { const module = { exports: /** @type {any} */ ({}) };
${read(OWNS_FILE)}
return module.exports; })();
${libraryBody}
return { liveChecks, liveApplies };
})();`;
// The snapshot plugin's facts mode, its own reader run as the registry says (gatherCode: its `__html__` shadowed, so it
// never opens a window inside this one). The tokens and icons stages share one read, so their gathers must agree.
const live = registry.stages.filter((s) => s.id === 'tokens' || s.id === 'icons');
if (live.length !== 2 || JSON.stringify(live[0].gather) !== JSON.stringify(live[1].gather)) throw new Error('sync: the tokens and icons stages no longer share one gather in ' + REGISTRY_FILE);
const snapshotSrc = read(live[0].gather.script);
const ICON_PAGE = /^const isIconPage = .*;$/m;
if (!ICON_PAGE.exec(snapshotSrc)) throw new Error('sync: ' + live[0].gather.script + ' has no one-line isIconPage');
const snapshot = `/** What the snapshot plugin calls an icon page, its own rule: the icons stage applies where there is one. */
${ICON_PAGE.exec(snapshotSrc)[0]}
/** The snapshot plugin's facts mode (design-system-snapshot code.js), unchanged, run headless. @returns {Promise<any>} */
function snapshotFacts() {
${gatherCode(live[0], snapshotSrc)}
}`;

// The full audit's discovery and probes (figma-components-audit scripts/probes.js), its factory by source.
const probes = `const FCA_FACTORY = ${globalThis.__FCA_PROBES_FACTORY.toString()};`;

const block = `/* audit-lite generated start — written by plugins/audit-lite/sync.mjs from ${SCANNER}, ${FOUNDATIONS}/foundations.js, ${REGISTRY_FILE}, tools/figma-audit/stages.mjs, ${LIBRARY_FILE}, ${OWNS_FILE}, ${live[0].gather.script}, skills/figma-components-audit/scripts/probes.js, ${REFERENCES}/conventions-universal.md, tools/snapshot/projects.cjs, tools/figma-audit/judge-rules.mjs, skills/figma-context-capture/assets/context-template.md, standards/audit-settings.json, standards/naming-preferences.json, instructions.md, report.html, and the audit dashboard's words and tokens (tools/docs-site/src/dashboard, stock-ui); never edit by hand */
const LITE = ${JSON.stringify(LITE)};
${readers}
${judgeRules}
${probes}
const REGISTRY = ${JSON.stringify(registry)};
${strip(stagesSrc)}
${library}
${snapshot}
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
