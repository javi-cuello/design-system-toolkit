/*
 * The anatomy half of a component contract, as the editor builds it: the
 * parts a component is made of, each inside another, and what each prop does
 * to them. Pure, so the page and its test share one copy.
 *
 * A part in the editor is { uid, name, kind, parent, ...its look }. `parent`
 * is the uid of the part it sits in; the root, always first, has none. The
 * order of the list is the order of siblings. The contract's ids are what
 * derive.cjs gives a stored spec's layers: the camel-case names below the
 * root, joined with `/`, a repeated name numbered from its second.
 */
import { camel } from './props.mjs';
import { partName } from '../component-contract/layers.mjs';
import { declarations, holds } from '../component-contract/css.mjs';
import { figmaWeight } from '../parity/values.mjs';

export const KINDS = [
  ['container', 'Container'],
  ['text', 'Text'],
  ['instance', 'Instance'],
  ['slot', 'Slot'],
  // a shape drawn in place (a rectangle or an ellipse), or an icon's glyph: a fill, a border, corners and a size,
  // nothing laid out inside it
  ['graphic', 'Shape'],
];

let next = 0;
export const part = (fields) => ({ name: '', kind: 'container', parent: 'root', ...fields, uid: fields && fields.uid === 'root' ? 'root' : 'a' + (++next) });
const SIDES = ['top', 'end', 'bottom', 'start'];
// the kinds that hold parts, as the contract's CSS translation says them
export { holds };
export const root = () => ({ uid: 'root', name: 'root', kind: 'container', parent: null, layout: { direction: 'row' } });

/* The parts in tree order: each followed by its children, siblings in list order. */
export function tree(parts) {
  const out = [];
  const walk = (uid, depth) => {
    for (const p of parts.filter((x) => x.parent === uid)) { out.push({ part: p, depth }); walk(p.uid, depth + 1); }
  };
  const r = parts.find((p) => p.uid === 'root');
  if (r) { out.push({ part: r, depth: 0 }); walk('root', 1); }
  return out;
}

/* The containers a part may sit in: any but itself and what sits inside it. */
export function homes(parts, uid) {
  const inside = new Set([uid]);
  for (let grew = true; grew;) {
    grew = false;
    for (const p of parts) if (inside.has(p.parent) && !inside.has(p.uid)) { inside.add(p.uid); grew = true; }
  }
  return parts.filter((p) => holds(p.kind) && !inside.has(p.uid));
}

/* Each part's contract id, from its own path only, so adding a part elsewhere renames nothing. */
export function ids(parts) {
  const out = { root: 'root' };
  // a part read from a contract keeps its id there (item1, content/00) while its name is the one read with it
  const kept = (p) => (p.seg && p.name === words(p.seg) ? p.seg : null);
  const under = new Map();
  // one container's parts at a time: the ids kept first, one part each (one never moved before one moved in),
  // then every other part numbered past them, never onto one
  const name = (parent) => {
    const path = (seg) => (parent === 'root' ? seg : `${out[parent]}/${seg}`);
    const sibs = parts.filter((x) => x.parent === parent);
    const taken = new Set();
    const own = new Map();
    const stayed = (x) => x.at === path(kept(x));
    for (const x of [...sibs.filter(stayed), ...sibs.filter((x) => !stayed(x))]) {
      const k = kept(x);
      if (k && !taken.has(k)) { taken.add(k); own.set(x.uid, k); }
    }
    for (const x of sibs) if (!own.has(x.uid)) {
      const base = camel(x.name);
      for (let n = 1; ; n++) { const id = base + (n > 1 ? `_${n}` : ''); if (!taken.has(id)) { taken.add(id); own.set(x.uid, id); break; } }
    }
    return own;
  };
  for (const { part: p } of tree(parts)) {
    if (p.uid === 'root') continue;
    if (!under.has(p.parent)) under.set(p.parent, name(p.parent));
    const own = under.get(p.parent).get(p.uid);
    out[p.uid] = p.parent === 'root' ? own : `${out[p.parent]}/${own}`;
  }
  return out;
}

/*
 * The contract's anatomy, and what the props do to it: a part shown by an
 * on/off prop is in that prop's `shows`, a text part filled by a text prop in
 * its `sets`, a part swapped by a swap prop in its `swaps`. `drafts` are the
 * props, so a link follows a prop through a rename.
 */
export function toAnatomy(parts, drafts) {
  const id = ids(parts);
  const keyOf = (uid) => { const d = drafts.find((x) => x.uid === uid); return d ? camel(d.name) : null; };
  const anatomy = {};
  const links = {};
  const link = (uid, field, target) => {
    const k = keyOf(uid);
    if (!k) return;
    links[k] = links[k] || {};
    (links[k][field] = links[k][field] || []).push(target);
  };
  const order = {};
  // where a prop's stored link stands as it came: an instance's own layers, which no part names, and a part whose link
  // field the editor has not touched (two props may swap one part; a part holds one)
  const inner = { shows: new Set(), sets: new Set(), swaps: new Set() };
  for (const { part: p } of tree(parts)) {
    // what the part was read with and the editor does not set (alignment, sizes, a shadow) rides along unchanged
    const raw = p.raw && p.raw.kind === p.kind ? p.raw : null;
    const { kind: rawKind, parent: _p, order: _o, ...kept } = raw ? structuredClone(raw) : {};
    const e = { kind: raw ? rawKind : p.kind };
    if (p.parent) { e.parent = id[p.parent]; e.order = order[p.parent] = (order[p.parent] ?? -1) + 1; }
    Object.assign(e, kept);
    // the layer's name as Figma spells it, where its id cannot say it back (a repeat, a boolean's link)
    if (p.uid !== 'root' && p.name !== partName(id[p.uid])) e.name = p.name; else delete e.name;
    // a field the editor shows is written from the editor once changed there; unchanged, the contract's own value stands,
    // whatever its form (a gradient, a radius per corner, a padding per side, no auto layout at all)
    const changed = (k) => !raw || !p.read || JSON.stringify(p[k] ?? null) !== JSON.stringify(p.read[k] ?? null);
    const set = (o, k, v) => { if (v == null || v === '') delete o[k]; else o[k] = v; };
    const put = (k, field = k) => { if (changed(field)) set(e, k, p[field]); };
    put('width');
    put('height');
    put('minWidth');
    put('minHeight');
    put('position');
    put('absolute');
    put('constraints');
    put('opacity');
    if (holds(p.kind)) {
      if (changed('layout')) {
        const l = p.layout || {};
        const was = (raw && raw.layout) || {};
        e.layout = { ...was, direction: l.direction || 'row' };
        set(e.layout, 'gap', l.gap);
        // each side its own, as Figma pads: the sides left unset are none
        const pad = Object.fromEntries(SIDES.filter((k) => l.padding && l.padding[k]).map((k) => [k, l.padding[k]]));
        set(e.layout, 'padding', Object.keys(pad).length ? pad : null);
        set(e.layout, 'align', l.align);
        set(e.layout, 'crossAlign', l.crossAlign);
      }
      put('shadow');
    }
    // a box's paint: a container's, and a shape's, which is a box drawn in place
    if (holds(p.kind) || p.kind === 'graphic') {
      put('background');
      // an ellipse has no corners: kept on the part, so Rectangle again brings them back, never written
      if (p.shape === 'ellipse') set(e, 'radius', null); else put('radius');
      const border = { ...(e.border || {}) };
      if (changed('stroke')) set(border, 'color', p.stroke);
      if (changed('strokeWidth')) set(border, 'width', p.strokeWidth);
      set(e, 'border', border.color || border.width ? border : null);
    }
    if (p.kind === 'text') {
      put('typography');
      put('textAlign');
      put('color');
      // words from a prop are always its current key, so a rename follows; fixed words follow the editor once changed
      const k = p.textProp && keyOf(p.textProp);
      if (k) { e.content = `{${k}}`; link(p.textProp, 'sets', id[p.uid]); } else if (changed('text') || changed('textProp')) set(e, 'content', p.text);
    }
    if (p.kind === 'instance') {
      put('component');
      const glyph = glyphOf(p.inner);
      if (changed('color')) { if (glyph) p.inner[glyph] = { ...p.inner[glyph], background: p.color || undefined }; else set(e, 'color', p.color); }
      if (changed('with')) set(e, 'with', p.with && Object.keys(p.with).length ? { ...p.with } : null);
      if (p.swapProp && keyOf(p.swapProp)) link(p.swapProp, 'swaps', id[p.uid]);
    }
    if (p.kind === 'graphic') put('shape');
    if (p.kind === 'slot') { if (p.slotProp && keyOf(p.slotProp)) e.content = `{${keyOf(p.slotProp)}}`; else if (changed('slotProp')) delete e.content; }
    if (p.shownBy && keyOf(p.shownBy)) link(p.shownBy, 'shows', id[p.uid]);
    anatomy[id[p.uid]] = e;
    for (const [f, k] of [['shows', 'shownBy'], ['sets', 'textProp'], ['swaps', 'swapProp']]) if (raw && !changed(k)) inner[f].add(id[p.uid]);
    // an instance's own layers, as the contract was read with them: the other component's, never parts of this one
    for (const [rel, x] of Object.entries(p.inner || {})) { anatomy[`${id[p.uid]}/${rel}`] = { ...structuredClone(x), parent: x.parent ? `${id[p.uid]}/${x.parent}` : id[p.uid] }; for (const f of Object.values(inner)) f.add(`${id[p.uid]}/${rel}`); }
  }
  // every id the anatomy was read with, removed parts' included, which the outer box keeps
  const r = parts.find((p) => p.uid === 'root');
  const read = new Set([...((r && r.readIds) || []), ...parts.map((p) => p.at).filter(Boolean)]);
  // where a read part's id went: the part itself, and the layers of an instance under it
  const moves = parts.filter((p) => p.at && p.at !== id[p.uid]).map((p) => [p.at, id[p.uid]]);
  // the part itself where it moved, else the nearest moved part it sits in: a part renamed inside a renamed one is its own
  const renamed = (t) => {
    const hit = moves.find(([from]) => t === from) || moves.filter(([from]) => t.startsWith(from + '/')).sort((a, b) => b[0].length - a[0].length)[0];
    return hit ? hit[1] + t.slice(hit[0].length) : t;
  };
  return { anatomy, links, inner, read, renamed };
}

/*
 * What the variants add to the parts on the page, and where a part is drawn
 * only under some props' values: the contract's `when` where it says, or
 * else the props of the first variant that adds it. Parts inside a placed
 * component are that component's, and are left out.
 */
export function variantParts(parts, contract = {}) {
  const id = ids(parts);
  const uidOf = new Map(Object.entries(id).map(([uid, at]) => [at, uid]));
  const when = contract.when || {};
  const added = new Map();
  for (const v of contract.variants || []) for (const [at, e] of Object.entries(v.add || {})) {
    if (added.has(at) || uidOf.has(at) || !uidOf.has(e.parent || 'root')) continue;
    added.set(at, { at, kind: e.kind, name: typeof e.name === 'string' ? e.name : words(at.split('/').pop()), parent: uidOf.get(e.parent || 'root'), when: when[at] || v.when, exact: !!when[at], entry: e });
  }
  const byParent = new Map();
  for (const a of added.values()) byParent.set(a.parent, [...(byParent.get(a.parent) || []), a]);
  const condOf = new Map(Object.entries(when).filter(([at]) => uidOf.has(at)).map(([at, c]) => [uidOf.get(at), c]));
  // the values each part is taken out at, a layer each that removes it
  const removedOf = new Map();
  for (const v of contract.variants || []) for (const at of v.remove || []) if (uidOf.has(at)) removedOf.set(uidOf.get(at), [...(removedOf.get(uidOf.get(at)) || []), v.when || {}]);
  return { byParent, condOf, removedOf };
}

/* What stops the anatomy being written as it stands, each tied to the part and field to fix. */
export function partProblems(parts) {
  const out = [];
  for (const p of parts) {
    if (p.uid === 'root') continue;
    if (!p.name.trim()) out.push({ uid: p.uid, field: 'name', message: 'A part needs a name.' });
    if (p.kind === 'text' && !p.textProp && !(p.text || '').trim()) out.push({ uid: p.uid, field: 'content', message: `${p.name || 'This text'} needs its words: a Text prop, or fixed text.` });
  }
  return out;
}

/*
 * The tokens a part may take, read from a project's token snapshot
 * (`collections`, each with its modes' values): a value that is a colour is
 * a colour, a number is a length; grouped by collection and by the name's
 * first segment, so a long list reads in the library's own groups.
 */
export function tokenLists(snapshot = {}) {
  const colours = [];
  const lengths = [];
  for (const [collection, c] of Object.entries(snapshot.collections || {})) {
    // the collection's first mode, as it names its modes; else the first it holds
    const first = c.values && ((c.modes && c.values[c.modes[0]]) || Object.values(c.values)[0]);
    // the mode called Dark, matched without case, as the snapshot's own reader picks it (tools/snapshot/tokens.cjs valueOf,
    // which this page cannot import, being CommonJS; test-anatomy.mjs holds the two to one answer)
    const darkMode = c.values && Object.keys(c.values).find((m) => /^dark$/i.test(m));
    const dark = darkMode ? c.values[darkMode] : {};
    // the fields Figma offers it in, where the snapshot recorded them
    // a variable hidden from publishing is the library's own: another file cannot import it, so a drawing outside
    // the library would hold its raw value; kept for drawing what uses it, marked so no field offers it
    const hidden = new Set(c.hidden || []);
    const scoped = (t, name) => ({ ...(c.scopes && c.scopes[name] ? { ...t, scopes: c.scopes[name] } : t), ...(hidden.has(name) ? { private: true } : {}) });
    for (const [name, v] of Object.entries(first || {})) {
      if (typeof v === 'string' && /^#|^rgba?\(/.test(v)) colours.push(scoped({ group: collection, name, value: v, ...(typeof dark[name] === 'string' && dark[name] !== v ? { dark: dark[name] } : {}) }, name));
      else if (typeof v === 'number') lengths.push(scoped({ group: name.split('/')[0], name, value: v }, name));
    }
  }
  // effect styles as the CSS a preview draws: each drop or inner shadow layer, reversed from Figma's order, because
  // Figma paints its effects array's last layer on top and CSS its first shadow (as tools/parity/adapt.mjs states it)
  const shadows = (snapshot.effects || []).map((e) => ({ group: e.name.split('/')[0], name: e.name,
    value: (e.layers || []).filter((l) => l.type === 'DROP_SHADOW' || l.type === 'INNER_SHADOW').reverse()
      .map((l) => `${l.type === 'INNER_SHADOW' ? 'inset ' : ''}${l.x || 0}px ${l.y || 0}px ${l.blur || 0}px ${l.spread || 0}px ${l.color}`).join(', ') }));
  const textStyleOf = Object.fromEntries((snapshot.textStyles || []).map((t) => [t.name, { family: t.family, weight: t.weight, size: t.size, lineHeight: t.lineHeight, letterSpacing: t.letterSpacing }]));
  // a family together, as a tree: at each level of the name, in the order its first member comes. Figma lists
  // variables as they were made, so a shade added later (Neutral/soft) would stand apart from its family, and
  // Control/Feedback made after Level would stand apart from Control/Neutral
  const first = new Map();
  const path = (t) => [t.group, ...t.name.split('/').slice(0, -1)];
  colours.forEach((t, i) => { const p = path(t); for (let n = 1; n <= p.length; n++) { const k = p.slice(0, n).join('|'); if (!first.has(k)) first.set(k, i); } });
  for (const t of colours) { const p = path(t); t.at = p.map((_, n) => first.get(p.slice(0, n + 1).join('|'))); }
  colours.sort((x, y) => { for (let n = 0; n < Math.min(x.at.length, y.at.length); n++) if (x.at[n] !== y.at[n]) return x.at[n] - y.at[n]; return x.at.length - y.at.length; });
  for (const t of colours) delete t.at;
  // each icon's own colour, the variable its glyph is painted with (snapshot plugin 0.63.0), by icon name
  const iconColours = Object.assign({}, ...Object.values((snapshot._meta && snapshot._meta.sources) || {}).map((s) => (s.owns && s.owns.iconColours) || {}));
  return { colours, lengths, shadows, ...(Object.keys(iconColours).length ? { iconColours } : {}), textStyles: (snapshot.textStyles || []).map((s) => s.name), textStyleOf };
}

/*
 * Which token groups a library uses for each kind of value, read from its
 * stored contracts' anatomy: a gap, a padding, a radius, a fill, a text
 * colour. A menu then offers what the library already reaches for (its
 * spacing for a gap, its semantic colours for a fill) instead of every
 * variable it has; a field the library never sets offers everything.
 */
const family = (name) => { const s = name.split('/'); return s.slice(0, s.length > 2 ? 2 : 1).join('/'); };
export function usedGroups(contracts = []) {
  const out = { gap: new Set(), padding: new Set(), radius: new Set(), background: new Set(), color: new Set(), fill: new Set(), stroke: new Set(), strokeWidth: new Set() };
  // a token's family is its first two segments (Colour/Text), or its first where it has no more
  const note = (field, v) => { if (typeof v === 'string' && v.includes('/')) out[field].add(family(v)); };
  for (const c of contracts) for (const e of Object.values((c && c.anatomy) || {})) {
    if (e.layout) { note('gap', e.layout.gap); for (const v of Object.values(e.layout.padding || {})) note('padding', v); }
    note('radius', e.radius);
    // a vector's fill is a shape's, a frame's a frame's
    note(e.kind === 'graphic' ? 'fill' : 'background', e.background);
    note('color', e.color);
    // a border's width may be one value or one per side
    if (e.border) { note('stroke', e.border.color); for (const w of [].concat(e.border.width)) note('strokeWidth', w); }
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}

/*
 * The tokens a field offers. Figma's own answer first: a variable scoped to
 * the field, or shown in all of them. Only from a snapshot taken before
 * scopes were recorded does the guess from the library's own use stand in.
 */
// a frame's fill, a text's colour, and a shape's fill (a vector, an icon's glyph) are three scopes in Figma
const SCOPES = { gap: ['GAP'], padding: ['GAP'], radius: ['CORNER_RADIUS'], background: ['FRAME_FILL', 'ALL_FILLS'],
  color: ['TEXT_FILL', 'ALL_FILLS'], fill: ['SHAPE_FILL', 'ALL_FILLS'], stroke: ['STROKE_COLOR'], strokeWidth: ['STROKE_FLOAT'], fontSize: ['FONT_SIZE'], opacity: ['OPACITY'] };
export function forField(all, groups, field) {
  const list = all.filter((t) => !t.private);
  if (field && SCOPES[field] && list.some((t) => t.scopes)) return list.filter((t) => !t.scopes || t.scopes.includes('ALL_SCOPES') || t.scopes.some((x) => SCOPES[field].includes(x)));
  // a guess that matches nothing (a library that names its tokens otherwise) offers everything rather than nothing
  const guessed = groups && groups.length ? list.filter((t) => groups.includes(family(t.name))) : [];
  return guessed.length ? guessed : list;
}

/*
 * The anatomy as the preview draws it: each part with the CSS its tokens
 * resolve to (the first mode's values), its words, and what sits in it. A
 * part shown by an on/off prop that is off by default is drawn, marked `off`
 * with that prop's name. A value with no token stays unset, so
 * the preview shows what the contract says and nothing it does not.
 */
export function preview(parts, drafts, tokens = {}, { dark = false, nested = () => null, iconOf = () => null, imageOf = () => null, sizeAxis = null, name: drawn = null, depth = 0 } = {}) {
  // a colour in the page's scheme: its dark mode's value where the page is dark and the token has one
  const value = (list, name) => { const t = (tokens[list] || []).find((x) => x.name === name); return t ? (dark && t.dark) || t.value : undefined; };
  const px = (name) => { const v = value('lengths', name); return v == null ? undefined : `${v}px`; };
  const prop = (uid) => drafts.find((d) => d.uid === uid);
  // drawn from the anatomy the contract writes, so what it does not say is not drawn
  const { anatomy } = toAnatomy(parts, drafts);
  const id = ids(parts);
  // the sketch's values: a token by its first mode's value (its dark one on a dark page), a number in px, a text style
  // by its fields resolved; the translation itself is the contract's one (component-contract/css.mjs), as to-code's is
  const names = {
    token: (name) => value('colours', name) ?? value('shadows', name) ?? px(name),
    number: (n) => `${+n.toFixed(4)}px`,
    textStyle: (name) => {
      const t = (tokens.textStyleOf || {})[name];
      return t ? [['font-family', `"${t.family}", system-ui, sans-serif`], ['font-weight', figmaWeight(String(t.weight)) || 400], ['font-size', `${t.size}px`],
        ['line-height', String(t.lineHeight)], ...(t.letterSpacing ? [['letter-spacing', `${t.letterSpacing}px`]] : [])] : [];
    },
  };
  // the page's style object: physical sides, as the drawing reads its width and places its layers
  const PHYSICAL = { 'inline-size': 'width', 'block-size': 'height', 'min-inline-size': 'minWidth', 'min-block-size': 'minHeight', 'max-inline-size': 'maxWidth',
    'max-block-size': 'maxHeight', 'inset-inline-start': 'left', 'inset-inline-end': 'right', 'inset-block-start': 'top', 'inset-block-end': 'bottom' };
  const styleOf = (e, at) => Object.fromEntries(declarations(e, at, names).decls.map(([p, v]) => [PHYSICAL[p] || p.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v]));
  // a linear gradient from its paint's transform, as parity reads one (schema.mjs gradient), taken on a square box: the
  // preview does not know a hugging box's size before it is drawn, so a diagonal on an oblong box is near, not exact
  const gradient = (style, e) => {
    const g = e.background && typeof e.background === 'object' && e.background.type === 'GRADIENT_LINEAR' ? e.background : null;
    const stops = g && (g.stops || []).map((st) => [value('colours', st.color), st.position]);
    if (!stops || !stops.length || !stops.every(([c]) => c)) return;
    const [a, b, c] = Array.isArray(g.transform) ? g.transform[0] : [0, 1, 0];
    const corners = [c, a + c, b + c, a + b + c], t0 = Math.min(...corners), t1 = Math.max(...corners);
    const deg = Array.isArray(g.transform) ? (Math.atan2(a, -b) * 180) / Math.PI : g.angle;
    style.background = `linear-gradient(${+deg.toFixed(2)}deg, ${stops.map(([col, p]) => `${col} ${+(((p - t0) / (t1 - t0 || 1)) * 100).toFixed(2)}%`).join(', ')})`;
  };
  const node = (p, row) => {
    const shownBy = prop(p.shownBy);
    const e = anatomy[p.uid === 'root' ? 'root' : id[p.uid]] || {};
    const kids = parts.filter((x) => x.parent === p.uid);
    // the contract's own translation (sizes, layout, fills, strokes, type, a layer placed out of the flow pinned as its
    // constraints say); the sketch adds what a drawing needs and code does not
    const style = styleOf(e, { root: p.uid === 'root', holds: holds(p.kind), row, anchors: true });
    const out = { uid: p.uid, kind: p.kind, name: p.uid === 'root' ? 'Outer box' : p.name, style, children: [] };
    // a part its on/off prop hides by default is marked with that prop: drawn as any part, its title saying so (figma-handoff: the preview)
    if (shownBy && shownBy.type === 'boolean' && !shownBy.default) out.off = shownBy.name;
    // the outer box laid out as the sketch's own block, over the parts it lays out
    if (p.uid === 'root' && style.display === 'inline-flex') style.display = 'flex';
    if (style.position === 'absolute') style.zIndex = 1;
    else if (!holds(p.kind)) delete style.position;
    // a part a variant hides by its opacity keeps its room, unseen; a token (a disabled state's) by its value, which
    // Figma keeps as a percentage
    const opacity = typeof e.opacity === 'number' ? e.opacity : value('lengths', e.opacity);
    if (typeof opacity === 'number') style.opacity = String(opacity > 1 ? opacity / 100 : opacity); else delete style.opacity;
    gradient(style, e);
    if (holds(p.kind)) {
      if (!style.alignItems) style.alignItems = 'flex-start';
      out.children = kids.map((x) => node(x, (e.layout || {}).direction !== 'column')).filter(Boolean);
    }
    if (p.kind === 'text') {
      const d = prop(p.textProp);
      out.text = d ? (d.default || d.name) : (p.text || p.name || 'Text');
    }
    if (p.kind === 'instance') {
      const d = prop(p.swapProp);
      // a swap's default names a sibling of the component it swaps (folder for Icon/house), or a component outright
      const swapped = d && d.default && (String(d.default).includes('/') || !p.component ? d.default : `${p.component.split('/').slice(0, -1).join('/')}/${d.default}`);
      const name = swapped || p.component;
      out.text = name || p.name;
      // the colour its own layers are drawn in, where the contract says, for an icon
      const glyph = Object.values(p.inner || {}).find((x) => x.kind === 'graphic' && x.background);
      if (!style.color && glyph && value('colours', glyph.background)) style.color = value('colours', glyph.background);
      // given none, an icon is drawn in its own colour, as Figma places it
      const ownColour = name && (tokens.iconColours || {})[name.split('/').pop()];
      if (!style.color && !glyph && ownColour && value('colours', ownColour)) style.color = value('colours', ownColour);
      const size = sizeAxis && e.with && e.with[sizeAxis] ? Number(e.with[sizeAxis]) : typeof e.width === 'number' ? e.width : null;
      out.icon = name ? iconOf(name, size) : null;
      // drawn from the layers the contract recorded for this very instance (its own values resolved, a swapped icon swapped),
      // or else from its component's contract at this instance's values, a few levels down; the rest is a box saying what it is
      const own = !out.icon && depth < 3 && Object.keys(p.inner || {}).length && !swapped
        ? { parts: fromAnatomy({ root: { ...e, kind: 'container', parent: undefined, order: undefined, layout: e.layout || { direction: 'row' } },
          ...Object.fromEntries(Object.entries(p.inner).map(([k, x]) => [k, { ...x, parent: x.parent || 'root' }])) }, [], {}), drafts: [] } : null;
      const inner = own || (!out.icon && depth < 3 && name ? nested(name, e.with || {}) : null);
      if (inner) out.inner = preview(inner.parts, inner.drafts, tokens, { dark, nested, iconOf, imageOf, sizeAxis, name, depth: depth + 1 });
      out.component = name;
    }
    if (p.kind === 'graphic') {
      // part of a ring (a spinner's), as Figma's arc: its angles clockwise from 3 o'clock, CSS's from 12; cut by a mask, so
      // any fill is kept, the outer edge too (round corners under a mask left a faint full circle)
      if (e.shape === 'ellipse' && e.arc) {
        const from = ((e.arc.start ?? 0) + 90) % 360, sweep = ((((e.arc.end ?? 360) - (e.arc.start ?? 0)) % 360) + 360) % 360 || 360;
        const inner = (e.arc.inner || 0) * 100;
        style.mask = `conic-gradient(from ${from}deg, #000 ${sweep}deg, transparent 0), radial-gradient(closest-side, transparent ${inner}%, #000 calc(${inner}% + 0.5px) calc(100% - 0.5px), transparent)`;
        style.maskComposite = 'intersect';
        delete style.borderRadius;
      }
      // a vector with no size of its own is drawn at an icon's; one pinned to both edges takes its size from them
      if (!style.width && !style.flex && !(style.left && style.right)) style.width = '16px';
      if (!style.height && style.alignSelf !== 'stretch' && !(style.top && style.bottom)) style.height = '16px';
    }
    // an image fill: the contract keeps no image, so an instance's, or the outer box's of the component drawn, is the
    // snapshot's preview of that component where it has one (FIT inside the box, FILL and CROP over it); else a placeholder
    if (typeof e.background === 'string' && e.background.startsWith('IMAGE')) {
      const url = imageOf(p.kind === 'instance' ? out.component : p.uid === 'root' ? drawn : null, dark);
      if (url) out.picture = { url, fit: /FIT|TILE/.test(e.background) ? 'contain' : 'cover' }; else out.image = true;
    }
    if (p.kind === 'slot') { const d = prop(p.slotProp); out.text = d ? d.name : (p.name || 'Slot'); }
    for (const k of Object.keys(style)) if (style[k] === undefined) delete style[k];
    return out;
  };
  const r = parts.find((p) => p.uid === 'root');
  return r ? node(r, true) : null;
}

/*
 * Back from a contract's anatomy to the editor's parts, for JSON edited by
 * hand: each id's last segment its name, its parent its place, its tokens
 * its look; `{key}` content and each prop's shows, sets and swaps become the
 * links again, to the drafts whose names make those keys.
 */
// a part's id said as its name: content/showIconIcon → Show icon icon
export { partName };
const words = (seg) => partName(seg);
// the one vector inside an instance, where it has one: an icon's glyph
const glyphOf = (inner) => { const g = Object.entries(inner || {}).filter(([, x]) => x.kind === 'graphic'); return g.length === 1 ? g[0][0] : null; };
const READ = ['width', 'height', 'minWidth', 'minHeight', 'position', 'absolute', 'constraints', 'layout', 'background', 'radius', 'shadow', 'stroke', 'strokeWidth', 'typography', 'textAlign', 'color', 'component', 'with', 'text', 'textProp', 'slotProp', 'shownBy', 'swapProp', 'opacity'];
export function fromAnatomy(anatomy = {}, drafts = [], props = {}) {
  const byKey = new Map(drafts.map((d) => [camel(d.name), d.uid]));
  const linked = (field, id) => { for (const [k, p] of Object.entries(props)) if ((p[field] || []).includes(id)) return byKey.get(k) || null; return null; };
  const uid = { root: 'root' };
  const out = [];
  const look = (e, p) => {
    const l = e.layout || {};
    if (holds(e.kind)) p.layout = { direction: l.direction === 'column' ? 'column' : 'row', ...(l.gap ? { gap: l.gap } : {}), ...(l.padding && SIDES.some((k) => typeof l.padding[k] === 'string') ? { padding: Object.fromEntries(SIDES.filter((k) => typeof l.padding[k] === 'string').map((k) => [k, l.padding[k]])) } : {}), ...(l.align ? { align: l.align } : {}), ...(l.crossAlign ? { crossAlign: l.crossAlign } : {}) };
    for (const k of ['background', 'radius', 'shadow', 'typography', 'textAlign', 'color', 'component', 'shape']) if (typeof e[k] === 'string') p[k] = e[k];
    // a radius per corner, as Figma keeps four
    if (Array.isArray(e.radius)) p.radius = [...e.radius];
    for (const k of ['width', 'height']) if (e[k] === 'hug' || e[k] === 'fill' || typeof e[k] === 'number') p[k] = e[k];
    for (const k of ['minWidth', 'minHeight']) if (typeof e[k] === 'number') p[k] = e[k];
    // where it sits out of the flow, and the edges it is pinned to
    if (e.position === 'absolute') p.position = 'absolute';
    for (const k of ['absolute', 'constraints']) if (e[k] && typeof e[k] === 'object') p[k] = { ...e[k] };
    if (e.with && typeof e.with === 'object') p.with = { ...e.with };
    if (e.border && typeof e.border.color === 'string') p.stroke = e.border.color;
    if (e.border && typeof e.border.width === 'string') p.strokeWidth = e.border.width;
    const ref = typeof e.content === 'string' && /^\{(.+)\}$/.exec(e.content);
    if (e.kind === 'text') { if (ref) p.textProp = byKey.get(ref[1]) || null; else if (typeof e.content === 'string') p.text = e.content; }
    if (e.kind === 'slot' && ref) p.slotProp = byKey.get(ref[1]) || null;
    return p;
  };
  // what the editor showed when it read the part, its links included, so toAnatomy can tell an edit from the contract's own form
  const remember = (p) => { p.read = structuredClone(Object.fromEntries(READ.map((k) => [k, p[k] ?? null]))); return p; };
  const r = remember(look(anatomy.root || { kind: 'container' }, { ...root(), ...(anatomy.root ? { raw: anatomy.root } : {}), readIds: Object.keys(anatomy) }));
  out.push(r);
  // everything below an instance, its ids and parents made relative to it
  const innerOf = (base) => Object.fromEntries(Object.entries(anatomy).filter(([k]) => k.startsWith(base + '/'))
    .map(([k, x]) => [k.slice(base.length + 1), { ...x, parent: x.parent === base ? '' : x.parent.slice(base.length + 1) }]));
  const walk = (parentId) => {
    const kids = Object.entries(anatomy).filter(([, e]) => e.parent === parentId).sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0));
    for (const [id, e] of kids) {
      const p = look(e, part({ name: typeof e.name === 'string' ? e.name : words(id.split('/').pop()), seg: id.split('/').pop(), at: id, kind: KINDS.some(([k]) => k === e.kind) ? e.kind : 'container', parent: uid[parentId], raw: e }));
      const shown = linked('shows', id); if (shown) p.shownBy = shown;
      const swap = linked('swaps', id); if (swap) p.swapProp = swap;
      remember(p);
      uid[id] = p.uid;
      out.push(p);
      if (e.kind === 'instance') {
        p.inner = innerOf(id);
        // an icon's colour is its glyph's fill, inside the instance: the instance's Colour shows and sets it
        const glyph = glyphOf(p.inner);
        if (!p.color && glyph && typeof p.inner[glyph].background === 'string') p.color = p.inner[glyph].background;
      } else walk(id);
    }
  };
  walk('root');
  return out;
}

/*
 * A part moved by a drag: before or after another part (becoming its
 * sibling), or inside a container (its last child). Refused, returning the
 * parts unchanged, where the move would put a part inside itself or what
 * sits in it, or anything beside the outer box.
 */
export function place(parts, uid, target, where) {
  const moving = parts.find((p) => p.uid === uid);
  const at = parts.find((p) => p.uid === target);
  if (!moving || !at || uid === 'root' || uid === target) return parts;
  if (where === 'inside' && !holds(at.kind)) return parts;
  if (where !== 'inside' && target === 'root') return parts;
  // nothing may go inside itself: the target, and the target's containers, must not be the moving part or below it
  for (let p = at; p; p = parts.find((x) => x.uid === p.parent)) if (p.uid === uid) return parts;
  const rest = parts.filter((p) => p.uid !== uid);
  const moved = { ...moving, parent: where === 'inside' ? target : at.parent };
  const k = rest.findIndex((p) => p.uid === target);
  if (where === 'inside') return [...rest, moved];
  rest.splice(where === 'before' ? k : k + 1, 0, moved);
  return rest;
}
