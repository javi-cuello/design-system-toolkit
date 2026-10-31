/*
 * tools/parity/layers.mjs — which spec node a mapping's layer path names, part
 * of the design-to-code parity engine (README.md here; the method is
 * skills/design-code-parity).
 *
 * A mapping names a layer by its EXACT path, as the store spells it
 * (tools/snapshot/spec.cjs `layerPaths`: `Content > Label`, and
 * `Aside#2` for the second of two layers at one path), or `$root` for the
 * variant or frame itself. Nothing else resolves.
 *
 * One project resolved a path by searching each segment at any depth below the
 * last, shallowest first: 1,799 of its 2,016 resolutions used a path that was
 * not the layer's own. A search like that rebinds silently when a designer
 * wraps a layer — the name now finds a different node and the run measures it
 * green. An exact path goes absent instead, and the stale-mapping gate says so.
 */
import { createRequire } from 'node:module';

const { layerPaths } = createRequire(import.meta.url)('../snapshot/spec.cjs');

/** Every exact path in `tree` → `{ node, parent, ancestors }`, with `$root` the tree itself. */
export function layerIndex(tree) {
  const index = new Map([['$root', { node: tree, parent: undefined, ancestors: [] }]]);
  layerPaths(tree, (node, path, ancestors) => { index.set(path, { node, parent: ancestors[ancestors.length - 1], ancestors }); });
  return index;
}

/** The node at exactly `path` in `tree`, or null. */
export const layerAt = (tree, path) => (layerIndex(tree).get(path) || {}).node || null;

/** The exact path of `node` in `tree` (`$root` for the tree), or null when it is not in it. */
export function pathOf(tree, node) {
  for (const [path, entry] of layerIndex(tree)) if (entry.node === node) return path;
  return null;
}
