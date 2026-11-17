// The snapshot → DTCG converter, walked on a small snapshot shaped like the
// plugin's. Run: node --test tools/tokens/test-from-snapshot.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { figmaRgba, toDtcgSnapshot, writeDtcg, tokensOf, RESOLVER } from './from-snapshot.mjs';

const DTCG = createRequire(import.meta.url)('./dtcg.js');

const snapshot = () => ({
  _meta: { file: 'UI library', fileId: 'x' },
  collections: {
    'Primitives - Colour': { modes: ['Light', 'Dark'], values: { Light: { 'Palette/Grey/12': '#161616' }, Dark: { 'Palette/Grey/12': '#f5f5f5' } }, alias: { Light: {}, Dark: {} } },
    Semantic: {
      modes: ['Light', 'Dark'],
      values: { Light: { 'Colour/Text/strong': '#161616', 'State/Disabled/opacity': 50 }, Dark: { 'Colour/Text/strong': '#f5f5f5', 'State/Disabled/opacity': 50 } },
      alias: { Light: { 'Colour/Text/strong': 'Palette/Grey/12' }, Dark: { 'Colour/Text/strong': 'Palette/Grey/12' } },
      descriptions: { 'Colour/Text/strong': 'Body text' },
    },
    'Responsive type': { modes: ['Desktop', 'Mobile'], values: { Desktop: { 'Heading/lg/size': 48, 'Heading/lg/family': 'Inter', 'Heading/lg/weight': 'Semi Bold' }, Mobile: { 'Heading/lg/size': 32, 'Heading/lg/family': 'Inter', 'Heading/lg/weight': 'Semi Bold' } }, alias: {} },
  },
  textStyles: [{ name: 'Heading/lg', family: 'Inter', weight: 'SemiBold', size: 48, lineHeight: 1.1, letterSpacing: 0,
    bound: { fontSize: { collection: 'Responsive type', name: 'Heading/lg/size' }, fontFamily: { collection: 'Responsive type', name: 'Heading/lg/family' }, fontWeight: { collection: 'Responsive type', name: 'Heading/lg/weight' } } }],
  effects: [{ name: 'Elevation/raised', layers: [{ type: 'INNER_SHADOW', x: 0, y: -1, blur: 0, spread: 1, color: 'rgb(22 22 22 / 0.03)' }] }],
  paintStyles: [{ name: 'Background/screen', paints: [{ type: 'GRADIENT_LINEAR', angle: 180, stops: [{ position: 0.25, color: 'Palette/Grey/12' }, { position: 1, color: '#ffffff' }] }] }],
});

test('colours parse from the strings the snapshot carries', () => {
  assert.deepEqual(figmaRgba('#ff0000'), { r: 1, g: 0, b: 0, a: 1 });
  assert.deepEqual(figmaRgba('rgb(0 0 0 / 0.5)'), { r: 0, g: 0, b: 0, a: 0.5 });
  assert.equal(figmaRgba('Palette/Grey/12'), null);
});

test('an alias recorded by name stays a reference into the collection that defines it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(snapshot(), dir);
  const light = JSON.parse(readFileSync(join(dir, 'semantic/light.json'), 'utf8'));
  assert.equal(light.semantic.colour.text.strong.$value, '{primitives-colour.palette.grey.12}');
  assert.equal(light.semantic.colour.text.strong.$description, 'Body text');
  assert.equal(light.semantic.state.disabled.opacity.$value, 0.5, 'opacity authored 0-100 becomes 0-1');
});

test('a text style binds to the variables the snapshot records', () => {
  const t = toDtcgSnapshot(snapshot()).textStyles[0];
  assert.deepEqual(t.bound.fontSize, { collection: 'Responsive type', name: 'Heading/lg/size' });
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(snapshot(), dir);
  const ts = JSON.parse(readFileSync(join(dir, 'text-style/value.json'), 'utf8'));
  assert.equal(ts['text-style'].heading.lg.$value.fontSize, '{responsive-type.heading.lg.size}');
});

test('a text style with no line height stored goes on as AUTO, never NaN or 0', () => {
  for (const lineHeight of [undefined, null]) {
    const snap = snapshot(); snap.textStyles[0].lineHeight = lineHeight;
    assert.deepEqual(toDtcgSnapshot(snap).textStyles[0].lineHeight, { unit: 'AUTO' });
  }
  assert.deepEqual(toDtcgSnapshot(snapshot()).textStyles[0].lineHeight, { unit: 'PERCENT', value: 110 });
});

test('effects keep inset layers, gradients keep bound stops and the angle', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(snapshot(), dir);
  const fx = JSON.parse(readFileSync(join(dir, 'effect-style/value.json'), 'utf8'));
  assert.equal(fx['effect-style'].elevation.raised.$value.inset, true);
  const paint = JSON.parse(readFileSync(join(dir, 'color-style/value.json'), 'utf8'));
  const g = paint['color-style'].background.screen;
  assert.equal(g.$value[0].color, '{primitives-colour.palette.grey.12}');
  assert.equal(Object.values(g.$extensions)[0].angle, 180);
});

test('typography holds the spec\'s five members; paragraph and list spacing ride in $extensions beside the tracking fraction', () => {
  const s = snapshot();
  s.textStyles[0].letterSpacing = -0.02; // the snapshot stores tracking as a share of the size
  s.textStyles[0].paragraphSpacing = 12;
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(s, dir);
  const t = JSON.parse(readFileSync(join(dir, 'text-style/value.json'), 'utf8'))['text-style'].heading.lg;
  assert.deepEqual(Object.keys(t.$value).sort(), ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight']);
  assert.deepEqual(t.$extensions[DTCG.VENDOR], { letterSpacingEm: -0.02, paragraphSpacing: { value: 12, unit: 'px' }, listSpacing: { value: 0, unit: 'px' } });
});

test('the export writes a DTCG 2025.10 resolver: one set, one modifier per mode axis, relative references', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(snapshot(), dir);
  const r = JSON.parse(readFileSync(join(dir, RESOLVER), 'utf8'));
  assert.equal(r.version, '2025.10');
  assert.deepEqual(Object.keys(r.modifiers), ['primitives-colour+semantic', 'responsive-type']);
  assert.deepEqual(r.modifiers['responsive-type'], { description: 'The Figma modes of Responsive type.', contexts: { desktop: [{ $ref: 'responsive-type/desktop.json' }], mobile: [{ $ref: 'responsive-type/mobile.json' }] }, default: 'desktop' });
  for (const { $ref } of [...r.sets.base.sources, ...Object.values(r.modifiers).flatMap((m) => Object.values(m.contexts).flat())])
    assert.ok(readdirSync(join(dir, $ref.split('/')[0])).includes($ref.split('/')[1]), `${$ref} is a file the export wrote`);
});

test('a resolver someone else wrote is not this export\'s: the folder is refused, nothing deleted', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeFileSync(join(dir, RESOLVER), JSON.stringify({ version: '2025.10', resolutionOrder: [] }));
  mkdirSync(join(dir, 'theirs'));
  writeFileSync(join(dir, 'theirs/value.json'), '{}');
  assert.throws(() => writeDtcg(snapshot(), dir), /not a token export/);
  assert.ok(readdirSync(dir).includes('theirs'));
});

test('paragraph and list spacing survive noExtensions, under the vendor key given', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(snapshot(), dir, { noExtensions: true, vendor: 'com.example' });
  const t = JSON.parse(readFileSync(join(dir, 'text-style/value.json'), 'utf8'))['text-style'].heading.lg;
  assert.deepEqual(t.$extensions, { 'com.example': { paragraphSpacing: { value: 0, unit: 'px' }, listSpacing: { value: 0, unit: 'px' } } });
});

test('a folder an older export wrote, marked by manifest.json, is taken over and the manifest removed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeFileSync(join(dir, 'manifest.json'), '{"builds":[]}');
  writeFileSync(join(dir, 'README.md'), 'kept');
  writeDtcg(snapshot(), dir);
  const names = readdirSync(dir);
  assert.ok(names.includes(RESOLVER) && !names.includes('manifest.json') && names.includes('README.md'), names.join(', '));
});

test('an alias to a same-named variable points at the other collection, never itself', () => {
  const s = snapshot();
  // Semantic listed first, so a first-definer lookup would have sent the alias home to itself.
  s.collections = {
    Brand: { modes: ['Light'], values: { Light: { 'Palette/Grey/12': '#161616' } }, alias: { Light: { 'Palette/Grey/12': 'Palette/Grey/12' } } },
    ...s.collections,
  };
  const v = toDtcgSnapshot(s).collections.find((c) => c.name === 'Brand').variables[0];
  assert.deepEqual(v.values.Light.alias, { collection: 'Primitives - Colour', name: 'Palette/Grey/12' });
});

test('a collection holding only what DTCG cannot type adds no files and no modifier', () => {
  const s = snapshot();
  s.collections['Collection 1'] = { modes: ['Expanded', 'Collapsed'], values: { Expanded: { 'Sidebar variant': true }, Collapsed: { 'Sidebar variant': false } }, alias: {} };
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  const built = writeDtcg(s, dir);
  assert.ok(!readdirSync(dir).includes('collection-1'), readdirSync(dir).join(', '));
  assert.ok(!Object.keys(JSON.parse(readFileSync(join(dir, RESOLVER), 'utf8')).modifiers).some((m) => m.includes('collection-1')));
  assert.equal(built.resolutions.length, 4, 'light/dark × desktop/mobile, not doubled');
});

test('two modes whose names slug alike are refused, nothing written', () => {
  const s = snapshot();
  s.collections.Brand = { modes: ['Light', 'light'], values: { Light: { 'A/b': '#000000' }, light: { 'A/b': '#ffffff' } }, alias: {} };
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  assert.throws(() => writeDtcg(s, dir), /modes "Light" and "light" both become brand\/light\.json/);
  assert.deepEqual(readdirSync(dir), []);
});

test('an export refuses to clear a non-empty folder it did not write', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeFileSync(join(dir, 'notes.txt'), 'mine');
  assert.throws(() => writeDtcg(snapshot(), dir), /not a token export/);
  assert.equal(readFileSync(join(dir, 'notes.txt'), 'utf8'), 'mine');
  const ours = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(snapshot(), ours);
  writeDtcg(snapshot(), ours); // its own resolver: replaced, no throw
});

test('a text style takes the bindings the snapshot records, over the naming convention, and drops a foreign one', () => {
  const s = snapshot();
  // bound to variables that break the <style>/<field> convention, and one from another library
  s.collections['Responsive type'].values.Desktop['Type/Display/size'] = 48;
  s.collections['Responsive type'].values.Mobile['Type/Display/size'] = 32;
  s.textStyles[0].bound = {
    fontSize: { collection: 'Responsive type', name: 'Type/Display/size' },
    fontFamily: { collection: 'Brand library', name: 'Font/Display' },
  };
  const t = toDtcgSnapshot(s).textStyles[0];
  assert.deepEqual(t.bound.fontSize, { collection: 'Responsive type', name: 'Type/Display/size' }, 'the recorded binding, not the convention');
  assert.equal(t.bound.fontFamily, null, 'a variable this snapshot does not hold stays the literal family');
  assert.equal(t.bound.fontWeight, null, 'a snapshot that records bindings is not second-guessed by the convention');
});

test('a shadow layer keeps the variables its fields are bound to, and a foreign one keeps its literal', () => {
  const s = snapshot();
  s.collections.Semantic.values.Light['Colour/Shadow/soft'] = 'rgb(0 0 0 / 0.1)';
  s.collections.Semantic.values.Dark['Colour/Shadow/soft'] = 'rgb(0 0 0 / 0.3)';
  s.effects[0].layers[0].bound = { color: { collection: 'Semantic', name: 'Colour/Shadow/soft' }, blur: { collection: 'Elsewhere', name: 'Blur/8' } };
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(s, dir);
  const fx = JSON.parse(readFileSync(join(dir, 'effect-style/value.json'), 'utf8'))['effect-style'].elevation.raised.$value;
  assert.equal(fx.color, '{semantic.colour.shadow.soft}');
  assert.deepEqual(fx.blur, { value: 0, unit: 'px' }, 'a variable this snapshot does not hold stays the literal');
});

test('a refresh replaces only what the export owns: a README and dist/ stay, a vanished collection goes', async () => {
  const { mkdirSync, existsSync } = await import('node:fs');
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(snapshot(), dir);
  writeFileSync(join(dir, 'README.md'), '# kept\n');
  mkdirSync(join(dir, 'dist/ts'), { recursive: true });
  writeFileSync(join(dir, 'dist/ts/index.ts'), 'export {};\n');
  mkdirSync(join(dir, 'gone'));
  writeFileSync(join(dir, 'gone/value.json'), '{}\n');
  writeDtcg(snapshot(), dir);
  assert.ok(existsSync(join(dir, 'README.md')) && existsSync(join(dir, 'dist/ts/index.ts')), 'what the export did not write stays');
  assert.ok(!existsSync(join(dir, 'gone')), 'a collection the snapshot no longer has is removed');
  assert.ok(existsSync(join(dir, 'semantic/light.json')));
});

test('a variable the snapshot records as hidden from publishing stays marked hidden', () => {
  const s = snapshot();
  s.collections['Primitives - Colour'].hidden = ['Palette/Grey/12'];
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(s, dir);
  const t = JSON.parse(readFileSync(join(dir, 'primitives-colour/light.json'), 'utf8'))['primitives-colour'].palette.grey['12'];
  assert.equal(t.$extensions['com.figma.variables'].hiddenFromPublishing, true);
  const sem = JSON.parse(readFileSync(join(dir, 'semantic/light.json'), 'utf8')).semantic.colour.text.strong;
  assert.equal(sem.$extensions['com.figma.variables'].hiddenFromPublishing, false);
});

test('a snapshot without text-style bindings is refused, never guessed at', () => {
  const s = snapshot();
  delete s.textStyles[0].bound;
  assert.throws(() => toDtcgSnapshot(s), /predates plugin 0\.24\.0.*Heading\/lg.*take a new snapshot/);
});

test('a file the plugin downloaded reads as its tokens, a stored tokens.json as itself', () => {
  const tokens = { _meta: { file: 'Library' }, collections: {} };
  assert.equal(tokensOf({ kind: 'library', tokens, components: [] }), tokens);
  assert.equal(tokensOf(tokens), tokens);
});

test('a reference that resolves only in another resolution is refused, nothing written', () => {
  const s = snapshot();
  // The primitive exists in Light only; a single-mode collection aliasing it
  // sits in every build, so the dark builds cannot resolve it. Across all files
  // together it resolves, which is what verify-ts sees.
  s.collections['Primitives - Colour'].values.Light['Palette/Accent/9'] = '#0055ff';
  s.collections.Brand = { modes: ['Value'], values: { Value: { 'Accent/base': '#0055ff' } }, alias: { Value: { 'Accent/base': 'Palette/Accent/9' } } };
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  assert.throws(() => writeDtcg(s, dir), /2 reference\(s\) do not resolve inside their resolution, nothing written: dark-desktop: \{primitives-colour\.palette\.accent\.9\}; dark-mobile: /);
  assert.deepEqual(readdirSync(dir), [], 'a refused export writes nothing');
});
