#!/usr/bin/env node
/*
 * A README a newcomer can read (toolkit-standard §D 22), measured. On 2026-11-20, 646 of the READMEs' 1,408 sentences
 * ran over 25 words and one paragraph of tools/parity/README.md held a whole file format in 480 words, while the
 * structural check (readmes.mjs) passed every README.
 *
 *   node tools/toolkit-check/readability.mjs             fail on a README over a limit or worse than its baseline
 *   node tools/toolkit-check/readability.mjs --report    every README's numbers, worst first
 *   node tools/toolkit-check/readability.mjs --tighten   record each README that improved at its new, lower numbers
 *
 * The limits (LIMITS) are §D 22's. A README recorded in readability.json (those written before the rule) may not get
 * worse on any count, and is named when it improves so the baseline is lowered (--tighten) in the same change; a README
 * not recorded is held to the limits outright. Code blocks and headings are not prose; a table cell is a paragraph of its
 * own; a link counts as its text and an inline code span as one word.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const LIMITS = { words: 800, sentence: 25, paragraphSentences: 5, paragraphWords: 100, paragraphCode: 5, grade: 12 };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BASE = path.join(HERE, 'readability.json');
const COUNTS = ['words', 'longSentences', 'longParagraphs', 'codeParagraphs'];

/* The prose of a markdown page: paragraphs, each { sentences: [word counts], words, code, text }. */
export function prose(md) {
  // a table cell is a paragraph of its own: prose moved into a cell is still prose (headings and separator rows aside)
  const text = md.replace(/```[\s\S]*?```/g, '\n\n').replace(/<!--[\s\S]*?-->/g, '')
    .split('\n').filter((l) => !/^\s*#/.test(l) && !/^\s*\|[\s:|-]+\|\s*$/.test(l))
    .map((l) => /^\s*\|/.test(l) ? '\n\n' + l.replace(/\\\|/g, '/').split('|').slice(1, -1).map((c) => c.trim()).join('\n\n') + '\n\n' : l).join('\n');
  // a list item is a paragraph of its own; a blank line ends one
  return text.split(/\n\s*\n|\n(?=\s*(?:[-*+]|\d+\.)\s)/).map((p) => {
    const code = (p.match(/`[^`\n]+`/g) || []).length;
    const flat = p.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/`[^`\n]+`/g, 'code').replace(/\s+/g, ' ').trim();
    const sentences = flat.split(/(?<=[.!?])\s+(?=[A-Z0-9(*_"'“])/).map((s) => s.split(' ').filter((w) => /\w/.test(w)).length).filter((n) => n > 0);
    return { sentences, words: sentences.reduce((a, b) => a + b, 0), code, text: flat };
  }).filter((p) => p.words);
}
/* Flesch–Kincaid grade of the prose: syllables counted by vowel groups, the usual approximation. */
const syllables = (w) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g) || []).length);
export function measure(md) {
  const ps = prose(md), all = ps.flatMap((p) => p.sentences);
  const words = all.reduce((a, b) => a + b, 0);
  const syl = ps.reduce((a, p) => a + p.text.split(' ').filter((w) => /\w/.test(w)).reduce((x, w) => x + syllables(w), 0), 0);
  return {
    words,
    longSentences: all.filter((n) => n > LIMITS.sentence).length,
    longParagraphs: ps.filter((p) => p.sentences.length > LIMITS.paragraphSentences || p.words > LIMITS.paragraphWords).length,
    codeParagraphs: ps.filter((p) => p.code > LIMITS.paragraphCode).length,
    grade: all.length ? Math.round((0.39 * words / all.length + 11.8 * syl / Math.max(1, words) - 15.59) * 10) / 10 : 0,
  };
}
const readmes = (root) => execFileSync('git', ['-C', root, 'ls-files', '-co', '--exclude-standard', '*README.md', 'README.md'], { encoding: 'utf8' })
  .split('\n').filter((f, i, a) => f && a.indexOf(f) === i && fs.existsSync(path.join(root, f)) && !f.includes('node_modules/'));
/* What a README over the limits breaks, in words. */
export function over(m) {
  return [m.words > LIMITS.words && `${m.words} words of prose (limit ${LIMITS.words})`,
    m.longSentences && `${m.longSentences} sentence(s) over ${LIMITS.sentence} words`,
    m.longParagraphs && `${m.longParagraphs} paragraph(s) over ${LIMITS.paragraphSentences} sentences or ${LIMITS.paragraphWords} words`,
    m.codeParagraphs && `${m.codeParagraphs} paragraph(s) with over ${LIMITS.paragraphCode} code spans (reference written as prose: a table or the code)`,
    m.grade > LIMITS.grade && `reading grade ${m.grade} (limit ${LIMITS.grade})`].filter(Boolean);
}
export function compare(root, base) {
  const worse = [], better = [];
  for (const f of readmes(root)) {
    const m = measure(fs.readFileSync(path.join(root, f), 'utf8')), b = base[f];
    if (!b) { const o = over(m); if (o.length) worse.push(`${f}: ${o.join('; ')}`); continue; }
    const grew = [...COUNTS.filter((k) => m[k] > b[k]), ...(m.grade > Math.max(b.grade, LIMITS.grade) ? ['grade'] : [])];
    if (grew.length) worse.push(`${f}: ${grew.map((k) => `${k} ${b[k]} → ${m[k]}`).join(', ')} (it may not get worse: split the sentence, make the list a table, move the reference to the code or a standard and link it)`);
    else if (COUNTS.some((k) => m[k] < b[k])) better.push(f);
  }
  return { worse, better };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : {};
  const arg = process.argv[2];
  if (arg === '--report') {
    const rows = readmes(ROOT).map((f) => ({ f, m: measure(fs.readFileSync(path.join(ROOT, f), 'utf8')) })).sort((a, b) => over(b.m).length - over(a.m).length || b.m.longSentences - a.m.longSentences);
    for (const { f, m } of rows) console.log(`${over(m).length ? 'over ' : 'ok   '} ${f}: ${m.words} words, ${m.longSentences} long sentences, ${m.longParagraphs} long paragraphs, ${m.codeParagraphs} code-heavy, grade ${m.grade}`);
    console.log(`${rows.filter((r) => !over(r.m).length).length} of ${rows.length} within the limits`);
  } else if (arg === '--tighten' || arg === '--record') {
    for (const f of readmes(ROOT)) { const m = measure(fs.readFileSync(path.join(ROOT, f), 'utf8')), b = base[f];
      // --record: once, every README as it stands when the rule arrives; --tighten: only a recorded one, only downward
      if (arg === '--record' ? !b && over(m).length : b && COUNTS.every((k) => m[k] <= b[k])) base[f] = over(m).length ? m : undefined; }
    const keep = Object.fromEntries(Object.entries(base).filter(([f, v]) => v && fs.existsSync(path.join(ROOT, f))).sort());
    fs.writeFileSync(BASE, JSON.stringify(keep, null, 1) + '\n');
    console.log(`readability.json: ${Object.keys(keep).length} README(s) still over the limits`);
  } else {
    const { worse, better } = compare(ROOT, base);
    for (const w of worse) console.log(w);
    if (better.length) console.log(`improved, so lower the baseline in this change: node tools/toolkit-check/readability.mjs --tighten (${better.join(', ')})`);
    process.exitCode = worse.length ? 1 : 0;
  }
}
