#!/usr/bin/env node
/*
 * The pipeline held to its goal, end to end: a component that goes from Figma to code, or to Figma and back, comes back
 * the same contract. Each official contract (official.mjs) is compared by value (to-figma's roundTrip: every combination
 * the library draws, expanded from both sides) with
 *
 *   browser  the contract from-code read off the code as it renders (parity/from-code/<component>.json, kept by
 *            from-code: a run that reads the same writes nothing)
 *   self     the contract from-code read off the toolkit's own rendering of the contract (from-code --self: to-markup's
 *            web component and to-code's sheet, no project code; <home>/round-trip/self/from-code/<component>.json,
 *            written by --self). What differs here is the toolkit's loss; what differs only in browser is the project's
 *   figma    the contract read back from to-figma's drawing of it by the snapshot's walk and derive, and that walk's
 *            reading held to the stored figma.json layer by layer (its `geometry` rows, geometry.mjs)
 *            (<home>/round-trip/<component>.roundtrip.json, written by --draw)
 *
 * and the differing rows are counted per component and per field. The counts accepted are stored
 * (<home>/round-trip/accepted.json); --check fails where a count rose, or a reading went, against them, and --accept
 * stores the present ones. A count only falls by a fix: the difference is a battery case first (test-battery.mjs),
 * then a row of the translation table (rules.mjs), then the count drops and is accepted.
 *
 *   node tools/component-contract/eval.mjs --project <label> [--fields] [--check | --accept]
 *   node tools/component-contract/eval.mjs --project <label> --draw <scratch fileKey> [--keep-unchanged] [components…]
 *   node tools/component-contract/eval.mjs --project <label> --self [--twice] [components…]
 *   node tools/component-contract/eval.mjs --project <label> --causes
 *   node tools/component-contract/eval.mjs --project <label> --diff [--accept]
 *   node tools/component-contract/eval.mjs --project <label> --make-panel 30, then --panel with any of the above
 *   node tools/component-contract/eval.mjs --project <label> --mutate [--sample N] [--seed S] [--check]   the comparer proven: each leg's share of known changes caught, beside the headline (mutate.mjs)
 *   node tools/component-contract/eval.mjs --project <label> --second [components…]
 *   node tools/component-contract/eval.mjs --projects <label,label…> [--legs self,second] [--jobs N] [--log <file>]
 *   node tools/component-contract/eval.mjs --projects <label,label…> --mechanisms [--legs self] [--top 25] [--near 15]   the panels' rows by mechanism, across libraries, and the components nearest the same: what to fix first
 *
 * Each leg says how many components came back the same of all, how many were measured, and its rows folded to causes (a
 * part missing or extra is one cause at its root, `causes`); a reading taken of another contract than today's, or kept
 * from an earlier drawing, is stale and said (taken.json); so is a self or second reading taken from other inputs than
 * today's (selfInputs: the reader's code, the generator, tokens, settings, the browser, fonts and system), and any
 * reading taken under another Chrome major than the one installed (Chrome 158 read flex-start as flow-start; from-code
 * records it as `chrome`). A reading taken before its inputs or its Chrome were recorded shows as stale until it is read
 * again: the label only, never a count. A Figma reading drawn from another stored figma.json, walk VERSION or drawing code than
 * today's is stale too (figmaInputs). A component is the same on a leg (isSame) only with no row, none left to code, no
 * combination predicted instead of read (from-code's `unread`, said `N combinations predicted, not read`) and none cut. --twice reads the self leg twice and fails where a reading
 * differs: a measure is trusted only where it repeats. --second goes round the self leg again from what the first came
 * back as (from-code --second, <home>/round-trip/self2/from-code/), and the `second` leg holds that to the first: a row
 * there is the translation not settling, a cause the first leg's count cannot show. --projects runs, per project in turn,
 * each leg on its panel (--jobs 4 unless said) and then --diff, each its own eval.mjs, each measuring leg taking and
 * letting go the lock, logged `== HH:MM <args>` and `== rc N` (to --log, appended, read from the folder run in, else the terminal),
 * stopping after three failures in a row (rc 2 or more) and ending `== done HH:MM`; run under a lock holder, the steps
 * stay under its lock. It exits 2 on a usage error, an unknown label or a --log it cannot write (before any step), 1 where a step
 * ended with rc 2 or more, else 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execFile, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { contracts, hashOf } from './official.mjs';
import { roundTrip, drawSettings, restKey } from './to-figma.mjs';
import { parseColour } from '../parity/values.mjs';
import { libraryOf } from '../parity/project.mjs';
import { partsOf, unexposed, pointerWords, isDrawing, swapKeysOf } from './to-markup.mjs';
import { expand, variantDefaults } from './layers.mjs';
import { sharesNeverWritten, tokenNames } from './to-code.mjs';
import { chromeVersion, chromeMajor } from '../shared/cdp.mjs';
import { importClosure } from '../shared/import-closure.mjs';
import { closureOf } from './site.mjs';
import { fontsInstalled } from './read-cache.mjs';
export { importClosure, closureOf };

const req = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));

/* A row's field, with the element said as * (a field that differs in many elements is one cause). */
export const fieldOf = (at) => (at.includes('.') ? `*.${at.split('.').slice(1).join('.')}` : at).replace(/\.\d+(?=\.|$)/g, '.N');

export { hashOf };
/* When each reading was taken, of which contract: <home>/round-trip/taken.json, { self|second|figma: { <component>: { hash,
   kept?, inputs?, reader?, chrome? } } }: a self or second reading also the hash of its inputs (selfInputs), of the reader's
   code (readerCode) and the Chrome major it was read under. */
const takenFile = (home) => path.join(home, 'round-trip', 'taken.json');
const readTaken = (home) => { try { return JSON.parse(fs.readFileSync(takenFile(home), 'utf8')); } catch { return {}; } };
function noteTaken(home, leg, folder, contract, kept = false, seen = {}) {
  const t = readTaken(home);
  const known = Object.fromEntries(Object.entries(seen).filter(([, v]) => v != null));
  t[leg] = { ...(t[leg] || {}), [folder]: kept && t[leg] && t[leg][folder] ? { ...t[leg][folder], kept: true } : { hash: hashOf(contract), ...(kept && { kept: true }), ...known } };
  // written whole and renamed into place, so a reader never meets half a file (two runs at once can still lose one entry,
  // which then reads stale: the safe side)
  fs.mkdirSync(path.dirname(takenFile(home)), { recursive: true });
  const tmp = `${takenFile(home)}.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(t, null, 2) + '\n');
  fs.renameSync(tmp, takenFile(home));
}

/* The rows folded to their causes: a part missing or extra on one side in every combination compared is one cause at the
   shallowest such part, every row inside it (its children, its fields) folded into it; any other row is its own, a part
   missing in only some combinations included (its field rows come from the others, and are causes of their own). Rows
   are merged across combinations, `in` saying how many. { cause: rows }. */
export function causes(rows, combinations) {
  const gone = rows.filter((r) => !r.at.includes('.') && r.at !== 'props' && (r.library == null || r.drawn == null));
  const inAll = (at) => combinations == null || gone.filter((r) => r.at === at).reduce((a, r) => a + (r.in || 1), 0) >= combinations;
  const whole = new Set(gone.map((r) => r.at).filter(inAll));
  const out = {};
  for (const r of rows) {
    const el = r.at.split('.')[0], segs = el.split('/');
    let root = null;
    for (let i = 1; i <= segs.length && !root; i++) if (whole.has(segs.slice(0, i).join('/'))) root = segs.slice(0, i).join('/');
    const key = root ? `${root} (${gone.find((x) => x.at === root).library == null ? 'extra' : 'missing'})` : r.at;
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

/* Rows grouped by mechanism, the ranking a fix is chosen from: the field a row differs in (its last part's field, or
   `element` for a whole part) and the shape of each side (none, a word, a token path, a number, an element's kind), so one
   cause across libraries is one group. { 'field | design → code': { components, finishes, rows, examples } }, ranked by
   the components it finishes (those whose every row is in it: fixing it makes them the same), then components, then
   rows, as the goal counts components the same, not rows. `by` is { component: rows }. */
const shapeOf = (v) => (v == null ? 'none' : Array.isArray(v) ? 'array' : typeof v === 'object' ? (v.kind ? `el:${v.kind}` : 'obj') : typeof v === 'number' ? 'num' : typeof v === 'string' ? (v.includes('/') ? 'token' : 'word') : typeof v);
export function mechanisms(by) {
  const out = new Map();
  for (const [c, rows] of Object.entries(by)) for (const r of rows) {
    const last = r.at.split('/').pop();
    const field = last.includes('.') ? last.slice(last.indexOf('.') + 1).replace(/\.\d+(?=\.|$)/g, '.N') : ['props', 'name'].includes(r.at) ? r.at : 'element';
    const key = `${field} | ${shapeOf(r.library)} → ${shapeOf(r.drawn)}`;
    const g = out.get(key) || { components: new Set(), rows: 0, examples: [] };
    g.components.add(c); g.rows++;
    if (g.examples.length < 2) g.examples.push(`${c}: ${r.at} ${JSON.stringify(r.library)?.slice(0, 60)} | ${JSON.stringify(r.drawn)?.slice(0, 60)}`);
    g.per = g.per || {}; g.per[c] = (g.per[c] || 0) + 1;
    out.set(key, g);
  }
  const finishes = (g) => Object.entries(g.per).filter(([c, k]) => k === by[c].length).length;
  return [...out].map(([key, g]) => ({ key, components: g.components.size, finishes: finishes(g), rows: g.rows, examples: g.examples })).sort((a, b) => b.finishes - a.finishes || b.components - a.components || b.rows - a.rows);
}

/* What the toolkit's own markup leaves to the code that uses it, by design: a part drawn only at a pointer state inside a
   placed component or a slot (that component's or a caller's: frontend-build's, said as a gap in the markup; one of this
   component's own the markup holds and the sheet shows at that state alone, and a focus ring is an outline).
   (What a slot holds in the design is no gap: the markup draws it as the slot's fallback.) The self legs count the
   rows of these apart (`left`), never among the differences, and never dropped. `settings`: the library's, as the sheet
   is written under (which pointer state is focus, so which part is a ring). */
export const GAPS = {
  'pointer-only-part': 'a part drawn only at a pointer state inside a placed component or a slot: no markup here holds it',
  'unexposed-override': 'an override inside a placed component that no prop of it carries',
  'exposed-unforwarded': 'an override of a nested instance the placed component exposes, whose props the markup does not forward yet',
  'pointer-words': 'words only a pointer state changes (a field\'s "Search" at focus)',
  'pointer-with': 'a placed instance\'s props only a pointer state gives',
  'pointer-modes': 'variable modes only a pointer state sets, or drops by drawing the part again (a card\'s at focus, a link\'s icon at press): the markup holds modes as attributes, which no pointer state changes',
  'unwritten-scale': 'a scale constraint the sheet never writes (to-code sharesNeverWritten)',
  'path-radius': 'a radius the design holds only as mixed on a path, which no box\'s corners say',
  'unrecorded-effect': 'an effect with no style, whose values the snapshot does not record: no sheet can draw it',
  'one-css-name': 'a token the design names that code spells as the same custom property as another (a name marked with an emoji beside the plain one): no sheet can tell the two apart',
  'icon-own-colour': 'a placed icon\'s colour where the design leaves it the icon set\'s own',
  'placed-own-look': 'a placed component\'s own look the design overrides on the instance',
  'inside-foreign': 'the insides of a component the library does not hold',
  'foreign-own': 'the props, layout and clipping of a component the library does not hold',
  'swapped-own': 'the key, modes and look of a swapped-in component no prop passes',
  'carries-override': 'a placed component\'s part kept only as the way down to an override',
};
/* Which gap of GAPS excuses a row (at, row), or null where it is a difference: leftToCode, by name. */
export function gapOf(contract, mainOf = null, settings = undefined, { ownSheet = true, read = null } = {}) {
  // (`read`: the reading, as a contract; the parts it draws at any combination)
  const readIds = read ? new Set([...Object.keys(read.anatomy || {}), ...(read.variants || []).flatMap((v) => Object.keys(v.add || {}))]) : null;
  // (a part inside a placed component no prop of it carries, an override the markup cannot pass: to-markup's gap)
  const parts = partsOf(contract, settings);
  const reasonOf = (p) => (p.pointerOnly && !p.ring ? 'pointer-only-part' : ((u) => (!u ? null : /^exposed/.test(u) ? 'exposed-unforwarded' : 'unexposed-override'))(mainOf && unexposed(contract, p.id, mainOf)));
  const reasons = new Map([...parts.values()].map((p) => [p.id, reasonOf(p)]).filter(([, r]) => r));
  const ids = [...reasons.keys()];
  // words only a pointer state changes (a field's "Search" at focus): to-markup's gap, as no markup holds them
  // (per text, the words its pointer states draw: a row is theirs only where the design side holds one of them, as rows
  // merge every combination under one place; and only where a pointer state's variant decides them at every combination
  // the row was found in (roundTrip's `pointer`: a search's query, typed at focus and when filled, read wrong only at
  // focus; a row found apart from a pointer state, words only pointer states set or not, stays a difference)
  const words = new Map();
  for (const v of contract.variants || []) for (const [k, w] of Object.entries(v.set || {})) if ((k.endsWith('.content') || k.endsWith('.with')) && pointerWords(contract, v.when)) words.set(k, [...(words.get(k) || []), w]);
  // (and only where the reading drew what the design holds at rest there, roundTrip's `rest`: the markup holds no pointer
  // state, so the rest is all code is entitled to draw at a pointer combination; a wrong word there is code's, a
  // difference. A row with no `rest` (found apart from pointer states, or over combinations whose rests differ) stays one)
  const atRest = (row) => !!row && row.pointer === true && Object.hasOwn(row, 'rest') && restKey(row.drawn) === restKey(row.rest);
  const said = (at, row) => atRest(row) && (words.get(at) || []).includes(row.library);
  const over = new Map(mainOf ? [...parts.values()].map((p) => [p.id, unexposed(contract, p.id, mainOf)]).filter(([, w]) => w) : []);
  // (of such an override, only what markup would pass: the part itself, its kind, component, words and props; its
  // styles the sheet reaches, and a name the reading gives it is the reader's)
  const passed = new Set(['', 'kind', 'component', 'content', 'with']);
  // (a placed instance the markup cannot place at all, a swap no prop passes: its key, modes and look are the swapped-in
  // component's own, gone with it; its size and place in this one stay, as the sheet reaches them)
  // (only where the reading drew the swapped-in component's own there, its main's root; one the library does not hold has
  // no own the markup could say, as a foreign component's. A swap into an exposed instance is a prop the placed component
  // declares, which the markup does not forward yet: exposed-unforwarded, below)
  const SWAPPED = /^(key|modes|background|radius|border|shadow|layout|overflow|smoothing)(\.|$)/;
  const swappedOwn = (el, field, row) => over.get(el) === 'part' && (all[el] || {}).kind === 'instance' && SWAPPED.test(field) && swappedIn(el, field, row);
  const swappedIn = (el, field, row) => { const e = all[el]; if (!mainOf(e.component, e.key)) return true; const { roots } = ownsOf(el); return asOwn(el, field, row, Object.assign([], { roots })); };
  // (a whole part the component does not draw takes its insides with it; a field it draws otherwise, only that field)
  // a part of a placed component's own that the design keeps only as the way down to such an override (an item's
  // content, holding the avatar it has no prop for): its whole-part row goes with the override, its fields stay
  const P = partsOf(contract);
  const placedIn = (el) => { const q = P.get(el); if (!q || !q.inside) return false; for (let up = q.e.parent; up && up !== q.slotted; up = ((P.get(up) || {}).e || {}).parent) if ((((P.get(up) || {}).e) || {}).kind === 'instance') return true; return !q.slotted; };
  const carries = (el) => mainOf && !over.has(el) && [...over.keys()].some((id) => id.startsWith(`${el}/`)) && placedIn(el);
  const all = { ...(contract.anatomy || {}), ...Object.assign({}, ...(contract.variants || []).map((v) => v.add || {})) };
  // what code that draws each placed component as its own draws at a part, the placed main's own value (a gap excuses a
  // row only where the reading drew that: the markup cannot pass the design's override, so the component's own is all
  // code is entitled to draw there; anything else is code's, a difference). Each element that may stand for it: the
  // part's own component's root, where it is a placed instance (its glyph's colour as its own background, as the rows fold
  // it); the outermost placed component it sits in, as placed (derive's placedAs: its swaps applied, its layers named as
  // the instance names them), down through the instances nested in it; and the nearest instance it sits in, at its props
  const { atProps, placedAs, glyphColour } = req('./derive.cjs');
  const down = (m, w, rel) => {
    const A = atProps(m, w);
    if (!rel) return A.root;
    if (A[rel]) return A[rel];
    const s = rel.split('/');
    for (let i = s.length - 1; i >= 1; i--) { const x = A[s.slice(0, i).join('/')]; if (x && x.kind === 'instance') { const n = mainOf(x.component, x.key); return n ? down(n, x.with, s.slice(i).join('/')) : undefined; } }
    return undefined;
  };
  const ownsSeen = new Map();
  const ownsOf = (el) => (ownsSeen.has(el) ? ownsSeen.get(el) : ownsSeen.set(el, ownsAt(el)).get(el));
  // (at every combination the design draws, as rows merge them under one place: the placed main's own there is the one
  // at that combination's props, a list's items Small where the list is)
  const ownsAt = (el) => {
    const out = [], roots = [], s = el.split('/'), seen = new Map([[out, new Set()], [roots, new Set()]]);
    const push = (to, x) => { const k = JSON.stringify(x ?? null); if (!seen.get(to).has(k)) { seen.get(to).add(k); to.push(x); } };
    const done = new Set();
    for (const A of [all, ...(expandedAll() || [])]) {
      const hosts = s.map((_, i) => s.slice(0, i).join('/')).filter((h) => h && (A[h] || {}).kind === 'instance');
      const key = JSON.stringify([A[el], ...hosts.map((h) => [h, A[h]])]);
      if (done.has(key)) continue;
      done.add(key);
      const e = A[el] || {};
      // (its own root says its look alone: which component it is, its props and words are the holder's to place)
      const m = e.kind === 'instance' && mainOf(e.component, e.key);
      if (m) { const r = atProps(m, e.with).root || {}, g = glyphColour(m, e.with); push(roots, r.background == null && g != null ? { ...r, background: g } : r); }
      const host = hosts.find((h) => mainOf(A[h].component, A[h].key));
      if (host) { try { const hm = mainOf(A[host].component, A[host].key), { M } = placedAs(A, host, hm, mainOf), rel = el.slice(host.length + 1); push(out, rel in M ? M[rel] : swappedAt(M, rel, (A[el] || all[el] || {}).component) || down(hm, A[host].with, rel)); } catch { /* a main placedAs cannot read: no candidate */ } }
      const near = hosts[hosts.length - 1], nm = near && mainOf(A[near].component, A[near].key);
      if (nm && near !== host) push(out, down(nm, A[near].with, el.slice(near.length + 1)));
    }
    out.roots = roots;
    return out;
  };
  // (a part a swap the instance's prop passes put there, kept under the swapped-out part's name where the library holds
  // no main for the target (placedAs): the one beside it naming the same component)
  const swappedAt = (M, rel, comp) => {
    if (typeof comp !== 'string') return undefined;
    const up = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '', last = (v) => String(v).split('/').pop().toLowerCase();
    const k = Object.keys(M).find((x) => (x.includes('/') ? x.slice(0, x.lastIndexOf('/')) : '') === up && M[x] && typeof M[x].component === 'string' && last(M[x].component) === last(comp));
    return k ? M[k] : undefined;
  };
  // (a placed instance's prop at its component's default is unstated: a reading leaves it out)
  const unstated = (el, k, v) => {
    const e = all[el] || {}, m = e.kind === 'instance' && mainOf(e.component, e.key);
    const q = m && Object.values(m.props || {}).find((y) => low(y.figma || '') === low(k));
    if (!q) return v == null;
    const i = (q.values || []).indexOf(q.default);
    return v == null || low(v) === low((q.figmaValues || [])[i] ?? q.default);
  };
  const props = (el, w) => restKey(w && typeof w === 'object' ? Object.fromEntries(Object.entries(w).filter(([k, v]) => !unstated(el, k, v))) : w);
  const colour = (v) => typeof v === 'string' && /^(#|rgba?\()/i.test(v.trim()) && JSON.stringify(parseColour(v));
  const asOwn = (el, field, row, found = ownsOf(el)) => {
    const owns = (found.roots || []).length && !/^(with|content|component|kind)(\.|$)/.test(field) && field !== '' ? [...found.roots, ...found] : found;
    if (!row || !owns.length) return false;
    const d = row.drawn ?? null;
    // (a whole part: there where the main draws one, gone where it draws none)
    if (field === '') return owns.some((x) => (x == null) === (d == null));
    return owns.some((x) => {
      const v = field.split('.').reduce((y, q) => (y == null ? undefined : y[q]), x) ?? null;
      if (field === 'with') return props(el, v) === props(el, d);
      if (field.startsWith('with.')) return restKey(v) === restKey(d) || (d == null && unstated(el, field.slice(5), v));
      // (a field of its own a reading leaves unsaid is its component's, as both sides leave out what equals it: derive's
      // ownStyling, from-code's colourKept; never words, a kind or a component, which a reading always says)
      if (d == null && !field.includes('.') && !['content', 'kind', 'component'].includes(field)) return true;
      return restKey(v) === restKey(d) || (!!colour(v) && colour(v) === colour(d));
    });
  };
  // a placed icon's colour where the design leaves it its own (a combination that takes the glyph's override away): the
  // icon set's own colour, which no main in the library holds; and one a variant swaps in that the library does not hold,
  // where the design expanded there gives it no colour: the swapped-in icon's own, which to-markup can only mark
  // (foreignMark) and from-code reads as drawn, swappedMark. Figma keeps an instance's colour across both, so code is
  // entitled to the colour the instance has at rest, no other: what it draws there otherwise is a difference. And only
  // where every combination that leaves the instance no colour is one of these (the variants in force there), as rows
  // merge every combination under one place: one found where neither is in force stays a difference
  const ownColour = (el, field, row) => field === 'background' && row && row.library == null && mainOf && (all[el] || {}).kind === 'instance' && leftOwn(el)
    && ((r) => r != null && (restKey(r) === restKey(row.drawn ?? null) || (!!colour(r) && colour(r) === colour(row.drawn))))(colourIn(expand(contract, variantDefaults(contract)), el));
  // (an instance's colour at a combination: its own, else its glyph's, as the rows fold it; undefined where it is not drawn)
  const colourIn = (A, el) => { const x = A[el]; if (!x) return undefined; if (x.background != null) return x.background; const g = Object.entries(A).find(([k, y]) => k.startsWith(`${el}/`) && y && y.kind === 'graphic' && y.background != null); return g ? g[1].background : null; };
  const combosOf = (() => { let seen; return () => {
    if (seen !== undefined) return seen;
    let cs = [{}];
    for (const [k, q] of Object.entries(contract.props || {})) if (q.type === 'enum' || q.type === 'boolean') { cs = cs.flatMap((c) => (q.type === 'enum' ? q.values : [true, false]).map((v) => ({ ...c, [k]: v }))); if (cs.length > 4096) return (seen = null); }
    return (seen = cs.filter((c) => !(contract.invalid || []).some((w) => Object.entries(w).every(([k, v]) => String(c[k]) === String(v)))));
  }; })();
  const expandedAll = (() => { let seen; return () => (seen !== undefined ? seen : (seen = combosOf() && combosOf().map((c) => expand(contract, { ...variantDefaults(contract), ...c })))); })();
  const leftOwn = (el) => {
    const cs = combosOf(), dflt = variantDefaults(contract);
    if (!cs) return false;
    const held = !!mainOf(all[el].component, all[el].key);
    let any = false;
    for (const [i, c] of cs.entries()) {
      const w = { ...dflt, ...c }, A = expandedAll()[i];
      if (colourIn(A, el) !== null) continue;
      const removed = !held && (contract.variants || []).some((v) => Object.entries(v.when || {}).every(([k, x]) => String(w[k]) === String(x)) && (v.remove || []).some((r) => r.startsWith(`${el}/`) && all[r] && all[r].background != null));
      const swapped = typeof A[el].component === 'string' && A[el].component !== all[el].component && !mainOf(A[el].component, A[el].key);
      if (!removed && !swapped) return false;
      any = true;
    }
    return any;
  };
  // a placed component's own look the design overrides on the instance (its layout, corners, stroke, effect, clipping,
  // smoothing): code places a component and leaves its look to its own sheet (to-code's PLACED, code-standard rule 5),
  // so what the markup cannot pass is code's to say. (Not its fill: on an instance that is an icon's colour, which code
  // writes, ownColour above)
  const LOOK = new Set(['layout', 'radius', 'border', 'shadow', 'overflow', 'smoothing']);
  // (only where the design states one: a look the reading shows and the design leaves to the component is the
  // component's own sheet drifting, a difference)
  // (and only where the reading drew the placed component's own there, asOwn: a look code drew of its own is a difference;
  // one swapped in where no prop swaps it is swapped-own's, or exposed-unforwarded's)
  const ownLook = (el, field, row) => !!mainOf && !!row && row.library != null && LOOK.has(field.split('.')[0]) && (all[el] || {}).kind === 'instance' && !!mainOf(all[el].component, all[el].key) && !foreign(el) && !/^(exposed-)?part$/.test(String(over.get(el))) && asOwn(el, field, row);
  // a component the library does not hold (an icon set's, or one the snapshot never read): to-markup can only mark where
  // it goes (data-icon), so its insides, the props it is given and its own layout and clipping are its own component's,
  // which code draws; its size and place in this one are this one's, and stay measured
  // (and one the library holds that is a drawing alone, swapped by a prop, this component's or that of the placed
  // component it sits in: to-markup draws it by name, as an icon's mark, so its own layout is its drawing's too)
  const swapsOf = (x) => new Set(Object.values((x && x.props) || {}).flatMap((p) => p.swaps || []));
  const swappedHere = (el) => {
    if (swapsOf(contract).has(el)) return true;
    for (let up = (all[el] || {}).parent; up && all[up]; up = all[up].parent) if (all[up].kind === 'instance') { const hm = mainOf(all[up].component, all[up].key); return !!hm && swapsOf(hm).has(el.slice(up.length + 1)); }
    return false;
  };
  const foreign = (el) => { const e = all[el] || {}; if (!mainOf || e.kind !== 'instance') return false; const m = mainOf(e.component, e.key); return !m || (isDrawing(m) && swappedHere(el)); };
  // (its insides only where the library holds no main for it: a drawing it holds, swapped by a prop, is drawn by name
  // from that main, so what is inside it is compared)
  const noMain = (el) => { const e = all[el] || {}; return !!mainOf && e.kind === 'instance' && !mainOf(e.component, e.key); };
  const inForeign = (el) => el.split('/').some((_, i, s) => i < s.length - 1 && noMain(s.slice(0, i + 1).join('/')));
  // (but its Size: to-markup passes that one, data-icon-size, and from-code reads it back)
  // (nor a swap: the prop whose value names the component placed in it, its glyph, which code draws or does not, and
  // which is measured: excused, a wrong glyph read as the same)
  const swapKeys = (el) => swapKeysOf(contract, el);
  const swapRow = (el, field, row) => {
    if (field.startsWith('with.')) return swapKeys(el).has(field.slice(5));
    if (field !== 'with' || !row || !row.library || typeof row.library !== 'object') return false;
    const drawn = row.drawn && typeof row.drawn === 'object' ? row.drawn : {};
    return [...swapKeys(el)].some((k) => k in row.library && JSON.stringify(row.library[k]) !== JSON.stringify(drawn[k]));
  };
  // (never its size or place inside this one, which the sheet writes, however the layout holds them)
  const foreignOwn = (el, field, row) => foreign(el) && field !== 'with.Size' && /^(with|layout|overflow)(\.|$)/.test(field) && !/^layout\.(width|height|position)(\.|$)/.test(field) && !swapRow(el, field, row);
  // a scale constraint the sheet never writes (to-code's sharesNeverWritten: css.mjs shareable fails wherever drawn()
  // places the part): where it is pinned instead is code's to say. Only where the rows are held to the contract the
  // sheet was written from (`ownSheet`): the second leg's are held to the first reading, in its words
  const unscaled = ownSheet ? sharesNeverWritten(contract, mainOf || undefined, settings) : new Set();
  // and a radius the design holds only as mixed on a path (a vector's corners, each its own, which the snapshot records
  // for no part but a box's four): no CSS box's corners say it and the contract does not hold it (css.mjs says it
  // unread). A box's mixed (an older snapshot's), or a part some layer makes or keeps a box, stays a difference
  const vs = contract.variants || [];
  const onPath = (el) => { const rs = [contract.anatomy?.[el], ...vs.map((v) => (v.add || {})[el])].filter(Boolean); return rs.length > 0 && rs.every((e) => e.kind === 'graphic' && !e.shape) && !vs.some((v) => [`${el}.kind`, `${el}.shape`].some((k) => k in (v.set || {}))); };
  // and an effect with no style (the snapshot records only that there is one, `literal`, never its values: css.mjs says
  // it unread), which no sheet draws, so the reading finds none: where the reading draws one, it stays a difference
  // (each only where the reading drew what the sheet writes instead: the part pinned at its size from the start, read
  // `min`; a path's corners as none, null or 0; anything else drawn there is code's, a difference)
  const unwritten = (at, row) => (!row ? null : row.library === 'scale' && unscaled.has(at) && row.drawn === 'min' ? 'unwritten-scale' : row.library === 'mixed' && /\.radius$/.test(at) && onPath(at.slice(0, -'.radius'.length)) && (row.drawn == null || row.drawn === 0) ? 'path-radius'
    : row.library === 'literal' && row.drawn == null && /\.shadow$/.test(at) ? 'unrecorded-effect'
    : typeof row.library === 'string' && typeof row.drawn === 'string' && row.library !== row.drawn && /\.(background|color|radius|border|shadow|type|typography|width|height|min\w*|max\w*|opacity|layout)(\.|$)/.test(at) && !/^(#|rgba?\(|literal$|mixed$|scale$)/.test(row.library) && tokenNames.token(row.library) === tokenNames.token(row.drawn) ? 'one-css-name' : null);
  // a placed instance's props only a pointer state gives: one of its own (a definition drawn hovered, its State Hover), or
  // the props this component's pointer state alone sets on it (a slider's item Active at hover): no markup holds either,
  // to-markup's gap. Only where every prop the design's side names there is such a one
  const low = (v) => String(v).toLowerCase();
  const ownPointer = (el, k, v) => {
    const m = mainOf && (all[el] || {}).kind === 'instance' && mainOf(all[el].component, all[el].key);
    const q = m && Object.values(m.props || {}).find((y) => y.role === 'interaction' && low(y.figma || '') === low(k));
    if (!q) return false;
    const i = (q.figmaValues || []).map(low).indexOf(low(v));
    return (q.pointer || []).includes(i >= 0 ? q.values[i] : v);
  };
  const pointerWith = (el, field, row) => {
    if (!row || !/^with(\.|$)/.test(field)) return false;
    const lib = field === 'with' ? row.library : { [field.slice(5)]: row.library };
    if (!lib || typeof lib !== 'object' || !Object.keys(lib).length) return false;
    // (a value the instance holds at rest too, or another state adds it with, is no pointer state's: a rest the reading
    // lost stays a difference; per prop. One another state sets is roundTrip's `pointer` to tell, per combination)
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const rest = ((contract.anatomy || {})[el] || {}).with || {};
    const elsewhere = (k, v) => same(rest[k], v) || vs.some((x) => !pointerWords(contract, x.when) && (((x.add || {})[el] || {}).with || {})[k] !== undefined && same(((x.add || {})[el] || {}).with[k], v));
    const byMine = atRest(row) && Object.entries(lib).every(([k, v]) => !elsewhere(k, v))
      && (words.get(`${el}.with`) || []).some((w) => w && typeof w === 'object' && Object.entries(lib).every(([k, v]) => same(w[k], v)));
    // (an instance's own pointer state: code places it at its rest, so the reading draws those props at their default or
    // leaves them out; anything else it draws there is a difference)
    const m = mainOf && (all[el] || {}).kind === 'instance' && mainOf(all[el].component, all[el].key);
    const restOf = (k) => { const q = m && Object.values(m.props || {}).find((y) => low(y.figma || '') === low(k)); if (!q) return undefined; const i = (q.values || []).indexOf(q.default); return (q.figmaValues || [])[i] ?? q.default; };
    const drawnRest = (k, v) => v == null || low(v) === low(restOf(k));
    const drawn = field === 'with' ? row.drawn : row.drawn == null ? null : { [field.slice(5)]: row.drawn };
    const ownAtRest = drawn == null || (typeof drawn === 'object' && Object.entries(drawn).every(([k, v]) => k in lib && drawnRest(k, v)));
    return byMine || (ownAtRest && Object.entries(lib).every(([k, v]) => ownPointer(el, k, v)));
  };
  // modes a pointer state's variant sets on that layer at the design's value, or drops by adding the layer again, at every
  // combination the row was found in (roundTrip's `pointer`, read per combination from the variants that apply there): one
  // no pointer state sets there stays a difference, and so does one where the reading drew other modes than the rest's
  // (roundTrip's `rest`): code holds modes as attributes, so at a pointer combination it is entitled to the rest's alone
  const pointerModes = (el, field, row) => {
    if (!atRest(row) || !/^modes(\.|$)/.test(field)) return false;
    const at = (x) => { const m = (x.set || {})[`${el}.modes`] !== undefined ? x.set[`${el}.modes`] : (x.add || {})[el] ? x.add[el].modes || null : undefined; return field === 'modes' || m === undefined ? m : m == null ? null : m[field.slice(6)] ?? null; };
    const key = (v) => JSON.stringify(v, (_, w) => (w && typeof w === 'object' && !Array.isArray(w) ? Object.fromEntries(Object.entries(w).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : w));
    return vs.some((x) => pointerWords(contract, x.when) && at(x) !== undefined && key(at(x)) === key(row.library));
  };
  return (at, row) => {
    const el = at.split('.')[0], field = at.slice(el.length + 1);
    const id = ids.find((x) => (el === x || el.startsWith(`${x}/`)) && !(over.has(x) && !((el !== x && /^(exposed-)?part$/.test(String(over.get(x)))) || passed.has(field) || (field.startsWith('with.') && el === x) || (el === x && over.get(x) === 'exposed-part' && SWAPPED.test(field)))));
    // (modes, the markup's attributes, that only pointer states' variants set at every combination the row was found in:
    // roundTrip's `pointer`)
    // (a part only a pointer state draws inside a placed component is left to code only where the reading lacks it: one
    // it reads, its placed component forced to that state too (from-code forwardedAt), differs as any part does, and so
    // does a field of it the reading leaves out)
    return said(at, row) ? 'pointer-words' : pointerWith(el, field, row) ? 'pointer-with' : pointerModes(el, field, row) ? 'pointer-modes' : unwritten(at, row) || (ownColour(el, field, row) ? 'icon-own-colour' : ownLook(el, field, row) ? 'placed-own-look' : inForeign(el) ? 'inside-foreign'
      : foreignOwn(el, field, row) ? 'foreign-own' : swappedOwn(el, field, row) ? 'swapped-own' : field === '' && carries(el) && (row || {}).drawn == null ? 'carries-override' : id ? (reasons.get(id) === 'pointer-only-part' ? ((row && row.drawn != null) || (readIds && readIds.has(el)) ? null : reasons.get(id))
        // (an override the markup cannot pass is left to code only where the reading drew the placed main's own there)
        // (a swap into an exposed instance, its key, modes and look: held to the swapped-in component's own, as swapped-own's)
        : (over.get(id) === 'exposed-part' && el === id && SWAPPED.test(field) ? swappedIn(el, field, row) : asOwn(el, field, row)) ? reasons.get(id) : null) : null);
  };
}
/* What the toolkit's own markup leaves to code (gapOf), as yes or no. */
export function leftToCode(...args) { const g = gapOf(...args); return (at, row) => !!g(at, row); }
// (each row left to code carries the gap that excuses it)
const splitLeft = (rows, gap) => { const out = { rows: [], left: [] }; for (const r of rows) { const g = gap(r.at, r); if (g) out.left.push({ ...r, gap: g }); else out.rows.push(r); } return out; };
/* A reading's tags of what it took from the design (from-code's `assisted`): { assisted } where it carries them, else
   { untagged }, a reading taken before the tags, never known strictly. */
const tagsOf = (r) => (r && r.assisted && typeof r.assisted === 'object' ? { assisted: r.assisted, ...(Array.isArray(r.declared) && r.declared.length && { declared: r.declared }) } : { untagged: true });
/* The readings whose name or keys the code declares (from-code's `declared`, its modules' labels), said apart from the
   assisted: identity the code states, never measured. Tested by test-eval.mjs. */
export const identifiedNote = (m) => { const k = m.filter(([, x]) => x.declared && x.declared.length).length; return k ? `; ${k} identified by the code's own label` : ''; };

/* The components whose stored contract.json is missing, or not what derive.cjs makes of their spec today (check-specs' own test). */
export function staleContracts(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  const { checkSpecs } = req('../snapshot/check-specs.cjs');
  return (checkSpecs(dir).bad || []).filter((b) => /contract\.json is not what the spec derives|no contract\.json beside the spec|no contract can be derived/.test(b)).map((b) => b.split(':')[0].trim());
}

/* Every leg for one project: { home, legs: { browser, self, figma } }, each leg { <component>: { rows, combinations, cut? } | { skipped } }.
   `now` is what a self reading is read from today ({ inputs: selfInputs, reader: readerCode, chrome: chromeMajor }); a
   field left out is not checked. */
// The names a run was given that the library lacks: one a panel lists is said (a panel shrinks out loud), one typed
// refuses the run. Pure, for its test.
export function unknownNames(names, folders, panel = []) {
  const have = new Set(folders), missing = names.filter((x) => !have.has(x));
  return { said: missing.filter((c) => panel.includes(c)).map((c) => `panel: ${c} is not in the library now`), refused: missing.filter((c) => !panel.includes(c)) };
}

/* A Figma reading drawn from another stored figma.json, walk or drawing code than today's (figmaInputs) is stale: why,
   or null. */
const drawnMoved = (was, today) => {
  if (!today) return null;
  if (!was) return 'taken before its spec, walk and code were recorded';
  // (what it was drawn before was recorded is said so, never as a change, beside what did change)
  const unrecorded = (k) => was[k] === undefined && today[k] !== undefined;
  const before = [['store', 'the stored snapshot was'], ['settings', 'the drawing settings were']].filter(([k]) => unrecorded(k)).map(([, w]) => `taken before ${w} recorded`);
  const changed = [['spec', 'its stored figma.json'], ['store', 'the stored snapshot'], ['walk', 'the walk'], ['code', 'the drawing\'s code'], ['settings', 'the project\'s drawing settings']].filter(([k]) => !unrecorded(k) && was[k] !== today[k]).map(([, w]) => w);
  const said = [...before, ...(changed.length ? [`${changed.join(', ')} changed since`] : [])];
  return said.length ? said.join('; ') : null;
};

export function measure(where, only = [], now = {}) {
  const home = where.projectDir;
  const readings = path.join(home, 'parity', 'from-code');
  const drawn = path.join(home, 'round-trip');
  const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
  const legs = { browser: {}, self: {}, second: {}, figma: {} };
  const taken = readTaken(home);
  // a reading of another contract than today's, or one kept when its drawing went unanswered, is stale: measured, said apart
  const stale = (leg, folder, contract) => { const t = (taken[leg] || {})[folder]; return !t ? 'taken before readings were fingerprinted' : t.kept ? 'kept from an earlier drawing (an import went unanswered)' : t.hash !== hashOf(contract) ? 'its contract changed since' : leg === 'self' ? moved(t, now.inputs && now.inputs[folder]) : leg === 'figma' ? drawnMoved(t.drawnFrom, now.figma && now.figma[folder]) : null; };
  // a reading from code taken under another Chrome major, or before its Chrome was recorded, is stale
  const browserMoved = (was) => (!now.chrome ? null : !was ? 'taken before its Chrome was recorded' : was !== now.chrome ? `taken under Chrome ${was}, ${now.chrome} installed now` : null);
  // a self or second reading read from other inputs than today's, or under another Chrome major, is stale too
  const moved = (t, key) => ((t.chrome && browserMoved(t.chrome)) || (!key ? null : !t.inputs ? 'taken before its inputs were recorded' : t.inputs === key ? null
      : now.reader && t.reader && t.reader !== now.reader ? 'its inputs changed since, the reader\'s code among them' : 'its inputs changed since'));
  // each component by its name, as the pipeline resolves it, for what an instance of it draws at its defaults
  const mains = req('./derive.cjs').byComponentName(contracts(where).map(({ contract }) => contract));
  // the combinations a reading left unread and predicted from its layers (from-code's `unread`; one read before it was
  // kept, its self-check's words): held apart, never measured. One that does not say (a self-check that failed, or
  // none) is `unknown`: never the same, and no count
  const unreadOf = (r) => (typeof r.unread === 'number' ? r.unread : typeof r.selfCheck === 'string' ? +((r.selfCheck.match(/(\d+) of five props or more left unread/) || [])[1] || 0) : undefined);
  const predicted = (r) => ({ predicted: unreadOf(r) ?? 'unknown' });
  const selfDir = path.join(drawn, 'self', 'from-code');
  // (what the markup leaves to the code, under the library's settings, the ones the self leg writes under)
  const settingsOf = req('../snapshot/projects.cjs').librarySettingsFor(where.paths.components);
  for (const { folder, contract } of contracts(where)) {
    if (only.length && !only.includes(folder)) continue;
    const code = read(path.join(readings, `${folder}.json`));
    if (!code || !code.asFigma) legs.browser[folder] = { skipped: 'no reading from code (from-code.mjs has not read it)' };
    // from-code fingerprints a reading from code with the contract it read against (`of`)
    else { const r = roundTrip(contract, code.asFigma, { mains, layoutUnit: true }), st = !code.of ? 'taken before readings were fingerprinted' : code.of !== hashOf(contract) ? 'its contract changed since' : browserMoved(code.chrome); legs.browser[folder] = { rows: r.rows, ...tagsOf(code), combinations: r.combinations, ...predicted(code), ...(r.cut && { cut: r.cut }), ...(st && { stale: st }) }; }
    const own = read(path.join(selfDir, `${folder}.json`));
    if (!own || !own.asFigma) legs.self[folder] = { skipped: 'not read from the toolkit\'s own rendering (eval.mjs --self)' };
    else { const r = roundTrip(contract, own.asFigma, { mains, layoutUnit: true }), st = stale('self', folder, contract); legs.self[folder] = { ...splitLeft(r.rows, gapOf(contract, mains, settingsOf(folder), { read: own.asFigma })), ...tagsOf(own), combinations: r.combinations, ...predicted(own), ...(r.cut && { cut: r.cut }), ...(st && { stale: st }) }; }
    // the second trip, held to the first: what it changes is the translation not settling (idempotence)
    const again = read(path.join(drawn, 'self2', 'from-code', `${folder}.json`));
    if (!again || !again.asFigma || !own || !own.asFigma) legs.second[folder] = { skipped: 'not read a second time (eval.mjs --second)' };
    else {
      // held to the first reading as it stands: one taken again since the second trip went round is stale
      // only the combinations the library draws (a reading carries no invalid list of its own)
      const r = roundTrip({ ...own.asFigma, invalid: contract.invalid }, again.asFigma, { mains, layoutUnit: true, pointerFrom: contract }), t = (taken.second || {})[folder];
      const key = now.inputs && now.inputs[folder] && secondKey(now.inputs[folder], fs.readFileSync(path.join(selfDir, `${folder}.json`), 'utf8'));
      const st = !t ? 'taken before readings were fingerprinted' : t.hash !== hashOf(own.asFigma) ? 'its first reading was taken again since' : legs.self[folder].stale ? `its first reading is stale (${legs.self[folder].stale})` : moved(t, key);
      legs.second[folder] = { ...splitLeft(r.rows, gapOf(contract, mains, settingsOf(folder), { ownSheet: false, read: again.asFigma })), ...tagsOf(again), combinations: r.combinations, ...predicted(again), ...(r.cut && { cut: r.cut }), ...(st && { stale: st }) };
    }
    const back = read(path.join(drawn, `${folder}.roundtrip.json`));
    // a reading whose geometry was not compared (taken before it was kept, or with no stored figma.json) is stale, as one
    // taken before fingerprints is, and never the same (isSame) by the geometry it lacks
    const st = back && [!back.geometry && 'taken before geometry was compared, draw again', stale('figma', folder, contract)].filter(Boolean).join('; ');
    legs.figma[folder] = back ? { rows: [...back.rows, ...(back.geometry || [])], untagged: true, combinations: back.combinations, ...(back.cut && { cut: back.cut }), ...(st && { stale: st }), ...(!back.geometry && { lacks: 'geometry' }) } : { skipped: 'not drawn and read back (eval.mjs --draw)' };
  }
  return { home, legs };
}

/* A reading the same, one definition on every leg: measured, no row, no row left to code (what code is left to say is
   not shown the same), no combination predicted instead of read, none cut, and nothing it was not compared on (a Figma
   reading with no geometry). */
export const isSame = (x) => !!x.rows && !x.rows.length && !x.lacks && !(x.left && x.left.length) && !x.predicted && !x.cut;
/* The same strictly: the same, and no field taken from the design (from-code's `assisted`), so every field was compared.
   A reading not tagged (taken before the tags; the Figma leg, whose drawer's copies are not tagged yet) is not known
   strictly, so never strictly the same. */
export const isStrict = (x) => isSame(x) && !!x.assisted && !Object.keys(x.assisted).length;
/* A weaker tier, said beside the same and never instead: the same, or held back only by rows left to code inside or on a
   component another library holds (inside-foreign, foreign-own), which the markup marks and does not draw. */
const FOREIGN = new Set(['inside-foreign', 'foreign-own']);
export const isSameApartFromForeign = (x) => !!x.rows && !x.rows.length && !x.lacks && !x.predicted && !x.cut && (x.left || []).every((r) => FOREIGN.has(r.gap));
/* A third tier, beside the other two: held back only by what the library itself holds back, another library's insides
   and an override no prop of the placed component carries (one on an instance it exposes is ours, exposed-unforwarded,
   and holds a component out of this tier). The user's ruling, 2026-11-26: what Figma allows and no code can express is
   counted apart, never among the toolkit's differences. */
const LIBRARY = new Set([...FOREIGN, 'unexposed-override']);
export const isSameApartFromLibrary = (x) => !!x.rows && !x.rows.length && !x.lacks && !x.predicted && !x.cut && (x.left || []).every((r) => LIBRARY.has(r.gap));
/* A component's strict count: its rows, its rows left to code and its fields taken from the design. */
const assistedFields = (x) => Object.values(x.assisted || {}).reduce((a, l) => a + l.length, 0);
const strictCount = (x) => x.rows.length + (x.left || []).length + assistedFields(x);

/* The counts a measure stands at, and what rose or went against the accepted ones. */
// (what is left to code is held too, as its own leg: a part that comes to be drawn only at a pointer state moves its rows
// there, and that rise is said, not hidden)
export const counts = (legs) => Object.fromEntries(Object.entries(legs).flatMap(([leg, cs]) => {
  const out = [[leg, Object.fromEntries(Object.entries(cs).filter(([, x]) => x.rows).map(([c, x]) => [c, x.rows.length]))]];
  // (every component the leg splits, 0 included: one whose left rows fall to none is measured, not gone)
  const left = Object.entries(cs).filter(([, x]) => x.rows && x.left);
  if (left.length) out.push([`${leg} left`, Object.fromEntries(left.map(([c, x]) => [c, x.left.length]))]);
  // (and the combinations predicted, not read: every component that says how many, 0 included, as `left`: one read in
  // full since its accept is a count that fell, never a reading gone)
  const said = Object.entries(cs).filter(([, x]) => x.rows && typeof x.predicted === 'number');
  if (said.length) out.push([`${leg} predicted`, Object.fromEntries(said.map(([c, x]) => [c, x.predicted]))]);
  // (and the strict count of every tagged reading: rows, rows left to code, fields assisted)
  const tagged = Object.entries(cs).filter(([, x]) => x.rows && x.assisted);
  if (tagged.length) out.push([`${leg} strict`, Object.fromEntries(tagged.map(([c, x]) => [c, strictCount(x)]))]);
  return out;
}));
// A strict count (`<leg> strict`) that accepted.json does not hold at all is new bookkeeping of a leg already accepted,
// not a rise: unaccepted says it, worse passes it. Any other count absent (a base leg, `left`, `predicted`) is still
// held, each reading newly measured.
const derivedOnly = (leg, accepted) => / strict$/.test(leg) && (accepted || {})[leg] === undefined;
export const unaccepted = (now, accepted) => Object.entries(now).filter(([leg, cs]) => derivedOnly(leg, accepted) && Object.keys(cs).length)
  .map(([leg, cs]) => `${leg}: not yet accepted (${Object.keys(cs).length} component${Object.keys(cs).length === 1 ? '' : 's'}): --accept once to hold it`);
export function worse(now, accepted) {
  const out = [];
  for (const [leg, cs] of Object.entries(accepted || {})) for (const [c, n] of Object.entries(cs)) {
    const m = (now[leg] || {})[c];
    if (m === undefined) out.push(`${leg} ${c}: accepted at ${n}, now not measured`);
    else if (m > n) out.push(`${leg} ${c}: ${n} → ${m}`);
  }
  // a component measured since the accept is held from its first count: accepted once, with what its rows say
  for (const [leg, cs] of Object.entries(now)) if (!derivedOnly(leg, accepted)) for (const [c, m] of Object.entries(cs)) if (m > 0 && ((accepted || {})[leg] || {})[c] === undefined) out.push(`${leg} ${c}: newly measured at ${m}, not accepted yet`);
  return out;
}

/* A fixed panel of components to measure a library on, so a trend compares the same components run to run: those
   already read from the toolkit's own rendering first (the measure so far stays comparable), then one page at a time
   in a fixed order (by a hash of the page's name), each page's next component by a hash of its folder, every published
   one before any hidden from publishing (a name with a part starting `.` or `_`, a building block), until n. Pure: the
   same library gives the same panel. [{ folder, page, hidden }] → [folder] */
export function pickPanel(all, read, n = 30) {
  const h = (s) => createHash('sha1').update(s).digest('hex');
  const out = all.filter((c) => read.includes(c.folder)).map((c) => c.folder).sort().slice(0, n);
  for (const hidden of [false, true]) {
    const pages = new Map();
    for (const c of all.filter((x) => !out.includes(x.folder) && !!x.hidden === hidden).sort((a, b) => h(a.folder).localeCompare(h(b.folder)))) pages.set(c.page || '', [...(pages.get(c.page || '') || []), c.folder]);
    const order = [...pages.keys()].sort((a, b) => h(a).localeCompare(h(b)));
    for (let i = 0; out.length < n && order.some((p) => pages.get(p).length > i); i++) for (const p of order) if (out.length < n && pages.get(p)[i]) out.push(pages.get(p)[i]);
  }
  return out;
}
const panelFile = (home) => path.join(home, 'round-trip', 'panel.json');
/* Accepted counts or causes kept to some components ({ leg: { component: x } }), and those merged back over the whole:
   a panel's check, diff and accept touch only its own components. */
export const scoped = (byLeg, only) => Object.fromEntries(Object.entries(byLeg || {}).map(([leg, cs]) => [leg, Object.fromEntries(Object.entries(cs).filter(([c]) => only.includes(c)))]));
export const merged = (whole, part, only) => { const out = scoped(whole, Object.keys(Object.assign({}, ...Object.values(whole || {}))).filter((c) => !only.includes(c))); for (const [leg, cs] of Object.entries(part)) out[leg] = { ...(out[leg] || {}), ...cs }; return out; };
// (a file there that does not parse is refused, never taken for no panel: a fixed panel is never silently replaced)
export const readPanel = (home) => { if (!fs.existsSync(panelFile(home))) return null; let c; try { c = JSON.parse(fs.readFileSync(panelFile(home), 'utf8')).components; } catch (e) { throw new Error(`${panelFile(home)} does not parse (${e.message}): mend it by hand`); } return Array.isArray(c) && c.length ? c : null; };

/* Each component's causes, per leg, as --accept keeps them beside the counts (accepted-causes.json), so --diff can say
   which causes a count moved by. { leg: { component: { cause: rows } } } */
export const causesOf = (legs) => Object.fromEntries(Object.entries(legs).flatMap(([leg, cs]) => {
  const out = [[leg, Object.fromEntries(Object.entries(cs).filter(([, x]) => x.rows).map(([c, x]) => [c, causes(x.rows, x.combinations)]))]];
  const left = Object.entries(cs).filter(([, x]) => x.rows && x.left);
  if (left.length) out.push([`${leg} left`, Object.fromEntries(left.map(([c, x]) => [c, causes(x.left, x.combinations)]))]);
  // the strict count's causes: the rows', each gap's rows left to code, each rule's fields assisted
  const tagged = Object.entries(cs).filter(([, x]) => x.rows && x.assisted);
  const strictOf = (x) => { const o = causes(x.rows, x.combinations); for (const r of x.left || []) o[`left to code: ${r.gap}`] = (o[`left to code: ${r.gap}`] || 0) + 1; for (const [rule, l] of Object.entries(x.assisted || {})) o[`assisted: ${rule}`] = l.length; return o; };
  if (tagged.length) out.push([`${leg} strict`, Object.fromEntries(tagged.map(([c, x]) => [c, strictOf(x)]))]);
  return out;
}));

/* The measure now against the accepted one, component by component: every count that moved, either way, largest first,
   with the causes it moved by where the accept kept them; a leg's total is over the components measured both times, so
   a component newly read or no longer read is said apart, never folded into the trend. Lines to print. */
export function diff(now, accepted = {}, nowCauses = {}, accCauses = {}) {
  const out = [];
  for (const leg of [...new Set([...Object.keys(accepted), ...Object.keys(now)])]) {
    const a = accepted[leg] || {}, n = now[leg] || {};
    const comps = [...new Set([...Object.keys(a), ...Object.keys(n)])];
    if (!comps.length) continue;
    const both = comps.filter((c) => a[c] !== undefined && n[c] !== undefined);
    const same = (x, y) => JSON.stringify(Object.entries(x || {}).sort()) === JSON.stringify(Object.entries(y || {}).sort());
    const shifted = (c) => a[c] === n[c] && (accCauses[leg] || {})[c] && (nowCauses[leg] || {})[c] && !same(accCauses[leg][c], nowCauses[leg][c]);
    const moved = comps.filter((c) => a[c] !== n[c] || shifted(c)).map((c) => ({ c, was: a[c], is: n[c], d: (n[c] ?? 0) - (a[c] ?? 0) })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d) || x.c.localeCompare(y.c));
    const fell = moved.filter((x) => x.was !== undefined && x.is !== undefined && x.d < 0).length, rose = moved.filter((x) => x.was !== undefined && x.is !== undefined && x.d > 0).length;
    const sum = (o) => both.reduce((s, c) => s + o[c], 0);
    const newly = comps.filter((c) => a[c] === undefined).length, gone = comps.filter((c) => n[c] === undefined).length;
    const d = sum(n) - sum(a);
    out.push(`${leg}: ${sum(a)} → ${sum(n)} (${d > 0 ? '+' : ''}${d}) over the ${both.length} measured both times; ${fell} fell, ${rose} rose${newly ? `; ${newly} newly measured` : ''}${gone ? `; ${gone} not measured now` : ''}`);
    for (const x of moved) {
      out.push(x.was === undefined ? `  ${x.c}: newly measured at ${x.is}` : x.is === undefined ? `  ${x.c}: accepted at ${x.was}, not measured now` : !x.d ? `  ${x.c}: ${x.was} → ${x.is}, its causes changed` : `  ${x.c}: ${x.was} → ${x.is} (${x.d > 0 ? '+' : ''}${x.d})`);
      const ac = (accCauses[leg] || {})[x.c], nc = (nowCauses[leg] || {})[x.c];
      if (!ac || !nc) continue;
      for (const [k, dk] of [...new Set([...Object.keys(ac), ...Object.keys(nc)])].map((k) => [k, (nc[k] || 0) - (ac[k] || 0)]).filter(([, dk]) => dk).sort((p, q) => Math.abs(q[1]) - Math.abs(p[1]) || p[0].localeCompare(q[0]))) out.push(`    ${dk > 0 ? '+' : ''}${dk}  ${k}`);
    }
  }
  return out;
}

export function report(label, { legs }, fields, byCause) {
  for (const [leg, cs] of Object.entries(legs)) {
    const m = Object.entries(cs).filter(([, x]) => x.rows), skipped = Object.entries(cs).filter(([, x]) => x.skipped);
    const rows = m.flatMap(([, x]) => x.rows);
    const all = Object.keys(cs).length, old = m.filter(([, x]) => x.stale), nc = m.reduce((a, [, x]) => a + Object.keys(causes(x.rows, x.combinations)).length, 0);
    // strict beside assisted: the components the same only with a field taken from the design, by the rule that took it
    // (a component under two rules is said under each), and those read before the tags, never known strictly
    const assisted = {};
    for (const [, x] of m.filter(([, y]) => isSame(y) && y.assisted)) for (const rule of Object.keys(x.assisted || {})) assisted[rule] = (assisted[rule] || 0) + 1;
    const byRule = Object.entries(assisted).sort((p, q) => q[1] - p[1] || p[0].localeCompare(q[0])).map(([r, k]) => `${k} assisted by ${r}`);
    const untagged = m.filter(([, x]) => x.untagged).length;
    const gaps = {};
    for (const [, x] of m) for (const r of x.left || []) gaps[r.gap] = (gaps[r.gap] || 0) + 1;
    const byGap = Object.entries(gaps).sort((p, q) => q[1] - p[1] || p[0].localeCompare(q[0])).map(([g, k]) => `${g} ${k}`).join(', ');
    console.log(`${label} ${leg}: ${m.filter(([, x]) => isSame(x)).length} of ${all} the same; strictly ${m.length && untagged === m.length ? 'not known' : m.filter(([, x]) => isStrict(x)).length}${byRule.length ? ` (${byRule.join(', ')})` : ''}${identifiedNote(m)}${untagged ? `; ${untagged} untagged, not known strictly (read before assist tags, or the Figma leg, whose drawer is not tagged)` : ''}; ${m.filter(([, x]) => isSameApartFromForeign(x)).length} the same apart from another library's insides; ${m.filter(([, x]) => isSameApartFromLibrary(x)).length} the same apart from what the library holds back; measured ${m.length} of ${all}; ${nc} causes, ${rows.length} differing rows${m.some(([, x]) => x.left && x.left.length) ? `; ${m.reduce((a, [, x]) => a + (x.left || []).length, 0)} rows left to code (${byGap})` : ''}${m.some(([, x]) => typeof x.predicted === 'number' && x.predicted) ? `; ${m.reduce((a, [, x]) => a + (typeof x.predicted === 'number' ? x.predicted : 0), 0)} combinations predicted, not read (in ${m.filter(([, x]) => typeof x.predicted === 'number' && x.predicted).length})` : ''}${m.some(([, x]) => x.predicted === 'unknown') ? `; ${m.filter(([, x]) => x.predicted === 'unknown').length} not saying what was predicted (read before it was said, or a self-check that failed)` : ''}${old.length ? `; ${old.length} stale (${[...new Set(old.map(([, x]) => x.stale))].join('; ')})` : ''}${skipped.length ? `; ${skipped.length} not measured (${[...new Set(skipped.map(([, x]) => x.skipped))].join('; ')})` : ''}`);
    for (const [c, x] of m) if (x.cut) console.log(`  ${c}: ${x.cut} combination(s) past the first ${x.combinations} not compared`);
    if (byCause) for (const [c, k, n] of m.flatMap(([c, x]) => Object.entries(causes(x.rows, x.combinations)).map(([k, n]) => [c, k, n])).sort((a, b) => b[2] - a[2])) console.log(`  ${String(n).padStart(4)}  ${c}: ${k}`);
    if (!fields) continue;
    const by = {};
    for (const r of rows) by[fieldOf(r.at)] = (by[fieldOf(r.at)] || 0) + 1;
    for (const [f, n] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);
  }
}

/* to-figma.mjs with these arguments: { out, ok }. */
const toFigma = (args) => { try { return { out: execFileSync('node', [path.join(HERE, 'to-figma.mjs'), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), ok: true }; } catch (e) { return { out: `${e.stdout || ''}${e.stderr || ''}`, ok: false }; } };

/* contract → to-figma → the scratch file → the snapshot's walk and derive → contract, per component: to-figma's own
   --verify reads it back and writes <component>.roundtrip.json beside the contract it was given. The library file's keys
   are looked up once for the run (to-figma --lookup); each step's time is logged and noted (taken.json `times`). With
   `keepUnchanged`, a component whose contract, inputs (figmaInputs) and file drawn into are its last drawing's keeps
   that reading, unless it is stale, lacks geometry, or places (at any depth) a component drawn again in this run. Opt-in:
   the library file itself is not keyed (the plugin API gives no version of it), so a change made there since is seen
   only by drawing again. `run` is to-figma (a fake in the tests). */
export function draw(where, label, into, only, { retry = true, keepUnchanged = false, run = toFigma, looked = null, settings = drawSettings(libraryOf(label)), runLookup = null } = {}) {
  const dir = path.join(where.projectDir, 'round-trip');
  fs.mkdirSync(dir, { recursive: true });
  let fails = 0;
  // a drawing an import went unanswered in measures the library's silence, not the translation: its last reading stays,
  // and it is drawn once more after the rest
  const unanswered = [];
  const failed = (folder, what, out) => { console.log(`${folder}: ${what} — ${out.trim().split('\n').pop()}`); process.exitCode = 1; if (++fails < 3) return false; console.log('three failures in a row: stopped'); process.exitCode = 1; return true; };
  // a component Figma never publishes (`_`, `.`) is placed from its own page in the scratch file, so it is drawn before
  // the components that place it: a modal drawn first placed its dialog as it was before this run
  const unpublished = (c) => /^[_.]/.test(c.component || '');
  const all = contracts(where);
  const order = [...all].sort((a, b) => unpublished(b.contract) - unpublished(a.contract));
  // what each drawing is drawn from, taken as the run starts: a reading taken from other ones reads stale (measure)
  const from = figmaInputs(where, only, settings);
  const taken = readTaken(where.projectDir).figma || {};
  const lib = Object.fromEntries(all.filter((x) => x.contract).map(({ folder, contract }) => [contract.component, { ...contract, folder }]));
  const reading = (folder) => path.join(dir, `${folder}.roundtrip.json`);
  const asked = order.filter(({ folder }) => !only.length || only.includes(folder));
  // which are kept, decided for all before any is drawn: one whose own drawing is unchanged, until a component it places
  // is drawn again, whichever comes first in the order (to a fixed point)
  const kept = new Set(!keepUnchanged ? [] : asked.filter(({ folder, contract }) => {
    const t = taken[folder];
    let back = null; try { back = JSON.parse(fs.readFileSync(reading(folder), 'utf8')); } catch { /* none */ }
    return t && !t.kept && t.hash === hashOf(contract) && t.into === into && t.drawnFrom && !drawnMoved(t.drawnFrom, from[folder]) && back && back.geometry;
  }).map(({ folder }) => folder));
  const drawn = (f) => asked.some((x) => x.folder === f) && !kept.has(f);
  for (let moved = true; moved;) { moved = false; for (const f of [...kept]) if ([...closureOf(lib, [f])].some((g) => g !== f && drawn(g))) { kept.delete(f); moved = true; } }
  const todo = [];
  for (const { folder, contract } of asked) {
    if (kept.has(folder)) { console.log(`${folder}: unchanged since ${taken[folder].at || 'its last drawing'}`); continue; }
    todo.push({ folder, contract, file: path.join(dir, `${folder}.json`) });
  }
  for (const { contract, file } of todo) fs.writeFileSync(file, JSON.stringify(contract, null, 2) + '\n');
  // the library file's keys every drawing wants, looked up in one walk of it (each drawing looked them up on its own)
  let lookedHere = null;
  if (!looked && todo.length) {
    const file = path.join(dir, `.looked-${process.pid}.json`), l = run([...todo.map((x) => x.file), '--lookup', file, '--project', label]);
    const said = l.out.trim().split('\n').pop();
    if (l.ok && fs.existsSync(file)) { looked = lookedHere = file; console.log(said); runLookup = +((said.match(/ in ([\d.]+)s$/) || [])[1]) || null; } else console.log(`keys not looked up once for the run${said ? ` (${said})` : ''}: each drawing looks up its own`);
  }
  try {
    for (const { folder, contract, file } of todo) {
      // the last run's reading goes first: a drawing that fails now must not be counted by the last one's rows
      const last = fs.existsSync(reading(folder)) ? fs.readFileSync(reading(folder)) : null;
      fs.rmSync(reading(folder), { force: true });
      const step = (args) => run([file, ...args, '--project', label, '--into', into, '--library', file, '--folder', folder]);
      // a drawing still holding the file (one that failed lets go within a minute), or a connection that dropped, is waited
      // out: 15 s, eight times (a failed one lets go within two minutes), then it counts as a failure
      const drawIt = () => step(['--run', ...(looked ? ['--looked', looked] : [])]);
      let d = drawIt();
      for (let i = 0; i < 8 && !d.ok && /still running in this file|Unable to establish connection/.test(d.out); i++) { execFileSync('sleep', ['15']); d = drawIt(); }
      // a scratch file another project claims refuses every drawing alike: a setup error, not a reading, so the last
      // reading goes back and the run stops at once
      if (!d.ok && /refused: \S+ is \S+'s scratch file/.test(d.out)) { fs.unlinkSync(file); if (last) fs.writeFileSync(reading(folder), last); console.log(`${folder}: ${d.out.trim().split('\n').pop()}`); process.exitCode = 1; return; }
      if (!d.ok) { fs.unlinkSync(file); if (failed(folder, 'not drawn', d.out)) return; continue; }
      // a library import (a component, icon, style or variable) unanswered; a font that never loads (to-figma's `font of …`,
      // whichever font) is the machine's, and stays a row of the reading
      if (d.out.split(/, |: |\n/).some((x) => /\(no answer/.test(x) && !/^font of /.test(x.trim()))) {
        fs.unlinkSync(file);
        if (last) { fs.writeFileSync(reading(folder), last); noteTaken(where.projectDir, 'figma', folder, contract, true); }
        unanswered.push(folder);
        console.log(`${folder}: an import went unanswered, ${last ? 'its last reading kept' : 'no reading yet'}${retry ? '; drawn again after the rest' : ''}`);
        if (!retry) process.exitCode = 1;
        continue;
      }
      // to-figma's own line, with its lookup and drawing times
      const drew = d.out.split('\n').find((l) => /keys looked up: /.test(l));
      if (drew) console.log(drew);
      const v = step(['--verify']);
      fs.unlinkSync(file);
      fs.rmSync(path.join(dir, `${folder}.drawn.json`), { force: true });
      const line = v.out.split('\n').find((l) => /against the library's own/.test(l));
      if (!line) { if (failed(folder, 'not read back', v.out)) return; continue; }
      fails = 0;
      const dt = (drew || '').match(/ in ([\d.]+)s(?: \([^)]*\))?; drawn in ([\d.]+)s/), vt = v.out.match(/timed: readback ([\d.]+)s, geometry ([\d.]+)s/);
      const times = { ...(dt && { lookup: +dt[1], draw: +dt[2] }), ...(vt && { readback: +vt[1], geometry: +vt[2] }) };
      console.log(line);
      console.log(`${folder}: ${Object.entries(times).map(([k, x]) => `${k} ${x}s`).join(', ') || 'no times said'}`);
      // (and the run's one lookup, shared by every drawing in it)
      noteTaken(where.projectDir, 'figma', folder, contract, false, { drawnFrom: from[folder], into, at: new Date().toISOString(), times: { ...times, ...(runLookup != null && { runLookup }) } });
    }
    if (retry && unanswered.length) draw(where, label, into, unanswered, { retry: false, run, looked, settings, runLookup });
  } finally {
    for (const { file } of todo) fs.rmSync(file, { force: true });
    if (lookedHere) fs.rmSync(lookedHere, { force: true });
  }
}


/* What each Figma reading is drawn from, per component: its stored figma.json (the geometry rows' side, and the
   arrangement to-figma draws to), the whole stored snapshot (`store`), the snapshot walk's VERSION (the reading's reader) and the drawing's code (to-figma.mjs
   and geometry.mjs, with what they import). { folder: { spec, store, walk, code } }, each a hash or the version. */
export function figmaInputs(where, only = [], settings = drawSettings(), deriveOf = req('../snapshot/projects.cjs').deriveOptionsFor(where.paths.components)) {
  const sha = (x) => createHash('sha1').update(x).digest('hex');
  const tools = path.join(HERE, '..'), h = createHash('sha1');
  for (const f of importClosure([path.join(HERE, 'to-figma.mjs'), path.join(HERE, 'geometry.mjs')])) h.update(path.relative(tools, f)).update('\0').update(fs.readFileSync(f)).update('\0');
  const code = h.digest('hex');
  let walk = 'none'; try { walk = (fs.readFileSync(path.join(HERE, '..', '..', 'plugins', 'design-system-snapshot', 'code.js'), 'utf8').match(/const VERSION = '([^']+)'/) || [])[1] || 'none'; } catch { /* no walk: said none */ }
  const spec = (folder) => { try { return sha(fs.readFileSync(path.join(where.paths.components, folder, 'figma.json'))); } catch { return 'none'; } };
  const folders = contracts(where).map(({ folder }) => folder);
  // (and the whole store the drawing and its geometry read: the tokens (knownOf, styles, variables), the index, and every
  // component's figma.json (knownOf's fields, the keys a placed instance is drawn from); no fingerprint of its own)
  const s = createHash('sha1'), add = (name, f) => { s.update(name).update('\0'); try { s.update(fs.readFileSync(f)); } catch { s.update('none'); } s.update('\0'); };
  add('tokens', where.paths.tokens || ''); add('index', where.paths.index || '');
  let all = []; try { all = fs.readdirSync(where.paths.components).sort(); } catch { /* no store */ }
  for (const f of all) add(f, path.join(where.paths.components, f, 'figma.json'));
  const store = s.digest('hex');
  // (and the project's settings the drawing takes, to-figma's drawSettings, with the state axis and pointer states its
  // read-back is derived under, its own library's (deriveOptionsFor, as to-figma --verify derives it); its mode axes
  // come from the tokens, in the store's hash)
  const set = (f) => { const o = deriveOf(f) || {}; return sha(JSON.stringify([settings, o.stateAxis ?? null, o.pointerStates ?? null])); };
  return Object.fromEntries(folders.filter((f) => !only.length || only.includes(f)).map((f) => [f, { spec: spec(f), store, walk, code, settings: set(f) }]));
}

/* The reader's own code: every file a self reading runs through (from-code.mjs and what it imports), but to-markup's and
   to-code's, whose output selfInputs hashes instead (each component's markup, sheet, mapping, parts and props, and what every
   page shares: the base sheet, the DOM helper, the pointer states), so a change to either moves only the components
   whose markup or sheet it changes, and a change to a tool the reading never runs (the editor, a test) moves none. */
function readerCode() {
  const tools = path.join(HERE, '..'), h = createHash('sha1');
  const skip = new Set(['to-markup.mjs', 'to-code.mjs'].map((f) => path.join(HERE, f)));
  for (const f of importClosure([path.join(HERE, 'from-code.mjs')], skip)) h.update(path.relative(tools, f)).update('\0').update(fs.readFileSync(f)).update('\0');
  return h.digest('hex');
}

/* What a reading takes of one component's drawing. */
export const drawingInputs = ({ markup, sheet, mapping, parts }) => [markup, sheet, JSON.stringify(mapping), JSON.stringify(parts)];

/* What each component's self reading is read from, as one hash per component: it and every component it places,
   transitively (each one's contract, spec, markup, sheet, parity mapping, parts' selectors and props as stories give
   them), the base sheet,
   the tokens and their values, the project's parity settings, and the reader's own code. Two readings from the same
   inputs are the same reading (--twice holds the leg to that), so --changed reads only the components whose hash moved. */
export async function selfInputs(label, where, only = []) {
  const { loadParity } = await import('../parity/project.mjs');
  const project = await loadParity(label, { self: true });
  const { propsOf, DOM } = await import('./to-markup.mjs');
  const { BASE, pseudoClasses, entryOf } = await import('./to-code.mjs');
  const { drawnAll } = await import('./site.mjs');
  const store = req('../snapshot/store.cjs');
  const library = Object.fromEntries(contracts(where).map(({ folder, contract }) => [contract.component, { ...contract, folder }]));
  const byFolder = Object.fromEntries(Object.values(library).map((c) => [c.folder, c]));
  const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
  const hash = (xs) => createHash('sha1').update(xs.join('\0')).digest('hex');
  const own = {}, unscoped = [], mains = req('./derive.cjs').byComponentName(Object.values(library)), settingsOf = req('../snapshot/projects.cjs').librarySettingsFor(project.paths.components);
  // only what the components asked for place, transitively (every sheet is still made: one unscoped reaches them all)
  const need = only.length ? closureOf(library, only) : new Set(Object.keys(byFolder));
  const drawn = drawnAll(library, { settingsOf });
  for (const c of Object.values(library)) {
    const { sheet } = drawn[c.folder];
    // every sheet is on the one page: one whose rules reach past its own element reaches every reading
    if (!scopedTo(sheet, `ds-${c.folder}`)) unscoped.push(sheet);
    if (!need.has(c.folder)) continue;
    let spec = ''; try { spec = JSON.stringify(store.readSpec(project.paths.components, c.folder, { compact: true })); } catch { /* none: its hash says so */ }
    own[c.folder] = hash([JSON.stringify(c), spec, ...drawingInputs(drawn[c.folder]), JSON.stringify(propsOf(c, library)), JSON.stringify(entryOf(c) || null)]);
  }
  // what every reading shares: the reader's code and the house settings it reads (standards/audit-settings.json: the
  // pointer states, the pseudo-classes), the base sheet, an unscoped sheet, the tokens and the project's settings, every
  // contract (a token named by a raw value breaks its ties by the whole library's use, from-code usageIn), and the
  // browser and system the page is measured in (its fallback font)
  const chrome = chromeVersion();
  // (and the fonts installed here: a family the tokens name, once installed, is measured in place of the fallback)
  const fonts = fontsInstalled();
  const shared = hash([readerCode(), read(path.join(HERE, '..', '..', 'standards', 'audit-settings.json')), read(path.join(HERE, '..', '..', 'standards', 'naming-preferences.json')), BASE, DOM, JSON.stringify(pseudoClasses()), fonts, ...unscoped, where.paths.styles ? read(path.join(where.paths.styles, '_tokens.scss')) : '', JSON.stringify(project.parity), JSON.stringify(project.snapshot || null), JSON.stringify(project.lib || null), JSON.stringify(Object.values(library)), chrome, `${process.platform} ${(await import('node:os')).release()}`]);
  return closureHashes(library, own, shared, only);
}

/* A second reading's inputs: the first's, and the first reading it goes round from. */
const secondKey = (inputs, first) => createHash('sha1').update(`${inputs}\0${first || ''}`).digest('hex');

/* What a reading is read from today, for measure: the installed Chrome's major, read on its own so the browser leg is
   checked by it even where the self leg's inputs cannot be computed (said, then left out). */
export async function todayOf(label, where, only = [], log = console.log) {
  const today = { chrome: chromeMajor() };
  try { today.figma = figmaInputs(where, only, drawSettings(libraryOf(label))); } catch (e) { log(`warning: the Figma leg's inputs not checked (${String(e.message).split('\n')[0]}): a reading drawn from other ones is not said stale`); }
  try { Object.assign(today, { inputs: await selfInputs(label, where, only), reader: readerCode() }); } catch (e) { log(`warning: the self leg's inputs not checked (${String(e.message).split('\n')[0]}): a reading taken from other inputs is not said stale`); }
  return today;
}

/* Whether every rule of a sheet names its element (`ds-x`), so it styles nothing outside it: its selectors, at-rules aside. */
export function scopedTo(css, root) {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of bare.matchAll(/([^{};]+)\{/g)) {
    const sel = m[1].trim();
    // a name every sheet shares (an animation's, a registered property's, a font's) is no element's: unscoped
    if (/^@(keyframes|property|font-face|counter-style)\b/.test(sel)) return false;
    if (!sel || sel.startsWith('@') || /^(from|to|\d+%)(\s*,\s*(from|to|\d+%))*$/.test(sel)) continue;
    // (each selector of the list: commas inside :is(), :where() and :has() are theirs)
    const list = []; let depth = 0, at = 0;
    for (let i = 0; i < sel.length; i++) { const ch = sel[i]; if (ch === '(') depth++; else if (ch === ')') depth--; else if (ch === ',' && !depth) { list.push(sel.slice(at, i)); at = i + 1; } }
    list.push(sel.slice(at));
    if (list.some((x) => !new RegExp(`(^|[^\\w-])${root}(?![\\w-])`).test(x))) return false;
  }
  return true;
}

/* Each component's hash with every component it places, transitively (a component a contract names anywhere, placed or
   swapped to, that the library holds; `library` by component name, each with its folder), over each one's own hash and
   what all share: so a change to one moves it and what places it, nothing else. */
export function closureHashes(library, own, shared, only = []) {
  const byFolder = Object.fromEntries(Object.values(library).map((c) => [c.folder, c]));
  const hash = (xs) => createHash('sha1').update(xs.join('\0')).digest('hex');
  return Object.fromEntries(Object.keys(byFolder).filter((f) => !only.length || only.includes(f)).map((f) => [f, hash([shared, ...[...closureOf(library, [f])].sort().map((g) => `${g}:${own[g]}`)])]));
}

/* contract → to-markup and to-code → Chrome → from-code's walk → contract, per component (from-code --self), `jobs` at a
   time (each its own browser), stopping after three failures in a row. Each reading is noted with the hash of what it
   was read from (selfInputs); `changed` reads only the components whose hash moved since their last reading (the second
   trip: since the first reading it goes round from, too). */
async function readSelf(where, label, only, second = false, { changed = false, jobs = 1 } = {}) {
  const inputs = await selfInputs(label, where, only);
  const firstOf = (folder) => read1(path.join(where.projectDir, 'round-trip', 'self', 'from-code', `${folder}.json`));
  const read1 = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
  const keyOf = (folder) => (second ? secondKey(inputs[folder], firstOf(folder)) : inputs[folder]);
  const reader = readerCode(), chrome = chromeMajor();
  const seen = (folder) => ({ inputs: keyOf(folder), reader, chrome });
  const taken = readTaken(where.projectDir)[second ? 'second' : 'self'] || {};
  const todo = [];
  for (const { folder, contract } of contracts(where)) {
    if (only.length && !only.includes(folder)) continue;
    const file = path.join(where.projectDir, 'round-trip', second ? 'self2' : 'self', 'from-code', `${folder}.json`);
    if (changed && taken[folder] && taken[folder].inputs === keyOf(folder) && fs.existsSync(file)) { console.log(`${folder}: unchanged since its last reading`); continue; }
    todo.push({ folder, contract });
  }
  let fails = 0, stopped = false;
  const one = ({ folder, contract }) => new Promise((done) => {
    execFile('node', [path.join(HERE, 'from-code.mjs'), '--project', label, folder, second ? '--second' : '--self'], { encoding: 'utf8', maxBuffer: 64 << 20 }, (e, stdout, stderr) => {
      const ok = !e, out = ok ? stdout : `${stdout || ''}${stderr || ''}`;
      // its own summary line, else the last line that is not a stack frame (what went wrong)
      const lines = out.trim().split('\n').reverse(), last = lines.find((l) => l.startsWith(`${folder}:`)) || lines.find((l) => !/^\s+at /.test(l) && /\w{3}/.test(l)) || '';
      console.log(`${folder}: ${ok ? last.split(' — ')[0] : `not read — ${last}`}`);
      if (ok) {
        fails = 0;
        if (!second) noteTaken(where.projectDir, 'self', folder, contract, false, seen(folder));
        // the second trip is fingerprinted with the first reading it went round from
        else { const f = firstOf(folder); if (f) noteTaken(where.projectDir, 'second', folder, JSON.parse(f).asFigma, false, seen(folder)); }
      } else {
        process.exitCode = 1;
        if (++fails >= 3 && !stopped) { stopped = true; console.log('three failures in a row: stopped'); }
      }
      done();
    });
  });
  // between components, with none running, the measuring lock goes to whoever waits for it and comes back (lock.mjs
  // yieldIfWanted): a run never keeps a slot for hours while a land or another measure queues
  const lock = await import('../shared/lock.mjs');
  const queue = [...todo];
  let running = 0, pausing = null;
  const pause = () => pausing || (pausing = (async () => {
    while (running) await new Promise((r) => setTimeout(r, 500));
    await lock.yieldIfWanted(`eval.mjs ${process.argv.slice(2).join(' ')}`, { say: (l) => console.log(l) });
    pausing = null;
  })());
  await Promise.all(Array.from({ length: Math.max(1, Math.min(jobs, queue.length)) }, async () => {
    while (queue.length && !stopped) {
      if (pausing || lock.wanted()) { await pause(); continue; }
      running++; try { await one(queue.shift()); } finally { running--; }
    }
  }));
}

/* The self leg read twice: a reading that is not the same both times is a measure that cannot be trusted. Returns the
   exit code: 1 where any differs or was not read. */
async function readTwice(where, label, only, opts) {
  const dir = path.join(where.projectDir, 'round-trip', 'self', 'from-code');
  // a reading less what every run changes (its date, its seconds; shared/output.mjs writeReport's volatile fields)
  const snap = () => Object.fromEntries(contracts(where).filter(({ folder }) => !only.length || only.includes(folder)).map(({ folder }) => { try { const { at, seconds, ...r } = JSON.parse(fs.readFileSync(path.join(dir, `${folder}.json`), 'utf8')); return [folder, JSON.stringify(r)]; } catch { return [folder, null]; } }));
  // each pass starts with no readings, so one that fails is missing, never the last pass's file compared with itself
  const clear = () => { for (const f of Object.keys(snap())) fs.rmSync(path.join(dir, `${f}.json`), { force: true }); };
  // both passes read through Chrome (no read cache, read-cache.mjs): it is Chrome's readings this holds to each other
  const was = process.env.TOOLKIT_READ_CACHE; process.env.TOOLKIT_READ_CACHE = 'off';
  let first, second;
  try {
    clear(); await readSelf(where, label, only, false, opts); first = snap();
    clear(); await readSelf(where, label, only, false, opts); second = snap();
  } finally { if (was === undefined) delete process.env.TOOLKIT_READ_CACHE; else process.env.TOOLKIT_READ_CACHE = was; }
  const differ = Object.keys(first).filter((f) => first[f] === null || second[f] === null || first[f] !== second[f]);
  for (const f of differ) console.log(`  ${f}: ${first[f] === null || second[f] === null ? 'not read' : 'read differently the second time'}`);
  console.log(`${label} self, read twice: ${Object.keys(first).length - differ.length} of ${Object.keys(first).length} the same both times`);
  return differ.length || process.exitCode ? 1 : 0;
}

/* Every project's panel measured in turn (--projects): per project each leg (--self, then --second) and then --diff, each
   its own eval.mjs process, so each measuring leg takes the lock and lets it go, and a queued bin/land gets in between. Each
   step is logged `== HH:MM <args>` before and `== rc N` after; three failures in a row (rc 2 or more) stop the run.
   run(args) → its exit code; say(line) logs. Returns 1 when any step returned 2 or more (stopped or not), else 0. */
export async function runAll(projects, legs, { run, say, jobs = 4, now = () => new Date() }) {
  const hhmm = () => now().toTimeString().slice(0, 5);
  let fails = 0, failed = false;
  for (const p of projects) {
    for (const args of [...legs.map((l) => ['--project', p, `--${l}`, '--panel', '--jobs', String(jobs)]), ['--project', p, '--panel', '--diff']]) {
      say(`== ${hhmm()} ${args.join(' ')}`);
      const rc = await run(args);
      say(`== rc ${rc}`);
      if (rc < 2) { fails = 0; continue; }
      failed = true;
      if (++fails >= 3) { say('== three failures in a row: stopped'); return 1; }
    }
  }
  say(`== done ${hhmm()}`);
  return failed ? 1 : 0;
}

export const PROJECTS_USAGE = 'usage: eval.mjs --projects <label,label…> [--legs self,second] [--jobs N] [--log <file>]\n       (--log is read from the folder run in; the steps run from the toolkit\'s root, under a lock holder\'s lock if run under one)\n       exits 2 on a usage error, an unknown label or a --log it cannot write, 1 where a step ended with rc 2 or more';
/* --projects' options checked before any step runs: every label a project (labelError(p) → why not, or nothing), the
   legs known, jobs a whole number, the log made absolute against cwd. { error } or { projects, legs, jobs, log }. */
export function projectsOptions({ projects, legs, jobs, log, rest = [] }, { cwd, labelError }) {
  const ps = (projects || '').split(',').filter(Boolean), ls = (legs || 'self,second').split(',').filter(Boolean);
  if (rest.length || !ps.length || !ls.length || ls.some((l) => !['self', 'second'].includes(l)) || (jobs != null && !/^[1-9]\d*$/.test(jobs))) return { error: PROJECTS_USAGE };
  const bad = ps.map((p) => labelError(p)).filter(Boolean);
  if (bad.length) return { error: bad.join('\n') };
  return { projects: ps, legs: ls, jobs: +(jobs || 4), log: log ? path.resolve(cwd, log) : null };
}
/* A step's run(args) → its exit code: this eval.mjs from the toolkit's root, its output to the log (fd) or the terminal,
   and the caller's environment unchanged, TOOLKIT_LOCK_HELD included: under a holder the steps stay under its lock
   (stripped, the first step would wait on it for ever); a plain run has none, so each measuring leg takes the lock and
   lets it go. spawn is spawnSync but in the tests. */
export const stepRunner = (fd, spawn = spawnSync) => (args) => spawn(process.execPath, [fileURLToPath(import.meta.url), ...args], { cwd: path.resolve(HERE, '../..'), stdio: ['ignore', fd ?? 'inherit', fd ?? 'inherit'] }).status ?? 2;
/* The log opened to append, or why not: { fd } | { error }. */
/* What the mutation run's exit says (mutate.mjs): 0 passed; 1 under --check the floor failed; anything else, 1 without
   --check, 2 (a crash) or no status at all, an error that stops the run. */
export const mutateVerdict = (rc, check) => (rc === 0 ? null : rc === 1 && check ? 'floor' : 'error');
export const openLog = (file) => { try { return { fd: fs.openSync(file, 'a') }; } catch (e) { return { error: `cannot write the log ${file}: ${e.code || e.message}` }; } };

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const flag = (k) => { const i = argv.indexOf(k); if (i >= 0) argv.splice(i, 1); return i >= 0; };
  const all = opt('--projects');
  if (all && flag('--mechanisms')) {
    // read only: each project's panel, its stored readings measured as the report measures them, grouped across all
    const legs = (opt('--legs') || 'self').split(','), by = {}, stale = [], same = [], apart = [], held = [];
    for (const p of all.split(',')) {
      const w = req('../snapshot/projects.cjs').layout(null, p);
      if (w.error) { console.error(w.error); process.exit(2); }
      const panel = readPanel(w.projectDir);
      if (!panel) { console.error(`no panel at ${panelFile(w.projectDir)}: make one with --make-panel 30`); process.exit(2); }
      // an official contract derive would write otherwise is said; whether a reading's inputs moved since is not asked here
      // (todayOf hashes every drawing: minutes, too slow for a ranking), so the run says so
      const old = staleContracts(w.paths.components).filter((f) => panel.includes(f));
      if (old.length) console.log(`warning: ${p}: ${old.length} official contract(s) are not what their specs derive now: run node tools/component-contract/write.cjs ${w.paths.components}`);
      const m = measure(w, panel);
      for (const l of legs) for (const [c, x] of Object.entries(m.legs[l] || {})) if (x.rows) { by[`${p}:${c}${legs.length > 1 ? ` (${l})` : ''}`] = x.rows; if (x.stale) stale.push(`${p}:${c}`); if (isSame(x)) same.push(`${p}:${c}`); if (isSameApartFromForeign(x)) apart.push(`${p}:${c}`); if (isSameApartFromLibrary(x)) held.push(`${p}:${c}`); }
    }
    console.log('(readings ranked as stored: a reading whose inputs moved since is not marked here; the report says which)');
    if (stale.length) console.log(`warning: ${stale.length} stale reading(s) ranked with the rest (${stale.slice(0, 3).join(', ')}${stale.length > 3 ? ', …' : ''}): read them again for a true ranking`);
    const all2 = Object.values(by);
    console.log(`${all2.length} measured, ${same.length} the same, ${apart.length} the same apart from another library's insides, ${held.length} the same apart from what the library holds back, ${all2.reduce((a, r) => a + r.length, 0)} rows`);
    console.log('finishes components  rows  mechanism (finishes: components whose every row is this one)');
    for (const g of mechanisms(by).slice(0, +(opt('--top') || 25))) console.log(`${String(g.finishes).padStart(8)} ${String(g.components).padStart(10)} ${String(g.rows).padStart(5)}  ${g.key}\n            ${g.examples.join('\n            ')}`);
    // most components carry several mechanisms, so a single one finishes few: the components nearest the same, by how
    // many mechanisms they have left, are what an agent is briefed to finish whole
    const sum = (gs) => gs.reduce((s, g) => s + g.rows, 0);
    const near = Object.entries(by).filter(([, r]) => r.length).map(([c, r]) => [c, mechanisms({ [c]: r })]).sort((a, b) => a[1].length - b[1].length || sum(a[1]) - sum(b[1]));
    console.log('\nnearest the same (mechanisms left, rows):');
    for (const [c, gs] of near.slice(0, +(opt('--near') || 15))) console.log(`  ${c}: ${gs.length}, ${sum(gs)} — ${gs.map((g) => g.key).join('; ')}`);
    process.exit(0);
  }
  if (all) {
    // no lock here: each measuring leg is its own eval.mjs, which takes it, so it is let go between steps
    const o = projectsOptions({ projects: all, legs: opt('--legs'), jobs: opt('--jobs'), log: opt('--log'), rest: argv }, { cwd: process.cwd(), labelError: (p) => req('../snapshot/projects.cjs').layout(null, p).error });
    if (o.error) { console.error(o.error); process.exit(2); }
    const { legs, log, jobs } = o;
    const opened = log ? openLog(log) : { fd: null };
    if (opened.error) { console.error(opened.error); process.exit(2); }
    const { fd } = opened;
    const say = (l) => (fd == null ? console.log(l) : fs.writeSync(fd, l + '\n'));
    process.exit(await runAll(o.projects, legs, { run: stepRunner(fd), say, jobs }));
  }
  const label = opt('--project'), into = opt('--draw'), self = flag('--self'), keepUnchanged = flag('--keep-unchanged');
  const fields = flag('--fields'), check = flag('--check'), accept = flag('--accept'), showDiff = flag('--diff'), panel = flag('--panel'), byCause = flag('--causes'), twice = flag('--twice'), second = flag('--second');
  const makeAt = argv.indexOf('--make-panel'), makePanel = makeAt >= 0 ? argv.splice(makeAt, 2)[1] : null;
  if (makeAt >= 0 && !/^[1-9]\d*$/.test(makePanel || '')) { console.error('--make-panel takes the panel\'s size, a whole number (30)'); process.exit(2); }
  const opts = { changed: flag('--changed'), jobs: Math.max(1, +(opt('--jobs') || 1)) };
  // the comparer proven beside the headline (mutate.mjs): a sample's known changes, each leg's share caught
  const mutate = flag('--mutate') && { sample: +(opt('--sample') || 10), seed: +(opt('--seed') || 1) };
  if (mutate && !(mutate.sample > 0 && Number.isInteger(mutate.seed))) { console.error('--mutate takes --sample N (a whole number) and --seed S (an integer)'); process.exit(2); }
  if (!label) { console.error('usage: eval.mjs --project <label> [--panel] [--fields] [--causes] [--diff] [--check | --accept] [--mutate [--sample N] [--seed S]]\n       eval.mjs --project <label> --make-panel <n>\n       eval.mjs --project <label> --draw <scratch fileKey> [--keep-unchanged] [components…]\n       eval.mjs --project <label> --self [--twice] [--changed] [--jobs N] [components…]\n       eval.mjs --project <label> --second [--changed] [--jobs N] [components…]\n       eval.mjs --projects <label,label…> [--legs self,second] [--jobs N] [--log <file>]\n       eval.mjs --projects <label,label…> --mechanisms [--legs self] [--top N] [--near N]'); process.exit(2); }
  const where = req('../snapshot/projects.cjs').layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  if (makePanel) {
    // fixed once made: a panel that moved would make the trend it exists for compare other components
    if (readPanel(where.projectDir)) { console.error(`${panelFile(where.projectDir)} exists: a panel is fixed once made`); process.exit(2); }
    let index = {}; try { index = JSON.parse(fs.readFileSync(where.paths.index, 'utf8')).components || {}; } catch { /* no index: no pages */ }
    const selfDir = path.join(where.projectDir, 'round-trip', 'self', 'from-code');
    const read = (() => { try { return fs.readdirSync(selfDir).map((f) => f.replace(/\.json$/, '')); } catch { return []; } })();
    const components = pickPanel(contracts(where).map(({ folder, contract }) => ({ folder, page: (index[folder] || {}).page, hidden: (contract.component || '').split('/').some((s) => /^\s*[._]/.test(s)) })), read, Math.max(1, +makePanel || 30));
    if (!components.length) { console.error(`${label}: no components to pick from (snapshot the library first)`); process.exit(2); }
    fs.mkdirSync(path.dirname(panelFile(where.projectDir)), { recursive: true });
    fs.writeFileSync(panelFile(where.projectDir), JSON.stringify({ made: new Date().toISOString().slice(0, 10), how: 'eval.mjs --make-panel: components already read, then one per page in a fixed hash order', components }, null, 2) + '\n');
    console.log(`${label}: a panel of ${components.length} written to ${panelFile(where.projectDir)}`);
    process.exit(0);
  }
  if (panel) {
    const p = readPanel(where.projectDir);
    if (!p) { console.error(`no panel at ${panelFile(where.projectDir)}: make one with --make-panel 30`); process.exit(2); }
    argv.push(...p.filter((c) => !argv.includes(c)));
  }
  // a panel shrinks only out loud; a name typed that the library has not refuses, since a run that matched nothing
  // drew and measured nothing and still ended 0 (2026-11-23: thirty names passed as one word)
  { const { said, refused } = unknownNames(argv, contracts(where).map(({ folder }) => folder), panel ? readPanel(where.projectDir) : []);
    for (const line of said) console.log(line);
    if (refused.length) { console.error(`no such component: ${refused.join(', ')} (one folder name per argument)`); process.exit(2); } }
  // the official contracts as today's derive.cjs writes them: one written by an older derive (a change to it since, the
  // store not rewritten) holds the design side to yesterday's rules while the reading takes today's, so the long legs
  // refuse, and the short ones say so
  { const old = staleContracts(where.paths.components).filter((f) => !argv.length || argv.includes(f));
    if (old.length) { const say = `${old.length} official contract(s) are not what their specs derive now (${old.slice(0, 3).join(', ')}${old.length > 3 ? ', …' : ''}): derive.cjs changed since the store was written; run node tools/component-contract/write.cjs ${where.paths.components}`;
      if (into || self || second) { console.error(say); process.exit(2); } console.log(`warning: ${say}`); } }
  // the long legs hold the one measuring lock, niced (tools/shared/lock.mjs); from-code, run under it, does not wait
  if (into || self || second) await (await import('../shared/lock.mjs')).hold(`eval.mjs ${process.argv.slice(2).join(' ')}`);
  if (into) {
    // the bridge proved fit once the lock is held (figma-audit/probe.mjs), so no other draw is using it and a draw that
    // would fail an hour in is refused in seconds; what it could not check is said
    const { probe, world } = await import('../figma-audit/probe.mjs');
    // the library's own file draws its components from itself, so no import is asked of the bridge there
    const { libraryOf } = await import('../parity/project.mjs');
    const health = await probe(label, into, world(where, libraryOf(label).libKey === into));
    const bad = health.find((h) => !h.ok);
    if (bad) { console.log(`the bridge is not fit to draw (${bad.check}): ${bad.said}`); process.exit(1); }
    for (const h of health.filter((x) => x.skipped)) console.log(`the bridge's ${h.check} check had nothing to check: ${h.said}`);
  }
  if (into) { draw(where, label, into, argv, { keepUnchanged }); process.exit(); }
  if (self && second) { console.error('--self and --second are two runs: the first, then the second'); process.exit(2); }
  if (self && twice) { process.exit(await readTwice(where, label, argv, { jobs: opts.jobs })); }
  if (self) { await readSelf(where, label, argv, false, opts); process.exit(); }
  if (second) { await readSelf(where, label, argv, true, opts); process.exit(); }
  // what a self reading is read from today, so one read from other inputs or under another Chrome is said stale
  const today = await todayOf(label, where, panel ? argv : []);
  const m = measure(where, panel ? argv : [], today);
  report(label, m, fields, byCause);
  // (its own process: mutate.mjs imports this module, which is still running here). Under --check a kind caught under
  // mutate.mjs's floor fails the check (rc 1); a run that died, or ended with no status, fails it as an error (rc 2)
  const mutated = mutate && mutateVerdict(spawnSync(process.execPath, [path.join(HERE, 'mutate.mjs'), '--project', label, '--sample', String(mutate.sample), '--seed', String(mutate.seed), ...(check ? ['--check'] : [])], { stdio: 'inherit' }).status, check);
  if (mutated === 'error') { console.error('the mutation run failed (see above): nothing diffed, accepted or checked'); process.exit(2); }
  const file = path.join(m.home, 'round-trip', 'accepted.json');
  const now = counts(m.legs);
  const causesFile = path.join(m.home, 'round-trip', 'accepted-causes.json');
  const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
  if (showDiff) {
    const was = readJson(file), why = readJson(causesFile);
    if (!was && !accept) { console.log(`no accepted counts at ${file}: run with --accept once`); process.exit(1); }
    if (!was) console.log('no accepted counts yet: this accept is the first');
    else {
      if (!why) console.log(`no accepted causes at ${causesFile} (accepted before they were kept): counts only`);
      for (const l of diff(now, panel ? scoped(was, argv) : was, causesOf(m.legs), panel ? scoped(why, argv) : why || {})) console.log(l);
    }
  }
  if (accept) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // a panel's accept replaces its own components' counts and keeps every other's
    fs.writeFileSync(file, JSON.stringify(panel ? merged(readJson(file), now, argv) : now, null, 2) + '\n');
    fs.writeFileSync(causesFile, JSON.stringify(panel ? merged(readJson(causesFile), causesOf(m.legs), argv) : causesOf(m.legs), null, 2) + '\n');
    console.log(`accepted: ${path.relative(process.cwd(), file)}`);
  } else if (check) {
    if (!fs.existsSync(file)) { console.log(`no accepted counts at ${file}: run with --accept once`); process.exit(1); }
    // a check that measured nothing has not passed: the project reads its components first, or rules the gate out
    if (!Object.values(now).some((cs) => Object.keys(cs).length)) { console.log('nothing measured: no component has a reading from code or from Figma'); process.exit(1); }
    const was = panel ? scoped(JSON.parse(fs.readFileSync(file, 'utf8')), argv) : JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const u of unaccepted(now, was)) console.log(`  ${u}`);
    const bad = worse(now, was);
    for (const b of bad) console.log(`  rose: ${b}`);
    if (bad.length) { console.log('a count rose against the accepted one: fix what the rows say, or accept with a reason in the commit'); process.exit(1); }
    if (mutated) process.exit(1);
  }
}
