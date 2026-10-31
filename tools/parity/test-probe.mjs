#!/usr/bin/env node
// node tools/parity/test-probe.mjs — from the toolkit root. What the probe
// reads, against real Chrome ($CHROME, else the macOS default install); skips,
// saying so, without one.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { launch, newPage, attach, navigate, viewport, forceState, findChrome } from '../shared/cdp.mjs';
import { probe, measure } from './probe.mjs';

const CHROME = findChrome();
if (!existsSync(CHROME)) {
  console.log(`SKIPPED: no Chrome at ${CHROME} — set CHROME to run tools/parity/test-probe.mjs`);
  process.exit(0);
}
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const PAGE = `<!doctype html><html data-theme="dark"><head><style>
  body { margin: 0 }
  #box { box-sizing: content-box; width: 100px; height: 20px; padding: 10px; border: 2px solid; }
  #flex { display: flex; flex-direction: column; } #grid { display: grid; } #row { display: flex; column-gap: 12px; }
  #cut { height: 6px; overflow: hidden; font: 16px/1 sans-serif; }
  #ring { outline: 2px solid rgb(255, 0, 0); outline-offset: 3px; }
  #rround { width: 100px; height: 40px; border-radius: 12px; outline: 2px solid rgb(0, 0, 0); outline-offset: 2px; }
  #rpill { width: 100px; height: 40px; border-radius: 9999px; outline: 2px solid rgb(0, 0, 0); outline-offset: 2px; }
  #rsquare { width: 100px; height: 40px; outline: 2px solid rgb(0, 0, 0); outline-offset: 2px; }
  #shadow { box-shadow: rgba(0, 0, 0, 0.2) 0px 4px 8px 0px, rgb(0, 0, 255) 0px 0px 0px 3px; }
  #plain { outline-style: none; outline-width: 7px; }
  #turned { width: 40px; height: 10px; transform: rotate(45deg); }
  #pseudo::before { content: ''; display: block; width: 33px; height: 5px; }
  .card:hover .title { color: rgb(0, 0, 255); }
  .field:has(input:focus-visible) { outline: 2px solid rgb(0, 128, 0); }
  .slot:hover { background-color: rgb(255, 0, 0); }
  .group:focus-within { background-color: rgb(255, 255, 0); }
  #edge { border-bottom: 1px solid rgb(0, 0, 0); } #inset { box-shadow: inset 0 -1px 0 0 rgb(0, 0, 0); } #ghost { border: 1px solid transparent; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0); }
  #clamp { -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; } #nowrap { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
  #tracks { display: grid; grid-template-columns: 50px 50px 50px; justify-content: space-between; width: 400px; } #tracks > i { display: block; height: 10px; }
  #centred { width: 300px; padding: 0 8px; } #centred > i { display: block; width: 100px; height: 10px; margin-inline: auto; }
  #focused { width: 20px; height: 20px; box-shadow: inset 0 0 0 1px rgb(0, 0, 255); outline: 2px solid rgb(255, 0, 0); outline-offset: 2px; }
  #wrapped { display: flex; flex-wrap: wrap; width: 100px; } #wrapped > i { display: block; width: 60px; height: 10px; } #wrapped > i + i { height: 20px; }
  #slot { position: relative; width: 20px; height: 20px; } #slot > span { position: absolute; inset: 0; }
  #inring { width: 20px; height: 20px; outline: 1px solid rgb(0, 0, 0); outline-offset: -1px; }
  #hidden { width: 24px; height: 24px; display: none; } #faded { width: 24px; height: 24px; opacity: 0; }
  #acut { height: 6px; overflow-x: clip; white-space: nowrap; font: 16px/1 sans-serif; }
  #spin { width: 16px; height: 16px; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
</style></head><body>
  <div style="height: 900px"></div>
  <section id="one"><div id="box">x</div><span id="inline">words</span><div id="flex"><i></i><i></i></div><div id="grid"></div>
    <div id="row"><b></b><b></b></div><div id="cut">Xg</div><div id="ring"></div><div id="rround"></div><div id="rpill"></div><div id="rsquare"></div><div id="shadow"></div><div id="plain"></div><div id="rings" style="outline: 1px solid red"><i style="outline: 2px solid blue"></i><i style="outline: 2px solid transparent"></i><i style="outline: 2px none red"></i></div><div id="pseudo"></div><div id="turned"></div>
    <x-card><x-label>Go</x-label></x-card>
    <div id="edge">e</div><div id="inset">i</div><div id="ghost">g</div><p id="clamp">two  lines</p><p id="nowrap">one</p><div id="tracks"><i></i><i></i><i></i></div><div id="centred"><i></i></div><div id="wrapped"><i></i><i></i></div><div id="slot"><span></span></div><textarea id="ta" style="border: 0; background: none"></textarea><div id="inring"></div><div id="focused"></div><i id="hidden"></i><i id="faded"></i><div id="empty"></div><input type="checkbox" id="tick"><div id="acut">Xg</div><div id="spin"></div><p id="vfill" style="margin: 0; height: 40px; line-height: 40px">Xg</p><p id="vtop" style="margin: 0; height: 40px; line-height: 20px">Xg</p><p id="vmid" style="margin: 0; height: 40px; line-height: 20px; display: flex; align-items: center">Xg</p></section>
  <section id="two"><div id="box" style="width: 10px">y</div></section>
  <div class="slot"><div class="card"><p class="title">t</p></div></div><div class="slot"><div class="card"><p class="title">u</p></div></div>
  <div class="group"><label class="field"><input id="in"></label></div>
  <div id="wobble"></div><script>let w = 1; setInterval(() => { document.getElementById('wobble').style.width = (w++) + 'px'; }, 30);</script>
</body></html>`;
const server = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(PAGE); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await launch({ chrome: CHROME });
const tab = await attach(await newPage(browser.endpoint));
await viewport(tab, 800, 600);
await navigate(tab, `http://127.0.0.1:${server.address().port}/`);
await tab.evaluate('scrollTo(0, 500); true');
const read = (layers, opts, scope = '#one') => tab.evaluate(`(${probe})(${JSON.stringify({ k: { scope, layers } })}, ${JSON.stringify(opts || {})})`);
const one = async (selector, props, opts) => (await read({ L: { selector, props } }, opts)).k.L;

try {
  ok('an edge is a border or an inset shadow; a transparent one draws nothing',
    (await one('#edge', ['-stroke']))['-stroke'] === 'a border' && (await one('#inset', ['-stroke']))['-stroke'] === 'an inset ring' && (await one('#ghost', ['-stroke']))['-stroke'] === 'none');
  ok('a line clamp is its lines, a nowrap one line, and either is a cut with an ellipsis',
    (await one('#clamp', ['-max-lines', '-truncate']))['-max-lines'] === '2' && (await one('#nowrap', ['-max-lines', '-truncate']))['-truncate'] === 'ellipsis'
    && (await one('#box', ['-max-lines']))['-max-lines'] === 'unlimited' && (await one('#clamp', ['-text']))['-text'] === 'two lines');
  ok('a hidden element keeps its stylesheet width but renders nothing; nor does one at opacity 0, an empty block, or a pseudo-element with no content',
    (await one('#hidden', ['width', '-rendered']))['-rendered'] === 'no' && (await one('#faded', ['-rendered']))['-rendered'] === 'no' && (await one('#box', ['-rendered']))['-rendered'] === 'yes'
    && (await one('#empty', ['-rendered']))['-rendered'] === 'no' && (await one('#box::after', ['-rendered']))['-rendered'] === 'no' && (await one('#pseudo::before', ['-rendered']))['-rendered'] === 'yes');
  ok('a size is the border box, padding and border included, as Figma\'s w is', (await one('#box', ['width', 'height'])).width === '124px');
  ok('a turned box is its own size, not the rect its turn sweeps', (await one('#turned', ['width'])).width === '40px');
  ok('an inline element has a width too (its computed width is auto)', /^\d+(\.\d+)?px$/.test((await one('#inline', ['width'])).width));
  ok('a gap nobody set is 0px, not normal', (await one('#flex', ['row-gap', 'column-gap']))['row-gap'] === '0px' && (await one('#row', ['column-gap']))['column-gap'] === '12px');
  ok('a block, a flex column and a grid all stack their children down the page; a flex row runs across',
    (await one('#box', ['-stacking']))['-stacking'] === 'column' && (await one('#flex', ['-stacking']))['-stacking'] === 'column'
    && (await one('#grid', ['-stacking']))['-stacking'] === 'column' && (await one('#row', ['-stacking']))['-stacking'] === 'row');
  ok('a checkbox draws no glyphs to cut, and a box clipped across only cuts nothing vertically',
    (await one('#tick', ['-clipped']))['-clipped'] === 'no' && (await one('#acut', ['-clipped']))['-clipped'] === 'no');
  ok('a box shorter than the glyphs it clips says by how much', /^vertically by \d/.test((await one('#cut', ['-clipped']))['-clipped']) && (await one('#box', ['-clipped']))['-clipped'] === 'no');
  // The first probe read a grid's direction from its auto-flow, so a job post's
  // three-column grid ran "column", and alignment from the computed property,
  // so a container centred by auto margins read `normal`.
  const tracks = await one('#tracks', ['-stacking', '-place-h']), centred = await one('#centred', ['-stacking', '-place-h', '-place-v']);
  ok('which way children run, and where they sit, are read off their boxes',
    tracks['-stacking'] === 'row' && tracks['-place-h'].run === 'space-between' && centred['-stacking'] === 'column'
    && centred['-place-h'].items === 'center' && centred['-place-h'].run === 'center' && centred['-place-v'].items === null);
  // a wrapped row places each child within its line, which the box cannot
  // say; the run, all of them together, it can
  // Review 2026-10-02 round 3, S7: a fixed-height text centred by its
  // line-height read as `normal` (no child boxes) and was red against CENTER.
  const vfill = await one('#vfill', ['-place-v']), vtop = await one('#vtop', ['-place-v']), vmid = await one('#vmid', ['-place-v']);
  ok('a text leaf is placed by its own lines: filling its box, at the top, centred',
    vfill['-place-v'].items === 'filled' && vtop['-place-v'].items === 'flex-start' && vmid['-place-v'].items === 'center');
  const wrapped = await one('#wrapped', ['-place-h', '-place-v']);
  ok('children wrapped onto several lines are not each placed against the box; their run is', wrapped['-place-v'].items === null && wrapped['-place-h'].run === 'flex-start');
  // The first engine took any box for a drawing: an avatar's empty picture
  // slot read as an Image layer "drawn anyway" on the variants that have none.
  ok('a box that paints nothing is not rendered; a control with no value draws no words',
    (await one('#slot > span', ['-rendered']))['-rendered'] === 'no' && (await one('#ta', ['-rendered']))['-rendered'] === 'no'
    && (await one('#edge', ['-rendered']))['-rendered'] === 'yes' && (await one('#clamp', ['-rendered']))['-rendered'] === 'yes');
  // A focused field carries its stroke inside and its focus ring outside at
  // once, so the inner ring is read apart from the ring.
  const inring = await one('#inring', ['-inner-ring-width', '-inner-ring-color', '-stroke']), inset = await one('#inset', ['-inner-ring-width']);
  const both = await one('#focused', ['-inner-ring-width', '-inner-ring-color', '-ring-width', '-ring-offset']);
  ok('an outline drawn inward or an inset spread is an inner ring, apart from a focus ring outside',
    inring['-inner-ring-width'] === '1px' && inring['-inner-ring-color'] === 'rgb(0, 0, 0)' && inring['-stroke'] === 'an outline' && inset['-inner-ring-width'] === '0px'
    && both['-inner-ring-width'] === '1px' && both['-inner-ring-color'] === 'rgb(0, 0, 255)' && both['-ring-width'] === '2px' && both['-ring-offset'] === '2px');
  // An outline's corners are the box's radius grown by offset and width (Chromium, 2026-10-25).
  ok('a ring\'s outer radius is the box\'s grown by how far the ring reaches; a pill is capped; a square box draws square',
    (await one('#rround', ['-ring-radius']))['-ring-radius'] === '16px' && (await one('#rpill', ['-ring-radius']))['-ring-radius'] === '24px'
    && (await one('#rsquare', ['-ring-radius']))['-ring-radius'] === '0px');
  // round 4 (F6): how each ring is drawn, so the comparator snaps an outline's width and not a shadow's
  const drawn = await one('#focused', ['-ring-drawn', '-inner-ring-drawn']), shadowRing = await one('#shadow', ['-ring-drawn']), plain = await one('#plain', ['-ring-drawn', '-inner-ring-drawn']);
  ok('a ring says how it is drawn: an outline, a shadow, or none', drawn['-ring-drawn'] === 'an outline' && drawn['-inner-ring-drawn'] === 'a shadow'
    && shadowRing['-ring-drawn'] === 'a shadow' && plain['-ring-drawn'] === 'none' && plain['-inner-ring-drawn'] === 'none');
  const ring = await one('#ring', ['-ring-width', '-ring-offset', '-ring-color']);
  ok('an outline is the ring: its width, offset and colour', ring['-ring-width'] === '2px' && ring['-ring-offset'] === '3px' && ring['-ring-color'] === 'rgb(255, 0, 0)');
  const shadow = await one('#shadow', ['-ring-width', '-ring-offset', '-ring-color']);
  ok('so is a spread-only shadow layer, whichever layer it is', shadow['-ring-width'] === '3px' && shadow['-ring-offset'] === '0px' && shadow['-ring-color'] === 'rgb(0, 0, 255)');
  ok('the outlines a box and what it holds draw are read by colour, a styleless or clear one not', (await one('#rings', ['-rings']))['-rings'].join() === 'rgb(255, 0, 0),rgb(0, 0, 255)' && (await one('#plain', ['-rings']))['-rings'].length === 0);
  ok('an outline with no style is no ring, whatever width it computes', (await one('#plain', ['-ring-width', '-ring-color']))['-ring-width'] === '0px');
  ok('a pseudo-element is read on its element', (await one('#pseudo::before', ['width']))['width'] === '33px');
  ok('a selector that matches nothing is null, never an empty record', (await read({ L: { selector: '#nothing' }, M: { selector: null } })).k.L === null);
  ok('a scope keeps one section\'s selector out of another\'s', (await read({ L: { selector: '#box', props: ['width'] } }, {}, '#two')).k.L.width === '34px');
  const core = await one('#box', [], { core: true });
  ok('the core record\'s positions are the document\'s, the scroll added', core.top === 900 && core.left === 0);
  ok('the core record reads both gaps, the box and the ring', ['rowGap', 'columnGap', 'w', 'h', 'outline', 'outlineOffset', 'outlineColor', 'shadow'].every((f) => f in core) && core.w === 124);
  const card = await one('x-card', [], { core: true, instance: 'x-{slug}' });
  ok('a held instance is named by the project\'s custom element', card.children.length === 1 && card.children[0].tag === 'label' && card.children[0].text === 'Go');
  ok('the theme stamp comes back with every reading', (await read({})).__theme === 'dark');

  // every state on a page in one call: fetching the document again resets the
  // node ids a state is held against
  await forceState(tab, [{ selector: '.title', pseudo: 'hover', within: '.slot' }, { selector: '#in', pseudo: 'focus-visible' }]);
  const titles = await tab.evaluate(`[...document.querySelectorAll('.title')].map((t) => getComputedStyle(t).color).join(' ')`);
  ok('hover is held on the element and its ancestors, so a rule keyed on an ancestor fires', titles.startsWith('rgb(0, 0, 255)'));
  ok('and only inside `within`: the next card is not hovered, nor `within` itself', !titles.endsWith('rgb(0, 0, 255)')
    && await tab.evaluate(`getComputedStyle(document.querySelector('.slot')).backgroundColor`) !== 'rgb(255, 0, 0)');
  ok('focus is :focus-visible on the element, which a :has() on an ancestor sees',
    await tab.evaluate(`getComputedStyle(document.querySelector('.field')).outlineStyle`) === 'solid');
  ok('and :focus-within on its ancestors', await tab.evaluate(`getComputedStyle(document.querySelector('.group')).backgroundColor`) === 'rgb(255, 255, 0)');
  ok('a state selector that matches nothing is refused', await forceState(tab, [{ selector: '#none', pseudo: 'hover' }]).then(() => false, (e) => /matched no element/.test(e.message)));

  const still = await measure(tab, { k: { scope: '#one', layers: { L: { selector: '#box', props: ['width'] } } } });
  ok('two readings of a still page agree', still.moved.length === 0 && still.read.k.L.width === '124px');
  const moving = await measure(tab, { k: { scope: null, layers: { W: { selector: '#wobble', props: ['width'] } } } });
  const spinning = await measure(tab, { k: { scope: null, layers: { S: { selector: '#spin', props: ['width'] } } } }, { core: true });
  ok('an animation that never ends is held at its start, so its box reads the same twice', spinning.moved.length === 0 && spinning.read.k.S.w === 16);
  ok('a value that moves between the readings is named with both values', moving.moved.length === 1 && /^k › W › width: "\d+px" vs "\d+px"$/.test(moving.moved[0]));
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${n} passed`);
