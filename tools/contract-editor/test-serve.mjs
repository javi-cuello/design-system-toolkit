// node tools/contract-editor/test-serve.mjs — the server opens a snapshot folder no project registers, read where the store says.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok  ' + name); };
const contract = (component) => JSON.stringify({ component, props: { size: { type: 'enum', values: ['sm', 'md'], default: 'md' } } });

// a bare snapshot folder, in the canonical layout, and a repo that moves its components elsewhere
const dir = mkdtempSync(join(tmpdir(), 'contract-editor-serve-'));
const bare = join(dir, 'kit');
mkdirSync(join(bare, 'components', 'tag'), { recursive: true });
writeFileSync(join(bare, 'components', 'tag', 'contract.json'), contract('Tag'));
writeFileSync(join(bare, 'tokens.json'), JSON.stringify({ collections: [] }));
// a preview the snapshot drew of it, light and dark
mkdirSync(join(bare, 'previews'));
writeFileSync(join(bare, 'previews', 'tag.png'), 'light');
writeFileSync(join(bare, 'previews', 'tag.dark.png'), 'dark');
const stranger = join(dir, 'home');
mkdirSync(stranger);
const repo = join(dir, 'repo');
mkdirSync(join(repo, 'design', 'parts', 'chip'), { recursive: true });
writeFileSync(join(repo, 'design', 'parts', 'chip', 'contract.json'), contract('Chip'));
writeFileSync(join(repo, 'snapshot.config.json'), JSON.stringify({ toolkit: '~/Projects/toolkit', project: 'sample', paths: { components: 'design/parts' } })); // machine-path: the config's text, never read as a path here

// a registered project whose library takes the contract as its source: its official Chip says sm, Figma's reading md
const KEY = 'a'.repeat(40);
const home = join(dir, 'projects', 'acme', 'figma-design-system');
const chip = (dflt) => ({ contract: 1, component: 'Chip', figma: { name: 'Chip', key: KEY, id: '1:1' }, props: { size: { type: 'enum', values: ['sm', 'md'], default: dflt } }, anatomy: { root: { kind: 'container' } }, variants: [] });
mkdirSync(join(home, 'snapshot', 'components', 'chip'), { recursive: true });
mkdirSync(join(home, 'contracts'));
writeFileSync(join(home, 'snapshot', 'components', 'chip', 'contract.json'), JSON.stringify(chip('md')));
writeFileSync(join(home, 'contracts', `${KEY}.json`), JSON.stringify(chip('sm')));
// and one Figma no longer has, redrawn there under a new key with the same name
writeFileSync(join(home, 'contracts', `${'b'.repeat(40)}.json`), JSON.stringify({ ...chip('md'), component: 'Gone', figma: { name: 'Gone', key: 'b'.repeat(40), id: '2:2' } }));
mkdirSync(join(home, 'snapshot', 'components', 'gone'));
writeFileSync(join(home, 'snapshot', 'components', 'gone', 'contract.json'), JSON.stringify({ ...chip('md'), component: 'Gone', figma: { name: 'Gone', key: 'c'.repeat(40), id: '3:3' } }));
writeFileSync(join(home, 'design-system-context.md'), '# acme\n\n```json snapshot-routing\n' + JSON.stringify({ files: { library: [{ key: 'KEYA', id: 'IDA', roles: ['components', 'tokens'] }] } }) + '\n```\n\n```json audit-settings\n' + JSON.stringify({ libraries: { KEYA: { source: 'contract' } } }) + '\n```\n');

async function serve(at, fn, args = ['--snapshot', at], env = {}) {
  const server = spawn(process.execPath, [fileURLToPath(new URL('./serve.mjs', import.meta.url)), '--port', '0', ...args], { stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, TOOLKIT_PROJECTS_ROOT: join(dir, 'projects'), ...env } });
  // however this process ends, the server ends with it: one left running holds the caller's output open, and bin/check waits on it for ever
  process.on('exit', () => server.kill());
  const url = await new Promise((res, rej) => {
    server.stdout.on('data', (d) => { const m = String(d).match(/http:\/\/localhost:\d+/); if (m) res(m[0]); });
    server.on('exit', () => rej(new Error('the server stopped')));
  });
  try { await fn(url); } finally { server.kill(); }
}

try {
  await serve(bare, async (url) => {
    const list = await (await fetch(url + '/projects.json')).json();
    ok('a snapshot folder is listed beside the projects, and a first visit starts on it', list.start === 'snapshot' && list.projects.some((p) => p.label === 'snapshot' && p.name === 'kit'));
    const facts = await (await fetch(url + '/project.json?label=snapshot')).json();
    ok('its contracts are read from its components folder', facts.contracts.map((c) => c.component).join() === 'Tag' && facts.project === 'kit');
    ok('with no project, the house settings apply', Object.keys(facts.settings).length > 0);
    ok('each component\'s preview is listed by its folder', JSON.stringify(facts.previews) === '{"Tag":{"file":"tag","dark":true}}');
    const png = async (q) => { const r = await fetch(url + '/preview.png?label=snapshot&' + q); return [r.status, r.status === 200 ? await r.text() : null]; };
    ok('and served, in the page\'s scheme; a name it did not list, or a path, is not', JSON.stringify([await png('file=tag'), await png('file=tag&dark=1'), (await png('file=other'))[0], (await png('file=..%2Ftokens'))[0]]) === '[[200,"light"],[200,"dark"],404,404]');
    const layers = await fetch(url + '/component-contract/layers.mjs');
    ok('the module that draws a variant is served to the page as script; the folder\'s other files are not', layers.status === 200 && /javascript/.test(layers.headers.get('content-type')) && /export function expand/.test(await layers.text())
      && (await fetch(url + '/component-contract/derive.cjs')).status === 404);
    ok('nothing to draw into or read code from', facts.toFigma === false && facts.hasCode === false);
    const r = await fetch(url + '/sync', { method: 'POST', headers: { origin: url }, body: JSON.stringify({ action: 'push-figma', label: 'snapshot', contract: { component: 'Tag' }, into: 'abcdefghij12' }) });
    ok('Push to Figma is refused for it', r.status === 400 && /--project/.test((await r.json()).output));
    const t = await fetch(url + '/sync', { method: 'POST', headers: { origin: url }, body: JSON.stringify({ action: 'settings', label: 'snapshot', scratch: 'abcdefghij12' }) });
    ok('and so are settings: a snapshot folder has no context document to keep them', t.status === 400);
  });
  await serve(repo, async (url) => {
    const facts = await (await fetch(url + '/project.json?label=snapshot')).json();
    ok('a repo is read where its snapshot.config.json says, and named by its project', facts.contracts.map((c) => c.component).join() === 'Chip' && facts.project === 'sample');
  });
  await serve(null, async (url) => {
    const facts = await (await fetch(url + '/project.json?label=acme')).json();
    const sync = async (body) => { const r = await fetch(url + '/sync', { method: 'POST', headers: { origin: url }, body: JSON.stringify({ label: 'acme', ...body }) }); return { status: r.status, ...(await r.json()) }; };
    ok('where the contract is the source, the official contracts are served, and what Figma is behind on with its brief',
      facts.source === 'contract' && facts.contracts.find((c) => c.component === 'Chip').props.size.default === 'sm'
      && facts.behind.map((d) => d.kind).sort().join() === 'changed,gone,new' && /props\.size\.default: sm \(Figma has md\)/.test(facts.behind.find((d) => d.kind === 'changed').brief));
    ok('a draft made from an official contract that changed since is refused', (await sync({ action: 'save-official', base: chip('md'), contract: chip('md') })).status === 409);
    const saved = await sync({ action: 'save-official', base: chip('sm'), contract: { ...chip('sm'), props: { size: { type: 'enum', values: ['sm', 'md', 'lg'], default: 'sm' } } } });
    ok('a linked draft is saved as the official contract, its Figma identity kept', saved.ok && saved.facts.contracts.find((c) => c.component === 'Chip').props.size.values.length === 3
      && saved.facts.contracts.find((c) => c.component === 'Chip').figma.key === KEY);
    const took = await sync({ action: 'take-figma', component: 'Chip', key: KEY });
    ok("taking Figma's version makes it official, and Figma is no longer behind on it", took.ok && took.facts.contracts.find((c) => c.component === 'Chip').props.size.default === 'md' && !took.facts.behind.some((d) => d.component === 'Chip'));
    const dropped = await sync({ action: 'drop-official', component: 'Gone', key: 'b'.repeat(40) });
    ok('the official contract of a component Figma no longer has is dropped by its key, beside the one of its name Figma has now',
      dropped.ok && dropped.facts.behind.map((d) => d.kind).join() === 'new' && dropped.facts.contracts.filter((c) => c.component === 'Gone').length === 1);
    ok('a file already gone is not said to be dropped', !(await sync({ action: 'drop-official', component: 'Gone', key: 'b'.repeat(40) })).ok);
  }, ['--project', 'acme']);
  await serve(null, async (url) => {
    const sync = async (body) => { const r = await fetch(url + '/sync', { method: 'POST', headers: { origin: url }, body: JSON.stringify({ label: '', ...body }) }); return { status: r.status, ...(await r.json()) }; };
    ok('started on no project, it serves none', (await (await fetch(url + '/projects.json')).json()).projects.length === 0);
    ok('a project is not made for a file another project claims', /acme already claims/.test((await sync({ action: 'create', project: 'newco', library: 'OTHERKEY0123456', id: 'IDA' })).output));
    const made = await sync({ action: 'create', project: 'newco', library: 'NEWKEY0123456789', id: 'fnewco01' });
    const list = await (await fetch(url + '/projects.json')).json();
    ok('a project made from it is served from then on, its settings in its own context document',
      made.ok && list.start === 'newco' && list.projects.some((p) => p.label === 'newco') && (await (await fetch(url + '/project.json?label=newco')).json()).settingsDoc === true);
    const scratch = await sync({ label: 'newco', action: 'settings', scratch: 'abcdefghij12' });
    ok('and its settings are saved there', scratch.ok && scratch.facts.scratch === 'abcdefghij12');
    // a local repo connected as its code repo, shown dry first, then a draft's stylesheet written into it
    const code = join(dir, 'newco-code');
    mkdirSync(code);
    execFileSync('git', ['-C', code, 'init', '-q']);
    const dry = await sync({ label: 'newco', action: 'connect-repo', repo: code });
    ok('connecting a repo shows what init would write, and writes nothing', dry.ok && /would write/.test(dry.output) && !existsSync(join(code, 'snapshot.config.json')));
    ok('a repo another project names is refused', /sample's repo already/.test((await sync({ label: 'newco', action: 'connect-repo', repo, confirm: true })).output));
    const odd = join(dir, 'newco-odd');
    mkdirSync(odd);
    execFileSync('git', ['-C', odd, 'init', '-q']);
    writeFileSync(join(odd, 'snapshot.config.json'), JSON.stringify({ paths: {} }));
    ok('a repo whose config every tool would refuse is refused before init routes to it', /names no "toolkit" and "project"/.test((await sync({ label: 'newco', action: 'connect-repo', repo: odd, confirm: true })).output));
    const joined = await sync({ label: 'newco', action: 'connect-repo', repo: code, confirm: true });
    ok('a project with a code repo is not given a second', /code repo is .* already/.test((await sync({ label: 'newco', action: 'connect-repo', repo: odd })).output));
    ok('confirmed, the repo is the project\'s code repo', joined.ok && joined.facts.code && joined.facts.code.styles === null);
    ok('and its config finds the toolkit where this checkout is, not under a home it assumed', JSON.parse(readFileSync(join(code, 'snapshot.config.json'), 'utf8')).toolkit === fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, ''));
    ok('a styles folder outside the repo, absolute, or in a hidden one, is refused', !(await sync({ label: 'newco', action: 'settings', styles: '../out' })).ok && !(await sync({ label: 'newco', action: 'settings', styles: '.git/x' })).ok && !(await sync({ label: 'newco', action: 'settings', styles: '/tmp/x' })).ok);
    const both = await sync({ label: 'newco', action: 'settings', scratch: 'zzzzzzzzzz12', prefix: 'BAD' });
    ok('a refused field leaves the others unwritten', !both.ok && (await (await fetch(url + '/project.json?label=newco')).json()).scratch === 'abcdefghij12');
    const set = await sync({ label: 'newco', action: 'settings', styles: 'src/styles/components', prefix: 'nc-' });
    ok('its styles folder and class prefix are kept in the repo\'s config', set.ok && set.facts.code.styles === 'src/styles/components' && set.facts.code.prefix === 'nc-');
    const fresh = { component: 'Fresh Tag', props: {}, anatomy: { root: { kind: 'container', order: 0, layout: { direction: 'row', gap: 4 } } }, variants: [] };
    const pushed = await sync({ label: 'newco', action: 'push-code', contract: fresh });
    ok('Push to code writes the draft\'s stylesheet there, in its naming', pushed.ok && /\.nc-fresh-tag/.test(readFileSync(join(code, 'src', 'styles', 'components', 'fresh-tag.css'), 'utf8')), pushed.output);
    ok('and no markup while the repo names no framework', !existsSync(join(code, 'figma-design-system', 'snapshot', 'components', 'fresh-tag', 'fresh-tag.tsx')));
    ok('a framework that is not one to-markup writes is refused', !(await sync({ label: 'newco', action: 'settings', framework: 'vue' })).ok);
    ok('the framework is kept in the repo\'s config', (await sync({ label: 'newco', action: 'settings', framework: 'react' })).facts.code.framework === 'react');
    const built = await sync({ label: 'newco', action: 'push-code', contract: fresh });
    const tsx = join(code, 'figma-design-system', 'snapshot', 'components', 'fresh-tag', 'fresh-tag.tsx');
    ok('with one, Push to code writes the component, its parity mapping and its story beside its spec', built.ok && existsSync(tsx) && /className=\{cx\("nc-fresh-tag", className\)\}/.test(readFileSync(tsx, 'utf8')) && existsSync(join(code, 'figma-design-system', 'snapshot', 'components', 'fresh-tag', 'parity.mjs')), built.output);
    const cfg = () => JSON.parse(readFileSync(join(code, 'snapshot.config.json'), 'utf8'));
    ok('React keeps the class naming, its part separator included', cfg().styles.naming.kind === 'class' && cfg().styles.naming.part === '__');
    const was = (await (await fetch(url + '/project.json?label=newco')).json()).scratch;
    const noHyphen = await sync({ label: 'newco', action: 'settings', framework: 'web-components', prefix: 'nc', scratch: 'yyyyyyyyyy12' });
    ok('web components with a prefix a custom element\'s name cannot take is refused, saying why, and nothing is saved, the scratch file asked for with it neither', !noHyphen.ok && /hyphen/.test(noHyphen.output) && cfg().framework === 'react' && (await (await fetch(url + '/project.json?label=newco')).json()).scratch === was);
    const wc = await sync({ label: 'newco', action: 'settings', framework: 'web-components', prefix: 'my-ds-' });
    ok('web components take element naming under the prefix given, a two-word one too, never one swapped in unsaid', wc.ok && cfg().styles.naming.kind === 'element' && cfg().styles.naming.prefix === 'my-ds-');
    const cleared = await sync({ label: 'newco', action: 'settings', framework: '', prefix: 'ds' });
    ok('with the framework cleared, element naming still refuses a prefix with no hyphen', !cleared.ok && /hyphen/.test(cleared.output) && cfg().framework === 'web-components');
    ok('a prefix saved later that the framework cannot carry is refused too', !(await sync({ label: 'newco', action: 'settings', prefix: '' })).ok && cfg().styles.naming.prefix === 'my-ds-');
    const wcPushed = await sync({ label: 'newco', action: 'push-code', contract: { ...fresh, component: 'Fresh Chip' } });
    ok('Push to code then writes the web component and the one helper it builds with', wcPushed.ok && existsSync(join(code, 'figma-design-system', 'snapshot', 'components', 'fresh-chip', 'fresh-chip.js')) && existsSync(join(code, 'figma-design-system', 'snapshot', 'components', 'dom.js')), wcPushed.output);
    ok('back to React, the part separator it had is there again', (await sync({ label: 'newco', action: 'settings', framework: 'react' })).ok && cfg().styles.naming.kind === 'class' && cfg().styles.naming.part === '__');
    ok('and no second project is made by the same server', /serves newco/.test((await sync({ action: 'create', project: 'other', library: 'OTHERKEY0123456', id: 'fother01' })).output));
  // a stranger's machine: an empty home, so nothing from create to Push to code reads ours (no ~/Projects, no key, no label)
  }, ['--no-router'], { HOME: stranger, TOOLKIT_UNCLAIMED: join(dir, 'none') });
  // a library snapshot the router kept for a file no project claims: a project made of it, by a name alone, has it
  const keptDir = join(dir, 'kept');
  // this user's alone, as the router makes it: one another may write into is read as empty
  mkdirSync(keptDir, { mode: 0o700 });
  writeFileSync(join(keptDir, 'K7M2QX.meta.json'), JSON.stringify({ id: 'fkept01', key: 'KEPTKEY0123456', name: 'Kit library' }));
  writeFileSync(join(keptDir, 'K7M2QX.json'), JSON.stringify({ tokens: { _meta: { file: 'Kit library', fileId: 'fkept01', fileKey: 'KEPTKEY0123456', snapshot: '2026-10-30' }, collections: { Base: { modes: ['Mode 1'], values: { 'Mode 1': { 'Spacing/4': 4 } }, alias: {} } }, textStyles: [], paintStyles: [], effects: [] }, components: [], icons: [], iconSets: [] }));
  await serve(null, async (url) => {
    const sync = async (body) => { const r = await fetch(url + '/sync', { method: 'POST', headers: { origin: url }, body: JSON.stringify({ label: '', ...body }) }); return { status: r.status, ...(await r.json()) }; };
    const list = await (await fetch(url + '/projects.json')).json();
    ok('started on no project, it says a snapshot is kept, and nothing of it', list.kept === true && !JSON.stringify(list).includes('K7M2QX') && !JSON.stringify(list).includes('fkept01'));
    ok('a project is made of a kept snapshot only by its code', /No snapshot is kept under that code/.test((await sync({ action: 'create', project: 'kit', code: 'AAAAAA', library: 'KEPTKEY0123456' })).output));
    ok('a kept snapshot is taken only for the library the person names', /came from another file/.test((await sync({ action: 'create', project: 'kit', code: 'K7M2QX', library: 'OTHERKEY0123456' })).output));
    chmodSync(keptDir, 0o755);
    ok('a folder of kept snapshots others may read is read as holding none', (await (await fetch(url + '/projects.json')).json()).kept === false);
    chmodSync(keptDir, 0o700);
    const made = await sync({ action: 'create', project: 'kit', code: 'k7m2qx', library: 'KEPTKEY0123456' });
    ok('a project made of one, by a name, its address and the code, has the snapshot written into it, and it is kept no longer', made.ok && /with its library/.test(made.output) && existsSync(join(dir, 'projects', 'kit', 'figma-design-system', 'snapshot', 'tokens.json')) && !existsSync(join(keptDir, 'K7M2QX.json')) && !existsSync(join(keptDir, 'K7M2QX.meta.json')), made.output);
  }, ['--no-router'], { HOME: stranger, TOOLKIT_UNCLAIMED: keptDir });
  // a port something already holds: said, with the way round it, not a stack
  {
    const { createServer } = await import('node:net');
    const held = createServer().listen(0, '127.0.0.1');
    await new Promise((r) => held.once('listening', r));
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, [fileURLToPath(new URL('./serve.mjs', import.meta.url)), '--port', String(held.address().port), '--no-router'], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: join(dir, 'projects') }, timeout: 20000 });
    held.close();
    ok('a taken port is said with --port, not thrown', r.status === 1 && /already in use: .*--port <n>/.test(r.stderr) && !/at Server/.test(r.stderr), r.stderr);
  }
} finally { rmSync(dir, { recursive: true, force: true }); }
console.log(`\n${n} ok`);
