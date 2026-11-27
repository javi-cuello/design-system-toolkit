/*
 * A contract's variants drawn: the anatomy one combination of prop values
 * draws, from the layers over it. One module for every reader, Node
 * (derive.cjs, which requires it) and the contract editor's page alike, so
 * the editor never draws a variant otherwise than the contract says.
 */

/*
 * Each prop's default, as the props that choose a variant: a text prop's
 * default is the words the design shows, sample copy, never a key a variant
 * is chosen by, a setting code must match, or a story's argument. Every
 * reader of a contract's defaults asks here.
 */
export function variantDefaults(contract) {
  return Object.fromEntries(Object.entries((contract && contract.props) || {}).filter(([, p]) => 'default' in p && p.type !== 'string').map(([k, p]) => [k, p.default]));
}

// one layer over a flat anatomy, as a new one: what it removes, adds and sets
export function apply(flat, d) {
  return applyTo(structuredClone(flat), d);
}
// the same, on an anatomy that is already the caller's copy
function applyTo(out, d) {
  // a part removed takes its parts with it, here and not only in what expand() returns: left in, a later layer adding
  // the part back brought them back too, which no layer said (derive fits each layer to expand()'s output, where they
  // were gone)
  const gone = new Set(d.remove || []);
  const under = (id) => { for (let up = out[id] && out[id].parent; up; up = out[up] && out[up].parent) if (gone.has(up)) return true; return false; };
  if (gone.size) for (const id of Object.keys(out).filter((x) => gone.has(x) || under(x))) delete out[id];
  for (const [id, e] of Object.entries(d.add || {})) out[id] = structuredClone(e);
  for (const [k, v] of Object.entries(d.set || {})) {
    const i = k.indexOf('.'); const id = k.slice(0, i), f = k.slice(i + 1);
    if (!out[id]) continue;
    if (v === null) delete out[id][f]; else out[id][f] = structuredClone(v);
  }
  return out;
}

/* The anatomy one combination draws: the default, every layer whose props
   all match (one-prop layers before pairs, in the order derive() wrote them),
   then the combination's own remainder, matched on the props it names (derive's
   name every axis; the editor's default one, its variant props alone). `skip`, a layer left out: what the
   others draw without it. */
export function expand(contract, when = {}, { skip = null } = {}) {
  const full = { ...variantDefaults(contract), ...when };
  const vs = (contract && contract.variants) || [];
  const holds = (v) => v !== skip && Object.entries(v.when || {}).every(([k, val]) => full[k] === val);
  return drawLayers(contract, vs.filter((v) => !v.combination && holds(v)), vs.find((v) => v.combination && holds(v)));
}
/* The same from the layers already found to hold, in the contract's order, and the combination's own (or none): for a
   reader that finds them by an index (to-code's selfCheck, over every combination). */
export function drawLayers(contract, layers, combo) {
  // one copy, every layer applied to it in turn
  const out = structuredClone((contract && contract.anatomy) || {});
  for (const v of layers) prune(applyTo(out, v));
  return rooted(combo ? applyTo(out, combo) : out);
}

// after each layer, the parts whose parent is gone go too, so the working copy is what is drawn at every step: left
// in, a later layer putting the parent back revived them, which no layer said (derive fits each layer to what is drawn)
function prune(out) {
  const there = (id) => !out[id].parent || (out[out[id].parent] && there(out[id].parent));
  for (const id of Object.keys(out).filter((x) => !there(x))) delete out[id];
  return out;
}

// a part goes with its parent: one a layer adds inside a part another layer removes is not drawn
function rooted(flat) {
  const there = (id) => !flat[id].parent || (flat[flat[id].parent] && there(flat[id].parent));
  return Object.keys(flat).every(there) ? flat : Object.fromEntries(Object.entries(flat).filter(([id]) => there(id)));
}

/* The words a contract and a drawing share, one way each (the editor's page imports this module too):
   an id from a name (`Show icon` → `showIcon`, nothing left → `layer`), a file or class name (`Show icon` →
   `show-icon`), and a code identifier in the house's words (`selectionGroup` → `Selection group`, `size2` →
   `Size 2`; figma-standard rule 18). to-figma, from-code, derive and the editor each kept their own: one split
   a number off its word and one did not, so `icon20` drew as "Icon 20" and read back as "Icon20". */
export const camel = (s) => String(s).trim().replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^[A-Z]/, (c) => c.toLowerCase()) || 'layer';
/* Each prop's contract id, one rule for derive and the editor: its Figma name camel-cased. Two names that camel-case
   alike (a boolean `title` beside its text `↳ ✏️ title`, one community library's habit) would be one id, the second
   written over the first; the one that is not a boolean keeps the name, the boolean is `show<Name>`, and any still alike
   take a number. `list` is [{ name, flag }] (flag: a boolean that is not a variant axis), in the props' order; the ids
   come back in that order. */
export function propIds(list) {
  const c = list.map((x) => camel(x.name)), count = new Map();
  for (const x of c) count.set(x, (count.get(x) || 0) + 1);
  const used = new Set(c.filter((x) => count.get(x) === 1)), out = c.map((x) => (count.get(x) === 1 ? x : null));
  const claim = (i, want) => { let id = want, n = 2; while (used.has(id)) id = `${want}_${n++}`; used.add(id); out[i] = id; };
  list.forEach((x, i) => { if (!out[i] && !x.flag) claim(i, c[i]); });
  list.forEach((x, i) => { if (!out[i]) claim(i, `show${c[i][0].toUpperCase()}${c[i].slice(1)}`); });
  return out;
}
/* A draft's contract id among its drafts, by the rule derive names props by (layers.mjs propIds): two whose names
   camel-case alike are told apart as derive told them apart, so a contract opened and saved keeps both. */
export function propKey(drafts, d) {
  const i = drafts.findIndex((x) => x === d || (d && d.uid && x.uid === d.uid));
  if (i < 0) return camel(d.name);
  return propIds(drafts.map((x) => ({ name: x.name, flag: x.type === 'boolean' && !x.axis })))[i];
}
/* Each option's contract value, one rule for derive and the editor: its Figma spelling kebab-cased. Two that kebab
   alike (a slider's `-50` and `+50`, both `50`) would be one value; those have their signs spelled (`minus-50`,
   `plus-50`), and any still alike take a number. In the options' order. */
// a Figma property key without the id Figma appends (`Label#12:3`); a `#` of the name's own (`# of lines`) stays
/* Whether a placed instance's key allows it to be the component that carries `own`: either says no key (a local
   component, a contract authored by hand or read from code), or the two are one. The one rule for every reader that
   places a component by name: a name is a fallback, never a match the key contradicts. */
export const keyMatches = (own, key) => !own || !key || own === key;
/* The component a placed instance `e` is, in a library keyed by name: by its key where the library holds it, else by
   its name where the key does not say otherwise. (Looked up each time: a reader replaces a library's entries as it goes.) */
export function placedOf(library, e) {
  if (!library || !e || !e.component) return null;
  const keyed = e.key && Object.values(library).find((c) => c && c.figma && c.figma.key === e.key);
  if (keyed) return keyed;
  const named = library[e.component];
  return named && keyMatches(named.figma && named.figma.key, e.key) ? named : null;
}
/* The fields a glyph says nothing but its colour by (an icon's one vector): rules.mjs heldGlyph, to-figma glyph.
   Held here, as this module imports nothing (the contract editor's page loads it alone); rules.mjs re-exports it. */
export const GLYPH_WORDS = new Set(['kind', 'parent', 'name', 'order', 'background', 'fillStyle', 'opacity']);
/* A glyph that says nothing but its colour and place: GLYPH_WORDS, and its box (its size, its scale, its point) where it
   scales with its icon both ways, as derive keeps it (ownGlyph) for the icon drawn open to say as a share. The one test
   rules.mjs heldGlyph and bareGlyph, to-figma's glyph fold and from-code's designSetsColour share. */
export const GLYPH_BOX = new Set(['width', 'height', 'constraints', 'absolute']);
export const glyphOnly = (g) => !!g && g.kind === 'graphic' && Object.keys(g).every((k) => GLYPH_WORDS.has(k) || (GLYPH_BOX.has(k) && !!g.constraints && g.constraints.horizontal === 'scale' && g.constraints.vertical === 'scale'));
/* The instances of a component the library does not hold (another library's) whose insides the contract records,
   opened: each a frame of this component's own, its layers drawn as this component's, as a detached instance is
   (to-markup's detach), its kind a container marked `foreign` and its component, key and props kept on it, for the
   markup to say (data-component, data-key, data-with) and the reading to give back. Not one a prop swaps or fills
   (what the caller passes draws there), one a variant detaches or swaps for a component the library holds, nor one
   inside an instance left closed (a held component's insides are its own sheet's). And one the library holds where a
   variant swaps another library's in, its layers recorded there (a status icon of its own at the error state): opened
   in that variant alone, its set saying kind a container and `foreign`. And one inside a held instance that is not
   what that component draws there (swapped where it has no prop for it), its layers recorded: listed, its kind kept,
   to-markup's insideOf drawing it open in that part's place (never one a prop of that component swaps: passed). The contract itself where none is opened,
   else a copy, one per contract and library (to-code's caches are keyed by the contract); `foreignOpened`, the ids
   opened. The one rule for to-markup, to-code and eval. Tested by test-to-markup.mjs. */
const OPENED = new WeakMap();
export function openForeign(c, library = {}) { return openedWith(c, library).c; }
export function foreignOpened(c, library = {}) { return openedWith(c, library).opened; }
function openedWith(c, library) {
  if (!c || typeof c !== 'object') return { c, opened: new Set() };
  const lib = library || {};
  if (!OPENED.has(c)) OPENED.set(c, new WeakMap());
  const got = OPENED.get(c);
  if (!got.has(lib)) got.set(lib, opening(c, lib));
  return got.get(lib);
}
function opening(c, library) {
  const vs = (c && c.variants) || [], anatomy = (c && c.anatomy) || {};
  const all = { ...Object.assign({}, ...[...vs].reverse().map((v) => v.add || {})), ...anatomy };
  const driven = new Set(Object.values((c && c.props) || {}).flatMap((p) => [...(p.swaps || []), ...(p.slots || []), ...(p.slot ? [p.slot] : [])]));
  const held = (e) => !!placedOf(library, e);
  const opened = new Set(), inHeld = new Set();
  // (the nearest instance above a layer, if any)
  const nearOf = (id) => { for (let up = (all[id] || {}).parent; up && up !== 'root'; up = (all[up] || {}).parent) if ((all[up] || {}).kind === 'instance') return up; return null; };
  for (const id of Object.keys(all).sort((a, b) => a.split('/').length - b.split('/').length)) {
    const es = [anatomy[id], ...vs.map((v) => (v.add || {})[id])].filter(Boolean);
    if (!es.length || es.some((e) => e.kind !== 'instance' || held(e)) || driven.has(id)) continue;
    if (!Object.values(all).some((e) => e && e.parent === id)) continue;
    if (vs.some((v) => { const s = v.set || {}; return `${id}.kind` in s || (typeof s[`${id}.component`] === 'string' && held({ component: s[`${id}.component`], key: s[`${id}.key`] ?? null })); })) continue;
    const near = nearOf(id);
    if (!near || opened.has(near)) { opened.add(id); if (near && inHeld.has(near)) inHeld.add(id); continue; }
    // (inside a held instance with no instance above it, one that is not what that component draws there (a cell's icon
    // tile swapped for another library's, where the cell has no prop for it): opened in that part's place, to-markup's
    // insideOf, its kind kept, as the held component's part it stands in)
    // (the part it stands for by its name, else by its place, as derive's placedMatch takes a layer renamed in the
    // instance: the one part of its kind at its order under its parent's; none, a layer added there, which insideOf
    // draws open too)
    const H = all[near], M = held(H) && !nearOf(near) && placedOf(library, H);
    if (!M) continue;
    const A = M.anatomy || {}, rel = id.slice(near.length + 1), up = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : 'root';
    // (one a prop of the held component swaps or fills is what the instance passes it there: never opened)
    if (Object.values(M.props || {}).some((p) => [...(p.swaps || []), ...(p.slots || []), ...(p.slot ? [p.slot] : [])].includes(rel))) continue;
    const byPlace = Object.keys(A).filter((k) => k !== 'root' && (A[k].parent || 'root') === up && A[k].kind === all[id].kind && (A[k].order ?? 0) === (all[id].order ?? 0));
    const X = A[rel] || (byPlace.length === 1 ? A[byPlace[0]] : null);
    if (!X || X.kind !== 'instance' || X.component !== all[id].component) { opened.add(id); inHeld.add(id); }
  }
  // one the library holds that a variant swaps for another library's whose layers that variant records under it (a
  // status icon of its own at the error state): opened where that variant swaps it in, as a variant that detaches an
  // instance draws a frame there (to-markup's detach); the held one elsewhere
  const swappedIn = new Map();
  for (const id of Object.keys(anatomy)) {
    const e = anatomy[id];
    if (!e || e.kind !== 'instance' || !held(e) || driven.has(id)) continue;
    let closed = false;
    for (let up = e.parent; up && up !== 'root' && !closed; up = (all[up] || {}).parent) closed = (all[up] || {}).kind === 'instance' && !opened.has(up);
    if (closed) continue;
    const at = vs.filter((v) => { const s = v.set || {}; return typeof s[`${id}.component`] === 'string' && !(`${id}.kind` in s) && !held({ component: s[`${id}.component`], key: s[`${id}.key`] ?? null }) && Object.values(v.add || {}).some((x) => x && x.parent === id); });
    if (at.length) { swappedIn.set(id, new Set(at)); opened.add(id); }
  }
  if (!opened.size) return { c, opened };
  const open = (o) => Object.fromEntries(Object.entries(o).map(([id, e]) => [id, opened.has(id) && !swappedIn.has(id) && !inHeld.has(id) && e ? { ...e, kind: 'container', foreign: true } : e]));
  // (and a variant laid over an opener that swaps the held one back says it an instance again there, as expand keeps a
  // field no later variant sets; one beside it is left as the design says it)
  // (laid over: it holds wherever it does with an opener's props, as a combination narrower than that opener)
  const over = (v, o) => v !== o && Object.entries(o.when || {}).every(([k, x]) => (v.when || {})[k] === x);
  const backTo = (v, id) => { const s = v.set || {}; return typeof s[`${id}.component`] === 'string' && held({ component: s[`${id}.component`], key: s[`${id}.key`] ?? null }) && [...swappedIn.get(id)].some((o) => over(v, o)); };
  const setOpen = (v, w) => {
    const ids = [...swappedIn].filter(([, at]) => at.has(v)).map(([id]) => id), back = [...swappedIn.keys()].filter((id) => backTo(v, id) && !(`${id}.kind` in (v.set || {})));
    if (!ids.length && !back.length) return w;
    return { ...w, set: { ...w.set, ...Object.fromEntries(ids.flatMap((id) => [[`${id}.kind`, 'container'], [`${id}.foreign`, true]])), ...Object.fromEntries(back.flatMap((id) => [[`${id}.kind`, 'instance'], [`${id}.foreign`, false]])) } };
  };
  const out = { ...c, anatomy: open(anatomy), variants: vs.map((v) => setOpen(v, v.add ? { ...v, add: open(v.add) } : v)) };
  // (opened twice is opened once: a reader handed the opened contract opens nothing more)
  OPENED.set(out, new WeakMap([[library, { c: out, opened }]]));
  return { c: out, opened };
}
export const bareProp = (k) => String(k).replace(/#\d+:\d+$/, '');
export const spellValue = (v) => kebab(String(v).replace(/^\s*-/, 'minus ').replace(/\+/g, ' plus ').replace(/&/g, ' and '));
export function valueIds(list) {
  const k = list.map((v) => kebab(v)), count = (arr, x) => arr.filter((y) => y === x).length;
  const spelled = list.map((v, i) => (count(k, k[i]) > 1 ? spellValue(v) : k[i]));
  const seen = new Map();
  return spelled.map((x) => { if (count(spelled, x) === 1) return x; const n = (seen.get(x) || 0) + 1; seen.set(x, n); return n === 1 ? x : `${x}-${n}`; });
}
export const kebab = (s) => String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const sentence = (k) => { const w = String(k).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([a-zA-Z])(\d)/g, '$1 $2').toLowerCase(); return w ? w[0].toUpperCase() + w.slice(1) : w; };

/* A part's name as its id says it: content/showIconIcon is "Show icon icon", a repeat's number dropped. A part whose
   Figma name this cannot say (a repeat, a name a boolean's link was folded into) carries its own `name`. */
export const partName = (id) => String(id).split('/').pop().replace(/_\d+$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/^./, (c) => c.toUpperCase());

/* A value as a library drawn from the contract writes it (figma-standard rule 18: neutral → Neutral, a boolean
   True/False): an enum whose Figma spelling this would not give carries its own `figmaValues`. */
export const figmaWord = (v) => (typeof v === 'boolean' ? (v ? 'True' : 'False') : /^[a-z]/.test(v) ? v[0].toUpperCase() + v.slice(1) : v);

/*
 * A component's interaction states, by one rule for every reader: the state axis is the settings' `stateAxis` and,
 * of its values, the ones a browser or platform supplies are their `pointerStates` (figma-standard rule 4); derive.cjs
 * marks that axis on the contract, `role: 'interaction'` with its `pointer`. `interactionStates` reads the settings,
 * for a contract not written yet (the editor's Interaction states block); `statesOf` reads a written contract (the
 * docs site's States table), so neither guesses a state from a prop's name.
 */
export const interactionStates = (s = {}) => {
  const order = s.optionOrder || {};
  const t = s.settings || {};
  // the settings' words only (§C F): no state axis, or no options recorded for it, is no states, never the house's
  const pointer = t.pointerStates || [];
  // the rest state (the axis's first option) and those a pointer sets; a state the product sets (a loading) is a prop's
  const axis = (t.stateAxis && order[t.stateAxis]) || [];
  return { pointer, states: axis.filter((v, i) => i === 0 || pointer.includes(v)) };
};
// each state but the default (Rest), as Figma spells it: `pointer` where the browser sets it, else the product sets it through the axis
export function statesOf(contract) {
  const out = [];
  for (const p of Object.values((contract && contract.props) || {})) {
    if (p.role !== 'interaction') continue;
    const pointer = new Set(p.pointer || []);
    (p.values || []).forEach((v, i) => { if (v !== p.default) out.push({ name: (p.figmaValues || [])[i] ?? figmaWord(v), axis: p.figma, pointer: pointer.has(v) }); });
  }
  return out;
}
