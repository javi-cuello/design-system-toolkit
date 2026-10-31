#!/usr/bin/env node
// tools/parity/pair.mjs: which rendered element each contract element lands on.
import assert from 'node:assert/strict';
import { pairElements, selectorFor, fieldsFor } from './pair.mjs';
import { judge } from './external.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

// a node as collect() gives it; m holds what was measured
let i = 0;
const node = (o) => ({ index: i++, ancestors: [], tag: 'div', classes: [], text: '', svg: false, inSvg: false, descendants: 0, path: 'div', matches: [],
  ...o, m: { background: 'rgba(0, 0, 0, 0)', color: 'rgb(0, 0, 0)', radius: 0, 'padding-top': 0, 'padding-end': 0, 'padding-bottom': 0, 'padding-start': 0, 'border-width': 0, 'border-color': 'rgba(0, 0, 0, 0)', under: 'rgb(255, 255, 255)', paints: false, w: 40, h: 20, ...(o.m || {}) } });
const want = (anatomy) => (id, fields) => {
  const e = anatomy[id], out = {};
  for (const f of fields) {
    if (f === 'background') out.background = { want: { color: e.background } };
    if (f === 'color') out.color = { want: { color: e.kind === 'graphic' ? e.background : e.color } };
    if (f === 'radius') out.radius = { want: e.radius };
    if (f === 'border') { out['border-width'] = { want: e.border.width }; out['border-color'] = { want: { color: e.border.color } }; }
    if (f === 'padding') for (const s of ['top', 'end', 'bottom', 'start']) out[`padding-${s}`] = { want: e.layout.padding[s] };
  }
  return out;
};

// a tab bar: two tabs alike in padding; only the unselected one draws the design's grey label
const tabs = [node({ classes: ['MuiTab-root'], descendants: 1, m: { 'padding-top': 8, 'padding-bottom': 8, paints: false } }), node({ classes: ['MuiTab-root'], descendants: 1, m: { 'padding-top': 8, 'padding-bottom': 8 } })];
tabs.push(node({ text: 'Tab', ancestors: [tabs[0].index], m: { color: 'rgb(0, 0, 0)' } }), node({ text: 'Tab', ancestors: [tabs[1].index], m: { color: 'rgb(120, 120, 120)' } }));
const tabA = { content: { kind: 'container', layout: { padding: { top: 8, end: 0, bottom: 8, start: 0 } } }, 'content/label': { kind: 'text', color: 'rgb(120 120 120)' } };
const tp = pairElements(tabA, tabs, want(tabA), judge);
ok('a box lands on the element holding what its children landed on, where values alone tie', tp['content/label'].node === tabs[3] && tp.content.node === tabs[1]);

// a switch: the track paints, the element beside it holds the handle's inset
const sw = [node({ classes: ['MuiSwitch-switchBase'], descendants: 1, m: { 'padding-top': 4, 'padding-end': 4, 'padding-bottom': 4, 'padding-start': 4 } })];
sw.push(node({ classes: ['MuiSwitch-thumb'], ancestors: [sw[0].index], m: { background: 'rgb(0, 0, 0)', paints: true, radius: 8 } }));
sw.push(node({ classes: ['MuiSwitch-track'], m: { background: 'rgb(238, 238, 238)', paints: true, radius: 16, 'border-width': 1, 'border-color': 'rgb(100, 100, 100)', w: 52, h: 32 } }));
const swA = { root: { kind: 'container', background: 'rgb(238 238 238)', radius: 999, border: { width: 1.5, color: 'rgb(100 100 100)' }, layout: { padding: { top: 4, end: 4, bottom: 4, start: 4 } } }, handle: { kind: 'graphic', background: 'rgb(0 0 0)' } };
const sp = pairElements(swA, sw, want(swA), judge);
ok("a box's paint and its spacing land apart where code splits them; fully round is any radius half the box; a floored 1.5px border is found",
  sp.root.node === sw[2] && sp['root@space'].node === sw[0] && JSON.stringify(sp.root.fields) === '["background","radius","border"]');
ok('a shape code draws as a box is measured by its fill', sp.handle.node === sw[1] && JSON.stringify(sp.handle.fields) === '["background"]');

// values that differ cannot be what finds an element
const av = [node({ classes: ['MuiAvatar-root', 'MuiAvatar-circular'], m: { radius: 12, paints: true } }), node({ classes: ['MuiAvatar-root', 'MuiAvatar-colorDefault'], m: { radius: 12, paints: true } })];
const avA = { content: { kind: 'container', radius: 8 } };
// the framework's root class, as its profile names it (audit-defaults frameworks): the drawn-twice test reads it
const fw = { instance: 'Mui{Name}-root' };
ok('an element matching none of its values is placed by structure where only one thing can be it: one drawn twice is the first',
  pairElements(avA, av, want(avA), judge, undefined, fw).content?.by === 'structure' && pairElements(avA, av, want(avA), judge, undefined, fw).content.node === av[0]);
ok('…and with no framework root class known, two drawn alike are not taken for one', !pairElements(avA, av, want(avA), judge).content);
const two = [node({ classes: ['MuiAvatar-root'], m: { radius: 12, paints: true } }), node({ classes: ['MuiBadge-root'], m: { radius: 12, paints: true } })];
ok('…and is left unpaired where two different things could be it', !pairElements(avA, two, want(avA), judge, undefined, fw).content);
const half = [node({ classes: ['MuiSelect-select'], m: { 'padding-top': 9 } })];
const halfA = { field: { kind: 'container', layout: { padding: { top: 9, end: 12, bottom: 4, start: 12 } } } };
ok('a pairing showing fewer than half its own values is dropped, not counted', !pairElements(halfA, half, want(halfA), judge).field);
ok("a text's literal words choose between two texts showing the same values",
  pairElements({ label: { kind: 'text', content: 'Label', color: 'rgb(0 0 0)' } }, [node({ text: '*' }), node({ text: 'Label' })], want({ label: { kind: 'text', content: 'Label', color: 'rgb(0 0 0)' } }), judge).label.node.text === 'Label');
ok('what an element defines is what it is compared on: a box its paint and spacing (a zero padding by its value, whatever the token is called), text its colour and type, an instance nothing',
  fieldsFor({ kind: 'container', background: 'x', layout: { padding: { top: 'Space/none' } } }, (v) => ({ 'Space/none': 0 })[v] ?? v).join() === 'background' && fieldsFor({ kind: 'text' }).join() === 'color,typography' && !fieldsFor({ kind: 'instance' }).length);
const s1 = node({ classes: ['MuiChip-label', 'MuiChip-labelMedium'], matches: ['.MuiChip-label', '.MuiChip-labelMedium', '.MuiChip-label.MuiChip-labelMedium'] });
ok("a selector from the library's own class where it finds one element, else a path", selectorFor(s1, [s1]) === '#storybook-root .MuiChip-label' && selectorFor(node({ path: '.MuiStack-root > div:nth-of-type(1)' }), []) === '#storybook-root .MuiStack-root > div:nth-of-type(1)');

// a chip whose leading icon code draws blue (the difference to report) beside a delete icon in the design's red
const ch = [node({ classes: ['MuiChip-root'], m: { background: 'rgb(238, 238, 238)', paints: true } })];
ch.push(node({ classes: ['MuiChip-icon'], svg: true, ancestors: [ch[0].index], m: { color: 'rgb(0, 0, 255)' } }), node({ classes: ['MuiChip-deleteIcon'], svg: true, ancestors: [ch[0].index], m: { color: 'rgb(196, 13, 34)' } }));
const chA = { root: { kind: 'container', background: 'rgb(238 238 238)' }, 'root/iconContainer': { kind: 'instance', parent: 'root', order: 0 }, 'root/iconContainer/icon': { kind: 'graphic', parent: 'root/iconContainer', order: 0, background: 'rgb(196 13 34)' } };
const cp = pairElements(chA, ch, want(chA), judge);
ok("an icon lands on the drawn icons in order, never on a sibling that happens to match its colour: its own difference stays visible",
  cp['root/iconContainer/icon'].node === ch[1] && cp['root/iconContainer/icon'].score === 0 && cp['root/iconContainer/icon'].by === 'position');
// a shape on its own (a switch's handle) is never pinned to an svg by order: placed by its values
const sh = [node({ svg: true, m: { color: 'rgb(0, 0, 0)' } }), node({ m: { background: 'rgb(0, 0, 0)', paints: true } })];
const shA = { handle: { kind: 'graphic', background: 'rgb(0 0 0)' } };
ok('…and a shape drawn on its own is placed by its values, not by the order of svgs', pairElements(shA, sh, want(shA), judge).handle.by !== 'position');

// a dropdown: its chevron svg first (the design's chevron instance has no icon layer), then the error text with its icon
const dd = [node({ classes: ['MuiSelect-icon'], svg: true, m: { color: 'rgb(22, 22, 22)' } })];
dd.push(node({ classes: ['MuiFormHelperText-root'], text: 'Error', m: { color: 'rgb(196, 13, 34)' } }));
dd.push(node({ svg: true, ancestors: [dd[1].index], m: { color: 'rgb(196, 13, 34)' } }));
const ddA = { field: { kind: 'container' }, 'field/iconContainer': { kind: 'instance', parent: 'field', order: 0 }, errorMessage: { kind: 'container', order: 1 },
  'errorMessage/iconContainer': { kind: 'instance', parent: 'errorMessage', order: 0 }, 'errorMessage/iconContainer/icon': { kind: 'graphic', parent: 'errorMessage/iconContainer', order: 0, background: 'rgb(196 13 34)' },
  'errorMessage/errorText': { kind: 'text', parent: 'errorMessage', order: 1, color: 'rgb(196 13 34)' } };
ok('an icon placed by order sits beside its own group\'s text, not on an svg ahead of it the design holds no place for',
  pairElements(ddA, dd, want(ddA), judge)['errorMessage/iconContainer/icon'].node === dd[2]);

console.log(`${n}/${n} passed`);
