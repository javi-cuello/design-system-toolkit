// bin/check's scheduler (check-parallel.mjs): steps that share a resource never overlap, a counted resource holds at most
// its count, an undeclared step runs alone, and what is printed, failed and skipped reads exactly as a serial run's.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHED = path.join(HERE, 'check-parallel.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-par-'));
// a stand-in step: `<name> <secs> <outcome>`; logs its start and end, prints two lines, says its outcome as bin/check's does
const RUNNER = path.join(tmp, 'step.sh');
fs.writeFileSync(RUNNER, `#!/bin/sh
echo "start $1 $(node -e 'console.log(Date.now())')" >> "${tmp}/times"
echo "$1 first line"
sleep "$2"
echo "$1 last line"
echo "end $1 $(node -e 'console.log(Date.now())')" >> "${tmp}/times"
case "$3" in
  fail) printf '%s\\n' "$1" > "$TOOLKIT_CHECK_STATE.failed"; exit 1 ;;
  skip) printf '%s\\n' "$1" > "$TOOLKIT_CHECK_STATE.skipped" ;;
  crash) exit 3 ;;
esac
exit 0
`);
fs.chmodSync(RUNNER, 0o755);

function run(lines, args = []) {
  fs.rmSync(path.join(tmp, 'times'), { force: true });
  const state = fs.mkdtempSync(path.join(tmp, 'state-'));
  const r = spawnSync('node', [SCHED, ...args, '--state', state, '--', RUNNER], { input: lines.map((l) => l.join('\t')).join('\n') + '\n', encoding: 'utf8' });
  assert.equal(r.status, 0, `the scheduler ran: ${r.stderr}`);
  const t = {};
  for (const l of fs.readFileSync(path.join(tmp, 'times'), 'utf8').trim().split('\n')) { const [k, n, at] = l.split(' '); (t[n] ||= {})[k] = +at; }
  const read = (f) => { try { return fs.readFileSync(path.join(state, f), 'utf8'); } catch { return null; } };
  return { out: r.stdout, t, failed: read('failed'), skipped: read('skipped') };
}
const overlap = (t, a, b) => t[a].start < t[b].end && t[b].start < t[a].end;

// Output in list order, whole per step, though the second step ends first.
const o = run([['-', 'a', '0.6', 'ok'], ['-', 'b', '0.1', 'ok'], ['-', 'c', '0.1', 'ok']], ['--workers', '2']);
assert.equal(o.out, 'a first line\na last line\nb first line\nb last line\nc first line\nc last line\n', 'each step printed whole, in list order');
assert.ok(overlap(o.t, 'a', 'b'), 'two steps sharing nothing run side by side');

// Steps sharing a tag never overlap; steps with other tags do.
const s = run([['chrome', 'a', '0.4', 'ok'], ['chrome,home:downloads', 'b', '0.4', 'ok'], ['launchd', 'c', '0.4', 'ok']], ['--workers', '3']);
assert.ok(!overlap(s.t, 'a', 'b'), 'two steps that share chrome never overlap');
assert.ok(overlap(s.t, 'a', 'c') || overlap(s.t, 'b', 'c'), 'a step sharing nothing with them runs beside them');

// A counted resource: at most its count at once.
const c = run([['chrome', 'a', '0.5', 'ok'], ['chrome', 'b', '0.5', 'ok'], ['chrome', 'c', '0.5', 'ok']], ['--workers', '3', '--limit', 'chrome=2']);
const most = Math.max(...['a', 'b', 'c'].map((x) => ['a', 'b', 'c'].filter((y) => y !== x && overlap(c.t, x, y)).length));
assert.ok(overlap(c.t, 'a', 'b'), 'chrome=2 lets two run at once');
assert.ok(!(overlap(c.t, 'a', 'b') && overlap(c.t, 'a', 'c') && overlap(c.t, 'b', 'c')), 'never three');
assert.ok(most >= 1, 'the count was used');
const w = run([['-', 'a', '0.3', 'ok'], ['chrome', 'b', '0.3', 'ok'], ['chrome', 'c', '0.3', 'ok']], ['--workers', '2', '--limit', 'chrome=2']);
assert.ok(w.t.a.start < w.t.b.end && w.t.a.start < w.t.c.end, 'a counted resource as wide as the workers leaves one worker to the list order');

// An undeclared step (no shares, or "alone") runs with nothing beside it.
for (const tag of ['', 'alone']) {
  const u = run([['-', 'a', '0.3', 'ok'], [tag, 'b', '0.3', 'ok'], ['-', 'c', '0.3', 'ok']], ['--workers', '3']);
  assert.ok(!overlap(u.t, 'a', 'b') && !overlap(u.t, 'b', 'c'), `a step declared "${tag}" runs alone`);
  assert.ok(u.t.c.start >= u.t.b.end, `nothing listed after a step declared "${tag}" starts before it ends`);
}

// One worker is today's serial run.
const one = run([['-', 'a', '0.2', 'ok'], ['-', 'b', '0.2', 'ok']], ['--workers', '1']);
assert.ok(!overlap(one.t, 'a', 'b'), 'one worker runs one step at a time');
assert.ok(one.t.a.end <= one.t.b.start, 'in list order');

// Failures and skips come back in list order, as a serial run's FAILED and SKIPPED; a step that died without saying
// is named a failure, never lost.
const f = run([['-', 'a', '0.4', 'fail'], ['-', 'b', '0.1', 'skip'], ['-', 'c', '0.1', 'fail'], ['-', 'd', '0.1', 'crash'], ['-', 'e', '0.1', 'skip']], ['--workers', '3']);
assert.equal(f.failed, 'a\nc\nstep 4 (d 0.1 crash) ended with exit 3 and no result\n', 'failures in list order, the silent one named');
assert.equal(f.skipped, 'b\ne\n', 'skips in list order');
const g = run([['-', 'a', '0', 'ok']]);
assert.equal(g.failed, '', 'a green run has an empty failed list');

// Usage: no runner, or a bad worker count, is refused.
assert.equal(spawnSync('node', [SCHED, '--workers', '0', '--state', tmp, '--', RUNNER], { input: '' }).status, 2, 'zero workers is refused');
assert.equal(spawnSync('node', [SCHED, '--state', tmp], { input: '' }).status, 2, 'no runner is refused');

fs.rmSync(tmp, { recursive: true, force: true });
console.log('ok check scheduler: 19 assertions');
