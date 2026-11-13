#!/usr/bin/env node
/*
 * The battery: made-up contracts, one per cell of the translation table (rules.mjs) — sizing (direction × the box's
 * size × the child's along and across), alignment (direction × along × across), placement (every constraint pair, in
 * a frame and in an auto layout), and the odd ones (an empty box, a negative gap, wrap, min/max, padding per side) —
 * each sent round a path and held to itself by value, never by render. Abstracted from components: a cell that fails
 * here fails in every component that has it.
 *
 *   node tools/component-contract/test-battery.mjs                    contract → to-code's CSS → Chrome → the authored
 *                                                                      reader and the table (from-code's) → contract
 *   node tools/component-contract/test-battery.mjs --figma <fileKey> --project <label>
 *                                                                      also contract → to-figma → the file → the
 *                                                                      snapshot's walk and derive → contract
 *
 * The browser half skips, saying so, without Chrome; the Figma half runs only when asked, through the project's
 * docs service (it draws into the file it is given: a scratch file).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { toCss } from './to-code.mjs';
import { sizeFromCss, layoutFromCss, placeFromCss } from './rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };

/* ---- the cases ---- */
export function battery() {
  const A = {};
  let k = 0;
  const part = (id, e) => { A[id] = { kind: 'container', ...e }; };
  const L = (direction, extra = {}) => ({ direction, gap: 4, padding: { top: 0, end: 0, bottom: 0, start: 0 }, align: 'start', crossAlign: 'start', ...extra });
  const label = {};
  const box = (name, e) => { const id = `k${k}`; label[id] = name; part(id, { parent: 'root', order: k++, ...e }); return id; };
  const filler = (p, order) => part(`${p}/a${order}`, { parent: p, order, width: 40, height: 20 });
  // a subject that hugs holds something to hug
  const subject = (p, w, h) => {
    part(`${p}/b`, { parent: p, order: 1, width: w, height: h, ...((w === 'hug' || h === 'hug') && { layout: L('row') }) });
    if (w === 'hug' || h === 'hug') part(`${p}/b/x`, { parent: `${p}/b`, order: 0, width: 20, height: 10 });
  };
  part('root', { layout: L('column', { gap: 8 }), width: 'hug', height: 'hug' });
  const sizes = ['hug', 'fill', 60];
  for (const dir of ['row', 'column']) for (const outer of ['hug', 'fixed']) for (const along of sizes) for (const across of sizes) {
    const [w, h] = dir === 'row' ? [along, across] : [across, along];
    const id = box(`size: ${dir}, box ${outer}, child ${along} along and ${across} across`, { layout: L(dir), width: outer === 'hug' ? 'hug' : 200, height: outer === 'hug' ? 'hug' : 80 });
    filler(id, 0); subject(id, w, h);
  }
  for (const dir of ['row', 'column']) for (const align of ['start', 'center', 'end', 'space-between']) for (const crossAlign of ['start', 'center', 'end']) {
    const id = box(`align: ${dir}, ${align} along, ${crossAlign} across`, { layout: L(dir, { align, crossAlign }), width: 200, height: 80 });
    filler(id, 0); subject(id, 30, 30);
  }
  // as the snapshot says placement: absolute only inside an auto layout, pinned top left left out, a far offset where it pins
  const cons = ['min', 'max', 'center', 'stretch', 'scale'];
  for (const inFlow of [false, true]) for (const h of cons) for (const v of cons) {
    const id = box(`place: ${inFlow ? 'in an auto layout' : 'in a frame'}, ${h} / ${v}`, { ...(inFlow && { layout: L('row') }), width: 200, height: 100 });
    if (inFlow) filler(id, 0);
    const far = { ...((h === 'stretch' || h === 'max') && { end: 130 }), ...((v === 'stretch' || v === 'max') && { bottom: 60 }) };
    part(`${id}/p`, { parent: id, order: inFlow ? 1 : 0, ...(inFlow && { position: 'absolute' }), ...(!(h === 'min' && v === 'min') && { constraints: { horizontal: h, vertical: v } }), absolute: { x: 20, y: 10, ...far }, ...(h !== 'stretch' && { width: 50 }), ...(v !== 'stretch' && { height: 30 }) });
  }
  let id = box('an empty box at a fixed size', { layout: L('row'), width: 'hug', height: 'hug' }); part(`${id}/e`, { parent: id, order: 0, width: 24, height: 12 });
  id = box('an empty box filling one way, fixed the other', { layout: L('row'), width: 200, height: 'hug' }); part(`${id}/e`, { parent: id, order: 0, width: 'fill', height: 20 });
  id = box('a negative gap, first on top', { layout: L('row', { gap: -8, firstOnTop: true }), width: 'hug', height: 'hug' }); filler(id, 0); filler(id, 1);
  id = box('a negative gap beside a placed part', { layout: L('row', { gap: -8 }), width: 'hug', height: 'hug' }); filler(id, 0); part(`${id}/p`, { parent: id, order: 1, position: 'absolute', constraints: { horizontal: 'max', vertical: 'min' }, absolute: { x: 50, y: 0, end: 0 }, width: 22, height: 10 }); filler(id, 2);
  id = box('wrap with its own line gap', { layout: L('row', { wrap: true, crossGap: 6 }), width: 100, height: 'hug' }); for (let i = 0; i < 4; i++) filler(id, i);
  id = box('a minimum and a maximum', { layout: L('row'), width: 'hug', height: 'hug', minWidth: 120, maxWidth: 300 }); filler(id, 0);
  id = box('padding per side', { layout: L('row', { padding: { top: 1, end: 2, bottom: 3, start: 4 } }), width: 'hug', height: 'hug' }); filler(id, 0);
  return { contract: { contract: 1, component: 'Battery', props: {}, anatomy: A, variants: [] }, label };
}

const { contract, label } = battery();
const A = contract.anatomy;
const cases = Object.keys(label);
// a row's case: the id before its first '/' or '.' (a case box's own field is `k12.layout.gap`)
const caseOf = (id) => id.split(/[/.]/)[0];
const report = (side, rows) => {
  const bad = Object.keys(rows).filter((c) => c in label), other = Object.keys(rows).filter((c) => !(c in label));
  console.log(`${side}: ${cases.length - bad.length}/${cases.length} cases come back the same${other.length ? `, and ${other.length} difference(s) outside the cases` : ''}`);
  for (const c of bad) console.log(`  not the same — ${label[c]}\n    ${rows[c].join('\n    ')}`);
  // the battery's own box, its props, its name: nothing a case owns, and still a difference, never dropped
  for (const c of other) console.log(`  not the same — ${c}\n    ${rows[c].join('\n    ')}`);
  return bad.length + other.length;
};

/* ---- contract → CSS → Chrome → contract ---- */
async function browserSide() {
  const { findChrome, launch, newPage, attach, navigate, call } = await import('../shared/cdp.mjs');
  const { authoredWidth } = await import('../parity/external.mjs');
  if (!fs.existsSync(findChrome())) { console.log(`skip: no Chrome at ${findChrome()} — set CHROME to run the browser half`); return null; }
  const css = toCss(contract, 'battery');
  const cls = Object.fromEntries([...(/\/\* Parts: (.*?)\. \*\//.exec(css) || ['', ''])[1].matchAll(/([\w/]+) \.([\w-]+)/g)].map((m) => [m[1], m[2]]));
  cls.root = 'battery';
  const kids = (id) => Object.keys(A).filter((x) => A[x].parent === id).sort((a, b) => A[a].order - A[b].order);
  const html = (id) => `<div class="${cls[id]}" data-id="${id}">${kids(id).map(html).join('')}</div>`;
  const page = `<!doctype html><html><head><style>html{font-size:16px}body{margin:0}${css}</style></head><body><main style="display:block;width:1200px">${html('root')}</main></body></html>`;
  const b = await launch({});
  const rows = {};
  try {
    const tab = await attach(await newPage(b.endpoint));
    await navigate(tab, 'http://battery.test/', { html: page });
    const shown = await call(tab, () => Object.fromEntries([...document.querySelectorAll('[data-id]')].map((n) => [n.dataset.id, [getComputedStyle(n).display, getComputedStyle(n.parentElement).display]])));
    if (Object.keys(shown).length !== Object.keys(A).length) throw new Error(`the page drew ${Object.keys(shown).length} of ${Object.keys(A).length} parts`);
    const cache = new Map();
    const read = async (id, props) => { const o = {}; for (const p of props) o[p] = await authoredWidth(tab, `[data-id="${id}"]`, p, { raw: true, cache }); return o; };
    const SIZING = ['display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'justify-self', 'justify-items', 'flex', 'flex-grow', 'flex-basis', 'inline-size', 'width', 'block-size', 'height'];
    const LAYOUT = ['gap', 'row-gap', 'column-gap', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-block', 'padding-inline', 'padding-block-start', 'padding-block-end', 'padding-inline-start', 'padding-inline-end'];
    const PLACE = ['position', 'inset', 'inset-inline-start', 'inset-inline-end', 'inset-block-start', 'inset-block-end', 'left', 'right', 'top', 'bottom', 'translate', 'transform'];
    const px = (v) => { const m = /^(-?[\d.]+)(px|rem)?$/.exec(String(v ?? '').trim()); return m ? +(+m[1] * (m[2] === 'rem' ? 16 : 1)).toFixed(2) : v; };
    const diff = (id, f, want, got) => { if (JSON.stringify(want) !== JSON.stringify(got)) (rows[caseOf(id)] = rows[caseOf(id)] || []).push(`${id}.${f}: wrote ${JSON.stringify(want)}, read ${JSON.stringify(got)}`); };
    let readAny = 0;
    for (const id of Object.keys(A)) {
      if (id === 'root') continue;
      const e = A[id];
      const own = await read(id, [...SIZING, ...LAYOUT, ...PLACE]);
      const up = await read(e.parent, SIZING);
      readAny += Object.values(own).filter((v) => v != null).length;
      if (own.display == null) own.display = shown[id][0];
      if (up.display == null) up.display = shown[id][1];
      const place = placeFromCss(own);
      if (e.position === 'absolute' || e.constraints || e.absolute) { diff(id, 'constraints', e.constraints || { horizontal: 'min', vertical: 'min' }, place && place.constraints); continue; }
      if (place) diff(id, 'placed', null, place.constraints);
      for (const axis of ['width', 'height']) { const v = sizeFromCss(axis, own, up, { root: false }).value; diff(id, axis, e[axis], v === 'hug' || v === 'fill' ? v : px(v)); }
      if (!e.layout) continue;
      const second = kids(id).filter((x) => !(A[x].position === 'absolute' || A[x].absolute))[1];
      const l = layoutFromCss(own, second ? await read(second, ['margin-inline-start', 'margin-block-start', 'margin-left', 'margin-top']) : null) || {};
      for (const f of ['direction', 'align', 'crossAlign']) diff(id, `layout.${f}`, e.layout[f], l[f]);
      if (e.layout.align !== 'space-between') diff(id, 'layout.gap', e.layout.gap, px(l.gap));
      diff(id, 'layout.padding', e.layout.padding, l.padding && Object.fromEntries(Object.entries(l.padding).map(([s, v]) => [s, px(v)])));
      if (e.layout.wrap) { diff(id, 'layout.wrap', true, !!l.wrap); diff(id, 'layout.crossGap', e.layout.crossGap, px(l.crossGap)); }
    }
    // a reader that reads nothing passes every case: it is a failure of the probe, never a clean result
    if (readAny < 3 * Object.keys(A).length) throw new Error(`the reader returned ${readAny} declarations for ${Object.keys(A).length} parts: it read nothing`);
  } finally { await b.close(); }
  return report('contract → CSS → Chrome → contract', rows);
}

/* ---- contract → Figma → contract ---- */
async function figmaSide(into, project) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'battery-'));
  const file = path.join(dir, 'battery.json');
  fs.writeFileSync(file, JSON.stringify(contract));
  try { execFileSync('node', [path.join(HERE, 'to-figma.mjs'), file, '--run', '--project', project, '--into', into], { stdio: 'pipe', cwd: path.join(HERE, '../..') }); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
  const P = req('../snapshot/projects.cjs');
  const where = P.layout(null, project);
  const { serviceFor, figmaExec } = await import('../figma-audit/services.mjs');
  const svc = serviceFor(where.audit);
  // the one this run drew: to-figma draws a component on the page of its name, replacing the last drawing there
  const setId = await figmaExec(svc, into, `await figma.loadAllPagesAsync(); const pg = figma.root.children.find((x) => x.name === ${JSON.stringify(contract.component)}); const s = pg && pg.children.find((x) => (x.type === 'COMPONENT_SET' || x.type === 'COMPONENT') && x.name === ${JSON.stringify(contract.component)}); return s ? s.id : null;`, 30000);
  if (!setId) throw new Error(`Battery: not found drawn in ${into}`);
  const walk = fs.readFileSync(path.join(HERE, '../../plugins/design-system-snapshot/code.js'), 'utf8');
  const live = await figmaExec(svc, into, `const SCOPE = ${JSON.stringify([setId])};\n${walk}\nreturn __headless();`, 180000);
  const { compact } = req('../snapshot/spec.cjs');
  const { derive } = req('./derive.cjs');
  const now = derive(compact(live.components.find((x) => x.id === setId)), [], P.deriveOptions(P.auditContext(where.doc), into));
  const { roundTrip } = await import('./to-figma.mjs');
  const rows = {};
  for (const r of roundTrip(contract, now).rows) (rows[caseOf(r.at)] = rows[caseOf(r.at)] || []).push(`${r.at}: wrote ${JSON.stringify(r.library)}, read ${JSON.stringify(r.drawn)}`);
  return report('contract → Figma → contract', rows);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  let failed = 0;
  const b = await browserSide();
  if (b === null && !opt('--figma')) process.exit(77);
  failed += b || 0;
  if (opt('--figma')) {
    if (!opt('--project')) { console.error('usage: test-battery.mjs [--figma <fileKey> --project <label>]'); process.exit(2); }
    failed += await figmaSide(opt('--figma'), opt('--project'));
  }
  process.exit(failed ? 1 : 0);
}
