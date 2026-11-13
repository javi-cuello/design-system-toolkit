#!/usr/bin/env node
// node tools/toolkit-check/research-index.mjs [--root <dir>] — research/index.html carries every
// article in research/ and the same text: nothing builds the page, so an article added or edited
// without it was missing from the site, unseen (measuring-design-system-adoption, 2026-11-13).
// Reads the page's `const DATA = {…}` line; an article is research/<topic>/<slug>.md, bar _archive/
// and README.md. Exit 0 in step, 1 with the differences, 2 when the page could not be read.
import { readFileSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function differences(root) {
  const page = readFileSync(join(root, 'index.html'), 'utf8');
  const line = page.split('\n').find((l) => l.startsWith('const DATA = '));
  if (!line) throw new Error('index.html has no `const DATA = ` line');
  const data = JSON.parse(line.slice('const DATA = '.length).replace(/;\s*$/, ''));
  const files = new Map();
  for (const topic of readdirSync(root)) {
    if (topic.startsWith('_') || topic.startsWith('.') || !statSync(join(root, topic)).isDirectory()) continue;
    for (const f of readdirSync(join(root, topic))) {
      if (f.endsWith('.md') && f !== 'README.md' && statSync(join(root, topic, f)).isFile()) files.set(`${topic}/${f.slice(0, -3)}`, readFileSync(join(root, topic, f), 'utf8'));
    }
  }
  const out = [];
  const listed = new Set();
  const seen = new Set();
  for (const a of data.articles) {
    const key = `${a.topic}/${a.slug}`;
    if (seen.has(a.slug)) out.push(`index.html lists the slug ${a.slug} twice: the page finds an article by slug alone`);
    seen.add(a.slug);
    listed.add(key);
    if (!files.has(key)) out.push(`index.html lists ${key}, but research/${key}.md is not there`);
    else if (files.get(key) !== a.md) out.push(`research/${key}.md was edited and index.html still holds the old text`);
  }
  for (const key of files.keys()) if (!listed.has(key)) out.push(`research/${key}.md is missing from index.html`);
  return out;
}

const isMain = (() => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (isMain) {
  const i = process.argv.indexOf('--root');
  const root = i > 0 ? process.argv[i + 1] : join(fileURLToPath(new URL('../..', import.meta.url)), 'research');
  let out;
  try { out = differences(root); } catch (e) { console.error(`research-index: could not read ${root}: ${e.message}`); process.exit(2); }
  if (out.length) { console.log(out.join('\n')); process.exit(1); }
}
