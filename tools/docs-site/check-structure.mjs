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

export const PAGES = ['', 'audits/', 'changes/', 'components/', 'components/button/', 'components/tabs/', 'components/table/',
  'foundations/semantic/', 'foundations/typography/', 'foundations/effects/', 'icons/', 'foundations/icons/', 'foundations/breakpoints/',
  'overview/components/', 'overview/progress/', 'overview/ai-readiness/', 'parity/', 'parity/properties/', 'parity/visual/'];

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

function serve(root) {
  const server = http.createServer((req, res) => {
    let f = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!f.startsWith(root)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done({ base: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() })));
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
    }
  } finally { await browser.close(); srv.close(); }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
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
