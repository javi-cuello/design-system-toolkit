#!/usr/bin/env node
/*
 * tools/parity/gates.mjs — the parity loop's gates, part of the design-to-code
 * parity engine (README.md here; the method is skills/design-code-parity §6).
 *
 *   node tools/parity/gates.mjs --repo <dir>    every gate that needs no browser
 *
 * A gate is a function of the project (project.mjs) and, for the ones a
 * render answers, of what the run measured; each returns findings, one line
 * each, and a finding fails. The ones here need no browser, and `run.mjs`
 * runs them too, so a full run is every gate:
 *
 *   waivers         gate 6   every waiver has its shape (an owner, a bound on a number) and names a layer that is drawn
 *   variants        gate 3   every variant drawn is rendered or `unmeasured`, and no excuse outlives it
 *   backlog         gate 2   every spec and frame is mapped or in the backlog with a reason, and no entry outlives its gap
 *   codeOnly        gate 4   every value a mapping's controls offer is rendered as a variant, or `codeOnly`
 *   literals        gate 5   no raw value where a token belongs, unless `literals` says why
 *   overrides       gates 18, 27  what a frame changes inside an instance it places is mapped, or `overrides` says why
 *   layerCoverage   gates 8, 13   every layer a frame composes or a variant draws is mapped, credited or `excluded`
 *   specKeys        gate 10  every key the snapshot records is compared or excused
 *   configured      notes    what a project leaves off, said rather than silent
 *
 * and the ones a render answers, which `run.mjs` calls with what it measured:
 *
 *   staleMappings   a mapped layer no rendered variant draws
 *   copyMissing     a word the frame draws that the page does not say, unless `content` says why
 *   domCoverage     an element a component renders that no mapped layer measures (DOM_COVERAGE runs in the page)
 *
 * Stale waivers (gate 6) are `waivers.mjs` `staleAcross`, and the baseline
 * (gate 12) `baseline.mjs`. Nothing here names a project: what differs is the
 * project's mapping and its `parity` block.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { layerIndex } from './layers.mjs';
import { SPEC_KEYS, unreadRules, propTypeIn } from './adapt.mjs';
import { checkContract, checkDeclarations, staleExcuses as staleKeys } from './spec-keys.mjs';
import { staleAcross as staleWaivers, checkWaiver, keyParts, glob } from './waivers.mjs';

import { realpathSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { nameOf } = require('../snapshot/graph.cjs');
const { slug, layerPaths } = require('../snapshot/spec.cjs');
const HERE = path.dirname(fileURLToPath(import.meta.url));

/* Figma's own default names for drawing primitives: a browser draws them,
   nobody maps them. */
const GENERIC = /^(icon|vector|union|subtract|ellipse|rectangle|line|path|group|frame \d+)$/i;
/* A slot is a node Figma made a slot (`type: 'SLOT'`), whatever it is called:
   a name test missed `Main menu slot`, `Buttons slot` and `Extra content slot`
   and walked their contents as the placing instance's chrome. */
const isSlot = (n, slots = EMPTY) => n.type === 'SLOT' || slots.has(n.name);
const EMPTY = new Set();
/* The slots a set declares (`props`: a name → 'SLOT'), for its variants the
   plugin derived from a boolean: those were walked from a detached instance,
   which has no slots, so they record the slot as a FRAME (design-system-
   snapshot 0.49.2 puts the type back; snapshots before it carry the frame). */
export const slotsOf = (spec) => new Set(Object.entries((spec && spec.props) || {}).filter(([, v]) => v === 'SLOT').map(([k]) => k));

export { glob };
/* Does a table of excuses (keys may glob) cover this key? Each key that
   covered something is added to `used`, for staleness. */
const excusedBy = (table = {}, used = new Set()) => {
  const globs = Object.keys(table).filter((k) => k.includes('*')).map((k) => [k, glob(k)]);
  return (key) => {
    if (table[key]) { used.add(key); return true; }
    const hit = globs.find(([, re]) => re.test(key));
    if (hit) used.add(hit[0]);
    return Boolean(hit);
  };
};

/* ── gate 6, at load ────────────────────────────────────────────────────── */

/*
 * Every waiver a project declares, before anything is measured: its shape
 * (`checkWaiver`: an owner, a bound on a number, no field nothing reads), and
 * that its layer is drawn somewhere — in a variant of the component, or in the
 * frame — or, for `-present`, mapped. A waiver whose layer resolves nowhere
 * matches no row and, if it is content or a decision, is never stale either:
 * 303 keys on one project sat that way after its paths were respelled exact.
 * Judged across every target declaring the same waiver, as staleness is. And
 * on a screen, `-present` on a layer the frame draws can never differ — the
 * frame draws every layer in its tree — so it only credited coverage: that is
 * `excluded`, which goes stale when the frame stops drawing the layer. A
 * screens file's `false` that drops nothing is named here too.
 */
export function waivers(project) {
  const out = [];
  const shape = new Map(), reach = new Map();
  for (const t of project.targets) {
    const trees = t.spec.variants.map((v) => layerIndex(v));
    const mapped = new Set([...Object.keys(t.mapping.layers || {}), ...[...t.variants.values()].flatMap((r) => Object.keys(r.layers || {}))]);
    const tables = [t.mapping.waivers, t.mapping.appWaivers, ...[...t.variants.values()].map((r) => r.own)];
    for (const table of tables) for (const [key, w] of Object.entries(table || {})) {
      const id = `${key}\0${JSON.stringify(w)}`;
      // only appWaivers expand a `*` (waivers.mjs appWaivers); anywhere else
      // the differ looks the key up as written and it excuses nothing, and a
      // decision that excuses nothing is never stale (round 3, S1's mapping)
      if (table !== t.mapping.appWaivers && key.includes('*')) out.push(`${t.name}: ${key} — a \`*\` is read in appWaivers only; here the key is looked up as written and excuses nothing — name each layer`);
      if (!shape.has(id)) shape.set(id, { key, lines: checkWaiver(key, w), names: [] });
      shape.get(id).names.push(t.name);
      const { layer, prop } = keyParts(key);
      if (layer.includes('*')) continue;
      const drawn = layer === '$root' || trees.some((ix) => ix.has(layer));
      if (!reach.has(id)) reach.set(id, { key, ok: false, names: [] });
      const r = reach.get(id);
      r.ok ||= drawn || (prop === '-present' && mapped.has(layer));
      r.names.push(t.name);
      if (t.kind === 'screen' && prop === '-present' && drawn) out.push(`${t.name}: ${key} — the frame draws ${layer}, so -present never differs here; a layer the page does not build is \`excluded\` with the reason`);
    }
  }
  const where = (names) => { const u = [...new Set(names)]; return `${u.slice(0, 3).join(', ')}${u.length > 3 ? ` and ${u.length - 3} more` : ''}`; };
  for (const { lines, names } of shape.values()) for (const l of lines) out.push(`${where(names)}: ${l}`);
  for (const { key, ok, names } of reach.values()) if (!ok) out.push(`${where(names)}: ${key} — no variant or frame that declares it draws ${keyParts(key).layer}, so it excuses nothing`);
  out.push(...(project.unusedFalse || []));
  return out;
}

/* ── gate 3 ─────────────────────────────────────────────────────────────── */

/** Variants no mapping renders and no reason excuses, and mappings pointing at nothing. */
export function variants(project) {
  return [...project.orphans, ...project.targets.flatMap((t) => t.unrendered)];
}

/* ── gate 2 ─────────────────────────────────────────────────────────────── */

/*
 * Built, or in the backlog with a reason; never quietly neither. A spec
 * folder or a frame nothing maps is a gap, and the backlog names it; an
 * entry for a gap that has closed is stale. A component folder holding code
 * and no spec is a gap the other way — code the library does not draw — and
 * is named under the backlog's `_code`, with why. A SCREEN is excused only by a capability the runner
 * lacks, from the closed list below (design-code-parity gate 24): "the code lives somewhere
 * else" is a file in the wrong folder, not a reason.
 */
export const RUNNER_CANNOT = new Set([
  'interaction', // a state that exists only after a gesture the page state cannot drive (a drag, a timed animation)
]);
export function backlog(project) {
  const out = [];
  const { backlog: entries = {}, specs, frames, targets, paths, snapshot } = project;
  const where = project.parity.backlog || 'the backlog';
  const mappedFolders = new Set(targets.filter((t) => t.kind === 'component').flatMap((t) => [t.folder, t.covers].filter(Boolean)));
  const mappedFrames = new Set(targets.filter((t) => t.kind === 'screen').map((t) => t.folder));
  const keys = Object.keys(entries).filter((k) => !k.startsWith('_'));
  const reason = (e) => (typeof e === 'string' ? e : e && e.reason) || '';
  for (const folder of specs.keys()) {
    if (!mappedFolders.has(folder) && !entries[folder]) out.push(`${folder}: a component spec nothing maps, and not in ${where}`);
  }
  const codeFolders = fs.existsSync(paths.components) ? fs.readdirSync(paths.components, { withFileTypes: true }).filter((d) => d.isDirectory() && !specs.has(d.name)).map((d) => d.name) : [];
  const code = entries._code || {};
  for (const folder of codeFolders) if (!code[folder]) out.push(`${folder}: a component folder with no spec — code the library does not draw — and not under \`_code\` in ${where} with the reason`);
  for (const [folder, why] of Object.entries(code)) {
    if (!codeFolders.includes(folder)) out.push(`${folder}: under \`_code\` in ${where}, and it is no longer a folder without a spec`);
    if (!reason(why).trim()) out.push(`${folder}: under \`_code\` in ${where} with no reason`);
  }
  for (const id of frames.keys()) if (!mappedFrames.has(id) && !entries[id]) out.push(`${id}: a frame marked ready for dev that nothing maps, and not in ${where}`);
  for (const k of keys) {
    const e = entries[k];
    if (!reason(e).trim()) out.push(`${k}: in ${where} with no reason`);
    if (mappedFolders.has(k) || mappedFrames.has(k)) out.push(`${k}: in ${where} and measured — delete the entry`);
    else if (!specs.has(k) && !frames.has(k)) out.push(`${k}: in ${where}, and no spec, frame or folder has that name any more`);
    if (frames.has(k)) {
      if (typeof e !== 'object' || !RUNNER_CANNOT.has(e.needs)) out.push(`${k}: a screen is excused only by a capability the runner lacks (${[...RUNNER_CANNOT].join(', ')}), as { needs, reason } — "${typeof e === 'object' ? e.needs : 'a sentence'}" is not one; drive it (\`page\`: scroll, click, fill, focus) or map it`);
      // two assertions one project's own test carried and the move to the
      // toolkit dropped (item 41 of the 2026-10-02 review)
      if (reason(e).trim() && reason(e).trim().length < 40) out.push(`${k}: a screen's reason has to say enough to argue with (40 characters at least)`);
      if (/route|not a story|lives in|where it lives|src\/app/i.test(reason(e))) out.push(`${k}: excused for where its code lives — move it where the run reads it`);
    }
  }
  // Every icon the library publishes is in the repo, and nothing more.
  const meta = snapshot._meta || {};
  if (paths.icons && fs.existsSync(paths.icons) && Array.isArray(meta.icons)) {
    const files = new Set(fs.readdirSync(paths.icons).filter((f) => f.endsWith('.svg')).map((f) => f.replace(/-\d+\.svg$/, '')));
    const named = new Set(meta.icons.map(slug));
    for (const n of meta.icons) if (!files.has(slug(n))) out.push(`icon ${n}: in the library, missing from ${path.relative(project.repo, paths.icons)}`);
    for (const f of files) if (!named.has(f)) out.push(`icon ${f}: in ${path.relative(project.repo, paths.icons)}, not in the library`);
  }
  return out;
}

/* ── gate 4 ─────────────────────────────────────────────────────────────── */

/*
 * Every value a mapping's `controls` offer — a select's options, a boolean's
 * true — is rendered by some listed variant, the control's default by any,
 * or excused under `codeOnly` (`size` for the control, `size=xl` for one
 * value). A value the code offers and the design never drew is a question
 * for the designer. Read only where a mapping declares its controls.
 */
export function codeOnly(project) {
  const out = [];
  for (const t of project.targets) {
    const m = t.mapping;
    if (!m.controls || !Array.isArray(m.variants)) continue;
    const used = {};
    for (const v of m.variants) for (const [k, val] of Object.entries(v.props || {})) (used[k] ||= new Set()).add(String(val));
    const offered = [];
    const D = (project.parity.variants || {}).disabled;
    for (const [c, def] of Object.entries(m.controls)) {
      if (def.type === 'select') offered.push(...def.options.map((o) => [c, String(o)]));
      if (def.type === 'boolean' && !(D && c === D.arg)) offered.push([c, 'true']);
      if (def.default !== undefined) (used[c] ||= new Set()).add(String(def.default));
    }
    const excuses = m.codeOnly || {};
    for (const [c, o] of offered) {
      if ((used[c] && used[c].has(o)) || excuses[c] || excuses[`${c}=${o}`]) continue;
      out.push(`${t.name}: the code offers ${c}=${o} and no variant renders it — map it, or a codeOnly '${c}=${o}'`);
    }
    for (const k of Object.keys(excuses)) {
      const [c, o] = k.split('=');
      if (!(c in m.controls) || (o !== undefined && !offered.some(([a, b]) => a === c && b === o))) out.push(`${t.name}: codeOnly '${k}' excuses a value the controls no longer offer`);
    }
  }
  return out;
}

/* ── gate 5 ─────────────────────────────────────────────────────────────── */

/*
 * A raw value where the library has a token: a hex fill or stroke, a literal
 * text style or effect, an unbound padding, gap, radius, stroke width or
 * opacity. Each is a decision the design system did not make, and the
 * comparison reads it as one it did. Excused per mapped component under
 * `literals`, keyed `Layer.kind`; and a colour style's stops are tokens.
 */
const isRaw = (c) => typeof c === 'string' && /^(#|rgb)/.test(c);
export function rawValues(node) {
  const raws = [...(node.fills || []).filter(isRaw).map((c) => ['fill', c]), ...(node.strokes || []).filter(isRaw).map((c) => ['stroke', c])];
  if (node.textStyle === 'literal') raws.push(['text style', 'literal']);
  if (node.effect === 'literal') raws.push(['effect', 'literal']);
  const b = node.bindings || {};
  if (node.pad && node.pad.some(Boolean) && !(b.pad && b.pad.every((x, i) => x || !node.pad[i]))) raws.push(['padding', node.pad.join(' ')]);
  if (node.gap && !b.gap && !/^SPACE_BETWEEN/.test(node.align || '')) raws.push(['gap', node.gap]);
  if (node.radius && !b.radius) raws.push(['radius', node.radius]);
  if (node.strokeSides && node.strokeSides.some(Boolean) && !(b.strokeWeight && b.strokeWeight.every((x, i) => x || !node.strokeSides[i]))) raws.push(['stroke width', node.strokeSides.join(' ')]);
  if (node.opacity !== undefined && !b.opacity) raws.push(['opacity', node.opacity]);
  return raws;
}
export function literals(project) {
  const out = [];
  const byFolder = new Map();
  for (const t of project.targets.filter((x) => x.kind === 'component')) {
    const e = byFolder.get(t.folder) || {};
    byFolder.set(t.folder, Object.assign(e, t.mapping.literals || {}));
  }
  for (const [folder, excused] of byFolder) {
    const s = project.specs.get(folder);
    const seen = new Set(), used = new Set();
    const walk = (n, variant) => {
      for (const [kind, value] of rawValues(n)) {
        const key = `${n.name}.${kind}`;
        if (excused[key]) { used.add(key); continue; }
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(`${folder}: "${n.name}" carries a raw ${kind} ${value} in ${variant} — a token, or a literals '${key}' with the reason`);
      }
      (n.children || []).forEach((c) => walk(c, variant));
    };
    for (const v of s.variants) walk(v, v.name);
    for (const k of Object.keys(excused)) if (!used.has(k)) out.push(`${folder}: literals '${k}' excuses a raw value the spec no longer carries`);
  }
  for (const ps of project.snapshot.paintStyles || []) {
    for (const p of ps.paints || []) {
      const raw = p.type === 'SOLID' ? (isRaw(p.color) ? [p.color] : []) : (p.stops || []).map((st) => st.color).filter(isRaw);
      for (const c of raw) out.push(`colour style "${ps.name}" carries a raw ${c} — bind the stop to a variable`);
    }
  }
  return out;
}

/* ── gates 18 and 27 ────────────────────────────────────────────────────── */

/* The fields a frame overriding one changes what is on screen. */
const VISUAL = ['fills', 'strokes', 'strokeSides', 'strokeAlign', 'effect', 'effects', 'radius', 'opacity', 'textStyle', 'lineHeight', 'textAlign'];

/* The library layer an instance is of: `"<component> / <variant>"`, or the
   component alone when its set has no axes; null when the repo has no spec. */
function baseFor(instanceOf, library) {
  if (!instanceOf) return null;
  const set = nameOf(instanceOf, (n) => library.has(n));
  const s = library.get(set);
  if (!s || !s.variants || !s.variants.length) return null;
  const variant = instanceOf.slice(set.length + 3);
  return variant ? s.variants.find((x) => x.name === variant) || null : s.variants[0];
}

/*
 * What a frame changes INSIDE a component it places, on a layer the mapping
 * does not name: the instance's own visual fields against the component this
 * repo builds (resolved — the compact form on disk records a variant as its
 * deltas, and read flat every unstated field looks overridden), and the
 * switch and variant props of instances nested in it (a text prop and a glyph
 * swap are content). `layers` is the mapping's measured paths, `waived` its
 * `overrides` (keys may glob with `*`). One finding per value:
 * `{ layer, field, was, now }`. An instance of something the repo has no spec
 * for (an icon shipped as an SVG) is skipped, not guessed.
 */
export function unnamedOverrides(tree, { layers, waived = {}, library, used }) {
  if (!library || library.size === 0) throw new Error('the library is empty, so the overrides gate would check nothing');
  const found = [];
  const excused = excusedBy(waived, used);
  const seen = new Map();
  const types = new Map([...library].map(([name, spec]) => [name, spec.props || {}]));
  const walk = (node, parent) => {
    const key = parent ? `${parent} > ${node.name}` : node.name;
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    const at = n > 1 ? `${key}#${n}` : key;
    const base = baseFor(node.instanceOf, library);
    if (base && !layers.has(at)) {
      for (const field of VISUAL) {
        if (JSON.stringify(node[field] ?? null) !== JSON.stringify(base[field] ?? null) && !excused(`${at}.${field}`)) {
          found.push({ layer: at, field, was: base[field] ?? null, now: node[field] ?? null });
        }
      }
    }
    if (base) {
      const inner = (mine, theirs, where) => {
        const counts = new Map();
        for (const child of mine.children || []) {
          const k = (counts.get(child.name) || 0) + 1;
          counts.set(child.name, k);
          const childAt = k > 1 ? `${where} > ${child.name}#${k}` : `${where} > ${child.name}`;
          const twin = (theirs.children || []).filter((c) => c.name === child.name)[k - 1];
          if (!twin) continue;
          if (child.instanceOf && child.props && twin.props && !layers.has(childAt)) {
            for (const [p, v] of Object.entries(child.props)) {
              /* Words and glyphs are content: a prop is known as one by its type
                 in the library, the name only where the library lacks it — a
                 library renamed `Label text` to `Label` (13 Oct) and every
                 sidebar's company name read as a changed prop. */
              const type = propTypeIn(types, child, p);
              if (type === 'TEXT' || type === 'INSTANCE_SWAP') continue;
              if (!(p in twin.props) || JSON.stringify(twin.props[p]) === JSON.stringify(v)) continue;
              if (excused(`${childAt}.props.${p}`)) continue;
              found.push({ layer: childAt, field: `props.${p}`, was: twin.props[p], now: v });
            }
          }
          inner(child, twin, childAt);
        }
      };
      inner(node, base, at);
    }
    for (const child of node.children || []) walk(child, at);
  };
  for (const child of tree.children || []) walk(child, '');
  return found;
}
/*
 * Per target: the frame (or the first variant) against the library. An
 * `overrides` reason that excuses nothing in any target declaring it is
 * stale, as a waiver is (staleAcross): a frame that stopped overriding the
 * value left its excuse behind, which then excused the next override of that
 * key unread (review 2026-10-02 round 2, R10).
 */
export function overrides(project) {
  const out = [];
  const results = [];
  for (const t of project.targets) {
    const m = t.mapping;
    const tree = t.spec.variants[0];
    const layers = new Set(Object.keys(m.layers).filter((l) => m.layers[l]));
    const used = new Set();
    for (const u of unnamedOverrides(tree, { layers, waived: m.overrides || {}, library: project.library, used })) {
      out.push(`${t.name}: ${u.layer}.${u.field} — the frame changes this inside the component it places; map the layer, or say why under \`overrides\` (${JSON.stringify(u.was)} → ${JSON.stringify(u.now)})`);
    }
    results.push({ name: t.name, declared: m.overrides || {}, used });
  }
  // an override excuse is never content or a ruling: staleness takes it as it is
  const plain = (d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, typeof v === 'string' ? { reason: v } : { ...v, content: undefined, decision: undefined }]));
  for (const { key, names } of staleWaivers(results.map((r) => ({ ...r, declared: plain(r.declared) })))) {
    out.push(`${names.slice(0, 3).join(', ')}${names.length > 3 ? ` and ${names.length - 3} more` : ''}: overrides "${key}" excuses nothing the frame changes any more — delete it`);
  }
  return out;
}

/* ── gates 8 and 13 ─────────────────────────────────────────────────────── */

const shape = (n) => (n.children || []).map((c) => c.type).join('|');
const paints = (n) => n.type !== 'TEXT' && ((n.fills && n.fills.length) || (n.strokes && n.strokes.length) || n.effect
  || (Array.isArray(n.pad) && n.pad.some((v) => v > 0)));

/*
 * Every layer a frame composes is mapped, credited, or `excluded` with the
 * reason (gate 8). A library instance is one layer — its component's own run
 * measures its insides in every variant — except what the page puts in its
 * slots (a node of type SLOT), which is the screen's own; what a
 * component draws for itself is credited to the instance holding it. A layer
 * is credited, not mapped, when a mapped sibling of the same name, parent and
 * shape stands for it (seven cards behind one selector), or a cousin under a
 * covered parent of the same name does. A null mapping (no element of its
 * own) covers only a layer that paints nothing — a wrapper with a fill or a
 * padding mapped to null hides its paint — unless it is `excluded`, which
 * records that the page does not build it and takes its subtree. An
 * `excluded` layer the frame no longer draws is stale. (A `-present` waiver
 * took a subtree here until 2026-10-02, and went stale never: the `waivers`
 * gate now routes it to `excluded`.)
 */
export function screenCoverage(tree, mapping) {
  const index = layerIndex(tree);
  const pathOf = new Map([...index].map(([p, e]) => [e.node, p]));
  const parents = new Map();
  (function link(n) { (n.children || []).forEach((c) => { parents.set(c, n); link(c); }); })(tree);
  const own = [], chrome = new Map();
  (function walk(n, owner) {
    if (owner) chrome.set(n, owner);
    else if (n !== tree && !GENERIC.test(n.name)) own.push(n);
    const next = isSlot(n) ? null : (n !== tree && n.type === 'INSTANCE' ? n : owner);
    (n.children || []).forEach((c) => walk(c, next));
  })(tree, null);
  const layers = mapping.layers || {};
  const excluded = mapping.excluded || {};
  const at = (k) => (index.get(k) || {}).node;
  const nullPainters = new Set(Object.entries(layers).filter(([k, v]) => v === null && excluded[k] === undefined && at(k) && paints(at(k))).map(([k]) => at(k)));
  const resolved = new Set(Object.keys(layers).map(at).filter((n) => n && !nullPainters.has(n)));
  const decided = new Set();
  const take = (n) => { decided.add(n); (n.children || []).forEach(take); };
  // an excluded layer takes its subtree, and its twins of one name and shape
  // beside it: what is not built has nothing built inside it
  for (const k of Object.keys(excluded)) {
    const r = at(k);
    if (!r) continue;
    take(r);
    for (const s of (parents.get(r)?.children || [])) if (s !== r && s.name === r.name && shape(s) === shape(r)) take(s);
  }
  const memo = new Map();
  const covered = (n) => {
    if (memo.has(n)) return memo.get(n);
    memo.set(n, false);
    const ok = resolved.has(n) || decided.has(n)
      || (chrome.has(n) && covered(chrome.get(n)))
      || [...resolved].some((r) => r.name === n.name && parents.get(r) === parents.get(n) && shape(r) === shape(n))
      || [...resolved].some((r) => r.name === n.name && parents.get(r) && parents.get(n)
        && parents.get(r).name === parents.get(n).name && shape(r) === shape(n) && covered(parents.get(n)));
    memo.set(n, ok);
    return ok;
  };
  const missed = own.filter((n) => !covered(n)).map((n) => (nullPainters.has(n) ? `${pathOf.get(n)} (mapped to null, but it paints)` : pathOf.get(n)));
  const stale = Object.keys(excluded).filter((k) => !at(k));
  return { total: own.length, missed, stale, credited: own.filter((n) => !resolved.has(n) && covered(n)).length };
}

/*
 * Every layer of every variant a mapping renders is mapped (a null mapping
 * addresses it: it exists and no element answers for it), stands behind a
 * mapped representative of the same name, parent and shape, or is a library
 * instance under a mapped layer — measured by its own component's run and
 * recorded by that layer's children (gate 13). An instance is one layer;
 * Figma's primitives are not counted.
 */
export function componentCoverage(variant, layers, library, slots = EMPTY) {
  const index = layerIndex(variant);
  const resolved = new Set([variant, ...Object.keys(layers).map((k) => (index.get(k) || {}).node).filter(Boolean)]);
  const parents = new Map();
  (function link(n) { (n.children || []).forEach((c) => { parents.set(c, n); link(c); }); })(variant);
  const own = [];
  (function walk(n) {
    if (n !== variant && !GENERIC.test(n.name)) own.push(n);
    // an instance is one layer, and what a slot holds is the caller's
    if ((n.type === 'INSTANCE' && n !== variant) || isSlot(n, slots)) return;
    (n.children || []).forEach(walk);
  })(variant);
  const instanceCredited = (n) => {
    if (n.type !== 'INSTANCE' || !n.instanceOf || !library.has(nameOf(n.instanceOf, (x) => library.has(x)))) return false;
    for (let a = parents.get(n); a; a = parents.get(a)) if (resolved.has(a)) return true;
    return false;
  };
  const covered = (n) => resolved.has(n) || instanceCredited(n)
    || [...resolved].some((r) => r.name === n.name && parents.get(r) === parents.get(n) && shape(r) === shape(n))
    || [...resolved].some((r) => r.name === n.name && parents.get(r) && parents.get(n) && parents.get(r).name === parents.get(n).name && shape(r) === shape(n));
  const pathOf = new Map([...index].map(([p, e]) => [e.node, p]));
  return { total: own.length, missed: own.filter((n) => !covered(n)).map((n) => pathOf.get(n)) };
}

/* The layers a variant renders with, and in a focus variant the ring Figma
   draws as a layer of its own (named as the project's `parity.variants.focusRing`
   says), mapped to the element that carries it: `focusRing`, else the
   mapping's `state` element (which a pointer hovers and a ring is drawn on),
   else the one that takes focus. A ring inside a nested instance is that
   instance's. */
export function variantLayers(project, target, name, rendered) {
  const layers = { ...rendered.layers };
  const ring = (project.parity.variants || {}).focusRing;
  if (ring && /focus/i.test(rendered.pseudo || '')) {
    const tree = target.spec.variants.find((v) => v.name === name);
    const re = new RegExp(ring, 'i');
    const find = (n) => { for (const c of n.children || []) { if (re.test(c.name)) return c; if (c.type === 'INSTANCE') continue; const d = find(c); if (d) return d; } return null; };
    const node = tree && find(tree);
    if (node) {
      const p = [...layerIndex(tree)].find(([, e]) => e.node === node)[0];
      if (!(p in layers)) layers[p] = target.mapping.focusRing || target.mapping.state || rendered.on;
    }
  }
  return layers;
}

export function layerCoverage(project) {
  const out = [];
  // by component name, as baseFor reads it: a library routed with a platform stores `mobile-button`
  const library = project.library;
  for (const t of project.targets) {
    if (t.kind === 'screen') {
      const r = screenCoverage(t.spec.variants[0], t.mapping);
      for (const m of r.missed) out.push(`${t.name}: draws ${m}, which nothing maps — map it, or put it in \`excluded\` with the reason`);
      for (const s of r.stale) out.push(`${t.name}: excludes ${s}, which the frame no longer draws`);
      continue;
    }
    const missed = new Map();
    for (const [name, r] of t.variants) {
      if ((t.mapping.unmeasured || {})[name]) continue;
      const v = t.spec.variants.find((x) => x.name === name);
      for (const m of componentCoverage(v, variantLayers(project, t, name, r), library, slotsOf(t.spec)).missed) if (!missed.has(m)) missed.set(m, name);
    }
    for (const [m, v] of missed) out.push(`${t.name}: draws ${m} (${v}), which nothing maps`);
  }
  return out;
}

/* ── gate 10 ────────────────────────────────────────────────────────────── */

/*
 * Staleness across projects needs every registered project's snapshot. A
 * repo this machine does not have — CI, a laptop without the other project, a
 * third project's run — is a note, not a finding: one project's gate went
 * red for want of another project's checkout (item 6 of the 2026-10-02
 * review). And with one unread, a stale excuse may be one only it still
 * needs, so staleness is a note too until every repo is read.
 */
export function specKeys(project, projectsDir) {
  const trees = [...[...project.specs.values()].flatMap((s) => s.variants), ...[...project.frames.values()].map((f) => f.tree)];
  const findings = [], notes = [];
  const r = checkContract(trees, SPEC_KEYS);
  if (r.undeclared.length) findings.push(`recorded and not declared: ${r.undeclared.join(', ')} — add the rule that reads each, or the reason none can (adapt.mjs SPEC_KEYS)`);
  const across = projectsDir ? staleKeys(SPEC_KEYS, projectsDir) : staleKeys(SPEC_KEYS);
  for (const u of across.unreadable) notes.push(`a registered project's snapshot is not on this machine, so stale excuses are not judged: ${u}`);
  if (across.stale.length) (across.unreadable.length ? notes : findings).push(`excused, and recorded by no project${across.unreadable.length ? ' read here' : ''} any more: ${across.stale.join(', ')}`);
  const exists = (f) => [HERE, project.repo].some((d) => fs.existsSync(path.join(d, f)));
  findings.push(...checkDeclarations(SPEC_KEYS, exists));
  findings.push(...unreadRules(trees, project.snapshot).map((u) => `declared and never read: ${u}`));
  return { findings, notes };
}

/*
 * What a project leaves off, said rather than silent (item 18 of the
 * 2026-10-02 review): one project set no `position`, `props` or `children`
 * and so had no -x/-y, instance-prop, swap or -children assertion at all, its
 * codeOnly gate had no mapping declaring `controls` to read, and the other's
 * copy gate reached only the screens a page host renders or that list
 * `copy` — while the changelog said every gate ran on both. Notes, never
 * findings: each is the project's choice, and a choice is fine once it is
 * visible.
 */
export function configured(project) {
  const P = project.parity;
  const notes = [];
  const say = (key, what) => notes.push(`${key}: not configured — ${what}`);
  if (!P.position) say('position', 'no -x/-y assertions (parity.position)');
  if (!P.props) say('props', 'no instance-prop (-attr) or swap (-swap) assertions (parity.props)');
  if (!P.children && !project.targets.some((t) => t.mapping.children)) say('children', 'no -children assertions (parity.children)');
  if (!project.targets.some((t) => t.mapping.controls && Array.isArray(t.mapping.variants))) say('codeOnly', 'gate 4 reads no mapping: none declares `controls` with a variants list');
  const screens = project.targets.filter((t) => t.kind === 'screen');
  const copied = screens.filter((t) => t.mapping.storyId || (t.mapping.copy || []).length);
  if (screens.length && copied.length < screens.length) say('copy', `the copy gate reaches ${copied.length} of ${screens.length} screens: those a story renders, or that list \`copy\``);
  if (!P.baseline) say('baseline', 'gate 12 does not run (parity.baseline)');
  return { findings: [], notes };
}

/* ── run-time gates ─────────────────────────────────────────────────────── */

/** Mapped layers (`target:layer`) no rendered variant draws. */
export function staleMappings(mapped, drawn) {
  return [...mapped].filter((l) => !drawn.has(l));
}

/*
 * The words a frame draws, for the copy gate: every text layer's, outside
 * what the mapping `excluded` (a layer excused from coverage is excused from
 * its words — a gate asking the page to say "Sort" asks for what a decision
 * refused).
 */
function frameText(tree, excluded = {}) {
  const out = [];
  layerPaths(tree, (node, p) => {
    if (excluded[p]) return false;
    if (node.text) out.push(String(node.text));
  });
  return [...new Set(out)];
}
const words = (t) => t.replace(/\s+/g, ' ').trim();

/*
 * The copy gate: is every word the frame draws on the page at all. Not their
 * order — across a page Figma's layer order is not reading order, and a check
 * that cried 477 times to catch one was read by nobody. A word the page says
 * otherwise, on purpose, is named in `content` with the reason (a key may glob
 * with `*`: a feed's dates are one decision); an entry nothing it names is
 * still missing for is stale.
 */
export function copyMissing(tree, said, { content = {}, excluded = {} } = {}) {
  const has = new Set(said);
  const keys = Object.keys(content).map((k) => [k, k.includes('*') ? glob(k) : null]);
  const excuse = (t) => keys.find(([k, re]) => (re ? re.test(t) : k === t));
  const missing = [], used = new Set();
  /* A text layer is said when the page says it whole, or says each of its
     lines: a line break in the frame is often a list item or a paragraph of
     its own on the page, and as often only where the words wrapped. */
  for (const raw of frameText(tree, excluded)) {
    const whole = words(raw);
    if (whole.length <= 2 || has.has(whole)) continue;
    const lines = raw.split(/\n+/).map(words).filter((l) => l.length > 2);
    const unsaid = lines.length > 1 && lines.some((l) => has.has(l)) ? lines.filter((l) => !has.has(l)) : [whole];
    for (const t of unsaid) {
      const e = excuse(t) || (t !== whole && excuse(whole));
      if (e) used.add(e[0]); else if (!missing.includes(t)) missing.push(t);
    }
  }
  return { missing, used };
}
/* Stale across every frame that declares the same excuse: a screen file
   shares one `content` object among its frames, and a word one frame says
   is no excuse another frame no longer needs. */
export function staleContent(declarers) {
  return staleWaivers(declarers.map((d) => ({ ...d, declared: Object.fromEntries(Object.entries(d.declared).map(([k, v]) => [k, typeof v === 'string' ? { reason: v } : v])) })));
}

/* The page's own words in document order, as a reader sees them: a field's
   value or placeholder and a select's chosen option count, hidden text does not. */
export const PAGE_TEXT = `(() => {
  const out = [];
  const walk = (el) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { const t = n.textContent.replace(/\\s+/g, ' ').trim(); if (t) out.push(t); }
      else if (n.nodeType === 1) {
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA') { const v = (n.value || n.placeholder || '').replace(/\\s+/g, ' ').trim(); if (v) out.push(v); }
        if (n.tagName === 'SELECT') { const t = ((n.selectedOptions[0] || {}).textContent || '').replace(/\\s+/g, ' ').trim(); if (t) out.push(t); }
        walk(n);
      }
    }
  };
  walk(document.body);
  return out;
})()`;

/*
 * DOM coverage, run in the page: every element a component renders is
 * measured by a mapped selector, or credited — it shares a measured
 * relative's exact box (a wrapper hugging the control that carries the box
 * model), or it is a nested library component inside a measured element,
 * recorded by that layer's children and measured by its own run. Not
 * counted: what draws no box (display none or contents, hidden, opacity 0 —
 * a native control laid transparent over the box that draws it), what exists
 * for the accessibility tree alone (clipped to a pixel), an SVG, and what the
 * project's `parity.dom.opaque` names (a glyph, an illustration), the insides
 * of a nested component with a run of its own, and prose a slot holds.
 * `sections`: `[{ scope, section?, selectors, slots, own }]`: the scope is the
 * component's root (or, with `section`, a box holding it), and `own` the
 * instance selectors of components measured in their own right.
 */
export const DOM_COVERAGE = (sections, opaque) => {
  const out = [];
  const one = (sel, root) => { try { return [...root.querySelectorAll(sel)]; } catch { return []; } };
  const hidden = (e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.display === 'contents' || cs.opacity === '0' || (e.checkVisibility && !e.checkVisibility())) return true;
    const r = e.getBoundingClientRect();
    return cs.position === 'absolute' && r.width <= 1 && r.height <= 1 && cs.overflow === 'hidden';
  };
  for (const s of sections) {
    const scope = document.querySelector(s.scope);
    if (!scope) { out.push({ key: s.key, total: 0, missed: ['(the scope rendered nothing)'] }); continue; }
    const root = scope;
    const isOwn = (e) => s.own.some((sel) => { try { return e.matches(sel); } catch { return false; } });
    // the scope is the component's own root, or a section holding it
    const top = s.section ? root.firstElementChild : root;
    const slotted = s.slots.flatMap((sel) => one(sel, root));
    const all = [...root.querySelectorAll('*')].filter((e) => {
      if (/^(script|style|template|br|link|meta)$/i.test(e.tagName)) return false;
      if (hidden(e)) return false;
      if (e.closest('svg') || (opaque && e.closest(opaque) && root.contains(e.closest(opaque)))) return false;
      for (let n = e.parentElement; n && n !== root; n = n.parentElement) if (n !== top && isOwn(n)) return false;
      if (!isOwn(e) && slotted.some((m) => m !== e && m.contains(e))) return false;
      return true;
    });
    // the root is the mapping's own root, measured; inside a section, what the selectors reach
    const covered = new Set(s.section ? [] : [root]);
    for (const sel of s.selectors) one(sel.replace(/::(before|after|placeholder)$/, ''), root).forEach((e) => covered.add(e));
    const same = (a, b) => { const r = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(r.left - q.left) < 0.5 && Math.abs(r.top - q.top) < 0.5 && Math.abs(r.width - q.width) < 0.5 && Math.abs(r.height - q.height) < 0.5; };
    let grew = true;
    while (grew) {
      grew = false;
      for (const e of all) {
        if (covered.has(e)) continue;
        if (isOwn(e)) for (let n = e.parentElement; n && root.contains(n); n = n.parentElement) if (covered.has(n)) { covered.add(e); grew = true; break; }
        if (!covered.has(e)) for (const c of covered) if ((c.contains(e) || e.contains(c)) && same(e, c)) { covered.add(e); grew = true; break; }
      }
    }
    const name = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '') + [...e.attributes].filter((a) => a.name.startsWith('data-') && a.name !== 'data-parity').map((a) => `[${a.name}]`).join('');
    out.push({ key: s.key, total: all.length, missed: all.filter((e) => !covered.has(e)).map(name) });
  }
  return out;
};

/* ── the static gates, together ─────────────────────────────────────────── */

export const STATIC = { waivers, variants, backlog, codeOnly, literals, overrides, layerCoverage, specKeys, configured };

/* Each gate's findings (which fail) and notes (which are said and do not). */
export function staticGates(project) {
  return Object.entries(STATIC).map(([name, gate]) => {
    try { const r = gate(project); return Array.isArray(r) ? { name, findings: r, notes: [] } : { name, ...r }; } catch (e) { return { name, findings: [`the gate could not run: ${e.message}`], notes: [] }; }
  });
}

/* Printed: each gate's verdict, its findings (the first 40) and its notes. */
export function printGates(results, log = console.log) {
  let failed = 0;
  for (const { name, findings, notes = [] } of results) {
    failed += findings.length;
    if (findings.length || !notes.length || name !== 'configured') log(`${findings.length ? 'RED  ' : 'ok   '} ${name}${findings.length ? ` — ${findings.length}` : ''}`);
    for (const f of findings.slice(0, 40)) log(`        ${f}`);
    if (findings.length > 40) log(`        … and ${findings.length - 40} more`);
    for (const n of notes) log(`note  ${n}`);
  }
  return failed;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const i = process.argv.indexOf('--repo');
  if (i < 0) { console.error('usage: node tools/parity/gates.mjs --repo <dir>'); process.exit(2); }
  const { loadProject } = await import('./project.mjs');
  const project = await loadProject(process.argv[i + 1]).catch((e) => { if (!e.usage) throw e; console.error(e.message); process.exit(2); });
  process.exit(printGates(staticGates(project)) ? 1 : 0);
}
