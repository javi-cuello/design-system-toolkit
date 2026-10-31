/* Tests for scripts/docgen.js — run: node tests/test-docgen.js
 *
 * Every case below pins a defect this skill actually shipped, named in the
 * assertion. A test that does not correspond to a real failure is a test that
 * will be deleted the first time it gets in the way, so none are written.
 */
var D = require('../scripts/docgen.js');

var pass = 0, fail = 0, failures = [];
function eq(actual, expected, label) {
  var a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; return; }
  fail++; failures.push(label + '\n    expected ' + e + '\n    actual   ' + a);
}
function ok(cond, label) { eq(!!cond, true, label); }
function names(rows) { return rows.map(function (r) { return r.rn; }); }

/* --- parseNum leniency is load-bearing -------------------------------------
   A strict /^\d+$/ looks like a cleanup and silently reorders every annotated
   scale — "7 - anchor" gets flushed past the end of its own ramp. */
eq(D.parseNum('7 - anchor'), 7, 'parseNum: annotated anchor step keeps its position');
eq(D.parseNum('9-anchor'), 9, 'parseNum: hyphenated anchor');
eq(D.parseNum('1_5'), 1.5, 'parseNum: underscore decimal');
eq(D.parseNum('A12'), 12, 'parseNum: alpha step');
eq(D.parseNum('Full'), Infinity, 'parseNum: Full sorts last');
eq(D.parseNum('base'), null, 'parseNum: non-numeric is null');

/* --- smartSort case 2: without it, solid and alpha ramps zip together into
   one plausible-looking table. This is the case that gets dropped. */
var ramps = [
  { rn: '1' }, { rn: 'Alphas/1' }, { rn: '2' }, { rn: 'Alphas/2' },
  { rn: '12' }, { rn: 'Alphas/12' }
];
eq(names(D.smartSort(ramps)),
  ['1', '2', '12', 'Alphas/1', 'Alphas/2', 'Alphas/12'],
  'smartSort case 2: pure numerics first, then prefix groups — no interleaving');

/* --- baseCmp: the base is everything before the trailing number. Splitting on
   "-" compares "blue-grey-3%" on "blue" and misorders hyphenated bases. */
var opac = [{ rn: 'black-10%' }, { rn: 'black-3%' }, { rn: 'blue-grey-3%' }, { rn: 'black' }];
eq(names(D.smartSort(opac)),
  ['black', 'black-3%', 'black-10%', 'blue-grey-3%'],
  'baseCmp: bare base first, numeric steps ascending, hyphenated base intact');

/* --- orderRows: name sort is wrong for t-shirt scales. "full" (999) leading
   and "none" (0) buried third is the tell. */
var radius = [
  { rn: 'full', val: 999 }, { rn: 'lg', val: 8 }, { rn: 'none', val: 0 },
  { rn: 'sm', val: 4 }, { rn: 'xl', val: 12 }, { rn: '2xl', val: 16 }
];
eq(names(D.orderRows(radius)), ['none', 'sm', 'lg', 'xl', '2xl', 'full'],
  'orderRows: border radius sorts by value, not name');

var weights = [{ rn: 'semibold', val: 'Semi Bold' }, { rn: 'normal', val: 'Regular' }, { rn: 'medium', val: 'Medium' }];
eq(names(D.orderRows(weights)), ['normal', 'medium', 'semibold'],
  'orderRows: font weight sorts by rank, not alphabetically');

// Numeric NAMES must beat numeric VALUES or "0_5" lands wrong.
var spacing = [{ rn: '0', val: 0 }, { rn: '1', val: 4 }, { rn: '0_5', val: 2 }, { rn: '2', val: 8 }];
eq(names(D.orderRows(spacing)), ['0', '0_5', '1', '2'],
  'orderRows: numeric names beat numeric values (0_5 between 0 and 1)');

/* --- stripNamespace: a namespace can be more than one segment deep, so a
   single-pass strip leaves the page as collapsed as no strip at all. Defect 13 */
var r1 = D.stripNamespace(['Colour/Palette/Blue/1', 'Colour/Palette/Blue/2', 'Colour/Palette/Red/1']);
eq(r1.effs, ['Blue/1', 'Blue/2', 'Red/1'], 'stripNamespace: strips two shared segments, not one');
eq(r1.stripped, ['Colour', 'Palette'], 'stripNamespace: reports what it stripped');

var r2 = D.stripNamespace(['Colour/Grey/1', 'Colour/white']);
eq(r2.effs, ['Grey/1', 'white'], 'stripNamespace: stops before stranding a name at zero segments');
eq(r2.strippedLast, 'Colour', 'stripNamespace: strippedLast feeds the 1-segment group fallback');

/* --- depthMap, including the 1-segment case that writes undefined when unhandled */
eq(D.depthMap('white', 'Colour'), { frameGroup: 'Colour', table: 'Colour', row: 'white' },
  'depthMap: stranded 1-segment name groups under the fallback');
eq(D.depthMap('Spacing/8', 'X'), { frameGroup: 'Spacing', table: 'Spacing', row: '8' },
  'depthMap: 2 segments');
eq(D.depthMap('Font/Size/24', 'X'), { frameGroup: 'Font', table: 'Size', row: '24' },
  'depthMap: 3+ segments, remainder joined');
eq(D.depthMap('Colour/Background/Neutral/base-rest', 'X').row, 'Neutral/base-rest',
  'depthMap: 4 segments keep the remainder joined, not truncated');

ok(D.titleIsRedundant('Breakpoints', 'breakpoints'), 'titleIsRedundant: case-insensitive');
ok(!D.titleIsRedundant('Size', 'Font'), 'titleIsRedundant: distinct heading stays visible');

/* --- frame numbering */
eq(D.frameNames(['Spacing']), [{ group: 'Spacing', name: 'Spacing', index: 1 }],
  'frameNames: single frame keeps the bare group name');
eq(D.frameNames(['Stroke', 'Font']).map(function (f) { return f.name; }), ['1 - Font', '2 - Stroke'],
  'frameNames: multiple frames are numbered alphabetically');

/* --- oklchForMode: oklchFrom returns the FIRST match, so on a two-mode
   collection it fills Dark with Light's value. Defect 14. */
var descA = 'Light:\noklch(0.62 0.19 259) · free mode\n\nDark:\noklch(0.71 0.15 259) · free mode';
eq(D.oklchForMode(descA, 'Light', ['Light', 'Dark']), 'oklch(0.62 0.19 259)',
  'oklchForMode format A: Light section');
eq(D.oklchForMode(descA, 'Dark', ['Light', 'Dark']), 'oklch(0.71 0.15 259)',
  'oklchForMode format A: Dark section — NOT Light’s value');
eq(D.oklchFrom(descA), 'oklch(0.62 0.19 259)',
  'oklchFrom is single-mode only and returns the first match (why oklchForMode exists)');

var descB = 'oklch(0.62 0.19 259) · free mode\noklch(0.71 0.15 259) · free mode · dark';
eq(D.oklchForMode(descB, 'Light', ['Light', 'Dark']), 'oklch(0.62 0.19 259)',
  'oklchForMode format B: untagged line is the first mode');
eq(D.oklchForMode(descB, 'Dark', ['Light', 'Dark']), 'oklch(0.71 0.15 259)',
  'oklchForMode format B: tagged line wins');

/* Mode names are user data. "Dark (AA)" builds a capture group and never
   matches its own tag — defect 14 rebuilt inside the reader. */
var descEsc = 'Light:\noklch(0.62 0.19 259)\n\nDark (AA):\noklch(0.71 0.15 259)';
eq(D.oklchForMode(descEsc, 'Dark (AA)', ['Light', 'Dark (AA)']), 'oklch(0.71 0.15 259)',
  'oklchForMode: parenthesised mode name is escaped, not treated as a group');

eq(D.canonOklch('OKLCH( 62.1%  0.185 259 )'), 'oklch(62.1% 0.185 259)',
  'canonOklch: collapses inner spacing and lowercases');

/* --- alpha: 2dp percent, always padded, never whole */
eq(D.alphaLabel(0.008584), '0.86%', 'alphaLabel: 2dp percent, not a whole percent');
eq(D.alphaLabel(0.03), '3.00%', 'alphaLabel: padded so a reader can tell it is 2dp');
eq(D.alphaLabel('nonsense'), null, 'alphaLabel: unparseable is null, never "NaN%"');
eq(D.toHex({ r: 1, g: 1, b: 1, a: 1 }), '#FFFFFF', 'toHex: opaque needs no alpha suffix');
eq(D.toHex({ r: 0, g: 0, b: 0, a: 0.5 }, null), '#000000 / 50.00%', 'toHex: alpha from the paint');
eq(D.toHex({ r: 1, g: 1, b: 1, a: 0.5 }, '0.008584'), '#FFFFFF / 0.86%',
  'toHex: AUTHORED alpha wins over the paint’s rounded value');
eq(D.toHex({ r: 1, g: 1, b: 1, a: 0.5 }, 'unparseable'), '#FFFFFF / 50.00%',
  'toHex: unparseable authored alpha must not render "/ null"');

eq(D.alphaSpecForMode('rgb(0 85 255 / 1.18%) · base #0055FF · alpha 0.011765 · composites to Blue/1', 'Light', ['Light']),
  { base: '#0055FF', alpha: '0.011765', compositesTo: 'Blue/1' },
  'alphaSpecForMode: reads full precision from the FIELD, not the 2dp head');
ok(D.isAlphaSchema('base #161616 · alpha 0.008584'), 'isAlphaSchema: legacy base+alpha shape');
ok(!D.isAlphaSchema('oklch(0.62 0.19 259)'), 'isAlphaSchema: a plain oklch is not the alpha schema');

/* Chromatic alpha is authored as rgb(...) deliberately — render it verbatim
   under an OKLCH run rather than asserting a hue the scale does not own. */
D.resetBuckets();
var chrom = { name: 'Alphas/Blue/1', description: 'rgb(0 85 255 / 1.18%) · base #0055FF · alpha 0.011765' };
eq(D.colourLabel({ r: 0, g: 0.33, b: 1, a: 0.0118 }, chrom, 'oklch', 'Light', ['Light']),
  'rgb(0 85 255 / 1.18%)', 'colourLabel: authored rgb() rendered verbatim under OKLCH');
eq(D.buckets.alphaSchemaVars, ['Alphas/Blue/1'],
  'colourLabel: chromatic alpha lands in alphaSchemaVars, never in missing');

D.resetBuckets();
eq(D.colourLabel({ r: 1, g: 0, b: 0, a: 1 }, { name: 'Red/5', description: 'no colour here' }, 'oklch', 'Light', ['Light']),
  '#FF0000', 'colourLabel: falls back to hex when no OKLCH is authored');
eq(D.buckets.oklchMisses, ['Red/5'], 'colourLabel: the miss is collected for reporting, not silent');

var cov = D.oklchCoverage([{ vars: [
  { name: 'a', resolvedType: 'COLOR', description: 'oklch(0.5 0 0)' },
  { name: 'b', resolvedType: 'COLOR', description: 'base #161616 · alpha 0.5' },
  { name: 'c', resolvedType: 'COLOR', description: '' },
  { name: 'd', resolvedType: 'FLOAT', description: '' }
] }]);
eq({ total: cov.total, have: cov.have, alphaOnly: cov.alphaOnly, missing: cov.missing },
  { total: 3, have: 1, alphaOnly: ['b'], missing: ['c'] },
  'oklchCoverage: alphaOnly is its own bucket, never counted as missing');

/* --- rem letter-spacing is size-dependent. Case A6: -1% at seven sizes plus 0%
   at three more must yield EIGHT rows under rem and TWO under em. Reducing to
   distinct percentages is defect 19; keying by size alone collides the 16px
   -1% row with the 16px 0% row. */
var pct = function (v, size) {
  return { boundVariables: {}, letterSpacing: { unit: 'PERCENT', value: v }, fontSize: size };
};
var styles = [pct(-1, 40), pct(-1, 32), pct(-1, 28), pct(-1, 24), pct(-1, 20), pct(-1, 18), pct(-1, 16),
              pct(0, 16), pct(0, 14), pct(0, 12)];
eq(D.metricRows(styles, 'letterSpacing', true).length, 8,
  'metricRows(rem): seven size-keyed rows plus one size-independent zero — case A6');
eq(D.metricRows(styles, 'letterSpacing', false).length, 2,
  'metricRows(em): the same fixture reduces to two rows');
eq(D.cssLetterSpacingRem({ unit: 'PERCENT', value: -1 }, 40, 16), '-0.025rem',
  'cssLetterSpacingRem: -1% at 40px');
eq(D.cssLetterSpacingRem({ unit: 'PERCENT', value: -1 }, 16, 16), '-0.01rem',
  'cssLetterSpacingRem: the same -1% at 16px is a different value');
eq(D.metricRowName({ value: -1, unit: 'PERCENT', size: 40 }), '-1% @ 40px',
  'metricRowName: size-keyed rows show the size or read as duplicates');
eq(D.metricRowName({ value: 0, unit: 'PERCENT', size: null }), '0% @ any size',
  'metricRowName: zero is size-independent');

// A bound field already has a token and belongs to the alias rule, not here.
var bound = [{ boundVariables: { letterSpacing: { id: 'x' } }, letterSpacing: { unit: 'PERCENT', value: -1 }, fontSize: 40 }];
eq(D.metricRows(bound, 'letterSpacing', true), [], 'metricRows: bound fields are excluded');

/* --- CSS conversions are exact 1:1 divisions, and only PIXELS/AUTO are lossy */
eq(D.cssLineHeight({ unit: 'PERCENT', value: 146 }), '1.46', 'cssLineHeight: 146% -> 1.46');
eq(D.cssLineHeight({ unit: 'AUTO' }), 'Auto', 'cssLineHeight: AUTO has no faithful CSS value');
eq(D.cssLineHeight({ unit: 'PIXELS', value: 24 }, 16), '1.5', 'cssLineHeight: px derived from fontSize');
eq(D.cssLetterSpacing({ unit: 'PERCENT', value: -2 }), '-0.02em', 'cssLetterSpacing: -2% -> -0.02em');
eq(D.cssLetterSpacing(null), '0em', 'cssLetterSpacing: absent means zero tracking, not Auto');
eq(D.unitTextFor('letterSpacing', null, 16, false), '0%', 'unitTextFor: as-authored zero');
eq(D.unitText({ unit: 'PERCENT', value: 110.00000238418579 }), '110%',
  'unitText: float32 read-back noise is rounded before rendering');

/* --- web group detection: the null case exists so "Webinar" cannot quietly
   match "web". Never infer web from the file name. */
eq(D.webGroupState('Web platform'), true, 'webGroupState: recognised web group converts');
eq(D.webGroupState('Mobile app'), false, 'webGroupState: recognised non-web stays as authored');
eq(D.webGroupState('Webinar'), null, 'webGroupState: web-ish but unlisted must ASK');
eq(D.webGroupState(''), null, 'webGroupState: no platform segment must ASK');
ok(D.platformish('iOS'), 'platformish: iOS is a platform');
ok(!D.platformish('Heading'), 'platformish: an ordinary group is not a platform');

/* --- parent-tier plan for text-style pages */
eq(D.parentTierPlan(['Headline/lg-normal', 'Body/md']).pages, ['Text styles'],
  'parentTierPlan: two-segment names give ONE page, however many groups');
eq(D.parentTierPlan(['Headline/lg-normal', 'Body/md']).mode, 'flat',
  'parentTierPlan: flat mode');
eq(D.parentTierPlan(['Web platform/Headline/lg', 'Mobile app/Body/md']).mode, 'split',
  'parentTierPlan: sibling PLATFORM parents split without asking');
eq(D.parentTierPlan(['Web platform/Headline/lg', 'Mobile app/Body/md']).pages,
  ['Text styles - Mobile app', 'Text styles - Web platform'],
  'parentTierPlan: one page per platform parent');
eq(D.parentTierPlan(['Heading/Display/lg', 'Body/Text/md']).mode, 'ask',
  'parentTierPlan: depth alone does not confirm a parent — Heading/Body must ASK');
eq(D.parentTierPlan(['Web platform/Headline/lg', 'Web platform/Body/md']).mode, 'single-parent',
  'parentTierPlan: one shared parent is promoted into the page name');
eq(D.parentTierPlan(['Web platform/Headline/lg', 'Body/md']).mode, 'mixed',
  'parentTierPlan: mixed depth does not split');

// Nested shared tiers: strip repeatedly, join the stripped segments into the
// page name, THEN apply the sibling test to what remains.
var nested = D.parentTierPlan(['Brand/Web platform/Headline/lg', 'Brand/Mobile app/Body/md']);
eq(nested.mode, 'split', 'parentTierPlan: nested tiers then platform siblings still split');
eq(nested.pages, ['Text styles - Brand - Mobile app', 'Text styles - Brand - Web platform'],
  'parentTierPlan: stripped parents are joined into each sibling page name');
// A single nest with ordinary groups beneath stays one page.
eq(D.parentTierPlan(['Brand/Web/Headline/lg', 'Brand/Web/Body/md']).pages, ['Text styles - Brand - Web'],
  'parentTierPlan: nested single parent gives one page named for the whole nest');

/* --- prefix stripping stays derived, not a blocklist */
eq(D.redundantPrefix(['Colour/Brand/x/4', 'Colour/Brand/y/2'], 'Colour'), 'Colour',
  'redundantPrefix: fires when every label shares the frame group');
eq(D.redundantPrefix(['Colour/Shadow/Cast/soft'], 'Elevation'), null,
  'redundantPrefix: does NOT fire on Shadows, where nothing else states the category');
eq(D.redundantPrefix(['Colour/Brand/x/4', 'Other/y'], 'Colour'), null,
  'redundantPrefix: one non-matching label disables the strip');
eq(D.stripPrefix('Colour/Brand/x/4', 'Colour'), 'Brand/x/4', 'stripPrefix: removes one head segment');
eq(D.lastSegment('Effects/Shadow/Position/-1'), '-1',
  'lastSegment: returns a STRING so negative offsets survive');

/* --- columns resolve by label. An index-based write swaps two columns of
   plausible percentages and throws nothing. */
var cols = D.fieldsForLabels(['Name', 'Family', 'Size', 'Weight', 'Letter spacing', 'Line-height']);
eq(cols.fieldFor, ['name', 'fontFamily', 'fontSize', 'fontStyle', 'letterSpacing', 'lineHeight'],
  'fieldsForLabels: mid-table insertion resolves correctly by label');
eq(cols.unknown, [], 'fieldsForLabels: all labels recognised');
var cols2 = D.fieldsForLabels(['Name', 'Sizing']);
eq(cols2.unknown, ['Sizing'],
  'fieldsForLabels: an unrecognised label is REPORTED, never prefix-matched onto fontSize');
eq(cols2.fieldFor[1], null, 'fieldsForLabels: unknown column gets no field');

/* --- property-key matching. Defect 17: "Label" prefix-matches "Label text#0:2"
   and hands a boolean to a TEXT property, killing the whole call. The rule lived
   inside keyFor, where no test could reach it. */
ok(D.matchesPropKey('Label', 'Label'), 'matchesPropKey: exact name');
ok(D.matchesPropKey('Label#0:1', 'Label'), 'matchesPropKey: name plus #id suffix');
ok(!D.matchesPropKey('Label text#0:2', 'Label'),
  'matchesPropKey: must NOT prefix-match a longer property — defect 17');
ok(D.matchesPropKey('Label text#0:2', 'Label text'), 'matchesPropKey: the longer name matches itself');
ok(!D.matchesPropKey('Labelled', 'Label'), 'matchesPropKey: no bare prefix match without the # boundary');

/* --- library order is derived from the styles array, never sorted */
eq(D.firstSeenOrder(['Elevation', 'Elevation', 'Components', 'Elevation', 'Components']),
  ['Elevation', 'Components'],
  'firstSeenOrder: unique in first-seen order, not alphabetical');
eq(D.firstSeenOrder(['Raised', 'Floating', 'Overlay', 'Modal']),
  ['Raised', 'Floating', 'Overlay', 'Modal'],
  'firstSeenOrder: style-panel order survives — alphabetising would destroy it');
eq(D.firstSeenOrder([]), [], 'firstSeenOrder: empty');

/* --- effect-style name split. The component renders the " / " separator, so
   neither half may contain the slash. */
eq(D.splitEffectName('Shadow/Base/Drop/very soft'),
  {tableName:'very soft', frameGroup:'Base / Drop', hasSubtitle:true},
  'splitEffectName: at most two group segments, subtitle when there are two');
eq(D.splitEffectName('Elevation/Raised'),
  {tableName:'Raised', frameGroup:'Elevation', hasSubtitle:false},
  'splitEffectName: single group segment takes no subtitle');
eq(D.splitEffectName('Raised'),
  {tableName:'Raised', frameGroup:'', hasSubtitle:false},
  'splitEffectName: ungrouped style');

/* --- float32 read-back noise: never use strict equality in verification */
ok(D.near(110.00000238418579, 110), 'near: tolerates float32 read-back noise');
ok(!D.near(110.5, 110), 'near: still distinguishes a real difference');

/* --- metric row labels. These closed over lhUnit/lsUnit/rootSize in recipes.md,
   which is why they were untestable; the unit is a parameter now. */
eq(D.lineHeightLabel({value:146, unit:'PERCENT'}, 'unitless'), '1.46',
  'lineHeightLabel: unitless is an exact division');
eq(D.lineHeightLabel({value:146, unit:'PERCENT'}, 'as-authored'), '146%',
  'lineHeightLabel: as-authored keeps the percentage');
eq(D.letterSpacingLabel({value:-1, unit:'PERCENT', size:40}, 'em'), '-0.01em',
  'letterSpacingLabel: em is size-invariant');
eq(D.letterSpacingLabel({value:-1, unit:'PERCENT', size:40}, 'rem', 16), '-0.025rem',
  'letterSpacingLabel: rem resolves against the row size');
eq(D.letterSpacingLabel({value:0, unit:'PERCENT', size:null}, 'rem', 16), '0rem',
  'letterSpacingLabel: zero is size-independent, rendered once');
eq(D.letterSpacingLabel({value:-1, unit:'PERCENT', size:40}, 'as-authored'), '-1%',
  'letterSpacingLabel: as-authored keeps the percentage');
eq(D.letterSpacingLabel({value:2, unit:'PIXELS', size:null}, 'em'), null,
  'letterSpacingLabel: a PIXELS value under em has no font size, so it is refused (D41)');
eq(D.metricRows([{ fontSize: 16, lineHeight: {unit:'PERCENT', value:24} }, { fontSize: 20, lineHeight: {unit:'PIXELS', value:24} }], 'lineHeight', false).length, 2,
  'metricRows: a PIXELS row is never folded into a PERCENT row of the same value');

/* --- width ladder */
eq(D.nextRung(720), 860, 'nextRung: 720 -> 860');
eq(D.nextRung(996), 1024, 'nextRung: last resort exists but is not a working rung');
eq(D.nextRung(1024), null, 'nextRung: nothing above the top rung');
eq(D.normaliseWidths([720, 996, 720]), [996, 996, 996],
  'normaliseWidths: frame takes the widest');
eq(D.normaliseWidths([720]), [720], 'normaliseWidths: a single table is left alone');
eq(D.normaliseWidths([996, 996]), [996, 996], 'normaliseWidths: never shrinks below the widest');
eq(D.boxOverflow({x:100,width:300},{x:90,width:280}), 30, 'boxOverflow: a pill running 30px past its cell is caught (D45)');
eq(D.boxOverflow({x:100,width:200},{x:90,width:280}), 0, 'boxOverflow: a text inside its cell is 0');
eq(D.modeIdByName([{modeId:'a',name:'Light'},{modeId:'b',name:'Dark'}],'Dark'), 'b', 'modeIdByName: matches by name (D46)');
eq(D.modeIdByName([{modeId:'x',name:'Mode 1'}],'Dark'), 'x', 'modeIdByName: a single-mode collection falls back to its mode');
eq(D.pinTarget('p', {id:'e', isExtension:true, parentVariableCollectionId:'p'}), 'e', 'pinTarget: an extension stands in for its parent (D46)');
eq(D.pinTarget('q', {id:'e', isExtension:true, parentVariableCollectionId:'p'}), 'q', 'pinTarget: any other collection pins itself');

eq(D.shadowType('INNER_SHADOW'), 'Inner shadow', 'shadowType: inner');
eq(D.num(undefined), '-', 'num: absent renders as a dash, not "undefined"');

/* stylesFromSnapshot — the Shadows and Text styles recipes' input, from the stored snapshot */
(function () {
  var snap = {
    textStyles: [{ name: 'Web app/Body/md', family: 'Inter', weight: 'Regular', size: 16, lineHeight: 1.3, letterSpacing: -0.01,
      bound: { fontSize: { collection: 'Primitives - Global', name: 'Font/Size/16' }, fontWeight: { collection: 'Primitives - Global', name: 'Font/Weight/Regular' } },
      authored: { lineHeight: { unit: 'PERCENT', value: 130 }, letterSpacing: { unit: 'PERCENT', value: -1 } }, key: 'K2' }],
    effects: [{ name: 'Shadow/Base/Drop/soft', key: 'K1', layers: [
      { type: 'DROP_SHADOW', x: 0, y: 2, blur: 4, spread: 0, color: 'rgb(0 0 0 / 0.1)', bound: { blur: { collection: 'G', name: 'Effects/Shadow/Blur/4' }, color: { collection: 'S', name: 'Colour/Shadow/medium' } } },
      { type: 'BACKGROUND_BLUR', blur: 8 }] }]
  };
  var r = D.stylesFromSnapshot(snap), t = r.textStyles[0], e = r.effectStyles[0];
  eq(t.key, 'K2', 'stylesFromSnapshot: a text style keeps its key, so the page can apply it');
  eq(JSON.stringify(t.lineHeight), JSON.stringify({ unit: 'PERCENT', value: 130 }), 'stylesFromSnapshot: line height as authored, not the converted ratio');
  eq(t.letterSpacing.value, -1, 'stylesFromSnapshot: letter spacing as authored');
  eq(t.style, 'Regular', 'stylesFromSnapshot: the weight name is the style');
  eq(t.bound.fontSize, 'Font/Size/16', 'stylesFromSnapshot: a binding is its variable NAME');
  eq(t.bound.fontStyle, 'Font/Weight/Regular', 'stylesFromSnapshot: a weight binding reads as fontStyle, as the recipes name it');
  eq(e.key, 'K1', 'stylesFromSnapshot: an effect style keeps its key');
  eq(e.effects[0].radius, 4, 'stylesFromSnapshot: blur becomes radius');
  eq(e.effects[0].bound.radius, 'Effects/Shadow/Blur/4', 'stylesFromSnapshot: a layer binding is its variable NAME');
  eq(Math.round(e.effects[0].color.a * 100), 10, 'stylesFromSnapshot: the colour string parses back to channels');
  eq(e.effects[1].type, 'BACKGROUND_BLUR', 'stylesFromSnapshot: a blur layer is documented, not dropped');
  var threw = null;
  try { D.stylesFromSnapshot({ textStyles: [{ name: 'Old', size: 16 }], effects: [] }); } catch (x) { threw = x.message; }
  ok(threw && /predates plugin 0\.27\.0/.test(threw), 'stylesFromSnapshot: a snapshot without authored units is refused, not guessed');
})();

/* --- 1.18.0: the two verification detectors that were prose fences in
   failures.md (defects 16 and 19), plus metricRows reading snapshot styles. */
(function () {
  // defect 16 — mixed conventions within ONE frame group
  var m = D.unitFormMix([{ text: '150%' }, { text: '1.5' }, { text: 'Font/Line height/tight', alias: true }], 'lineHeight');
  eq([m.authored, m.converted, m.mixed], [1, 1, true], 'unitFormMix: % beside a bare ratio in one group is MIXED');
  m = D.unitFormMix([{ text: '150%' }, { text: '24px' }, { text: 'Auto' }], 'lineHeight');
  eq([m.authored, m.converted, m.mixed], [2, 0, false], 'unitFormMix: a px line-height is as-authored, not converted (the old prose counted it as bare)');
  m = D.unitFormMix([{ text: '1.5' }, { text: '1.1' }, { text: 'Auto' }], 'lineHeight');
  eq([m.converted, m.mixed], [2, false], 'unitFormMix: Auto beside converted values is not mixed');
  m = D.unitFormMix([{ text: '-1%' }, { text: '-0.02em' }], 'letterSpacing');
  eq(m.mixed, true, 'unitFormMix: letter-spacing % beside em is MIXED');
  m = D.unitFormMix([{ text: '-0.025rem' }, { text: '0rem' }], 'letterSpacing');
  eq([m.converted, m.mixed], [2, false], 'unitFormMix: rem counts as converted letter-spacing');

  // defect 19 — rem collapsed to one row per authored value
  var p = function (v, size) { return { bound: {}, letterSpacing: { unit: 'PERCENT', value: v }, fontSize: size }; };
  var st = [p(-1, 40), p(-1, 32), p(-1, 16), p(0, 16), p(0, 12)];
  eq(D.remRowVerdict(st, 4).verdict, 'ok', 'remRowVerdict: three size-keyed rows plus one zero row is correct');
  eq(D.remRowVerdict(st, 2).verdict, 'collapsed', 'remRowVerdict: one row per percentage is defect 19');
  eq(D.remRowVerdict(st, 7).verdict, 'mismatch', 'remRowVerdict: any other count is reported, not passed');

  // snapshot styles carry `bound`, not boundVariables
  var snap = [{ bound: { letterSpacing: 'Font/Tracking/tight' }, letterSpacing: { unit: 'PERCENT', value: -1 }, fontSize: 40 },
              { bound: {}, letterSpacing: { unit: 'PERCENT', value: -2 }, fontSize: 40 }];
  eq(D.metricRows(snap, 'letterSpacing', false).length, 1,
    'metricRows: a snapshot style\'s BOUND field is excluded too (it read only boundVariables)');
})();

/* 1.19.0 — Figma's motion types (D43) */
(function () {
  eq(D.literalLabel(0.07000000029802322, 'TIMING'), '70ms', 'literalLabel: a TIMING value is stored in seconds and rendered in ms');
  eq(D.literalLabel(1, 'TIMING'), '1000ms', 'literalLabel: one second is 1000ms');
  eq(D.literalLabel({ type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1: 0.18000000715255737, y1: 0, x2: 0, y2: 1 } }, 'EASING'),
    'cubic-bezier(0.18, 0, 0, 1)', 'literalLabel: a custom EASING renders as CSS cubic-bezier(), never [object Object]');
  eq(D.literalLabel({ type: 'EASE_IN_AND_OUT' }, 'EASING'), 'ease-in-out', 'literalLabel: a preset EASING renders as its CSS keyword');
  eq(D.literalLabel(8, 'FLOAT'), '8', 'literalLabel: a FLOAT is unchanged');
  eq(D.literalLabel('Inter', 'STRING'), 'Inter', 'literalLabel: a STRING is unchanged');
})();

/* the sandbox copy of the font-weight table is the parity engine's one table, name for name */
(function () {
  var W = require('../../../tools/parity/values.mjs').WEIGHTS;
  ok(JSON.stringify(D.WEIGHT_RANK) === JSON.stringify(W), 'the weight table is the one tools/parity/values.mjs holds');
  ok(D.weightRank('Extra Bold') === 800 && D.weightRank('Semi-Bold') === 600 && D.weightRank('Book') === 400 && D.weightRank('constructor') === undefined, 'a weight reads spaced, hyphenated or not, and nothing else does');
})();

/* 1.21.0 — verifyDoc: Step 5's queries over a page read back (failures.md) */
(function () {
  var cell = function (o) { return Object.assign({ content: 'Text', label: 'x', pill: null, rendered: 'x', swatchOn: false, swatchVar: null }, o); };
  var name = function (n) { return cell({ label: n, rendered: n }); };
  var lit = function (hex, v) { return cell({ label: hex, rendered: hex, swatchOn: true, swatchVar: v }); };
  var ali = function (n) { return cell({ content: 'Alias', label: n, pill: n, rendered: n, swatchOn: true, swatchVar: n }); };
  var frame = function (nm, tables, extra) {
    return Object.assign({ type: 'FRAME', name: nm, cornerRadius: 40, cornerSmoothing: 0.6000000238418579,   // float32 (F6)
      itemSpacing: 64, padding: [160, 160, 160, 160], tables: tables, placeholders: [] }, extra || {});
  };
  var snap = function () {
    return { page: 'Palette', children: [
      frame('2 - Title', [
        { heading: 'Title', titleVisible: false, badge: '', width: 720, headers: ['Name', 'Light'],
          rows: [{ cells: [name('1'), ali('Palette/Cyan/3')] }, { cells: [name('2'), lit('#FFFFFF', 'Title/2')] }] }
      ], { placeholders: [{ id: 'h', text: 'Title' }] }),                                      // F10: the group IS "Title"
      frame('1 - Blue', [
        { heading: 'Solid', titleVisible: true, badge: '', width: 720, headers: ['Name', 'Light'],
          rows: [{ cells: [name('1'), lit('#EEEEFF', 'Blue/1')] }, { cells: [name('2'), lit('#DDDDFF', 'Blue/2')] }] },
        { heading: 'Line height', titleVisible: true, badge: 'Not a variable', width: 860, headers: ['Name', 'Value'],
          rows: [{ cells: [name('115%'), name('1.15')] }] }                                     // F11: badged, never covered
      ])
    ] };
  };
  var expect = { fmt: 'hex', frames: [
    { name: '1 - Blue', group: 'Blue', tables: [{ heading: 'Solid', headers: ['Name', 'Light'], rows: [{ name: '1', alias: 0 }, { name: '2', alias: 0 }] }] },
    { name: '2 - Title', group: 'Title', tables: [{ heading: 'Title', headers: ['Name', 'Light'], rows: [{ name: '1', alias: 1 }, { name: '2', alias: 0 }] }] }
  ] };

  var r = D.verifyDoc(snap(), expect);
  eq(r.verdict, 'clean', 'verifyDoc: a correct page is clean — float32 chrome, a hidden redundant title, a group named Title, a badged table (F6, F10, F11)');
  eq([r.counts.frames, r.counts.tables, r.counts.badged, r.counts.rows, r.counts.aliasCells], [2, 2, 1, 4, 1], 'verifyDoc: counts what it read, the badged table apart');
  var checks = function (res) { return res.issues.map(function (i) { return i.check; }).sort(); };

  var s = snap(); s.children[0].tables[0].rows[0].cells[1].pill = 'Label';
  ok(checks(D.verifyDoc(s, expect)).indexOf('alias integrity') !== -1, 'verifyDoc: a pill that disagrees with its cell (defect 2)');
  s = snap(); s.children[1].tables[0].rows[1].cells[1].swatchVar = 'Blue/1';
  ok(checks(D.verifyDoc(s, expect)).indexOf('swatch bindings') !== -1, 'verifyDoc: every swatch in a table bound to one variable (defect 1)');
  s = snap(); s.children[1].tables[0].rows.reverse();
  eq(checks(D.verifyDoc(s, expect)), ['row order'], 'verifyDoc: the right rows in the wrong order are a row-order finding, not coverage');
  s = snap(); s.children[1].tables[0].rows.pop();
  eq(checks(D.verifyDoc(s, expect)), ['coverage'], 'verifyDoc: a missing row is a coverage finding');
  s = snap(); s.children[0].tables[0].rows[0].cells[1] = name('Palette/Cyan/3');
  eq(checks(D.verifyDoc(s, expect)), ['alias coverage'], 'verifyDoc: a bound field written as a literal (defect 4)');
  s = snap(); s.children[0].tables[0].titleVisible = true;
  eq(checks(D.verifyDoc(s, expect)), [], 'verifyDoc: a visible title reading its intended heading is fine');
  s = snap(); s.children[1].tables[0].heading = 'Title';
  eq(checks(D.verifyDoc(s, expect)), ['library order'], 'verifyDoc: a table heading other than intended, by position (defect 11)');
  s = snap(); s.children[1].tables[0].headers = ['Name', 'Dark'];
  eq(checks(D.verifyDoc(s, expect)), ['header labels'], 'verifyDoc: a header that is not the mode name');
  s = snap(); s.children[1].tables[0].rows[0].cells[1].rendered = 'Label';
  eq(checks(D.verifyDoc(s, expect)), ['placeholders'], 'verifyDoc: a cell rendering the shipped "Label" (what renders, not the property)');
  s = snap(); s.children[1].placeholders = [{ id: 'q', text: 'Subheading' }];
  eq(checks(D.verifyDoc(s, expect)), ['placeholders'], 'verifyDoc: a visible placeholder no table intends');
  s = snap(); s.children[1].tables.push({ heading: 'Alpha', titleVisible: true, badge: '', width: 860, headers: [], rows: [] });
  ok(checks(D.verifyDoc(s, expect)).indexOf('widths') !== -1, 'verifyDoc: two table widths in one frame');
  s = snap(); s.children.unshift({ type: 'INSTANCE', name: 'Table - Colour' });
  eq(checks(D.verifyDoc(s, expect)), ['structure'], 'verifyDoc: a leaked probe on the page (defect 7)');
  s = snap(); s.children[1].cornerSmoothing = 0;
  eq(checks(D.verifyDoc(s, expect)), ['structure'], 'verifyDoc: frame chrome off the fixed design');
  s = snap(); s.children.reverse();
  ok(checks(D.verifyDoc(s, expect)).indexOf('structure') !== -1, 'verifyDoc: frame 1 not first in the layers panel');
  r = D.verifyDoc(snap(), Object.assign({}, expect, { fmt: 'oklch' }));
  eq([r.verdict, r.fallbacks.length], ['clean', 3], 'verifyDoc: in an oklch run each hex label is a fallback to name, not a defect (defect 8)');
  // Reviewed 2026-10-30: the generator's own translucent label (toHex: "#RRGGBB / 50.00%") read as a format defect.
  var translucent = function () { var t = snap(); t.children[1].tables[0].rows[0].cells[1] = lit('#EEEEFF / 50.00%', 'Blue/1'); return t; };
  eq(checks(D.verifyDoc(translucent(), expect)), [], 'verifyDoc: (negative) a translucent hex label, as toHex writes it, is hex in a hex run');
  r = D.verifyDoc(translucent(), Object.assign({}, expect, { fmt: 'oklch' }));
  eq([checks(r), r.fallbacks.length], [[], 3], 'verifyDoc: (negative) a translucent hex label in an oklch run is a fallback, not a defect');
  r = D.verifyDoc(snap(), null);
  eq([r.verdict, r.notRun.indexOf('coverage') !== -1], ['partial', true], 'verifyDoc: no expectation is partial, never clean');
})();

/* -------------------------------------------------------------------------- */
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) {
  console.log('\nFAILURES:\n');
  failures.forEach(function (f) { console.log('  ✗ ' + f + '\n'); });
  process.exit(1);
}
process.exit(0);
