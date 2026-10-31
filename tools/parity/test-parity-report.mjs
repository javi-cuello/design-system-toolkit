#!/usr/bin/env node
// node tools/parity/test-parity-report.mjs — from the toolkit root.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveReport, MAX_DIFFS } from './parity-report.mjs';

const file = join(mkdtempSync(join(tmpdir(), 'parity-')), 'report.json');
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

saveReport(file, {
  button: { kind: 'component', matched: 10, failed: 0, diffs: [] },
  chip: { kind: 'component', matched: 4, failed: 2, diffs: Array.from({ length: 20 }, (_, i) => `diff ${i}`) },
  sheet: { kind: 'component', matched: 0, failed: 0, unmeasured: true, reason: 'no story yet' },
}, { fullRun: true, now: '2026-01-01T00:00:00.000Z' });
let r = JSON.parse(readFileSync(file, 'utf8'));
ok('status from the counts: match, drift, unmeasured', r.components.button.status === 'match' && r.components.chip.status === 'drift' && r.components.sheet.status === 'unmeasured');
ok('diffs are capped', r.components.chip.diffs.length === MAX_DIFFS);
ok('an unmeasured component carries its reason; a measured one none', r.components.sheet.reason === 'no story yet' && !('reason' in r.components.button));
ok('a match dates its last match', r.components.button.lastMatchedAt === '2026-01-01T00:00:00.000Z' && r.components.chip.lastMatchedAt === null);

saveReport(file, { button: { kind: 'component', matched: 9, failed: 1, diffs: ['Label.width: expected 40, measured 41'] } }, { now: '2026-01-02T00:00:00.000Z' });
r = JSON.parse(readFileSync(file, 'utf8'));
ok('a scoped run updates only what it measured', r.components.chip.measuredAt === '2026-01-01T00:00:00.000Z' && r.fullRun === false);
ok('a drift keeps the date it last matched', r.components.button.status === 'drift' && r.components.button.lastMatchedAt === '2026-01-01T00:00:00.000Z');

// Timestamps mean "verdict last changed": an unchanged verdict keeps its dates,
// and a run that changes nothing does not write — the report lives in a repo,
// and a rewrite with only new dates left it dirty after every push.
const same = {
  button: { kind: 'component', matched: 9, failed: 1, diffs: ['Label.width: expected 40, measured 41'] },
  sheet: { kind: 'component', matched: 0, failed: 0, unmeasured: true, reason: 'no story yet' },
};
const bytes = readFileSync(file, 'utf8');
utimesSync(file, new Date(0), new Date(0));
saveReport(file, same, { now: '2026-01-03T00:00:00.000Z' });
ok('a run that changes no verdict leaves the file untouched', readFileSync(file, 'utf8') === bytes && statSync(file).mtimeMs === 0);

saveReport(file, { ...same, chip: { kind: 'component', matched: 6, failed: 0, diffs: [] } }, { now: '2026-01-04T00:00:00.000Z' });
r = JSON.parse(readFileSync(file, 'utf8'));
ok('an unchanged verdict keeps its stored dates while another changes', r.components.button.measuredAt === '2026-01-02T00:00:00.000Z' && r.components.sheet.measuredAt === '2026-01-01T00:00:00.000Z');
ok('a changed verdict is dated, and so is the report', r.components.chip.measuredAt === '2026-01-04T00:00:00.000Z' && r.components.chip.lastMatchedAt === '2026-01-04T00:00:00.000Z' && r.at === '2026-01-04T00:00:00.000Z');

saveReport(file, { chip: { kind: 'component', matched: 6, failed: 0, diffs: [] } }, { now: '2026-01-05T00:00:00.000Z' });
r = JSON.parse(readFileSync(file, 'utf8'));
ok('a match that stays a match keeps the date it started matching', r.components.chip.lastMatchedAt === '2026-01-04T00:00:00.000Z' && r.at === '2026-01-04T00:00:00.000Z');

console.log(`${n}/${n} passed`);
