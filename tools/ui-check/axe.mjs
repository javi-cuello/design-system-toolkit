#!/usr/bin/env node
/*
 * tools/ui-check/axe.mjs — axe-core's WCAG A and AA rules, run on rendered pages in
 * the headless browser the parity engine already drives (tools/shared/cdp.mjs).
 *
 *   node tools/ui-check/axe.mjs <url> [<url> …] [--disable <rule,rule>]
 *
 * Exit 0 clean, 1 violations, 2 a page that could not be checked.
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
import { launch, newPage, attach, navigate, call, findChrome } from '../shared/cdp.mjs';

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
  return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ')) }));
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
    for (const url of urls) {
      try {
        await navigate(tab, url, { until: 'networkIdle' });
        await tab.evaluate(AXE);
        results.push({ url, violations: await call(tab, run, TAGS, disable) });
      } catch (e) { results.push({ url, error: String(e.message || e).split('\n')[0] }); }
    }
  } finally { await browser.close(); }
  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
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
