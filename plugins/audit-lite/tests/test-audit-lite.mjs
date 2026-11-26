// Builds an Audit lite report from the components scanner's fixture and renders the report page, with no Figma.
//   node plugins/audit-lite/tests/test-audit-lite.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const ui = fs.readFileSync(path.join(HERE, '..', 'ui.html'), 'utf8');
const mod = { exports: {} };
new Function('module', fs.readFileSync(path.join(HERE, '..', 'code.js'), 'utf8'))(mod);
const { report, settingsFor, LITE, scan, foundations, selectedSets } = /** @type {any} */ (mod.exports);
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
ok('the run counts the document\'s rulings and says where they came from', /- Rulings: 2, from the context document's rulings log/.test(withDoc));
const withText = report(r, { fileName: 'Fixture library', fileKey: 'KEY123', date: '2026-11-10' }, Object.assign({}, run, { contextName: 'design-system-context.md', contextText: MD }));
ok('a run with a document carries its text, for Claude to give back with new rulings', withText.includes('## Context document') && withText.includes('# Fixture library — design system context'));
ok('a run without the text has no Context document section', !withDoc.includes('## Context document\n'));
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
  const doc = { getElementById: (id) => (id === 'app' ? app : id === 'rulingsBody' ? body : id === 'rulingsText' ? { value: (body.innerHTML.split('readonly aria-label="Rulings to take to the chat">')[1] || '').split('</textarea>')[0] } : null), querySelector: () => null };
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
const rows = (kept.split('readonly aria-label="Rulings to take to the chat">')[1] || '').split('</textarea>')[0].replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
ok('a recorded row becomes a rulings-log row with its note, naming its component', /^\| \d{4}-\d\d-\d\d \| Button \| Button › Label: The label is decorative\. \| Recorded from Audit lite, on Button, about: c\. \|$/.test(rows), rows);
const back = projects.rulingsOf('## 6. Rulings log\n\n| Date | Scope | Ruling | Why |\n|---|---|---|---|\n' + rows + '\n');
ok('the page\'s rulings, added to a context document\'s log, read back as one ruling', back.length === 1 && back[0].text.includes('The label is decorative'));
ok('the judge reads the ruling with its component and finding', report(r, { fileName: 'X', fileKey: 'K', date: 'd' }, Object.assign(settingsFor(null, null), { rulings: back })).includes('(recorded on Button about “c”;'));
const withPasted = report(r, { fileName: 'X', fileKey: 'K', date: 'd' }, settingsFor(null, null));
ok('without a context document the report says there are no rulings', withPasted.includes('- Rulings: none, as there is no context document.'));
ok('the draft switch reaches the report, and only without a document', report(r, { fileName: 'X', fileKey: 'K', date: 'd' }, Object.assign(settingsFor(null, null), { draft: true })).includes('- Draft a context document: yes') && !withPasted.includes('- Draft a context document: yes'));
ok('the instructions say what a draft request and the closing files are', LITE.instructions.includes('Draft a context document: yes') && LITE.instructions.includes('8. **Offer the files**'));
{
  const withDoc = (LITE.instructions.split('**From the project\'s context document.**')[1] || '').split('**From the toolkit\'s defaults.**')[0];
  ok('with a context document the closing offer is stated: record an intended row as a ruling, its example a shown row, never a dropped one', /offer to record any row the person says is intended as a ruling/.test(withDoc) && /never a candidate you dropped/.test(withDoc), withDoc);
}
{
  const steps = (LITE.instructions.split('6. **In the chat:**')[1] || '').split('## Rules for the rows')[0];
  const [s6, s7, s8] = ['', '7. **', '8. **'].map((k, i, a) => (k ? steps.split(k)[1] || '' : steps).split(a[i + 1] || '\u0000')[0]);
  ok('with rulings, the tables and the results file say how many were applied, and the closing lines which finding each removed or that it matched nothing', /When \*Run\* lists rulings[^.]*the line above the tables says how many rulings were applied/.test(s6) && /under the same line of rulings applied/.test(s8) && /five when \*Run\* lists rulings/.test(s7) && /which finding each ruling removed this run[^.]*or that it matched nothing this run/.test(s7), steps);
}

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

// The window's handlers, against a fake figma: nothing the plugin does writes to the file.
const plugin = ({ fileKey, store = {} }) => {
  let wrote = 0;
  const sent = [];
  const figma = {
    fileKey, root: { name: 'Lib', getPluginData: () => '', setPluginData: () => { wrote++; } },
    clientStorage: { getAsync: async (k) => store[k], setAsync: async (k, v) => { store[k] = v; }, deleteAsync: async (k) => { delete store[k]; } },
    ui: { postMessage: (m) => sent.push(m) }, showUI: () => {}, notify: () => {}, closePlugin: () => {},
  };
  new Function('module', 'figma', '__html__', fs.readFileSync(path.join(HERE, '..', 'code.js'), 'utf8'))({ exports: {} }, figma, '');
  return { send: (m) => figma.ui.onmessage(m), sent, store, wrote: () => wrote };
};
{
  const p = plugin({ fileKey: 'KEY123' });
  await p.send({ type: 'hello' });
  await p.send({ type: 'context-set', name: 'design-system-context.md', text: MD });
  ok('a context document is kept on this machine, keyed by the file', p.store['context:KEY123'] && p.store['context:KEY123'].name === 'design-system-context.md');
  await p.send({ type: 'context-clear' });
  ok('removing it deletes it', !p.store['context:KEY123']);
  ok('opening, setting and removing a document write nothing to the file', p.wrote() === 0);
}
// Selection: what the selection is, sits in or holds, by name; nothing a component scans the whole file
{
  const page = { type: 'PAGE', name: 'P', parent: null };
  const set = { type: 'COMPONENT_SET', name: 'Button', parent: page };
  const variant = { type: 'COMPONENT', name: 'Size=md', parent: set };
  const label = { type: 'TEXT', name: 'Label', parent: variant };
  const lone = { type: 'COMPONENT', name: 'Divider', parent: page };
  const chip = { type: 'COMPONENT_SET', name: 'Chip', parent: null }, chipV = { type: 'COMPONENT', name: 'State=Rest', parent: chip };
  const section = { type: 'SECTION', name: 'Inputs', parent: page, findAllWithCriteria: () => [chip, chipV, lone] };
  const frame = { type: 'FRAME', name: 'Notes', parent: page, findAllWithCriteria: () => [] };
  ok('a layer inside a variant selects its set', JSON.stringify(selectedSets([label])) === '["Button"]');
  ok('a variant and its set count once; a plain component is itself', JSON.stringify(selectedSets([variant, set, lone])) === '["Button","Divider"]');
  ok('a section holding components selects each, never a variant on its own', JSON.stringify(selectedSets([section])) === '["Chip","Divider"]');
  ok('nothing selected, or nothing a component, is the whole file', selectedSets([]).length === 0 && selectedSets([frame]).length === 0);
  const scoped = report(Object.assign({}, r, { scope: ['Button', 'Chip'] }), { fileName: 'X', fileKey: 'K', date: 'd' });
  ok('a selection run says its scope, and that the rest was not looked at', /- Scope: the selection only, 2 components \(Button, Chip\); every other component, and the file-level checks, were not looked at/.test(scoped));
  ok('a selected set the settings keep out is named as not scanned', /Not scanned, as the settings keep their page or section out of the audit: Chip/.test(report(Object.assign({}, r, { scope: ['Button', 'Chip'], unscanned: ['Chip'] }), { fileName: 'X', fileKey: 'K', date: 'd' })));
  ok('a selection holding no component says so, not "nothing was selected"', /- Scope: the whole file \(the selection held no component\)/.test(report(Object.assign({}, r, { selectionHeldNone: true }), { fileName: 'X', fileKey: 'K', date: 'd' })));
  ok('a whole-file run says so', /- Scope: the whole file \(nothing was selected\)/.test(report(r, { fileName: 'X', fileKey: 'K', date: 'd' })));
}

// The audit's list of stages, run as the list says: the stages that name Audit lite, in its order, each offered only where
// it applies to the file, and the tokens and icons stages through the snapshot plugin's own facts mode.
{
  const { REGISTRY, HANDLERS, ON_SELECTION, LIBRARY, offered, bucketFor: liteBucket, stagesFor } = /** @type {any} */ (mod.exports);
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills/figma-project-audit/scripts/stages.json'), 'utf8'));
  ok('the bundled list is the registry, unchanged', JSON.stringify(REGISTRY) === JSON.stringify(registry));
  ok('Audit lite runs file, components, variables and styles, and icons, in the list\'s order', JSON.stringify(stagesFor(REGISTRY, 'lite').map((s) => s.id)) === '["foundations","components","tokens","icons"]');
  ok('every stage it runs has a handler, and only the components stage runs on a selection', stagesFor(REGISTRY, 'lite').every((s) => typeof HANDLERS[s.id] === 'function') && ON_SELECTION.join() === 'components');
  const all = { componentSets: true, tokens: true, icons: true };
  ok('a file with everything offers every check, each with the list\'s label and description', JSON.stringify(offered(all, false)) === JSON.stringify(stagesFor(registry, 'lite').map((s) => ({ id: s.id, label: s.label, description: s.description }))));
  ok('a check that does not apply is not offered: no variables, no icon page', JSON.stringify(offered({ componentSets: true, tokens: false, icons: false }, false).map((s) => s.id)) === '["foundations","components"]');
  ok('a file with no components offers no components check', !offered({ componentSets: false, tokens: true, icons: false }, false).some((s) => s.id === 'components'));
  ok('a selection offers only the components check', JSON.stringify(offered(all, true).map((s) => s.id)) === '["components"]');
  ok('the window holds no stage words of its own: they come from the list', !registry.stages.some((s) => fs.readFileSync(path.join(HERE, '..', 'ui.html'), 'utf8').includes(s.description)));

  // the bundled checks are library.mjs's own: one payload, the same findings
  const lib = await import(path.join(ROOT, 'skills/figma-foundations-audit/scripts/library.mjs'));
  const col = (values, extra = {}) => ({ modes: ['Light'], values: { Light: values }, alias: { Light: {} }, descriptions: extra.descriptions || {} });
  const facts = { tokens: { _meta: {}, collections: { Primitives: col({ 'Size/4': 4, 'Size/8': 8, 'Grey/1': '#eee' }, { descriptions: { 'Size/4': 'Small gaps' } }) },
    textStyles: [{ name: 'Body', bound: { fontSize: { name: 'Size/4' } }, authored: { letterSpacing: { unit: 'PIXELS', value: 0 } } }], paintStyles: [], effects: [] },
    icons: [{ name: 'plus', size: 16, unbound: 1 }, { name: 'plus', size: 24, unbound: 0 }, { name: 'minus', size: 16, unbound: 0 }], iconSets: ['plus', 'minus'], iconPage: 'Icons', used: ['Size/8'], components: 2 };
  ok('the bundled tokens and icons checks are library.mjs\'s, finding for finding', JSON.stringify(LIBRARY.liveChecks(facts, 'K', { names: null })) === JSON.stringify(lib.liveChecks(facts, 'K', { names: null })));
  ok('…and so is when they apply', JSON.stringify(LIBRARY.liveApplies(facts)) === JSON.stringify(lib.liveApplies(facts)));
  const live = LIBRARY.liveChecks(facts, 'K', { names: null });
  ok('…and the fixture raises tokens and icons findings to file', live.tokens.findings.length >= 2 && live.icons.findings.length >= 1, JSON.stringify(live).slice(0, 300));

  // the report: library findings beside the others, bucketed by their own rule, and the checks run and not run
  const r2 = { audited: [{ set: 'Page list', id: '', stage: 'foundations', candidates: [{ sev: 'warning', rule: 'page-order', key: 'po', text: 't', advice: 'a' }] },
    { set: 'Primitives', id: '', stage: 'tokens', candidates: [{ sev: 'warning', rule: 'tokens-unused', key: 'tu', text: '1 token is used by nothing: Grey/1.', advice: 'Remove it.', bucket: 3 }, { sev: 'warning', rule: 'tokens-description', key: 'td', text: 'x', advice: 'y', bucket: 1 }] }],
    ran: [], stages: [{ id: 'foundations', label: 'File', status: 'ran' }, { id: 'components', label: 'Components', status: 'off' }, { id: 'tokens', label: 'Variables & styles', status: 'ran' }, { id: 'icons', label: 'Icons', status: 'n/a' }],
    library: { tokens: { ran: ['tokens-description', 'tokens-style-binding', 'tokens-naming', 'tokens-structure'] } }, foundations: { ran: ['page-order'], notRun: [] } };
  const md2 = report(r2, { fileName: 'X', fileKey: 'K', date: 'd' });
  const c2 = JSON.parse(md2.split('## Candidates')[1].replace(/^\s*```json\n/, '').replace(/\n```\s*$/, ''));
  ok('a tokens finding reaches the candidates with its own bucket, filed as the file\'s', c2[1].area === 'file' && c2[1].candidates.map((c) => c.bucket).join() === '3,1', JSON.stringify(c2[1]));
  ok('a file-level finding takes the list\'s bucket rule: page order first, as the dashboard files it', c2[0].candidates[0].bucket === 1 && liteBucket(REGISTRY.stages[0], 'page-order') === 'b1');
  ok('a scanner candidate takes its buckets.json bucket', JSON.parse(md.split('## Candidates')[1].replace(/^\s*```json\n/, '').replace(/\n```\s*$/, '')).every((g) => g.area === 'components' && g.candidates.every((c) => [1, 2, 3].includes(c.bucket))));
  ok('the run says which checks ran', md2.includes('- Checks run: File, Variables & styles'));
  ok('…and why each other did not', md2.includes('- Checks not run: Components (switched off in the plugin); Icons (the file has no icon page)'));
  ok('…and what the variables check covered, the unused check named as not run', md2.includes('- Variables and styles checks run: tokens-description, tokens-style-binding, tokens-naming, tokens-structure; unused tokens not checked'));
  ok('…and that no component was scanned, and why', md2.includes('- Scanned: no components; the components check did not run (switched off in the plugin)') && !md2.includes('- Rule families checked:'));
  const withUnused = report(Object.assign({}, r2, { library: { tokens: { ran: ['tokens-description', 'tokens-unused'] } } }), { fileName: 'X', fileKey: 'K', date: 'd' });
  ok('an unused-tokens check that ran says plainly that only this file\'s components count as users', withUnused.includes('tokens-unused; only this file\'s own components count as users of its tokens, so a token that only another file\'s components use is listed as unused'));
  ok('the bundled checks run the unused check on the file\'s own bindings, as the report says (selfUsed)', LIBRARY.liveChecks(facts, 'K', { names: null, selfUsed: true }).tokens.ran.includes('tokens-unused'));
  const stopped = report(Object.assign({}, r2, { stages: [{ id: 'components', label: 'Components', status: 'stopped', why: 'the scanner threw' }] }), { fileName: 'X', fileKey: 'K', date: 'd' });
  ok('a components check that applied and threw is said as stopped, never as a file with no components', stopped.includes('- Scanned: the components check stopped (the scanner threw)') && !stopped.includes('Scanned: no components'));
  const none = report(Object.assign({}, r2, { stages: [{ id: 'components', label: 'Components', status: 'n/a' }] }), { fileName: 'X', fileKey: 'K', date: 'd' });
  ok('…and a file with none says that', none.includes('- Scanned: no components; the file has none'));
  ok('the stages Audit lite does not run are named from the list', md2.includes('- Not part of this plugin, only the full audit runs them: Code target (') && md2.includes('Design and code ('));
}

// A whole run, against a fake figma that has a variable collection and no components: the stages the window chose run,
// the snapshot plugin's facts mode among them, and it never opens a window or posts to this one.
{
  const shown = [], posted = [];
  const vars = { 'V:1': { id: 'V:1', name: 'Size/4', valuesByMode: { m1: 4 }, description: '', key: 'k1', scopes: [], variableCollectionId: 'C:1', remote: false },
    'V:2': { id: 'V:2', name: 'Size/8', valuesByMode: { m1: 8 }, description: '', key: 'k2', scopes: [], variableCollectionId: 'C:1', remote: false } };
  const coll = { id: 'C:1', name: 'Primitives', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: ['V:1', 'V:2'], remote: false, isExtension: false };
  const pg = { type: 'PAGE', name: 'Cover', children: [], findAll: () => [], findAllWithCriteria: () => [], findOne: () => null };
  const store = {};
  const figma = {
    fileKey: 'K', root: { name: 'Lib', type: 'DOCUMENT', children: [pg], getPluginData: () => '', setPluginData: () => { throw new Error('wrote'); }, findAllWithCriteria: () => [], findAll: () => [] },
    currentPage: { selection: [], name: 'Cover' }, skipInvisibleInstanceChildren: false,
    loadAllPagesAsync: async () => {}, on: () => {}, notify: (m) => posted.push({ type: 'notify', m }), closePlugin: () => {},
    showUI: (...a) => shown.push(a), ui: { postMessage: (m) => posted.push(m) },
    clientStorage: { getAsync: async (k) => store[k], setAsync: async (k, v) => { store[k] = v; }, deleteAsync: async (k) => { delete store[k]; } },
    variables: { getLocalVariableCollectionsAsync: async () => [coll], getVariableByIdAsync: async (id) => vars[id] || null, getVariableCollectionByIdAsync: async (id) => (id === 'C:1' ? coll : null) },
    getLocalTextStylesAsync: async () => [], getLocalPaintStylesAsync: async () => [], getLocalEffectStylesAsync: async () => [], getStyleByIdAsync: async () => null,
    createText: () => { throw new Error('drew'); }, createPage: () => { throw new Error('made a page'); }, createFrame: () => { throw new Error('made a frame'); },
  };
  new Function('module', 'figma', '__html__', fs.readFileSync(path.join(HERE, '..', 'code.js'), 'utf8'))({ exports: {} }, figma, '<ui/>');
  await figma.ui.onmessage({ type: 'hello' });
  const offer = posted.find((m) => m.type === 'stages');
  ok('opening offers the checks that apply: the file and its variables, no components, no icons', offer && JSON.stringify(offer.stages.map((s) => s.id)) === '["foundations","tokens"]', JSON.stringify(posted));
  ok('Run waits for the list of checks: the window opens with it disabled, and enables it only once the list has arrived', /<fig-button id="run"[^>]*\bdisabled\b/.test(ui) && /!loaded/.test(ui));
  // two clicks in quick succession, against a store that answers slowly: neither write may be lost to a stale read
  const slow = { getAsync: figma.clientStorage.getAsync, setAsync: figma.clientStorage.setAsync };
  figma.clientStorage.getAsync = async (k) => { await new Promise((res) => setTimeout(res, 5)); return slow.getAsync(k); };
  figma.clientStorage.setAsync = async (k, v) => { await new Promise((res) => setTimeout(res, 5)); return slow.setAsync(k, v); };
  await Promise.all([figma.ui.onmessage({ type: 'stages-set', id: 'tokens', on: false }), figma.ui.onmessage({ type: 'stages-set', id: 'foundations', on: false }), figma.ui.onmessage({ type: 'stages-set', id: 'tokens', on: true })]);
  ok('clicks are written one after another: two boxes unticked and one ticked again leave exactly the one off', JSON.stringify(store['stages-off']) === '["foundations"]', JSON.stringify(store['stages-off']));
  posted.length = 0;
  // the window sends no list of its own: what runs is what the plugin has stored
  await figma.ui.onmessage({ type: 'run', id: 1 });
  const done = posted.find((m) => m.type === 'done');
  ok('the run finishes with a report', !!done, JSON.stringify(posted).slice(0, 600));
  ok('Audit lite opened its own window once, and the snapshot plugin\'s code, run inside it, opened none', shown.length === 1 && shown[0][0] === '<ui/>', JSON.stringify(shown));
  ok('…and posted nothing to Audit lite\'s window (no progress of its own)', posted.every((m) => ['done', 'notify'].includes(m.type)), JSON.stringify(posted.map((m) => m.type)));
  ok('the variables check ran on the live file and found the undescribed tokens', done && /- Checks run: Variables & styles/.test(done.text) && /"rule": "tokens-description"/.test(done.text), done && done.text.split('## Run')[1].slice(0, 900));
  ok('…the switched-off and inapplicable checks are said', done && done.text.includes('File (switched off in the plugin)') && done.text.includes('Components (the file has no components)') && done.text.includes('Icons (the file has no icon page)'));
  // the file read as self-contained: with no components of its own, nothing binds its two variables, and the report says why
  ok('…no components scanned, so the window counts none; the two findings are the undescribed and the unused tokens', done && done.sets === null && done.found === 2 && /"rule": "tokens-unused"/.test(done.text) && done.text.includes('only this file\'s own components count as users'), JSON.stringify(done && { sets: done.sets, found: done.found }));
  ok('…and the facts mode leaves skipInvisibleInstanceChildren as it found it', figma.skipInvisibleInstanceChildren === false);

  // a run on a selection: a whole-file check reports the selection, never "switched off", though its box is unticked
  const button = { type: 'COMPONENT', name: 'Button', parent: pg, children: [], findAll: () => [] };
  figma.currentPage.selection = [button];
  posted.length = 0;
  await figma.ui.onmessage({ type: 'run', id: 2 });
  const sel = posted.find((m) => m.type === 'done');
  ok('on a selection, a whole-file check says a run on a selection checks only the selected components', sel && sel.text.includes('File (a run on a selection checks only the selected components)') && !sel.text.includes('File (switched off'), sel && sel.text.split('## Run')[1].slice(0, 900));
  figma.currentPage.selection = [];

  // the file cannot be read on opening: said as that, with a way to try again, never as an audit that stopped
  posted.length = 0;
  const cols = figma.variables.getLocalVariableCollectionsAsync;
  figma.variables.getLocalVariableCollectionsAsync = async () => { throw new Error('the document is closing'); };
  await figma.ui.onmessage({ type: 'stages-get' });
  const lf = posted.find((m) => m.type === 'load-failed');
  ok('a file whose facts cannot be read on opening says so, with the error, and nothing else', lf && lf.why === 'the document is closing' && !posted.some((m) => m.type === 'failed' || m.type === 'stages'), JSON.stringify(posted));
  ok('…the window then holds Run and offers Try again, which asks again', /msg\.type === 'load-failed'\) \{ loaded = false; canRun\(\); \$\('retry'\)\.hidden = false; say\('error', 'This file could not be read'/.test(ui) && /type: 'stages-get'/.test(ui));
  figma.variables.getLocalVariableCollectionsAsync = cols;
  posted.length = 0;
  await figma.ui.onmessage({ type: 'stages-get' });
  ok('…and a retry that reads the file offers its checks', posted.some((m) => m.type === 'stages'));
}

// The checks are one question in a fieldset whose legend puts it, in the fewest words (knowledge/ui/components/checkbox.md, *How*), and a
// list that has not changed is not rebuilt, so focus and a box just clicked stay as they are.
{
  ok('the checks sit in a fieldset whose legend puts the question', /<fieldset class="checks" id="checks" hidden>\s*<legend class="checks-title">What to check\?<\/legend>/.test(ui));
  ok('the window rebuilds the checkboxes only when the list of checks changes', /if \(same\) \{ canRun\(\); return; \}/.test(ui));
}

ok('the plugin has no way to write to the file', !/setPluginData|setSharedPluginData/.test(fs.readFileSync(path.join(HERE, '..', 'code.js'), 'utf8').split('/* audit-lite generated end */')[1]));

console.log(failed ? `${failed} failed, ${passed} passed` : `${passed} passed`);
process.exit(failed ? 1 : 0);
