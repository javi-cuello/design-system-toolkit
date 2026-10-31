/*
 * tools/parity/measurements.mjs — the two-pass stability check, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 * Two passes of the same render must agree, or nothing from the run counts: a
 * ruler that gives two answers is not a ruler.
 *
 * Each project measures its own way — one takes the second pass inside the
 * render, the other evaluates again a fifth of a second later — but what makes
 * a difference a finding is the same: the layer, the property, and both
 * values. Two projects wrote the comparison separately and one named only the
 * layer, which is the half that does not say what moved.
 *
 * `unstable(a, b)` compares one document of `{ layer: { prop: value } }`; a
 * caller with several documents (a screen per key) calls it per document and
 * prefixes the name. A layer that is not an object (a stamp, a page dump) is
 * compared whole.
 */
export function unstable(first, second, { skip = [] } = {}) {
  const ignore = new Set(skip);
  const out = [];
  const a = first || {}, b = second || {};
  for (const layer of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (ignore.has(layer)) continue;
    const x = a[layer], y = b[layer];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    if (!x || !y || typeof x !== 'object' || typeof y !== 'object') {
      out.push(`${layer}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`);
      continue;
    }
    // Which property moved, not merely that the layer did: a re-render
    // replaces the element the second pass looks for, and that reads as one
    // real value against a null — worth telling from a value still settling.
    for (const prop of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (JSON.stringify(x[prop]) !== JSON.stringify(y[prop])) out.push(`${layer} › ${prop}: ${JSON.stringify(x[prop])} vs ${JSON.stringify(y[prop])}`);
    }
  }
  return out;
}
