#!/usr/bin/env node
// node tools/parity/test-watch.mjs — the code audit's watcher re-runs on what the audit builds from and
// nothing else: a change to the code or the mappings starts one run, a change during a run queues exactly one
// more, and the audit's own output (storybook-static, a build, installed packages) starts none — else the audit
// would loop on what it writes. Over a temp folder, with a stand-in for external.mjs that counts its runs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-watch-'));
// removed however the run ends, a failed check included; the watcher and its run stopped first
let stop = () => {};
process.on('exit', () => { stop(); fs.rmSync(tmp, { recursive: true, force: true }); });
process.env.TOOLKIT_PROJECTS_ROOT = path.join(tmp, 'projects'); // projects-path: a fixture tree, no real project
const { watchCodeAudit, IGNORED } = await import('./watch.mjs');

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('the audit\'s own output and installed packages are ignored',
  ['storybook-static/index.html', 'src/storybook-static/a.js', 'node_modules/x/y.js', 'dist/a.css', '.turbo/log', '.cache/x'].every((f) => IGNORED.test(f)));
ok('what the audit builds from is not', ['src/button.tsx', 'stories/static.js', 'distance/a.js', 'my-dist/a.js'].every((f) => !IGNORED.test(f)));

// a project home with a mappings file, and a code repo with a component folder and a Storybook input
const label = 'p';
const home = path.join(process.env.TOOLKIT_PROJECTS_ROOT, label, 'figma-design-system');
fs.mkdirSync(path.join(home, 'parity'), { recursive: true });
const mapFile = path.join(home, 'parity', 'components.json');
fs.writeFileSync(mapFile, '{}');
const repo = path.join(tmp, 'repo');
for (const d of ['src', 'src/storybook-static', 'src/node_modules', 'stories']) fs.mkdirSync(path.join(repo, d), { recursive: true });
const context = { libraries: { k: { code: { repo, components: 'src', parity: { mappings: { components: { json: 'parity/components.json' } }, host: { build: { inputs: ['stories'] } } } } } } };

// the stand-in: one line per run, then holds the run open for HOLD ms
const runs = path.join(tmp, 'runs.log');
const fake = path.join(tmp, 'fake-external.mjs');
fs.writeFileSync(fake, `import fs from 'node:fs'; fs.appendFileSync(${JSON.stringify(runs)}, process.argv.slice(2).join(' ') + '\\n'); setTimeout(() => console.log('measured'), Number(process.env.HOLD || 0));`);
const count = () => (fs.existsSync(runs) ? fs.readFileSync(runs, 'utf8').trim().split('\n').filter(Boolean).length : 0);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const logs = [];
const until = async (cond, ms = 4000) => { const t = Date.now(); while (!cond() && Date.now() - t < ms) await wait(25); return cond(); };

ok('no mappings file: nothing is watched', watchCodeAudit(label, { libraries: { k: { code: { repo, parity: { mappings: { components: { json: 'parity/none.json' } } } } } } }, () => {}) === null);
ok('no library with code.parity: nothing is watched', watchCodeAudit(label, { libraries: {} }, () => {}) === null);

process.env.HOLD = '0';
const w = watchCodeAudit(label, context, (l) => logs.push(l), { delay: 100, script: fake });
stop = w.close;
ok('it watches the component folder and the Storybook inputs', w.watching.includes(path.join(repo, 'src')) && w.watching.includes(path.join(repo, 'stories')));
ok('it runs once at start, for its project', await until(() => count() === 1 && logs.length === 1) && fs.readFileSync(runs, 'utf8').trim() === `--project ${label}`);
ok('a finished run logs the audit\'s last line', /^measured \(\d+s\)$/.test(logs[0]));
await wait(300); // fs.watch can deliver a late event for the folders made above

const settle = async () => { const before = count(); await wait(600); return count() - before; };
let base = count();
fs.writeFileSync(path.join(repo, 'src', 'storybook-static', 'iframe.html'), 'x');
fs.writeFileSync(path.join(repo, 'src', 'node_modules', 'pkg.js'), 'x');
ok('a write into storybook-static or node_modules starts no run', (await settle()) === 0 && count() === base);

fs.writeFileSync(path.join(home, 'parity', 'other.json'), '{}');
ok('another file beside the mappings starts no run', (await settle()) === 0);

base = count();
fs.writeFileSync(path.join(repo, 'src', 'button.tsx'), 'a');
fs.writeFileSync(path.join(repo, 'src', 'card.tsx'), 'b');
await until(() => count() > base, 3000);
ok('changes to the code within the delay start one run', (await settle()) === 0 && count() === base + 1);

base = count();
fs.writeFileSync(path.join(repo, 'stories', 'button.stories.js'), 'a');
ok('a change to a Storybook input starts a run', await until(() => count() === base + 1, 3000));
await settle();

base = count();
fs.writeFileSync(mapFile, '{"button":{}}');
ok('a change to the mappings starts a run', await until(() => count() === base + 1, 3000));
await settle();

// a run held open: two calls during it queue one more, never two
process.env.HOLD = '800';
base = count();
w.run();
await until(() => count() === base + 1);
w.run(); w.run();
await until(() => count() === base + 2, 4000);
await wait(1200);
ok('calls during a run queue exactly one more', count() === base + 2);
await until(() => logs.length >= 2 && count() === base + 2, 2000);

w.close();
process.env.HOLD = '0';
base = count();
fs.writeFileSync(path.join(repo, 'src', 'button.tsx'), 'c');
ok('closed, a change starts nothing', (await settle()) === 0 && count() === base);

console.log(`${n}/${n} passed`);
