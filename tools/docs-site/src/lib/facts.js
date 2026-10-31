// The facts one change-log entry recorded for one component folder, each
// with both values, as the component's change log shows them
// (components/ChangeLog.astro). Here, outside the component, so a test can
// hold it (tools/docs-site/test-changelog.mjs).

const legacy = (line) => (typeof line === 'string' ? { what: line, before: '', after: '' } : line);
// A token rename is stored as the segment that changed with "/…" for the rest
// of the name; said as the segment alone it does not read as cut off.
export const tidy = (v) => String(v || '').replace(/\/…$/, '');

// The facts an entry recorded for one folder, each with both values.
export const factsOf = (c, f) => {
  const out = [];
  for (const r of c.renamed || []) if (r.folder === f) { out.push({ what: 'Name', before: r.from, after: r.to, rule: 'component-renamed' }); for (const n of r.notes || []) out.push(legacy(n)); }
  if ((c.added || []).includes(f)) out.push({ what: 'Component', before: 'none', after: 'added to the library', rule: 'component-added' });
  if ((c.removed || []).includes(f)) out.push({ what: 'Component', before: 'present', after: 'removed from the library', rule: 'component-removed' });
  if ((c.changed || []).includes(f)) for (const n of (c.detail && c.detail[f]) || []) out.push(legacy(n));
  // the same property in several variants is one line, its values listed;
  // the same subject under two rules is two lines: a layer added and one of
  // the same name removed were one row under the first's rule, so a layer
  // that moved read "Layer Title · Added" (review of 2 October 2026, round 3)
  const groups = new Map();
  for (const x of out) { if (tidy(x.before).trim() === tidy(x.after).trim() && x.before) continue; const k = `${x.what}\u0000${x.rule || ''}`; groups.set(k, (groups.get(k) || []).concat(x)); }
  const uniq = (xs) => [...new Set(xs.map((x) => tidy(x).trim()).filter(Boolean))];
  return [...groups.values()].map((fs) => (fs.length === 1 ? { ...fs[0], before: tidy(fs[0].before), after: tidy(fs[0].after) }
    : { what: `${fs[0].what} · ${fs.length} variants`, rule: fs[0].rule, before: uniq(fs.map((x) => x.before)).join(', '), after: uniq(fs.map((x) => x.after)).join(', '), items: fs.map((x) => ({ what: x.what, before: tidy(x.before), after: tidy(x.after) })) }));
};
