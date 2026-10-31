/*
 * tools/parity/parity-report.mjs — the one writer of the saved verdict, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 * The parity run's saved verdict: the one file a docs site, a dashboard or a
 * tracker reads to say whether each component matches its design. Every
 * project's run measures in its own way; they all save through this, so the
 * shape has one owner and every reader works on every project.
 *
 *   import { saveReport } from '<toolkit>/tools/parity/parity-report.mjs';
 *   saveReport(file, { button: { kind: 'component', matched: 230, failed: 0, diffs: [] } }, { fullRun: true });
 *
 * Merged into the last report, so a scoped run updates only what it
 * measured, and a component that matched keeps the date it last did even
 * after it drifts.
 *
 * Timestamps say when the VERDICT last changed, not when it was last
 * measured. A component whose kind, status, counts, diffs and reason are what
 * the file already holds keeps its stored dates, and a run that changes no
 * verdict leaves the file untouched — otherwise every run rewrites three
 * dates per component and the repo holding the report is dirty after every
 * push with nothing to say.
 *
 * Shape: { at, fullRun, components: { <name>: { kind, status, matched,
 * failed, diffs, reason?, measuredAt, lastMatchedAt } } } — status is
 * `match`, `drift` or `unmeasured`; diffs are the first twelve differences in
 * the run's own words.
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

export const MAX_DIFFS = 12;

/**
 * @param {string} file
 * @param {Record<string, { kind: string, matched: number, failed: number, diffs?: string[], unmeasured?: boolean, reason?: string | null }>} results
 * @param {{ fullRun?: boolean, now?: string }} [opts]
 */
export function saveReport(file, results, { fullRun = false, now = new Date().toISOString() } = {}) {
  const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  const components = { ...(before?.components || {}) };
  let changed = !before || before.fullRun !== fullRun;
  for (const [name, r] of Object.entries(results)) {
    const status = r.unmeasured ? 'unmeasured' : r.failed ? 'drift' : 'match';
    const verdict = {
      kind: r.kind, status, matched: r.matched, failed: r.failed, diffs: (r.diffs || []).slice(0, MAX_DIFFS),
      reason: status === 'unmeasured' ? r.reason || null : undefined,
    };
    const was = components[name];
    if (was && sameVerdict(was, verdict)) continue;
    changed = true;
    components[name] = {
      ...verdict,
      measuredAt: now,
      lastMatchedAt: status === 'match' ? now : was?.lastMatchedAt || null,
    };
  }
  if (!changed) return before;
  const report = { at: now, fullRun, components };
  writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  return report;
}

const VERDICT = ['kind', 'status', 'matched', 'failed', 'diffs', 'reason'];
const sameVerdict = (a, b) => VERDICT.every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
