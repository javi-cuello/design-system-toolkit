/*
 * The props half of a component contract, as the editor builds it: the blocks
 * it offers, the contract it writes, the problems it reports and what the
 * props cost to build. Pure, so the page and its test share one copy.
 *
 * A prop in the editor is a draft: { uid, name, type, values, default, axis,
 * only, role, pointer }. `name` is what people read (Figma's sentence-case
 * name); the contract's key is its camel case and its enum values kebab case,
 * the same spelling derive.cjs gives a stored spec (test-props.mjs holds the
 * two to it). Three fields the derived contract does not carry, because a
 * drawing already shows them: `axis`, a boolean drawn as a False/True variant
 * rather than a boolean property; `only`, a prop one side has and the
 * other does not; and `figmaValues`, an enum's options as Figma spells them.
 */

import { toAnatomy, KINDS } from './anatomy.mjs';

export const TYPES = ['enum', 'boolean', 'string', 'number', 'event', 'instance', 'slot'];
/* Kinds Figma has no property for: a number (a maximum length, a count) and an event (a click, a change) live in code alone. */
export const CODE_ONLY = new Set(['number', 'event']);
export const ONLY = ['both', 'figma', 'code'];

// the words a contract's ids and names are made of, and its interaction states: component-contract's, one way each
import { camel, kebab, interactionStates } from '../component-contract/layers.mjs';
export { camel, kebab, interactionStates };

let next = 0;
export const draft = (fields) => ({ name: '', type: 'string', values: [], default: null, axis: false, only: 'both', ...fields, uid: 'p' + (++next) });

/*
 * The palette: the kinds a prop can be, each starting with no name, so a new
 * prop is named for what it is rather than renamed from a guess. Five have a
 * Figma property and code's counterpart; a number and an event are code's
 * alone, as Figma has no property for either (Curtis, "Code only props in
 * Figma"); interaction states are Figma's alone, drawn as variants that code
 * takes from pseudo-classes. Each says which side it is on, and the palette
 * shows the three sides apart.
 * A library's own named props (its Disabled, its Size) are libraryBlocks().
 */
export const SIDES = [['both', 'Figma and code'], ['code', 'Code only'], ['figma', 'Figma only']];
export function blocks(s = {}) {
  const { pointer, states } = interactionStates(s);
  return withKind([
    { id: 'enum', group: 'Kinds', side: 'both', label: 'Options', hint: 'One of a list',
      make: () => draft({ type: 'enum', values: [], default: null }) },
    { id: 'boolean', group: 'Kinds', side: 'both', label: 'On / off', hint: 'True or false',
      make: () => draft({ type: 'boolean', default: false }) },
    { id: 'string', group: 'Kinds', side: 'both', label: 'Text', hint: 'A string',
      make: () => draft({ type: 'string', default: '' }) },
    { id: 'number', group: 'Kinds', side: 'code', label: 'Number', hint: 'A count or a limit; code only',
      make: () => draft({ type: 'number', default: null, only: 'code' }) },
    { id: 'event', group: 'Kinds', side: 'code', label: 'Event', hint: 'Something the component tells its caller; code only',
      make: () => draft({ type: 'event', only: 'code' }) },
    { id: 'instance', group: 'Kinds', side: 'both', label: 'Swap', hint: 'Another component in its place',
      make: () => draft({ type: 'instance', default: null }) },
    { id: 'slot', group: 'Kinds', side: 'both', label: 'Slot', hint: 'Content the caller supplies',
      make: () => draft({ type: 'slot' }) },
    // Figma draws each state as a variant; code takes them from pseudo-classes, so they are Figma's alone (code-standard rule 9)
    { id: 'state', group: 'Kinds', side: 'figma', label: 'Interaction states', hint: 'Rest and the pointer states; code uses :hover, :focus and :active',
      make: () => draft({ type: 'enum', values: [...states], default: states[0], only: 'figma', role: 'interaction', pointer: [...pointer] }) },
  ]);
}

/* Each made prop remembers the block it came from, which is what its Kind menu shows. */
const withKind = (list) => list.map((b) => ({ ...b, make: () => ({ ...b.make(), kind: b.id }) }));

/* What a prop's Kind menu shows: its block, else its type (a State axis by its role). */
export const kindOf = (d) => (d.role === 'interaction' ? 'state' : TYPES.includes(d.type) ? d.type : 'string');

/*
 * A prop turned into another kind from its Kind menu. A plain kind keeps what
 * still fits (the name, an enum's options); State, and a library's own prop,
 * bring their whole form, options and side included, and the library's name
 * too when the prop has none yet.
 */
export function applyKind(d, block) {
  const p = block.make();
  const out = { ...d, kind: block.id, extra: {} };
  if (block.group === 'Kinds' && block.id !== 'state') {
    out.type = p.type;
    // a code-only kind is code's alone; leaving one, a prop goes back to both sides
    if (CODE_ONLY.has(p.type)) out.only = 'code';
    else if (CODE_ONLY.has(d.type)) out.only = 'both';
    if (p.type === 'enum' && !d.values.length) { out.values = p.values; out.default = p.default; }
    else if (p.type === 'enum') out.default = d.values.includes(d.default) ? d.default : d.values[0];
    else if (p.type === 'boolean') out.default = !!d.default;
    else out.default = null;
    if (p.type !== 'boolean') out.axis = false;
    delete out.role; delete out.pointer;
    return out;
  }
  Object.assign(out, { type: p.type, values: p.values, default: p.default, axis: p.axis, only: p.only, role: p.role, pointer: p.pointer });
  if (!out.role) { delete out.role; delete out.pointer; }
  if (!d.name.trim()) out.name = p.name;
  return out;
}

/*
 * The props a library already uses, as blocks: each name two or more of its
 * contracts share, in the form most of them give it, most-used first. A new
 * component then starts from the library's own words rather than the house's.
 */
export function libraryBlocks(contracts) {
  const seen = new Map();
  for (const c of contracts) for (const [key, p] of Object.entries((c && c.props) || {})) {
    const name = p.figma || key;
    const form = JSON.stringify([p.type, p.values || null, p.only || null, p.role || null, !!p.axis]);
    const e = seen.get(name) || { name, uses: [], forms: new Map() };
    e.uses.push(c.component);
    const f = e.forms.get(form) || { p, n: 0 };
    f.n++;
    e.forms.set(form, f);
    seen.set(name, e);
  }
  return [...seen.values()].filter((e) => e.uses.length > 1)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => {
      const { p } = [...e.forms.values()].sort((a, b) => b.n - a.n)[0];
      return { id: 'lib-' + kebab(e.name), group: 'From the library', label: e.name, hint: `${e.uses.length} components`,
        // a block is the prop's form, not one component's wiring of it
        make: () => { const d = fromContract({ props: { [camel(e.name)]: { ...p, figma: e.name } } }).drafts[0]; d.extra = {}; return d; } };
    });
}

/*
 * The props the library's components have alongside the ones on the page: a
 * prop is offered when at least two components, and over half of those with a
 * prop on the page, have it too. Each says which prop it goes with and how often.
 */
export function suggest(contracts, names, most = 3) {
  const have = new Set(names);
  const sets = contracts.map((c) => new Set(Object.entries((c && c.props) || {}).map(([k, p]) => p.figma || k)));
  const best = new Map();
  for (const because of have) {
    const withIt = sets.filter((s) => s.has(because));
    const counts = new Map();
    for (const s of withIt) for (const name of s) if (!have.has(name)) counts.set(name, (counts.get(name) || 0) + 1);
    for (const [name, n] of counts) {
      if (n < 2 || n * 2 <= withIt.length) continue;
      const was = best.get(name);
      if (!was || n / withIt.length > was.n / was.of) best.set(name, { name, because, n, of: withIt.length });
    }
  }
  return [...best.values()].sort((a, b) => b.n / b.of - a.n / a.of || b.n - a.n).slice(0, most);
}

/* The fields the editor writes itself; anything else a prop or a contract carries is kept as it came. */
const OWN = new Set(['type', 'values', 'default', 'figmaValues', 'axis', 'role', 'pointer', 'figma', 'only']);
const TOP = new Set(['contract', 'component', 'props']);

/*
 * The contract's props: order is the list's, which is the order Figma's panel
 * and the code's docs show. `base` is the contract the props were opened from:
 * its anatomy, variants and the like ride along untouched until the editor
 * has them, so opening a derived contract and saving it loses nothing.
 */
export function toContract(component, drafts, base = {}, parts = null) {
  const { anatomy, links, inner, read, renamed } = parts ? toAnatomy(parts, drafts) : { anatomy: null, links: {}, inner: { shows: new Set(), sets: new Set(), swaps: new Set() }, read: new Set(), renamed: (t) => t };
  const props = {};
  for (const d of drafts) {
    const p = { type: d.type, ...(d.extra || {}) };
    if (d.type === 'enum') {
      p.values = d.values.map(kebab);
      if (d.default != null) p.default = kebab(d.default);
      // Figma's spelling of each option, which the kebab-case values lose ("Extra large") or the house's sentence case
      // would change ("lg"), as derive.cjs keeps it
      if (d.only !== 'code') p.figmaValues = d.values.map((v) => v.trim());
    }
    else if (d.type === 'boolean') p.default = !!d.default;
    else if (d.type === 'string' && d.default) p.default = d.default;
    else if (d.type === 'number' && d.default != null && d.default !== '') p.default = Number(d.default);
    else if (d.type === 'instance' && d.default) p.default = d.default;
    if (d.type === 'boolean' && d.axis && d.only !== 'code') p.axis = true;
    if (d.type === 'enum' && d.role) { p.role = d.role; p.pointer = (d.pointer || []).map(kebab).filter((v) => p.values.includes(v)); }
    const only = CODE_ONLY.has(d.type) ? 'code' : d.only;
    if (only !== 'code') p.figma = d.name.trim();
    if (only !== 'both') p.only = only;
    // the parts' links, and the contract's own where the editor has no say: a layer a variant adds (not in this
    // anatomy), one inside an instance, or a part whose link the editor has not touched
    for (const f of ['shows', 'sets', 'swaps']) {
      const linked = (links[camel(d.name)] || {})[f] || [];
      // a stored link follows its part through a rename or a move
      const stored = [...new Set((p[f] || []).map(renamed))];
      // in the order stored, then what the editor links anew
      // a stored id that was a part read here, and is no longer in the anatomy, was renamed or removed: it goes
      const all = [...stored.filter((t) => linked.includes(t) || !anatomy || (t in anatomy && inner[f].has(t)) || (!(t in anatomy) && !read.has(t))), ...linked.filter((t) => !stored.includes(t))];
      if (all.length) p[f] = all; else if (parts) delete p[f];
    }
    props[camel(d.name)] = p;
  }
  const rest = Object.fromEntries(Object.entries(base).filter(([k]) => !TOP.has(k)));
  // a renamed prop, and a renamed or moved part, carried through what names them; a combination, a variant
  // layer or a condition that names a prop no longer here describes nothing, and goes
  const key = new Map(drafts.filter((d) => d.was && d.was !== camel(d.name)).map((d) => [d.was, camel(d.name)]));
  const rekey = (w) => Object.fromEntries(Object.entries(w || {}).map(([k, v]) => [key.get(k) || k, v]));
  const known = (when) => Object.keys(when || {}).every((k) => k in props);
  const field = (k) => { const i = k.lastIndexOf('.'); return renamed(k.slice(0, i)) + k.slice(i); };
  if (Array.isArray(rest.invalid)) rest.invalid = rest.invalid.map(rekey).filter(known);
  if (Array.isArray(rest.variants)) rest.variants = rest.variants.map((v) => ({ ...v, when: rekey(v.when),
    ...(v.set ? { set: Object.fromEntries(Object.entries(v.set).map(([k, x]) => [field(k), x])) } : {}),
    ...(v.add ? { add: Object.fromEntries(Object.entries(v.add).map(([k, e]) => [renamed(k), e && e.parent ? { ...e, parent: renamed(e.parent) } : e])) } : {}),
    ...(v.remove ? { remove: v.remove.map(renamed) } : {}) })).filter((v) => known(v.when));
  if (rest.when && typeof rest.when === 'object') {
    // a part removed here takes its condition with it; one a variant adds, never a part here, keeps it
    const when = Object.fromEntries(Object.entries(rest.when).map(([at, c]) => [renamed(at), Object.fromEntries(Object.entries(rekey(c)).filter(([k]) => k in props))])
      .filter(([at, c]) => Object.keys(c).length && (!anatomy || at in anatomy || !read.has(at))));
    if (Object.keys(when).length) rest.when = when; else delete rest.when;
  }
  // a new contract says it has no variants and no invalid combinations yet; one opened keeps what it had
  return { contract: 1, component: component.trim(), props, anatomy: {}, ...(Object.keys(base).length ? {} : { variants: [], invalid: [] }), ...rest, ...(anatomy && (Object.keys(anatomy).length > 1 || JSON.stringify(anatomy.root) !== BARE) ? { anatomy } : {}) };
}

/*
 * Back from a contract. An authored one round-trips, and so does a derived
 * one: derive.cjs marks a False/True variant `axis` and keeps Figma's
 * spelling of each option (`figmaValues`). One derived before it did reads a
 * boolean as a variant where the combinations the grid leaves out (`invalid`,
 * axes only) name it.
 */
export function fromContract(c) {
  const axes = new Set(((c && c.invalid) || []).flatMap((x) => Object.keys(x || {})));
  const drafts = Object.entries((c && c.props) || {}).map(([key, p]) => draft({
    name: p.figma || key,
    type: TYPES.includes(p.type) ? p.type : 'string',
    values: [...(p.figmaValues || p.values || [])],
    default: p.figmaValues && p.values ? (p.figmaValues[p.values.indexOf(p.default)] ?? p.default ?? null) : p.default ?? null,
    axis: !!p.axis || (p.type === 'boolean' && axes.has(key)),
    only: ONLY.includes(p.only) ? p.only : 'both',
    ...(p.role ? { role: p.role, pointer: p.pointer || [] } : {}),
    extra: Object.fromEntries(Object.entries(p).filter(([k]) => !OWN.has(k))),
    // the key it was read with, so a rename follows it through what names it (variants, invalid, when)
    was: key,
  }));
  const base = Object.fromEntries(Object.entries(c || {}).filter(([k]) => !TOP.has(k)));
  return { component: (c && c.component) || '', drafts, base };
}

/* What stops the contract being written as it stands, each tied to the prop and field to fix. */
export function problems(component, drafts) {
  const out = [];
  if (!component.trim()) out.push({ uid: null, field: 'component', message: 'The component needs a name.' });
  const seen = new Map();
  for (const d of drafts) {
    const say = (field, message) => out.push({ uid: d.uid, field, message });
    if (!d.name.trim()) { say('name', 'A prop needs a name.'); continue; }
    const key = camel(d.name);
    if (seen.has(key)) say('name', `"${d.name}" and "${seen.get(key)}" are one prop in code (${key}).`);
    else seen.set(key, d.name);
    if (d.type === 'enum') {
      const vals = d.values.map(kebab);
      if (vals.length < 2) say('values', `${d.name} needs at least two options; one is not a choice.`);
      if (vals.some((v) => !v)) say('values', `${d.name} has an empty option.`);
      const dup = vals.find((v, i) => v && vals.indexOf(v) !== i);
      if (dup) say('values', `${d.name} lists "${dup}" twice.`);
      // a default is asked for once there are options to choose it from
      if (vals.length >= 2 && (d.default == null || !vals.includes(kebab(d.default)))) say('default', `${d.name}'s default is not one of its options.`);
    }
    if (d.type === 'number' && d.default != null && d.default !== '' && !Number.isFinite(Number(d.default))) say('default', `${d.name}'s default is not a number.`);
  }
  return out;
}

/*
 * What the props cost before anyone draws or codes them. Figma draws a variant
 * for every combination of its axes (each enum, and each boolean drawn as an
 * axis); the rest are component properties, and code takes every prop that is
 * not Figma's alone.
 */
export function scope(drafts) {
  const figma = drafts.filter((d) => d.only !== 'code');
  const axes = figma.filter((d) => d.type === 'enum' || (d.type === 'boolean' && d.axis));
  const variants = axes.reduce((n, d) => n * (d.type === 'enum' ? Math.max(1, d.values.length) : 2), 1);
  return {
    variants,
    axes: axes.map((d) => ({ name: d.name, count: d.type === 'enum' ? d.values.length : 2 })),
    figmaProps: figma.length - axes.length,
    codeProps: drafts.filter((d) => d.only !== 'figma').length,
    figmaOnly: drafts.filter((d) => d.only === 'figma').map((d) => d.name),
    codeOnly: drafts.filter((d) => d.only === 'code').map((d) => d.name),
  };
}

/* One prop moved from one place to another; the single function the buttons, the keys and the drag all call. */
export function move(drafts, from, to) {
  const list = drafts.slice();
  if (from < 0 || from >= list.length) return list;
  const [d] = list.splice(from, 1);
  list.splice(Math.max(0, Math.min(to, list.length)), 0, d);
  return list;
}

/*
 * What is wrong with a contract written by hand, each said with where it is
 * (`props.size.default`), before the editor reads it back. Only what the
 * editor would otherwise read wrongly or lose: a prop of no kind it knows,
 * options that are not a list of two or more, a default that is not one of
 * them, two props one name in code; a part of no kind, in a container that
 * is not there, or inside itself; words or content from a prop that is not
 * there.
 */
// the outer box of a page with no parts and nothing set: no anatomy to write
const BARE = JSON.stringify({ kind: 'container', layout: { direction: 'row' } });
// read when asked, not at load: the two modules import each other
const partKinds = () => KINDS.map(([k]) => k);
export function contractProblems(c) {
  const out = [];
  const say = (where, message) => out.push({ where, message });
  if (!c || typeof c !== 'object' || Array.isArray(c)) return [{ where: '', message: 'A contract is an object, with "props".' }];
  if (!c.props || typeof c.props !== 'object' || Array.isArray(c.props)) say('props', 'needs to be an object of props.');
  if (c.component != null && typeof c.component !== 'string') say('component', 'is a name, written as text.');
  for (const [key, p] of Object.entries(c.props || {})) {
    const at = `props.${key}`;
    if (!p || typeof p !== 'object') { say(at, 'is not a prop.'); continue; }
    if (!TYPES.includes(p.type)) say(`${at}.type`, `"${p.type}" is not a kind of prop (${TYPES.join(', ')}).`);
    if (p.type === 'enum') {
      if (!Array.isArray(p.values) || p.values.length < 2 || p.values.some((v) => typeof v !== 'string' || !v.trim())) say(`${at}.values`, 'needs two or more options, each a word.');
      else if (p.default != null && !p.values.includes(p.default)) say(`${at}.default`, `"${p.default}" is not one of its values.`);
      if (p.figmaValues && (!Array.isArray(p.figmaValues) || p.figmaValues.length !== (p.values || []).length)) say(`${at}.figmaValues`, 'needs one Figma spelling per value.');
    }
    if (p.type === 'boolean' && p.default != null && typeof p.default !== 'boolean') say(`${at}.default`, 'is true or false.');
    if (p.type === 'number' && p.default != null && typeof p.default !== 'number') say(`${at}.default`, 'is a number.');
    if (CODE_ONLY.has(p.type) && p.only !== 'code') say(`${at}.only`, `a ${p.type} exists in code only: Figma has no property for one.`);
    if (p.only != null && !['figma', 'code'].includes(p.only)) say(`${at}.only`, 'is "figma" or "code", or left out for both.');
    const k = camel(p.figma || key);
    if (p.figma != null && k !== key) say(at, `its Figma name "${p.figma}" makes "${k}" in code, not "${key}".`);
  }
  const a = c.anatomy && typeof c.anatomy === 'object' ? c.anatomy : {};
  for (const [id, e] of Object.entries(a)) {
    const at = `anatomy.${id}`;
    if (!e || typeof e !== 'object') { say(at, 'is not a part.'); continue; }
    if (!partKinds().includes(e.kind)) say(`${at}.kind`, `"${e.kind}" is not a kind of part (${partKinds().join(', ')}).`);
    if (id !== 'root' && !(e.parent in a)) say(`${at}.parent`, `"${e.parent}" is not a part.`);
    for (let p = e.parent, seen = new Set([id]); p && a[p]; p = a[p].parent) {
      if (seen.has(p)) { say(`${at}.parent`, 'sits inside itself.'); break; }
      seen.add(p);
    }
    const ref = typeof e.content === 'string' && /^\{(.+)\}$/.exec(e.content);
    if (ref && !(ref[1] in (c.props || {}))) say(`${at}.content`, `takes its words from "${ref[1]}", which is not a prop.`);
  }
  if (Object.keys(a).length && !a.root) say('anatomy.root', 'is missing: every part sits in the outer box.');
  // each variant: the props that choose it, and what it changes, each part an object
  if (c.variants != null && !Array.isArray(c.variants)) say('variants', 'is a list.');
  (Array.isArray(c.variants) ? c.variants : []).forEach((v, i) => {
    const at = `variants[${i}]`;
    if (!v || typeof v !== 'object' || Array.isArray(v)) { say(at, 'is not a variant.'); return; }
    if (!v.when || typeof v.when !== 'object' || Array.isArray(v.when)) say(`${at}.when`, 'needs the props that choose it.');
    for (const k of ['set', 'add']) if (v[k] != null && (typeof v[k] !== 'object' || Array.isArray(v[k]))) say(`${at}.${k}`, 'is an object.');
    for (const [id, e] of Object.entries(v.add && typeof v.add === 'object' ? v.add : {})) if (!e || typeof e !== 'object' || Array.isArray(e) || !partKinds().includes(e.kind)) say(`${at}.add.${id}`, 'is not a part: an object with a kind.');
    if (v.remove != null && !Array.isArray(v.remove)) say(`${at}.remove`, 'is a list.');
  });
  // a condition names a part this anatomy or a variant draws, and props by their values
  const added = new Set((Array.isArray(c.variants) ? c.variants : []).flatMap((v) => Object.keys((v && typeof v.add === 'object' && v.add) || {})));
  for (const [id, cond] of Object.entries(c.when && typeof c.when === 'object' ? c.when : {})) {
    const at = `when.${id}`;
    if (!(id in a) && !added.has(id)) say(at, 'names a part that is neither in the anatomy nor added by a variant.');
    for (const [k, vs] of Object.entries(cond || {})) {
      const p = (c.props || {})[k];
      if (!p) { say(`${at}.${k}`, `"${k}" is not a prop.`); continue; }
      const allowed = p.type === 'boolean' ? [true, false] : p.values || [];
      if (!Array.isArray(vs) || vs.some((v) => !allowed.includes(v))) say(`${at}.${k}`, `lists values ${k} does not have.`);
    }
  }
  return out;
}
