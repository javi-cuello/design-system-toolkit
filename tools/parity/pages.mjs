#!/usr/bin/env node
/*
 * tools/parity/pages.mjs — two gates over a project's own pages that no
 * measurement against a frame can see, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 *   node tools/parity/pages.mjs --repo <dir> structure [path]
 *   node tools/parity/pages.mjs --repo <dir> overflow [path]
 *
 * `structure`: the markup contract a stylesheet that selects on landmarks,
 * headings and aria depends on — one <main>, one <h1> inside it, heading
 * levels that never skip (inside an <article> of synced prose the posting's
 * own depth is kept), ids that appear once, every <nav>, <aside> and
 * <section> named, every aria-labelledby and aria-describedby resolving.
 *
 * `overflow`: an element drawn outside the box meant to hold it, at widths
 * between the frames as well as at them. A graphic shipped at 260px inside a
 * 120px disc, covering the text beside it, with every parity row green: the
 * run measures the layers a mapping names, and nothing compared a box with
 * the box around it. A child wider or taller than its parent's content box
 * (by more than 2px) is the finding, unless the parent scrolls, the child is
 * inline (its rect is the font's em box), or the parent truncates with an
 * ellipsis on purpose; an absolutely placed child answers instead to its
 * clipping ancestor, and must have one or stay inside the viewport.
 *
 * The project's facts, in `parity.pages` of its snapshot.config.json: `base`
 * (where the pages are served), `paths`, `find` (a selector on the base's
 * front page whose first link adds that page and its parent: the pages whose
 * address depends on content), and `overflow` (`widths`, and `waivers`, each
 * `{ child, parent, why }`, regexes over the element names reported). Exit 0
 * is green.
 *
 * A third gate, `axe`, runs axe-core's WCAG 2.2 A and AA rules
 * (tools/ui-check/axe.mjs) on the same pages, so a project gets it by
 * declaring its pages once; `parity.pages.axe.disable` lists rules it rules
 * out, each a decision the context document records.
 */
import { loadProject } from './project.mjs';
import { session } from './session.mjs';
import * as cdp from '../shared/cdp.mjs';

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
/* In the page: the structural contract's breaches, as sentences. */
export function structureProbe() {
  const out = [];
  const mains = document.querySelectorAll('main');
  if (mains.length !== 1) out.push(`${mains.length} <main> elements`);
  const h1s = document.querySelectorAll('h1');
  if (h1s.length !== 1) out.push(`${h1s.length} <h1> elements`);
  else if (!h1s[0].closest('main')) out.push('the <h1> sits outside <main>');
  // a level deeper than the last by more than one is a jump a heading-list
  // reader falls through
  let last = 0;
  for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    const level = +h.tagName[1];
    if (last && level > last + 1 && !h.closest('article')) out.push(`heading jump h${last} → h${level} at "${h.textContent.trim().slice(0, 40)}"`);
    last = level;
  }
  // an id is an address: with two, every reference points at whichever the parser kept
  const seen = new Map();
  for (const el of document.querySelectorAll('[id]')) {
    if (seen.has(el.id)) out.push(`duplicate id "${el.id}" (${seen.get(el.id)} and ${el.tagName.toLowerCase()})`);
    else seen.set(el.id, el.tagName.toLowerCase());
  }
  // a landmark without a name is "navigation, navigation" to a rotor reader
  for (const el of document.querySelectorAll('nav, aside, section')) {
    // the class says which one: "unnamed <section>" nine times named nothing a reader could find
    if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) out.push(`unnamed <${el.tagName.toLowerCase()}${el.classList[0] ? ` class="${el.classList[0]}"` : ''}>`);
  }
  // code-standard 19: a details used as a menu (its content floats over the
  // page) gets Escape and a click outside from the script, never the platform
  for (const d of document.querySelectorAll('details')) {
    const summary = d.querySelector(':scope > summary');
    const body = [...d.children].find((c) => c !== summary);
    if (!summary || !body) continue;
    const was = d.open;
    d.open = true;
    if (!/absolute|fixed/.test(getComputedStyle(body).position)) { d.open = was; continue; }
    const name = summary.textContent.trim().slice(0, 30);
    summary.focus();
    (document.activeElement || d).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    if (d.open) out.push(`the menu "${name}" stays open on Escape (code-standard 19)`);
    d.open = true;
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (d.open) out.push(`the menu "${name}" stays open on a click outside it (code-standard 19)`);
    d.open = was;
  }
  // code-standard 15: a count is a description, not part of a name — "Design
  // 354" is one phrase to a screen reader; the count goes in aria-describedby
  for (const el of document.querySelectorAll('input[type=checkbox], input[type=radio]')) {
    // the name as the browser computes it from a label: its text, less what is aria-hidden
    const text = (l) => { const c = l.cloneNode(true); c.querySelectorAll('[aria-hidden="true"], input').forEach((x) => x.remove()); return c.textContent; };
    const name = (el.getAttribute('aria-label') || [...(el.labels || [])].map(text).join(' ')).replace(/\s+/g, ' ').trim();
    // a count is an element of its own holding only a number, left in the name;
    // "Top 10" written as one phrase is a label, not a count
    const counted = [...(el.labels || [])].some((l) => [...l.querySelectorAll('*')].some((c) => c !== el && !c.children.length && /^\(?\d[\d,.]*\)?$/.test(c.textContent.trim()) && !c.closest('[aria-hidden="true"]')));
    // and a count written into the words: "(354)" at the end, or any trailing number in an aria-label
    if (counted || /\(\d[\d,.]*\)$/.test(name) || (el.getAttribute('aria-label') && /\s\d[\d,.]*$/.test(name))) out.push(`a count inside the name of a ${el.type}: "${name.slice(-40)}" (code-standard 15)`);
  }
  for (const el of document.querySelectorAll('[aria-labelledby], [aria-describedby]')) {
    for (const attr of ['aria-labelledby', 'aria-describedby']) {
      for (const id of (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean)) {
        if (!document.getElementById(id)) out.push(`${attr}="${id}" points at nothing (${el.tagName.toLowerCase()})`);
      }
    }
  }
  return out;
}

/* In the page: code-standard 14, a live swap keeps the reader's place. The
   first checkbox of a form on a page with a live region is focused and
   toggled; once the region has changed, focus must be on that control again,
   never on <body>. Toggled back after, so the page is left as found. */
export async function swapProbe() {
  const live = document.querySelector('[aria-live]');
  const box = [...document.querySelectorAll('form input[type=checkbox]:not([disabled])')][0];
  if (!live || !box) return { examined: 0 };
  const key = { name: box.name, value: box.value };
  for (let a = box.parentElement; a; a = a.parentElement) if (a.tagName === 'DETAILS') a.open = true;
  // three seconds: a local swap answers in well under one, and a page whose region ignores the box costs two waits
  const swapped = () => new Promise((done) => { const o = new MutationObserver(() => { o.disconnect(); setTimeout(done, 400); }); o.observe(live, { childList: true, subtree: true, characterData: true }); setTimeout(() => { o.disconnect(); done(); }, 3000); });
  box.focus();
  let wait = swapped(); box.click(); await wait;
  const a = document.activeElement;
  const kept = a && a.tagName === 'INPUT' && a.name === key.name && a.value === key.value;
  const where = a ? a.tagName.toLowerCase() + (a.name ? `[name=${a.name}]` : '') : 'nothing';
  // found again by name and value, or, with no name, as the first box it was
  const again = key.name ? document.querySelector(`form input[type=checkbox][name="${CSS.escape(key.name)}"][value="${CSS.escape(key.value)}"]`) : document.querySelector('form input[type=checkbox]:not([disabled])');
  if (again) { wait = swapped(); again.click(); await wait; }
  return { examined: 1, kept, where, control: `${key.name}=${key.value}` };
}

/* In the page, once its fonts are in: every box that leaves the box meant to hold it. */
export async function overflowProbe() {
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 250));
  const out = [];
  const name = (el) => {
    const id = el.id ? '#' + el.id : '';
    const data = [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => '[' + a.name + ']')[0] || '';
    return el.tagName.toLowerCase() + id + data;
  };
  for (const el of document.querySelectorAll('body *')) {
    const p = el.parentElement;
    if (!p || p === document.body) continue;
    const ps = getComputedStyle(p), es = getComputedStyle(el);
    if (es.position === 'absolute' || es.position === 'fixed') {
      if (es.display === 'none' || es.visibility === 'hidden') continue;
      // a closed details hides its content on ::details-content, which no
      // computed style on the element itself betrays
      if (el.closest('details:not([open])')) continue;
      const er = el.getBoundingClientRect();
      if (!er.width && !er.height) continue;
      let clip = null;
      for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (/hidden|clip|auto|scroll/.test(s.overflowX + s.overflowY)) { clip = a; break; }
      }
      if (!clip && (er.right > innerWidth + 2 || er.left < -2 || er.bottom > document.documentElement.scrollHeight + 2)) {
        out.push({ el: name(el), parent: '(nothing clips it)', child: Math.round(er.width) + 'x' + Math.round(er.height), box: 'viewport' });
      }
      continue;
    }
    if (es.display === 'none' || es.visibility === 'hidden' || es.display === 'inline') continue;
    if (/auto|scroll/.test(ps.overflowX + ps.overflowY)) continue;
    if (/ellipsis/.test(ps.textOverflow) || (ps.webkitLineClamp && ps.webkitLineClamp !== 'none')) continue;
    const pr = p.getBoundingClientRect(), er = el.getBoundingClientRect();
    if (!er.width && !er.height) continue;
    const w = pr.width - (parseFloat(ps.paddingLeft) || 0) - (parseFloat(ps.paddingRight) || 0);
    const h = pr.height - (parseFloat(ps.paddingTop) || 0) - (parseFloat(ps.paddingBottom) || 0);
    if (er.width - w > 2 || er.height - h > 2) out.push({ el: name(el), parent: name(p), child: Math.round(er.width) + 'x' + Math.round(er.height), box: Math.round(w) + 'x' + Math.round(h), clipped: /hidden|clip/.test(ps.overflowX + ps.overflowY) });
  }
  return out;
}

/* The pages: the project's paths, and the ones its content decides. */
async function pagesOf(tabs, F, only) {
  if (only) return [only];
  const pages = [...(F.paths || ['/'])];
  if (!F.find) return pages;
  const tab = await tabs.acquire();
  try {
    await cdp.navigate(tab, F.base + '/', { until: 'DOMContentLoaded' });
    const href = await cdp.call(tab, (sel) => document.querySelector(sel)?.href, F.find);
    if (!href) throw new Error(`parity.pages.find "${F.find}" matched no link on ${F.base}/ — the content-driven pages were not checked, and that is not a pass`);
    const p = new URL(href).pathname;
    pages.push(p, p.split('/').slice(0, -1).join('/'));
  } finally { tabs.release(tab); }
  return pages;
}

/* A page that did not report is a finding, never a skipped row. */
async function onPage(tabs, url, width, fn) {
  const tab = await tabs.acquire();
  try {
    if (tabs.go) await tabs.go(tab, url, width);
    else {
      await cdp.viewport(tab, width, 1400);
      // code-standard 35: the scheme is the check's (the project's drawn tier), never the machine's
      if (tabs.scheme) await cdp.media(tab, { 'prefers-color-scheme': tabs.scheme });
      await cdp.navigate(tab, url, { until: 'load', timeout: 45_000 });
      if (tabs.scheme && !await cdp.call(tab, (s) => matchMedia(`(prefers-color-scheme: ${s})`).matches, tabs.scheme)) throw new Error(`the page did not render in the ${tabs.scheme} scheme it was given`);
    }
    const r = await cdp.call(tab, fn);
    tabs.release(tab);
    return r;
  } catch (e) { await tabs.discard(tab); return { failed: e.message.split('\n')[0] }; }
}

export async function structure(tabs, F, only) {
  const pages = await pagesOf(tabs, F, only);
  const problems = [];
  let swaps = 0;
  // one load per page: the contract first, then the live swap, which changes the page
  const both = `async () => ({ found: (${structureProbe})(), swap: await (${swapProbe})() })`;
  for (const p of pages) {
    const r = await onPage(tabs, F.base + p, 1280, both);
    if (r.failed) { problems.push(`${p}: did not report (${r.failed})`); continue; }
    for (const f of r.found) problems.push(`${p}: ${f}`);
    swaps += r.swap.examined;
    if (r.swap.examined && !r.swap.kept) problems.push(`${p}: toggling ${r.swap.control} swapped the live region and left focus on ${r.swap.where} (code-standard 14)`);
  }
  return { pages, problems, swaps };
}

export async function axe(tabs, F, only) {
  const { axeProbe } = await import('../ui-check/axe.mjs');
  const probe = axeProbe((F.axe && F.axe.disable) || []);
  const pages = await pagesOf(tabs, F, only);
  const problems = [];
  for (const p of pages) {
    const r = await onPage(tabs, F.base + p, 1280, probe);
    if (r.failed) { problems.push(`${p}: did not report (${r.failed})`); continue; }
    for (const v of r) problems.push(`${p}: ${v.id} (${v.impact}) ${v.help} — ${v.targets.slice(0, 3).join(', ')}${v.targets.length > 3 ? ` and ${v.targets.length - 3} more` : ''}`);
  }
  return { pages, problems };
}

export async function overflow(tabs, F, only) {
  const O = F.overflow || {};
  const pages = await pagesOf(tabs, F, only);
  const widths = O.widths || [1280];
  const waivers = (O.waivers || []).map((w) => ({ child: new RegExp(w.child), parent: new RegExp(w.parent) }));
  const runs = pages.flatMap((p) => widths.map((width) => ({ p, width })));
  const done = new Array(runs.length);
  let next = 0;
  // four windows: the pages' images come from the project's server, and a
  // wider fan-out queues on it rather than gaining anything
  await Promise.all(Array.from({ length: Math.min(4, runs.length) }, async () => {
    while (next < runs.length) { const i = next++; done[i] = { ...runs[i], rows: await onPage(tabs, F.base + runs[i].p, runs[i].width, overflowProbe) }; }
  }));
  const problems = [];
  for (const { p, width, rows } of done) {
    if (rows.failed) { problems.push(`${p} @${width}: did not report (${rows.failed})`); continue; }
    for (const r of rows.filter((x) => !waivers.some((w) => w.child.test(x.el) && w.parent.test(x.parent)))) {
      problems.push(`${p} @${width}: ${r.clipped ? 'clipped' : 'escapes'} ${r.el} ${r.child} in ${r.parent} ${r.box}`);
    }
  }
  return { pages, widths, problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--repo');
  const repo = i >= 0 ? argv.splice(i, 2)[1] : process.cwd();
  const [gate, only] = argv;
  if (!['structure', 'overflow', 'axe'].includes(gate)) { console.log('usage: pages.mjs --repo <dir> structure|overflow|axe [path]'); process.exit(2); }
  const project = await loadProject(repo);
  const F = project.parity.pages;
  /* A project whose pages are an app behind a sign-in has no plain base to
     serve them from: its pages are the routes its screen targets open, through
     the same signed-in session the parity run uses (2026-10-03: one of two
     projects ran neither gate because it had no `pages.base`). */
  const routes = [...new Set(project.targets.filter((t) => t.kind === 'screen' && t.mapping.route).map((t) => t.mapping.route))];
  const viaApp = !(F && F.base) && project.parity.app && routes.length;
  if (!(F && F.base) && !viaApp) { console.log('neither parity.pages.base nor an app with screen routes: no pages to check, and that is not a pass'); process.exit(1); }
  const S = await session(project, { page: false, app: Boolean(viaApp), say: () => {} });
  const G = viaApp
    ? { acquire: S.acquire, release: S.release, discard: S.discard, go: (tab, route, width) => S.ROUTES.open(tab, { route, tier: project.parity.tiers[0], viewport: [width, 1400] }) }
    : { acquire: S.acquire, release: S.release, discard: S.discard, scheme: String(project.parity.tiers[0]).toLowerCase() };
  const pagesF = viaApp ? { ...(F || {}), base: '', paths: routes, find: null } : F;
  const r = gate === 'structure' ? await structure(G, pagesF, only) : gate === 'axe' ? await axe(G, pagesF, only) : await overflow(G, pagesF, only);
  for (const p of r.problems.slice(0, 40)) console.log(`  ${p}`);
  if (r.problems.length > 40) console.log(`  …and ${r.problems.length - 40} more`);
  console.log(r.problems.length
    ? `${r.problems.length} problem(s) across ${r.pages.length} pages`
    : gate === 'axe' ? `${r.pages.length} pages: no WCAG 2.2 A or AA violation axe-core can find`
    : gate === 'structure'
      ? `${r.pages.length} pages: one h1 in main, ordered headings, unique ids, named landmarks, resolving aria references; ${r.swaps} live swap(s) kept focus`
      : `nothing is drawn outside the box meant to hold it (${r.pages.length} pages at ${r.widths.join(', ')})`);
  S.close();
  process.exit(r.problems.length ? 1 : 0);
}
