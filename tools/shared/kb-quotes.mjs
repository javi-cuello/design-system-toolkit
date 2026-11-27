#!/usr/bin/env node
/**
 * kb-quotes — check that every quote on a knowledge page is on the page it cites.
 *
 *   node tools/shared/kb-quotes.mjs <page.md>... [--from <git-ref>] [--no-render]
 *
 * Each "quoted" string of eight characters or more is paired with its source:
 * the first link after it on the line, or a back-reference "(Name)" that names
 * a link given earlier in the same section (toolkit-standard §D 21). A quote cut
 * with "…" is checked part by part. The source is fetched raw first; a page that
 * renders by script is then read in headless Chrome (cdp.mjs), and a PubMed page
 * through its own text export. `--from` checks only the lines added since a git
 * ref. Exit 1 on any quote not found.
 *
 * Why: on 2026-11-27 a by-line checker reported 20 misses on one change, every
 * one a quote it paired with the wrong link or read from a page that needs
 * script; each had to be re-checked by hand.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const LINK = /\[((?:[^\][]|\[[^\]]*\])+)\]\((https?:\/\/[^)\s]+)\)/g;

export const linkName = (text) => text.replace(/[*_`]/g, '').trim();

/** Normalise page or quote text so typography and markup never cause a miss. */
export function normalise(s) {
  let t = s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
  t = t.replace(/\\u2019|\\u2018/g, "'").replace(/\\"/g, '"').replace(/\\u0026/g, '&').replace(/\\n/g, ' ');
  t = t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/ /g, ' ');
  t = t.replace(/[*_`]/g, '').replace(/"/g, "'"); // a quote nested in a quote is written with single marks
  return t.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Every quote on the page with its source url, or `url: null` when none pairs. */
export function extractQuotes(markdown, { lines: only = null } = {}) {
  const out = [];
  let names = new Map();
  markdown.split('\n').forEach((line, i) => {
    const n = i + 1;
    if (/^#{1,6} /.test(line)) names = new Map();
    const links = [...line.matchAll(LINK)].map((m) => ({ at: m.index, end: m.index + m[0].length, name: linkName(m[1]), url: m[2] }));
    const bare = line.replace(/`[^`]*`/g, (c) => ' '.repeat(c.length));
    if (!only || only.has(n)) {
      for (const q of bare.matchAll(/"([^"]{8,}?)"/g)) {
        if (links.some((l) => q.index > l.at && q.index < l.end)) continue;
        const after = q.index + q[0].length;
        const known = [...names.entries(), ...links.filter((l) => l.end <= q.index).map((l) => [l.name, l.url])];
        const urls = sources(line, after, links, known);
        out.push({ line: n, quote: q[1], parts: q[1].split(/…|\.\.\./).map((p) => p.trim()).filter((p) => p.length >= 4), urls, url: urls[0] ?? null });
      }
    }
    for (const l of links) names.set(l.name, l.url);
  });
  return out;
}

/**
 * The sources a quote may come from: every link and back-reference in the first
 * bracket after it ("([A](a), [B](b))", "(A; B)"), a back-reference matching a
 * link name by its start ("(Wertheimer 1923)" for "Wertheimer 1923, translated");
 * failing that, the next link on the line.
 */
function sources(line, after, links, known) {
  const strip = (x) => x.replace(/[*_`]/g, '').trim();
  const byName = (text) => text.replace(LINK, '').split(/[;,]/).map(strip).filter(Boolean)
    .map((t) => known.find(([name]) => name === t) || known.find(([name]) => name.startsWith(t) || t.startsWith(name))).filter(Boolean).map(([, url]) => url);
  const clean = (urls) => [...new Set(urls.map((u) => u.split('#')[0]))];
  // the first bracket after the quote, skipping code spans and later quoted strings
  const bare = line.replace(/`[^`]*`/g, (c) => ' '.repeat(c.length));
  let open = -1, inQuote = false;
  for (let k = after; k < bare.length; k++) { if (bare[k] === '"') inQuote = !inQuote; else if (!inQuote && bare[k] === '(') { open = k; break; } else if (!inQuote && bare[k] === ')') break; }
  if (open >= 0) {
    let depth = 0, close = bare.length;
    for (let k = open; k < bare.length; k++) { if (bare[k] === '(') depth++; else if (bare[k] === ')' && --depth === 0) { close = k; break; } }
    const inGroup = links.filter((l) => l.at > open && l.at < close).map((l) => l.url);
    const all = [...inGroup, ...byName(line.slice(open + 1, close))];
    if (all.length) return clean(all);
  }
  // a quote inside a bracket that names its source after it: ("…", Name)
  const shut = bare.indexOf(')', after);
  if (shut >= 0) { const named = byName(line.slice(after, shut)); if (named.length) return clean(named); }
  const next = links.find((l) => l.at >= after);
  return next ? clean([next.url]) : [];
}

export function sourceUrl(url) {
  const pm = /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/.exec(url);
  return pm ? `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&rettype=abstract&retmode=text&id=${pm[1]}` : url;
}

const CACHE = join(tmpdir(), 'kb-quotes');
async function cached(kind, url, make) {
  mkdirSync(CACHE, { recursive: true });
  const f = join(CACHE, `${kind}-${createHash('md5').update(url).digest('hex')}`);
  if (existsSync(f)) return readFileSync(f, 'utf8');
  const text = (await make()) || '';
  if (text) writeFileSync(f, text);
  return text;
}

export function fetchRaw(url) {
  return cached('raw', url, () => {
    try { return execFileSync('curl', ['-sL', '--max-time', '30', '-A', 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36', sourceUrl(url)], { encoding: 'utf8', maxBuffer: 64 << 20 }); } catch { return ''; }
  });
}

let browser = null;
export function fetchRendered(url) {
  return cached('rendered', url, async () => {
    const cdp = await import('./cdp.mjs');
    browser ??= await cdp.launch({});
    const tab = await cdp.attach(await cdp.newPage(browser.endpoint));
    try {
      await cdp.navigate(tab, url, { until: 'load', timeout: 45_000 });
      await new Promise((r) => setTimeout(r, 2500));
      return await tab.evaluate('document.body.innerText');
    } catch { return ''; } finally { tab.close(); }
  });
}

/** The paired quotes not found on their source; a miss on the raw page is retried rendered. */
export async function check(quotes, { raw = fetchRaw, rendered = fetchRendered } = {}) {
  const missing = [];
  for (const q of quotes) {
    const urls = q.urls ?? (q.url ? [q.url] : []);
    if (!urls.length) continue;
    const parts = q.parts.map(normalise);
    const found = (page) => { const p = normalise(page); return parts.every((x) => p.includes(x)); };
    let ok = false;
    for (const u of urls) if (found(await raw(u))) { ok = true; break; }
    if (!ok && rendered) for (const u of urls) if (found(await rendered(u))) { ok = true; break; }
    if (!ok) missing.push(q);
  }
  return missing;
}

export function addedLines(diff) {
  const set = new Set();
  for (const m of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) for (let k = 0; k < (m[2] === undefined ? 1 : +m[2]); k++) set.add(+m[1] + k);
  return set;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--from');
  const from = at >= 0 ? args.splice(at, 2)[1] : null;
  const render = !args.includes('--no-render');
  const files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) { console.error('usage: kb-quotes.mjs <page.md>... [--from <git-ref>] [--no-render]'); process.exit(2); }
  let total = 0, unpaired = 0, bad = 0;
  try {
    for (const f of files) {
      const lines = from ? addedLines(execFileSync('git', ['diff', '-U0', from, '--', f], { encoding: 'utf8' })) : null;
      const quotes = extractQuotes(readFileSync(f, 'utf8'), { lines });
      total += quotes.length;
      for (const q of quotes.filter((x) => !x.url)) { unpaired++; console.log(`${f}:${q.line} UNPAIRED "${q.quote}"`); }
      for (const q of await check(quotes, { rendered: render ? fetchRendered : null })) { bad++; console.log(`${f}:${q.line} MISSING [${q.urls.join(' | ')}] "${q.quote}"`); }
    }
  } finally { if (browser) await browser.close(); }
  console.log(`kb-quotes: ${total} quote(s), ${bad} not found, ${unpaired} with no source to check`);
  process.exit(bad ? 1 : 0);
}
