/*
 * tools/parity/diff.mjs — the one differ, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 * Expectation documents against measurements, one judged row per assertion,
 * with the waiver bookkeeping. Knows nothing about Figma: the adapter has
 * already resolved every expected value for the tier.
 *
 *   Doc       { layer, selector, status: 'measure'|'structural'|'absent', assertions }
 *   Assertion { kind, prop, expected, from?, within?, hint? }   kind ∈ KINDS, prop ∈ PROPS
 *   measured  { [layer]: record | null }   record[prop] is what the probe read
 *
 * A row is { layer, prop?, kind, expected?, actual?, from?, hint?, reason?, why?, waiver?, detail? }
 * and its kind is one of: match, waived, differs, absent, present, structural,
 * unmapped, nomatch, vacuous, unresolved. A `waived` row with `slack` and no
 * `waiver` is a hugged size the text slack excused by a pixel or more; a row a
 * waiver excused on a number carries `off`, the distance it excused. The waiver key is `Layer.prop`; `waiver.key`,
 * where a caller scoped a declared key, is the key as declared, so a run can
 * tell which declarations were used.
 */
import { KINDS, SKIP, isProp, NUMERIC } from './schema.mjs';
import { asWaiver, excuses } from './waivers.mjs';

/*
 * The row kinds a run must not end on. `absent`, `structural`, `match` and
 * `waived` say the loop did its job; these say it did not. `clipped` is raised
 * by a runner's own text-cut check, beside the differ.
 */
export const BAD = ['differs', 'nomatch', 'vacuous', 'clipped', 'present', 'unresolved'];

export function diff(docs, measured, { waivers = {}, tolerances = {} } = {}) {
  const rows = [];
  const selectorOf = new Map(docs.map((d) => [d.layer, d.selector]));
  // One judged question: a match, or a difference a waiver may excuse.
  const judge = (doc, prop, ok, expected, actual, from, hint, given) => {
    if (ok) { rows.push({ layer: doc.layer, prop, kind: 'match', expected, actual }); return; }
    const key = `${doc.layer}.${prop}`;
    const waiver = asWaiver(waivers[key]);
    if (!waiver) { rows.push({ layer: doc.layer, prop, kind: doc.status === 'absent' ? 'present' : 'differs', expected, actual, from, ...(hint ? { hint } : null) }); return; }
    // `sameAs` claims this layer and another are one element: true when the
    // mapping gives them one selector.
    const sameElement = waiver.sameAs ? selectorOf.get(waiver.sameAs) === doc.selector : undefined;
    const numeric = NUMERIC.has(prop);
    const v = excuses(waiver, { expected, actual, sameElement, numeric, off: given });
    const declared = waiver.key || key;
    // the distance excused, for a bound to be held to it (run.mjs: per target, recorded at --accept)
    const off = numeric ? (given !== undefined ? given : Math.abs(parseFloat(expected) - parseFloat(actual))) : NaN;
    if (v.excused) rows.push({ layer: doc.layer, prop, kind: 'waived', expected, actual, reason: waiver.reason, waiver: declared, ...(Number.isFinite(off) ? { off: +off.toFixed(4) } : null) });
    else rows.push({ layer: doc.layer, prop, kind: doc.status === 'absent' ? 'present' : 'differs', expected, actual, from: [from, v.why].filter(Boolean).join(' — '), why: v.why, waiver: declared });
  };

  for (const doc of docs) {
    const m = measured[doc.layer];
    /* A layer this variant does not draw. Not drawn in the code either is
       agreement; drawn with a box is a difference (`-present`): a checkmark
       the design draws only when selected, shown unselected. */
    if (doc.status === 'absent') {
      // `-rendered` is the probe's answer where the plan asked it; a box alone
      // (a record carrying the baseline's core) is no proof of being drawn
      if (m && ('-rendered' in m ? m['-rendered'] === 'yes' : m.w || m.h)) judge(doc, '-present', false, 'absent', 'rendered', 'this variant does not draw the layer');
      else rows.push({ layer: doc.layer, kind: 'absent', detail: 'this variant does not draw it' });
      continue;
    }
    // Mapped to null on purpose: no element answers for it. Not measured, but
    // present, which is what keeps the stale-mapping check meaningful.
    if (doc.status === 'structural') { rows.push({ layer: doc.layer, kind: 'structural', detail: 'mapped to null on purpose' }); continue; }
    if (!doc.selector) { rows.push({ layer: doc.layer, kind: 'unmapped', detail: 'no selector' }); continue; }
    // A selector that matched nothing reports no differences, which reads
    // exactly like agreement. It is a finding about the probe, not the page.
    if (!m) { rows.push({ layer: doc.layer, kind: 'nomatch', detail: `selector matched no element: ${doc.selector}` }); continue; }
    // Measured, and nothing asked of it: named, never counted as measured.
    if (!doc.assertions.length) { rows.push({ layer: doc.layer, kind: 'vacuous', detail: 'mapped, but nothing was asserted' }); continue; }

    for (const a of doc.assertions) {
      if (!isProp(a.prop)) throw new Error(`parity: assertion prop "${a.prop}" is not in the schema's table (${doc.layer})`);
      // An expectation the adapter could not state — a token, a style, a
      // paint it cannot resolve — is a finding of its own, excused only by a
      // waiver that names it.
      if (a.kind === 'unresolved') {
        const w = asWaiver(waivers[`${doc.layer}.${a.prop}`]);
        if (w) rows.push({ layer: doc.layer, prop: a.prop, kind: 'waived', expected: null, actual: null, reason: w.reason, waiver: w.key || `${doc.layer}.${a.prop}` });
        else rows.push({ layer: doc.layer, prop: a.prop, kind: 'unresolved', detail: `nothing to compare: ${a.from} does not resolve` });
        continue;
      }
      // A kind or prop outside the schema is a schema change that skipped the
      // schema: refused, never skipped.
      const K = KINDS[a.kind];
      if (!K) throw new Error(`parity: no comparator for kind "${a.kind}" (${doc.layer})`);
      // Most kinds read one prop; a few read across the record or the layers.
      const actual = K.read ? K.read({ record: m, measured, assertion: a, doc }) : m[a.prop];
      if (actual === SKIP) continue;
      const show = K.show || ((v) => v);
      const same = K.compare(a.expected, actual, a, tolerances);
      /* A hugged size the text slack excuses by a pixel or more is not a
         match: it is the slack doing a waiver's work, so it is reported as
         one, with the slack it used (adapt.mjs SLACK_CAP), and read. */
      const off = a.kind === 'hugLength' ? Math.abs(parseFloat(a.expected) - parseFloat(actual)) : 0;
      if (same && off >= 1) { rows.push({ layer: doc.layer, prop: a.prop, kind: 'waived', expected: a.expected, actual, reason: `within the text slack of ${a.within}`, slack: +off.toFixed(4), within: a.within }); continue; }
      judge(doc, a.prop, same, show(a.expected), show(actual), a.from, a.hint, !same && K.off ? K.off(a.expected, actual) : undefined);
    }
  }
  return rows;
}
