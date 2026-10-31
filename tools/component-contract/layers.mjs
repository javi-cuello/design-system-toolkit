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
  for (const id of d.remove || []) delete out[id];
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
  // one copy, every layer applied to it in turn
  const out = structuredClone((contract && contract.anatomy) || {});
  const full = { ...variantDefaults(contract), ...when };
  const vs = (contract && contract.variants) || [];
  for (const v of vs) {
    if (v.combination || v === skip) continue;
    if (Object.entries(v.when || {}).every(([k, val]) => full[k] === val)) applyTo(out, v);
  }
  const combo = vs.find((v) => v.combination && v !== skip && Object.entries(v.when || {}).every(([k, val]) => full[k] === val));
  return rooted(combo ? applyTo(out, combo) : out);
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
  const pointer = t.pointerStates || ['Focus', 'Hover', 'Press'];
  // the rest state (the axis's first option) and those a pointer sets; a state the product sets (a loading) is a prop's
  const axis = order[t.stateAxis || 'State'] || ['Rest', ...pointer];
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
