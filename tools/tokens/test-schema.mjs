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
import { mkdtempSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { writeDtcg, RESOLVER } from './from-snapshot.mjs';
import { snapshot } from './fixture-snapshot.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
let Ajv, addFormats;
try { Ajv = require('ajv').default; addFormats = require('ajv-formats').default; } catch { /* not installed: skipped below */ }
const skip = !Ajv && 'ajv is not installed in tools/tokens (`pnpm install` there)';
// said where bin/check reads it, so the run shows as a skip, not a bare ok
if (skip) console.log(`skip: ${skip}`);
if (skip) process.on('exit', (code) => { if (!code) process.exitCode = 77; });

const schema = (name) => {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  return ajv.compile(JSON.parse(readFileSync(join(HERE, 'schemas/dtcg-2025.10', name), 'utf8')));
};
const why = (v) => (v.errors || []).slice(0, 3).map((e) => `${e.instancePath} ${e.message}`).join('; ');

test('every token file and the resolver an export writes are valid DTCG 2025.10', { skip }, () => {
  const format = schema('format.json'), resolver = schema('resolver.json');
  const s = snapshot();
  s.textStyles[0].letterSpacing = -0.02; // a tracking fraction and the spacing in $extensions, as real libraries have
  s.textStyles[0].paragraphSpacing = 12;
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(s, dir);
  let files = 0;
  for (const d of readdirSync(dir)) {
    if (!statSync(join(dir, d)).isDirectory()) continue;
    for (const f of readdirSync(join(dir, d))) {
      files++;
      assert.ok(format(JSON.parse(readFileSync(join(dir, d, f), 'utf8'))), `${d}/${f}: ${why(format)}`);
    }
  }
  assert.ok(files >= 8, `${files} token files: the fixture's collections, modes and styles were all written`);
  assert.ok(existsSync(join(dir, RESOLVER)));
  assert.ok(resolver(JSON.parse(readFileSync(join(dir, RESOLVER), 'utf8'))), why(resolver));
});

test('the schemas reject what the export once wrote: a typography member DTCG does not have', { skip }, () => {
  const format = schema('format.json');
  const style = { fontFamily: 'Inter', fontSize: { value: 16, unit: 'px' }, fontWeight: 400, lineHeight: 1.5, letterSpacing: { value: 0, unit: 'px' } };
  assert.ok(format({ body: { $type: 'typography', $value: style } }), why(format));
  assert.ok(!format({ body: { $type: 'typography', $value: { ...style, paragraphSpacing: { value: 0, unit: 'px' } } } }));
  assert.ok(!schema('resolver.json')({ version: '2025.10', resolutionOrder: [] }), 'an empty resolution order is refused');
});
