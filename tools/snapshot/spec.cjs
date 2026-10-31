/*
 * The shape a component spec has on disk, and the only code that reads or
 * writes it — in the toolkit and in every project repo, which require this
 * file rather than keep a copy. There were two copies, one per repo, already
 * diverging in comments and one guard; a third for the toolkit's own store
 * would have been the drift this module exists to prevent.
 *
 * A component has many variants and they are nearly identical: a Hover variant
 * differs from its Rest sibling by a fill. Stored in full, a library of 25
 * components is tens of thousands of lines in which a one-property change reads
 * as thirty changed variants, and the diff — the thing the loop exists to make
 * legible — becomes the thing nobody can read.
 *
 * So: one full `default` variant, and every other variant as only what differs
 * from it, layer by layer. A variant whose layer TREE is a different shape (a
 * layer added, removed or reordered) cannot be a delta against the default and
 * is kept in full; later variants of that same shape delta against it, naming
 * it in `base`.
 *
 * Readers call resolve() and always see full trees. Writers call compact().
 * test-spec.cjs round-trips both, because a compressed form whose reader and
 * writer disagree corrupts the diff everyone trusts, silently.
 */

// Identity, never a difference: a variant is named by its own axes, and every
// node keeps its own name and type so a delta can be applied positionally.
const KEEP = new Set(['name', 'type']);

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/*
 * Two trees have the same shape when their children line up by name and type,
 * all the way down. `root` skips the name check at the top, because the root is
 * named for its variant (`Size=lg, State=Rest`) and would never match.
 */
const sameShape = (a, b, root) =>
  (root || a.name === b.name) &&
  a.type === b.type &&
  (a.children || []).length === (b.children || []).length &&
  (a.children || []).every((c, i) => sameShape(c, b.children[i]));

/*
 * What `node` has that `base` does not, recursed. Returns null when nothing
 * differs, so an untouched branch costs nothing on disk.
 *
 * A key present in base and absent from node is recorded as `null` — "delete
 * this" — because absence is a real difference: a variant that drops the
 * default's shadow is not a variant that says nothing about shadows.
 */
function diffNode(base, node) {
  const out = {};
  let any = false;
  for (const k of new Set([...Object.keys(base), ...Object.keys(node)])) {
    if (k === 'children' || KEEP.has(k)) continue;
    if (!same(base[k], node[k])) { out[k] = k in node ? node[k] : null; any = true; }
  }
  const kids = (node.children || []).map((c, i) => diffNode(base.children[i], c));
  if (kids.some(Boolean)) { out.children = kids; any = true; }
  return any ? out : null;
}

function applyNode(base, delta) {
  const out = { ...base };
  if (base.children) out.children = base.children.map((c, i) => applyNode(c, delta && delta.children ? delta.children[i] : null));
  if (!delta) return out;
  for (const [k, v] of Object.entries(delta)) {
    if (k === 'children') continue;
    if (v === null) delete out[k]; else out[k] = v;
  }
  return out;
}

/** Full variants → default + deltas. Idempotent: an already-compact spec is returned as-is. */
function compact(spec) {
  if (!spec.variants || spec.default) return spec;
  const [first, ...rest] = spec.variants;
  if (!first) return spec;
  const anchors = [first];
  const variants = rest.map((v) => {
    const base = anchors.find((a) => sameShape(a, v, true));
    if (!base) { anchors.push(v); return v; }          // a new shape stays in full
    const delta = diffNode(base, v) || {};
    return base === first ? { name: v.name, delta } : { name: v.name, base: base.name, delta };
  });
  const { variants: _drop, ...head } = spec;
  return { ...head, default: first, variants };
}

/** default + deltas → full variants. Idempotent for a spec that has no default. */
function resolve(spec) {
  if (!spec.default) return spec;
  const byName = { [spec.default.name]: spec.default };
  const variants = [spec.default];
  for (const v of spec.variants) {
    if (!('delta' in v)) { byName[v.name] = v; variants.push(v); continue; }
    const base = v.base ? byName[v.base] : spec.default;
    // A delta against a base that does not precede it cannot be resolved, and
    // guessing would produce a plausible wrong tree — which is worse than a stop.
    if (!base) throw new Error(`${spec.name || 'spec'}: variant "${v.name}" deltas against "${v.base}", which precedes nothing`);
    const full = applyNode(base, v.delta);
    full.name = v.name;
    byName[v.name] = full;
    variants.push(full);
  }
  const { default: _drop, ...head } = spec;
  return { ...head, variants };
}

/** The one slug that names a component's folder — the receiver writes by it. */
const slug = (s) => String(s).toLowerCase().replace(/^_/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/*
 * One way to name a layer, for everything that walks a Figma tree.
 *
 * A path is the chain of names from the frame down — `Shape > check` — and a
 * repeat takes `#2`, `#3`, because a Nudger draws `Icon button` twice and
 * keyed on the name alone the second silently replaced the first: one of the
 * two was measured twice and the other not at all, with nothing to say so.
 * Two projects then wrote three conventions (`#2`, `[1]` counting from zero,
 * `[2]` counting from one), one of them disagreeing with itself; this is the
 * one, and `repeatOf` reads it back.
 *
 * `visit(node, path, ancestors)` is called for every node under `tree`, never
 * for the tree itself — the root's own name is the variant (`Size=lg,
 * State=Rest`) or the frame (`1-1 - Pool`), which is not a path segment
 * anybody writes. `ancestors` starts at the tree and ends at the node's
 * parent. Returning `false` stops the walk descending into that node.
 */
function layerPaths(tree, visit) {
  const seen = new Set();
  const walk = (node, prefix, ancestors) => {
    let path = prefix ? `${prefix} > ${node.name}` : node.name;
    if (seen.has(path)) {
      let i = 2;
      while (seen.has(`${path}#${i}`)) i++;
      path = `${path}#${i}`;
    }
    seen.add(path);
    if (visit(node, path, ancestors) === false) return;
    for (const child of node.children || []) walk(child, path, [...ancestors, node]);
  };
  for (const child of tree.children || []) walk(child, '', [tree]);
}

/** One path segment: `Aside#2` is the second `Aside`, `Aside` the first. */
function repeatOf(segment) {
  const m = /^(.*?)#(\d+)$/.exec(segment);
  return m ? { name: m[1], nth: +m[2] } : { name: segment, nth: 1 };
}

module.exports = { compact, resolve, slug, sameShape, layerPaths, repeatOf };
