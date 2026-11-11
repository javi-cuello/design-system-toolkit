#!/usr/bin/env node
/*
 * The docs site's markup contract, held on every page type: parity's
 * structure probe (tools/parity/pages.mjs — one <main>, one <h1>, no heading
 * jump, unique ids, every <nav>/<aside>/<section> named, every aria reference
 * resolving) run over one page of each of the site's 19 page types in a
 * headless browser. code-standard rule 3 asked for named landmarks and nothing
 * held the site to it: a one-off run on 2026-10-11 found unnamed sections on
 * the component pages, Changes, Foundations and the Audits dashboard.
 *
 *   node tools/docs-site/check-structure.mjs <site dir>   (a project's built site, e.g. <project home>/site)
 *
 * A page type a project has no page for (no table component, no breakpoints
 * collection) is listed as not present, never as a finding: the site builds
 * only what the project holds.
 *
 * The built site is served from a throwaway local server rather than opened
 * as file://, because its pages load /_astro/... from the root: under file://
 * neither the stylesheet nor the scripts load, and the probe's menu check reads
 * computed styles. No built site is said ("not run"), never passed: exit 0
 * with that line, so bin/check can print it. Any finding exits 1.
 *
 * Each page is then read again at 320px (WCAG 1.4.10 Reflow): the page must
 * not run sideways, measured on the document and on every element that holds
 * <main>, since a site that scrolls in an inner container, the body set to
 * overflow: hidden, reports a clean document while its content is cut (two
 * zeroheight sites measured 2026-11-11, knowledge/ui/profiles/documentation.md
 * *Page frame and visual*). A table or canvas that scrolls inside main is its
 * own region and is not this finding.
 *
 * And no page prints a value that was never filled: "undefined" or "NaN" as
 * a value, or "[object Object]", in the page's text outside code (collapsed
 * panels included, a click away) is a template reading a
 * field the data lacks (a Supernova site printed "undefined" in its status
 * checklist, the same page of the knowledge). The generator should have
 * stopped; this catches the case it did not.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { launch, newPage, attach, navigate, viewport, call, findChrome } from '../shared/cdp.mjs';
import { structureProbe } from '../parity/pages.mjs';

import { realpathSync } from 'node:fs';
const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHROME = findChrome();
// WCAG 1.4.10 Reflow's width: content at 320 CSS pixels needs no sideways scroll
const REFLOW = 320;

export const PAGES = ['', 'audits/', 'changes/', 'components/', 'components/button/', 'components/tabs/', 'components/table/',
  'foundations/semantic/', 'foundations/typography/', 'foundations/effects/', 'icons/', 'foundations/icons/', 'foundations/breakpoints/',
  'overview/components/', 'overview/progress/', 'overview/ai-readiness/', 'parity/', 'parity/properties/', 'parity/visual/'];

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

export function serve(root) {
  const server = http.createServer((req, res) => {
    // only this machine's own name, and never a path out of the folder: `<root>-old/` starts with `<root>` too
    if (!/^127\.0\.0\.1:\d+$/.test(req.headers.host || '')) { res.writeHead(421).end(); return; }
    let f; try { f = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname)); } catch { res.writeHead(400).end(); return; }
    if (f !== root && !f.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done({ base: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() })));
}

/** The page runs sideways: the document, or anything holding <main>, wider than its box. */
export function sidewaysProbe() {
  const main = document.querySelector('main');
  const doc = document.scrollingElement || document.documentElement;
  const name = (el) => el === doc ? 'the page' : el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList[0] ? '.' + el.classList[0] : '');
  // the page against the window (Chrome runs with its scrollbars hidden); main
  // or any holder of it that really scrolls sideways, against its box. A holder that
  // clips without scrolling (an off-canvas drawer parked beside it) is not one.
  const holders = [];
  for (let a = main; a && a !== document.documentElement; a = a.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(a).overflowX)) holders.push(a);
  }
  const wide = holders.filter((el) => el.scrollWidth > el.clientWidth + 1);
  // one cause, reported once: the innermost holder it overflows
  if (wide.length) return [`runs sideways at ${innerWidth}px: ${name(wide[0])} is ${wide[0].scrollWidth}px wide in ${wide[0].clientWidth}px`];
  return doc.scrollWidth > innerWidth + 1 ? [`runs sideways at ${innerWidth}px: the page is ${doc.scrollWidth}px wide`] : [];
}

/** Text a template printed from a field the data lacks, outside code samples. */
export function blankProbe() {
  const out = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  // a value, not a word: the whole text, after ":" or "=", or a number's unit
  // on it; "behaviour is undefined" in prose is not a blank
  const blank = /\[object Object\]|^\s*(undefined|NaN)\s*$|[:=]\s*(undefined|NaN)\s*(?:$|[,;)|])|NaN(?:px|rem|em|ms|%)/;
  for (let n; (n = walk.nextNode());) {
    const m = blank.exec(n.data);
    if (!m || n.parentElement.closest('code, pre, kbd, samp, var, script, style, template, noscript, textarea, [hidden]')) continue;
    const f = `prints "${m[0].replace(/^[:=]\s*/, '').trim()}": "${n.data.trim().slice(0, 60)}" in <${n.parentElement.tagName.toLowerCase()}>`;
    if (!out.includes(f)) out.push(f);
  }
  return out;
}

/** Every finding on the given pages of a built site, as "page: finding". */
export async function check(site, pages = PAGES) {
  const root = path.resolve(site);
  const problems = [];
  const absent = pages.filter((p) => !fs.existsSync(path.join(root, p, 'index.html')));
  // A page that only redirects (a multi-platform index sending the reader on) has no
  // structure of its own; probing it races the redirect.
  check.redirects = pages.filter((p) => !absent.includes(p) && /http-equiv=["']?refresh/i.test(fs.readFileSync(path.join(root, p, 'index.html'), 'utf8')));
  const todo = pages.filter((p) => !absent.includes(p) && !check.redirects.includes(p));
  check.absent = absent;
  const srv = await serve(root);
  const browser = await launch({ chrome: CHROME });
  try {
    const tab = await attach(await newPage(browser.endpoint));
    // a page's window, the interface settings' (projects.cjs interfaceLimits)
    const L = createRequire(import.meta.url)('../snapshot/projects.cjs').interfaceLimits(null);
    await viewport(tab, L.viewportWidth, L.viewportHeight);
    for (const p of todo) {
      // load, not network idle: the probe reads the DOM and computed styles, and a
      // page of a few thousand components never goes idle within the bound.
      await navigate(tab, srv.base + p, { until: 'load' });
      for (const f of await call(tab, structureProbe)) problems.push(`/${p}: ${f}`);
      for (const f of await call(tab, blankProbe)) problems.push(`/${p}: ${f}`);
    }
    await viewport(tab, REFLOW, L.viewportHeight);
    for (const p of todo) {
      await navigate(tab, srv.base + p, { until: 'load' });
      for (const f of await call(tab, sidewaysProbe)) problems.push(`/${p}: ${f}`);
    }
  } finally { await browser.close(); srv.close(); }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  const site = process.argv[2];
  if (!site) { console.error('usage: node tools/docs-site/check-structure.mjs <site dir>'); process.exit(2); }
  if (!fs.existsSync(path.join(site, 'index.html'))) { console.log(`not run: no built site at ${path.relative(TOOLKIT, site) || site}`); process.exit(0); }
  const problems = await check(site);
  for (const p of problems) console.log(`  ${p}`);
  const seen = PAGES.length - (check.absent || []).length - (check.redirects || []).length;
  if ((check.redirects || []).length) console.log(`  redirects, not probed: ${check.redirects.map((p) => '/' + p).join(', ')}`);
  if ((check.absent || []).length) console.log(`  not present in this project: ${check.absent.map((p) => '/' + p).join(', ')}`);
  console.log(problems.length ? `${problems.length} structure finding(s) over ${seen} page types` : `clean: ${seen} page types`);
  process.exit(problems.length ? 1 : 0);
}
