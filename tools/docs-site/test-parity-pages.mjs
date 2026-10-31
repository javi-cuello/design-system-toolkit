#!/usr/bin/env node
/*
 * Parity's pages, as a reader sees them: the formatting rules in
 * src/lib/parity.js, and every built Parity › Visual page
 * (<project home>/site/parity/visual/index.html) held to the rules a person
 * set for it on 2026-10-06. A project with no built site is said, not passed.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { colour, shown, props, componentTitle, brief } from './src/lib/parity.js';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

{
  const c = { props: [{ prop: 'size', figma: 'Size', findings: [{ kind: 'missing', detail: 'code does not offer xs' }, { kind: 'renamed', detail: 'size in design, scale in code' }] }, { prop: 'tone', figma: 'Tone', findings: [{ kind: 'not-in-code', detail: '' }] }],
    groups: [{ verdict: 'differs', element: 'root/labelText', field: 'color', token: 'Color/Text/primary', count: 2, of: 4, where: { every: false, shared: { disabled: true } }, seen: [{ want: 'rgb(17, 17, 17)', got: 'rgb(34, 34, 34)' }] }, { verdict: 'looks-same', element: 'root', field: 'background', seen: [] }] };
  const b = brief('Button', c);
  ok('a brief asks the code for what it lacks and each value it draws otherwise, where it shows; never a rename to undo, nor what looks the same',
    b === 'Button: make the code match Figma\n- Size: code does not offer xs\n- Tone: add a prop that does this; the code has none\n- Label text color: Color/Text/primary (#111111) in Figma, #222222 in code; 2 of 4 combinations (disabled)'
    && brief('X', { ...c, props: [], suspect: ['doubt'] }) === null);
}

ok('a paint with no colour reads as nothing, never as an object', shown('border-color', {}) === 'nothing');

ok('one way to write a colour, whatever each side wrote: hex, and the opacity where there is one',
  colour('rgb(94, 0, 7)') === '#5e0007' && colour('rgba(22, 22, 22, 0.075)') === '#161616 7.5%' && colour('rgb(22 22 22 / 0.644)') === '#161616 64.4%'
  && colour('color(srgb 0.0553322 0.0553322 0.0553322 / 0.111529)') === '#0e0e0e 11.2%' && colour('#c40d22') === '#c40d22');
ok('a length in px, a weight as a number, nothing drawn said so', shown('radius', 8) === '8px' && shown('font-weight', 500) === '500' && shown('radius', null) === 'nothing');
ok("a combination names only what it changes from the contract's defaults; a text prop never",
  props({ labelText: 'Label', feedback: 'danger', state: 'hover', disabled: false }, { feedback: 'neutral', state: 'rest', disabled: false }) === 'feedback danger, state hover'
  && props({ feedback: 'neutral' }, { feedback: 'neutral' }) === 'Default');
ok('a component\'s title drops its folder and status marker, never the words after a " / " in its own name',
  componentTitle('x', { figma: 'Stepper/Stepper - Step item / Vertical' }) === 'Stepper - Step item / Vertical' && componentTitle('x', { figma: 'Accordion/🚧 Accordion' }) === 'Accordion');

// the built pages
const { homes } = createRequire(import.meta.url)('../snapshot/projects.cjs');
const homeOf = Object.fromEntries(homes().map((h) => [h.name, h.home]));
const labels = Object.keys(homeOf);
let built = 0;
for (const label of labels) {
  const f = path.join(homeOf[label], 'site', 'parity', 'visual', 'index.html');
  if (!fs.existsSync(f)) continue;
  built++;
  const html = fs.readFileSync(f, 'utf8');
  // a page with no table of differences has nothing to hold to these rules: said, not counted
  if (!/<table class="table diffs"/.test(html)) { console.log(`-- ${label}: its Visual page has no table yet (no code audit run), so nothing was checked there`); built--; continue; }
  const tables = [...html.matchAll(/<table class="table diffs"[^>]*>([\s\S]*?)<\/table>/g)].map((m) => m[1]);
  const rows = tables.flatMap((t) => [...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]).filter((r) => /<td/.test(r)));
  // the row's header cell (What) and its data cells, in column order
  const cells = (r) => [...r.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1]);
  const text = (h) => h.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  ok(`${label}: no colour in the tables written as rgb(), rgba() or color()`, !rows.some((r) => /\b(rgba?|color)\(/.test(text(r))));
  // a differing row's Code cell: the value, then the token or text style it uses, or why there is none
  const differing = rows.filter((r) => /Code differs|Code looks the same/.test(r));
  // a second line with words in it, not a line break alone
  const bare = differing.filter((r) => { const c = cells(r)[3] || ''; return !/<br[^>]*>\s*<span[^>]*>[^<\s][^<]*/.test(c) && !/>0<\/code>/.test(c); });
  ok(`${label}: every differing code value says its token, its text style, or why there is none (${differing.length} rows)`, !bare.length || console.log(bare.map((r) => text(cells(r)[0]))));
  // the rule as built: the five data columns share one width, Details is narrower than it
  // the page's own CSS and the stylesheets it links, as the browser reads them
  const site = path.join(homeOf[label], 'site');
  const linked = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="\/([^"]+\.css)"/g)].map((m) => path.join(site, m[1])).filter((x) => fs.existsSync(x));
  const css = [html, ...linked.map((x) => fs.readFileSync(x, 'utf8'))].join('\n').replace(/\[data-astro-cid-[^\]]+\]/g, '');
  // the last rule naming the column itself (not a descendant of it) and its own inline-size, as the browser applies it
  const widths = Object.fromEntries(['what', 'where', 'design', 'code', 'verdict', 'details'].map((k) => [k, ([...css.matchAll(new RegExp(`\\.diffs__${k}(?=[\\s,{])[^{]*\\{[^}]*?(?<![\\w-])inline-size:\\s*([\\d.]+)%`, 'g'))].pop() || [])[1]]));
  ok(`${label}: five columns of one width and a narrower Details (${JSON.stringify(widths)})`, ['what', 'where', 'design', 'code', 'verdict'].every((k) => widths[k] && widths[k] === widths.what) && widths.details && +widths.details < +widths.what);
  ok(`${label}: the values dialog marks nothing on Parity`, !/values-dialog[\s\S]*?<mark/.test(html));
  // nothing left out of the comparison goes unsaid: each gap the report holds is a row on the page
  const reportFile = path.join(homeOf[label], 'parity', 'report.json');
  const gaps = fs.existsSync(reportFile) ? Object.values(JSON.parse(fs.readFileSync(reportFile, 'utf8')).components || {}).filter((c) => !c.draft && !c.error).reduce((n, c) => n + (c.notCompared || []).length, 0) : 0;
  // rows that read the same are one row with a count, so the page's rows and counts add up to the report's
  const shownGaps = [...html.matchAll(/<tr[^>]*>(?:(?!<\/tr>)[\s\S])*?>Not compared<(?:(?!<\/tr>)[\s\S])*?<\/tr>/g)].reduce((n, m) => n + (+((m[0].match(/×(\d+)/) || [])[1] || 1)), 0);
  ok(`${label}: every value not compared is a row saying why (${gaps} in the report)`, shownGaps === gaps);
  ok(`${label}: no combination lists a text prop`, !/labelText|valueText|titleText/.test(html));
  // one wording on every Parity page: a difference is said of the code against Figma, a thing one side has alone is
  // "Only in Figma" or "Only in code"; the retired words read as comparing both ways
  const retired = /\b(Not in code|Missing in code|Same on screen|Named differently|Code has more|Code lacks it|Code adds it)\b/;
  const pages = ['', 'overview', 'tokens', 'properties', 'visual'].map((p) => path.join(homeOf[label], 'site', 'parity', p, 'index.html')).filter((x) => fs.existsSync(x));
  const stale = pages.filter((x) => retired.test(fs.readFileSync(x, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')));
  ok(`${label}: no Parity page uses a retired verdict word (${pages.length} pages)`, !stale.length || console.log(stale));
}
console.log(built ? `${n}/${n} passed` : `${n}/${n} passed; no project has a built Parity page, so only the formatting was checked`);
