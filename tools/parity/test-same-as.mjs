#!/usr/bin/env node
// tools/parity/same-as.mjs: a design prop and a code prop paired by a person, written into a compared library's mapping.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'same-as-'));
const home = path.join(root, 'acme', 'figma-design-system');
fs.mkdirSync(path.join(home, 'snapshot', 'components', 'chip'), { recursive: true });
fs.mkdirSync(path.join(home, 'parity'));
fs.writeFileSync(path.join(home, 'snapshot', 'components', 'chip', 'contract.json'), JSON.stringify({ contract: 1, component: 'Chip', figma: { name: 'Chip', key: 'c'.repeat(40) }, props: { size: { type: 'enum', values: ['md'] }, tone: { type: 'enum', values: ['info'] } }, anatomy: {}, variants: [] }));
const mappings = path.join(home, 'parity', 'mappings.json');
fs.writeFileSync(mappings, JSON.stringify({ chip: { storyId: 'chip--playground', props: { tone: { code: 'color', values: { info: 'primary' } } } } }));
const parity = { host: { kind: 'storybook', build: { run: 'build -o {out}', dir: 'apps/sb' } }, tiers: ['Light'], mappings: { components: { json: 'parity/mappings.json' } } };
fs.writeFileSync(path.join(home, 'design-system-context.md'), '# acme\n\n```json snapshot-routing\n' + JSON.stringify({ files: { library: [{ key: 'KEYA', id: 'IDA', roles: ['components', 'tokens'] }] } }) + '\n```\n\n```json audit-settings\n' + JSON.stringify({ libraries: { KEYA: { framework: 'mui', code: { repo: '~/elsewhere', components: 'src', parity } } } }) + '\n```\n');
const before = process.env.TOOLKIT_PROJECTS_ROOT;
process.env.TOOLKIT_PROJECTS_ROOT = root;
try {
  const { sameAs } = await import('./same-as.mjs');
  const r = sameAs('acme', 'chip', 'size', 'scale');
  const m = JSON.parse(fs.readFileSync(mappings, 'utf8')).chip;
  ok('the pair is written into the component\'s mapping, beside what it already held', !r.refused && m.props.size === 'scale' && m.storyId === 'chip--playground');
  sameAs('acme', 'chip', 'tone', 'variant');
  ok('a pair that held values keeps them under the new code prop', JSON.parse(fs.readFileSync(mappings, 'utf8')).chip.props.tone.values.info === 'primary'
    && JSON.parse(fs.readFileSync(mappings, 'utf8')).chip.props.tone.code === 'variant');
  const all = JSON.parse(fs.readFileSync(mappings, 'utf8')); all.chip.props.size = { missing: true }; fs.writeFileSync(mappings, JSON.stringify(all));
  sameAs('acme', 'chip', 'size', 'scale');
  ok('a prop ruled missing from the code is no longer, once paired', JSON.parse(fs.readFileSync(mappings, 'utf8')).chip.props.size === 'scale');
  ok('a design prop the contract does not have is refused, naming those it has', /has no prop shape; it has size, tone/.test(sameAs('acme', 'chip', 'shape', 'x').refused));
  ok('a component with no mapping is refused', /not one of/.test(sameAs('acme', 'badge', 'size', 'x').refused));
} finally {
  if (before === undefined) delete process.env.TOOLKIT_PROJECTS_ROOT; else process.env.TOOLKIT_PROJECTS_ROOT = before;
  fs.rmSync(root, { recursive: true, force: true });
}
console.log(`${n} passed`);
