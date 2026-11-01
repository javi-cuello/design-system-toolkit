#!/usr/bin/env node
// closing.mjs: what the closing pass computes — the user-facing files among a
// change, a repo's unshipped state, cases proven on paper. Run by bin/check.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { facing, repoState, tracedCases, pluginsChanged, stillNamed } from './closing.mjs';

assert.deepEqual(facing(['site/templates/home.php', 'assets/design-system/base/_layout.sass', 'public/fonts/Inter.woff2', 'src/design-system/button/button.scss',
  'tests/parity/screens.json', 'src/design-system/button/button.stories.tsx', 'content/jobs/1.txt', 'tools/parity/run.mjs', 'kirby/src/x.php', 'README.md']),
  ['site/templates/home.php', 'assets/design-system/base/_layout.sass', 'public/fonts/Inter.woff2', 'src/design-system/button/button.scss'],
  'templates, styles and fonts face the user; tests, stories, content, vendored code and docs do not');

// a repo with no upstream, one commit, one uncommitted change
const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'closing-'));
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 'x', GIT_AUTHOR_EMAIL: 'x@x', GIT_COMMITTER_NAME: 'x', GIT_COMMITTER_EMAIL: 'x@x' } });
git('init', '-q'); fs.writeFileSync(path.join(repo, 'a.txt'), '1'); git('add', 'a.txt'); git('commit', '-q', '-m', 'one');
fs.writeFileSync(path.join(repo, 'b.css'), 'x');
fs.writeFileSync(path.join(repo, 'a.txt'), '2'); // a modified tracked file sorts first, its status column a space
const s = repoState(repo);
assert.equal(s.upstream, '', 'no upstream is said as such');
assert.deepEqual(s.dirty.map((l) => l.slice(3)), ['a.txt', 'b.css'], 'uncommitted files are listed by their whole path, the first line included');
assert.deepEqual(tracedCases(repo, []), [], 'no changed cases, nothing traced');
// a file deleted since the upstream that a workflow still names
git('add', '-A'); git('commit', '-q', '-m', 'two');
fs.mkdirSync(path.join(repo, '.github/workflows'), { recursive: true });
fs.writeFileSync(path.join(repo, 'gate.php'), '<?php');
fs.writeFileSync(path.join(repo, '.github/workflows/check.yml'), 'run: php gate.php');
git('add', '-A'); git('commit', '-q', '-m', 'three'); git('branch', 'up');
git('rm', '-q', 'gate.php'); git('commit', '-q', '-m', 'gone');
assert.deepEqual(stillNamed(repo, 'up'), ['gate.php is deleted and still named in .github/workflows/check.yml'], 'a deleted file a workflow still runs is named');
// a deleted folder whose file name others share is searched for by folder
fs.mkdirSync(path.join(repo, 'screens/old'), { recursive: true }); fs.mkdirSync(path.join(repo, 'screens/kept'), { recursive: true });
fs.writeFileSync(path.join(repo, 'screens/old/figma.json'), '{}'); fs.writeFileSync(path.join(repo, 'screens/kept/figma.json'), '{}');
fs.writeFileSync(path.join(repo, 'map.mjs'), "screen: 'kept' // reads figma.json");
git('add', '-A'); git('commit', '-q', '-m', 'four'); git('branch', '-f', 'up');
git('rm', '-q', '-r', 'screens/old'); git('commit', '-q', '-m', 'gone too');
assert.deepEqual(stillNamed(repo, 'up'), [], 'a shared file name ("figma.json") is not a reference to the folder that went');
fs.writeFileSync(path.join(repo, 'map.mjs'), "screen: 'screens/old'"); git('add', '-A'); git('commit', '-q', '-m', 'five');
assert.deepEqual(stillNamed(repo, 'up'), ['screens/old/ is deleted and still named in map.mjs'], 'and the folder still named is');
// one file of a shared name deleted from a folder that lives on is not the folder deleted
fs.writeFileSync(path.join(repo, 'screens/kept/extra.txt'), 'x'); fs.mkdirSync(path.join(repo, 'screens/other'));
fs.writeFileSync(path.join(repo, 'screens/other/figma.json'), '{}');
fs.writeFileSync(path.join(repo, 'map.mjs'), "screen: 'screens/kept'");
git('add', '-A'); git('commit', '-q', '-m', 'six'); git('branch', '-f', 'up');
git('rm', '-q', 'screens/kept/figma.json'); git('commit', '-q', '-m', 'one file');
assert.deepEqual(stillNamed(repo, 'up'), [], 'a folder that keeps files is not said deleted for the shared-name file it lost');
fs.writeFileSync(path.join(repo, 'map.mjs'), "read('screens/kept/figma.json')"); git('add', '-A'); git('commit', '-q', '-m', 'seven');
assert.deepEqual(stillNamed(repo, 'up'), ['screens/kept/figma.json is deleted and still named in map.mjs'], 'and its own path still named is');
fs.rmSync(repo, { recursive: true, force: true });
assert.deepEqual(pluginsChanged(['plugins/design-system-snapshot/code.js', 'plugins/design-system-snapshot/CHANGELOG.md', 'plugins/_shared/ui-base.css', 'tools/x.mjs']), ['design-system-snapshot'], 'a changed plugin is named once; the shared base is not a plugin');
console.log('test-closing: 10 assertions passed');
