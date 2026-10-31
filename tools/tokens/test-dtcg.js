#!/usr/bin/env node
/* Executable checks for tools/tokens/dtcg.js — the whole pure layer.
 * Run: node tools/tokens/test-dtcg.js   (exits non-zero on any failure)
 * Fixture is generic and invented; no project data. */

var path = require('path');
var DTCG = require(path.join(__dirname, 'dtcg.js'));

var pass = 0, fail = 0;
function ok(label, cond, got) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL  ' + label + (got === undefined ? '' : '  got: ' + JSON.stringify(got)));
}
function eq(label, a, b) { ok(label, JSON.stringify(a) === JSON.stringify(b), a); }

/* ---- A1 names ---- */
eq('slug lowercases and hyphenates', DTCG.slug('Corner radius'), 'corner-radius');
eq('slug splits camel case', DTCG.slug('SemiBold'), 'semi-bold');
eq('slug strips punctuation that would break references', DTCG.slug('1_5'), '1-5');
eq('slug removes dots — they are path separators', DTCG.slug('1.5'), '1-5');
eq('a leading minus survives — it is a value, not punctuation', DTCG.slug('-1'), 'minus-1');
eq('minus only applies to numbers, not to stray dashes', DTCG.slug('-soft'), 'soft');
eq('pathFor nests on the slash', DTCG.pathFor('Global Scale', 'Corner radius/Full'), ['global-scale', 'corner-radius', 'full']);
eq('refFor wraps in braces with dots', DTCG.refFor(['a', 'b', 'c']), '{a.b.c}');

/* ---- A2 colour ---- */
var red = { r: 1, g: 0, b: 0, a: 1 };
eq('hex is six digits, never eight', DTCG.hexOf({ r: 1, g: 0, b: 0, a: 0.5 }), '#ff0000');
eq('object colour is the 2025.10 shape', DTCG.colorValue(red, 'object'),
  { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1, hex: '#ff0000' });
eq('hex format carries alpha as eight digits', DTCG.colorValue({ r: 1, g: 0, b: 0, a: 0.5 }, 'hex'), '#ff000080');
eq('hex format drops alpha when opaque', DTCG.colorValue(red, 'hex'), '#ff0000');
eq('alpha defaults to 1 when absent', DTCG.colorValue({ r: 0, g: 0, b: 0 }, 'object').alpha, 1);

/* ---- A3 dimension ---- */
eq('dimension is an object, not a number', DTCG.dimension(16, 'px'), { value: 16, unit: 'px' });
eq('rem divides by the root size', DTCG.dimension(24, 'rem', 16), { value: 1.5, unit: 'rem' });
eq('rem honours a non-16 root', DTCG.dimension(20, 'rem', 10), { value: 2, unit: 'rem' });

/* ---- A4 font weight ---- */
eq('spaced display weight maps to a number', DTCG.fontWeight('Semi Bold'), 600);
eq('camel display weight maps to the same number', DTCG.fontWeight('SemiBold'), 600);
eq('regular is 400', DTCG.fontWeight('Regular'), 400);
eq('a lowercase run-together weight maps too (a variable holding "semibold" was skipped)', DTCG.fontWeight('semibold'), 600);
eq('extra-bold spelled three ways is one weight', [DTCG.fontWeight('ExtraBold'), DTCG.fontWeight('extrabold'), DTCG.fontWeight('Extra Bold')].join(), '800,800,800');
eq('numeric weights pass through', DTCG.fontWeight('700'), 700);
eq('out-of-range numeric is rejected', DTCG.fontWeight('1400'), null);
eq('unknown weight is rejected, not guessed', DTCG.fontWeight('Chonky'), null);

/* ---- A5 classification ---- */
eq('colour variables are colour', DTCG.classify({ name: 'Palette/Blue/4', type: 'COLOR' }), 'color');
eq('floats are dimensions by default', DTCG.classify({ name: 'Spacing/8', type: 'FLOAT' }), 'dimension');
eq('opacity floats are numbers', DTCG.classify({ name: 'Opacity/50', type: 'FLOAT' }), 'number');
eq('font family strings are fontFamily', DTCG.classify({ name: 'Font/Family/Text', type: 'STRING' }), 'fontFamily');
eq('font weight strings are fontWeight', DTCG.classify({ name: 'Font/Weight/Medium', type: 'STRING' }), 'fontWeight');
eq('other strings have no DTCG type', DTCG.classify({ name: 'Symbols/euro', type: 'STRING' }), 'unsupported');
eq('booleans have no DTCG type', DTCG.classify({ name: 'Flags/beta', type: 'BOOLEAN' }), 'unsupported');
eq('a group hint overrides the heuristic', DTCG.classify({ name: 'Blur/32', type: 'FLOAT' }, { groups: { Blur: 'number' } }), 'number');

/* ---- A6 opacity scale ---- */
eq('a 0-100 group is detected as percent', DTCG.opacityScale([0, 4, 50]), 100);
eq('a 0-1 group is left alone', DTCG.opacityScale([0, 0.04, 0.5]), 1);
eq('an explicit scale wins over detection', DTCG.opacityScale([0, 4, 50], 'unit'), 1);

/* ---- fixture: two collections, aliases across them ---- */
var snapshot = {
  collections: [
    {
      name: 'Primitive Scale', modes: ['Value'],
      variables: [
        { name: 'Palette/Blue/4', type: 'COLOR', hidden: true, values: { Value: { r: 0, g: 0, b: 1, a: 1 } } },
        { name: 'Spacing/8', type: 'FLOAT', hidden: true, values: { Value: 8 } },
        { name: 'Opacity/50', type: 'FLOAT', hidden: true, values: { Value: 50 } },
        { name: 'Font/Family/Text', type: 'STRING', hidden: true, values: { Value: 'Example Sans' } },
        { name: 'Font/Weight/Semi Bold', type: 'STRING', hidden: true, values: { Value: 'Semi Bold' } },
        { name: 'Symbols/euro', type: 'STRING', hidden: true, values: { Value: '€' } }
      ]
    },
    {
      name: 'Semantic', modes: ['Light', 'Dark'],
      variables: [
        {
          name: 'Background/base', type: 'COLOR', hidden: false, description: 'Page background',
          values: {
            Light: { alias: { collection: 'Primitive Scale', name: 'Palette/Blue/4' } },
            Dark: { alias: { collection: 'Primitive Scale', name: 'Palette/Blue/4' } }
          }
        }
      ]
    }
  ],
  textStyles: [
    {
      name: 'Heading/lg', fontFamily: 'Example Sans', fontWeight: 'SemiBold', fontSize: 32,
      lineHeight: { unit: 'PERCENT', value: 115 }, letterSpacing: { unit: 'PERCENT', value: -2 },
      bound: {
        fontFamily: { collection: 'Primitive Scale', name: 'Font/Family/Text' },
        fontSize: null, fontWeight: null
      }
    },
    {
      name: 'Body/md', fontFamily: 'Example Sans', fontWeight: 'Regular', fontSize: 16,
      lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PERCENT', value: 0 },
      bound: { fontFamily: null, fontSize: null, fontWeight: null }
    }
  ],
  effectStyleCount: 11
};

var built = DTCG.buildFiles(snapshot, { colorFormat: 'object', unit: 'px' });
var byName = {};
built.files.forEach(function (f) { byName[f.name] = f.tokens; });

/* ---- A7 files and modes ---- */
eq('a single-mode collection still gets a folder', DTCG.fileName('Primitive Scale', 'Value', true), 'primitive-scale/value.json');
eq('a mode is a file inside its collection folder', DTCG.fileName('Semantic', 'Light', false), 'semantic/light.json');
ok('one file per collection per mode, plus text styles',
  built.files.length === 4 && byName['primitive-scale/value.json'] && byName['semantic/light.json'] &&
  byName['semantic/dark.json'] && byName['text-style/value.json'],
  built.files.map(function (f) { return f.name; }));

/* ---- A8 token shape ---- */
var blue = byName['primitive-scale/value.json']['primitive-scale'].palette.blue['4'];
eq('a colour token carries $type and $value', [blue.$type, blue.$value.hex], ['color', '#0000ff']);
eq('spacing became a dimension object', byName['primitive-scale/value.json']['primitive-scale'].spacing['8'].$value, { value: 8, unit: 'px' });
eq('percent opacity became a unit number', byName['primitive-scale/value.json']['primitive-scale'].opacity['50'].$value, 0.5);
eq('the display weight became 600', byName['primitive-scale/value.json']['primitive-scale'].font.weight['semi-bold'].$value, 600);
ok('the untyped string was skipped, not invented',
  byName['primitive-scale/value.json']['primitive-scale'].symbols === undefined);
ok('and skipping it was reported',
  built.report.skipped.some(function (s) { return /euro/.test(s.name); }), built.report.skipped);
eq('provenance rides in $extensions',
  byName['primitive-scale/value.json']['primitive-scale'].spacing['8'].$extensions['com.figma.variables'].hiddenFromPublishing, true);
eq('descriptions survive', byName['semantic/light.json'].semantic.background.base.$description, 'Page background');

/* ---- A9 aliases become references, never resolved values ---- */
eq('an alias exports as a DTCG reference',
  byName['semantic/light.json'].semantic.background.base.$value, '{primitive-scale.palette.blue.4}');
ok('the reference is identical in both modes — the mode is in the file, not the path',
  byName['semantic/dark.json'].semantic.background.base.$value ===
  byName['semantic/light.json'].semantic.background.base.$value);

/* ---- A10 typography ---- */
var h = byName['text-style/value.json']['text-style'].heading.lg;
eq('typography is a composite token', h.$type, 'typography');
eq('a bound family exports as a reference', h.$value.fontFamily, '{primitive-scale.font.family.text}');
eq('an unbound size exports as a dimension', h.$value.fontSize, { value: 32, unit: 'px' });
eq('percent line height becomes a unitless multiplier', h.$value.lineHeight, 1.15);
eq('percent letter spacing resolves against the font size', h.$value.letterSpacing, { value: -0.64, unit: 'px' });
eq('the camel weight became 600 here too', h.$value.fontWeight, 600);
var body = byName['text-style/value.json']['text-style'].body.md;
ok('AUTO line height is omitted, not faked', body.$value.lineHeight === undefined, body.$value);
ok('and omitting it was reported',
  built.report.warnings.some(function (w) { return /AUTO/.test(w.reason); }), built.report.warnings);

/* ---- A11 manifest ---- */
eq('one build per mode permutation', built.manifest.builds.map(function (b) { return b.name; }), ['light', 'dark']);
ok('every build carries the single-mode files',
  built.manifest.builds.every(function (b) {
    return b.sources.indexOf('primitive-scale/value.json') !== -1 && b.sources.indexOf('text-style/value.json') !== -1;
  }), built.manifest.builds);
ok('and never two files of the same collection',
  built.manifest.builds.every(function (b) {
    return !(b.sources.indexOf('semantic/light.json') !== -1 && b.sources.indexOf('semantic/dark.json') !== -1);
  }), built.manifest.builds);

/* two genuinely different mode axes multiply */
var twoAxes = DTCG.buildManifest([
  { collection: 'A', single: false, variants: [{ mode: 'Light', file: 'a/light.json' }, { mode: 'Dark', file: 'a/dark.json' }] },
  { collection: 'B', single: false, variants: [{ mode: 'One', file: 'b/one.json' }, { mode: 'Two', file: 'b/two.json' }] }
]);
eq('two distinct mode axes produce their cartesian product',
  twoAxes.builds.map(function (b) { return b.name; }), ['light-one', 'light-two', 'dark-one', 'dark-two']);

/* ---- A11b two collections sharing a mode set are ONE axis (regression) ---- */
var shared = DTCG.buildManifest([
  { collection: 'Primitive', single: false, variants: [{ mode: 'Light', file: 'p/light.json' }, { mode: 'Dark', file: 'p/dark.json' }] },
  { collection: 'Semantic', single: false, variants: [{ mode: 'Light', file: 's/light.json' }, { mode: 'Dark', file: 's/dark.json' }] },
  { collection: 'Brand', single: false, variants: [{ mode: 'One', file: 'b/one.json' }, { mode: 'Two', file: 'b/two.json' }] }
]);
eq('collections sharing a mode set share an axis — 2x2, not 2x2x2',
  shared.builds.map(function (b) { return b.name; }), ['light-one', 'light-two', 'dark-one', 'dark-two']);
eq('and the shared step carries both collections’ files for that mode',
  shared.builds[0].sources, ['p/light.json', 's/light.json', 'b/one.json']);
ok('no build ever mixes Light from one tier with Dark from another',
  shared.builds.every(function (b) {
    return !(b.sources.indexOf('p/light.json') !== -1 && b.sources.indexOf('s/dark.json') !== -1) &&
           !(b.sources.indexOf('p/dark.json') !== -1 && b.sources.indexOf('s/light.json') !== -1);
  }), shared.builds);

/* ---- A12 effects are declared missing, not silently dropped ---- */
ok('the effect styles this version does not export are reported',
  built.report.notExported.length === 1 && built.report.notExported[0].count === 11,
  built.report.notExported);


/* ---- A13 colliding names are reported, never overwritten ---- */
var collide = DTCG.buildCollection({
  name: 'Scale', modes: ['Value'],
  variables: [
    { name: 'Offset/1', type: 'FLOAT', values: { Value: 1 } },
    { name: 'Offset/-1', type: 'FLOAT', values: { Value: -1 } },
    { name: 'Offset/_1', type: 'FLOAT', values: { Value: 99 } }
  ]
}, 'Value', {});
eq('a negative sibling gets its own path', collide.tokens.scale.offset['minus-1'].$value, { value: -1, unit: 'px' });
eq('the positive one is untouched', collide.tokens.scale.offset['1'].$value, { value: 1, unit: 'px' });
ok('a genuine collision is skipped, not written over',
  collide.skipped.length === 1 && /collides/.test(collide.skipped[0].reason), collide.skipped);
eq('and the first token of the pair survives intact', collide.tokens.scale.offset['1'].$value, { value: 1, unit: 'px' });


/* ---- A14 lossy renames are reported; ordinary case/space changes are not ---- */
ok('a space-only difference is not a lossy rename', !DTCG.isLossy('Semi Bold'));
ok('a plain word is not a lossy rename', !DTCG.isLossy('Blue'));
ok('an existing hyphen is not a rename — it maps to itself', !DTCG.isLossy('8-anchor'));
ok('nor is a hyphen mid-name', !DTCG.isLossy('primary-translucent'));
eq('a whole hyphenated path reports nothing', DTCG.renamedSegments('Colour/Background/AI/hue-1'), []);
ok('an underscore is lossy — it collapses to a hyphen', DTCG.isLossy('1_5'));
ok('a leading sign is lossy — it gets spelled out', DTCG.isLossy('-1'));
eq('only the lossy segment is named', DTCG.renamedSegments('Effects/Shadow/Position/-1'), ['-1']);
eq('a wholly ordinary name reports nothing', DTCG.renamedSegments('Font/Weight/Semi Bold'), []);

var parity = DTCG.buildFiles({
  collections: [{
    name: 'Scale', modes: ['Light', 'Dark'],
    variables: [
      { name: 'Stroke/1_5', type: 'FLOAT', values: { Light: 1.5, Dark: 1.5 } },
      { name: 'Spacing/8', type: 'FLOAT', values: { Light: 8, Dark: 8 } }
    ]
  }], textStyles: [], effectStyleCount: 0
}, {});
eq('the report names the Figma name and the path it became',
  parity.report.renamed.map(function (r) { return r.name + ' -> ' + r.path; }), ['Stroke/1_5 -> scale.stroke.1-5']);
ok('a rename is reported once, not once per mode', parity.report.renamed.length === 1, parity.report.renamed);


/* ---- A19 effect styles export as shadow tokens, inner layers included ---- */
var fxSnapshot = [
  { name: 'Elevation/drop', effects: [
    { type: 'DROP_SHADOW', visible: true, color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 2 }, radius: 4, spread: 0,
      bound: { color: { collection: 'Semantic', name: 'Shadow/soft' } } }
  ] },
  { name: 'Elevation/inner', effects: [
    { type: 'INNER_SHADOW', visible: true, color: { r: 1, g: 1, b: 1, a: 0.2 },
      offset: { x: 0, y: 2 }, radius: 4, spread: 0, bound: {} }
  ] },
  { name: 'Elevation/composite', effects: [
    { type: 'DROP_SHADOW', visible: true, color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 2 }, radius: 4, spread: 0, bound: {} },
    { type: 'INNER_SHADOW', visible: true, color: { r: 1, g: 1, b: 1, a: 0.2 }, offset: { x: 0, y: 2 }, radius: 4, spread: 0, bound: {} }
  ] },
  { name: 'Elevation/hidden', effects: [
    { type: 'DROP_SHADOW', visible: false, color: { r: 0, g: 0, b: 0, a: 1 }, offset: { x: 0, y: 0 }, radius: 0, spread: 0, bound: {} }
  ] },
  { name: 'Elevation/blur', effects: [
    { type: 'LAYER_BLUR', visible: true, radius: 8, bound: {} }
  ] }
];
var fx = DTCG.buildEffectStyles(fxSnapshot, {});
var drop = fx.tokens['effect-style'].elevation.drop;
eq('a drop shadow is a shadow token', drop.$type, 'shadow');
eq('a bound colour stays a reference', drop.$value.color, '{semantic.shadow.soft}');
eq('an unbound offset becomes a dimension', drop.$value.offsetY, { value: 2, unit: 'px' });
ok('a drop shadow carries no inset', drop.$value.inset === undefined, drop.$value);

var inner = fx.tokens['effect-style'].elevation.inner;
eq('an inner shadow carries inset', inner.$value.inset, true);
ok('inset is DTCG 2025.10, so nothing is mirrored into $extensions', inner.$extensions === undefined, inner.$extensions);

var comp = fx.tokens['effect-style'].elevation.composite;
ok('a layered style is an array', Array.isArray(comp.$value) && comp.$value.length === 2, comp.$value);
eq('with inset on the layer that needs it, listed top first: Figma paints its last effect on top, CSS its first',
  comp.$value.map(function (l) { return !!l.inset; }), [true, false]);

ok('a hidden layer is dropped and reported', fx.tokens['effect-style'].elevation.hidden === undefined &&
  fx.warnings.some(function (w) { return /hidden/.test(w.reason); }), fx.warnings);
ok('a non-shadow effect is reported, never invented',
  fx.tokens['effect-style'].elevation.blur === undefined &&
  fx.warnings.some(function (w) { return /LAYER_BLUR/.test(w.reason); }), fx.warnings);
ok('a style with nothing expressible is skipped, not emitted empty',
  fx.skipped.length === 2, fx.skipped);

/* ---- A23 the kind segment can sit anywhere in the name ---- */
eq('a trailing family segment is fontFamily', DTCG.classify({ name: 'Label/md/family', type: 'STRING' }), 'fontFamily');
eq('a trailing weight segment is fontWeight', DTCG.classify({ name: 'Label/md/weight', type: 'STRING' }), 'fontWeight');
eq('a trailing opacity segment is a number', DTCG.classify({ name: 'State/Disabled/opacity', type: 'FLOAT' }), 'number');
eq('a leading opacity segment still is', DTCG.classify({ name: 'Opacity/disabled', type: 'FLOAT' }), 'number');
var opa = DTCG.buildCollection({ name: 'State', modes: ['Value'], variables: [
  { name: 'State/Disabled/opacity', type: 'FLOAT', values: { Value: 50 } },
  { name: 'State/Focus/stroke-width', type: 'FLOAT', values: { Value: 2 } }
] }, 'Value', { noExtensions: true });
eq('a 0–100 opacity under a nested name lands as a unit number, not a dimension',
  opa.tokens.state.state.disabled.opacity, { $type: 'number', $value: 0.5 });
eq('its dimension neighbour is untouched', opa.tokens.state.state.focus['stroke-width'].$value, { value: 2, unit: 'px' });

/* ---- A24 a measured AUTO line height is exported; an unmeasured one is omitted ---- */
var measured = DTCG.typographyToken({ name: 'Body', fontFamily: 'Example Sans', fontWeight: 'Regular', fontSize: 16,
  lineHeight: { unit: 'MEASURED', value: 19 }, letterSpacing: { unit: 'PERCENT', value: 0 } });
eq('a measured AUTO becomes the multiplier the render used', measured.token.$value.lineHeight, 1.1875);
eq('and raises no warning', measured.warnings.length, 0);
var unmeasured = DTCG.typographyToken({ name: 'Body', fontFamily: 'Example Sans', fontWeight: 'Regular', fontSize: 16,
  lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PERCENT', value: 0 } });
ok('an AUTO the collector could not measure is omitted and says so',
  unmeasured.token.$value.lineHeight === undefined && /could not be measured/.test(unmeasured.warnings[0].reason), unmeasured.warnings);

/* ---- A25 colour styles: solid → color, linear gradient → gradient, the rest reported ---- */
var ps = DTCG.buildPaintStyles([
  { name: 'Background/Main/base', paints: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 }, bound: { color: { collection: 'Semantic', name: 'Background/Neutral/base' } } }] },
  { name: 'Background/Intro/pink', paints: [{ type: 'GRADIENT_LINEAR', angle: 180, stops: [
    { position: 0.5, color: { r: 1, g: 0.9, b: 0.97, a: 1 }, bound: { color: { collection: 'Semantic', name: 'Background/Supportive/Pink/soft' } } },
    { position: 1, color: { r: 1, g: 0.78, b: 0.95, a: 1 }, bound: { color: null } }
  ] }] },
  { name: 'Background/Radial', paints: [{ type: 'GRADIENT_RADIAL' }] },
  { name: 'Background/Photo', paints: [{ type: 'IMAGE' }] }
], { colorFormat: 'hex' });
eq('a bound solid is a color reference', ps.tokens['color-style'].background.main.base,
  { $type: 'color', $value: '{semantic.background.neutral.base}' });
var grad = ps.tokens['color-style'].background.intro.pink;
eq('a linear gradient is DTCG gradient stops, bound where bound, literal where not', grad.$value,
  [{ color: '{semantic.background.supportive.pink.soft}', position: 0.5 }, { color: '#ffc7f2', position: 1 }]);
eq('the angle rides in $extensions because the type has no direction', grad.$extensions['com.figma.variables'].angle, 180);
eq('radial and image paints are reported, never invented', ps.skipped.map(function (k) { return k.name; }),
  ['Background/Radial', 'Background/Photo']);
var withPaints = DTCG.buildFiles({ collections: [], paintStyles: [{ name: 'A/b', paints: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }] }] }, {});
eq('colour styles get their own folder and a single-mode axis', withPaints.files[0].name, 'color-style/value.json');
var optedOut = DTCG.buildFiles({ collections: [], paintStyles: [], paintStyleCount: 4 }, {});
ok('opting out is reported with the count', optedOut.report.notExported.some(function (n) { return /colour styles/.test(n.what) && n.count === 4; }), optedOut.report);

ok('the sandbox copy of the weight table is the parity engine\'s one table, name for name', JSON.stringify(DTCG.WEIGHTS) === JSON.stringify(require('../parity/values.mjs').WEIGHTS));
ok('a weight reads hyphenated, spaced or run together', DTCG.fontWeight('Demi-Bold') === 600 && DTCG.fontWeight('Extra Black') === 950 && DTCG.fontWeight('toString') === null);

console.log((fail ? 'FAILED' : 'ok') + ' — ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
