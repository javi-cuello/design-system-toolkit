#!/usr/bin/env node
// What the dashboard computes and writes, held on its own source: that it
// scores with the shared model (scores.js), the words an audit ends with and the sweep's
// diff (audit.js), and the queue row it writes as markup (queue.js), with a
// Figma name in every field that reaches it. Run: node tools/docs-site/test-dashboard-logic.mjs
//
// The page is browser-only and its modules reach for the DOM when they load,
// so each pure function is lifted from its module's own text and run here
// with the real helpers it calls (labels.js, the record's isOpen and
// componentOf, lib/format.js). A function renamed or reshaped fails the lift,
// by name, rather than passing on a stale copy. What is DOM only (kpi, the
// run list, the changed list, the check catalogue) writes textContent for
// anything a file names; check.mjs reads that every module's names resolve.
// measures.js holds no pure function a test could hold apart from the DOM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as labels from './src/dashboard/labels.js';

let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

// lib/format.js, the real module (its one import.meta.env given a value, as test-lib.mjs does)
const fmtUrl = new URL('./src/lib/format.js', import.meta.url);
const F = await import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync(fmtUrl, 'utf8').replace('import.meta.env', "({ BASE_URL: '/' })").replace(/from '(\.[^']+)'/g, (_, p) => `from '${new URL(p, fmtUrl).href}'`)).toString('base64')}`);

/* A declaration lifted whole from a module's text: `function name(` or `const name = `, to its closing brace. */
const lift = (src, name, file) => {
  let a = src.indexOf(`function ${name}(`);
  if (a < 0) a = src.indexOf(`const ${name} = `);
  assert.ok(a >= 0, `${file} no longer declares ${name}: this test lifts it by name`);
  const line = src.slice(a, src.indexOf('\n', a));
  if (!line.includes('{') || /;\s*$/.test(line)) return line;                 // a one-line declaration
  let i = src.indexOf('{', a), d = 0;
  for (; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; }
  return src.slice(a, i + 1) + (src[a] === 'c' ? ';' : '');
};
const run = (src, names, file, ctx) => {
  const c = vm.createContext(ctx);
  vm.runInContext(names.map((x) => lift(src, x, file)).join('\n') + `\n;this.__ = { ${names.join(', ')} };`, c);
  return c.__;
};

// ---- the score model: applied by tools/figma-audit/score-model.mjs, tested there (test-scores.mjs) ----
ok('the page scores with the one model the score report uses, and holds no copy of it',
  /import \{ computeScores \} from '\.\.\/\.\.\/\.\.\/figma-audit\/score-model\.mjs'/.test(read('./src/dashboard/scores.js')) && !/function computeScores/.test(read('./src/dashboard/scores.js')));

// ---- the words an audit ends with, and the sweep's diff (audit.js) ----
const A = run(read('./src/dashboard/audit.js'), ['auditHeadline', 'auditDetail', 'diffPrints'], 'audit.js', { plural: F.plural, Object });
ok('a run that filed and closed says both', A.auditHeadline(3, 2, 40, 0, 3) === '3 new findings, 2 closed');
ok('a run that reopened says which were new and which came back', A.auditHeadline(3, 0, 40, 1, 3) === '2 new findings, 1 finding reopened');
ok('a run that filed nothing new never says "Nothing to fix" while findings stay open', A.auditHeadline(0, 0, 40, 0, 5) === '5 findings still open, all already in the queue');
ok('…and says nothing to fix only when nothing is', A.auditHeadline(0, 0, 1, 0, 0) === 'Nothing to fix in 1 component' && A.auditHeadline(0, 4, 40, 0, 0) === '4 rows closed');
ok('the detail line says what the scan raised and what survived, or that nothing was', A.auditDetail(9, 4, 4, 0) === '9 raised by the scan, 4 survived judgement' && A.auditDetail(0, 0, 0, 0) === 'Every component scanned and nothing raised.');
const diff = A.diffPrints({ Button: 'x', Card: 'y', Gone: 'z' }, { Button: 'x', Card: 'y2', New: 'w' });
ok('the sweep diff: changed, added and removed, each sorted, the unchanged in none', JSON.stringify(diff) === JSON.stringify({ changed: ['Card'], added: ['New'], removed: ['Gone'] }));
ok('a first sweep against no baseline adds everything', JSON.stringify(A.diffPrints(null, { b: 1, a: 1 })) === JSON.stringify({ changed: [], added: ['a', 'b'], removed: [] }));

// ---- the queue row (queue.js): every field a Figma file names reaches the markup escaped ----
const queue = read('./src/dashboard/queue.js');
const helpers = ['dated', 'SKILL_ID', 'said', 'STOCK_ADVICE', 'advice', 'problem', 'cell', 'contrastCells', 'COLUMNS'];
const Q = run(queue, helpers, 'queue.js', { esc: F.esc, fmtDate: F.date, sentence: (s) => { const t = String(s || '').trim(); return !t ? '' : (/[.!?:]$/.test(t) ? t : t + '.'); }, OWNER_LABEL: labels.OWNER_LABEL, ownerLabel: (o, t) => labels.ownerLabel(o, 'web', t), RegExp, Object, String, Array });
// the row's markup, lifted from build(): from the labelled-by ids to the end of the innerHTML it writes
const b = lift(queue, 'build', 'queue.js');
const from = b.indexOf("const row_ = "), to = b.indexOf("'</div>';", b.indexOf('row.innerHTML =')) + "'</div>';".length;
ok('build() still writes a row\'s markup in one innerHTML assignment', from > 0 && to > from);
const sevLabel = vm.runInNewContext(`(${queue.match(/export const SEV_LABEL = (\{[^\n]*\});/)[1]})`);
const rowHtml = (id, r, bucket = 'b1') => {
  const c = vm.createContext({ ...Q, esc: F.esc, SEV_LABEL: sevLabel, OWNER: labels.OWNER, LANDS: labels.LANDS, ownerLabel: (o, t) => labels.ownerLabel(o, 'web', t), id, r, bucket, n: '1.1', row: {} });
  vm.runInContext(b.slice(from, to), c);
  return c.row.innerHTML;
};
const NAME = '<img src=x onerror=alert(1)>';
const html = rowHtml(`n1-"${NAME}`, { where: `Button ${NAME} — panel`, sev: `warn"><script>1</script>`, owner: `x"${NAME}`, lands: 'figma', fix: ['&lt;b&gt;escaped by rows.mjs&lt;/b&gt;'], rec: ['Use `token`'], failedWhy: `Figma said ${NAME}` });
ok('a hostile name in the row\'s where, id, severity, owner and last failure never becomes an element', !/<img|<script/i.test(html), html);
// a value that ended its attribute early would leave an attribute of its own (onerror=) in the tag
const attrs = new Set([...html.matchAll(/<\w+((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/?>/g)].flatMap((m) => m[1].replace(/="[^"]*"/g, '').trim().split(/\s+/).filter(Boolean)));
const tags = new Set([...html.matchAll(/<(\w+)/g)].map((m) => m[1]));
ok('…and never ends an attribute early: the tags and attributes are the row\'s own, and its ids carry the quote as an entity',
  [...tags].every((t) => ['input', 'div', 'span', 'a', 'ul', 'li', 'p', 'label', 'textarea', 'button'].includes(t))
  && [...attrs].every((a) => !/^on/.test(a)) && attrs.has('aria-labelledby') && html.includes('id="tick-n1-&quot;&lt;img'), [...tags, ...attrs].join(' '));
ok('the where is shown as text, its dash and words kept', html.includes('Button &lt;img src=x onerror=alert(1)&gt; — panel'));
ok('a row the Figma file filed carries "Fix this" only in the first bucket', html.includes('>Fix this</button>') && !rowHtml('x', { where: 'A', fix: ['f'] }, 'b2').includes('Fix this'));
ok('an unknown lands value draws no tag', !rowHtml('x', { where: 'A', fix: ['f'], lands: `"${NAME}` }).includes('lands-tag'));
// a list-only file-wide row leads with its check, which is stored unescaped and may quote the file's names
const lead = Q.problem({ where: 'Page list', check: `page names differ: ${NAME}`, fix: ['Page list: a, b'] });
ok('a file-wide row leads with its check, escaped, then its list', lead.length === 2 && lead[0] === 'Page names differ: &lt;img src=x onerror=alert(1)&gt;.' && lead[1] === 'Page list: a, b', JSON.stringify(lead));
ok('a row that states its problem shows its fix lines as they are', JSON.stringify(Q.problem({ where: 'Button', check: 'x', fix: ['Button is dimmed twice'] })) === '["Button is dimmed twice"]');
ok('the stock advice the row\'s own buttons already offer is not repeated', Q.advice(['Fix it in Figma, or record a ruling.', 'Bind it to `space/4`', '']).join('|') === 'Bind it to `space/4`');
ok('a stored date reads as the page writes dates, in a cell', Q.cell('The fix', 'Raised on 2026-10-11').includes('<li>Raised on 11 Oct 2026</li>'));
ok('a skill named in a row\'s text is said by its chip\'s label', Q.said('Still raised by figma-components-audit on 2026-10-11') === 'Still raised by Components on 11 Oct 2026');
const two = Q.contrastCells({ fix: ['In Figma — a boolean', 'In MUI — a variant', 'A plain sentence — with a dash'], rec: ['In Figma: make it a variant', 'In code: add a prop', 'See the docs'] }, ['What differs', 'Pick one']);
ok('a comparison row splits only a labelled side, and offers the options as choices', (two.match(/class="side"/g) || []).length === 2 && two.includes('<li class="opt-note">A plain sentence — with a dash</li>') && (two.match(/class="opt"/g) || []).length === 2);
console.log(`${n}/${n} passed`);
