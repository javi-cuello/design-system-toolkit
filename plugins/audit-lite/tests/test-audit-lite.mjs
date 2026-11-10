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
const { report, settingsFor, LITE, scan, foundations } = /** @type {any} */ (mod.exports);
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

// The page: filled as Claude fills it, rendered against a stub document.
const page = (data) => {
  const js = LITE.template.split('<script>')[1].split('</script>')[0].replace('const DATA = null;', 'const DATA = ' + JSON.stringify(data) + ';');
  const app = { innerHTML: '' };
  new Function('document', js)({ getElementById: () => app });
  return app.innerHTML;
};
const data = { file: 'Lib <b>', fileKey: 'ABC123', date: '2026-11-10', scanned: { sets: 2, variants: 9 }, coverage: 90, kept: 3, dropped: 1, notScanned: ['Spacing scale'],
  rows: [
    { bucket: 3, sev: 'warning', visible: false, set: 'Chip', setId: '1:2', layer: '', issue: 'a', fix: 'b' },
    { bucket: 3, sev: 'error', visible: true, set: 'Button', setId: '1:3', layer: 'Label', issue: 'c', fix: 'd' },
    { bucket: 'b1', sev: 'error', visible: false, set: '<img src=x onerror=alert(1)>', setId: '1:4', layer: '', issue: 'e', fix: 'f' },
  ] };
const html = page(data);
ok('an empty page renders nothing', page(null) === '');
ok('a "b1" bucket counts as bucket 1', html.includes('1 · Safe fixes'));
ok('a user-visible row leads its bucket as 3.1', /3\.1<\/td><th scope="row" class="where"><a [^>]*><code>Button › Label<\/code><\/a><\/th>/.test(html), html);
ok('the place is the row\'s header and seen-by-users its own column', html.includes('<td class="sev error">error</td><td>Yes</td>'));
ok('file text is escaped', !html.includes('<img') && !html.includes('Lib <b>'));
ok('a row links to its set', html.includes('href="https://www.figma.com/design/ABC123?node-id=1-3"'));
ok('every table has a caption and column headers', (html.match(/<caption/g) || []).length === 2 && html.includes('scope="col"'));
ok('the run\'s scope has its heading', html.includes('<h2>About this run</h2>') && html.includes('Not checked in this run'));

console.log(failed ? `${failed} failed, ${passed} passed` : `${passed} passed`);
process.exit(failed ? 1 : 0);
