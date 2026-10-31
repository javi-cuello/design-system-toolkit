#!/usr/bin/env node
// sass-entry: the Sass entry's components list, generated from the component folders, on the scaffold's own entry and
// on a copy of it whose folders change.
// Run: node --test skills/frontend-build/tests/test-sass-entry.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generate, withList, componentsIn, BEGIN, END } from '../scripts/sass-entry.mjs';

const SCRIPT = fileURLToPath(new URL('../scripts/sass-entry.mjs', import.meta.url));
const SCAFFOLD = fileURLToPath(new URL('../assets/design-system-scaffold/design-system', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
const copy = () => { const dir = mkdtempSync(join(tmpdir(), 'sass-entry-')); cpSync(SCAFFOLD, dir, { recursive: true }); return dir; };
const outside = (text) => text.replace(new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');

test('the scaffold\'s own entry is what its folders generate', () => {
  const file = join(SCAFFOLD, 'index.sass');
  assert.equal(generate(file), readFileSync(file, 'utf8'));
  assert.equal(run(file, '--check').status, 0);
});

test('a folder added is stale to --check, which writes nothing; a write lists it in name order, the rest untouched', () => {
  const dir = copy();
  try {
    const file = join(dir, 'index.sass'), before = readFileSync(file, 'utf8');
    mkdirSync(join(dir, 'components', 'avatar'));
    writeFileSync(join(dir, 'components', 'avatar', '_avatar.sass'), 'x\n  y: z\n');
    const stale = run(file, '--check');
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /never edited by hand/);
    assert.equal(readFileSync(file, 'utf8'), before, 'a check never writes over what it checks');
    assert.equal(run(file).status, 0);
    const after = readFileSync(file, 'utf8');
    assert.match(after, /  @include meta\.load-css\("components\/avatar\/avatar"\)\n  @include meta\.load-css\("components\/button\/button"\)\n/);
    assert.equal(outside(after), outside(before));
    assert.equal(run(file, '--check').status, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a folder with no partial of its own is not a component; a folder removed leaves the list', () => {
  const dir = copy();
  try {
    const file = join(dir, 'index.sass');
    mkdirSync(join(dir, 'components', 'icons'));
    writeFileSync(join(dir, 'components', 'icons', 'star.svg'), '<svg/>');
    writeFileSync(join(dir, 'components', 'notes.md'), 'not a folder');
    assert.deepEqual(componentsIn(join(dir, 'components')), ['button']);
    rmSync(join(dir, 'components', 'button'), { recursive: true });
    run(file);
    assert.doesNotMatch(readFileSync(file, 'utf8'), /load-css\("components\//);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an entry with no markers is refused, naming the two lines to add', () => {
  const dir = copy();
  try {
    const file = join(dir, 'index.sass');
    writeFileSync(file, '@use "sass:meta"\n@layer components\n  @include meta.load-css("components/button/button")\n');
    const r = run(file);
    assert.equal(r.status, 2);
    assert.ok(r.stderr.includes(BEGIN) && r.stderr.includes(END), r.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an SCSS entry takes semicolons, at the markers\' own indentation', () => {
  const text = `@layer components {\n    ${BEGIN}\n    ${END}\n}\n`;
  assert.equal(withList(text, ['badge', 'card'], { scss: true }), `@layer components {\n    ${BEGIN}\n    @include meta.load-css("components/badge/badge");\n    @include meta.load-css("components/card/card");\n    ${END}\n}\n`);
});

// Reviewed 2026-10-30: run through the ~/.claude/skills symlink, the main-module check took the script for an import and did nothing.
test('(negative) run through a symlink, --check still checks', () => {
  const dir = copy();
  try {
    const link = join(dir, 'sass-entry.mjs');
    symlinkSync(SCRIPT, link);
    mkdirSync(join(dir, 'components', 'avatar'));
    writeFileSync(join(dir, 'components', 'avatar', '_avatar.sass'), 'x\n  y: z\n');
    const r = spawnSync(process.execPath, [link, join(dir, 'index.sass'), '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stdout + r.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// Reviewed 2026-10-30: a snapshot.config.json naming a toolkit path that is not there stopped bin/css under set -e.
test('(negative) bin/css with a toolkit path that does not exist warns and compiles; --check still fails', () => {
  const site = mkdtempSync(join(tmpdir(), 'bin-css-'));
  try {
    cpSync(fileURLToPath(new URL('../assets/design-system-scaffold', import.meta.url)), site, { recursive: true });
    writeFileSync(join(site, 'snapshot.config.json'), JSON.stringify({ toolkit: join(site, 'no-toolkit-here') }));
    mkdirSync(join(site, 'node_modules', 'sass'), { recursive: true });
    mkdirSync(join(site, 'stub'));
    writeFileSync(join(site, 'stub', 'npm'), '#!/bin/sh\necho "npm $*"\n', { mode: 0o755 });
    const env = { ...process.env, PATH: join(site, 'stub') + ':' + process.env.PATH };
    const bin = join(site, 'bin', 'css');
    const r = spawnSync(bin, [], { encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /npm run css/);
    assert.match(r.stderr, /no-toolkit-here/);
    assert.equal(spawnSync(bin, ['--check'], { encoding: 'utf8', env }).status, 1);
  } finally { rmSync(site, { recursive: true, force: true }); }
});
