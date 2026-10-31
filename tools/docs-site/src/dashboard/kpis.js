// How a KPI strip fills its rows (system.css `.kpis--fill`), for the strip
// drawn at build (KpiStrip.astro) and the one the dashboard draws in the
// browser (measures.js, beside it), so the two cannot drift. It lives with
// the dashboard because its modules import only one another (check.mjs).
//
// Every row filled, none left with an empty cell (data.md *KPI tiles*): the
// tiles are split into as few rows as `max` a row allows, balanced (7 at four
// a row is 4 and 3, not 4 and 1 beside three blanks), and each tile spans its
// share of a 60-column grid (60 divides by every row size up to 6). `units`
// is each tile's width in tiles: a lead counts as two.
export const kpiSpans = (units, max) => {
  const sized = units.map((u) => Math.min(u, max));
  const sum = sized.reduce((a, b) => a + b, 0);
  const cap = Math.ceil(sum / Math.ceil(sum / max));
  const rows = [];
  for (const [i, u] of sized.entries()) {
    const row = rows.at(-1);
    if (row && row.sum + u <= cap) { row.items.push([i, u]); row.sum += u; } else rows.push({ sum: u, items: [[i, u]] });
  }
  const out = [];
  for (const row of rows) for (const [i, u] of row.items) out[i] = (60 * u) / row.sum;
  return out;
};
// The strip's three widths (system.css `.kpis--fill`): two a row on a phone,
// three on a tablet, `perRow` on a wide screen.
export const kpiStyles = (units, perRow = 6) => {
  const [sm, md, lg] = [2, 3, perRow].map((max) => kpiSpans(units, max));
  return units.map((_, i) => `--sm: ${sm[i]}; --md: ${md[i]}; --lg: ${lg[i]}`);
};
