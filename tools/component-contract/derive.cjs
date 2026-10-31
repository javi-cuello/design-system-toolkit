/*
 * tools/component-contract/derive.cjs — a component's contract, derived from its stored
 * spec: what it is (props, anatomy, how each prop changes it) in words no
 * platform owns, with every value a token where the design bound one.
 *
 *   derive(spec)            → the contract
 *   expand(contract, when)  → the flat anatomy one combination of props draws
 *
 * A layer above the snapshot, never a replacement and never a source: the
 * snapshot is what Figma drew, measured, and parity holds code to it; the
 * contract is what that drawing means, for a reader who needs the intent and
 * not the pixels — code built elsewhere (an MUI library), an agent's brief, a
 * docs page's props table, a version grade on the component's API. Written
 * 2026-10-05, after a comparison with Nathan Curtis's Specs (a hub that
 * normalizes intent extracted from Figma) and Southleft's DS Contracts (a
 * canonical contract both surfaces are generated from); this one takes
 * Curtis's place in the chain and neither's authority.
 *
 * Deterministic and checked against itself: `expand` rebuilds every stored
 * variant from the contract, and `selfCheck` says where it does not.
 */

const { nameOf } = require('../snapshot/graph.cjs');const { resolve, layerPaths } = require('../snapshot/spec.cjs');

const SHAPE = 1;
const j = (x) => JSON.stringify(x);
// a combination drawn from its layers: one module, the editor's page reads it too
const { variantDefaults, apply, expand, partName, camel, kebab } = require('./layers.mjs');

/* A variant's name as prop values: "Size=Large, Left icon=True". */
const { variantValues: valuesOf } = require('../shared/names.js');

const KIND = { TEXT: 'text', INSTANCE: 'instance', SLOT: 'slot', FRAME: 'container', GROUP: 'container', COMPONENT: 'container', COMPONENT_SET: 'container', SECTION: 'container' };
const AXIS = { MIN: 'start', CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between', BASELINE: 'baseline', STRETCH: 'stretch' };
const SIZE = { HUG: 'hug', FILL: 'fill' };
const TEXT_ALIGN = { LEFT: 'start', CENTER: 'center', RIGHT: 'end', JUSTIFIED: 'justify' };

/* One layer, said without Figma's words. A bound value is its token's name;
   an unbound one is the number Figma drew. Position (x, y) and the size a
   hug or fill resolves to are drawing, not intent, and are left to the
   snapshot. */
function element(n, parent, known) {
  const b = n.bindings || {};
  const e = { kind: KIND[n.type] || 'graphic' };
  if (parent) e.parent = parent;
  if (n.type === 'INSTANCE' && n.instanceOf) {
    e.component = nameOf(n.instanceOf, known);
    if (n.props && Object.keys(n.props).length) e.with = n.props;
  }
  if (n.layout === 'HORIZONTAL' || n.layout === 'VERTICAL') {
    const [main, cross] = String(n.align || 'MIN/MIN').split('/');
    const pad = b.pad || n.pad;
    e.layout = { direction: n.layout === 'HORIZONTAL' ? 'row' : 'column', gap: b.gap ?? n.gap, align: AXIS[main] || main, crossAlign: AXIS[cross] || cross };
    if (pad) e.layout.padding = { top: pad[0], end: pad[1], bottom: pad[2], start: pad[3] };
    if (n.wrap) { e.layout.wrap = true; if (n.crossGap != null) e.layout.crossGap = b.crossGap ?? n.crossGap; }
    // canvas stacking first on top (snapshot 0.62.0 on): which of two overlapping children paints over the other
    if (n.firstOnTop) e.layout.firstOnTop = true;
  }
  if (n.sizing) {
    const [w, h] = String(n.sizing).split('/');
    e.width = SIZE[w] || (b.w ?? n.w);
    e.height = SIZE[h] || (b.h ?? n.h);
    // a component that fills its set: the size the set gives it, a canvas fact, as `invalid` is (a row 420 wide)
    if (!parent && (w === 'FILL' || h === 'FILL')) e.canvas = { ...(w === 'FILL' ? { width: n.w } : {}), ...(h === 'FILL' ? { height: n.h } : {}) };
  }
  for (const k of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight']) if (n[k] != null) e[k] = b[k] ?? n[k];
  // placed out of the flow, at its point in its parent
  if (n.absolute) { e.position = 'absolute'; if (n.x != null) e.absolute = { x: n.x, y: n.y }; }
  // how it follows its parent's size where no auto layout places it (snapshot 0.61.0 on): a ring stretched round its box
  if (n.constraints) { const [h, v] = n.constraints.toLowerCase().split('/'); e.constraints = { horizontal: h, vertical: v }; }
  // a corner bound to a token is said by it even at 0; per corner, a bound corner's token beside the others' numbers
  const four = (bound, own) => (Array.isArray(bound) ? bound.map((t, i) => t ?? (Array.isArray(own) ? own[i] : own ?? 0)) : bound ?? own);
  if (n.radius || b.radius) e.radius = four(b.radius, n.radius);
  if (n.fills && n.fills.length) e[n.type === 'TEXT' ? 'color' : 'background'] = n.fills.length === 1 ? n.fills[0] : n.fills;
  // a weight bound with no stroke painted is kept too: the library keeps it for the variant that paints one
  if ((n.strokes && n.strokes.length) || b.strokeWeight) {
    e.border = n.strokes && n.strokes.length ? { color: n.strokes.length === 1 ? n.strokes[0] : n.strokes } : {};
    if (b.strokeWeight) e.border.width = four(b.strokeWeight, n.strokeSides);
    if (n.strokeSides) e.border.sides = { top: n.strokeSides[0], end: n.strokeSides[1], bottom: n.strokeSides[2], start: n.strokeSides[3] };
    // drawn on its centre or outside the box rather than inside, taking room in the layout, dashed
    if (n.strokeAlign && n.strokeAlign !== 'INSIDE') e.border.align = n.strokeAlign.toLowerCase();
    if (n.strokesInLayout) e.border.inLayout = true;
    if (n.dashed) e.border.dash = n.dashed;
    if (n.strokeCap) e.border.cap = n.strokeCap.toLowerCase();
  }
  if (n.effect) e.shadow = n.effect;
  else if (n.effects && n.effects.length) e.shadow = n.effects;
  if (n.opacity != null && n.opacity !== 1) e.opacity = b.opacity ?? n.opacity;
  if (n.blendMode) e.blend = n.blendMode.toLowerCase();
  if (n.mask) e.mask = true;
  if (n.smoothing) e.smoothing = n.smoothing;
  if (n.clips) e.overflow = 'hidden';
  // a shape the library drew as one rather than a box: an ellipse (a badge's dot), a rectangle (a focus ring)
  if (n.type === 'ELLIPSE') e.shape = 'ellipse';
  // part of a circle or a ring, in degrees (snapshot 0.62.0 on): a progress indicator at 50% is half of one
  if (n.arc) e.arc = { ...n.arc };
  if (n.type === 'RECTANGLE') e.shape = 'rectangle';
  if (n.rotation) e.rotation = n.rotation;
  if (n.type === 'TEXT') {
    if (n.textStyle) e.typography = n.textStyle;
    if (n.textAlign) e.textAlign = TEXT_ALIGN[n.textAlign] || n.textAlign;
    if (n.maxLines) e.maxLines = n.maxLines;
    if (n.truncate) e.truncate = true;
    // how the box follows its words, and where they sit in it: neither is a text style's
    if (n.textAutoResize) e.autoResize = n.textAutoResize.toLowerCase();
    if (n.textAlignVertical) e.verticalAlign = n.textAlignVertical === 'CENTER' ? 'center' : n.textAlignVertical === 'BOTTOM' ? 'end' : 'start';
    // spacing and case a style would give, said only for words no style sets
    if (!n.textStyle) for (const k of ['letterSpacing', 'lineHeight', 'paragraphSpacing', 'listSpacing']) if (n[k] != null) e[k] = n[k];
    if (!n.textStyle && n.textCase) e.textCase = n.textCase.toLowerCase();
    if (!n.textStyle && n.textDecoration) e.textDecoration = n.textDecoration.toLowerCase();
    if (n.text !== undefined) e.content = n.text;
  }
  return e;
}

/* A layer's address: its names below the root, a repeated name among
   siblings numbered from its second (`Icon`, `Icon[2]`), kept as a list so a
   name with a slash in it stays one name. The same layer in two variants has
   the same address; that is what makes a delta meaningful. */
const SEP = '\u001f';
const keyOf = (segs) => segs.join(SEP);
function paths(tree) {
  const out = [{ node: tree, segs: [], parent: null, order: 0 }];
  const go = (n, segs) => {
    const seen = {};
    (n.children || []).forEach((c, order) => {
      seen[c.name] = (seen[c.name] || 0) + 1;
      const own = [...segs, c.name + (seen[c.name] > 1 ? `[${seen[c.name]}]` : '')];
      out.push({ node: c, segs: own, parent: segs, order });
      go(c, own);
    });
  };
  go(tree, []);
  return out;
}

/* The longest run of names two child lists share, in order: which children
   of a boolean's tree are the base variant's own, and which it added. A
   boolean only shows and hides, so of two same-named layers the one that is
   the same layer (its component, props and words) is the match: with a
   dialog's secondary of two Buttons hidden, the primary left is the second. */
function lcs(a, b) {
  const own = (x) => JSON.stringify([x.type, x.instanceOf, x.props, x.text]);
  const score = (x, y) => (x.name !== y.name ? 0 : own(x) === own(y) ? 2 : 1);
  const m = a.length, n = b.length, t = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let k = n - 1; k >= 0; k--) t[i][k] = Math.max(score(a[i], b[k]) ? t[i + 1][k + 1] + score(a[i], b[k]) : 0, t[i + 1][k], t[i][k + 1]);
  const pairs = [];
  for (let i = 0, k = 0; i < m && k < n;) {
    const sc = score(a[i], b[k]);
    if (sc && t[i][k] === t[i + 1][k + 1] + sc) { pairs.push([i, k]); i++; k++; } else if (t[i + 1][k] >= t[i][k + 1]) i++; else k++;
  }
  return pairs;
}

/* A boolean's tree, addressed against the variant it was flipped from: a
   child the two share in order keeps the base's address; one only the
   boolean's tree has is the boolean's own layer, addressed under the prop
   (`Icon container#Left icon`); one only the base has is what the boolean
   hides. Matched by alignment, not by name: the walked trees hold visible
   layers only, so a left and a right icon both sit at `Icon container` in
   their own trees, and with the right icon on by default the left one's
   flip adds `Icon container[2]` by name (a review found exactly that). */
function alignFlip(base, flip, prop) {
  const list = [], hidden = [];
  const walk = (b, bSegs, f, fSegs, order) => {
    list.push({ node: f, segs: fSegs, parent: fSegs.length ? fSegs.slice(0, -1) : null, order });
    // inside a layer the boolean added, everything is its own, addressed by name below it
    if (!b) { for (const e of paths(f).slice(1)) list.push({ ...e, segs: [...fSegs, ...e.segs], parent: [...fSegs, ...e.parent] }); return; }
    const bk = b.children || [], fk = f.children || [];
    const pairs = lcs(bk, fk);
    const matched = new Map(pairs.map(([i, k]) => [k, i]));
    const bSeen = {}, bAddr = bk.map((c) => { bSeen[c.name] = (bSeen[c.name] || 0) + 1; return c.name + (bSeen[c.name] > 1 ? `[${bSeen[c.name]}]` : ''); });
    // a boolean shows and hides this component's own layers, never one inside a placed instance: what differs in there
    // is the instance walked otherwise (a detached copy walks an instance whole), not the boolean's
    const own = b.type !== 'INSTANCE';
    if (own) bk.forEach((c, i) => { if (!pairs.some(([x]) => x === i)) hidden.push([...bSegs, bAddr[i]]); });
    const added = {};
    fk.forEach((c, k) => {
      if (matched.has(k)) { const i = matched.get(k); walk(bk[i], [...bSegs, bAddr[i]], c, [...fSegs, bAddr[i]], k); return; }
      if (!own) return;
      added[c.name] = (added[c.name] || 0) + 1;
      walk(null, null, c, [...fSegs, `${c.name}${added[c.name] > 1 ? `[${added[c.name]}]` : ''}#${prop}`], k);
    });
  };
  walk(base, [], flip, [], 0);
  return { list, hidden };
}

function layout(spec) {
  const trees = spec.variants || [];
  const byName = new Map(trees.map((t) => [t.name, t]));
  const booleans = Object.keys(spec.props || {}).filter((p) => spec.props[p] === 'BOOLEAN');
  const hides = {};
  const out = trees.map((t) => {
    const w = valuesOf(t.name);
    const flipped = booleans.find((p) => p in w);
    const base = flipped && byName.get(String(t.name).split(/,\s*/).filter((x) => !x.startsWith(flipped + '=')).join(', '));
    if (!base) return { tree: t, when: w, list: paths(t) };
    const { list, hidden } = alignFlip(base, t, flipped);
    for (const h of hidden) (hides[flipped] = hides[flipped] || new Map()).set(keyOf(h), h);
    return { tree: t, when: w, list, from: trees.indexOf(base) };
  });
  return { trees: out, hides };
}

/* An element's id is its address in camel case, `/` between levels:
   `content/labelContainer/label`. It depends on nothing but the layer's own
   path, so a layer added elsewhere renames nothing (a review found leaf-name
   ids shifting when an unrelated `Label` appeared); a boolean's own layer is
   named for the prop that shows it (`content/leftIconIconContainer`). */
function idOf(segs) {
  if (!segs.length) return 'root';
  return segs.map((seg) => {
    const [, name, n, prop] = seg.match(/^(.*?)(?:\[(\d+)\])?(?:#(.+))?$/);
    // a repeat is numbered past a separator no name camel-cases to: "Item 2" is item2, the second "Item" item_2
    const base = camel(name) + (n ? `_${n}` : '');
    return prop ? camel(prop) + base.charAt(0).toUpperCase() + base.slice(1) : base;
  }).join('/');
}
// the address with the boolean tags and numbers off, as the plugin's links spell it
const plain = (segs) => segs.map((s) => s.replace(/#.*$/, '')).join(SEP);

/*
 * Where each part is drawn, as a condition on the props that choose a
 * variant: { size: ['lg'] } for a part only the large size draws. Read off
 * every drawn variant and written only where it is exact, the part drawn
 * in a variant if and only if the condition holds; a part whose presence
 * no such condition explains says nothing here, and its variants say it.
 * A boolean's own layers are its `shows`, not a condition: they are read
 * with that boolean on.
 */
function partConditions(rows, props) {
  const out = {};
  const ids = new Set(rows.flatMap((r) => Object.keys(r.anatomy)));
  const keys = Object.keys(rows[0].when);
  for (const id of ids) {
    if (id === 'root') continue;
    const own = keys.filter((k) => (props[k].shows || []).includes(id));
    const seen = rows.filter((r) => own.every((k) => r.when[k] === true));
    const here = seen.filter((r) => id in r.anatomy);
    if (!here.length || here.length === seen.length) continue;
    // a layer inside a placed component is that component's, not a part of this one
    const tree = rows.find((r) => r.anatomy[id]).anatomy;
    let inside = false;
    for (let up = tree[id].parent; up && tree[up]; up = tree[up].parent) if (tree[up].kind === 'instance') { inside = true; break; }
    if (inside) continue;
    // drawn exactly where its parent is: the parent's condition says it
    const parent = tree[id].parent;
    if (parent && parent !== 'root' && seen.every((r) => (id in r.anatomy) === (parent in r.anatomy))) continue;
    const cond = {};
    for (const k of keys) {
      if (own.includes(k)) continue;
      const order = props[k].type === 'boolean' ? [false, true] : props[k].values;
      const all = new Set(seen.map((r) => r.when[k]));
      const at = order.filter((v) => here.some((r) => r.when[k] === v));
      if (at.length < all.size) cond[k] = at;
    }
    if (!Object.keys(cond).length) continue;
    const holds = (c) => (r) => Object.entries(c).every(([k, vs]) => vs.includes(r.when[k]));
    const exact = (c) => seen.every((r) => holds(c)(r) === (id in r.anatomy));
    if (!exact(cond)) continue;
    // only the props it needs: one whose other values the grid never draws with this part (a focus ring's
    // disabled, as disabled and focus are not drawn together) is the invalid list's to say, not the condition's
    for (const k of Object.keys(cond)) { const less = { ...cond }; delete less[k]; if (Object.keys(less).length && exact(less)) delete cond[k]; }
    out[id] = cond;
  }
  return out;
}

function flatten(list, characters = new Map(), known = []) {
  const out = {};
  const nodeAt = new Map(list.map((x) => [keyOf(x.segs), x.node]));
  for (const { node, segs, parent, order } of list) {
    const e = element(node, parent == null ? null : idOf(parent), known);
    // in a box no auto layout places (nor an instance, whose own layers it are), a part is at its point in it
    const up = parent == null ? null : nodeAt.get(keyOf(parent));
    const inInstance = segs.slice(0, -1).some((_, i) => (nodeAt.get(keyOf(segs.slice(0, i + 1))) || {}).type === 'INSTANCE');
    if (up && !up.layout && !inInstance && !e.absolute && node.x != null) e.absolute = { x: node.x, y: node.y };
    // its far edges where it follows its parent's (a focus ring 4 outside its box, all round): how far from the
    // parent's end and bottom, as CSS's right and bottom say it; stretched, its size is its parent's less both
    // offsets, never a number measured at one label's width
    if (e.absolute && e.constraints && up && up.w != null && node.w != null) {
      const at = (v) => Math.round(v * 100) / 100;
      for (const [axis, far, from, size, own] of [['horizontal', 'end', 'x', 'width', 'w'], ['vertical', 'bottom', 'y', 'height', 'h']]) {
        const c = e.constraints[axis];
        if (c !== 'stretch' && c !== 'max') continue;
        e.absolute[far] = at(up[own] - e.absolute[from] - node[own]);
        if (c === 'stretch' && typeof e[size] === 'number') delete e[size];
      }
    }
    if (parent != null) e.order = order;
    const prop = characters.get(keyOf(segs)) || characters.get(plain(segs));
    if (prop && node.type === 'TEXT') e.content = `{${prop}}`;
    // a slot is its prop's: Figma names the property after the slot layer
    if (node.type === 'SLOT') e.content = `{${camel(node.name)}}`;
    const id = idOf(segs);
    // the layer's own name where its id cannot say it back (a repeat, a boolean's link folded in)
    if (parent != null && partName(id) !== node.name) e.name = node.name;
    out[id] = e;
  }
  return out;
}

/* What one flat anatomy changes from another: keys set, elements added and
   removed. A key is `<element>.<field>`. */
function delta(from, to) {
  const set = {}, add = {}, remove = [];
  for (const [id, e] of Object.entries(to)) {
    if (!from[id]) { add[id] = e; continue; }
    for (const k of new Set([...Object.keys(from[id]), ...Object.keys(e)])) if (j(from[id][k]) !== j(e[k])) set[`${id}.${k}`] = e[k] === undefined ? null : e[k];
  }
  for (const id of Object.keys(from)) if (!to[id]) remove.push(id);
  return { set, add, remove };
}
const empty = (d) => !Object.keys(d.set).length && !Object.keys(d.add).length && !d.remove.length;


/* The state axis is the settings' `stateAxis` (figma-standard rule 4), and of
   its values the interaction states a browser or platform supplies are the
   settings' `pointerStates` (Rest is none, and Loading is a prop in code): the
   house defaults from standards/audit-settings.json, or a project's when the
   caller passes them (projects.cjs `deriveOptions`). Listed in, not ruled out:
   a State axis also carries Initial, Submitted, Drag over. */
// The house's settings as every tool reads them: the sections merged flat (projects.cjs flatSettings).
const HOUSE = (() => { try { return require('../snapshot/projects.cjs').flatSettings(require('../../standards/audit-settings.json')['audit-defaults'], {}); } catch { return {}; } })();

/*
 * The combinations not drawn, said as briefly as they hold: a prop is left out
 * of every entry when, for each entry, all its values are missing with the
 * other props alike ("disabled and focus", whatever the size); out of all or
 * none, never some. A key left out is any value, as every reader of the list
 * already takes it (to-figma, parity).
 */
function fold(missing, domains) {
  let rows = missing;
  const same = (a, b, ks) => ks.every((k) => a[k] === b[k]);
  for (const [k, values] of domains) {
    const rest = domains.map(([x]) => x).filter((x) => x !== k && rows.every((r) => x in r));
    if (!rest.length || !rows.every((r) => k in r)) continue;
    if (!rows.every((r) => values.every((v) => rows.some((o) => o[k] === v && same(o, r, rest))))) continue;
    rows = rows.map((r) => Object.fromEntries(Object.entries(r).filter(([x]) => x !== k)))
      .filter((r, i, all) => all.findIndex((o) => JSON.stringify(o) === JSON.stringify(r)) === i);
  }
  return rows;
}
const isFlag = (t) => Array.isArray(t) && t.length === 2 && t.map((v) => String(v).toLowerCase()).sort().join() === 'false,true';
function valueFor(figmaProps, p, v) {
  const t = figmaProps[p];
  return t === 'BOOLEAN' || isFlag(t) ? String(v).toLowerCase() === 'true' : kebab(v);
}

function read(stored) {
  const spec = resolve(stored);
  if (!(spec.variants || []).length) throw new Error(`${spec.name || 'spec'}: no variants to derive a contract from`);
  // the default variant first, where the plugin recorded which it is (0.50.0 on)
  if (spec.defaultVariant) { const i = spec.variants.findIndex((v) => v.name === spec.defaultVariant); if (i > 0) spec.variants = [spec.variants[i], ...spec.variants.filter((_, x) => x !== i)]; }
  const { trees, hides } = layout(spec);
  // a link is a list of names below the variant, numbered as paths() numbers them
  const characters = new Map();
  for (const [p, l] of Object.entries(spec.links || {})) if (l.kind === 'characters') for (const at of l.layers) characters.set(keyOf([].concat(at)), camel(p));
  return { spec, trees, hides, characters };
}

/* Each walked tree's flat anatomy, as derive() layers them and selfCheck() holds the contract to them. */
function anatomies(trees, characters, known, L) {
  const flat = trees.map((t) => ({ when: t.when, anatomy: flatten(t.list, characters, known) }));
  // a boolean only shows and hides: a layer its flipped tree shares with the variant it was flipped from is that
  // variant's, but for its place (a flip is walked from a detached instance, whose sizes are its own: a root 420 wide)
  trees.forEach((t, i) => {
    if (t.from == null || t.from < 0) return;
    const was = flat[t.from].anatomy, now = flat[i].anatomy;
    for (const id of Object.keys(now)) if (was[id]) now[id] = { ...was[id], ...(now[id].order != null ? { order: now[id].order } : {}) };
  });
  // a property that drives its layer in some variants only (snapshot 0.61.0 on): a swap names its instance there, so a
  // set giving each size its own icon swap on the one layer keeps which is whose; elsewhere a text keeps its own words
  for (const [p, l] of Object.entries(L)) if (l.variants && l.kind !== 'visible') {
    const want = new Set(l.layers.map((at) => keyOf([].concat(at))));
    const ws = l.variants.map(valuesOf);
    trees.forEach((t, i) => {
      const holds = ws.some((w) => Object.entries(w).every(([k, v]) => t.when[k] === v));
      for (const e of t.list) if (want.has(keyOf(e.segs)) || want.has(plain(e.segs))) {
        const a = flat[i].anatomy[idOf(e.segs)];
        if (!a) continue;
        if (l.kind === 'mainComponent' && holds && a.kind === 'instance') a.swappedBy = camel(p);
        if (l.kind === 'characters' && !holds && a.content === `{${camel(p)}}` && typeof e.node.text === 'string') a.content = e.node.text;
      }
    });
  }
  return flat;
}

/* `known` is every stored component name, so an instance of `Table - Cell / Fill`
   resolves to that set and not to `Table - Cell` (graph.cjs nameOf). */
function derive(stored, known = [], { stateAxis = HOUSE.stateAxis || null, pointerStates = HOUSE.pointerStates || [] } = {}) {
  const pointer = new Set(pointerStates.map(kebab));
  const { spec, trees, hides, characters } = read(stored);
  const figmaProps = spec.props || {};
  const L = spec.links || {};
  const flat = anatomies(trees, characters, known, L);
  const addresses = new Map();
  for (const t of trees) for (const e of t.list) addresses.set(keyOf(e.segs), e.segs);
  const base = flat[0];
  // a text prop's default: the words its layer holds in the default variant
  const words = new Map();
  for (const { node, segs } of trees[0].list) {
    const prop = characters.get(keyOf(segs)) || characters.get(plain(segs));
    if (prop && node.type === 'TEXT' && typeof node.text === 'string' && !words.has(prop)) words.set(prop, node.text);
  }

  // props: an enum's default is the default variant's value, a boolean's the
  // opposite of the value its walked trees were flipped to
  const props = {};
  for (const [p, t] of Object.entries(figmaProps)) {
    const id = camel(p);
    // drawn as False/True variants, said so: the invalid list, folded, need not name it
    if (isFlag(t)) props[id] = { type: 'boolean', default: valueFor(figmaProps, p, base.when[p] ?? 'False'), axis: true };
    else if (Array.isArray(t)) {
      props[id] = { type: 'enum', values: t.map(kebab), default: kebab(base.when[p] ?? t[0]) };
      // Figma's spelling of each, which the kebab-case values lose (Primary, Icon only) or the house's would change (lg)
      props[id].figmaValues = [...t];
      if (stateAxis && p === stateAxis) { props[id].role = 'interaction'; props[id].pointer = props[id].values.filter((v) => pointer.has(v)); }
    } else if (t === 'BOOLEAN') {
      const flipped = flat.find((f) => p in f.when);
      props[id] = { type: 'boolean', default: flipped ? !valueFor(figmaProps, p, flipped.when[p]) : false };
    } else if (t === 'TEXT') props[id] = { type: 'string', ...(words.has(id) ? { default: words.get(id) } : {}) };
    else if (t === 'INSTANCE_SWAP') props[id] = { type: 'instance' };
    else if (t === 'SLOT') props[id] = { type: 'slot', ...(spec.slots && spec.slots[p] ? { settings: spec.slots[p].settings, preferred: spec.slots[p].preferred, ...(spec.slots[p].description ? { description: spec.slots[p].description } : {}) } : {}) };
    else props[id] = { type: String(t).toLowerCase() };
    props[id].figma = p;
    // what the prop drives: a boolean the layers its trees add, or, on by
    // default, the layers they hide; a text or a swap the layers the plugin
    // links it to (0.50.0 on)
    if (t === 'BOOLEAN') {
      const own = [...addresses.values()].filter((segs) => segs.length && segs.at(-1).endsWith(`#${p}`)).map(idOf);
      const gone = [...((hides[p] || new Map()).values())].map(idOf);
      const shows = [...new Set([...own, ...gone])];
      if (shows.length) props[id].shows = shows;
    }
    const l = L[p];
    if (l && l.kind !== 'visible') {
      const want = new Set(l.layers.map((at) => keyOf([].concat(at))));
      const hit = [...addresses.values()].filter((segs) => want.has(keyOf(segs)) || want.has(plain(segs))).map(idOf);
      if (hit.length) props[id][{ characters: 'sets', mainComponent: 'swaps' }[l.kind]] = [...new Set(hit)];
    }
  }
  // the description is guidance, the docs' and the designer's: Curtis and Pitre both leave it out

  const defaults = variantDefaults({ props });
  const whenOf = (w) => ({ ...defaults, ...Object.fromEntries(Object.entries(w).filter(([p]) => p in figmaProps).map(([p, v]) => [camel(p), valueFor(figmaProps, p, v)])) });
  const rows = flat.map((f) => ({ when: whenOf(f.when), d: delta(base.anatomy, f.anatomy), anatomy: f.anatomy }));

  // layers, read the way a grid is read: what one prop value changes with
  // every other prop at its default, then what a pair changes on top of its
  // two layers, then a trio on top of those (an icon's colour for Secondary
  // and Danger together, at every size and state), each from the variant that
  // has exactly those values; what is left is per combination. Fitted on the drawn variants, so expand() is
  // exact for every one of them (selfCheck).
  const contract = { contract: SHAPE, component: spec.name, figma: { name: spec.figmaName || spec.name, ...(spec.key ? { key: spec.key } : {}), id: spec.id }, props, anatomy: base.anatomy, variants: [] };
  const off = (r) => Object.keys(defaults).filter((k) => r.when[k] !== defaults[k]);
  for (const size of [1, 2, 3]) {
    for (const r of rows.slice(1)) {
      const moved = off(r);
      if (moved.length !== size) continue;
      const when = Object.fromEntries(moved.map((k) => [k, r.when[k]]));
      const d = delta(expand(contract, r.when), r.anatomy);
      if (!empty(d)) contract.variants.push({ when, ...d });
    }
  }
  for (const r of rows.slice(1)) {
    if (off(r).length <= 3) continue;
    const rest = delta(expand(contract, r.when), r.anatomy);
    if (!empty(rest)) contract.variants.push({ when: r.when, ...rest, combination: true });
  }
  for (const v of contract.variants) { if (!Object.keys(v.set).length) delete v.set; if (!Object.keys(v.add).length) delete v.add; if (!v.remove.length) delete v.remove; }

  // the variant-axis combinations the grid leaves out, where there are few enough to list
  const axes = Object.entries(figmaProps).filter(([, t]) => Array.isArray(t)).map(([p]) => camel(p));
  const total = axes.reduce((n, k) => n * (props[k].type === 'boolean' ? 2 : props[k].values.length), 1);
  if (axes.length > 1 && total <= 4096) {
    const drawn = new Set(rows.map((r) => j(axes.map((k) => r.when[k]))));
    const missing = [];
    const go = (i, acc) => {
      if (i === axes.length) { if (!drawn.has(j(acc))) missing.push(Object.fromEntries(axes.map((k, x) => [k, acc[x]]))); return; }
      for (const v of props[axes[i]].type === 'boolean' ? [false, true] : props[axes[i]].values) go(i + 1, [...acc, v]);
    };
    go(0, []);
    if (missing.length) contract.invalid = fold(missing, axes.map((k) => [k, props[k].type === 'boolean' ? [false, true] : props[k].values]));
  } else if (axes.length > 1) contract.invalid = null; // too many combinations to list: not "all valid"
  // a part drawn only under some props' values (an icon at one size only), said once per part
  const when = partConditions(rows, props);
  if (Object.keys(when).length) contract.when = when;
  return contract;
}


/* Every stored variant, rebuilt from the contract and compared with the
   anatomy the snapshot draws: [] when the contract carries all of it. */
function selfCheck(stored, contract, known = [], options = {}) {
  contract = contract || derive(stored, known, options);
  const { spec, trees, characters } = read(stored);
  const figmaProps = spec.props || {};
  const flat = anatomies(trees, characters, known, spec.links || {});
  const bad = [];
  for (const [i, t] of trees.entries()) {
    const when = Object.fromEntries(Object.entries(t.when).filter(([p]) => p in figmaProps).map(([p, v]) => [camel(p), valueFor(figmaProps, p, v)]));
    const d = delta(expand(contract, when), flat[i].anatomy);
    if (!empty(d)) bad.push(`${t.tree.name}: ${[...Object.keys(d.set), ...Object.keys(d.add).map((k) => `+${k}`), ...d.remove.map((k) => `-${k}`)].slice(0, 4).join(', ')}`);
  }
  return bad;
}

/*
 * Which stored layer each contract element is, read forward from the spec:
 * the contract's id (idOf, above) and the store's path (spec.cjs layerPaths:
 * `Content > Label`, `Aside#2`) of the same node in the same variant. The
 * parity mappings name layers by the store's path and the contract names
 * them by id; this is the one place the two meet, and it never inverts an
 * id, since two layer names can camel-case alike. One id may sit at more
 * than one path (a boolean's layer, aligned against the variant it flips
 * from, is numbered differently in its own tree), and one path may be more
 * than one id across variants; both are kept. `props` gives each prop's
 * Figma name and options under the contract's own spelling of them. `clashes`
 * lists an id two different addresses take, which no translation can undo.
 */
function bridge(stored) {
  const { trees } = read(stored);
  const paths = {}, ids = {}, owner = {}, clashes = [];
  const add = (map, k, v) => { (map[k] = map[k] || new Set()).add(v); };
  for (const t of trees) {
    const at = new Map([[t.tree, '$root']]);
    layerPaths(t.tree, (node, p) => { at.set(node, p); });
    for (const e of t.list) {
      const id = idOf(e.segs);
      const key = keyOf(e.segs.map((s) => s.replace(/#.*$/, '')));
      if (owner[id] !== undefined && owner[id] !== key) { clashes.push(`${id}: ${owner[id].split(SEP).join(' > ')} and ${key.split(SEP).join(' > ')}`); continue; }
      owner[id] = key;
      const p = at.get(e.node);
      if (p == null) continue;
      add(paths, id, p);
      add(ids, p, id);
    }
  }
  const out = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, [...v].sort()]));
  // each prop by its contract id, with its Figma name and each option by the value the contract spells it (valueFor)
  const figmaProps = resolve(stored).props || {};
  const props = Object.fromEntries(Object.entries(figmaProps).map(([p, t]) => [camel(p), { figma: p,
    ...(Array.isArray(t) && { values: Object.fromEntries(t.map((v) => [String(valueFor(figmaProps, p, v)), v])) }) }]));
  return { paths: out(paths), ids: out(ids), props, clashes: [...new Set(clashes)] };
}

module.exports = { derive, expand, selfCheck, SHAPE, variantDefaults, bridge, fold };
