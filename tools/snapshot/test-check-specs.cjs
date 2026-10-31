#!/usr/bin/env node
/*
 * check-specs.cjs on a components folder written the way the store writes one
 * (a compact spec and the contract derived from it), then with each defect it
 * exists to catch planted in a copy. Run: node tools/snapshot/test-check-specs.cjs
 *
 * bin/check runs it on every project's stored specs; with no project (a fresh
 * clone, CI) nothing ran it, and on an empty folder it said "0 specs" and
 * exited 0 (review, 2026-10-31).
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { compact } = require('./spec.cjs');
const { checkSpecs } = require('./check-specs.cjs');
const contract = require('../component-contract/derive.cjs');

let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const node = (name, type, props = {}, children) => ({ name, type, ...props, ...(children ? { children } : {}) });
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-specs-'));
process.on('exit', () => fs.rmSync(root, { recursive: true, force: true }));

// a two-variant component set, in the plugin's terms: a variant axis, a text property, a bound fill
const button = {
  name: 'Button', type: 'COMPONENT_SET',
  componentPropertyDefinitions: { Size: { type: 'VARIANT', defaultValue: 'md', variantOptions: ['md', 'lg'] }, 'Label#1:0': { type: 'TEXT', defaultValue: 'Label' } },
  variants: [
    node('Size=md', 'COMPONENT', { layoutMode: 'HORIZONTAL', paddingLeft: 12, paddingRight: 12, fills: [{ type: 'SOLID', variable: 'Colour/Action/primary' }] }, [node('Label', 'TEXT', { characters: 'Label', componentPropertyReferences: { characters: 'Label#1:0' } })]),
    node('Size=lg', 'COMPONENT', { layoutMode: 'HORIZONTAL', paddingLeft: 16, paddingRight: 16, fills: [{ type: 'SOLID', variable: 'Colour/Action/primary' }] }, [node('Label', 'TEXT', { characters: 'Label', componentPropertyReferences: { characters: 'Label#1:0' } })]),
  ],
};
const write = (dir, folder, spec, { contractOf = (s) => contract.derive(s, [s.name], {}) } = {}) => {
  fs.mkdirSync(path.join(dir, folder), { recursive: true });
  fs.writeFileSync(path.join(dir, folder, 'figma.json'), JSON.stringify(spec, null, 2));
  const c = contractOf(spec);
  if (c) fs.writeFileSync(path.join(dir, folder, 'contract.json'), JSON.stringify(c, null, 2));
};
const folder = (name) => { const d = path.join(root, name); fs.mkdirSync(d); return d; };

const good = folder('good');
write(good, 'button', compact(button));
const clean = checkSpecs(good);
ok('a spec stored as the store stores it, with its contract, is clean', clean.specs === 1 && clean.variants === 2 && clean.bad.length === 0, JSON.stringify(clean.bad));

const full = folder('full');
write(full, 'button', button);
ok('a spec stored in full, not as a default and deltas, is named', checkSpecs(full).bad.some((b) => /stored in full/.test(b)));

const stale = folder('stale');
write(stale, 'button', compact(button), { contractOf: (s) => ({ ...contract.derive(s, [s.name], {}), name: 'Old name' }) });
ok('a contract that is not what its spec derives is named', checkSpecs(stale).bad.some((b) => /contract\.json is not what the spec derives/.test(b)));

const none = folder('none');
write(none, 'button', compact(button), { contractOf: () => null });
ok('a spec with no contract beside it is named', checkSpecs(none).bad.some((b) => /no contract\.json beside the spec/.test(b)));

const broken = folder('broken');
const c = compact(button);
c.variants[0].delta = { ...c.variants[0].delta, layoutMode: 'HORIZONTAL' };   // a delta repeating the default: it resolves, and the writer never writes it
write(broken, 'button', c, { contractOf: () => null });
const b = checkSpecs(broken).bad;
ok('a spec the writer would not have written (its round trip differs) is named', b.some((x) => /does not reproduce the file|second round trip/.test(x)), JSON.stringify(b));

// the command: nothing to check is a failure, never "0 specs" and a pass
const cli = (dir) => spawnSync(process.execPath, [path.join(__dirname, 'check-specs.cjs'), dir], { encoding: 'utf8' });
ok('the command passes a clean folder and says how much it read', cli(good).status === 0 && /^1 specs, 2 variants/.test(cli(good).stdout));
ok('the command fails a folder with a defect', cli(full).status === 1);
const empty = folder('empty');
const e = cli(empty);
ok('the command fails a folder that holds no spec: nothing checked is not clean', e.status === 1 && /no spec/.test(e.stdout + e.stderr), e.stdout + e.stderr);
ok('…and a folder that is not there', cli(path.join(root, 'nowhere')).status === 1);
console.log(`${n}/${n} passed`);
