#!/usr/bin/env node
/*
 * tools/parity/propose.mjs — the map for a screen, proposed instead of typed,
 * part of the design-to-code parity engine (README.md here; the method is
 * skills/design-code-parity, "Propose the map, do not type it").
 *
 *   node tools/parity/propose.mjs --repo <dir> <screen-key> [/route]           # print the proposal
 *   node tools/parity/propose.mjs --repo <dir> <screen-key> [/route] --write   # merge what is missing into the screens map
 *
 * A frame arrives from Figma and every layer in it has to be pointed at an
 * element. By hand that is the slow half of adding a screen and the half that
 * fails quietly: a layer nobody maps is a layer nobody measures, and the
 * coverage gate can say which layer but not what to write. So the page is put
 * on screen as the run puts it (session.mjs), the frame is laid beside it, and
 * each layer the coverage gate counts as unmapped (gates.mjs `screenCoverage`)
 * is paired with the element in the same place with the same shape. Every
 * line is a proposal checked by the same parity run as everything else: a
 * wrong guess becomes a difference, which is the loud kind of wrong.
 *
 * What is the project's comes from its `snapshot.config.json` (project.mjs):
 * the frames, the screens map (`parity.mappings.screens`; `--write` edits a
 * `json` one and says the lines for a map that is code), the running product
 * (`parity.app`), the element a library component renders as
 * (`parity.instance`). A screen key the map does not hold yet is a frame id;
 * its route is then given. Nothing here names a project.
 */
import fs from 'node:fs';
import path from 'node:path';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { layerAt, layerIndex } from './layers.mjs';
import { screenCoverage } from './gates.mjs';
import { resolveBases } from './project.mjs';

const require = createRequire(import.meta.url);
const { slug } = require('../snapshot/spec.cjs');
const { nameOf } = require('../snapshot/graph.cjs');

/* Every node's box in the frame's own coordinates, the frame at 0,0: what a
   page's document-relative boxes are compared with. A node's drawn box
   (`visual`) where the store keeps one, else its layout box. */
export function frameBoxes(tree) {
  const boxes = new Map();
  (function walk(n, ax, ay, top) {
    const b = n.visual || n;
    const x = top ? 0 : ax + (b.x || 0), y = top ? 0 : ay + (b.y || 0);
    boxes.set(n, { x, y, w: Math.round(b.w || 0), h: Math.round(b.h || 0) });
    (n.children || []).forEach((c) => walk(c, x, y, false));
  })(tree, 0, 0, true);
  return boxes;
}

/* The layers to propose for: those the coverage gate counts and nothing maps,
   each with its box in the frame. A layer mapped to null that paints is the
   gate's to say; it is mapped, so nothing is proposed over it. */
export function wanted(target) {
  const tree = target.spec.variants[0];
  const index = layerIndex(tree);
  const boxes = frameBoxes(target.frame ? target.frame.tree : tree);
  const own = frameBoxes(tree);
  const { total, missed } = screenCoverage(tree, target.mapping);
  const layers = missed.filter((p) => index.has(p)).map((p) => {
    const node = index.get(p).node;
    return { path: p, node, ...(boxes.get(node) || own.get(node)) };
  });
  return { total, layers };
}

/* What the page is read as, in the page: every element under <body> with its
   box in the window (a scrolled screen's frame draws the window, its content
   moved by the scroll; an unscrolled page reads the same), its hooks, its
   parent, its words where it holds no element; and which elements the map's
   own selectors already name, so a proposal never takes one. */
export const collect = (selectors) => `JSON.stringify((() => {
  const all = [...document.querySelectorAll('body *')];
  const at = new Map(all.map((e, i) => [e, i]));
  const els = all.map((e, i) => { const b = e.getBoundingClientRect(); const attrs = {};
    for (const a of e.attributes) if (/^(id|data-[a-z0-9-]+|aria-label|aria-labelledby)$/.test(a.name)) attrs[a.name] = a.value;
    return { i, tag: e.tagName.toLowerCase(), parent: e.parentElement ? at.get(e.parentElement) ?? null : null, attrs,
      x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height),
      text: e.children.length ? '' : e.textContent.replace(/\\s+/g, ' ').trim().slice(0, 60) }; });
  const taken = [];
  for (const s of ${JSON.stringify(selectors)}) { try { for (const e of document.querySelectorAll(s)) if (at.has(e)) taken.push(at.get(e)); } catch {} }
  return { els, taken };
})())`;

/* The selectors a mapping already holds: a string, or a ruling's own. */
export const mappedSelectors = (mapping) => Object.values(mapping.layers || {})
  .map((v) => (typeof v === 'string' ? v : v && typeof v.selector === 'string' ? v.selector : null)).filter(Boolean);

/* A selector a person would have written: an id, then a landmark's name or a
   data hook, then the element's own tag under the nearest ancestor that has
   one, at most four steps. Never :nth-child — a proposal that keys on
   position is a proposal that rots. */
const quoted = (v) => `"${String(v).replace(/[\\"]/g, '\\$&').replace(/\n/g, '\\a ').replace(/\r/g, '\\d ').replace(/\f/g, '\\c ')}"`;
/* An id a framework generates per render names nothing the next render
   keeps: it is no hook. React's `useId` shapes, alone or inside a library's
   id (`radix-:r1:`, `«r1»`, `radix-_r_1_`); `form:panel:user` is no such shape. */
// React's ids (`:r1:`, `«r2»`, `_r_3_`), never a colon-separated word inside an id (`app:root:main`)
// (a server render's `_R_1_` and a second id's `:R2aH1:` included)
const GENERATED = /(^|[^A-Za-z0-9])(:[rR][0-9a-zA-Z]+:|«[rR][0-9a-zA-Z]+»|_[rR]_[0-9a-zA-Z]+_)($|[^A-Za-z0-9])/;
export function selectorFor(el, byIndex) {
  const step = (e) => {
    // an id CSS reads bare, else as an attribute
    if (e.attrs.id && !GENERATED.test(e.attrs.id)) return /^-?[A-Za-z_][\w-]*$/.test(e.attrs.id) ? `#${e.attrs.id}` : `[id=${quoted(e.attrs.id)}]`;
    if (e.attrs['aria-labelledby'] && !e.attrs['aria-labelledby'].split(/\s+/).some((t) => GENERATED.test(t))) return `${e.tag}[aria-labelledby=${quoted(e.attrs['aria-labelledby'])}]`;
    if (e.attrs['aria-label']) return `${e.tag}[aria-label=${quoted(e.attrs['aria-label'])}]`;
    // a Vue scoped-style stamp (`data-v-<hash>`) is the build's, not a hook
    const data = Object.keys(e.attrs).find((a) => a.startsWith('data-') && !a.startsWith('data-v-'));
    return data ? `${e.tag}[${data}]` : e.tag;
  };
  const parts = [];
  for (let e = el, depth = 0; e && depth < 4; e = e.parent === null ? null : byIndex[e.parent], depth++) {
    const s = step(e);
    parts.unshift(s);
    if (s.startsWith('#') || s.includes('[')) break;  // an id or a hook ends the walk
  }
  return parts.join(' > ');
}

/* Further than this (position and size apart, in px, after the signals) is
   nothing close enough: said as unmatched, never guessed. */
export const FAR = 120;

/*
 * Each layer paired with the element in the same place with the same shape:
 * position first, because a design's layer is where it is, then size; a text
 * layer prefers the element holding its words and refuses one holding none;
 * an instance prefers the element its component renders as, and any other
 * layer the element of its own name's component, where there is one (`instanceTag`).
 * Greedy in the frame's order, one element a layer.
 */
export function propose(layers, els, { all = els, taken = [], instanceTag = () => null } = {}) {
  // ancestors from every element read, a box of no size or `display: contents` among them
  const byIndex = Object.fromEntries(all.map((e) => [e.i, e]));
  const used = new Set(taken);
  const proposal = {};
  const unmatched = [];
  for (const l of layers) {
    const tag = instanceTag(l.node);
    const words = l.node.type === 'TEXT' && l.node.text ? String(l.node.text).trim() : null;
    const score = (e) => {
      let s = Math.abs(e.x - l.x) + Math.abs(e.y - l.y) + Math.abs(e.w - l.w) + Math.abs(e.h - l.h);
      if (tag && e.tag === tag) s -= 200;
      if (words && e.text && e.text.trim() === words) s -= 200;
      if (l.node.type === 'TEXT' && !e.text) s += 100;
      return s;
    };
    let best = null;
    for (const e of els) { if (used.has(e.i)) continue; const s = score(e); if (!best || s < best[0]) best = [s, e]; }
    if (!best || best[0] > FAR) { unmatched.push(l.path); continue; }
    used.add(best[1].i);
    proposal[l.path] = selectorFor(best[1], byIndex);
  }
  return { proposal, unmatched };
}

/*
 * The screens map with the proposal merged in: only layers the entry does not
 * hold as the run reads it (`resolveBases`, then `layers || nodes`, as
 * project.mjs normalises), and never over a `false` it states. The lines go
 * under the key the run reads: a based entry inherits only `nodes`, so one
 * with no map of its own takes `nodes`, and a based entry the run reads
 * through `layers` is refused with the rename that fixes it — a copy of what
 * it inherits would freeze it, and `nodes` beside `layers` is never read. A
 * new entry takes the file's key, `route` and `rootLayer`; an entry that has
 * a route keeps it. → { map, added, skipped, route } or { refused }
 */
export function merge(raw, key, { route, rootLayer } = {}, proposal) {
  const own = raw[key];
  // a copy: resolveBases deletes a `false` from the entry's own map in place
  const read = own ? resolveBases(structuredClone(raw))[key] : null;
  const based = Boolean(own && own.base);
  let word;
  if (read && read.layers) {
    if (based) {
      const at = [];
      for (let k = key, seen = new Set(); k && raw[k] && !seen.has(k); k = raw[k].base) { seen.add(k); if (raw[k].layers) at.push(k); }
      return { refused: `${key} inherits through \`base\`, which merges only \`nodes\`: rename \`layers\` to \`nodes\` in ${at.join(', ')}, then propose again` };
    }
    // a map others inherit from: lines written in `layers` reach none of them
    const heirs = Object.keys(raw).filter((k) => raw[k] && raw[k].base === key);
    if (heirs.length) return { refused: `${heirs.join(', ')} inherit${heirs.length > 1 ? '' : 's'} from ${key} through \`base\`, which merges only \`nodes\`: rename \`layers\` to \`nodes\` in ${key}, then propose again` };
    word = 'layers';
  } else if (read && read.nodes) word = 'nodes';
  else word = based ? 'nodes' : ['layers', 'nodes'].find((w) => Object.values(raw).some((e) => e && e[w])) || 'layers';
  const held = new Set([...Object.keys((read && read[word]) || {}), ...Object.keys((own && own[word]) || {})]);
  const fresh = Object.entries(proposal).filter(([k]) => !held.has(k));
  const entry = { ...(own || {}) };
  if (!own && rootLayer) entry.rootLayer = rootLayer;
  const hasRoute = Boolean(read && read.route);
  if (!hasRoute && route) entry.route = route;
  entry[word] = { ...((own && own[word]) || {}), ...Object.fromEntries(fresh) };
  return { map: { ...raw, [key]: entry }, added: fresh.length, skipped: Object.keys(proposal).length - fresh.length, route: hasRoute ? null : route || null };
}

/* The key a map that is code is read through (project.mjs normalises
   `layers || nodes` into `layers`): `nodes` where that is what `layers` was
   read from. A code map has no `base` chain, so nothing in it is refused. */
export function codeWord(mapping) {
  if (!mapping.nodes) return 'layers';
  const { $root, ...nodes } = mapping.nodes;
  return JSON.stringify(nodes) === JSON.stringify(mapping.layers) ? 'nodes' : 'layers';
}

/* A JSON file's own indent, tabs or spaces. */
export const indentOf = (text) => (/\n([ \t]+)"/.exec(text) || [])[1] || '  ';

/* The map as the file held it: its indent, its line ends (CRLF stays CRLF)
   and its final newline or none. The keys come back in JSON.stringify's
   layout, so a file laid out by hand otherwise may show more than the lines
   added. */
export function serialise(text, map) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  return JSON.stringify(map, null, indentOf(text)).replace(/\n/g, eol) + (/\n$/.test(text) ? eol : '');
}

/* A frame drawn as one page component, an instance Figma keeps unpublished
   (`_` or `.` before its name, or its component's own) and the frame's only child: the screen is that
   instance's contents, named under it, as a mapping's `rootLayer` says. */
export function pageComponent(tree) {
  const kids = tree.children || [];
  const k = kids[0];
  const hidden = (s) => /^[_.]/.test(String(s || '').trim());
  // the component's own name: its folder steps and its set's, the variant's `Prop=Value` left out, the last one
  const own = String(k && k.instanceOf || '').split(/\s*\/\s*/).filter((s) => s && !s.includes('=')).pop();
  return kids.length === 1 && k.type === 'INSTANCE' && (hidden(k.name) || hidden(own)) ? k.name : null;
}

/* The target for a screen key: the mapped screen, or a frame the map does
   not hold yet, as project.mjs would read it. */
export function targetFor(project, key, route) {
  const known = project.targets.find((t) => t.kind === 'screen' && (t.name === key || t.folder === key));
  if (known) return { ...known, mapping: { ...known.mapping, route: route || known.mapping.route } };
  const frame = project.frames.get(key);
  if (!frame) return null;
  const rootLayer = pageComponent(frame.tree);
  const tree = rootLayer ? layerAt(frame.tree, rootLayer) : frame.tree;
  return { name: key, kind: 'screen', folder: key, frame, spec: { variants: [{ ...tree, name: frame.name }] }, mapping: { layers: {}, route, ...(rootLayer && { rootLayer }) } };
}

/* The element a layer's component renders as, where the project names one:
   an instance's own component; else, for a layer that is no text, the
   component the library holds under the layer's own name (a frame
   `Container` drawn by the container's element) — unless an instance of that
   component sits inside it, which takes the element itself: a wrapper named
   for what it wraps is not what it wraps. A signal, never a pair. */
export function instanceTagger(project) {
  const pattern = project.parity && project.parity.instance;
  if (!pattern) return () => null;
  const folderOf = new Map([...project.specs].map(([folder, s]) => [s.name, folder]));
  const known = (n) => project.library.has(n);
  const ofInstance = (n) => nameOf(n.instanceOf, known);
  const tag = (name) => pattern.replace('{slug}', folderOf.get(name) || slug(name)).toLowerCase();
  const wraps = (n, name) => (n.children || []).some((c) => (c.type === 'INSTANCE' ? c.instanceOf && ofInstance(c) === name : wraps(c, name)));
  return (node) => {
    if (node.type === 'INSTANCE') return node.instanceOf ? tag(ofInstance(node)) : null;
    if (node.type === 'TEXT' || !folderOf.has(node.name) || wraps(node, node.name)) return null;
    return tag(node.name);
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const USAGE = 'usage: node tools/parity/propose.mjs --repo <dir> <screen-key> [/route] [--write]';
  const stop = (msg) => { console.error(msg); process.exit(2); };
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--repo');
  if (i >= 0 && (!argv[i + 1] || argv[i + 1].startsWith('-'))) stop(USAGE);
  const REPO = i < 0 ? process.cwd() : argv.splice(i, 2)[1];
  const write = argv.includes('--write');
  const rest = argv.filter((a) => a !== '--write');
  const keys = rest.filter((a) => !a.startsWith('-') && !a.startsWith('/'));
  const routes = rest.filter((a) => a.startsWith('/'));
  if (rest.some((a) => a.startsWith('-')) || keys.length !== 1 || routes.length > 1) stop(USAGE);
  const [key] = keys, [route] = routes;

  const { loadProject } = await import('./project.mjs');
  const { session } = await import('./session.mjs');
  const { findChrome } = await import('../shared/cdp.mjs');
  if (!fs.existsSync(findChrome())) stop(`no Chrome at ${findChrome()} — set CHROME to the browser the page is read in`);
  const project = await loadProject(REPO).catch((e) => { if (!e.usage) throw e; stop(e.message); });
  const target = targetFor(project, key, route);
  if (!target) stop(`${key}: no screen mapping and no frame of that id — is the frame marked Ready for dev, and snapshotted?`);
  if (!target.mapping.route) stop(`${key}: the screens map gives no route and none was given`);

  const { total, layers } = wanted(target);
  let read;
  try {
    const S = await session(project, { page: false, app: true, say: () => {} });
    const tab = await S.screen(target, project.parity.tiers[0]);
    read = JSON.parse(await tab.evaluate(collect(mappedSelectors(target.mapping))));
    S.release(tab);
  } catch (e) { stop(`${key}: the page could not be read — ${String(e.message).split('\n')[0]}`); }
  const seen = read.els.filter((e) => e.w > 0 || e.h > 0);
  if (!seen.length) stop(`${key}: the page at ${target.mapping.route} rendered no elements`);
  const { proposal, unmatched } = propose(layers, seen, { all: read.els, taken: read.taken, instanceTag: instanceTagger(project) });

  const entries = Object.entries(proposal);
  console.log(`${key}: ${total} layers counted, ${layers.length} unmapped, ${entries.length} proposed, ${unmatched.length} nothing matched${target.mapping.rootLayer ? ` (under ${target.mapping.rootLayer})` : ''}`);
  for (const [k, v] of entries) console.log(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  if (unmatched.length) console.log(`  no element close enough for: ${unmatched.slice(0, 10).join(', ')}${unmatched.length > 10 ? ` …+${unmatched.length - 10}` : ''}`);

  if (write && entries.length) {
    const how = (project.parity.mappings || {}).screens || {};
    if (!how.json && !how.module && !how.command) console.log('  nothing written: the project names no screens map (parity.mappings.screens)');
    else if (!how.json) console.log(`  the screens map is code (${how.module || how.command}): add the lines above under \`${codeWord(target.mapping)}\` in ${key}'s entry`);
    else {
      const file = path.join(REPO, how.json);
      // a map not written yet is an empty one, created here; a link is followed, and the file it names written
      const real = fs.existsSync(file) ? fs.realpathSync(file) : file;
      const text = fs.existsSync(real) ? fs.readFileSync(real, 'utf8') : '';
      let raw;
      try { raw = text.trim() ? JSON.parse(text) : {}; } catch (e) { stop(`  nothing written: ${how.json} is not JSON (${e.message.split('\n')[0]})`); }
      const m = merge(raw, target.name, { route: target.mapping.route, rootLayer: target.mapping.rootLayer }, proposal);
      if (m.refused) stop(`  nothing written: ${m.refused}`);
      // written whole or not at all: a temp file beside the real one, its mode kept, renamed over it
      const tmp = path.join(path.dirname(real), `.${path.basename(real)}.${process.pid}.tmp`);
      let failed = null;
      try {
        fs.writeFileSync(tmp, text ? serialise(text, m.map) : JSON.stringify(m.map, null, 2) + '\n');
        if (fs.existsSync(real)) fs.chmodSync(tmp, fs.statSync(real).mode & 0o7777);
        fs.renameSync(tmp, real);
      } catch (e) { failed = e; } finally { fs.rmSync(tmp, { force: true }); }
      if (failed) stop(`  nothing written: ${how.json} could not be replaced (${failed.code || failed.message.split('\n')[0]})`);
      console.log(`  merged ${m.added} into ${how.json}${m.skipped ? ` (${m.skipped} it holds, a false among them, left as they are)` : ''}${m.route ? `, with the route ${m.route}` : ''} — run the parity run on ${target.name} and read every line`);
    }
  }
  const mapped = targetFor(project, key).mapping.route;
  if (route && mapped && route !== mapped) console.log(`  read at ${route}; the map's route stays ${mapped}, and --write does not change it`);
  process.exit(0);
}
