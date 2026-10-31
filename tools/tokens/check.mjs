#!/usr/bin/env node
/*
 * The front-end standard, checked in a repo — so it holds by construction and
 * by gate, not by anybody remembering it.
 *
 *   node <toolkit>/tools/tokens/check.mjs --repo <root>
 *
 * Exits non-zero, naming each finding, when:
 *   1. the generated token stylesheets are not what the toolkit's token build
 *      writes (code-standard rule 23, via build.mjs --check);
 *   2. `bin/tokens` builds tokens any other way than by calling that build
 *      (code-standard rule 51: one build, no project generator);
 *   3. snapshot.config.json carries anything but where things live — a
 *      project that could state a CSS convention would (code-standard rule 55);
 *   4. a stylesheet reads `var(--x)` with no fallback and nothing defines
 *      `--x`: the browser drops that whole declaration without a word, which is
 *      what a renamed token does to every stylesheet that missed the rename.
 *
 * Every repo's bin/check runs this; the toolkit's own test runs it over every
 * registered repo.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { walkRepo } from '../shared/walk.mjs';

const store = createRequire(import.meta.url)('../snapshot/store.cjs');

const HERE = fileURLToPath(new URL('.', import.meta.url));
const argv = process.argv.slice(2);
const at = argv.indexOf('--repo');
const repo = resolve(at >= 0 && argv[at + 1] ? argv[at + 1] : '.');
const findings = [];
const say = (rule, text) => findings.push(`[${rule}] ${text}`);

// 1 · generated files are the build's
const built = spawnSync(process.execPath, [join(HERE, 'build.mjs'), '--repo', repo, '--check'], { encoding: 'utf8' });
if (built.status !== 0) say('code-standard rule 23', (built.stderr || built.stdout).trim().split('\n').map((l) => l.trim()).join('; '));

// 2 · bin/tokens delegates
const wrapper = join(repo, 'bin/tokens');
if (!existsSync(wrapper)) say('code-standard rule 51', 'no bin/tokens: a repo builds its tokens by calling the toolkit token build');
else if (!readFileSync(wrapper, 'utf8').includes('tools/tokens/build.mjs')) say('code-standard rule 51', 'bin/tokens does not call tools/tokens/build.mjs: tokens are built one way, in every project');

// 3 · the config says where and what runs after a snapshot, never how CSS is
// written; `parity` is the parity engine's facts (tolerances per kind)
const ALLOWED = new Set(['toolkit', 'project', 'paths', 'after', 'figmaToken', 'logs', 'parity', 'styles', 'screens', 'check', 'evals', '_note']);
// From the store, which defines the layout: this file held its own copy and
// the two had already diverged in both directions.
const PATHS = new Set(store.PATH_KEYS);
const config = JSON.parse(readFileSync(join(repo, 'snapshot.config.json'), 'utf8'));
for (const k of Object.keys(config)) if (!ALLOWED.has(k)) say('code-standard rule 55', `snapshot.config.json carries "${k}": a repo states where its files live and what it builds after a snapshot, and nothing about how CSS is written`);
for (const k of Object.keys(config.paths || {})) if (!PATHS.has(k)) say('code-standard rule 55', `snapshot.config.json paths carries "${k}", which is not a location the toolkit knows`);

// 4 · every var() without a fallback is defined somewhere
const sheets = walkRepo(repo, ['.scss', '.sass', '.css']);
// A compiled bundle repeats what its sources say; its sources are what is
// read. Which file is the bundle is read from the file, not from its path:
// this named `css/main.css`, one project's build output, so a project whose
// bundle is called anything else had it scanned (every var() in it reported
// undefined) and a project that hand-writes that path had it skipped. A
// minified stylesheet has no line breaks; that is what a bundle looks like
// in any project.
const minified = (f) => { const head = readFileSync(f, 'utf8').slice(0, 4000); return !head.includes('\n') && head.length > 500; };
const sources = sheets.filter((f) => !/\.min\.css$/.test(f) && !(extname(f) === '.css' && minified(f)));
const defined = new Set();
const uses = [];
for (const f of sources) {
  // Comments out, lines kept: a block comment replaced by nothing moved every
  // line after it, and the report pointed at the wrong one.
  const text = readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/.*$/gm, '$1');
  for (const m of text.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) defined.add(m[1]);
  // A name built by interpolation (`var(--#{$name}-x)`) is a mixin's and is
  // checked where the mixin is used, not here. The line is carried: a name
  // read in four sheets is four places to look, and the fix is at one line.
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g)) uses.push([f, m[1], i + 1]);
  });
}
// Properties the platform or a script defines are not a stylesheet's to declare.
const external = (n) => /^--(tw|next|sb|storybook|radix|vite|bs)-/.test(n);
const missing = new Map();
for (const [f, n, line] of uses) if (!defined.has(n) && !external(n)) missing.set(n, [...(missing.get(n) || []), `${relative(repo, f)}:${line}`]);
// A text style applied by the mixin names a style the tokens must define.
for (const f of sources) {
  for (const m of readFileSync(f, 'utf8').matchAll(/text-style\(\s*([a-z0-9-]+)\s*\)/g)) {
    if (!defined.has(`--${m[1]}-font-family`)) missing.set(`--${m[1]}-* (text-style)`, [...(missing.get(`--${m[1]}-* (text-style)`) || []), relative(repo, f)]);
  }
}
for (const [n, files] of missing) say('undefined', `var(${n}) is read with no fallback and nothing defines it: ${[...new Set(files)].slice(0, 3).join(', ')}${files.length > 3 ? ' …' : ''}`);

if (findings.length) {
  console.error(`front-end standard: ${findings.length} finding(s) in ${repo}`);
  for (const f of findings) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`front-end standard: ${sources.length} stylesheets, ${uses.length} var() reads, all defined; tokens are the toolkit build's`);
