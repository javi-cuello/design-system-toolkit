#!/usr/bin/env node
// scaffold-design-system.mjs into a scratch Kirby root, the T6 and T8 walk as a
// test: what it writes, that it fills every placeholder, that a second run
// overwrites nothing, and what it refuses. Compiling the result (bin/css) stays
// a walk: it installs sass from the network.
// Run: node skills/frontend-build/tests/test-scaffold.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../scripts/scaffold-design-system.mjs', import.meta.url));
const SRC = fileURLToPath(new URL('../assets/design-system-scaffold', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const files = (dir, base = '') => readdirSync(dir).flatMap((e) => (statSync(join(dir, e)).isDirectory() ? files(join(dir, e), `${base}${e}/`) : [`${base}${e}`]));

const root = mkdtempSync(join(tmpdir(), 'scaffold-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
mkdirSync(join(root, 'site'));
const sources = files(SRC);
ok('the scaffold has files to write', sources.length >= 10, String(sources.length));

const dry = run('--root', root, '--vendor', 'acme', '--dry-run');
ok('a dry run says what it would write and writes nothing', dry.status === 0 && new RegExp(`would write ${sources.length} file`).test(dry.stdout) && files(root).length === 0, dry.stdout + dry.stderr);

const first = run('--root', root, '--vendor', 'acme', '--prefix', 'ui');
ok('the first run writes every file of the scaffold', first.status === 0 && new RegExp(`wrote ${sources.length} file`).test(first.stdout), first.stdout + first.stderr);
const out = files(root);
ok('the plugin lands in site/plugins/design-system and the library under assets/design-system',
  out.includes('site/plugins/design-system/index.php') && out.some((f) => f.startsWith('assets/design-system/components/button/')) && out.includes('bin/css'), out.join('\n'));
const leftover = out.filter((f) => /__(PREFIX|VENDOR)__/.test(readFileSync(join(root, f), 'utf8')));
ok('every placeholder is filled: no __PREFIX__ or __VENDOR__ is left in any file', leftover.length === 0, leftover.join(', '));
const plugin = readFileSync(join(root, 'site/plugins/design-system/index.php'), 'utf8');
ok('the vendor and the prefix are the ones given', plugin.includes('acme/design-system') && plugin.includes("snippet('ui/<name>')") && plugin.includes('function ui_attrs('));
ok('bin/css is executable', (statSync(join(root, 'bin/css')).mode & 0o111) !== 0);

// a second run over work already there: nothing overwritten
writeFileSync(join(root, 'assets/design-system/index.sass'), '// mine\n');
const second = run('--root', root, '--vendor', 'acme', '--prefix', 'ui');
ok('a second run writes nothing and names what it kept', second.status === 0 && /wrote 0 file/.test(second.stdout) && new RegExp(`kept ${sources.length} existing file`).test(second.stdout), second.stdout);
ok('…and a file the project changed stays as the project wrote it', readFileSync(join(root, 'assets/design-system/index.sass'), 'utf8') === '// mine\n');

// what it refuses
ok('no --vendor is refused', run('--root', root).status === 1);
ok('a vendor or prefix that cannot be a name is refused', run('--root', root, '--vendor', 'Acme Co').status === 1 && run('--root', root, '--vendor', 'acme', '--prefix', 'ds-x').status === 1);
const bare = mkdtempSync(join(tmpdir(), 'scaffold-bare-'));
const notKirby = run('--root', bare, '--vendor', 'acme');
ok('a folder with no site/ is refused, and nothing is written there', notKirby.status === 1 && /not a Kirby project root/.test(notKirby.stderr) && !existsSync(join(bare, 'assets')));
rmSync(bare, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
