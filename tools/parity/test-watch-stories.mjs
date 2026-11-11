#!/usr/bin/env node
// node tools/parity/test-watch-stories.mjs — a project's own Storybook, the one its docs serve, rebuilds
// when a build input changes and for nothing else: a change in an input starts one build, a write into the
// Storybook folder itself (the build's own output) starts none, and a project that states no build is not
// watched. One project's docs served a Storybook seven weeks behind its code (2026-11-11). Over a temp
// project, with a stand-in for the build that counts its runs; buildStories' reuse is test-session's.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-stories-'));
let stop = () => {};
process.on('exit', () => { stop(); fs.rmSync(tmp, { recursive: true, force: true }); });
process.env.TOOLKIT_PROJECTS_ROOT = path.join(tmp, 'projects'); // projects-path: a fixture tree, no real project
const { watchStories } = await import('./watch.mjs');

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const repo = path.join(tmp, 'repo');
for (const d of ['src', 'storybook-static', 'node_modules']) fs.mkdirSync(path.join(repo, d), { recursive: true });
const home = path.join(process.env.TOOLKIT_PROJECTS_ROOT, 'p', 'figma-design-system');
fs.mkdirSync(home, { recursive: true });
const block = (tag, v) => '```json ' + tag + '\n' + JSON.stringify(v, null, 2) + '\n```\n';
fs.writeFileSync(path.join(home, 'design-system-context.md'), '# P\n\n' + block('snapshot-routing', { repo, files: { library: { key: 'PKEY00000000000', id: 'fp', roles: ['components', 'tokens'] } } }));
const config = (build) => fs.writeFileSync(path.join(repo, 'snapshot.config.json'), JSON.stringify({ toolkit: path.resolve('../..'), project: 'p', paths: { storybook: { dir: 'storybook-static' } }, parity: { host: { kind: 'storybook', ...(build && { build }) } } }));

config(null);
ok('a project that states no story build is not watched', watchStories('p', () => {}) === null);

config({ run: 'true {out}', inputs: ['src', 'storybook-static'] });
const runs = path.join(tmp, 'runs.log');
const fake = path.join(tmp, 'fake-build.mjs');
fs.writeFileSync(fake, `import fs from 'node:fs'; fs.appendFileSync(${JSON.stringify(runs)}, process.argv.slice(2).join(' ') + '\\n'); console.log('built');`);
const count = () => (fs.existsSync(runs) ? fs.readFileSync(runs, 'utf8').trim().split('\n').filter(Boolean).length : 0);
const until = async (f, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (f()) return true; await wait(50); } return f(); };

const w = watchStories('p', () => {}, { delay: 200, script: fake });
stop = () => w && w.close();
ok('a project with a story build and a Storybook folder is watched, and built once at start', Boolean(w) && await until(() => count() === 1));
ok('the build is asked for this project\'s stories', fs.readFileSync(runs, 'utf8').includes('--stories p'));

let base = count();
fs.writeFileSync(path.join(repo, 'storybook-static', 'index.json'), '{}');
fs.writeFileSync(path.join(repo, 'node_modules', 'x.js'), 'x');
await wait(700);
ok('a write into the Storybook folder or node_modules starts no build', count() === base);

fs.writeFileSync(path.join(repo, 'src', 'button.tsx'), 'a');
fs.writeFileSync(path.join(repo, 'src', 'card.tsx'), 'b');
ok('changes to an input within the delay start one build', await until(() => count() === base + 1) && (await wait(600), count() === base + 1));

w.close();
base = count();
fs.writeFileSync(path.join(repo, 'src', 'button.tsx'), 'c');
await wait(600);
ok('closed, a change starts nothing', count() === base);
console.log(`${n}/${n} passed`);
