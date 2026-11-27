// Tests for kb-quotes.mjs, offline: pairing, cut quotes, normalisation, the fetch cache, verdicts and --from.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, utimesSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addedLines, cached, check, extractQuotes, linesSince, normalise, sourceUrl } from './kb-quotes.mjs';

let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; } catch (e) { fail++; console.log(`FAIL ${name}\n  ${e.message}`); } };
const one = (md) => extractQuotes(md)[0];
const page = (text) => async () => ({ text });

// pairing
await t('a quote pairs with the link in the bracket after it', () => {
  assert.deepEqual(one('- Apple: "place the most important items" ([Apple HIG layout](https://a.example/layout)).').urls, ['https://a.example/layout']);
});
await t('a by-name back-reference pairs with the earlier link in its section, not the next link', () => {
  const md = ['## One', '- Polaris ([Polaris page](https://p.example/page)) says so.', '- Shopify: "Use small width for forms" (Polaris page); Atlassian ([Atlassian grid](https://a.example/grid)).'].join('\n');
  assert.deepEqual(one(md).urls, ['https://p.example/page']);
});
await t('a back-reference matches a link name by its start', () => {
  const md = ['## One', '- [Wertheimer 1923, translated](https://w.example/forms)', '- "the tendency of like parts" (Wertheimer 1923); NN/g ([NN/g similarity](https://n.example/sim)).'].join('\n');
  assert.deepEqual(one(md).urls, ['https://w.example/forms']);
});
await t('an ambiguous start keeps every link it could mean', () => {
  const md = ['## One', '- [Apple HIG layout](https://a.example/l) and [Apple HIG type](https://a.example/t)', '- "some quoted words" (Apple HIG).'].join('\n');
  assert.deepEqual(one(md).urls, ['https://a.example/l', 'https://a.example/t']);
});
await t('a short link name never matches by its start', () => {
  const md = ['## One', '- see [1](https://one.example)', '- "some quoted words" (12 px).'].join('\n');
  assert.deepEqual(one(md).urls, []);
});
await t('a new section forgets the last one\'s link names', () => {
  assert.deepEqual(one(['## One', '- [Polaris page](https://p.example/page)', '## Two', '- "a quote with no source" (Polaris page).'].join('\n')).urls, []);
});
await t('every source in the bracket after a quote is a candidate', () => {
  assert.deepEqual(one('- "use small width" ([Polaris page](https://p.example), [Shopify layout](https://s.example)).').urls, ['https://p.example', 'https://s.example']);
});
await t('a link right after a quote, before any bracket, is its source', () => {
  const [a, b] = extractQuotes('- [Material](https://m.example) "between 40 and 60 chars", [Spectrum](https://s.example) "roughly 70 characters".');
  assert.deepEqual(a.urls, ['https://m.example', 'https://s.example']);
  assert.deepEqual(b.urls, ['https://s.example']);
});
await t('a quote after "Name\'s [link](…):" pairs with that link too', () => {
  assert.ok(one("- Primer's [dialog](https://p.example/d) on linking: \"avoid using a Dialog altogether\" and more.").urls.includes('https://p.example/d'));
});
await t('a bracket inside a code span is not the source bracket', () => {
  const md = ['## One', '- [Atlassian page header](https://a.example/ph)', '- "combined with search" , its bar `var(--ds-space-200,1pc)` below (Atlassian page header).'].join('\n');
  assert.deepEqual(one(md).urls, ['https://a.example/ph']);
});
await t('two quotes before one bracket share its source', () => {
  const [a, b] = extractQuotes('- "first quote text", asking "second quote text?"; more (and [NN/g region](https://n.example/r)).');
  assert.deepEqual(a.urls, ['https://n.example/r']); assert.deepEqual(b.urls, ['https://n.example/r']);
});
await t('a quote in a bracket that names its source after it pairs', () => {
  const md = ['## One', '- [Wertheimer 1923, translated](https://w.example/forms)', '- continuity ("The Factor of Direction", Wertheimer 1923) has none.'].join('\n');
  assert.deepEqual(one(md).urls, ['https://w.example/forms']);
});
await t('a url with brackets in it is read whole', () => {
  assert.deepEqual(one('- "theming is done here" ([docs](https://g.example/docs/(root)/theming.mdx)).').urls, ['https://g.example/docs/(root)/theming.mdx']);
});

await t('a bracket after the next sentence is not this quote\'s source', () => {
  const qs = extractQuotes("- Apple's [modality](https://a.example/m): avoid \"an app within your app\". Geist: \"Skip Modal for routine flows\" ([Geist modal](https://g.example/m)).");
  assert.ok(qs[0].urls.includes('https://a.example/m')); assert.deepEqual(qs[1].urls, ['https://g.example/m']);
});
await t('a link before several quotes is a candidate for each', () => {
  const [, b] = extractQuotes('- [Spectrum](https://s.example) "roughly 70 characters wide", "at least between 50 and 120". More.');
  assert.ok(b.urls.includes('https://s.example'));
});

// what counts as a quote
await t('a quote keeps the code spans inside it', () => {
  assert.equal(one('- MUI divides "space among all flex columns by their `flex` value" ([MUI](https://m.example)).').quote, 'space among all flex columns by their `flex` value');
});
await t('strings in code spans, fenced blocks, HTML lines and link text are not quotes', () => {
  assert.equal(extractQuotes(['- `heading="Settings is here"` and [the "quoted title" link](https://x.example).', '```', 'x = "inside a fence here"', '```', '<th scope="column header">'].join('\n')).length, 0);
});
await t('an inch mark does not open a quote', () => {
  assert.deepEqual(extractQuotes('- a 12" screen and "quoted words here" ([X](https://x.example)).').map((q) => q.quote), ['quoted words here']);
});
await t('a quote cut with an ellipsis is checked part by part; a cut of short parts is checked whole', () => {
  assert.deepEqual(one('- "if a button color is 700 … it may not work" ([X](https://x.example))').parts, ['if a button color is 700', 'it may not work']);
  assert.deepEqual(one('- "abc … abc def" ([X](https://x.example))').parts, ['abc def']);
  assert.deepEqual(one('- "abc … abc" and more words ([X](https://x.example))').parts, ['abc … abc']);
});

// normalisation
await t('normalise folds curly quotes, dashes, entities, tags, nested quotes and markdown links', () => {
  assert.equal(normalise('<p>Don&#39;t&nbsp;lay — out</p>'), "don't lay - out");
  assert.equal(normalise('Don’t lay – out'), "don't lay - out");
  assert.equal(normalise('and “surroundedness” (or'), normalise("and 'surroundedness' (or"));
  assert.equal(normalise('use the [width override classes](/styles/#w) to set'), 'use the width override classes to set');
});
await t('a PubMed page is read through its text export', () => {
  assert.match(sourceUrl('https://pubmed.ncbi.nlm.nih.gov/9520318/'), /efetch\.fcgi\?db=pubmed.*id=9520318/);
});

// verdicts
await t('a quote missing from the raw page is found on the rendered one', async () => {
  const { missing } = await check(extractQuotes('- "only after script runs" ([X](https://x.example))'), { raw: page('<div id=root></div>'), rendered: page('Text only after script runs here') });
  assert.equal(missing.length, 0);
});
await t('a quote on neither page is missing', async () => {
  const { missing } = await check(extractQuotes('- "words the page never had" ([X](https://x.example))'), { raw: page('other text'), rendered: page('still other text') });
  assert.equal(missing.length, 1);
});
await t('a quote found on any candidate passes', async () => {
  const { missing } = await check(extractQuotes('- "only on the second" ([A](https://a.example), [B](https://b.example)).'), { raw: async (u) => ({ text: u.includes('b.') ? 'text only on the second page' : 'nothing' }), rendered: null });
  assert.equal(missing.length, 0);
});
await t('a source that cannot be read is unreachable, not missing', async () => {
  const { missing, unreachable } = await check(extractQuotes('- "words on a page we cannot read" ([X](https://x.example))'), { raw: async () => ({ error: 'HTTP 403' }), rendered: async () => ({ error: 'render: timeout' }) });
  assert.equal(missing.length, 0); assert.equal(unreachable.length, 1); assert.match(unreachable[0].errors.join(), /HTTP 403/);
});

// the cache
await t('the cache keeps only fetched text, refetches after a week and under --fresh', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kbq-test-'));
  try {
    assert.deepEqual(await cached(dir, 'raw', 'https://e.example', async () => ({ error: 'HTTP 404' })), { error: 'HTTP 404' });
    assert.equal(readdirSync(dir).length, 0);
    assert.equal((await cached(dir, 'raw', 'https://e.example', async () => ({ text: 'first' }))).text, 'first');
    assert.equal((await cached(dir, 'raw', 'https://e.example', async () => ({ text: 'second' }))).text, 'first');
    assert.equal((await cached(dir, 'raw', 'https://e.example', async () => ({ text: 'third' }), { fresh: true })).text, 'third');
    const [f] = readdirSync(dir); const old = (Date.now() - 8 * 24 * 3600 * 1000) / 1000; utimesSync(join(dir, f), old, old);
    assert.equal((await cached(dir, 'raw', 'https://e.example', async () => ({ text: 'fourth' }))).text, 'fourth');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// --from
await t('--from reads the added line numbers from a unified diff', () => {
  assert.deepEqual([...addedLines('@@ -3,0 +4,2 @@\n+a\n+b\n@@ -9 +11 @@\n')], [4, 5, 11]);
});
await t('--from on a real repo: added lines of a tracked file, every line of an untracked one', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kbq-git-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
  try {
    git('init', '-q'); git('config', 'user.email', 't@example.com'); git('config', 'user.name', 't');
    writeFileSync(join(dir, 'a.md'), 'one\ntwo\n'); git('add', 'a.md'); git('commit', '-qm', 'a');
    writeFileSync(join(dir, 'a.md'), 'one\nnew\ntwo\n');
    writeFileSync(join(dir, 'b.md'), 'untracked\n');
    assert.deepEqual([...linesSince(join(dir, 'a.md'), 'HEAD')], [2]);
    assert.equal(linesSince(join(dir, 'b.md'), 'HEAD'), null);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
