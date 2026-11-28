#!/usr/bin/env node
// generate-ts.mjs and verify-ts.mjs on a token export written the way every
// project's is (from-snapshot.mjs's writeDtcg over a snapshot shaped like the
// plugin's): the modules are generated and pass, and each defect verify-ts
// exists to catch fails it — the retired figma-token-export skill's A21 negative half, which was
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
// a name that is a token and a group: the group's own token is `$root`, and a reference to it is an expression into it
const rooted = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-ts-root-'));
writeDtcg({ collections: {
  Theme: { modes: ['Light', 'Dark'], values: { Light: { 'Text/warning': '#aa0000', 'Text/warning/inverse': '#ffffff' }, Dark: { 'Text/warning': '#ff8888', 'Text/warning/inverse': '#000000' } }, alias: {} },
  Icon: { modes: ['Value'], values: { Value: { warning: '#aa0000' } }, alias: { Value: { warning: 'Text/warning' } } },
}, textStyles: [], effects: [], paintStyles: [] }, rooted);
const rg = run('generate-ts.mjs', rooted), rv = run('verify-ts.mjs', rooted);
const icon = rg.status === 0 ? fs.readFileSync(path.join(rooted, 'dist', 'ts', 'icon.ts'), 'utf8') : rg.stderr;
ok('a group\'s own token ($root) is generated, referred to, and verified', rg.status === 0 && /\$root/.test(icon) && !/'\{/.test(icon) && rv.status === 0, icon.slice(0, 600) + rv.stdout + rv.stderr);
fs.rmSync(rooted, { recursive: true, force: true });
// a collection named with a number first ("1. Primitives colour", two stored projects): its module's name is still
// an identifier, and one that aliases it imports it by that name
const digits = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-ts-digit-'));
writeDtcg({ collections: {
  '1. Primitives colour': { modes: ['Light', 'Dark'], values: { Light: { 'Red/500': '#aa0000' }, Dark: { 'Red/500': '#ff8888' } }, alias: {} },
  '2. Semantic': { modes: ['Value'], values: { Value: { danger: '#aa0000', 'Alert/start': '#aa0000', 'Alert/end': '#aa0000' } }, alias: { Value: { danger: 'Red/500', 'Alert/start': 'danger', 'Alert/end': 'Alert/start' } } },
}, textStyles: [], effects: [], paintStyles: [] }, digits);
const dg = run('generate-ts.mjs', digits), dv = run('verify-ts.mjs', digits);
ok('a collection whose name starts with a number generates, imports and verifies as an identifier; a token aliasing one in its own collection takes its value, a chain followed', dg.status === 0 && dv.status === 0, dg.stdout + dg.stderr + dv.stdout + dv.stderr.slice(0, 600));
fs.rmSync(digits, { recursive: true, force: true });
// two collections that reference each other (a brand's semantic set and the brand): neither module reads the other
// before it is built; what closes the cycle takes its value, and what does not stays an import
const cycle = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-ts-cycle-'));
writeDtcg({ collections: {
  Base: { modes: ['Value'], values: { Value: { 'Red/500': '#aa0000', 'Red/300': '#ff8888' } }, alias: {} },
  Semantic: { modes: ['Light', 'Dark'], values: { Light: { danger: '#aa0000', accent: '#aa0000' }, Dark: { danger: '#ff8888', accent: '#ff8888' } }, alias: { Light: { danger: 'Red/500', accent: 'Brand/accent' }, Dark: { danger: 'Red/300', accent: 'Brand/accent' } } },
  Brand: { modes: ['Light', 'Dark'], values: { Light: { 'Brand/accent': '#aa0000', icon: '#aa0000' }, Dark: { 'Brand/accent': '#ff8888', icon: '#ff8888' } }, alias: { Light: { 'Brand/accent': 'Red/500', icon: 'danger' }, Dark: { 'Brand/accent': 'Red/300', icon: 'danger' } } },
}, textStyles: [], effects: [], paintStyles: [] }, cycle);
const cg = run('generate-ts.mjs', cycle), cv = run('verify-ts.mjs', cycle);
const semTs = cg.status === 0 ? fs.readFileSync(path.join(cycle, 'dist', 'ts', 'semantic.ts'), 'utf8') : '';
ok('collections that reference each other import neither and verify; a reference outside the cycle stays an import', cg.status === 0 && cv.status === 0 && !/from '\.\/brand'/.test(semTs) && /from '\.\/base'/.test(semTs), cg.stderr + cv.stdout + cv.stderr.slice(0, 600) + semTs.slice(0, 400));
fs.rmSync(cycle, { recursive: true, force: true });
// two tokens whose names differ only by a hyphen before a digit (`DarkNeutral-100A` and `DarkNeutral100A`, one library's
// alpha scale, 2026-11-28): two paths in the JSON that camel alike in TypeScript. Each is kept under its own name, and a
// reference to either reaches it; neither is lost to the other
const clash = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-ts-clash-'));
writeDtcg({ collections: {
  Base: { modes: ['Value'], values: { Value: { 'Alpha/DarkNeutral-100A': 'rgb(1 4 4 / 0.46)', 'Alpha/DarkNeutral100A': 'rgb(189 189 189 / 0.04)', 'Alpha/Grey-12': '#161616' } }, alias: {} },
  Theme: { modes: ['Light', 'Dark'], values: { Light: { scrim: 'rgb(1 4 4 / 0.46)', disabled: 'rgb(189 189 189 / 0.04)', text: '#161616' }, Dark: { scrim: 'rgb(189 189 189 / 0.04)', disabled: 'rgb(1 4 4 / 0.46)', text: '#161616' } },
    alias: { Light: { scrim: 'Alpha/DarkNeutral-100A', disabled: 'Alpha/DarkNeutral100A', text: 'Alpha/Grey-12' }, Dark: { scrim: 'Alpha/DarkNeutral100A', disabled: 'Alpha/DarkNeutral-100A', text: 'Alpha/Grey-12' } } },
}, textStyles: [], effects: [], paintStyles: [] }, clash);
const xg = run('generate-ts.mjs', clash), xv = run('verify-ts.mjs', clash);
const baseTs = xg.status === 0 ? fs.readFileSync(path.join(clash, 'dist', 'ts', 'base.ts'), 'utf8') : xg.stderr;
ok('two tokens whose names camel alike are both generated under names of their own, referred to and verified; one that clashes with none keeps its camel name',
  xg.status === 0 && xv.status === 0 && /rgb\(1 4 4|0\.46/.test(baseTs) && /0\.04/.test(baseTs) && /grey12/.test(baseTs), baseTs.slice(0, 700) + xv.stdout.slice(-300) + xv.stderr.slice(0, 600));
fs.rmSync(clash, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
