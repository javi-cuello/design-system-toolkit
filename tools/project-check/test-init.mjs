#!/usr/bin/env node
// tools/project-check/init.mjs over a throwaway repo: --dry-run writes nothing,
// the first run writes every file and setting, a second run keeps them all.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const INIT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'init.mjs');
let n = 0;
const ok = (name, cond, out = '') => { n++; assert.ok(cond, `${name}\n${out}`); console.log('ok', name); };
const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'init-')));
const repo = path.join(root, 'demo');
const doc = path.join(repo, 'figma-design-system/design-system-context.md');
fs.mkdirSync(path.dirname(doc), { recursive: true });
fs.writeFileSync(doc, '# Demo\n\n```json snapshot-routing\n{ "files": { "library": { "key": "abc" } } }\n```\n');
const g = (...a) => { try { return execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
g('init', '-q');
const run = (...a) => spawnSync(process.execPath, [INIT, '--repo', repo, ...a], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: root } });
const FILES = ['snapshot.config.json', 'bin/tokens', 'bin/check', '.githooks/pre-push'];
const docBefore = fs.readFileSync(doc, 'utf8');

let r = run('--dry-run');
ok('--dry-run writes nothing and sets nothing', r.status === 0 && FILES.every((f) => !fs.existsSync(path.join(repo, f))) && !g('config', 'core.hooksPath') && fs.readFileSync(doc, 'utf8') === docBefore && /would write\s+bin\/check/.test(r.stdout), r.stdout + r.stderr);

r = run();
const out1 = r.stdout + r.stderr;
ok('the first run writes every file, executable where it runs', r.status === 0 && FILES.every((f) => fs.existsSync(path.join(repo, f))) && ['bin/tokens', 'bin/check', '.githooks/pre-push'].every((f) => fs.statSync(path.join(repo, f)).mode & 0o100), out1);
ok('it sets core.hooksPath', g('config', 'core.hooksPath') === '.githooks');
const cfg = JSON.parse(fs.readFileSync(path.join(repo, 'snapshot.config.json'), 'utf8'));
ok('the config names the project by its folder', cfg.project === 'demo' && cfg.toolkit && cfg.paths.components);
ok('the context document routes snapshots to the repo', /"repo": "/.test(fs.readFileSync(doc, 'utf8')) && /"key": "abc"/.test(fs.readFileSync(doc, 'utf8')), fs.readFileSync(doc, 'utf8'));
ok('the gate plan is shown, with the hook gate green', /a push runs this check\s+ok/.test(out1) && /check\.without/.test(out1), out1);
ok('the parity mapping is left to a person', /design-code-parity/.test(out1), out1);

const before = Object.fromEntries([...FILES, path.relative(repo, doc)].map((f) => [f, fs.readFileSync(path.join(repo, f), 'utf8')]));
fs.writeFileSync(path.join(repo, 'bin/check'), '#!/bin/sh\necho own steps\n');
before['bin/check'] = fs.readFileSync(path.join(repo, 'bin/check'), 'utf8');
r = run();
const out2 = r.stdout + r.stderr;
ok('a second run keeps everything and writes nothing', r.status === 0 && Object.entries(before).every(([f, s]) => fs.readFileSync(path.join(repo, f), 'utf8') === s) && !/wrote|routed/.test(out2) && /kept\s+snapshot\.config\.json/.test(out2), out2);
ok('a kept bin/check that skips the gates is reported, not rewritten', /bin\/check: does not run tools\/project-check\/check\.mjs/.test(out2), out2);

// a hooks folder git was given as an absolute path is that folder, not one nested under the repo
const hooksAbs = path.join(root, 'shared-hooks');
g('config', 'core.hooksPath', hooksAbs);
r = run();
ok('an absolute core.hooksPath is used as given', r.status === 0 && fs.existsSync(path.join(hooksAbs, 'pre-push')) && !fs.existsSync(path.join(repo, hooksAbs)), r.stdout + r.stderr);

// a repo kept apart from its project's home is connected by naming the project
const apart = path.join(root, 'elsewhere');
fs.mkdirSync(apart);
execFileSync('git', ['-C', apart, 'init', '-q']);
r = spawnSync(process.execPath, [INIT, '--repo', apart, '--project', 'demo'], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: root } });
ok('a repo apart from its home is the project it names', r.status === 0 && JSON.parse(fs.readFileSync(path.join(apart, 'snapshot.config.json'), 'utf8')).project === 'demo', r.stdout + r.stderr);

fs.rmSync(root, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
