// bin/check's scheduler (check-parallel.mjs): steps that share a resource never overlap, a counted resource holds at most
// its count, an undeclared step runs alone, and what is printed, failed and skipped reads exactly as a serial run's.
// Judged by events, not by time: each stand-in step logs, as it starts, which others are running (a marker file each),
// and one that must run beside another waits for that one's marker.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHED = path.join(HERE, 'check-parallel.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-par-'));
// a stand-in step: `<name> <wait> <outcome>`. <wait> is `-`, `start:<x>` (wait until x has started) or `end:<x>` (wait
// until x has ended), given up after 5 s and logged either way. seen.<x> stays after x ends: a waiter never misses a
// short step.
const RUNNER = path.join(tmp, 'step.mjs');
fs.writeFileSync(RUNNER, `import fs from 'node:fs';
const [name, wait, outcome] = process.argv.slice(2);
const D = process.env.STEP_DIR, log = (l) => fs.appendFileSync(D + '/log', l + '\\n');
const running = fs.readdirSync(D).filter((f) => f.startsWith('run.')).map((f) => f.slice(4)).sort();
fs.writeFileSync(D + '/run.' + name, ''); fs.writeFileSync(D + '/seen.' + name, '');
log('start ' + name + ' ' + (running.join(',') || '-'));
process.stdout.write(name + ' first line\\n');
process.stderr.write(name + ' on stderr\\n');
if (wait !== '-') {
  const [kind, x] = wait.split(':'), f = D + '/' + (kind === 'start' ? 'seen.' : 'done.') + x;
  const t0 = Date.now();
  while (!fs.existsSync(f) && Date.now() - t0 < 5000) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
  log('waited ' + name + ' ' + wait + ' ' + (fs.existsSync(f) ? 'yes' : 'no'));
}
process.stdout.write(name + ' last line\\n');
fs.rmSync(D + '/run.' + name);
fs.writeFileSync(D + '/done.' + name, '');
log('end ' + name);
if (outcome === 'fail') { fs.writeFileSync(process.env.TOOLKIT_CHECK_STATE + '.failed', name + '\\n'); process.exit(1); } // not-shared: the scheduler's state, a temp folder this test passes
if (outcome === 'skip') fs.writeFileSync(process.env.TOOLKIT_CHECK_STATE + '.skipped', name + '\\n'); // not-shared: the scheduler's state, a temp folder this test passes
if (outcome === 'crash') process.exit(3);
`);

function run(lines, args = []) {
  const dir = fs.mkdtempSync(path.join(tmp, 'run-'));
  const state = path.join(dir, 'state'); fs.mkdirSync(state);
  const steps = path.join(dir, 'steps'); fs.mkdirSync(steps);
  const r = spawnSync('node', [SCHED, ...args, '--state', state, '--', process.execPath, RUNNER], { input: lines.map((l) => l.join('\t')).join('\n') + '\n', encoding: 'utf8', env: { ...process.env, STEP_DIR: steps } });
  assert.equal(r.status, 0, `the scheduler ran: ${r.stderr}`);
  const log = fs.readFileSync(path.join(steps, 'log'), 'utf8').trim().split('\n');
  const with_ = {}; const waited = {}; const at = (e, n) => log.indexOf(`${e} ${n}`);
  for (const l of log) { const [e, n, x, y] = l.split(' '); if (e === 'start') with_[n] = x === '-' ? [] : x.split(','); if (e === 'waited') waited[n] = y === 'yes'; }
  const read = (f) => { try { return fs.readFileSync(path.join(state, f), 'utf8'); } catch { return null; } };
  return { out: r.stdout, err: r.stderr, with: with_, waited, log, at: (n) => log.findIndex((l) => l.startsWith(`start ${n} `)), end: (n) => at('end', n), failed: read('failed'), skipped: read('skipped') };
}

// Output whole per step, in list order, though the first ends last (it waits for the second's end); stderr apart.
const o = run([['-', 'a', 'end:b', 'ok'], ['-', 'b', '-', 'ok'], ['-', 'c', '-', 'ok']], ['--workers', '2']);
assert.ok(o.waited.a, 'two steps sharing nothing run side by side');
assert.equal(o.out, 'a first line\na last line\nb first line\nb last line\nc first line\nc last line\n', 'stdout: each step whole, in list order');
assert.equal(o.err, 'a on stderr\nb on stderr\nc on stderr\n', 'stderr kept apart from stdout, in list order');

// Steps sharing a tag never overlap; a step with other tags runs beside them.
const s = run([['chrome', 'a', '-', 'ok'], ['chrome,home:downloads', 'b', '-', 'ok'], ['launchd', 'c', 'start:a', 'ok']], ['--workers', '3']);
assert.ok(!s.with.a.includes('b') && !s.with.b.includes('a'), 'two steps that share chrome never overlap');
assert.ok(s.waited.c, 'a step sharing nothing with them runs beside them');

// A counted resource: two at once, never three.
const c = run([['chrome', 'a', 'start:b', 'ok'], ['chrome', 'b', 'start:a', 'ok'], ['chrome', 'c', '-', 'ok']], ['--workers', '3', '--limit', 'chrome=2']);
assert.ok(c.waited.a && c.waited.b, 'chrome=2 lets two run at once');
assert.ok(c.with.c.length < 2, 'never three');
// …and one worker stays with the list order: with as many chrome slots as workers, the first step is not held back
const w = run([['-', 'a', '-', 'ok'], ['chrome', 'b', 'start:a', 'ok'], ['chrome', 'c', '-', 'ok']], ['--workers', '2', '--limit', 'chrome=2']);
assert.ok(w.at('a') < w.at('c'), 'a counted resource as wide as the workers leaves one worker to the list order');

// An undeclared step (no shares, or "alone") runs with nothing beside it, and nothing listed after it starts first.
for (const tag of ['', 'alone']) {
  const u = run([['-', 'a', '-', 'ok'], [tag, 'b', '-', 'ok'], ['-', 'c', '-', 'ok']], ['--workers', '3']);
  assert.deepEqual(u.with.b, [], `a step declared "${tag}" starts with nothing running`);
  assert.ok(u.at('c') > u.end('b'), `nothing listed after a step declared "${tag}" starts before it ends`);
}

// One worker is today's serial run: each step starts alone, in list order.
const one = run([['-', 'a', '-', 'ok'], ['-', 'b', '-', 'ok']], ['--workers', '1']);
assert.ok(one.with.b.length === 0 && one.at('b') > one.end('a'), 'one worker runs one step at a time, in list order');

// Failures and skips come back in list order, as a serial run's FAILED and SKIPPED; a step that died without saying
// is named a failure, never lost.
const f = run([['-', 'a', 'end:c', 'fail'], ['-', 'b', '-', 'skip'], ['-', 'c', '-', 'fail'], ['-', 'd', '-', 'crash'], ['-', 'e', '-', 'skip']], ['--workers', '3']);
assert.equal(f.failed, 'a\nc\nstep 4 (d - crash) ended with exit 3 and no result\n', 'failures in list order, the silent one named');
assert.equal(f.skipped, 'b\ne\n', 'skips in list order');
assert.equal(run([['-', 'a', '-', 'ok']]).failed, '', 'a green run has an empty failed list');

// Usage: no runner, or a bad worker count, is refused.
assert.equal(spawnSync('node', [SCHED, '--workers', '0', '--state', tmp, '--', RUNNER], { input: '' }).status, 2, 'zero workers is refused');
assert.equal(spawnSync('node', [SCHED, '--state', tmp], { input: '' }).status, 2, 'no runner is refused');

fs.rmSync(tmp, { recursive: true, force: true });
console.log('ok check scheduler: 18 assertions');
