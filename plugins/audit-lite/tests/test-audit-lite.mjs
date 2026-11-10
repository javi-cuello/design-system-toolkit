// Builds an Audit lite report from the components scanner's fixture and renders the report page, with no Figma.
//   node plugins/audit-lite/tests/test-audit-lite.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const mod = { exports: {} };
new Function('module', fs.readFileSync(path.join(HERE, '..', 'code.js'), 'utf8'))(mod);
const { report, LITE, scan } = /** @type {any} */ (mod.exports);

let failed = 0, passed = 0;
const ok = (name, cond, detail = '') => { if (cond) passed++; else { failed++; console.log('FAIL ' + name + (detail ? '\n  ' + detail : '')); } };

// The scan: the scanner body returns checkFacts with no figma in scope, as in its own tests.
const FX = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills/figma-components-audit/tests/fixtures/library-slice.json'), 'utf8'));
const checkFacts = await scan([], LITE.scales, LITE.tokens);
const r = await checkFacts({ pages: FX.pages }, LITE.tokens, LITE.scales, [], async (id) => (id in FX.vars ? FX.vars[id] : null), FX.file);
const found = r.audited.reduce((n, s) => n + s.candidates.length, 0);
ok('the fixture raises candidates under the house settings', found > 0, 'found ' + found);
ok('no page filter, so every page is walked', !('componentPages' in LITE.tokens));
ok('a derived key is not listed as a skipped check', !LITE.unset.some((u) => ['componentPages', 'excludeSections'].includes(u.key)));
ok('a project-only key is listed as a skipped check', LITE.unset.some((u) => u.key === 'semantic' && u.means));

const md = report(r, { fileName: 'Fixture library', fileKey: 'ABC123', date: '2026-11-10' });
const top = md.split('\n').filter((l) => /^#{1,2} /.test(l));
ok('the report\'s outline is its own sections, the conventions nested below',
  JSON.stringify(top) === JSON.stringify(['# Audit lite report: Fixture library', '## What to do when the person asks for the results', '## Rules for the rows',
    '## The settings this run used', '## Run', '## Judgement', '## Buckets', '## Report template', '## Candidates']), JSON.stringify(top));
ok('no placeholder of the judge prompt is left', !/\{\{[A-Z]+\}\}/.test(md));
ok('the house conventions are listed from the settings', md.includes('the state axis is "' + LITE.tokens.stateAxis + '"'));
const cands = JSON.parse(md.split('## Candidates')[1].replace(/^\s*```json\n/, '').replace(/\n```\s*$/, ''));
ok('every candidate reaches the report', cands.reduce((n, s) => n + s.candidates.length, 0) === found);
ok('a candidate carries what the rows need', cands.every((s) => s.setId && s.candidates.every((c) => c.sev && c.rule && c.key && c.text && c.advice)));
ok('the template reaches the report whole', md.includes(LITE.template.trim()));
ok('a report with no file key says it has no links', report(r, { fileName: 'X', fileKey: null, date: 'd' }).includes('no Figma links'));

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
