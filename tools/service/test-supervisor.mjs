// supervisor.mjs with fake children in a temp folder: a crashing child comes back with a growing wait, one that
// ran past `steady` comes back at once, each exit is logged and its output kept, and the review runs once per day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { supervise, nextAt } from './supervisor.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'supervisor-'));
const until = async (ok, ms = 5000) => { const end = Date.now() + ms; while (!ok()) { if (Date.now() > end) throw new Error('timed out'); await new Promise((r) => setTimeout(r, 10)); } };
const script = (dir, name, body) => { const f = path.join(dir, name); fs.writeFileSync(f, body); return f; };

test('nextAt is the next 03:00, today or tomorrow', () => {
  assert.equal(nextAt(new Date(2026, 0, 5, 2, 59), 3).getTime(), new Date(2026, 0, 5, 3, 0).getTime());
  assert.equal(nextAt(new Date(2026, 0, 5, 3, 0), 3).getTime(), new Date(2026, 0, 6, 3, 0).getTime());
});

test('a child that keeps crashing comes back, each wait twice the last up to the most; its output is kept', async () => {
  const dir = tmp(), said = [];
  const crash = script(dir, 'crash.mjs', "console.error('crashed'); process.exit(1);\n");
  const s = supervise({ logs: dir, children: [{ name: 'crash', script: crash }], wait: 20, most: 80, steady: 10000, log: (m) => said.push(m) });
  await until(() => said.length >= 4);
  s.stop();
  assert.deepEqual(said.slice(0, 4), ['0.02', '0.04', '0.08', '0.08'].map((d) => `crash exited (1); starting it again in ${d} s`));
  assert.match(fs.readFileSync(path.join(dir, 'crash.err'), 'utf8'), /^crashed\ncrashed\n/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a child that ran past steady comes back after the first wait; one that stays up is left alone and stopped', async () => {
  const dir = tmp(), said = [];
  const late = script(dir, 'late.mjs', 'setTimeout(() => process.exit(0), 60);\n');
  const stay = script(dir, 'stay.mjs', "process.on('message', () => {}); setInterval(() => {}, 1000);\n");
  const s = supervise({ logs: dir, children: [{ name: 'late', script: late }, { name: 'stay', script: stay }], wait: 20, most: 80, steady: 30, log: (m) => said.push(m) });
  await until(() => said.length >= 3);
  assert.deepEqual(new Set(said.slice(0, 3)), new Set(['late exited (0); starting it again in 0.02 s']));
  const kids = [...s.kids];
  s.stop();
  await until(() => kids.every((k) => k.exitCode !== null || k.signalCode !== null));
  assert.ok(!said.some((m) => m.startsWith('stay')), said.join('\n'));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the review runs once when 03:00 passes, not again that day, and again the next', async () => {
  const dir = tmp(), said = [];
  const marks = path.join(dir, 'ran');
  const review = script(dir, 'review.mjs', `import fs from 'node:fs'; fs.appendFileSync(${JSON.stringify(marks)}, 'x');\n`);
  let clock = new Date(2026, 0, 5, 2, 59);
  const s = supervise({ logs: dir, children: [], review: [process.execPath, review, '--if-owed'], every: 10, now: () => clock, log: (m) => said.push(m) });
  const ran = () => (fs.existsSync(marks) ? fs.readFileSync(marks, 'utf8').length : 0);
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(ran(), 0, 'not before 03:00');
  clock = new Date(2026, 0, 5, 3, 1);
  await until(() => said.includes('review: exited (0)'));
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(ran(), 1, 'once that day');
  clock = new Date(2026, 0, 6, 3, 0);
  await until(() => ran() === 2);
  s.stop();
  fs.rmSync(dir, { recursive: true, force: true });
});
