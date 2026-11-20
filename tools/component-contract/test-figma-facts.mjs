/* The Figma facts store (figma-facts.json): every fact well formed, one not checked naming its settling check, and every
   figma-fact:<id> cited in the toolkit's code and standards an entry there, so an assumption about Figma is never
   written from memory and left to drift. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const { facts } = JSON.parse(fs.readFileSync(path.join(HERE, 'figma-facts.json'), 'utf8'));
const STATUS = ['checked', 'derived', 'believed', 'unchecked'];
const ids = new Set();
for (const f of facts) {
  assert.match(f.id || '', /^[a-z0-9-]+$/, `a fact's id is kebab-case: ${f.id}`);
  assert.ok(!ids.has(f.id), `one entry per fact: ${f.id}`); ids.add(f.id);
  assert.ok(STATUS.includes(f.status), `${f.id}: status is one of ${STATUS.join(', ')}`);
  assert.ok(f.fact && f.source, `${f.id}: says the fact and where it comes from`);
  if (f.status === 'checked' || f.status === 'derived') assert.match(f.on || '', /^\d{4}-\d{2}-\d{2}$/, `${f.id}: dated`);
  if (f.status !== 'checked') assert.ok(f.settles, `${f.id}: ${f.status}, so it names the check that settles it`);
}
const cited = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (e.isDirectory()) { if (!/^(node_modules|\..*|_archive)$/.test(e.name)) walk(path.join(d, e.name)); continue; }
  if (!/\.(mjs|cjs|js|ts|md|html|py|sh|json)$/.test(e.name) || /^(test-figma-facts\.mjs|figma-facts\.json|package-lock\.json)$/.test(e.name)) continue;
  // (a citation is taken whole up to its first character no id holds, so a misspelt one fails rather than vanishes)
  for (const m of fs.readFileSync(path.join(d, e.name), 'utf8').matchAll(/figma-fact:\s*([^\s,;)`'"]*)/g)) cited.push([path.relative(ROOT, path.join(d, e.name)), m[1].replace(/[.:]$/, '')]);
} };
for (const d of ['tools', 'skills', 'standards', 'plugins', 'knowledge', 'bin']) if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d));
const unknown = cited.filter(([, id]) => id !== '<id>' && !ids.has(id)); // (`<id>`: the form, as a README writes it)
assert.deepEqual(unknown, [], 'every figma-fact:<id> cited is an entry in figma-facts.json');
assert.ok(cited.length > 0, 'the store is cited: a store nothing cites is a list, not a check');
console.log(`figma facts: ${facts.length} facts, ${cited.length} citations, all resolve`);
