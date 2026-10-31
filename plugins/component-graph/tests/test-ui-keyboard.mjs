#!/usr/bin/env node
// ui.html from the keyboard, in Chrome: the sidebar's group heads and rows are
// buttons (a head says whether it is open), arrow keys move focus down the
// rows, an unpublished component is said in words, and every graph node and
// ⓘ is a named tab stop that Enter presses, none nested in another.
// Run: node plugins/component-graph/tests/test-ui-keyboard.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChrome, launch, newPage, attach, navigate } from '../../../tools/shared/cdp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const key = (sel, k) => `${sel}.dispatchEvent(new KeyboardEvent('keydown', { key: '${k}', bubbles: true }))`;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync(findChrome())) ok('Chrome is here to run the window in (none found: install Chrome, the toolkit\'s one browser)', false);
const browser = await launch({});
try {
  const tab = await attach(await newPage(browser.endpoint));
  await navigate(tab, 'file://' + path.join(HERE, '..', 'ui.html'));
  // what the main thread would send, and a record of what the window sends back (outside Figma, parent is the window itself)
  const post = async (m) => { await tab.evaluate(`window.onmessage(new MessageEvent('message', { data: { pluginMessage: ${JSON.stringify(m)} } }))`); await pause(50); };
  await tab.evaluate(`window.sent = []; parent.postMessage = (m) => window.sent.push(m.pluginMessage)`);
  await post({ type: 'index', quality: 'final', components: [
    { id: '1:1', name: 'Button', type: 'COMPONENT_SET', page: 'Components', publishStatus: 'CURRENT', usage: 3 },
    { id: '1:2', name: 'Helper', type: 'COMPONENT', page: 'Components', publishStatus: 'UNPUBLISHED', usage: 0 },
  ] });
  await tab.evaluate(`document.getElementById('pub-switch').click()`);
  await pause(50);
  const list = await tab.evaluate(`({ heads: [...document.querySelectorAll('.group-head')].map((h) => h.tagName + ':' + h.getAttribute('aria-expanded')), rows: [...document.querySelectorAll('.comp-item')].map((r) => r.tagName + ':' + r.textContent) })`);
  ok('a group head is a button saying it is open, each row a button', list.heads.join() === 'BUTTON:true' && list.rows.length === 2 && list.rows.every((r) => r.startsWith('BUTTON:')), JSON.stringify(list));
  ok('an unpublished component is said in words, not by colour alone', list.rows.some((r) => /Helper.*unpublished/.test(r)) && !list.rows.some((r) => /Button.*unpublished/.test(r)), JSON.stringify(list.rows));

  await tab.evaluate(`document.querySelector('.comp-item').focus(); ${key('document.activeElement', 'ArrowDown')}`);
  ok('ArrowDown on a focused row moves focus to the next', await tab.evaluate(`document.activeElement.classList.contains('comp-item') && document.activeElement.textContent.includes('Helper')`));
  await tab.evaluate(`document.querySelector('.group-head').click()`);
  ok('pressing a head collapses its group and says so', await tab.evaluate(`document.querySelector('.group-head').getAttribute('aria-expanded') === 'false' && !document.querySelector('.comp-item')`));
  await tab.evaluate(`document.querySelector('.group-head').focus(); document.querySelector('.group-head').click()`);
  ok('the redraw keeps focus on the head that was pressed', await tab.evaluate(`document.activeElement.classList.contains('group-head') && document.activeElement.getAttribute('aria-expanded') === 'true'`));

  await post({ type: 'graph', selected: { id: '1:1', name: 'Button', count: 1 }, upstream: [{ id: '2:1', name: 'Card', count: 2 }], downstream: [{ id: '3:1', name: 'Icon', count: 1 }], canGoBack: false, canGoForward: false });
  const nodes = await tab.evaluate(`[...document.querySelectorAll('#svg [role=button]')].map((e) => [e.getAttribute('tabindex'), e.getAttribute('aria-label')])`);
  ok('every graph node and ⓘ is a tab stop with a name', nodes.length >= 4 && nodes.every(([t, l]) => t === '0' && l), JSON.stringify(nodes));
  ok('no button sits inside another', !(await tab.evaluate(`!!document.querySelector('#svg [role=button] [role=button]')`)));
  await tab.evaluate(`window.sent = []; ${key(`document.querySelector('#svg .node-group[role=button]')`, 'Enter')}`);
  ok('Enter on a node opens that component', await tab.evaluate(`window.sent.some((m) => m && m.type === 'open-component')`), await tab.evaluate(`JSON.stringify(window.sent)`));
} finally { await browser.close(); }
console.log(`${n}/${n} passed`);
