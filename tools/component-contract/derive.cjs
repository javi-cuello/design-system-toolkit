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

const { nameOf } = require('../snapshot/graph.cjs');
const MODES = require('../tokens/modes.cjs');
const { resolve, layerPaths, boxOnly } = require('../snapshot/spec.cjs');

const SHAPE = 1;
const j = (x) => JSON.stringify(x);
// a combination drawn from its layers: one module, the editor's page reads it too
const { variantDefaults, apply, expand, partName, camel, kebab, propIds, valueIds, bareProp, keyMatches } = require('./layers.mjs');

/* A variant's name as prop values: "Size=Large, Left icon=True". */
const { variantValues: valuesOf } = require('../shared/names.js');

const KIND = { TEXT: 'text', INSTANCE: 'instance', SLOT: 'slot', FRAME: 'container', GROUP: 'container', COMPONENT: 'container', COMPONENT_SET: 'container', SECTION: 'container' };
// alignment and sizing words, from the one table every direction reads
const { alignFromFigma, sizeFromFigma, typeFromFigma, spacingFromFigma, CLEARED } = require('./rules.mjs');
// a long-running process (the snapshot router) reads this file fresh and keeps the rules.mjs it first loaded, which
// clearing require.cache never reloads: one without these helpers derives as before them, never a throw (store.cjs
// deletes a contract whose derive threw)
const VALUES = typeof typeFromFigma === 'function' && typeof spacingFromFigma === 'function';
/* Where a layer's box stands in its parent: its x and y, except a mirrored one's, whose x (or y) Figma gives as its
   matrix's origin, the far edge; its box's near edge is what CSS's left and code's box say (the snapshot's `visual`). */
// (a vertical mirror carries no visual box: the snapshot writes one only with a turn, and a mirror unturned is its far
// edge less its size)
const boxAt = (n) => {
  if (!n.flip) return { x: n.x, y: n.y };
  const near = (axis, size) => (n.visual && n.visual[axis] != null ? n.visual[axis] : n[axis] - (n[size] || 0));
  return { x: n.flip === 'x' ? near('x', 'w') : n.x, y: n.flip === 'y' ? near('y', 'h') : n.y };
};
// a turn of a quarter, either way (Figma's degrees, -180 to 180): the one turn whose box the parent lays out with its axes swapped
const QUARTER = (r) => typeof r === 'number' && Math.abs(Math.abs(r) - 90) < 0.01;
const TEXT_ALIGN = { LEFT: 'start', CENTER: 'center', RIGHT: 'end', JUSTIFIED: 'justify' };

/* One layer, said without Figma's words. A bound value is its token's name;
   an unbound one is the number Figma drew. Position (x, y) and the size a
   hug or fill resolves to are drawing, not intent, and are left to the
   snapshot. */
function element(n, parent, known, up = null, axes = [], turned = false) {
  const b = n.bindings || {};
  const e = { kind: KIND[n.type] || 'graphic' };
  if (parent) e.parent = parent;
  if (n.type === 'INSTANCE' && n.instanceOf) {
    e.component = nameOf(n.instanceOf, known);
    // its published key (a set's where the main is a variant): a name another component of the store may also carry (an
    // icon named Checkbox beside the Checkbox set), the key says which it is (layers.mjs keyMatches); a local one has none
    if (n.instanceOfKey) e.key = n.instanceOfKey;
    if (n.props && Object.keys(n.props).length) e.with = n.props;
  }
  if (n.layout === 'HORIZONTAL' || n.layout === 'VERTICAL') {
    const [main, cross] = String(n.align || 'MIN/MIN').split('/');
    // a side bound to a token is said by it, an unbound side by its own number beside it (four, below)
    const pad = Array.isArray(b.pad) ? b.pad.map((t, i) => t ?? (Array.isArray(n.pad) ? n.pad[i] : 0)) : n.pad;
    e.layout = { direction: n.layout === 'HORIZONTAL' ? 'row' : 'column', gap: b.gap ?? n.gap, align: alignFromFigma(main), crossAlign: alignFromFigma(cross) };
    if (pad) e.layout.padding = { top: pad[0], end: pad[1], bottom: pad[2], start: pad[3] };
    if (n.wrap) { e.layout.wrap = true; if (n.crossGap != null) e.layout.crossGap = b.crossGap ?? n.crossGap; }
    // canvas stacking first on top (snapshot 0.62.0 on): which of two overlapping children paints over the other
    if (n.firstOnTop) e.layout.firstOnTop = true;
  }
  if (n.sizing) {
    // a node turned a quarter keeps its own width and height (n.w, n.h: 169 by 16) while its parent lays out its turned
    // box (the snapshot's `visual`, 16 by 169), so its sizing words name the parent's axes: each said of its own axis,
    // the horizontal one of its height and the vertical one of its width (a slider's track turned upright fills its
    // column down, its own width). Any other turn is said as it stands
    // (only where code lays it out by its turned box: a part to-code draws in a wrapper (turnedParts, `turned`, found on
    // the contract derived without the swap), here in its parent's auto layout, neither axis hugging, a size container
    // cannot hug; anywhere else it turns in place and keeps Figma's order)
    const flows = turned && up && (up.layout === 'HORIZONTAL' || up.layout === 'VERTICAL') && !n.absolute && !/HUG/.test(String(n.sizing));
    const [w, h] = (QUARTER(n.rotation) && flows ? String(n.sizing).split('/').reverse() : String(n.sizing).split('/'));
    e.width = sizeFromFigma(w) || (b.w ?? n.w);
    e.height = sizeFromFigma(h) || (b.h ?? n.h);
    // a component that fills its set: the size the set gives it, a canvas fact, as `invalid` is (a row 420 wide)
    if (!parent && (w === 'FILL' || h === 'FILL')) e.canvas = { ...(w === 'FILL' ? { width: n.w } : {}), ...(h === 'FILL' ? { height: n.h } : {}) };
  }
  for (const k of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight']) if (n[k] != null) e[k] = b[k] ?? n[k];
  // an auto layout that hugs and holds nothing the walk records keeps the size it last had (Figma's way: a dialog's
  // empty slot at 200; a tile's icon frame 40 by 40 round the icon it hides; a status frame 16 high in 20 of padding),
  // wherever it differs from its padding: drawn without it, it is Figma's 100 for an empty frame. It holds only while
  // the part is empty (whileEmpty, below), so a frame code fills hugs what it holds, and a frame a boolean fills keeps
  // nothing
  if (['FRAME', 'SLOT', 'COMPONENT'].includes(n.type) && n.layout && n.sizing && !(n.children || []).length && Array.isArray(n.pad)) {
    const [w, h] = String(n.sizing).split('/');
    const kept = [];
    if (w === 'HUG' && n.minWidth == null && Math.abs(n.w - (n.pad[1] + n.pad[3])) > 0.5) { e.minWidth = n.w; kept.push('minWidth'); }
    if (h === 'HUG' && n.minHeight == null && Math.abs(n.h - (n.pad[0] + n.pad[2])) > 0.5) { e.minHeight = n.h; kept.push('minHeight'); }
    // (checked against every variant in anatomies: one a boolean fills elsewhere only holds hidden layers here)
    if (kept.length) e.emptyKept = kept;
  }
  // placed out of the flow, at its point in its parent
  if (n.absolute) { e.position = 'absolute'; if (n.x != null) e.absolute = boxAt(n); }
  // how it follows its parent's size where no auto layout places it (snapshot 0.61.0 on): a ring stretched round its box
  if (n.constraints) { const [h, v] = n.constraints.toLowerCase().split('/'); e.constraints = { horizontal: h, vertical: v }; }
  // a corner bound to a token is said by it even at 0; per corner, a bound corner's token beside the others' numbers
  const four = (bound, own) => (Array.isArray(bound) ? bound.map((t, i) => t ?? (Array.isArray(own) ? own[i] : own ?? 0)) : bound ?? own);
  if (n.radius || b.radius) e.radius = four(b.radius, n.radius);
  if (n.fills && n.fills.length) e[n.type === 'TEXT' ? 'color' : 'background'] = n.fills.length === 1 ? n.fills[0] : n.fills;
  // the colour style those fills come from, beside them (a style whose colour paints nothing, alone): the drawing paints
  // with it, as the library does; code has no styles, so a reading from code is never held to one (roundTrip)
  if (n.fillStyle) e.fillStyle = n.fillStyle;
  // a weight bound with no stroke painted is read here too; normalForm then says it as no stroke (nothing draws it), and a
  // variant that paints one states its whole stroke
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
  // a vector's own outline (snapshot 0.86.0 on), Figma's paths, so a drawing draws the dot and not its box
  // (a divider's line along its box is dropped once placed, below, where to-figma's line draws it)
  if (n.paths) e.paths = n.paths.map((p) => ({ ...p }));
  if (n.type === 'RECTANGLE') e.shape = 'rectangle';
  if (n.rotation) e.rotation = n.rotation;
  // a mirror, as the snapshot takes it out of the matrix (x: horizontal, y: vertical)
  if (n.flip) e.flip = n.flip;
  // a variable mode the layer sets (snapshot 0.75.0 on), under the attribute the token build writes it as
  if (n.modes) { const m = MODES.keyed(axes, n.modes); if (Object.keys(m).length) e.modes = m; }
  if (n.type === 'TEXT') {
    // a library style by its name; a text with none (the snapshot's literal) by its values, in the form code reads them
    // in (rules.mjs typeValue), where the snapshot holds them (0.82.0 on), else said as literal; several styles, mixed
    if (n.textStyle) e.typography = (VALUES && n.textStyle === 'literal' && typeFromFigma(n)) || n.textStyle;
    if (n.textAlign) e.textAlign = TEXT_ALIGN[n.textAlign] || n.textAlign;
    if (n.maxLines) e.maxLines = n.maxLines;
    if (n.truncate) e.truncate = true;
    // how the box follows its words, and where they sit in it: neither is a text style's
    if (n.textAutoResize) e.autoResize = n.textAutoResize.toLowerCase();
    // (as the design states it, a text that grows to its words too: there no alignment shows, but a drawing that
    // leaves it out is not the file; css.mjs writes none, from-code never reads it, and to-figma's roundTrip
    // (unaligned) holds a browser's reading to it only where the design's text has a height of its own)
    if (n.textAlignVertical) e.verticalAlign = n.textAlignVertical === 'CENTER' ? 'center' : n.textAlignVertical === 'BOTTOM' ? 'end' : 'start';
    // spacing and case a style would give, said only for words no style sets
    if (!n.textStyle) for (const k of ['letterSpacing', 'lineHeight', 'paragraphSpacing', 'listSpacing']) if (n[k] != null) e[k] = n[k];
    if (!n.textStyle && n.textCase) e.textCase = n.textCase.toLowerCase();
    if (!n.textStyle && n.textDecoration) e.textDecoration = n.textDecoration.toLowerCase();
    // the same for a literal text, only where the snapshot records its size (0.82.0 on), so an older snapshot's contract
    // stays as stored, and a mixed text, which records none, as it was (the line height is the typography's; the
    // spacing between paragraphs and list items only where the words hold more than one line, as it draws nothing else)
    if (VALUES && n.textStyle === 'literal' && typeof n.fontSize === 'number') {
      const ls = spacingFromFigma(n.letterSpacing, n.fontSize);
      if (ls !== undefined) e.letterSpacing = ls;
      if (typeof n.text === 'string' && n.text.includes('\n')) for (const k of ['paragraphSpacing', 'listSpacing']) if (n[k] != null) e[k] = n[k];
      if (n.textCase) e.textCase = n.textCase.toLowerCase();
      if (n.textDecoration) e.textDecoration = n.textDecoration.toLowerCase();
    }
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

/* A variant name's values, each under its prop's own name: a name splits trimmed (`Shortcuts or Trigger =True`), and a
   prop Figma keeps with a trailing space (`Shortcuts or Trigger `) would not be found by it, its trees read as the
   variant's own. */
function valuesIn(props, name) {
  const own = new Map(Object.keys(props || {}).map((p) => [p.trim(), p]));
  return Object.fromEntries(Object.entries(valuesOf(name)).map(([k, v]) => [own.get(k) ?? k, v]));
}

function layout(spec) {
  const trees = spec.variants || [];
  const byName = new Map(trees.map((t) => [t.name, t]));
  const booleans = Object.keys(spec.props || {}).filter((p) => spec.props[p] === 'BOOLEAN');
  const hides = {};
  const out = trees.map((t) => {
    const w = valuesIn(spec.props, t.name);
    const flipped = booleans.find((p) => p in w);
    const base = flipped && byName.get(String(t.name).split(/,\s*/).filter((x) => !x.startsWith(flipped + '=')).join(', '));
    if (!base) return { tree: t, when: w, list: paths(t) };
    const { list, hidden } = alignFlip(base, t, flipped);
    for (const h of hidden) (hides[flipped] = hides[flipped] || new Map()).set(keyOf(h), h);
    return { tree: t, when: w, list, from: trees.indexOf(base) };
  });
  untie(out);
  return { trees: out, hides };
}

/* Two layers two booleans show, both hidden by default, are each walked alone, so each stands at the same place among
   the visible children of its box, and which comes first is a tie no variant breaks (a menu item's top spacer and
   divider). Where the snapshot says each layer's place among all its parent's children, hidden ones counted (`index`,
   0.83.0 on), the boxes where two booleans flipped from one variant add layers at the same place take that place as
   their children's order in those booleans' trees, so the two come out in the order Figma draws them. Nowhere else, and
   never without it: a contract no tie touches is the one it was. */
function untie(trees) {
  const added = new Map();
  trees.forEach((t, i) => {
    if (t.from == null || t.from < 0) return;
    for (const e of t.list) {
      if (!e.parent || !e.segs.length || !e.segs.at(-1).includes('#') || e.parent.some((s) => s.includes('#'))) continue;
      const box = `${t.from}${SEP}${SEP}${keyOf(e.parent)}`;
      added.set(box, [...(added.get(box) || []), { i, order: e.order, index: e.node.index, parent: e.parent }]);
    }
  });
  for (const xs of added.values()) {
    const tied = xs.some((a) => xs.some((b) => b.i !== a.i && b.order === a.order && typeof a.index === 'number' && typeof b.index === 'number' && a.index !== b.index));
    if (!tied) continue;
    for (const i of new Set(xs.map((x) => x.i))) {
      const kids = trees[i].list.filter((e) => e.parent && keyOf(e.parent) === keyOf(xs[0].parent));
      if (kids.every((e) => typeof e.node.index === 'number')) for (const e of kids) e.order = e.node.index;
    }
  }
}

/* An element's id is its address in camel case, `/` between levels:
   `content/labelContainer/label`. It depends on nothing but the layer's own
   path, so a layer added elsewhere renames nothing (a review found leaf-name
   ids shifting when an unrelated `Label` appeared); a boolean's own layer is
   named for the prop that shows it (`content/leftIconIconContainer`). */
function idOf(segs) {
  if (!segs.length) return 'root';
  return segs.map((seg) => {
    // (`s`: a name may hold a line separator, U+2028, which `.` alone does not match)
    const [, name, n, prop] = seg.match(/^(.*?)(?:\[(\d+)\])?(?:#(.+))?$/s);
    // a repeat is numbered past a separator no name camel-cases to: "Item 2" is item2, the second "Item" item_2
    const base = camel(name) + (n ? `_${n}` : '');
    return prop ? camel(prop) + base.charAt(0).toUpperCase() + base.slice(1) : base;
  }).join('/');
}
// the address with the boolean tags and numbers off, as the plugin's links spell it
const plain = (segs) => segs.map((s) => s.replace(/#.*$/s, '')).join(SEP);

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

function flatten(list, characters = new Map(), known = [], axes = [], turned = null) {
  const out = {};
  const nodeAt = new Map(list.map((x) => [keyOf(x.segs), x.node]));
  for (const { node, segs, parent, order } of list) {
    // in a box no auto layout places (nor an instance, whose own layers it are), a part is at its point in it
    const up = parent == null ? null : nodeAt.get(keyOf(parent));
    const e = element(node, parent == null ? null : idOf(parent), known, up, axes, !!turned && turned.has(idOf(segs)));
    const inInstance = segs.slice(0, -1).some((_, i) => (nodeAt.get(keyOf(segs.slice(0, i + 1))) || {}).type === 'INSTANCE');
    if (up && !up.layout && !inInstance && !e.absolute && node.x != null) e.absolute = boxAt(node);
    // and inside an instance, a layer its component places in a frame keeps no constraints either: like its position, an
    // instance cannot override them (figma-fact: no-nested-position-override), so they are the component's, and code reads
    // none there (one placed absolutely in an auto layout keeps them, with the position it states)
    // (but a glyph's scale both ways, which ownGlyph reads after to fold an icon's insides into the icon)
    if (inInstance && !e.absolute && !(e.constraints && e.constraints.horizontal === 'scale' && e.constraints.vertical === 'scale')) delete e.constraints;
    // its far edges where it follows its parent's (a focus ring 4 outside its box, all round): how far from the
    // parent's end and bottom, as CSS's right and bottom say it; stretched, its size is its parent's less both
    // offsets, never a number measured at one label's width; centred, both edges say how far its centre stands from
    // the parent's, (x - end) / 2, which no size code gives either box changes (an icon 0.3 off the middle of a box that fills)
    if (e.absolute && e.constraints && up && up.w != null && node.w != null) {
      const at = (v) => Math.round(v * 100) / 100;
      for (const [axis, far, from, size, own] of [['horizontal', 'end', 'x', 'width', 'w'], ['vertical', 'bottom', 'y', 'height', 'h']]) {
        const c = e.constraints[axis];
        if (c !== 'stretch' && c !== 'max' && c !== 'center') continue;
        e.absolute[far] = at(up[own] - e.absolute[from] - node[own]);
        if (c === 'stretch' && typeof e[size] === 'number') delete e[size];
      }
    }
    // a line along its box (a divider, spec.cjs boxOnly) carries no paths where to-figma draws it as its line (a graphic
    // of no height, or no width, along that axis, that no icon names): the box and its stroke say it, as before 0.86.0,
    // and code has no path to write. Anywhere else (stretched both ways) the paths stay, so it is never drawn a frame
    if (e.paths && e.kind === 'graphic' && !e.asset && boxOnly(node.paths, node.w, node.h) && (Math.abs(node.h) <= 0.01 ? e.height === 0 : e.width === 0)) delete e.paths;
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
  if (t === 'BOOLEAN' || isFlag(t)) return String(v).toLowerCase() === 'true';
  // an option by the one value rule (layers.mjs valueIds): `-50` and `+50` stay two
  const i = Array.isArray(t) ? t.indexOf(v) : -1;
  return i >= 0 ? valueIds(t)[i] : kebab(v);
}

/* Each Figma prop's contract id (layers.mjs propIds, the editor's rule too), made once per set of props. */
const PROP_IDS = new WeakMap();
function propId(figmaProps, p) {
  if (!figmaProps || typeof figmaProps !== 'object') return camel(p);
  let ids = PROP_IDS.get(figmaProps);
  if (!ids) {
    const names = Object.keys(figmaProps);
    const got = propIds(names.map((n) => ({ name: n, flag: figmaProps[n] === 'BOOLEAN' })));
    PROP_IDS.set(figmaProps, (ids = new Map(names.map((n, i) => [n, got[i]]))));
  }
  return ids.get(p) || camel(p);
}

function read(stored) {
  const spec = resolve(stored);
  if (!(spec.variants || []).length) throw new Error(`${spec.name || 'spec'}: no variants to derive a contract from`);
  // the default variant first, where the plugin recorded which it is (0.50.0 on)
  if (spec.defaultVariant) { const i = spec.variants.findIndex((v) => v.name === spec.defaultVariant); if (i > 0) spec.variants = [spec.variants[i], ...spec.variants.filter((_, x) => x !== i)]; }
  const { trees, hides } = layout(spec);
  // a link is a list of names below the variant, numbered as paths() numbers them
  const characters = new Map();
  for (const [p, l] of Object.entries(spec.links || {})) if (l.kind === 'characters') for (const at of l.layers) characters.set(keyOf([].concat(at)), propId(spec.props, p));
  return { spec, trees, hides, characters };
}

/* Each walked tree's flat anatomy, as derive() layers them and selfCheck() holds the contract to them. */
function anatomies(trees, characters, known, L, mains = null, found = null, axes = [], figmaProps = {}, turned = null) {
  const flat = trees.map((t) => ({ when: t.when, anatomy: flatten(t.list, characters, known, axes, turned) }));
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
    const ws = l.variants.map((n) => valuesIn(figmaProps, n));
    trees.forEach((t, i) => {
      const holds = ws.some((w) => Object.entries(w).every(([k, v]) => t.when[k] === v));
      for (const e of t.list) if (want.has(keyOf(e.segs)) || want.has(plain(e.segs))) {
        const a = flat[i].anatomy[idOf(e.segs)];
        if (!a) continue;
        if (l.kind === 'mainComponent' && holds && a.kind === 'instance') a.swappedBy = propId(figmaProps, p);
        if (l.kind === 'characters' && !holds && a.content === `{${propId(figmaProps, p)}}` && typeof e.node.text === 'string') a.content = e.node.text;
        // (and where it holds, its layer is its own: one layer two properties drive in turn, a field's placeholder while
        // empty and its value once filled, names in each variant the one that drives it there)
        if (l.kind === 'characters' && holds && e.node.type === 'TEXT' && a.kind === 'text') a.content = `{${propId(figmaProps, p)}}`;
      }
    });
  }
  // the one spelling first, so an instance and its component are compared alike
  for (const f of flat) normalForm(f.anatomy);
  // an empty auto layout's kept size stands only where no variant (a boolean's flipped tree among them) draws anything
  // in it: one that holds a layer elsewhere holds it hidden here, and its size is that layer's room, not its own
  // (a variant and its booleans' trees, each flipped from it: another variant filling a part of the same name says
  // nothing of this one's, a dialog's immersive content beside its default's empty one)
  const base = (i) => (trees[i].from != null && trees[i].from >= 0 ? trees[i].from : i);
  const filled = new Map();
  flat.forEach((f, i) => { const s = filled.get(base(i)) || new Set(); for (const x of Object.values(f.anatomy)) if (x && x.parent) s.add(x.parent); filled.set(base(i), s); });
  // (kept, the sizes say they hold only while the part is empty, `whileEmpty`: Figma's empty frame keeps the size it (figma-fact:empty-hug-keeps-size, believed)
  // last had, and the same frame filled hugs what it holds, which a minimum would not: a dialog's content 172 empty, 146
  // filled on a screen)
  // (nor where any variant places it inside an instance, whose component's own layers code draws there, hidden ones
  // among them; and a frame no slot holds, where any variant fills it: code draws every variant's layers in it, hidden
  // where another shows them, so it is never empty there. A caller fills a slot, so a slot's stands)
  const within = (a, k) => { for (let p = a[k] && a[k].parent; p; p = a[p] && a[p].parent) if (a[p] && a[p].kind === 'instance') return true; return false; };
  const placed = new Set(flat.flatMap((f) => Object.keys(f.anatomy).filter((k) => within(f.anatomy, k))));
  const anywhere = new Set(flat.flatMap((f) => Object.values(f.anatomy).map((x) => x && x.parent).filter(Boolean)));
  const slotty = (a, x) => x.kind === 'slot' || (a[x.parent] || {}).kind === 'slot';
  flat.forEach((f, i) => { for (const [k, x] of Object.entries(f.anatomy)) if (x && x.emptyKept) { if (filled.get(base(i)).has(k) || placed.has(k) || (!slotty(f.anatomy, x) && anywhere.has(k))) for (const m of x.emptyKept) delete x[m]; else x.whileEmpty = x.emptyKept; delete x.emptyKept; } });
  // an instance that clears its component's colour style or stroke says so (cleared), before its own styling is held to
  // its component's
  if (mains) for (const f of flat) cleared(f.anatomy, mains);
  // (`found`: a Map, by each variant's `when`, of the instances its insides are kept whole in)
  if (mains) for (const f of flat) { const here = found ? new Set() : null; ownInsides(f.anatomy, mains, { found: here }); if (found) found.set(JSON.stringify(f.when), [...here]); }
  return flat;
}

/* An instance's insides are its component's. The walk opens an instance wherever anything in it is overridden and
   then records all of it, its component's own layers with the override; so a contract held another component's
   layers, or not, by whether someone overrode something. With `mains` (a component's name → its contract), each
   opened instance is held to its own component, expanded at the instance's props: a layer inside it that is
   exactly the component's is the component's and left out; one that differs is an override and kept, with the
   layers above it. Only the component's own reading decides: where it has no contract, or no such layer, the layer
   is kept. (A contract annotation of the component's own props, swappedBy, says nothing of how a layer looks.) */
// (nor does an instance's key, a look a reading from code never has: two keys that differ are held apart in own())
const IGNORED = new Set(['parent', 'order', 'name', 'swappedBy', 'key']);
const look = (e) => j(Object.fromEntries(Object.entries(e).filter(([k]) => !IGNORED.has(k)).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));
/* An instance's own styling is its component's root's too: a field the instance states (its layout, corners, fill,
   stroke, effect, opacity, clipping, smoothing, min and max sizes) that equals its component's root at the instance's
   props is the component's, and left out, so code and a drawing leave it to the component and no sheet writes it
   twice. Its size is the placement's (fill, hug, a fixed width), kept. */
const OWN = ['layout', 'radius', 'background', 'fillStyle', 'border', 'shadow', 'opacity', 'overflow', 'smoothing', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'modes'];
/* The contract's one spelling of what two readings may say two ways, for every reader (derive, from-code): a stroke
   of one weight on all four sides is that weight (no sides). (An instance's prop at its component's default stays
   stated: to-figma picks the variant by it, and a nested instance's default is its holder's, not its component's; the
   comparison takes it as unstated, roundTrip's atDefault.) */
function normalForm(anatomy) {
  for (const [id, e] of Object.entries(anatomy)) {
    const b = e && e.border;
    // a stroke with a weight and no paint draws nothing: no stroke at all, as code and the drawing read it
    if (b && typeof b === 'object' && b.color == null) { const { border: _, ...rest } = e; anatomy[id] = rest; continue; }
    if (!b || (!Array.isArray(b.width) && !b.sides)) continue;
    const sides = b.sides ? ['top', 'end', 'bottom', 'start'].map((k) => b.sides[k]) : null;
    const w = Array.isArray(b.width) ? b.width : b.width !== undefined ? [b.width, b.width, b.width, b.width] : sides;
    const even = w && w.every((v) => j(v) === j(w[0])) && w[0] !== 0 && w[0] != null && (!sides || (sides.every((v) => v === sides[0]) && sides[0] !== 0));
    if (even) { const { sides: _, ...rest } = b; anatomy[id] = { ...e, border: { ...rest, width: w[0] } }; }
    // and a weight per side that only repeats the sides, plain numbers (code's [0, 0, 1, 0] beside a bottom of 1): the
    // sides alone, as Figma says a stroke whose weight no variable binds
    else if (sides && Array.isArray(b.width) && b.width.every((v, i) => typeof v === 'number' && v === (sides[i] || 0))) { const { width: _, ...rest } = b; anatomy[id] = { ...e, border: rest }; }
  }
  return anatomy;
}

// a value as JSON with every object's keys in order: two readings write a layout's fields in different orders
const sorted = (v) => JSON.stringify(v, (_, w) => (w && typeof w === 'object' && !Array.isArray(w) ? Object.fromEntries(Object.entries(w).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : w));
// one rule for every reading of a contract: derive's (Figma), from-code's (code)
function ownStyling(anatomy, mains) {
  for (const e of Object.values(anatomy)) {
    const m = e && e.kind === 'instance' && e.component && mains(e.component, e.key);
    if (!m) continue;
    const root = atProps(m, e.with).root;
    // (a layout with no padding and one of four zeros are one layout: a reading from code says no padding it finds none of)
    const one = (f, v) => (f === 'layout' && v && typeof v === 'object' && !v.padding ? { ...v, padding: { top: 0, end: 0, bottom: 0, start: 0 } } : v);
    // (a stroke stays said beside a shadow cleared: to-code writes both in one box-shadow, so `none` alone would drop it)
    if (root) for (const f of OWN) if (e[f] !== undefined && !(f === 'border' && e.shadow === CLEARED) && sorted(one(f, e[f])) === sorted(one(f, root[f]))) delete e[f];
  }
  return anatomy;
}
/* An instance that draws no colour style, or no stroke, where its component's root has one at the instance's props has
   cleared it (Figma's override: an instance's own fills or strokes replace its component's, the style with them; a
   stroke's paint hidden draws none). Unsaid, it would be its component's, so it is said `none` (CLEARED, rules.mjs);
   corners squared off where its component's root rounds them are said 0.
   Only a reading from Figma says it: the walk records an instance's own style and stroke wherever it has them. */
function cleared(anatomy, mains) {
  for (const e of Object.values(anatomy)) {
    const m = e && e.kind === 'instance' && e.component && mains(e.component, e.key);
    const root = m && atProps(m, e.with).root;
    if (!root) continue;
    if (typeof root.fillStyle === 'string' && root.fillStyle !== CLEARED && e.fillStyle === undefined) e.fillStyle = CLEARED;
    if (root.border && typeof root.border === 'object' && root.border.color != null && e.border === undefined) e.border = CLEARED;
    if (paintOf(root.background) && e.background === undefined) e.background = CLEARED;
    // (and corners: the walk records a radius wherever it is not 0, so none where its root has one is 0, squared off)
    if (cornered(root.radius) && e.radius === undefined) e.radius = 0;
    // (and a shadow: the walk records an instance's effect wherever it has one, so none where its root has one cleared it)
    if (typeof root.shadow === 'string' && root.shadow !== CLEARED && e.shadow === undefined) e.shadow = CLEARED;
  }
  return anatomy;
}
// a radius that rounds a corner (0, or four zeros, rounds none)
const cornered = (v) => v != null && v !== 0 && !(Array.isArray(v) && v.every((x) => x === 0));
// a paint a part draws (a cleared one, none, draws nothing)
const paintOf = (v) => v != null && v !== CLEARED && !(Array.isArray(v) && !v.length);
/* The one colour a placed component draws its glyph in at the instance's props: the background of its root's graphic
   children, where they hold one colour (an icon's vector, a slot placeholder's fill), else null. to-code writes it on
   the instance (its color), so a reading that finds it there reads the component's own colour, no override (from-code). */
function glyphColour(m, withProps) {
  const glyphs = [...new Set(Object.values(atProps(m, withProps)).filter((x) => x.parent === 'root' && x.kind === 'graphic' && typeof x.background === 'string').map((x) => x.background))];
  return glyphs.length === 1 ? glyphs[0] : null;
}
/* A placed component as one of its instances draws it: at the instance's props, each swap it states applied (the
   target's own drawing where the library holds it), its own nested instances' styling left to theirs, and each part
   keyed as the instance names its layer (asPlaced). `swapped`: the swapped parts whose drawing is not the library's;
   `back`: each key to the component's own. */
function placedAs(anatomy, id, m, mains) {
const e = anatomy[id];
let M = { ...atProps(m, e.with) };
  // the parts whose styling stays as walked (asWalked, below), by key here: each to the components it was walked as
  const walked = new Map();
  const walkedOf = (c, at = (k) => k) => { const A = RAW.has(c) ? null : c.asWalked || {}; return (k, x) => (A ? (A[k] || []).includes(walkedAs(x)) : true) && walked.set(at(k), true); };
  { const w = walkedOf(m); for (const [k, x] of Object.entries(M)) if (x && x.kind === 'instance') w(k, x); }
  // a swap the instance states (Icon: folder) draws that component where the swap points: compared so, its glyph
  // the swapped icon's own drawing, so only what an instance can override there (its colour) is compared
  const low = (x) => String(x).toLowerCase(), swapped = [];
  for (const [pk, q] of Object.entries(m.props || {})) {
    if (q.type !== 'instance' || !(q.swaps || []).length) continue;
    const w = Object.entries(e.with || {}).find(([k]) => low(bareProp(k)) === low(q.figma || pk));
    if (!w) continue;
    for (const sid of q.swaps) {
      if (!M[sid] || !M[sid].component) continue;
      // a swap names its target by its own name (x), or by its name in its main's folder (Icon/x); the instance placed
      // there says which, where its name ends in that one
      const set = M[sid].component.split('/').slice(0, -1).join('/'), v = String(w[1]), placed = (anatomy[`${id}/${sid}`] || {}).component;
      const target = placed && (low(placed) === low(v) || low(placed).endsWith(`/${low(v)}`)) ? placed : v.includes('/') || !set ? v : `${set}/${v}`;
      // and its key: the placed instance's where it is the target, else none known (the main's own icon's is not it)
      const { key: _k, ...was } = M[sid], tkey = target === placed ? (anatomy[`${id}/${sid}`] || {}).key : null;
      M[sid] = { ...was, component: target, ...(tkey && { key: tkey }) };
      // the target's own drawing where this library holds it (its insides are what the swap draws); else only its colour
      const T = mains(target, tkey);
      if (T) {
        const tA = atProps(T, M[sid].with);
        for (const k of Object.keys(M)) if (k.startsWith(`${sid}/`)) delete M[k];
        for (const k of walked.keys()) if (k.startsWith(`${sid}/`)) walked.delete(k);
        for (const [tk, te] of Object.entries(tA)) if (tk !== 'root') M[`${sid}/${tk}`] = { ...te, parent: !te.parent || te.parent === 'root' ? sid : `${sid}/${te.parent}` };
        // (its parts as walked by its own contract's word)
        { const w = walkedOf(T, (k) => `${sid}/${k}`); for (const [tk, te] of Object.entries(tA)) if (tk !== 'root' && te && te.kind === 'instance') w(tk, te); }
        continue;
      }
      swapped.push(sid);
    }
  }
  // the component as placed (its swaps applied), its own nested instances' styling left to theirs, as this one's was;
  // each part under the name its layer has in the instance (a part a boolean shows is named for it in its own
  // contract, for its layer alone here)
  const placed = asPlaced(M), keyOf = Object.fromEntries(Object.entries(placed.back).map(([k, v]) => [v, k]));
  M = placed.M;
  for (let i = 0; i < swapped.length; i++) swapped[i] = keyOf[swapped[i]] || swapped[i];
  // (an instance of it that clears its own component's style or stroke says none, as derive says it of a host's: cleared;
  // only where the component was read without mains, whose instances keep the style they draw, so one with none cleared
  // it. One read with mains, as a store keeps it, already says none where an instance cleared, and an unsaid style there
  // is its component's, left out by ownStyling: read as cleared, it was a none no instance said)
  // A contract read with mains lists the instances its mains did not resolve (asWalked: another library's, or one whose
  // main threw), each with the components it was walked as there, which keep their style as walked too, so they are
  // cleared here as well; a swap target's parts by its own contract's list)
  if (walked.size) cleared(Object.fromEntries(Object.entries(M).filter(([k]) => walked.has(placed.back[k] || k))), mains);
  ownStyling(M, mains);
  return { M, swapped, back: placed.back };
}

/* `partial`: a reading that holds only some of an instance's layers (from-code reads the ones a contract keeps): no layer
   it lacks says the instance hides one, so none is kept whole for it; each it holds goes where it equals its component's */
/* An arc in the one form both sides are compared in (to-figma's arcs): its start on the turn and its end that start
   plus the sweep, a whole turn 360, so a sweep from 270 that Figma ends at 0 and code at 360 is one arc. */
const arcTurn = (a) => +((((a % 360) + 360) % 360).toFixed(2));
function arcForm(y) {
  if (!y || !y.arc) return y;
  const start = arcTurn(y.arc.start), sweep = arcTurn(y.arc.end - y.arc.start) || 360;
  return { ...y, arc: { ...y.arc, start, end: +(start + sweep).toFixed(2) } };
}

/* A glyph a reading from code marks where a placed component draws an icon's instance (to-markup's data-icon="Information",
   read as a graphic naming its asset), held to that instance: from-code names it the instance (its asIcon) only after
   this cut, so compared as the graphic it was, it differed from its component's own in every combination and was kept as
   an override the design never states (Carbon's Toggletip's Information inside every field's label). The asset is the
   instance's component by its last name, as asIcon joins them; its mark's size is the icon's Size. Only for a reading. */
function asGlyphOf(e, x, reading) {
  const last = (v) => String(v).split('/').pop().toLowerCase();
  if (!reading || !e || e.kind !== 'graphic' || !e.asset || !x || x.kind !== 'instance' || !x.component || last(e.asset) !== last(x.component)) return e;
  const { asset: _, iconSize, ...rest } = e;
  return { ...rest, kind: 'instance', component: x.component, ...(iconSize != null && { with: { ...(rest.with || {}), Size: iconSize } }) };
}
// a part without the size it keeps only while empty (whileEmpty): an instance's layer keeps none (anatomies), so its
// component's part is compared without it
const emptyless = (e) => { if (!e || !e.whileEmpty) return e; const r = { ...e }; for (const f of e.whileEmpty) delete r[f]; delete r.whileEmpty; return r; };
function ownInsides(anatomy, mains, { partial = false, whole = new Set(), coloured = null, reading = false, found = null } = {}) {
  ownStyling(anatomy, mains);
  for (const id of Object.keys(anatomy)) {
    const e = anatomy[id];
    if (!e || e.kind !== 'instance' || !e.component) continue;
    const m = mains(e.component, e.key);
    if (!m) { ownGlyph(anatomy, id); continue; }
    const { M, swapped } = placedAs(anatomy, id, m, mains);
    const SHAPE_OF = new Set(['width', 'height', 'constraints']);
    const inner = Object.keys(anatomy).filter((k) => k.startsWith(id + '/'));
    if (!inner.length) continue;
    // a layer of the component the instance does not draw (hidden: the walk records what shows) is an override no
    // layer here can say: the instance is kept whole. A layer inside a nested instance this one draws is not hidden: that
    // instance's insides are its own component's (left out above, as an icon's glyph is), not missing; unless the walk
    // opened that instance (it records an instance's insides only where one is overridden, and then only those that
    // show), when a layer missing there is hidden after all
    const match = placedMatch(M, Object.fromEntries(inner.map((k) => [k.slice(id.length + 1), anatomy[k]])));
    const drawnAs = new Set(Object.values(match));
    const opened = (up) => Object.values(match).some((mk) => mk.startsWith(`${up}/`));
    const delegated = (mk) => mk.split('/').slice(0, -1).some((_, i, a) => { const up = a.slice(0, i + 1).join('/'); return M[up] && M[up].kind === 'instance' && drawnAs.has(up) && !opened(up); });
    // a slot's sample children are what the component shows until a caller fills it: an instance that fills it otherwise
    // hides none of them; one left unfilled shows its samples, so a sample not drawn there is hidden after all
    const filled = (p) => { const k = Object.keys(match).find((r) => match[r] === p); return !!k && inner.some((x) => anatomy[x].parent === `${id}/${k}` && !match[x.slice(id.length + 1)]); };
    const sampled = (mk) => { for (let p = M[mk] && M[mk].parent; p && p !== 'root'; p = M[p] && M[p].parent) if (M[p] && M[p].kind === 'slot') return filled(p); return false; };
    // an icon coloured as code colours it (on the instance, or the svg that stands for it until from-code's asIcon; no
    // glyph read) at the colour its component gives the one
    // glyph inside it (Figma's way) is its component's, which Figma does not say on the instance: to-figma's glyph
    // equivalence, for a reading (from-code); not in an instance the design keeps whole where the design states a colour
    // for that icon or its glyph (`coloured`: the layers it states one for; none given, every layer there), so the reading
    // keeps the icon's (Carbon's select chevron); one it states none for there is its component's still (Carbon's Status
    // notification's Warning--filled, kept whole in a slider's error state)
    const states = (k) => !coloured || [...coloured].some((c) => c === k || c.startsWith(`${k}/`));
    if (reading) for (const k of inner) {
      if (whole.has(id) && states(k)) continue;
      const e = anatomy[k], mk = match[k.slice(id.length + 1)], x = mk && M[mk];
      if (!x || x.kind !== 'instance' || !['instance', 'graphic'].includes(e.kind) || e.background == null || x.background != null || inner.some((q) => q.startsWith(k + '/'))) continue;
      const kids = Object.keys(M).filter((q) => M[q] && M[q].parent === mk), g = kids.length === 1 && M[kids[0]];
      if (g && g.kind === 'graphic' && g.background === e.background) { const { background: _, ...rest } = e; anatomy[k] = rest; }
    }
    // a layer's constraints with no position of its own, equal to its component's part at the instance's props, are
    // that component's (an instance cannot override them, figma-fact: no-nested-position-override; a glyph's scale both
    // ways was kept only for ownGlyph, which runs on an instance with no component here): left out, after the
    // comparison below, which reads them as walked; one that differs is kept
    const sameCons = (a, b) => !!a && !!b && a.horizontal === b.horizontal && a.vertical === b.vertical;
    // (only where this instance is the nearest one above: a layer of an instance nested in it is left to that instance's
    // own turn, so an icon's glyph keeps its scale until ownGlyph folds it)
    const host = (k) => { for (let up = (anatomy[k] || {}).parent; up; up = (anatomy[up] || {}).parent) if ((anatomy[up] || {}).kind === 'instance') return up; return null; };
    const inherit = () => { for (const k of inner) { if (host(k) !== id) continue; const e = anatomy[k], mk = match[k.slice(id.length + 1)], x = mk && M[mk]; if (e && e.constraints && !e.absolute && x && keyMatches(e.key, x.key) && sameCons(e.constraints, x.constraints)) { const { constraints: _, ...rest } = e; anatomy[k] = rest; } } };
    // (`whole`: instances the design keeps whole, so a reading keeps what it reads there too)
    // (`found`: where given, collects the instances kept whole for a layer they hide, so a drawing hides there what
    // the contract does not list, and nowhere else)
    if (whole.has(id)) { inherit(); continue; }
    if (!partial && Object.keys(M).some((mk) => mk !== 'root' && !drawnAs.has(mk) && !delegated(mk) && !sampled(mk))) { if (found) found.add(id); inherit(); continue; }
    const own = (k) => {
      // (a vector's paths are its component's: the walk records none inside an instance, snapshot 0.86.0, so a placed
      // layer is held to its part without them where it states none)
      const mk = match[k.slice(id.length + 1)], x1 = mk && M[mk], x0 = x1 && emptyless(x1), x = x0 && x0.paths && !anatomy[k].paths ? (({ paths: _, ...r }) => r)(x0) : x0;
      // (a key is no look, but two that differ are two components: a swap to another library's Icon of one name)
      if (!x || !keyMatches(anatomy[k].key, x.key)) return false;
      // (a layer of an instance nested in this one has its position-less constraints left out at that instance's own
      // turn, as this component's own contract already has them: compared so, where the component's part has none)
      const y0 = asGlyphOf(anatomy[k], x, reading);
      const y = host(k) !== id && y0.constraints && !y0.absolute && !x.constraints ? (({ constraints: _, ...r }) => r)(y0) : y0;
      if (swapped.some((s) => mk.startsWith(s + '/'))) { const bare = (o) => Object.fromEntries(Object.entries(o).filter(([f]) => !SHAPE_OF.has(f))); return look(arcForm(bare(y))) === look(arcForm(bare(x))); }
      if (look(arcForm(y)) === look(arcForm(x))) return true;
      // a part pinned to its parent's far edge (bottom, end) stands where the parent's size puts it: its near offset
      // follows from that size (a footer pinned to the bottom of a dialog the instance makes taller), so it is no
      // override; compared without it
      const pinned = (y) => { if (!y.absolute) return y; const c = y.constraints || {}, a = { ...y.absolute };
        if (c.vertical === 'max' && a.bottom != null) delete a.y; if (c.horizontal === 'max' && a.end != null) delete a.x; return { ...y, absolute: a }; };
      if (look(arcForm(pinned(y))) === look(arcForm(pinned(x)))) return true;
      // an icon's size said by its width, as code says it (a Size that is its width and height): to-figma's iconSize
      // equivalence, for a reading (from-code)
      const sized = (y) => { const { Size, ...w } = y.with || {}; const same = Size != null && String(Size) === String(y.width) && y.width === y.height; const { with: _, ...r } = y; return same ? (Object.keys(w).length ? { ...r, with: w } : r) : y; };
      // and its place and constraints where the reading states none, which no instance can
      // override (figma-fact: no-nested-position-override): code reads none where the component places a layer in a frame (Atlassian's
      // Checkbox icon's box at 1, 1, scaled), so their absence is the component's own; one the reading does state is
      // compared, so a part code places elsewhere stays a difference (a design's are compared as walked, above)
      const unstated = (m, by) => { const r = { ...m }; for (const f of ['absolute', 'constraints']) if (by[f] === undefined) delete r[f]; return r; };
      return reading && look(arcForm(sized(y))) === look(arcForm(unstated(sized(x), y)));
    };
    const kept = new Set(inner.filter((k) => !own(k)));
    for (const k of inner) if (!kept.has(k) && ![...kept].some((x) => x.startsWith(k + '/'))) delete anatomy[k];
    // a layer kept that draws no fill where its component's part has one has cleared it (an instance's override: its
    // fills emptied, or at no opacity, which the walk does not record): said none, or a reader would take the part's
    // unsaid fill as its component's (Carbon's read-only time picker's field background)
    // (Figma's reading only: one from code says a fill cleared only where it saw one painted clear, readCleared)
    if (!reading) for (const k of kept) {
      const e = anatomy[k], mk = match[k.slice(id.length + 1)], x = mk && M[mk];
      if (e && x && e.kind !== 'instance' && e.background === undefined && paintOf(x.background)) e.background = CLEARED;
    }
    // a placed layer this component clears the style or stroke of (none) that draws its own component's again: its own
    // styling, left out above as that component's, is said, or it would read as this one's none (a reading from code
    // reads no colour style, so only Figma's)
    if (!reading) for (const k of kept) {
      const e = anatomy[k], mk = match[k.slice(id.length + 1)], x = mk && M[mk];
      const R = x && e && e.kind === 'instance' && e.component && (mains(e.component, e.key) ? atProps(mains(e.component, e.key), e.with).root : null);
      if (R) for (const f of ['fillStyle', 'border', 'background', 'shadow']) if (x[f] === CLEARED && e[f] === undefined && R[f] !== undefined) e[f] = R[f];
      if (R && x.radius === 0 && e.radius === undefined && cornered(R.radius)) e.radius = R.radius;
    }
    inherit();
  }
}

/* A component's parts keyed as an instance of it names them: its own contract names a part by its layer's address, and
   where that cannot say the layer's name back (a part a boolean shows is named for the prop too: showIconIcon) it
   records the name; an instance's walk names that layer by its name alone (icon). Each segment so renamed, unless two
   parts would meet under one key, when both keep their own. `back` maps each key to the component's own. */
function asPlaced(M) {
  // built from the top down: a part keeps its own name where its renamed one would meet another's, and what is under it
  // follows its parent's key, so a key and its parent's always agree
  const last = (mk) => { const x = M[mk], s = mk.slice(mk.lastIndexOf('/') + 1); return x && x.name ? camel(x.name) : s; };
  const memo = new Map();
  const keyOf = (mk) => {
    if (mk === 'root' || !mk.includes('/') && !M[mk]) return mk;
    if (memo.has(mk)) return memo.get(mk);
    const up = mk.includes('/') ? mk.slice(0, mk.lastIndexOf('/')) : null, base = up ? `${keyOf(up)}/` : '';
    const sibs = Object.keys(M).filter((o) => o !== mk && o !== 'root' && (o.includes('/') ? o.slice(0, o.lastIndexOf('/')) : null) === up);
    const mine = last(mk), meets = sibs.some((o) => last(o) === mine || o.slice(o.lastIndexOf('/') + 1) === mine);
    const k = base + (meets ? mk.slice(mk.lastIndexOf('/') + 1) : mine);
    memo.set(mk, k);
    return k;
  };
  const out = {}, back = {};
  for (const [mk, x] of Object.entries(M)) {
    const k = keyOf(mk);
    out[k] = x.parent && x.parent !== 'root' ? { ...x, parent: keyOf(x.parent) } : x;
    back[k] = mk;
  }
  return { M: out, back };
}

/* Each layer an instance records inside it (`inner`, keyed by its address under the instance) matched to the part of
   its component it is (`M`, as asPlaced keys it): by name, else, for a layer renamed in the instance, by its place:
   the one part of the same kind at the same order under the part its parent matched, that no layer here names. */
function placedMatch(M, inner) {
  const match = {}, taken = new Set(Object.keys(inner).filter((k) => M[k]));
  for (const k of Object.keys(inner).sort((x, y) => x.split('/').length - y.split('/').length)) {
    if (M[k]) { match[k] = k; continue; }
    const up = k.includes('/') ? k.slice(0, k.lastIndexOf('/')) : 'root', mp = up === 'root' ? 'root' : match[up];
    // a slot's children are what a caller puts there, never its sample renamed
    if (!mp || (M[mp] && M[mp].kind === 'slot')) continue;
    const e = inner[k], at = Object.keys(M).filter((mk) => mk !== 'root' && (M[mk].parent || 'root') === mp && M[mk].kind === e.kind && (M[mk].order ?? 0) === (e.order ?? 0) && !taken.has(mk));
    if (at.length === 1) { match[k] = at[0]; taken.add(at[0]); }
  }
  return match;
}

/* An instance of a component this library does not hold (an icon from its own set) that draws one graphic, scaled to
   the instance on both axes: that graphic's size is its component's drawing, not an override the instance states, so
   only what the instance overrides there (its colour) is kept. The drawing places the component by reference, and
   code draws the glyph at the instance's size: neither says the graphic's own box. The limit: the snapshot holds no
   drawing of such an icon to hold the box to, so a size a designer did override on that graphic goes too. */
function ownGlyph(anatomy, id) {
  const inner = Object.keys(anatomy).filter((k) => k.startsWith(id + '/'));
  const g = inner.length === 1 && anatomy[inner[0]];
  if (!g || g.kind !== 'graphic' || g.parent !== id || !g.constraints || g.constraints.horizontal !== 'scale' || g.constraints.vertical !== 'scale') return;
  const { width, height, constraints, ...rest } = g;
  anatomy[inner[0]] = rest;
  // and the icon's frame clipping its glyph is the icon's own too: a glyph code draws is cut to its own box (an svg's)
  if (anatomy[id].overflow === 'hidden') delete anatomy[id].overflow;
}

/* A component as one of its instances draws it: its contract expanded at the instance's props (`with`, by Figma's
   names; an enum by Figma's own spelling of its value), each text prop's placeholder its words there, else the
   prop's default. One reading for derive (an instance's insides held to it) and to-code (what a placed icon draws in). */
function atProps(m, withProps = {}) {
  const low = (x) => String(x).toLowerCase();
  const by = Object.fromEntries(Object.entries(m.props || {}).map(([k, q]) => [low(q.figma || k), k]));
  const vals = { ...variantDefaults(m) };
  for (const [k, v] of Object.entries(withProps || {})) {
    const mk = by[low(bareProp(k))];
    if (!mk) continue;
    const q = m.props[mk];
    const at = q.type === 'enum' && (q.figmaValues || []).findIndex((x) => low(x) === low(v));
    vals[mk] = q.type === 'boolean' ? v === true || low(v) === 'true' : q.type === 'enum' ? (at >= 0 ? q.values[at] : q.values.find((x) => low(x) === low(v)) ?? kebab(String(v))) : v;
  }
  const M = expand(m, vals);
  const words = (t) => {
    const r = /^\{(.+)\}$/.exec(t || ''), q = r && m.props[r[1]];
    if (!q) return t;
    const w = Object.entries(withProps || {}).find(([k]) => low(bareProp(k)) === low(q.figma || r[1]));
    return w ? w[1] : q.default ?? t;
  };
  for (const [k, x] of Object.entries(M)) if (x && typeof x.content === 'string') M[k] = { ...x, content: words(x.content) };
  return M;
}

/* A lookup of components' contracts by name, for derive's `mains`: each derived once, from its own spec, without
   `mains` itself (a component is held to its own component's reading as that reading stands). `specs` maps a name
   to its stored spec. */
/* A library's components by name, as every reader looks one up: its whole name in any case, and none where two share
   a name (a web and a mobile Button). `contracts` is a list of contracts. */
function byComponentName(contracts) {
  const low = (x) => String(x).toLowerCase(), count = {};
  for (const c of contracts) count[low(c.component)] = (count[low(c.component)] || 0) + 1;
  const by = new Map(contracts.filter((c) => count[low(c.component)] === 1).map((c) => [low(c.component), c]));
  const byKey = new Map(contracts.filter((c) => c.figma && c.figma.key).map((c) => [c.figma.key, c]));
  // by its key where one is given and held; else by name, never the one a key says it is not
  const found = (name, key = null) => (key && byKey.get(key)) || [by.get(low(name)) || null].filter((c) => c && keyMatches(c.figma && c.figma.key, key))[0] || null;
  // whether the snapshot recorded what props drive (its links, plugin 0.50.0 on): some text or swap of the library says so
  found.linked = contracts.some((c) => Object.values(c.props || {}).some((q) => (q.sets || []).length || (q.swaps || []).length));
  return found;
}
function mainsFrom(specs, known = [], optionsOf = () => ({})) {
  const done = new Map(), low = (x) => String(x).toLowerCase();
  // (a name two specs share, a web and a mobile Button, is no one component: left unresolved, its instances kept whole)
  const count = {};
  for (const n of Object.keys(specs)) count[low(n)] = (count[low(n)] || 0) + 1;
  const byName = new Map(Object.entries(specs).filter(([n]) => count[low(n)] === 1).map(([n, sp]) => [low(n), [n, sp]]));
  const byKey = new Map(Object.entries(specs).filter(([, sp]) => sp && sp.key).map(([n, sp]) => [sp.key, [n, sp]]));
  return (name, key = null) => {
    // by its key where one is given and held; else by its whole name only (Icons/Close is not this library's Close), and
    // never a component the key says it is not (an icon named Checkbox is not the Checkbox set)
    const named = byName.get(low(name));
    const hit = (key && byKey.get(key)) || (named && keyMatches(named[1].key, key) ? named : null);
    if (!hit) return null;
    if (!done.has(hit[0])) { try { done.set(hit[0], derive(hit[1], known, optionsOf(hit[0]))); } catch { done.set(hit[0], null); } }
    return done.get(hit[0]);
  };
}

/* `known` is every stored component name, so an instance of `Table - Cell / Fill`
   resolves to that set and not to `Table - Cell` (graph.cjs nameOf). */
// the contracts derived here without `mains` (mainsFrom's): their instances' styling is as walked, never pruned to
// their components' (placedAs)
const RAW = new WeakSet();
// an instance as mains looked it up: its component's name, and its key where it has one (`Box#k1`), since mains resolve
// by key first and refuse a name of another key
const walkedAs = (e) => (e.key ? `${e.component}#${e.key}` : e.component);
function derive(stored, known = [], options = {}) {
  // a part turned a quarter is said in its own axes only where code draws it in a wrapper (to-code.mjs turnedParts, one
  // rule for the contract, the code and the drawing): found on the contract said without the swap, then said again
  const first = deriveWith(stored, known, options, null);
  const turned = turnedOf(first);
  const out = turned.size ? deriveWith(stored, known, options, turned) : first;
  if (!options.mains) RAW.add(out);
  return out;
}
const turnedOf = (contract) => require('./to-code.mjs').turnedParts(contract);
function deriveWith(stored, known, { stateAxis = HOUSE.stateAxis || null, pointerStates = HOUSE.pointerStates || [], mains = null, found = null, modeAxes = [] } = {}, turned = null) {
  const pointer = new Set(pointerStates.map(kebab));
  const { spec, trees, hides, characters } = read(stored);
  const figmaProps = spec.props || {};
  const L = spec.links || {};
  const flat = anatomies(trees, characters, known, L, mains, found, modeAxes, figmaProps, turned);
  const addresses = new Map();
  for (const t of trees) for (const e of t.list) addresses.set(keyOf(e.segs), e.segs);
  const base = flat[0];
  // a text prop's default: the words its layer holds in the default variant
  const words = new Map();
  // (or, where its layer is hidden there, Show caption off, in the first variant that shows it: a text property's
  // default is the set's, so every variant that draws the layer holds the same words)
  // (only where the property drives the layer: a set that binds it in some variants only, snapshot 0.61.0 on, leaves the
  // rest their own words, as anatomies does)
  // (the link found by the layer it names, as anatomies finds it, and by the prop that layer is read as)
  const drives = (prop, segs, t) => { const l = (Object.entries(L).find(([k, x]) => x.kind === 'characters' && propId(figmaProps, k) === prop && x.layers.some((at) => [keyOf(segs), plain(segs)].includes(keyOf([].concat(at))))) || [])[1]; return !l || !l.variants || l.variants.map(valuesOf).some((w) => Object.entries(w).every(([k, v]) => t.when[k] === v)); };
  for (const t of trees) for (const { node, segs } of t.list) {
    // (every property that drives the layer, where one layer takes two in turn)
    const props = Object.entries(L).filter(([, x]) => x.kind === 'characters' && x.layers.some((at) => [keyOf(segs), plain(segs)].includes(keyOf([].concat(at))))).map(([k]) => propId(figmaProps, k));
    // (only where each link says the variants it drives in, snapshot 0.61.0 on: before, one property takes the layer, as anatomies has it)
    const each = props.length > 1 && props.every((pr) => { const l = Object.entries(L).find(([k, x]) => x.kind === 'characters' && propId(figmaProps, k) === pr); return l && l[1].variants; });
    for (const prop of each ? props : [characters.get(keyOf(segs)) || characters.get(plain(segs))].filter(Boolean))
      if (node.type === 'TEXT' && typeof node.text === 'string' && !words.has(prop) && drives(prop, segs, t)) words.set(prop, node.text);
  }

  // props: an enum's default is the default variant's value, a boolean's the
  // opposite of the value its walked trees were flipped to
  const props = {};
  for (const [p, t] of Object.entries(figmaProps)) {
    const id = propId(figmaProps, p);
    // drawn as False/True variants, said so: the invalid list, folded, need not name it
    // (and Figma's spelling and order of its two options where they are not False, True: isDisabled=false)
    if (isFlag(t)) props[id] = { type: 'boolean', default: valueFor(figmaProps, p, base.when[p] ?? 'False'), axis: true, ...(t.join() === 'False,True' ? {} : { figmaValues: [...t] }) };
    else if (Array.isArray(t)) {
      props[id] = { type: 'enum', values: valueIds(t), default: valueFor(figmaProps, p, base.when[p] ?? t[0]) };
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
  const whenOf = (w) => ({ ...defaults, ...Object.fromEntries(Object.entries(w).filter(([p]) => p in figmaProps).map(([p, v]) => [propId(figmaProps, p), valueFor(figmaProps, p, v)])) });
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
  const axes = Object.entries(figmaProps).filter(([, t]) => Array.isArray(t)).map(([p]) => propId(figmaProps, p));
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
  // the instances `mains` did not resolve (another library's component, or one whose main threw): no none was said of
  // them and their styling stays as walked, so a reader placing this component reads their unsaid style as cleared
  // (placedAs); every other instance's none is already said, and an unsaid style there is its component's
  if (mains) {
    // (each with the components it was walked as, by name and key: a variant whose part names a component mains resolved is not walked)
    const walked = {};
    for (const f of flat) for (const [id, e] of Object.entries(f.anatomy)) if (e && e.kind === 'instance' && e.component && (e.fillStyle === undefined || e.border === undefined)) { const m = mains(e.component, e.key); if (!m || !atProps(m, e.with).root) walked[id] = [...new Set([...(walked[id] || []), walkedAs(e)])].sort(); }
    if (Object.keys(walked).length) contract.asWalked = Object.fromEntries(Object.entries(walked).sort(([a], [b]) => (a < b ? -1 : 1)));
  }
  return contract;
}


/* Every stored variant, rebuilt from the contract and compared with the
   anatomy the snapshot draws: [] when the contract carries all of it. */
function selfCheck(stored, contract, known = [], options = {}) {
  contract = contract || derive(stored, known, options);
  const { spec, trees, characters } = read(stored);
  const figmaProps = spec.props || {};
  const flat = anatomies(trees, characters, known, spec.links || {}, options.mains || null, null, options.modeAxes || [], figmaProps, turnedOf(contract));
  const bad = [];
  for (const [i, t] of trees.entries()) {
    const when = Object.fromEntries(Object.entries(t.when).filter(([p]) => p in figmaProps).map(([p, v]) => [propId(figmaProps, p), valueFor(figmaProps, p, v)]));
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
const loose = (key) => key.split(SEP).map((s) => s.trim().toLowerCase()).join(SEP);
function bridge(stored) {
  const { trees } = read(stored);
  const paths = {}, ids = {}, owner = {}, clashes = [];
  const add = (map, k, v) => { (map[k] = map[k] || new Set()).add(v); };
  for (const t of trees) {
    const at = new Map([[t.tree, '$root']]);
    layerPaths(t.tree, (node, p) => { at.set(node, p); });
    for (const e of t.list) {
      const id = idOf(e.segs);
      const key = keyOf(e.segs.map((s) => s.replace(/#.*$/s, '')));
      // two names one id are said as a clash, since the id cannot say which name; where they differ only in case or
      // surrounding space (`Text overflow`, `Text Overflow`, `Accordion content `) they are one part, kept at both paths;
      // otherwise (`Text-overflow`; two scripts that fold to `layer`) two layers, the second path left out
      if (owner[id] !== undefined && owner[id] !== key) {
        clashes.push(`${id}: ${owner[id].split(SEP).join(' > ')} and ${key.split(SEP).join(' > ')}`);
        if (loose(owner[id]) !== loose(key)) continue;
      } else owner[id] = key;
      const p = at.get(e.node);
      if (p == null) continue;
      add(paths, id, p);
      add(ids, p, id);
    }
  }
  const out = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, [...v].sort()]));
  // each prop by its contract id, with its Figma name and each option by the value the contract spells it (valueFor)
  const figmaProps = resolve(stored).props || {};
  const props = Object.fromEntries(Object.entries(figmaProps).map(([p, t]) => [propId(figmaProps, p), { figma: p,
    ...(Array.isArray(t) && { values: Object.fromEntries(t.map((v) => [String(valueFor(figmaProps, p, v)), v])) }) }]));
  return { paths: out(paths), ids: out(ids), props, clashes: [...new Set(clashes)] };
}

/* The placed instances a contract keeps whole (one hides a layer no prop shows, so derive kept layers equal to its
   component's), over every variant at once: each whose insides the reading's own cut (ownInsides, partial, `reading`)
   would shrink. One source for from-code, which keeps them whole in its reading, and to-figma's roundTrip, which fills
   no part of one (a part code did not draw there stays missing). With the reading's cut: Carbon's Status notification,
   kept whole in a slider's error state with its glyph's place unstated, read as nothing to drop under a cut that held
   place against its component. `mains` is byComponentName over the library. */
function wholeHosts(contract, mains) {
  if (!contract || !mains) return new Set();
  return wholeIn(Object.assign({}, ...[...(contract.variants || [])].reverse().map((v) => v.add || {}), contract.anatomy || {}), mains, { reading: true });
}
/* The same question of one anatomy (one variant's flat): the instances whose insides a partial cut would shrink, with the
   reading's equivalences where it is a reading's (`reading`), else derive's own, as a drawing of the design is. */
function wholeIn(all, mains, { reading = false } = {}) {
  const out = new Set();
  for (const [id, x] of Object.entries(all || {})) {
    if (!x || x.kind !== 'instance' || !mains(x.component, x.key)) continue;
    const sub = Object.fromEntries(Object.entries(all).filter(([k]) => k === id || k.startsWith(`${id}/`)).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]));
    const n = Object.keys(sub).length;
    ownInsides(sub, mains, { partial: true, reading });
    if (Object.keys(sub).length < n) out.add(id);
  }
  return out;
}

module.exports = { derive, expand, selfCheck, SHAPE, variantDefaults, bridge, fold, mainsFrom, atProps, glyphColour, ownStyling, OWN, normalForm, byComponentName, ownGlyph, ownInsides, asPlaced, placedMatch, placedAs, wholeHosts, wholeIn };
