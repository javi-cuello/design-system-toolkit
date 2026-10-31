#!/usr/bin/env node
/*
 * Every component spec on disk is in the compact shape and round-trips.
 *
 *   node check-specs.cjs <components dir>
 *
 * The fixtures beside spec.cjs prove the rules; this proves the library. A
 * tree shape no fixture imagined arrives the first time a designer draws one,
 * and it arrives already written — so the file that would corrupt every diff
 * is on disk before anyone notices.
 *
 * Three assertions, which two projects had written as two checks: the spec is
 * stored as one default plus deltas (a writer that skipped compact leaves a
 * correct file and an unreadable diff); resolving and compacting reproduces
 * the file byte for byte, so the writer and the reader are one pair; and the
 * resolved trees survive a second round trip, so the deltas mean what they
 * say. One caught a shape the other would not have.
 */
const fs = require('fs');
const path = require('path');
const { compact, resolve } = require('./spec.cjs');
const contract = require('../component-contract/derive.cjs');
const { deriveOptionsFor } = require('./projects.cjs');

const canon = (o) => (Array.isArray(o) ? o.map(canon)
  : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, canon(o[k])])) : o);
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

function checkSpecs(dir) {
  const bad = [];
  let specs = 0, variants = 0, full = 0;
  const dirs = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];
  // the names an instance can resolve to, as the store derives them (graph.cjs nameOf)
  const known = dirs.map((d) => { try { return JSON.parse(fs.readFileSync(path.join(dir, d, 'figma.json'), 'utf8')).name; } catch { return null; } }).filter(Boolean);
  // the project's state axis and pointer states, as the snapshot router derives under them (deliver.cjs)
  const optionsOf = deriveOptionsFor(dir);
  for (const d of dirs) {
    const file = path.join(dir, d, 'figma.json');
    if (!fs.existsSync(file)) continue;
    const onDisk = JSON.parse(fs.readFileSync(file, 'utf8'));
    specs++;
    if ((onDisk.variants || []).length > 1 && !('default' in onDisk)) { bad.push(`${d}: stored in full, not as default + deltas — snapshot again`); continue; }
    // A spec that cannot be read at all is a finding about that spec, not the
    // end of the run: the next one may be the one that explains it.
    let resolved;
    try { resolved = resolve(onDisk); } catch (e) { bad.push(`${d}: ${e.message}`); continue; }
    variants += resolved.variants.length;
    full += 1 + (onDisk.variants || []).filter((v) => !('delta' in v)).length;
    if (!same(compact(resolved), onDisk)) bad.push(`${d}: resolve → compact does not reproduce the file`);
    else if (!same(resolve(compact(resolved)), resolved)) bad.push(`${d}: the resolved trees do not survive a second round trip`);
    // the contract beside it is what tools/component-contract derives from it, and rebuilds every variant
    const cf = path.join(dir, d, 'contract.json');
    let derived;
    try { derived = contract.derive(onDisk, known, optionsOf(d)); } catch (e) { bad.push(`${d}: no contract can be derived — ${e.message}`); continue; }
    if (!fs.existsSync(cf)) bad.push(`${d}: no contract.json beside the spec — snapshot again, or node tools/component-contract/write.cjs`);
    else if (!same(JSON.parse(fs.readFileSync(cf, 'utf8')), derived)) bad.push(`${d}: contract.json is not what the spec derives — snapshot again, or node tools/component-contract/write.cjs`);
    else { const off = contract.selfCheck(onDisk, derived, known); if (off.length) bad.push(`${d}: the contract does not rebuild ${off.length} variant(s), first ${off[0]}`); }
  }
  return { specs, variants, full, bad };
}

module.exports = { checkSpecs };

if (require.main === module) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: check-specs.cjs <components dir>'); process.exit(2); }
  const { specs, variants, full, bad } = checkSpecs(path.resolve(dir));
  console.log(`${specs} specs, ${variants} variants, ${full} full trees, the rest deltas`);
  if (bad.length) { console.log('  ' + bad.join('\n  ')); process.exit(1); }
}
