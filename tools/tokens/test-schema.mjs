// The export is DTCG 2025.10 by the standard's own published schemas, not by
// what one tool accepts: every token file and the resolver an export writes
// validate against schemas/dtcg-2025.10/ (copied verbatim from designtokens.org,
// so the run is offline and moves only when the spec version is adopted).
// Tools are lenient; a schema is not: an outside tool built the old export
// whose typography carried two members DTCG does not have, and the schema
// rejects it (2026-11-17).
// Run: node tools/tokens/test-schema.mjs   (as bin/check does; a missing ajv exits 77, a skip)
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { writeDtcg, RESOLVER } from './from-snapshot.mjs';
import { snapshot } from './fixture-snapshot.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
// both or neither: ajv loaded without ajv-formats would crash, not skip
let Ajv, addFormats;
try { const a = require('ajv').default, f = require('ajv-formats').default; Ajv = a; addFormats = f; } catch { /* not installed: skipped below */ }
const skip = !(Ajv && addFormats) && 'ajv and ajv-formats are not installed in tools/tokens (`pnpm install` there)';
// said where bin/check reads it, so the run shows as a skip, not a bare ok
if (skip) console.log(`skip: ${skip}`);
if (skip) process.on('exit', (code) => { if (!code) process.exitCode = 77; });

const schema = (name) => {
  // strict: a later spec folder using keywords this draft-07 Ajv does not
  // know would otherwise have them ignored, and accept more than the standard
  const ajv = new Ajv({ strict: true, allErrors: true });
  addFormats(ajv);
  return ajv.compile(JSON.parse(readFileSync(join(HERE, 'schemas/dtcg-2025.10', name), 'utf8')));
};
const why = (v) => (v.errors || []).slice(0, 3).map((e) => `${e.instancePath} ${e.message}`).join('; ');

// every file under the export, at any depth, root included
const walk = (dir, at = '') => readdirSync(join(dir, at)).flatMap((f) => (statSync(join(dir, at, f)).isDirectory() ? walk(dir, join(at, f)) : [join(at, f)]));
const exported = (s) => {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-schema-'));
  try { const built = writeDtcg(s, dir); return { built, docs: Object.fromEntries(walk(dir).map((f) => [f, JSON.parse(readFileSync(join(dir, f), 'utf8'))])) }; }
  finally { rmSync(dir, { recursive: true, force: true }); }
};

test('every token file and the resolver an export writes are valid DTCG 2025.10', { skip }, () => {
  const format = schema('format.json'), resolver = schema('resolver.json');
  const s = snapshot();
  s.textStyles[0].letterSpacing = -0.02; // a tracking fraction and the spacing in $extensions, as real libraries have
  s.textStyles[0].paragraphSpacing = 12;
  const { docs } = exported(s);
  // the whole set by name: a style kind that stops being written (the only shadow, the only gradient) fails here
  assert.deepEqual(Object.keys(docs).sort(), [
    'color-style/value.json', 'effect-style/value.json',
    'primitives-colour/dark.json', 'primitives-colour/light.json',
    'responsive-type/desktop.json', 'responsive-type/mobile.json',
    'semantic/dark.json', 'semantic/light.json', 'text-style/value.json', RESOLVER,
  ]);
  for (const [f, doc] of Object.entries(docs)) {
    const v = f === RESOLVER ? resolver : format;
    assert.ok(v(doc), `${f}: ${why(v)}`);
  }
  // and the resolver names only files the export wrote, each of them
  const refs = JSON.stringify(docs[RESOLVER]).match(/"\$ref":"[^#"][^"]*"/g).map((r) => r.slice(8, -1));
  assert.deepEqual([...new Set(refs)].sort(), Object.keys(docs).filter((f) => f !== RESOLVER).sort());
});

// The one known gap: an AUTO line height the snapshot could not measure is
// left out, never faked, so that token falls short of DTCG. Pinned so the gap
// stays warned and visible; when it closes, this case says so.
test('an unmeasured line height is warned, and its token is the one the schema rejects', { skip }, () => {
  const format = schema('format.json');
  const s = snapshot();
  delete s.textStyles[0].lineHeight;
  const { built, docs } = exported(s);
  assert.match(built.report.warnings.map((w) => w.reason).join('\n'), /line height is AUTO/);
  assert.ok(!format(docs['text-style/value.json']));
  assert.match(why(format), /lineHeight/);
});

test('the schemas reject what the export once wrote: a typography member DTCG does not have', { skip }, () => {
  const format = schema('format.json');
  const style = { fontFamily: 'Inter', fontSize: { value: 16, unit: 'px' }, fontWeight: 400, lineHeight: 1.5, letterSpacing: { value: 0, unit: 'px' } };
  assert.ok(format({ body: { $type: 'typography', $value: style } }), why(format));
  assert.ok(!format({ body: { $type: 'typography', $value: { ...style, paragraphSpacing: { value: 0, unit: 'px' } } } }));
  assert.ok(!schema('resolver.json')({ version: '2025.10', resolutionOrder: [] }), 'an empty resolution order is refused');
});
