// Builds an Audit lite report from the components scanner's fixture and renders the report page, with no Figma.
//   node plugins/audit-lite/tests/test-audit-lite.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const mod = { exports: {} };
new Function('module', fs.readFileSync(path.join(HERE, '..', 'code.js'), 'utf8'))(mod);
const { report, settingsFor, pastedRulings, mergeRulings, rulingsLog, LITE, scan, foundations } = /** @type {any} */ (mod.exports);
const projects = createRequire(import.meta.url)(path.join(ROOT, 'tools/snapshot/projects.cjs'));

let failed = 0, passed = 0;
const ok = (name, cond, detail = '') => { if (cond) passed++; else { failed++; console.log('FAIL ' + name + (detail ? '\n  ' + detail : '')); } };

// The scan: the scanner body returns checkFacts with no figma in scope, as in its own tests.
const FX = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills/figma-components-audit/tests/fixtures/library-slice.json'), 'utf8'));
const checkFacts = await scan([], LITE.scales, LITE.tokens);
const r = await checkFacts({ pages: FX.pages }, LITE.tokens, LITE.scales, [], async (id) => (id in FX.vars ? FX.vars[id] : null), FX.file);
const found = r.audited.reduce((n, s) => n + s.candidates.length, 0);
ok('the fixture raises candidates under the house settings', found > 0, 'found ' + found);
ok('no page filter, so every page is walked', !('componentPages' in LITE.tokens));
const DOC = path.join(HERE, 'fixtures/design-system-context.md');
const MD = fs.readFileSync(DOC, 'utf8');
const unsetIn = (md) => (md.split('- Not set, so their checks did not run:')[1] || '').split('\n- ')[0];
ok('a derived key is not listed as a skipped check', !LITE.reads.some((u) => ['componentPages', 'excludeSections'].includes(u.key)));
ok('a project-only key is listed as a skipped check under the house settings', /`semantic`: \S/.test(unsetIn(report(r, { fileName: 'X', fileKey: 'K', date: 'd' }))));

// The context document: read by the full audit's own readers, so the plugin and the dashboard agree.
const full = projects.auditContext(DOC);
const run = settingsFor(MD, 'KEY123');
ok('the fixture reads clean in the full audit', !full.errors.length, full.errors.join('; '));
ok('the settings equal the full audit\'s for the same file', JSON.stringify(run.tokens) === JSON.stringify(full.libraries.KEY123.tokens), JSON.stringify(run.tokens));
ok('the option orders equal the full audit\'s', JSON.stringify(run.scales) === JSON.stringify(full.libraries.KEY123.optionOrder));
ok('the rulings equal the full audit\'s, the struck row left out', JSON.stringify(run.rulings) === JSON.stringify(full.rulings) && run.rulings.length === 2);
const refused = (f) => { try { f(); return ''; } catch (e) { return e.message; } };
ok('a document with no entry for this file is refused by name', /no audit-settings entry for this file \(OTHER\)/.test(refused(() => settingsFor(MD, 'OTHER'))));
ok('a document with no settings block is refused', /no audit-settings block/.test(refused(() => settingsFor('# Doc', 'KEY123'))));
const withDoc = report(r, { fileName: 'Fixture library', fileKey: 'KEY123', date: '2026-11-10' }, Object.assign(run, { contextName: 'design-system-context.md' }));
ok('the run says the settings came from the document', withDoc.includes("- Settings: the project's context document (design-system-context.md)"));
ok('the judge gets the library\'s own conventions', ['This library\'s own:', 'Colour is bound from the semantic collection named Semantic.', 'Status options run Default · Hover · Pressed.', 'Descriptions: one sentence, then Use when.'].every((x) => withDoc.includes(x)), withDoc.split('This library')[1]?.slice(0, 400));
ok('without a document the house conventions are not called the library\'s own', !report(r, { fileName: 'X', fileKey: 'K', date: 'd' }).includes('This library\'s own:'));
const routedOnly = MD.replace(/"KEY123": \{[\s\S]*?\n    \}\n/, '');
ok('a library routed for components with no settings entry runs on the house defaults, as in the full audit', JSON.stringify(settingsFor(routedOnly, 'KEY123').tokens.stateAxis) === JSON.stringify(LITE.house.stateAxis || settingsFor(null, null).tokens.stateAxis));
ok('a malformed block is refused by name', /the audit-settings block is not valid JSON/.test(refused(() => settingsFor('```json audit-settings\n{\n```', 'KEY123'))));
const disc = report(r, { fileName: 'X', fileKey: 'K', date: 'd' }, Object.assign(settingsFor(null, null), { discovery: { collections: [{ name: 'Primitives' }] } }));
ok('without a document the discovery reaches the report', /## Discovery[\s\S]*"Primitives"/.test(disc));
ok('the judge gets each ruling with the component it was recorded on', withDoc.includes('Icon-only buttons keep a fixed 40 px width. (recorded on Button;') && withDoc.includes('- Private parts start with a dot.'));
ok('a key the document sets is no longer listed as skipped', !/`semantic`/.test(unsetIn(withDoc)));
ok('with a document there is no discovery or template', !withDoc.includes('## Discovery') && !withDoc.includes('## Context document template'));

const md = report(r, { fileName: 'Fixture library', fileKey: 'ABC123', date: '2026-11-10' });
// the outline a reader sees: a heading inside a fenced block (the context template's) is code, not the report's
let inFence = null;
const top = md.split('\n').filter((l) => { const f = /^(`{3,})/.exec(l); if (f && (!inFence || f[1] === inFence)) { inFence = inFence ? null : f[1]; return false; } return !inFence && /^#{1,2} /.test(l); });
ok('the report\'s outline is its own sections, the conventions nested below',
  JSON.stringify(top) === JSON.stringify(['# Audit lite report: Fixture library', '## What to do when the person asks for the results', '## Rules for the rows',
    '## The settings this run used', '## Run', '## Judgement', '## Buckets', '## Report template', '## Discovery', '## Context document template', '## Candidates']), JSON.stringify(top));
ok('without a document the template reaches the report whole', md.includes(LITE.contextTemplate.trim()));
ok('no placeholder of the judge prompt is left', !/\{\{[A-Z]+\}\}/.test(md));
ok('the house conventions are listed from the settings', md.includes('the state axis is "' + LITE.tokens.stateAxis + '"'));
const cands = JSON.parse(md.split('## Candidates')[1].replace(/^\s*```json\n/, '').replace(/\n```\s*$/, ''));
ok('every candidate reaches the report', cands.reduce((n, s) => n + s.candidates.length, 0) === found);
ok('a candidate carries what the rows need', cands.every((s) => s.setId && s.candidates.every((c) => c.sev && c.rule && c.key && c.text && c.advice)));
ok('the template reaches the report whole', md.includes(LITE.template.trim()));
ok('a report with no file key says it has no links', report(r, { fileName: 'X', fileKey: null, date: 'd' }).includes('no Figma links'));

// The file-level checks: the foundations audit's own, run on the same settings, filed beside the components' findings.
const fcheck = await foundations(LITE.tokens);
ok('the foundations checks are carried as written', typeof fcheck === 'function');
const marker = '❖ ';
const fr = fcheck({ pages: [{ name: marker + 'INPUTS' }, { name: marker + 'Text input' }, { name: marker + 'Combobox' }], components: [] }, Object.assign({}, LITE.tokens, { sectionHeader: '^❖ [A-Z][A-Z &]*$', pageMarker: '^\\S+\\s+' }));
ok('a page out of order is found (the house settings, with a fixture section header and page marker)', fr.audited.some((e) => e.set === 'Page list' && e.candidates.some((c) => c.rule === 'page-order')), JSON.stringify(fr.audited));
const both = Object.assign({}, r, { audited: r.audited.concat(fr.audited), foundations: { ran: fr.ran, notRun: fr.notRun } });
const fmd = report(both, { fileName: 'X', fileKey: 'K', date: 'd' });
ok('the file-level findings reach the candidates', /"set": "Page list"/.test(fmd) && /"rule": "page-order"/.test(fmd));
ok('the run names the file-level checks that ran', fmd.includes('- File-level checks run: ') && fmd.includes('page-order'));
ok('a stopped file-level pass is said, the components kept', report(Object.assign({}, r, { foundations: { ran: [], notRun: [], error: 'boom' } }), { fileName: 'X', fileKey: 'K', date: 'd' }).includes('- File-level checks: stopped (boom)'));

// The page: filled as Claude fills it, rendered against a stub document. Its words and colours are the dashboard's.
const pageJs = (data) => LITE.template.split('<script>')[1].split('</script>')[0].replace('const DATA = null;', 'const DATA = ' + JSON.stringify(data) + ';');
const mount = (data, stored, onSave) => {
  const app = { innerHTML: '' }, body = { innerHTML: '' };
  const doc = { getElementById: (id) => (id === 'app' ? app : id === 'rulingsBody' ? body : id === 'rulingsText' ? { value: (body.innerHTML.split('readonly aria-label="Rulings to upload into Audit lite">')[1] || '').split('</textarea>')[0] } : null), querySelector: () => null };
  new Function('document', 'localStorage', pageJs(data))(doc, { getItem: () => (stored ? JSON.stringify(stored) : null), setItem: (k, v) => onSave && onSave(JSON.parse(v)) });
  return { app, body, html: () => app.innerHTML + body.innerHTML, click: (dataset) => app.onclick({ target: { closest: () => ({ dataset, id: dataset.id || '' }) } }) };
};
const page = (data, stored) => mount(data, stored).html();
const data = { file: 'Lib <b>', fileKey: 'ABC123', date: '2026-11-10', scanned: { sets: 2, variants: 9 }, coverage: 90, kept: 4, dropped: 1, notScanned: ['Spacing scale'], contextName: null,
  rows: [
    { bucket: 3, sev: 'warning', visible: false, set: 'Chip', setId: '1:2', layer: '', issue: 'a', fix: 'b' },
    { bucket: 3, sev: 'error', visible: true, set: 'Button', setId: '1:3', layer: 'Label', issue: 'c', fix: 'd' },
    { bucket: 'b1', sev: 'error', visible: false, set: '<img src=x onerror=alert(1)>', setId: '1:4', layer: '', issue: 'e', fix: 'f' },
    { bucket: 4, sev: 'warning', visible: false, area: 'file', set: 'Page list', setId: '', layer: 'Avatar', issue: 'g', fix: 'h' },
  ] };
const html = page(data);
ok('an empty page renders nothing', page(null) === '');
ok('the dashboard\'s colour tokens are filled in, the slot gone', /:root\{--[\w-]+:light-dark\(/.test(LITE.template) && !LITE.template.includes('--dash-tokens'));
ok('the dashboard\'s bucket titles head the three buckets', ['Fix on approval', 'Quick manual fixes', 'Decide'].every((t) => html.includes('>' + t + '</h2>')) && !html.includes('b4H'));
ok('a "b1" bucket counts as bucket 1, with the dashboard\'s columns', html.includes('<span class="rid" id="rid-1-1">1.1</span>') && html.includes("What's wrong") && html.includes('The question'));
ok('a breaking fix sits in Decide with its tag', /3\.3<\/span>[\s\S]*?class="breaking-tag"/.test(html));
ok('a user-visible row leads its bucket, with its flag', /rid-3-1">3\.1<\/span><span class="sev error">Error<\/span><span class="owner-tag">Components<\/span><span class="visible-flag">/.test(html), html.slice(html.indexOf('rid-3-1'), html.indexOf('rid-3-1') + 300));
ok('a file-level row is tagged with the dashboard\'s area name, unlinked', html.includes('<span class="owner-tag">Library file</span>') && html.includes('<span class="where" id="where-3-3">Page list › Avatar</span>'));
ok('file text is escaped', !html.includes('<img') && !html.includes('Lib <b>'));
ok('a row links to its set', html.includes('href="https://www.figma.com/design/ABC123?node-id=1-3"'));
ok('each row has its Done box, note and two actions', ['data-done-id="', 'data-note-id="', 'data-rule-id="', 'data-ask-id="'].every((a) => (html.match(new RegExp(a, 'g')) || []).length === 4));
ok('the tiles and the two filters are the dashboard\'s', html.includes('<span class="kpi__label">Open</span><span class="kpi__value">4</span>') && html.includes('aria-label="Show rows on"') && html.includes('aria-label="Show rows raised by"'));
ok('with nothing recorded, the rulings section says how to record one', html.includes('<h2 id="rulingsH">Rulings</h2>') && !html.includes('id="rulingsText"'));
ok('the run\'s scope has its heading', html.includes('<h2 id="aboutH">About this run</h2>') && html.includes('Not checked in this run'));

// Recorded state: marks follow the finding; a ruling takes the row's note, and is read back by the full audit's reader.
const kept = page(data, { done: ['Button|Label|c'], rules: ['Button|Label|c', 'Gone|x|a finding a later run dropped'], notes: { 'Button|Label|c': 'The label is decorative' } });
ok('a mark follows its finding, and one for a finding no longer listed is ignored', kept.includes('<li class="row" data-done="true"><input class="tick" type="checkbox" data-done-id="3.1"') && (kept.match(/Recorded from Audit lite/g) || []).length === 1);
const rows = (kept.split('readonly aria-label="Rulings to upload into Audit lite">')[1] || '').split('</textarea>')[0].replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
ok('a recorded row becomes a rulings-log row with its note, naming its component', /^\| \d{4}-\d\d-\d\d \| Button \| Button › Label: The label is decorative\. \| Recorded from Audit lite, on Button, about: c\. \|$/.test(rows), rows);
const back = pastedRulings(rows);
ok('the page\'s downloaded rulings file reads back the same', JSON.stringify(pastedRulings('## 6. Rulings log\n\n| Date | Scope | Ruling | Why |\n|---|---|---|---|\n' + rows + '\n')) === JSON.stringify(back));
ok('the plugin reads the pasted rows as the full audit reads a rulings log', back.length === 1 && JSON.stringify(back) === JSON.stringify(projects.rulingsOf('## 6\n\n| Date | Scope | Ruling | Why |\n|---|---|---|---|\n' + rows + '\n')));
ok('a paste with its own header reads the same', JSON.stringify(pastedRulings('| Date | Scope | Ruling | Why |\n|---|---|---|---|\n' + rows)) === JSON.stringify(back));
ok('a paste of anything else finds no rulings', pastedRulings('hello').length === 0);
ok('pasted and document rulings merge, each once', mergeRulings(back, back.concat({ key: 'other' })).length === 2);
const edited = pastedRulings(rows.replace('The label is decorative.', 'Decorative: no ring.'));
ok('a ruling re-recorded with a new note replaces the earlier one', (() => { const m = mergeRulings(back, edited); return m.length === 1 && m[0].text.includes('Decorative: no ring.'); })());
ok('the judge reads the ruling with its component and finding', report(r, { fileName: 'X', fileKey: 'K', date: 'd' }, Object.assign(settingsFor(null, null), { rulings: back })).includes('(recorded on Button about “c”;'));
const withPasted = report(r, { fileName: 'X', fileKey: 'K', date: 'd' }, Object.assign(settingsFor(null, null), { rulings: back, pasted: 1 }));
ok('the next run judges by a pasted ruling, and says where it came from', withPasted.includes('The label is decorative') && withPasted.includes('- Rulings: 1 (1 saved in the file'));
const piped = back.concat(pastedRulings('| 2026-01-01 | Tag | Tag: a | b \\| c |'));
ok('downloaded rulings read back as the same rulings', JSON.stringify(pastedRulings(rulingsLog(piped))) === JSON.stringify(piped) && JSON.stringify(projects.rulingsOf(rulingsLog(piped))) === JSON.stringify(piped));
ok('the draft switch reaches the report, and only without a document', report(r, { fileName: 'X', fileKey: 'K', date: 'd' }, Object.assign(settingsFor(null, null), { draft: true })).includes('- Draft a context document: yes') && !withPasted.includes('- Draft a context document: yes'));
ok('the instructions say what a draft request and the closing files are', LITE.instructions.includes('Draft a context document: yes') && LITE.instructions.includes('8. **Offer the files**'));

// The clicks: Done and Record as ruling change what the page shows and what it stores.
{
  let stored = null;
  const m = mount(data, null, (v) => { stored = v; });
  m.click({ doneId: '3.1' }); m.click({ ruleId: '3.1' });
  ok('done and recorded are stored for this browser, by finding', JSON.stringify(stored) === JSON.stringify({ done: ['Button|Label|c'], rules: ['Button|Label|c'], notes: {} }));
  ok('a recorded row reaches the rulings at once, with the default ruling', m.html().includes('Kept as is: intended.'));
  m.app.onchange({ target: { id: 'areaFilter', value: 'file' } });
  ok('the area filter shows only that area\'s rows, and says so', m.app.innerHTML.includes('Showing 1 of 4.') && !m.app.innerHTML.includes('rid-3-1"'));
}

// The window's handlers, against a fake figma: what opening, downloading and removing write, and where.
const plugin = ({ fileKey, inFile = [], store = {}, viewOnly = false }) => {
  let data = inFile.length ? JSON.stringify(inFile) : '';
  const sent = [];
  const figma = {
    fileKey, root: { name: 'Lib', getPluginData: () => data, setPluginData: (_, v) => { if (viewOnly) throw new Error('view-only'); data = v; } },
    clientStorage: { getAsync: async (k) => store[k], setAsync: async (k, v) => { store[k] = v; }, deleteAsync: async (k) => { delete store[k]; } },
    ui: { postMessage: (m) => sent.push(m) }, showUI: () => {}, notify: () => {}, closePlugin: () => {},
  };
  new Function('module', 'figma', '__html__', fs.readFileSync(path.join(HERE, '..', 'code.js'), 'utf8'))({ exports: {} }, figma, '');
  return { send: (m) => figma.ui.onmessage(m), sent, store, file: () => data };
};
const ruling = { date: '2026-01-01', scope: 'Lib', text: 'x', why: 'about: Button', key: 'k1' };
{
  const p = plugin({ fileKey: 'F1', store: { 'rulings:F1': [ruling] } });
  await p.send({ type: 'hello' });
  ok('opening counts the machine rulings and writes nothing to the file', p.sent[0].rulings === 1 && p.file() === '' && p.store['rulings:F1']);
  await p.send({ type: 'rulings-download' });
  ok('downloading writes nothing to the file either', p.file() === '' && p.store['rulings:F1']);
}
{
  const p = plugin({ fileKey: 'F2', store: { 'rulings:F2': [ruling] }, viewOnly: true });
  await p.send({ type: 'rulings-clear' });
  ok('a view-only file with no rulings of its own still lets the machine copy be removed', !p.store['rulings:F2']);
  const q = plugin({ fileKey: 'F3', inFile: [ruling], store: { 'rulings:F3': [ruling] }, viewOnly: true });
  await q.send({ type: 'rulings-clear' });
  ok('a view-only file holding rulings keeps the machine copy when its own cannot be cleared', !!q.store['rulings:F3']);
}

console.log(failed ? `${failed} failed, ${passed} passed` : `${passed} passed`);
process.exit(failed ? 1 : 0);
