#!/usr/bin/env node
// node tools/parity/test-baseline.mjs — from the toolkit root. Gate 12.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { baseline } from './baseline.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-baseline-'));
const quiet = () => {};
const net = baseline({ dir, suites: ['components'], volatile: { components: new Set(['self']) } });
net.dump('components', [['button › Rest › dark', { $root: { self: 1, w: 44 } }]], null);
// Review 2026-10-02 item 41: with nothing accepted the gate returned 0, green
ok('nothing accepted is red, never a pass', net.compare(quiet) === 1);
net.accept(quiet);
ok('a run measured again the same is green, and a moved width is red by name', (() => {
  const same = net.compare(quiet) === 0;
  net.dump('components', [['button › Rest › dark', { $root: { self: 9, w: 45 } }]], null);
  const lines = []; const moved = net.compare((l) => lines.push(l)) === 1;
  return same && moved && lines.some((l) => /w: 44 → 45/.test(l)) && !lines.some((l) => /self/.test(l));
})());
// Round 3, S14: the `unheld` half of compare's verdict had no case of its
// own — every red above also moved something.
ok('a suite with nothing accepted is red even when nothing moved in the others', (() => {
  const d3 = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-baseline-'));
  const b = baseline({ dir: d3, suites: ['components', 'screens'] });
  b.dump('components', [['card', { $root: { w: 10 } }]], null); b.accept(quiet);
  b.dump('screens', [['home', { Main: { w: 1 } }]], null);
  const lines = []; const red = b.compare((l) => lines.push(l)) === 1;
  fs.rmSync(d3, { recursive: true, force: true });
  return red && lines.some((l) => /nothing moved/.test(l)) && lines.some((l) => /screens: nothing accepted/.test(l));
})());
ok('a scoped run is never accepted', (net.dump('components', [], 'button'), net.acceptable(quiet) === false));
// Round 2 of that review: a suite added to the net (each waiver's excused
// difference per target) had nothing accepted, and compare returned on it
// before printing what moved in the suites that had.
ok('a suite with nothing accepted is red without hiding a move in the others, and a waiver\'s excused difference is held like a measurement', (() => {
  const d2 = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-baseline-'));
  const b = baseline({ dir: d2, suites: ['components', 'waivers'] });
  b.dump('components', [['card', { $root: { w: 10 } }]], null); b.accept(quiet);
  b.dump('components', [['card', { $root: { w: 12 } }]], null);
  b.dump('waivers', [['home', { 'Main.height': { off: 44 } }]], null);
  const lines = []; const red = b.compare((l) => lines.push(l)) === 1;
  const shown = lines.some((l) => /w: 10 → 12/.test(l)) && lines.some((l) => /waivers: nothing accepted/.test(l));
  b.accept(quiet); b.dump('waivers', [['home', { 'Main.height': { off: 30 } }]], null);
  const moved = []; b.compare((l) => moved.push(l));
  fs.rmSync(d2, { recursive: true, force: true });
  return red && shown && moved.some((l) => /off: 44 → 30/.test(l));
})());
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
