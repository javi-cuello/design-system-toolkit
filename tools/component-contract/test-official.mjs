#!/usr/bin/env node
// tools/component-contract/official.mjs: which contract is official, the switch both ways, and what Figma is behind on.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'official-'));
const home = path.join(root, 'acme', 'figma-design-system');
const comps = path.join(home, 'snapshot', 'components');
const KEY = 'a'.repeat(40), KEY2 = 'b'.repeat(40);
const chip = { contract: 1, component: 'Chip', figma: { name: 'Chip', key: KEY, id: '1:1' }, props: { size: { type: 'enum', values: ['md', 'sm'], default: 'md', figma: 'Size' } }, anatomy: { root: { kind: 'container', fill: 'Surface/raised' } }, variants: [] };
const put = (folder, c) => { fs.mkdirSync(path.join(comps, folder), { recursive: true }); fs.writeFileSync(path.join(comps, folder, 'contract.json'), JSON.stringify(c)); };
put('chip', chip);
const doc = path.join(home, 'design-system-context.md');
fs.writeFileSync(doc, '# acme\n\n```json snapshot-routing\n' + JSON.stringify({ files: { library: [{ key: 'KEYA', id: 'IDA', roles: ['components', 'tokens'] }] } }) + '\n```\n\n```json audit-settings\n' + JSON.stringify({ libraries: { KEYA: { name: 'Acme' } } }, null, 2) + '\n```\n');
const before = process.env.TOOLKIT_PROJECTS_ROOT;
process.env.TOOLKIT_PROJECTS_ROOT = root;
try {
  const { officials, behind, contracts, switchTo, figmaBrief, differences } = await import('./official.mjs');
  const where = () => createRequire(import.meta.url)('../snapshot/projects.cjs').layout(null, 'acme');

  ok('Figma is the source by default: the official contract is its reading, and Figma is behind on nothing',
    officials(where()).source === 'figma' && officials(where()).of(chip) === chip && behind(where()).length === 0);

  switchTo('acme', 'contract');
  const o = officials(where());
  ok('switching to the contract writes each reading as its official file, by its component key, and says so in the settings',
    o.source === 'contract' && fs.existsSync(path.join(home, 'contracts', `${KEY}.json`)) && /"source": "contract"/.test(fs.readFileSync(doc, 'utf8')));

  // the official contract changed (the editor's save), Figma not yet
  const official = { ...chip, props: { size: { ...chip.props.size, default: 'sm' } } };
  fs.writeFileSync(o.fileOf(KEY), JSON.stringify(official));
  ok('the official file is what every reader gets, never the reading', contracts(where())[0].contract.props.size.default === 'sm');
  const late = behind(where());
  ok('Figma is behind where its reading differs, and the brief names the value to change and what Figma has',
    late.length === 1 && late[0].kind === 'changed' && /props\.size\.default: sm \(Figma has md\)/.test(figmaBrief(late[0])));

  put('chip', { ...official, figma: { ...chip.figma, id: '9:9' } });
  ok('a component Figma moved to another node is not behind on that alone, and readers get its node now',
    !behind(where()).length && contracts(where())[0].contract.figma.id === '9:9');
  put('chip', chip);
  // a snapshot renames the component in Figma: its key stays, so its official contract is still found
  put('chip', { ...chip, component: 'Tag', figma: { ...chip.figma, name: 'Tag' } });
  ok('a component renamed in Figma keeps its official contract, by its key', contracts(where())[0].contract.component === 'Chip'
    && differences(official, { ...chip, component: 'Tag' }).some((d) => d.at === 'component'));

  put('badge', { ...chip, component: 'Badge', figma: { name: 'Badge', key: KEY2, id: '2:2' } });
  fs.rmSync(path.join(comps, 'chip'), { recursive: true });
  const kinds = behind(where()).map((d) => `${d.kind}:${d.component}`).sort();
  ok('a component new in Figma, and one Figma no longer has, are each said', kinds.join() === 'gone:Chip,new:Badge');

  const refused = switchTo('acme', 'figma');
  ok('switching back is refused while Figma is behind, naming what would be lost', refused.refused && /Badge/.test(refused.said) && fs.existsSync(o.dir));
  switchTo('acme', 'figma', { confirm: true });
  ok('confirmed, it drops the official files and the setting', !fs.existsSync(o.dir) && !/"source"/.test(fs.readFileSync(doc, 'utf8')) && officials(where()).source === 'figma');
} finally {
  if (before === undefined) delete process.env.TOOLKIT_PROJECTS_ROOT; else process.env.TOOLKIT_PROJECTS_ROOT = before;
  fs.rmSync(root, { recursive: true, force: true });
}
console.log(`${n} passed`);
