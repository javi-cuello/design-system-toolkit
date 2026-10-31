#!/usr/bin/env node
// tools/project-check/check.mjs: a project on the canonical layout, saying nothing
// in `paths`, is held by the gates that read its stored specs, not skipped
// for want of a setting (2026-10-05: the gate asked for `paths.components`).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-'));
fs.mkdirSync(path.join(repo, 'components/tag'), { recursive: true });
fs.writeFileSync(path.join(repo, 'snapshot.config.json'), '{}');
spawnSync('git', ['-C', repo, 'init', '-q']);
const plan = spawnSync(process.execPath, [path.join(HERE, 'check.mjs'), '--repo', repo, '--plan'], { encoding: 'utf8' }).stdout;
fs.rmSync(repo, { recursive: true, force: true });
assert.match(plan, /component specs resolve and compact to themselves\s+runs/, plan);
console.log('ok a default-layout project\'s stored specs are checked\n1/1 passed');
