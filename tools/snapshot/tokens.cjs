/*
 * A token's value by name, in a mode, from a snapshot's collections.
 *
 * The spec names tokens (`Colour/Control/Neutral/base-rest`, `Heading/lg/size`)
 * and the stored values are already resolved, per collection and per mode. A
 * name lives in one collection; the mode is the collection's own where it has
 * that mode (matched without case: a run says `dark`, the file says `Dark`),
 * else its first — a primitives collection has no Light or Dark and is the
 * same in both. It holds no state, so two renders in two modes never share one.
 *
 * Three readers had written this separately (two parity loops and the docs),
 * one of them from convenience keys a single project's plugin build produced.
 */
function valueOf(snapshot, name, mode) {
  const want = String(mode || '').toLowerCase();
  for (const entry of Object.values((snapshot && snapshot.collections) || {})) {
    const modes = entry.modes || [];
    const m = modes.find((x) => x.toLowerCase() === want) || modes[0];
    const vals = (entry.values || {})[m] || {};
    if (name in vals) return vals[name];
  }
  return undefined;
}

module.exports = { valueOf };
