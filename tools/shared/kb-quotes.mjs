#!/usr/bin/env node
/**
 * kb-quotes — check that every quote on a knowledge page is on the page it cites.
 *
 *   node tools/shared/kb-quotes.mjs <page.md>... [--from <git-ref>] [--no-render] [--fresh]
 *
 * Each "quoted" string of eight characters or more, outside code, is paired with
 * its sources: every link and back-reference in the first bracket after it, else
 * the link right after it or right before it on the line ("Apple's [modality](…):
 * "…""). A back-reference "(Name)" names a link given earlier in the same section
 * (toolkit-standard §D 21), whole or by its start. A quote cut with "…" is checked
 * part by part. A source is fetched raw first; a page that renders by script is
 * then read in headless Chrome (cdp.mjs), a PubMed page through its text export.
 * Only a 2xx answer is used or cached, and a cached copy lasts a week (`--fresh`
 * ignores it).
 *
 * Exit 1 when a quote is not on any of its sources, or, under `--from` (the gate
 * use, lines added since a git ref), when a new quote has no source at all; exit 3
 * when only unreachable sources stand in the way; exit 2 on bad usage.
 *
 * Why: on 2026-11-27 a by-line checker reported 20 misses on one change, every
 * one a quote it paired with the wrong link or read from a page that needs
 * script; each had to be re-checked by hand.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// a url may hold one level of balanced brackets: docs/(root)/theming.mdx
const LINK = /\[((?:[^\][]|\[[^\]]*\])+)\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)/g;
const WEEK = 7 * 24 * 3600 * 1000;

export const linkName = (text) => text.replace(/[*_`]/g, '').trim();

/** Normalise page or quote text so typography and markup never cause a miss. */
export function normalise(s) {
  let t = s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  t = t.replace(/\[([^\]]*)\]\([^)\s]*\)/g, '$1'); // a markdown source's own links read as their text
  t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
  t = t.replace(/\\u2019|\\u2018/g, "'").replace(/\\"/g, '"').replace(/\\u0026/g, '&').replace(/\\n/g, ' ');
  t = t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/ /g, ' ');
  t = t.replace(/[*_`]/g, '').replace(/"/g, "'"); // a quote nested in a quote is written with single marks
  return t.replace(/\s+/g, ' ').trim().toLowerCase();
}

const blank = (s) => ' '.repeat(s.length);

/** Every quote on the page with its candidate source urls (`urls: []` when none pairs). */
export function extractQuotes(markdown, { lines: only = null } = {}) {
  const out = [];
  let names = new Map();
  let fenced = false;
  markdown.split('\n').forEach((line, i) => {
    const n = i + 1;
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return; }
    if (fenced || /^\s*</.test(line)) return;
    if (/^#{1,6} /.test(line)) names = new Map();
    const links = [...line.matchAll(LINK)].map((m) => ({ at: m.index, end: m.index + m[0].length, name: linkName(m[1]), url: m[2] }));
    // code spans and link targets hold no quotes and open no brackets
    let bare = line.replace(/`[^`]*`/g, blank);
    for (const l of links) { const u = line.indexOf('](', l.at) + 1; bare = bare.slice(0, u) + blank(bare.slice(u, l.end)) + bare.slice(l.end); }
    if (!only || only.has(n)) {
      // a quote opens after a space, a bracket or the line's start, and closes before a space, a bracket or punctuation
      for (const q of bare.matchAll(/(?<=^|[\s([{:;—–-])"([^"]{8,}?)"(?=$|[\s)\]},.;:!?…—–-])/g)) {
        if (links.some((l) => q.index > l.at && q.index < l.end)) continue;
        const after = q.index + q[0].length;
        const known = [...names.entries(), ...links.filter((l) => l.end <= q.index).map((l) => [l.name, l.url])];
        const text = line.slice(q.index + 1, after - 1);
        const parts = text.split(/…|\.\.\./).map((p) => p.trim()).filter((p) => p.length >= 4);
        out.push({ line: n, quote: text, parts: parts.length ? parts : [text], urls: sources(line, bare, q.index, after, links, known) });
      }
    }
    for (const l of links) names.set(l.name, l.url);
  });
  return out;
}

/** Link names a back-reference may mean: the whole name, else every name it starts, on a word boundary. */
function named(token, known) {
  const exact = known.filter(([name]) => name === token);
  if (exact.length) return exact;
  if (token.length < 4) return [];
  return known.filter(([name]) => (name.startsWith(token) && /^(\W|$)/.test(name.slice(token.length)))
    || (name.length >= 4 && token.startsWith(name) && /^\W/.test(token.slice(name.length))));
}

function sources(line, bare, start, after, links, known) {
  const strip = (x) => x.replace(/[*_`]/g, '').trim();
  const byName = (text) => text.replace(LINK, '').split(/[;,]/).map(strip).filter(Boolean).flatMap((t) => named(t, known)).map(([, url]) => url);
  const clean = (urls) => [...new Set(urls.map((u) => u.split('#')[0]))];
  const nextLink = links.find((l) => l.at >= after);
  // the first bracket after the quote, skipping later quoted strings
  let open = -1, inQuote = false;
  for (let k = after; k < bare.length; k++) {
    if (bare[k] === '"') inQuote = !inQuote;
    else if (!inQuote && bare[k] === '(') { open = k; break; } else if (!inQuote && bare[k] === ')') break;
    else if (!inQuote && /[.;]\s+[A-Z]/.test(bare.slice(k, k + 3))) break; // a new sentence or clause has its own source
  }
  // "Apple's [modality](…): "…"" or "…", [Spectrum](…): with no bracket first, the links either side,
  // with no other quote between, are the candidates
  // the last link before the quote in the same sentence; quotes may sit between: [Spectrum](…) "roughly 70", "at least 50"
  const sameSentence = (from) => !/[.;]\s+[A-Z]/.test(bare.slice(from, start).replace(/"[^"]*"/g, '""'));
  const prev = [...links].reverse().find((l) => l.end <= start && sameSentence(l.end));
  if (nextLink && (open < 0 || nextLink.at < open) && !bare.slice(after, nextLink.at).includes('"')) return clean([prev, nextLink].filter(Boolean).map((l) => l.url));
  if (open >= 0) {
    let depth = 0, close = bare.length;
    for (let k = open; k < bare.length; k++) { if (bare[k] === '(') depth++; else if (bare[k] === ')' && --depth === 0) { close = k; break; } }
    const all = [...links.filter((l) => l.at > open && l.at < close).map((l) => l.url), ...byName(line.slice(open + 1, close))];
    if (all.length) return clean(all);
  }
  // a quote inside a bracket that names its source after it: ("…", Name)
  const shut = bare.indexOf(')', after);
  if (shut >= 0) { const urls = byName(line.slice(after, shut)); if (urls.length) return clean(urls); }
  return clean([prev, nextLink].filter(Boolean).map((l) => l.url));
}

export function sourceUrl(url) {
  const pm = /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/.exec(url);
  return pm ? `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&rettype=abstract&retmode=text&id=${pm[1]}` : url;
}

/**
 * A fetch through the cache: `make` returns `{ text }` or `{ error }`; only text
 * is kept, and a kept copy older than a week, or any under `fresh`, is fetched again.
 */
export async function cached(dir, kind, url, make, { fresh = false, now = Date.now() } = {}) {
  mkdirSync(dir, { recursive: true });
  const f = join(dir, `${kind}-${createHash('md5').update(url).digest('hex')}`);
  if (!fresh && existsSync(f) && now - statSync(f).mtimeMs < WEEK) return { text: readFileSync(f, 'utf8') };
  const got = await make();
  if (got.text) { writeFileSync(f, got.text); return { text: got.text }; }
  return { error: got.error || 'empty page' };
}

const CACHE = join(tmpdir(), 'kb-quotes');
let fresh = false;

export function fetchRaw(url) {
  return cached(CACHE, 'raw', url, () => {
    try {
      const out = execFileSync('curl', ['-sL', '--max-time', '30', '-A', 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36', '-w', '\n%{http_code}', sourceUrl(url)], { encoding: 'utf8', maxBuffer: 64 << 20 });
      const at = out.lastIndexOf('\n');
      const code = +out.slice(at + 1);
      return code >= 200 && code < 300 ? { text: out.slice(0, at) } : { error: `HTTP ${code || 'no answer'}` };
    } catch (e) { return { error: `curl: ${e.status ?? e.message}` }; }
  }, { fresh });
}

let browser = null;
let noBrowser = null;
export async function fetchRendered(url) {
  if (noBrowser) return { error: noBrowser };
  return cached(CACHE, 'rendered', url, async () => {
    const cdp = await import('./cdp.mjs');
    try { browser ??= await cdp.launch({}); } catch (e) {
      noBrowser = `headless Chrome would not start (${e.message}); raw pages only`;
      console.error(`kb-quotes: ${noBrowser}`);
      return { error: noBrowser };
    }
    const tab = await cdp.attach(await cdp.newPage(browser.endpoint));
    try {
      let status = 0;
      tab.on('Network.responseReceived', (p) => { if (p.type === 'Document' && !status) status = p.response.status; });
      await tab.send('Network.enable').catch(() => {});
      await cdp.navigate(tab, url, { until: 'load', timeout: 45_000 });
      // a script-rendered site may answer a deep link with 404 and still draw the page, so the drawn text decides
      // a script page fills in after load: wait until its text stops growing
      let last = -1, steady = 0, text = '';
      for (let k = 0; k < 40 && steady < 3; k++) {
        await new Promise((r) => setTimeout(r, 500));
        text = await tab.evaluate('document.body ? document.body.innerText : ""');
        steady = text.length > 0 && text.length === last ? steady + 1 : 0;
        last = text.length;
      }
      return text ? { text } : { error: `HTTP ${status || 'no answer'}, nothing drawn` };
    } catch (e) { return { error: `render: ${e.message}` }; } finally { tab.close(); }
  }, { fresh });
}

/** Each paired quote's verdict: missing when a source was read without it, unreachable when none could be read. */
export async function check(quotes, { raw = fetchRaw, rendered = fetchRendered } = {}) {
  const missing = [], unreachable = [];
  for (const q of quotes) {
    if (!q.urls.length) continue;
    const parts = q.parts.map(normalise);
    const found = (page) => { const p = normalise(page); return parts.every((x) => p.includes(x)); };
    let ok = false, read = 0;
    const errors = [];
    for (const pass of [raw, rendered].filter(Boolean)) {
      for (const u of q.urls) {
        const got = await pass(u);
        if (got.error) { errors.push(`${u}: ${got.error}`); continue; }
        read++;
        if (found(got.text)) { ok = true; break; }
      }
      if (ok) break;
    }
    if (!ok) (read ? missing : unreachable).push({ ...q, errors });
  }
  return { missing, unreachable };
}

export function addedLines(diff) {
  const set = new Set();
  for (const m of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) for (let k = 0; k < (m[2] === undefined ? 1 : +m[2]); k++) set.add(+m[1] + k);
  return set;
}

/** Lines added to a file since `ref`, or null (every line) for a file git does not track yet. */
export function linesSince(file, ref) {
  const cwd = dirname(file);
  try { execFileSync('git', ['ls-files', '--error-unmatch', file], { cwd, stdio: 'ignore' }); } catch { return null; }
  return addedLines(execFileSync('git', ['diff', '-U0', ref, '--', file], { cwd, encoding: 'utf8' }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--from');
  const from = at >= 0 ? args.splice(at, 2)[1] : null;
  fresh = args.includes('--fresh');
  const render = !args.includes('--no-render');
  const files = args.filter((a) => !a.startsWith('--'));
  if (!files.length || (at >= 0 && (!from || from.startsWith('--')))) {
    console.error('usage: kb-quotes.mjs <page.md>... [--from <git-ref>] [--no-render] [--fresh]');
    process.exit(2);
  }
  let total = 0, unpaired = 0, bad = 0, lost = 0;
  try {
    for (const f of files) {
      const abs = resolve(f);
      const quotes = extractQuotes(readFileSync(abs, 'utf8'), { lines: from ? linesSince(abs, from) : null });
      total += quotes.length;
      for (const q of quotes.filter((x) => !x.urls.length)) { unpaired++; console.log(`${f}:${q.line} UNPAIRED "${q.quote}"`); }
      const { missing, unreachable } = await check(quotes, { rendered: render ? fetchRendered : null });
      for (const q of missing) { bad++; console.log(`${f}:${q.line} MISSING [${q.urls.join(' | ')}] "${q.quote}"`); }
      for (const q of unreachable) { lost++; console.log(`${f}:${q.line} UNREACHABLE "${q.quote}" (${q.errors.join('; ')})`); }
    }
  } finally { if (browser) await browser.close(); }
  console.log(`kb-quotes: ${total} quote(s), ${bad} not found, ${lost} unreachable, ${unpaired} with no source${from ? ' (a new quote needs one)' : ''}`);
  process.exit(bad || (from && unpaired) ? 1 : lost ? 3 : 0);
}
