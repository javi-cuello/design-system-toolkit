// Tests for kb-quotes.mjs: pairing, cut quotes, normalisation and the rendered fallback, offline.
import assert from 'node:assert/strict';
import { addedLines, check, extractQuotes, normalise, sourceUrl } from './kb-quotes.mjs';

let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; } catch (e) { fail++; console.log(`FAIL ${name}\n  ${e.message}`); } };

await t('a quote pairs with the next link on its line', () => {
  const [q] = extractQuotes('- Apple: "place the most important items" ([Apple HIG layout](https://a.example/layout)).');
  assert.equal(q.url, 'https://a.example/layout');
});

await t('a by-name back-reference pairs with the earlier link in its section, not the next link', () => {
  const md = ['## One', '- Polaris ([Polaris page](https://p.example/page)) says so.', '- Shopify: "Use small width for forms" (Polaris page); Atlassian ([Atlassian grid](https://a.example/grid)).'].join('\n');
  const [q] = extractQuotes(md);
  assert.equal(q.url, 'https://p.example/page');
});

await t('a back-reference to a link named earlier on the same line resolves', () => {
  const [, q] = extractQuotes('- A ([Carbon spacing](https://c.example/s)): "first quote here" ([Carbon spacing](https://c.example/s)); later "second quote here" (Carbon spacing).');
  assert.equal(q.url, 'https://c.example/s');
});

await t('a new section forgets the last one\'s link names', () => {
  const md = ['## One', '- [Polaris page](https://p.example/page)', '## Two', '- "a quote with no source" (Polaris page).'].join('\n');
  assert.equal(extractQuotes(md)[0].url, null);
});

await t('a quote cut with an ellipsis is checked part by part', () => {
  const [q] = extractQuotes('- "if a button color is 700 … it may not work" ([X](https://x.example))');
  assert.deepEqual(q.parts, ['if a button color is 700', 'it may not work']);
});

await t('strings in code spans and inside link text are not quotes', () => {
  assert.equal(extractQuotes('- `heading="Settings is here"` and [the "quoted title" link](https://x.example).').length, 0);
});

await t('normalise folds curly quotes, dashes, entities and tags', () => {
  assert.equal(normalise('<p>Don&#39;t&nbsp;lay — out</p>'), "don't lay - out");
  assert.equal(normalise('Don’t lay – out'), "don't lay - out");
  assert.equal(normalise('and “surroundedness” (or'), normalise("and 'surroundedness' (or"));
});

await t('a PubMed page is read through its text export', () => {
  assert.match(sourceUrl('https://pubmed.ncbi.nlm.nih.gov/9520318/'), /efetch\.fcgi\?db=pubmed.*id=9520318/);
});

await t('a quote missing from the raw page is found on the rendered one', async () => {
  const q = extractQuotes('- "only after script runs" ([X](https://x.example))');
  const miss = await check(q, { raw: async () => '<div id=root></div>', rendered: async () => 'Text only after script runs here' });
  assert.equal(miss.length, 0);
});

await t('a quote on neither page is reported', async () => {
  const q = extractQuotes('- "words the page never had" ([X](https://x.example))');
  const miss = await check(q, { raw: async () => 'other text', rendered: async () => 'still other text' });
  assert.equal(miss.length, 1);
});

await t('--from reads the added line numbers from a unified diff', () => {
  assert.deepEqual([...addedLines('@@ -3,0 +4,2 @@\n+a\n+b\n@@ -9 +11 @@\n')], [4, 5, 11]);
});

await t('a back-reference matches a link name by its start', () => {
  const md = ['## One', '- [Wertheimer 1923, translated](https://w.example/forms)', '- "the tendency of like parts" (Wertheimer 1923); NN/g ([NN/g similarity](https://n.example/sim)).'].join('\n');
  assert.equal(extractQuotes(md)[0].url, 'https://w.example/forms');
});

await t('every source in the bracket after a quote is a candidate', () => {
  const [q] = extractQuotes('- "use small width" ([Polaris page](https://p.example), [Shopify layout](https://s.example)).');
  assert.deepEqual(q.urls, ['https://p.example', 'https://s.example']);
});

await t('a quote found on any candidate passes', async () => {
  const [q] = extractQuotes('- "only on the second" ([A](https://a.example), [B](https://b.example)).');
  const miss = await check([q], { raw: async (u) => (u.includes('b.') ? 'text only on the second page' : 'nothing'), rendered: null });
  assert.equal(miss.length, 0);
});

await t('a bracket inside a code span is not the source bracket', () => {
  const md = ['## One', '- [Atlassian page header](https://a.example/ph)', '- "combined with search" , its bar `var(--ds-space-200,1pc)` below (Atlassian page header).'].join('\n');
  assert.equal(extractQuotes(md)[0].url, 'https://a.example/ph');
});

await t('two quotes before one bracket share its source', () => {
  const [a, b] = extractQuotes('- "first quote text", asking "second quote text?"; more (and [NN/g region](https://n.example/r)).');
  assert.equal(a.url, 'https://n.example/r'); assert.equal(b.url, 'https://n.example/r');
});

await t('a quote in a bracket that names its source after it pairs', () => {
  const md = ['## One', '- [Wertheimer 1923, translated](https://w.example/forms)', '- continuity ("The Factor of Direction", Wertheimer 1923) has none.'].join('\n');
  assert.equal(extractQuotes(md)[0].url, 'https://w.example/forms');
});

console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
