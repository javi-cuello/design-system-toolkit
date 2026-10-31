#!/usr/bin/env node
// session.mjs: the story build's cache key is a content hash of its inputs —
// a changed byte rebuilds, a touched file does not. Run by bin/check.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inputsHash, scratch, lockfiles } from './session.mjs';

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-inputs-'));
fs.mkdirSync(path.join(repo, 'src/a'), { recursive: true });
fs.writeFileSync(path.join(repo, 'src/a/one.css'), '.a { color: red }');
fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"x"}');
fs.mkdirSync(path.join(repo, 'src/node_modules/dep'), { recursive: true });
fs.writeFileSync(path.join(repo, 'src/node_modules/dep/index.js'), 'ignored');
const inputs = ['src', 'package.json'];
const first = inputsHash(repo, inputs);
assert.equal(first.length, 16, 'a short digest');
const then = new Date(Date.now() + 86400000);
fs.utimesSync(path.join(repo, 'src/a/one.css'), then, then);
assert.equal(inputsHash(repo, inputs), first, 'a touched file reuses the build: the key is content, never a timestamp');
fs.writeFileSync(path.join(repo, 'src/a/one.css'), '.a { color: blue }');
assert.notEqual(inputsHash(repo, inputs), first, 'a changed byte rebuilds');
const changed = inputsHash(repo, inputs);
fs.writeFileSync(path.join(repo, 'src/node_modules/dep/index.js'), 'still ignored, changed');
assert.equal(inputsHash(repo, inputs), changed, 'node_modules under an input is not an input');
fs.renameSync(path.join(repo, 'src/a/one.css'), path.join(repo, 'src/a/two.css'));
assert.notEqual(inputsHash(repo, inputs), changed, 'a file moved is a change: the path is hashed with the bytes');
assert.equal(inputsHash(repo, ['missing']), inputsHash(repo, []), 'an input that does not exist hashes as nothing');
const before = inputsHash(repo, ['.']);
fs.mkdirSync(path.join(repo, '.git'));
fs.writeFileSync(path.join(repo, '.git/HEAD'), 'ref: refs/heads/main');
assert.equal(inputsHash(repo, ['.']), before, 'the whole repo as an input leaves out its .git: a commit is not a change to the build');
fs.mkdirSync(path.join(repo, 'web'));
fs.writeFileSync(path.join(repo, 'web/pnpm-lock.yaml'), 'x');
assert.deepEqual(lockfiles(repo, path.join(repo, 'web')).dirs, [path.join(repo, 'web')], 'a build folder with its own lockfile is installed there, not at the root');
fs.writeFileSync(path.join(repo, 'package-lock.json'), 'y');
assert.deepEqual(lockfiles(repo, path.join(repo, 'web')).dirs, [repo, path.join(repo, 'web')], 'with a lockfile at the root too, each is installed where it is');
assert.deepEqual(lockfiles(repo, repo).dirs, [repo], 'a build at the root installs once');
fs.rmSync(repo, { recursive: true, force: true });
assert.notEqual(scratch('site', '/a/site', 'build'), scratch('site', '/tmp/eval-x/site', 'build'), 'an eval copy and its original never share a build folder');
assert.equal(scratch('site', '/a/site', 'build'), scratch('site', '/a/site', 'build'));
console.log('test-session: 12 assertions passed');
