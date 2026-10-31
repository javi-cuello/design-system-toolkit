// What moved, for the overview's Activity card: three readings of the
// change log (snapshot.js `changes`, graded by changes.js `changeRows`) and
// the audit record's runs (tracker.js `audit.runs`). One module, so the
// calendar, the two charts and their tables count the same way.
import { changes } from './snapshot.js';
import { changeRows } from './changes.js';
import { audit, wholeRuns } from './tracker.js';

const dayKey = (iso) => new Date(iso).toISOString().slice(0, 10);
const runs = Object.values(audit?.runs || {}).filter((r) => r && r.at && !Number.isNaN(new Date(r.at).getTime()));
const snapshots = changes.filter((e) => e && e.at && !Number.isNaN(new Date(e.at).getTime()));

export const lastSnapshot = snapshots.map((e) => e.at).sort().at(-1) || null;
export const lastRun = runs.map((r) => r.at).sort().at(-1) || null;

// 1. Activity: per day, snapshots, audit runs, findings filed and closed.
const perDay = new Map();
const bump = (iso, field, n = 1) => {
  const k = dayKey(iso);
  const d = perDay.get(k) || { snapshots: 0, runs: 0, filed: 0, closed: 0 };
  d[field] += n;
  perDay.set(k, d);
};
for (const e of snapshots) bump(e.at, 'snapshots');
for (const r of runs) {
  bump(r.at, 'runs');
  if (Number(r.found) > 0) bump(r.at, 'filed', Number(r.found));
  if (Number(r.cleared) > 0) bump(r.at, 'closed', Number(r.cleared));
}
const total = (d) => d.snapshots + d.runs + d.filed + d.closed;

// The past year to today, 53 weeks, Monday first, one cell per day: a
// quiet fortnight since the last run shows as one.
const end = new Date(`${dayKey(new Date().toISOString())}T00:00:00Z`);
const endWeekday = (end.getUTCDay() + 6) % 7;
const start = new Date(end); start.setUTCDate(start.getUTCDate() - endWeekday - 52 * 7);
export const calendar = { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), days: [] };
for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
  const k = d.toISOString().slice(0, 10);
  const v = perDay.get(k) || { snapshots: 0, runs: 0, filed: 0, closed: 0 };
  calendar.days.push({ day: k, ...v, total: total(v) });
}
// Four steps over the busy days, by quartile (as GitHub draws its calendar),
// so one audit that filed 500 findings does not wash every other day out.
const busy = calendar.days.map((d) => d.total).filter((n) => n > 0).sort((a, b) => a - b);
const q = (p) => busy[Math.min(busy.length - 1, Math.floor(p * busy.length))];
const cuts = busy.length ? [q(0.25), q(0.5), q(0.75)] : [];
for (const d of calendar.days) d.level = d.total === 0 ? 0 : 1 + cuts.filter((c) => d.total > c).length;
calendar.activeDays = calendar.days.filter((d) => d.total > 0);

// 2. Changes: per snapshot day, the changes graded Breaking, Minor, Patch for
// the Figma files; an entry from before grading counts as Not graded.
const LEVELS = ['major', 'minor', 'patch', ''];
const byDay = new Map();
for (const row of changeRows) {
  const k = dayKey(row.at);
  const d = byDay.get(k) || { day: k, major: 0, minor: 0, patch: 0, '': 0 };
  for (const it of row.items) d[LEVELS.includes(it.figma) ? it.figma : ''] += 1;
  byDay.set(k, d);
}
export const changeDays = [...byDay.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
export const ungraded = changeDays.some((d) => d['']);

// 3. Findings: open after each whole audit, across the project's libraries
// (each library's last count carried forward), with what that run filed and
// closed. Only whole runs: a re-check of one component reads as a collapse.
const lastOpen = new Map();
const perRun = wholeRuns.filter((r) => typeof r.open === 'number').map((r) => {
  lastOpen.set(r.fileKey || '', r.open);
  return { at: r.at, open: [...lastOpen.values()].reduce((a, b) => a + b, 0), filed: Number(r.found) || 0, closed: Number(r.cleared) || 0 };
});
// One point per day (the day's last open count, its filed and closed summed),
// over the 30 days before the latest run: a month reads at a glance, where
// fifty-odd runs needed a scrolling chart.
export const FINDINGS_DAYS = 30;
const lastAt = perRun.length ? Date.parse(perRun.at(-1).at) : 0;
const runDays = new Map();
for (const r of perRun) {
  if (lastAt - Date.parse(r.at) > FINDINGS_DAYS * 864e5) continue;
  const day = r.at.slice(0, 10), d = runDays.get(day) || { at: r.at, open: 0, filed: 0, closed: 0 };
  runDays.set(day, { at: r.at, open: r.open, filed: d.filed + r.filed, closed: d.closed + r.closed });
}
export const findingRuns = [...runDays.values()];
