#!/usr/bin/env node
/*
 * tools/ui-check/axe.mjs — axe-core's WCAG A and AA rules, run on rendered pages in
 * the headless browser the parity engine already drives (tools/shared/cdp.mjs).
 *
 *   node tools/ui-check/axe.mjs <url> [<url> …] [--disable <rule,rule>]
 *
 * Each page is checked in the light and the dark colour scheme. Exit 0 clean, 1 violations, 2 a page that could
 * not be checked.
 *
 * axe-core is vendored in vendor/ at a pinned version and injected into the
 * page under test, never loaded by a project: it is a test instrument, so a
 * project gains no dependency by calling this. Its rules cover what a script
 * can decide about accessibility — names, roles, contrast, landmarks, ARIA
 * validity; tools/ui-check/check.mjs holds pages to design-standard, and neither
 * replaces looking at the page with a screen reader.
 *
 * `--disable` turns off a rule for a run, for a finding a project has ruled
 * on; the caller says which and why, beside the call.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, newPage, attach, navigate, call, findChrome, media } from '../shared/cdp.mjs';

import { realpathSync } from 'node:fs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const AXE = fs.readFileSync(path.join(HERE, 'vendor/axe.min.js'), 'utf8');
const CHROME = findChrome();
// WCAG 2.2 A and AA as axe tags them; best-practice rules are left out,
// because they are advice and this exit code blocks a push
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/* In the page: run axe and return its violations as plain data. */
async function run(tags, disabled) {
  const rules = Object.fromEntries(disabled.map((id) => [id, { enabled: false }]));
  const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, rules, resultTypes: ['violations'] });
  // a contrast failure carries its measured pair, so a reader sees the colours without re-running it
  const pair = (n) => { const m = /contrast of ([\d.]+) \(foreground color: (#\w+), background color: (#\w+)/.exec(n.failureSummary || ''); return m ? ` (${m[1]}:1, ${m[2]} on ${m[3]})` : ''; };
  return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ') + pair(n)) }));
}

/* The same run as a page function another runner can call on its own tab
   (tools/parity/pages.mjs's axe gate): axe injected, then run, in one call. */
export const axeProbe = (disable = []) =>
  `async () => { ${AXE}\n; return (${run})(${JSON.stringify(TAGS)}, ${JSON.stringify(disable)}); }`;

export async function axePages(urls, { disable = [] } = {}) {
  const browser = await launch({ chrome: CHROME });
  const results = [];
  try {
    const tab = await attach(await newPage(browser.endpoint));
    // each page in both colour schemes: run in the machine's own, a dark machine passed what failed in CI's light one
    // (2026-11-26, a done row's number on its tint), so neither is left to the machine
    for (const url of urls) {
      try {
        const seen = new Map();                 // a violation found in both schemes is one entry, "(light, dark)"
        for (const scheme of ['light', 'dark']) {
          await media(tab, { 'prefers-color-scheme': scheme });
          // a fresh load for each scheme: the same address with a #fragment would otherwise not reload, and a page that
          // reads matchMedia once at load would keep the first scheme
          await navigate(tab, 'about:blank');
          await navigate(tab, url, { until: 'networkIdle' });
          await tab.evaluate(AXE);
          for (const v of await call(tab, run, TAGS, disable)) {
            const key = v.id + '\n' + v.targets.map((t) => t.replace(/ \([\d.]+:1, .*\)$/, '')).join('\n');
            if (seen.has(key)) seen.get(key).schemes.push(scheme); else seen.set(key, { ...v, schemes: [scheme] });
          }
        }
        results.push({ url, violations: [...seen.values()].map(({ schemes, ...v }) => ({ ...v, help: `${v.help} (${schemes.join(', ')})` })) });
      } catch (e) { results.push({ url, error: String(e.message || e).split('\n')[0] }); }
    }
  } finally { await browser.close(); }
  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--disable');
  const disable = i > -1 ? args.splice(i, 2)[1].split(',').filter(Boolean) : [];
  if (!args.length) { console.error('usage: node tools/ui-check/axe.mjs <url> [<url> …] [--disable <rule,rule>]'); process.exit(2); }
  if (!fs.existsSync(CHROME)) { console.error(`no Chrome at ${CHROME}; set $CHROME`); process.exit(2); }
  const results = await axePages(args, { disable });
  let n = 0, errors = 0;
  for (const r of results) {
    if (r.error) { console.log(`ERROR ${r.url}\n     ${r.error}`); errors++; continue; }
    console.log(`${r.violations.length ? 'RED  ' : 'ok   '}${r.url}`);
    for (const v of r.violations) {
      n++;
      console.log(`     ${v.id} (${v.impact}): ${v.help}`);
      for (const t of v.targets.slice(0, 5)) console.log(`       ${t}`);
      if (v.targets.length > 5) console.log(`       … ${v.targets.length - 5} more`);
    }
  }
  console.log(errors ? `${errors} page(s) could not be checked` : n ? `${n} violation(s)` : 'clean');
  // a page that could not be checked is never read as clean or as findings
  process.exit(errors ? 2 : n ? 1 : 0);
}
