#!/usr/bin/env node
/*
 * tools/ui-check/check.mjs — the design-standard rules a rendered page can be held
 * to, measured in a headless browser. The frontend-build skill runs it when it
 * audits a build; a project's check may call it too.
 *
 *   node tools/ui-check/check.mjs <url> [<url> …] [--project <label>] [--width <px>] [--shots <dir>]
 *
 * `--shots <dir>` also saves each page whole, at desktop width in light and
 * dark and at phone width, for a person to look at before the change ships:
 * the checks see what they measure, the screenshots show the rest.
 *
 * Exit 0 clean, 1 findings, 2 a page that could not be checked.
 *
 * Each finding names the rule it breaks. The limits it applies are settings
 * (`interface` in standards/audit-settings.json, a project's own under the
 * same key in its context document), never numbers in this file.
 *
 * What it does not check: whether the page matches its design (parity,
 * code-standard's Design-to-code), the document's structure and overflow
 * (tools/parity/pages.mjs), and the stylesheets (tools/css-lint). Those have
 * owners; this reads only what design-standard owns.
 *
 * A finding names its design-standard rule by number, unlike a Figma scanner's
 * (which names the setting, for designers reading it in the file): this one is
 * read by whoever runs the audit, who looks the rule up.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { launch, newPage, attach, navigate, viewport, call, media, screenshot, findChrome } from '../shared/cdp.mjs';

import { realpathSync } from 'node:fs';
const { interfaceLimits } = createRequire(import.meta.url)('../snapshot/projects.cjs');

const CHROME = findChrome();

/** The limits: the house's, under a project's own when one is named (projects.cjs interfaceLimits, their one reader). */
export const limits = (project) => interfaceLimits(project || null);

/* Read in the page: each control the rules speak about, as plain data. */
function survey() {
  const label = (el) => el.getAttribute('aria-label') || (el.labels && el.labels[0] && el.labels[0].textContent.trim()) || el.getAttribute('name') || el.id || el.tagName.toLowerCase();
  const shown = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const FACET = 'select, [role="group"], [role="radiogroup"]';
  // A segmented control: buttons for one choice of several, so exactly one pressed
  // or checked. Native radio inputs are a form question, which design-standard rule 4 does not limit.
  const groups = [...document.querySelectorAll('[role="group"], [role="radiogroup"]')].filter(shown).map((g) => {
    const pressed = [...g.querySelectorAll(':scope > button[aria-pressed]')];
    const radios = [...g.querySelectorAll('button[role="radio"]')];
    const opts = pressed.length ? pressed : radios;
    const on = opts.filter((o) => o.getAttribute('aria-pressed') === 'true' || o.getAttribute('aria-checked') === 'true' || o.checked).length;
    return { name: label(g), buttons: on === 1 ? opts.length : 0 };
  }).filter((g) => g.buttons);
  const tablists = [...document.querySelectorAll('[role="tablist"]')].filter(shown).map((t) => {
    const tabs = [...t.querySelectorAll('[role="tab"]')].filter(shown);
    return { name: label(t), rows: new Set(tabs.map((x) => Math.round(x.getBoundingClientRect().top))).size, tabs: tabs.length };
  });
  // A filter menu, not a form field: a field has a visible label of its own.
  const menus = [...document.querySelectorAll('select')].filter(shown).filter((s) => ![...(s.labels || [])].some(shown)).map((s) => {
    const opts = [...s.options];
    const first = opts[0] ? opts[0].text.trim() : '';
    const rest = /^all\b/i.test(first) ? opts.slice(1) : opts.filter((o) => o !== s.selectedOptions[0]);
    return { name: label(s), disabled: s.disabled, first, choosable: rest.filter((o) => !o.disabled).length, hidden: opts.filter((o) => o.hidden || o.style.display === 'none').length };
  });
  // A bar: the nearest box around a search field that also holds a facet, up to three levels out.
  const bars = [...document.querySelectorAll('input[type="search"]')].filter(shown).flatMap((q) => {
    let box = q.parentElement;
    for (let i = 0; box && i < 3 && ![...box.querySelectorAll(FACET)].some(shown); i++) box = box.parentElement;
    const facets = box ? [...box.querySelectorAll(FACET)].filter(shown) : [];
    if (!facets.length) return [];
    return [{ name: label(box), facetAfterSearch: facets.some((f) => q.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) }];
  });
  return { groups, tablists, menus, bars };
}

/* Each tab chosen in turn, after the settle time: where its tab list sits, and
   a survey of what that view shows. A tab that is a link would leave the page,
   so its list is reported as not measured rather than clicked. */
async function tabTops(tab, settle) {
  const lists = await call(tab, () => [...document.querySelectorAll('[role="tablist"]')]
    .filter((t) => t.getClientRects().length).map((t) => ({ name: t.getAttribute('aria-label') || t.id || 'tablist', tabs: t.querySelectorAll('[role="tab"]').length, links: t.querySelectorAll('a[href][role="tab"]').length })));
  const out = [], views = [], skipped = [];
  for (let l = 0; l < lists.length; l++) {
    if (lists[l].links) { skipped.push(lists[l].name); continue; }
    const tops = [];
    for (let i = 0; i < lists[l].tabs; i++) {
      const top = await call(tab, (l, i, settle) => {
        const list = [...document.querySelectorAll('[role="tablist"]')].filter((t) => t.getClientRects().length)[l];
        if (!list) return null;
        list.querySelectorAll('[role="tab"]')[i].click();
        return new Promise((r) => setTimeout(() => r(list.isConnected ? list.getBoundingClientRect().top + scrollY : null), settle));
      }, l, i, settle);
      if (top === null) break;
      tops.push(top);
      views.push(await call(tab, survey));
    }
    out.push({ name: lists[l].name, tops });
  }
  return { tops: out, views, skipped };
}

/** The findings for one page's survey and tab positions. Pure, so the test feeds it. */
export function judge(s, tops, L) {
  const f = [];
  for (const g of s.groups) if (g.buttons > L.maxSegments)
    f.push(`design-standard rule 4: "${g.name}" is ${g.buttons} segmented buttons; past ${L.maxSegments} a facet is a menu`);
  for (const t of s.tablists) if (t.rows > 1)
    f.push(`design-standard rule 3: tabs "${t.name}" wrap onto ${t.rows} rows; tabs keep one row and scroll`);
  for (const b of s.bars) if (b.facetAfterSearch)
    f.push(`design-standard rule 3: in "${b.name}" a facet follows the search; facets and toggles come first, search last`);
  for (const m of s.menus) {
    if (!m.choosable && !m.disabled) f.push(`design-standard rule 5: menu "${m.name}" offers nothing to choose and is not disabled`);
    if (m.hidden) f.push(`design-standard rule 5: menu "${m.name}" hides ${m.hidden} option(s); an option that leads nowhere is disabled, not hidden`);
    if (/^all\b(\s*\(\d+\))?$/i.test(m.first)) f.push(`design-standard rule 12: menu "${m.name}" opens on "${m.first}"; its first option names what "all" covers`);
  }
  for (const { name, tops: t } of tops) {
    const spread = Math.max(...t) - Math.min(...t);
    if (t.length > 1 && spread > L.shiftTolerance) f.push(`design-standard rule 2: switching tabs in "${name}" moves it ${Math.round(spread)}px; the layout holds still`);
  }
  return f;
}

/* The page whole, in the three looks a reviewer needs: desktop light and dark, phone. */
async function shoot(tab, url, dir, L, width) {
  // The port and the query too, so two sites side by side, or two views of one
  // page, do not overwrite each other's shots.
  const u = new URL(url), name = (u.port ? u.port + '-' : '') + (u.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home') + (u.search ? '-' + u.search.slice(1).replace(/[^\w-]+/g, '_') : '');
  const out = [];
  for (const [look, w, scheme] of [['desktop', width, 'light'], ['dark', width, 'dark'], ['phone', L.phoneWidth, 'light']]) {
    await media(tab, { 'prefers-color-scheme': scheme });
    await viewport(tab, w, L.viewportHeight);
    await navigate(tab, url, { until: 'networkIdle' });
    await new Promise((r) => setTimeout(r, L.settleMs));
    const h = Math.min(L.shotMaxHeight, await call(tab, () => document.documentElement.scrollHeight));
    await viewport(tab, w, h);
    const file = path.join(dir, `${name}-${look}.png`);
    fs.writeFileSync(file, Buffer.from(await screenshot(tab), 'base64'));
    out.push(file);
  }
  await media(tab, { 'prefers-color-scheme': 'light' });
  await viewport(tab, width, L.viewportHeight);
  return out;
}

export async function checkPages(urls, { project, width, shots } = {}) {
  const L = limits(project);
  const browser = await launch({ chrome: CHROME });
  const results = [];
  try {
    const tab = await attach(await newPage(browser.endpoint));
    await viewport(tab, width || L.viewportWidth, L.viewportHeight);
    for (const url of urls) {
      try {
        await navigate(tab, url, { until: 'networkIdle' });
        const s = await call(tab, survey);
        const { tops, views, skipped } = await tabTops(tab, L.settleMs);
        // Every view a tab shows is judged; a finding met in two views is said once.
        const findings = [...new Set([s, ...views].flatMap((v, i) => judge(v, i ? [] : tops, L)))];
        const files = shots ? await shoot(tab, url, shots, L, width || L.viewportWidth) : [];
        results.push({ url, findings, files, notMeasured: skipped.map((n) => `tabs "${n}" are links, so switching them was not measured`) });
      } catch (e) { results.push({ url, error: String(e.message || e).split('\n')[0] }); }
    }
  } finally { await browser.close(); }
  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i > -1 ? args.splice(i, 2)[1] : null; };
  const project = opt('--project'), width = Number(opt('--width')) || undefined, shots = opt('--shots');
  if (shots) fs.mkdirSync(shots, { recursive: true });
  if (!args.length) { console.error('usage: node tools/ui-check/check.mjs <url> [<url> …] [--project <label>] [--width <px>] [--shots <dir>]'); process.exit(2); }
  const results = await checkPages(args, { project, width, shots });
  let n = 0, errors = 0;
  for (const r of results) {
    if (r.error) { console.log(`ERROR ${r.url}\n     ${r.error}`); errors++; continue; }
    console.log(`${r.findings.length ? 'RED  ' : 'ok   '}${r.url}`);
    for (const x of r.findings) { console.log('     ' + x); n++; }
    for (const x of r.notMeasured) console.log('     not measured: ' + x);
  }
  console.log(errors ? `${errors} page(s) could not be checked` : n ? `${n} finding(s)` : 'clean');
  if (shots) console.log(`${results.reduce((k, r) => k + (r.files || []).length, 0)} screenshot(s) in ${shots}: look at every one before the change ships`);
  // 2 when a page could not be checked: a run that did not happen is never read as findings or as clean.
  process.exit(errors ? 2 : n ? 1 : 0);
}
