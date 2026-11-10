#!/usr/bin/env node
// node tests/test-sections.mjs — scripts/sections.mjs, the Behaviour and
// Composition generator, against tests/fixtures/sections-composition.json (a
// composition.js result) and the settings projects.cjs prints. The golden file
// is the whole output: a change to any generated line shows here as a diff.
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, symlinkSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sections, check, settingsFrom, union, virtualGroups } from '../scripts/sections.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = (f) => join(HERE, 'fixtures', f);
const json = (f) => JSON.parse(readFileSync(FIX(f), 'utf8'));
const subjects = json('sections-composition.json');
const settings = settingsFrom(json('sections-settings.json'));

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const cli = execFileSync('node', [join(HERE, '../scripts/sections.mjs'), '--composition', FIX('sections-composition.json'), '--settings', FIX('sections-settings.json')], { encoding: 'utf8' });
assert.deepEqual(JSON.parse(cli), json('sections-expected.json'));
ok('sections: the CLI over the fixture prints the golden output', true);

ok('sections: the resting state is SCALES[stateAxis][0], and the axes come from TOKENS',
  JSON.stringify(settings) === JSON.stringify({ stateAxis: 'State', disabledAxis: 'Disabled', restState: 'Rest' }));

const [button, card] = subjects;
const g = sections(button, settings);
ok('sections: the state line lists the states in the axis\'s order, without the resting state, and names the axis',
  g.behaviour.includes('Interactive states on the `State` axis (`Hover`, `Focus`) and `Disabled` are managed by code and not applied in static designs'));
ok('sections: neither the state nor the disabled axis gets an "offers" line',
  !g.behaviour.some((l) => /`(State|Disabled)` axis offers/.test(l)));
ok('sections: a part one axis value selects exactly is said as that condition',
  g.composition.includes('Contains `Spinner` where `Size` is `Large`'));
ok('sections: a part no condition selects keeps its count and names the gap',
  g.composition.includes('Contains `Badge` in 3 of 8 variants') && g.gaps.some((x) => x.includes('which variants show `Badge`')));
ok('sections: a single-option axis is a reported defect, never an "offers" line',
  !g.behaviour.some((l) => l.includes('`Theme`')) && g.gaps.some((x) => x.includes('`Theme` axis has one option')));
ok('sections: a broken nested instance is a gap, never a Composition line',
  !g.composition.some((l) => l.includes('Ghost')) && g.gaps.some((x) => x.includes('`Ghost`')));

// Same input, same output: the part order composition.js happens to return does not move a line.
const shuffled = Object.assign({}, button, { parts: button.parts.slice().reverse() });
ok('sections: the order parts arrive in does not change the lists', JSON.stringify(sections(shuffled, settings)) === JSON.stringify(g));

const us = sections(button, Object.assign({}, settings, { language: 'en-US' }));
ok('sections: en-US takes its own heading and the same lines', us.markdown.startsWith('## Behavior\n') && JSON.stringify(us.behaviour) === JSON.stringify(g.behaviour));
assert.throws(() => sections(button, Object.assign({}, settings, { language: 'es' })), /written by hand/);
ok('sections: (negative) a language the lines are not written in is refused, not answered in English', true);

const bare = sections(button, {});
ok('sections: with no settings the state line is not guessed, and the gap says so',
  !bare.behaviour.some((l) => l.startsWith('Interactive states')) && bare.gaps.some((x) => x.startsWith('no stateAxis setting')));

ok('sections: a component with no axes has no Behaviour list and no Behaviour heading', !sections(card, settings).markdown.includes('## Behaviour'));

// --check: the written description must carry every generated line verbatim.
const written = 'A button triggers an action.\n\n' + g.markdown + '\n- The Loading state shows progress\n\n## Usage\n- Use for actions';
ok('check: a description carrying every generated line, plus written ones, passes', check(written, g).length === 0);
const reworded = written.replace('Contains `Spinner` where `Size` is `Large`', 'Contains a `Spinner` on large buttons');
ok('check: (negative) a reworded generated line is named', JSON.stringify(check(reworded, g)) === JSON.stringify(['Composition: Contains `Spinner` where `Size` is `Large`']));

// a live run (2026-10-30): one part swapped by two props read "the `Icon (20)` and `Icon (16)` prop"
const two = sections({ id: '1:1', name: 'X', variantCount: 1, variantNames: ['V=a'], broken: false, properties: [], parts: [{ name: 'house', inEvery: true, swappedBy: ['Icon (20)', 'Icon (16)'] }] }, settings);
ok('a part swapped by two props names them as props', two.composition.some((l) => /`Icon \(20\)` and `Icon \(16\)` props$/.test(l)));

// Run through a symlink, as ~/.claude/skills runs it: the main-module check once printed nothing and --check exited 0 (2026-10-30).
const tmp = mkdtempSync(join(tmpdir(), 'sections-'));
const link = join(tmp, 'sections.mjs');
symlinkSync(join(HERE, '../scripts/sections.mjs'), link);
const viaLink = spawnSync('node', [link, '--composition', FIX('sections-composition.json'), '--settings', FIX('sections-settings.json')], { encoding: 'utf8' });
ok('sections: (negative) run through a symlink the CLI still prints the golden output', viaLink.stdout.trim() !== '' && JSON.stringify(JSON.parse(viaLink.stdout)) === JSON.stringify(json('sections-expected.json')));
// --check over a descriptions file that lacks a subject: missing, never passed (2026-10-30).
const none = join(tmp, 'descriptions.json');
writeFileSync(none, JSON.stringify({}));
const absent = spawnSync('node', [link, '--composition', FIX('sections-composition.json'), '--settings', FIX('sections-settings.json'), '--check', none], { encoding: 'utf8' });
ok('check: (negative) a subject missing from the descriptions file is reported missing and exits 1',
  absent.status === 1 && /missing: Button \(1:1\) has no description/.test(absent.stdout));
rmSync(tmp, { recursive: true, force: true });

// A virtual set (step 2c): the members' lines as one union, a line only some have saying which subpart.
const barSubject = (id, name, props, parts) => ({ id, name, variantCount: 1, variantNames: ['Size=M'], broken: [], properties: props, parts });
const barA = barSubject('8:1', 'Top bar / Default', [{ name: 'Back', type: 'BOOLEAN' }], [{ name: 'Title', inEvery: true }, { name: 'Back button', inEvery: true, toggledBy: ['Back'] }]);
const barB = barSubject('8:2', 'Top bar / Main', [], [{ name: 'Title', inEvery: true }]);
const solo = barSubject('8:3', 'Lone / One', [], []);
const groups = virtualGroups([barA, barB, solo], ' / ');
ok('virtual sets: two members sharing a stem group; a lone slash-name does not', groups.length === 1 && groups[0].map((x) => x.id).join() === '8:1,8:2');
const u = union([barA, barB].map((x) => sections(x, settings)), ' / ');
ok('virtual sets: a line every member has stands as it is', u.composition.includes('Contains `Title`'));
ok('virtual sets: a line one member has says which subpart, and no axis is claimed for the set',
  u.behaviour.includes('The `Back` boolean shows or hides `Back button` (in the `Default` subpart)') && u.composition.includes('Contains `Back button`, revealed by the `Back` prop (in the `Default` subpart)'));
ok('virtual sets: one entry for the group, every member\'s id beside it, and the purpose paragraph named as the writer\'s',
  u.name === 'Top bar' && JSON.stringify(u.ids) === '["8:1","8:2"]' && u.gaps.some((x) => /opens with the group/.test(x)));
const tmp2 = mkdtempSync(join(tmpdir(), 'sections-'));
const comp = join(tmp2, 'composition.json'), desc = join(tmp2, 'descriptions.json');
writeFileSync(comp, JSON.stringify([barA, barB]));
const vcli = JSON.parse(execFileSync('node', [join(HERE, '../scripts/sections.mjs'), '--composition', comp, '--settings', FIX('sections-settings.json'), '--separator', ' / '], { encoding: 'utf8' }));
ok('virtual sets: --separator prints the group once, as union() does', vcli.length === 1 && vcli[0].markdown === union([barA, barB].map((x) => sections(x, settingsFrom(json('sections-settings.json')))), ' / ').markdown);
writeFileSync(desc, JSON.stringify({ '8:1': 'A top bar.\n\n' + vcli[0].markdown, '8:2': 'A top bar.\n\n' + sections(barB, settings).markdown }));
const partial = spawnSync('node', [join(HERE, '../scripts/sections.mjs'), '--composition', comp, '--settings', FIX('sections-settings.json'), '--separator', ' / ', '--check', desc], { encoding: 'utf8' });
ok('virtual sets: --check holds every member to the union; one written from its own lines alone fails', partial.status === 1 && /Top bar \(8:2\)/.test(partial.stdout) && !/Top bar \(8:1\)/.test(partial.stdout));
rmSync(tmp2, { recursive: true, force: true });
// A screen template (2026-11-10, a project's Screen): the size its axis decides, and the reference
// screens the snapshot records, generated so neither is a hand copy that goes stale on a rename.
const shell = { id: '9:1', name: 'Screen', variantCount: 2, variantNames: ['Fixed height=True', 'Fixed height=False'], broken: [],
  properties: [{ name: 'Fixed height', type: 'VARIANT', options: ['True', 'False'] }, { name: 'Content slot', type: 'SLOT' }],
  sizes: { 'Fixed height=True': { w: 1440, h: 900 }, 'Fixed height=False': { w: 1440, h: 'hug' } }, parts: [{ name: 'App header', inEvery: true }] };
const recipes = { templates: [{ component: 'Components/Screen', names: ['<Screens> 1-1 - Table', '<Screens> 3-1 - Settings'] }] };
const sh = sections(shell, Object.assign({}, settings, { recipes }));
ok('templates: an axis that makes a side fixed or growing says the size of each option',
  sh.behaviour.includes('At `Fixed height` `True` it is 1440 × 900; at `False` it is 1440 wide and grows with its content in height'));
ok('templates: the reference screens come from the recipe, matched past the path the snapshot records',
  JSON.stringify(sh.usage) === JSON.stringify(['Start from the reference screen closest to the new one: `<Screens> 1-1 - Table` or `<Screens> 3-1 - Settings`']) && /\n## Usage\n- Start from/.test(sh.markdown));
const sized = Object.assign({}, shell, { properties: [{ name: 'Size', type: 'VARIANT', options: ['True', 'False'] }], variantNames: ['Size=True', 'Size=False'], sizes: { 'Size=True': { w: 32, h: 32 }, 'Size=False': { w: 40, h: 40 } } });
ok('templates: (negative) an axis whose options differ only in numbers gets no size line', !sections(sized, settings).behaviour.some((l) => l.startsWith('At ')));
ok('templates: (negative) with no recipe, or none built on it, there is no Usage line', sections(shell, settings).usage.length === 0 && sections(Object.assign({}, shell, { name: 'Card' }), Object.assign({}, settings, { recipes })).usage.length === 0);
const twin = { templates: [{ component: 'Desktop/Screen', names: ['A'] }, { component: 'Mobile/Screen', names: ['B'] }] };
const tw = sections(shell, Object.assign({}, settings, { recipes: twin }));
ok('templates: two templates ending in the name give no Usage line and a gap; an exact name wins over a path',
  tw.usage.length === 0 && tw.gaps.some((x) => x.startsWith('Usage: which reference screens'))
  && sections(shell, Object.assign({}, settings, { recipes: { templates: [{ component: 'Old/Screen', names: ['A'] }, { component: 'Screen', names: ['B'] }] } })).usage[0].endsWith('`B`'));
const shellMd = 'The shell.\n\n' + sh.markdown + '\n- Put only the page body in `Content slot`';
ok('check: the generated Usage line is held like the others, and the writer\'s lines beside it pass', check(shellMd, sh).length === 0 && check(shellMd.replace('closest to the new one', 'nearest'), sh).length === 1);
ok('check: a generated line under a second heading of the same name still counts',
  check('The shell.\n\n## Usage\n- Mine\n\n' + sh.markdown, sh).length === 0);
const uMember = (id, name) => sections(barSubject(id, name, [], []), Object.assign({}, settings, { recipes: { templates: [{ component: 'Shell / Desktop', names: ['Home'] }] } }));
const vu = union([uMember('9:5', 'Shell / Desktop'), uMember('9:6', 'Shell / Mobile')], ' / ');
ok('virtual sets: a Usage line one member has says which subpart', JSON.stringify(vu.usage) === JSON.stringify(['Start from the reference screen closest to the new one: `Home` (in the `Desktop` subpart)']));
const tmp3 = mkdtempSync(join(tmpdir(), 'sections-'));
writeFileSync(join(tmp3, 'c.json'), JSON.stringify([shell])); writeFileSync(join(tmp3, 'r.json'), JSON.stringify(recipes));
const rcli = JSON.parse(execFileSync('node', [join(HERE, '../scripts/sections.mjs'), '--composition', join(tmp3, 'c.json'), '--recipes', join(tmp3, 'r.json')], { encoding: 'utf8' }));
ok('templates: --recipes on the CLI reads the file recipes.cjs prints', JSON.stringify(rcli[0].usage) === JSON.stringify(sh.usage));
rmSync(tmp3, { recursive: true, force: true });

console.log(`\n${n} assertions passed`);
