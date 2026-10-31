#!/usr/bin/env node
// node tools/parity/test-gates.mjs — from the toolkit root. The gates that
// need no browser, each fed the defect it exists for.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { slotsOf, unnamedOverrides, overrides, screenCoverage, componentCoverage, layerCoverage, copyMissing, staleContent, backlog, rawValues, glob, waivers, specKeys, configured } from './gates.mjs';
import { resolveBases } from './project.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── overrides (gates 18, 27): one project's fixtures, carried over ─────── */
const library = new Map([['Avatar', { name: 'Avatar', variants: [
  { name: 'Content=Icon, Size=md', fills: ['Purple'], radius: 999 },
  { name: 'Content=Icon, Size=lg', fills: ['Purple'], radius: 999 },
] }]]);
const frame = (fills) => ({ name: 'Frame', children: [{ name: 'Marker', children: [{ name: 'Avatar', instanceOf: 'Avatar / Content=Icon, Size=lg', fills, radius: 999 }] }] });
ok('a value the frame changes inside an instance, on a layer nobody maps, is a finding',
  eq(unnamedOverrides(frame(['Blue']), { layers: new Set(['Marker']), library }), [{ layer: 'Marker > Avatar', field: 'fills', was: ['Purple'], now: ['Blue'] }]));
ok('mapping the layer answers it, and so does a reason, globbed or not',
  !unnamedOverrides(frame(['Blue']), { layers: new Set(['Marker', 'Marker > Avatar']), library }).length
  && !unnamedOverrides(frame(['Blue']), { layers: new Set(), waived: { 'Marker > Avatar.fills': 'the picture' }, library }).length
  && !unnamedOverrides(frame(['Blue']), { layers: new Set(), waived: { '* > Avatar.fills': 'every marker' }, library }).length);
ok('a value the frame leaves alone, and an instance of something with no spec, say nothing',
  !unnamedOverrides(frame(['Purple']), { layers: new Set(), library }).length
  && !unnamedOverrides({ name: 'F', children: [{ name: 'mail', instanceOf: 'mail / Size=24', fills: ['Blue'] }] }, { layers: new Set(), library }).length);
const groupLibrary = new Map([['Selection group', { name: 'Selection group', variants: [{ name: 'Validation=None', children: [
  { name: 'Label', instanceOf: '_Label / Required=True', props: { Indicator: true, Required: 'True', 'Label text': 'Label' } }] }] }]]);
const placed = (indicator) => ({ name: 'F', children: [{ name: 'Selection group', instanceOf: 'Selection group / Validation=None', props: {},
  children: [{ name: 'Label', instanceOf: '_Label / Required=True', props: { Indicator: indicator, Required: 'True', 'Label text': 'Role' } }] }] });
ok('a switch turned inside the placed instance is a finding on that inner layer, and new words are not',
  eq(unnamedOverrides(placed(false), { layers: new Set(['Selection group']), library: groupLibrary }), [{ layer: 'Selection group > Label', field: 'props.Indicator', was: true, now: false }])
  && !unnamedOverrides(placed(true), { layers: new Set(), library: groupLibrary }).length);
// 13 Oct: a library named its text prop `Label`, with no " text": words are
// known by the prop's type in the library, so new words are still no finding.
{
  const typed = new Map([['Selection group', groupLibrary.get('Selection group')], ['_Label', { name: '_Label', props: { Label: 'TEXT', Indicator: 'BOOLEAN' }, variants: [{ name: 'Required=True' }] }]]);
  const named = (label) => ({ name: 'F', children: [{ name: 'Selection group', instanceOf: 'Selection group / Validation=None', props: {},
    children: [{ name: 'Label', instanceOf: '_Label / Required=True', props: { Indicator: true, Required: 'True', Label: label } }] }] });
  typed.get('Selection group').variants[0].children[0].props.Label = 'Label';
  ok('a text prop named without " text" is still words, by its type in the library',
    !unnamedOverrides(named('Role'), { layers: new Set(), library: typed }).length);
}
// Review 2026-10-02 round 2, R10: an `overrides` reason had no staleness.
{
  const T = (name, fills, ov) => ({ name, kind: 'screen', mapping: { layers: { Marker: '.m' }, overrides: ov }, spec: { variants: [frame(fills)] } });
  const shared = { 'Marker > Avatar.fills': 'the picture' };
  const out = overrides({ library, targets: [T('a', ['Purple'], shared), T('b', ['Blue'], shared), T('c', ['Purple'], { '* > Avatar.fills': 'gone' })] });
  ok('an overrides reason no target declaring it needs is stale; one a sharer needs is not',
    out.length === 1 && /c: overrides "\* > Avatar\.fills" excuses nothing/.test(out[0]));
}
ok('an empty library is refused, not passed', (() => { try { unnamedOverrides(frame([]), { layers: new Set(), library: new Map() }); return false; } catch { return true; } })());

/* ── layer coverage (gates 8, 13) ──────────────────────────────────────── */
const card = (name) => ({ name, type: 'FRAME', children: [{ name: 'Title', type: 'TEXT' }] });
const screen = { name: 'S', type: 'FRAME', children: [
  { name: 'Main', type: 'FRAME', fills: ['Bg'], children: [card('Card'), card('Card'), card('Card')] },
  { name: 'Dialog', type: 'INSTANCE', instanceOf: 'Dialog', children: [{ name: 'Header', type: 'FRAME' }, { name: 'Content slot', type: 'SLOT', children: [{ name: 'Form', type: 'FRAME' }] }] },
  { name: 'Sort', type: 'FRAME', children: [{ name: 'Label', type: 'TEXT' }] },
] };
const base = { Main: 'main', 'Main > Card': '.card', 'Main > Card > Title': '.card h2', Dialog: 'dialog', Sort: '.sort', 'Sort > Label': null };
const { Sort: _s, 'Sort > Label': _l, ...unsorted } = base;
ok('a slot holds the screen\'s own layers, a component\'s own parts are its instance\'s, and repeated cards stand behind one',
  eq(screenCoverage(screen, { layers: base }).missed, ['Dialog > Content slot > Form']));
ok('a wrapper mapped to null that paints is a miss, and a layer excused takes its subtree',
  eq(screenCoverage(screen, { layers: { ...base, Main: null, 'Dialog > Content slot > Form': '.form' } }).missed, ['Main (mapped to null, but it paints)'])
  && !screenCoverage(screen, { layers: { ...unsorted, 'Dialog > Content slot > Form': '.form' }, excluded: { Sort: 'not built' } }).missed.length
  && eq(screenCoverage(screen, { layers: { ...unsorted, 'Dialog > Content slot > Form': '.form' } }).missed, ['Sort', 'Sort > Label']));
// Review 2026-10-02 round 3, S1: a slot was found by the name "Content slot",
// so a SLOT called "Main menu slot" was walked as its instance's chrome and the
// seven navigation buttons in two of them were never counted (home, 0 missed).
const navScreen = { name: 'S', type: 'FRAME', children: [
  { name: 'Top navigation', type: 'INSTANCE', instanceOf: 'Top navigation', children: [{ name: 'Main menu slot', type: 'SLOT', children: [{ name: 'Navigation button', type: 'INSTANCE', instanceOf: 'Navigation button' }] }] },
  { name: 'Card', type: 'INSTANCE', instanceOf: 'Card', children: [{ name: 'Content slot', type: 'FRAME', children: [{ name: 'Placeholder', type: 'FRAME' }] }] },
] };
ok('a slot is a SLOT whatever it is called, and a frame called "Content slot" is not one',
  eq(screenCoverage(navScreen, { layers: { 'Top navigation': 'nav', Card: '.card' } }).missed, ['Top navigation > Main menu slot > Navigation button']));
ok('an excuse for a layer the frame no longer draws is stale', eq(screenCoverage(screen, { layers: base, excluded: { Filter: 'gone' } }).stale, ['Filter']));
// Review 2026-10-02 item 19: a -present waiver on a layer the frame draws took
// its subtree here and was never stale; that is `excluded`'s job alone.
ok('a -present waiver no longer credits a null-mapped painter; excluded does',
  eq(screenCoverage(screen, { layers: { ...base, Main: null, 'Dialog > Content slot > Form': '.form' }, waivers: { 'Main.-present': 'behind the dialog' } }).missed, ['Main (mapped to null, but it paints)'])
  && !screenCoverage(screen, { layers: { ...base, Main: null, 'Dialog > Content slot > Form': '.form' }, excluded: { Main: 'behind the dialog' } }).missed.length);

/* ── waivers (gate 6, at load) ─────────────────────────────────────────── */
// Review 2026-10-02 items 1, 17, 19: an open number, a field nothing reads, a
// key respelled out from under its layer, a -present on a layer the frame
// draws, and a base's `false` that drops nothing — each sat green.
const target = (name, kind, tree, layers, declared) => ({ name, kind, spec: { variants: [tree] }, mapping: { layers, waivers: declared }, variants: new Map([[tree.name, { layers, own: {} }]]) });
const frameTree = { name: 'F', type: 'FRAME', children: [{ name: 'Main', type: 'FRAME', children: [{ name: 'Title', type: 'TEXT' }] }] };
const unused = [];
resolveBases({ a: { nodes: { Main: 'main' } }, b: { base: 'a', nodes: { Main: false, Aside: false } } }, unused);
const found = waivers({ unusedFalse: unused, targets: [
  target('home', 'screen', frameTree, { Main: 'main', 'Main > Title': 'h1', Toggle: '.toggle' }, {
    'Main > Title.width': { reason: 'Figma rounds the line', fix: 'figma', within: 0.7 },
    'Main.height': 'the feed',
    'Title.width': { reason: 'a short path', content: true, within: 2 },
    'Main.-present': { reason: 'behind the dialog', decision: true },
    'Toggle.-present': { reason: 'the page keeps the switch', fix: 'figma' },
    'Main > Title.color': { reason: 'r', decision: true, accepted: true },
  }),
] });
// Round 3: a `*` key under waivers passed the gate and excused nothing (only
// appWaivers expand one), and as a decision it was never stale either.
ok('a glob outside appWaivers is refused; inside them it is read',
  waivers({ targets: [target('home', 'screen', frameTree, { Main: 'main' }, { '*Main.background-color': { reason: 'r', decision: true } })] }).some((l) => /read in appWaivers only/.test(l))
  && !waivers({ targets: [{ ...target('home', 'screen', frameTree, { Main: 'main' }, {}), mapping: { layers: { Main: 'main' }, waivers: {}, appWaivers: { 'Ma*': { reason: 'live', content: true } } } }] }).some((l) => /appWaivers only/.test(l)));
ok('the waivers gate names an open number with no owner, a short path that names nothing, a -present the frame draws, a field nothing reads and a false that drops nothing; a mapped -present passes',
  found.some((l) => /Main\.height: no owner/.test(l)) && found.some((l) => /Main\.height: height is a number/.test(l))
  && found.some((l) => /Title\.width — no variant or frame that declares it draws Title/.test(l))
  && found.some((l) => /Main\.-present — the frame draws Main/.test(l)) && found.some((l) => /"accepted" is not a waiver field/.test(l))
  && found.some((l) => /^b: nodes "Aside" is false and inherits nothing/.test(l)) && !found.some((l) => /"Main" is false/.test(l))
  && !found.some((l) => /Toggle/.test(l)) && !found.some((l) => /Main > Title\.width/.test(l)));
const variant = { name: 'V', type: 'COMPONENT', children: [{ name: 'Box', type: 'FRAME', children: [{ name: 'Badge', type: 'INSTANCE', instanceOf: 'Badge / Tone=Red', children: [{ name: 'Dot' }] }] },
  { name: 'Content slot', type: 'SLOT', children: [{ name: 'Placeholder', type: 'FRAME' }] }, { name: 'Vector', type: 'VECTOR' }] };
ok('a variant\'s library instance under a mapped layer is its own run\'s, what its slot holds is the caller\'s, and Figma\'s primitives are not layers',
  eq(componentCoverage(variant, { Box: '.box', 'Content slot': '.slot' }, new Set(['Badge'])).missed, [])
  && eq(componentCoverage(variant, { 'Content slot': '.slot' }, new Set(['Badge'])).missed, ['Box'])
  // S1: the slot is the type, not the name
  && eq(componentCoverage({ ...variant, children: [{ name: 'Buttons slot', type: 'SLOT', children: [{ name: 'Placeholder', type: 'FRAME' }] }] }, { 'Buttons slot': '.b' }, new Set()).missed, [])
  && eq(componentCoverage({ ...variant, children: [{ name: 'Content slot', type: 'FRAME', children: [{ name: 'Placeholder', type: 'FRAME' }] }] }, { 'Content slot': '.b' }, new Set()).missed, ['Content slot > Placeholder'])
  // round 4 (F1): a variant the plugin derived from a boolean records its slot as a FRAME; the set's props still say which names are slots
  && eq(componentCoverage({ ...variant, children: [{ name: 'Main menu slot', type: 'FRAME', children: [{ name: 'Navigation button', type: 'INSTANCE' }] }] }, { 'Main menu slot': '.b' }, new Set(), slotsOf({ props: { 'Main menu slot': 'SLOT', 'Title text': 'TEXT' } })).missed, [])
  && eq(slotsOf({ props: { 'Main menu slot': 'SLOT', 'Title text': 'TEXT' } }).size, 1) && eq(slotsOf(undefined).size, 0));
ok('a library instance is credited by its component\'s name, whatever folder the store keeps it in (a platform library stores `mobile-badge`)',
  eq(layerCoverage({ parity: {}, library: new Map([['Badge', {}]]), specs: new Map([['mobile-badge', {}]]), targets: [target('card', 'component', variant, { Box: '.box', 'Content slot': '.slot' }, {})] }), []));

/* ── copy ─────────────────────────────────────────────────────────────── */
const copyFrame = { name: 'F', children: [{ name: 'A', text: 'Javi is asking you for a\nMid UI Designer role' }, { name: 'B', text: 'Drive the strategy\nOwn the system' }, { name: 'C', text: '19 August 2026' }, { name: 'D', text: 'Import' }] };
const said = ['Javi is asking you for a Mid UI Designer role', 'Drive the strategy', 'Import 12 rows', '2 October 2026'];
const c = copyMissing(copyFrame, said, { content: { '* 2026': 'the feed\'s dates' } });
ok('a text is said whole or line by line, a word inside a longer one is not said, and a globbed excuse answers its family',
  eq(c.missing, ['Own the system', 'Import']) && eq([...c.used], ['* 2026']));
ok('an excuse is stale only when no frame that declares it still needs it',
  eq(staleContent([{ name: 'a', declared: { Detals: 'typo' }, used: new Set() }, { name: 'b', declared: { Detals: 'typo' }, used: new Set(['Detals']) }]), [])
  && eq(staleContent([{ name: 'a', declared: { Detals: 'typo' }, used: new Set() }]).map((s) => s.key), ['Detals']));

/* ── backlog (gate 2) ─────────────────────────────────────────────────── */
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-gates-'));
for (const f of ['button', 'chip', 'icon', 'link']) fs.mkdirSync(path.join(dir, f));
const icons = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-icons-'));
fs.writeFileSync(path.join(icons, 'house-16.svg'), '');
const project = (entries) => ({
  repo: dir, parity: { backlog: 'backlog.json' }, backlog: entries, paths: { components: dir, icons },
  specs: new Map([['button', {}], ['chip', {}]]), frames: new Map([['1-1-home', {}], ['1-2-scroll', {}]]),
  targets: [{ kind: 'component', folder: 'button' }, { kind: 'screen', folder: '1-1-home' }],
  snapshot: { _meta: { icons: ['house', 'star'] } },
});
const b = backlog(project({ chip: 'not built yet: the design is a week old and has no story', '1-2-scroll': { needs: 'scroll-position', reason: 'the runner cannot scroll' }, _code: { icon: 'one snippet draws every glyph', link: '' } }));
ok('a screen excused by a capability the runner has is refused, a folder with no spec needs a reason, and a missing icon is named',
  b.some((x) => /1-2-scroll: a screen is excused only by/.test(x)) && b.some((x) => /^link: under `_code`.* with no reason/.test(x))
  && b.some((x) => /icon star: in the library, missing/.test(x)) && !b.some((x) => /^chip:/.test(x)) && !b.some((x) => /^icon:/.test(x)));
// Review 2026-10-02 item 41: carried by one project's own test, dropped in the move
ok('a screen\'s reason says enough to argue with, and never that its code is in src/app',
  backlog(project({ '1-2-scroll': { needs: 'interaction', reason: 'a drag' } })).some((x) => /^1-2-scroll: a screen's reason has to say enough/.test(x))
  && backlog(project({ '1-2-scroll': { needs: 'interaction', reason: 'the page is built under src/app and the run cannot open it at all' } })).some((x) => /^1-2-scroll: excused for where its code lives/.test(x))
  && !backlog(project({ '1-2-scroll': { needs: 'interaction', reason: 'the state exists only mid-drag, after a gesture the page state cannot drive' } })).some((x) => /^1-2-scroll/.test(x)));
ok('a spec or a frame nothing maps and nothing excuses fails, and an entry for what is measured is stale',
  backlog(project({ button: 'old' })).some((x) => /^button: in backlog.json and measured/.test(x))
  && backlog(project({})).some((x) => /^chip: a component spec nothing maps/.test(x)) && backlog(project({})).some((x) => /^1-2-scroll: a frame marked ready for dev that nothing maps/.test(x)));
fs.rmSync(dir, { recursive: true, force: true });
fs.rmSync(icons, { recursive: true, force: true });

/* ── gate 10 across projects, and what a project leaves off ───────────── */
// Review 2026-10-02 item 6: a registered repo missing from this machine made
// every project's gate red.
ok('a registered project not on this machine is a note, and stale excuses wait for it', (() => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-keys-'));
  fs.mkdirSync(path.join(root, 'gone'), { recursive: true });
  fs.writeFileSync(path.join(root, 'gone', 'design-system-context.md'), '```json snapshot-routing\n' + JSON.stringify({ repo: path.join(root, 'nowhere'), files: { screens: { key: 'k', id: 'i' } } }) + '\n```\n');
  const r = specKeys({ repo: root, specs: new Map(), frames: new Map(), snapshot: {} }, root);
  fs.rmSync(root, { recursive: true, force: true });
  return !r.findings.some((f) => /cannot be read|not on this machine/.test(f)) && r.notes.some((x) => /not on this machine/.test(x));
})());
// Review 2026-10-02 item 18: three opt-ins off on one project, said nowhere
ok('what a project leaves off is said, and what it turns on is not', (() => {
  const t = (kind, m) => ({ kind, mapping: m });
  const off = configured({ parity: {}, targets: [t('screen', { route: '/' })] }).notes.join(' | ');
  const on = configured({ parity: { position: true, props: {}, children: true, baseline: {} }, targets: [t('component', { controls: {}, variants: [] }), t('screen', { storyId: 's' })] }).notes;
  return ['position', 'props', 'children', 'codeOnly', 'copy', 'baseline'].every((k) => off.includes(`${k}: not configured`)) && on.length === 0;
})());

/* ── literals (gate 5), and the glob every excuse table shares ─────────── */
ok('a typed hex, an unbound gap and an unbound radius are raw; a bound one and a space-between gap are not',
  eq(rawValues({ fills: ['#fff'], gap: 8, radius: 4, bindings: { radius: 'Corner/4' } }).map(([k]) => k), ['fill', 'gap'])
  && !rawValues({ gap: 8, align: 'SPACE_BETWEEN/CENTER' }).length);
ok('a glob spans anything and keeps the rest literal', glob('Main > Section* > Card*.width').test('Main > Section#2 > Card#3.width') && !glob('A.b').test('Axb'));
console.log(`${n}/${n} passed`);
