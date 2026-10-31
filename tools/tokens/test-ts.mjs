#!/usr/bin/env node
// generate-ts.mjs and verify-ts.mjs on a token export written the way every
// project's is (from-snapshot.mjs's writeDtcg over a snapshot shaped like the
// plugin's): the modules are generated and pass, and each defect verify-ts
// exists to catch fails it — figma-token-export's A21 negative half, which was
// prose until 2026-10-31. Run: node tools/tokens/test-ts.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeDtcg } from './from-snapshot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const run = (script, ...args) => spawnSync(process.execPath, [path.join(HERE, script), ...args], { encoding: 'utf8' });

const snapshot = {
  _meta: { file: 'UI library', fileId: 'x' },
  collections: {
    'Primitives - Colour': { modes: ['Value'], values: { Value: { 'Palette/Grey/12': '#161616', 'Palette/Grey/1': '#f5f5f5', 'Palette/Black/a10': 'rgb(0 0 0 / 0.1)' } }, alias: {} },
    Semantic: {
      modes: ['Light', 'Dark'],
      values: { Light: { 'Colour/Text/strong': '#161616', 'Colour/Shadow/soft': 'rgb(0 0 0 / 0.1)', 'State/Disabled/opacity': 50 }, Dark: { 'Colour/Text/strong': '#f5f5f5', 'Colour/Shadow/soft': 'rgb(0 0 0 / 0.1)', 'State/Disabled/opacity': 40 } },
      alias: { Light: { 'Colour/Text/strong': 'Palette/Grey/12', 'Colour/Shadow/soft': 'Palette/Black/a10' }, Dark: { 'Colour/Text/strong': 'Palette/Grey/1', 'Colour/Shadow/soft': 'Palette/Black/a10' } },
    },
  },
  textStyles: [],
  // a layered shadow whose colour is bound: the reference sits inside a composite (A21's fixture)
  effects: [{ name: 'Elevation/raised', layers: [
    { type: 'DROP_SHADOW', x: 0, y: 1, blur: 2, spread: 0, color: 'rgb(0 0 0 / 0.1)', bound: { color: { collection: 'Semantic', name: 'Colour/Shadow/soft' } } },
    { type: 'DROP_SHADOW', x: 0, y: 4, blur: 8, spread: 0, color: 'rgb(0 0 0 / 0.1)' },
  ] }],
  paintStyles: [],
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-ts-'));
process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));
writeDtcg(snapshot, dir);
const TS = path.join(dir, 'dist', 'ts');

const gen = run('generate-ts.mjs', dir);
ok('generate-ts writes one module per collection and an index', gen.status === 0
  && ['index.ts', 'primitives-colour.ts', 'semantic.ts', 'effect-style.ts'].every((f) => fs.existsSync(path.join(TS, f))), gen.stderr + fs.readdirSync(dir).join(' '));
const sem = fs.readFileSync(path.join(TS, 'semantic.ts'), 'utf8');
ok('an alias is an expression into the module that owns it, not a resolved value', /primitivesColour\.palette\.grey\['12'\]|primitivesColour\.palette\.grey\[12\]|primitivesColour\.palette\.grey\.\w*12/.test(sem), sem.slice(0, 600));
const fx = fs.readFileSync(path.join(TS, 'effect-style.ts'), 'utf8');
ok('a reference inside a shadow layer is an expression too, never brace text', /semantic\.\w+\.colour\.shadow\.soft/.test(fx) && !/'\{/.test(fx), fx.slice(0, 800));

const good = run('verify-ts.mjs', dir);
ok('verify-ts passes the modules it was generated beside', good.status === 0 && /^ok — \d+ passed, 0 failed/m.test(good.stdout), good.stdout + good.stderr);
const compared = Number((good.stdout + good.stderr).match(/(\d+) passed/)[1]);
ok('…and ran more than a handful of checks', compared > 6, String(compared));

// each defect, written into a copy of the generated modules: verify must fail it, by name
const broken = (name, file, from, to, says) => {
  const copy = fs.mkdtempSync(path.join(dir, 'broken-'));
  for (const f of fs.readdirSync(TS)) fs.copyFileSync(path.join(TS, f), path.join(copy, f));
  const src = fs.readFileSync(path.join(copy, file), 'utf8');
  const next = src.replace(from, to);
  assert.notEqual(next, src, `the defect "${name}" was not written: its pattern is not in ${file}`);
  fs.writeFileSync(path.join(copy, file), next);
  const r = run('verify-ts.mjs', dir, copy);
  ok(`verify-ts fails ${name}`, r.status === 1 && says.test(r.stderr), r.stdout + r.stderr);
};
broken('a reference pointed at nothing', 'semantic.ts', /primitivesColour\.palette\.grey\['12'\]/, "primitivesColour.palette.grey['99']", /has no unresolved references/);
broken('a reference left as a literal string', 'effect-style.ts', /semantic\.(\w+)\.colour\.shadow\.soft/, "'{semantic.colour.shadow.soft}'", /reference left as a literal string/);
broken('a reference inside a shadow layer pointed at nothing', 'effect-style.ts', /semantic\.light\.colour\.shadow\.soft/, 'semantic.light.colour.shadow.gone', /has no unresolved references/);
broken('a whole token missing', 'semantic.ts', /^\s*strong: [^\n]*,\n/m, '', /carries every token by path/);
broken('a value replaced by a wrong literal', 'primitives-colour.ts', /'#161616'/, "'#ff0000'", /equals what the JSON resolves to/);

// nothing to read is a failure, never a pass
const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-ts-empty-'));
const none = run('generate-ts.mjs', empty);
ok('generate-ts on a folder with no collection fails and says so', none.status === 1 && /no collection folders/.test(none.stderr), none.stderr);
fs.rmSync(empty, { recursive: true, force: true });
ok('both name their arguments when given none', run('generate-ts.mjs').status === 2 && run('verify-ts.mjs').status === 2);
console.log(`${n}/${n} passed`);
