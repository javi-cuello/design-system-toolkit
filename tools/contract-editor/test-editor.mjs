// node tools/contract-editor/test-editor.mjs — the editor driven in headless Chrome, as a person would:
// a block clicked or dropped opens its dialog, the dialog checks before it adds, rows move by drag, keys
// and menu, the library narrows, the parts are drawn and chosen on a stage, a variant takes its own edits,
// and the JSON follows. Skips, saying so, without Chrome.
// SHOTS=<dir> also saves a screenshot per step. --project <label> adds what only a library gives, on any
// library; --fixtures also checks components by name (Button, Badge, Nav panel, Search input, Avatar, Contact card,
// Option row): alone, on the toolkit's sample library (sample/, made up and written by hand), served as a
// project of a root of the run's own; with --project, on that library, which fails, loudly, without them.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync, rmSync, readdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChrome, launch, newPage, attach, navigate, viewport, screenshot, waitFor } from '../shared/cdp.mjs';
import { suggest, fromContract } from './props.mjs';
import { partName, fromAnatomy } from './anatomy.mjs';

if (!existsSync(findChrome())) { console.log('SKIPPED: no Chrome — set CHROME to run tools/contract-editor/test-editor.mjs'); process.exit(0); }

// --fixtures with no --project: the toolkit's own sample library (sample/, written by hand), served as a project of a
// root of the run's own, so no one's library is needed and none is touched
const ARGV = [...process.argv];
// the snapshots the router keeps for files no project claims: a folder of the run's own, never this machine's
const unclaimedDir = mkdtempSync(join(tmpdir(), 'contract-editor-unclaimed-'));
process.on('exit', () => rmSync(unclaimedDir, { recursive: true, force: true }));
let sampleRoot = null;
if (ARGV.includes('--fixtures') && !ARGV.includes('--project')) {
  sampleRoot = mkdtempSync(join(tmpdir(), 'contract-editor-sample-'));
  process.on('exit', () => rmSync(sampleRoot, { recursive: true, force: true }));
  const home = join(sampleRoot, 'sample', 'figma-design-system');
  cpSync(fileURLToPath(new URL('./sample', import.meta.url)), join(home, 'snapshot'), { recursive: true });
  const block = (tag, v) => '```json ' + tag + '\n' + JSON.stringify(v, null, 2) + '\n```\n';
  writeFileSync(join(home, 'design-system-context.md'), '# Sample\n\n' + block('snapshot-routing', { files: { library: { key: 'SAMPLEKEY000000', id: 'fsample', roles: ['components', 'tokens'] } } }) + '\n' + block('audit-settings', { libraries: { SAMPLEKEY000000: {} } }));
  ARGV.push('--project', 'sample');
}
const server = spawn(process.execPath, [fileURLToPath(new URL('./serve.mjs', import.meta.url)), '--port', '0', '--no-router', ...ARGV.slice(2).filter((a) => a !== '--fixtures')], { stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, TOOLKIT_UNCLAIMED: unclaimedDir, ...(sampleRoot ? { TOOLKIT_PROJECTS_ROOT: sampleRoot } : {}) } });
// however this process ends, the server ends with it: one left running holds the caller's output open, and bin/check waits on it for ever
process.on('exit', () => server.kill());
const url = await new Promise((res, rej) => {
  server.stdout.on('data', (b) => { const m = String(b).match(/http:\/\/localhost:\d+\//); if (m) res(m[0]); });
  server.once('exit', (c) => rej(new Error(`serve.mjs exited ${c}`)));
});
const browser = await launch({});
const tab = await attach(await newPage(browser.endpoint));
// what the page downloads (proposals, briefs) lands in a folder of the run's own, removed at the end, never the person's Downloads
const downloads = mkdtempSync(join(tmpdir(), 'contract-editor-downloads-'));
await tab.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, eventsEnabled: false });
process.on('exit', () => rmSync(downloads, { recursive: true, force: true }));
const theirs = join(process.env.HOME || tmpdir(), 'Downloads');
const theirsBefore = existsSync(theirs) ? readdirSync(theirs).length : 0;
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
const shot = async (name) => { if (process.env.SHOTS) writeFileSync(join(process.env.SHOTS, name + '.png'), Buffer.from(await screenshot(tab), 'base64')); };
const js = (expr) => tab.evaluate(expr);
// the tree opens one level deep; a check that reaches a deeper part opens it all first
const expandAll = () => js(`(() => { const b = document.querySelector('[data-fold-all]'); if (b && !b.parentElement.hidden && b.textContent === 'Expand all') b.click(); })()`);
// a part taken out through its row's menu in Anatomy, and back to Props
const dropPart = async (name) => {
  await js(`document.querySelector('[data-view="anatomy"]').click()`);
  const there = await js(`(() => { const r = [...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name')?.textContent === ${JSON.stringify(name)}); if (r) r.querySelector('[data-more]').click(); return !!r; })()`);
  if (there) await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find(b => /^Delete/.test(b.textContent)).click()`);
  await js(`document.querySelector('[data-view="props"]').click()`);
  return there;
};
const json = async () => JSON.parse(await js(`document.querySelector('[data-json]').value`));
// Ctrl+Z, or with Shift Ctrl+Z, pressed where the focus is, or on the page where that is a text field (it keeps its own undo)
const ctrlZ = (shift) => js(`(document.activeElement.matches('input:not([type=radio], [type=checkbox]), textarea') ? document.body : document.activeElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: ${shift}, bubbles: true }))`);
const keys = async () => Object.keys((await json()).props);
const box = (sel) => js(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, top: r.top, bottom: r.bottom }; })()`);
const mouse = (type, x, y) => tab.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
const CODES = { Backspace: 8, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Escape: 27, Enter: 13 };
const key = async (k, modifiers = 0) => {
  await tab.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: CODES[k], modifiers, ...(k === 'Enter' ? { text: '\r' } : {}) });
  await tab.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, modifiers });
};
const type = (text) => tab.send('Input.insertText', { text });
const dialogOpen = () => js(`document.querySelector('[data-dialog]').open`);
const inDialog = (sel) => `document.querySelector('[data-dialog] ${sel}')`;
// typed, then set exactly: a name the library completes is the completion's own case
const setName = async (name) => { await js(`${inDialog('[data-name]')}.focus(); ${inDialog('[data-name]')}.value = ''`); await type(name); await js(`${inDialog('[data-name]')}.value = ${JSON.stringify(name)}; ${inDialog('[data-name]')}.dispatchEvent(new Event('input'))`); };
const save = () => js(`${inDialog('[data-dialog-save]')}.click()`);
// an enum's options in the dialog: each removed by its button, then typed with Enter
const setOptions = async (values) => {
  await js(`(() => { for (let k = 0; k < 50; k++) { const b = ${inDialog('.ce-chip__remove')}; if (!b) return; b.click(); } })()`);
  for (const v of values) { await js(`${inDialog('[data-chip-input]')}.focus()`); await type(v); await key('Enter'); }
};
// the part chosen's rows, beside the stage
const insp = (sel) => `document.querySelector('[data-inspector] ${sel}')`;
const selectPart = (name) => js(`[...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name')?.textContent === ${JSON.stringify(name)}).querySelector('[data-edit]').click()`);
// closed by its Close (Add part, for a part just added), then the close event a task later, which draws the tree again
// and puts the focus back on it
// the Variants grid's last cell drawn: each prop at its last value (an on/off on, an option its last), so layers of most props are drawn
const lastAll = () => js(`[...document.querySelectorAll('[data-variants] button[data-combo]')].pop().click()`);
// the cell chosen in the Variants grid is every prop at its default, as the JSON says them
const atDefaults = () => js(`(() => { const c = JSON.parse(document.querySelector('[data-json]').value); const b = document.querySelector('[data-variants] [data-combo][aria-pressed=true]');
  return !!b && Object.entries(JSON.parse(b.dataset.combo)).every(([k, v]) => { const p = c.props[k]; return v === (p.default ?? (p.type === 'boolean' ? false : p.values[0])); }); })()`);
const closePart = async () => {
  if (!(await js(`(() => { const d = document.querySelector('[data-part-dialog]'); if (d.open) d.querySelector('[data-part-done]').click(); return true; })()`))) return;
  await waitFor(tab, `!!document.activeElement.closest('[data-parts]')`, { timeout: 3000 }).catch(() => {});
};
const setPartName = async (name) => { await js(`${insp('[data-name]')}.focus(); ${insp('[data-name]')}.select()`); await type(name); };
// a picker among the part's rows, worked as a person would: its button, then the option by its words, or the token it sets
// (a token's words under its group's heading are its last segment)
const pickIn = async (label, text) => {
  await js(`${insp(`[data-picker="${label}"]`)}.click()`);
  const is = `(o) => o.dataset.value === ${JSON.stringify(text)} || o.querySelector('.ce-picker__name').textContent === ${JSON.stringify(text)}`;
  if (!(await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].some(${is})`))) throw new Error(`pick ${label}: no "${text}"`);
  if (!(await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option][data-value]:not([data-value=""])')].every((o) => o.title && o.textContent.includes(o.title.split('/').pop()))`))) throw new Error(`pick ${label}: an option with no title saying its whole name`);
  await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].find(${is}).click()`);
};
const add = async (block, name, more) => { await js(`document.querySelector('[data-block="${block}"]').click()`); await setName(name); if (more) await more(); await save(); };
const row = (name) => `[...document.querySelectorAll('[data-list] > li')].find(l => l.querySelector('.ce-row__name').textContent === ${JSON.stringify(name)})`;

try {
  await viewport(tab, 1440, 1000);
  await navigate(tab, url);
  await js(`localStorage.clear()`);
  await navigate(tab, url);
  await waitFor(tab, `document.querySelectorAll('[data-block]').length > 0`);
  {
    const start = ARGV.includes('--project') ? ARGV[ARGV.indexOf('--project') + 1] : '';
    ok('the page offers no other library: this server serves one, as a project\'s docs site does', JSON.stringify((await (await fetch(url + 'projects.json')).json()).projects.map((p) => p.label)) === JSON.stringify(start ? [start] : []));
  }
  await waitFor(tab, `document.querySelectorAll('[data-block]').length > 0`);
  ok('the page loads with no errors, an empty contract, and the empty list saying how to start', tab.trouble.length === 0 && (await keys()).length === 0
    && await js(`getComputedStyle(document.querySelector('[data-empty]')).display !== 'none' && !document.querySelector('[data-component]').hasAttribute('aria-invalid')`));
  // with no variant property, Variants says it has one look, in place of the grid and the changes, and the way to add one
  await js(`document.querySelector('[data-view="variants"]').click()`);
  ok('a draft with no variant property: one empty state filling the tab, centred, with one action back to Props', await js(`(() => { const v = document.querySelector('[data-variants]'); const e = v.querySelector(':scope > .ce-empty'); const w = document.querySelector('.ce-props').getBoundingClientRect(), b = e?.getBoundingClientRect();
    return v.children.length === 1 && /One look/.test(e.querySelector('h3').textContent) && e.querySelectorAll('button').length === 1 && w.bottom - b.bottom < 24 && Math.abs((b.left - w.left) - (w.bottom - b.bottom)) < 1; })()`));
  await js(`document.querySelector('[data-variants] .ce-empty button').click()`);
  ok('its action opens Props, focus on the tab', await js(`!document.querySelector('[data-panel="props"]').hidden && document.activeElement.matches('[data-view="props"]')`));
  ok('the centre column\'s content is centred between the panes', await js(`(() => { const p = document.querySelector('.ce-props').getBoundingClientRect(); const t = document.querySelector('[data-panel="props"]').getBoundingClientRect(); return Math.abs((t.left - p.left) - (p.right - t.right)) <= 1; })()`));
  ok('the component\'s name and tabs sit in a bar over the palette and the work, and the preview docked beside the work', await js(`(() => { const h = document.querySelector('.ce-head').getBoundingClientRect(), pal = document.querySelector('.ce-palette').getBoundingClientRect();
    return h.left === pal.left && h.bottom <= pal.top && !!document.querySelector('.ce-head [data-component]') && !!document.querySelector('.ce-head [data-view]') && !document.querySelector('#json-pane').hidden && document.querySelector('#json-pane').getBoundingClientRect().left >= document.querySelector('.ce-props').getBoundingClientRect().right; })()`));
  await shot('1-empty');

  // a block dropped anywhere in the centre of an empty list opens its dialog; Cancel adds nothing
  {
    const b = await box('[data-block="enum"]');
    const zone = await box('.ce-props');
    await mouse('mousePressed', b.x, b.y);
    await mouse('mouseMoved', b.x + 20, b.y);
    ok('a new block still over the palette is carried under the pointer', await js(`(() => { const g = document.querySelector('.ce-lift'); return !!g && Math.abs(g.getBoundingClientRect().left - (${b.x} + 20 - 24)) < 1; })()`));
    await mouse('mouseMoved', zone.x, 600);
    ok('its slot is an empty space the row\'s size, the copy the only row shown', await js(`(() => { const s = document.querySelector('[data-list] [data-slot]'); return !!s && [...s.children].every((c) => getComputedStyle(c).visibility === 'hidden'); })()`));
    ok('a block carried from the palette is the row it will make, as a new part in the tree is, and shows dashed where it lands', await js(`(() => { const g = document.querySelector('.ce-lift'), s = document.querySelector('[data-list] [data-slot]');
      return !!g && g.matches('.ce-row') && /Options/.test(g.querySelector('.ce-row__name').textContent) && !!s && s.matches('.ce-row--slot') && Math.abs(g.offsetWidth - document.querySelector('[data-list]').offsetWidth) < 1; })()`));
    // carried up and down its list only, on the list's edge, wherever the pointer is across
    await mouse('mouseMoved', zone.x + 90, 610);
    ok('the carried row stays on the list\'s left edge, whatever the pointer does sideways', await js(`Math.abs(document.querySelector('.ce-lift').getBoundingClientRect().left - document.querySelector('[data-list]').getBoundingClientRect().left) < 1`));
    await mouse('mouseReleased', zone.x, 600);
    ok('a block dropped into the empty list opens its dialog, its name field focused', await dialogOpen() && await js(`document.activeElement.matches('[data-dialog] [data-name]')`));
    await js(`${inDialog('[data-dialog-cancel]')}.click()`);
    ok('Cancel closes it and adds nothing', !(await dialogOpen()) && (await keys()).length === 0);
  }

  if (ARGV.includes('--project')) {
    await js(`document.querySelector('#tab-library').click()`);
    await waitFor(tab, `document.querySelectorAll('[data-library-tiles] [data-block]').length > 0`);
    ok('the Library tab holds the served library\'s shared props', true);
    ok('another project is not answered by this server', (await fetch(url + 'project.json?label=no-such-or-other')).status === 404);
    await js(`document.querySelector('#tab-kinds').click()`);
  } else {
    await js(`document.querySelector('#tab-library').click()`);
    await waitFor(tab, `!!document.querySelector('[data-library-tiles]')`);
    ok('with no project, the Library tab says how to start the editor on one', /--project/.test(await js(`document.querySelector('[data-library-tiles]').textContent`)));
    await js(`document.querySelector('#tab-kinds').click()`);
  }

  // the name field suggests the library's own names for the kind, where there is a library
  const connected = ARGV.includes('--project');
  // the sample library's components, checked by name: only with --fixtures, so any other library runs the rest
  const fixtures = connected && ARGV.includes('--fixtures');
  // the library's contracts as the server gives them: the checks below find their subjects in it
  const lib = connected ? (await (await fetch(url + 'project.json?label=' + ARGV[ARGV.indexOf('--project') + 1])).json()).contracts : [];
  if (connected) {
    await js(`document.querySelector('[data-block="boolean"]').click()`);
    ok('a new on/off prop\'s name offers the library\'s on/off names as chips', await js(`document.querySelectorAll('[data-dialog] [data-name-suggestion]').length > 0`));
    const offered = await js(`document.querySelector('[data-dialog] [data-name-suggestion]').dataset.nameSuggestion`);
    await js(`document.querySelector('[data-dialog] [data-name-suggestion]').click()`);
    await js(`${inDialog('[data-name]')}.value = ''`);
    await type(offered.slice(0, 2));
    ok('typing the start of a library name completes it in the field, the rest selected', await js(`(() => { const i = ${inDialog('[data-name]')}; return i.value.toLowerCase().startsWith(${JSON.stringify(offered.slice(0, 2).toLowerCase())}) && i.value.length > 2 && i.selectionStart === 2 && i.selectionEnd === i.value.length && !document.querySelector('[data-dialog] [data-name-suggestion]'); })()`));
    await js(`${inDialog('[data-name]')}.value = ${JSON.stringify(offered)}`);
    ok('a chip fills the name and leaves the list', await js(`document.querySelector('[data-dialog] [data-name]').value`) === offered && !(await js(`!!document.querySelector('[data-dialog] [data-name-suggestion="${offered}"]')`)));
    await js(`${inDialog('[data-dialog-cancel]')}.click()`);
    await js(`document.querySelector('[data-block="enum"]').click()`);
    await setName('Size');
    ok('an options prop offers the options the library gives props of its name', await js(`document.querySelectorAll('[data-dialog] [data-option-suggestion]').length > 0`));
    const opt = await js(`document.querySelector('[data-dialog] [data-option-suggestion]').dataset.optionSuggestion`);
    await js(`document.querySelector('[data-dialog] [data-option-suggestion]').click()`);
    ok('one click adds it as an option', await js(`[...document.querySelectorAll('[data-dialog] .ce-chip__value')].some(c => c.textContent === ${JSON.stringify(opt)})`));
    await js(`${inDialog('[data-dialog-cancel]')}.click()`);
  }

  // the dialog checks before it adds: no name, then a name
  await js(`document.querySelector('[data-block="enum"]').click()`);
  await save();
  ok('Add with no name keeps the dialog open, says why, and focuses the name', await dialogOpen()
    && await js(`document.activeElement.matches('[data-dialog] [data-name]') && document.activeElement.hasAttribute('aria-invalid') && /needs a name/.test(${inDialog('[data-field-error]')}.textContent)`));
  await setName('Size');
  const emptyHint = await js(`${inDialog('[data-chip-input]')}?.placeholder`);
  await setOptions(['lg', 'md', 'sm', 'md']);
  ok('options are typed in one at a time with Enter, and a duplicate is refused; the field says so while empty, then that more can be added', /press Enter/.test(emptyHint) && await js(`${inDialog('[data-chip-input]')}.placeholder === 'Add another'`) && await js(`[...document.querySelectorAll('[data-dialog] [data-chip]')].map(c => c.textContent).join()`) === 'lg,md,sm'
    && await js(`${inDialog('[data-chip-input]')}.hasAttribute('aria-invalid')`));
  await js(`${inDialog('[data-chip-input]')}.value = ''; ${inDialog('[data-choice="default-md"]')}.click()`);
  ok('the default is its own choice, from the options, apart from them', await js(`!!${inDialog('[data-choice="default-sm"]')} && !document.querySelector('[data-dialog] [data-chip][aria-pressed]')`));
  await js(`${inDialog('[data-chip="2"]')}.focus()`);
  await key('ArrowLeft', 8);
  ok('Shift and Left move the focused chip, focus going with it', await js(`[...document.querySelectorAll('[data-dialog] [data-chip]')].map(c => c.textContent).join()`) === 'lg,sm,md' && await js(`document.activeElement.textContent === 'sm'`));
  const chips = () => js(`[...document.querySelectorAll('[data-dialog] [data-chip]')].map(c => c.textContent).join()`);
  const renameChip = async (k, to, end = 'Enter') => {
    await js(`${inDialog(`[data-chip="${k}"]`)}.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))`);
    await js(`(() => { const i = ${inDialog('[data-chip-edit]')}; i.value = ${JSON.stringify(to)}; i.dispatchEvent(new Event('input')); })()`);
    await key(end);
  };
  await renameChip(2, 'mid');
  ok('a chip double-clicked is renamed in place, Enter keeping the name, the default following it', await chips() === 'lg,sm,mid' && await js(`document.activeElement.textContent === 'mid'`) && await js(`${inDialog('[data-choice="default-mid"]')}?.matches('[aria-checked=true], [aria-pressed=true], :checked') ?? false`));
  await renameChip(2, 'other', 'Escape');
  ok('Escape keeps the old name, the dialog still open', await chips() === 'lg,sm,mid' && await dialogOpen());
  await renameChip(2, 'LG');
  ok('a name another option has is refused, said in the field', await js(`${inDialog('[data-chip-edit]')}?.getAttribute('aria-invalid') === 'true'`));
  await key('Escape');
  await renameChip(2, 'md');
  await shot('2-dialog');
  await save();
  let c = await json();
  ok('Add closes the dialog and writes the prop with its default, even right after another dialog was cancelled', !(await dialogOpen()) && c.props.size?.default === 'md' && JSON.stringify(c.props.size?.values) === '["lg","sm","md"]');
  ok('focus lands on the new row', await js(`document.activeElement.matches('[data-edit]') && document.activeElement.closest('li').querySelector('.ce-row__name').textContent === 'Size'`));

  await add('state', 'State');
  await js(`document.querySelector('[data-block="string"]').click()`);
  await setName('State');
  await save();
  ok('a name another prop has is said right under the name field, an icon and "Error:" before it', await dialogOpen() && await js(`(() => { const m = ${inDialog('[data-name]')}.nextElementSibling; return !!m && m.matches('.ce-error') && /^Error: .*one prop in code/.test(m.textContent) && !!m.querySelector('svg'); })()`));
  await js(`${inDialog('[data-dialog-cancel]')}.click()`);
  await add('boolean', 'Disabled', () => js(`${inDialog('[data-choice="axis-variant"]')}.click()`));
  if (connected) {
    // what this library's components have beside these, by props.mjs suggest(): a snapshot whose props seldom come together has none
    const onPage = JSON.parse(await js(`JSON.stringify([...document.querySelectorAll('[data-list] .ce-row__name')].map(n => n.textContent))`));
    const offered = JSON.parse(await js(`JSON.stringify([...document.querySelectorAll('[data-suggestion]')].map(b => b.dataset.suggestion))`));
    ok('the props the library\'s components often have beside these are offered, none already on the page', JSON.stringify(offered) === JSON.stringify(suggest(lib, onPage).map((x) => x.name)) && offered.every((x) => !onPage.includes(x)));
    await shot('2c-suggestions');
    // a library whose props seldom come together offers none: the clicks are for one that does
    if (await js(`!!document.querySelector('[data-suggestion]')`)) {
      const offer = await js(`document.querySelector('[data-suggestion]').dataset.suggestion`);
      await js(`document.querySelector('[data-suggestion]').click()`);
      ok('one click on a suggestion adds that prop and takes it off the offers', !!(await js(`${row(offer)}`)) && !(await js(`!!document.querySelector('[data-suggestion="${offer}"]')`)));
      // taken off again, so the steps after see the props they expect: the part it brought first, if it brought one
      await dropPart(offer);
      await js(`${row(offer)}.querySelector('[data-more]').click()`);
      await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find(b => b.textContent === 'Delete').click()`);
    }
  }
  else ok('with no library, nothing is suggested', await js(`document.querySelector('[data-suggest]').hidden`));
  await add('string', 'Label');
  ok('a new Text prop brings a text part in the outer box, its words from it, and says so', (await json()).anatomy.label?.kind === 'text' && (await json()).anatomy.label.content === '{label}' && /a text part for it in Anatomy/.test(await js(`new Promise(r => requestAnimationFrame(() => r(document.querySelector('[data-status]').textContent)))`)));
  // renamed, the prop takes the part still named for it along; renamed back for the steps after
  const rename = async (from, to) => { await js(`${row(from)}.querySelector('[data-edit]').click()`); await waitFor(tab, `!!${inDialog('[data-name]')}`); await js(`(() => { const i = ${inDialog('[data-name]')}; i.value = '${to}'; i.dispatchEvent(new Event('input')); })()`); await save(); };
  await rename('Label', 'Caption');
  const after = (await json()).anatomy;
  ok('a prop renamed renames the part named for it', after.caption?.content === '{caption}' && !after.label);
  await rename('Caption', 'Label');
  // taken out, so the steps after build the anatomy themselves
  await dropPart('Label');
  await js(`${row('Label')}.querySelector('[data-edit]').click()`);
  await waitFor(tab, `!!${inDialog('[data-name]')}`, { timeout: 2000 }).catch(() => {});
  ok('with no part taking its words, its dialog has no Shown only when: a choice that would change nothing', await js(`!/Shown only when/.test(document.querySelector('[data-dialog]').textContent)`));
  await js(`${inDialog('[data-dialog-cancel]')}.click()`);
  c = await json();
  ok(`a click on a block, a name and Add put each prop at the end, in order (${Object.keys(c.props)})`, JSON.stringify(Object.keys(c.props)) === '["size","state","disabled","label"]' && c.props.disabled.axis === true && c.props.state.role === 'interaction');
  ok('a contract with props and no component name marks the field', await js(`document.querySelector('[data-component]').hasAttribute('aria-invalid')`));
  await js(`document.querySelector('[data-component]').value = 'Button'; document.querySelector('[data-component]').dispatchEvent(new Event('input'))`);
  ok('the component name reaches the JSON', (await json()).component === 'Button');
  await shot('3-rows');

  // keyboard: the Label handle up to the top
  await js(`document.querySelectorAll('[data-handle]')[3].focus()`);
  for (let i = 0; i < 3; i++) await key('ArrowUp');
  ok('arrow keys on the handle move the row', (await keys())[0] === 'label');
  ok('focus stays on the moved row\'s handle, and the move is announced', await js(`document.activeElement.matches('[data-handle]') && document.activeElement.closest('li') === document.querySelector('[data-list]').firstElementChild`)
    && /Moved Label to position 1 of 4/.test(await js(`new Promise(r => requestAnimationFrame(() => r(document.querySelector('[data-status]').textContent)))`)));

  // the row's menu: the drag's single-pointer twin (WCAG 2.5.7)
  await js(`document.querySelector('[data-more]').click()`);
  ok('the menu opens on Edit, with the moves after it', await js(`document.activeElement.matches('.ce-menu button') && document.activeElement.textContent === 'Edit'`));
  await new Promise((r) => setTimeout(r, 50));
  await js(`document.dispatchEvent(new Event('scroll'))`);
  ok('a row menu closes when the page behind it scrolls', !(await js(`!!document.querySelector('.ce-menu:popover-open')`)));
  await js(`document.querySelector('[data-more]').click()`);
  await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find(b => b.textContent === 'Move down').click()`);
  ok('Move down in the menu moves it down one, focus back on its menu button', (await keys())[1] === 'label' && await js(`document.activeElement.matches('[data-more]') && document.activeElement.closest('li') === document.querySelectorAll('[data-list] > li')[1]`));

  // drag: the last row's handle to above the first row
  const from = await box('[data-list] > li:last-child [data-handle]');
  const to = await box('[data-list] > li:first-child');
  const tall = await js(`document.querySelector('[data-list] > li:last-child').offsetHeight`);
  await mouse('mousePressed', from.x, from.y);
  // lifted and nudged less than half a row, the slot holds its place: nothing closes up under it
  await mouse('mouseMoved', from.x, from.y - 10);
  await mouse('mouseMoved', from.x, from.y - 16);
  ok('a lifted row\'s slot holds its place until the pointer passes the next row\'s middle', await js(`(() => { const l = document.querySelector('[data-list]'); const s = l.querySelector('[data-slot]'); return !!s && s.nextElementSibling?.hidden === true && !s.nextElementSibling.nextElementSibling; })()`));
  for (let k = 1; k <= 8; k++) await mouse('mouseMoved', from.x, from.y + (to.top + 4 - from.y) * k / 8);
  await shot('4-dragging');
  ok('the carried row leaves the list, a copy of it under the pointer, and it shows dashed where it will land, its height, the rows easing aside', await js(`(() => { const s = document.querySelector('[data-list] [data-slot]'); if (!s || !s.classList.contains('ce-row--slot') || !document.querySelector('body > .ce-lift')) return false; return !!s && s === document.querySelector('[data-list]').firstElementChild && Math.abs(s.offsetHeight - ${tall}) <= 1 && !!document.querySelector('[data-list] > li[hidden]'); })()`));
  await mouse('mouseReleased', from.x, to.top + 4);
  ok('dragging a handle reorders', (await keys())[0] === 'disabled');
  {
    const h = await box('[data-list] > li:last-child [data-handle]');
    await js(`document.querySelector('[data-list] > li:last-child [data-handle]').focus()`);
    await mouse('mousePressed', h.x, h.y);
    for (let k = 1; k <= 4; k++) await mouse('mouseMoved', h.x, h.y - 10 * k);
    await key('Escape');
    await mouse('mouseReleased', h.x, h.y - 40);
    ok('a drag Escape cancels gives the focus back to its handle, never the page', await js(`document.activeElement.matches('[data-list] > li:last-child [data-handle]')`));
  }

  // a block dragged between two rows: Escape cancels, a drop opens its dialog for that place
  const block = await box('[data-block="boolean"]');
  const mid = await box('[data-list] > li:nth-child(2)');
  const drag = async (release) => { await mouse('mousePressed', block.x, block.y); for (let k = 1; k <= 8; k++) await mouse('mouseMoved', block.x + (mid.x - block.x) * k / 8, block.y + (mid.top + 4 - block.y) * k / 8); await release(); };
  await drag(async () => { await key('Escape'); await mouse('mouseReleased', mid.x, mid.top + 4); });
  ok('Escape cancels a drag from the palette', !(await dialogOpen()) && (await keys()).length === 4);
  await drag(() => mouse('mouseReleased', mid.x, mid.top + 4));
  ok('a block dropped between two rows opens its dialog', await dialogOpen());
  await setName('Loading');
  await js(`${inDialog('[data-choice="only-code"]')}.click()`);
  await save();
  c = await json();
  ok('it lands where it was dropped, code-only, with no Figma name', Object.keys(c.props)[1] === 'loading' && c.props.loading.only === 'code' && !c.props.loading.figma);

  // a row opens its own dialog; a saved rename reaches the row's buttons; Cancel keeps the old
  await js(`${row('Loading')}.querySelector('[data-edit]').click()`);
  await setName('Is loading');
  await js(`${inDialog('[data-dialog-cancel]')}.click()`);
  ok('Cancel on an edit keeps the prop as it was', !!(await js(`${row('Loading')}`)));
  await js(`${row('Loading')}.querySelector('[data-edit]').click()`);
  await setName('Is loading');
  await save();
  ok('Save renames it, and its row\'s menu says the new name', await js(`${row('Is loading')}.querySelector('[data-more]').getAttribute('aria-label') === 'Actions for Is loading'`));

  // the Kind menu in the dialog: State brings its form and keeps the name
  await js(`${row('Label')}.querySelector('[data-edit]').click()`);
  // what was measured is printed when it fails: it failed on Linux CI only, where the fonts differ
  const kinds = JSON.parse(await js(`(() => { const ts = [...document.querySelectorAll('[data-dialog] [data-tile]')].map((t) => t.closest('.ce-tile').getBoundingClientRect()); return JSON.stringify({ first: document.querySelector('[data-dialog] .ce-form').firstElementChild.matches('.ce-tiles'), sizes: ts.map((r) => [r.width, r.height]) }); })()`));
  const [w, h] = kinds.sizes[0] || [];
  if (!(kinds.first && kinds.sizes.length === 8 && kinds.sizes.every(([x, y]) => Math.abs(x - w) < 1 && Math.abs(y - h) < 1))) console.log(JSON.stringify(kinds));
  ok('the Kind comes first, every kind in sight, all one size', kinds.first && kinds.sizes.length === 8 && kinds.sizes.every(([x, y]) => Math.abs(x - w) < 1 && Math.abs(y - h) < 1));
  await js(`${inDialog('[data-tile="state"]')}.click()`);
  await save();
  c = await json();
  ok('Interaction states bring the states, the role and Figma only, and keep the name', c.props.label.role === 'interaction' && c.props.label.only === 'figma' && c.props.label.figma === 'Label');
  await js(`${row('Label')}.querySelector('[data-edit]').click()`);
  await js(`${inDialog('[data-tile="string"]')}.click()`);
  await js(`${inDialog('[data-choice="only-both"]')}.click()`);
  await save();
  ok('Figma and code is a prop on both sides', (await json()).props.label.only === undefined);

  // Delete in an edit's dialog: a duplicate made from the menu, then deleted from its own dialog
  await js(`${row('Size')}.querySelector('[data-more]').click()`);
  await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find(b => b.textContent === 'Duplicate').click()`);
  ok('Duplicate opens a new prop\'s dialog, with no Delete in it', await dialogOpen() && await js(`${inDialog('[data-dialog-delete]')}.hidden`));
  await save();
  await js(`${row('Size copy')}.querySelector('[data-edit]').click()`);
  await js(`${inDialog('[data-dialog-close]')}.click()`);
  ok('the dialog\'s header has a close button that closes it', !(await dialogOpen()));
  await js(`${row('Size copy')}.querySelector('[data-edit]').click()`);
  ok('an edit\'s dialog offers Delete', !(await js(`${inDialog('[data-dialog-delete]')}.hidden`)));
  // a changed form is not thrown away by a stray click or one Escape, and holds still as its content changes
  const top = await js(`document.querySelector('[data-dialog]').getBoundingClientRect().top`);
  await js(`${inDialog('[data-tile="boolean"]')}?.click()`);
  ok('an edit dialog keeps its place as its content changes', Math.abs(await js(`document.querySelector('[data-dialog]').getBoundingClientRect().top`) - top) < 1);
  await js(`document.querySelector('[data-dialog]').dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  ok('a click on the backdrop keeps a changed form open', await dialogOpen());
  await key('Escape');
  ok('Escape over changes asks once, in the dialog', await dialogOpen() && /not saved/.test(await js(`${inDialog('[data-dialog-errors]')}.textContent`)));
  await key('Escape');
  ok('a second Escape discards them', !(await dialogOpen()) && !!(await js(`${row('Size copy')}`)) && JSON.parse(await js(`document.querySelector('[data-json]').value`)).props.sizeCopy.type === 'enum');
  await js(`${row('Size copy')}.querySelector('[data-edit]').click()`);
  await js(`document.querySelector('[data-dialog]').dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  ok('a form only looked at closes on a backdrop click', !(await dialogOpen()));
  await js(`${row('Size copy')}.querySelector('[data-edit]').click()`);
  await js(`${inDialog('[data-dialog-delete]')}.click()`);
  ok('Delete removes the prop and closes the dialog', !(await dialogOpen()) && !(await js(`${row('Size copy')}`)) && (await keys()).length === 5);

  // a number and an event: code only, with no Figma side to choose
  await add('event', 'On change', () => {});
  await add('number', 'Max length', async () => { await js(`(() => { const i = ${inDialog('[data-field="default"]')}; i.value = '120'; i.dispatchEvent(new Event('input')); })()`); });
  c = await json();
  ok('an event and a number are code only, a number\'s default a number', c.props.onChange.only === 'code' && !c.props.onChange.figma && c.props.maxLength.default === 120 && c.props.maxLength.only === 'code');
  await js(`${row('On change')}.querySelector('[data-edit]').click()`);
  ok('an event\'s dialog shows Code only, not to change, and says why', await js(`${inDialog('[data-choice="only-code"]')}.checked && [...document.querySelectorAll('[data-dialog] [data-choice^="only-"]')].every((i) => i.disabled)`) && /Figma has no property for an event/.test(await js(`document.querySelector('[data-dialog-body]').textContent`)));
  await js(`${inDialog('[data-dialog-delete]')}.click()`);
  await js(`${row('Max length')}.querySelector('[data-edit]').click()`);
  await js(`${inDialog('[data-dialog-delete]')}.click()`);

  // the library, where the server serves one: narrowed by kind and by search
  await js(`document.querySelector('#tab-kinds').click()`);
  ok('the panel\'s switch is a segmented control, not tabs inside a tab', await js(`!document.querySelector('.ce-palette [role=tab]') && document.querySelector('#tab-kinds').getAttribute('aria-pressed') === 'true' && document.querySelector('#tab-library').getAttribute('aria-pressed') === 'false'`));
  await js(`document.querySelector('[data-view="props"]').focus()`);
  await key('ArrowLeft');
  ok('the views wrap with the arrow keys, Props back to Variants', await js(`document.activeElement.dataset.view === 'variants'`));
  await key('ArrowRight');
  if (connected) {
    await js(`document.querySelector('#tab-library').click()`);
    const all = await js(`document.querySelectorAll('[data-library-tiles] [data-block]').length`);
    await js(`document.querySelector('[data-field="lib-kind"]').click()`);
    await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].find((o) => o.textContent.startsWith('On / off')).click()`);
    const bools = await js(`document.querySelectorAll('[data-library-tiles] [data-block]').length`);
    ok(`the kind menu narrows the library (${all} → ${bools}), each option saying how many it holds`, bools > 0 && bools < all && /\(\d+\)/.test(await js(`document.querySelector('[data-field="lib-kind"]').textContent`)));
    await js(`(() => { const s = document.querySelector('[data-lib-search]'); s.focus(); s.value = 'zzzz'; s.dispatchEvent(new Event('input')); })()`);
    ok('a search that matches nothing says so, and the field keeps the cursor', /No props in the library match/.test(await js(`document.querySelector('[data-library-tiles]').textContent`)) && await js(`document.activeElement.matches('[data-lib-search]')`));
    await js(`(() => { const s = document.querySelector('[data-lib-search]'); s.value = ''; s.dispatchEvent(new Event('input')); })()`);
    await js(`document.querySelector('[data-field="lib-kind"]').parentElement.querySelector('.ce-picker__clear').click()`);
    await js(`document.querySelector('#tab-kinds').click()`);
  }

  // the Anatomy tab: the parts as a tree; a part opens in a modal, drawn on a stage beside its rows
  await js(`document.querySelector('[data-view="anatomy"]').click()`);
  await expandAll();
  ok('the Anatomy tab shows the outer box and offers parts in the panel', await js(`document.querySelectorAll('[data-parts] .ce-row').length === 1 && document.querySelectorAll('[data-part-block]').length === 5 && document.querySelector('[data-tabs]').hidden`));
  await js(`document.querySelector('[data-part-block="container"]').click()`);
  ok('a part block adds its part at once and opens it, drawn and outlined, its name ready to type over', await js(`document.querySelector('[data-part-dialog]').open && document.activeElement.matches('[data-inspector] [data-name]') && document.activeElement.value === 'Container' && !!document.querySelector('[data-stage] [data-selected]')`) && !!(await json()).anatomy.container);
  // the panel's blocks are under the modal: the modal adds inside the container chosen itself
  await js(`document.querySelector('[data-part-dialog] [data-add-inside="text"]').click()`);
  ok('the modal adds a part inside the container chosen, and opens it', (await json()).anatomy['container/text'] && await js(`document.activeElement.matches('[data-inspector] [data-name]') && document.activeElement.value === 'Text'`));
  ok('a part just added is added or cancelled, as a new prop is, and not deleted', await js(`(() => { const f = document.querySelector('[data-part-dialog] .modal__foot'); return !f.querySelector('[data-delete-part]') && !f.querySelector('[data-part-cancel]').hidden && f.querySelector('[data-part-done]').textContent === 'Add part'; })()`));
  const shown = () => js(`document.querySelector('[data-part-title] [data-crumb][aria-current]').textContent`);
  await js(`document.querySelector('[data-part-dialog] [data-part-cancel]').click()`);
  ok('cancelled, a part added inside goes, and the modal goes back to the part it was added from, still being added', !(await json()).anatomy['container/text'] && !!(await json()).anatomy.container
    && await js(`document.querySelector('[data-part-dialog]').open`) && await shown() === 'Container' && await js(`document.querySelector('[data-part-done]').textContent === 'Add part'`));
  await js(`document.querySelector('[data-part-dialog] [data-add-inside="text"]').click()`);
  await js(`document.querySelector('[data-part-done]').click()`);
  ok('added, the same: back to the part it went in, the part kept', !!(await json()).anatomy['container/text'] && await shown() === 'Container' && await js(`document.querySelector('[data-part-dialog]').open`));
  {
    // its position: taken out of the flow, then an offset on each side of its box, a side left empty free
    const before = JSON.stringify((await json()).anatomy.container);
    await js(`${insp('[data-choice="position-absolute"]')}.click()`);
    const out = (await json()).anatomy.container;
    ok('a part taken out of the flow is absolute, at 0, pinned to the top left', out.position === 'absolute' && JSON.stringify(out.absolute) === '{"x":0,"y":0}' && JSON.stringify(out.constraints) === '{"horizontal":"min","vertical":"min"}');
    ok('its offsets: the top and left at 0, the right and bottom free', await js(`[...document.querySelectorAll('[data-inspector] .ce-inset [data-offset]')].map((i) => i.dataset.offset + '=' + (i.value || i.placeholder)).join()`) === 'y=0,x=0,end=auto,bottom=auto');
    const typeIn = (k, v) => js(`(() => { const i = ${insp(`[data-offset="${k}"]`)}; i.value = ${JSON.stringify(v)}; i.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await typeIn('end', '−4');
    const wide = (await json()).anatomy.container;
    ok('a number on its right as well stretches it across its box, a minus as shown, with no width of its own', wide.constraints.horizontal === 'stretch' && wide.absolute.end === -4 && wide.width === undefined
      && await js(`!document.querySelector('[data-inspector] [data-size="width"], [data-inspector] [data-choice="width-hug"]')`));
    await typeIn('x', '');
    const right = (await json()).anatomy.container;
    ok('its left emptied, it is pinned to the right alone, at the size it was drawn', right.constraints.horizontal === 'max' && right.absolute.end === -4 && typeof right.width === 'number');
    // out of the field first, whose own undo is its typing's
    await js(`document.activeElement.blur()`);
    for (let i = 0; i < 3; i++) { await ctrlZ(false); await new Promise((r) => setTimeout(r, 100)); }
    ok('undone step by step, the part is back in the flow as it was', JSON.stringify((await json()).anatomy.container) === before);
  }
  // Backspace, with no field taking the keys, deletes the part shown and goes back to the part it sat in
  await js(`(() => { const uid = [...document.querySelectorAll('[data-parts] .ce-row')].find((r) => r.querySelector('.ce-row__name')?.textContent === 'Text').dataset.uid; document.querySelector('[data-stage] [data-pv="' + uid + '"]').click(); document.querySelector('[data-part-dialog]').focus(); })()`);
  ok('a part chosen on the stage is shown', await shown() === 'Text');
  await key('Backspace');
  ok('Backspace deletes it from this variant, as the dialog\'s Delete does, and the modal shows the part it sat in', (await json()).variants.some((v) => (v.remove || []).includes('container/text')) && await shown() === 'Container' && await js(`document.querySelector('[data-part-dialog]').open`));
  // undone, and taken out of every variant from its row's menu, as the steps after expect
  await ctrlZ(false);
  await js(`[...document.querySelectorAll('[data-parts] .ce-row')].find((r) => r.querySelector('.ce-row__name')?.textContent === 'Text').querySelector('[data-more]').click()`);
  await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find((b) => /^Delete/.test(b.textContent)).click()`);
  ok('from every variant, it goes from the component', !(await json()).anatomy['container/text'] && !(await json()).variants.some((v) => (v.remove || []).includes('container/text')) && await shown() === 'Container');
  await js(`(() => { const i = document.querySelector('[data-part-dialog] [data-name]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); })()`);
  await key('Backspace');
  ok('in a field, Backspace is the field\'s', await shown() === 'Containe' && await js(`document.querySelector('[data-part-dialog] [data-name]').value === 'Containe'`));
  await js(`(() => { const i = document.querySelector('[data-part-dialog] [data-name]'); i.value = 'Container'; i.dispatchEvent(new Event('input')); })()`);
  // opened again at once: the closed modal's close event, a task later, leaves this modal and its focus alone
  await js(`document.querySelector('[data-part-done]').click(); [...document.querySelectorAll('[data-parts] .ce-row')].find((r) => r.querySelector('.ce-row__name')?.textContent === 'Container').querySelector('.ce-row__main').click()`);
  await waitFor(tab, `document.querySelector('[data-part-dialog]').open`);
  await new Promise((r) => setTimeout(r, 50));
  ok('a part opened from its row takes the focus into its modal, there still after the last part\'s close event', await js(`document.querySelector('[data-part-dialog]').open && document.activeElement.matches('[data-inspector] [data-name]')`));
  ok('added, the outermost part closes the modal and is opened again as an existing part', await js(`document.querySelector('[data-part-cancel]').hidden && document.querySelector('[data-part-done]').textContent === 'Close' && !!document.querySelector('[data-delete-part]')`));
  await setPartName('Content');
  await closePart();
  ok('closed, the focus is back on its row in the tree', await js(`document.activeElement.closest('[data-parts] .ce-row')?.querySelector('.ce-row__name').textContent === 'Content'`));
  await js(`document.querySelector('[data-part-block="text"]').click()`);
  ok('a text is added with words to show', (await json()).anatomy.text?.content === 'Text');
  await setPartName('Label');
  ok('a part is moved among those beside it from the modal, the way its container lays them out', await js(`(() => { const b = document.querySelector('[data-part-dialog] [data-move="earlier"]'); return !!b && b.textContent === '←' && !b.disabled && document.querySelector('[data-move="later"]').disabled; })()`));
  await js(`document.querySelector('[data-part-dialog] [data-move="earlier"]').click()`);
  ok('moved, the order is written and the modal stays open', (await json()).anatomy.label.order < (await json()).anatomy.content.order && await js(`document.querySelector('[data-part-dialog]').open && document.activeElement.matches('[data-part-dialog] [data-move]:not(:disabled)')`));
  await js(`document.querySelector('[data-part-dialog] [data-move="later"]').click()`);
  await selectPart('Label');
  await setPartName('Label');
  await pickIn('Inside', 'Content');
  await js(`(() => { const f = ${insp('[data-fixed-text]')}; f.value = ''; f.dispatchEvent(new Event('input')); })()`);
  await selectPart('Label');
  ok('a text with no words says so under its rows, and in the tree', /needs its words/.test(await js(`${insp('[data-field-error]')}.textContent`)) && await js(`!!document.querySelector('[data-parts] [data-invalid]')`));
  await js(`${insp('[data-picker="Inside"]')}.click()`);
  await waitFor(tab, `document.activeElement.matches('.ce-picker__pop:popover-open [role=listbox]')`, { timeout: 3000 }).catch(() => {});
  ok('a short list opens with no search, the list taking the keys and saying which option is active', await js(`(() => { const p = document.querySelector('.ce-picker__pop:popover-open'); const l = p.querySelector('[role=listbox]'); return p.querySelector('[role=combobox]').hidden && document.activeElement === l && !!document.getElementById(l.getAttribute('aria-activedescendant')); })()`));
  await key('Escape');
  await pickIn('Text property', 'Label');
  ok('a choice keeps the focus on its row, drawn again', await js(`document.activeElement.matches('[data-inspector] [data-picker="Text property"]')`));
  await js(`${insp('[data-picker="Colour"]')}.click()`);
  const swatches = await js(`!!document.querySelector('.ce-picker__pop:popover-open .ce-swatch')`);
  if (swatches) {
    // the focus moves in on the popover's toggle, a task after the click
    await waitFor(tab, `document.activeElement.matches('.ce-picker__pop:popover-open :is([role=combobox], [role=listbox])')`, { timeout: 3000 }).catch(() => {});
    ok('a token picker opens on its search when its list is too long to scan, else on the list, with a swatch beside each colour', await js(`(() => { const n = document.querySelectorAll('.ce-picker__pop:popover-open [role=option]').length; return document.activeElement.matches(n > 15 ? '.ce-picker__pop:popover-open [role=combobox]' : '.ce-picker__pop:popover-open [role=listbox]'); })()`));
    await shot('5a-picker');
    ok('the picker stays inside the window', await js(`(() => { const r = document.querySelector('.ce-picker__pop:popover-open').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()`));
    const first = await js(`document.querySelector('.ce-picker__pop:popover-open [role=group] [role=option] .ce-picker__name').textContent`);
    await type(first.split('/').slice(-1)[0]);
    await key('ArrowDown');
    await key('Enter');
    ok('typing narrows it, Down and Enter choose, and the row shows the choice', (await js(`${insp('[data-picker="Colour"]')}.textContent`)).includes(first.split('/').slice(-1)[0]));
    // the start of each word, in any order, finds it: "war bac" finds Background/warning
    const words = first.split('/').slice(-2).map((w) => w.slice(0, 3).toLowerCase()).reverse().join(' ');
    await js(`${insp('[data-picker="Colour"]')}.click()`);
    await waitFor(tab, `document.activeElement.matches('.ce-picker__pop:popover-open [role=combobox]')`, { timeout: 3000 }).catch(() => {});
    await js(`(() => { const s = document.querySelector('.ce-picker__pop:popover-open [role=combobox]'); s.value = ${JSON.stringify(words)}; s.dispatchEvent(new Event('input')); })()`);
    ok(`a search of words in any order ("${words}") finds the name holding them all`, await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].some((o) => o.dataset.value === ${JSON.stringify(first)})`));
    await key('Escape');
    ok('a chosen token can be cleared with its ×, and nothing is printed as "null"', !(await js(`${insp('[data-picker="Colour"]')}.textContent`)).includes('null') && await js(`!${insp('.ce-picker__clear:not([hidden])')}.hidden`));
  } else {
    // no project, no tokens: the picker still opens, saying there is nothing to choose
    ok('with no tokens served, the picker opens and says there is nothing to choose', await js(`!!document.querySelector('.ce-picker__pop:popover-open') && document.querySelectorAll('.ce-picker__pop:popover-open [role=option]').length === 0 && /No token to choose/.test(document.querySelector('.ce-picker__pop:popover-open').textContent)`));
    await key('Escape');
  }
  ok('a value not set yet says what a click does, in the same shape, dashed', await js(`(() => { const b = ${insp('[data-picker="Text style"]')}; return /Add/.test(b.textContent) && getComputedStyle(b).borderStyle === 'dashed'; })()`));
  await js(`${insp('[data-choice="text-center"]')}.click()`);
  ok('a text\'s words are aligned in their box, written to the contract and drawn so', (await json()).anatomy['content/label'].textAlign === 'center' && await js(`getComputedStyle(document.querySelector('.ce-stage [data-pv][data-selected]')).textAlign === 'center'`));
  await js(`${insp('[data-choice="text-start"]')}.click()`);
  ok('and back to the start, the field left out', !('textAlign' in (await json()).anatomy['content/label']));
  await js(`document.querySelector('[data-zoom="100"]').click()`);
  ok('the stage draws the part at its own size, or as large as it fits', await js(`document.querySelector('.ce-stage__zoom').style.getPropertyValue('--z') === '1'`));
  ok('and the zoom chosen shows as chosen', await js(`(() => { const bg = (v) => getComputedStyle(document.querySelector('[data-zoom="' + v + '"]').closest('.seg')).backgroundColor; return bg('100') !== bg('fit'); })()`));
  await js(`document.querySelector('[data-zoom="fit"]').click()`);
  c = await json();
  ok('the anatomy is written nested, the text\'s words bound to the Label prop', c.anatomy['content/label'] && c.anatomy['content/label'].parent === 'content' && c.anatomy['content/label'].content === '{label}' && JSON.stringify(c.props.label.sets) === '["content/label"]');
  ok('a part inside another is drawn stepped in, in its container\'s subtree', await js(`(() => { const [a, b] = [...document.querySelectorAll('[data-parts] .ce-row')].slice(1); return b.getBoundingClientRect().left > a.getBoundingClientRect().left && !!b.closest('.ce-subtree .ce-subtree'); })()`));
  // a part clicked on the stage is chosen, its place said in the modal's title
  await js(`(() => { const uid = [...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Label').dataset.uid; document.querySelector('[data-stage] [data-pv="' + uid + '"]').click(); })()`);
  ok('a part clicked on the stage is chosen, in the tree too, and its place is said above the stage', await js(`!!document.querySelector('[data-parts] [data-selected] .ce-row__name') && document.querySelector('[data-parts] [data-selected] .ce-row__name').textContent === 'Label' && document.querySelector('[data-part-title] [data-crumb][aria-current]').textContent === 'Label' && document.querySelectorAll('[data-part-title] [data-crumb]').length === 3`));
  await js(`document.querySelector('[data-stage] .ce-stage__canvas').click()`);
  ok('the empty stage clicked hides the outline and the numbers, the part still chosen', await js(`(() => { const s = document.querySelector('[data-stage]'); const p = s.querySelector('[data-pv][data-selected]'); return s.hasAttribute('data-bare') && !!p && !s.querySelector('[data-ring]').offsetParent && [...s.querySelectorAll('.ce-tag')].every((t) => !t.offsetParent); })()`));
  await js(`(() => { const uid = [...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Label').dataset.uid; document.querySelector('[data-stage] [data-pv="' + uid + '"]').click(); })()`);
  ok('a part clicked again shows them', await js(`!document.querySelector('[data-stage]').hasAttribute('data-bare') && !!document.querySelector('[data-stage] [data-ring]').offsetParent`));
  await js(`[...document.querySelectorAll('[data-part-title] [data-crumb]')][1].click()`);
  ok('and a container on the way chosen from there', await js(`document.querySelector('[data-parts] [data-selected] .ce-row__name').textContent === 'Content'`));
  // as Figma's stage: a click chooses the outermost part at the levels open, a second goes one in, ⌘ or Ctrl the innermost
  {
    const uidOf = (name) => `[...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === ${JSON.stringify(name)}).dataset.uid`;
    const label = `document.querySelector('[data-stage] [data-pv="' + ${uidOf('Label')} + '"]')`;
    const chosen = () => js(`document.querySelector('[data-parts] [data-selected] .ce-row__name')?.textContent`);
    await js(`document.querySelector('[data-stage-name]').click()`);
    ok('the component\'s name above the stage chooses the outer box', await js(`!!document.querySelector('[data-stage] .ce-stage__zoom > [data-pv][data-selected]')`));
    const at = await js(`(() => { const r = ${label}.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await mouse('mouseMoved', at.x, at.y);
    await shot('5b-hover');
    ok('pointing at a part inside another outlines the outermost one a click would choose', await js(`document.querySelector('[data-stage] [data-hover]')?.dataset.of === ${uidOf('Content')}`));
    await js(`${label}.click()`);
    const first = await chosen();
    await js(`${label}.click()`);
    ok('a click chooses it, a second goes one level in', first === 'Content' && await chosen() === 'Label');
    await js(`document.querySelector('[data-stage-name]').click()`);
    await js(`${label}.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true, detail: 1 }))`);
    ok('with Ctrl, the innermost part at once', await chosen() === 'Label');
  }

  await closePart();
  ok('a part being added is kept once another part is chosen, its modal closed', !!(await json()).anatomy['content/label']);
  // a container folds its parts away and opens them again
  await js(`[...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Content').querySelector('[data-fold]').click()`);
  ok('a container folds its parts away and says how many', !(await js(`[...document.querySelectorAll('[data-parts] .ce-row__name')].some(n => n.textContent === 'Label')`)) && /1/.test(await js(`document.activeElement.textContent`)) && await js(`document.activeElement.getAttribute('aria-expanded') === 'false'`));
  await js(`document.activeElement.click()`);
  ok('and opens them again', await js(`[...document.querySelectorAll('[data-parts] .ce-row__name')].some(n => n.textContent === 'Label')`));
  ok('with every container open, the tree offers Collapse all', await js(`document.querySelector('[data-fold-all]').textContent === 'Collapse all' && !document.querySelector('.ce-tree-tools').hidden`));
  await js(`document.querySelector('[data-fold-all]').click()`);
  ok('Collapse all goes back to one level: the outer box open, the containers in it shut', !(await js(`[...document.querySelectorAll('[data-parts] .ce-row__name')].some(n => n.textContent === 'Label')`)) && await js(`[...document.querySelectorAll('[data-parts] .ce-row__name')].some(n => n.textContent === 'Content') && document.activeElement.textContent === 'Expand all'`));
  await js(`document.querySelector('[data-fold-all]').click()`);
  ok('and Expand all opens every one', await js(`[...document.querySelectorAll('[data-parts] .ce-row__name')].some(n => n.textContent === 'Label') && document.querySelector('[data-fold-all]').textContent === 'Collapse all'`));
  ok('the parts hang from lines, not boxes', await js(`getComputedStyle(document.querySelector('.ce-subtree > .ce-node'), '::before').borderInlineStartStyle === 'solid' && getComputedStyle(document.querySelector('[data-parts] > .ce-node')).borderStyle === 'none'`));
  ok('Preview sits right of Figma and Code', await js(`[...document.querySelectorAll('.ce-top > .button')].slice(-3).map((b) => b.textContent.trim()).join() === 'Figma,Code,Preview'`));
  await js(`document.querySelector('[data-theme-choice="dark"]').click()`);
  ok('the theme switch in the bar sets the page dark and remembers it', await js(`document.documentElement.dataset.theme === 'dark' && localStorage.getItem('theme') === 'dark' && document.querySelector('[data-theme-choice="dark"]').getAttribute('aria-pressed') === 'true'`));
  await js(`document.querySelector('[data-theme-choice="system"]').click()`);
  ok('System gives the choice back to the reader\'s setting', await js(`!('theme' in document.documentElement.dataset) && localStorage.getItem('theme') === null`));
  ok('Figma and Code sit beside the component\'s name, not in the window\'s bar', await js(`!!document.querySelector('.ce-top [data-figma-menu]') && !!document.querySelector('.ce-top [data-code-menu]') && !document.querySelector('.ce-bar [data-figma-menu]')`));
  // the preview hidden, Code sits near the window's right edge, only Preview after it
  await js(`document.querySelector('[data-json-toggle]').click()`);
  await js(`document.querySelector('[data-code-menu]').click()`);
  await waitFor(tab, `!!document.querySelector('#code-menu[data-placed]')`, { timeout: 3000 }).catch(() => {});
  ok('a menu off a button at the window\'s edge opens inside the window', await js(`(() => { const r = document.querySelector('#code-menu').getBoundingClientRect(), b = document.querySelector('[data-code-menu]').getBoundingClientRect(); return innerWidth - b.right < 200 && r.left >= 0 && r.right <= innerWidth; })()`));
  await key('Escape');
  await js(`document.querySelector('[data-json-toggle]').click()`);
  // a part's size: its content's, its container's, or a number of pixels
  await selectPart('Content');
  await js(`${insp('[data-choice="width-fixed"]')}.click()`);
  await js(`(() => { const i = ${insp('[data-size="width"]')}; i.value = '40'; i.dispatchEvent(new Event('change')); })()`);
  ok('a part\'s width set to a fixed size is written in pixels', (await json()).anatomy.content.width === 40);
  // a component far wider than the stage, at Fit, is drawn whole in its middle
  await js(`(() => { const i = ${insp('[data-size="width"]')}; i.value = '3000'; i.dispatchEvent(new Event('change')); })()`);
  ok('a component wider than the stage is drawn whole, in its middle, at Fit', await js(`(() => { const c = document.querySelector('.ce-stage__canvas').getBoundingClientRect(), r = document.querySelector('.ce-stage [data-pv="root"]').getBoundingClientRect();
    return r.left >= c.left && r.right <= c.right && Math.abs((r.left + r.right) / 2 - (c.left + c.right) / 2) < 2; })()`));
  await js(`(() => { const i = ${insp('[data-size="width"]')}; i.value = '40'; i.dispatchEvent(new Event('change')); })()`);
  ok('a fixed side has no minimum to set', !(await js(`!!${insp('[data-min="width"]')}`)) && await js(`!!${insp('[data-min="height"]')}`));
  await js(`(() => { const i = ${insp('[data-min="height"]')}; i.value = '32'; i.dispatchEvent(new Event('change')); })()`);
  ok('a side that fits its content keeps a minimum, written in pixels', (await json()).anatomy.content.minHeight === 32);
  // where a container's parts sit: across its direction and along it
  await js(`${insp('[data-choice="cross-center"]')}.click()`);
  await js(`${insp('[data-choice="along-space-between"]')}.click()`);
  ok('lining up and distributing are apart: no spread among the line-up choices', await js(`!document.querySelector('[data-inspector] [data-choice="cross-space-between"]')`));
  ok('the layout choices are drawings, each named', await js(`[...document.querySelectorAll('[data-inspector] :is([data-choice^="dir-"], [data-choice^="cross-"], [data-choice^="along-"])')].every((i) => i.getAttribute('aria-label') && i.closest('label').title && i.closest('label').querySelector('svg'))`));
  ok('a container\'s alignment is written to its layout, across and along', (await json()).anatomy.content.layout.crossAlign === 'center' && (await json()).anatomy.content.layout.align === 'space-between');
  ok('and read back into its rows', await js(`${insp('[data-choice="cross-center"]')}.checked && ${insp('[data-choice="along-space-between"]')}.checked`));
  ok('the chosen container shows its padding on the stage, a number on each side it pads and none where it is 0, shown and not set there', await js(`(() => { const t = [...document.querySelectorAll('[data-stage] .ce-stage__zoom > .ce-tag[data-tag$="padding"]')]; const cs = getComputedStyle(document.querySelector('[data-stage] [data-selected]')); return t.length === ['Top', 'Right', 'Bottom', 'Left'].filter((k) => parseFloat(cs['padding' + k])).length && t.every((x) => x.matches('span[aria-hidden="true"]') && getComputedStyle(x).pointerEvents === 'none') && !!document.querySelector('[data-stage] [data-selected] > .ce-bands'); })()`));
  if (swatches) {
    await js(`${insp('[data-each="Padding"]')}.click()`);
    await js(`${insp('[data-pad="start"]')}.click()`);
    const side = await js(`(() => { const o = document.querySelector('.ce-picker__pop:popover-open [role=option][data-value]:not([data-value=""])'); o.click(); return o.dataset.value; })()`);
    ok('a side set alone from the rows is written on that side alone', JSON.stringify((await json()).anatomy.content.layout.padding) === JSON.stringify({ start: side }));
    const choose = () => js(`(() => { const o = document.querySelector('.ce-picker__pop:popover-open [role=option][data-value]:not([data-value=""])'); o.click(); return o.dataset.value; })()`);
    ok('sides set alone show each side, in pairs left and right, then top and bottom', await js(`[...document.querySelectorAll('[data-fours="Padding"] [data-pad]')].map((b) => b.dataset.pad).join('|') === 'start|end|top|bottom' && document.querySelector('[data-each="Padding"]').getAttribute('aria-pressed') === 'true'`));
    await js(`${insp('[data-pad="top"]')}.click()`);
    const top = await choose();
    { const pad = (await json()).anatomy.content.layout.padding; ok('the rows set padding too, a side each, the other sides kept', Object.keys(pad).length === 2 && pad.start === side && pad.top === top); }
    await js(`${insp('[data-each="Padding"]')}.click()`);
    ok('the toggle off, padding is set in pairs, a pair whose sides differ said mixed', await js(`[...document.querySelectorAll('[data-fours="Padding"] [data-pad]')].map((b) => b.dataset.pad + ':' + b.lastChild.textContent).join('|') === 'start,end:Mixed|top,bottom:Mixed' && document.activeElement.matches('[data-each="Padding"]')`));
    await js(`${insp('[data-pad="start,end"]')}.click()`);
    const across = await choose();
    { const pad = (await json()).anatomy.content.layout.padding; ok('a pair set sets both its sides at once', pad.start === across && pad.end === across && pad.top === top && !pad.bottom); }
    ok('corners are one value until the toggle opens each', await js(`[...document.querySelectorAll('[data-inspector] [data-pad]')].some((b) => b.dataset.pad === 'tl,tr,br,bl')`));
    await js(`${insp('[data-each="Corners"]')}.click()`);
    await js(`${insp('[data-pad="tl"]')}.click()`);
    const tl = await choose();
    { const r = (await json()).anatomy.content.radius; ok('a corner set alone writes the four, in Figma\'s order', Array.isArray(r) && r.length === 4 && r[0] === tl); }
    await js(`${insp('[data-pad="tr"]')}.click()`); await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].find((o) => o.dataset.value === ${JSON.stringify(tl)}).click()`);
    await js(`${insp('[data-pad="br"]')}.click()`); await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].find((o) => o.dataset.value === ${JSON.stringify(tl)}).click()`);
    await js(`${insp('[data-pad="bl"]')}.click()`); await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].find((o) => o.dataset.value === ${JSON.stringify(tl)}).click()`);
    ok('four corners alike are one radius again', (await json()).anatomy.content.radius === tl);
    await js(`${insp('[data-each="Corners"]')}.click()`);
    await js(`${insp('[data-pad="tl,tr,br,bl"]')}.click()`);
    ok('an option under its group\'s heading drops the group\'s name', await js(`(() => { const o = document.querySelector('.ce-picker__pop:popover-open [role=group] [role=option]'); return !!o && o.dataset.value.endsWith('/' + o.querySelector('.ce-picker__name').textContent); })()`));
    await key('Escape');
  }
  await js(`${insp('[data-choice="along-start"]')}.click()`);
  ok('start, the default, is no value at all', !('align' in (await json()).anatomy.content.layout));
  // a menu is unseen until it is placed beside its button, so it never flashes in the corner first
  await closePart();
  ok('a menu shows only once it is placed', await js(`new Promise((r) => { const b = document.querySelector('[data-figma-menu]'); const pop = document.getElementById(b.getAttribute('popovertarget')); b.click(); const first = getComputedStyle(pop).visibility; requestAnimationFrame(() => requestAnimationFrame(() => { const then = getComputedStyle(pop).visibility; pop.hidePopover(); r(first === 'hidden' && then === 'visible'); })); })`));

  // a variant: the component drawn at another value, an edit written for that value alone
  {
    await selectPart('Content');
    // a second part beside the label, to move it among (deleted again at the end)
    await js(`document.querySelector('[data-part-dialog] [data-add-inside="text"]').click()`);
    await js(`document.querySelector('[data-part-done]').click()`);
    ok('the modal offers a menu per option to draw the component at', await js(`!!document.querySelector('[data-views] [data-picker="Size"]')`));
    // a value other than the default
    await js(`document.querySelector('[data-views] [data-picker="Size"]').click()`);
    const value = await js(`(() => { const o = document.querySelector('.ce-picker__pop:popover-open [role=option][aria-selected="false"]'); o.click(); return o.dataset.value; })()`);
    ok('at another value the way back to the defaults is offered, and the part\'s name and links are not', await js(`!!document.querySelector('[data-view-default]')`) && !(await js(`!!${insp('[data-name]')}`)));
    await js(`${insp('[data-choice="width-fill"]')}.click()`);
    let v = (await json()).variants;
    await shot('5b-variant');
    ok('the dot is in sight, not clipped by the rows\' scrolling column', await js(`(() => { const d = document.querySelector('[data-inspector] [data-dot]').getBoundingClientRect(), c = document.querySelector('[data-inspector]').getBoundingClientRect(); return d.left >= c.left && d.right <= c.right; })()`));
    ok('an edit there is written to that value\'s variant, the component\'s own width kept', JSON.stringify(v) === JSON.stringify([{ when: { size: value }, set: { 'content.width': 'fill' } }]) && (await json()).anatomy.content.width === 40);
    await ctrlZ(false);
    ok('Ctrl+Z undoes the last edit, wherever it was made, and says so', JSON.stringify((await json()).variants) === '[]' && await waitFor(tab, `/Undone/.test(document.querySelector('[data-status]').textContent)`, { timeout: 2000 }).then(() => true, () => false));
    await ctrlZ(true);
    ok('and Shift+Ctrl+Z redoes it', JSON.stringify((await json()).variants) === JSON.stringify(v));
    ok('a dot marks the row the variant changes', await js(`!!${insp('[data-dot="width"]')} && !${insp('[data-dot="width"]')}.disabled && !${insp('[data-dot="height"]')}`));
    await js(`${insp('[data-dot="width"]')}.click()`);
    ok('and a click on the dot puts it back, the emptied variant gone', JSON.stringify((await json()).variants) === '[]' && !(await js(`!!${insp('[data-dot]')}`)));
    // moved and deleted at the variant: there alone, as a part's position and a removal its layer holds
    const order = JSON.stringify(Object.fromEntries(Object.entries((await json()).anatomy).map(([k, x]) => [k, x.order])));
    await selectPart('Label');
    await js(`document.querySelector('[data-part-dialog] [data-move]:not(:disabled)').click()`);
    v = (await json()).variants;
    ok('a part moved at a variant moves there alone: positions set in its variant, the component\'s kept', v.length === 1 && Object.keys(v[0].set || {}).every((k) => k.endsWith('.order'))
      && JSON.stringify(Object.fromEntries(Object.entries((await json()).anatomy).map(([k, x]) => [k, x.order]))) === order);
    await js(`document.querySelector('[data-undo-button]').click()`);
    ok('and Undo takes the move back', JSON.stringify((await json()).variants) === '[]');
    await selectPart('Content');
    ok('Delete at a variant says it deletes from this variant, and which on hover', await js(`document.querySelector('[data-delete-part]').textContent === 'Delete from this variant' && /^Delete when Size is .*, there alone;/.test(document.querySelector('[data-delete-part]').title)`));
    await js(`document.querySelector('[data-delete-part]').click()`);
    v = (await json()).variants;
    ok('its row in the tree says the values it is not in at all (Not in lg), not hidden', await js(`(() => { const r = [...document.querySelectorAll('[data-parts] .ce-row')].find((x) => x.querySelector('.ce-row__name').textContent === 'Content'); return !!r && r.querySelector('[data-gone] span[aria-hidden]').textContent === r.querySelector('[data-gone]').title.replace(/^Not in the component when Size is /, 'Not in ') && /^Not in the component when Size is /.test(r.querySelector('[data-gone]').title); })()`));
    ok('a part deleted at a variant goes from there alone, the component keeping it', JSON.stringify(v) === JSON.stringify([{ when: { size: value }, remove: ['content'] }]) && !!(await json()).anatomy.content);
    await selectPart('Content');
    ok('opened there it is not drawn, and is put back', await js(`!!document.querySelector('[data-put-back]') && !document.querySelector('[data-delete-part]')`));
    await js(`document.querySelector('[data-put-back]').click()`);
    ok('put back, the variant is as it was', JSON.stringify((await json()).variants) === '[]');
    await js(`document.querySelector('[data-views] [data-view-default]').click()`);
    ok('back at the defaults, the edits are the component\'s again', await js(`!document.querySelector('[data-view-default]') && !!${insp('[data-name]')}`));
    // at the defaults the dialog deletes from the default combination alone; the row menu, from every variant
    await selectPart('Text');
    await js(`document.querySelector('[data-delete-part]').click()`);
    v = (await json()).variants;
    ok('Delete at the defaults takes the part out of the default combination alone', !!(await json()).anatomy['content/text'] && v.length === 1 && v[0].combination && JSON.stringify(v[0].remove) === '["content/text"]'
      && await js(`[...document.querySelectorAll('[data-parts] .ce-row')].find((x) => x.querySelector('.ce-row__name').textContent === 'Text').querySelector('[data-gone] span[aria-hidden]').textContent === 'Not in Default'`));
    await ctrlZ(false);
    await closePart();
    await js(`[...document.querySelectorAll('[data-parts] .ce-row')].find((x) => x.querySelector('.ce-row__name').textContent === 'Text').querySelector('[data-more]').click()`);
    await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find((b) => b.textContent === 'Delete from all variants').click()`);
    ok('Delete from all variants, in its row menu, takes it out of the component', !(await json()).anatomy['content/text'] && JSON.stringify((await json()).variants) === '[]');
  }
  // a prop a part depends on cannot change kind under it
  await js(`document.querySelector('[data-view="props"]').click()`);
  await js(`${row('Label')}.querySelector('[data-edit]').click()`);
  await js(`${inDialog('[data-tile="boolean"]')}.click()`);
  await save();
  ok('a prop whose words a part takes cannot become another kind, and the dialog says which part', await dialogOpen() && /Label takes its words from it/.test(await js(`${inDialog('[data-dialog-errors]')}.textContent`)));
  await js(`${inDialog('[data-dialog-cancel]')}.click()`);
  await js(`${row('Label')}.querySelector('[data-more]').click()`);
  await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find(b => b.textContent === 'Delete').click()`);
  ok('a prop a part takes its words from is not deleted, and the page says which part', !!(await js(`${row('Label')}`)) && /Label takes something from it/.test(await js(`document.querySelector('[data-dialog] [data-sync-output]').textContent`)));
  await js(`${inDialog('[data-dialog-save]')}.click()`);
  await js(`document.querySelector('[data-view="anatomy"]').click()`);
  await expandAll();
  // a part dragged into another container: a second container in the outer box, then the label dragged into it
  await js(`document.querySelector('[data-parts] [data-uid="root"] [data-edit]').click()`);
  await js(`document.querySelector('[data-part-block="container"]').click()`);
  await setPartName('Side');
  await closePart();
  {
    const order = () => js(`[...document.querySelectorAll('[data-parts] > ol > li > ol > li > .ce-row .ce-row__name, [data-parts] .ce-subtree > li > .ce-row .ce-row__name')].map(n => n.textContent).filter(t => t === 'Content' || t === 'Side').join()`);
    await js(`[...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Side').querySelector('[data-part-handle]').focus()`);
    await key('ArrowUp');
    ok('a part\'s handle moves it among its siblings with the arrow keys, and keeps the focus', await order() === 'Side,Content' && await js(`document.activeElement.matches('[data-part-handle]')`));
    await key('ArrowDown');
  }
  {
    const handle = await js(`(() => { const r = [...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Label').querySelector('[data-part-handle]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    const side = await js(`(() => { const r = [...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Side').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await mouse('mousePressed', handle.x, handle.y);
    for (let k = 1; k <= 8; k++) await mouse('mouseMoved', handle.x + (side.x - handle.x) * k / 8, handle.y + (side.y - handle.y) * k / 8);
    // the copy laid out as the rows are: its handle inside it, its columns the list's
    ok('the carried copy is laid out as a row in the tree is', await js(`(() => { const g = document.querySelector('.ce-lift'), r = document.querySelector('[data-parts] .ce-row--part:not(.ce-row--slot)'); const h = g.querySelector('.ce-handle').getBoundingClientRect(), b = g.getBoundingClientRect(); return h.left >= b.left && g.querySelector('.ce-row__main').style.gridTemplateColumns.split(' ').length === getComputedStyle(r.querySelector('.ce-row__main')).gridTemplateColumns.split(' ').length; })()`));
    ok('dragging over a container\'s middle shows the part dashed inside it, a copy of its row under the pointer', !!(await js(`document.querySelector('body > .ce-lift')`)) && await js(`!![...document.querySelectorAll('[data-parts] .ce-row[data-uid]')].find(x => x.querySelector('.ce-row__name').textContent === 'Side').closest('.ce-node').querySelector(':scope > .ce-subtree .ce-row--slot')`));
    await mouse('mouseReleased', side.x, side.y);
    const moved = await json();
    ok('dropping the text into the other container moves it there, its words still bound', moved.anatomy['side/label'] && moved.anatomy['side/label'].parent === 'side' && JSON.stringify(moved.props.label.sets) === '["side/label"]');
    {
      // below the last row, across the tree, the part goes last in the outer box
      const h = await js(`(() => { const b = [...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Side').querySelector('[data-part-handle]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
      const under = await js(`(() => { const rs = [...document.querySelectorAll('[data-parts] .ce-row[data-uid]')].filter((r) => r.checkVisibility()); const b = rs.at(-1).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.bottom + 40 }; })()`);
      await mouse('mousePressed', h.x, h.y);
      for (let k = 1; k <= 8; k++) await mouse('mouseMoved', h.x + (under.x - h.x) * k / 8, h.y + (under.y - h.y) * k / 8);
      const last = await js(`(() => { const s = document.querySelector('[data-parts] .ce-row--slot').closest('.ce-node'); return !s.nextElementSibling && s.parentElement.closest('.ce-node')?.querySelector(':scope > .ce-row').dataset.uid === 'root'; })()`);
      await mouse('mouseReleased', under.x, under.y);
      const a = (await json()).anatomy;
      const tops = Object.entries(a).filter(([, e]) => e.parent === 'root').sort((x, y) => x[1].order - y[1].order).map(([k]) => k);
      ok('a part dropped below the last row goes last in the outer box, its slot shown there first', last && tops.at(-1) === 'side');
    }
    // and back, so the steps after see the anatomy they expect
    await selectPart('Label');
    await pickIn('Inside', 'Content');
    await selectPart('Side');
    await js(`document.querySelector('[data-part-dialog] [data-delete-part]').click()`);
    ok('a part deleted from its modal goes from this variant, and the modal shows the part it sat in', !!(await json()).anatomy.side && (await json()).variants.some((x) => (x.remove || []).includes('side')) && await js(`document.querySelector('[data-part-dialog]').open && document.querySelector('[data-part-title] [data-crumb][aria-current]').dataset.crumb === 'root'`));
    await ctrlZ(false);
    await closePart();
    ok('undone, and deleted from every variant from its row menu', await dropPart('Side') && !(await json()).anatomy.side && !(await json()).variants.some((x) => (x.remove || []).includes('side')));
    await js(`document.querySelector('[data-view="anatomy"]').click()`);
    await closePart();
  }
  // a part block dragged from the panel lands where it is dropped: here, before the label
  {
    const tileAt = await js(`(() => { const r = document.querySelector('[data-part-block="text"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    const to = await js(`(() => { const r = [...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Label').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.15 }; })()`);
    await mouse('mousePressed', tileAt.x, tileAt.y);
    for (let k = 1; k <= 8; k++) await mouse('mouseMoved', tileAt.x + (to.x - tileAt.x) * k / 8, tileAt.y + (to.y - tileAt.y) * k / 8);
    // the rows ease aside as the slot moves: aimed again where Label now is, as a person aims at what they see
    for (let k = 0; k < 2; k++) {
      await new Promise((r) => setTimeout(r, 250));
      Object.assign(to, await js(`(() => { const r = [...document.querySelectorAll('[data-parts] .ce-row[data-uid]')].find(x => x.querySelector('.ce-row__name').textContent === 'Label').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.15 }; })()`));
      await mouse('mouseMoved', to.x, to.y);
    }
    ok('a part block dragged over a row shows itself, dashed, where it would land, its copy as wide as the rows', await js(`(() => { const s = document.querySelector('[data-parts] .ce-row--slot'); if (!(document.querySelector('.ce-lift')?.offsetWidth >= document.querySelector('[data-parts] .ce-row').offsetWidth - 1)) return false; return !!s && s.closest('.ce-node').nextElementSibling?.querySelector(':scope > .ce-row .ce-row__name')?.textContent === 'Label'; })()`));
    await mouse('mouseReleased', to.x, to.y);
    const a = (await json()).anatomy;
    ok('dropped, it is added where it was dropped, and opened, no copy left on the page', !(await js(`!!document.querySelector('.ce-lift')`)) && a['content/text'] && a['content/text'].order < a['content/label'].order && await js(`document.activeElement.matches('[data-inspector] [data-name]')`));
    await js(`document.querySelector('[data-part-dialog] [data-part-cancel]').click()`);
  }
  // a shape: a rectangle or an ellipse, its fill, border and a rectangle's corners
  {
    await js(`document.querySelector('[data-part-block="graphic"]').click()`);
    await waitFor(tab, `!!document.querySelector('[data-part-dialog] [data-choice="shape-rectangle"]')`, { timeout: 2000 }).catch(() => {});
    const fields = () => js(`[...document.querySelectorAll('[data-part-dialog] [data-picker]')].map((x) => x.dataset.picker).join('|') + '|' + document.querySelector('[data-part-dialog] [data-inspector]').innerText`);
    ok('a Shape block adds a rectangle, with its fill, border and corners', await js(`document.querySelector('[data-part-dialog] [data-choice="shape-rectangle"]')?.checked`) && /\bFill\|/.test(await fields()) && /Border/.test(await fields()) && /Corners/i.test(await fields()));
    await js(`document.querySelector('[data-part-dialog] [data-choice="shape-ellipse"]').click()`);
    await waitFor(tab, `document.querySelector('[data-part-dialog] [data-choice="shape-ellipse"]')?.checked`, { timeout: 2000 }).catch(() => {});
    ok('an ellipse has no corners', !/Corners/i.test(await fields()));
    await js(`document.querySelector('[data-part-dialog] [data-part-done]').click()`);
    const g = Object.values((await json()).anatomy).find((x) => x.kind === 'graphic');
    ok('added, the contract keeps it as an ellipse', g && g.shape === 'ellipse');
    await closePart();
    await dropPart('Shape');
    ok('and deleted, the anatomy is as it was', !Object.values((await json()).anatomy).some((x) => x.kind === 'graphic'));
    await js(`document.querySelector('[data-view="anatomy"]').click()`);
  }
  // a part duplicated from its row menu, or with Ctrl+D, C and V on its row: the copy beside it, or pasted into a container
  {
    const ctrl = (k) => js(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: '${k}', ctrlKey: true, bubbles: true, cancelable: true }))`);
    const rowOf = (name) => `[...document.querySelectorAll('[data-parts] .ce-row[data-uid]')].find(x => x.querySelector('.ce-row__name').textContent === ${JSON.stringify(name)})`;
    const names = () => js(`[...document.querySelectorAll('[data-parts] .ce-row[data-uid] .ce-row__name')].map((n) => n.textContent).join()`);
    const before = JSON.stringify((await json()).anatomy);
    await js(`${rowOf('Label')}.querySelector('[data-more]').click()`);
    await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find(b => b.textContent === 'Duplicate').click()`);
    let a = (await json()).anatomy;
    ok('Duplicate in a part\'s menu puts a copy right after it, named so, its words still bound', /Label,Label copy/.test(await names()) && a['content/labelCopy']?.kind === 'text' && a['content/labelCopy'].order === a['content/label'].order + 1
      && JSON.stringify((await json()).props.label.sets) === '["content/label","content/labelCopy"]');
    await ctrlZ(false);
    ok('and Ctrl+Z takes it away', JSON.stringify((await json()).anatomy) === before);
    await js(`${rowOf('Label')}.querySelector('[data-edit]').focus()`);
    await ctrl('d');
    ok('Ctrl+D on a part\'s row duplicates it too', !!(await json()).anatomy['content/labelCopy']);
    await ctrlZ(false);
    await js(`${rowOf('Label')}.querySelector('[data-edit]').focus()`);
    await ctrl('c');
    await js(`${rowOf('Outer box')}.querySelector('[data-edit]').focus()`);
    await ctrl('v');
    a = (await json()).anatomy;
    ok('Ctrl+C on a part and Ctrl+V on a container pastes a copy into it, last', a['labelCopy']?.kind === 'text' && a['labelCopy'].parent === 'root' && a['labelCopy'].order === 1 && /Pasted Label copy into Outer box/.test(await js(`new Promise(r => requestAnimationFrame(() => r(document.querySelector('[data-status]').textContent)))`)));
    await ctrlZ(false);
    ok('and Ctrl+Z takes the paste away', JSON.stringify((await json()).anatomy) === before);
    // pasted into a part still being added, then Close: both stay
    await js(`document.querySelector('[data-part-block="container"]').click()`);
    await js(`getSelection().removeAllRanges(); document.querySelector('[data-part-dialog] [data-part-close]').focus()`);
    await ctrl('v');
    await js(`document.querySelector('[data-part-done]').click()`);
    await new Promise((r) => setTimeout(r, 200));
    a = (await json()).anatomy;
    ok('a part pasted into one still being added, then Close, keeps both', Object.entries(a).some(([k, e]) => e.kind === 'text' && /labelCopy$/.test(k) && a[e.parent]?.kind === 'container' && e.parent !== 'root'));
    for (let k = 0; k < 3 && JSON.stringify((await json()).anatomy) !== before; k++) await ctrlZ(false);
  }
  {
    await selectPart('Content');
    await closePart();
    const r = await js(`(() => { const r = [...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Content').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await mouse('mouseMoved', r.x, r.y);
    await shot('5c-inspect');
    await js(`document.querySelector('[data-out-tab="preview"]').click()`);
    await mouse('mouseMoved', r.x, r.y + 1);
    ok('pointing at a part in the tree outlines it in the preview', await js(`(() => { const uid = [...document.querySelectorAll('[data-parts] .ce-row')].find(x => x.querySelector('.ce-row__name').textContent === 'Content').dataset.uid; return !!document.querySelector('[data-out="preview"] [data-pv="' + uid + '"][data-inspect]'); })()`));
    await js(`document.querySelector('[data-out-tab="json"]').click()`);
    await mouse('mouseMoved', 5, 5);
  }
  await shot('5-anatomy');
  ok('the JSON tab comes first and shows the contract, with Copy and Download above it', await js(`document.querySelector('[data-out-tab]').dataset.outTab === 'json' && !document.querySelector('[data-out="json"]').hidden && !!document.querySelector('[data-out="json"] [data-copy]')`));
  await js(`document.querySelector('[data-out-tab="preview"]').click()`);
  ok('the preview draws the anatomy: the outer box holds Content, which holds the label\'s words', await js(`(() => { const t = document.querySelector('.ce-preview__stage > .ce-pv > .ce-pv > span'); return !!t && t.textContent.length > 0 && document.querySelector('[data-out="json"]').hidden; })()`));
  await js(`document.querySelector('[data-out-tab="json"]').click()`);
  await js(`document.querySelector('[data-view="props"]').click()`);

  // the JSON edited by hand: Apply reads it back; broken JSON is refused, saying why
  const before = await json();
  await js(`(() => { const t = document.querySelector('[data-json]'); const c = JSON.parse(t.value); delete c.props.isLoading; t.value = JSON.stringify(c, null, 2); t.dispatchEvent(new Event('input')); })()`);
  ok('an edit to the JSON offers Apply and waits for it', await js(`!document.querySelector('[data-json-apply]').hidden`) && (await keys()).length === Object.keys(before.props).length - 1);
  await js(`document.querySelector('[data-json-apply]').click()`);
  c = await json();
  ok('Apply reads the edited JSON back: the prop is gone from the rows, the anatomy and its links kept', !(await js(`${row('Is loading')}`)) && JSON.stringify(c.anatomy) === JSON.stringify(before.anatomy) && JSON.stringify(c.props.label.sets) === '["content/label"]');
  await js(`(() => { const t = document.querySelector('[data-json]'); t.value = '{ broken'; t.dispatchEvent(new Event('input')); })()`);
  await js(`document.querySelector('[data-json-apply]').click()`);
  ok('broken JSON is refused with the reason, and the page keeps what it had', /Not valid JSON/.test(await js(`document.querySelector('[data-json-errors]').textContent`)) && await js(`document.querySelector('[data-json]').hasAttribute('aria-invalid')`));
  await js(`document.querySelector('[data-json-revert]').click()`);
  // a prop left out of a combination not drawn is any value of it (derive.cjs folds one that makes no difference): still a grid
  const was = await js(`document.querySelector('[data-json]').value`);
  await js(`(() => { const t = document.querySelector('[data-json]'); const c = JSON.parse(t.value); const [b] = Object.keys(c.props).filter((k) => c.props[k].type === 'boolean'); c.invalid = [{ size: c.props.size.values[0], [b]: true }, { [b]: false }]; t.value = JSON.stringify(c, null, 2); t.dispatchEvent(new Event('input')); })()`);
  await js(`document.querySelector('[data-json-apply]').click()`);
  await js(`document.querySelector('[data-view="variants"]').click()`);
  ok('a combination not drawn with a prop left out is any value of it, in the grid', await js(`(() => { const c = JSON.parse(document.querySelector('[data-json]').value); const [b] = Object.keys(c.props).filter((k) => c.props[k].type === 'boolean');
    const cells = [...document.querySelectorAll('[data-variants] .ce-vgrid [data-combo]')];
    return cells.length > 0 && cells.every((x) => { const m = JSON.parse(x.dataset.combo); return x.matches('.ce-vgrid__not') === (m[b] === false || (m[b] === true && m.size === c.props.size.values[0])); }); })()`));
  // the modal draws only what Figma draws: a switch that would leave the combination undrawn moves the option to one drawn, and an option undrawn is not offered
  await js(`document.querySelector('[data-view="anatomy"]').click()`);
  await js(`document.querySelector('[data-parts] [data-edit]').click()`);
  const [flagName, small] = await js(`(() => { const c = JSON.parse(document.querySelector('[data-json]').value); const [b] = Object.keys(c.props).filter((k) => c.props[k].type === 'boolean'); return [c.props[b].figma || b, c.props.size.values[0]]; })()`);
  await js(`(() => { const s = document.querySelector('[data-part-dialog] [data-switch=${JSON.stringify(JSON.stringify(flagName)).slice(1, -1)}]'); s.checked = true; s.dispatchEvent(new Event('change')); })()`);
  const sizeName = await js(`(() => { const c = JSON.parse(document.querySelector('[data-json]').value); return c.props.size.figma || 'size'; })()`);
  await js(`document.querySelector('[data-part-dialog] [data-picker=${JSON.stringify(JSON.stringify(sizeName)).slice(1, -1)}]').click()`);
  await waitFor(tab, `document.activeElement.matches('.ce-picker__pop:popover-open [role=listbox]')`, { timeout: 3000 }).catch(() => {});
  ok('a prop\'s values open as a list with no search, the list taking the keys', await js(`(() => { const p = document.querySelector('.ce-picker__pop:popover-open'); return p.querySelector('[role=combobox]').hidden && document.activeElement === p.querySelector('[role=listbox]') && !!document.getElementById(document.activeElement.getAttribute('aria-activedescendant')); })()`));
  ok('a combination Figma does not draw is never offered in the modal, and a switch moves the others to one it does', await js(`(() => { const o = [...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')]; return o.length > 0 && !o.some((x) => x.dataset.value === ${JSON.stringify(small)}); })()`)
    && (await js(`document.querySelector('[data-part-dialog] [data-picker=${JSON.stringify(JSON.stringify(sizeName)).slice(1, -1)}]').textContent`)).trim().toLowerCase() !== small);
  await key('Escape');
  await closePart();
  await js(`document.querySelector('[data-view="props"]').click()`);
  await js(`(() => { const t = document.querySelector('[data-json]'); t.value = ${JSON.stringify(was)}; t.dispatchEvent(new Event('input')); })()`);
  await js(`document.querySelector('[data-json-apply]').click()`);
  // a prop deleted keeps its layers for Undo, each where it stood: an edit made meanwhile at another value puts none of
  // them after the pairs they stood before, which would draw over them
  {
    await js(`(() => { const t = document.querySelector('[data-json]'); const c = JSON.parse(t.value); c.props.flag = { type: 'boolean', default: false, figma: 'Flag' }; c.props.mode = { type: 'boolean', default: false, figma: 'Mode' };
      const lg = c.props.size.values.find((v) => v !== c.props.size.default);
      c.variants = [{ when: { flag: true }, set: { 'content.radius': 'R/one' } }, { when: { size: lg, mode: true }, set: { 'content.radius': 'R/pair' } }];
      t.value = JSON.stringify(c, null, 2); t.dispatchEvent(new Event('input')); })()`);
    await js(`document.querySelector('[data-json-apply]').click()`);
    await js(`${row('Flag')}.querySelector('[data-more]').click()`);
    await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find(b => b.textContent === 'Delete').click()`);
    await js(`document.querySelector('[data-view="anatomy"]').click()`);
    await selectPart('Content');
    await js(`document.querySelector('[data-views] [data-picker="Size"]').click()`);
    await js(`document.querySelector('.ce-picker__pop:popover-open [role=option][aria-selected="false"]').click()`);
    await js(`${insp('[data-choice="width-fill"]')}.click()`);
    await closePart();
    await js(`document.querySelector('[data-undo-button]').click()`);
    const v = (await json()).variants.map((x) => JSON.stringify(x.when));
    ok('a deleted prop\'s layers come back with Undo where they stood, before the pairs they drew under', v.indexOf('{"flag":true}') >= 0 && v.indexOf('{"flag":true}') < v.findIndex((w) => /"mode":true/.test(w)));
    await js(`document.querySelector('[data-view="props"]').click()`);
    await js(`(() => { const t = document.querySelector('[data-json]'); t.value = ${JSON.stringify(was)}; t.dispatchEvent(new Event('input')); })()`);
    await js(`document.querySelector('[data-json-apply]').click()`);
  }
  await js(`(() => { const t = document.querySelector('[data-json]'); const c = JSON.parse(t.value); c.props.size.type = 'colour'; c.anatomy['content/label'].content = '{nothing}'; t.value = JSON.stringify(c, null, 2); t.dispatchEvent(new Event('input')); })()`);
  await js(`document.querySelector('[data-json-apply]').click()`);
  ok('a contract with problems is refused, each said with where it is', /props\.size\.type/.test(await js(`document.querySelector('[data-json-errors]').textContent`)) && /anatomy\.content\/label\.content/.test(await js(`document.querySelector('[data-json-errors]').textContent`)));
  await js(`document.querySelector('[data-json-revert]').click()`);
  ok('Undo edits puts the page\'s JSON back', JSON.stringify(await json()) === JSON.stringify(c));

  // the JSON pane hides and comes back
  await js(`document.querySelector('[data-json-toggle]').click()`);
  ok('Preview, pressed again, hides the pane and the work takes its room', await js(`document.querySelector('#json-pane').hidden && document.querySelector('[data-json-toggle]').getAttribute('aria-expanded') === 'false'`));
  await js(`document.querySelector('[data-json-toggle]').click()`);

  // the draft survives a reload: the rows as shown, not only the JSON they write
  const rows = `JSON.stringify([...document.querySelectorAll('[data-list] > li')].map(li => li.querySelector('[data-edit]').textContent))`;
  const before2 = [JSON.stringify(await json()), await js(rows)];
  await navigate(tab, url);
  await waitFor(tab, `document.querySelectorAll('[data-list] > li').length > 0`);
  ok('a reload restores the draft exactly, the anatomy\'s links included', JSON.stringify(await json()) === before2[0] && await js(rows) === before2[1]);
  ok('a new component is a draft from its first edit, kept under its name, and still is after a reload', await js(`document.querySelector('[data-nav-list] [data-draft][aria-current]')?.dataset.draft === ${JSON.stringify((await json()).component || 'Untitled')}`));
  // a second tab: the draft open in both is one draft, each tab showing the other's edits, and each tab's page its own
  {
    const two = await attach(await newPage(browser.endpoint));
    await navigate(two, url);
    await waitFor(two, `document.querySelectorAll('[data-list] > li').length > 0`);
    const named = (t, v) => t.evaluate(`(() => { const f = document.querySelector('[data-component]'); f.value = ${JSON.stringify(v)}; f.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    const was = (await json()).component;
    const count = `JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /s$/.test(k) && Array.isArray(JSON.parse(localStorage.getItem(k) || 'null'))))).length`;
    const kept = await js(count);
    await named(two, was + ' Two');
    await waitFor(tab, `JSON.parse(document.querySelector('[data-json]').value).component === ${JSON.stringify(was + ' Two')}`, { timeout: 3000 }).catch(() => {});
    ok('a draft edited in another tab is shown here as it is now', (await json()).component === was + ' Two');
    await named(tab, was);
    await waitFor(two, `JSON.parse(document.querySelector('[data-json]').value).component === ${JSON.stringify(was)}`, { timeout: 3000 }).catch(() => {});
    ok('and an edit here is shown there, the one draft kept once', await two.evaluate(`JSON.parse(document.querySelector('[data-json]').value).component`) === was && await js(count) === kept);
    await two.evaluate(`document.querySelector('[data-new]').click()`);
    await named(two, 'Other Tab');
    const drafts = `JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /s$/.test(k) && Array.isArray(JSON.parse(localStorage.getItem(k) || 'null')))))`;
    if (connected) {
      // a library component edited there, not yet a draft, its page then written over by this tab's
      await two.evaluate(`document.querySelector('[data-open]').click()`);
      await named(two, 'Library Edit');
      await named(tab, was);
    }
    // the tab left (a close fires the same pagehide; CDP's close does not wait for it), then closed
    await navigate(two, 'about:blank');
    await two.send('Page.close').catch(() => {});
    if (connected) ok('a tab closed on library work another tab has written over keeps it as a draft', await js(`${drafts}.some(d => d.component === 'Library Edit')`));
    // the other tab's drafts gone again, so the checks after see one draft; its page stays the browser's last written
    await js(`(() => { const k = Object.keys(localStorage).find(k => /s$/.test(k) && Array.isArray(JSON.parse(localStorage.getItem(k) || 'null'))); localStorage.setItem(k, JSON.stringify(${drafts}.filter(d => d.component !== 'Other Tab' && d.component !== 'Library Edit'))); })()`);
    await navigate(tab, url);
    await waitFor(tab, `document.querySelector('[data-json]').value !== ''`);
    ok('a reload goes on with this tab\'s own page, never the one another tab wrote last', (await json()).component === was);
  }
  // the components: drafts on top, then the library's; leaving work asks to keep it as a draft or discard it
  ok('every modal is centred in the window', await js(`(() => { document.querySelector('[data-block="enum"]').click(); const r = document.querySelector('[data-dialog]').getBoundingClientRect(); const mid = Math.abs((r.top + r.bottom) / 2 - innerHeight / 2) < 2; document.querySelector('[data-dialog-cancel]').click(); return mid; })()`));
  ok('Components, at the bar\'s left edge, is open by default and shows the components sidebar', await js(`!document.querySelector('[data-nav]').hidden && document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded') === 'true' && document.querySelector('.ce-bar__side').contains(document.querySelector('[data-nav-toggle]'))`));
  // a change since the reload, so there is work to keep
  await js(`(() => { const f = document.querySelector('[data-component]'); f.value = 'Button draft'; f.dispatchEvent(new Event('input')); })()`);
  if (connected) {
    // a snapshot folder opened with --snapshot has no project to draw a new component into
    const bare = ARGV[ARGV.indexOf('--project') + 1] === 'snapshot';
    await js(`document.querySelector('[data-figma-menu]').click()`);
    ok(`Push to Figma, for a new component, is ${bare ? 'off for a snapshot folder' : 'on for a project'}`, await js(`[...document.querySelectorAll('#figma-menu button')].find(b => b.firstChild.textContent === 'Push to Figma').disabled`) === bare);
    if (bare) ok('and says why under it', /no project to draw into/.test(await js(`[...document.querySelectorAll('#figma-menu button')].find(b => b.firstChild.textContent === 'Push to Figma').textContent`)));
    await key('Escape');
  }
  const kept = await json();
  await js(`document.querySelector('[data-new]').click()`);
  ok('New component over it asks nothing: the work is kept already, renamed with it', !(await dialogOpen()) && (await js(`document.querySelectorAll('[data-nav-list] [data-draft]').length`)) === 1);

  ok('saved as a draft, the page is a new component and the draft heads the list', (await json()).component === '' && Object.keys((await json()).props).length === 0 && await js(`document.querySelector('[data-nav-list] [data-draft]').dataset.draft === ${JSON.stringify(kept.component)}`));
  await shot('6a-components');
  await js(`document.querySelector('[data-nav-list] [data-draft]').click()`);
  ok('opening the draft over an empty page asks nothing, brings the work back whole, and keeps the draft', !(await dialogOpen()) && JSON.stringify(await json()) === JSON.stringify(kept) && await js(`!!document.querySelector('[data-nav-list] [data-draft]')`));
  // the draft on the page, edited since it was opened, deleted from the sidebar: the page goes with it, and Undo brings
  // both back as they were at the delete, not as opened
  const applyJson = async (c) => { await js(`(() => { const t = document.querySelector('[data-json]'); t.value = ${JSON.stringify(JSON.stringify(c))}; t.dispatchEvent(new Event('input')); })()`); await js(`document.querySelector('[data-json-apply]').click()`); };
  const edited = structuredClone(kept); const flag = Object.values(edited.props).find((p) => p.type === 'boolean'); flag.default = !flag.default;
  await applyJson(edited);
  await js(`document.querySelector('[data-nav-list] [data-delete-draft]').click()`);
  ok('deleting the draft that is open clears the page to a new component', (await json()).component === '' && Object.keys((await json()).props).length === 0 && await js(`!document.querySelector('[data-nav-list] [data-draft]')`));
  await js(`document.querySelector('[data-undo-button]').click()`);
  ok('and Undo brings the draft back, open on the page, its edits since it was opened kept', JSON.stringify(await json()) === JSON.stringify(edited) && await js(`!!document.querySelector('[data-nav-list] [data-draft][aria-current]')`));
  await applyJson(kept);
  // a second new component given the first's name is a second draft: neither is written over the other
  await js(`document.querySelector('[data-new]').click()`);
  await js(`(() => { const f = document.querySelector('[data-component]'); f.value = ${JSON.stringify(kept.component)}; f.dispatchEvent(new Event('input')); })()`);
  ok('a new component named as a draft is a draft of its own, the first left as it was', await js(`document.querySelectorAll('[data-nav-list] [data-draft]').length`) === 2
    && await js(`JSON.parse(localStorage['contract-editor:drafts']).some((d) => d.component === ${JSON.stringify(kept.component)} && d.drafts.length === ${kept.props ? Object.keys(kept.props).length : 0})`));
  await js(`document.querySelector('[data-nav-list] [data-draft][aria-current]').parentElement.querySelector('[data-delete-draft]').click()`);
  await js(`document.querySelector('[data-nav-list] [data-draft]').click()`);
  ok('and deleting the second leaves the first, which opens whole', JSON.stringify(await json()) === JSON.stringify(kept) && await js(`document.querySelectorAll('[data-nav-list] [data-draft]').length`) === 1);
  // the Variants filter is the page's: another component on the page starts it again at the defaults
  await js(`document.querySelector('[data-view="variants"]').click()`);
  await lastAll();
  const filtered = !(await atDefaults());
  await js(`document.querySelector('[data-new]').click()`);
  await js(`document.querySelector('[data-view="variants"]').click()`);
  await js(`document.querySelector('[data-nav-list] [data-draft]').click()`);
  ok('another component opened on Variants shows its own combinations, its defaults chosen', filtered && await atDefaults());
  await js(`document.querySelector('[data-view="props"]').click()`);
  if (connected) {
    // the first the sidebar lists with props of its own: a library may hold components with none
    const label = ARGV[ARGV.indexOf('--project') + 1];
    const withProps = new Set((await (await fetch(url + 'project.json?label=' + label)).json()).contracts.filter((c) => Object.keys(c.props || {}).length).map((c) => c.component));
    const name = await js(`[...document.querySelectorAll('[data-nav-list] [data-open]')].map((b) => b.dataset.open).find((n) => ${JSON.stringify([...withProps])}.includes(n))`);
    await js(`[...document.querySelectorAll('[data-nav-list] [data-open]')].find((b) => b.dataset.open === ${JSON.stringify(name)}).click()`);
    ok('opening a library component over unchanged work asks nothing, and lists no draft of it', !(await dialogOpen()) && (await json()).component === name && !(await js(`[...document.querySelectorAll('[data-nav-list] [data-draft]')].some((b) => b.dataset.draft === ${JSON.stringify(name)})`)));
    // a library component opens to be read, as Dev Mode shows it: nothing to add from, drag, act on or rename
    ok('a library component opens read-only: no palette, no handles or row menus, its name not to change, Edit as draft offered', await js(`document.querySelector('.ce').hasAttribute('data-read-only') && !document.querySelector('.ce-palette').checkVisibility() && !document.querySelector('[data-list] :is([data-handle], [data-more])') && document.querySelector('[data-component]').readOnly && document.querySelector('[data-component]').tabIndex === -1 && document.querySelector('[data-json]').readOnly && !document.querySelector('[data-edit-draft]').hidden`));
    // where the team reads it: its docs page, where the project's site is built and lists it (serve.mjs docsOf)
    const docs = (await (await fetch(url + 'project.json?label=' + label)).json()).docs;
    const page = docs && docs.pages[name];
    ok('a component being read links to its docs page, where the site has one', await js(`(() => { const a = document.querySelector('[data-docs]'); return ${JSON.stringify(page ? docs.url + page : null)} ? !a.hidden && a.href === ${JSON.stringify(page ? docs.url + page : '')} : a.hidden; })()`));
    await js(`document.querySelector('[data-figma-menu]').click()`);
    ok('a component being read offers Pull from Figma, nothing to propose', await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].map((b) => b.textContent).join('|')`) === 'Pull from Figma');
    await js(`document.querySelector('.ce-menu:popover-open').hidePopover()`);
    await js(`document.querySelector('[data-list] [data-edit]').click()`);
    ok('a prop opens to be read: a label and its value a row, Close and no Save', await dialogOpen() && await js(`document.querySelectorAll('[data-dialog] .ce-inspect dt').length > 1 && document.querySelector('[data-dialog-save]').hidden && document.querySelector('[data-dialog-cancel]').textContent === 'Close' && !document.querySelector('[data-dialog-body] input')`));
    await js(`document.querySelector('[data-dialog-cancel]').click()`);
    await js(`document.querySelector('[data-view="anatomy"]').click()`);
    await js(`document.querySelector('[data-parts] [data-uid="root"] [data-edit]').click()`);
    ok('its parts open to be read: their look and place as text, nothing to add, move or delete', await js(`!!document.querySelector('[data-inspector] [data-from-figma]') && !document.querySelector('[data-inspector] [data-name]:not(:disabled)') && !document.querySelector('[data-part-dialog] :is([data-add-inside], [data-move], [data-delete-part])')`));
    await js(`document.querySelector('[data-part-done]').click()`);
    await js(`document.querySelector('[data-view="props"]').click()`);
    await js(`document.querySelector('[data-edit-draft]').click()`);
    ok('Edit as draft makes it a draft, listed, the page its to change', await js(`!document.querySelector('.ce').hasAttribute('data-read-only') && document.querySelector('[data-edit-draft]').hidden && document.querySelector('[data-docs]').hidden && !document.querySelector('[data-component]').readOnly && !!document.querySelector('[data-list] [data-handle]') && [...document.querySelectorAll('[data-nav-list] [data-draft]')].some((b) => b.textContent === ${JSON.stringify(name)})`));
    // its JSON applied as it is, rewritten: read back, the drawing it came from checked and kept
    await js(`(() => { const t = document.querySelector('[data-json]'); t.value = JSON.stringify(JSON.parse(t.value)); t.dispatchEvent(new Event('input')); })()`);
    await js(`document.querySelector('[data-json-apply]').click()`);
    ok('a library component\'s JSON applies', /^Applied/.test(await js(`new Promise(r => requestAnimationFrame(() => r(document.querySelector('[data-status]').textContent)))`)) && (await json()).component === name);
    // one of the project's icons placed: drawn at a size it has, coloured by its glyph, never hugged
    {
      const icons = (await (await fetch(url + 'project.json?label=' + label)).json()).icons || [];
      await js(`document.querySelector('[data-view="anatomy"]').click()`);
      await js(`document.querySelector('[data-part-block="instance"]').click()`);
      await setPartName('Mark');
      await js(`${insp('[data-picker="Component"]')}.click()`);
      const icon = await js(`(() => { const has = ${JSON.stringify(icons)}; const o = [...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].find((o) => has.some((f) => f.startsWith(o.dataset.value.split('/').pop() + '-') && /^\\d+$/.test(f.slice(o.dataset.value.split('/').pop().length + 1)))); if (o) o.click(); return o ? o.dataset.value : null; })()`);
      ok('the project has an icon to place, a fixture of these checks', !!icon);
      ok('an icon offers the sizes it is drawn at, and no Fit, Fill or Fixed', await js(`!!document.querySelector('[data-inspector] [data-choice^="icon-size-"]') && !document.querySelector('[data-inspector] [data-choice="width-hug"]')`));
      ok('and a colour', await js(`[...document.querySelectorAll('[data-inspector] [data-picker]')].some((b) => b.dataset.picker === 'Colour')`));
      await js(`${insp('[data-picker="Colour"]')}.click()`);
      const colour = await js(`(() => { const o = document.querySelector('.ce-picker__pop:popover-open [role=option]'); o.click(); return o.dataset.value; })()`);
      const c = await json();
      const at = Object.keys(c.anatomy).find((k) => c.anatomy[k].component === icon);
      ok('an icon placed is written at its first size, its colour on its glyph inside it, as a snapshot records it',
        !!at && c.anatomy[at].width === c.anatomy[at].height && c.anatomy[at].with.Size === String(c.anatomy[at].width) && c.anatomy[`${at}/icon`] && c.anatomy[`${at}/icon`].parent === at && typeof c.anatomy[`${at}/icon`].background === 'string' && !!colour);
      // the library's own again, the placed icon discarded
      await js(`document.querySelector('[data-view="props"]').click()`);
      await js(`[...document.querySelectorAll('[data-nav-list] [data-open]')].find((b) => b.dataset.open === ${JSON.stringify(name)}).click()`);
      if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
      ok('and discarded, the component is the library\'s again', !Object.values((await json()).anatomy).some((e) => e.component === icon));
    }
    // a library component's preview draws its placed components with their values, and the project's icons
    if (fixtures) {
      // a fixture of the sample library this mode is run against: its absence fails, never skips
      ok('the library has Nav panel, a fixture of these checks', await js(`!!document.querySelector('[data-nav-list] [data-open="Nav panel"]')`));
      {
        await js(`document.querySelector('[data-nav-list] [data-open="Nav panel"]').click()`);
        await js(`document.querySelector('[data-out-tab="preview"]').click()`);
        // (a word of the library's own went with a later snapshot of it: what is held is that no placed component is left a box)
        ok('a placed component is drawn from its own contract, an icon from the project\'s SVGs', await js(`(() => { const lib = new Set([...document.querySelectorAll('[data-nav-list] [data-open]')].map((b) => b.dataset.open)); return !!document.querySelector('[data-out="preview"] .ce-pv--glyph') && document.querySelectorAll('[data-out="preview"] .ce-pv').length > 20 && ![...document.querySelectorAll('[data-out="preview"] .ce-pv--instance')].some((e) => lib.has(e.title)); })()`));
        ok('an icon\'s glyph fills its box, not pushed under it by the line around it', await js(`[...document.querySelectorAll('.ce-stage .ce-pv--glyph')].every((g) => { const a = g.getBoundingClientRect(), b = g.parentElement.getBoundingClientRect(); return Math.abs(a.top - b.top) < 1 && Math.abs(a.bottom - b.bottom) < 1; }) && document.querySelectorAll('.ce-stage .ce-pv--glyph').length > 0`));
        await shot('6b-sidebar');
        await js(`document.querySelector('[data-out-tab="json"]').click()`);
        // a placed component's own props set this instance's values: the first part of Nav panel's tree that is a library
        // component with an option or words of its own, whichever the snapshot holds now
        const own = (name) => { const c = lib.find((x) => x.component === name); return c ? fromContract(c).drafts.filter((d) => d.role !== 'interaction' && d.only !== 'code' && (d.type === 'string' || (d.type === 'enum' && d.values.length > 1))) : []; };
        const panel = lib.find((c) => c.component === 'Nav panel').anatomy;
        const [placedId, placed] = Object.entries(panel).find(([k, e]) => e.kind === 'instance' && own(e.component).length && !k.split('/').slice(1).some((_, i, a) => (panel[k.split('/').slice(0, i + 1).join('/')] || {}).kind === 'instance')) || [];
        ok('Nav panel places a library component with props of its own, a fixture of these checks', !!placed);
        const prop = own(placed.component)[0];
        await js(`document.querySelector('[data-view="anatomy"]').click()`);
        ok('a library component opens one level deep: its parts inside containers folded away', await js(`![...document.querySelectorAll('[data-parts] .ce-row__name')].some(n => n.textContent === ${JSON.stringify(panel[placedId].name ?? partName(placedId))}) && document.querySelector('[data-fold-all]').textContent === 'Expand all'`));
        await js(`document.querySelector('[data-fold-all]').click()`);
        await selectPart(panel[placedId].name ?? partName(placedId));
        ok('an instance of a library component lists that component\'s props among its rows', await js(`[...document.querySelectorAll('[data-inspector] .ce-field > span:first-child')].some((x) => x.textContent === ${JSON.stringify(prop.name)})`));
        ok('a part Figma has drawn shows its look, its instance values included, read-only and said to be Figma\'s', await js(`(() => { const g = document.querySelector('[data-inspector] [data-from-figma]'); const i = [...g.querySelectorAll('.ce-field')].find(f => f.firstElementChild.textContent === ${JSON.stringify(prop.name)})?.querySelector('input, button'); return g.disabled && !!i && i.matches(':disabled') && /Figma/.test(g.textContent); })()`));
        ok('and reads as an inspect list: values as text, no control chrome or chevrons, nothing unset', await js(`(() => { const g = document.querySelector('[data-inspector] [data-from-figma]'); return [...g.querySelectorAll('.ce-picker')].every((b) => getComputedStyle(b).borderTopColor === 'rgba(0, 0, 0, 0)') && ![...g.querySelectorAll('.ce-picker__chevron, .ce-picker__name--none')].some((x) => x.checkVisibility()); })()`));
        await closePart();
        await js(`document.querySelector('[data-edit-draft]').click()`);
        await js(`document.querySelector('[data-view="anatomy"]').click()`);
        await selectPart(panel[placedId].name ?? partName(placedId));
        ok('in a draft its links to props and its look are the draft\'s to edit, nothing locked as Figma\'s', await js(`!document.querySelector('[data-inspector] [data-name]').matches(':disabled') && !document.querySelector('[data-inspector] [data-from-figma]:disabled')`));
        // a part added here is not drawn yet: its look, and a placed component's values, are the contract's
        await js(`document.querySelector('[data-parts] [data-uid="root"] [data-edit]').click()`);
        await js(`document.querySelector('[data-part-block="instance"]').click()`);
        await setPartName('Extra placed');
        await js(`${insp('[data-picker="Component"]')}.click()`);
        await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].find((o) => o.textContent === ${JSON.stringify(placed.component)}).click()`);
        ok('a new part shows no From Figma group', !(await js(`!!document.querySelector('[data-inspector] [data-from-figma]')`)));
        const value = prop.type === 'string' ? 'AC' : prop.values[prop.values.length - 1];
        if (prop.type === 'string') await js(`(() => { const i = [...document.querySelectorAll('[data-inspector] .ce-field')].find(f => f.firstElementChild.textContent === ${JSON.stringify(prop.name)}).querySelector('input'); i.value = 'AC'; i.dispatchEvent(new Event('input')); })()`);
        else await pickIn(prop.name, value);
        ok('a value set on a new instance is its with, in the contract', (await json()).anatomy.extraPlaced.with[prop.name] === value);
        await js(`document.querySelector('[data-view="props"]').click()`);
      }
      // the parts only some variants draw, and what each variant changes
      // a fixture of the sample library this mode is run against: its absence fails, never skips
      ok('the library has Button, a fixture of these checks', await js(`!!document.querySelector('[data-nav-list] [data-open="Button"]')`));
      {
        await js(`document.querySelector('[data-nav-list] [data-open="Button"]').click()`);
        if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
        // a row says only what its kind does not: no "False by default", no "Interaction states:" again, no "Default:"
        const said = await js(`[...document.querySelectorAll('[data-list] .ce-row__summary')].map((x) => x.textContent).join('|')`);
        ok('a prop row says only what its kind does not', !/False by default|a property in Figma|Interaction states:|Default:/.test(said) && /\(default\)/.test(said));
        await js(`document.querySelector('[data-code-menu]').click()`);
        ok('a library component being read offers nothing to propose to its code, as to Figma', await js(`[...document.querySelectorAll('#code-menu button')].every((b) => !/Propose|Push/.test(b.textContent))`));
        await js(`document.querySelector('#code-menu').hidePopover()`);
        await js(`document.querySelector('[data-view="anatomy"]').click()`);
        await expandAll();
        await shot('9-variant-only');
        ok('a part only some variants draw is a row in the tree, its chip saying where (Only in …), the condition on hover', await js(`(() => { const g = [...document.querySelectorAll('[data-parts] [data-ghost]')]; return g.length > 0 && g.every((r) => /^Only in /.test(r.querySelector('.ce-cond [aria-hidden]')?.textContent) && /when/.test(r.querySelector('.ce-cond').title)) && !g.some((r) => r.querySelector('[data-part-handle]')); })()`));
        const ghost = await js(`document.querySelector('[data-parts] [data-ghost]').dataset.ghost`);
        ok('the stage draws the default variant alone, not the parts only other variants add', !(await js(`!!document.querySelector('[data-stage] [data-pv="at:${ghost}"]')`)));
        await js(`document.querySelector('[data-parts] [data-ghost] [data-edit]').click()`);
        ok('chosen, such a part is drawn and outlined, the stage at the values that draw it', await js(`!!document.querySelector('[data-stage] [data-pv="at:${ghost}"][data-selected]') && !!document.querySelector('[data-view-default]')`));
        // a state's dim is said by its token and its value, in Variants: Button's label at Loading
        await js(`document.querySelector('[data-view="variants"]').click()`);
        await js(`[...document.querySelectorAll('[data-variants] button[data-combo]')].find((b) => JSON.parse(b.dataset.combo).state === 'loading').click()`);
        ok('Variants says a number token with its value (Loading/opacity 0)', await js(`[...document.querySelectorAll('[data-variants] [data-change]')].some((r) => /opacity\\s*\\d/.test(r.textContent.replace(/\\u200b/g, '')))`));
        // an undo belongs to its page: another component opened takes it away
        await js(`document.querySelector('[data-view="props"]').click()`);
        await js(`document.querySelector('[data-edit-draft]').click()`);
        await js(`${row('Disabled')}.querySelector('[data-more]').click()`);
        await js(`[...document.querySelector('.ce-menu:popover-open').querySelectorAll('button')].find(b => b.textContent === 'Delete').click()`);
        ok('a deletion offers Undo, with a close beside it and no timer', await js(`!document.querySelector('[data-undo]').hidden && !!document.querySelector('[data-undo-close]')`));
        await js(`document.querySelector('[data-nav-list] [data-open="Badge"]').click()`);
        if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
        ok('opening another component takes the undo away, so it cannot land on the wrong page', await js(`document.querySelector('[data-undo]').hidden`) && (await json()).component === 'Badge');
        // a library component with no props is read, not started: no drop target, nothing to add
        await js(`document.querySelector('[data-nav-list] [data-open="Graphic/bubble"]').click()`);
        if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
        ok('a library component with no props says it has none, unoutlined, and Variants that it has one look, with no action', await js(`(() => { const e = document.querySelector('[data-empty]'); return /No props/.test(e.textContent) && getComputedStyle(e).borderStyle === 'none'; })()`)
          && await js(`(() => { document.querySelector('[data-view="variants"]').click(); const e = document.querySelector('[data-variants] > .ce-empty'); return /One look/.test(e?.textContent) && !e.querySelector('button'); })()`));
        await js(`document.querySelector('[data-view="props"]').click()`);
        await js(`document.querySelector('[data-nav-list] [data-open="Button"]').click()`);
        if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
        await js(`document.querySelector('[data-view="variants"]').click()`);
        // the grid starts at the defaults, which change nothing; another cell lists what it changes
        ok('the grid starts at the defaults, which change nothing, with the palette\'s room, Preview there to open as on any tab', await atDefaults() && await js(`document.querySelectorAll('[data-variants] [data-change]').length === 0 && !document.querySelector('.ce-palette').checkVisibility() && !document.querySelector('[data-json-toggle]').disabled && document.querySelector('#json-pane').hidden === (document.querySelector('[data-json-toggle]').getAttribute('aria-expanded') === 'false')`));
        ok('the grid and its changes fill the tab\'s height, the gap between them all round them too', await js(`(() => { const w = document.querySelector('.ce-props').getBoundingClientRect(); const [g, c] = [...document.querySelectorAll('[data-variants] > .ce-vcard')].map((x) => x.getBoundingClientRect());
          const pad = g.left - w.left; return Math.abs(g.bottom - c.bottom) < 1 && Math.abs(w.bottom - g.bottom - pad) < 1 && Math.abs(c.left - g.right - pad) < 1 && Math.abs(w.right - c.right - pad) < 1; })()`));
        ok('at the defaults the changes say how to see one, a heading and a sentence, centred in their card', await js(`/Pick a combination/.test(document.querySelector('.ce-vchanges .ce-empty h3')?.textContent)`));
        ok('the work column stays where it is from Props to Variants', await js(`(() => { const x = () => document.querySelector('[data-component]').getBoundingClientRect().left; document.querySelector('[data-view="props"]').click(); const a = x(); document.querySelector('[data-view="variants"]').click(); return Math.abs(x() - a) < 1; })()`));
        await lastAll();
        ok('another cell lists what its values change, and is the one chosen', await js(`document.querySelectorAll('[data-variants] [data-change]').length > 0 && [...document.querySelectorAll('[data-variants] button[data-combo]')].pop().getAttribute('aria-pressed') === 'true' && document.activeElement === [...document.querySelectorAll('[data-variants] button[data-combo]')].pop()`));
        await js(`(() => { const c = JSON.parse(document.querySelector('[data-json]').value); [...document.querySelectorAll('[data-variants] button[data-combo]')].find((b) => Object.entries(JSON.parse(b.dataset.combo)).every(([k, v]) => v === (c.props[k].default ?? (c.props[k].type === 'boolean' ? false : c.props[k].values[0])))).click(); })()`);
        ok('back to the defaults\' cell, back to nothing changed', await js(`document.querySelectorAll('[data-variants] [data-change]').length`) === 0 && await atDefaults());
        await lastAll();
        ok('the changes are one list beside the grid, named by the cell\'s values, and say parts by name, not path', await js(`document.querySelectorAll('[data-variants] h3').length === 2 && / is /.test(document.querySelector('.ce-vchanges h3').textContent) && ![...document.querySelectorAll('[data-variants] .ce-vtable tbody td:first-of-type')].some((w) => /[a-z][A-Za-z0-9]*\\/[a-z]/.test(w.textContent))`));
        ok('the Variants tab never prints null', await js(`!/null/.test(document.querySelector('[data-variants]').textContent)`));
        ok('every combination is a cell of the grid, a dot where Figma draws it, a cross where it does not', await js(`(() => { const t = document.querySelector('[data-variants] .ce-vgrid table'); if (!t) return false; const cols = t.querySelectorAll('thead tr:last-child th').length;
          return t.querySelectorAll('tbody td').length === t.querySelectorAll('tbody tr').length * cols && t.querySelectorAll('tbody td').length === t.querySelectorAll('button[data-combo], .ce-vgrid__not').length && !!t.querySelector('.ce-vgrid__not') && !/ is /.test(t.textContent); })()`));
        ok('a setting changed alone is named in its row (border colour), never one key line in each cell', await js(`[...document.querySelectorAll('[data-variants] [data-change]')].every((r) => r.cells.length < 3 || r.cells[2].querySelectorAll('.ce-vtable__line').length !== 1)`));
        ok('a fact a row: the part, its default and what it is here, a part added or removed Absent or Present', await js(`[...document.querySelectorAll('[data-variants] [data-change]')].every((r) => r.querySelectorAll('td').length === 3 && (!r.matches('.ce-vtable__added, .ce-vtable__removed') || /^(Absent|Present)$/.test(r.cells[1].textContent))) && [...document.querySelectorAll('.ce-vtable thead th')].map((t) => t.textContent).join('|') === 'Part|Default|Here'`));
        ok('the matrix wider than the changes beside it, its columns one width, scrolling inside its box', await js(`(() => { const g = document.querySelector('.ce-vgrid').getBoundingClientRect(), c = document.querySelector('.ce-vchanges').getBoundingClientRect(), s = document.querySelector('.ce-vgrid__scroll'); const w = [...document.querySelectorAll('.ce-vgrid__table thead th[data-col]')].map((t) => Math.round(t.getBoundingClientRect().width)); return g.width > c.width && new Set(w).size === 1 && Math.abs(g.top - c.top) < 1 && getComputedStyle(s).overflowY === 'auto' && s.getBoundingClientRect().bottom <= innerHeight; })()`));
        ok('the Variants tab lists what each value changes, and the combinations not drawn', await js(`document.querySelectorAll('[data-variants] [data-change]').length > 0 && /not drawn/.test(document.querySelector('[data-variants] .ce-vgrid h3').textContent)`) && /tab=variants/.test(await js(`location.search`)));
        await js(`document.querySelector('[data-view="props"]').click()`);
      }
      // sync: a component the library has is proposed, never pushed; a new one is drawn in a scratch file or handed to the build skill
      // a fixture of the sample library this mode is run against: its absence fails, never skips
      ok('the library has Badge, a fixture of these checks', await js(`!!document.querySelector('[data-nav-list] [data-open="Badge"]')`));
      {
        await js(`document.querySelector('[data-nav-list] [data-open="Badge"]').click()`);
        if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
        await js(`document.querySelector('[data-edit-draft]').click()`);
        await js(`document.querySelector('[data-figma-menu]').click()`);
        ok('a linked draft\'s Figma menu offers Pull, Push as new and Update the library component', await js(`[...document.querySelectorAll('#figma-menu:popover-open button')].map(b => b.textContent).join('|')`) === 'Pull from Figma|Push as new component|Update the library component…');
        await key('Escape');
        // a draft not linked that bears a library component's name (as Pull from code opens one) is proposed, never pushed
        await js(`document.querySelector('[data-new]').click()`);
        if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
        await js(`(() => { const f = document.querySelector('[data-component]'); f.value = 'Badge'; f.dispatchEvent(new Event('input')); })()`);
        await js(`document.querySelector('[data-figma-menu]').click()`);
        ok('an unlinked draft of a component the library has offers Pull and Propose', await js(`[...document.querySelectorAll('#figma-menu:popover-open button')].map(b => b.textContent).join('|')`) === 'Pull from Figma|Propose to Figma');
        await js(`[...document.querySelectorAll('#figma-menu button')].find(b => b.firstChild.textContent === 'Propose to Figma').click()`);
        ok('proposing downloads the change for review', /Downloaded badge\.proposal\.json/.test(await js(`new Promise(r => requestAnimationFrame(() => r(document.querySelector('[data-status]').textContent)))`)));
        await js(`document.querySelector('[data-code-menu]').click()`);
        const states = (await (await fetch(url + 'project.json?label=' + ARGV[ARGV.indexOf('--project') + 1])).json()).hasCode;
        ok('Pull from code is offered only where the project states its code', (await js(`[...document.querySelectorAll('#code-menu button')].find(b => b.firstChild.textContent === 'Pull from code').disabled`)) === !states);
        await key('Escape');
        // a run the server is doing: in sight only past a second, the menus offering no other until it ends, then gone
        await js(`(() => { const f = window.fetch; window.__fetch = f; window.fetch = (u, o) => (String(u) === 'sync' ? new Promise((r) => { window.__release = () => r(new Response(JSON.stringify({ ok: false, output: 'held by the test' }))); }) : f(u, o)); })()`);
        await js(`document.querySelector('[data-figma-menu]').click()`);
        await js(`[...document.querySelectorAll('#figma-menu button')].find(b => b.firstChild.textContent === 'Pull from Figma').click()`);
        ok('a run is not shown at once, so a quick one does not flash', await js(`document.querySelector('[data-busy]').hidden`));
        await new Promise((r) => setTimeout(r, 1300));
        ok('past a second it is, with how long it has taken', await js(`!document.querySelector('[data-busy]').hidden && /Reading the snapshot again… \\d+ s/.test(document.querySelector('[data-busy-text]').textContent)`));
        await js(`document.querySelector('[data-figma-menu]').click()`);
        ok('while it runs the menus offer no other run, and say why', await js(`[...document.querySelectorAll('#figma-menu button')].every((b) => b.disabled && /Wait: Reading the snapshot again/.test(b.textContent))`));
        await key('Escape');
        await js(`window.__release(); window.fetch = window.__fetch;`);
        await new Promise((r) => setTimeout(r, 700));
        ok('ended, it goes, and what the run said is shown', await js(`document.querySelector('[data-busy]').hidden`) && /held by the test/.test(await js(`document.querySelector('[data-dialog] [data-sync-output]')?.textContent || ''`)));
        await js(`${inDialog('[data-dialog-save]')}.click()`);
        await js(`document.querySelector('[data-new]').click()`);
        if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
        await js(`(() => { const f = document.querySelector('[data-component]'); f.value = 'Fresh tag'; f.dispatchEvent(new Event('input')); })()`);
        await js(`document.querySelector('[data-figma-menu]').click()`);
        ok('a new component has nothing in Figma to pull, and the item says so', await js(`(() => { const b = [...document.querySelectorAll('#figma-menu button')].find(b => b.firstChild.textContent === 'Pull from Figma'); return b.disabled && /Not one of the library/.test(b.textContent); })()`));
        await js(`[...document.querySelectorAll('#figma-menu button')].find(b => b.firstChild.textContent === 'Push to Figma').click()`);
        ok('a component with no parts is not pushed: there is nothing to draw, and it says so', /no parts/.test(await js(`document.querySelector('[data-dialog] [data-sync-output]').textContent`)));
        await js(`${inDialog('[data-dialog-save]')}.click()`);
        await js(`document.querySelector('[data-view="anatomy"]').click()`);
        await expandAll();
        await js(`document.querySelector('[data-part-block="text"]').click()`);
        await setPartName('Label');
        await js(`(() => { const f = ${insp('[data-fixed-text]')}; f.value = 'Tag'; f.dispatchEvent(new Event('input')); })()`);
        await closePart();
        await js(`document.querySelector('[data-view="props"]').click()`);
        await js(`document.querySelector('[data-figma-menu]').click()`);
        await js(`[...document.querySelectorAll('#figma-menu button')].find(b => b.firstChild.textContent === 'Push to Figma').click()`);
        await js(`(() => { const i = ${inDialog('[data-scratch]')}; i.value = 'not a key'; i.dispatchEvent(new Event('input')); })()`);
        await save();
        ok('a new component is drawn only into a scratch file named by its key', await dialogOpen() && /not a Figma file link or key/.test(await js(`document.querySelector('[data-dialog] [data-field-error]').textContent`)));
        ok('with no scratch file set, Push opens Settings, which says where it keeps them', /Settings/.test(await js(`document.querySelector('[data-dialog-title]').textContent`)) && /context document|this browser/.test(await js(`document.querySelector('[data-dialog] .ce-hint').textContent`)));
        ok('a project keeps them in its context document, the source of truth among them', /context document/.test(await js(`document.querySelector('[data-dialog] .ce-hint').textContent`)) && await js(`!!document.querySelector('[data-dialog] [data-choice^="source-"]')`));
        await js(`(() => { const i = ${inDialog('[data-scratch]')}; i.value = ''; i.dispatchEvent(new Event('input')); })()`);
        await save();
        ok('and does not draw until one is named', await dialogOpen() && /Name the scratch file/.test(await js(`document.querySelector('[data-dialog] [data-field-error]').textContent`)));
        await js(`${inDialog('[data-dialog-cancel]')}.click()`);
        await js(`document.querySelector('[data-code-menu]').click()`);
        // the stylesheet is written by to-code (test-serve.mjs); held here, so a run on a real project writes nothing into its repo
        await js(`(() => { const f = window.fetch; window.__fetch = f; window.__asked = []; window.fetch = (u, o) => { if (String(u) !== 'sync') return f(u, o); window.__asked.push(JSON.parse(o.body).action); return Promise.resolve(new Response(JSON.stringify({ ok: true, output: 'held by the test' }))); }; })()`);
        await js(`[...document.querySelectorAll('#code-menu button')].find(b => b.firstChild.textContent === 'Push to code').click()`);
        await js(`new Promise(r => setTimeout(r, 50))`);
        ok('Push to code asks for the stylesheet only where the repo names a styles folder', (await js(`JSON.stringify(window.__asked)`)) === ((await js(`fetch('project.json${connected ? `?label=${ARGV[ARGV.indexOf('--project') + 1]}` : ''}').then(r => r.json()).then(f => !!(f.code && f.code.styles))`)) ? '["push-code"]' : '[]'));
        await js(`window.fetch = window.__fetch;`);
        ok('a new component goes to code as a brief for the build skill', /Downloaded fresh-tag\.build\.md/.test(await js(`new Promise(r => requestAnimationFrame(() => r(document.querySelector('[data-status]').textContent)))`)));
        ok('the sync endpoint refuses a request that is not from the page', (await fetch(url + 'sync', { method: 'POST', body: '{}' })).status === 403
          && (await fetch(url + 'sync', { method: 'POST', body: '{}', headers: { Origin: 'http://evil.example' } })).status === 403);
      }
      // a library prop with a problem says what it is on its row
      // the work changed above is discarded on the way
      // the library's first component with an option of one value, whichever its snapshot holds now
      const open = (name) => js(`(() => { const b = document.querySelector('[data-nav-list] [data-open=${JSON.stringify(JSON.stringify(name)).slice(1, -1)}]'); if (b) b.click(); if (document.querySelector('[data-dialog]').open) document.querySelector('[data-dialog-delete]').click(); return !!b; })()`);
      const one = (lib.find((c) => Object.values(c.props || {}).some((p) => p.type === 'enum' && (p.values || []).length < 2)) || {}).component;
      ok('the library has a component with an option of one value, a fixture of these checks', !!one && await open(one));
      ok('a row with a problem says which in place of its summary', /needs at least two options/.test(await js(`document.querySelector('[data-list] [data-invalid] .ce-row__summary').textContent`)));
      ok('the library has Search input, a fixture of these checks', await open('Search input'));
      {
        await js(`document.querySelector('[data-edit-draft]').click()`);
        await js(`document.querySelector('[data-view="anatomy"]').click()`);
        await expandAll();
        // its first placed component that draws layers of its own, whichever the snapshot holds now
        const search = lib.find((c) => c.component === 'Search input').anatomy;
        const [placedAt, placedHere] = Object.entries(search).find(([k, e]) => e.kind === 'instance' && Object.keys(search).some((x) => x.startsWith(k + '/'))) || [];
        ok('Search input places a component that draws layers of its own, a fixture of these checks', !!placedHere);
        const inner = Object.keys(search).filter((x) => x.startsWith(placedAt + '/')).map((x) => search[x].name ?? partName(x));
        ok('an instance\'s own layers are not listed as parts of this component', !(await js(`[...document.querySelectorAll('[data-parts] .ce-row__name')].some(n => ${JSON.stringify(inner)}.includes(n.textContent))`)));
        await selectPart(search[placedAt].name ?? partName(placedAt));
        await js(`${insp('[data-picker="Component"]')}.click()`);
        ok('an instance picks its component from the library\'s, its own among them', await js(`(() => { const o = [...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].map(o => o.dataset.value); return o.length > 5 && o.includes(${JSON.stringify(placedHere.component)}); })()`));
        await key('Escape');
        await js(`document.querySelector('[data-view="props"]').click()`);
      }
    }
    // opened from the Anatomy tab, the name follows too
    await js(`document.querySelector('[data-view="anatomy"]').click()`);
    await expandAll();
    const second = await js(`document.querySelectorAll('[data-nav-list] [data-open]')[1].dataset.open`);
    await js(`document.querySelectorAll('[data-nav-list] [data-open]')[1].click()`);
    ok('opening another while on Anatomy shows its name in the Component field', await js(`document.querySelector('[data-component]').value`) === second);
    await js(`document.querySelector('[data-view="props"]').click()`);
    await js(`[...document.querySelectorAll('[data-nav-list] [data-open]')].find(b => b.dataset.open === ${JSON.stringify(name)}).click()`);
    ok('it puts its props on the page and is marked current', Object.keys((await json()).props).length > 0 && await js(`document.querySelector('[data-nav-list] [aria-current]').dataset.open === ${JSON.stringify(name)}`));
    // a library component is read-only: leaving it never asks to keep or discard it, even where the page's memory of
    // what was opened is older than the page (a reload after the editor changed)
    await js(`sessionStorage.setItem('contract-editor:draft:opened', '{}')`);
    await navigate(tab, await js('location.href'));
    await waitFor(tab, `document.querySelector('[data-nav-list] [aria-current]')?.dataset.open === ${JSON.stringify(name)}`);
    await js(`document.querySelectorAll('[data-nav-list] [data-open]')[1].click()`);
    ok('leaving a read-only library component asks nothing', await js(`!document.querySelector('[data-dialog]').open`));
    // but work begun from one, whose draft another tab discarded while this one was closed, is work: after a reload
    // it stays editable, and leaving keeps it
    await js(`document.querySelector('[data-edit-draft]').click()`);
    await js(`(() => { const f = document.querySelector('[data-component]'); f.value = f.value + ' Orphan'; f.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    // discarded once the page is gone (a page going keeps its draft): from another page of the editor's origin
    const back = await js('location.href');
    await navigate(tab, new URL('editor.css', back).href);
    await js(`localStorage.removeItem('contract-editor:drafts')`);
    await navigate(tab, back);
    await waitFor(tab, `document.querySelector('[data-component]')?.value.endsWith(' Orphan')`);
    ok('after the reload that work is editable, not read', await js(`!document.querySelector('[data-component]').readOnly`));
    await js(`document.querySelectorAll('[data-nav-list] [data-open]')[0].click()`);
    ok('work whose draft went while the tab was closed is not lost on leaving: it is kept as a draft', await js(`!!document.querySelector('[data-nav-list] [data-draft="_Label Orphan"], [data-nav-list] [data-draft$=" Orphan"]')`));
    await js(`document.querySelector('[data-view="props"]').click()`);
  } else {
    ok('with no library, the sidebar holds the drafts alone', await js(`!document.querySelector('[data-nav-list] [data-open]') && !!document.querySelector('[data-nav-list] [data-draft]')`));
    // with no project there is nowhere to keep settings: Settings makes one (made for real in test-serve.mjs)
    await js(`document.querySelector('[data-settings]').click()`);
    await waitFor(tab, `/Create a project/.test(document.querySelector('[data-dialog-title]').textContent)`);
    ok('with no project, Settings offers to make one, asking its name, its library and the id the plugin prints',
      /Create a project/.test(await js(`document.querySelector('[data-dialog-title]').textContent`)) && await js(`['project', 'library', 'id'].every((f) => !!document.querySelector('[data-dialog] [data-field="' + f + '"]'))`));
    await js(`(() => { const i = ${inDialog('[data-field="project"]')}; i.value = 'Not A Label'; i.dispatchEvent(new Event('input')); })()`);
    await save();
    const said = () => waitFor(tab, `/Project not made/.test(document.querySelector('[data-dialog-title]').textContent)`).then(() => js(`document.querySelector('[data-dialog] [data-sync-output]').textContent`));
    ok('and makes none from a name that is no label, saying why in the registry\'s words', /lower case/.test(await said()));
    await js(`${inDialog('[data-dialog-save]')}.click()`);
    await js(`document.querySelector('[data-settings]').click()`);
    await waitFor(tab, `!!document.querySelector('[data-dialog] [data-field="library"]')`);
    await js(`(() => { const set = (f, v) => { const i = document.querySelector('[data-dialog] [data-field="' + f + '"]'); i.value = v; i.dispatchEvent(new Event('input')); }; set('project', 'acme'); set('library', 'https://www.figma.com/design/not/'); })()`);
    await save();
    ok('or from an address that names no file', /not a Figma file key/.test(await said()));
    await js(`${inDialog('[data-dialog-save]')}.click()`);
    // the plugin run in a library no project claims: the router kept its snapshot, and the code it showed makes the project
    writeFileSync(join(unclaimedDir, 'K7M2QX.meta.json'), JSON.stringify({ id: 'fkit', key: 'KITKEY0123456', name: 'Kit library' }));
    writeFileSync(join(unclaimedDir, 'K7M2QX.json'), JSON.stringify({ tokens: { _meta: { file: 'Kit library', fileId: 'fkit', fileKey: 'KITKEY0123456' } } }));
    await js(`document.querySelector('[data-settings]').click()`);
    await waitFor(tab, `!!document.querySelector('[data-dialog] [data-field="code"]')`);
    ok('a library snapshot kept for a file no project claims asks for the code the plugin showed, the id left for without one, and names nothing of what is kept', await js(`!!document.querySelector('[data-dialog] [data-field="id"]') && !!document.querySelector('[data-dialog] [data-field="library"]') && !/Kit library|K7M2QX/.test(document.querySelector('[data-dialog]').textContent)`));
    // a code typed, then the snapshot gone (a day passed): the code is no use, and nothing shows it to clear
    await js(`(() => { const i = document.querySelector('[data-dialog] [data-field="code"]'); i.value = 'ABC234'; i.dispatchEvent(new Event('input')); })()`);
    await js(`${inDialog('[data-dialog-cancel]')}.click()`);
    for (const f of ['K7M2QX.json', 'K7M2QX.meta.json']) rmSync(join(unclaimedDir, f));
    await waitFor(tab, `!document.querySelector('[data-dialog]').open`);
    await js(`document.querySelector('[data-settings]').click()`);
    await waitFor(tab, `document.querySelector('[data-dialog]').open && !!document.querySelector('[data-dialog] [data-field="library"]')`);
    const noCode = await js(`!document.querySelector('[data-dialog] [data-field="code"]')`);
    await js(`${inDialog('[data-dialog-cancel]')}.click()`);
    await waitFor(tab, `!document.querySelector('[data-dialog]').open`);
    writeFileSync(join(unclaimedDir, 'K7M2QX.meta.json'), JSON.stringify({ id: 'fkit', key: 'KITKEY0123456', name: 'Kit library' }));
    writeFileSync(join(unclaimedDir, 'K7M2QX.json'), JSON.stringify({ tokens: { _meta: { file: 'Kit library', fileId: 'fkit', fileKey: 'KITKEY0123456' } } }));
    await js(`document.querySelector('[data-settings]').click()`);
    await waitFor(tab, `!!document.querySelector('[data-dialog] [data-field="code"]')`);
    ok('a code typed while a snapshot was kept is dropped once none is, so it is never sent unseen', noCode && await js(`document.querySelector('[data-dialog] [data-field="code"]').value === ''`));
    await js(`${inDialog('[data-dialog-cancel]')}.click()`);
  }
  await js(`document.querySelector('[data-nav-toggle]').click()`);
  ok('Components, pressed again, hides the sidebar', await js(`document.querySelector('[data-nav]').hidden`));
  // the address says where the page is, and a reload opens the same view
  if (connected) {
    await js(`document.querySelector('[data-view="anatomy"]').click()`);
    await expandAll();
    const there = await js(`location.search`);
    ok('the address names the component and the tab, never a library: the server serves one', !/library=/.test(there) && /component=/.test(there) && /tab=anatomy/.test(there));
    const name = await js(`document.querySelector('[data-component]').value`);
    await navigate(tab, url + there);
    await waitFor(tab, `document.querySelectorAll('[data-block], [data-part-block]').length > 0`);
    ok('a reload opens the same component on the same tab', await js(`document.querySelector('[data-component]').value`) === name && await js(`document.querySelector('[data-view="anatomy"]').getAttribute('aria-selected') === 'true'`));
    // a link from another project's docs opens nothing here, and says so: every project's editor defaults to one port
    await navigate(tab, url + '?project=not-this-one&component=' + encodeURIComponent(name === 'Button' ? 'Badge' : 'Button'));
    ok('a link for another project opens nothing and says which project this editor serves', await waitFor(tab, `/the link was for not-this-one/.test(document.querySelector('[data-status]').textContent)`, { timeout: 4000 }).then(() => true, () => false));
    await navigate(tab, url + there);
    await waitFor(tab, `document.querySelectorAll('[data-block], [data-part-block]').length > 0`);
    {
      // a colour's swatch in a part's dialog in the page's scheme, as the preview draws it (a dark page showed the light value)
      // a component of the library's with a token for a background
      const painted = lib.find((c) => Object.values(c.anatomy || {}).some((e) => typeof e.background === 'string' && e.background.includes('/')));
      await navigate(tab, url + '?component=' + encodeURIComponent(painted.component) + '&tab=anatomy');
      await waitFor(tab, `document.querySelectorAll('[data-parts] [data-uid]').length > 0`);
      await tab.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
      await new Promise((r) => setTimeout(r, 250));
      // each part in turn until one has a background: its swatch against its drawing on the stage
      let pv = null, sw = null;
      for (const uid of await js(`[...document.querySelectorAll('[data-parts] [data-uid]')].map((r) => r.dataset.uid)`)) {
        await js(`document.querySelector('[data-parts] [data-uid="${uid}"] [data-edit]').click()`);
        await new Promise((r) => setTimeout(r, 150));
        [pv, sw] = await js(`(() => { const s = document.querySelector('[data-part-dialog] [data-picker="Background"] .ce-swatch'), p = document.querySelector('[data-stage] [data-pv="${uid}"]'); return s && p ? [getComputedStyle(p).backgroundColor, getComputedStyle(s).backgroundColor] : [null, null]; })()`);
        if (pv) break;
        await js(`document.querySelector('[data-part-dialog]').close()`);
      }
      ok('a background\'s swatch in a part\'s dialog is in the page\'s scheme, as the preview draws it', !!pv && sw === pv);
      await js(`document.querySelector('[data-part-dialog]').close()`);
      await tab.send('Emulation.setEmulatedMedia', { features: [] });
      await new Promise((r) => setTimeout(r, 250));
    }
    if (fixtures) {
      // a part stretched with its box (Avatar's image) has no size of its own: its offsets on all four sides say it
      await navigate(tab, url + '?component=Avatar&tab=anatomy');
      await waitFor(tab, `document.querySelectorAll('[data-parts] [data-uid]').length > 1`);
      let stretched = null;
      for (const uid of await js(`[...document.querySelectorAll('[data-parts] [data-uid]')].map((r) => r.dataset.uid)`)) {
        await js(`document.querySelector('[data-parts] [data-uid="${uid}"] [data-edit]').click()`);
        await new Promise((r) => setTimeout(r, 150));
        stretched = await js(`(() => { const box = document.querySelector('[data-part-dialog] .ce-inset'); return box && [[...box.querySelectorAll('[data-offset]')].map((i) => i.dataset.offset + '=' + i.textContent).join(), !!document.querySelector('[data-part-dialog] [data-size="width"], [data-part-dialog] [data-choice="width-hug"]')]; })()`);
        await js(`document.querySelector('[data-part-dialog]').close()`);
        if (stretched) break;
      }
      ok('a part stretched with its box shows an offset on each side and no size of its own', !!stretched && stretched[0] === 'y=0,x=0,end=0,bottom=0' && !stretched[1]);
      // the Button at Focus: its ring paints only an outline over the button, and a click inside it is the button's
      await navigate(tab, url + '?component=Button&tab=anatomy');
      await waitFor(tab, `!!document.querySelector('[data-parts] [data-uid="root"] [data-edit]')`);
      // a row only some variants draw (Focus ring, Spinner) starts where its siblings do: read only, no handle on any
      const lined = `(() => { const at = (r) => Math.round(r.querySelector('.ce-row__name').getBoundingClientRect().left); const ghosts = [...document.querySelectorAll('[data-parts] .ce-row--ghost')]; return ghosts.length > 0 && ghosts.every((g) => { const sib = [...g.closest('ul, ol').querySelectorAll(':scope > li > .ce-row--part:not(.ce-row--ghost)')][0]; return sib && at(sib) === at(g); }); })()`;
      ok('a row only some variants draw is indented as its siblings, read only', await js(lined));
      await js(`document.querySelector('[data-parts] [data-uid="root"] [data-edit]').click()`);
      await new Promise((r) => setTimeout(r, 200));
      await js(`document.querySelector('[data-part-dialog] [data-picker="State"]').click()`);
      await js(`[...document.querySelectorAll('.ce-picker__pop:popover-open [role=option]')].find((o) => /^Focus$/i.test(o.textContent.trim())).click()`);
      await waitFor(tab, `[...document.querySelectorAll('[data-stage] [data-pv]')].some((x) => /ring/i.test(x.title))`);
      ok('at Focus, its ring is drawn as offsets on its four sides, read as text', await js(`(() => { document.querySelector('[data-stage] [data-pv][title="Focus ring"]').click(); return true; })()`)
        && await js(`(() => { const b = document.querySelector('[data-part-dialog] .ce-inset'); return !!b && !b.querySelector('input') && [...b.querySelectorAll('[data-offset]')].map((x) => x.textContent).join() === '−4,−4,−4,−4'; })()`));
      const chosen = [];
      for (let i = 0; i < 2; i++) {
        const at = await js(`(() => { const r = [...document.querySelectorAll('[data-stage] [data-pv]')].find((x) => x.title === 'Label' && x.textContent.trim()).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
        await mouse('mousePressed', at.x, at.y); await mouse('mouseReleased', at.x, at.y);
        await new Promise((r) => setTimeout(r, 250));
        chosen.push(await js(`document.querySelector('[data-part-dialog] h2').textContent.trim()`));
      }
      ok('a click inside the ring chooses what it rings, the button\'s content and then its label, as Figma does', chosen.join(' | ') === 'Button›Content | Button›Content›Label');
      await js(`document.querySelector('[data-part-dialog]').close()`);
      await navigate(tab, url + '?component=Button&pane=preview');
      await waitFor(tab, `document.querySelector('[data-component]').value === 'Button'`);
      ok('an address naming another component opens it, the work before kept as a draft', await js(`!document.querySelector('[data-out="preview"]').hidden && !!document.querySelector('[data-nav-list] [data-draft]')`));
      // Back returns to the component before
      if (await js(`document.querySelector('[data-nav]').hidden`)) await js(`document.querySelector('[data-nav-toggle]').click()`);
      // a person's click: Chrome skips, on Back, a step a script made without one
      const badge = await js(`(() => { const b = document.querySelector('[data-nav-list] [data-open="Badge"]'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      await mouse('mousePressed', badge.x, badge.y);
      await mouse('mouseReleased', badge.x, badge.y);
      if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
      await waitFor(tab, `document.querySelector('[data-component]').value === 'Badge'`, { timeout: 5000 });
      await js(`history.back()`);
      await waitFor(tab, `document.querySelector('[data-component]').value === 'Button'`, { timeout: 5000 }).catch(() => {});
      ok('Back opens the component opened before', await js(`document.querySelector('[data-component]').value`) === 'Button');
      // what a variant adds, and what is not drawn, said as briefly as they hold
      await navigate(tab, url + '?component=Contact%20card&tab=variants');
      await waitFor(tab, `!!document.querySelector('[data-variants] button[data-combo]')`);
      await lastAll();
      await waitFor(tab, `document.querySelectorAll('[data-variants] [data-change]').length > 0`);
      ok('a part added with parts inside it is one row, named alone, what it holds said on hover', await js(`(() => { const rs = [...document.querySelectorAll('[data-variants] [data-change]')]; const v = rs.find((r) => /extra content slot/i.test(r.textContent)); return !!v && rs.filter((r) => r.matches('.ce-vtable__added')).length < 4 && !/inside/.test(v.textContent) && /\\d+ parts? inside/.test(v.querySelector('td[title]')?.title); })()`));
      // a header is its value alone; a cell marked where its values change each other, its changes split so
      await navigate(tab, url + '?component=Button&tab=variants');
      await waitFor(tab, `!!document.querySelector('[data-variants] [data-alone]')`);
      await js(`document.querySelector('[data-alone="size=sm"]').click()`);
      ok('a header chosen is its value alone, focus kept on it', await js(`/^Size is sm$/i.test(document.querySelector('.ce-vchanges h3').textContent) && document.activeElement.dataset.alone === 'size=sm'`));
      ok('a value alone changes nothing only together', await js(`!document.querySelector('.ce-vtable__group')`));
      ok('some cells marked where values change each other, not all, and the key counts them', await js(`(() => { const n = document.querySelectorAll('.ce-vgrid--crossed').length; return n > 0 && n < document.querySelectorAll('[data-variants] button[data-combo]').length && document.querySelector('.ce-vgrid__key').textContent.includes(n + ' where'); })()`));
      await js(`document.querySelector('.ce-vgrid--crossed').click()`);
      ok('a cell marked says so, and its changes made only together are under their own heading', await js(`/change each other/.test(document.activeElement.getAttribute('aria-label')) && [...document.querySelectorAll('.ce-vtable__group')].some((g) => /Only these values together/.test(g.textContent)) && !![...document.querySelectorAll('.ce-vtable__group')].pop().nextElementSibling?.matches('[data-change]')`));
      ok('a library component offers Edit as draft', await js(`!document.querySelector('[data-edit-draft]').hidden`));
      await js(`document.querySelector('[data-edit-draft]').click()`);
      await waitFor(tab, `document.querySelector('[data-edit-draft]').hidden`);
      ok('a row only some variants draw is indented as its siblings, beside their handles', await js(`(() => { const at = (r) => Math.round(r.querySelector('.ce-row__name').getBoundingClientRect().left); const ghosts = [...document.querySelectorAll('[data-parts] .ce-row--ghost')]; return ghosts.length === 0 || ghosts.every((g) => { const sib = [...g.closest('ul, ol').querySelectorAll(':scope > li > .ce-row--part:not(.ce-row--ghost)')][0]; return !sib || at(sib) === at(g); }); })()`));
      ok('the draft says it is linked to its library component', await js(`document.querySelector('[data-linked]').textContent`) === 'Linked to Button in the library');
      await js(`document.querySelector('[data-figma-menu]').click()`);
      ok('a linked draft is pushed as a new component, or updates the library component, never proposed', await js(`(() => { const t = [...document.querySelectorAll('#figma-menu button')].map((b) => b.firstChild.textContent); return t.includes('Push as new component') && t.includes('Update the library component…') && !t.includes('Propose to Figma'); })()`));
      await js(`document.querySelector('#figma-menu').hidePopover()`);
      {
        // the library's component no longer what the draft was made from: refused before anything is drawn
        const r = await js(`fetch('sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'patch-figma', label: ${JSON.stringify(ARGV[ARGV.indexOf('--project') + 1])}, contract: JSON.parse(document.querySelector('[data-json]').value), base: { ...JSON.parse(document.querySelector('[data-json]').value), anatomy: {} } }) }).then((x) => x.json())`);
        ok('updating the library is refused when the library changed since the draft was made', !r.ok && /has changed in the library since this draft was made/.test(r.output));
      }
      await js(`document.querySelector('[data-view="anatomy"]').click()`);
      await waitFor(tab, `!!document.querySelector('[data-parts] [data-uid="root"] [data-edit]')`);
      // the outer box opened from the tree of a draft: its own part has no parent to lay it out (it threw, at / too)
      const thrown = tab.trouble.length;
      await js(`document.querySelector('[data-parts] [data-uid="root"] [data-edit]').click()`);
      ok('the outer box opens in a draft, nothing thrown', await js(`document.querySelector('[data-part-dialog]').open`) && tab.trouble.length === thrown);
      await js(`document.querySelector('[data-part-dialog]').close()`);
      // an option renamed while the grid is on it: the grid follows the new name
      await js(`document.querySelector('[data-view="variants"]').click()`);
      await waitFor(tab, `!!document.querySelector('[data-variants] [data-alone="size=sm"]')`);
      await js(`document.querySelector('[data-alone="size=sm"]').click()`);
      await js(`document.querySelector('[data-view="props"]').click()`);
      await js(`[...document.querySelectorAll('[data-list] > li [data-edit]')].find((b) => /^Size/.test(b.textContent)).click()`);
      await js(`[...document.querySelectorAll('[data-dialog] [data-chip]')].find((c) => c.textContent === 'sm').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))`);
      await js(`(() => { const i = ${inDialog('[data-chip-edit]')}; i.value = 'small'; i.dispatchEvent(new Event('input')); })()`);
      await key('Enter');
      await save();
      await js(`document.querySelector('[data-view="variants"]').click()`);
      ok('an option renamed, the grid stays on it by its new name', await js(`/^Size is small$/i.test(document.querySelector('.ce-vchanges h3')?.textContent)`));
      // a token with nothing beside it to tell it from is said with its group: Disabled/opacity, not opacity
      await navigate(tab, url + '?component=Button&tab=variants');
      await waitFor(tab, `!!document.querySelector('[data-variants] button[data-combo]')`);
      await js(`(() => { const on = document.querySelector('[data-variants] [data-combo][aria-pressed=true]'); const at = { ...JSON.parse(on.dataset.combo), disabled: true }; [...document.querySelectorAll('[data-variants] button[data-combo]')].find((b) => JSON.stringify(JSON.parse(b.dataset.combo)) === JSON.stringify(at)).click(); })()`);
      ok('a token alone is said with its group', /Disabled\/opacity/.test(await js(`document.querySelector('.ce-vchanges').textContent`)));
      await navigate(tab, url + '?component=Option%20row&tab=variants');
      await waitFor(tab, `!!document.querySelector('[data-variants] .ce-vgrid table')`);
      ok('the combinations are a grid: props nested across and down, a cell each, a cross where one is not drawn', await js(`(() => { const t = document.querySelector('.ce-vgrid table'); return t.querySelectorAll('tbody td').length === t.querySelectorAll('tbody tr').length * t.querySelectorAll('thead tr:last-child th').length && t.querySelectorAll('.ce-vgrid__not').length > 0 && /Focus/.test(t.textContent); })()`));
      // a draft begun from a library component that Figma has changed since says so, and offers Figma's version
      await js(`localStorage.setItem('contract-editor:drafts', JSON.stringify([{ component: 'Badge', drafts: [], base: {}, parts: [{ uid: 'root', name: 'root', kind: 'container', parent: null, layout: { direction: 'row' } }], from: { contract: 1, component: 'Badge', props: { gone: { type: 'boolean', default: false } }, anatomy: {}, variants: [], invalid: [] } }]))`);
      await navigate(tab, url);
      await waitFor(tab, `!!document.querySelector('[data-nav-list] [data-draft="Badge"]')`);
      await js(`document.querySelector('[data-nav-list] [data-draft="Badge"]').click()`);
      if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
      ok('a draft whose library component changed since says what changed, above the tabs', await js(`(() => { const b = document.querySelector('[data-stale]'); return !b.hidden && /Figma has changed Badge/.test(b.textContent) && /props removed: gone/.test(b.textContent) && !!b.querySelector('[data-stale-open]'); })()`));
      await js(`document.querySelector('[data-stale-open]').click()`);
      if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
      ok('and Figma\'s version opens, the notice gone and the draft still listed', await js(`document.querySelector('[data-stale]').hidden && document.querySelector('[data-component]').value === 'Badge' && !!document.querySelector('[data-nav-list] [data-draft="Badge"]')`));
      // a library component left open to be read, the library changed since: it reopens as the library has it, no notice
      await js(`(() => { const s = JSON.parse(sessionStorage.getItem('contract-editor:draft') || localStorage.getItem('contract-editor:draft')); delete s.draft; s.from = { ...s.from, props: { gone: { type: 'boolean', default: false } } }; sessionStorage.setItem('contract-editor:draft', JSON.stringify(s)); localStorage.setItem('contract-editor:draft', JSON.stringify(s)); })()`);
      await navigate(tab, url + '?component=Badge');
      await waitFor(tab, `document.querySelector('[data-component]')?.value === 'Badge'`);
      ok('a component left open to be read reopens as the library has it now, with no notice', await js(`document.querySelector('[data-stale]').hidden`));
      // an on/off that only shows a part is a switch on the stage too, as in Figma's instance panel, and draws the part
      await navigate(tab, url + '?component=Button&tab=anatomy');
      await waitFor(tab, `!!document.querySelector('[data-parts] .ce-row')`);
      await js(`[...document.querySelectorAll('[data-parts] .ce-row')].find((r) => r.querySelector('.ce-row__name')?.textContent === 'Content').querySelector('.ce-row__main').click()`);
      await waitFor(tab, `!!document.querySelector('[data-switch="Show icon"]')`, { timeout: 3000 }).catch(() => {});
      const drawn = () => js(`document.querySelectorAll('.ce-stage .ce-pv').length`);
      const was = await drawn();
      await js(`document.querySelector('[data-switch="Show icon"]').click()`);
      ok('an on/off that shows a part is a switch on the stage, and on, the part is drawn', await drawn() > was && await js(`!!document.querySelector('[data-view-default]')`));
      await key('Escape');
      // a draft's part an on/off shows, off by default, is drawn as any part; its switch starts On, and Off takes it away
      const chip = { component: 'Chip', props: { showDot: { type: 'boolean', default: false, figma: 'Show dot', shows: ['dot'] } }, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, dot: { kind: 'graphic', parent: 'root', width: 8, height: 8 } } };
      const r = fromContract(chip);
      const page = { component: 'Chip', drafts: r.drafts, base: {}, parts: fromAnatomy(chip.anatomy, r.drafts, chip.props) };
      await js(`localStorage.setItem('contract-editor:drafts', JSON.stringify([${JSON.stringify(page)}]))`);
      await navigate(tab, url + '?tab=anatomy');
      await waitFor(tab, `!!document.querySelector('[data-nav-list] [data-draft="Chip"]')`);
      await js(`document.querySelector('[data-nav-list] [data-draft="Chip"]').click()`);
      if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
      await js(`document.querySelector('[data-view="anatomy"]').click()`);
      await js(`[...document.querySelectorAll('[data-parts] .ce-row')].find((x) => x.querySelector('.ce-row__name')?.textContent === 'Dot').querySelector('.ce-row__main').click()`);
      await waitFor(tab, `!!document.querySelector('[data-switch="Show dot"]')`, { timeout: 3000 }).catch(() => {});
      const dot = () => js(`(() => { const e = document.querySelector('.ce-stage [title^="Dot"]'); return e ? getComputedStyle(e).opacity : null; })()`);
      ok('a part off by default is drawn as any part, its switch On', await dot() === '1' && await js(`document.querySelector('[data-switch="Show dot"]').checked`));
      await js(`document.querySelector('[data-switch="Show dot"]').click()`);
      ok('and turned Off, it is not drawn', await dot() === null);
      await key('Escape');
    }
  }
  // the Variants grid crosses the on/off properties too when asked, and a cell with one off says the parts it hides
  {
    await navigate(tab, url);
    await waitFor(tab, `!!document.querySelector('[data-json]')`);
    await js(`document.querySelector('[data-new]').click()`);
    if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
    const pill = { component: 'Pill', props: { feedback: { type: 'enum', values: ['warning', 'info'], default: 'warning' }, showIcon: { type: 'boolean', default: true, shows: ['icon'] } },
      anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root' }, icon: { kind: 'instance', parent: 'root' } }, variants: [{ when: { feedback: 'info' }, set: { 'label.color': 'Colour/Text/Muted' } }] };
    await js(`(() => { const t = document.querySelector('[data-json]'); t.value = ${JSON.stringify(JSON.stringify(pill))}; t.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[data-json-apply]').click(); })()`);
    if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
    await js(`document.querySelector('[data-view="variants"]').click()`);
    await waitFor(tab, `!!document.querySelector('[data-variants] [data-with-booleans]')`, { timeout: 3000 }).catch(() => {});
    const cells = () => js(`document.querySelectorAll('[data-variants] [data-combo]').length`);
    ok('the grid crosses the variants alone, with a switch to include the on/off properties', await cells() === 2 && await js(`document.querySelector('[data-with-booleans]')?.checked === false`));
    await js(`document.querySelector('[data-with-booleans]').click()`);
    await waitFor(tab, `document.querySelectorAll('[data-variants] [data-combo]').length === 4 && document.activeElement.matches('[data-with-booleans]')`, { timeout: 2000 }).catch(() => {});
    ok('switched on, Show icon is crossed too, focus kept on the switch', await cells() === 4 && await js(`document.activeElement.matches('[data-with-booleans]')`));
    await js(`[...document.querySelectorAll('[data-variants] button[data-combo]')].find((b) => { const m = JSON.parse(b.dataset.combo); return m.showIcon === false && m.feedback === 'warning'; }).click()`);
    ok('a cell with Show icon off lists the icon as absent', await js(`[...document.querySelectorAll('.ce-vchanges [data-change]')].some((r) => /icon/i.test(r.textContent) && /Absent/.test(r.textContent))`));
    await js(`document.querySelector('[data-with-booleans]').click()`);
    ok('switched off, the grid is the variants again', await cells() === 2);
  }
  // a part dragged on the stage moves there, a line saying where; Escape puts it back
  {
    await navigate(tab, url);
    await waitFor(tab, `!!document.querySelector('[data-json]')`);
    await js(`document.querySelector('[data-new]').click()`);
    if (await dialogOpen()) await js(`${inDialog('[data-dialog-delete]')}.click()`);
    const pill = { component: 'Pill', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, label: { kind: 'text', parent: 'root', order: 0, content: 'Label' },
      dot: { kind: 'graphic', shape: 'ellipse', parent: 'root', order: 1, width: 12, height: 12 }, box: { kind: 'container', parent: 'root', order: 2, width: 40, height: 24 } } };
    await js(`(() => { const t = document.querySelector('[data-json]'); t.value = ${JSON.stringify(JSON.stringify(pill))}; t.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[data-json-apply]').click(); })()`);
    await js(`document.querySelector('[data-view="anatomy"]').click()`);
    await selectPart('Dot');
    await waitFor(tab, `!!document.querySelector('[data-stage] [data-pv][data-selected]')`, { timeout: 2000 }).catch(() => {});
    const on = (name) => js(`(() => { const uid = [...document.querySelectorAll('[data-parts] .ce-row[data-uid]')].find(x => x.querySelector('.ce-row__name').textContent === '${name}').dataset.uid; const r = document.querySelector('[data-stage] [data-pv="' + uid + '"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, l: r.left }; })()`);
    const order = async () => { const a = (await json()).anatomy; return ['label', 'dot', 'box'].sort((x, y) => (a[x].order ?? 0) - (a[y].order ?? 0)).join(); };
    const d = await on('Dot'), l = await on('Label');
    const drag = async (release) => { await mouse('mousePressed', d.x, d.y); for (let k = 1; k <= 6; k++) await mouse('mouseMoved', d.x + (l.l + 3 - d.x) * k / 6, d.y); await release(); };
    {
      await drag(async () => {
        ok('a part dragged on the stage follows the pointer, and takes the place it is over as it goes, the others making room', await js(`(() => { const s = document.querySelector('[data-stage] [data-carried]'); if (!s) return false; const r = s.getBoundingClientRect(); return !s.previousElementSibling?.matches('[data-pv]') && Math.abs(r.left + r.width / 2 - ${l.l + 3}) < r.width; })()`));
        await key('Escape'); await mouse('mouseReleased', l.l + 3, d.y);
      });
      await waitFor(tab, `!document.querySelector('[data-carried]')`, { timeout: 2000 }).catch(() => {});
      ok('Escape slides it back, nothing moved', await order() === 'label,dot,box' && !(await js(`!!document.querySelector('[data-carried]')`)));
      await drag(() => mouse('mouseReleased', l.l + 3, d.y));
      await waitFor(tab, `/Moved Dot/.test(document.querySelector('[data-status]').textContent)`, { timeout: 2000 }).catch(() => {});
      ok('let go, it settles there, and says so', await order() === 'dot,label,box' && /Moved Dot before Label/.test(await js(`new Promise(r => requestAnimationFrame(() => r(document.querySelector('[data-status]').textContent)))`)));
    }
    await closePart();
  }
  // a narrow screen: the components list, opened, covers the page's start rather than push the editor down
  await viewport(tab, 800, 900);
  if (await js(`document.querySelector('[data-nav]').hidden`)) await js(`document.querySelector('[data-nav-toggle]').click()`);
  ok('at 800px the open components list covers the page, the editor not pushed down, nothing scrolling sideways', await js(`document.querySelector('[data-component]').getBoundingClientRect().top < 200 && document.documentElement.scrollWidth <= innerWidth && getComputedStyle(document.querySelector('[data-nav]')).position === 'absolute'`));
  await viewport(tab, 1440, 1000);
  ok('no errors in the console after all of it', tab.trouble.length === 0);
  await shot('6-final');
  if (process.env.SHOTS) {
    await viewport(tab, 390, 900);
    await shot('7-phone');
    ok('no sideways scroll at 390px', await js(`document.documentElement.scrollWidth <= innerWidth`));
  }
  console.log(`${n} passed`);
} finally {
  tab.close();
  ok('nothing the run downloads reaches the person\'s Downloads', (existsSync(theirs) ? readdirSync(theirs).length : 0) === theirsBefore);
  await browser.close();
  server.kill();
}
