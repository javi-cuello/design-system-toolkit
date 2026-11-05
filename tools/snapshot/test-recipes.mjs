#!/usr/bin/env node
// tools/snapshot/recipes.cjs: shells, repeated regions, what varies and screen
// types, derived from stored screens. Run by bin/check.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { derive } = createRequire(import.meta.url)('./recipes.cjs');

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const frame = (name, gap, kids = [], extra = {}) => ({ name, type: 'FRAME', gap, pad: [0, 0, 0, 0], bindings: { gap: gap == null ? undefined : `Spacing/${gap}`, pad: ['Spacing/0', 'Spacing/0', 'Spacing/0', 'Spacing/0'] }, children: kids, ...extra });
const inst = (component, extra = {}) => ({ name: component, type: 'INSTANCE', instanceOf: `${component} / Size=md`, children: [frame('Inside', 4)], ...extra });
const app = (name, colGap, overlay) => ({ name, tree: { name, type: 'FRAME', children: [
  ...(overlay ? [inst(overlay, { absolute: true })] : []), inst('Sidebar'),
  frame('Main', 0, [inst('Page header'), frame('Section', 8, [frame('Block', 0, [frame('Column', colGap, [inst('Section marker'), { name: 'Hint', type: 'TEXT' }])])])]),
] } });
const lone = (name) => ({ name, tree: { name, type: 'FRAME', children: [frame('Main', 0, [frame('Container', 24)])] } });

const r = derive([
  app('<Projects> 1-1 - List', 32), app('<Projects> 1-2 - List - Empty', 32, 'Toast'),
  app('<Projects> 2-1 - Rename dialog - Error 2', 40, 'Dialog'), lone('<Login> 1-1 - Login'), lone('<Login> 1-2 - Login - Error 1'),
]);

ok('a shell is the laid-out top level; an absolute child is an overlay on it, counted',
  r.shells.length === 2 && JSON.stringify(r.shells[0].regions) === '[{"component":"Sidebar"},{"frame":"Main"}]' && r.shells[0].screens === 3
  && r.shells[0].overlays.components.Toast === 1 && r.shells[0].overlays.components.Dialog === 1 && JSON.stringify(r.shells[0].sections) === '["Projects"]'
  && JSON.stringify(r.shells[1].regions) === '[{"frame":"Main"}]');

ok('a region is a frame path two screens repeat, with its children by component name; an instance and a text are not entered',
  (() => { const col = r.regions.find((x) => x.path === 'Main/Section/Block/Column');
    return col && col.screens === 3 && col.children.components['Section marker'] === 3 && !('Hint' in col.children.frames) && !('Hint' in col.children.components)
      && !r.regions.some((x) => /Inside|Sidebar|Page header/.test(x.path)); })());

ok('a region whose gap is not one token varies, each value counted; the script picks none',
  JSON.stringify(r.varies.find((v) => v.path === 'Main/Section/Block/Column')) === JSON.stringify({ path: 'Main/Section/Block/Column', what: 'gap', values: { 'Spacing/32': 2, 'Spacing/40': 1 } })
  && !r.varies.some((v) => v.path === 'Main/Section'));

ok('an unbound value is its raw number, marked, so it shows as what to fix',
  (() => { const s = { name: '<A> 1-1 - B', tree: { children: [frame('Main', 0, [], { bindings: { gap: 'Spacing/0', pad: [null, 'Spacing/0', 'Spacing/0', 'Spacing/0'] }, pad: [204, 0, 0, 0] })] } };
    const m = derive([s, s]).regions.find((x) => x.path === 'Main'); return m && m.pad['204 (unbound) Spacing/0 Spacing/0 Spacing/0'] === 2; })());

ok('screen types come from the name taxonomy: each screen with the states drawn, a numbered state as one, no state as Default',
  JSON.stringify(r.screenTypes) === JSON.stringify([
    { section: 'Login', screen: 'Login', states: ['Default', 'Error'] },
    { section: 'Projects', screen: 'List', states: ['Default', 'Empty'] },
    { section: 'Projects', screen: 'Rename dialog', states: ['Error'] },
  ]));

ok('a frame named like a component is tallied apart from it; a nested absolute child is an overlay; a shape is not a region',
  (() => { const s = { name: '<A> 1-1 - B', tree: { children: [frame('Main', 0, [inst('Empty state'), frame('Empty state', 0), inst('Menu', { absolute: true }), { name: 'Divider', type: 'VECTOR' }])] } };
    const x = derive([s, s]); const m = x.regions.find((q) => q.path === 'Main');
    return m.children.components['Empty state'] === 2 && m.children.frames['Empty state'] === 2 && m.overlays.components.Menu === 2
      && !('Menu' in m.children.components) && !x.regions.some((q) => /Divider/.test(q.path)); })());

ok('a space-between row has no gap to bind, and a grid\'s gap is not read; a name the taxonomy does not read is listed',
  (() => { const sb = frame('Bar', null, [], { align: 'SPACE_BETWEEN/CENTER', gap: 32 }), g = frame('Grid', 12, [], { layout: 'GRID' });
    const s = { name: 'Untitled', tree: { children: [frame('Main', 0, [sb, g])] } };
    const x = derive([s, s]);
    return JSON.stringify(x.regions.find((q) => q.path === 'Main/Bar').gap) === '{"auto (space between)":2}'
      && JSON.stringify(x.regions.find((q) => q.path === 'Main/Grid').gap) === '{}' && JSON.stringify(x.unnamed) === '["Untitled","Untitled"]' && !x.varies.length; })());

ok('a slot is read where the screen fills it, under its component; the rest of the instance is not; a section is read case-blind',
  (() => { const dlg = { name: 'Dialog', type: 'INSTANCE', instanceOf: 'Dialog / Size=md', absolute: true, children: [{ name: '_Modal', type: 'INSTANCE', instanceOf: '_Modal', children: [frame('Chrome', 8), { name: 'Content slot', type: 'SLOT', gap: 16, pad: [0, 0, 0, 0], bindings: { gap: 'Spacing/16' }, children: [inst('Text input'), frame('Row', 8, [inst('Button')])] }] }] };
    const s = (name) => ({ name, tree: { children: [dlg, frame('Main', 0)] } });
    const x = derive([s('<Projects> 1-1 - A'), s('<projects> 1-2 - B')]);
    const slot = x.regions.find((q) => q.path === 'Dialog/_Modal/Content slot');
    return slot && slot.screens === 2 && slot.children.components['Text input'] === 2 && slot.children.frames.Row === 2
      && x.regions.some((q) => q.path === 'Dialog/_Modal/Content slot/Row') && !x.regions.some((q) => /Chrome/.test(q.path))
      && JSON.stringify(x.shells[0].sections) === '["Projects"]'; })());

ok('a slot inside an instance that fills another slot is read under both; a set name holding " / " is kept whole up to its first property',
  (() => { const inner = { name: 'Group', type: 'INSTANCE', instanceOf: 'Selection group / Size=md', children: [{ name: 'Content slot', type: 'SLOT', children: [{ name: 'Item', type: 'INSTANCE', instanceOf: 'Context menu item / Default / Selected=False' }] }] };
    const dlg = { name: 'Dialog', type: 'INSTANCE', instanceOf: 'Dialog', absolute: true, children: [{ name: 'Content slot', type: 'SLOT', children: [inner] }] };
    const s = { name: '<A> 1-1 - B', tree: { children: [dlg] } };
    const r2 = derive([s, s]).regions.find((q) => q.path === 'Dialog/Content slot/Selection group/Content slot');
    return r2 && r2.children.components['Context menu item / Default'] === 2; })());

// A screen that is one instance of a screen template, walked whole: the template is entered as the page,
// and the project's map names the code file that implements it (one project's 58 screens, 2026-11-05)
{
  const page = (name, gap) => ({ name, tree: { name, type: 'FRAME', children: [{ name: '_Home', type: 'INSTANCE', instanceOf: 'Screen templates/_Home', overrides: ['characters'],
    children: [frame('Header', 0, [inst('Top navigation')]), frame('Main', 0, [frame('Section', gap)]), { ...inst('Toast'), absolute: true }] }] } });
  const t = derive([page('<Desktop> 1-1 - Main', 24), page('<Desktop> 1-2 - Main - Empty', 24), page('<Mobile> 1-1 - Main', 16)],
    { code: { 'Screen templates/_Home': 'pages/home.tsx', 'Screen templates/_Gone': 'pages/gone.tsx', _note: 'a comment' }, exists: (f) => f !== 'pages/home.tsx' });
  const home = t.templates[0];
  ok('a screen that is one instance of a template lists the template: its screens, sections and the regions inside it, an overlay not among them',
    t.templates.length === 1 && home.component === 'Screen templates/_Home' && home.screens === 3 && JSON.stringify(home.sections) === '["Desktop","Mobile"]'
    && JSON.stringify(home.regions.frames) === '{"Header":3,"Main":3}' && !('Toast' in home.regions.components));
  ok("the template is entered as the page: its frames are regions under its name, and what varies inside it is said",
    t.regions.some((q) => q.path === 'Screen templates/_Home/Main/Section' && q.screens === 3) && t.varies.some((v) => v.path === 'Screen templates/_Home/Main/Section' && v.what === 'gap'));
  ok("the code file the project maps it to is given, a mapped file that is not there is marked, and a mapped name no screen uses is listed; the config's _note is neither",
    home.code === 'pages/home.tsx' && home.missing === true && JSON.stringify(t.unusedCode) === '["Screen templates/_Gone"]');
  ok('a screen laying out more than one child is not a template screen', r.templates.length === 0);
  const dialog = { name: '<Projects> 3-1 - Delete', tree: { children: [{ name: 'Dialog', type: 'INSTANCE', instanceOf: 'Dialog / Size=md', children: [frame('Header', 8), frame('Body', 16)] }] } };
  const d = derive([dialog, dialog], { code: { Dialog: { note: 'not a path' } } });
  ok("a screen that is one library instance is laid out by it: that component is its template, entered as its page; a mapped value that is not a path pairs nothing",
    d.templates.length === 1 && d.templates[0].component === 'Dialog' && d.templates[0].code === null && d.regions.some((q) => q.path === 'Dialog/Body'));
  ok('a templates value that is not a map maps nothing', JSON.stringify(derive([dialog], { code: 'pages/x.tsx' }).unusedCode) === '[]' && JSON.stringify(derive([dialog], { code: ['a.tsx'] }).unusedCode) === '[]');
}

console.log(`${n}/${n} passed`);
