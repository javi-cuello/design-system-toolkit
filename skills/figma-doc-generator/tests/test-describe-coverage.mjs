// scripts/describe-coverage.mjs over a small tokens.json. Run by bin/check.
import { coverage, wrongWord } from '../scripts/describe-coverage.mjs';
let pass = 0, fail = 0;
const ok = (name, c) => { if (c) { pass++; console.log('ok', name); } else { fail++; console.log('FAIL', name); } };
const tokens = { collections: {
  'Primitives': { modes: ['Value'], values: { Value: { 'Space/4': 4 } }, descriptions: {} },
  '04. Semantic': { modes: ['Light', 'Dark'],
    values: { Light: { 'Color/Background/Neutral/primary': '#fff', 'Color/Background/Danger/primary': '#f00', 'Color/Text/Neutral/primary': '#000' }, Dark: { 'Color/Text/Neutral/primary': '#fff', 'Elevation': 1 } },
    descriptions: { 'Color/Text/Neutral/primary': 'Body text.', 'Color/Background/Danger/primary': '  ' } } } };
tokens.collections.Foundations = { modes: ['Light'], values: { Light: { 'Color/ink': '#000' } }, descriptions: {}, remote: true };
const all = coverage(tokens);
ok('every collection, counted across modes once', all.length === 2 && all[1].variables === 4);
const s = coverage(tokens, 'semantic')[0];
ok('--only keeps the matching collections, case-blind', coverage(tokens, 'semantic').length === 1 && s.collection === '04. Semantic');
ok('a blank description counts as none', s.described === 1);
ok("another library's collection is not this file's to describe", !all.some((c) => c.collection === 'Foundations'));
ok('the undescribed are grouped by grammar position, a bare name at top level',
  JSON.stringify(s.groups) === JSON.stringify({ 'Color/Background/Danger': ['Color/Background/Danger/primary'], 'Color/Background/Neutral': ['Color/Background/Neutral/primary'], '(top level)': ['Elevation'] }));
const w = { 'Colour/Text/Info/default': 'Default colour for danger text.', 'Colour/Text/Danger/default': 'Default colour for danger text.',
  'Colour/Icon/Info/soft': 'Soft info icons.', 'Colour/Text/Success/soft': 'Success text; on Background/Danger/soft use Text/Danger.',
  'Colour/Level/overlay': 'Background of a layer over an overlay.', 'Colour/Background/Overlay/soft': '' };
const ww = wrongWord(Object.keys(w), w);
ok('a description naming a sibling role and not its own is raised', ww.length === 1 && ww[0].name === 'Colour/Text/Info/default' && ww[0].names.join() === 'Danger');
ok('a sibling named only inside a quoted token path is a reference, not raised', !ww.some((x) => x.name === 'Colour/Text/Success/soft'));
ok('the type and property segments are not roles', !ww.some((x) => x.name === 'Colour/Level/overlay'));
const bare = { 'Text/Info/Default': 'Default colour for danger text.', 'Text/Danger/Default': 'Danger text.', 'Icon/Info/Default': 'Info icons.' };
ok('a name with no type prefix and a capitalised leaf is checked on its role', wrongWord(Object.keys(bare), bare).map((x) => x.name).join() === 'Text/Info/Default');
const one = { 'Colour/Text/Info/default': 'Default colour for danger text.', 'Colour/Text/Danger/default': 'Danger text.' };
ok('a collection of one type and property still checks the role', wrongWord(Object.keys(one), one).map((x) => x.name).join() === 'Colour/Text/Info/default');
ok('the coverage row carries the wrong-word list', Array.isArray(s.wrongWord));
console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
