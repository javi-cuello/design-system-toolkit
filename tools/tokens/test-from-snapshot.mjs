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

import { snapshot } from './fixture-snapshot.mjs';

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

test('a string Figma scopes to font family is a fontFamily where its name says no kind, and so is the one it aliases; a weight is never taken from a scope', () => {
  const t = {
    collections: {
      Theme: { modes: ['Base'], values: { Base: { 'Static/Font/Brand': 'Roboto' } }, scopes: { 'Static/Font/Brand': [] } },
      Scale: { modes: ['Base'], values: { Base: { 'Display/Font': 'Roboto', 'Display/Label': 'x' } }, alias: { Base: { 'Display/Font': 'Static/Font/Brand' } }, scopes: { 'Display/Font': ['FONT_FAMILY'], 'Display/Label': ['TEXT_CONTENT'] } },
      Weight: { modes: ['Base'], values: { Base: { 'Emphasis': 'Bold Italic', 'Strong': 'Bold Italic' } }, alias: { Base: { Strong: 'Emphasis' } }, scopes: { Strong: ['FONT_WEIGHT'], Emphasis: [] } },
    },
  };
  const vars = Object.fromEntries(toDtcgSnapshot(t).collections.flatMap((c) => c.variables).map((v) => [v.name, v.font]));
  assert.deepEqual(vars, { 'Static/Font/Brand': 'fontFamily', 'Display/Font': 'fontFamily', 'Display/Label': undefined, Emphasis: undefined, Strong: undefined }, 'a weight is not taken from a scope');
  // the name decides first, and a family never references what its name types otherwise: Display/Font, scoped a family,
  // aliases Brand/weight, a weight by name the build skips ("Bold Italic"), so it is no family and the build writes
  const named = { collections: { A: { modes: ['Base'], values: { Base: { 'Brand/weight': 'Bold Italic', 'Display/Font': 'Bold Italic' } }, alias: { Base: { 'Display/Font': 'Brand/weight' } }, scopes: { 'Brand/weight': ['FONT_FAMILY'], 'Display/Font': ['FONT_FAMILY'] } } } };
  assert.equal(toDtcgSnapshot(named).collections[0].variables.find((v) => v.name === 'Display/Font').font, undefined);
  const nd = mkdtempSync(join(tmpdir(), 'dtcg-')); writeDtcg(named, nd);
  // nor one whose name is also a group: typed, Brand/Font would take the path Brand/Font/Family needs
  const grouped = { collections: { T: { modes: ['Base'], values: { Base: { 'Brand/Font': 'Roboto', 'Brand/Font/Family': 'Inter', 'Body/Family': 'Inter' } }, alias: { Base: { 'Body/Family': 'Brand/Font/Family' } }, scopes: { 'Brand/Font': ['FONT_FAMILY'] } } } };
  writeDtcg(grouped, mkdtempSync(join(tmpdir(), 'dtcg-')));
  // and a string a text style binds as its family is a family, whatever its name and scope
  const bound = { collections: { Type: { modes: ['Base'], values: { Base: { 'Body/Font family': 'Plex' } }, alias: {}, scopes: { 'Body/Font family': ['ALL_SCOPES'] } } },
    textStyles: [{ name: 'Body', family: 'Plex', weight: 'Regular', size: 14, lineHeight: 1.5, bound: { fontFamily: { collection: 'Type', name: 'Body/Font family' } } }] };
  assert.equal(toDtcgSnapshot(bound).collections[0].variables[0].font, 'fontFamily');
  writeDtcg(bound, mkdtempSync(join(tmpdir(), 'dtcg-')));
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(t, dir); // and the build writes: no reference left to a string it skips
});

test('a numeric weight is a fontWeight by scope, by name, by binding or along an alias; a length never is', () => {
  const V = { 'Heavy': 700, 'font/Body M/Font weight': 400, 'Strong': 700, 'Base/653': 653, 'Display/Font weight': 653, 'Body/W': 500,
    'Stroke/Weight/thin': 1, 'Line weight': 200, 'Number/400': 400, 'Quiet/Font weight': 400, 'Panel/width': 400, 'Odd/Font weight': 0 };
  const t = { collections: { T: { modes: ['V'], values: { V }, alias: { V: { Strong: 'Heavy', 'Display/Font weight': 'Base/653', 'Quiet/Font weight': 'Number/400', 'Panel/width': 'Number/400' } },
    scopes: { Heavy: ['FONT_WEIGHT'], 'font/Body M/Font weight': ['TEXT_CONTENT'], Strong: ['ALL_SCOPES'], 'Body/W': ['ALL_SCOPES'], 'Stroke/Weight/thin': ['STROKE_FLOAT'], 'Panel/width': ['WIDTH_HEIGHT'] } } },
    textStyles: [{ name: 'Body', family: 'Inter', weight: 'Medium', size: 14, lineHeight: 1.5, bound: { fontWeight: { collection: 'T', name: 'Body/W' } } }] };
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(t, dir);
  const at = (n) => DTCG.pathFor('T', n).reduce((o, k) => o[k], JSON.parse(readFileSync(join(dir, 't', readdirSync(join(dir, 't'))[0]), 'utf8')));
  const got = (n) => [at(n).$type, at(n).$value];
  assert.deepEqual(got('Heavy'), ['fontWeight', 700], 'scoped');
  assert.deepEqual(got('font/Body M/Font weight'), ['fontWeight', 400], 'named only, scoped to text content');
  assert.deepEqual(got('Strong'), ['fontWeight', '{t.heavy}'], 'an alias to a weight');
  assert.deepEqual([got('Display/Font weight')[0], ...got('Base/653')], ['fontWeight', 'fontWeight', 653], 'the target of a weight');
  assert.deepEqual(got('Body/W'), ['fontWeight', 500], 'bound by a text style');
  const style = JSON.parse(readFileSync(join(dir, 'text-style/value.json'), 'utf8'))['text-style'].body;
  assert.equal(style.$value.fontWeight, `{${DTCG.pathFor('T', 'Body/W').join('.')}}`, 'the style references the number');
  for (const n of ['Stroke/Weight/thin', 'Line weight', 'Odd/Font weight']) assert.equal(at(n).$type, 'dimension', `${n} stays a length`);
  for (const n of ['Number/400', 'Quiet/Font weight', 'Panel/width']) assert.equal(at(n).$type, 'dimension', `${n}: a number a length shares stays one, and so does what aliases it`);
});

test('a weight keeps shared numbers lengths, and a style bound to one takes the number', () => {
  const type = (V, alias = {}, scopes = {}, bound = null, effects = []) => {
    const r = toDtcgSnapshot({ collections: { T: { modes: ['V'], values: { V }, alias: { V: alias }, scopes } }, effects,
      textStyles: bound ? [{ name: 'Body', family: 'Inter', weight: 'Medium', size: 100, lineHeight: 1.5, bound }] : [] });
    return { of: Object.fromEntries(r.collections[0].variables.map((v) => [v.name, DTCG.classify(v)])), style: r.textStyles[0]?.bound.fontWeight };
  };
  const b = (name) => ({ collection: 'T', name });
  let r = type({ 'Panel/width': 500, 'Number/500': 500 }, { 'Panel/width': 'Number/500' }, {}, { fontWeight: b('Number/500') });
  assert.deepEqual(r, { of: { 'Panel/width': 'dimension', 'Number/500': 'dimension' }, style: null }, 'a binding does not pass up to what else aliases the number; the style takes its own 500');
  r = type({ 'Thin/Font weight': 100, 'Scale/100': 100 }, { 'Thin/Font weight': 'Scale/100' }, {}, { fontSize: b('Scale/100') });
  assert.equal(r.of['Scale/100'], 'dimension', 'a number bound as a font size is a length');
  r = type({ 'Thin/Font weight': 100, 'Scale/100': 100 }, { 'Thin/Font weight': 'Scale/100' }, {}, null, [{ name: 'Lift', layers: [{ bound: { y: b('Scale/100') } }] }]);
  assert.equal(r.of['Scale/100'], 'dimension', "a number bound as a shadow's offset is a length");
  r = type({ 'Button/W': 700, 'Body/W': 700, 'Font weight/Bold': 700 }, { 'Button/W': 'Body/W', 'Body/W': 'Font weight/Bold' }, {}, { fontWeight: b('Body/W') });
  assert.deepEqual([...new Set(Object.values(r.of))], ['fontWeight'], 'a bound number that aliases a named weight passes it up');
  for (const field of ['lineHeight', 'letterSpacing']) {
    r = type({ 'Thin/Font weight': 100, 'Scale/100': 100 }, { 'Thin/Font weight': 'Scale/100' }, {}, { [field]: b('Scale/100') });
    assert.equal(r.of['Scale/100'], 'dimension', `a number bound as ${field} is a length`);
  }
  r = type({ 'Body/W': 450.5 }, {}, { 'Body/W': ['FONT_WEIGHT'] }, { fontWeight: b('Body/W') });
  assert.deepEqual(r, { of: { 'Body/W': 'dimension' }, style: null }, 'a style never references a length as its weight');
  r = type({ Outer: 400, Mid: 400, bodyFontWeight: 400, 'Opacity/Font weight': 40, Styled: 600 }, { Outer: 'Mid', Mid: 'bodyFontWeight' }, { Styled: ['FONT_WEIGHT', 'FONT_STYLE'] });
  assert.deepEqual(r.of, { Outer: 'fontWeight', Mid: 'fontWeight', bodyFontWeight: 'fontWeight', 'Opacity/Font weight': 'number', Styled: 'fontWeight' });
  r = type({ Width: 400, Number: 400, 'Font weight': 400, Outer: 400 }, { Width: 'Number', 'Font weight': 'Number', Outer: 'Font weight' }, { Width: ['WIDTH_HEIGHT'] });
  assert.deepEqual([...new Set(Object.values(r.of))], ['dimension'], 'a chain undone is undone to its end');
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

test('the design in $extensions (tracking fraction, paragraph and list spacing) survives noExtensions, under the vendor key given', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(snapshot(), dir, { noExtensions: true, vendor: 'com.example' });
  const t = JSON.parse(readFileSync(join(dir, 'text-style/value.json'), 'utf8'))['text-style'].heading.lg;
  assert.deepEqual(t.$extensions, { 'com.example': { letterSpacingEm: 0, paragraphSpacing: { value: 0, unit: 'px' }, listSpacing: { value: 0, unit: 'px' } } });
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

test('two collections whose names slug alike are refused, nothing written', () => {
  const s = snapshot();
  s.collections.semantic = { modes: ['Light', 'Dark'], values: { Light: { 'A/b': '#000000' }, Dark: { 'A/b': '#ffffff' } }, alias: {} };
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  assert.throws(() => writeDtcg(s, dir), /"Semantic" and "semantic" both become semantic\//);
  assert.deepEqual(readdirSync(dir), []);
  // modes that differ still share the folder and the token paths
  const t = snapshot();
  t.collections['Text style'] = { modes: ['Light', 'Dark'], values: { Light: { 'Heading/lg': '#000000' }, Dark: { 'Heading/lg': '#ffffff' } }, alias: {} };
  assert.throws(() => writeDtcg(t, dir), /"Text style" and "text-style" both become text-style\//);
  assert.deepEqual(readdirSync(dir), []);
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
  // (one resolution it fails in is named per reference: the list of every one is the product of the modes)
  assert.throws(() => writeDtcg(s, dir), /1 reference\(s\) do not resolve inside their resolution, nothing written: dark-desktop: \{primitives-colour\.palette\.accent\.9\}/);
  assert.deepEqual(readdirSync(dir), [], 'a refused export writes nothing');
});

test("another library's variable a local one names at the same values is that one: left out, said, and an alias to it lands on the local one", () => {
  const t = { collections: {
    Theme: { modes: ['Value'], values: { Value: { Transparent: '#00000000', Ink: '#000000' } }, alias: {} },
    Colors: { modes: ['Value'], values: { Value: { Transparent: '#00000000', 'Gray/100': '#111111', Shade: '#ffffff00' } }, alias: { Value: { Shade: 'Transparent' } }, remote: true },
  } };
  const snap = toDtcgSnapshot(t), cols = Object.fromEntries(snap.collections.map((c) => [c.name, c.variables]));
  assert.deepEqual(cols.Colors.map((v) => v.name), ['Gray/100', 'Shade']);
  assert.deepEqual(cols.Colors[1].values.Value, { alias: { collection: 'Theme', name: 'Transparent' } });
  assert.deepEqual(snap.deduped, [{ name: 'Colors/Transparent', reason: "a copy of Theme's, the same in every mode" }]);
  // one at other values, or in other modes, is a token of its own, which the build writes with its collection; an alias
  // in its library lands on it, never on this file's
  for (const theme of [{ modes: ['Value'], values: { Value: { Transparent: '#ffffff00' } } }, { modes: ['Light', 'Dark'], values: { Light: { Transparent: '#00000000' }, Dark: { Transparent: '#00000000' } } }]) {
    const own = toDtcgSnapshot({ collections: { ...t.collections, Theme: { ...theme, alias: {} } } });
    const v = Object.fromEntries(own.collections.map((c) => [c.name, c.variables]));
    assert.deepEqual(v.Colors.map((x) => x.name), ['Transparent', 'Gray/100', 'Shade']);
    assert.deepEqual(v.Colors[2].values.Value, { alias: { collection: 'Colors', name: 'Transparent' } });
    assert.deepEqual(own.deduped, []);
  }
  // and between two other libraries' collections (an old copy of a foundations library beside its new one), the first holds it
  const two = { collections: { Old: { modes: ['V'], values: { V: { Space0: 0, Space1: 1 } }, alias: {}, remote: true }, New: { modes: ['V'], values: { V: { Space0: 0, Space2: 2 } }, alias: {}, remote: true } } };
  assert.deepEqual(toDtcgSnapshot(two).collections.map((c) => c.variables.map((v) => v.name)), [['Space0', 'Space1'], ['Space2']]);
  // compared as CSS writes them: an emoji or a separator CSS drops makes no second property, within one collection too
  const css = { collections: { Lib: { modes: ['V'], values: { V: { 'logo/text': 1, 'logo - text': 2, '🌮 Weight/Bold': 700, 'Weight/Bold': 700 } }, alias: {}, remote: true } } };
  assert.deepEqual(toDtcgSnapshot(css).collections[0].variables.map((v) => v.name), ['logo/text', '🌮 Weight/Bold']);
  assert.deepEqual(toDtcgSnapshot(css).deduped.map((d) => d.name), ['Lib/logo - text', 'Lib/Weight/Bold'], 'each one left out is said');
  // a reference to one left out goes to the one holding its name, an alias and a text style's binding alike
  const ref = { collections: {
    Type: { modes: ['V'], values: { V: { 'Font Weight/Bold': 700, 'Font/Sans': 'Inter' } }, alias: {} },
    Lib: { modes: ['V'], values: { V: { '🌮 Font Weight/Bold': 700, '🌮 Font/Sans': 'Inter', Strong: 700 } }, alias: { V: { Strong: '🌮 Font Weight/Bold' } }, remote: true },
  }, textStyles: [{ name: 'Body', fontFamily: 'Inter', fontWeight: 700, fontSize: 16, bound: { fontFamily: { collection: 'Lib', name: '🌮 Font/Sans' }, fontWeight: { collection: 'Lib', name: '🌮 Font Weight/Bold' } } }] };
  const r = toDtcgSnapshot(ref);
  assert.deepEqual(r.collections[1].variables.find((v) => v.name === 'Strong').values.V, { alias: { collection: 'Type', name: 'Font Weight/Bold' } });
  assert.deepEqual(r.textStyles[0].bound.fontWeight, { collection: 'Type', name: 'Font Weight/Bold' });
  assert.equal(r.collections[0].variables.find((v) => v.name === 'Font/Sans').font, 'fontFamily', 'the binding marks the holder a family');
  // a paint style bound to a numbered remote collection's variable, or to one left out, names its home
  const paint = { collections: {
    Color: { modes: ['V'], values: { V: { ink: '#000000' } }, alias: {} },
    '🌮 Color': { modes: ['V'], values: { V: { brand: '#0000ff', '🌮 ink': '#000000' } }, alias: {}, remote: true },
  }, paintStyles: [{ name: 'Brand', paints: [{ type: 'SOLID', color: 'brand' }] }, { name: 'Ink', paints: [{ type: 'SOLID', color: '🌮 ink' }] }] };
  const ps = toDtcgSnapshot(paint).paintStyles;
  assert.deepEqual([ps[0].paints[0].bound.color, ps[1].paints[0].bound.color], [{ collection: 'color-2', name: 'brand' }, { collection: 'Color', name: 'ink' }]);
  // and a text style bound to the shadowed one binds the local one, marked a family there
  const typed = { collections: { Local: { modes: ['M'], values: { M: { 'Body/Font': 'Inter' } }, alias: {} }, Lib: { modes: ['M'], values: { M: { 'Body/Font': 'Inter' } }, alias: {}, remote: true } },
    textStyles: [{ name: 'Body', family: 'Inter', weight: 'Regular', size: 14, lineHeight: 1.5, bound: { fontFamily: { collection: 'Lib', name: 'Body/Font' } } }] };
  assert.equal(toDtcgSnapshot(typed).collections.find((c) => c.name === 'Local').variables[0].font, 'fontFamily');
  writeDtcg(typed, mkdtempSync(join(tmpdir(), 'dtcg-')));
});

test("another library's collection that slugs like one already taken is numbered, for the build and the mode axes alike", async () => {
  const MODES = createRequire(import.meta.url)('./modes.cjs');
  const t = { collections: {
    Spacing: { modes: ['Mode 1'], values: { 'Mode 1': { '-025': -2 } }, alias: {} },
    '🌮 Spacing': { modes: ['Mode 1'], values: { 'Mode 1': { 'space/025': 2 } }, alias: {}, remote: true },
    Ref: { modes: ['Mode 1'], values: { 'Mode 1': { gap: 2 } }, alias: { 'Mode 1': { gap: 'space/025' } }, remote: true },
    Color: { modes: ['Light', 'Dark'], values: { Light: { ink: '#000000' }, Dark: { ink: '#ffffff' } }, alias: {}, remote: true },
    '🌮 Color': { modes: ['Light', 'Dark'], values: { Light: { paper: '#ffffff' }, Dark: { paper: '#000000' } }, alias: {}, remote: true },
  } };
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(t, dir);
  const two = JSON.parse(readFileSync(join(dir, 'spacing-2/value.json'), 'utf8'))['spacing-2'].space['025'];
  assert.equal(two.$value.value, 2);
  assert.equal(two.$extensions['com.figma.variables'].collection, '🌮 Spacing', 'the Figma name stays in the extensions');
  assert.equal(JSON.parse(readFileSync(join(dir, 'ref/value.json'), 'utf8')).ref.gap.$value, '{spacing-2.space.025}');
  const axis = MODES.axesOfTokens(t).find((a) => a.kind === 'theme');
  assert.deepEqual([axis.members, MODES.modeOf([axis], '🌮 Color', 'Dark')], [['color', 'color-2'], { key: 'theme', value: 'dark' }]);
  // two local ones are still refused
  assert.throws(() => writeDtcg({ collections: { Spacing: t.collections.Spacing, '🌮 Spacing': { ...t.collections['🌮 Spacing'], remote: false } } }, mkdtempSync(join(tmpdir(), 'dtcg-'))), /both become spacing\//);
});

test('a name that is a token and a group is a group with its own token, $root, and a reference to it says so', () => {
  const t = { collections: { Color: { modes: ['Light'], values: { Light: { 'text/warning': '#ff0000', 'text/warning/inverse': '#00ff00', 'icon/warning': '#ff0000' } }, alias: { Light: { 'icon/warning': 'text/warning' } } } } };
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(t, dir);
  const c = JSON.parse(readFileSync(join(dir, 'color/value.json'), 'utf8')).color;
  assert.ok(c.text.warning.$root.$value && c.text.warning.inverse.$value);
  assert.equal(c.icon.warning.$value, '{color.text.warning.$root}');
  // a text style that is also a group keeps its paragraph and list spacing
  const ts = { collections: {}, textStyles: [
    { name: 'Heading', fontFamily: 'Inter', fontWeight: 600, fontSize: 20, lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PIXELS', value: 0 }, paragraphSpacing: 12, bound: {} },
    { name: 'Heading/Large', fontFamily: 'Inter', fontWeight: 600, fontSize: 28, lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PIXELS', value: 0 }, bound: {} }] };
  const d3 = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(ts, d3);
  const tsf = readdirSync(d3, { recursive: true }).find((f) => /text-style.*\.json$/.test(f));
  const h = JSON.parse(readFileSync(join(d3, tsf), 'utf8'))['text-style'].heading.$root;
  assert.equal(Object.values(h.$extensions).find((e) => e.paragraphSpacing).paragraphSpacing.value, 12);
  // a group in one mode's file and a plain token in another's (the child skipped in Dark) is one shape in both
  const m = { collections: { Type: { modes: ['Light', 'Dark'], values: { Light: { w: '#000000', 'w/x': '#111111' }, Dark: { w: '#ffffff' } }, alias: {} },
    Use: { modes: ['Value'], values: { Value: { u: '#000000' } }, alias: { Value: { u: 'w' } } } } };
  const d2 = mkdtempSync(join(tmpdir(), 'dtcg-'));
  writeDtcg(m, d2);
  const dark = JSON.parse(readFileSync(join(d2, 'type/dark.json'), 'utf8')).type;
  assert.ok(dark.w.$root && dark.w.$root.$value, JSON.stringify(dark));
  assert.equal(JSON.parse(readFileSync(join(d2, 'use/value.json'), 'utf8')).use.u.$value, '{type.w.$root}');
});

test("the default mode the snapshot records is the resolver's default, whatever the modes' order", () => {
  const t = { collections: { Brand: { modes: ['Accent', 'Light'], defaultMode: 'Light', values: { 'Accent': { Stroke: 1 }, Light: { Stroke: 2 } }, alias: {} } } };
  const d = mkdtempSync(join(tmpdir(), 'dtcg-default-'));
  writeDtcg(t, d);
  assert.equal(JSON.parse(readFileSync(join(d, RESOLVER), 'utf8')).modifiers.brand.default, 'light');
});

test("another library's variable joined into a collection of the same name resolves in its own default mode where a mode is the other library's", () => {
  // two libraries' collections of one name, joined by the snapshot (a mode only one side has holds only that side's
  // variables): Figma resolves a variable in its own collection, whose mode a layer set for the other library's does not
  // select, so in that mode it takes its own collection's default (2026-11-28: a type collection's font families,
  // bound by text styles, missing in the other library's modes refused the whole export)
  const t = { collections: {
    Type: { remote: true, modes: ['Sans', 'System', 'Other'], defaultMode: 'Sans',
      values: { Sans: { 'Family/Body': 'Inter' }, System: { 'Family/Body': 'SF Pro' }, Other: { 'Size/Body': 14 } }, alias: {} },
    Brand: { modes: ['Value'], values: { Value: { 'Body font': 'Inter' } }, alias: { Value: { 'Body font': 'Family/Body' } } },
  } };
  const v = toDtcgSnapshot(t).collections.find((c) => c.name === 'Type').variables;
  const fam = v.find((x) => x.name === 'Family/Body'), size = v.find((x) => x.name === 'Size/Body');
  assert.deepEqual(fam.values, { Sans: 'Inter', System: 'SF Pro', Other: 'Inter' }, 'the default mode\'s value in the other library\'s mode');
  assert.deepEqual(size.values, { Other: 14 }, 'a variable its own default mode does not hold is never given one');
  // (a local collection's gap is no join: still refused, the test above)
  writeDtcg(t, mkdtempSync(join(tmpdir(), 'dtcg-joined-')));
  // a lone remote collection's gap, in a mode of its own that holds the default's other variables, is no join: still refused
  const lone = { collections: {
    Palette: { remote: true, modes: ['Light', 'Dark'], defaultMode: 'Light', values: { Light: { 'Accent/9': '#0055ff', 'Grey/12': '#111111' }, Dark: { 'Grey/12': '#eeeeee' } }, alias: {} },
    Brand: { modes: ['Value'], values: { Value: { 'Accent/base': '#0055ff' } }, alias: { Value: { 'Accent/base': 'Accent/9' } } },
  } };
  assert.deepEqual(toDtcgSnapshot(lone).collections.find((c) => c.name === 'Palette').variables.find((x) => x.name === 'Accent/9').values, { Light: { r: 0, g: 1 / 3, b: 1, a: 1 } }, 'no value given in a mode of its own');
  assert.throws(() => writeDtcg(lone, mkdtempSync(join(tmpdir(), 'dtcg-lone-'))), /do not resolve inside their resolution/);
});

test('the declarations under each mode\'s attribute are read from the built sheet, at any nesting, comments aside, each with the at-rule it sits in', () => {
  const MODES = createRequire(import.meta.url)('./sheet.cjs');
  const css = ':root {\n  --ink: red;\n}\n[data-tone="link"] {\n  --ink: var(--blue); /* a link */\n  --edge: 1px;\n}\n@media screen {\n  [data-theme="dark"] {\n    --ink: white;\n  }\n}\n.x [data-tone="no"] {\n  --ink: 0;\n}\n';
  const b = MODES.blocksOf(css);
  assert.deepEqual(b.tone.link, [['--ink', 'var(--blue)', null], ['--edge', '1px', null]]);
  assert.deepEqual(b.theme.dark, [['--ink', 'white', '@media screen']], 'a block under a media query keeps it');
  assert.deepEqual(MODES.blocksOf('[data-a="x"] {\n  --p: 1;\n}\n[data-a="y"] {\n  --p: 2;\n}\n').a, { x: [['--p', '1', null]], y: [['--p', '2', null]] }, 'one block after another');
  assert.deepEqual(MODES.blocksOf('[data-a="x"] { --p: "}" ; --q: 2 }').a.x.map((d) => d[0]), ['--p', '--q'], 'a brace in a string closes nothing');
  assert.equal(b.tone.no, undefined, 'a rule naming more than the attribute is no mode block');
  assert.deepEqual(MODES.blocksOf(''), {});
});
