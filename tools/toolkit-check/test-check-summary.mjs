// bin/check-lib.sh: the run ends by naming every step that failed, so reading
// the last lines is enough to know what blocked a push. Run by bin/check.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '../../bin/check-lib.sh');
const run = (body) => execFileSync('sh', ['-c', `FAIL=0; . "${LIB}"; ${body}`], { encoding: 'utf8' });

// Two failures far apart, a pass between: the tail names both, in order.
const out = run('step "history lines fit"; bad "CHANGELOG 1.20.0 over 300"; step "a suite"; ok; step "ui-check"; bad "crash"; summary');
const tail = out.trim().split('\n').slice(-3);
assert.equal(tail[0], '== 2 FAILED (detail above each):', 'the summary counts the failures');
assert.equal(tail[1], '  - history lines fit', 'the first failure is named, though it printed first');
assert.equal(tail[2], '  - ui-check', 'the last failure is named');
assert.ok(!/a suite/.test(tail.join('\n')), 'a step that passed is not listed');
assert.ok(out.indexOf('CHANGELOG 1.20.0 over 300') < out.indexOf('== 2 FAILED'), 'the detail stays above the summary');

console.log('ok check summary: 5 assertions');
