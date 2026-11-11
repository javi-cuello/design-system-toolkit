// scripts/describe-coverage.mjs over a small tokens.json. Run by bin/check.
import { coverage } from '../scripts/describe-coverage.mjs';
let pass = 0, fail = 0;
const ok = (name, c) => { if (c) { pass++; console.log('ok', name); } else { fail++; console.log('FAIL', name); } };
const tokens = { collections: {
  'Primitives': { modes: ['Value'], values: { Value: { 'Space/4': 4 } }, descriptions: {} },
  '04. Semantic': { modes: ['Light', 'Dark'],
    values: { Light: { 'Color/Background/Neutral/primary': '#fff', 'Color/Background/Danger/primary': '#f00', 'Color/Text/Neutral/primary': '#000' }, Dark: { 'Color/Text/Neutral/primary': '#fff', 'Elevation': 1 } },
    descriptions: { 'Color/Text/Neutral/primary': 'Body text.', 'Color/Background/Danger/primary': '  ' } } } };
const all = coverage(tokens);
ok('every collection, counted across modes once', all.length === 2 && all[1].variables === 4);
const s = coverage(tokens, 'semantic')[0];
ok('--only keeps the matching collections, case-blind', coverage(tokens, 'semantic').length === 1 && s.collection === '04. Semantic');
ok('a blank description counts as none', s.described === 1);
ok('the undescribed are grouped by grammar position, a bare name at top level',
  JSON.stringify(s.groups) === JSON.stringify({ 'Color/Background/Danger': ['Color/Background/Danger/primary'], 'Color/Background/Neutral': ['Color/Background/Neutral/primary'], '(top level)': ['Elevation'] }));
console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
