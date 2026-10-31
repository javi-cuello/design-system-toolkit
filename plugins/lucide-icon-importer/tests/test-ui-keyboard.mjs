#!/usr/bin/env node
// ui.html from the keyboard, in Chrome: the tabs follow the APG pattern, the icon
// cards and the variable picker are named buttons that say their state, Escape
// closes the picker and gives focus back, and every control has a name.
// Run: node plugins/lucide-icon-importer/tests/test-ui-keyboard.mjs
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
  const $ = (id) => `document.getElementById('${id}')`;
  ok('the script ran to its end', await tab.evaluate(`typeof selectTab === 'function' && typeof renderGrid === 'function'`));

  await tab.evaluate(`${$('tab-icons')}.focus(); ${key($('tab-icons'), 'ArrowRight')}`);
  const t = await tab.evaluate(`({ sel: ${$('tab-settings')}.getAttribute('aria-selected'), focus: document.activeElement.id, shown: ${$('panel-settings')}.classList.contains('active'), stop: ${$('tab-icons')}.tabIndex })`);
  ok('ArrowRight selects and focuses Settings, and Icons leaves the tab order', t.sel === 'true' && t.focus === 'tab-settings' && t.shown && t.stop === -1, JSON.stringify(t));
  await tab.evaluate(key($('tab-settings'), 'ArrowRight'));
  ok('ArrowRight on the last tab wraps to the first', await tab.evaluate(`document.activeElement.id === 'tab-icons'`));

  await tab.evaluate(`existingNames = { circle: true }; renderGrid([{ name: 'arrow-up', tags: [] }, { name: 'circle', tags: [] }])`);
  const cards = await tab.evaluate(`[...document.querySelectorAll('.icon-card')].map((e) => [e.tagName, e.getAttribute('aria-label'), e.getAttribute('aria-pressed'), e.disabled])`);
  ok('a card is a button named by its icon: pressable, or disabled and saying it is already in the file',
    JSON.stringify(cards) === JSON.stringify([['BUTTON', 'arrow-up', 'false', false], ['BUTTON', 'circle, already in this file', null, true]]), JSON.stringify(cards));
  await tab.evaluate(`document.querySelector('.icon-card').click()`);
  ok('picking a card says it is picked', await tab.evaluate(`document.querySelector('.icon-card').getAttribute('aria-pressed') === 'true'`));

  await tab.evaluate(`selectTab(${$('tab-settings')}); colorVariables = [{ id: 'v1', name: 'Fg', collection: 'Colour', color: { r: 0, g: 0, b: 0 } }]; renderVariableList(); ${$('variableSection')}.style.display = 'block'; ${$('variablePickerToggle')}.click()`);
  await pause(50);
  const open = await tab.evaluate(`({ expanded: ${$('variablePickerToggle')}.getAttribute('aria-expanded'), focus: document.activeElement.id, option: document.querySelector('.variable-option').tagName })`);
  ok('the variable picker opens, says so, puts focus in its search, and its options are buttons', open.expanded === 'true' && open.focus === 'variableSearchInput' && open.option === 'BUTTON', JSON.stringify(open));
  await tab.evaluate(key($('variableSearchInput'), 'Escape'));
  const shut = await tab.evaluate(`({ expanded: ${$('variablePickerToggle')}.getAttribute('aria-expanded'), focus: document.activeElement.id })`);
  ok('Escape closes it and gives focus back to its button', shut.expanded === 'false' && shut.focus === 'variablePickerToggle', JSON.stringify(shut));

  const unnamed = await tab.evaluate(`[...document.querySelectorAll('input, textarea, button')].filter((e) => e.type !== 'radio' && !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.textContent.trim()).map((e) => e.id || e.className)`);
  ok('every field and button has a name', unnamed.length === 0, JSON.stringify(unnamed));
} finally { await browser.close(); }
console.log(`${n}/${n} passed`);
