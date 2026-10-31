// What makes a written file the same for the same input (toolkit-standard §D 23): one sort order on every machine,
// and a run's report left alone when only its date and run time moved.
import fs from 'node:fs';

// Names in one order on every machine: the locale pinned, as a sort with none follows the machine's. Options as
// localeCompare's (`{ numeric: true }`); a sort callback passes none. tools/parity/parity-report.mjs keeps its own
// unchanged-report rule, as it dates each component's verdict, not the report.
export const compareNames = (a, b, options) => String(a).localeCompare(String(b), 'en', options);

/* A run's report, written unless it differs from the one on disk only in what every run changes (its date, its
   seconds): those stay readable, and an unchanged result leaves the file as it was. Returns whether it wrote. */
export function writeReport(file, report, volatile = ['at', 'seconds']) {
  const strip = (r) => JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !volatile.includes(k))));
  let before = null;
  try { before = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* none yet, or unreadable: written */ }
  if (before && strip(before) === strip(report)) return false;
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  return true;
}
