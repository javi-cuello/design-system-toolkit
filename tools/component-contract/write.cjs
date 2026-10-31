#!/usr/bin/env node
/*
 * Write every component's contract beside its stored spec, the way the
 * snapshot router does on every library snapshot (store.cjs). For a store
 * whose specs predate contracts, or after a change to derive.cjs:
 *
 *   node tools/component-contract/write.cjs <components dir>
 *
 * Writes only what changed, and says how many; a spec that cannot be
 * derived is named and exits 1.
 */
const fs = require('fs');
const path = require('path');
const { derive } = require('./derive.cjs');
const { deriveOptionsFor } = require('../snapshot/projects.cjs');

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) { console.error('usage: write.cjs <components dir>'); process.exit(2); }
let written = 0, same = 0;
const bad = [];
// the project's state axis and pointer states, as the snapshot router derives under them
const optionsOf = deriveOptionsFor(dir);
const known = fs.readdirSync(dir).map((d) => { try { return JSON.parse(fs.readFileSync(path.join(dir, d, 'figma.json'), 'utf8')).name; } catch { return null; } }).filter(Boolean);
for (const d of fs.readdirSync(dir).sort()) {
  const spec = path.join(dir, d, 'figma.json');
  if (!fs.existsSync(spec)) continue;
  let text;
  try { text = JSON.stringify(derive(JSON.parse(fs.readFileSync(spec, 'utf8')), known, optionsOf(d)), null, 2) + '\n'; } catch (e) { bad.push(`${d}: ${e.message}`); continue; }
  const file = path.join(dir, d, 'contract.json');
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) { same++; continue; }
  fs.writeFileSync(file, text);
  written++;
}
console.log(`contracts: ${written} written, ${same} unchanged${bad.length ? `, ${bad.length} not derived` : ''}`);
for (const b of bad) console.log(`  ${b}`);
process.exit(bad.length ? 1 : 0);
