// bin/check-lib.sh: the run ends by naming every step that failed, so reading
// the last lines is enough to know what blocked a push. Run by bin/check.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '../../bin/check-lib.sh');
const run = (body, env = {}) => execFileSync('sh', ['-c', `FAIL=0; . "${LIB}"; ${body}`], { encoding: 'utf8', env: { ...process.env, CI: '', ...env } });

// Two failures far apart, a pass between: the tail names both, in order.
const out = run('step "history lines fit"; bad "CHANGELOG 1.20.0 over 300"; step "a suite"; ok; step "ui-check"; bad "crash"; summary');
const tail = out.trim().split('\n').slice(-3);
assert.equal(tail[0], '== 2 FAILED (detail above each):', 'the summary counts the failures');
assert.equal(tail[1], '  - history lines fit', 'the first failure is named, though it printed first');
assert.equal(tail[2], '  - ui-check', 'the last failure is named');
assert.ok(!/a suite/.test(tail.join('\n')), 'a step that passed is not listed');
assert.ok(out.indexOf('CHANGELOG 1.20.0 over 300') < out.indexOf('== 2 FAILED'), 'the detail stays above the summary');

// A suite that could not run (exit 77) is a skip: its step says "skip", never "ok", and the last lines name it.
const skipped = run('step "a suite"; ok; step "browser suite"; skip "skip: no Chrome"; green').trim().split('\n');
assert.match(skipped[1], /^browser suite\s+skip \(\d+s\)$/, 'a skipped step says skip, not ok');
assert.equal(skipped[2], '  skip: no Chrome', 'its reason is shown under it');
assert.equal(skipped.at(-2), 'green, 1 skipped (could not run here):', 'a green run with a skip does not end on a bare "green"');
assert.equal(skipped.at(-1), '  - browser suite', 'the skip is named last');
assert.equal(run('step "a suite"; ok; green').trim().split('\n').at(-1), 'green', 'a run with no skip ends on green');
const both = run('step "x"; skip; step "y"; bad "boom"; summary').trim().split('\n');
assert.ok(both.includes('  - y') && both.includes('  - x') && both.indexOf('  - y') < both.indexOf('  - x'), 'a red run names its skips after its failures');

const ci = run('step "browser suite"; skip "skip: no Chrome"; [ "$FAIL" = 1 ] && summary', { CI: 'true' });
assert.match(ci, /browser suite\s+FAIL/, 'in CI a skip is a failure');
assert.match(ci, /== 1 FAILED/, '…and is counted as one');

console.log('ok check summary: 13 assertions');
