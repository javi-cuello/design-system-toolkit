#!/usr/bin/env node
// The standard's checker, proved in both directions on a throwaway repo: a
// conforming repo passes, and each way of breaking the standard is named.
// Needs Style Dictionary somewhere on disk; it borrows the one a registered
// repo installed. Run: node --test test-check.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, existsSync, readFileSync, appendFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const TOOLKIT = join(HERE, '..', '..');
// Any registered repo with style-dictionary installed will do, and which
// repos those are is read from the projects the toolkit knows — this named
// two of the maintainer's own folders, so the suite knew two project names
// and, on any other machine, skipped both its cases and still exited 0.
// `bin/check` prints `ok` for a suite that ran nothing, so the gap was
// invisible; a missing donor is now a failure that says what to install.
const require_ = createRequire(import.meta.url);
const contract = require_('../snapshot/projects.cjs');
const donor = contract.repos()
  .map((r) => join(r.dir, 'node_modules'))
  .find((d) => existsSync(join(d, 'style-dictionary')));

// A donor that is not there is a finding about this suite, not a pass.
if (!donor) {
  console.error('no registered project repo has style-dictionary installed: run `pnpm install` in one of them, or register a repo that has it.');
  process.exit(1);
}

function repo() {
  const root = mkdtempSync(join(tmpdir(), 'standard-'));
  mkdirSync(join(root, 'bin'));
  mkdirSync(join(root, 'design'));
  mkdirSync(join(root, 'styles'));
  symlinkSync(donor, join(root, 'node_modules'));
  writeFileSync(join(root, 'package.json'), '{"name":"fixture","private":true}');
  writeFileSync(join(root, 'snapshot.config.json'), JSON.stringify({ toolkit: TOOLKIT, project: 'fixture', paths: { tokens: 'design/figma.json', styles: 'styles/generated' } }));
  writeFileSync(join(root, 'design/figma.json'), JSON.stringify({
    _meta: { file: 'UI library', fileId: 'x' },
    collections: { Semantic: { modes: ['Light', 'Dark'], values: { Light: { 'Colour/Text/strong': '#161616' }, Dark: { 'Colour/Text/strong': '#f5f5f5' } }, alias: {} } },
    // A text style carries its bindings since plugin 0.24.0; a fixture
    // without them is a snapshot the build refuses, which is what this
    // fixture silently was until bin/check ran every suite.
    textStyles: [{ name: 'Body/md', family: 'Inter', weight: 'Regular', size: 16, lineHeight: 1.5, letterSpacing: 0, bound: {} }],
    paintStyles: [], effects: [],
  }));
  writeFileSync(join(root, 'bin/tokens'), `#!/bin/sh\nexec node "${TOOLKIT}/tools/tokens/build.mjs" --repo "$(dirname "$0")/.." "$@"\n`, { mode: 0o755 });
  writeFileSync(join(root, 'styles/app.scss'), `@use "generated/text-styles" as ts;\np { color: var(--colour-text-strong); @include ts.text-style(body-md); }\n`);
  const build = spawnSync(join(root, 'bin/tokens'), [], { encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr);
  return root;
}
const check = (root) => spawnSync(process.execPath, [join(HERE, 'check.mjs'), '--repo', root], { encoding: 'utf8' });

test('a conforming repo passes, and its tokens are stored as DTCG beside the snapshot', () => {
  const root = repo();
  // a build's own output beside the DTCG files is not the token build's to judge
  mkdirSync(join(root, 'design/dtcg/dist'));
  writeFileSync(join(root, 'design/dtcg/dist/tokens.json'), '{}');
  const r = check(root);
  assert.equal(r.status, 0, r.stderr);
  const manifest = JSON.parse(readFileSync(join(root, 'design/dtcg/manifest.json'), 'utf8'));
  assert.ok(manifest.collections || manifest.files || Object.keys(manifest).length, 'a DTCG manifest');
  assert.ok(existsSync(join(root, 'design/dtcg/semantic/light.json')), 'one file per collection mode');
});

test('the parity engine\'s tolerances are a project fact the config may state', () => {
  const root = repo();
  const c = JSON.parse(readFileSync(join(root, 'snapshot.config.json'), 'utf8'));
  c.parity = { tolerances: { length: 1 } };
  writeFileSync(join(root, 'snapshot.config.json'), JSON.stringify(c));
  const r = check(root);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('each way of breaking the standard is named', () => {
  const cases = [
    ['a hand edit to a generated file', (root) => appendFileSync(join(root, 'styles/generated/_tokens.scss'), ':root { --x: 1px; }\n'), /\[code-standard rule 23\].*differs/],
    ['a hand edit to the stored DTCG', (root) => writeFileSync(join(root, 'design/dtcg/semantic/light.json'), '{}'), /\[code-standard rule 23\].*dtcg\/semantic\/light\.json differs/],
    ['a DTCG file nothing writes any more', (root) => { mkdirSync(join(root, 'design/dtcg/old')); writeFileSync(join(root, 'design/dtcg/old/light.json'), '{}'); }, /\[code-standard rule 23\].*dtcg\/old\/light\.json/],
    ['a project generator', (root) => writeFileSync(join(root, 'bin/tokens'), '#!/bin/sh\nnode bin/my-tokens.js\n'), /\[code-standard rule 51\]/],
    ['a CSS setting in the config', (root) => {
      const c = JSON.parse(readFileSync(join(root, 'snapshot.config.json'), 'utf8'));
      c.css = { baseMode: 'Dark' };
      writeFileSync(join(root, 'snapshot.config.json'), JSON.stringify(c));
    }, /\[code-standard rule 55\].*"css"/],
    ['a token read that nothing defines', (root) => appendFileSync(join(root, 'styles/app.scss'), 'a { color: var(--colour-text-renamed); }\n'), /\[undefined\].*--colour-text-renamed/],
    ['a text style the tokens do not have', (root) => appendFileSync(join(root, 'styles/app.scss'), 'h1 { @include ts.text-style(heading-xl); }\n'), /\[undefined\].*heading-xl/],
  ];
  for (const [what, breakIt, expect] of cases) {
    const root = repo();
    breakIt(root);
    const r = check(root);
    assert.notEqual(r.status, 0, `${what}: the check passed`);
    assert.match(r.stderr, expect, `${what}: ${r.stderr}`);
  }
});
