#!/usr/bin/env node
// node tools/docs-site/test-empty-build.mjs — a project with no component specs yet (a tokens snapshot, no
// components library taken) builds, and its Components page says there are none. It crashed the build on
// `componentGroups[0].groups` until 2026-11-01. A made-up project in a temp root, built with DOCS_OUT into the
// run's own folder; skips (77) without the site's packages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
if (!fs.existsSync(path.join(HERE, 'node_modules', 'astro', 'package.json'))) { console.log('skip: no Astro in tools/docs-site (pnpm install --frozen-lockfile there); nothing ran'); process.exit(77); }
let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-empty-'));
process.on('exit', () => fs.rmSync(root, { recursive: true, force: true }));
const home = path.join(root, 'empty', 'figma-design-system');
fs.mkdirSync(path.join(home, 'snapshot'), { recursive: true });
const tokens = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'contract-editor', 'sample', 'tokens.json'), 'utf8'));
for (const t of tokens.textStyles || []) t.bound ||= {};
fs.writeFileSync(path.join(home, 'snapshot', 'tokens.json'), JSON.stringify(tokens));
const block = (tag, v) => '```json ' + tag + '\n' + JSON.stringify(v, null, 2) + '\n```\n';
fs.writeFileSync(path.join(home, 'design-system-context.md'), '# Empty\n\n' + block('snapshot-routing', { files: { library: { key: 'EMPTYKEY0000000', id: 'fempty', roles: ['components', 'tokens'] } } }));
const out = path.join(root, 'site');

const r = spawnSync(process.execPath, [path.join(HERE, 'build.mjs')], { cwd: HERE, encoding: 'utf8', env: { ...process.env, DOCS_PROJECT: 'empty', DOCS_OUT: out, TOOLKIT_PROJECTS_ROOT: root } }); // projects-path: the run's own root
ok('a project with no component specs builds', r.status === 0, `${r.stdout}\n${r.stderr}`.split('\n').filter((l) => /error|Error/.test(l)).slice(0, 8).join('\n'));
const page = fs.readFileSync(path.join(out, 'components', 'index.html'), 'utf8');
ok('its Components page says there are none, with no empty filter', /No components yet/.test(page) && !/Filter 0 components/.test(page));
console.log(`${n}/${n} passed`);
