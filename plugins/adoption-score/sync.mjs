#!/usr/bin/env node
/*
 * Writes the generated block of plugins/adoption-score/code.js: figma-components-audit's probes (scripts/probes.js),
 * whose composed-frame check is the widget's scan. A widget's main file cannot load other files, so the probes are
 * copied in; the copy is generated, never pasted (toolkit-standard §D 23), and --check fails on one that differs.
 *
 *   node plugins/adoption-score/sync.mjs            write
 *   node plugins/adoption-score/sync.mjs --check    exit 1 when the block differs (run by standards/tests/check.sh)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
createRequire(import.meta.url)(path.join(ROOT, 'skills/figma-components-audit/scripts/probes.js'));
const CODE = path.join(HERE, 'code.js');
const BLOCK = /\/\* adoption-score generated start[\s\S]*?\/\* adoption-score generated end \*\//;

const block = `/* adoption-score generated start — written by plugins/adoption-score/sync.mjs from skills/figma-components-audit/scripts/probes.js; never edit by hand */
const FCA_FACTORY = ${globalThis.__FCA_PROBES_FACTORY.toString()};
/* adoption-score generated end */`;

const src = fs.readFileSync(CODE, 'utf8');
if (!BLOCK.test(src)) { console.error('sync: no generated block in ' + CODE); process.exit(1); }
const next = src.replace(BLOCK, () => block);
if (process.argv.includes('--check')) {
  if (next !== src) { console.error('adoption-score: code.js differs from its sources; run node plugins/adoption-score/sync.mjs'); process.exit(1); }
  console.log('adoption-score: generated block current');
} else {
  fs.writeFileSync(CODE, next);
  console.log('adoption-score: wrote the generated block');
}
