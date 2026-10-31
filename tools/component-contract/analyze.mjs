/*
 * tools/component-contract/analyze.mjs — is a library consistent with itself? Three
 * deterministic checks across every component's contract at once:
 *
 *   form      one prop that is a True/False variant axis on some components
 *             and a boolean on others (Value on Dropdown input and on Text input)
 *   spelling  one prop name spelled two ways: the same words in another order,
 *             case or punctuation (Leading slot content, Leading content slot)
 *   scale     one prop with numeric values on some components and named ones
 *             on others (Size 24, 32 on Avatar; large, small on Button)
 *
 *   consistency(components) → findings, in the audit record's row shape
 *
 * `components` is one library's: [{ name, contract, raw }], `raw` the stored
 * spec's own props (`figma.json`), which keep whether a prop is a variant or
 * a boolean. Each check compares form, never meaning: a first version matched
 * value sets and raised 40 findings on one real library, about two of them
 * real, because "left, right" and "top, side" are shared words, not shared
 * props. A synonym check (success, positive) caught nothing on five real
 * libraries and was not shipped; a check of differing defaults raised five
 * findings on them, all of it components that rightly start differently
 * (Button large, Avatar small), and was taken out. Filed by the docs service when the snapshot
 * moves (tools/figma-audit, as breaking changes are); owned by
 * figma-components-audit under the target `consistency`, so its scanner and
 * these never close each other's rows. A decision on purpose is a ruling,
 * which closes the row for good.
 */

const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
const numeric = (values) => values.length > 0 && values.every((v) => /^\d+(\.\d+)?$/.test(v));
const list = (xs, n = 4) => (xs.length > n ? `${xs.slice(0, n).join(', ')} and ${xs.length - n} more` : xs.join(', '));

/* The checks a run makes, as its rows' rules: the record's writer closes only
   rows of a check that ran. A withdrawn check is listed as run, since it now
   raises nothing anywhere, so the rows it left close rather than stay open
   for a check that no longer exists. */
export const RAN = ['consistency-form', 'consistency-spelling', 'consistency-scale', /* withdrawn 2026-10-05: */ 'consistency-default'];

export function consistency(components) {
  const findings = [];
  const add = (where, rule, subject, check, fix, rec) => findings.push({
    where, key: `consistency|${rule}|${where}|${subject}`, rule: `consistency-${rule}`, bucket: 3, sev: 'warn', check, fix: [fix], rec,
  });
  const props = components.flatMap(({ name, contract, raw }) => Object.entries((contract && contract.props) || {})
    .filter(([, p]) => p.role !== 'interaction')
    .map(([k, p]) => ({ component: name, key: k, label: p.figma || k, p, variant: Array.isArray(raw && raw[p.figma]) })));
  const byKey = new Map();
  for (const x of props) (byKey.get(x.key) || byKey.set(x.key, []).get(x.key)).push(x);
  // the side most components take, or none when it is even: then both sides are named
  const minority = (a, b) => (a.length < b.length ? a : b.length < a.length ? b : [...a, ...b]);

  // form: a True/False variant axis here, a boolean there
  for (const [k, xs] of byKey) {
    const flags = xs.filter((x) => x.p.type === 'boolean');
    const asVariant = flags.filter((x) => x.variant), asBoolean = flags.filter((x) => !x.variant);
    if (!asVariant.length || !asBoolean.length) continue;
    for (const x of minority(asVariant, asBoolean)) {
      const other = x.variant ? asBoolean : asVariant;
      add(x.component, 'form', k, `${x.label} is a ${x.variant ? 'True/False variant' : 'boolean property'} here, a ${x.variant ? 'boolean property' : 'True/False variant'} elsewhere`,
        `${x.label} is a ${x.variant ? 'variant axis' : 'boolean'} on ${x.component}; a ${x.variant ? 'boolean' : 'variant axis'} on ${list(other.map((o) => o.component))}.`,
        ['One form for one prop: a boolean when it only shows or hides layers, a variant when it changes their styles.', 'On purpose: record it as a ruling, and it stops being raised.']);
    }
  }

  // spelling: the same words, another order, case or punctuation
  const bySpelling = new Map();
  for (const x of props) { const w = words(x.label).sort().join(' '); (bySpelling.get(w) || bySpelling.set(w, []).get(w)).push(x); }
  for (const [w, xs] of bySpelling) {
    const spellings = new Map();
    for (const x of xs) (spellings.get(x.label) || spellings.set(x.label, []).get(x.label)).push(x);
    if (spellings.size < 2) continue;
    const ranked = [...spellings.entries()].sort((a, b) => b[1].length - a[1].length);
    const usual = ranked[0][1].length > ranked[1][1].length ? ranked[0][0] : null;
    for (const [label, own] of ranked) {
      if (label === usual) continue;
      for (const x of own) add(x.component, 'spelling', w, `${x.label}: the same prop is spelled ${usual ? `"${usual}"` : 'another way'} elsewhere`,
        `"${x.label}" on ${x.component}; ${ranked.filter(([l]) => l !== label).map(([l, cs]) => `"${l}" on ${list(cs.map((c) => c.component), 2)}`).join('; ')}.`,
        ['One prop, one spelling: rename it to match.', 'Different props that happen to share words: record it as a ruling.']);
    }
  }

  // scale: numeric values on some components, named ones on others
  for (const [k, xs] of byKey) {
    const enums = xs.filter((x) => x.p.type === 'enum');
    const nums = enums.filter((x) => numeric(x.p.values)), named = enums.filter((x) => !numeric(x.p.values));
    if (!nums.length || !named.length) continue;
    for (const x of minority(nums, named)) {
      const other = numeric(x.p.values) ? named : nums;
      add(x.component, 'scale', k, `${x.label} is ${numeric(x.p.values) ? 'numeric' : 'named'} here, ${numeric(x.p.values) ? 'named' : 'numeric'} elsewhere`,
        `${x.label} on ${x.component}: ${list(x.p.values)}; on ${list(other.map((o) => o.component), 3)}: ${list(other[0].p.values)}.`,
        ['One scale for one prop: name the sizes, or give them all in units.', 'Two scales on purpose (icons in units, controls named): record it as a ruling.']);
    }
  }

  return findings;
}
