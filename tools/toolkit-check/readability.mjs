#!/usr/bin/env node
/*
 * A README a newcomer can read (toolkit-standard §D 22), and a skill a model and its maintainer can read (skill-standard
 * §A clause I), measured. On 2026-11-20, 646 of the READMEs' 1,408 sentences
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
 *
 * A skill's SKILL.md and references/*.md are held to the same sentence, paragraph, code and grade limits. In place of the
 * 800-word cap, a SKILL.md body runs to SKILL_LINES lines; a reference file over CONTENTS_OVER lines opens with a
 * contents list; and a dated story (an ISO date in the prose) is history, which goes to CHANGELOG.md or git log.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const LIMITS = { words: 800, sentence: 25, paragraphSentences: 5, paragraphWords: 100, paragraphCode: 5, grade: 12 };
// Anthropic's Agent Skills best practices: "Keep the SKILL.md body under 500 lines", and a table of contents for a
// reference file "longer than 100 lines" (platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
export const SKILL_LIMITS = { lines: 500, contentsOver: 100 };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BASE = path.join(HERE, 'readability.json');
const COUNTS = ['words', 'longSentences', 'longParagraphs', 'codeParagraphs', 'lines', 'dated', 'noContents'];
/* What a page is: a README, a skill's SKILL.md, or one of its references. */
export const kindOf = (f) => /^skills\/[^/]+\/SKILL\.md$/.test(f) ? 'skill' : /^skills\/[^/]+\/references\/.+\.md$/.test(f) ? 'reference' : 'readme';
const body = (md) => md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

/* The prose of a markdown page: paragraphs, each { sentences: [word counts], words, code, text }. */
export function prose(md) {
  // a table cell is a paragraph of its own: prose moved into a cell is still prose (headings and separator rows aside)
  const text = md.replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1.*$/gm, '\n\n').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>\n]+>/g, ' ')
    .replace(/^[ \t]*>[ \t]?/gm, '').replace(/\b(e\.g|i\.e|vs|cf)\./gi, '$1')
    .split('\n').filter((l) => !/^\s*#/.test(l) && !/^\s*\|[\s:|-]+\|\s*$/.test(l))
    .map((l) => /^\s*\|/.test(l) ? '\n\n' + l.replace(/\\\|/g, '/').split('|').slice(1, -1).map((c) => c.trim()).join('\n\n') + '\n\n' : l).join('\n');
  // a list item is a paragraph of its own; a blank line ends one
  return text.split(/\n\s*\n|\n(?=\s*(?:[-*+]|\d+[.)])\s)/).map((p) => {
    const code = (p.match(/`[^`\n]+`/g) || []).length;
    const flat = p.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/`[^`\n]+`/g, 'code').replace(/\s+/g, ' ').trim();
    const sentences = flat.split(/(?<=[.!?])\s+(?=[A-Z0-9(*_"'“])/).map((s) => s.split(' ').filter((w) => /\w/.test(w)).length).filter((n) => n > 0);
    return { sentences, words: sentences.reduce((a, b) => a + b, 0), code, text: flat };
  }).filter((p) => p.words);
}
/* Flesch–Kincaid grade of the prose: syllables counted by vowel groups, the usual approximation. */
const syllables = (w) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g) || []).length);
export function measure(md, kind = 'readme') {
  if (kind !== 'readme') md = body(md);
  const ps = prose(md), all = ps.flatMap((p) => p.sentences);
  const words = all.reduce((a, b) => a + b, 0);
  const syl = ps.reduce((a, p) => a + p.text.split(' ').filter((w) => /\w/.test(w)).reduce((x, w) => x + syllables(w), 0), 0);
  return {
    words,
    longSentences: all.filter((n) => n > LIMITS.sentence).length,
    longParagraphs: ps.filter((p) => p.sentences.length > LIMITS.paragraphSentences || p.words > LIMITS.paragraphWords).length,
    codeParagraphs: ps.filter((p) => p.code > LIMITS.paragraphCode).length,
    grade: all.length ? Math.round((0.39 * words / all.length + 11.8 * syl / Math.max(1, words) - 15.59) * 10) / 10 : 0,
    ...(kind === 'readme' ? {} : (() => {
      const lines = md.replace(/\n+$/, '').split('\n').length;
      // a contents list: a heading named Contents, or a list of in-page links, within the first 30 lines
      const head = md.split('\n').slice(0, 30).join('\n');
      const contents = /^#+\s*(table of )?contents\b/im.test(head) || (head.match(/^\s*[-*]\s*\[[^\]]+\]\(#/gm) || []).length >= 3;
      // a date in a table cell is a source's date (where a default came from), not a story; a story is told in prose
      const told = prose(md.split('\n').filter((l) => !/^\s*\|/.test(l)).join('\n'));
      return { lines, dated: told.reduce((a, p) => a + (p.text.match(/\b20\d\d-\d\d-\d\d\b/g) || []).length, 0),
        noContents: kind === 'reference' && lines > SKILL_LIMITS.contentsOver && !contents ? 1 : 0 };
    })()),
  };
}
// every README, any case, and every skill's SKILL.md and references/*.md; a skill's folder carries no README of its own
// (skill-standard §A), skills/README.md aside
const readmes = (root) => execFileSync('git', ['-C', root, 'ls-files', '-co', '--exclude-standard'], { encoding: 'utf8' })
  .split('\n').filter((f, i, a) => a.indexOf(f) === i && fs.existsSync(path.join(root, f)) && !f.includes('node_modules/')
    && ((/(^|\/)readme\.md$/i.test(f) && !(f.startsWith('skills/') && f !== 'skills/README.md')) || kindOf(f) !== 'readme'));
const measureFile = (root, f) => measure(fs.readFileSync(path.join(root, f), 'utf8'), kindOf(f));
/* What a README over the limits breaks, in words. */
export function over(m, kind = 'readme') {
  return [kind === 'readme' && m.words > LIMITS.words && `${m.words} words of prose (limit ${LIMITS.words})`,
    kind === 'skill' && m.lines > SKILL_LIMITS.lines && `${m.lines} lines in the SKILL.md body (limit ${SKILL_LIMITS.lines}: move reference to references/)`,
    m.noContents && `${m.lines} lines with no contents list at the top`,
    m.dated && `${m.dated} dated stor${m.dated > 1 ? 'ies' : 'y'} in the prose (history goes to CHANGELOG.md or git log)`,
    m.longSentences && `${m.longSentences} sentence(s) over ${LIMITS.sentence} words`,
    m.longParagraphs && `${m.longParagraphs} paragraph(s) over ${LIMITS.paragraphSentences} sentences or ${LIMITS.paragraphWords} words`,
    m.codeParagraphs && `${m.codeParagraphs} paragraph(s) with over ${LIMITS.paragraphCode} code spans (reference written as prose: a table or the code)`,
    m.grade > LIMITS.grade && `reading grade ${m.grade} (limit ${LIMITS.grade})`].filter(Boolean);
}
export function compare(root, base) {
  const worse = [], better = [];
  for (const f of readmes(root)) {
    const kind = kindOf(f), m = measureFile(root, f), b = base[f];
    if (!b) { const o = over(m, kind); if (o.length) worse.push(`${f}: ${o.join('; ')}`); continue; }
    // words and grade may move freely under their limits; the counts of broken rules only go down
    // a skill's words and a reference's lines are not capped; a SKILL.md body's lines are
    const grew = [...COUNTS.filter((k) => k === 'words' ? kind === 'readme' && m.words > Math.max(b.words, LIMITS.words)
      : k === 'lines' ? kind === 'skill' && m.lines > Math.max(b.lines, SKILL_LIMITS.lines) : k in m && m[k] > (b[k] || 0)),
      ...(m.grade > Math.max(b.grade, LIMITS.grade) ? ['grade'] : [])];
    if (grew.length) worse.push(`${f}: ${grew.map((k) => `${k} ${b[k] ?? 0} → ${m[k]}`).join(', ')} (it may not get worse: split the sentence, make the list a table, move the reference to the code or a standard and link it)`);
    else if (COUNTS.some((k) => k in m && m[k] < b[k] && !(k === 'words' && kind !== 'readme') && !(k === 'lines' && kind !== 'skill'))) better.push(f);
  }
  const all = readmes(root);
  for (const f of Object.keys(base)) if (!all.includes(f)) worse.push(`${f}: recorded but gone (moved or deleted): node tools/toolkit-check/readability.mjs --tighten drops it; a moved README is held to the limits outright`);
  return { worse, better };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : {};
  const arg = process.argv[2];
  if (arg === '--report') {
    const rows = readmes(ROOT).map((f) => ({ f, k: kindOf(f), m: measureFile(ROOT, f) })).sort((a, b) => over(b.m, b.k).length - over(a.m, a.k).length || b.m.longSentences - a.m.longSentences);
    for (const { f, k, m } of rows) console.log(`${over(m, k).length ? 'over ' : 'ok   '} ${f}: ${k === 'readme' ? m.words + ' words' : m.lines + ' lines, ' + m.dated + ' dated'}, ${m.longSentences} long sentences, ${m.longParagraphs} long paragraphs, ${m.codeParagraphs} code-heavy, grade ${m.grade}`);
    console.log(`${rows.filter((r) => !over(r.m, r.k).length).length} of ${rows.length} within the limits`);
  } else if (arg === '--record') {
    console.log('readability.json already holds the pages written before their rules (READMEs 2026-11-20, skills 2026-11-21); a new or moved page meets the limits');
    process.exitCode = 2;
  } else if (arg === '--tighten') {
    for (const f of readmes(ROOT)) { const kind = kindOf(f), m = measureFile(ROOT, f), b = base[f];
      // --tighten: only a recorded page, only downward: it keeps the lower of old and new on every field, so it never
      // loosens a baseline
      if (b) base[f] = !over(m, kind).length ? undefined : b ? Object.fromEntries(Object.keys(m).map((k) => [k, Math.min(m[k], b[k] ?? m[k])])) : m; }
    const all = readmes(ROOT), keep = Object.fromEntries(Object.entries(base).filter(([f, v]) => v && all.includes(f)).sort());
    fs.writeFileSync(BASE, JSON.stringify(keep, null, 1) + '\n');
    console.log(`readability.json: ${Object.keys(keep).length} README(s) still over the limits`);
  } else {
    const { worse, better } = compare(ROOT, base);
    for (const w of worse) console.log(w);
    if (better.length) console.log(`improved, so lower the baseline in this change: node tools/toolkit-check/readability.mjs --tighten (${better.join(', ')})`);
    process.exitCode = worse.length ? 1 : 0;
  }
}
