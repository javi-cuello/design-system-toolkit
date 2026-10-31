// node tools/docs-site/test-format.mjs — the site's one percent formatter.
// src/lib/format.js reads Vite's import.meta.env and cannot load in plain Node,
// so the formatter's own line is read out of it and run with an en-GB `lang`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./src/lib/format.js', import.meta.url), 'utf8');
const line = src.match(/^export const percent = (.+);$/m);
assert.ok(line, 'src/lib/format.js defines percent on one line');
const percent = new Function('lang', `return ${line[1]};`)(() => 'en-GB');

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
ok('99.97% is not said as 100', percent(99.97) === '99.9%');
ok('a whole 0 and 100 are said whole', percent(0) === '0%' && percent(100) === '100%');
ok('one decimal always', percent(50) === '50.0%' && percent(12.34) === '12.3%');
ok('a float just under a step does not floor a step low', percent(0.29 * 100) === '29.0%');
const dash = readFileSync(new URL('./src/dashboard/format.js', import.meta.url), 'utf8');
ok('the dashboard has no formatter of its own', !/export const pct\b/.test(dash) && /percent\b.*from "\.\.\/lib\/format\.js"/.test(dash));
console.log(`\n${n} passed`);
