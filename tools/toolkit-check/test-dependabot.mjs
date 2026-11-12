#!/usr/bin/env node
// tools/toolkit-check/review.md, point 13: every folder with a package.json is in .github/dependabot.yml's
// npm directories, as that file's header promises, so no pinned package ages unseen. The review of 2026-11-12
// found tools/tokens and plugins/audit-lite missing from it.
// Run: node tools/toolkit-check/test-dependabot.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const yml = fs.readFileSync(path.join(REPO, '.github/dependabot.yml'), 'utf8');
const listed = new Set([...yml.matchAll(/^\s+-\s+(\/\S*)\s*$/gm)].map((m) => m[1]));
const packages = execFileSync('git', ['-C', REPO, 'ls-files', '*package.json'], { encoding: 'utf8' })
  .split('\n').filter((f) => f && !f.includes('node_modules/')).map((f) => '/' + path.dirname(f));

assert.ok(packages.length > 5, `found only ${packages.length} package.json files; the probe is wrong, not the repo`);
assert.ok(listed.size > 5, `read only ${listed.size} directories from .github/dependabot.yml; the probe is wrong, not the file`);
const missing = packages.filter((d) => !listed.has(d));
assert.deepEqual(missing, [], `.github/dependabot.yml does not list ${missing.join(', ')}; add each under the npm directories`);
const stale = [...listed].filter((d) => d !== '/' && !packages.includes(d));
assert.deepEqual(stale, [], `.github/dependabot.yml lists ${stale.join(', ')}, which holds no package.json`);
console.log(`ok every package.json folder (${packages.length}) is in dependabot.yml`);
