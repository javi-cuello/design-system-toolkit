#!/usr/bin/env node
// The standard's checker, proved in both directions on a throwaway repo: a
// conforming repo passes, and each way of breaking the standard is named.
// Needs Style Dictionary somewhere on disk; it borrows the one a registered
// repo installed. Run: node --test test-check.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, existsSync, readFileSync, appendFileSync, rmSync } from 'node:fs';
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
// The toolkit's own copy first (tools/tokens/package.json, installed by setup and CI), so the suite runs with no
// project; else one a registered repo installed.
const donor = [join(HERE, 'node_modules'), ...contract.repos().map((r) => join(r.dir, 'node_modules'))]
  .find((d) => existsSync(join(d, 'style-dictionary')));

// A donor that is not there is a finding about this suite, not a pass, on a
// machine with projects. With none registered (a fresh clone, CI) there is
// nothing to borrow: the suite exits 77, which bin/check says as a skip.
if (!donor && !contract.repos().length) {
  // 77: bin/check says a skip, and CI, which installs tools/tokens, fails it
  console.log('skip: style-dictionary is not installed in tools/tokens (`pnpm install` there) and no registered repo has it, so the checker was not run');
  process.exit(77);
}
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
    collections: { Semantic: { modes: ['Light', 'Dark'], values: { Light: { 'Colour/Text/strong': '#202020' }, Dark: { 'Colour/Text/strong': '#ececec' } }, alias: {} } },
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
  const resolver = JSON.parse(readFileSync(join(root, 'design/dtcg/tokens.resolver.json'), 'utf8'));
  assert.equal(resolver.version, '2025.10', 'a DTCG resolver beside the token files');
  assert.ok(existsSync(join(root, 'design/dtcg/semantic/light.json')), 'one file per collection mode');
});

test('web code syntax equal to the built name passes, and an unset one is not a finding', () => {
  const root = repo();
  const f = join(root, 'design/figma.json'), t = JSON.parse(readFileSync(f, 'utf8'));
  t.collections.Semantic.codeSyntax = { 'Colour/Text/strong': { WEB: 'var(--colour-text-strong)', ANDROID: 'x' }, 'Colour/Text/none': { ANDROID: 'y' } };
  writeFileSync(f, JSON.stringify(t));
  const r = check(root);
  assert.equal(r.status, 0, r.stdout + r.stderr);
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
    ['web code syntax that is not the name the build writes', (root) => {
      const f = join(root, 'design/figma.json'), t = JSON.parse(readFileSync(f, 'utf8'));
      t.collections.Semantic.codeSyntax = { 'Colour/Text/strong': { WEB: 'var(--color-text-strong)' } };
      writeFileSync(f, JSON.stringify(t));
    }, /\[code-standard rule 52\].*var\(--colour-text-strong\)/],
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

const buildCli = (root, ...args) => spawnSync(process.execPath, [join(TOOLKIT, 'tools/tokens/build.mjs'), '--repo', root, ...args], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: '' } });

test('a colour style and a variable that slug to one property are refused in one line naming both Figma names, no stack, nothing written', () => {
  const root = repo();
  const f = join(root, 'design/figma.json'), t = JSON.parse(readFileSync(f, 'utf8'));
  // a `$` marks the style apart in Figma, and the slug drops it (code-standard rule 52; DTCG reserves a leading `$`)
  t.paintStyles = [{ name: 'Colour/Text/$strong', paints: [{ type: 'SOLID', color: '#000000' }] }];
  writeFileSync(f, JSON.stringify(t));
  const r = buildCli(root);
  assert.equal(r.status, 1, r.stderr);
  assert.doesNotMatch(r.stderr, /\n\s+at /, 'no stack trace');
  assert.match(r.stderr, /^tokens: "Colour\/Text\/strong" \(variable in Semantic\) and "Colour\/Text\/\$strong" \(colour style\) both become --colour-text-strong: rename one in Figma, or rule that the variable wins \(audit-settings tokens variableOverStyle\) \(code-standard rule 52\)$/m);
  assert.ok(!existsSync(join(root, 'design/dtcg/color-style')), 'a refused build writes no DTCG file over the stylesheets it did not build');
});

test('an out-of-date build names the command that rebuilds it: bin/tokens where the repo has one, else the build itself', () => {
  const root = repo();
  const f = join(root, 'design/figma.json'), t = JSON.parse(readFileSync(f, 'utf8'));
  t.collections.Semantic.values.Light['Colour/Text/strong'] = '#222222';
  writeFileSync(f, JSON.stringify(t));
  let r = buildCli(root, '--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, new RegExp(`out of date — run ${join(root, 'bin/tokens').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'), r.stderr);
  rmSync(join(root, 'bin/tokens'));
  r = buildCli(root, '--check');
  assert.ok(r.stderr.includes(`out of date — run node ${join(TOOLKIT, 'tools/tokens/build.mjs')} --repo ${root}\n`), r.stderr);
});

// A colour style sharing a variable's name: only a binding to that very variable is the variable again
const withStyle = (root, paint, more = {}) => {
  const f = join(root, 'design/figma.json'), t = JSON.parse(readFileSync(f, 'utf8'));
  for (const m of ['Light', 'Dark']) Object.assign(t.collections.Semantic.values[m], more);
  t.paintStyles = [{ name: 'Colour/Text/$strong', paints: [paint] }];
  writeFileSync(f, JSON.stringify(t));
};

test('a colour style bound to the variable it shares a name with is that variable, written once and reported as its alias', () => {
  const root = repo();
  const plain = readFileSync(join(root, 'styles/generated/_tokens.scss'), 'utf8');
  withStyle(root, { type: 'SOLID', color: 'Colour/Text/strong' });
  const r = buildCli(root);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /tokens: 1 aliased: Colour\/Text\/\$strong \(the variable Colour\/Text\/strong \(Semantic\) again, written once as it\)/);
  assert.equal(readFileSync(join(root, 'styles/generated/_tokens.scss'), 'utf8'), plain, 'the stylesheet the variable alone builds');
  assert.ok(!existsSync(join(root, 'design/dtcg/color-style')), 'no token of its own');
  assert.equal(check(root).status, 0);
});

test('a colour style sharing a variable\'s name is refused when bound to another variable, or a literal equal to the variable\'s value', () => {
  for (const [what, paint] of [
    ['bound to another variable', { type: 'SOLID', color: 'Colour/Text/weak' }],
    ['a literal equal to the variable\'s value', { type: 'SOLID', color: '#202020' }],
  ]) {
    const root = repo();
    withStyle(root, paint, { 'Colour/Text/weak': '#6a6a6a' });
    const r = buildCli(root);
    assert.equal(r.status, 1, `${what}: ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /"Colour\/Text\/strong" \(variable in Semantic\) and "Colour\/Text\/\$strong" \(colour style\) both become --colour-text-strong/, what);
  }
});

// one variable name in several collections: different values are different tokens, the same values one token
const withCollections = (root, extra) => {
  const f = join(root, 'design/figma.json'), t = JSON.parse(readFileSync(f, 'utf8'));
  Object.assign(t.collections, extra(t));
  writeFileSync(f, JSON.stringify(t));
};
const tokensCss = (root) => readFileSync(join(root, 'styles/generated/_tokens.scss'), 'utf8');

test('one name in two collections at different values is two tokens, each named with its collection; no other name moves', () => {
  const root = repo();
  withCollections(root, () => ({ Brand: { modes: ['Value'], values: { Value: { 'Colour/Text/strong': '#ff0000', 'Colour/Text/accent': '#00ff00' } }, alias: {} } }));
  const r = buildCli(root);
  assert.equal(r.status, 0, r.stderr);
  const css = tokensCss(root);
  assert.match(css, /--semantic-colour-text-strong: #202020;/);
  assert.match(css, /--brand-colour-text-strong: #ff0000;/);
  assert.match(css, /--colour-text-accent: #00ff00;/, 'a name only one collection holds keeps its name');
  assert.doesNotMatch(css, /--colour-text-strong:/, 'neither copy takes the bare name');
});

test('one name in two collections in the same modes at the same values is one token, written once under its own name, the copy listed', () => {
  const root = repo();
  withCollections(root, (t) => {
    for (const m of ['Light', 'Dark']) t.collections.Semantic.values[m]['Size/gap'] = 8;
    return { Brand: { modes: ['Light', 'Dark'], values: { Light: { 'Size/gap': 8 }, Dark: { 'Size/gap': 8 } }, alias: {} } };
  });
  const r = buildCli(root);
  assert.equal(r.status, 0, r.stderr);
  const css = tokensCss(root);
  assert.equal(css.split('\n\n')[1].match(/--size-gap:/g).length, 1, 'once in :root');
  assert.doesNotMatch(css, /--(semantic|brand)-size-gap/);
  assert.match(r.stdout, /1 deduped:\n\s+(brand\/size\.gap \(written once, from semantic|semantic\/size\.gap \(written once, from brand): the same in every mode\)/);
});

test('swapped modes, or another set of modes, are not the same values: each copy is its own token, with its collection', () => {
  for (const brand of [
    { modes: ['Light', 'Dark'], values: { Light: { 'Size/gap': 12 }, Dark: { 'Size/gap': 8 } }, alias: {} },
    { modes: ['Value'], values: { Value: { 'Size/gap': 8 } }, alias: {} },
  ]) {
    const root = repo();
    withCollections(root, (t) => {
      t.collections.Semantic.values.Light['Size/gap'] = 8; t.collections.Semantic.values.Dark['Size/gap'] = 12;
      return { Brand: brand };
    });
    const r = buildCli(root);
    assert.equal(r.status, 0, r.stderr);
    const css = tokensCss(root);
    assert.match(css, /--semantic-size-gap:/); assert.match(css, /--brand-size-gap:/);
    assert.doesNotMatch(css, /--size-gap:/);
  }
});

test('another library\'s collection numbered beside a local one, holding a name of it at another value: each written with its collection, and a reader names a binding the same way', async () => {
  const root = repo();
  withCollections(root, () => ({
    Shades: { modes: ['Value'], values: { Value: { 'pill-edge': '#000000' } }, alias: {} },
    '🌮 Shades': { remote: true, modes: ['Value'], values: { Value: { 'pill-edge': '#ff0000', 'Accent/strong': '#00ff00' } }, alias: {} },
  }));
  const r = buildCli(root);
  assert.equal(r.status, 0, r.stderr);
  const css = tokensCss(root);
  assert.match(css, /--shades-pill-edge: #000000;/);
  assert.match(css, /--shades-2-pill-edge: #ff0000;/);
  assert.match(css, /--accent-strong: #00ff00;/, 'a name only it holds keeps its name');
  const { prefixedIn, tokenProperty, slugsOf } = await import('./names.mjs');
  const snap = JSON.parse(readFileSync(join(root, 'design/figma.json'), 'utf8')), kept = prefixedIn(join(root, 'design/dtcg')), slugs = slugsOf(snap);
  for (const [col, want] of [['🌮 Shades', '--shades-2-pill-edge'], ['Shades', '--shades-pill-edge']]) {
    const got = tokenProperty('pill-edge', col, kept, slugs).css;
    assert.equal(got, want);
    assert.match(css, new RegExp(`${got}:`), `${col}: the property the reader names is one the build wrote`);
  }
});

test('under the ruling (read for a tokens-only library too), a colour style is met by a variable as the build writes it: one written with its collection meets none', () => {
  const root = repo(), projects = mkdtempSync(join(tmpdir(), 'projects-'));
  withCollections(root, (t) => {
    t.paintStyles = [{ name: 'Pill edge', paints: [{ type: 'SOLID', color: '#123456' }] }, { name: 'Colour/Text/$strong', paints: [{ type: 'SOLID', color: '#000000' }] }];
    return { 'Shades 1': { modes: ['Value'], values: { Value: { 'pill-edge': '#000000' } }, alias: {} }, 'Shades 2': { modes: ['Value'], values: { Value: { 'pill-edge': '#ffffff' } }, alias: {} } };
  });
  const home = join(projects, 'fixture', 'figma-design-system');
  mkdirSync(home, { recursive: true });
  writeFileSync(join(home, 'design-system-context.md'), `# Fixture\n\n\`\`\`json audit-settings\n${JSON.stringify({ libraries: { K: { tokens: { variableOverStyle: true } } } })}\n\`\`\`\n\n\`\`\`json snapshot-routing\n${JSON.stringify({ repo: root, files: { library: [{ key: 'K', roles: ['tokens'] }] } })}\n\`\`\`\n`);
  const r = spawnSync(process.execPath, [join(TOOLKIT, 'tools/tokens/build.mjs'), '--repo', root], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: projects } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 colour style\(s\) dropped[^\n]*\n\s+"Colour\/Text\/\$strong"/, 'the ruling is read, and drops the one style a variable is written as');
  assert.doesNotMatch(r.stdout, /"Pill edge"/);
  assert.match(tokensCss(root), /--pill-edge: #123456;/);
  assert.match(tokensCss(root), /--shades-1-pill-edge: #000000;/);
});

test('two names of one property in one collection at other values are refused, another library\'s too, never one kept and the other dropped', () => {
  for (const values of [{ 'Logo/text': 1, 'Logo - text': 2 }, { 'Weight/Bold': 700, '🌮 Weight/Bold': 600 }]) {
    const root = repo();
    withCollections(root, () => ({ Lib: { remote: true, modes: ['Value'], values: { Value: values }, alias: {} } }));
    const r = buildCli(root);
    assert.equal(r.status, 1, `${Object.keys(values)}: ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /tokens: .*(two tokens become|both become) --(logo-text|weight-bold).*rename one in Figma \(code-standard rule 52\)/, r.stderr);
    assert.ok(!existsSync(join(root, 'design/dtcg/lib')), 'nothing written');
  }
});

test('two names of one property in one collection at the same values in every mode are one token, both said, local or another library\'s', () => {
  for (const remote of [false, true]) {
    const root = repo();
    withCollections(root, () => ({ Lib: { ...(remote && { remote: true }), modes: ['Light', 'Dark'], values: { Light: { 'Logo/text': '#101010', 'Ω Logo - text': '#101010' }, Dark: { 'Logo/text': '#efefef', 'Ω Logo - text': '#efefef' } }, alias: {} } }));
    const r = buildCli(root);
    assert.equal(r.status, 0, `${remote}: ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /1 deduped:\n\s+Lib\/Ω Logo - text \(one token with Logo\/text in Lib, the same in every mode\)/, r.stdout);
    const css = tokensCss(root);
    assert.ok(!/omega|--lib-logo-text/.test(css), css);
    assert.match(css, /--logo-text: #101010;/);
    assert.match(css, /--logo-text: #efefef;/);
  }
});

test('a name its collection prefixes that still meets another is refused as before', () => {
  const root = repo();
  withCollections(root, () => ({
    Brand: { modes: ['Value'], values: { Value: { 'Colour/Text/strong': '#ff0000' } }, alias: {} },
    Other: { modes: ['Value'], values: { Value: { 'Brand/Colour/Text/strong': '#0000ff' } }, alias: {} },
  }));
  const r = buildCli(root);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /"Colour\/Text\/strong" \(variable in Brand\) and "Brand\/Colour\/Text\/strong" \(variable in Other\) both become --brand-colour-text-strong/);
});

test('under the project\'s ruling a colour style that disagrees with its variable is dropped and listed with both values', () => {
  const root = repo(), projects = mkdtempSync(join(tmpdir(), 'projects-'));
  withStyle(root, { type: 'SOLID', color: '#000000' });
  const home = join(projects, 'fixture', 'figma-design-system');
  mkdirSync(home, { recursive: true });
  const doc = (settings) => writeFileSync(join(home, 'design-system-context.md'), `# Fixture\n\n\`\`\`json audit-settings\n${JSON.stringify({ libraries: { K: settings } })}\n\`\`\`\n\n\`\`\`json snapshot-routing\n${JSON.stringify({ repo: root, files: { library: [{ key: 'K', roles: ['tokens', 'components'] }] } })}\n\`\`\`\n`);
  const run = (...a) => spawnSync(process.execPath, [join(TOOLKIT, 'tools/tokens/build.mjs'), '--repo', root, ...a], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: projects } });
  doc({});
  assert.equal(run().status, 1, 'no ruling: refused');
  doc({ tokens: { variableOverStyle: true } });
  const r = run();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 colour style\(s\) dropped, the variable of their name kept/);
  assert.match(r.stdout, /"Colour\/Text\/\$strong" = #000000; the variable Colour\/Text\/strong \(Semantic\) = #202020 \| #ececec/);
  assert.match(tokensCss(root), /--colour-text-strong: #202020;/);
  assert.equal(run('--check').status, 0, 'the check builds as the write did');
});
