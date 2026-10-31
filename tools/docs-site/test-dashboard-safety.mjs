#!/usr/bin/env node
// What the dashboard does with text the Figma file wrote: renders it escaped,
// hands it to a model as data, and runs nothing a model wrote until a person
// has read it (toolkit review, 2026-10-31). Run: node tools/docs-site/test-dashboard-safety.mjs
//
// The page is browser-only, so the pure parts are lifted from its own source
// and run here, and the order of the fix path is read from it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const queue = read('./src/dashboard/queue.js');
const astro = read('./src/dashboard/Dashboard.astro');
// the site's own escaper, lifted: its module reads Astro's import.meta.env at load
const format = read('./src/lib/format.js');
const esc = vm.runInNewContext(format.slice(format.indexOf('export const esc = ') + 'export const esc = '.length, format.indexOf('\n', format.indexOf('export const esc = '))).replace(/;$/, ''));
const lift = (src, name) => { const a = src.indexOf(`const ${name} = `); return src.slice(a, src.indexOf('\n};', a) + 3); };
const fnBody = (src, name) => { const a = src.indexOf(`function ${name}(`); let i = src.indexOf('{', a), d = 0; for (; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; } return src.slice(a, i + 1); };

// a list-only row leads with its check, which rows.mjs stores as the scanner wrote it
const ctx = vm.createContext({ esc, sentence: (s) => String(s).trim() + '.' });
vm.runInContext(`${lift(queue, 'problem')}; this.problem = problem;`, ctx);
const hostile = 'names differ <img src=x onerror=alert(1)>';
const cells = ctx.problem({ where: 'Page list', check: hostile, fix: ['Page list: a, b'] });
ok('a row\'s check, quoting the file, reaches the markup cell escaped', cells[0].includes('&lt;img') && !cells[0].includes('<img'), cells[0]);

// Fix this: the model's code is shown and approved before the bridge runs it, and stored only then
const doRow = fnBody(queue, 'doRow');
const approve = doRow.indexOf('await approveFix(r, plan)'), stored = doRow.indexOf('appliedCode: plan.code'), run = doRow.indexOf('bridge.exec(plan.code)');
ok('Fix this runs the code only after the maintainer approves it, and records it only then', approve > 0 && approve < stored && stored < run && /return "cancelled"/.test(doRow));
ok('the approval shows the code as text, never markup', /fixDialogCode"\)\.textContent = plan\.code/.test(fnBody(queue, 'askToRun')) && !/innerHTML/.test(fnBody(queue, 'askToRun')));
ok('the dialog asks before it runs, with Cancel first and focused', /id="fixDialog"/.test(astro) && /value="cancel" autofocus/.test(astro) && /value="run">Run in Figma/.test(astro));
ok('Fix all stops at the first fix the maintainer cancels', /=== "cancelled"\) \{ stopped = ids\.length - i; break; \}/.test(fnBody(queue, 'doAllLike')));

// the fix prompt is filled with JSON strings, in one pass, which the template frames as data
for (const k of ['FINDING', 'REC', 'WHERE']) ok(`the fix prompt's ${k} is a JSON string, so a quote in a name cannot end it`, new RegExp(`${k}: JSON\\.stringify\\(`).test(doRow));
ok('the fix prompt is filled in one pass, so a {{…}} inside a value is left as written', /fixTemplate\.replace\(\/\\\{\\\{\(\[A-Z_\]\+\)\\\}\\\}\/g/.test(doRow) && !/fill\(fixPrompt/.test(doRow));
ok('a second approval waits for the first, and the dialog is never refilled while open', /approving\.then\(\(\) => askToRun/.test(queue) && /dlg\.open\) return Promise\.resolve\(false\)/.test(fnBody(queue, 'askToRun')));
const note = fnBody(queue, 'answerNote');
ok('the note prompt gives the file\'s text as JSON strings', ['THE FINDING: " + JSON.stringify(', 'THE ADVICE GIVEN: " + JSON.stringify(', 'THE COMPONENT: " + JSON.stringify('].every((x) => note.includes(x)));
console.log(`${n}/${n} passed`);
