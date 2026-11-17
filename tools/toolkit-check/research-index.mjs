#!/usr/bin/env node
// node tools/toolkit-check/research-index.mjs [--root <dir>] — research/index.html carries every
// article in research/ and the same text, each with its researched and updated dates and, where its
// topic lists sub-topics, one of them: nothing builds the page, so an article added or edited
// without it was missing from the site, unseen (measuring-design-system-adoption, 2026-11-13).
// Reads the page's `const DATA = {…}` line; an article is research/<topic>/<slug>.md, bar _archive/
// and README.md. Exit 0 in step, 1 with the differences, 2 when the page could not be read.
import { readFileSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// lastChanged(key) gives the day research/<key>.md last changed in git, or nothing; `updated` may not be older
// words a reader reads: inline figures (svg) and HTML comments are not read as text
export const readWords = (md) => md.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<!--[\s\S]*?-->/g, '').split(/\s+/).filter(Boolean).length;
export const LENGTH_FROM = '2026-11-17';
export function differences(root, lastChanged = () => null) {
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
  // each entry says when it was researched and last updated, and sits in a sub-topic where its topic lists them
  const subs = Object.fromEntries((data.topics || []).map((t) => [t.id, t.subtopics]));
  for (const a of data.articles) {
    const M = '\\d{4}-(0[1-9]|1[0-2])', D = `${M}-(0[1-9]|[12]\\d|3[01])`;
    const r = a.researched || '', span = r.split('/');
    if (!new RegExp(`^(${D}|${M}|${M}/${M})$`).test(r) || (span[1] && span[1] <= span[0])) out.push(`${a.slug}: researched is "${a.researched ?? ''}", not a day, a month or a span of months (2026-11-12, 2026-08, 2026-08/2026-10)`);
    if (!new RegExp(`^${D}$`).test(a.updated || '')) out.push(`${a.slug}: updated is "${a.updated ?? ''}", not a day (2026-11-17)`);
    else if (a.researched && a.updated < a.researched.split('/')[0]) out.push(`${a.slug}: updated ${a.updated} is before researched ${a.researched}`);
    const changed = a.updated && lastChanged(`${a.topic}/${a.slug}`);
    if (changed && a.updated < changed) out.push(`${a.slug}: last changed ${changed}, but updated still says ${a.updated}`);
    // 20 minutes at 238 words a minute, the rate the page counts by; held from the day after the rule came in
    const words = files.has(`${a.topic}/${a.slug}`) ? readWords(files.get(`${a.topic}/${a.slug}`)) : 0;
    if (a.updated > LENGTH_FROM && words > 20 * 238) out.push(`${a.slug}: updated ${a.updated} and ${words} words, over 20 minutes (${20 * 238}): split it into its own questions or into Part 1 and Part 2, or move evidence to the knowledge base`);
    const st = subs[a.topic];
    if (st && !st.includes(a.subtopic)) out.push(`${a.slug}: subtopic "${a.subtopic ?? ''}" is not one of ${a.topic}'s: ${st.join(', ')}`);
    if (!st && a.subtopic) out.push(`${a.slug}: has subtopic "${a.subtopic}", but ${a.topic} lists none`);
  }
  return out;
}

const isMain = (() => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (isMain) {
  const i = process.argv.indexOf('--root');
  const root = i > 0 ? process.argv[i + 1] : join(fileURLToPath(new URL('../..', import.meta.url)), 'research');
  let out;
  // the author date (a rebase or a squash-merge on a later day keeps it, so a right `updated` stays right); a file edited and not yet committed changed today
  const run = (args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  try { run(['rev-parse', '--git-dir']); } catch { console.error(`research-index: git cannot read ${root}, so no updated date was held to its file`); process.exit(2); }
  const today = new Date().toLocaleDateString('sv-SE');
  const git = (key) => (run(['status', '--porcelain', '--', `${key}.md`]).trim() ? today : run(['log', '-1', '--format=%ad', '--date=short', '--', `${key}.md`]).trim() || null);
  try { out = differences(root, git); } catch (e) { console.error(`research-index: could not read ${root}: ${e.message}`); process.exit(2); }
  if (out.length) { console.log(out.join('\n')); process.exit(1); }
}
