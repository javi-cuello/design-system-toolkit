#!/usr/bin/env node
// src/lib/format.js, the formatting every page and the dashboard share, run as
// the real module: escaping (a Figma name or description goes into HTML through
// esc and md), a set's name on its page, the set a page is about, and dates and
// counts. Run: node tools/docs-site/test-lib.mjs
//
// The module reads Vite's import.meta.env, which plain Node does not have, so
// it is loaded from its own source with that one expression given a value and
// its relative imports made absolute; nothing else in it is touched.
// The rest of src/lib is tested where it is used: parity.js by test-parity-pages,
// facts.js by test-changelog, percent by test-format. activity, changes, ladder,
// measures, project, readiness, snapshot and tracker compute a project's pages
// when they load, so they are run by the docs build and held by check-structure
// on each built site, not here.
import assert from 'node:assert/strict';
import fs from 'node:fs';

let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const url = new URL('./src/lib/format.js', import.meta.url);
const src = fs.readFileSync(url, 'utf8');
ok('format.js still reads import.meta.env once, the one thing given a value here', (src.match(/import\.meta\.env/g) || []).length === 1);
const loaded = src.replace('import.meta.env', "({ BASE_URL: '/docs/' })").replace(/from '(\.[^']+)'/g, (_, p) => `from '${new URL(p, url).href}'`);
const F = await import(`data:text/javascript;base64,${Buffer.from(loaded).toString('base64')}`);

// escaping: what a Figma file names reaches the page as text
const hostile = `Button "primary" <img src=x onerror=alert(1)> & 'co'`;
const e = F.esc(hostile);
ok('esc turns every character that could open markup or end an attribute into an entity',
  e === 'Button &quot;primary&quot; &lt;img src=x onerror=alert(1)&gt; &amp; &#39;co&#39;', e);
ok('esc of a non-string says it as text', F.esc(12) === '12' && F.esc(null) === 'null');
const d = F.md('Use `<Icon>` for **<b>bold</b>** & <script>alert(1)</script>');
ok('md escapes first, so a description\'s own tags stay text, and only `code` and **bold** become markup',
  d === 'Use <code>&lt;Icon&gt;</code> for <strong>&lt;b&gt;bold&lt;/b&gt;</strong> &amp; &lt;script&gt;alert(1)&lt;/script&gt;', d);
ok('md cannot be made to write an attribute: a backtick inside quotes stays inside the code element',
  !/<code [^>]/.test(F.md('`" onmouseover="x`')) && F.md('`" onmouseover="x`') === '<code>&quot; onmouseover=&quot;x</code>');
ok('the base path is the site\'s, without its trailing slash', F.base === '/docs');

// a set's name on its page
ok('a part drops the page\'s title, its separator and Figma\'s private underscore', F.partName('Tabs - Tab item', 'Tabs') === 'Tab item' && F.partName('_Tabs/Tab item', 'Tabs') === 'Tab item');
ok('the title is cut only on a word boundary', F.partName('Tables/Cell', 'Table') === 'Cell' && F.partName('Tablet frame', 'Table') === 'Tablet frame');
ok('a part named as its page keeps its name rather than becoming nothing', F.partName('Tabs', 'Tabs') === 'Tabs');
ok('a status marker leading the name is not part of it', F.partName('🚧 Tabs - Tab item', 'Tabs') === 'Tab item');

// the set a page is about
const page = (title, ...names) => ({ title, components: names.map((name) => ({ name, private: name.startsWith('_') })) });
ok('the set named for the page, though another comes first', F.mainSet(page('Accordion', '_Accordion item', 'Accordion')).name === 'Accordion');
ok('…under its category and marker too', F.mainSet(page('Accordion', 'Accordion/Item', 'Accordion/🚧 Accordion')).name === 'Accordion/🚧 Accordion');
ok('else the first public set, else the first', F.mainSet(page('Card', '_Card base', 'Card header')).name === 'Card header' && F.mainSet(page('Card', '_a', '_b')).name === '_a');

// dates and counts, in the page's language (en-GB with no document), in UTC
ok('a date is said in UTC: a run at 23:30Z is that day, not the next', F.date('2026-10-31T23:30:00Z') === '31 Oct 2026' && F.day('2026-10-31T23:30:00Z') === '31 Oct');
ok('what is not a date says nothing, never "Invalid Date"', F.date('soon') === null && F.date('') === null && F.month(undefined) === null);
ok('a count carries its noun, singular for one', F.plural(1, 'token') === '1 token' && F.plural(0, 'token') === '0 tokens' && F.plural(31381, 'row') === '31,381 rows');
ok('a number that is not one is said as written', F.num(NaN) === 'NaN' && F.num('12') === '12');
globalThis.__docsLanguage = 'en-US';
ok('the project\'s language is the dialect', F.date('2026-09-22T00:00:00Z') === 'Sep 22, 2026');
globalThis.__docsLanguage = 'British English';
ok('a language tag the runtime does not know falls back rather than throwing on every page', F.date('2026-09-22T00:00:00Z') === '22 Sept 2026');
console.log(`${n}/${n} passed`);
