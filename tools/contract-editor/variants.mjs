/*
 * A component's variants as the editor shows and edits them: the anatomy one
 * combination of prop values draws, and a value written for that combination.
 *
 * A contract's variants are layers over its anatomy (derive.cjs): each says
 * the prop values it holds under (`when`) and what it adds, removes and sets.
 * One combination draws the anatomy, then every layer whose values all match,
 * in order (one prop's before pairs), then the combination's own remainder:
 * component-contract/layers.mjs draws it, for derive.cjs and the page alike.
 *
 * An edit made while some props are off their defaults is that combination's:
 * written to the layer that holds exactly those values (made where there is
 * none), and taken out again where it only repeats what the layers under it
 * already draw.
 */

import { variantDefaults as defaults, expand } from '../component-contract/layers.mjs';

export { defaults, expand };

// the props a person may view the component at: each option, and each on/off, with its values in order
export function choosers(contract) {
  return Object.entries((contract && contract.props) || {})
    .filter(([, p]) => p.only !== 'code' && (p.type === 'enum' || p.type === 'boolean'))
    .map(([key, p]) => ({ key, name: p.figma || key, values: p.type === 'enum' ? [...(p.values || [])] : [false, true],
      labels: p.type === 'enum' ? [...(p.figmaValues || p.values || [])] : ['Off', 'On'], default: p.default ?? (p.type === 'boolean' ? false : (p.values || [])[0]) }));
}

// compared as values, whatever order an object's keys were written in
const sorted = (x) => (Array.isArray(x) ? x.map(sorted) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sorted(x[k])])) : x);
export const same = (a, b) => JSON.stringify(sorted(a ?? null)) === JSON.stringify(sorted(b ?? null));
// two contracts' props, parts or conditions compared by key: the ones added, removed and changed. The one reading the
// page gives of a change, in a proposal (propose) and in what Figma changed under a draft (stale)
export const keyDiff = (a, b) => {
  const was = a || {}, now = b || {};
  return { added: Object.keys(now).filter((k) => !(k in was)), removed: Object.keys(was).filter((k) => !(k in now)), changed: Object.keys(now).filter((k) => k in was && !same(was[k], now[k])) };
};

const holds = (when, full) => Object.entries(when || {}).every(([k, v]) => full[k] === v);
// a layer that draws this field: one that sets it, or adds its part whole
const draws = (v, key) => (v.set && key in v.set) || (v.add && key.slice(0, key.indexOf('.')) in v.add);
// what these values draw for the field with this layer's own value for it taken out
function beneath(contract, layer, values, key) {
  const vs = ((contract && contract.variants) || []).map((v) => (v === layer && v.set && key in v.set ? { ...v, set: Object.fromEntries(Object.entries(v.set).filter(([k]) => k !== key)) } : v));
  const i = key.indexOf('.');
  return (expand({ ...contract, variants: vs }, values)[key.slice(0, i)] || {})[key.slice(i + 1)];
}

/* The values that differ from the defaults: what makes this a variant, and none for the component as it starts. A prop
   with no default is off it at any value chosen. */
export function offDefault(contract, values = {}) {
  const d = defaults(contract);
  const props = (contract && contract.props) || {};
  return Object.fromEntries(Object.entries(values).filter(([k, v]) => k in props && v !== undefined && v !== d[k]));
}

/* The layer an edit at these values is written to: the combination's own where the contract lists whole
   combinations, else the one holding exactly the values off their defaults. Null at the defaults. */
export function layerFor(contract, values = {}) {
  const off = offDefault(contract, values);
  if (!Object.keys(off).length) return null;
  const vs = (contract && contract.variants) || [];
  const full = { ...defaults(contract), ...values };
  return vs.find((v) => v.combination && Object.keys(full).every((k) => v.when[k] === full[k]))
    || vs.find((v) => !v.combination && same(Object.keys(v.when || {}).sort(), Object.keys(off).sort()) && holds(v.when, off)) || null;
}

// where a new layer for these values goes: after the layers of as many props or fewer, so it draws over them
function slot(vs, n) {
  const k = vs.findIndex((v) => !v.combination && Object.keys(v.when || {}).length > n);
  return k < 0 ? vs.filter((v) => !v.combination).length : k;
}
// the layer an edit of this key at these values goes to: the combination's own, unless a layer drawn after it there
// draws the key too, and would draw over it; null for a layer still to make
function writesTo(contract, values, key) {
  const vs = (contract && contract.variants) || [];
  const layer = layerFor(contract, values);
  if (layer && layer.combination) return layer;
  const from = layer ? vs.indexOf(layer) + 1 : slot(vs, Object.keys(offDefault(contract, values)).length);
  const full = { ...defaults(contract), ...values };
  // never one of fewer props: it holds at other values too, which the edit would change
  const n = Object.keys(offDefault(contract, values)).length;
  return vs.filter((v, i) => i >= from && !v.combination && Object.keys(v.when || {}).length >= n && draws(v, key) && holds(v.when, full)).pop() || layer;
}

/*
 * A part's field written at these values: a new list of variants. The value
 * goes in the combination's layer, made after the layers of as many props or
 * fewer, so it draws over them; a value the other layers already draw there
 * is taken out instead, and a layer left saying nothing goes.
 */
export function setField(contract, values, id, field, value) {
  const off = offDefault(contract, values);
  const vs = ((contract && contract.variants) || []).map((v) => ({ ...v, ...(v.set ? { set: { ...v.set } } : {}) }));
  const c = { ...contract, variants: vs };
  const key = `${id}.${field}`;
  let layer = writesTo(c, values, key);
  if (!layer) {
    layer = { when: { ...off }, set: {} };
    vs.splice(slot(vs, Object.keys(off).length), 0, layer);
  }
  // a layer of fewer props drawn after it that draws the field too would hide the edit: the field alone goes in a layer
  // of the same values after that one, and no layer moves, so nothing else it draws changes
  const over = vs.filter((v, i) => i > vs.indexOf(layer) && !v.combination && v !== layer && Object.keys(v.when || {}).length < Object.keys(layer.when || {}).length
    && draws(v, key) && holds(v.when, { ...defaults(c), ...values })).pop();
  if (over && !layer.combination) {
    if (layer.set) { delete layer.set[key]; if (!Object.keys(layer.set).length) delete layer.set; }
    layer = { when: { ...layer.when }, set: {} };
    vs.splice(vs.indexOf(over) + 1, 0, layer);
  }
  const under = beneath(c, layer, values, key);
  layer.set = { ...(layer.set || {}) };
  if (same(value, under)) delete layer.set[key]; else layer.set[key] = value ?? null;
  if (!Object.keys(layer.set).length) delete layer.set;
  return vs.filter((v) => v.set || v.add || v.remove || v.combination);
}

/* Whether a field differs at these values from the component's defaults, and whether the combination's own
   layer is what changes it (so it can be reset there), or a layer of fewer props. */
export function changed(contract, values, id, field) {
  const here = (expand(contract, values)[id] || {})[field];
  const base = (expand(contract, {})[id] || {})[field];
  if (same(here, base)) return null;
  const layer = writesTo(contract, values, `${id}.${field}`);
  const own = !!(layer && layer.set && `${id}.${field}` in layer.set);
  const by = own ? layer.when : ((contract.variants || []).filter((v) => !v.combination && draws(v, `${id}.${field}`) && holds(v.when, { ...defaults(contract), ...values })).pop() || {}).when || null;
  return { own, by };
}

/* A field put back, at these values, to what the layers draw without the combination's own value for it. */
export function unset(contract, values, id, field) {
  const key = `${id}.${field}`;
  return setField(contract, values, id, field, beneath(contract, writesTo(contract, values, key), values, key));
}

// the props a variant is chosen by: every option, and an on/off that is an axis or that some layer names
export function variantKeys(contract) {
  const used = new Set(((contract && contract.variants) || []).flatMap((v) => Object.keys(v.when || {})));
  return choosers(contract).filter((x) => contract.props[x.key].type === 'enum' || contract.props[x.key].axis || used.has(x.key)).map((x) => x.key);
}
/* the default combination: every variant prop at its default, which no layer of values off them names. An on/off
   that is no variant, an instance or a code-only prop is left out, so the part stays gone whatever they are set to;
   so is a prop with no default, which expand() never has a value for. */
const atDefaults = (contract) => { const d = defaults(contract); return Object.fromEntries(variantKeys(contract).filter((k) => k in d).map((k) => [k, d[k]])); };
/* the layer that takes parts out at these values: the combination's own, or at the defaults the whole combination
   expand() draws there, whichever props it names (a prop made a variant since leaves it as it was) */
function removing(contract, values) {
  if (Object.keys(offDefault(contract, values)).length) return layerFor(contract, values);
  const d = defaults(contract);
  return ((contract && contract.variants) || []).find((v) => v.combination && holds(v.when, d)) || null;
}

/* A part taken out at these values, with the parts inside it: written to the combination's own layer (made where there
   is none), what it sets or adds inside the part kept, so Put back brings it back whole; a part that layer adds is no
   longer added instead, with what it set on it. At the defaults it is
   the default combination alone, a layer naming every prop at its default, drawn last as whole combinations are. */
export function removeAt(contract, values, id) {
  const off = offDefault(contract, values);
  const vs = ((contract && contract.variants) || []).map((v) => ({ ...v }));
  const under = (k) => k === id || k.startsWith(id + '/');
  const i = ((contract && contract.variants) || []).indexOf(removing(contract, values));
  let layer = i < 0 ? null : vs[i];
  if (!layer && !Object.keys(off).length) { layer = { when: atDefaults(contract), combination: true }; vs.push(layer); }
  if (!layer) { layer = { when: { ...off } }; vs.splice(slot(vs, Object.keys(off).length), 0, layer); }
  if (!(layer.add && id in layer.add)) layer.remove = [...(layer.remove || []).filter((k) => k !== id), id];
  else {
    layer.add = Object.fromEntries(Object.entries(layer.add).filter(([k]) => !under(k)));
    if (layer.set) layer.set = Object.fromEntries(Object.entries(layer.set).filter(([k]) => !under(k.slice(0, k.lastIndexOf('.')))));
  }
  for (const f of ['set', 'add']) if (layer[f] && !Object.keys(layer[f]).length) delete layer[f];
  if (layer.remove && !layer.remove.length) delete layer.remove;
  return vs.filter((v) => v.set || v.add || v.remove || v.combination);
}

/* A part these values' own layer removes, put back; null where another layer removes it, which is changed there. */
export function restoreAt(contract, values, id) {
  const layer = removing(contract, values);
  if (!layer || !(layer.remove || []).includes(id)) return null;
  const { remove, ...rest } = layer;
  const left = remove.filter((k) => k !== id);
  const now = left.length ? { ...rest, remove: left } : rest;
  // the layer goes once it says nothing, a whole combination made for a removal too
  const empty = !now.set && !now.add && !now.remove;
  return ((contract && contract.variants) || []).flatMap((v) => (v !== layer ? [v] : empty ? [] : [now]));
}

/* A part moved among the parts beside it at these values: the positions they hold dealt out again in the new order,
   each written where it changes, so a move back leaves nothing behind. Null for a move to nowhere. */
export function moveAt(contract, values, id, to) {
  const here = expand(contract, values);
  const parent = (here[id] || {}).parent;
  const sibs = Object.keys(here).filter((k) => here[k].parent === parent).sort((a, b) => (here[a].order ?? 0) - (here[b].order ?? 0));
  const from = sibs.indexOf(id);
  if (from < 0 || to < 0 || to >= sibs.length || to === from) return null;
  // the positions as they are, or one each where two share one
  const held = sibs.map((k) => here[k].order ?? 0);
  const at = new Set(held).size === held.length ? held : sibs.map((_, n) => n);
  sibs.splice(to, 0, ...sibs.splice(from, 1));
  return sibs.reduce((vs, k, n) => ((here[k].order ?? 0) === at[n] ? vs : setField({ ...contract, variants: vs }, values, k, 'order', at[n])), (contract && contract.variants) || []);
}

/*
 * The grid's marks: a cell marked is one where its values change each other,
 * so it draws something none of them draws alone; beside it, the cell's
 * changes split the same way.
 */
// what a combination changes from the defaults, by the keys the changes beside the grid carry (data-keys):
// add:id, remove:id, set:id.field; the same comparison those changes are made by
function changes(base, here) {
  const keys = new Map();
  for (const id of Object.keys(here)) {
    if (!base[id]) { keys.set(`add:${id}`, true); continue; }
    for (const f of new Set([...Object.keys(base[id]), ...Object.keys(here[id])])) if (!same(base[id][f], here[id][f])) keys.set(`set:${id}.${f}`, here[id][f]);
  }
  for (const id of Object.keys(base)) if (!here[id]) keys.set(`remove:${id}`, true);
  return keys;
}

// the changes a combination makes only with its values together: none of its values, off its default alone, makes it so.
// Each value alone drawn once, as every cell asks the same few
export function crossings(now) {
  const base = expand(now);
  const alone = new Map();
  const of = (k, v) => { const id = `${k}=${JSON.stringify(v)}`; if (!alone.has(id)) alone.set(id, changes(base, expand(now, { [k]: v }))); return alone.get(id); };
  return (m) => {
    const ones = Object.entries(offDefault(now, m)).map(([k, v]) => of(k, v));
    return new Set([...changes(base, expand(now, m))].filter(([key, x]) => !ones.some((o) => o.has(key) && same(o.get(key), x))).map(([key]) => key));
  };
}
